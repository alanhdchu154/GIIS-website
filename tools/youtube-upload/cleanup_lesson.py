#!/usr/bin/env python3
"""Delete local artifacts of a lesson after it's been successfully uploaded.

Why this exists
---------------
A finished lesson folder is ~15-210MB (mostly the MP4 + slide PNGs + audio MP3s).
Once the video is live on YouTube, those local artifacts are dead weight — they
can be regenerated from `script.json` + `build_slides.py` if ever needed, and
YouTube itself is the canonical storage of the rendered output.

For 200+ lessons across the 4-year curriculum this saves 3-40 GB and dramatically
speeds up `git clone` / `git push` once paired with the .gitignore rules.

Three-layer safety net (all must pass before deletion)
-----------------------------------------------------
  Layer 1 — LOCAL:   script.json has a complete `youtube` block (all required
                     fields present and non-empty).
  Layer 2 — REMOTE:  YouTube Data API confirms the video_id exists in the
                     authenticated channel AND status.uploadStatus == "processed".
  Layer 3 — DELETE:  Remove slides/, audio/, *.mp4, *.wav, subtitles.srt,
                     _yt_description.txt. Keep script.json + build_slides.py.
                     Write `.cleaned` breadcrumb so future tools recognize the
                     folder is intentionally slim (not broken).

Refuses to do anything if ANY layer fails. Loud about why.

Usage
-----
    python3 tools/youtube-upload/cleanup_lesson.py teaching-videos/<slug>/
    python3 tools/youtube-upload/cleanup_lesson.py teaching-videos/<slug>/ --dry-run

Exit codes
----------
    0  cleaned (or dry-run reported clean)
    2  refused — layer 1 or 2 failed (this is healthy: keeps you from torching
       a folder whose upload didn't fully succeed)
    1  unexpected error
"""
from __future__ import annotations
import argparse, json, shutil, sys, datetime
from pathlib import Path

# Files / dirs we ALWAYS keep — the lesson's source of truth.
# script.json:      narration text + youtube.video_id (single canonical record)
# build_slides.py:  regenerates slides/ deterministically from slide_kit
# .cleaned:         breadcrumb (this script writes it)
# README.md, etc.:  per-lesson notes if the author left them
KEEP_NAMES = {"script.json", "build_slides.py", ".cleaned", "README.md", "NOTES.md"}

# Files in the lesson folder that are regenerable artifacts.
DELETE_DIRS  = {"slides", "audio", "__pycache__"}
DELETE_GLOBS = [
    "*.mp4", "*.wav", "*.mp3",
    "subtitles.srt", "subtitles.ass",
    "slides_concat.txt",
    "_yt_description.txt",
]

REQUIRED_YT_FIELDS = ("video_id", "url", "uploaded_at", "privacy")


# ─── colors (for terminal logging) ─────────────────────────────────────
G, Y, R, D, RESET, B = "\033[32m", "\033[33m", "\033[31m", "\033[2m", "\033[0m", "\033[1m"


def log(msg: str, color: str = ""):
    print(f"{color}{msg}{RESET}" if color else msg)


# ─── layer 1: local validation ─────────────────────────────────────────
def layer1_local_check(lesson_dir: Path) -> dict:
    """Return the youtube block from script.json if complete, else raise."""
    script_path = lesson_dir / "script.json"
    if not script_path.exists():
        raise SystemExit(f"{R}layer 1 FAIL{RESET}: no script.json in {lesson_dir}")
    script = json.loads(script_path.read_text())
    yt = script.get("youtube") or {}
    missing = [k for k in REQUIRED_YT_FIELDS if not yt.get(k)]
    if missing:
        raise SystemExit(
            f"{R}layer 1 FAIL{RESET}: script.json.youtube missing required fields: "
            f"{missing}. Refusing cleanup. Either the upload didn't fully finish or "
            f"this folder was never uploaded. Re-run `upload_lesson.py` first."
        )
    return yt


