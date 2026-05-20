#!/usr/bin/env python3
"""
Daily YouTube upload queue manager.

Two jobs:

  • `status`  — scans teaching-videos/ and prints what's been uploaded,
                what's ready to upload, and what's still missing a rendered MP4.
                Read-only — call any time of day.

  • `upload`  — picks up to N pending lessons (oldest folder first) and
                runs upload_lesson.py on each. Designed to be called once
                per day after the YouTube Data API quota resets at midnight
                Pacific. Each lesson burns ~2,100 quota units, default
                --max=4 stays comfortably under the 10,000/day cap with
                headroom for `sync_channel.py` reconciliation.

How a lesson is classified:

  pending     script.json present  AND  <folder>/<folder>.mp4 exists
              AND  script.json["youtube"] is missing or has no video_id
  uploaded    script.json["youtube"]["video_id"] exists (we trust local truth;
              sync_channel.py is responsible for reconciling drift)
  not-ready   script.json present  AND  no .mp4 in the folder yet

Usage:
  python3 tools/youtube-upload/yt_queue.py status
  python3 tools/youtube-upload/yt_queue.py upload --max 4
  python3 tools/youtube-upload/yt_queue.py upload --max 4 --privacy unlisted
  python3 tools/youtube-upload/yt_queue.py upload --dry-run

NOTE: this file is intentionally NOT named `queue.py` — that would shadow
Python's stdlib `queue` module when `tools/youtube-upload/` ends up on
sys.path[0] (as it does when subprocess-launched scripts like
upload_video.py run from this folder), breaking urllib3 /
google-auth-oauthlib imports with `AttributeError: module 'queue' has
no attribute 'Queue'`.

To schedule daily at 9:00 AM Pacific (after quota resets), see:
  tools/youtube-upload/com.giis.youtube-daily.plist  (launchd, recommended)
  tools/youtube-upload/daily.sh                       (cron-friendly wrapper)
"""
from __future__ import annotations
import argparse, json, sys, subprocess, datetime, os
from pathlib import Path

# ─── paths ─────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]   # giis-website/
LESSONS_DIR = ROOT / "teaching-videos"
UPLOAD_LESSON = Path(__file__).resolve().parent / "upload_lesson.py"

# YouTube Data API v3 quota: 10,000 units/day. Each upload + thumbnail +
# captions + playlist add ≈ 2,100 units. 4 uploads = 8,400 units, leaves
# 1,600 for sync_channel.py reconciliation. Override with --max.
DEFAULT_MAX_PER_DAY = 4

# Quota resets at midnight Pacific Time. If you run after PT midnight
# (e.g. 09:00 PT in the plist), the day's quota is fresh.
QUOTA_NOTE = "10,000 units/day (resets at midnight Pacific). ~2,100 units per lesson upload."


# ─── lesson scanning ───────────────────────────────────────────────────
def find_mp4(lesson_dir: Path) -> Path | None:
    """Convention: <folder-name-with-dashes-as-underscores>.mp4. Fallback: any *.mp4."""
    canonical = lesson_dir / f"{lesson_dir.name.replace('-', '_')}.mp4"
    if canonical.exists():
        return canonical
    candidates = list(lesson_dir.glob("*.mp4"))
    return candidates[0] if len(candidates) == 1 else None


def classify_lesson(lesson_dir: Path) -> dict:
    """Return {dir, script, status, mp4, video_id, course, module}."""
    script_path = lesson_dir / "script.json"
    if not script_path.exists():
        return None  # not a lesson folder

    try:
        script = json.loads(script_path.read_text())
    except json.JSONDecodeError:
        return {"dir": lesson_dir, "status": "broken-json"}

    mp4 = find_mp4(lesson_dir)
    yt = script.get("youtube") or {}
    video_id = yt.get("video_id")

    if video_id:
        status = "uploaded"
    elif mp4:
        status = "pending"
    else:
        status = "not-ready"

    return {
        "dir": lesson_dir,
        "script": script_path,
        "status": status,
        "mp4": mp4,
        "video_id": video_id,
        "course": script.get("course", "?"),
        "module": script.get("module", "?"),
        "uploaded_at": yt.get("uploaded_at"),
        "url": yt.get("url"),
    }


