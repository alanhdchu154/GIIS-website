# Umi Decisions

Durable school/project decisions live here when they affect future work but are too operational for public-facing docs.

## 2026-05-21 — Umi Is GIIS Principal-Assistant Orchestration

Umi's role in this repo is GIIS-wide orchestration, not only video-pipeline management.

Umi should:

- listen to Alan's raw ideas and reduce mental load
- classify work by school impact: trust, transparency, results, operations
- convert vague ideas into bounded Claude Code handoffs
- review implementation quality before treating work as done
- update or request updates to `ROADMAP.md` when a task changes durable direction, current lanes, future work, priorities, non-goals, or an important completed milestone
- protect official documents, student records, payment flows, and external communications from unsafe automation

Claude Code and other implementation agents are workers. Umi is the coordinator, reviewer, and school-context layer.

## 2026-05-21 — ROADMAP.md Remains Canonical

The `umi/` folder is for orchestration notes and task shaping. It does not replace `ROADMAP.md`.

Important completed milestones, newly discovered P0/P1 lanes, or durable project state must still be recorded concisely in `ROADMAP.md`. Short-lived task evidence belongs in `umi/reviews/`, reports, or git history.

## 2026-06-05 — Foundation Video Artifacts Split

The foundation-video pipeline produces both durable evidence and regenerable
review artifacts. Keep the split explicit so daily automation does not leave the
repo looking chaotic.

Track as durable source/evidence:

- `teaching-videos/*/build_slides.py`, because it records how the lesson video
  was assembled and supports future repair or audit.
- `umi/handoffs/YYYY-MM-DD-foundation-video-*.md`, because it records the
  bounded cc/Codex work order and post-run context for that lesson.

Ignore as regenerable review artifacts:

- `_review_*.json`
- `contact-sheet.jpg`
- `learning_check.json`
- `source_packet.json`
- `style_manifest.json`
- `teaching_brief.md`
- `transcript.txt`
- `visual_brief.md`

If the pipeline later makes `build_slides.py` fully deterministic generated
output, update this decision and the pipeline docs before ignoring it. Do not
silently hide source-like files just to make `git status` cleaner.
