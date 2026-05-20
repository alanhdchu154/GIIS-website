#!/usr/bin/env python3
"""Regenerate the narration with the real Microsoft Aria neural voice.

Run this on YOUR own Mac (where the Bing speech endpoint is reachable):

    pip install edge-tts
    python3 synth_audio_local.py

Then ask Claude to "merge the lesson" — Claude's sandbox has ffmpeg and will
run the merge skill (tools/lesson-video) to produce the final MP4.

This script ONLY makes MP3 files. You do NOT need ffmpeg on your Mac.
"""
import asyncio, os, json
import edge_tts

# Voice + rate are read from script.json so you can tweak them per lesson.
DEFAULT_VOICE = "en-US-AriaNeural"
DEFAULT_RATE  = "-3%"
OUT = "audio"

async def main():
    os.makedirs(OUT, exist_ok=True)
    with open("script.json") as f:
        script = json.load(f)
    voice = script.get("voice", DEFAULT_VOICE)
    rate  = script.get("voice_rate", DEFAULT_RATE)
    print(f"voice: {voice}  rate: {rate}  sections: {len(script['sections'])}")
    for s in script["sections"]:
        out_mp3 = f"{OUT}/{s['id']}.mp3"
        # Stale wav (zero-byte from a failed previous run) — clean up.
        out_wav = f"{OUT}/{s['id']}.wav"
        if os.path.exists(out_wav) and os.path.getsize(out_wav) == 0:
            os.remove(out_wav)
        comm = edge_tts.Communicate(s["text"], voice, rate=rate)
        await comm.save(out_mp3)
        print(f"  {out_mp3}")
    print("\nDone. Now ask Claude to 'merge the lesson' — the merge skill will")
    print("convert MP3→WAV in its sandbox (which has ffmpeg) and produce the MP4.")

asyncio.run(main())
