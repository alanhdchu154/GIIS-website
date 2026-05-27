# Lesson Video Quality Reset Plan

Date: 2026-05-26
Status: Pipeline remains paused

## Decision

Do not restart lesson generation, local builds, YouTube upload, or auto-push yet.

The pipeline was paused because quality gates found AP Computer Science A and AP Psychology videos without the required reviewer cascade, including videos already visible to families. Restarting before review would increase cost and trust risk.

## Restart Gates

The pipeline can be reconsidered only after all gates below are complete:

1. Add missing reference packets:
   - `references/ap-cs-a-ced.md`
   - `references/ap-psychology-ced.md`
2. Run post-hoc reviewer cascade for already-visible AP CS A and AP Psychology lessons.
3. Run `npm run audit:lesson-manifest`.
4. Classify each existing video:
   - `keep`
   - `description_errata`
   - `re_record`
   - `remove_or_unlist`
5. Generate a human-visible `ready_to_upload` list.
6. Alan / Central Umi approves restart explicitly.

## Upload Rule

Rendered MP4 files are not enough. Upload is allowed only when a lesson is:

- aligned to `server/prisma/courses/**/*.json`
- backed by reviewer artifacts
- passed by `lesson_release_gate.py`
- included in the human-visible `ready_to_upload` list

Until then, all local runners and scheduled upload paths must remain paused.
