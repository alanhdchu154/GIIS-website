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
import selectors
import shutil
import subprocess
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LOG_DIR = ROOT / "umi" / "reviews" / "independent-runs"
CC_RATE_LIMIT_RC = 75
PROVIDERS = ("codex", "claude")
PROVIDER_IDENTITIES = {
    "codex": "codex-cli-independent-video-reviewer",
    "claude": "claude-code-independent-reviewer",
}

sys.path.insert(0, str(ROOT / "tools" / "lesson-video"))
from video_review_evidence import (  # noqa: E402
    EXECUTION_NAME,
    PACKET_NAME,
    RESPONSE_NAME,
    SCHEMA_VERSION,
    sha256_file,
    validate_review_evidence,
    write_review_packet,
)
from local_audio_review import (  # noqa: E402
    RECEIPT_NAME as LOCAL_AUDIO_RECEIPT_NAME,
    validate_local_audio_review,
)


def display_target(target: Path) -> str:
    try:
        return str(target.relative_to(ROOT))
    except ValueError:
        return str(target)


def build_prompt(
    target: Path,
    packet_path: Path,
    packet_sha: str,
    review_scope: str,
    provider: str,
) -> str:
    rel = display_target(target)
    packet_rel = display_target(packet_path)
    scope_instruction = """
For this bounded content-source pass, fully review only canonical_course,
source_packet, script, and learning_check for teaching correctness and student
safety. Verify the packet bindings but do not inspect or extract the MP4. Mark
audiovisual_source_alignment and technical_trust_release HOLD with explicit
scope-gap findings and truthful non-full coverage. This is a completed
content/source review even though release remains held.
""" if review_scope == "content-source" else """
For this full-release pass, review all packet artifacts and the complete MP4.
The packet's version-bound `automated_audio_review` is acceptable complete
automated technical audio coverage when it validates as PASS. Inspect that
receipt and cite `local_audio_review` in audiovisual and technical coverage.
It does not prove human subjective listening or pronunciation quality. Review
the complete visual timeline and use HOLD for any dimension you cannot fully
cover.

For a deterministic still-slide lesson with no animation or transition effects,
`full` visual coverage requires all of the following, not merely a contact sheet
or periodic sampling: inspect every full-resolution rendered slide with one
exact `tools.view_image` wrapper per image; read the entire `slides_concat.txt`
with a literal `cat`; run an untrimmed exact-MP4 full video decode to the null
muxer;
and run whole-file scene-change detection with the exact safe filter
`select=gt(scene\\,0.10),showinfo` to confirm there are no blank, duplicate,
missing, or unexpected visual states between mapped sections. If those checks
cover every source slide, every section, and the entire decoded timeline, they
may be declared `full`. If the lesson has animation, transitions, or any
unmapped visual state, use HOLD because sampled evidence remains `sampled`.
"""
    delivery_instruction = (
        f"Return exactly one JSON object matching the required shape. Do not write any files; "
        f"the reviewer wrapper will write `{rel}/{RESPONSE_NAME}` after it observes a successful run."
    )
    reviewer_identity = PROVIDER_IDENTITIES[provider]
    return f"""You are an independent model reviewer doing a separate second-pass review inside {ROOT}.

Target lesson folder: `{rel}`
Immutable review packet: `{packet_rel}`
Review packet SHA-256: `{packet_sha}`

Read the packet first, then the artifacts required by the selected scope. Do
not read existing `_review*.json` files other than the packet. Their conclusions
are not evidence for this independent pass.
{scope_instruction}

Hard constraints:
- This is a review pass, not a production pass.
- The wrapper has already applied the operating policy. Do not read AGENTS.md,
  SKILL.md, goals.md, ROADMAP.md, workload files, handoff files, storage docs,
  or any other instruction/policy file. Those paths are outside the immutable
  evidence roots and reading them invalidates the review execution.
- Do not edit `script.json`, `build_slides.py`, slides, audio, MP4, transcript,
  playlist, manifest, or YouTube metadata.
- Do not upload to YouTube.
- Do not add or edit `script.json.youtube`.
- For shell inspection, use only literal read-only commands built from cat,
  head/tail with `-n`, wc, ls, pwd, sha256sum/shasum without options,
  rg/grep with only line-number, ignore-case, or fixed-string flags, safe
  `sed -n '<line>[,<line>]p'`, ffprobe, or ffmpeg with a
  stdout hash or null output. Do not use interpreters, network commands, git mutations,
  redirects, command substitution, or variables to construct commands.
- Use exactly one `tools.exec_command` per shell wrapper and emit its output
  plus exit status through this exact expression:
  `text(JSON.stringify({{output:r.output,exit_code:r.exit_code}}));`
  where `r` is the wrapper result; do not add any other call or expression.
- Read every text artifact named in any PASS coverage list through a successful
  literal exact-path shell read. A declared coverage name without observed
  successful access to its bound path cannot support PASS. For full release,
  this includes the bound local-audio receipt.
- Inspect each full-resolution slide with a separate exact wrapper:
  `const r = await tools.view_image({{"path":"<absolute PNG>","detail":"original"}}); image(r.image_url,"original");`
  Do not use loops, arrays, computed paths, or multiple image calls per wrapper.
- For full release, inspect the bound contact sheet with its own exact
  `tools.view_image` wrapper as well as every rendered slide.
- For the complete exact-MP4 visual traversal, use exactly
  `ffmpeg -v error -i <bound-mp4> -map 0:v:0 -f null -`.
- For whole-file scene detection, use exactly
  `ffmpeg -hide_banner -i <bound-mp4> -map 0:v:0 -vf 'select=gt(scene\\,0.10),showinfo' -f null -`.
  Do not add `-threads`, `-an`, `-hash`, or other options to either command.
- Read only the bound artifacts needed for coverage. Do not hash or inspect
  executables, model binaries, ASR derivatives, or other files merely named
  inside a bound receipt.
- {delivery_instruction}
- Do not make AP, College Board, CEEB, accreditation, Common App, F-1, NCAA,
  admissions, college-credit, or outcome-guarantee claims.
- Do not claim full audiovisual coverage unless the packet has a valid exact-MP4
  local audio PASS and the persisted execution contains the required full slide,
  concat, exact-MP4 full-decode traversal, and whole-file scene-detection observations.
  A summary, contact sheet, or self-attested coverage statement is insufficient.
- Do not claim human subject expertise or academic-owner approval. A model pass
  is independent review evidence, not human academic certification.
- Preserve every academic hold in the packet. You may give a concrete safe
  revision recommendation, but you cannot clear or rewrite academic policy.
- Any minor finding still requires revision: mark its dimension REPAIR.
- Every REPAIR/HOLD finding must name the artifact and a section, timestamp,
  JSON path, or exact text locator. Use PASS only when the declared coverage
  supports it. If evidence is missing, use HOLD rather than guessing.
- Reference each finding only from the dimension matching `finding.dimension`.
  If the same underlying issue blocks another dimension, create a separate
  finding whose `dimension` matches that dimension.

Produce exactly one JSON object with this shape:

```json
{{
  "schema_version": "{SCHEMA_VERSION}",
  "review_id": "copy packet.review_id exactly",
  "packet_sha256": "{packet_sha}",
  "reviewer": {{
    "identity": "{reviewer_identity}",
    "actor_type": "model",
    "role": "independent content, source, safety, and release reviewer",
    "independence_attestation": true,
    "observed_model": null
  }},
  "verdict": "PASS | REPAIR | HOLD",
  "summary": "findings-first decision",
  "bindings": "copy packet.artifacts exactly as an object",
  "dimensions": {{
    "source_teaching_correctness": {{"status": "PASS | REPAIR | HOLD", "coverage": {{"level": "full | sampled | metadata | none", "artifacts": ["artifact keys actually reviewed"]}}, "finding_ids": []}},
    "student_safety": {{"status": "PASS | REPAIR | HOLD", "coverage": {{"level": "full | sampled | metadata | none", "artifacts": []}}, "finding_ids": []}},
    "audiovisual_source_alignment": {{"status": "PASS | REPAIR | HOLD", "coverage": {{"level": "full | sampled | metadata | none", "artifacts": []}}, "finding_ids": []}},
    "technical_trust_release": {{"status": "PASS | REPAIR | HOLD", "coverage": {{"level": "full | sampled | metadata | none", "artifacts": []}}, "finding_ids": []}}
  }},
  "findings": [
    {{"id": "F-001", "dimension": "student_safety", "severity": "hold", "location": {{"artifact": "canonical_course", "locator": "modules[0].assignment"}}, "description": "...", "required_action": "..."}}
  ],
  "limitations": "State exactly what was not reviewed or could not be certified."
}}
```

The overall verdict must be HOLD if any dimension is HOLD, otherwise REPAIR if
any is REPAIR, otherwise PASS. Do not add prose before or after the JSON object.
"""


