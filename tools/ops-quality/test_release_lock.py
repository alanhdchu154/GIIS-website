from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().parents[1] / "release_lock.py"
SPEC = importlib.util.spec_from_file_location("giis_release_lock", MODULE_PATH)
assert SPEC and SPEC.loader
release_lock = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(release_lock)


class ReleaseLockTest(unittest.TestCase):
    CANDIDATE_SHA256 = "a" * 64

    def make_repo_with_worktree(self, root: Path) -> tuple[Path, Path]:
        repo = root / "repo"
        linked = root / "linked"
        subprocess.run(["git", "init", str(repo)], check=True, capture_output=True)
        subprocess.run(["git", "-C", str(repo), "config", "user.email", "test@example.invalid"], check=True)
        subprocess.run(["git", "-C", str(repo), "config", "user.name", "Release Lock Test"], check=True)
        (repo / "seed.txt").write_text("seed\n")
        subprocess.run(["git", "-C", str(repo), "add", "seed.txt"], check=True)
        subprocess.run(["git", "-C", str(repo), "commit", "-m", "seed"], check=True, capture_output=True)
        subprocess.run(["git", "-C", str(repo), "worktree", "add", "--detach", str(linked)], check=True, capture_output=True)
        return repo, linked

    def test_linked_worktrees_resolve_same_canonical_lock(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo, linked = self.make_repo_with_worktree(Path(tmp))
            self.assertEqual(
                release_lock.canonical_release_lock_path(repo),
                release_lock.canonical_release_lock_path(linked),
            )
            self.assertEqual(
                repo.resolve() / "umi" / ".quality-locks" / "release.lock",
                release_lock.canonical_release_lock_path(linked),
            )

    def test_busy_lock_fails_closed_across_linked_worktrees(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo, linked = self.make_repo_with_worktree(Path(tmp))
            with release_lock.acquire_release_lock(repo, owner="first") as held:
                with self.assertRaises(release_lock.ReleaseLockBusy):
                    release_lock.acquire_release_lock(linked, owner="second")
                if Path("/usr/bin/lockf").exists():
                    legacy = subprocess.run(
                        [
                            "/usr/bin/lockf",
                            "-t",
                            "0",
                            "-k",
                            str(held.path),
                            "/usr/bin/true",
                        ],
                        text=True,
                        capture_output=True,
                        check=False,
                    )
                    self.assertNotEqual(
                        0,
                        legacy.returncode,
                        "closing the rejected second handle must not release the first BSD lock",
                    )

    def test_cli_contention_from_second_worktree_exits_busy(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            repo, linked = self.make_repo_with_worktree(root)
            receipt = root / "review.json"
            receipt.write_text(json.dumps({
                "schema_version": release_lock.REVIEW_SCHEMA_VERSION,
                "verdict": "ACCEPT",
                "review_timing": "pre_release",
                "candidate_sha256": self.CANDIDATE_SHA256,
                "producer": "producer-a",
                "reviewer": "reviewer-b",
                "reviewer_execution_id": "review-run-1",
                "reviewed_at": "2026-10-04T20:00:00Z",
            }))
            with release_lock.acquire_release_lock(repo, owner="first"):
                result = subprocess.run(
                    [
                        sys.executable,
                        str(MODULE_PATH),
                        "--repo",
                        str(linked),
                        "--owner",
                        "second",
                        "run",
                        "--review-receipt",
                        str(receipt),
                        "--candidate-sha256",
                        self.CANDIDATE_SHA256,
                        "--",
                        sys.executable,
                        "-c",
                        "raise SystemExit(99)",
                    ],
                    text=True,
                    capture_output=True,
                    check=False,
                )
            self.assertEqual(release_lock.BUSY_EXIT_CODE, result.returncode)
            self.assertIn("shared release lock is busy", result.stderr)
            self.assertNotIn(str(repo), result.stderr)
            self.assertNotIn(str(linked), result.stderr)

    def test_exception_releases_lock(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo, linked = self.make_repo_with_worktree(Path(tmp))
            with self.assertRaisesRegex(RuntimeError, "seeded failure"):
                with release_lock.acquire_release_lock(repo, owner="failing"):
                    raise RuntimeError("seeded failure")
            with release_lock.acquire_release_lock(linked, owner="recovery") as held:
                self.assertEqual(held.path, release_lock.canonical_release_lock_path(repo))

    def test_symlink_lock_fails_closed_without_touching_target(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo, _linked = self.make_repo_with_worktree(Path(tmp))
            lock_path = release_lock.canonical_release_lock_path(repo)
            lock_path.parent.mkdir(parents=True)
            sentinel = Path(tmp) / "sentinel.txt"
            sentinel.write_text("do not touch\n")
            lock_path.symlink_to(sentinel)
            with self.assertRaisesRegex(release_lock.ReleaseLockError, "unsafe or unavailable"):
                release_lock.acquire_release_lock(repo, owner="attacker-test")
            self.assertEqual("do not touch\n", sentinel.read_text())

    def test_symlink_parent_fails_closed_without_touching_target(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo, _linked = self.make_repo_with_worktree(Path(tmp))
            external = Path(tmp) / "external"
            external.mkdir()
            (repo / "umi").symlink_to(external, target_is_directory=True)
            with self.assertRaisesRegex(release_lock.ReleaseLockError, "unsafe or unavailable"):
                release_lock.acquire_release_lock(repo, owner="attacker-test")
            self.assertEqual([], list(external.iterdir()))

    def test_metadata_initialization_failure_unlocks_and_closes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo, linked = self.make_repo_with_worktree(Path(tmp))
            with patch.object(release_lock.os, "fsync", side_effect=OSError("seeded fsync failure")):
                with self.assertRaisesRegex(release_lock.ReleaseLockError, "initialize"):
                    release_lock.acquire_release_lock(repo, owner="failing")
            with release_lock.acquire_release_lock(linked, owner="recovery"):
                pass

    @unittest.skipUnless(Path("/usr/bin/lockf").exists(), "macOS lockf is unavailable")
    def test_python_lock_blocks_existing_macos_lockf_protocol(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo, _linked = self.make_repo_with_worktree(Path(tmp))
            with release_lock.acquire_release_lock(repo, owner="python-holder") as held:
                result = subprocess.run(
                    ["/usr/bin/lockf", "-t", "0", "-k", str(held.path), "/usr/bin/true"],
                    text=True,
                    capture_output=True,
                    check=False,
                )
            self.assertNotEqual(0, result.returncode)

    @unittest.skipUnless(Path("/usr/bin/lockf").exists(), "macOS lockf is unavailable")
    def test_existing_macos_lockf_protocol_blocks_python_lock(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo, linked = self.make_repo_with_worktree(Path(tmp))
            lock_path = release_lock.canonical_release_lock_path(repo)
            lock_path.parent.mkdir(parents=True)
            lock_path.touch()
            process = subprocess.Popen(
                [
                    "/usr/bin/lockf",
                    "-k",
                    str(lock_path),
                    sys.executable,
                    "-c",
                    "import time; print('ready', flush=True); time.sleep(30)",
                ],
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
            )
            try:
                assert process.stdout is not None
                self.assertEqual("ready", process.stdout.readline().strip())
                process.stdout.close()
                with self.assertRaises(release_lock.ReleaseLockBusy):
                    release_lock.acquire_release_lock(linked, owner="python-contender")
            finally:
                process.terminate()
                process.wait(timeout=5)

    def test_generic_cli_requires_pre_release_independent_review(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            repo, _linked = self.make_repo_with_worktree(root)
            receipt = root / "review.json"
            receipt.write_text(json.dumps({
                "schema_version": release_lock.REVIEW_SCHEMA_VERSION,
                "verdict": "ACCEPT",
                "review_timing": "post_release",
                "candidate_sha256": self.CANDIDATE_SHA256,
                "producer": "producer-a",
                "reviewer": "reviewer-b",
                "reviewer_execution_id": "review-run-1",
                "reviewed_at": "2026-10-04T20:00:00Z",
            }))
            with self.assertRaisesRegex(release_lock.ReleaseLockError, "review_timing"):
                release_lock.validate_review_receipt(receipt, self.CANDIDATE_SHA256)
            payload = json.loads(receipt.read_text())
            payload["review_timing"] = "pre_release"
            payload["reviewer"] = payload["producer"]
            receipt.write_text(json.dumps(payload))
            with self.assertRaisesRegex(release_lock.ReleaseLockError, "distinct"):
                release_lock.validate_review_receipt(receipt, self.CANDIDATE_SHA256)
            payload["reviewer"] = "reviewer-b"
            receipt.write_text(json.dumps(payload))
            self.assertEqual(
                "ACCEPT",
                release_lock.validate_review_receipt(
                    receipt,
                    self.CANDIDATE_SHA256,
                )["verdict"],
            )


if __name__ == "__main__":
    unittest.main()
