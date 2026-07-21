from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "sync_channel.py"
SPEC = importlib.util.spec_from_file_location("sync_channel", MODULE_PATH)
assert SPEC and SPEC.loader
sync_channel = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(sync_channel)


class SyncChannelParseTest(unittest.TestCase):
    def test_parse_title_accepts_colon_separator(self) -> None:
        self.assertEqual(
            sync_channel.parse_title("Media & Society — Module 2: Media Literacy"),
            ("Media & Society", 2, "Media Literacy"),
        )

    def test_parse_title_accepts_dash_separator(self) -> None:
        self.assertEqual(
            sync_channel.parse_title("Media & Society — Module 2 — Media Literacy"),
            ("Media & Society", 2, "Media Literacy"),
        )

    def test_parse_title_preserves_course_names_with_single_hyphen(self) -> None:
        self.assertEqual(
            sync_channel.parse_title("English IV - Writing & Communication — Module 13 — Editing & Publishing"),
            ("English IV - Writing & Communication", 13, "Editing & Publishing"),
        )


if __name__ == "__main__":
    unittest.main()
