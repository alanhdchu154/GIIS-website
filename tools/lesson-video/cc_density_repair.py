#!/usr/bin/env python3
"""Run Claude Code as a bounded narration-density repair worker.

This pass exists to save Opus review/upload slots. It runs after production
artifacts exist but before the independent release reviewer. The worker may
trim narration and refresh production review SHAs, but it may not render,
upload, or edit final media.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LOG_DIR = ROOT / "umi" / "reviews" / "cc-runs"
CC_RATE_LIMIT_RC = 75

sys.path.insert(0, str(ROOT / "tools" / "lesson-video"))
from audit_lessons import audit_lesson, sha256_review_script  # noqa: E402


def display_target(target: Path) -> str:
    try:
        return str(target.relative_to(ROOT))
    except ValueError:
        return str(target)


def summarize_audit(target: Path) -> dict:
    audit = audit_lesson(target)
    script = audit.get("script") or {}
    issues = [
        issue
        for issue in audit.get("issues") or []
        if issue.get("severity") in {"major", "minor", "critical"}
    ]
    return {
        "verdict": audit.get("verdict"),
        "quality_score": audit.get("quality_score"),
        "word_count": script.get("word_count"),
        "avg_words_per_section": script.get("avg_words_per_section"),
        "max_words_in_section": script.get("max_words_in_section"),
        "long_sections": script.get("long_sections"),
        "issues": issues,
    }


def build_prompt(target: Path, attempt: int) -> str:
    rel = display_target(target)
    script_path = target / "script.json"
    script_sha = sha256_review_script(script_path) if script_path.exists() else ""
    audit_summary = summarize_audit(target)
    return f"""You are Claude Code doing a narrow narration-density repair inside {ROOT}.

Target lesson folder: `{rel}`
Attempt: {attempt}
Current review script SHA: `{script_sha}`
Current audit summary:
```json
{json.dumps(audit_summary, ensure_ascii=False, indent=2)}
```

Goal:
- Make the lesson eligible for the strict score-100 gate before independent
  review by trimming narration density only.
- Hard limits: every non-silent section should be <= 100 words, and average
  section length should be <= 85 words.
- Preserve the existing section ids, section order, course/module metadata,
  voice, voice_rate, learning objective, Expert Lens spine, source names, and
  the worked example's mathematical/scientific correctness.

Allowed files:
- `{rel}/script.json`
- `{rel}/_review_A.json`
- `{rel}/_review_B.json`
- `{rel}/_review_C.json`
- `{rel}/_review_expert_lens.json`

Forbidden files/actions:
- Do not edit `build_slides.py`, `slides/`, `audio/`, MP4 files,
  `master_audio.wav`, `transcript.txt`, playlists, manifests, or YouTube
  metadata.
- Do not create or edit `_review_independent_pass.json` or
  `_review_source_alignment.json`; the independent reviewer owns those.
- Do not upload to YouTube.
- Do not run broad filesystem searches.
- Do not make AP, College Board, CEEB, accreditation, Common App, F-1, NCAA,
  admissions, college-credit, or outcome-guarantee claims.

Repair instructions:
1. Read `script.json`.
2. Trim dense narration by removing repetition, setup prose, and extra
   explanation. Prefer one clear sentence plus one concrete example over long
   paragraphs.
3. Keep the same section ids and the same number of sections unless a section
   is already explicitly silent.
4. Do not add raw URLs.
5. After editing `script.json`, compute the current review SHA with:
   `python3 - <<'PY' ...` importing `sha256_review_script` from
   `tools/lesson-video/audit_lessons.py`.
6. Refresh `script_sha` in the allowed production review JSON files only.
7. Run a local word-count check only. Do not render MP4.

