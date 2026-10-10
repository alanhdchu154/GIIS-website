from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import subprocess
import unittest
from contextlib import contextmanager, nullcontext
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().parents[1] / "upload_lesson.py"
sys.path.insert(0, str(MODULE_PATH.parent))
SPEC = importlib.util.spec_from_file_location("upload_lesson", MODULE_PATH)
assert SPEC and SPEC.loader
upload_lesson = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(upload_lesson)
import replacement_lifecycle


class UploadLessonFollowupsTest(unittest.TestCase):
    def setUp(self):
        self.real_snapshot_authenticated_upload_ids = upload_lesson.snapshot_authenticated_upload_ids
        self.real_origin_manifest_row = upload_lesson.origin_manifest_row
        self.snapshot_patch = patch.object(
            upload_lesson, "snapshot_authenticated_upload_ids", return_value=[],
        )
        self.snapshot_patch.start()
        self.origin_patch = patch.object(upload_lesson, "origin_manifest_row", return_value=None)
        self.origin_patch.start()

    def tearDown(self):
        self.origin_patch.stop()
        self.snapshot_patch.stop()

    def empty_manifest(self, root: Path) -> Path:
        path = root / "lessons-manifest.json"
        path.write_text(json.dumps({"lessons": [], "by_course": {}}))
        return path

    def test_origin_manifest_preflight_refreshes_and_reads_exact_remote_identity(self):
        script = {"course": "Example Course", "module": "Module 2: Demo"}
        remote = {
            "lessons": [{
                "course": "Example Course", "module_number": 2,
                "youtube_id": "remote123", "lesson_dir": "example-course-module-2",
            }],
            "by_course": {"Example Course": [{
                "course": "Example Course", "module_number": 2,
                "youtube_id": "remote123", "lesson_dir": "example-course-module-2",
            }]},
        }
        results = [
            subprocess.CompletedProcess([], 0, "", ""),
            subprocess.CompletedProcess([], 0, json.dumps(remote), ""),
        ]
        with patch.object(upload_lesson.subprocess, "run", side_effect=results) as run:
            row = self.real_origin_manifest_row(script)
        self.assertEqual("remote123", row["youtube_id"])
        self.assertEqual(["git", "fetch", "--quiet", "origin", "main"], run.call_args_list[0].args[0])
        self.assertEqual(
            ["git", "show", "origin/main:public/data/lessons-manifest.json"],
            run.call_args_list[1].args[0],
        )

    def test_authenticated_channel_preflight_rejects_existing_course_module(self):
        rows = [
            {"video_id": "existing123", "title": "example course — Module 2: Demo"},
            {"video_id": "other123", "title": "Other Course — Module 1: Intro"},
        ]
        with patch.object(replacement_lifecycle, "youtube_client", return_value=object()), patch.object(
            replacement_lifecycle, "authenticated_upload_inventory", return_value=rows,
        ):
            with self.assertRaisesRegex(ValueError, "already contains course/module identity"):
                self.real_snapshot_authenticated_upload_ids(
                    {"course": "Example Course", "module": "Module 2: Demo"},
                )

    def test_authenticated_channel_preflight_rejects_uploader_title_variants(self):
        for title in (
            "example-course — module 2: Demo",
            "Example Course — MODULE 2: Demo",
            "Example Course - Module 2 - Demo",
        ):
            with self.subTest(title=title), patch.object(
                replacement_lifecycle, "youtube_client", return_value=object()
            ), patch.object(
                replacement_lifecycle, "authenticated_upload_inventory",
                return_value=[{"video_id": "existing123", "title": title}],
            ):
                with self.assertRaisesRegex(ValueError, "already contains course/module identity"):
                    self.real_snapshot_authenticated_upload_ids(
                        {"course": "Example Course", "module": "module 2: Demo"},
                    )

    def test_authenticated_channel_preflight_returns_snapshot_when_identity_is_new(self):
        rows = [{"video_id": "other123", "title": "Other Course — Module 1: Intro"}]
        with patch.object(replacement_lifecycle, "youtube_client", return_value=object()), patch.object(
            replacement_lifecycle, "authenticated_upload_inventory", return_value=rows,
        ):
            ids = self.real_snapshot_authenticated_upload_ids(
                {"course": "Example Course", "module": "Module 2: Demo"},
            )
        self.assertEqual(["other123"], ids)

    def test_manifest_duplicate_matching_uses_stable_course_module_identity(self):
        script = {"course": "Example Course", "module": "Module 2: Demo"}
        row = {
            "course": "EXAMPLE COURSE", "course_slug": "example-course",
            "module_number": 2, "youtube_id": "existing123",
            "lesson_dir": "example-course-module-2",
        }
        payload = {
            "lessons": [dict(row)],
            "by_course": {"EXAMPLE COURSE": [dict(row)]},
        }
        self.assertEqual(
            "existing123",
            upload_lesson.existing_manifest_payload_row(script, payload)["youtube_id"],
        )

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

    def test_sync_success_precedes_cleanup_and_propagates_cleanup_failure(self):
        for cleanup_rc in (0, 4):
            with self.subTest(cleanup_rc=cleanup_rc), patch.object(
                upload_lesson.subprocess, "run",
                side_effect=[subprocess.CompletedProcess([], 0), subprocess.CompletedProcess([], cleanup_rc)],
            ) as run:
                self.assertEqual(cleanup_rc, upload_lesson.run_post_upload_followups(
                    Path("/tools"), Path("/lesson"), no_sync=False, no_cleanup=False))
                self.assertEqual("sync_channel.py", Path(run.call_args_list[0].args[0][1]).name)
                self.assertEqual("cleanup_lesson.py", Path(run.call_args_list[1].args[0][1]).name)

    def test_playlist_existing_membership_is_replay_safe(self):
        class Request:
            def __init__(self, payload):
                self.payload = payload

            def execute(self):
                return self.payload

        class Playlists:
            def list(self, **_kwargs):
                return Request({"items": [{"id": "playlist-1", "snippet": {"title": "Example"}}]})

            def insert(self, **_kwargs):
                raise AssertionError("existing playlist must not be recreated")

        class PlaylistItems:
            def list(self, **_kwargs):
                return Request({"items": [{"id": "membership-1"}]})

            def insert(self, **_kwargs):
                raise AssertionError("existing membership must not be inserted again")

        class YouTube:
            def playlists(self):
                return Playlists()

            def playlistItems(self):
                return PlaylistItems()

        with patch("googleapiclient.discovery.build", return_value=YouTube()), patch(
            "upload_video.get_creds", return_value=object()
        ), patch.object(
            replacement_lifecycle, "playlist_lock", return_value=nullcontext()
        ) as lock:
            self.assertEqual(
                "playlist-1", upload_lesson.add_to_playlist("Example", "new456", "unlisted")
            )
        lock.assert_called_once_with("Example")

    def test_uncertain_playlist_insert_polls_without_second_insert(self):
        import httplib2
        from googleapiclient.errors import HttpError

        class Request:
            def __init__(self, callback):
                self.callback = callback

            def execute(self):
                return self.callback()

        membership_reads = {"count": 0}
        inserts = {"count": 0}

        class Playlists:
            def list(self, **_kwargs):
                return Request(lambda: {
                    "items": [{"id": "playlist-1", "snippet": {"title": "Example"}}]
                })

        class PlaylistItems:
            def list(self, **_kwargs):
                def payload():
                    membership_reads["count"] += 1
                    return {"items": ([{"id": "membership-1"}]
                                      if membership_reads["count"] >= 3 else [])}
                return Request(payload)

            def insert(self, **_kwargs):
                def uncertain():
                    inserts["count"] += 1
                    raise HttpError(httplib2.Response({"status": "503"}), b"backend error")
                return Request(uncertain)

        class YouTube:
            def playlists(self):
                return Playlists()

            def playlistItems(self):
                return PlaylistItems()

        with patch("googleapiclient.discovery.build", return_value=YouTube()), patch(
            "upload_video.get_creds", return_value=object()
        ), patch.object(
            replacement_lifecycle, "playlist_lock", return_value=nullcontext()
        ), patch.object(upload_lesson.time, "sleep"):
            self.assertEqual(
                "playlist-1", upload_lesson.add_to_playlist("Example", "new456", "unlisted")
            )
        self.assertEqual(1, inserts["count"])

    def test_dispatched_playlist_retry_is_reconciliation_only(self):
        class Request:
            def __init__(self, payload):
                self.payload = payload

            def execute(self):
                return self.payload

        inserts = {"count": 0}

        class Playlists:
            def list(self, **_kwargs):
                return Request({
                    "items": [{"id": "playlist-1", "snippet": {"title": "Example"}}]
                })

        class PlaylistItems:
            def list(self, **_kwargs):
                return Request({"items": []})

            def insert(self, **_kwargs):
                inserts["count"] += 1
                return Request({"id": "should-not-run"})

        class YouTube:
            def playlists(self):
                return Playlists()

            def playlistItems(self):
                return PlaylistItems()

        with patch("googleapiclient.discovery.build", return_value=YouTube()), patch(
            "upload_video.get_creds", return_value=object()
        ), patch.object(
            replacement_lifecycle, "playlist_lock", return_value=nullcontext()
        ):
            with self.assertRaisesRegex(RuntimeError, "no insert replayed"):
                upload_lesson.add_to_playlist(
                    "Example", "new456", "unlisted", reconcile_only=True,
                )
        self.assertEqual(0, inserts["count"])

    def test_reconciled_creation_allows_first_membership_dispatch(self):
        class Request:
            def __init__(self, callback):
                self.callback = callback
            def execute(self):
                return self.callback()

        memberships = []
        inserts = {"count": 0}

        class Playlists:
            def list(self, **_kwargs):
                return Request(lambda: {
                    "items": [{"id": "playlist-1", "snippet": {"title": "Example"}}],
                })

        class PlaylistItems:
            def list(self, **_kwargs):
                return Request(lambda: {"items": list(memberships)})
            def insert(self, **_kwargs):
                def insert_once():
                    inserts["count"] += 1
                    memberships.append({"id": "membership-1"})
                    return {"id": "membership-1"}
                return Request(insert_once)

        class YouTube:
            def playlists(self): return Playlists()
            def playlistItems(self): return PlaylistItems()

        phases = []
        with patch("googleapiclient.discovery.build", return_value=YouTube()), patch(
            "upload_video.get_creds", return_value=object(),
        ), patch.object(
            replacement_lifecycle, "playlist_lock", return_value=nullcontext(),
        ):
            playlist_id = upload_lesson.add_to_playlist(
                "Example", "new456", "unlisted",
                create_reconcile_only=True,
                membership_reconcile_only=False,
                phase_callback=lambda phase, **_fields: phases.append(phase),
            )
        self.assertEqual("playlist-1", playlist_id)
        self.assertEqual(1, inserts["count"])
        self.assertEqual(
            ["create_completed", "membership_dispatched", "membership_completed"],
            phases,
        )

    def test_playlist_failure_propagates_before_success_receipt(self):
        with tempfile.TemporaryDirectory() as tmp:
            lesson = Path(tmp)
            (lesson / "script.json").write_text(json.dumps({
                "course": "Example",
                "youtube": {"video_id": "new456"},
            }))
            intent_path = lesson / "ordinary-intent.json"
            intent_path.write_text(json.dumps({"youtube": {"video_id": "new456"}}))
            args = SimpleNamespace(
                no_thumbnail=True, no_captions=True, no_playlist=False,
                playlist="Example", privacy="unlisted",
            )
            def fail_after_intent(*_args, **_kwargs):
                intents = list(lesson.glob("state.ordinary-playlist-*.intent.json"))
                self.assertEqual(1, len(intents))
                self.assertEqual("dispatched", json.loads(intents[0].read_text())["status"])
                raise RuntimeError("terminal failure")

            with patch.object(
                replacement_lifecycle, "run_durable_optional_media_followups",
                return_value=(lesson / "media.json", "sha"),
            ), patch.object(
                replacement_lifecycle, "media_followup_lock", return_value=nullcontext()
            ), patch.object(
                replacement_lifecycle, "identity_state_path",
                side_effect=lambda _identity, suffix: lesson / f"state{suffix}",
            ), patch.object(
                upload_lesson, "add_to_playlist", side_effect=fail_after_intent
            ), patch.object(replacement_lifecycle, "identity_lock") as identity:
                with self.assertRaisesRegex(RuntimeError, "terminal failure"):
                    upload_lesson.run_optional_upload_followups(
                        args, lesson, "example:1", intent_path,
                    )
            identity.assert_not_called()

    def test_persisted_dispatched_playlist_intent_forces_reconciliation_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            lesson = Path(tmp)
            script_path = lesson / "script.json"
            script_path.write_text(json.dumps({
                "course": "Example",
                "youtube": {"video_id": "new456"},
            }))
            upload_intent_path = lesson / "ordinary-upload.json"
            upload_intent_path.write_text(json.dumps({
                "youtube": {"video_id": "new456"},
            }))
            playlist_intent_path = lesson / "playlist-intent.json"
            playlist_intent_path.write_text(json.dumps({
                "schema_version": "giis.youtube-ordinary-playlist.v1",
                "identity": "example:1",
                "video_id": "new456",
                "playlist_name": "Example",
                "upload_intent_path": str(upload_intent_path.resolve()),
                "status": "dispatched",
                "create_status": "dispatched",
                "membership_status": "ready",
            }))
            args = SimpleNamespace(
                no_thumbnail=True, no_captions=True, no_playlist=False,
                playlist="Example", privacy="unlisted",
            )

            def state_path(_identity, suffix):
                if suffix.endswith(".intent.json") and "ordinary-playlist" in suffix:
                    return playlist_intent_path
                return lesson / f"state{suffix}"

            with patch.object(
                replacement_lifecycle, "run_durable_optional_media_followups",
                return_value=(lesson / "media.json", "sha"),
            ), patch.object(
                replacement_lifecycle, "media_followup_lock", return_value=nullcontext(),
            ), patch.object(
                replacement_lifecycle, "identity_state_path", side_effect=state_path,
            ), patch.object(
                upload_lesson, "add_to_playlist",
                side_effect=RuntimeError("no insert replayed"),
            ) as add:
                with self.assertRaisesRegex(RuntimeError, "no insert replayed"):
                    upload_lesson.run_optional_upload_followups(
                        args, lesson, "example:1", upload_intent_path,
                    )
            self.assertTrue(add.call_args.kwargs["create_reconcile_only"])
            self.assertFalse(add.call_args.kwargs["membership_reconcile_only"])
            self.assertTrue(callable(add.call_args.kwargs["phase_callback"]))

    def test_main_preserves_uploaded_identity_and_propagates_sync_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            lesson = Path(tmp)
            manifest_path = self.empty_manifest(lesson)
            script = lesson / "script.json"
            script.write_text(json.dumps({"course": "Example", "module": "Module 1"}))
            mp4 = lesson / "candidate.mp4"
            mp4.write_bytes(b"fixture")
            with patch.object(upload_lesson, "MANIFEST_PATH", manifest_path), patch.object(
                upload_lesson.sys, "argv", ["upload_lesson.py", str(lesson), "--no-playlist"]
            ), patch.object(
                upload_lesson, "approved_rows", return_value={lesson.name: {"approved": True}}
            ), patch.object(upload_lesson, "approved_candidate_mp4", return_value=mp4), patch.object(
                upload_lesson, "valid_mp4", return_value=True
            ), patch.object(upload_lesson.subprocess, "run", side_effect=[
                subprocess.CompletedProcess([], 0, "VIDEO_ID=new456\n", ""),
                subprocess.CompletedProcess([], 7),
            ]) as run, patch.object(
                replacement_lifecycle, "release_lock", return_value=nullcontext()
            ), patch.object(
                replacement_lifecycle, "identity_lock", return_value=nullcontext()
            ), patch.object(
                replacement_lifecycle, "identity_state_path", side_effect=lambda _identity, suffix: (
                    lesson / "ordinary-intent.json" if suffix == ".ordinary-upload.json"
                    else lesson / f"state{suffix}"
                )
            ):
                self.assertEqual(7, upload_lesson.main())
            self.assertEqual(2, run.call_count)
            self.assertEqual("new456", json.loads(script.read_text())["youtube"]["video_id"])
            self.assertTrue(mp4.exists())

    def test_explicit_followup_skips(self):
        for no_sync, no_cleanup, expected in ((True, True, []), (False, True, ["sync_channel.py"]), (True, False, [])):
            with self.subTest(no_sync=no_sync, no_cleanup=no_cleanup), patch.object(
                upload_lesson.subprocess, "run", return_value=subprocess.CompletedProcess([], 0)
            ) as run:
                self.assertEqual(0, upload_lesson.run_post_upload_followups(
                    Path("/tools"), Path("/lesson"), no_sync=no_sync, no_cleanup=no_cleanup))
                self.assertEqual(expected, [Path(call.args[0][1]).name for call in run.call_args_list])

    def test_cli_no_sync_implies_no_cleanup(self):
        for explicit_no_cleanup in (False, True):
            with self.subTest(explicit_no_cleanup=explicit_no_cleanup), tempfile.TemporaryDirectory() as tmp:
                lesson = Path(tmp)
                manifest_path = self.empty_manifest(lesson)
                (lesson / "script.json").write_text(json.dumps({"course": "Example", "module": "Module 1"}))
                mp4 = lesson / "candidate.mp4"
                mp4.write_bytes(b"fixture")
                argv = ["upload_lesson.py", str(lesson), "--no-playlist", "--no-sync"]
                if explicit_no_cleanup:
                    argv.append("--no-cleanup")
                with patch.object(upload_lesson, "MANIFEST_PATH", manifest_path), patch.object(
                    upload_lesson.sys, "argv", argv
                ), patch.object(
                    upload_lesson, "approved_rows", return_value={lesson.name: {"approved": True}}
                ), patch.object(upload_lesson, "approved_candidate_mp4", return_value=mp4), patch.object(
                    upload_lesson, "valid_mp4", return_value=True
                ), patch.object(upload_lesson.subprocess, "run", return_value=
                    subprocess.CompletedProcess([], 0, "VIDEO_ID=new456\n", "")
                ) as run, patch.object(
                    replacement_lifecycle, "release_lock", return_value=nullcontext()
                ), patch.object(
                    replacement_lifecycle, "identity_lock", return_value=nullcontext()
                ), patch.object(
                    replacement_lifecycle, "identity_state_path", side_effect=lambda _identity, suffix: (
                        lesson / "ordinary-intent.json" if suffix == ".ordinary-upload.json"
                        else lesson / f"state{suffix}"
                    )
                ):
                    self.assertEqual(0, upload_lesson.main())
                run.assert_called_once()
                self.assertEqual("upload_video.py", Path(run.call_args.args[0][1]).name)
                self.assertTrue(mp4.exists())

    def test_ordinary_upload_rejects_existing_script_video_id_even_with_force(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            lesson = root / "candidate"
            lesson.mkdir()
            (lesson / "script.json").write_text(json.dumps({
                "course": "Example", "module": "Module 1",
                "youtube": {"video_id": "old123"},
            }))
            (lesson / "candidate.mp4").write_bytes(b"fixture")
            manifest_path = root / "lessons-manifest.json"
            manifest_row = {
                "course": "Example", "course_slug": "example", "module_number": 1,
                "youtube_id": "new456", "lesson_dir": "candidate",
            }
            manifest_path.write_text(json.dumps({
                "lessons": [dict(manifest_row)],
                "by_course": {"Example": [dict(manifest_row)]},
            }))
            with patch.object(upload_lesson, "MANIFEST_PATH", manifest_path), patch.object(
                upload_lesson.sys, "argv", [
                    "upload_lesson.py", str(lesson), "--force-without-approval",
                ]
            ), patch.object(upload_lesson, "valid_mp4", return_value=True), patch.object(
                replacement_lifecycle, "release_lock", return_value=nullcontext()
            ), patch.object(
                replacement_lifecycle, "identity_lock", return_value=nullcontext()
            ), patch.object(
                replacement_lifecycle, "identity_state_path", return_value=root / "ordinary-intent.json"
            ), patch.object(upload_lesson.subprocess, "run") as run:
                with self.assertRaises(SystemExit) as raised:
                    upload_lesson.main()
                self.assertEqual(2, raised.exception.code)
                run.assert_not_called()

    def test_ordinary_upload_rejects_existing_manifest_identity_even_with_force(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            lesson = root / "relocated-candidate"
            lesson.mkdir()
            (lesson / "script.json").write_text(json.dumps({
                "course": "Example Course", "module": "Module 2",
            }))
            (lesson / "relocated_candidate.mp4").write_bytes(b"fixture")
            row = {
                "course": "Example Course", "module_number": 2,
                "youtube_id": "old123", "lesson_dir": "canonical-folder",
            }
            manifest_path = root / "lessons-manifest.json"
            manifest_path.write_text(json.dumps({
                "lessons": [dict(row)],
                "by_course": {"Example Course": [dict(row)]},
            }))
            with patch.object(upload_lesson, "MANIFEST_PATH", manifest_path), patch.object(
                upload_lesson.sys, "argv", [
                    "upload_lesson.py", str(lesson), "--force-without-approval",
                ]
            ), patch.object(upload_lesson, "valid_mp4", return_value=True), patch.object(
                replacement_lifecycle, "release_lock", return_value=nullcontext()
            ), patch.object(
                replacement_lifecycle, "identity_lock", return_value=nullcontext()
            ), patch.object(
                replacement_lifecycle, "identity_state_path", return_value=root / "ordinary-intent.json"
            ), patch.object(upload_lesson.subprocess, "run") as run:
                with self.assertRaises(SystemExit) as raised:
                    upload_lesson.main()
                self.assertEqual(2, raised.exception.code)
                run.assert_not_called()

    def test_ordinary_upload_holds_both_locks_through_dispatch_and_persistence(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            lesson = root / "candidate"
            lesson.mkdir()
            script = lesson / "script.json"
            script.write_text(json.dumps({"course": "Example", "module": "Module 1"}))
            mp4 = lesson / "candidate.mp4"
            mp4.write_bytes(b"fixture")
            (lesson / "transcript.txt").write_text("caption")
            (lesson / "slides").mkdir()
            (lesson / "slides" / "01_title.png").write_bytes(b"thumbnail")
            approval = root / "approval.json"
            approval.write_text("{}")
            manifest_path = self.empty_manifest(root)
            intent_path = root / "ordinary-intent.json"
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
                self.assertEqual("example:1", identity)
                held["identity"] = True
                try:
                    yield object()
                finally:
                    held["identity"] = False

            def upload(command, **_kwargs):
                name = Path(command[1]).name
                if name == "upload_video.py":
                    self.assertTrue(held["release"])
                    self.assertTrue(held["identity"])
                    self.assertEqual("dispatched", json.loads(intent_path.read_text())["status"])
                    self.assertNotIn("--thumbnail", command)
                    self.assertNotIn("--transcript", command)
                    self.assertNotIn("--captions", command)
                    return subprocess.CompletedProcess(command, 0, "VIDEO_ID=new456\n", "")
                self.assertIn(name, {"sync_channel.py", "cleanup_lesson.py"})
                self.assertFalse(held["release"])
                self.assertFalse(held["identity"])
                return subprocess.CompletedProcess(command, 0, "", "")

            argv = [
                "upload_lesson.py", str(lesson), "--approval-file", str(approval),
                "--no-playlist",
            ]
            def optional_followups(*_args):
                self.assertFalse(held["release"])
                self.assertFalse(held["identity"])

            with patch.object(upload_lesson, "MANIFEST_PATH", manifest_path), patch.object(
                upload_lesson.sys, "argv", argv
            ), patch.object(
                upload_lesson, "approved_rows", return_value={lesson.name: {"approved": True}}
            ), patch.object(
                upload_lesson, "approved_candidate_mp4", return_value=mp4
            ), patch.object(
                upload_lesson, "valid_mp4", return_value=True
            ), patch.object(
                upload_lesson.subprocess, "run", side_effect=upload
            ), patch.object(
                replacement_lifecycle, "release_lock", side_effect=release_guard
            ), patch.object(
                replacement_lifecycle, "identity_lock", side_effect=identity_guard
            ), patch.object(
                replacement_lifecycle, "identity_state_path", return_value=intent_path
            ), patch.object(
                upload_lesson, "run_optional_upload_followups", side_effect=optional_followups
            ):
                self.assertEqual(0, upload_lesson.main())
            self.assertEqual({"release": False, "identity": False}, held)
            self.assertEqual("uploaded", json.loads(intent_path.read_text())["status"])
            self.assertEqual("new456", json.loads(script.read_text())["youtube"]["video_id"])

    def test_nonzero_child_with_video_id_persists_identity_before_exit(self):
        with tempfile.TemporaryDirectory() as tmp:
            lesson = Path(tmp)
            script_path = lesson / "script.json"
            script = {"course": "Example", "module": "Module 1"}
            script_path.write_text(json.dumps(script))
            mp4 = lesson / "candidate.mp4"
            mp4.write_bytes(b"fixture")
            intent_path = lesson / "intent.json"
            intent = {"status": "ready", "reconciliation_nonce": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}
            intent_path.write_text(json.dumps(intent))
            args = SimpleNamespace(
                privacy="unlisted", no_captions=True, no_thumbnail=True,
                no_playlist=True, playlist=None, no_sync=True, no_cleanup=True,
            )
            def upload_result(command, **_kwargs):
                description_path = Path(command[command.index("--description-file") + 1])
                self.assertIn(
                    "GIIS_UPLOAD_INTENT=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    description_path.read_text(),
                )
                return subprocess.CompletedProcess([], 9, "VIDEO_ID=new456\n", "optional failure")

            with patch.object(upload_lesson.subprocess, "run", side_effect=upload_result):
                with self.assertRaises(SystemExit) as raised:
                    upload_lesson.perform_upload(
                        args, lesson, lesson / "approval.json", script, mp4,
                        ordinary_intent=(intent_path, intent),
                        run_followups=False,
                        defer_optional_followups=True,
                    )
            self.assertEqual(9, raised.exception.code)
            self.assertEqual("new456", json.loads(script_path.read_text())["youtube"]["video_id"])
            persisted = json.loads(intent_path.read_text())
            self.assertEqual("uploaded", persisted["status"])
            self.assertEqual("new456", persisted["youtube"]["video_id"])

    def test_retry_recovers_persisted_ordinary_upload_then_runs_followups(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            lesson = root / "candidate"
            lesson.mkdir()
            script_path = lesson / "script.json"
            youtube = {
                "video_id": "new456", "url": "https://youtu.be/new456",
                "embed_url": "https://www.youtube.com/embed/new456",
                "studio_url": "https://studio.youtube.com/video/new456/edit",
                "privacy": "unlisted", "playlist": "Example", "playlist_id": None,
                "uploaded_at": "2026-10-09T00:00:00+00:00",
            }
            script = {"course": "Example", "module": "Module 1", "youtube": youtube}
            script_path.write_text(json.dumps(script))
            mp4 = lesson / "candidate.mp4"
            mp4.write_bytes(b"fixture")
            manifest_path = root / "lessons-manifest.json"
            manifest_row = {
                "course": "Example", "course_slug": "example", "module_number": 1,
                "youtube_id": "new456", "lesson_dir": "candidate",
            }
            manifest_path.write_text(json.dumps({
                "lessons": [dict(manifest_row)],
                "by_course": {"Example": [dict(manifest_row)]},
            }))
            intent_path = root / "ordinary-intent.json"
            binding = upload_lesson.ordinary_upload_binding(
                lesson=lesson, script=script, mp4=mp4,
                approval_path=root / "unused.json", privacy="unlisted",
                force_without_approval=True,
            )
            intent_path.write_text(json.dumps({**binding, "status": "uploaded", "youtube": youtube}))
            argv = [
                "upload_lesson.py", str(lesson), "--force-without-approval",
                "--no-playlist", "--no-sync",
            ]
            with patch.object(upload_lesson, "MANIFEST_PATH", manifest_path), patch.object(
                upload_lesson.sys, "argv", argv
            ), patch.object(upload_lesson, "valid_mp4", return_value=True), patch.object(
                replacement_lifecycle, "release_lock", return_value=nullcontext()
            ), patch.object(
                replacement_lifecycle, "identity_lock", return_value=nullcontext()
            ), patch.object(
                replacement_lifecycle, "identity_state_path", side_effect=lambda _identity, suffix: (
                    intent_path if suffix == ".ordinary-upload.json" else root / f"state{suffix}"
                )
            ), patch.object(
                upload_lesson, "origin_manifest_row", return_value=manifest_row,
            ), patch.object(
                upload_lesson, "run_optional_upload_followups"
            ) as followups, patch.object(upload_lesson.subprocess, "run") as run:
                self.assertEqual(0, upload_lesson.main())
            followups.assert_called_once()
            run.assert_not_called()

    def test_ordinary_reconcile_adopts_exact_crash_window_upload_without_reupload(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            lesson = root / "candidate"
            lesson.mkdir()
            script_path = lesson / "script.json"
            script = {"course": "Example", "module": "Module 1"}
            script_path.write_text(json.dumps(script))
            mp4 = lesson / "candidate.mp4"
            mp4.write_bytes(b"fixture")
            manifest_path = self.empty_manifest(root)
            intent_path = root / "ordinary-intent.json"
            binding = upload_lesson.ordinary_upload_binding(
                lesson=lesson, script=script, mp4=mp4,
                approval_path=root / "unused.json", privacy="unlisted",
                force_without_approval=True,
            )
            intent_path.write_text(json.dumps({
                **binding, "status": "dispatched",
                "reconciliation_nonce": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "pre_dispatch_video_ids": ["preexisting-1"],
                "started_at": "2026-10-09T00:00:00+00:00",
                "dispatched_at": "2026-10-09T00:01:00+00:00",
            }))
            adopted = {
                "id": "new456",
                "snippet": {"publishedAt": "2026-10-09T00:02:00Z"},
                "status": {"privacyStatus": "unlisted"},
            }
            argv = [
                "upload_lesson.py", str(lesson), "--force-without-approval",
                "--reconcile-upload", "--no-playlist", "--no-sync",
            ]
            with patch.object(upload_lesson, "MANIFEST_PATH", manifest_path), patch.object(
                upload_lesson.sys, "argv", argv,
            ), patch.object(upload_lesson, "valid_mp4", return_value=True), patch.object(
                replacement_lifecycle, "release_lock", return_value=nullcontext(),
            ), patch.object(
                replacement_lifecycle, "identity_lock", return_value=nullcontext(),
            ), patch.object(
                replacement_lifecycle, "identity_state_path",
                side_effect=lambda _identity, suffix: (
                    intent_path if suffix == ".ordinary-upload.json" else root / f"state{suffix}"
                ),
            ), patch.object(
                replacement_lifecycle, "youtube_client", return_value=object(),
            ), patch.object(
                replacement_lifecycle, "find_exact_upload_adoption", return_value=adopted,
            ) as find, patch.object(
                upload_lesson, "run_optional_upload_followups",
            ) as followups, patch.object(upload_lesson.subprocess, "run") as run:
                self.assertEqual(0, upload_lesson.main())
            self.assertEqual("new456", json.loads(script_path.read_text())["youtube"]["video_id"])
            self.assertEqual("uploaded", json.loads(intent_path.read_text())["status"])
            self.assertEqual(
                {"preexisting-1"},
                find.call_args.kwargs["pre_dispatch_video_ids"],
            )
            self.assertEqual("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", find.call_args.kwargs["reconciliation_nonce"])
            followups.assert_called_once()
            run.assert_not_called()

    def test_ordinary_binding_ignores_unrelated_approval_rows(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            lesson = root / "candidate"
            lesson.mkdir()
            mp4 = lesson / "candidate.mp4"
            mp4.write_bytes(b"fixture")
            script = {"course": "Example", "module": "Module 1"}
            approval_path = root / "approvals.json"
            exact = {
                "slug": lesson.name,
                "candidate_mp4": str(mp4),
                "candidate_mp4_sha256": replacement_lifecycle.sha256_file(mp4),
                "review_id": "review-1",
            }
            approval_path.write_text(json.dumps({"approved_ready_to_upload": [exact]}))
            first = upload_lesson.ordinary_upload_binding(
                lesson=lesson, script=script, mp4=mp4,
                approval_path=approval_path, privacy="unlisted",
                force_without_approval=False, approval_row=exact,
            )
            approval_path.write_text(json.dumps({
                "approved_ready_to_upload": [exact, {"slug": "unrelated", "review_id": "review-2"}],
            }))
            second = upload_lesson.ordinary_upload_binding(
                lesson=lesson, script=script, mp4=mp4,
                approval_path=approval_path, privacy="unlisted",
                force_without_approval=False,
                approval_row=exact,
            )
            self.assertEqual(first, second)

    def test_ordinary_upload_rejects_identity_drift_after_lock_wait(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            lesson = root / "candidate"
            lesson.mkdir()
            script = lesson / "script.json"
            script.write_text(json.dumps({"course": "Example", "module": "Module 1"}))
            mp4 = lesson / "candidate.mp4"
            mp4.write_bytes(b"fixture")
            manifest_path = self.empty_manifest(root)
            intent_path = root / "ordinary-intent.json"

            @contextmanager
            def identity_drift(_identity):
                script.write_text(json.dumps({"course": "Changed", "module": "Module 2"}))
                yield object()

            argv = [
                "upload_lesson.py", str(lesson), "--force-without-approval",
                "--no-playlist", "--no-sync",
            ]
            with patch.object(upload_lesson, "MANIFEST_PATH", manifest_path), patch.object(
                upload_lesson.sys, "argv", argv
            ), patch.object(
                upload_lesson, "valid_mp4", return_value=True
            ), patch.object(
                replacement_lifecycle, "release_lock", return_value=nullcontext()
            ), patch.object(
                replacement_lifecycle, "identity_lock", side_effect=identity_drift
            ), patch.object(
                replacement_lifecycle, "identity_state_path", return_value=intent_path
            ), patch.object(upload_lesson.subprocess, "run") as run:
                with self.assertRaises(SystemExit) as raised:
                    upload_lesson.main()
                self.assertEqual(2, raised.exception.code)
                run.assert_not_called()
                self.assertFalse(intent_path.exists())

    def test_uncertain_ordinary_upload_intent_blocks_duplicate_retry(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            lesson = root / "candidate"
            lesson.mkdir()
            (lesson / "script.json").write_text(json.dumps({"course": "Example", "module": "Module 1"}))
            mp4 = lesson / "candidate.mp4"
            mp4.write_bytes(b"fixture")
            approval = root / "approval.json"
            approval.write_text("{}")
            manifest_path = self.empty_manifest(root)
            intent_path = root / "ordinary-intent.json"
            argv = [
                "upload_lesson.py", str(lesson), "--approval-file", str(approval),
                "--no-playlist", "--no-sync",
            ]
            common = (
                patch.object(upload_lesson, "MANIFEST_PATH", manifest_path),
                patch.object(upload_lesson.sys, "argv", argv),
                patch.object(upload_lesson, "approved_rows", return_value={lesson.name: {"approved": True}}),
                patch.object(upload_lesson, "approved_candidate_mp4", return_value=mp4),
                patch.object(upload_lesson, "valid_mp4", return_value=True),
                patch.object(replacement_lifecycle, "release_lock", return_value=nullcontext()),
                patch.object(replacement_lifecycle, "identity_lock", return_value=nullcontext()),
                patch.object(replacement_lifecycle, "identity_state_path", return_value=intent_path),
            )
            with common[0], common[1], common[2], common[3], common[4], common[5], common[6], common[7], patch.object(
                upload_lesson.subprocess, "run", return_value=subprocess.CompletedProcess([], 9, "", "failed")
            ):
                with self.assertRaises(SystemExit) as raised:
                    upload_lesson.main()
                self.assertEqual(9, raised.exception.code)
            self.assertEqual("dispatched", json.loads(intent_path.read_text())["status"])

            # Recreate patch objects because unittest.mock patches are single-use.
            with patch.object(upload_lesson, "MANIFEST_PATH", manifest_path), patch.object(
                upload_lesson.sys, "argv", argv
            ), patch.object(
                upload_lesson, "approved_rows", return_value={lesson.name: {"approved": True}}
            ), patch.object(
                upload_lesson, "approved_candidate_mp4", return_value=mp4
            ), patch.object(
                upload_lesson, "valid_mp4", return_value=True
            ), patch.object(
                replacement_lifecycle, "release_lock", return_value=nullcontext()
            ), patch.object(
                replacement_lifecycle, "identity_lock", return_value=nullcontext()
            ), patch.object(
                replacement_lifecycle, "identity_state_path", return_value=intent_path
            ), patch.object(upload_lesson.subprocess, "run") as run:
                with self.assertRaises(SystemExit) as raised:
                    upload_lesson.main()
                self.assertEqual(2, raised.exception.code)
                run.assert_not_called()

    def test_direct_replacement_requires_lifecycle_handoff_before_external_calls(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            lesson, approval = root / "sandbox/candidate", root / "approvals/approval.json"
            lesson.mkdir(parents=True)
            approval.parent.mkdir()
            approval.write_text("{}")
            for extra in ([], ["--force-without-approval"], ["--replacement-plan", str(root / "plan.json")]):
                with self.subTest(extra=extra), patch.object(upload_lesson, "QUALITY_SANDBOX_ROOT", root / "sandbox"), patch.object(
                    upload_lesson, "REPLACEMENT_APPROVAL_ROOT", root / "approvals"
                ), patch.object(upload_lesson.sys, "argv", [
                    "upload_lesson.py", str(lesson), "--approval-file", str(approval), "--replacement", *extra
                ]), patch.object(upload_lesson.subprocess, "run") as run:
                    with self.assertRaises(SystemExit) as raised:
                        upload_lesson.main()
                    self.assertEqual(2, raised.exception.code)
                    run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
