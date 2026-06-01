#!/usr/bin/env python3
"""Reconcile local lesson state with the GIIS YouTube channel.

The YouTube channel is the source of truth. This tool:

  1. Queries the channel for every video the authenticated account uploaded.
  2. Parses each title with the pattern `<Course> — Module <N>: <Title>`.
  3. For each (course, module-number) group:
       • exactly 1 video  → canonical, no action
       • >1 video         → DUPLICATE: keep the newest publishedAt, delete the rest
       • 0 video          → not on channel; ensure local script.json reflects that
  4. Writes the canonical set to `public/data/lessons-manifest.json`
     (replaces what `build_manifest.py` used to do — but driven by the channel,
     not by `script.json` files).
  5. Updates each lesson's `script.json` `youtube` block if it disagrees with
     what's actually on the channel — so the local `youtube.video_id` always
     points at the live one.

Videos whose titles don't match the lesson pattern (e.g. the school intro
"Welcome to Genesis of Ideas International — …") are left alone: they're
listed under `extras` in the report but never deduped or written into the
lesson manifest.

Usage:
    python3 tools/youtube-upload/sync_channel.py            # dry-run by default
    python3 tools/youtube-upload/sync_channel.py --apply    # actually delete dups + write files

Quota: ~1 unit per 50 videos listed, 50 units per delete. A typical
syncing run touches the channel ≤ 5 units when there are no duplicates.
"""
from __future__ import annotations
import argparse, datetime, json, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from upload_video import get_creds  # noqa: E402

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

REPO          = Path(__file__).resolve().parents[2]
LESSONS_DIR   = REPO / "teaching-videos"
MANIFEST_PATH = REPO / "public" / "data" / "lessons-manifest.json"

# Title pattern — matches:  "Algebra I — Module 4: Solving One-Step…"
# Accepts —, –, or -- as the dash; flexible whitespace.
TITLE_RE = re.compile(
    r"^\s*(?P<course>[^—–\-]+?)\s*[—–]+\s*Module\s+(?P<num>\d+)\s*[:：]\s*(?P<title>.+?)\s*$",
    re.UNICODE,
)

# ─── helpers ───────────────────────────────────────────────────────────

def yt_client():
    return build("youtube", "v3", credentials=get_creds())