# ─── layer 2: remote validation ────────────────────────────────────────
def layer2_remote_check(video_id: str, expected_title: str | None = None):
    """Hit YouTube Data API and confirm the video is alive and processed."""
    # Lazy import — sandbox CI runs that don't need cleanup shouldn't pull google deps.
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from upload_video import get_creds  # type: ignore
    from googleapiclient.discovery import build  # type: ignore
    from googleapiclient.errors import HttpError  # type: ignore

    yt = build("youtube", "v3", credentials=get_creds())
    try:
        resp = yt.videos().list(id=video_id, part="status,snippet").execute()
    except HttpError as e:
        raise SystemExit(f"{R}layer 2 FAIL{RESET}: YouTube API error: {e}")

    items = resp.get("items", [])
    if not items:
        raise SystemExit(
            f"{R}layer 2 FAIL{RESET}: video_id {video_id} not found on this channel. "
            f"It may have been deleted or belong to a different account. "
            f"Refusing cleanup to avoid orphaning the local source."
        )

    snippet = items[0]["snippet"]
    status = items[0]["status"]
    upload_status = status.get("uploadStatus")
    if upload_status != "processed":
        raise SystemExit(
            f"{R}layer 2 FAIL{RESET}: video still {upload_status} (need 'processed'). "
            f"Wait for YouTube to finish processing before cleaning up."
        )

    if expected_title and snippet.get("title") != expected_title:
        # Not necessarily fatal — title could've been hand-edited. Just warn.
        log(f"{Y}layer 2 WARN{RESET}: title mismatch", Y)
        log(f"  local script.json expects: {expected_title}")
        log(f"  YouTube currently has:     {snippet.get('title')}")

    return {
        "title":         snippet.get("title"),
        "upload_status": upload_status,
        "privacy":       status.get("privacyStatus"),
    }


# ─── layer 3: actual deletion ──────────────────────────────────────────
def layer3_delete(lesson_dir: Path, dry_run: bool = False) -> dict:
    """Remove regenerable artifacts; keep script.json + build_slides.py.

    Returns dict { removed: [paths], kept: [paths], failed: [paths],
                    bytes_freed: int }.

    Partial failures (e.g. PermissionError on one file but not another) don't
    abort. We try every candidate, then return a summary. Caller decides
    whether to write the .cleaned breadcrumb based on whether failed == [].
    """
    removed, kept, failed, bytes_freed = [], [], [], 0

    def size_of(p: Path) -> int:
        try:
            if p.is_file(): return p.stat().st_size
            return sum(f.stat().st_size for f in p.rglob("*") if f.is_file())
        except OSError:
            return 0

    for item in sorted(lesson_dir.iterdir()):
        if item.name in KEEP_NAMES:
            kept.append(item.name); continue

        delete_this = False
        if item.is_dir() and item.name in DELETE_DIRS:
            delete_this = True
        elif item.is_file():
            for pat in DELETE_GLOBS:
                if item.match(pat):
                    delete_this = True; break

        if not delete_this:
            # Conservative default: unfamiliar files stay.
            kept.append(item.name); continue

        sz = size_of(item)
        if dry_run:
            removed.append(f"would remove: {item.name} ({_human(sz)})")
            bytes_freed += sz
            continue

        try:
            if item.is_dir(): shutil.rmtree(item)
            else:              item.unlink()
            removed.append(f"removed: {item.name} ({_human(sz)})")
            bytes_freed += sz
        except (PermissionError, OSError) as e:
            failed.append(f"FAILED to remove {item.name}: {e}")

    return {"removed": removed, "kept": kept, "failed": failed,
            "bytes_freed": bytes_freed}


