"""Algebra I - Module 12 (V2): Exponents & Polynomials.

Foundation V2 build. Every precision visual - exponent-law tables,
classification tables, area-model rectangles, FOIL traces, and the
square-of-a-sum trap - is drawn deterministically. No generated images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, GRID, CREAM,
)

deck = Deck(course="Algebra I", module_num=12,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# 01 - title
deck.title("01_title", "Algebra I",
           "Module 12 - Exponents & Polynomials",
           "Foundation lesson  -  ~6 minutes")


# 02 - hook: garden area model for (x + 3)(x + 5)
def hook(img, d):
    d.text((110, 90), "A garden:   (x + 3)  by  (x + 5)  feet.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 180),
           "How much area do you need to cover with mulch?",
           fill=INK, font=font("sans", 32))

    # area-model rectangle on the right
    ox, oy = 1080, 320
    wx = 700          # total pixel width of rectangle
    hy = 500          # total pixel height
    # split: width = x | 3  (proportions roughly x=480, 3=220)
    wx_x, wx_3 = 480, 220
    hy_x, hy_5 = 300, 200   # height = x | 5

    # outer rectangle
    d.rectangle([ox, oy, ox + wx, oy + hy],
                outline=MAROON, width=5, fill=deck.card_bg)
    # vertical split line
    d.line([(ox + wx_x, oy), (ox + wx_x, oy + hy)],
           fill=MAROON, width=4)
    # horizontal split line
    d.line([(ox, oy + hy_x), (ox + wx, oy + hy_x)],
           fill=MAROON, width=4)

    # cell labels
    fmono = font("mono", 38)
    d.text((ox + wx_x // 2 - 50, oy + hy_x // 2 - 24),
           "x^2", fill=MAROON_DARK, font=fmono)
    d.text((ox + wx_x + wx_3 // 2 - 30, oy + hy_x // 2 - 24),
           "3x", fill=MAROON_DARK, font=fmono)
    d.text((ox + wx_x // 2 - 30, oy + hy_x + hy_5 // 2 - 24),
           "5x", fill=MAROON_DARK, font=fmono)
    d.text((ox + wx_x + wx_3 // 2 - 24, oy + hy_x + hy_5 // 2 - 24),
           "15", fill=MAROON_DARK, font=fmono)

    # dimension labels
    fdim = font("serif_bold", 34)
    d.text((ox + wx_x // 2 - 14, oy - 60), "x",
           fill=deck.accent, font=fdim)
    d.text((ox + wx_x + wx_3 // 2 - 14, oy - 60), "3",
           fill=deck.accent, font=fdim)
    d.text((ox - 50, oy + hy_x // 2 - 22), "x",
           fill=deck.accent, font=fdim)
    d.text((ox - 50, oy + hy_x + hy_5 // 2 - 22), "5",
           fill=deck.accent, font=fdim)

    # answer ribbon
    d.text((110, 320),
           "Area  =  (x + 3) (x + 5)",
           fill=INK, font=font("mono", 40))
    d.text((110, 410),
           "      =  x^2  +  3 x  +  5 x  +  15",
           fill=INK, font=font("mono", 36))
    d.text((110, 470),
           "      =  x^2  +  8 x  +  15",
           fill=MAROON_DARK, font=font("mono", 40))

    d.text((110, 580),
           "That single expression is a polynomial.",
           fill=deck.accent, font=font("sans_bold", 32))
    d.text((110, 630),
           "Two factors,  multiplied,  written as one term-sum.",
           fill=MUTED, font=font("sans", 28))

    # callout
    d.rounded_rectangle([110, 750, 980, 920], radius=18,
                        outline=MAROON, width=4, fill=deck.card_bg)
    d.text((140, 770), "By the end of this lesson:",
           fill=MAROON, font=font("serif_bold", 30))
    d.text((140, 820), "you can EXPAND  (x + 3) (x + 5)  to  x^2 + 8 x + 15,",
           fill=INK, font=font("sans", 26))
    d.text((140, 860), "and you can read what its degree and term-count mean.",
           fill=INK, font=font("sans", 26))
deck.custom("02_hook", hook)


# 03 - overview
deck.overview("03_overview", "Game plan.", [
    "Exponent laws       -  five rules that collapse any power chain.",
    "Classify polynomial -  read its degree and count its terms.",
    "Add / sub / multiply -  combine like terms,  distribute every term.",
], footnote="One topic.  Three moves you will reuse forever.")


# 04 - concept: anatomy of a polynomial
def concept(img, d):
    d.text((110, 90), "A polynomial  =  a sum of terms.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 190),
           "Each term:   (coefficient) (variable raised to a whole-number power).",
           fill=MUTED, font=font("sans", 30))

    d.rounded_rectangle([110, 280, W - 110, 620], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)

    # big polynomial display
    poly = "3 x^2  +  2 x  -  5"
    d.text((180, 320), poly, fill=INK, font=font("mono", 76))

    # annotation arrows / labels
    d.line([(225, 410), (225, 470)], fill=deck.accent, width=4)
    d.text((140, 480), "coefficient", fill=deck.accent, font=font("sans_bold", 26))

    d.line([(345, 410), (345, 470)], fill=deck.accent, width=4)
    d.text((290, 480), "variable",    fill=deck.accent, font=font("sans_bold", 26))

    d.line([(420, 410), (420, 470)], fill=deck.accent, width=4)
    d.text((375, 480), "exponent",    fill=deck.accent, font=font("sans_bold", 26))

    d.line([(620, 410), (620, 470)], fill=deck.accent, width=4)
    d.text((560, 480), "term",        fill=deck.accent, font=font("sans_bold", 26))

    d.line([(900, 410), (900, 470)], fill=deck.accent, width=4)
    d.text((820, 480), "constant",    fill=deck.accent, font=font("sans_bold", 26))

    d.text((180, 555),
           "3 terms  ->  trinomial.    Largest exponent  =  2  ->  degree 2.",
           fill=MAROON_DARK, font=font("sans_bold", 28))

    # rules row
    d.text((110, 680),
           "Rules:   whole-number exponents only,   no variables in denominators or under roots.",
           fill=INK, font=font("sans", 28))
    d.text((110, 730),
           "1 / x,    sqrt(x),    x^(-2)    are NOT polynomial terms.",
           fill=MUTED, font=font("mono", 28))

    d.text((110, 850),
           "Degree decides shape and end-behavior;   term-count gives the name.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("04_concept", concept)


# 05 - five exponent laws
def exponent_laws(img, d):
    d.text((110, 90), "Five exponent laws.",
           fill=MAROON, font=font("serif_bold", 70))
    d.text((110, 190),
           "Same base?   The exponent does the arithmetic for you.",
           fill=MUTED, font=font("sans", 30))

    # table card
    d.rounded_rectangle([110, 280, W - 110, 940], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)

    rows = [
        ("Product",         "x^a  *  x^b  =  x^(a+b)",            "x^2 * x^3  =  x^5"),
        ("Quotient",        "x^a  /  x^b  =  x^(a-b)",            "x^7 / x^4  =  x^3"),
        ("Power of power",  "(x^a)^b  =  x^(a*b)",                "(x^2)^4  =  x^8"),
        ("Power of product","(x y)^a  =  x^a * y^a",              "(2 x)^3  =  8 x^3"),
        ("Zero exponent",   "x^0  =  1     (x != 0)",             "5^0  =  1"),
    ]
    # column headers
    f_h = font("serif_bold", 30)
    d.text((150, 305), "Law",       fill=MAROON, font=f_h)
    d.text((520, 305), "Rule",      fill=MAROON, font=f_h)
    d.text((1280, 305), "Example",  fill=MAROON, font=f_h)
    d.line([(140, 360), (W - 140, 360)], fill=MAROON, width=3)

    y = 400
    f_n = font("sans_bold", 30)
    f_m = font("mono", 32)
    for name, rule, example in rows:
        d.text((150, y), name,    fill=INK,        font=f_n)
        d.text((520, y), rule,    fill=INK,        font=f_m)
        d.text((1280, y), example, fill=MAROON_DARK, font=f_m)
        y += 100

    d.text((110, 870),
           "Add to multiply,   subtract to divide,   multiply to raise a power.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("05_exponent_laws", exponent_laws)


# 06 - classify polynomials
def classify(img, d):
    d.text((110, 90), "Name a polynomial:  count and read.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 190),
           "Count the terms.   Then read the largest exponent.",
           fill=MUTED, font=font("sans", 30))

    # term-count card (left)
    d.rounded_rectangle([110, 280, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 305), "By number of terms",
           fill=MAROON, font=font("serif_bold", 34))
    d.line([(140, 360), (910, 360)], fill=MAROON, width=3)

    name_rows = [
        ("monomial",  "1 term",  "7 x^3"),
        ("binomial",  "2 terms", "4 x  -  9"),
        ("trinomial", "3 terms", "x^2  +  2 x  +  1"),
    ]
    y = 400
    for name, count, ex in name_rows:
        d.text((180, y),      name,  fill=INK,        font=font("sans_bold", 30))
        d.text((480, y),      count, fill=deck.accent, font=font("sans", 28))
        d.text((180, y + 50), ex,    fill=MAROON_DARK, font=font("mono", 32))
        y += 150

    # degree card (right)
    d.rounded_rectangle([1000, 280, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((1040, 305), "By largest exponent  (degree)",
           fill=MAROON, font=font("serif_bold", 34))
    d.line([(1030, 360), (W - 130, 360)], fill=MAROON, width=3)

    deg_rows = [
        ("degree 1   (linear)",     "3 x  +  2"),
        ("degree 2   (quadratic)",  "x^2  -  4 x  +  4"),
        ("degree 3   (cubic)",      "2 x^3  +  x  -  1"),
    ]
    y = 400
    for label, ex in deg_rows:
        d.text((1070, y),      label, fill=INK,         font=font("sans_bold", 30))
        d.text((1070, y + 50), ex,    fill=MAROON_DARK, font=font("mono", 32))
        y += 150

    d.text((110, 920),
           "Example:   3 x^2  +  2 x   has 2 terms (binomial)  and degree 2.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("06_classify", classify)


# 07 - pause 1
deck.pause("07_pause1", "PAUSE  &  TRY  #1",
           "Simplify using the exponent laws:",
           "(2 x^2 y)(3 x^3 y^2)",
           hint="Multiply coefficients.   Add exponents on like bases  (x with x,  y with y).")


# 08 - pause 1 answer reveal
def pause1_answer(img, d):
    d.text((110, 90), "Answer:   6 x^5 y^3.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 200),
           "Multiply the coefficients.   Add the exponents on each base.",
           fill=INK, font=font("sans", 30))

    # steps card
    d.rounded_rectangle([110, 290, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)

    d.text((150, 320), "Step 1   -   group like factors",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 380),
           "(2 * 3)  *  (x^2 * x^3)  *  (y * y^2)",
           fill=INK, font=font("mono", 38))

    d.text((150, 470), "Step 2   -   apply the product law on each base",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 530), "x^2 * x^3   ->   x^(2 + 3)   =   x^5",
           fill=INK, font=font("mono", 34))
    d.text((180, 580), "y   * y^2   ->   y^(1 + 2)   =   y^3",
           fill=INK, font=font("mono", 34))

    d.text((150, 660), "Step 3   -   multiply the coefficients",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((180, 720), "2 * 3   =   6",
           fill=INK, font=font("mono", 34))

    d.text((150, 790), "Result:   6 x^5 y^3.",
           fill=MAROON_DARK, font=font("sans_bold", 40))

    d.text((110, 930),
           "Coefficients multiply.   Exponents on like bases add.   The bases themselves do not change.",
           fill=deck.accent, font=font("sans_bold", 26))
deck.custom("08_pause1_silence", pause1_answer)


# 09 - add and subtract polynomials (combine like terms)
def add_subtract(img, d):
    d.text((110, 90), "Add or subtract:   combine like terms.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 195),
           "Same variable AND same exponent  ->  add or subtract the coefficients.",
           fill=MUTED, font=font("sans", 28))

    # left: addition example
    d.rounded_rectangle([110, 290, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 315), "Addition",
           fill=MAROON, font=font("serif_bold", 36))
    d.text((180, 380),
           "(3 x^2 + 2 x - 5)  +  (x^2 + 4 x + 7)",
           fill=INK, font=font("mono", 28))

    d.text((150, 470), "Group like terms",
           fill=deck.accent, font=font("serif_bold", 28))
    d.text((180, 525), "(3 x^2 + x^2) + (2 x + 4 x) + (-5 + 7)",
           fill=INK, font=font("mono", 26))

    d.text((150, 620), "Combine",
           fill=deck.accent, font=font("serif_bold", 28))
    d.text((180, 680), "4 x^2  +  6 x  +  2",
           fill=MAROON_DARK, font=font("mono", 42))

    d.text((150, 790),
           "x^2 and x stay separate  -  different exponents.",
           fill=MUTED, font=font("sans", 26))

    # right: subtraction example - distribute the minus
    d.rounded_rectangle([1000, 290, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((1040, 315), "Subtraction",
           fill=MAROON, font=font("serif_bold", 36))
    d.text((1070, 380),
           "(5 x^2 + 3 x - 1)  -  (2 x^2 + x - 4)",
           fill=INK, font=font("mono", 28))

    d.text((1040, 470), "Distribute the minus",
           fill=deck.accent, font=font("serif_bold", 28))
    d.text((1070, 525),
           "5 x^2 + 3 x - 1  -  2 x^2  -  x  +  4",
           fill=INK, font=font("mono", 26))

    d.text((1040, 620), "Combine",
           fill=deck.accent, font=font("serif_bold", 28))
    d.text((1070, 680), "3 x^2  +  2 x  +  3",
           fill=MAROON_DARK, font=font("mono", 42))

    d.text((1040, 790),
           "Flip every sign in the second polynomial.",
           fill=MUTED, font=font("sans", 26))

    d.text((110, 930),
           "Exponents NEVER change when you add or subtract.   Only coefficients move.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("09_add_subtract", add_subtract)


# 10 - multiply polynomials (FOIL + area model)
def multiply(img, d):
    d.text((110, 90), "Multiply:   distribute every term.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 195),
           "Two binomials  ->  four products.   FOIL  =  First, Outer, Inner, Last.",
           fill=MUTED, font=font("sans", 28))

    # left: FOIL trace
    d.rounded_rectangle([110, 290, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 315), "(x + 3) (x + 5)",
           fill=MAROON, font=font("serif_bold", 40))

    foil = [
        ("F",  "x * x      =  x^2"),
        ("O",  "x * 5      =  5 x"),
        ("I",  "3 * x      =  3 x"),
        ("L",  "3 * 5      =  15"),
    ]
    y = 400
    for letter, body in foil:
        d.text((180, y), letter, fill=deck.accent, font=font("serif_bold", 36))
        d.text((260, y + 4), body, fill=INK, font=font("mono", 32))
        y += 70

    d.line([(180, 700), (820, 700)], fill=MAROON, width=4)
    d.text((180, 720), "x^2  +  5 x  +  3 x  +  15",
           fill=INK, font=font("mono", 32))
    d.text((180, 790), "x^2  +  8 x  +  15",
           fill=MAROON_DARK, font=font("mono", 40))

    # right: area model rectangle
    d.rounded_rectangle([1000, 290, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((1040, 315), "Area model",
           fill=MAROON, font=font("serif_bold", 36))

    # mini rectangle inside the card
    ox, oy = 1100, 410
    wx_x, wx_3 = 380, 200
    hy_x, hy_5 = 250, 170
    d.rectangle([ox, oy, ox + wx_x + wx_3, oy + hy_x + hy_5],
                outline=MAROON_DARK, width=4, fill=CREAM)
    d.line([(ox + wx_x, oy), (ox + wx_x, oy + hy_x + hy_5)],
           fill=MAROON_DARK, width=4)
    d.line([(ox, oy + hy_x), (ox + wx_x + wx_3, oy + hy_x)],
           fill=MAROON_DARK, width=4)

    fmono = font("mono", 30)
    d.text((ox + wx_x // 2 - 38, oy + hy_x // 2 - 18),
           "x^2", fill=MAROON_DARK, font=fmono)
    d.text((ox + wx_x + wx_3 // 2 - 22, oy + hy_x // 2 - 18),
           "5x", fill=MAROON_DARK, font=fmono)
    d.text((ox + wx_x // 2 - 22, oy + hy_x + hy_5 // 2 - 18),
           "3x", fill=MAROON_DARK, font=fmono)
    d.text((ox + wx_x + wx_3 // 2 - 22, oy + hy_x + hy_5 // 2 - 18),
           "15", fill=MAROON_DARK, font=fmono)

    fdim = font("serif_bold", 28)
    d.text((ox + wx_x // 2 - 8, oy - 44), "x",  fill=deck.accent, font=fdim)
    d.text((ox + wx_x + wx_3 // 2 - 8, oy - 44), "5",
           fill=deck.accent, font=fdim)
    d.text((ox - 38, oy + hy_x // 2 - 16), "x",  fill=deck.accent, font=fdim)
    d.text((ox - 38, oy + hy_x + hy_5 // 2 - 16), "3",
           fill=deck.accent, font=fdim)

    d.text((1040, 770),
           "Four pieces  =  four products.",
           fill=INK, font=font("sans", 28))
    d.text((1040, 815),
           "Add them  ->   x^2 + 8 x + 15.",
           fill=MAROON_DARK, font=font("sans_bold", 28))

    d.text((110, 930),
           "Same answer two ways:   FOIL trace  =  area-model sum.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("10_multiply", multiply)


# 11 - compare: (x + 3)^2 is NOT x^2 + 9
deck.compare("11_compare", "The trap  -  square of a sum is NOT sum of squares.",
    left={
        "label": "X DON'T DO",
        "color": RED,
        "lines": [
            "(x + 3)^2  =  x^2 + 9     <- wrong",
            "",
            "Only the x and the 3 were",
            "squared.   The cross-product",
            "was dropped silently.",
            "",
            "Missing the  6 x  middle term",
            "produces a different polynomial",
            "with a different graph.",
        ],
        "footnote": "Squaring is not a 'distribute to each piece' shortcut.",
    },
    right={
        "label": "+ DO",
        "color": MAROON,
        "lines": [
            "(x + 3)^2  =  (x + 3) (x + 3)",
            "",
            "F: x * x  =  x^2",
            "O: x * 3  =  3 x",
            "I: 3 * x  =  3 x",
            "L: 3 * 3  =  9",
            "",
            "x^2  +  6 x  +  9       v",
        ],
        "footnote": "Always rewrite ( )^2 as the product first,  then FOIL.",
    },
)


# 12 - pause 2
deck.pause("12_pause2", "PAUSE  &  TRY  #2",
           "Multiply using FOIL or distribution:",
           "(2 x + 1)(x + 4)",
           hint="F, O, I, L  ->  combine the middle two like terms at the end.")


# 13 - pause 2 answer reveal
def pause2_answer(img, d):
    d.text((110, 90), "Answer:   2 x^2  +  9 x  +  4.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 200),
           "F, O, I, L  -  then combine the like terms.",
           fill=INK, font=font("sans", 30))

    d.rounded_rectangle([110, 290, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "(2 x + 1) (x + 4)",
           fill=MAROON, font=font("serif_bold", 38))

    foil = [
        ("F",  "2 x  *  x   =   2 x^2"),
        ("O",  "2 x  *  4   =   8 x"),
        ("I",  "1   *  x    =   x"),
        ("L",  "1   *  4    =   4"),
    ]
    y = 400
    for letter, body in foil:
        d.text((180, y), letter, fill=deck.accent, font=font("serif_bold", 36))
        d.text((260, y + 4), body, fill=INK, font=font("mono", 32))
        y += 70

    d.line([(180, 700), (W - 180, 700)], fill=MAROON, width=4)
    d.text((180, 720), "2 x^2  +  8 x  +  x  +  4",
           fill=INK, font=font("mono", 34))
    d.text((180, 780), "combine like terms:    8 x  +  x  =  9 x",
           fill=deck.accent, font=font("sans_bold", 28))
    d.text((180, 825), "2 x^2  +  9 x  +  4",
           fill=MAROON_DARK, font=font("mono", 42))

    d.text((110, 930),
           "Check the term-count:   3 terms (trinomial),   degree 2 (quadratic).",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("13_pause2_silence", pause2_answer)


# 14 - application
def application(img, d):
    d.text((110, 90), "How the assignment uses this.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 195),
           "Twenty problems:   five classify,   five add,   five subtract,   five multiply.",
           fill=MUTED, font=font("sans", 30))

    d.rounded_rectangle([110, 290, W - 110, 830], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Dashboard assignment",
           fill=MAROON, font=font("serif_bold", 44))

    steps = [
        ("Part A",  "5 polynomials  -  classify by degree and number of terms."),
        ("Part B",  "5 additions of polynomials  -  combine like terms cleanly."),
        ("Part C",  "5 subtractions  -  distribute the minus,  then combine."),
        ("Part D",  "5 multiplications  -  FOIL,  area model,  or distribution."),
        ("Submit",  "Document, image, or link showing every step,  not just the answer."),
    ]
    y = 410
    for label, body in steps:
        d.text((180, y), label, fill=deck.accent, font=font("serif_bold", 32))
        d.text((420, y), body, fill=INK, font=font("sans", 28))
        y += 78

    d.text((110, 880),
           "Pick a method.   Then show the work that proves the answer.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("14_application", application)


# 15 - recap
deck.recap("15_recap", "Recap.", [
    "Five exponent laws  -  product, quotient, power-of-power, power-of-product, zero.",
    "Polynomial  =  sum of terms,  each term  (coefficient) (variable)^(whole number).",
    "Name it by term-count;  read its degree from the largest exponent.",
    "Add / subtract  -  combine like terms.   Exponents never change.",
    "Multiply  -  distribute every term.   For binomials,  FOIL.   Combine like terms.",
], assignment=[
    "Classify 5 polynomials  -  degree and number of terms.",
    "Perform 5 additions,  5 subtractions,  and 5 multiplications of polynomials.",
    "Submit your work as a document, image, or link from the dashboard.",
])


# 16 - path
deck.path("16_path", [
    ("✓",  "Watch this lesson",          "(done!)"),
    ("1.", "Read OpenStax Ch 6.1-6.3",   "Add, Subtract, and Multiply Polynomials"),
    ("2.", "Khan Academy practice",      "Exponent Rules and Polynomial Operations"),
    ("3.", "Assignment in dashboard",    "20 problems  -  classify, add, subtract, multiply"),
    ("4.", "Advisor check-in",           "Book one if FOIL or the (x + a)^2 trap still feels shaky"),
], next_text="Next up:  Module 13 - Factoring Polynomials.")


print("Module 12 V2 (Exponents & Polynomials) slides built via slide_kit.")
