# Agent recipe — build a GIIS lesson

> Read this in full before writing any files. This is the working agreement
> for sub-agents that produce a new `teaching-videos/<slug>/` folder.

## Output you must produce

```
teaching-videos/<slug>/
├── script.json          # narration text + voice config (one entry per slide)
├── build_slides.py      # Python that generates the slide PNGs using slide_kit
├── slides/              # PNGs you produce by running build_slides.py
│   ├── 01_title.png
│   └── ...
├── contact-sheet.jpg    # visual QA sheet of all slides
├── learning_check.json  # 3-6 checks for the lesson's real learning goals
├── assets_manifest.json # required if any sourced/generated image is used
├── intro_music.wav      # copy from tools/lesson-video/intro_music.wav
└── outro_music.wav      # copy from tools/lesson-video/outro_music.wav
```

Section IDs in `script.json` must match slide filenames exactly:
`{"id": "02_hook"}` → `slides/02_hook.png`.

## Read before writing

0. **`tools/lesson-video/QUALITY_FLOW.md`** — V2 production standard:
   Presentations-quality slide story, controlled imagegen usage, browser/contact
   sheet QA, testing-strategy learning checks, and release gate rules.
1. **`tools/lesson-video/slide_kit.py`** — the `Deck` API (`title`, `overview`,
   `definition`, `equation`, `pause`, `recap`, `path`, `compare`, `custom`,
   `duplicate`). Read the docstrings for each method — the signatures tell
   you what data each slide type expects.
2. **`teaching-videos/algebra-i-module-2-pemdas/script.json`** and
   **`build_slides.py`** — the canonical "data-only" style. Most slides are
   one-liner `deck.method(...)` calls.
3. **`teaching-videos/algebra-i-module-14-quadratics/build_slides.py`** —
   reference for harder modules (more sections, more custom slides).

## `script.json` schema

```json
{
  "course":  "Algebra I",
  "module":  "Module 6: Linear Inequalities",
  "voice":   "en-US-AriaNeural",
  "voice_rate": "-3%",
  "intro_music_seconds": 3,
  "outro_music_seconds": 3,
  "sections": [
    { "id": "01_title", "text": "Welcome back. Algebra One, Module Six..." },
    ...
  ]
}
```

Voice mapping by subject (from SKILL.md):
- Math → `en-US-AriaNeural`
- Computer Science → `en-US-GuyNeural`
- Science → `en-US-EmmaNeural`
- English → `en-US-AndrewNeural`
- Social Studies → `en-US-ChristopherNeural`
- Psychology → `en-US-BrianNeural`

Rate: always `"-3%"` unless told otherwise.

## `build_slides.py` skeleton

```python
"""Module N — <Title>."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED,
)

deck = Deck(course="<Course>", module_num=N,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")

# 01 — title
deck.title("01_title", "<Course>",
           "Module N — <Title>",
           "Sample lesson  ·  ~6 minutes")

# 02 — hook  (custom or definition or equation, depending on topic)
# ... etc.
```

The `Deck` constructor auto-resolves the subject theme from `course` name:
"Algebra I" → math (gold), "AP Computer Science A" → CS (steel-blue),
"Biology" → science (teal), etc. Accent colors live on `deck.accent`.

## Required slide types (every module includes these)

| Position | Type | Notes |
|---|---|---|
| First | `deck.title(...)` | Course / module label / sub-label |
| Section 2 | hook (often `deck.custom(...)` or `deck.definition(...)`) | Real-world or surprising entry point |
| Section 3 | `deck.overview(...)` | 3-bullet game plan with footnote |
| Middle | `deck.equation(...)` / `deck.definition(...)` / `deck.custom(...)` | The actual teaching |
| Roughly middle | `deck.pause(...)` + an answer-reveal slide | One pause-and-try, followed by a narrated worked solution |
| One slide | `deck.compare(...)` | "Common trap" / wrong-vs-right column |
| Second-to-last | `deck.recap(...)` | Bullet recap, optional assignment box |
| Last | `deck.path(...)` | "How to actually master this module" with OpenStax / Khan / assignment / advisor steps and `next_text` pointing to the next module |

