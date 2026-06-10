"""Algebra I - Module 10 (V2): Writing Linear Equations.

Foundation V2 build. Every precision visual - templates, substitutions,
coordinate planes, plotted points, slope/point annotations, and
algebra steps - is drawn deterministically. No generated images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, GRID, CREAM,
)

deck = Deck(course="Algebra I", module_num=10,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# ─── helper: a small coordinate plane with grid + axes + ticks ───
def coord_plane(d, *, ox, oy, cell, xmin, xmax, ymin, ymax,
                show_ticks=True, tick_font_size=22):
    """Draw a coordinate plane. Returns gx(), gy() pixel mappers."""
    def gx(x): return ox + x * cell
    def gy(y): return oy - y * cell
    for x in range(xmin, xmax + 1):
        d.line([(gx(x), gy(ymin)), (gx(x), gy(ymax))], fill=GRID, width=2)
    for y in range(ymin, ymax + 1):
        d.line([(gx(xmin), gy(y)), (gx(xmax), gy(y))], fill=GRID, width=2)
    d.line([(gx(xmin), gy(0)), (gx(xmax), gy(0))], fill=INK, width=4)
    d.line([(gx(0), gy(ymin)), (gx(0), gy(ymax))], fill=INK, width=4)
    d.text((gx(xmax) + 14, gy(0) - 16), "x", fill=INK, font=font("serif_bold", 36))
    d.text((gx(0) - 34, gy(ymax) - 44), "y", fill=INK, font=font("serif_bold", 36))
    if show_ticks:
        ft = font("sans", tick_font_size)
        for x in range(xmin, xmax + 1):
            if x == 0:
                continue
            label = str(x)
            tw = d.textlength(label, font=ft)
            d.text((gx(x) - tw / 2, gy(0) + 8), label, fill=MUTED, font=ft)
        for y in range(ymin, ymax + 1):
            if y == 0:
                continue
            label = str(y)
            tw = d.textlength(label, font=ft)
            d.text((gx(0) - tw - 10, gy(y) - tick_font_size // 2), label,
                   fill=MUTED, font=ft)
    return gx, gy


def plot_line(d, *, gx, gy, m, b, xmin, xmax, color=MAROON, width=6):
    """Plot y = m x + b across [xmin, xmax]."""
    d.line([(gx(xmin), gy(m * xmin + b)), (gx(xmax), gy(m * xmax + b))],
           fill=color, width=width)


def plot_point(d, *, gx, gy, x, y, color=MAROON_DARK, r=10, label=None,
               label_color=INK, label_offset=(14, -34), label_size=26):
    d.ellipse([gx(x) - r, gy(y) - r, gx(x) + r, gy(y) + r],
              fill=color, outline=CREAM, width=3)
    if label:
        d.text((gx(x) + label_offset[0], gy(y) + label_offset[1]),
               label, fill=label_color, font=font("mono", label_size))


# 01 — title
deck.title("01_title", "Algebra I",
           "Module 10 - Writing Linear Equations",
           "Foundation lesson  -  ~6 minutes")


# 02 — hook: a draining pool gives one point + one rate -> one line
def hook(img, d):
    d.text((110, 90), "One point + one rate  =  one line.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 180),
           "Pool:   30 inches of water,   drains 2 inches per hour.",
           fill=MUTED, font=font("sans", 34))
    d.text((110, 230),
           "depth  d  =  -2 t  +  30      (t = hours since start)",
           fill=INK, font=font("mono", 36))

    # coordinate plane: t in [0, 15], d in [0, 32]
    ox, oy = 240, 880
    cell_t = 80
    cell_d = 18
    xmax_t = 15
    ymax_d = 32
    for t in range(0, xmax_t + 1, 1):
        d.line([(ox + t * cell_t, oy), (ox + t * cell_t, oy - ymax_d * cell_d)],
               fill=GRID, width=2)
    for dv in range(0, ymax_d + 1, 4):
        d.line([(ox, oy - dv * cell_d), (ox + xmax_t * cell_t, oy - dv * cell_d)],
               fill=GRID, width=2)
    d.line([(ox, oy), (ox + xmax_t * cell_t, oy)], fill=INK, width=4)
    d.line([(ox, oy), (ox, oy - ymax_d * cell_d)], fill=INK, width=4)
    ft = font("sans", 22)
    for t in range(0, xmax_t + 1, 3):
        label = str(t)
        tw = d.textlength(label, font=ft)
        d.text((ox + t * cell_t - tw / 2, oy + 10), label, fill=MUTED, font=ft)
    for dv in range(0, ymax_d + 1, 4):
        label = f"{dv}\""
        tw = d.textlength(label, font=ft)
        d.text((ox - tw - 12, oy - dv * cell_d - 12), label, fill=MUTED, font=ft)
    d.text((ox + xmax_t * cell_t + 20, oy - 30), "hours (t)",
           fill=INK, font=font("serif_bold", 28))
    d.text((ox - 60, oy - ymax_d * cell_d - 50), "depth d",
           fill=INK, font=font("serif_bold", 28))
    # line d = -2t + 30 across t in [0, 15] -> (0, 30) to (15, 0)
    def cy(t): return oy - max(0, (-2 * t + 30)) * cell_d
    def cx(t): return ox + t * cell_t
    d.line([(cx(0), cy(0)), (cx(15), cy(15))], fill=MAROON, width=7)

    # (0, 30) y-intercept callout
    yx, yy = cx(0), cy(0)
    d.ellipse([yx - 12, yy - 12, yx + 12, yy + 12], fill=MAROON_DARK,
              outline=CREAM, width=3)
    d.text((yx + 18, yy - 8), "(0, 30)  -  starting depth",
           fill=deck.accent, font=font("sans_bold", 26))

    # slope arrow showing -2 per hour
    px, py = cx(5), cy(5)
    d.ellipse([px - 12, py - 12, px + 12, py + 12], fill=MAROON_DARK,
              outline=CREAM, width=3)
    d.line([(px, py), (px + 80, py - 90)], fill=deck.accent, width=4)
    d.rounded_rectangle([px + 70, py - 180, px + 380, py - 70], radius=14,
                        outline=deck.accent, width=4, fill=deck.accent_light)
    d.text((px + 88, py - 165), "slope  =  -2",
           fill=MAROON_DARK, font=font("serif_bold", 28))
    d.text((px + 88, py - 122), "(2 in / hour)",
           fill=MAROON_DARK, font=font("mono", 24))

    d.text((110, 960),
           "You have one point and one rate.   That is enough to write the line.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "Slope-intercept  -  y = m x + b   (slope and y-intercept).",
    "Point-slope     -  y - y1 = m (x - x1)   (slope and any point).",
    "Standard form   -  A x + B y = C   (integer coefficients).",
], footnote="Same line.  Three costumes.  Pick the one that fits the info you have.")


# 04 — concept: pick the form that matches the info
def concept(img, d):
    d.text((110, 90), "Writing  =  encoding what you know.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 190),
           "Match the form to the information you already have about the line.",
           fill=MUTED, font=font("sans", 32))

    d.rounded_rectangle([110, 280, W - 110, 870], radius=22,
                        outline=MAROON, width=5, fill=deck.card_bg)

    # header row
    d.rounded_rectangle([150, 310, W - 150, 400], radius=14,
                        outline=MAROON, width=3, fill=deck.accent_light)
    d.text((180, 330), "If you know...", fill=MAROON_DARK,
           font=font("serif_bold", 32))
    d.text((720, 330), "Use this form", fill=MAROON_DARK,
           font=font("serif_bold", 32))
    d.text((1320, 330), "Template", fill=MAROON_DARK,
           font=font("serif_bold", 32))

    rows = [
        ("slope  +  y-intercept",   "slope-intercept", "y = m x + b"),
        ("slope  +  any point",      "point-slope",     "y - y1 = m (x - x1)"),
        ("integer coefficients",     "standard",        "A x + B y = C"),
    ]
    y = 430
    for known, form, template in rows:
        d.rounded_rectangle([150, y, W - 150, y + 130], radius=14,
                            outline=MAROON, width=2, fill=deck.bg)
        d.text((180, y + 40), known, fill=INK, font=font("sans", 30))
        d.text((720, y + 40), form, fill=deck.accent, font=font("serif_bold", 32))
        d.text((1320, y + 40), template, fill=INK, font=font("mono", 30))
        y += 145

    d.text((110, 930),
           "Same line in every row  -  but the costume changes with what you start from.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("04_concept", concept)


# 05 — slope-intercept worked example: m=2, b=-3 -> y = 2x - 3
def slope_intercept_eq(img, d):
    d.text((110, 90), "Form 1  -  slope-intercept.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 190),
           "Given slope and y-intercept,  substitute straight into  y = m x + b.",
           fill=MUTED, font=font("sans", 32))

    # left card: given + substitution steps
    d.rounded_rectangle([110, 280, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 305), "Given",
           fill=MAROON, font=font("serif_bold", 36))
    d.text((150, 365), "slope   m  =  2",
           fill=INK, font=font("mono", 36))
    d.text((150, 415), "y-intercept   b  =  -3",
           fill=INK, font=font("mono", 36))

    d.text((150, 510), "Plug into  y = m x + b",
           fill=deck.accent, font=font("serif_bold", 34))
    d.text((180, 580), "y  =  (2) x  +  (-3)",
           fill=INK, font=font("mono", 36))
    d.text((180, 640), "y  =  2 x  -  3",
           fill=MAROON_DARK, font=font("mono", 44))
    d.text((150, 740), "Done.  No algebra  -  just substitution.",
           fill=MUTED, font=font("sans", 28))

    # right: plot the line y = 2x - 3 with (0, -3) marked
    ox, oy = 1100, 700
    cell = 65
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-2, xmax=5, ymin=-6, ymax=4)
    plot_line(d, gx=gx, gy=gy, m=2, b=-3, xmin=-1, xmax=4)
    plot_point(d, gx=gx, gy=gy, x=0, y=-3, label="(0, -3)  b",
               label_offset=(14, 14), label_size=22)
    plot_point(d, gx=gx, gy=gy, x=1, y=-1, label="(1, -1)",
               label_offset=(14, -34), label_size=22)
    # rise/run staircase
    d.line([(gx(0), gy(-3)), (gx(1), gy(-3))], fill=deck.accent, width=5)
    d.line([(gx(1), gy(-3)), (gx(1), gy(-1))], fill=deck.accent, width=5)
    d.text((gx(0) + 6, gy(-3) + 10), "run 1", fill=deck.accent,
           font=font("sans_bold", 22))
    d.text((gx(1) + 8, gy(-2) - 14), "rise 2", fill=deck.accent,
           font=font("sans_bold", 22))

    d.text((110, 930),
           "Template + numbers in,   equation out.   y = 2x - 3.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("05_slope_intercept_eq", slope_intercept_eq)


# 06 — point-slope worked example: slope 4, point (3, -2)
def point_slope_eq(img, d):
    d.text((110, 90), "Form 2  -  point-slope.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 190),
           "Have slope and a point that is not (0, b)?   Use  y - y1 = m (x - x1).",
           fill=MUTED, font=font("sans", 30))

    # left card: given + plug-in
    d.rounded_rectangle([110, 280, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 305), "Given",
           fill=MAROON, font=font("serif_bold", 36))
    d.text((150, 365), "slope   m  =  4",
           fill=INK, font=font("mono", 36))
    d.text((150, 415), "point   (x1, y1)  =  (3, -2)",
           fill=INK, font=font("mono", 36))

    d.text((150, 510), "Plug into  y - y1 = m (x - x1)",
           fill=deck.accent, font=font("serif_bold", 32))
    d.text((180, 580), "y - (-2)  =  4 (x - 3)",
           fill=INK, font=font("mono", 36))
    d.text((180, 640), "y + 2  =  4 (x - 3)",
           fill=MAROON_DARK, font=font("mono", 44))

    d.text((150, 740), "Inner sign:   y - (-2)  becomes  y + 2.",
           fill=MUTED, font=font("sans", 28))
    d.text((150, 780), "Do not drop the inner minus.",
           fill=RED, font=font("sans_bold", 28))

    # right: plot the line through (3, -2) with slope 4, and mark the point
    ox, oy = 1100, 700
    cell = 65
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-1, xmax=5, ymin=-6, ymax=4)
    # y = 4x - 14, but we only show the local segment near the point
    plot_line(d, gx=gx, gy=gy, m=4, b=-14, xmin=2, xmax=4)
    plot_point(d, gx=gx, gy=gy, x=3, y=-2, label="(3, -2)  point",
               label_offset=(14, -34), label_size=22)
    # slope arrow: rise 4, run 1 from (3,-2) to (4, 2)
    d.line([(gx(3), gy(-2)), (gx(4), gy(-2))], fill=deck.accent, width=5)
    d.line([(gx(4), gy(-2)), (gx(4), gy(2))], fill=deck.accent, width=5)
    d.text((gx(3) + 6, gy(-2) + 10), "run 1", fill=deck.accent,
           font=font("sans_bold", 22))
    d.text((gx(4) + 8, gy(0) - 14), "rise 4", fill=deck.accent,
           font=font("sans_bold", 22))

    d.text((110, 930),
           "y + 2  =  4 (x - 3).   Same line  -  starting from the point we have.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("06_point_slope_eq", point_slope_eq)


# 07 — pause 1
deck.pause("07_pause1", "PAUSE  &  TRY  #1",
           "Slope = 3.   Line passes through (2, 1).   Write it.",
           "y - y1 = m (x - x1)",
           hint="Point-slope first.   Then distribute and isolate y for slope-intercept.")


# 08 — pause 1 answer reveal
def pause1_answer(img, d):
    d.text((110, 90), "Answer:  point-slope  ->  slope-intercept.",
           fill=MAROON, font=font("serif_bold", 52))
    d.text((110, 175),
           "Plug the slope and the point into the template,  then simplify.",
           fill=INK, font=font("sans", 30))

    # left card: the algebra steps
    d.rounded_rectangle([110, 260, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 285), "Given",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((150, 340), "slope  m = 3,   point  (2, 1)",
           fill=INK, font=font("mono", 32))

    d.text((150, 420), "Point-slope",
           fill=deck.accent, font=font("serif_bold", 32))
    d.text((180, 480), "y - 1  =  3 (x - 2)",
           fill=MAROON_DARK, font=font("mono", 36))

    d.text((150, 570), "Distribute",
           fill=deck.accent, font=font("serif_bold", 32))
    d.text((180, 630), "y - 1  =  3 x  -  6",
           fill=INK, font=font("mono", 34))

    d.text((150, 720), "Add 1 to both sides",
           fill=deck.accent, font=font("serif_bold", 32))
    d.text((180, 780), "y  =  3 x  -  5",
           fill=MAROON_DARK, font=font("mono", 42))

    # right: plot y = 3x - 5 and mark (2, 1) and the y-intercept (0, -5)
    ox, oy = 1100, 700
    cell = 60
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-1, xmax=5, ymin=-6, ymax=4)
    plot_line(d, gx=gx, gy=gy, m=3, b=-5, xmin=0, xmax=4)
    plot_point(d, gx=gx, gy=gy, x=2, y=1, label="(2, 1)  given",
               label_offset=(14, -34), label_size=22)
    plot_point(d, gx=gx, gy=gy, x=0, y=-5, label="(0, -5)  b",
               label_offset=(14, 14), label_size=22)

    d.text((110, 930),
           "Same line:   y - 1 = 3 (x - 2)   <=>   y = 3 x - 5.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("08_pause1_silence", pause1_answer)


# 09 — two-points: compute slope, then use point-slope
def two_points_eq(img, d):
    d.text((110, 90), "Two points?   Compute the slope first.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 190),
           "Line through  (-1, 2)  and  (3, -6).   Slope first,  then point-slope.",
           fill=MUTED, font=font("sans", 30))

    # left card: slope computation + writing
    d.rounded_rectangle([110, 280, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 305), "Step 1   -   slope",
           fill=MAROON, font=font("serif_bold", 34))
    d.text((180, 365), "m  =  (y2 - y1) / (x2 - x1)",
           fill=INK, font=font("mono", 32))
    d.text((180, 415), "m  =  (-6 - 2) / (3 - (-1))",
           fill=INK, font=font("mono", 32))
    d.text((180, 465), "m  =  -8 / 4   =   -2",
           fill=MAROON_DARK, font=font("mono", 34))

    d.text((150, 555), "Step 2   -   point-slope  (use  (-1, 2))",
           fill=MAROON, font=font("serif_bold", 30))
    d.text((180, 615), "y - 2  =  -2 (x - (-1))",
           fill=INK, font=font("mono", 32))
    d.text((180, 665), "y - 2  =  -2 (x + 1)",
           fill=INK, font=font("mono", 32))

    d.text((150, 740), "Step 3   -   simplify",
           fill=MAROON, font=font("serif_bold", 30))
    d.text((180, 800), "y  =  -2 x  +  0   ->   y = -2 x",
           fill=MAROON_DARK, font=font("mono", 32))

    # right: plot the line through the two points
    ox, oy = 1100, 700
    cell = 60
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-3, xmax=5, ymin=-7, ymax=4)
    plot_line(d, gx=gx, gy=gy, m=-2, b=0, xmin=-2, xmax=4)
    plot_point(d, gx=gx, gy=gy, x=-1, y=2, label="(-1, 2)",
               label_offset=(14, -34), label_size=22)
    plot_point(d, gx=gx, gy=gy, x=3, y=-6, label="(3, -6)",
               label_offset=(14, 14), label_size=22)

    d.text((110, 930),
           "Two points  ->  slope  ->  point-slope  ->  slope-intercept.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("09_two_points_eq", two_points_eq)


# 10 — standard form: convert y = (2/3)x + 4 -> 2x - 3y = -12
def standard_form_eq(img, d):
    d.text((110, 90), "Form 3  -  standard form.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 190),
           "A x + B y = C   with integer A, B, C and A not negative.",
           fill=MUTED, font=font("sans", 32))

    d.rounded_rectangle([110, 280, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 310), "Start  -  slope-intercept",
           fill=MAROON, font=font("serif_bold", 34))
    d.text((180, 370), "y  =  (2/3) x  +  4",
           fill=INK, font=font("mono", 38))

    d.text((150, 460), "Step 1   -   clear the fraction  (multiply by 3)",
           fill=deck.accent, font=font("serif_bold", 30))
    d.text((180, 520), "3 y  =  2 x  +  12",
           fill=INK, font=font("mono", 36))

    d.text((150, 600), "Step 2   -   move the x-term over",
           fill=deck.accent, font=font("serif_bold", 30))
    d.text((180, 660), "-2 x  +  3 y  =  12",
           fill=INK, font=font("mono", 36))

    d.text((150, 740), "Step 3   -   flip signs so  A  is positive",
           fill=deck.accent, font=font("serif_bold", 30))
    d.text((180, 800), "2 x  -  3 y  =  -12",
           fill=MAROON_DARK, font=font("mono", 42))

    d.text((110, 930),
           "Same line.   y = (2/3)x + 4   <=>   2x - 3y = -12.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("10_standard_form", standard_form_eq)


# 11 — compare: the inner-sign trap in point-slope
deck.compare("11_compare", "The trap  -  do not drop the inner minus.",
    left={
        "label": "X DON'T DO",
        "color": RED,
        "lines": [
            "Slope 4,  point (3, -2):",
            "",
            "y - y1 = m (x - x1)",
            "y - 2 = 4 (x - 3)    <- wrong",
            "",
            "Treated y1 = -2 as y1 = 2",
            "by 'dropping' the minus.",
            "",
            "Line ends up shifted up by 4.",
        ],
        "footnote": "y1 has its own sign  -  carry it in.",
    },
    right={
        "label": "+ DO",
        "color": MAROON,
        "lines": [
            "Slope 4,  point (3, -2):",
            "",
            "y - y1 = m (x - x1)",
            "y - (-2) = 4 (x - 3)",
            "y + 2 = 4 (x - 3)",
            "",
            "Minus minus  =  plus.",
            "",
            "Line goes through (3, -2).",
        ],
        "footnote": "Plug the point in literally,  then simplify.",
    },
)


# 12 — pause 2
deck.pause("12_pause2", "PAUSE  &  TRY  #2",
           "Line through  (1, -3)  and  (3, 5).   Write it in slope-intercept form.",
           "y = m x + b",
           hint="Slope first.   Then point-slope.   Then isolate y.")


# 13 — pause 2 answer reveal
def pause2_answer(img, d):
    d.text((110, 90), "Answer:  y = 4 x - 7.",
           fill=MAROON, font=font("serif_bold", 70))
    d.text((110, 195),
           "Slope from the two points,   then point-slope,   then isolate y.",
           fill=INK, font=font("sans", 30))

    # left card: the algebra steps
    d.rounded_rectangle([110, 280, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 305), "Step 1   -   slope",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 365), "m  =  (5 - (-3)) / (3 - 1)",
           fill=INK, font=font("mono", 30))
    d.text((180, 415), "m  =  8 / 2   =   4",
           fill=MAROON_DARK, font=font("mono", 34))

    d.text((150, 500), "Step 2   -   point-slope  (use (1, -3))",
           fill=MAROON, font=font("serif_bold", 30))
    d.text((180, 560), "y - (-3)  =  4 (x - 1)",
           fill=INK, font=font("mono", 30))
    d.text((180, 610), "y + 3  =  4 (x - 1)",
           fill=INK, font=font("mono", 32))

    d.text((150, 690), "Step 3   -   distribute and isolate y",
           fill=MAROON, font=font("serif_bold", 30))
    d.text((180, 750), "y + 3  =  4 x  -  4",
           fill=INK, font=font("mono", 32))
    d.text((180, 800), "y  =  4 x  -  7",
           fill=MAROON_DARK, font=font("mono", 42))

    # right: plot the line through both points
    ox, oy = 1100, 700
    cell = 60
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-1, xmax=5, ymin=-6, ymax=6)
    plot_line(d, gx=gx, gy=gy, m=4, b=-7, xmin=0, xmax=4)
    plot_point(d, gx=gx, gy=gy, x=1, y=-3, label="(1, -3)",
               label_offset=(14, 14), label_size=22)
    plot_point(d, gx=gx, gy=gy, x=3, y=5, label="(3, 5)",
               label_offset=(14, -34), label_size=22)

    d.text((110, 930),
           "Both given points sit on  y = 4x - 7.   Check by substitution.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("13_pause2_silence", pause2_answer)


# 14 — application: assignment connection
def application(img, d):
    d.text((110, 90), "How the assignment uses this.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 195),
           "Ten lines.   Three forms each.   One quick check per line.",
           fill=MUTED, font=font("sans", 32))

    d.rounded_rectangle([110, 290, W - 110, 830], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Dashboard assignment",
           fill=MAROON, font=font("serif_bold", 44))

    steps = [
        ("Part A",  "10 lines  -  given slope + point, two points, or parallel/perpendicular conditions."),
        ("Part B",  "For each line:  write slope-intercept, point-slope, AND standard form."),
        ("Part C",  "Show source info, intermediate algebra, and the final equations."),
        ("Check",   "Verify with one substituted point or one quick graph."),
    ]
    y = 420
    for label, body in steps:
        d.text((180, y), label, fill=deck.accent, font=font("serif_bold", 36))
        d.text((440, y), body, fill=INK, font=font("sans", 28))
        y += 90

    d.text((110, 880),
           "Pick the form that matches the info first  -  then convert to the other two.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("14_application", application)


# 15 — recap
deck.recap("15_recap", "Recap.", [
    "Slope-intercept  -  y = m x + b   from slope + y-intercept.",
    "Point-slope  -  y - y1 = m (x - x1)   from slope + any point.",
    "Standard form  -  A x + B y = C   with integer A, B, C and A >= 0.",
    "Two points  ->  slope first  ->  point-slope  ->  simplify.",
    "Watch inner signs:   y - (-2)  is  y + 2,   not  y - 2.",
], assignment=[
    "Write 10 linear equations from mixed starting information.",
    "Give all three forms for each line.",
    "Check each with a substituted point or a quick graph.",
])


# 16 — path
deck.path("16_path", [
    ("✓",  "Watch this lesson",         "(done!)"),
    ("1.", "Read OpenStax Ch 4.1-4.2",  "Writing Equations of Lines"),
    ("2.", "Khan Academy practice",      "Writing Slope-Intercept Form  -  20 problems"),
    ("3.", "Assignment in dashboard",   "10 lines  -  three forms each  -  one check"),
    ("4.", "Advisor check-in",          "Book one if the inner-sign trap still feels confusing"),
], next_text="Next up:  Module 11 - Systems of Linear Equations.")


print("Module 10 V2 (Writing Linear Equations) slides built via slide_kit.")
