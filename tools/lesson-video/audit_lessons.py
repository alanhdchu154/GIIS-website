#!/usr/bin/env python3
"""Audit GIIS lesson-video folders and produce a quality report.

This is the first automated "release gate" for the lesson pipeline. It does
not call an LLM or mutate lessons; it reads script/slides/audio/reviewer
artifacts and summarizes which videos are ready, risky, or missing QA.

Usage:
    python3 tools/lesson-video/audit_lessons.py
    python3 tools/lesson-video/audit_lessons.py teaching-videos/ap-biology-module-10-natural-selection
    python3 tools/lesson-video/audit_lessons.py --course "AP Biology" --limit 12
"""
from __future__ import annotations

import argparse
import json
import math
import re
import statistics
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
TEACHING_ROOT = REPO_ROOT / "teaching-videos"
DEFAULT_OUT_DIR = TEACHING_ROOT / "_audit" / "lesson-quality"

TARGET_WPM = 150
MIN_SECTIONS = 10
MAX_AVG_WORDS_PER_SECTION = 85
MAX_SECTION_WORDS = 105
MIN_PAUSES = 1

REQUIRED_ID_HINTS = {
    "title": ("title",),
    "hook": ("hook",),
    "overview": ("overview", "game_plan", "plan"),
    "pause": ("pause",),
    "recap": ("recap",),
    "path": ("path", "next"),
}

RISKY_CLAIMS = [
    (re.compile(r"\bCognia\b|\baccredited\b|US-accredited", re.I), "Accreditation claim risk"),
    (re.compile(r"\bguaranteed admission\b|\bguarantee[sd]?\s+(admission|acceptance|result|college|university)\b", re.I), "Guarantee claim risk"),
    (re.compile(r"\brecognized by US universities\b", re.I), "Recognition wording needs support"),
    (re.compile(r"\bAP Course Audit\b|\bCollege Board approved\b", re.I), "AP authorization wording needs verification"),
]


def word_count(text: str) -> int:
    return len(re.findall(r"[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?", text))


def load_json(path: Path) -> Any | None:
    try:
        return json.loads(path.read_text())
    except Exception:
        return None


def display_path(path: Path) -> str:
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def png_dimensions(path: Path) -> tuple[int, int] | None:
    try:
        with path.open("rb") as f:
            header = f.read(24)
        if header[:8] != b"\x89PNG\r\n\x1a\n":
            return None
        return int.from_bytes(header[16:20], "big"), int.from_bytes(header[20:24], "big")
    except Exception:
        return None


def find_lessons(args: argparse.Namespace) -> list[Path]:
    if args.paths:
        return [Path(p).resolve() for p in args.paths]
    lessons = sorted(p for p in TEACHING_ROOT.iterdir()
                     if p.is_dir() and (p / "script.json").exists())
    if args.course:
        needle = args.course.lower()
        lessons = [
            p for p in lessons
            if needle in ((load_json(p / "script.json") or {}).get("course", "").lower())
        ]
    if args.limit:
        lessons = lessons[:args.limit]
    return lessons


def collect_reviewer_verdicts(folder: Path) -> dict[str, Any]:
    verdicts: list[dict[str, str]] = []
    for path in sorted(folder.glob("_review*.json")):
        data = load_json(path)
        if not isinstance(data, dict):
            continue
        reviewer = str(data.get("reviewer") or path.stem)
        verdict = str(data.get("verdict") or "unknown").lower()
        verdicts.append({"file": path.name, "reviewer": reviewer, "verdict": verdict})
    counts = Counter(v["verdict"] for v in verdicts)
    return {
        "count": len(verdicts),
        "verdicts": verdicts,
        "counts": dict(counts),
        "has_phd_level": any("phd" in v["reviewer"].lower() or "peer" in v["reviewer"].lower()
                             for v in verdicts),
        "has_adversarial_student": any("student" in v["reviewer"].lower()
                                       or "adversarial" in v["reviewer"].lower()
                                       for v in verdicts),
        "has_citation_checker": any("citation" in v["reviewer"].lower()
                                    or "source" in v["reviewer"].lower()
                                    for v in verdicts),
    }


