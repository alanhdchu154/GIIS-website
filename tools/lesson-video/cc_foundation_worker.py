#!/usr/bin/env python3
"""Run Claude Code as a bounded foundation-video worker.

This wrapper exists because `claude --print` is otherwise quiet until the
whole task finishes. For video work that can look like Claude Code is frozen.
Here we use stream-json, save the raw run log, print lightweight progress,
and enforce a timeout.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LOG_DIR = ROOT / "umi" / "reviews" / "cc-runs"


def build_prompt(handoff: Path, target: str | None) -> str:
    target_line = f"\nTarget lesson folder: {target}\n" if target else ""
    return f"""You are Claude Code working inside {ROOT}.

Follow this handoff exactly:
{handoff}
{target_line}
Hard constraints:
- Work only on non-AP foundation lesson production.
- Do not upload to YouTube.
- Do not edit playlists.
- Do not add a script.json.youtube block.
- Do not create or edit `_review_independent_pass.json` or
  `_review_source_alignment.json`; the separate independent reviewer wrapper
  owns those files after production.
- Do not run broad filesystem searches such as `find /`, `find /Users`, or
  `find /Volumes` to locate Python packages. Use repo-relative paths and the
  pipeline Python environment; if an import/path issue blocks verification, stop
  and report the exact command instead of scanning the whole machine.
- Keep changes scoped to the target lesson folder unless a mechanical pipeline
  bug blocks the work.
- If blocked, stop and report the blocker instead of broad edits.
- After writing files, run the verification commands in the handoff.

Return a concise report with:
- files created/changed
- section count
- slide count
- contact sheet path
- learning check count
- audit verdict
- release gate verdict
- anything Umi must review
"""


def print_event(obj: dict) -> None:
    typ = obj.get("type")
    if typ == "system" and obj.get("subtype") == "init":
        print(
            f"[cc:init] model={obj.get('model')} session={obj.get('session_id')} "
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
                print(f"[cc:first-token] {ttft}ms", flush=True)
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
            "\n[cc:result] "
            f"status={obj.get('subtype')} "
            f"duration_ms={obj.get('duration_ms')} "
            f"ttft_ms={obj.get('ttft_ms')} "
            f"cost=${obj.get('total_cost_usd')} "
            f"cache_read={usage.get('cache_read_input_tokens')} "
            f"cache_create={usage.get('cache_creation_input_tokens')}",
            flush=True,
        )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("handoff", type=Path)
    ap.add_argument("--target", default=None)
    ap.add_argument("--budget-usd", default="3")
    ap.add_argument("--timeout-seconds", type=int, default=900)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    handoff = args.handoff.resolve()
    if not handoff.exists():
        raise SystemExit(f"handoff not found: {handoff}")

    prompt = build_prompt(handoff, args.target)
    if args.dry_run:
        print(prompt)
        return 0

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")
    log_path = LOG_DIR / f"{stamp}-{handoff.stem}.jsonl"

    cmd = [
        "claude",
        "--print",
        "--verbose",
        "--output-format",
        "stream-json",
        "--include-partial-messages",
        "--permission-mode",
        "bypassPermissions",
        "--tools",
        "Read,Write,Edit,Bash,Grep,Glob",
        "--max-budget-usd",
        str(args.budget_usd),
    ]

    print(f"[cc:start] log={log_path}", flush=True)
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
        with log_path.open("w", encoding="utf-8") as log:
            for line in proc.stdout:
                log.write(line)
                log.flush()
                try:
                    print_event(json.loads(line))
                except json.JSONDecodeError:
                    print(line, end="", flush=True)
        return proc.wait(timeout=args.timeout_seconds)
    except subprocess.TimeoutExpired:
        proc.terminate()
        print(f"\n[cc:timeout] killed after {args.timeout_seconds}s", file=sys.stderr)
        return 124


if __name__ == "__main__":
    raise SystemExit(main())
