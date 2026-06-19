# GIIS Lesson Video Pipeline Paused

## 2026-06-18 Pause And Resume

Alan paused the unified Codex lesson-video automation on 2026-06-18 because the
pipeline was becoming slower than its current trust value. This is intentional,
not an upload outage. Later the same evening, Alan approved resuming the unified
Codex automation as a video-first 40/day capacity trial. Therefore this section
is historical context, not the current scheduler state.

Historical hold state:

- Codex automation: `GIIS_影片_pipeline` /
  `giis-foundation-video-split-batch`
- Status then: `PAUSED` in
  `~/.codex/automations/giis-foundation-video-split-batch/automation.toml`
- Current status after later approval: `ACTIVE` 40-capacity trial in the same
  automation TOML
- Production scope on hold: Grade 10 auto-expansion, starting with Algebra II
- Last queue snapshot at pause: 199 uploaded, 6 pending Algebra II videos,
  0 no-MP4, 205 total
- Captions, thumbnails, playlists, manifest/channel sync, and cleanup are
  reconciliation backlog, not video-upload blockers

Before making future producer/catch-up changes, run:

```bash
npm run lesson:pipeline-lanes
```

Use the lane report to choose one bounded lane:

- Producer lane: create new modules only after the speed/ROI decision is made.
- Upload lane: manually review and upload already approved pending videos only
  when they improve parent/CEEB trust.
- Quality-debt lane: repair old `needs_revision` lessons in small batches,
  separate from new production.
- Reconciliation lane: captions, thumbnails, playlists, and manifest/channel
  sync after quota reset or when explicitly scheduled.

Do not change the active 40-capacity schedule just because pending videos or
old quality-debt rows exist.

## Legacy Pause - 2026-05-22

Alan's earlier pause closed the old AP-era / launchd-style video surfaces. It
is historical context for why only the later foundation-first pipeline was ever
allowed to restart.

Reason: prevent additional spend and avoid producing or uploading low-quality,
unreviewed, or misaligned lesson videos.

Closed legacy surfaces:

- Claude Scheduled tasks:
  - `giis-lesson-pipeline-daily`
  - `giis-lesson-pipeline-late`
- Removed Mac LaunchAgents:
  - `com.giis.lesson-build`
  - `com.giis.youtube-daily`
- Removed local runners:
  - `tools/lesson-video/daily_build.sh`
  - `tools/youtube-upload/daily.sh`

Do not resume the old generation, build, upload, or auto-push surfaces.

## Foundation Daily Reset

As of 2026-05-30, AP work remains deferred. The only automation allowed to
restart is the new foundation-first pipeline:

- `tools/lesson-video/foundation_daily_orchestrator.py`
- `tools/lesson-video/foundation_daily.sh`
- Codex automation `~/.codex/automations/giis-foundation-video-daily/automation.toml`

This pipeline is allowed because it is not the old AP-era batch generator. It
must:

- default to Grade 9 before later grades unless Alan/Umi explicitly changes
  `FOUNDATION_TARGET_GRADE`
- select only non-AP foundation modules
- review the course design before starting or continuing a course video series
- repair safe structural course-design issues before producing videos; if the
  course still fails review after repair, report the blocker and do not produce
- create a Umi/Codex source packet, teaching brief, and visual brief first
- delegate bounded production work to Claude Code
- require the strict foundation gate and release gate
- write `approved_ready_to_upload.json` only for clean score-100 lessons
- upload only through `yt_queue.py upload --gate-ready`
- never use `upload_lesson.py --force-without-approval`

The old paused surfaces remain closed/removed:

- Claude Scheduled tasks `giis-lesson-pipeline-daily` / `giis-lesson-pipeline-late`
- Mac LaunchAgents `com.giis.lesson-build` / `com.giis.youtube-daily`
- Removed local runners `daily_build.sh` / `tools/youtube-upload/daily.sh`
