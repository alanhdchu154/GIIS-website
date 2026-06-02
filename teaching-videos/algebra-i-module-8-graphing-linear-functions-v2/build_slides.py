"""Algebra I - Module 8 (V2): Graphing Linear Functions.

Foundation V2 build. Coordinate planes, plotted points, intercept arrows,
table-of-values plots, and slope-intercept worked diagrams are drawn
deterministically. No generated images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, GRID, CREAM,
)

deck = Deck(course="Algebra I", module_num=8,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# ─── helper: a small coordinate plane with grid + axes + ticks ───
def coord_plane(d, *, ox, oy, cell, xmin, xmax, ymin, ymax,
                show_ticks=True, tick_font_size=22):
    """Draw a coordinate plane. Returns gx(), gy() pixel mappers."""
    def gx(x): return ox + x * cell
    def gy(y): return oy - y * cell
    # grid
    for x in range(xmin, xmax + 1):
        d.line([(gx(x), gy(ymin)), (gx(x), gy(ymax))], fill=GRID, width=2)
    for y in range(ymin, ymax + 1):
        d.line([(gx(xmin), gy(y)), (gx(xmax), gy(y))], fill=GRID, width=2)
    # axes
    d.line([(gx(xmin), gy(0)), (gx(xmax), gy(0))], fill=INK, width=4)
    d.line([(gx(0), gy(ymin)), (gx(0), gy(ymax))], fill=INK, width=4)
    # axis labels
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
    x0, x1 = xmin, xmax
    d.line([(gx(x0), gy(m * x0 + b)), (gx(x1), gy(m * x1 + b))],
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
           "Module 8 - Graphing Linear Functions",
           "Foundation lesson  -  ~6 minutes")


# 02 — hook: phone-plan straight line cost vs texts
def hook(img, d):
    d.text((110, 90), "An equation is a picture in disguise.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 180),
           "Phone plan:  $15 / month  +  $0.10 per text.",
           fill=MUTED, font=font("sans", 34))
    d.text((110, 230),
           "Cost  C  =  0.10 · t  +  15      (t = number of texts)",
           fill=INK, font=font("mono", 36))

    # coordinate plane: t in [0,100], C in [0,30]
    ox, oy = 220, 880
    cell_t = 12  # x per text
    cell_c = 24  # y per dollar
    # axes
    xmax_t = 100
    ymax_c = 28
    # gridlines at every 10 texts and every $5
    for t in range(0, xmax_t + 1, 10):
        d.line([(ox + t * cell_t, oy), (ox + t * cell_t, oy - ymax_c * cell_c)],
               fill=GRID, width=2)
    for c in range(0, ymax_c + 1, 5):
        d.line([(ox, oy - c * cell_c), (ox + xmax_t * cell_t, oy - c * cell_c)],
               fill=GRID, width=2)
    # axis lines
    d.line([(ox, oy), (ox + xmax_t * cell_t, oy)], fill=INK, width=4)
    d.line([(ox, oy), (ox, oy - ymax_c * cell_c)], fill=INK, width=4)
    # tick labels
    ft = font("sans", 22)
    for t in range(0, xmax_t + 1, 20):
        label = str(t)
        tw = d.textlength(label, font=ft)
        d.text((ox + t * cell_t - tw / 2, oy + 10), label, fill=MUTED, font=ft)
    for c in range(0, ymax_c + 1, 5):
        label = f"${c}"
        tw = d.textlength(label, font=ft)
        d.text((ox - tw - 12, oy - c * cell_c - 12), label, fill=MUTED, font=ft)
    # axis labels
    d.text((ox + xmax_t * cell_t + 20, oy - 30), "texts (t)",
           fill=INK, font=font("serif_bold", 28))
    d.text((ox - 80, oy - ymax_c * cell_c - 50), "cost C",
           fill=INK, font=font("serif_bold", 28))
    # line: C = 0.10 t + 15
    def cy(t): return oy - (0.10 * t + 15) * cell_c
    def cx(t): return ox + t * cell_t
    d.line([(cx(0), cy(0)), (cx(100), cy(100))], fill=MAROON, width=7)
    # highlight the (100, 25) point with a callout
    px, py = cx(100), cy(100)
    d.ellipse([px - 12, py - 12, px + 12, py + 12], fill=MAROON_DARK,
              outline=CREAM, width=3)
    d.line([(px, py), (px + 60, py - 80)], fill=deck.accent, width=4)
    d.rounded_rectangle([px + 50, py - 160, px + 360, py - 60], radius=14,
                        outline=deck.accent, width=4, fill=deck.accent_light)
    d.text((px + 70, py - 148), "100 texts",
           fill=MAROON_DARK, font=font("serif_bold", 28))
    d.text((px + 70, py - 108), "cost  =  $25",
           fill=MAROON_DARK, font=font("mono", 28))

    # y-intercept callout (0, 15)
    yx, yy = cx(0), cy(0)
    d.ellipse([yx - 12, yy - 12, yx + 12, yy + 12], fill=MAROON_DARK,
              outline=CREAM, width=3)
    d.text((yx + 16, yy - 4), "(0, $15)  -  the monthly fee",
           fill=deck.accent, font=font("sans_bold", 26))

    d.text((110, 960),
           "Every point on the line answers a real question.  Read the picture.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "Table of values  -  plug in x, compute y, plot the pairs.",
    "Intercepts  -  set y=0, then set x=0 to find where the line crosses.",
    "Slope-intercept  -  y = m x + b reads off slope and y-intercept.",
], footnote="Goal:  one equation,  three ways to turn it into a line.")


# 04 — concept: "graph = every (x, y) that makes it true"
def concept(img, d):
    d.text((110, 90), "A graph is the picture of every true pair.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 195),
           "Graph of y = 2x + 1  =  the set of every (x, y) that makes it true.",
           fill=MUTED, font=font("sans", 32))

    # left card: definition + 3 example pairs
    d.rounded_rectangle([110, 280, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 310), "What counts as a 'true pair' ?",
           fill=MAROON, font=font("serif_bold", 36))
    d.text((150, 380), "Plug x into the rule.  If y matches, that (x, y) is on the line.",
           fill=INK, font=font("sans", 28))
    rows = [
        ("(0,  1)",  "y = 2(0) + 1  = 1  ✓"),
        ("(1,  3)",  "y = 2(1) + 1  = 3  ✓"),
        ("(2,  5)",  "y = 2(2) + 1  = 5  ✓"),
        ("(0,  9)",  "y = 2(0) + 1  = 1   ≠ 9   ✗"),
    ]
    y = 470
    for pair, check in rows:
        d.text((180, y), pair, fill=deck.accent, font=font("mono", 36))
        d.text((430, y), check, fill=INK, font=font("mono", 30))
        y += 90

    # right: small coordinate plane with the three plotted points + line
    ox, oy = 1080, 820
    cell = 75
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-1, xmax=5, ymin=-1, ymax=7)
    plot_line(d, gx=gx, gy=gy, m=2, b=1, xmin=-1, xmax=4)
    for (px, py) in [(0, 1), (1, 3), (2, 5)]:
        plot_point(d, gx=gx, gy=gy, x=px, y=py,
                   label=f"({px}, {py})", label_offset=(14, -32))

    d.text((110, 950),
           "Two points are enough  -  three or four catch mistakes before you draw.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("04_concept", concept)


# 05 — method one: table of values  y = 2x + 1
def table_graph(img, d):
    d.text((110, 90), "Method 1  -  table of values.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 190),
           "Take  y = 2x + 1.   Pick easy x values  -  then plug in.",
           fill=MUTED, font=font("sans", 32))

    # left: the table
    d.rounded_rectangle([110, 280, 820, 860], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 305), "Table for  y = 2x + 1",
           fill=MAROON, font=font("serif_bold", 36))
    # header
    d.rounded_rectangle([150, 380, 780, 450], radius=12,
                        outline=MAROON, width=3, fill=deck.accent_light)
    d.text((200, 396), "x",      fill=MAROON_DARK, font=font("serif_bold", 32))
    d.text((360, 396), "2x + 1", fill=MAROON_DARK, font=font("serif_bold", 32))
    d.text((640, 396), "y",      fill=MAROON_DARK, font=font("serif_bold", 32))
    rows = [
        ("-1", "2(-1) + 1", "-1"),
        ("0",  "2(0) + 1",  "1"),
        ("1",  "2(1) + 1",  "3"),
        ("2",  "2(2) + 1",  "5"),
    ]
    y = 470
    for xv, mid, yv in rows:
        d.rounded_rectangle([150, y, 780, y + 80], radius=12,
                            outline=MAROON, width=2, fill=deck.bg)
        d.text((200, y + 20), xv,  fill=INK,         font=font("mono", 34))
        d.text((360, y + 22), mid, fill=MUTED,       font=font("mono", 30))
        d.text((640, y + 20), yv,  fill=deck.accent, font=font("mono", 34))
        y += 90

    # right: coordinate plane with the 4 plotted pairs + line
    ox, oy = 1020, 820
    cell = 75
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-2, xmax=4, ymin=-2, ymax=6)
    plot_line(d, gx=gx, gy=gy, m=2, b=1, xmin=-2, xmax=3)
    for (px, py) in [(-1, -1), (0, 1), (1, 3), (2, 5)]:
        plot_point(d, gx=gx, gy=gy, x=px, y=py,
                   label=f"({px}, {py})", label_offset=(14, -34),
                   label_size=22)

    d.text((110, 920),
           "Pick x.  Compute y.  Plot the pair.  Connect with a straight edge.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("05_table_graph", table_graph)


# 06 — method two: x- and y- intercepts on 3x + 2y = 6
def intercepts_graph(img, d):
    d.text((110, 90), "Method 2  -  intercepts.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 190),
           "Where does the line cross each axis?   Set the other variable to 0.",
           fill=MUTED, font=font("sans", 32))

    # left card: equation and the two computations
    d.rounded_rectangle([110, 280, 880, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 310), "Equation:   3x + 2y = 6",
           fill=MAROON, font=font("mono", 38))

    d.text((150, 400), "x-intercept   (set  y = 0):",
           fill=deck.accent, font=font("serif_bold", 34))
    d.text((180, 460), "3x + 2(0) = 6", fill=INK,    font=font("mono", 36))
    d.text((180, 510), "3x  =  6",       fill=MUTED, font=font("mono", 36))
    d.text((180, 560), "x  =  2  ->  (2, 0)",
           fill=MAROON_DARK, font=font("mono", 36))

    d.text((150, 650), "y-intercept   (set  x = 0):",
           fill=deck.accent, font=font("serif_bold", 34))
    d.text((180, 710), "3(0) + 2y = 6", fill=INK,    font=font("mono", 36))
    d.text((180, 760), "2y  =  6",       fill=MUTED, font=font("mono", 36))
    d.text((180, 810), "y  =  3  ->  (0, 3)",
           fill=MAROON_DARK, font=font("mono", 36))

    # right: coordinate plane with the two intercepts + line
    ox, oy = 1100, 820
    cell = 90
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-1, xmax=5, ymin=-1, ymax=5)
    # line 3x + 2y = 6 -> y = -1.5 x + 3
    plot_line(d, gx=gx, gy=gy, m=-1.5, b=3, xmin=-1, xmax=4)
    plot_point(d, gx=gx, gy=gy, x=2, y=0, label="(2, 0)",
               label_offset=(14, 14), label_size=26)
    plot_point(d, gx=gx, gy=gy, x=0, y=3, label="(0, 3)",
               label_offset=(16, -8), label_size=26)

    d.text((110, 930),
           "Two intercepts is enough.  Plot them, connect them, you have the line.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("06_intercepts_graph", intercepts_graph)


# 07 — pause 1
deck.pause("07_pause1", "PAUSE  &  TRY  #1",
           "Graph using a table of values.   Use  x = -1, 0, 1, 2:",
           "y = -x + 3",
           hint="Plug each x in.  Write the four pairs.  Plot them.")


# 08 — pause 1 answer reveal
def pause1_answer(img, d):
    d.text((110, 90), "Answer:  y = -x + 3   plotted from the table.",
           fill=MAROON, font=font("serif_bold", 50))
    d.text((110, 175),
           "Plug each x in.  Plot the pair.  Negative slope tilts the line downhill.",
           fill=INK, font=font("sans", 30))

    # left: filled-in table
    d.rounded_rectangle([110, 260, 820, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 285), "Filled-in table  -  y = -x + 3",
           fill=MAROON, font=font("serif_bold", 32))
    # header
    d.rounded_rectangle([150, 360, 780, 425], radius=12,
                        outline=MAROON, width=3, fill=deck.accent_light)
    d.text((200, 374), "x",      fill=MAROON_DARK, font=font("serif_bold", 28))
    d.text((350, 374), "-x + 3", fill=MAROON_DARK, font=font("serif_bold", 28))
    d.text((640, 374), "y",      fill=MAROON_DARK, font=font("serif_bold", 28))
    rows = [
        ("-1", "-(-1) + 3", "4"),
        ("0",  "-(0)  + 3", "3"),
        ("1",  "-(1)  + 3", "2"),
        ("2",  "-(2)  + 3", "1"),
    ]
    y = 445
    for xv, mid, yv in rows:
        d.rounded_rectangle([150, y, 780, y + 90], radius=12,
                            outline=MAROON, width=2, fill=deck.bg)
        d.text((200, y + 26), xv,  fill=INK,         font=font("mono", 32))
        d.text((350, y + 28), mid, fill=MUTED,       font=font("mono", 28))
        d.text((640, y + 26), yv,  fill=deck.accent, font=font("mono", 32))
        y += 100

    # right: coordinate plane with the 4 plotted pairs + line going downhill
    ox, oy = 1020, 800
    cell = 75
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-2, xmax=4, ymin=-1, ymax=6)
    plot_line(d, gx=gx, gy=gy, m=-1, b=3, xmin=-2, xmax=4)
    for (px, py) in [(-1, 4), (0, 3), (1, 2), (2, 1)]:
        plot_point(d, gx=gx, gy=gy, x=px, y=py,
                   label=f"({px}, {py})", label_offset=(14, -34),
                   label_size=22)

    d.text((110, 930),
           "Pairs:  (-1, 4),  (0, 3),  (1, 2),  (2, 1).   Slope -1  =  downhill.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("08_pause1_silence", pause1_answer)


# 09 — slope-intercept form: y = m x + b decoded
def slope_intercept_eq(img, d):
    d.text((110, 90), "Method 3  -  slope-intercept form.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 190),
           "Equation written as  y = m x + b   tells you slope AND y-intercept.",
           fill=MUTED, font=font("sans", 32))

    # big decoded equation block
    d.rounded_rectangle([110, 280, W - 110, 540], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    eq_font = font("mono", 110)
    centered(d, "y  =  m x  +  b", eq_font, 320, MAROON)
    # m and b labels with arrows
    d.text((720, 470), "slope", fill=deck.accent, font=font("serif_bold", 36))
    d.text((1180, 470), "y-intercept", fill=deck.accent, font=font("serif_bold", 36))

    # left: how to use it
    d.rounded_rectangle([110, 590, 820, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 615), "How to plot it",
           fill=MAROON, font=font("serif_bold", 36))
    steps = [
        ("1.", "Read  b  -  that is the point  (0, b)  on the y-axis."),
        ("2.", "Plot  (0, b)  first."),
        ("3.", "Use  m = rise / run  to step to one more point."),
        ("4.", "Draw the line through the two points."),
    ]
    sy = 680
    for n, t in steps:
        d.text((180, sy), n, fill=deck.accent, font=font("serif_bold", 32))
        d.text((240, sy), t, fill=INK, font=font("sans", 26))
        sy += 50

    # right: a tiny worked example  y = (1/2) x + 1
    ox, oy = 1020, 820
    cell = 75
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-2, xmax=5, ymin=-1, ymax=5)
    plot_line(d, gx=gx, gy=gy, m=0.5, b=1, xmin=-2, xmax=5)
    # (0, 1) and (2, 2)
    plot_point(d, gx=gx, gy=gy, x=0, y=1, label="(0, 1)  start",
               label_offset=(14, -32), label_size=22)
    plot_point(d, gx=gx, gy=gy, x=2, y=2, label="(2, 2)",
               label_offset=(14, 14), label_size=22)
    # rise/run staircase
    d.line([(gx(0), gy(1)), (gx(2), gy(1))], fill=deck.accent, width=5)
    d.line([(gx(2), gy(1)), (gx(2), gy(2))], fill=deck.accent, width=5)
    d.text((gx(1) - 30, gy(1) + 8), "run = 2", fill=deck.accent,
           font=font("sans_bold", 22))
    d.text((gx(2) + 8, gy(1.5) - 16), "rise = 1", fill=deck.accent,
           font=font("sans_bold", 22))

    d.text((110, 930),
           "Example  y = (1/2)x + 1   ->   b = 1   m = 1/2   ->   plot (0,1) then rise 1, run 2.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("09_slope_intercept_equation", slope_intercept_eq)


# 10 — compare: x-intercept vs y-intercept (the swap trap)
deck.compare("10_compare", "The trap  -  do not swap the intercepts.",
    left={
        "label": "X DON'T DO",
        "color": RED,
        "lines": [
            "Find x-intercept of",
            "3x + 2y = 6:",
            "",
            "'Set x = 0'   (wrong axis)",
            "3(0) + 2y = 6",
            "y = 3   ->   (0, 3)",
            "",
            "That's the y-intercept!",
        ],
        "footnote": "Mixing which variable to zero shifts the line.",
    },
    right={
        "label": "+ DO",
        "color": MAROON,
        "lines": [
            "Find x-intercept of",
            "3x + 2y = 6:",
            "",
            "Set  y = 0  (x-axis has y=0)",
            "3x + 2(0) = 6",
            "x = 2   ->   (2, 0)",
            "",
            "y-intercept: set x = 0.",
        ],
        "footnote": "x-axis: y = 0.   y-axis: x = 0.",
    },
)


# 11 — pause 2
deck.pause("11_pause2", "PAUSE  &  TRY  #2",
           "Use slope-intercept form.   Find slope, y-intercept, and plot:",
           "y = 2x - 4",
           hint="Compare to  y = m x + b.   Plot (0, b) first, then step.")


# 12 — pause 2 answer reveal
def pause2_answer(img, d):
    d.text((110, 90), "Answer:  m = 2,   b = -4.",
           fill=MAROON, font=font("serif_bold", 70))
    d.text((110, 190),
           "Compare  y = 2x - 4   to   y = m x + b   ->   slope is 2, y-intercept is -4.",
           fill=INK, font=font("sans", 30))

    # left: the read-off card
    d.rounded_rectangle([110, 280, 820, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 310), "Read it off",
           fill=MAROON, font=font("serif_bold", 36))
    rows = [
        ("slope",       "m  =  2",          "rise 2,  run 1"),
        ("y-intercept", "b  =  -4",         "point  (0, -4)"),
        ("step 1",      "plot  (0, -4)",    "on the y-axis"),
        ("step 2",      "rise 2,  run 1",   "lands on  (1, -2)"),
        ("draw",        "line through both", "tilts uphill  (m > 0)"),
    ]
    y = 400
    for a, b, c in rows:
        d.rounded_rectangle([150, y, 780, y + 80], radius=12,
                            outline=MAROON, width=2, fill=deck.bg)
        d.text((180, y + 22), a, fill=deck.accent, font=font("serif_bold", 28))
        d.text((400, y + 24), b, fill=INK,         font=font("mono", 30))
        d.text((400, y + 56), c, fill=MUTED,       font=font("sans", 20))
        y += 95

    # right: coordinate plane with (0,-4), (1,-2), and the line
    ox, oy = 1100, 700
    cell = 65
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-2, xmax=5, ymin=-6, ymax=4)
    plot_line(d, gx=gx, gy=gy, m=2, b=-4, xmin=-1, xmax=4)
    plot_point(d, gx=gx, gy=gy, x=0, y=-4, label="(0, -4)",
               label_offset=(14, 14), label_size=22)
    plot_point(d, gx=gx, gy=gy, x=1, y=-2, label="(1, -2)",
               label_offset=(14, -32), label_size=22)
    # rise/run staircase
    d.line([(gx(0), gy(-4)), (gx(1), gy(-4))], fill=deck.accent, width=5)
    d.line([(gx(1), gy(-4)), (gx(1), gy(-2))], fill=deck.accent, width=5)
    d.text((gx(0) + 6, gy(-4) + 10), "run 1", fill=deck.accent,
           font=font("sans_bold", 22))
    d.text((gx(1) + 8, gy(-3) - 14), "rise 2", fill=deck.accent,
           font=font("sans_bold", 22))

    d.text((110, 930),
           "Two points, draw the line.   Positive slope  =  tilts uphill.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("12_pause2_silence", pause2_answer)


# 13 — application: assignment connection
def application(img, d):
    d.text((110, 90), "How the assignment uses this.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 195),
           "Graph eight equations.  For each one  -  intercepts AND slope sign.",
           fill=MUTED, font=font("sans", 32))

    d.rounded_rectangle([110, 290, W - 110, 830], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Dashboard assignment",
           fill=MAROON, font=font("serif_bold", 44))

    steps = [
        ("Part A",  "Graph 8 linear equations  -  Desmos or graph paper."),
        ("Part B",  "For each:  write the x-intercept and the y-intercept."),
        ("Part C",  "For each:  label the slope  -  positive, negative, zero, or undefined."),
        ("Rubric",  "Show the table or the intercept work  -  not just the picture."),
    ]
    y = 420
    for label, body in steps:
        d.text((180, y), label, fill=deck.accent, font=font("serif_bold", 36))
        d.text((440, y), body, fill=INK, font=font("sans", 28))
        y += 90

    d.text((110, 880),
           "Pick the method that fits the equation:  table, intercepts, or slope-intercept.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("13_application", application)


# 14 — recap
deck.recap("14_recap", "Recap.", [
    "Graph  =  every (x, y) that makes the equation true  -  always a straight line.",
    "Method 1:  table of values  -  plug in x, get y, plot the pair.",
    "Method 2:  intercepts  -  set y=0 for x-int,  set x=0 for y-int.",
    "Method 3:  slope-intercept  -  y = m x + b  reads off slope and y-intercept.",
    "Slope sign:  +  uphill,  -  downhill,  0  flat,  vertical = undefined.",
], assignment=[
    "Graph 8 linear equations (Desmos or paper).",
    "Write the x-intercept and y-intercept for each.",
    "Label the slope:  positive, negative, zero, or undefined.",
])


# 15 — path
deck.path("15_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Ch 3.2-3.3", "Graph Linear Equations in Two Variables"),
    ("2.", "Desmos practice",          "Graph  y = m x + b  for several m and b values"),
    ("3.", "Assignment in dashboard",  "8 equations  -  intercepts and slope sign for each"),
    ("4.", "Advisor check-in",         "Book one if the intercept swap still feels confusing"),
], next_text="Next up:  Module 9 - Slope & Rate of Change.")


print("Module 8 V2 (Graphing Linear Functions) slides built via slide_kit.")
