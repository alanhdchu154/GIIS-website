# Umi Workload

Last updated: 2026-07-22 09:35 CDT

This file holds one active Codex / cc worker handoff at a time. Use
`ROADMAP.md` for durable project direction and archived reports/git history for
old slot evidence.

## Codex Acceptance Review: Billing Rollout Needs One Scoped Follow-Up

Codex accepted the manual-billing / transfer-credit direction and confirmed the
commits are on `main` / `origin/main`, but did not accept the claim that the
payment UX is fully production-ready. Two regressions were found after the cc
handoff:

1. `ParentDashboard` treated any legacy `subscription` object as paid even when
   the new canonical `payment.state` was `past_due`, which could suppress the
   payment nudge and show an expired Stripe period as paid.
2. Manual paid-through comparisons used the UTC calendar date. In Chicago this
   can expire a date-only payment at 19:00/18:00 local time instead of at the
   end of the GIIS business day.

The existing focused middleware test also failed because its Prisma mock did
not include the new `student.findUnique` call. Codex prepared a local, unpushed
seven-file fix: canonical parent `payment.state`, shared
`America/Chicago` school-date handling across admin/parent/write-gate paths,
updated middleware mocks and paid-through cases, and school-date boundary
tests. Verification now passes: 2 suites / 6 tests; `git diff --check` is the
remaining pre-commit check. Production remains yellow until Alan approves a
scoped commit/push plus the normal Netlify frontend and Lightsail backend
deploy verification. No DB migration or production-data mutation is needed
for this follow-up.

## cc Shipped 2026-07-21: Manual Billing + Transfer-Credit + Access Gating

cc built, deployed (Netlify + Lightsail), and E2E-tested (test data cleaned) a
manual-review billing + G12 transfer flow. All commits on `main`, both tiers
deployed. Key pieces for Codex:

- Manual billing is the source of truth for "paid": `Student.paidThroughDate` +
  `paymentPlan` + `paymentNote` (schema migrated via `db:push`). Admin sets them
  on the student page via `PUT /api/students/:id/payment`. Paid ==
  `paidThroughDate >= today`.
- Roster payment state (`students.js` resolvePayment) prefers the manual field
  over Stripe. A Stripe sub that says "active" but whose `currentPeriodEnd`
  lapsed is now surfaced as past_due, not a false green.
- Access gating: `middleware/auth.js blockIfSoftLocked` also blocks write
  actions when `paidThroughDate` lapsed (read stays open). Date-driven, no cron;
  students with no paidThroughDate unaffected.
- Parent dashboard shows a `payment` object ("Tuition paid through <date>");
  the "complete payment" nudge now keys off real paid state.
- Transfer credit uses `CourseRow` rows in a "Transfer Credit — Prior School"
  semester; credit-only = blank grade (counts for credit, excluded from GPA —
  `transcriptStats`/`computeSemesterTotals` fix). Admin SOP + quick-entry card at
  `/admin/transfer-sop` (served from an admin-only backend endpoint).
- E2E verified twice on production: create student → transfer credit (15 cr,
  3.61 GPA) → 3 views → pay (write allowed) → unpay (read 200 / write 402) →
  parent sees past_due → graduate (24 cr, 3.70 GPA) → cleanup 0 residual.
- Do NOT hand-build a Stripe recurring pipeline yet; manual billing is
  intentional for current scale. Stripe stays a payment rail only.

## Active: Lesson-Video Producer — 4 Active Modules Left, Manifest Rebuilt

2026-07-22 09:15-09:35 CT current-state audit confirms the active missing
lesson-video backlog is exactly 4 Grade 12 modules:

- Digital Media & Society M11 `Digital Journalism`
- Digital Media & Society M12 `Digital Citizenship & Civic Responsibility`
- English IV - Writing & Communication M6 `Public Speaking & Presentation`
- English IV - Writing & Communication M13 `Editing & Publishing`

Grades 9, 10, and 11 dry-runs return 0 candidates; Grade 12 dry-run returns
only those 4. Queue is 831 uploaded / 0 pending / 0 no-MP4 / 831 total. Codex
also repaired the YouTube channel manifest sync/parser so recent title formats
such as `Course — 14: Title` and `Course — 14` are included. Local public
manifest is rebuilt to 816 visible lessons with AP/hidden courses still
excluded, Biology Advanced 14/14 visible, Physics - Mechanics 14/14 visible,
Digital Media & Society 10/12 visible, and English IV - Writing &
Communication 11/13 visible. Verification passed: manifest alignment 0 warnings
across 816 lessons, video inventory 816 visible / 15 hidden upload-candidates,
parser tests, `py_compile`, `npm run build`, and `git diff --check`.

Commit `26873221` (`Sync latest lesson manifest and parser`) was pushed to
`origin/main`; Netlify production now serves the 816-lesson manifest. Browser
check on `/lessons` shows `816 lessons online` and search finds
`Conservation Biology`, `Waves & Sound Basics`, and `Digital Revolution`.
GitHub CI build job passed, but `server-smoke` remains red in
`server/src/middleware/auth.test.js` with the known payment/access test WIP;
handle that as a separate scoped commit, not as lesson-video manifest work.

Smallest next action after Claude resets: rerun the approved 5-cap path for
the remaining 4 modules; do not force a fifth and do not treat any brief-only
folder as a release artifact.

2026-07-22 08:48-08:50 CT heartbeat attempted the approved 5-cap path for the
final 4 safe candidates: Digital Media & Society M11-M12 and English IV -
Writing & Communication M6/M13. Claude Code hit the session limit while reading
references for DMS M11, before production artifacts were written. DMS M11
currently has only `source_packet.json`, `teaching_brief.md`, and
`visual_brief.md`; it is not release-ready and the gate-ready uploader found
0 human-approved pending items.

2026-07-22 06:00-08:45 CT heartbeat completed the approved primary 5-cap pass
and the optional second 5-cap top-up. Digital Media & Society M1-M10 all
reached final release gate score 100, passed parent-trust as `TRUST_READY`, and
uploaded unlisted with 0 failures:

- M1 `sG8sepl_gvI`, M2 `q_XfPQ-U9Gg`, M3 `JIxSRbWKd30`, M4 `Sdb_F9w0Bio`,
  M5 `JkeTDDbBn_8`.
- M6 `EfMa6QKt9Jw`, M7 `yRhkKdgCUfo`, M8 `O_FUZNtI0G4`,
  M9 `JmDztvixPaE`, M10 `_fA80vyXnOw`.

The second pass initially stopped before upload because parent-trust flagged
M9's "minimum wage guarantee(s)" wording as an `outcome_guarantee`. Codex
repaired the wording to wage-protection language, kept Digital Media theme
resolution consistent with the existing literature/sepia course style, reran
the same approved 5-cap path, and uploaded the repaired batch through
`yt_queue.py upload --gate-ready`. No true YouTube upload/channel limit
appeared.

Current evidence after the run: no producer/upload process remains; queue is
831 uploaded / 0 pending / 0 no-MP4 / 831 total; pending release gate is
0/0/0; manifest alignment is clean with 0 warnings across 768 lessons. 2026-07-22
CT upload-run total is now 23 videos. Active missing backlog is now 4 modules:
Digital Media & Society M11-M12 and English IV - Writing & Communication
M6/M13. This heartbeat has already used its 10-cap, so do not run a third pass.
Smallest next action at the next heartbeat: run the approved 5-cap path for
those 4 remaining modules; do not force a fifth.

2026-07-22 02:45-03:39 CT heartbeat completed the approved primary 5-cap pass,
but only three safe Grade 11 candidates existed. Physics - Mechanics M12-M14
were produced/reviewed/final-gated, parent-trust-audited as `TRUST_READY`, and
uploaded unlisted with 0 failures: M12 `1vpUHBO2Ujs`, M13 `cSnxLz0U9Mo`, M14
`KOQDzWKp6Yo`.

After the first pass, fresh rechecks were clean: no producer/upload process,
queue 821 uploaded / 0 pending / 0 no-MP4, pending gate 0/0/0, manifest
alignment 0 warnings, and dry-run selected Grade 12 Digital Media & Society
M1-M5 with 14 selectable Grade 12 candidates total. The optional second 5-cap
top-up started, but Claude Code hit the session limit at the start of DMS M1
before writing production artifacts. DMS M1 currently has only
`source_packet.json`, `teaching_brief.md`, and `visual_brief.md`; there is no
MP4, no pending upload, and no gate-ready approval. The gate-ready uploader
found 0 human-approved pending items.

Current evidence: no producer/upload process remains; queue is 821 uploaded /
0 pending / 0 no-MP4 / 821 total; pending release gate is 0/0/0; manifest
alignment is clean with 0 warnings across 768 lessons; no true YouTube
upload/channel limit appeared. 2026-07-22 CT upload-run total is now
13 videos. Active missing backlog is now 14 modules: Digital Media & Society
M1-M12 and English IV - Writing & Communication M6/M13. Smallest next action
after Claude reset: rerun the approved 5-cap path starting with DMS M1-M5.
Do not run `upload_lesson.py --force-without-approval` and do not treat DMS M1's
brief-only folder as a release artifact.

2026-07-22 00:02-02:41 CT heartbeat completed the approved primary 5-cap pass
and one optional second 5-cap top-up. Codex confirmed no duplicate
producer/upload process, queue 808 uploaded / 1 pending / 0 no-MP4, pending
release gate 0 ready / 1 needs_revision / 0 blocked, manifest alignment
0 warnings across 768 lessons, and safe dry-run candidates before starting.
The first clean pass recovered Physics - Mechanics M2 through independent
review/final gate, produced M3-M6, parent-trust-audited the 5 lessons as
`TRUST_READY`, and uploaded all 5 unlisted with 0 failures: M2 `KB5kjx6stso`,
M3 `6wgelrX_-os`, M4 `7RCvPtqdQJE`, M5 `vpqaXlXgk7Y`, M6 `VsW9fgJeQ38`.

After the first pass, fresh evidence stayed clean: no producer/upload process,
queue 813 uploaded / 0 pending / 0 no-MP4, pending gate 0/0/0, manifest
alignment 0 warnings, and dry-run selected Physics M7-M11. The optional second
5-cap pass then produced/reviewed/final-gated M7-M11, parent-trust-audited them
as `TRUST_READY`, and uploaded all 5 unlisted with 0 failures: M7
`C7RBOrx28Mw`, M8 `-eK57GVBnuM`, M9 `GLxR3x7jRuE`, M10 `fS8iT1uO8V8`, M11
`8Ksk_iJ5g5w`.

Current evidence after the run: no producer/upload process remains; queue is
818 uploaded / 0 pending / 0 no-MP4 / 818 total; pending release gate is
0/0/0; manifest alignment is clean with 0 warnings across 768 lessons; no true
YouTube upload/channel limit appeared. 2026-07-22 CT upload-run total is
10 videos. Fresh dry-run now selects only three remaining Grade 11 candidates:
Physics - Mechanics M12-M14. Next action at the next heartbeat: run the approved
5-cap path, but expect at most 3 Grade 11 uploads unless the orchestrator
auto-advances safely after they clear. Do not force low-quality or unsafe work
to fill 5. Active missing backlog is now 17 modules: Physics M12-M14, Digital
Media & Society M1-M12, and English IV - Writing & Communication M6/M13.

