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

Assessment audit note, 2026-05-31:

- Current course bank has 93 courses, 993 modules, 3,969 module quiz questions,
  1,395 midterm questions, 1,860 final questions, and one assignment prompt per
  module.
- `node tools/pathway-quality/audit_courses.js --json` reports 93 pass / 0
  warn / 0 fail. Required module reading, video, practice, assignment,
  objectives, quiz, midterm, and final coverage is complete at the automated
  course-audit level.
- Assessment wording repair implemented: `tools/pathway-quality/repair_generated_assessment_wording.js`
  removed 1,632 generated quiz/exam wording patterns across 91 course files and
  resolved remaining letter-only answer claims so course questions no longer
  expose "True or False: The answer to..." / "Fill in the blank: Complete..."
  phrasing.
- Parent-trust pass implemented: module pages now explain assignment
  submission, reviewer ownership, rubric criteria, and 5-business-day review
  target; admin assignment queue shows the same rubric and review-due status;
  student grades and parent activity surfaces now expose assignment score /
  feedback state; pricing/support/parent demo now answer whether assignments
  are human-reviewed.
- Multi-agent assessment workflow pass implemented: final exam now requires a
  passed midterm, credit is awarded only when the final is passed and the
  weighted course grade is at least 70, graded assignment resubmission clears
  stale feedback/score and returns to the pending queue, admin assignment
  reviews require written feedback plus a server-validated 0-100 score, admin
  reviewers see the original assignment prompt and evidence type, parent
  activity can show written feedback, and parent demo includes sample teacher
  feedback.
- Assignment evidence profiles implemented in student/admin surfaces so module
  assignments are labeled as writing/reflection, research/evidence,
  project/design, data/lab evidence, presentation/performance, practice/problem
  set, or general learning evidence with matching submission guidance.
- Assessment wording repair extended: the repair tool now also softens
  generated-looking "Evaluate this answer claim..." phrasing into a student
  response accuracy check; current dry-run reports 0 remaining repairs for the
  targeted generated wording patterns.
- Public assessment policy copy aligned: Handbook and School Profile now use
  the 70% credit threshold that the Learn Portal enforces, avoid hardcoded
  14-module claims, and describe current audit-trail / integrity review
  controls without overclaiming planned webcam proctoring or randomized exam
  delivery.
- Parent-trust assessment audit added: `tools/pathway-quality/audit_assessment_parent_trust.js`
  now checks generated wording residue, duplicate options, generic short-answer
  keys, true/false-style response-check concentration, duplicate question text,
  and weak assignment-evidence language. Current run is 93 pass / 0 warn / 0
  fail; all old generated wording, duplicate-option failures, generic
  short-answer keys, weak assignment-evidence warnings, response-check bridge
  questions, and duplicate question text warnings are cleared.
- Short-response grading fairness improved: generic rubric-backed open response
  items now accept substantive student responses instead of requiring exact
  string matches against a rubric sentence, while still surfacing the need for
  subject-matter answer-key rewrites in the parent-trust audit.
- Assignment policy tightened: assignments are submitted as free text/links and
  require human review with written feedback plus a 0-100 score. Assignment
  scores are not yet part of the 40/30/30 transcript-weighted grade, but every
  module assignment must be submitted before the final exam unlocks.
- Parent dashboard now includes a formal Assignments & Feedback section instead
  of relying only on the recent activity feed. Parents can see submitted vs
  reviewed status, score, dates, and full written feedback.
- Subject rewrite batches completed for parent-visible core/foundation and
  high-visibility math/science continuation courses, then extended across all
  remaining non-AP, elective, PE/health, psychology, social-studies, English,
  business, and AP-sensitive course JSON. All 93 courses now pass the
  parent-trust assessment audit with response-check bridge questions and
  duplicate question warnings cleared.
- Rewrite queue added: `tools/pathway-quality/extract_assessment_rewrite_queue.js`
  lists remaining response-check bridge questions by course priority; current
  run reports 0 remaining courses.
- Verified 2026-05-31: `node tools/pathway-quality/audit_assessment_parent_trust.js --json`
  reports 93 pass / 0 warn / 0 fail, `node tools/pathway-quality/extract_assessment_rewrite_queue.js --json`
  reports 0 remaining courses, `npm run audit:pathways` reports 93 pass / 0
  warn / 0 fail, and `npm run build` compiles successfully with only the
  existing Browserslist outdated warning.
- Resource coverage pass completed 2026-05-31: filled missing `videoUrl` /
  `practiceUrl` fields across the 40 warning courses, replacing empty or
  previously removed resources with free/open Khan Academy, OpenStax, Purdue
  OWL, HubSpot Academy, University of Minnesota open textbook, CFR, CDC/NIMH,
  LOC, NATA/NSCA, TED, and similar stable resources. A non-YouTube smoke check
  of 1,392 unique course resource URLs reported 0 bad URLs. YouTube direct
  checks are intentionally treated separately because automated requests hit
  Google/YouTube rate-limit pages even when browser access may still work.
- Student feedback stability pass completed 2026-06-01: Learn module
  navigation now resets stale quiz, assignment, progress, and loading state
  during route changes; delayed prior-module responses are ignored; student
  resources no longer expose manual "mark read/watched/done" controls; English I
  assignment prompts were moved away from CommonLit/copyrighted-text
  dependencies; parent pacing data is now available from `/api/parent/me`.

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
