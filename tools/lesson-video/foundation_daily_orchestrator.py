#!/usr/bin/env python3
"""Daily GIIS foundation-video orchestrator."""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import textwrap
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
COURSE_ROOT = ROOT / "server" / "prisma" / "courses"
TEACHING_ROOT = ROOT / "teaching-videos"
RUN_ROOT = TEACHING_ROOT / "_audit" / "foundation-daily"
STATE_PATH = RUN_ROOT / "state.json"
APPROVAL_PATH = TEACHING_ROOT / "_audit" / "release-gate" / "approved_ready_to_upload.json"
HANDOFF_DIR = ROOT / "umi" / "handoffs"
CC_WORKER = ROOT / "tools" / "lesson-video" / "cc_foundation_worker.py"
FOUNDATION_GATE = ROOT / "tools" / "lesson-video" / "foundation_video_gate.py"
RELEASE_GATE = ROOT / "tools" / "lesson-video" / "lesson_release_gate.py"
YT_QUEUE = ROOT / "tools" / "youtube-upload" / "yt_queue.py"
SYNC_CHANNEL = ROOT / "tools" / "youtube-upload" / "sync_channel.py"

sys.path.insert(0, str(ROOT / "tools" / "lesson-video"))
from audit_lessons import audit_lesson  # noqa: E402


FOUNDATION_PRIORITY = [
    "algebra-i",
    "english-i",
    "biology",
    "world-history",
    "us-history",
    "american-government",
    "government",
    "health-wellness",
    "physical-education",
    "digital-literacy",
    "introduction-to-communication",
]

HARD_BLOCKING_HOSTS = {
    "apclassroom.collegeboard.org": "restricted AP Classroom / College Board login",
    "commonlit.org": "classroom/login flow likely required",
    "noredink.com": "paid school product risk",
    "jstor.org": "institutional login/paywall risk",
    "hbr.org": "paywall/subscription risk",
    "criterion.com": "subscription streaming risk",
    "canva.com": "account/pro feature risk",
    "docs.google.com": "permission/account risk",
    "slides.google.com": "permission/account risk",
    "drive.google.com": "permission/account risk",
    "medium.com": "metered/paywall risk",
    "practiceit.cs.washington.edu": "account/deprecated access risk",
}

SOFT_RISK_HOSTS = {
    "khanacademy.org": "free nonprofit; practice/progress may require a free account",
    "academy.hubspot.com": "free but login/certificate flow",
    "learndigital.withgoogle.com": "free but login/certificate flow",
}


@dataclass(frozen=True)
class Candidate:
    course_file: Path
    course: dict[str, Any]
    module: dict[str, Any]
    target_slug: str
    target_dir: Path
    key: str


def now_utc() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def today_stamp() -> str:
    return dt.datetime.now().strftime("%Y-%m-%d")


def slugify(value: str, *, max_words: int = 6) -> str:
    words = re.findall(r"[a-z0-9]+", value.lower())
    return "-".join(words[:max_words]) or "module"


def read_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text())
    except Exception:
        return default


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def load_courses() -> list[tuple[Path, dict[str, Any]]]:
    courses = []
    for path in sorted(COURSE_ROOT.rglob("*.json")):
        data = read_json(path, {})
        if data.get("isPublished") is False:
            continue
        if data.get("slug") and data.get("modules"):
            courses.append((path, data))
    return courses


def is_ap_course(course: dict[str, Any]) -> bool:
    text = f"{course.get('name', '')} {course.get('slug', '')}".lower()
    return bool(re.search(r"\bap\b|advanced placement|college board", text))


def course_priority(course: dict[str, Any]) -> tuple[int, str]:
    slug = str(course.get("slug") or "")
    try:
        return (FOUNDATION_PRIORITY.index(slug), slug)
    except ValueError:
        return (len(FOUNDATION_PRIORITY) + 1, slug)


def target_slug(course: dict[str, Any], module: dict[str, Any]) -> str:
    order = int(module.get("order") or module.get("moduleOrder") or 0)
    topic = slugify(str(module.get("title") or f"module-{order}"), max_words=5)
    return f"{course.get('slug')}-module-{order}-{topic}-v2"


