# G9-G12 Synthetic Lifecycle Audit — 2026-05-26

## Scope

Alan asked for an end-to-end test: create a Grade 9 student, let the student progress through Grade 12 across every scheduled course and every module, then judge the resulting record from a university-admissions perspective.

This audit was run against local Postgres only. No production student data was modified.

## Implementation

- Added `server/scripts/g9-g12-lifecycle-audit.js`.
- Added npm scripts in `server/package.json`:
  - `npm run audit:g9-g12-lifecycle`
  - `npm run audit:g9-g12-lifecycle:keep`
  - `npm run audit:g9-g12-lifecycle:cleanup`
- The script refuses to run unless `DATABASE_URL` points to localhost / local DB.
- The script syncs course JSON from `server/prisma/courses/**/*.json`, creates a synthetic student `GIIS-LIFECYCLE-G9G12`, creates application/account/parent/subscription records, creates transcript rows, enrolls the student, completes all modules, creates quizzes, assignments, midterms/finals, and verifies the resulting record.

## Result

Latest run passed:

- 8 semesters
- 32 courses
- 415 modules
- 415 module progress records
- 415 quiz attempts
- 415 graded assignments
- 64 exam attempts
- 30.5 transcript credits
- UW GPA 3.68
- Weighted GPA 3.77
- Assessment trail complete
- Graduation credit gate passed

API smoke passed:

- Student login: HTTP 200
- `/api/me`: 8 semesters, 32 enrollments
- Parent login: HTTP 200
- `/api/parent/me`: 30.5 credits, GPA 3.68, 32 enrollments
- After the 2026-05-26 LoginSession pass, API smoke also creates student/parent session rows that show last-seen time and rough duration.

Verification passed:

- `npm run audit:pathways` -> 93 pass / 0 warn / 0 fail
- `cd server && npm test -- --runInBand` -> 26 tests passed
- `npm run audit:graduation` -> all seed seniors eligible
- `npm run audit:seniors` -> all seed seniors pass, existing historical/import warnings unchanged

The synthetic student was cleaned up after the final smoke.

## Admissions-Officer Judgment

The record is structurally credible as a platform lifecycle:

- Course progression covers Grade 9 through Grade 12.
- Module progress, quizzes, assignments, and exams are internally consistent.
- The transcript meets the 24-credit frame and exceeds core buckets.
- The four-year record shows meaningful rigor, including AP exam-preparation courses.

Concerns:

- No 2-credit world-language sequence appears. This is not a GIIS graduation blocker, but many selective universities expect or prefer it.
- `LoginSession` now exists and is useful for staff care signals, but heartbeat-based duration should be treated as approximate platform presence, not exact instructional seat time.
- AP-preparation coursework should ideally be paired with official external AP scores for selective admissions.
- Generated assignment content is acceptable for local testing only. It must not be used as real student evidence.

## Recommendation

For real students, keep official evidence centered on:

1. Transcript rows and graduation eligibility.
2. Quiz/module/final-exam evidence.
3. Real student-submitted assignments, if GIIS commits to collecting them.
4. Login/session tracking as a last-seen and disengagement signal.

Short-term: add a world-language pathway option and keep assignment evidence out of official claims unless students actually submit work.

Medium-term: add advisor notes / intervention records, and a transcript-vs-Learn-Portal consistency audit that can run per student before documents are sent externally.
