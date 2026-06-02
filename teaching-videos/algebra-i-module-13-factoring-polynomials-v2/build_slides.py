"""Algebra I - Module 13 (V2): Factoring Polynomials.

Foundation V2 build. Every precision visual - GCF traces, trinomial pair
tables, difference-of-squares splits, perfect-square trinomial diagrams,
and the sum-of-squares trap - is drawn deterministically. No generated
images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, GRID, CREAM,
)

deck = Deck(course="Algebra I", module_num=13,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# 01 - title
deck.title("01_title", "Algebra I",
           "Module 13 - Factoring Polynomials",
           "Foundation lesson  -  ~6 minutes")


# 02 - hook: factor x^2 + 8x + 15 back into (x + 3)(x + 5)
def hook(img, d):
    d.text((110, 90), "Where did this polynomial come from?",
           fill=MAROON, font=font("serif_bold", 56))

    # the polynomial big and centered-ish
    d.rounded_rectangle([110, 220, W - 110, 410], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((180, 270), "x^2  +  8 x  +  15",
           fill=INK, font=font("mono", 100))

    # arrow / question
    d.text((110, 460), "Last module:   expand a product into a sum.",
           fill=MUTED, font=font("sans", 30))
    d.text((110, 510), "This module:    reverse it.   Sum  ->  product.",
           fill=deck.accent, font=font("sans_bold", 32))

    # answer ribbon
    d.rounded_rectangle([110, 580, W - 110, 770], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 610), "x^2  +  8 x  +  15   =   (x + 3) (x + 5)",
           fill=MAROON_DARK, font=font("mono", 56))
    d.text((150, 700), "Factoring  =  multiplication run backward.",
           fill=deck.accent, font=font("sans_bold", 32))

    # callout
    d.text((110, 820),
           "By the end:   you will know which of four families a polynomial belongs to,",
           fill=INK, font=font("sans", 28))
    d.text((110, 865),
           "and which factoring strategy unlocks each one.",
           fill=INK, font=font("sans", 28))
deck.custom("02_hook", hook)


# 03 - overview
deck.overview("03_overview", "Game plan.", [
    "GCF first        -  pull the greatest common factor before anything else.",
    "Trinomial        -  find two numbers that multiply to c,  add to b.",
    "Special patterns -  difference of squares,  perfect square trinomial.",
], footnote="Always check by re-expanding.   If FOIL does not land,  the factoring is wrong.")


# 04 - concept: what does factored mean
def concept(img, d):
    d.text((110, 90), "Factored  =  written as a product.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 190),
           "A factored polynomial is a product of simpler polynomials.",
           fill=MUTED, font=font("sans", 30))

    d.rounded_rectangle([110, 280, W - 110, 700], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)

    d.text((150, 320), "Same polynomial,  two forms",
           fill=MAROON, font=font("serif_bold", 36))

    d.text((180, 410), "Expanded   ->   x^2  +  8 x  +  15",
           fill=INK, font=font("mono", 42))
    d.text((180, 490), "Factored   ->   (x + 3) (x + 5)",
           fill=MAROON_DARK, font=font("mono", 42))

    d.line([(180, 580), (W - 180, 580)], fill=deck.accent, width=3)
    d.text((180, 600),
           "Verify:   FOIL the factored form  ->  must land on the expanded form.",
           fill=deck.accent, font=font("sans_bold", 28))

    d.text((110, 750),
           "If the expansion does not match,  the factoring is wrong.",
           fill=INK, font=font("sans_bold", 30))
    d.text((110, 810),
           "Every factoring problem has a built-in check.",
           fill=MUTED, font=font("sans", 28))
    d.text((110, 870),
           "No guessing  -  multiply back and confirm.",
           fill=MUTED, font=font("sans", 28))
deck.custom("04_concept", concept)


# 05 - GCF always first
def gcf(img, d):
    d.text((110, 90), "Step 1 always:   pull the GCF.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 195),
           "Find the largest number AND highest power of each variable in every term.",
           fill=MUTED, font=font("sans", 28))

    # example card
    d.rounded_rectangle([110, 290, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)

    d.text((150, 320), "Example:   6 x^2  +  9 x",
           fill=MAROON, font=font("serif_bold", 40))

    # split: terms break down
    d.text((180, 410), "6 x^2   =   (3 x) (2 x)",
           fill=INK, font=font("mono", 36))
    d.text((180, 470), "9 x     =   (3 x) (3)",
           fill=INK, font=font("mono", 36))

    d.line([(180, 540), (W - 180, 540)], fill=deck.accent, width=3)

    d.text((180, 560), "Shared:   3 x   -   pull it out front.",
           fill=deck.accent, font=font("sans_bold", 30))

    d.text((180, 640), "6 x^2  +  9 x   =   3 x (2 x  +  3)",
           fill=MAROON_DARK, font=font("mono", 42))

    d.text((180, 730), "Check by distribution:",
           fill=MAROON, font=font("serif_bold", 28))
    d.text((180, 780), "3 x (2 x)  +  3 x (3)   =   6 x^2  +  9 x   v",
           fill=INK, font=font("mono", 30))

    d.text((110, 920),
           "Skip the GCF and you fight a harder polynomial than you need to.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("05_gcf", gcf)


# 06 - trinomial factoring x^2 + bx + c
def trinomial(img, d):
    d.text((110, 90), "Trinomial:   x^2  +  b x  +  c.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 195),
           "Find two numbers that MULTIPLY to c  AND  ADD to b.",
           fill=MUTED, font=font("sans", 30))

    # left card: the recipe
    d.rounded_rectangle([110, 290, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 315), "Example:  x^2 + 8 x + 15",
           fill=MAROON, font=font("serif_bold", 36))

    d.text((180, 395), "Need:    p * q  =  15",
           fill=INK, font=font("mono", 32))
    d.text((180, 445), "         p + q  =   8",
           fill=INK, font=font("mono", 32))

    d.text((180, 530), "Factor pairs of 15",
           fill=deck.accent, font=font("serif_bold", 30))

    pairs = [
        ("1  *  15", "1  +  15  =  16"),
        ("3  *   5", "3  +   5  =   8   <-  match"),
    ]
    y = 590
    for pair, sum_check in pairs:
        d.text((180, y), pair, fill=INK, font=font("mono", 30))
        d.text((480, y), sum_check, fill=MAROON_DARK, font=font("mono", 28))
        y += 60

    d.text((180, 760), "Answer:   (x + 3) (x + 5)",
           fill=MAROON_DARK, font=font("mono", 38))

    # right card: sign rules
    d.rounded_rectangle([1000, 290, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((1040, 315), "Sign rules for p and q",
           fill=MAROON, font=font("serif_bold", 36))

    sign_rules = [
        ("c > 0,  b > 0:", "both positive"),
        ("c > 0,  b < 0:", "both negative"),
        ("c < 0:        ", "opposite signs"),
    ]
    y = 410
    for rule, result in sign_rules:
        d.text((1040, y), rule,  fill=INK,         font=font("mono", 28))
        d.text((1340, y), result, fill=MAROON_DARK, font=font("sans_bold", 28))
        y += 90

    d.text((1040, 720),
           "Read the signs of b and c FIRST,",
           fill=deck.accent, font=font("sans_bold", 28))
    d.text((1040, 770),
           "then you only test the matching pairs.",
           fill=deck.accent, font=font("sans_bold", 28))

    d.text((110, 920),
           "Always check by FOIL:   (x + 3)(x + 5)  =  x^2 + 8 x + 15.   v",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("06_trinomial", trinomial)


# 07 - pause 1
deck.pause("07_pause1", "PAUSE  &  TRY  #1",
           "Factor this trinomial:",
           "x^2  +  7 x  +  12",
           hint="Find two numbers that multiply to 12 and add to 7.")


# 08 - pause 1 answer reveal
def pause1_answer(img, d):
    d.text((110, 90), "Answer:   (x + 3) (x + 4).",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 200),
           "Find the pair that multiplies to 12 and adds to 7.",
           fill=INK, font=font("sans", 30))

    d.rounded_rectangle([110, 290, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)

    d.text((150, 320), "Step 1   -   list factor pairs of 12",
           fill=MAROON, font=font("serif_bold", 32))
    pairs = [
        ("1  *  12", "1  +  12  =  13"),
        ("2  *   6", "2  +   6  =   8"),
        ("3  *   4", "3  +   4  =   7   <-  match"),
    ]
    y = 390
    for pair, sum_check in pairs:
        d.text((180, y), pair, fill=INK, font=font("mono", 32))
        d.text((520, y), sum_check, fill=MAROON_DARK, font=font("mono", 30))
        y += 60

    d.text((150, 600), "Step 2   -   write factored form",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 660), "x^2  +  7 x  +  12   =   (x + 3) (x + 4)",
           fill=MAROON_DARK, font=font("mono", 36))

    d.text((150, 750), "Step 3   -   verify by FOIL",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 810), "x^2  +  4 x  +  3 x  +  12   =   x^2  +  7 x  +  12   v",
           fill=INK, font=font("mono", 30))

    d.text((110, 930),
           "List factor pairs.   Read the sums.   The matching pair is your answer.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("08_pause1_silence", pause1_answer)


# 09 - difference of squares
def difference_squares(img, d):
    d.text((110, 90), "Pattern 1:   difference of squares.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 195),
           "Two terms.   Both perfect squares.   Minus sign in between.",
           fill=MUTED, font=font("sans", 28))

    # rule card
    d.rounded_rectangle([110, 290, W - 110, 540], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Rule",
           fill=MAROON, font=font("serif_bold", 36))
    d.text((180, 390), "a^2  -  b^2   =   (a + b) (a - b)",
           fill=MAROON_DARK, font=font("mono", 56))
    d.text((180, 480),
           "Two terms,  minus sign,  both perfect squares.",
           fill=deck.accent, font=font("sans_bold", 28))

    # example card
    d.rounded_rectangle([110, 580, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 610), "Example",
           fill=MAROON, font=font("serif_bold", 36))

    d.text((180, 680), "x^2  -  25   =   x^2  -  5^2",
           fill=INK, font=font("mono", 38))
    d.text((180, 750), "          =   (x + 5) (x - 5)",
           fill=MAROON_DARK, font=font("mono", 38))

    d.text((110, 920),
           "Check:   (x + 5)(x - 5)  =  x^2 - 5 x + 5 x - 25  =  x^2 - 25.   v",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("09_difference_squares", difference_squares)


# 10 - perfect square trinomial
def perfect_square(img, d):
    d.text((110, 90), "Pattern 2:   perfect square trinomial.",
           fill=MAROON, font=font("serif_bold", 52))
    d.text((110, 195),
           "First and last terms are perfect squares.   Middle is 2 a b.",
           fill=MUTED, font=font("sans", 28))

    # rule card
    d.rounded_rectangle([110, 290, W - 110, 540], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Rule",
           fill=MAROON, font=font("serif_bold", 36))
    d.text((180, 390), "a^2  +  2 a b  +  b^2   =   (a + b)^2",
           fill=MAROON_DARK, font=font("mono", 44))
    d.text((180, 480),
           "First and last are squares.   Middle  =  2 * sqrt(first) * sqrt(last).",
           fill=deck.accent, font=font("sans_bold", 26))

    # example card
    d.rounded_rectangle([110, 580, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 610), "Example:   x^2  +  6 x  +  9",
           fill=MAROON, font=font("serif_bold", 36))

    d.text((180, 680), "x^2  =  (x)^2.    9  =  (3)^2.    2 * x * 3  =  6 x  v",
           fill=INK, font=font("mono", 30))
    d.text((180, 750), "x^2  +  6 x  +  9   =   (x + 3)^2",
           fill=MAROON_DARK, font=font("mono", 38))

    d.text((110, 920),
           "Check the middle term first  -  it confirms the pattern.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("10_perfect_square", perfect_square)


# 11 - compare: sum of squares does NOT factor over the reals
deck.compare("11_compare", "The trap  -  sum of squares does NOT factor.",
    left={
        "label": "X DON'T DO",
        "color": RED,
        "lines": [
            "x^2  +  25   =   (x + 5)(x - 5)",
            "      ^      ^",
            "      |      |   wrong",
            "",
            "Sum,  not difference.",
            "Difference-of-squares needs",
            "a MINUS between the squares.",
            "",
            "Test by FOIL:",
            "(x + 5)(x - 5) = x^2 - 25.",
        ],
        "footnote": "Reading 'two squares' is not enough  -  the sign matters.",
    },
    right={
        "label": "+ DO",
        "color": MAROON,
        "lines": [
            "x^2  -  25   =   (x + 5)(x - 5)",
            "      ^",
            "      |   minus  ->  pattern fits",
            "",
            "x^2  +  25   does NOT factor",
            "over the real numbers.",
            "",
            "Always check the sign between",
            "the two perfect-square terms",
            "BEFORE applying the pattern.",
        ],
        "footnote": "Difference  ->  pattern works.   Sum  ->  leave it alone.",
    },
)


# 12 - pause 2
deck.pause("12_pause2", "PAUSE  &  TRY  #2",
           "Factor completely:",
           "4 x^2  -  36",
           hint="Pull the GCF FIRST.   Then check for a difference-of-squares pattern.")


# 13 - pause 2 answer reveal
def pause2_answer(img, d):
    d.text((110, 90), "Answer:   4 (x + 3) (x - 3).",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 200),
           "GCF first.   Then the difference-of-squares pattern.",
           fill=INK, font=font("sans", 30))

    d.rounded_rectangle([110, 290, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)

    d.text((150, 320), "Step 1   -   pull the GCF",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 380), "GCF of 4 x^2 and 36  is  4.",
           fill=INK, font=font("mono", 32))
    d.text((180, 430), "4 x^2  -  36   =   4 (x^2  -  9)",
           fill=INK, font=font("mono", 34))

    d.text((150, 520), "Step 2   -   recognize the pattern",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 580), "x^2  -  9   =   x^2  -  3^2",
           fill=INK, font=font("mono", 32))
    d.text((180, 630), "Difference of squares  ->  (x + 3)(x - 3).",
           fill=INK, font=font("mono", 30))

    d.text((150, 720), "Step 3   -   combine",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 780), "4 x^2  -  36   =   4 (x + 3) (x - 3)",
           fill=MAROON_DARK, font=font("mono", 38))

    d.text((110, 930),
           "Skip the GCF and you miss factor 4 entirely.   Always pull it first.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("13_pause2_silence", pause2_answer)


# 14 - application
def application(img, d):
    d.text((110, 90), "How the assignment uses this.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 195),
           "Fifteen polynomials.   Label the strategy for each.   Re-expand to verify.",
           fill=MUTED, font=font("sans", 28))

    d.rounded_rectangle([110, 290, W - 110, 830], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Dashboard assignment",
           fill=MAROON, font=font("serif_bold", 44))

    steps = [
        ("Part A",  "Factor 15 polynomials using all four learned methods."),
        ("Label",   "Tag each problem with its strategy  -  GCF, trinomial, DoS, PST."),
        ("Verify",  "Re-expand each factored answer to confirm it matches the original."),
        ("Reflect", "Two sentences on how you decide WHICH method to try first."),
        ("Submit",  "Document, image, or link from your Learn Portal dashboard."),
    ]
    y = 410
    for label, body in steps:
        d.text((180, y), label, fill=deck.accent, font=font("serif_bold", 32))
        d.text((420, y), body, fill=INK, font=font("sans", 28))
        y += 78

    d.text((110, 880),
           "Decision goes:   GCF first,  then count terms,  then check patterns.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("14_application", application)


# 15 - recap
deck.recap("15_recap", "Recap.", [
    "GCF first  -  every problem,  every time.",
    "Trinomial x^2 + b x + c  -  two numbers,  multiply to c,  add to b.",
    "Difference of squares  -  a^2 - b^2  =  (a + b)(a - b).   Minus required.",
    "Perfect square trinomial  -  middle term  =  2 a b  ->  collapses to (a + b)^2.",
    "Verify every factoring by multiplying back.   The check is built in.",
], assignment=[
    "Factor 15 polynomials using all four learned methods.",
    "Label the strategy chosen for each problem.",
    "Re-expand every answer.  Add two sentences on your method-choice reasoning.",
])


# 16 - path
deck.path("16_path", [
    ("v",  "Watch this lesson",          "(done!)"),
    ("1.", "Read OpenStax Ch 7.1-7.4",   "Greatest Common Factor and Factoring Strategies"),
    ("2.", "Khan Academy practice",      "Factoring Polynomials  -  GCF,  trinomials,  patterns"),
    ("3.", "Assignment in dashboard",    "15 polynomials  -  label,  factor,  verify,  reflect"),
    ("4.", "Advisor check-in",           "Book one if pattern recognition still feels slow"),
], next_text="Next up:  Module 14 - Quadratic Equations & the Zero Product Property.")


print("Module 13 V2 (Factoring Polynomials) slides built via slide_kit.")
