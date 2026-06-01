"""Algebra I - Module 5 (V2): Solving Multi-Step Equations & Literal Equations.

Foundation V2 build. Variables on both sides, parentheses, fractions, and
rearranging literal equations like A = lw and PV = nRT are all drawn
deterministically. No generated images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, CREAM,
)

deck = Deck(course="Algebra I", module_num=5,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# 01 - title
deck.title("01_title", "Algebra I",
           "Module 5 - Multi-Step & Literal Equations",
           "Foundation lesson  -  ~6 minutes")


# 02 - hook: d = r t, solve for time
def hook(img, d):
    d.text((110, 90), "One unknown, hidden inside a product.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 195),
           "You know the distance and the rate.  Solve for the time.",
           fill=MUTED, font=font("sans", 34))

    cards = [
        (110,  "Distance",  "d = 400 mi",
         "Drive across the state line and back."),
        (720,  "Rate",      "r = 50 mi/h",
         "Average speed, set by the speed limit."),
        (1330, "Time",      "t = ?",
         "What we want to read off."),
    ]
    for x0, label, value, foot in cards:
        d.rounded_rectangle([x0, 290, x0 + 480, 560], radius=20,
                            outline=MAROON, width=5, fill=deck.card_bg)
        d.text((x0 + 30, 320), label, fill=MAROON, font=font("serif_bold", 40))
        d.text((x0 + 30, 400), value, fill=INK, font=font("mono", 56))
        d.text((x0 + 30, 500), foot, fill=MUTED, font=font("sans", 22))

    d.text((110, 640), "The formula:",
           fill=INK, font=font("sans", 34))
    f_eq = font("mono", 120)
    expr = "d  =  r  *  t"
    tw = d.textlength(expr, font=f_eq)
    d.text(((W - tw) / 2, 720), expr, fill=MAROON, font=f_eq)

    d.text((110, 900),
           "Rearrange once.  Read t = d / r off the page.",
           fill=deck.accent, font=font("sans_bold", 34))
deck.custom("02_hook", hook)


# 03 - overview
deck.overview("03_overview", "Game plan.", [
    "Multi-step  -  distribute, clear fractions, then balance.",
    "Distribute carefully  -  every term inside the parentheses.",
    "Literal equations  -  same moves, isolate any letter.",
], footnote="Goal:  show every move, then explain what the letter means.")


# 04 - concept slide: the cleanup steps
def concept(img, d):
    d.text((110, 90), "Same balance.  Cleaner setup.",
           fill=MAROON, font=font("serif_bold", 68))
    d.text((110, 195),
           "Multi-step equations add three cleanup moves before you solve.",
           fill=MUTED, font=font("sans", 34))

    moves = [
        ("1.", "Distribute",
         "Multiply across every parenthesis.",
         "2(x + 3)  ->  2x + 6"),
        ("2.", "Clear fractions",
         "Multiply every term by the LCD.",
         "(x/3) + 2 = (x/2) - 1   * 6"),
        ("3.", "Collect variables",
         "Variable terms on one side, constants on the other.",
         "3x - 3 = 2x + 7  ->  x = 10"),
    ]
    y = 320
    for n, label, body, demo in moves:
        d.rounded_rectangle([110, y, W - 110, y + 170], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((150, y + 30), n, fill=deck.accent, font=font("serif_bold", 50))
        d.text((230, y + 30), label, fill=MAROON, font=font("serif_bold", 44))
        d.text((230, y + 90), body, fill=INK, font=font("sans", 28))
        d.text((1100, y + 70), demo, fill=INK, font=font("mono", 36))
        y += 200

    d.text((110, 960),
           "After cleanup, it is just a two-step equation in disguise.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("04_concept", concept)


# 05 - compare: distribute trap
deck.compare("05_compare", "Two ways to wreck a distribute.",
    left={
        "label": "X DON'T DO",
        "color": RED,
        "lines": [
            "2(x + 3)  =  4x - 2",
            "",
            "Distribute only first term:",
            "2x + 3  =  4x - 2   X",
            "",
            "Or move x without",
            "matching the other side.",
        ],
        "footnote": "These are the two killer mistakes.",
    },
    right={
        "label": "+ DO",
        "color": MAROON,
        "lines": [
            "2(x + 3)  =  4x - 2",
            "",
            "Distribute every term:",
            "2x + 6  =  4x - 2",
            "",
            "Same move on BOTH sides",
            "when you shuffle x.",
        ],
        "footnote": "All-or-nothing distribution, every time.",
    },
)


# 06 - worked example: variables on both sides + parentheses
deck.equation("06_worked_distribute",
    "Worked  -  2(x + 3) = 4x - 2",
    [
        ("2(x + 3)  =  4x - 2",          INK,    "the equation"),
        ("2x + 6  =  4x - 2",            MUTED,  "distribute the 2"),
        ("6  =  2x - 2",                 MUTED,  "subtract 2x from both sides"),
        ("8  =  2x",                     MUTED,  "add 2 to both sides"),
        ("x  =  4",                      MAROON, "divide by 2  -  solution"),
    ],
)


# 07 - worked example: clear fractions with LCD
deck.equation("07_worked_fractions",
    "Worked  -  x/3 + 2 = x/2 - 1",
    [
        ("x/3 + 2  =  x/2 - 1",          INK,    "the equation"),
        ("6(x/3) + 6(2)  =  6(x/2) - 6", MUTED,  "multiply every term by LCD = 6"),
        ("2x + 12  =  3x - 6",           MUTED,  "fractions are gone"),
        ("12  =  x - 6",                 MUTED,  "subtract 2x from both sides"),
        ("x  =  18",                     MAROON, "add 6  -  solution"),
    ],
)


# 08 - pause 1
deck.pause("08_pause1", "PAUSE  &  TRY  #1",
           "Solve, then verify by substitution:",
           "3(x - 1)  =  2x + 7",
           hint="Distribute the 3 first.  Then move x terms.")


# 09 - pause 1 answer reveal
def pause1_answer(img, d):
    d.text((110, 90), "Answer:  3(x - 1) = 2x + 7  ->  x = 10.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 195),
           "Distribute, collect, then verify.",
           fill=INK, font=font("sans", 34))

    steps = [
        ("Distribute the 3",                 "3x - 3  =  2x + 7"),
        ("Subtract 2x from both sides",      "x - 3  =  7"),
        ("Add 3 to both sides",              "x  =  10"),
        ("Verify  -  sub x = 10",            "3(10 - 1) = 27,  2(10) + 7 = 27   +"),
    ]
    y = 290
    for label, line in steps:
        d.rounded_rectangle([130, y, W - 130, y + 130], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((170, y + 42), label, fill=MAROON, font=font("serif_bold", 34))
        d.text((900, y + 38), line, fill=INK, font=font("mono", 38))
        y += 150

    d.text((110, 940),
           "Show the distribute move.  Show the substitution.",
           fill=deck.accent, font=font("sans_bold", 32))
deck.custom("09_pause1_silence", pause1_answer)


# 10 - literal equations: A = lw  and  PV = nRT
def literal(img, d):
    d.text((110, 90), "Literal equations  -  isolate a chosen letter.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 185),
           "Every letter is a quantity.  Pick the target, then balance.",
           fill=MUTED, font=font("sans", 32))

    # left card: A = lw  ->  l = A/w
    d.rounded_rectangle([110, 290, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Rectangle area",
           fill=MAROON, font=font("serif_bold", 40))
    d.text((150, 400), "A  =  l * w",
           fill=INK, font=font("mono", 70))
    d.text((150, 510), "Solve for  l   -   divide by w :",
           fill=MUTED, font=font("sans", 30))
    d.text((150, 580), "A / w  =  l",
           fill=INK, font=font("mono", 60))
    d.text((150, 680), "l  =  A / w",
           fill=MAROON, font=font("mono", 70))
    d.text((150, 790), "l = length, isolated from area and width.",
           fill=deck.accent, font=font("sans_bold", 26))

    # right card: PV = nRT  ->  T = PV/(nR)
    d.rounded_rectangle([1000, 290, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((1040, 320), "Ideal gas law",
           fill=MAROON, font=font("serif_bold", 40))
    d.text((1040, 400), "P * V  =  n * R * T",
           fill=INK, font=font("mono", 60))
    d.text((1040, 510), "Solve for  T   -   divide by n R :",
           fill=MUTED, font=font("sans", 30))
    d.text((1040, 580), "PV / (nR)  =  T",
           fill=INK, font=font("mono", 54))
    d.text((1040, 680), "T  =  PV / (nR)",
           fill=MAROON, font=font("mono", 60))
    d.text((1040, 790), "T = temperature in the gas sample.",
           fill=deck.accent, font=font("sans_bold", 26))

    d.text((110, 950),
           "Same balance rule.  The target is a letter, not always x.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("10_literal", literal)


# 11 - pause 2: rearrange C = 2 pi r
deck.pause("11_pause2", "PAUSE  &  TRY  #2",
           "Rearrange to solve for r:",
           "C  =  2 * pi * r",
           hint="Treat 2*pi as one number.  One move, both sides.")


# 12 - pause 2 answer reveal
def pause2_answer(img, d):
    d.text((110, 90), "Answer:  C = 2 pi r  ->  r = C / (2 pi).",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 195),
           "Same balance.  One letter isolated.  One plain sentence.",
           fill=INK, font=font("sans", 34))

    steps = [
        ("Start",                           "C  =  2 * pi * r"),
        ("Divide both sides by 2 * pi",     "C / (2 pi)  =  r"),
        ("Final, target on the left",       "r  =  C / (2 pi)"),
    ]
    y = 320
    for label, line in steps:
        d.rounded_rectangle([130, y, W - 130, y + 150], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((170, y + 50), label, fill=MAROON, font=font("serif_bold", 36))
        d.text((900, y + 46), line, fill=INK, font=font("mono", 46))
        y += 170

    d.rounded_rectangle([110, 830, W - 110, 970], radius=18,
                        outline=deck.accent, width=4, fill=deck.card_bg)
    d.text((140, 855), "Explain in one sentence  (rubric item):",
           fill=MAROON, font=font("serif_bold", 28))
    d.text((140, 905),
           "r = radius - distance from the center of the circle to the edge.",
           fill=INK, font=font("sans", 28))
deck.custom("12_pause2_silence", pause2_answer)


# 13 - application: the assignment
def application(img, d):
    d.text((110, 90), "How the assignment uses this.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 195),
           "Solve and explain  -  not just final numbers.",
           fill=MUTED, font=font("sans", 34))

    d.rounded_rectangle([110, 290, W - 110, 830], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Dashboard assignment", fill=MAROON,
           font=font("serif_bold", 44))

    steps = [
        ("Part A",  "Solve 10 multi-step equations  -  both sides, parens, fractions."),
        ("Part B",  "Rearrange 5 literal equations  -  e.g., A = lw  and  PV = nRT."),
        ("Part C",  "Write one sentence per rearrangement  -  what does that letter mean?"),
        ("Rubric",  "Distribute shown, LCD shown, substitution check on multi-step."),
    ]
    y = 420
    for label, body in steps:
        d.text((180, y), label, fill=deck.accent, font=font("serif_bold", 36))
        d.text((440, y), body, fill=INK, font=font("sans", 28))
        y += 90

    d.text((110, 880),
           "Show the move, then say in English what the letter is.",
           fill=deck.accent, font=font("sans_bold", 32))
deck.custom("13_application", application)


# 14 - recap
deck.recap("14_recap", "Recap.", [
    "Distribute, then clear fractions with the LCD.",
    "All-or-nothing  -  every term inside the parentheses.",
    "Literal equations  -  same balance, isolate any letter.",
    "Then one sentence  -  what does the letter mean?",
], assignment=[
    "Solve 10 multi-step equations  -  both sides, parens, fractions.",
    "Rearrange 5 literal equations  -  e.g., A = lw  and  PV = nRT.",
    "One sentence per rearrangement explaining the letter.",
])


# 15 - path
deck.path("15_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Ch 2.4-2.5",
                                      "Use a General Strategy & Solve Equations with Variables on Both Sides"),
    ("2.", "Khan Academy practice",   "Variables on Both Sides problem set"),
    ("3.", "Assignment in dashboard", "10 multi-step + 5 literal rearrangements with explanations"),
    ("4.", "Advisor check-in",        "Book one if literal equations still feel like a new language."),
], next_text="Next up:  Module 6 - Linear Inequalities.")


print("Module 5 V2 (Multi-Step & Literal Equations) slides built via slide_kit.")
