#!/usr/bin/env python3
"""Prepare and validate version-bound GIIS lesson-video review evidence."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shlex
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from local_audio_review import (  # noqa: E402
    RECEIPT_NAME as LOCAL_AUDIO_RECEIPT_NAME,
    SCHEMA_VERSION as LOCAL_AUDIO_SCHEMA_VERSION,
    validate_local_audio_review,
)

SCHEMA_VERSION = "giis.lesson-video-review.v2"
PACKET_NAME = "_review_packet_v2.json"
RESPONSE_NAME = "_review_response_v2.json"
EXECUTION_NAME = "_review_execution_v2.json"
DIMENSIONS = (
    "source_teaching_correctness",
    "student_safety",
    "audiovisual_source_alignment",
    "technical_trust_release",
)
REQUIRED_ARTIFACTS = {
    "canonical_course",
    "source_packet",
    "script",
    "build_slides",
    "learning_check",
    "style_manifest",
    "teaching_brief",
    "visual_brief",
    "transcript",
    "contact_sheet",
    "mp4",
}
STATUSES = {"PASS", "REPAIR", "HOLD"}
COVERAGE_LEVELS = {"full", "sampled", "metadata", "none"}


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str | None:
    try:
        h = hashlib.sha256()
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                h.update(chunk)
        return h.hexdigest()
    except OSError:
        return None


def review_script_sha(path: Path) -> str | None:
    script = load_json(path)
    if not isinstance(script, dict):
        return sha256_file(path)
    script = dict(script)
    script.pop("youtube", None)
    payload = json.dumps(script, indent=2, ensure_ascii=False).encode("utf-8") + b"\n"
    return sha256_bytes(payload)


def display_path(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(ROOT.resolve()))
    except ValueError:
        return str(path.resolve())


def resolve_path(path_text: str) -> Path:
    path = Path(path_text)
    return path if path.is_absolute() else ROOT / path


def canonical_course_source(source_packet: dict[str, Any]) -> Path | None:
    course = source_packet.get("course") or {}
    slug = str(course.get("slug") or "").strip()
    if not slug:
        return None
    matches = sorted((ROOT / "server" / "prisma" / "courses").glob(f"**/{slug}.json"))
    return matches[0] if len(matches) == 1 else None


def canonical_module(course_payload: Any, module_order: Any) -> dict[str, Any]:
    if not isinstance(course_payload, dict):
        return {}
    modules = course_payload.get("modules") or []
    for index, module in enumerate(modules, 1):
        if not isinstance(module, dict):
            continue
        order = module.get("order", index)
        if str(order) == str(module_order):
            return module
    return {}


def detect_academic_holds(source_packet: dict[str, Any], course_payload: Any) -> list[dict[str, str]]:
    course = source_packet.get("course") or {}
    module_ref = source_packet.get("module") or {}
    module = canonical_module(course_payload, module_ref.get("order")) or module_ref
    assignment = str(module.get("assignment") or "")
    subject = f"{course.get('subject_area', '')} {course.get('department', '')}".lower()
    holds: list[dict[str, str]] = []
    diagnostic_prompt = re.search(
        r"(?:diagnos\w*|determin\w*)[^.]{0,180}(?:psychological\s+)?disorder",
        assignment,
        flags=re.IGNORECASE,
    )
    if "psycholog" in subject and diagnostic_prompt:
        holds.append({
            "code": "PSYCHOLOGY_STUDENT_DIAGNOSIS_PROMPT",
            "location": "canonical_course.module.assignment",
            "evidence": diagnostic_prompt.group(0),
            "required_owner": "academic_owner",
            "recommendation": (
                "Ask students to analyze hypothetical 4-D indicators, context, uncertainty, "
                "and when professional assessment may be appropriate; do not ask students to "
                "decide that a person or behavior is a disorder."
            ),
        })
    return holds


def artifact_binding(path: Path, *, hash_mode: str = "file") -> dict[str, str]:
    digest = review_script_sha(path) if hash_mode == "review_script" else sha256_file(path)
    return {
        "path": display_path(path),
        "sha256": digest or "",
        "hash_mode": hash_mode,
    }


def build_review_packet(
    folder: Path,
    mp4: Path,
    *,
    producer_identity: str,
    require_local_audio: bool = False,
    review_scope: str = "content-source",
) -> dict[str, Any]:
    folder = folder.resolve()
    mp4 = mp4.resolve()
    if review_scope not in {"content-source", "full-release"}:
        raise ValueError(f"unsupported review scope: {review_scope}")
    if review_scope == "full-release" and not require_local_audio:
        raise ValueError("full-release packet requires local audio binding")
    if folder not in mp4.parents:
        raise ValueError("selected MP4 must be inside the lesson folder")
    if not mp4.exists() or mp4.suffix.lower() != ".mp4":
        raise ValueError(f"selected MP4 is missing or invalid: {mp4}")

    source_packet = load_json(folder / "source_packet.json")
    script = load_json(folder / "script.json")
    if not isinstance(source_packet, dict):
        raise ValueError("missing or invalid source_packet.json")
    if not isinstance(script, dict):
        raise ValueError("missing or invalid script.json")
    canonical_path = canonical_course_source(source_packet)
    if canonical_path is None:
        raise ValueError("canonical course source could not be resolved uniquely")
    course_payload = load_json(canonical_path)

    required = {
        "canonical_course": artifact_binding(canonical_path),
        "source_packet": artifact_binding(folder / "source_packet.json"),
        "script": artifact_binding(folder / "script.json", hash_mode="review_script"),
        "build_slides": artifact_binding(folder / "build_slides.py"),
        "learning_check": artifact_binding(folder / "learning_check.json"),
        "style_manifest": artifact_binding(folder / "style_manifest.json"),
        "teaching_brief": artifact_binding(folder / "teaching_brief.md"),
        "visual_brief": artifact_binding(folder / "visual_brief.md"),
        "transcript": artifact_binding(folder / "transcript.txt"),
        "contact_sheet": artifact_binding(folder / "contact-sheet.jpg"),
        "mp4": artifact_binding(mp4),
    }
    missing = [name for name, binding in required.items() if not binding["sha256"]]
    if missing:
        raise ValueError(f"required review artifacts missing or unreadable: {missing}")

    identity = {
        "course_slug": str((source_packet.get("course") or {}).get("slug") or ""),
        "course": str(script.get("course") or ""),
        "module_order": (source_packet.get("module") or {}).get("order"),
        "module": str(script.get("module") or ""),
        "lesson_folder": display_path(folder),
    }
    audio_review: dict[str, Any] | None = None
    if require_local_audio:
        validation = validate_local_audio_review(folder, expected_mp4=mp4)
        if not validation.get("valid") or validation.get("status") != "PASS":
            details = "; ".join(validation.get("errors") or []) or f"status={validation.get('status')}"
            raise ValueError(f"full-release review requires valid local audio PASS: {details}")
        audio_review = {
            "schema_version": LOCAL_AUDIO_SCHEMA_VERSION,
            "status": "PASS",
            "receipt": artifact_binding(folder / LOCAL_AUDIO_RECEIPT_NAME),
            "model_sha256": validation.get("model_sha256"),
            "candidate_mp4": validation.get("candidate_mp4"),
        }

    fingerprint = json.dumps(
        {
            "identity": identity,
            "artifacts": required,
            "automated_audio_review": audio_review,
            "review_scope": review_scope,
        },
        sort_keys=True,
        ensure_ascii=False,
    ).encode("utf-8")
    review_id = f"vr2-{sha256_bytes(fingerprint)[:20]}"
    packet = {
        "schema_version": SCHEMA_VERSION,
        "review_id": review_id,
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "producer_identity": producer_identity,
        "review_scope": review_scope,
        "identity": identity,
        "artifacts": required,
        "academic_holds": detect_academic_holds(source_packet, course_payload),
        "required_dimensions": list(DIMENSIONS),
        "coverage_contract": {
            "source_teaching_correctness": "full canonical module, source packet, script, and learning check",
            "student_safety": "full canonical module assignment and complete script",
            "audiovisual_source_alignment": "full MP4 playback plus complete transcript/script/slide-source comparison",
            "technical_trust_release": "artifact integrity, complete audiovisual checks, trust and release gates",
        },
        "limitations": [
            "A model review is not human academic-owner or subject-matter certification.",
            "Automated audio evidence does not prove human subjective listening or pronunciation quality.",
            "Metadata, contact sheets, frames, transcripts, and successful decode do not prove complete visual review.",
        ],
    }
    if audio_review:
        packet["automated_audio_review"] = audio_review
    return packet


def write_review_packet(
    folder: Path,
    mp4: Path,
    *,
    producer_identity: str,
    require_local_audio: bool = False,
    review_scope: str = "content-source",
) -> Path:
    packet = build_review_packet(
        folder,
        mp4,
        producer_identity=producer_identity,
        require_local_audio=require_local_audio,
        review_scope=review_scope,
    )
    path = folder / PACKET_NAME
    path.write_text(json.dumps(packet, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def _validate_artifact_bindings(packet: dict[str, Any], response: dict[str, Any], errors: list[str]) -> None:
    packet_bindings = packet.get("artifacts") or {}
    response_bindings = response.get("bindings") or {}
    if not isinstance(packet_bindings, dict) or set(packet_bindings) != REQUIRED_ARTIFACTS:
        errors.append("packet does not contain the exact required artifact set")
        return
    if not isinstance(response_bindings, dict):
        errors.append("response bindings must be an object")
        return
    if set(response_bindings) != set(packet_bindings):
        errors.append("response bindings do not exactly match packet artifact names")
        return
    for name, expected in packet_bindings.items():
        if not isinstance(expected, dict):
            errors.append(f"packet binding must be an object: {name}")
            continue
        actual = response_bindings.get(name)
        if not isinstance(actual, dict):
            errors.append(f"response binding must be an object: {name}")
            continue
        if actual.get("path") != expected.get("path") or actual.get("sha256") != expected.get("sha256"):
            errors.append(f"response binding mismatch: {name}")
            continue
        path = resolve_path(str(expected.get("path") or ""))
        mode = expected.get("hash_mode")
        current = review_script_sha(path) if mode == "review_script" else sha256_file(path)
        if not current or current != expected.get("sha256"):
            errors.append(f"bound artifact changed or is missing: {name}")


def _validate_automated_audio_review(
    folder: Path,
    packet: dict[str, Any],
    errors: list[str],
) -> bool:
    audio = packet.get("automated_audio_review")
    if audio is None:
        return False
    if not isinstance(audio, dict):
        errors.append("packet automated_audio_review must be an object")
        return True
    if audio.get("schema_version") != LOCAL_AUDIO_SCHEMA_VERSION or audio.get("status") != "PASS":
        errors.append("packet automated audio review is not a supported PASS receipt")
    binding = audio.get("receipt")
    if not isinstance(binding, dict):
        errors.append("packet automated audio receipt binding is missing")
    else:
        path = resolve_path(str(binding.get("path") or ""))
        if path.resolve() != (folder / LOCAL_AUDIO_RECEIPT_NAME).resolve():
            errors.append("packet automated audio receipt path is not lesson-local")
        if sha256_file(path) != binding.get("sha256"):
            errors.append("packet automated audio receipt changed or is missing")
    mp4_binding = (packet.get("artifacts") or {}).get("mp4") or {}
    expected_mp4 = resolve_path(str(mp4_binding.get("path") or ""))
    script_binding = (packet.get("artifacts") or {}).get("script") or {}
    allowed_review_script_sha = (
        script_binding.get("sha256") if script_binding.get("hash_mode") == "review_script" else None
    )
    validation = validate_local_audio_review(
        folder,
        expected_mp4=expected_mp4,
        allowed_review_script_sha=allowed_review_script_sha,
    )
    if not validation.get("valid") or validation.get("status") != "PASS":
        errors.append("current local audio review is missing, invalid, HOLD, or bound to another MP4")
    if audio.get("model_sha256") != validation.get("model_sha256"):
        errors.append("packet automated audio model hash does not match current receipt")
    if audio.get("candidate_mp4") != validation.get("candidate_mp4"):
        errors.append("packet automated audio candidate does not match current receipt")
    return True


def _validate_findings(response: dict[str, Any], errors: list[str]) -> set[str]:
    findings = response.get("findings")
    if not isinstance(findings, list):
        errors.append("findings must be a list")
        return set()
    ids: set[str] = set()
    for index, finding in enumerate(findings):
        if not isinstance(finding, dict):
            errors.append(f"finding {index} is not an object")
            continue
        finding_id = str(finding.get("id") or "").strip()
        if not finding_id or finding_id in ids:
            errors.append(f"finding {index} has missing or duplicate id")
        ids.add(finding_id)
        dimension_name = finding.get("dimension")
        severity = finding.get("severity")
        if not isinstance(dimension_name, str) or dimension_name not in DIMENSIONS:
            errors.append(f"finding {finding_id or index} has invalid dimension")
        if not isinstance(severity, str) or severity not in {"critical", "major", "minor", "repair", "hold", "note"}:
            errors.append(f"finding {finding_id or index} has invalid severity")
        location = finding.get("location")
        if not isinstance(location, dict):
            errors.append(f"finding {finding_id or index} location must be an object")
            location = {}
        if not str(location.get("artifact") or "").strip() or not str(location.get("locator") or "").strip():
            errors.append(f"finding {finding_id or index} lacks artifact and locator")
        if not str(finding.get("description") or "").strip():
            errors.append(f"finding {finding_id or index} lacks description")
        if isinstance(severity, str) and severity in {"critical", "major", "repair", "hold"} and not str(finding.get("required_action") or "").strip():
            errors.append(f"finding {finding_id or index} lacks required_action")
    return ids


def _validate_dimensions(packet: dict[str, Any], response: dict[str, Any], finding_ids: set[str], errors: list[str]) -> dict[str, Any]:
    dimensions = response.get("dimensions")
    if not isinstance(dimensions, dict) or set(dimensions) != set(DIMENSIONS):
        errors.append("response dimensions must exactly match the required four dimensions")
        return {}
    for name in DIMENSIONS:
        dimension = dimensions.get(name)
        if not isinstance(dimension, dict):
            errors.append(f"dimension {name} must be an object")
            continue
        status = dimension.get("status")
        coverage = dimension.get("coverage") or {}
        if not isinstance(coverage, dict):
            errors.append(f"dimension {name} coverage must be an object")
            coverage = {}
        level = coverage.get("level")
        artifacts = coverage.get("artifacts")
        refs = dimension.get("finding_ids")
        if not isinstance(status, str) or status not in STATUSES:
            errors.append(f"dimension {name} has invalid status")
        if not isinstance(level, str) or level not in COVERAGE_LEVELS or not isinstance(artifacts, list) or any(not isinstance(item, str) for item in artifacts):
            errors.append(f"dimension {name} has invalid coverage")
        if not isinstance(refs, list) or any(not isinstance(ref, str) or ref not in finding_ids for ref in refs):
            errors.append(f"dimension {name} has invalid finding references")
        if isinstance(status, str) and status in {"REPAIR", "HOLD"} and not refs:
            errors.append(f"dimension {name} is {status} without a located finding")

        required_artifacts = {
            "source_teaching_correctness": {"canonical_course", "source_packet", "script", "learning_check"},
            "student_safety": {"canonical_course", "script"},
            "audiovisual_source_alignment": {"mp4", "transcript", "script", "build_slides"},
            "technical_trust_release": {"mp4", "contact_sheet", "style_manifest"},
        }[name]
        if status == "PASS":
            if level != "full":
                errors.append(f"dimension {name} cannot PASS without full coverage")
            if isinstance(artifacts, list) and all(isinstance(item, str) for item in artifacts) and not required_artifacts.issubset(set(artifacts)):
                errors.append(f"dimension {name} PASS lacks required artifact coverage")
            if (
                packet.get("automated_audio_review")
                and name in {"audiovisual_source_alignment", "technical_trust_release"}
                and isinstance(artifacts, list)
                and "local_audio_review" not in artifacts
            ):
                errors.append(f"dimension {name} PASS lacks local_audio_review coverage")

    finding_dimensions = {
        str(finding.get("id")): str(finding.get("dimension"))
        for finding in response.get("findings") or []
        if isinstance(finding, dict) and finding.get("id")
    }
    referenced: set[str] = set()
    for name, dimension in dimensions.items():
        if not isinstance(dimension, dict):
            continue
        refs = dimension.get("finding_ids")
        if not isinstance(refs, list):
            continue
        for ref in refs:
            if not isinstance(ref, str):
                continue
            referenced.add(ref)
            if finding_dimensions.get(ref) != name:
                errors.append(f"finding {ref} is referenced by the wrong dimension")
    for finding_id in finding_dimensions:
        if finding_id not in referenced:
            errors.append(f"finding {finding_id} is not referenced by its dimension")
    return dimensions


def _read_only_command(command: Any) -> bool:
    """Conservative inspection of observed shell calls, not a shell sandbox.

    Unknown interpreters/scripts and external commands cannot certify a
    read-only review. The Codex OS sandbox remains the enforcement boundary.
    """
    if not isinstance(command, str) or any(
        token in command for token in ("$", "`", "\n", ">", "<", "~", "{", "}", "*", "?", "[", "]")
    ):
        return False
    try:
        words = shlex.split(command)
        if words and words[0] != Path(words[0]).name:
            return False
        if words and Path(words[0]).name in {"bash", "sh", "zsh"}:
            return False
        lexer = shlex.shlex(command, posix=True, punctuation_chars=";&|()")
        lexer.whitespace_split = True
        parts: list[list[str]] = [[]]
        for word in lexer:
            if word in {";", "&&", "|"}:
                parts.append([])
            elif word in {"&", "||", "(", ")"}:
                return False
            else:
                parts[-1].append(word)
        for args in parts:
            if not args:
                return False
            name = Path(args[0]).name
            if name == "cat":
                if len(args) < 2 or any(arg.startswith("-") for arg in args[1:]):
                    return False
                continue
            if name in {"head", "tail"}:
                tail_args = args[1:]
                if tail_args[:1] == ["-n"]:
                    if len(tail_args) < 3 or not tail_args[1].isdigit():
                        return False
                    tail_args = tail_args[2:]
                if not tail_args or any(arg.startswith("-") for arg in tail_args):
                    return False
                continue
            if name == "wc":
                tail_args = args[1:]
                if tail_args and re.fullmatch(r"-[lwcmL]+", tail_args[0]):
                    tail_args = tail_args[1:]
                if not tail_args or any(arg.startswith("-") for arg in tail_args):
                    return False
                continue
            if name == "ls":
                tail_args = args[1:]
                if tail_args and re.fullmatch(r"-[la1d]+", tail_args[0]):
                    tail_args = tail_args[1:]
                if any(arg.startswith("-") for arg in tail_args):
                    return False
                continue
            if name == "pwd":
                if len(args) != 1:
                    return False
                continue
            if name in {"sha256sum", "shasum"}:
                if len(args) < 2 or any(arg.startswith("-") for arg in args[1:]):
                    return False
                continue
            if name in {"rg", "grep"}:
                index = 1
                safe_flags = {"-n", "--line-number", "-i", "--ignore-case", "-F", "--fixed-strings"}
                while index < len(args) and args[index] in safe_flags:
                    index += 1
                if len(args[index:]) < 2 or any(arg.startswith("-") for arg in args[index:]):
                    return False
                continue
            if name == "sed":
                # Only line-range print expressions; sed can otherwise write/exec.
                if len(args) < 3 or args[1] != "-n" or not re.fullmatch(r"[0-9]+(?:,[0-9]+)?p", args[2]):
                    return False
                if any(arg.startswith("-") for arg in args[3:]):
                    return False
                continue
            if name in {"ffprobe", "ffmpeg"}:
                # Parse a small read-only subset. No arbitrary filters, remote
                # protocols, additional output files, reports or script loading.
                options = {"-v", "-loglevel", "-i", "-map"}
                flags = {"-hide_banner", "-nostats", "-vn"}
                if name == "ffprobe":
                    options |= {"-show_entries", "-of", "-print_format", "-select_streams"}
                    flags |= {
                        "-show_format", "-show_streams", "-show_frames", "-show_packets",
                        "-count_frames",
                    }
                    tail = args[1:]
                else:
                    if args[-3:] not in (["-f", "null", "-"], ["-f", "framemd5", "-"], ["-f", "hash", "-"]):
                        return False
                    options |= {"-vf", "-filter:v", "-ss", "-t", "-to", "-frames:v"}
                    tail = args[1:-3]
                inputs = []
                index = 0
                while index < len(tail):
                    arg = tail[index]
                    if arg in flags:
                        index += 1
                    elif arg in options and index + 1 < len(tail):
                        if arg == "-i":
                            inputs.append(tail[index + 1])
                        elif arg in {"-vf", "-filter:v"}:
                            value = tail[index + 1]
                            # FFmpeg requires the comma inside gt() to be escaped;
                            # the shell's single quotes preserve this backslash.
                            safe_filter = value == r"select=gt(scene\,0.10),showinfo"
                            if not safe_filter or any(token in value for token in ("movie", "sendcmd", "zmq", ";")):
                                return False
                        index += 2
                    elif name == "ffprobe" and not arg.startswith("-"):
                        inputs.append(arg)
                        index += 1
                    else:
                        return False
                if len(inputs) != 1 or ":" in inputs[0] or inputs[0] == "-":
                    return False
                continue
            return False
        return True
    except ValueError:
        return False


def _codex_read_only_sandbox_command(command: Any) -> bool:
    """Fail closed on the same explicit read-only grammar as other providers.

    Codex is also launched inside an OS read-only sandbox, but the persisted
    evidence must remain independently auditable instead of trusting a broad
    substring blocklist or a self-asserted sandbox label.
    """
    return _read_only_command(command)


def _codex_raw_inner_command(command: Any) -> str | None:
    """Unwrap only the provider's fixed bash launcher, then apply our grammar."""
    if not isinstance(command, str):
        return None
    try:
        words = shlex.split(command)
    except ValueError:
        return None
    if len(words) == 3 and Path(words[0]).name == "bash" and words[1] == "-lc":
        inner = words[2]
    else:
        inner = command
    return inner if _read_only_command(inner) else None


