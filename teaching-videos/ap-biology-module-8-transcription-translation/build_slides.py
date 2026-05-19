"""AP Biology · Module 8 — Gene Expression: Transcription and Translation.

Teal (science) theme auto-resolved from "AP Biology". 16 slides total.
Heavy on customs because the central dogma flow, mRNA processing, the
ribosome A/P/E sites, the codon table, lac/trp operons, and the
silent/missense/nonsense/frameshift compare each need real diagrams.
Pause slide (10) is duplicated to 11 so the same image plays during
both Q and A.
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
deck = Deck(course="AP Biology", module_num=8, output_dir="slides", logo_path=LOGO)

ACCENT = deck.accent           # teal
ACCENT_LT = deck.accent_light  # light teal
CARD = deck.card_bg


# ────────────────────────────────────────────────────────────────────────
# 01 — title
# ────────────────────────────────────────────────────────────────────────
deck.title("01_title", "AP Biology",
           "Module 8 — Gene Expression: Transcription and Translation",
           "Sample lesson  ·  ~9 minutes")


# ────────────────────────────────────────────────────────────────────────
# 02 — hook: central dogma sketch + "one gene, all the difference"
# ────────────────────────────────────────────────────────────────────────
def hook(img, d):
    d.text((110, 70), "Crick's one-page sketch.  1958.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 150),
           "DNA  →  RNA  →  Protein.  The arrow that builds every cell type in you.",
           fill=MUTED, font=font("sans", 30))

    # Central dogma flow — three boxes with arrows
    box_y = 280
    box_h = 180
    box_w = 380
    gap = 80
    total_w = box_w * 3 + gap * 2
    start_x = (W - total_w) // 2

    labels = [
        ("DNA",     "the master copy",     "(in nucleus)",        MAROON_DARK),
        ("mRNA",    "the working copy",    "(transcription)",     ACCENT),
        ("PROTEIN", "the doer",            "(translation)",       MAROON_DARK),
    ]
    for i, (head, sub, mech, color) in enumerate(labels):
        x = start_x + i * (box_w + gap)
        d.rounded_rectangle([x, box_y, x + box_w, box_y + box_h],
                            radius=22, outline=color, width=6, fill=CARD)
        hf = font("serif_bold", 64)
        tw = d.textlength(head, font=hf)
        d.text((x + box_w // 2 - tw / 2, box_y + 22), head,
               fill=color, font=hf)
        sf = font("sans", 28)
        tw = d.textlength(sub, font=sf)
        d.text((x + box_w // 2 - tw / 2, box_y + 100), sub,
               fill=INK, font=sf)
        mf = font("serif_ital", 24)
        tw = d.textlength(mech, font=mf)
        d.text((x + box_w // 2 - tw / 2, box_y + 138), mech,
               fill=MUTED, font=mf)
        # Arrow to next box
        if i < 2:
            ax = x + box_w + 12
            ay = box_y + box_h // 2
            d.polygon([
                (ax, ay - 18),
                (ax + gap - 24, ay - 18),
                (ax + gap - 24, ay - 30),
                (ax + gap - 4,  ay),
                (ax + gap - 24, ay + 30),
                (ax + gap - 24, ay + 18),
                (ax, ay + 18),
            ], fill=ACCENT)

    # Punchline strip
    d.rounded_rectangle([110, 560, W - 110, 720], radius=22,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    centered(d, "Same DNA in every cell  ·  different proteins made  ·  different cell types.",
             font("serif_bold", 38), 595, MAROON_DARK)
    centered(d, "One gene  →  one protein  →  the difference between eye and bone.",
             font("sans_bold", 32), 660, MAROON_DARK)

    # Footer attribution
    d.text((110, 780),
           "Crick (1958) — \"The Central Dogma of Molecular Biology.\"",
           fill=MUTED, font=font("serif_ital", 28))
    d.text((110, 830),
           "Same letters.  Different proteins.  Different you.",
           fill=ACCENT, font=font("sans_bold", 32))
deck.custom("02_hook", hook)


# ────────────────────────────────────────────────────────────────────────
# 03 — overview
# ────────────────────────────────────────────────────────────────────────
deck.overview("03_overview", "Game plan.", [
    "Transcription + mRNA processing  —  DNA copied and edited.",
    "Translation  —  ribosomes + codons + tRNAs build the protein.",
    "Regulation + mutations  —  which genes get used, and what breaks.",
], footnote="By the end: you can read any mRNA and translate it.")


# ────────────────────────────────────────────────────────────────────────
# 04 — central dogma (full diagram with reverse transcription exception)
# ────────────────────────────────────────────────────────────────────────
def central_dogma(img, d):
    d.text((110, 70), "The central dogma — and one exception.",
           fill=MAROON, font=font("serif_bold", 56))

    # Three big boxes again, but with reverse arrow
    box_y = 260
    box_h = 200
    box_w = 420
    gap = 100
    total_w = box_w * 3 + gap * 2
    start_x = (W - total_w) // 2

    boxes = [
        ("DNA",  "stores info.",          "double helix  ·  in nucleus"),
        ("mRNA", "carries info out.",     "single strand  ·  U instead of T"),
        ("PROTEIN", "does the work.",     "folded chain of amino acids"),
    ]
    arrows = ["transcription", "translation"]

    box_xs = []
    for i, (head, sub, detail) in enumerate(boxes):
        x = start_x + i * (box_w + gap)
        box_xs.append(x)
        d.rounded_rectangle([x, box_y, x + box_w, box_y + box_h],
                            radius=22, outline=ACCENT, width=6, fill=CARD)
        hf = font("serif_bold", 72)
        tw = d.textlength(head, font=hf)
        d.text((x + box_w // 2 - tw / 2, box_y + 20), head,
               fill=MAROON_DARK, font=hf)
        sf = font("sans_bold", 32)
        tw = d.textlength(sub, font=sf)
        d.text((x + box_w // 2 - tw / 2, box_y + 110), sub,
               fill=INK, font=sf)
        df = font("serif_ital", 26)
        tw = d.textlength(detail, font=df)
        d.text((x + box_w // 2 - tw / 2, box_y + 155), detail,
               fill=MUTED, font=df)

    # Forward arrows with labels
    for i, label in enumerate(arrows):
        ax = box_xs[i] + box_w + 8
        ay = box_y + box_h // 2
        d.polygon([
            (ax, ay - 14),
            (ax + gap - 28, ay - 14),
            (ax + gap - 28, ay - 28),
            (ax + gap - 6,  ay),
            (ax + gap - 28, ay + 28),
            (ax + gap - 28, ay + 14),
            (ax, ay + 14),
        ], fill=ACCENT)
        lf = font("sans_bold", 28)
        tw = d.textlength(label, font=lf)
        d.text((ax + (gap - 30) / 2 - tw / 2, ay - 70), label,
               fill=ACCENT, font=lf)

    # Reverse arrow (retroviruses) — DNA ← mRNA below
    rev_y = box_y + box_h + 60
    rax_start = box_xs[1] + box_w // 2
    rax_end   = box_xs[0] + box_w // 2
    # curved-ish: just straight back below
    d.line([(rax_start, rev_y), (rax_end + 30, rev_y)],
           fill=MAROON, width=6)
    # Arrow head
    d.polygon([
        (rax_end + 30, rev_y - 14),
        (rax_end + 30, rev_y + 14),
        (rax_end + 4,  rev_y),
    ], fill=MAROON)
    # Vertical lines connecting boxes to this reverse arrow
    d.line([(rax_start, box_y + box_h), (rax_start, rev_y)],
           fill=MAROON, width=6)
    d.line([(rax_end + 30, rev_y), (rax_end + 30, box_y + box_h)],
           fill=MAROON, width=6)

    d.text((rax_end + 70, rev_y + 12),
           "reverse transcriptase  (retroviruses: HIV)",
           fill=MAROON, font=font("sans_bold", 28))

    # Bottom punchline
    d.rounded_rectangle([110, 820, W - 110, 970], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Information almost always flows forward.  Retroviruses are the exception that proves the rule.",
             font("sans_bold", 30), 870, MAROON_DARK)
deck.custom("04_central_dogma", central_dogma)


# ────────────────────────────────────────────────────────────────────────
# 05 — transcription: template strand + mRNA, directionality, U instead of T
# ────────────────────────────────────────────────────────────────────────
def transcription(img, d):
    d.text((110, 70), "Transcription  —  DNA  →  mRNA.",
           fill=MAROON, font=font("serif_bold", 60))

    # Top row: promoter + TATA box + RNA polymerase
    d.rounded_rectangle([110, 170, W - 110, 280], radius=18,
                        outline=ACCENT, width=4, fill=ACCENT_LT)
    d.text((140, 188),
           "1.  INITIATION  —  RNA polymerase II binds the PROMOTER (TATA box ~25 bp upstream).",
           fill=MAROON_DARK, font=font("sans_bold", 30))
    d.text((140, 232),
           "    General transcription factors help recruit polymerase to the start site.",
           fill=INK, font=font("sans", 26))

    # Middle: directionality diagram — DNA template + mRNA below it
    mid_y = 340
    # Template strand
    d.text((140, mid_y), "Template (DNA):", fill=MAROON_DARK,
           font=font("sans_bold", 28))
    template_seq = "3' — T A C G G C A T T — 5'"
    d.text((460, mid_y), template_seq, fill=INK, font=font("mono", 40))
    d.text((140, mid_y + 60),
           "RNA polymerase reads this strand  3' → 5'  →",
           fill=MUTED, font=font("sans", 26))

    # mRNA below
    mrna_y = mid_y + 130
    d.text((140, mrna_y), "mRNA made:", fill=ACCENT,
           font=font("sans_bold", 28))
    mrna_seq = "5' — A U G C C G U A A — 3'"
    d.text((460, mrna_y), mrna_seq, fill=ACCENT, font=font("mono", 40))
    d.text((140, mrna_y + 60),
           "  ← synthesized  5' → 3'  ·  uses U instead of T",
           fill=MUTED, font=font("sans", 26))

    # Big rule box
    d.rounded_rectangle([110, mid_y + 220, W - 110, mid_y + 360], radius=20,
                        outline=MAROON, width=5, fill=CARD)
    centered(d, "Read template  3' → 5'    ·    write mRNA  5' → 3'    ·    U replaces T",
             font("serif_bold", 36), mid_y + 260, MAROON_DARK)
    centered(d, "(antiparallel + complementary — same rules as DNA, but with U)",
             font("serif_ital", 28), mid_y + 320, MUTED)

    # Bottom: elongation + termination
    d.rounded_rectangle([110, 880, W - 110, 980], radius=18,
                        outline=ACCENT, width=4, fill=ACCENT_LT)
    d.text((140, 895),
           "2.  ELONGATION — polymerase walks along, adding RNA nucleotides 5'→3'.",
           fill=MAROON_DARK, font=font("sans_bold", 26))
    d.text((140, 935),
           "3.  TERMINATION — at the terminator sequence, the new pre-mRNA releases.",
           fill=MAROON_DARK, font=font("sans_bold", 26))
deck.custom("05_transcription", transcription)


# ────────────────────────────────────────────────────────────────────────
# 06 — mRNA processing: 5' cap, poly-A tail, splicing
# ────────────────────────────────────────────────────────────────────────
def mrna_processing(img, d):
    d.text((110, 70), "Pre-mRNA processing  (eukaryotes only).",
           fill=MAROON, font=font("serif_bold", 56))

    # Top: pre-mRNA diagram with introns + exons
    pre_y = 200
    pre_h = 100
    pre_x_start = 200
    pre_x_end = W - 200
    pre_w = pre_x_end - pre_x_start
    d.text((110, pre_y), "PRE-mRNA",
           fill=MAROON_DARK, font=font("sans_bold", 28))

    # Segmented bar: 7 segments — 5'UTR, exon1, intron, exon2, intron, exon3, 3'UTR
    segments = [
        ("5'UTR", ACCENT_LT, 100),
        ("EXON 1", ACCENT,    220),
        ("intron", MUTED,     180),
        ("EXON 2", ACCENT,    220),
        ("intron", MUTED,     180),
        ("EXON 3", ACCENT,    220),
        ("3'UTR", ACCENT_LT, 100),
    ]
    total_units = sum(s[2] for s in segments)
    sx = pre_x_start
    sy = pre_y + 50
    segf = font("sans_bold", 22)
    for name, color, units in segments:
        seg_w = int(pre_w * units / total_units)
        d.rectangle([sx, sy, sx + seg_w, sy + pre_h], fill=color,
                    outline=MAROON_DARK, width=2)
        tw = d.textlength(name, font=segf)
        text_color = CREAM if color in (ACCENT, MUTED) else MAROON_DARK
        d.text((sx + seg_w / 2 - tw / 2, sy + pre_h / 2 - 12),
               name, fill=text_color, font=segf)
        sx += seg_w

    # Down arrow + label
    arrow_y = sy + pre_h + 40
    arrow_x = W // 2
    d.polygon([
        (arrow_x - 30, arrow_y),
        (arrow_x + 30, arrow_y),
        (arrow_x + 30, arrow_y + 30),
        (arrow_x + 50, arrow_y + 30),
        (arrow_x,      arrow_y + 70),
        (arrow_x - 50, arrow_y + 30),
        (arrow_x - 30, arrow_y + 30),
    ], fill=MAROON)
    d.text((arrow_x + 80, arrow_y + 20),
           "5' cap added  ·  poly-A tail added  ·  spliceosome cuts introns",
           fill=MAROON_DARK, font=font("sans_bold", 28))

    # Mature mRNA — bar with cap circle on left and AAAA on right
    mature_y = arrow_y + 110
    d.text((110, mature_y), "MATURE  mRNA",
           fill=ACCENT, font=font("sans_bold", 28))
    mature_x = pre_x_start
    mature_yy = mature_y + 50
    # 5' cap circle
    cap_r = 30
    d.ellipse([mature_x - 70, mature_yy + pre_h // 2 - cap_r,
               mature_x - 10, mature_yy + pre_h // 2 + cap_r],
              fill=MAROON, outline=MAROON_DARK, width=3)
    capf = font("sans_bold", 22)
    tw = d.textlength("5'", font=capf)
    d.text((mature_x - 50 - tw / 2, mature_yy + pre_h // 2 - 14),
           "5'", fill=CREAM, font=capf)
    d.text((mature_x - 70, mature_yy + pre_h + 10),
           "cap", fill=MAROON_DARK, font=font("sans_bold", 22))

    # Mature mRNA bar: UTR + exon1 + exon2 + exon3 + UTR
    mature_segs = [
        ("5'UTR", ACCENT_LT, 100),
        ("EXON 1", ACCENT,   240),
        ("EXON 2", ACCENT,   240),
        ("EXON 3", ACCENT,   240),
        ("3'UTR", ACCENT_LT, 100),
    ]
    m_total = sum(s[2] for s in mature_segs)
    m_w_total = pre_w - 200  # leave room for poly-A
    cur_x = mature_x
    for name, color, units in mature_segs:
        seg_w = int(m_w_total * units / m_total)
        d.rectangle([cur_x, mature_yy, cur_x + seg_w, mature_yy + pre_h],
                    fill=color, outline=MAROON_DARK, width=2)
        tw = d.textlength(name, font=segf)
        text_color = CREAM if color == ACCENT else MAROON_DARK
        d.text((cur_x + seg_w / 2 - tw / 2, mature_yy + pre_h / 2 - 12),
               name, fill=text_color, font=segf)
        cur_x += seg_w
    # Poly-A tail
    d.text((cur_x + 20, mature_yy + pre_h / 2 - 18),
           "A A A A A A A . . .", fill=MAROON,
           font=font("mono", 28))
    d.text((cur_x + 20, mature_yy + pre_h + 10),
           "poly-A tail  (~200 As)", fill=MAROON_DARK,
           font=font("sans_bold", 22))

    # Bottom: prokaryote contrast
    d.rounded_rectangle([110, 880, W - 110, 990], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Prokaryotes skip ALL of this  ·  no nucleus  ·  no introns  ·  transcription and translation are coupled.",
             font("sans_bold", 30), 905, MAROON_DARK)
    centered(d, "Cap protects from degradation.  Tail protects + exports.  Splicing removes introns, joins exons.",
             font("serif_ital", 26), 955, MUTED)
deck.custom("06_mrna_processing", mrna_processing)


# ────────────────────────────────────────────────────────────────────────
# 07 — alternative splicing: 1 gene → many isoforms
# ────────────────────────────────────────────────────────────────────────
def alternative_splicing(img, d):
    d.text((110, 70), "Alternative splicing  —  why ~20k genes make 100k+ proteins.",
           fill=MAROON, font=font("serif_bold", 48))

    # One pre-mRNA at top
    pre_y = 200
    pre_h = 80
    bar_x_start = 180
    bar_x_end = W - 180
    bar_w = bar_x_end - bar_x_start
    d.text((110, pre_y - 8), "PRE-mRNA",
           fill=MAROON_DARK, font=font("sans_bold", 26))

    segments = [
        ("E1", ACCENT,    180, "exon"),
        ("i",  MUTED,      90, "intron"),
        ("E2", ACCENT,    180, "exon"),
        ("i",  MUTED,      90, "intron"),
        ("E3", ACCENT,    180, "exon"),
        ("i",  MUTED,      90, "intron"),
        ("E4", ACCENT,    180, "exon"),
    ]
    total_units = sum(s[2] for s in segments)
    sx = bar_x_start
    sy = pre_y + 40
    for name, color, units, _ in segments:
        seg_w = int(bar_w * units / total_units)
        d.rectangle([sx, sy, sx + seg_w, sy + pre_h], fill=color,
                    outline=MAROON_DARK, width=2)
        tf = font("sans_bold", 30)
        tw = d.textlength(name, font=tf)
        tc = CREAM if color in (ACCENT, MUTED) else MAROON_DARK
        d.text((sx + seg_w / 2 - tw / 2, sy + pre_h / 2 - 18),
               name, fill=tc, font=tf)
        sx += seg_w

    # Three downward arrows fanning out
    fan_y_start = sy + pre_h + 30
    fan_y_end = fan_y_start + 80
    fan_targets_x = [320, W // 2, W - 320]
    for tx in fan_targets_x:
        d.line([(W // 2, fan_y_start), (tx, fan_y_end)],
               fill=MAROON, width=4)
        d.polygon([
            (tx - 10, fan_y_end),
            (tx + 10, fan_y_end),
            (tx,      fan_y_end + 16),
        ], fill=MAROON)

    # Three different mature mRNA combinations
    iso_y = fan_y_end + 50
    iso_h = 70
    iso_w = 460
    iso_combos = [
        ("Isoform A",  ["E1", "E2", "E3", "E4"]),
        ("Isoform B",  ["E1", "E2", "E4"]),
        ("Isoform C",  ["E1", "E3", "E4"]),
    ]
    for i, (label, exons) in enumerate(iso_combos):
        ix = fan_targets_x[i] - iso_w // 2
        d.text((ix, iso_y - 32), label, fill=ACCENT,
               font=font("sans_bold", 26))
        ex_w = iso_w // len(exons)
        for j, ex in enumerate(exons):
            ex_x = ix + j * ex_w
            d.rectangle([ex_x, iso_y, ex_x + ex_w, iso_y + iso_h],
                        fill=ACCENT, outline=MAROON_DARK, width=2)
            tf = font("sans_bold", 28)
            tw = d.textlength(ex, font=tf)
            d.text((ex_x + ex_w / 2 - tw / 2, iso_y + iso_h / 2 - 18),
                   ex, fill=CREAM, font=tf)

    # Three different proteins
    prot_y = iso_y + iso_h + 40
    for i, (label, exons) in enumerate(iso_combos):
        tx = fan_targets_x[i]
        d.text((tx - 50, prot_y), "↓", fill=MUTED,
               font=font("sans_bold", 36))
        d.text((tx + 20, prot_y), f"Protein {chr(65 + i)}",
               fill=MAROON_DARK, font=font("sans_bold", 28))

    # Bottom punchline
    d.rounded_rectangle([110, prot_y + 90, W - 110, prot_y + 230],
                        radius=20, outline=MAROON, width=5,
                        fill=ACCENT_LT)
    centered(d, "Same gene  ·  different exon combinations  ·  different protein isoforms.",
             font("serif_bold", 36), prot_y + 120, MAROON_DARK)
    centered(d, "Small genome  →  huge proteome.  How one human gene makes many proteins for many cell types.",
             font("sans", 28), prot_y + 175, INK)
deck.custom("07_alternative_splicing", alternative_splicing)


# ────────────────────────────────────────────────────────────────────────
# 08 — ribosome A/P/E sites
# ────────────────────────────────────────────────────────────────────────
def translation_ribosome(img, d):
    d.text((110, 70), "The ribosome  —  large + small + A · P · E.",
           fill=MAROON, font=font("serif_bold", 56))

    # Ribosome drawing on left: two stacked rounded shapes
    rib_cx = 540
    rib_cy = 550
    # Large subunit (top, bigger)
    large_w = 580
    large_h = 280
    d.rounded_rectangle([rib_cx - large_w // 2, rib_cy - 240,
                         rib_cx + large_w // 2, rib_cy + 40],
                        radius=140, outline=MAROON_DARK, width=5,
                        fill=ACCENT_LT)
    d.text((rib_cx - 110, rib_cy - 130), "60S  large",
           fill=MAROON_DARK, font=font("sans_bold", 34))
    d.text((rib_cx - 80, rib_cy - 90), "(eukaryotic)",
           fill=MUTED, font=font("serif_ital", 24))

    # Small subunit (bottom)
    small_w = 540
    small_h = 160
    d.rounded_rectangle([rib_cx - small_w // 2, rib_cy + 40,
                         rib_cx + small_w // 2, rib_cy + 200],
                        radius=80, outline=MAROON_DARK, width=5,
                        fill=ACCENT)
    d.text((rib_cx - 100, rib_cy + 100), "40S  small",
           fill=CREAM, font=font("sans_bold", 34))

    # mRNA strand running across the bottom
    mrna_y = rib_cy + 230
    d.line([(rib_cx - 320, mrna_y), (rib_cx + 320, mrna_y)],
           fill=MAROON_DARK, width=6)
    d.text((rib_cx - 380, mrna_y - 18), "5'", fill=MAROON_DARK,
           font=font("sans_bold", 26))
    d.text((rib_cx + 340, mrna_y - 18), "3'", fill=MAROON_DARK,
           font=font("sans_bold", 26))
    d.text((rib_cx - 90, mrna_y + 20), "mRNA",
           fill=MUTED, font=font("sans_bold", 28))

    # Three sites labeled E, P, A on the ribosome (matches mRNA reading 5'→3')
    sites = [("E", rib_cx - 160), ("P", rib_cx), ("A", rib_cx + 160)]
    for letter, sx in sites:
        d.ellipse([sx - 36, rib_cy - 50, sx + 36, rib_cy + 22],
                  fill=CREAM, outline=MAROON, width=4)
        sf = font("serif_bold", 44)
        tw = d.textlength(letter, font=sf)
        d.text((sx - tw / 2, rib_cy - 40), letter,
               fill=MAROON_DARK, font=sf)

    # Right side: A/P/E labels with descriptions
    rx = 1180
    ry = 230
    d.text((rx, ry), "Three tRNA slots:",
           fill=MAROON, font=font("serif_bold", 42))

    rows = [
        ("A site", "Aminoacyl",      "incoming tRNA (with new amino acid)", ACCENT),
        ("P site", "Peptidyl",       "tRNA holding the growing peptide",    ACCENT),
        ("E site", "Exit",           "empty tRNA on its way out",           MAROON),
    ]
    yy = ry + 80
    for name, full, role, color in rows:
        d.rounded_rectangle([rx, yy, W - 110, yy + 130], radius=18,
                            outline=color, width=4, fill=CARD)
        d.text((rx + 24, yy + 12), name,
               fill=color, font=font("serif_bold", 40))
        d.text((rx + 200, yy + 22), full,
               fill=MAROON_DARK, font=font("sans_bold", 30))
        d.text((rx + 24, yy + 80), role,
               fill=INK, font=font("sans", 24))
        yy += 150

    # Bottom note
    d.rounded_rectangle([110, 920, W - 110, 990], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Eukaryotic ribosome = 80S  (60S + 40S).    Prokaryotic = 70S.",
             font("sans_bold", 30), 940, MAROON_DARK)
deck.custom("08_translation_ribosome", translation_ribosome)


# ────────────────────────────────────────────────────────────────────────
# 09 — codons + tRNAs: 64 codons, 61 + 3 stop, start AUG, redundant, universal
# ────────────────────────────────────────────────────────────────────────
def codons_trnas(img, d):
    d.text((110, 70), "The genetic code  —  64 codons.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 150),
           "mRNA is read in groups of 3 bases (codons).  4³ = 64 codons total.",
           fill=MUTED, font=font("sans", 30))

    # 4 callout cards
    cards = [
        ("61",    "amino-acid",   "coding codons",       ACCENT),
        ("3",     "STOP codons",  "UAA  ·  UAG  ·  UGA", MAROON),
        ("AUG",   "START codon",  "= methionine (Met)",  ACCENT),
        ("ALL",   "redundant",    "+ nearly universal",  MAROON),
    ]
    card_w = 400
    card_h = 280
    gap = 30
    total_w = card_w * 4 + gap * 3
    start_x = (W - total_w) // 2
    card_y = 240
    for i, (big, head, sub, color) in enumerate(cards):
        x = start_x + i * (card_w + gap)
        d.rounded_rectangle([x, card_y, x + card_w, card_y + card_h],
                            radius=22, outline=color, width=5, fill=CARD)
        bf = font("serif_bold", 100)
        tw = d.textlength(big, font=bf)
        d.text((x + card_w / 2 - tw / 2, card_y + 25), big,
               fill=color, font=bf)
        hf = font("sans_bold", 32)
        tw = d.textlength(head, font=hf)
        d.text((x + card_w / 2 - tw / 2, card_y + 160), head,
               fill=MAROON_DARK, font=hf)
        sf = font("sans", 26)
        tw = d.textlength(sub, font=sf)
        d.text((x + card_w / 2 - tw / 2, card_y + 210), sub,
               fill=INK, font=sf)

    # Bottom: rule strip — two key features
    rule_y = 580
    d.rounded_rectangle([110, rule_y, W - 110, rule_y + 200],
                        radius=22, outline=MAROON, width=5,
                        fill=ACCENT_LT)
    d.text((150, rule_y + 30), "Two features to lock in:",
           fill=MAROON_DARK, font=font("serif_bold", 38))
    d.text((150, rule_y + 95),
           "REDUNDANT (degenerate) — multiple codons can spell the same amino acid",
           fill=INK, font=font("sans_bold", 30))
    d.text((150, rule_y + 145),
           "UNIVERSAL — a bacterium, a banana, and you all read the same codon table",
           fill=INK, font=font("sans_bold", 30))

    # Tiny codon table examples
    eg_y = 830
    d.rounded_rectangle([110, eg_y, W - 110, eg_y + 150],
                        radius=18, outline=ACCENT, width=4, fill=CARD)
    d.text((140, eg_y + 18), "Examples (redundancy):",
           fill=MAROON_DARK, font=font("sans_bold", 28))
    examples = "GGU  ·  GGC  ·  GGA  ·  GGG   →   all = Glycine"
    d.text((140, eg_y + 68), examples,
           fill=ACCENT, font=font("mono", 36))
    d.text((140, eg_y + 115),
           "(third base often \"wobbles\" — same amino acid)",
           fill=MUTED, font=font("serif_ital", 24))
deck.custom("09_codons_trnas", codons_trnas)


# ────────────────────────────────────────────────────────────────────────
# 10 — pause + try
# ────────────────────────────────────────────────────────────────────────
deck.pause("10_pause1", "PAUSE  &  TRY",
           "DNA template:  3' — TAC GGC ATT — 5'.   Write the mRNA, then translate the first 3 codons.",
           "AUG  =  Met  (start)",
           hint="Pause now. Solve it. Press play when you're ready.")

# 11 — duplicate the pause slide
deck.duplicate("10_pause1", "11_pause1_silence")


# ────────────────────────────────────────────────────────────────────────
# 12 — translation steps: initiation / elongation / termination
# ────────────────────────────────────────────────────────────────────────
def translation_steps(img, d):
    d.text((110, 70), "Translation  —  3 acts.",
           fill=MAROON, font=font("serif_bold", 64))

    steps = [
        ("1.  INITIATION",
         "Small subunit binds 5' cap.",
         "Scans down to first AUG → large subunit joins.",
         ACCENT),
        ("2.  ELONGATION",
         "A-site tRNA matches next codon.",
         "Peptide bond formed by rRNA  (RIBOZYME!)   tRNAs shift A → P → E.",
         ACCENT),
        ("3.  TERMINATION",
         "Stop codon enters A site.",
         "Release factor binds → polypeptide pops off.",
         MAROON),
    ]
    box_h = 200
    gap = 30
    by = 200
    for head, sub1, sub2, color in steps:
        d.rounded_rectangle([110, by, W - 110, by + box_h],
                            radius=22, outline=color, width=5,
                            fill=CARD)
        d.text((150, by + 20), head,
               fill=color, font=font("serif_bold", 50))
        d.text((150, by + 90), sub1,
               fill=MAROON_DARK, font=font("sans_bold", 34))
        d.text((150, by + 140), sub2,
               fill=INK, font=font("sans", 30))
        by += box_h + gap

    # Punchline strip about the ribozyme detail
    d.rounded_rectangle([110, 900, W - 110, 985], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "The peptide bond is catalyzed by rRNA — not protein.  RNA acts as the enzyme.",
             font("sans_bold", 30), 925, MAROON_DARK)
deck.custom("12_translation_steps", translation_steps)


# ────────────────────────────────────────────────────────────────────────
# 13 — gene regulation: lac, trp, eukaryote layers
# ────────────────────────────────────────────────────────────────────────
def gene_regulation(img, d):
    d.text((110, 70), "Gene regulation  —  which genes get used.",
           fill=MAROON, font=font("serif_bold", 54))

    # Top row: prokaryote operons — 2 columns
    op_y = 180
    op_h = 360
    col_w = 870
    gap = 30
    start_x = 110

    operons = [
        ("LAC  operon",
         "INDUCIBLE",
         "Normally OFF.",
         "Lactose → allolactose knocks repressor OFF.",
         "Operon turns ON → digest lactose.",
         "Lactose  →  lac  ON",
         ACCENT),
        ("TRP  operon",
         "REPRESSIBLE",
         "Normally ON.",
         "Tryptophan activates repressor.",
         "Repressor sits on operator → operon OFF.",
         "Tryptophan  →  trp  OFF",
         MAROON),
    ]
    for i, (name, kind, default, mech1, mech2, rule, color) in enumerate(operons):
        x = start_x + i * (col_w + gap)
        d.rounded_rectangle([x, op_y, x + col_w, op_y + op_h],
                            radius=22, outline=color, width=5,
                            fill=CARD)
        d.text((x + 30, op_y + 20), name,
               fill=color, font=font("serif_bold", 50))
        d.text((x + 30, op_y + 88), kind,
               fill=MAROON_DARK, font=font("sans_bold", 36))
        d.text((x + 30, op_y + 150), default,
               fill=INK, font=font("sans_bold", 30))
        d.text((x + 30, op_y + 200), mech1,
               fill=INK, font=font("sans", 26))
        d.text((x + 30, op_y + 240), mech2,
               fill=INK, font=font("sans", 26))
        # Rule pill at bottom
        d.rounded_rectangle([x + 30, op_y + op_h - 75,
                             x + col_w - 30, op_y + op_h - 15],
                            radius=14, fill=ACCENT_LT,
                            outline=color, width=3)
        rf = font("sans_bold", 30)
        tw = d.textlength(rule, font=rf)
        d.text((x + col_w / 2 - tw / 2, op_y + op_h - 65),
               rule, fill=MAROON_DARK, font=rf)

    # Bottom: eukaryotic regulation — 4 layers
    eu_y = 580
    d.text((110, eu_y), "Eukaryotic regulation  —  multi-layered:",
           fill=MAROON_DARK, font=font("serif_bold", 38))

    layers = [
        ("Chromatin / epigenetics",
         "DNA methylation = OFF.  Histone acetylation = ON."),
        ("Transcription factors",
         "Bind enhancers / silencers; mediator bridges to RNA polymerase."),
        ("Alternative splicing",
         "Different exon combos → different protein isoforms."),
        ("miRNA / RNAi",
         "Short RNAs degrade or block mRNA translation."),
    ]
    lay_w = 870
    lay_h = 130
    lay_gap = 20
    ly = eu_y + 70
    for i, (head, sub) in enumerate(layers):
        col = i % 2
        row = i // 2
        lx = 110 + col * (lay_w + lay_gap)
        lyy = ly + row * (lay_h + lay_gap)
        d.rounded_rectangle([lx, lyy, lx + lay_w, lyy + lay_h],
                            radius=16, outline=ACCENT, width=4,
                            fill=ACCENT_LT)
        d.text((lx + 20, lyy + 16), head,
               fill=MAROON_DARK, font=font("sans_bold", 32))
        d.text((lx + 20, lyy + 70), sub,
               fill=INK, font=font("sans", 24))
deck.custom("13_gene_regulation", gene_regulation)


# ────────────────────────────────────────────────────────────────────────
# 14 — mutations compare: silent / missense / nonsense / frameshift
# ────────────────────────────────────────────────────────────────────────
def mutations_compare(img, d):
    d.text((110, 70), "Mutations  —  4 ways the message breaks.",
           fill=MAROON, font=font("serif_bold", 58))

    # 4 quadrants
    cards = [
        ("SILENT",
         "1 base change",
         "Codon still codes for SAME amino acid.",
         "GCU → GCC   both = Ala.",
         "Protein:  unchanged.",
         ACCENT),
        ("MISSENSE",
         "1 base change",
         "New codon = DIFFERENT amino acid.",
         "Sickle cell:  GAG → GTG   Glu → Val   at β-globin pos 6.",
         "Protein:  altered (sometimes dramatically).",
         MAROON),
        ("NONSENSE",
         "1 base change",
         "New codon = STOP codon.",
         "CAG → UAG   Gln → STOP.",
         "Protein:  truncated early.",
         MAROON),
        ("FRAMESHIFT",
         "Insertion or deletion (NOT multiple of 3)",
         "Reading frame shifts downstream.",
         "+1 base → every codon after is wrong.",
         "Protein:  usually destroyed.",
         RED),
    ]
    card_w = 870
    card_h = 360
    gap_x = 30
    gap_y = 30
    start_x = 110
    start_y = 180
    for i, (name, kind, mech, eg, effect, color) in enumerate(cards):
        col = i % 2
        row = i // 2
        x = start_x + col * (card_w + gap_x)
        y = start_y + row * (card_h + gap_y)
        d.rounded_rectangle([x, y, x + card_w, y + card_h],
                            radius=22, outline=color, width=5,
                            fill=CARD)
        d.text((x + 30, y + 20), name,
               fill=color, font=font("serif_bold", 48))
        d.text((x + 30, y + 90), kind,
               fill=MAROON_DARK, font=font("sans_bold", 28))
        d.text((x + 30, y + 145), mech,
               fill=INK, font=font("sans", 28))
        # Example in monospace
        d.text((x + 30, y + 205), eg,
               fill=ACCENT, font=font("mono", 26))
        # Effect line
        d.text((x + 30, y + 285), effect,
               fill=MAROON_DARK, font=font("sans_bold", 26))

    # Bottom strip
    d.rounded_rectangle([110, 920, W - 110, 985], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Mutations are the ultimate source of new genetic variation that evolution acts on.",
             font("sans_bold", 28), 940, MAROON_DARK)
deck.custom("14_mutations_compare", mutations_compare)


# ────────────────────────────────────────────────────────────────────────
# 15 — recap
# ────────────────────────────────────────────────────────────────────────
deck.recap("15_recap", "Recap.", [
    "Central dogma:  DNA → mRNA → protein  (reverse transcriptase = exception).",
    "Transcription: read template 3'→5', write mRNA 5'→3', U instead of T.",
    "Eukaryote processing:  5' cap  ·  poly-A tail  ·  splice out introns.",
    "Alternative splicing → 1 gene → many isoforms (~20k genes, 100k+ proteins).",
    "Ribosome:  A · P · E sites.  Peptide bond by rRNA (ribozyme).  AUG starts.",
    "Operons:  lac inducible (lactose ON), trp repressible (Trp OFF).",
    "Mutations:  silent · missense · nonsense · frameshift.  Source of variation.",
], assignment=[
    "1.  Given an mRNA, translate it to protein and find any stop codons.",
    "2.  Predict whether each given DNA change is silent / missense / nonsense / frameshift.",
])


# ────────────────────────────────────────────────────────────────────────
# 16 — path
# ────────────────────────────────────────────────────────────────────────
deck.path("16_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Biology",   "Chapters 15 and 16 — transcription, translation, regulation"),
    ("2.", "Khan Academy AP Bio",     "Unit 6 problem sets — codon tables, lac operon, mutation types"),
    ("3.", "Assignment in dashboard", "Codon translation + mutation type identification"),
    ("4.", "Advisor check-in",        "If the codon table or lac-vs-trp logic still feels fuzzy"),
], next_text="Next up:  Module 9 — Biotechnology  (PCR, gel electrophoresis, CRISPR).")


print("AP Biology Module 8 slides built.")