def inspect_script(folder: Path, script: dict[str, Any]) -> dict[str, Any]:
    sections = script.get("sections") or []
    ids = [str(s.get("id", "")) for s in sections]
    texts = [str(s.get("text", "")) for s in sections]
    counts = [word_count(t) for t in texts]
    total_words = sum(counts)
    long_sections = [
        {"id": sid, "words": wc}
        for sid, wc in zip(ids, counts)
        if wc > MAX_SECTION_WORDS
    ]
    empty_sections = [
        {"id": sid}
        for sid, txt in zip(ids, texts)
        if not txt.strip() and not sid.endswith("_silence")
    ]
    id_blob = " ".join(ids).lower()
    text_blob = "\n".join(texts)
    required = {
        name: any(hint in id_blob for hint in hints)
        for name, hints in REQUIRED_ID_HINTS.items()
    }
    pause_count = sum(1 for sid in ids if "pause" in sid.lower()
                      and not sid.lower().endswith("_silence")
                      and "answer" not in sid.lower()
                      and "solution" not in sid.lower())
    silence_count = sum(1 for sid in ids if sid.lower().endswith("_silence"))
    answer_count = sum(1 for sid in ids if any(token in sid.lower()
                                               for token in ("answer", "solution", "walkthrough")))
    risky_claims = [
        {"kind": label, "match": m.group(0)}
        for pattern, label in RISKY_CLAIMS
        for m in pattern.finditer(text_blob)
    ]
    urls = re.findall(r"https?://\S+|www\.\S+", text_blob)
    assignment_mentions = len(re.findall(r"\bassignment\b|\bpractice\b|\bportal\b", text_blob, re.I))
    misconception_mentions = len(re.findall(
        r"\btrap\b|\bmistake\b|\bmisconception\b|\bwrong\b|\bnot mean\b|\bdoes not mean\b",
        text_blob,
        re.I,
    ))
    return {
        "course": script.get("course"),
        "module": script.get("module"),
        "voice": script.get("voice"),
        "voice_rate": script.get("voice_rate"),
        "section_count": len(sections),
        "word_count": total_words,
        "estimated_minutes": round(total_words / TARGET_WPM, 1) if total_words else 0,
        "avg_words_per_section": round(statistics.mean(counts), 1) if counts else 0,
        "max_words_in_section": max(counts) if counts else 0,
        "long_sections": long_sections,
        "empty_sections": empty_sections,
        "required_structure": required,
        "pause_count": pause_count,
        "silence_count": silence_count,
        "has_worked_solution_after_pause": (silence_count + answer_count) >= pause_count >= MIN_PAUSES,
        "urls_in_narration": urls,
        "risky_claims": risky_claims,
        "assignment_mentions": assignment_mentions,
        "misconception_mentions": misconception_mentions,
    }


def inspect_assets(folder: Path, section_ids: list[str]) -> dict[str, Any]:
    slides_dir = folder / "slides"
    audio_dir = folder / "audio"
    slides = sorted(slides_dir.glob("*.png")) if slides_dir.exists() else []
    audio_mp3 = sorted(audio_dir.glob("*.mp3")) if audio_dir.exists() else []
    audio_wav = sorted(audio_dir.glob("*.wav")) if audio_dir.exists() else []
    audio_count = len({p.stem for p in audio_mp3 + audio_wav})
    mp4s = sorted(folder.glob("*.mp4"))
    dimensions = [png_dimensions(p) for p in slides[:5]]
    dimension_counts = Counter(d for d in dimensions if d)
    missing_slides = [
        sid for sid in section_ids
        if not (slides_dir / f"{sid}.png").exists()
    ]
    expected_slide_names = {f"{sid}.png" for sid in section_ids}
    extra_slides = [p.name for p in slides if p.name not in expected_slide_names]
    missing_audio = [
        sid for sid in section_ids
        if not (audio_dir / f"{sid}.mp3").exists() and not (audio_dir / f"{sid}.wav").exists()
    ]
    return {
        "slides_count": len(slides),
        "audio_mp3_count": len(audio_mp3),
        "audio_wav_count": len(audio_wav),
        "audio_file_count": audio_count,
        "mp4_count": len(mp4s),
        "has_mp4": bool(mp4s),
        "mp4_files": [{"file": p.name, "mb": round(p.stat().st_size / 1_000_000, 1)} for p in mp4s],
        "has_transcript": (folder / "transcript.txt").exists(),
        "has_intro_music": (folder / "intro_music.wav").exists(),
        "has_outro_music": (folder / "outro_music.wav").exists(),
        "is_cleaned_after_upload": (folder / ".cleaned").exists(),
        "slide_dimensions_sample": {f"{k[0]}x{k[1]}": v for k, v in dimension_counts.items()},
        "missing_slides": missing_slides[:20],
        "extra_slides": extra_slides[:20],
        "missing_audio": missing_audio[:20],
        "slide_count_matches_sections": (not missing_slides and len(slides) >= len(section_ids)) or (folder / ".cleaned").exists(),
        "audio_count_matches_sections": audio_count >= len(section_ids) or (folder / ".cleaned").exists(),
    }


