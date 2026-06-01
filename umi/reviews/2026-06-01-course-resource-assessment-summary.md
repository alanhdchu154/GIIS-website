# Course Resource And Assessment Summary

Generated: 2026-06-01

This note archives the completed course/resource/assessment work that used to
make `ROADMAP.md` hard to scan.

## Current Automated Evidence

- Course bank: 93 courses, 993 modules.
- `npm run audit:pathways`: 93 pass / 0 warn / 0 fail.
- `node tools/pathway-quality/audit_assessment_parent_trust.js --json`: 93 pass / 0 warn / 0 fail.
- Parent-trust audit metrics:
  - 7,224 assessment questions.
  - 993 module assignments.
  - 0 response-check bridge questions.
  - 0 generic short-answer keys.
  - 0 old generated wording patterns.
  - 0 duplicate options.
  - 0 duplicate question texts.
  - 0 weak assignment-evidence warnings.

## Completed Work

- Removed old generated quiz/exam wording patterns and letter-only answer claims.
- Tightened assignment flow: students submit free text/links, assignments require human review, written feedback, and a 0-100 score.
- Final exam unlock now requires submitted module assignments and a passed midterm; course credit requires final pass plus weighted course grade of at least 70.
- Parent/student/admin surfaces now expose assignment review status, score, written feedback, reviewer ownership, rubric criteria, and review-due framing.
- Assignment evidence labels now distinguish writing/reflection, research/evidence, project/design, data/lab evidence, presentation/performance, practice/problem set, and general learning evidence.
- Public assessment policy copy now matches the enforced 70% credit threshold and avoids overclaiming planned proctoring/randomization.
- Filled missing required resource fields with free/open resources and removed hard-blocking required flows where found.
- English I literature/drama modules were moved away from CommonLit/copyrighted-text dependency toward public-domain Project Gutenberg texts.
- Learn module navigation now resets stale quiz/assignment/progress/loading state on route changes and ignores delayed prior-module responses.

## Watch Items

- Khan Academy is acceptable as a free nonprofit resource, but it should not be the only required path when login/progress tracking could block a student.
- YouTube availability checks can hit automated 429/rate-limit pages; treat browser/manual spot checks as separate from non-YouTube URL smoke checks.
- Before using the course bank as a public proof point, do subject-matter spot checks on the highest-visibility courses.
