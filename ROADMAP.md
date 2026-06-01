# GIIS Website Roadmap

Last updated: 2026-06-01

This file is the current execution roadmap. Historical slot logs were removed
from the active repo state so daily work starts from current priorities instead
of a long completed-task scroll.

## Current Priority

Keep the school trustworthy and operational while the foundation-video pipeline
stabilizes.

## Active Lanes

### 1. Foundation Video Daily Pipeline

Status: active, Codex-managed, foundation-only.

- Scheduler: `~/.codex/automations/giis-foundation-video-daily/automation.toml`
- Time: 23:00 CT daily.
- Repo runner: `bash tools/lesson-video/foundation_daily.sh`
- Scope: non-AP foundation modules only.
- Max upload volume: 4/day.
- Upload rule: only `yt_queue.py upload --gate-ready`; never
  `upload_lesson.py --force-without-approval`.
- Required gate: clean pass, score 100, MP4, transcript, contact sheet,
  reviewers, learning check, style manifest, and
  `approved_ready_to_upload.json`.

Next check:

- After each 23:00 run, review selected modules, cc progress, gate result,
  upload result, website manifest sync, and any `cc_blocked` report.

### 2. Course And Resource Quality

Status: active watch.

- Course source of truth: `server/prisma/courses/**/*.json`.
- Keep required student resources free/usable.
- Broken YouTube links and hard-blocking external resources should stay out of
  required module flow.
- Khan Academy may remain as a free nonprofit external resource, but it should
  not be the only required learning path when a student could get blocked.

Current evidence:

- `npm run audit:pathways`: 93 pass / 0 warn / 0 fail.
- `node tools/pathway-quality/audit_assessment_parent_trust.js --json`: 93
  pass / 0 warn / 0 fail.
- Completed assessment/resource history is archived in
  `umi/reviews/2026-06-01-course-resource-assessment-summary.md`.

Next check:

- Run resource/link audit before producing videos for a course cohort; treat
  YouTube automation 429s as a separate manual/browser spot-check lane.
- Do a subject-matter spot check on priority courses before using the course
  bank as a public proof point.

### 3. Parent Trust / Admissions / Student Care

Status: maintain.

- Keep public-facing claims conservative around AP, CEEB, Common App,
  accreditation, school code, and college outcomes.
- Student Coordination System Phase 0-3 is implemented locally; production
  deploy should still be treated as a separate deployment decision.
- Official records policy remains: graduated-student records are frozen unless a
  formal correction/reissue path is approved.

Next check:

- Before any production deploy, run the normal build/audit/smoke checklist and
  verify the public copy does not overclaim.

## Paused / Closed

- Old AP-era batch video generation is paused.
- Old macOS GIIS lesson LaunchAgents are removed:
  - `com.giis.lesson-build`
  - `com.giis.youtube-daily`
  - `com.giis.foundation-video-daily`
- AP-facing video production remains closed until Alan/Umi explicitly reopens
  AP authorization-sensitive work.
- Historical completed roadmap entries were removed from the active roadmap.
  Use git history only when old evidence is explicitly needed.

## Working Rule

When daily priority is unclear, read in this order:

1. `/Users/alanhdchu/umi-central/goals.md`
2. This `ROADMAP.md`
3. `umi/workload.md`
4. The relevant playbook or pipeline doc

If central goals and project workload disagree, stop and escalate instead of
silently merging the two.
