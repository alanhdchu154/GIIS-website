#!/usr/bin/env python3
"""Merge a lesson folder (script.json + slides/ + audio/) into a finished MP4.

Usage:
    python3 merge_lesson.py <lesson-folder> [--output name.mp4]

See SKILL.md in this directory for the full contract.
"""
from __future__ import annotations
import argparse, json, os, re, shutil, subprocess, sys, wave
from pathlib import Path

GAP = 0.4              # seconds of silence between sections
MAX_WORDS = 10         # subtitle chunk size
SAMPLE_RATE = 22050    # mono Hz
# We generate a styled ASS file (Advanced SubStation Alpha) and let ffmpeg
# burn it in directly. This avoids the `force_style=...` filter argument,
# whose comma parsing differs across ffmpeg 6 / 7 / 8 and is genuinely awful
# to escape correctly. With ASS the style lives in the file, not the cli.
ASS_FONTNAME    = "Helvetica"   # macOS-friendly; libass falls back if missing
ASS_FONTSIZE    = 52            # at PlayResY=1080 — readable but not overwhelming
ASS_PRIMARY     = "&H00FFFFFF"  # opaque white
ASS_BACK        = "&H80000000"  # 50%-translucent black box
ASS_BORDER_BOX  = 4             # opaque-box border style
# Match the demo MP4 (`public/demo/giis-demo.mp4`) — captions sit ~110 px
# from the bottom edge. The translucent subtitle box will cover the slide's
# decorative bottom maroon strip + "GIIS · Algebra I · Module 4" text while
# active; that's fine since the footer is purely identifying and repetitive.
ASS_MARGIN_V    = 110

def _has_libass(ffmpeg_path: str) -> bool:
    """The `subtitles` filter is provided by libass. Many Homebrew bottles ship
    ffmpeg WITHOUT --enable-libass, in which case ffmpeg can't even parse a
    filter graph that mentions `subtitles=...`. Probe by listing filters."""
    try:
        r = subprocess.run([ffmpeg_path, "-hide_banner", "-filters"],
                            capture_output=True, text=True, timeout=10)
    except Exception:
        return False
    # Filter listing rows look like:  ` T.. subtitles         V->V       ...`
    for line in r.stdout.splitlines():
        if line.split()[1:2] == ["subtitles"]:
            return True
    return False

def find_ffmpeg() -> str:
    """Return a usable ffmpeg path. Prefers a system ffmpeg if it has libass;
    otherwise falls back to the static binary bundled by the `imageio-ffmpeg`
    PyPI package (which always includes libass). Means this script works on a
    Mac whether or not you ran `brew install ffmpeg --with-libass`."""
    sys_ffmpeg = shutil.which("ffmpeg")
    if sys_ffmpeg and _has_libass(sys_ffmpeg):
        return sys_ffmpeg
    try:
        import imageio_ffmpeg
        bundled = imageio_ffmpeg.get_ffmpeg_exe()
        if _has_libass(bundled):
            return bundled
    except ImportError:
        pass
    if sys_ffmpeg:
        sys.exit(
            f"error: ffmpeg at {sys_ffmpeg} was built without libass, so the\n"
            "subtitles filter is unavailable. Install the bundled fallback:\n"
            "  pip install imageio-ffmpeg\n"
            "(the wheel ships a libass-enabled static binary)."
        )
    sys.exit(
        "error: ffmpeg not found.\n"
        "  fix:  pip install imageio-ffmpeg"
    )

FFMPEG = None  # populated in main()

def run(cmd, **kw):
    # transparently rewrite the command name to the located ffmpeg path
    if cmd and cmd[0] == "ffmpeg":
        cmd = [FFMPEG, *cmd[1:]]
    # IMPORTANT: pin stdin to /dev/null. ffmpeg reads stdin for interactive
    # control (press 'q' to quit) and would otherwise inherit the parent
    # process's stdin. When this script is called from a bash `while read`
    # loop (e.g. daily_build.sh), ffmpeg silently consumes the loop's queue
    # file, causing only the FIRST lesson to ever be built per run.
    kw.setdefault("stdin", subprocess.DEVNULL)
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        sys.exit(f"command failed: {' '.join(cmd)}\n{r.stderr}")
    return r

