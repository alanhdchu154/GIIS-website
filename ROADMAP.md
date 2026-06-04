# GIIS Website Roadmap

Last updated: 2026-06-04

This file is the current execution roadmap. Historical slot logs were removed
from the active repo state so daily work starts from current priorities instead
of a long completed-task scroll.

## Current Priority

Keep the school trustworthy, operational, and parent-visible while the
foundation-video pipeline stabilizes. The next phase is proof over volume:
parents should see a serious school, a working dashboard, and course/video
quality that feels intentionally designed.

## Active Lanes

### 1. Foundation Video Daily Pipeline

Status: active, Codex-managed, foundation-only.

- Scheduler: `~/.codex/automations/giis-foundation-video-daily/automation.toml`
- Time: 07:00 CT daily.
- Repo runner: `bash tools/lesson-video/foundation_daily.sh`
- Scope: non-AP foundation modules only.
- Max upload volume: 4/day.
- Upload rule: only `yt_queue.py upload --gate-ready`; never
  `upload_lesson.py --force-without-approval`.
- Required gate: clean pass, score 100, MP4, transcript, contact sheet,
  reviewers, learning check, style manifest, and
  `approved_ready_to_upload.json`.

Next check:

- After each 07:00 run, review selected modules, cc progress, gate result,
  upload result, website manifest sync, and any `cc_blocked` report.
- Monitor two consecutive 07:00 CT runs before expanding beyond the current
  foundation cohort. Do not increase volume until cc output, release gate,
  YouTube upload, and Learn Portal manifest sync all pass without manual rescue.

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
- `npm run audit:showcase-all`: 93 pass / 0 warn / 0 fail. This gate covers
  all 93 course JSON files for free/usable required resource URLs, removed or
  login-gated placeholder residue, known bad resource IDs, subject-domain
  resource mismatches, substantial reviewable assignment evidence, and
  quiz/midterm/final structure. Report:
  `_audit/all-course-showcase-readiness.md`.
- `node tools/pathway-quality/audit_all_course_showcase_readiness.js --check-urls --check-youtube --report _audit/all-course-showcase-readiness.md`:
  93 pass / 0 warn / 0 fail; 1,398 non-YouTube resource URLs checked / 0 bad;
  282 YouTube oEmbed checks / 0 bad.
- `npm run audit:showcase-browser -- --base-url http://localhost:3030 --all-modules --report _audit/all-course-browser-smoke.md --json-report _audit/all-course-browser-smoke.json`:
  2,358 pass / 0 fail across all 93 courses, checking course overview,
  syllabus, and every module route on desktop and mobile.
- `node tools/pathway-quality/audit_proofpoint_courses.js --check-urls --report _audit/proofpoint-course-qa.md`:
  8 proof-point courses pass / 0 warn / 0 fail; 220 non-YouTube URLs checked /
  0 bad; 32 YouTube resources skipped by direct URL smoke.
- Student feedback completion pass completed 2026-06-01: module switching,
  English I resource gaps, same-grade recommendations, module motivation,
  manual completion controls, quiz review guidance, parent pacing, demo
  upcoming-date coherence, and Weekly Insights are all covered. Completion
  evidence is recorded in
  `umi/reviews/2026-06-01-student-feedback-completion-audit.md`.
- Proof-point course QA started 2026-06-01: `npm run audit:proofpoints`
  now gates the first 8 family-facing showcase courses (`algebra-i`,
  `geometry`, `english-i`, `english-ii`, `biology`, `chemistry`,
  `us-history`, `government`). Current result is 8 pass / 0 warn / 0 fail,
  with a saved report at `_audit/proofpoint-course-qa.md`. The gate checks
  stronger display criteria than `audit:pathways`: reading/video/practice URLs
  and notes, no blocked-resource residue, substantial reviewable assignment
  evidence, quiz/exam structure, and optional non-YouTube URL smoke.
- Browser and YouTube proof-point QA continued 2026-06-01: local Learn
  walkthrough covered course/module-1/syllabus routes for the first 8 courses;
  a focused re-check verified repaired English II, Geometry, and Chemistry
  resource mismatches in the actual UI. Separate YouTube oEmbed spot-check
  covered 32 / 32 current YouTube resources with 0 bad. Evidence is recorded in
  `umi/reviews/2026-06-01-proofpoint-browser-youtube-audit.md`.
- Desktop/mobile visual QA completed 2026-06-01 for the same first 8
  proof-point courses: 50 route checks / 0 blockers across dashboard,
  course, module-1, and syllabus surfaces at 1280 x 900 and 390 x 844.
  Screenshots and metrics are saved under `_audit/proofpoint-visual-qa/`.
- All-course showcase readiness pass completed 2026-06-01: 46 removed or empty
  reading placeholders were replaced with open resources, 59 thin assignments
  were expanded into reviewable student evidence artifacts, one mismatched
  Business Ethics environmental resource was corrected, and the four newly
  introduced shared resource URLs live-smoked with HTTP 200 responses.
- All-course high-quality pass completed 2026-06-02: the all-course gate now
  supports full live URL and YouTube checks, all 93 courses passed the live
  resource audit, all 2,358 all-module browser smoke route checks passed, and a
  React key warning in `CoursePage` was repaired so course overview pages render
  cleanly under JSON-backed test data.
- Student-blocking resource cleanup completed 2026-06-02: one unstable
  Merriam-Webster required reading link was replaced with a Khan Academy
  vocabulary-in-context lesson, and the repeated Purdue OWL generic exercises
  entry was replaced with a more specific Purdue grammar exercises page.
- Completed assessment/resource history is archived in
  `umi/reviews/2026-06-01-course-resource-assessment-summary.md`.

Next check:

- Run resource/link audit before producing videos for a course cohort; treat
  YouTube automation 429s as a separate manual/browser spot-check lane.
- First proof-point cohort is ready for a local/staged parent demo, and all 93
  courses now clear static, live-resource, and browser route gates. Continue
  with targeted screenshot-level visual QA for future parent-visible cohorts
  and do a small live YouTube playback spot-check immediately before any demo
  that depends on external YouTube navigation.

### 3. Admin / Parent Runtime Stability

Status: active watch.

- Parent dashboard and admin queues are trust-critical runtime surfaces. A
  broken parent dashboard damages transparency even if course data is correct.
- Recent stability work fixed unstable session getter / repeated fetch patterns
  in parent and admin surfaces. Keep this as an explicit lane so regressions do
  not hide as one-off bugs.
- `src/api/authStorage.test.js` now locks stable session getter references for
  admin, parent, and student sessions.
- `npm run audit:ops-browser` now smokes `/parent/dashboard`, `/admin`,
  `/admin/applications`, and `/admin/assignments` on desktop and mobile with
  mocked API responses and repeated-fetch caps. Latest local result:
  8 pass / 0 fail, saved in `_audit/parent-admin-browser-smoke.md`.
- Production backend deployment and verification remain separate from frontend
  deploys. Do not claim graduated-student record freeze or admin workflow locks
  are live until backend deploy and production smoke evidence exist.

Next check:

- Keep `npm run audit:ops-browser` in the parent-facing predeploy checklist.
- Verify the backend deploy path for graduated-student archive/freeze behavior
  before treating that policy as enforced in production.

### 4. Parent Trust / Admissions / Student Care

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
- Old AP Biology / AP Calculus audit snapshots, AP-label cascade artifacts,
  old AP/batch lesson quality snapshots, and the duplicate all-module browser
  smoke report were removed from active repo state on 2026-06-04. Use git
  history only if that historical evidence is explicitly needed.
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