def youtube_id(raw_url: str) -> str | None:
    try:
        parsed = urllib.parse.urlparse(raw_url)
        host = (parsed.hostname or "").removeprefix("www.")
        if host == "youtu.be":
            return parsed.path.strip("/").split("/")[0] or None
        if not host.endswith("youtube.com"):
            return None
        if parsed.path == "/watch":
            return urllib.parse.parse_qs(parsed.query).get("v", [None])[0]
        if parsed.path.startswith("/embed/") or parsed.path.startswith("/shorts/"):
            return parsed.path.split("/")[2] or None
    except Exception:
        return None
    return None


def url_refs(module: dict[str, Any]) -> list[dict[str, Any]]:
    refs = []
    for key, value in sorted(module.items()):
        if not isinstance(value, str) or not value.startswith(("http://", "https://")):
            continue
        parsed = urllib.parse.urlparse(value)
        host = (parsed.hostname or "").removeprefix("www.")
        refs.append({
            "key": key,
            "url": value,
            "host": host,
            "note": module.get(key.replace("Url", "Note"), ""),
            "youtube_id": youtube_id(value),
        })
    return refs


def fetch_status(url: str, *, timeout: float) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": "GIIS-foundation-daily/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return {"ok": 200 <= res.status < 400, "status": res.status}
    except urllib.error.HTTPError as exc:
        return {"ok": False, "status": exc.code, "error": str(exc)}
    except Exception as exc:
        return {"ok": False, "status": "FETCH_ERROR", "error": str(exc)[:180]}


def check_youtube_oembed(video_id: str, *, timeout: float) -> dict[str, Any]:
    url = (
        "https://www.youtube.com/oembed?format=json&url="
        + urllib.parse.quote(f"https://www.youtube.com/watch?v={video_id}", safe="")
    )
    return {"id": video_id, **fetch_status(url, timeout=timeout)}


def resource_audit(module: dict[str, Any], *, network: bool, timeout: float) -> dict[str, Any]:
    refs = url_refs(module)
    errors: list[str] = []
    warnings: list[str] = []
    checked_refs = []
    for ref in refs:
        ref = dict(ref)
        if ref["host"] in HARD_BLOCKING_HOSTS:
            errors.append(f"{ref['key']} uses blocked host {ref['host']}: {HARD_BLOCKING_HOSTS[ref['host']]}")
            ref["access_risk"] = "hard_blocking"
        elif ref["host"] in SOFT_RISK_HOSTS:
            warnings.append(f"{ref['key']} uses soft-risk host {ref['host']}: {SOFT_RISK_HOSTS[ref['host']]}")
            ref["access_risk"] = "soft_risk"
        else:
            ref["access_risk"] = "ok"
        if network:
            if ref.get("youtube_id"):
                availability = check_youtube_oembed(str(ref["youtube_id"]), timeout=timeout)
                ref["availability"] = availability
                if not availability.get("ok"):
                    errors.append(f"{ref['key']} YouTube unavailable: {ref['youtube_id']} ({availability.get('status')})")
            else:
                availability = fetch_status(ref["url"], timeout=timeout)
                ref["availability"] = availability
                if not availability.get("ok"):
                    message = f"{ref['key']} fetch check failed: {ref['host']} ({availability.get('status')})"
                    if isinstance(availability.get("status"), int):
                        errors.append(message)
                    else:
                        warnings.append(message)
        checked_refs.append(ref)
    if not refs:
        warnings.append("module has no external URL references")
    return {"refs": checked_refs, "errors": errors, "warnings": warnings}


def lesson_uploaded_or_visible(course: dict[str, Any], module: dict[str, Any], slug: str) -> bool:
    folder = TEACHING_ROOT / slug
    script = read_json(folder / "script.json", {}) if folder.exists() else {}
    if (script.get("youtube") or {}).get("video_id"):
        return True

    course_name = str(course.get("name") or "").lower()
    module_title = str(module.get("title") or "").lower()
    for existing in sorted(TEACHING_ROOT.glob("*-v2")):
        existing_script = read_json(existing / "script.json", {})
        if not existing_script:
            continue
        existing_course = str(existing_script.get("course") or "").lower()
        existing_module = str(existing_script.get("module") or "").lower()
        if existing_course == course_name and module_title and module_title in existing_module:
            return True

    manifest = read_json(ROOT / "public" / "data" / "lessons-manifest.json", {})
    lessons = manifest.get("lessons") or [row for rows in (manifest.get("by_course") or {}).values() for row in rows]
    course_slug = str(course.get("slug"))
    order = int(module.get("order") or 0)
    return any(
        row.get("course_slug") == course_slug and int(row.get("module_number") or 0) == order
        for row in lessons
    )


