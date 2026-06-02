# Foundation Video Production Handoff

Date: 2026-05-31
Owner: Claude Code production worker
Reviewer / release authority: Umi/Codex

## Target

- Course: Algebra I
- Module: 11: Systems of Linear Equations
- Target folder: `teaching-videos/algebra-i-module-11-systems-of-linear-equations-v2/`
- Source packet: `teaching-videos/algebra-i-module-11-systems-of-linear-equations-v2/source_packet.json`
- Teaching brief: `teaching-videos/algebra-i-module-11-systems-of-linear-equations-v2/teaching_brief.md`
- Visual brief: `teaching-videos/algebra-i-module-11-systems-of-linear-equations-v2/visual_brief.md`

## Hard Constraints

- Non-AP foundation video only.
- Do not upload to YouTube.
- Do not edit playlists.
- Do not add `script.json.youtube`.
- Do not make AP, College Board, CEEB, accreditation, Common App, NCAA, or admissions claims.
- Keep changes scoped to the target lesson folder unless a mechanical pipeline bug blocks production.

## Required Output

Produce a complete V2 lesson folder: `script.json`, `build_slides.py`, slides,
`contact-sheet.jpg`, `style_manifest.json`, `learning_check.json`, reviewer
JSON files bound to the current script SHA, music files, MP4, and transcript.

Use `tools/lesson-video/AGENT_RECIPE.md`, `QUALITY_FLOW.md`, and
`FOUNDATION_VIDEO_PLAYBOOK.md`.

## Verification

```bash
python3 tools/lesson-video/foundation_video_gate.py teaching-videos/algebra-i-module-11-systems-of-linear-equations-v2 --render-mp4
python3 tools/lesson-video/lesson_release_gate.py teaching-videos/algebra-i-module-11-systems-of-linear-equations-v2 --check
```

Stop and report if blocked. A draft is not uploadable until Umi/Codex writes
the approval artifact.
