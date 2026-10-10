#!/usr/bin/env python3
"""Reconcile local lesson state with the GIIS YouTube channel.

The channel is a reconciliation input; the public manifest remains the website
source of truth. This tool:

  1. Queries the channel for every video the authenticated account uploaded.
  2. Parses each title with the pattern `<Course> — Module <N>: <Title>` or
     `<Course> — Module <N> — <Title>`.
  3. For each (course, module-number) group:
       • exactly 1 video  → canonical, no action
       • >1 video         → HOLD by default; replacement lifecycle must resolve it
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
    python3 tools/youtube-upload/sync_channel.py --apply

Broad duplicate resolution/deletion is disabled. Use replacement_lifecycle.py.

Quota: ~1 unit per 50 videos listed, 50 units per delete. A typical
syncing run touches the channel ≤ 5 units when there are no duplicates.
"""
from __future__ import annotations
import argparse, datetime, json, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from upload_video import get_creds  # noqa: E402
from manifest_order import canonical_manifest_rows  # noqa: E402
from lesson_identity import parse_lesson_title, stable_lesson_identity  # noqa: E402

from googleapiclient.discovery import build

REPO          = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "tools"))
from release_lock import (  # noqa: E402
    ReleaseLockBusy,
    acquire_release_lock,
)

LESSONS_DIR   = REPO / "teaching-videos"
MANIFEST_PATH = REPO / "public" / "data" / "lessons-manifest.json"

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
            published_at = (
                it.get("contentDetails", {}).get("videoPublishedAt")
                or it.get("snippet", {}).get("publishedAt")
            )
            yield {
                "video_id":     it["contentDetails"]["videoId"],
                "title":        it["snippet"]["title"],
                "published_at": published_at,
            }
        page = resp.get("nextPageToken")
        if not page: break

def parse_title(t: str):
    """Return (course, module_number, module_title) or None if not a lesson."""
    return parse_lesson_title(t)

def script_module_number(doc: dict) -> int | None:
    for key in ("module_number", "moduleNumber", "module_order", "moduleOrder"):
        value = doc.get(key)
        if value is not None:
            try:
                return int(value)
            except (TypeError, ValueError):
                pass
    module = doc.get("module")
    if isinstance(module, int):
        return module
    m = re.match(r"\s*(?:Module\s+)?(\d+)", str(module or ""), re.IGNORECASE)
    return int(m.group(1)) if m else None

def script_module_title(doc: dict, module_num: int) -> str:
    module = doc.get("module")
    if isinstance(module, str):
        title = re.sub(r"^\s*(?:Module\s+)?\d+\s*(?::|：|[—–]|--)\s*", "", module, flags=re.IGNORECASE).strip()
        if title and title != module:
            return title

    course_slug = doc.get("course_slug")
    if course_slug:
        course_file = next((REPO / "server" / "prisma" / "courses").glob(f"**/{course_slug}.json"), None)
        if course_file:
            try:
                course = json.loads(course_file.read_text())
                for module_row in course.get("modules") or []:
                    if int(module_row.get("order")) == int(module_num):
                        return str(module_row.get("title") or "").strip()
            except Exception:
                pass
    course_name = doc.get("course")
    if course_name:
        for course_file in (REPO / "server" / "prisma" / "courses").glob("**/*.json"):
            try:
                course = json.loads(course_file.read_text())
            except Exception:
                continue
            if course.get("name") != course_name:
                continue
            for module_row in course.get("modules") or []:
                try:
                    if int(module_row.get("order")) == int(module_num):
                        return str(module_row.get("title") or "").strip()
                except (TypeError, ValueError):
                    continue
    return ""

def load_course_visibility() -> dict[str, bool]:
    """Return course visibility keyed by slug and display name."""
    out: dict[str, bool] = {}
    course_dir = REPO / "server" / "prisma" / "courses"
    for file in course_dir.glob("**/*.json"):
        try:
            course = json.loads(file.read_text())
        except Exception:
            continue
        visible = course.get("isPublished") is not False
        if course.get("slug"):
            out[str(course["slug"])] = visible
        if course.get("name"):
            out[str(course["name"])] = visible
    return out

def find_lesson_dir(course: str, module_num: int) -> Path | None:
    """Best-effort match folder by reading every script.json's course+module."""
    target = stable_lesson_identity(course, module_num)
    for f in LESSONS_DIR.glob("*/script.json"):
        try: d = json.loads(f.read_text())
        except Exception: continue
        if lesson_key_from_script(d) == target:
            return f.parent
    return None