def score_lesson(script_info: dict[str, Any], assets: dict[str, Any],
                 reviewers: dict[str, Any], youtube: dict[str, Any]) -> dict[str, Any]:
    issues: list[dict[str, str]] = []

    def add(severity: str, message: str):
        issues.append({"severity": severity, "message": message})

    if script_info["section_count"] < MIN_SECTIONS:
        add("major", f"Only {script_info['section_count']} sections; likely too thin for a full lesson.")
    if script_info["avg_words_per_section"] > MAX_AVG_WORDS_PER_SECTION:
        add("minor", f"Average section is {script_info['avg_words_per_section']} words; narration may feel dense.")
    for s in script_info["long_sections"][:5]:
        add("minor", f"{s['id']} is {s['words']} words; consider splitting the slide.")
    for s in script_info["empty_sections"]:
        add("major", f"{s['id']} has empty narration but is not marked *_silence.")

    required = script_info["required_structure"]
    for name, ok in required.items():
        if not ok:
            add("major" if name in {"pause", "recap"} else "minor", f"Missing expected {name} section.")
    if not script_info["has_worked_solution_after_pause"]:
        add("major", "Pause section does not appear to have a paired worked-solution silence section.")
    if script_info["misconception_mentions"] == 0:
        add("minor", "No obvious misconception/trap language; add one common mistake or AP trap.")
    if script_info["assignment_mentions"] == 0:
        add("minor", "No assignment/practice/portal next-action language.")
    for claim in script_info["risky_claims"]:
        add("major", f"{claim['kind']}: '{claim['match']}'")
    if script_info["urls_in_narration"]:
        add("minor", "Narration contains URLs; say resource names instead of reading URLs.")

    if assets["missing_slides"] and not assets["is_cleaned_after_upload"]:
        add("major", f"Missing slide PNGs for sections: {assets['missing_slides']}")
    if assets["extra_slides"] and not assets["is_cleaned_after_upload"]:
        add("note", f"Extra slide PNGs not referenced by script.json: {assets['extra_slides'][:5]}")
    if not assets["audio_count_matches_sections"] and assets["has_mp4"]:
        add("minor", "Audio artifacts are incomplete even though MP4 exists; may be cleaned or partially generated.")
    if not assets["has_mp4"] and not assets["is_cleaned_after_upload"]:
        add("major", "No MP4 found.")
    if not assets["has_transcript"] and assets["has_mp4"]:
        add("minor", "No transcript.txt found for YouTube CC upload.")

    if reviewers["count"] == 0:
        add("major", "No reviewer JSON found; needs PhD/adversarial/citation audit before auto-release.")
    else:
        if not reviewers["has_phd_level"]:
            add("minor", "Reviewer set lacks an obvious PhD/peer reviewer.")
        if not reviewers["has_adversarial_student"]:
            add("minor", "Reviewer set lacks adversarial-student clarity check.")
        if not reviewers["has_citation_checker"]:
            add("minor", "Reviewer set lacks citation/source checker.")
        if reviewers["counts"].get("critical"):
            add("critical", "At least one reviewer verdict is critical.")
        if reviewers["counts"].get("minor", 0) >= 2 and reviewers["counts"].get("pass", 0) == 0:
            add("minor", "Multiple minor reviewer verdicts; schedule content revision pass.")

    if script_info["course"] and "ap " in str(script_info["course"]).lower():
        add("note", "AP course naming should be checked against Course Audit/authorization wording before public claims.")
    if youtube.get("video_id") and not assets["is_cleaned_after_upload"]:
        add("note", "YouTube block exists but folder is not marked .cleaned; cleanup may not have run.")

    weights = {"critical": 100, "major": 20, "minor": 6, "note": 1}
    penalty = sum(weights[i["severity"]] for i in issues)
    quality_score = max(0, min(100, 100 - penalty))
    if any(i["severity"] == "critical" for i in issues):
        verdict = "block"
    elif any(i["severity"] == "major" for i in issues):
        verdict = "needs_review"
    elif any(i["severity"] == "minor" for i in issues):
        verdict = "pass_with_minor_notes"
    else:
        verdict = "pass"
    return {
        "verdict": verdict,
        "quality_score": quality_score,
        "issues": issues,
        "issue_counts": dict(Counter(i["severity"] for i in issues)),
    }


def audit_lesson(folder: Path) -> dict[str, Any]:
    script_path = folder / "script.json"
    script = load_json(script_path)
    if not isinstance(script, dict):
        return {
            "slug": folder.name,
            "path": display_path(folder),
            "verdict": "block",
            "quality_score": 0,
            "issues": [{"severity": "critical", "message": "Missing or invalid script.json"}],
        }
    sections = script.get("sections") or []
    section_ids = [str(s.get("id", "")) for s in sections]
    script_info = inspect_script(folder, script)
    assets = inspect_assets(folder, section_ids)
    reviewers = collect_reviewer_verdicts(folder)
    youtube = script.get("youtube") or {}
    score = score_lesson(script_info, assets, reviewers, youtube)
    return {
        "slug": folder.name,
        "path": display_path(folder),
        **score,
        "script": script_info,
        "assets": assets,
        "reviewers": reviewers,
        "youtube": {
            "video_id": youtube.get("video_id"),
            "url": youtube.get("url"),
            "privacy": youtube.get("privacy"),
            "playlist": youtube.get("playlist"),
            "uploaded_at": youtube.get("uploaded_at"),
        },
    }


