"""Canonical ordering helpers for the public lesson manifest."""
from __future__ import annotations

from collections.abc import Iterable
from typing import Any


def _text(value: Any) -> str:
    return str(value or "").strip().casefold()


def lesson_sort_key(row: dict[str, Any]) -> tuple[Any, ...]:
    try:
        module_number = int(row.get("module_number"))
    except (TypeError, ValueError):
        module_number = None
    has_no_module_number = module_number is None
    return (
        _text(row.get("course")),
        has_no_module_number,
        module_number or 0,
        _text(row.get("module_title")),
        _text(row.get("youtube_id")),
        _text(row.get("lesson_dir")),
    )


def canonical_manifest_rows(
    rows: Iterable[dict[str, Any]],
) -> tuple[dict[str, list[dict[str, Any]]], list[dict[str, Any]]]:
    """Return alphabetic courses and stable module ordering.

    The YouTube uploads playlist is newest-first, so insertion order changes as
    new lessons arrive. Sorting before serialization keeps routine syncs from
    rewriting most of the public manifest.
    """
    lessons = sorted(rows, key=lesson_sort_key)
    by_course: dict[str, list[dict[str, Any]]] = {}
    for row in lessons:
        by_course.setdefault(str(row.get("course") or ""), []).append(row)
    return by_course, lessons
