"""AP Biology · Module 12 — Ecology: Populations.

Teal (science) theme auto-resolved from "AP Biology". 17 slides total.
Custom diagrams: hook (J-vs-S two-panel), exponential J-curve, logistic
S-curve with dashed K line + overshoot wobble, survivorship curves on a
semi-log axis (Type I convex / Type II diagonal / Type III concave), and the
energy-flows-vs-matter-cycles preview. Pause slide (11) is duplicated to 12
so the same image plays during both Q and A sections.
"""
import sys
import math
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, wrap, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, CREAM,
)

LOGO = "../../src/img/logo_nobg.png"
deck = Deck(course="AP Biology", module_num=12, output_dir="slides", logo_path=LOGO)

ACCENT = deck.accent           # teal
ACCENT_LT = deck.accent_light  # light teal
CARD = deck.card_bg


# ── shared curve helpers (deterministic) ──────────────────────────────

def _axes(d, x0, y0, x1, y1, x_label, y_label):
    """Draw L-shaped axes. (x0,y0)=origin bottom-left, (x1,y1)=top-right."""
    d.line([(x0, y1), (x0, y0)], fill=MAROON_DARK, width=5)   # y-axis
    d.line([(x0, y0), (x1, y0)], fill=MAROON_DARK, width=5)   # x-axis
    d.text((x0 - 8, y1 - 50), y_label, fill=MAROON_DARK, font=font("sans_bold", 24))
    xw = d.textlength(x_label, font=font("sans_bold", 24))
    d.text((x1 - xw, y0 + 16), x_label, fill=MAROON_DARK, font=font("sans_bold", 24))


def _j_curve(d, x0, y0, x1, y1, color=MAROON, width=8):
    """Exponential J-curve: flat-then-explosive climb."""
    span_x = x1 - x0
    span_y = y0 - y1
    pts = []
    for i in range(81):
        f = i / 80.0
        y_frac = (math.exp(3.0 * f) - 1) / (math.exp(3.0) - 1)  # 0..1
        px = x0 + f * span_x
        py = y0 - y_frac * span_y
        pts.append((px, py))
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=color, width=width)


def _s_curve(d, x0, y0, x1, y1, k_y, color=MAROON, width=8, overshoot=False):
    """Logistic S-curve approaching k_y. If overshoot, briefly poke above K
    then dampen back toward it (a subtle wobble)."""
    span_x = x1 - x0
    plateau = y0 - k_y          # vertical distance origin -> K line
    pts = []
    for i in range(101):
        f = i / 100.0
        # logistic 0..1 centered at f=0.45
        logi = 1.0 / (1.0 + math.exp(-11.0 * (f - 0.42)))
        y_frac = logi
        if overshoot and f > 0.55:
            # damped sine wobble around K, decaying with f
            decay = math.exp(-6.0 * (f - 0.55))
            y_frac += 0.10 * decay * math.sin((f - 0.55) * 26.0)
        px = x0 + f * span_x
        py = y0 - y_frac * plateau
        pts.append((px, py))
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=color, width=width)


def _dashed_h(d, x0, x1, y, color=MUTED, width=4, dash=22, gap=16):
    x = x0
    while x < x1:
        d.line([(x, y), (min(x + dash, x1), y)], fill=color, width=width)
        x += dash + gap


# 01 — title
deck.title("01_title", "AP Biology",
           "Module 12 — Ecology: Populations",
           "Sample lesson  ·  ~8 minutes")


