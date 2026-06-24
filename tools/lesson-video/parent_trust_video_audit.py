#!/usr/bin/env python3
"""Parent-trust audit for GIIS lesson-video artifacts.

This is an advisory check for public-facing lesson scripts/transcripts. It is
separate from `lesson_release_gate.py` on purpose: parent-trust issues need a
clear report before we decide which checks should become hard upload gates.
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
TEACHING_ROOT = ROOT / "teaching-videos"
DEFAULT_OUT_DIR = TEACHING_ROOT / "_audit" / "parent-trust"


HARD_PATTERNS: list[tuple[str, re.Pattern[str], str]] = [
    ("accreditation_claim", re.compile(r"\b(Cognia|accredited|US-accredited)\b", re.I), "unsupported accreditation wording"),
    ("ap_authorization_claim", re.compile(r"\b(AP|Advanced Placement|College Board)\b", re.I), "AP/College Board wording in foundation content"),
    ("school_code_claim", re.compile(r"\b(CEEB|school code)\b", re.I), "authorization-sensitive school-code wording"),
    ("admissions_claim", re.compile(r"\b(Common App|NCAA|F-?1|I-20|admissions?|college credit|transfer credit)\b", re.I), "admissions or authorization-sensitive wording"),
    ("outcome_guarantee", re.compile(r"\b(guarantee[sd]?|ensures?|will get|proven to)\b", re.I), "possible outcome guarantee"),
    ("real_student_name", re.compile(r"\b(Yunfan|Baoyi|Ruwen|Tao|Hanxi|Xiao)\b", re.I), "real student/person name in lesson text"),
    ("raw_url", re.compile(r"https?://|www\.|[a-z0-9-]+\.(?:com|org|net)/", re.I), "raw URL visible or spoken"),
    ("payment_claim", re.compile(r"\$[0-9]|\b(?:Stripe|checkout|invoice|refund|tuition)\b", re.I), "payment/pricing wording inside lesson"),
    ("credential_claim", re.compile(r"\b(Ph\.D\.|doctor-authored|teacher-certified|expert-authored)\b", re.I), "unsupported credential/authority wording"),
]


SOFT_PATTERNS: list[tuple[str, re.Pattern[str], str]] = [
    ("college_or_career_transfer", re.compile(r"\b(college STEM|college-level|career-ready|college-ready|professional career)\b", re.I), "future-outcome framing should stay conservative"),
    ("source_endorsement_risk", re.compile(r"\b(endorsed by|partnered with|approved by|certified by)\b", re.I), "external source endorsement implication"),
    ("ai_disclosure_risk", re.compile(r"\b(AI-generated|artificial intelligence generated)\b", re.I), "AI disclosure wording should be deliberate, not accidental"),
]


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text())
    except Exception:
        return None


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def public_text_blocks(folder: Path) -> list[dict[str, str]]:
    script = load_json(folder / "script.json")
    blocks: list[dict[str, str]] = []
    if isinstance(script, dict):
        for section in script.get("sections") or []:
            if not isinstance(section, dict):
                continue
            text = str(section.get("text") or section.get("narration") or "")
            blocks.append({
                "source": "script.json",
                "section": str(section.get("id") or ""),
                "text": text,
            })
    transcript = folder / "transcript.txt"
    if transcript.exists():
        blocks.append({
            "source": "transcript.txt",
            "section": "transcript",
            "text": transcript.read_text(errors="ignore"),
        })
    return blocks


def is_contextual_false_positive(kind: str, match: str, context: str) -> bool:
    lowered = context.lower()
    token = match.lower()
    if kind == "payment_claim":
        school_payment_context = (
            "giis" in lowered
            or "genesis" in lowered
            or "enroll" in lowered
            or "tuition" in lowered
            or "checkout" in lowered
            or "invoice" in lowered
            or "refund" in lowered
            or "stripe" in lowered
            or "pricing" in lowered
            or "payment" in lowered
        )
        business_math_context = (
            "revenue" in lowered
            or "cost" in lowered
            or "price" in lowered
            or "finance" in lowered
            or "market" in lowered
            or "business" in lowered
            or "profit" in lowered
            or "budget" in lowered
            or "loan" in lowered
            or "interest" in lowered
            or "balance" in lowered
            or "pairs" in lowered
        )
        if token.startswith("$") and business_math_context and not school_payment_context:
            return True
    if kind == "outcome_guarantee" and token.startswith("guarantee"):
        math_context = (
            "angle" in lowered
            or "equation" in lowered
            or "equal" in lowered
            or "geometry" in lowered
            or "parallel" in lowered
        )
        sensitive_context = (
            "admission" in lowered
            or "acceptance" in lowered
            or "college" in lowered
            or "credit" in lowered
            or "diploma" in lowered
            or "outcome" in lowered
        )
        return math_context and not sensitive_context
    if kind == "admissions_claim" and token.startswith("admission"):
        statehood_context = (
            "missouri" in lowered
            or "maine" in lowered
            or "statehood" in lowered
            or "slave state" in lowered
            or "free state" in lowered
            or "union" in lowered
            or "senate balance" in lowered
        )
        school_admissions_context = (
            "giis" in lowered
            or "genesis" in lowered
            or "student" in lowered
            or "applicant" in lowered
            or "college" in lowered
            or "university" in lowered
            or "f-1" in lowered
            or "i-20" in lowered
            or "common app" in lowered
            or "transfer credit" in lowered
        )
        return statehood_context and not school_admissions_context
    return False


def scan_patterns(folder: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    hard: list[dict[str, Any]] = []
    soft: list[dict[str, Any]] = []
    ignored: list[dict[str, Any]] = []
    for block in public_text_blocks(folder):
        text = block["text"]
        for kind, pattern, message in HARD_PATTERNS:
            for match in pattern.finditer(text):
                context = text[max(0, match.start() - 90): match.end() + 90].replace("\n", " ")
                row = {
                    "kind": kind,
                    "message": message,
                    "match": match.group(0),
                    "source": block["source"],
                    "section": block["section"],
                    "context": context,
                }
                if is_contextual_false_positive(kind, match.group(0), context):
                    ignored.append({**row, "reason": "contextual_math_or_science_use"})
                else:
                    hard.append(row)
        for kind, pattern, message in SOFT_PATTERNS:
            for match in pattern.finditer(text):
                context = text[max(0, match.start() - 90): match.end() + 90].replace("\n", " ")
                soft.append({
                    "kind": kind,
                    "message": message,
                    "match": match.group(0),
                    "source": block["source"],
                    "section": block["section"],
                    "context": context,
                })
    return hard, soft, ignored


def reviewer_status(folder: Path) -> dict[str, Any]:
    independent = load_json(folder / "_review_independent_pass.json")
    source_alignment = load_json(folder / "_review_source_alignment.json")
    return {
        "independent_pass": isinstance(independent, dict) and independent.get("verdict") == "pass",
        "source_alignment_pass": isinstance(source_alignment, dict) and source_alignment.get("verdict") == "pass",
        "source_alignment_raw_url_check": (source_alignment or {}).get("raw_url_check") if isinstance(source_alignment, dict) else None,
    }


def audit_folder(folder: Path) -> dict[str, Any]:
    if not folder.exists() or not folder.is_dir():
        return {
            "slug": folder.name,
            "path": rel(folder),
            "course": None,
            "module": None,
            "youtube_video_id": None,
            "verdict": "FIX_FIRST",
            "hard_findings": [{
                "kind": "missing_lesson_folder",
                "message": "lesson folder does not exist",
                "match": str(folder),
                "source": "filesystem",
                "section": "",
                "context": str(folder),
            }],
            "soft_findings": [],
            "ignored_findings": [],
            "warnings": [],
            "reviewers": {},
        }
    script = load_json(folder / "script.json")
    if not isinstance(script, dict):
        return {
            "slug": folder.name,
            "path": rel(folder),
            "course": None,
            "module": None,
            "youtube_video_id": None,
            "verdict": "FIX_FIRST",
            "hard_findings": [{
                "kind": "missing_script_json",
                "message": "lesson script.json is missing or invalid",
                "match": rel(folder / "script.json"),
                "source": "script.json",
                "section": "",
                "context": rel(folder / "script.json"),
            }],
            "soft_findings": [],
            "ignored_findings": [],
            "warnings": [],
            "reviewers": reviewer_status(folder),
        }
    hard, soft, ignored = scan_patterns(folder)
    reviewers = reviewer_status(folder)
    warnings: list[str] = []
    if not reviewers["independent_pass"]:
        warnings.append("missing passing independent reviewer")
    if not reviewers["source_alignment_pass"]:
        warnings.append("missing passing source-alignment reviewer")
    if reviewers["source_alignment_raw_url_check"] not in (None, "pass"):
        warnings.append("source-alignment reviewer did not pass raw URL check")
    verdict = "TRUST_READY"
    if hard:
        verdict = "FIX_FIRST"
    return {
        "slug": folder.name,
        "path": rel(folder),
        "course": script.get("course"),
        "module": script.get("module"),
        "youtube_video_id": ((script.get("youtube") or {}).get("video_id")),
        "verdict": verdict,
        "hard_findings": hard,
        "soft_findings": soft,
        "ignored_findings": ignored,
        "warnings": warnings,
        "reviewers": reviewers,
    }


def discover(paths: list[str]) -> list[Path]:
    if paths:
        return [Path(p).resolve() if Path(p).is_absolute() else (ROOT / p).resolve() for p in paths]
    return sorted(p for p in TEACHING_ROOT.iterdir() if p.is_dir() and (p / "script.json").exists())


def render_markdown(payload: dict[str, Any]) -> str:
    rows = payload["lessons"]
    hard_count = sum(len(row["hard_findings"]) for row in rows)
    soft_count = sum(len(row["soft_findings"]) for row in rows)
    lines = [
        "# Parent Trust Video Audit",
        "",
        f"Generated at: {payload['generated_at']}",
        f"Verdict: **{payload['verdict']}**",
        f"Lessons checked: {len(rows)}",
        f"Hard findings: {hard_count}",
        f"Soft findings: {soft_count}",
        "",
        "## Lessons",
        "",
    ]
    for row in rows:
        lines.append(f"- `{row['slug']}`: **{row['verdict']}**")
        if row["warnings"]:
            lines.append(f"  - Warnings: {'; '.join(row['warnings'])}")
        for finding in row["hard_findings"]:
            lines.append(f"  - HARD `{finding['kind']}` {finding['source']}#{finding['section']}: {finding['context']}")
        for finding in row["soft_findings"]:
            lines.append(f"  - SOFT `{finding['kind']}` {finding['source']}#{finding['section']}: {finding['context']}")
        for finding in row["ignored_findings"]:
            lines.append(f"  - Ignored `{finding['kind']}` {finding['source']}#{finding['section']}: {finding['context']}")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Advisory parent-trust audit for lesson-video scripts.")
    parser.add_argument("paths", nargs="*", help="Lesson folders. Defaults to all lessons.")
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    parser.add_argument("--report-name", default=None)
    parser.add_argument("--json", action="store_true", help="Print JSON payload to stdout.")
    args = parser.parse_args()

    lessons = [audit_folder(path) for path in discover(args.paths)]
    verdict = "TRUST_READY" if all(row["verdict"] == "TRUST_READY" for row in lessons) else "FIX_FIRST"
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "policy": "parent_trust_video_audit_v1_advisory",
        "verdict": verdict,
        "lessons": lessons,
    }
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    name = args.report_name or f"{stamp}-parent-trust-video-audit"
    json_path = out_dir / f"{name}.json"
    md_path = out_dir / f"{name}.md"
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    md_path.write_text(render_markdown(payload), encoding="utf-8")
    if args.json:
        print(json.dumps(payload, indent=2, ensure_ascii=False))
    else:
        print(f"[parent-trust] verdict={verdict} lessons={len(lessons)} report={rel(md_path)}")
    return 1 if verdict == "FIX_FIRST" else 0


if __name__ == "__main__":
    raise SystemExit(main())
