#!/usr/bin/env python3
"""Daily GIIS foundation-video orchestrator.

This is the Umi/Codex-owned layer for the foundation-video production loop:

1. choose non-AP foundation modules from the published course JSON,
2. verify module/resource viability,
3. write a source packet + teaching/visual brief + bounded cc handoff,
4. ask Claude Code to produce the lesson folder,
5. run the foundation/release gates,
6. write the approval artifact consumed by the gated YouTube queue,
7. optionally upload and commit/push the manifest changes.

The old AP-era daily build/upload loop stays legacy-paused for new production.
This script is intentionally strict and only auto-approves clean score-100
foundation lessons.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
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
COURSE_DESIGN_ROOT = TEACHING_ROOT / "_audit" / "course-design"
STATE_PATH = RUN_ROOT / "state.json"
APPROVAL_PATH = TEACHING_ROOT / "_audit" / "release-gate" / "approved_ready_to_upload.json"
LATEST_FOUNDATION_APPROVAL_PATH = TEACHING_ROOT / "_audit" / "release-gate" / "latest-foundation-approval.json"
HANDOFF_DIR = ROOT / "umi" / "handoffs"
CC_WORKER = ROOT / "tools" / "lesson-video" / "cc_foundation_worker.py"
CC_REVIEWER = ROOT / "tools" / "lesson-video" / "cc_independent_video_reviewer.py"
FOUNDATION_GATE = ROOT / "tools" / "lesson-video" / "foundation_video_gate.py"
RELEASE_GATE = ROOT / "tools" / "lesson-video" / "lesson_release_gate.py"
PARENT_TRUST_AUDIT = ROOT / "tools" / "lesson-video" / "parent_trust_video_audit.py"
YT_QUEUE = ROOT / "tools" / "youtube-upload" / "yt_queue.py"
SYNC_CHANNEL = ROOT / "tools" / "youtube-upload" / "sync_channel.py"
EXPERT_LENS_BRIDGE = ROOT / "tools" / "lesson-video" / "expert_lens_packet.js"

sys.path.insert(0, str(ROOT / "tools" / "lesson-video"))
from audit_lessons import audit_lesson  # noqa: E402


DEFAULT_TARGET_GRADE = 10
COURSE_DESIGN_POLICY_VERSION = "g9_course_design_gate_v2"
CC_RATE_LIMIT_RC = 75
BUILD_SLIDES_BOOTSTRAP = '''\
import os
import sys
from pathlib import Path


def _find_slide_kit() -> str | None:
    """Find tools/lesson-video even when teaching-videos is a T9 symlink."""
    for raw_path in sys.path:
        if raw_path and (Path(raw_path) / "slide_kit.py").exists():
            return None

    here = Path(os.path.abspath(__file__)).parent
    for _ in range(12):
        candidate = here / "tools" / "lesson-video"
        if (candidate / "slide_kit.py").exists():
            return str(candidate)
        parent = here.parent
        if parent == here:
            break
        here = parent

    fallback = Path.home() / "giis-website" / "tools" / "lesson-video"
    if (fallback / "slide_kit.py").exists():
        return str(fallback)
    return None


_slide_kit_dir = _find_slide_kit()
if _slide_kit_dir:
    sys.path.insert(0, _slide_kit_dir)
'''

GRADE_9_COURSE_SEQUENCE = [
    "algebra-i",
    "english-i",
    "biology",
    "world-history",
    "physical-education",
    "health-wellness",
    "digital-literacy",
    "geography",
    "environmental-science",
    "geometry",
    "english-i-writing",
    "english-i-writing-focus",
    "intro-communication",
    "intro-psychology",
    "human-development",
    "health-nutrition",
    "business-technology-digital-literacy",
    "business-media-literacy",
    "intro-business-economics",
    "entrepreneurship-fundamentals",
]

HARD_BLOCKING_HOSTS = {
    "apclassroom.collegeboard.org": "restricted AP Classroom / College Board login",
    "commonlit.org": "classroom/login flow likely required",
    "khanacademy.org": "external practice/progress platform; do not make it a required GIIS path",
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
    "academy.hubspot.com": "free but login/certificate flow",
    "learndigital.withgoogle.com": "free but login/certificate flow",
}

DEFAULT_DEPARTMENT_BY_SUBJECT = {
    "math": "Mathematics",
    "science": "Science",
    "literature": "English",
    "social_studies": "Social Studies",
    "health_pe": "Physical Education",
    "general": "Electives",
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


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


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


def course_grade(course: dict[str, Any]) -> int | None:
    try:
        return int(course.get("gradeLevel"))
    except (TypeError, ValueError):
        return None


def grade_course_sequence(target_grade: int) -> list[str]:
    if target_grade == 9:
        return GRADE_9_COURSE_SEQUENCE
    return []


def course_priority(course: dict[str, Any], *, target_grade: int = DEFAULT_TARGET_GRADE) -> tuple[int, int, str]:
    slug = str(course.get("slug") or "")
    grade = course_grade(course)
    grade_bucket = 0 if grade == target_grade else 1
    sequence = grade_course_sequence(target_grade)
    try:
        sequence_index = sequence.index(slug)
    except ValueError:
        sequence_index = len(sequence) + 1
    return (grade_bucket, sequence_index, slug)


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


def course_design_path(course: dict[str, Any]) -> Path:
    return COURSE_DESIGN_ROOT / f"{course.get('slug')}.json"


def expected_module_range(course: dict[str, Any]) -> tuple[int, int]:
    try:
        credits = float(course.get("credits") or 0)
    except (TypeError, ValueError):
        credits = 0
    if credits >= 0.95:
        return (12, 16)
    if credits >= 0.45:
        return (6, 10)
    return (1, 20)


def course_design_review(course_file: Path, course: dict[str, Any], *, target_grade: int) -> dict[str, Any]:
    modules = sorted(course.get("modules") or [], key=lambda m: int(m.get("order") or 0))
    orders = [int(m.get("order") or 0) for m in modules]
    expected_orders = list(range(1, len(modules) + 1))
    min_modules, max_modules = expected_module_range(course)
    errors: list[str] = []
    warnings: list[str] = []

    if is_ap_course(course):
        errors.append("course is AP/authorization-sensitive; foundation video production is closed for AP")
    if course_grade(course) != target_grade:
        errors.append(f"course gradeLevel {course.get('gradeLevel')} does not match target grade {target_grade}")
    if not course.get("name") or not course.get("slug"):
        errors.append("course is missing name or slug")
    if not course.get("description"):
        errors.append("course is missing a description")
    if not course.get("department"):
        errors.append("course is missing department metadata")
    if len(modules) < min_modules or len(modules) > max_modules:
        errors.append(f"module count {len(modules)} is outside expected range {min_modules}-{max_modules} for {course.get('credits')} credits")
    if orders != expected_orders:
        errors.append(f"module orders must be consecutive 1..{len(modules)}; found {orders[:20]}")

    seen_titles: set[str] = set()
    module_checks = []
    for module in modules:
        order = int(module.get("order") or 0)
        title = str(module.get("title") or "").strip()
        module_errors = []
        module_warnings = []
        if not title:
            module_errors.append("missing title")
        title_key = title.lower()
        if title_key and title_key in seen_titles:
            module_errors.append(f"duplicate module title: {title}")
        seen_titles.add(title_key)
        for key in ("objectives", "assignment"):
            if not str(module.get(key) or "").strip():
                module_errors.append(f"missing {key}")
        resource_keys = [
            key for key, value in module.items()
            if key.endswith("Url") and isinstance(value, str) and value.startswith(("http://", "https://"))
        ]
        if not resource_keys:
            module_errors.append("missing external learning resource URL")
        elif "readingUrl" not in resource_keys:
            module_warnings.append("missing readingUrl")
        if not module.get("estimatedHrs"):
            module_errors.append("missing estimatedHrs")
        if len(str(module.get("assignment") or "")) < 80:
            module_warnings.append("assignment prompt is short; review for rigor")
        for message in module_errors:
            errors.append(f"module {order}: {message}")
        for message in module_warnings:
            warnings.append(f"module {order}: {message}")
        module_checks.append({
            "order": order,
            "title": title,
            "resource_url_count": len(resource_keys),
            "errors": module_errors,
            "warnings": module_warnings,
        })

    status = "pass" if not errors else "blocked"
    return {
        "generated_at": now_utc(),
        "policy": COURSE_DESIGN_POLICY_VERSION,
        "status": status,
        "target_grade": target_grade,
        "course": {
            "name": course.get("name"),
            "slug": course.get("slug"),
            "department": course.get("department"),
            "credits": course.get("credits"),
            "gradeLevel": course.get("gradeLevel"),
            "module_count": len(modules),
            "source": str(course_file.relative_to(ROOT)),
            "source_sha256": file_sha256(course_file),
        },
        "decision": "course design is reasonable for video-series production" if status == "pass" else "course design needs repair before video-series production",
        "errors": errors,
        "warnings": warnings,
        "module_checks": module_checks,
    }


def default_course_description(course: dict[str, Any]) -> str:
    name = str(course.get("name") or "This course")
    area = subject_area(course)
    area_label = DEFAULT_DEPARTMENT_BY_SUBJECT.get(area, "academic")
    return (
        f"{name} is a Grade {course.get('gradeLevel') or ''} {area_label} course "
        "organized as a self-paced foundation sequence. Students build core "
        "vocabulary, practice module skills, complete written assignments, and "
        "prepare for later coursework through repeated review and application."
    ).replace("Grade  ", "secondary")


def default_module_objectives(course: dict[str, Any], module: dict[str, Any]) -> str:
    title = str(module.get("title") or "this module")
    return (
        f"Explain the core ideas and vocabulary of {title}; apply the module skill "
        "to guided examples; connect the concept to the course sequence; and "
        "prepare evidence of understanding through practice and written work."
    )


def default_module_assignment(course: dict[str, Any], module: dict[str, Any]) -> str:
    title = str(module.get("title") or "this module")
    return (
        f"Create a structured study response for {title}. Include: (1) a short "
        "summary of the key concept, (2) vocabulary or formulas that matter, "
        "(3) two worked examples or text-based evidence notes, (4) one common "
        "mistake and how to avoid it, and (5) a short reflection explaining what "
        "you still need to practice."
    )


def default_estimated_hours(course: dict[str, Any], module_count: int) -> int:
    try:
        credits = float(course.get("credits") or 0)
    except (TypeError, ValueError):
        credits = 0
    total_hours = 72 if credits >= 0.95 else 36 if credits >= 0.45 else max(module_count * 3, 12)
    return max(1, round(total_hours / max(module_count, 1)))


def repair_course_design(course_file: Path, course: dict[str, Any], review: dict[str, Any], *, dry_run: bool) -> dict[str, Any]:
    """Repair safe structural course-design issues before video production.

    This deliberately avoids fabricating external resource URLs, changing AP or
    grade placement, adding/deleting modules, or resolving duplicate/blank titles.
    Those remain blocked because they need real academic judgment.
    """
    repaired = json.loads(json.dumps(course, ensure_ascii=False))
    modules = repaired.get("modules") or []
    changes: list[str] = []

    if not repaired.get("description"):
        repaired["description"] = default_course_description(repaired)
        changes.append("added course description")
    if not repaired.get("department"):
        repaired["department"] = DEFAULT_DEPARTMENT_BY_SUBJECT.get(subject_area(repaired), "Electives")
        changes.append("added department metadata")

    default_hours = default_estimated_hours(repaired, len(modules))
    for module in modules:
        order = module.get("order")
        title = module.get("title") or f"Module {order}"
        if not str(module.get("objectives") or "").strip() and title:
            module["objectives"] = default_module_objectives(repaired, module)
            changes.append(f"module {order}: added objectives")
        if not str(module.get("assignment") or "").strip() and title:
            module["assignment"] = default_module_assignment(repaired, module)
            changes.append(f"module {order}: added assignment")
        if not module.get("estimatedHrs"):
            module["estimatedHrs"] = default_hours
            changes.append(f"module {order}: added estimatedHrs")

    blocked_after_repair = [
        message for message in review.get("errors") or []
        if (
            "missing a description" not in message
            and "missing department metadata" not in message
            and "missing objectives" not in message
            and "missing assignment" not in message
            and "missing estimatedHrs" not in message
        )
    ]
    if changes and not dry_run:
        write_json(course_file, repaired)
    return {
        "changed": bool(changes),
        "changes": changes,
        "blocked_after_repair": blocked_after_repair,
        "course": repaired,
    }


def ensure_course_design_review(
    course_file: Path,
    course: dict[str, Any],
    *,
    target_grade: int,
    dry_run: bool,
    repair: bool,
) -> dict[str, Any]:
    path = course_design_path(course)
    source_sha = file_sha256(course_file)
    existing = read_json(path, {})
    if (
        existing.get("policy") == COURSE_DESIGN_POLICY_VERSION
        and existing.get("target_grade") == target_grade
        and ((existing.get("course") or {}).get("source_sha256") == source_sha)
    ):
        return existing
    review = course_design_review(course_file, course, target_grade=target_grade)
    repair_report = {"changed": False, "changes": [], "blocked_after_repair": []}
    if repair and review.get("status") != "pass":
        repair_report = repair_course_design(course_file, course, review, dry_run=dry_run)
        if repair_report["changed"]:
            print(
                f"[course-design:repair{'-dry-run' if dry_run else ''}] "
                f"{course.get('slug')} changes={len(repair_report['changes'])}",
                flush=True,
            )
            course.clear()
            course.update(repair_report["course"])
            review = course_design_review(course_file, course, target_grade=target_grade)
    review["repair"] = repair_report
    if not dry_run:
        write_json(path, review)
        print(f"[course-design] wrote {path.relative_to(ROOT)} status={review['status']}", flush=True)
    else:
        print(f"[course-design:dry-run] {course.get('slug')} status={review['status']}", flush=True)
    return review


def lesson_complete_or_uploaded(course: dict[str, Any], module: dict[str, Any], slug: str) -> bool:
    folder = TEACHING_ROOT / slug
    script = read_json(folder / "script.json", {}) if folder.exists() else {}
    if (script.get("youtube") or {}).get("video_id"):
        return True

    if folder.exists() and (folder / "script.json").exists():
        # A ready local folder is not complete until it is either uploaded or
        # carried into the approval artifact. The orchestrator can approve it
        # without rerunning cc, so keep it selectable.
        pass

    course_name = str(course.get("name") or "").strip().lower()
    order = int(module.get("order") or 0)
    module_prefix = f"module {order}:"
    for existing in sorted(TEACHING_ROOT.iterdir()):
        if existing == folder or not existing.is_dir() or existing.name.startswith("_"):
            continue
        existing_script = read_json(existing / "script.json", {})
        if not existing_script:
            continue
        existing_course = str(existing_script.get("course") or "").strip().lower()
        existing_module = str(existing_script.get("module") or "").strip().lower()
        if existing_course != course_name or not existing_module.startswith(module_prefix):
            continue
        if (existing_script.get("youtube") or {}).get("video_id"):
            return True

    manifest = read_json(ROOT / "public" / "data" / "lessons-manifest.json", {})
    lessons = manifest.get("lessons") or [row for rows in (manifest.get("by_course") or {}).values() for row in rows]
    course_slug = str(course.get("slug"))
    return any(
        row.get("course_slug") == course_slug and int(row.get("module_number") or 0) == order
        for row in lessons
    )


def collect_candidates(*, include_other_foundation: bool = True, target_grade: int = DEFAULT_TARGET_GRADE) -> list[Candidate]:
    out = []
    sequence = grade_course_sequence(target_grade)
    for course_file, course in sorted(load_courses(), key=lambda row: course_priority(row[1], target_grade=target_grade)):
        if is_ap_course(course):
            continue
        if course_grade(course) != target_grade:
            continue
        if not include_other_foundation and course.get("slug") not in sequence:
            continue
        for module in sorted(course.get("modules") or [], key=lambda m: int(m.get("order") or 0)):
            if not module.get("title"):
                continue
            slug = target_slug(course, module)
            if lesson_complete_or_uploaded(course, module, slug):
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
    if any(word in text for word in ["computer", "programming", "digital literacy", "technology"]):
        return "computer_science"
    if any(word in text for word in ["english", "literature", "composition", "writing"]):
        return "literature"
    if any(word in text for word in ["psychology", "sociology"]):
        return "psychology"
    if any(word in text for word in ["business", "marketing", "finance", "entrepreneur", "media literacy"]):
        return "business"
    if any(word in text for word in ["history", "government", "civics", "economics", "geography", "social"]):
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
        "psychology": "en-US-BrianNeural",
        "computer_science": "en-US-GuyNeural",
        "business": "en-US-RogerNeural",
        "health_pe": "en-US-JennyNeural",
    }.get(area, "en-US-AriaNeural")


def expert_lens_for(candidate: Candidate) -> dict[str, Any]:
    """Return the same Expert Lens shown in the Learn Portal.

    The Learn Portal owns the lens logic in JavaScript. The video pipeline calls
    that helper through a small Node bridge so parent-facing syllabus guidance
    and lesson-video production cannot drift into two separate standards.
    """
    order = int(candidate.module.get("order") or 0)
    rel_course = str(candidate.course_file.relative_to(ROOT))
    proc = subprocess.run(
        ["node", str(EXPERT_LENS_BRIDGE), rel_course, str(order)],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "expert lens lookup failed").strip())
    lens = json.loads(proc.stdout)
    for key in ("insight", "watchFor", "transfer"):
        if not str(lens.get(key) or "").strip():
            raise RuntimeError(f"expert lens missing {key} for {candidate.key}")
    return sanitize_expert_lens_for_video(lens)


def video_safe_lens_text(value: str) -> str:
    text = str(value or "")
    replacements = [
        (r"\bAP\s+Computer\s+Science\b", "advanced computer science"),
        (r"\bAP\s+Human\s+Geography\b", "advanced geography"),
        (r"\bAP[-\s]+level\b", "advanced"),
        (r"\bAP\b", "advanced coursework"),
        (r"\bcollege-level\s+STEM\s+work\b", "evidence-based science work"),
        (r"\bcollege-level\s+science\s+work\b", "evidence-based science work"),
        (r"\bcollege-level\s+science\s+course\b", "foundational science course"),
        (r"\bcollege-level\b", "foundational"),
        (r"\bcareer-ready\b", "real-world"),
        (r"\bcollege-ready\b", "prepared for future coursework"),
    ]
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def sanitize_expert_lens_for_video(lens: dict[str, Any]) -> dict[str, Any]:
    clean = dict(lens)
    changed = False
    for key in ("insight", "watchFor", "transfer"):
        before = str(clean.get(key) or "")
        after = video_safe_lens_text(before)
        clean[key] = after
        changed = changed or after != before
    if changed:
        clean["video_safety_notes"] = [
            "Authorization-sensitive pathway wording was softened for the foundation video handoff."
        ]
    return clean


def source_label_for_ref(ref: dict[str, Any]) -> str:
    note = str(ref.get("note") or "").strip()
    if note:
        for sep in (" — ", " - ", ":"):
            if sep in note:
                label = note.split(sep, 1)[0].strip()
                if label:
                    return label
        first_words = " ".join(note.split()[:3]).strip()
        if ref.get("key") == "readingUrl" and first_words:
            return first_words
    host = str(ref.get("host") or "").removeprefix("www.")
    known = {
        "khanacademy.org": "Khan Academy",
        "openstax.org": "OpenStax",
        "ted.com": "TED",
        "ed.ted.com": "TED-Ed",
        "cdc.gov": "CDC",
        "nih.gov": "NIH",
        "nimh.nih.gov": "NIMH",
        "nida.nih.gov": "NIDA",
        "apa.org": "APA",
        "samhsa.gov": "SAMHSA",
        "youtube.com": "Assigned video",
    }
    return known.get(host, host or "Assigned source")


def source_ref_allowed_for_video(ref: dict[str, Any]) -> bool:
    """Return whether a resource should be named inside the produced video.

    Course JSON may include helpful external practice/video links for a student
    portal, but foundation lesson videos should not send students to external
    practice platforms or third-party videos. Keep video-visible source labels
    to textbooks and official institutional/government references.
    """
    host = str(ref.get("host") or "").removeprefix("www.").lower()
    key = str(ref.get("key") or "")
    if host in HARD_BLOCKING_HOSTS:
        return False
    if key == "readingUrl":
        return True
    if host in {"openstax.org", "ted.com", "ed.ted.com", "cdc.gov", "nih.gov", "nimh.nih.gov", "nida.nih.gov", "apa.org", "samhsa.gov"}:
        return True
    return False


def source_alignment_from_audit(audit: dict[str, Any]) -> dict[str, Any]:
    refs = audit.get("refs") or []
    visible_sources: list[dict[str, Any]] = []
    seen: set[str] = set()
    for key in ("readingUrl", "practiceUrl", "videoUrl"):
        for ref in refs:
            if ref.get("key") != key:
                continue
            if not source_ref_allowed_for_video(ref):
                continue
            label = source_label_for_ref(ref)
            dedupe_key = f"{key}:{label.lower()}"
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            visible_sources.append({
                "key": key,
                "label": label,
                "host": ref.get("host"),
                "note": ref.get("note") or "",
                "visibility_requirement": "show this source label on at least one concept, application, recap, or path slide; do not show or read the raw URL",
            })
    return {
        "policy": "visible_source_alignment_v1",
        "required_visible_sources": visible_sources[:2],
        "all_sources": visible_sources,
        "requirements": [
            "At least one required source label must be visible on-slide, not only in narration.",
            "The path/next-action slide should name the assigned textbook/official source and the Learn Portal assignment; do not direct students to external practice platforms or external videos.",
            "Do not display raw URLs in the video.",
        ],
    }


def build_packet(candidate: Candidate, audit: dict[str, Any]) -> dict[str, Any]:
    course = candidate.course
    module = candidate.module
    area = subject_area(course)
    title = module.get("title")
    order = int(module.get("order") or 0)
    expert_lens = expert_lens_for(candidate)
    source_alignment = source_alignment_from_audit(audit)
    return {
        "generated_at": now_utc(),
        "policy": "foundation_daily_v2_expert_lens",
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
        "expert_lens": expert_lens,
        "source_alignment": source_alignment,
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
            "Use the Expert Lens as the lesson's intellectual spine: Big idea -> concept/worked example, Watch for -> misconception/pause, Transfer -> application/path.",
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
    lens = packet["expert_lens"]
    source_alignment = packet.get("source_alignment") or {}
    refs = packet["resources"]["refs"]
    required_sources = source_alignment.get("required_visible_sources") or []
    return "\n".join([
        f"# Teaching Brief: {course['name']} Module {module['order']} - {module['title']}",
        "",
        f"Source: `{packet['source_of_truth']}`",
        f"Objectives: {module.get('objectives') or 'N/A'}",
        f"Assignment tie-in: {module.get('assignment') or 'N/A'}",
        "",
        "## Expert Lens",
        "",
        f"- Big idea: {lens['insight']}",
        f"- Watch for: {lens['watchFor']}",
        f"- Transfer: {lens['transfer']}",
        "",
        "Use this as the lesson's intellectual spine. The concept/worked example should make the big idea visible, the misconception/pause should test the watch-for risk, and the application/path should show the transfer without overclaiming.",
        "",
        "## Source Alignment",
        "",
        "Required visible source labels:",
        *([
            f"- {source['label']} ({source['key']}): {source.get('note') or source.get('host')}"
            for source in required_sources
        ] or ["- No required visible source labels were available; explain source limitations in the review artifact."]),
        "",
        "At least one required source label must appear on-slide in the concept, application, recap, or path section. Do not display or narrate raw URLs.",
        "Do not send students to external practice platforms or third-party videos from the narration or path slide; use textbook review questions and the Learn Portal assignment as the next action.",
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
    lens = packet["expert_lens"]
    source_alignment = packet.get("source_alignment") or {}
    source_labels = ", ".join(
        source.get("label", "")
        for source in source_alignment.get("required_visible_sources", [])
        if source.get("label")
    ) or "the assigned reading/practice source"
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

    Expert Lens:
    - Big idea: {lens['insight']}
    - Watch for: {lens['watchFor']}
    - Transfer: {lens['transfer']}

    Source alignment:
    - Show a small, readable source label on at least one concept/application/path slide: {source_labels}.
    - Use source names, not raw URLs.

    Requirements:
    - Contact sheet must look varied at thumbnail size.
    - Pause and answer reveal slides must be visually distinct.
    - Use diagrams/tables/worked examples instead of decorative card grids.
    - Visuals must make the Expert Lens inspectable, not just decorative.
    - Source labels must be visible enough for a parent to see what the lesson aligns to.
    - Generated images are allowed only for low-precision hooks or thumbnails.
    - Precision content must be deterministic in build_slides.py.
    """)


