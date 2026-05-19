"""AP Biology · Module 7 — DNA Structure and Replication.

Teal (science) theme auto-resolved by slide_kit from the "AP Biology" prefix.
16 slides total. Pause slide (10) is duplicated to (11) so the same image
plays during both the question and the answer-reveal narration.
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
deck = Deck(course="AP Biology", module_num=7, output_dir="slides", logo_path=LOGO)

ACCENT = deck.accent           # teal
ACCENT_LT = deck.accent_light  # light teal
CARD = deck.card_bg


# 01 — title
deck.title("01_title", "AP Biology",
           "Module 7 — DNA Structure and Replication",
           "Sample lesson  ·  ~8 minutes")


# 02 — hook: 6 feet of DNA + Photo 51
def hook(img, d):
    d.text((110, 70), "6 feet of DNA  ·  in every cell.",
           fill=MAROON, font=font("serif_bold", 60))

    # Left panel: cell with DNA stretching out
    lx, ly, lw, lh = 140, 220, 760, 600
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=28,
                        outline=ACCENT, width=6, fill=CARD)
    cf = font("serif_bold", 38)
    cap = "Your DNA, stretched out:"
    tw = d.textlength(cap, font=cf)
    d.text((lx + lw // 2 - tw / 2, ly + 30), cap, fill=MAROON_DARK, font=cf)

    # Cell circle
    cell_cx = lx + lw // 2
    cell_cy = ly + 220
    cell_r = 90
    d.ellipse([cell_cx - cell_r, cell_cy - cell_r,
               cell_cx + cell_r, cell_cy + cell_r],
              fill=ACCENT_LT, outline=MAROON_DARK, width=4)
    # Nucleus
    d.ellipse([cell_cx - 40, cell_cy - 40, cell_cx + 40, cell_cy + 40],
              fill=ACCENT, outline=MAROON_DARK, width=3)
    d.text((cell_cx - 60, cell_cy + 100), "one cell",
           fill=MUTED, font=font("sans", 26))

    # Squiggly DNA line going down
    dna_top = cell_cy + 150
    dna_bot = ly + lh - 80
    midx = cell_cx
    pts = []
    n = 18
    for i in range(n + 1):
        t = i / n
        py = dna_top + (dna_bot - dna_top) * t
        px = midx + 80 * math.sin(t * math.pi * 5)
        pts.append((px, py))
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=MAROON_DARK, width=5)
    d.text((lx + lw // 2 - 100, dna_bot + 5), "= 6 feet long",
           fill=ACCENT, font=font("sans_bold", 32))

    # Right panel: Photo 51 / Watson-Crick story
    rx, ry, rw, rh = 1020, 220, 760, 600
    d.rounded_rectangle([rx, ry, rx + rw, ry + rh], radius=28,
                        outline=ACCENT, width=6, fill=CARD)
    cap2 = "1953  ·  the double helix."
    tw2 = d.textlength(cap2, font=cf)
    d.text((rx + rw // 2 - tw2 / 2, ry + 30), cap2,
           fill=MAROON_DARK, font=cf)

    # Stylized "Photo 51" X-ray pattern (cross of dots)
    px_cx = rx + rw // 2
    px_cy = ry + 280
    d.ellipse([px_cx - 130, px_cy - 130, px_cx + 130, px_cy + 130],
              fill=(30, 30, 30), outline=MAROON_DARK, width=3)
    for i in range(-3, 4):
        if i == 0:
            continue
        for sign1, sign2 in [(1, 1), (1, -1), (-1, 1), (-1, -1)]:
            spot_x = px_cx + sign1 * abs(i) * 20
            spot_y = px_cy + sign2 * abs(i) * 20
            r = 8 + abs(i)
            d.ellipse([spot_x - r, spot_y - r, spot_x + r, spot_y + r],
                      fill=(240, 240, 240))
    d.ellipse([px_cx - 14, px_cy - 14, px_cx + 14, px_cy + 14],
              fill=(240, 240, 240))
    d.text((px_cx - 70, px_cy + 150), "Photo 51",
           fill=MUTED, font=font("sans_bold", 26))
    d.text((px_cx - 110, px_cy + 185),
           "Rosalind Franklin, 1952", fill=MUTED,
           font=font("serif_ital", 22))

    # Bottom punchline strip
    d.rounded_rectangle([110, 880, W - 110, 1000], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Every division copies all 6 feet — with ~1 error per billion bases.",
             font("serif_bold", 36), 910, MAROON_DARK)
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "DNA structure — double helix, antiparallel, base pairing.",
    "Replication — semiconservative; leading vs. lagging; the enzyme lineup.",
    "Proofreading + telomeres + common traps.",
], footnote="By the end: you can name every enzyme and predict the new strand.")


# 04 — DNA structure (double helix, backbone, grooves)
def dna_structure(img, d):
    d.text((110, 60), "DNA  =  double helix.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 140),
           "Two antiparallel strands  ·  sugar–phosphate backbone (deoxyribose)  ·  bases pair inward.",
           fill=MUTED, font=font("sans", 28))

    # Left: stylized double helix
    cx_l = 480
    helix_top = 220
    helix_bot = 920
    amp = 130
    turns = 3
    n = 80
    pts_left = []
    pts_right = []
    for i in range(n + 1):
        t = i / n
        y = helix_top + (helix_bot - helix_top) * t
        phase = t * turns * 2 * math.pi
        x1 = cx_l + amp * math.sin(phase)
        x2 = cx_l + amp * math.sin(phase + math.pi)
        pts_left.append((x1, y))
        pts_right.append((x2, y))
    rung_step = 5
    for i in range(0, n + 1, rung_step):
        x1, y1 = pts_left[i]
        x2, y2 = pts_right[i]
        if abs(x1 - x2) < 40:
            continue
        d.line([(x1, y1), (x2, y2)], fill=ACCENT, width=3)
    for i in range(len(pts_left) - 1):
        d.line([pts_left[i], pts_left[i + 1]], fill=MAROON_DARK, width=6)
        d.line([pts_right[i], pts_right[i + 1]], fill=MAROON, width=6)

    # 5' / 3' labels on the helix
    d.text((cx_l - amp - 60, helix_top - 40), "5′",
           fill=MAROON_DARK, font=font("sans_bold", 32))
    d.text((cx_l - amp - 60, helix_bot + 5), "3′",
           fill=MAROON_DARK, font=font("sans_bold", 32))
    d.text((cx_l + amp + 30, helix_top - 40), "3′",
           fill=MAROON, font=font("sans_bold", 32))
    d.text((cx_l + amp + 30, helix_bot + 5), "5′",
           fill=MAROON, font=font("sans_bold", 32))

    # Major / minor groove labels
    d.text((cx_l + 200, 380), "← major groove",
           fill=MUTED, font=font("sans_bold", 26))
    d.text((cx_l + 200, 580), "← minor groove",
           fill=MUTED, font=font("sans_bold", 26))

    # Right side: vocabulary card
    rx = 970
    ry = 220
    rw = 820
    rh = 700
    d.rounded_rectangle([rx, ry, rx + rw, ry + rh], radius=22,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((rx + 30, ry + 20), "Key features",
           fill=ACCENT, font=font("sans_bold", 40))
    items = [
        ("Double helix",         "Two strands twisted ~10 bp per turn."),
        ("Backbone",             "Sugar (deoxyribose) + phosphate, on the outside."),
        ("Bases",                "Stick inward;  pair across the middle."),
        ("Antiparallel",         "One strand 5′→3′, partner 3′→5′."),
        ("Major + minor grooves","Proteins read sequence WITHOUT unwinding."),
    ]
    yy = ry + 100
    for head, sub in items:
        d.ellipse([rx + 30, yy + 14, rx + 50, yy + 34], fill=ACCENT)
        d.text((rx + 70, yy), head, fill=INK,
               font=font("sans_bold", 32))
        d.text((rx + 70, yy + 46), sub, fill=MUTED,
               font=font("sans", 26))
        yy += 110
deck.custom("04_dna_structure", dna_structure)


# 05 — base pairing
def base_pairing(img, d):
    d.text((110, 70), "Base pairing  —  A · T  and  G · C.",
           fill=MAROON, font=font("serif_bold", 60))

    # A=T pair on left
    lx = 200
    ly = 220
    d.rounded_rectangle([lx, ly, lx + 700, ly + 300], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((lx + 30, ly + 20), "A  =  T", fill=ACCENT,
           font=font("serif_bold", 64))
    d.text((lx + 30, ly + 110), "Adenine  ·  Thymine",
           fill=INK, font=font("sans", 28))
    d.text((lx + 30, ly + 160), "2  hydrogen bonds",
           fill=MAROON_DARK, font=font("sans_bold", 32))
    for i in range(2):
        bx = lx + 450
        by = ly + 120 + i * 36
        for j in range(5):
            d.rectangle([bx + j * 22, by, bx + j * 22 + 14, by + 6],
                        fill=ACCENT)
    d.text((lx + 30, ly + 230), "purine  +  pyrimidine",
           fill=MUTED, font=font("serif_ital", 24))

    # G=C pair on right
    rx = 1020
    d.rounded_rectangle([rx, ly, rx + 700, ly + 300], radius=20,
                        outline=MAROON, width=5, fill=CARD)
    d.text((rx + 30, ly + 20), "G  ≡  C", fill=MAROON,
           font=font("serif_bold", 64))
    d.text((rx + 30, ly + 110), "Guanine  ·  Cytosine",
           fill=INK, font=font("sans", 28))
    d.text((rx + 30, ly + 160), "3  hydrogen bonds",
           fill=MAROON_DARK, font=font("sans_bold", 32))
    for i in range(3):
        bx = rx + 450
        by = ly + 110 + i * 30
        for j in range(5):
            d.rectangle([bx + j * 22, by, bx + j * 22 + 14, by + 6],
                        fill=MAROON)
    d.text((rx + 30, ly + 230), "purine  +  pyrimidine",
           fill=MUTED, font=font("serif_ital", 24))

    # Middle strip — purine vs pyrimidine rule
    d.rounded_rectangle([110, 580, W - 110, 720], radius=20,
                        outline=ACCENT, width=4, fill=ACCENT_LT)
    centered(d, "PURINES  (A, G)  =  2 rings    ·    PYRIMIDINES  (T, C)  =  1 ring",
             font("sans_bold", 36), 605, MAROON_DARK)
    centered(d, "Purine always pairs with pyrimidine  →  uniform helix width.",
             font("sans", 28), 660, INK)

    # Bottom — Chargaff's rule
    d.rounded_rectangle([110, 760, W - 110, 980], radius=22,
                        outline=MAROON, width=5, fill=CARD)
    d.text((150, 780), "Chargaff's rules",
           fill=MAROON, font=font("serif_bold", 44))
    centered(d, "%A  =  %T          %G  =  %C",
             font("mono", 60), 850, ACCENT)
    centered(d, "Direct clue, BEFORE the structure was known, that bases were pairing up.",
             font("sans", 28), 935, MUTED)
deck.custom("05_base_pairing", base_pairing)


# 06 — antiparallel 5'-3'
def antiparallel(img, d):
    d.text((110, 60), "Antiparallel  —  the most important fact in this module.",
           fill=MAROON, font=font("serif_bold", 48))

    top_y = 280
    bot_y = 480
    left_x = 220
    right_x = 1700

    d.line([(left_x, top_y), (right_x, top_y)], fill=MAROON_DARK, width=8)
    d.line([(left_x, bot_y), (right_x, bot_y)], fill=MAROON, width=8)

    d.text((left_x - 90, top_y - 30), "5′",
           fill=MAROON_DARK, font=font("sans_bold", 48))
    d.text((right_x + 20, top_y - 30), "3′",
           fill=MAROON_DARK, font=font("sans_bold", 48))
    d.text((left_x - 90, bot_y - 30), "3′",
           fill=MAROON, font=font("sans_bold", 48))
    d.text((right_x + 20, bot_y - 30), "5′",
           fill=MAROON, font=font("sans_bold", 48))

    # Top strand arrow points right (5' → 3')
    arrow_y = top_y - 65
    d.line([(left_x + 100, arrow_y), (right_x - 100, arrow_y)],
           fill=ACCENT, width=5)
    d.polygon([(right_x - 100, arrow_y),
               (right_x - 130, arrow_y - 15),
               (right_x - 130, arrow_y + 15)], fill=ACCENT)
    d.text((left_x + 480, arrow_y - 50),
           "this strand reads 5′ → 3′",
           fill=ACCENT, font=font("sans_bold", 32))

    # Bottom strand arrow points left (5' → 3' since 5' is on right)
    arrow_y2 = bot_y + 35
    d.line([(left_x + 100, arrow_y2), (right_x - 100, arrow_y2)],
           fill=ACCENT, width=5)
    d.polygon([(left_x + 100, arrow_y2),
               (left_x + 130, arrow_y2 - 15),
               (left_x + 130, arrow_y2 + 15)], fill=ACCENT)
    d.text((left_x + 480, arrow_y2 + 30),
           "its partner reads 5′ → 3′ the OTHER way",
           fill=ACCENT, font=font("sans_bold", 32))

    # Bases between the strands
    base_pairs = [("A", "T"), ("G", "C"), ("T", "A"), ("C", "G"),
                  ("A", "T"), ("G", "C"), ("T", "A"), ("A", "T"),
                  ("C", "G"), ("G", "C")]
    bf = font("mono", 40)
    n_bp = len(base_pairs)
    span = right_x - left_x - 200
    for i, (b1, b2) in enumerate(base_pairs):
        bx = left_x + 100 + int(i * span / (n_bp - 1))
        d.line([(bx, top_y + 10), (bx, bot_y - 10)], fill=ACCENT, width=3)
        d.rectangle([bx - 22, top_y + 14, bx + 22, top_y + 64],
                    fill=ACCENT_LT, outline=MAROON_DARK, width=2)
        tw = d.textlength(b1, font=bf)
        d.text((bx - tw / 2, top_y + 16), b1, fill=MAROON_DARK, font=bf)
        d.rectangle([bx - 22, bot_y - 64, bx + 22, bot_y - 14],
                    fill=ACCENT_LT, outline=MAROON_DARK, width=2)
        tw2 = d.textlength(b2, font=bf)
        d.text((bx - tw2 / 2, bot_y - 60), b2, fill=MAROON_DARK, font=bf)

    # Takeaway
    d.rounded_rectangle([110, 620, W - 110, 980], radius=22,
                        outline=MAROON, width=5, fill=CARD)
    d.text((150, 645), "Why this matters",
           fill=MAROON, font=font("serif_bold", 44))
    bullets = [
        "Phosphate hangs off the 5′ carbon  ·  next nucleotide attaches at 3′.",
        "DNA polymerase ONLY adds at the 3′ end  →  builds 5′ → 3′, always.",
        "Because the strands point opposite ways, polymerase handles each differently.",
        "Every weird thing about replication (leading/lagging, Okazaki) comes from this.",
    ]
    yy = 720
    for bt in bullets:
        d.text((180, yy), "·", fill=ACCENT, font=font("serif_bold", 40))
        d.text((220, yy + 6), bt, fill=INK, font=font("sans", 28))
        yy += 60
deck.custom("06_antiparallel_5_3", antiparallel)


# 07 — Meselson-Stahl semiconservative
def meselson_stahl(img, d):
    d.text((110, 60), "Meselson  &  Stahl  (1958)  —  replication is semiconservative.",
           fill=MAROON, font=font("serif_bold", 42))

    models = [
        ("CONSERVATIVE",     "old + old   AND   new + new", False),
        ("SEMICONSERVATIVE", "old + new   in every helix", True),
        ("DISPERSIVE",       "old & new mixed in each strand", False),
    ]
    panel_w = 540
    panel_h = 220
    panel_y = 180
    gap = 30
    start_x = (W - (panel_w * 3 + gap * 2)) // 2

    for i, (name, sub, is_winner) in enumerate(models):
        x = start_x + i * (panel_w + gap)
        color = ACCENT if is_winner else MUTED
        line_w = 6 if is_winner else 3
        d.rounded_rectangle([x, panel_y, x + panel_w, panel_y + panel_h],
                            radius=20, outline=color, width=line_w,
                            fill=CARD if is_winner else deck.bg)
        d.text((x + 24, panel_y + 16), name, fill=color,
               font=font("sans_bold", 32))
        d.text((x + 24, panel_y + 70), sub, fill=INK,
               font=font("sans", 26))
        vis_y = panel_y + 130
        if i == 0:
            colors = [(MAROON_DARK, MAROON_DARK), (ACCENT, ACCENT)]
        elif i == 1:
            colors = [(MAROON_DARK, ACCENT), (MAROON_DARK, ACCENT)]
        else:
            colors = [(MAROON_DARK, ACCENT), (ACCENT, MAROON_DARK)]
        for d_idx, (c1, c2) in enumerate(colors):
            dx = x + 60 + d_idx * 220
            d.rectangle([dx, vis_y, dx + 130, vis_y + 12], fill=c1)
            d.rectangle([dx, vis_y + 20, dx + 130, vis_y + 32], fill=c2)
        if is_winner:
            d.text((x + panel_w - 80, panel_y + 16), "✓",
                   fill=ACCENT, font=font("serif_bold", 50))

    # Experiment summary
    d.rounded_rectangle([110, 460, W - 110, 980], radius=22,
                        outline=MAROON, width=5, fill=CARD)
    d.text((150, 480), "The experiment",
           fill=MAROON, font=font("serif_bold", 44))
    steps = [
        "1.  Grow E. coli in heavy nitrogen (¹⁵N) for many generations  →  all DNA is heavy.",
        "2.  Switch culture to light nitrogen (¹⁴N).  Let it replicate once.",
        "3.  Spin DNA on a density gradient.  ALL of it sits at ONE intermediate band.",
        "4.  Replicate once more in ¹⁴N.  Now TWO bands — half intermediate, half light.",
    ]
    yy = 560
    for s in steps:
        d.text((180, yy), s, fill=INK, font=font("sans", 28))
        yy += 60

    d.rounded_rectangle([150, 830, W - 150, 950], radius=18,
                        fill=ACCENT_LT, outline=ACCENT, width=4)
    centered(d, "Result rules out conservative + dispersive  →  SEMICONSERVATIVE wins.",
             font("serif_bold", 34), 870, MAROON_DARK)
deck.custom("07_meselson_stahl", meselson_stahl)


# 08 — replication fork: helicase, SSBPs, topoisomerase
def replication_fork(img, d):
    d.text((110, 70), "Opening the fork  —  helicase  ·  SSBPs  ·  topoisomerase.",
           fill=MAROON, font=font("serif_bold", 48))

    fork_x = 700
    fork_y = 520
    # Pre-fork double helix (left)
    d.line([(200, fork_y - 30), (fork_x - 50, fork_y - 30)],
           fill=MAROON_DARK, width=8)
    d.line([(200, fork_y + 30), (fork_x - 50, fork_y + 30)],
           fill=MAROON, width=8)
    for x in range(220, fork_x - 60, 40):
        d.line([(x, fork_y - 25), (x, fork_y + 25)], fill=ACCENT, width=3)
    # Upper template
    d.line([(fork_x - 50, fork_y - 30), (1500, fork_y - 220)],
           fill=MAROON_DARK, width=8)
    # Lower template
    d.line([(fork_x - 50, fork_y + 30), (1500, fork_y + 220)],
           fill=MAROON, width=8)

    # Helicase
    d.ellipse([fork_x - 100, fork_y - 60, fork_x + 20, fork_y + 60],
              fill=RED, outline=MAROON_DARK, width=4)
    hf = font("sans_bold", 28)
    tw = d.textlength("HEL", font=hf)
    d.text((fork_x - 40 - tw / 2, fork_y - 14), "HEL", fill=CREAM, font=hf)
    d.text((fork_x - 130, fork_y + 80), "Helicase",
           fill=RED, font=font("sans_bold", 30))
    d.text((fork_x - 150, fork_y + 115),
           "breaks H-bonds  ·  unwinds", fill=MUTED, font=font("sans", 22))

    # SSBPs — beads on the open strands
    for bx in [900, 1050, 1200, 1350]:
        ratio = (bx - (fork_x - 50)) / (1500 - (fork_x - 50))
        upper_y = fork_y - 30 - ratio * 190
        d.ellipse([bx - 22, upper_y - 22, bx + 22, upper_y + 22],
                  fill=ACCENT, outline=MAROON_DARK, width=3)
        lower_y = fork_y + 30 + ratio * 190
        d.ellipse([bx - 22, lower_y - 22, bx + 22, lower_y + 22],
                  fill=ACCENT, outline=MAROON_DARK, width=3)
    d.text((1100, 250), "SSBPs", fill=ACCENT,
           font=font("sans_bold", 30))
    d.text((1030, 285),
           "keep separated strands from snapping back",
           fill=MUTED, font=font("sans", 22))

    # Topoisomerase ahead of the fork
    d.ellipse([280, fork_y - 50, 380, fork_y + 50],
              fill=MAROON, outline=MAROON_DARK, width=4)
    tf = font("sans_bold", 26)
    twt = d.textlength("TOPO", font=tf)
    d.text((330 - twt / 2, fork_y - 14), "TOPO",
           fill=CREAM, font=tf)
    d.text((230, fork_y + 80), "Topoisomerase",
           fill=MAROON, font=font("sans_bold", 30))
    d.text((220, fork_y + 115),
           "relieves supercoiling AHEAD of fork",
           fill=MUTED, font=font("sans", 22))

    # Supercoiling loops ahead
    for cx in (170, 130):
        d.arc([cx - 25, fork_y - 25, cx + 25, fork_y + 25],
              start=0, end=360, fill=MUTED, width=3)

    # Side legend
    legend_x = 1560
    legend_y = 230
    d.rounded_rectangle([legend_x, legend_y, legend_x + 240, legend_y + 360],
                        radius=18, outline=ACCENT, width=4, fill=CARD)
    d.text((legend_x + 20, legend_y + 16), "Setup crew",
           fill=ACCENT, font=font("sans_bold", 28))
    items = [
        (RED,    "Helicase"),
        (ACCENT, "SSBPs"),
        (MAROON, "Topoiso."),
    ]
    yy = legend_y + 80
    for col, lbl in items:
        d.ellipse([legend_x + 20, yy, legend_x + 50, yy + 30], fill=col)
        d.text((legend_x + 60, yy), lbl, fill=INK,
               font=font("sans_bold", 24))
        yy += 60

    # Bottom takeaway
    d.rounded_rectangle([110, 820, W - 110, 980], radius=20,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    centered(d, "Order:  topoisomerase (ahead)  →  helicase (open)  →  SSBPs (hold).",
             font("serif_bold", 34), 850, MAROON_DARK)
    centered(d, "Now we have two exposed single-stranded templates ready to be copied.",
             font("sans", 28), 910, INK)
deck.custom("08_replication_fork", replication_fork)


# 09 — primase + DNA Pol III
def primase_polymerase(img, d):
    d.text((110, 70), "Starting synthesis  —  primase  →  DNA Pol III.",
           fill=MAROON, font=font("serif_bold", 50))

    # Left card: primase
    lx, ly, lw, lh = 110, 200, 870, 740
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=22,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((lx + 30, ly + 20), "PRIMASE", fill=ACCENT,
           font=font("sans_bold", 44))
    d.text((lx + 30, ly + 80),
           "Lays down a short RNA primer  (~10 nt).",
           fill=INK, font=font("sans", 28))
    d.text((lx + 30, ly + 130),
           "Why?  DNA polymerase can NOT start from scratch.",
           fill=MAROON_DARK, font=font("sans_bold", 28))
    d.text((lx + 30, ly + 180),
           "It needs an existing 3′ OH to add onto.",
           fill=MAROON_DARK, font=font("sans_bold", 28))

    # Visual: template strand with RNA primer on top
    bx = lx + 50
    by = ly + 320
    d.line([(bx, by + 60), (bx + 770, by + 60)],
           fill=MAROON_DARK, width=6)
    d.text((bx - 50, by + 40), "3′",
           fill=MAROON_DARK, font=font("sans_bold", 28))
    d.text((bx + 780, by + 40), "5′",
           fill=MAROON_DARK, font=font("sans_bold", 28))
    template_bases = ["T", "A", "C", "G", "G", "A", "T", "C", "T", "G"]
    bf = font("mono", 30)
    for i, b in enumerate(template_bases):
        tx = bx + 40 + i * 70
        d.text((tx, by + 25), b, fill=MAROON_DARK, font=bf)
    # RNA primer
    primer_bases = ["A", "U", "G", "C"]
    for i, b in enumerate(primer_bases):
        tx = bx + 40 + i * 70
        d.rectangle([tx - 4, by - 30, tx + 30, by + 10],
                    fill=RED, outline=MAROON_DARK, width=2)
        tw = d.textlength(b, font=bf)
        d.text((tx + 13 - tw / 2, by - 25), b, fill=CREAM, font=bf)
    d.text((bx + 40 + 4 * 70 + 10, by - 60),
           "3′ OH", fill=ACCENT, font=font("sans_bold", 30))
    d.line([(bx + 40 + 4 * 70 + 30, by - 30),
            (bx + 40 + 4 * 70 + 30, by - 50)],
           fill=ACCENT, width=4)
    d.text((bx + 100, by - 90),
           "← RNA primer (red)",
           fill=RED, font=font("sans_bold", 26))

    d.text((lx + 30, ly + 580),
           "Primer = launchpad for DNA polymerase.",
           fill=MAROON_DARK, font=font("sans_bold", 28))
    d.text((lx + 30, ly + 625),
           "RNA primers are temporary — Pol I removes them later.",
           fill=MUTED, font=font("serif_ital", 26))

    # Right card: Pol III
    rx = lx + lw + 30
    rw = W - 110 - rx
    rh = lh
    d.rounded_rectangle([rx, ly, rx + rw, ly + rh], radius=22,
                        outline=MAROON, width=5, fill=CARD)
    d.text((rx + 30, ly + 20), "DNA  Pol  III", fill=MAROON,
           font=font("sans_bold", 44))
    d.text((rx + 30, ly + 80),
           "The workhorse of DNA synthesis (bacteria).",
           fill=INK, font=font("sans", 28))
    d.text((rx + 30, ly + 130),
           "Adds nucleotides ONLY 5′ → 3′.  Always.",
           fill=MAROON_DARK, font=font("sans_bold", 28))
    d.text((rx + 30, ly + 180),
           "Complementary to the template.",
           fill=INK, font=font("sans", 28))

    d.rounded_rectangle([rx + 30, ly + 250, rx + rw - 30, ly + 430],
                        radius=18, outline=ACCENT, width=5, fill=ACCENT_LT)
    rule_text = "5′ → 3′"
    f5 = font("mono", 100)
    tw5 = d.textlength(rule_text, font=f5)
    d.text((rx + rw // 2 - tw5 / 2, ly + 285), rule_text,
           fill=MAROON_DARK, font=f5)
    centered(d, "always.  no exceptions.",
             font("serif_ital", 30), ly + 395, MAROON_DARK)

    d.text((rx + 30, ly + 480),
           "Eukaryotes:  Pol δ  +  Pol ε  do the same job.",
           fill=INK, font=font("sans", 28))
    d.text((rx + 30, ly + 530),
           "AP exam treats E. coli as the canonical model.",
           fill=MUTED, font=font("serif_ital", 24))

    d.rounded_rectangle([rx + 30, ly + 600, rx + rw - 30, ly + 700],
                        radius=18, outline=MAROON, width=4, fill=CARD)
    centered(d, "Needs a free 3′ OH.  No primer  →  no synthesis.",
             font("sans_bold", 26), ly + 635, MAROON_DARK)
deck.custom("09_primase_polymerase", primase_polymerase)


# 10 — pause
deck.pause("10_pause1", "PAUSE  &  THINK",
           "Polymerase only extends from 3′ OH, only synthesizes 5′→3′.  But the templates run opposite directions.",
           "How is BOTH replicated at once?",
           hint="Pause now.  Think it through.  Press play when you're ready.")

# 11 — duplicate the pause slide for the answer-reveal section
deck.duplicate("10_pause1", "11_pause1_silence")


# 12 — lagging strand detail (Okazaki fragments, ligase)
def lagging_detail(img, d):
    d.text((110, 60), "The lagging strand  —  Okazaki  +  ligase.",
           fill=MAROON, font=font("serif_bold", 54))

    fork_x = 320
    cy = 380
    # Pre-fork
    d.line([(150, cy - 40), (fork_x, cy - 40)], fill=MAROON_DARK, width=6)
    d.line([(150, cy + 40), (fork_x, cy + 40)], fill=MAROON, width=6)
    # Upper template (leading)
    d.line([(fork_x, cy - 40), (1700, cy - 200)], fill=MAROON_DARK, width=6)
    # Lower template (lagging)
    d.line([(fork_x, cy + 40), (1700, cy + 200)], fill=MAROON, width=6)

    # LEADING strand: one continuous new strand
    d.line([(fork_x + 80, cy - 90), (1500, cy - 250)], fill=ACCENT, width=10)
    d.polygon([(fork_x + 90, cy - 95),
               (fork_x + 130, cy - 75),
               (fork_x + 130, cy - 110)], fill=ACCENT)
    d.text((900, cy - 285), "LEADING  —  continuous, toward fork",
           fill=ACCENT, font=font("sans_bold", 32))
    d.text((900, cy - 250), "5′ → 3′  ·  one primer  ·  one piece",
           fill=MUTED, font=font("sans", 24))

    # LAGGING strand: Okazaki fragments going AWAY from fork
    frag_starts = [(fork_x + 90, cy + 90), (700, cy + 130),
                   (1080, cy + 170), (1460, cy + 210)]
    frag_lens = [340, 340, 340, 200]
    for (sx, sy), L in zip(frag_starts, frag_lens):
        ex = sx + L
        ey_start = cy + 40 + (sx - fork_x) * 0.115 + 50
        ey_end = cy + 40 + (ex - fork_x) * 0.115 + 50
        d.line([(sx, ey_start), (ex, ey_end)], fill=ACCENT, width=10)
        d.polygon([(ex, ey_end),
                   (ex - 30, ey_end - 15),
                   (ex - 30, ey_end + 15)], fill=ACCENT)
        # Small red RNA primer at the start
        d.line([(sx - 20, ey_start - 3), (sx, ey_start)], fill=RED, width=10)

    d.text((760, cy + 280), "LAGGING  —  discontinuous, AWAY from fork",
           fill=MAROON, font=font("sans_bold", 32))
    d.text((760, cy + 320),
           "Okazaki fragments  ·  each has its own RNA primer (red)",
           fill=MUTED, font=font("sans", 24))

    # Bottom: cleanup story
    d.rounded_rectangle([110, 720, W - 110, 980], radius=22,
                        outline=MAROON, width=5, fill=CARD)
    d.text((150, 740), "Finishing the lagging strand",
           fill=MAROON, font=font("serif_bold", 36))
    steps = [
        ("1.", "DNA Pol III builds each Okazaki fragment 5′→3′ from its primer."),
        ("2.", "DNA Pol I removes the RNA primer in front, fills the gap with DNA."),
        ("3.", "DNA ligase forms the final phosphodiester bond  →  seals the nick."),
    ]
    yy = 800
    for n, t in steps:
        d.text((180, yy), n, fill=ACCENT, font=font("serif_bold", 34))
        d.text((230, yy + 4), t, fill=INK, font=font("sans", 28))
        yy += 55
deck.custom("12_lagging_strand_detail", lagging_detail)


# 13 — proofreading + telomeres
def proofreading_telomeres(img, d):
    d.text((110, 60), "Proofreading  +  telomeres.",
           fill=MAROON, font=font("serif_bold", 60))

    # Left card: proofreading
    lx, ly = 110, 200
    lw, lh = 870, 740
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=22,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((lx + 30, ly + 20), "PROOFREADING", fill=ACCENT,
           font=font("sans_bold", 40))
    d.text((lx + 30, ly + 80),
           "DNA polymerase has built-in",
           fill=INK, font=font("sans", 28))
    d.text((lx + 30, ly + 120),
           "3′ → 5′ exonuclease activity.",
           fill=MAROON_DARK, font=font("mono", 32))
    d.text((lx + 30, ly + 180),
           "Catches mismatches AS it builds.",
           fill=INK, font=font("sans", 28))

    # Diagram: a strand with one wrong base flagged
    bx = lx + 50
    by = ly + 280
    d.line([(bx, by + 60), (bx + 770, by + 60)],
           fill=MAROON_DARK, width=6)
    template = ["T", "A", "C", "G", "G", "A", "T", "C"]
    bf = font("mono", 32)
    for i, b in enumerate(template):
        tx = bx + 40 + i * 90
        d.text((tx, by + 25), b, fill=MAROON_DARK, font=bf)
    new = ["A", "T", "G", "C", "T", "T", "A", "?"]
    for i, b in enumerate(new):
        tx = bx + 40 + i * 90
        color = RED if i == 4 else ACCENT
        d.rectangle([tx - 6, by - 35, tx + 36, by + 10],
                    fill=color, outline=MAROON_DARK, width=2)
        tw = d.textlength(b, font=bf)
        d.text((tx + 14 - tw / 2, by - 30), b, fill=CREAM, font=bf)
    d.text((lx + 30, by + 130),
           "Pol backs up  →  removes wrong base  →  reinserts the right one.",
           fill=MAROON_DARK, font=font("sans_bold", 24))

    # Big stat
    d.rounded_rectangle([lx + 30, ly + 540, lx + lw - 30, ly + 700],
                        radius=18, outline=ACCENT, width=5, fill=ACCENT_LT)
    centered_x = lx + lw // 2
    rate = "~ 1 error per 10⁹ bases"
    rf = font("serif_bold", 50)
    twr = d.textlength(rate, font=rf)
    d.text((centered_x - twr / 2, ly + 565), rate,
           fill=MAROON_DARK, font=rf)
    centered(d, "after polymerase proofreading.",
             font("sans", 30), ly + 640, INK)

    # Right card: telomeres
    rx = lx + lw + 30
    rw = W - 110 - rx
    rh = lh
    d.rounded_rectangle([rx, ly, rx + rw, ly + rh], radius=22,
                        outline=MAROON, width=5, fill=CARD)
    d.text((rx + 30, ly + 20), "TELOMERES", fill=MAROON_DARK,
           font=font("sans_bold", 40))
    d.text((rx + 30, ly + 80),
           "Linear chromosome ends.",
           fill=INK, font=font("sans", 28))
    d.text((rx + 30, ly + 130),
           "Repeating sequence:  T T A G G G  (human).",
           fill=MAROON_DARK, font=font("mono", 28))

    # Three "generations" of the chromosome, each shorter
    bxr = rx + 50
    byr = ly + 240
    chrom_x_start = bxr
    chrom_y = byr
    for i in range(3):
        length = 700 - i * 60
        d.rectangle([chrom_x_start + (700 - length) // 2,
                     chrom_y + i * 60,
                     chrom_x_start + (700 - length) // 2 + length,
                     chrom_y + i * 60 + 30],
                    fill=ACCENT_LT, outline=MAROON_DARK, width=3)
        d.rectangle([chrom_x_start + (700 - length) // 2,
                     chrom_y + i * 60,
                     chrom_x_start + (700 - length) // 2 + 30,
                     chrom_y + i * 60 + 30],
                    fill=RED, outline=MAROON_DARK, width=3)
        d.rectangle([chrom_x_start + (700 - length) // 2 + length - 30,
                     chrom_y + i * 60,
                     chrom_x_start + (700 - length) // 2 + length,
                     chrom_y + i * 60 + 30],
                    fill=RED, outline=MAROON_DARK, width=3)
        d.text((chrom_x_start + 720, chrom_y + i * 60 + 2),
               f"div {i + 1}", fill=MUTED, font=font("sans", 22))

    d.text((rx + 30, ly + 460),
           "End replication problem:",
           fill=MAROON_DARK, font=font("sans_bold", 30))
    d.text((rx + 30, ly + 500),
           "Lagging strand can't fully complete its end  →  shortens each division.",
           fill=INK, font=font("sans", 24))

    d.rounded_rectangle([rx + 30, ly + 560, rx + rw - 30, ly + 700],
                        radius=18, outline=MAROON, width=5, fill=ACCENT_LT)
    d.text((rx + 50, ly + 580), "TELOMERASE", fill=MAROON_DARK,
           font=font("sans_bold", 34))
    d.text((rx + 50, ly + 625),
           "carries its own RNA template  →  extends telomeres.",
           fill=INK, font=font("sans", 24))
    d.text((rx + 50, ly + 660),
           "Active in germ + stem cells.  Reactivated in most cancers.",
           fill=MAROON_DARK, font=font("sans_bold", 24))
deck.custom("13_proofreading_telomeres", proofreading_telomeres)


# 14 — compare: Pol III vs Pol I vs Ligase
def compare_traps(img, d):
    d.text((110, 70), "Three enzymes  —  three jobs.  Don't mix them up.",
           fill=MAROON, font=font("serif_bold", 48))

    cols = [
        ("DNA Pol III", "the workhorse",
         ["Bulk DNA synthesis.",
          "Both leading + lagging.",
          "Builds 5′ → 3′ from",
          "an existing 3′ OH.",
          "Also: 3′→5′ proofreading."],
         "SYNTHESIZE", ACCENT),
        ("DNA Pol I", "the cleanup",
         ["Removes RNA primers.",
          "Fills the gap with DNA.",
          "Also 5′ → 3′ synthesis.",
          "(Has 5′→3′ exonuclease",
          "to chew out the primer.)"],
         "REPLACE", MAROON),
        ("DNA Ligase", "the welder",
         ["Seals the NICK between",
          "two adjacent fragments.",
          "Forms the final",
          "phosphodiester bond.",
          "No nucleotide addition."],
         "SEAL", ACCENT),
    ]

    col_w = 540
    col_h = 620
    gap = 30
    start_x = (W - (col_w * 3 + gap * 2)) // 2
    y0 = 200
    for i, (name, sub, lines, foot, color) in enumerate(cols):
        x = start_x + i * (col_w + gap)
        d.rounded_rectangle([x, y0, x + col_w, y0 + col_h], radius=20,
                            outline=color, width=5, fill=CARD)
        d.text((x + 26, y0 + 24), name, fill=color,
               font=font("serif_bold", 44))
        d.text((x + 26, y0 + 90), sub, fill=MUTED,
               font=font("sans_bold", 28))
        ly = y0 + 170
        for ln in lines:
            d.text((x + 26, ly), ln, fill=INK, font=font("sans", 28))
            ly += 55
        d.rounded_rectangle([x + 26, y0 + col_h - 80,
                             x + col_w - 26, y0 + col_h - 26],
                            radius=12, fill=color)
        f_foot = font("sans_bold", 34)
        tw = d.textlength(foot, font=f_foot)
        d.text((x + col_w // 2 - tw / 2, y0 + col_h - 70),
               foot, fill=CREAM, font=f_foot)

    # Bottom trap warning
    d.rounded_rectangle([110, 870, W - 110, 980], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "AP trap:  the lagging strand is still built 5′ → 3′  ·  just in short backward chunks.",
             font("sans_bold", 32), 905, MAROON_DARK)
deck.custom("14_compare_traps", compare_traps)


# 15 — recap
deck.recap("15_recap", "Recap.", [
    "DNA = double helix, antiparallel.  A=T (2 H-bonds), G≡C (3 H-bonds).  Chargaff: %A=%T, %G=%C.",
    "Replication is semiconservative — Meselson & Stahl, 1958.",
    "Fork setup:  topoisomerase  →  helicase  →  SSBPs  →  primase  →  DNA Pol III.",
    "Leading = continuous toward fork.  Lagging = Okazaki fragments AWAY from fork.",
    "Pol I removes RNA primers + fills with DNA.  Ligase seals the nicks.",
    "Proofreading → ~1 error / 10⁹.  Telomeres shorten each division; telomerase rebuilds them.",
], assignment=[
    "1.  Given a template strand, write the complementary new strand and label 5′/3′.",
    "2.  Name the enzyme responsible for each step at the fork and what it does.",
])


# 16 — path
deck.path("16_path", [
    ("✓",  "Watch this lesson",        "(done!)"),
    ("1.", "Read OpenStax Biology",    "Chapter 14 — DNA Structure and Function"),
    ("2.", "Khan Academy AP Bio",      "Unit 6 problem sets — DNA structure + replication"),
    ("3.", "Assignment in dashboard",  "Enzyme order + leading/lagging strand questions"),
    ("4.", "Advisor check-in",         "If 5′→3′ directionality still feels confusing"),
], next_text="Next up:  Module 8 — Transcription and Translation.")


print("AP Biology Module 7 slides built.")
