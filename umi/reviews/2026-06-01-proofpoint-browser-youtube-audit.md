# Proof-Point Browser And YouTube QA

Date: 2026-06-01

Scope: first 8 family-facing showcase courses:

- Algebra I
- Geometry
- English I
- English II
- Biology
- Chemistry
- U.S. History
- Government

## Runtime Evidence

- Local API started on `http://localhost:4000`.
- Local frontend started on `http://localhost:3000`.
- Local dev database required `npm run db:push` before login because the existing dev database was missing `StudentAccount.softLocked`.
- Local dev database was reseeded with `npm run db:seed`.
- Demo student used for local-only browser QA: `hanxi.xiao@genesisideas.school`.
- The demo student was enrolled locally in the 8 proof-point courses for browser route checks.

## Browser Route QA

Initial browser walkthrough covered each proof-point course:

- `/learn/:slug`
- `/learn/:slug/module/1`
- `/learn/:slug/syllabus`

Result:

- 8/8 course pages loaded after student sign-in.
- 8/8 first module pages showed learning objectives, resources, assignment evidence, and quiz UI.
- 8/8 syllabus pages showed grading, module outline, resource links, and Assignment Feedback Evidence.
- No visible route errors were observed in the checked pages.

Focused browser re-check after resource fixes:

| Route | Result |
| --- | --- |
| `/learn/english-ii/module/1` | Reading/Writing practice now replaces the mismatched health/medicine practice resource. Assignment and quiz UI remain present. |
| `/learn/english-ii/module/6` | Reading/Writing practice now replaces the mismatched economics/finance practice resource. Assignment and quiz UI remain present. |
| `/learn/geometry/module/7` | Bad unrelated YouTube supplemental video removed; required reading/video/practice remain present. |
| `/learn/geometry/module/11` | Bad non-instructional YouTube supplemental video removed; required reading/video/practice remain present. |
| `/learn/chemistry/module/1` | Misplaced Crash Course nucleus video removed from Matter & Measurement; required reading/video/practice remain present. |
| `/learn/chemistry/module/2` | Crash Course nucleus video now appears under Atomic Structure, where it fits. |

## YouTube QA

Automated proof-point audit skips YouTube direct fetches because YouTube commonly returns automation/rate-limit pages. A separate oEmbed spot-check was run against all YouTube resources in the 8-course cohort.

Current result after fixes:

- YouTube oEmbed spot-check: 32 checked / 32 OK / 0 bad.
- Removed or relocated mismatched resources:
  - Algebra I module 4: removed systems-of-equations supplemental video from one-step/two-step equations.
  - Geometry module 7: removed unrelated natural-number formula video from Pythagorean Theorem.
  - Geometry module 11: removed non-instructional sketch video from Surface Area & Volume.
  - Chemistry module 1: moved Crash Course nucleus video to Chemistry module 2 Atomic Structure.
- Corrected visible supplemental video notes for Algebra I and Geometry where oEmbed titles did not match the old displayed source/title.

## Gates

- `npm run audit:proofpoints`: 8 pass / 0 warn / 0 fail.
- `node tools/pathway-quality/audit_proofpoint_courses.js --check-urls --report _audit/proofpoint-course-qa.md`: 8 pass / 0 warn / 0 fail; 220 non-YouTube URLs checked / 0 bad; 32 YouTube skipped by direct URL smoke.
- Separate YouTube oEmbed spot-check: 32 checked / 0 bad.
- Desktop/mobile visual walkthrough: 50 checked / 0 blockers across `/learn`, each proof-point course page, each module-1 page, and each syllabus page.
- `npm run audit:pathways`: 93 pass / 0 warn / 0 fail.
- `node tools/pathway-quality/audit_assessment_parent_trust.js --json`: 93 pass / 0 warn / 0 fail.
- `npm run build`: compiled successfully; existing Browserslist `caniuse-lite` warnings remain.

## Visual QA Evidence

Visual QA artifacts:

- `_audit/proofpoint-visual-qa/visual-qa.json`
- `_audit/proofpoint-visual-qa/desktop-dashboard.png`
- `_audit/proofpoint-visual-qa/desktop-algebra-module1.png`
- `_audit/proofpoint-visual-qa/desktop-englishii-module1.png`
- `_audit/proofpoint-visual-qa/desktop-biology-syllabus.png`
- `_audit/proofpoint-visual-qa/mobile-dashboard.png`
- `_audit/proofpoint-visual-qa/mobile-algebra-module1.png`
- `_audit/proofpoint-visual-qa/mobile-englishii-module1.png`
- `_audit/proofpoint-visual-qa/mobile-biology-syllabus.png`

Checked surfaces:

- Desktop 1280 x 900.
- Mobile 390 x 844.
- `/learn` dashboard.
- `/learn/:slug`, `/learn/:slug/module/1`, and `/learn/:slug/syllabus` for all 8 proof-point courses.

Automated visual checks found:

- 0 route errors.
- 0 horizontal overflow findings.
- 0 blocked/mismatched resource text findings.
- 0 missing module, assignment, quiz, grading, outline, or Assignment Feedback Evidence findings.

Manual screenshot review found:

- Dashboard, module, resources, embedded lesson video, assignment, and syllabus grading surfaces are presentation-clean on the sampled desktop and mobile views.
- The first proof-point cohort is now ready for a parent-facing demo from a local/staged Learn Portal perspective.

## Follow-Up

Continue the same proof-point QA pattern into the next parent-visible cohort after Alan accepts these 8 as the first showcase set. If a demo depends on live external YouTube navigation instead of embedded lesson/player availability, do one small live YouTube playback spot-check immediately before the demo because YouTube behavior can change by region/session.