def render_physics_helper_contract(course_name: str) -> str:
    if "physics" not in course_name.lower():
        return ""
    return textwrap.dedent("""\
    ## Physics Diagram Helper Contract

    For Physics Fundamentals modules, do not rebuild common precision diagrams
    from scratch unless the helper cannot express the concept. After the
    `slide_kit` import, prefer the data-first Physics wrapper and deterministic
    diagram helpers, which live in the same directory as `slide_kit.py`:

    ```python
    from physics_slide_kit import PhysicsSlides
    from physics_diagrams import (
        arrow,
        draw_circular_motion_diagram,
        draw_doppler_wavefronts,
        draw_interference_panel,
        draw_sine_wave,
        draw_step_rows,
        draw_wave_property_diagram,
    )

    physics = PhysicsSlides(deck)
    ```

    Prefer `physics.concept_cards`, `physics.formula_cards`,
    `physics.worked_trace`, `physics.answer_trace`,
    `physics.modeling_pause`, `physics.application_grid`,
    `physics.wave_properties`, `physics.doppler_diagram`,
    `physics.interference_diagram`, and `physics.circular_motion_diagram`
    before writing custom geometry.

    Use lower-level helpers for custom annotations:
    - waves / wavelength / amplitude: `draw_sine_wave` or `draw_wave_property_diagram`
    - Doppler sketches: `draw_doppler_wavefronts`
    - interference/cancellation: `draw_interference_panel`
    - circular motion / orbit force diagrams: `draw_circular_motion_diagram`
    - worked example rows: `draw_step_rows`
    - labeled force/vector arrows: `arrow`

    Keep custom PIL code only for module-specific details. This should make
    `build_slides.py` mostly deck calls, text, numeric values, and 1-2 custom
    callbacks instead of hundreds of lines of repeated geometry. If a helper is
    not enough, compose it with small custom annotations; do not copy a previous
    module's entire `build_slides.py`.

    To reduce production latency, read at most one nearby completed Physics
    lesson as a reference. Do not scan many old generated `build_slides.py`
    files unless the gate fails and you need a specific pattern.
    """)