# 02 — hook: J (unlimited?) vs S (reality), two panels
def hook(img, d):
    d.text((110, 60), "No population grows forever.  What stops it?",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 140),
           "A few insects land on empty habitat.  For a moment they explode — then reality bends the curve.",
           fill=MUTED, font=font("sans", 30))

    panel_w = 870
    panel_h = 600
    gap = 30
    start_x = (W - (panel_w * 2 + gap)) // 2
    y0 = 230

    # LEFT — unlimited resources? J shooting off the top
    lx = start_x
    d.rounded_rectangle([lx, y0, lx + panel_w, y0 + panel_h], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.rectangle([lx, y0, lx + panel_w, y0 + 70], fill=ACCENT)
    txt = "\"unlimited resources?\""
    tf = font("serif_bold", 38)
    tw = d.textlength(txt, font=tf)
    d.text((lx + panel_w // 2 - tw / 2, y0 + 14), txt, fill=CREAM, font=tf)
    gx0, gyb = lx + 110, y0 + panel_h - 90
    gx1, gyt = lx + panel_w - 70, y0 + 110
    _axes(d, gx0, gyb, gx1, gyt, "time", "N")
    _j_curve(d, gx0 + 10, gyb - 10, gx1 - 10, gyt + 5, color=MAROON, width=9)
    # upward arrowhead off the top
    d.polygon([(gx1 - 28, gyt + 8), (gx1 + 6, gyt + 8), (gx1 - 11, gyt - 26)],
              fill=MAROON)
    d.text((lx + 130, y0 + 130), "J-curve", fill=MAROON, font=font("sans_bold", 30))

    # RIGHT — reality: arrow bends to an S
    rx = lx + panel_w + gap
    d.rounded_rectangle([rx, y0, rx + panel_w, y0 + panel_h], radius=20,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    d.rectangle([rx, y0, rx + panel_w, y0 + 70], fill=MAROON)
    txt = "\"reality\""
    tw = d.textlength(txt, font=tf)
    d.text((rx + panel_w // 2 - tw / 2, y0 + 14), txt, fill=CREAM, font=tf)
    gx0, gyb = rx + 110, y0 + panel_h - 90
    gx1, gyt = rx + panel_w - 70, y0 + 110
    _axes(d, gx0, gyb, gx1, gyt, "time", "N")
    k_y = gyt + 70
    _dashed_h(d, gx0, gx1, k_y, color=MUTED, width=4)
    kw = d.textlength("K", font=font("sans_bold", 26))
    d.text((gx1 - kw - 4, k_y - 36), "K", fill=MUTED, font=font("sans_bold", 26))
    _s_curve(d, gx0 + 10, gyb - 10, gx1 - 10, gyt + 5, k_y,
             color=MAROON, width=9, overshoot=True)
    d.text((rx + 130, y0 + 130), "S-curve", fill=MAROON, font=font("sans_bold", 30))

    # bottom strip
    d.rounded_rectangle([110, 870, W - 110, 980], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Why can NO population grow forever — and what slams on the brakes?",
             font("serif_bold", 36), 905, MAROON_DARK)
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "MEASURE — size N, density, dispersion, demography  r = (b − d) + (i − e).",
    "MODEL — exponential J-curve vs logistic S-curve, and what K really means.",
    "LIMIT + STRATEGIZE — density factors, r vs K selection, survivorship curves.",
], footnote="Energy flow (8.2) gets one preview sentence — full treatment is Module 14.")


# 04 — population parameters (definition)
deck.definition("04_population_parameters",
                "Two numbers to keep separate.",
                "SIZE (N) = total count.   DENSITY = individuals per area / volume.",
                "Same head count can mean very different densities — it depends how much space they're spread across.")


# 05 — dispersion (custom: three mini-grids)
def dispersion(img, d):
    d.text((110, 70), "Dispersion  —  how individuals are arranged in space.",
           fill=MAROON, font=font("serif_bold", 54))
    d.text((110, 150),
           "Three patterns.  Clumped is by far the most common.",
           fill=MUTED, font=font("sans", 30))

    import random
    panel_w = 540
    panel_h = 520
    gap = 40
    start_x = (W - (panel_w * 3 + gap * 2)) // 2
    y0 = 250

    panels = [
        ("CLUMPED", "most common — resources are patchy", "clumped"),
        ("UNIFORM", "even spacing — territorial behavior", "uniform"),
        ("RANDOM",  "rare — no attraction or repulsion", "random"),
    ]
    for idx, (label, sub, kind) in enumerate(panels):
        px = start_x + idx * (panel_w + gap)
        outline = MAROON if idx == 0 else ACCENT
        fill = ACCENT_LT if idx == 0 else CARD
        d.rounded_rectangle([px, y0, px + panel_w, y0 + panel_h], radius=20,
                            outline=outline, width=5, fill=fill)
        d.rectangle([px, y0, px + panel_w, y0 + 60], fill=outline)
        tf = font("serif_bold", 34)
        tw = d.textlength(label, font=tf)
        d.text((px + panel_w // 2 - tw / 2, y0 + 12), label, fill=CREAM, font=tf)

        # plot area
        ax0, ay0 = px + 50, y0 + 100
        ax1, ay1 = px + panel_w - 50, y0 + panel_h - 110
        d.rectangle([ax0, ay0, ax1, ay1], outline=MUTED, width=3, fill=CREAM)
        aw, ah = ax1 - ax0, ay1 - ay0

        dots = []
        if kind == "clumped":
            random.seed(1)
            centers = [(ax0 + aw * 0.28, ay0 + ah * 0.30),
                       (ax0 + aw * 0.70, ay0 + ah * 0.66)]
            for cx, cy in centers:
                for _ in range(11):
                    dx = random.gauss(0, aw * 0.07)
                    dy = random.gauss(0, ah * 0.07)
                    dots.append((cx + dx, cy + dy))
        elif kind == "uniform":
            cols, rows = 4, 4
            for r in range(rows):
                for c in range(cols):
                    gx = ax0 + aw * (c + 0.5) / cols
                    gy = ay0 + ah * (r + 0.5) / rows
                    dots.append((gx, gy))
        else:  # random
            random.seed(7)
            for _ in range(18):
                dots.append((random.uniform(ax0 + 14, ax1 - 14),
                             random.uniform(ay0 + 14, ay1 - 14)))

        for (dx, dy) in dots:
            dx = max(ax0 + 10, min(ax1 - 10, dx))
            dy = max(ay0 + 10, min(ay1 - 10, dy))
            d.ellipse([dx - 9, dy - 9, dx + 9, dy + 9], fill=MAROON_DARK)

        sf = font("sans", 24)
        sw = d.textlength(sub, font=sf)
        d.text((px + panel_w // 2 - sw / 2, y0 + panel_h - 60), sub,
               fill=INK if idx != 0 else MAROON_DARK, font=sf)
deck.custom("05_dispersion", dispersion)


# 06 — demography (equation)
deck.equation("06_demography", "Demography drives change  —  per-capita rate r", [
    ("r = (b − d) + (i − e)", MAROON, "births & immigration ADD · deaths & emigration REMOVE"),
    ("b, d, i, e  =  per-capita rates", INK, "per individual, per unit time"),
    ("r > 0 grows  ·  r = 0 stable  ·  r < 0 shrinks", MUTED, "don't forget immigration & emigration"),
])


# 07 — exponential (custom: J-curve + equation)
def exponential(img, d):
    d.text((110, 70), "Exponential growth  —  the J-curve.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 150),
           "Unlimited resources → the bigger the population, the faster it grows.",
           fill=MUTED, font=font("sans", 30))

    # equation card on the right
    rx, ry = 1180, 270
    rw, rh = W - 110 - rx, 560
    d.rounded_rectangle([rx, ry, rx + rw, ry + rh], radius=20,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    d.text((rx + 30, ry + 30), "dN/dt = rN",
           fill=MAROON_DARK, font=font("mono", 56))
    notes = [
        "Rare in nature.",
        "Seen briefly during early",
        "colonization or right after",
        "a disturbance.",
        "",
        "Doubling time ≈ 70 / r",
        "(r as a PERCENT, not the",
        "decimal r in dN/dt = rN).",
    ]
    yy = ry + 130
    for ln in notes:
        col = ACCENT if ln.startswith("Doubling") else INK
        d.text((rx + 30, yy), ln, fill=col, font=font("sans", 26))
        yy += 44

    # graph on the left
    gx0, gyb = 200, 820
    gx1, gyt = 1080, 270
    d.rounded_rectangle([150, 250, 1110, 850], radius=18, outline=ACCENT,
                        width=4, fill=CARD)
    _axes(d, gx0, gyb, gx1, gyt, "time", "N")
    _j_curve(d, gx0 + 10, gyb - 10, gx1 - 10, gyt + 10, color=MAROON, width=9)
    d.polygon([(gx1 - 28, gyt + 12), (gx1 + 6, gyt + 12), (gx1 - 11, gyt - 22)],
              fill=MAROON)
    d.text((gx0 + 60, gyt + 30), "J", fill=MAROON, font=font("serif_bold", 80))
deck.custom("07_exponential", exponential)


# 08 — logistic (custom: S-curve with dashed K + overshoot wobble + equation)
def logistic(img, d):
    d.text((110, 70), "Logistic growth  —  the S-curve.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 150),
           "Resources run out → growth slows as N nears carrying capacity K.",
           fill=MUTED, font=font("sans", 30))

    # equation card on the right
    rx, ry = 1180, 270
    rw, rh = W - 110 - rx, 560
    d.rounded_rectangle([rx, ry, rx + rw, ry + rh], radius=20,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    d.text((rx + 24, ry + 30), "dN/dt =",
           fill=MAROON_DARK, font=font("mono", 44))
    d.text((rx + 24, ry + 90), "rN(K−N)/K",
           fill=MAROON_DARK, font=font("mono", 44))
    notes = [
        "N small → (K−N)/K ≈ 1",
        "       → fast growth.",
        "N → K  → bracket → 0",
        "       → growth flattens.",
        "",
        "K is NOT a hard ceiling —",
        "populations can OVERSHOOT,",
        "then oscillate / crash back.",
        "K is the settling level.",
    ]
    yy = ry + 160
    for ln in notes:
        col = MAROON if ln.startswith("K is NOT") or ln.startswith("then") else INK
        d.text((rx + 24, yy), ln, fill=col, font=font("sans", 25))
        yy += 42

    # graph on the left
    gx0, gyb = 200, 820
    gx1, gyt = 1080, 270
    d.rounded_rectangle([150, 250, 1110, 850], radius=18, outline=ACCENT,
                        width=4, fill=CARD)
    _axes(d, gx0, gyb, gx1, gyt, "time", "N")
    k_y = gyt + 90
    _dashed_h(d, gx0, gx1, k_y, color=MUTED, width=4)
    d.text((gx0 + 6, k_y - 38), "K (carrying capacity)",
           fill=MUTED, font=font("sans_bold", 26))
    _s_curve(d, gx0 + 10, gyb - 10, gx1 - 10, gyt + 5, k_y,
             color=MAROON, width=9, overshoot=True)
    d.text((gx0 + 250, gyb - 230), "S", fill=MAROON, font=font("serif_bold", 80))
deck.custom("08_logistic", logistic)


# 09 — exponential vs logistic compare
deck.compare("09_exp_vs_log_compare",
             "The growth trap the AP loves.",
             left={
                 "label": "EXPONENTIAL  (J-curve)",
                 "color": ACCENT,
                 "lines": [
                     "dN/dt = rN",
                     "Assumes UNLIMITED resources.",
                     "Grows faster and faster.",
                     "Rare & short-lived in nature.",
                     "Early colonization / post-disturbance.",
                 ],
                 "footnote": "Cue:  unlimited food / just colonized → exponential.",
             },
             right={
                 "label": "LOGISTIC  (S-curve)",
                 "color": MAROON,
                 "lines": [
                     "dN/dt = rN(K − N)/K",
                     "LIMITED by carrying capacity K.",
                     "Growth slows as N nears K.",
                     "Settles toward K — can OVERSHOOT,",
                     "then oscillate or crash back.",
                 ],
                 "footnote": "Cue:  slowing near the environment's limit → logistic.",
             })


# 10 — limiting factors compare
deck.compare("10_limiting_factors_compare",
             "Limiting factors  —  test the MECHANISM, not the bin.",
             left={
                 "label": "DENSITY-DEPENDENT",
                 "color": MAROON,
                 "lines": [
                     "Per-capita effect RISES with N.",
                     "· competition",
                     "· disease",
                     "· predation",
                     "· accumulation of waste",
                     "· territoriality",
                 ],
                 "footnote": "Stronger because there are MORE individuals.",
             },
             right={
                 "label": "DENSITY-INDEPENDENT",
                 "color": ACCENT,
                 "lines": [
                     "Effect does NOT change with N.",
                     "· weather extremes",
                     "· fire",
                     "· floods",
                     "· volcanic eruptions",
                     "· human disturbance",
                 ],
                 "footnote": "Hits regardless of population size.",
             })


# 11 — pause + try (two scenarios)
deck.pause("11_pause1", "PAUSE  &  TRY",
           "A) Wildfire kills a larger fraction in a DENSER stand than a sparse one.   B) A long cold snap kills many, regardless of crowding.",
           "DENSITY-DEP  or  -INDEP ?",
           hint="Use the test: does the per-capita effect change with N?  Pause now. Solve it. Press play when you're ready.")

# 12 — duplicate for the answer-reveal section
deck.duplicate("11_pause1", "12_pause1_silence")


# 13 — r vs K compare (with spectrum bar at bottom via custom)
def r_vs_k(img, d):
    d.text((110, 70), "Life-history strategies  —  r vs K.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 150),
           "Quantity vs quality.  But it's a SPECTRUM — most species fall in between.",
           fill=MUTED, font=font("sans", 30))

    panel_w = 850
    panel_h = 560
    gap = 40
    start_x = (W - (panel_w * 2 + gap)) // 2
    y0 = 230

    cols = [
        ("r-SELECTED  —  bet on quantity", ACCENT, CARD, [
            "Many offspring",
            "Little / no parental care",
            "Short lifespan",
            "Early reproduction",
            "",
            "Insects, weeds, many fish.",
        ]),
        ("K-SELECTED  —  bet on quality", MAROON, ACCENT_LT, [
            "Few offspring",
            "Heavy parental care",
            "Long lifespan",
            "Late reproduction",
            "",
            "Humans, elephants, large mammals.",
        ]),
    ]
    for idx, (label, color, fill, lines) in enumerate(cols):
        px = start_x + idx * (panel_w + gap)
        d.rounded_rectangle([px, y0, px + panel_w, y0 + panel_h], radius=20,
                            outline=color, width=6, fill=fill)
        d.rectangle([px, y0, px + panel_w, y0 + 80], fill=color)
        tf = font("serif_bold", 38)
        tw = d.textlength(label, font=tf)
        d.text((px + panel_w // 2 - tw / 2, y0 + 18), label, fill=CREAM, font=tf)
        yy = y0 + 120
        for ln in lines:
            isex = ln.startswith(("Insects", "Humans"))
            col = ACCENT if (isex and idx == 0) else (MAROON if isex else INK)
            d.text((px + 40, yy), ln, fill=col,
                   font=font("sans_bold", 32) if isex else font("sans", 32))
            yy += 64

    # spectrum bar
    bx0, bx1 = 200, W - 200
    by = 880
    for i in range(bx1 - bx0):
        f = i / (bx1 - bx0)
        col = tuple(int(ACCENT[c] + (MAROON[c] - ACCENT[c]) * f) for c in range(3))
        d.line([(bx0 + i, by), (bx0 + i, by + 40)], fill=col)
    d.rounded_rectangle([bx0, by, bx1, by + 40], radius=8, outline=MAROON_DARK, width=3)
    d.text((bx0 - 4, by + 50), "r", fill=ACCENT, font=font("serif_bold", 40))
    d.text((bx1 - 24, by + 50), "K", fill=MAROON, font=font("serif_bold", 40))
    msg = "Most species lie somewhere in between — it's a spectrum, not a binary."
    mw = d.textlength(msg, font=font("sans_bold", 28))
    d.text(((W - mw) / 2, by + 56), msg, fill=MAROON_DARK, font=font("sans_bold", 28))
deck.custom("13_r_vs_k_compare", r_vs_k)


# 14 — survivorship curves (custom: semi-log, three correct shapes)
def survivorship(img, d):
    d.text((110, 70), "Survivorship curves  —  three shapes.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 150),
           "Number surviving (log scale) vs age.  Curve shape ↔ life-history strategy.",
           fill=MUTED, font=font("sans", 30))

    # graph frame
    gx0, gyb = 240, 880
    gx1, gyt = 1180, 250
    d.rounded_rectangle([150, 230, 1240, 920], radius=18, outline=ACCENT,
                        width=4, fill=CARD)
    _axes(d, gx0, gyb, gx1, gyt, "age →", "")
    # y-axis label rotated-ish (stacked text)
    d.text((165, 430), "number", fill=MAROON_DARK, font=font("sans_bold", 24))
    d.text((165, 460), "surviving", fill=MAROON_DARK, font=font("sans_bold", 24))
    d.text((165, 490), "(log)", fill=MAROON_DARK, font=font("sans_bold", 24))

    span_x = gx1 - gx0
    span_y = gyb - gyt

    # All start at top-left (full cohort alive at age 0).
    # On a LOG y-axis: Type I convex (high, then late drop); Type II straight
    # diagonal (constant proportional mortality); Type III concave (steep early
    # drop then flattens).
    typeI, typeII, typeIII = [], [], []
    for i in range(101):
        f = i / 100.0
        px = gx0 + f * span_x
        # Type I: stays near top, then drops late (convex from above)
        yI = 1.0 - 0.92 * (f ** 3.2)
        # Type II: straight line on log axis
        yII = 1.0 - 0.92 * f
        # Type III: steep early drop, then flattens (concave)
        yIII = 1.0 - 0.92 * (1 - (1 - f) ** 3.2)
        typeI.append((px, gyt + (1 - yI) * span_y))
        typeII.append((px, gyt + (1 - yII) * span_y))
        typeIII.append((px, gyt + (1 - yIII) * span_y))

    def draw(pts, color):
        for i in range(len(pts) - 1):
            d.line([pts[i], pts[i + 1]], fill=color, width=8)

    draw(typeI, ACCENT)
    draw(typeII, (200, 140, 60))   # amber
    draw(typeIII, MAROON)

    # inline labels near each curve
    d.text((typeI[62][0], typeI[62][1] - 50), "Type I", fill=ACCENT,
           font=font("sans_bold", 30))
    d.text((typeII[55][0] - 30, typeII[55][1] - 56), "Type II",
           fill=(200, 140, 60), font=font("sans_bold", 30))
    d.text((typeIII[28][0] + 14, typeIII[28][1] + 8), "Type III",
           fill=MAROON, font=font("sans_bold", 30))

    # legend / strategy mapping on the right
    rx, ry = 1280, 250
    rw = W - 110 - rx
    d.rounded_rectangle([rx, ry, rx + rw, ry + 670], radius=18,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    d.text((rx + 24, ry + 24), "Shape ↔ strategy",
           fill=MAROON_DARK, font=font("serif_bold", 32))
    items = [
        ("Type I", ACCENT, "High early/mid survival,",
         "late mortality.", "Humans, large mammals.", "→ K-selected"),
        ("Type II", (200, 140, 60), "Constant mortality",
         "at every age.", "Some birds, small", "mammals, reptiles."),
        ("Type III", MAROON, "Huge early die-off,",
         "few survive long.", "Oysters, many fish,", "plants.  → r-selected"),
    ]
    yy = ry + 90
    for name, col, l1, l2, l3, l4 in items:
        d.text((rx + 24, yy), name, fill=col, font=font("serif_bold", 30))
        d.text((rx + 24, yy + 42), l1, fill=INK, font=font("sans", 24))
        d.text((rx + 24, yy + 74), l2, fill=INK, font=font("sans", 24))
        d.text((rx + 24, yy + 110), l3, fill=MUTED, font=font("sans", 22))
        last_col = ACCENT if "K-selected" in l4 else (MAROON if "r-selected" in l4 else MUTED)
        d.text((rx + 24, yy + 138), l4, fill=last_col,
               font=font("sans_bold", 22))
        yy += 200
deck.custom("14_survivorship", survivorship)


# 15 — energy preview (custom: matter cycles vs energy flows)
def energy_preview(img, d):
    d.text((110, 70), "One bridge before we wrap  —  8.2 preview.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 150),
           "File this one idea away:  matter CYCLES, but energy FLOWS one way.",
           fill=MUTED, font=font("sans", 30))

    # LEFT: matter cycles (a loop)
    cx, cy, r = 560, 600, 230
    d.rounded_rectangle([150, 280, 980, 920], radius=20, outline=ACCENT,
                        width=5, fill=CARD)
    d.text((200, 310), "Matter CYCLES", fill=ACCENT, font=font("serif_bold", 42))
    # circular arrows
    d.arc([cx - r, cy - r, cx + r, cy + r], start=300, end=210,
          fill=MAROON, width=12)
    # arrowhead at end of arc (~210°)
    ax = cx + r * math.cos(math.radians(210))
    ay = cy + r * math.sin(math.radians(210))
    d.polygon([(ax - 22, ay - 4), (ax + 8, ay - 24), (ax + 6, ay + 18)],
              fill=MAROON)
    d.ellipse([cx - 70, cy - 70, cx + 70, cy + 70], fill=ACCENT_LT,
              outline=MAROON_DARK, width=4)
    centered_lbl = "C, N, P …"
    cf = font("sans_bold", 30)
    cw = d.textlength(centered_lbl, font=cf)
    d.text((cx - cw / 2, cy - 18), centered_lbl, fill=MAROON_DARK, font=cf)
    d.text((280, 850), "Reused again and again.", fill=INK, font=font("sans", 28))

    # RIGHT: energy flows (straight arrow, lost as heat)
    rx0 = 1010
    d.rounded_rectangle([rx0, 280, W - 110, 920], radius=20, outline=MAROON,
                        width=5, fill=ACCENT_LT)
    d.text((rx0 + 50, 310), "Energy FLOWS", fill=MAROON, font=font("serif_bold", 42))
    ex0 = rx0 + 90
    ex1 = W - 200
    ey = 560
    d.line([(ex0, ey), (ex1, ey)], fill=MAROON, width=16)
    d.polygon([(ex1, ey - 30), (ex1 + 50, ey), (ex1, ey + 30)], fill=MAROON)
    d.text((ex0 - 10, ey - 90), "sun in", fill=MAROON_DARK, font=font("sans_bold", 30))
    d.text((ex1 - 120, ey - 90), "→ heat out", fill=RED, font=font("sans_bold", 30))
    # wavy heat-loss arrows pointing away
    for hx in (ex0 + 160, ex0 + 360, ex0 + 560):
        d.line([(hx, ey + 20), (hx + 14, ey + 90)], fill=RED, width=6)
        d.polygon([(hx + 6, ey + 90), (hx + 24, ey + 92), (hx + 18, ey + 110)],
                  fill=RED)
    d.text((rx0 + 50, 760), "One-way street.", fill=INK, font=font("sans", 28))
    d.text((rx0 + 50, 800), "Lost as heat — NOT recycled.", fill=MAROON,
           font=font("sans_bold", 28))

    # bottom strip
    d.rounded_rectangle([110, 950, W - 110, 1030], radius=14, fill=ACCENT_LT,
                        outline=MAROON, width=4)
    centered(d, "Matter cycles.  Energy flows (one-way, lost as heat).  Full treatment → Module 14.",
             font("sans_bold", 28), 972, MAROON_DARK)
deck.custom("15_energy_preview", energy_preview)


# 16 — recap
deck.recap("16_recap", "Recap.", [
    "MEASURE:  size N, density, dispersion (clumped common);  r = (b − d) + (i − e), per-capita.",
    "MODEL:  exponential dN/dt = rN (J, unlimited, rare);  logistic rN(K−N)/K (S, settles toward K).",
    "K is the settling level, NOT a hard cap — populations can overshoot and oscillate back.",
    "LIMIT:  classify by mechanism — density-DEPENDENT intensifies with N; -INDEPENDENT doesn't.",
    "STRATEGY:  r-selected (quantity) ↔ K-selected (quality) — a spectrum, not a binary.",
    "SURVIVORSHIP:  Type I ↔ K-selected · Type II constant · Type III ↔ r-selected.",
], assignment=[
    "AP tip:  for a limiting-factor item, ask 'does the per-capita effect change with N?'",
    "Preview:  matter cycles, energy flows one-way (lost as heat) — full energetics in Module 14.",
])


# 17 — path
deck.path("17_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Biology",   "Chapter 45 — Population & Community Ecology"),
    ("2.", "Khan Academy AP Bio",     "Unit 8 — population growth & regulation problem sets"),
    ("3.", "GIIS Unit 8 problem set", "Classify limiting factors; exponential vs logistic; survivorship"),
    ("4.", "Advisor check-in",        "If exponential-vs-logistic or curve-to-strategy still feels fuzzy"),
], next_text="Next up:  Module 13 — Community Ecology.")


print("AP Biology Module 12 slides built.")
