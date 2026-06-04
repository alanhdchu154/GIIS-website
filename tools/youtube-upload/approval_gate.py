"""Strict validation for GIIS lesson-video upload approvals."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


REQUIRED_APPROVAL_FIELDS = ("slug", "path", "quality_score", "verdict", "approved_by", "approved_at")


def is_clean_approval_row(row: Any) -> bool:
    """Only full clean-pass approval rows may unlock unattended upload."""
    if not isinstance(row, dict):
        return False
    if any(not row.get(field) for field in REQUIRED_APPROVAL_FIELDS):
        return False
    if row.get("verdict") != "pass":
        return False
    try:
        return int(row.get("quality_score")) >= 100
    except (TypeError, ValueError):
        return False


def approved_slugs(path: Path) -> set[str]:
    try:
        payload = json.loads(path.read_text())
    except Exception:
        return set()
    rows = payload.get("approved_ready_to_upload", payload.get("ready_to_upload", [])) if isinstance(payload, dict) else payload
    return {str(row["slug"]) for row in rows or [] if is_clean_approval_row(row)}
