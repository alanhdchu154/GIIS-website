"""Strict validation for GIIS lesson-video upload approvals."""
from __future__ import annotations

import json
import hashlib
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "lesson-video"))
from video_review_evidence import SCHEMA_VERSION, validate_review_evidence  # noqa: E402
from local_audio_review import (  # noqa: E402
    SCHEMA_VERSION as LOCAL_AUDIO_SCHEMA_VERSION,
    validate_local_audio_review,
)


REQUIRED_APPROVAL_FIELDS = (
    "slug", "path", "quality_score", "verdict", "approved_by", "approved_at",
    "review_id", "review_schema_version", "review_packet_sha256",
    "candidate_mp4", "candidate_mp4_sha256",
    "local_audio_schema_version", "local_audio_receipt_sha256",
    "local_audio_model_sha256",
)


def sha256_file(path: Path) -> str | None:
    try:
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()
    except OSError:
        return None


def is_clean_approval_row(row: Any) -> bool:
    """Only full clean-pass approval rows may unlock unattended upload."""
    if not isinstance(row, dict):
        return False
    if any(not row.get(field) for field in REQUIRED_APPROVAL_FIELDS):
        return False
    if row.get("verdict") != "pass":
        return False
    if row.get("review_schema_version") != SCHEMA_VERSION:
        return False
    try:
        return int(row.get("quality_score")) >= 100
    except (TypeError, ValueError):
        return False


def approved_candidate_mp4(
    row: Any,
    *,
    root: Path = ROOT,
    lesson_dir: Path | None = None,
) -> Path | None:
    """Return the exact still-valid candidate; never infer from folder contents."""
    if not is_clean_approval_row(row):
        return None
    lesson = (root / str(row["path"])).resolve()
    if lesson_dir is not None and lesson != lesson_dir.resolve():
        return None
    candidate = Path(str(row["candidate_mp4"]))
    candidate = candidate if candidate.is_absolute() else root / candidate
    candidate = candidate.resolve()
    if lesson not in candidate.parents or candidate.name == "":
        return None
    if sha256_file(candidate) != row.get("candidate_mp4_sha256"):
        return None
    evidence = validate_review_evidence(lesson)
    if not evidence.get("valid") or evidence.get("verdict") != "PASS":
        return None
    if evidence.get("review_id") != row.get("review_id"):
        return None
    if evidence.get("packet_sha256") != row.get("review_packet_sha256"):
        return None
    evidence_candidate = Path(str(evidence.get("candidate_mp4") or "")).resolve()
    if evidence_candidate != candidate:
        return None
    audio = validate_local_audio_review(lesson, expected_mp4=candidate)
    if not audio.get("valid") or audio.get("status") != "PASS":
        return None
    if row.get("local_audio_schema_version") != LOCAL_AUDIO_SCHEMA_VERSION:
        return None
    if audio.get("receipt_sha256") != row.get("local_audio_receipt_sha256"):
        return None
    if audio.get("model_sha256") != row.get("local_audio_model_sha256"):
        return None
    return candidate


def approved_rows(path: Path, *, root: Path = ROOT) -> dict[str, dict[str, Any]]:
    try:
        payload = json.loads(path.read_text())
    except Exception:
        return {}
    rows = payload.get("approved_ready_to_upload", payload.get("ready_to_upload", [])) if isinstance(payload, dict) else payload
    if not isinstance(rows, list):
        return {}
    approved: dict[str, dict[str, Any]] = {}
    for row in rows:
        if approved_candidate_mp4(row, root=root) is not None:
            approved[str(row["slug"])] = row
    return approved


def approved_slugs(path: Path) -> set[str]:
    return set(approved_rows(path))
