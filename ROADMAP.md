# GIIS Website Roadmap

## School organization

Alan approved GIIS3 on 2026-10-04: three daily owners for Teaching & Academic
Operations, Admissions & Parent Services, and Platform Engineering. GIIS Umi
also owns school operations and untransferred registrar/compliance evidence and
approval tracking. The registrar and compliance contexts remain on-demand
specialists, not daily departments. The former video task remains historical,
with its work inside the unified teaching workflow. GIIS3 itself did not delete,
archive or recreate conversations; after Alan's explicit cleanup approval,
Central archived the registrar and compliance contexts while retaining their
history. No new recurring schedule or authority expansion.
Startup and collaboration: `docs/school-operating-model.md`; role skills:
`docs/school-departments.md`; owner mapping: `docs/school-task-registry.md`.

Current management pointer: `umi/workload.md` carries one coordinator outcome.
Teaching & Academic Operations delivered the first verified unified midnight run;
Admissions owns authorized case progress; Platform Engineering is available but
not running; GIIS Umi owns school-operations decision tracking. Run024 is one
completed source release with a Corporate Finance item-level production hold,
not a whole-project stop. Checkout/SYS-02 state is not admissions conversion
evidence. Completed releases stay in evidence reports.

## Search indexing repair — 2026-10-07

Google Search Console's new canonical/soft-404 warnings were traced to two
frontend routing defects: every SPA route inherited the homepage canonical,
and the catch-all rewrite returned HTTP 200 for unknown URLs. Release
`816fe592` is live on Netlify. Public content routes now emit route-specific
canonicals, private/learner/admin and unknown React routes emit `noindex`, the
sitemap lists the public canonical set, retired aliases return 301, and unknown
URLs return a static noindex HTTP 404. Independent review accepted the exact
seven-file candidate. Targeted tests passed 5/5; build, trust46, parent7,
production API12, sitemap/XML and live 200/301/404/browser metadata readback
passed. Google must recrawl before Search Console clears historical findings.
Evidence: `umi/reports/search-index-fix-2026-10-07/REPORT.md`.

## Consolidated release and course quality — 2026-10-04

Alan requested scoped branch deployments and one materials/exams/video workflow.
Original mixed feature checkout is preserved; clean-main batch `0c8fd5d8`
corrected homepage text and is Netlify-published with exact readback. No
backend/student/payment mutation. Independent post-release review found stale
hero pixels; the authorized forward-fix is now released at `37e1f9b8` with
corrected walkthrough/captions, regenerated demo MP4/poster and real screenshot.
Branch report: `umi/reports/branch-release-2026-10-04/REPORT.md`.
Second batch `63af6df2` is Netlify-ready with exact SHA readback: only the
two admissions draft-only helper/test files, 9 tests passed, no integration or
sending enabled. Demo batch `37e1f9b8` has independent artifact ACCEPT, build,
parent7/trust46 checks and exact Netlify/live browser readback. Reviewer checked
source/render relationships and technical audio, not subjective headphone
listening; do not claim that listening occurred. Separate parent-dashboard
mockup wording remains excluded follow-up. No new graduation policy was added.

The `giis` daily automation now runs the unified content task at 00:00 CT;
the separate video automation is PAUSED. Both configurations were read back;
the October 6 and October 7 consolidated runs completed with scoped receipts.
Contract:
`docs/unified-course-quality-workflow.md`. Source-first, learner-safe release
and full video replacement gates remain; source fixes do not certify videos.
Fresh inventory and throughput: `umi/reports/unified-quality-2026-10-04/`.
Verified source snapshot: 93 courses / 1,002 modules / 7,232 questions;
14 courses / 74 module hard failures. Video: 592 unresolved records, including
396 sampled confirmed defects; 400 manifest identities remain uninspected.
Current source load is 31 course-touches (7–11 active days at 3–5/day).
Video throughput is only 3 full replacements per 14 calendar days, so 119 days
at 5/day is a theoretical capacity scenario, not a promised completion date.
Derived-inventory tests passed 8/8 after future/naive timestamp safeguards;
independent workflow review accepted safety gates with compound-question-ID
clarification applied. No student records or course content changed in this pass.
Five non-content risks are consolidated in
`umi/reports/school-ops-triage-2026-10-04/REPORT.md`; policy, backup destination,
credential maintenance and genuine payment evidence remain separate gates.

Release-safety hardening is complete as a local-only candidate. Linked
worktrees now resolve through Git's common directory to the primary checkout's
existing `umi/.quality-locks/release.lock`; the Python helper uses the same BSD
lock protocol as macOS `lockf -k`. Synthetic cross-worktree, two-way legacy
contention, unsafe-symlink, failure-release and dry-run tests pass 47/47 across
the helper and two integrated YouTube release callers. Ordinary public copy now
has an explicit pre-release exact-diff independent-review rule; post-release
readback is not a substitute. Independent exact-set review accepted the code
and governance wording. This did not deploy anything and does not yet cover
manual git push, material database apply, Lightsail/Stripe deployment or other
named legacy callers. Evidence:
`umi/reports/release-lock-hardening-2026-10-04/REPORT.md`.

## School readiness — preparation verified, 2026-10-04

Alan-authorized three-agent preparation is complete: Florida compliance
evidence checklist, five-university rules matrix, unsent admissions/Cognia/parent
drafts, nine Cognia evidence requirements and proposed graduation-review
checklist. Focused synthetic academic tests pass 141/141 plus official-format
audit; read-only deployed backend hashes confirm local Journey/graduation guards
remain absent from production. SYS-01/SYS-03/SYS-10 and academic-owner approval
remain open; existing records were untouched. Directory 0650 grade `12` versus
public `9–12` needs survey/field-meaning reconciliation, not an inferred violation.
UC/Syracuse explicit accreditation requirements make target-university route
confirmation important before enrollment promises; accreditation is not merely
an optional marketing benefit for every pathway. No outreach, fees, filing,
public-copy edit, commit/push or deploy. Next: Principal supplies survey evidence
and academic decisions; admissions supplies target year/category and approves
exact inquiry recipients separately. Evidence: `umi/reports/school-readiness-2026-10-04/REPORT.md`.

## Application-bound Stripe payment — deployed, 2026-10-04

Alan-authorized seven-file Stripe release `1e5a7927` is live on Netlify and Lightsail with exact SHA readback and green CI. Admin-created Checkout binds to an approved application; case activity displays payment amount/currency/reference after refresh. Full server137/frontend28 tests, independent release review, protected backup, API health/capability/auth checks and deployed-bundle synthetic UI smoke passed. Existing Stripe endpoint retains URL/secret and now subscribes to required renewal/failure/refund events. Signed non-financial proxy diagnostic persisted and deduplicated correctly; no real charge or Stripe-origin paid-case delivery was tested. Human activation remains separate. Evidence: `umi/reports/stripe-checkout-2026-10-04.md`.

Partnership correction — 2026-09-29 17:08 CDT: Alan rejected footer-only presentation. GIIS × Genius is now a bilingual homepage section directly after Academic Pathways, before success stories and inquiry; footer retains a compact link. Existing real logos, role/scope clarity, language-matched CTA and separate-fee/admissions boundaries preserved. Commit1955c52c is Netlify-ready; independent exact-final review,4tests/build/trust46/parent7/proxy12/staged8, remoteCI and production readback pass. Desktop and390px bilingual browser visual checks and both CTA navigations pass. No backend/payment/course change. Report: `umi/reports/2026-09-29-homepage-partnership.md` supersedes footer placement.

Search visibility update — 2026-09-29 15:46 CDT: Alan's Google account is now a verified owner of https://genesisideas.school/. Single-meta frontend commit5768a327 published from isolated fresh-main worktree; independent source review, build/trust/parent/proxy checks, remote CI and public meta readback passed. Search Console reports data processing, not zero traffic; retain verification meta in future releases. No analytics/DNS/backend change. Evidence: `umi/reports/2026-09-29-search-console-verification.md`.

Last updated: 2026-10-07 America/Chicago

## Provisional G9 first-student readiness — scoped local repair (2026-10-03)

A prospective no-records G9 inquiry triggered a bounded source audit and repair. A new non-credit English/Math/Science placement packet and separate staff scoring key now support a Principal-reviewed conditional start; they cannot award transfer credit, GPA, a final grade placement, or transcript rows. The exact source findings in Algebra I, English I, and Biology were repaired, and a fresh assessment/homework audit reports all 20 published G9 courses PASS. First-week video readiness remains separate: repair English I M1, Biology M1, World History M1/M5, then Algebra I/English I/Biology M6 before treating their video instruction as verified. No family record, payment, account, production sync, video upload, manifest change, push, or deploy occurred. Evidence: `docs/g9-provisional-placement-packet.md`, `docs/g9-provisional-placement-staff-key.md`, `umi/reports/g9-first-student-readiness-2026-10-03.md`.

Local G9 release candidate, 2026-10-03: protected, hash-pinned source reconciliation updated all 199 G9 local module objectives/assignments (342 fields) with transaction readback and snapshots; Algebra I and Biology also reconciled their 10 drifting exam and 32 drifting quiz items, each at zero learner state. The local source/database comparison is now 19/20 fully aligned; English I keeps four exam and eleven quiz differences because an existing learner has three quiz attempts and two submissions, so no historical attempt was rewritten. The confirmed Environmental Science M9 404 was replaced with a current NOAA resource; all 20 source courses now pass full syllabus and assessment/homework audits. The learner module page now keeps GIIS lesson-player resources in place instead of sending a student to the generic `/learn` home. This is not a live release: the updater targeted `localhost`, and Lightsail/API deployment plus protected live readback are still required. Remaining holds are English I assessment versioning and the 86-item G9 video lifecycle backlog; do not call the full video catalog verified. Evidence: `umi/reports/g9-production-readiness-audit-2026-10-03.md`.

This file is the current execution roadmap. Historical slot logs are archived in
`docs/archive/ROADMAP_DETAIL_2026-07-03-lesson-video-slots.md`,
`docs/archive/ROADMAP_DETAIL_2026-06-24-pre-slim.md`, and git history.

## AP Biology Temporary Public Pause — completed 2026-09-29

Alan's approved exact-course pause is complete. Production changed only `ap-biology.isPublished:true → false` after a fresh zero-learner gate, protected backup, hash-pinned plan, and serializable one-row/one-field transaction. The course row and all 16 modules, 35 exam questions, and 72 quiz questions remain intact. Direct API and website proxy now return 404 and omit AP Biology; 24 English/Chinese browser checks expose no course content. Biology Advanced and all four checked Marketing courses remain published. No static AP Biology promotion existed, so no frontend edit, commit, push, or new Netlify deploy was needed. Independent final review returned `ACCEPT_SCOPED_PAUSE`. Republication is not automatic; description repair, AP naming/authorization, complete framework/assessment approval, and multimedia review remain separate holds. Evidence: `umi/reports/material-quality/2026-09-29-ap-biology-pause/REPORT.md`.

A raw untracked PM2 evidence snapshot generated during review was deleted before canonical copy, commit, or push and replaced by a sanitized runtime receipt. Because an internal review processed the raw environment, credential rotation is tracked as a separate coordinated security-maintenance follow-up; no credential value remains in the evidence bundle.

## G9 Material Recheck Priority — completed 2026-10-04

All 21 Grade 9 course identities were rechecked on clean main and released at
`f0427cb7`. The four source audits now have zero G9 fail issues; Study Skills
keeps only its intentional unpublished warning. The release repaired the
original semantic findings, 24 digital/media assignment contracts, and ten
incorrect Algebra I/Biology supplemental-video labels. Two protected,
hash-pinned production phases changed 176 reviewed fields with snapshot and
transaction readback; final direct/proxy readback is 372/372, protected routes
32/32, API proxy 12/12, and Netlify is ready on the exact commit. Sixteen G9
courses are now zero drift. The remaining 151 held differences are 142 English
fields protected by learner history plus nine unsupported updater fields in
Geography and Intro Business & Economics; they require versioning/updater
hardening, not blanket replacement. The temporary G9 priority override is
closed and the material rotation resumes at cursor 69. The unified workflow's video phase still owns 85 unresolved G9 identities and this material
release does not certify audiovisual quality. Evidence:
`umi/reports/material-quality/2026-10-04-g9-recheck/REPORT.md`.

## Material Quality Rotation — Run 025 released with two item holds (2026-10-07)

Counseling & Mental Health, Digital Media & Society and Advanced Economics passed
complete source/assessment review and independent exact-hash review, then were
published at `0dda558d`; Netlify is ready on the exact commit. Advanced Economics
had zero learner state and is production-zero-delta after 175 hash-pinned field
updates and a verified backup. Counseling and Digital source improvements are
live, while their 11-to-12-module production-bank updates remain held to protect
one historical learner's attempts/progress in each course. Cursor advanced 72
to75. The video lane inspected 20 MP4s/238 frames: 14 sample-clear, six need
repair; queue610, unresolved604, no upload. Evidence:
`umi/reports/unified-quality-2026-10-07/REPORT.md`.

## Material Quality Rotation — Run 024 released with one item hold (2026-10-06)

Exact-source independent review accepted College Research & Writing,
Communication Studies and Corporate Finance at revision
`72ef7bb23066b6b1b17b53698b551c9cd1a1bde5`, now on GitHub `main`, Netlify and
Lightsail. College Research & Writing and Communication Studies were formally
synchronized after protected backup
`/home/ubuntu/backups/giis-run024-20261006T0535Z.dump` (SHA-256
`ffa388971777043f276023fe374d0391a149e0f9856dfc16194e8da5a209b695`): 366
content fields plus two grade-level metadata fields were applied through
hash-pinned transactions. Final scopes are zero delta; public readback is
384/384, protected routes 8/8 returned 401, API proxy is 12/12 and PM2 is
online. Their one enrollment each had zero progress, attempt or submission rows.

Corporate Finance source is accepted and released, but its formal production
bank remains held. Production records one completed 11-module credit, 11 module
progress rows, 11 quiz attempts and two submitted exams; applying 229 existing
field deltas, one Module 12 row and four quizzes requires a versioned or
explicitly approved attempt-safe treatment that preserves earned credit and
historical semantics. This item hold does not stop the rotation: material cursor
advanced 69 to 72. No learner record, score, grade, credit or payment row was
changed. Evidence:
`umi/reports/material-quality/2026-10-06-run-024-refresh/REPORT.md`.

## Material Quality Rotation — Run 023 (2026-10-03)

Business Law, Business Strategy & Writing, and Calculus were repaired and published at `ed1328ea`. All 34 assignments are now self-contained; weak, duplicate, out-of-scope, or incorrectly graded assessments and resource mappings were repaired. Business Law gained production Module 12 and four quizzes. All hash-pinned production batches now return zero delta; build/trust/manifest/official-document gates, independent `RELEASE_SCOPED_CONTENT`, API proxy 12/12, 816 direct/proxy field comparisons, and exact Netlify commit pass. Business Law's completed historical enrollment remained intact with zero open attempts and no recalculation.

All 34 MP4s decoded and all 34 contact sheets passed a visual corruption/layout scan. Their assignment/application frames predate today's source repairs, so 19 video identities were added and 15 updated in the midnight queue; no replacement upload or full audio claim. Cursor69 next selects College Research & Writing, Communication Studies, and Corporate Finance. Evidence: `umi/reports/material-quality/2026-10-03-run-023/REPORT.md`.

## Material Quality Rotation — Run 022 (2026-10-02)

Abnormal Psychology, Athletic Training, and Behavioral Science were reviewed, repaired, and published at `ffaf4ea1`. All 28 assignments are now self-contained and include clear deliverables and evaluation criteria. Official resources, duplicated or ambiguous questions, scope errors, item-type mismatches, clinical wording, and weak distractors were repaired. Abnormal Psychology's missing production Module 12 plus four Module 12 quiz items were added for future learners.

The protected backup, scoped hash-pinned transactions, final zero-delta dry-runs, independent exact-source and updater reviews, build/trust/manifest/selected-course audits, 34 resource URLs, 168 direct/proxy targeted-field comparisons, six protected-route 401 checks, API proxy 12/12, PM2, and exact Netlify commit all pass. Abnormal Psychology and Behavioral Science each have one completed historical enrollment; both exact learner-state digests remained unchanged. Athletic Training had no learner state. Publication flags, descriptions, grades, payment data, and unrelated production fields were not changed.

No lesson-video, slide, PDF, PPT, or PPTX artifact set exists for the selected slugs, so no audiovisual or upload claim is made. Material cursor 66 next selects Business Law, Business Strategy & Writing, and Calculus. Evidence: `umi/reports/material-quality/2026-10-02-run-022/REPORT.md`.

## Material Quality Rotation — Run 021 (2026-09-30)

AP Calculus AB, AP Human Geography, and AP Statistics were reviewed, repaired, and published at `bc50710d`. The release synchronized 46 assignments, one objective, 40 exam items, 59 quiz items, and 13 resource fields through six hash-pinned transactional batches (247 production fields total); every batch is now zero delta. The protected backup, exact-source independent `RELEASE_SCOPED_CONTENT` reviews, build/trust/manifest/selected-course audits, 29 live resource URLs, 82 targeted public-field comparisons, three protected-route 401 checks, API proxy 12/12, PM2, and exact Netlify commit all pass.

AP Calculus AB and AP Statistics had zero learner state. AP Human Geography's one enrollment belongs to a graduated student with all 16 modules and credit complete, zero open attempts, and no activity since May; its assessment/score digest is identical before and after release, and its 64 quiz plus 35 exam rows were unchanged. Publication flags, descriptions, AP authorization claims, learner records, and grades were not changed. No lesson-video, slide, PDF, PPT, or PPTX artifact set exists for the selected slugs, so no audiovisual or upload claim is made. Material cursor 63 next selects Abnormal Psychology, Athletic Training, and Behavioral Science. Evidence: `umi/reports/material-quality/2026-09-30-run-021/REPORT.md`.

## Material Quality Rotation — Run 020 (2026-09-29)

Statistics, Trigonometry, and AP Biology passed exact-file independent review and were published at `89e53803`. The scoped release improved 44 assignments, 23 exam items, 30 quiz items, one objective, and 127 module/resource fields. Nine snapshot-backed production batches wrote 460 fields after a protected database backup and zero-learner preflight; all post-sync scopes are zero delta, direct/proxy readback is 1,144/1,144, protected routes are 12/12, PM2 is online, and Netlify is ready at the exact commit.

The earlier source-unpublished/production-public discrepancy was closed by the separately authorized AP Biology pause above. Its hidden production description still claims AP exam preparation and remains a metadata hold before any explicit republication decision. Statistics and Trigonometry's 28 existing videos technically decode, but their assignment/application frames are stale and are queued for full exact-version audiovisual replacement review. AP Biology has no local artifact set. Material cursor 60 next selects AP Calculus AB, AP Human Geography, and AP Statistics. Evidence: `umi/reports/material-quality/2026-09-29-run-020/REPORT.md`.

