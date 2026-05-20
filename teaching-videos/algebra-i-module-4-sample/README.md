# Algebra I — Module 4 — Sample teaching video

A ~4-minute sample built from the module's `objectives` in `server/prisma/courses/math/algebra-i.json`.

## What's in here

| File | Purpose |
|---|---|
| `algebra_i_module_4_sample.mp4` | Final 1920×1080 MP4 with burned-in English subtitles |
| `subtitles.srt` | Standalone SRT file (94 cues, English) |
| `script.json` | The lecture script split into 10 narrated sections |
| `slides/01_*.png … 10_*.png` | The 10 source slides (GIIS maroon + gold + crest) |
| `build_slides.py` | Generates the slides from scratch — edit copy/colors here |
| `synth_audio.py` | Offline TTS used in the sandbox (espeak-ng, robotic) |
| `synth_audio_local.py` | **Run this on your Mac to get the real Aria voice** |
| `build_srt.py` | Recomputes timing + SRT after the audio changes |
| `rebuild_video.sh` | One-shot: re-stitch MP4 from current audio + slides |

## Why does the voice sound robotic?

The sandbox this runs in blocks Microsoft's Edge TTS endpoint, so the real
`en-US-AriaNeural` neural voice can't be reached from here. The sample uses
`espeak-ng` as an offline placeholder so you can see slide timing and subtitle
sync.

## How to swap in the real Aria voice (on your Mac)

```bash
cd teaching-videos/algebra-i-module-4-sample
pip3 install edge-tts
python3 synth_audio_local.py     # regenerates audio/*.wav with Aria
bash rebuild_video.sh            # re-stitches the MP4
```

That's it. Same pipeline, real voice.

## Scaling to other modules / 30-min lessons

The pipeline is fully data-driven from `script.json`. To produce another module:

1. Pick a course JSON (e.g. `english/english-i.json`) and a module's `objectives` + `assignment`.
2. Write a longer `script.json` (target ~700 words per 5 min, ~4000 words per 30 min).
3. Edit `build_slides.py` to add slides — one function per slide, then a call at the bottom.
4. Run `synth_audio_local.py` → `rebuild_video.sh`.

For batch-producing every module across the whole curriculum, the script-writing
step is the bottleneck — that one I'd want to do interactively with you on
the first 1-2 per subject, then template the rest.

## Branding

- Maroon `#6B1F2A` (sampled from your school crest)
- Gold `#D4A634`
- Cream paper `#FAF6EC`
- Logo: `src/img/logo_nobg.png` (used as-is on the title slide)