FOUNDATION_WORKER_FAST_PATH = """\
## Worker Fast Path

This handoff is the production contract. For normal production, do not open
global playbooks or broad-scan old generated lessons. Read only:

1. this handoff,
2. `source_packet.json`,
3. `teaching_brief.md`,
4. `visual_brief.md`,
5. one nearby completed lesson only when a local formatting example is needed.

Open `tools/lesson-video/AGENT_RECIPE.md`, `QUALITY_FLOW.md`, or
`FOUNDATION_VIDEO_PLAYBOOK.md` only if the gate behavior conflicts with this
handoff or a required field is ambiguous. Keep the lesson to one coherent
5-7 minute foundation video; do not spend time inventing decorative systems,
searching the repo broadly, or re-deriving the common production contract.
"""


def render_handoff(candidate: Candidate, packet: dict[str, Any]) -> str:
    course = packet["course"]
    module = packet["module"]
    lens = packet["expert_lens"]
    source_alignment = packet.get("source_alignment") or {}
    required_sources = "\n".join(
        f"    - {source.get('label')} ({source.get('key')}): {source.get('note') or source.get('host')}"
        for source in source_alignment.get("required_visible_sources", [])
    ) or "    - No required source labels found; write the source review as blocked."
    physics_helper_contract = render_physics_helper_contract(course["name"]).rstrip()
    physics_helper_section = f"\n\n{textwrap.indent(physics_helper_contract, '    ')}" if physics_helper_contract else ""
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
    `contact-sheet.jpg`, `style_manifest.json`, `learning_check.json`, standard
    production reviewer JSON files bound to the current script SHA,
    `_review_expert_lens.json`, music files, MP4, and transcript. Do not write
    `_review_independent_pass.json` or `_review_source_alignment.json`; those
    are written by the separate independent reviewer wrapper after production.

    Required production reviewer JSON files:
    - `_review_A.json` with reviewer containing `peer` or `PhD`, verdict
      `pass`, current `script_sha`, and math/content correctness findings.
    - `_review_B.json` with reviewer containing `student` or `adversarial`,
      verdict `pass`, current `script_sha`, and student-clarity /
      misconception findings.
    - `_review_C.json` with reviewer containing `citation` or `source`,
      verdict `pass`, current `script_sha`, source-label findings, raw-URL
      check, and public-claims risk check.

    These three files are not release approval. They are the production-time
    reviewer set required by `audit_lessons.py`; the independent wrapper still
    owns `_review_independent_pass.json` and `_review_source_alignment.json`.

    ## `build_slides.py` Bootstrap Contract

    `teaching-videos/` is a symlink to T9 storage, so do not use
    `Path(__file__).resolve().parents[...]` to find the repo root. It resolves
    through `/Volumes/T9-Active` and breaks `slide_kit` imports. Start
    `build_slides.py` with this exact bootstrap, then import from `slide_kit`:

    ```python
{textwrap.indent(BUILD_SLIDES_BOOTSTRAP.rstrip(), "    ")}
    ```

    Use repo-relative assets through the discovered `slide_kit` path or the
    lesson cwd. Do not run broad filesystem searches to locate `slide_kit`.

