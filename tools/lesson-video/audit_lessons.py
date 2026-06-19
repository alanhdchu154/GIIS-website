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
import hashlib
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
    (re.compile(r"\bguaranteed\s+transfer\s+credit\b|\bguarantee[sd]?\s+credit\b", re.I), "Transfer-credit guarantee claim risk"),
    (re.compile(r"\bcollege\s+credit\b", re.I), "College-credit wording needs support"),
    (re.compile(r"\bCommon\s+App\b|\bF-?1\b|\bNCAA\b", re.I), "Authorization/admissions pathway wording needs support"),
    (re.compile(r"\brecognized by US universities\b", re.I), "Recognition wording needs support"),
    (re.compile(r"\bAP Course Audit\b|\bCollege Board approved\b", re.I), "AP authorization wording needs verification"),
]

RISKY_VISUAL_UNICODE = {
    "δ": "delta charge labels can render poorly in some slide fonts; prefer 'partial +' / 'partial -'",
    "⁺": "superscript plus can render poorly in some slide fonts; prefer plain '+'.",
    "⁻": "superscript minus can render poorly in some slide fonts; prefer plain '-'.",
}

EXTERNAL_LEARNING_PLATFORM_RE = re.compile(
    r"\b(Khan Academy|Crash Course|CommonLit|IXL|Quizlet|Edpuzzle|Coursera|Udemy|CK-12)\b",
    re.I,
)

EXPERT_LENS_STOPWORDS = {
    "about", "above", "after", "again", "against", "also", "because", "before",
    "being", "between", "course", "every", "from", "have", "into", "lesson",
    "make", "more", "module", "must", "should", "that", "their", "there",
    "these", "this", "through", "using", "when", "where", "which", "while",
    "with", "without", "work", "works", "students", "student",
}

