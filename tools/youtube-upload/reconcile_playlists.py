#!/usr/bin/env python3
"""Reconcile uploaded GIIS lesson videos into course playlists.

This is intentionally separate from `sync_channel.py`: it only creates missing
course playlists, adds missing playlistItems, and writes local `playlist_id`
metadata. It does not delete videos, remove playlist items, upload captions,
touch thumbnails, or rebuild the public lessons manifest.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from upload_video import get_creds  # noqa: E402

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

ROOT = Path(__file__).resolve().parents[2]
LESSONS_DIR = ROOT / "teaching-videos"


def yt_client():
    return build("youtube", "v3", credentials=get_creds())


def module_num(raw: str) -> int:
    match = re.search(r"\bModule\s+(\d+)\b", raw or "", re.IGNORECASE)
    return int(match.group(1)) if match else 9999


def uploaded_lessons(include_ap: bool) -> list[dict]:
    lessons: list[dict] = []
    for script_path in LESSONS_DIR.glob("*/script.json"):
        try:
            doc = json.loads(script_path.read_text())
        except Exception:
            continue
        course = doc.get("course")
        youtube = doc.get("youtube") or {}
        video_id = youtube.get("video_id")
        if not course or not video_id:
            continue
        if not include_ap and course.lower().startswith("ap "):
            continue
        lessons.append(
            {
                "course": course,
                "module": doc.get("module") or "",
                "slug": script_path.parent.name,
                "script_path": script_path,
                "video_id": video_id,
                "playlist": youtube.get("playlist") or course,
                "playlist_id": youtube.get("playlist_id"),
                "doc": doc,
            }
        )
    lessons.sort(key=lambda row: (row["course"].lower(), module_num(row["module"]), row["slug"]))
    return lessons


def all_playlists(yt) -> dict[str, dict]:
    out: dict[str, dict] = {}
    page = None
    while True:
        resp = yt.playlists().list(
            part="snippet,status,contentDetails",
            mine=True,
            maxResults=50,
            pageToken=page,
        ).execute()
        for item in resp.get("items", []):
            title = item["snippet"]["title"]
            out[title.lower()] = {
                "id": item["id"],
                "title": title,
                "privacy": item.get("status", {}).get("privacyStatus"),
                "item_count": item.get("contentDetails", {}).get("itemCount"),
            }
        page = resp.get("nextPageToken")
        if not page:
            return out


def playlist_video_ids(yt, playlist_id: str) -> set[str]:
    ids: set[str] = set()
    page = None
    while True:
        resp = yt.playlistItems().list(
            part="snippet,contentDetails",
            playlistId=playlist_id,
            maxResults=50,
            pageToken=page,
        ).execute()
        for item in resp.get("items", []):
            video_id = (
                item.get("contentDetails", {}).get("videoId")
                or item.get("snippet", {}).get("resourceId", {}).get("videoId")
            )
            if video_id:
                ids.add(video_id)
        page = resp.get("nextPageToken")
        if not page:
            return ids


def ensure_playlist(yt, title: str, privacy: str) -> str:
    body = {
        "snippet": {"title": title, "defaultLanguage": "en"},
        "status": {"privacyStatus": privacy},
    }
    resp = yt.playlists().insert(part="snippet,status", body=body).execute()
    return resp["id"]


def add_video(yt, playlist_id: str, video_id: str) -> str:
    body = {
        "snippet": {
            "playlistId": playlist_id,
            "resourceId": {"kind": "youtube#video", "videoId": video_id},
        }
    }
    resp = yt.playlistItems().insert(part="snippet", body=body).execute()
    return resp["id"]


def write_playlist_metadata(rows: list[dict], playlist_id: str) -> int:
    changed = 0
    for row in rows:
        doc = row["doc"]
        youtube = dict(doc.get("youtube") or {})
        before = dict(youtube)
        youtube["playlist"] = row["playlist"]
        youtube["playlist_id"] = playlist_id
        youtube["playlist_synced_at"] = dt.datetime.now(dt.UTC).isoformat(timespec="seconds")
        if youtube == before:
            continue
        doc["youtube"] = youtube
        row["script_path"].write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
        changed += 1
    return changed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="mutate YouTube playlists and local script.json metadata")
    parser.add_argument("--privacy", default="unlisted", choices=["public", "unlisted", "private"])
    parser.add_argument("--include-ap", action="store_true", help="include AP courses; default is foundation/non-AP only")
    parser.add_argument("--course", action="append", default=[], help="limit to one or more exact course names")
    args = parser.parse_args()

    lessons = uploaded_lessons(include_ap=args.include_ap)
    if args.course:
        wanted = {course.lower() for course in args.course}
        lessons = [row for row in lessons if row["course"].lower() in wanted]

    by_playlist: dict[str, list[dict]] = defaultdict(list)
    for row in lessons:
        by_playlist[row["playlist"]].append(row)

    yt = yt_client()
    playlists = all_playlists(yt)
    report = {
        "courses": len(by_playlist),
        "uploaded_lessons": len(lessons),
        "playlists_to_create": [],
        "items_to_add": [],
        "metadata_to_update": 0,
        "quota_estimate_units": 0,
    }

    for playlist_name in sorted(by_playlist):
        rows = by_playlist[playlist_name]
        existing = playlists.get(playlist_name.lower())
        playlist_id = existing["id"] if existing else None
        current_ids: set[str] = set()
        if playlist_id:
            current_ids = playlist_video_ids(yt, playlist_id)
        else:
            report["playlists_to_create"].append(playlist_name)

        missing = [row for row in rows if row["video_id"] not in current_ids]
        report["items_to_add"].extend({"playlist": playlist_name, "video_id": row["video_id"], "slug": row["slug"]} for row in missing)
        report["metadata_to_update"] += sum(1 for row in rows if row.get("playlist_id") != playlist_id)

        print(f"{playlist_name}: local={len(rows)} playlist_items={len(current_ids)} missing={len(missing)}")
        for row in missing:
            print(f"  ADD {row['video_id']}  {row['module']}  ({row['slug']})")

        if not args.apply:
            continue

        if not playlist_id:
            playlist_id = ensure_playlist(yt, playlist_name, args.privacy)
            playlists[playlist_name.lower()] = {
                "id": playlist_id,
                "title": playlist_name,
                "privacy": args.privacy,
                "item_count": 0,
            }
            print(f"[playlist] created {playlist_name} {playlist_id}")

        for row in missing:
            try:
                item_id = add_video(yt, playlist_id, row["video_id"])
                print(f"[playlist] added {row['video_id']} -> {playlist_name} ({item_id})")
            except HttpError as exc:
                print(f"[playlist] failed {row['video_id']} -> {playlist_name}: {exc._get_reason()}")
                if "quotaExceeded" in str(exc) or "quota" in exc._get_reason().lower():
                    print("[playlist] quota exhausted; stopping immediately")
                    return 2

        changed = write_playlist_metadata(rows, playlist_id)
        if changed:
            print(f"[metadata] wrote playlist_id for {changed} {playlist_name} lesson(s)")

    report["quota_estimate_units"] = len(report["playlists_to_create"]) * 50 + len(report["items_to_add"]) * 50
    print()
    print(json.dumps(report, indent=2, ensure_ascii=False))
    if not args.apply:
        print("[dry-run] no changes made. Re-run with --apply to reconcile playlists.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
