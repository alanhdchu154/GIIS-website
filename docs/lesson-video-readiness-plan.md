# GIIS Lesson Video Readiness Plan

Last updated: 2026-07-21 16:41 CDT

## Current Status

The upload queue is clean: `793 uploaded / 0 pending / 0 no-MP4`.

That means the current built/uploaded lesson folders are healthy. It does not mean every course JSON module that exists in the repository should become a public lesson video. Some source courses were AP, duplicated, transitional, or missing grade placement.

The JSON and database Course metadata are aligned for the 18 courses touched by
this cleanup. The DB sync was surgical: only `isPublished` and `gradeLevel`
were updated, with no changes to enrollments, progress, grades, modules, exams,
or quiz questions.

## Course Source Decision

| Group | Decision | Reason | Video backlog impact |
| --- | --- | --- | --- |
| AP courses | Hidden with `isPublished:false` | GIIS should not present AP as an active course offering until the AP policy/school-code position is reopened and reviewed. | Removes 92 modules from the active production backlog. |
| Clear duplicate or legacy no-grade courses | Hidden with `isPublished:false` | These overlap with current courses and should not confuse students, parents, or the producer. They are soft-hidden instead of deleted because the production DB still has matching course rows. | Removes 40 no-grade duplicate modules from active production. |
| Transitional courses | Hidden with `isPublished:false`; grade assigned where useful | These may be useful later, but they should not drive lesson production until an advisor/student pathway need is confirmed. | Removes 35 modules from active production. |
| Advanced science courses | Kept active; assigned Grade 11 | These are legitimate advanced Grade 11 courses and passed course-design dry-run. | 28 active modules remain. |
| Grade 12 digital media/writing courses | Kept active | These are legitimate senior courses and passed course-design dry-run. | 14 active modules remain. |

## Active Published Video Backlog

These are the only currently active/published source modules that still need lesson-video production:

| Grade | Course | Missing modules |
| --- | --- | ---: |
| 11 | Biology Advanced | 14 |
| 11 | Physics - Mechanics | 14 |
| 12 | Digital Media & Society | 12 |
| 12 | English IV - Writing & Communication | 2 |

Total active backlog: 42 modules.

## Deferred / Hidden Courses

These are intentionally not part of the active lesson-video backlog:

| Course | Decision |
| --- | --- |
| AP Computer Science A | Hidden until AP policy is reopened. |
| AP Calculus AB | Hidden until AP policy is reopened. |
| AP Statistics | Hidden until AP policy is reopened. |
| AP Biology | Hidden until AP policy is reopened. |
| AP Human Geography | Hidden until AP policy is reopened. |
| AP Psychology | Hidden until AP policy is reopened. |
| Business Management or Entrepreneurship | Hidden as duplicate/legacy source. |
| Marketing Basics | Hidden as duplicate/legacy source. |
| Media Studies | Hidden as duplicate/legacy source. |
| Sports Management Basics | Hidden as duplicate/legacy source. |
| Psychology | Hidden as duplicate/legacy source. |
| Communication Studies | Hidden transitional Grade 12 candidate. |
| Principles of Marketing | Hidden transitional Grade 11 candidate. |
| Study Skills | Hidden transitional Grade 9 candidate. |
| English IV - Analytical Writing | Hidden transitional English IV variant. |
| English IV - Media & Analytical Writing | Hidden transitional English IV variant. |

## Production Plan To Fully Ready

1. Keep the current clean queue evidence as the baseline.
2. Produce and upload Grade 11 advanced science in the normal foundation pipeline:
   - Biology Advanced, modules 1-14.
   - Physics - Mechanics, modules 1-14.
3. Produce and upload Grade 12 remaining modules:
   - Digital Media & Society, modules 1-12.
   - English IV - Writing & Communication, modules 6 and 13.
4. After each run, keep the normal release gate:
   - MP4 present.
   - transcript present.
   - contact sheet present.
   - reviewer cascade complete.
   - manifest alignment clean.
5. Re-run readiness checks:
   - YouTube queue: `0 pending / 0 no-MP4`.
   - Manifest alignment: `0 warning(s)`.
   - Grade 10 dry-run: no candidates, auto-advances.
   - Grade 11 dry-run: no candidates after Biology Advanced and Physics - Mechanics are complete.
   - Grade 12 dry-run: no candidates after Digital Media & Society and English IV are complete.
6. Only after the active backlog is zero, decide whether any deferred hidden course should be revived. If revived, first assign a grade, confirm it is not duplicative, then produce all videos before setting `isPublished:true`.

## Acceptance Criteria

Lesson videos are fully ready when:

- The producer dry-run finds no active published missing modules for Grades 9-12.
- `npm run audit:lesson-manifest -- --quiet` returns 0 warnings.
- `python3 tools/youtube-upload/yt_queue.py status` returns 0 pending and 0 no-MP4.
- AP courses remain hidden unless Alan explicitly reopens AP.
- Duplicate/legacy no-grade courses remain hidden or are removed through a DB-safe cleanup, not by deleting source files while DB rows still exist.

## DB-Safe Metadata Sync

Use this command for the exact scoped course set from this cleanup:

```bash
node server/scripts/sync-course-metadata-from-json.js --slugs=ap-computer-science-a,ap-calculus-ab,ap-statistics,ap-psychology,ap-biology,ap-human-geography,business-management-entrepreneurship,marketing-basics,media-studies,sports-management-basics,psychology,communication-studies,principles-of-marketing,study-skills,english-iv-analytical-writing,english-iv-media-analytical-writing,biology-advanced,physics-mechanics
```

Add `--apply` only after reviewing the dry-run output. Broad apply is blocked
unless `--all` is explicitly passed.