## Current Priority

## Current Material Quality

- 2026-10-06 run 024 released all three accepted sources at `72ef7bb2`; College Research & Writing and Communication Studies are production-zero-delta with 384/384 public readback. Corporate Finance remains an item-level attempt-safe hold for 229 existing fields, one Module 12 row and four quizzes because a completed 11-module credit and historical attempts must be preserved. Material cursor72 next selects Counseling & Mental Health Studies, Digital Media & Society and Economics Advanced. The unified video pass sampled 20 actual MP4s/238 frames: 19 need repair, one was sample-clear; queue608, unresolved602, no upload. Evidence: `umi/reports/unified-quality-2026-10-06/REPORT.md`.
- 2026-10-03 run 023 published Business Law, Business Strategy & Writing, and Calculus at `ed1328ea`: 34 rebuilt assignments plus resource, objective, quiz, and exam repairs; Business Law gained missing Module 12 and four quizzes. All production scopes are zero delta; the historical completed Business Law learner was preserved. Build/trust/manifest/official-doc, independent review, API proxy, 816 direct/proxy comparisons, and exact Netlify commit pass. All 34 contact sheets were visually scanned and MP4s decoded; stale assignment frames are queued without upload. Cursor69 next selects College Research & Writing, Communication Studies, and Corporate Finance. Evidence: `umi/reports/material-quality/2026-10-03-run-023/REPORT.md`.
- 2026-10-02 run 022 published Abnormal Psychology, Athletic Training, and Behavioral Science at `ffaf4ea1`. All 28 assignments were rebuilt; official resources and weak or misaligned assessments were repaired; Abnormal Psychology gained its missing production Module 12 and four matching quiz items. Final production scopes are zero delta. Existing completed learner digests for Abnormal Psychology and Behavioral Science remained exact; Athletic Training had zero learner state. Build/trust/manifest/selected-course gates, 34 resource URLs, 168 targeted direct/proxy comparisons, protected routes, API proxy, PM2, and exact Netlify metadata pass. No selected-course video/slide/PDF/PPT/PPTX artifacts exist. Cursor66 next selects Business Law, Business Strategy & Writing, and Calculus. Evidence: `umi/reports/material-quality/2026-10-02-run-022/REPORT.md`.
- 2026-09-30 run 021 published AP Calculus AB, AP Human Geography, and AP Statistics at `bc50710d`: 46 assignments, one objective, 40 exam items, 59 quiz items, and 13 resource fields were repaired. Six hash-pinned production batches wrote 247 fields and all final scopes are zero delta. AP Human Geography's completed historical enrollment retained the exact assessment/score digest; the other two courses had zero learner state. Build/trust/manifest/selected-course gates, 29 resource URLs, 82 targeted public-field comparisons, protected routes, API proxy, PM2, and exact Netlify metadata pass. Publication flags and AP claims were unchanged. No selected-course video/slide/PDF/PPT/PPTX artifacts exist. Cursor63 next selects Abnormal Psychology, Athletic Training, and Behavioral Science. Evidence: `umi/reports/material-quality/2026-09-30-run-021/REPORT.md`.
- 2026-09-28 run 019 published Physics - Mechanics, Principles of Marketing, and Research Methods in Social Science at `f9748ef8`: 35 assignments/resources, 93 exam items, 133 quiz items, and five objective fields were improved. Eight hash-pinned batches wrote 823 production fields after a verified backup and zero-learner checks; every approved scope is zero delta. Exact-final independent reviews returned `RELEASE_SCOPED_CONTENT`; build/trust/manifest checks, 105 resource URLs, 910 direct/proxy field comparisons, 12 protected-route 401 checks, PM2, and exact Netlify metadata pass. Marketing's source-unpublished/production-public discrepancy remains a policy hold; six Research Methods estimated-hour values remain outside the approved sync allowlist. Twenty-seven MP4 streams decoded and six representative contact sheets were readable, but their assignment/application frames are stale; 21 video identities were added and six updated without moving the video cursor. No upload, listening clearance, or PDF/PPT/PPTX claim. Cursor57 next selects Statistics, Trigonometry, and AP Biology. Evidence: `umi/reports/material-quality/2026-09-28-run-019/REPORT.md`.
- 2026-09-27 run 018 published Government, Introduction to Economics, and Media & Society at `f51cf317`: all 29 assignments/resources were rebuilt; 47 exam items, 30 quiz items, and five objective fields were repaired or reconciled. Seven hash-pinned production batches wrote 506 fields after a verified backup and fresh zero-learner checks; every batch is zero delta. Independent exact-final reviews returned `RELEASE_SCOPED_CONTENT`; build/trust/parent/API/manifest gates, 812 direct/proxy comparisons, 12 protected-route 401 checks, and exact Netlify deploy metadata pass. All 29 MP4 streams decoded and all contact sheets were inspected, but assignment/application and some source-reference frames are stale; 17 video identities were added and 12 updated for exact-version regeneration and audiovisual review. No upload, listening clearance, or PDF/PPT/PPTX claim. Cursor54 next selects Physics: Mechanics, Principles of Marketing, and Research Methods for Social Science. Evidence: `umi/reports/material-quality/2026-09-27-run-018/REPORT.md`.
- 2026-09-26 run 017 published Ethics & Critical Thinking, Experimental Psychology, and Fitness Leadership at `2b8cb283`: 24 assignments/resources, 102 exam items, 88 quiz items, and nine objective fields were improved or reconciled. Six hash-pinned production batches wrote 691 fields after a verified backup and fresh zero-learner checks; all resource and assessment scopes are zero delta. Independent exact-source reviews returned `RELEASE_SCOPED_CONTENT`; build/trust/parent/API/manifest gates, 672 direct/proxy comparisons, 12 protected-route 401 checks, and exact Netlify deploy metadata pass. All 24 MP4 streams decoded and montage review confirmed eight pause-slide overflows, but every assignment/application segment is stale; all 24 identities are queued for exact-version regeneration and audiovisual review. No upload, listening clearance, or PDF/PPT/PPTX claim. Cursor51 next selects Government, Introduction to Economics, and Media & Society. Evidence: `umi/reports/material-quality/2026-09-26-run-017/REPORT.md`.
- 2026-09-25 run 016 published Economics, English III, and English III — Literature at `e86ed490`: all 39 assignments/resources, 24 exam items, 40 quiz items, and seven objective fields were improved or reconciled. Nine hash-pinned production batches wrote 531 fields after a verified backup and fresh zero-learner checks; all full scopes are zero delta. Independent exact-content review closed a Literature hold for duplicates and unavailable-text dependencies, then returned `RELEASE_SCOPED_CONTENT`; build/trust/parent/API/manifest gates, 1,092 direct/proxy comparisons, 12 protected-route 401 checks, and exact Netlify readiness pass. All 39 contact sheets were reviewed at montage level and MP4 streams technically decoded, but their assignment/application sections are stale; 39 video identities are queued, including 19 pause-slide overflow suspects (five visually confirmed). No upload, listening clearance, or PDF/PPT/PPTX claim. Cursor48 next selects Ethics & Critical Thinking, Experimental Psychology, and Fitness & Leadership. Evidence: `umi/reports/material-quality/2026-09-25-run-016/REPORT.md`.
- 2026-09-24 run 015 published Business Writing, Cognitive Psychology, and Digital Marketing at `066d5052`: all 24 assignments/resources, 52 exam items, and 33 quiz items were improved; 14 older objective fields were reconciled. Seven hash-pinned production batches wrote 475 fields after a verified backup and fresh zero-learner checks; complete course scopes are zero delta. Exact-final independent review returned `RELEASE_SCOPED_CONTENT`; build/trust/parent/API gates, 672 direct/proxy comparisons, 12 protected-route 401 checks, and exact Netlify readiness pass. All 24 lesson folders/contact sheets/MP4s exist and technically decode, but their assignment/application sections predate the new assignments; 12 video-queue entries were added and 12 updated, without moving the video cursor or claiming listening QA. No PDF/PPT/PPTX exists. Cursor45 next selects Economics, English III, and English III — Literature. Evidence: `umi/reports/material-quality/2026-09-24-run-015/REPORT.md`.
- 2026-09-23 run 014 published Biology Advanced, Business Ethics & Critical Thinking, and Business Research Methods at `e7d20751`: 35 rewritten assignments/resources, 32 repaired quizzes, eight repaired exam items, and three reconciled objective fields. Five hash-pinned production batches wrote 425 fields after a verified backup and zero learner activity; every full-course resource, module, exam, and quiz dry-run is now zero delta. Direct/proxy module readback passed 980 comparisons, 12 protected routes returned 401, and Netlify is ready at the exact commit. Independent final review returned `RELEASE_SCOPED_CONTENT`. No local video, slide, MP4, PDF, PPT or PPTX artifacts exist for these course slugs, so multimedia QA remains unclaimed and no video upload occurred. Cursor42 next selects Business Writing, Cognitive Psychology, and Digital Marketing. Evidence: `umi/reports/material-quality/2026-09-23-run-014/REPORT.md`.
- 2026-09-22 run 013 published a scoped Academic Writing update at `451de882`: eight rewritten assignments, corrected module resources and seven revised quizzes; 91 hash-pinned production field writes, exact source/DB zero delta, 224 direct/proxy field comparisons, four protected-route checks and Netlify exact-commit readiness passed. One historical enrollment exists but no current attempts/submissions/progress; no learner history was rewritten. Its unchanged 35 exam questions include 17 outside the eight taught modules, so whole-bank approval and official-credit certification remain held. Eight changed assignment frames entered the midnight video repair queue; no video upload occurred.
- AP Computer Science A and AP Psychology public visibility was paused September22 after zero learner activity, backup, and exact two-row DB flag change. Direct/proxy API details return 404 and public lists exclude them. Narrow three-page pathway promotion removal is live at `24be67fc`, with Netlify exact-commit and English/Chinese live-browser readback; Software Engineering and unrelated courses remain. A 30-module local-only repair candidate at `21a6b6ef` is held: independent reviews found issues and final editor fixes have not yet had a clean exact-commit review. Both AP exam/quiz banks, current-CED crosswalk, AP naming/authorization and republication remain held. Material cursor39 next selects Biology Advanced, Business Ethics & Critical Thinking, and Business Research Methods. Evidence: `umi/reports/material-quality/2026-09-22-ap-pause-repair/REPORT.md`.
- 2026-09-21 run 012 formally synchronized Sports Psychology, U.S. History and World Politics at `43e0b5e3`: 24 rewritten assignments and associated resources, 19 revised quiz questions, and five revised World Politics exam questions. The 273 production field writes include 13 pre-existing objective reconciliations; all three full-course scopes are zero delta. Zero learner activity was verified before and after release, 624 direct/proxy comparisons and 12 protected-route checks passed, and Netlify is ready at the exact revision.
- Sports Psychology and U.S. History retain their unchanged, out-of-scope existing final questions; whole-final approval and official-credit certification are held for curriculum alignment. The midnight video queue gained 20 identities and updated four; all 24 assignment frames need source alignment, with Sports Psychology M1 clipping and U.S. History M7 narration flagged. No video was uploaded. Next normal 03:00 material rotation: AP Computer Science A, AP Psychology, Academic Writing. Evidence: `umi/reports/material-quality/2026-09-21-run-012/REPORT.md`.
- 2026-09-20 run 011 formally published Psychology Foundations, Public Speaking, and Social Psychology at source revision `0bf11bd8`. The release covers 24 modules/assignments, 105 exam items, and 87 quizzes. Seven scoped production batches wrote 323 fields, including five older source-drift objectives; all final scopes are zero delta. Public Speaking and Social Psychology had existing enrollment/history, but zero open exam attempts; exact learner-history digests remained unchanged. Direct/proxy API readback passed 624 field comparisons plus 12 protected-route checks, and Netlify is ready on the same revision.
- Six representative contact sheets were readable, but all 24 assignment/application frames predate the reviewed assignments. The midnight queue gained 20 identities and updated four existing repairs while preserving cursor200 and its prior run record; this material run did not perform full-duration audiovisual review or upload a video.
- The September20 run's next rotation was Sports Psychology, U.S. History, and World Politics; it was completed September21. Historical evidence: `umi/reports/material-quality/2026-09-20-run-011/REPORT.md`.

### Formal application form — published September 11

Alan approved frontend-only publication. The five reviewed source files from
`b46c45e0` were isolated onto refreshed main `416b4c64` as `79683590` in
`/Users/alanhdchu/Developer/giis-admissions-publish-20260911`. Validation,
repeated-submit protection, service retry, mobile transfer fields and
confirmation-first receipt copy are accepted. Node 20 build, 8 Jest tests,
8 offline browser flows, public-trust/sales audits and independent review pass.
Fresh local gates passed; GitHub build/server-smoke succeeded, Netlify published
the exact commit, and live /apply new-copy readback passed at 10:13 CDT.
No real submission/email/payment/academic action or backend deploy occurred.
Original mixed checkout and active video/material workload preserved. Release
is complete; real submission/delivery is not claimed as end-to-end tested.
Evidence: [publication report](/Users/alanhdchu/Developer/giis-admissions-publish-20260911/umi/reports/2026-09-11-publication/REPORT.md).

### Parent-readable application sandbox — locally verified September 4

`/apply/test` now reuses the real new/transfer intake form through test receipt
and simulated parent-interest confirmation, ending at pending human review.
8 English/Chinese desktop/mobile browser paths and 6 focused tests pass; browser
observed no API/external requests or applicant data persistence. Local runner
rejects writes/API and supplies an offline CSP. No sends, charges, academic
approvals, backend integration or production deployment. Run/try instructions:
`docs/application-sandbox.md`; dated evidence and limitations:
`umi/reports/2026-09-04-application-sandbox/REVIEW.md`. Next: parent wording/usability
feedback; real queue/persistence/payment remain separate work and gates.
September 5: all scoped source hashes unchanged; isolated preview restarted,
Chinese mobile transfer path freshly reverified. September 4 full acceptance
remains dated evidence; production and scheduled-lane state were not re-audited.

### Daily material improvement and publication — run 009 live September 13

Run 009 reviewed English II — Literature, Global Economics & Politics, and Leadership Communication end to end: 29 modules/assignments, 105 exam questions, 105 quizzes, and every canonical resource identity. It improved 18 objective sets, all 29 assignments, 80 exam items, and 72 quiz items. A complete independent review found and closed 23 issues across three passes, then returned `VERDICT: RELEASE` with no blocker.

Lightsail source, the production database, direct API, and website API proxy match course revision `547eb20c`. All three courses had zero enrollment, attempt, submission, or progress activity before every apply and at final readback. A validated private backup and nine hash-pinned snapshot batches updated 638 fields; all nine final full-field dry-runs are zero delta, and protected assessment routes remain HTTP 401. No learner record, grade, payment, publication flag, or historical record changed. Netlify's first deploy failed before build while GitHub API service was degraded; empty retry commit `6ab9ba44` has the identical reviewed Git tree and is now live. Both GitHub checks, frontend freshness, Chinese conversion, and parent journey gates pass. Detailed evidence: `umi/reports/material-quality/2026-09-13-run-009/REPORT.md`.

The run inventoried all 29 contact sheets and MP4 containers across 340 active slide PNGs, with representative visual sampling and stream probing. Full-duration playback/listening was not performed, and no PDF/PPT/PPTX artifact exists in this batch. All 29 rendered assignment/application frames are stale; Leadership modules 3, 4, and 8 also have sampled left-edge clipping. The video repair queue gained 23 identities and updated 6 existing identities without duplication. Cursor is 27; the next normal batch is Marketing Communication, Physics Fundamentals, and Pre-Calculus.

### Current tracked work — whole-school systems

**Alan's GIIS TODO entry point is this table.** Evidence:
`docs/school-system-review-2026-09-04.md`; focused worker assignment:
`umi/workload.md`. Central dispatch/handoff link here. Older dated material
below is historical evidence; this table governs current system-work status.

Review/tracking completed September 4; fixes below are not implemented by that
review. P0 means correctness/recovery before expanding unattended operations,
not a verified live incident. Owners are responsible roles to assign. Proposed
sequencing does not approve academic policy, staff commitments or deployment.

| ID | Priority / status | Deliverable | Responsible role | Acceptance / dependency |
|---|---|---|---|---|
| GIIS-SYS-01 | P0 / local defects reproduced; repair pending | Credible grading and required reviewed work | Umi/cc + academic owner | Wrong long answers do not earn correctness credit; required unreviewed work cannot award official credit; supported question types survive seed/API/UI. Confirm school rules and deployed impact. |
| GIIS-SYS-02 | P0 / local logout slice verified; lifecycle/UI/release pending | Session revocation and account authorization | Umi/cc | September 5 backend logout fix rejects ended/missing/mismatched sessions across account JWT consumers; 47 synthetic tests and independent review pass. Still require honest logout-failure UI/browser cookie checks, legacy re-login transition, password-change/disabled-account/parent-child rebinding policy and scoped deployment/readback. |
| GIIS-SYS-03 | P0 / proposed; recovery unverified | Off-host backup and isolated restore | Infrastructure owner + Umi | Approved destination/retention; verified upload/readback, isolated restore and failure signal. Reuse `docs/backup-restore-plan-2026-09-04.md`. |
| GIIS-SYS-04 | P1 / application-bound Checkout deployed at 1e5a7927; real paid-event and admin-mail delivery evidence pending | Application-bound payment and explicit access entitlement | Umi + admissions business owner + IT technical owner | Preserve exact binding, retry/parallel/reordered-event and receipt-write safety, and accepted refund/entitlement policy. Deployment and synthetic diagnostic are not real financial E2E. First normal-payment observation checklist prepared; no test charge or automatic activation authorized. |
| GIIS-SYS-05 | P1 / proposed first visible delivery | One complete Algebra I introductory learning path | Umi/cc + academic reviewer | Real lesson/video/resources/quiz/submission/feedback/progress work together; formal credit follows SYS-01. Coordinate with existing material/video work. |
| GIIS-SYS-06 | P1 / draft helper ready; integration pending | Short first response and post-reply follow-up | Admissions owner + Umi/cc | Existing queue shows owner, actual contact evidence, next action/due date and stop reason; draft/open does not mark sent. Preserve needed transfer review. |
| GIIS-SYS-07 | P1 / local defects reproduced; repair pending | Reliable parent weekly report | Umi/cc + advisor | Manual-pay families included under accepted policy; verified guardian recipient; error/skipped retryable and never shown as delivered; reviewed payload matches send. |
| GIIS-SYS-08 | P1 / local signal defect and queue gap | Student-origin activity and due care actions | Umi/cc + advisor | Parent login/staff grading cannot reset learner inactivity; unresolved followUpAt appears once in due queue with owner and resolution history. |
| GIIS-SYS-09 | P1 / source-confirmed gaps | Assignment backlog and revision history | Umi/cc + academic owner | Oldest of 201 pending items visible; one business-day SLA; resubmission retains prior feedback/grade/actor; reviewed notification path. |
| GIIS-SYS-10 | P1 / local discrepancy reproduced | Shared accepted-credit/GPA/release calculation | Umi/cc + academic owner | Credit-only totals agree across family/digest/staff; GPA unchanged; staff preview vs published explicit. Existing Journey academic ADR remains pending. |
| GIIS-SYS-11 | P1 / first material and assessment delivery verified; video repairs continue | Course/video/resource revision and release proof | Content/video owner + Umi/cc | September 5 resource and assessment releases have source, backup, snapshot, deploy and readback proof. Continue daily rotation; recheck active learners/open attempts before each assessment release, and keep M1 slide defects in the midnight lane. |
| GIIS-SYS-12 | P2 / design before sibling/group scale | Guardian relationships and scoped staff permissions | Umi/cc + school owner | Authorized child switcher; payer alone gains no academic access; teachers/admissions/billing limited to assigned duties. Separate additive-schema review. |
| GIIS-SYS-13 | P2 / workflow/policy alignment | Traceable support, appeals and data requests | School operations owner + Umi | Existing queue gains case ID, owner, due time, escalation/resolution; public SLA/privacy/retention agree with actual operations; preserve records. |
| GIIS-SYS-14 | P1 / pilot proposed; dependencies pending | 3–5-family inquiry-to-first-week pilot | Admissions/academic owner + Umi | Dependable lesson/service gates first; school-authorized contacts; measure response, trial start/completion, feedback, payment and first-week continuation; case-by-case learning. |

