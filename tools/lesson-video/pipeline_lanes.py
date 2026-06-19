#!/usr/bin/env python3
"""Read-only lane status for the GIIS lesson-video pipeline.

This script is intentionally not a producer. It separates the paused pipeline
into decision lanes so Umi/Codex can decide the smallest useful next action
without starting cc, rendering, uploading, or reconciling YouTube metadata.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
TEACHING_ROOT = ROOT / "teaching-videos"
RELEASE_GATE_DIR = TEACHING_ROOT / "_audit" / "release-gate"
APPROVED_READY = RELEASE_GATE_DIR / "approved_ready_to_upload.json"
LATEST_RELEASE_GATE = RELEASE_GATE_DIR / "latest-release-gate.json"
AUTOMATION_TOML = Path.home() / ".codex" / "automations" / "giis-foundation-video-split-batch" / "automation.toml"


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text())
    except Exception:
        return None


def read_automation_status() -> dict[str, str | None]:
    status = {"path": str(AUTOMATION_TOML), "status": None, "name": None, "id": None}
    try:
        for raw in AUTOMATION_TOML.read_text().splitlines():
            if raw.startswith(("id =", "name =", "status =")):
                key, value = raw.split("=", 1)
                status[key.strip()] = value.strip().strip('"')
    except Exception:
        pass
    return status


def find_mp4(folder: Path) -> Path | None:
    canonical = folder / f"{folder.name.replace('-', '_')}.mp4"
    if canonical.exists():
        return canonical
    mp4s = sorted(folder.glob("*.mp4"))
    return mp4s[0] if mp4s else None


def scan_lessons() -> list[dict[str, Any]]:
    if not TEACHING_ROOT.exists():
        return []
    lessons: list[dict[str, Any]] = []
    for folder in sorted(TEACHING_ROOT.iterdir()):
        if not folder.is_dir() or folder.name.startswith(".") or folder.name == "_audit":
            continue
        script_path = folder / "script.json"
        if not script_path.exists():
            continue
        script = load_json(script_path)
        if not isinstance(script, dict):
            lessons.append({"slug": folder.name, "path": str(folder), "status": "broken-json"})
            continue
        youtube = script.get("youtube") or {}
        video_id = youtube.get("video_id")
        mp4 = find_mp4(folder)
        if video_id:
            status = "uploaded"
        elif mp4:
            status = "pending"
        else:
            status = "no-mp4"
        lessons.append({
            "slug": folder.name,
            "path": str(folder),
            "status": status,
            "course": script.get("course") or "?",
            "module": script.get("module") or "?",
            "video_id": video_id,
            "uploaded_at": youtube.get("uploaded_at") or youtube.get("published_at"),
        })
    return lessons


def approved_slugs() -> set[str]:
    payload = load_json(APPROVED_READY)
    if isinstance(payload, dict):
        rows = payload.get("approved_ready_to_upload") or payload.get("ready_to_upload") or []
    elif isinstance(payload, list):
        rows = payload
    else:
        rows = []
    out = set()
    for row in rows:
        if isinstance(row, dict) and row.get("slug"):
            out.add(str(row["slug"]))
        elif isinstance(row, str):
            out.add(row)
    return out


def release_gate_artifacts() -> dict[str, Any]:
    artifacts = []
    for path in sorted(RELEASE_GATE_DIR.glob("*release-gate.json")):
        payload = load_json(path)
        if not isinstance(payload, dict):
            continue
        summary = payload.get("summary") or {}
        artifacts.append({
            "path": str(path),
            "name": path.name,
            "generated_at": payload.get("generated_at"),
            "policy": payload.get("policy") or {},
            "summary": summary,
            "total": int(summary.get("total") or 0),
        })
    latest = load_json(LATEST_RELEASE_GATE)
    return {
        "latest": latest if isinstance(latest, dict) else None,
        "artifacts": artifacts,
    }


def run_refresh_gate() -> dict[str, Any]:
    cmd = [sys.executable, "tools/lesson-video/lesson_release_gate.py", "--check"]
    result = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True, timeout=120)
    parsed: dict[str, str] = {}
    for line in result.stdout.splitlines():
        if line.startswith("[gate] ") and ":" in line:
            key, value = line.removeprefix("[gate] ").split(":", 1)
            parsed[key.strip().replace(" ", "_")] = value.strip()
    return {
        "command": " ".join(cmd),
        "returncode": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "summary": parsed,
    }


def summarize(args: argparse.Namespace) -> dict[str, Any]:
    lessons = scan_lessons()
    counts = Counter(row["status"] for row in lessons)
    approved = approved_slugs()
    pending = [row for row in lessons if row["status"] == "pending"]
    pending_approved = [row for row in pending if row["slug"] in approved]
    by_course: dict[str, Counter[str]] = defaultdict(Counter)
    for row in lessons:
        by_course[str(row.get("course") or "?")][row["status"]] += 1

    gate = release_gate_artifacts()
    latest_gate = gate["latest"]
    latest_summary = (latest_gate or {}).get("summary") or {}
    latest_total = int(latest_summary.get("total") or 0)
    gate_coverage = "none"
    if latest_total:
        ratio = latest_total / max(len(lessons), 1)
        gate_coverage = "full-ish" if ratio >= 0.8 else "partial"

    refresh = run_refresh_gate() if args.refresh_gate else None

    return {
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "automation": read_automation_status(),
        "queue": {
            "total": len(lessons),
            "uploaded": counts.get("uploaded", 0),
            "pending": counts.get("pending", 0),
            "no_mp4": counts.get("no-mp4", 0),
            "broken_json": counts.get("broken-json", 0),
            "pending_approved": len(pending_approved),
            "pending_by_course": dict(Counter(row["course"] for row in pending)),
            "no_mp4_by_course": dict(Counter(row["course"] for row in lessons if row["status"] == "no-mp4")),
        },
        "release_gate": {
            "latest_summary": latest_summary,
            "latest_generated_at": (latest_gate or {}).get("generated_at") if latest_gate else None,
            "latest_coverage": gate_coverage,
            "latest_total": latest_total,
            "lesson_total": len(lessons),
            "artifact_count": len(gate["artifacts"]),
            "largest_artifact": max(gate["artifacts"], key=lambda row: row["total"], default=None),
            "refresh": refresh,
        },
        "lanes": classify_lanes(counts, pending, pending_approved, latest_summary, gate_coverage, refresh),
        "course_snapshot": {
            course: dict(counts)
            for course, counts in sorted(by_course.items())
            if counts.get("pending") or counts.get("no-mp4")
        },
    }


def classify_lanes(
    counts: Counter[str],
    pending: list[dict[str, Any]],
    pending_approved: list[dict[str, Any]],
    latest_summary: dict[str, Any],
    gate_coverage: str,
    refresh: dict[str, Any] | None,
) -> dict[str, dict[str, str]]:
    automation = read_automation_status()
    paused = automation.get("status") == "PAUSED"
    needs_revision = latest_summary.get("needs_revision")
    debt_status = "known" if gate_coverage == "full-ish" else "needs-refresh"
    debt_next = "repair in small batches, separate from production"
    if gate_coverage != "full-ish" and not refresh:
        needs_revision = "unknown"
    if refresh and refresh.get("stdout"):
        refresh_summary = refresh.get("summary") or {}
        if refresh.get("returncode") == 0 and refresh_summary.get("needs_revision") is not None:
            needs_revision = refresh_summary["needs_revision"]
            debt_status = "known-fresh"
            debt_next = "repair old quality debt in small batches, separate from production"

    return {
        "producer": {
            "status": "hold" if paused else "available",
            "reason": "automation is paused for speed/ROI review" if paused else "automation is not paused",
            "next_action": "do not start new Grade 10 production until ROI is approved",
        },
        "upload": {
            "status": "manual-only" if pending else "empty",
            "reason": f"{len(pending)} rendered pending lessons; {len(pending_approved)} have approval artifact",
            "next_action": "review pending Algebra II value before any gate-ready upload",
        },
        "quality_debt": {
            "status": debt_status,
            "reason": f"latest release-gate coverage is {gate_coverage}; needs_revision={needs_revision}",
            "next_action": debt_next if debt_status != "needs-refresh" else "run this tool with --refresh-gate before sizing old quality debt",
        },
        "reconciliation": {
            "status": "backlog",
            "reason": "captions, thumbnails, playlists, manifest/channel sync are not video-upload blockers",
            "next_action": "run only after production/resume decision or after quota reset",
        },
    }


def print_text(report: dict[str, Any]) -> None:
    print("GIIS lesson-video pipeline lanes")
    print(f"generated_at: {report['generated_at']}")
    automation = report["automation"]
    print(f"automation: {automation.get('name') or automation.get('id')} -> {automation.get('status') or 'unknown'}")
    q = report["queue"]
    print(f"queue: {q['uploaded']} uploaded / {q['pending']} pending / {q['no_mp4']} no-MP4 / {q['total']} total")
    print(f"approval: {q['pending_approved']} pending lessons are in approved_ready_to_upload")
    gate = report["release_gate"]
    print(
        "release_gate: "
        f"{gate['latest_summary']} "
        f"(coverage={gate['latest_coverage']}, latest_total={gate['latest_total']}, lesson_total={gate['lesson_total']})"
    )
    largest = gate.get("largest_artifact")
    if largest:
        print(f"largest_gate_artifact: {Path(largest['path']).name} {largest['summary']}")
    refresh = gate.get("refresh")
    if refresh:
        print(f"refresh_gate_command: {refresh['command']} rc={refresh['returncode']}")
        for line in refresh["stdout"].splitlines():
            if line.startswith("[gate]"):
                print(line)
    print()
    for name, lane in report["lanes"].items():
        print(f"{name}: {lane['status']}")
        print(f"  why: {lane['reason']}")
        print(f"  next: {lane['next_action']}")
    if report["course_snapshot"]:
        print()
        print("pending/no-MP4 by course:")
        for course, counts in report["course_snapshot"].items():
            print(f"  - {course}: {counts}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only GIIS lesson-video pipeline lane status.")
    parser.add_argument("--json", action="store_true", help="Print JSON instead of text.")
    parser.add_argument("--refresh-gate", action="store_true", help="Run full release gate in --check mode before reporting.")
    args = parser.parse_args()

    report = summarize(args)
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print_text(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
