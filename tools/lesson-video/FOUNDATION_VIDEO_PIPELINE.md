# Foundation Video Pipeline

Date: 2026-05-30
Status: active v0.2 daily foundation loop

## Goal

Make Claude Code able to produce high-quality non-AP foundation videos
repeatably, while Umi remains the academic editor and release authority.

This is the intended loop for every new foundation video:

```text
23:00 CT Codex automation
  -> call bash tools/lesson-video/foundation_daily.sh
  -> choose 2-3 Grade 9 non-AP foundation modules from server/prisma/courses/**/*.json
  -> before a course series starts, run the course-design gate and safe repair
  -> verify module outline and free/usable resource URLs
  -> write source_packet.json + teaching_brief.md + visual_brief.md
  -> write a bounded cc handoff
  -> cc_foundation_worker.py runs Claude Code with streaming progress
  -> foundation_video_gate.py renders/checks slides, MP4, transcript, contact sheet
  -> lesson_release_gate.py requires clean pass / score 100
  -> orchestrator writes approved_ready_to_upload.json
  -> yt_queue.py upload --gate-ready --privacy unlisted
  -> sync_channel.py --apply updates the Learn Portal manifest
```

Alan selected fully automatic daily upload. In implementation terms this means
"automatic after Umi/Codex approval artifact", not direct upload. If the
approval artifact is missing, `yt_queue.py` and `upload_lesson.py` refuse the
upload.

## Why Claude Code Felt Slow

Observed on 2026-05-30:

- `claude --print` returns no progress until the whole task is complete.
- A one-line `OK` response starts in about 2-3 seconds, so startup is not the
  main bottleneck.
- Claude Code loads a large cached project context, about 29k cached tokens in
  this repo.
- `claude mcp list` showed Netlify failing to connect and Stripe needing auth,
  so health checks can be slower than normal generation.
- The project local settings had a stale additional directory pointing at the
  old `/Users/alanhdchu/GIIS/giis-website/.git` path. It now points at
  `/Users/alanhdchu/giis-website/.git`.

The fix is to run cc through a streaming wrapper and keep every assignment
bounded to one handoff and one module.

## Worker Command

Use:

```bash
python3 tools/lesson-video/cc_foundation_worker.py \
  umi/handoffs/2026-05-30-foundation-video-v2-pilot.md \
  --target teaching-videos/algebra-i-module-9-slope-rate-change-v2 \
  --budget-usd 3 \
  --timeout-seconds 900
```

The wrapper:

- uses `stream-json` so progress appears while cc works
- saves raw logs under `umi/reviews/cc-runs/`
- enforces a timeout
- restricts cc to file/read/edit/bash tools for this worker
- passes a hard no-upload / no-AP contract

## Daily Orchestrator

Preferred scheduler: Codex automation.

```text
~/.codex/automations/giis-foundation-video-daily/automation.toml
rrule = "FREQ=DAILY;BYHOUR=23;BYMINUTE=0;BYSECOND=0"
```

The automation's only scheduling job is to call the repo-owned runner:

```bash
bash tools/lesson-video/foundation_daily.sh
```

Keep the pipeline logic in this repository so changes can be reviewed,
committed, and rolled back like normal code. Do not use a macOS LaunchAgent for
normal foundation-video scheduling.

Dry-run:

```bash
npm run lesson:foundation-daily:dry-run
```

Full run:

```bash
python3 tools/lesson-video/foundation_daily_orchestrator.py \
  --target-grade 9 \
  --max-modules 3 \
  --upload-max 4 \
  --privacy unlisted \
  --auto-commit
```

The orchestrator records retry/blocking state under
`teaching-videos/_audit/foundation-daily/`. If Claude Code times out, returns
non-zero, or produces no tool progress, the module is marked `cc_blocked` and
will be prioritized for retry before new modules. After two failed attempts, it
requires Umi repair instead of silent repetition.

## Course And Series Order

The selector is deterministic, not random. The current default target grade is
Grade 9. Within Grade 9, the core sequence starts:

1. Algebra I
2. English I
3. Biology
4. World History
5. Physical Education
6. Health & Wellness
7. Digital Literacy

After those, remaining Grade 9 courses are considered in the repository-owned
sequence defined in `foundation_daily_orchestrator.py`.

Before the first unfinished module in a course series is produced, the
orchestrator writes/refreshes:

```text
teaching-videos/_audit/course-design/<course-slug>.json
```

The course-design gate checks that the course belongs to the target grade, is
not AP/authorization-sensitive, has a reasonable module count for its credits,
uses consecutive module order, and has module titles, objectives, assignments,
resource URLs, and hour estimates.

If the design is unreasonable, the orchestrator first attempts a conservative
repo-owned repair before video production. Safe repairs include adding missing
course descriptions, department metadata, module objectives, assignment prompts,
and estimated hours. It does not invent external resource URLs, add/delete whole
modules, change grade placement, reopen AP work, or resolve duplicate/blank
module titles; those remain blocked and are reported for Alan/Umi review. After
repair, the course is reviewed again and only proceeds if the second review
passes.

## Gate V2

As of 2026-05-30, the foundation gate also checks:

- subject style manifest exists and matches the course theme
- pause prompt and answer reveal slides are not visually identical
- the lesson has enough visual/category rhythm
- reviewer JSON is bound to the current `script.json` SHA
- `learning_check.json` exists with required skill/question/answer/misconception fields
- fragile unicode labels that often render poorly in slides are flagged

`make_lesson.py` narrates answer-reveal sections when they contain text. Use
`"silent": true` only when a section is intentionally silent.

Upload readiness defaults to a clean gate:

- audit verdict must be `pass`
- quality score must be 100
- `pass_with_minor_notes` stays in revision unless an operator explicitly uses
  `--allow-minor-notes`

## Gate Command

Use:

```bash
python3 tools/lesson-video/foundation_video_gate.py \
  teaching-videos/algebra-i-module-9-slope-rate-change-v2 \
  --render-mp4
```

If local Python lacks Pillow / edge-tts / imageio-ffmpeg, create a temporary
venv:

```bash
python3 -m venv /tmp/giis-video-venv
/tmp/giis-video-venv/bin/python -m pip install Pillow edge-tts imageio-ffmpeg
/tmp/giis-video-venv/bin/python tools/lesson-video/foundation_video_gate.py \
  teaching-videos/algebra-i-module-9-slope-rate-change-v2 \
  --render-mp4 \
  --python /tmp/giis-video-venv/bin/python
```

## Release Rule

`ready` from `lesson_release_gate.py` means ready for Umi/Codex approval. For
the daily foundation loop, Umi/Codex approval is represented by an entry in
`teaching-videos/_audit/release-gate/approved_ready_to_upload.json`.

Upload still requires:

- a clean foundation gate and release gate
- Codex/Umi approval artifact
- no AP / authorization-sensitive claims
- gated queue upload

Do not use direct upload scripts for normal operations.
