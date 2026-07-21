#!/usr/bin/env python3
"""Aggregate every lesson's YouTube identity into one manifest the React app reads.

Walks `teaching-videos/*/script.json`, picks up the `youtube` block written by
`upload_lesson.py`, and emits a single JSON file at
`public/data/lessons-manifest.json`.

The Learn Portal reads that manifest at runtime (it's served as a static asset)
to decide which "Watch the lesson" embed to show on each module page.

Usage:
    python3 tools/youtube-upload/build_manifest.py            # write the manifest
    python3 tools/youtube-upload/build_manifest.py --check    # dry-run, print only

Run this any time after uploading a new lesson.
"""
from __future__ import annotations
import argparse, json, re, wave
from pathlib import Path

from manifest_order import canonical_manifest_rows

REPO = Path(__file__).resolve().parents[2]
LESSONS_DIR = REPO / "teaching-videos"
OUT_PATH = REPO / "public" / "data" / "lessons-manifest.json"

def _course_slug(course: str) -> str:
    """Algebra I → algebra-i, English I → english-i, etc."""
    return re.sub(r"\s+", "-", course.strip().lower())

def _module_number(module: str) -> int | None:
    """'Module 4: Solving One-Step…' → 4"""
    m = re.match(r"\s*Module\s+(\d+)", module, re.IGNORECASE)
    return int(m.group(1)) if m else None

def _module_title(module: str) -> str:
    """Drop the 'Module N:' or 'Module N —' prefix from the module field."""
    return re.sub(r"^\s*Module\s+\d+\s*(?::|：|[—–]|--)\s*", "", module, flags=re.IGNORECASE).strip()

def _total_duration(folder: Path, sections: list[dict]) -> float | None:
    audio = folder / "audio"
    if not audio.is_dir(): return None
    total = 0.0
    for s in sections:
        wav = audio / f"{s['id']}.wav"
        if not wav.exists(): return None
        with wave.open(str(wav)) as w:
            total += w.getnframes() / w.getframerate()
    return total

def collect() -> dict:
    lessons: list[dict] = []
    for folder in sorted(LESSONS_DIR.glob("*")):
        if not folder.is_dir(): continue
        sj = folder / "script.json"
        if not sj.exists(): continue
        script = json.loads(sj.read_text())
        yt = script.get("youtube")
        if not yt:
            continue   # never uploaded yet — skip
        course = script.get("course", "")
        module = script.get("module", "")
        dur = _total_duration(folder, script.get("sections", []))
        lessons.append({
            "lesson_dir":     folder.name,
            "course":         course,
            "course_slug":    _course_slug(course),
            "module_number":  _module_number(module),
            "module_title":   _module_title(module),
            "module_full":    module,
            "duration_seconds": round(dur, 1) if dur else None,
            "youtube_id":     yt["video_id"],
            "url":            yt["url"],
            "embed_url":      yt["embed_url"],
            "playlist":       yt.get("playlist"),
            "playlist_id":    yt.get("playlist_id"),
            "uploaded_at":    yt.get("uploaded_at"),
            "privacy":        yt.get("privacy", "unlisted"),
        })
    by_course, lessons = canonical_manifest_rows(lessons)
    return {
        "generated_at": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc).isoformat(timespec="seconds"),
        "lessons":      lessons,
        "by_course":    by_course,
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="don't write; just print what would be written")
    args = ap.parse_args()
    manifest = collect()
    text = json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"
    if args.check:
        print(text)
        return
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(text)
    n = len(manifest["lessons"])
    print(f"manifest written: {OUT_PATH.relative_to(REPO)}  ({n} lesson{'' if n==1 else 's'})")
    for course, items in manifest["by_course"].items():
        print(f"  {course}: {len(items)} module(s)")
        for it in items:
            print(f"    Module {it['module_number']:>2}  ·  {it['youtube_id']}  ·  {it['module_title']}")

if __name__ == "__main__":
    main()