Reviewer note: M7 and M11 surfaced an upstream-only `expert_lens` template issue
where the source packet/brief inherited chemistry-family wording. The video
scripts themselves were physics-correct, final gates scored 100, and
parent-trust passed, so this was not an upload blocker. Fix the upstream
template before relying on that Expert Lens field for more physics modules.

2026-07-21 22:02-22:06 CT heartbeat retried the approved 5-cap path. Codex
confirmed no duplicate producer/upload process, queue 808 uploaded /
0 pending / 1 no-MP4, pending release gate 0/0/0, manifest alignment
0 warnings across 768 lessons, and 5 safe dry-run candidates. Physics -
Mechanics M2 rendered a new MP4 and moved from no-MP4 to pending, with audit
verdict `pass_with_minor_notes` and score 94.

No upload happened. Release gate still returns 0 ready / 1 needs_revision /
0 blocked because M2 is below the required 100 score and is missing the
independent second-pass reviewer. Claude Code hit the session limit at the
reviewer stage; the gate-ready uploader found 0 human-approved pending items.
Current evidence: no producer/upload process remains; queue is 808 uploaded /
1 pending / 0 no-MP4 / 809 total; manifest alignment remains clean with
0 warnings across 768 lessons; no true YouTube upload/channel limit appeared.
Smallest next action after Claude reset: rerun the approved 5-cap path so M2
can complete reviewer/gate and upload only if it becomes gate-ready. Do not run
the optional second pass while M2 is still blocked at review/gate.

2026-07-21 20:29-21:40 CT heartbeat started a new approved 5-cap pass. Codex
caught a real visible-quality issue before upload: Biology Advanced M14's path
slide said `Next up: Module 15` even though the course ends at Module 14. The
run was stopped before upload, the slide was repaired to `Course wrap-up:
submit Module 14 work`, and the batch resumed only through the approved
`FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
lesson:foundation-daily` path. Biology Advanced M13-M14 and Physics -
Mechanics M1 then reached final release gate score 100, passed parent-trust as
`TRUST_READY`, and uploaded unlisted with 0 failures: Biology Advanced M13
`UU263ZBhjnM`, Biology Advanced M14 `-2mGzWyIu9Y`, Physics M1 `6Ll4Hn1104k`.

Claude Code then hit a session limit while Physics M2 was still pre-render, so
the batch stopped before selecting more modules and no optional second pass ran.
Physics M2 currently has pre-render files only (`script.json`,
`build_slides.py`, `learning_check.json`, and production reviewer JSON), no MP4.

Current post-run evidence: no producer/upload process remains; queue is
808 uploaded / 0 pending / 1 no-MP4 / 809 total; pending release gate is
0/0/0; direct Physics M2 gate is needs_revision score 34 because it lacks MP4;
manifest alignment is clean with 0 warnings across 768 lessons; no true
YouTube upload/channel limit appeared. 2026-07-21 CT upload-run total is now
33 videos. Smallest next action after Claude reset: rerun the approved 5-cap
path to resume Physics M2, then continue Physics M3-M6 if safe. Dirty risk
remains scoped: pipeline code/docs are modified and transfer-credit SOP files
are untracked; do not broad-stage.

2026-07-21 16:53 CT page/production audit found and fixed a public manifest
lag. Netlify/frontend deploy was fresh, but `/data/lessons-manifest.json` was
still the 2026-07-08 channel-sync snapshot with 577 visible lessons, so today's
Media & Society/Public Speaking/Sports Psychology uploads were not visible on
the public Lesson Library/Learn embeds. Root cause: `sync_channel.py` parsed
`Course — Module N: Title` but not `Course — Module N — Title`. Parser fixed,
hidden/unpublished course JSON is now excluded from public manifest rebuilds,
and the manifest was refreshed from YouTube channel state to 768 visible
lessons. AP public count remains 0. Verify production after the commit/push
with `/data/lessons-manifest.json` showing 768 lessons and Media & Society
M1-M8 IDs.

2026-07-21 16:38 CT course-source cleanup completed. AP courses are hidden
with `isPublished:false`; duplicate/legacy no-grade courses are hidden rather
than hard-deleted because production DB rows still exist; transitional
English/elective variants are hidden until a real pathway need is confirmed.
Public Academics/Homepage AP course framing was removed. The old 92-module
no-grade/AP-looking bucket should not be treated as active video production
work.

Surgical DB metadata sync was applied for the same 18-course set and verified
with a targeted 0-change dry-run. It updated only `isPublished`/`gradeLevel`;
it did not touch enrollments, progress, grades, modules, exams, or quiz
questions.

Current active published backlog after the 20:29 CT top-up:

- Grade 11 Physics - Mechanics: modules 2-14.
- Grade 12 Digital Media & Society: 12 modules.
- Grade 12 English IV - Writing & Communication: modules 6 and 13.

Next action: run the normal approved foundation producer in 5-cap batches,
starting with Grade 11 Biology Advanced / Physics - Mechanics. After Grade 11
is clear, run Grade 12 Digital Media & Society and the two English IV modules.
Do not produce AP videos unless Alan explicitly reopens AP policy. Do not
hard-delete hidden legacy course JSON until there is a DB-safe cleanup plan.
Detailed plan: `docs/lesson-video-readiness-plan.md`.

Verified now: targeted DB metadata dry-run 0 remaining changes;
`node server/scripts/audit-course-question-integrity.js` 0 issues; `npm run
audit:lesson-manifest -- --quiet` 0 warnings; queue status 793 uploaded /
0 pending / 0 no-MP4; Grade 11/12 dry-runs select only the 42 active modules;
`npm run build` passed.

## Previous: Lesson-Video Producer — Next Two-Hour Safe Top-Up

2026-07-21 14:01-16:28 CT heartbeat completed the approved primary 5-cap pass
and one optional second 5-cap top-up after fresh re-checks stayed clean. The
runner used only `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
lesson:foundation-daily`; uploads stayed on `yt_queue.py upload --gate-ready`.
It produced, final-gated, parent-trust-audited, and uploaded 8 Media & Society
videos with 0 failures: M1 `tzc8wGHDiAw`, M2 `03Kp7uXMrgQ`, M3
`gqs3sDyNAoI`, M4 `FPCXzeRjI0M`, M5 `b5u3nc8Lfog`, M6 `CswHKcz2mvY`, M7
`v5Lgd-vp9rs`, and M8 `6MPxhoslAAg`.

Post-run evidence: no producer/upload process remains; queue is 793 uploaded /
0 pending / 0 no-MP4; pending release gate is 0/0/0; manifest alignment is
clean with 0 warnings across 577 lessons. Today local CT total is 17 uploaded
videos. No true YouTube upload/channel limit appeared.

Next action: at the next two-hour heartbeat, refresh the usual small evidence
set and run the same primary 5-cap path only if safe candidates exist. Do not
run a third pass from this heartbeat; total completed here was 8/10 because
only three safe candidates remained after the first five.

2026-07-21 10:37 CT recovery/update: the apparent "no candidates" state was a
selector/gate false negative, not an exhausted curriculum. Codex fixed the
pipeline root causes and ran only the approved video-first path:
`FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
lesson:foundation-daily`.

- root-cause fixes now in the dirty worktree: `open.lib.umn.edu` 403 fetch
  checks are retried instead of permanently quarantining candidates; existing
  lesson artifacts can be rendered/reviewed/released through the orchestrator;
  render/review cache invalidates on `build_slides.py` / `style_manifest.json`
  changes; Public Speaking now maps to the literature theme in both audit and
  slide generation; the independent reviewer wrapper now enforces timeout while
  waiting for quiet streaming output.
- uploaded today in this recovery: 9 unlisted videos / 0 upload failures.
  Public Speaking M1 `OtbHkuYR3uo`, M2 `vkv-S4FXsZw`, M3 `KhDkoMRS-dQ`, M4
  `PcKFGSErzKE`, M5 `POpTobbh3aY`, M6 `tyGv3rvLWxM`, M7 `8cpRKxVMN78`, M8
  `Tn5VjgSOiHI`; Sports Psychology M6 `CpKQqO2GOds`.
- queue after recovery: 785 uploaded / 0 pending / 0 no-MP4 / 785 total;
  pending release gate: 0 ready / 0 needs_revision / 0 blocked; manifest
  alignment: 0 warnings across 577 lessons; no producer/upload/reviewer
  process remained active; no true YouTube upload/channel limit appeared.
- current candidate state: Grade 10 now has 0 selectable candidates. Fresh
  dry-run auto-advances to Grade 11 and selects Media & Society M1-M5 as the
  next safe 5-cap batch.
- next action: next two-hour heartbeat should run the primary 5-cap pass on
  Media & Society M1-M5, then optionally one second 5-cap top-up only if the
  first pass exits cleanly and fresh gates still show safe work; do not force
  unsafe work or bypass approval/upload gates.
- dirty risk: pipeline code/docs are modified; unrelated transfer-credit SOP
  files remain untracked; root `slides/` and `style_manifest.json` are
  untracked cwd-drift. Do not broad-stage.

## cc Review Findings: 2026-07-20 Uncommitted Diff (needs Codex/Alan action)

cc ran a read-only review of the ~2000-line uncommitted working tree (29 files:
9 course JSONs +module 12, `enrollments.js` refactor, frontend UI/copy,
parent-trust gate, docs). Overall quality is good and public copy is more
conservative. cc already removed stray root `slides/` + `style_manifest.json`
(untracked cwd-drift artifacts; verified no active render). Remaining items need
Codex or Alan:

1. `.gitignore` root cause — add `/slides/` and `/style_manifest.json`. Root
   artifacts keep reappearing untracked because `.gitignore` only covers
   `teaching-videos/*/slides/`. One line prevents future accidental commits.
2. AP prep section in `CourseCatalog.js` — wording is safe (all "exam
   preparation" / "College Board-aligned" / official links, no authorization or
   credit claim), but advertising AP prep under the unaccredited posture is an
   Alan claims-policy call. Ratify before it ships to production.
3. 9 course JSONs each add module 12 to clear the course-design guard (the
   11-module skip). These only take effect after a DB re-seed, which is the
   high-risk op — plan separately; do not assume the live DB already changed.
4. Commit hygiene — split the ~2000-line diff into logical commits. `push` =
   Netlify deploy of `genesisideas.school`; do not push casually.

Verified good (no action): `enrollments.js` refactor + `LearnDashboard`
frontend are a consistent pair (repeat-enroll `409` -> `200 {alreadyEnrolled}`
is handled frontend-side); parent-trust gate additions are fixture-backed;
`ProfilePage` / `AssessmentProof` are clean UX / error-handling improvements.

### Google Doc `Giis_Website2` QA feedback — per-item verification (2026-07-20)

cc cross-checked every item in the tester's QA doc against this working tree.
9 of 11 confirmed implemented in code; 1 partial; 1 not auto-fixed.

- Student "Enroll does nothing": FIXED (success toast + optimistic list update).
- Student "Failed to load profile": PARTIAL — error UX is now friendly
  (401 re-login / 404 "profile not linked, contact admissions"), but this makes
  the failure readable, not necessarily resolved. Test with a real enrolled
  account to confirm the profile actually loads.