def local_lesson_is_public(lesson_dir: Path, visibility: dict[str, bool]) -> bool:
    """Use the local course JSON policy to keep hidden/AP/deferred courses off the public manifest."""
    try:
        doc = json.loads((lesson_dir / "script.json").read_text())
    except Exception:
        return False
    course_slug = doc.get("course_slug")
    course_name = doc.get("course")
    if course_slug in visibility:
        return visibility[course_slug]
    if course_name in visibility:
        return visibility[course_name]
    return True

def local_module_title(lesson_dir: Path, module_num: int, fallback: str) -> str:
    if fallback:
        return fallback
    try:
        doc = json.loads((lesson_dir / "script.json").read_text())
    except Exception:
        return fallback
    return script_module_title(doc, module_num) or fallback


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")

def lesson_key_from_script(doc: dict) -> str | None:
    course = doc.get("course")
    if not course:
        return None
    module_num = script_module_number(doc)
    if module_num is None:
        return None
    return stable_lesson_identity(course, module_num)


def video_exists(yt, video_id: str) -> bool:
    resp = yt.videos().list(id=video_id, part="id").execute()
    return bool(resp.get("items"))


def active_replacement_plans() -> list[Path]:
    active: list[Path] = []
    for path in (LESSONS_DIR / "_audit" / "replacements").glob("*/replacement-plan*.json"):
        try:
            payload = json.loads(path.read_text())
        except Exception:
            active.append(path)
            continue
        if payload.get("state") != "replaced":
            active.append(path)
    return sorted(active)

# ─── main ──────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true",
                    help="write manifest + update script.json files; duplicate groups fail closed")
    ap.add_argument("--resolve-duplicates", action="store_true",
                    help=argparse.SUPPRESS)
    ap.add_argument("--delete-duplicates", action="store_true",
                    help=argparse.SUPPRESS)
    args = ap.parse_args()
    if args.resolve_duplicates or args.delete_duplicates:
        ap.error("broad duplicate resolution is disabled; use replacement_lifecycle.py")
    apply = args.apply

    release_lock = None
    if apply:
        try:
            release_lock = acquire_release_lock(
                REPO,
                owner="youtube-channel-sync",
            )
        except ReleaseLockBusy:
            print("[HOLD] shared release lock is active; no reconciliation performed")
            return 2
        active_plans = active_replacement_plans()
        if active_plans:
            print("[HOLD] active staged replacement plan(s) block full channel reconciliation")
            for path in active_plans:
                print(f"  {path}")
            release_lock.close()
            return 2

    try:
        return _sync_channel(apply)
    finally:
        if release_lock is not None:
            release_lock.close()