def _path_is_scoped(path_text: str, roots: tuple[Path, ...], *, base: Path) -> bool:
    path = Path(path_text)
    candidate = path if path.is_absolute() else base / path
    resolved = candidate.resolve(strict=False)
    return any(
        scoped == resolved or scoped in resolved.parents
        for root in roots
        for scoped in (root.resolve(strict=False),)
    )


def _command_read_paths(command: str) -> list[str] | None:
    """Return literal file operands for the small accepted command grammar."""
    try:
        lexer = shlex.shlex(command, posix=True, punctuation_chars=";&|()")
        lexer.whitespace_split = True
        words = list(lexer)
    except ValueError:
        return None
    parts: list[list[str]] = [[]]
    for word in words:
        if word in {";", "&&", "|"}:
            parts.append([])
        elif word in {"&", "||", "(", ")"}:
            return None
        else:
            parts[-1].append(word)
    paths: list[str] = []
    for args in parts:
        if not args:
            return None
        name = Path(args[0]).name
        if name == "pwd":
            continue
        if name == "sed":
            paths.extend(args[3:])
            continue
        if name == "find":
            if len(args) < 2:
                return None
            paths.append(args[1])
            continue
        if name in {"ffmpeg", "ffprobe"}:
            paths.extend(args[index + 1] for index, arg in enumerate(args[:-1]) if arg == "-i")
            if name == "ffprobe" and "-i" not in args:
                positional = [arg for arg in args[1:] if not arg.startswith("-")]
                if positional:
                    paths.append(positional[-1])
            continue
        if name in {"rg", "grep"}:
            positional = [arg for arg in args[1:] if not arg.startswith("-")]
            paths.extend(positional[1:])
            continue
        if name == "jq":
            positional = [arg for arg in args[1:] if not arg.startswith("-")]
            paths.extend(positional[1:])
            continue
        if name in {"head", "tail"}:
            index = 1
            while index < len(args):
                if args[index] in {"-n", "-c"} and index + 1 < len(args):
                    index += 2
                elif args[index].startswith("-"):
                    index += 1
                else:
                    paths.append(args[index])
                    index += 1
            continue
        paths.extend(arg for arg in args[1:] if not arg.startswith("-"))
    return paths


