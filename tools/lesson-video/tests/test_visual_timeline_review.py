#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from PIL import Image


MODULE_PATH = Path(__file__).resolve().parents[1] / "visual_timeline_review.py"


def load_module():
    spec = importlib.util.spec_from_file_location("visual_timeline_review_tested", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {MODULE_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class VisualTimelineReviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.review = load_module()

    def make_lesson(self, folder: Path, colors: tuple[str, ...]) -> tuple[Path, Path, list[Path]]:
        slides = folder / "slides"
        slides.mkdir()
        concat_lines = []
        paths = []
        for index, color in enumerate(colors, 1):
            path = slides / f"{index:02d}.png"
            Image.new("RGB", (320, 180), color).save(path)
            paths.append(path)
            for _ in range(25):
                concat_lines.extend([f"file '{path}'", "duration 0.04"])
        concat_lines.append(f"file '{paths[-1]}'")
        concat = folder / "slides_concat.txt"
        concat.write_text("\n".join(concat_lines) + "\n", encoding="utf-8")
        mp4 = folder / "lesson.mp4"
        subprocess.run(
            [
                "ffmpeg", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(concat),
                "-pix_fmt", "yuv420p", "-c:v", "libx264", "-y", str(mp4),
            ],
            check=True,
        )
        return mp4, concat, paths

    def test_parse_concat_groups_repeated_frames(self) -> None:
        with tempfile.TemporaryDirectory() as temp_text:
            folder = Path(temp_text)
            first = folder / "first.png"
            second = folder / "second.png"
            Image.new("RGB", (32, 18), "red").save(first)
            Image.new("RGB", (32, 18), "blue").save(second)
            concat = folder / "slides_concat.txt"
            concat.write_text(
                f"file '{first}'\nduration 0.5\n"
                f"file '{first}'\nduration 0.5\n"
                f"file '{second}'\nduration 1.5\n"
                f"file '{second}'\n",
                encoding="utf-8",
            )
            groups = self.review.parse_concat(concat)
            self.assertEqual(2, len(groups))
            self.assertEqual(1.0, groups[0]["duration_seconds"])
            self.assertEqual(0.5, groups[0]["sample_seconds"])
            self.assertEqual(2.5, groups[1]["end_seconds"])

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "ffmpeg required")
    def test_review_passes_and_receipt_detects_stale_mp4(self) -> None:
        with tempfile.TemporaryDirectory() as temp_text:
            folder = Path(temp_text)
            mp4, concat, _ = self.make_lesson(folder, ("red", "green", "blue"))
            receipt = self.review.review(folder, mp4, concat)
            self.assertEqual("PASS", receipt["status"])
            self.assertEqual(3, receipt["coverage"]["mapped_sections"])
            (folder / self.review.RECEIPT_NAME).write_text(json.dumps(receipt), encoding="utf-8")
            self.assertTrue(self.review.validate_receipt(folder, expected_mp4=mp4)["valid"])
            with mp4.open("ab") as handle:
                handle.write(b"changed")
            self.assertFalse(self.review.validate_receipt(folder, expected_mp4=mp4)["valid"])

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "ffmpeg required")
    def test_receipt_detects_stale_slide_and_policy_tampering(self) -> None:
        with tempfile.TemporaryDirectory() as temp_text:
            folder = Path(temp_text)
            mp4, concat, paths = self.make_lesson(folder, ("red", "green", "blue"))
            receipt = self.review.review(folder, mp4, concat)
            receipt_path = folder / self.review.RECEIPT_NAME
            receipt_path.write_text(json.dumps(receipt), encoding="utf-8")

            Image.new("RGB", (320, 180), "yellow").save(paths[1])
            result = self.review.validate_receipt(folder, expected_mp4=mp4)
            self.assertFalse(result["valid"])
            self.assertTrue(any("section 2 slide changed" in error for error in result["errors"]))

            Image.new("RGB", (320, 180), "green").save(paths[1])
            receipt["thresholds"]["max_expected_normalized_mae"] = 1.0
            receipt_path.write_text(json.dumps(receipt), encoding="utf-8")
            result = self.review.validate_receipt(folder, expected_mp4=mp4)
            self.assertFalse(result["valid"])
            self.assertIn("receipt thresholds do not match release policy", result["errors"])

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "ffmpeg required")
    def test_non_adjacent_duplicate_slide_identity_can_pass(self) -> None:
        with tempfile.TemporaryDirectory() as temp_text:
            folder = Path(temp_text)
            mp4, concat, _ = self.make_lesson(folder, ("red", "blue", "red"))
            receipt = self.review.review(folder, mp4, concat)
            self.assertEqual("PASS", receipt["status"])
            self.assertEqual(
                receipt["sections"][0]["slide_sha256"],
                receipt["sections"][2]["slide_sha256"],
            )

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "ffmpeg required")
    def test_probe_rejects_non_mp4_container_even_with_mp4_suffix(self) -> None:
        with tempfile.TemporaryDirectory() as temp_text:
            folder = Path(temp_text)
            disguised = folder / "disguised.mp4"
            subprocess.run(
                [
                    "ffmpeg", "-v", "error", "-f", "lavfi", "-i", "color=red:s=32x18:d=1",
                    "-f", "matroska", "-y", str(disguised),
                ],
                check=True,
            )
            with self.assertRaisesRegex(ValueError, "MP4 container"):
                self.review.probe_media(disguised)


if __name__ == "__main__":
    unittest.main()
