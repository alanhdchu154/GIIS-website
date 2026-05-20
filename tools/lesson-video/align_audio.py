#!/usr/bin/env python3
"""Force-align lesson audio to script.json text using faster-whisper.

Why this exists
---------------
edge-tts used to emit `WordBoundary` events that let us emit subtitle cues
aligned to actual word timing. Microsoft's upstream service stopped sending
those events in 2024, so make_lesson.py can no longer get word-level
timestamps directly from TTS.

This tool fills the gap: it reads each section's MP3 + the known script.json
narration text, runs faster-whisper to recover word-level timestamps, and
writes `audio/<id>.words.json` in the format merge_lesson.py already consumes.
Since we know the exact narration text, we use whisper's `initial_prompt` to
bias the model and improve alignment accuracy.

We use whisper's transcription timestamps directly (not whisper's words —
the displayed subtitles still come from script.json). For our chunk-based
subtitle algorithm, what matters is the COUNT of word events roughly matching
the script.json word count so chunks slice correctly. Whisper's per-word
timing is accurate to ±100ms which is well below visible subtitle drift.

Usage
-----
    python3 tools/lesson-video/align_audio.py teaching-videos/<slug>/
    python3 tools/lesson-video/align_audio.py teaching-videos/<slug>/ --model base.en
    python3 tools/lesson-video/align_audio.py teaching-videos/<slug>/ --force

Model choice
------------
    tiny.en   — 39M params, ~75MB on disk, ~5x faster, decent for alignment
    base.en   — 74M params, ~140MB, more robust, default
    small.en  — 244M params, ~470MB, overkill for alignment

Idempotence
-----------
Skips sections whose `<id>.words.json` already exists with non-empty content
(unless --force is set). MP3 files are not modified.
"""
from __future__ import annotations
import argparse, json, sys, time
from pathlib import Path


# ─── colors ────────────────────────────────────────────────────────────
G, Y, R, D, RESET, B = "\033[32m", "\033[33m", "\033[31m", "\033[2m", "\033[0m", "\033[1m"


def log(msg: str, color: str = ""):
    print(f"{color}{msg}{RESET}" if color else msg)


# ─── main alignment routine ────────────────────────────────────────────
def align_section(model, mp3: Path, words_out: Path, text_hint: str) -> dict:
    """Run faster-whisper on one MP3, write words.json.

    Returns {"words": N, "duration_s": D, "elapsed_s": T} summary.

    Note on `initial_prompt`: empirically, passing the known narration text
    as an initial_prompt makes whisper bail early on familiar content
    (returns 5-10 words for a 50-word section that takes 20s). We instead
    transcribe naively with higher beam + disabled context conditioning,
    and accept whisper's own words — merge_lesson.py slices by COUNT not by
    content, so whisper's word boundaries are what we actually need.
    """
    t0 = time.time()
    segments, info = model.transcribe(
        str(mp3),
        language="en",
        word_timestamps=True,
        # No initial_prompt — see docstring. We trust whisper's transcription.
        # No VAD trim — we want every spoken word, including title/outro phrases.
        vad_filter=False,
        # Default beam for accuracy. Per-section costs ~2-15s on CPU.
        beam_size=5,
        # Independent transcription per section — don't let earlier section
        # context leak through (faster-whisper streams segments internally).
        condition_on_previous_text=False,
        # Deterministic — no temperature fallback that can cause skipping.
        temperature=0.0,
        # Lower no_speech threshold — don't drop quiet speech as noise.
        no_speech_threshold=0.3,
    )

    words: list[dict] = []
    for seg in segments:
        if seg.words is None:
            continue
        for w in seg.words:
            tok = w.word.strip()
            if not tok:
                continue
            words.append({
                "text":       tok,
                "offset_s":   round(w.start, 3),
                "duration_s": round(max(0.001, w.end - w.start), 3),
            })

    # Atomic write — if we crash mid-write, next run won't see a corrupt file.
    tmp = words_out.with_suffix(".json.tmp")
    tmp.write_text(json.dumps({"words": words}, ensure_ascii=False, indent=0))
    tmp.replace(words_out)

    return {
        "n_words":     len(words),
        "duration_s":  round(info.duration, 2),
        "elapsed_s":   round(time.time() - t0, 2),
    }


