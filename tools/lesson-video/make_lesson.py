#!/usr/bin/env python3
"""One-shot pipeline: synth Aria narration with edge-tts, then merge to MP4.

Run this on YOUR own Mac (Bing speech endpoint must be reachable):

    pip install edge-tts imageio-ffmpeg
    python3 tools/lesson-video/make_lesson.py teaching-videos/<lesson-folder>/

That's it — produces `<lesson-folder>.mp4` next to the script.json.

What it does
------------
1. Reads `script.json` for voice, rate, and section list.
2. Synthesizes one MP3 per section via edge-tts (skips sections whose MP3
   already exists — re-runs are cheap; delete an MP3 to regenerate it).
3. Calls merge_lesson.py to convert MP3→WAV, build the SRT, mix in
   intro/outro music, and render the final MP4 (1920x1080 H.264 + AAC
   + burned-in subtitles).

Why this exists
---------------
Claude's sandbox can't reach the Microsoft TTS endpoint, so the synth step
has to happen on a machine with internet access — that's your Mac. The merge
step COULD run in the sandbox too, but doing both here means you get the
finished MP4 in one command without round-tripping through chat.

For partial work (e.g. "I tweaked slides, just re-stitch") use merge_lesson.py
directly; that one Claude can run from sandbox.
"""
from __future__ import annotations
import argparse, asyncio, json, os, subprocess, sys
from pathlib import Path

DEFAULT_VOICE = "en-US-AriaNeural"
DEFAULT_RATE  = "-3%"

def need(pkg: str, import_name: str | None = None):
    try:
        __import__(import_name or pkg.replace("-", "_"))
    except ImportError:
        sys.exit(f"error: missing dependency '{pkg}'.\n  fix:  pip install {pkg}")

def _is_silence_section(section: dict) -> bool:
    """Sections whose id ends with `_silence` (or whose text is empty) hold
    an answer-reveal slide during which the student looks at the question
    without narration. Edge-TTS can't synthesize empty text — it produces a
    0-byte MP3 that crashes ffmpeg in merge_lesson.py. We detect these and
    generate a fixed-duration silent WAV directly instead.
    """
    if section["id"].endswith("_silence"):
        return True
    if not section.get("text", "").strip():
        return True
    return False


def _generate_silence(audio_dir: Path, section_id: str, seconds: float = 3.0):
    """Write a valid silent MP3 + WAV pair for a silence section. Uses
    imageio-ffmpeg's bundled binary so this works in the same environment
    as the rest of the pipeline."""
    import subprocess
    try:
        from imageio_ffmpeg import get_ffmpeg_exe
        ffmpeg = get_ffmpeg_exe()
    except ImportError:
        ffmpeg = "ffmpeg"
    mp3 = audio_dir / f"{section_id}.mp3"
    wav = audio_dir / f"{section_id}.wav"
    # Write silent MP3 (valid frames, decodable) — ffmpeg anullsrc + libmp3lame.
    subprocess.run(
        [ffmpeg, "-y", "-f", "lavfi", "-i",
         f"anullsrc=cl=mono:r=22050", "-t", str(seconds),
         "-c:a", "libmp3lame", "-b:a", "64k", str(mp3),
         "-loglevel", "error"],
        check=True, stdin=subprocess.DEVNULL,
    )
    # Pre-write the matching WAV too so merge_lesson skips its own conversion.
    subprocess.run(
        [ffmpeg, "-y", "-f", "lavfi", "-i",
         f"anullsrc=cl=mono:r=22050", "-t", str(seconds),
         "-c:a", "pcm_s16le", str(wav),
         "-loglevel", "error"],
        check=True, stdin=subprocess.DEVNULL,
    )


async def synth(folder: Path) -> int:
    """Generate one MP3 per section that doesn't already have one. Returns
    the number of NEW MP3s written.

    Word-level subtitle timing is handled in a SEPARATE pass via
    `align_audio.py` (faster-whisper) — see `align()` below. We can't get
    timestamps from edge-tts anymore because Microsoft's upstream service
    stopped sending WordBoundary events in 2024.

    Sections whose id ends with `_silence` (or have empty text) get a
    3-second silent WAV instead of a TTS call — edge-tts can't handle
    empty text and produces a 0-byte MP3 that crashes downstream ffmpeg.

    Idempotence: re-running only re-synthesizes MP3s that don't exist OR
    that exist but are 0 bytes (a clear failure marker from a prior crash).
    """
    import edge_tts
    script = json.loads((folder / "script.json").read_text())
    voice = script.get("voice", DEFAULT_VOICE)
    rate  = script.get("voice_rate", DEFAULT_RATE)
    audio = folder / "audio"
    audio.mkdir(exist_ok=True)
    print(f"[synth] voice={voice}  rate={rate}  sections={len(script['sections'])}")

    fresh = 0
    for s in script["sections"]:
        mp3 = audio / f"{s['id']}.mp3"
        wav = audio / f"{s['id']}.wav"
        # Clean up stale 0-byte artifacts from prior failed runs.
        if wav.exists() and wav.stat().st_size == 0:
            wav.unlink()
        if mp3.exists() and mp3.stat().st_size == 0:
            print(f"  [retry] {mp3.name}  (was 0 bytes — regenerating)")
            mp3.unlink()
        if mp3.exists() and mp3.stat().st_size > 0:
            print(f"  [skip] {mp3.name}  (exists)")
            continue

        if _is_silence_section(s):
            print(f"  [silence] {mp3.name}  (3s silent — no TTS for answer-reveal section)")
            _generate_silence(audio, s["id"])
        else:
            print(f"  [tts]  {mp3.name}")
            comm = edge_tts.Communicate(s["text"], voice, rate=rate)
            await comm.save(str(mp3))
        fresh += 1
    print(f"[synth] {fresh} new file(s); {len(script['sections']) - fresh} cached")
    return fresh


