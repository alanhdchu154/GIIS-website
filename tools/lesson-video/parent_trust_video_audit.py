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
FIXTURE_PATH = ROOT / "tools" / "lesson-video" / "tests" / "parent_trust_fixtures.json"


HARD_PATTERNS: list[tuple[str, re.Pattern[str], str]] = [
    ("accreditation_claim", re.compile(r"\b(Cognia|accredited|US-accredited)\b|\u7f8e\u56fd\u8ba4\u8bc1", re.I), "unsupported accreditation wording"),
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


def contains_any(text: str, needles: tuple[str, ...]) -> bool:
    return any(needle in text for needle in needles)


def classify_hard_candidate(kind: str, match: str, context: str) -> dict[str, str]:
    """Classify a keyword hit as a real parent-trust block or instructional use.

    Keyword patterns are recall only. This function is the deterministic local
    judge used before the independent Opus reviewer output is available to the
    audit script. It intentionally blocks ambiguous school-facing claims.
    """
    lowered = context.lower()
    token = match.lower()
    school_context = contains_any(
        lowered,
        (
            "giis",
            "genesis",
            "our school",
            "the school",
            "enroll",
            "apply",
            "tuition",
            "stripe",
            "payment",
            "diploma",
            "student account",
            "parent account",
        ),
    )
    admissions_context = contains_any(
        lowered,
        (
            "college",
            "university",
            "applicant",
            "admissions",
            "acceptance",
            "common app",
            "transfer credit",
            "college credit",
            "f-1",
            "i-20",
            "visa",
        ),
    )

    def allow(reason: str) -> dict[str, str]:
        return {
            "verdict": "ALLOW",
            "claimType": kind,
            "quote": match,
            "reason": reason,
        }

    def block(reason: str) -> dict[str, str]:
        return {
            "verdict": "BLOCK",
            "claimType": kind,
            "quote": match,
            "reason": reason,
        }

    if kind == "accreditation_claim":
        return block("unsupported accreditation wording is never instructional")
    if kind == "school_code_claim":
        return block("school-code wording is authorization-sensitive")
    if kind == "credential_claim":
        return block("credential or authority wording needs explicit approval")
    if kind == "raw_url":
        return block("raw URL should not appear in public lesson text")
    if kind == "real_student_name":
        return block("real student/person names do not belong in public lessons")
    if kind == "ap_authorization_claim":
        ap_style_context = (
            "ap-style" in lowered
            or "ap style" in lowered
            or "style task" in lowered
            or "close-reading task" in lowered
        )
        regulated_ap_context = contains_any(
            lowered,
            (
                "college board",
                "advanced placement",
                "ap credit",
                "official ap",
                "approved ap",
                "ap course",
                "ap authorization",
                "counts toward",
                "diploma",
            ),
        )
        negated_ap_context = contains_any(
            lowered,
            (
                "not an official ap",
                "not an ap course",
                "not a college board",
                "not college board",
                "not authorization",
                "not an authorization",
            ),
        )
        if ap_style_context and (not regulated_ap_context or negated_ap_context) and not school_context:
            return allow("AP-style describes an instructional task style, not authorization")
        return block("AP or College Board wording is authorization-sensitive")
    if kind == "payment_claim":
        explicit_school_payment = school_context and contains_any(
            lowered,
            (
                "pay",
                "price",
                "pricing",
                "tuition",
                "stripe",
                "checkout",
                "invoice",
                "refund",
                "enroll",
                "$",
            ),
        )
        if explicit_school_payment:
            return block("payment or enrollment wording refers to GIIS")
        business_lesson_context = (
            contains_any(
                lowered,
                (
                    "revenue",
                    "cost",
                    "price",
                    "finance",
                    "market",
                    "labor",
                    "worker",
                    "wage",
                    "salary",
                    "earn",
                    "employment",
                    "unemployed",
                    "business",
                    "profit",
                    "budget",
                    "loan",
                    "interest",
                    "balance",
                    "pairs",
                    "customer",
                    "competitor",
                    "survey",
                    "purchaser",
                    "user",
                    "interview",
                    "memo",
                    "proposal",
                    "equipment",
                    "conference room",
                    "purpose statement",
                    "mobile",
                    "likert",
                    "attitude",
                    "question",
                    "scale",
                    "slower",
                    "speed",
                ),
            )
        )
        business_process_token = token in {"checkout", "invoice", "refund"}
        if token.startswith("$") and business_lesson_context and not school_context:
            return allow("money amount is part of business/economics instruction")
        if business_process_token and business_lesson_context and not school_context:
            return allow("checkout/invoice/refund is part of business process instruction")
        return block("payment/pricing wording is ambiguous or school-facing")
    if kind == "outcome_guarantee" and token.startswith("guarantee"):
        math_context = (
            contains_any(
                lowered,
                (
                    "angle",
                    "equation",
                    "equal",
                    "geometry",
                    "parallel",
                    "function",
                    "root",
                    "continuity",
                    "continuous",
                    "intermediate value theorem",
                    "vertical asymptote",
                    "opposite-sign outputs",
                ),
            )
        )
        survey_design_context = (
            contains_any(
                lowered,
                (
                    "survey",
                    "question wording",
                    "leading question",
                    "question almost",
                    "leaves the door open",
                    "respondent",
                    "questionnaire",
                ),
            )
        )
        if (math_context or survey_design_context) and not school_context and not admissions_context:
            return allow("guarantee is instructional math/research wording")
        return block("guarantee wording may imply a student or school outcome")
    if kind == "outcome_guarantee" and token.startswith("ensure"):
        research_method_context = (
            contains_any(
                lowered,
                (
                    "internal validity",
                    "reliability",
                    "confounds",
                    "measurement",
                    "research design",
                    "consistent measurement",
                    "sampling",
                    "trustworthiness",
                    "credibility",
                    "member checking",
                    "transferability",
                    "qualitative",
                    "data collection",
                    "limitation",
                ),
            )
        )
        if research_method_context and not school_context and not admissions_context:
            return allow("ensure is research-methods quality-control wording")
        return block("ensure wording may imply a student or school outcome")
    if kind == "admissions_claim" and token.startswith("admission"):
        literary_admission_context = (
            (
                "charged admission" in lowered
                or "charges admission" in lowered
                or "charging admission" in lowered
            )
            and (
                "angel" in lowered
                or "villager" in lowered
                or "crowd" in lowered
                or "spectacle" in lowered
                or "family" in lowered
                or "courtyard" in lowered
                or "priest" in lowered
                or "bishop" in lowered
                or "divine being" in lowered
                or "greed" in lowered
                or "exploit" in lowered
            )
        )
        if literary_admission_context and not school_context and not admissions_context:
            return allow("admission means entrance fee in a literary story context")
        statehood_context = (
            contains_any(
                lowered,
                (
                    "missouri",
                    "maine",
                    "statehood",
                    "slave state",
                    "free state",
                    "union",
                    "senate balance",
                ),
            )
        )
        if statehood_context and not school_context and not admissions_context:
            return allow("admission refers to historical statehood, not school admissions")
    if kind == "admissions_claim":
        return block("admissions or transfer-credit wording is authorization-sensitive")
    return block("keyword hit needs review and is blocked by default")


def scan_text_block(text: str, source: str, section: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    hard: list[dict[str, Any]] = []
    soft: list[dict[str, Any]] = []
    ignored: list[dict[str, Any]] = []
    for kind, pattern, message in HARD_PATTERNS:
        for match in pattern.finditer(text):
            context = text[max(0, match.start() - 90): match.end() + 90].replace("\n", " ")
            decision = classify_hard_candidate(kind, match.group(0), context)
            row = {
                "kind": kind,
                "message": message,
                "match": match.group(0),
                "source": source,
                "section": section,
                "context": context,
                "semantic_decision": decision,
            }
            if decision["verdict"] == "ALLOW":
                ignored.append({**row, "reason": decision["reason"]})
            else:
                hard.append(row)
    for kind, pattern, message in SOFT_PATTERNS:
        for match in pattern.finditer(text):
            context = text[max(0, match.start() - 90): match.end() + 90].replace("\n", " ")
            soft.append({
                "kind": kind,
                "message": message,
                "match": match.group(0),
                "source": source,
                "section": section,
                "context": context,
            })
    return hard, soft, ignored


def scan_patterns(folder: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    hard: list[dict[str, Any]] = []
    soft: list[dict[str, Any]] = []
    ignored: list[dict[str, Any]] = []
    for block in public_text_blocks(folder):
        block_hard, block_soft, block_ignored = scan_text_block(
            block["text"],
            block["source"],
            block["section"],
        )
        hard.extend(block_hard)
        soft.extend(block_soft)
        ignored.extend(block_ignored)
    return hard, soft, ignored


def run_fixture_checks(path: Path = FIXTURE_PATH) -> list[str]:
    fixtures = load_json(path)
    if not isinstance(fixtures, dict):
        return [f"fixture file missing or invalid: {rel(path)}"]
    failures: list[str] = []
    for group, expected in (("must_allow", "ALLOW"), ("must_block", "BLOCK")):
        entries = fixtures.get(group)
        if not isinstance(entries, list):
            failures.append(f"{group} must be a list in {rel(path)}")
            continue
        for idx, entry in enumerate(entries):
            if not isinstance(entry, dict):
                failures.append(f"{group}[{idx}] must be an object")
                continue
            text = str(entry.get("text") or "")
            context = str(entry.get("context") or text)
            label = str(entry.get("label") or f"{group}[{idx}]")
            scan_input = f"{context} {text}".strip()
            hard, _soft, ignored = scan_text_block(scan_input, "fixture", label)
            if expected == "ALLOW" and hard:
                details = "; ".join(f"{row['kind']}={row['match']}" for row in hard)
                failures.append(f"{label}: expected ALLOW, got BLOCK ({details})")
            if expected == "BLOCK" and not hard:
                ignored_details = "; ".join(f"{row['kind']}={row['match']}" for row in ignored)
                failures.append(f"{label}: expected BLOCK, got ALLOW ({ignored_details or 'no hard hit'})")
    return failures


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
    parser.add_argument("--skip-fixture-check", action="store_true", help="Skip parent-trust policy fixture regression checks.")
    parser.add_argument("--check-fixtures-only", action="store_true", help="Run fixture regression checks and exit.")
    args = parser.parse_args()

    if not args.skip_fixture_check:
        fixture_failures = run_fixture_checks()
        if fixture_failures:
            print("[parent-trust] fixture regression failure:")
            for failure in fixture_failures:
                print(f"- {failure}")
            return 2
        if args.check_fixtures_only:
            print("[parent-trust] fixture regression checks passed")
            return 0
    elif args.check_fixtures_only:
        print("[parent-trust] fixture regression checks skipped")
        return 0

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