def collect_candidates(*, include_other_foundation: bool = True) -> list[Candidate]:
    out = []
    for course_file, course in sorted(load_courses(), key=lambda row: course_priority(row[1])):
        if is_ap_course(course):
            continue
        if not include_other_foundation and course.get("slug") not in FOUNDATION_PRIORITY:
            continue
        for module in sorted(course.get("modules") or [], key=lambda m: int(m.get("order") or 0)):
            if not module.get("title"):
                continue
            slug = target_slug(course, module)
            if lesson_uploaded_or_visible(course, module, slug):
                continue
            order = int(module.get("order") or 0)
            out.append(Candidate(course_file, course, module, slug, TEACHING_ROOT / slug, f"{course.get('slug')}:M{order}"))
    return out


def load_state() -> dict[str, Any]:
    return read_json(STATE_PATH, {"modules": {}})


def save_state(state: dict[str, Any]) -> None:
    write_json(STATE_PATH, state)


def select_candidates(candidates: list[Candidate], state: dict[str, Any], *, limit: int) -> list[Candidate]:
    by_key = {candidate.key: candidate for candidate in candidates}
    selected_keys = []
    for key, row in sorted((state.get("modules") or {}).items()):
        if key in by_key and row.get("status") in {"cc_blocked", "gate_failed", "resource_failed"} and int(row.get("attempts") or 0) < 2:
            selected_keys.append(key)
    for candidate in candidates:
        if len(selected_keys) >= limit:
            break
        if candidate.key not in selected_keys:
            selected_keys.append(candidate.key)
    return [by_key[key] for key in selected_keys[:limit] if key in by_key]


def subject_area(course: dict[str, Any]) -> str:
    text = f"{course.get('department', '')} {course.get('name', '')} {course.get('slug', '')}".lower()
    if any(word in text for word in ["math", "algebra", "geometry", "statistics", "calculus"]):
        return "math"
    if any(word in text for word in ["biology", "chemistry", "physics", "science"]):
        return "science"
    if any(word in text for word in ["english", "literature", "composition", "writing"]):
        return "literature"
    if any(word in text for word in ["history", "government", "civics", "economics", "social"]):
        return "social_studies"
    if any(word in text for word in ["health", "physical", "pe", "sports"]):
        return "health_pe"
    return "general"


def voice_for_subject(area: str) -> str:
    return {
        "math": "en-US-AriaNeural",
        "science": "en-US-EmmaNeural",
        "literature": "en-US-AndrewNeural",
        "social_studies": "en-US-ChristopherNeural",
        "health_pe": "en-US-JennyNeural",
    }.get(area, "en-US-AriaNeural")


