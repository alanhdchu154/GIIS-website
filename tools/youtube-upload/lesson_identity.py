"""Shared, stable lesson identity and YouTube title parsing helpers."""
from __future__ import annotations

import re


TITLE_RE = re.compile(
    r"^\s*(?P<course>.+?)(?:\s*[—–]\s*|\s*--\s*|\s+-\s+(?=(?:Module\s+)?\d))"
    r"(?:Module\s+)?(?P<num>\d+)(?:\s*(?::|：|[—–]|--|-)\s*(?P<title>.+?))?\s*$",
    re.IGNORECASE | re.UNICODE,
)


def stable_lesson_identity(course: str, module_number: int) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", str(course).lower()).strip("-")
    if not slug:
        raise ValueError("course title cannot produce a stable upload identity")
    return f"{slug}:{int(module_number)}"


def parse_lesson_title(title: str) -> tuple[str, int, str] | None:
    """Return ``(course, module_number, module_title)`` for a lesson title."""
    match = TITLE_RE.match(title)
    if not match:
        return None
    return (
        match.group("course").strip(),
        int(match.group("num")),
        (match.group("title") or "").strip(),
    )
