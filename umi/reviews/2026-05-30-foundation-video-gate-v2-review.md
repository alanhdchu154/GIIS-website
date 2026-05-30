# Foundation Video Gate V2 Review

Date: 2026-05-30
Owner: Umi
Worker: Claude Code

## What Changed

Umi and Claude Code reviewed the release gate together. The old gate checked
basic lesson structure and artifact presence, but it did not enforce visual
style, slide rhythm, answer-reveal quality, reviewer freshness, or learning
checks strongly enough.

Gate v2 now checks:

- `style_manifest.json` exists and matches the expected subject theme
- pause prompt and answer reveal slides are not visually identical
- lesson has enough section/visual category variety
- `learning_check.json` exists with required fields
- reviewer JSON files are bound to the current `script.json` SHA
- fragile visual unicode such as delta charge labels is flagged
- risky public claims remain blocked

`slide_kit.Deck` now writes `style_manifest.json` automatically, so future
lessons can be checked for course-specific visual identity.

## Important Pipeline Fix

`make_lesson.py` no longer treats every `_silence` section id as muted.

Reason: the agent recipe asked writers to put worked-solution narration in
answer-reveal sections such as `09_pause1_silence`, but the renderer muted
those sections anyway. This made answer explanations disappear from MP4s.

Silence now requires either:

- empty text
- or explicit `"silent": true`

## Style Test Results

Three non-AP foundation lessons were produced or rebuilt and checked through
the new gate:

| Lesson | Theme | MP4 | Gate |
|---|---:|---:|---:|
| Algebra I Module 9: Slope & Rate of Change | math / gold | 5.4 min | pass 100 |
| English I Module 2: Parts of Speech & Grammar Foundations | literature / sepia | 4.7 min | pass 100 |
| Biology Module 1: The Chemistry of Life | science / teal | 5.4 min | pass 100 |

Final combined verification:

```text
audit_lessons.py: 3 lessons, pass 3, avg score 100
lesson_release_gate.py --check: ready 3 / needs_revision 0 / blocked 0
```

## Upload Preparation

Created:

```text
teaching-videos/_audit/release-gate/approved_ready_to_upload.json
```

Dry run:

```text
yt_queue.py upload --gate-ready --dry-run --max 4
pending with human approval: 3
```

No YouTube upload was performed.

## Next Process Rule

For future foundation videos, a lesson is not considered done until it passes
Gate v2 on the first production handoff, or the failed gate result is used to
revise the handoff before expanding to the next batch.