September 5 SYS-02 bounded local backend packet is complete:
`umi/reports/2026-09-05-session-revocation/REPORT.md` records before-failure,
47 passing tests, independent review, a nine-file task-only patch, and comparison
with the already-local `1ef151ff` release object. This is not live-source or
production verification. Successful logout prevents subsequent JWT reuse;
password/reset/all-device and current account-state gating remain incomplete.
Central coordinating task owns acceptance and cross-project handoff updates.

Next system packet to scope with Central: SYS-02 frontend failure/retry and
browser verification, or the pending SYS-01 correctness work; preserve the
explicit account-lifecycle backlog. Prepare SYS-03 recovery decision and SYS-05/06
lesson/reply assets without opening all 14 items at once. Completed
rows require dated evidence and local-versus-live status. The separately
authorized video/material tasks below keep their own scope and evidence.

On 2026-09-04 Alan authorized daily round-robin inspection and remake of
defective videos. That work originally ran through
`giis-video-quality-daily`; since the October 4 consolidation it is a phase of
the ACTIVE 00:00 `giis` unified workflow and the standalone video automation is
PAUSED. The carried target is twenty samples, then up to five queued repairs
when eligible work exists (cap five; record any real blocker and continue saved
progress next run).
`docs/video-quality-round-robin.md` and `umi/video-quality-round-robin.json`
define rotation, eleven seed repairs and conditional replacement gates.
On September 13 the missing publication half was completed and exercised twice
end to end. Business Research Methods M1 replaced `JEqxTnNAYik` with
`wv1JB2RHQZA`; English IV - Writing & Communication M6 replaced
`sG-G2N9rdHA` with `q0hselX-Djg`. Both exact candidates had score 100,
`TRUST_READY`, independent/source-alignment and version-bound audio evidence.
Each replacement now has authenticated old-video/playlist preflight, new-video
readback, isolated one-row manifest commit, production manifest readback, real
`/lessons` card/iframe browser proof, playlist-position transfer, exact old-ID
retirement and stale old-playlist-item cleanup receipts. Final YouTube readback
shows each old ID absent and each new ID present once in its course playlist;
both production lesson cards passed a second iframe readback after retirement.
The local and production manifests agree, and strict alignment reports 0
warnings across 820 lessons. The daily automation now requires this full state
sequence and resumes partial stages instead of retrying uploads.
The September 14 midnight run inspected slots 161-180: 20 actual manifest MP4s
and 225 section-midpoint frames. Nineteen have located visual defects; Digital
Literacy M3 was sample-clear within the midpoint-only limit. The cursor is now
180/820 and the deduplicated repair queue is 235. Digital Media & Society M11
completed an exact-version Opus full-release review, score 100, automated audio
PASS, and `TRUST_READY`, then replaced `9DHyE2i79ck` with `UGObkkPAqtU` through
the full lifecycle. Production manifest, exact `/lessons` card/iframe, managed
playlist, old-ID absence, post-retirement iframe, and the active checkout's
local manifest row all read back correctly. The lifecycle now writes a
local-manifest sync receipt while preserving unrelated local edits. Behavioral
Science M1 remains score80/REPAIR because its builder does not reproduce all
rendered sections and its 292-second candidate is below the source packet's
five-minute lower bound. An independent workflow review found two next-release
risks, now fixed: live/local sync is retry-safe if interrupted, and production
is re-read inside the release lock immediately before old-ID deletion. Focused
tests now pass 37/37. A post-fix Opus confirmation remains fail-closed after the
reviewer session limit and should resume after the 05:00 CDT reset. Evidence:
`umi/reports/video-quality/2026-09-14/REVIEW.md`.
The September 20 midnight run inspected slots 181-200: 20 actual manifest MP4s
and 226 section-midpoint frames. All 20 have located visual defects; cursor is
200/820 and 17 new identities raised the deduplicated repair queue to 283.
Behavioral Science M1 now has a deterministic builder and an exact 323.696-second
candidate with automated audio PASS, but complete independent review remains
`REPAIR` for one unbound health premise, identical visuals across four narrated
pause cues, and insufficient purpose-specific layout variety. Abnormal
Psychology M1's contradictory learning check was repaired, but its canonical
assignment still requires academic-owner wording and its bound builder remains
stale. No upload, manifest publication, website link change, old-video
retirement, or public action occurred. Evidence:
`umi/reports/video-quality/2026-09-20/REVIEW.md`.
The September 21 midnight run inspected slots 201-220: 20 actual MP4s and
241 section-midpoint frames, with 19 located visual defects and one
sample-clear within that limited inspection. The queue is 316. Behavioral
Science M1's isolated candidate now has varied layouts, progressive pause
states and exact-version automated audio PASS, but the fresh independent
full-release verdict remains `REPAIR`: the assignment/path needs the canonical
submission/evidence/objective reminder and the concept slide needs the full
NIH OBSSR source label. No release or website/YouTube replacement occurred.
Evidence: `umi/reports/video-quality/2026-09-21/REVIEW.md`.
The September 12 midnight run inspected slots 121-140: 20 actual manifest MP4s
and 250 section-midpoint frames. All 20 have located visual defects, moving the
cursor to 140/820 and the deduplicated repair queue to 142. Business Research
Methods M1 was resumed first and rebuilt with corrected overflow/glyphs,
purpose-versus-stage teaching, six-step narration alignment, and a distinct
three-part pause/reveal. Its exact 387.402-second candidate passes automated
full-file audio and parent trust (`TRUST_READY`). The preceding build passed a
full static-slide/timeline review except for one wording defect, which was fixed;
the exact final-version review then hit a true five-hour reviewer limit before a
valid response/receipt. It therefore remains score80/HOLD. Zero uploads,
manifest changes, retirements, deletions or deploys. Evidence:
`umi/reports/video-quality/2026-09-12/REVIEW.md`.
The September 13 midnight run inspected slots 141-160: 20 actual manifest MP4s
and 242 section-midpoint frames. All 20 have located clipping, overflow,
collision, or missing-glyph defects, moving the cursor to 160/820 and the
deduplicated repair queue to 194. Business Research Methods M1 and English IV
Writing & Communication M6 now have exact-version independent reviews, score
100, automated audio PASS, and `TRUST_READY`. Digital Media & Society M11's
stale builder, learning check, source label, and Expert Lens were repaired; its
new exact candidate fully decodes and passes automated audio, all-section visual
review, and parent trust, but remains score80 until a fresh post-repair
independent review after the reported 05:00 CDT reset. The two score-100 sandbox
replacements remain held because there is no scoped orchestrator staging path
that preserves their already-live canonical identities. Zero uploads, manifest
changes, retirements, deletions, or deploys. Evidence:
`umi/reports/video-quality/2026-09-13/REVIEW.md`.
The September 11 midnight run inspected slots 101-120: 20 actual manifest
MP4s and 232 section-midpoint frames. All 20 have located visual defects, so
cursor is now 120/820 and the repair queue is 110. The unfinished-first lane
advanced Business Research Methods M1, English IV Writing M6, Digital Media &
Society M11, Abnormal Psychology M1, and Behavioral Science M1. Their current
sandbox candidates pass all-section midpoint visual review, exact-MP4 automated
full-file audio review, and parent-trust (`TRUST_READY` 5/5). Business Research
Methods received corrected business-theme and Expert Lens routing plus a clear
card-layout rerender; Digital and Abnormal recap narration now matches the
revised scripts. Deterministic release audit remains 80/100 for all five because
fresh independent/source-alignment full-release review is missing or stale;
current Opus reviewer session capacity remains blocked. Abnormal Psychology
also retains the academic-owner assignment-wording hold. Zero uploads, manifest
changes, retirements, deletions or deploys. Evidence:
`umi/reports/video-quality/2026-09-11/REVIEW.md`.
The September 10 midnight run inspected slots 81-100: 20 actual manifest MP4s
and 229 section-midpoint frames. Sixteen lessons have new located clipping,
overlap or missing-glyph defects; four were sample-clear. Cursor100/820;
queue90. A full-release review exposed that September 9's two sandbox builders
had been run from the repo root, so relative slide output did not reproduce the
shipped sandbox slides. Both builders were rerun from the correct directories,
layout defects were repaired, and English IV Writing M6 and Business Research
Methods M1 were rendered as `quality-draft-20260910.mp4`; both fully decode,
their 22 actual-MP4 midpoint frames are clear, and parent trust is
`TRUST_READY`. Release remains held because the current hashes need fresh
independent/source and complete audiovisual review; Business Research Methods
M1 also fails theme and narrated Expert Lens checks. No upload, manifest change,
retirement, deletion or deploy. Evidence:
`umi/reports/video-quality/2026-09-10/REVIEW.md`.
An interactive same-day follow-up completed current release evidence for
English IV Writing M6. A fresh independent review exposed stale answer-reveal
content, an unsupported on-screen flood statistic, and missing-glyph boxes;
all were repaired and the exact candidate rebuilt as
`quality-draft-20260910b.mp4`. The new 351.64-second file fully decodes, its 11
actual-MP4 midpoint frames are visually clear, current V2 evidence validates,
source/teaching and student-safety reviews pass, and parent trust is
`TRUST_READY`. Release remains held at 80 because the available reviewer
surfaces could not actually hear the complete audio track; no listening pass
was fabricated. The next bounded improvement is a gate-accepted,
version-bound human/audio-capable full-listening receipt plus explicit
normalized script-hash instructions. No upload, manifest mutation, YouTube
retirement, deletion, deploy, or public action occurred.
This supersedes earlier PAUSED/MWF text. The September 8 midnight run inspected
the next20 local MP4s (243 midpoint frames); all20 sampled entries had explicit
visible defects, not a full-playback or population-rate claim. Cursor60/820;
queue66 identities. The same five unfinished replacements received substantive
script, slide and audio correction and five versioned MP4s; 55 actual-MP4
midpoints were reviewed and all five files fully decode. Parent-trust is
TRUST_READY 5/5, but release remains 0/5: current-script independent/source
alignment reviews are missing, and Abnormal Psychology still has an academic-
owner assignment-wording hold. Audit40/80/60/74/80; zero uploads, manifest
changes or retirements. Evidence: `umi/reports/video-quality/2026-09-08/REVIEW.md`.
Next midnight resumes at60; do not re-render these five without new gate/owner
evidence, otherwise continue the next five repair-queue identities.

September 8 content-review follow-up completed the version-bound V2 evidence
mechanism and upload bridge. Exact hashes now bind the canonical source, current
script, review assets and one selected MP4; missing/stale/mismatched/self-review
evidence fails closed, and legacy slug-only approvals cannot authorize upload.
English IV Writing M6 and Business Research Methods M1 received valid bounded
Opus content/source reviews and remain HOLD on located source/check repairs plus
deferred full audiovisual/technical review. Digital Media & Society M11,
Behavioral Science M1 and Abnormal Psychology M1 have exact packets but no valid
response, so remain HOLD; Abnormal Psychology also keeps its academic-owner
assignment-wording hold. Final gate: 0 ready / 5 needs revision; 28 focused tests
pass and upload dry-run found zero version-bound approvals. No upload, manifest,
retirement, deletion, render, push or deploy occurred. Evidence:
`umi/reports/video-quality/2026-09-08/CONTENT_REVIEW_V2.md`.

2026-09-04 school-wide review: see `docs/school-review-2026-09-04.md` and
`umi/reports/2026-09-04-school-review/`. All 93 local courses / 7,224 questions,
93 live public courses, 837 video folders and 1,697 unique external URLs were inventoried;
semantic/visual coverage is explicitly sampled. Main new release risks are
short-answer length grading, credit without reviewed work and question-type
persistence/UI mismatch ; 9 local M12 quiz gaps are not proven live outages.
23 live URLs lose their assigned content (35 slots); 113 public videos need current
assurance review, with real clipping/glyph/source-render defects sampled.
September 4 follow-up extracted 81 segment frames from six MP4s and produced
`umi/reports/2026-09-04-school-review/video-followup/REVIEW.md` plus the 113-row
evidence-debt CSV. Combined direct-frame repair shortlist is 11 lessons (8 in
the debt list, 3 score-100 lessons outside it); seven old-path mismatches are
confirmed across today's checks. Prioritize Algebra I/English I/Biology M1
sandbox repairs. No remake, approval clearance or upload occurred; Opus remains
quota-blocked and full-duration/audio/online playback review is outstanding.
Recommendation: verify grading and one complete learning path before expanding
self-service credit/payment; continue low-friction trial and follow-up planning.
No academic-policy acceptance, course repair, fee change or release occurred.


Keep the school trustworthy, operational, and parent-visible while the
foundation-video pipeline stabilizes. The next phase is proof over volume:
parents should see a serious school, a working dashboard, and course/video
quality that feels intentionally designed.

2026-09-04 infrastructure assessment: keep the current Netlify frontend and
Lightsail API/PostgreSQL deployment; there is no present EC2/ECS/App Runner
migration signal. A fresh production proxy audit passed 12/12, external health
responses were about 0.12-0.22 seconds, the approximately 4 GB / 80 GB host had
about 2.6 GB memory available and 87% disk free, the GIIS API used about 105 MB,
and `giis_db` was about 24 MB. The real resilience gap is not capacity: API and
PostgreSQL share one host, and no automated off-host database backup or tested
restore schedule was found. Before any compute migration, establish monitored
nightly off-host backups plus a restore drill and collect sustained CPU,
memory, latency, error-rate, and outage evidence. If isolation becomes necessary,
move PostgreSQL to a managed database before replacing Lightsail compute.

2026-07-12 backend trust hardening: protected student actions now fail closed
with a retryable 503 when payment/account status cannot be verified, and the
public checkout-session summary no longer returns customer email or amount.
The Welcome page preserves receipt reassurance without rendering private data.
Server tests: 43 passed; frontend tests: 16 passed; production build passed.

## Current Student Records State

- 2026-08-15 Student Journey Phase 0B contract and proposed ADR are locally
  complete, uncommitted, and undeployed. GIIS now has stable IDs for eight
  pathways and five graduation areas, explicit countable/noncountable credit
  states, a validated server-owned Journey DTO contract, and five no-PII
  scenario fixtures. Course-pattern inference is labeled only as a suggestion.
  New transfer drafts normalize `elective` to `pathway_electives`; ambiguous
  `pe_health`, `other`, and blank mappings fail closed as `review_needed` and
  cannot receive accepted credit or new principal approval. Existing approved
  rows are untouched. The proposed ADR covers versioned plans, transcript area
  snapshots, explicit Application-to-Student linkage, authorization/audit,
  human mapping sign-off, additive migration/backfill, and rollback without
  editing Prisma. Verification: server Jest 14 suites / 158 tests, frontend
  Jest 11 suites / 64 tests, production build, trust/official-doc audits,
  `git diff --check`, and production-bundle browser smoke 32/32 passed. Next
  gate is academic-owner ADR review; schema and real-record work remain blocked.
- 2026-08-14 Student Journey Phase 0A claim safety is locally complete on
  `feature/giis-campus-quest` and is not committed, pushed, or deployed. The
  24-credit calculation now means only `total-credit threshold met`; it creates
  a graduation-review task rather than declaring eligibility, approval, or an
  earned diploma. Student, parent, homepage, weekly-report, and administrator
  wording follows that boundary. Diploma rendering now fails closed unless an
  effective school-local graduation date is recorded, and the roster no longer
  offers a 24-credit one-click graduation action. The backend publishes precise
  `meetsTotalCreditThreshold` / `totalCreditReviewCandidates` fields while
  retaining the old aliases for one release. Verification: server Jest 13
  suites / 132 tests, frontend Jest 10 suites / 55 tests, production build,
  public-trust audit, official-document format audit, and `git diff --check`
  passed. Production-bundle browser smoke passed 31/32; every changed Learn,
  parent, roster, admin, and weekly-report surface passed on desktop and mobile.
  The one residual is an existing desktop `/apply` new-student resource 404;
  the same mobile case passes and it is outside this scoped graduation change.
- 2026-08-13 verifiable Enrollment Verification is production-live at
  `cb26a0f8`. Authenticated students can preview
  and issue only their own certificate; authenticated administrators can issue
  from the student record. The fail-closed gate requires legal name, school
  Student ID, active unrestricted account, effective entry date, no effective
  withdrawal/graduation, and current manual or linked Stripe payment coverage.
  Self-registration alone cannot produce a certificate.
- The one-page US Letter PDF supports English or English plus Simplified
  Chinese, records each issuance in `AuditLog`, and uses a document-specific
  signed QR verifier. The public result binds the printed identity, grade,
  entry date, issue date, valid-through date, and document ID while exposing no
  birth date, address, parent contact, payment details, GPA, or internal status
  reason. It reports `valid`, `expired`, or `no-longer-current`.