- Trust Center: two parent-visibility blocks MERGED; 8-course assessment
  evidence now first-2-expanded + rest collapsible; refund copy changed to
  "退款政策不代表入学保证". All FIXED.
- Academics: duplicate pathway info consolidated; AP moved after pathways with
  "choose a pathway first" framing; lesson library gained search + per-course
  `<details>` collapse; calendar color-coded by type; calendar gained both
  "Add to Google Calendar" and "Print / Save PDF". All FIXED.
- Academics item 7 ("学习路径" vs "查看全部路径" redundancy): NOT auto-fixed.
  cc found the pattern (list + view-all link) in 3 standard places (Academics
  Pathway Showcase, CourseCatalog footer, Nav mega-menu); none is an unambiguous
  duplicate safe to delete blind. Needs the tester to point at the exact screen
  before a targeted edit.

STATUS 2026-07-20: cc committed the fixes in 4 logical commits and PUSHED to
`origin/main` (commit `d2dbb087`) at Alan's request — Netlify deploy triggered;
allow a few minutes to propagate. DB re-seed for the 9 course-JSON module-12
additions was intentionally SKIPPED (Alan chose skip): full `db:seed` does
`course.delete`+recreate, 8 of the 9 courses have a live enrollment, and
`Enrollment->Course` is Restrict — so a full seed would error / risk the paying
students' data. The module-12 JSON change already clears its real target (the
video course-design guard reads JSON, not the DB), so no re-seed is needed. Live
DB was left untouched. If enrolled students should later see module 12 in the
Learn Portal, use a surgical CourseModule upsert (order 12 only, no delete),
never the full seed.

FOLLOW-UP 2026-07-20: Netlify deploy of `d2dbb087` confirmed live (state ready,
published, 22 assets changed). Alan then decided the calendar "Add to Google
Calendar" export was a confusing half-measure (single year-span all-day event,
milestones only in the description) and asked to remove it. cc removed the link
+ unused `googleCalendarUrl`/`compactDate` helpers, kept "Print / Save PDF",
build passed, committed (`547ef5ca`) and pushed.

## Completed: 2026-07-20 12:02-13:24 CT 5-Cap Run: Psychology M9-M12 + Sports M1 Uploaded

The 12:00 CT two-hour / 5-cap heartbeat ran the approved path:
`FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
lesson:foundation-daily`. It did not start a duplicate producer/upload and did
not use any force approval/upload path.

- produced/reviewed to ready: Psychology Seminar / Capstone M9 APA Writing
  Style, M10 Data Collection Methods, M11 Statistical Analysis for Psychology,
  M12 Capstone Presentation & Research Reflection, and Sports Management &
  Leadership M1 Leadership Theories in Sport
- final release gate: all five reached score 100 / ready
- parent-trust: `TRUST_READY` for all five
- approval/upload path: orchestrator wrote
  `teaching-videos/_audit/release-gate/approved_ready_to_upload.json`, then
  `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 5 unlisted uploaded / 0 failed / 0 pending
- video IDs: Psychology M9 `fREcl4LN4wA`, M10 `3OZ5EDpq7vY`, M11
  `RdfCGBBikNs`, M12 `5YJLlvoKcwk`, Sports Management M1 `_jZ7QIx0a4w`
- playlist: Psychology M9-M12 added to `Psychology Seminar / Capstone`;
  uploader created `Sports Management & Leadership` playlist `PLNAhuCd5rVXs`
  and added M1 after one transient playlist-add retry
- final queue evidence: 765 uploaded / 0 pending / 0 no-MP4 / 765 total
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- this was not a YouTube upload/channel limit; conservative local quota
  estimate now reports 10 local uploads today and 0 safe full uploads left
- current 2026-07-20 CT total is 10 uploaded
- dirty risk remains: root cwd-drift `slides/` and `style_manifest.json`
  reappeared untracked; do not broad-stage them.

## Completed: 2026-07-20 10:03-11:26 CT 5-Cap Run: Psychology M4-M8 Uploaded

The 10:00 CT two-hour / 5-cap heartbeat ran the approved path:
`FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
lesson:foundation-daily`. It did not start a duplicate producer/upload and did
not use any force approval/upload path.

- produced or accepted gate-ready: Psychology Seminar / Capstone M4
  Cross-Cultural Psychology, M5 Positive Psychology & Well-Being, M6 Applied
  Psychology Careers, M7 Research Design Review, and M8 Literature Review
  Skills
- final release gate: all five reached score 100 / ready
- parent-trust: first batch audit stopped on M5 wording containing
  `guarantees lasting happiness`; Codex changed the lesson wording to
  `automatically creates lasting happiness`, rerendered/reviewed M5 through
  the normal orchestrator path, and the 5-lesson recheck returned `TRUST_READY`
- approval/upload path: orchestrator wrote
  `teaching-videos/_audit/release-gate/approved_ready_to_upload.json`, then
  `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 5 unlisted uploaded / 0 failed / 0 pending
- video IDs: M4 `U5eAvCvMXgQ`, M5 `xV5cl6hRJTU`, M6 `tMbWOPhJaRc`, M7
  `vDQQoh54y5c`, M8 `ohJhnUhCuCU`
- playlist: all five added to `Psychology Seminar / Capstone`
- final queue evidence: 760 uploaded / 0 pending / 0 no-MP4 / 760 total
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- this was not a YouTube upload/channel limit
- current 2026-07-20 CT total is 5 uploaded
- dirty risk remains: existing website UX/course/pipeline WIP, generated T9
  media, root cwd-drift `slides/` and `style_manifest.json`, and mixed local
  edits must not be broad-staged.

## Completed: 2026-07-17 10:02-11:41 CT 5-Cap Run: Personal Finance M11-M12 + Psychology M1-M3 Uploaded

The 10:00 CT two-hour / 5-cap heartbeat ran the approved path:
`FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
lesson:foundation-daily`. It did not start a duplicate producer/upload and did
not use any force approval/upload path.

- produced or accepted gate-ready: Personal Finance / Applied Economics M11
  Housing & Real Estate, M12 Capstone: Personal Financial Plan, Psychology
  Seminar / Capstone M1 Review of Core Psychology, M2 Current Research in
  Neuroscience, and M3 Emerging Topics in Psychology
- final release gate: all five reached score 100 / ready
- parent-trust: `TRUST_READY` for all five
- approval/upload path: orchestrator wrote
  `teaching-videos/_audit/release-gate/approved_ready_to_upload.json`, then
  `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 5 unlisted uploaded / 0 failed / 0 pending
- video IDs: Personal Finance M11 `M38vvdj7ONQ`, Personal Finance M12
  `BpUmXOfh65c`, Psychology M1 `6Znwc1QQKZY`, Psychology M2 `dZIZzvQ-jJ0`,
  Psychology M3 `iWCaFw8DzXw`
- playlist: Personal Finance M11-M12 added to `Personal Finance / Applied
  Economics`; uploader created `Psychology Seminar / Capstone` and added M1-M3
- final queue evidence: 755 uploaded / 0 pending / 0 no-MP4 / 755 total
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- this was not a YouTube upload/channel limit
- current 2026-07-17 CT total is now 10 uploaded
- dirty risk remains: generated T9 media, repaired Grade 12 course JSONs,
  pipeline docs/runner/theme/audit changes, parent-trust audit fixture changes,
  root cwd-drift `slides/` and `style_manifest.json`, and mixed local edits
  must not be broad-staged.

## Completed: 2026-07-17 08:16-09:31 CT 5-Cap Run: Personal Finance M6-M10 Uploaded

The 08:00 CT two-hour / 5-cap heartbeat resumed the Personal Finance /
Applied Economics retry lane through the approved path:
`FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
lesson:foundation-daily`. It did not start a duplicate producer/upload and did
not use any force approval/upload path.

- produced or accepted gate-ready: M6 Stock Market Basics, M7 Bonds, Mutual
  Funds & ETFs, M8 Retirement Planning (401k, IRA), M9 Taxes & Filing Basics,
  and M10 Insurance (Health, Auto, Life)
- final release gate: all five reached score 100 / ready
- parent-trust: first batch audit stopped on M7 finance wording
  (`no guaranteed payout but historically higher long-run returns`); Codex
  narrowed the lesson wording to "long-run return potential that is never
  promised," rerendered/reviewed M7 through the orchestrator path, and the
  recheck returned `TRUST_READY`
- approval/upload path: orchestrator wrote
  `teaching-videos/_audit/release-gate/approved_ready_to_upload.json`, then
  `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 5 unlisted uploaded / 0 failed / 0 pending
- video IDs: M6 `HOjrsc7TZvA`, M7 `uNsAjpxQgQY`, M8 `kI2tOmAsF9Y`,
  M9 `RI_MkyMB5n8`, M10 `PEotSgupR4Q`
- playlist: all five added to `Personal Finance / Applied Economics`
- final queue evidence: 750 uploaded / 0 pending / 0 no-MP4 / 750 total
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- this was not a YouTube upload/channel limit
- current 2026-07-17 CT total is 5 uploaded
- dirty risk remains: generated T9 media, repaired Grade 12 course JSONs,
  pipeline docs/runner/theme/audit changes, parent-trust audit fixture changes,
  and mixed local edits must not be broad-staged.

## Blocked: 2026-07-16 20:25 CT Run: Claude Session Limit / Stale Worker

The approved 5-cap heartbeat selected Personal Finance / Applied Economics M6
`stock-market-basics-v2`, but the cc worker stalled beyond its configured
1800-second limit while Claude Code was retrying the API. At 22:49 CT Central
Umi terminated only the stale Claude child; the existing worker/orchestrator
chain then exited cleanly and recorded `Claude Code session limit reached`.

- no duplicate producer or upload was started
- the target contains only source/teaching/visual briefs; no MP4, approval row,
  or partial upload exists
- the gate-ready uploader found 0 approved pending items and uploaded nothing
- fresh queue evidence remains 745 uploaded / 0 pending / 0 no-MP4
- smallest next action: after Claude Code session reset, let the next approved
  heartbeat resume M6 through the normal producer/review/gate-ready path
- do not manually approve/upload or broad-stage the mixed GIIS/T9 worktree

## Completed: 2026-07-16 14:34 CT 5-Cap Run: Personal Finance M1-M5 Uploaded

The 14:00 CT heartbeat completed the two-hour / 5-cap window. It did not start
a duplicate producer/upload or use any force-upload path.

- approved run path: `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`
- existing ready accepted: Personal Finance / Applied Economics M1-M2
- repaired/reviewed to ready: M3 independent/source review completed after
  the prior session-limit blocker; final gate score 100
- produced/rendered/reviewed to ready: M4 Credit, Debt & Credit Scores and
  M5 Introduction to Investing
- parent-trust: initial 5-lesson audit stopped on M5 investment dollar examples
  as `payment_claim`; Codex tightened the audit classifier plus fixtures for
  educational investment/portfolio dollar examples, fixture regression passed,
  and the 5-lesson recheck returned `TRUST_READY`
