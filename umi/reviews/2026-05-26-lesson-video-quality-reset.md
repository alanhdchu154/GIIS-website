# Lesson Video Pipeline Quality Reset

Date: 2026-05-26
Status: Pipeline remains paused

## Decision

Do not restart lesson generation, local MP4 builds, YouTube upload, manifest sync, cleanup, launchd jobs, or auto-push yet.

After Umi local inspection and cc second-opinion review, the issue is not only whether artifacts exist. The gate must prove that a high school student can learn from the video and that the content is reviewable against the real course/reference source.

## Current Pipeline Shape

- Course/module source of truth: `server/prisma/courses/**/*.json`
- Draft production: reference packet + course JSON + Umi handoff -> outline -> reviewer cascade -> `script.json` / slides / contact sheet / learning check
- Build runner: `tools/lesson-video/daily_build.sh`, currently blocked by `tools/lesson-video/PIPELINE_PAUSED.md`
- Upload runner: `tools/youtube-upload/daily.sh`, currently blocked by `tools/lesson-video/PIPELINE_PAUSED.md`
- Learn Portal manifest: `public/data/lessons-manifest.json`, audited by `npm run audit:lesson-manifest`

## Inventory Snapshot

Generated with:

```bash
npm run audit:lesson-video-inventory
```

Results:

- 70 lesson folders
- 50 lessons visible in the Learn Portal manifest
- 22 folders still have local MP4s
- 29 / 70 have a full reviewer cascade
- 26 AP CS A / AP Psychology lessons are missing required reference packets
- 15 visible Algebra I lessons need post-hoc reviewer cascade
- 3 AP Biology lessons have MP4 + reviews but still need learning checks before upload
- 3 AP Biology lessons are upload candidates only after human approval

## Quality Risks

1. AP CS A and AP Psychology are blocked until `references/ap-cs-a-ced.md` and `references/ap-psychology-ced.md` exist.
2. Already-visible lessons still need post-hoc review; visibility is not proof of quality.
3. `latest-release-gate.json` is a machine output, not approval. It must not be consumed directly for unattended uploads.
4. `upload_lesson.py` previously allowed direct manual uploads. It now refuses lessons that are not in the human approval file.
5. YouTube descriptions had old founder pricing language; description copy is now pricing-neutral and AP-safe.

## Implemented Hardening

- Added `npm run audit:lesson-video-inventory`.
- Added `tools/lesson-video/audit_video_quality_inventory.js` for read-only lesson quality inventory.
- Added `lesson_release_gate.py --check` so audits can run without overwriting `latest-release-gate.json`.
- Changed `yt_queue.py upload --gate-ready` to require `teaching-videos/_audit/release-gate/approved_ready_to_upload.json`.
- Changed `upload_lesson.py` to require the same approval file by default.
- Updated upload docs to remove "set and forget" language.
- Updated YouTube description pricing/AP wording.

## Restart Gates

Before restart:

1. Add AP CS A and AP Psychology reference packets from official/current course sources.
2. Run post-hoc cascade on already-visible AP CS A, AP Psychology, and Algebra I lessons.
3. Add `learning_check.json` or `quiz.json` for each upload candidate.
4. Review contact sheets for visual clarity.
5. Classify every visible/pending lesson as `keep`, `description_errata`, `re_record`, or `remove_or_unlist`.
6. Generate `approved_ready_to_upload.json` with `approved_by`, `approved_at`, evidence, and lesson slugs.
7. Alan / Central Umi explicitly approves re-enabling scheduled jobs.

## Recommendation

Start with review, not generation:

1. Reference packets for AP CS A and AP Psychology.
2. Post-hoc review board for visible lessons.
3. One V2 pilot lesson using full gates: reference -> teaching review -> student learning check -> visual QA -> human-approved upload.

Do not resume batch generation until that V2 pilot proves the gate catches weak teaching, not only missing files.