def scan() -> list[dict]:
    """All lesson folders in teaching-videos/, classified, sorted by folder name."""
    if not LESSONS_DIR.exists():
        return []
    out = []
    for d in sorted(LESSONS_DIR.iterdir()):
        if not d.is_dir() or d.name.startswith("."):
            continue
        info = classify_lesson(d)
        if info:
            out.append(info)
    return out


# ─── output formatters ─────────────────────────────────────────────────
RESET, BOLD, DIM = "\033[0m", "\033[1m", "\033[2m"
GREEN, YELLOW, GREY, RED, CYAN = "\033[32m", "\033[33m", "\033[90m", "\033[31m", "\033[36m"


def fmt_status(s: str) -> str:
    return {
        "uploaded":   f"{GREEN}✓ uploaded{RESET}",
        "pending":    f"{YELLOW}● pending {RESET}",
        "not-ready":  f"{GREY}○ no MP4  {RESET}",
        "broken-json": f"{RED}✗ broken  {RESET}",
    }.get(s, s)


def print_status_report(lessons: list[dict]):
    by_status = {"uploaded": [], "pending": [], "not-ready": [], "broken-json": []}
    for L in lessons:
        by_status.setdefault(L["status"], []).append(L)

    # Header
    total = len(lessons)
    print(f"\n{BOLD}GIIS YouTube upload queue{RESET}  ·  {LESSONS_DIR.relative_to(ROOT)}/")
    print(f"{DIM}Quota: {QUOTA_NOTE}{RESET}\n")
    print(f"  {GREEN}✓ uploaded{RESET}   {len(by_status['uploaded']):3d}")
    print(f"  {YELLOW}● pending {RESET}   {len(by_status['pending']):3d}   ← ready for next upload run")
    print(f"  {GREY}○ no MP4  {RESET}   {len(by_status['not-ready']):3d}   ← rebuild with make_lesson.py")
    if by_status["broken-json"]:
        print(f"  {RED}✗ broken  {RESET}   {len(by_status['broken-json']):3d}   ← script.json won't parse")
    print(f"  total       {total:3d}\n")

    # By course summary
    courses: dict[str, dict[str, int]] = {}
    for L in lessons:
        c = L.get("course", "?")
        courses.setdefault(c, {"uploaded": 0, "pending": 0, "not-ready": 0})
        courses[c][L["status"]] = courses[c].get(L["status"], 0) + 1
    if courses:
        print(f"{BOLD}By course:{RESET}")
        for c, counts in sorted(courses.items()):
            up = counts.get("uploaded", 0); pe = counts.get("pending", 0); nr = counts.get("not-ready", 0)
            total_c = up + pe + nr
            bar_up = "█" * up; bar_pe = "▒" * pe; bar_nr = "░" * nr
            print(f"  {c:34s}  {GREEN}{bar_up}{YELLOW}{bar_pe}{GREY}{bar_nr}{RESET}  {up}/{total_c} uploaded · {pe} pending · {nr} no-mp4")
        print()

    # Pending list (the action queue)
    if by_status["pending"]:
        print(f"{BOLD}{YELLOW}Pending — these would be the next to upload (oldest folder first):{RESET}")
        for i, L in enumerate(by_status["pending"], 1):
            print(f"  {i:2d}.  {L['module']:60s}  {DIM}({L['dir'].name}){RESET}")
        print()

    # Recent uploads (last 5)
    uploaded = [L for L in by_status["uploaded"] if L.get("uploaded_at")]
    uploaded.sort(key=lambda L: L["uploaded_at"] or "", reverse=True)
    if uploaded:
        print(f"{BOLD}Recently uploaded:{RESET}")
        for L in uploaded[:5]:
            ts = (L["uploaded_at"] or "")[:10]
            print(f"  {ts}  {L['module']:50s}  {CYAN}{L['url']}{RESET}")
        print()


# ─── upload runner ─────────────────────────────────────────────────────
def _course_match(lesson_course: str, filter_str: str) -> bool:
    """Case-insensitive substring match — `--course psych` matches both
    `AP Psychology` (substring 'psych') and folder slugs like `ap-psych-*`."""
    needle = filter_str.lower().strip()
    return needle in (lesson_course or "").lower()