def _resolved_command_read_paths(command: str, *, base: Path) -> list[str]:
    paths = _command_read_paths(command) or []
    return [str((Path(path) if Path(path).is_absolute() else base / path).resolve(strict=False)) for path in paths]


def _command_paths_scoped(
    command: str, *, workdir: str | None, allowed_roots: tuple[Path, ...],
) -> bool:
    if not _read_only_command(command):
        return False
    base = Path(workdir).resolve(strict=False) if workdir else ROOT.resolve()
    if not _path_is_scoped(str(base), allowed_roots, base=ROOT.resolve()):
        return False
    paths = _command_read_paths(command)
    if paths is None:
        return False
    for path in paths:
        if not _path_is_scoped(path, allowed_roots, base=base):
            return False
    return True


def _codex_exec_wrapper_commands(
    value: Any, *, allowed_roots: tuple[Path, ...] | None = None,
) -> list[str] | None:
    """Parse the complete, single-call Codex ``exec`` wrapper grammar."""
    if not isinstance(value, str):
        return None
    if value.lstrip().startswith("// @exec:"):
        lines = value.lstrip().splitlines()
        if len(lines) < 2:
            return None
        prefix = "// @exec:"
        try:
            pragma = json.loads(lines[0][len(prefix):].strip())
        except json.JSONDecodeError:
            return None
        if not isinstance(pragma, dict) or not set(pragma) <= {"max_output_tokens", "yield_time_ms"}:
            return None
        limits = {"max_output_tokens": (1, 50_000), "yield_time_ms": (250, 120_000)}
        if any(
            not isinstance(number, int) or isinstance(number, bool)
            or number < limits[key][0] or number > limits[key][1]
            for key, number in pragma.items()
        ):
            return None
        value = "\n".join(lines[1:])
    import re
    string = r'"(?:\\.|[^"\\])*"'
    wrapper = re.fullmatch(
        r"\s*(?:const|let)\s+(?P<var>[A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*"
        r"await\s+tools\.exec_command\s*\(\s*\{(?P<body>.*)\}\s*\)\s*;\s*"
        r"text\s*\(\s*JSON\.stringify\s*\(\s*\{\s*output\s*:\s*(?P=var)\.output\s*,\s*"
        r"exit_code\s*:\s*(?P=var)\.exit_code\s*\}\s*\)\s*\)\s*;?\s*",
        value,
        flags=re.DOTALL,
    )
    if not wrapper:
        return None
    body = wrapper.group("body")
    property_value = rf"(?:{string}|[0-9]+)"
    key_syntax = r'(?:"(?:cmd|workdir|yield_time_ms|max_output_tokens)"|(?:cmd|workdir|yield_time_ms|max_output_tokens))'
    property_syntax = rf"\s*{key_syntax}\s*:\s*{property_value}\s*"
    if not re.fullmatch(rf"{property_syntax}(?:,{property_syntax})*", body):
        return None
    property_pattern = re.compile(
        rf"\s*(?P<key>{key_syntax})\s*:\s*"
        rf"(?P<value>{property_value})\s*"
    )
    properties: dict[str, str] = {}
    for match in re.finditer(property_pattern, body):
        property_name = match.group("key").strip('"')
        raw = match.group("value")
        if property_name in properties:
            return None
        properties[property_name] = raw
    if "cmd" not in properties or not properties["cmd"].startswith('"'):
        return None
    if "workdir" in properties and not properties["workdir"].startswith('"'):
        return None
    for numeric in ("yield_time_ms", "max_output_tokens"):
        if numeric in properties and properties[numeric].startswith('"'):
            return None
    try:
        command = json.loads(properties["cmd"])
        workdir = json.loads(properties["workdir"]) if "workdir" in properties else None
    except json.JSONDecodeError:
        return None
    if not isinstance(command, str):
        return None
    if allowed_roots is not None and not _command_paths_scoped(
        command, workdir=workdir, allowed_roots=allowed_roots,
    ):
        return None
    return [command]


