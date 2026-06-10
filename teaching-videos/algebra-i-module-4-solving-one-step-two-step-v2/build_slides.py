"""Algebra I — Module 4 (V2): Solving One-Step & Two-Step Equations.

Foundation V2 build. Balance idea, inverse operations, the reverse-PEMDAS
order, and substitution-based verification are all drawn deterministically —
no generated images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, CREAM,
)

deck = Deck(course="Algebra I", module_num=4,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# 01 — title
deck.title("01_title", "Algebra I",
           "Module 4 — Solving One-Step & Two-Step Equations",
           "Foundation lesson  ·  ~6 minutes")


# 02 — hook: babysitting word problem
def hook(img, d):
    d.text((110, 90), "One real unknown.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 195), "You babysit.  How many hours did you work?",
           fill=MUTED, font=font("sans", 36))

    cards = [
        (110, "Rate", "$5 / hour",
         "What the family pays per hour you work."),
        (720, "Tip", "+$10",
         "Flat tip on top, regardless of hours."),
        (1330, "Take-home", "$45",
         "Total cash in your pocket tonight."),
    ]
    for x0, label, value, foot in cards:
        d.rounded_rectangle([x0, 290, x0 + 480, 560], radius=20,
                            outline=MAROON, width=5, fill=deck.card_bg)
        d.text((x0 + 30, 320), label, fill=MAROON, font=font("serif_bold", 40))
        d.text((x0 + 30, 400), value, fill=INK, font=font("mono", 60))
        d.text((x0 + 30, 500), foot, fill=MUTED, font=font("sans", 22))

    d.text((110, 640), "Translate the story into one line:",
           fill=INK, font=font("sans", 34))
    f_eq = font("mono", 120)
    expr = "5h  +  10  =  45"
    tw = d.textlength(expr, font=f_eq)
    d.text(((W - tw) / 2, 720), expr, fill=MAROON, font=f_eq)

    d.text((110, 900),
           "One unknown.   One equation.   Six minutes to find h.",
           fill=deck.accent, font=font("sans_bold", 34))
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "Balance  —  same move to both sides, every time.",
    "One-step then two-step  —  reverse PEMDAS order.",
    "Verify  —  substitute your answer back into the original.",
], footnote="Goal:  show every move, not just the final number.")


# 04 — balance scale
def balance(img, d):
    d.text((110, 90), "Equation  =  balanced scale.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 195),
           "Same operation on both sides  —  the only legal move.",
           fill=MUTED, font=font("sans", 36))

    cx = W // 2
    pivot_y = 620

    d.polygon([(cx - 60, pivot_y + 140), (cx + 60, pivot_y + 140), (cx, pivot_y + 20)],
              fill=MAROON_DARK)
    d.rectangle([cx - 600, pivot_y - 10, cx + 600, pivot_y + 20], fill=MAROON)
    d.line([(cx - 480, pivot_y + 20), (cx - 480, pivot_y + 110)], fill=MAROON_DARK, width=4)
    d.line([(cx + 480, pivot_y + 20), (cx + 480, pivot_y + 110)], fill=MAROON_DARK, width=4)

    for sign in (-1, +1):
        x0 = cx + sign * 480 - 160
        d.rounded_rectangle([x0, pivot_y + 110, x0 + 320, pivot_y + 230],
                            radius=18, outline=MAROON, width=5, fill=deck.card_bg)

    d.text((cx - 480 - 100, pivot_y + 145), "x + 7",
           fill=INK, font=font("mono", 70))
    d.text((cx + 480 - 50, pivot_y + 145), "12",
           fill=INK, font=font("mono", 70))

    d.text((110, 320),
           "If you add 3 to the left, you must add 3 to the right  —",
           fill=INK, font=font("sans", 34))
    d.text((110, 370),
           "or the scale tips and the equation is no longer true.",
           fill=INK, font=font("sans", 34))

    rules = [
        "+  same number both sides",
        "−  same number both sides",
        "×  same nonzero number both sides",
        "÷  same nonzero number both sides",
    ]
    for i, line in enumerate(rules):
        d.text((110, 450 + i * 50), "·", fill=deck.accent, font=font("serif_bold", 40))
        d.text((150, 460 + i * 50), line, fill=INK, font=font("sans", 30))

    d.text((110, 980),
           "Balance is the only rule  —  every other move is built from it.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("04_balance", balance)


# 05 — one-step worked example
deck.equation("05_onestep",
    "One-step  —  Solve  x + 7 = 12",
    [
        ("x + 7  =  12",            INK,    "the equation"),
        ("x + 7 − 7  =  12 − 7",    MUTED,  "subtract 7 from both sides"),
        ("x  =  5",                 MAROON, "solution"),
    ],
)


# 06 — two-step worked example
deck.equation("06_twostep_equation",
    "Two-step  —  Solve  3x + 5 = 20",
    [
        ("3x + 5  =  20",                 INK,    "the equation"),
        ("3x + 5 − 5  =  20 − 5",         MUTED,  "subtract 5  —  undo the outer layer first"),
        ("3x  =  15",                     MUTED,  "now only the coefficient is in the way"),
        ("3x / 3  =  15 / 3",             MUTED,  "divide both sides by 3"),
        ("x  =  5",                       MAROON, "solution"),
    ],
)


# 07 — verification by substitution
def verify(img, d):
    d.text((110, 90), "Verify  —  substitute and check.",
           fill=MAROON, font=font("serif_bold", 68))
    d.text((110, 195),
           "Plug your answer back into the ORIGINAL equation.",
           fill=MUTED, font=font("sans", 36))

    f_big = font("mono", 96)
    expr = "3x  +  5  =  20"
    tw = d.textlength(expr, font=f_big)
    d.text(((W - tw) / 2, 290), expr, fill=INK, font=f_big)

    d.text((W / 2 - 30, 410), "↓", fill=deck.accent, font=font("serif_bold", 80))
    d.text((W / 2 - 240, 440), "substitute  x = 5",
           fill=deck.accent, font=font("sans_bold", 32))

    steps = [
        ("3 (5)  +  5  =  20",   "plug x = 5 in"),
        ("15  +  5  =  20",      "multiply first"),
        ("20  =  20   ✓",        "both sides match  —  verified"),
    ]
    y = 560
    for line, note in steps:
        d.rounded_rectangle([200, y, W - 200, y + 110], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((240, y + 25), line, fill=INK, font=font("mono", 54))
        d.text((1100, y + 38), note, fill=MUTED, font=font("sans", 28))
        y += 130

    d.text((110, 960),
           "If both sides match, you solved it.   If not, redo the steps.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("07_verify", verify)


# 08 — trap: undoing in the wrong order
deck.compare("08_trap", "The trap  —  undoing in the wrong order.",
    left={
        "label": "✗ DIVIDE FIRST",
        "color": RED,
        "lines": [
            "3x + 5  =  20",
            "÷ 3 first ...",
            "x + 5/3  =  20/3",
            "",
            "Legal, but fractions",
            "make the rest a mess.",
        ],
        "footnote": "Almost every algebra error starts here.",
    },
    right={
        "label": "✓ REVERSE PEMDAS",
        "color": MAROON,
        "lines": [
            "3x + 5  =  20",
            "− 5 first ...",
            "3x  =  15",
            "÷ 3  ...",
            "x  =  5",
            "Clean integers all the way.",
        ],
        "footnote": "Strip the addition first, then the coefficient.",
    },
)


# 09 — pause 1
deck.pause("09_pause1", "PAUSE  &  TRY  #1",
           "Solve, then verify by substitution:",
           "2x  −  7  =  11",
           hint="Reverse PEMDAS  —  undo the subtraction first.")


# 10 — pause 1 answer reveal
def pause1_answer(img, d):
    d.text((110, 90), "Answer:  2x − 7 = 11  →  x = 9.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 195),
           "Three moves  —  solve, solve, then verify.",
           fill=INK, font=font("sans", 34))

    steps = [
        ("Add 7 to both sides",       "2x  =  18"),
        ("Divide both sides by 2",    "x  =  9"),
        ("Verify  —  sub x = 9",      "2(9) − 7  =  18 − 7  =  11   ✓"),
    ]
    y = 320
    for label, line in steps:
        d.rounded_rectangle([130, y, W - 130, y + 150], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((170, y + 50), label, fill=MAROON, font=font("serif_bold", 38))
        d.text((860, y + 46), line, fill=INK, font=font("mono", 46))
        y += 170

    d.text((110, 920),
           "Solve, then prove.   The check is half the grade.",
           fill=deck.accent, font=font("sans_bold", 32))
deck.custom("10_pause1_silence", pause1_answer)


# 11 — application
def application(img, d):
    d.text((110, 90), "How the assignment uses this.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 195),
           "Show every move  —  not just the final number.",
           fill=MUTED, font=font("sans", 34))

    d.rounded_rectangle([110, 290, W - 110, 820], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Dashboard assignment", fill=MAROON,
           font=font("serif_bold", 44))

    steps = [
        ("Part A",  "Solve 15 equations  —  one-step, two-step, fractions, negatives."),
        ("Part B",  "For 5 of those, show the substitution check."),
        ("Part C",  "Write 1 original word problem that becomes a two-step equation."),
        ("Rubric",  "Every step labeled  —  inverse op named, both sides shown."),
    ]
    y = 420
    for label, body in steps:
        d.text((180, y), label, fill=deck.accent, font=font("serif_bold", 36))
        d.text((440, y), body, fill=INK, font=font("sans", 30))
        y += 90

    d.text((110, 880),
           "If you can show the move, you can defend the answer.",
           fill=deck.accent, font=font("sans_bold", 34))
deck.custom("11_application", application)


# 12 — pause 2
deck.pause("12_pause2", "PAUSE  &  TRY  #2",
           "Solve, then verify  —  mind the negatives:",
           "x / 4  +  3  =  −2",
           hint="Subtract 3 first.  Then multiply both sides by 4.")


# 13 — pause 2 answer reveal
def pause2_answer(img, d):
    d.text((110, 90), "Answer:  x/4 + 3 = −2  →  x = −20.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 195),
           "Negatives flip nothing about the strategy.",
           fill=INK, font=font("sans", 34))

    steps = [
        ("Subtract 3 from both sides",   "x / 4  =  −5"),
        ("Multiply both sides by 4",     "x  =  −20"),
        ("Verify  —  sub x = −20",       "(−20)/4 + 3  =  −5 + 3  =  −2   ✓"),
    ]
    y = 320
    for label, line in steps:
        d.rounded_rectangle([130, y, W - 130, y + 150], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((170, y + 50), label, fill=MAROON, font=font("serif_bold", 36))
        d.text((900, y + 46), line, fill=INK, font=font("mono", 44))
        y += 170

    d.text((110, 920),
           "Reverse PEMDAS  +  substitution check  —  every time.",
           fill=deck.accent, font=font("sans_bold", 32))
deck.custom("13_pause2_silence", pause2_answer)


# 14 — recap
deck.recap("14_recap", "Recap.", [
    "Equation = balanced scale  —  same op to both sides.",
    "Reverse PEMDAS  —  undo +/− before ×/÷.",
    "Always verify  —  substitute back into the ORIGINAL.",
], assignment=[
    "Solve 15 equations  —  one-step, two-step, fractions, negatives.",
    "Show substitution check on 5 of them.",
    "Write 1 original two-step word problem.",
])


# 15 — path
deck.path("15_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Ch 2.1–2.2",
                                      "Solving Equations Using the Subtraction and Division Properties"),
    ("2.", "Khan Academy practice",   "Two-step equations practice set"),
    ("3.", "Assignment in dashboard", "15 equations  +  5 verifications  +  1 word problem"),
    ("4.", "Advisor check-in",        "Book one if reverse PEMDAS still feels backwards."),
], next_text="Next up:  Module 5 — Multi-Step Equations & Combining Like Terms.")


print("Module 4 V2 (Solving One-Step & Two-Step Equations) slides built via slide_kit.")
