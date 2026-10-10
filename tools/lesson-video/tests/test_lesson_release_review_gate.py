#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "lesson_release_gate.py"


def load_module():
    spec = importlib.util.spec_from_file_location("lesson_release_gate_tested", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {MODULE_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class LessonReleaseReviewGateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.gate = load_module()

    def test_valid_v2_pass_satisfies_reviewer_gate_without_fake_phd_flag(self) -> None:
        audit = {"reviewers": {
            "protocol_v2": {"present": True, "valid": True, "verdict": "PASS"},
            "local_audio_v1": {"present": True, "valid": True, "status": "PASS"},
        }}
        self.assertEqual([], self.gate.reviewer_gate(audit, require_reviewers=True))

    def test_minor_finding_blocks_even_a_claimed_valid_pass(self):
        audit = {"reviewers": {
            "protocol_v2": {"present": True, "valid": True, "verdict": "PASS", "findings": [{"severity": "minor"}]},
            "local_audio_v1": {"present": True, "valid": True, "status": "PASS"},
        }}
        self.assertIn("independent review minor findings require revision", self.gate.reviewer_gate(audit, require_reviewers=True))

    def test_valid_v2_hold_is_not_release_ready(self) -> None:
        audit = {"reviewers": {
            "protocol_v2": {"present": True, "valid": True, "verdict": "HOLD"},
            "local_audio_v1": {"present": True, "valid": True, "status": "PASS"},
        }}
        self.assertEqual(
            ["validated review protocol verdict is HOLD"],
            self.gate.reviewer_gate(audit, require_reviewers=True),
        )

    def test_invalid_v2_cannot_fall_back_to_name_based_legacy_flags(self) -> None:
        audit = {"reviewers": {
            "protocol_v2": {"present": True, "valid": False, "errors": ["stale script"]},
            "local_audio_v1": {"present": True, "valid": True, "status": "PASS"},
            "has_phd_level": True,
            "has_adversarial_student": True,
            "has_citation_checker": True,
            "has_expert_lens_alignment": True,
            "has_independent_second_pass": True,
            "has_source_alignment": True,
        }}
        self.assertEqual(
            ["invalid review protocol v2: stale script"],
            self.gate.reviewer_gate(audit, require_reviewers=True),
        )

    def test_legacy_gate_remains_fail_closed_when_v2_absent(self) -> None:
        audit = {"reviewers": {"protocol_v2": {"present": False, "valid": False}}}
        reasons = self.gate.reviewer_gate(audit, require_reviewers=True)
        self.assertIn("missing independent second-pass reviewer", reasons)
        self.assertIn("missing source-alignment reviewer", reasons)
        self.assertIn("missing or invalid version-bound local audio review", reasons)

    def test_valid_v2_pass_still_holds_without_audio_pass(self) -> None:
        audit = {"reviewers": {
            "protocol_v2": {"present": True, "valid": True, "verdict": "PASS"},
            "local_audio_v1": {"present": True, "valid": True, "status": "HOLD"},
        }}
        self.assertEqual(
            ["local audio review status is HOLD"],
            self.gate.reviewer_gate(audit, require_reviewers=True),
        )


if __name__ == "__main__":
    unittest.main()
