from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "manifest_order.py"
SPEC = importlib.util.spec_from_file_location("manifest_order", MODULE_PATH)
assert SPEC and SPEC.loader
manifest_order = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(manifest_order)


class ManifestOrderTest(unittest.TestCase):
    def test_order_is_independent_of_input_order(self) -> None:
        rows = [
            {"course": "Statistics", "module_number": 2, "module_title": "B", "youtube_id": "s2"},
            {"course": "Algebra II", "module_number": 10, "module_title": "J", "youtube_id": "a10"},
            {"course": "Algebra II", "module_number": 2, "module_title": "B", "youtube_id": "a2"},
            {"course": "Statistics", "module_number": 1, "module_title": "A", "youtube_id": "s1"},
        ]

        forward = manifest_order.canonical_manifest_rows(rows)
        reverse = manifest_order.canonical_manifest_rows(reversed(rows))

        self.assertEqual(forward, reverse)
        by_course, lessons = forward
        self.assertEqual(list(by_course), ["Algebra II", "Statistics"])
        self.assertEqual(
            [row["module_number"] for row in by_course["Algebra II"]],
            [2, 10],
        )
        self.assertEqual(
            lessons,
            [row for course_rows in by_course.values() for row in course_rows],
        )

    def test_missing_module_number_sorts_after_numbered_modules(self) -> None:
        rows = [
            {"course": "Course", "module_number": None, "module_title": "Appendix"},
            {"course": "Course", "module_number": "2", "module_title": "Continue"},
            {"course": "Course", "module_number": 1, "module_title": "Start"},
        ]

        _, lessons = manifest_order.canonical_manifest_rows(rows)

        self.assertEqual([row["module_number"] for row in lessons], [1, "2", None])


if __name__ == "__main__":
    unittest.main()
