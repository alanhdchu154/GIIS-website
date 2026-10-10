import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "audit_lessons.py"
SPEC = importlib.util.spec_from_file_location("audit_lessons", MODULE_PATH)
audit_lessons = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(audit_lessons)


class PauseDetectionTests(unittest.TestCase):
    def test_narrated_silence_followups_are_not_extra_pause_prompts(self):
        script = {
            "sections": [
                {"id": "07_pause", "text": "Pause and solve."},
                {"id": "07_pause_silence", "text": ""},
                {"id": "07_pause_silence_1", "text": "Write one process."},
                {"id": "07_pause_silence_2", "text": "Add an alternative."},
                {"id": "08_answer_reveal", "text": "Review the answer."},
            ]
        }
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "script.json").write_text("{}")
            result = audit_lessons.inspect_script(folder, script)

        self.assertEqual(result["pause_count"], 1)
        self.assertEqual(result["silence_count"], 1)
        self.assertTrue(result["has_worked_solution_after_pause"])


if __name__ == "__main__":
    unittest.main()
