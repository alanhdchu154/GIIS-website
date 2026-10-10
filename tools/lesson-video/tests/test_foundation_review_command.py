#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch


MODULE_PATH = Path(__file__).resolve().parents[1] / "foundation_daily_orchestrator.py"


def load_module():
    spec = importlib.util.spec_from_file_location("foundation_daily_orchestrator_tested", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {MODULE_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class FoundationReviewCommandTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.orchestrator = load_module()

    def test_command_binds_explicit_candidate_mp4(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            folder = root / "teaching-videos" / "sample-lesson"
            folder.mkdir(parents=True)
            canonical = folder / "sample_lesson.mp4"
            canonical.write_bytes(b"candidate")
            args = SimpleNamespace(
                review_provider="codex",
                review_model="gpt-5.6-sol",
                review_reasoning_effort="high",
                review_timeout_seconds=240,
                review_budget_usd=None,
            )
            with patch.object(self.orchestrator, "ROOT", root), patch.object(
                self.orchestrator, "valid_mp4", return_value=True
            ):
                command, reason = self.orchestrator.independent_review_command(args, folder)
            self.assertIsNone(reason)
            self.assertIsNotNone(command)
            self.assertEqual("sample_lesson.mp4", command[command.index("--mp4") + 1])
            self.assertEqual("codex", command[command.index("--provider") + 1])
            self.assertEqual("gpt-5.6-sol", command[command.index("--model") + 1])
            self.assertEqual("high", command[command.index("--reasoning-effort") + 1])
            self.assertNotIn("--budget-usd", command)

    def test_ambiguous_mp4s_hold_before_reviewer_launch(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            folder = root / "teaching-videos" / "sample-lesson"
            folder.mkdir(parents=True)
            (folder / "a.mp4").write_bytes(b"a")
            (folder / "b.mp4").write_bytes(b"b")
            args = SimpleNamespace(
                review_provider="codex",
                review_model="gpt-5.6-sol",
                review_reasoning_effort="high",
                review_timeout_seconds=240,
                review_budget_usd=None,
            )
            with patch.object(self.orchestrator, "ROOT", root):
                command, reason = self.orchestrator.independent_review_command(args, folder)
            self.assertIsNone(command)
            self.assertEqual("missing_or_ambiguous_review_candidate_mp4", reason)

    def test_local_audio_review_runs_before_full_release_reviewer(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            folder = root / "teaching-videos" / "sample-lesson"
            folder.mkdir(parents=True)
            canonical = folder / "sample_lesson.mp4"
            canonical.write_bytes(b"candidate")
            with patch.object(self.orchestrator, "ROOT", root), patch.object(
                self.orchestrator, "valid_mp4", return_value=True
            ), patch.object(self.orchestrator, "run_checked", return_value=0) as run_checked:
                rc, reason = self.orchestrator.run_local_audio_review(folder)
            self.assertEqual(0, rc)
            self.assertIsNone(reason)
            command = run_checked.call_args.args[0]
            self.assertIn("local_audio_review.py", str(command[1]))
            self.assertEqual("sample_lesson.mp4", command[command.index("--mp4") + 1])

    def test_claude_reviewer_has_only_read_tools_and_wrapper_delivery(self):
        path = MODULE_PATH.parent / "cc_independent_video_reviewer.py"
        spec = importlib.util.spec_from_file_location("reviewer_wrapper_tested", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        command = module.claude_review_command("claude", "opus")
        self.assertEqual("dontAsk", command[command.index("--permission-mode") + 1])
        self.assertEqual("Read,Grep,Glob", command[command.index("--tools") + 1])
        self.assertEqual("Read,Grep,Glob", command[command.index("--allowedTools") + 1])
        self.assertNotIn("bypassPermissions", command)
        self.assertIn("--strict-mcp-config", command)
        for provider in ("claude", "codex"):
            prompt = module.build_prompt(Path("/lesson"), Path("/packet"), "abc", "full-release", provider)
            self.assertIn("Do not write any files", prompt)
            self.assertIn("do not write files", module.build_resume_prompt(Path("/lesson"), Path("/packet"), "abc", provider))

    def test_claude_json_stdout_is_written_by_wrapper_without_reviewer_write(self):
        path = MODULE_PATH.parent / "cc_independent_video_reviewer.py"
        spec = importlib.util.spec_from_file_location("reviewer_stdout_tested", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            packet = root / module.PACKET_NAME
            packet.write_text("{}")
            result = {"review_id": "review-1", "verdict": "HOLD", "reviewer": {}}
            events = [
                {"type": "system", "subtype": "init", "model": "observed-model", "session_id": "session-1"},
                {"type": "result", "subtype": "success", "is_error": False, "result": json.dumps(result)},
            ]
            proc = MagicMock()
            proc.stdin = io.StringIO()
            proc.stdout = io.StringIO("\n".join(json.dumps(event) for event in events) + "\n")
            proc.poll.return_value = None
            proc.wait.return_value = 0
            selector = MagicMock()
            selector.select.return_value = [object()]
            with patch.object(module.sys, "argv", [
                "reviewer", str(root), "--mp4", "fixture.mp4", "--provider", "claude",
                "--review-scope", "content-source",
            ]), patch.object(
                module, "LOG_DIR", root / "logs"
            ), patch.object(module, "write_review_packet", return_value=packet), patch.object(
                module.shutil, "which", return_value="/fake/claude"
            ), patch.object(module.subprocess, "Popen", return_value=proc), patch.object(
                module.selectors, "DefaultSelector", return_value=selector
            ), patch.object(module, "validate_review_evidence", return_value={"valid": True, "verdict": "HOLD"}):
                self.assertEqual(0, module.main())
            response = json.loads((root / module.RESPONSE_NAME).read_text())
            self.assertEqual("HOLD", response["verdict"])
            self.assertEqual("observed-model", response["reviewer"]["observed_model"])
            execution = json.loads((root / module.EXECUTION_NAME).read_text())
            self.assertEqual("claude-code", execution["provider"])
            self.assertEqual("session-1", execution["session_id"])

    def test_claude_full_release_is_rejected_before_packet_or_process(self):
        path = MODULE_PATH.parent / "cc_independent_video_reviewer.py"
        spec = importlib.util.spec_from_file_location("reviewer_full_release_rejected", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as tmp, patch.object(
            module.sys, "argv", [
                "reviewer", tmp, "--mp4", "fixture.mp4", "--provider", "claude",
                "--review-scope", "full-release",
            ],
        ), patch.object(module, "write_review_packet") as write_packet:
            with self.assertRaisesRegex(SystemExit, "lacks the shell/image tools"):
                module.main()
            write_packet.assert_not_called()

    def shell_args(self, root, env_overrides=None, cli=()):
        """Execute the actual shell wrapper; only its Python executable is stubbed."""
        capture = root / "argv.json"
        stub = root / "python-stub"
        stub.write_text(
            f"#!{sys.executable}\n"
            "import json, os, sys\n"
            "if sys.argv[1:] != ['-']:\n"
            "    with open(os.environ['GIIS_TEST_ARGV'], 'w') as handle:\n"
            "        json.dump(sys.argv[1:], handle)\n"
        )
        stub.chmod(0o755)
        env = {key: value for key, value in os.environ.items() if not key.startswith("FOUNDATION_")}
        env.update(GIIS_PYTHON=str(stub), FOUNDATION_LOG=str(root / "daily.log"), GIIS_TEST_ARGV=str(capture))
        env.update(env_overrides or {})
        result = subprocess.run(["bash", str(MODULE_PATH.with_name("foundation_daily.sh")), *cli],
                                env=env, capture_output=True, text=True)
        self.assertEqual(0, result.returncode, result.stderr)
        return json.loads(capture.read_text())

    def test_actual_shell_defaults_reach_codex_reviewer_without_budget(self):
        # Even a stale Claude budget in the environment must not leak to Codex.
        for overrides in ({}, {"FOUNDATION_REVIEW_BUDGET_USD": "3"}):
            with self.subTest(overrides=overrides), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                argv = self.shell_args(root, overrides)
                self.assertNotIn("--review-budget-usd", argv)
                with patch.dict(os.environ, {}, clear=True), patch.object(sys, "argv", argv), patch.object(
                    self.orchestrator, "orchestrate", return_value=0
                ) as orchestrate, patch.object(self.orchestrator.os, "chdir"):
                    self.assertEqual(0, self.orchestrator.main())
                args = orchestrate.call_args.args[0]
                self.assertEqual(("codex", "gpt-5.6-sol", "high", 1200),
                    (args.review_provider, args.review_model, args.review_reasoning_effort, args.review_timeout_seconds))
                folder = root / "sample"
                folder.mkdir()
                (folder / "sample.mp4").write_bytes(b"fixture")
                with patch.object(self.orchestrator, "ROOT", root), patch.object(
                    self.orchestrator, "valid_mp4", return_value=True
                ):
                    command, reason = self.orchestrator.independent_review_command(args, folder)
                self.assertIsNone(reason)
                self.assertNotIn("--budget-usd", command)
                self.assertEqual("gpt-5.6-sol", command[command.index("--model") + 1])
                self.assertEqual("high", command[command.index("--reasoning-effort") + 1])

    def test_shell_claude_opt_in_and_codex_override_rejects_budget_early(self):
        with tempfile.TemporaryDirectory() as tmp:
            argv = self.shell_args(Path(tmp), {"FOUNDATION_REVIEW_PROVIDER": "claude", "FOUNDATION_REVIEW_BUDGET_USD": "3"})
            with patch.dict(os.environ, {}, clear=True), patch.object(sys, "argv", argv), patch.object(
                self.orchestrator, "orchestrate", return_value=0
            ) as orchestrate, patch.object(self.orchestrator.os, "chdir"):
                self.assertEqual(0, self.orchestrator.main())
            args = orchestrate.call_args.args[0]
            self.assertEqual(("claude", "opus", 3), (args.review_provider, args.review_model, args.review_budget_usd))
            with patch.object(sys, "argv", [*argv, "--review-provider", "codex"]), patch.object(
                self.orchestrator, "orchestrate"
            ) as orchestrate:
                with self.assertRaises(SystemExit) as raised:
                    self.orchestrator.main()
                self.assertEqual(2, raised.exception.code)
            orchestrate.assert_not_called()

    def test_command_never_forwards_budget_to_codex(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp) / "sample"
            folder.mkdir()
            (folder / "sample.mp4").write_bytes(b"fixture")
            for provider in ("codex", "claude"):
                args = SimpleNamespace(review_provider=provider, review_model="model", review_timeout_seconds=1200,
                                       review_reasoning_effort="high", review_budget_usd=3)
                with patch.object(self.orchestrator, "ROOT", Path(tmp)), patch.object(
                    self.orchestrator, "valid_mp4", return_value=True
                ):
                    command, reason = self.orchestrator.independent_review_command(args, folder)
                self.assertIsNone(reason)
                self.assertEqual(provider == "claude", "--budget-usd" in command)

    def test_gate_ready_rejects_legacy_review_flags_without_version_bound_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "lesson.mp4").write_bytes(b"fixture")
            (folder / "contact-sheet.jpg").write_bytes(b"fixture")
            audit = {
                "verdict": "pass", "quality_score": 100,
                "assets": {
                    "has_mp4": True, "has_transcript": True,
                    "style_manifest": {"theme_name": "fixture"},
                },
                "learning_checks": {"count": 3},
                "reviewers": {
                    "protocol_v2": {"present": False, "valid": False},
                    "local_audio_v1": {"present": False, "valid": False},
                    "has_phd_level": True,
                    "has_adversarial_student": True,
                    "has_citation_checker": True,
                    "has_expert_lens_alignment": True,
                    "has_independent_second_pass": True,
                    "has_source_alignment": True,
                },
            }
            with patch.object(self.orchestrator, "audit_lesson", return_value=audit), patch.object(
                self.orchestrator, "valid_mp4", return_value=True,
            ):
                ready, _audit, reasons = self.orchestrator.gate_ready(folder)
        self.assertFalse(ready)
        self.assertIn("missing version-bound review protocol v2", reasons)

    def test_append_approval_rejects_invalid_new_rows_before_write(self):
        with patch.object(self.orchestrator, "read_json") as read, patch.object(
            self.orchestrator, "write_json",
        ) as write:
            with self.assertRaisesRegex(ValueError, "structurally invalid approval"):
                self.orchestrator.append_approval([{"slug": "legacy-only"}])
        read.assert_not_called()
        write.assert_not_called()


if __name__ == "__main__":
    unittest.main()
