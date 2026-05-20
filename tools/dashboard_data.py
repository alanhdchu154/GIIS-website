#!/usr/bin/env python3
"""Aggregate lesson-pipeline state into a single JSON blob for the
Cowork dashboard artifact (tools/lesson-dashboard.html).

Reads from the local repo:
  - teaching-videos/<slug>/script.json  → per-module status
  - public/data/lessons-manifest.json   → canonical uploaded list
  - _audit/<course>/*-summary.json      → Cowork pipeline run history
  - `git log`                           → recent commits

Outputs a single JSON object on stdout. The artifact runs:
    python3 tools/dashboard_data.py
and parses the stdout.

Idempotent + read-only. Safe to call any time. ~50ms for ~50 lessons.
"""
from __future__ import annotations
import json, os, subprocess, datetime, re
from pathlib import Path

# Anchor to the repo by walking up from this file. Works whether the script
# is called from /Users/... (macOS) or /sessions/.../mnt/... (sandbox).
REPO     = Path(__file__).resolve().parents[1]
LESSONS  = REPO / 'teaching-videos'
MANIFEST = REPO / 'public/data/lessons-manifest.json'
AUDIT    = REPO / '_audit'


def main():
    out = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc)
                                .isoformat(timespec='seconds'),
        "repo_root": str(REPO),
        "totals": {"uploaded": 0, "pending": 0, "no_mp4": 0, "broken": 0, "total": 0},
        "by_course": {},
        "recent_uploads": [],
        "recent_runs": [],
        "git_recent_commits": [],
        "daily_activity": [],
    }

    # ── per-lesson scan ────────────────────────────────────────────────
    if LESSONS.is_dir():
        for d in sorted(LESSONS.iterdir()):
            if not d.is_dir() or d.name.startswith('.'):
                continue
            sp = d / 'script.json'
            if not sp.exists():
                continue
            try:
                s = json.loads(sp.read_text())
            except Exception:
                out["totals"]["broken"] += 1
                continue

            yt   = s.get('youtube') or {}
            vid  = yt.get('video_id')
            mp4s = list(d.glob('*.mp4'))
            course        = s.get('course', '?')
            module_label  = s.get('module', '?')

            order = None
            m = re.match(r'Module\s+(\d+)', module_label or '')
            if m:
                order = int(m.group(1))

            if vid:        status = 'uploaded'
            elif mp4s:     status = 'pending'
            else:          status = 'no_mp4'

            out["totals"][status] += 1
            out["totals"]["total"] += 1

            c = out["by_course"].setdefault(course, {
                "uploaded": 0, "pending": 0, "no_mp4": 0, "modules": []
            })
            c[status] += 1
            c["modules"].append({
                "slug":        d.name,
                "order":       order if order is not None else 999,
                "title":       module_label,
                "status":      status,
                "youtube_id":  vid,
                "url":         yt.get('url'),
                "uploaded_at": yt.get('uploaded_at') or yt.get('published_at'),
            })

    # Sort modules by order within each course.
    for c in out["by_course"].values():
        c["modules"].sort(key=lambda x: x["order"])

    # ── recent uploads from manifest ───────────────────────────────────
    if MANIFEST.exists():
        try:
            m = json.loads(MANIFEST.read_text())
            all_lessons = []
            for course, lessons in m.get('by_course', {}).items():
                for L in lessons:
                    all_lessons.append({**L, "course": course})
            all_lessons.sort(key=lambda x: x.get('published_at') or '', reverse=True)
            out["recent_uploads"] = all_lessons[:10]
        except Exception:
            pass

    # ── recent audit runs ──────────────────────────────────────────────
    if AUDIT.is_dir():
        for course_dir in AUDIT.iterdir():
            if not course_dir.is_dir(): continue
            for f in sorted(course_dir.glob('*-summary.json'), reverse=True)[:3]:
                try:
                    dd = json.loads(f.read_text())
                    produced = dd.get('produced') or []
                    out["recent_runs"].append({
                        "course":          dd.get('course'),
                        "timestamp":       dd.get('timestamp'),
                        "mode":            dd.get('mode'),
                        "produced_count":  len(produced),
                        "produced_titles": [
                            (p.get('title') or p.get('slug') or '?') if isinstance(p, dict) else str(p)
                            for p in produced
                        ][:5],
                        "halted_count":    len(dd.get('halted') or []),
                    })
                except Exception:
                    pass
        out["recent_runs"].sort(key=lambda x: x['timestamp'] or '', reverse=True)
        out["recent_runs"] = out["recent_runs"][:5]

    # ── daily activity timeline ────────────────────────────────────────
    # For each calendar day (local Mac time UTC for simplicity), aggregate:
    #   - "generated" — modules Cowork produced that day (from _audit summaries)
    #   - "uploaded"  — lessons whose youtube.uploaded_at falls on that day
    daily = {}  # date_str -> {"generated": [...], "uploaded": [...]}

    def _day_key(iso_str):
        # Accept both "2026-05-15T14:00:14+00:00" and "2026-05-15T14:00:14Z"
        if not iso_str: return None
        s = iso_str.replace('Z', '+00:00')
        try:
            dt = datetime.datetime.fromisoformat(s)
            return dt.date().isoformat()
        except Exception:
            return iso_str[:10] if len(iso_str) >= 10 else None

    # Generated events come from the _audit summaries we already loaded.
    # `produced` items may be either:
    #   - dicts like {"slug": ..., "title": ..., ...}
    #   - bare strings (just the slug) — newer Cowork runs sometimes write this
    # Normalize both into the same shape downstream consumers expect.
    if AUDIT.is_dir():
        for course_dir in AUDIT.iterdir():
            if not course_dir.is_dir(): continue
            for f in sorted(course_dir.glob('*-summary.json')):
                try:
                    dd = json.loads(f.read_text())
                except Exception:
                    continue
                day = _day_key(dd.get('timestamp'))
                if not day: continue
                bucket = daily.setdefault(day, {"generated": [], "uploaded": []})
                for p in (dd.get('produced') or []):
                    if isinstance(p, dict):
                        slug  = p.get('slug')
                        title = p.get('title') or slug
                    else:  # string (just a slug)
                        slug  = str(p)
                        # Reconstruct a readable title from slug if possible
                        title = slug.split('-module-', 1)[-1].replace('-', ' ').title() if slug else '?'
                    bucket["generated"].append({
                        "slug":   slug,
                        "title":  title,
                        "course": dd.get('course'),
                    })

    # Uploaded events come from script.json youtube.uploaded_at.
    if LESSONS.is_dir():
        for d in sorted(LESSONS.iterdir()):
            if not d.is_dir() or d.name.startswith('.'): continue
            sp = d / 'script.json'
            if not sp.exists(): continue
            try:
                s = json.loads(sp.read_text())
            except Exception:
                continue
            yt = s.get('youtube') or {}
            ts = yt.get('uploaded_at') or yt.get('published_at')
            day = _day_key(ts)
            if not day: continue
            bucket = daily.setdefault(day, {"generated": [], "uploaded": []})
            bucket["uploaded"].append({
                "slug":   d.name,
                "title":  s.get('module') or d.name,
                "course": s.get('course'),
                "url":    yt.get('url'),
                "time":   ts,
            })

    # Sort each day's uploaded list by time, then sort days descending.
    out["daily_activity"] = []
    for day in sorted(daily.keys(), reverse=True)[:14]:  # 2 weeks
        b = daily[day]
        b["uploaded"].sort(key=lambda x: x.get('time') or '')
        out["daily_activity"].append({
            "date":      day,
            "generated": b["generated"],
            "uploaded":  b["uploaded"],
        })

    # ── git log ────────────────────────────────────────────────────────
    try:
        log = subprocess.check_output(
            ['git', '-C', str(REPO), 'log', '--oneline', '-10', '--format=%h|%s|%cr'],
            stderr=subprocess.DEVNULL,
        ).decode()
        for line in log.strip().splitlines():
            parts = line.split('|', 2)
            if len(parts) == 3:
                out["git_recent_commits"].append({
                    "sha":     parts[0],
                    "subject": parts[1],
                    "when":    parts[2],
                })
    except Exception:
        pass

    print(json.dumps(out))


if __name__ == "__main__":
    main()
