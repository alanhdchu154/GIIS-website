"""Algebra I - Module 11 (V2): Systems of Linear Equations.

Foundation V2 build. Every precision visual - coordinate planes,
plotted intersections, substitution chains, and elimination ladders -
is drawn deterministically. No generated images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, GRID, CREAM,
)

deck = Deck(course="Algebra I", module_num=11,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# ─── helper: a coordinate plane with grid + axes + ticks ───
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


def plot_point(d, *, gx, gy, x, y, color=MAROON_DARK, r=11, label=None,
               label_color=INK, label_offset=(16, -36), label_size=26):
    d.ellipse([gx(x) - r, gy(y) - r, gx(x) + r, gy(y) + r],
              fill=color, outline=CREAM, width=3)
    if label:
        d.text((gx(x) + label_offset[0], gy(y) + label_offset[1]),
               label, fill=label_color, font=font("mono", label_size))


# 01 — title
deck.title("01_title", "Algebra I",
           "Module 11 - Systems of Linear Equations",
           "Foundation lesson  -  ~6 minutes")


# 02 — hook: two gym plans, when do they cost the same?
def hook(img, d):
    d.text((110, 90), "Two gyms.   When do they cost the same?",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 180),
           "Plan A:   $30/month  +  $5 per visit          y  =  5 x  +  30",
           fill=INK, font=font("mono", 30))
    d.text((110, 230),
           "Plan B:   $10 per visit, no monthly fee       y  =  10 x",
           fill=INK, font=font("mono", 30))

    # coordinate plane: x = visits in [0, 10], y = cost in [0, 100]
    ox, oy = 240, 870
    cell_x = 130
    cell_y = 6
    xmax_v = 10
    ymax_c = 100
    for vx in range(0, xmax_v + 1, 1):
        d.line([(ox + vx * cell_x, oy), (ox + vx * cell_x, oy - ymax_c * cell_y)],
               fill=GRID, width=2)
    for cy in range(0, ymax_c + 1, 10):
        d.line([(ox, oy - cy * cell_y), (ox + xmax_v * cell_x, oy - cy * cell_y)],
               fill=GRID, width=2)
    d.line([(ox, oy), (ox + xmax_v * cell_x, oy)], fill=INK, width=4)
    d.line([(ox, oy), (ox, oy - ymax_c * cell_y)], fill=INK, width=4)
    ft = font("sans", 22)
    for vx in range(0, xmax_v + 1, 2):
        label = str(vx)
        tw = d.textlength(label, font=ft)
        d.text((ox + vx * cell_x - tw / 2, oy + 10), label, fill=MUTED, font=ft)
    for cy in range(0, ymax_c + 1, 20):
        label = f"${cy}"
        tw = d.textlength(label, font=ft)
        d.text((ox - tw - 12, oy - cy * cell_y - 12), label, fill=MUTED, font=ft)
    d.text((ox + xmax_v * cell_x + 20, oy - 30), "visits (x)",
           fill=INK, font=font("serif_bold", 26))
    d.text((ox - 60, oy - ymax_c * cell_y - 50), "cost ($)",
           fill=INK, font=font("serif_bold", 26))

    def gx(vx): return ox + vx * cell_x

    def gy_c(cy): return oy - cy * cell_y

    # Plan A: y = 5x + 30 from x=0 to x=10
    d.line([(gx(0), gy_c(30)), (gx(10), gy_c(80))], fill=MAROON, width=6)
    # Plan B: y = 10x from x=0 to x=10
    d.line([(gx(0), gy_c(0)), (gx(10), gy_c(100))], fill=deck.accent, width=6)

    # intersection at (6, 60)
    ix, iy = gx(6), gy_c(60)
    d.ellipse([ix - 13, iy - 13, ix + 13, iy + 13], fill=MAROON_DARK,
              outline=CREAM, width=3)
    d.rounded_rectangle([ix + 24, iy - 90, ix + 460, iy - 20], radius=14,
                        outline=MAROON_DARK, width=4, fill=deck.accent_light)
    d.text((ix + 40, iy - 78), "(6, $60)  -  same cost",
           fill=MAROON_DARK, font=font("serif_bold", 28))
    d.text((ix + 40, iy - 40), "6 visits  =  $60 either way",
           fill=MAROON_DARK, font=font("mono", 22))

    # Legend
    d.line([(gx(0) + 40, gy_c(95)), (gx(0) + 120, gy_c(95))], fill=MAROON, width=6)
    d.text((gx(0) + 130, gy_c(95) - 14), "Plan A", fill=MAROON,
           font=font("sans_bold", 24))
    d.line([(gx(0) + 280, gy_c(95)), (gx(0) + 360, gy_c(95))], fill=deck.accent, width=6)
    d.text((gx(0) + 370, gy_c(95) - 14), "Plan B", fill=deck.accent,
           font=font("sans_bold", 24))

    d.text((110, 950),
           "One ordered pair makes BOTH equations true.   That is the system's solution.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "Graphing       -  plot both lines, the solution is where they meet.",
    "Substitution   -  isolate one variable, plug it into the other equation.",
    "Elimination    -  add or subtract equations to cancel a variable.",
], footnote="One system.  Three roads to the same ordered pair.")


# 04 — concept: a system shares one (x, y) pair
def concept(img, d):
    d.text((110, 90), "A system  =  two equations sharing  (x, y).",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 190),
           "A solution is an ordered pair that makes BOTH equations true at once.",
           fill=MUTED, font=font("sans", 30))

    d.rounded_rectangle([110, 280, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 305), "System",
           fill=MAROON, font=font("serif_bold", 36))
    d.text((180, 380), "y  =  2 x  +  1",
           fill=INK, font=font("mono", 40))
    d.text((180, 450), "y  =  -x  +  7",
           fill=INK, font=font("mono", 40))

    d.text((150, 540), "Try  (2, 5):",
           fill=deck.accent, font=font("serif_bold", 32))
    d.text((180, 600), "5  =  2 (2)  +  1   ->   5 = 5   v",
           fill=INK, font=font("mono", 30))
    d.text((180, 650), "5  =  -(2)  +  7   ->   5 = 5   v",
           fill=INK, font=font("mono", 30))
    d.text((150, 730), "Both true  ->  (2, 5) is the solution.",
           fill=MAROON_DARK, font=font("sans_bold", 32))

    # right: plot both lines crossing at (2, 5)
    ox, oy = 1100, 700
    cell = 60
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-1, xmax=7, ymin=-1, ymax=8)
    plot_line(d, gx=gx, gy=gy, m=2, b=1, xmin=0, xmax=6, color=MAROON)
    plot_line(d, gx=gx, gy=gy, m=-1, b=7, xmin=0, xmax=6, color=deck.accent)
    plot_point(d, gx=gx, gy=gy, x=2, y=5, label="(2, 5)",
               label_offset=(16, -36), label_size=24)

    d.text((110, 930),
           "Same point sits on BOTH lines.   That is what 'solution to the system' means.",
           fill=deck.accent, font=font("sans_bold", 26))
deck.custom("04_concept", concept)


# 05 — graphing example: y = 2x + 1 and y = -x + 7, intersect at (2, 5)
def graphing(img, d):
    d.text((110, 90), "Method 1  -  graphing.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 190),
           "Plot both lines.   Read the intersection.   Check by substitution.",
           fill=MUTED, font=font("sans", 30))

    # left card: the system and verification
    d.rounded_rectangle([110, 280, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 305), "System",
           fill=MAROON, font=font("serif_bold", 34))
    d.text((180, 365), "y  =  2 x  +  1",
           fill=INK, font=font("mono", 36))
    d.text((180, 415), "y  =  -x  +  7",
           fill=INK, font=font("mono", 36))

    d.text((150, 500), "Read intersection  ->  (2, 5)",
           fill=deck.accent, font=font("serif_bold", 32))

    d.text((150, 575), "Check  (2, 5)",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 635), "2 (2) + 1  =  5    v",
           fill=INK, font=font("mono", 32))
    d.text((180, 685), "-(2) + 7  =  5    v",
           fill=INK, font=font("mono", 32))

    d.text((150, 770), "Both equations agree.",
           fill=MAROON_DARK, font=font("sans_bold", 30))
    d.text((150, 810), "Solution:   (2, 5).",
           fill=MAROON_DARK, font=font("sans_bold", 32))

    # right: plot both lines
    ox, oy = 1100, 700
    cell = 60
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-1, xmax=7, ymin=-1, ymax=8)
    plot_line(d, gx=gx, gy=gy, m=2, b=1, xmin=0, xmax=6, color=MAROON)
    plot_line(d, gx=gx, gy=gy, m=-1, b=7, xmin=0, xmax=6, color=deck.accent)
    plot_point(d, gx=gx, gy=gy, x=2, y=5, label="(2, 5)",
               label_offset=(16, -36), label_size=24)
    # label each line
    d.text((gx(5) + 8, gy(11) - 4), "y = 2x + 1",
           fill=MAROON, font=font("sans_bold", 22))
    d.text((gx(5) + 8, gy(2) - 4), "y = -x + 7",
           fill=deck.accent, font=font("sans_bold", 22))

    d.text((110, 930),
           "Graphing answers  'where do they meet?'   The meeting point is the solution.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("05_graphing", graphing)


# 06 — substitution worked example: y = 2x + 1, 3x + y = 16 -> (3, 7)
def substitution(img, d):
    d.text((110, 90), "Method 2  -  substitution.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 190),
           "If one equation says  y = (something),  plug that into the other.",
           fill=MUTED, font=font("sans", 30))

    d.rounded_rectangle([110, 280, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 310), "System",
           fill=MAROON, font=font("serif_bold", 36))
    d.text((180, 370), "y  =  2 x  +  1",
           fill=INK, font=font("mono", 36))
    d.text((180, 420), "3 x  +  y  =  16",
           fill=INK, font=font("mono", 36))

    d.text((150, 500), "Step 1   -   substitute  (2x + 1)  for  y",
           fill=deck.accent, font=font("serif_bold", 32))
    d.text((180, 560), "3 x  +  (2 x  +  1)  =  16",
           fill=INK, font=font("mono", 34))

    d.text((150, 630), "Step 2   -   combine and solve for x",
           fill=deck.accent, font=font("serif_bold", 32))
    d.text((180, 690), "5 x  +  1  =  16     ->     5 x  =  15     ->     x  =  3",
           fill=INK, font=font("mono", 32))

    d.text((150, 760), "Step 3   -   back-substitute to get y",
           fill=deck.accent, font=font("serif_bold", 32))
    d.text((180, 820), "y  =  2 (3)  +  1  =  7      ->      (3, 7)",
           fill=MAROON_DARK, font=font("mono", 36))

    d.text((110, 930),
           "Solution:   (3, 7).   One variable in, one variable out, then back-substitute.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("06_substitution", substitution)


# 07 — pause 1
deck.pause("07_pause1", "PAUSE  &  TRY  #1",
           "Solve by substitution:    y = x + 2     and     2 x + y = 8.",
           "y = x + 2",
           hint="Substitute  (x + 2)  for  y  in the second equation.   Solve for x, then for y.")


# 08 — pause 1 answer reveal
def pause1_answer(img, d):
    d.text((110, 90), "Answer:   (2, 4).",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 195),
           "Substitute  y = x + 2  into the second equation,  then back-substitute.",
           fill=INK, font=font("sans", 30))

    # left card: the algebra steps
    d.rounded_rectangle([110, 280, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 305), "Step 1   -   substitute",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 365), "2 x  +  (x + 2)  =  8",
           fill=INK, font=font("mono", 32))

    d.text((150, 445), "Step 2   -   combine and solve",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 505), "3 x  +  2  =  8",
           fill=INK, font=font("mono", 32))
    d.text((180, 555), "3 x  =  6   ->   x  =  2",
           fill=MAROON_DARK, font=font("mono", 34))

    d.text((150, 640), "Step 3   -   back-substitute",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 700), "y  =  2  +  2  =  4",
           fill=INK, font=font("mono", 32))
    d.text((180, 760), "Solution:   (2, 4)",
           fill=MAROON_DARK, font=font("mono", 38))

    # right: plot the two lines crossing at (2, 4)
    ox, oy = 1100, 700
    cell = 65
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-1, xmax=6, ymin=-1, ymax=8)
    plot_line(d, gx=gx, gy=gy, m=1, b=2, xmin=0, xmax=5, color=MAROON)
    plot_line(d, gx=gx, gy=gy, m=-2, b=8, xmin=0, xmax=4, color=deck.accent)
    plot_point(d, gx=gx, gy=gy, x=2, y=4, label="(2, 4)",
               label_offset=(16, -36), label_size=24)
    d.text((gx(4) + 8, gy(6) - 4), "y = x + 2",
           fill=MAROON, font=font("sans_bold", 22))
    d.text((gx(3) + 8, gy(2) - 4), "2x + y = 8",
           fill=deck.accent, font=font("sans_bold", 22))

    d.text((110, 930),
           "Check:   2 (2) + 4 = 8   v.    Both equations agree at  (2, 4).",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("08_pause1_silence", pause1_answer)


# 09 — elimination worked example: 2x + 3y = 12, 4x - 3y = 6 -> (3, 2)
def elimination(img, d):
    d.text((110, 90), "Method 3  -  elimination.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 190),
           "Line the equations up.   Add or subtract to make one variable vanish.",
           fill=MUTED, font=font("sans", 30))

    d.rounded_rectangle([110, 280, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 310), "System",
           fill=MAROON, font=font("serif_bold", 36))

    # stacked vertical add
    d.text((220, 380), "2 x  +  3 y  =  12",
           fill=INK, font=font("mono", 36))
    d.text((220, 430), "4 x  -  3 y  =   6",
           fill=INK, font=font("mono", 36))
    d.line([(220, 490), (820, 490)], fill=MAROON, width=4)
    d.text((150, 460), "+", fill=MAROON, font=font("serif_bold", 44))
    d.text((220, 505), "6 x  +  0   =  18",
           fill=MAROON_DARK, font=font("mono", 36))

    d.text((150, 590), "Step 1   -   y cancels  ->  solve for x",
           fill=deck.accent, font=font("serif_bold", 32))
    d.text((180, 650), "6 x  =  18    ->    x  =  3",
           fill=MAROON_DARK, font=font("mono", 36))

    d.text((150, 730), "Step 2   -   back-substitute  (use first equation)",
           fill=deck.accent, font=font("serif_bold", 30))
    d.text((180, 790), "2 (3)  +  3 y  =  12   ->   3 y  =  6   ->   y  =  2",
           fill=INK, font=font("mono", 32))

    d.text((110, 930),
           "Solution:   (3, 2).   Match the coefficients  ->  add  ->  one variable gone.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("09_elimination", elimination)


# 10 — solution types: one / none / infinite
def solution_types(img, d):
    d.text((110, 90), "How many solutions?   Three cases.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 190),
           "Slopes and y-intercepts decide the shape of the answer.",
           fill=MUTED, font=font("sans", 30))

    # three mini coordinate panels
    cases = [
        {
            "title": "One solution",
            "subtitle": "different slopes",
            "lines": [(1, 0), (-1, 4)],     # y = x and y = -x + 4 cross at (2, 2)
            "intersect": (2, 2),
            "color": MAROON_DARK,
            "algebra": "5 = 5   ->   true,   one point",
            "x0": 110,
        },
        {
            "title": "No solution",
            "subtitle": "parallel lines",
            "lines": [(1, 1), (1, -2)],     # y = x + 1 and y = x - 2 parallel
            "intersect": None,
            "color": RED,
            "algebra": "5 = 9   ->   false,   no point",
            "x0": 760,
        },
        {
            "title": "Infinite solutions",
            "subtitle": "same line",
            "lines": [(1, 1)],              # y = x + 1
            "intersect": None,
            "color": MAROON,
            "algebra": "0 = 0   ->   always true",
            "x0": 1410,
        },
    ]
    for case in cases:
        x0 = case["x0"]
        d.rounded_rectangle([x0, 280, x0 + 530, 880], radius=18,
                            outline=case["color"], width=5, fill=deck.card_bg)
        d.text((x0 + 24, 300), case["title"],
               fill=case["color"], font=font("serif_bold", 34))
        d.text((x0 + 24, 348), case["subtitle"],
               fill=MUTED, font=font("sans", 24))

        ox = x0 + 70
        oy = 720
        cell = 36
        gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                             xmin=-1, xmax=5, ymin=-1, ymax=5,
                             show_ticks=False)
        for m, b in case["lines"]:
            plot_line(d, gx=gx, gy=gy, m=m, b=b, xmin=-1, xmax=5,
                      color=case["color"], width=5)
        if case["title"] == "Infinite solutions":
            # double the same line slightly thicker to suggest overlap
            plot_line(d, gx=gx, gy=gy, m=1, b=1, xmin=-1, xmax=5,
                      color=deck.accent, width=3)
        if case["intersect"]:
            plot_point(d, gx=gx, gy=gy, x=case["intersect"][0], y=case["intersect"][1],
                       color=case["color"], r=9, label=None)
        d.text((x0 + 24, 790), case["algebra"],
               fill=INK, font=font("mono", 24))

    d.text((110, 930),
           "Sign of the solution count lives in the algebra:   false  =  none,   true  =  infinite.",
           fill=deck.accent, font=font("sans_bold", 26))
deck.custom("10_solution_types", solution_types)


# 11 — compare: multiply EVERY term, not just one
deck.compare("11_compare", "The trap  -  multiply every term, not just one.",
    left={
        "label": "X DON'T DO",
        "color": RED,
        "lines": [
            "Equation:   2 x + 3 y = 12",
            "",
            "Multiply by 2 to match y's:",
            "",
            "2 x + 6 y = 12      <- wrong",
            "",
            "Only the y-term doubled.",
            "Constant and x-term unchanged.",
            "",
            "System now describes a",
            "different line.",
        ],
        "footnote": "Half-multiplying silently changes the system.",
    },
    right={
        "label": "+ DO",
        "color": MAROON,
        "lines": [
            "Equation:   2 x + 3 y = 12",
            "",
            "Multiply by 2 to match y's:",
            "",
            "4 x + 6 y = 24      v",
            "",
            "EVERY term times 2.",
            "x-term, y-term, constant.",
            "",
            "Same line in a new costume.",
            "",
        ],
        "footnote": "Scaling preserves the line only if every term scales.",
    },
)


# 12 — pause 2
deck.pause("12_pause2", "PAUSE  &  TRY  #2",
           "Solve by elimination:    3 x + 2 y = 12     and     x - 2 y = 4.",
           "3x + 2y = 12",
           hint="Add the equations straight down.   y cancels.   Solve for x,  then back-substitute.")


# 13 — pause 2 answer reveal
def pause2_answer(img, d):
    d.text((110, 90), "Answer:   (4, 0).",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 195),
           "The y-terms are already opposites.   Add  ->  solve  ->  back-substitute.",
           fill=INK, font=font("sans", 30))

    # left card: the algebra steps
    d.rounded_rectangle([110, 280, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 305), "Step 1   -   add the equations",
           fill=MAROON, font=font("serif_bold", 30))
    d.text((180, 365), "3 x  +  2 y  =  12",
           fill=INK, font=font("mono", 32))
    d.text((180, 415), " x  -  2 y  =   4",
           fill=INK, font=font("mono", 32))
    d.line([(180, 470), (700, 470)], fill=MAROON, width=4)
    d.text((180, 485), "4 x  +  0   =  16",
           fill=MAROON_DARK, font=font("mono", 32))

    d.text((150, 570), "Step 2   -   solve for x",
           fill=MAROON, font=font("serif_bold", 30))
    d.text((180, 630), "4 x  =  16   ->   x  =  4",
           fill=MAROON_DARK, font=font("mono", 34))

    d.text((150, 710), "Step 3   -   back-substitute",
           fill=MAROON, font=font("serif_bold", 30))
    d.text((180, 770), "(4)  -  2 y  =  4   ->   y  =  0",
           fill=INK, font=font("mono", 32))
    d.text((180, 820), "Solution:   (4, 0)",
           fill=MAROON_DARK, font=font("mono", 36))

    # right: plot the two lines crossing at (4, 0)
    ox, oy = 1100, 700
    cell = 65
    gx, gy = coord_plane(d, ox=ox, oy=oy, cell=cell,
                          xmin=-1, xmax=6, ymin=-3, ymax=7)
    # 3x + 2y = 12  -> y = (12 - 3x)/2 = -1.5x + 6
    plot_line(d, gx=gx, gy=gy, m=-1.5, b=6, xmin=0, xmax=5, color=MAROON)
    # x - 2y = 4   -> y = (x - 4)/2 = 0.5x - 2
    plot_line(d, gx=gx, gy=gy, m=0.5, b=-2, xmin=0, xmax=5, color=deck.accent)
    plot_point(d, gx=gx, gy=gy, x=4, y=0, label="(4, 0)",
               label_offset=(16, 14), label_size=24)
    d.text((gx(1) + 8, gy(4.5) - 30), "3x + 2y = 12",
           fill=MAROON, font=font("sans_bold", 22))
    d.text((gx(4) + 12, gy(0) - 4), "x - 2y = 4",
           fill=deck.accent, font=font("sans_bold", 22))

    d.text((110, 930),
           "Check:   3 (4) + 2 (0) = 12   v   and   (4) - 2 (0) = 4   v.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("13_pause2_silence", pause2_answer)


# 14 — application: assignment connection
def application(img, d):
    d.text((110, 90), "How the assignment uses this.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 195),
           "Nine systems.   Three by graphing,  three by substitution,  three by elimination.",
           fill=MUTED, font=font("sans", 30))

    d.rounded_rectangle([110, 290, W - 110, 830], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Dashboard assignment",
           fill=MAROON, font=font("serif_bold", 44))

    steps = [
        ("Part A",  "3 systems by graphing.   Plot, intersect, ordered pair."),
        ("Part B",  "3 systems by substitution.   Isolate, substitute, back-sub."),
        ("Part C",  "3 systems by elimination.   Multiply if needed, add, solve."),
        ("Part D",  "Write 1 word problem modeled by a system.   Solve and explain."),
        ("Check",   "Verify at least 3 by plugging the ordered pair into BOTH equations."),
    ]
    y = 410
    for label, body in steps:
        d.text((180, y), label, fill=deck.accent, font=font("serif_bold", 32))
        d.text((420, y), body, fill=INK, font=font("sans", 28))
        y += 78

    d.text((110, 880),
           "Pick the method that matches the system you are looking at  -  then verify.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("14_application", application)


# 15 — recap
deck.recap("15_recap", "Recap.", [
    "Graphing  -  plot both,  read the intersection,  check by substitution.",
    "Substitution  -  isolate a variable,  plug it into the other equation.",
    "Elimination  -  line them up,  add or subtract to kill a variable.",
    "One / none / infinite  -  different slopes / parallel / same line.",
    "Multiply every term when scaling,   and  check the ordered pair in BOTH equations.",
], assignment=[
    "Solve 9 systems  -  3 graphing, 3 substitution, 3 elimination.",
    "Write 1 system word problem and solve it.",
    "Verify 3 solutions by substituting back into both equations.",
])


# 16 — path
deck.path("16_path", [
    ("✓",  "Watch this lesson",         "(done!)"),
    ("1.", "Read OpenStax Ch 5.1-5.3",  "Systems of Linear Equations"),
    ("2.", "Khan Academy practice",      "Systems of Equations  -  mixed method drills"),
    ("3.", "Assignment in dashboard",   "9 systems  -  three methods  -  one word problem"),
    ("4.", "Advisor check-in",          "Book one if no-solution / infinite cases still feel confusing"),
], next_text="Next up:  Module 12 - Exponents & Polynomials.")


print("Module 11 V2 (Systems of Linear Equations) slides built via slide_kit.")
