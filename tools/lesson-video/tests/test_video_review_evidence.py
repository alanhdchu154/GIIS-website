#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().parents[1] / "video_review_evidence.py"


def load_module():
    spec = importlib.util.spec_from_file_location("video_review_evidence_tested", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {MODULE_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class VideoReviewEvidenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.review = load_module()
        self.review.ROOT = self.root
        self.folder = self.root / "teaching-videos" / "sample-lesson"
        self.folder.mkdir(parents=True)
        course_path = self.root / "server" / "prisma" / "courses" / "sample.json"
        course_path.parent.mkdir(parents=True)
        self.course_payload = {
            "slug": "sample",
            "modules": [{"order": 1, "title": "Evidence", "assignment": "Compare two sources."}],
        }
        course_path.write_text(json.dumps(self.course_payload), encoding="utf-8")
        source_packet = {
            "course": {"slug": "sample", "name": "Sample", "department": "Social Studies", "subject_area": "social_studies"},
            "module": {"order": 1, "title": "Evidence", "assignment": "Compare two sources."},
            "expert_lens": {"insight": "Compare evidence.", "watchFor": "Avoid assumptions.", "transfer": "Use in decisions."},
            "source_alignment": {"required_visible_sources": [{"label": "Source One"}]},
        }
        files = {
            "source_packet.json": json.dumps(source_packet),
            "script.json": json.dumps({"course": "Sample", "module": "Module 1: Evidence", "sections": [{"id": "title", "text": "Evidence"}]}),
            "build_slides.py": "LABEL = 'Source One'\n",
            "learning_check.json": json.dumps({"checks": []}),
            "style_manifest.json": json.dumps({"theme_name": "social_studies"}),
            "teaching_brief.md": "# Teaching brief\n",
            "visual_brief.md": "# Visual brief\n",
            "transcript.txt": "Evidence\n",
            "contact-sheet.jpg": "image-placeholder",
            "current.mp4": "video-placeholder",
        }
        for name, content in files.items():
            (self.folder / name).write_text(content, encoding="utf-8")
        slides = self.folder / "slides"
        slides.mkdir()
        (slides / "01_title.png").write_bytes(b"one")
        (slides / "02_body.png").write_bytes(b"two")
        (self.folder / "slides_concat.txt").write_text(
            "file slides/01_title.png\nfile slides/02_body.png\n", encoding="utf-8"
        )
        receipt_path = self.folder / self.review.LOCAL_AUDIO_RECEIPT_NAME
        receipt_path.write_text('{"status":"PASS"}', encoding="utf-8")
        self.audio_validation = {
            "valid": True,
            "status": "PASS",
            "model_sha256": "model-sha",
            "candidate_mp4": str((self.folder / "current.mp4").resolve()),
        }
        self.review.validate_local_audio_review = lambda *_args, **_kwargs: self.audio_validation
        self.packet_path = self.review.write_review_packet(
            self.folder,
            self.folder / "current.mp4",
            producer_identity="producer-worker",
            require_local_audio=True,
            review_scope="full-release",
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def _write_response(
        self,
        *,
        verdict: str = "PASS",
        dimensions=None,
        reviewer=None,
        provider: str = "codex-cli",
    ) -> dict:
        packet = json.loads(self.packet_path.read_text(encoding="utf-8"))
        dimensions = dimensions or {
            "source_teaching_correctness": {"status": "PASS", "coverage": {"level": "full", "artifacts": ["canonical_course", "source_packet", "script", "learning_check"]}, "finding_ids": []},
            "student_safety": {"status": "PASS", "coverage": {"level": "full", "artifacts": ["canonical_course", "script"]}, "finding_ids": []},
            "audiovisual_source_alignment": {"status": "PASS", "coverage": {"level": "full", "artifacts": ["mp4", "transcript", "script", "build_slides", "local_audio_review"]}, "finding_ids": []},
            "technical_trust_release": {"status": "PASS", "coverage": {"level": "full", "artifacts": ["mp4", "contact_sheet", "style_manifest", "local_audio_review"]}, "finding_ids": []},
        }
        reviewer = reviewer or {
            "identity": "independent-reviewer",
            "actor_type": "model",
            "role": "independent reviewer",
            "independence_attestation": True,
            "observed_model": "observed-model",
        }
        response = {
            "schema_version": self.review.SCHEMA_VERSION,
            "review_id": packet["review_id"],
            "packet_sha256": self.review.sha256_file(self.packet_path),
            "reviewer": reviewer,
            "verdict": verdict,
            "summary": "No release-blocking finding in the declared full test coverage.",
            "bindings": packet["artifacts"],
            "dimensions": dimensions,
            "findings": [],
            "limitations": "This is a model review, not human academic certification.",
        }
        response_path = self.folder / self.review.RESPONSE_NAME
        response_path.write_text(json.dumps(response), encoding="utf-8")
        log_path = self.root / "review.jsonl"
        if provider == "codex-cli":
            mp4 = str((self.folder / "current.mp4").resolve())
            concat = str((self.folder / "slides_concat.txt").resolve())
            packet = json.loads(self.packet_path.read_text(encoding="utf-8"))
            text_artifacts = [
                "canonical_course", "source_packet", "script", "learning_check",
                "transcript", "build_slides", "style_manifest",
            ]
            commands = [
                *(f"cat {self.review.resolve_path(packet['artifacts'][name]['path']).resolve()}"
                  for name in text_artifacts
                  if isinstance(packet.get("artifacts"), dict)
                  and isinstance(packet["artifacts"].get(name), dict)),
                f"cat {(self.folder / self.review.LOCAL_AUDIO_RECEIPT_NAME).resolve()}",
                f"cat {concat}",
                f"ffmpeg -v error -i {mp4} -map 0:v:0 -f hash -",
                f"ffmpeg -hide_banner -i {mp4} -map 0:v:0 -vf 'select=gt(scene\\,0.10),showinfo' -f null -",
            ]
            events = [{"type": "thread.started", "thread_id": "session-1"}]
            events.extend({
                "type": "item.completed",
                "item": {
                    "type": "command_execution",
                    "command": f"/bin/bash -lc {json.dumps(command)}",
                    "status": "completed",
                    "exit_code": 0,
                },
            } for command in commands)
            events.append({"type": "turn.completed", "usage": {}})
            log_path.write_text(
                "".join(json.dumps(event) + "\n" for event in events), encoding="utf-8"
            )
        else:
            log_path.write_text(
                '{"type":"system","subtype":"init","model":"observed-model","session_id":"session-1"}\n'
                '{"type":"result","subtype":"success","is_error":false}\n',
                encoding="utf-8",
            )
        execution = {
            "schema_version": self.review.SCHEMA_VERSION,
            "review_id": packet["review_id"],
            "packet_sha256": self.review.sha256_file(self.packet_path),
            "response_sha256": self.review.sha256_file(response_path),
            "actor_identity": reviewer.get("identity"),
            "provider": provider,
            "requested_model": "opus",
            "observed_model": "observed-model",
            "session_id": "session-1",
            "log_path": str(log_path),
            "log_sha256": self.review.sha256_file(log_path),
        }
        if provider == "codex-cli":
            rollout_path = self.root / "rollout-session-1.jsonl"
            rollout_events = [
                {"type": "session_meta", "payload": {"id": "session-1", "model_provider": "openai"}},
                {"type": "turn_context", "payload": {"model": "observed-model", "effort": "high"}},
            ]
            images = sorted((self.folder / "slides").glob("*.png")) + [
                self.folder / "contact-sheet.jpg",
            ]
            for index, slide in enumerate(images):
                call_id = f"view-{index}"
                wrapper = (
                    f'const r = await tools.view_image({{"path":{json.dumps(str(slide.resolve()))},'
                    '"detail":"original"}); image(r.image_url,"original");'
                )
                rollout_events.extend([
                    {"type": "response_item", "payload": {
                        "type": "custom_tool_call", "name": "exec", "call_id": call_id, "input": wrapper,
                    }},
                    {"type": "response_item", "payload": {
                        "type": "custom_tool_call_output", "call_id": call_id,
                        "output": [{"type": "input_image", "image_url": "data:image/png;base64,AA=="}],
                    }},
                ])
            rollout_path.write_text(
                "".join(json.dumps(event) + "\n" for event in rollout_events), encoding="utf-8"
            )
            model_output_path = self.root / "model-output.json"
            model_output_path.write_text(json.dumps(response), encoding="utf-8")
            execution.update({
                "rollout_path": str(rollout_path),
                "rollout_sha256": self.review.sha256_file(rollout_path),
                "model_output_path": str(model_output_path),
                "model_output_sha256": self.review.sha256_file(model_output_path),
                "response_path": str(response_path),
            })
        (self.folder / self.review.EXECUTION_NAME).write_text(json.dumps(execution), encoding="utf-8")
        return response

    def test_valid_version_bound_model_review(self) -> None:
        self._write_response()
        result = self.review.validate_review_evidence(self.folder)
        self.assertTrue(result["valid"], result["errors"])
        self.assertEqual("PASS", result["verdict"])

    def test_valid_codex_cli_review_binds_persisted_model_identity(self) -> None:
        self._write_response(provider="codex-cli")
        result = self.review.validate_review_evidence(self.folder)
        self.assertTrue(result["valid"], result["errors"])
        self.assertEqual("PASS", result["verdict"])

    def test_pass_rejects_missing_successful_bound_artifact_read(self) -> None:
        self._write_response(provider="codex-cli")
        execution_path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(execution_path.read_text())
        log_path = Path(execution["log_path"])
        script_path = str((self.folder / "script.json").resolve())
        events = [
            json.loads(line) for line in log_path.read_text().splitlines()
            if line.strip()
        ]
        events = [
            event for event in events
            if script_path not in json.dumps(event)
        ]
        log_path.write_text("".join(json.dumps(event) + "\n" for event in events))
        execution["log_sha256"] = self.review.sha256_file(log_path)
        execution_path.write_text(json.dumps(execution))
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn(
            "PASS lacks an observed successful exact-path read: script",
            result["errors"],
        )

    def test_path_scope_rejects_symlink_escape_and_outside_image(self) -> None:
        outside = self.root.parent / f"{self.root.name}-outside.txt"
        outside.write_text("secret")
        link = self.folder / "outside-link.txt"
        link.symlink_to(outside)
        try:
            self.assertFalse(self.review._command_paths_scoped(
                "cat outside-link.txt", workdir=str(self.folder),
                allowed_roots=(self.root.resolve(), self.folder.resolve()),
            ))
            errors = []
            wrapper = (
                f'const r = await tools.view_image({{"path":{json.dumps(str(outside))},'
                '"detail":"original"}); image(r.image_url,"original");'
            )
            self.review._validate_observed_tools({
                "type": "custom_tool_call", "name": "exec", "input": wrapper,
            }, errors, provider="codex-cli",
                allowed_roots=(self.root.resolve(), self.folder.resolve()))
            self.assertIn("review execution reads outside the allowed review roots", errors)
        finally:
            outside.unlink(missing_ok=True)

    def test_codex_cli_review_rejects_tampered_rollout_model(self) -> None:
        self._write_response(provider="codex-cli")
        execution_path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(execution_path.read_text(encoding="utf-8"))
        rollout_path = Path(execution["rollout_path"])
        rollout_path.write_text(
            '{"type":"session_meta","payload":{"id":"session-1"}}\n'
            '{"type":"turn_context","payload":{"model":"different-model"}}\n',
            encoding="utf-8",
        )
        execution["rollout_sha256"] = self.review.sha256_file(rollout_path)
        execution_path.write_text(json.dumps(execution), encoding="utf-8")
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("Codex persisted rollout model does not match execution receipt", result["errors"])

    def test_codex_cli_review_rejects_model_output_response_mismatch(self) -> None:
        self._write_response(provider="codex-cli")
        execution_path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(execution_path.read_text(encoding="utf-8"))
        model_output_path = Path(execution["model_output_path"])
        model_output = json.loads(model_output_path.read_text(encoding="utf-8"))
        model_output["summary"] = "Different unbound summary."
        model_output_path.write_text(json.dumps(model_output), encoding="utf-8")
        execution["model_output_sha256"] = self.review.sha256_file(model_output_path)
        execution_path.write_text(json.dumps(execution), encoding="utf-8")
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("Codex structured model output does not match normalized review response", result["errors"])

    def test_unknown_execution_provider_fails_closed(self) -> None:
        self._write_response(provider="unknown-provider")
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("unsupported execution provider: unknown-provider", result["errors"])

    def test_full_release_packet_requires_and_binds_local_audio_pass(self) -> None:
        with self.assertRaisesRegex(ValueError, "requires local audio binding"):
            self.review.write_review_packet(
                self.folder,
                self.folder / "current.mp4",
                producer_identity="producer-worker",
                review_scope="full-release",
            )
        with patch.object(
            self.review,
            "validate_local_audio_review",
            return_value={"valid": False, "status": "HOLD", "errors": ["fixture hold"]},
        ):
            with self.assertRaisesRegex(ValueError, "requires valid local audio PASS"):
                self.review.write_review_packet(
                    self.folder,
                    self.folder / "current.mp4",
                    producer_identity="producer-worker",
                    require_local_audio=True,
                    review_scope="full-release",
                )
        receipt_path = self.folder / self.review.LOCAL_AUDIO_RECEIPT_NAME
        receipt_path.write_text('{"status":"PASS"}', encoding="utf-8")
        audio_validation = {
            "valid": True,
            "status": "PASS",
            "model_sha256": "model-sha",
            "candidate_mp4": str(self.folder / "current.mp4"),
        }
        with patch.object(self.review, "validate_local_audio_review", return_value=audio_validation):
            packet_path = self.review.write_review_packet(
                self.folder,
                self.folder / "current.mp4",
                producer_identity="producer-worker",
                require_local_audio=True,
                review_scope="full-release",
            )
        packet = json.loads(packet_path.read_text(encoding="utf-8"))
        self.assertEqual("PASS", packet["automated_audio_review"]["status"])
        self.assertEqual(
            self.review.sha256_file(receipt_path),
            packet["automated_audio_review"]["receipt"]["sha256"],
        )

    def test_content_source_review_cannot_pass_release_dimensions(self) -> None:
        self.packet_path = self.review.write_review_packet(
            self.folder,
            self.folder / "current.mp4",
            producer_identity="producer-worker",
            review_scope="content-source",
        )
        self._write_response()
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn(
            "content-source review cannot PASS audiovisual_source_alignment",
            result["errors"],
        )

    def test_bound_script_change_invalidates_review(self) -> None:
        self._write_response()
        (self.folder / "script.json").write_text('{"changed": true}', encoding="utf-8")
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("bound artifact changed or is missing: script", result["errors"])

    def test_sampled_audiovisual_dimension_cannot_pass(self) -> None:
        dimensions = {
            "source_teaching_correctness": {"status": "PASS", "coverage": {"level": "full", "artifacts": ["canonical_course", "source_packet", "script", "learning_check"]}, "finding_ids": []},
            "student_safety": {"status": "PASS", "coverage": {"level": "full", "artifacts": ["canonical_course", "script"]}, "finding_ids": []},
            "audiovisual_source_alignment": {"status": "PASS", "coverage": {"level": "sampled", "artifacts": ["mp4", "transcript", "script", "build_slides"]}, "finding_ids": []},
            "technical_trust_release": {"status": "PASS", "coverage": {"level": "full", "artifacts": ["mp4", "contact_sheet", "style_manifest"]}, "finding_ids": []},
        }
        self._write_response(dimensions=dimensions)
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("dimension audiovisual_source_alignment cannot PASS without full coverage", result["errors"])

    def test_self_review_identity_is_rejected(self) -> None:
        self._write_response(reviewer={
            "identity": "producer-worker",
            "actor_type": "model",
            "role": "reviewer",
            "independence_attestation": True,
            "observed_model": "observed-model",
        })
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("reviewer identity matches producer identity; review is not independent", result["errors"])

    def test_unobserved_human_claim_is_rejected(self) -> None:
        self._write_response(reviewer={
            "identity": "claimed-human",
            "actor_type": "human",
            "role": "subject expert",
            "independence_attestation": True,
            "observed_model": "observed-model",
        })
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertTrue(any("human approval path is not implemented" in error for error in result["errors"]))

    def test_observed_model_mismatch_is_rejected(self) -> None:
        self._write_response()
        response_path = self.folder / self.review.RESPONSE_NAME
        response = json.loads(response_path.read_text(encoding="utf-8"))
        response["reviewer"]["observed_model"] = "invented-model"
        response_path.write_text(json.dumps(response), encoding="utf-8")
        execution_path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(execution_path.read_text(encoding="utf-8"))
        execution["response_sha256"] = self.review.sha256_file(response_path)
        execution_path.write_text(json.dumps(execution), encoding="utf-8")
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("reviewer observed_model does not match execution receipt", result["errors"])

    def test_missing_raw_execution_log_is_rejected(self) -> None:
        self._write_response()
        execution_path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(execution_path.read_text(encoding="utf-8"))
        execution["log_path"] = ""
        execution["log_sha256"] = ""
        execution_path.write_text(json.dumps(execution), encoding="utf-8")
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("execution receipt lacks a readable raw log", result["errors"])

    def test_empty_packet_and_response_bindings_are_rejected(self) -> None:
        packet = json.loads(self.packet_path.read_text(encoding="utf-8"))
        packet["artifacts"] = {}
        self.packet_path.write_text(json.dumps(packet), encoding="utf-8")
        self._write_response()
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("packet does not contain the exact required artifact set", result["errors"])

    def test_arbitrary_text_log_is_rejected_even_when_hash_matches(self) -> None:
        self._write_response()
        execution_path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(execution_path.read_text(encoding="utf-8"))
        log_path = Path(execution["log_path"])
        log_path.write_text("not an observed successful run\n", encoding="utf-8")
        execution["log_sha256"] = self.review.sha256_file(log_path)
        execution_path.write_text(json.dumps(execution), encoding="utf-8")
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("raw execution log lacks matching observed model/session init", result["errors"])
        self.assertIn("raw execution log lacks a successful terminal result", result["errors"])

    def test_tampered_academic_hold_is_recomputed(self) -> None:
        source_packet_path = self.folder / "source_packet.json"
        source_packet = json.loads(source_packet_path.read_text(encoding="utf-8"))
        source_packet["course"].update({"department": "Psychology", "subject_area": "psychology"})
        source_packet["module"]["assignment"] = "Determine whether the behavior meets criteria for a psychological disorder."
        source_packet_path.write_text(json.dumps(source_packet), encoding="utf-8")
        course_path = self.root / "server" / "prisma" / "courses" / "sample.json"
        course = json.loads(course_path.read_text(encoding="utf-8"))
        course["modules"][0]["assignment"] = source_packet["module"]["assignment"]
        course_path.write_text(json.dumps(course), encoding="utf-8")
        self.packet_path = self.review.write_review_packet(
            self.folder,
            self.folder / "current.mp4",
            producer_identity="producer-worker",
        )
        packet = json.loads(self.packet_path.read_text(encoding="utf-8"))
        self.assertTrue(packet["academic_holds"])
        packet["academic_holds"] = []
        self.packet_path.write_text(json.dumps(packet), encoding="utf-8")
        self._write_response()
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("packet academic holds do not match current canonical source", result["errors"])

    def test_malformed_dimension_fails_closed_without_exception(self) -> None:
        response = self._write_response()
        response["dimensions"]["student_safety"] = "PASS"
        response_path = self.folder / self.review.RESPONSE_NAME
        response_path.write_text(json.dumps(response), encoding="utf-8")
        execution_path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(execution_path.read_text(encoding="utf-8"))
        execution["response_sha256"] = self.review.sha256_file(response_path)
        execution_path.write_text(json.dumps(execution), encoding="utf-8")
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("dimension student_safety must be an object", result["errors"])

    def test_malformed_nested_values_fail_closed_without_exception(self) -> None:
        response = self._write_response()
        response["reviewer"] = []
        response["bindings"]["mp4"] = []
        response["findings"] = [{
            "id": "F-X",
            "dimension": "student_safety",
            "severity": "hold",
            "location": [],
            "description": "Malformed location test.",
            "required_action": "Hold.",
        }]
        response["dimensions"]["student_safety"] = {
            "status": "HOLD",
            "coverage": {"level": "full", "artifacts": [{}]},
            "finding_ids": [{}],
        }
        response["verdict"] = "HOLD"
        response_path = self.folder / self.review.RESPONSE_NAME
        response_path.write_text(json.dumps(response), encoding="utf-8")
        execution_path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(execution_path.read_text(encoding="utf-8"))
        execution["response_sha256"] = self.review.sha256_file(response_path)
        execution_path.write_text(json.dumps(execution), encoding="utf-8")
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("reviewer must be an object", result["errors"])
        self.assertIn("response binding must be an object: mp4", result["errors"])
        self.assertIn("finding F-X location must be an object", result["errors"])
        self.assertIn("dimension student_safety has invalid coverage", result["errors"])

    def test_pass_with_repair_finding_is_rejected(self) -> None:
        response = self._write_response()
        response["findings"] = [{
            "id": "F-REPAIR",
            "dimension": "source_teaching_correctness",
            "severity": "repair",
            "location": {"artifact": "script", "locator": "sections[0]"},
            "description": "Repair remains.",
            "required_action": "Repair it.",
        }]
        response["dimensions"]["source_teaching_correctness"]["finding_ids"] = ["F-REPAIR"]
        response_path = self.folder / self.review.RESPONSE_NAME
        response_path.write_text(json.dumps(response), encoding="utf-8")
        execution_path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(execution_path.read_text(encoding="utf-8"))
        execution["response_sha256"] = self.review.sha256_file(response_path)
        execution_path.write_text(json.dumps(execution), encoding="utf-8")
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertIn("PASS response contains blocking findings", result["errors"])

    def test_minor_finding_cannot_pass_evidence_audit_or_release(self):
        response = self._write_response()
        response["findings"] = [{"id": "F-MINOR", "dimension": "student_safety", "severity": "minor",
                                 "location": {"artifact": "script", "locator": "sections[0]"},
                                 "description": "Small revision remains.", "required_action": "Revise."}]
        response["dimensions"]["student_safety"]["finding_ids"] = ["F-MINOR"]
        path = self.folder / self.review.RESPONSE_NAME
        path.write_text(json.dumps(response))
        execution_path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(execution_path.read_text())
        execution["response_sha256"] = self.review.sha256_file(path)
        execution_path.write_text(json.dumps(execution))
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"])
        self.assertEqual("HOLD", result["verdict"])
        self.assertIn("PASS response contains blocking findings", result["errors"])
        from audit_lessons import audit_lesson
        with patch("audit_lessons.validate_review_evidence", return_value=result):
            audit = audit_lesson(self.folder)
        self.assertLess(audit["quality_score"], 100)
        self.assertTrue(any("F-MINOR" in issue["message"] for issue in audit["issues"]))

    def test_observed_mutating_and_external_tools_invalidate_execution(self):
        cases = [
            ("claude-code", {"type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Write", "input": {"file_path": "script.json"}}]}}),
            ("claude-code", {"type": "stream_event", "event": {"type": "content_block_start", "content_block": {"type": "tool_use", "name": "Bash"}}}),
            ("claude-code", {"type": "assistant", "message": {"content": [{"type": "tool_use", "name": "WebFetch"}]}}),
            ("codex-cli", {"type": "item.completed", "item": {"type": "command_execution", "command": "git push origin main"}}),
            ("codex-cli", {"type": "item.completed", "item": {"type": "command_execution", "command": "cat script.json; touch changed"}}),
            ("codex-cli", {"type": "item.completed", "item": {"type": "file_change", "changes": []}}),
            ("codex-cli", {"type": "item.completed", "item": {"type": "mcp_tool_call", "tool": "upload"}}),
        ]
        for provider, event in cases:
            with self.subTest(event=event):
                self._write_response(provider=provider)
                path = self.folder / self.review.EXECUTION_NAME
                execution = json.loads(path.read_text())
                log = Path(execution["log_path"])
                log.write_text(log.read_text() + json.dumps(event) + "\n")
                execution["log_sha256"] = self.review.sha256_file(log)
                path.write_text(json.dumps(execution))
                result = self.review.validate_review_evidence(self.folder)
                self.assertFalse(result["valid"])
                self.assertTrue(any("tool call" in error or "shell command" in error for error in result["errors"]), result)

    def test_shell_evidence_rejects_hidden_writes_and_external_inputs(self):
        allowed = [
            "ffmpeg -v error -i lesson.mp4 -f null -",
            "ffmpeg -v error -i lesson.mp4 -map 0:v:0 -f framemd5 -",
            "ffmpeg -hide_banner -i lesson.mp4 -vf 'select=gt(scene\\,0.10),showinfo' -f null -",
            "ffprobe -v error -of json -show_format lesson.mp4",
        ]
        blocked = ["ffmpeg -i lesson.mp4 changed.mp4 -f null -", "ffmpeg -i https://example.test/a.mp4 -f null -",
                   "ffprobe -o stolen.txt lesson.mp4", "rg --pre=upload.py topic .", "rg --hostname-bin=upload.py topic .",
                   "sed -n '1p;w changed' script.json", "sed -n 1p -i script.json", "sed -n 1p -e 2p script.json",
                   "ffmpeg -i lesson.mp4 -vf 'movie=other.mp4,showinfo' -f null -",
                   "ffmpeg -i lesson.mp4 -vf blackdetect -f null -",
                   "ffmpeg -i lesson.mp4 -vf freezedetect -f null -",
                   "ffmpeg -i lesson.mp4 -vf 'select=gte(scene,0.10),showinfo' -f null -",
                   "ffmpeg -i lesson.mp4 -vf 'select=gt(scene,0.25),showinfo' -f null -",
                   "ffmpeg -i lesson.mp4 -vf 'select=1,metadata=mode=print:file=changed,showinfo' -f null -",
                   "ffmpeg -i lesson.mp4 -vf 'select=1,frei0r=filter_name=foo,showinfo' -f null -",
                   "cat script.json > changed", "python3 upload.py",
                   "bash -lc 'cat script.json'", "zsh -c 'rg topic script.json'"]
        for command in allowed:
            self.assertTrue(self.review._read_only_command(command), command)
        for command in blocked:
            self.assertFalse(self.review._read_only_command(command), command)

    @unittest.skipUnless(shutil.which("ffmpeg"), "ffmpeg is required for execution regression")
    def test_allowlisted_scene_filter_executes_in_ffmpeg(self):
        scene_filter = r"select=gt(scene\,0.10),showinfo"
        command = (
            "ffmpeg -hide_banner -i lesson.mp4 -map 0:v:0 "
            f"-vf '{scene_filter}' -f null -"
        )
        self.assertTrue(self.review._read_only_command(command), command)
        result = subprocess.run(
            [
                shutil.which("ffmpeg"), "-hide_banner", "-f", "lavfi", "-i",
                "color=c=black:s=16x16:r=1:d=1", "-map", "0:v:0",
                "-vf", scene_filter, "-f", "null", "-",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(0, result.returncode, result.stderr)

    def test_scope_rejects_path_options_and_multiple_find_roots(self):
        allowed_roots = (self.root.resolve(), self.folder.resolve())
        commands = (
            f"find {self.folder} /Users/alanhdchu/.ssh -maxdepth 1 -type f",
            f"grep -f /Users/alanhdchu/.ssh/config pattern {self.folder / 'script.json'}",
            f"grep -f/Users/alanhdchu/.ssh/config pattern {self.folder / 'script.json'}",
            f"jq -f /Users/alanhdchu/.ssh/config {self.folder / 'script.json'}",
            f"jq -L/Users/alanhdchu/.ssh {self.folder / 'script.json'}",
            f"jq -f/Users/alanhdchu/.ssh/config {self.folder / 'script.json'}",
            "wc --files0-from=/Users/alanhdchu/.ssh/file-list",
            f"file -M/Users/alanhdchu/.ssh/config {self.folder / 'script.json'}",
            f"find {self.folder} -newerBB /Users/alanhdchu/.ssh/config -print",
            "file -C",
            "file --compile",
            f"/tmp/cat {self.folder / 'script.json'}",
            f"/tmp/ffmpeg -v error -i {self.folder / 'current.mp4'} -map 0:v:0 -f hash -",
            "cat ~/.ssh/config",
            "cat {/tmp/inside,/Users/alanhdchu/.ssh/config}",
            f"wc {{{self.folder / 'script.json'},--files0-from=/Users/alanhdchu/.ssh/file-list}}",
        )
        for command in commands:
            with self.subTest(command=command):
                self.assertFalse(self.review._read_only_command(command))
                self.assertFalse(self.review._command_paths_scoped(
                    command, workdir=str(self.folder), allowed_roots=allowed_roots,
                ))

    def test_codex_persisted_tool_calls_are_checked_and_read_commands_work(self):
        for command, valid in (("cat script.json", True), ("/bin/zsh -lc 'rg -n topic script.json'", False), ("rm script.json", False), ("curl https://example.test", False)):
            with self.subTest(command=command):
                self._write_response(provider="codex-cli")
                path = self.folder / self.review.EXECUTION_NAME
                execution = json.loads(path.read_text())
                rollout = Path(execution["rollout_path"])
                event = {"type": "response_item", "payload": {"type": "function_call", "name": "exec_command", "arguments": json.dumps({"cmd": command})}}
                rollout.write_text(rollout.read_text() + json.dumps(event) + "\n")
                execution["rollout_sha256"] = self.review.sha256_file(rollout)
                path.write_text(json.dumps(execution))
                result = self.review.validate_review_evidence(self.folder)
                self.assertEqual(valid, result["valid"], result)

    def test_current_codex_exec_wrapper_accepts_local_read_only_inspection(self):
        self._write_response(provider="codex-cli")
        path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(path.read_text())
        rollout = Path(execution["rollout_path"])
        event = {
            "type": "response_item",
            "payload": {
                "type": "custom_tool_call",
                "name": "exec",
                "input": (
                    'const r = await tools.exec_command({cmd:"ls slides",'
                    f'workdir:{json.dumps(str(self.folder))},yield_time_ms:1000,max_output_tokens:1000}}); '
                    'text(JSON.stringify({output:r.output,exit_code:r.exit_code}));'
                ),
            },
        }
        rollout.write_text(rollout.read_text() + json.dumps(event) + "\n")
        execution["rollout_sha256"] = self.review.sha256_file(rollout)
        path.write_text(json.dumps(execution))
        result = self.review.validate_review_evidence(self.folder)
        self.assertTrue(result["valid"], result)

    def test_current_codex_exec_wrapper_accepts_quoted_known_keys(self):
        self._write_response(provider="codex-cli")
        path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(path.read_text())
        rollout = Path(execution["rollout_path"])
        event = {
            "type": "response_item",
            "payload": {
                "type": "custom_tool_call",
                "name": "exec",
                "input": (
                    'const r = await tools.exec_command({"cmd":"cat script.json",'
                    f'"workdir":{json.dumps(str(self.folder))},"yield_time_ms":1000,"max_output_tokens":1000}}); '
                    'text(JSON.stringify({output:r.output,exit_code:r.exit_code}));'
                ),
            },
        }
        rollout.write_text(rollout.read_text() + json.dumps(event) + "\n")
        execution["rollout_sha256"] = self.review.sha256_file(rollout)
        path.write_text(json.dumps(execution))
        result = self.review.validate_review_evidence(self.folder)
        self.assertTrue(result["valid"], result)

    def test_current_codex_exec_wrapper_rejects_out_of_scope_workdir(self):
        wrapper = (
            'const r = await tools.exec_command({cmd:"cat script.json",'
            'workdir:"/tmp",yield_time_ms:1000,max_output_tokens:1000}); '
            'text(JSON.stringify({output:r.output,exit_code:r.exit_code}));'
        )
        self.assertIsNone(
            self.review._codex_exec_wrapper_commands(
                wrapper, allowed_roots=(self.root.resolve(), self.folder.resolve()),
            )
        )

    def test_current_codex_exec_wrapper_rejects_out_of_scope_absolute_path(self):
        wrapper = (
            f'const r = await tools.exec_command({{cmd:"cat /Users/alanhdchu/.ssh/id_rsa",'
            f'workdir:{json.dumps(str(self.folder))},yield_time_ms:1000,max_output_tokens:1000}}); '
            'text(JSON.stringify({output:r.output,exit_code:r.exit_code}));'
        )
        self.assertIsNone(
            self.review._codex_exec_wrapper_commands(
                wrapper, allowed_roots=(self.root.resolve(), self.folder.resolve()),
            )
        )

    def test_current_codex_view_wrapper_accepts_one_literal_image_only(self):
        path = str(self.folder / "slides" / "01_title.png")
        valid = (
            f'const r = await tools.view_image({{"path":{json.dumps(path)},'
            '"detail":"original"}); image(r.image_url,"original");'
        )
        self.assertEqual(path, self.review._codex_view_wrapper_path(valid))
        self.assertIsNone(self.review._codex_view_wrapper_path(
            f'const r = await tools.view_image({{"path":{json.dumps(path)},"detail":"original"}}); '
            'image(r.image_url,"original"); text("extra");'
        ))
        self.assertIsNone(self.review._codex_view_wrapper_path(
            f'const r = await tools.view_image({{"path":{json.dumps(path)},"detail":"high"}}); '
            'image(r.image_url,"original");'
        ))
        self.assertIsNone(self.review._codex_view_wrapper_path(
            f'const r = await tools.view_image({{"path":{json.dumps(path)},"detail":"original"}}); '
            'image(r.image_url);'
        ))

    def test_full_release_pass_requires_observed_visual_traversal(self):
        slides = self.folder / "slides"
        slides.mkdir(exist_ok=True)
        first = slides / "01_title.png"
        second = slides / "02_body.png"
        first.write_bytes(b"one")
        second.write_bytes(b"two")
        concat = self.folder / "slides_concat.txt"
        concat.write_text("file slides/01_title.png\nfile slides/02_body.png\n")
        mp4 = (self.folder / "current.mp4").resolve()
        packet = {
            "review_scope": "full-release",
            "automated_audio_review": {"status": "PASS"},
            "artifacts": {"mp4": {"path": str(mp4)}},
        }
        dimensions = {
            "audiovisual_source_alignment": {"status": "PASS"},
            "technical_trust_release": {"status": "PASS"},
        }
        complete = {
            "commands": [
                f"cat {concat.resolve()}",
                f"ffmpeg -v error -i {mp4} -map 0:v:0 -f hash -",
                f"ffmpeg -hide_banner -i {mp4} -map 0:v:0 -vf 'select=gt(scene\\,0.10),showinfo' -f null -",
            ],
            "images": [str(first.resolve()), str(second.resolve())],
        }
        errors = []
        self.review._validate_full_release_observations(
            self.folder, packet, dimensions, complete, errors,
        )
        self.assertEqual([], errors)
        errors = []
        self.review._validate_full_release_observations(
            self.folder, packet, dimensions, {"commands": [], "images": []}, errors,
        )
        self.assertEqual(4, len(errors))

    def test_full_release_observations_reject_partial_or_nonvideo_commands(self):
        mp4 = (self.folder / "current.mp4").resolve()
        concat = (self.folder / "slides_concat.txt").resolve()
        dimensions = {
            "audiovisual_source_alignment": {"status": "PASS"},
            "technical_trust_release": {"status": "PASS"},
        }
        packet = {
            "review_scope": "full-release",
            "artifacts": {"mp4": {"path": str(mp4)}},
        }
        images = [str(path.resolve()) for path in (self.folder / "slides").glob("*.png")]
        cases = {
            "partial concat": [
                f"cat {concat} | head -n 1",
                f"ffmpeg -v error -i {mp4} -map 0:v:0 -f hash -",
                f"ffmpeg -i {mp4} -map 0:v:0 -vf 'select=gt(scene\\,0.10),showinfo' -f null -",
            ],
            "audio-only hash": [
                f"cat {concat}",
                f"ffmpeg -v error -i {mp4} -map 0:a:0 -f hash -",
                f"ffmpeg -i {mp4} -map 0:v:0 -vf 'select=gt(scene\\,0.10),showinfo' -f null -",
            ],
            "disabled video hash": [
                f"cat {concat}",
                f"ffmpeg -v error -i {mp4} -map 0:v:0 -vn -f hash -",
                f"ffmpeg -i {mp4} -map 0:v:0 -vf 'select=gt(scene\\,0.10),showinfo' -f null -",
            ],
            "trimmed scene": [
                f"cat {concat}",
                f"ffmpeg -v error -i {mp4} -map 0:v:0 -f hash -",
                f"ffmpeg -ss 2 -i {mp4} -map 0:v:0 -vf 'select=gt(scene\\,0.10),showinfo' -f null -",
            ],
        }
        for label, commands in cases.items():
            with self.subTest(label=label):
                errors = []
                self.review._validate_full_release_observations(
                    self.folder, packet, dimensions,
                    {"commands": commands, "images": images}, errors,
                )
                self.assertTrue(errors, label)

    def test_failed_commands_and_image_outputs_do_not_count_as_observations(self):
        observations = {
            "commands": [], "images": [], "reads": [], "_pending_images": {},
            "_pending_commands": {}, "_pending_reads": {},
        }
        self.review._collect_observed_actions({
            "type": "command_execution",
            "command": "/bin/bash -lc 'cat script.json'",
            "status": "failed",
            "exit_code": 1,
        }, observations, provider="codex-cli")
        image_path = str((self.folder / "slides" / "01_title.png").resolve())
        wrapper = (
            f'const r = await tools.view_image({{"path":{json.dumps(image_path)},'
            '"detail":"original"}); image(r.image_url,"original");'
        )
        self.review._collect_observed_actions({
            "type": "custom_tool_call", "name": "exec", "call_id": "failed-view", "input": wrapper,
        }, observations, provider="codex-cli")
        self.review._collect_observed_actions({
            "type": "custom_tool_call_output", "call_id": "failed-view", "output": "Script failed",
        }, observations, provider="codex-cli")
        self.assertEqual([], observations["commands"])
        self.assertEqual([], observations["images"])

        for index, output in enumerate((
            "Error: no such file or directory", "Operation not permitted", "ENOENT",
            [{"type": "input_text", "text": "Error: no such file or directory"}],
        )):
            call_id = f"failed-image-{index}"
            self.review._collect_observed_actions({
                "type": "custom_tool_call", "name": "exec",
                "call_id": call_id, "input": wrapper,
            }, observations, provider="codex-cli")
            self.review._collect_observed_actions({
                "type": "custom_tool_call_output", "call_id": call_id, "output": output,
            }, observations, provider="codex-cli")
        self.assertEqual([], observations["images"])

        read_path = str((self.folder / "script.json").resolve())
        self.review._collect_observed_actions({
            "type": "tool_use", "id": "failed-read", "name": "Read",
            "input": {"file_path": read_path},
        }, observations, provider="claude-code")
        self.review._collect_observed_actions({
            "type": "tool_result", "tool_use_id": "failed-read", "is_error": True,
            "content": [{"type": "text", "text": "Permission denied"}],
        }, observations, provider="claude-code")
        self.assertNotIn(read_path, observations["reads"])

    def test_codex_command_wrapper_counts_only_after_matching_success_output(self):
        observations = {
            "commands": [], "images": [], "reads": [], "_pending_images": {},
            "_pending_commands": {}, "_pending_reads": {},
        }
        wrapper = (
            'const r = await tools.exec_command({"cmd":"cat script.json",'
            '"workdir":"/tmp"}); text(JSON.stringify({output:r.output,exit_code:r.exit_code}));'
        )
        call = {
            "type": "custom_tool_call", "name": "exec",
            "call_id": "command-1", "input": wrapper,
        }
        self.review._collect_observed_actions(call, observations, provider="codex-cli")
        self.assertEqual([], observations["commands"])
        self.review._collect_observed_actions({
            "type": "custom_tool_call_output", "call_id": "command-1",
            "output": json.dumps({"output": "ok", "exit_code": 0}),
        }, observations, provider="codex-cli")
        self.assertEqual(["cat script.json"], observations["commands"])

        for index, output in enumerate((
            "", {"isError": True}, '{"isError": true}',
            json.dumps({"output": "failed but noisy", "exit_code": 1}),
            [{"type": "input_text", "text": json.dumps({"output": "ok", "exit_code": 0})},
             {"isError": True}],
            [{"type": "input_text", "text": json.dumps({"output": "ok", "exit_code": 0})},
             {"status": "failed"}],
            [{"type": "input_text", "text": json.dumps({"output": "ok", "exit_code": 0})},
             {"type": "input_text", "text": "ToolError: denied"}],
        )):
            failed = {
                "commands": [], "images": [], "reads": [], "_pending_images": {},
                "_pending_commands": {}, "_pending_reads": {},
            }
            failed_call = {**call, "call_id": f"failed-{index}"}
            self.review._collect_observed_actions(failed_call, failed, provider="codex-cli")
            self.review._collect_observed_actions({
                "type": "custom_tool_call_output", "call_id": f"failed-{index}", "output": output,
            }, failed, provider="codex-cli")
            self.assertEqual([], failed["commands"])

    def test_current_codex_exec_wrapper_rejects_external_or_mutating_command(self):
        for command in (
            "curl https://example.test",
            "git push origin main",
            "python3 -c 'open(\"changed\",\"w\").write(\"x\")'",
            "git reset --hard HEAD",
            "git checkout -- script.json",
            "nc example.test 443",
            "curl\thttps://example.test",
            "git\npush origin main",
        ):
            with self.subTest(command=command):
                self._write_response(provider="codex-cli")
                path = self.folder / self.review.EXECUTION_NAME
                execution = json.loads(path.read_text())
                rollout = Path(execution["rollout_path"])
                event = {
                    "type": "response_item",
                    "payload": {
                        "type": "custom_tool_call",
                        "name": "exec",
                        "input": (
                            f'const r = await tools.exec_command({{cmd:{json.dumps(command)},'
                            'workdir:"/tmp"}); text(JSON.stringify({output:r.output,exit_code:r.exit_code}));'
                        ),
                    },
                }
                rollout.write_text(rollout.read_text() + json.dumps(event) + "\n")
                execution["rollout_sha256"] = self.review.sha256_file(rollout)
                path.write_text(json.dumps(execution))
                result = self.review.validate_review_evidence(self.folder)
                self.assertFalse(result["valid"], result)
                self.assertIn(
                    "review execution contains an unsafe or unverifiable Codex exec wrapper",
                    result["errors"],
                )

    def test_current_codex_exec_wrapper_checks_every_nested_command(self):
        self._write_response(provider="codex-cli")
        path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(path.read_text())
        rollout = Path(execution["rollout_path"])
        event = {
            "type": "response_item",
            "payload": {
                "type": "custom_tool_call",
                "name": "exec",
                "input": (
                    'const a = await tools.exec_command({cmd:"cat script.json"}); '
                    'const b = await tools.exec_command({cmd:"git push origin main"}); '
                    'text(a.output + b.output);'
                ),
            },
        }
        rollout.write_text(rollout.read_text() + json.dumps(event) + "\n")
        execution["rollout_sha256"] = self.review.sha256_file(rollout)
        path.write_text(json.dumps(execution))
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"], result)
        self.assertIn(
            "review execution contains an unsafe or unverifiable Codex exec wrapper",
            result["errors"],
        )

    def test_current_codex_exec_wrapper_rejects_nonliteral_command(self):
        self._write_response(provider="codex-cli")
        path = self.folder / self.review.EXECUTION_NAME
        execution = json.loads(path.read_text())
        rollout = Path(execution["rollout_path"])
        event = {
            "type": "response_item",
            "payload": {
                "type": "custom_tool_call",
                "name": "exec",
                "input": "const cmd = 'cat script.json'; const r = await tools.exec_command({cmd}); text(JSON.stringify({output:r.output,exit_code:r.exit_code}));",
            },
        }
        rollout.write_text(rollout.read_text() + json.dumps(event) + "\n")
        execution["rollout_sha256"] = self.review.sha256_file(rollout)
        path.write_text(json.dumps(execution))
        result = self.review.validate_review_evidence(self.folder)
        self.assertFalse(result["valid"], result)

    def test_current_codex_exec_wrapper_rejects_unconsumed_tool_access(self):
        wrappers = (
            'const a=await tools.exec_command({cmd:"cat script.json"}); await tools["exec_command"]({cmd:"git push origin main"});',
            'const a=await tools.exec_command({cmd:"cat script.json"}); await tools.apply_patch("MUTATE");',
            'const a=await tools.exec_command({cmd:"cat script.json"}); await tools.web__run({search_query:[{q:"x"}]});',
            'const t=tools; const a=await t.exec_command({cmd:"cat script.json"});',
            'const a=await tools.exec_command({cmd:"cat script.json"}); await fetch("https://example.test"); text(a.output);',
            'const a=await tools.exec_command({cmd:"cat script.json"}); await globalThis["to"+"ols"].apply_patch("MUTATE"); text(a.output);',
            'const a=await tools.exec_command({cmd:"cat script.json"}); await dangerous(); text(a.output);',
            'const a=await tools.exec_command({cmd:"cat script.json", get workdir(){ return dangerous(); }}); text(a.output);',
        )
        for wrapper in wrappers:
            with self.subTest(wrapper=wrapper):
                self._write_response(provider="codex-cli")
                path = self.folder / self.review.EXECUTION_NAME
                execution = json.loads(path.read_text())
                rollout = Path(execution["rollout_path"])
                event = {
                    "type": "response_item",
                    "payload": {"type": "custom_tool_call", "name": "exec", "input": wrapper},
                }
                rollout.write_text(rollout.read_text() + json.dumps(event) + "\n")
                execution["rollout_sha256"] = self.review.sha256_file(rollout)
                path.write_text(json.dumps(execution))
                result = self.review.validate_review_evidence(self.folder)
                self.assertFalse(result["valid"], result)
                self.assertIn(
                    "review execution contains an unsafe or unverifiable Codex exec wrapper",
                    result["errors"],
                )

    def test_current_codex_exec_wrapper_requires_numeric_timing_fields(self):
        for field in ("yield_time_ms", "max_output_tokens"):
            with self.subTest(field=field):
                wrapper = (
                    'const r = await tools.exec_command({cmd:"cat script.json",'
                    f'{field}:"1000"}}); text(JSON.stringify({{output:r.output,exit_code:r.exit_code}}));'
                )
                self.assertIsNone(self.review._codex_exec_wrapper_commands(wrapper))

    def test_unhashable_schema_values_fail_closed_without_exception(self) -> None:
        cases = (
            ("status", []),
            ("level", {}),
            ("severity", []),
            ("verdict", []),
        )
        for field, value in cases:
            with self.subTest(field=field):
                response = self._write_response()
                if field == "status":
                    response["dimensions"]["student_safety"]["status"] = value
                elif field == "level":
                    response["dimensions"]["student_safety"]["coverage"]["level"] = value
                elif field == "severity":
                    response["findings"] = [{
                        "id": "F-X",
                        "dimension": "student_safety",
                        "severity": value,
                        "location": {"artifact": "script", "locator": "sections[0]"},
                        "description": "Malformed severity.",
                        "required_action": "Hold.",
                    }]
                    response["dimensions"]["student_safety"]["finding_ids"] = ["F-X"]
                else:
                    response["verdict"] = value
                response_path = self.folder / self.review.RESPONSE_NAME
                response_path.write_text(json.dumps(response), encoding="utf-8")
                execution_path = self.folder / self.review.EXECUTION_NAME
                execution = json.loads(execution_path.read_text(encoding="utf-8"))
                execution["response_sha256"] = self.review.sha256_file(response_path)
                execution_path.write_text(json.dumps(execution), encoding="utf-8")
                result = self.review.validate_review_evidence(self.folder)
                self.assertFalse(result["valid"])
                self.assertEqual("HOLD", result["verdict"])


if __name__ == "__main__":
    unittest.main()