- upload path: `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 5 unlisted uploaded / 0 upload failed / 0 pending
- video IDs: M1 `utCAkk0BScU`, M2 `PFw1L2Xkjzc`, M3 `QaKYOUyQg18`,
  M4 `Ns_0MWlShW0`, M5 `ngfr9Pzx0GI`
- playlist: uploader created `Personal Finance / Applied Economics`
  playlist `PLXTmQGow1tFA`; M1 needed one transient playlist-add retry, then
  all five were added
- queue evidence: 745 uploaded / 0 pending / 0 no-MP4 / 745 total
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- this was not a YouTube upload/channel limit
- current 2026-07-16 CT total is now 22 uploaded
- dirty risk remains: repaired Grade 12 course JSONs, pipeline docs/runner,
  theme resolver/audit fixes, parent-trust audit code/fixture changes,
  generated T9 media, and mixed local edits must not be broad-staged.

## Completed: 2026-07-16 13:26 CT 5-Cap Run: Personal Finance M1-M2 Ready, M3 Review-Limited

The 12:00 CT heartbeat ran the approved two-hour / 5-cap path and did not start
a duplicate producer/upload or use any force-upload path.

- approved run path: `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`
- completed/rendered/reviewed to release-gate ready: Personal Finance /
  Applied Economics M1-M2
- M2 production details are recorded below; final release gate reached score
  100 / ready 1 after MP4 render and independent/source review
- produced/rendered but not release-ready: Personal Finance / Applied
  Economics M3
- M3 fix applied after worker review: path slide now says `Next up: Module 4 —
  Credit, Debt & Credit Scores`; MP4 was regenerated with the corrected slide
- M3 current blocker: missing independent second-pass/source-alignment review
  after Claude Code hit the session limit during the review phase
- parent-trust: initial audit falsely blocked M1 on the explicit negation
  `Neither guarantees an outcome`; Codex tightened
  `parent_trust_video_audit.py` plus fixture coverage for negated finance
  guarantee wording, fixture regression passed, and M1-M2 recheck returned
  `TRUST_READY`
- upload result: 0 uploaded / 0 failed; orchestrator stopped before approval
  artifact/upload, and Codex did not manually create approval rows
- queue evidence: 740 uploaded / 3 pending / 0 no-MP4 / 743 total
- direct release-gate check across M1-M3: 2 ready / 1 needs_revision / 0
  blocked; M3 is the needs_revision item
- no producer/upload process remained after the run
- this was not a YouTube upload/channel limit
- current 2026-07-16 CT total remains 17 uploaded
- smallest next action: after Claude Code reset, let the next approved
  heartbeat finish M3 independent/source review, then allow orchestrator to
  write approval rows and upload gate-ready Personal Finance videos through
  `yt_queue.py upload --gate-ready`
- dirty risk remains: repaired Grade 12 course JSONs, pipeline docs/runner,
  theme resolver/audit fixes, parent-trust audit code/fixture changes,
  generated T9 media, and mixed local edits must not be broad-staged.

## Completed: 2026-07-16 cc Pre-Render — Personal Finance / Applied Economics M2 Budgeting & Spending Plans

cc produced the full pre-render V2 folder for:
`teaching-videos/personal-finance-applied-economics-module-2-budgeting-spending-plans-v2/`

- script.json: 12 sections, 837 words, avg 69.8 w/s, max 82 w/s — all density gates pass
- build_slides.py: 12 slides (navy/maroon business theme; two-panel hook, needs/wants split panel,
  three-row 50/30/20 concept table, two-panel misconception strip, deterministic budget table
  worked example, pause prompt, MAROON_DARK answer reveal, three-card application with GIIS
  Learn Portal source label, recap with assignment footnote, path slide)
- contact-sheet.jpg, style_manifest.json (social_studies/navy theme), learning_check.json (4 checks)
- _review_A.json, _review_B.json, _review_C.json, _review_expert_lens.json — all pass, SHA bound
  (script_sha: 2081407941d2e9e8fc28cad63bbc13acc6108eb0c542436523423365a7550b42)
- Expert Lens: all 3 facets satisfied — insight in 05/07, watchFor in 06/08/09, transfer in 10/12
- Source alignment: GIIS Learn Portal label visible on application, recap, and path slides; no raw URLs
- Audit score: 74 / content quality gates pass — only expected pre-render gaps (no MP4,
  independent + source-alignment reviewer files out of scope per handoff, owned by orchestrator/wrapper)
- Reviewer SHA: all 4 reviewers bound, script_sha_matches: true, has_independent_second_pass: false (expected)
- Release gate: needs_revision only because of missing MP4 and out-of-scope reviewer files — content clean
- **Umi action**: orchestrator renders TTS/MP4/transcript; independent reviewer wrapper writes
  _review_independent_pass.json and _review_source_alignment.json; then re-run release gate.

## Completed: 2026-07-16 11:55 CT 5-Cap Run: Media Psychology M12 Uploaded, Personal Finance M1 Retry

The 10:00 CT heartbeat completed the next two-hour / 5-cap window. It did not
start a duplicate producer/upload or use any force-upload path.

- approved run path: `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`
- produced/rendered/reviewed/uploaded: Media Psychology M12
- final gate: M12 reached score 100 before approval/upload
- parent-trust: `TRUST_READY` for M12
- upload path: `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 1 unlisted uploaded / 0 upload failed / 0 pending
- video ID: M12 `VvFIbebNL8I`
- Media Psychology is now 12/12 uploaded
- retry item: Personal Finance / Applied Economics M1 course-design passed, and
  the worker wrote `script.json`, learning check, and the four initial reviewer
  files, but Claude Code hit a session limit before `build_slides.py`,
  slides/contact sheet, MP4, independent review, and approval/upload
- current queue evidence: 740 uploaded / 0 pending / 1 no-MP4 / 741 total
- no-MP4 item:
  `personal-finance-applied-economics-module-1-financial-goal-setting-mindset-v2`
- direct M1 release-gate check: needs_revision, audit score 8
- pending release gate: 0 ready / 0 needs_revision / 0 blocked because the
  retry item is no-MP4 rather than pending
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- this was not a YouTube upload/channel limit
- current 2026-07-16 CT total is now 17 uploaded
- smallest next action: after Claude Code reset, let the next approved
  heartbeat finish M1 slides/contact sheet/MP4/independent review, then upload
  through the same gate-ready path.
- dirty risk remains: repaired Grade 12 course JSONs, pipeline docs/runner,
  theme resolver/audit fix, parent-trust audit code/fixture changes, generated
  T9 media, and mixed local edits must not be broad-staged.

## Completed: 2026-07-16 09:17 CT 5-Cap Run: Media Psychology M7-M11 Uploaded

The 08:00 CT heartbeat completed the next two-hour / 5-cap window. It did not
start a duplicate producer/upload or use any force-upload path.

- approved run path: `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`
- produced/rendered/reviewed/uploaded: Media Psychology M7-M11
- final gate: each uploaded lesson reached score 100 before approval/upload
- parent-trust: `TRUST_READY` for all 5 uploaded lessons
- upload path: `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 5 unlisted uploaded / 0 upload failed / 0 pending
- video IDs: M7 `ltmtmcvAHE0`, M8 `Hr8bVqQt66M`, M9 `y3kCTHNegVU`,
  M10 `BeKcSBbNiS8`, M11 `98MuKqBIMxM`
- Media Psychology is now 11/11 uploaded
- current queue evidence: 739 uploaded / 0 pending / 0 no-MP4 / 739 total
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- this was not a YouTube upload/channel limit
- current 2026-07-16 CT total is now 16 uploaded
- non-blocking quality note: M7-M11 independent/source reviews repeatedly
  flagged the upstream `source_packet.expert_lens.family` as technology/CS
  wording for a psychology course, but each lesson translated it into
  psychology terms and no required fixes were recorded.
- dirty risk remains: repaired Grade 12 course JSONs, pipeline docs/runner,
  theme resolver/audit fix, parent-trust audit code/fixture changes, generated
  T9 media, and mixed local edits must not be broad-staged.

## Completed: 2026-07-16 06:40 CT 5-Cap Run: Media Psychology M2-M6 Uploaded

The 06:00 CT heartbeat completed the next two-hour / 5-cap window. It did not
start a duplicate producer/upload or use any force-upload path.

- approved run path: `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`
- produced/rendered/reviewed/uploaded: Media Psychology M2-M6
- final gate: each uploaded lesson reached score 100 before approval/upload
- parent-trust: `TRUST_READY` for all 5 uploaded lessons
- upload path: `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 5 unlisted uploaded / 0 upload failed / 0 pending
- video IDs: M2 `6d7OiO1tEA8`, M3 `TqGKgPVizPQ`, M4 `C-4XLqiBSJk`,
  M5 `OBD7Y_KfAlk`, M6 `X4WEGjwtud4`
- Media Psychology is now 6/6 uploaded
- current queue evidence: 734 uploaded / 0 pending / 0 no-MP4 / 734 total
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- this was not a YouTube upload/channel limit
- current 2026-07-16 CT total is now 11 uploaded
- quality caveat: M6's independent reviewer flagged `UCSB class of 2028` in
  the slide bio as a real style-rule issue; final gate/parent-trust allowed
  upload, but the repo rule requires full university names. Do not delete or
  reupload automatically; Alan should decide whether replacing M6 is worth the
  extra upload slot.
- dirty risk remains: repaired Grade 12 course JSONs, pipeline docs/runner,
  theme resolver/audit fix, parent-trust audit code/fixture changes, generated
  T9 media, and mixed local edits must not be broad-staged.

## Completed: 2026-07-16 04:17 CT 5-Cap Retry: Media Psychology M1 Uploaded, M2 Review-Limited

The 04:00 CT heartbeat retried the five Media Psychology no-MP4 items through
the approved two-hour / 5-cap path. It did not start a duplicate producer or
use any force-upload path.

- approved run path: `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`
- rendered/reviewed/uploaded: Media Psychology M1
- final gate: M1 reached score 100 with ready 1 / needs_revision 0 / blocked 0
  before approval/upload
- parent-trust: M1 returned `TRUST_READY`
- upload path: `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 1 unlisted uploaded / 0 upload failed
- video ID: M1 `W22EkYY10aY`
- playlist: uploader created `Media Psychology` playlist `PLNO6BC0qYxbM` and
  added M1
- retry/blocker: M2 rendered MP4/transcript and reached audit
  `pass_with_minor_notes` score 88, but Claude Code hit a session limit during
  the Opus independent-review step; M2 is now the single needs_revision /
  pending item missing independent second-pass review
- remaining no-MP4 items: Media Psychology M3-M5 still need TTS/MP4 render and
  independent/source review
- current queue evidence: 729 uploaded / 1 pending / 3 no-MP4 / 733 total;
  Media Psychology is 1 uploaded / 1 pending / 3 no-MP4
- pending release gate: 0 ready / 1 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- this was not a YouTube upload/channel limit
- current 2026-07-16 CT total is now 6 uploaded
- smallest next action: after Claude Code session reset, let the next approved
  heartbeat finish M2 independent review/upload first, then render/review
  M3-M5 through the same 5-cap path
- dirty risk remains: repaired Grade 12 course JSONs, pipeline docs/runner,
  theme resolver/audit fix, parent-trust audit code/fixture changes, generated
  T9 media, and mixed local edits must not be broad-staged.

## Completed: 2026-07-16 02:49 CT 5-Cap Run: Media Psychology M1-M5 Pre-Render, 0 Uploaded

The 02:00 CT heartbeat ran the approved two-hour / 5-cap path. It did not
start a duplicate producer or use any force-upload path.

- approved run path: `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`
- Digital Media & Society M1-M12 were skipped because their Open Library
  resource checks returned `open.lib.umn.edu` 403 fetch failures
- generated pre-render artifacts: Media Psychology M1-M5
- current state of those 5: `no MP4`; each folder still needs orchestrator
  TTS/MP4 render plus independent pass/source-alignment wrapper files before
  release gate can be ready
- upload path: `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 0 uploaded / 0 upload failed / 0 gate-ready pending
- narrow pipeline fix accepted during M1: `slide_kit.py` and
  `audit_lessons.py` now resolve psychology before literature so `Media
  Psychology` uses the psychology theme instead of matching `Media` as
  literature
