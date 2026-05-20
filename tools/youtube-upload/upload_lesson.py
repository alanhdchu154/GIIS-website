#!/usr/bin/env python3
"""High-level: upload a complete lesson folder to YouTube.

Usage:
    python3 upload_lesson.py teaching-videos/algebra-i-module-4-sample/
       [--privacy unlisted|private|public]

Reads the lesson's `script.json` to auto-generate title, description, and tags.
Uploads the rendered MP4 + attaches the SRT captions + sets the title slide
as the thumbnail. Prints the YouTube URL when done.
"""
from __future__ import annotations
import argparse, json, sys, subprocess
from pathlib import Path

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
        "  • Read the assigned OpenStax chapter",
        "  • Work the Khan Academy practice set",
        "  • Complete the dashboard assignment",
        "  • Book an advisor check-in if anything is fuzzy",
        "",
        "Learn more about GIIS: https://genesisofideas.school",
        "Founders pricing — first 100 students: https://genesisofideas.school/pricing",
    ]
    if chapters:
        parts += ["", "─── Chapters ───", *chapters]
    return "\n".join(parts)

def add_to_playlist(playlist_name: str, video_id: str, privacy: str):
    """Find the named playlist on the channel, creating it if missing,
    then add the video. Defers all auth to upload_video.get_creds()."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from upload_video import get_creds  # noqa
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    yt = build("youtube", "v3", credentials=get_creds())

    # Search for an existing playlist by exact title (case-insensitive).
    pid = None
    page = None
    while True:
        resp = yt.playlists().list(part="snippet",
                                   mine=True, maxResults=50,
                                   pageToken=page).execute()
        for it in resp.get("items", []):
            if it["snippet"]["title"].lower() == playlist_name.lower():
                pid = it["id"]; break
        if pid or not resp.get("nextPageToken"): break
        page = resp["nextPageToken"]

    if not pid:
        body = {"snippet": {"title": playlist_name, "defaultLanguage": "en"},
                "status": {"privacyStatus": privacy}}
        resp = yt.playlists().insert(part="snippet,status", body=body).execute()
        pid = resp["id"]
        print(f"[playlist] created  '{playlist_name}'  {pid}")

    body = {"snippet": {"playlistId": pid,
                         "resourceId": {"kind": "youtube#video", "videoId": video_id}}}
    try:
        yt.playlistItems().insert(part="snippet", body=body).execute()
        print(f"[playlist] added  {video_id}  →  '{playlist_name}'")
    except HttpError as e:
        print(f"[playlist] add failed: {e._get_reason()}")
    return pid

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
    ap.add_argument("--no-cleanup", action="store_true",
                    help="after a successful upload, skip auto-deletion of local "
                         "slides/audio/mp4 (which is the default). Useful for debugging.")
    args = ap.parse_args()

    lesson = args.lesson_dir.resolve()
    if not lesson.is_dir():
        sys.exit(f"not a folder: {lesson}")
    script_path = lesson / "script.json"
    if not script_path.exists():
        sys.exit(f"missing {script_path}")
    script = json.loads(script_path.read_text())

    # Find the rendered MP4 (folder name with hyphens normalized to underscores).
    mp4 = lesson / f"{lesson.name.replace('-', '_')}.mp4"
    if not mp4.exists():
        # fall back: any mp4 in the folder
        candidates = list(lesson.glob("*.mp4"))
        if len(candidates) != 1:
            sys.exit(f"can't find a single MP4 in {lesson} — render it first with make_lesson.py")
        mp4 = candidates[0]

    title = f"{script.get('course','?')} — {script.get('module','?')}"
    description = build_description(script, lesson)
    # Prefer transcript.txt (YouTube auto-aligns plain text via Google STT —
    # better than any local subtitle alignment). Fall back to legacy SRT if
    # transcript isn't there (e.g. older lesson rendered before this change).
    transcript = lesson / "transcript.txt"
    srt        = lesson / "subtitles.srt"
    thumb      = lesson / "slides" / "01_title.png"

    cmd = [sys.executable, str(Path(__file__).parent / "upload_video.py"),
           str(mp4), "--title", title, "--privacy", args.privacy]
    # Pass description via a temp file to avoid shell escaping.
    desc_file = lesson / "_yt_description.txt"
    desc_file.write_text(description)
    cmd += ["--description-file", str(desc_file)]
    if not args.no_captions:
        if transcript.exists():
            cmd += ["--transcript", str(transcript)]
        elif srt.exists():
            cmd += ["--captions", str(srt)]
    if thumb.exists() and not args.no_thumbnail:
        cmd += ["--thumbnail", str(thumb)]
    print(f"[upload-lesson] {title}\n[upload-lesson] {mp4}")
    r = subprocess.run(cmd, capture_output=True, text=True)
    desc_file.unlink(missing_ok=True)
    # Forward upload_video.py's stdout/stderr to the user.
    sys.stdout.write(r.stdout)
    sys.stderr.write(r.stderr)
    if r.returncode != 0:
        sys.exit(r.returncode)
    # Pull the freshly-uploaded VIDEO_ID out of upload_video.py's stdout.
    video_id = None
    for line in r.stdout.splitlines():
        if line.startswith("VIDEO_ID="):
            video_id = line.split("=", 1)[1].strip()
            break
    if not video_id:
        return

    # Add to course playlist (auto-creates).
    playlist_id = None
    if not args.no_playlist:
        playlist_name = args.playlist or script.get("course")
        if playlist_name:
            playlist_id = add_to_playlist(playlist_name, video_id, args.privacy)

    # Persist the YouTube identity back into script.json so the lesson is the
    # source of truth (Learn Portal reads from here via the manifest builder).
    import datetime
    script["youtube"] = {
        "video_id":    video_id,
        "url":         f"https://youtu.be/{video_id}",
        "embed_url":   f"https://www.youtube.com/embed/{video_id}",
        "studio_url":  f"https://studio.youtube.com/video/{video_id}/edit",
        "privacy":     args.privacy,
        "playlist":    args.playlist or script.get("course"),
        "playlist_id": playlist_id,
        "uploaded_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
    }
    script_path.write_text(json.dumps(script, indent=2, ensure_ascii=False) + "\n")
    print(f"[script.json] saved youtube.video_id = {video_id}")

    # Reconcile against the live YouTube channel — handles duplicates from
    # re-uploads, manual deletes, and pulls the canonical state into the
    # manifest the Learn Portal reads. Cheap (~5 quota units when no dups).
    here = Path(__file__).resolve().parent
    subprocess.run([sys.executable, str(here / "sync_channel.py"), "--apply"], check=False)

    # Auto-cleanup local artifacts (slides/, audio/, *.mp4, *.wav, etc.) now
    # that the video is verifiably live on YouTube. Saves 15-210MB per lesson
    # and keeps the repo lean for everyone. Three-layer safety net inside
    # cleanup_lesson.py refuses if anything looks wrong — uploaded video must
    # really be 'processed' on the channel before we touch local files.
    #
    # Pass --no-cleanup to keep artifacts (e.g. for debugging a bad render).
    if not args.no_cleanup:
        print()
        cleanup_rc = subprocess.run(
            [sys.executable, str(here / "cleanup_lesson.py"), str(lesson)],
        ).returncode
        if cleanup_rc != 0:
            print(f"[cleanup] returned {cleanup_rc} — local artifacts NOT removed. "
                  f"This is safe (the YouTube upload is fine); the lesson folder "
                  f"will use disk until next manual cleanup. See message above.")

if __name__ == "__main__":
    main()