{textwrap.indent(FOUNDATION_WORKER_FAST_PATH.rstrip(), "    ")}
{physics_helper_section}

    ## Expert Lens Contract

    The lesson must visibly use the Learn Portal Expert Lens:

    - Big idea: {lens['insight']}
    - Watch for: {lens['watchFor']}
    - Transfer: {lens['transfer']}

    Requirements:
    - Put the big idea into the concept/worked-example spine.
    - Turn the watch-for item into the misconception and/or pause-check trap.
    - Use the transfer item in the application/path slide without making career,
      admissions, accreditation, AP, or outcome guarantees.
    - Reviewer A must explicitly assess Expert Lens alignment.
    - Reviewer B must test whether the watch-for misconception would still fool a student.
    - Reviewer C must flag any unsupported source, credential, health, legal, or outcome claim.
    - Write `_review_expert_lens.json` with `reviewer`, `verdict`,
      `script_sha`, `insight_sections`, `watchFor_sections`, and
      `transfer_sections`.

    ## Visible Source Alignment Contract

    Required source labels:
{required_sources}

    Requirements:
    - Put at least one required source label visibly on a concept, application,
      recap, or path slide.
    - Use source names, not raw URLs.
    - The path slide should tell the student which assigned textbook/official
      source and Learn Portal assignment to use next.
    - Do not direct students to external practice platforms or third-party
      videos from the narration or path slide.
    - Do not imply the source endorses GIIS or guarantees outcomes.

    The common production rules are summarized in this handoff. Use the global
    docs only as fallback if a local gate result conflicts with this handoff.

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


