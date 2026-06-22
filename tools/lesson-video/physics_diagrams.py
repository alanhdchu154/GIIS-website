"""Reusable deterministic physics diagrams for GIIS lesson slides.

These helpers are intentionally small PIL primitives. Generated lesson
`build_slides.py` files can import them from the same directory as
`slide_kit.py`, which keeps precision physics visuals deterministic while
reducing repeated per-module diagram code.
"""
from __future__ import annotations

import math
from collections.abc import Iterable, Sequence
from typing import Any

from PIL import ImageDraw

from slide_kit import (
    GOLD,
    H,
    INK,
    MAROON,
    MAROON_DARK,
    MUTED,
    NAVY,
    PARCHMENT,
    RED,
    TEAL,
    TEAL_LIGHT,
    W,
    font,
)

Point = tuple[float, float]


def _arrow_head(start: Point, end: Point, size: int = 24) -> list[tuple[float, float]]:
    sx, sy = start
    ex, ey = end
    angle = math.atan2(ey - sy, ex - sx)
    left = angle + math.pi * 0.82
    right = angle - math.pi * 0.82
    return [
        (ex, ey),
        (ex + size * math.cos(left), ey + size * math.sin(left)),
        (ex + size * math.cos(right), ey + size * math.sin(right)),
    ]


def arrow(
    d: ImageDraw.ImageDraw,
    start: Point,
    end: Point,
    *,
    color=MAROON,
    width: int = 6,
    label: str | None = None,
    label_offset: tuple[int, int] = (16, -42),
    label_size: int = 28,
    head_size: int = 24,
) -> None:
    """Draw a labeled arrow with a stable arrowhead."""
    d.line([start, end], fill=color, width=width)
    d.polygon(_arrow_head(start, end, head_size), fill=color)
    if label:
        ex, ey = end
        dx, dy = label_offset
        d.text((ex + dx, ey + dy), label, fill=color, font=font("sans_bold", label_size))


def sine_points(
    x0: float,
    x1: float,
    y_center: float,
    *,
    amplitude: float = 70,
    wavelength: float = 360,
    phase: float = 0.0,
    samples: int = 240,
) -> list[tuple[float, float]]:
    """Return points for a sine wave between x0 and x1."""
    return [
        (
            x0 + (x1 - x0) * i / samples,
            y_center + amplitude * math.sin(((x0 + (x1 - x0) * i / samples) - x0) / wavelength * 2 * math.pi + phase),
        )
        for i in range(samples + 1)
    ]


def draw_sine_wave(
    d: ImageDraw.ImageDraw,
    x0: float,
    x1: float,
    y_center: float,
    *,
    amplitude: float = 70,
    wavelength: float = 360,
    phase: float = 0.0,
    color=TEAL,
    width: int = 5,
    samples: int = 240,
) -> list[tuple[float, float]]:
    """Draw and return a deterministic sine-wave trace."""
    pts = sine_points(
        x0,
        x1,
        y_center,
        amplitude=amplitude,
        wavelength=wavelength,
        phase=phase,
        samples=samples,
    )
    d.line(pts, fill=color, width=width)
    return pts


def draw_wave_property_diagram(
    d: ImageDraw.ImageDraw,
    *,
    x: int = 180,
    y_center: int = 400,
    width_px: int = 760,
    amplitude: int = 86,
    wavelength: int = 410,
    color=TEAL,
) -> None:
    """Draw a sine wave with amplitude and wavelength annotations."""
    draw_sine_wave(d, x, x + width_px, y_center, amplitude=amplitude, wavelength=wavelength, color=color)
    peak_x = x + wavelength // 4
    d.line([(peak_x, y_center), (peak_x, y_center - amplitude)], fill=MAROON, width=3)
    d.line([(peak_x, y_center), (peak_x, y_center + amplitude)], fill=MAROON, width=3)
    d.text((peak_x + 20, y_center - amplitude - 18), "amplitude", fill=MAROON, font=font("sans_bold", 24))
    lam_y = y_center + amplitude + 88
    d.line([(x, lam_y), (x + wavelength, lam_y)], fill=NAVY, width=3)
    arrow(d, (x + 18, lam_y), (x, lam_y), color=NAVY, width=2, head_size=12)
    arrow(d, (x + wavelength - 18, lam_y), (x + wavelength, lam_y), color=NAVY, width=2, head_size=12)
    d.text((x + wavelength / 2 - 74, lam_y + 16), "wavelength", fill=NAVY, font=font("sans_bold", 24))