def run_upload(args):
    lessons = scan()
    pending = [L for L in lessons if L["status"] == "pending"]

    # Optional course filter — useful when you have mixed pending across
    # subjects and want to batch by course (e.g. `--course psych` to upload
    # only AP Psychology this run).
    if args.course:
        before = len(pending)
        pending = [L for L in pending if _course_match(L["course"], args.course)]
        print(f"{DIM}filter `--course {args.course}`: {before} → {len(pending)} pending{RESET}")

    if not pending:
        if args.course:
            print(f"{GREEN}Nothing pending matching `--course {args.course}`.{RESET}")
        else:
            print(f"{GREEN}Nothing pending. All rendered videos already uploaded.{RESET}")
        return 0

    queue = pending[: args.max]
    print(f"\n{BOLD}YouTube upload run — {datetime.datetime.now().isoformat(timespec='seconds')}{RESET}")
    print(f"  picking {len(queue)} of {len(pending)} pending lessons (max={args.max}, privacy={args.privacy})\n")
    for i, L in enumerate(queue, 1):
        print(f"  {i}. {L['module']}  ({L['dir'].name})")
    print()

    if args.dry_run:
        print(f"{DIM}--dry-run set: not actually uploading.{RESET}")
        return 0

    succeeded = 0
    failures: list[dict] = []
    aborted = False
    for L in queue:
        print(f"\n{BOLD}─── uploading: {L['module']} ───{RESET}")
        cmd = [sys.executable, str(UPLOAD_LESSON), str(L["dir"]),
               "--privacy", args.privacy]
        # stdin=DEVNULL — same reasoning as merge_lesson/make_lesson:
        # upload_lesson eventually invokes ffmpeg/youtube libs that may
        # try to read stdin. Don't let them touch ours.
        r = subprocess.run(cmd, stdin=subprocess.DEVNULL)
        if r.returncode != 0:
            print(f"{RED}  ↑ failed (exit {r.returncode}){RESET}")
            failures.append(L)
            # If we hit quota / OAuth issues mid-run, abort the rest rather
            # than burning more quota on the same error.
            if r.returncode in (1, 2):
                print(f"{YELLOW}  aborting rest of queue (likely quota/auth issue){RESET}")
                aborted = True
                break
        else:
            succeeded += 1

    print()
    # `succeeded` is incremented only on actual returncode==0 from
    # upload_lesson.py. Anything not attempted (because we aborted early)
    # stays in the pending pool — neither uploaded nor failed.
    still_pending = len(pending) - succeeded
    print(f"{BOLD}Run summary{RESET}: {GREEN}{succeeded} uploaded{RESET}, "
          f"{RED}{len(failures)} failed{RESET}, "
          f"{still_pending} still pending"
          + (f" {DIM}(aborted early){RESET}" if aborted else ""))
    return 0 if not failures else 1


# ─── CLI ───────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(
        description="YouTube upload queue for GIIS lessons. Run `status` any time; "
                    "run `upload` once per day after midnight Pacific (quota reset).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__.split("Usage:")[1] if "Usage:" in __doc__ else "",
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("status", help="Show the upload queue (read-only).")

    up = sub.add_parser("upload", help="Upload up to --max pending lessons.")
    up.add_argument("--max", type=int, default=DEFAULT_MAX_PER_DAY,
                    help=f"max lessons to upload this run (default {DEFAULT_MAX_PER_DAY})")
    up.add_argument("--privacy", default="unlisted",
                    choices=["public", "unlisted", "private"])
    up.add_argument("--dry-run", action="store_true",
                    help="show what would be uploaded, don't call YouTube")
    up.add_argument("--course", default=None,
                    help="filter pending lessons by course (case-insensitive "
                         "substring match against script.json `course`). "
                         "Examples: `--course psych` / `--course algebra` / "
                         "`--course \"AP Calculus\"`")

    args = ap.parse_args()

    if args.cmd == "status":
        print_status_report(scan())
        return 0
    if args.cmd == "upload":
        return run_upload(args)


if __name__ == "__main__":
    sys.exit(main() or 0)
