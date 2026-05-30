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

## Foundation Exception

As of 2026-05-30, AP work remains deferred. A single non-AP foundation lesson
may be produced manually only when there is a Umi-approved handoff under
`umi/handoffs/` and the work follows
`tools/lesson-video/FOUNDATION_VIDEO_PLAYBOOK.md`.

This exception allows a bounded draft/render/review cycle. It does not allow
scheduled generation, scheduled build, scheduled upload, playlist edits, or
`--force-without-approval`.