def draw_doppler_wavefronts(
    d: ImageDraw.ImageDraw,
    *,
    source: tuple[int, int] = (900, 590),
    emission_xs: Sequence[int] | None = None,
    radii: Sequence[int] = (350, 260, 170, 80),
    wave_color=TEAL,
    source_color=MAROON,
) -> None:
    """Draw compressed/stretched wavefronts for a moving source."""
    cx_src, cy_src = source
    if emission_xs is None:
        emission_xs = [cx_src - 240, cx_src - 160, cx_src - 80, cx_src]
    for cx_e, radius in zip(emission_xs, radii):
        d.ellipse(
            [cx_e - radius, cy_src - radius, cx_e + radius, cy_src + radius],
            outline=wave_color,
            width=4,
        )
    sr = 22
    d.ellipse(
        [cx_src - sr, cy_src - sr, cx_src + sr, cy_src + sr],
        fill=source_color,
        outline=MAROON_DARK,
        width=3,
    )
    d.text((cx_src + 36, cy_src - 18), "source", fill=source_color, font=font("sans_bold", 28))
    arrow(d, (cx_src + 44, cy_src), (cx_src + 170, cy_src), color=source_color, width=6, label="motion", label_size=24)


def draw_interference_panel(
    d: ImageDraw.ImageDraw,
    *,
    x_left: int = 290,
    x_right: int = 1700,
    y_rows: tuple[int, int, int] = (378, 618, 846),
    wavelength: int = 410,
    amplitude: int = 66,
    colors: tuple[Any, Any, Any] = (TEAL, NAVY, MAROON),
) -> None:
    """Draw two out-of-phase waves and their cancelled sum."""
    y1, y2, y3 = y_rows
    c1, c2, c3 = colors
    d.text((110, y1 - 30), "Wave 1", fill=c1, font=font("sans_bold", 28))
    d.text((110, y2 - 30), "Wave 2", fill=c2, font=font("sans_bold", 28))
    d.text((110, y3 - 14), "Sum", fill=c3, font=font("sans_bold", 28))
    draw_sine_wave(d, x_left, x_right, y1, amplitude=amplitude, wavelength=wavelength, phase=0, color=c1, width=4, samples=400)
    draw_sine_wave(d, x_left, x_right, y2, amplitude=amplitude, wavelength=wavelength, phase=math.pi, color=c2, width=4, samples=400)
    d.line([(x_left, y3), (x_right, y3)], fill=c3, width=5)
    d.text((x_right + 14, y3 - 16), "= 0", fill=c3, font=font("sans_bold", 30))
    for y_c, col in [(y1, c1), (y2, c2)]:
        for xi in range(x_left, x_right, 22):
            d.line([(xi, y_c), (min(xi + 11, x_right), y_c)], fill=col, width=1)


def draw_circular_motion_diagram(
    d: ImageDraw.ImageDraw,
    *,
    center: tuple[int, int] = (960, 580),
    radius: int = 240,
    object_label: str = "object",
    force_label: str = "F (inward)",
    velocity_label: str = "v",
) -> None:
    """Draw circular path, object, inward force, and tangent velocity."""
    cx, cy = center
    d.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=TEAL, width=6)
    d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=MUTED)
    d.text((cx + 16, cy - 20), "center", fill=MUTED, font=font("sans", 24))
    ox, oy = cx + radius, cy
    obj_r = 22
    d.ellipse([ox - obj_r, oy - obj_r, ox + obj_r, oy + obj_r], fill=TEAL, outline=MAROON, width=4)
    d.text((ox + 36, oy - 14), object_label, fill=INK, font=font("sans_bold", 28))
    arrow(d, (ox - obj_r, oy), (cx + 68, oy), color=MAROON, width=8, label=force_label, label_offset=(32, -46))
    arrow(d, (ox, oy - obj_r), (ox, oy - 130), color=NAVY, width=6, label=velocity_label, label_offset=(36, -6), label_size=36)


def draw_step_rows(
    d: ImageDraw.ImageDraw,
    rows: Iterable[tuple[str, str, Any]],
    *,
    x: int = 110,
    y: int = 250,
    row_w: int = W - 220,
    row_h: int = 96,
    label_w: int = 220,
    gap: int = 18,
) -> None:
    """Draw stable worked-example rows: label, expression/body, accent color."""
    f_label = font("sans_bold", 28)
    f_body = font("mono", 34)
    for label, body, color in rows:
        d.rounded_rectangle([x, y, x + row_w, y + row_h - 14], radius=12, fill=PARCHMENT, outline=color, width=3)
        d.text((x + 38, y + 22), label, fill=MUTED, font=f_label)
        d.text((x + label_w, y + 22), body, fill=color, font=f_body)
        y += row_h + gap

