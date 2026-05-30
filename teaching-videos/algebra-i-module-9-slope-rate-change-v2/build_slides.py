"""Algebra I — Module 9 (V2): Slope & Rate of Change.

Foundation-pilot V2 build. All precision visuals (coordinate planes, rise/run
arrows, slope-type mini-graphs) are drawn deterministically here — no
generated images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, GRID, CREAM,
)

deck = Deck(course="Algebra I", module_num=9,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# 01 — title
deck.title("01_title", "Algebra I",
           "Module 9 — Slope & Rate of Change",
           "Foundation lesson  ·  ~6 minutes")


# 02 — hook: two ramps, same height, different steepness
def hook(img, d):
    d.text((110, 90), "Same rise.  Different run.", fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 175), "Which ramp is steeper — and by how much?",
           fill=MUTED, font=font("sans", 36))

    # Two ramp drawings, side by side
    ground_y = 780
    # Left ramp: gentle (long run, same rise)
    lx0, ly0 = 180, ground_y
    lx1, ly1 = 880, 380          # rise = 400, run = 700
    d.line([(lx0, ly0), (lx1, ly0)], fill=INK, width=4)              # ground
    d.line([(lx0, ly0), (lx1, ly1)], fill=MAROON, width=8)           # ramp
    d.line([(lx1, ly1), (lx1, ly0)], fill=MAROON_DARK, width=4)      # wall
    # Rise / run labels
    d.text((lx1 + 20, (ly0 + ly1) // 2 - 30), "rise", fill=deck.accent, font=font("sans_bold", 32))
    d.text((lx1 + 20, (ly0 + ly1) // 2 + 10), "4", fill=INK, font=font("mono", 44))
    d.text(((lx0 + lx1) // 2 - 30, ly0 + 12), "run = 7", fill=deck.accent, font=font("sans_bold", 32))
    d.text((lx0, 300), "Gentle ramp", fill=MAROON, font=font("serif_bold", 40))
    d.text((lx0, 350), "slope = 4 / 7  ≈  0.57", fill=INK, font=font("mono", 32))

    # Right ramp: steep (short run, same rise)
    rx0, ry0 = 1100, ground_y
    rx1, ry1 = 1400, 380          # rise = 400, run = 300
    d.line([(rx0, ry0), (rx1, ry0)], fill=INK, width=4)
    d.line([(rx0, ry0), (rx1, ry1)], fill=MAROON, width=8)
    d.line([(rx1, ry1), (rx1, ry0)], fill=MAROON_DARK, width=4)
    d.text((rx1 + 20, (ry0 + ry1) // 2 - 30), "rise", fill=deck.accent, font=font("sans_bold", 32))
    d.text((rx1 + 20, (ry0 + ry1) // 2 + 10), "4", fill=INK, font=font("mono", 44))
    d.text(((rx0 + rx1) // 2 - 30, ry0 + 12), "run = 3", fill=deck.accent, font=font("sans_bold", 32))
    d.text((rx0, 300), "Steep ramp", fill=MAROON, font=font("serif_bold", 40))
    d.text((rx0, 350), "slope = 4 / 3  ≈  1.33", fill=INK, font=font("mono", 32))

    d.text((110, 920), "Slope  =  how much rise per one unit of run.",
           fill=deck.accent, font=font("sans_bold", 36))
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "Rise over run — straight from the graph.",
    "Slope from two points — one formula, two subtractions.",
    "Four flavors:  positive · negative · zero · undefined.",
    "Rate of change in real life — speed, savings, leaks.",
], footnote="Goal:  read any line the way you read a sentence.")


# 04 — rise/run from a graph (custom coordinate plane)
def rise_over_run(img, d):
    d.text((110, 90), "Rise over run, straight from the graph.",
           fill=MAROON, font=font("serif_bold", 56))

    # Coordinate plane geometry: keep it big and readable.
    # x: -1..7  →  9 cells of 110 px = 990 px wide
    # y: -1..6  →  8 cells of 80 px = 640 px tall
    ox, oy = 380, 870     # origin (x=0, y=0) in pixel space
    cell_x, cell_y = 110, 80
    xmin, xmax = -1, 7
    ymin, ymax = -1, 6

    def gx(x): return ox + x * cell_x
    def gy(y): return oy - y * cell_y

    # Grid lines
    for x in range(xmin, xmax + 1):
        d.line([(gx(x), gy(ymin)), (gx(x), gy(ymax))], fill=GRID, width=2)
    for y in range(ymin, ymax + 1):
        d.line([(gx(xmin), gy(y)), (gx(xmax), gy(y))], fill=GRID, width=2)
    # Axes
    d.line([(gx(xmin), gy(0)), (gx(xmax), gy(0))], fill=INK, width=4)
    d.line([(gx(0), gy(ymin)), (gx(0), gy(ymax))], fill=INK, width=4)
    # Axis labels
    d.text((gx(xmax) + 20, gy(0) - 18), "x", fill=INK, font=font("serif_bold", 40))
    d.text((gx(0) - 40, gy(ymax) - 50), "y", fill=INK, font=font("serif_bold", 40))
    # Tick numbers
    f_t = font("sans", 24)
    for x in range(xmin, xmax + 1):
        if x == 0:
            continue
        d.text((gx(x) - 8, gy(0) + 10), str(x), fill=MUTED, font=f_t)
    for y in range(ymin, ymax + 1):
        if y == 0:
            continue
        d.text((gx(0) - 32, gy(y) - 14), str(y), fill=MUTED, font=f_t)

    # Line through (1, 1) and (5, 4): slope 3/4 — nice clean grid count.
    p1 = (1, 1)
    p2 = (5, 4)
    d.line([(gx(-1), gy(p1[1] + ((-1) - p1[0]) * 3 / 4)),
            (gx(7),  gy(p1[1] + (7 - p1[0]) * 3 / 4))],
           fill=MAROON, width=6)

    # Mark the two points
    for (px, py) in [p1, p2]:
        d.ellipse([gx(px) - 11, gy(py) - 11, gx(px) + 11, gy(py) + 11],
                  fill=MAROON_DARK, outline=CREAM, width=3)

    # Rise / run staircase between the points
    # Run: horizontal segment from p1 to (p2_x, p1_y)
    d.line([(gx(p1[0]), gy(p1[1])), (gx(p2[0]), gy(p1[1]))],
           fill=deck.accent, width=6)
    # Rise: vertical segment from (p2_x, p1_y) to p2
    d.line([(gx(p2[0]), gy(p1[1])), (gx(p2[0]), gy(p2[1]))],
           fill=deck.accent, width=6)

    # Labels
    d.text(((gx(p1[0]) + gx(p2[0])) // 2 - 40, gy(p1[1]) + 14),
           "run = 4", fill=deck.accent, font=font("sans_bold", 30))
    d.text((gx(p2[0]) + 18, (gy(p1[1]) + gy(p2[1])) // 2 - 16),
           "rise = 3", fill=deck.accent, font=font("sans_bold", 30))
    d.text((gx(p1[0]) - 80, gy(p1[1]) + 24),
           "(1, 1)", fill=INK, font=font("mono", 26))
    d.text((gx(p2[0]) + 16, gy(p2[1]) - 36),
           "(5, 4)", fill=INK, font=font("mono", 26))

    # Result panel on the right
    d.rounded_rectangle([1450, 240, W - 110, 540], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((1480, 270), "Count it.", fill=MAROON, font=font("serif_bold", 44))
    d.text((1480, 340), "rise  =  3",  fill=INK, font=font("mono", 38))
    d.text((1480, 395), "run   =  4",  fill=INK, font=font("mono", 38))
    d.text((1480, 460), "slope =  3/4", fill=MAROON, font=font("mono", 44))

    d.text((110, 950), "Pick clean grid points.  Count up.  Count right.  Divide.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("04_rise_over_run", rise_over_run)


# 05 — slope from two points (formula + worked example)
deck.equation("05_two_points", "Slope from two points.", [
    ("m  =  (y₂ − y₁) / (x₂ − x₁)", INK,    "top is the rise · bottom is the run"),
    ("Points:  (1, 2)  and  (4, 8)", MUTED, "let point 1 = (1, 2),  point 2 = (4, 8)"),
    ("m  =  (8 − 2) / (4 − 1)", MUTED,      "subtract y's on top, x's on bottom"),
    ("m  =  6 / 3  =  2",       MAROON,     "slope = 2"),
])


# 06 — trap: reversed subtraction / mixed coordinates
deck.compare("06_trap", "The trap — order has to match.",
    left={
        "label": "✗ WRONG",
        "color": RED,
        "lines": [
            "Top:    y₂ − y₁  =  8 − 2  =  6",
            "Bottom: x₁ − x₂  =  1 − 4  = −3",
            "",
            "m  =  6 / −3  =  −2",
            "Sign flipped — wrong direction.",
        ],
        "footnote": "Same point must be 'point 1' in BOTH subtractions.",
    },
    right={
        "label": "✓ RIGHT",
        "color": MAROON,
        "lines": [
            "Top:    y₂ − y₁  =  8 − 2  =  6",
            "Bottom: x₂ − x₁  =  4 − 1  =  3",
            "",
            "m  =  6 / 3  =  2",
            "Numerator and denominator agree.",
        ],
        "footnote": "And y always on top — never mix x's and y's.",
    },
)


# 07-08 — pause #1 (two-point slope)
deck.pause("07_pause1", "PAUSE  &  TRY",
           "Find the slope between:",
           "(2, 3)  and  (5, 12)",
           hint="Pause.  Solve.  Press play when you're ready.")

def pause1_answer(img, d):
    d.text((110, 90), "Answer: slope = 3.", fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 190), "Points:  (2, 3)  and  (5, 12)", fill=INK, font=font("mono", 46))
    steps = [
        ("rise", "12 - 3", "9"),
        ("run", "5 - 2", "3"),
        ("slope", "rise / run", "9 / 3 = 3"),
    ]
    y = 320
    for label, middle, result in steps:
        d.rounded_rectangle([150, y, W - 150, y + 120], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((200, y + 34), label, fill=MAROON, font=font("serif_bold", 40))
        d.text((520, y + 34), middle, fill=INK, font=font("mono", 44))
        d.text((1010, y + 34), result, fill=deck.accent, font=font("mono", 44))
        y += 150
    d.text((150, 820), "Interpretation: for every 1 step right, the line rises 3.",
           fill=deck.accent, font=font("sans_bold", 38))
    d.text((150, 885), "Check: the order matched on top and bottom.",
           fill=MUTED, font=font("sans", 32))
deck.custom("08_pause1_silence", pause1_answer)


# 09 — four flavors of slope (custom: four mini graphs)
def four_types(img, d):
    d.text((110, 90), "Four flavors of slope.", fill=MAROON, font=font("serif_bold", 72))

    # Lay out four mini-cards in a 2x2 grid
    panels = [
        ("Positive",  "uphill  →",        "m  >  0",  "diagonal_up"),
        ("Negative",  "downhill  ↘",       "m  <  0",  "diagonal_down"),
        ("Zero",      "flat, no rise",     "m  =  0",  "horizontal"),
        ("Undefined", "vertical, no run",  "m  =  undef",  "vertical"),
    ]
    pw, ph, pad = 820, 360, 40
    start_x, start_y = 110, 230
    for i, (name, sub, eq, kind) in enumerate(panels):
        col, row = i % 2, i // 2
        x0 = start_x + col * (pw + pad)
        y0 = start_y + row * (ph + pad)
        x1, y1 = x0 + pw, y0 + ph
        d.rounded_rectangle([x0, y0, x1, y1], radius=20,
                            outline=MAROON, width=4, fill=deck.card_bg)
        # Mini coordinate plane on the left half of the card
        gx0, gy0 = x0 + 30, y0 + 50
        gx1, gy1 = x0 + 360, y0 + ph - 50
        cx = (gx0 + gx1) // 2
        cy = (gy0 + gy1) // 2
        # Axes
        d.line([(gx0, cy), (gx1, cy)], fill=INK, width=3)
        d.line([(cx, gy0), (cx, gy1)], fill=INK, width=3)
        # Line itself, by kind
        if kind == "diagonal_up":
            d.line([(gx0 + 20, gy1 - 20), (gx1 - 20, gy0 + 20)], fill=MAROON, width=7)
        elif kind == "diagonal_down":
            d.line([(gx0 + 20, gy0 + 20), (gx1 - 20, gy1 - 20)], fill=MAROON, width=7)
        elif kind == "horizontal":
            d.line([(gx0 + 20, cy - 50), (gx1 - 20, cy - 50)], fill=MAROON, width=7)
        elif kind == "vertical":
            d.line([(cx + 60, gy0 + 20), (cx + 60, gy1 - 20)], fill=MAROON, width=7)
        # Right-side text labels
        tx = x0 + 400
        d.text((tx, y0 + 60),  name, fill=MAROON, font=font("serif_bold", 46))
        d.text((tx, y0 + 130), sub,  fill=INK,    font=font("sans", 32))
        d.text((tx, y0 + 200), eq,   fill=deck.accent, font=font("mono", 40))

    d.text((110, 990), "Zero ≠ undefined.  Flat is a number.  Vertical is not.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("09_four_types", four_types)


# 10 — rate of change (definition card with examples)
def rate_of_change(img, d):
    d.text((110, 90), "Rate of change  =  slope.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 200),
           "Anytime you say 'per', you're describing a slope.",
           fill=MUTED, font=font("sans", 36))

    rows = [
        ("60 km / hr",        "speed",        "kilometers per hour"),
        ("$500 / month",      "saving rate",  "dollars per month"),
        ("8% grade",          "road sign",    "= 0.08  (rise per run)"),
        ("−3 L / hr",         "leaking tank", "liters per hour, going down"),
    ]
    y = 320
    for big, label, unit in rows:
        d.rounded_rectangle([110, y, W - 110, y + 130], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((150, y + 32), big,  fill=MAROON, font=font("mono", 52))
        d.text((780, y + 32), label, fill=INK,   font=font("serif_bold", 38))
        d.text((780, y + 82), unit,  fill=MUTED, font=font("sans", 30))
        y += 150
deck.custom("10_rate_of_change", rate_of_change)


# 11-12 — pause #2 (real-world rate of change)
deck.pause("11_pause2", "PAUSE  &  TRY  #2",
           "Tank starts at 50 L.  6 hours later it has 32 L.",
           "rate  =  ?  L / hr",
           hint="Treat time as x and water as y.  Two points, then the formula.")

def pause2_answer(img, d):
    d.text((110, 90), "Answer: -3 L / hr.", fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 190), "Use points  (0, 50)  and  (6, 32).",
           fill=INK, font=font("mono", 44))
    rows = [
        ("change in water", "32 - 50", "-18 L"),
        ("change in time", "6 - 0", "6 hr"),
        ("rate", "-18 / 6", "-3 L / hr"),
    ]
    y = 320
    for label, middle, result in rows:
        d.rounded_rectangle([150, y, W - 150, y + 120], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((200, y + 34), label, fill=MAROON, font=font("serif_bold", 38))
        d.text((690, y + 34), middle, fill=INK, font=font("mono", 44))
        d.text((1120, y + 34), result, fill=deck.accent, font=font("mono", 44))
        y += 150
    d.text((150, 820), "The negative sign matters: the tank is losing water.",
           fill=deck.accent, font=font("sans_bold", 38))
    d.text((150, 885), "Rate of change is slope with units attached.",
           fill=MUTED, font=font("sans", 32))
deck.custom("12_pause2_silence", pause2_answer)


# 13 — recap
deck.recap("13_recap", "Recap.", [
    "Slope  =  rise / run.  Count it off the grid.",
    "From two points:  m = (y₂ − y₁) / (x₂ − x₁).  Same order on top and bottom.",
    "Positive uphill · negative downhill · zero flat · vertical undefined.",
    "Rate of change is slope with units — km/hr, $/month, L/hr.",
], assignment=[
    "10 slope problems — mix of two-point and from-a-graph.",
    "1 real-world rate-of-change problem with a short written interpretation.",
])


# 14 — path
deck.path("14_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Ch 3",      "Slope of a Line section"),
    ("2.", "Khan Academy practice",   "Slope from two points + slope from a graph"),
    ("3.", "Assignment in dashboard", "10 slope problems + 1 real-world rate write-up"),
    ("4.", "Advisor check-in",        "Book one if either pause problem felt shaky"),
], next_text="Next up:  Module 10 — Writing Line Equations from Slope.")


print("Module 9 V2 (Slope & Rate of Change) slides built via slide_kit.")
