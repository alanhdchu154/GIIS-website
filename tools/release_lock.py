#!/usr/bin/env python3
"""Canonical GIIS release lock shared by every linked Git worktree.

The Git common directory identifies the canonical checkout; the lock then uses
the established ``umi/.quality-locks/release.lock`` inode in that checkout.
Callers must keep the returned handle alive for the entire release-critical
section.  Python ``fcntl.flock`` uses the same BSD locking mechanism as the
existing macOS ``lockf`` command; focused subprocess tests guard that bridge.
The CLI additionally requires an exact, pre-release independent-review receipt
before it will run an arbitrary release command.
"""
from __future__ import annotations

import argparse
import errno
import fcntl
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence


LOCK_RELATIVE_PATH = Path("umi") / ".quality-locks" / "release.lock"
REVIEW_SCHEMA_VERSION = "giis.release-review.v1"
BUSY_EXIT_CODE = 75


class ReleaseLockError(RuntimeError):
    pass


class ReleaseLockBusy(ReleaseLockError):
    pass


def _git_common_dir(repo_root: Path) -> Path:
    root = repo_root.resolve()
    result = subprocess.run(
        ["git", "-C", str(root), "rev-parse", "--git-common-dir"],
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0 or not result.stdout.strip():
        detail = result.stderr.strip() or "git common directory is unavailable"
        raise ReleaseLockError(f"cannot resolve shared release lock: {detail}")
    common = Path(result.stdout.strip())
    if not common.is_absolute():
        common = root / common
    return common.resolve()


def _canonical_repo_root(repo_root: Path) -> Path:
    """Resolve the primary checkout from the shared Git directory."""
    common = _git_common_dir(repo_root)
    if common.name != ".git" or not common.is_dir():
        raise ReleaseLockError(
            "cannot resolve canonical checkout from a nonstandard Git common directory"
        )
    return common.parent


def canonical_release_lock_path(repo_root: Path) -> Path:
    """Return one lock path for the repository and all linked worktrees."""
    return _canonical_repo_root(repo_root) / LOCK_RELATIVE_PATH


def _open_canonical_lock(repo_root: Path) -> tuple[Path, Any]:
    """Open the established lock path without following directory symlinks."""
    canonical_root = _canonical_repo_root(repo_root)
    nofollow = getattr(os, "O_NOFOLLOW", None)
    if nofollow is None:
        raise ReleaseLockError("safe no-follow release lock opening is unavailable")
    current_fd = os.open(canonical_root, os.O_RDONLY | os.O_DIRECTORY)
    lock_fd: int | None = None
    try:
        for index, component in enumerate(LOCK_RELATIVE_PATH.parent.parts):
            try:
                os.mkdir(component, mode=0o700 if index else 0o755, dir_fd=current_fd)
            except FileExistsError:
                pass
            next_fd = os.open(
                component,
                os.O_RDONLY | os.O_DIRECTORY | nofollow,
                dir_fd=current_fd,
            )
            os.close(current_fd)
            current_fd = next_fd
        lock_fd = os.open(
            LOCK_RELATIVE_PATH.name,
            os.O_RDWR | os.O_CREAT | nofollow,
            0o600,
            dir_fd=current_fd,
        )
        handle = os.fdopen(lock_fd, "r+", encoding="utf-8")
        lock_fd = None
        return canonical_root / LOCK_RELATIVE_PATH, handle
    except OSError as exc:
        raise ReleaseLockError("canonical release lock path is unsafe or unavailable") from exc
    finally:
        if lock_fd is not None:
            os.close(lock_fd)
        os.close(current_fd)


class HeldReleaseLock:
    """An acquired non-blocking BSD lock tied to this handle."""

    def __init__(self, path: Path, handle: Any) -> None:
        self.path = path
        self._handle = handle

    def close(self) -> None:
        if self._handle is None:
            return
        handle, self._handle = self._handle, None
        try:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
        finally:
            handle.close()

    def __enter__(self) -> "HeldReleaseLock":
        return self

    def __exit__(self, _exc_type: Any, _exc: Any, _tb: Any) -> None:
        self.close()

    def __del__(self) -> None:
        self.close()


def acquire_release_lock(
    repo_root: Path,
    *,
    owner: str,
) -> HeldReleaseLock:
    """Acquire the canonical release lock without waiting; busy fails closed."""
    if not owner.strip():
        raise ReleaseLockError("release lock owner is required")
    path, handle = _open_canonical_lock(repo_root)
    try:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError as exc:
        handle.seek(0)
        holder = handle.read().strip()
        handle.close()
        if exc.errno not in {errno.EACCES, errno.EAGAIN}:
            raise ReleaseLockError("cannot acquire shared release lock") from exc
        try:
            payload = json.loads(holder) if holder else {}
        except json.JSONDecodeError:
            payload = {}
        details = ", ".join(
            f"{key}={payload[key]}"
            for key in ("owner", "pid", "acquired_at")
            if payload.get(key) is not None
        )
        suffix = f" ({details})" if details else ""
        raise ReleaseLockBusy(f"shared release lock is busy{suffix}") from exc

    metadata = {
        "schema_version": "giis.release-lock-holder.v1",
        "owner": owner.strip(),
        "pid": os.getpid(),
        "acquired_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    try:
        handle.seek(0)
        handle.truncate()
        json.dump(metadata, handle, sort_keys=True)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    except Exception as exc:
        try:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
        finally:
            handle.close()
        raise ReleaseLockError("cannot initialize shared release lock metadata") from exc
    return HeldReleaseLock(path, handle)


def validate_review_receipt(path: Path, expected_candidate_sha256: str) -> dict[str, Any]:
    """Validate the minimum receipt required by the generic release CLI."""
    if not re.fullmatch(r"[0-9a-f]{64}", expected_candidate_sha256):
        raise ReleaseLockError("expected candidate SHA-256 must be 64 lowercase hex characters")
    try:
        payload = json.loads(path.read_text())
    except Exception as exc:
        raise ReleaseLockError(f"cannot read independent review receipt: {path}: {exc}") from exc
    required = {
        "schema_version": REVIEW_SCHEMA_VERSION,
        "verdict": "ACCEPT",
        "review_timing": "pre_release",
        "candidate_sha256": expected_candidate_sha256,
    }
    for key, expected in required.items():
        if payload.get(key) != expected:
            raise ReleaseLockError(f"review receipt {key} must equal {expected!r}")
    producer = str(payload.get("producer") or "").strip()
    reviewer = str(payload.get("reviewer") or "").strip()
    if not producer or not reviewer or producer == reviewer:
        raise ReleaseLockError("review receipt must identify distinct producer and reviewer")
    if not str(payload.get("reviewer_execution_id") or "").strip():
        raise ReleaseLockError("review receipt must include reviewer_execution_id provenance")
    if not str(payload.get("reviewed_at") or "").strip():
        raise ReleaseLockError("review receipt must include reviewed_at")
    return payload


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--owner", default="")
    subparsers = parser.add_subparsers(dest="action", required=True)
    subparsers.add_parser("path", help="print the canonical shared lock path")
    run_parser = subparsers.add_parser("run", help="run one reviewed command while holding the lock")
    run_parser.add_argument("--review-receipt", type=Path, required=True)
    run_parser.add_argument("--candidate-sha256", required=True)
    run_parser.add_argument("command", nargs=argparse.REMAINDER)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    repo_root = args.repo.resolve()
    if args.action == "path":
        print(canonical_release_lock_path(repo_root))
        return 0
    command = list(args.command)
    if command and command[0] == "--":
        command = command[1:]
    if not command:
        raise ReleaseLockError("release command is required after --")
    validate_review_receipt(args.review_receipt.resolve(), args.candidate_sha256)
    with acquire_release_lock(repo_root, owner=args.owner):
        return subprocess.run(command, cwd=repo_root, check=False).returncode


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ReleaseLockBusy as exc:
        print(f"[HOLD] {exc}", file=sys.stderr)
        raise SystemExit(BUSY_EXIT_CODE)
    except ReleaseLockError as exc:
        print(f"[HOLD] {exc}", file=sys.stderr)
        raise SystemExit(2)