- Verification passed: full server Jest 12 suites / 114 tests, production
  frontend build, public-trust claims audit, official-document contract audit,
  `git diff --check`, desktop/mobile Playwright layout checks with no horizontal
  overflow, and an actual one-page Letter PDF render. No Prisma migration is
  required. Lightsail runs reviewed `main` at `9035d396` with `giis-api`
  online; the new authenticated API and fail-closed public verifier passed
  production smoke. Netlify matches `origin/main`, both GitHub CI jobs passed,
  bilingual conversion is 7/7, and parent journey is 7/7 after stabilizing its
  lazy-route readiness wait in `9035d396`.

## Current Admissions State

- 2026-09-04 Alan prioritizes inquiry-to-application continuation and reviewed
  payment automation. `docs/admissions-conversion-plan-2026-09-04.md` sets
  September 4–30 milestones and an October 1–15 cohort review. Existing
  first-response SLA hides later silence once a reply is recorded; an isolated
  draft-only classifier now passes nine synthetic tests, with no real-data or
  sending integration. Live tier readback still shows Guided/Premium unavailable.
  Application-bound checkout, unambiguous student linkage and retry-safe
  reconciliation/activation need implementation before unattended fulfillment.
  Use the existing queue and Stripe stack, not a new CRM. Academic ADR remains
  pending; no payment/deploy authorization is implied by this plan.

- 2026-08-10 production contact reconciliation is current. All five real
  family cases are assigned to the President & Principal with case-specific
  next actions and historical internal-handoff events. Mayrin's verified sent
  email is recorded as family contact with records requested; Emmanuel's
  principal-reported reply is recorded with the missing-sent-copy limitation.
  Karlla, canonical Yoselin, and Cecilia remain unmarked as contacted because
  Alan's synchronized Mail does not prove the external send. Yoselin's older
  duplicate is linked and marked do-not-contact separately without deletion or
  merge. No reply/transcript attachment is currently visible, and Valeria's
  urgent Osornio email remains identity-unmatched. Academic/payment/account
  gates remain unchanged.

- 2026-08-10 family communication language, first-outreach wizard, and
  required-field alignment are production-live at `63448d71`. Confirmed cases
  now use one three-step Email/Phone/available-WeChat guide: choose channel and
  language, review/open/copy the personalized draft, then separately confirm
  that contact actually occurred. Only the final confirmation writes contact
  timestamps. Serious applications now require the main family concern; new
  students also require a current or most recent school. Instruction language
  is now separate from required family communication language (`en`, `zh`, or
  `bilingual`), and confirmation, outreach, records-request, welcome/account,
  and receipt content follow the communication preference. Legacy null rows
  safely fall back to instruction preference. UI, step validation, and server
  parsing agree, with an `admissions-v5` fail-closed rollout gate.
  Verification: local server Jest 89/89 and production build passed; GitHub CI
  build/server-smoke passed; Netlify matches `origin/main`; Lightsail reports
  `admissions-v5`; production browser smoke 32/32, bilingual 7/7, parent journey
  7/7, and API proxy 12/12 passed. Manual outreach/payment handoff remains open,
  while automated Guided/Premium checkout remains blocked by missing live Price IDs.

- 2026-08-10 transfer intake/operator v2 is production-live at `7c6af81e`
  (feature commits `67ff9812` and `ccdc8900`). It replaces duplicate school entry
  with repeatable prior-school history, makes estimated credits optional,
  structures record availability/help/ETA and graduation preferences, and adds
  a reviewed records-request draft plus an explicit operator-confirmed audit
  event. `admissions-v3` capability gating prevents a frontend-first rollout
  from silently losing the new fields. Production Postgres was backed up before
  the additive eight-column schema update; the six existing applications need
  no backfill. GitHub CI and Netlify freshness pass, Lightsail `giis-api` is
  online, production capabilities report `transfer-v2` / `admissions-v3`, and
  production browser smoke passed 30/30. Bilingual, parent journey, and API
  proxy audits pass 7/7, 7/7, and 12/12.
  Secure transcript upload and exact subject-bucket graduation planning remain
  separate future increments.

- 2026-08-08 serious-applicant intake is production-live. Public `/apply` adds
  the smallest serious-applicant
  gate without uploads or new storage: bounded motivation, intended timing,
  transfer course/records plans, required acknowledgments, and a 72-hour
  parent-email confirmation. Only interest-confirmed cases enter the default
  review queue and trigger the admin alert; the public endpoint is idempotent
  and stores only a confirmation-token hash.
- Transfer approval now requires verified records plus a course-by-course
  credit decision and recorded principal approval. Evidence Level C remains
  preliminary/conditional; Level D cannot receive accepted or conditional
  credit. Payment and account activation cannot bypass these gates, and an
  approved evaluation cannot be edited after payment or activation.
- Future admissions schema releases should follow
  `docs/admissions-intake-deploy-runbook.md`: back up Postgres, apply the
  additive Prisma schema, review/apply the legacy intake backfill, restart and
  smoke the Lightsail API, then push the frontend commit for Netlify. Secure
  transcript upload remains deferred until storage, retention, and access rules
  are explicitly decided. Families without transcripts may still apply with a
  records plan and expected availability, but approval remains fail-closed.
- Manual outreach and reviewed payment handoff may proceed. Automated
  Guided/Premium checkout remains blocked until both live Stripe Price IDs are
  configured. A labeled non-family production application completed the real
  confirmation/email path on 2026-08-10: SES confirmation reached the test
  inbox, the link confirmed once and stayed idempotent on reload, one admin
  alert reached Alan with the principal copied and applicant Reply-To, and a
  duplicate POST reused the same case. QA application
  `cmsnwiks90003d3f6tt78eqx1` remains pending only for approved cleanup; no
  payment, account activation, records decision, or family status was changed.
- Production currently has six real pending legacy application rows representing
  five family cases, plus the QA case. A private local operator packet groups
  the cases, confirms one duplicate pair by DOB fingerprint, lists missing
  intake/records data, and reconciles Mail evidence: one family already received
  principal outreach and a second was reported replied-to without an Alan cc.
  Do not infer no interest from missing legacy confirmation timestamps or repeat
  outreach before recording existing contact. Credit, GPA, graduation path,
  payment, and activation remain blocked until evidence and human-review gates
  are satisfied. The private case packet is gitignored because it contains PII.

## Current Design Source

- 2026-06-28: `DESIGN.md` was added as the repo-local visual source of truth for
  future GIIS UI agents. It captures the parent-trust design system: deep
  institutional blue, gold as a restrained trust accent, real product
  screenshots, bilingual layout constraints, official-document boundaries, and
  the no-stock/AI-photo hero rule.
- Use `DESIGN.md` before visible UI changes, but do not let it override
  `AGENTS.md`, public-claim boundaries, official-document format locks, or
  production deploy gates.

## Current Lesson-Video State

Last refreshed: 2026-10-03 00:18 CDT.

Detailed slot-by-slot lesson-video evidence from 2026-06-24 through 2026-07-03
is archived in `docs/archive/ROADMAP_DETAIL_2026-07-03-lesson-video-slots.md`
and older pre-slim history is in
`docs/archive/ROADMAP_DETAIL_2026-06-24-pre-slim.md`.

Current operating state:

- 2026-10-04 midnight quality run inspected rotation slots 401-420: 20
  manifest-bound actual MP4s / 227 section-midpoint frames. All 20 have located
  visual defects while their sampled source-packet fields still match current
  canonical content; 10 new identities entered the durable repair queue.
  English I M1 completed exact-version audio, independent full-release review,
  score 100 and `TRUST_READY`, then the full replacement lifecycle. Production
  manifest commit `0327a153` and live/browser/playlist/post-retirement readbacks
  passed. New video `Vfb9mAALHII` is live; old `6UKWODKPEQ0` was retired only
  after website verification. The durable queue now has 598 records: 6 replaced
  and 592 unresolved. Evidence: `umi/reports/video-quality/2026-10-04/REVIEW.md`.

- 2026-10-03 midnight quality run inspected rotation slots 381-400: 20
  manifest-bound actual MP4s / 240 section-midpoint frames. All 20 have located
  visual or source-alignment defects (clipping, card/footer collisions,
  missing glyphs, stale struck-through text, or stale external-practice
  direction); 14 new identities entered the durable repair queue, now 569.
  Algebra I M1 alone completed the full exact replacement lifecycle: score100,
  `TRUST_READY`, independent exact-version PASS, audio PASS, YouTube processing
  readback, manifest commit `ee0180b7`, live manifest and browser iframe
  verification, playlist transfer, then exact old-ID retirement. New video is
  `zqrmYHc9aNc`; old `LJwQCwKmmX4` was retired only after website verification.
  The website verifier's `Algebra I`/`Algebra II` substring bug was fixed with
  an exact summary-name match and regression test; 25 focused tests pass.
  English I M1 remains held because its isolated reviewer drifted into unrelated
  memory content and image-preparation errors; that response was rejected.
  Biology M1, Algebra I M9, and Biology M3 also retain their old public videos
  pending clean independent exact-version review. Queue is 837/0/0 and pending
  release gate is 0. Evidence: `umi/reports/video-quality/2026-10-03/REVIEW.md`.

- 2026-09-04 refreshed definition: `giis-video-quality-daily` is **PAUSED**
  (TOML updated August 29); no automation was changed. Older active/cadence
  statements below are historical. Fresh full audit: 837 folders / 820 public,
  113 public needs_review; 724 historical approval records is not a pending-upload
  count. 17 non-manifest folders are historical/replacement variants, not 17 new
  lessons approved for upload. See school review for exact coverage/limits.

- 2026-08-24 03:30 CT first Mon/Wed/Fri quality automation run verified. No
  active producer/upload process was present; `yt_queue.py status` remains
  837 uploaded / 0 pending / 0 no-MP4 / 837 total; pending release gate is
  0/0/0; approved-ready upload artifact has 0 items; manifest alignment is
  0 warnings across 820 lessons. `lesson:pipeline-lanes` reports the legacy
  producer as paused, upload empty, and quality debt as needing a separate
  refresh before sizing old debt. Inventory remains 837 folders / 820 visible /
  835 with MP4, with 17 hidden upload candidates requiring human approval.
  No quality candidate was safe to advance in this run, and no source file,
  media file, manifest, YouTube state, or active `umi/workload.md` handoff was
  changed by the lane.
- 2026-08-22 16:45 CT lesson-video lane shifted from volume completion to
  Mon/Wed/Fri quality progress. Fresh read-only evidence: no active producer/upload
  process, `yt_queue.py status` is 837 uploaded / 0 pending / 0 no-MP4 /
  837 total, pending release gate is 0/0/0, local manifest audit is 0 warnings
  across 820 lessons, inventory shows 820 visible lessons, and production
  manifest still reports generated_at `2026-07-26T13:46:42+00:00` with the
  approved replacement IDs for Social Psychology M8 (`p383mr9olCo`) and Health
  & Wellness M7 (`5egefxl0OhI`). The old two-hour volume automation
  `giis-foundation-video-split-batch` remains paused. New standing Codex
  automation `giis-video-quality-daily` is active Monday/Wednesday/Friday at
  03:30 CT as a quality/showcase lane: inspect current gates, advance at most
  one high-value candidate, and never upload/sync/delete a replacement unless all quality,
  parent-trust, independent review, release, manifest, and Alan-approval gates
  are satisfied.
- 2026-07-28 23:27 CT production manifest repair deployed. Alan approved the
  exact manifest-only production push after the old replacement videos had been
  deleted. Codex staged only `public/data/lessons-manifest.json`, committed
  `13ba8d4a` (`Fix lesson manifest replacement video IDs`), and pushed `main`,
  triggering Netlify. Live `https://genesisideas.school/data/lessons-manifest.json`
  now reports generated_at `2026-07-26T13:46:42+00:00`; Social Psychology M8
  points to `p383mr9olCo` and Health & Wellness M7 points to `5egefxl0OhI`.
  Old IDs `nVbAdhL-4m4` and `WDKww4KRNWk` return YouTube oEmbed 404; new IDs
  resolve. Verification: local manifest alignment audit 0 warnings across 820
  lessons, manifest `git diff --check`, exact staged diff review, and live
  production manifest polling.
- 2026-07-26 08:31-08:48 CT replacement switch/delete completed for Social
  Psychology M8 and Health & Wellness M7. Alan explicitly approved replacing
  old videos after better versions pass gates. `sync_channel.py --apply`
  switched Social Psychology M8 to `p383mr9olCo` and deleted old duplicate
  `nVbAdhL-4m4`; later it switched Health & Wellness M7 to new video
  `5egefxl0OhI` (`https://youtu.be/5egefxl0OhI`) and deleted old duplicate
  `WDKww4KRNWk`. Health M7 polish used
  `health-wellness-module-7-social-health-relationships-quality-polish-20260726`,
  repaired the visible pause/recap/path slide issues, reduced runtime from
  484.2s to 458.3s, and passed parent-trust `TRUST_READY`, Opus independent
  pass/source-alignment pass, audit `pass` score 100, and release gate ready.
  Final verification: queue 837 uploaded / 0 pending / 0 no-MP4; pending gate
  0/0/0; manifest alignment 0 warnings across 820 lessons; `sync_channel.py`
  dry-run reports no duplicates. Implementation caveat: current sync lookup
  keeps Health M7 `lesson_dir` at the canonical original folder while the
  public YouTube ID points to the new video; this is a follow-up sync-folder
  preference improvement, not a playback blocker.
- 2026-07-25 16:22-16:31 CT quality-polish replacement pass completed for
  Social Psychology M8 `Group Dynamics`. Codex promoted the prior sandbox
  density repair into a new T9-backed candidate folder
  `social-psychology-module-8-group-dynamics-quality-polish-20260725`, repaired
  visible slide density/cropping on overview, compare, application, recap, and
  path slides, rerendered MP4, and verified the contact sheet manually. Metrics
  improved from about 1046 script words / 87.2 avg / max 104 / 504.9s to about
  1015 words / 84.6 avg / max 102 / 490.5s. Final gates passed: audit `pass`
  score 100, release gate ready 1/0/0, parent-trust `TRUST_READY`, Opus
  independent pass/source-alignment pass, queue dry-run selected only this
  lesson, and upload finished with 1 uploaded / 0 failed. New unlisted YouTube
  video: `p383mr9olCo` (`https://youtu.be/p383mr9olCo`). It was initially
  uploaded with `--no-sync --no-cleanup`; Alan later approved controlled
  switch/delete, completed on 2026-07-26.
- 2026-07-22 12:25 CT manifest reconciliation completed after the final 4
  uploads. `sync_channel.py --apply` rebuilt `public/data/lessons-manifest.json`
  to 820 visible lessons, with AP/hidden courses still excluded (`ap: 0`),
  Digital Media & Society 12/12 visible, English IV - Writing & Communication
  13/13 visible, Physics - Mechanics 14/14 visible, and 0 blank lesson titles.
  Verified: manifest alignment 0 warnings across 820 lessons, video inventory
  835 folders / 820 visible / 833 with MP4 / 15 hidden upload-candidates, and
  `npm run build` passed. Commit `ff155d35` was pushed to `origin/main`;
  production `/data/lessons-manifest.json` reports 820 lessons, and browser
  search on `/lessons` finds the final four modules. Lesson-video public
  website visibility is closed.
- 2026-07-22 10:01-11:11 CT heartbeat completed the approved 5-cap path for
  the final 4 safe candidates. Digital Media & Society M11-M12 and English IV
  - Writing & Communication M6/M13 reached final release gate score 100,
  passed parent-trust as `TRUST_READY`, and uploaded unlisted with 0 failures:
  DMS M11 `9DHyE2i79ck`, DMS M12 `1Agu7A7-fBU`, English IV M13
  `UjWJ4Z2VRlM`, and English IV M6 `sG-G2N9rdHA`. Queue is now
  835 uploaded / 0 pending / 0 no-MP4 / 835 total; pending gate is 0/0/0; fresh
  dry-run returns 0 candidates across grades 10-12; no producer/upload process
  remains; no true YouTube upload/channel limit appeared. Manifest alignment
  remains clean with 0 warnings across 816 visible lessons, but the upload run
  used `--no-sync`, so Learn Portal/public manifest is still at 816 visible
  lessons and video inventory reports 19 hidden upload-candidates. Smallest
  next action is a separate manifest/dashboard reconciliation when public
  changes are allowed. Dirty caution: the M13 worker reported overwriting the
  already-untracked root `slides/` and `style_manifest.json`; do not broad-stage
  or clean them inside the heartbeat.
- 2026-07-22 09:35 CT current-state audit confirms the remaining active
  lesson-video backlog is 4 modules: Digital Media & Society M11-M12 and
  English IV - Writing & Communication M6/M13. Grades 9, 10, and 11 dry-runs
  return 0 candidates; Grade 12 dry-run returns exactly those 4 candidates.
  Queue is 831 uploaded / 0 pending / 0 no-MP4. Codex also repaired the
  YouTube channel manifest sync/parser so recent title formats such as
  `Course — 14: Title` and `Course — 14` are included. The public manifest is
  now rebuilt to 816 visible lessons with AP/hidden courses still excluded,
  Biology Advanced 14/14 visible, Physics - Mechanics 14/14 visible, Digital
  Media & Society 10/12 visible, and English IV - Writing & Communication
  11/13 visible. Verified: manifest alignment 0 warnings across 816 lessons,
  video inventory 816 visible / 15 hidden upload-candidates, parser tests pass,
  `py_compile`, and `npm run build` passed. Commit `26873221` was pushed to
  `origin/main`; Netlify production now serves the 816-lesson manifest, and
  browser search on `/lessons` finds `Conservation Biology`,
  `Waves & Sound Basics`, and `Digital Revolution`. GitHub CI build job passed;
  `server-smoke` remains red in `server/src/middleware/auth.test.js` with the
  known payment/access test WIP and should be fixed in a separate scoped commit.
- 2026-07-22 08:48-08:50 CT heartbeat attempted the approved 5-cap path for
  the final 4 safe candidates: Digital Media & Society M11-M12 and English IV
  - Writing & Communication M6/M13. Claude Code hit the session limit while
  reading references for DMS M11, before production artifacts were written. DMS
  M11 currently has only `source_packet.json`, `teaching_brief.md`, and
  `visual_brief.md`; it is not release-ready. Queue remains 831 uploaded /
  0 pending / 0 no-MP4 / 831 total; pending release gate is 0/0/0; manifest
  alignment remains clean with 0 warnings across 768 lessons; no producer/upload
  process remains; no true YouTube upload/channel limit appeared. 2026-07-22 CT
  upload-run total remains 23 videos. Smallest next action after Claude resets:
  rerun the approved 5-cap path for the remaining 4 modules; do not force a
  fifth and do not treat the DMS M11 brief-only folder as release-ready.