def run_parent_trust_audit(approved_rows: list[dict[str, Any]]) -> int:
    paths = [str(row.get("path") or "") for row in approved_rows if row.get("path")]
    if not paths:
        return 0
    report_name = f"{today_stamp()}-foundation-parent-trust"
    return run_checked([sys.executable, str(PARENT_TRUST_AUDIT), "--report-name", report_name, *paths])


def find_mp4(folder: Path) -> Path | None:
    canonical = folder / f"{folder.name.replace('-', '_')}.mp4"
    if canonical.exists():
        return canonical
    mp4s = sorted(folder.glob("*.mp4"))
    return mp4s[0] if len(mp4s) == 1 else None


def valid_mp4(path: Path | None) -> bool:
    if not path or not path.exists():
        return False
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(path),
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if result.returncode != 0:
            return False
        return float(result.stdout.strip()) > 0
    except Exception:
        return False


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
    elif not valid_mp4(find_mp4(folder)):
        reasons.append("invalid MP4 (ffprobe failed)")
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
    if not reviewers.get("has_expert_lens_alignment"):
        reasons.append("missing Expert Lens alignment reviewer")
    if not reviewers.get("has_independent_second_pass"):
        reasons.append("missing independent second-pass reviewer")
    if not reviewers.get("has_source_alignment"):
        reasons.append("missing source-alignment reviewer")
    return not reasons, audit, reasons