def list_my_videos(yt):
    """Yield {video_id, title, published_at} for every video this account uploaded.
    Cheap: 1 quota unit per page of 50."""
    chan = yt.channels().list(part="contentDetails", mine=True).execute()
    uploads_pl = chan["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
    page = None
    while True:
        resp = yt.playlistItems().list(
            part="snippet,contentDetails",
            playlistId=uploads_pl, maxResults=50, pageToken=page,
        ).execute()
        for it in resp.get("items", []):
            yield {
                "video_id":     it["contentDetails"]["videoId"],
                "title":        it["snippet"]["title"],
                "published_at": it["contentDetails"]["videoPublishedAt"],
            }
        page = resp.get("nextPageToken")
        if not page: break

def parse_title(t: str):
    """Return (course, module_number, module_title) or None if not a lesson."""
    m = TITLE_RE.match(t)
    if not m: return None
    return (m.group("course").strip(),
            int(m.group("num")),
            m.group("title").strip())

def find_lesson_dir(course: str, module_num: int) -> Path | None:
    """Best-effort match folder by reading every script.json's course+module."""
    for f in LESSONS_DIR.glob("*/script.json"):
        try: d = json.loads(f.read_text())
        except Exception: continue
        if d.get("course") != course: continue
        m = re.match(r"\s*Module\s+(\d+)", d.get("module", ""), re.IGNORECASE)
        if not m: continue
        if int(m.group(1)) == module_num:
            return f.parent
    return None

# ─── main ──────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true",
                    help="actually delete duplicates + write manifest + update script.json files")
    args = ap.parse_args()
    apply = args.apply

    yt = yt_client()
    print(f"[sync] querying channel uploads…")
    videos = list(list_my_videos(yt))
    print(f"[sync] {len(videos)} video(s) on channel")

    # Group by (course, module_number) — non-matching titles go to extras.
    groups: dict[tuple[str, int], list[dict]] = {}
    extras: list[dict] = []
    for v in videos:
        parsed = parse_title(v["title"])
        if not parsed:
            extras.append(v); continue
        course, num, mod_title = parsed
        v["_course"] = course; v["_num"] = num; v["_mod_title"] = mod_title
        groups.setdefault((course, num), []).append(v)

    # ── Deduplicate ────────────────────────────────────────────────────
    canonical: dict[tuple[str, int], dict] = {}
    deletions: list[dict] = []
    for key, vids in groups.items():
        if len(vids) == 1:
            canonical[key] = vids[0]; continue
        # Sort by publishedAt descending; keep first.
        vids.sort(key=lambda v: v["published_at"], reverse=True)
        canonical[key] = vids[0]
        for stale in vids[1:]:
            deletions.append(stale)

    # ── Report ─────────────────────────────────────────────────────────
    print()
    print(f"== Canonical lessons ({len(canonical)}) ==")
    for (course, num), v in sorted(canonical.items()):
        print(f"  {course:<12} M{num:>2}  {v['video_id']}  {v['_mod_title']}")
    if deletions:
        print()
        print(f"== Duplicates to delete ({len(deletions)}) ==")
        for v in deletions:
            print(f"  STALE  {v['video_id']}  {v['title']}  (published {v['published_at']})")
    else:
        print()
        print("== No duplicates ==")
    if extras:
        print()
        print(f"== Non-lesson videos (left untouched, {len(extras)}) ==")
        for v in extras:
            print(f"  KEEP   {v['video_id']}  {v['title']}")

    if not apply:
        print()
        print("[dry-run] no changes made.  Re-run with --apply to act.")
        return

    # ── Apply: delete dups ─────────────────────────────────────────────
    for v in deletions:
        try:
            yt.videos().delete(id=v["video_id"]).execute()
            print(f"[delete] {v['video_id']}  {v['title']}")
        except HttpError as e:
            print(f"[delete-FAIL] {v['video_id']}  {e._get_reason()}")

    # ── Apply: rewrite manifest from canonical ────────────────────────
    by_course: dict[str, list] = {}
    skipped_without_local_folder: list[dict] = []
    for (course, num), v in canonical.items():
        lesson_dir = find_lesson_dir(course, num)
        if not lesson_dir:
            skipped_without_local_folder.append(v)
            continue
        entry = {
            "course":         course,
            "course_slug":    re.sub(r"\s+", "-", course.lower()),
            "module_number":  num,
            "module_title":   v["_mod_title"],
            "youtube_id":     v["video_id"],
            "url":            f"https://youtu.be/{v['video_id']}",
            "embed_url":      f"https://www.youtube.com/embed/{v['video_id']}",
            "published_at":   v["published_at"],
            "lesson_dir":     lesson_dir.name if lesson_dir else None,
        }
        by_course.setdefault(course, []).append(entry)
    for course in by_course:
        by_course[course].sort(key=lambda x: x["module_number"])

    manifest = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "source":       "youtube-channel",
        "by_course":    by_course,
        "lessons":      [v for items in by_course.values() for v in items],
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"[manifest] wrote  {MANIFEST_PATH.relative_to(REPO)}  ({len(manifest['lessons'])} lessons)")
    if skipped_without_local_folder:
        print(f"[manifest] skipped {len(skipped_without_local_folder)} channel lesson(s) without a local lesson folder")
        for v in skipped_without_local_folder:
            print(f"  SKIP   {v['video_id']}  {v['title']}")

    # ── Apply: reconcile script.json youtube blocks ───────────────────
    for (course, num), v in canonical.items():
        ld = find_lesson_dir(course, num)
        if not ld: continue
        sj = ld / "script.json"
        try: doc = json.loads(sj.read_text())
        except Exception: continue
        old = doc.get("youtube", {}).get("video_id")
        if old == v["video_id"]:
            continue   # already in sync
        doc["youtube"] = {
            "video_id":    v["video_id"],
            "url":         f"https://youtu.be/{v['video_id']}",
            "embed_url":   f"https://www.youtube.com/embed/{v['video_id']}",
            "studio_url":  f"https://studio.youtube.com/video/{v['video_id']}/edit",
            "published_at": v["published_at"],
            "synced_at":   manifest["generated_at"],
            "playlist":    course,
        }
        sj.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
        print(f"[script.json] {ld.name}  {old} → {v['video_id']}")

if __name__ == "__main__":
    main()
