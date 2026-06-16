#!/usr/bin/env python3
"""Build the GIIS lesson-video production dashboard.

The dashboard is read-only. It summarizes which lesson videos exist by day,
whether they passed review, whether they have human upload approval, and
whether the local repo knows they are on YouTube.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import math
import os
import re
import sys
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[2]
TEACHING_ROOT = ROOT / "teaching-videos"
AUDIT_ROOT = TEACHING_ROOT / "_audit"
OUTPUT_ROOT = AUDIT_ROOT / "dashboard"
DEFAULT_JSON = OUTPUT_ROOT / "lesson-video-dashboard.json"
DEFAULT_HTML = OUTPUT_ROOT / "lesson-video-dashboard.html"
APPROVAL_PATH = AUDIT_ROOT / "release-gate" / "approved_ready_to_upload.json"
MANIFEST_PATH = ROOT / "public" / "data" / "lessons-manifest.json"
COURSE_ROOT = ROOT / "server" / "prisma" / "courses"
LOCAL_TZ = ZoneInfo("America/Chicago")


def env_int(name: str, default: int) -> int:
    try:
        value = int(os.environ.get(name, str(default)))
    except ValueError:
        return default
    return value if value > 0 else default


PLANNED_UPLOADS_PER_DAY = env_int("FOUNDATION_DASHBOARD_TARGET_PER_DAY", 21)

sys.path.insert(0, str(ROOT / "tools" / "lesson-video"))
from audit_lessons import audit_lesson  # noqa: E402


def now_utc() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def now_local() -> str:
    return dt.datetime.now(LOCAL_TZ).replace(microsecond=0).isoformat()


def parse_iso(value: str | None) -> dt.datetime | None:
    if not value:
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        parsed = dt.datetime.fromisoformat(normalized)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=LOCAL_TZ)
        return parsed
    except ValueError:
        return None


def local_iso(value: str | None) -> str | None:
    parsed = parse_iso(value)
    if not parsed:
        return None
    return parsed.astimezone(LOCAL_TZ).replace(microsecond=0).isoformat()


def local_date(value: str | None) -> str | None:
    parsed = parse_iso(value)
    if not parsed:
        return None
    return parsed.astimezone(LOCAL_TZ).date().isoformat()


def is_clean_pass(audit: dict[str, Any]) -> bool:
    issue_counts = audit.get("issue_counts") or {}
    return (
        audit.get("verdict") == "pass"
        and int(audit.get("quality_score") or 0) >= 100
        and not issue_counts.get("critical")
        and not issue_counts.get("major")
    )


def read_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text())
    except Exception:
        return default


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def display_path(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(ROOT))
    except ValueError:
        return str(path)


def iso_from_mtime(path: Path | None) -> str | None:
    if not path or not path.exists():
        return None
    return dt.datetime.fromtimestamp(path.stat().st_mtime, dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def module_number(module: str | None) -> int | None:
    if not module:
        return None
    match = re.search(r"\bModule\s+(\d+)", module, flags=re.IGNORECASE)
    return int(match.group(1)) if match else None


def slugify(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def grade_label(value: Any) -> str:
    if value in (None, "", "None"):
        return "Unassigned"
    try:
        return f"Grade {int(value)}"
    except (TypeError, ValueError):
        return str(value)


def find_mp4(lesson_dir: Path) -> Path | None:
    canonical = lesson_dir / f"{lesson_dir.name.replace('-', '_')}.mp4"
    if canonical.exists():
        return canonical
    candidates = sorted(lesson_dir.glob("*.mp4"))
    return candidates[0] if candidates else None


def load_approvals() -> tuple[dict[str, dict[str, Any]], str | None]:
    payload = read_json(APPROVAL_PATH, {})
    generated_at = payload.get("generated_at") if isinstance(payload, dict) else None
    rows = payload.get("approved_ready_to_upload", payload.get("ready_to_upload", [])) if isinstance(payload, dict) else payload
    out: dict[str, dict[str, Any]] = {}
    for row in rows or []:
        if isinstance(row, str):
            out[row] = {"slug": row, "approved_at": generated_at}
        elif isinstance(row, dict) and row.get("slug"):
            item = dict(row)
            item.setdefault("approved_at", generated_at)
            out[str(row["slug"])] = item
    return out, generated_at


def load_manifest() -> dict[str, dict[str, Any]]:
    payload = read_json(MANIFEST_PATH, {})
    rows = payload.get("lessons") or [row for items in (payload.get("by_course") or {}).values() for row in items]
    by_dir: dict[str, dict[str, Any]] = {}
    for row in rows or []:
        lesson_dir = row.get("lesson_dir")
        if lesson_dir:
            by_dir[str(lesson_dir)] = row
    return by_dir


def load_quality_by_slug() -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for path in sorted((AUDIT_ROOT / "lesson-quality").glob("*-lesson-quality.json")):
        payload = read_json(path, {})
        generated_at = payload.get("generated_at") or iso_from_mtime(path)
        for row in payload.get("lessons") or []:
            slug = row.get("slug")
            if not slug:
                continue
            current = out.get(slug)
            if not current or (generated_at or "") >= (current.get("_audit_generated_at") or ""):
                item = dict(row)
                item["_audit_generated_at"] = generated_at
                item["_audit_file"] = str(path.relative_to(ROOT))
                out[str(slug)] = item
    return out


def load_run_events() -> dict[str, list[dict[str, Any]]]:
    events: dict[str, list[dict[str, Any]]] = {}
    run_dir = AUDIT_ROOT / "foundation-daily"
    for path in sorted(run_dir.glob("*run.json")):
        payload = read_json(path, {})
        run_at = payload.get("generated_at") or iso_from_mtime(path)
        for bucket in ("selected", "approved", "blocked", "skipped"):
            for row in payload.get(bucket) or []:
                slug = row.get("target_slug") or row.get("slug")
                if not slug:
                    continue
                events.setdefault(str(slug), []).append({
                    "type": bucket,
                    "at": row.get("approved_at") or run_at,
                    "course": row.get("course"),
                    "module": row.get("module"),
                    "reason": row.get("reason"),
                    "source": str(path.relative_to(ROOT)),
                })
    return events


def load_course_plan() -> list[dict[str, Any]]:
    courses: list[dict[str, Any]] = []
    for path in sorted(COURSE_ROOT.glob("**/*.json")):
        payload = read_json(path, {})
        if not payload.get("isPublished", True):
            continue
        modules = payload.get("modules") or []
        course_slug = str(payload.get("slug") or path.stem)
        course_name = str(payload.get("name") or course_slug)
        grade = payload.get("gradeLevel")
        courses.append({
            "slug": course_slug,
            "name": course_name,
            "grade": grade_label(grade),
            "grade_sort": 99 if grade in (None, "", "None") else int(grade),
            "department": payload.get("department") or "?",
            "type": payload.get("type") or "?",
            "credits": payload.get("credits"),
            "path": str(path.relative_to(ROOT)),
            "module_count": len(modules),
            "planned_lessons": [
                {
                    "course_slug": course_slug,
                    "course": course_name,
                    "module_number": module.get("order"),
                    "module": f"Module {module.get('order')}: {module.get('title') or 'Untitled'}",
                    "planned_slug": f"{course_slug}-module-{module.get('order')}-{slugify(module.get('title'))}-v2",
                }
                for module in modules
            ],
        })
    return courses


def lesson_rows() -> list[dict[str, Any]]:
    approvals, approval_generated_at = load_approvals()
    manifest = load_manifest()
    quality = load_quality_by_slug()
    run_events = load_run_events()
    rows: list[dict[str, Any]] = []

    for lesson_dir in sorted(TEACHING_ROOT.iterdir() if TEACHING_ROOT.exists() else []):
        if not lesson_dir.is_dir() or lesson_dir.name.startswith("_") or lesson_dir.name.startswith("."):
            continue
        script_path = lesson_dir / "script.json"
        if not script_path.exists():
            continue
        script = read_json(script_path, {})
        slug = lesson_dir.name
        mp4 = find_mp4(lesson_dir)
        contact_sheet = lesson_dir / "contact-sheet.jpg"
        transcript = lesson_dir / "transcript.txt"
        yt = script.get("youtube") or {}
        manifest_row = manifest.get(slug) or {}
        snapshot_quality = quality.get(slug) or {}
        quality_row = audit_lesson(lesson_dir)
        quality_row["_audit_generated_at"] = now_utc()
        quality_row["_audit_file"] = snapshot_quality.get("_audit_file")
        quality_source = "live"
        approval_row = approvals.get(slug)

        video_id = yt.get("video_id") or manifest_row.get("youtube_id")
        youtube_url = yt.get("url") or manifest_row.get("url")
        uploaded_at = yt.get("uploaded_at") or yt.get("published_at") or manifest_row.get("published_at")
        approved_at = (approval_row or {}).get("approved_at")

        relevant_mtimes = [
            iso_from_mtime(path)
            for path in [script_path, mp4, contact_sheet, transcript]
            if path and path.exists()
        ]
        filesystem_at = max([v for v in relevant_mtimes if v], default=None)
        event_dates = [event.get("at") for event in run_events.get(slug, []) if event.get("at")]
        produced_at = (
            max(event_dates) if event_dates else None
        ) or approved_at or quality_row.get("_audit_generated_at") or filesystem_at

        clean_pass = is_clean_pass(quality_row)
        if video_id and clean_pass:
            status = "uploaded"
        elif video_id:
            status = "uploaded_needs_review"
        elif approval_row and mp4 and clean_pass:
            status = "approved_pending_upload"
        elif mp4 and clean_pass:
            status = "passed_not_approved"
        elif mp4:
            status = "needs_review"
        elif script_path.exists() or contact_sheet.exists():
            status = "draft_no_mp4"
        else:
            status = "in_progress"

        upload_date = local_date(uploaded_at)
        production_date = local_date(produced_at) or "unknown"
        dashboard_date = upload_date or production_date

        rows.append({
            "slug": slug,
            "course": script.get("course") or quality_row.get("script", {}).get("course") or "?",
            "course_slug": slugify(script.get("course") or quality_row.get("script", {}).get("course") or "?"),
            "module": script.get("module") or quality_row.get("script", {}).get("module") or "?",
            "module_number": module_number(script.get("module")),
            "produced_at": produced_at,
            "produced_at_local": local_iso(produced_at),
            "production_date": production_date,
            "dashboard_date": dashboard_date,
            "dashboard_date_source": "upload_date" if upload_date else "production_date",
            "status": status,
            "has_mp4": bool(mp4),
            "mp4_file": str(mp4.relative_to(ROOT)) if mp4 else None,
            "has_contact_sheet": contact_sheet.exists(),
            "has_transcript": transcript.exists(),
            "quality_score": quality_row.get("quality_score"),
            "verdict": quality_row.get("verdict"),
            "quality_audit_at": quality_row.get("_audit_generated_at"),
            "quality_audit_at_local": local_iso(quality_row.get("_audit_generated_at")),
            "quality_audit_file": quality_row.get("_audit_file"),
            "quality_source": quality_source,
            "quality_issues": quality_row.get("issues") or [],
            "approved": bool(approval_row),
            "approved_at": approved_at,
            "approved_at_local": local_iso(approved_at),
            "approval_generated_at": approval_generated_at,
            "youtube_uploaded": bool(video_id),
            "youtube_video_id": video_id,
            "youtube_url": youtube_url,
            "uploaded_at": uploaded_at,
            "uploaded_at_local": local_iso(uploaded_at),
            "upload_date": upload_date,
            "run_events": run_events.get(slug, []),
        })
    return rows


def build_plan(rows: list[dict[str, Any]]) -> dict[str, Any]:
    courses = load_course_plan()
    lesson_by_key: dict[tuple[str, int], dict[str, Any]] = {}
    unmatched_lessons: list[dict[str, Any]] = []
    for row in rows:
        module_no = row.get("module_number")
        if module_no is None:
            unmatched_lessons.append(row)
            continue
        lesson_by_key[(row.get("course_slug") or slugify(row.get("course")), int(module_no))] = row

    course_summaries: list[dict[str, Any]] = []
    grade_buckets: dict[str, dict[str, Any]] = {}
    totals = {
        "courses": len(courses),
        "planned_videos": 0,
        "ap_deferred_videos": 0,
        "non_ap_planned_videos": 0,
        "created": 0,
        "mp4_ready": 0,
        "quality_pass": 0,
        "approved": 0,
        "uploaded": 0,
        "done": 0,
        "issues": 0,
        "remaining": 0,
    }

    for course in courses:
        planned_lessons = course["planned_lessons"]
        planned = len(planned_lessons)
        matched = [lesson_by_key.get((course["slug"], int(item["module_number"]))) for item in planned_lessons]
        matched_rows = [row for row in matched if row]
        uploaded = sum(1 for row in matched_rows if row.get("youtube_uploaded"))
        mp4_ready = sum(1 for row in matched_rows if row.get("has_mp4"))
        quality_pass = sum(1 for row in matched_rows if row.get("verdict") == "pass")
        approved = sum(1 for row in matched_rows if row.get("approved"))
        done = sum(1 for row in matched_rows if row.get("youtube_uploaded") and row.get("verdict") == "pass")
        issues = sum(
            1
            for row in matched_rows
            if row.get("status") in {"needs_review", "uploaded_needs_review", "in_progress", "draft_no_mp4", "passed_not_approved"}
        )
        remaining = max(planned - uploaded, 0)
        next_missing = next(
            (
                item
                for item, row in zip(planned_lessons, matched, strict=False)
                if not row or not row.get("youtube_uploaded")
            ),
            None,
        )
        summary = {
            "grade": course["grade"],
            "grade_sort": course["grade_sort"],
            "course": course["name"],
            "course_slug": course["slug"],
            "department": course["department"],
            "type": course["type"],
            "credits": course["credits"],
            "planned_videos": planned,
            "created": len(matched_rows),
            "mp4_ready": mp4_ready,
            "quality_pass": quality_pass,
            "approved": approved,
            "uploaded": uploaded,
            "done": done,
            "issues": issues,
            "remaining": remaining,
            "completion_rate": round((uploaded / planned) * 100, 1) if planned else 0,
            "done_rate": round((done / planned) * 100, 1) if planned else 0,
            "next_missing": next_missing,
        }
        course_summaries.append(summary)

        bucket = grade_buckets.setdefault(course["grade"], {
            "grade": course["grade"],
            "grade_sort": course["grade_sort"],
            "courses": 0,
            "planned_videos": 0,
            "ap_deferred_videos": 0,
            "created": 0,
            "mp4_ready": 0,
            "quality_pass": 0,
            "approved": 0,
            "uploaded": 0,
            "done": 0,
            "issues": 0,
            "remaining": 0,
        })
        bucket["courses"] += 1
        for key in ["planned_videos", "created", "mp4_ready", "quality_pass", "approved", "uploaded", "done", "issues", "remaining"]:
            bucket[key] += summary[key]
        if course["type"] == "AP":
            bucket["ap_deferred_videos"] += planned
            totals["ap_deferred_videos"] += planned
        else:
            totals["non_ap_planned_videos"] += planned

        totals["planned_videos"] += planned
        for key in ["created", "mp4_ready", "quality_pass", "approved", "uploaded", "done", "issues", "remaining"]:
            totals[key] += summary[key]

    today = dt.datetime.now(LOCAL_TZ).date()
    remaining_all = totals["remaining"]
    non_ap_remaining = max(totals["non_ap_planned_videos"] - sum(row["uploaded"] for row in course_summaries if row["type"] != "AP"), 0)
    planned_days_all = math.ceil(remaining_all / PLANNED_UPLOADS_PER_DAY) if remaining_all else 0
    planned_days_non_ap = math.ceil(non_ap_remaining / PLANNED_UPLOADS_PER_DAY) if non_ap_remaining else 0
    uploads_by_day = {}
    for row in rows:
        if row.get("youtube_uploaded") and row.get("upload_date"):
            uploads_by_day[row["upload_date"]] = uploads_by_day.get(row["upload_date"], 0) + 1
    recent_days = sorted(day for day in uploads_by_day if day >= (today - dt.timedelta(days=6)).isoformat())
    recent_avg = round(sum(uploads_by_day[day] for day in recent_days) / len(recent_days), 1) if recent_days else 0

    course_summaries.sort(key=lambda row: (row["grade_sort"], row["department"], row["course"]))
    grade_summaries = sorted(grade_buckets.values(), key=lambda row: row["grade_sort"])
    return {
        "totals": totals,
        "grades": grade_summaries,
        "courses": course_summaries,
        "unmatched_lesson_count": len(unmatched_lessons),
        "planned_at": {
            "generated_at_local": now_local(),
            "timezone": "America/Chicago",
            "target_uploads_per_day": PLANNED_UPLOADS_PER_DAY,
            "recent_7_day_upload_average": recent_avg,
            "remaining_all_videos": remaining_all,
            "remaining_non_ap_videos": non_ap_remaining,
            "estimated_days_all_at_target": planned_days_all,
            "estimated_days_non_ap_at_target": planned_days_non_ap,
            "estimated_complete_all_at_target": (today + dt.timedelta(days=planned_days_all)).isoformat(),
            "estimated_complete_non_ap_at_target": (today + dt.timedelta(days=planned_days_non_ap)).isoformat(),
            "note": "AP lessons are counted in the all-course plan but remain deferred unless Alan explicitly reopens AP-safe production.",
        },
    }


def build_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    total = len(rows)
    uploaded = sum(1 for row in rows if row["youtube_uploaded"])
    pending_upload = sum(1 for row in rows if row["status"] == "approved_pending_upload")
    approved = sum(1 for row in rows if row["approved"])
    with_mp4 = sum(1 for row in rows if row["has_mp4"])
    pass_count = sum(1 for row in rows if row.get("verdict") == "pass")
    by_day: dict[str, dict[str, int]] = {}
    for row in rows:
        day = row["dashboard_date"]
        bucket = by_day.setdefault(day, {"total": 0, "uploaded": 0, "approved_pending_upload": 0, "needs_review": 0})
        bucket["total"] += 1
        if row["youtube_uploaded"]:
            bucket["uploaded"] += 1
        if row["status"] == "approved_pending_upload":
            bucket["approved_pending_upload"] += 1
        if row["status"] in {"needs_review", "uploaded_needs_review", "in_progress", "draft_no_mp4", "passed_not_approved"}:
            bucket["needs_review"] += 1
    return {
        "total_lessons": total,
        "with_mp4": with_mp4,
        "passed_quality": pass_count,
        "approved": approved,
        "pending_upload": pending_upload,
        "uploaded": uploaded,
        "not_uploaded": total - uploaded,
        "upload_rate": round((uploaded / total) * 100, 1) if total else 0,
        "by_day": dict(sorted(by_day.items(), reverse=True)),
    }


def build_payload() -> dict[str, Any]:
    rows = lesson_rows()
    rows.sort(key=lambda row: (row["dashboard_date"], row["course"], row["module_number"] or 999, row["slug"]), reverse=True)
    return {
        "generated_at": now_utc(),
        "generated_at_local": now_local(),
        "timezone": "America/Chicago",
        "repo_root": str(ROOT),
        "sources": {
            "teaching_videos": str(TEACHING_ROOT.relative_to(ROOT)),
            "approval": str(APPROVAL_PATH.relative_to(ROOT)),
            "manifest": str(MANIFEST_PATH.relative_to(ROOT)),
            "quality_audits": str((AUDIT_ROOT / "lesson-quality").relative_to(ROOT)),
        },
        "summary": build_summary(rows),
        "plan": build_plan(rows),
        "lessons": rows,
    }


def status_label(status: str) -> str:
    return {
        "uploaded": "Uploaded",
        "uploaded_needs_review": "Uploaded, needs review",
        "approved_pending_upload": "Approved, not uploaded",
        "passed_not_approved": "Passed, not approved",
        "needs_review": "Needs review",
        "draft_no_mp4": "Draft, no MP4",
        "in_progress": "In progress",
    }.get(status, status)


def render_html(payload: dict[str, Any]) -> str:
    data = json.dumps(payload, ensure_ascii=False).replace("</", "<\\/")
    title = "GIIS Lesson Video Monitor"
    safe_generated = html.escape(payload.get("generated_at_local") or payload["generated_at"])
    safe_timezone = html.escape(payload.get("timezone") or "UTC")
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <style>
    :root {{
      --bg: #f7f8fb;
      --panel: #ffffff;
      --text: #172033;
      --muted: #657086;
      --border: #dce2ea;
      --green: #157f57;
      --amber: #b7791f;
      --red: #bf4342;
      --blue: #2f6fed;
      --ink-soft: #eef2f7;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }}
    .shell {{ max-width: 1240px; margin: 0 auto; padding: 28px 20px 40px; }}
    header {{ display: flex; gap: 18px; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; }}
    h1 {{ margin: 0; font-size: 28px; letter-spacing: 0; }}
    .stamp {{ color: var(--muted); font-size: 13px; }}
    .filters {{ display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }}
    .live-note {{
      margin: 0 0 14px;
      padding: 10px 12px;
      border: 1px solid #c8d7f2;
      background: #eef5ff;
      color: #244f8f;
      border-radius: 8px;
      font-size: 13px;
    }}
    select, input {{
      height: 36px;
      border: 1px solid var(--border);
      background: #fff;
      color: var(--text);
      border-radius: 6px;
      padding: 0 10px;
      font: inherit;
    }}
    .kpis {{ display: grid; grid-template-columns: repeat(5, minmax(130px, 1fr)); gap: 10px; margin: 16px 0; }}
    .kpi, .panel {{
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(18, 30, 50, 0.04);
    }}
    .kpi {{ padding: 14px; }}
    .kpi .label {{ color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }}
    .kpi .value {{ font-size: 26px; font-weight: 750; margin-top: 4px; }}
    .grid {{ display: grid; grid-template-columns: 0.9fr 1.4fr; gap: 12px; align-items: start; }}
    .plan-grid {{ display: grid; grid-template-columns: 0.9fr 1.2fr; gap: 12px; margin: 0 0 12px; align-items: start; }}
    .panel {{ padding: 16px; overflow: hidden; }}
    .panel h2 {{ margin: 0 0 12px; font-size: 16px; }}
    .panel h3 {{ margin: 14px 0 8px; font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }}
    .metric-line {{ display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 8px 0; border-top: 1px solid var(--border); }}
    .metric-line:first-child {{ border-top: 0; }}
    .metric-line strong {{ font-size: 18px; }}
    .course-table {{ max-height: 420px; overflow: auto; border: 1px solid var(--border); border-radius: 8px; }}
    .day-list {{ display: grid; gap: 10px; }}
    .day-row {{ border-top: 1px solid var(--border); padding-top: 10px; }}
    .day-row:first-child {{ border-top: 0; padding-top: 0; }}
    .day-head {{ display: flex; justify-content: space-between; gap: 12px; font-weight: 700; }}
    .bar {{ height: 10px; display: flex; overflow: hidden; border-radius: 999px; background: var(--ink-soft); margin: 8px 0 6px; }}
    .bar span {{ display: block; min-width: 2px; }}
    .bar .uploaded {{ background: var(--green); }}
    .bar .pending {{ background: var(--amber); }}
    .bar .review {{ background: var(--red); }}
    .legend {{ display: flex; gap: 12px; flex-wrap: wrap; color: var(--muted); font-size: 12px; }}
    .dot {{ display: inline-block; width: 8px; height: 8px; border-radius: 999px; margin-right: 5px; }}
    .dot.uploaded {{ background: var(--green); }}
    .dot.pending {{ background: var(--amber); }}
    .dot.review {{ background: var(--red); }}
    table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
    th, td {{ padding: 10px 8px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }}
    th {{ color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; background: #fbfcfe; position: sticky; top: 0; }}
    .table-wrap {{ max-height: 560px; overflow: auto; border: 1px solid var(--border); border-radius: 8px; }}
    .pill {{ display: inline-flex; align-items: center; height: 24px; padding: 0 8px; border-radius: 999px; font-size: 12px; font-weight: 650; white-space: nowrap; }}
    .pill.uploaded {{ color: #0b5c3c; background: #dff3ea; }}
    .pill.approved_pending_upload {{ color: #7a4b00; background: #fff0cf; }}
    .pill.passed_not_approved, .pill.needs_review, .pill.in_progress {{ color: #8a2f2e; background: #ffe4e1; }}
    .muted {{ color: var(--muted); }}
    a {{ color: var(--blue); text-decoration: none; }}
    a:hover {{ text-decoration: underline; }}
    @media (max-width: 900px) {{
      header {{ align-items: stretch; flex-direction: column; }}
      .kpis {{ grid-template-columns: repeat(2, minmax(0, 1fr)); }}
      .grid, .plan-grid {{ grid-template-columns: 1fr; }}
    }}
  </style>
</head>
<body>
  <div class="shell">
    <header>
      <div>
        <h1>{title}</h1>
        <div class="stamp">Generated {safe_generated} · {safe_timezone}</div>
      </div>
      <div class="filters">
        <select id="dateFilter"></select>
        <select id="statusFilter"></select>
        <input id="search" type="search" placeholder="Search course or module">
      </div>
    </header>
    <div class="live-note">
      Live mode: run <code>npm run lesson:video-dashboard:live</code> and open
      <a href="http://127.0.0.1:4178">http://127.0.0.1:4178</a>. This static file also reloads itself every 60 seconds.
    </div>

    <section class="kpis" id="kpis"></section>

    <section class="plan-grid">
      <div class="panel">
        <h2>Production Plan</h2>
        <div id="planSummary"></div>
      </div>
      <div class="panel">
        <h2>Grade Coverage</h2>
        <div class="table-wrap" style="max-height: 320px;">
          <table>
            <thead>
              <tr>
                <th>Grade</th>
                <th>Courses</th>
                <th>Videos</th>
                <th>MP4</th>
                <th>Pass</th>
                <th>Uploaded</th>
                <th>Issues</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody id="gradeRows"></tbody>
          </table>
        </div>
      </div>
      <div class="panel" style="grid-column: 1 / -1;">
        <h2>Course Pipeline</h2>
        <div class="course-table">
          <table>
            <thead>
              <tr>
                <th>Grade</th>
                <th>Course</th>
                <th>Type</th>
                <th>Videos</th>
                <th>Created</th>
                <th>MP4</th>
                <th>Pass</th>
                <th>Uploaded</th>
                <th>Done</th>
                <th>Issues</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody id="courseRows"></tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="grid">
      <div class="panel">
        <h2>Daily Uploads</h2>
        <div class="muted" style="font-size:12px;margin:-6px 0 12px;">Dates use America/Chicago local time. Uploaded lessons are grouped by YouTube upload timestamp after local conversion; pending drafts use production date.</div>
        <div class="day-list" id="days"></div>
      </div>
      <div class="panel">
        <h2>Lesson Detail</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Created</th>
                <th>Lesson</th>
                <th>Status</th>
                <th>Quality</th>
                <th>Uploaded</th>
                <th>YouTube</th>
              </tr>
            </thead>
            <tbody id="rows"></tbody>
          </table>
        </div>
      </div>
    </section>
  </div>

  <script id="payload" type="application/json">{data}</script>
    <script>
    const payload = JSON.parse(document.getElementById('payload').textContent);
    const statusLabel = {json.dumps({k: status_label(k) for k in ["uploaded", "uploaded_needs_review", "approved_pending_upload", "passed_not_approved", "needs_review", "draft_no_mp4", "in_progress"]})};
    const state = {{ date: 'all', status: 'all', search: '' }};

    function filtered() {{
      const needle = state.search.trim().toLowerCase();
      return payload.lessons.filter(row => {{
        if (state.date !== 'all' && row.dashboard_date !== state.date) return false;
        if (state.status !== 'all' && row.status !== state.status) return false;
        if (needle && !`${{row.course}} ${{row.module}} ${{row.slug}}`.toLowerCase().includes(needle)) return false;
        return true;
      }});
    }}

    function count(rows, fn) {{ return rows.filter(fn).length; }}

    function renderFilters() {{
      const dates = [...new Set(payload.lessons.map(row => row.dashboard_date))].sort().reverse();
      dateFilter.innerHTML = `<option value="all">All dates</option>` + dates.map(d => `<option value="${{d}}">${{d}}</option>`).join('');
      const statuses = [...new Set(payload.lessons.map(row => row.status))];
      statusFilter.innerHTML = `<option value="all">All statuses</option>` + statuses.map(s => `<option value="${{s}}">${{statusLabel[s] || s}}</option>`).join('');
      dateFilter.onchange = e => {{ state.date = e.target.value; render(); }};
      statusFilter.onchange = e => {{ state.status = e.target.value; render(); }};
      search.oninput = e => {{ state.search = e.target.value; render(); }};
    }}

    function renderKpis(rows) {{
      const plan = payload.plan?.totals || {{}};
      const cards = [
        ['Planned Videos', plan.planned_videos ?? rows.length],
        ['Uploaded', plan.uploaded ?? count(rows, r => r.youtube_uploaded)],
        ['MP4 Ready', plan.mp4_ready ?? count(rows, r => r.has_mp4)],
        ['Quality Pass', plan.quality_pass ?? count(rows, r => r.verdict === 'pass')],
        ['Remaining', plan.remaining ?? 0]
      ];
      kpis.innerHTML = cards.map(([label, value]) => `<div class="kpi"><div class="label">${{label}}</div><div class="value">${{value}}</div></div>`).join('');
    }}

    function renderPlan() {{
      const plan = payload.plan || {{}};
      const totals = plan.totals || {{}};
      const planned = plan.planned_at || {{}};
      const doneRate = totals.planned_videos ? Math.round((totals.done / totals.planned_videos) * 1000) / 10 : 0;
      const uploadRate = totals.planned_videos ? Math.round((totals.uploaded / totals.planned_videos) * 1000) / 10 : 0;
      planSummary.innerHTML = `
        <div class="metric-line"><span>Total courses</span><strong>${{totals.courses || 0}}</strong></div>
        <div class="metric-line"><span>Total videos to handle</span><strong>${{totals.planned_videos || 0}}</strong></div>
        <div class="metric-line"><span>Non-AP active video plan</span><strong>${{totals.non_ap_planned_videos || 0}}</strong></div>
        <div class="metric-line"><span>AP deferred videos</span><strong>${{totals.ap_deferred_videos || 0}}</strong></div>
        <div class="metric-line"><span>Uploaded / done</span><strong>${{totals.uploaded || 0}} / ${{totals.done || 0}}</strong></div>
        <div class="metric-line"><span>Upload / done rate</span><strong>${{uploadRate}}% / ${{doneRate}}%</strong></div>
        <h3>Planned At</h3>
        <div class="metric-line"><span>Target pace</span><strong>${{planned.target_uploads_per_day || 0}}/day</strong></div>
        <div class="metric-line"><span>All courses ETA</span><strong>${{planned.estimated_complete_all_at_target || 'n/a'}}</strong></div>
        <div class="metric-line"><span>Non-AP ETA</span><strong>${{planned.estimated_complete_non_ap_at_target || 'n/a'}}</strong></div>
        <div class="muted" style="font-size:12px;margin-top:8px;">${{planned.note || ''}}</div>
      `;

      gradeRows.innerHTML = (plan.grades || []).map(row => `
        <tr>
          <td><strong>${{row.grade}}</strong></td>
          <td>${{row.courses}}</td>
          <td>${{row.planned_videos}}</td>
          <td>${{row.mp4_ready}}</td>
          <td>${{row.quality_pass}}</td>
          <td>${{row.uploaded}}</td>
          <td>${{row.issues}}</td>
          <td>${{row.remaining}}</td>
        </tr>
      `).join('');

      courseRows.innerHTML = (plan.courses || []).map(row => `
        <tr>
          <td>${{row.grade}}</td>
          <td><strong>${{row.course}}</strong><br><span class="muted">${{row.department}}</span></td>
          <td>${{row.type}}</td>
          <td>${{row.planned_videos}}</td>
          <td>${{row.created}}</td>
          <td>${{row.mp4_ready}}</td>
          <td>${{row.quality_pass}}</td>
          <td>${{row.uploaded}}</td>
          <td>${{row.done}}</td>
          <td>${{row.issues}}</td>
          <td>${{row.remaining}}</td>
        </tr>
      `).join('');
    }}

    function renderDays(rows) {{
      const byDay = new Map();
      rows.forEach(row => {{
        const bucket = byDay.get(row.dashboard_date) || {{ total: 0, uploaded: 0, pending: 0, review: 0, rows: [] }};
        bucket.total += 1;
        bucket.rows.push(row);
        if (row.youtube_uploaded) bucket.uploaded += 1;
        else if (row.status === 'approved_pending_upload') bucket.pending += 1;
        else bucket.review += 1;
        byDay.set(row.dashboard_date, bucket);
      }});
      const items = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));
      days.innerHTML = items.map(([day, bucket]) => {{
        const pct = key => bucket.total ? Math.max((bucket[key] / bucket.total) * 100, bucket[key] ? 4 : 0) : 0;
        return `<div class="day-row">
          <div class="day-head"><span>${{day}}</span><span>${{bucket.total}} lesson${{bucket.total === 1 ? '' : 's'}}</span></div>
          <div class="bar">
            <span class="uploaded" style="width:${{pct('uploaded')}}%"></span>
            <span class="pending" style="width:${{pct('pending')}}%"></span>
            <span class="review" style="width:${{pct('review')}}%"></span>
          </div>
          <div class="legend">
            <span><i class="dot uploaded"></i>${{bucket.uploaded}} uploaded</span>
            <span><i class="dot pending"></i>${{bucket.pending}} approved pending</span>
            <span><i class="dot review"></i>${{bucket.review}} review/in progress</span>
          </div>
        </div>`;
      }}).join('') || '<div class="muted">No matching lessons.</div>';
    }}

    function renderRows(rows) {{
      rows.sort((a, b) => `${{b.dashboard_date}} ${{b.course}} ${{b.module_number || 999}}`.localeCompare(`${{a.dashboard_date}} ${{a.course}} ${{a.module_number || 999}}`));
      document.getElementById('rows').innerHTML = rows.map(row => {{
        const yt = row.youtube_uploaded
          ? `<a href="${{row.youtube_url}}" target="_blank" rel="noreferrer">${{row.youtube_video_id}}</a>`
          : '<span class="muted">Not uploaded</span>';
        const issue = row.quality_issues?.[0]?.message ? `<div class="muted">${{row.quality_issues[0].message}}</div>` : '';
        const source = row.quality_source === 'live' ? '<div class="muted">Live audit fallback</div>' : '';
        const quality = row.quality_score == null ? '<span class="muted">No audit</span>' : `${{row.verdict || ''}} · ${{row.quality_score}}${{source}}${{issue}}`;
        return `<tr>
          <td>${{row.dashboard_date}}<br><span class="muted">${{row.dashboard_date_source === 'upload_date' ? 'upload local' : 'production local'}}</span></td>
          <td><strong>${{row.course}}</strong><br><span class="muted">${{row.module}}</span><br><span class="muted">${{row.slug}}</span></td>
          <td><span class="pill ${{row.status}}">${{statusLabel[row.status] || row.status}}</span></td>
          <td>${{quality}}</td>
          <td>${{row.uploaded_at_local || '<span class="muted">Pending</span>'}}</td>
          <td>${{yt}}</td>
        </tr>`;
      }}).join('');
    }}

    function render() {{
      const rows = filtered();
      renderKpis(rows);
      renderDays(rows);
      renderRows(rows);
    }}
    renderFilters();
    renderPlan();
    render();
    setInterval(() => window.location.reload(), 60000);
  </script>
</body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the GIIS lesson-video dashboard.")
    parser.add_argument("--json", type=Path, default=DEFAULT_JSON)
    parser.add_argument("--html", type=Path, default=DEFAULT_HTML)
    parser.add_argument("--no-html", action="store_true")
    args = parser.parse_args()

    payload = build_payload()
    write_json(args.json, payload)
    if not args.no_html:
        args.html.parent.mkdir(parents=True, exist_ok=True)
        args.html.write_text(render_html(payload), encoding="utf-8")

    summary = payload["summary"]
    print(f"[dashboard] wrote {display_path(args.json)}")
    if not args.no_html:
        print(f"[dashboard] wrote {display_path(args.html)}")
    print(
        "[dashboard] "
        f"lessons={summary['total_lessons']} "
        f"mp4={summary['with_mp4']} "
        f"approved={summary['approved']} "
        f"uploaded={summary['uploaded']} "
        f"pending_upload={summary['pending_upload']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
