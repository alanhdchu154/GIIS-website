# Umi Workload

Last updated: 2026-05-31

This file is the current GIIS worker handoff, not a historical worklog. Older
completed items were removed from the active board; use `ROADMAP.md` for the
project lane. Use git history only when old evidence is explicitly needed.

## Active Handoff

### Foundation Video Daily Monitor

- owner: Umi / Codex
- mode: Split-work with Claude Code
- schedule: Codex automation `giis-foundation-video-daily`, daily 23:00 CT
- runner: `bash tools/lesson-video/foundation_daily.sh`
- scope: non-AP foundation modules only

Next action:

- After the next scheduled run, review selected modules, cc logs, gate output,
  upload result, and website manifest sync.

Acceptance:

- `foundation_video_gate.py` clean pass / score 100.
- `lesson_release_gate.py --check` ready.
- `approved_ready_to_upload.json` contains only clean approved lessons.
- YouTube upload uses `yt_queue.py upload --gate-ready`.
- Learn Portal manifest sync has no module-title mismatch.

Stop conditions:

- cc timeout, no tool progress, or non-zero exit.
- missing MP4, transcript, contact sheet, reviewer artifacts, learning check, or
  style manifest.
- AP / College Board / CEEB / accreditation-sensitive claims.
- any attempt to use `upload_lesson.py --force-without-approval`.

## Paused

- AP-facing lesson production.
- Old batch lesson build/upload jobs.
- System-level GIIS lesson video LaunchAgents.
- Graduated-student record edits outside a formal correction/reissue flow.
