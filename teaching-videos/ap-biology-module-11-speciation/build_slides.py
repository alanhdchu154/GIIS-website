"""AP Biology · Module 11 — Speciation and Phylogeny.

Teal (science) theme auto-resolved from "AP Biology". 17 slides total.
Custom diagrams: hook (horse + donkey → sterile mule), allopatric (population
split by barrier), sympatric (one lake → many cichlids), three-way clade
comparison (mono / para / poly). Pause slide (12) is duplicated to 13 so the
same image plays during both Q and A sections.
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
deck = Deck(course="AP Biology", module_num=11, output_dir="slides", logo_path=LOGO)

ACCENT = deck.accent           # teal
ACCENT_LT = deck.accent_light  # light teal
CARD = deck.card_bg


# 01 — title
deck.title("01_title", "AP Biology",
           "Module 11 — Speciation and Phylogeny",
           "Sample lesson  ·  ~9 minutes")


# 02 — hook: horse + donkey → sterile mule
def hook(img, d):
    d.text((110, 70), "Same genus. They can mate. The baby is sterile.",
           fill=MAROON, font=font("serif_bold", 54))
    d.text((110, 145),
           "So — are horses and donkeys the same species, or different species?",
           fill=MUTED, font=font("sans", 30))

    # Three cards: horse | donkey | mule(red X)
    card_w = 540
    card_h = 540
    gap = 40
    start_x = (W - (card_w * 3 + gap * 2)) // 2
    y0 = 230

    # Horse card
    hx = start_x
    d.rounded_rectangle([hx, y0, hx + card_w, y0 + card_h], radius=24,
                        outline=ACCENT, width=6, fill=CARD)
    d.rectangle([hx, y0, hx + card_w, y0 + 70], fill=ACCENT)
    centered_text = "HORSE"
    cf = font("serif_bold", 38)
    tw = d.textlength(centered_text, font=cf)
    d.text((hx + card_w // 2 - tw / 2, y0 + 16), centered_text,
           fill=CREAM, font=cf)
    # Stylized horse silhouette: body + head + legs
    bx, by = hx + 80, y0 + 250
    d.ellipse([bx, by, bx + 360, by + 130], fill=MAROON_DARK)
    # head
    d.ellipse([bx + 290, by - 60, bx + 420, by + 50], fill=MAROON_DARK)
    # ear
    d.polygon([(bx + 360, by - 60), (bx + 380, by - 100), (bx + 395, by - 50)],
              fill=MAROON_DARK)
    # mane
    d.polygon([(bx + 270, by - 30), (bx + 295, by - 10), (bx + 280, by + 30)],
              fill=MAROON)
    # legs
    for lx_off in (30, 110, 240, 320):
        d.rectangle([bx + lx_off, by + 130, bx + lx_off + 30, by + 230],
                    fill=MAROON_DARK)
    # tail
    d.line([(bx + 5, by + 30), (bx - 30, by + 70)], fill=MAROON_DARK, width=14)

    d.text((hx + 40, y0 + 470), "domestic horse",
           fill=MUTED, font=font("sans", 22))

    # Cross sign
    cx = hx + card_w + gap // 2
    cy = y0 + card_h // 2
    d.text((cx - 18, cy - 50), "+",
           fill=MAROON, font=font("serif_bold", 96))

    # Donkey card
    dx = hx + card_w + gap
    d.rounded_rectangle([dx, y0, dx + card_w, y0 + card_h], radius=24,
                        outline=ACCENT, width=6, fill=CARD)
    d.rectangle([dx, y0, dx + card_w, y0 + 70], fill=ACCENT)
    txt = "DONKEY"
    tw = d.textlength(txt, font=cf)
    d.text((dx + card_w // 2 - tw / 2, y0 + 16), txt,
           fill=CREAM, font=cf)
    # Donkey silhouette — smaller, grayer, big ears
    bx2, by2 = dx + 100, y0 + 260
    d.ellipse([bx2, by2, bx2 + 320, by2 + 120], fill=MUTED)
    d.ellipse([bx2 + 260, by2 - 50, bx2 + 380, by2 + 50], fill=MUTED)
    # Big ears
    d.polygon([(bx2 + 310, by2 - 50), (bx2 + 295, by2 - 130),
               (bx2 + 340, by2 - 60)], fill=MUTED)
    d.polygon([(bx2 + 340, by2 - 50), (bx2 + 360, by2 - 130),
               (bx2 + 370, by2 - 50)], fill=MUTED)
    for lx_off in (20, 100, 220, 290):
        d.rectangle([bx2 + lx_off, by2 + 120, bx2 + lx_off + 26, by2 + 220],
                    fill=MUTED)
    d.line([(bx2 + 5, by2 + 25), (bx2 - 25, by2 + 65)], fill=MUTED, width=12)

    d.text((dx + 40, y0 + 470), "domestic donkey",
           fill=MUTED, font=font("sans", 22))

    # Equals sign
    eqx = dx + card_w + gap // 2
    eqy = y0 + card_h // 2
    d.text((eqx - 24, eqy - 28), "=",
           fill=MAROON, font=font("serif_bold", 80))

    # Mule card with red X
    mx = dx + card_w + gap
    d.rounded_rectangle([mx, y0, mx + card_w, y0 + card_h], radius=24,
                        outline=RED, width=6, fill=CARD)
    d.rectangle([mx, y0, mx + card_w, y0 + 70], fill=RED)
    txt = "MULE — sterile"
    tw = d.textlength(txt, font=cf)
    d.text((mx + card_w // 2 - tw / 2, y0 + 16), txt,
           fill=CREAM, font=cf)
    # Mule silhouette — medium
    bx3, by3 = mx + 90, y0 + 260
    d.ellipse([bx3, by3, bx3 + 340, by3 + 125], fill=INK)
    d.ellipse([bx3 + 275, by3 - 55, bx3 + 400, by3 + 45], fill=INK)
    # mule ears (medium, between horse and donkey)
    d.polygon([(bx3 + 335, by3 - 55), (bx3 + 320, by3 - 110),
               (bx3 + 360, by3 - 55)], fill=INK)
    d.polygon([(bx3 + 360, by3 - 55), (bx3 + 380, by3 - 110),
               (bx3 + 390, by3 - 55)], fill=INK)
    for lx_off in (25, 105, 230, 300):
        d.rectangle([bx3 + lx_off, by3 + 125, bx3 + lx_off + 28, by3 + 225],
                    fill=INK)
    d.line([(bx3 + 5, by3 + 27), (bx3 - 27, by3 + 67)], fill=INK, width=13)

    # Big red X over the mule
    x_pad = 50
    d.line([(mx + x_pad, y0 + 80 + x_pad),
            (mx + card_w - x_pad, y0 + card_h - x_pad)],
           fill=RED, width=14)
    d.line([(mx + card_w - x_pad, y0 + 80 + x_pad),
            (mx + x_pad, y0 + card_h - x_pad)],
           fill=RED, width=14)

    d.text((mx + 40, y0 + 470), "viable, but cannot reproduce",
           fill=RED, font=font("sans_bold", 22))

    # Bottom punchline
    d.rounded_rectangle([110, 820, W - 110, 970], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "The answer depends on which definition of \"species\" you use.",
             font("serif_bold", 34), 850, MAROON_DARK)
    centered(d, "The AP exam has a favorite — and you will learn it next.",
             font("serif_ital", 30), 905, MAROON)
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "What a species actually IS — four concepts, BSC first.",
    "Reproductive isolation — prezygotic vs postzygotic barriers.",
    "How new species form — allopatric, sympatric, parapatric + pace.",
    "Reading the tree of life — clades, synapomorphies, origin of life.",
], footnote="By the end: you can answer the horse-donkey question in three ways.")


# 04 — species concepts (definition)
deck.definition("04_species_concepts",
                "Four species concepts  —  one favorite.",
                "BIOLOGICAL Species Concept (Ernst Mayr)",
                "Interbreed  +  fertile offspring  +  reproductively isolated.  Fails for asexual organisms, prokaryotes (horizontal gene transfer), and fossils — fall back on morphological, ecological, or phylogenetic.")


# 05 — prezygotic isolation (definition with a 5-item list rendered custom-ish)
# The definition method only does one headline; we want all five.
# Use custom to render a 5-row breakdown.
def prezygotic(img, d):
    d.text((110, 70), "Prezygotic isolation  —  block fertilization.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 150),
           "NO zygote ever forms.  Five mechanisms — same area, different reason it never starts.",
           fill=MUTED, font=font("sans", 28))

    rows = [
        ("HABITAT", "Same area, different habitats.",
         "e.g. one aquatic, one terrestrial."),
        ("TEMPORAL", "Different breeding times.",
         "Different season, day, or hour."),
        ("BEHAVIORAL", "Different courtship signals.",
         "Fireflies — each species has its own flash code."),
        ("MECHANICAL", "Incompatible anatomy.",
         "Flower shape ↔ specific pollinator."),
        ("GAMETIC", "Sperm and egg cannot fuse.",
         "Surface-protein mismatch — common in external fertilizers."),
    ]
    y = 230
    box_h = 130
    for label, head, sub in rows:
        d.rounded_rectangle([110, y, W - 110, y + box_h], radius=16,
                            outline=ACCENT, width=4, fill=CARD)
        # label pill
        d.rounded_rectangle([130, y + 20, 470, y + box_h - 20], radius=12,
                            fill=ACCENT)
        lf = font("sans_bold", 32)
        tw = d.textlength(label, font=lf)
        d.text((130 + (340 - tw) / 2, y + 35), label,
               fill=CREAM, font=lf)
        d.text((500, y + 20), head, fill=INK, font=font("sans_bold", 32))
        d.text((500, y + 70), sub, fill=MUTED, font=font("sans", 26))
        y += box_h + 12
deck.custom("05_prezygotic_isolation", prezygotic)


# 06 — postzygotic isolation
def postzygotic(img, d):
    d.text((110, 70), "Postzygotic isolation  —  hybrid is a dead end.",
           fill=MAROON, font=font("serif_bold", 54))
    d.text((110, 150),
           "Fertilization SUCCEEDS — but the hybrid is non-viable, sterile, or its kids fall apart.",
           fill=MUTED, font=font("sans", 28))

    rows = [
        ("REDUCED HYBRID\nVIABILITY",
         "Hybrid embryo dies or fails to develop.",
         "Genetic incompatibility kills it early."),
        ("REDUCED HYBRID\nFERTILITY",
         "Hybrid lives — but cannot reproduce.",
         "The MULE.  Horse × donkey chromosomes can't pair in meiosis."),
        ("HYBRID BREAKDOWN",
         "F1 is fine — F2 is weak or sterile.",
         "Genetic problems surface in the next generation."),
    ]
    y = 240
    box_h = 200
    for label, head, sub in rows:
        d.rounded_rectangle([110, y, W - 110, y + box_h], radius=16,
                            outline=ACCENT, width=4, fill=CARD)
        # label pill
        d.rounded_rectangle([130, y + 20, 520, y + box_h - 20], radius=12,
                            fill=MAROON)
        lf = font("sans_bold", 28)
        lines = label.split("\n")
        ly2 = y + 40 if len(lines) > 1 else y + 70
        for ln in lines:
            tw = d.textlength(ln, font=lf)
            d.text((130 + (390 - tw) / 2, ly2), ln,
                   fill=CREAM, font=lf)
            ly2 += 38
        d.text((550, y + 35), head, fill=INK, font=font("sans_bold", 32))
        d.text((550, y + 100), sub, fill=MUTED, font=font("sans", 26))
        y += box_h + 20

    # Bottom strip — the mule punchline
    d.rounded_rectangle([110, 880, W - 110, 970], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Either way — gene flow between the parent species is BLOCKED.",
             font("sans_bold", 28), 905, MAROON_DARK)
deck.custom("06_postzygotic_isolation", postzygotic)


# 07 — allopatric speciation (custom diagram)
def allopatric(img, d):
    d.text((110, 70), "Allopatric speciation  —  different homelands.",
           fill=MAROON, font=font("serif_bold", 54))
    d.text((110, 150),
           "Geographic barrier splits one population into two.  They evolve independently.  Most common mode on Earth.",
           fill=MUTED, font=font("sans", 26))

    # Three panels: before | barrier | after
    panel_w = 540
    panel_h = 480
    gap = 40
    start_x = (W - (panel_w * 3 + gap * 2)) // 2
    y0 = 230

    # Panel 1: before — one big habitat with one population
    p1x = start_x
    d.rounded_rectangle([p1x, y0, p1x + panel_w, y0 + panel_h], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.rectangle([p1x, y0, p1x + panel_w, y0 + 60], fill=ACCENT)
    txt = "1.  ONE population"
    tf = font("serif_bold", 32)
    tw = d.textlength(txt, font=tf)
    d.text((p1x + panel_w // 2 - tw / 2, y0 + 14), txt,
           fill=CREAM, font=tf)
    # Habitat
    d.rounded_rectangle([p1x + 40, y0 + 100, p1x + panel_w - 40, y0 + panel_h - 40],
                        radius=16, fill=ACCENT_LT)
    # Fish dots
    import random
    random.seed(11)
    for i in range(14):
        fx = p1x + 80 + random.randint(0, panel_w - 200)
        fy = y0 + 150 + random.randint(0, panel_h - 220)
        d.ellipse([fx - 14, fy - 8, fx + 14, fy + 8], fill=MAROON_DARK)
        d.polygon([(fx - 14, fy), (fx - 24, fy - 10), (fx - 24, fy + 10)],
                  fill=MAROON_DARK)

    # Panel 2: barrier appears
    p2x = p1x + panel_w + gap
    d.rounded_rectangle([p2x, y0, p2x + panel_w, y0 + panel_h], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.rectangle([p2x, y0, p2x + panel_w, y0 + 60], fill=ACCENT)
    txt = "2.  Barrier rises"
    tw = d.textlength(txt, font=tf)
    d.text((p2x + panel_w // 2 - tw / 2, y0 + 14), txt,
           fill=CREAM, font=tf)
    # Two habitat halves
    d.rounded_rectangle([p2x + 40, y0 + 100, p2x + panel_w // 2 - 30, y0 + panel_h - 40],
                        radius=16, fill=ACCENT_LT)
    d.rounded_rectangle([p2x + panel_w // 2 + 30, y0 + 100, p2x + panel_w - 40, y0 + panel_h - 40],
                        radius=16, fill=ACCENT_LT)
    # Barrier (mountains)
    bxm = p2x + panel_w // 2 - 30
    bym = y0 + 100
    bhm = panel_h - 140
    d.polygon([(bxm, bym + bhm), (bxm + 30, bym + 40), (bxm + 60, bym + bhm)],
              fill=MUTED)
    d.polygon([(bxm + 10, bym + bhm), (bxm + 30, bym + 80), (bxm + 50, bym + bhm)],
              fill=INK)
    # Fish split
    random.seed(22)
    for i in range(6):
        fx = p2x + 80 + random.randint(0, panel_w // 2 - 130)
        fy = y0 + 150 + random.randint(0, panel_h - 220)
        d.ellipse([fx - 14, fy - 8, fx + 14, fy + 8], fill=MAROON_DARK)
        d.polygon([(fx - 14, fy), (fx - 24, fy - 10), (fx - 24, fy + 10)],
                  fill=MAROON_DARK)
    for i in range(6):
        fx = p2x + panel_w // 2 + 60 + random.randint(0, panel_w // 2 - 130)
        fy = y0 + 150 + random.randint(0, panel_h - 220)
        d.ellipse([fx - 14, fy - 8, fx + 14, fy + 8], fill=MAROON_DARK)
        d.polygon([(fx - 14, fy), (fx - 24, fy - 10), (fx - 24, fy + 10)],
                  fill=MAROON_DARK)

    # Panel 3: two species
    p3x = p2x + panel_w + gap
    d.rounded_rectangle([p3x, y0, p3x + panel_w, y0 + panel_h], radius=20,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    d.rectangle([p3x, y0, p3x + panel_w, y0 + 60], fill=MAROON)
    txt = "3.  TWO species"
    tw = d.textlength(txt, font=tf)
    d.text((p3x + panel_w // 2 - tw / 2, y0 + 14), txt,
           fill=CREAM, font=tf)
    d.rounded_rectangle([p3x + 40, y0 + 100, p3x + panel_w // 2 - 30, y0 + panel_h - 40],
                        radius=16, fill=CARD)
    d.rounded_rectangle([p3x + panel_w // 2 + 30, y0 + 100, p3x + panel_w - 40, y0 + panel_h - 40],
                        radius=16, fill=CARD)
    # Barrier
    bxm = p3x + panel_w // 2 - 30
    bym = y0 + 100
    d.polygon([(bxm, bym + bhm), (bxm + 30, bym + 40), (bxm + 60, bym + bhm)],
              fill=MUTED)
    d.polygon([(bxm + 10, bym + bhm), (bxm + 30, bym + 80), (bxm + 50, bym + bhm)],
              fill=INK)
    # Species A (teal) on left
    random.seed(33)
    for i in range(7):
        fx = p3x + 80 + random.randint(0, panel_w // 2 - 130)
        fy = y0 + 150 + random.randint(0, panel_h - 220)
        d.ellipse([fx - 14, fy - 8, fx + 14, fy + 8], fill=ACCENT)
        d.polygon([(fx - 14, fy), (fx - 24, fy - 10), (fx - 24, fy + 10)],
                  fill=ACCENT)
    # Species B (maroon) on right
    for i in range(7):
        fx = p3x + panel_w // 2 + 60 + random.randint(0, panel_w // 2 - 130)
        fy = y0 + 150 + random.randint(0, panel_h - 220)
        d.ellipse([fx - 14, fy - 8, fx + 14, fy + 8], fill=MAROON)
        d.polygon([(fx - 14, fy), (fx - 24, fy - 10), (fx - 24, fy + 10)],
                  fill=MAROON)

    # Examples strip
    d.rounded_rectangle([110, 760, W - 110, 970], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    d.text((150, 780), "Classic examples",
           fill=MAROON_DARK, font=font("serif_bold", 36))
    d.text((150, 840),
           "·  Death Valley pupfish — trapped in isolated desert springs as ancient lakes dried up.",
           fill=INK, font=font("sans", 28))
    d.text((150, 890),
           "·  Galápagos finches — each island shaped a different beak; ~17 species today.",
           fill=INK, font=font("sans", 28))
deck.custom("07_allopatric", allopatric)


# 08 — sympatric speciation
def sympatric(img, d):
    d.text((110, 70), "Sympatric speciation  —  same homeland.",
           fill=MAROON, font=font("serif_bold", 54))
    d.text((110, 150),
           "NO geographic barrier — yet new species form.  Three main routes (+ parapatric in between).",
           fill=MUTED, font=font("sans", 28))

    # Left: one lake, many colored cichlids
    lx, ly = 110, 230
    lw, lh = 870, 580
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.rectangle([lx, ly, lx + lw, ly + 60], fill=ACCENT)
    txt = "ONE lake  ·  many species"
    tf = font("serif_bold", 32)
    tw = d.textlength(txt, font=tf)
    d.text((lx + lw // 2 - tw / 2, ly + 14), txt,
           fill=CREAM, font=tf)

    # Lake shape (oval)
    d.ellipse([lx + 40, ly + 110, lx + lw - 40, ly + lh - 40],
              fill=ACCENT_LT, outline=MAROON_DARK, width=4)

    # Colored cichlids — different colors = different species in same lake
    fish_data = [
        (lx + 200, ly + 240, MAROON),
        (lx + 380, ly + 280, ACCENT),
        (lx + 560, ly + 230, MAROON_DARK),
        (lx + 700, ly + 310, (220, 140, 60)),  # orange
        (lx + 260, ly + 380, (60, 120, 180)),  # blue
        (lx + 440, ly + 420, MAROON),
        (lx + 620, ly + 400, (140, 80, 160)),  # purple
        (lx + 300, ly + 480, ACCENT),
        (lx + 540, ly + 480, (220, 140, 60)),
    ]
    for fx, fy, color in fish_data:
        d.ellipse([fx - 26, fy - 14, fx + 26, fy + 14], fill=color)
        d.polygon([(fx - 26, fy), (fx - 42, fy - 18), (fx - 42, fy + 18)],
                  fill=color)
        # eye
        d.ellipse([fx + 14, fy - 4, fx + 22, fy + 4], fill=CREAM)
        d.ellipse([fx + 16, fy - 2, fx + 20, fy + 2], fill=INK)

    d.text((lx + 30, ly + lh - 30),
           "African Great Lakes — hundreds of cichlid species per lake, driven by female mate choice.",
           fill=MAROON_DARK, font=font("sans_bold", 22))

    # Right: three routes card
    rx = lx + lw + 30
    rw = W - 110 - rx
    rh = 580
    d.rounded_rectangle([rx, ly, rx + rw, ly + rh], radius=20,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    d.text((rx + 30, ly + 20), "Three routes",
           fill=MAROON_DARK, font=font("serif_bold", 42))

    routes = [
        ("POLYPLOIDY",
         "Chromosome count multiplies in one generation.",
         "auto (within species)  vs  allo (hybrid + doubling).",
         "Bread wheat is allopolyploid."),
        ("SEXUAL SELECTION",
         "Female mate choice splits one population.",
         "Cichlid color preference drives divergence.",
         ""),
        ("HABITAT",
         "Different microhabitats — same region.",
         "Selection diverges populations in place.",
         ""),
    ]
    y_r = ly + 100
    for label, head, sub, extra in routes:
        d.text((rx + 30, y_r), label,
               fill=MAROON, font=font("serif_bold", 30))
        d.text((rx + 30, y_r + 42), head,
               fill=INK, font=font("sans_bold", 22))
        d.text((rx + 30, y_r + 74), sub,
               fill=MUTED, font=font("sans", 20))
        if extra:
            d.text((rx + 30, y_r + 102), extra,
                   fill=ACCENT, font=font("sans_bold", 20))
            y_r += 165
        else:
            y_r += 145

    # Bottom strip: parapatric
    d.rounded_rectangle([110, 840, W - 110, 970], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    d.text((150, 860), "PARAPATRIC — the in-between case.",
           fill=MAROON_DARK, font=font("serif_bold", 32))
    d.text((150, 910),
           "Ranges partially overlap; selection pressure changes along an environmental gradient.",
           fill=INK, font=font("sans", 26))
deck.custom("08_sympatric", sympatric)


# 09 — pace: gradualism vs punctuated equilibrium
def pace_compare(img, d):
    d.text((110, 70), "Pace  —  gradualism vs punctuated equilibrium.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 150),
           "Both happen.  The fossil record shows both patterns in different lineages.",
           fill=MUTED, font=font("sans", 28))

    # Two side-by-side panels with graphs
    panel_w = 870
    panel_h = 640
    gap = 30
    start_x = (W - (panel_w * 2 + gap)) // 2
    y0 = 230

    # Left: gradualism
    lx = start_x
    d.rounded_rectangle([lx, y0, lx + panel_w, y0 + panel_h], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.rectangle([lx, y0, lx + panel_w, y0 + 80], fill=ACCENT)
    txt = "GRADUALISM"
    tf = font("serif_bold", 44)
    tw = d.textlength(txt, font=tf)
    d.text((lx + panel_w // 2 - tw / 2, y0 + 18), txt,
           fill=CREAM, font=tf)

    # Graph axes
    gx0 = lx + 100
    gy0 = y0 + panel_h - 200
    gx1 = lx + panel_w - 60
    gy1 = y0 + 130
    d.line([(gx0, gy1), (gx0, gy0)], fill=MAROON_DARK, width=4)
    d.line([(gx0, gy0), (gx1, gy0)], fill=MAROON_DARK, width=4)
    d.text((lx + 20, y0 + 110), "trait",
           fill=MAROON_DARK, font=font("sans_bold", 22))
    d.text((gx1 - 60, gy0 + 14), "time →",
           fill=MAROON_DARK, font=font("sans_bold", 22))
    # Smooth diagonal
    d.line([(gx0 + 20, gy0 - 20), (gx1 - 20, gy1 + 20)],
           fill=MAROON, width=8)

    d.text((lx + 30, y0 + panel_h - 150),
           "Tiny changes accumulate steadily,",
           fill=INK, font=font("sans", 26))
    d.text((lx + 30, y0 + panel_h - 115),
           "generation by generation, over",
           fill=INK, font=font("sans", 26))
    d.text((lx + 30, y0 + panel_h - 80),
           "millions of years.",
           fill=INK, font=font("sans", 26))
    d.text((lx + 30, y0 + panel_h - 35),
           "Darwin's original picture.",
           fill=ACCENT, font=font("sans_bold", 26))

    # Right: punctuated equilibrium
    rx = lx + panel_w + gap
    d.rounded_rectangle([rx, y0, rx + panel_w, y0 + panel_h], radius=20,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    d.rectangle([rx, y0, rx + panel_w, y0 + 80], fill=MAROON)
    txt = "PUNCTUATED EQUILIBRIUM"
    tw = d.textlength(txt, font=tf)
    d.text((rx + panel_w // 2 - tw / 2, y0 + 18), txt,
           fill=CREAM, font=tf)

    gx0 = rx + 100
    gy0 = y0 + panel_h - 200
    gx1 = rx + panel_w - 60
    gy1 = y0 + 130
    d.line([(gx0, gy1), (gx0, gy0)], fill=MAROON_DARK, width=4)
    d.line([(gx0, gy0), (gx1, gy0)], fill=MAROON_DARK, width=4)
    d.text((rx + 20, y0 + 110), "trait",
           fill=MAROON_DARK, font=font("sans_bold", 22))
    d.text((gx1 - 60, gy0 + 14), "time →",
           fill=MAROON_DARK, font=font("sans_bold", 22))
    # Step function
    span_x = gx1 - gx0
    span_y = gy0 - gy1
    pts = [
        (gx0 + 20,             gy0 - 20),
        (gx0 + int(span_x * 0.35), gy0 - 20),
        (gx0 + int(span_x * 0.4),  gy0 - int(span_y * 0.45)),
        (gx0 + int(span_x * 0.7),  gy0 - int(span_y * 0.45)),
        (gx0 + int(span_x * 0.75), gy0 - int(span_y * 0.85)),
        (gx1 - 20,             gy0 - int(span_y * 0.85)),
    ]
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=MAROON, width=8)

    d.text((rx + 30, y0 + panel_h - 150),
           "Long stasis — then a relatively",
           fill=INK, font=font("sans", 26))
    d.text((rx + 30, y0 + panel_h - 115),
           "rapid burst.  Eldredge + Gould.",
           fill=INK, font=font("sans", 26))
    d.text((rx + 30, y0 + panel_h - 80),
           "NOT saltation — still gradual,",
           fill=MAROON, font=font("sans_bold", 26))
    d.text((rx + 30, y0 + panel_h - 45),
           "just compressed against geo time.",
           fill=MAROON, font=font("sans_bold", 26))

    # Bottom strip
    d.rounded_rectangle([110, 900, W - 110, 1000], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "AP move:  flat-then-jump = punctuated.   Steady slope = gradual.",
             font("sans_bold", 30), 928, MAROON_DARK)
deck.custom("09_pace", pace_compare)


# 10 — phylogeny basics (definition + custom tree diagram)
def phylogeny_basics(img, d):
    d.text((110, 70), "Reading a phylogenetic tree.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 160),
           "Tree / cladogram = hypothesis about evolutionary relationships.  Small vocab, big AP exam weight.",
           fill=MUTED, font=font("sans", 26))

    # Left: tree diagram
    lx, ly = 110, 230
    lw, lh = 980, 720
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((lx + 30, ly + 20), "A simple tree",
           fill=ACCENT, font=font("serif_bold", 38))

    # Draw a 4-taxa tree (A, B, C, D) + outgroup
    # Layout: tips at top, root at bottom-left
    tip_y = ly + 120
    base_y = ly + lh - 100
    tips_x = [lx + 200, lx + 380, lx + 560, lx + 740, lx + 900]
    tip_labels = ["Outgroup", "A", "B", "C", "D"]

    # Vertical branches to tips
    for tx in tips_x:
        d.line([(tx, tip_y), (tx, tip_y + 80)], fill=MAROON_DARK, width=6)

    # Node levels (deeper = older)
    n1_y = tip_y + 130  # A+B node
    n2_y = tip_y + 130  # C+D node
    n3_y = tip_y + 230  # (A+B)+(C+D)
    n4_y = base_y       # outgroup junction

    # Draw horizontals at each node
    # A+B horizontal
    d.line([(tips_x[1], n1_y), (tips_x[2], n1_y)], fill=MAROON_DARK, width=6)
    # C+D horizontal
    d.line([(tips_x[3], n2_y), (tips_x[4], n2_y)], fill=MAROON_DARK, width=6)
    # Drop from A+B and C+D centers down to deeper node
    ab_cx = (tips_x[1] + tips_x[2]) // 2
    cd_cx = (tips_x[3] + tips_x[4]) // 2
    d.line([(ab_cx, n1_y), (ab_cx, n3_y)], fill=MAROON_DARK, width=6)
    d.line([(cd_cx, n2_y), (cd_cx, n3_y)], fill=MAROON_DARK, width=6)
    # (A+B)+(C+D) horizontal
    d.line([(ab_cx, n3_y), (cd_cx, n3_y)], fill=MAROON_DARK, width=6)
    # ingroup center
    in_cx = (ab_cx + cd_cx) // 2
    d.line([(in_cx, n3_y), (in_cx, n4_y)], fill=MAROON_DARK, width=6)
    # outgroup horizontal
    d.line([(tips_x[0], n4_y), (in_cx, n4_y)], fill=MAROON_DARK, width=6)
    d.line([(tips_x[0], n4_y), (tips_x[0], tip_y + 80)], fill=MAROON_DARK, width=6)

    # Tip labels
    for tx, lbl in zip(tips_x, tip_labels):
        tf = font("sans_bold", 28)
        tw = d.textlength(lbl, font=tf)
        d.text((tx - tw / 2, tip_y - 50), lbl,
               fill=MAROON_DARK, font=tf)
        # tip dot
        d.ellipse([tx - 10, tip_y - 10, tx + 10, tip_y + 10], fill=ACCENT)

    # Node dots
    for nx, ny in [(ab_cx, n1_y), (cd_cx, n2_y), (in_cx, n3_y),
                   ((tips_x[0] + in_cx) // 2, n4_y)]:
        d.ellipse([nx - 12, ny - 12, nx + 12, ny + 12], fill=MAROON)

    # Annotations
    d.text((lx + 30, tip_y - 50), "tips →",
           fill=MAROON_DARK, font=font("sans_bold", 24))
    d.text((lx + 30, n3_y - 14), "node →",
           fill=MAROON, font=font("sans_bold", 24))
    d.text((lx + 30, n4_y - 14), "root →",
           fill=MAROON, font=font("sans_bold", 24))
    d.text((lx + lw - 270, n1_y + 30), "branch",
           fill=MAROON_DARK, font=font("sans_bold", 24))

    # Time arrow
    d.line([(lx + lw - 60, tip_y), (lx + lw - 60, base_y)],
           fill=MUTED, width=4)
    d.polygon([(lx + lw - 70, base_y - 10), (lx + lw - 50, base_y - 10),
               (lx + lw - 60, base_y + 10)], fill=MUTED)
    d.text((lx + lw - 50, (tip_y + base_y) // 2 - 40), "time →",
           fill=MUTED, font=font("sans_bold", 22))

    # Right: vocab card
    rx = lx + lw + 30
    rw = W - 110 - rx
    rh = 720
    d.rounded_rectangle([rx, ly, rx + rw, ly + rh], radius=20,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    d.text((rx + 30, ly + 20), "Vocab + traps",
           fill=MAROON_DARK, font=font("serif_bold", 36))

    items = [
        ("NODE", "common ancestor"),
        ("BRANCH", "a lineage through time"),
        ("TIP", "extant taxon or fossil"),
        ("OUTGROUP", "roots the tree"),
        ("MOLECULAR CLOCK", "neutral mutations → time"),
    ]
    y_r = ly + 90
    for k, v in items:
        d.text((rx + 30, y_r), k,
               fill=MAROON, font=font("serif_bold", 26))
        d.text((rx + 30, y_r + 36), v,
               fill=INK, font=font("sans", 22))
        y_r += 90

    # Traps
    d.text((rx + 30, y_r), "AP traps",
           fill=MAROON, font=font("serif_bold", 28))
    y_r += 50
    traps = [
        "Tips can ROTATE.",
        "No tip is more evolved.",
        "Humans share an ancestor",
        "with chimps — NOT descended.",
    ]
    for t in traps:
        d.text((rx + 30, y_r), "·  " + t,
               fill=INK, font=font("sans", 20))
        y_r += 38
deck.custom("10_phylogeny_basics", phylogeny_basics)


# 11 — clades compare — three-way (mono / para / poly)
def clades_compare(img, d):
    d.text((110, 70), "Clades  —  only ONE of these is real.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 150),
           "Clade = ancestor + ALL descendants.  Defined by a synapomorphy (shared derived trait, RELATIVE to clade).",
           fill=MUTED, font=font("sans", 26))

    # Three columns
    panel_w = 580
    panel_h = 640
    gap = 30
    start_x = (W - (panel_w * 3 + gap * 2)) // 2
    y0 = 230

    columns = [
        ("MONOPHYLETIC", ACCENT, "= a real CLADE",
         "Ancestor + ALL descendants.",
         "Mammalia.  Aves.  Archosauria",
         "(crocs + dinosaurs + pterosaurs;",
         "BIRDS are dinosaurs cladistically).",
         True),
        ("PARAPHYLETIC", (220, 140, 60), "NOT a clade",
         "Ancestor + SOME descendants.",
         "\"Reptiles\" if you exclude birds.",
         "But birds DESCEND from reptiles —",
         "leaving them out breaks the rule.",
         False),
        ("POLYPHYLETIC", RED, "NOT a clade",
         "Members from different ancestors.",
         "\"Warm-blooded animals\" =",
         "mammals + birds.  Endothermy",
         "evolved twice — convergent.",
         False),
    ]

    for i, (label, color, sub, head, l1, l2, l3, is_clade) in enumerate(columns):
        px = start_x + i * (panel_w + gap)
        d.rounded_rectangle([px, y0, px + panel_w, y0 + panel_h], radius=20,
                            outline=color, width=6,
                            fill=CARD if is_clade else ACCENT_LT)
        d.rectangle([px, y0, px + panel_w, y0 + 90], fill=color)
        lf = font("serif_bold", 36)
        tw = d.textlength(label, font=lf)
        d.text((px + panel_w // 2 - tw / 2, y0 + 14), label,
               fill=CREAM, font=lf)
        sf = font("sans_bold", 22)
        tw_s = d.textlength(sub, font=sf)
        d.text((px + panel_w // 2 - tw_s / 2, y0 + 60), sub,
               fill=CREAM, font=sf)

        # Mini tree visual
        tree_y = y0 + 130
        if i == 0:
            # Mono: shade the whole clade
            d.rounded_rectangle([px + 60, tree_y, px + panel_w - 60, tree_y + 160],
                                radius=12, fill=ACCENT_LT, outline=color, width=3)
            tips = [px + 100, px + 200, px + 300, px + 400, px + 480]
            for t in tips:
                d.line([(t, tree_y + 20), (t, tree_y + 100)],
                       fill=MAROON_DARK, width=4)
                d.ellipse([t - 8, tree_y + 12, t + 8, tree_y + 28], fill=color)
            d.line([(tips[0], tree_y + 100), (tips[-1], tree_y + 100)],
                   fill=MAROON_DARK, width=4)
            cx_t = (tips[0] + tips[-1]) // 2
            d.line([(cx_t, tree_y + 100), (cx_t, tree_y + 140)],
                   fill=MAROON_DARK, width=4)
        elif i == 1:
            # Para: shaded with one tip cut out
            d.rounded_rectangle([px + 60, tree_y, px + panel_w - 60, tree_y + 160],
                                radius=12, fill=ACCENT_LT, outline=color, width=3)
            tips = [px + 100, px + 200, px + 300, px + 400, px + 480]
            for j, t in enumerate(tips):
                d.line([(t, tree_y + 20), (t, tree_y + 100)],
                       fill=MAROON_DARK, width=4)
                col_dot = INK if j == 4 else color
                if j == 4:
                    # X out the excluded tip
                    d.line([(t - 12, tree_y + 0), (t + 12, tree_y + 24)],
                           fill=RED, width=4)
                    d.line([(t + 12, tree_y + 0), (t - 12, tree_y + 24)],
                           fill=RED, width=4)
                else:
                    d.ellipse([t - 8, tree_y + 12, t + 8, tree_y + 28], fill=col_dot)
            d.line([(tips[0], tree_y + 100), (tips[-1], tree_y + 100)],
                   fill=MAROON_DARK, width=4)
            cx_t = (tips[0] + tips[-1]) // 2
            d.line([(cx_t, tree_y + 100), (cx_t, tree_y + 140)],
                   fill=MAROON_DARK, width=4)
        else:
            # Poly: two unrelated groups highlighted
            tips = [px + 100, px + 200, px + 300, px + 400, px + 480]
            for j, t in enumerate(tips):
                d.line([(t, tree_y + 20), (t, tree_y + 100)],
                       fill=MAROON_DARK, width=4)
                col_dot = color if j in (0, 3) else INK
                d.ellipse([t - 8, tree_y + 12, t + 8, tree_y + 28], fill=col_dot)
            d.line([(tips[0], tree_y + 100), (tips[-1], tree_y + 100)],
                   fill=MAROON_DARK, width=4)
            cx_t = (tips[0] + tips[-1]) // 2
            d.line([(cx_t, tree_y + 100), (cx_t, tree_y + 140)],
                   fill=MAROON_DARK, width=4)
            # Highlight the two unrelated tips with dashed boxes
            for j in (0, 3):
                t = tips[j]
                d.rectangle([t - 18, tree_y + 2, t + 18, tree_y + 38],
                            outline=color, width=4)

        # Text under tree
        body_y = tree_y + 200
        bf = font("sans_bold", 24)
        d.text((px + 30, body_y), head, fill=MAROON_DARK, font=bf)
        nf = font("sans", 22)
        d.text((px + 30, body_y + 50), l1, fill=INK, font=nf)
        d.text((px + 30, body_y + 85), l2, fill=INK, font=nf)
        d.text((px + 30, body_y + 120), l3, fill=INK, font=nf)

    # Bottom strip: synapomorphy is relative
    d.rounded_rectangle([110, 900, W - 110, 1000], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Vertebral column = synapomorphy of Vertebrata.  Same trait = plesiomorphy for Mammalia.",
             font("sans_bold", 26), 928, MAROON_DARK)
deck.custom("11_clades_compare", clades_compare)


# 12 — pause + try (finch + island bridge)
deck.pause("12_pause1", "PAUSE  &  TRY",
           "Two finch populations isolated by sea level rise. When they rejoin, females reject foreign males' songs. What MODE? What ISOLATION type?",
           "MODE  +  ISOLATION  =  ?",
           hint="Pause now. Solve it. Press play when you're ready.")

# 13 — duplicate for the answer-reveal section
deck.duplicate("12_pause1", "13_pause1_silence")


# 14 — extinction + variation
def extinction_variation(img, d):
    d.text((110, 70), "Mass extinction  +  genetic variation.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 150),
           "Extinction resets the playing field.  Variation determines who can survive what comes next.",
           fill=MUTED, font=font("sans", 28))

    # Left: five mass extinctions (timeline)
    lx, ly = 110, 240
    lw, lh = 1080, 680
    d.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.text((lx + 30, ly + 20), "The Big Five",
           fill=ACCENT, font=font("serif_bold", 42))

    extinctions = [
        ("Ordovician",  "~444 Mya", False),
        ("Devonian",    "~375 Mya", False),
        ("Permian",     "~252 Mya", True),   # the Great Dying
        ("Triassic",    "~201 Mya", False),
        ("Cretaceous-Paleogene", "~66 Mya", True),  # K-Pg
    ]
    # Timeline bar
    tx0 = lx + 80
    tx1 = lx + lw - 80
    ty = ly + 200
    d.line([(tx0, ty), (tx1, ty)], fill=MAROON_DARK, width=8)
    # Tick positions evenly spaced
    n = len(extinctions)
    for i, (name, age, big) in enumerate(extinctions):
        cx_e = tx0 + int((i + 0.5) * (tx1 - tx0) / n)
        # Dot
        r = 22 if big else 14
        d.ellipse([cx_e - r, ty - r, cx_e + r, ty + r],
                  fill=MAROON if big else ACCENT)
        # Name
        nf = font("sans_bold", 22 if not big else 26)
        tw = d.textlength(name, font=nf)
        d.text((cx_e - tw / 2, ty - 80),
               name, fill=MAROON_DARK if big else INK, font=nf)
        # Age below
        af = font("sans", 20)
        tw_a = d.textlength(age, font=af)
        d.text((cx_e - tw_a / 2, ty + 40), age,
               fill=MUTED, font=af)

    # Permian + K-Pg detail boxes
    box_y = ly + 320
    box_h = 280

    # Permian
    pbx = lx + 50
    pbw = (lw - 130) // 2
    d.rounded_rectangle([pbx, box_y, pbx + pbw, box_y + box_h], radius=16,
                        outline=MAROON, width=4, fill=ACCENT_LT)
    d.text((pbx + 24, box_y + 20), "PERMIAN  ·  \"the Great Dying\"",
           fill=MAROON_DARK, font=font("serif_bold", 30))
    d.text((pbx + 24, box_y + 80),
           "~96% of marine species lost.",
           fill=INK, font=font("sans_bold", 28))
    d.text((pbx + 24, box_y + 130),
           "Biggest extinction event in",
           fill=INK, font=font("sans", 26))
    d.text((pbx + 24, box_y + 165),
           "Earth's history.",
           fill=INK, font=font("sans", 26))
    d.text((pbx + 24, box_y + 220),
           "Reset → bursts of new speciation.",
           fill=MAROON, font=font("sans_bold", 24))

    # K-Pg
    kbx = pbx + pbw + 30
    d.rounded_rectangle([kbx, box_y, kbx + pbw, box_y + box_h], radius=16,
                        outline=MAROON, width=4, fill=ACCENT_LT)
    d.text((kbx + 24, box_y + 20), "CRETACEOUS-PALEOGENE  ·  K-Pg",
           fill=MAROON_DARK, font=font("serif_bold", 30))
    d.text((kbx + 24, box_y + 80),
           "Asteroid impact, ~66 Mya.",
           fill=INK, font=font("sans_bold", 28))
    d.text((kbx + 24, box_y + 130),
           "End of the non-avian dinosaurs;",
           fill=INK, font=font("sans", 26))
    d.text((kbx + 24, box_y + 165),
           "mammals rise.",
           fill=INK, font=font("sans", 26))
    d.text((kbx + 24, box_y + 220),
           "Niches open → mammalian radiation.",
           fill=MAROON, font=font("sans_bold", 24))

    # Bottom strip: genetic variation
    d.rounded_rectangle([110, 940, W - 110, 1020], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Bottleneck → low diversity → fragile species.  Northern elephant seal: fewer than 100 individuals in the late 1800s.",
             font("sans_bold", 24), 962, MAROON_DARK)
deck.custom("14_extinction_variation", extinction_variation)


# 15 — origin of life
def origin_of_life(img, d):
    d.text((110, 70), "Origin of life  —  four pieces the AP wants.",
           fill=MAROON, font=font("serif_bold", 54))

    panels = [
        ("MILLER-UREY  ·  1953",
         "Sparked CH4, NH3, H2, H2O vapor",
         "with electricity → amino acids.",
         "Organic monomers CAN form abiotically.",
         "(Early-Earth atmosphere now thought",
         "to be less reducing — principle holds.)"),
        ("RNA WORLD HYPOTHESIS",
         "RNA can do TWO jobs:",
         "store info (like DNA) +",
         "catalyze (ribozymes).",
         "Possible first self-replicator,",
         "before DNA and protein."),
        ("LUCA",
         "Last Universal Common Ancestor.",
         "~3.5 billion years ago.",
         "Inferred from the universal",
         "genetic code + shared core",
         "molecular machinery in all life."),
        ("ENDOSYMBIOSIS  ·  Lynn Margulis",
         "Mitochondria + chloroplasts",
         "= engulfed prokaryotes.",
         "Evidence:  double membrane,",
         "own circular DNA, 70S ribosomes,",
         "reproduce by binary fission."),
    ]

    card_w = 870
    card_h = 380
    gap_x = 30
    gap_y = 30
    start_x = (W - (card_w * 2 + gap_x)) // 2
    y0 = 170
    for i, panel in enumerate(panels):
        title, *lines = panel
        col = i % 2
        row = i // 2
        bx = start_x + col * (card_w + gap_x)
        by = y0 + row * (card_h + gap_y)
        outline_color = ACCENT if i in (0, 3) else MAROON
        d.rounded_rectangle([bx, by, bx + card_w, by + card_h],
                            radius=20, outline=outline_color, width=5,
                            fill=CARD)
        d.rectangle([bx, by, bx + card_w, by + 70], fill=outline_color)
        tf = font("serif_bold", 32)
        d.text((bx + 24, by + 18), title,
               fill=CREAM, font=tf)
        ly_l = by + 95
        for line in lines:
            d.text((bx + 30, ly_l), line,
                   fill=INK, font=font("sans", 26))
            ly_l += 44

    # Bottom strip
    d.rounded_rectangle([110, 970, W - 110, 1050], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Chemistry → RNA world → LUCA → eukaryote cell via endosymbiosis.",
             font("sans_bold", 28), 992, MAROON_DARK)
deck.custom("15_origin_of_life", origin_of_life)


# 16 — recap
deck.recap("16_recap", "Recap.", [
    "Species: BSC = interbreed + fertile + isolated.  Fallbacks: morphological, ecological, phylogenetic.",
    "Prezygotic = no zygote (5 types).  Postzygotic = no viable / fertile offspring (mule is the case).",
    "Allopatric = barrier (most common).  Sympatric = no barrier (polyploidy, sexual selection, habitat).",
    "Gradualism = steady slope.  Punctuated equilibrium = stasis then burst — still gradual, not saltation.",
    "Clade = ancestor + ALL descendants.  Synapomorphy defines it — RELATIVE to which clade.",
    "Mass extinctions reset niches.  Origin: Miller-Urey, RNA world, LUCA, endosymbiosis.",
], assignment=[
    "AP tip:  on a speciation FRQ, name the mode (allo/sym), then the category (pre/post),",
    "then the specific mechanism (habitat / temporal / behavioral / mechanical / gametic / hybrid type).",
])


# 17 — path
deck.path("17_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Biology",   "Chapters 18 + 20 — Evolution & Origin of Species; Phylogenies"),
    ("2.", "Khan Academy AP Bio",     "Unit 7 problem sets — speciation, cladograms, origin of life"),
    ("3.", "Assignment in dashboard", "Cladogram + speciation-mode practice set"),
    ("4.", "Advisor check-in",        "If monophyletic vs paraphyletic or synapomorphy still feels fuzzy"),
], next_text="Next up:  Module 12 — Ecology: Populations  (Unit 8 begins).")


print("AP Biology Module 11 slides built.")
