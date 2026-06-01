"""Algebra I — Module 2 (V2): Order of Operations.

Foundation V2 build. PEMDAS traces, the M/D and A/S same-level trap, and the
worked real-world example are all drawn deterministically here — no generated
images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, GRID, CREAM,
)

deck = Deck(course="Algebra I", module_num=2,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# 01 — title
deck.title("01_title", "Algebra I",
           "Module 2 — Order of Operations",
           "Foundation lesson  ·  ~6 minutes")


# 02 — hook: same expression, two answers — only one is correct.
def hook(img, d):
    d.text((110, 90), "Same expression.  Two answers.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 175), "Only one of them is correct.",
           fill=MUTED, font=font("sans", 36))

    # Centered big expression
    f_big = font("mono", 150)
    expr = "8  +  2  ×  3"
    tw = d.textlength(expr, font=f_big)
    d.text(((W - tw) / 2, 290), expr, fill=INK, font=f_big)

    # Two outcome cards: left to right (wrong) vs PEMDAS (right)
    cards = [
        (120, "✗  Left to right", "(8 + 2) × 3  =  30", RED,
         "Read like English — but math is not English."),
        (1010, "✓  PEMDAS order", "8 + (2 × 3)  =  14", MAROON,
         "Multiplication ranks above addition."),
    ]
    for x0, label, line, color, foot in cards:
        d.rounded_rectangle([x0, 540, x0 + 790, 880], radius=20,
                            outline=color, width=5, fill=deck.card_bg)
        d.text((x0 + 40, 570), label, fill=color, font=font("serif_bold", 44))
        d.text((x0 + 40, 660), line, fill=INK, font=font("mono", 44))
        d.text((x0 + 40, 820), foot, fill=MUTED, font=font("sans", 28))

    d.text((110, 940),
           "The order of operations is the tiebreaker.",
           fill=deck.accent, font=font("sans_bold", 36))
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "PEMDAS  —  what each letter actually means.",
    "A worked example you can copy step by step.",
    "The trap:  M and D share a rank.  So do A and S.",
    "A real-world expression where PEMDAS protects your money.",
], footnote="Goal:  read every expression in one direction.")


# 04 — PEMDAS definition card
def pemdas(img, d):
    d.text((110, 90), "PEMDAS  —  the order.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 200), "Every multi-step expression follows these ranks.",
           fill=MUTED, font=font("sans", 36))

    rows = [
        ("P", "Parentheses",       "anything inside brackets first"),
        ("E", "Exponents",         "powers and roots next"),
        ("MD", "Multiply / Divide", "same rank  —  left to right"),
        ("AS", "Add / Subtract",    "same rank  —  left to right"),
    ]
    y = 320
    for letter, name, sub in rows:
        d.rounded_rectangle([110, y, W - 110, y + 130], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        # Letter chip
        d.rounded_rectangle([140, y + 20, 280, y + 110], radius=14,
                            fill=MAROON)
        chip = letter
        f_chip = font("serif_bold", 60)
        chip_w = d.textlength(chip, font=f_chip)
        d.text((140 + (140 - chip_w) / 2, y + 28), chip,
               fill=CREAM, font=f_chip)
        # Name + sub
        d.text((320, y + 22), name, fill=INK, font=font("serif_bold", 46))
        d.text((320, y + 82), sub, fill=deck.accent, font=font("sans", 32))
        y += 150

    d.text((110, 980),
           "BODMAS in some countries  —  same rule, different name.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("04_pemdas", pemdas)


# 05 — worked equation trace: 8 + 2 × (3 + 1)²
deck.equation("05_equation", "Evaluate  8  +  2 × (3 + 1)²", [
    ("8 + 2 × (3 + 1)²", INK,    "the expression"),
    ("8 + 2 × (4)²",     MUTED,  "P  —  parentheses first"),
    ("8 + 2 × 16",       MUTED,  "E  —  exponent next"),
    ("8 + 32",           MUTED,  "M  —  multiply before add"),
    ("40",               MAROON, "A  —  finally add"),
])


# 06 — trap: left-to-right vs PEMDAS  (5 + 3 × 4)
deck.compare("06_trap", "The trap  —  rank beats direction.",
    left={
        "label": "✗ WRONG",
        "color": RED,
        "lines": [
            "5  +  3  ×  4",
            "= 8 × 4    (left to right)",
            "= 32",
            "",
            "Treated math like English.",
        ],
        "footnote": "Reading order ≠ operation order.",
    },
    right={
        "label": "✓ RIGHT",
        "color": MAROON,
        "lines": [
            "5  +  3  ×  4",
            "= 5 + 12   (× before +)",
            "= 17",
            "",
            "Multiply before add  —  always.",
        ],
        "footnote": "Direction matters.  Rank matters more.",
    },
)


# 07-08 — pause #1:  20 − 2 × (3 + 2)
deck.pause("07_pause1", "PAUSE  &  TRY",
           "Evaluate this expression:",
           "20  −  2 × (3 + 2)",
           hint="Pause.  Solve.  Press play when you're ready.")


def pause1_answer(img, d):
    d.text((110, 90), "Answer:  20  −  2 × (3 + 2)  =  10.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 190), "P  →  M  →  S.  In that order.",
           fill=INK, font=font("sans", 40))

    steps = [
        ("P  —  parentheses", "3 + 2",     "= 5"),
        ("M  —  multiply",    "2 × 5",     "= 10"),
        ("S  —  subtract",    "20 − 10",   "= 10"),
    ]
    y = 320
    for label, middle, result in steps:
        d.rounded_rectangle([150, y, W - 150, y + 130], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((200, y + 40), label, fill=MAROON, font=font("serif_bold", 40))
        d.text((780, y + 36), middle, fill=INK,   font=font("mono", 48))
        d.text((1280, y + 36), result, fill=deck.accent, font=font("mono", 48))
        y += 160

    d.text((150, 830),
           "If you got 90, you went left to right  —  multiplied 18 × 5.",
           fill=deck.accent, font=font("sans_bold", 32))
deck.custom("08_pause1_silence", pause1_answer)


# 09 — same-level trap: M and D share a rank;  A and S share a rank
def same_level(img, d):
    d.text((110, 90), "M and D share a rank.  So do A and S.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 195),
           "Within one rank  —  always left to right.",
           fill=MUTED, font=font("sans", 36))

    # Big shared expression at the top
    f_eq = font("mono", 110)
    expr = "24  ÷  4  ×  2"
    tw = d.textlength(expr, font=f_eq)
    d.text(((W - tw) / 2, 295), expr, fill=INK, font=f_eq)

    # Two columns: wrong (M before D) vs right (L → R within MD rank)
    cards = [
        (110, "✗ WRONG", RED,
         ["Did multiplication first",
          "24 ÷ (4 × 2)",
          "= 24 ÷ 8",
          "= 3"],
         "Treated M as ranked above D."),
        (1000, "✓ RIGHT", MAROON,
         ["Left to right within rank",
          "(24 ÷ 4) × 2",
          "= 6 × 2",
          "= 12"],
         "Same rank — read left to right."),
    ]
    for x0, label, color, lines, foot in cards:
        d.rounded_rectangle([x0, 480, x0 + 810, 880], radius=20,
                            outline=color, width=5, fill=deck.card_bg)
        d.text((x0 + 40, 510), label, fill=color, font=font("serif_bold", 44))
        y = 600
        for line in lines:
            d.text((x0 + 40, y), line, fill=INK, font=font("sans", 32))
            y += 52
        d.text((x0 + 40, 830), foot, fill=MUTED, font=font("sans", 26))

    d.text((110, 950),
           "A and S work the same way  —  one rank, read left to right.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("09_same_level", same_level)


# 10 — application:  phone plan PEMDAS protects your bill
def application(img, d):
    d.text((110, 90), "Real life uses PEMDAS too.",
           fill=MAROON, font=font("serif_bold", 70))
    d.text((110, 200),
           "Phone plan:  $20 / month  +  $0.10 / minute  ·  30 minutes used.",
           fill=MUTED, font=font("sans", 32))

    # Centered expression
    f_eq = font("mono", 90)
    expr = "Total  =  20  +  0.10  ×  30"
    tw = d.textlength(expr, font=f_eq)
    d.text(((W - tw) / 2, 290), expr, fill=INK, font=f_eq)

    steps = [
        ("M  —  multiply", "0.10 × 30",  "= 3"),
        ("A  —  add",      "20 + 3",     "= $23"),
    ]
    y = 460
    for label, middle, result in steps:
        d.rounded_rectangle([150, y, W - 150, y + 130], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((200, y + 40), label, fill=MAROON, font=font("serif_bold", 40))
        d.text((780, y + 36), middle, fill=INK,   font=font("mono", 48))
        d.text((1280, y + 36), result, fill=deck.accent, font=font("mono", 48))
        y += 160

    # Contrast: wrong order makes the bill explode
    d.rounded_rectangle([150, 800, W - 150, 940], radius=18,
                        outline=RED, width=4, fill=deck.card_bg)
    d.text((200, 820), "Without PEMDAS  —  left to right:",
           fill=RED, font=font("serif_bold", 34))
    d.text((200, 875), "(20 + 0.10) × 30   =   20.10 × 30   =   $603",
           fill=INK, font=font("mono", 36))
deck.custom("10_application", application)


# 11-12 — pause #2:  10 + 2³ × 3 − 4
deck.pause("11_pause2", "PAUSE  &  TRY  #2",
           "Evaluate this expression:",
           "10  +  2³ × 3  −  4",
           hint="No parentheses.  Start with the exponent.")


def pause2_answer(img, d):
    d.text((110, 90), "Answer:  10 + 2³ × 3 − 4  =  30.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 190), "E  →  M  →  A  →  S.  Left to right within AS.",
           fill=INK, font=font("sans", 36))

    steps = [
        ("E  —  exponent", "2³",          "= 8"),
        ("M  —  multiply", "8 × 3",       "= 24"),
        ("A  —  add",      "10 + 24",     "= 34"),
        ("S  —  subtract", "34 − 4",      "= 30"),
    ]
    y = 300
    for label, middle, result in steps:
        d.rounded_rectangle([150, y, W - 150, y + 120], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((200, y + 34), label, fill=MAROON, font=font("serif_bold", 38))
        d.text((780, y + 32), middle, fill=INK,   font=font("mono", 46))
        d.text((1280, y + 32), result, fill=deck.accent, font=font("mono", 46))
        y += 140

    d.text((150, 890),
           "A and S share a rank  —  read 10 + 24 − 4 left to right, never +/− out of order.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("12_pause2_silence", pause2_answer)


# 13 — recap
deck.recap("13_recap", "Recap.", [
    "P  ·  E  ·  MD  (left to right)  ·  AS  (left to right).",
    "M and D share one rank.  A and S share one rank.",
    "Direction matters  —  but rank decides first.",
    "Read every expression once in PEMDAS order.",
], assignment=[
    "5 multi-step expressions  —  at least 4 operations each.",
    "Label every step with the PEMDAS rule it uses.",
    "1 short reflection on the mistake you had to avoid.",
])


# 14 — path
deck.path("14_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Ch 1.1",    "Order of Operations section"),
    ("2.", "Khan Academy practice",   "Order of Operations practice set"),
    ("3.", "Assignment in dashboard", "5 multi-step expressions  +  PEMDAS labels"),
    ("4.", "Advisor check-in",        "Book one if either pause felt shaky."),
], next_text="Next up:  Module 3 — Properties of Real Numbers.")


print("Module 2 V2 (Order of Operations) slides built via slide_kit.")
