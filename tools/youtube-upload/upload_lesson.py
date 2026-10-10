#!/usr/bin/env python3
"""High-level: upload a complete lesson folder to YouTube.

Usage:
    python3 upload_lesson.py teaching-videos/algebra-i-module-4-sample/
       [--privacy unlisted|private|public]

Reads the lesson's `script.json` to auto-generate title, description, and tags.
Uploads the rendered MP4 and saves the YouTube identity as soon as YouTube
returns `VIDEO_ID`. Captions, thumbnails, playlists, manifest sync, and cleanup
are optional follow-ups because the daily foundation pipeline prioritizes video
upload capacity first.
"""
from __future__ import annotations
import argparse, datetime, hashlib, json, secrets, sys, subprocess, time
import re
from pathlib import Path
from approval_gate import approved_candidate_mp4, approved_rows, approved_slugs as load_approved_slugs
from lesson_identity import parse_lesson_title, stable_lesson_identity

ROOT = Path(__file__).resolve().parents[2]
APPROVED_READY_TO_UPLOAD = ROOT / "teaching-videos" / "_audit" / "release-gate" / "approved_ready_to_upload.json"
QUALITY_SANDBOX_ROOT = (ROOT / "teaching-videos" / ".quality-sandbox").resolve()
REPLACEMENT_APPROVAL_ROOT = (ROOT / "teaching-videos" / "_audit" / "replacements").resolve()
MANIFEST_PATH = ROOT / "public" / "data" / "lessons-manifest.json"
PLAYLIST_INSERT_BACKOFF_SECONDS = (2, 5, 10)


def approved_slugs(path: Path = APPROVED_READY_TO_UPLOAD) -> set[str]:
    return load_approved_slugs(path)


def valid_mp4(path: Path) -> bool:
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(path),
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if result.returncode != 0:
            return False
        return float(result.stdout.strip()) > 0
    except Exception:
        return False


def inside(path: Path, root: Path) -> bool:
    return path == root or root in path.parents


def existing_manifest_row(script: dict, manifest_path: Path | None = None) -> dict | None:
    """Return an existing lesson identity, failing closed on ambiguous state."""
    manifest_path = manifest_path or MANIFEST_PATH
    course = str(script.get("course") or "").strip()
    match = re.match(r"\s*(?:Module\s+)?(\d+)\b", str(script.get("module") or ""), re.IGNORECASE)
    if not course or not match:
        raise ValueError("script lacks an exact course/module identity")
    if not manifest_path.is_file():
        raise ValueError(f"canonical lesson manifest is missing: {manifest_path}")
    try:
        payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"canonical lesson manifest is unreadable: {exc}") from exc
    return existing_manifest_payload_row(script, payload)


def existing_manifest_payload_row(script: dict, payload: dict) -> dict | None:
    identity = ordinary_upload_identity(script)
    if not isinstance(payload, dict):
        raise ValueError("canonical lesson manifest payload is not an object")
    def matches(row: Any) -> bool:
        if not isinstance(row, dict):
            return False
        course = str(row.get("course_slug") or row.get("course") or "").strip()
        try:
            number = int(row.get("module_number", -1))
        except (TypeError, ValueError) as exc:
            raise ValueError("canonical lesson manifest has an invalid module number") from exc
        return stable_lesson_identity(course, number) == identity
    flat = [
        row for row in payload.get("lessons", [])
        if matches(row)
    ]
    grouped = [
        row for rows in (payload.get("by_course") or {}).values()
        for row in (rows if isinstance(rows, list) else [])
        if matches(row)
    ]
    if not flat and not grouped:
        return None
    if len(flat) != 1 or len(grouped) != 1:
        raise ValueError("canonical lesson identity is missing or duplicated across manifest copies")
    for key in ("youtube_id", "lesson_dir"):
        if flat[0].get(key) != grouped[0].get(key):
            raise ValueError(f"canonical lesson manifest copies disagree on {key}")
    return flat[0]


def origin_manifest_row(script: dict) -> dict | None:
    fetch = subprocess.run(
        ["git", "fetch", "--quiet", "origin", "main"], cwd=ROOT,
        capture_output=True, text=True, timeout=60,
    )
    if fetch.returncode != 0:
        raise ValueError(f"cannot refresh origin/main: {fetch.stderr.strip() or fetch.returncode}")
    shown = subprocess.run(
        ["git", "show", "origin/main:public/data/lessons-manifest.json"], cwd=ROOT,
        capture_output=True, text=True, timeout=30,
    )
    if shown.returncode != 0:
        raise ValueError(f"cannot read origin/main lesson manifest: {shown.stderr.strip() or shown.returncode}")
    try:
        payload = json.loads(shown.stdout)
    except json.JSONDecodeError as exc:
        raise ValueError(f"origin/main lesson manifest is invalid JSON: {exc}") from exc
    return existing_manifest_payload_row(script, payload)