def _human(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024: return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


# ─── breadcrumb ────────────────────────────────────────────────────────
def write_cleaned_marker(lesson_dir: Path, yt_block: dict, remote: dict, bytes_freed: int):
    """Leave a .cleaned file so other tools know the folder is intentionally slim."""
    (lesson_dir / ".cleaned").write_text(
        f"# Lesson auto-cleaned after successful YouTube upload\n"
        f"# This folder no longer has slides/audio/mp4 — they're regenerable\n"
        f"# from script.json + build_slides.py. Don't worry, the lesson is fine.\n"
        f"\n"
        f"cleaned_at:    {datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')}\n"
        f"video_id:      {yt_block['video_id']}\n"
        f"url:           {yt_block['url']}\n"
        f"title:         {remote['title']}\n"
        f"upload_status: {remote['upload_status']}\n"
        f"bytes_freed:   {bytes_freed}\n"
        f"\n"
        f"# To rebuild this lesson locally (e.g. if YouTube ever takes the video down):\n"
        f"#   python3 build_slides.py\n"
        f"#   python3 ../../tools/lesson-video/make_lesson.py .\n"
        f"# Then delete this .cleaned file and the youtube block in script.json.\n"
    )


# ─── orchestration ─────────────────────────────────────────────────────
def cleanup(lesson_dir: Path, dry_run: bool = False, skip_remote: bool = False) -> int:
    lesson_dir = lesson_dir.resolve()
    if not lesson_dir.is_dir():
        log(f"{R}not a directory: {lesson_dir}{RESET}", R); return 1

    log(f"{B}cleanup: {lesson_dir.name}{RESET}")

    # Layer 1
    yt_block = layer1_local_check(lesson_dir)
    log(f"  {G}layer 1 OK{RESET}  ·  script.json.youtube has all required fields", D)

    # Layer 2
    if skip_remote:
        log(f"  {Y}layer 2 SKIPPED{RESET}  ·  --skip-remote was set", Y)
        remote = {"title": None, "upload_status": "(skipped)", "privacy": None}
    else:
        expected_title = None
        try:
            script = json.loads((lesson_dir / "script.json").read_text())
            expected_title = f"{script.get('course','')} — {script.get('module','')}"
        except Exception:
            pass
        remote = layer2_remote_check(yt_block["video_id"], expected_title)
        log(f"  {G}layer 2 OK{RESET}  ·  YouTube confirms {yt_block['video_id']} "
            f"({remote['upload_status']})", D)

    # Layer 3
    result = layer3_delete(lesson_dir, dry_run=dry_run)
    verb = "would free" if dry_run else "freed"
    status = "PARTIAL" if result["failed"] else "OK"
    color = Y if result["failed"] else G
    log(f"  {color}layer 3 {status}{RESET}  ·  {verb} {_human(result['bytes_freed'])}", D)
    for line in result["removed"]:
        log(f"    {D}- {line}{RESET}")
    for line in result["failed"]:
        log(f"    {R}{line}{RESET}")
    for k in result["kept"]:
        log(f"    {D}  kept: {k}{RESET}")

    if dry_run:
        return 0

    if result["failed"]:
        # Partial deletion → don't write .cleaned breadcrumb. Re-running will
        # retry the failed ones. Exit non-zero so the caller (upload_lesson.py)
        # knows artifacts are still on disk.
        log(f"  {Y}NOT writing .cleaned breadcrumb — {len(result['failed'])} "
            f"file(s) could not be removed. Re-run to retry.{RESET}", Y)
        return 2

    write_cleaned_marker(lesson_dir, yt_block, remote, result["bytes_freed"])
    log(f"  {G}wrote .cleaned breadcrumb{RESET}")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("lesson_dir", type=Path, help="path to teaching-videos/<slug>/")
    ap.add_argument("--dry-run", action="store_true",
                    help="show what would be deleted; don't actually delete")
    ap.add_argument("--skip-remote", action="store_true",
                    help="skip the YouTube API check (only use if offline). "
                         "WARNING: removes the orphan-prevention safety net.")
    args = ap.parse_args()
    sys.exit(cleanup(args.lesson_dir, dry_run=args.dry_run, skip_remote=args.skip_remote))


if __name__ == "__main__":
    main()
