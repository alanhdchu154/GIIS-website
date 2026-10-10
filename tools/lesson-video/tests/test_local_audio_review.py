#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import copy
import json
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "local_audio_review.py"


def load_module():
    spec = importlib.util.spec_from_file_location("local_audio_review_tested", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {MODULE_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class LocalAudioReviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.audio = load_module()

    def setUp(self) -> None:
        self._original_reprobe = self.audio.reprobe_media
        self.audio.reprobe_media = lambda _mp4: {
            "mp4": {"duration_seconds": 10.0, "codec": "aac", "sample_rate": 48000, "channels": 2},
            "integrated_lufs": -20.0,
            "true_peak_dbfs": -2.0,
            "long_silences": [],
            "full_decode_pass": True,
        }

    def tearDown(self) -> None:
        self.audio.reprobe_media = self._original_reprobe

    def analysis(self, folder):
        text = "alpha beta gamma"
        raw = {"transcription": [{"offsets": {"from": 1000, "to": 9000}, "text": text}]}
        (folder / "transcript.txt").write_text(text)
        (folder / self.audio.TRANSCRIPT_NAME).write_text(text)
        (folder / self.audio.WHISPER_JSON_NAME).write_text(json.dumps(raw))
        metrics, findings = self.audio.evaluate_metrics(
            mp4_duration=10.0, wav_duration=10.0, transcription=self.audio.parse_whisper_payload(raw),
            reference_text=text, audio_metrics={"integrated_lufs": -20.0, "true_peak_dbfs": -2.0}, silences=[],
        )
        return {
            "engine": {"name": "whisper.cpp", "version": "1.8.0", "language": "en", "full_file": True},
            "media": {"full_decode_pass": True,
                      "mp4": {"duration_seconds": 10.0, "codec": "aac", "sample_rate": 48000, "channels": 2},
                      "extracted_wav": {"duration_seconds": 10.0, "codec": "pcm_s16le", "sample_rate": 16000, "channels": 1}},
            "metrics": metrics,
        }

    def test_parse_observed_whisper_json(self) -> None:
        result = self.audio.parse_whisper_payload({
            "transcription": [
                {"timestamps": {"from": "00:00:00,500", "to": "00:00:02,000"}, "offsets": {"from": 500, "to": 2000}, "text": " Hello world."},
                {"timestamps": {"from": "00:00:02,000", "to": "00:00:04,250"}, "offsets": {"from": 2000, "to": 4250}, "text": " Clear speech."},
            ]
        })
        self.assertEqual(2, len(result["segments"]))
        self.assertEqual(0.5, result["first_speech_seconds"])
        self.assertEqual(4.25, result["last_speech_seconds"])
        self.assertEqual("Hello world. Clear speech.", result["text"])

    def test_parse_whisper_rejects_partial_shape(self) -> None:
        with self.assertRaises(ValueError):
            self.audio.parse_whisper_payload({"result": "ok"})
        with self.assertRaises(ValueError):
            self.audio.parse_whisper_payload({"transcription": []})

    def test_alignment_metrics_pass_and_hold(self) -> None:
        transcription = {
            "segments": [{"start": 1.0, "end": 9.0, "text": "alpha beta gamma"}],
            "text": "alpha beta gamma",
            "first_speech_seconds": 1.0,
            "last_speech_seconds": 9.0,
        }
        metrics, findings = self.audio.evaluate_metrics(
            mp4_duration=10.0, wav_duration=10.0, transcription=transcription,
            reference_text="alpha beta gamma", audio_metrics={"integrated_lufs": -20.0, "true_peak_dbfs": -2.0},
            silences=[],
        )
        self.assertEqual([], findings)
        self.assertEqual(0.0, metrics["word_error_rate"])
        _, intentional_pause_findings = self.audio.evaluate_metrics(
            mp4_duration=10.0, wav_duration=10.0, transcription=transcription,
            reference_text="alpha beta gamma",
            audio_metrics={"integrated_lufs": -20.0, "true_peak_dbfs": -2.0},
            silences=[{"start": 3.0, "end": 6.0, "duration": 3.0}],
        )
        self.assertNotIn("LONG_SILENCE", {row["code"] for row in intentional_pause_findings})
        _, findings = self.audio.evaluate_metrics(
            mp4_duration=20.0, wav_duration=18.0, transcription=transcription,
            reference_text="alpha beta gamma delta epsilon zeta eta theta",
            audio_metrics={"integrated_lufs": -35.0, "true_peak_dbfs": -0.1},
            silences=[{"start": 10.0, "end": 15.0, "duration": 5.0}],
        )
        codes = {item["code"] for item in findings}
        self.assertTrue({"AUDIO_DURATION_MISMATCH", "ASR_EARLY_END", "ASR_ALIGNMENT_ERROR", "LOUDNESS_OUT_OF_RANGE", "CLIPPING_RISK", "LONG_SILENCE"}.issubset(codes))

    def test_asr_segment_end_allows_small_whisper_overshoot_but_holds_large_one(self) -> None:
        base = {
            "segments": [{"start": 1.0, "end": 11.5, "text": "alpha beta gamma"}],
            "text": "alpha beta gamma",
            "first_speech_seconds": 1.0,
            "last_speech_seconds": 11.5,
        }
        metrics, findings = self.audio.evaluate_metrics(
            mp4_duration=10.0, wav_duration=10.0, transcription=base,
            reference_text="alpha beta gamma",
            audio_metrics={"integrated_lufs": -20.0, "true_peak_dbfs": -2.0}, silences=[],
        )
        self.assertEqual(1.5, metrics["asr_end_overshoot_seconds"])
        self.assertNotIn("ASR_END_OVERSHOOT", {row["code"] for row in findings})
        _, findings = self.audio.evaluate_metrics(
            mp4_duration=10.0, wav_duration=10.0,
            transcription={**base, "last_speech_seconds": 12.1},
            reference_text="alpha beta gamma",
            audio_metrics={"integrated_lufs": -20.0, "true_peak_dbfs": -2.0}, silences=[],
        )
        self.assertIn("ASR_END_OVERSHOOT", {row["code"] for row in findings})

    def test_wer_and_normalization(self) -> None:
        self.assertEqual(["english", "four", "question", "and", "answer"], self.audio.normalize_words("English IV; Q&A"))
        self.assertAlmostEqual(1 / 3, self.audio.word_error_rate(["a", "b", "c"], ["a", "x", "c"]))

    def test_validate_receipt_binds_all_artifacts_and_detects_stale_file(self) -> None:
        with tempfile.TemporaryDirectory() as temp_text:
            folder = Path(temp_text)
            files = {}
            for name in ("movie.mp4", "script.json", "transcript.txt", self.audio.TRANSCRIPT_NAME, self.audio.WHISPER_JSON_NAME, "model.bin", "whisper-cli"):
                path = folder / name
                path.write_text(name, encoding="utf-8")
                files[name] = path
            analysis = self.analysis(folder)
            bindings = {
                "mp4": self.audio._binding(files["movie.mp4"]),
                "script": self.audio._binding(files["script.json"]),
                "reference_transcript": self.audio._binding(files["transcript.txt"]),
                "asr_transcript": self.audio._binding(files[self.audio.TRANSCRIPT_NAME]),
                "whisper_json": self.audio._binding(files[self.audio.WHISPER_JSON_NAME]),
                "whisper_model": self.audio._binding(files["model.bin"]),
                "whisper_executable": self.audio._binding(files["whisper-cli"]),
            }
            receipt = {
                "schema_version": self.audio.SCHEMA_VERSION,
                "status": "PASS",
                "bindings": bindings,
                "thresholds": self.audio.THRESHOLDS,
                "findings": [],
                **analysis,
                "limitations": "automated",
            }
            (folder / self.audio.RECEIPT_NAME).write_text(json.dumps(receipt), encoding="utf-8")
            valid = self.audio.validate_local_audio_review(folder, expected_mp4=files["movie.mp4"])
            self.assertTrue(valid["valid"])
            self.assertEqual("PASS", valid["status"])
            mutations = [
                ("empty metrics", lambda row: row.update(metrics={})),
                ("missing engine", lambda row: row.pop("engine")),
                ("wrong engine", lambda row: row["engine"].update(name="invented")),
                ("empty version", lambda row: row["engine"].update(version="")),
                ("partial ASR", lambda row: row["engine"].update(full_file=False)),
                ("wrong language", lambda row: row["engine"].update(language="auto")),
                ("decode", lambda row: row["media"].update(full_decode_pass=False)),
                ("thresholds", lambda row: row.update(thresholds={})),
                ("forged WER", lambda row: row["metrics"].update(word_error_rate=0.1)),
                ("forged safe loudness", lambda row: row["metrics"].update(integrated_lufs=-19.0)),
                ("forged safe peak", lambda row: row["metrics"].update(true_peak_dbfs=-3.0)),
                ("forged safe duration", lambda row: row["media"]["mp4"].update(duration_seconds=9.5)),
                ("loudness", lambda row: row["metrics"].update(integrated_lufs=-40.0)),
                ("peak", lambda row: row["metrics"].update(true_peak_dbfs=0.0)),
                ("silence", lambda row: row["metrics"].update(long_silences=[{"start": 2.0, "end": 7.0, "duration": 5.0}])),
            ]
            for key in analysis["metrics"]:
                mutations.append(("missing " + key, lambda row, key=key: row["metrics"].pop(key)))
                if key != "long_silences":
                    for bad in (float("nan"), float("inf"), True):
                        mutations.append((f"nonfinite {key} {bad}", lambda row, key=key, bad=bad: row["metrics"].update({key: bad})))
            for label, mutate in mutations:
                with self.subTest(label=label):
                    forged = copy.deepcopy(receipt)
                    mutate(forged)
                    (folder / self.audio.RECEIPT_NAME).write_text(json.dumps(forged))
                    result = self.audio.validate_local_audio_review(folder, expected_mp4=files["movie.mp4"])
                    self.assertFalse(result["valid"], label)
                    self.assertEqual("HOLD", result["status"])
            (folder / self.audio.RECEIPT_NAME).write_text(json.dumps(receipt))
            files["transcript.txt"].write_text("changed", encoding="utf-8")
            stale = self.audio.validate_local_audio_review(folder, expected_mp4=files["movie.mp4"])
            self.assertFalse(stale["valid"])
            self.assertIn("local audio bound artifact changed or is missing: reference_transcript", stale["errors"])

    def test_legacy_script_binding_allows_only_review_bound_youtube_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as temp_text:
            folder = Path(temp_text)
            files = {}
            for name in ("movie.mp4", "transcript.txt", self.audio.TRANSCRIPT_NAME, self.audio.WHISPER_JSON_NAME, "model.bin", "whisper-cli"):
                path = folder / name
                path.write_text(name, encoding="utf-8")
                files[name] = path
            script = folder / "script.json"
            script.write_text(json.dumps({"course": "Example", "sections": []}, indent=2) + "\n")
            analysis = self.analysis(folder)
            bindings = {
                "mp4": self.audio._binding(files["movie.mp4"]),
                "script": self.audio._binding(script),
                "reference_transcript": self.audio._binding(files["transcript.txt"]),
                "asr_transcript": self.audio._binding(files[self.audio.TRANSCRIPT_NAME]),
                "whisper_json": self.audio._binding(files[self.audio.WHISPER_JSON_NAME]),
                "whisper_model": self.audio._binding(files["model.bin"]),
                "whisper_executable": self.audio._binding(files["whisper-cli"]),
            }
            receipt = {
                "schema_version": self.audio.SCHEMA_VERSION,
                "status": "PASS",
                "bindings": bindings,
                "thresholds": self.audio.THRESHOLDS,
                "findings": [],
                **analysis,
                "limitations": "automated",
            }
            (folder / self.audio.RECEIPT_NAME).write_text(json.dumps(receipt), encoding="utf-8")
            expected_teaching_sha = self.audio.review_script_sha(script)
            payload = json.loads(script.read_text())
            payload["youtube"] = {"video_id": "new456", "privacy": "unlisted"}
            script.write_text(json.dumps(payload, indent=2) + "\n")

            strict = self.audio.validate_local_audio_review(folder, expected_mp4=files["movie.mp4"])
            self.assertFalse(strict["valid"])
            publication_safe = self.audio.validate_local_audio_review(
                folder,
                expected_mp4=files["movie.mp4"],
                allowed_review_script_sha=expected_teaching_sha,
            )
            self.assertTrue(publication_safe["valid"])

            payload["course"] = "Changed"
            script.write_text(json.dumps(payload, indent=2) + "\n")
            changed = self.audio.validate_local_audio_review(
                folder,
                expected_mp4=files["movie.mp4"],
                allowed_review_script_sha=expected_teaching_sha,
            )
            self.assertFalse(changed["valid"])


if __name__ == "__main__":
    unittest.main()