def ordinary_upload_identity(script: dict) -> str:
    course = str(script.get("course") or "").strip()
    match = re.match(r"\s*(?:Module\s+)?(\d+)\b", str(script.get("module") or ""), re.IGNORECASE)
    if not course or not match:
        raise ValueError("script lacks an exact course/module identity")
    return stable_lesson_identity(course, int(match.group(1)))


def ordinary_upload_binding(
    *, lesson: Path, script: dict, mp4: Path, approval_path: Path,
    privacy: str, force_without_approval: bool, approval_row: dict | None = None,
) -> dict:
    from replacement_lifecycle import sha256_file

    source_script = dict(script)
    source_script.pop("youtube", None)
    return {
        "identity": ordinary_upload_identity(script),
        "lesson_dir": str(lesson.resolve()),
        "script_sha256": hashlib.sha256(
            json.dumps(source_script, sort_keys=True).encode("utf-8")
        ).hexdigest(),
        "mp4": str(mp4.resolve()),
        "mp4_sha256": sha256_file(mp4),
        "approval_file": None if force_without_approval else str(approval_path.resolve()),
        "approval_row": None if force_without_approval else approval_row,
        "privacy": privacy,
    }


def snapshot_authenticated_upload_ids(script: dict | None = None) -> list[str]:
    from replacement_lifecycle import authenticated_upload_inventory, youtube_client
    rows = authenticated_upload_inventory(youtube_client())
    if script is not None:
        identity = ordinary_upload_identity(script)
        duplicates = [
            row for row in rows
            if (parsed := parse_lesson_title(row["title"])) is not None
            and stable_lesson_identity(parsed[0], parsed[1]) == identity
        ]
        if duplicates:
            ids = sorted(row["video_id"] for row in duplicates)
            raise ValueError(f"authenticated channel already contains course/module identity: {ids}")
    return [row["video_id"] for row in rows]


