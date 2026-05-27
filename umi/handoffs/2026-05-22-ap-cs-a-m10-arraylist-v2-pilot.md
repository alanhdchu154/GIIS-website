# Handoff: AP CS A Module 10 V2 Pilot

## Context

Alan and Umi are changing the lesson-video workflow from "Claude Code generates and uploads everything" to "Umi owns teaching design and review; Claude Code owns production mechanics."

Important correction: the published Learn Portal syllabus in `server/prisma/courses/electives/ap-computer-science-a.json` defines ArrayList as **Module 10**, not Module 7. Older lesson folders that call ArrayList "Module 7" are legacy references only. Do not upload or embed an ArrayList video as AP CS A Module 7.

## Goal

Produce a V2-quality AP CS A Module 10 ArrayList lesson folder that can pass the release gate:

- concise teacher narration
- deterministic slides
- transcript
- contact sheet
- learning checks
- 3 reviewer artifacts
- citation/source checker appropriate to AP CS A references
- no YouTube upload unless approved

## Files To Read First

- `ROADMAP.md`
- `AGENTS.md`
- `tools/lesson-video/AUTO_PIPELINE.md`
- `tools/lesson-video/AGENT_RECIPE.md`
- `tools/lesson-video/QUALITY_FLOW.md`
- `server/prisma/courses/electives/ap-computer-science-a.json`
- `teaching-videos/ap-cs-a-module-7-arraylist/script.json` as legacy reference only

## Target Lesson Metadata

- Course: `AP Computer Science A`
- Course slug: `ap-computer-science-a`
- Module number: `10`
- Module title: `ArrayList`
- Target folder: `teaching-videos/ap-cs-a-module-10-arraylist-v2/`

## Umi Teaching Brief

Working thesis: ArrayList is not "array but bigger." It is a resizable list object with methods, shifting behavior, and traversal/removal traps.

The lesson should teach:

- `ArrayList<E>` as an object-backed, resizable list
- import and declaration pattern: `import java.util.ArrayList;`
- `add`, `get`, `set`, `remove`, `size`
- difference from arrays: `.size()` method vs `.length` field; object references; dynamic size
- index shifting after insert/remove
- safe traversal patterns, especially removal while looping
- AP trap: forward removal can skip elements

Suggested lesson rhythm:

1. Title
2. Hook: a roster that changes during the semester
3. Overview: create, use methods, avoid shifting traps
4. Array vs ArrayList comparison
5. Declaration/import
6. Method table with short code examples
7. `add`/`remove` shifting visual
8. Pause: trace list after add/remove/set
9. Worked answer
10. Traversal with standard for loop
11. Enhanced for loop read-only warning
12. Trap: removing while moving forward skips items
13. Correct removal pattern: loop backward or adjust index
14. Recap
15. Path: Practice-It/AP CSA-style practice + dashboard assignment + next module

Narration rules:

- 25-65 words per section; hard max 85.
- Avoid generic "arrays are fixed size" repetition unless tied to a concrete ArrayList behavior.
- Show code, but explain the mental model in plain language.
- Every code slide should fit comfortably at 1080p.
- End with concrete Learn Portal action.

## Claude Code Scope

In scope:

- Rewrite or create `script.json` according to the brief.
- Rewrite `build_slides.py` using `slide_kit.py`.
- Render slides.
- Generate `contact-sheet.jpg`.
- Generate `learning_check.json`.
- Ensure `transcript.txt` exists after render/merge workflow.
- Run `audit_lessons.py` and `lesson_release_gate.py`.
- Report exact gate results.

Out of scope:

- Do not upload to YouTube.
- Do not edit unrelated courses.
- Do not change official transcript/diploma files.
- Do not push/deploy.

## Acceptance Criteria

- `script.json` parses and uses Module 10 metadata.
- Slide count equals section count.
- `contact-sheet.jpg` exists and has no overlap/tiny text.
- `learning_check.json` has 3-6 checks.
- Three reviewer JSON files exist and no reviewer has critical findings.
- Release gate is `ready`, or the remaining blockers are listed explicitly for Umi.

## Review Notes For Umi

Umi should review:

- whether the lesson teaches ArrayList as a mental model, not just method vocabulary
- whether the remove-while-looping trap is understandable
- whether code font size is readable
- whether the final path ties to Learn Portal work
- whether this is good enough for a parent to watch and think "this school is real"