def is_clean_approval_row(row: Any) -> bool:
    if not isinstance(row, dict):
        return False
    required = ("slug", "path", "quality_score", "verdict", "approved_by", "approved_at")
    if any(not row.get(field) for field in required):
        return False
    if row.get("verdict") != "pass":
        return False
    try:
        return int(row.get("quality_score")) >= 100
    except (TypeError, ValueError):
        return False


def append_approval(rows: list[dict[str, Any]]) -> None:
    existing = read_json(APPROVAL_PATH, {})
    existing_rows = existing.get("approved_ready_to_upload", existing.get("ready_to_upload", [])) if isinstance(existing, dict) else existing
    merged = {}
    for row in existing_rows or []:
        if is_clean_approval_row(row):
            merged[str(row["slug"])] = row
    for row in rows:
        merged[row["slug"]] = row
    payload = {
        "generated_at": now_utc(),
        "policy": "foundation_daily_auto_approval_clean_pass_score_100",
        "approved_ready_to_upload": sorted(merged.values(), key=lambda r: r.get("slug", "")),
    }
    write_json(APPROVAL_PATH, payload)
    write_json(LATEST_FOUNDATION_APPROVAL_PATH, payload)
    print(f"[approval] wrote {APPROVAL_PATH.relative_to(ROOT)} ({len(rows)} new/updated)")