For CS modules: use `deck.equation()` for Java code snippets (the equation
method uses the `mono` font which renders code well). Each line tuple is
`(code, color, optional_note)`. Tip: keep individual code lines ≤ 32 chars
so they don't overflow at 80pt mono.

## Narration text rules (script.json `text` field)

- Conversational, like a teacher speaking — not slide-reading.
- 2–4 sentences per section. Target ~25–65 words; hard max 85 words unless a reviewer explicitly approves the exception.
- Don't read URLs aloud. Refer to resources by name ("OpenStax", "Khan
  Academy") rather than reading the URL.
- For pause sections: in the `*_pause1` text, give the prompt + say
  "Pause now. Solve it. Press play when you're ready." In the answer section,
  give the worked solution. Do not set `"silent": true` unless the slide is
  intentionally silent and has no teaching narration.
- For title/hook/overview: hook the parent watcher too — Phase 1 goal
  is *"parents see their child is learning."*
- Prefer misconception-first teaching:
  concept → common wrong idea → worked trace/example → pause → correction.
- Every lesson must end with a concrete Learn Portal action, not generic encouragement.

## Visual and asset rules

- Follow the `presentations:Presentations` contact-sheet bar: one claim/action per slide, distinct visual rhythm, no filler card grids.
- Precision diagrams must be deterministic in `build_slides.py`.
- `imagegen` may be used for hook images, thumbnails, or conceptual scenes only. Do not use generated images for exact scientific/math/code diagrams.
- If any sourced/generated bitmap is used, write `assets_manifest.json` with file, source/prompt, license, purpose, and precision risk.
- Generate `contact-sheet.jpg` after `build_slides.py` and inspect it for duplicate slides, overlap, tiny type, and one-note rhythm.

## Learning check rules

Write `learning_check.json` with 3-6 checks:

```json
{
  "checks": [
    {
      "skill": "trace a loop boundary",
      "question": "What prints?",
      "answer": "0 1 2 3 4",
      "misconception_tested": "off-by-one"
    }
  ]
}
```

Use this to judge whether the lesson teaches, not just whether it looks good.

## Final step (the verification)

**Important on paths**: every Cowork session has a DIFFERENT sandbox mount
prefix. Don't hardcode `/sessions/<some-id>/mnt/`. Either:

- **A) Use relative paths anchored to the lesson dir**:

  ```bash
  # First, find where teaching-videos/ is mounted in your sandbox:
  ls -d /sessions/*/mnt/giis-website 2>/dev/null
  # → /sessions/<your-current-session-id>/mnt/giis-website

  # Then cd in and use relative paths:
  cd /sessions/<your-session-id>/mnt/giis-website/teaching-videos/<slug>
  python3 build_slides.py
  ```

- **B) Or use one-liner pwd resolution**:

  ```bash
  REPO_ROOT=$(ls -d /sessions/*/mnt/giis-website | head -1)
  cd "$REPO_ROOT/teaching-videos/<slug>" && python3 build_slides.py
  ```

File tools (Read/Write/Edit) always use the macOS path
`/Users/alanhdchu/giis-website/...`. Bash uses the sandbox path. Same
underlying files, different filesystem views.

Verify slide count (sandbox bash):
```bash
ls "$REPO_ROOT/teaching-videos/<slug>/slides" | wc -l
```

The PNG count must equal the section count in script.json. Pause sections
count twice (one for question, one for the duplicated silent answer slide).

Copy the music files (`intro_music.wav` + `outro_music.wav`):
```bash
cp "$REPO_ROOT/tools/lesson-video/"{intro,outro}_music.wav \
   "$REPO_ROOT/teaching-videos/<slug>/"
```

Generate a contact sheet:
```bash
python3 "$REPO_ROOT/tools/lesson-video/make_contact_sheet.py" \
  "$REPO_ROOT/teaching-videos/<slug>"
```

Run the audit gate:
```bash
python3 "$REPO_ROOT/tools/lesson-video/audit_lessons.py" \
  "$REPO_ROOT/teaching-videos/<slug>"
python3 "$REPO_ROOT/tools/lesson-video/lesson_release_gate.py" \
  "$REPO_ROOT/teaching-videos/<slug>"
```

## When you're done

Report back:
- Folder you produced
- Section count
- Slide PNG count (must match)
- Contact sheet path
- Learning check count
- Release gate verdict
- Any errors from the build script