def wav_duration(p: Path) -> float:
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()

def ensure_wavs(audio_dir: Path, section_ids: list[str]) -> dict[str, Path]:
    """For every section, return path to a non-empty mono 22050 WAV.

    Hard rule: if an MP3 exists, the WAV is ALWAYS re-derived from it. mtime
    comparisons aren't reliable here — files get touched, copied, or
    reordered, and a stale espeak placeholder could keep overriding a fresh
    edge-tts render. Re-converting takes ~50 ms per file and removes all doubt.

    Only when no MP3 is present do we accept whatever WAV is on disk."""
    out = {}
    for sid in section_ids:
        wav = audio_dir / f"{sid}.wav"
        mp3 = audio_dir / f"{sid}.mp3"
        # Drop empty WAVs (typical residue from a previous failed run).
        if wav.exists() and wav.stat().st_size == 0:
            try: wav.unlink()
            except OSError: pass
        if mp3.exists():
            # MP3 is the authoritative source — always re-convert.
            run(["ffmpeg", "-y", "-i", str(mp3), "-ar", str(SAMPLE_RATE),
                 "-ac", "1", str(wav), "-loglevel", "error"])
        elif not wav.exists():
            sys.exit(f"missing audio for section '{sid}': expected {mp3} or {wav}")
        out[sid] = wav
    return out

def chunks(text: str, max_words: int = MAX_WORDS) -> list[str]:
    sents = re.split(r"(?<=[.!?])\s+", text.strip())
    out: list[str] = []
    for s in sents:
        words = s.split()
        if len(words) <= max_words:
            out.append(s)
        else:
            for i in range(0, len(words), max_words):
                out.append(" ".join(words[i:i + max_words]))
    return [c for c in out if c]