- 2026-07-22 02:45-03:39 CT heartbeat completed the approved primary 5-cap
  pass but only 3 safe Grade 11 candidates existed. Physics - Mechanics
  M12-M14 reached final release gate score 100, passed parent-trust as
  `TRUST_READY`, and uploaded unlisted with 0 failures: M12 `1vpUHBO2Ujs`,
  M13 `cSnxLz0U9Mo`, and M14 `KOQDzWKp6Yo`. Queue is now 821 uploaded /
  0 pending / 0 no-MP4 / 821 total; pending release gate is 0/0/0; manifest
  alignment remains clean with 0 warnings across 768 lessons; no
  producer/upload process remains; no true YouTube upload/channel limit
  appeared. The optional second 5-cap top-up began after clean rechecks and
  safely auto-advanced to Grade 12 Digital Media & Society M1-M5, but Claude
  Code hit a session limit before DMS M1 production artifacts were written.
  DMS M1 currently has only `source_packet.json`, `teaching_brief.md`, and
  `visual_brief.md`; uploader found 0 gate-ready pending items. 2026-07-22 CT
  upload-run total is now 13 videos. Active missing backlog is now 14 modules:
  Digital Media & Society M1-M12 and English IV - Writing & Communication
  M6/M13. Next action after Claude resets: rerun the approved 5-cap path
  starting with DMS M1-M5; do not bypass gate-ready upload.
- 2026-07-22 00:02-02:41 CT heartbeat completed the approved primary 5-cap
  pass plus one optional second 5-cap top-up through
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`. Physics - Mechanics M2-M11 all reached final
  release gate score 100, passed parent-trust as `TRUST_READY`, and uploaded
  unlisted with 0 failures: M2 `KB5kjx6stso`, M3 `6wgelrX_-os`, M4
  `7RCvPtqdQJE`, M5 `vpqaXlXgk7Y`, M6 `VsW9fgJeQ38`, M7 `C7RBOrx28Mw`,
  M8 `-eK57GVBnuM`, M9 `GLxR3x7jRuE`, M10 `fS8iT1uO8V8`, and M11
  `8Ksk_iJ5g5w`. Queue is now 818 uploaded / 0 pending / 0 no-MP4 /
  818 total; pending release gate is 0/0/0; manifest alignment is clean with
  0 warnings across 768 lessons; no producer/upload process remains; no true
  YouTube upload/channel limit appeared. 2026-07-22 CT upload-run total is
  10 videos. Fresh dry-run now selects only 3 remaining Grade 11 candidates:
  Physics M12-M14. The active missing backlog is now 17 modules: Physics -
  Mechanics M12-M14, Digital Media & Society M1-M12, and English IV - Writing
  & Communication M6/M13. Do not force a 5-count when only 3 safe candidates
  exist.
- 2026-07-21 22:02-22:06 CT heartbeat retried the approved 5-cap path after
  confirming no duplicate producer/upload process, queue 808 uploaded /
  0 pending / 1 no-MP4, pending gate 0/0/0, manifest alignment 0 warnings, and
  5 safe dry-run candidates. Physics - Mechanics M2 rendered a new MP4 and
  moved from no-MP4 to pending, with audit verdict `pass_with_minor_notes` and
  score 94. It was not uploaded because the release gate still requires score
  100 and an independent second-pass reviewer, and Claude Code hit the session
  limit during the reviewer stage. The gate-ready uploader found 0 human-
  approved pending items. Current queue is 808 uploaded / 1 pending /
  0 no-MP4 / 809 total; pending release gate is 0 ready / 1 needs_revision /
  0 blocked; no producer/upload process remains; no true YouTube upload/channel
  limit appeared. Do not run the optional second pass until Claude resets and
  M2 can clear review/gate through the approved path.
- 2026-07-21 20:29-21:40 CT approved heartbeat started a new 5-cap pass. A
  visible-quality issue in Biology Advanced M14's path slide (`Next up: Module
  15`) was caught before upload; Codex stopped the run, repaired the slide to
  `Course wrap-up: submit Module 14 work`, and resumed only through the
  approved `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily` path. Biology Advanced M13-M14 and Physics -
  Mechanics M1 then reached final release gate score 100, passed parent-trust
  as `TRUST_READY`, and uploaded unlisted with 0 failures: Biology Advanced
  M13 `UU263ZBhjnM`, M14 `-2mGzWyIu9Y`, Physics M1 `6Ll4Hn1104k`. Claude Code
  then hit a session limit while Physics M2 was still pre-render, so the batch
  stopped before selecting more modules and no optional second pass ran. Queue
  is now 808 uploaded / 0 pending / 1 no-MP4 / 809 total; pending release gate
  is 0/0/0; direct Physics M2 gate is needs_revision score 34 because it has
  only pre-render artifacts; manifest alignment remains clean with 0 warnings
  across 768 lessons; no producer/upload process remains; no true YouTube
  upload/channel limit appeared. 2026-07-21 CT upload-run total is now
  33 videos. Next action after Claude reset: rerun the approved 5-cap path to
  resume Physics M2, then continue Physics M3-M6 if safe.
- 2026-07-21 18:01-20:24 CT approved heartbeat completed the primary 5-cap
  pass plus one optional second 5-cap top-up through the approved
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily` path. Biology Advanced M3-M12 all reached final
  release gate score 100, passed parent-trust as `TRUST_READY`, and uploaded
  unlisted with 0 failures: M3 `2JalKf_5GS4`, M4 `ji1O3BMiOYo`, M5
  `wgjRTBZf79k`, M6 `vMMC3-EHqgs`, M7 `QJKMf6xUnes`, M8 `qV_aDReeMPM`, M9
  `Oi0UqHpX9Js`, M10 `Xt5N9Qs2j0Y`, M11 `kj1-i3-iE4g`, and M12
  `9yf4Ci4FFOs`. Queue is now 805 uploaded / 0 pending / 0 no-MP4; pending
  release gate is 0/0/0; manifest alignment is clean with 0 warnings across
  768 lessons; no producer/upload process remains; no true YouTube
  upload/channel limit appeared. 2026-07-21 CT upload-run total is now
  30 videos. Post-run dry-run selects Biology Advanced M13-M14 plus Physics -
  Mechanics M1-M3 next; Grade 11 has 16 selectable safe candidates. Do not run
  a third pass from this heartbeat.
- 2026-07-21 16:31-17:12 CT approved heartbeat ran the normal
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily` path. Biology Advanced M1 and M2 were produced,
  final-gated, parent-trust-audited, and uploaded unlisted with 0 upload
  failures: M1 `BwwjCiVat1I`, M2 `W8eotP1WYYQ`. The same upload run also
  uploaded the previously gate-ready Global Economics & Politics M2
  `1xh58EFNWB0`. Biology Advanced M3 rendered and has
  `_review_independent_pass.json`, but the batch stopped on Claude Code
  session limit before `_review_source_alignment.json` was written, so it
  remains pending and is not gate-ready. Current evidence: no producer/upload
  process remains; queue is 795 uploaded / 1 pending / 0 no-MP4; pending
  release gate is 0 ready / 1 needs_revision / 0 blocked; manifest alignment is
  clean with 0 warnings across 768 lessons. No true YouTube upload/channel
  limit appeared. 2026-07-21 CT upload-run total is now 20 videos. Next action:
  after Claude resets, rerun the approved 5-cap heartbeat path; fresh dry-run
  selects Biology Advanced M3-M7, with M3 first needing the missing independent
  source-alignment review through the orchestrator. Do not bypass gate-ready
  upload.
- 2026-07-21 16:53 CT live page audit found the frontend deploy itself was
  fresh, but the public lesson manifest was stale: production and local
  `/data/lessons-manifest.json` both still showed the 2026-07-08
  channel-sync snapshot with 577 visible lessons and did not include today's
  Media & Society/Public Speaking/Sports Psychology uploads. Root cause:
  `sync_channel.py` only parsed `Course — Module N: Title`, while recent
  uploads use `Course — Module N — Title`, so many uploaded videos were treated
  as non-lesson extras. Fixed parser support for dash-separated titles, kept
  hidden/unpublished course JSON out of public manifest, refreshed the manifest
  from the YouTube channel to 768 visible lessons, and verified AP public count
  stays 0. New Media & Society M1-M8, Public Speaking M1-M8, and Sports
  Psychology M6 are present in the manifest. Verified: manifest alignment
  0 warnings across 768 lessons, video inventory 768 visible / 26 still hidden
  upload-candidates, parser unit tests pass, and `npm run build` passed.
- 2026-07-21 16:38 CT course-source cleanup narrowed the real active
  lesson-video backlog. The former 92-module no-grade/AP-looking backlog was
  not all legitimate production work: AP source courses are now hidden with
  `isPublished:false`; clear duplicate/legacy no-grade courses are also
  hidden rather than hard-deleted because DB rows still exist; transitional
  English/elective variants are hidden until an advisor/student pathway need is
  confirmed. Public Academics/Homepage AP course framing was removed in favor
  of advanced coursework/pathway evidence language. Current active published
  missing modules were 42 total before the 18:01 CT Biology Advanced top-up:
  Biology Advanced M1-M14, Physics - Mechanics M1-M14, Digital Media & Society
  M1-M12, and English IV - Writing & Communication M6/M13. After the 20:29 CT
  top-up uploaded Biology Advanced M13-M14 and Physics - Mechanics M1, the
  active missing backlog is 27 modules: Physics - Mechanics M2-M14, Digital
  Media & Society M1-M12, and English IV - Writing & Communication M6/M13. A
  surgical DB metadata sync then aligned only the 18
  touched course rows' `isPublished`/`gradeLevel` fields, without touching
  enrollments, progress, grades, modules, exams, or quiz questions. Detailed
  acceptance plan: `docs/lesson-video-readiness-plan.md`. Verified:
  course/question integrity 0 issues, targeted DB metadata dry-run 0 remaining
  changes, manifest alignment 0 warnings, queue 793 uploaded / 0 pending /
  0 no-MP4, Grade 11 and Grade 12 dry-runs select only the 42 active modules,
  and `npm run build` passed.
- 2026-07-21 14:01-16:28 CT approved heartbeat recovered after the earlier
  Claude reset wait and completed the primary 5-cap plus optional second top-up
  within the 10-cap rule. It produced, final-gated, parent-trust-audited, and
  uploaded all 8 remaining safe Media & Society candidates with 0 failures:
  M1 `tzc8wGHDiAw`, M2 `03Kp7uXMrgQ`, M3 `gqs3sDyNAoI`, M4 `FPCXzeRjI0M`,
  M5 `b5u3nc8Lfog`, M6 `CswHKcz2mvY`, M7 `v5Lgd-vp9rs`, and M8
  `6MPxhoslAAg`. Queue is now 793 uploaded / 0 pending / 0 no-MP4 /
  793 total; pending release gate is 0/0/0; manifest alignment remains clean:
  0 warnings across 577 lessons. No producer/upload process remains, and no
  true YouTube upload/channel limit appeared. 2026-07-21 CT total is now
  17 uploaded videos.
- 2026-07-21 09:07-10:37 CT recovery run resolved the false "no candidates"
  lesson-video state and uploaded 9 videos through the approved video-first
  path. Root causes fixed in the dirty worktree: `open.lib.umn.edu` 403 fetch
  checks no longer permanently quarantine candidates; existing artifacts can be
  rendered/reviewed/released through the orchestrator; render/review cache now
  notices `build_slides.py` and theme/source artifact changes; Public Speaking
  uses the literature theme consistently; and the independent reviewer wrapper
  now enforces timeout during quiet streaming output. Uploaded unlisted with
  0 failures: Public Speaking M1 `OtbHkuYR3uo`, M2 `vkv-S4FXsZw`, M3
  `KhDkoMRS-dQ`, M4 `PcKFGSErzKE`, M5 `POpTobbh3aY`, M6 `tyGv3rvLWxM`, M7
  `8cpRKxVMN78`, M8 `Tn5VjgSOiHI`, and Sports Psychology M6 `CpKQqO2GOds`.
  Queue is now 785 uploaded / 0 pending / 0 no-MP4 / 785 total; pending
  release gate is 0/0/0; manifest alignment remains clean: 0 warnings across
  577 lessons. No producer/upload/reviewer process remained after the run and
  no true YouTube upload/channel limit appeared. Fresh dry-run shows Grade 10
  fully clear and auto-advances to Grade 11 Media & Society M1-M5 for the next
  5-cap batch. Dirty risk remains: pipeline code/docs are modified, unrelated
  transfer-credit SOP files are untracked, and root `slides/` /
  `style_manifest.json` cwd-drift must not be broad-staged.
- 2026-07-20 21:03 CT routing update: Alan asked for the two-hour heartbeat to
  treat 5 modules/uploads as the normal target, with an optional second 5 if
  time and safe candidates remain. The automation TOML prompt, pipeline docs,
  playbook, workload, Central status, and automation registry now say: run one
  approved 5-cap pass first; if it exits cleanly, no producer/upload remains,
  no true YouTube upload/channel limit appeared, and fresh pending-gate/dry-run
  evidence still shows safe work, run one additional identical 5-cap top-up
  pass. Total per heartbeat cap is 10. This does not force unsafe work: fewer
  than 5 candidates, quality/parent-trust blockers, overlap, dirty-state risk,
  or true YouTube upload/channel limits stop the run.
- 2026-07-20 18:00-18:55 CT approved 5-cap heartbeat completed the remaining
  Sports Management & Leadership lane with 4 uploads. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active and no
  force approval/upload path was used. M9 Community Relations & Social
  Responsibility, M10 Crisis Management in Sport, M11 Sport Innovation &
  Technology, and M12 Capstone: Sport Leadership Portfolio reached final
  release gate score 100, passed parent-trust, and uploaded unlisted with
  0 failures: M9 `LOIv0kQPceY`, M10 `MmOXcAjFBpU`, M11 `wsDpnqMbraQ`, M12
  `AbPAf3yXgmc`. Queue is now 776 uploaded / 0 pending / 0 no-MP4 /
  776 total; pending release gate is 0/0/0; manifest alignment remains clean:
  0 warnings across 577 lessons. No producer/upload process remained after the
  run. This was not a YouTube upload/channel limit. Current 2026-07-20 CT total
  is 21 uploaded. Post-run dry-run shows no selectable candidates in Grades
  10, 11, or 12, so the next heartbeat should return `DONT_NOTIFY` unless a
  new safe candidate appears or a reconciliation/blocker needs attention.
  Dirty risk remains: root `slides/` and `style_manifest.json` are untracked
  cwd-drift and must not be broad-staged.
- 2026-07-20 16:03-17:08 CT approved 5-cap heartbeat completed with 5
  uploads and recovered the prior Sports Management & Leadership M4 blocker.
  The run stayed on `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active and no
  force approval/upload path was used. M4 Organizational Culture & Team
  Building, M5 Conflict Resolution in Sport Organizations, M6 Decision-Making
  in Sport Management, M7 Diversity, Equity & Inclusion in Sport, and M8
  Financial Strategy for Sport Organizations reached final release gate score
  100. Parent-trust first stopped M8 on a false-positive literal
  `not guaranteed revenue` phrase; Codex changed it to `not secured revenue`,
  regenerated M8 audio/MP4 through the orchestrator path, reran independent
  review, and the 5-lesson parent-trust audit returned `TRUST_READY`. Uploaded
  5 unlisted videos with 0 failures: M4 `6Bz-XipbIjY`, M5 `xVR4RtSKT-s`,
  M6 `lTA_DRPbyeQ`, M7 `fRXk0iYSc5w`, M8 `QGxZX99qdCo`. All five were added
  to the `Sports Management & Leadership` playlist. Queue is now 772 uploaded /
  0 pending / 0 no-MP4 / 772 total; pending release gate is 0/0/0; manifest
  alignment remains clean: 0 warnings across 577 lessons. No producer/upload
  process remained after the run. This was not a YouTube upload/channel limit.
  Current 2026-07-20 CT total is 17 uploaded. Post-run dry-run shows 4
  selectable candidates remain, Sports Management & Leadership M9-M12, with
  course design still passing. Dirty risk remains: root `slides/` and
  `style_manifest.json` are untracked cwd-drift and must not be broad-staged.
