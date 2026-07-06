#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
MODULE_PATH = ROOT / "tools" / "lesson-video" / "parent_trust_video_audit.py"


def load_module():
    spec = importlib.util.spec_from_file_location("parent_trust_video_audit", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {MODULE_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ParentTrustVideoAuditTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.audit = load_module()

    def test_fixture_policy(self) -> None:
        self.assertEqual([], self.audit.run_fixture_checks())

    def test_fixture_allow_examples_do_not_create_hard_findings(self) -> None:
        fixtures = self.audit.load_json(self.audit.FIXTURE_PATH)
        for entry in fixtures["must_allow"]:
            with self.subTest(entry=entry["label"]):
                hard, _soft, _ignored = self.audit.scan_text_block(
                    f"{entry['context']} {entry['text']}",
                    "fixture",
                    entry["label"],
                )
                self.assertEqual([], hard)

    def test_fixture_block_examples_create_hard_findings(self) -> None:
        fixtures = self.audit.load_json(self.audit.FIXTURE_PATH)
        for entry in fixtures["must_block"]:
            with self.subTest(entry=entry["label"]):
                hard, _soft, _ignored = self.audit.scan_text_block(
                    f"{entry['context']} {entry['text']}",
                    "fixture",
                    entry["label"],
                )
                self.assertTrue(hard)


if __name__ == "__main__":
    unittest.main()
