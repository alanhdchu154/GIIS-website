"""Algebra I — Module 1 (V2): Variables & Algebraic Expressions.

Foundation V2 build. Precision visuals (vocabulary anatomy, translation
tables, worked traces) are drawn deterministically here — no generated
images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, GRID, CREAM,
)

deck = Deck(course="Algebra I", module_num=1,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# 01 — title
deck.title("01_title", "Algebra I",
           "Module 1 — Variables & Algebraic Expressions",
           "Foundation lesson  ·  ~6 minutes")


# 02 — hook: boba cups, $6 each, x cups → 6x
def hook(img, d):
    d.text((110, 90), "One rule.  Any number of cups.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 175), "$6 per cup of boba.  How much for x cups?",
           fill=MUTED, font=font("sans", 36))

    # Three example rows: 3 cups / 5 cups / x cups
    rows = [
        ("3 cups",  "6 × 3",  "$18"),
        ("5 cups",  "6 × 5",  "$30"),
        ("x cups",  "6 × x",  "$6x"),
    ]
    y = 290
    for label, middle, total in rows:
        accent_row = label.startswith("x")
        outline = deck.accent if accent_row else MAROON
        d.rounded_rectangle([110, y, W - 110, y + 140], radius=20,
                            outline=outline, width=5, fill=deck.card_bg)
        d.text((160, y + 42), label, fill=MAROON, font=font("serif_bold", 54))
        d.text((620, y + 42), middle, fill=INK,   font=font("mono", 60))
        d.text((1320, y + 42), total, fill=deck.accent if accent_row else MAROON,
               font=font("mono", 60))
        y += 170

    d.text((110, 940),
           "The letter x just stands for 'however many cups you bought'.",
           fill=deck.accent, font=font("sans_bold", 34))
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "What a variable really is — a letter holding a spot.",
    "Vocabulary:  term · coefficient · constant · expression.",
    "Evaluate:  plug in the number, then simplify.",
    "Write real-life situations as algebraic expressions.",
], footnote="Goal:  write algebra the way you write a shopping list.")


# 04 — variable definition
deck.definition("04_variable",
                "What is a variable?",
                "A letter that stands for a number.",
                sub="Sometimes unknown.  Sometimes changing.  Always a placeholder.")


# 05 — vocabulary anatomy of 3x + 7
def vocab(img, d):
    d.text((110, 90), "Anatomy of an expression.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 195), "Read every piece — every piece has a name.",
           fill=MUTED, font=font("sans", 36))

    # Big centered expression: 3x + 7
    f_big = font("mono", 220)
    expr = "3x  +  7"
    tw = d.textlength(expr, font=f_big)
    base_x = (W - tw) / 2
    base_y = 360
    d.text((base_x, base_y), expr, fill=INK, font=f_big)

    # Approximate char positions for arrows/labels.
    # We measure widths of leading slices to anchor labels under each part.
    f_small_label = font("sans_bold", 30)
    f_small_sub   = font("sans", 26)

    def slice_x(prefix: str) -> int:
        return int(base_x + d.textlength(prefix, font=f_big))

    # coefficient = "3"
    coef_x0 = slice_x("")
    coef_x1 = slice_x("3")
    coef_cx = (coef_x0 + coef_x1) // 2
    d.line([(coef_cx, base_y + 230), (coef_cx, base_y + 290)],
           fill=deck.accent, width=4)
    d.text((coef_cx - 130, base_y + 295), "coefficient",
           fill=deck.accent, font=f_small_label)
    d.text((coef_cx - 130, base_y + 335), "multiplies the variable",
           fill=MUTED, font=f_small_sub)

    # variable = "x"
    var_x0 = slice_x("3")
    var_x1 = slice_x("3x")
    var_cx = (var_x0 + var_x1) // 2
    d.line([(var_cx, base_y + 230), (var_cx, base_y + 290)],
           fill=deck.accent, width=4)
    d.text((var_cx - 60, base_y + 295), "variable",
           fill=deck.accent, font=f_small_label)
    d.text((var_cx - 80, base_y + 335), "the unknown / changing part",
           fill=MUTED, font=f_small_sub)

    # constant = "7"
    const_x0 = slice_x("3x  +  ")
    const_x1 = slice_x("3x  +  7")
    const_cx = (const_x0 + const_x1) // 2
    d.line([(const_cx, base_y + 230), (const_cx, base_y + 290)],
           fill=deck.accent, width=4)
    d.text((const_cx - 60, base_y + 295), "constant",
           fill=deck.accent, font=f_small_label)
    d.text((const_cx - 90, base_y + 335), "no variable attached",
           fill=MUTED, font=f_small_sub)

    # Bottom rule: two terms, no equals sign → expression
    d.text((110, 940),
           "Two terms:  3x  and  7.   No equals sign  →  it's an expression, not an equation.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("05_vocab", vocab)


# 06 — evaluate worked example: 3x + 5 at x = 2
deck.equation("06_evaluate", "Evaluate  3x + 5  when  x = 2.", [
    ("3x + 5",       INK,    "the expression"),
    ("3(2) + 5",     MUTED,  "substitute  x = 2"),
    ("6 + 5",        MUTED,  "multiply first"),
    ("11",           MAROON, "answer"),
])


# 07 — language traps: 'less than' and 'tripled'
deck.compare("07_trap", "The English-to-math traps.",
    left={
        "label": "✗ WRONG",
        "color": RED,
        "lines": [
            "'5 less than x'   →   5 − x",
            "'a number tripled' →  3 + x",
            "",
            "Word order copied",
            "straight into math.",
        ],
        "footnote": "Direct copy of word order — flips the meaning.",
    },
    right={
        "label": "✓ RIGHT",
        "color": MAROON,
        "lines": [
            "'5 less than x'   →   x − 5",
            "'a number tripled' →  3x",
            "",
            "Translate the meaning,",
            "not the word order.",
        ],
        "footnote": "Start with x, then subtract.  Triple = multiply by 3.",
    },
)


# 08-09 — pause #1: evaluate 2a + 6 at a = 5
deck.pause("08_pause1", "PAUSE  &  TRY",
           "Evaluate this expression when  a = 5:",
           "2a + 6",
           hint="Pause.  Solve.  Press play when you're ready.")

def pause1_answer(img, d):
    d.text((110, 90), "Answer:  2a + 6  =  16.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 190), "Replace a with 5, then simplify.",
           fill=INK, font=font("sans", 40))

    steps = [
        ("substitute", "2(5) + 6",   "swap a → 5"),
        ("multiply",   "10 + 6",      "do 2 × 5 first"),
        ("add",        "16",          "answer"),
    ]
    y = 320
    for label, middle, note in steps:
        d.rounded_rectangle([150, y, W - 150, y + 130], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((200, y + 40), label, fill=MAROON, font=font("serif_bold", 40))
        d.text((600, y + 38), middle, fill=INK,   font=font("mono", 50))
        d.text((1180, y + 46), note, fill=deck.accent, font=font("sans", 32))
        y += 160

    d.text((150, 830),
           "Substitute first, then simplify — same two-step rhythm every time.",
           fill=deck.accent, font=font("sans_bold", 34))
deck.custom("09_pause1_silence", pause1_answer)


# 10 — writing real-world expressions: translation table
def writing(img, d):
    d.text((110, 90), "Translate English  →  algebra.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 195), "Look for the operation hiding inside the words.",
           fill=MUTED, font=font("sans", 36))

    # Header row
    hdr_y = 290
    d.rounded_rectangle([110, hdr_y, W - 110, hdr_y + 70], radius=14,
                        outline=MAROON, width=4, fill=MAROON)
    d.text((160, hdr_y + 18), "English phrase", fill=CREAM,
           font=font("serif_bold", 36))
    d.text((1180, hdr_y + 18), "Algebra", fill=CREAM,
           font=font("serif_bold", 36))

    rows = [
        ("$6 per cup, x cups",           "6x"),
        ("3 more than a number n",       "n + 3"),
        ("twice your age, plus 4",       "2a + 4"),
        ("$10 less than three times p",  "3p − 10"),
    ]
    y = hdr_y + 90
    for phrase, math in rows:
        d.rounded_rectangle([110, y, W - 110, y + 110], radius=14,
                            outline=MAROON, width=3, fill=deck.card_bg)
        d.text((160, y + 32), phrase, fill=INK, font=font("sans", 36))
        d.text((1180, y + 24), math, fill=deck.accent, font=font("mono", 56))
        y += 130

    d.text((110, 980),
           "Hint:  'per' = multiply.  'more than' = add.  'less than' = subtract (flipped).",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("10_writing", writing)


# 11-12 — pause #2: write '$10 less than 3p' as expression
deck.pause("11_pause2", "PAUSE  &  TRY  #2",
           "Write this as an algebraic expression:",
           "$10 less than 3 × p",
           hint="Three times p first.  Then 'less than' subtracts.")

def pause2_answer(img, d):
    d.text((110, 90), "Answer:  3p − 10.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 190), "'Less than' flips the subtraction.",
           fill=INK, font=font("sans", 40))

    steps = [
        ("three times p",     "3 × p",   "= 3p"),
        ("$10 less than that", "3p − 10", "subtract 10 from 3p"),
        ("expression",        "3p − 10", "no equals sign needed"),
    ]
    y = 320
    for label, middle, note in steps:
        d.rounded_rectangle([150, y, W - 150, y + 130], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((200, y + 40), label, fill=MAROON, font=font("serif_bold", 38))
        d.text((720, y + 38), middle, fill=INK, font=font("mono", 50))
        d.text((1180, y + 46), note, fill=deck.accent, font=font("sans", 28))
        y += 160

    d.text((150, 830),
           "Read the English carefully — 'less than' subtracts from the THING that came before.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("12_pause2_silence", pause2_answer)


# 13 — recap
deck.recap("13_recap", "Recap.", [
    "Variable  =  a letter standing for a number.",
    "Expression  =  variables + numbers + operations.  No equals sign.",
    "Coefficient multiplies the variable.  Constant has no variable.",
    "Evaluate  =  substitute the value, then simplify — in that order.",
], assignment=[
    "10 real-life situations written as algebraic expressions.",
    "Evaluate each expression for at least two different variable values.",
])


# 14 — path
deck.path("14_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Ch 1.1",    "Use the Language of Algebra"),
    ("2.", "Khan Academy practice",   "20 problems · Writing Algebraic Expressions"),
    ("3.", "Assignment in dashboard", "10 real-life situations + evaluations"),
    ("4.", "Advisor check-in",        "Book one if either pause felt shaky"),
], next_text="Next up:  Module 2 — Order of Operations (PEMDAS).")


print("Module 1 V2 (Variables & Algebraic Expressions) slides built via slide_kit.")