def build_packet(candidate: Candidate, audit: dict[str, Any]) -> dict[str, Any]:
    course = candidate.course
    module = candidate.module
    area = subject_area(course)
    title = module.get("title")
    order = int(module.get("order") or 0)
    return {
        "generated_at": now_utc(),
        "policy": "foundation_daily_v1",
        "source_of_truth": str(candidate.course_file.relative_to(ROOT)),
        "target_slug": candidate.target_slug,
        "course": {
            "slug": course.get("slug"),
            "name": course.get("name"),
            "department": course.get("department"),
            "credits": course.get("credits"),
            "subject_area": area,
        },
        "module": {
            "order": order,
            "title": title,
            "objectives": module.get("objectives"),
            "assignment": module.get("assignment"),
            "estimatedHrs": module.get("estimatedHrs"),
        },
        "resources": audit,
        "production_defaults": {
            "voice": voice_for_subject(area),
            "voice_rate": "-3%",
            "target_minutes": "5-7",
            "youtube_title": f"GIIS {course.get('name')} | Module {order:02d}: {title}",
            "privacy": "unlisted",
        },
        "teaching_blueprint": [
            "title: course/module signal and parent-visible seriousness",
            "hook: one concrete problem or surprising situation tied to the module",
            "overview: three learning moves students will complete",
            "concept: define the core idea in plain English",
            "misconception: show the common wrong move before the correct one",
            "worked example: trace the skill step by step",
            "pause: student solves one short problem",
            "answer reveal: narrated solution on a visually different slide",
            "application: connect the idea to the course/module assignment",
            "recap: 3-bullet memory aid",
            "path: exact Learn Portal next action",
        ],
        "quality_bar": [
            "Parent should feel this is a serious school lesson, not generic AI slides.",
            "Every slide must have one claim or one learner action.",
            "Use course-specific palette, voice, and visual rhythm.",
            "Use deterministic diagrams for precise math/science/history evidence.",
            "Do not read URLs aloud.",
            "No AP, College Board, CEEB, accreditation, or admissions claims.",
        ],
    }


def render_teaching_brief(packet: dict[str, Any]) -> str:
    course = packet["course"]
    module = packet["module"]
    refs = packet["resources"]["refs"]
    return "\n".join([
        f"# Teaching Brief: {course['name']} Module {module['order']} - {module['title']}",
        "",
        f"Source: `{packet['source_of_truth']}`",
        f"Objectives: {module.get('objectives') or 'N/A'}",
        f"Assignment tie-in: {module.get('assignment') or 'N/A'}",
        "",
        "## Required Lesson Spine",
        "",
        *[f"- {item}" for item in packet["teaching_blueprint"]],
        "",
        "## Parent-Buying Quality Bar",
        "",
        *[f"- {item}" for item in packet["quality_bar"]],
        "",
        "## Resource Notes",
        "",
        *[f"- `{ref['key']}` {ref['note'] or ref['url']} ({ref['host']})" for ref in refs],
        "",
    ])


def render_visual_brief(packet: dict[str, Any]) -> str:
    course = packet["course"]
    area = course["subject_area"]
    palette_note = {
        "math": "warm gold accents, graphs/equations/number-line objects, calm high-contrast layouts",
        "science": "teal/green accents, clean diagrams, cause-effect and scale visuals",
        "literature": "sepia/maroon accents, sentence strips, annotation marks, text evidence callouts",
        "social_studies": "documentary navy/rust accents, maps/timelines/source snippets",
        "health_pe": "fresh green/blue accents, coach-like checklists, body/behavior diagrams",
    }.get(area, "GIIS accent palette with subject-specific visuals")
    return textwrap.dedent(f"""\
    # Visual Brief

    Course: {course['name']}
    Subject area: {area}
    Direction: {palette_note}

    Requirements:
    - Contact sheet must look varied at thumbnail size.
    - Pause and answer reveal slides must be visually distinct.
    - Use diagrams/tables/worked examples instead of decorative card grids.
    - Generated images are allowed only for low-precision hooks or thumbnails.
    - Precision content must be deterministic in build_slides.py.
    """)


def render_handoff(candidate: Candidate, packet: dict[str, Any]) -> str:
    course = packet["course"]
    module = packet["module"]
    return textwrap.dedent(f"""\
    # Foundation Video Production Handoff

    Date: {today_stamp()}
    Owner: Claude Code production worker
    Reviewer / release authority: Umi/Codex

    ## Target

    - Course: {course['name']}
    - Module: {module['order']}: {module['title']}
    - Target folder: `teaching-videos/{candidate.target_slug}/`
    - Source packet: `teaching-videos/{candidate.target_slug}/source_packet.json`
    - Teaching brief: `teaching-videos/{candidate.target_slug}/teaching_brief.md`
    - Visual brief: `teaching-videos/{candidate.target_slug}/visual_brief.md`

    ## Hard Constraints

    - Non-AP foundation video only.
    - Do not upload to YouTube.
    - Do not edit playlists.
    - Do not add `script.json.youtube`.
    - Do not make AP, College Board, CEEB, accreditation, Common App, NCAA, or admissions claims.
    - Keep changes scoped to the target lesson folder unless a mechanical pipeline bug blocks production.

    ## Required Output

    Produce a complete V2 lesson folder: `script.json`, `build_slides.py`, slides,
    `contact-sheet.jpg`, `style_manifest.json`, `learning_check.json`, reviewer
    JSON files bound to the current script SHA, music files, MP4, and transcript.

    Use `tools/lesson-video/AGENT_RECIPE.md`, `QUALITY_FLOW.md`, and
    `FOUNDATION_VIDEO_PLAYBOOK.md`.

    ## Verification

    ```bash
    python3 tools/lesson-video/foundation_video_gate.py teaching-videos/{candidate.target_slug} --render-mp4
    python3 tools/lesson-video/lesson_release_gate.py teaching-videos/{candidate.target_slug} --check
    ```

    Stop and report if blocked. A draft is not uploadable until Umi/Codex writes
    the approval artifact.
    """)


