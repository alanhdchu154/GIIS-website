# Review: Course Video Alignment And Syllabus Pass

Date: 2026-05-22
Owner: Umi

## Summary

I reviewed the Learn Portal course/module surface and the lesson-video manifest together because parents and students experience them as one product. The main risk is not only syllabus quality; it is stale video metadata attaching the wrong uploaded lesson to a published module with the same number.

## What Changed

- Added a title compatibility guard to `LessonVideoEmbed`.
- Passed the current Learn Portal module title from `ModulePage`.
- Added `npm run audit:lesson-manifest` to compare `public/data/lessons-manifest.json` against `server/prisma/courses/**/*.json`.
- Corrected the AP CS A ArrayList pilot from Module 7 to Module 10.
- Strengthened AP Computer Science A objectives for Modules 1, 8, 9, and 10 so the course no longer appears in the pathway audit warning list.
- Updated the lesson-video SOP so Claude Code must read course JSON before producing a lesson.

## Findings

### High Priority

- AP CS A has a real numbering mismatch: the published syllabus says Module 7 is constructors/encapsulation and Module 10 is ArrayList, while older teaching-video folders label ArrayList as Module 7.
- AP Calculus AB has broader drift: manifest lessons M2-M12 do not match the current published course JSON titles.
- Without a guard, the Learn Portal can show a polished but wrong lesson under a module, which hurts trust more than simply having no video.

### Medium Priority

- `npm run audit:pathways` now reports 49 pass / 44 warn / 0 fail. The remaining warnings are mostly weak objectives, thin assignments, low estimated hours, and open-response answers that look like multiple-choice keys.
- Courses that most affect parent trust should be cleaned first: AP Biology, AP Calculus AB, Biology, English I, and World History.

## Verification

- `node --check tools/youtube-upload/audit_manifest_alignment.js`
- `npm run audit:lesson-manifest`
- `npm run audit:pathways`
- `npm run build`

## Recommendation

Before CC produces or uploads more lessons, reconcile uploaded lesson metadata against the course JSON. For new lessons, use course JSON as the source of truth and treat old `teaching-videos/` folder numbers as legacy reference only.
