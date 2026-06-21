# Foundation Lesson Video Playbook

Date: 2026-06-18
Status: active 40-capacity video-first trial

## Decision

AP lesson generation and AP uploads are deferred until GIIS has explicit
approval to make AP-facing claims. Do not create, title, upload, or describe
new videos as AP lessons unless Alan/Umi explicitly reopens that track.

The next video work should focus on non-controversial foundation courses:
Algebra I, English I, Biology, World History, U.S. History, Government,
Health, and Physical Education.

This is a controlled foundation-only restart, not a return to the old AP-era
batch pipeline. New foundation videos are produced by
`foundation_daily_orchestrator.py`: Codex/Umi prepares the source packet and
quality brief, Claude Code produces the lesson mechanics, then Codex/Umi runs
the strict gate and writes the upload approval artifact.

## Umi / Claude Code Split

Umi owns:

- course priority
- lesson scope
- source packet
- Learn Portal Expert Lens alignment
- free/usable resource check
- teaching brief
- visual brief
- misconception strategy
- parent-facing trust review
- final upload approval artifact

Claude Code owns:

- reading the course JSON source of truth
- producing `script.json`
- producing deterministic `build_slides.py`
- rendering slides
- creating `contact-sheet.jpg`
- creating `learning_check.json`
- running audits and release gate checks
- fixing mechanical pipeline issues

Claude Code must not:

- select AP work independently
- decide that an MP4 is uploadable
- use stale `script.json.youtube` metadata as truth
- use `--force-without-approval`
- invent school authorization, College Board, Common App, or accreditation claims
- upload to YouTube without a Umi-approved `approved_ready_to_upload` artifact

The daily orchestrator treats Claude Code as blocked if it times out, exits
non-zero, or produces no tool progress. Blocked modules are retried before new
modules, but after two failed attempts they require Umi repair rather than
silent repetition.

## Naming Rules

Use the published course JSON as the source of truth:

```text
server/prisma/courses/**/*.json
```

Folder slug:

```text
teaching-videos/<course-slug>-module-<order>-<short-topic>-v2/
```

Examples:

```text
teaching-videos/algebra-i-module-9-slope-rate-change-v2/
teaching-videos/english-i-module-1-active-reading-v2/
```

YouTube title:

```text
GIIS <Course> | Module <NN>: <Published Module Title>
```

Examples:

```text
GIIS Algebra I | Module 09: Slope & Rate of Change
GIIS English I | Module 01: Active Reading
```

Description must be conservative:

```text
Genesis Innovative International School lesson video for <Course>,
Module <NN>: <Published Module Title>. This video supports the GIIS Learn
Portal module and should be used with the assigned reading, practice, and
teacher feedback.
```

Do not include AP, College Board, Common App, NCAA, CEEB, accreditation, or
college admissions claims in foundation lesson titles or descriptions.

## First Foundation Queue

1. Algebra I Module 9: Slope & Rate of Change
   - reason: non-AP, high-value foundation math, stale GIIS YouTube metadata was
     removed, and the module is currently missing from the GIIS lesson manifest
2. English I Module 1
   - reason: already has one GIIS internal video but needs a V2 quality review
3. Algebra I visible backlog
   - reason: existing videos need post-hoc review before they can be trusted as
     stable examples
4. Biology / World History / U.S. History
   - reason: core foundation subjects with less AP-authorization risk

## Daily Schedule

- Current Codex automation: `GIIS_影片_pipeline`, stored under
  `~/.codex/automations/giis-foundation-video-split-batch/automation.toml`,
  is active as a 40-capacity trial as of 2026-06-18.
- Before resuming, run the read-only lane report:
  `npm run lesson:pipeline-lanes`.
- The automation runs as one hourly heartbeat in the fixed
  `GIIS_影片_producer` chat.
- 03:00 / 08:00 / 13:00 / 18:00 CT producer slots call
  `FOUNDATION_MAX_MODULES=10 FOUNDATION_UPLOAD_MAX=10 FOUNDATION_CC_MODEL=sonnet FOUNDATION_REVIEW_MODEL=opus FOUNDATION_CC_BUDGET_USD=10 FOUNDATION_REVIEW_BUDGET_USD=3 bash tools/lesson-video/foundation_daily.sh`.
- 20:00 CT checks queue, pending release gate, manifest alignment, dashboard,
  and today's successful non-AP foundation upload count from local
  `teaching-videos/**/script.json` YouTube fields. If the count is below 40,
  run one bounded top-up batch with `min(gap, 10)` modules/uploads, then update
  the dashboard.
- Outside 03/08/13/18/20 CT, the heartbeat should skip heavy work and not read
  repo state, run git/npm/Python/cc, or touch files.
- Default target grade: Grade 10 (`FOUNDATION_TARGET_GRADE=10`) for the active
  upload-cap trial. Selection is deterministic by grade course sequence, then
  module order; failed modules may be retried before new work.
