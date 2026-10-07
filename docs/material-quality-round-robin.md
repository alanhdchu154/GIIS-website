# Daily Course Material Quality Round Robin

Standalone scheduling was superseded 2026-10-04 by Alan's explicit
consolidation request:
`unified-course-quality-workflow.md` is the single daily 00:00 CT orchestration
entry point. Do not run this document as an independent 03:00 lane. Its source,
learner, review and release safeguards remain the material phase contract inside
the unified workflow.

Historical authorization from 2026-09-04 allowed inspection, improvement and
publication of finished GIIS course materials covering 3-5 subjects per run.
The October 4 unified workflow preserves that bounded material authority and
the safeguards below, but replaces the old independent time slot.

## Daily scope and progress

Use `umi/material-quality-round-robin.json`. It contains a stable 93-course
rotation initialized from current canonical JSON: Algebra I, English I and
Biology first, then remaining courses by grade level/name/slug. Begin cycle 1
at cursor 0 on the first run. Subsequent runs resume the next unfinished work;
never reset to the first three every day. Inspect each course from M1 onward,
including every module, assignment, quiz, midterm and final, and every linked
teaching artifact. Record exact coverage, not just a course-level PASS.

Target three subjects per run; extend to four or five when capacity allows.
For these selected subjects, do the substantive review and needed improvements,
not just a file-existence scan or a single first-module sample. Continue saved
repairs before starting unrelated work. Do not stop after one easy subject.
Complete fewer only for a real runtime, quota, access, safety, overlap or review
blocker; save exact remaining module/item IDs and explain the shortfall. Count
started, fully reviewed, improved and published separately. Never claim three
completed courses when only three samples were checked.

Maintain `rotation`, `cursor`, `cycle`, per-course coverage/revision/results,
`repair_queue`, `blocked_queue`, `last_run` and dated run reports. Save after each
module or independently completed assessment/artifact so interruption preserves
work. A blocked course enters a retry queue and does not starve all later
courses; advance the selection cursor only after its state is durably saved.
At a cycle boundary continue with a new cycle, retain old evidence, and
prioritize changed versions. Append new courses, retain retired identities for
history, and never silently publish a previously unpublished course.

## Before work

Anchor time. Read Central goals, current ROADMAP/workload, this contract and
`umi/reports/2026-09-04-material-quality/REVIEW.md`. Choose the executor and
reasoning effort dynamically under the canonical Outcome-Based Collaboration
policy: Codex is primary and cc is optional when it offers a concrete advantage.
Consequential source, assessment and public-trust changes still require a fresh
independent findings-first review by a different executor. Provider availability
never substitutes for approval, and no new paid provider credits are authorized.

Verify T9 and exact source paths. Inspect git status and active workers. Preserve
all unrelated WIP and the current focused worker assignment. Record this lane's
selected courses, allowed files and worker packet in workload only when actually
active; record a cc handoff only when cc was actually selected. A background
lane must not overwrite another worker's active packet.

Before changing a course, inspect the unified run's video phase, rotation state,
current reports and active processes. If material and video workers are
explicitly active at the same time, both must claim mutation ownership by
atomically creating the same local
`umi/.quality-locks/<course-slug>.lock` directory with a small owner.json
(thread/task, run ID, start time, intended files). This is a filesystem mutex,
not a daemon or scheduler. Never stage lock files. If the lock exists, inspect owner/liveness and work
on a different course; do not steal a live or uncertain lock. Release only your
own completed claim, retaining owner metadata in the report. A stale lock may
be cleared only after confirming its worker has ended and recording recovery.
The same course may be read concurrently, but never mutated/released by both
lanes. Snapshot source hashes; a changed source invalidates dependent approval.

Use a separate atomic `umi/.quality-locks/release.lock` for git main deployment,
production course sync and public manifest release, because different course
workers can still touch shared release state. Keep releases serial and narrow.

## Review and improve

For every selected course:

- Verify objectives, required readings, worked examples, practice, assignments,
  rubrics and assessments agree. Open linked sources; distinguish inaccessible
  content from content defects. Replace vague portal/homepage links with exact
  delivered material or an honest supported alternative.
- Solve/check each assessment, including distractor uniqueness, plausible wrong
  choices, equivalent numeric/algebraic forms, assumptions, feedback, duplicate
  concepts and difficulty. Test real source-to-persistence-to-UI-to-grading
  contracts with synthetic fixtures. An in-memory JSON mock alone is insufficient.
- Fix objective answer-key errors, ambiguous prompts, faulty distractors,
  unsupported questions and inaccurate explanations. Add suitable examples,
  problem sets, reading packets and usable grading descriptors. Retain learning
  rigor; do not make answers trivial simply to improve pass counts.