def build_description(script: dict, lesson_dir: Path) -> str:
    course = script.get("course", "")
    module = script.get("module", "")
    sections = script.get("sections", [])

    # Build chapter timestamps from per-section durations.
    # We need to read the master_audio.wav (or per-section wavs) to compute.
    # Fallback: omit chapters if intermediate files aren't present.
    chapters = []
    audio_dir = lesson_dir / "audio"
    intro = float(script.get("intro_music_seconds", 0) or 0)
    cur = intro
    GAP = 0.4
    if audio_dir.is_dir():
        import wave
        for s in sections:
            wav = audio_dir / f"{s['id']}.wav"
            if not wav.exists(): break
            with wave.open(str(wav)) as w:
                dur = w.getnframes() / w.getframerate()
            mins = int(cur // 60); secs = int(cur % 60)
            label = s["id"].split("_", 1)[1].replace("_", " ").title()
            chapters.append(f"{mins:02d}:{secs:02d}  {label}")
            cur += dur + GAP

    parts = [
        f"{course} — {module}",
        "",
        "Genesis of Ideas International is a Florida-registered private high school "
        "(F.S. 1002.42). Real classroom lectures from our 24-credit US diploma curriculum.",
        "",
        "This video is the lecture / overview. To master this module:",
        "  • Read the assigned textbook or course resource",
        "  • Work the module practice in the GIIS Learn Portal",
        "  • Complete the dashboard assignment",
        "  • Book an advisor check-in if anything is fuzzy",
        "",
        "Learn more about GIIS: https://genesisofideas.school",
        "Enrollment options and advisor-supported plans: https://genesisofideas.school/pricing",
    ]
    if "ap " in course.lower():
        parts += [
            "",
            "AP note: this lesson supports AP exam preparation. GIIS does not claim "
            "finalized AP authorization until College Board / CEEB review is confirmed.",
        ]
    if chapters:
        parts += ["", "─── Chapters ───", *chapters]
    return "\n".join(parts)


def transient_playlist_error(exc) -> bool:
    status = getattr(getattr(exc, "resp", None), "status", None)
    try:
        reason = exc._get_reason() or ""
    except Exception:
        reason = str(exc)
    lowered = reason.lower()
    return (
        status in {429, 500, 502, 503, 504}
        or "aborted" in lowered
        or "backend" in lowered
        or "rate limit" in lowered
    )

def add_to_playlist(
    playlist_name: str, video_id: str, privacy: str, *, reconcile_only: bool = False,
    create_reconcile_only: bool = False,
    membership_reconcile_only: bool = False,
    phase_callback=None,
):
    """Find the named playlist on the channel, creating it if missing,
    then add the video. Defers all auth to upload_video.get_creds()."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from upload_video import get_creds  # noqa
    from replacement_lifecycle import playlist_lock
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    yt = build("youtube", "v3", credentials=get_creds())
    phase_callback = phase_callback or (lambda _phase, **_fields: None)
    if reconcile_only:
        create_reconcile_only = True
        membership_reconcile_only = True

    def exact_playlists():
        matches = []
        page = None
        while True:
            response = yt.playlists().list(
                part="snippet", mine=True, maxResults=50, pageToken=page,
            ).execute()
            matches.extend(
                item for item in (response.get("items") or [])
                if str((item.get("snippet") or {}).get("title") or "").casefold()
                == playlist_name.casefold()
            )
            page = response.get("nextPageToken")
            if not page:
                return matches

    with playlist_lock(playlist_name):
        matches = exact_playlists()
        if len(matches) > 1:
            raise RuntimeError(f"multiple managed playlists share the title '{playlist_name}'")
        pid = str(matches[0].get("id") or "") if matches else ""

        if not pid:
            if create_reconcile_only:
                raise RuntimeError(
                    f"playlist creation outcome remains unresolved for '{playlist_name}'"
                )
            phase_callback("create_dispatched")
            body = {"snippet": {"title": playlist_name, "defaultLanguage": "en"},
                    "status": {"privacyStatus": privacy}}
            try:
                response = yt.playlists().insert(part="snippet,status", body=body).execute()
                pid = str(response.get("id") or "")
            except HttpError as exc:
                # Never issue a second create after an uncertain response. Poll
                # exact-title state and let a later retry reconcile if absent.
                for attempt in range(6):
                    matches = exact_playlists()
                    if len(matches) == 1:
                        pid = str(matches[0].get("id") or "")
                        break
                    if len(matches) > 1:
                        raise RuntimeError(
                            f"multiple managed playlists share the title '{playlist_name}'"
                        ) from exc
                    if attempt < 5:
                        time.sleep(2)
                if not pid:
                    raise RuntimeError(
                        f"playlist creation outcome is unresolved for '{playlist_name}'; retry reconciliation later"
                    ) from exc
            if not pid:
                raise RuntimeError(f"playlist creation returned no ID for '{playlist_name}'")
            print(f"[playlist] created or reconciled '{playlist_name}'  {pid}")
        phase_callback("create_completed", playlist_id=pid)

        def memberships():
            response = yt.playlistItems().list(
                part="id,snippet", playlistId=pid, videoId=video_id, maxResults=50,
            ).execute()
            return response.get("items") or []

        existing = memberships()
        if len(existing) > 1:
            raise RuntimeError(f"playlist '{playlist_name}' has duplicate membership for {video_id}")
        if len(existing) == 1:
            phase_callback("membership_completed", playlist_id=pid)
            print(f"[playlist] verified existing {video_id} in '{playlist_name}'")
            return pid
        if membership_reconcile_only:
            raise RuntimeError(
                f"playlist membership outcome remains unresolved for {video_id}; no insert replayed"
            )

        phase_callback("membership_dispatched", playlist_id=pid)
        body = {"snippet": {"playlistId": pid,
                             "resourceId": {"kind": "youtube#video", "videoId": video_id}}}
        try:
            yt.playlistItems().insert(part="snippet", body=body).execute()
            print(f"[playlist] added  {video_id}  →  '{playlist_name}'")
        except HttpError as e:
            reason = e._get_reason()
            # An error response is uncertain. Poll for propagation, but never
            # send a second insert automatically.
            for attempt in range(6):
                observed = memberships()
                if len(observed) == 1:
                    phase_callback("membership_completed", playlist_id=pid)
                    print(f"[playlist] verified {video_id} after uncertain insert response")
                    return pid
                if len(observed) > 1:
                    raise RuntimeError(
                        f"playlist '{playlist_name}' has duplicate membership for {video_id}"
                    ) from e
                if attempt < 5:
                    time.sleep(2)
            label = "transient" if transient_playlist_error(e) else "terminal"
            raise RuntimeError(
                f"{label} playlist insert outcome is unresolved: {reason}; retry reconciliation later"
            ) from e
        for attempt in range(6):
            existing = memberships()
            if len(existing) == 1:
                phase_callback("membership_completed", playlist_id=pid)
                return pid
            if len(existing) > 1:
                raise RuntimeError(f"playlist '{playlist_name}' has duplicate membership for {video_id}")
            if attempt == 5:
                raise RuntimeError(f"playlist membership did not read back for {video_id}")
            time.sleep(2)
        raise RuntimeError(f"playlist membership did not read back for {video_id}")

def run_post_upload_followups(here: Path, lesson: Path, *, no_sync: bool, no_cleanup: bool) -> int:
    """Reconciliation must succeed before local evidence can be removed."""
    if no_sync:
        if not no_cleanup:
            print("[sync] skipped; cleanup disabled, local evidence retained")
        return 0
    rc = subprocess.run(
        [sys.executable, str(here / "sync_channel.py"), "--apply"], check=False,
    ).returncode
    if rc:
        print(f"[sync] returned {rc}; cleanup blocked, local evidence retained", file=sys.stderr)
        return rc
    if not no_cleanup:
        return subprocess.run(
            [sys.executable, str(here / "cleanup_lesson.py"), str(lesson)],
        ).returncode
    return 0


def perform_upload(
    args, lesson: Path, approval_path: Path, script: dict, mp4: Path, *,
    handoff=None, ordinary_intent: tuple[Path, dict] | None = None,
    run_followups: bool = True,
    defer_optional_followups: bool = False,
) -> int:
    """Dispatch one upload while the caller retains any required locks."""
    title = f"{script.get('course','?')} — {script.get('module','?')}"
    description = build_description(script, lesson)
    durable_intent = handoff[1] if handoff is not None else ordinary_intent[1] if ordinary_intent is not None else None
    reconciliation_nonce = str((durable_intent or {}).get("reconciliation_nonce") or "")
    if not reconciliation_nonce:
        raise RuntimeError("upload lacks a durable reconciliation nonce")
    description += f"\n\nGIIS_UPLOAD_INTENT={reconciliation_nonce}"
    transcript = lesson / "transcript.txt"
    srt = lesson / "subtitles.srt"
    thumb = lesson / "slides" / "01_title.png"

    cmd = [sys.executable, str(Path(__file__).parent / "upload_video.py"),
           str(mp4), "--title", title, "--privacy", args.privacy]
    desc_file = lesson / "_yt_description.txt"
    desc_file.write_text(description)
    cmd += ["--description-file", str(desc_file)]
    if not defer_optional_followups and not args.no_captions:
        if transcript.exists():
            cmd += ["--transcript", str(transcript)]
        elif srt.exists():
            cmd += ["--captions", str(srt)]
    if not defer_optional_followups and thumb.exists() and not args.no_thumbnail:
        cmd += ["--thumbnail", str(thumb)]

    if ordinary_intent is not None:
        from replacement_lifecycle import atomic_write_json
        intent_path, intent = ordinary_intent
        intent.update(status="dispatched", dispatched_at=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"))
        atomic_write_json(intent_path, intent)

    print(f"[upload-lesson] {title}\n[upload-lesson] {mp4}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    desc_file.unlink(missing_ok=True)
    sys.stdout.write(result.stdout)
    sys.stderr.write(result.stderr)
    video_id = None
    for line in result.stdout.splitlines():
        if line.startswith("VIDEO_ID="):
            video_id = line.split("=", 1)[1].strip()
            break
    if not video_id and result.returncode != 0:
        sys.exit(result.returncode)
    if not video_id:
        print("[upload-lesson] upload command succeeded but did not return VIDEO_ID; outcome requires reconciliation", file=sys.stderr)
        sys.exit(2)

    uploaded_at = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    script["youtube"] = {
        "video_id": video_id,
        "url": f"https://youtu.be/{video_id}",
        "embed_url": f"https://www.youtube.com/embed/{video_id}",
        "studio_url": f"https://studio.youtube.com/video/{video_id}/edit",
        "privacy": args.privacy,
        "playlist": args.playlist or script.get("course"),
        "playlist_id": None,
        "uploaded_at": uploaded_at,
    }
    script_path = lesson / "script.json"
    if handoff is not None:
        from replacement_lifecycle import record_upload_result, atomic_write_json
        record_upload_result(handoff, script["youtube"])
        atomic_write_json(script_path, script)
    elif ordinary_intent is not None:
        from replacement_lifecycle import atomic_write_json
        intent_path, intent = ordinary_intent
        intent.update(status="uploaded", youtube=script["youtube"], uploaded_at=uploaded_at)
        atomic_write_json(intent_path, intent)
        atomic_write_json(script_path, script)
    else:
        raise RuntimeError("upload lacks replacement or ordinary durable intent")
    print(f"[script.json] saved youtube.video_id = {video_id}")
    if result.returncode != 0:
        print("[upload-lesson] core upload returned an ID but a later uploader step failed; identity persisted for reconciliation", file=sys.stderr)
        sys.exit(result.returncode)

    playlist_id = None
    if not defer_optional_followups and not args.no_playlist:
        playlist_name = args.playlist or script.get("course")
        if playlist_name:
            try:
                playlist_id = add_to_playlist(playlist_name, video_id, args.privacy)
            except Exception as exc:
                print(f"[playlist] skipped after upload: {exc}")
        if playlist_id:
            script["youtube"]["playlist_id"] = playlist_id
            if ordinary_intent is not None:
                from replacement_lifecycle import atomic_write_json
                intent_path, intent = ordinary_intent
                intent["youtube"] = script["youtube"]
                atomic_write_json(intent_path, intent)
                atomic_write_json(script_path, script)
            else:
                script_path.write_text(json.dumps(script, indent=2, ensure_ascii=False) + "\n")

    if run_followups:
        return run_post_upload_followups(
            Path(__file__).resolve().parent, lesson,
            no_sync=args.no_sync, no_cleanup=args.no_cleanup,
        )
    return 0


def run_optional_media_followups(
    lesson: Path, video_id: str, *, no_thumbnail: bool, no_captions: bool,
) -> dict[str, str]:
    """Upload optional media without holding release or identity locks."""
    results = {"video_id": video_id, "thumbnail": "skipped", "captions": "skipped"}
    if not no_thumbnail:
        thumb = lesson / "slides" / "01_title.png"
        if thumb.exists():
            try:
                from upload_video import upload_thumbnail
                upload_thumbnail(video_id, thumb)
                results["thumbnail"] = "uploaded"
            except Exception as exc:
                results["thumbnail"] = f"error:{type(exc).__name__}"
                print(f"[thumbnail] skipped after upload: {exc}")
        else:
            results["thumbnail"] = "missing"
    if not no_captions:
        transcript = lesson / "transcript.txt"
        srt = lesson / "subtitles.srt"
        try:
            if transcript.exists():
                from upload_video import upload_transcript
                upload_transcript(video_id, transcript)
                results["captions"] = "transcript_uploaded"
            elif srt.exists():
                from upload_video import upload_captions
                upload_captions(video_id, srt)
                results["captions"] = "srt_uploaded"
            else:
                results["captions"] = "missing"
        except Exception as exc:
            results["captions"] = f"error:{type(exc).__name__}"
            print(f"[captions] skipped after upload: {exc}")
    return results


def run_optional_upload_followups(args, lesson: Path, identity: str, intent_path: Path) -> None:
    """Run non-identity media and playlist work after upload locks close."""
    from replacement_lifecycle import (
        ReplacementError,
        atomic_write_json,
        identity_lock,
        identity_state_path,
        media_followup_lock,
        read_json,
        run_durable_optional_media_followups,
        sha256_file,
    )

    script_path = lesson / "script.json"
    script = json.loads(script_path.read_text(encoding="utf-8"))
    youtube = script.get("youtube") or {}
    video_id = str(youtube.get("video_id") or "")
    if not video_id:
        raise ReplacementError("optional upload follow-up lacks a durable video ID")

    media_receipt = identity_state_path(
        identity, f".ordinary-media-{video_id}.receipt.json"
    )
    run_durable_optional_media_followups(
        identity=identity,
        operation="ordinary-upload",
        lesson=lesson,
        video_id=video_id,
        receipt_path=media_receipt,
        binding={"upload_intent_path": str(intent_path.resolve())},
        no_thumbnail=args.no_thumbnail,
        no_captions=args.no_captions,
    )

    playlist_id = None
    playlist_receipt_path = None
    if not args.no_playlist:
        playlist_name = args.playlist or script.get("course")
        if playlist_name:
            playlist_receipt_path = identity_state_path(
                identity, f".ordinary-playlist-{video_id}.receipt.json"
            )
            playlist_intent_path = identity_state_path(
                identity, f".ordinary-playlist-{video_id}.intent.json"
            )
            playlist_binding = {
                "schema_version": "giis.youtube-ordinary-playlist.v1",
                "identity": identity,
                "video_id": video_id,
                "playlist_name": playlist_name,
                "upload_intent_path": str(intent_path.resolve()),
            }
            with media_followup_lock(identity):
                if playlist_intent_path.exists():
                    playlist_intent = read_json(playlist_intent_path)
                    for key, value in playlist_binding.items():
                        if playlist_intent.get(key) != value:
                            raise ReplacementError(f"playlist intent {key} mismatch")
                    if playlist_intent.get("status") not in {"dispatched", "completed"}:
                        raise ReplacementError("playlist intent has unsupported status")
                    if playlist_intent.get("status") == "completed":
                        if not playlist_receipt_path.is_file():
                            raise ReplacementError("completed playlist intent lacks receipt")
                        if sha256_file(playlist_receipt_path) != playlist_intent.get("receipt_sha256"):
                            raise ReplacementError("playlist receipt hash mismatch")
                        playlist_id = str(playlist_intent.get("playlist_id") or "")
                        if not playlist_id:
                            raise ReplacementError("completed playlist intent lacks playlist ID")
                        playlist_intent = None
                    elif not all(
                        playlist_intent.get(key) in {"ready", "dispatched", "completed"}
                        for key in ("create_status", "membership_status")
                    ):
                        raise ReplacementError(
                            "legacy playlist intent lacks separate create/membership phases; reconcile manually"
                        )
                else:
                    playlist_intent = {
                        **playlist_binding,
                        "status": "dispatched",
                        "create_status": "ready",
                        "membership_status": "ready",
                        "started_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
                    }
                    atomic_write_json(playlist_intent_path, playlist_intent)
                if playlist_intent is not None:
                    def persist_phase(phase, **fields):
                        key, value = phase.rsplit("_", 1)
                        playlist_intent[f"{key}_status"] = value
                        playlist_intent.update(fields)
                        atomic_write_json(playlist_intent_path, playlist_intent)

                    playlist_id = add_to_playlist(
                        playlist_name, video_id, args.privacy,
                        create_reconcile_only=playlist_intent["create_status"] == "dispatched",
                        membership_reconcile_only=playlist_intent["membership_status"] == "dispatched",
                        phase_callback=persist_phase,
                    )
                    atomic_write_json(playlist_receipt_path, {
                        **playlist_binding,
                        "status": "PASS",
                        "playlist_id": playlist_id,
                        "verified_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
                    })
                    playlist_intent.update(
                        status="completed",
                        playlist_id=playlist_id,
                        receipt_path=str(playlist_receipt_path.resolve()),
                        receipt_sha256=sha256_file(playlist_receipt_path),
                        completed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
                    )
                    atomic_write_json(playlist_intent_path, playlist_intent)
    if not playlist_id:
        return

    with identity_lock(identity):
        locked_script = json.loads(script_path.read_text(encoding="utf-8"))
        locked_intent = read_json(intent_path)
        require_id = str(((locked_script.get("youtube") or {}).get("video_id")) or "")
        intent_id = str(((locked_intent.get("youtube") or {}).get("video_id")) or "")
        if require_id != video_id or intent_id != video_id:
            raise ReplacementError("upload identity changed before playlist persistence")
        locked_script["youtube"]["playlist_id"] = playlist_id
        locked_intent["youtube"]["playlist_id"] = playlist_id
        locked_intent["playlist_receipt"] = str(playlist_receipt_path.resolve())
        locked_intent["playlist_receipt_sha256"] = sha256_file(playlist_receipt_path)
        atomic_write_json(intent_path, locked_intent)
        atomic_write_json(script_path, locked_script)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lesson_dir", type=Path)
    ap.add_argument("--privacy", default="unlisted",
                    choices=["public", "unlisted", "private"])
    ap.add_argument("--no-thumbnail", action="store_true")
    ap.add_argument("--no-captions", action="store_true")
    ap.add_argument("--playlist",
                    help="add the uploaded video to this playlist (creates if missing). "
                         "default: use the script.json `course` field, e.g. 'Algebra I'.")
    ap.add_argument("--no-playlist", action="store_true",
                    help="skip playlist auto-add even if --playlist or course field is set")
    ap.add_argument("--no-sync", action="store_true",
                    help="skip sync_channel.py after upload and retain all local evidence (implies --no-cleanup)")
    ap.add_argument("--no-cleanup", action="store_true",
                    help="after a successful upload, skip auto-deletion of local "
                         "slides/audio/mp4 (which is the default). Useful for debugging.")
    ap.add_argument("--replacement", action="store_true",
                    help="staged replacement upload: force no playlist, no channel sync, "
                         "and no local cleanup until website readback and old-ID retirement")
    ap.add_argument("--reconcile-upload", action="store_true",
                    help="adopt one exact upload from an unresolved ordinary upload intent")
    ap.add_argument("--replacement-plan", type=Path, help=argparse.SUPPRESS)
    ap.add_argument("--replacement-token", help=argparse.SUPPRESS)
    ap.add_argument("--release-lock-fd", type=int, help=argparse.SUPPRESS)
    ap.add_argument("--identity-lock-fd", type=int, help=argparse.SUPPRESS)
    ap.add_argument("--force-without-approval", action="store_true",
                    help="emergency override: bypass approved_ready_to_upload.json")
    ap.add_argument("--approval-file", type=Path, default=APPROVED_READY_TO_UPLOAD,
                    help="approved_ready_to_upload.json path to check before upload")
    args = ap.parse_args()

    lesson = args.lesson_dir.resolve()
    approval_path = args.approval_file.resolve()
    replacement_scope = inside(lesson, QUALITY_SANDBOX_ROOT) or inside(approval_path, REPLACEMENT_APPROVAL_ROOT)
    if replacement_scope and not args.replacement:
        ap.error("quality-sandbox candidates and replacement approvals require --replacement")
    handoff = None
    if not args.replacement and any(value is not None for value in (
        args.replacement_plan, args.replacement_token, args.release_lock_fd, args.identity_lock_fd,
    )):
        ap.error("replacement handoff arguments require --replacement")
    if args.replacement:
        if args.reconcile_upload:
            ap.error("--reconcile-upload is only for ordinary uploads; use replacement_lifecycle.py reconcile-upload")
        if args.force_without_approval:
            ap.error("--replacement cannot be combined with --force-without-approval")
        if not inside(lesson, QUALITY_SANDBOX_ROOT) or not inside(approval_path, REPLACEMENT_APPROVAL_ROOT):
            ap.error("--replacement requires both a .quality-sandbox lesson and a scoped _audit/replacements approval")
        if any(value is None for value in (
            args.replacement_plan, args.replacement_token, args.release_lock_fd, args.identity_lock_fd,
        )):
            ap.error("--replacement requires the locked replacement_lifecycle upload handoff")
        args.no_playlist = True
        args.no_sync = True
        args.no_cleanup = True
        print("[replacement] staged upload mode: playlist/sync/cleanup disabled")

    if args.no_sync:
        args.no_cleanup = True

    args.approval_file = approval_path
    if not lesson.is_dir():
        sys.exit(f"not a folder: {lesson}")
    script_path = lesson / "script.json"
    if not script_path.exists():
        sys.exit(f"missing {script_path}")
    script = json.loads(script_path.read_text())

    approved_mp4 = None
    if not args.force_without_approval:
        approval = approved_rows(args.approval_file).get(lesson.name)
        approved_mp4 = approved_candidate_mp4(approval, lesson_dir=lesson) if approval else None
        if approved_mp4 is None:
            sys.exit(f"lesson lacks a current version-bound approval in {args.approval_file}; refusing upload")

    # Find the rendered MP4 (folder name with hyphens normalized to underscores).
    mp4 = approved_mp4 or lesson / f"{lesson.name.replace('-', '_')}.mp4"
    if approved_mp4 is None and not mp4.exists():
        # fall back: any mp4 in the folder
        candidates = list(lesson.glob("*.mp4"))
        if len(candidates) != 1:
            sys.exit(f"can't find a single MP4 in {lesson} — render it first with make_lesson.py")
        mp4 = candidates[0]
    if not valid_mp4(mp4):
        sys.exit(f"invalid MP4 (ffprobe failed): {mp4}")

    if args.replacement:
        from replacement_lifecycle import ReplacementError, consume_upload_handoff
        try:
            handoff = consume_upload_handoff(
                args.replacement_plan.resolve(), args.replacement_token,
                lesson, approval_path, mp4, args.privacy,
                args.release_lock_fd, args.identity_lock_fd,
            )
        except (ReplacementError, OSError, ValueError, KeyError) as exc:
            ap.error(f"invalid replacement upload handoff: {exc}")

    if args.replacement:
        return perform_upload(
            args, lesson, approval_path, script, mp4, handoff=handoff,
            defer_optional_followups=True,
        )

    from replacement_lifecycle import (
        ReplacementError,
        atomic_write_json,
        identity_lock,
        identity_state_path,
        read_json,
        release_lock,
    )
    try:
        identity = ordinary_upload_identity(script)
        with release_lock(), identity_lock(identity):
            # Both concurrent ordinary uploads and a manifest publication that
            # raced the first preflight are stopped by this locked re-read.
            locked_script = json.loads(script_path.read_text(encoding="utf-8"))
            if ordinary_upload_identity(locked_script) != identity:
                raise ReplacementError("course/module identity changed while waiting for upload locks")
            existing_locked_id = str(
                ((locked_script.get("youtube") or {}).get("video_id")) or ""
            ).strip()
            local_manifest_row = existing_manifest_row(locked_script)
            remote_manifest_row = origin_manifest_row(locked_script)
            locked_mp4 = mp4.resolve()
            approval = None
            if not args.force_without_approval:
                approval = approved_rows(approval_path).get(lesson.name)
                approved_again = approved_candidate_mp4(approval, lesson_dir=lesson) if approval else None
                if approved_again is None or approved_again.resolve() != locked_mp4:
                    raise ReplacementError("version-bound upload approval changed while waiting for locks")
            if not valid_mp4(locked_mp4):
                raise ReplacementError("approved MP4 changed or became invalid while waiting for locks")

            binding = ordinary_upload_binding(
                lesson=lesson,
                script=locked_script,
                mp4=locked_mp4,
                approval_path=approval_path,
                privacy=args.privacy,
                force_without_approval=args.force_without_approval,
                approval_row=approval,
            )
            intent_path = identity_state_path(identity, ".ordinary-upload.json")
            if intent_path.exists():
                prior = read_json(intent_path)
                for key, value in binding.items():
                    if prior.get(key) != value:
                        raise ReplacementError("ordinary upload intent belongs to different immutable inputs")
                youtube = prior.get("youtube") or {}
                if prior.get("status") != "uploaded" or not youtube.get("video_id"):
                    if not args.reconcile_upload or prior.get("status") != "dispatched":
                        raise ReplacementError(
                            "prior ordinary upload outcome is unresolved; rerun with --reconcile-upload"
                        )
                    from replacement_lifecycle import (
                        adopted_youtube_payload,
                        find_exact_upload_adoption,
                        validate_reconciliation_intent,
                        youtube_client,
                    )
                    nonce, pre_dispatch_ids, dispatched_at = validate_reconciliation_intent(
                        prior, require_dispatched=True,
                    )
                    row = find_exact_upload_adoption(
                        youtube_client(),
                        expected_title=f"{locked_script.get('course','?')} — {locked_script.get('module','?')}",
                        privacy=args.privacy,
                        started_at=dispatched_at,
                        reconciliation_nonce=nonce,
                        pre_dispatch_video_ids=pre_dispatch_ids,
                    )
                    youtube = adopted_youtube_payload(
                        row, privacy=args.privacy,
                        playlist_name=args.playlist or locked_script.get("course"),
                    )
                    prior.update(
                        status="uploaded", youtube=youtube,
                        reconciled_at=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
                    )
                    atomic_write_json(intent_path, prior)
                durable_video_id = str(youtube.get("video_id") or "")
                for label, manifest_row in (
                    ("local", local_manifest_row), ("origin/main", remote_manifest_row),
                ):
                    if manifest_row is not None and str(manifest_row.get("youtube_id") or "") != durable_video_id:
                        raise ReplacementError(
                            f"{label} manifest identity differs from durable ordinary upload result"
                        )
                if existing_locked_id and existing_locked_id != youtube["video_id"]:
                    raise ReplacementError("script video ID differs from durable ordinary upload result")
                locked_script["youtube"] = youtube
                atomic_write_json(script_path, locked_script)
                print(f"[recovered-upload] {youtube['video_id']}; local evidence retained for follow-up reconciliation")
            else:
                if args.reconcile_upload:
                    raise ReplacementError("cannot reconcile without an existing ordinary upload intent")
                if existing_locked_id:
                    raise ReplacementError(
                        "lesson already has an unbound YouTube identity; use the locked replacement lifecycle"
                    )
                if local_manifest_row is not None:
                    raise ReplacementError(
                        "course/module entered the local lesson manifest; use the locked replacement lifecycle"
                    )
                if remote_manifest_row is not None:
                    raise ReplacementError(
                        "course/module already exists in origin/main; use the locked replacement lifecycle"
                    )
                intent = {
                    **binding,
                    "token": secrets.token_hex(32),
                    "reconciliation_nonce": secrets.token_hex(24),
                    "pre_dispatch_video_ids": sorted(set(snapshot_authenticated_upload_ids(locked_script))),
                    "status": "ready",
                    "started_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
                }
                atomic_write_json(intent_path, intent)
                perform_upload(
                    args,
                    lesson,
                    approval_path,
                    locked_script,
                    locked_mp4,
                    ordinary_intent=(intent_path, intent),
                    run_followups=False,
                    defer_optional_followups=True,
                )
        # Optional media, playlist, and sync work run only after the
        # upload-critical locks close.
        run_optional_upload_followups(args, lesson, identity, intent_path)
        return run_post_upload_followups(
            Path(__file__).resolve().parent,
            lesson,
            no_sync=args.no_sync,
            no_cleanup=args.no_cleanup,
        )
    except (ReplacementError, OSError, ValueError, KeyError) as exc:
        ap.error(f"ordinary upload safety gate failed: {exc}")

if __name__ == "__main__":
    sys.exit(main())