- resolver sanity check: `Media Psychology => psychology`, `Digital Media &
  Society => literature`, `Counseling & Mental Health Studies => psychology`
- current queue evidence: 728 uploaded / 0 pending / 5 no-MP4 / 733 total
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- this was not a YouTube upload/channel limit
- current 2026-07-16 CT total remains 5 uploaded
- smallest next action: let the next approved heartbeat retry/render the 5
  Media Psychology no-MP4 items through the same 5-cap path; repair Digital
  Media resources separately only if that course is needed next
- dirty risk remains: repaired Grade 12 course JSONs, pipeline docs/runner,
  theme resolver/audit fix, parent-trust audit code/fixture changes, generated
  T9 media, and mixed local edits must not be broad-staged.

## Completed: 2026-07-16 01:11 CT 5-Cap Run: Counseling M8-M12 Uploaded

The 00:00 CT heartbeat ran the approved two-hour / 5-cap path. It did not
start a duplicate producer or use any force-upload path.

- approved run path: `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`
- produced/rendered/reviewed/uploaded: Counseling & Mental Health M8-M12
- final gate: each uploaded lesson reached score 100 with ready 1 /
  needs_revision 0 / blocked 0 before approval/upload
- parent-trust: `TRUST_READY` for all 5
- upload path: `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 5 unlisted uploaded / 0 upload failed / 0 pending
- video IDs: M8 `lIFINCze3Ow`, M9 `UTVwQ9D0TVo`, M10 `VkUrkaSVI7k`,
  M11 `K_oLaQITqUo`, M12 `ZxjtObklpsQ`
- Counseling & Mental Health is now 12/12 uploaded
- current queue evidence: 728 uploaded / 0 pending / 0 no-MP4 / 728 total
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- this was not a YouTube upload/channel limit
- current 2026-07-16 CT total is 5 uploaded
- dirty risk remains: repaired Grade 12 course JSONs, prior pipeline docs/runner
  and parent-trust audit code/fixture changes, generated T9 media, and mixed
  local edits must not be broad-staged.

## Completed: 2026-07-15 23:09 CT 5-Cap Run: Counseling M2/M4-M7 Uploaded

The 22:00 CT heartbeat retried the prior Counseling M2 no-MP4 item and
continued the 5-cap path without starting a duplicate producer or using a
force-upload path.

- approved run path: `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`
- produced/rendered/reviewed/uploaded: Counseling & Mental Health M2, M4, M5,
  M6, and M7
- M2 repair: the prior stale/zero-byte TTS segment was regenerated and the
  lesson rendered cleanly
- M7 repair: parent-trust hard-stopped on the crisis-response example phrase
  `It will get better`; Codex narrowed the fix to `Try to stay positive`,
  regenerated the stale `05_misconception` audio/MP4/transcript, refreshed
  review SHA bindings, and reran the release gate
- final gate: each uploaded lesson reached score 100 with ready 1 /
  needs_revision 0 / blocked 0 before upload
- parent-trust: repaired batch returned `TRUST_READY` for all 5
- upload path: `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 5 unlisted uploaded / 0 upload failed / 0 pending
- video IDs: M2 `SslhML4fnjc`, M4 `sZCruQt4W_w`, M5 `wIOVveWdMiE`,
  M6 `fk9znClHzHg`, M7 `1mmfsoQUwe0`
- current queue evidence: 723 uploaded / 0 pending / 0 no-MP4 / 723 total
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- this was not a YouTube upload/channel limit
- same-day CT total is now 28 uploaded on 2026-07-15
- dirty risk remains: repaired Grade 12 course JSONs, prior pipeline docs/runner
  and parent-trust audit code/fixture changes, generated T9 media, and mixed
  local edits must not be broad-staged.

## Completed: 2026-07-15 21:10 CT 5-Cap Run: 4 Uploaded, 1 TTS Retry

The 20:00 CT heartbeat ran the approved path and safely advanced the next
course sequence. It did not start a duplicate producer or use any force-upload
path.

- approved run path: `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`
- produced/rendered/reviewed/uploaded: Abnormal Psychology M11-M12,
  Counseling & Mental Health M1 and M3
- final gate: each uploaded lesson reached score 100 with ready 1 /
  needs_revision 0 / blocked 0 before approval/upload
- parent-trust: `TRUST_READY` for the 4 uploaded lessons
- upload path: `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 4 unlisted uploaded / 0 upload failed / 0 pending
- video IDs: Abnormal M11 `9_BfBn3cNKk`, Abnormal M12 `PqCm1i73p8E`,
  Counseling M1 `0XZU3VvEBqs`, Counseling M3 `sFKwjhrgWjY`
- retry item: Counseling & Mental Health M2 produced pre-render artifacts, but
  MP4 render hit an Edge TTS websocket connection timeout while synthesizing
  section 04; it remains the only `no MP4` item and was not uploaded
- current queue evidence: 718 uploaded / 0 pending / 1 no-MP4 / 719 total
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- Abnormal Psychology is now 12/12 uploaded
- this was not a YouTube upload/channel limit; smallest next action is to let
  the next heartbeat retry the M2 render through the same approved path before
  continuing new modules

## Completed: 2026-07-15 19:34 CT Abnormal Psychology M6-M10

The second two-hour / 5-cap heartbeat continued the big validation Alan asked
for, without starting a duplicate producer or using any force-upload path.

- approved run path: `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`
- produced/rendered/reviewed/uploaded: Abnormal Psychology M6-M10
- final gate: each lesson reached score 100 with ready 1 / needs_revision 0 /
  blocked 0 before approval/upload
- parent-trust: `TRUST_READY` for all 5
- upload path: `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 5 unlisted uploaded / 0 failed / 0 pending
- video IDs: M6 `mYKIYf5hW4E`, M7 `w-VUjwN3h3A`, M8 `TS2t4rOZ1m4`,
  M9 `FUtiySPIfv4`, M10 `CFFS4ZAI05k`
- current queue evidence: 714 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- Abnormal Psychology is now 10/10 uploaded
- dirty risk remains: repaired Grade 12 course JSONs, prior Business
  Law/Corporate Finance JSONs, parent-trust audit code/fixture changes,
  pipeline docs/runner changes, generated T9 media, and other mixed local
  changes must not be broad-staged.

## Completed: 2026-07-15 18:26 CT Course-Design Unblock + Abnormal Psychology M1-M5

Alan asked to fix all current course-design blockers and to use the big
pipeline validation instead of stopping at small checks.

- course-design repair: added a real 12th module to all seven blocked
  1-credit / 11-module Grade 12 candidates: Abnormal Psychology, Counseling &
  Mental Health, Digital Media & Society, Media Psychology, Personal Finance &
  Applied Economics, Psychology Seminar Capstone, and Sports Management &
  Leadership.
- validation: direct course-design review now passes for all seven repaired
  courses.
- approved run path: `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`
- produced/rendered/reviewed/uploaded: Abnormal Psychology M1-M5
- final gate: each lesson reached score 100 with ready 1 / needs_revision 0 /
  blocked 0 before approval/upload