def summarize(results: list[dict[str, Any]]) -> dict[str, Any]:
    verdict_counts = Counter(r.get("verdict") for r in results)
    issue_counts = Counter()
    for r in results:
        issue_counts.update((r.get("issue_counts") or {}))
    scores = [r.get("quality_score", 0) for r in results]
    return {
        "lesson_count": len(results),
        "verdict_counts": dict(verdict_counts),
        "issue_counts": dict(issue_counts),
        "avg_quality_score": round(statistics.mean(scores), 1) if scores else 0,
        "median_quality_score": round(statistics.median(scores), 1) if scores else 0,
        "ready_count": verdict_counts.get("pass", 0) + verdict_counts.get("pass_with_minor_notes", 0),
        "needs_review_count": verdict_counts.get("needs_review", 0),
        "blocked_count": verdict_counts.get("block", 0),
    }


def write_markdown(path: Path, payload: dict[str, Any]) -> None:
    summary = payload["summary"]
    results = sorted(payload["lessons"], key=lambda r: (r["quality_score"], r["slug"]))
    lines = [
        "# GIIS Lesson Quality Audit",
        "",
        f"- Generated: `{payload['generated_at']}`",
        f"- Lessons audited: **{summary['lesson_count']}**",
        f"- Average score: **{summary['avg_quality_score']}**",
        f"- Verdicts: `{summary['verdict_counts']}`",
        "",
        "## Highest Priority",
        "",
    ]
    for r in results[:20]:
        issues = r.get("issues") or []
        first = issues[0]["message"] if issues else "No issues."
        lines.append(
            f"- **{r['quality_score']:>3}** `{r['verdict']}` — `{r['slug']}` — {first}"
        )
    lines += ["", "## Per-Lesson Detail", ""]
    for r in results:
        s = r.get("script") or {}
        a = r.get("assets") or {}
        rev = r.get("reviewers") or {}
        lines.append(f"### {r['slug']}")
        lines.append("")
        lines.append(
            f"- Score/verdict: **{r['quality_score']}** / `{r['verdict']}`"
        )
        lines.append(
            f"- Course/module: {s.get('course', '?')} — {s.get('module', '?')}"
        )
        lines.append(
            f"- Length: {s.get('section_count', 0)} sections, {s.get('word_count', 0)} words, ~{s.get('estimated_minutes', 0)} min"
        )
        lines.append(
            f"- Assets: slides {a.get('slides_count', 0)}, audio {a.get('audio_mp3_count', 0)}, mp4 {a.get('has_mp4', False)}, YouTube {bool((r.get('youtube') or {}).get('video_id'))}"
        )
        lines.append(
            f"- Reviewers: {rev.get('count', 0)} files, verdicts {rev.get('counts', {})}"
        )
        for issue in (r.get("issues") or [])[:8]:
            lines.append(f"- `{issue['severity']}` {issue['message']}")
        lines.append("")
    path.write_text("\n".join(lines) + "\n")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="*", help="Lesson folder(s). Defaults to all teaching-videos/*/script.json")
    ap.add_argument("--course", help="Filter by course name substring")
    ap.add_argument("--limit", type=int, help="Audit only the first N lessons after filtering")
    ap.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="Output directory for JSON/Markdown report")
    ap.add_argument("--fail-on-block", action="store_true", help="Exit non-zero if any lesson is blocked")
    args = ap.parse_args()

    lessons = find_lessons(args)
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    results = [audit_lesson(folder) for folder in lessons]
    payload = {
        "generated_at": generated_at,
        "repo_root": str(REPO_ROOT),
        "summary": summarize(results),
        "lessons": results,
    }

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = generated_at.replace(":", "").replace("-", "")
    json_path = out_dir / f"{stamp}-lesson-quality.json"
    md_path = out_dir / f"{stamp}-lesson-quality.md"
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    write_markdown(md_path, payload)

    print(f"[audit] lessons: {payload['summary']['lesson_count']}")
    print(f"[audit] verdicts: {payload['summary']['verdict_counts']}")
    print(f"[audit] avg score: {payload['summary']['avg_quality_score']}")
    print(f"[audit] json: {display_path(json_path)}")
    print(f"[audit] md:   {display_path(md_path)}")

    if args.fail_on_block and payload["summary"]["blocked_count"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
