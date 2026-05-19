"""AP Biology · Module 6 — Mendelian Genetics.

Teal (science) theme auto-resolved by slide_kit from the "AP Biology" prefix.
16 slides total. Heavy on customs because meiosis diagrams, Punnett squares,
and non-Mendelian comparisons each need real layout. Pause slide is
duplicated (10 -> 11) so the same image plays during both question and answer.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, wrap, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, CREAM,
)

LOGO = "../../src/img/logo_nobg.png"
deck = Deck(course="AP Biology", module_num=6, output_dir="slides", logo_path=LOGO)

ACCENT = deck.accent           # teal
ACCENT_LT = deck.accent_light  # light teal
CARD = deck.card_bg


# 01 — title
deck.title("01_title", "AP Biology",
           "Module 6 — Mendelian Genetics",
           "Sample lesson  ·  ~8 minutes")


# 02 — hook: 99.9% DNA shared; 0.1% shuffled by meiosis (8.4M combinations)
def hook(img, d):
    d.text((110, 70), "You vs. every other human.",
           fill=MAROON, font=font("serif_bold", 64))

    # Big number panel — 99.9% shared
    lx, ly, lw, lh = 140, 220, 760, 540
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=28,
                        outline=ACCENT, width=6, fill=CARD)
    centered_x = lx + lw // 2
    cap = "DNA you share with"
    cf = font("serif_bold", 38)
    tw = d.textlength(cap, font=cf)
    d.text((centered_x - tw / 2, ly + 40), cap, fill=MAROON_DARK, font=cf)
    cap2 = "every other human:"
    tw2 = d.textlength(cap2, font=cf)
    d.text((centered_x - tw2 / 2, ly + 90), cap2, fill=MAROON_DARK, font=cf)

    # The 99.9% mega text
    bignum = "99.9%"
    bf = font("serif_bold", 240)
    tw3 = d.textlength(bignum, font=bf)
    d.text((centered_x - tw3 / 2, ly + 180), bignum, fill=ACCENT, font=bf)

    sub = "The remaining 0.1% is yours."
    sf = font("sans_bold", 32)
    tw4 = d.textlength(sub, font=sf)
    d.text((centered_x - tw4 / 2, ly + 440), sub, fill=MAROON_DARK, font=sf)

    # Right panel: 8.4M combinations
    rx, ry, rw, rh = 1020, 220, 760, 540
    d.rounded_rectangle([rx, ry, rx + rw, ly + lh], radius=28,
                        outline=ACCENT, width=6, fill=CARD)
    cap3 = "Independent assortment alone:"
    tw5 = d.textlength(cap3, font=cf)
    d.text((rx + rw // 2 - tw5 / 2, ry + 40), cap3,
           fill=MAROON_DARK, font=cf)

    eqn = "2²³"
    ef = font("serif_bold", 200)
    tw6 = d.textlength(eqn, font=ef)
    d.text((rx + rw // 2 - tw6 / 2, ry + 130), eqn, fill=MAROON, font=ef)

    eq2 = "≈ 8,388,608"
    e2f = font("mono", 60)
    tw7 = d.textlength(eq2, font=e2f)
    d.text((rx + rw // 2 - tw7 / 2, ry + 370), eq2, fill=ACCENT, font=e2f)

    sub2 = "unique chromosome combinations"
    s2f = font("sans", 28)
    tw8 = d.textlength(sub2, font=s2f)
    d.text((rx + rw // 2 - tw8 / 2, ry + 450), sub2, fill=MUTED, font=s2f)

    sub3 = "per single gamete you make."
    tw9 = d.textlength(sub3, font=s2f)
    d.text((rx + rw // 2 - tw9 / 2, ry + 485), sub3, fill=MUTED, font=s2f)

    # Bottom punchline strip
    d.rounded_rectangle([110, 820, W - 110, 940], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Add crossing over + random fertilization → the variation explodes.",
             font("serif_bold", 38), 850, MAROON_DARK)
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "Meiosis — how 1 diploid cell makes 4 haploid gametes.",
    "Mendel's 3 laws — segregation, independent assortment, dominance.",
    "Non-Mendelian patterns — incomplete dominance, codominance, more.",
], footnote="By the end: predict offspring ratios for almost any cross.")


# 04 — meiosis overview: 1 diploid -> 4 haploid
def meiosis_overview(img, d):
    d.text((110, 70), "Meiosis  —  one cell becomes four.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 160),
           "2N germ cell  →  Meiosis I  →  Meiosis II  →  4 haploid gametes (N each)",
           fill=MUTED, font=font("sans", 28))

    # Stage layout — 4 boxes left to right showing cell counts
    stages = [
        ("Start", "1 cell\n2N = 46\n(humans)", 2),
        ("After Meiosis I", "2 cells\nN = 23\nbut chromatids still paired", 4),
        ("After Meiosis II", "4 cells\nN = 23\nchromatids separated", 4),
        ("Gametes", "4 unique\nhaploid\nsperm or egg", 4),
    ]
    box_w = 380
    box_h = 380
    gap = 40
    total_w = box_w * 4 + gap * 3
    start_x = (W - total_w) // 2
    y0 = 270

    for i, (head, body, cells) in enumerate(stages):
        x = start_x + i * (box_w + gap)
        d.rounded_rectangle([x, y0, x + box_w, y0 + box_h], radius=20,
                            outline=ACCENT, width=5, fill=CARD)
        d.text((x + 20, y0 + 20), head, fill=ACCENT,
               font=font("serif_bold", 34))

        # Draw little circles to represent cells
        cells_y = y0 + 90
        cell_r = 30
        per_row = 2
        rows = (cells + per_row - 1) // per_row
        spacing = 80
        gx = x + box_w // 2 - (per_row - 1) * spacing // 2
        for c in range(cells):
            row = c // per_row
            col = c % per_row
            ccx = gx + col * spacing
            ccy = cells_y + row * spacing
            d.ellipse([ccx - cell_r, ccy - cell_r,
                       ccx + cell_r, ccy + cell_r],
                      fill=ACCENT_LT, outline=MAROON_DARK, width=3)

        # Body text below
        by = y0 + 260
        for line in body.split("\n"):
            tw = d.textlength(line, font=font("sans", 26))
            d.text((x + box_w // 2 - tw / 2, by), line,
                   fill=INK, font=font("sans", 26))
            by += 32

        # Arrow to next stage
        if i < 3:
            ax = x + box_w + 4
            ay = y0 + box_h // 2
            d.polygon([(ax, ay - 18), (ax + 30, ay), (ax, ay + 18)],
                      fill=MAROON_DARK)

    # Bottom strip
    d.rounded_rectangle([110, 770, W - 110, 900], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Mitosis = 1 diploid → 2 diploid (identical).   Meiosis = 1 diploid → 4 haploid (unique).",
             font("sans_bold", 32), 800, MAROON_DARK)
    centered(d, "Meiosis happens only in germ cells — ovaries and testes.",
             font("serif_ital", 30), 850, MUTED)
deck.custom("04_meiosis_overview", meiosis_overview)


# 05 — Meiosis I vs II: reductional vs equational
def meiosis_compare(img, d):
    d.text((110, 70), "Meiosis I  vs.  Meiosis II.",
           fill=MAROON, font=font("serif_bold", 60))

    cols = [
        ("MEIOSIS I", "REDUCTIONAL", [
            "Homologous pairs SEPARATE.",
            "Chromosome number HALVES.",
            "2N  →  N",
            "",
            "Prophase I: crossing over",
            "at chiasmata (synapsis).",
            "",
            "Metaphase I: homologs",
            "line up as TETRADS.",
        ], "Number changes.", ACCENT),
        ("MEIOSIS II", "EQUATIONAL", [
            "Sister chromatids SEPARATE.",
            "Chromosome number stays N.",
            "N  →  N",
            "",
            "Just like mitosis,",
            "but on haploid cells.",
            "",
            "No pairing.",
            "No crossing over.",
        ], "Number stays the same.", MAROON),
    ]

    col_w = 820
    col_h = 720
    gap = 40
    start_x = (W - (col_w * 2 + gap)) // 2
    y0 = 200
    for i, (name, sub, lines, foot, color) in enumerate(cols):
        x = start_x + i * (col_w + gap)
        d.rounded_rectangle([x, y0, x + col_w, y0 + col_h], radius=22,
                            outline=color, width=6, fill=CARD)
        d.text((x + 30, y0 + 24), name, fill=color,
               font=font("serif_bold", 52))
        d.text((x + 30, y0 + 100), sub, fill=MAROON_DARK,
               font=font("sans_bold", 36))
        ly = y0 + 180
        for ln in lines:
            d.text((x + 30, ly), ln, fill=INK, font=font("sans", 28))
            ly += 48
        d.text((x + 30, y0 + col_h - 60), foot, fill=color,
               font=font("sans_bold", 32))

    # Bottom note
    d.rounded_rectangle([110, 945, W - 110, 1035], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Memory hook:  REDUCTIONAL reduces.  EQUATIONAL keeps things equal.",
             font("sans_bold", 30), 970, MAROON_DARK)
deck.custom("05_meiosis_I_II_compare", meiosis_compare)


# 06 — three sources of genetic variation
def three_sources(img, d):
    d.text((110, 70), "3 sources of genetic variation in meiosis.",
           fill=MAROON, font=font("serif_bold", 56))

    sources = [
        ("1", "Crossing Over",
         "Prophase I — non-sister chromatids of homologs swap DNA at chiasmata.",
         "New combinations along each chromosome."),
        ("2", "Independent Assortment",
         "Metaphase I — each homolog pair lines up independently.",
         "2²³ ≈ 8.4 million combinations per human gamete."),
        ("3", "Random Fertilization",
         "Any one gamete meets any one gamete from the other parent.",
         "~70 trillion possible zygotes per couple."),
    ]
    y = 220
    box_h = 220
    for n, head, body, punch in sources:
        d.rounded_rectangle([110, y, W - 110, y + box_h], radius=20,
                            outline=ACCENT, width=5, fill=CARD)
        # Number circle
        cx, cy = 200, y + box_h // 2
        d.ellipse([cx - 65, cy - 65, cx + 65, cy + 65],
                  fill=ACCENT, outline=MAROON_DARK, width=4)
        nf = font("serif_bold", 88)
        tw = d.textlength(n, font=nf)
        d.text((cx - tw / 2, cy - 60), n, fill=CREAM, font=nf)

        d.text((310, y + 30), head, fill=MAROON_DARK,
               font=font("serif_bold", 40))
        d.text((310, y + 90), body, fill=INK, font=font("sans", 28))
        d.text((310, y + 145), punch, fill=ACCENT,
               font=font("sans_bold", 28))
        y += box_h + 20

    # Bottom rule
    d.rounded_rectangle([110, 905, W - 110, 1000], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Multiplied together → every gamete is genuinely unique.",
             font("serif_bold", 32), 930, MAROON_DARK)
deck.custom("06_three_sources_variation", three_sources)


# 07 — Mendel's three laws
def mendel_laws(img, d):
    d.text((110, 70), "Mendel's 3 laws  (1860s, pea plants).",
           fill=MAROON, font=font("serif_bold", 60))

    laws = [
        ("1.",  "Segregation",
         "Each gene has 2 alleles; gametes carry only ONE.",
         "Alleles separate during meiosis I."),
        ("2.",  "Independent Assortment",
         "Alleles for DIFFERENT genes sort independently.",
         "Only if the genes are on different chromosomes (or far apart)."),
        ("3.",  "Dominance",
         "In a heterozygote (Aa), the dominant phenotype is expressed.",
         "Recessive is masked — but still passed on."),
    ]
    y = 220
    box_h = 230
    for n, head, body, foot in laws:
        d.rounded_rectangle([110, y, W - 110, y + box_h], radius=20,
                            outline=ACCENT, width=5, fill=CARD)
        d.text((150, y + 30), n, fill=ACCENT,
               font=font("serif_bold", 72))
        d.text((280, y + 30), head, fill=MAROON_DARK,
               font=font("serif_bold", 48))
        d.text((280, y + 100), body, fill=INK, font=font("sans", 30))
        d.text((280, y + 155), foot, fill=MUTED, font=font("serif_ital", 26))
        y += box_h + 20

    # Bottom
    d.rounded_rectangle([110, 935, W - 110, 1030], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Mendel didn't know about chromosomes — but these laws map perfectly onto meiosis.",
             font("sans_bold", 28), 965, MAROON_DARK)
deck.custom("07_mendel_laws", mendel_laws)


# 08 — monohybrid 3:1 + dihybrid 9:3:3:1 (two Punnett squares)
def monohybrid_dihybrid(img, d):
    d.text((110, 70), "The ratios.",
           fill=MAROON, font=font("serif_bold", 64))

    # Left: monohybrid Aa x Aa Punnett
    lx, ly = 140, 200
    lw, lh = 800, 700
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=22,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((lx + 30, ly + 20), "MONOHYBRID",
           fill=ACCENT, font=font("sans_bold", 36))
    d.text((lx + 30, ly + 70), "Aa  ×  Aa",
           fill=MAROON_DARK, font=font("mono", 56))

    # 2x2 Punnett
    psq_x = lx + 200
    psq_y = ly + 180
    cell = 130
    # column headers
    headers = ["A", "a"]
    rows = ["A", "a"]
    hf = font("serif_bold", 52)
    for j, h in enumerate(headers):
        tw = d.textlength(h, font=hf)
        d.text((psq_x + j * cell + cell // 2 - tw / 2, psq_y - 70),
               h, fill=MAROON, font=hf)
    for i, r in enumerate(rows):
        tw = d.textlength(r, font=hf)
        d.text((psq_x - 70, psq_y + i * cell + cell // 2 - 30),
               r, fill=MAROON, font=hf)
    # cells
    contents = [["AA", "Aa"], ["Aa", "aa"]]
    colors_p = [[ACCENT_LT, ACCENT_LT], [ACCENT_LT, CARD]]
    for i in range(2):
        for j in range(2):
            cx = psq_x + j * cell
            cy = psq_y + i * cell
            d.rectangle([cx, cy, cx + cell, cy + cell],
                        outline=MAROON_DARK, width=4, fill=colors_p[i][j])
            cf2 = font("mono", 48)
            tw = d.textlength(contents[i][j], font=cf2)
            d.text((cx + cell // 2 - tw / 2,
                    cy + cell // 2 - 30), contents[i][j],
                   fill=INK, font=cf2)
    # Ratios
    d.text((lx + 30, ly + 550),
           "Genotype:  1 AA : 2 Aa : 1 aa",
           fill=INK, font=font("sans_bold", 30))
    d.text((lx + 30, ly + 600),
           "Phenotype:  3 dominant : 1 recessive",
           fill=MAROON_DARK, font=font("sans_bold", 34))
    d.text((lx + 30, ly + 650),
           "→  3 : 1",
           fill=ACCENT, font=font("serif_bold", 44))

    # Right: dihybrid panel
    rx = lx + lw + 40
    rw = W - 140 - rx
    d.rounded_rectangle([rx, ly, rx + rw, ly + lh], radius=22,
                        outline=MAROON, width=5, fill=CARD)
    d.text((rx + 30, ly + 20), "DIHYBRID",
           fill=MAROON_DARK, font=font("sans_bold", 36))
    d.text((rx + 30, ly + 70), "AaBb  ×  AaBb",
           fill=MAROON_DARK, font=font("mono", 50))

    # 4x4 dihybrid Punnett (smaller)
    psq_x2 = rx + 100
    psq_y2 = ly + 200
    cell2 = 85
    gametes = ["AB", "Ab", "aB", "ab"]
    # column + row labels
    hf2 = font("mono", 30)
    for j, g in enumerate(gametes):
        tw = d.textlength(g, font=hf2)
        d.text((psq_x2 + j * cell2 + cell2 // 2 - tw / 2, psq_y2 - 50),
               g, fill=MAROON, font=hf2)
    for i, g in enumerate(gametes):
        tw = d.textlength(g, font=hf2)
        d.text((psq_x2 - 60, psq_y2 + i * cell2 + cell2 // 2 - 18),
               g, fill=MAROON, font=hf2)

    # Build grid contents — color by phenotype class
    # 9 A_B_ (both dom)  : ACCENT_LT
    # 3 A_bb (A dom, b rec): a slightly different accent
    # 3 aaB_ (a rec, B dom): another shade
    # 1 aabb : CARD
    AB_color = ACCENT_LT
    Ab_color = (180, 220, 220)   # lighter teal
    aB_color = (200, 230, 200)   # pale green
    ab_color = CARD

    def has_dom(geno_part):
        return "A" in geno_part if "A" in geno_part.upper() else False

    cf3 = font("mono", 22)
    for i, gi in enumerate(gametes):
        for j, gj in enumerate(gametes):
            combined = gi + gj
            # Determine dominance for A and B independently
            a_dom = "A" in combined
            b_dom = "B" in combined
            if a_dom and b_dom:
                fill_c = AB_color
            elif a_dom and not b_dom:
                fill_c = Ab_color
            elif not a_dom and b_dom:
                fill_c = aB_color
            else:
                fill_c = ab_color
            cx = psq_x2 + j * cell2
            cy = psq_y2 + i * cell2
            d.rectangle([cx, cy, cx + cell2, cy + cell2],
                        outline=MAROON_DARK, width=2, fill=fill_c)
            # Sort genotype string for cleanliness: AABb, AaBb, etc.
            # Combine matched letters
            a_part = "".join(sorted([c for c in combined if c in "Aa"],
                                     key=lambda x: (x.lower(), x.islower())))
            b_part = "".join(sorted([c for c in combined if c in "Bb"],
                                     key=lambda x: (x.lower(), x.islower())))
            genotype = a_part + b_part
            tw = d.textlength(genotype, font=cf3)
            d.text((cx + cell2 // 2 - tw / 2,
                    cy + cell2 // 2 - 14), genotype,
                   fill=INK, font=cf3)

    # Ratio text below
    d.text((rx + 30, ly + 580),
           "9  A_B_  :  3  A_bb  :  3  aaB_  :  1  aabb",
           fill=INK, font=font("mono", 28))
    d.text((rx + 30, ly + 630),
           "Phenotype  →  9 : 3 : 3 : 1",
           fill=ACCENT, font=font("serif_bold", 40))
    # legend dots
    for i, (col, lbl) in enumerate([(AB_color, "both dom"),
                                     (Ab_color, "A dom, b rec"),
                                     (aB_color, "a rec, B dom"),
                                     (ab_color, "both rec")]):
        dot_x = rx + 30 + i * 195
        dot_y = ly + 680
        d.rectangle([dot_x, dot_y, dot_x + 30, dot_y + 22],
                    outline=MAROON_DARK, width=2, fill=col)
        d.text((dot_x + 40, dot_y - 4), lbl, fill=MUTED,
               font=font("sans", 18))

    # Bottom warning strip
    d.rounded_rectangle([140, 930, W - 140, 1030], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "9:3:3:1 only works when the two genes are UNLINKED (on different chromosomes).",
             font("sans_bold", 30), 960, MAROON_DARK)
deck.custom("08_monohybrid_dihybrid", monohybrid_dihybrid)


# 09 — non-Mendelian intro: incomplete dominance vs codominance
def non_mendelian_intro(img, d):
    d.text((110, 70), "When Mendel's 3:1 breaks.",
           fill=MAROON, font=font("serif_bold", 60))

    # Left: incomplete dominance
    lx, ly = 140, 200
    lw, lh = 800, 720
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=22,
                        outline=ACCENT, width=6, fill=CARD)
    d.text((lx + 30, ly + 20), "INCOMPLETE DOMINANCE",
           fill=ACCENT, font=font("sans_bold", 34))
    d.text((lx + 30, ly + 70), "heterozygote BLENDS",
           fill=MAROON_DARK, font=font("serif_bold", 36))

    # Snapdragon visual: red + white -> pink
    r_cx, r_cy = lx + 130, ly + 250
    d.ellipse([r_cx - 70, r_cy - 70, r_cx + 70, r_cy + 70],
              fill=(200, 50, 60), outline=MAROON_DARK, width=4)
    centered_t = "RR"
    of = font("mono", 38)
    tw = d.textlength(centered_t, font=of)
    d.text((r_cx - tw / 2, r_cy - 22), centered_t, fill=CREAM, font=of)
    d.text((r_cx - 35, r_cy + 90), "red", fill=INK,
           font=font("sans_bold", 28))

    # x sign
    d.text((lx + 230, r_cy - 22), "×", fill=MAROON_DARK,
           font=font("serif_bold", 60))

    # white
    w_cx, w_cy = lx + 380, ly + 250
    d.ellipse([w_cx - 70, w_cy - 70, w_cx + 70, w_cy + 70],
              fill=(245, 245, 245), outline=MAROON_DARK, width=4)
    tw = d.textlength("rr", font=of)
    d.text((w_cx - tw / 2, w_cy - 22), "rr", fill=MAROON_DARK, font=of)
    d.text((w_cx - 45, w_cy + 90), "white", fill=INK,
           font=font("sans_bold", 28))

    # arrow
    d.text((lx + 470, w_cy - 22), "→", fill=MAROON_DARK,
           font=font("serif_bold", 56))

    # pink
    p_cx, p_cy = lx + 660, ly + 250
    d.ellipse([p_cx - 70, p_cy - 70, p_cx + 70, p_cy + 70],
              fill=(245, 180, 200), outline=MAROON_DARK, width=4)
    tw = d.textlength("Rr", font=of)
    d.text((p_cx - tw / 2, p_cy - 22), "Rr", fill=MAROON_DARK, font=of)
    d.text((p_cx - 35, p_cy + 90), "pink", fill=INK,
           font=font("sans_bold", 28))

    # F2 ratio
    d.text((lx + 30, ly + 430), "Cross two Rr  →  1 RR : 2 Rr : 1 rr",
           fill=INK, font=font("sans_bold", 30))
    d.text((lx + 30, ly + 480),
           "Phenotype:  1 red : 2 pink : 1 white",
           fill=MAROON_DARK, font=font("sans_bold", 32))
    d.text((lx + 30, ly + 540), "→  1 : 2 : 1",
           fill=ACCENT, font=font("serif_bold", 48))
    d.text((lx + 30, ly + 620),
           "Heterozygote is its OWN phenotype,",
           fill=MUTED, font=font("serif_ital", 26))
    d.text((lx + 30, ly + 655),
           "so the 3:1 collapses into 1:2:1.",
           fill=MUTED, font=font("serif_ital", 26))

    # Right: codominance
    rx = lx + lw + 40
    rw = W - 140 - rx
    d.rounded_rectangle([rx, ly, rx + rw, ly + lh], radius=22,
                        outline=MAROON, width=6, fill=CARD)
    d.text((rx + 30, ly + 20), "CODOMINANCE",
           fill=MAROON_DARK, font=font("sans_bold", 34))
    d.text((rx + 30, ly + 70), "heterozygote shows BOTH",
           fill=MAROON_DARK, font=font("serif_bold", 36))

    # ABO type AB: red blood cell with both A and B antigens
    rbc_cx, rbc_cy = rx + 300, ly + 280
    d.ellipse([rbc_cx - 130, rbc_cy - 130, rbc_cx + 130, rbc_cy + 130],
              fill=(220, 80, 90), outline=MAROON_DARK, width=5)
    # Antigen A markers (small triangles)
    for ang_deg in [40, 130]:
        import math
        a = math.radians(ang_deg)
        ax = rbc_cx + 130 * math.cos(a)
        ay = rbc_cy + 130 * math.sin(a)
        d.polygon([(ax - 18, ay + 12), (ax + 18, ay + 12), (ax, ay - 20)],
                  fill=ACCENT, outline=MAROON_DARK, width=3)
    # Antigen B markers (small squares)
    for ang_deg in [220, 320]:
        import math
        a = math.radians(ang_deg)
        bx = rbc_cx + 130 * math.cos(a)
        by = rbc_cy + 130 * math.sin(a)
        d.rectangle([bx - 16, by - 16, bx + 16, by + 16],
                    fill=(140, 90, 180), outline=MAROON_DARK, width=3)

    # Legend
    leg_x = rx + 460
    leg_y = ly + 170
    d.polygon([(leg_x, leg_y + 18), (leg_x + 32, leg_y + 18),
               (leg_x + 16, leg_y - 14)],
              fill=ACCENT, outline=MAROON_DARK, width=3)
    d.text((leg_x + 50, leg_y - 8), "= A antigen", fill=INK,
           font=font("sans", 26))

    d.rectangle([leg_x, leg_y + 70, leg_x + 32, leg_y + 102],
                fill=(140, 90, 180), outline=MAROON_DARK, width=3)
    d.text((leg_x + 50, leg_y + 76), "= B antigen", fill=INK,
           font=font("sans", 26))

    d.text((rx + 30, ly + 480),
           "Type AB  =  Iᴬ Iᴮ",
           fill=MAROON_DARK, font=font("mono", 40))
    d.text((rx + 30, ly + 540),
           "Both antigens fully expressed.",
           fill=INK, font=font("sans_bold", 30))
    d.text((rx + 30, ly + 600),
           "NOT blended.  NOT one masking the other.",
           fill=ACCENT, font=font("sans_bold", 28))
    d.text((rx + 30, ly + 660),
           "Both flags on the same cell.",
           fill=MUTED, font=font("serif_ital", 26))

    # Bottom warning strip
    d.rounded_rectangle([140, 940, W - 140, 1035], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Incomplete dominance → blended phenotype.   Codominance → both at once.",
             font("sans_bold", 30), 970, MAROON_DARK)
deck.custom("09_non_mendelian_intro", non_mendelian_intro)


# 10 — pause + try
deck.pause("10_pause1", "PAUSE  &  TRY",
           "Cross 1:  pink × pink snapdragons.   Cross 2:  AB blood × O blood.",
           "Phenotype ratios?",
           hint="Pause now. Solve it. Press play when you're ready.")

# 11 — duplicate the pause slide for the answer-reveal section
deck.duplicate("10_pause1", "11_pause1_silence")


# 12 — multiple alleles + pleiotropy
def multiple_pleiotropy(img, d):
    d.text((110, 70), "Multiple alleles  +  pleiotropy.",
           fill=MAROON, font=font("serif_bold", 60))

    # Left: multiple alleles — ABO
    lx, ly = 140, 200
    lw, lh = 800, 700
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=22,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((lx + 30, ly + 20), "MULTIPLE ALLELES",
           fill=ACCENT, font=font("sans_bold", 36))
    d.text((lx + 30, ly + 70), ">2 alleles in the population",
           fill=MAROON_DARK, font=font("serif_bold", 30))
    d.text((lx + 30, ly + 115),
           "(any one person still carries only 2)",
           fill=MUTED, font=font("serif_ital", 24))

    # ABO table
    d.text((lx + 30, ly + 180), "ABO blood — 3 alleles:  Iᴬ , Iᴮ , i",
           fill=INK, font=font("sans_bold", 30))

    abo_rows = [
        ("Type A",  "IᴬIᴬ  or  Iᴬi", ACCENT_LT),
        ("Type B",  "IᴮIᴮ  or  Iᴮi", ACCENT_LT),
        ("Type AB", "IᴬIᴮ  (codominant)", (200, 230, 200)),
        ("Type O",  "ii  (recessive)", CARD),
    ]
    ry_row = ly + 240
    for name, geno, col in abo_rows:
        d.rounded_rectangle([lx + 30, ry_row, lx + lw - 30, ry_row + 80],
                            radius=12, outline=MAROON_DARK, width=3, fill=col)
        d.text((lx + 50, ry_row + 22), name, fill=MAROON_DARK,
               font=font("sans_bold", 30))
        d.text((lx + 280, ry_row + 22), geno, fill=INK,
               font=font("mono", 28))
        ry_row += 95

    d.text((lx + 30, ly + 640), "Iᴬ and Iᴮ are codominant.  i is recessive.",
           fill=ACCENT, font=font("sans_bold", 26))

    # Right: pleiotropy — sickle cell
    rx = lx + lw + 40
    rw = W - 140 - rx
    d.rounded_rectangle([rx, ly, rx + rw, ly + lh], radius=22,
                        outline=MAROON, width=5, fill=CARD)
    d.text((rx + 30, ly + 20), "PLEIOTROPY",
           fill=MAROON_DARK, font=font("sans_bold", 36))
    d.text((rx + 30, ly + 70), "ONE gene  →  many traits",
           fill=MAROON_DARK, font=font("serif_bold", 30))

    # Central gene circle
    g_cx, g_cy = rx + 200, ly + 320
    d.ellipse([g_cx - 80, g_cy - 80, g_cx + 80, g_cy + 80],
              fill=MAROON, outline=MAROON_DARK, width=4)
    centered_t = "HbS"
    gf = font("serif_bold", 40)
    tw = d.textlength(centered_t, font=gf)
    d.text((g_cx - tw / 2, g_cy - 26), centered_t, fill=CREAM, font=gf)
    d.text((g_cx - 75, g_cy + 95),
           "sickle-cell allele",
           fill=MUTED, font=font("serif_ital", 22))

    # Effect lines pointing out
    effects = [
        ("Anemia",          (g_cx + 220, g_cy - 130)),
        ("Pain crises",     (g_cx + 270, g_cy - 30)),
        ("Organ damage",    (g_cx + 270, g_cy + 70)),
        ("Malaria resistance", (g_cx + 220, g_cy + 170)),
    ]
    for label, (ex, ey) in effects:
        d.line([(g_cx + 70, g_cy), (ex - 10, ey + 12)],
               fill=ACCENT, width=4)
        d.text((ex, ey), label, fill=INK, font=font("sans_bold", 28))

    d.text((rx + 30, ly + 580),
           "One mutation in hemoglobin →",
           fill=MAROON_DARK, font=font("sans_bold", 28))
    d.text((rx + 30, ly + 620),
           "a cascade of body-wide effects.",
           fill=INK, font=font("sans", 26))

    # Bottom strip
    d.rounded_rectangle([140, 940, W - 140, 1035], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Multiple alleles = how many versions exist.   Pleiotropy = how many traits one gene affects.",
             font("sans_bold", 28), 970, MAROON_DARK)
deck.custom("12_multiple_alleles_pleiotropy", multiple_pleiotropy)


# 13 — sex-linked + polygenic
def sex_polygenic(img, d):
    d.text((110, 70), "Sex-linked  +  polygenic inheritance.",
           fill=MAROON, font=font("serif_bold", 60))

    # Left: sex-linked
    lx, ly = 140, 200
    lw, lh = 800, 720
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=22,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((lx + 30, ly + 20), "SEX-LINKED  (X-linked recessive)",
           fill=ACCENT, font=font("sans_bold", 32))

    # Female XX
    d.text((lx + 30, ly + 100), "Female",
           fill=MAROON_DARK, font=font("serif_bold", 36))
    d.text((lx + 30, ly + 150), "XX  →  needs TWO recessive",
           fill=INK, font=font("sans", 28))
    d.text((lx + 30, ly + 190), "alleles to show the trait.",
           fill=INK, font=font("sans", 28))

    # Draw 2 X chromosomes
    for i, cx in enumerate([lx + 480, lx + 580]):
        cy = ly + 160
        d.line([(cx - 25, cy - 35), (cx + 25, cy + 35)],
               fill=MAROON_DARK, width=8)
        d.line([(cx + 25, cy - 35), (cx - 25, cy + 35)],
               fill=MAROON_DARK, width=8)
        tw = d.textlength("X", font=font("serif_bold", 26))
        d.text((cx - tw / 2, cy + 50), "X", fill=MAROON_DARK,
               font=font("serif_bold", 26))

    # Male XY
    d.text((lx + 30, ly + 320), "Male",
           fill=MAROON_DARK, font=font("serif_bold", 36))
    d.text((lx + 30, ly + 370), "XY  →  HEMIZYGOUS.",
           fill=MAROON, font=font("sans_bold", 30))
    d.text((lx + 30, ly + 415), "Only one X — any recessive",
           fill=INK, font=font("sans", 28))
    d.text((lx + 30, ly + 455), "allele on it is ALWAYS expressed.",
           fill=INK, font=font("sans", 28))

    # X and Y
    cx, cy = lx + 480, ly + 380
    d.line([(cx - 25, cy - 35), (cx + 25, cy + 35)],
           fill=MAROON_DARK, width=8)
    d.line([(cx + 25, cy - 35), (cx - 25, cy + 35)],
           fill=MAROON_DARK, width=8)
    d.text((cx - 8, cy + 50), "X", fill=MAROON_DARK,
           font=font("serif_bold", 26))

    cx2 = lx + 580
    d.line([(cx2 - 22, cy - 35), (cx2, cy)],
           fill=MAROON_DARK, width=8)
    d.line([(cx2 + 22, cy - 35), (cx2, cy)],
           fill=MAROON_DARK, width=8)
    d.line([(cx2, cy), (cx2, cy + 35)],
           fill=MAROON_DARK, width=8)
    d.text((cx2 - 8, cy + 50), "Y", fill=MAROON_DARK,
           font=font("serif_bold", 26))

    # Examples list
    d.text((lx + 30, ly + 540), "Examples (more common in males):",
           fill=MAROON_DARK, font=font("sans_bold", 28))
    for i, ex in enumerate(["Red-green color blindness",
                             "Hemophilia",
                             "Duchenne muscular dystrophy"]):
        d.ellipse([lx + 50, ly + 595 + i * 40 + 8,
                   lx + 64, ly + 595 + i * 40 + 22], fill=ACCENT)
        d.text((lx + 80, ly + 595 + i * 40), ex,
               fill=INK, font=font("sans", 26))

    # Right: polygenic
    rx = lx + lw + 40
    rw = W - 140 - rx
    d.rounded_rectangle([rx, ly, rx + rw, ly + lh], radius=22,
                        outline=MAROON, width=5, fill=CARD)
    d.text((rx + 30, ly + 20), "POLYGENIC INHERITANCE",
           fill=MAROON_DARK, font=font("sans_bold", 32))
    d.text((rx + 30, ly + 75),
           "MANY genes  →  one trait",
           fill=MAROON_DARK, font=font("serif_bold", 30))
    d.text((rx + 30, ly + 130),
           "Produces continuous (not discrete) variation.",
           fill=INK, font=font("sans", 26))

    # Bell curve diagram
    bx = rx + 50
    by = ly + 220
    bw = rw - 100
    bh = 280
    # Axis
    d.line([(bx, by + bh), (bx + bw, by + bh)],
           fill=MAROON_DARK, width=4)
    # Bell curve points
    import math
    pts = []
    for i in range(0, 101, 2):
        t = (i - 50) / 22
        y_val = math.exp(-(t * t) / 2)
        px = bx + i * bw / 100
        py = by + bh - y_val * (bh - 30)
        pts.append((px, py))
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=ACCENT, width=5)
    # Fill under curve
    fill_pts = pts + [(bx + bw, by + bh), (bx, by + bh)]
    d.polygon(fill_pts, fill=ACCENT_LT, outline=ACCENT)
    # Axis labels
    d.text((bx, by + bh + 20), "short", fill=MUTED, font=font("sans", 22))
    d.text((bx + bw - 40, by + bh + 20), "tall", fill=MUTED, font=font("sans", 22))
    d.text((bx + bw // 2 - 30, by + bh + 50), "human height",
           fill=MAROON_DARK, font=font("sans_bold", 28))

    # Examples
    d.text((rx + 30, ly + 580),
           "Examples:",
           fill=MAROON_DARK, font=font("sans_bold", 28))
    for i, ex in enumerate(["Height", "Skin color", "Eye color",
                             "Risk of many common diseases"]):
        d.ellipse([rx + 50, ly + 625 + i * 35 + 7,
                   rx + 64, ly + 625 + i * 35 + 21], fill=MAROON)
        d.text((rx + 80, ly + 625 + i * 35), ex,
               fill=INK, font=font("sans", 24))

    # Bottom strip
    d.rounded_rectangle([140, 940, W - 140, 1035], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Hemizygous = one X.   Polygenic = one trait, many genes, continuous distribution.",
             font("sans_bold", 28), 970, MAROON_DARK)
deck.custom("13_sex_linked_polygenic", sex_polygenic)


# 14 — compare common trap: incomplete dominance vs codominance
deck.compare(
    "14_compare_traps",
    "Common trap:  incomplete dominance  vs.  codominance.",
    left={
        "label": "INCOMPLETE DOMINANCE",
        "color": ACCENT,
        "lines": [
            "Heterozygote = BLEND.",
            "",
            "Red + White  →  Pink.",
            "",
            "One brand-new phenotype",
            "in the middle.",
            "",
            "F2 ratio: 1 : 2 : 1.",
        ],
        "footnote": "Think:  paint mixing.",
    },
    right={
        "label": "CODOMINANCE",
        "color": MAROON,
        "lines": [
            "Heterozygote = BOTH.",
            "",
            "Iᴬ Iᴮ  →  type AB blood.",
            "",
            "Both antigens fully expressed,",
            "side-by-side on the same cell.",
            "",
            "F2 ratio: 1 : 2 : 1.",
        ],
        "footnote": "Think:  two flags on one pole.",
    },
)


# 15 — recap
deck.recap("15_recap", "Recap.", [
    "Meiosis I = reductional (homologs separate).  Meiosis II = equational (sister chromatids).",
    "3 sources of variation:  crossing over · independent assortment · random fertilization.",
    "Mendel's 3 laws:  segregation · independent assortment · dominance.",
    "Monohybrid Aa×Aa → 3:1.   Dihybrid AaBb×AaBb → 9:3:3:1 (unlinked only).",
    "Non-Mendelian:  incomplete dom (blend) · codom (both) · multiple alleles · pleiotropy · polygenic · sex-linked.",
    "Nondisjunction → aneuploidy:  Trisomy 21 (Down), XXY (Klinefelter), XO (Turner).",
], assignment=[
    "1.  Run an AaBb × aabb test cross — predict the phenotype ratio.",
    "2.  Carrier mother (XᴬXᵃ) × unaffected father — what % of sons are affected?",
])


# 16 — path
deck.path("16_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Biology",   "Chapters 12 and 13 — Mendel + patterns of inheritance"),
    ("2.", "Khan Academy AP Bio",     "Unit 5 — Punnett squares, probability, pedigrees"),
    ("3.", "Assignment in dashboard", "Test cross + sex-linked pedigree (above)"),
    ("4.", "Advisor check-in",        "Book a session if dihybrid or sex-linked still feel fuzzy"),
], next_text="Next up:  Module 7 — DNA Structure and Replication.")


print("AP Biology Module 6 slides built.")
