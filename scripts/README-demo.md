# GIIS Walkthrough Demo

A 80-second self-playing product tour. English narration with bilingual (EN+中文) subtitles. Embed it on the homepage, render to MP4, and post to YouTube / WeChat / 小红书.

## What's here

| File | Purpose |
|---|---|
| `public/demo/walkthrough.html` | Self-contained HTML demo. Auto-plays. 9 scenes: hook → 8 pathways → student dashboard → module → exam → transcript → diploma → parent view → CTA. English captions on top, Chinese underneath. |
| `scripts/make-demo.mjs` | Smart, idempotent renderer. Synthesises voiceover (4 different neural voices), captures frames, merges to MP4 — and skips finished steps on re-run. |
| `scripts/README-demo.md` | This file. |

## The four-voice cast

The demo doesn't sound monotone — each voice has thematic ownership:

| Voice | Role | Scenes |
|---|---|---|
| `en-US-AriaNeural` | School / institutional voice | Hook · Diploma · CTA |
| `en-US-GuyNeural` | Academic authority | Pathways · Transcript |
| `en-US-JennyNeural` | Student journey | Dashboard · Module · Exam |
| `en-US-AndrewNeural` | Parent voice | Parent view |

To recast, edit the `voice` field on each entry of the `CAPTIONS` array in `walkthrough.html`. List all available voices with `edge-tts --list-voices`. Some good ones: `en-GB-SoniaNeural` (British female), `en-GB-RyanNeural` (British male), `en-AU-NatashaNeural` (Australian female).

## Quick preview (no MP4 yet)

```bash
npm start
# Open http://localhost:3000/demo/walkthrough.html
```

It plays automatically. The ↻ button replays. Or open the file directly without the dev server: `open public/demo/walkthrough.html`.

## Make the MP4 (run on your Mac)

### One-time setup

```bash
npm install                              # adds playwright as devDependency
npx playwright install chromium          # downloads headless Chromium (~150 MB)
npm run tools:python:bootstrap           # edge-tts + GIIS Python toolchain
brew install ffmpeg                      # OR: conda install -c conda-forge ffmpeg
```

> The script auto-finds `ffmpeg` and `ffprobe` in PATH, anaconda, Homebrew (Apple Silicon + Intel), and MacPorts locations. If yours is elsewhere, prepend it to `PATH`.

### One command, full pipeline

```bash
npm run make-demo
```

That does everything end-to-end:

1. **edge-tts** synthesises 9 voiceover lines using 4 neural voices
2. **ffmpeg** pads silence and concats them into a single ~80 s `voiceover.mp3`
3. **Playwright** opens the demo headlessly at 1920×1080 and screenshots 401 frames using `GIIS_DEMO.seek(t)` for fast capture (~40 s, much faster than realtime)
4. **ffmpeg** merges frames + audio → `demo-output/giis-demo.mp4`

Re-running `npm run make-demo` is safe: each stage detects cached output and skips if inputs haven't changed. Only edited the captions? Only the audio re-renders. Only changed colors in the HTML? Only the frames re-render.

### Targeted re-runs

| Command | When to use |
|---|---|
| `npm run make-demo` | Default. Skips cached steps. |
| `npm run make-demo:audio` | Only regen voiceover (after editing captions or voices). |
| `npm run make-demo:merge` | Only re-mux current audio + frames into MP4 (after a manual frame edit). |
| `npm run make-demo:force` | Rebuild everything from scratch. |
| `npm run make-demo -- --no-audio` | Silent video (good for autoplay-on-mute hero embeds). |
| `npm run make-demo -- --frames-only` | Only capture frames. Useful when iterating on visuals. |
| `npm run make-demo -- --fps=10` | Higher framerate (smoother but slower capture, larger file). |

### Cache layout

```
demo-output/
├─ giis-demo.mp4              ← final output
├─ giis-demo-voiceover.mp3    ← standalone audio (use it however)
└─ _cache/
   ├─ audio/
   │  ├─ cap_00.mp3 … cap_08.mp3   (per-line synth)
   │  └─ _key_<hash>               (input hash stamp)
   └─ frames/
      ├─ f_0000.png … f_0400.png   (401 frames)
      └─ _key_<hash>               (input hash stamp)
```

Delete `_cache/` to force a clean rebuild. The hash files mean the script knows whether the inputs (caption text, voices, HTML) match what produced the cache.

## Where to put the rendered MP4

### Homepage hero (silent autoplay loop)

```bash
npm run make-demo -- --no-audio        # gives muted-friendly version
cp demo-output/giis-demo.mp4 public/demo/giis-demo-hero.mp4
```

```html
<video
  src="/demo/giis-demo-hero.mp4"
  autoplay muted playsinline loop
  style="width:100%; aspect-ratio:16/9; object-fit:cover;"
/>
```

### Admission / Pricing pages (with sound, click-to-play)

```html
<video controls poster="/demo/giis-demo-poster.jpg" style="width:100%;">
  <source src="/demo/giis-demo.mp4" type="video/mp4" />
</video>
```

Generate the poster from a frame:

```bash
ffmpeg -i demo-output/giis-demo.mp4 -ss 00:00:55 -frames:v 1 public/demo/giis-demo-poster.jpg
```

### YouTube / 小红书 / WeChat

Upload `giis-demo.mp4` directly. It's already 1080p H.264.

WeChat / 小红书 cuts under 60 seconds:

```bash
ffmpeg -i demo-output/giis-demo.mp4 -t 60 -c copy demo-output/giis-demo-60s.mp4
```

For 9:16 vertical, edit `make-demo.mjs` viewport from `{ 1920, 1080 }` to `{ 1080, 1920 }` and `npm run make-demo:force`. The HTML stage reflows to vertical.

## Editing captions or voiceover

Captions are the source of truth in `walkthrough.html` → `const CAPTIONS = [...]`. Each entry has:

```js
{
  at: 6.5,                          // seconds, when this caption appears
  to: 15.0,                         // seconds, when it disappears
  voice: 'en-US-GuyNeural',         // edge-tts voice for this line
  en: "Eight academic pathways...",
  zh: "八条学习路径..."
}
```

After editing:

```bash
npm run make-demo:audio       # regen voiceover only
npm run make-demo:merge       # remux MP4 with the new audio
```

## Troubleshooting

**`✗ Couldn't find ffmpeg / ffprobe`** — install via `conda install -c conda-forge ffmpeg` or `brew install ffmpeg`. Already installed elsewhere? `export PATH="<that_dir>:$PATH"` then re-run.

**`✗ edge-tts not installed`** — run `npm run tools:python:bootstrap`. If you have multiple Pythons, set `GIIS_PYTHON=/path/to/python` before running the demo.

**Voiceover sounds wrong / has a different accent** — change the voice in `CAPTIONS`. Run `edge-tts --list-voices | grep en-` to see options.

**Cache thinks nothing changed but I want a rebuild** — `npm run make-demo:force` or just `rm -rf demo-output/_cache`.

**Hero video plays too fast on retina/HiDPI** — the recording is at 1920×1080 device-pixel ratio 1. Set `deviceScaleFactor: 2` in `make-demo.mjs` for retina (heavier file, sharper text).