def write_briefs(candidate: Candidate, packet: dict[str, Any], *, dry_run: bool) -> Path:
    handoff = HANDOFF_DIR / f"{today_stamp()}-foundation-video-{candidate.target_slug}.md"
    if dry_run:
        return handoff
    candidate.target_dir.mkdir(parents=True, exist_ok=True)
    write_json(candidate.target_dir / "source_packet.json", packet)
    (candidate.target_dir / "teaching_brief.md").write_text(render_teaching_brief(packet), encoding="utf-8")
    (candidate.target_dir / "visual_brief.md").write_text(render_visual_brief(packet), encoding="utf-8")
    handoff.write_text(render_handoff(candidate, packet), encoding="utf-8")
    return handoff


def run_stream(cmd: list[str], *, cwd: Path = ROOT, timeout: int | None = None) -> tuple[int, bool]:
    print(f"[run] {' '.join(cmd)}", flush=True)
    proc = subprocess.Popen(cmd, cwd=cwd, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    assert proc.stdout is not None
    saw_tool_progress = False
    try:
        for line in proc.stdout:
            if "[cc:tool]" in line:
                saw_tool_progress = True
            print(line, end="", flush=True)
        return proc.wait(timeout=timeout), saw_tool_progress
    except subprocess.TimeoutExpired:
        proc.terminate()
        print(f"[timeout] killed after {timeout}s", flush=True)
        return 124, saw_tool_progress


def run_checked(cmd: list[str], *, timeout: int | None = None) -> int:
    print(f"[run] {' '.join(cmd)}", flush=True)
    return subprocess.run(cmd, cwd=ROOT, stdin=subprocess.DEVNULL, timeout=timeout).returncode


def gate_ready(folder: Path) -> tuple[bool, dict[str, Any], list[str]]:
    audit = audit_lesson(folder)
    reasons = []
    assets = audit.get("assets") or {}
    reviewers = audit.get("reviewers") or {}
    checks = audit.get("learning_checks") or {}
    if audit.get("verdict") != "pass":
        reasons.append(f"audit verdict is {audit.get('verdict')}")
    if int(audit.get("quality_score") or 0) < 100:
        reasons.append(f"quality score {audit.get('quality_score')} < 100")
    if not assets.get("has_mp4"):
        reasons.append("missing MP4")
    if not assets.get("has_transcript"):
        reasons.append("missing transcript.txt")
    if not (folder / "contact-sheet.jpg").exists():
        reasons.append("missing contact-sheet.jpg")
    if not assets.get("style_manifest"):
        reasons.append("missing style_manifest.json")
    if checks.get("count", 0) < 3:
        reasons.append("missing at least 3 learning checks")
    if not reviewers.get("has_phd_level"):
        reasons.append("missing PhD/peer reviewer")
    if not reviewers.get("has_adversarial_student"):
        reasons.append("missing adversarial-student reviewer")
    if not reviewers.get("has_citation_checker"):
        reasons.append("missing citation/source reviewer")
    return not reasons, audit, reasons


def append_approval(rows: list[dict[str, Any]]) -> None:
    existing = read_json(APPROVAL_PATH, {})
    existing_rows = existing.get("approved_ready_to_upload", existing.get("ready_to_upload", [])) if isinstance(existing, dict) else existing
    merged = {}
    for row in existing_rows or []:
        if isinstance(row, str):
            merged[row] = {"slug": row}
        elif isinstance(row, dict) and row.get("slug"):
            merged[str(row["slug"])] = row
    for row in rows:
        merged[row["slug"]] = row
    write_json(APPROVAL_PATH, {
        "generated_at": now_utc(),
        "policy": "foundation_daily_auto_approval_clean_pass_score_100",
        "approved_ready_to_upload": sorted(merged.values(), key=lambda r: r.get("slug", "")),
    })
    print(f"[approval] wrote {APPROVAL_PATH.relative_to(ROOT)} ({len(rows)} new/updated)")


def update_state_row(state: dict[str, Any], candidate: Candidate, *, status: str, details: dict[str, Any]) -> None:
    row = state.setdefault("modules", {}).setdefault(candidate.key, {})
    row.update({
        "course": candidate.course.get("name"),
        "course_slug": candidate.course.get("slug"),
        "module_order": candidate.module.get("order"),
        "module_title": candidate.module.get("title"),
        "target_slug": candidate.target_slug,
        "status": status,
        "updated_at": now_utc(),
        "details": details,
    })
    if status in {"cc_blocked", "gate_failed", "approved"}:
        row["attempts"] = int(row.get("attempts") or 0) + 1


def commit_and_push(approved_slugs: list[str]) -> int:
    paths = [
        "public/data/lessons-manifest.json",
        str(APPROVAL_PATH.relative_to(ROOT)),
        str(STATE_PATH.relative_to(ROOT)),
    ] + [f"teaching-videos/{slug}/script.json" for slug in approved_slugs]
    existing = [p for p in paths if (ROOT / p).exists()]
    if not existing:
        print("[git] no paths to stage")
        return 0
    run_checked(["git", "add", *existing])
    run_checked(["git", "add", "-u", "teaching-videos", "public/data/lessons-manifest.json"])
    if subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=ROOT).returncode == 0:
        print("[git] no staged changes")
        return 0
    rc = run_checked(["git", "commit", "-m", f"auto: foundation video daily run {dt.datetime.now().date().isoformat()}"])
    return rc if rc else run_checked(["git", "push"])


