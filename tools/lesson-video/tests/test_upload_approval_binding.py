#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().parents[2] / "youtube-upload" / "approval_gate.py"
UPLOAD_SCRIPT = Path(__file__).resolve().parents[2] / "youtube-upload" / "upload_lesson.py"


def load_module():
    spec = importlib.util.spec_from_file_location("upload_approval_gate_tested", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {MODULE_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class UploadApprovalBindingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.approval = load_module()

    def _fixture(self, root: Path):
        lesson = root / "teaching-videos" / "sample"
        lesson.mkdir(parents=True)
        candidate = lesson / "current.mp4"
        candidate.write_bytes(b"current candidate")
        row = {
            "slug": "sample",
            "path": "teaching-videos/sample",
            "quality_score": 100,
            "verdict": "pass",
            "approved_by": "foundation_daily_orchestrator",
            "approved_at": "2026-09-08T00:00:00Z",
            "review_id": "vr2-example",
            "review_schema_version": self.approval.SCHEMA_VERSION,
            "review_packet_sha256": "packet-sha",
            "candidate_mp4": str(candidate),
            "candidate_mp4_sha256": self.approval.sha256_file(candidate),
            "local_audio_schema_version": self.approval.LOCAL_AUDIO_SCHEMA_VERSION,
            "local_audio_receipt_sha256": "audio-receipt-sha",
            "local_audio_model_sha256": "audio-model-sha",
        }
        evidence = {
            "valid": True,
            "verdict": "PASS",
            "review_id": "vr2-example",
            "packet_sha256": "packet-sha",
            "candidate_mp4": str(candidate),
        }
        audio = {
            "valid": True,
            "status": "PASS",
            "receipt_sha256": "audio-receipt-sha",
            "model_sha256": "audio-model-sha",
        }
        return lesson, candidate, row, evidence, audio

    def test_exact_version_bound_candidate_is_returned(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _lesson, candidate, row, evidence, audio = self._fixture(root)
            with patch.object(self.approval, "validate_review_evidence", return_value=evidence), patch.object(
                self.approval, "validate_local_audio_review", return_value=audio
            ):
                selected = self.approval.approved_candidate_mp4(row, root=root)
            self.assertEqual(candidate.resolve(), selected)

    def test_candidate_hash_drift_invalidates_approval(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _lesson, candidate, row, evidence, audio = self._fixture(root)
            candidate.write_bytes(b"changed")
            with patch.object(self.approval, "validate_review_evidence", return_value=evidence), patch.object(
                self.approval, "validate_local_audio_review", return_value=audio
            ):
                self.assertIsNone(self.approval.approved_candidate_mp4(row, root=root))

    def test_review_hold_invalidates_upload_approval(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _lesson, _candidate, row, evidence, audio = self._fixture(root)
            evidence["verdict"] = "HOLD"
            with patch.object(self.approval, "validate_review_evidence", return_value=evidence), patch.object(
                self.approval, "validate_local_audio_review", return_value=audio
            ):
                self.assertIsNone(self.approval.approved_candidate_mp4(row, root=root))

    def test_audio_receipt_hash_drift_invalidates_upload_approval(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _lesson, _candidate, row, evidence, audio = self._fixture(root)
            audio["receipt_sha256"] = "changed-audio-receipt"
            with patch.object(self.approval, "validate_review_evidence", return_value=evidence), patch.object(
                self.approval, "validate_local_audio_review", return_value=audio
            ):
                self.assertIsNone(self.approval.approved_candidate_mp4(row, root=root))

    def test_legacy_slug_only_row_is_rejected(self) -> None:
        self.assertFalse(self.approval.is_clean_approval_row({
            "slug": "sample",
            "path": "teaching-videos/sample",
            "quality_score": 100,
            "verdict": "pass",
            "approved_by": "legacy",
            "approved_at": "2026-09-08T00:00:00Z",
        }))

    def test_same_slug_different_lesson_folder_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _lesson, _candidate, row, evidence, audio = self._fixture(root)
            other = root / "sandbox" / "sample"
            other.mkdir(parents=True)
            with patch.object(self.approval, "validate_review_evidence", return_value=evidence), patch.object(
                self.approval, "validate_local_audio_review", return_value=audio
            ):
                selected = self.approval.approved_candidate_mp4(
                    row,
                    root=root,
                    lesson_dir=other,
                )
            self.assertIsNone(selected)

    def test_quality_sandbox_upload_requires_replacement_mode(self) -> None:
        root = Path(__file__).resolve().parents[3]
        lesson = root / "teaching-videos" / ".quality-sandbox" / "missing"
        approval = root / "teaching-videos" / "_audit" / "replacements" / "missing" / "approval.json"
        result = subprocess.run(
            [sys.executable, str(UPLOAD_SCRIPT), str(lesson), "--approval-file", str(approval)],
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(2, result.returncode)
        self.assertIn("require --replacement", result.stderr)

    def test_replacement_mode_requires_both_scoped_paths(self) -> None:
        root = Path(__file__).resolve().parents[3]
        lesson = root / "teaching-videos" / ".quality-sandbox" / "missing"
        result = subprocess.run(
            [sys.executable, str(UPLOAD_SCRIPT), str(lesson), "--replacement"],
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(2, result.returncode)
        self.assertIn("requires both", result.stderr)


if __name__ == "__main__":
    unittest.main()
