from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


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

    def test_parse_title_accepts_number_without_module_word(self) -> None:
        self.assertEqual(
            sync_channel.parse_title("Biology Advanced — 14: Conservation Biology"),
            ("Biology Advanced", 14, "Conservation Biology"),
        )

    def test_parse_title_accepts_number_without_title(self) -> None:
        self.assertEqual(
            sync_channel.parse_title("Physics - Mechanics — 14"),
            ("Physics - Mechanics", 14, ""),
        )

    def test_parse_title_preserves_course_names_with_single_hyphen(self) -> None:
        self.assertEqual(
            sync_channel.parse_title("English IV - Writing & Communication — Module 13 — Editing & Publishing"),
            ("English IV - Writing & Communication", 13, "Editing & Publishing"),
        )

    def test_lesson_key_handles_numeric_module_field(self) -> None:
        self.assertEqual(
            sync_channel.lesson_key_from_script({"course": "Course", "module": 3}),
            ("Course", 3),
        )

    def test_lesson_key_handles_number_prefix_without_module_word(self) -> None:
        self.assertEqual(
            sync_channel.lesson_key_from_script({"course": "Course", "module": "5: Title"}),
            ("Course", 5),
        )

    def test_script_module_title_falls_back_to_course_name_lookup(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            course_dir = repo / "server" / "prisma" / "courses" / "science"
            course_dir.mkdir(parents=True)
            (course_dir / "physics-mechanics.json").write_text(
                '{"name":"Physics - Mechanics","modules":[{"order":14,"title":"Waves & Sound Basics"}]}'
            )
            with patch.object(sync_channel, "REPO", repo):
                self.assertEqual(
                    sync_channel.script_module_title({"course": "Physics - Mechanics", "module": 14}, 14),
                    "Waves & Sound Basics",
                )


if __name__ == "__main__":
    unittest.main()
