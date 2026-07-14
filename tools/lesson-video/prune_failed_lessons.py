#!/usr/bin/env python3
"""Prune lesson videos that do not meet the current release gate.

This is intentionally destructive only with --apply. It removes failed lessons
from the Learn Portal manifest, optionally deletes their YouTube videos, and
removes local lesson folders that are not clean score-100 passes.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import shutil
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
TEACHING_ROOT = ROOT / "teaching-videos"
MANIFEST_PATH = ROOT / "public" / "data" / "lessons-manifest.json"
APPROVAL_PATH = TEACHING_ROOT / "_audit" / "release-gate" / "approved_ready_to_upload.json"
REPORT_DIR = TEACHING_ROOT / "_audit" / "prune-failed-lessons"

sys.path.insert(0, str(ROOT / "tools" / "lesson-video"))
from audit_lessons import audit_lesson  # noqa: E402

sys.path.insert(0, str(ROOT / "tools" / "youtube-upload"))
from manifest_order import canonical_manifest_rows  # noqa: E402


def read_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text())
    except Exception:
        return default


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def now_utc() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def lesson_is_ready(folder: Path) -> tuple[bool, dict[str, Any]]:
    audit = audit_lesson(folder)
    ready = audit.get("verdict") == "pass" and int(audit.get("quality_score") or 0) >= 100
    return ready, audit


def collect_local_lessons() -> dict[str, dict[str, Any]]:
    rows = {}
    for folder in sorted(TEACHING_ROOT.iterdir()):
        if not folder.is_dir() or folder.name.startswith("_"):
            continue
        if not (folder / "script.json").exists():
            continue
        ready, audit = lesson_is_ready(folder)
        rows[folder.name] = {
            "folder": folder,
            "ready": ready,
            "audit": audit,
            "score": audit.get("quality_score"),
            "verdict": audit.get("verdict"),
        }
    return rows


def manifest_lessons(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    lessons = manifest.get("lessons")
    if isinstance(lessons, list):
        return lessons
    return [row for rows in (manifest.get("by_course") or {}).values() for row in rows]


def rebuild_manifest(kept: list[dict[str, Any]], generated_at: str) -> dict[str, Any]:
    normalized = [
        {**row, "course": str(row.get("course") or "Unknown")}
        for row in kept
    ]
    by_course, lessons = canonical_manifest_rows(normalized)
    return {
        "generated_at": generated_at,
        "source": "prune_failed_lessons",
        "lessons": lessons,
        "by_course": by_course,
    }


def delete_youtube_videos(video_ids: list[str], *, apply: bool) -> list[dict[str, Any]]:
    if not video_ids:
        return []
    if not apply:
        return [{"video_id": video_id, "status": "dry_run"} for video_id in video_ids]
    sys.path.insert(0, str(ROOT / "tools" / "youtube-upload"))
    from upload_video import get_creds  # noqa: E402
    from googleapiclient.discovery import build  # noqa: E402
    from googleapiclient.errors import HttpError  # noqa: E402

    yt = build("youtube", "v3", credentials=get_creds())
    results = []
    for video_id in video_ids:
        try:
            yt.videos().delete(id=video_id).execute()
            print(f"[youtube:deleted] {video_id}")
            results.append({"video_id": video_id, "status": "deleted"})
        except HttpError as exc:
            reason = exc._get_reason()
            print(f"[youtube:failed] {video_id}: {reason}")
            results.append({"video_id": video_id, "status": "failed", "reason": reason})
    return results


def prune(args: argparse.Namespace) -> int:
    generated_at = now_utc()
    local = collect_local_lessons()
    ready_slugs = {slug for slug, row in local.items() if row["ready"]}
    manifest = read_json(MANIFEST_PATH, {})
    lessons = manifest_lessons(manifest)

    kept_manifest = []
    removed_manifest = []
    delete_video_ids = []
    seen_video_ids = set()
    for row in lessons:
        slug = row.get("lesson_dir") or row.get("slug") or row.get("local_slug")
        if slug in ready_slugs:
            kept_manifest.append(row)
            continue
        removed_manifest.append(row)
        video_id = row.get("youtube_id")
        if video_id and video_id not in seen_video_ids:
            seen_video_ids.add(video_id)
            delete_video_ids.append(video_id)

    local_delete = []
    for slug, row in sorted(local.items()):
        if slug not in ready_slugs:
            local_delete.append({
                "slug": slug,
                "path": str(row["folder"].relative_to(ROOT)),
                "score": row["score"],
                "verdict": row["verdict"],
                "course": (row["audit"].get("script") or {}).get("course"),
                "module": (row["audit"].get("script") or {}).get("module"),
            })

    youtube_results = delete_youtube_videos(delete_video_ids, apply=args.apply and args.delete_youtube)

    report = {
        "generated_at": generated_at,
        "apply": args.apply,
        "delete_youtube": args.delete_youtube,
        "policy": "keep only clean pass score >= 100",
        "summary": {
            "ready_local_kept": len(ready_slugs),
            "manifest_removed": len(removed_manifest),
            "manifest_kept": len(kept_manifest),
            "youtube_delete_candidates": len(delete_video_ids),
            "local_folders_delete_candidates": len(local_delete),
        },
        "ready_slugs": sorted(ready_slugs),
        "manifest_removed": removed_manifest,
        "youtube_results": youtube_results,
        "local_delete": local_delete,
    }

    if args.apply:
        write_json(MANIFEST_PATH, rebuild_manifest(kept_manifest, generated_at))
        approved = read_json(APPROVAL_PATH, {})
        rows = approved.get("approved_ready_to_upload", approved.get("ready_to_upload", [])) if isinstance(approved, dict) else approved
        filtered = []
        for row in rows or []:
            slug = row if isinstance(row, str) else row.get("slug")
            if slug in ready_slugs:
                filtered.append(row)
        write_json(APPROVAL_PATH, {
            "generated_at": generated_at,
            "policy": "prune_failed_lessons_keep_ready_only",
            "approved_ready_to_upload": filtered,
        })
        for row in local_delete:
            path = ROOT / row["path"]
            if path.exists():
                shutil.rmtree(path)
                print(f"[local:deleted] {row['path']}")
    else:
        print(json.dumps(report["summary"], indent=2, ensure_ascii=False))

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")
    report_path = REPORT_DIR / f"{stamp}-prune-failed-lessons.json"
    write_json(report_path, report)
    write_json(REPORT_DIR / "latest-prune-failed-lessons.json", report)
    print(f"[report] {report_path.relative_to(ROOT)}")
    return 1 if any(r.get("status") == "failed" for r in youtube_results) else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="Actually rewrite manifest and delete local folders.")
    ap.add_argument("--delete-youtube", action="store_true", help="Delete removed manifest videos from YouTube. Requires --apply.")
    args = ap.parse_args()
    if args.delete_youtube and not args.apply:
        print("--delete-youtube without --apply is treated as dry-run.")
    return prune(args)


if __name__ == "__main__":
    raise SystemExit(main())