- parent-trust: `TRUST_READY` for all 5
- upload path: `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 5 unlisted uploaded / 0 failed / 0 pending
- video IDs: M1 `QM0g3oVYCes`, M2 `0VORdiHVJzE`, M3 `DxfgBsKrUZU`,
  M4 `EcFBRitEddQ`, M5 `yVUfwAMy1PM`
- current queue evidence: 709 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- dirty risk remains: repaired Grade 12 course JSONs, prior Business
  Law/Corporate Finance JSONs, parent-trust audit code/fixture changes,
  pipeline docs/runner changes, generated T9 media, and root cwd-drift
  `slides/` / `style_manifest.json` must not be broad-staged.

## Completed: 2026-07-15 16:29 CT Course-Design Blocker Discovery

The first two-hour / 5-cap heartbeat after the cadence change ran the approved
producer path and found the blocker that was fixed in the later 18:26 CT run:

- command: `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`
- result: 0 produced / 0 uploaded / 0 failed
- blocker class: `quality_gate / course_design`
- evidence: seven next grade-12 candidates were blocked because they were
  1-credit courses with 11 modules, outside the expected 12-16 range
- safe unblock attempt: checked built-in course-design repair path; it
  deliberately avoids adding/deleting modules, so it could not fix the 11->12
  module-count issue automatically.

## Completed: 2026-07-15 Automation Cadence Change

Alan asked to change the foundation-video automation to run every two hours and
cap each run at five videos.

- updated Codex automation:
  `/Users/alanhdchu/.codex/automations/giis-foundation-video-split-batch/automation.toml`
  now uses `rrule = "FREQ=HOURLY;INTERVAL=2;BYMINUTE=0;BYSECOND=0"`
- updated automation prompt: every heartbeat is a producer/top-up window capped
  at 5 modules/uploads
- updated repo runner defaults in `tools/lesson-video/foundation_daily.sh`:
  `FOUNDATION_MAX_MODULES` and `FOUNDATION_UPLOAD_MAX` now default to `5`
- updated pipeline docs/playbook/roadmap to match the new cadence
- no producer/upload was started by this change

## Completed: 2026-07-15 13:00 CT Corporate Finance M11 Upload

Codex waited for the 13:00 CT slot, confirmed no overlap, and used only the
approved `npm run lesson:foundation-daily` / orchestrator path.

- target: Corporate Finance M11, previously held after a real bond-price math
  narration defect was fixed but independent/source review was stale
- orchestrator cleared stale independent reviewer files and render cache, then
  regenerated MP4/transcript
- Opus independent reviewer: pass; source alignment: pass
- final release gate: ready 1 / needs_revision 0 / blocked 0
- parent-trust: `TRUST_READY`
- upload path: `yt_queue.py upload --gate-ready --max 10 --privacy unlisted`
- result: 1 unlisted uploaded / 0 failed
- video ID: `O1NNSzZ9ykw`
- current queue evidence: 704 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- dirty risk remains: `ROADMAP.md`, `umi/workload.md`, Business Law and
  Corporate Finance course JSONs, parent-trust audit code/fixture changes, root
  cwd-drift `slides/` and `style_manifest.json`, plus generated T9 media. Do
  not broad-stage without a scoped review.

## Completed: 2026-07-15 08:00 CT Corporate Finance M9-M12 Top-Up

Codex stayed on the approved foundation/orchestrator path and did not start a
duplicate producer or use any force-upload path.

- produced/rendered Corporate Finance M9, M10, M11, and M12; M11 was held by
  release gate after independent review found a real bond-price narration error
- fixed M11 script narration from the wrong 4% yield price (~$1,345) to the
  correct price (~$1,162), rebuilt slides, and left it pending fresh
  independent/source-alignment review before upload
- repaired a parent-trust audit false positive so supplier invoice terms in a
  Corporate Finance lesson are treated as business instruction, not GIIS
  payment/tuition wording; fixture regression passed
- parent-trust rerun for M9/M10/M12: `TRUST_READY`
- upload path: `yt_queue.py upload --gate-ready --max 10 --privacy unlisted`
- result: 3 unlisted uploaded / 0 failed
- video IDs: M9 `O8IA0Y4ikAg`, M10 `ptUS0Wd_PbA`, M12 `qiNQujccb14`
- current queue evidence: 703 uploaded / 1 pending / 0 no-MP4
- pending release gate: 0 ready / 1 needs_revision / 0 blocked; the pending
  item is Corporate Finance M11, needing fresh independent review after the
  math fix
- manifest alignment: 0 warnings across 577 lessons
- dirty risk remains: `ROADMAP.md`, `umi/workload.md`, Business Law and
  Corporate Finance course JSONs, parent-trust audit code/fixture changes, root
  cwd-drift `slides/` and `style_manifest.json`, plus generated T9 media. Do
  not broad-stage without a scoped review.

## Completed: 2026-07-15 03:00 CT Corporate Finance M4-M8 Upload

Codex reran the approved foundation daily path after the prior cc-limit stop:

- produced/rendered Corporate Finance M4-M8 through
  `npm run lesson:foundation-daily` with `FOUNDATION_MAX_MODULES=5` and
  `FOUNDATION_UPLOAD_MAX=5`
- parent-trust audit: `TRUST_READY` for all 5
- final release gates: 5 ready / 0 needs_revision / 0 blocked before upload
- upload path: `yt_queue.py upload --gate-ready --max 5 --privacy unlisted`
- result: 5 uploaded / 0 failed / 0 pending
- video IDs: `HbMmR01j-Pw`, `XKue3VHkHiQ`, `vg2EVsTVyRM`, `E7TC9dihtEY`,
  `hwWv9Hm7wbQ`
- current queue evidence: 700 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: 0 warnings across 577 lessons
- no producer/upload process remained after the run
- dirty risk remains: `ROADMAP.md`, `umi/workload.md`, Business Law and
  Corporate Finance course JSONs are modified; root cwd-drift `slides/` and
  `style_manifest.json` remain untracked. Do not broad-stage generated media or
  T9 artifacts.

## Completed: Corporate Finance Module 8 Dividend Policy Pre-Render Production (2026-07-15)

cc produced the full pre-render V2 folder for:
`teaching-videos/corporate-finance-module-8-dividend-policy-v2/`

- script.json: 11 sections, 873 words, avg 79.4 w/s, max 88 w/s — all density gates pass
- build_slides.py: 11 slides (gold/maroon business theme, two-panel dividend-vs-buyback hook,
  four-row M&M + signaling + clientele + real-market concept table, compare misconception strip,
  four-step worked example with dividend/buyback/M&M/expert rows, gold-banner pause,
  MAROON-header answer reveal, three-card application with wealth/signaling/expert lens,
  source label on concept + application + recap slides)
- contact-sheet.jpg, style_manifest.json (default/gold theme), learning_check.json (4 checks)
- _review_A.json, _review_B.json, _review_C.json, _review_expert_lens.json — all pass, SHA bound
  (script_sha: 54d42d3c5579c9c0ff4c28c14e9d12f848c9f411e5aa85f3a45cf575d9b32463)
- Expert Lens: all 3 facets satisfied (insight in 04/06, watchFor in 05/07, transfer in 09/11)
- Source alignment: "OpenStax Financial Management Ch 18" visible on concept + application + recap
  slides, no raw URLs, path slide names textbook by name
- Audit score: 74 / content quality gates pass — only expected pre-render gaps (no MP4,
  independent + source-alignment reviewer files out of scope per handoff, owned by
  orchestrator/wrapper)
- Release gate: needs_revision only because of the expected missing MP4 and out-of-scope
  reviewer files — content is clean
- **Umi action**: orchestrator renders TTS/MP4/transcript; independent reviewer wrapper writes
  _review_independent_pass.json and _review_source_alignment.json; then re-run release gate.

## Completed: English IV Media Writing Module 11 Pre-Render Production (2026-07-09)

cc produced the full pre-render V2 folder for:
`teaching-videos/english-iv-media-writing-module-11-professional-writing-v2/`

- script.json: 11 sections, 859 words, avg 78.1 w/s, max 84 w/s — all density gates pass
- build_slides.py: 11 slides (sepia/maroon lit theme, four-decision framework diagram,
  writer-needs-first vs audience-aware compare strips, revision annotation callouts,
  OpenStax source label on concept + application slides)
- contact-sheet.jpg, style_manifest.json (literature theme), learning_check.json (4 checks)
- _review_A.json, _review_B.json, _review_C.json, _review_expert_lens.json — all pass, SHA bound
- Expert Lens: all 3 facets satisfied (insight/watchFor/transfer)
- Source alignment: "OpenStax Writing Guide — Chapter 11: Professional Writing" visible on slides, no raw URLs
- Audit score: 68 / content quality gates pass — only expected pre-render gaps (no MP4,
  independent + source-alignment reviewer files out of scope per handoff, owned by orchestrator/wrapper)
- Release gate: needs_revision only because of the expected missing MP4 and out-of-scope reviewer files
- **Umi action**: orchestrator renders TTS/MP4/transcript; independent reviewer wrapper writes
  _review_independent_pass.json and _review_source_alignment.json; then re-run release gate.

## Completed: English IV Media Writing Module 1 Pre-Render Production (2026-07-08)

cc produced the full pre-render V2 folder for:
`teaching-videos/english-iv-media-writing-module-1-advanced-composition-review-v2/`

- script.json: 11 sections, 846 words, avg 76.9 w/s, max 99 w/s — all density gates pass
- build_slides.py: 11 slides (sepia/maroon lit theme, OpenStax source label on application + path)
- contact-sheet.jpg, style_manifest.json, learning_check.json (3 checks)
- _review_A.json, _review_B.json, _review_C.json, _review_expert_lens.json — all pass, SHA bound
- Expert Lens: all 3 facets satisfied (insight/watchFor/transfer)
- Source alignment: OpenStax Writing Guide visible on slides, no raw URLs
- Audit score: 68 / quality gates pass — only expected pre-render gaps (no MP4, independent + source-alignment reviewer files out of scope per handoff, owned by orchestrator/wrapper)
- Release gate: needs_revision only because of the expected missing MP4 — content is clean
- **Umi action**: orchestrator renders TTS/MP4/transcript; independent reviewer wrapper writes _review_independent_pass.json and _review_source_alignment.json; then re-run release gate.

## Active Handoff: System + Parent-Facing Optimization Backlog

- owner: Codex (repo fully handed to Codex by Alan on 2026-07-03)
- repo: `/Users/alanhdchu/giis-website`
- mode: Codex implementation with cc-ready follow-up for P1 semantic redesign
- model routing:
  - Sonnet: bounded implementation, mechanical cleanup, playlist/upload hygiene.
  - Opus: parent-trust semantic redesign, public-claim/payment/deploy judgment.
- priority: medium (no live production blocker; quality/trust hardening)
- time anchor: 2026-07-03
- time-aware continuity acknowledged?: yes
- state: P1/P2/P3/P4/P5 implemented by Codex; no active cc blocker remains

## Objective

cc ran a read-only system + parent-facing review at Alan's request. CC-quota and
T9-mount "problems" were ruled out as physical/contextual rather than systemic.
The actionable backlog from this pass has been implemented. Completed history
has been moved out of this active handoff; use this file only for the next
focused worker task.

## Current Lesson-Video State

Alan's 2026-07-06 stopped-lane blockers were repaired, and Alan then directly
asked Codex to push 10 more videos and upload. Codex used the approved
foundation orchestrator path with `yt_queue.py upload --gate-ready` and did not
start a duplicate producer.

Current snapshot after the 2026-07-14 23:01 CT follow-up top-up:

- Alan asked to push another 10 after the 21:34 CT Business Law top-up. Codex
  continued through the approved foundation/orchestrator path without starting
  a duplicate producer or using any force upload path.
- upload result for this follow-up: 5 unlisted uploaded / 0 failed /
  0 still pending
- latest 5 uploaded: Business Law M11-M12 and Corporate Finance M1-M3. Video
  IDs: `Nl4doU8yYlI`, `XFJ6lu2xerM`, `INq2SmpZWA4`, `uuKW7q_93Ak`,
  `CFCIXqp_XFg`.
- Corporate Finance M3 had a real generated path-slide issue before upload:
  the next-module label said `Capital Budgeting` even though Module 4 is
  `Risk & Return`. Codex patched the generated `build_slides.py`, reran the
  MP4/foundation gate, ran Opus independent/source review, and release gate
  returned ready before upload.
- current same-day count: 48 uploaded on 2026-07-14 CT
- current queue evidence: 695 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- stop reason: Claude Code reported a session limit while starting Corporate
  Finance M4. This is not a YouTube upload/channel limit. M4 has only
  `source_packet.json`, `teaching_brief.md`, and `visual_brief.md`; no
  `script.json` exists yet, so it is not renderable/uploadable.
- dirty risk: untracked root cwd-drift `slides/` and `style_manifest.json`
  remain; Business Law and Corporate Finance course JSON repairs remain local.
  Do not stage generated lesson-video media/T9 artifacts or the root drift
  files without a scoped cleanup/review decision.
- next action: wait for Claude Code session reset, then rerun a bounded
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5` or normal producer pass.
  Do not retry broad generation immediately.

Previous snapshot after the 2026-07-14 21:33 CT Business Law top-up:

- Alan asked to move another 10 forward after the 18:00 CT course-design stop.
  Codex added a bounded 12th Business Law ethics/compliance module to repair the
  11-module / 1-credit course-design guard, then ran the approved foundation
  path with `FOUNDATION_MAX_MODULES=10` and `FOUNDATION_UPLOAD_MAX=10`.
- upload result: 10 unlisted uploaded / 0 failed / 0 still pending
- parent-trust: `TRUST_READY`
- current same-day count: 43 uploaded on 2026-07-14 CT
- current queue evidence: 690 uploaded / 0 pending / 0 no-MP4
- gate-ready dry-run: 0 pending with human approval
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- latest 10 uploaded: Business Law M1-M10. Video IDs: `ZCs0tthVftw`,
  `2_ZCjefjN0M`, `PHnOQ_5j4Mo`, `d4-lJEr0N0U`, `WK3A73YSe7o`,
  `4JWMisZPvXs`, `kGmAa8Y6lOs`, `NRiVtzmCJ-w`, `V-wZIM-Nj1Q`,
  `RO8ddWfNzAE`.
