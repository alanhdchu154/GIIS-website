from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from contextlib import ExitStack, contextmanager, nullcontext
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().parents[1] / "replacement_lifecycle.py"
SPEC = importlib.util.spec_from_file_location("replacement_lifecycle_tested", MODULE_PATH)
assert SPEC and SPEC.loader
replacement = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(replacement)


def manifest(old_id: str = "old123") -> dict:
    row = {
        "course": "Example Course",
        "course_slug": "example-course",
        "module_number": 2,
        "module_title": "Example Module",
        "youtube_id": old_id,
        "url": f"https://youtu.be/{old_id}",
        "embed_url": f"https://www.youtube.com/embed/{old_id}",
        "published_at": "2026-01-01T00:00:00Z",
        "lesson_dir": "example-course-module-2",
    }
    return {
        "generated_at": "2026-01-01T00:00:00Z",
        "source": "youtube-channel",
        "by_course": {"Example Course": [dict(row)]},
        "lessons": [dict(row)],
    }


def bound_plan(root, **changes):
    candidate = root / "candidate"
    candidate.mkdir(exist_ok=True)
    script = candidate / "script.json"
    if not script.exists():
        script.write_text(json.dumps({"course": "Example Course", "module": "Module 2"}))
    mp4 = candidate / "candidate.mp4"
    mp4.write_bytes(b"fixture")
    approval = root / "approval.json"
    approval.write_text("{}")
    return {
        "schema_version": replacement.SCHEMA_VERSION, "state": "prepared",
        "identity": "example:2", "course_slug": "example", "module_number": 2,
        "course": "Example Course", "expected_youtube_title": "Example Course — Module 2",
        "old_video_id": "old123", "candidate_lesson_dir": str(candidate),
        "candidate_mp4": str(mp4), "candidate_mp4_sha256": replacement.sha256_file(mp4),
        "approval_file": str(approval), "privacy": "unlisted", **changes,
    }


