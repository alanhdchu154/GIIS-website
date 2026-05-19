"""AP Biology · Module 9 — Biotechnology.

Teal (science) theme auto-resolved from "AP Biology". 16 slides total.
Heavy on customs for the molecular tool diagrams — restriction enzyme
cut + sticky ends, plasmid + recombinant DNA, gel electrophoresis ladder,
PCR overview + 3-step thermal cycler, Sanger + NGS, CRISPR mechanism.
Pause slide (10) is duplicated to 11 so the same image plays during both
Q and A sections.
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
deck = Deck(course="AP Biology", module_num=9, output_dir="slides", logo_path=LOGO)

ACCENT = deck.accent           # teal
ACCENT_LT = deck.accent_light  # light teal
CARD = deck.card_bg


# 01 — title
deck.title("01_title", "AP Biology",
           "Module 9 — Biotechnology",
           "Sample lesson  ·  ~8 minutes")


# 02 — hook: 1953 reading DNA → 2020 editing DNA
def hook(img, d):
    d.text((110, 70), "From reading the code to writing it.",
           fill=MAROON, font=font("serif_bold", 64))

    # Timeline arrow across the slide
    arrow_y = 540
    d.line([(220, arrow_y), (W - 220, arrow_y)],
           fill=MAROON_DARK, width=8)
    # Arrowhead
    d.polygon([
        (W - 220, arrow_y - 24),
        (W - 170, arrow_y),
        (W - 220, arrow_y + 24),
    ], fill=MAROON_DARK)

    # Left node: 1953 — Watson & Crick
    lx, ly = 200, 240
    lw, lh = 700, 460
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=24,
                        outline=ACCENT, width=6, fill=CARD)
    d.text((lx + 30, ly + 24), "1953", fill=MAROON,
           font=font("serif_bold", 72))
    d.text((lx + 30, ly + 120), "Watson + Crick",
           fill=MAROON_DARK, font=font("serif_bold", 44))
    d.text((lx + 30, ly + 190), "Figure out the structure of DNA.",
           fill=INK, font=font("sans", 30))
    d.text((lx + 30, ly + 240),
           "Humanity learns to READ the code.",
           fill=ACCENT, font=font("serif_bold", 32))

    # Mini double helix
    hx0 = lx + 30
    hy0 = ly + 320
    for i in range(7):
        x_off = int(math.sin(i * 0.9) * 30)
        d.ellipse([hx0 + i * 80 + x_off - 10, hy0 - 10,
                   hx0 + i * 80 + x_off + 10, hy0 + 10],
                  fill=ACCENT)
        d.ellipse([hx0 + i * 80 - x_off - 10, hy0 + 70,
                   hx0 + i * 80 - x_off + 10, hy0 + 90],
                  fill=MAROON)
        d.line([(hx0 + i * 80 + x_off, hy0),
                (hx0 + i * 80 - x_off, hy0 + 80)],
               fill=MAROON_DARK, width=2)

    # Right node: 2020 — Doudna & Charpentier
    rx = W - 200 - lw
    d.rounded_rectangle([rx, ly, rx + lw, ly + lh], radius=24,
                        outline=MAROON, width=6, fill=ACCENT_LT)
    d.text((rx + 30, ly + 24), "2020", fill=MAROON,
           font=font("serif_bold", 72))
    d.text((rx + 30, ly + 120), "Doudna + Charpentier",
           fill=MAROON_DARK, font=font("serif_bold", 42))
    d.text((rx + 30, ly + 190), "Nobel Prize — CRISPR-Cas9.",
           fill=INK, font=font("sans", 30))
    d.text((rx + 30, ly + 240),
           "Humanity learns to EDIT the code.",
           fill=MAROON, font=font("serif_bold", 32))

    # Mini scissors-on-DNA
    sx = rx + 60
    sy = hy0 + 30
    d.line([(sx, sy), (sx + 540, sy)], fill=INK, width=10)
    d.line([(sx, sy + 40), (sx + 540, sy + 40)], fill=INK, width=10)
    # Cut
    d.line([(sx + 260, sy - 30), (sx + 320, sy + 70)],
           fill=MAROON, width=8)
    d.line([(sx + 320, sy - 30), (sx + 260, sy + 70)],
           fill=MAROON, width=8)

    # Big arc label in the middle of arrow
    label = "67 years"
    lf = font("serif_bold", 56)
    tw = d.textlength(label, font=lf)
    # Pill background
    px = W // 2 - tw / 2 - 40
    d.rounded_rectangle([px, arrow_y - 50, px + tw + 80, arrow_y + 50],
                        radius=24, fill=MAROON, outline=MAROON_DARK, width=4)
    d.text((W // 2 - tw / 2, arrow_y - 36), label,
           fill=CREAM, font=lf)

    # Bottom punchline strip
    d.rounded_rectangle([110, 770, W - 110, 920], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Sixty-seven years from reading to writing the code of life.",
             font("serif_bold", 36), 800, MAROON_DARK)
    centered(d, "Everything in between — that arc — is what we call biotechnology.",
             font("sans", 30), 860, MUTED)
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "The toolkit — restriction enzymes, plasmids, gel, PCR, sequencing, CRISPR.",
    "How each tool actually works at the molecular level.",
    "Applications — medicine, agriculture, forensics, diagnostics — and the ethics.",
], footnote="By the end: you can explain how a COVID PCR test detects one viral molecule.")


# 04 — restriction enzymes (EcoRI cut + sticky ends)
def restriction_enzymes(img, d):
    d.text((110, 70), "Restriction enzymes  —  bacterial scissors.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 160),
           "Bacterial defense vs. viruses.  EcoRI recognizes GAATTC (palindromic) → cuts on a stagger → sticky ends.",
           fill=MUTED, font=font("sans", 26))

    # Top: DNA sequence with cut indicators
    sy = 250
    mf = font("mono", 56)
    centered(d, "5'  ...G A A T T C...  3'", mf, sy, INK)
    centered(d, "3'  ...C T T A A G...  5'", mf, sy + 80, INK)
    # Arrow indicators
    d.text((W // 2 - 240, sy - 60), "cut →", fill=MAROON_DARK,
           font=font("sans_bold", 30))
    d.text((W // 2 + 110, sy + 150), "← cut", fill=MAROON_DARK,
           font=font("sans_bold", 30))

    # Middle label
    y_mid = 470
    centered(d, "After the cut  —  sticky ends (AATT overhang):",
             font("serif_bold", 36), y_mid, MAROON)

    # Two fragment boxes
    lx, ly_box, lw, lh = 200, 550, 720, 200
    d.rounded_rectangle([lx, ly_box, lx + lw, ly_box + lh], radius=14,
                        outline=ACCENT, width=4, fill=CARD)
    d.text((lx + 30, ly_box + 30), "5'  ...G",
           fill=INK, font=font("mono", 44))
    d.text((lx + 30, ly_box + 100), "3'  ...C T T A A",
           fill=INK, font=font("mono", 44))
    d.text((lx + lw - 320, ly_box + 165), "overhang: AATT",
           fill=ACCENT, font=font("sans_bold", 24))

    rx = W - 200 - lw
    d.rounded_rectangle([rx, ly_box, rx + lw, ly_box + lh], radius=14,
                        outline=ACCENT, width=4, fill=CARD)
    d.text((rx + 30, ly_box + 30), "A A T T C...  3'",
           fill=INK, font=font("mono", 44))
    d.text((rx + 30, ly_box + 100), "G...  5'",
           fill=INK, font=font("mono", 44))
    d.text((rx + 30, ly_box + 165), "overhang: AATT",
           fill=ACCENT, font=font("sans_bold", 24))

    # Bottom punchline
    d.rounded_rectangle([110, 810, W - 110, 970], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Same enzyme on two pieces → matching sticky ends → they base-pair right back together.",
             font("serif_bold", 30), 840, MAROON_DARK)
    centered(d, "That is the chemistry that makes recombinant DNA possible.",
             font("serif_ital", 28), 895, MAROON)
deck.custom("04_restriction_enzymes", restriction_enzymes)


# 05 — plasmids + recombinant DNA
def plasmids_recombinant(img, d):
    d.text((110, 70), "Plasmids  +  ligase  =  recombinant DNA.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 160),
           "Plasmid: small circular bacterial DNA.  Carries antibiotic-resistance gene → selection marker.",
           fill=MUTED, font=font("sans", 26))

    # Left: the recipe steps
    lx, ly = 110, 240
    lw, lh = 870, 720
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((lx + 30, ly + 24), "THE RECIPE",
           fill=ACCENT, font=font("serif_bold", 44))

    steps = [
        ("1.", "Cut plasmid + gene of interest",
         "with the SAME restriction enzyme."),
        ("2.", "Sticky ends base-pair",
         "between plasmid and insert."),
        ("3.", "DNA ligase seals nicks",
         "with phosphodiester bonds."),
        ("4.", "Transform into bacteria",
         "via heat shock or electroporation."),
        ("5.", "Plate on antibiotic agar",
         "→ only cells with plasmid survive."),
    ]
    y = ly + 110
    for num, head, sub in steps:
        d.text((lx + 30, y), num, fill=MAROON,
               font=font("serif_bold", 40))
        d.text((lx + 100, y + 4), head, fill=INK,
               font=font("sans_bold", 28))
        d.text((lx + 100, y + 46), sub, fill=MUTED,
               font=font("sans", 24))
        y += 110

    # Right: plasmid diagram
    rx = lx + lw + 30
    rw = W - 110 - rx
    d.rounded_rectangle([rx, ly, rx + rw, ly + lh], radius=20,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    d.text((rx + 30, ly + 24), "PLASMID",
           fill=MAROON_DARK, font=font("serif_bold", 44))

    # Big circular plasmid
    p_cx = rx + rw // 2
    p_cy = ly + 360
    p_r = 200
    # Outer ring
    d.ellipse([p_cx - p_r, p_cy - p_r, p_cx + p_r, p_cy + p_r],
              outline=MAROON, width=10)
    d.ellipse([p_cx - p_r + 18, p_cy - p_r + 18,
               p_cx + p_r - 18, p_cy + p_r - 18],
              outline=MAROON_DARK, width=4)

    # Inserted gene segment (highlighted arc)
    bbox = [p_cx - p_r + 8, p_cy - p_r + 8,
            p_cx + p_r - 8, p_cy + p_r - 8]
    d.arc(bbox, start=300, end=60, fill=ACCENT, width=24)
    d.text((p_cx + 110, p_cy - 220), "insert",
           fill=ACCENT, font=font("sans_bold", 30))

    # AmpR resistance segment
    d.arc(bbox, start=120, end=180, fill=MAROON, width=24)
    d.text((p_cx - 260, p_cy + 90), "AmpR",
           fill=MAROON, font=font("sans_bold", 30))

    # Ori
    d.arc(bbox, start=210, end=240, fill=MAROON_DARK, width=18)
    d.text((p_cx - 200, p_cy + 200), "ori",
           fill=MAROON_DARK, font=font("sans_bold", 26))

    # Bottom caption
    d.text((rx + 30, ly + lh - 80),
           "Antibiotic-resistance gene =",
           fill=MAROON_DARK, font=font("sans_bold", 28))
    d.text((rx + 30, ly + lh - 44),
           "selection marker.",
           fill=MAROON_DARK, font=font("sans_bold", 28))

    # Bottom strip
    d.rounded_rectangle([110, 985, W - 110, 1045], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Recombinant DNA = foreign DNA inserted into a vector and copied inside a living cell.",
             font("sans_bold", 26), 1003, MAROON_DARK)
deck.custom("05_plasmids_recombinant", plasmids_recombinant)


# 06 — gel electrophoresis
def gel_electrophoresis(img, d):
    d.text((110, 70), "Gel electrophoresis  —  separating by size.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 160),
           "DNA backbone is NEGATIVELY charged (phosphate groups) → migrates toward + electrode.  Smaller = faster.",
           fill=MUTED, font=font("sans", 26))

    # Left: gel diagram
    gx, gy = 200, 260
    gw, gh = 800, 680
    d.rounded_rectangle([gx, gy, gx + gw, gy + gh], radius=18,
                        outline=MAROON_DARK, width=5, fill=ACCENT_LT)
    # Electrodes
    d.rectangle([gx - 60, gy + 40, gx - 20, gy + gh - 40],
                fill=INK, outline=MAROON_DARK, width=3)
    d.text((gx - 60, gy - 30), "−", fill=INK, font=font("serif_bold", 56))
    d.rectangle([gx + gw + 20, gy + 40, gx + gw + 60, gy + gh - 40],
                fill=MAROON, outline=MAROON_DARK, width=3)
    d.text((gx + gw + 30, gy - 30), "+", fill=MAROON, font=font("serif_bold", 56))

    # Wells at top
    well_w = 80
    well_count = 5
    well_gap = 60
    total_w = well_count * well_w + (well_count - 1) * well_gap
    start_w = gx + (gw - total_w) // 2
    for i in range(well_count):
        wx = start_w + i * (well_w + well_gap)
        d.rectangle([wx, gy + 20, wx + well_w, gy + 70],
                    fill=CARD, outline=MAROON_DARK, width=3)

    # Bands — smaller fragments travel farther
    ladder_positions = [110, 180, 270, 380, 510, 600]
    for i in range(well_count):
        wx = start_w + i * (well_w + well_gap)
        cx_band = wx + well_w // 2
        if i == 0:
            for bp in ladder_positions:
                d.rectangle([cx_band - 38, gy + bp,
                             cx_band + 38, gy + bp + 14],
                            fill=MAROON_DARK)
        elif i == 1:
            d.rectangle([cx_band - 38, gy + 130,
                         cx_band + 38, gy + 148],
                        fill=ACCENT)
        elif i == 2:
            d.rectangle([cx_band - 38, gy + 180,
                         cx_band + 38, gy + 198],
                        fill=ACCENT)
            d.rectangle([cx_band - 38, gy + 380,
                         cx_band + 38, gy + 398],
                        fill=ACCENT)
        elif i == 3:
            d.rectangle([cx_band - 38, gy + 510,
                         cx_band + 38, gy + 528],
                        fill=ACCENT)
        elif i == 4:
            pass

    label_lanes = ["ladder", "large", "two", "small", "ctrl"]
    for i, lbl in enumerate(label_lanes):
        wx = start_w + i * (well_w + well_gap)
        cx_band = wx + well_w // 2
        lf = font("sans_bold", 22)
        tw = d.textlength(lbl, font=lf)
        d.text((cx_band - tw / 2, gy + gh - 30), lbl,
               fill=MAROON_DARK, font=lf)

    size_labels = ["10 kb", "5 kb", "2 kb", "1 kb", "500 bp", "200 bp"]
    for bp, lbl in zip(ladder_positions, size_labels):
        d.text((gx + 20, gy + bp - 6), lbl, fill=MUTED,
               font=font("sans_bold", 22))

    # Right: explainer card
    rx, ry = 1080, 260
    rw, rh = 740, 680
    d.rounded_rectangle([rx, ry, rx + rw, ry + rh], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((rx + 30, ry + 24), "Why it works",
           fill=ACCENT, font=font("serif_bold", 44))
    d.text((rx + 30, ry + 120),
           "DNA backbone has",
           fill=INK, font=font("sans", 28))
    d.text((rx + 30, ry + 155),
           "phosphate groups → ",
           fill=INK, font=font("sans", 28))
    d.text((rx + 30, ry + 190),
           "NEGATIVELY charged.",
           fill=MAROON, font=font("sans_bold", 28))

    d.text((rx + 30, ry + 260),
           "Apply current →",
           fill=MAROON_DARK, font=font("sans_bold", 28))
    d.text((rx + 30, ry + 300),
           "DNA moves to + pole.",
           fill=INK, font=font("sans", 28))

    d.text((rx + 30, ry + 380),
           "Agarose gel = mesh.",
           fill=MAROON_DARK, font=font("sans_bold", 28))
    d.text((rx + 30, ry + 420),
           "Small fragments slip",
           fill=INK, font=font("sans", 28))
    d.text((rx + 30, ry + 455),
           "through easily (FAST).",
           fill=INK, font=font("sans", 28))
    d.text((rx + 30, ry + 495),
           "Large fragments lag.",
           fill=INK, font=font("sans", 28))

    d.text((rx + 30, ry + 580),
           "Result: bands sorted",
           fill=ACCENT, font=font("serif_bold", 30))
    d.text((rx + 30, ry + 620),
           "by SIZE.",
           fill=ACCENT, font=font("serif_bold", 30))

    # Bottom strip
    d.rounded_rectangle([110, 960, W - 110, 1030], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Check restriction digests · check PCR products · prep DNA fingerprinting.",
             font("sans_bold", 26), 980, MAROON_DARK)
deck.custom("06_gel_electrophoresis", gel_electrophoresis)


# 07 — PCR overview: Mullis + exponential growth
def pcr_overview(img, d):
    d.text((110, 70), "PCR  —  amplify a target exponentially.",
           fill=MAROON, font=font("serif_bold", 56))

    # Top strip: who & when
    d.rounded_rectangle([110, 170, W - 110, 280], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    d.text((140, 195), "Kary Mullis",
           fill=MAROON_DARK, font=font("serif_bold", 44))
    d.text((140, 245), "Invented PCR — 1985.   Nobel Prize in Chemistry — 1993.",
           fill=INK, font=font("sans_bold", 28))

    # Doubling chart
    lx, ly = 110, 320
    lw, lh = 1080, 640
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((lx + 30, ly + 24), "Copies after each cycle (log scale)",
           fill=MAROON_DARK, font=font("sans_bold", 30))

    # Axes
    gx0 = lx + 100
    gy0 = ly + 560
    gx1 = lx + lw - 50
    gy1 = ly + 100
    d.line([(gx0, gy1), (gx0, gy0)], fill=MAROON_DARK, width=4)
    d.line([(gx0, gy0), (gx1, gy0)], fill=MAROON_DARK, width=4)
    d.text((lx + 20, ly + 80), "copies", fill=MAROON_DARK,
           font=font("sans_bold", 22))
    d.text((gx1 - 80, gy0 + 14), "cycles →", fill=MAROON_DARK,
           font=font("sans_bold", 22))

    n_cycles = 30
    x_ticks = [0, 5, 10, 15, 20, 25, 30]
    span_x = gx1 - gx0
    for c in x_ticks:
        px = gx0 + int(c / n_cycles * span_x)
        d.line([(px, gy0), (px, gy0 + 12)], fill=MAROON_DARK, width=3)
        lab = str(c)
        tf = font("sans_bold", 22)
        tw = d.textlength(lab, font=tf)
        d.text((px - tw / 2, gy0 + 20), lab,
               fill=MAROON_DARK, font=tf)

    y_labels = ["1", "10", "10²", "10⁴", "10⁶", "10⁸", "10⁹"]
    y_vals = [0, 1, 2, 4, 6, 8, 9]
    max_log = 9.0
    span_y = gy0 - gy1
    for lab, v in zip(y_labels, y_vals):
        py = gy0 - int(v / max_log * span_y)
        d.line([(gx0 - 10, py), (gx0, py)], fill=MAROON_DARK, width=3)
        tf = font("sans_bold", 22)
        tw = d.textlength(lab, font=tf)
        d.text((gx0 - 20 - tw, py - 14), lab,
               fill=MAROON_DARK, font=tf)

    # Plot 2^n
    prev = None
    for c in range(n_cycles + 1):
        copies_log = c * math.log10(2)
        px = gx0 + int(c / n_cycles * span_x)
        py = gy0 - int(copies_log / max_log * span_y)
        if prev is not None:
            d.line([prev, (px, py)], fill=ACCENT, width=5)
        d.ellipse([px - 5, py - 5, px + 5, py + 5], fill=MAROON)
        prev = (px, py)

    # Annotations
    c = 30
    px = gx0 + int(c / n_cycles * span_x)
    py = gy0 - int((c * math.log10(2)) / max_log * span_y)
    d.text((px - 320, py - 70), "30 cycles → ~10⁹ copies",
           fill=MAROON, font=font("serif_bold", 32))

    # Formula in corner
    d.rounded_rectangle([lx + 130, ly + 130, lx + 500, ly + 240],
                        radius=16, fill=ACCENT_LT, outline=MAROON, width=4)
    d.text((lx + 160, ly + 150), "copies = 2ⁿ",
           fill=MAROON_DARK, font=font("mono", 44))
    d.text((lx + 160, ly + 200), "n = number of cycles",
           fill=MUTED, font=font("sans", 24))

    # Bottom strip
    d.rounded_rectangle([110, 985, W - 110, 1045], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "From 1 starting molecule to ~1 billion copies in about 2 hours.",
             font("sans_bold", 26), 1003, MAROON_DARK)
deck.custom("07_pcr_overview", pcr_overview)


# 08 — PCR three steps
def pcr_three_steps(img, d):
    d.text((110, 70), "PCR  —  three temperatures, one cycle.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 160),
           "Each cycle ~doubles the target.  Taq polymerase from Thermus aquaticus.",
           fill=MUTED, font=font("sans", 28))

    steps = [
        ("1. DENATURE", "~95 °C", "DNA strands separate.",
         "Hydrogen bonds break.", ACCENT_LT),
        ("2. ANNEAL", "50–65 °C", "Primers bind template.",
         "Short DNA tags find their match.", ACCENT),
        ("3. EXTEND", "~72 °C", "Taq builds new strand.",
         "Heat-stable polymerase from\nThermus aquaticus.", ACCENT_LT),
    ]
    card_w = 540
    card_h = 540
    gap = 40
    start_x = (W - (card_w * 3 + gap * 2)) // 2
    y0 = 240
    for i, (label, temp, line1, line2, col) in enumerate(steps):
        x = start_x + i * (card_w + gap)
        d.rounded_rectangle([x, y0, x + card_w, y0 + card_h], radius=22,
                            outline=MAROON_DARK, width=5, fill=col)
        d.rectangle([x, y0, x + card_w, y0 + 80], fill=MAROON)
        lf = font("serif_bold", 40)
        tw = d.textlength(label, font=lf)
        d.text((x + card_w // 2 - tw / 2, y0 + 20), label,
               fill=CREAM, font=lf)

        tf = font("serif_bold", 96)
        tw_t = d.textlength(temp, font=tf)
        d.text((x + card_w // 2 - tw_t / 2, y0 + 110), temp,
               fill=MAROON_DARK, font=tf)

        body_y = y0 + 260
        bf = font("sans_bold", 30)
        lw_t = d.textlength(line1, font=bf)
        d.text((x + card_w // 2 - lw_t / 2, body_y), line1,
               fill=INK, font=bf)

        sf = font("sans", 26)
        l2_lines = line2.split("\n")
        sy = body_y + 60
        for ln in l2_lines:
            lw_t = d.textlength(ln, font=sf)
            d.text((x + card_w // 2 - lw_t / 2, sy), ln,
                   fill=MUTED, font=sf)
            sy += 38

        if i < 2:
            ax = x + card_w + 4
            ay = y0 + card_h // 2
            d.polygon([
                (ax, ay - 22),
                (ax + 32, ay),
                (ax, ay + 22),
            ], fill=MAROON)

    # Bottom strip
    d.rounded_rectangle([110, 830, W - 110, 990], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "WHY Taq?  Regular polymerase would denature at 95 °C — the reaction would die in cycle 1.",
             font("serif_bold", 28), 855, MAROON_DARK)
    centered(d, "Taq came from a bacterium in hot springs — that is why PCR exists.",
             font("serif_ital", 28), 905, MAROON)
    centered(d, "Each cycle ~doubles target.  30 cycles ≈ 10⁹-fold amplification.",
             font("sans_bold", 26), 950, MAROON_DARK)
deck.custom("08_pcr_three_steps", pcr_three_steps)


# 09 — DNA sequencing (Sanger + NGS)
def dna_sequencing(img, d):
    d.text((110, 70), "DNA sequencing  —  reading the actual bases.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 160),
           "Sanger (classic chain-termination) → next-gen sequencing (massively parallel).",
           fill=MUTED, font=font("sans", 28))

    # Left: Sanger
    lx, ly = 110, 240
    lw, lh = 870, 720
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((lx + 30, ly + 24), "SANGER SEQUENCING",
           fill=ACCENT, font=font("sans_bold", 40))
    d.text((lx + 30, ly + 90),
           "Frederick Sanger, 1977  ·  Nobel 1980.",
           fill=MAROON_DARK, font=font("sans_bold", 24))

    d.text((lx + 30, ly + 160),
           "Key trick:  ddNTPs",
           fill=MAROON_DARK, font=font("serif_bold", 38))
    d.text((lx + 30, ly + 220),
           "Dideoxynucleotides lack",
           fill=INK, font=font("sans", 26))
    d.text((lx + 30, ly + 255),
           "the 3'-OH group →",
           fill=INK, font=font("sans", 26))
    d.text((lx + 30, ly + 290),
           "polymerase CANNOT add",
           fill=INK, font=font("sans", 26))
    d.text((lx + 30, ly + 325),
           "the next nucleotide.",
           fill=INK, font=font("sans", 26))
    d.text((lx + 30, ly + 375),
           "Chain TERMINATES.",
           fill=MAROON, font=font("serif_bold", 32))

    # Mini ladder visual
    ladder_x = lx + 480
    ladder_y = ly + 160
    d.text((ladder_x, ladder_y - 5), "Fragments of every length:",
           fill=MAROON_DARK, font=font("sans_bold", 22))
    bases = ["A", "T", "G", "C", "A", "G", "T"]
    for i, b in enumerate(bases):
        bar_y = ladder_y + 50 + i * 38
        d.rectangle([ladder_x, bar_y, ladder_x + 80 + i * 25, bar_y + 22],
                    fill=ACCENT_LT, outline=MAROON_DARK, width=2)
        d.text((ladder_x + 85 + i * 25, bar_y - 4), b,
               fill=MAROON, font=font("mono", 26))
    d.text((ladder_x, ladder_y + 380),
           "Read bottom to top →",
           fill=MAROON_DARK, font=font("sans_bold", 22))
    d.text((ladder_x, ladder_y + 415),
           "A T G C A G T",
           fill=MAROON, font=font("mono", 30))

    # Right: NGS
    rx = lx + lw + 30
    rw = W - 110 - rx
    d.rounded_rectangle([rx, ly, rx + rw, ly + lh], radius=20,
                        outline=MAROON, width=5, fill=CARD)
    d.text((rx + 30, ly + 24), "NEXT-GEN SEQUENCING",
           fill=MAROON_DARK, font=font("sans_bold", 40))
    d.text((rx + 30, ly + 90),
           "MASSIVELY PARALLEL.",
           fill=MAROON, font=font("serif_bold", 32))
    d.text((rx + 30, ly + 150),
           "Millions of fragments",
           fill=INK, font=font("sans", 28))
    d.text((rx + 30, ly + 185),
           "read at the same time.",
           fill=INK, font=font("sans", 28))

    # Grid of mini reads
    grid_x = rx + 30
    grid_y = ly + 270
    cols = 6
    rows = 8
    cw_grid = 100
    ch_grid = 14
    gap_g = 6
    for r in range(rows):
        for c in range(cols):
            px = grid_x + c * (cw_grid + gap_g)
            py = grid_y + r * (ch_grid + gap_g)
            col_choice = ACCENT if (r + c) % 2 == 0 else ACCENT_LT
            d.rectangle([px, py, px + cw_grid, py + ch_grid],
                        fill=col_choice)
    d.text((rx + 30, grid_y + rows * (ch_grid + gap_g) + 20),
           "Cost: $3B (2003) → < $1,000 today.",
           fill=MAROON_DARK, font=font("sans_bold", 26))
    d.text((rx + 30, grid_y + rows * (ch_grid + gap_g) + 60),
           "Used for: whole-genome,",
           fill=INK, font=font("sans", 24))
    d.text((rx + 30, grid_y + rows * (ch_grid + gap_g) + 90),
           "cancer panels, COVID variants.",
           fill=INK, font=font("sans", 24))

    # Bottom strip
    d.rounded_rectangle([110, 990, W - 110, 1050], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Sanger: read ONE region accurately.   NGS: read EVERYTHING at once.",
             font("sans_bold", 26), 1006, MAROON_DARK)
deck.custom("09_dna_sequencing", dna_sequencing)


# 10 — pause + try (Taq + PCR question)
deck.pause("10_pause1", "PAUSE  &  TRY",
           "Tiny drop of blood at a crime scene — just a few cells.  What amplifies it?  What gives Taq its key property?",
           "PCR  +  Taq  =  ?",
           hint="Pause now. Solve it. Press play when you're ready.")

# 11 — duplicate for the answer-reveal section
deck.duplicate("10_pause1", "11_pause1_silence")


# 12 — CRISPR-Cas9 mechanism
def crispr_cas9(img, d):
    d.text((110, 70), "CRISPR-Cas9  —  programmable scissors.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 160),
           "Bacterial defense vs. viruses → adapted as a genome-editing tool.  Doudna + Charpentier · Nobel 2020.",
           fill=MUTED, font=font("sans", 26))

    # Stage 1: target
    s1x = 110
    s1y = 250
    s1w = 580
    s1h = 700
    d.rounded_rectangle([s1x, s1y, s1x + s1w, s1y + s1h], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((s1x + 20, s1y + 20), "1.  Target",
           fill=ACCENT, font=font("serif_bold", 42))

    cx, cy = s1x + s1w // 2, s1y + 280
    d.ellipse([cx - 130, cy - 100, cx + 130, cy + 100],
              fill=ACCENT_LT, outline=MAROON_DARK, width=5)
    d.text((cx - 40, cy - 20), "Cas9",
           fill=MAROON_DARK, font=font("serif_bold", 40))

    d.line([(cx, cy + 100), (cx, cy + 200)], fill=MAROON, width=8)
    d.text((cx + 20, cy + 130), "gRNA",
           fill=MAROON, font=font("sans_bold", 28))

    dna_y = cy + 240
    d.rectangle([s1x + 40, dna_y, s1x + s1w - 40, dna_y + 20],
                fill=INK)
    d.rectangle([s1x + 40, dna_y + 40, s1x + s1w - 40, dna_y + 60],
                fill=INK)
    d.text((s1x + 20, dna_y + 90), "target DNA",
           fill=MAROON_DARK, font=font("sans_bold", 24))

    d.text((s1x + 20, s1y + s1h - 60),
           "gRNA finds complementary sequence.",
           fill=MUTED, font=font("serif_ital", 24))

    # Stage 2: cut
    s2x = s1x + s1w + 20
    s2y = s1y
    s2w = 580
    s2h = 700
    d.rounded_rectangle([s2x, s2y, s2x + s2w, s2y + s2h], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((s2x + 20, s2y + 20), "2.  Cut",
           fill=ACCENT, font=font("serif_bold", 42))

    dna_y2 = s2y + 350
    d.rectangle([s2x + 40, dna_y2, s2x + s2w // 2 - 30, dna_y2 + 20],
                fill=INK)
    d.rectangle([s2x + s2w // 2 + 30, dna_y2, s2x + s2w - 40, dna_y2 + 20],
                fill=INK)
    d.rectangle([s2x + 40, dna_y2 + 40, s2x + s2w // 2 - 30, dna_y2 + 60],
                fill=INK)
    d.rectangle([s2x + s2w // 2 + 30, dna_y2 + 40, s2x + s2w - 40, dna_y2 + 60],
                fill=INK)
    d.line([(s2x + s2w // 2 - 50, dna_y2 - 40),
            (s2x + s2w // 2 + 50, dna_y2 + 100)],
           fill=MAROON, width=8)
    d.line([(s2x + s2w // 2 + 50, dna_y2 - 40),
            (s2x + s2w // 2 - 50, dna_y2 + 100)],
           fill=MAROON, width=8)
    d.text((s2x + 20, dna_y2 + 100),
           "DOUBLE-STRAND BREAK",
           fill=MAROON, font=font("serif_bold", 30))

    d.text((s2x + 20, s2y + s2h - 60),
           "Cas9 cuts both strands.",
           fill=MUTED, font=font("serif_ital", 24))

    # Stage 3: repair
    s3x = s2x + s2w + 20
    s3y = s1y
    s3w = W - 110 - s3x
    s3h = 700
    d.rounded_rectangle([s3x, s3y, s3x + s3w, s3y + s3h], radius=20,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    d.text((s3x + 20, s3y + 20), "3.  Repair",
           fill=MAROON_DARK, font=font("serif_bold", 42))

    d.text((s3x + 20, s3y + 130),
           "Cell repairs the cut:",
           fill=INK, font=font("sans_bold", 26))

    d.rounded_rectangle([s3x + 20, s3y + 200, s3x + s3w - 20, s3y + 380],
                        radius=14, fill=CARD, outline=ACCENT, width=4)
    d.text((s3x + 40, s3y + 220), "A. Knock OUT",
           fill=ACCENT, font=font("serif_bold", 30))
    d.text((s3x + 40, s3y + 270),
           "NHEJ — sloppy join.",
           fill=INK, font=font("sans", 24))
    d.text((s3x + 40, s3y + 305),
           "Indels → gene broken.",
           fill=INK, font=font("sans", 24))

    d.rounded_rectangle([s3x + 20, s3y + 410, s3x + s3w - 20, s3y + 600],
                        radius=14, fill=CARD, outline=MAROON, width=4)
    d.text((s3x + 40, s3y + 430), "B. Knock IN",
           fill=MAROON, font=font("serif_bold", 30))
    d.text((s3x + 40, s3y + 480),
           "HDR + template →",
           fill=INK, font=font("sans", 24))
    d.text((s3x + 40, s3y + 515),
           "paste a new sequence.",
           fill=INK, font=font("sans", 24))
    d.text((s3x + 40, s3y + 552),
           "Correct disease genes.",
           fill=MAROON_DARK, font=font("sans_bold", 22))

    d.rounded_rectangle([110, 980, W - 110, 1050], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Cas9 makes the cut — the CELL does the repair. CRISPR is the scissors, not the result.",
             font("sans_bold", 26), 998, MAROON_DARK)
deck.custom("12_crispr_cas9", crispr_cas9)


# 13 — applications (medicine + agriculture + forensics + diagnostics)
def applications(img, d):
    d.text((110, 70), "Applications  —  the toolkit in the wild.",
           fill=MAROON, font=font("serif_bold", 56))

    domains = [
        ("MEDICINE", ACCENT, [
            ("Recombinant insulin (1982)",
             "1st FDA-approved biotech drug."),
            ("Gene therapy",
             "Cures some forms of SCID."),
            ("CRISPR trials",
             "Sickle-cell, beta-thalassemia."),
        ]),
        ("AGRICULTURE", MAROON, [
            ("Bt corn",
             "Bacterial gene kills caterpillars."),
            ("Roundup-Ready soy",
             "Glyphosate-tolerant crops."),
            ("Golden Rice",
             "β-carotene → fights vit. A deficiency."),
        ]),
        ("FORENSICS", ACCENT, [
            ("STR markers",
             "Short tandem repeats vary per person."),
            ("CODIS database",
             "FBI matches DNA profiles nationwide."),
            ("PCR amplifies trace DNA",
             "→ usable evidence from few cells."),
        ]),
        ("DIAGNOSTICS", MAROON, [
            ("HIV",
             "PCR detects viral RNA directly."),
            ("COVID-19",
             "RT-PCR from a nasal swab."),
            ("Prenatal screening",
             "Cell-free fetal DNA from mom's blood."),
        ]),
    ]

    card_w = 850
    card_h = 380
    gap_x = 30
    gap_y = 20
    start_x = (W - (card_w * 2 + gap_x)) // 2
    y0 = 200
    for i, (name, color, items) in enumerate(domains):
        col = i % 2
        row = i // 2
        bx = start_x + col * (card_w + gap_x)
        by = y0 + row * (card_h + gap_y)
        d.rounded_rectangle([bx, by, bx + card_w, by + card_h],
                            radius=20, outline=color, width=5,
                            fill=CARD)
        # Title strip
        d.rectangle([bx, by, bx + card_w, by + 64], fill=color)
        d.text((bx + 24, by + 14), name,
               fill=CREAM, font=font("sans_bold", 36))

        ly_item = by + 90
        for head, sub in items:
            # Bullet
            d.ellipse([bx + 28, ly_item + 16, bx + 44, ly_item + 32],
                      fill=color)
            d.text((bx + 60, ly_item + 4), head,
                   fill=MAROON_DARK, font=font("sans_bold", 26))
            d.text((bx + 60, ly_item + 42), sub,
                   fill=INK, font=font("sans", 22))
            ly_item += 90

    # Bottom strip
    d.rounded_rectangle([110, 985, W - 110, 1050], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Same toolkit — different question — different field.",
             font("sans_bold", 28), 1004, MAROON_DARK)
deck.custom("13_applications", applications)


# 14 — compare traps: germline vs somatic + gel separates by size
deck.compare("14_compare_traps",
             "Common traps  —  what students mix up.",
             left={"label": "GERMLINE edit",
                   "color": MAROON,
                   "lines": [
                       "Changes sperm or egg DNA.",
                       "",
                       "Heritable — passes to every",
                       "future generation.",
                       "",
                       "Banned for human clinical",
                       "use in most countries.",
                       "",
                       "Ethics: consent for unborn",
                       "generations, equity.",
                   ],
                   "footnote": "Permanent across the species line."},
             right={"label": "SOMATIC edit",
                    "color": ACCENT,
                    "lines": [
                        "Changes body cells only.",
                        "",
                        "Stops with the patient —",
                        "not inherited.",
                        "",
                        "Sickle-cell CRISPR trials",
                        "are somatic.",
                        "",
                        "Also: gel separates by SIZE,",
                        "NOT by sequence.",
                    ],
                    "footnote": "Different ethics — different rules."})


# 15 — recap + ethics in the assignment box
deck.recap("15_recap", "Recap.", [
    "Restriction enzymes cut at palindromic sites (EcoRI → GAATTC, sticky ends); ligase seals; plasmids carry inserts.",
    "Gel electrophoresis: DNA is negative → moves to +; smaller fragments travel farther.",
    "PCR: 95 °C denature → 50–65 °C anneal → 72 °C extend with Taq. 30 cycles ≈ 10⁹ copies.",
    "Sanger uses ddNTPs (chain terminators). NGS reads millions of fragments in parallel.",
    "CRISPR-Cas9: gRNA + Cas9 → double-strand cut; cell repair knocks out or inserts.",
    "Applications: insulin, gene therapy, sickle-cell CRISPR, Bt corn, Golden Rice, CODIS, COVID PCR.",
], assignment=[
    "Ethics to know:  germline edits & consent for future generations  ·  equity of access",
    "Patent law (Myriad BRCA case)  ·  GMO ecological release  ·  genetic privacy.",
])


# 16 — path
deck.path("16_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Biology",   "Chapter 17 — biotechnology tools and applications"),
    ("2.", "Khan Academy AP Bio",     "Unit 6 problem sets — biotech, PCR, gel, CRISPR"),
    ("3.", "Assignment in dashboard", "PCR cycle diagram + COVID test explanation"),
    ("4.", "Advisor check-in",        "If PCR steps or the CRISPR mechanism still feel fuzzy"),
], next_text="Next up:  Module 10 — Natural Selection and Evolution  (Unit 7 begins).")


print("AP Biology Module 9 slides built.")