def _sync_channel(apply: bool):

    yt = yt_client()
    visibility = load_course_visibility()
    print(f"[sync] querying channel uploads…")
    videos = list(list_my_videos(yt))
    print(f"[sync] {len(videos)} video(s) on channel")

    # Group by normalized course/module identity; non-matching titles are extras.
    groups: dict[str, list[dict]] = {}
    extras: list[dict] = []
    for v in videos:
        parsed = parse_title(v["title"])
        if not parsed:
            extras.append(v); continue
        course, num, mod_title = parsed
        v["_course"] = course; v["_num"] = num; v["_mod_title"] = mod_title
        groups.setdefault(stable_lesson_identity(course, num), []).append(v)

    # ── Deduplicate ────────────────────────────────────────────────────
    canonical: dict[str, dict] = {}
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
    for v in sorted(canonical.values(), key=lambda row: (row["_course"].casefold(), row["_num"])):
        print(f"  {v['_course']:<12} M{v['_num']:>2}  {v['video_id']}  {v['_mod_title']}")
    if deletions:
        print()
        print(f"== Duplicate lesson copies; apply will HOLD ({len(deletions)}) ==")
        for v in deletions:
            print(f"  DUP    {v['video_id']}  {v['title']}  (published {v['published_at']})")
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

    if deletions:
        print()
        print("[HOLD] duplicate lesson videos require the staged replacement lifecycle")
        print("[HOLD] manifest, scripts, and YouTube videos were left unchanged")
        return 2

    # Resolve all stale local-video checks before writing anything. Any API,
    # auth, quota, or transient error propagates and leaves manifest/scripts
    # untouched rather than being mistaken for a deleted video.
    stale_scripts: list[tuple[Path, dict, str, bool]] = []
    for sj in LESSONS_DIR.glob("*/script.json"):
        try:
            doc = json.loads(sj.read_text())
        except Exception:
            continue
        youtube = doc.get("youtube") or {}
        key = lesson_key_from_script(doc)
        if not youtube or not key or key in canonical:
            continue
        old = youtube.get("video_id")
        exists = bool(old) and video_exists(yt, old)
        stale_scripts.append((sj, doc, old, exists))

    # ── Apply: delete dups ─────────────────────────────────────────────
    # Duplicate deletion is intentionally not implemented here. The staged
    # replacement lifecycle performs exact-ID retirement after website readback.

    # ── Apply: rewrite manifest from canonical ────────────────────────
    manifest_entries: list[dict] = []
    skipped_without_local_folder: list[dict] = []
    skipped_unpublished_local_course: list[dict] = []
    for v in sorted(canonical.values(), key=lambda row: (row["_course"].casefold(), row["_num"])):
        course, num = v["_course"], v["_num"]
        lesson_dir = find_lesson_dir(course, num)
        if not lesson_dir:
            skipped_without_local_folder.append(v)
            continue
        if not local_lesson_is_public(lesson_dir, visibility):
            skipped_unpublished_local_course.append(v)
            continue
        module_title = local_module_title(lesson_dir, num, v["_mod_title"])
        entry = {
            "course":         course,
            "course_slug":    slugify(course),
            "module_number":  num,
            "module_title":   module_title,
            "youtube_id":     v["video_id"],
            "url":            f"https://youtu.be/{v['video_id']}",
            "embed_url":      f"https://www.youtube.com/embed/{v['video_id']}",
            "published_at":   v["published_at"],
            "lesson_dir":     lesson_dir.name if lesson_dir else None,
        }
        manifest_entries.append(entry)

    by_course, lessons = canonical_manifest_rows(manifest_entries)

    manifest = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "source":       "youtube-channel",
        "by_course":    by_course,
        "lessons":      lessons,
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"[manifest] wrote  {MANIFEST_PATH.relative_to(REPO)}  ({len(manifest['lessons'])} lessons)")
    if skipped_without_local_folder:
        print(f"[manifest] skipped {len(skipped_without_local_folder)} channel lesson(s) without a local lesson folder")
        for v in skipped_without_local_folder:
            print(f"  SKIP   {v['video_id']}  {v['title']}")
    if skipped_unpublished_local_course:
        print(f"[manifest] skipped {len(skipped_unpublished_local_course)} unpublished/hidden local course lesson(s)")
        for v in skipped_unpublished_local_course:
            print(f"  SKIP   {v['video_id']}  {v['title']}")

    # ── Apply: reconcile script.json youtube blocks ───────────────────
    for v in canonical.values():
        course, num = v["_course"], v["_num"]
        ld = find_lesson_dir(course, num)
        if not ld: continue
        sj = ld / "script.json"
        try: doc = json.loads(sj.read_text())
        except Exception: continue
        current_youtube = doc.get("youtube") or {}
        old = current_youtube.get("video_id")
        next_youtube = {
            "video_id":    v["video_id"],
            "url":         f"https://youtu.be/{v['video_id']}",
            "embed_url":   f"https://www.youtube.com/embed/{v['video_id']}",
            "studio_url":  f"https://studio.youtube.com/video/{v['video_id']}/edit",
            "privacy":     current_youtube.get("privacy") or "unlisted",
            "playlist":    current_youtube.get("playlist") or course,
            "published_at": v["published_at"],
            "uploaded_at": current_youtube.get("uploaded_at") or v["published_at"],
            "synced_at":   current_youtube.get("synced_at") or manifest["generated_at"],
        }
        if current_youtube.get("playlist_id"):
            next_youtube["playlist_id"] = current_youtube["playlist_id"]
        if current_youtube == next_youtube:
            continue   # already in sync
        doc["youtube"] = next_youtube
        sj.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
        print(f"[script.json] {ld.name}  {old} → {v['video_id']}")

    # If a local lesson has a youtube block but the channel no longer has a
    # canonical lesson video for its (course, module), remove the stale local
    # claim so dashboards do not show failed/deleted uploads as live.
    for sj, doc, old, exists in stale_scripts:
        if exists:
            print(
                f"[script.json] {sj.parent.name}  kept local youtube video_id={old} "
                "(video exists; uploads playlist may be lagging)"
            )
            continue
        old = doc.pop("youtube", {}).get("video_id")
        sj.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
        print(f"[script.json] {sj.parent.name}  removed stale youtube video_id={old}")

if __name__ == "__main__":
    raise SystemExit(main() or 0)
