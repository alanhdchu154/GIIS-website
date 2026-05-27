#!/usr/bin/env python3
"""Release gate for GIIS lesson videos.

This script sits between lesson production and YouTube upload. It consumes the
same lesson folders as audit_lessons.py, applies stricter upload rules, and
writes ready/needs_revision/blocked manifests.

It is intentionally conservative. Claude/Codex can generate drafts quickly;
this gate protects the school from uploading dense, unreviewed, or visually
unchecked lessons.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
TEACHING_ROOT = ROOT / "teaching-videos"
DEFAULT_OUT_DIR = TEACHING_ROOT / "_audit" / "release-gate"

sys.path.insert(0, str(HERE))
from audit_lessons import audit_lesson  # noqa: E402


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def find_mp4(folder: Path) -> Path | None:
    canonical = folder / f"{folder.name.replace('-', '_')}.mp4"
    if canonical.exists():
        return canonical
    mp4s = sorted(folder.glob("*.mp4"))
    return mp4s[0] if len(mp4s) == 1 else None


def is_pending_upload(folder: Path) -> bool:
    script = load_json(folder / "script.json")
    if (script.get("youtube") or {}).get("video_id"):
        return False
    return find_mp4(folder) is not None


def discover_lessons(args: argparse.Namespace) -> list[Path]:
    if args.paths:
        return [Path(p).resolve() for p in args.paths]
    lessons = sorted(p for p in TEACHING_ROOT.iterdir()
                     if p.is_dir() and (p / "script.json").exists())
    if args.pending:
        lessons = [p for p in lessons if is_pending_upload(p)]
    if args.course:
        needle = args.course.lower()
        lessons = [p for p in lessons
                   if needle in str(load_json(p / "script.json").get("course", "")).lower()]
    return lessons


def reviewer_gate(audit: dict, *, require_reviewers: bool) -> list[str]:
    if not require_reviewers:
        return []
    reviewers = audit.get("reviewers") or {}
    missing = []
    if not reviewers.get("has_phd_level"):
        missing.append("missing PhD/peer reviewer")
    if not reviewers.get("has_adversarial_student"):
        missing.append("missing adversarial-student reviewer")
    if not reviewers.get("has_citation_checker"):
        missing.append("missing citation/source reviewer")
    return missing


def lesson_reasons(audit: dict, args: argparse.Namespace) -> tuple[str, list[str]]:
    """Return (bucket, reasons). bucket is ready|needs_revision|blocked."""
    reasons: list[str] = []
    issue_counts = audit.get("issue_counts") or {}
    score = audit.get("quality_score", 0)
    verdict = audit.get("verdict")
    assets = audit.get("assets") or {}
    script = audit.get("script") or {}
    course = str(script.get("course") or "")

    if verdict == "block" or issue_counts.get("critical", 0):
        reasons.append("critical audit issue")
        return "blocked", reasons

    if issue_counts.get("major", 0):
        reasons.append("major audit issue present")
    if verdict not in {"pass", "pass_with_minor_notes"}:
        reasons.append(f"audit verdict is {verdict}")
    if score < args.min_score:
        reasons.append(f"quality score {score} < required {args.min_score}")
    if not assets.get("has_mp4"):
        reasons.append("missing MP4")
    if args.require_transcript and not assets.get("has_transcript"):
        reasons.append("missing transcript.txt")
    if args.require_contact_sheet:
        folder = ROOT / audit["path"]
        if not (folder / "contact-sheet.jpg").exists():
            reasons.append("missing contact-sheet.jpg")

    reasons.extend(reviewer_gate(audit, require_reviewers=args.require_reviewers))

    if "ap " in course.lower():
        reviewers = audit.get("reviewers") or {}
        if args.require_ap_citation and not reviewers.get("has_citation_checker"):
            reasons.append("AP lesson missing citation/source checker")

    if reasons:
        return "needs_revision", reasons
    return "ready", []


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="*", help="Lesson folders. Defaults to all lesson folders.")
    ap.add_argument("--pending", action="store_true", help="Only evaluate rendered lessons not yet uploaded.")
    ap.add_argument("--course", help="Filter by course substring.")
    ap.add_argument("--min-score", type=int, default=90, help="Minimum audit score for auto-upload.")
    ap.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    ap.add_argument("--check", action="store_true",
                    help="Evaluate and print results without writing latest-release-gate.json.")
    ap.add_argument("--require-contact-sheet", action=argparse.BooleanOptionalAction, default=True)
    ap.add_argument("--require-transcript", action=argparse.BooleanOptionalAction, default=True)
    ap.add_argument("--require-reviewers", action=argparse.BooleanOptionalAction, default=True)
    ap.add_argument("--require-ap-citation", action=argparse.BooleanOptionalAction, default=True)
    ap.add_argument("--fail-on-blocked", action="store_true")
    args = ap.parse_args()

    lessons = discover_lessons(args)
    rows = []
    buckets = {"ready": [], "needs_revision": [], "blocked": []}
    for folder in lessons:
        audit = audit_lesson(folder)
        bucket, reasons = lesson_reasons(audit, args)
        row = {
            "slug": audit.get("slug"),
            "path": audit.get("path"),
            "bucket": bucket,
            "quality_score": audit.get("quality_score"),
            "verdict": audit.get("verdict"),
            "course": (audit.get("script") or {}).get("course"),
            "module": (audit.get("script") or {}).get("module"),
            "reasons": reasons,
        }
        rows.append(row)
        buckets[bucket].append(row)

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    payload = {
        "generated_at": generated_at,
        "policy": {
            "min_score": args.min_score,
            "require_contact_sheet": args.require_contact_sheet,
            "require_transcript": args.require_transcript,
            "require_reviewers": args.require_reviewers,
            "require_ap_citation": args.require_ap_citation,
            "pending_only": args.pending,
        },
        "summary": {k: len(v) for k, v in buckets.items()} | {"total": len(rows)},
        "ready_to_upload": buckets["ready"],
        "needs_revision": buckets["needs_revision"],
        "blocked": buckets["blocked"],
        "all": rows,
    }

    out_json = None
    if not args.check:
        out_dir = Path(args.out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        stamp = generated_at.replace(":", "").replace("-", "")
        out_json = out_dir / f"{stamp}-release-gate.json"
        out_json.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
        latest = out_dir / "latest-release-gate.json"
        latest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")

    print(f"[gate] evaluated: {len(rows)}")
    print(f"[gate] ready: {len(buckets['ready'])}")
    print(f"[gate] needs_revision: {len(buckets['needs_revision'])}")
    print(f"[gate] blocked: {len(buckets['blocked'])}")
    if out_json:
        print(f"[gate] json: {out_json.relative_to(ROOT)}")
    else:
        print("[gate] check mode: no files written")
    if buckets["needs_revision"]:
        print("[gate] first needs_revision:")
        for row in buckets["needs_revision"][:8]:
            print(f"  - {row['slug']}: {', '.join(row['reasons'][:3])}")
    if buckets["blocked"]:
        print("[gate] blocked:")
        for row in buckets["blocked"]:
            print(f"  - {row['slug']}: {', '.join(row['reasons'])}")
    return 2 if args.fail_on_blocked and buckets["blocked"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
