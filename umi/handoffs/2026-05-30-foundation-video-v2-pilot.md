# Handoff: Foundation Video V2 Pilot

Owner: Umi
Worker: Claude Code
Date: 2026-05-30
Status: ready for bounded production pass

## Mission

Produce a V2 draft for one non-AP foundation lesson:

```text
Course: Algebra I
Module: 9
Published title: Slope & Rate of Change
Target folder: teaching-videos/algebra-i-module-9-slope-rate-change-v2/
```

This is a production draft, not upload approval.

## Required Reading

Read these before writing files:

1. `tools/lesson-video/FOUNDATION_VIDEO_PLAYBOOK.md`
2. `tools/lesson-video/QUALITY_FLOW.md`
3. `tools/lesson-video/AGENT_RECIPE.md`
4. `server/prisma/courses/math/algebra-i.json`
5. legacy reference only: `teaching-videos/algebra-i-module-9-slope/script.json`

The legacy folder is not source of truth. It had stale YouTube metadata for a
removed video. Use it only as a rough content reference.

## Teaching Brief

Core learning goal:

- calculate slope from two points and from a graph
- interpret slope as rate of change in real-world contexts

Misconceptions to actively prevent:

- memorizing `y2 - y1 / x2 - x1` without understanding rise/run
- mixing the x and y differences
- ignoring negative direction
- treating zero slope and undefined slope as the same thing
- thinking rate of change is a different topic from slope

Recommended lesson spine:

1. title
2. real-world hook: steepness or rate of change
3. overview
4. rise over run from a graph
5. slope from two points
6. common trap: reversed subtraction or mixed coordinates
7. pause problem: two-point slope
8. answer reveal
9. positive / negative / zero / undefined slopes
10. rate of change application
11. pause problem: real-world rate of change
12. answer reveal
13. recap
14. Learn Portal path

Visual direction:

- draw coordinate planes and rise/run arrows deterministically in Python
- use large, readable labels
- avoid tiny coordinate clutter
- no generated images for graphs or equations
- no stock-looking filler slides

## Output Contract

Create:

```text
teaching-videos/algebra-i-module-9-slope-rate-change-v2/script.json
teaching-videos/algebra-i-module-9-slope-rate-change-v2/build_slides.py
teaching-videos/algebra-i-module-9-slope-rate-change-v2/slides/*.png
teaching-videos/algebra-i-module-9-slope-rate-change-v2/contact-sheet.jpg
teaching-videos/algebra-i-module-9-slope-rate-change-v2/learning_check.json
teaching-videos/algebra-i-module-9-slope-rate-change-v2/intro_music.wav
teaching-videos/algebra-i-module-9-slope-rate-change-v2/outro_music.wav
```

No YouTube upload. No playlist edit. No `script.json.youtube` block.

## Verification

Run:

```bash
cd teaching-videos/algebra-i-module-9-slope-rate-change-v2
python3 build_slides.py
cd ../..
python3 tools/lesson-video/make_contact_sheet.py teaching-videos/algebra-i-module-9-slope-rate-change-v2
python3 tools/lesson-video/audit_lessons.py teaching-videos/algebra-i-module-9-slope-rate-change-v2
python3 tools/lesson-video/lesson_release_gate.py teaching-videos/algebra-i-module-9-slope-rate-change-v2 --check
```

Report:

- section count
- slide PNG count
- contact sheet path
- learning check count
- audit verdict
- release gate verdict
- any files that still need Umi review
