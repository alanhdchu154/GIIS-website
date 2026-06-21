#!/usr/bin/env python3
"""Run an independent second-pass review for one foundation lesson video.

This is intentionally separate from `cc_foundation_worker.py`. The production
worker creates the lesson; this reviewer inspects the finished lesson and writes
review artifacts that the release gate can audit.
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
from audit_lessons import sha256_review_script  # noqa: E402


def display_target(target: Path) -> str:
    try:
        return str(target.relative_to(ROOT))
    except ValueError:
        return str(target)


def build_prompt(target: Path, script_sha: str) -> str:
    rel = display_target(target)
    return f"""You are Claude Code doing an independent second-pass review inside {ROOT}.

Target lesson folder: `{rel}`
Review script SHA: `{script_sha}`

Read only these lesson artifacts unless a directly related file is needed:
- `{rel}/source_packet.json`
- `{rel}/teaching_brief.md`
- `{rel}/visual_brief.md`
- `{rel}/script.json`
- `{rel}/build_slides.py`
- `{rel}/learning_check.json`
- `{rel}/style_manifest.json`
- `{rel}/contact-sheet.jpg` if your tools can inspect it usefully
- existing `{rel}/_review*.json`

Hard constraints:
- This is a review pass, not a production pass.
- Do not edit `script.json`, `build_slides.py`, slides, audio, MP4, transcript,
  playlist, manifest, or YouTube metadata.
- Do not upload to YouTube.
- Do not add or edit `script.json.youtube`.
- Do not make AP, College Board, CEEB, accreditation, Common App, F-1, NCAA,
  admissions, college-credit, or outcome-guarantee claims.
- If the lesson fails, write review JSON with `verdict: "needs_revision"` or
  `verdict: "block"` and explain the exact issue. Do not fix it.

Write exactly these two files:

1. `{rel}/_review_independent_pass.json`

Schema:
```json
{{
  "reviewer": "independent_second_pass",
  "verdict": "pass | minor | needs_revision | block",
  "script_sha": "{script_sha}",
  "summary": "...",
  "parent_trust_findings": ["..."],
  "learning_effectiveness_findings": ["..."],
  "risk_findings": ["..."],
  "required_fixes": []
}}
```

2. `{rel}/_review_source_alignment.json`

Schema:
```json
{{
  "reviewer": "source_alignment",
  "verdict": "pass | minor | needs_revision | block",
  "script_sha": "{script_sha}",
  "visible_source_labels": ["..."],
  "source_sections": ["..."],
  "reading_alignment": "...",
  "raw_url_check": "pass | fail",
  "required_fixes": []
}}
```

Pass criteria:
- `source_packet.json` has `expert_lens` and `source_alignment`.
- The lesson narration visibly uses the Expert Lens big idea, watch-for risk,
  and transfer guidance.
- At least one required source label from `source_alignment.required_visible_sources`
  appears in `build_slides.py` as on-slide text, preferably concept,
  application, recap, or path.
- `script.json` narration does not read raw URLs.
- The lesson feels like a serious school lesson a parent could trust, not a
  generic AI explainer.

Return a concise report listing the two files written and the verdicts.
"""


def print_event(obj: dict) -> None:
    typ = obj.get("type")
    if typ == "system" and obj.get("subtype") == "init":
        print(
            f"[cc-review:init] model={obj.get('model')} session={obj.get('session_id')} "
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
                print(f"[cc-review:first-token] {ttft}ms", flush=True)
        elif etype == "content_block_delta":
            delta = event.get("delta") or {}
            text = delta.get("text")
            if text:
                print(text, end="", flush=True)
        elif etype == "content_block_start":
            block = event.get("content_block") or {}
            if block.get("type") == "tool_use":
                print(f"\n[cc:tool] {block.get('name')} {block.get('id')}", flush=True)
        return
    if typ == "result":
        usage = obj.get("usage") or {}
        print(
            "\n[cc-review:result] "
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
    ap.add_argument("--model", default=os.environ.get("FOUNDATION_REVIEW_MODEL", "opus"))
    ap.add_argument("--budget-usd", default="2")
    ap.add_argument("--timeout-seconds", type=int, default=420)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    target = args.target if args.target.is_absolute() else ROOT / args.target
    if not target.exists():
        raise SystemExit(f"target not found: {target}")
    script_path = target / "script.json"
    if not script_path.exists():
        raise SystemExit(f"script.json not found: {script_path}")
    script_sha = sha256_review_script(script_path) or ""
    prompt = build_prompt(target, script_sha)
    if args.dry_run:
        print(prompt)
        return 0

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")
    log_path = LOG_DIR / f"{stamp}-independent-review-{target.name}.jsonl"
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
        "Read,Write,Grep,Glob,Bash",
        "--max-budget-usd",
        str(args.budget_usd),
    ]
    print(f"[cc-review:start] model={args.model} log={log_path}", flush=True)
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
            print(
                "\n[cc-review:rate-limit] Claude Code session limit reached; stop this batch and retry after reset.",
                flush=True,
            )
            return CC_RATE_LIMIT_RC
        if success_result:
            return 0
        return rc
    except subprocess.TimeoutExpired:
        proc.terminate()
        print(f"\n[cc-review:timeout] killed after {args.timeout_seconds}s", file=sys.stderr)
        return 124


if __name__ == "__main__":
    raise SystemExit(main())
