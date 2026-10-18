#!/usr/bin/env python3
"""Verify every concat-mapped slide in a deterministic still-slide MP4."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageStat


SCHEMA_VERSION = "giis.visual-timeline-review.v1"
RECEIPT_NAME = "_visual_timeline_review_v1.json"
DEFAULT_MAX_MAE = 0.02
DEFAULT_MIN_MARGIN = 0.01
DEFAULT_DURATION_TOLERANCE = 0.35


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_concat(path: Path) -> list[dict[str, Any]]:
    entries: list[tuple[Path, float]] = []
    pending: Path | None = None
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line.startswith("file "):
            value = line[5:].strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
                value = value[1:-1]
            pending = Path(value)
            if not pending.is_absolute():
                pending = (path.parent / pending).resolve()
        elif line.startswith("duration ") and pending is not None:
            duration = float(line.split(maxsplit=1)[1])
            if not math.isfinite(duration) or duration <= 0:
                raise ValueError(f"invalid concat duration: {duration}")
            entries.append((pending, duration))
            pending = None
    if not entries:
        raise ValueError("concat file has no file/duration entries")

    groups: list[dict[str, Any]] = []
    cursor = 0.0
    for slide, duration in entries:
        if not slide.is_file():
            raise ValueError(f"mapped slide is missing: {slide}")
        if groups and groups[-1]["slide"] == str(slide):
            groups[-1]["duration_seconds"] += duration
        else:
            groups.append({
                "slide": str(slide),
                "start_seconds": cursor,
                "duration_seconds": duration,
            })
        cursor += duration
    for group in groups:
        group["end_seconds"] = group["start_seconds"] + group["duration_seconds"]
        group["sample_seconds"] = group["start_seconds"] + group["duration_seconds"] / 2
    return groups


def probe_media(mp4: Path) -> dict[str, Any]:
    completed = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration,format_name:stream=index,codec_type,codec_name",
            "-of", "json", str(mp4),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    payload = json.loads(completed.stdout)
    format_row = payload.get("format") or {}
    duration = float(format_row.get("duration"))
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError("ffprobe returned an invalid duration")
    format_names = str(format_row.get("format_name") or "").split(",")
    if "mp4" not in format_names:
        raise ValueError(f"ffprobe did not identify an MP4 container: {format_names}")
    video_streams = [
        row for row in payload.get("streams", []) if row.get("codec_type") == "video"
    ]
    if not video_streams:
        raise ValueError("ffprobe found no video stream")
    return {
        "duration": duration,
        "format_names": format_names,
        "video_stream_count": len(video_streams),
        "primary_video_codec": video_streams[0].get("codec_name"),
    }


def normalized_mae(actual: Image.Image, expected: Image.Image) -> float:
    actual_rgb = actual.convert("RGB")
    expected_rgb = expected.convert("RGB")
    if actual_rgb.size != expected_rgb.size:
        expected_rgb = expected_rgb.resize(actual_rgb.size, Image.Resampling.LANCZOS)
    means = ImageStat.Stat(ImageChops.difference(actual_rgb, expected_rgb)).mean
    return sum(means) / (3 * 255)


def extract_frame(mp4: Path, seconds: float, output: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-v", "error", "-i", str(mp4), "-ss", f"{seconds:.6f}",
            "-map", "0:v:0", "-frames:v", "1", "-y", str(output),
        ],
        check=True,
    )


def review(
    folder: Path,
    mp4: Path,
    concat: Path,
    *,
    max_mae: float = DEFAULT_MAX_MAE,
    min_margin: float = DEFAULT_MIN_MARGIN,
    duration_tolerance: float = DEFAULT_DURATION_TOLERANCE,
) -> dict[str, Any]:
    folder = folder.resolve()
    mp4 = mp4.resolve()
    concat = concat.resolve()
    if not mp4.is_file() or mp4.suffix.lower() != ".mp4":
        raise ValueError(f"MP4 is missing or invalid: {mp4}")
    groups = parse_concat(concat)
    mapped_duration = groups[-1]["end_seconds"]
    media_probe = probe_media(mp4)
    media_duration = media_probe["duration"]
    duration_delta = abs(media_duration - mapped_duration)

    source_hashes = [sha256_file(Path(row["slide"])) for row in groups]
    sources = [Image.open(row["slide"]).convert("RGB") for row in groups]
    results: list[dict[str, Any]] = []
    with tempfile.TemporaryDirectory(prefix="giis-visual-timeline-") as temp_dir:
        temp = Path(temp_dir)
        for index, row in enumerate(groups):
            frame_path = temp / f"frame-{index + 1:02d}.png"
            extract_frame(mp4, row["sample_seconds"], frame_path)
            with Image.open(frame_path) as actual:
                errors = [normalized_mae(actual, source) for source in sources]
            representative_by_hash: dict[str, int] = {}
            for source_index, source_hash in enumerate(source_hashes):
                representative_by_hash.setdefault(source_hash, source_index)
            order = sorted(representative_by_hash.values(), key=errors.__getitem__)
            expected_error = errors[index]
            best_index = order[0]
            distinct_errors = [
                errors[source_index]
                for source_index in order
                if source_hashes[source_index] != source_hashes[index]
            ]
            next_best_error = min(distinct_errors) if distinct_errors else 1.0
            margin = next_best_error - expected_error
            passed = (
                source_hashes[best_index] == source_hashes[index]
                and expected_error <= max_mae
                and margin >= min_margin
            )
            results.append({
                "section_index": index + 1,
                "slide": row["slide"],
                "slide_sha256": source_hashes[index],
                "start_seconds": round(row["start_seconds"], 6),
                "end_seconds": round(row["end_seconds"], 6),
                "sample_seconds": round(row["sample_seconds"], 6),
                "expected_normalized_mae": round(expected_error, 8),
                "best_match_section_index": best_index + 1,
                "next_best_normalized_mae": round(next_best_error, 8),
                "uniqueness_margin": round(margin, 8),
                "status": "PASS" if passed else "HOLD",
            })

    findings: list[dict[str, Any]] = []
    if duration_delta > duration_tolerance:
        findings.append({
            "code": "DURATION_MISMATCH",
            "detail": (
                f"MP4 duration {media_duration:.6f}s differs from mapped concat "
                f"duration {mapped_duration:.6f}s by {duration_delta:.6f}s"
            ),
        })
    for row in results:
        if row["status"] != "PASS":
            findings.append({
                "code": "SECTION_MATCH_HOLD",
                "section_index": row["section_index"],
                "detail": (
                    f"expected section {row['section_index']} best={row['best_match_section_index']} "
                    f"mae={row['expected_normalized_mae']} margin={row['uniqueness_margin']}"
                ),
            })
    status = "PASS" if not findings else "HOLD"
    return {
        "schema_version": SCHEMA_VERSION,
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "status": status,
        "method": "concat_interval_midpoint_exact_mp4_to_all_source_slides_normalized_mae",
        "bindings": {
            "lesson_folder": str(folder),
            "mp4": {"path": str(mp4), "sha256": sha256_file(mp4)},
            "slides_concat": {"path": str(concat), "sha256": sha256_file(concat)},
        },
        "thresholds": {
            "max_expected_normalized_mae": max_mae,
            "min_uniqueness_margin": min_margin,
            "max_duration_delta_seconds": duration_tolerance,
        },
        "coverage": {
            "mapped_sections": len(groups),
            "sampled_sections": len(results),
            "all_sections_uniquely_matched": all(row["status"] == "PASS" for row in results),
            "mapped_duration_seconds": round(mapped_duration, 6),
            "mp4_duration_seconds": round(media_duration, 6),
            "duration_delta_seconds": round(duration_delta, 6),
            "video_stream_count": media_probe["video_stream_count"],
            "primary_video_codec": media_probe["primary_video_codec"],
        },
        "sections": results,
        "findings": findings,
        "limitations": (
            "Deterministic evidence for still-slide timeline identity and order. It does not replace "
            "full decode, full-resolution slide inspection, audio review, teaching/source review, "
            "human subjective review, or external release verification."
        ),
    }


def validate_receipt(folder: Path, *, expected_mp4: Path | None = None) -> dict[str, Any]:
    folder = folder.resolve()
    path = folder / RECEIPT_NAME
    try:
        receipt = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return {"valid": False, "status": "HOLD", "errors": [f"invalid receipt: {exc}"]}
    errors: list[str] = []
    if receipt.get("schema_version") != SCHEMA_VERSION or receipt.get("status") != "PASS":
        errors.append("receipt is not a supported PASS")
    bindings = receipt.get("bindings") or {}
    if Path(str(bindings.get("lesson_folder") or "")).resolve() != folder:
        errors.append("receipt is bound to another lesson folder")
    mp4_binding = bindings.get("mp4") or {}
    concat_binding = bindings.get("slides_concat") or {}
    mp4 = Path(str(mp4_binding.get("path") or ""))
    concat = Path(str(concat_binding.get("path") or ""))
    if expected_mp4 is not None and mp4.resolve() != expected_mp4.resolve():
        errors.append("receipt is bound to another MP4")
    for label, candidate, binding in (
        ("mp4", mp4, mp4_binding),
        ("slides_concat", concat, concat_binding),
    ):
        try:
            if not candidate.resolve().is_relative_to(folder):
                errors.append(f"bound {label} is outside the lesson folder")
        except (OSError, RuntimeError):
            errors.append(f"bound {label} cannot be resolved")
        if not candidate.is_file() or sha256_file(candidate) != binding.get("sha256"):
            errors.append(f"bound {label} changed or is missing")
    sections = receipt.get("sections")
    coverage = receipt.get("coverage") or {}
    thresholds = receipt.get("thresholds") or {}
    expected_thresholds = {
        "max_expected_normalized_mae": DEFAULT_MAX_MAE,
        "min_uniqueness_margin": DEFAULT_MIN_MARGIN,
        "max_duration_delta_seconds": DEFAULT_DURATION_TOLERANCE,
    }
    if thresholds != expected_thresholds:
        errors.append("receipt thresholds do not match release policy")
    if receipt.get("findings") != []:
        errors.append("PASS receipt contains findings")
    if (
        not isinstance(sections, list)
        or len(sections) < 2
        or coverage.get("mapped_sections") != len(sections)
        or coverage.get("sampled_sections") != len(sections)
        or coverage.get("all_sections_uniquely_matched") is not True
        or any(not isinstance(row, dict) or row.get("status") != "PASS" for row in sections)
    ):
        errors.append("receipt does not prove every mapped section")
    if isinstance(sections, list) and concat.is_file():
        try:
            groups = parse_concat(concat)
        except Exception as exc:
            errors.append(f"cannot re-parse bound concat: {exc}")
            groups = []
        if len(groups) != len(sections):
            errors.append("receipt sections no longer match bound concat")
        section_hashes = [row.get("slide_sha256") if isinstance(row, dict) else None for row in sections]
        for index, (row, group) in enumerate(zip(sections, groups), 1):
            if not isinstance(row, dict):
                continue
            slide = Path(str(row.get("slide") or ""))
            expected_slide = Path(group["slide"])
            try:
                inside_folder = slide.resolve().is_relative_to(folder)
            except (OSError, RuntimeError):
                inside_folder = False
            if not inside_folder:
                errors.append(f"section {index} slide is outside the lesson folder")
            if slide.resolve() != expected_slide.resolve():
                errors.append(f"section {index} slide no longer matches concat")
            if not slide.is_file() or sha256_file(slide) != row.get("slide_sha256"):
                errors.append(f"section {index} slide changed or is missing")
            numeric_fields = (
                "start_seconds", "end_seconds", "sample_seconds",
                "expected_normalized_mae", "next_best_normalized_mae", "uniqueness_margin",
            )
            numeric_values: dict[str, float] = {}
            try:
                numeric_values = {name: float(row.get(name)) for name in numeric_fields}
                if not all(math.isfinite(value) for value in numeric_values.values()):
                    raise ValueError("non-finite")
            except (TypeError, ValueError):
                errors.append(f"section {index} has invalid numeric evidence")
                continue
            if row.get("section_index") != index:
                errors.append(f"section {index} index is invalid")
            best_index = row.get("best_match_section_index")
            if (
                not isinstance(best_index, int)
                or best_index < 1
                or best_index > len(section_hashes)
                or section_hashes[best_index - 1] != row.get("slide_sha256")
            ):
                errors.append(f"section {index} best-match identity is invalid")
            if not (
                abs(numeric_values["start_seconds"] - group["start_seconds"]) <= 1e-5
                and abs(numeric_values["end_seconds"] - group["end_seconds"]) <= 1e-5
                and numeric_values["start_seconds"] < numeric_values["sample_seconds"] < numeric_values["end_seconds"]
            ):
                errors.append(f"section {index} timing evidence is invalid")
            if (
                numeric_values["expected_normalized_mae"] > DEFAULT_MAX_MAE
                or numeric_values["uniqueness_margin"] < DEFAULT_MIN_MARGIN
            ):
                errors.append(f"section {index} does not meet release thresholds")
        try:
            media_duration = probe_media(mp4)["duration"]
            mapped_duration = groups[-1]["end_seconds"] if groups else 0.0
            if abs(media_duration - mapped_duration) > DEFAULT_DURATION_TOLERANCE:
                errors.append("current MP4 duration no longer matches concat")
        except Exception as exc:
            errors.append(f"cannot re-probe bound MP4: {exc}")
    return {
        "valid": not errors,
        "status": "PASS" if not errors else "HOLD",
        "errors": errors,
        "receipt": receipt,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("folder", type=Path)
    parser.add_argument("--mp4", type=Path, required=True)
    parser.add_argument("--concat", type=Path)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    folder = args.folder.resolve()
    mp4 = args.mp4 if args.mp4.is_absolute() else folder / args.mp4
    concat = args.concat or folder / "slides_concat.txt"
    concat = concat if concat.is_absolute() else folder / concat
    report = args.report or folder / RECEIPT_NAME
    if args.check:
        result = validate_receipt(folder, expected_mp4=mp4)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0 if result["valid"] else 1
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise SystemExit("ffmpeg and ffprobe are required")
    payload = review(folder, mp4, concat)
    report.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": payload["status"],
        "report": str(report),
        "sections": payload["coverage"]["mapped_sections"],
        "duration_delta_seconds": payload["coverage"]["duration_delta_seconds"],
    }, ensure_ascii=False))
    return 0 if payload["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