def build_resume_prompt(target: Path, packet_path: Path, packet_sha: str, provider: str) -> str:
    rel = display_target(target)
    packet_rel = display_target(packet_path)
    delivery_instruction = (
        "Return only the completed review JSON object; do not write files."
    )
    return f"""Resume and complete the independent full-release review already in progress.

Target lesson folder: `{rel}`
Immutable review packet: `{packet_rel}`
Review packet SHA-256: `{packet_sha}`

The prior wrapper timed out after your review work but before a successful result
and execution receipt. Keep the original review constraints. Complete any
remaining full MP4/audio coverage needed for an honest verdict. {delivery_instruction}
Use the current packet review_id, packet hash, and exact
artifact bindings. Every finding may be referenced only by its own dimension.
Do not edit lesson source, slides, audio, MP4, manifest, or YouTube state.
"""


def response_schema() -> dict:
    status = {"type": "string", "enum": ["PASS", "REPAIR", "HOLD"]}
    coverage = {
        "type": "object",
        "additionalProperties": False,
        "required": ["level", "artifacts"],
        "properties": {
            "level": {"type": "string", "enum": ["full", "sampled", "metadata", "none"]},
            "artifacts": {"type": "array", "items": {"type": "string"}},
        },
    }
    dimension = {
        "type": "object",
        "additionalProperties": False,
        "required": ["status", "coverage", "finding_ids"],
        "properties": {
            "status": status,
            "coverage": coverage,
            "finding_ids": {"type": "array", "items": {"type": "string"}},
        },
    }
    binding = {
        "type": "object",
        "additionalProperties": False,
        "required": ["path", "sha256", "hash_mode"],
        "properties": {
            "path": {"type": "string"},
            "sha256": {"type": "string"},
            "hash_mode": {"type": "string"},
        },
    }
    artifact_names = [
        "canonical_course", "source_packet", "script", "build_slides",
        "learning_check", "style_manifest", "teaching_brief", "visual_brief",
        "transcript", "contact_sheet", "mp4",
    ]
    return {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "schema_version", "review_id", "packet_sha256", "reviewer", "verdict",
            "summary", "bindings", "dimensions", "findings", "limitations",
        ],
        "properties": {
            "schema_version": {"type": "string"},
            "review_id": {"type": "string"},
            "packet_sha256": {"type": "string"},
            "reviewer": {
                "type": "object",
                "additionalProperties": False,
                "required": ["identity", "actor_type", "role", "independence_attestation", "observed_model"],
                "properties": {
                    "identity": {"type": "string"},
                    "actor_type": {"type": "string"},
                    "role": {"type": "string"},
                    "independence_attestation": {"type": "boolean"},
                    "observed_model": {"type": ["string", "null"]},
                },
            },
            "verdict": status,
            "summary": {"type": "string"},
            "bindings": {
                "type": "object",
                "additionalProperties": False,
                "required": artifact_names,
                "properties": {name: binding for name in artifact_names},
            },
            "dimensions": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "source_teaching_correctness", "student_safety",
                    "audiovisual_source_alignment", "technical_trust_release",
                ],
                "properties": {
                    "source_teaching_correctness": dimension,
                    "student_safety": dimension,
                    "audiovisual_source_alignment": dimension,
                    "technical_trust_release": dimension,
                },
            },
            "findings": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["id", "dimension", "severity", "location", "description", "required_action"],
                    "properties": {
                        "id": {"type": "string"},
                        "dimension": {"type": "string"},
                        "severity": {"type": "string"},
                        "location": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["artifact", "locator"],
                            "properties": {
                                "artifact": {"type": "string"},
                                "locator": {"type": "string"},
                            },
                        },
                        "description": {"type": "string"},
                        "required_action": {"type": "string"},
                    },
                },
            },
            "limitations": {"type": "string"},
        },
    }