- 2026-07-20 14:03-14:55 CT approved 5-cap heartbeat advanced the Sports
  Management & Leadership lane through the approved
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily` path. The first M2 attempt hit a Claude/socket
  interruption after writing pre-render artifacts; Codex made one bounded
  approved-run retry, which completed M2, then produced M3. M2 Transformational
  Leadership and M3 Strategic Planning for Sport Organizations reached final
  release gate score 100, passed parent-trust as `TRUST_READY`, and uploaded
  unlisted with 0 failures through `yt_queue.py upload --gate-ready --max 5
  --privacy unlisted`: M2 `86RiNVtDIuM`, M3 `F6SeBSZtpV0`. Both were added to
  the `Sports Management & Leadership` playlist. The run then selected M4
  Organizational Culture & Team Building, but Claude Code returned a
  session-limit stop after tool progress and only script/source/brief artifacts
  exist; M4 is now no-MP4 / `cc_blocked` attempt 1. Queue is 767 uploaded /
  0 pending / 1 no-MP4 / 768 total; pending release gate is 0/0/0; direct M4
  gate is needs_revision score 0; manifest alignment remains clean: 0 warnings
  across 577 lessons. No producer/upload process remained after the run. This
  was not a YouTube upload/channel limit. Current 2026-07-20 CT total is
  12 uploaded. Post-run dry-run shows 9 selectable Grade 12 candidates remain,
  M4-M12 of Sports Management & Leadership, with course design still passing.
  Smallest next action: next heartbeat resumes M4 through the same approved
  runner after Claude reset; do not force approval/upload or broad-stage root
  `slides/` / `style_manifest.json`.
- 2026-07-20 12:02-13:24 CT approved 5-cap heartbeat completed with 5
  uploads and finished Psychology Seminar / Capstone M9-M12 before starting
  Sports Management & Leadership. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active and no
  force approval/upload path was used. Psychology M9 APA Writing Style, M10
  Data Collection Methods, M11 Statistical Analysis for Psychology, M12
  Capstone Presentation & Research Reflection, and Sports Management M1
  Leadership Theories in Sport reached final release gate score 100 and passed
  parent-trust as `TRUST_READY`. Uploaded 5 unlisted videos with 0 failures:
  Psychology M9 `fREcl4LN4wA`, M10 `3OZ5EDpq7vY`, M11 `RdfCGBBikNs`, M12
  `5YJLlvoKcwk`, and Sports Management M1 `_jZ7QIx0a4w`. Psychology M9-M12
  were added to the `Psychology Seminar / Capstone` playlist; the uploader
  created `Sports Management & Leadership` playlist `PLNAhuCd5rVXs`, then
  added M1 after one transient playlist-add retry. Queue is now 765 uploaded /
  0 pending / 0 no-MP4 / 765 total; pending release gate is 0/0/0; manifest
  alignment remains clean: 0 warnings across 577 lessons. No producer/upload
  process remained after the run. This was not a YouTube upload/channel limit,
  though the conservative local quota estimate now shows 10 uploads today and
  0 safe full uploads left. Current 2026-07-20 CT total is 10 uploaded. Dirty
  risk remains: root cwd-drift `slides/` and `style_manifest.json` are
  untracked again and must not be broad-staged.
- 2026-07-20 10:03-11:26 CT approved 5-cap heartbeat completed with 5
  uploads and cleared Psychology Seminar / Capstone M4-M8. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active and no
  force approval/upload path was used. M4 Cross-Cultural Psychology, M5
  Positive Psychology & Well-Being, M6 Applied Psychology Careers, M7 Research
  Design Review, and M8 Literature Review Skills reached final release gate
  score 100. Parent-trust initially stopped on M5 wording containing
  `guarantees lasting happiness`; Codex changed it to non-guarantee wording
  (`automatically creates lasting happiness`), rerendered/reviewed M5 through
  the normal orchestrator path, and the 5-lesson recheck returned
  `TRUST_READY`. Uploaded 5 unlisted videos with 0 failures: M4
  `U5eAvCvMXgQ`, M5 `xV5cl6hRJTU`, M6 `tMbWOPhJaRc`, M7 `vDQQoh54y5c`, M8
  `ohJhnUhCuCU`. All five were added to the `Psychology Seminar / Capstone`
  playlist. Queue is now 760 uploaded / 0 pending / 0 no-MP4 / 760 total;
  pending release gate is 0/0/0; manifest alignment remains clean: 0 warnings
  across 577 lessons. No producer/upload process remained after the run. This
  was not a YouTube upload/channel limit. Current 2026-07-20 CT total is
  5 uploaded. Dirty risk remains: existing website UX/course/pipeline WIP plus
  root cwd-drift `slides/` and `style_manifest.json` must not be broad-staged.
- 2026-07-17 12:02 CT approved 5-cap heartbeat attempted the next safe
  producer slot through `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm
  run lesson:foundation-daily`. The runner auto-advanced to Grade 12 and
  selected Psychology Seminar / Capstone M4 Cross-Cultural Psychology, but
  Claude Code immediately returned a session-limit stop after reading the
  handoff. The orchestrator stopped the batch before selecting more modules and
  the gate-ready uploader found 0 approved pending items. No MP4, approval row,
  or upload was created; no duplicate producer/upload remained active. Queue
  remains 755 uploaded / 0 pending / 0 no-MP4 / 755 total; pending release gate
  remains 0/0/0; manifest alignment remains clean: 0 warnings across
  577 lessons. This is a Claude Code session/tool blocker, not a YouTube
  upload/channel limit or parent-trust issue. Smallest next action: after
  Claude Code session reset, let the next two-hour heartbeat retry Psychology
  Seminar / Capstone M4 through the normal gated path; do not force approval or
  upload.
- 2026-07-17 10:02-11:41 CT approved 5-cap run completed with 5 uploads and
  advanced from Personal Finance / Applied Economics into Psychology Seminar /
  Capstone. The run stayed on `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5
  npm run lesson:foundation-daily`; no duplicate producer/upload was active and
  no force approval/upload path was used. Personal Finance M11 Housing & Real
  Estate, M12 Capstone: Personal Financial Plan, and Psychology Seminar /
  Capstone M1-M3 all produced or rendered, passed independent/source review,
  reached final release gate score 100, and passed parent-trust as
  `TRUST_READY`. Uploaded 5 unlisted videos with 0 failures: Personal Finance
  M11 `M38vvdj7ONQ`, Personal Finance M12 `BpUmXOfh65c`, Psychology M1
  `6Znwc1QQKZY`, Psychology M2 `dZIZzvQ-jJ0`, Psychology M3 `iWCaFw8DzXw`.
  The uploader created the `Psychology Seminar / Capstone` playlist and added
  M1-M3; Personal Finance M11-M12 were added to the existing playlist. Queue is
  now 755 uploaded / 0 pending / 0 no-MP4 / 755 total; pending release gate is
  0/0/0; manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run. This was not a YouTube
  upload/channel limit. Current 2026-07-17 CT total is now 10 uploaded.
- 2026-07-17 08:16-09:31 CT approved 5-cap run completed with 5 uploads and
  cleared Personal Finance / Applied Economics M6-M10. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active and no
  force approval/upload path was used. M6 Stock Market Basics, M7 Bonds,
  Mutual Funds & ETFs, M8 Retirement Planning (401k, IRA), M9 Taxes & Filing
  Basics, and M10 Insurance (Health, Auto, Life) reached final release gate
  score 100. Parent-trust initially stopped on M7 finance wording
  (`no guaranteed payout but historically higher long-run returns`); Codex
  changed the lesson wording to "long-run return potential that is never
  promised," rerendered/reviewed M7 through the normal orchestrator path, and
  the 5-lesson recheck returned `TRUST_READY`. Uploaded 5 unlisted videos with
  0 failures: M6 `HOjrsc7TZvA`, M7 `uNsAjpxQgQY`, M8 `kI2tOmAsF9Y`,
  M9 `RI_MkyMB5n8`, M10 `PEotSgupR4Q`. All five were added to the `Personal
  Finance / Applied Economics` playlist. Queue is now 750 uploaded /
  0 pending / 0 no-MP4 / 750 total; pending release gate is 0/0/0; manifest
  alignment remains clean: 0 warnings across 577 lessons. No producer/upload
  process remained after the run. This was not a YouTube upload/channel limit.
  Current 2026-07-17 CT total is 5 uploaded.
- 2026-07-16 20:25 CT approved run selected Personal Finance / Applied
  Economics M6, but its cc worker stalled beyond the configured 1800-second
  limit during Claude API retries. Central Umi terminated only the stale Claude
  child at 22:49 CT; the worker/orchestrator chain exited cleanly and logged a
  Claude Code session-limit stop. No MP4, approval, or upload was created. The
  gate-ready uploader found nothing approved, and fresh queue evidence remains
  745 uploaded / 0 pending / 0 no-MP4. Resume M6 only through the next approved
  heartbeat after session reset; do not force approval/upload.
- 2026-07-16 14:01-14:34 CT approved 5-cap run completed with 5 uploads and
  cleared the Personal Finance / Applied Economics retry lane. The run stayed
  on `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active. M1-M2
  were accepted as existing ready lessons. M3 completed the missing
  independent/source review after the prior session-limit blocker and reached
  final release gate score 100. M4 Credit, Debt & Credit Scores and M5
  Introduction to Investing produced/rendered/reviewed to final gate score
  100. Parent-trust initially stopped on M5 investment dollar examples as
  `payment_claim`; Codex tightened the audit classifier and fixture coverage
  for educational investment/portfolio dollar examples, fixture regression
  passed, and the 5-lesson recheck returned `TRUST_READY`. Uploaded 5 unlisted
  videos with 0 failures: M1 `utCAkk0BScU`, M2 `PFw1L2Xkjzc`,
  M3 `QaKYOUyQg18`, M4 `Ns_0MWlShW0`, M5 `ngfr9Pzx0GI`. The uploader created
  the `Personal Finance / Applied Economics` playlist `PLXTmQGow1tFA`; M1
  needed one transient playlist-add retry and then all five were added. Queue
  is now 745 uploaded / 0 pending / 0 no-MP4 / 745 total; pending release gate
  is 0/0/0; manifest alignment remains clean: 0 warnings across 577 lessons.
  No producer/upload process remained after the run. This was not a YouTube
  upload/channel limit. Current 2026-07-16 CT total is now 22 uploaded.
- 2026-07-16 10:01-11:55 CT approved 5-cap run completed with 1 upload and
  1 retry item. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active. Media
  Psychology M12 produced/rendered, passed independent/source review, final
  release gate score 100, parent-trust `TRUST_READY`, approval row, and
  unlisted YouTube upload with 0 failures. Video ID: `VvFIbebNL8I`; Media
  Psychology is now 12/12 uploaded. The runner then started Personal Finance /
  Applied Economics M1 after course-design pass, but Claude Code hit a session
  limit after writing script/reviewer/learning-check files and before
  `build_slides.py`/slides/MP4 were completed, so the batch stopped cleanly.
  Queue is now 740 uploaded / 0 pending / 1 no-MP4 / 741 total; the no-MP4
  item is `personal-finance-applied-economics-module-1-financial-goal-setting-mindset-v2`.
  Pending release gate is 0/0/0 because the retry item is no-MP4, not pending;
  direct check on M1 is needs_revision with audit score 8. Manifest alignment
  remains clean: 0 warnings across 577 lessons. No producer/upload process
  remained after the run. This was not a YouTube upload/channel limit. Current
  2026-07-16 CT total is now 17 uploaded. Smallest next action after Claude
  Code reset: let the next approved heartbeat finish M1 slides/contact
  sheet/MP4/independent review, then upload through the gate-ready path.
- 2026-07-16 08:02-09:17 CT approved 5-cap run completed. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active. The
  orchestrator auto-advanced to Media Psychology M7-M11. All 5 produced or
  rendered, passed independent/source review, final release gate score 100,
  parent-trust `TRUST_READY`, approval rows, and unlisted YouTube upload with
  0 failures. Video IDs: M7 `ltmtmcvAHE0`, M8 `Hr8bVqQt66M`, M9
  `y3kCTHNegVU`, M10 `BeKcSBbNiS8`, M11 `98MuKqBIMxM`. Media Psychology is
  now 11/11 uploaded. Queue is now 739 uploaded / 0 pending / 0 no-MP4 /
  739 total; pending release gate is 0/0/0; manifest alignment remains clean:
  0 warnings across 577 lessons. No producer/upload process remained after the
  run. This was not a YouTube upload/channel limit. Current 2026-07-16 CT
  total is now 16 uploaded. Non-blocking quality note: M7-M11 reviewers again
  noted the upstream `source_packet.expert_lens.family` is technology/CS-worded
  for Media Psychology, but each lesson translated the lens into psychology
  terms and had no required fixes.
- 2026-07-16 06:01-06:40 CT approved 5-cap run completed and cleared the
  Media Psychology batch. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active. Media
  Psychology M2-M6 rendered or reused clean MP4s, passed source/independent
  review path sufficiently for final release gate score 100 and parent-trust
  `TRUST_READY`, then uploaded unlisted with 0 failures. Video IDs: M2
  `6d7OiO1tEA8`, M3 `TqGKgPVizPQ`, M4 `C-4XLqiBSJk`, M5 `OBD7Y_KfAlk`, M6
  `X4WEGjwtud4`. Media Psychology is now 6/6 uploaded. Queue is now
  734 uploaded / 0 pending / 0 no-MP4 / 734 total; pending release gate is
  0/0/0; manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run. This was not a YouTube
  upload/channel limit. Current 2026-07-16 CT total is now 11 uploaded. Quality
  caveat: M6's independent reviewer flagged a post-upload style-rule issue in
  the slide bio (`UCSB class of 2028` should be `UC Santa Barbara class of
  2028` or a placeholder). The final gate and parent-trust allowed upload, but
  the abbreviation is real policy debt; do not delete/reupload automatically
  without Alan deciding replacement is worth it.
- 2026-07-16 04:02-04:17 CT approved 5-cap retry advanced the Media
  Psychology batch and uploaded 1. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active. Media
  Psychology M1 rendered MP4/transcript, passed Opus independent/source review
  despite a non-blocking upstream expert-lens family note, final release gate
  score 100, parent-trust `TRUST_READY`, approval row, and unlisted upload
  with 0 failures. Video ID: `W22EkYY10aY`; the uploader also created the
  `Media Psychology` playlist (`PLNO6BC0qYxbM`) and added M1. M2 rendered MP4
  but stopped at the Opus independent-review stage because Claude Code hit a
  session limit; M3-M5 still have pre-render artifacts only. Queue is now
  729 uploaded / 1 pending / 3 no-MP4 / 733 total; Media Psychology is
  1 uploaded / 1 pending / 3 no-MP4. Pending release gate is 0 ready /
  1 needs_revision / 0 blocked: M2 has `pass_with_minor_notes` score 88 and is
  missing independent second-pass review. Manifest alignment remains clean:
  0 warnings across 577 lessons. No producer/upload process remained after the
  run. This was not a YouTube upload/channel limit. Current 2026-07-16 CT total
  is now 6 uploaded.
