"""Algebra I — Module 3 (V2): Properties of Real Numbers.

Foundation V2 build. Five named properties (commutative, associative,
distributive, identity, inverse), the same-rank traps for subtraction and
division, and a worked simplification chain are all drawn deterministically
here — no generated images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, GRID, CREAM,
)

deck = Deck(course="Algebra I", module_num=3,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# 01 — title
deck.title("01_title", "Algebra I",
           "Module 3 — Properties of Real Numbers",
           "Foundation lesson  ·  ~6 minutes")


# 02 — hook: same sum, two paths — one is mental-math fast.
def hook(img, d):
    d.text((110, 90), "Same sum.  Two paths.",
           fill=MAROON, font=font("serif_bold", 70))
    d.text((110, 185), "One is awkward.  The other is mental math.",
           fill=MUTED, font=font("sans", 36))

    f_big = font("mono", 130)
    expr = "17  +  25  +  13"
    tw = d.textlength(expr, font=f_big)
    d.text(((W - tw) / 2, 290), expr, fill=INK, font=f_big)

    cards = [
        (120, "In order", "17 + 25 = 42",   MUTED,
         "Then 42 + 13 = 55.   Slow, error-prone."),
        (1010, "Rearrange", "17 + 13 = 30",  MAROON,
         "Then 30 + 25 = 55.   Mental math."),
    ]
    for x0, label, line, color, foot in cards:
        d.rounded_rectangle([x0, 540, x0 + 790, 880], radius=20,
                            outline=color, width=5, fill=deck.card_bg)
        d.text((x0 + 40, 570), label, fill=color, font=font("serif_bold", 44))
        d.text((x0 + 40, 660), line, fill=INK, font=font("mono", 44))
        d.text((x0 + 40, 820), foot, fill=MUTED, font=font("sans", 28))

    d.text((110, 940),
           "Rearranging without breaking the math  —  that is a property.",
           fill=deck.accent, font=font("sans_bold", 32))
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "Five properties  —  commutative, associative, distributive, identity, inverse.",
    "The trap  —  subtraction and division do not behave like + and ×.",
    "One worked simplification  —  every step labeled with its property.",
], footnote="Goal:  justify every step, not just guess the final number.")


# 04 — commutative property
def commutative(img, d):
    d.text((110, 90), "Commutative  —  swap the order.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 190), "Order is free for + and × .   Not for − and ÷ .",
           fill=MUTED, font=font("sans", 36))

    rows = [
        ("+ ", "a + b  =  b + a",       "3 + 7  =  7 + 3  =  10", MAROON),
        ("× ", "a × b  =  b × a",       "4 × 9  =  9 × 4  =  36", MAROON),
        ("− ", "a − b  ≠  b − a",       "5 − 2 = 3,   2 − 5 = −3", RED),
        ("÷ ", "a ÷ b  ≠  b ÷ a",       "10 ÷ 2 = 5,   2 ÷ 10 = 0.2", RED),
    ]
    y = 320
    for sign, rule, ex, color in rows:
        d.rounded_rectangle([110, y, W - 110, y + 130], radius=18,
                            outline=color, width=4, fill=deck.card_bg)
        d.rounded_rectangle([140, y + 20, 230, y + 110], radius=14, fill=color)
        f_chip = font("serif_bold", 56)
        chip_w = d.textlength(sign, font=f_chip)
        d.text((140 + (90 - chip_w) / 2, y + 26), sign, fill=CREAM, font=f_chip)
        d.text((280, y + 22), rule, fill=INK, font=font("mono", 38))
        d.text((280, y + 80), ex, fill=color, font=font("sans", 30))
        y += 150

    d.text((110, 970),
           "Plus and times commute.   Minus and divide do not.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("04_commutative", commutative)


# 05 — associative property
def associative(img, d):
    d.text((110, 90), "Associative  —  regroup the parentheses.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 190),
           "Move the brackets.   Do not move the numbers.",
           fill=MUTED, font=font("sans", 36))

    rows = [
        ("+", "(a + b) + c  =  a + (b + c)",
         "(2 + 3) + 4  =  2 + (3 + 4)  =  9", MAROON),
        ("×", "(a × b) × c  =  a × (b × c)",
         "(2 × 3) × 4  =  2 × (3 × 4)  =  24", MAROON),
        ("−", "(a − b) − c  ≠  a − (b − c)",
         "(8 − 3) − 1 = 4,   8 − (3 − 1) = 6", RED),
        ("÷", "(a ÷ b) ÷ c  ≠  a ÷ (b ÷ c)",
         "(8 ÷ 4) ÷ 2 = 1,   8 ÷ (4 ÷ 2) = 4", RED),
    ]
    y = 320
    for sign, rule, ex, color in rows:
        d.rounded_rectangle([110, y, W - 110, y + 130], radius=18,
                            outline=color, width=4, fill=deck.card_bg)
        d.rounded_rectangle([140, y + 20, 230, y + 110], radius=14, fill=color)
        f_chip = font("serif_bold", 56)
        chip_w = d.textlength(sign, font=f_chip)
        d.text((140 + (90 - chip_w) / 2, y + 26), sign, fill=CREAM, font=f_chip)
        d.text((280, y + 22), rule, fill=INK, font=font("mono", 34))
        d.text((280, y + 80), ex, fill=color, font=font("sans", 28))
        y += 150

    d.text((110, 970),
           "Same club as commutative  —  plus and times only.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("05_associative", associative)


# 06 — distributive
def distributive(img, d):
    d.text((110, 90), "Distributive  —  the workhorse.",
           fill=MAROON, font=font("serif_bold", 70))
    d.text((110, 190),
           "One multiplication spreads across every term inside the parentheses.",
           fill=MUTED, font=font("sans", 32))

    # Centered formula
    f_eq = font("mono", 110)
    expr = "a × (b + c)  =  a × b  +  a × c"
    tw = d.textlength(expr, font=f_eq)
    d.text(((W - tw) / 2, 280), expr, fill=INK, font=f_eq)

    # Visual arrows  — the "spread"
    d.text((W / 2 - 250, 430), "↙", fill=deck.accent, font=font("serif_bold", 80))
    d.text((W / 2 + 180, 430), "↘", fill=deck.accent, font=font("serif_bold", 80))

    # Worked numeric and symbolic example
    cards = [
        (110, "Numeric", "3 × (4 + 5)",
         ["= 3 × 4  +  3 × 5",
          "= 12  +  15",
          "= 27"],
         "Same answer as 3 × 9 = 27."),
        (1000, "Symbolic", "3 × (x + 4)",
         ["= 3x  +  3 × 4",
          "= 3x  +  12",
          ""],
         "You will use this on almost every line."),
    ]
    for x0, label, top_line, lines, foot in cards:
        d.rounded_rectangle([x0, 560, x0 + 810, 940], radius=20,
                            outline=MAROON, width=5, fill=deck.card_bg)
        d.text((x0 + 40, 580), label, fill=MAROON, font=font("serif_bold", 40))
        d.text((x0 + 40, 640), top_line, fill=INK, font=font("mono", 40))
        y = 720
        for line in lines:
            d.text((x0 + 40, y), line, fill=INK, font=font("sans", 32))
            y += 50
        if foot:
            d.text((x0 + 40, 890), foot, fill=MUTED, font=font("sans", 26))
deck.custom("06_distributive", distributive)


# 07 — identity and inverse
def identity_inverse(img, d):
    d.text((110, 90), "Identity  &  Inverse.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 200),
           "Two numbers do nothing.   Two pairings undo each other.",
           fill=MUTED, font=font("sans", 34))

    rows = [
        ("Additive identity",       "a + 0  =  a",          "0 changes nothing under +"),
        ("Multiplicative identity", "a × 1  =  a",          "1 changes nothing under ×"),
        ("Additive inverse",        "a + (−a)  =  0",       "every number has an opposite"),
        ("Multiplicative inverse",  "a × (1/a)  =  1",      "every nonzero number has a reciprocal"),
    ]
    y = 330
    for name, rule, sub in rows:
        d.rounded_rectangle([110, y, W - 110, y + 140], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((150, y + 22), name, fill=MAROON, font=font("serif_bold", 38))
        d.text((150, y + 78), sub, fill=MUTED, font=font("sans", 28))
        # Rule on the right
        f_eq = font("mono", 46)
        rw = d.textlength(rule, font=f_eq)
        d.text((W - 150 - rw, y + 45), rule, fill=INK, font=f_eq)
        y += 160

    d.text((110, 980),
           "Identity = does nothing.   Inverse = cancels back to identity.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("07_identity_inverse", identity_inverse)


# 08 — trap (compare): plus/times club vs minus/divide
deck.compare("08_trap", "The trap  —  not every operation behaves the same.",
    left={
        "label": "✗ DOES NOT WORK",
        "color": RED,
        "lines": [
            "5  −  2   vs   2  −  5",
            "= 3       vs   = −3",
            "",
            "10 ÷ 2   vs   2 ÷ 10",
            "= 5       vs   = 0.2",
            "Minus and divide  —  order matters.",
        ],
        "footnote": "Never commute or associate minus / divide.",
    },
    right={
        "label": "✓ ALWAYS WORKS",
        "color": MAROON,
        "lines": [
            "3  +  7   =   7  +  3   =   10",
            "4  ×  9   =   9  ×  4   =   36",
            "",
            "(2+3)+4  =  2+(3+4)  =  9",
            "(2·3)·4  =  2·(3·4)  =  24",
            "Plus and times  —  free to rearrange.",
        ],
        "footnote": "Commutative + associative belong to + and × only.",
    },
)


# 09 — worked equation trace: simplify 3(x + 4) + 2x − 5  →  5x + 7
deck.equation("09_equation",
    "Simplify  3(x + 4) + 2x − 5",
    [
        ("3(x + 4) + 2x − 5",    INK,    "the expression"),
        ("3x + 12 + 2x − 5",     MUTED,  "distributive  —  spread 3 across (x + 4)"),
        ("3x + 2x + 12 − 5",     MUTED,  "commutative  —  rearrange terms"),
        ("(3x + 2x) + (12 − 5)", MUTED,  "associative  —  regroup like terms"),
        ("5x + 7",               MAROON, "combine  —  final answer"),
    ],
)


# 10-11 — pause #1:  name the property used in each line.
def pause1(img, d):
    # Standard pause banner
    d.rectangle([0, 80, W, 220], fill=deck.accent)
    centered(d, "PAUSE  &  TRY", font("serif_bold", 96), 100, MAROON_DARK)

    d.text((110, 290), "Name the property used in each line.",
           fill=INK, font=font("sans", 44))

    lines = [
        ("1.", "a × 1   =   a"),
        ("2.", "5 + (3 + 2)   =   (5 + 3) + 2"),
        ("3.", "4 × (x − 2)   =   4x − 8"),
    ]
    y = 420
    for tag, expr in lines:
        d.text((150, y), tag, fill=MAROON, font=font("serif_bold", 50))
        d.text((230, y), expr, fill=INK, font=font("mono", 56))
        y += 110

    d.text((110, 820),
           "Pause.  Name each one.  Press play when you're ready.",
           fill=MUTED, font=font("sans", 36))
deck.custom("10_pause1", pause1)


def pause1_answer(img, d):
    d.text((110, 90), "Answers  —  one property per line.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 190),
           "Identifying the rule is the same skill as the assignment chain.",
           fill=INK, font=font("sans", 34))

    rows = [
        ("1.", "a × 1  =  a",
         "Multiplicative identity",
         "multiplying by 1 returns the original"),
        ("2.", "5 + (3 + 2)  =  (5 + 3) + 2",
         "Associative  (addition)",
         "only the grouping changed"),
        ("3.", "4 × (x − 2)  =  4x − 8",
         "Distributive",
         "multiplication spread across the parentheses"),
    ]
    y = 310
    for tag, expr, name, why in rows:
        d.rounded_rectangle([130, y, W - 130, y + 180], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((170, y + 22), tag, fill=MAROON, font=font("serif_bold", 44))
        d.text((250, y + 22), expr, fill=INK, font=font("mono", 38))
        d.text((250, y + 88), name, fill=deck.accent, font=font("serif_bold", 36))
        d.text((250, y + 132), why, fill=MUTED, font=font("sans", 26))
        y += 200
deck.custom("11_pause1_silence", pause1_answer)


# 12 — application: tie to the dashboard assignment
def application(img, d):
    d.text((110, 90), "How the assignment uses this.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 190),
           "Justify every step  —  not just the final number.",
           fill=MUTED, font=font("sans", 34))

    # Mock assignment box
    d.rounded_rectangle([110, 290, W - 110, 760], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Dashboard assignment", fill=MAROON,
           font=font("serif_bold", 44))

    steps = [
        ("Part A",  "10 algebra steps from a simplification chain."),
        ("Task",    "Write the property next to each step."),
        ("Part B",  "5 of your own expressions to simplify."),
        ("Rubric",  "Every step labeled  —  not just the answer."),
    ]
    y = 410
    for label, body in steps:
        d.text((170, y), label, fill=deck.accent, font=font("serif_bold", 36))
        d.text((420, y), body, fill=INK, font=font("sans", 34))
        y += 80

    d.text((110, 820),
           "If you can name the rule, you can defend the answer.",
           fill=deck.accent, font=font("sans_bold", 36))
deck.custom("12_application", application)


# 13-14 — pause #2: simplify 2(x + 5) + 3(x − 1)
deck.pause("13_pause2", "PAUSE  &  TRY  #2",
           "Simplify this expression:",
           "2(x + 5)  +  3(x − 1)",
           hint="Distribute first.  Then commutative and associative to combine.")


def pause2_answer(img, d):
    d.text((110, 90), "Answer:  2(x + 5) + 3(x − 1)  =  5x + 7.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 185),
           "Four moves  —  each one a named property.",
           fill=INK, font=font("sans", 34))

    steps = [
        ("Distributive",  "2x + 10  +  3x − 3"),
        ("Commutative",   "2x + 3x  +  10 − 3"),
        ("Associative",   "(2x + 3x) + (10 − 3)"),
        ("Combine",       "5x + 7"),
    ]
    y = 290
    for label, line in steps:
        d.rounded_rectangle([150, y, W - 150, y + 130], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((200, y + 40), label, fill=MAROON, font=font("serif_bold", 40))
        d.text((780, y + 36), line, fill=INK, font=font("mono", 46))
        y += 150

    d.text((150, 920),
           "Same final form as the worked example  —  by design.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("14_pause2_silence", pause2_answer)


# 15 — recap
deck.recap("15_recap", "Recap.", [
    "Commutative  —  swap order  (+ and × only).",
    "Associative  —  regroup parentheses  (+ and × only).",
    "Distributive  —  multiplication spreads across a sum.",
    "Identity  —  a + 0 = a,   a × 1 = a.",
    "Inverse  —  a + (−a) = 0,   a × (1/a) = 1.",
], assignment=[
    "10 simplification steps  —  label each with the property used.",
    "5 expressions to simplify yourself  —  every step justified.",
    "1 short reflection  —  which property tripped you up?",
])


# 16 — path
deck.path("16_path", [
    ("✓",  "Watch this lesson",      "(done!)"),
    ("1.", "Read OpenStax Ch 1.3–1.5",
                                     "Properties of Real Numbers section"),
    ("2.", "Khan Academy practice",  "Properties of Numbers practice set"),
    ("3.", "Assignment in dashboard","10-step chain  +  5 your-own expressions"),
    ("4.", "Advisor check-in",       "Book one if naming the property felt shaky."),
], next_text="Next up:  Module 4 — Solving Linear Equations.")


print("Module 3 V2 (Properties of Real Numbers) slides built via slide_kit.")