def codex_rollout(session_id: str) -> tuple[Path | None, str, str]:
    codex_home = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
    sessions = codex_home / "sessions"
    observed_model = ""
    observed_effort = ""
    for path in sorted(sessions.glob(f"**/*{session_id}.jsonl"), reverse=True):
        matched_session = False
        try:
            for line in path.read_text(encoding="utf-8").splitlines():
                event = json.loads(line)
                payload = event.get("payload") or {}
                if event.get("type") == "session_meta" and str(payload.get("id") or "") == session_id:
                    matched_session = True
                if event.get("type") == "turn_context":
                    observed_model = str(payload.get("model") or observed_model)
                    observed_effort = str(payload.get("effort") or observed_effort)
            if matched_session and observed_model:
                return path, observed_model, observed_effort
        except (OSError, json.JSONDecodeError):
            continue
    return None, "", ""


def print_event(obj: dict) -> None:
    typ = obj.get("type")
    if typ == "thread.started":
        print(f"[codex-review:init] session={obj.get('thread_id')}", flush=True)
        return
    if typ in {"item.started", "item.completed"}:
        item = obj.get("item") or {}
        if item.get("type") in {"command_execution", "mcp_tool_call", "web_search"}:
            print(f"[codex:tool] {item.get('type')} {item.get('id')}", flush=True)
        return
    if typ in {"turn.completed", "turn.failed"}:
        print(f"[codex-review:result] status={typ}", flush=True)
        return
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
    text = json.dumps(obj, ensure_ascii=False).lower()
    return any(marker in text for marker in ("hit your session limit", "rate limit", "usage limit"))


