from __future__ import annotations

import importlib.util
import tempfile
import json
import subprocess
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

    def test_active_replacement_plan_blocks_broad_sync(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            lessons = Path(tmp)
            plan_dir = lessons / "_audit" / "replacements" / "sample"
            plan_dir.mkdir(parents=True)
            (plan_dir / "replacement-plan.json").write_text(json.dumps({"state": "prepared"}))
            with patch.object(sync_channel, "LESSONS_DIR", lessons):
                self.assertEqual([plan_dir / "replacement-plan.json"], sync_channel.active_replacement_plans())
            (plan_dir / "replacement-plan.json").write_text(json.dumps({"state": "replaced"}))
            with patch.object(sync_channel, "LESSONS_DIR", lessons):
                self.assertEqual([], sync_channel.active_replacement_plans())

    def test_apply_holds_before_youtube_when_replacement_is_active(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            lessons = Path(tmp) / "teaching-videos"
            plan_dir = lessons / "_audit" / "replacements" / "sample"
            plan_dir.mkdir(parents=True)
            (plan_dir / "replacement-plan.json").write_text(json.dumps({"state": "prepared"}))
            with patch.object(sync_channel, "LESSONS_DIR", lessons), patch.object(
                sync_channel, "yt_client"
            ) as yt_client, patch("sys.argv", ["sync_channel.py", "--apply"]):
                self.assertEqual(2, sync_channel.main())
            yt_client.assert_not_called()

    def test_apply_releases_shared_lock_when_sync_raises(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp) / "repo"
            subprocess.run(["git", "init", str(repo)], check=True, capture_output=True)
            with patch.object(sync_channel, "REPO", repo), patch.object(
                sync_channel, "active_replacement_plans", return_value=[]
            ), patch.object(
                sync_channel, "_sync_channel", side_effect=RuntimeError("seeded sync failure")
            ), patch("sys.argv", ["sync_channel.py", "--apply"]):
                with self.assertRaisesRegex(RuntimeError, "seeded sync failure"):
                    sync_channel.main()
            held = sync_channel.acquire_release_lock(
                repo,
                owner="test-recovery",
            )
            held.close()

    def test_dry_run_does_not_acquire_release_lock(self) -> None:
        with patch.object(sync_channel, "_sync_channel", return_value=0), patch.object(
            sync_channel, "acquire_release_lock"
        ) as acquire, patch("sys.argv", ["sync_channel.py"]):
            self.assertEqual(0, sync_channel.main())
        acquire.assert_not_called()

    def test_apply_holds_on_duplicate_group_before_manifest_write(self) -> None:
        videos = [
            {
                "video_id": "new-video",
                "title": "Algebra I — Module 1: Foundations",
                "published_at": "2026-10-07T12:00:00Z",
            },
            {
                "video_id": "old-video",
                "title": "Algebra I — Module 1: Foundations",
                "published_at": "2026-10-06T12:00:00Z",
            },
        ]
        with tempfile.TemporaryDirectory() as tmp:
            manifest = Path(tmp) / "lessons-manifest.json"
            with patch.object(sync_channel, "yt_client", return_value=object()), patch.object(
                sync_channel, "load_course_visibility", return_value={}
            ), patch.object(
                sync_channel, "list_my_videos", return_value=videos
            ), patch.object(sync_channel, "MANIFEST_PATH", manifest):
                self.assertEqual(2, sync_channel._sync_channel(apply=True))
            self.assertFalse(manifest.exists())


if __name__ == "__main__":
    unittest.main()
