"""Algebra I - Module 7 (V2): Introduction to Functions.

Foundation V2 build. Input-output machine diagrams, mapping diagrams,
function vs non-function, and domain/range tables are drawn deterministically.
No generated images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, CREAM, GRID,
)

deck = Deck(course="Algebra I", module_num=7,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# ─── helper: input → machine → output diagram ───
def io_machine(d, x0, y0, *, in_label, rule_label, out_label, accent=None):
    """Draw an input arrow → machine box → output arrow at (x0, y0).
    Total width ~1100, total height ~220.
    """
    accent = accent or deck.accent

    # input box
    d.rounded_rectangle([x0, y0, x0 + 240, y0 + 140], radius=16,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((x0 + 60, y0 + 18), "input",
           fill=MUTED, font=font("sans", 26))
    f_io = font("mono", 60)
    iw = d.textlength(in_label, font=f_io)
    d.text((x0 + (240 - iw) / 2, y0 + 56), in_label, fill=INK, font=f_io)

    # arrow 1
    ax = x0 + 240
    ay = y0 + 70
    d.line([(ax + 10, ay), (ax + 130, ay)], fill=accent, width=6)
    d.polygon([(ax + 150, ay), (ax + 130, ay - 16),
               (ax + 130, ay + 16)], fill=accent)

    # machine box
    mx = ax + 160
    d.rounded_rectangle([mx, y0, mx + 360, y0 + 140], radius=20,
                        outline=accent, width=6, fill=deck.bg)
    d.text((mx + 24, y0 + 18), "rule",
           fill=MUTED, font=font("sans", 26))
    f_rule = font("mono", 46)
    rw = d.textlength(rule_label, font=f_rule)
    d.text((mx + (360 - rw) / 2, y0 + 64), rule_label, fill=MAROON, font=f_rule)

    # arrow 2
    bx = mx + 360
    by = y0 + 70
    d.line([(bx + 10, by), (bx + 130, by)], fill=accent, width=6)
    d.polygon([(bx + 150, by), (bx + 130, by - 16),
               (bx + 130, by + 16)], fill=accent)

    # output box
    ox = bx + 160
    d.rounded_rectangle([ox, y0, ox + 240, y0 + 140], radius=16,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((ox + 56, y0 + 18), "output",
           fill=MUTED, font=font("sans", 26))
    ow = d.textlength(out_label, font=f_io)
    d.text((ox + (240 - ow) / 2, y0 + 56), out_label, fill=INK, font=f_io)


# ─── helper: mapping diagram (two ovals + arrows) ───
def mapping(d, x0, y0, *, title, pairs, accent=None, all_unique=True):
    """Draw a two-oval mapping diagram with arrows from inputs to outputs.

    pairs: list of (input_str, output_str). Order in left oval and right oval
    is determined by first appearance. If the same input appears twice with
    different outputs, the input shows two arrows -> the relation is not a
    function. all_unique=False highlights the offending input in RED.
    """
    accent = accent or deck.accent

    # title
    d.text((x0 + 0, y0), title, fill=MAROON, font=font("serif_bold", 34))

    box_y = y0 + 60
    left_w, left_h = 220, 360
    right_w, right_h = 220, 360
    gap = 280

    # left oval (X)
    d.rounded_rectangle([x0, box_y, x0 + left_w, box_y + left_h], radius=110,
                        outline=accent, width=5, fill=deck.card_bg)
    d.text((x0 + 90, box_y + 12), "X", fill=accent, font=font("serif_bold", 32))

    # right oval (Y)
    rx = x0 + left_w + gap
    d.rounded_rectangle([rx, box_y, rx + right_w, box_y + right_h], radius=110,
                        outline=accent, width=5, fill=deck.card_bg)
    d.text((rx + 95, box_y + 12), "Y", fill=accent, font=font("serif_bold", 32))

    # collect unique inputs in order, count their distinct outputs
    inputs_order: list[str] = []
    outputs_order: list[str] = []
    arrows: list[tuple[str, str]] = []
    out_per_input: dict[str, set[str]] = {}
    for a, b in pairs:
        if a not in inputs_order:
            inputs_order.append(a)
        if b not in outputs_order:
            outputs_order.append(b)
        arrows.append((a, b))
        out_per_input.setdefault(a, set()).add(b)

    # place inputs vertically inside left oval
    f_io = font("mono", 44)
    in_positions: dict[str, tuple[int, int]] = {}
    n_in = len(inputs_order)
    for i, v in enumerate(inputs_order):
        cy = box_y + 80 + i * ((left_h - 120) // max(1, (n_in - 1) if n_in > 1 else 1)) \
             if n_in > 1 else box_y + left_h // 2
        cx = x0 + left_w // 2
        # color RED if this input is the offender (more than one output)
        is_offender = len(out_per_input[v]) > 1
        col = RED if is_offender else INK
        tw = d.textlength(v, font=f_io)
        d.text((cx - tw / 2, cy - 26), v, fill=col, font=f_io)
        in_positions[v] = (cx + tw / 2 + 14, cy)

    # place outputs vertically inside right oval
    out_positions: dict[str, tuple[int, int]] = {}
    n_out = len(outputs_order)
    for i, v in enumerate(outputs_order):
        cy = box_y + 80 + i * ((right_h - 120) // max(1, (n_out - 1) if n_out > 1 else 1)) \
             if n_out > 1 else box_y + right_h // 2
        cx = rx + right_w // 2
        tw = d.textlength(v, font=f_io)
        d.text((cx - tw / 2, cy - 26), v, fill=INK, font=f_io)
        out_positions[v] = (cx - tw / 2 - 14, cy)

    # arrows
    for a, b in arrows:
        sx, sy = in_positions[a]
        ex, ey = out_positions[b]
        is_offender = len(out_per_input[a]) > 1
        col = RED if is_offender else accent
        d.line([(sx, sy), (ex - 18, ey)], fill=col, width=4)
        # arrowhead
        d.polygon([(ex, ey), (ex - 18, ey - 10),
                   (ex - 18, ey + 10)], fill=col)


# 01 - title
deck.title("01_title", "Algebra I",
           "Module 7 - Introduction to Functions",
           "Foundation lesson  -  ~6 minutes")


# 02 - hook: vending-machine machine diagram
def hook(img, d):
    d.text((110, 90), "Press the button.  Get the same snack.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 200),
           "A vending machine is a function:  one button, one snack.",
           fill=MUTED, font=font("sans", 34))

    # working machine row
    d.text((110, 300), "Function  -  one input, one output every time:",
           fill=INK, font=font("sans_bold", 30))
    io_machine(d, 130, 360, in_label="B4",
               rule_label="vending rule",
               out_label="granola")
    io_machine(d, 130, 540, in_label="B4",
               rule_label="vending rule",
               out_label="granola")

    # broken machine row
    d.text((110, 720), "Broken  -  same button, different snack  =  NOT a function:",
           fill=RED, font=font("sans_bold", 30))
    io_machine(d, 130, 780, in_label="B4",
               rule_label="vending rule",
               out_label="soda?",
               accent=RED)

    d.text((110, 950),
           "One input gives one output.  Anything else is not a function.",
           fill=deck.accent, font=font("sans_bold", 32))
deck.custom("02_hook", hook)


# 03 - overview
deck.overview("03_overview", "Game plan.", [
    "One input  ->  exactly one output  (the rule).",
    "Function notation  -  f(x)  is f at x, not f times x.",
    "Evaluate, then list the domain and range.",
], footnote="Goal:  read the notation, run the rule, name the sets.")


# 04 - concept: definition + domain/range diagram
def concept(img, d):
    d.text((110, 90), "A function is a rule.",
           fill=MAROON, font=font("serif_bold", 70))
    d.text((110, 200),
           "Each input  x  is sent to exactly one output  f(x).",
           fill=MUTED, font=font("sans", 34))

    # left card: definition
    d.rounded_rectangle([110, 290, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Four words to know",
           fill=MAROON, font=font("serif_bold", 38))
    rows = [
        ("input",   "the x you put in"),
        ("output",  "the f(x) that comes out"),
        ("domain",  "the set of allowed inputs"),
        ("range",   "the set of outputs produced"),
    ]
    y = 410
    for name, meaning in rows:
        d.text((180, y), name, fill=deck.accent, font=font("serif_bold", 38))
        d.text((430, y + 8), meaning, fill=INK, font=font("sans", 30))
        y += 100

    # right card: a tidy mapping diagram (function)
    d.rounded_rectangle([1000, 290, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    mapping(d, 1050, 320,
            title="One x  ->  one f(x):",
            pairs=[("1", "2"), ("2", "4"), ("3", "6")])

    d.text((110, 950),
           "One arrow out of every x.  That is what makes the rule a function.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("04_concept", concept)


# 05 - compare: f(x) is NOT f times x
deck.compare("05_compare", "f(x) is one symbol  -  NOT multiplication.",
    left={
        "label": "X DON'T DO",
        "color": RED,
        "lines": [
            "f(x) = 2x + 3",
            "",
            "f(2)  =  f times 2",
            "       =  (2x + 3) * 2",
            "",
            "Wrong.  The parentheses",
            "are not multiplication.",
        ],
        "footnote": "f(2) is one number, not a product.",
    },
    right={
        "label": "+ DO",
        "color": MAROON,
        "lines": [
            "f(x) = 2x + 3",
            "",
            "f(2)  =  apply the rule",
            "       =  2(2) + 3",
            "       =  4 + 3  =  7",
            "",
            "Substitute, then simplify.",
        ],
        "footnote": "f(x) means:  put x into the rule.",
    },
)


# 06 - worked basic: f(x) = 2x + 3 at three inputs
def worked_basic(img, d):
    d.text((110, 90), "Worked  -  f(x) = 2x + 3   at three inputs",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 190),
           "Substitute the input for x  -  then simplify.",
           fill=MUTED, font=font("sans", 32))

    # 3 column traces
    cols = [
        ("f(0)",  ["= 2(0) + 3", "= 0 + 3",  "= 3"],   "3"),
        ("f(1)",  ["= 2(1) + 3", "= 2 + 3",  "= 5"],   "5"),
        ("f(-2)", ["= 2(-2) + 3", "= -4 + 3", "= -1"], "-1"),
    ]
    f_h = font("mono", 56)
    f_l = font("mono", 38)
    col_w = (W - 220) // 3
    for idx, (head, lines, ans) in enumerate(cols):
        x = 110 + idx * col_w
        d.rounded_rectangle([x, 280, x + col_w - 30, 820], radius=20,
                            outline=MAROON, width=5, fill=deck.card_bg)
        # head
        hw = d.textlength(head, font=f_h)
        d.text((x + (col_w - 30 - hw) / 2, 310), head,
               fill=MAROON, font=f_h)
        y = 410
        for line in lines:
            lw = d.textlength(line, font=f_l)
            d.text((x + (col_w - 30 - lw) / 2, y), line,
                   fill=INK, font=f_l)
            y += 80
        # answer pill
        d.rounded_rectangle([x + 80, 720, x + col_w - 110, 790], radius=18,
                            outline=deck.accent, width=4, fill=deck.accent_light)
        f_a = font("serif_bold", 44)
        aw = d.textlength(f"output  =  {ans}", font=f_a)
        d.text((x + (col_w - 30 - aw) / 2, 732),
               f"output  =  {ans}", fill=MAROON_DARK, font=f_a)

    d.text((110, 870),
           "Three inputs.  Three outputs.  One rule.   That is a function.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("06_worked_basic", worked_basic)


# 07 - worked advanced: g(x) = x^2 - 4  (repeated outputs are allowed)
def worked_advanced(img, d):
    d.text((110, 90), "Worked  -  g(x) = x^2 - 4   (repeats are allowed)",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 190),
           "Two different inputs can share one output.  Still a function.",
           fill=MUTED, font=font("sans", 32))

    steps = [
        ("g(3)",          "= 3^2 - 4   =  9 - 4   =  5"),
        ("g(-3)",         "= (-3)^2 - 4   =  9 - 4   =  5"),
    ]
    f_lbl = font("mono", 58)
    f_eq = font("mono", 50)
    y = 290
    for label, line in steps:
        d.rounded_rectangle([130, y, W - 130, y + 140], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((180, y + 40), label, fill=MAROON, font=f_lbl)
        d.text((480, y + 44), line, fill=INK, font=f_eq)
        y += 170

    # rule banner
    d.rounded_rectangle([130, 660, W - 130, 830], radius=18,
                        outline=deck.accent, width=5, fill=deck.accent_light)
    d.text((180, 685), "The rule",
           fill=MAROON_DARK, font=font("serif_bold", 36))
    d.text((180, 740),
           "Different inputs can share one output  -  fine.",
           fill=INK, font=font("sans", 30))
    d.text((180, 780),
           "What is forbidden:  one input pointing at two different outputs.",
           fill=RED, font=font("sans_bold", 28))

    d.text((110, 880),
           "Repeats in the output column are OK.  Repeats in the input column with",
           fill=deck.accent, font=font("sans_bold", 28))
    d.text((110, 920),
           "different outputs are not  -  that would break the function rule.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("07_worked_advanced", worked_advanced)


# 08 - pause 1
deck.pause("08_pause1", "PAUSE  &  TRY  #1",
           "Evaluate at three inputs.  Show each substitution:",
           "h(x) = 3x - 5",
           hint="Find h(0), h(2), and h(-1).  Substitute, then simplify.")


# 09 - pause 1 answer reveal
def pause1_answer(img, d):
    d.text((110, 90), "Answer:  h(x) = 3x - 5  at  0, 2, -1.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 195),
           "Substitute every time  -  then simplify.",
           fill=INK, font=font("sans", 32))

    steps = [
        ("h(0)",   "= 3(0) - 5   =  0 - 5   =  -5"),
        ("h(2)",   "= 3(2) - 5   =  6 - 5   =   1"),
        ("h(-1)",  "= 3(-1) - 5  =  -3 - 5  =  -8"),
    ]
    f_lbl = font("mono", 50)
    f_eq = font("mono", 46)
    y = 300
    for label, line in steps:
        d.rounded_rectangle([130, y, W - 130, y + 130], radius=18,
                            outline=MAROON, width=4, fill=deck.card_bg)
        d.text((180, y + 38), label, fill=MAROON, font=f_lbl)
        d.text((430, y + 42), line, fill=INK, font=f_eq)
        y += 150

    d.text((110, 800),
           "Domain tested:   { -1,  0,  2 }",
           fill=deck.accent, font=font("mono", 36))
    d.text((110, 860),
           "Range produced:  { -8, -5,  1 }",
           fill=deck.accent, font=font("mono", 36))
    d.text((110, 940),
           "One input  ->  one output, every time.  This is a function.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("09_pause1_silence", pause1_answer)


# 10 - domain and range translation table
def domain_range_card(img, d):
    d.text((110, 90), "Domain and range:  collect the inputs and outputs.",
           fill=MAROON, font=font("serif_bold", 50))
    d.text((110, 195),
           "Domain = inputs tested.   Range = outputs produced.",
           fill=MUTED, font=font("sans", 32))

    # header row
    d.rounded_rectangle([110, 280, W - 110, 360], radius=14,
                        outline=MAROON, width=4, fill=deck.accent_light)
    d.text((150, 300), "Rule",        fill=MAROON_DARK, font=font("serif_bold", 32))
    d.text((520, 300), "x  (input)",  fill=MAROON_DARK, font=font("serif_bold", 32))
    d.text((860, 300), "f(x)  (output)", fill=MAROON_DARK, font=font("serif_bold", 32))
    d.text((1280, 300),"Domain",      fill=MAROON_DARK, font=font("serif_bold", 32))
    d.text((1580, 300),"Range",       fill=MAROON_DARK, font=font("serif_bold", 32))

    rows = [
        ("f(x) = 2x + 3", "0",  "3",  "{ -2, 0, 1 }",  "{ -1, 3, 5 }"),
        ("f(x) = 2x + 3", "1",  "5",  "(same)",        "(same)"),
        ("f(x) = 2x + 3", "-2", "-1", "(same)",        "(same)"),
        ("h(x) = 3x - 5", "0",  "-5", "{ -1, 0, 2 }",  "{ -8, -5, 1 }"),
        ("h(x) = 3x - 5", "2",  "1",  "(same)",        "(same)"),
        ("h(x) = 3x - 5", "-1", "-8", "(same)",        "(same)"),
    ]
    y = 380
    for rule, xv, yv, dom, rng in rows:
        d.rounded_rectangle([110, y, W - 110, y + 78], radius=14,
                            outline=MAROON, width=3, fill=deck.card_bg)
        d.text((150, y + 22), rule, fill=INK,   font=font("mono", 28))
        d.text((520, y + 22), xv,   fill=INK,   font=font("mono", 30))
        d.text((860, y + 22), yv,   fill=INK,   font=font("mono", 30))
        d.text((1280, y + 24), dom, fill=MUTED, font=font("mono", 24))
        d.text((1580, y + 24), rng, fill=MUTED, font=font("mono", 24))
        y += 90

    d.text((110, 940),
           "Domain is the x column collected as a set.  Range is the f(x) column.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("10_domain_range", domain_range_card)


# 11 - pause 2: function vs not a function
def pause2_prompt(img, d):
    # banner
    d.rectangle([0, 80, W, 220], fill=deck.accent)
    centered(d, "PAUSE  &  TRY  #2", font("serif_bold", 96), 100, MAROON_DARK)

    d.text((110, 280),
           "Which of these relations is a function?",
           fill=INK, font=font("sans", 40))
    d.text((110, 340),
           "Look at the inputs.  Does any x repeat with a different y?",
           fill=MUTED, font=font("sans", 30))

    # two cards
    d.rounded_rectangle([110, 420, 920, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 450), "Relation A",
           fill=MAROON, font=font("serif_bold", 44))
    pairs_a = ["(1, 2)", "(2, 4)", "(3, 6)"]
    y = 540
    for p in pairs_a:
        d.text((180, y), p, fill=INK, font=font("mono", 50))
        y += 80

    d.rounded_rectangle([1000, 420, W - 110, 870], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((1040, 450), "Relation B",
           fill=MAROON, font=font("serif_bold", 44))
    pairs_b = ["(1, 2)", "(1, 5)", "(2, 7)"]
    y = 540
    for p in pairs_b:
        d.text((1070, y), p, fill=INK, font=font("mono", 50))
        y += 80

    d.text((110, 920),
           "Pause now.  Decide which is a function.  Press play when ready.",
           fill=deck.accent, font=font("sans_bold", 34))
deck.custom("11_pause2", pause2_prompt)


# 12 - pause 2 answer reveal
def pause2_answer(img, d):
    d.text((110, 90), "Answer:  A is a function.  B is not.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 175),
           "Scan the x column.  A repeat with a different y breaks the rule.",
           fill=INK, font=font("sans", 30))

    # left: Relation A mapping (function)
    d.text((150, 250), "Relation A  -  function:",
           fill=MAROON, font=font("serif_bold", 32))
    mapping(d, 150, 290,
            title="",
            pairs=[("1", "2"), ("2", "4"), ("3", "6")])

    # right: Relation B mapping (NOT a function -- input 1 has two outputs)
    d.text((1100, 250), "Relation B  -  not a function:",
           fill=RED, font=font("serif_bold", 32))
    mapping(d, 1100, 290,
            title="",
            pairs=[("1", "2"), ("1", "5"), ("2", "7")])

    d.text((110, 800),
           "In B, the input 1 points at both 2 AND 5.",
           fill=RED, font=font("sans_bold", 32))
    d.text((110, 850),
           "Same input, two different outputs  =  not a function.",
           fill=RED, font=font("sans_bold", 32))
    d.text((110, 940),
           "Fast check  -  scan the x column.  Any repeat with a new y breaks it.",
           fill=deck.accent, font=font("sans_bold", 28))
deck.custom("12_pause2_silence", pause2_answer)


# 13 - application: the assignment
def application(img, d):
    d.text((110, 90), "How the assignment uses this.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 195),
           "Classify, evaluate, and list the sets  -  every step shown.",
           fill=MUTED, font=font("sans", 34))

    d.rounded_rectangle([110, 290, W - 110, 830], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 320), "Dashboard assignment",
           fill=MAROON, font=font("serif_bold", 44))

    steps = [
        ("Part A",  "5 relations  -  function or not?  One sentence each."),
        ("Part B",  "3 functions  -  evaluate at 10 inputs total (show subs)."),
        ("Part C",  "List the domain and range for each function you tested."),
        ("Rubric",  "Substitution shown.   Sets written in { } form."),
    ]
    y = 420
    for label, body in steps:
        d.text((180, y), label, fill=deck.accent, font=font("serif_bold", 36))
        d.text((440, y), body, fill=INK, font=font("sans", 28))
        y += 90

    d.text((110, 880),
           "Show every substitution.  Collect x-values into the domain, f(x) into the range.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("13_application", application)


# 14 - recap
deck.recap("14_recap", "Recap.", [
    "Function  -  one input gives exactly one output.",
    "f(x) is one symbol  -  apply the rule, do NOT multiply.",
    "Domain  =  inputs tested.   Range  =  outputs produced.",
    "Same input pointing at two outputs  =  not a function.",
], assignment=[
    "Classify 5 relations as function or not  -  with reason.",
    "Evaluate 3 functions at 10 inputs total  -  show substitution.",
    "List the domain and range for each function you tested.",
])


# 15 - path
deck.path("15_path", [
    ("✓",  "Watch this lesson",      "(done!)"),
    ("1.", "Read OpenStax Ch 3.5",   "Relations & Functions"),
    ("2.", "Khan Academy practice",  "Evaluating Functions"),
    ("3.", "Assignment in dashboard","5 classify  +  10 evaluations  +  domain/range"),
    ("4.", "Advisor check-in",       "Book one if f(x) notation still feels off."),
], next_text="Next up:  Module 8.")


print("Module 7 V2 (Introduction to Functions) slides built via slide_kit.")
