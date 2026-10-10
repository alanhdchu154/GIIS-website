#!/usr/bin/env python3
"""Create and validate version-bound local audio review evidence for a lesson MP4."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
SCHEMA_VERSION = "giis.local-audio-review.v1"
RECEIPT_NAME = "_local_audio_review_v1.json"
TRANSCRIPT_NAME = "_local_audio_transcript_v1.txt"
WHISPER_JSON_NAME = "_local_audio_whisper_v1.json"
DEFAULT_MODEL = Path("/Volumes/T9-Active/Models/Whisper/ggml-small.en.bin")
THRESHOLDS = {
    "duration_delta_seconds_max": 0.30,
    "asr_leading_gap_seconds_max": 8.0,
    "asr_trailing_gap_seconds_max": 8.0,
    # whisper.cpp timestamps are segment-level and may close slightly after
    # the decoded file boundary even when the recognized words are complete.
    "asr_end_overshoot_seconds_max": 2.0,
    "word_error_rate_max": 0.20,
    "word_ratio_min": 0.85,
    "word_ratio_max": 1.15,
    "integrated_lufs_min": -30.0,
    "integrated_lufs_max": -14.0,
    "true_peak_dbfs_max": -1.0,
    # make_lesson.py intentionally renders three-second pause sections.
    # Keep a margin for codec rounding and hold only longer unexplained gaps.
    "long_silence_seconds": 3.5,
}


def sha256_file(path: Path) -> str | None:
    try:
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()
    except OSError:
        return None


def display_path(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(ROOT.resolve()))
    except ValueError:
        return str(path.resolve())


def resolve_path(path_text: str) -> Path:
    path = Path(path_text)
    return path if path.is_absolute() else ROOT / path


def atomic_write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=path.parent, prefix=f".{path.name}.", delete=False
    ) as handle:
        handle.write(content)
        temp_path = Path(handle.name)
    os.replace(temp_path, path)


def atomic_write_json(path: Path, payload: Any) -> None:
    atomic_write_text(path, json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def run_command(command: list[str], *, timeout: int = 900) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, capture_output=True, text=True, timeout=timeout, check=False)


def normalize_words(text: str) -> list[str]:
    lowered = text.lower().replace("—", " ").replace("–", " ")
    lowered = re.sub(r"\biv\b", "four", lowered)
    lowered = re.sub(r"\bq\s*(?:and|&)\s*a\b", "question and answer", lowered)
    return re.findall(r"[a-z0-9]+(?:'[a-z0-9]+)?", lowered)


def word_error_rate(reference: list[str], observed: list[str]) -> float:
    if not reference:
        return 0.0 if not observed else 1.0
    previous = list(range(len(observed) + 1))
    for i, ref_word in enumerate(reference, 1):
        current = [i]
        for j, observed_word in enumerate(observed, 1):
            current.append(min(
                current[-1] + 1,
                previous[j] + 1,
                previous[j - 1] + (ref_word != observed_word),
            ))
        previous = current
    return previous[-1] / len(reference)


def parse_timestamp(value: str) -> float:
    match = re.fullmatch(r"(\d+):(\d+):(\d+)[,.](\d+)", str(value).strip())
    if not match:
        raise ValueError(f"invalid timestamp: {value}")
    hours, minutes, seconds, millis = (int(item) for item in match.groups())
    return hours * 3600 + minutes * 60 + seconds + millis / (10 ** len(match.group(4)))


def parse_whisper_payload(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict) or not isinstance(payload.get("transcription"), list):
        raise ValueError("Whisper JSON lacks transcription[]")
    segments: list[dict[str, Any]] = []
    for index, item in enumerate(payload["transcription"]):
        if not isinstance(item, dict):
            raise ValueError(f"Whisper segment {index} is not an object")
        timestamps = item.get("timestamps") or {}
        offsets = item.get("offsets") or {}
        text = str(item.get("text") or "").strip()
        if not text:
            continue
        try:
            start = float(offsets.get("from")) / 1000.0
            end = float(offsets.get("to")) / 1000.0
        except (TypeError, ValueError):
            start = parse_timestamp(str(timestamps.get("from") or ""))
            end = parse_timestamp(str(timestamps.get("to") or ""))
        if not math.isfinite(start) or not math.isfinite(end) or start < 0 or end <= start or (segments and start < segments[-1]["start"]):
            raise ValueError(f"Whisper segment {index} has invalid offsets")
        segments.append({"start": round(start, 3), "end": round(end, 3), "text": text})
    if not segments:
        raise ValueError("Whisper transcription contains no speech segments")
    return {
        "segments": segments,
        "text": " ".join(item["text"] for item in segments),
        "first_speech_seconds": segments[0]["start"],
        "last_speech_seconds": segments[-1]["end"],
    }


def parse_ffprobe(payload: str) -> dict[str, Any]:
    data = json.loads(payload)
    streams = data.get("streams") or []
    audio_streams = [item for item in streams if item.get("codec_type") == "audio"]
    if len(audio_streams) != 1:
        raise ValueError(f"expected exactly one audio stream, found {len(audio_streams)}")
    duration = float((data.get("format") or {}).get("duration"))
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError("media duration is not positive")
    stream = audio_streams[0]
    return {
        "duration_seconds": duration,
        "codec": str(stream.get("codec_name") or ""),
        "sample_rate": int(stream.get("sample_rate") or 0),
        "channels": int(stream.get("channels") or 0),
    }


def parse_ebur128(output: str) -> dict[str, float]:
    summary = output.rsplit("Summary:", 1)[-1]
    loudness = re.search(r"Integrated loudness:\s*\n\s*I:\s*(-?\d+(?:\.\d+)?)\s*LUFS", summary)
    peak = re.search(r"True peak:\s*\n\s*Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS", summary)
    if not loudness or not peak:
        raise ValueError("ffmpeg ebur128 summary is incomplete")
    return {"integrated_lufs": float(loudness.group(1)), "true_peak_dbfs": float(peak.group(1))}


def parse_silences(output: str, duration: float) -> list[dict[str, float]]:
    events: list[dict[str, float]] = []
    active_start: float | None = None
    for line in output.splitlines():
        start_match = re.search(r"silence_start:\s*(-?\d+(?:\.\d+)?)", line)
        if start_match:
            active_start = max(0.0, float(start_match.group(1)))
        end_match = re.search(
            r"silence_end:\s*(-?\d+(?:\.\d+)?)\s*\|\s*silence_duration:\s*(-?\d+(?:\.\d+)?)",
            line,
        )
        if end_match:
            end = min(duration, float(end_match.group(1)))
            silence_duration = float(end_match.group(2))
            start = active_start if active_start is not None else max(0.0, end - silence_duration)
            events.append({"start": round(start, 3), "end": round(end, 3), "duration": round(silence_duration, 3)})
            active_start = None
    if active_start is not None and duration > active_start:
        events.append({"start": round(active_start, 3), "end": round(duration, 3), "duration": round(duration - active_start, 3)})
    return events


def reprobe_media(mp4: Path) -> dict[str, Any]:
    """Re-measure release-critical audio facts from the exact bound MP4."""
    ffprobe = shutil.which("ffprobe")
    ffmpeg = shutil.which("ffmpeg")
    if not ffprobe or not ffmpeg:
        raise RuntimeError("ffmpeg and ffprobe are required to validate audio evidence")
    probe = run_command([
        ffprobe, "-v", "error", "-show_entries",
        "format=duration:stream=codec_type,codec_name,sample_rate,channels",
        "-of", "json", str(mp4),
    ], timeout=60)
    if probe.returncode != 0:
        raise RuntimeError("bound MP4 ffprobe failed")
    info = parse_ffprobe(probe.stdout)
    decode = run_command([
        ffmpeg, "-v", "error", "-i", str(mp4), "-f", "null", "-",
    ], timeout=900)
    if decode.returncode != 0:
        raise RuntimeError("bound MP4 full decode failed")
    loudness = run_command([
        ffmpeg, "-hide_banner", "-nostats", "-i", str(mp4), "-map", "0:a:0",
        "-af", "ebur128=peak=true", "-f", "null", "-",
    ], timeout=300)
    if loudness.returncode != 0:
        raise RuntimeError("bound MP4 loudness analysis failed")
    audio_metrics = parse_ebur128(loudness.stderr + "\n" + loudness.stdout)
    silence = run_command([
        ffmpeg, "-hide_banner", "-nostats", "-i", str(mp4), "-map", "0:a:0",
        "-af", f"silencedetect=noise=-50dB:d={THRESHOLDS['long_silence_seconds']}",
        "-f", "null", "-",
    ], timeout=300)
    if silence.returncode != 0:
        raise RuntimeError("bound MP4 silence analysis failed")
    return {
        "mp4": info,
        **audio_metrics,
        "long_silences": parse_silences(
            silence.stderr + "\n" + silence.stdout, info["duration_seconds"],
        ),
        "full_decode_pass": True,
    }


def validate_reprobed_media(
    mp4: Path, payload: dict[str, Any], errors: list[str],
) -> None:
    try:
        observed = reprobe_media(mp4)
    except Exception as exc:
        errors.append(f"local audio MP4 re-probe failed: {exc}")
        return
    media = payload.get("media") or {}
    recorded = media.get("mp4") if isinstance(media, dict) else None
    metrics = payload.get("metrics") or {}
    if not isinstance(recorded, dict) or not isinstance(metrics, dict):
        return
    observed_info = observed["mp4"]
    scalar_fields = ("codec", "sample_rate", "channels")
    if any(recorded.get(key) != observed_info.get(key) for key in scalar_fields):
        errors.append("local audio receipt MP4 stream facts disagree with current re-probe")
    try:
        if not math.isclose(
            float(recorded.get("duration_seconds")),
            float(observed_info["duration_seconds"]), abs_tol=0.002,
        ):
            errors.append("local audio receipt MP4 duration disagrees with current re-probe")
        for key in ("integrated_lufs", "true_peak_dbfs"):
            if not math.isclose(float(metrics.get(key)), float(observed[key]), abs_tol=0.05):
                errors.append(f"local audio receipt {key} disagrees with current re-probe")
    except (TypeError, ValueError):
        errors.append("local audio receipt re-probe comparison is invalid")
    if metrics.get("long_silences") != observed["long_silences"]:
        errors.append("local audio receipt silence evidence disagrees with current re-probe")


def evaluate_metrics(
    *, mp4_duration: float, wav_duration: float, transcription: dict[str, Any],
    reference_text: str, audio_metrics: dict[str, float], silences: list[dict[str, float]],
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    reference_words = normalize_words(reference_text)
    observed_words = normalize_words(transcription["text"])
    wer = word_error_rate(reference_words, observed_words)
    ratio = len(observed_words) / len(reference_words) if reference_words else 0.0
    leading_gap = float(transcription["first_speech_seconds"])
    last_speech = float(transcription["last_speech_seconds"])
    trailing_gap = max(0.0, mp4_duration - last_speech)
    end_overshoot = max(0.0, last_speech - mp4_duration)
    duration_delta = abs(mp4_duration - wav_duration)
    findings: list[dict[str, Any]] = []

    def hold(code: str, description: str, *, timestamp: float | None = None) -> None:
        finding: dict[str, Any] = {"code": code, "description": description}
        if timestamp is not None:
            finding["timestamp_seconds"] = round(timestamp, 3)
        findings.append(finding)

    if duration_delta > THRESHOLDS["duration_delta_seconds_max"]:
        hold("AUDIO_DURATION_MISMATCH", f"Extracted WAV differs from MP4 by {duration_delta:.3f}s")
    if leading_gap > THRESHOLDS["asr_leading_gap_seconds_max"]:
        hold("ASR_LATE_START", f"First recognized speech begins at {leading_gap:.3f}s", timestamp=leading_gap)
    if trailing_gap > THRESHOLDS["asr_trailing_gap_seconds_max"]:
        hold("ASR_EARLY_END", f"Recognized speech ends {trailing_gap:.3f}s before media end", timestamp=transcription["last_speech_seconds"])
    if end_overshoot > THRESHOLDS["asr_end_overshoot_seconds_max"]:
        hold("ASR_END_OVERSHOOT", f"ASR segment end extends {end_overshoot:.3f}s beyond media end", timestamp=mp4_duration)
    if wer > THRESHOLDS["word_error_rate_max"]:
        hold("ASR_ALIGNMENT_ERROR", f"Normalized word error rate {wer:.4f} exceeds threshold")
    if not THRESHOLDS["word_ratio_min"] <= ratio <= THRESHOLDS["word_ratio_max"]:
        hold("ASR_WORD_RATIO", f"Observed/reference word ratio {ratio:.4f} is outside threshold")
    lufs = audio_metrics["integrated_lufs"]
    if not THRESHOLDS["integrated_lufs_min"] <= lufs <= THRESHOLDS["integrated_lufs_max"]:
        hold("LOUDNESS_OUT_OF_RANGE", f"Integrated loudness {lufs:.1f} LUFS is outside threshold")
    peak = audio_metrics["true_peak_dbfs"]
    if peak > THRESHOLDS["true_peak_dbfs_max"]:
        hold("CLIPPING_RISK", f"True peak {peak:.1f} dBFS exceeds safe threshold")
    for silence in silences:
        if silence["duration"] >= THRESHOLDS["long_silence_seconds"]:
            hold(
                "LONG_SILENCE",
                f"Detected {silence['duration']:.3f}s of silence",
                timestamp=silence["start"],
            )

    metrics = {
        "mp4_duration_seconds": round(mp4_duration, 3),
        "wav_duration_seconds": round(wav_duration, 3),
        "duration_delta_seconds": round(duration_delta, 3),
        "asr_segment_count": len(transcription["segments"]),
        "first_speech_seconds": round(leading_gap, 3),
        "last_speech_seconds": round(float(transcription["last_speech_seconds"]), 3),
        "trailing_gap_seconds": round(trailing_gap, 3),
        "asr_end_overshoot_seconds": round(end_overshoot, 3),
        "reference_word_count": len(reference_words),
        "observed_word_count": len(observed_words),
        "word_error_rate": round(wer, 6),
        "word_ratio": round(ratio, 6),
        "integrated_lufs": lufs,
        "true_peak_dbfs": peak,
        "long_silences": silences,
    }
    return metrics, findings


def executable_binding(name: str) -> tuple[Path, str]:
    found = shutil.which(name)
    if not found:
        raise FileNotFoundError(f"required executable not found: {name}")
    path = Path(found).resolve()
    version_result = run_command([str(path), "--version"], timeout=90)
    if version_result.returncode != 0:
        raise RuntimeError(f"cannot read version for {name}")
    version = (version_result.stdout + "\n" + version_result.stderr).strip()
    match = re.search(r"whisper\.cpp version:\s*([^\s]+)", version)
    return path, match.group(1) if match else version.splitlines()[-1]


def review_script_sha(path: Path) -> str | None:
    try:
        script = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return sha256_file(path)
    if not isinstance(script, dict):
        return sha256_file(path)
    script = dict(script)
    script.pop("youtube", None)
    payload = json.dumps(script, indent=2, ensure_ascii=False).encode("utf-8") + b"\n"
    return hashlib.sha256(payload).hexdigest()


def _binding(path: Path, *, hash_mode: str = "file") -> dict[str, str]:
    digest = review_script_sha(path) if hash_mode == "review_script" else sha256_file(path)
    binding = {"path": display_path(path), "sha256": digest or ""}
    if hash_mode != "file":
        binding["hash_mode"] = hash_mode
    return binding


def validate_analysis(payload: dict[str, Any], bindings: dict[str, Any], errors: list[str]) -> None:
    """Validate complete measured coverage and rederive ASR/alignment evidence."""
    engine = payload.get("engine")
    if (not isinstance(engine, dict) or engine.get("name") != "whisper.cpp"
            or not isinstance(engine.get("version"), str) or not engine["version"].strip()
            or engine.get("language") != "en" or engine.get("full_file") is not True):
        errors.append("local audio engine identity or full-file coverage is invalid")
    thresholds = payload.get("thresholds")
    def finite(value: Any) -> bool:
        return type(value) in (int, float) and math.isfinite(value)
    if (not isinstance(thresholds, dict) or thresholds != THRESHOLDS
            or not all(finite(value) for value in thresholds.values())):
        errors.append("local audio thresholds do not match current policy")
    media = payload.get("media")
    if not isinstance(media, dict) or media.get("full_decode_pass") is not True:
        errors.append("local audio full decode evidence is missing")
        return
    for name in ("mp4", "extracted_wav"):
        info = media.get(name)
        if (not isinstance(info, dict) or not finite(info.get("duration_seconds"))
                or info["duration_seconds"] <= 0 or not isinstance(info.get("codec"), str)
                or not info["codec"] or type(info.get("sample_rate")) is not int
                or info["sample_rate"] <= 0 or type(info.get("channels")) is not int or info["channels"] <= 0):
            errors.append(f"local audio media evidence is incomplete: {name}")
            return
    wav = media["extracted_wav"]
    if wav["codec"] != "pcm_s16le" or wav["sample_rate"] != 16000 or wav["channels"] != 1:
        errors.append("local audio extracted WAV does not match the ASR input format")
    metrics = payload.get("metrics")
    numeric = {
        "mp4_duration_seconds", "wav_duration_seconds", "duration_delta_seconds",
        "asr_segment_count", "first_speech_seconds", "last_speech_seconds", "trailing_gap_seconds",
        "asr_end_overshoot_seconds",
        "reference_word_count", "observed_word_count", "word_error_rate", "word_ratio",
        "integrated_lufs", "true_peak_dbfs",
    }
    if not isinstance(metrics, dict) or set(metrics) != numeric | {"long_silences"}:
        errors.append("local audio metrics coverage is incomplete")
        return
    if not all(finite(metrics[key]) for key in numeric):
        errors.append("local audio metrics must be finite numbers")
        return
    for key in ("asr_segment_count", "reference_word_count", "observed_word_count"):
        if type(metrics[key]) is not int or metrics[key] <= 0:
            errors.append(f"local audio count must be a positive integer: {key}")
    duration = media["mp4"]["duration_seconds"]
    silences = metrics["long_silences"]
    if not isinstance(silences, list):
        errors.append("local audio silence coverage must be a list")
        return
    for item in silences:
        if (not isinstance(item, dict) or set(item) != {"start", "end", "duration"}
                or not all(finite(value) for value in item.values())
                or not 0 <= item["start"] < item["end"] <= duration + 0.001
                or not math.isclose(item["end"] - item["start"], item["duration"], abs_tol=0.002)):
            errors.append("local audio silence metric is invalid")
            return
    try:
        def bound_text(name: str) -> str:
            return resolve_path(bindings[name]["path"]).read_text(encoding="utf-8")
        transcription = parse_whisper_payload(json.loads(bound_text("whisper_json")))
        if normalize_words(bound_text("asr_transcript")) != normalize_words(transcription["text"]):
            errors.append("local audio ASR text and JSON disagree")
        expected, findings = evaluate_metrics(
            mp4_duration=duration, wav_duration=wav["duration_seconds"], transcription=transcription,
            reference_text=bound_text("reference_transcript"),
            audio_metrics={key: metrics[key] for key in ("integrated_lufs", "true_peak_dbfs")},
            silences=silences,
        )
        if metrics != expected:
            errors.append("local audio metrics disagree with bound ASR/media evidence")
        if payload.get("status") == "PASS" and findings:
            errors.append("PASS local audio metrics violate policy thresholds")
    except (KeyError, TypeError, ValueError, OSError):
        errors.append("local audio bound ASR evidence cannot be validated")


def validate_local_audio_review(
    folder: Path,
    *,
    expected_mp4: Path | None = None,
    allowed_review_script_sha: str | None = None,
) -> dict[str, Any]:
    folder = folder.resolve()
    receipt_path = folder / RECEIPT_NAME
    try:
        payload = json.loads(receipt_path.read_text(encoding="utf-8"))
    except Exception:
        return {"present": receipt_path.exists(), "valid": False, "status": "HOLD", "errors": ["missing or invalid local audio receipt"]}
    errors: list[str] = []
    if not isinstance(payload, dict):
        return {"present": True, "valid": False, "status": "HOLD", "errors": ["local audio receipt must be an object"]}
    if payload.get("schema_version") != SCHEMA_VERSION:
        errors.append("unsupported local audio receipt schema_version")
    if payload.get("status") not in ("PASS", "HOLD"):
        errors.append("local audio receipt status must be PASS or HOLD")
    bindings = payload.get("bindings")
    required = {"mp4", "script", "reference_transcript", "asr_transcript", "whisper_json", "whisper_model", "whisper_executable"}
    if not isinstance(bindings, dict) or set(bindings) != required:
        errors.append("local audio receipt has an invalid binding set")
        bindings = {}
    for name in required:
        binding = bindings.get(name) if isinstance(bindings, dict) else None
        if not isinstance(binding, dict):
            errors.append(f"missing local audio binding: {name}")
            continue
        path = resolve_path(str(binding.get("path") or ""))
        hash_mode = binding.get("hash_mode", "file")
        if hash_mode not in ("file", "review_script") or (hash_mode == "review_script" and name != "script"):
            errors.append(f"unsupported local audio binding hash mode: {name}")
            continue
        current_sha = review_script_sha(path) if hash_mode == "review_script" else sha256_file(path)
        legacy_publication_metadata_only = False
        if name == "script" and hash_mode == "file" and current_sha != binding.get("sha256") and allowed_review_script_sha:
            try:
                current_script = json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                current_script = None
            youtube = current_script.get("youtube") if isinstance(current_script, dict) else None
            legacy_publication_metadata_only = (
                isinstance(youtube, dict)
                and bool(youtube.get("video_id"))
                and review_script_sha(path) == allowed_review_script_sha
            )
        if (not current_sha or current_sha != binding.get("sha256")) and not legacy_publication_metadata_only:
            errors.append(f"local audio bound artifact changed or is missing: {name}")
    validate_analysis(payload, bindings, errors)
    mp4_binding = bindings.get("mp4") if isinstance(bindings.get("mp4"), dict) else {}
    candidate = resolve_path(str((mp4_binding or {}).get("path") or ""))
    if candidate.is_file():
        validate_reprobed_media(candidate, payload, errors)
    if expected_mp4 is not None and candidate.resolve() != expected_mp4.resolve():
        errors.append("local audio receipt MP4 does not match expected candidate")
    if folder not in candidate.resolve().parents:
        errors.append("local audio receipt MP4 is outside lesson folder")
    findings = payload.get("findings")
    if not isinstance(findings, list):
        errors.append("local audio findings must be a list")
    if payload.get("status") == "PASS" and findings:
        errors.append("PASS local audio receipt contains findings")
    if payload.get("status") == "PASS" and payload.get("thresholds") != THRESHOLDS:
        errors.append("PASS local audio receipt thresholds do not match current policy")
    return {
        "present": True,
        "valid": not errors,
        "status": payload.get("status") if not errors else "HOLD",
        "errors": errors,
        "candidate_mp4": display_path(candidate) if candidate else None,
        "receipt_sha256": sha256_file(receipt_path),
        "model_sha256": (bindings["whisper_model"].get("sha256") if isinstance(bindings.get("whisper_model"), dict) else None),
        "metrics": payload.get("metrics") or {},
        "limitations": payload.get("limitations"),
    }


def review_audio(
    folder: Path, mp4: Path, model: Path, *, whisper_cli: str, ffmpeg: str, ffprobe: str,
) -> dict[str, Any]:
    folder = folder.resolve()
    mp4 = mp4.resolve()
    model = model.resolve()
    if folder not in mp4.parents or not mp4.is_file() or mp4.suffix.lower() != ".mp4":
        raise ValueError("selected MP4 must be a readable .mp4 inside the lesson folder")
    for required in (folder / "script.json", folder / "transcript.txt", model):
        if not required.is_file():
            raise FileNotFoundError(f"required audio-review artifact missing: {required}")
    whisper_path, whisper_version = executable_binding(whisper_cli)
    ffmpeg_path = shutil.which(ffmpeg)
    ffprobe_path = shutil.which(ffprobe)
    if not ffmpeg_path or not ffprobe_path:
        raise FileNotFoundError("ffmpeg and ffprobe are required")

    probe = run_command([
        ffprobe_path, "-v", "error", "-show_entries",
        "format=duration:stream=codec_type,codec_name,sample_rate,channels", "-of", "json", str(mp4),
    ], timeout=60)
    if probe.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {probe.stderr.strip()}")
    mp4_info = parse_ffprobe(probe.stdout)
    decode = run_command([ffmpeg_path, "-v", "error", "-i", str(mp4), "-f", "null", "-"], timeout=900)
    if decode.returncode != 0:
        raise RuntimeError(f"full MP4 decode failed: {decode.stderr.strip()}")

    with tempfile.TemporaryDirectory(prefix="giis-local-audio-") as temp_dir_text:
        temp_dir = Path(temp_dir_text)
        wav = temp_dir / "complete.wav"
        extract = run_command([
            ffmpeg_path, "-v", "error", "-y", "-i", str(mp4), "-vn", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", str(wav),
        ], timeout=300)
        if extract.returncode != 0 or not wav.is_file():
            raise RuntimeError(f"complete audio extraction failed: {extract.stderr.strip()}")
        wav_probe = run_command([
            ffprobe_path, "-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,sample_rate,channels", "-of", "json", str(wav),
        ], timeout=60)
        if wav_probe.returncode != 0:
            raise RuntimeError("extracted WAV ffprobe failed")
        wav_info = parse_ffprobe(wav_probe.stdout)
        output_base = temp_dir / "whisper"
        whisper = run_command([
            str(whisper_path), "-m", str(model), "-f", str(wav), "-l", "en",
            "-oj", "-otxt", "-of", str(output_base), "-np",
        ], timeout=1800)
        if whisper.returncode != 0:
            raise RuntimeError(f"whisper-cli failed: {(whisper.stderr or whisper.stdout).strip()[-1200:]}")
        raw_json_path = output_base.with_suffix(".json")
        text_path = output_base.with_suffix(".txt")
        try:
            raw_payload = json.loads(raw_json_path.read_text(encoding="utf-8"))
            observed_text = text_path.read_text(encoding="utf-8").strip()
        except Exception as exc:
            raise RuntimeError(f"Whisper outputs are missing or invalid: {exc}") from exc
        transcription = parse_whisper_payload(raw_payload)
        if normalize_words(observed_text) != normalize_words(transcription["text"]):
            raise RuntimeError("Whisper JSON and text outputs disagree")
        atomic_write_json(folder / WHISPER_JSON_NAME, raw_payload)
        atomic_write_text(folder / TRANSCRIPT_NAME, observed_text + "\n")

    loudness = run_command([
        ffmpeg_path, "-hide_banner", "-nostats", "-i", str(mp4), "-map", "0:a:0",
        "-af", "ebur128=peak=true", "-f", "null", "-",
    ], timeout=300)
    if loudness.returncode != 0:
        raise RuntimeError("ffmpeg ebur128 analysis failed")
    audio_metrics = parse_ebur128(loudness.stderr + "\n" + loudness.stdout)
    silence = run_command([
        ffmpeg_path, "-hide_banner", "-nostats", "-i", str(mp4), "-map", "0:a:0",
        "-af", f"silencedetect=noise=-50dB:d={THRESHOLDS['long_silence_seconds']}", "-f", "null", "-",
    ], timeout=300)
    if silence.returncode != 0:
        raise RuntimeError("ffmpeg silence analysis failed")
    silences = parse_silences(silence.stderr + "\n" + silence.stdout, mp4_info["duration_seconds"])
    reference_text = (folder / "transcript.txt").read_text(encoding="utf-8")
    metrics, findings = evaluate_metrics(
        mp4_duration=mp4_info["duration_seconds"], wav_duration=wav_info["duration_seconds"],
        transcription=transcription, reference_text=reference_text,
        audio_metrics=audio_metrics, silences=silences,
    )
    receipt = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "status": "HOLD" if findings else "PASS",
        "engine": {"name": "whisper.cpp", "version": whisper_version, "language": "en", "full_file": True},
        "bindings": {
            "mp4": _binding(mp4),
            "script": _binding(folder / "script.json", hash_mode="review_script"),
            "reference_transcript": _binding(folder / "transcript.txt"),
            "asr_transcript": _binding(folder / TRANSCRIPT_NAME),
            "whisper_json": _binding(folder / WHISPER_JSON_NAME),
            "whisper_model": _binding(model),
            "whisper_executable": _binding(whisper_path),
        },
        "media": {"mp4": mp4_info, "extracted_wav": wav_info, "full_decode_pass": True},
        "metrics": metrics,
        "thresholds": THRESHOLDS,
        "findings": findings,
        "limitations": (
            "This receipt proves full-file automated ASR, alignment, decode, loudness, peak, and silence coverage. "
            "It is not human subjective listening, pronunciation coaching, academic certification, or release approval by itself."
        ),
    }
    atomic_write_json(folder / RECEIPT_NAME, receipt)
    return receipt


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("target", type=Path)
    parser.add_argument("--mp4", required=True)
    parser.add_argument("--model", default=os.environ.get("GIIS_WHISPER_MODEL", str(DEFAULT_MODEL)))
    parser.add_argument("--whisper-cli", default="whisper-cli")
    parser.add_argument("--ffmpeg", default="ffmpeg")
    parser.add_argument("--ffprobe", default="ffprobe")
    parser.add_argument("--validate", action="store_true", help="Validate existing receipt without rerunning audio analysis")
    args = parser.parse_args()
    folder = args.target if args.target.is_absolute() else ROOT / args.target
    mp4 = Path(args.mp4)
    mp4 = mp4 if mp4.is_absolute() else folder / mp4
    if args.validate:
        result = validate_local_audio_review(folder, expected_mp4=mp4)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0 if result.get("valid") and result.get("status") == "PASS" else 2
    try:
        receipt = review_audio(
            folder, mp4, Path(args.model), whisper_cli=args.whisper_cli,
            ffmpeg=args.ffmpeg, ffprobe=args.ffprobe,
        )
    except Exception as exc:
        hold = {
            "schema_version": SCHEMA_VERSION,
            "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            "status": "HOLD",
            "findings": [{"code": "AUDIO_REVIEW_RUNTIME_ERROR", "description": str(exc)}],
            "thresholds": THRESHOLDS,
            "limitations": "Automated full-file audio review did not complete; this receipt cannot support release.",
        }
        if folder.is_dir():
            atomic_write_json(folder / RECEIPT_NAME, hold)
        print(json.dumps(hold, indent=2, ensure_ascii=False))
        return 2
    print(json.dumps(receipt, indent=2, ensure_ascii=False))
    return 0 if receipt["status"] == "PASS" else 2


if __name__ == "__main__":
    raise SystemExit(main())