- upload lane used video-first settings: captions, thumbnails, manifest sync,
  and cleanup remain reconciliation/backlog unless Alan opens that slot.
- dirty risk: untracked root cwd-drift `slides/` and `style_manifest.json`
  reappeared and were not deleted in this run; do not stage them or generated
  lesson-video media/T9 artifacts.
- next action: no more upload is pending; next separate work is either a scoped
  cleanup/ignore decision for the root drift artifacts, review of the Business
  Law course JSON repair before commit, or the older `24728ddf` push judgment.

Previous snapshot after the 2026-07-14 18:00 CT producer attempt:

- The approved 18:00 CT foundation run started through
  `npm run lesson:foundation-daily`; no duplicate producer/upload was active.
- result: 0 produced / 0 uploaded / 0 failed
- reason: grade 10 has no selectable unfinished candidates; auto-advance
  reached grade 12, but the next available courses were blocked by the
  course-design guard as 11-module / 1-credit courses outside the expected
  12-16-module shape.
- current same-day count: 33 uploaded on 2026-07-14 CT
- current queue evidence: 680 uploaded / 0 pending / 0 no-MP4
- gate-ready dry-run: 0 pending with human approval
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- no root cwd-drift artifacts remained after the run; do not stage generated
  lesson-video media or T9 artifacts.
- next action: a bounded course-design repair/selection lane is needed before
  another producer can reach the 40-video target; the 20:00 CT lane should
  count/dashboard first and avoid forcing blocked courses through upload gates.

Previous snapshot after the 2026-07-14 13:40 CT Statistics completion/upload:

- The approved 13:00 CT foundation run completed Statistics for Social
  Sciences M11-M13, passed parent-trust as `TRUST_READY`, wrote clean
  release-gate approval rows, and uploaded all 3 unlisted through
  `yt_queue.py upload --gate-ready`; no duplicate producer/upload was started.
- upload result: 3 unlisted uploaded / 0 failed / 0 still pending
- current same-day count: 33 uploaded on 2026-07-14 CT
- current queue evidence: 680 uploaded / 0 pending / 0 no-MP4
- gate-ready dry-run: 0 pending with human approval
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- latest 3 uploaded: Statistics for Social Sciences M11-M13. Video IDs:
  `4RglrcdbF6Q`, `xC7jAs6RDUw`, `0RefO27bw6w`.
- upload lane used video-first settings: captions, thumbnails, manifest sync,
  and cleanup remain reconciliation/backlog unless Alan opens that slot.
- no root cwd-drift artifacts remained after the run; do not stage generated
  lesson-video media or T9 artifacts.
- next action: no immediate upload action; next useful producer window is
  18:00 CT, with the 20:00 CT lane reserved for count/top-up toward 40 if
  Alan still wants that target.

Previous snapshot after the 2026-07-14 10:13 CT Statistics production/upload:

- The approved 08:00 CT foundation run auto-advanced to Statistics for Social
  Sciences, produced M1-M10, passed parent-trust as `TRUST_READY`, wrote clean
  release-gate approval rows, and uploaded all 10 unlisted through
  `yt_queue.py upload --gate-ready`; no duplicate producer/upload was started.
- upload result: 10 unlisted uploaded / 0 failed / 0 still pending
- current same-day count: 30 uploaded on 2026-07-14 CT
- current queue evidence: 677 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- latest 10 uploaded: Statistics for Social Sciences M1-M10. Video IDs:
  `fx3zFkhiC54`, `qvREpxBTwKg`, `mSh2eq5hQh4`, `Co3_n5zKNDU`,
  `ehsmg29ReEg`, `J3FLexn_d5Q`, `YqLC9W0rVKY`, `Ba3_XkwSVLs`,
  `Uxzi9JfJvYo`, `wwqK9tva2oI`.
- upload lane used video-first settings: captions, thumbnails, manifest sync,
  and cleanup remain reconciliation/backlog unless Alan opens that slot.
- dirty risk handled: root cwd-drift `slides/` and `style_manifest.json`
  reappeared during the producer and were removed after confirming no
  producer/upload process was active; do not stage generated lesson-video media
  or T9 artifacts.
- next action: no immediate upload action; next useful producer window is
  13:00 CT, with the 20:00 CT lane reserved for count/top-up toward 40 if
  Alan still wants that target.

Previous snapshot after the 2026-07-14 06:24 CT Sociology production/upload:

- The approved 03:00 CT foundation run produced Sociology M4-M13 and uploaded
  all 10 unlisted through `yt_queue.py upload --gate-ready`; no duplicate
  producer/upload was started.
- Parent-trust initially returned `FIX_FIRST` for Sociology M7 because a
  hypothetical worked example used `cannot afford tuition`, which the audit
  classified as a payment claim. Codex changed the wording to
  `cannot afford college costs`, regenerated M7 section 06 audio/MP4, refreshed
  stale review SHA bindings, reran parent-trust to `TRUST_READY`, and only then
  wrote clean-pass approval rows.
- upload result: 10 unlisted uploaded / 0 failed / 0 still pending
- current same-day count: 20 uploaded on 2026-07-14 CT
- current queue evidence: 667 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- latest 10 uploaded: Sociology M10-M13 and M4-M9. Video IDs:
  `Fw-E93Z7YZg`, `0t1gO9ht8Ds`, `Z2PD9TftkUs`, `A3aYNebaOL8`,
  `oV3gPrwDga4`, `7qt6d6nRPtc`, `UunssyG72lo`, `LCNWiJZDtEI`,
  `5CtnSWT1iko`, `Gnk3S5Q3mEg`.
- upload lane used video-first settings: captions, thumbnails, manifest sync,
  and cleanup remain reconciliation/backlog unless Alan opens that slot.
- root cwd-drift `slides/` and `style_manifest.json` reappeared during the
  producer and were removed after confirming no producer/upload process was
  active; do not stage generated lesson-video media or T9 artifacts.
- next action: no immediate upload action; if Alan wants website-visible lesson
  reconciliation, run the normal manifest/sync review separately from producer
  volume.

Previous snapshot after the 2026-07-14 00:05 CT repair/upload completion:

- Alan asked Codex to fix the stopped 10-video batch and continue uploading.
  Codex did not start a duplicate producer. It reused the existing generated
  lessons, repaired parent-trust hard findings in Organizational Behavior &
  Communication M2 and M5, refreshed the stale render caches through the
  orchestrator/gate path, reran parent-trust to `TRUST_READY`, wrote the normal
  release-gate approval artifact, and uploaded through `yt_queue.py upload
  --gate-ready`.
- upload result: 10 unlisted uploaded / 0 failed / 0 still pending
- current same-day count: 10 uploaded on 2026-07-14 CT
- current queue evidence: 657 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- latest 10 uploaded: Organizational Behavior & Communication M2-M8 and
  Sociology M1-M3. Video IDs: `T7Wd21neEjo`, `pArSmGnNBAs`,
  `lEC_zE1v1Ic`, `VFaimFI9Lec`, `d0M_1AI_9CQ`, `kESudedTS5I`,
  `gyfeGrXAZ1U`, `UlMZp9aICUs`, `_LRMZQYe48Q`, `Mgz_jjTvwSc`.
- upload lane used video-first settings: captions, thumbnails, manifest sync,
  and cleanup remain reconciliation/backlog unless Alan opens that slot.
- next action: no immediate upload action; if Alan wants website-visible lesson
  reconciliation, run the normal manifest/sync review separately from producer
  volume.

Previous snapshot after the 2026-07-09 08:00 CT 10-more run:

- The approved foundation run produced/collected 10 gate-ready lessons and
  uploaded all 10 unlisted through the orchestrator path; upload result:
  10 uploaded / 0 failed.
- Parent-trust initially returned `FIX_FIRST` for English IV Writing M5 because
  a standardized-testing debate example used public-facing college-admissions
  wording. Codex repaired that example to a school-uniforms /
  student-expression debate, regenerated M5 audio/MP4, and parent-trust reran
  `TRUST_READY`.
- current same-day count: 20 uploaded on 2026-07-09 CT
- current queue evidence: 647 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- latest 10 uploaded: English IV Writing M3-M5, M7-M12, and Organizational
  Behavior & Communication M1. Video IDs: `irSU5PuONbo`, `jc1cemPwF88`,
  `KvfAr-RP_P8`, `SUZoEhnWxpw`, `U5_3VKCbiV8`, `_xO5dR9NWXk`,
  `qpRKi6JXGbE`, `k92mE1BeaUs`, `o1AMPW11YyA`, `PNNRkIfoCaM`.
- remaining non-AP published modules needing completion/upload: 254 of 901.
- skipped source-repair items: English IV Writing M6 and M13 failed the
  resource check because `open.lib.umn.edu` returned 403. Keep this as a
  source cleanup/top-up issue; it is not a video-upload blocker.
- next action: no immediate upload action; next bounded production pass should
  continue through the same approval/orchestrator path and repair source 403s
  or let auto-advance choose clean lessons.

Previous snapshot after the 2026-07-09 03:00 CT 10-more run:

- The approved foundation run produced/collected 10 gate-ready lessons and
  uploaded all 10 unlisted through the orchestrator path; upload result:
  10 uploaded / 0 failed.
- Parent-trust initially returned `FIX_FIRST` for English IV Writing M2 because
  `admissions readers` appeared in public narration. Codex repaired it to
  `personal-statement readers`, regenerated M2 audio/MP4, reran Opus
  independent review, and parent-trust reran `TRUST_READY`.
- current queue evidence: 637 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- latest 10 uploaded: English IV Media Writing M6-M13 and English IV Writing
  M1-M2. Video IDs: `MkMfPb17Upo`, `ZlvRkzQtOrQ`, `KWp9Rr7ElII`,
  `86a89d97sfo`, `32vV3uwT_CI`, `dVEJ5gymtUE`, `jLF4oKZ7ZTY`,
  `lWLdX1fRGGQ`, `FbdXCkQkBgo`, `QlTJ7e-eLSQ`.
- remaining non-AP published modules needing completion/upload: 264 of 901.
- dirty risk handled: root cwd-drift `slides/` and `style_manifest.json`
  artifacts were archived, not deleted, under
  `docs/archive/lesson-video-cwd-drift/2026-07-09-0517/`.
- next action: no immediate upload action; next bounded production pass should
  continue through the same approval/orchestrator path and keep course-design
  guard cleanup separate from upload pressure.

Current snapshot after the 2026-07-08 23:20 CDT direct 10-more request:

- Alan asked Codex to generate 10 more lesson videos and upload. Codex used the
  approved `npm run lesson:foundation-daily` path with
  `FOUNDATION_MAX_MODULES=10` / `FOUNDATION_UPLOAD_MAX=10`; no duplicate
  producer/upload was started.
- The run produced and uploaded 5 English IV Media Writing lessons (M1-M5),
  then stopped safely when Claude Code reported a session limit before selecting
  more modules. This is not a YouTube upload/channel-limit blocker.
