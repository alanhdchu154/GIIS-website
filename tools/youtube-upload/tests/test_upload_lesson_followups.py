from __future__ import annotations

import importlib.util
import subprocess
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().parents[1] / "upload_lesson.py"
SPEC = importlib.util.spec_from_file_location("upload_lesson", MODULE_PATH)
assert SPEC and SPEC.loader
upload_lesson = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(upload_lesson)


class UploadLessonFollowupsTest(unittest.TestCase):
    def test_sync_hold_prevents_cleanup(self) -> None:
        here = Path("/repo/tools/youtube-upload")
        lesson = Path("/repo/teaching-videos/algebra-i-module-1")
        with patch.object(
            upload_lesson.subprocess,
            "run",
            return_value=subprocess.CompletedProcess([], 2),
        ) as run:
            self.assertEqual(
                2,
                upload_lesson.run_post_upload_followups(
                    here,
                    lesson,
                    no_sync=False,
                    no_cleanup=False,
                ),
            )
        run.assert_called_once_with(
            [upload_lesson.sys.executable, str(here / "sync_channel.py"), "--apply"],
            check=False,
        )


if __name__ == "__main__":
    unittest.main()
