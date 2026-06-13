# Foundation Lesson Video Playbook

Date: 2026-06-12
Status: active for daily Umi/Codex-approved foundation production

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

- 02:15 / 12:15 / 19:15 CT: Codex automation `giis-foundation-video-daily` calls
  `bash tools/lesson-video/foundation_daily.sh`.
- Default target grade: Grade 9 (`FOUNDATION_TARGET_GRADE=9`).
- Selection is deterministic: Grade 9 course sequence first, then module order;
  failed modules may be retried before new work.
- Before producing a course series, the orchestrator must write/pass
  `teaching-videos/_audit/course-design/<course-slug>.json`.
- If course design fails, run the built-in safe repair path, then review again.
  Proceed only after the repaired course passes; report unresolved blockers.
- Max modules/uploads per run: 7 during the split-batch upload-cap trial.
- Intended daily ceiling: 21 unless Alan changes it.
- Upload privacy: `unlisted`.
- Upload path: `yt_queue.py upload --gate-ready --max 7 --privacy unlisted`.
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