def orchestrate(args: argparse.Namespace) -> int:
    state = load_state()
    selected = select_candidates(
        collect_candidates(include_other_foundation=args.include_other_foundation),
        state,
        limit=max(args.max_modules * 4, args.max_modules),
    )
    run_report = {"generated_at": now_utc(), "dry_run": args.dry_run, "selected": [], "approved": [], "blocked": [], "skipped": []}
    approved_rows = []

    production_count = 0
    for candidate in selected:
        if production_count >= args.max_modules:
            break
        print(f"\n[daily] candidate {candidate.target_slug}", flush=True)
        audit = resource_audit(candidate.module, network=not args.skip_network_check, timeout=args.url_timeout)
        packet = build_packet(candidate, audit)
        row = {
            "key": candidate.key,
            "target_slug": candidate.target_slug,
            "course": candidate.course.get("name"),
            "module": candidate.module.get("title"),
            "resource_errors": audit["errors"],
            "resource_warnings": audit["warnings"],
        }
        run_report["selected"].append(row)
        if audit["errors"]:
            print(f"[resource:fail] {candidate.target_slug}: {audit['errors']}", flush=True)
            if not args.dry_run:
                update_state_row(state, candidate, status="resource_failed", details={"errors": audit["errors"]})
            run_report["skipped"].append({**row, "reason": "resource_failed"})
            continue

        handoff = write_briefs(candidate, packet, dry_run=args.dry_run)
        print(f"[brief] handoff={handoff.relative_to(ROOT)} target={candidate.target_dir.relative_to(ROOT)}")
        production_count += 1
        if args.dry_run:
            continue

        if not args.no_cc:
            rc, saw_tool = run_stream([
                sys.executable, str(CC_WORKER), str(handoff),
                "--target", str(candidate.target_dir.relative_to(ROOT)),
                "--budget-usd", str(args.budget_usd),
                "--timeout-seconds", str(args.cc_timeout_seconds),
            ], timeout=args.cc_timeout_seconds + 30)
            if rc != 0 or not saw_tool:
                details = {"returncode": rc, "saw_tool_progress": saw_tool}
                update_state_row(state, candidate, status="cc_blocked", details=details)
                run_report["blocked"].append({**row, "reason": "cc_blocked", **details})
                continue
        else:
            print("[cc] skipped by --no-cc")

        if args.no_gate:
            print("[gate] skipped by --no-gate")
            continue

        gate_cmd = [sys.executable, str(FOUNDATION_GATE), str(candidate.target_dir)]
        if args.render_mp4:
            gate_cmd.append("--render-mp4")
        gate_rc = run_checked(gate_cmd, timeout=args.gate_timeout_seconds)
        release_rc = run_checked([sys.executable, str(RELEASE_GATE), str(candidate.target_dir), "--check"])
        ready, lesson_audit, reasons = gate_ready(candidate.target_dir)
        if gate_rc != 0 or release_rc != 0 or not ready:
            details = {
                "foundation_gate_rc": gate_rc,
                "release_gate_rc": release_rc,
                "ready_reasons": reasons,
                "quality_score": lesson_audit.get("quality_score"),
                "verdict": lesson_audit.get("verdict"),
            }
            update_state_row(state, candidate, status="gate_failed", details=details)
            run_report["blocked"].append({**row, "reason": "gate_failed", **details})
            continue

        approved = {
            "slug": candidate.target_slug,
            "path": str(candidate.target_dir.relative_to(ROOT)),
            "course": candidate.course.get("name"),
            "course_slug": candidate.course.get("slug"),
            "module": f"Module {candidate.module.get('order')}: {candidate.module.get('title')}",
            "quality_score": lesson_audit.get("quality_score"),
            "verdict": lesson_audit.get("verdict"),
            "approved_by": "foundation_daily_orchestrator",
            "approved_at": now_utc(),
        }
        approved_rows.append(approved)
        run_report["approved"].append(approved)
        update_state_row(state, candidate, status="approved", details={"quality_score": lesson_audit.get("quality_score")})

    if not args.dry_run:
        save_state(state)
        stamp = dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")
        write_json(RUN_ROOT / f"{stamp}-run.json", run_report)
        write_json(RUN_ROOT / "latest-run.json", run_report)

    if approved_rows and not args.dry_run:
        append_approval(approved_rows)
    should_run_upload_queue = approved_rows or not args.skip_existing_approved_upload
    if should_run_upload_queue and not args.no_upload and not args.dry_run:
        upload_rc = run_checked([sys.executable, str(YT_QUEUE), "upload", "--gate-ready", "--max", str(args.upload_max), "--privacy", args.privacy])
        if upload_rc == 0:
            run_checked([sys.executable, str(SYNC_CHANNEL), "--apply"])
            if args.auto_commit:
                return commit_and_push([row["slug"] for row in approved_rows])
        return upload_rc
    if args.dry_run:
        print(json.dumps(run_report, indent=2, ensure_ascii=False))
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Run the GIIS foundation video daily pipeline.")
    ap.add_argument("--max-modules", type=int, default=3)
    ap.add_argument("--upload-max", type=int, default=3)
    ap.add_argument("--privacy", choices=["unlisted", "private", "public"], default="unlisted")
    ap.add_argument("--budget-usd", default="3")
    ap.add_argument("--cc-timeout-seconds", type=int, default=900)
    ap.add_argument("--gate-timeout-seconds", type=int, default=1800)
    ap.add_argument("--url-timeout", type=float, default=8.0)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-cc", action="store_true")
    ap.add_argument("--no-gate", action="store_true")
    ap.add_argument("--no-upload", action="store_true")
    ap.add_argument("--skip-existing-approved-upload", action="store_true")
    ap.add_argument("--auto-commit", action="store_true")
    ap.add_argument("--skip-network-check", action="store_true")
    ap.add_argument("--no-render-mp4", dest="render_mp4", action="store_false", default=True)
    ap.add_argument("--foundation-priority-only", dest="include_other_foundation", action="store_false", default=True)
    args = ap.parse_args()
    os.chdir(ROOT)
    return orchestrate(args)


if __name__ == "__main__":
    raise SystemExit(main())