- Inspect all selected-course slides/handouts that actually exist. Render PDF/
  PPTX and inspect relevant pages; verify formulas, glyphs, overflow, contrast,
  page order, readability and learner availability. Make original concise
  handouts/PDFs when they fill a real learning gap; do not create duplicate files
  only to satisfy a format quota. Respect third-party reuse rights and sources.
- Coordinate video-linked slides/scripts with the existing video repair lane.
  Use isolated replacements and existing audiovisual/release gates. A changed
  PNG is not a verified new MP4, and a source contact sheet is not playback QA.
- Check a complete learner path and the assignment/feedback/revision experience.
  Do not label an unrepaired grading path ready for official credit. Safe,
  independent reading/handout improvements can still be published while that
  course's credit-bearing assessment release stays blocked.

## Publication authority and required evidence

Alan's instruction authorizes narrow commits, frontend deployment, course
material/assessment updates, and uploading completed educational artifacts after
validation. Do not ask for repeat permission for each routine, verified material
release. Publication means students can access the accepted version, not merely
that a JSON or PDF exists locally. Record content hashes, file/row scope,
validation, release receipt/version and external readback.

Alan clarified on 2026-09-05 that repaired and validated outlines, exams,
quizzes, assignments and other content design should be updated into the formal
course bank, and reported that no students were currently taking classes. Treat
that as a dated owner report, not a permanent condition. Before every assessment
release, query current enrollment, attempt/submission history and open exam
attempts. Open exam attempts must be zero. When current owner state still
confirms no active learners and the only enrollment rows are historical, the
scoped updater may use its explicit existing-enrollment override; it must not
recalculate historical grades or attempts. If active learners appear, use a
versioned or otherwise attempt-safe release. If that protection is unavailable,
hold only the affected bank and continue other validated material publication.

Use `repo-pushsafety-gate` and the relevant GIIS production/readiness workflow
before release. Isolate reviewed changes from the mixed checkout; do not push
unrelated WIP. `origin/main` push triggers Netlify; it does not update Lightsail
course content. Use the established deployment route and verify the rendered
learner page and the actual resource download/URL afterward. Public source and
local source must match the intended released fields/version.

Before updating production course/assessment rows, inspect the exact live rows
with a minimal authorized query, save a scoped rollback snapshot securely, dry
run the planned delta and use a transaction/update-only mechanism targeting
reviewed course/module/question identities. Preserve identifiers and existing
attempts; do not reseed, delete/recreate banks or alter historical grades.
Existing `sync-course-resources-from-json.js` has broad apply scope and
`prisma/seed.js` also touches student data: neither is a safe blanket publish
command. If the needed scoped updater does not exist, implement and test a
small dry-run/default, allowlisted delta updater before using it; do not mark
upload complete or stop at preparing a patch. Protect ongoing attempts from
answer/version changes; if that cannot be established, hold that bank's release
and continue independent materials. Never expose answer keys in public handouts
intended as secure exams or print credentials/student records into reports.

Required release evidence is proportional to change: source integrity and
answer correctness; unique MC and accepted equivalent response cases; meaningful
synthetic regressions for grading/code; source/persistence/render contract;
full relevant PDF/slides visual review; independent source/content review for
assessment changes; applicable build/trust/browser gates; production material
readback and no unrelated delta. Resume missing checks on a later run without
manufacturing PASS. If a deploy fails, preserve evidence and use the scoped
rollback; stop dependent releases, not all unrelated audit work.

This authority does not change tuition/payment, academic credit weights or
requirements, accreditation/AP approval claims, admission/graduation decisions,
student historical grades, publication flags for closed courses, or school
policy. Those remain explicit owner decisions. Technical fixes consistent with
accepted policy and ordinary content improvements are authorized. Treat blocked
policy work as an item-specific dependency and continue the rest. Existing
non-AP/new-video production boundaries and video replacement identity/readback
requirements remain. A reviewed website manifest update needed for this lane's
finished replacement is covered by this material publication authorization;
never retire an old video until the live manifest no longer points to it.

## Reporting and next run

Write a dated report under `umi/reports/material-quality/`. For each of the
3–5 selected subjects record full coverage vs remaining items, changes,
validation, published URL/revision or specific hold reason, and next action.
`reviewed` requires complete named coverage; `published` requires external
readback. Maintain original/source revisions and rollback evidence.

Notify Alan briefly in Traditional Chinese for published improvements, a new
material risk, changed blocker or a needed decision. Stay quiet for unchanged,
non-actionable state. Sync ROADMAP and Central handoff only for meaningful
changes. Do not alter cadence, create additional tasks or OS schedulers, send
emails, or launch bulk generation. First scheduled delivery remains unverified
until an actual run and its evidence are observed.
