#!/usr/bin/env python3
"""Verify a foundation lesson folder through the GIIS quality gate."""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def run(cmd: list[str], *, cwd: Path = ROOT) -> None:
    print(f"[gate:run] {' '.join(cmd)}")
    subprocess.run(cmd, cwd=cwd, check=True, stdin=subprocess.DEVNULL)


def newest_audit() -> Path | None:
    audit_dir = ROOT / "teaching-videos" / "_audit" / "lesson-quality"
    files = sorted(audit_dir.glob("*-lesson-quality.json"))
    return files[-1] if files else None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("lesson_folder", type=Path)
    ap.add_argument("--python", default=sys.executable)
    ap.add_argument("--render-mp4", action="store_true")
    args = ap.parse_args()

    folder = args.lesson_folder.resolve()
    if not folder.exists():
        raise SystemExit(f"lesson folder not found: {folder}")
    if not (folder / "script.json").exists():
        raise SystemExit(f"missing script.json: {folder}")

    run([args.python, "build_slides.py"], cwd=folder)
    run([args.python, "tools/lesson-video/make_contact_sheet.py", str(folder)])
    if args.render_mp4:
        run([args.python, "tools/lesson-video/make_lesson.py", str(folder)])
    run([args.python, "tools/lesson-video/audit_lessons.py", str(folder)])
    run([args.python, "tools/lesson-video/lesson_release_gate.py", str(folder), "--check"])

    audit_path = newest_audit()
    if audit_path and audit_path.exists():
        data = json.loads(audit_path.read_text())
        result = (data.get("lessons") or data.get("results") or [{}])[0]
        print(
            "[gate:summary] "
            f"audit={audit_path} "
            f"score={result.get('quality_score')} "
            f"verdict={result.get('verdict')}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
