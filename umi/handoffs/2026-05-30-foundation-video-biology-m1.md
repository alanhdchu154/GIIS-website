# Handoff: Foundation Video V2 Pilot

Owner: Umi
Worker: Claude Code
Date: 2026-05-30
Status: ready for bounded production pass

## Mission

Produce a V2 draft for one non-AP foundation lesson:

```text
Course: Biology
Module: 1
Published title: The Chemistry of Life
Target folder: teaching-videos/biology-module-1-chemistry-of-life-v2/
```

This is a production draft, not upload approval.

## Required Reading

1. `tools/lesson-video/FOUNDATION_VIDEO_PLAYBOOK.md`
2. `tools/lesson-video/FOUNDATION_VIDEO_PIPELINE.md`
3. `tools/lesson-video/QUALITY_FLOW.md`
4. `tools/lesson-video/AGENT_RECIPE.md`
5. `server/prisma/courses/science/biology.json`

## Teaching Brief

Core learning goal:

- connect atoms, bonds, water properties, and macromolecules to living systems
- match carbohydrates, lipids, proteins, and nucleic acids to monomers and functions

Misconceptions to actively prevent:

- thinking chemistry is separate from biology
- memorizing macromolecule names without monomer/function links
- confusing dehydration synthesis and hydrolysis
- thinking water is only a background liquid, not an active life-supporting molecule

Recommended lesson spine:

1. title
2. hook: cells are built from chemistry
3. overview
4. atoms and bonds in living systems
5. why water matters
6. four macromolecules overview
7. common trap: name vs monomer vs function
8. pause problem: match molecule to monomer/function
9. answer reveal
10. dehydration synthesis vs hydrolysis
11. pause problem: build or break polymer?
12. answer reveal
13. recap
14. Learn Portal path

Visual direction:

- use science/biology subject theme, not math gold or English sepia
- use deterministic molecule cards and flow diagrams
- do not use generated images for exact molecule diagrams
- avoid tiny biochemical labels; this is Biology I foundation level
- no AP, College Board, or authorization-sensitive language

## Output Contract

Create:

```text
teaching-videos/biology-module-1-chemistry-of-life-v2/script.json
teaching-videos/biology-module-1-chemistry-of-life-v2/build_slides.py
teaching-videos/biology-module-1-chemistry-of-life-v2/slides/*.png
teaching-videos/biology-module-1-chemistry-of-life-v2/contact-sheet.jpg
teaching-videos/biology-module-1-chemistry-of-life-v2/learning_check.json
teaching-videos/biology-module-1-chemistry-of-life-v2/intro_music.wav
teaching-videos/biology-module-1-chemistry-of-life-v2/outro_music.wav
```

No YouTube upload. No playlist edit. No `script.json.youtube` block.

## Verification

Run:

```bash
cd teaching-videos/biology-module-1-chemistry-of-life-v2
python3 build_slides.py
cd ../..
python3 tools/lesson-video/make_contact_sheet.py teaching-videos/biology-module-1-chemistry-of-life-v2
python3 tools/lesson-video/audit_lessons.py teaching-videos/biology-module-1-chemistry-of-life-v2
python3 tools/lesson-video/lesson_release_gate.py teaching-videos/biology-module-1-chemistry-of-life-v2 --check
```

Report section count, slide count, contact sheet path, learning check count,
audit verdict, release gate verdict, and anything Umi must review.
