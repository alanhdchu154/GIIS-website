# Foundation Lesson Video Playbook

Date: 2026-05-30
Status: active for manual, Umi-approved foundation pilots

## Decision

AP lesson generation and AP uploads are deferred until GIIS has explicit
approval to make AP-facing claims. Do not create, title, upload, or describe
new videos as AP lessons unless Alan/Umi explicitly reopens that track.

The next video work should focus on non-controversial foundation courses:
Algebra I, English I, Biology, World History, U.S. History, Government,
Health, and Physical Education.

This is not a full pipeline restart. The paused automation remains paused.
Foundation videos may be produced one at a time from a Umi-approved handoff,
then passed through the normal release gate before upload.

## Umi / Claude Code Split

Umi owns:

- course priority
- lesson scope
- teaching brief
- misconception strategy
- parent-facing trust review
- final upload approval

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

## Acceptance Criteria

A foundation lesson can move to upload review only when all are true:

- module title and order match the course JSON
- no AP or authorization-sensitive wording
- `script.json` sections match slide filenames
- `build_slides.py` renders without errors
- `slides/*.png` count matches section count
- `contact-sheet.jpg` exists and is readable
- `learning_check.json` has 3-6 checks
- transcript exists after rendering
- MP4 exists after rendering
- `audit_lessons.py` reports pass or minor-only notes
- `lesson_release_gate.py` marks the lesson ready
- Umi adds it to the human-visible approval artifact

If any condition fails, leave the lesson in `needs_revision`.