- Before producing a course series, the orchestrator must write/pass
  `teaching-videos/_audit/course-design/<course-slug>.json`.
- If course design fails, run the built-in safe repair path, then review again.
  Proceed only after the repaired course passes; report unresolved blockers.
- Max modules/uploads per producer run: 10.
- Current experimental daily target: 40 uploaded non-AP foundation lessons when
  gates remain clean. Do not chase this number by forcing weak lessons through
  the quality gate.
- Claude Code model routing: foundation video production is repetitive
  mechanics and should default to `FOUNDATION_CC_MODEL=sonnet`; the independent
  second-pass/source-alignment review is release judgment and should default to
  `FOUNDATION_REVIEW_MODEL=opus`.
- Claude Code guardrails: production budget is `FOUNDATION_CC_BUDGET_USD=10`
  per module and independent-review budget is `FOUNDATION_REVIEW_BUDGET_USD=3`.
  These are local stop conditions, not YouTube quota; keep them high enough for
  heavier science lessons while still bounding stuck modules.
- Throughput guardrail: ten modules is a slot cap, not a guaranteed fill.
  Recent Grade 10 runs show fresh production usually costs about 7-14 minutes
  per lesson plus about 1-2 minutes for the independent Opus review. If Claude
  Code reports the five-hour session limit, stop the batch and resume after the
  displayed reset instead of selecting more modules.
- T9 symlink guardrail: `teaching-videos/` lives on T9. Every generated
  `build_slides.py` must use the handoff's robust `slide_kit` bootstrap; do not
  use `Path(__file__).resolve().parents[...]`, which resolves through
  `/Volumes/T9-Active` and can make `slide_kit` disappear.
- Upload privacy: `unlisted`.
- Upload path: `yt_queue.py upload --gate-ready --max <FOUNDATION_UPLOAD_MAX> --privacy unlisted`.
- The local quota estimate is conservative and the daily runner may override it
  during the trial. Stop only for a true video upload/channel-limit error.
- If transcript/caption upload alone hits `quotaExceeded` after the video,
  thumbnail, and playlist succeed, treat the video as uploaded and retry the
  caption in a later quota window.
- Website update: successful upload triggers `sync_channel.py --apply`, then
  the orchestrator can commit/push manifest and lesson metadata.
- The legacy `daily_build.sh` and `tools/youtube-upload/daily.sh` wrappers were
  removed; the foundation orchestrator calls the gated upload queue directly.
- Do not install a macOS LaunchAgent for this daily foundation pipeline unless
  Alan explicitly asks for a system-level fallback.

## Lane Split During 40-Capacity Trial

During the 40-capacity trial, keep video production separate from reconciliation
and quality-debt work. Choose one lane:

- Producer lane: new video creation and gate-ready upload in the approved
  03/08/13/18 CT video-first slots.
- Active default target: Grade 10. Grade 9 is complete for the current local
  uploaded queue, so normal automation should not fall back to Grade 9 unless
  `FOUNDATION_TARGET_GRADE=9` is intentionally set for a repair/retry pass.
- Upload lane: already rendered and approved pending videos, bounded/manual
  when needed.
- Quality-debt lane: old `needs_revision` repair, small batches only.
- Reconciliation lane: captions, thumbnails, manifest/channel sync, and cleanup
  after quota reset or when explicitly scheduled. Playlist membership is part
  of normal daily uploads; separate playlist backfill is only for historical
  gaps. Standard captions remain backlog unless Alan authorizes a caption slot
  or the end-of-day workflow has spare quota after video/playlist work.

## Acceptance Criteria

A foundation lesson can move to upload review only when all are true:

- module title and order match the course JSON
- source packet exists and cites the course JSON
- source packet includes video-safe Expert Lens guidance
- source packet includes visible source-alignment guidance
- concept/worked example, misconception/pause, and application/path visibly use
  the Expert Lens big idea, watch-for risk, and transfer guidance
- at least one required source label from the packet is visible on-slide
- required external resources are free/usable and not hard-blocking
- no AP or authorization-sensitive wording
- `script.json` sections match slide filenames
- `build_slides.py` renders without errors
- `slides/*.png` count matches section count
- `contact-sheet.jpg` exists and is readable
- `style_manifest.json` exists and matches the course subject theme
- `learning_check.json` has 3-6 checks
- reviewer files are bound to the current `script.json` SHA
- `_review_expert_lens.json` identifies the sections that satisfy the
  big idea, watch-for risk, and transfer guidance
- `_review_independent_pass.json` is written by the separate second-pass
  reviewer, not the production worker
- `_review_source_alignment.json` confirms visible source labels and reading
  alignment
- pause prompt and answer reveal slides are visually different
- transcript exists after rendering
- MP4 exists after rendering
- `audit_lessons.py` reports clean `pass`
- `lesson_release_gate.py` marks the lesson ready with clean `pass` / score 100
- Umi/Codex adds it to `approved_ready_to_upload.json`

If any condition fails, leave the lesson in `needs_revision`.
