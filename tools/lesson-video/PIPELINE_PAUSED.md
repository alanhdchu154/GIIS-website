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
