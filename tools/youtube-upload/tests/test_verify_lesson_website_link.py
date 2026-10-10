import json
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "tools" / "youtube-upload" / "verify_lesson_website_link.js"


class VerifyLessonWebsiteLinkTest(unittest.TestCase):
    def test_course_summary_matching_does_not_confuse_algebra_i_and_ii(self):
        javascript = f"""
const {{ courseNameFromSummary }} = require({json.dumps(str(SCRIPT))});
const values = [
  courseNameFromSummary('Algebra I (14 lessons)'),
  courseNameFromSummary('Algebra II (14 lessons)'),
  courseNameFromSummary('English I (1 lesson)'),
];
process.stdout.write(JSON.stringify(values));
"""
        completed = subprocess.run(
            ["node", "-e", javascript],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        self.assertEqual(json.loads(completed.stdout), ["Algebra I", "Algebra II", "English I"])

    def test_embed_url_requires_exact_origin_and_video_path(self):
        javascript = f"""
const {{ isExactYouTubeEmbedUrl }} = require({json.dumps(str(SCRIPT))});
const id = 'abcdefghijk';
const values = [
  isExactYouTubeEmbedUrl('https://www.youtube.com/embed/abcdefghijk', id),
  isExactYouTubeEmbedUrl('https://www.youtube.com/embed/abcdefghijk?rel=0', id),
  isExactYouTubeEmbedUrl('https://www.youtube.com/embed/abcdefghijk-extra', id),
  isExactYouTubeEmbedUrl('https://www.youtube.com.evil.test/embed/abcdefghijk', id),
  isExactYouTubeEmbedUrl('not a url', id),
];
process.stdout.write(JSON.stringify(values));
"""
        completed = subprocess.run(
            ["node", "-e", javascript], cwd=ROOT, check=True,
            capture_output=True, text=True,
        )
        self.assertEqual(json.loads(completed.stdout), [True, True, False, False, False])


if __name__ == "__main__":
    unittest.main()