# ─── orchestration ─────────────────────────────────────────────────────
def align_lesson(lesson_dir: Path, model_size: str = "base.en",
                  force: bool = False) -> int:
    lesson_dir = lesson_dir.resolve()
    script_path = lesson_dir / "script.json"
    if not script_path.exists():
        log(f"{R}no script.json in {lesson_dir}{RESET}", R)
        return 1

    script = json.loads(script_path.read_text())
    sections = script.get("sections", [])
    audio_dir = lesson_dir / "audio"
    if not audio_dir.is_dir():
        log(f"{R}no audio/ folder in {lesson_dir}{RESET}", R)
        return 1

    # Decide which sections need alignment. A words.json file is considered
    # "valid" only if it parses AND has a non-empty `words` list — older
    # versions wrote empty stubs (`{"words":[]}`) when edge-tts stopped
    # sending WordBoundary events, and those stubs would otherwise look
    # plausibly populated to a naive `size > 0` check.
    def words_json_valid(p: Path) -> bool:
        if not p.exists() or p.stat().st_size == 0:
            return False
        try:
            return bool(json.loads(p.read_text()).get("words"))
        except Exception:
            return False

    todo: list[tuple[dict, Path, Path]] = []
    for s in sections:
        mp3 = audio_dir / f"{s['id']}.mp3"
        wj  = audio_dir / f"{s['id']}.words.json"
        if not mp3.exists() or mp3.stat().st_size == 0:
            log(f"  {Y}[skip] {s['id']}.mp3 missing — TTS first{RESET}", Y)
            continue
        if words_json_valid(wj) and not force:
            log(f"  {D}[skip] {s['id']}.words.json already aligned{RESET}", D)
            continue
        todo.append((s, mp3, wj))

    if not todo:
        log(f"{G}all sections already aligned. nothing to do.{RESET}", G)
        return 0

    log(f"{B}aligning {len(todo)} of {len(sections)} sections "
        f"using model={model_size}{RESET}")

    # Lazy import — only pay the dep cost when we actually need to align.
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        log(f"{R}faster-whisper not installed. fix: "
            f"pip install faster-whisper{RESET}", R)
        return 1

    # Load once for the whole lesson (avoids re-init per section).
    log(f"  {D}loading {model_size} (first run downloads ~150MB)...{RESET}", D)
    t_load = time.time()
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    log(f"  {D}loaded in {time.time() - t_load:.1f}s{RESET}", D)

    total_audio = 0.0
    total_elapsed = 0.0
    for s, mp3, wj in todo:
        summary = align_section(model, mp3, wj, text_hint=s["text"])
        ratio = summary["duration_s"] / summary["elapsed_s"] if summary["elapsed_s"] else 0
        log(f"  {G}[ok]{RESET} {s['id']}  "
            f"{summary['n_words']:>3} words  "
            f"audio={summary['duration_s']:.1f}s  "
            f"elapsed={summary['elapsed_s']:.1f}s  "
            f"({ratio:.1f}x realtime)")
        total_audio   += summary["duration_s"]
        total_elapsed += summary["elapsed_s"]

    log(f"{B}done.{RESET}  total audio={total_audio:.1f}s  "
        f"total elapsed={total_elapsed:.1f}s  "
        f"({total_audio/total_elapsed:.1f}x realtime)" if total_elapsed else "")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("lesson_dir", type=Path,
                    help="lesson folder containing script.json + audio/")
    ap.add_argument("--model", default="base.en",
                    choices=["tiny.en", "base.en", "small.en"],
                    help="faster-whisper model size (default: base.en)")
    ap.add_argument("--force", action="store_true",
                    help="re-align even sections whose words.json already exists")
    args = ap.parse_args()
    sys.exit(align_lesson(args.lesson_dir, model_size=args.model, force=args.force))


if __name__ == "__main__":
    main()
