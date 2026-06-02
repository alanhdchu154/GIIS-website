"""Algebra I - Module 14 (V2): Quadratic Equations.

Foundation V2 build. Every precision visual - standard form card, zero-product
diagram, completing-the-square trace, quadratic formula plate, discriminant
sign table, and the rearrange-first trap - is drawn deterministically. No
generated images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, GRID, CREAM,
)

deck = Deck(course="Algebra I", module_num=14,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# 01 - title
deck.title("01_title", "Algebra I",
           "Module 14 - Quadratic Equations",
           "Foundation lesson  -  ~6 minutes")


# 02 - hook: factored polynomial vs equation set to zero
def hook(img, d):
    d.text((110, 90), "From polynomial  ->  equation.",
           fill=MAROON, font=font("serif_bold", 60))

    # the polynomial vs equation
    d.rounded_rectangle([110, 220, W - 110, 420], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((180, 260), "Last module:   x^2  +  5 x  +  6",
           fill=MUTED, font=font("mono", 48))
    d.text((180, 340), "This module:   x^2  +  5 x  +  6   =   0",
           fill=INK, font=font("mono", 48))

    # the key idea
    d.rounded_rectangle([110, 470, W - 110, 720], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 500), "What changed:",
           fill=MAROON, font=font("serif_bold", 36))
    d.text((180, 570), "The equals zero on the right",
           fill=INK, font=font("sans", 36))
    d.text((180, 625), "turns a polynomial into an equation",
           fill=INK, font=font("sans", 36))
    d.text((180, 680), "with specific x-values that solve it.",
           fill=INK, font=font("sans", 36))

    # callout
    d.text((110, 800),
           "Solutions  =  the x-values that make the left side equal zero.",
           fill=deck.accent, font=font("sans_bold", 32))
    d.text((110, 855),
           "Three methods get you there.   Module 14 teaches all three.",
           fill=INK, font=font("sans", 28))
deck.custom("02_hook", hook)


# 03 - overview
deck.overview("03_overview", "Game plan.", [
    "Zero-product property   -   factors that multiply to 0 mean one factor is 0.",
    "Three methods            -   factoring,  completing the square,  quadratic formula.",
    "Discriminant             -   b^2 - 4 a c predicts how many real solutions.",
], footnote="Every quadratic equation can be solved.   The right method depends on the numbers.")


# 04 - concept: standard form + zero-product property
def concept(img, d):
    d.text((110, 90), "Standard form  +  zero-product property.",
           fill=MAROON, font=font("serif_bold", 52))
    d.text((110, 195),
           "Get the equation to look exactly like this before you start solving.",
           fill=MUTED, font=font("sans", 28))

    # standard form card
    d.rounded_rectangle([110, 270, W - 110, 540], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 300), "Standard form",
           fill=MAROON, font=font("serif_bold", 36))
    d.text((180, 380), "a x^2  +  b x  +  c   =   0",
           fill=MAROON_DARK, font=font("mono", 66))
    d.text((180, 480),
           "with  a  =/=  0.   Coefficients a, b, c can be any real numbers.",
           fill=deck.accent, font=font("sans_bold", 26))

    # zero-product card
    d.rounded_rectangle([110, 580, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 610), "Zero-product property",
           fill=MAROON, font=font("serif_bold", 36))
    d.text((180, 680), "If   A  *  B   =   0,   then   A  =  0   OR   B  =  0.",
           fill=INK, font=font("mono", 36))
    d.text((180, 760),
           "Bridge from factoring to solving:   factor,  then set each factor to 0.",
           fill=deck.accent, font=font("sans_bold", 28))

    d.text((110, 920),
           "Zero on the right is non-negotiable  -  the property fails otherwise.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("04_concept", concept)


# 05 - factoring method
def factoring_method(img, d):
    d.text((110, 90), "Method 1:   factoring  +  zero-product.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 195),
           "Best when the trinomial factors over the integers.",
           fill=MUTED, font=font("sans", 28))

    # steps card (left)
    d.rounded_rectangle([110, 280, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 310), "Three-step recipe",
           fill=MAROON, font=font("serif_bold", 32))
    steps = [
        ("1.", "Move everything to one side  ->  = 0."),
        ("2.", "Factor the trinomial."),
        ("3.", "Set each factor to 0,  solve."),
    ]
    y = 410
    for n, body in steps:
        d.text((180, y), n, fill=deck.accent, font=font("serif_bold", 36))
        d.text((250, y + 4), body, fill=INK, font=font("sans", 30))
        y += 100

    d.text((180, 740),
           "Verify by substituting back into the original equation.",
           fill=deck.accent, font=font("sans_bold", 24))

    # worked example (right)
    d.rounded_rectangle([1000, 280, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((1040, 310), "Example",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((1040, 380), "x^2  +  5 x  +  6   =   0",
           fill=INK, font=font("mono", 32))
    d.text((1040, 440), "(x + 2) (x + 3)   =   0",
           fill=INK, font=font("mono", 32))
    d.line([(1040, 510), (W - 150, 510)], fill=deck.accent, width=3)
    d.text((1040, 540), "x + 2  =  0     ->     x  =  -2",
           fill=MAROON_DARK, font=font("mono", 28))
    d.text((1040, 610), "x + 3  =  0     ->     x  =  -3",
           fill=MAROON_DARK, font=font("mono", 28))

    d.text((1040, 720), "Solutions:",
           fill=MAROON, font=font("serif_bold", 30))
    d.text((1040, 780), "x  =  -2,   x  =  -3",
           fill=MAROON_DARK, font=font("mono", 36))
deck.custom("05_factoring", factoring_method)


# 06 - completing the square
def completing_square(img, d):
    d.text((110, 90), "Method 2:   completing the square.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 195),
           "Always works  -  force a perfect square trinomial,  then square-root.",
           fill=MUTED, font=font("sans", 28))

    d.rounded_rectangle([110, 280, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 310), "Example:   x^2  +  6 x  -  7   =   0",
           fill=MAROON, font=font("serif_bold", 32))

    steps = [
        ("x^2  +  6 x   =   7",                 "move constant across"),
        ("(6 / 2)^2  =  9",                     "half of b,  squared"),
        ("x^2  +  6 x  +  9   =   7  +  9",     "add 9 to BOTH sides"),
        ("(x + 3)^2   =   16",                  "left becomes a square"),
        ("x + 3   =   +/-  4",                  "square root of both sides"),
        ("x   =   1   OR   x   =   -7",         "two solutions"),
    ]
    y = 390
    for eq, note in steps:
        d.text((180, y), eq, fill=INK, font=font("mono", 28))
        d.text((780, y + 2), note, fill=deck.accent, font=font("sans", 22))
        y += 75

    d.text((110, 920),
           "This is the proof behind the quadratic formula.   Same idea,  general inputs.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("06_completing_square", completing_square)


# 07 - quadratic formula
def quadratic_formula(img, d):
    d.text((110, 90), "Method 3:   the quadratic formula.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 195),
           "Works for EVERY quadratic equation.   Memorize it cold.",
           fill=MUTED, font=font("sans", 28))

    # the formula plate
    d.rounded_rectangle([110, 280, W - 110, 580], radius=20,
                        outline=MAROON, width=6, fill=deck.card_bg)
    d.text((150, 320), "For   a x^2  +  b x  +  c   =   0:",
           fill=MAROON, font=font("serif_bold", 36))

    # numerator
    d.text((350, 410), "-b   +/-   sqrt( b^2  -  4 a c )",
           fill=MAROON_DARK, font=font("mono", 56))
    # fraction bar
    d.line([(280, 495), (W - 280, 495)], fill=MAROON_DARK, width=5)
    # denominator
    centered(d, "2 a", font("mono", 56), 510, MAROON_DARK)

    d.text((150, 410), "x   =", fill=INK, font=font("mono", 56))

    # how-to card
    d.rounded_rectangle([110, 620, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 650), "How to use it",
           fill=MAROON, font=font("serif_bold", 32))
    tips = [
        ("1.", "Move to standard form  a x^2 + b x + c = 0  first."),
        ("2.", "Read off a,  b,  c  -  signs and all."),
        ("3.", "Plug in,  compute the inside (the discriminant) first,  then simplify."),
    ]
    y = 720
    for n, body in tips:
        d.text((180, y), n, fill=deck.accent, font=font("serif_bold", 32))
        d.text((250, y + 4), body, fill=INK, font=font("sans", 26))
        y += 55

    d.text((110, 920),
           "Safety net when factoring stalls.   Always available  -  even when answers are irrational.",
           fill=deck.accent, font=font("sans_bold", 26))
deck.custom("07_quadratic_formula", quadratic_formula)


# 08 - pause 1
deck.pause("08_pause1", "PAUSE  &  TRY  #1",
           "Solve by factoring:",
           "x^2  -  7 x  +  10   =   0",
           hint="Two numbers that multiply to 10 and add to -7.   Then zero-product.")


# 09 - pause 1 answer reveal
def pause1_answer(img, d):
    d.text((110, 90), "Answer:   x  =  2,   x  =  5.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 200),
           "Factor pair with the right sum,  then zero-product.",
           fill=INK, font=font("sans", 30))

    d.rounded_rectangle([110, 290, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)

    d.text((150, 320), "Step 1   -   find the factor pair",
           fill=MAROON, font=font("serif_bold", 32))
    pairs = [
        ("(-1) (-10)", "-1  +  (-10)  =  -11"),
        ("(-2) (-5) ", "-2  +  (-5)   =   -7   <-  match"),
    ]
    y = 390
    for pair, sum_check in pairs:
        d.text((180, y), pair, fill=INK, font=font("mono", 30))
        d.text((550, y), sum_check, fill=MAROON_DARK, font=font("mono", 28))
        y += 60

    d.text((150, 550), "Step 2   -   factor and apply zero-product",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 610), "(x - 2) (x - 5)   =   0",
           fill=INK, font=font("mono", 32))
    d.text((180, 660), "x - 2  =  0   OR   x - 5  =  0",
           fill=INK, font=font("mono", 30))

    d.text((150, 750), "Step 3   -   verify",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 810), "2^2 - 7(2) + 10  =  0  v       5^2 - 7(5) + 10  =  0  v",
           fill=INK, font=font("mono", 24))

    d.text((110, 920),
           "Both check.   The zero-product step is where the answers come from.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("09_pause1_silence", pause1_answer)


# 10 - discriminant
def discriminant(img, d):
    d.text((110, 90), "The discriminant   D   =   b^2  -  4 a c.",
           fill=MAROON, font=font("serif_bold", 52))
    d.text((110, 195),
           "Inside the square root.   Sign alone tells you how many real solutions.",
           fill=MUTED, font=font("sans", 28))

    d.rounded_rectangle([110, 280, W - 110, 760], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)

    # header row
    d.text((180, 310), "Sign of D",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((680, 310), "Real solutions",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((1200, 310), "Graph crosses x-axis",
           fill=MAROON, font=font("serif_bold", 32))
    d.line([(180, 360), (W - 180, 360)], fill=deck.accent, width=3)

    rows = [
        ("D  >  0", "two distinct",  "in two places"),
        ("D  =  0", "one repeated",  "at one tangent point"),
        ("D  <  0", "zero real",     "never  (no real roots)"),
    ]
    y = 410
    for sign, solns, graph in rows:
        d.text((180, y),  sign,  fill=INK,         font=font("mono", 32))
        d.text((680, y),  solns, fill=MAROON_DARK, font=font("sans_bold", 30))
        d.text((1200, y), graph, fill=INK,         font=font("sans", 28))
        y += 110

    d.text((110, 800),
           "Compute D BEFORE you plug into the formula  -  you know what to expect.",
           fill=deck.accent, font=font("sans_bold", 30))
    d.text((110, 860),
           "If D is a perfect square,  factoring usually works.",
           fill=INK, font=font("sans_bold", 28))
deck.custom("10_discriminant", discriminant)


# 11 - compare: must be set to 0 first
deck.compare("11_compare", "The trap  -  zero-product needs ZERO on the right.",
    left={
        "label": "X DON'T DO",
        "color": RED,
        "lines": [
            "Solve  x^2 + 5 x  =  6.",
            "",
            "x (x + 5)  =  6",
            "x  =  6   OR   x + 5  =  6",
            "                ^  wrong",
            "",
            "Zero-product DOES NOT apply",
            "when the product equals 6.",
            "Two factors that multiply to 6",
            "do NOT have to BE 6.",
        ],
        "footnote": "Factoring before moving everything to one side breaks the whole method.",
    },
    right={
        "label": "+ DO",
        "color": MAROON,
        "lines": [
            "Solve  x^2 + 5 x  =  6.",
            "",
            "x^2 + 5 x  -  6  =  0",
            "(x + 6) (x - 1)  =  0",
            "                ^  now zero",
            "",
            "x + 6  =  0   OR   x - 1  =  0",
            "x  =  -6      OR   x  =  1",
            "",
            "Rearrange  ->  factor  ->  zero-product.",
        ],
        "footnote": "Standard form first.   Then factor.   Then apply zero-product.",
    },
)


# 12 - pause 2
deck.pause("12_pause2", "PAUSE  &  TRY  #2",
           "Solve using the quadratic formula:",
           "2 x^2  +  4 x  -  6   =   0",
           hint="a = 2,  b = 4,  c = -6.   Compute the discriminant first.")


# 13 - pause 2 answer reveal
def pause2_answer(img, d):
    d.text((110, 90), "Answer:   x  =  1,   x  =  -3.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 200),
           "Identify a, b, c.   Compute D.   Plug into the formula.",
           fill=INK, font=font("sans", 30))

    d.rounded_rectangle([110, 290, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)

    d.text((150, 320), "Step 1   -   identify  a,  b,  c",
           fill=MAROON, font=font("serif_bold", 30))
    d.text((180, 380), "a  =  2,    b  =  4,    c  =  -6",
           fill=INK, font=font("mono", 32))

    d.text((150, 460), "Step 2   -   discriminant",
           fill=MAROON, font=font("serif_bold", 30))
    d.text((180, 520), "D  =  4^2  -  4 (2) (-6)  =  16  +  48  =  64",
           fill=INK, font=font("mono", 28))
    d.text((180, 570), "D  >  0   ->   two real solutions.",
           fill=deck.accent, font=font("sans_bold", 26))

    d.text((150, 640), "Step 3   -   formula",
           fill=MAROON, font=font("serif_bold", 30))
    d.text((180, 700), "x  =  ( -4  +/-  sqrt(64) )  /  ( 2 * 2 )",
           fill=INK, font=font("mono", 28))
    d.text((180, 750), "x  =  ( -4  +/-  8 )  /  4",
           fill=INK, font=font("mono", 28))
    d.text((180, 800), "x  =  1     OR     x  =  -3",
           fill=MAROON_DARK, font=font("mono", 32))

    d.text((110, 920),
           "Compute the discriminant first.   Then -b  +/-  sqrt(D),  over 2 a.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("13_pause2_silence", pause2_answer)


# 14 - application
def application(img, d):
    d.text((110, 90), "How the assignment uses this.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 195),
           "Twelve quadratic equations.   Three solving methods.   One discriminant call per problem.",
           fill=MUTED, font=font("sans", 26))

    d.rounded_rectangle([110, 290, W - 110, 830], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Dashboard assignment",
           fill=MAROON, font=font("serif_bold", 44))

    steps = [
        ("Part A",  "Solve 4 equations by factoring  +  zero-product property."),
        ("Part B",  "Solve 4 equations by completing the square."),
        ("Part C",  "Solve 4 equations using the quadratic formula."),
        ("Verify",  "For each problem,  confirm the answer with one ALTERNATE method."),
        ("Label",   "Use the discriminant to tag each equation:  0,  1,  or 2 real solutions."),
        ("Submit",  "Document or image from your Learn Portal dashboard."),
    ]
    y = 410
    for label, body in steps:
        d.text((180, y), label, fill=deck.accent, font=font("serif_bold", 30))
        d.text((420, y), body, fill=INK, font=font("sans", 26))
        y += 66

    d.text((110, 880),
           "Compute the discriminant BEFORE choosing the method  -  it saves time.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("14_application", application)


# 15 - recap
deck.recap("15_recap", "Recap.", [
    "Standard form  -  a x^2 + b x + c = 0  before anything else.",
    "Zero-product property  -  one factor must be 0  ->  set each to 0,  solve.",
    "Three methods  -  factoring,  completing the square,  quadratic formula.",
    "Quadratic formula  -  x = ( -b  +/-  sqrt(b^2 - 4 a c) ) / (2 a).",
    "Discriminant b^2 - 4 a c  ->  2,  1,  or 0 real solutions.   Verify by substitution.",
], assignment=[
    "Solve 12 quadratic equations  -  4 by factoring,  4 by completing the square,  4 by formula.",
    "Verify every answer with one alternate method.",
    "Label each problem 0,  1,  or 2 real solutions using the discriminant.",
])


# 16 - path
deck.path("16_path", [
    ("v",  "Watch this lesson",              "(done!)"),
    ("1.", "Read OpenStax Ch 10.1-10.3",     "Solving Quadratic Equations  -  factoring,  completing the square,  formula"),
    ("2.", "Khan Academy practice",          "Quadratic Equations  -  drill until the formula is automatic"),
    ("3.", "Assignment in dashboard",        "12 equations  -  three methods,  alternate-method verify,  discriminant labels"),
    ("4.", "Advisor check-in",               "Book one if completing the square or the formula still feels shaky"),
], next_text="Next up:  Module 15 - Graphing Quadratic Functions  &  the Parabola.")


print("Module 14 V2 (Quadratic Equations) slides built via slide_kit.")
