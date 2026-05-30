# Foundation Video Pipeline

Date: 2026-05-30
Status: active v0.1

## Goal

Make Claude Code able to produce high-quality non-AP foundation videos
repeatably, while Umi remains the academic editor and release authority.

This is the intended loop:

```text
Umi chooses foundation module
  -> Umi writes bounded handoff
  -> cc_foundation_worker.py runs Claude Code with streaming progress
  -> foundation_video_gate.py verifies slides/contact sheet/audit/release gate
  -> Umi reviews contact sheet + MP4
  -> human-visible approval artifact
  -> gated YouTube queue upload
```

## Why Claude Code Felt Slow

Observed on 2026-05-30:

- `claude --print` returns no progress until the whole task is complete.
- A one-line `OK` response starts in about 2-3 seconds, so startup is not the
  main bottleneck.
- Claude Code loads a large cached project context, about 29k cached tokens in
  this repo.
- `claude mcp list` showed Netlify failing to connect and Stripe needing auth,
  so health checks can be slower than normal generation.
- The project local settings had a stale additional directory pointing at the
  old `/Users/alanhdchu/GIIS/giis-website/.git` path. It now points at
  `/Users/alanhdchu/giis-website/.git`.

The fix is to run cc through a streaming wrapper and keep every assignment
bounded to one handoff and one module.

## Worker Command

Use:

```bash
python3 tools/lesson-video/cc_foundation_worker.py \
  umi/handoffs/2026-05-30-foundation-video-v2-pilot.md \
  --target teaching-videos/algebra-i-module-9-slope-rate-change-v2 \
  --budget-usd 3 \
  --timeout-seconds 900
```

The wrapper:

- uses `stream-json` so progress appears while cc works
- saves raw logs under `umi/reviews/cc-runs/`
- enforces a timeout
- passes a hard no-upload / no-AP contract

## Gate Command

Use:

```bash
python3 tools/lesson-video/foundation_video_gate.py \
  teaching-videos/algebra-i-module-9-slope-rate-change-v2 \
  --render-mp4
```

If local Python lacks Pillow / edge-tts / imageio-ffmpeg, create a temporary
venv:

```bash
python3 -m venv /tmp/giis-video-venv
/tmp/giis-video-venv/bin/python -m pip install Pillow edge-tts imageio-ffmpeg
/tmp/giis-video-venv/bin/python tools/lesson-video/foundation_video_gate.py \
  teaching-videos/algebra-i-module-9-slope-rate-change-v2 \
  --render-mp4 \
  --python /tmp/giis-video-venv/bin/python
```

## Release Rule

`ready` from `lesson_release_gate.py` means ready for Umi/Alan review, not
automatic publication.

Upload still requires:

- Umi review of the contact sheet and MP4
- no AP / authorization-sensitive claims
- human-visible approval artifact
- gated queue upload

Do not use direct upload scripts for normal operations.