def approval_row(candidate: Candidate, lesson_audit: dict[str, Any]) -> dict[str, Any]:
    return {
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
    if TEACHING_ROOT.is_symlink():
        # teaching-videos lives on an external volume (T9) and is intentionally not
        # tracked here. The lesson artifacts must NOT be staged directly from the
        # external artifact tree, but the website manifest lives in
        # the main repo and must still be committed/pushed so the site reflects newly
        # uploaded videos. Stage ONLY the manifest by exact path.
        manifest = "public/data/lessons-manifest.json"
        if not (ROOT / manifest).exists():
            print("[git] manifest missing; nothing to commit (T9-backed teaching-videos ignored)")
            return 0
        run_checked(["git", "add", "--", manifest])
        if subprocess.run(["git", "diff", "--cached", "--quiet", "--", manifest], cwd=ROOT).returncode == 0:
            print("[git] no manifest changes to commit (T9-backed teaching-videos ignored)")
            return 0
        rc = run_checked(
            ["git", "commit", "-m", f"auto: sync lessons manifest {dt.datetime.now().date().isoformat()}", "--", manifest]
        )
        return rc if rc else run_checked(["git", "push"])
    paths = [
        "public/data/lessons-manifest.json",
        str(APPROVAL_PATH.relative_to(ROOT)),
        str(STATE_PATH.relative_to(ROOT)),
        str(COURSE_DESIGN_ROOT.relative_to(ROOT)),
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
        collect_candidates(include_other_foundation=args.include_other_foundation, target_grade=args.target_grade),
        state,
        limit=max(args.max_modules * 4, args.max_modules),
    )
    run_report = {
        "generated_at": now_utc(),
        "dry_run": args.dry_run,
        "target_grade": args.target_grade,
        "upload_strategy": "video_first_no_caption_thumbnail_sync_cleanup_with_playlist"
        if not args.full_upload_followups
        else "full_upload_with_caption_thumbnail_playlist_sync_cleanup",
        "course_sequence": grade_course_sequence(args.target_grade),
        "selected": [],
        "course_design": [],
        "approved": [],
        "blocked": [],
        "skipped": [],
    }
    approved_rows = []
    reviewed_courses: dict[str, dict[str, Any]] = {}
    blocked_courses: set[str] = set()

    production_count = 0
    for candidate in selected:
        if production_count >= args.max_modules:
            break
        print(f"\n[daily] candidate {candidate.target_slug}", flush=True)
        course_slug = str(candidate.course.get("slug") or "")
        if course_slug in blocked_courses:
            run_report["skipped"].append({
                "key": candidate.key,
                "target_slug": candidate.target_slug,
                "course": candidate.course.get("name"),
                "module": candidate.module.get("title"),
                "reason": "course_design_failed",
            })
            continue
        design = reviewed_courses.get(course_slug)
        if not design:
            design = ensure_course_design_review(
                candidate.course_file,
                candidate.course,
                target_grade=args.target_grade,
                dry_run=args.dry_run,
                repair=not args.no_course_design_repair,
            )
            reviewed_courses[course_slug] = design
            run_report["course_design"].append({
                "course": candidate.course.get("name"),
                "course_slug": course_slug,
                "status": design.get("status"),
                "errors": design.get("errors") or [],
                "warnings": design.get("warnings") or [],
                "repair": design.get("repair") or {},
                "path": str(course_design_path(candidate.course).relative_to(ROOT)),
            })
        if design.get("status") != "pass":
            blocked_courses.add(course_slug)
            print(f"[course-design:fail] {course_slug}: {design.get('errors')}", flush=True)
            if not args.dry_run:
                update_state_row(state, candidate, status="course_design_failed", details={
                    "errors": design.get("errors") or [],
                    "warnings": design.get("warnings") or [],
                })
            run_report["skipped"].append({
                "key": candidate.key,
                "target_slug": candidate.target_slug,
                "course": candidate.course.get("name"),
                "module": candidate.module.get("title"),
                "reason": "course_design_failed",
                "errors": design.get("errors") or [],
            })
            continue

        if candidate.target_dir.exists() and (candidate.target_dir / "script.json").exists():
            ready, lesson_audit, reasons = gate_ready(candidate.target_dir)
            if ready:
                approved = approval_row(candidate, lesson_audit)
                approved_rows.append(approved)
                run_report["approved"].append(approved)
                if not args.dry_run:
                    update_state_row(state, candidate, status="approved", details={
                        "quality_score": lesson_audit.get("quality_score"),
                        "source": "existing_gate_ready",
                    })
                print(f"[ready-existing] {candidate.target_slug} score={lesson_audit.get('quality_score')}", flush=True)
                # Existing gate-ready lessons still consume this run's bounded
                # module slot; otherwise a catch-up upload can unexpectedly
                # probe or block a second module after satisfying max-modules.
                production_count += 1
                continue

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
                "--model", str(args.cc_model),
                "--budget-usd", str(args.budget_usd),
                "--timeout-seconds", str(args.cc_timeout_seconds),
            ], timeout=args.cc_timeout_seconds + 30)
            if rc != 0 or not saw_tool:
                details = {"returncode": rc, "saw_tool_progress": saw_tool}
                update_state_row(state, candidate, status="cc_blocked", details=details)
                reason = "cc_rate_limited" if rc == CC_RATE_LIMIT_RC else "cc_blocked"
                run_report["blocked"].append({**row, "reason": reason, **details})
                if rc == CC_RATE_LIMIT_RC:
                    print("[cc:rate-limit] stopping batch before selecting more modules", flush=True)
                    break
                continue
        else:
            print("[cc] skipped by --no-cc")

        if not args.no_independent_review and not args.no_cc:
            rc, saw_tool = run_stream([
                sys.executable, str(CC_REVIEWER), str(candidate.target_dir.relative_to(ROOT)),
                "--model", str(args.review_model),
                "--budget-usd", str(args.review_budget_usd),
                "--timeout-seconds", str(args.review_timeout_seconds),
            ], timeout=args.review_timeout_seconds + 30)
            if rc != 0 or not saw_tool:
                details = {"returncode": rc, "saw_tool_progress": saw_tool}
                update_state_row(state, candidate, status="review_blocked", details=details)
                reason = "cc_rate_limited" if rc == CC_RATE_LIMIT_RC else "independent_review_blocked"
                run_report["blocked"].append({**row, "reason": reason, **details})
                if rc == CC_RATE_LIMIT_RC:
                    print("[cc-review:rate-limit] stopping batch before selecting more modules", flush=True)
                    break
                continue
        elif args.no_independent_review:
            print("[independent-review] skipped by --no-independent-review")

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

        approved = approval_row(candidate, lesson_audit)
        approved_rows.append(approved)
        run_report["approved"].append(approved)
        update_state_row(state, candidate, status="approved", details={"quality_score": lesson_audit.get("quality_score")})

    if not args.dry_run:
        save_state(state)
        stamp = dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")
        write_json(RUN_ROOT / f"{stamp}-run.json", run_report)
        write_json(RUN_ROOT / "latest-run.json", run_report)

    if approved_rows and not args.dry_run and not args.no_parent_trust_audit:
        parent_trust_rc = run_parent_trust_audit(approved_rows)
        if parent_trust_rc != 0:
            run_report["blocked"].append({
                "reason": "parent_trust_audit_failed",
                "approved_slugs": [row.get("slug") for row in approved_rows],
            })
            write_json(RUN_ROOT / f"{stamp}-run.json", run_report)
            write_json(RUN_ROOT / "latest-run.json", run_report)
            print("[parent-trust] FIX_FIRST; stopping before approval artifact/upload", flush=True)
            return parent_trust_rc
    elif args.no_parent_trust_audit:
        print("[parent-trust] skipped by --no-parent-trust-audit")

    if approved_rows and not args.dry_run:
        append_approval(approved_rows)
    should_run_upload_queue = approved_rows or not args.skip_existing_approved_upload
    if should_run_upload_queue and not args.no_upload and not args.dry_run:
        upload_cmd = [sys.executable, str(YT_QUEUE), "upload", "--gate-ready", "--max", str(args.upload_max), "--privacy", args.privacy]
        if args.ignore_upload_quota_estimate:
            upload_cmd.append("--ignore-quota-estimate")
        if not args.full_upload_followups:
            upload_cmd.extend(["--no-captions", "--no-thumbnail", "--no-sync", "--no-cleanup"])
        upload_rc = run_checked(upload_cmd)
        if upload_rc == 0 and args.full_upload_followups:
            run_checked([sys.executable, str(SYNC_CHANNEL), "--apply"])
            if args.auto_commit:
                return commit_and_push([row["slug"] for row in approved_rows])
        return upload_rc
    if args.dry_run:
        print(json.dumps(run_report, indent=2, ensure_ascii=False))
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Run the GIIS foundation video daily pipeline.")
    ap.add_argument("--target-grade", type=int, default=DEFAULT_TARGET_GRADE)
    ap.add_argument("--max-modules", type=int, default=10)
    ap.add_argument("--upload-max", type=int, default=10)
    ap.add_argument("--privacy", choices=["unlisted", "private", "public"], default="unlisted")
    ap.add_argument("--cc-model", default=os.environ.get("FOUNDATION_CC_MODEL", "sonnet"))
    ap.add_argument("--budget-usd", default="10")
    ap.add_argument("--cc-timeout-seconds", type=int, default=1800)
    ap.add_argument("--review-model", default=os.environ.get("FOUNDATION_REVIEW_MODEL", "opus"))
    ap.add_argument("--review-budget-usd", type=float, default=3)
    ap.add_argument("--review-timeout-seconds", type=int, default=420)
    ap.add_argument("--gate-timeout-seconds", type=int, default=1800)
    ap.add_argument("--url-timeout", type=float, default=8.0)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-cc", action="store_true")
    ap.add_argument("--no-independent-review", action="store_true")
    ap.add_argument("--no-gate", action="store_true")
    ap.add_argument("--no-upload", action="store_true")
    ap.add_argument("--no-parent-trust-audit", action="store_true")
    ap.add_argument("--ignore-upload-quota-estimate", action="store_true")
    ap.add_argument("--skip-existing-approved-upload", action="store_true")
    ap.add_argument("--no-course-design-repair", action="store_true")
    ap.add_argument(
        "--full-upload-followups",
        action="store_true",
        help=(
            "upload captions, thumbnails, per-upload sync, and cleanup. "
            "Default is video-first upload with playlist adds, while captions/thumbnail/sync/cleanup "
            "stay off so reconciliation work cannot cap daily video volume."
        ),
    )
    ap.add_argument("--auto-commit", action="store_true")
    ap.add_argument("--skip-network-check", action="store_true")
    ap.add_argument("--no-render-mp4", dest="render_mp4", action="store_false", default=True)
    ap.add_argument("--foundation-priority-only", dest="include_other_foundation", action="store_false", default=True)
    args = ap.parse_args()
    os.chdir(ROOT)
    return orchestrate(args)


if __name__ == "__main__":
    raise SystemExit(main())