def _codex_exec_wrapper_workdir(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    match = re.search(
        r'(?:(?:"workdir")|workdir)\s*:\s*(?P<value>"(?:\\.|[^"\\])*")',
        value,
    )
    if not match:
        return None
    try:
        workdir = json.loads(match.group("value"))
    except json.JSONDecodeError:
        return None
    return workdir if isinstance(workdir, str) else None


def _codex_view_wrapper_path(value: Any) -> str | None:
    """Parse one exact read-only Codex image-view wrapper."""
    if not isinstance(value, str):
        return None
    string = r'"(?:\\.|[^"\\])*"'
    wrapper = re.fullmatch(
        r"\s*(?:const|let)\s+(?P<var>[A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*"
        r"await\s+tools\.view_image\s*\(\s*\{(?P<body>.*)\}\s*\)\s*;\s*"
        r"image\s*\(\s*(?P=var)\.image_url\s*,\s*\"original\"\s*\)\s*;?\s*",
        value,
        flags=re.DOTALL,
    )
    if not wrapper:
        return None
    body = wrapper.group("body")
    key_syntax = r'(?:"(?:path|detail)"|(?:path|detail))'
    property_syntax = rf"\s*{key_syntax}\s*:\s*{string}\s*"
    if not re.fullmatch(rf"{property_syntax}(?:,{property_syntax})*", body):
        return None
    properties: dict[str, str] = {}
    for match in re.finditer(rf"\s*(?P<key>{key_syntax})\s*:\s*(?P<value>{string})\s*", body):
        key = match.group("key").strip('"')
        if key in properties:
            return None
        properties[key] = match.group("value")
    if set(properties) != {"path", "detail"}:
        return None
    try:
        path = json.loads(properties["path"])
        detail = json.loads(properties["detail"])
    except json.JSONDecodeError:
        return None
    if not isinstance(path, str) or detail != "original":
        return None
    return path


def _tool_output_succeeded(output: Any) -> bool:
    if output is None:
        return False
    if isinstance(output, dict):
        if output.get("isError") is True or output.get("is_error") is True:
            return False
        if output.get("error") not in (None, False, "", 0):
            return False
        if str(output.get("status") or "").lower() in {"error", "failed", "failure"}:
            return False
        if "exit_code" in output and output.get("exit_code") != 0:
            return False
        if not output:
            return False
    elif isinstance(output, list) and not output:
        return False
    if isinstance(output, str):
        if not output.strip():
            return False
        try:
            parsed = json.loads(output)
        except json.JSONDecodeError:
            parsed = None
        if isinstance(parsed, (dict, list)) and not _tool_output_succeeded(parsed):
            return False
        text = output
    else:
        text = json.dumps(output, ensure_ascii=False)
    lowered = text.lower()
    if re.search(r'"is_?error"\s*:\s*true', lowered):
        return False
    if re.search(r'"status"\s*:\s*"(?:error|failed|failure)"', lowered):
        return False
    return not any(marker in lowered for marker in (
        "script failed", "toolerror", "operation_not_permitted", "operation not permitted",
        "traceback (most recent call last)", "no such file or directory", "enoent",
    ))


def _output_text_blocks(output: Any) -> list[str]:
    if isinstance(output, str):
        return [output]
    if isinstance(output, dict):
        text = output.get("text")
        return [text] if isinstance(text, str) else []
    if isinstance(output, list):
        texts: list[str] = []
        for item in output:
            if isinstance(item, dict) and isinstance(item.get("text"), str):
                texts.append(item["text"])
        return texts
    return []


def _command_tool_output_succeeded(output: Any) -> bool:
    if not _tool_output_succeeded(output):
        return False
    candidates: list[Any] = [output]
    candidates.extend(_output_text_blocks(output))
    for candidate in candidates:
        if isinstance(candidate, dict):
            parsed = candidate
        elif isinstance(candidate, str):
            text = candidate.strip()
            parsed = None
            for line in reversed(text.splitlines()):
                try:
                    value = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if isinstance(value, dict):
                    parsed = value
                    break
        else:
            parsed = None
        if (
            isinstance(parsed, dict)
            and parsed.get("exit_code") == 0
            and _tool_output_succeeded(parsed)
        ):
            return True
    return False


def _image_tool_output_succeeded(output: Any) -> bool:
    if not _tool_output_succeeded(output):
        return False
    if not isinstance(output, list):
        return False
    return any(
        isinstance(item, dict)
        and str(item.get("type") or "").lower() in {"image", "input_image", "image_content"}
        for item in output
    )


def _read_tool_output_succeeded(output: Any) -> bool:
    if not _tool_output_succeeded(output):
        return False
    return bool(_output_text_blocks(output))


def _legacy_command_tool_output_succeeded(output: Any) -> bool:
    """Kept only to make accidental old callers fail visibly during transition."""
    if isinstance(output, str):
        try:
            output = json.loads(output)
        except json.JSONDecodeError:
            return False
    return (
        isinstance(output, dict)
        and output.get("exit_code") == 0
        and _tool_output_succeeded(output)
    )


def _collect_observed_actions(event: Any, observations: dict[str, Any], *, provider: str) -> None:
    if isinstance(event, list):
        for item in event:
            _collect_observed_actions(item, observations, provider=provider)
        return
    if not isinstance(event, dict):
        return
    kind = event.get("type")
    if kind == "command_execution":
        command = event.get("command")
        completed = event.get("status") == "completed" and event.get("exit_code") == 0
        safe_command = (
            _codex_raw_inner_command(command) if provider == "codex-cli"
            else command if _read_only_command(command) else None
        )
        if completed and safe_command:
            observations["commands"].append(safe_command)
            observations["reads"].extend(
                _resolved_command_read_paths(safe_command, base=ROOT.resolve())
            )
    elif kind in {"tool_use", "function_call", "custom_tool_call"}:
        name = event.get("name")
        if name == "exec" and provider == "codex-cli":
            value = event.get("input")
            image_path = _codex_view_wrapper_path(value)
            commands = _codex_exec_wrapper_commands(value)
            call_id = str(event.get("call_id") or event.get("id") or "")
            if call_id:
                if image_path:
                    observations["_pending_images"][call_id] = image_path
                elif commands:
                    observations["_pending_commands"][call_id] = {
                        "commands": commands,
                        "workdir": _codex_exec_wrapper_workdir(value),
                    }
        elif name in {"Read", "Grep", "Glob"}:
            args = event.get("arguments") or event.get("input") or {}
            try:
                args = json.loads(args) if isinstance(args, str) else args
            except json.JSONDecodeError:
                args = {}
            call_id = str(event.get("call_id") or event.get("id") or "")
            if call_id and isinstance(args, dict):
                path = args.get("file_path") or args.get("path")
                if isinstance(path, str):
                    observations["_pending_reads"][call_id] = path
    elif kind in {"custom_tool_call_output", "tool_result"}:
        call_id = str(event.get("call_id") or event.get("tool_use_id") or event.get("id") or "")
        image_path = observations["_pending_images"].pop(call_id, None)
        command_call = observations["_pending_commands"].pop(call_id, None)
        read_path = observations["_pending_reads"].pop(call_id, None)
        output = event.get("output")
        if output is None and "content" in event:
            output = event.get("content")
        if (
            event.get("is_error") is True
            or event.get("isError") is True
            or str(event.get("status") or "").lower() in {"error", "failed", "failure"}
        ):
            output = {"isError": True}
        if image_path and _image_tool_output_succeeded(output):
            observations["images"].append(image_path)
        if command_call and _command_tool_output_succeeded(output):
            commands = command_call["commands"]
            observations["commands"].extend(commands)
            base = Path(command_call.get("workdir") or ROOT).resolve(strict=False)
            for command in commands:
                observations["reads"].extend(
                    _resolved_command_read_paths(command, base=base)
                )
        if read_path and _read_tool_output_succeeded(output):
            observations["reads"].append(
                str((Path(read_path) if Path(read_path).is_absolute() else ROOT / read_path).resolve(strict=False))
            )
    for value in event.values():
        if isinstance(value, (dict, list)):
            _collect_observed_actions(value, observations, provider=provider)


def _validate_observed_tools(
    event: Any, errors: list[str], *, provider: str = "",
    allowed_roots: tuple[Path, ...] = (),
) -> None:
    """Check both stream tool blocks and persisted provider tool-call records."""
    if isinstance(event, list):
        for item in event:
            _validate_observed_tools(
                item, errors, provider=provider, allowed_roots=allowed_roots,
            )
        return
    if not isinstance(event, dict):
        return
    kind = event.get("type")
    if not isinstance(kind, (str, type(None))):
        errors.append("review execution contains malformed tool evidence")
        return
    if kind == "command_execution":
        command = event.get("command")
        inner = _codex_raw_inner_command(command) if provider == "codex-cli" else command
        safe = bool(
            inner
            and _read_only_command(inner)
            and _command_paths_scoped(
                inner, workdir=None, allowed_roots=allowed_roots,
            )
        )
        if not safe:
            errors.append("review execution contains an unsafe or unverifiable shell command")
    elif kind in {"mcp_tool_call", "web_search", "web_search_call", "file_change"}:
        errors.append("review execution contains a mutating or external tool call")
    elif kind in {"tool_use", "function_call", "custom_tool_call"}:
        name = event.get("name")
        if not isinstance(name, str):
            errors.append("review execution contains malformed tool identity")
            return
        if name == "exec" and provider == "codex-cli":
            commands = _codex_exec_wrapper_commands(
                event.get("input"), allowed_roots=allowed_roots,
            )
            image_path = _codex_view_wrapper_path(event.get("input"))
            if image_path and not _path_is_scoped(
                image_path, allowed_roots, base=ROOT.resolve(),
            ):
                errors.append("review execution reads outside the allowed review roots")
            elif not image_path and (
                not commands or not all(_codex_read_only_sandbox_command(command) for command in commands)
            ):
                errors.append("review execution contains an unsafe or unverifiable Codex exec wrapper")
        elif name in {"exec_command", "functions.exec_command", "shell", "shell_command"}:
            args = event.get("arguments") or event.get("input") or {}
            try:
                args = json.loads(args) if isinstance(args, str) else args
                command = args.get("cmd", args.get("command"))
                if isinstance(command, list):
                    command = shlex.join(command)
                workdir = args.get("workdir") or args.get("cwd")
                safe = bool(
                    _read_only_command(command)
                    and _command_paths_scoped(
                        command, workdir=workdir, allowed_roots=allowed_roots,
                    )
                )
            except (ValueError, AttributeError):
                safe = False
            if not safe:
                errors.append("review execution contains an unsafe or unverifiable shell command")
        elif name in {"Read", "Grep", "Glob", "view_image", "functions.view_image"}:
            args = event.get("arguments") or event.get("input") or {}
            try:
                args = json.loads(args) if isinstance(args, str) else args
            except json.JSONDecodeError:
                args = {}
            if not isinstance(args, dict):
                errors.append("review execution contains malformed path arguments")
            else:
                for key in ("path", "file_path", "cwd", "workdir"):
                    value = args.get(key)
                    if isinstance(value, str) and not _path_is_scoped(
                        value, allowed_roots, base=ROOT.resolve(),
                    ):
                        errors.append("review execution reads outside the allowed review roots")
        else:
            errors.append(f"review execution contains a mutating or external tool call: {name}")
    for value in event.values():
        if isinstance(value, (dict, list)):
            _validate_observed_tools(
                value, errors, provider=provider, allowed_roots=allowed_roots,
            )


def _validate_execution_log(
    execution: dict[str, Any], log_path: Path, errors: list[str], folder: Path,
) -> dict[str, list[str]]:
    provider = str(execution.get("provider") or "")
    observed_model = str(execution.get("observed_model") or "")
    session_id = str(execution.get("session_id") or "")
    saw_matching_init = False
    saw_success = False
    observations: dict[str, Any] = {
        "commands": [], "images": [], "reads": [], "_pending_images": {},
        "_pending_commands": {}, "_pending_reads": {},
    }
    allowed_roots = (ROOT.resolve(), folder.resolve())
    try:
        for line in log_path.read_text(encoding="utf-8").splitlines():
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue
            if not isinstance(event, dict):
                continue
            _collect_observed_actions(event, observations, provider=provider)
            _validate_observed_tools(
                event, errors, provider=provider, allowed_roots=allowed_roots,
            )
            if provider == "codex-cli":
                if event.get("type") == "thread.started" and str(event.get("thread_id") or "") == session_id:
                    saw_matching_init = True
                if event.get("type") == "turn.completed":
                    saw_success = True
            elif provider == "claude-code":
                if event.get("type") == "system" and event.get("subtype") == "init":
                    if str(event.get("model") or "") == observed_model and str(event.get("session_id") or "") == session_id:
                        saw_matching_init = True
                if event.get("type") == "result" and event.get("subtype") == "success" and not event.get("is_error"):
                    saw_success = True
    except OSError:
        errors.append("execution receipt raw log cannot be read")
        return observations
    if provider not in {"claude-code", "codex-cli"}:
        errors.append(f"unsupported execution provider: {provider or 'missing'}")
        return observations
    if not saw_matching_init:
        errors.append("raw execution log lacks matching observed model/session init")
    if not saw_success:
        errors.append("raw execution log lacks a successful terminal result")
    if provider == "codex-cli":
        rollout_text = str(execution.get("rollout_path") or "").strip()
        rollout_path = resolve_path(rollout_text) if rollout_text else None
        if not rollout_path or not rollout_path.is_file() or not execution.get("rollout_sha256"):
            errors.append("Codex execution receipt lacks a readable persisted rollout")
            return observations
        if execution.get("rollout_sha256") != sha256_file(rollout_path):
            errors.append("Codex execution receipt rollout hash mismatch")
            return observations
        rollout_session = False
        rollout_model = False
        try:
            for line in rollout_path.read_text(encoding="utf-8").splitlines():
                event = json.loads(line)
                _collect_observed_actions(event, observations, provider=provider)
                _validate_observed_tools(
                    event, errors, provider=provider, allowed_roots=allowed_roots,
                )
                payload = event.get("payload") or {}
                if event.get("type") == "session_meta" and str(payload.get("id") or "") == session_id:
                    rollout_session = True
                if event.get("type") == "turn_context" and str(payload.get("model") or "") == observed_model:
                    rollout_model = True
        except (OSError, json.JSONDecodeError):
            errors.append("Codex persisted rollout cannot be parsed")
            return observations
        if not rollout_session:
            errors.append("Codex persisted rollout session does not match execution receipt")
        if not rollout_model:
            errors.append("Codex persisted rollout model does not match execution receipt")
        output_text = str(execution.get("model_output_path") or "").strip()
        output_path = resolve_path(output_text) if output_text else None
        if not output_path or not output_path.is_file() or not execution.get("model_output_sha256"):
            errors.append("Codex execution receipt lacks the structured model output")
        elif execution.get("model_output_sha256") != sha256_file(output_path):
            errors.append("Codex execution receipt model output hash mismatch")
        else:
            model_output = load_json(output_path)
            if not isinstance(model_output, dict):
                errors.append("Codex structured model output is not a JSON object")
            else:
                normalized = dict(model_output)
                model_reviewer = dict(normalized.get("reviewer") or {})
                model_reviewer["identity"] = execution.get("actor_identity")
                model_reviewer["actor_type"] = "model"
                model_reviewer["observed_model"] = observed_model
                normalized["reviewer"] = model_reviewer
                response_text = str(execution.get("response_path") or "").strip()
                if not response_text:
                    errors.append("Codex execution receipt lacks normalized response path")
                else:
                    response_payload = load_json(resolve_path(response_text))
                    if response_payload != normalized:
                        errors.append("Codex structured model output does not match normalized review response")
    observations.pop("_pending_images", None)
    observations.pop("_pending_commands", None)
    observations.pop("_pending_reads", None)
    return observations


def _validate_full_release_observations(
    folder: Path,
    packet: dict[str, Any],
    dimensions: dict[str, Any],
    observations: dict[str, list[str]],
    errors: list[str],
) -> None:
    """Require executable evidence before model-declared full visual PASS."""
    if packet.get("review_scope") != "full-release":
        return
    visual_pass = any(
        isinstance(dimensions.get(name), dict)
        and dimensions[name].get("status") == "PASS"
        for name in ("audiovisual_source_alignment", "technical_trust_release")
    )
    if not visual_pass:
        return
    mp4_binding = (packet.get("artifacts") or {}).get("mp4") or {}
    mp4 = resolve_path(str(mp4_binding.get("path") or "")).resolve()
    full_traversal = False
    scene_detection = False
    concat_inspected = False
    concat_path = (folder / "slides_concat.txt").resolve()
    for command in observations.get("commands") or []:
        try:
            args = shlex.split(command)
        except ValueError:
            continue
        if (
            len(args) == 2
            and Path(args[0]).name == "cat"
            and Path(args[1]).resolve() == concat_path
        ):
            concat_inspected = True
        if not args or Path(args[0]).name != "ffmpeg" or "-i" not in args:
            continue
        try:
            candidate = Path(args[args.index("-i") + 1]).resolve()
        except (IndexError, OSError):
            continue
        if candidate != mp4:
            continue
        trimmed = any(flag in args for flag in ("-ss", "-t", "-to", "-frames:v"))
        maps_video = any(
            args[index:index + 2] == ["-map", "0:v:0"]
            for index in range(len(args) - 1)
        )
        has_video = "-vn" not in args and maps_video
        if has_video and not trimmed and args[-3:] == ["-f", "null", "-"] and "-vf" not in args and "-filter:v" not in args:
            full_traversal = True
        for flag in ("-vf", "-filter:v"):
            if has_video and not trimmed and flag in args and args[-3:] == ["-f", "null", "-"]:
                try:
                    value = args[args.index(flag) + 1]
                except IndexError:
                    continue
                if value == r"select=gt(scene\,0.10),showinfo":
                    scene_detection = True
    viewed = {Path(path).resolve() for path in observations.get("images") or []}
    slides = set((folder / "slides").glob("*.png"))
    missing_slides = sorted(str(path) for path in slides if path.resolve() not in viewed)
    if not full_traversal:
        errors.append("full visual PASS lacks an observed complete exact-MP4 full-decode traversal")
    if not scene_detection:
        errors.append("full visual PASS lacks observed whole-file scene detection")
    if not concat_inspected:
        errors.append("full visual PASS lacks observed complete slides_concat.txt inspection")
    if not slides or missing_slides:
        errors.append("full visual PASS lacks observed full-resolution inspection of every rendered slide")


def _validate_declared_artifact_observations(
    folder: Path,
    packet: dict[str, Any],
    dimensions: dict[str, Any],
    observations: dict[str, list[str]],
    errors: list[str],
) -> None:
    """A PASS may cite an artifact only after a successful exact-path read."""
    bindings = packet.get("artifacts") or {}
    read_paths = {Path(path).resolve(strict=False) for path in observations.get("reads") or []}
    viewed_paths = {Path(path).resolve(strict=False) for path in observations.get("images") or []}
    cited: set[str] = set()
    for dimension in dimensions.values():
        if not isinstance(dimension, dict) or dimension.get("status") != "PASS":
            continue
        coverage = dimension.get("coverage") or {}
        artifacts = coverage.get("artifacts") if isinstance(coverage, dict) else []
        if isinstance(artifacts, list):
            cited.update(item for item in artifacts if isinstance(item, str))
    for name in sorted(cited):
        if name == "mp4":
            continue  # Exact decode/traversal is enforced by the visual gate.
        if name == "local_audio_review":
            path = (folder / LOCAL_AUDIO_RECEIPT_NAME).resolve()
        else:
            binding = bindings.get(name)
            if not isinstance(binding, dict):
                errors.append(f"PASS cites an unbound review artifact: {name}")
                continue
            path = resolve_path(str(binding.get("path") or "")).resolve(strict=False)
        observed = path in viewed_paths if name == "contact_sheet" else path in read_paths
        if not observed:
            errors.append(f"PASS lacks an observed successful exact-path read: {name}")


def validate_review_evidence(folder: Path) -> dict[str, Any]:
    folder = folder.resolve()
    packet_path = folder / PACKET_NAME
    response_path = folder / RESPONSE_NAME
    execution_path = folder / EXECUTION_NAME
    packet = load_json(packet_path)
    response = load_json(response_path)
    execution = load_json(execution_path)
    errors: list[str] = []
    warnings: list[str] = []
    observations: dict[str, list[str]] = {"commands": [], "images": [], "reads": []}

    if not isinstance(packet, dict):
        return {
            "present": packet_path.exists() or response_path.exists() or execution_path.exists(),
            "valid": False,
            "verdict": "HOLD",
            "errors": ["missing or invalid review packet"],
        }
    if packet.get("schema_version") != SCHEMA_VERSION:
        errors.append("unsupported packet schema_version")
    review_scope = packet.get("review_scope")
    if review_scope not in {"content-source", "full-release"}:
        errors.append("packet review_scope must be content-source or full-release")
    if review_scope == "full-release" and not packet.get("automated_audio_review"):
        errors.append("full-release packet lacks automated audio binding")
    if not isinstance(response, dict):
        return {
            "present": True,
            "valid": False,
            "verdict": "HOLD",
            "errors": ["missing or invalid review response"],
        }
    if response.get("schema_version") != SCHEMA_VERSION:
        errors.append("unsupported response schema_version")
    if response.get("review_id") != packet.get("review_id"):
        errors.append("response review_id does not match packet")
    packet_sha = sha256_file(packet_path)
    if response.get("packet_sha256") != packet_sha:
        errors.append("response packet_sha256 does not match current packet")

    reviewer = response.get("reviewer")
    if not isinstance(reviewer, dict):
        errors.append("reviewer must be an object")
        reviewer = {}
    identity = str(reviewer.get("identity") or "").strip()
    actor_type = reviewer.get("actor_type")
    if not identity or actor_type != "model":
        errors.append("reviewer must be an observed model execution; human approval path is not implemented")
    if identity == str(packet.get("producer_identity") or "").strip():
        errors.append("reviewer identity matches producer identity; review is not independent")
    if reviewer.get("independence_attestation") is not True:
        errors.append("reviewer independence_attestation is required")
    if reviewer.get("credential_claims"):
        errors.append("model reviewer cannot claim human subject credentials")

    source_packet = load_json(folder / "source_packet.json")
    packet_artifacts = packet.get("artifacts")
    canonical_binding = packet_artifacts.get("canonical_course") if isinstance(packet_artifacts, dict) else {}
    if not isinstance(canonical_binding, dict):
        canonical_binding = {}
    canonical_payload = load_json(resolve_path(str(canonical_binding.get("path") or "")))
    recomputed_holds = detect_academic_holds(
        source_packet if isinstance(source_packet, dict) else {},
        canonical_payload,
    )
    if packet.get("academic_holds") != recomputed_holds:
        errors.append("packet academic holds do not match current canonical source")

    _validate_artifact_bindings(packet, response, errors)
    _validate_automated_audio_review(folder, packet, errors)
    finding_ids = _validate_findings(response, errors)
    dimensions = _validate_dimensions(packet, response, finding_ids, errors)
    if review_scope == "content-source":
        for name in ("audiovisual_source_alignment", "technical_trust_release"):
            if isinstance(dimensions.get(name), dict) and dimensions[name].get("status") == "PASS":
                errors.append(f"content-source review cannot PASS {name}")

    verdict = response.get("verdict")
    if not isinstance(verdict, str) or verdict not in STATUSES:
        errors.append("response verdict must be PASS, REPAIR, or HOLD")
        verdict = "HOLD"
    valid_dimension_objects = [value for value in dimensions.values() if isinstance(value, dict)] if dimensions else []
    dimension_statuses = {str(value.get("status")) for value in valid_dimension_objects} or {"HOLD"}
    if len(valid_dimension_objects) != len(DIMENSIONS):
        dimension_statuses.add("HOLD")
    expected_verdict = "HOLD" if "HOLD" in dimension_statuses else "REPAIR" if "REPAIR" in dimension_statuses else "PASS"
    if verdict != expected_verdict:
        errors.append(f"response verdict {verdict} is inconsistent with dimension verdict {expected_verdict}")
    if packet.get("academic_holds") and verdict != "HOLD":
        errors.append("academic-owner hold cannot be overridden by reviewer PASS/REPAIR")

    if actor_type == "model":
        if not isinstance(execution, dict):
            errors.append("model review lacks execution receipt")
        else:
            if execution.get("schema_version") != SCHEMA_VERSION:
                errors.append("unsupported execution receipt schema_version")
            if execution.get("review_id") != packet.get("review_id"):
                errors.append("execution receipt review_id mismatch")
            if execution.get("packet_sha256") != packet_sha:
                errors.append("execution receipt packet hash mismatch")
            if execution.get("response_sha256") != sha256_file(response_path):
                errors.append("execution receipt response hash mismatch")
            if execution.get("actor_identity") != identity:
                errors.append("execution receipt actor identity mismatch")
            observed_model = str(execution.get("observed_model") or "").strip()
            if not observed_model or not str(execution.get("session_id") or "").strip():
                errors.append("execution receipt lacks observed model or session id")
            if reviewer.get("observed_model") != observed_model:
                errors.append("reviewer observed_model does not match execution receipt")
            log_text = str(execution.get("log_path") or "").strip()
            log_path = resolve_path(log_text) if log_text else None
            if not log_path or not log_path.is_file() or not execution.get("log_sha256"):
                errors.append("execution receipt lacks a readable raw log")
            elif execution.get("log_sha256") != sha256_file(log_path):
                errors.append("execution receipt log hash mismatch")
            else:
                observations = _validate_execution_log(execution, log_path, errors, folder)

    if verdict == "PASS" and any(
        isinstance(f, dict) and isinstance(f.get("severity"), str)
        and f.get("severity") in {"critical", "major", "minor", "repair", "hold"}
        for f in response.get("findings") or []
    ):
        errors.append("PASS response contains blocking findings")
    if not str(response.get("limitations") or "").strip():
        errors.append("response must state review limitations")

    packet_artifacts = packet.get("artifacts")
    mp4_binding = packet_artifacts.get("mp4") if isinstance(packet_artifacts, dict) else {}
    candidate = mp4_binding.get("path") if isinstance(mp4_binding, dict) else None
    if candidate and not isinstance(candidate, str):
        errors.append("candidate MP4 path must be a string")
        candidate = None
    if candidate:
        candidate_path = resolve_path(str(candidate)).resolve()
        if folder not in candidate_path.parents:
            errors.append("candidate MP4 is outside lesson folder")
    _validate_declared_artifact_observations(
        folder, packet, dimensions, observations, errors,
    )
    _validate_full_release_observations(folder, packet, dimensions, observations, errors)
    return {
        "present": True,
        "valid": not errors,
        "verdict": verdict if not errors else "HOLD",
        "errors": errors,
        "warnings": warnings,
        "review_id": packet.get("review_id"),
        "reviewer": reviewer,
        "dimensions": dimensions,
        "findings": response.get("findings") or [],
        "academic_holds": packet.get("academic_holds") or [],
        "candidate_mp4": candidate,
        "packet_sha256": packet_sha,
        "trust_boundary": (
            "The execution receipt binds local output to an observed provider run, raw log hash, and "
            "provider-specific session metadata; "
            "it is not a cryptographic signature and cannot defeat a malicious local file forger."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    prepare = sub.add_parser("prepare")
    prepare.add_argument("target", type=Path)
    prepare.add_argument("--mp4", required=True)
    prepare.add_argument("--producer-identity", required=True)
    prepare.add_argument("--require-local-audio", action="store_true")
    prepare.add_argument("--review-scope", choices=("content-source", "full-release"), default="content-source")
    validate = sub.add_parser("validate")
    validate.add_argument("target", type=Path)
    args = parser.parse_args()

    target = args.target if args.target.is_absolute() else ROOT / args.target
    if args.command == "prepare":
        mp4 = Path(args.mp4)
        mp4 = mp4 if mp4.is_absolute() else target / mp4
        path = write_review_packet(
            target,
            mp4,
            producer_identity=args.producer_identity,
            require_local_audio=args.require_local_audio,
            review_scope=args.review_scope,
        )
        print(path)
        return 0
    result = validate_review_evidence(target)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["valid"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
