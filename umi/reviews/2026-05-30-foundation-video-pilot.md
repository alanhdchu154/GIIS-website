# Foundation Video Pilot Review

Date: 2026-05-30
Owner: Umi
Worker attempted: Claude Code

## Decision

AP video work remains deferred. The first safe restart path is a foundation
course pilot, beginning with Algebra I Module 9: Slope & Rate of Change.

This lesson is a machine-ready upload candidate, not uploaded.

## What Happened

Claude Code was given the bounded handoff in
`umi/handoffs/2026-05-30-foundation-video-v2-pilot.md`.

The non-interactive cc run hung without returning a final report, so Umi
stopped the process and audited the files directly. cc had produced the
initial target folder. Umi then fixed the answer-reveal slides, added honest
internal reviewer artifacts, rendered the MP4, and reran the gate.

## Produced Candidate

Folder:

```text
teaching-videos/algebra-i-module-9-slope-rate-change-v2/
```

Key artifacts:

- `script.json`
- `build_slides.py`
- `slides/*.png` — 14 slides
- `contact-sheet.jpg`
- `learning_check.json` — 5 checks
- `_review_A.json`, `_review_B.json`, `_review_C.json`
- `audio/*.mp3` and `audio/*.wav`
- `transcript.txt`
- `algebra_i_module_9_slope_rate_change_v2.mp4` — 5.8 MB, about 4.7 minutes

## Verification

Commands run with `/tmp/giis-video-venv/bin/python`:

```bash
cd teaching-videos/algebra-i-module-9-slope-rate-change-v2
python build_slides.py
cd ../..
python tools/lesson-video/make_contact_sheet.py teaching-videos/algebra-i-module-9-slope-rate-change-v2
python tools/lesson-video/make_lesson.py teaching-videos/algebra-i-module-9-slope-rate-change-v2
python tools/lesson-video/audit_lessons.py teaching-videos/algebra-i-module-9-slope-rate-change-v2
python tools/lesson-video/lesson_release_gate.py teaching-videos/algebra-i-module-9-slope-rate-change-v2 --check
```

Final audit:

```text
Generated: 2026-05-30T21:45:17Z
Verdict: pass
Score: 100
Release gate: ready 1 / needs_revision 0 / blocked 0
```

## Upload Status

Do not upload automatically.

Next step is a human-visible approval decision. If approved, add this lesson to
the approved ready-to-upload artifact and upload through the gated YouTube
queue, not direct upload scripts.
