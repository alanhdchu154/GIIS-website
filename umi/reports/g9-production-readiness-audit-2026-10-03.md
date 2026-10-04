# G9 Production Readiness Audit — 2026-10-03

**Verdict: BLOCKED for a blanket “G9 ready to go” claim.** This was a
read-only audit: no student, credit, payment, account, source, production,
manifest, video, upload, push, or deploy state changed.

## Launch reconciliation update — 2026-10-03

The original read-only verdict is now partly superseded by a protected local
release-candidate reconciliation. It did not change publication, credits, grades,
enrollment, payment, account, or learner submissions.

- The local release-candidate database has all 20 G9 course module objectives
  and assignments aligned to the reviewed source. The scoped, hash-pinned
  updates changed 199 module rows and 342 fields; each transaction read back
  successfully.
- Algebra I and Biology had no learner state, so their remaining 10 exam items
  and 32 module-quiz items were reconciled to the reviewed source through
  separate snapshot-backed transactions; both readbacks passed.
- A final non-disclosing source-versus-production assessment comparison finds
  19 of 20 G9 courses fully aligned. English I intentionally retains four exam
  and eleven module-quiz item differences because it has an existing
  enrollment with three quiz attempts and two assignment submissions. Its
  module objectives and assignments are aligned. Replacing those assessment
  items would make a historical attempt refer to a different question version.
- Environmental Science M9 now uses an available NOAA sea-level resource, and
  all 20 G9 courses pass the source module-syllabus and assessment/homework
  audits. The learner module page no longer sends a student from the module to
  the generic `/learn` homepage when the actual GIIS lesson player is already
  present above the resource card.

**Current launch status:** the local release candidate has structured course
materials, assignments, and assessments ready for the 19 fully aligned
courses. It is not production-release proof: the updater connected to the
local `localhost` database, so Lightsail/API deployment, protected live
readback, and the normal frontend release gate remain outstanding. English I
assessment versioning and the independently verified-video backlog are
additional launch holds; do not state that the whole G9 video catalog has
passed quality review.

## What passes locally

- All 20 published Grade 9 course sources pass `audit_courses`, the full
  assessment/homework review, and the showcase-structure audit.
- Coverage is 199 modules, 820 module-quiz questions, and 700 exam questions.
- The manifest has no G9 course/module/title alignment warning; T9 and the
  teaching-video symlink are healthy.

## Current blockers

1. **Production material drift.** All 20 public course endpoints return 200
   and have the expected module counts, but every course differs from the local
   reviewed source in one or more module fields. In the sampled core courses,
   production still uses older Khan Academy video/practice links and shorter
   assignments where local source directs students to the GIIS lesson path and
   requires reviewable evidence. A local pass is not proof of production
   readiness. The public course endpoint intentionally omits quiz/exam banks,
   so production assessment parity is unverified.
2. **Assignment-syllabus format.** The full module-syllabus audit fails 9
   assignments across Algebra I (M3, M7, M10), English I (M1, M3), and Biology
   (M1, M8, M9) for missing explicit `Submit`, `Include`, and `Evaluation`
   structure. This is a parent/learner usability failure, not evidence that the
   work is academically empty.
3. **Resources.** One required G9 source is confirmed unavailable:
   Environmental Science M9's former NOAA sea-level technical-report URL is
   HTTP 404. Reading Rockets, NIH ODS, CDC, and SciJinks blocked automated
   checks; they are access-unknown rather than confirmed broken and require a
   browser/alternate-resource decision before being required student paths.
4. **Videos.** The G9 repair lifecycle contains 86 entries: 1 replaced
   (Algebra I M1), 1 reviewer-blocked (English I M1), 3 sandbox-prepared, and
   81 queued. Existing videos may remain available, but they do not meet a
   blanket verified-quality claim. They must follow exact-hash source/audio/
   independent-review/score-100/TRUST_READY/upload/live-readback replacement
   gates before an old video can be retired.

## Minimum first-student release gate

Do not open the full G9 catalog as verified-ready. First, use a small
conditional starter pack only after Principal placement review, then:

1. Reconcile only the named Grade 9 production course rows with the reviewed
   source under the protected material-release procedure, including learner and
   open-attempt preflight and direct/proxy readback.
2. Repair/replace the confirmed 404 resource and decide browser-verified
   alternates for the access-unknown resources.
3. Repair the nine assignment structures and rerun the syllabus audit.
4. Complete the English I M1, Biology M1, and World History M1/M5 video
   lifecycles before claiming first-week video quality is verified.

## Commands and boundaries

- Ran source course, module-syllabus, assessment/homework, showcase/resource,
  manifest-alignment, video-inventory, live API, and T9/symlink read-only
  checks.
- Claude Code was skipped: this was evidence gathering only; no implementation
  task was opened. No external action occurred.