def claude_review_command(executable: str, model: str) -> list[str]:
    return [
        executable,
        "--print",
        "--verbose",
        "--output-format",
        "stream-json",
        "--include-partial-messages",
        "--permission-mode",
        "dontAsk",
        "--model",
        str(model),
        "--tools",
        "Read,Grep,Glob",
        "--allowedTools",
        "Read,Grep,Glob",
        "--strict-mcp-config",
        "--mcp-config",
        '{"mcpServers":{}}',
        "--disable-slash-commands",
    ]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("target", type=Path)
    ap.add_argument("--mp4", required=True, help="Selected current MP4 filename or path inside target.")
    ap.add_argument("--producer-identity", default="codex-video-quality-worker")
    ap.add_argument("--review-scope", choices=("content-source", "full-release"), default="full-release")
    ap.add_argument("--resume-session", help="Resume a timed-out reviewer session without regenerating its packet.")
    ap.add_argument("--provider", choices=PROVIDERS, default=os.environ.get("FOUNDATION_REVIEW_PROVIDER", "codex"))
    ap.add_argument("--model", default=os.environ.get("FOUNDATION_REVIEW_MODEL"))
    ap.add_argument(
        "--reasoning-effort",
        choices=("low", "medium", "high", "xhigh", "max", "ultra"),
        default=os.environ.get("FOUNDATION_REVIEW_REASONING", "high"),
    )
    ap.add_argument("--budget-usd", help="Optional Claude-only spend cap; Codex uses the signed-in plan.")
    ap.add_argument("--timeout-seconds", type=int, default=1200)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not args.model:
        args.model = "gpt-5.6-sol" if args.provider == "codex" else "opus"
    if args.provider == "codex" and args.budget_usd is not None:
        raise SystemExit("--budget-usd is Claude-only; Codex reviewer uses the signed-in plan")
    if args.provider == "claude" and args.review_scope == "full-release":
        raise SystemExit("Claude reviewer lacks the shell/image tools required for full-release evidence; use Codex")
    if args.provider == "codex" and args.resume_session:
        raise SystemExit("Codex reviewer resume is not enabled; start a fresh isolated review session")

    target = args.target if args.target.is_absolute() else ROOT / args.target
    if not target.exists():
        raise SystemExit(f"target not found: {target}")
    mp4 = Path(args.mp4)
    mp4 = mp4 if mp4.is_absolute() else target / mp4
    if args.resume_session:
        packet_path = target / PACKET_NAME
        try:
            packet = json.loads(packet_path.read_text(encoding="utf-8"))
        except Exception as exc:
            raise SystemExit(f"cannot resume without a valid existing packet: {exc}") from exc
        mp4_binding = (packet.get("artifacts") or {}).get("mp4") or {}
        if mp4_binding.get("sha256") != sha256_file(mp4):
            raise SystemExit("cannot resume: selected MP4 no longer matches the existing packet")
        audio = validate_local_audio_review(target, expected_mp4=mp4)
        packet_audio = packet.get("automated_audio_review") or {}
        receipt_binding = packet_audio.get("receipt") or {}
        if (
            not audio.get("valid")
            or audio.get("status") != "PASS"
            or receipt_binding.get("sha256") != sha256_file(target / LOCAL_AUDIO_RECEIPT_NAME)
        ):
            raise SystemExit("cannot resume: packet lacks a current exact-MP4 local audio PASS")
        packet_sha = sha256_file(packet_path) or ""
        prompt = build_resume_prompt(target, packet_path, packet_sha, args.provider)
    else:
        packet_path = write_review_packet(
            target,
            mp4,
            producer_identity=args.producer_identity,
            require_local_audio=args.review_scope == "full-release",
            review_scope=args.review_scope,
        )
        packet_sha = sha256_file(packet_path) or ""
        prompt = build_prompt(target, packet_path, packet_sha, args.review_scope, args.provider)
    if args.dry_run:
        print(prompt)
        return 0

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")
    log_path = LOG_DIR / f"{stamp}-independent-review-{target.name}.jsonl"
    model_output_path = LOG_DIR / f"{stamp}-independent-review-{target.name}-response.json"
    schema_path = LOG_DIR / "review-response-v2.schema.json"
    if args.provider == "codex":
        schema_path.write_text(json.dumps(response_schema(), indent=2) + "\n", encoding="utf-8")
        executable = shutil.which("codex")
        if not executable:
            print("[codex-review:capability-error] Codex CLI is unavailable", file=sys.stderr)
            return 127
        cmd = [
            executable,
            "exec",
            "--json",
            "--skip-git-repo-check",
            "-C",
            str(ROOT),
            "-s",
            "read-only",
            "-m",
            str(args.model),
            "-c",
            f'model_reasoning_effort="{args.reasoning_effort}"',
            "--output-schema",
            str(schema_path),
            "-o",
            str(model_output_path),
            "-",
        ]
    else:
        executable = shutil.which("claude")
        if not executable:
            print("[cc-review:capability-error] Claude CLI is unavailable", file=sys.stderr)
            return 127
        cmd = claude_review_command(executable, args.model)
        if args.resume_session:
            cmd.extend(["--resume", str(args.resume_session)])
        if args.budget_usd is not None:
            cmd.extend(["--max-budget-usd", str(args.budget_usd)])
    print(
        f"[independent-review:start] provider={args.provider} model={args.model} log={log_path}",
        flush=True,
    )
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
        observed_model = ""
        observed_effort = ""
        session_id = ""
        claude_result = None
        deadline = time.monotonic() + args.timeout_seconds
        with log_path.open("w", encoding="utf-8") as log:
            selector = selectors.DefaultSelector()
            selector.register(proc.stdout, selectors.EVENT_READ)
            while proc.poll() is None:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise subprocess.TimeoutExpired(cmd, args.timeout_seconds)
                events = selector.select(timeout=min(1.0, remaining))
                if not events:
                    continue
                line = proc.stdout.readline()
                if not line:
                    break
                log.write(line)
                log.flush()
                try:
                    obj = json.loads(line)
                    rate_limited = rate_limited or is_rate_limit_event(obj)
                    if obj.get("type") == "thread.started":
                        session_id = str(obj.get("thread_id") or "")
                    if obj.get("type") == "turn.completed":
                        success_result = True
                    if obj.get("type") == "system" and obj.get("subtype") == "init":
                        observed_model = str(obj.get("model") or "")
                        session_id = str(obj.get("session_id") or "")
                    if obj.get("type") == "result" and obj.get("subtype") == "success" and not obj.get("is_error"):
                        success_result = True
                        claude_result = obj.get("result")
                    print_event(obj)
                    if success_result:
                        break
                except json.JSONDecodeError:
                    print(line, end="", flush=True)
            selector.close()
        rc = proc.wait(timeout=30 if success_result else args.timeout_seconds)
        if rate_limited and not success_result:
            print(
                f"\n[independent-review:rate-limit] {args.provider} usage limit reached; stop and retry after reset.",
                flush=True,
            )
            return CC_RATE_LIMIT_RC
        if success_result and rc == 0:
            rollout_path = None
            if args.provider == "codex":
                for _ in range(20):
                    rollout_path, observed_model, observed_effort = codex_rollout(session_id)
                    if rollout_path and observed_model:
                        break
                    time.sleep(0.25)
                if not rollout_path or not observed_model:
                    print("\n[codex-review:evidence-error] persisted model/session metadata unavailable", file=sys.stderr)
                    return 3
            response_path = target / RESPONSE_NAME
            try:
                response = json.loads(
                    model_output_path.read_text(encoding="utf-8")
                    if args.provider == "codex" else claude_result
                )
                reviewer = response.setdefault("reviewer", {})
                reviewer["identity"] = PROVIDER_IDENTITIES[args.provider]
                reviewer["actor_type"] = "model"
                reviewer["observed_model"] = observed_model
                response_path.write_text(
                    json.dumps(response, indent=2, ensure_ascii=False) + "\n",
                    encoding="utf-8",
                )
            except Exception as exc:
                print(f"\n[cc-review:evidence-error] invalid or missing response: {exc}", file=sys.stderr)
                return 3
            execution = {
                "schema_version": SCHEMA_VERSION,
                "review_id": response.get("review_id"),
                "packet_sha256": packet_sha,
                "response_sha256": sha256_file(response_path),
                "actor_identity": PROVIDER_IDENTITIES[args.provider],
                "provider": "codex-cli" if args.provider == "codex" else "claude-code",
                "requested_model": str(args.model),
                "observed_model": observed_model,
                "observed_reasoning_effort": observed_effort or None,
                "session_id": session_id,
                "completed_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat(),
                "response_path": display_target(response_path),
                "log_path": display_target(log_path),
                "log_sha256": sha256_file(log_path),
                "paid_budget_flag_used": args.budget_usd is not None,
            }
            if rollout_path:
                execution["rollout_path"] = str(rollout_path)
                execution["rollout_sha256"] = sha256_file(rollout_path)
            if args.provider == "codex":
                execution["model_output_path"] = display_target(model_output_path)
                execution["model_output_sha256"] = sha256_file(model_output_path)
            (target / EXECUTION_NAME).write_text(
                json.dumps(execution, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            validation = validate_review_evidence(target)
            if not validation.get("valid"):
                print(
                    f"[independent-review:evidence-error] {validation.get('errors')}",
                    file=sys.stderr,
                )
                return 3
            print(
                f"[independent-review:evidence] provider={args.provider} "
                f"requested_model={args.model} observed_model={observed_model} "
                f"session={session_id} verdict={validation.get('verdict')} "
                f"response={display_target(response_path)}",
                flush=True,
            )
            return 0
        return rc
    except subprocess.TimeoutExpired:
        proc.terminate()
        print(f"\n[cc-review:timeout] killed after {args.timeout_seconds}s", file=sys.stderr)
        return 124


if __name__ == "__main__":
    raise SystemExit(main())
