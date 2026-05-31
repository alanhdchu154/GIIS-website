# GIIS Lesson Video Pipeline Paused

Paused by Alan on 2026-05-22.

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

- select only non-AP foundation modules
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
