# Handoff: Foundation Video V2 Pilot

Owner: Umi
Worker: Claude Code
Date: 2026-05-30
Status: ready for bounded production pass

## Mission

Produce a V2 draft for one non-AP foundation lesson:

```text
Course: English I
Module: 2
Published title: Parts of Speech & Grammar Foundations
Target folder: teaching-videos/english-i-module-2-parts-of-speech-v2/
```

This is a production draft, not upload approval.

## Required Reading

1. `tools/lesson-video/FOUNDATION_VIDEO_PLAYBOOK.md`
2. `tools/lesson-video/FOUNDATION_VIDEO_PIPELINE.md`
3. `tools/lesson-video/QUALITY_FLOW.md`
4. `tools/lesson-video/AGENT_RECIPE.md`
5. `server/prisma/courses/english/english-i.json`

## Teaching Brief

Core learning goal:

- identify the eight parts of speech
- explain what job each one does in a sentence
- use parts of speech to diagnose basic grammar errors

Misconceptions to actively prevent:

- thinking a word has the same part of speech in every sentence
- confusing adjectives and adverbs
- treating prepositions as random small words instead of relationship words
- memorizing labels without using them to improve sentences

Recommended lesson spine:

1. title
2. hook: a sentence is a team, each word has a job
3. overview
4. nouns / pronouns / verbs as the sentence core
5. adjectives / adverbs as modifiers
6. prepositions / conjunctions / interjections as connectors and signals
7. common trap: same word, different job
8. pause problem: label words in a sentence
9. answer reveal
10. revise a weak sentence using parts of speech
11. pause problem: adjective vs adverb choice
12. answer reveal
13. recap
14. Learn Portal path

Visual direction:

- use an English/literature subject theme, not math gold
- use sentence strips, color-coded word roles, and before/after revision
- avoid grammar tables that are too dense
- no AP or college-claims language

## Output Contract

Create:

```text
teaching-videos/english-i-module-2-parts-of-speech-v2/script.json
teaching-videos/english-i-module-2-parts-of-speech-v2/build_slides.py
teaching-videos/english-i-module-2-parts-of-speech-v2/slides/*.png
teaching-videos/english-i-module-2-parts-of-speech-v2/contact-sheet.jpg
teaching-videos/english-i-module-2-parts-of-speech-v2/learning_check.json
teaching-videos/english-i-module-2-parts-of-speech-v2/intro_music.wav
teaching-videos/english-i-module-2-parts-of-speech-v2/outro_music.wav
```

No YouTube upload. No playlist edit. No `script.json.youtube` block.

## Verification

Run:

```bash
cd teaching-videos/english-i-module-2-parts-of-speech-v2
python3 build_slides.py
cd ../..
python3 tools/lesson-video/make_contact_sheet.py teaching-videos/english-i-module-2-parts-of-speech-v2
python3 tools/lesson-video/audit_lessons.py teaching-videos/english-i-module-2-parts-of-speech-v2
python3 tools/lesson-video/lesson_release_gate.py teaching-videos/english-i-module-2-parts-of-speech-v2 --check
```

Report section count, slide count, contact sheet path, learning check count,
audit verdict, release gate verdict, and anything Umi must review.