EXPECTED_THEME_PREFIXES = [
    (("Algebra", "Geometry", "Calculus", "Pre-Calculus", "Trigonometry",
      "Statistics", "AP Statistics"), "math"),
    (("Biology", "AP Biology", "Chemistry", "Physics", "Environmental"), "science"),
    (("English", "Composition", "Academic Writing", "Communication", "Media"), "literature"),
    (("History", "Government", "Geography", "Economics", "AP Human"), "social_studies"),
    (("Psychology", "AP Psychology", "Cognitive", "Counseling", "Behavioral",
      "Human Development"), "psychology"),
    (("Health", "Athletic", "Sports", "Fitness", "Physical Education"), "pe_health"),
    (("Computer Science", "AP Computer Science", "Programming", "Software",
      "Java", "Python Programming", "Web Development"), "computer_science"),
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


def sha256_file(path: Path) -> str | None:
    try:
        h = hashlib.sha256()
        with path.open("rb") as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None


def sha256_review_script(path: Path) -> str | None:
    """Hash the teaching script content reviewers approved.

    `script.json.youtube` is written after upload/sync and should not invalidate
    the pedagogical reviewer binding.
    """
    script = load_json(path)
    if not isinstance(script, dict):
        return sha256_file(path)
    script = dict(script)
    script.pop("youtube", None)
    data = json.dumps(script, indent=2, ensure_ascii=False).encode() + b"\n"
    return hashlib.sha256(data).hexdigest()


def expected_theme_name(course: str | None) -> str:
    course = course or ""
    for prefixes, theme in EXPECTED_THEME_PREFIXES:
        for prefix in prefixes:
            if course.lower().startswith(prefix.lower()) or prefix.lower() in course.lower():
                return theme
    return "default"


def section_category(section_id: str) -> str:
    sid = section_id.lower()
    checks = [
        ("title", ("title",)),
        ("hook", ("hook",)),
        ("overview", ("overview", "game_plan", "plan")),
        ("graph_visual", ("graph", "rise", "run")),
        ("formula_or_equation", ("formula", "equation", "points", "two_point")),
        ("trap_or_compare", ("trap", "compare", "wrong", "right")),
        ("answer_reveal", ("answer", "solution", "silence")),
        ("pause_prompt", ("pause",)),
        ("application", ("world", "rate", "application", "case")),
        ("recap", ("recap",)),
        ("path", ("path", "next")),
    ]
    for category, needles in checks:
        if any(needle in sid for needle in needles):
            return category
    return "content"


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


def collect_reviewer_verdicts(folder: Path, script_sha: str | None = None) -> dict[str, Any]:
    verdicts: list[dict[str, str]] = []
    for path in sorted(folder.glob("_review*.json")):
        data = load_json(path)
        if not isinstance(data, dict):
            continue
        reviewer = str(data.get("reviewer") or path.stem)
        verdict = str(data.get("verdict") or "unknown").lower()
        reviewer_script_sha = data.get("script_sha")
        verdicts.append({
            "file": path.name,
            "reviewer": reviewer,
            "verdict": verdict,
            "script_sha": str(reviewer_script_sha) if reviewer_script_sha else "",
            "script_sha_matches": bool(script_sha and reviewer_script_sha == script_sha),
        })
    counts = Counter(v["verdict"] for v in verdicts)
    stale = [v["file"] for v in verdicts if script_sha and not v["script_sha_matches"]]
    return {
        "count": len(verdicts),
        "verdicts": verdicts,
        "counts": dict(counts),
        "stale_or_unbound": stale,
        "has_phd_level": any("phd" in v["reviewer"].lower() or "peer" in v["reviewer"].lower()
                             for v in verdicts),
        "has_adversarial_student": any("student" in v["reviewer"].lower()
                                       or "adversarial" in v["reviewer"].lower()
                                       for v in verdicts),
        "has_citation_checker": any("citation" in v["reviewer"].lower()
                                    or "source" in v["reviewer"].lower()
                                    for v in verdicts),
        "has_expert_lens_alignment": any("expert_lens" in v["file"].lower()
                                         or "expert lens" in v["reviewer"].lower()
                                         or "lens" in v["reviewer"].lower()
                                         for v in verdicts),
        "has_independent_second_pass": any("independent" in v["file"].lower()
                                           or "second_pass" in v["reviewer"].lower()
                                           or "independent" in v["reviewer"].lower()
                                           for v in verdicts),
        "has_source_alignment": any("source_alignment" in v["file"].lower()
                                    or "source alignment" in v["reviewer"].lower()
                                    for v in verdicts),
    }


def expert_lens_tokens(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+(?:[-'][a-z0-9]+)?", str(text).lower())
    return {w for w in words if len(w) >= 4 and w not in EXPERT_LENS_STOPWORDS}


def inspect_expert_lens(folder: Path, script: dict[str, Any]) -> dict[str, Any]:
    packet = load_json(folder / "source_packet.json")
    if not isinstance(packet, dict):
        return {
            "present": False,
            "facets": {},
            "facets_missing": ["insight", "watchFor", "transfer"],
            "error": "Missing source_packet.json",
        }
    lens = packet.get("expert_lens")
    if not isinstance(lens, dict):
        return {
            "present": False,
            "facets": {},
            "facets_missing": ["insight", "watchFor", "transfer"],
            "error": "Missing expert_lens in source_packet.json",
        }

    sections = script.get("sections") or []
    review = load_json(folder / "_review_expert_lens.json")
    review = review if isinstance(review, dict) else {}
    review_verdict = str(review.get("verdict") or "").lower()
    section_tokens = []
    for section in sections:
        sid = str(section.get("id") or "")
        tokens = expert_lens_tokens(f"{sid} {section.get('text') or ''}")
        section_tokens.append((sid, tokens))

    facets: dict[str, Any] = {}
    missing: list[str] = []
    for key in ("insight", "watchFor", "transfer"):
        tokens = expert_lens_tokens(str(lens.get(key) or ""))
        best_sid = ""
        best_overlap: list[str] = []
        for sid, tokens_in_section in section_tokens:
            overlap = sorted(tokens & tokens_in_section)
            if len(overlap) > len(best_overlap):
                best_sid = sid
                best_overlap = overlap
        required_overlap = 1 if len(tokens) <= 3 else 2
        review_sections = review.get(f"{key}_sections") or []
        if key == "watchFor" and not review_sections:
            review_sections = review.get("watch_for_sections") or []
        satisfied_by_review = (
            review_verdict in {"pass", "minor"}
            and isinstance(review_sections, list)
            and any(str(section_id).strip() for section_id in review_sections)
        )
        satisfied = len(best_overlap) >= required_overlap or satisfied_by_review
        if not satisfied:
            missing.append(key)
        facets[key] = {
            "satisfied": satisfied,
            "satisfied_by_review": satisfied_by_review,
            "best_section": best_sid,
            "overlap": best_overlap[:8],
            "review_sections": review_sections[:8] if isinstance(review_sections, list) else [],
            "required_overlap": required_overlap,
            "lens_token_count": len(tokens),
        }

    return {
        "present": True,
        "source": packet.get("expert_lens", {}).get("source"),
        "family": packet.get("expert_lens", {}).get("family"),
        "video_safety_notes": packet.get("expert_lens", {}).get("video_safety_notes") or [],
        "facets": facets,
        "facets_satisfied": [k for k, v in facets.items() if v.get("satisfied")],
        "facets_missing": missing,
    }


def source_label_present(label: str, haystack: str) -> bool:
    label = str(label or "").strip()
    if not label:
        return False
    if re.search(re.escape(label), haystack, flags=re.IGNORECASE):
        return True
    tokens = expert_lens_tokens(label)
    if not tokens:
        return False
    haystack_tokens = expert_lens_tokens(haystack)
    return bool(tokens & haystack_tokens)


def inspect_source_alignment(folder: Path, script: dict[str, Any]) -> dict[str, Any]:
    packet = load_json(folder / "source_packet.json")
    if not isinstance(packet, dict):
        return {
            "present": False,
            "labels_checked": [],
            "labels_visible": [],
            "labels_missing": [],
            "error": "Missing source_packet.json",
        }
    alignment = packet.get("source_alignment")
    if not isinstance(alignment, dict):
        return {
            "present": False,
            "labels_checked": [],
            "labels_visible": [],
            "labels_missing": [],
            "error": "Missing source_alignment in source_packet.json",
        }
    sources = alignment.get("required_visible_sources") or []
    build_text = ""
    try:
        build_text = (folder / "build_slides.py").read_text()
    except Exception:
        pass
    sections = script.get("sections") or []
    narration_text = "\n".join(str(section.get("text") or "") for section in sections)
    combined = f"{build_text}\n{narration_text}"
    checked = [str(source.get("label") or "").strip() for source in sources if source.get("label")]
    visible = [label for label in checked if source_label_present(label, build_text)]
    visible_anywhere = [label for label in checked if source_label_present(label, combined)]
    missing = [label for label in checked if label not in visible]
    raw_urls = re.findall(r"https?://\S+|www\.\S+", narration_text)
    external_platform_refs = []
    for rel, text in (("build_slides.py", build_text), ("script.json narration", narration_text)):
        for match in EXTERNAL_LEARNING_PLATFORM_RE.finditer(text):
            start = max(0, match.start() - 80)
            end = min(len(text), match.end() + 120)
            external_platform_refs.append({
                "file": rel,
                "match": match.group(0),
                "context": re.sub(r"\s+", " ", text[start:end]).strip(),
            })
    return {
        "present": True,
        "policy": alignment.get("policy"),
        "labels_checked": checked,
        "labels_visible": visible,
        "labels_visible_anywhere": visible_anywhere,
        "labels_missing": missing,
        "raw_urls_in_narration": raw_urls,
        "external_platform_refs": external_platform_refs[:10],
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
    visual_categories = sorted({section_category(sid) for sid in ids})
    return {
        "course": script.get("course"),
        "module": script.get("module"),
        "voice": script.get("voice"),
        "voice_rate": script.get("voice_rate"),
        "script_sha": sha256_file(folder / "script.json"),
        "review_script_sha": sha256_review_script(folder / "script.json"),
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
        "visual_categories": visual_categories,
        "visual_category_count": len(visual_categories),
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
    slide_sha = {
        sid: sha256_file(slides_dir / f"{sid}.png")
        for sid in section_ids
        if (slides_dir / f"{sid}.png").exists()
    }
    identical_pause_answer_pairs = []
    for idx, sid in enumerate(section_ids[:-1]):
        lowered = sid.lower()
        if "pause" not in lowered or lowered.endswith("_silence"):
            continue
        nxt = section_ids[idx + 1]
        nlower = nxt.lower()
        if not (nlower.endswith("_silence") or "answer" in nlower or "solution" in nlower):
            continue
        if slide_sha.get(sid) and slide_sha.get(sid) == slide_sha.get(nxt):
            identical_pause_answer_pairs.append([sid, nxt])
    style_manifest = load_json(folder / "style_manifest.json") or {}
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
        "identical_pause_answer_pairs": identical_pause_answer_pairs,
        "style_manifest": style_manifest,
        "slide_count_matches_sections": (not missing_slides and len(slides) >= len(section_ids)) or (folder / ".cleaned").exists(),
        "audio_count_matches_sections": audio_count >= len(section_ids) or (folder / ".cleaned").exists(),
    }


def inspect_learning_checks(folder: Path) -> dict[str, Any]:
    path = folder / "learning_check.json"
    payload = load_json(path)
    checks = payload.get("checks") if isinstance(payload, dict) else None
    checks = checks if isinstance(checks, list) else []
    missing_fields = []
    for idx, check in enumerate(checks, 1):
        if not isinstance(check, dict):
            missing_fields.append(f"check {idx} is not an object")
            continue
        for field in ("skill", "question", "answer", "misconception_tested"):
            if not str(check.get(field, "")).strip():
                missing_fields.append(f"check {idx} missing {field}")
    return {
        "exists": path.exists(),
        "count": len(checks),
        "missing_fields": missing_fields[:10],
    }


def inspect_source_visual_risk(folder: Path) -> dict[str, Any]:
    hits = []
    for rel in ("build_slides.py", "script.json"):
        path = folder / rel
        try:
            text = path.read_text()
        except Exception:
            continue
        for char, note in RISKY_VISUAL_UNICODE.items():
            if char in text:
                hits.append({"file": rel, "char": char, "note": note})
    return {"risky_unicode": hits}


def score_lesson(script_info: dict[str, Any], assets: dict[str, Any],
                 learning_checks: dict[str, Any],
                 source_risk: dict[str, Any],
                 reviewers: dict[str, Any],
                 expert_lens: dict[str, Any],
                 source_alignment: dict[str, Any],
                 youtube: dict[str, Any]) -> dict[str, Any]:
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
        add("minor", "No obvious misconception/trap language; add one common mistake or common trap.")
    if script_info["visual_category_count"] < 6:
        add("minor", f"Only {script_info['visual_category_count']} slide categories detected; add more visual rhythm.")
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
    if assets["identical_pause_answer_pairs"]:
        add("major", f"Pause and answer slides are visually identical: {assets['identical_pause_answer_pairs'][:3]}")
    style_manifest = assets.get("style_manifest") or {}
    expected_theme = expected_theme_name(script_info.get("course"))
    if not style_manifest and not assets["is_cleaned_after_upload"]:
        add("major", "Missing style_manifest.json; cannot verify subject-specific visual theme.")
    elif style_manifest:
        actual_theme = style_manifest.get("theme_name")
        if actual_theme != expected_theme:
            add("major", f"Style theme mismatch: expected {expected_theme}, got {actual_theme}.")
    if not assets["audio_count_matches_sections"] and assets["has_mp4"]:
        add("minor", "Audio artifacts are incomplete even though MP4 exists; may be cleaned or partially generated.")
    if not assets["has_mp4"] and not assets["is_cleaned_after_upload"]:
        add("major", "No MP4 found.")
    if not assets["has_transcript"] and assets["has_mp4"]:
        add("minor", "No transcript.txt found for YouTube CC upload.")

    if not learning_checks["exists"]:
        add("major", "Missing learning_check.json.")
    elif learning_checks["count"] < 3:
        add("major", f"Only {learning_checks['count']} learning checks; require at least 3.")
    if learning_checks["missing_fields"]:
        add("major", f"Learning checks missing required fields: {learning_checks['missing_fields'][:5]}")
    if source_risk["risky_unicode"]:
        add("minor", f"Potentially fragile slide unicode: {source_risk['risky_unicode'][:5]}")

    if not expert_lens.get("present"):
        add("major", str(expert_lens.get("error") or "Missing Expert Lens in source_packet.json."))
    else:
        missing_facets = expert_lens.get("facets_missing") or []
        if len(missing_facets) >= 2:
            add("major", f"Expert Lens facets missing from narration: {missing_facets}")
        elif len(missing_facets) == 1:
            add("minor", f"Expert Lens facet missing from narration: {missing_facets[0]}")

    if not source_alignment.get("present"):
        add("major", str(source_alignment.get("error") or "Missing source_alignment in source_packet.json."))
    else:
        checked_labels = source_alignment.get("labels_checked") or []
        visible_labels = source_alignment.get("labels_visible") or []
        if checked_labels and not visible_labels:
            add("major", f"No required source label appears visibly in build_slides.py: {checked_labels}")
        elif len(visible_labels) < min(1, len(checked_labels)):
            add("minor", "Source alignment has fewer visible labels than expected.")
        if source_alignment.get("raw_urls_in_narration"):
            add("minor", "Narration contains raw URLs while source alignment requires source names only.")
        if source_alignment.get("external_platform_refs"):
            add("major", "Video-visible lesson text directs or labels external learning platforms; use textbook/official sources plus the Learn Portal assignment.")

    if reviewers["count"] == 0:
        add("major", "No reviewer JSON found; needs PhD/adversarial/citation audit before auto-release.")
    else:
        if not reviewers["has_phd_level"]:
            add("minor", "Reviewer set lacks an obvious PhD/peer reviewer.")
        if not reviewers["has_adversarial_student"]:
            add("minor", "Reviewer set lacks adversarial-student clarity check.")
        if not reviewers["has_citation_checker"]:
            add("minor", "Reviewer set lacks citation/source checker.")
        if not reviewers.get("has_expert_lens_alignment"):
            add("minor", "Reviewer set lacks Expert Lens alignment review.")
        if not reviewers.get("has_independent_second_pass"):
            add("minor", "Reviewer set lacks independent second-pass review.")
        if not reviewers.get("has_source_alignment"):
            add("minor", "Reviewer set lacks source-alignment review.")
        if reviewers["counts"].get("critical"):
            add("critical", "At least one reviewer verdict is critical.")
        blocking_verdicts = [
            v for v in reviewers.get("verdicts", [])
            if v.get("verdict") in {"needs_revision", "fail", "failed", "block", "blocked"}
        ]
        if blocking_verdicts:
            add("major", f"Reviewer JSON contains blocking verdicts: {[v['file'] for v in blocking_verdicts[:5]]}")
        if reviewers["stale_or_unbound"]:
            add("major", f"Reviewer JSON is stale or not bound to current script_sha: {reviewers['stale_or_unbound'][:5]}")
        if reviewers["counts"].get("minor", 0) >= 2 and reviewers["counts"].get("pass", 0) == 0:
            add("minor", "Multiple minor reviewer verdicts; schedule content revision pass.")

    if script_info["course"] and "ap " in str(script_info["course"]).lower():
        add("note", "AP course naming should be checked against Course Audit/authorization wording before public claims.")
    if youtube.get("video_id") and not assets["is_cleaned_after_upload"]:
        add("note", "YouTube block exists but folder is not marked .cleaned; cleanup may not have run.")

    weights = {"critical": 100, "major": 20, "minor": 6, "note": 0}
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
    learning_checks = inspect_learning_checks(folder)
    source_risk = inspect_source_visual_risk(folder)
    reviewers = collect_reviewer_verdicts(folder, script_info.get("review_script_sha") or script_info.get("script_sha"))
    expert_lens = inspect_expert_lens(folder, script)
    source_alignment = inspect_source_alignment(folder, script)
    youtube = script.get("youtube") or {}
    score = score_lesson(script_info, assets, learning_checks, source_risk, reviewers, expert_lens, source_alignment, youtube)
    return {
        "slug": folder.name,
        "path": display_path(folder),
        **score,
        "script": script_info,
        "assets": assets,
        "learning_checks": learning_checks,
        "source_risk": source_risk,
        "reviewers": reviewers,
        "expert_lens": expert_lens,
        "source_alignment": source_alignment,
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