class ReplacementLifecycleTests(unittest.TestCase):
    def test_authenticated_upload_inventory_rejects_missing_identity_fields(self) -> None:
        class Request:
            def __init__(self, payload): self.payload = payload
            def execute(self): return self.payload
        class Channels:
            def list(self, **_kwargs):
                return Request({"items": [{
                    "id": "channel-1",
                    "contentDetails": {"relatedPlaylists": {"uploads": "uploads-1"}},
                }]})
        class PlaylistItems:
            def __init__(self, row): self.row = row
            def list(self, **_kwargs): return Request({"items": [self.row]})
        class YouTube:
            def __init__(self, row): self.row = row
            def channels(self): return Channels()
            def playlistItems(self): return PlaylistItems(self.row)

        rows = [
            ({"snippet": {"title": "Expected"}, "contentDetails": {}}, "video ID"),
            ({"snippet": {}, "contentDetails": {"videoId": "opaque123"}}, "lacks a title"),
        ]
        for row, message in rows:
            with self.subTest(message=message), self.assertRaisesRegex(
                replacement.ReplacementError, message,
            ):
                replacement.authenticated_upload_inventory(YouTube(row))

    def test_save_event_rejects_stale_plan_before_write(self) -> None:
        stale = {"state": "uploaded_pending_readback", "identity": "example:2"}
        advanced = {"state": "manifest_published", "identity": "example:2"}
        with patch.object(replacement, "load_plan", return_value=advanced), patch.object(
            replacement, "atomic_write_json"
        ) as write:
            with self.assertRaisesRegex(replacement.ReplacementError, "changed before durable state transition"):
                replacement.save_event(Path("plan.json"), stale, "upload_verified", "late_verifier")
            write.assert_not_called()

    def test_reconcile_upload_adopts_exact_crash_window_result(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan = bound_plan(root, state="upload_intent", playlist_name="Example Course")
            plan_path = root / "plan.json"
            plan_path.write_text(json.dumps(plan))
            intent_path = root / "upload-intent.json"
            intent = {
                **replacement.upload_binding(plan_path, plan),
                "token": "token", "status": "dispatched",
                "reconciliation_nonce": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "pre_dispatch_video_ids": ["old123", "preexisting-1"],
                "started_at": "2026-10-09T00:00:00+00:00",
                "dispatched_at": "2026-10-09T00:01:00+00:00",
            }
            intent_path.write_text(json.dumps(intent))
            adopted = {
                "id": "new456",
                "snippet": {"publishedAt": "2026-10-09T00:02:00Z"},
                "status": {"privacyStatus": "unlisted"},
            }
            with patch.object(
                replacement, "identity_state_path", return_value=intent_path,
            ), patch.object(
                replacement, "load_plan",
                side_effect=lambda path, **_kwargs: json.loads(Path(path).read_text()),
            ), patch.object(
                replacement, "release_lock", return_value=nullcontext(),
            ), patch.object(
                replacement, "identity_lock", return_value=nullcontext(),
            ), patch.object(
                replacement, "youtube_client", return_value=object(),
            ), patch.object(
                replacement, "find_exact_upload_adoption", return_value=adopted,
            ) as find, patch.object(
                replacement, "sync_round_robin",
            ), patch.object(
                replacement, "complete_replacement_media_followups",
            ) as media:
                replacement.reconcile_upload(plan_path, apply=True)
            persisted_plan = json.loads(plan_path.read_text())
            persisted_intent = json.loads(intent_path.read_text())
            script = json.loads((root / "candidate" / "script.json").read_text())
            self.assertEqual("uploaded_pending_readback", persisted_plan["state"])
            self.assertEqual("new456", persisted_plan["new_video_id"])
            self.assertEqual("uploaded", persisted_intent["status"])
            self.assertEqual("new456", script["youtube"]["video_id"])
            self.assertEqual({"old123"}, find.call_args.kwargs["exclude_video_ids"])
            self.assertEqual({"old123", "preexisting-1"}, find.call_args.kwargs["pre_dispatch_video_ids"])
            self.assertEqual("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", find.call_args.kwargs["reconciliation_nonce"])
            media.assert_called_once()

    def test_exact_upload_adoption_refuses_ambiguity(self) -> None:
        class Request:
            def __init__(self, payload):
                self.payload = payload
            def execute(self):
                return self.payload

        class Channels:
            def list(self, **_kwargs):
                return Request({"items": [{
                    "id": "channel-1",
                    "contentDetails": {"relatedPlaylists": {"uploads": "uploads-1"}},
                }]})

        class PlaylistItems:
            def list(self, **_kwargs):
                return Request({"items": [
                    {"contentDetails": {"videoId": "new1"}},
                    {"contentDetails": {"videoId": "new2"}},
                ]})

        published = {"value": "2026-10-09T00:02:00Z"}
        description = {
            "value": "GIIS_UPLOAD_INTENT=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        }

        class Videos:
            def list(self, **_kwargs):
                return Request({"items": [{
                    "id": video_id,
                    "snippet": {
                        "channelId": "channel-1", "title": "Expected",
                        "publishedAt": published["value"],
                        "description": description["value"],
                    },
                    "status": {"privacyStatus": "unlisted"},
                } for video_id in ("new1", "new2")]})

        class YouTube:
            def channels(self): return Channels()
            def playlistItems(self): return PlaylistItems()
            def videos(self): return Videos()

        with self.assertRaisesRegex(replacement.ReplacementError, "2 exact candidates"):
            replacement.find_exact_upload_adoption(
                YouTube(), expected_title="Expected", privacy="unlisted",
                started_at="2026-10-09T00:01:00+00:00",
                reconciliation_nonce="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", pre_dispatch_video_ids=set(),
                exclude_video_ids={"old123"},
            )
        with self.assertRaisesRegex(replacement.ReplacementError, "0 exact candidates"):
            replacement.find_exact_upload_adoption(
                YouTube(), expected_title="Expected", privacy="unlisted",
                started_at="2026-10-09T00:01:00+00:00",
                reconciliation_nonce="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                pre_dispatch_video_ids={"new1", "new2"},
                exclude_video_ids={"old123"},
            )
        published["value"] = "2026-10-09T00:00:00Z"
        with self.assertRaisesRegex(replacement.ReplacementError, "0 exact candidates"):
            replacement.find_exact_upload_adoption(
                YouTube(), expected_title="Expected", privacy="unlisted",
                started_at="2026-10-09T00:01:00+00:00",
                reconciliation_nonce="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                pre_dispatch_video_ids=set(), exclude_video_ids={"old123"},
            )
        published["value"] = "2026-10-09T00:02:00Z"
        description["value"] += "-extra"
        with self.assertRaisesRegex(replacement.ReplacementError, "0 exact candidates"):
            replacement.find_exact_upload_adoption(
                YouTube(), expected_title="Expected", privacy="unlisted",
                started_at="2026-10-09T00:01:00+00:00",
                reconciliation_nonce="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                pre_dispatch_video_ids=set(), exclude_video_ids={"old123"},
            )

    def test_exact_upload_adoption_fails_closed_when_candidate_pages_are_truncated(self) -> None:
        class Request:
            def __init__(self, payload):
                self.payload = payload
            def execute(self):
                return self.payload

        class Channels:
            def list(self, **_kwargs):
                return Request({"items": [{
                    "id": "channel-1",
                    "contentDetails": {"relatedPlaylists": {"uploads": "uploads-1"}},
                }]})

        class PlaylistItems:
            def list(self, **kwargs):
                page = int(kwargs.get("pageToken") or 0)
                return Request({
                    "items": [{"contentDetails": {"videoId": f"candidate-{page}"}}],
                    "nextPageToken": str(page + 1),
                })

        class YouTube:
            def channels(self): return Channels()
            def playlistItems(self): return PlaylistItems()
            def videos(self):
                raise AssertionError("truncated candidate enumeration must fail before video lookup")

        with self.assertRaisesRegex(replacement.ReplacementError, "candidate search exceeded"):
            replacement.find_exact_upload_adoption(
                YouTube(), expected_title="Expected", privacy="unlisted",
                started_at="2026-10-09T00:01:00+00:00",
                reconciliation_nonce="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                pre_dispatch_video_ids=set(), exclude_video_ids={"old123"},
            )

    def test_reconciliation_intent_rejects_missing_or_malformed_recovery_state(self) -> None:
        valid = {
            "reconciliation_nonce": "a" * 48,
            "pre_dispatch_video_ids": ["old123", "preexisting-1"],
            "started_at": "2026-10-09T00:00:00+00:00",
            "dispatched_at": "2026-10-09T00:01:00+00:00",
        }
        nonce, snapshot, dispatched = replacement.validate_reconciliation_intent(
            valid, require_dispatched=True,
        )
        self.assertEqual("a" * 48, nonce)
        self.assertEqual({"old123", "preexisting-1"}, snapshot)
        self.assertEqual(valid["dispatched_at"], dispatched)

        invalid_rows = [
            ({key: value for key, value in valid.items() if key != "pre_dispatch_video_ids"}, "pre-dispatch snapshot"),
            ({**valid, "pre_dispatch_video_ids": "old123"}, "pre-dispatch snapshot"),
            ({**valid, "pre_dispatch_video_ids": ["preexisting-1", "old123"]}, "pre-dispatch snapshot"),
            ({**valid, "reconciliation_nonce": "a" * 48 + "-extra"}, "reconciliation nonce"),
            ({key: value for key, value in valid.items() if key != "dispatched_at"}, "dispatch timestamp"),
            ({**valid, "dispatched_at": "not-a-timestamp"}, "invalid dispatch timestamp"),
            ({**valid, "dispatched_at": "2026-10-08T23:59:00+00:00"}, "predates its start"),
        ]
        for row, message in invalid_rows:
            with self.subTest(message=message), self.assertRaisesRegex(
                replacement.ReplacementError, message,
            ):
                replacement.validate_reconciliation_intent(row, require_dispatched=True)
    def test_verify_upload_reloads_under_identity_lock_before_remote_readback(self) -> None:
        initial = {
            "state": "uploaded_pending_readback", "identity": "example:2",
            "new_video_id": "new456", "expected_youtube_title": "Expected",
        }
        advanced = {**initial, "state": "manifest_published"}
        with patch.object(
            replacement, "load_plan", side_effect=[initial, advanced]
        ), patch.object(
            replacement, "identity_lock", return_value=nullcontext()
        ), patch.object(
            replacement, "validate_replacement_media_plan_receipt", return_value=True
        ), patch.object(replacement, "verify_new_video") as verify:
            with self.assertRaisesRegex(replacement.ReplacementError, "changed before upload readback lock"):
                replacement.verify_upload(Path("plan.json"))
            verify.assert_not_called()

    def test_browser_receipt_requires_exact_iframe_url(self) -> None:
        plan = {
            "course": "Example Course", "module_number": 2,
            "new_video_id": "abcdefghijk",
        }
        base = {
            "status": "PASS", "course": "Example Course", "module_number": 2,
            "video_id": "abcdefghijk",
        }
        with patch.object(replacement, "run"), patch.object(
            replacement, "read_json",
            return_value={
                **base,
                "iframe_src": "https://www.youtube.com/embed/abcdefghijk-extra",
            },
        ):
            with self.assertRaisesRegex(replacement.ReplacementError, "exact expected YouTube embed"):
                replacement.verify_website_browser(
                    plan, Path("receipt.json"), url="https://example.test/lessons", timeout=1,
                )
        with patch.object(replacement, "run"), patch.object(
            replacement, "read_json",
            return_value={
                **base,
                "iframe_src": "https://www.youtube.com/embed/abcdefghijk?rel=0",
            },
        ):
            receipt = replacement.verify_website_browser(
                plan, Path("receipt.json"), url="https://example.test/lessons", timeout=1,
            )
        self.assertEqual("abcdefghijk", receipt["video_id"])

    def test_verify_upload_refuses_missing_optional_media_receipt(self) -> None:
        plan = {
            "state": "uploaded_pending_readback", "identity": "example:2",
            "new_video_id": "new456", "expected_youtube_title": "Expected",
        }
        with patch.object(replacement, "load_plan", return_value=plan), patch.object(
            replacement, "validate_replacement_media_plan_receipt", return_value=False
        ), patch.object(replacement, "youtube_client") as client:
            with self.assertRaisesRegex(replacement.ReplacementError, "optional media follow-up receipt"):
                replacement.verify_upload(Path("plan.json"))
            client.assert_not_called()

    def test_update_manifest_changes_only_exact_row_copies(self) -> None:
        payload = manifest()
        payload["lessons"].append({
            "course": "Other Course", "module_number": 1, "youtube_id": "keep",
            "lesson_dir": "other-course-module-1",
        })
        plan = {
            "course": "Example Course",
            "module_number": 2,
            "manifest_lesson_dir": "example-course-module-2",
            "old_video_id": "old123",
            "new_video_id": "new456",
            "playlist_id": "playlist-1",
            "playlist_name": "Example Course",
        }
        replacement.update_manifest(payload, plan, published_at="2026-02-01T00:00:00Z")
        flat, grouped = replacement.manifest_rows(payload, "Example Course", 2)
        self.assertEqual("new456", flat["youtube_id"])
        self.assertEqual("new456", grouped["youtube_id"])
        self.assertEqual("https://www.youtube.com/embed/new456", flat["embed_url"])
        self.assertEqual("keep", payload["lessons"][1]["youtube_id"])

    def test_update_manifest_refuses_old_id_drift(self) -> None:
        plan = {
            "course": "Example Course",
            "module_number": 2,
            "manifest_lesson_dir": "example-course-module-2",
            "old_video_id": "different",
            "new_video_id": "new456",
        }
        with self.assertRaises(replacement.ReplacementError):
            replacement.update_manifest(manifest(), plan, published_at="2026-02-01T00:00:00Z")

    def test_sync_local_manifest_row_preserves_unrelated_local_changes(self) -> None:
        local = manifest()
        local["lessons"].append({
            "course": "Local Draft", "module_number": 1, "youtube_id": "keep-local"
        })
        live = manifest("new456")
        live["lessons"][0].update({
            "url": "https://youtu.be/new456",
            "embed_url": "https://www.youtube.com/embed/new456",
            "published_at": "2026-02-01T00:00:00Z",
        })
        live["by_course"]["Example Course"][0].update(live["lessons"][0])
        plan = {
            "course": "Example Course",
            "module_number": 2,
            "manifest_lesson_dir": "example-course-module-2",
            "old_video_id": "old123",
            "new_video_id": "new456",
        }
        self.assertTrue(replacement.sync_local_manifest_row(local, live, plan))
        flat, grouped = replacement.manifest_rows(local, "Example Course", 2)
        self.assertEqual("new456", flat["youtube_id"])
        self.assertEqual("new456", grouped["youtube_id"])
        self.assertEqual("keep-local", local["lessons"][1]["youtube_id"])

    def test_sync_canonical_script_is_idempotent_after_new_id_is_written(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            canonical = root / "canonical"
            candidate = root / "candidate"
            canonical.mkdir()
            candidate.mkdir()
            canonical_script = {
                "youtube": {
                    "video_id": "new456",
                    "playlist_id": "playlist-1",
                    "synced_at": "2026-02-01T00:00:00Z",
                }
            }
            (canonical / "script.json").write_text(json.dumps(canonical_script))
            (candidate / "script.json").write_text(json.dumps({"youtube": {"video_id": "new456"}}))
            plan = {
                "canonical_lesson_dir": str(canonical),
                "candidate_lesson_dir": str(candidate),
                "old_video_id": "old123",
                "new_video_id": "new456",
            }

            replacement.sync_canonical_script(plan)

            self.assertEqual(canonical_script, json.loads((canonical / "script.json").read_text()))

    def test_verify_live_does_not_sync_canonical_before_local_manifest(self) -> None:
        plan = {
            "identity": "example:2",
            "state": "manifest_published",
            "course": "Example Course",
            "module_number": 2,
            "expected_youtube_title": "Expected",
            "old_video_id": "old123",
            "new_video_id": "new456",
        }
        with tempfile.TemporaryDirectory() as tmp, patch.object(
            replacement, "load_plan", return_value=plan
        ), patch.object(
            replacement, "fetch_live_manifest", return_value=manifest("new456")
        ), patch.object(
            replacement, "youtube_client", return_value=object()
        ), patch.object(
            replacement, "verify_new_video", return_value={"video_id": "new456"}
        ), patch.object(
            replacement, "verify_oembed", return_value={"title": "Expected"}
        ), patch.object(
            replacement, "sync_local_manifest", side_effect=replacement.ReplacementError("local drift")
        ), patch.object(replacement, "sync_canonical_script") as sync_script:
            with self.assertRaises(replacement.ReplacementError):
                replacement.verify_live(
                    Path(tmp) / "plan.json",
                    url="https://example.test/manifest.json",
                    timeout=0,
                    interval=0,
                )
            sync_script.assert_not_called()

    def test_verify_live_holds_release_and_identity_locks_during_local_sync(self) -> None:
        plan = {
            "identity": "example:2",
            "state": "manifest_published",
            "course": "Example Course",
            "module_number": 2,
            "expected_youtube_title": "Expected",
            "old_video_id": "old123",
            "new_video_id": "new456",
        }
        held = {"release": False, "identity": False}

        @contextmanager
        def release_guard():
            held["release"] = True
            try:
                yield object()
            finally:
                held["release"] = False

        @contextmanager
        def identity_guard(identity):
            self.assertEqual("example:2", identity)
            held["identity"] = True
            try:
                yield object()
            finally:
                held["identity"] = False

        def assert_locked(*_args, **_kwargs):
            self.assertTrue(held["release"])
            self.assertTrue(held["identity"])

        with tempfile.TemporaryDirectory() as tmp, patch.object(
            replacement, "load_plan", return_value=plan
        ), patch.object(
            replacement, "fetch_live_manifest", return_value=manifest("new456")
        ), patch.object(
            replacement, "youtube_client", return_value=object()
        ), patch.object(
            replacement, "verify_new_video", return_value={"video_id": "new456"}
        ), patch.object(
            replacement, "verify_oembed", return_value={"title": "Expected"}
        ), patch.object(
            replacement, "release_lock", side_effect=release_guard
        ), patch.object(
            replacement, "identity_lock", side_effect=identity_guard
        ), patch.object(
            replacement, "atomic_write_json", side_effect=assert_locked
        ), patch.object(
            replacement, "sync_local_manifest",
            side_effect=lambda *_: (assert_locked(), Path(tmp) / "receipt.json")[1]
        ), patch.object(
            replacement, "sync_canonical_script", side_effect=assert_locked
        ), patch.object(
            replacement, "save_event", side_effect=assert_locked
        ):
            replacement.verify_live(
                Path(tmp) / "plan.json",
                url="https://example.test/manifest.json",
                timeout=0,
                interval=0,
            )
        self.assertEqual({"release": False, "identity": False}, held)

    def test_manifest_rows_refuses_divergent_copies(self) -> None:
        payload = manifest()
        payload["by_course"]["Example Course"][0]["youtube_id"] = "different"
        with self.assertRaises(replacement.ReplacementError):
            replacement.manifest_rows(payload, "Example Course", 2)

    def test_upload_dry_run_uses_staged_replacement_mode(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            candidate = root / "candidate"
            candidate.mkdir()
            mp4 = candidate / "candidate.mp4"
            mp4.write_bytes(b"mp4")
            approval = root / "approval.json"
            approval.write_text("{}")
            plan_path = root / "plan.json"
            plan = {
                "state": "prepared",
                "candidate_lesson_dir": str(candidate),
                "approval_file": str(approval),
                "privacy": "unlisted",
            }
            with patch.object(replacement, "load_plan", return_value=plan), patch("builtins.print") as printed:
                replacement.upload(plan_path, apply=False)
            output = "\n".join(str(call.args[0]) for call in printed.call_args_list)
            self.assertIn("--replacement", output)
            self.assertIn("[dry-run] no upload performed", output)

    def test_publish_manifest_dry_run_does_not_acquire_release_lock(self) -> None:
        plan = {
            "state": "upload_verified",
            "published_at": "2026-02-01T00:00:00Z",
            "course": "Example Course",
            "module_number": 2,
            "manifest_lesson_dir": "example-course-module-2",
            "manifest_sha256_before": "before",
            "old_video_id": "old123",
            "new_video_id": "new456",
            "playlist_id": "playlist-1",
            "playlist_name": "Example Course",
        }
        with patch.object(replacement, "load_plan", return_value=plan), patch.object(
            replacement, "run"
        ), patch.object(
            replacement, "git_show_manifest", return_value=(manifest(), "before")
        ), patch.object(replacement, "acquire_release_lock") as acquire:
            replacement.publish_manifest(Path("plan.json"), apply=False)
        acquire.assert_not_called()

    def test_publish_manifest_recovers_post_push_crash_from_exact_commit(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_path = root / "replacement-plan.json"
            plan = {
                "state": "upload_verified", "identity": "example:2",
                "published_at": "2026-02-01T00:00:00Z",
                "course": "Example Course", "module_number": 2,
                "manifest_lesson_dir": "example-course-module-2",
                "manifest_sha256_before": "before", "old_video_id": "old123",
                "new_video_id": "new456", "playlist_id": "playlist-1",
                "playlist_name": "Example Course",
            }
            intent_path = root / "manifest-intent.json"
            intent = {
                **replacement.manifest_publish_binding(plan_path, plan),
                "status": "commit_ready", "commit": "commit123",
                "manifest_sha256_after": "commit-manifest-sha",
            }
            intent_path.write_text(json.dumps(intent))
            with patch.object(replacement, "load_plan", return_value=plan), patch.object(
                replacement, "release_lock", return_value=nullcontext()
            ), patch.object(replacement, "identity_lock", return_value=nullcontext()), patch.object(
                replacement, "identity_state_path", return_value=intent_path
            ), patch.object(
                replacement, "git_show_manifest",
                side_effect=[(manifest("new456"), "remote-after"),
                             (manifest("new456"), "commit-manifest-sha")],
            ), patch.object(
                replacement, "run", return_value=subprocess.CompletedProcess([], 0, "", "")
            ) as run, patch.object(replacement, "save_event") as save:
                replacement.publish_manifest(plan_path, apply=True)
            self.assertEqual("manifest_published", save.call_args.args[2])
            self.assertEqual("manifest_push_recovered", save.call_args.args[3])
            self.assertTrue(any(
                call.args[0][:3] == ["git", "merge-base", "--is-ancestor"]
                for call in run.call_args_list
            ))

    def test_retire_dry_run_never_calls_delete(self) -> None:
        plan = {
            "identity": "example-course:2",
            "state": "website_verified",
            "course": "Example Course",
            "module_number": 2,
            "expected_youtube_title": "Expected",
            "old_video_id": "old123",
            "new_video_id": "new456",
            "playlist_id": "playlist-1",
            "playlist_name": "Example Course",
        }

        class Videos:
            def delete(self, **_kwargs):
                raise AssertionError("delete must not be called during dry-run")

        class YouTube:
            def videos(self):
                return Videos()

        with patch.object(replacement, "load_plan", return_value=plan), patch.object(
            replacement, "fetch_live_manifest", return_value=manifest("new456")
        ), patch.object(replacement, "youtube_client", return_value=YouTube()), patch.object(
            replacement,
            "verify_new_video",
            return_value={"video_id": "new456", "channel_id": "channel-1"},
        ), patch.object(
            replacement,
            "youtube_video",
            return_value={
                "id": "old123",
                "snippet": {"channelId": "channel-1", "title": "Expected"},
            },
        ), patch.object(
            replacement,
            "ensure_playlist_continuity",
            return_value={"needs_insert": True, "new_present": False, "old_present": True},
        ), patch.object(replacement, "acquire_release_lock") as acquire:
            replacement.retire_old(Path("plan.json"), apply=False, live_url="https://example.test/manifest.json")
        acquire.assert_not_called()

    def test_retire_apply_recovers_when_old_id_is_already_absent(self) -> None:
        plan = {
            "identity": "example-course:2",
            "state": "website_verified",
            "course": "Example Course",
            "module_number": 2,
            "expected_youtube_title": "Expected",
            "old_video_id": "old123",
            "new_video_id": "new456",
            "playlist_id": "playlist-1",
            "playlist_name": "Example Course",
        }

        class Videos:
            def delete(self, **_kwargs):
                raise AssertionError("already-absent retry must not delete again")

        class YouTube:
            def videos(self):
                return Videos()

        with tempfile.TemporaryDirectory() as tmp:
            plan_path = Path(tmp) / "plan.json"
            with patch.object(
            replacement, "load_plan", return_value=plan
        ), patch.object(replacement, "fetch_live_manifest", return_value=manifest("new456")), patch.object(
            replacement, "youtube_client", return_value=YouTube()
        ), patch.object(
            replacement, "verify_new_video", return_value={"video_id": "new456", "channel_id": "channel-1"}
        ), patch.object(
            replacement, "verify_oembed", return_value={"title": "Expected"}
        ), patch.object(replacement, "youtube_video", return_value=None), patch.object(
            replacement, "save_event"
        ) as save, patch.object(
            replacement,
            "ensure_playlist_continuity",
            side_effect=[
                {"needs_insert": False, "new_present": True, "inserted": False},
                {"needs_insert": False, "new_present": True, "old_present": False, "inserted": False},
            ],
        ), patch.object(
            replacement,
            "remove_old_playlist_entry",
            return_value={"old_playlist_item_present": False, "old_playlist_item_removed": False},
        ), patch.object(
            replacement,
            "verify_website_browser",
            return_value={"status": "PASS", "video_id": "new456"},
            ), patch.object(replacement, "acquire_release_lock", return_value=nullcontext()):
                replacement.retire_old(plan_path, apply=True, live_url="https://example.test/manifest.json")
                self.assertEqual("replaced", save.call_args.args[2])
                self.assertIn("post_retirement_browser_readback", save.call_args.kwargs)
                receipt = json.loads(replacement.plan_artifact_path(
                    plan_path, "old-video-retirement"
                ).read_text())
                self.assertTrue(receipt["already_absent_on_entry"])

    def test_retire_apply_rechecks_live_manifest_immediately_before_delete(self) -> None:
        plan = {
            "identity": "example-course:2",
            "state": "website_verified",
            "course": "Example Course",
            "module_number": 2,
            "expected_youtube_title": "Expected",
            "old_video_id": "old123",
            "new_video_id": "new456",
            "playlist_id": "playlist-1",
            "playlist_name": "Example Course",
        }

        class Request:
            def execute(self):
                return {}

        class Videos:
            def __init__(self):
                self.deleted = []

            def delete(self, **kwargs):
                events.append("delete")
                self.deleted.append(kwargs["id"])
                return Request()

        class YouTube:
            def __init__(self):
                self.video_api = Videos()

            def videos(self):
                return self.video_api

        yt = YouTube()
        events = []
        old_video = {
            "id": "old123",
            "snippet": {"channelId": "channel-1", "title": "Expected"},
        }
        def browser(*args, **kwargs):
            events.append("browser")
            self.assertEqual(2, fetch_live.call_count)
            if fail_browser:
                raise replacement.ReplacementError("browser failed")
            return {"status": "PASS"}

        fail_browser = True
        with tempfile.TemporaryDirectory() as tmp, patch.object(
            replacement, "load_plan", return_value=plan
        ), patch.object(
            replacement,
            "fetch_live_manifest",
            return_value=manifest("new456"),
        ) as fetch_live, patch.object(
            replacement, "youtube_client", return_value=yt
        ), patch.object(
            replacement, "verify_new_video", return_value={"video_id": "new456", "channel_id": "channel-1"}
        ), patch.object(
            replacement, "verify_oembed", return_value={"title": "Expected"}
        ), patch.object(
            replacement, "youtube_video", side_effect=[old_video, old_video, None]
        ), patch.object(
            replacement,
            "ensure_playlist_continuity",
            side_effect=[
                {"needs_insert": False, "new_present": True, "old_present": True, "inserted": False},
                {"needs_insert": False, "new_present": True, "old_present": True, "inserted": False},
                {"needs_insert": False, "new_present": True, "old_present": False, "inserted": False},
            ],
        ), patch.object(
            replacement,
            "remove_old_playlist_entry",
            return_value={"old_playlist_item_present": False, "old_playlist_item_removed": True},
        ), patch.object(
            replacement, "verify_website_browser", side_effect=browser
        ), patch.object(replacement, "save_event"), patch.object(
            replacement, "acquire_release_lock", return_value=nullcontext()
        ):
            with self.assertRaisesRegex(replacement.ReplacementError, "browser failed"):
                replacement.retire_old(Path(tmp) / "plan.json", apply=True, live_url="https://example.test/manifest.json")
            self.assertEqual([], yt.video_api.deleted)
            events.clear()
            fetch_live.reset_mock()
            fail_browser = False
            replacement.retire_old(Path(tmp) / "plan.json", apply=True, live_url="https://example.test/manifest.json")

        self.assertEqual(2, fetch_live.call_count)
        self.assertEqual(["old123"], yt.video_api.deleted)
        self.assertEqual(["browser", "delete", "browser"], events)

    def test_playlist_transfer_inserts_new_video_at_old_position_once(self) -> None:
        class Request:
            def __init__(self, payload):
                self.payload = payload

            def execute(self):
                return self.payload

        class Playlists:
            def list(self, **_kwargs):
                return Request({"items": [{
                    "id": "playlist-1",
                    "snippet": {"channelId": "channel-1", "title": "Example Course"},
                }]})

        class PlaylistItems:
            def __init__(self):
                self.rows = [{"id": "old-item", "video_id": "old123", "position": 3}]
                self.insert_bodies = []

            def list(self, **_kwargs):
                return Request({"items": [{
                    "id": row["id"],
                    "snippet": {
                        "position": row["position"],
                        "resourceId": {"videoId": row["video_id"]},
                    },
                    "contentDetails": {"videoId": row["video_id"]},
                } for row in self.rows]})

            def insert(self, **kwargs):
                self.insert_bodies.append(kwargs["body"])
                snippet = kwargs["body"]["snippet"]
                self.rows.append({
                    "id": "new-item",
                    "video_id": snippet["resourceId"]["videoId"],
                    "position": snippet.get("position", len(self.rows)),
                })
                return Request({"id": "new-item"})

        class YouTube:
            def __init__(self):
                self.items = PlaylistItems()

            def playlists(self):
                return Playlists()

            def playlistItems(self):
                return self.items

        yt = YouTube()
        plan = {
            "identity": "example:2",
            "playlist_id": "playlist-1",
            "playlist_name": "Example Course",
            "old_video_id": "old123",
            "new_video_id": "new456",
        }
        with tempfile.TemporaryDirectory() as tmp, patch.object(
            replacement, "identity_state_path",
            side_effect=lambda _identity, suffix: Path(tmp) / f"state{suffix}",
        ), patch.object(
            replacement, "playlist_lock", return_value=nullcontext(),
        ) as lock:
            receipt = replacement.ensure_playlist_continuity(
                plan, yt, channel_id="channel-1", old_video_exists=True, apply=True
            )
        lock.assert_called_once_with("Example Course")
        self.assertTrue(receipt["inserted"])
        self.assertTrue(receipt["new_present"])
        self.assertEqual(3, yt.items.insert_bodies[0]["snippet"]["position"])

    def test_old_playlist_entry_is_removed_and_read_back(self) -> None:
        class Request:
            def __init__(self, payload):
                self.payload = payload

            def execute(self):
                return self.payload

        class PlaylistItems:
            def __init__(self):
                self.rows = [{"id": "old-item", "video_id": "old123", "position": 2}]

            def list(self, **_kwargs):
                return Request({"items": [{
                    "id": row["id"],
                    "snippet": {"position": row["position"], "resourceId": {"videoId": row["video_id"]}},
                    "contentDetails": {"videoId": row["video_id"]},
                } for row in self.rows]})

            def delete(self, **kwargs):
                self.rows = [row for row in self.rows if row["id"] != kwargs["id"]]
                return Request({})

        class YouTube:
            def __init__(self):
                self.items = PlaylistItems()

            def playlistItems(self):
                return self.items

            def playlists(self):
                class Playlists:
                    def list(self, **_kwargs):
                        return Request({"items": [{
                            "id": "playlist-1",
                            "snippet": {"title": "Example Course"},
                        }]})
                return Playlists()

        yt = YouTube()
        with patch.object(replacement, "playlist_lock", return_value=nullcontext()):
            receipt = replacement.remove_old_playlist_entry(
                {"playlist_id": "playlist-1", "playlist_name": "Example Course",
                 "old_video_id": "old123"}, yt, apply=True
            )
        self.assertTrue(receipt["old_playlist_item_removed"])
        self.assertFalse(receipt["old_playlist_item_present"])

    def test_replacement_dispatched_playlist_intent_never_replays_insert(self) -> None:
        class Request:
            def __init__(self, payload):
                self.payload = payload

            def execute(self):
                return self.payload

        class Playlists:
            def list(self, **_kwargs):
                return Request({"items": [{
                    "id": "playlist-1",
                    "snippet": {"channelId": "channel-1", "title": "Example Course"},
                }]})

        class PlaylistItems:
            def __init__(self):
                self.inserts = 0

            def list(self, **_kwargs):
                return Request({"items": [{
                    "id": "old-item",
                    "snippet": {"position": 1, "resourceId": {"videoId": "old123"}},
                    "contentDetails": {"videoId": "old123"},
                }]})

            def insert(self, **_kwargs):
                self.inserts += 1
                return Request({"id": "should-not-run"})

        class YouTube:
            def __init__(self):
                self.items = PlaylistItems()

            def playlists(self):
                return Playlists()

            def playlistItems(self):
                return self.items

        plan = {
            "identity": "example:2", "playlist_id": "playlist-1",
            "playlist_name": "Example Course", "old_video_id": "old123",
            "new_video_id": "new456",
        }
        with tempfile.TemporaryDirectory() as tmp:
            intent_path = Path(tmp) / "intent.json"
            intent_path.write_text(json.dumps({
                "schema_version": "giis.youtube-replacement-playlist.v1",
                **plan,
                "status": "dispatched",
            }))
            yt = YouTube()
            with patch.object(
                replacement, "identity_state_path", return_value=intent_path
            ), patch.object(replacement, "playlist_lock", return_value=nullcontext()):
                with self.assertRaisesRegex(replacement.ReplacementError, "no insert replayed"):
                    replacement.ensure_playlist_continuity(
                        plan, yt, channel_id="channel-1", old_video_exists=True, apply=True,
                    )
            self.assertEqual(0, yt.items.inserts)

    def test_present_replacement_membership_rejects_mismatched_intent(self) -> None:
        class Request:
            def __init__(self, payload):
                self.payload = payload

            def execute(self):
                return self.payload

        class Playlists:
            def list(self, **_kwargs):
                return Request({"items": [{
                    "id": "playlist-1",
                    "snippet": {"channelId": "channel-1", "title": "Example Course"},
                }]})

        class PlaylistItems:
            def list(self, **_kwargs):
                return Request({"items": [{
                    "id": "new-item",
                    "snippet": {"position": 1, "resourceId": {"videoId": "new456"}},
                    "contentDetails": {"videoId": "new456"},
                }]})

        class YouTube:
            def playlists(self):
                return Playlists()

            def playlistItems(self):
                return PlaylistItems()

        plan = {
            "identity": "example:2", "playlist_id": "playlist-1",
            "playlist_name": "Example Course", "old_video_id": "old123",
            "new_video_id": "new456",
        }
        with tempfile.TemporaryDirectory() as tmp:
            intent_path = Path(tmp) / "intent.json"
            intent_path.write_text(json.dumps({
                **replacement.replacement_playlist_binding(plan),
                "new_video_id": "different-video",
                "status": "dispatched",
            }))
            with patch.object(
                replacement, "identity_state_path", return_value=intent_path,
            ), patch.object(replacement, "playlist_lock", return_value=nullcontext()):
                with self.assertRaisesRegex(
                    replacement.ReplacementError,
                    "replacement playlist intent new_video_id mismatch",
                ):
                    replacement.ensure_playlist_continuity(
                        plan, YouTube(), channel_id="channel-1",
                        old_video_exists=True, apply=True,
                    )
            self.assertEqual(
                "different-video", json.loads(intent_path.read_text())["new_video_id"],
            )

    def test_staged_manifest_guard_rejects_any_extra_file(self) -> None:
        replacement.require_only_manifest_staged([str(replacement.MANIFEST_REL)])
        with self.assertRaises(replacement.ReplacementError):
            replacement.require_only_manifest_staged([str(replacement.MANIFEST_REL), "ROADMAP.md"])

    def test_upload_recovers_durable_result_without_duplicate_upload(self):
        for script_saved in (False, True):
            with self.subTest(script_saved=script_saved), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                plan = bound_plan(root, state="upload_intent")
                plan_path = root / "plan.json"
                script_path = root / "candidate/script.json"
                with patch.object(replacement, "load_plan", return_value=plan), patch.object(
                    replacement, "acquire_release_lock", return_value=nullcontext()
                ), patch.object(replacement, "save_event") as save, patch.object(replacement, "run") as run, patch.object(
                    replacement, "canonical_release_lock_path", return_value=root / "locks/release.lock"
                ), patch.object(
                    replacement, "complete_replacement_media_followups"
                ):
                    intent = replacement.claim_upload(plan_path, plan, pre_dispatch_video_ids=["old123"])
                    intent.update(
                        status="uploaded",
                        dispatched_at=intent["started_at"],
                        youtube={"video_id": "new456"},
                    )
                    replacement.atomic_write_json(replacement.identity_state_path(plan["identity"], ".upload.json"), intent)
                    if script_saved:
                        script = json.loads(script_path.read_text())
                        script["youtube"] = intent["youtube"]
                        script_path.write_text(json.dumps(script))
                    replacement.upload(plan_path, apply=True)
                run.assert_not_called()
                self.assertEqual("uploaded_pending_readback", save.call_args.args[2])
                self.assertEqual("new456", save.call_args.kwargs["new_video_id"])
                self.assertEqual("new456", json.loads(script_path.read_text())["youtube"]["video_id"])

    def test_existing_new_id_without_durable_intent_is_not_adopted(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan = bound_plan(root)
            script_path = root / "candidate/script.json"
            script = json.loads(script_path.read_text())
            script["youtube"] = {"video_id": "untracked"}
            script_path.write_text(json.dumps(script))
            with patch.object(replacement, "load_plan", return_value=plan), patch.object(
                replacement, "acquire_release_lock", return_value=nullcontext()
            ), patch.object(replacement, "save_event") as save, patch.object(replacement, "run") as run, patch.object(
                replacement, "canonical_release_lock_path", return_value=root / "locks/release.lock"
            ):
                with self.assertRaises(replacement.ReplacementError):
                    replacement.upload(root / "plan.json", apply=True)
            run.assert_not_called()
            save.assert_not_called()

    def test_upload_intent_without_persisted_id_blocks_duplicate_retry(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan = bound_plan(root, state="upload_intent")
            with patch.object(replacement, "load_plan", return_value=plan), patch.object(
                replacement, "acquire_release_lock", return_value=nullcontext()
            ), patch.object(replacement, "run") as run, patch.object(
                replacement, "canonical_release_lock_path", return_value=root / "locks/release.lock"
            ):
                replacement.claim_upload(root / "plan.json", plan, pre_dispatch_video_ids=["old123"])
                with self.assertRaisesRegex(replacement.ReplacementError, "prior upload outcome is unresolved"):
                    replacement.upload(root / "plan.json", apply=True)
            run.assert_not_called()

    def test_upload_preflight_rejects_origin_manifest_drift(self) -> None:
        plan = {
            "manifest_sha256_before": "expected",
            "course": "Example Course",
            "module_number": 2,
            "old_video_id": "old123",
            "manifest_lesson_dir": "example-course-module-2",
        }
        with patch.object(replacement, "run"), patch.object(
            replacement, "git_show_manifest", return_value=(manifest(), "changed")
        ):
            with self.assertRaisesRegex(replacement.ReplacementError, "changed since prepare"):
                replacement.verify_origin_manifest_unchanged(plan)

    def test_identity_lock_fails_closed_on_overlap(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, patch.object(
            replacement, "canonical_release_lock_path", return_value=Path(tmp) / "release.lock"
        ), patch.object(replacement.fcntl, "flock", side_effect=BlockingIOError):
            with self.assertRaisesRegex(replacement.ReplacementError, "another worker holds"):
                with replacement.identity_lock("example-course:2"):
                    self.fail("overlapping identity lock must not be entered")

    def linked_roots(self, root):
        primary, linked = root / "primary", root / "linked"
        primary.mkdir()
        linked.mkdir()
        subprocess.run(["git", "init", "-q", str(primary)], check=True, capture_output=True)
        metadata = primary / ".git" / "worktrees" / "linked"
        metadata.mkdir(parents=True)
        (metadata / "commondir").write_text("../..")
        (metadata / "HEAD").write_text("ref: refs/heads/main\n")
        (metadata / "gitdir").write_text(str(linked / ".git"))
        (linked / ".git").write_text(f"gitdir: {metadata}\n")
        return primary, linked

    def test_linked_worktrees_share_identity_and_release_locks(self):
        with tempfile.TemporaryDirectory() as tmp:
            primary, linked = self.linked_roots(Path(tmp))
            with patch.object(replacement, "ROOT", primary):
                expected = replacement.identity_state_path("example:2", ".lock")
                with replacement.identity_lock("example:2"), replacement.release_lock():
                    with patch.object(replacement, "ROOT", linked):
                        self.assertEqual(expected, replacement.identity_state_path("example:2", ".lock"))
                        with self.assertRaises(replacement.ReplacementError):
                            with replacement.identity_lock("example:2"):
                                self.fail("identity overlap")
                        with self.assertRaises(replacement.ReplacementError):
                            with replacement.release_lock():
                                self.fail("release overlap")
                    code = "import fcntl,sys; f=open(sys.argv[1], 'a+'); fcntl.flock(f, fcntl.LOCK_EX|fcntl.LOCK_NB)"
                    child = subprocess.run([sys.executable, "-c", code, str(expected)], capture_output=True)
                    self.assertNotEqual(0, child.returncode)
                    self.assertIn(b"BlockingIOError", child.stderr)

    def test_shared_intent_blocks_alternate_plan_and_worktree(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            primary, linked = self.linked_roots(root)
            plan = bound_plan(root)
            with patch.object(replacement, "ROOT", primary), replacement.identity_lock("example:2"):
                replacement.claim_upload(primary / "plan.json", plan, pre_dispatch_video_ids=["old123"])
            with patch.object(replacement, "ROOT", linked), replacement.identity_lock("example:2"):
                with self.assertRaisesRegex(replacement.ReplacementError, "shared upload intent"):
                    replacement.claim_upload(linked / "another-plan.json", plan, pre_dispatch_video_ids=["old123"])

    def test_completed_replacement_chain_allows_next_old_id_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            primary, linked = self.linked_roots(root)
            first_path = primary / "first.json"
            first = bound_plan(root, new_video_id="new456", state="website_verified")
            first_path.write_text(json.dumps(first))
            second = bound_plan(root, old_video_id="new456")
            with patch.object(replacement, "ROOT", primary), replacement.identity_lock("example:2"):
                replacement.claim_upload(first_path, first, pre_dispatch_video_ids=["old123"])
            with patch.object(replacement, "ROOT", linked), replacement.identity_lock("example:2"):
                with self.assertRaisesRegex(replacement.ReplacementError, "unresolved"):
                    replacement.claim_upload(linked / "second.json", second, pre_dispatch_video_ids=["old123"])
                first["state"] = "replaced"
                first_path.write_text(json.dumps(first))
                with self.assertRaisesRegex(replacement.ReplacementError, "chain does not match"):
                    replacement.claim_upload(linked / "second.json", {**second, "old_video_id": "unrelated"}, pre_dispatch_video_ids=["old123"])
                replacement.claim_upload(linked / "second.json", second, pre_dispatch_video_ids=["old123"])
                receipt = json.loads(replacement.identity_state_path("example:2", ".upload.json").read_text())
                self.assertEqual("new456", receipt["old_video_id"])

    def test_default_plan_path_preserves_completed_chain(self):
        with tempfile.TemporaryDirectory() as tmp:
            plan_dir = Path(tmp)
            default = plan_dir / "replacement-plan.json"
            default.write_text(json.dumps({"state": "replaced", "new_video_id": "new456"}))
            selected = replacement.choose_plan_path(plan_dir, None, "a" * 64)
            self.assertNotEqual(default, selected)
            self.assertTrue(default.is_file())
            self.assertEqual("replaced", json.loads(default.read_text())["state"])
            self.assertIn("aaaaaaaaaaaa", selected.name)
            with self.assertRaisesRegex(replacement.ReplacementError, "already exists"):
                replacement.choose_plan_path(plan_dir, default, "b" * 64)

    def test_plan_path_never_overwrites_active_or_explicit_plan(self):
        with tempfile.TemporaryDirectory() as tmp:
            plan_dir = Path(tmp)
            default = plan_dir / "replacement-plan.json"
            for state in ("prepared", "upload_verified"):
                default.write_text(json.dumps({"state": state}))
                with self.subTest(state=state), self.assertRaisesRegex(
                    replacement.ReplacementError, "active replacement plan"
                ):
                    replacement.choose_plan_path(plan_dir, None, "a" * 64)
            default.write_text(json.dumps({"state": "replaced"}))
            explicit = plan_dir / "replacement-plan-explicit.json"
            explicit.write_text(json.dumps({"state": "replaced"}))
            with self.assertRaisesRegex(replacement.ReplacementError, "already exists"):
                replacement.choose_plan_path(plan_dir, explicit, "b" * 64)
            invalid = plan_dir / "explicit.json"
            with self.assertRaisesRegex(replacement.ReplacementError, "replacement-plan"):
                replacement.choose_plan_path(plan_dir, invalid, "b" * 64)
            outside = plan_dir.parent / "replacement-plan-outside.json"
            with self.assertRaisesRegex(replacement.ReplacementError, "canonical replacement directory"):
                replacement.choose_plan_path(plan_dir, outside, "b" * 64)

    def test_versioned_active_plan_blocks_another_prepare(self):
        with tempfile.TemporaryDirectory() as tmp:
            plan_dir = Path(tmp)
            (plan_dir / "replacement-plan.json").write_text(json.dumps({"state": "replaced"}))
            active = plan_dir / "replacement-plan-20261009T000000000000Z-abc.json"
            active.write_text(json.dumps({"state": "manifest_published"}))
            with self.assertRaisesRegex(replacement.ReplacementError, "active replacement plan"):
                replacement.choose_plan_path(plan_dir, None, "c" * 64)

    def test_plan_specific_evidence_paths_do_not_overwrite_completed_chain(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            first = root / "replacement-plan.json"
            second = root / "replacement-plan-20261009T000000000001Z-abc.json"
            same_stem_other_suffix = root / "replacement-plan.txt"
            first_receipt = replacement.plan_artifact_path(first, "youtube-upload-readback")
            second_receipt = replacement.plan_artifact_path(second, "youtube-upload-readback")
            same_stem_receipt = replacement.plan_artifact_path(
                same_stem_other_suffix, "youtube-upload-readback"
            )
            self.assertNotEqual(first_receipt, second_receipt)
            self.assertNotEqual(first_receipt, same_stem_receipt)
            first_receipt.write_text('{"video_id":"first"}')
            second_receipt.write_text('{"video_id":"second"}')
            self.assertEqual("first", json.loads(first_receipt.read_text())["video_id"])

    def test_busy_release_lock_stops_upload_before_external_preflight(self):
        plan = {"identity": "example:2", "state": "prepared", "candidate_lesson_dir": "/candidate",
                "approval_file": "/approval.json", "privacy": "unlisted"}
        with patch.object(replacement, "load_plan", return_value=plan), patch.object(
            replacement, "acquire_release_lock", side_effect=replacement.ReleaseLockError("busy")
        ), patch.object(replacement, "youtube_client") as client, patch.object(replacement, "run") as run:
            with self.assertRaisesRegex(replacement.ReplacementError, "shared release lock unavailable"):
                replacement.upload(Path("/plan.json"), apply=True)
            client.assert_not_called()
            run.assert_not_called()

    def test_upload_holds_both_locks_through_preflight_and_upload(self):
        with tempfile.TemporaryDirectory() as tmp:
            # macOS exposes TemporaryDirectory paths through both /var and
            # /private/var.  Use one canonical spelling so the handoff test
            # exercises identity binding instead of a path-alias mismatch.
            root = Path(tmp).resolve()
            primary, linked = self.linked_roots(root)
            candidate = root / "candidate"
            candidate.mkdir()
            script = candidate / "script.json"
            plan = bound_plan(root)
            def assert_locked(*args):
                with self.assertRaises(replacement.ReleaseLockError):
                    replacement.acquire_release_lock(linked, owner="contender")
                with patch.object(replacement, "ROOT", linked):
                    with self.assertRaises(replacement.ReplacementError):
                        with replacement.identity_lock("example:2"):
                            self.fail("identity must be held")
                return {}
            def uploaded(command, *, pass_fds):
                assert_locked()
                self.assertTrue(replacement.identity_state_path("example:2", ".upload.json").exists())
                self.assertEqual("upload_intent", plan["state"])
                self.assertIn("--replacement-plan", command)
                self.assertEqual(2, len(pass_fds))
                handoff = replacement.consume_upload_handoff(
                    Path(command[command.index("--replacement-plan") + 1]),
                    command[command.index("--replacement-token") + 1],
                    candidate, Path(plan["approval_file"]), Path(plan["candidate_mp4"]),
                    "unlisted", *pass_fds,
                )
                replacement.record_upload_result(handoff, {"video_id": "new456"})
                payload = json.loads(script.read_text())
                payload["youtube"] = {"video_id": "new456"}
                script.write_text(json.dumps(payload))
                return subprocess.CompletedProcess([], 0, stdout="", stderr="")
            with patch.object(replacement, "ROOT", primary), patch.object(replacement, "load_plan", return_value=plan), patch.object(
                replacement, "verify_origin_manifest_unchanged", side_effect=assert_locked
            ), patch.object(replacement, "verify_remote_replacement_target", side_effect=assert_locked), patch.object(
                replacement, "youtube_client", return_value=object()
            ), patch.object(replacement, "authenticated_upload_ids", return_value=["old123"]), patch.object(
                replacement, "sync_round_robin"
            ), patch.object(replacement, "run", side_effect=uploaded), patch(
                "approval_gate.approved_rows", return_value={candidate.name: {"fixture": True}}
            ), patch.object(replacement, "approved_candidate_mp4", return_value=Path(plan["candidate_mp4"])):

                replacement.upload(root / "plan.json", apply=True)
            self.assertEqual("uploaded_pending_readback", plan["state"])
            with replacement.acquire_release_lock(linked, owner="after-upload"):
                pass

    def test_replacement_media_followups_run_before_reacquiring_identity_lock(self):
        import upload_lesson
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            candidate = root / "candidate"
            candidate.mkdir()
            plan_path = root / "plan.json"
            plan = {
                "identity": "example:2",
                "state": "uploaded_pending_readback",
                "new_video_id": "new456",
                "candidate_lesson_dir": str(candidate),
            }
            held = {"identity": False}

            @contextmanager
            def guard(_identity):
                held["identity"] = True
                try:
                    yield object()
                finally:
                    held["identity"] = False

            def media(*_args, **_kwargs):
                self.assertFalse(held["identity"])
                return {"video_id": "new456", "thumbnail": "uploaded", "captions": "uploaded"}

            def save(*_args, **_kwargs):
                self.assertTrue(held["identity"])

            def state_path(_identity, suffix):
                return root / f"identity{suffix}"

            with patch.object(replacement, "ROOT", root), patch.object(
                replacement, "identity_state_path", side_effect=state_path
            ), patch.object(replacement, "load_plan", return_value=plan), patch.object(
                replacement, "identity_lock", side_effect=guard
            ), patch.object(
                upload_lesson, "run_optional_media_followups", side_effect=media
            ), patch.object(replacement, "save_event", side_effect=save):
                replacement.complete_replacement_media_followups(plan_path, candidate, "new456")

    def test_optional_media_completed_receipt_prevents_replay_and_detects_tampering(self):
        import upload_lesson
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            candidate = root / "candidate"
            candidate.mkdir()
            plan_path = root / "plan.json"
            plan = {
                "identity": "example:2",
                "state": "uploaded_pending_readback",
                "new_video_id": "new456",
                "candidate_lesson_dir": str(candidate),
            }

            def state_path(_identity, suffix):
                return root / f"identity{suffix}"

            def save(_path, target, state, _event, **fields):
                target.update(fields)
                target["state"] = state

            with patch.object(replacement, "ROOT", root), patch.object(
                replacement, "identity_state_path", side_effect=state_path
            ), patch.object(replacement, "load_plan", return_value=plan), patch.object(
                replacement, "sync_round_robin"
            ), patch.object(replacement, "save_event", side_effect=save), patch.object(
                upload_lesson, "run_optional_media_followups",
                return_value={"video_id": "new456", "thumbnail": "uploaded", "captions": "uploaded"},
            ) as media:
                replacement.complete_replacement_media_followups(plan_path, candidate, "new456")
                replacement.complete_replacement_media_followups(plan_path, candidate, "new456")
                media.assert_called_once()
                receipt = replacement.resolve_repo_path(plan["optional_media_receipt"])
                payload = json.loads(receipt.read_text())
                payload["tampered"] = True
                receipt.write_text(json.dumps(payload))
                with self.assertRaisesRegex(replacement.ReplacementError, "hash mismatch"):
                    replacement.complete_replacement_media_followups(plan_path, candidate, "new456")

    def test_optional_media_dispatched_without_receipt_holds_instead_of_replaying(self):
        import upload_lesson
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            candidate = root / "candidate"
            candidate.mkdir()
            plan_path = root / "plan.json"
            plan = {
                "identity": "example:2",
                "state": "uploaded_pending_readback",
                "new_video_id": "new456",
            }

            def state_path(_identity, suffix):
                return root / f"identity{suffix}"

            operation = f"replacement:{plan_path.resolve()}"
            operation_hash = replacement.hashlib.sha256(operation.encode("utf-8")).hexdigest()
            intent = {
                "schema_version": replacement.OPTIONAL_MEDIA_SCHEMA_VERSION,
                "operation": operation,
                "identity": "example:2",
                "lesson_dir": str(candidate.resolve()),
                "plan_path": str(plan_path.resolve()),
                "video_id": "new456",
                "status": "dispatched",
            }
            (root / f"identity.{operation_hash}.media.json").write_text(json.dumps(intent))
            with patch.object(replacement, "ROOT", root), patch.object(
                replacement, "identity_state_path", side_effect=state_path
            ), patch.object(replacement, "load_plan", return_value=plan), patch.object(
                upload_lesson, "run_optional_media_followups"
            ) as media:
                with self.assertRaisesRegex(replacement.ReplacementError, "outcome is unresolved"):
                    replacement.complete_replacement_media_followups(plan_path, candidate, "new456")
                media.assert_not_called()

    def test_verify_new_video_requires_explicit_processing_and_embeddable(self) -> None:
        class Request:
            def __init__(self, payload):
                self.payload = payload

            def execute(self):
                return self.payload

        class Channels:
            def list(self, **_kwargs):
                return Request({"items": [{"id": "channel-1"}]})

        class Videos:
            def __init__(self, status):
                self.status = status

            def list(self, **_kwargs):
                return Request({"items": [{
                    "snippet": {"channelId": "channel-1", "title": "Expected", "publishedAt": "2026-01-01T00:00:00Z"},
                    "status": self.status,
                    "processingDetails": {"processingStatus": "succeeded"},
                }]})

        class YouTube:
            def __init__(self, status):
                self.status = status

            def channels(self):
                return Channels()

            def videos(self):
                return Videos(self.status)

        plan = {"new_video_id": "new456", "expected_youtube_title": "Expected", "privacy": "unlisted"}
        valid = {"uploadStatus": "processed", "privacyStatus": "unlisted", "embeddable": True}
        self.assertEqual("new456", replacement.verify_new_video(plan, YouTube(valid))["video_id"])
        with self.assertRaises(replacement.ReplacementError):
            replacement.verify_new_video(plan, YouTube({**valid, "embeddable": None}))

    def test_remote_replacement_preflight_binds_old_video_and_playlist(self) -> None:
        class Request:
            def __init__(self, payload):
                self.payload = payload

            def execute(self):
                return self.payload

        class Channels:
            def list(self, **_kwargs):
                return Request({"items": [{"id": "channel-1"}]})

        class Videos:
            def list(self, **_kwargs):
                return Request({"items": [{
                    "snippet": {"channelId": "channel-1", "title": "Expected"},
                }]})

        class Playlists:
            def list(self, **_kwargs):
                return Request({"items": [{
                    "id": "playlist-1",
                    "snippet": {"channelId": "channel-1", "title": "Example Course"},
                }]})

        class PlaylistItems:
            def list(self, **_kwargs):
                return Request({"items": [{
                    "id": "old-item",
                    "snippet": {"position": 3, "resourceId": {"videoId": "old123"}},
                    "contentDetails": {"videoId": "old123"},
                }]})

        class YouTube:
            def channels(self):
                return Channels()

            def videos(self):
                return Videos()

            def playlists(self):
                return Playlists()

            def playlistItems(self):
                return PlaylistItems()

        plan = {
            "old_video_id": "old123",
            "expected_youtube_title": "Expected",
            "playlist_id": "playlist-1",
            "playlist_name": "Example Course",
        }
        receipt = replacement.verify_remote_replacement_target(plan, YouTube())
        self.assertEqual("channel-1", receipt["channel_id"])
        self.assertEqual(3, receipt["old_playlist_position"])

    def test_remote_replacement_preflight_rejects_title_mismatch(self) -> None:
        class Request:
            def __init__(self, payload):
                self.payload = payload

            def execute(self):
                return self.payload

        class Channels:
            def list(self, **_kwargs):
                return Request({"items": [{"id": "channel-1"}]})

        class Videos:
            def list(self, **_kwargs):
                return Request({"items": [{
                    "snippet": {"channelId": "channel-1", "title": "Wrong"},
                }]})

        class YouTube:
            def channels(self):
                return Channels()

            def videos(self):
                return Videos()

        plan = {"old_video_id": "old123", "expected_youtube_title": "Expected"}
        with self.assertRaisesRegex(replacement.ReplacementError, "title does not match"):
            replacement.verify_remote_replacement_target(plan, YouTube())

    def test_replaced_state_updates_repair_and_rotation_identity(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            state_path = root / "state.json"
            lock_path = root / "state.lock"
            lesson = {"course_slug": "example-course", "module_number": 2, "youtube_id": "old123"}
            state_path.write_text(json.dumps({
                "repairs": [{"identity": "example-course:2", "lesson": dict(lesson)}],
                "rotation": [dict(lesson)],
            }))
            plan = {
                "state": "replaced",
                "identity": "example-course:2",
                "course_slug": "example-course",
                "module_number": 2,
                "old_video_id": "old123",
                "new_video_id": "new456",
                "published_at": "2026-02-01T00:00:00Z",
            }
            with patch.object(replacement, "STATE_PATH", state_path), patch.object(
                replacement, "STATE_LOCK_PATH", lock_path
            ):
                replacement.sync_round_robin(root / "plan.json", plan)
            updated = json.loads(state_path.read_text())
            self.assertEqual("new456", updated["repairs"][0]["lesson"]["youtube_id"])
            self.assertEqual("new456", updated["rotation"][0]["youtube_id"])

    def test_verify_website_binds_browser_receipt_before_advancing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan = {
                "identity": "example-course:2",
                "state": "manifest_live",
                "course": "Example Course",
                "module_number": 2,
                "new_video_id": "new456",
            }

            def write_receipt(command, **_kwargs):
                receipt = Path(command[command.index("--receipt") + 1])
                receipt.write_text(json.dumps({
                    "status": "PASS",
                    "course": "Example Course",
                    "module_number": 2,
                    "video_id": "new456",
                    "iframe_src": "https://www.youtube.com/embed/new456",
                }))

            with patch.object(replacement, "load_plan", return_value=plan), patch.object(
                replacement, "run", side_effect=write_receipt
            ), patch.object(replacement, "save_event") as save:
                replacement.verify_website(root / "plan.json", url="https://example.test/lessons", timeout=10)

            self.assertEqual("website_verified", save.call_args.args[2])
            self.assertEqual("website_browser_readback_passed", save.call_args.args[3])

    def test_status_reloads_plan_after_identity_lock_before_queue_sync(self) -> None:
        plan_path = Path("/tmp/replacement-plan.json")
        stale = {"identity": "example-course:2", "state": "manifest_live"}
        fresh = {"identity": "example-course:2", "state": "website_verified"}
        held = {"identity": False}

        @contextmanager
        def identity_guard(identity):
            self.assertEqual("example-course:2", identity)
            held["identity"] = True
            try:
                yield object()
            finally:
                held["identity"] = False

        def sync(_path, plan):
            self.assertTrue(held["identity"])
            self.assertIs(plan, fresh)

        with patch.object(replacement, "load_plan", side_effect=[stale, fresh]), patch.object(
            replacement, "identity_lock", side_effect=identity_guard
        ), patch.object(replacement, "sync_round_robin", side_effect=sync) as queue_sync:
            self.assertIs(fresh, replacement.sync_status(plan_path))
        queue_sync.assert_called_once_with(plan_path, fresh)

    def test_retire_old_requires_browser_verified_state(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, patch.object(
            replacement,
            "load_plan",
            side_effect=replacement.ReplacementError("replacement state manifest_live is before website_verified"),
        ):
            with self.assertRaisesRegex(replacement.ReplacementError, "before website_verified"):
                replacement.retire_old(Path(tmp) / "plan.json", apply=True, live_url="https://example.test/manifest.json")

    @contextmanager
    def handoff_fixture(self):
        with tempfile.TemporaryDirectory() as tmp, ExitStack() as stack:
            # Match upload_lesson.py, which resolves all handoff paths before
            # passing them to the lifecycle consumer.
            root = Path(tmp).resolve()
            primary, _linked = self.linked_roots(root)
            plan = bound_plan(root, state="upload_intent")
            plan_path = root / "plan.json"
            plan_path.write_text(json.dumps(plan))
            stack.enter_context(patch.object(replacement, "ROOT", primary))
            stack.enter_context(patch.object(replacement, "load_plan", side_effect=replacement.read_json))
            stack.enter_context(patch("approval_gate.approved_rows", return_value={"candidate": {"fixture": True}}))
            stack.enter_context(patch.object(replacement, "approved_candidate_mp4", return_value=Path(plan["candidate_mp4"])))
            release = stack.enter_context(replacement.release_lock())
            identity = stack.enter_context(replacement.identity_lock(plan["identity"]))
            intent = replacement.claim_upload(plan_path, plan, pre_dispatch_video_ids=["old123"])
            args = [plan_path, intent["token"], Path(plan["candidate_lesson_dir"]),
                    Path(plan["approval_file"]), Path(plan["candidate_mp4"]), "unlisted",
                    release._handle.fileno(), identity.fileno()]
            yield root, plan, args

    def test_handoff_rejects_mismatched_token_paths_privacy_and_missing_fds(self):
        for index, value in ((0, "other-plan.json"), (1, "wrong"), (2, "other-candidate"),
                             (3, "other-approval.json"), (4, "other.mp4"), (5, "public"), (6, -1), (7, -1)):
            with self.subTest(index=index), self.handoff_fixture() as (root, plan, args):
                if index in (0, 2, 3, 4):
                    value = root / value
                    if index == 0:
                        value.write_text(json.dumps(plan))
                args[index] = value
                with self.assertRaises((replacement.ReplacementError, OSError, ValueError)):
                    replacement.consume_upload_handoff(*args)
                intent = replacement.read_json(replacement.identity_state_path(plan["identity"], ".upload.json"))
                self.assertEqual("ready", intent["status"])

    def test_handoff_rejects_candidate_approval_plan_and_identity_drift(self):
        for drift in ("mp4", "approval", "script", "identity", "plan"):
            with self.subTest(drift=drift), self.handoff_fixture() as (root, plan, args):
                if drift == "mp4":
                    args[4].write_bytes(b"changed")
                elif drift == "approval":
                    args[3].write_text('{"changed": true}')
                elif drift == "script":
                    (args[2] / "script.json").write_text('{"course":"Other", "module":"Module 2"}')
                else:
                    plan["identity" if drift == "identity" else "review_id"] = "changed"
                    args[0].write_text(json.dumps(plan))
                with self.assertRaises((replacement.ReplacementError, OSError)):
                    replacement.consume_upload_handoff(*args)

    def test_handoff_requires_owned_locks_not_just_correct_files(self):
        with self.handoff_fixture() as (_root, plan, args):
            for index, path in ((6, replacement.canonical_release_lock_path(replacement.ROOT)),
                                (7, replacement.identity_state_path(plan["identity"], ".lock"))):
                with self.subTest(index=index), path.open("r+") as other:
                    invalid = list(args)
                    invalid[index] = other.fileno()
                    with self.assertRaisesRegex(replacement.ReplacementError, "does not own"):
                        replacement.consume_upload_handoff(*invalid)
            # A valid descriptor after explicit unlock is also insufficient.
            replacement.fcntl.flock(args[7], replacement.fcntl.LOCK_UN)
            with self.assertRaisesRegex(replacement.ReplacementError, "not held"):
                replacement.consume_upload_handoff(*args)

    def test_handoff_is_single_use_even_if_status_write_was_interrupted(self):
        with self.handoff_fixture() as (_root, plan, args):
            path = replacement.identity_state_path(plan["identity"], ".upload.json")
            original = replacement.read_json(path)
            replacement.consume_upload_handoff(*args)
            with self.assertRaisesRegex(replacement.ReplacementError, "already consumed"):
                replacement.consume_upload_handoff(*args)
            replacement.atomic_write_json(path, original)
            with self.assertRaisesRegex(replacement.ReplacementError, "already consumed"):
                replacement.consume_upload_handoff(*args)

    def test_inherited_canonical_locks_validate_in_real_child(self):
        with self.handoff_fixture() as (_root, plan, args):
            code = (
                "import sys; sys.path.insert(0, sys.argv[1]); "
                "from replacement_lifecycle import validate_inherited_lock; from pathlib import Path; "
                "validate_inherited_lock(int(sys.argv[2]), Path(sys.argv[3])); "
                "validate_inherited_lock(int(sys.argv[4]), Path(sys.argv[5]))"
            )
            command = [sys.executable, "-c", code, str(MODULE_PATH.parent), str(args[6]),
                       str(replacement.canonical_release_lock_path(replacement.ROOT)), str(args[7]),
                       str(replacement.identity_state_path(plan["identity"], ".lock"))]
            result = subprocess.run(command, pass_fds=tuple(args[6:]), capture_output=True, text=True)
            self.assertEqual(0, result.returncode, result.stderr)

    def test_low_level_uploader_accepts_bound_handoff_and_persists_durable_result(self):
        import upload_lesson
        with self.handoff_fixture() as (_root, plan, args):
            actual_run = subprocess.run
            uploads = []
            def fake_run(command, **kwargs):
                if command[0] == "git":
                    return actual_run(command, **kwargs)
                self.assertEqual("upload_video.py", Path(command[1]).name)
                uploads.append(command)
                self.assertEqual("dispatched", replacement.read_json(
                    replacement.identity_state_path(plan["identity"], ".upload.json"))["status"])
                return subprocess.CompletedProcess(command, 0, "VIDEO_ID=new456\n", "")
            argv = ["upload_lesson.py", str(args[2]), "--replacement", "--approval-file", str(args[3]),
                    "--replacement-plan", str(args[0]), "--replacement-token", args[1],
                    "--release-lock-fd", str(args[6]), "--identity-lock-fd", str(args[7])]
            with patch.dict(sys.modules, {"replacement_lifecycle": replacement}), patch.object(
                upload_lesson, "QUALITY_SANDBOX_ROOT", args[2].parent
            ), patch.object(upload_lesson, "REPLACEMENT_APPROVAL_ROOT", args[3].parent), patch.object(
                upload_lesson, "approved_rows", return_value={"candidate": {"fixture": True}}
            ), patch.object(upload_lesson, "approved_candidate_mp4", return_value=args[4]), patch.object(
                upload_lesson, "valid_mp4", return_value=True
            ), patch.object(sys, "argv", argv), patch.object(subprocess, "run", side_effect=fake_run):
                self.assertEqual(0, upload_lesson.main())
                with self.assertRaises(SystemExit):
                    upload_lesson.main()
            self.assertEqual(1, len(uploads))
            intent = replacement.validate_upload_intent(args[0], plan)
            self.assertEqual("uploaded", intent["status"])
            self.assertEqual("new456", intent["youtube"]["video_id"])
            self.assertEqual("new456", replacement.read_json(args[2] / "script.json")["youtube"]["video_id"])


if __name__ == "__main__":
    unittest.main()