- 2026-07-16 02:03-02:49 CT approved 5-cap run completed with generation
  progress but no uploads. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily` and did not start a duplicate producer/upload.
  Digital Media & Society M1-M12 were skipped by resource fetch failures
  against `open.lib.umn.edu` (403), then the orchestrator generated Media
  Psychology M1-M5 pre-render artifacts. All five remain `no MP4` because the
  handoff-stage folders need the orchestrator TTS/MP4 render plus independent
  pass/source-alignment wrapper files before release gate can reach ready.
  During M1 the worker fixed a narrow shared theme resolver bug in
  `slide_kit.py` and `audit_lessons.py`: psychology now resolves before
  literature so `Media Psychology` no longer gets the literature theme via the
  word `Media`; sanity check confirmed `Digital Media & Society` still resolves
  to literature and Counseling still resolves to psychology. Upload path found
  0 gate-ready pending items, so 0 uploaded / 0 failed. Queue is now
  728 uploaded / 0 pending / 5 no-MP4 / 733 total; pending release gate is
  0/0/0; manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run. This was not a YouTube
  upload/channel limit. Current 2026-07-16 CT total remains 5 uploaded.
- 2026-07-16 00:01-01:11 CT approved 5-cap run completed. The orchestrator
  auto-advanced from Grade 10 to Grade 12 and finished Counseling & Mental
  Health M8-M12 through the approved `FOUNDATION_MAX_MODULES=5
  FOUNDATION_UPLOAD_MAX=5 npm run lesson:foundation-daily` path. All 5
  rendered, passed Opus independent/source review, final release gate score
  100, parent-trust `TRUST_READY`, approval rows, and unlisted YouTube upload
  with 0 failures. Video IDs: M8 `lIFINCze3Ow`, M9 `UTVwQ9D0TVo`,
  M10 `VkUrkaSVI7k`, M11 `K_oLaQITqUo`, M12 `ZxjtObklpsQ`. Counseling &
  Mental Health is now 12/12 uploaded. Queue is now 728 uploaded /
  0 pending / 0 no-MP4 / 728 total; pending release gate is 0/0/0; manifest
  alignment remains clean: 0 warnings across 577 lessons. No producer/upload
  process remained after the run. This was not a YouTube upload/channel limit.
  Current 2026-07-16 CT total is 5 uploaded.
- 2026-07-15 22:01-23:09 CT approved 5-cap run completed and cleared the
  prior retry item. Counseling & Mental Health M2 regenerated its prior
  zero-byte/stale TTS segment and rendered cleanly; M4-M7 also produced or
  rendered, passed Opus independent/source review, final release gate score
  100, and parent-trust. M7 initially hit a parent-trust hard stop because the
  crisis-response misconception example used `It will get better`; Codex
  narrowed the fix to the M7 script/slide example (`Try to stay positive`),
  regenerated the stale `05_misconception` audio/MP4/transcript, refreshed
  review SHA bindings, reran gate to score 100, and parent-trust returned
  `TRUST_READY` for the full 5-lesson batch. Uploaded 5 unlisted videos with
  0 failures: Counseling M2 `SslhML4fnjc`, M4 `sZCruQt4W_w`, M5
  `wIOVveWdMiE`, M6 `fk9znClHzHg`, and M7 `1mmfsoQUwe0`. Queue is now
  723 uploaded / 0 pending / 0 no-MP4 / 723 total; pending release gate is
  0/0/0; manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run. This was not a YouTube
  upload/channel limit. Same-day CT total is now 28 uploaded.
- 2026-07-15 20:01-21:10 CT approved 5-cap run completed with a partial
  upload success and one transient TTS retry item. Codex stayed on the
  approved `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5
  npm run lesson:foundation-daily` path. Uploaded 4 unlisted videos with
  0 upload failures: Abnormal Psychology M11 `9_BfBn3cNKk`, Abnormal
  Psychology M12 `PqCm1i73p8E`, Counseling & Mental Health M1 `0XZU3VvEBqs`,
  and Counseling & Mental Health M3 `sFKwjhrgWjY`. Abnormal Psychology is now
  12/12 uploaded. Counseling M2 produced pre-render artifacts, but MP4 render
  hit an Edge TTS websocket connection timeout while synthesizing section 04;
  it remains the single `no MP4` retry item and was not uploaded. Queue is now
  718 uploaded / 0 pending / 1 no-MP4 / 719 total; pending release gate is
  0/0/0; manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run. This was not a YouTube
  upload/channel limit.
- 2026-07-15 18:29-19:34 CT second 5-cap big run completed through the
  approved `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5
  npm run lesson:foundation-daily` path. Abnormal Psychology M6-M10 produced,
  rendered, passed Opus independent/source review, final release gate score
  100, parent-trust `TRUST_READY`, approval rows, and unlisted YouTube upload
  with 0 failures. Video IDs: M6 `mYKIYf5hW4E`, M7 `w-VUjwN3h3A`,
  M8 `TS2t4rOZ1m4`, M9 `FUtiySPIfv4`, M10 `CFFS4ZAI05k`. Queue is now
  714 uploaded / 0 pending / 0 no-MP4; pending release gate is 0/0/0;
  manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run. Abnormal Psychology is now
  10/10 uploaded.
- 2026-07-15 17:12-18:26 CT course-design unblock and 5-cap big run
  completed. Codex added real 12th modules to all seven blocked 1-credit /
  11-module Grade 12 candidates: Abnormal Psychology, Counseling & Mental
  Health, Digital Media & Society, Media Psychology, Personal Finance & Applied
  Economics, Psychology Seminar Capstone, and Sports Management & Leadership.
  Direct course-design review now passes for all seven. Then Codex ran the
  approved `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5
  npm run lesson:foundation-daily` path end-to-end. Abnormal Psychology M1-M5
  produced, rendered, passed Opus independent/source review, final release gate
  score 100, parent-trust `TRUST_READY`, approval rows, and unlisted YouTube
  upload with 0 failures. Video IDs: M1 `QM0g3oVYCes`, M2 `0VORdiHVJzE`,
  M3 `DxfgBsKrUZU`, M4 `EcFBRitEddQ`, M5 `yVUfwAMy1PM`. Queue is now
  709 uploaded / 0 pending / 0 no-MP4; pending release gate is 0/0/0;
  manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run.
- 2026-07-15 16:29 CT first two-hour / 5-cap producer check ran through the
  approved `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5
  npm run lesson:foundation-daily` path. Result: 0 produced / 0 uploaded /
  0 failed. Queue stayed 704 uploaded / 0 pending / 0 no-MP4; pending release
  gate stayed 0 ready / 0 needs_revision / 0 blocked; manifest alignment stayed
  clean: 0 warnings across 577 lessons. The blocker is course design, not
  upload: the next seven grade-12 candidates are 1-credit courses with only
  11 modules, outside the required 12-16 range. Built-in safe repair does not
  add/delete modules, so the smallest next action is a bounded course-design
  repair lane for one course, likely Abnormal Psychology first, before the next
  producer can create more videos.
- 2026-07-15 13:00 CT approved foundation run completed the held Corporate
  Finance M11 repair. The orchestrator cleared stale reviewer/render cache,
  regenerated MP4/transcript, Opus independent/source review passed, final
  release gate returned ready, parent-trust returned `TRUST_READY`, and
  `yt_queue.py upload --gate-ready` uploaded M11 unlisted with 0 failures.
  Video ID: `O1NNSzZ9ykw`. Current queue evidence is 704 uploaded /
  0 pending / 0 no-MP4; pending release gate is 0 ready / 0 needs_revision /
  0 blocked; manifest alignment remains clean: 0 warnings across 577 lessons.
  No producer/upload process remained after the run. Dirty risk remains:
  root cwd-drift `slides/` and `style_manifest.json`, Business Law/Corporate
  Finance course JSONs, parent-trust audit code/fixture changes, and generated
  T9 media should not be broad-staged.
- 2026-07-15 08:00 CT approved foundation run produced Corporate Finance M9,
  M10, and M12, repaired the parent-trust false positive that treated supplier
  invoice terms as GIIS payment wording, reran fixtures and parent-trust to
  `TRUST_READY`, wrote approval rows, and uploaded all 3 unlisted through
  `yt_queue.py upload --gate-ready`. Video IDs: M9 `O8IA0Y4ikAg`, M10
  `ptUS0Wd_PbA`, M12 `qiNQujccb14`. Corporate Finance M11 was correctly held:
  the independent reviewer caught a bond-price narration error; the script was
  fixed to the correct 4% yield price (~$1,162), but M11 still needs a fresh
  independent/source-alignment review before it can pass release gate. Current
  queue evidence is 703 uploaded / 1 pending / 0 no-MP4; pending release gate
  is 0 ready / 1 needs_revision / 0 blocked; manifest alignment remains clean:
  0 warnings across 577 lessons. Dirty risk remains: root cwd-drift `slides/`
  and `style_manifest.json`, Business Law/Corporate Finance course JSONs,
  parent-trust audit code/fixture changes, and generated T9 media should not be
  broad-staged.
- 2026-07-15 03:00 CT follow-up repaired the prior cc-limit stop and completed
  Corporate Finance M4-M8 through the approved foundation path. Parent-trust
  audit returned `TRUST_READY` for all 5, release gates passed cleanly, and
  `yt_queue.py upload --gate-ready --max 5` uploaded all 5 unlisted with
  0 failures. Current queue evidence is 700 uploaded / 0 pending / 0 no-MP4;
  pending release gate is 0 ready / 0 needs_revision / 0 blocked; manifest
  alignment remains clean: 0 warnings across 577 lessons. No producer/upload
  process remained after the run. Dirty risk remains: root cwd-drift `slides/`
  and `style_manifest.json`, plus Business Law and Corporate Finance course
  JSON/doc changes, should not be broad-staged.
- Latest 5 uploaded: Corporate Finance M4-M8. Video IDs: `HbMmR01j-Pw`,
  `XKue3VHkHiQ`, `vg2EVsTVyRM`, `E7TC9dihtEY`, `hwWv9Hm7wbQ`.
- Alan asked to push another 10 after the 21:34 CT Business Law top-up. Codex
  completed a bounded follow-up through the approved foundation path: Business
  Law M11-M12 and Corporate Finance M1-M3 uploaded unlisted through
  `yt_queue.py upload --gate-ready`. Corporate Finance M3 first had a wrong
  path-slide next-module label (`Capital Budgeting` instead of `Risk &
  Return`); Codex patched the generated slide text, reran MP4/foundation gate,
  ran Opus independent/source review, and release gate returned ready before
  upload. Result for this follow-up: 5 uploaded / 0 failed / 0 pending. Current
  same-day count is 48 uploaded on 2026-07-14 CT. Current queue evidence is
  695 uploaded / 0 pending / 0 no-MP4; pending release gate is 0 ready /
  0 needs_revision / 0 blocked; manifest alignment remains clean: 0 warnings
  across 577 lessons. The run stopped before reaching 10 because Claude Code
  reported a session limit while starting Corporate Finance M4; M4 has only the
  packet/brief files and is not renderable yet. This is not a YouTube
  upload/channel limit. Dirty risk remains: untracked root cwd-drift `slides/`
  and `style_manifest.json`, plus Business Law and Corporate Finance course
  JSON repairs, should not be broad-staged.
- Latest 5 uploaded: Business Law M11-M12 and Corporate Finance M1-M3. Video
  IDs: `Nl4doU8yYlI`, `XFJ6lu2xerM`, `INq2SmpZWA4`, `uuKW7q_93Ak`,
  `CFCIXqp_XFg`.
- Alan asked to move another 10 forward after the 18:00 course-design stop.
  Codex repaired the bounded course-design blocker for Business Law by adding a
  12th ethics/compliance module to the course JSON, then reran the approved
  foundation path with `FOUNDATION_MAX_MODULES=10` and `FOUNDATION_UPLOAD_MAX=10`.
  The run produced Business Law M1-M10, passed parent-trust as `TRUST_READY`,
  wrote clean approval rows, and uploaded all 10 unlisted through
  `yt_queue.py upload --gate-ready`. Result: 10 uploaded / 0 failed /
  0 still pending. Current same-day count is 43 uploaded on 2026-07-14 CT.
  Current queue evidence is 690 uploaded / 0 pending / 0 no-MP4, gate-ready
  dry-run shows 0 approved pending, and manifest alignment remains clean:
  0 warnings across 577 lessons. Captions, thumbnails, sync, and cleanup remain
  separate reconciliation/backlog work. Dirty risk: untracked root cwd-drift
  `slides/` and `style_manifest.json` reappeared and were not deleted in this
  run; do not stage them or generated T9 media.
- Latest 10 uploaded: Business Law M1-M10. Video IDs: `ZCs0tthVftw`,
  `2_ZCjefjN0M`, `PHnOQ_5j4Mo`, `d4-lJEr0N0U`, `WK3A73YSe7o`,
  `4JWMisZPvXs`, `kGmAa8Y6lOs`, `NRiVtzmCJ-w`, `V-wZIM-Nj1Q`,
  `RO8ddWfNzAE`.
- The 2026-07-14 18:00 CT approved foundation run started cleanly through
  `npm run lesson:foundation-daily`, found no active duplicate producer/upload,
  and did not upload anything because no gate-ready lesson was produced. Grade
  10 had no selectable unfinished candidates; grade auto-advance reached
  grade 12, where the next available courses are blocked by the course-design
  guard as 11-module / 1-credit courses outside the expected 12-16-module
  shape. Result: 0 produced / 0 uploaded / 0 failed. Current queue evidence is
  still 680 uploaded / 0 pending / 0 no-MP4, gate-ready dry-run shows 0
  approved pending, and manifest alignment remains clean: 0 warnings across
  577 lessons. Smallest next action is a bounded course-design repair/selection
  lane before another producer can reach the 40-video target.
- The 2026-07-14 13:00 CT approved foundation run completed the remaining
  Statistics for Social Sciences modules M11-M13, passed parent-trust as
  `TRUST_READY`, wrote clean approval rows, and uploaded all 3 unlisted through
  `yt_queue.py upload --gate-ready` with video-first settings. Result:
  3 uploaded / 0 failed / 0 still pending. Current same-day count is 33
  uploaded on 2026-07-14 CT. Current queue evidence is 680 uploaded /
  0 pending / 0 no-MP4, gate-ready dry-run shows 0 approved pending, and
  manifest alignment remains clean: 0 warnings across 577 lessons. Captions,
  thumbnails, sync, and cleanup remain separate reconciliation/backlog work.
- Latest 3 uploaded: Statistics for Social Sciences M11-M13. Video IDs:
  `4RglrcdbF6Q`, `xC7jAs6RDUw`, `0RefO27bw6w`.
- The 2026-07-14 08:00 CT approved foundation run auto-advanced to Statistics
  for Social Sciences, produced M1-M10, passed parent-trust as `TRUST_READY`,
  wrote clean approval rows, and uploaded all 10 unlisted through
  `yt_queue.py upload --gate-ready` with video-first settings. Result:
  10 uploaded / 0 failed / 0 still pending. Current same-day count is 30
  uploaded on 2026-07-14 CT. Current queue evidence is 677 uploaded /
  0 pending / 0 no-MP4, pending release gate 0 ready / 0 needs_revision /
  0 blocked, and manifest alignment remains clean: 0 warnings across
  577 lessons. Captions, thumbnails, sync, and cleanup remain separate
  reconciliation/backlog work.
- Latest 10 uploaded: Statistics for Social Sciences M1-M10. Video IDs:
  `fx3zFkhiC54`, `qvREpxBTwKg`, `mSh2eq5hQh4`, `Co3_n5zKNDU`,
  `ehsmg29ReEg`, `J3FLexn_d5Q`, `YqLC9W0rVKY`, `Ba3_XkwSVLs`,
  `Uxzi9JfJvYo`, `wwqK9tva2oI`.
- Dirty risk handled: root cwd-drift `slides/` and `style_manifest.json`
  reappeared during the Statistics producer and were removed after confirming
  no producer/upload process was active. Do not stage generated lesson-video
  media or T9 artifacts.
- The 2026-07-14 03:00 CT approved foundation run produced Sociology M4-M13
  and uploaded all 10 unlisted through the gate-ready queue path. The run first
  stopped before upload on a parent-trust hard finding in Sociology M7 because
  the hypothetical example said `cannot afford tuition`; Codex rewrote that to
  `cannot afford college costs`, regenerated the M7 section 06 TTS/MP4,
  refreshed the review SHA bindings, reran parent-trust to `TRUST_READY`, wrote
  clean-pass approval rows, and uploaded via `yt_queue.py upload --gate-ready`
  with video-first settings. Result: 10 uploaded / 0 failed / 0 still pending.
  Current queue evidence is 667 uploaded / 0 pending / 0 no-MP4, pending
  release gate 0 ready / 0 needs_revision / 0 blocked, and manifest alignment
  remains clean: 0 warnings across 577 lessons. Captions, thumbnails, sync, and
  cleanup remain separate reconciliation/backlog work.
- Latest 10 uploaded: Sociology M10-M13 and M4-M9. Video IDs:
  `Fw-E93Z7YZg`, `0t1gO9ht8Ds`, `Z2PD9TftkUs`, `A3aYNebaOL8`,
  `oV3gPrwDga4`, `7qt6d6nRPtc`, `UunssyG72lo`, `LCNWiJZDtEI`,
  `5CtnSWT1iko`, `Gnk3S5Q3mEg`.
- Alan asked Codex to fix the stopped 10-video batch and continue uploading.
  The 2026-07-13 late run had produced Organizational Behavior &
  Communication M2-M8 and Sociology M1-M3, but parent-trust blocked before
  approval/upload. Codex repaired the hard findings (`always`/guarantee-like
  wording in OB M2 and `admissions clerk` in OB M5), refreshed stale TTS/MP4
  caches through the orchestrator path, reran parent-trust to `TRUST_READY`,
  wrote `approved_ready_to_upload.json`, and uploaded all 10 unlisted through
  `yt_queue.py upload --gate-ready`; result: 10 uploaded / 0 failed. Current
  queue evidence is 657 uploaded / 0 pending / 0 no-MP4, pending release gate
  0 ready / 0 needs_revision / 0 blocked, and manifest alignment remains clean:
  0 warnings across 577 lessons. The upload used the video-first lane
  (captions/thumbnail/sync/cleanup deferred).
- Latest 10 uploaded: Organizational Behavior & Communication M2-M8 and
  Sociology M1-M3. Video IDs: `T7Wd21neEjo`, `pArSmGnNBAs`,
  `lEC_zE1v1Ic`, `VFaimFI9Lec`, `d0M_1AI_9CQ`, `kESudedTS5I`,
  `gyfeGrXAZ1U`, `UlMZp9aICUs`, `_LRMZQYe48Q`, `Mgz_jjTvwSc`.
- Manifest generation now uses one canonical ordering helper across channel
  sync, local manifest build, and failed-lesson pruning. Courses sort
  alphabetically and modules sort numerically, so routine uploads no longer
  reorder most of `public/data/lessons-manifest.json`. Two deterministic-order
  tests pass, all three writer entrypoints load, and the current 577-lesson
  alignment audit remains at 0 warnings. The already-dirty manifest was not
  rewritten during this repair; it still needs a separate generated-data
  review before commit.
- Alan asked for another 10 videos and upload. The 2026-07-09 08:00 CT
  approved foundation run completed after one parent-trust repair: English IV
  Writing M5 used a standardized-testing / college-admissions debate example,
  the parent-trust audit blocked the public-facing admissions wording, and
  Codex rewrote that example to a school-uniforms / student-expression debate,
  regenerated TTS/MP4, and reran parent-trust to `TRUST_READY`. The orchestrator
  then uploaded 10 unlisted videos through `yt_queue.py upload --gate-ready`;
  result: 10 uploaded / 0 failed. Current queue evidence is 647 uploaded /
  0 pending / 0 no-MP4, pending release gate 0 ready / 0 needs_revision /
  0 blocked, and manifest alignment remains clean: 0 warnings across
  577 lessons. Remaining non-AP published modules needing completion/upload:
  254 of 901. The producer skipped English IV Writing M6/M13 because
  `open.lib.umn.edu` returned 403 for the resource check; that is a source
  repair/top-up issue, not an upload blocker.
- Latest 10 uploaded: English IV Writing M3-M5, M7-M12, and Organizational
  Behavior & Communication M1. Video IDs: `irSU5PuONbo`, `jc1cemPwF88`,
  `KvfAr-RP_P8`, `SUZoEhnWxpw`, `U5_3VKCbiV8`, `_xO5dR9NWXk`,
  `qpRKi6JXGbE`, `k92mE1BeaUs`, `o1AMPW11YyA`, `PNNRkIfoCaM`.
- Alan asked for another 10 videos and upload. The 2026-07-09 03:00 CT
  approved foundation run completed after one parent-trust repair: English IV
  Writing M2 used `admissions readers` as a genre-audience phrase, the
  parent-trust audit blocked it, and Codex softened the public narration/slide
  wording to `personal-statement readers`, regenerated TTS/MP4, reran Opus
  independent review, and reran parent-trust to `TRUST_READY`. The orchestrator
  then wrote the approval artifact and uploaded 10 unlisted videos through
  `yt_queue.py upload --gate-ready`; result: 10 uploaded / 0 failed. Current
  queue evidence is 637 uploaded / 0 pending / 0 no-MP4, pending release gate
  0 ready / 0 needs_revision / 0 blocked, and manifest alignment remains clean:
  0 warnings across 577 lessons. Remaining non-AP published modules needing
  completion/upload: 264 of 901. Root cwd-drift `slides/` and
  `style_manifest.json` were archived, not deleted, under
  `docs/archive/lesson-video-cwd-drift/2026-07-09-0517/`.
- Latest 10 uploaded: English IV Media Writing M6-M13 and English IV Writing
  M1-M2. Video IDs: `MkMfPb17Upo`, `ZlvRkzQtOrQ`, `KWp9Rr7ElII`,
  `86a89d97sfo`, `32vV3uwT_CI`, `dVEJ5gymtUE`, `jLF4oKZ7ZTY`,
  `lWLdX1fRGGQ`, `FbdXCkQkBgo`, `QlTJ7e-eLSQ`.
- Alan asked Codex to generate 10 more videos and upload. Codex used the
  approved `npm run lesson:foundation-daily` path with
  `FOUNDATION_MAX_MODULES=10` / `FOUNDATION_UPLOAD_MAX=10`. The run produced
  and uploaded 5 English IV Media Writing lessons (M1-M5), then stopped safely
  when Claude Code reported a session limit before selecting more modules. This
  was not a YouTube upload/channel limit. Current same-day upload evidence is
  30 uploaded on 2026-07-08 CT. Queue is now 628 total / 627 uploaded /
  1 pending / 0 no-MP4, and pending release gate is 1 ready /
  0 needs_revision / 0 blocked. Manifest alignment audit remains clean:
  0 warnings across 577 lessons. The pending ready item is English IV Media
  Writing M6; it is not in the current approval artifact and should wait for the
  next approved orchestrator pass after the cc session resets. Remaining
  non-AP published modules needing completion/upload: 274 of 901
  (G10: 9, G11: 8, G12: 165, no gradeLevel: 92).
- Latest 5 uploaded: English IV Media Writing M1-M5. Video IDs:
  `YrniQ3OgIPw`, `vJPxDmrGUR4`, `DZlKGwKUHbU`, `kjmtn7ALwHY`,
  `ku2eyoY0coc`.
- During the 23:20 CT follow-up, Codex archived the new root cwd-drift
  `slides/` and `style_manifest.json` artifacts into
  `docs/archive/lesson-video-cwd-drift/2026-07-08-2320/` after the producer
  stopped. Do not stage generated lesson-video media or T9 artifacts.
- Earlier on 2026-07-08, Alan asked whether GIIS can push toward 40 same-day
  uploads. The 40 count is a target, not permission to force weak lessons or
  bypass gates. Course-design cleanup is still needed for the visible
  11-module / 1-credit guard courses before a broad Grade 12 top-up.
- Alan approved archiving the duplicate old English IV AP-language slug folders
  on 2026-07-08. Codex moved, not deleted, the old M2/M3 folders into
  `teaching-videos/_archive/2026-07-08-english-iv-old-ap-language-slugs/`; the
  top-level English IV M2/M3 folders are now the neutral slugs only. After that,
  Codex uploaded four unlisted gate-ready/stale-repair lessons through
  `yt_queue.py upload --gate-ready`: English IV Advanced Composition M7
  `PdP21WhUXGY`, English IV Advanced Composition M8 `O2YVYGCpKbw`, English II
  Literature M9 `XPha-ZoA3V4`, and Algebra II M2 `wHUE73x_ICY`. No true
  YouTube upload/channel limit appeared. Current queue evidence: 602 total
  lesson folders, 601 uploaded, 1 pending upload, 0 no-MP4; pending release gate
  is 0 ready / 1 needs_revision / 0 blocked. The remaining pending item is
  Geometry M7, which is a quality/audit revision item and must not be forced.
  Public manifest alignment remains clean: 0 warnings across 576 lessons.
- Alan's 2026-07-06 late-night direct top-up request completed through the
  approved orchestrator path: 10 uploads succeeded, 0 failed, and no true
  YouTube upload/channel limit appeared. Current queue/dashboard evidence:
  604 total lesson folders, 603 with MP4, 602 uploaded, 2 pending upload, 0
  no-MP4; pending release gate is 2 ready / 0 needs_revision / 0 blocked.
  The 2 pending gate-ready lessons are English IV Advanced Composition M7
  `Citation & Academic Integrity` and M8 `The Analytical Essay`. The upload run
  selected 10 of 12 approved pending lessons and included both old slug and
  cleaned slug M2/M3 folders; their public titles/scripts are neutral, but this
  is now a reconciliation item to avoid duplicate logical modules surfacing in
  future manifest/public-library sync.
- Latest 10 uploaded: Economics Seminar M12-M13, English IV Advanced
  Composition M1, both M2 folder variants, both M3 folder variants, and English
  IV M4-M6. Video IDs: `sqph5_5rPh0`, `T2OugIFxIAs`, `20ku9RPGc-g`,
  `FCt8UYHhFRE`, `D5kS-6-SEoI`, `tG0wo7ng91c`, `sjaJupSOR3Y`,
  `5F2iewMEwxk`, `l9tg-WGZsSs`, `Ima2v3FpGis`.
- Public manifest alignment check after the run remains clean:
  `npm run audit:lesson-manifest` -> 0 warnings across 568 lessons. The upload
  command intentionally used `--no-sync`, so the new uploads still need the
  normal manifest/reconciliation pass before they are parent-visible through the
  website library.
- Alan's 2026-07-06 13:00 CT repair pass cleared the stopped-lane blockers.
  Economics Seminar M13's instructional "guaranteed solution" phrase was
  rewritten to avoid guarantee wording, and English IV Advanced Composition M3
  was rewritten from public-facing `AP Language: Argumentation` to
  `Argumentation and Line of Reasoning`. The English IV source course JSON was
  also cleaned so future M2-M4 generation uses neutral public titles
  (`Rhetorical Analysis`, `Argumentation and Line of Reasoning`, `Source
  Synthesis Essay`) instead of `AP Language:` titles. Current evidence:
  pending release gate 5 ready / 0 needs_revision / 0 blocked, parent-trust
  `TRUST_READY` for all 5 pending lessons, and `yt_queue.py upload --gate-ready
  --dry-run` selects all 5 with human approval. A real upload attempt was not
  sent to YouTube because `yt_queue.py upload --gate-ready --max 5` refused on
  the local quota estimate (`0 safe full uploads today`) before any external
  upload call.
- Alan approved scoped cleanup of root cwd-drift artifacts on 2026-07-05. The
  blocking root `slides/` / `style_manifest.json` artifacts were removed, and
  the 08:09 CT bounded runner resumed through the approved foundation path.
- Alan's 2026-07-06 08:00 CT producer lane is complete: it produced and
  uploaded 10 Economics Seminar lessons through the approved foundation path.
  The first upload attempt stopped correctly on parent-trust recall false
  positives; Codex tightened the deterministic classifier for behavioral
  economics subscription/framing dollar examples and environmental economics
  cap-and-trade quantity-guarantee language, verified compile + fixtures, reran
  parent-trust to `TRUST_READY`, wrote the approval artifact through the
  orchestrator, uploaded all 10 unlisted via `yt_queue.py upload --gate-ready`,
  and synced the public manifest.
- Latest 10 uploaded: Economics Seminar M2-M11. Video IDs: `sQ8n3pZrScE`,
  `lxOMri9mSNw`, `pPOnMxuySTE`, `8931GYQkvfk`, `EBRcU2qL4ko`,
  `offUIypBo_w`, `xE6RDeQ7-Qg`, `K-aWwkxdEo8`, `I9Gbx_mirEc`,
  `1DLZ_wUiG00`.
- Alan's 2026-07-06 03:00 CT producer lane is complete: it produced 10
  Economics Advanced / Economics Seminar lessons, stopped before upload on
  parent-trust recall false positives, then passed after a targeted audit
  classifier fix for economics monetary-policy money examples, instructional
  tuition/subsidy examples, and negated guarantee wording. The approved rerun
  wrote the approval artifact, uploaded all 10 unlisted through
  `yt_queue.py upload --gate-ready`, and synced the public manifest.
- Latest 10 uploaded: Economics Advanced M5-M13 and Economics Seminar M1.
  Video IDs: `Ees1Y-817YU`, `YGztGnkRy9M`, `YitzsZg91BY`,
  `ZYbgWlBv2cI`, `UDs0Sj8fkVc`, `acDNL0k7Cco`, `xIwipzvUco4`,
  `q1PxfxPrvdQ`, `MXoIIAUdFDg`, `icDkIEzmn3g`.
- 2026-07-05 20:00 CT top-up uploaded College Research & Writing M3-M8 and
  Economics Advanced M1-M4. Video IDs: `N0htezaYzJ0`, `vPZvS29eB3M`,
  `1FNGyfFfmrA`, `5RtXG9QCpy4`, `a1m8NwEzWfc`, `AiC-3xTM8jk`,
  `_oZeVP0Rpvo`, `WkxOGnIRc50`, `foFqzEBCg38`, `dD6fr0L0wBU`.
- Earlier same-day 18:01 CT run uploaded Calculus M7-M14 and College Research
  & Writing M1-M2. Video IDs: `dXLnLx7xf8Q`, `IgQJ55kaj8c`,
  `X7lBuHCmcnE`, `B8YqMnbdxzM`, `s_Pl4iv-48E`, `hIk6IMxdGMw`,
  `NbmhXtxUb64`, `0-oSRIzDh74`, `oAnavnxqjmg`, `pvtVSA5ni6Y`.
- Earlier same-day 13:03 CT run uploaded Business Strategy & Writing M5-M8 and
  Calculus M1-M6. Video IDs: `2X0XLtGkljg`, `NsfQ85bdbaE`,
  `BT7-yzM2T2w`, `zD9HBJFQE3g`, `f7FHILNMTeo`, `tPBwQ3yUQmo`,
  `u8CaK1j0bDA`, `FmlVO2i_epg`, `tAQi_WwzaSU`, `Ufq8DoGKNRQ`.
- Earlier same-day 08:09 CT run uploaded Behavioral Science M3-M8 and Business
  Strategy & Writing M1-M4. Video IDs: `ME9mtpULuOM`, `8fcmToZ3LHQ`,
  `hsdmgVuZsko`, `xUDSc8MGKXo`, `elKcNR3_gls`, `ngBmgZeqAFE`,
  `NWP5v2HJMmk`, `Pk3_uuXqh0I`, `YJYWwmjB_7A`, `0-WSaSVIGm4`.
- Queue: 612 uploaded / 7 pending / 1 no-MP4 after the 2026-07-08 15:11 CT
  upload run and current batch progress; active worker is English IV Media &
  Analytical Writing M6.
- Pending release gate: 7 ready / 0 needs_revision / 0 blocked for the current
  pending items. No new approval artifact exists yet; continue only through the
  normal approval and `yt_queue.py upload --gate-ready` path.
- Dirty risk: root `style_manifest.json` reappeared as an untracked
  cwd-drift artifact during the active producer. Do not stage it; defer cleanup
  until no producer/gate process is active.
- Artifact-backed uploads: 20 on 2026-07-06 CT, plus 10 after midnight on
  2026-07-07 CT.
- Public manifest remains aligned with 0 warnings across 576 lessons.
- No active producer, uploader, or reviewer process remained after the
  late-night run.
- No true YouTube upload/channel limit appeared; the only upload stop after
  repair was the local conservative quota estimate.
- Parent-trust audit was tightened again on 2026-07-06 after the Economics
  Seminar batch exposed false positives: behavioral-economics
  subscription/framing dollar examples and environmental-economics
  cap-and-trade quantity-guarantee language are now allowed only as instruction
  when not GIIS payment/admissions/outcome-facing. Fixture regression passed.
- Parent-trust audit was tightened again on 2026-07-06 after the Economics
  Advanced batch exposed false positives: economics policy money examples,
  externality tuition/subsidy examples, and negated "guarantee" wording are now
  allowed only as instruction when not GIIS payment/admissions/outcome-facing.
  The rerun returned `TRUST_READY` for all 10.
- Abnormal Psychology is still skipped by the course-design guard because its
  current module count is 11, outside the expected 12-16 range for a 1-credit
  course. This is a future course-design cleanup item, not an upload blocker.
- Business Law is also skipped by the course-design guard because its current
  module count is 11, outside the expected 12-16 range for a 1-credit course.
  This is a future course-design cleanup item, not an upload blocker.
- Corporate Finance, Counseling & Mental Health, and Digital Media & Society
  are also future course-design cleanup items for the same 11-module /
  1-credit guard.
- Repo root cwd-drift artifacts are dirty again after the 2026-07-17 10:02 run:
  root `slides/` and `style_manifest.json` are untracked. Do not stage generated
  lesson-video media, T9 artifacts, or these root artifacts into an unrelated
  commit; clean only in a scoped cleanup window.

Current interpretation:

- The 2026-09-10 release-evidence follow-up added a required version-bound local
  audio review to the lesson audit, V2 full-release packet, release gate,
  orchestrator, approval row and upload approval validator. English IV Writing
  M6 passed complete local Whisper/acoustic checks for exact candidate
  `quality-draft-20260910b.mp4` (WER 0.019116, -20.4 LUFS, -2.5 dBFS, no blocking
  long silence). A fresh Opus reviewer attempt hit the account session limit,
  so the audio-bound packet remains correctly HOLD at score80 pending a new
  independent response. Existing daily-midnight automation was updated in place
  to require this gate; cadence is unchanged and first scheduled delivery under
  the new prompt is not yet observed. No upload, manifest mutation, retirement
  or deletion.
  Evidence: `umi/reports/video-quality/2026-09-10/LOCAL_AUDIO_REVIEW_GATE.md`.

- The 2026-09-10 material run 006 formally published Introduction to Business
  & Economics, Introduction to Communication, and Introduction to Psychology
  at production revision `6b9dbfc7`. All 24 modules, 105 exam items, 95 quiz
  items, assignments, resources, and linked artifacts were reviewed. The
  release improved 13 assignments, 58 exam items and 28 quiz items; removed
  duplicate, untaught, robotic, and minor-privacy content; and linked all 24
  GIIS lesson videos. Hash-pinned snapshots updated 348 assessment fields and
  129 resource/title fields; final DB/API/proxy checks are zero delta. The two
  English banks remain held. Cursor is 18; next is Physical Education, Study
  Skills, and World History. Thirteen stale rendered assignment frames and full
  audiovisual review remain in the midnight video lane. Evidence:
  `umi/reports/material-quality/2026-09-10-run-006/REPORT.md`.

- The 2026-09-10 midnight quality run inspected rotation slots 81-100: 20
  manifest-bound actual MP4s / 229 section-midpoint frames. Sixteen videos have
  located clipping, overlap or missing-glyph defects and four were sample-clear;
  cursor is now 100/820 and the repair queue is 90. The two active sandbox
  replacements were rebuilt from the correct cwd and re-rendered after a
  reproducibility review invalidated September 9's stale-slide visual claim.
  English IV Writing M6 and Business Research Methods M1 are `TRUST_READY` and
  fully decode, but both need fresh exact-version independent/source and full
  audiovisual review; Business M1 additionally needs theme and narrated Expert
  Lens repair. Release remains held with no upload, manifest change, or old
  video retirement. Evidence: `umi/reports/video-quality/2026-09-10/REVIEW.md`.

- The 2026-07-22 06:00-08:45 CT heartbeat completed the approved primary
  5-cap pass plus the optional second 5-cap top-up. Digital Media & Society
  M1-M10 reached final release gate score 100, passed parent-trust as
  `TRUST_READY`, and uploaded unlisted with 0 failures. M9's parent-trust
  false-positive wording was repaired from "minimum wage guarantee(s)" to
  wage-protection language before re-render/upload; Digital Media theme
  handling was kept consistent with the existing literature/sepia course style.
- Current queue evidence after that run is 831 uploaded / 0 pending /
  0 no-MP4 / 831 total; pending release gate is 0/0/0. Manifest alignment is
  0 warnings across 768 lessons. This was not a YouTube upload/channel limit.
- Standard captions remain backlog under current policy. Do not promise captions
  on parent-facing pages until they are actually available and QA'd.
- T9 lesson media is active via the `teaching-videos/` symlink and must not be
  staged or force-added.
- Next lesson-video action: the ACTIVE midnight quality heartbeat resumes the
  five current score80/HOLD replacements after independent-review capacity is
  available, then continues the durable repair queue. Do not restart volume
  production merely to create more uploads.

- Alan clarified the lesson-video completion contract on 2026-09-11: every
  confirmed defect stays open through repair, exact-version quality evidence,
  gate-ready upload, YouTube processing/readback, a narrowly isolated manifest
  publication, live lesson-page playback verification, and only then old-video
  retirement. A render or upload by itself is not completion. Partial work is
  resumed before new repairs, and the old video remains live whenever any gate
  or publication/readback step is incomplete. This authorizes only exact
  replacement publication, not unrelated dirty-worktree deployment.

- The 2026-09-11 09:38 CDT replacement dry run stayed fail-closed: queue
  837/0/0, all five current candidates score80/HOLD, and gate-ready upload 0.
  It exposed and repaired the 420-second full-release reviewer timeout by
  aligning wrapper, orchestrator, docs, and the existing automation at 1200
  seconds; 37 focused tests pass. The first repaired-timeout review then hit a
  true Claude HTTP 429 at 95% utilization before a valid response/execution
  receipt was written. Resume Business Research Methods M1 once after the
  reported 14:30 CDT reset; no upload, manifest, deploy, or retirement occurred.
  Evidence: `umi/reports/video-quality/2026-09-11/DRY_RUN_0938.md`.

- On 2026-09-14, routine independent review was decoupled from Claude quota.
  The provider-aware adapter now defaults to a fresh read-only Codex CLI session
  on the signed-in plan, while preserving Claude as an optional cross-model
  reviewer. A real isolated known-defect content/source run observed
  `gpt-5.6-sol` at high reasoning, produced a valid receipt, found five concrete
  repair issues, and correctly remained HOLD on audiovisual/release scope. No
  candidate was released or uploaded. Evidence:
  `umi/reports/video-quality/2026-09-14/CODEX_REVIEWER_ADAPTER.md`.

## Durable Lesson-Video Rules

- The unified `giis` automation is ACTIVE daily at 00:00 CT and includes the
  video-quality phase. The former standalone `giis-video-quality-daily`
  automation is PAUSED; do not restart it as a second lane. Each unified run
  inspects twenty rotation entries and may advance up to five replacement
  identities through the complete closed lifecycle; unfinished partial stages
  come first.
- The old `giis-foundation-video-split-batch` definition was not present at the
  September 4 read. Do not recreate or restart volume/top-up without a fresh
  Alan/Umi quality and spend decision.
- If Alan explicitly reopens volume production, use the approved video-first
  runner and caps (`FOUNDATION_MAX_MODULES=5` / `FOUNDATION_UPLOAD_MAX=5`, with
  a second 5-cap top-up only after a clean first pass and fresh safe-work
  evidence). Do not force weak lessons through to fill a count.
- Same-day count source is local `teaching-videos/**/script.json` YouTube fields
  converted to America/Chicago local date.
- The public manifest can lag; it is reconciliation evidence, not the capacity
  source of truth.
- Playlist membership is normal upload hygiene.
- Standard YouTube captions, thumbnails, manifest sync, and cleanup are
  backlog/reconciliation unless Alan explicitly authorizes those lanes.
- Never force weak lessons through quality gates just to hit volume.
- Upload only through `yt_queue.py upload --gate-ready`.

## Parent Trust / Sales Boundary

- Parent-facing trust matters more than automation volume.
- Lesson-video parent-trust audit now runs fixture regression before lesson
  audits and classifies keyword hits as semantic BLOCK/ALLOW decisions instead
  of adding one-off false-positive branches.
- Manual Review Sales Mode is the v1 sales path:
  reviewed applications can use reviewed manual Stripe invoice/payment-link
  evidence before account activation.
- Manual-review billing is now the source of truth for "is a student paid"
  (2026-07-21). Admin sets `Student.paidThroughDate` + `paymentPlan` +
  `paymentNote` on the student page (`PUT /api/students/:id/payment`); paid ==
  `paidThroughDate >= today`. The roster badge, the parent dashboard
  ("Tuition paid through <date>"), and access-gating all key off this field.
  Stripe stays a payment RAIL only; its recurring lifecycle is not trusted for
  status until webhook sync is verified. A Stripe subscription that reads
  "active" but whose `currentPeriodEnd` has lapsed is now surfaced as a payment
  issue, not a false green.
- Access-gating: `blockIfSoftLocked` blocks new work (enroll, module progress,
  quiz/assignment/exam) when `paidThroughDate` has lapsed; READ stays open
  (student can still see past/completed courses). Date-driven at request time,
  no cron. Students with no `paidThroughDate` (Stripe/unset) are unaffected.
- Transfer credit: enter accepted prior courses as `CourseRow` rows in a
  "Transfer Credit — Prior School" semester; credit-only courses leave the grade
  blank (count toward the 24-credit framework, excluded from GPA). Admin SOP +
  quick-entry card live at `/admin/transfer-sop`. The whole G12-transfer + manual
  billing + access flow was E2E-tested on production 2026-07-21 (test data
  cleaned).
- Stripe live Price configuration is green as of 2026-10-03: Self-Paced
  $49/month and $499/year, Guided $149/month, and Premium $299/month Prices
  exist and production has all four corresponding IDs. Public tier/API/webhook
  preflight is 6/6 pass; this is configuration evidence, not a permission to
  bypass reviewed application binding, human academic approval, or payment
  receipt/activation gates. No test charge was made.
- `git push origin main` is the Netlify frontend deploy action for
  `genesisideas.school`; do not push casually.

## Non-Goals For Today

- Do not treat captions as a daily upload blocker.
- Do not stage or commit T9 `teaching-videos/` artifacts.
- Do not resume broad parent-facing copy or checkout changes unless the sales
  gate explicitly calls for it.
- Do not expand the video pipeline, captions lane, thumbnails lane, or broad
  cleanup lane unless Alan explicitly asks or a release gate requires it.
