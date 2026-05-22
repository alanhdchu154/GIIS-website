"""AP Biology · Module 16 — AP Exam Synthesis & Review (course capstone).

Teal (science) theme auto-resolved from "AP Biology". 15 slides total.
Custom diagrams: hook 50/50 balance scale (02), the exam-format two-section
TABLE (04), the FRQ 3-step technique workflow (07), the rapid-fire trap recap
card (12), and the final-30-days 3-week timeline (13). The correlation-vs-causation
(08) and exponential-vs-logistic (09) slides use deck.compare. Pause slide (10) is
duplicated to 11 so the same image plays during both the question and the silent
answer-reveal sections.

Keep ALL exam-format numbers exactly: 60 MCQ / 90 min / 50%; 6 FRQ / 90 min / 50%;
2 long 8-10 pts; 4 short 4 pts; 1-5 scale; 3+ for credit.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, wrap, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, CREAM,
)

LOGO = "../../src/img/logo_nobg.png"
deck = Deck(course="AP Biology", module_num=16, output_dir="slides", logo_path=LOGO)

ACCENT = deck.accent           # teal
ACCENT_LT = deck.accent_light  # light teal
CARD = deck.card_bg

GREEN = (52, 140, 84)
HARM = RED
GRID_LINE = (190, 178, 158)


# 01 — title
deck.title("01_title", "AP Biology",
           "Module 16 — AP Exam Synthesis & Review",
           "The final module  ·  ~8 minutes  ·  all exam strategy")


# 02 — hook: a 50/50 balance scale (recall vs data reasoning)
def hook(img, d):
    d.text((110, 60), "Half your score is NOT memorization.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 138),
           "The exam rewards reading an experiment, analyzing a graph, and arguing from evidence.",
           fill=MUTED, font=font("sans", 28))

    # fulcrum + beam (perfectly level — 50/50)
    cx = W // 2
    beam_y = 290
    d.polygon([(cx, beam_y + 18), (cx - 46, beam_y + 150), (cx + 46, beam_y + 150)],
              fill=MAROON, outline=MAROON_DARK)
    d.rounded_rectangle([cx - 560, beam_y, cx + 560, beam_y + 26], radius=12,
                        fill=MAROON_DARK)

    panel_w = 760
    panel_h = 360
    py = beam_y + 90
    # LEFT pan — Section I
    lx = cx - 560 - panel_w // 2 + 40
    # tie line
    d.line([(cx - 520, beam_y + 12), (lx + panel_w // 2, py)], fill=MAROON_DARK, width=4)
    d.rounded_rectangle([lx, py, lx + panel_w, py + panel_h], radius=20,
                        outline=ACCENT, width=6, fill=CARD)
    d.rectangle([lx, py, lx + panel_w, py + 78], fill=ACCENT)
    tf = font("serif_bold", 36)
    centered_in = lambda x0, w, txt, fnt, yy, col: d.text(
        (x0 + w // 2 - d.textlength(txt, font=fnt) / 2, yy), txt, fill=col, font=fnt)
    centered_in(lx, panel_w, "SECTION I", tf, py + 18, CREAM)
    for j, ln in enumerate([
        "60 multiple choice",
        "recall + reasoning",
    ]):
        centered_in(lx, panel_w, ln, font("sans_bold", 36), py + 120 + j * 56, INK)
    centered_in(lx, panel_w, "50% of your score", font("serif_bold", 52), py + 250, ACCENT)

    # RIGHT pan — Section II
    rx = cx + 560 - panel_w // 2 - 40
    d.line([(cx + 520, beam_y + 12), (rx + panel_w // 2, py)], fill=MAROON_DARK, width=4)
    d.rounded_rectangle([rx, py, rx + panel_w, py + panel_h], radius=20,
                        outline=MAROON, width=6, fill=ACCENT_LT)
    d.rectangle([rx, py, rx + panel_w, py + 78], fill=MAROON)
    centered_in(rx, panel_w, "SECTION II", tf, py + 18, CREAM)
    for j, ln in enumerate([
        "6 free response",
        "DATA REASONING",
    ]):
        centered_in(rx, panel_w, ln, font("sans_bold", 36), py + 120 + j * 56, INK)
    centered_in(rx, panel_w, "50% of your score", font("serif_bold", 52), py + 250, MAROON)

    # punchline strip
    d.rounded_rectangle([110, 940, W - 110, 1020], radius=16,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Most students under-prepare the half that's worth the most. This module fixes that.",
             font("serif_bold", 30), 958, MAROON_DARK)
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "How the exam is BUILT — two sections, the 1-5 scale, the six science practices.",
    "FRQ TECHNIQUE — read an experiment, state a hypothesis, write an evidence-based claim.",
    "The greatest-hits cross-unit TRAPS + a concrete final-30-days study plan.",
], footnote="No new content today — this is pure exam strategy across all eight units.")


# 04 — exam-format two-section TABLE
def exam_format(img, d):
    d.text((110, 56), "The exam  —  two sections, three hours, 50/50.",
           fill=MAROON, font=font("serif_bold", 56))

    tx0 = 110
    tx1 = W - 110
    ty0 = 180
    head_h = 80
    row_h = 300
    # columns: Section | Format | Time | Weight | Detail
    col_x = [tx0, tx0 + 300, tx0 + 720, tx0 + 920, tx0 + 1130, tx1]
    col_titles = ["Section", "Format", "Time", "Weight", "Detail"]

    # header band
    d.rectangle([tx0, ty0, tx1, ty0 + head_h], fill=MAROON)
    hf = font("sans_bold", 32)
    for c in range(5):
        d.text((col_x[c] + 24, ty0 + 24), col_titles[c], fill=CREAM, font=hf)

    rows = [
        ("SECTION I", "60 multiple-\nchoice questions", "90 min", "50%",
         ["Discrete questions plus", "data / graph question sets.",
          "Half your total score."]),
        ("SECTION II", "6 free-response\nquestions", "90 min", "50%",
         ["2 LONG FRQs  —  8-10 pts each", "   (interpret a whole experiment)",
          "4 SHORT FRQs  —  4 pts each", "   (analyze data, use a model, predict)"]),
    ]
    nf = font("serif_bold", 38)
    cf = font("sans_bold", 30)
    tf2 = font("sans_bold", 36)
    wf = font("serif_bold", 56)
    df = font("sans", 28)
    for i, (sec, fmt, tm, wt, detail) in enumerate(rows):
        ry = ty0 + head_h + row_h * i
        band = CARD if i % 2 == 0 else ACCENT_LT
        d.rectangle([tx0, ry, tx1, ry + row_h], fill=band)
        # section name
        d.text((col_x[0] + 24, ry + 110), sec, fill=MAROON_DARK, font=nf)
        # format (may be 2 lines)
        for j, ln in enumerate(fmt.split("\n")):
            d.text((col_x[1] + 24, ry + 96 + j * 48), ln, fill=INK, font=cf)
        # time
        d.text((col_x[2] + 24, ry + 120), tm, fill=INK, font=tf2)
        # weight (big)
        d.text((col_x[3] + 24, ry + 100), wt, fill=ACCENT, font=wf)
        # detail bullets
        for j, ln in enumerate(detail):
            d.text((col_x[4] + 24, ry + 60 + j * 50), ln, fill=MUTED, font=df)

    bottom = ty0 + head_h + row_h * len(rows)
    d.rectangle([tx0, ty0, tx1, bottom], outline=MAROON_DARK, width=4)
    for cx in col_x[1:-1]:
        d.line([(cx, ty0), (cx, bottom)], fill=GRID_LINE, width=2)
    d.line([(tx0, ty0 + head_h), (tx1, ty0 + head_h)], fill=GRID_LINE, width=2)
    d.line([(tx0, ty0 + head_h + row_h), (tx1, ty0 + head_h + row_h)],
           fill=GRID_LINE, width=2)

    d.text((110, bottom + 26),
           "Total: 3 hours, weighted a perfect 50 / 50 between recall-heavy MCQ and reasoning-heavy FRQ.",
           fill=MAROON, font=font("sans_bold", 28))
deck.custom("04_exam_format", exam_format)


# 05 — scoring (definition card with a 1-5 ladder)
def scoring(img, d):
    d.text((110, 80), "Scored 1 to 5.", fill=MAROON, font=font("serif_bold", 80))

    # 5-step ladder, 3+ highlighted
    steps = [
        ("5", "extremely well qualified", True),
        ("4", "well qualified", True),
        ("3", "qualified  —  earns credit at many colleges", True),
        ("2", "possibly qualified", False),
        ("1", "no recommendation", False),
    ]
    bx = 140
    bw = W - 280
    rh = 96
    y = 230
    for num, label, qual in steps:
        col = ACCENT if qual else CARD
        txt_col = CREAM if qual else MUTED
        d.rounded_rectangle([bx, y, bx + bw, y + rh - 14], radius=14,
                            fill=col, outline=MAROON_DARK if qual else GRID_LINE, width=3)
        d.text((bx + 30, y + 14), num, fill=txt_col, font=font("serif_bold", 56))
        d.text((bx + 130, y + 26), label, fill=txt_col, font=font("sans_bold", 36))
        if num == "3":
            d.text((bx + bw - 250, y + 26), "← the bar",
                   fill=CREAM, font=font("serif_bold", 34))
        y += rh

    # caveat strip
    d.rounded_rectangle([110, 760, W - 110, 900], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "A 3 or higher is a QUALIFYING score — credit at many institutions.",
             font("serif_bold", 34), 786, MAROON_DARK)
    centered(d, "Each college sets its own policy (some want a 4 or 5), so check your target schools.",
             font("sans", 30), 842, MAROON)
deck.custom("05_scoring", scoring)


# 06 — six science practices (each with a concrete, actionable gloss)
deck.overview("06_science_practices", "The six science practices.", [
    "Concept explanation — say WHY a process happens in your own words, not just its name.",
    "Visual representation — read a model/diagram and state what it shows or predicts.",
    "Question & method — name the independent & dependent variable and the control group.",
    "Data representation — turn data into a graph/table with labeled axes and units.",
    "Statistical tests — run a chi-square or error bars and say if the result is significant.",
    "Argument from evidence — make a claim, cite the data, justify it with the biology.",
], footnote="Every question is secretly one or more of these six — name it, then answer it.")


# 07 — FRQ technique: 3-step workflow mapped to the practices
def frq_technique(img, d):
    d.text((110, 56), "The FRQ move  —  a usable 3-step method.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 134),
           "Works on every free response. Each step maps to specific science practices.",
           fill=MUTED, font=font("sans", 28))

    steps = [
        ("STEP 1", "READ THE EXPERIMENT", ACCENT,
         ["Find the independent variable, the dependent",
          "variable, and the control group.",
          "Restate what was MANIPULATED and what was",
          "MEASURED before you write anything."],
         "practices 2, 3"),
        ("STEP 2", "STATE A TESTABLE HYPOTHESIS", MAROON,
         ["Write a directional 'If... then... because...'",
          "prediction — not a vague restatement.",
          "e.g. 'If light intensity increases, then",
          "photosynthesis rate increases, because more",
          "light drives the light reactions.'"],
         "practice 3"),
        ("STEP 3", "ARGUE FROM EVIDENCE (CER)", GREEN,
         ["CLAIM: answer using a command term.",
          "EVIDENCE: cite the SPECIFIC data trend.",
          "REASONING: connect it to the biology — and",
          "link molecular detail UP to the ecological /",
          "evolutionary picture. That earns synthesis."],
         "practices 4, 5, 6"),
    ]
    bx = 110
    bw = (W - 110 - 110 - 60) // 3
    by = 200
    bh = 660
    for i, (tag, head, col, lines, pr) in enumerate(steps):
        px = bx + i * (bw + 30)
        d.rounded_rectangle([px, by, px + bw, by + bh], radius=20,
                            outline=col, width=6, fill=CARD)
        d.rectangle([px, by, px + bw, by + 130], fill=col)
        d.text((px + 28, by + 18), tag, fill=CREAM, font=font("serif_bold", 40))
        # head (wraps to 1-2 lines inside the header band)
        for j, ln in enumerate(wrap(d, head, font("sans_bold", 26), bw - 56)):
            d.text((px + 28, by + 78 + j * 32), ln, fill=CREAM, font=font("sans_bold", 26))
        # body lines
        yy = by + 170
        for ln in lines:
            d.text((px + 28, yy), ln, fill=INK, font=font("sans", 26))
            yy += 46
        # practice tag at the bottom
        d.rounded_rectangle([px + 28, by + bh - 70, px + bw - 28, by + bh - 24],
                            radius=12, fill=ACCENT_LT, outline=col, width=2)
        d.text((px + 44, by + bh - 62), pr, fill=MAROON_DARK, font=font("sans_bold", 26))

    # worked-example strip
    d.rounded_rectangle([110, 890, W - 110, 1010], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Worked mini-example: light intensity (IV) vs photosynthesis rate (DV), with a DARK control.",
             font("serif_bold", 30), 916, MAROON_DARK)
    centered(d, "Read variables → write a directional hypothesis → make an evidence-based CER claim.",
             font("sans", 28), 962, MAROON)
deck.custom("07_frq_technique", frq_technique)


# 08 — correlation vs causation (compare)
deck.compare("08_correlation_causation_compare",
             "Correlation  vs  causation  —  the #1 data-FRQ trap.",
             {"label": "CORRELATION", "color": ACCENT,
              "lines": [
                  "Two variables MOVE TOGETHER.",
                  "Ice-cream sales rise, drownings rise.",
                  "",
                  "FRQ-safe wording:",
                  "'X is positively/negatively",
                  "ASSOCIATED with Y.'",
                  "",
                  "A lurking variable (summer heat)",
                  "can drive BOTH — so it's not proof.",
              ],
              "footnote": "Describe the relationship — don't claim a cause."},
             {"label": "CAUSATION", "color": MAROON,
              "lines": [
                  "One variable actually DRIVES",
                  "the other.",
                  "",
                  "Requires a MANIPULATED variable",
                  "PLUS a CONTROL group.",
                  "",
                  "Only then may you write",
                  "'X CAUSES Y.'",
              ],
              "footnote": "Needs a controlled, manipulated experiment."})


# 09 — exponential vs logistic (compare)
deck.compare("09_growth_compare",
             "Exponential  vs  logistic growth.",
             {"label": "EXPONENTIAL  (J-curve)", "color": ACCENT,
              "lines": [
                  "dN/dt = rN",
                  "Assumes UNLIMITED resources.",
                  "Accelerates forever.",
                  "",
                  "Bacteria in fresh medium;",
                  "an invasive species, no enemies.",
              ],
              "footnote": "No ceiling — just speeds up."},
             {"label": "LOGISTIC  (S-curve)", "color": MAROON,
              "lines": [
                  "dN/dt = rN[(K-N)/K]",
                  "Growth SLOWS near carrying",
                  "capacity K, then levels off.",
                  "",
                  "K is NOT a hard ceiling —",
                  "populations overshoot & oscillate.",
              ],
              "footnote": "Density-dependent factors bite hardest near K."})


# 10 — pause + try (correlation-safe conclusion)
# pause() does NOT wrap the prompt — keep it short; full scenario is in narration.
deck.pause("10_pause1", "PAUSE  &  TRY",
           "30 lakes: more dissolved phosphorus  →  more algae. Strong, positive.",
           "Causation?",
           hint="Pause now. Write your sentence. Press play when you're ready.")

# 11 — duplicate for the silent answer-reveal section
deck.duplicate("10_pause1", "11_pause1_silence")


# 12 — rapid-fire 'greatest hits' trap recap
def more_traps(img, d):
    d.text((110, 56), "Rapid-fire cross-unit traps.",
           fill=MAROON, font=font("serif_bold", 58))

    traps = [
        ("10% RULE",
         ["~10% of energy moves up a trophic level; ~90% lost as HEAT.",
          "Energy FLOWS one way; matter (C, N, P) CYCLES.",
          "10,000 → 1,000 → 100 kcal. Don't invert it or apply it to matter."]),
        ("HARDY-WEINBERG = a NULL model",
         ["p^2 + 2pq + q^2 = 1 predicts NO evolution only if all 5 hold:",
          "no mutation, no gene flow, no drift (very large pop.),",
          "random mating, no selection. Deviation flags which one broke."]),
        ("EVOLUTION basics",
         ["Fitness = reproductive success (NOT strength).",
          "Selection acts on PHENOTYPES — never 'for the good of the species.'",
          "Drift is random/non-adaptive. Homologous = common ancestor;",
          "analogous = convergent."]),
        ("DON'T DEFINE IN ISOLATION",
         ["A definition alone rarely earns the synthesis point.",
          "Connect molecular detail UP to the organism, population,",
          "and ecosystem. That linkage is what the long FRQs reward."]),
    ]
    bx = 110
    bw = (W - 110 - 110 - 40) // 2
    by = 170
    bh = 360
    for i, (head, lines) in enumerate(traps):
        col = i % 2
        rowi = i // 2
        px = bx + col * (bw + 40)
        py = by + rowi * (bh + 30)
        d.rounded_rectangle([px, py, px + bw, py + bh], radius=18,
                            outline=MAROON, width=5, fill=CARD)
        d.rectangle([px, py, px + bw, py + 76], fill=ACCENT)
        d.text((px + 28, py + 16), head, fill=CREAM, font=font("serif_bold", 36))
        yy = py + 104
        for ln in lines:
            d.text((px + 28, yy), ln, fill=INK, font=font("sans", 28))
            yy += 50
deck.custom("12_more_traps", more_traps)


# 13 — final 30-days study plan, a 3-week timeline
def study_plan(img, d):
    d.text((110, 56), "Your final 30 days  —  a concrete plan.",
           fill=MAROON, font=font("serif_bold", 56))

    weeks = [
        ("WEEK 1", "Days 30-21  ·  DIAGNOSE", ACCENT,
         ["Take ONE full timed practice exam —",
          "both sections, 3 hours, no shortcuts.",
          "Score it honestly.",
          "Rank your weakest of the 8 units.",
          "Re-watch ONLY the modules tied to",
          "your 3 weakest units."]),
        ("WEEK 2", "Days 20-8  ·  DRILL FRQ", MAROON,
         ["Every other day: 1-2 released FRQs",
          "under time. Write FULL CER answers.",
          "Target practices 3, 4, 5, 6 —",
          "design, data, statistics, argument.",
          "Mix in MCQ data sets to stay sharp."]),
        ("WEEK 3", "Days 7-1  ·  SIMULATE + REST", GREEN,
         ["One more full timed exam early",
          "in the week.",
          "Review the trap list once more:",
          "correlation/causation, exp/log,",
          "10% rule, Hardy-Weinberg.",
          "Last 2 days: light review + SLEEP."]),
    ]
    bx = 110
    bw = (W - 110 - 110 - 60) // 3
    by = 180
    bh = 660
    for i, (tag, head, col, lines) in enumerate(weeks):
        px = bx + i * (bw + 30)
        d.rounded_rectangle([px, by, px + bw, by + bh], radius=20,
                            outline=col, width=6, fill=CARD)
        d.rectangle([px, by, px + bw, by + 120], fill=col)
        d.text((px + 28, by + 16), tag, fill=CREAM, font=font("serif_bold", 46))
        d.text((px + 28, by + 78), head, fill=CREAM, font=font("sans_bold", 26))
        yy = by + 160
        for ln in lines:
            d.text((px + 28, yy), ln, fill=INK, font=font("sans", 28))
            yy += 52
        # connecting arrow between weeks
        if i < 2:
            ay = by + bh // 2
            ax = px + bw + 4
            d.polygon([(ax, ay - 18), (ax, ay + 18), (ax + 22, ay)], fill=MAROON)

    d.rounded_rectangle([110, 880, W - 110, 1000], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Protect the REASONING half — it's where most students under-prepare,",
             font("serif_bold", 30), 906, MAROON_DARK)
    centered(d, "and it's worth 50% of your score.",
             font("sans", 28), 952, MAROON)
deck.custom("13_study_plan", study_plan)


# 14 — recap
deck.recap("14_recap", "Recap.", [
    "Section I: 60 MCQ / 90 min / 50%.  Section II: 6 FRQ / 90 min / 50% (2 long 8-10 pts + 4 short 4 pts).",
    "Scored 1-5; a 3 or higher earns college credit at many institutions.",
    "Six practices: concept, visual, question/method, data, stats, argument from evidence.",
    "FRQ move: read the experiment (IV/DV/control) → testable hypothesis → claim-evidence-reasoning.",
    "Connect molecular detail UP to the ecological / evolutionary context to earn synthesis points.",
    "Traps: correlation =/= causation; exponential vs logistic (K not a hard ceiling); 10% rule; H-W null model.",
], assignment=[
    "Take ONE full timed practice exam this week (both sections, 3 hours), self-score it,",
    "and build your 30-day plan from your 3 weakest units.  Submit score + plan via the GIIS dashboard.",
])


# 15 — path (FINAL module — congratulate; no Module 17)
deck.path("15_path", [
    ("✓",  "Finished all 16 modules of AP Biology",  "Every unit, every trap, every science practice — done."),
    ("1.", "Take a FULL timed practice exam",        "Recent released exam (College Board) or Khan Academy timed sections — 3 hours, real conditions."),
    ("2.", "Self-score it honestly",                 "Both sections; rank your weakest units and shaky FRQ skills."),
    ("3.", "Book an advisor review session",         "Through the GIIS dashboard — bring your scored exam to target weak spots before exam day."),
], next_text="You've done the work. There's no next module — now go earn the score.",
   intro="This is the capstone. Here's your final step before exam day:")


print("AP Biology Module 16 slides built.")
