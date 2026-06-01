"""Algebra I - Module 6 (V2): Inequalities & Interval Notation.

Foundation V2 build. Number lines, open/closed endpoints, interval notation,
and set-builder notation are drawn deterministically. No generated images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, CREAM, GRID,
)

deck = Deck(course="Algebra I", module_num=6,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# ─── helper: draw a number line with optional endpoint marker and shading ───

def number_line(d, x0, x1, y, *, ticks, mark_value=None, mark_open=False,
                shade="left", label_each=True, accent=None):
    """Draw a number line from x0..x1 at vertical y.

    ticks: list of (value, label) tuples. Spaced evenly across [x0, x1].
    mark_value: which tick value to mark with an endpoint dot/circle.
    mark_open: True = open circle (excluded), False = closed dot (included).
    shade: "left", "right", or None.
    """
    accent = accent or deck.accent
    n = len(ticks)
    # spacing
    span = x1 - x0
    step = span / (n - 1)

    # axis line
    d.line([(x0 - 30, y), (x1 + 30, y)], fill=INK, width=4)
    # arrowheads
    d.polygon([(x0 - 30, y), (x0 - 10, y - 12), (x0 - 10, y + 12)], fill=INK)
    d.polygon([(x1 + 30, y), (x1 + 10, y - 12), (x1 + 10, y + 12)], fill=INK)

    # find mark x coordinate
    mark_x = None
    for i, (val, _) in enumerate(ticks):
        if val == mark_value:
            mark_x = x0 + i * step
            break

    # shading bar (drawn under the line)
    if shade and mark_x is not None:
        bar_y = y + 22
        if shade == "left":
            d.rectangle([x0 - 20, bar_y, mark_x, bar_y + 14], fill=accent)
            # leftward arrowhead
            d.polygon([(x0 - 40, bar_y + 7), (x0 - 20, bar_y - 5),
                       (x0 - 20, bar_y + 19)], fill=accent)
        elif shade == "right":
            d.rectangle([mark_x, bar_y, x1 + 20, bar_y + 14], fill=accent)
            d.polygon([(x1 + 40, bar_y + 7), (x1 + 20, bar_y - 5),
                       (x1 + 20, bar_y + 19)], fill=accent)

    # ticks + labels
    f_lab = font("mono", 32)
    for i, (_, label) in enumerate(ticks):
        tx = x0 + i * step
        d.line([(tx, y - 12), (tx, y + 12)], fill=INK, width=3)
        if label_each:
            lw = d.textlength(label, font=f_lab)
            d.text((tx - lw / 2, y + 50), label, fill=INK, font=f_lab)

    # endpoint marker
    if mark_x is not None:
        r = 22
        if mark_open:
            d.ellipse([mark_x - r, y - r, mark_x + r, y + r],
                      outline=MAROON, width=6, fill=deck.bg)
        else:
            d.ellipse([mark_x - r, y - r, mark_x + r, y + r],
                      fill=MAROON, outline=MAROON, width=6)


# 01 - title
deck.title("01_title", "Algebra I",
           "Module 6 - Inequalities & Interval Notation",
           "Foundation lesson  -  ~6 minutes")


# 02 - hook: snack budget, "at most"
def hook(img, d):
    d.text((110, 90), "Not equal.  At most.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 200),
           "You have $50 for snacks.  Each snack costs $4.  How many?",
           fill=MUTED, font=font("sans", 34))

    cards = [
        (110,  "Budget",   "$50",     "Hard ceiling on what you can spend."),
        (720,  "Per snack", "$4",     "Each one chips away at the budget."),
        (1330, "Snacks",   "x = ?",   "Whole numbers, but not just one answer."),
    ]
    for x0, label, value, foot in cards:
        d.rounded_rectangle([x0, 290, x0 + 480, 560], radius=20,
                            outline=MAROON, width=5, fill=deck.card_bg)
        d.text((x0 + 30, 320), label, fill=MAROON, font=font("serif_bold", 38))
        d.text((x0 + 30, 400), value, fill=INK, font=font("mono", 64))
        d.text((x0 + 30, 510), foot, fill=MUTED, font=font("sans", 22))

    d.text((110, 640), "The inequality:",
           fill=INK, font=font("sans", 34))
    f_eq = font("mono", 110)
    expr = "4 x  <=  50"
    tw = d.textlength(expr, font=f_eq)
    d.text(((W - tw) / 2, 720), expr, fill=MAROON, font=f_eq)

    d.text((110, 900),
           "x can be 0, 1, 2 ... up to 12.  A whole range, not one number.",
           fill=deck.accent, font=font("sans_bold", 32))
deck.custom("02_hook", hook)


# 03 - overview
deck.overview("03_overview", "Game plan.", [
    "Solve a linear inequality  -  same balance moves you know.",
    "The new rule  -  flip when you * / divide by a negative.",
    "Write it three ways  -  number line, interval, set-builder.",
], footnote="Goal:  solution as a range, not a single x.")


# 04 - concept: open vs closed endpoints + four symbols
def concept(img, d):
    d.text((110, 90), "Solutions live on a number line.",
           fill=MAROON, font=font("serif_bold", 66))
    d.text((110, 195),
           "An inequality picks a whole range, not just one number.",
           fill=MUTED, font=font("sans", 34))

    # left card: the four symbols
    d.rounded_rectangle([110, 290, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Four symbols",
           fill=MAROON, font=font("serif_bold", 40))
    rows = [
        ("<",  "less than",            "endpoint excluded  (open)"),
        (">",  "greater than",         "endpoint excluded  (open)"),
        ("<=", "less than or equal",   "endpoint included  (closed)"),
        (">=", "greater than or equal","endpoint included  (closed)"),
    ]
    y = 410
    for sym, name, edge in rows:
        d.text((180, y), sym, fill=INK, font=font("mono", 50))
        d.text((330, y + 8), name, fill=INK, font=font("sans_bold", 32))
        d.text((330, y + 58), edge, fill=MUTED, font=font("sans", 24))
        y += 110

    # right card: open vs closed dot demo on a number line
    d.rounded_rectangle([1000, 290, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((1040, 320), "Open vs closed",
           fill=MAROON, font=font("serif_bold", 40))

    # open circle row
    d.text((1040, 400), "x < 3   open circle:",
           fill=INK, font=font("sans_bold", 28))
    number_line(d, 1080, 1820, 510,
                ticks=[(0, "0"), (1, "1"), (2, "2"), (3, "3"),
                       (4, "4"), (5, "5")],
                mark_value=3, mark_open=True, shade="left")

    # closed dot row
    d.text((1040, 660), "x >= 3   closed dot:",
           fill=INK, font=font("sans_bold", 28))
    number_line(d, 1080, 1820, 770,
                ticks=[(0, "0"), (1, "1"), (2, "2"), (3, "3"),
                       (4, "4"), (5, "5")],
                mark_value=3, mark_open=False, shade="right")

    d.text((110, 950),
           "Open circle = not included.  Closed dot = included.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("04_concept", concept)


# 05 - compare: forgot to flip vs flipped
deck.compare("05_compare", "The flip rule.  Forget it, and you flip the answer.",
    left={
        "label": "X DON'T DO",
        "color": RED,
        "lines": [
            "-2x  <  10",
            "",
            "Divide by -2 ...",
            "and keep the sign:",
            "x  <  -5    X",
            "",
            "Test x = 0:  0 is not < -5.",
            "But 0 makes -2x = 0 < 10.",
        ],
        "footnote": "Skipping the flip gives the wrong half.",
    },
    right={
        "label": "+ DO",
        "color": MAROON,
        "lines": [
            "-2x  <  10",
            "",
            "Divide by -2 ...",
            "and FLIP the sign:",
            "x  >  -5",
            "",
            "Test x = 0:  0 > -5  +",
            "and -2(0) = 0 < 10  +",
        ],
        "footnote": "Multiply or divide by a negative  ->  flip.",
    },
)


# 06 - worked: no flip
def worked_basic(img, d):
    d.text((110, 90), "Worked  -  3x + 5 < 14   (no flip)",
           fill=MAROON, font=font("serif_bold", 60))

    steps = [
        ("3x + 5  <  14",        "the inequality"),
        ("3x  <  9",             "subtract 5 from both sides"),
        ("x  <  3",              "divide by +3   -   no flip"),
    ]
    f_eq = font("mono", 70)
    f_n  = font("sans", 28)
    y = 230
    for line, note in steps:
        tw = d.textlength(line, font=f_eq)
        d.text(((W - tw) / 2, y), line, fill=INK, font=f_eq)
        nw = d.textlength(note, font=f_n)
        d.text(((W - nw) / 2, y + 85), note, fill=deck.accent, font=f_n)
        y += 150

    # graph
    d.text((110, 700), "Graph:", fill=MAROON, font=font("serif_bold", 36))
    number_line(d, 280, 1640, 800,
                ticks=[(-2, "-2"), (-1, "-1"), (0, "0"), (1, "1"),
                       (2, "2"), (3, "3"), (4, "4"), (5, "5")],
                mark_value=3, mark_open=True, shade="left")

    # interval
    d.text((110, 920),
           "Interval:   ( -infinity ,  3 )      -      both ends open.",
           fill=deck.accent, font=font("mono", 38))
deck.custom("06_worked_basic", worked_basic)


# 07 - worked: with flip
def worked_flip(img, d):
    d.text((110, 90), "Worked  -  -2x + 7 >= 1   (FLIP)",
           fill=MAROON, font=font("serif_bold", 60))

    steps = [
        ("-2x + 7  >=  1",       "the inequality"),
        ("-2x  >=  -6",          "subtract 7 from both sides"),
        ("x  <=  3",             "divide by -2   ->   FLIP   >=   to   <="),
    ]
    f_eq = font("mono", 70)
    f_n  = font("sans", 28)
    y = 230
    for line, note in steps:
        tw = d.textlength(line, font=f_eq)
        color = MAROON if "FLIP" in note else INK
        d.text(((W - tw) / 2, y), line, fill=color, font=f_eq)
        nw = d.textlength(note, font=f_n)
        d.text(((W - nw) / 2, y + 85), note, fill=deck.accent, font=f_n)
        y += 150

    # graph
    d.text((110, 700), "Graph:", fill=MAROON, font=font("serif_bold", 36))
    number_line(d, 280, 1640, 800,
                ticks=[(-2, "-2"), (-1, "-1"), (0, "0"), (1, "1"),
                       (2, "2"), (3, "3"), (4, "4"), (5, "5")],
                mark_value=3, mark_open=False, shade="left")

    # interval
    d.text((110, 920),
           "Interval:   ( -infinity ,  3 ]      -      3 is included.",
           fill=deck.accent, font=font("mono", 38))
deck.custom("07_worked_flip", worked_flip)


# 08 - pause 1
deck.pause("08_pause1", "PAUSE  &  TRY  #1",
           "Solve, graph, and write in interval notation:",
           "4x - 3  >=  17",
           hint="Add 3 first.  Then divide by +4.  No flip here.")


# 09 - pause 1 answer reveal
def pause1_answer(img, d):
    d.text((110, 90), "Answer:  4x - 3 >= 17  ->  x >= 5.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 195),
           "Balance, graph, interval  -  every step shown.",
           fill=INK, font=font("sans", 32))

    steps = [
        ("Add 3 to both sides",         "4x  >=  20"),
        ("Divide by +4   (no flip)",    "x  >=  5"),
        ("Graph  -  closed dot at 5",   "shading to the right"),
        ("Interval notation",           "[ 5 ,  infinity )"),
    ]
    y = 300
    for label, line in steps:
        d.rounded_rectangle([130, y, W - 130, y + 110], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((170, y + 32), label, fill=MAROON, font=font("serif_bold", 32))
        d.text((900, y + 28), line, fill=INK, font=font("mono", 38))
        y += 130

    d.text((110, 940),
           "Infinity always uses a round bracket  -  you can never reach it.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("09_pause1_silence", pause1_answer)


# 10 - interval notation translation table
def interval_card(img, d):
    d.text((110, 90), "Three ways to write the same solution.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 195),
           "Number line  ->  interval notation  ->  set-builder.",
           fill=MUTED, font=font("sans", 32))

    # header row
    d.rounded_rectangle([110, 280, W - 110, 360], radius=14,
                        outline=MAROON, width=4, fill=deck.accent_light)
    d.text((150, 300), "Inequality",   fill=MAROON_DARK, font=font("serif_bold", 30))
    d.text((620, 300), "Interval",     fill=MAROON_DARK, font=font("serif_bold", 30))
    d.text((1080, 300),"Set-builder",  fill=MAROON_DARK, font=font("serif_bold", 30))
    d.text((1500, 300),"Endpoint",     fill=MAROON_DARK, font=font("serif_bold", 30))

    rows = [
        ("x < 3",   "( -inf , 3 )",   "{ x | x < 3 }",   "open  ( )"),
        ("x <= 3",  "( -inf , 3 ]",   "{ x | x <= 3 }",  "closed  ]"),
        ("x > -2",  "( -2 , inf )",   "{ x | x > -2 }",  "open  ( )"),
        ("x >= -2", "[ -2 , inf )",   "{ x | x >= -2 }", "closed  ["),
    ]
    y = 380
    for ineq, intv, setb, edge in rows:
        d.rounded_rectangle([110, y, W - 110, y + 110], radius=14,
                            outline=MAROON, width=3, fill=deck.card_bg)
        d.text((150, y + 32), ineq, fill=INK,    font=font("mono", 38))
        d.text((620, y + 32), intv, fill=INK,    font=font("mono", 38))
        d.text((1080, y + 32), setb, fill=INK,   font=font("mono", 32))
        d.text((1500, y + 38), edge, fill=MUTED, font=font("sans", 28))
        y += 125

    d.text((110, 920),
           "Round bracket = open (excluded).   Square bracket = closed (included).",
           fill=deck.accent, font=font("sans_bold", 30))
    d.text((110, 970),
           "Infinity always uses a round bracket.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("10_interval", interval_card)


# 11 - pause 2: read the graph, write the notation
def pause2_prompt(img, d):
    # banner
    d.rectangle([0, 80, W, 220], fill=deck.accent)
    centered(d, "PAUSE  &  TRY  #2", font("serif_bold", 96), 100, MAROON_DARK)

    d.text((110, 300),
           "Read the graph.  Write it in interval notation,",
           fill=INK, font=font("sans", 40))
    d.text((110, 360),
           "then in set-builder notation.",
           fill=INK, font=font("sans", 40))

    # graph: closed dot at -2, shade right
    d.text((110, 470), "Graph:", fill=MAROON, font=font("serif_bold", 36))
    number_line(d, 280, 1640, 570,
                ticks=[(-5, "-5"), (-4, "-4"), (-3, "-3"), (-2, "-2"),
                       (-1, "-1"), (0, "0"), (1, "1"), (2, "2")],
                mark_value=-2, mark_open=False, shade="right")

    d.text((110, 720),
           "Hint:  closed dot means the endpoint is included.",
           fill=MUTED, font=font("sans", 36))
    d.text((110, 800),
           "Pause now.  Translate it.  Press play when ready.",
           fill=deck.accent, font=font("sans_bold", 36))
deck.custom("11_pause2", pause2_prompt)


# 12 - pause 2 answer reveal
def pause2_answer(img, d):
    d.text((110, 90), "Answer:  closed dot at -2, shading right.",
           fill=MAROON, font=font("serif_bold", 52))
    d.text((110, 175),
           "Same solution  -  three forms.",
           fill=INK, font=font("sans", 32))

    # the matching graph
    d.text((110, 250), "Graph:", fill=MAROON, font=font("serif_bold", 32))
    number_line(d, 280, 1640, 350,
                ticks=[(-5, "-5"), (-4, "-4"), (-3, "-3"), (-2, "-2"),
                       (-1, "-1"), (0, "0"), (1, "1"), (2, "2")],
                mark_value=-2, mark_open=False, shade="right")

    rows = [
        ("Inequality",     "x  >=  -2"),
        ("Interval",       "[ -2 ,  infinity )"),
        ("Set-builder",    "{ x | x >= -2 }"),
    ]
    y = 520
    for label, line in rows:
        d.rounded_rectangle([130, y, W - 130, y + 110], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((170, y + 32), label, fill=MAROON, font=font("serif_bold", 34))
        d.text((900, y + 28), line, fill=INK, font=font("mono", 40))
        y += 130

    d.text((110, 940),
           "Closed dot  ->  square bracket.   Infinity  ->  round bracket.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("12_pause2_silence", pause2_answer)


# 13 - application: the assignment
def application(img, d):
    d.text((110, 90), "How the assignment uses this.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 195),
           "Solve, graph, and translate  -  every step shown.",
           fill=MUTED, font=font("sans", 34))

    d.rounded_rectangle([110, 290, W - 110, 830], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Dashboard assignment",
           fill=MAROON, font=font("serif_bold", 44))

    steps = [
        ("Part A",  "Solve and graph 10 inequalities."),
        ("Part B",  "At least 3 must force a sign flip  (divide by negative)."),
        ("Part C",  "Convert 5 graphs into interval AND set-builder notation."),
        ("Rubric",  "One sentence per graph  -  is the endpoint included or not?"),
    ]
    y = 420
    for label, body in steps:
        d.text((180, y), label, fill=deck.accent, font=font("serif_bold", 36))
        d.text((440, y), body, fill=INK, font=font("sans", 28))
        y += 90

    d.text((110, 880),
           "Show the flip when it happens.  Explain the bracket in plain English.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("13_application", application)


# 14 - recap
deck.recap("14_recap", "Recap.", [
    "Same balance moves as an equation  -  with one extra rule.",
    "FLIP the sign when you * or / both sides by a negative.",
    "Round bracket = open.   Square bracket = closed.",
    "Infinity always uses a round bracket.",
], assignment=[
    "Solve and graph 10 inequalities  -  3 with a sign flip.",
    "Convert 5 graphs into interval + set-builder notation.",
    "One sentence per graph explaining the endpoint.",
])


# 15 - path
deck.path("15_path", [
    ("✓",  "Watch this lesson",      "(done!)"),
    ("1.", "Read OpenStax Ch 2.7",   "Solve Linear Inequalities"),
    ("2.", "Khan Academy practice",  "Inequalities in one variable"),
    ("3.", "Assignment in dashboard","10 solve-and-graph + 5 graph-to-interval"),
    ("4.", "Advisor check-in",       "Book one if the flip rule still feels new."),
], next_text="Next up:  Module 7  -  Introduction to Functions.")


print("Module 6 V2 (Inequalities & Interval Notation) slides built via slide_kit.")
