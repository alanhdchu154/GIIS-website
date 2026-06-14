# Foundation Video Pipeline

Date: 2026-06-14
Status: active v0.4 split-batch foundation loop

## Goal

Make Claude Code able to produce high-quality non-AP foundation videos
repeatably, while Umi remains the academic editor and release authority.

This is the intended loop for every new foundation video:

```text
02:15 / 07:15 / 12:15 CT consolidated Codex producer automation
  -> call bash tools/lesson-video/foundation_daily.sh
  -> choose up to 7 Grade 9 non-AP foundation modules from server/prisma/courses/**/*.json
  -> before a course series starts, run the course-design gate and safe repair
  -> verify module outline and free/usable resource URLs
  -> attach Learn Portal Expert Lens as video-safe big idea/watch-for/transfer guidance
  -> attach source_alignment for visible source labels and reading alignment
  -> write source_packet.json + teaching_brief.md + visual_brief.md
  -> write a bounded cc handoff
  -> cc_foundation_worker.py runs Claude Code with streaming progress
  -> cc_independent_video_reviewer.py runs a separate second-pass review
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
- The project local settings had a stale additional directory. It now points at
  the canonical repo git directory: `/Users/alanhdchu/giis-website/.git`.

The fix is to run cc through a streaming wrapper and keep every assignment
bounded to one handoff and one module.

## Worker Command

Use:

```bash
npm run lesson:cc-foundation -- \
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

Preferred scheduler: Codex automations. Use one consolidated producer cron for
the three split-batch runs, plus a separate read-mostly dashboard monitor.

```text
~/.codex/automations/giis-foundation-video-split-batch/automation.toml
rrule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=2,7,12;BYMINUTE=15;BYSECOND=0"

~/.codex/automations/giis-video-upload-monitor-dashboard/automation.toml
rrule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=20;BYMINUTE=0;BYSECOND=0"
```

The producer automation's only scheduling job is to call the repo-owned runner:

```bash
FOUNDATION_MAX_MODULES=7 FOUNDATION_UPLOAD_MAX=7 bash tools/lesson-video/foundation_daily.sh
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
npm run lesson:foundation-daily
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

## Expert Lens Contract

Each new foundation source packet includes the same Expert Lens family used by
the Learn Portal syllabus UI:

- big idea: the concept/worked-example spine must make this visible
- watch for: the misconception or pause-check must test this risk
- transfer: the application/path slide may use this connection only without
  career, admissions, accreditation, AP, or outcome guarantees

The orchestrator softens authorization-sensitive pathway wording in the video
packet. This keeps the Learn Portal's academic guidance and the public video
handoff aligned without letting foundation videos make claims that belong in a
separate approval track.

## Independent Review And Source Alignment

After production, a separate reviewer invocation writes:

- `_review_independent_pass.json`
- `_review_source_alignment.json`

This reviewer is not allowed to repair the lesson. It can only pass, mark
minor issues, request revision, or block. The release gate also scans
`build_slides.py` for required source labels from `source_packet.source_alignment`.
At least one required source label must be visible on a slide; narration should
use source names and avoid raw URLs.

## Gate Command

Use:

```bash
npm run lesson:foundation-gate -- teaching-videos/algebra-i-module-9-slope-rate-change-v2 --render-mp4
```

If local Python lacks Pillow / edge-tts / imageio-ffmpeg or YouTube API
packages, use the shared GIIS Python toolchain:

```bash
npm run tools:python:bootstrap
npm run lesson:foundation-gate -- teaching-videos/algebra-i-module-9-slope-rate-change-v2 --render-mp4
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

## Upload-Cap Trial

As of the 2026-06-14 automation consolidation, one Codex producer cron runs
three smaller batches each day: max 7 modules and 7 uploads per run, with an
intended ceiling of 21 videos/day unless Alan changes it. A separate 20:00 CT
dashboard monitor is read-mostly and should not produce or upload videos. This
replaces the older three-automation split-batch setup and the earlier single
20-module run because cc became unreliable around the eighth consecutive module.
The cron jobs use `FOUNDATION_CC_BUDGET_USD=10` and
`FOUNDATION_REVIEW_BUDGET_USD=3`. Those values are local guardrails for stuck
Claude Code work, not YouTube quota; do not lower them just because a module
reports an estimated dollar cost under Alan's monthly-plan usage.
The local API quota estimate is intentionally conservative; the daily runner
passes `--ignore-upload-quota-estimate` so a stale local estimate does not
silently cap the trial at a lower number.

If YouTube returns a true video upload limit such as `uploadLimitExceeded` or a
"daily upload limit reached" error, stop the queue and report the last
successful upload count. If only transcript/caption upload returns
`quotaExceeded` after the video, thumbnail, and playlist succeed, count the
video as uploaded and report the caption as a retry item for the next quota
window.
