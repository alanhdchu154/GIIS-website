# G10-G12 Catalog + Learn Portal Curriculum Pass

Date: 2026-05-26
Owner: Umi
Scope: Grade 10, Grade 11, Grade 12, AP-adjacent pathway wording, and public catalog / Learn Portal alignment.

## Review Standard

I reviewed the courses from the perspective of a high school student asking:

- Does this sequence make academic sense after G9?
- Does each course have enough modules for the credit value?
- Are module objectives measurable enough to know what I am supposed to learn?
- Does each week produce visible student work, not just passive watching/reading?
- Are resources and assignments sufficient for a motivated online student to learn independently?
- Does public pathway/catalog wording match the Learn Portal source of truth?
- Does AP-adjacent wording stay conservative while school review / CEEB processes remain pending?

## Result

`npm run audit:pathways`

Result after this pass:

```text
Course quality audit: 93 pass / 0 warn / 0 fail (93 courses)
```

## What Changed

- Grade-level metadata is now aligned for G10-G12 electives and pathway courses that were previously null or misplaced in the Learn Portal JSON.
- G10/G11/G12 course warnings were cleared across objectives, assignment depth, answer-key quality, and estimated-hours thresholds.
- Generated fill-in questions that had answer keys like `B` without answer choices were converted into short-response grading expectations so students can actually answer them.
- One-credit courses that were below the minimum estimated-hour threshold were raised to a more realistic workload.
- Weak objectives were rewritten so students can see what they must analyze, explain, write, calculate, evaluate, or produce.
- Thin assignments were expanded to require a visible student product, correction/reflection, or applied analysis.
- AP-adjacent public wording was softened to `exam preparation`, `College Board-aligned`, or `school review processes remain pending`.

## Grade-Level Alignment Notes

G10 now includes the core sophomore sequence plus relevant electives:

- English II / English II Literature
- Algebra II / Pre-Calculus
- Chemistry / Physics Fundamentals
- U.S. History / World Politics
- Public Speaking, Marketing & Communication, Leadership Communication
- Psychology Foundations, Social Psychology, Sports Psychology

G11 now includes junior core and concentration-building courses:

- English III / English III Literature
- Statistics / Trigonometry
- Economics / Government
- Research Methods, Business Research Methods, Ethics & Critical Thinking
- Academic Writing, Media & Society, Digital Marketing, Business Writing
- AP Computer Science A exam preparation and AP Psychology exam preparation

G12 now includes senior capstone / advanced options:

- English IV variants
- Calculus / AP Calculus AB exam preparation / AP Statistics exam preparation
- AP Biology and AP Human Geography exam preparation
- Sociology, Economics Seminar, Economics Advanced, Statistics for Social Sciences
- College Research & Writing, Digital Media & Society
- Senior business, psychology, and sports-management electives

## Student-Learning Judgment

After this pass, the G10-G12 materials are usable for a serious self-paced online high school student. The best courses now have:

- 8 modules for half-credit courses or 13-16 modules for one-credit courses.
- At least 3 quiz questions per module.
- Midterm and final question banks.
- Objectives that name observable learning behaviors.
- Assignments that ask for written, analytical, mathematical, visual, or project-based output.

Remaining curriculum improvement is now qualitative rather than structural:

- Add more teacher-created worked examples for math/science.
- Add exemplar student submissions and rubrics for writing/capstone courses.
- Add richer lab simulations for Chemistry, Biology Advanced, AP Biology exam preparation, and Physics.
- Add a student-facing pacing guide by grade so the number of available electives does not feel like a menu dump.

## AP / CEEB Guardrail

Until AP Course Audit / CEEB status is confirmed:

- Public pages should say `AP exam preparation`, `College Board-aligned resources`, or equivalent cautious wording.
- Avoid claims that GIIS is AP-authorized, has approved AP courses, is accredited, or has a finalized CEEB code unless confirmed.
- Course JSON may preserve official exam names for clarity, but descriptions should frame them as preparation aligned to College Board materials.

## Next Reusable Checklist

For future pathway/course passes:

1. Run `npm run audit:pathways`.
2. Map public catalog rows against `server/prisma/courses/**/*.json`.
3. Confirm gradeLevel/type/credits match public expectations.
4. Inspect modules as a student: objective, resource, assignment, production.
5. Convert unusable answer keys into answerable quiz items.
6. Re-run audit until 0 fail / 0 warn for the target slice.
7. Build and smoke-check public pages plus representative `/learn/:slug/syllabus` pages.