Return a concise report:
- sections trimmed
- max words after repair
- average words after repair
- review SHA refreshed
- any remaining blocker
"""


def print_event(obj: dict) -> None:
    typ = obj.get("type")
    if typ == "system" and obj.get("subtype") == "init":
        print(
            f"[cc-density:init] model={obj.get('model')} session={obj.get('session_id')} "
            f"tools={len(obj.get('tools') or [])}",
            flush=True,
        )
        return
    if typ == "stream_event":
        event = obj.get("event") or {}
        etype = event.get("type")
        if etype == "message_start":
            ttft = obj.get("ttft_ms")
            if ttft is not None:
                print(f"[cc-density:first-token] {ttft}ms", flush=True)
        elif etype == "content_block_delta":
            delta = event.get("delta") or {}
            text = delta.get("text")
            if text:
                print(text, end="", flush=True)
        elif etype == "content_block_start":
            block = event.get("content_block") or {}
            if block.get("type") == "tool_use":
                print(f"\n[cc-density:tool] {block.get('name')} {block.get('id')}", flush=True)
        return
    if typ == "result":
        usage = obj.get("usage") or {}
        print(
            "\n[cc-density:result] "
            f"status={obj.get('subtype')} "
            f"duration_ms={obj.get('duration_ms')} "
            f"ttft_ms={obj.get('ttft_ms')} "
            f"cost=${obj.get('total_cost_usd')} "
            f"cache_read={usage.get('cache_read_input_tokens')} "
            f"cache_create={usage.get('cache_creation_input_tokens')}",
            flush=True,
        )


def is_rate_limit_event(obj: dict) -> bool:
    if obj.get("type") == "rate_limit_event":
        return True
    if obj.get("error") == "rate_limit":
        return True
    if obj.get("api_error_status") == 429:
        return True
    result = obj.get("result")
    return isinstance(result, str) and "hit your session limit" in result.lower()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("target", type=Path)
    ap.add_argument("--model", default=os.environ.get("FOUNDATION_CC_MODEL", "sonnet"))
    ap.add_argument("--budget-usd", default="3")
    ap.add_argument("--timeout-seconds", type=int, default=600)
    ap.add_argument("--attempt", type=int, default=1)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    target = args.target if args.target.is_absolute() else ROOT / args.target
    if not target.exists():
        raise SystemExit(f"target not found: {target}")
    if not (target / "script.json").exists():
        raise SystemExit(f"script.json not found: {target / 'script.json'}")

    prompt = build_prompt(target, args.attempt)
    if args.dry_run:
        print(prompt)
        return 0

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")
    log_path = LOG_DIR / f"{stamp}-density-repair-{target.name}.jsonl"
    cmd = [
        "claude",
        "--print",
        "--verbose",
        "--output-format",
        "stream-json",
        "--include-partial-messages",
        "--permission-mode",
        "bypassPermissions",
        "--model",
        str(args.model),
        "--tools",
        "Read,Edit,Write,Bash,Grep",
        "--max-budget-usd",
        str(args.budget_usd),
    ]
    print(f"[cc-density:start] model={args.model} log={log_path}", flush=True)
    proc = subprocess.Popen(
        cmd,
        cwd=ROOT,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    assert proc.stdin is not None
    assert proc.stdout is not None
    proc.stdin.write(prompt)
    proc.stdin.close()

    try:
        rate_limited = False
        success_result = False
        with log_path.open("w", encoding="utf-8") as log:
            for line in proc.stdout:
                log.write(line)
                log.flush()
                try:
                    obj = json.loads(line)
                    rate_limited = rate_limited or is_rate_limit_event(obj)
                    if obj.get("type") == "result" and obj.get("subtype") == "success" and not obj.get("is_error"):
                        success_result = True
                    print_event(obj)
                    if success_result:
                        break
                except json.JSONDecodeError:
                    print(line, end="", flush=True)
        if success_result and proc.poll() is None:
            proc.terminate()
        rc = proc.wait(timeout=10 if success_result else args.timeout_seconds)
        if rate_limited and not success_result:
            print("\n[cc-density:rate-limit] Claude Code session limit reached; stop this batch and retry after reset.", flush=True)
            return CC_RATE_LIMIT_RC
        if success_result:
            return 0
        return rc
    except subprocess.TimeoutExpired:
        proc.terminate()
        print(f"\n[cc-density:timeout] killed after {args.timeout_seconds}s", file=sys.stderr)
        return 124


if __name__ == "__main__":
    raise SystemExit(main())