def align(folder: Path, model: str = "base.en") -> None:
    """Run faster-whisper alignment on every MP3 in audio/ that doesn't yet
    have a words.json companion. Idempotent — skips already-aligned sections.

    Logs the per-section status and a final summary. Failures here don't
    abort the whole pipeline — merge_lesson.py falls back to proportional
    timing for sections without words.json.
    """
    here = Path(__file__).resolve().parent
    cmd = [sys.executable, str(here / "align_audio.py"), str(folder),
           "--model", model]
    print(f"[align] {' '.join(cmd)}")
    r = subprocess.run(cmd, stdin=subprocess.DEVNULL)
    if r.returncode != 0:
        print(f"[align] warning: alignment exited {r.returncode}. "
              f"merge_lesson.py will fall back to proportional subtitle timing "
              f"for any unaligned sections.")

def merge(folder: Path, output: str | None) -> None:
    here = Path(__file__).resolve().parent
    cmd = [sys.executable, str(here / "merge_lesson.py"), str(folder)]
    if output:
        cmd += ["--output", output]
    print(f"[merge] {' '.join(cmd)}")
    # stdin=DEVNULL — defense in depth. merge_lesson.py's own subprocess
    # calls already pin stdin, but this protects callers who run make_lesson.py
    # from a `while read` loop without the daily_build.sh fix.
    r = subprocess.run(cmd, stdin=subprocess.DEVNULL)
    if r.returncode != 0:
        sys.exit(r.returncode)

def refuse_if_already_uploaded(folder: Path, force: bool):
    """Guard: don't waste TTS quota / disk on a lesson that's already on YouTube.

    Once `cleanup_lesson.py` runs, the folder has only script.json + build_slides.py
    + .cleaned. Re-running make_lesson here would rebuild everything from scratch
    (burning TTS, ~minutes of CPU) just to overwrite something already live.

    The `.cleaned` breadcrumb + a populated `script.json.youtube.video_id` is the
    'this lesson is done, don't touch' signal. To force rebuild (e.g. YouTube
    deleted the video and you want to re-upload), pass --force-rebuild and
    manually clear the youtube block.
    """
    if force:
        return
    cleaned = folder / ".cleaned"
    script_path = folder / "script.json"
    if not script_path.exists():
        return
    try:
        yt = (json.loads(script_path.read_text()).get("youtube") or {})
    except Exception:
        return
    video_id = yt.get("video_id")
    if cleaned.exists() and video_id:
        sys.exit(
            f"\nrefusing to rebuild: this lesson is already uploaded.\n"
            f"  video_id: {video_id}\n"
            f"  url:      {yt.get('url', '?')}\n"
            f"  .cleaned: {cleaned}\n\n"
            f"if you really want to rebuild (e.g. YouTube took the video down):\n"
            f"  1. delete {cleaned}\n"
            f"  2. remove the 'youtube' block from {script_path}\n"
            f"  3. re-run with --force-rebuild\n"
        )
    if video_id and not cleaned.exists():
        # Has a video_id but artifacts still present — probably mid-run. Allow,
        # since the user may be regenerating audio after fixing the script text.
        print(f"[warn] script.json has youtube.video_id={video_id} but no .cleaned "
              f"marker. Proceeding — re-upload will need youtube block cleared first.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder", help="lesson folder with script.json + slides/")
    ap.add_argument("--output", default=None, help="output mp4 filename")
    ap.add_argument("--no-synth", action="store_true",
                    help="skip TTS, only merge (use existing audio/*.mp3)")
    ap.add_argument("--align", action="store_true",
                    help="run whisper word-level alignment after TTS (writes "
                         "audio/*.words.json). DEFAULT OFF — we upload "
                         "transcript.txt to YouTube and let Google STT align "
                         "for closed captions, which is more accurate than any "
                         "local solution. This flag exists for the rare case "
                         "you want burned-in subs or local subtitle files.")
    ap.add_argument("--align-model", default="base.en",
                    choices=["tiny.en", "base.en", "small.en"],
                    help="faster-whisper model size if --align is set (default: base.en)")
    ap.add_argument("--force-rebuild", action="store_true",
                    help="rebuild even if the lesson is already uploaded "
                         "(.cleaned breadcrumb + youtube.video_id present)")
    args = ap.parse_args()

    folder = Path(args.folder).resolve()
    if not folder.is_dir():
        sys.exit(f"not a folder: {folder}")
    if not (folder / "script.json").exists():
        sys.exit(f"missing {folder}/script.json")

    refuse_if_already_uploaded(folder, force=args.force_rebuild)

    # 1) TTS — synthesize MP3 per section if missing.
    if not args.no_synth:
        need("edge-tts", "edge_tts")
        asyncio.run(synth(folder))

    # 2) Optional: force-alignment via faster-whisper (writes audio/*.words.json).
    # Disabled by default — YouTube does superior alignment from our plain-text
    # transcript.txt upload. Only run when --align is set (e.g. for offline
    # subtitle files or burned-in subs).
    if args.align:
        align(folder, model=args.align_model)

    # 3) Merge — slides + audio + subtitles → final MP4.
    need("imageio-ffmpeg", "imageio_ffmpeg")
    merge(folder, args.output)

if __name__ == "__main__":
    main()
