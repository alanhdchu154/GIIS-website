# GIIS Lesson Video Pipeline Paused

Paused by Alan on 2026-05-22.

Reason: prevent additional spend and avoid producing or uploading low-quality,
unreviewed, or misaligned lesson videos.

Paused surfaces:

- Claude Scheduled tasks:
  - `giis-lesson-pipeline-daily`
  - `giis-lesson-pipeline-late`
- Mac LaunchAgents:
  - `com.giis.lesson-build`
  - `com.giis.youtube-daily`
- Local runners:
  - `tools/lesson-video/daily_build.sh`
  - `tools/youtube-upload/daily.sh`

Do not resume generation, build, upload, or auto-push for lesson videos until
Alan explicitly re-enables the pipeline after a quality reset plan.

## Foundation Daily Reset

As of 2026-05-30, AP work remains deferred. The only automation allowed to
restart is the new foundation-first pipeline:

- `tools/lesson-video/foundation_daily_orchestrator.py`
- `tools/lesson-video/foundation_daily.sh`
- `tools/lesson-video/com.giis.foundation-video-daily.plist`

This pipeline is allowed because it is not the old AP-era batch generator. It
must:

- select only non-AP foundation modules
- create a Umi/Codex source packet, teaching brief, and visual brief first
- delegate bounded production work to Claude Code
- require the strict foundation gate and release gate
- write `approved_ready_to_upload.json` only for clean score-100 lessons
- upload only through `yt_queue.py upload --gate-ready`
- never use `upload_lesson.py --force-without-approval`

The old paused surfaces remain paused:

- Claude Scheduled tasks `giis-lesson-pipeline-daily` / `giis-lesson-pipeline-late`
- Mac LaunchAgents `com.giis.lesson-build` / `com.giis.youtube-daily`
- Local runners `daily_build.sh` / `tools/youtube-upload/daily.sh`