- current same-day count: 30 uploaded on 2026-07-08 CT
- current queue evidence: 628 total / 627 uploaded / 1 pending / 0 no-MP4
- pending release gate: 1 ready / 0 needs_revision / 0 blocked
- pending ready item: English IV Media Writing M6; it is not in the current
  approval artifact, so do not manually bypass the approval/orchestrator path.
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- latest 5 uploaded: English IV Media Writing M1-M5. Video IDs:
  `YrniQ3OgIPw`, `vJPxDmrGUR4`, `DZlKGwKUHbU`, `kjmtn7ALwHY`,
  `ku2eyoY0coc`.
- remaining non-AP published modules needing completion/upload: 274 of 901
  (G10: 9, G11: 8, G12: 165, no gradeLevel: 92).
- dirty risk handled: new root cwd-drift `slides/` and `style_manifest.json`
  artifacts were archived, not deleted, under
  `docs/archive/lesson-video-cwd-drift/2026-07-08-2320/` after confirming the
  producer had stopped. Do not stage generated lesson-video media or T9
  artifacts.
- next action: after the Claude Code session resets, run another bounded
  approved orchestrator pass; let it approve/upload the pending M6 only if the
  normal parent-trust/release gates allow it. Continue course-design cleanup for
  the 11-module / 1-credit Grade 12 guard before broad top-up volume.

Previous snapshot after the 2026-07-08 15:30 CDT 40-target top-up request:

- Alan asked whether GIIS can補 toward 40 same-day uploads. Current same-day
  count is 25 uploaded on 2026-07-08 CT. The pipeline can continue only as
  gates allow; 40 is a target, not permission to force weak lessons or start
  duplicate producers.
- The approved `npm run lesson:foundation-daily` 10-cap top-up completed through
  the gate-ready upload path. No `foundation_daily.sh`,
  `foundation_daily_orchestrator.py`, `foundation_video_gate.py`,
  `make_lesson.py`, or `yt_queue.py upload` process is active as of 18:04 CT.
- current queue evidence: 622 total / 622 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- latest 10 uploaded: English IV Analytical Writing M7-M13 except M6, plus
  English IV Media & Analytical Writing M6, M7, and M9. Video IDs:
  `wGFLVYnkghM`, `FbpnlDRhSr4`, `SVP9v0Fx1dM`, `g-cWN55y3h0`, `ucjI82jF4LQ`,
  `LCh3y7f4uRk`, `WZLnndAJLN8`, `EvVud7i9YbI`, `x5JCJRzMQPs`,
  `iRi4rDv67jA`.
- dirty risk handled: root `slides/` and `style_manifest.json` reappeared as
  untracked cwd-drift artifacts during the top-up and were archived, not
  deleted, under `docs/archive/lesson-video-cwd-drift/2026-07-08-2002/` at the
  20:00 CT lane after confirming no producer/gate process was active.
- 20:00 CT top-up lane result: do not start another full producer yet. Dry-run
  auto-advanced from Grade 10 to Grade 12, but the next visible candidate
  courses hit the 11-module / 1-credit course-design guard. This is a
  quality_gate waiting state, not a YouTube quota/channel-limit blocker.
- next action: clean/repair the 11-module Grade 12 course-design issue, then run
  another bounded top-up only if no blocker, overlap, or true YouTube/channel
  limit appears. Use only `yt_queue.py upload --gate-ready`.
- duplicate old English IV AP-language slug folders were archived, not deleted,
  under
  `teaching-videos/_archive/2026-07-08-english-iv-old-ap-language-slugs/`.
  Top-level English IV M2/M3 now has only the neutral slug folders.
- queue 602 total / 601 uploaded / 1 pending / 0 no-MP4
- 4 unlisted uploads succeeded on 2026-07-08 CT through
  `yt_queue.py upload --gate-ready`: English IV Advanced Composition M7
  `PdP21WhUXGY`, English IV Advanced Composition M8 `O2YVYGCpKbw`, English II
  Literature M9 `XPha-ZoA3V4`, and Algebra II M2 `wHUE73x_ICY`
- no true YouTube upload/channel limit appeared
- remaining pending release gate is 0 ready / 1 needs_revision / 0 blocked
- pending lesson: Geometry M7 `The Pythagorean Theorem`; this is a
  quality/audit revision item, not an upload-bypass item
- parent-trust was `TRUST_READY` for all 10 lessons selected by the upload run
- upload dry-run after the run selects the remaining 2 gate-ready lessons, but
  local quota estimate reports 0 safe full uploads today
- public manifest alignment remains clean: 576 lessons / 0 warnings
- captions remain backlog and must not be promised as universally available
- Abnormal Psychology is a future cleanup item: course-design guard skipped it
  because 11 modules is outside the expected 12-16 range for a 1-credit course.
- Business Law is a future cleanup item: course-design guard skipped it because
  11 modules is outside the expected 12-16 range for a 1-credit course.
- Corporate Finance, Counseling & Mental Health, and Digital Media & Society
  are also future cleanup items for the same 11-module / 1-credit guard.
- Dirty risk resolved: root `slides/` / `style_manifest.json` were removed
  after Alan's scoped cleanup approval. Root artifacts reappeared during the
  18:01 CT run and were removed again after upload. Do not stage generated
  lesson-video media or T9 artifacts.
- Parent-trust audit false positives fixed for this run: behavioral-economics
  subscription/framing dollar examples and environmental-economics
  cap-and-trade quantity-guarantee language are allowed only as instructional
  context when not GIIS payment/admissions/outcome-facing. Earlier 03:00 fixes
  for economics policy money examples, externality tuition/subsidy examples,
  and negated "guarantee" wording remain covered.
- Next action: repair or regenerate Geometry M7 so it passes the release gate,
  then upload only through `yt_queue.py upload --gate-ready`. Do not use
  `upload_lesson.py --force-without-approval`.
- Parent-trust audit redesign: `tools/lesson-video/parent_trust_video_audit.py`
  now treats keyword hits as recall candidates, classifies them through a local
  semantic BLOCK/ALLOW judge, and runs versioned fixtures before auditing
  lessons. It still blocks accreditation, AP/College Board authorization,
  admissions/visa/credit, payment/enrollment, credential, raw URL, real-person,
  and true outcome-guarantee risk.

## Codex Implementation: 2026-07-05 Parent-Trust Audit Redesign

Completed:

- Replaced `is_contextual_false_positive` growth with
  `classify_hard_candidate(kind, match, context)`, which returns structured
  `{verdict, claimType, quote, reason}` decisions.
- Kept keyword patterns as recall. Hard findings are now BLOCK decisions;
  instructional ALLOW decisions move to `ignored_findings` with the reason and
  full semantic decision.
- Added Chinese `美国认证` accreditation detection via Unicode escape.
- Added versioned fixtures at
  `tools/lesson-video/tests/parent_trust_fixtures.json`, seeded with historical
  allow cases and real must-block public-claim cases.
- Added `tools/lesson-video/tests/test_parent_trust_video_audit.py`.
- Added `--check-fixtures-only`; normal audit runs fixture regression first and
  exits with code 2 if the policy fixtures fail.

Verification:

- `python3 -m py_compile tools/lesson-video/parent_trust_video_audit.py tools/lesson-video/tests/test_parent_trust_video_audit.py`
- `python3 tools/lesson-video/tests/test_parent_trust_video_audit.py` -> 3 tests
  pass
- `python3 tools/lesson-video/parent_trust_video_audit.py --check-fixtures-only`
  -> fixture regression checks passed
- `python3 tools/lesson-video/parent_trust_video_audit.py --out-dir /tmp/giis-parent-trust-smoke --report-name recent-smoke teaching-videos/calculus-module-13-introduction-to-differential-equations-v2 teaching-videos/college-research-writing-module-2-library-database-research-v2`
  -> `TRUST_READY` for 2 lessons

## Codex Implementation: 2026-07-03

Completed:

- P2 playlist retry/backoff: `tools/youtube-upload/upload_lesson.py` retries
  transient playlist insert failures (`aborted`, backend/rate-limit, 429/5xx)
  with bounded 2s / 5s / 10s backoff before leaving reconciliation as fallback.
- P3 roadmap/workload cleanup: historical slot logs were archived to
  `docs/archive/ROADMAP_DETAIL_2026-07-03-lesson-video-slots.md`; `ROADMAP.md`
  now keeps current lanes/state; this file now keeps only the active handoff.
- P4 captions honesty: `src/components/main/LessonPreview.js` no longer claims
  every lesson has English captions. It now says lessons are taught in English
  and captions are a separate quality pass, with YouTube player captions used
  when available.
- P5 pricing nav: `src/components/main/Nav.js`, `Nav.module.css`, and
  `src/i18n/siteStrings.js` add a top-level Pricing link on desktop and a direct
  Pricing entry in the mobile menu.

Verification already completed for P2/P4/P5:

- `python3 -m py_compile tools/youtube-upload/upload_lesson.py`
- `npm run audit:sales-launch` -> 53/53 pass
- `npm run build` -> pass, Browserslist warning only
- `npm run audit:conversion-bilingual -- --base-url http://localhost:3030` ->
  7/7 pass
- `npm run audit:parent-journey -- --base-url http://localhost:3030` -> 7/7 pass
- `npm run audit:sales-live -- --base-url http://localhost:3030` -> 9/9 pass
- Playwright desktop/mobile smoke: Pricing link visible; no horizontal overflow

## Remaining Work

No active cc handoff remains from this backlog. Optional future hardening:
connect the independent Opus reviewer JSON more directly into the parent-trust
audit report, but the current deterministic fixture-backed gate is sufficient
for the next foundation-video run.

### Verified Good / No Action

- `/lessons` public library surfaces the video library by course from manifest.
- Trust infrastructure exists in nav (`/trust-center`, `/verify`,
  `/diploma/:id`, `/assessment-proof`).
- `/pricing` is now in the main nav after the Codex P5 edit.
- Manual reviewed sales remain allowed inside the existing payment boundary;
  automated Guided/Premium checkout remains blocked until live Stripe price and
  payment gates are green.

## Constraints

- Do not weaken score-100, source-alignment, parent-trust, or upload gates.
- Do not treat standard captions as a video-upload blocker.
- Do not stage T9 media or generated lesson-video artifacts.
- Do not push `main` casually; push equals Netlify frontend deploy.
- Do not confuse no-pending-upload queue with no-production-needed.

## Suggested Verification For Future Lesson Work

Use the existing GIIS runbooks and gates for the touched lesson. Minimum evidence
before upload:

- MP4 exists.
- independent review pass exists.
- source alignment review pass exists.
- parent-trust/video gate pass exists.
- upload uses `yt_queue.py upload --gate-ready`.

## Stop Conditions

- Any source mismatch remains.
- Required resources are paid/login-gated or mislabeled.
- cc session limit or review failure leaves approval artifacts missing or stale.
- A command would stage generated media, T9 artifacts, secrets, or deploy-facing
  frontend changes outside the scoped task.

## On Demand: School Ops / Sales

Before outreach or checkout changes, run the school ops / sales gates from the
repo runbook. Manual reviewed sales remain allowed only inside the existing
payment boundary; automated Guided/Premium checkout remains blocked until live
Stripe price and payment gates are green.
