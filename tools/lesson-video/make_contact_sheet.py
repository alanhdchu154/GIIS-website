#!/usr/bin/env python3
"""Create a thumbnail contact sheet for a lesson's rendered slide PNGs."""
from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def load_font(size: int):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def make_sheet(folder: Path, columns: int = 4, thumb_w: int = 360) -> Path:
    slides_dir = folder / "slides"
    slides = sorted(slides_dir.glob("*.png"))
    if not slides:
        raise SystemExit(f"no slide PNGs found in {slides_dir}")

    thumb_h = int(thumb_w * 9 / 16)
    label_h = 34
    rows = math.ceil(len(slides) / columns)
    out = Image.new("RGB", (columns * thumb_w, rows * (thumb_h + label_h)), "white")
    d = ImageDraw.Draw(out)
    fnt = load_font(16)

    for i, slide in enumerate(slides):
        x = (i % columns) * thumb_w
        y = (i // columns) * (thumb_h + label_h)
        img = Image.open(slide).convert("RGB")
        img.thumbnail((thumb_w, thumb_h))
        pad_x = x + (thumb_w - img.width) // 2
        pad_y = y + (thumb_h - img.height) // 2
        out.paste(img, (pad_x, pad_y))
        d.rectangle([x, y + thumb_h, x + thumb_w, y + thumb_h + label_h], fill=(245, 245, 245))
        d.text((x + 8, y + thumb_h + 8), slide.name, fill=(0, 0, 0), font=fnt)

    dest = folder / "contact-sheet.jpg"
    out.save(dest, quality=90)
    return dest


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder", help="Lesson folder containing slides/*.png")
    ap.add_argument("--columns", type=int, default=4)
    ap.add_argument("--thumb-width", type=int, default=360)
    args = ap.parse_args()
    dest = make_sheet(Path(args.folder).resolve(), columns=args.columns, thumb_w=args.thumb_width)
    print(dest)


if __name__ == "__main__":
    main()