def fmt_srt_time(t: float) -> str:
    """SRT timestamp:  HH:MM:SS,mmm"""
    h = int(t // 3600); m = int((t % 3600) // 60)
    s_int = int(t % 60); ms = int(round((t - int(t)) * 1000))
    if ms == 1000:
        s_int += 1; ms = 0
    return f"{h:02d}:{m:02d}:{s_int:02d},{ms:03d}"

def fmt_ass_time(t: float) -> str:
    """ASS timestamp:  H:MM:SS.cs (centiseconds)."""
    h = int(t // 3600); m = int((t % 3600) // 60)
    s_int = int(t % 60); cs = int(round((t - int(t)) * 100))
    if cs == 100:
        s_int += 1; cs = 0
    return f"{h}:{m:02d}:{s_int:02d}.{cs:02d}"

def _ass_header() -> str:
    return (
        "[Script Info]\n"
        "ScriptType: v4.00+\n"
        "PlayResX: 1920\n"
        "PlayResY: 1080\n"
        "WrapStyle: 0\n"
        "ScaledBorderAndShadow: yes\n\n"
        "[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, "
        "OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, "
        "ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"Style: Default,{ASS_FONTNAME},{ASS_FONTSIZE},{ASS_PRIMARY},"
        "&H000000FF,&H00000000,"
        f"{ASS_BACK},0,0,0,0,100,100,0,0,{ASS_BORDER_BOX},2,0,2,40,40,"
        f"{ASS_MARGIN_V},1\n\n"
        "[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, "
        "Effect, Text\n"
    )

def _load_word_timings(audio_dir: Path, section_id: str) -> list[dict] | None:
    """Load <section>.words.json if present (written by make_lesson.py from
    edge-tts WordBoundary events). Returns the words list or None.

    Format: {"words": [{"text": str, "offset_s": float, "duration_s": float}, ...]}
    Offsets are relative to the section's audio start (i.e. section-local).
    """
    p = audio_dir / f"{section_id}.words.json"
    if not p.exists() or p.stat().st_size == 0:
        return None
    try:
        return json.loads(p.read_text()).get("words") or None
    except Exception:
        return None


def _chunks_from_word_timings(text: str, words: list[dict],
                              max_words: int = MAX_WORDS) -> list[tuple[str, float, float]]:
    """Group word-timed segments into subtitle chunks aligned to actual audio.

    Returns list of (chunk_text, start_offset_s, end_offset_s) where offsets are
    section-local. The chunk_text is reconstructed from the source `text` so
    punctuation / capitalization survive (WordBoundary events strip those).

    Strategy: split the source text into chunks the same way as the legacy
    `chunks()` function (sentence-aware, ≤max_words). Walk through the
    word-timing list in parallel, accumulating each chunk's start (first word
    offset) and end (last word offset+duration). If word counts mismatch
    (edge-tts occasionally emits boundary events for contractions or hyphenated
    compounds slightly differently than text.split() expects), we fall back to
    proportional within the affected chunk — better than crashing.
    """
    text_chunks = chunks(text, max_words)
    if not words:
        # Caller should have checked, but be defensive.
        return []

    # Pointer into the words list as we consume each chunk.
    wi = 0
    n_words = len(words)
    out: list[tuple[str, float, float]] = []
    for c in text_chunks:
        n_in_chunk = len(c.split())
        if wi >= n_words:
            # Ran out of word events — emit zero-length cue at last known time.
            last = (words[-1]["offset_s"] + words[-1]["duration_s"]) if words else 0.0
            out.append((c, last, last))
            continue
        # Take up to n_in_chunk words, but never exceed the events we have.
        take = min(n_in_chunk, n_words - wi)
        slice_ = words[wi:wi + take]
        start = slice_[0]["offset_s"]
        end   = slice_[-1]["offset_s"] + slice_[-1]["duration_s"]
        out.append((c, start, end))
        wi += take
    return out


def build_subtitles(folder: Path, sections: list[dict], wavs: dict[str, Path],
                    intro_offset: float) -> tuple[Path, Path, list[dict]]:
    """Generate BOTH subtitles.srt (clean, for YouTube upload) and
    subtitles.ass (styled, for ffmpeg burn-in). Same cues, different formats.

    Per-section, prefers word-level timestamps from edge-tts (audio/<id>.words.json)
    when available. Falls back to proportional-by-word-count for legacy sections
    where TTS predates the word-boundary capture.
    """
    audio_dir = folder / "audio"
    cur = intro_offset
    idx = 1
    section_starts: list[dict] = []
    srt_lines: list[str] = []
    ass_events: list[str] = []
    aligned_count = 0
    fallback_count = 0
    for s in sections:
        dur = wav_duration(wavs[s["id"]])
        section_starts.append({"id": s["id"], "start": cur, "duration": dur})

        words = _load_word_timings(audio_dir, s["id"])
        if words:
            # Word-level alignment — sample-accurate, no drift.
            chunk_cues = _chunks_from_word_timings(s["text"], words)
            for c, off_start, off_end in chunk_cues:
                t = cur + off_start
                t_end = cur + off_end
                # Guard: never let a cue extend past the section's audio.
                if t_end > cur + dur: t_end = cur + dur
                srt_lines.append(
                    f"{idx}\n{fmt_srt_time(t)} --> {fmt_srt_time(t_end)}\n{c}\n"
                )
                ass_events.append(
                    f"Dialogue: 0,{fmt_ass_time(t)},{fmt_ass_time(t_end)},"
                    f"Default,,0,0,0,,{c}"
                )
                idx += 1
            aligned_count += 1
        else:
            # Legacy fallback: proportional-by-word-count within the section.
            # This drifts a bit (especially for voices with long sentence pauses)
            # but matches the pre-2026-05-11 behavior.
            cs = chunks(s["text"])
            weights = [max(1, len(c.split())) for c in cs]
            total_w = sum(weights)
            t = cur
            for c, w in zip(cs, weights):
                d = dur * w / total_w
                srt_lines.append(
                    f"{idx}\n{fmt_srt_time(t)} --> {fmt_srt_time(t + d)}\n{c}\n"
                )
                ass_events.append(
                    f"Dialogue: 0,{fmt_ass_time(t)},{fmt_ass_time(t + d)},"
                    f"Default,,0,0,0,,{c}"
                )
                idx += 1
                t += d
            fallback_count += 1
        cur += dur + GAP

    if aligned_count or fallback_count:
        print(f"[subs] {aligned_count} section(s) word-aligned, "
              f"{fallback_count} fallback to proportional")

    srt_path = folder / "subtitles.srt"
    srt_path.write_text("\n".join(srt_lines))
    ass_path = folder / "subtitles.ass"
    ass_path.write_text(_ass_header() + "\n".join(ass_events) + "\n")
    return srt_path, ass_path, section_starts

def build_master_audio(folder: Path, sections: list[dict], wavs: dict[str, Path],
                       intro_secs: float, outro_secs: float) -> Path:
    intro_wav = folder / "intro_music.wav"
    outro_wav = folder / "outro_music.wav"
    silence = folder / "_silence.wav"
    run(["ffmpeg", "-y", "-f", "lavfi", "-i",
         f"anullsrc=cl=mono:r={SAMPLE_RATE}", "-t", str(GAP), str(silence),
         "-loglevel", "error"])

    # Build the input list and concat filter
    inputs: list[str] = []
    parts: list[str] = []
    n = 0
    if intro_secs > 0 and intro_wav.exists():
        inputs += ["-i", str(intro_wav)]
        parts.append(f"[{n}:a]")
        n += 1
    for i, s in enumerate(sections):
        inputs += ["-i", str(wavs[s["id"]])]
        parts.append(f"[{n}:a]")
        n += 1
        if i < len(sections) - 1:
            inputs += ["-i", str(silence)]
            parts.append(f"[{n}:a]")
            n += 1
    if outro_secs > 0 and outro_wav.exists():
        inputs += ["-i", str(outro_wav)]
        parts.append(f"[{n}:a]")
        n += 1

    chain = "".join(parts) + f"concat=n={len(parts)}:v=0:a=1[outa]"
    out = folder / "master_audio.wav"
    run(["ffmpeg", "-y", *inputs, "-filter_complex", chain,
         "-map", "[outa]", "-c:a", "pcm_s16le", str(out), "-loglevel", "error"])
    try:
        silence.unlink(missing_ok=True)
    except OSError:
        pass  # some mounts disallow unlink; harmless leftover
    return out

def find_slide(slides_dir: Path, section_id: str) -> Path:
    """Slides are named e.g. '08_pause1.png' for section id '08_pause1'."""
    candidate = slides_dir / f"{section_id}.png"
    if candidate.exists():
        return candidate
    # fallback: look for prefix match
    for p in slides_dir.glob(f"{section_id.split('_', 1)[0]}_*.png"):
        return p
    sys.exit(f"no slide PNG matching section id '{section_id}' under {slides_dir}")

SUB_REFRESH = 0.5  # seconds — concat each held slide in chunks this size so
                   # the subtitles filter sees fresh frames frequently and
                   # cues advance correctly within long-held slides.

def _chunked_holds(lines: list[str], png: Path, total: float):
    """Append `png` to the concat list as a sequence of SUB_REFRESH-second
    chunks summing to `total`. The last chunk takes whatever is left over."""
    if total <= 0:
        return
    remaining = total
    while remaining > SUB_REFRESH * 1.5:
        lines.append(f"file '{png}'")
        lines.append(f"duration {SUB_REFRESH:.4f}")
        remaining -= SUB_REFRESH
    lines.append(f"file '{png}'")
    lines.append(f"duration {remaining:.4f}")

def build_slides_concat(folder: Path, sections: list[dict],
                        wavs: dict[str, Path],
                        intro_secs: float, outro_secs: float) -> Path:
    """Create the ffmpeg concat demuxer file pairing each slide with a duration.

    Slides held longer than ~0.75 s are split into 0.5 s-spaced repeats of the
    same image so that the burned-in subtitle filter is invoked frequently
    enough to advance through cues that span a single visual slide.
    """
    lines: list[str] = []
    first_slide = find_slide(folder / "slides", sections[0]["id"])
    last_slide = find_slide(folder / "slides", sections[-1]["id"])

    # Intro window — title slide held during intro music
    if intro_secs > 0 and (folder / "intro_music.wav").exists():
        _chunked_holds(lines, first_slide, intro_secs)

    for i, s in enumerate(sections):
        png = find_slide(folder / "slides", s["id"])
        d = wav_duration(wavs[s["id"]])
        if i < len(sections) - 1:
            d += GAP
        _chunked_holds(lines, png, d)

    if outro_secs > 0 and (folder / "outro_music.wav").exists():
        _chunked_holds(lines, last_slide, outro_secs)

    # ffmpeg concat demuxer requires the last `file` repeated without duration
    lines.append(f"file '{last_slide}'")
    p = folder / "slides_concat.txt"
    p.write_text("\n".join(lines) + "\n")
    return p

def render_mp4(folder: Path, concat_file: Path, master_audio: Path,
               output: Path):
    """Render final MP4 from concat list + master audio. No burned-in subs —
    we upload a plain-text transcript to YouTube and let Google STT do
    forced-alignment for the closed captions track (better quality than any
    local alignment, and viewers can toggle CC on/off + auto-translate).

    `-t` to audio length cuts the tail cleanly (the PNG concat demuxer can
    over-extend the last slide). No need for the SUB_REFRESH chunking trick
    that used to drive libass cue advancement.
    """
    audio_dur = wav_duration(master_audio)
    run(["ffmpeg", "-y",
         "-f", "concat", "-safe", "0", "-i", str(concat_file.resolve()),
         "-i", str(master_audio.resolve()),
         "-c:v", "libx264", "-preset", "medium", "-crf", "22",
         "-pix_fmt", "yuv420p", "-r", "30",
         "-c:a", "aac", "-b:a", "128k",
         "-t", f"{audio_dur:.3f}",
         str(output.resolve())],
        cwd=folder)


def build_transcript(folder: Path, sections: list[dict]) -> Path:
    """Write a `transcript.txt` containing the full narration as plain text
    (one section per paragraph, blank line between). This is what upload_lesson.py
    sends to YouTube — Google's caption pipeline aligns it to the audio
    perfectly using their STT, no local alignment needed.
    """
    parts = [s["text"].strip() for s in sections if s.get("text", "").strip()]
    p = folder / "transcript.txt"
    p.write_text("\n\n".join(parts) + "\n", encoding="utf-8")
    return p

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder", help="lesson folder with script.json, slides/, audio/")
    ap.add_argument("--output", default=None, help="output mp4 filename (default: <folder-name>.mp4)")
    args = ap.parse_args()

    folder = Path(args.folder).resolve()
    if not folder.is_dir():
        sys.exit(f"not a folder: {folder}")

    global FFMPEG
    FFMPEG = find_ffmpeg()
    script_path = folder / "script.json"
    if not script_path.exists():
        sys.exit(f"missing {script_path}")
    script = json.loads(script_path.read_text())
    sections = script["sections"]
    intro_secs = script.get("intro_music_seconds", 0)
    outro_secs = script.get("outro_music_seconds", 0)

    print(f"== {script.get('course','?')} / {script.get('module','?')} ==")
    print(f"   sections: {len(sections)}, intro {intro_secs}s, outro {outro_secs}s")

    audio_dir = folder / "audio"
    if not audio_dir.is_dir():
        sys.exit(f"missing {audio_dir}")
    wavs = ensure_wavs(audio_dir, [s["id"] for s in sections])

    # Plain-text transcript for YouTube to align (no local subtitle work).
    transcript = build_transcript(folder, sections)
    print(f"[transcript] {transcript.name}  ({len(sections)} sections, "
          f"{sum(len(s['text'].split()) for s in sections)} words)")

    master = build_master_audio(folder, sections, wavs, intro_secs, outro_secs)
    concat = build_slides_concat(folder, sections, wavs, intro_secs, outro_secs)

    # default name = folder name with hyphens normalized to underscores so
    # successive runs overwrite a single canonical MP4 instead of creating dupes
    out_name = args.output or f"{folder.name.replace('-', '_')}.mp4"
    out_path = folder / out_name
    render_mp4(folder, concat, master, out_path)
    size_mb = out_path.stat().st_size / 1024 / 1024
    # Total duration
    total = intro_secs + sum(wav_duration(wavs[s["id"]]) for s in sections) + GAP*(len(sections)-1) + outro_secs
    print(f"\nDONE  {out_path}")
    print(f"      {size_mb:.1f} MB, ~{total/60:.1f} min  (no burn-in subs — YouTube CC handles it)")

if __name__ == "__main__":
    main()
