"""AP Biology · Module 10 — Natural Selection and Evolution.

Teal (science) theme auto-resolved from "AP Biology". 16 slides total.
Heavy on customs for the conceptual diagrams — peppered-moth hook,
three selection curves + sexual selection panel, H-W practice problem
and walkthrough, drift two-panel (bottleneck + founder), evidence grid,
and the path forward to Module 11.

Pause slide (09) is duplicated to 10 so the same image plays during
both Q and A sections.
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
deck = Deck(course="AP Biology", module_num=10, output_dir="slides", logo_path=LOGO)

ACCENT = deck.accent           # teal
ACCENT_LT = deck.accent_light  # light teal
CARD = deck.card_bg


# 01 — title
deck.title("01_title", "AP Biology",
           "Module 10 — Natural Selection and Evolution",
           "Sample lesson  ·  ~9 minutes  ·  AP Unit 7 (13–20% of the exam)")


# 02 — hook: peppered moth (light tree → soot tree)
def hook(img, d):
    d.text((110, 70), "The population changed color  —  no moth did.",
           fill=MAROON, font=font("serif_bold", 56))

    # Two scene panels
    panel_w = 820
    panel_h = 580
    gap = 40
    start_x = (W - (panel_w * 2 + gap)) // 2
    py = 220

    # LEFT — pre-Industrial: light birch + light moth common
    lx = start_x
    d.rounded_rectangle([lx, py, lx + panel_w, py + panel_h], radius=24,
                        outline=ACCENT, width=6, fill=CARD)
    d.rectangle([lx, py, lx + panel_w, py + 60], fill=ACCENT)
    centered_x = lx + panel_w // 2
    label = "BEFORE  ·  Pre-Industrial"
    lf = font("serif_bold", 32)
    tw = d.textlength(label, font=lf)
    d.text((centered_x - tw / 2, py + 12), label, fill=CREAM, font=lf)

    # Light birch trunk
    trunk_x = lx + panel_w // 2 - 60
    trunk_top = py + 110
    trunk_bot = py + panel_h - 60
    d.rectangle([trunk_x, trunk_top, trunk_x + 120, trunk_bot],
                fill=(230, 220, 200), outline=MAROON_DARK, width=3)
    # Birch bark stripes
    for i in range(6):
        sy = trunk_top + 40 + i * 60
        d.rectangle([trunk_x + 10, sy, trunk_x + 110, sy + 8], fill=(60, 50, 40))

    # Light moths (visible / surviving)
    for (mx, my) in [(trunk_x + 30, trunk_top + 80), (trunk_x + 70, trunk_top + 230)]:
        d.ellipse([mx - 22, my - 12, mx + 22, my + 12], fill=(240, 235, 220),
                  outline=MAROON_DARK, width=2)
    # Dark moth — visible / eaten by birds
    dmx, dmy = trunk_x + 40, trunk_top + 360
    d.ellipse([dmx - 22, dmy - 12, dmx + 22, dmy + 12], fill=(40, 35, 30),
              outline=MAROON, width=2)
    d.line([(dmx - 30, dmy - 20), (dmx + 30, dmy + 20)], fill=RED, width=5)
    d.line([(dmx + 30, dmy - 20), (dmx - 30, dmy + 20)], fill=RED, width=5)

    # Caption
    d.text((lx + 30, py + panel_h - 50),
           "Light moths blend in — dark moths get eaten.",
           fill=MAROON_DARK, font=font("sans_bold", 24))

    # RIGHT — post-Industrial: soot-covered tree
    rx = start_x + panel_w + gap
    d.rounded_rectangle([rx, py, rx + panel_w, py + panel_h], radius=24,
                        outline=MAROON, width=6, fill=ACCENT_LT)
    d.rectangle([rx, py, rx + panel_w, py + 60], fill=MAROON)
    label2 = "AFTER  ·  Industrial Revolution"
    tw2 = d.textlength(label2, font=lf)
    d.text((rx + panel_w // 2 - tw2 / 2, py + 12), label2,
           fill=CREAM, font=lf)

    # Sooty trunk
    trunk2_x = rx + panel_w // 2 - 60
    d.rectangle([trunk2_x, trunk_top, trunk2_x + 120, trunk_bot],
                fill=(60, 50, 45), outline=MAROON_DARK, width=3)

    # Dark moths now blend in
    for (mx, my) in [(trunk2_x + 30, trunk_top + 80), (trunk2_x + 70, trunk_top + 230)]:
        d.ellipse([mx - 22, my - 12, mx + 22, my + 12], fill=(40, 35, 30),
                  outline=MAROON, width=2)
    # Light moth — visible / eaten
    lmx, lmy = trunk2_x + 40, trunk_top + 360
    d.ellipse([lmx - 22, lmy - 12, lmx + 22, lmy + 12], fill=(240, 235, 220),
              outline=MAROON_DARK, width=2)
    d.line([(lmx - 30, lmy - 20), (lmx + 30, lmy + 20)], fill=RED, width=5)
    d.line([(lmx + 30, lmy - 20), (lmx - 30, lmy + 20)], fill=RED, width=5)

    d.text((rx + 30, py + panel_h - 50),
           "Dark moths now blend in — light moths get eaten.",
           fill=MAROON_DARK, font=font("sans_bold", 24))

    # Bottom punchline strip
    d.rounded_rectangle([110, 830, W - 110, 990], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Mutations existed BEFORE the soot — selection just chose which survived.",
             font("serif_bold", 32), 860, MAROON_DARK)
    centered(d, "No individual moth ever changed color. The POPULATION did.",
             font("serif_ital", 28), 920, MAROON)
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "Darwin's four postulates — the logical core of natural selection.",
    "Hardy-Weinberg — the null model for when populations are NOT evolving.",
    "Five mechanisms that break H-W and cause real evolution.",
], footnote="AP Unit 7 lands ~13–20% of the exam — this is the highest-yield unit you'll learn.")


# 04 — Darwin's four postulates
def darwin_postulates(img, d):
    d.text((110, 70), "Darwin's argument  —  four steps.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 150),
           "Stack these four and evolution by natural selection is logically inevitable.",
           fill=MUTED, font=font("sans", 28))

    postulates = [
        ("1.", "Variation exists.",
         "Individuals in a population differ from one another."),
        ("2.", "Some variation is heritable.",
         "It has a genetic component → passed to offspring."),
        ("3.", "More offspring than the environment can support.",
         "The Malthusian struggle — most won't survive to reproduce."),
        ("4.", "Differential reproductive success.",
         "Traits suited to the environment → more offspring → trait becomes more common."),
    ]
    y = 240
    for num, head, sub in postulates:
        d.rounded_rectangle([110, y, W - 110, y + 130], radius=18,
                            outline=ACCENT, width=4, fill=CARD)
        d.text((140, y + 24), num, fill=MAROON,
               font=font("serif_bold", 56))
        d.text((230, y + 24), head, fill=INK,
               font=font("sans_bold", 36))
        d.text((230, y + 78), sub, fill=MUTED,
               font=font("sans", 28))
        y += 150

    # Bottom punchline strip
    d.rounded_rectangle([110, 880, W - 110, 990], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Selection acts on PHENOTYPES — only the heritable part passes on.",
             font("serif_bold", 32), 905, MAROON_DARK)
    centered(d, "A bodybuilder's muscles don't make their kids stronger.",
             font("serif_ital", 26), 950, MAROON)
deck.custom("04_darwin_postulates", darwin_postulates)


# 05 — fitness compare (number-one AP trap)
deck.compare("05_fitness_definition",
             "Fitness  —  the #1 AP exam trap.",
             left={"label": "FITNESS  IS",
                   "color": ACCENT,
                   "lines": [
                       "Relative reproductive",
                       "success.",
                       "",
                       "# of offspring that",
                       "themselves reproduce.",
                       "",
                       "Compared to the top",
                       "reproducer in the pop.",
                       "",
                       "Context-dependent —",
                       "changes with environment.",
                   ],
                   "footnote": "A scrawny mouse with 12 grandkids beats a buff one with 2."},
             right={"label": "FITNESS  IS  NOT",
                    "color": RED,
                    "lines": [
                        "Strength.",
                        "",
                        "Speed.",
                        "",
                        "Lifespan.",
                        "",
                        "Being 'the best'.",
                        "",
                        "Some absolute measure",
                        "of an organism's worth.",
                    ],
                    "footnote": "If you said 'survival of the fittest = strongest' — STOP."})


# 06 — three selection curves + sexual selection panel
def selection_types(img, d):
    d.text((110, 60), "Selection comes in flavors.",
           fill=MAROON, font=font("serif_bold", 56))

    # Three bell-curve panels
    panel_w = 560
    panel_h = 440
    gap = 30
    start_x = (W - (panel_w * 3 + gap * 2)) // 2
    py = 170

    types = [
        ("DIRECTIONAL", "shifts the average",
         "Peppered moths → darker.", "shift"),
        ("STABILIZING", "squeezes the average",
         "Human birth weight.", "narrow"),
        ("DISRUPTIVE", "favors both extremes",
         "African seedcrackers.", "split"),
    ]
    for i, (label, sub, ex, kind) in enumerate(types):
        x = start_x + i * (panel_w + gap)
        d.rounded_rectangle([x, py, x + panel_w, py + panel_h], radius=20,
                            outline=ACCENT, width=5, fill=CARD)
        d.rectangle([x, py, x + panel_w, py + 60], fill=ACCENT)
        lf = font("serif_bold", 30)
        tw = d.textlength(label, font=lf)
        d.text((x + panel_w // 2 - tw / 2, py + 14), label,
               fill=CREAM, font=lf)
        sf = font("sans", 22)
        tw2 = d.textlength(sub, font=sf)
        d.text((x + panel_w // 2 - tw2 / 2, py + 70), sub,
               fill=MAROON_DARK, font=sf)

        # Draw the bell curves
        gx0 = x + 40
        gx1 = x + panel_w - 40
        gy0 = py + 330
        # Baseline
        d.line([(gx0, gy0), (gx1, gy0)], fill=MAROON_DARK, width=3)

        # Original bell (faint)
        n_pts = 80
        def bell(mu, sigma, scale=120):
            pts = []
            for k in range(n_pts + 1):
                t = k / n_pts
                x_val = gx0 + t * (gx1 - gx0)
                # normalized position 0..1, scale so mu in [0,1]
                z = (t - mu) / sigma
                y_val = gy0 - scale * math.exp(-0.5 * z * z)
                pts.append((x_val, y_val))
            return pts

        # Faint original at mu=0.5
        orig = bell(0.5, 0.13, scale=110)
        for j in range(len(orig) - 1):
            d.line([orig[j], orig[j + 1]], fill=MUTED, width=3)

        # Outcome curve in accent color
        if kind == "shift":
            new = bell(0.72, 0.13, scale=110)
        elif kind == "narrow":
            new = bell(0.5, 0.07, scale=160)
        else:  # split
            # Two narrow peaks at 0.28 and 0.72
            pts1 = bell(0.28, 0.07, scale=90)
            pts2 = bell(0.72, 0.07, scale=90)
            new = []
            for j in range(len(pts1)):
                # combine peaks (max envelope)
                y_combined = min(pts1[j][1], pts2[j][1])
                new.append((pts1[j][0], y_combined))
        for j in range(len(new) - 1):
            d.line([new[j], new[j + 1]], fill=MAROON, width=5)

        # Example line below
        ef = font("sans_bold", 22)
        tw3 = d.textlength(ex, font=ef)
        d.text((x + panel_w // 2 - tw3 / 2, py + panel_h - 50), ex,
               fill=ACCENT, font=ef)

    # Divider
    div_y = py + panel_h + 30
    d.line([(180, div_y), (W - 180, div_y)], fill=MAROON_DARK, width=3)
    centered(d, "Separate framework  —  SEXUAL SELECTION  —  competition for mates.",
             font("serif_bold", 30), div_y + 20, MAROON)

    # Sexual selection panel — two halves
    sy = div_y + 75
    sh = 240
    half_w = (W - 220 - 30) // 2

    # Intersexual — peacock (mate choice)
    sx = 110
    d.rounded_rectangle([sx, sy, sx + half_w, sy + sh], radius=18,
                        outline=ACCENT, width=5, fill=ACCENT_LT)
    d.text((sx + 20, sy + 16), "INTERSEXUAL",
           fill=MAROON_DARK, font=font("serif_bold", 32))
    d.text((sx + 20, sy + 60), "Mate choice (one sex picks the other).",
           fill=INK, font=font("sans_bold", 22))
    d.text((sx + 20, sy + 100), "Peacock tails — peahens prefer them.",
           fill=MAROON, font=font("sans_bold", 22))
    # Mini peacock icon (fan)
    pcx, pcy = sx + half_w - 100, sy + 165
    for k in range(7):
        a = -0.7 + k * 0.23
        ex_ = pcx + int(70 * math.cos(a))
        ey_ = pcy - int(70 * math.sin(a))
        d.line([(pcx, pcy), (ex_, ey_)], fill=ACCENT, width=6)
        d.ellipse([ex_ - 8, ey_ - 8, ex_ + 8, ey_ + 8], fill=MAROON)
    d.ellipse([pcx - 14, pcy - 14, pcx + 14, pcy + 14], fill=MAROON_DARK)

    # Intrasexual — deer (male-male combat)
    sx2 = 110 + half_w + 30
    d.rounded_rectangle([sx2, sy, sx2 + half_w, sy + sh], radius=18,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    d.text((sx2 + 20, sy + 16), "INTRASEXUAL",
           fill=MAROON_DARK, font=font("serif_bold", 32))
    d.text((sx2 + 20, sy + 60), "Same-sex combat (males fight males).",
           fill=INK, font=font("sans_bold", 22))
    d.text((sx2 + 20, sy + 100), "Deer antlers — fights for mating access.",
           fill=MAROON, font=font("sans_bold", 22))
    # Mini antler icon
    dcx, dcy = sx2 + half_w - 110, sy + 180
    d.line([(dcx, dcy), (dcx - 30, dcy - 70)], fill=MAROON_DARK, width=8)
    d.line([(dcx - 30, dcy - 70), (dcx - 60, dcy - 90)], fill=MAROON_DARK, width=6)
    d.line([(dcx - 30, dcy - 70), (dcx - 10, dcy - 110)], fill=MAROON_DARK, width=6)
    d.line([(dcx, dcy), (dcx + 30, dcy - 70)], fill=MAROON_DARK, width=8)
    d.line([(dcx + 30, dcy - 70), (dcx + 60, dcy - 90)], fill=MAROON_DARK, width=6)
    d.line([(dcx + 30, dcy - 70), (dcx + 10, dcy - 110)], fill=MAROON_DARK, width=6)
    d.ellipse([dcx - 18, dcy - 5, dcx + 18, dcy + 30], fill=MAROON)
deck.custom("06_selection_types", selection_types)


# 07 — Hardy-Weinberg core equations
deck.equation("07_hw_setup", "Hardy-Weinberg  —  the null model.", [
    ("p + q = 1", INK, "allele frequencies (A and a)"),
    ("p² + 2pq + q² = 1", MAROON, "genotype frequencies: AA + Aa + aa"),
    ("not evolving", ACCENT, "what allele frequencies look like when the pop is standing still"),
])


# 08 — five Hardy-Weinberg conditions
def hw_conditions(img, d):
    d.text((110, 70), "Hardy-Weinberg  —  the five conditions.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 150),
           "All five must hold.  Break ANY one → the population is evolving.",
           fill=MUTED, font=font("sans", 28))

    conditions = [
        ("1.", "No mutation.",         "No new alleles appearing."),
        ("2.", "No migration / gene flow.", "No individuals moving in or out."),
        ("3.", "Random mating.",       "Partners not chosen by phenotype or relatedness."),
        ("4.", "Infinitely large population.", "Technical way of saying 'no genetic drift'."),
        ("5.", "No natural selection.", "All genotypes have equal fitness."),
    ]
    y = 240
    for num, head, sub in conditions:
        d.rounded_rectangle([110, y, W - 110, y + 110], radius=16,
                            outline=ACCENT, width=4, fill=CARD)
        d.text((140, y + 16), num, fill=MAROON,
               font=font("serif_bold", 48))
        d.text((230, y + 18), head, fill=INK,
               font=font("sans_bold", 32))
        d.text((230, y + 64), sub, fill=MUTED,
               font=font("sans", 26))
        y += 124

    # Bottom strip — each condition → mechanism mapping
    d.rounded_rectangle([110, 890, W - 110, 990], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Each condition maps 1:1 to one of the five mechanisms (coming up next).",
             font("serif_bold", 30), 915, MAROON_DARK)
    centered(d, "H-W isn't a fact about nature — it's a baseline we measure deviations from.",
             font("serif_ital", 26), 955, MAROON)
deck.custom("08_hw_conditions", hw_conditions)


# 09 — pause: Hardy-Weinberg practice problem
deck.pause("09_pause1", "PAUSE  &  TRY",
           "400 mice.  64 are white (aa).  Assume Hardy-Weinberg.  Find the frequency of A.",
           "q² = 64 / 400 = ?",
           hint="Start from q² when given the recessive phenotype. Pause now. Solve it. Press play when you're ready.")

# 10 — duplicate for the answer-reveal section
deck.duplicate("09_pause1", "10_pause1_silence")


# 11 — five mechanisms that break H-W
def mechanisms(img, d):
    d.text((110, 70), "Five mechanisms that break H-W.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 150),
           "One per condition.  In the real world, at least one is ALWAYS broken — that is why populations evolve.",
           fill=MUTED, font=font("sans", 26))

    items = [
        ("1.", "Mutation",
         "Brand-new alleles — rare per generation, but the ultimate source of all variation."),
        ("2.", "Gene flow",
         "Migration between populations — tends to make them more genetically similar."),
        ("3.", "Genetic drift",
         "Random chance — hits small populations hardest.  NON-ADAPTIVE."),
        ("4.", "Natural selection",
         "The only mechanism non-random with respect to fitness.  Acts on phenotypes."),
        ("5.", "Non-random mating",
         "Assortative mating (by phenotype) OR inbreeding (by relatedness) — distinct things."),
    ]
    y = 220
    for num, head, sub in items:
        d.rounded_rectangle([110, y, W - 110, y + 130], radius=16,
                            outline=ACCENT, width=4, fill=CARD)
        d.text((140, y + 24), num, fill=MAROON,
               font=font("serif_bold", 50))
        d.text((240, y + 18), head, fill=INK,
               font=font("sans_bold", 38))
        d.text((240, y + 70), sub, fill=MUTED,
               font=font("sans", 26))
        y += 150

    # Bottom strip
    d.rounded_rectangle([110, 980, W - 110, 1050], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Non-random mating changes GENOTYPE frequencies — not allele frequencies directly.",
             font("sans_bold", 26), 1000, MAROON_DARK)
deck.custom("11_mechanisms", mechanisms)


# 12 — drift examples: bottleneck + founder
def drift_examples(img, d):
    d.text((110, 70), "Genetic drift  —  two famous flavors.",
           fill=MAROON, font=font("serif_bold", 56))

    panel_w = 870
    panel_h = 720
    gap = 30
    start_x = (W - (panel_w * 2 + gap)) // 2
    py = 180

    # LEFT — bottleneck (cheetah)
    lx = start_x
    d.rounded_rectangle([lx, py, lx + panel_w, py + panel_h], radius=20,
                        outline=ACCENT, width=5, fill=CARD)
    d.rectangle([lx, py, lx + panel_w, py + 64], fill=ACCENT)
    label = "BOTTLENECK EFFECT"
    lf = font("serif_bold", 36)
    tw = d.textlength(label, font=lf)
    d.text((lx + panel_w // 2 - tw / 2, py + 14), label,
           fill=CREAM, font=lf)

    # Bottleneck visualization — big jar squeezing into small jar
    cx = lx + panel_w // 2
    # Top wide cluster of dots
    import random
    random.seed(7)
    colors_l = [ACCENT, MAROON, MAROON_DARK, ACCENT_LT, MUTED, (140, 100, 70), (90, 130, 90)]
    for _ in range(70):
        rx_ = cx + random.randint(-280, 280)
        ry_ = py + 120 + random.randint(0, 130)
        col = random.choice(colors_l)
        d.ellipse([rx_ - 10, ry_ - 10, rx_ + 10, ry_ + 10], fill=col)

    # Neck shape
    nx1 = cx - 60
    nx2 = cx + 60
    ny_top = py + 280
    ny_bot = py + 440
    d.polygon([
        (cx - 280, ny_top),
        (nx1, ny_bot),
        (nx2, ny_bot),
        (cx + 280, ny_top),
    ], outline=MAROON_DARK, fill=ACCENT_LT, width=4)

    # Bottom small cluster — only one color survives
    random.seed(3)
    for _ in range(10):
        rx_ = cx + random.randint(-50, 50)
        ry_ = ny_bot + 30 + random.randint(0, 100)
        d.ellipse([rx_ - 10, ry_ - 10, rx_ + 10, ry_ + 10], fill=MAROON)

    d.text((lx + 30, py + panel_h - 180),
           "Cheetah bottleneck — survivors carry",
           fill=INK, font=font("sans_bold", 26))
    d.text((lx + 30, py + panel_h - 145),
           "only a sliver of the original variation.",
           fill=INK, font=font("sans", 26))
    d.text((lx + 30, py + panel_h - 100),
           "Which alleles survived had NOTHING",
           fill=MAROON, font=font("serif_bold", 26))
    d.text((lx + 30, py + panel_h - 65),
           "to do with fitness.",
           fill=MAROON, font=font("serif_bold", 26))

    # RIGHT — founder effect (Amish)
    rx = start_x + panel_w + gap
    d.rounded_rectangle([rx, py, rx + panel_w, py + panel_h], radius=20,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    d.rectangle([rx, py, rx + panel_w, py + 64], fill=MAROON)
    label2 = "FOUNDER EFFECT"
    tw2 = d.textlength(label2, font=lf)
    d.text((rx + panel_w // 2 - tw2 / 2, py + 14), label2,
           fill=CREAM, font=lf)

    # Big source population (dots, mostly other colors)
    random.seed(11)
    src_cx = rx + 200
    src_cy = py + 240
    for _ in range(40):
        rx_ = src_cx + random.randint(-120, 120)
        ry_ = src_cy + random.randint(-80, 80)
        col = random.choice(colors_l)
        d.ellipse([rx_ - 9, ry_ - 9, rx_ + 9, ry_ + 9], fill=col)
    # Outline circle
    d.ellipse([src_cx - 150, src_cy - 110, src_cx + 150, src_cy + 110],
              outline=MAROON_DARK, width=4)
    d.text((src_cx - 100, src_cy + 130), "source population",
           fill=MAROON_DARK, font=font("sans_bold", 22))

    # Arrow to new colony
    d.line([(src_cx + 160, src_cy), (rx + panel_w - 220, py + 240)],
           fill=MAROON, width=6)
    d.polygon([
        (rx + panel_w - 220, py + 240 - 14),
        (rx + panel_w - 195, py + 240),
        (rx + panel_w - 220, py + 240 + 14),
    ], fill=MAROON)

    # Small new colony — uniform color (founders happened to have this allele)
    new_cx = rx + panel_w - 130
    new_cy = py + 240
    for _ in range(6):
        rx_ = new_cx + random.randint(-40, 40)
        ry_ = new_cy + random.randint(-40, 40)
        d.ellipse([rx_ - 10, ry_ - 10, rx_ + 10, ry_ + 10], fill=MAROON)
    d.ellipse([new_cx - 70, new_cy - 70, new_cx + 70, new_cy + 70],
              outline=MAROON_DARK, width=4)
    d.text((new_cx - 90, new_cy + 90), "founders",
           fill=MAROON_DARK, font=font("sans_bold", 22))

    d.text((rx + 30, py + panel_h - 220),
           "Amish — Ellis-van Creveld syndrome",
           fill=INK, font=font("sans_bold", 26))
    d.text((rx + 30, py + panel_h - 185),
           "(includes polydactyly + other traits)",
           fill=INK, font=font("sans", 24))
    d.text((rx + 30, py + panel_h - 150),
           "is unusually common.",
           fill=INK, font=font("sans", 26))
    d.text((rx + 30, py + panel_h - 100),
           "Traced to a single founder couple.",
           fill=MAROON, font=font("serif_bold", 26))
    d.text((rx + 30, py + panel_h - 60),
           "Founder allele frequency now dominates.",
           fill=MAROON, font=font("serif_bold", 24))

    # Bottom strip
    d.rounded_rectangle([110, 925, W - 110, 1000], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Drift is NON-ADAPTIVE — the survivors were lucky, not better.",
             font("serif_bold", 30), 948, MAROON_DARK)
deck.custom("12_drift_examples", drift_examples)


# 13 — six lines of evidence
def evidence(img, d):
    d.text((110, 70), "Six lines of evidence  —  same conclusion.",
           fill=MAROON, font=font("serif_bold", 56))

    items = [
        ("1.", "Fossil record",
         "Change through time — transitional forms in the strata."),
        ("2.", "Biogeography",
         "Marsupial wolf vs. placental wolf — convergent evolution from similar environments."),
        ("3.", "Comparative anatomy",
         "Homologous (common ancestor) · analogous (convergent) · vestigial (leftovers — e.g. appendix)."),
        ("4.", "Embryology",
         "Early developmental patterns shared across distant relatives."),
        ("5.", "Molecular sequences",
         "DNA confirms relationships down to the molecule."),
        ("6.", "Direct observation",
         "Antibiotic resistance · Galápagos finch beaks — evolution in real time."),
    ]
    y = 200
    for num, head, sub in items:
        d.rounded_rectangle([110, y, W - 110, y + 110], radius=16,
                            outline=ACCENT, width=4, fill=CARD)
        d.text((140, y + 16), num, fill=MAROON,
               font=font("serif_bold", 44))
        d.text((230, y + 14), head, fill=INK,
               font=font("sans_bold", 32))
        d.text((230, y + 60), sub, fill=MUTED,
               font=font("sans", 24))
        y += 120

    # Bottom strip — key conceptual flag on antibiotic resistance
    d.rounded_rectangle([110, 925, W - 110, 1030], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Antibiotic-resistant bacteria did NOT become resistant because of the drug.",
             font("serif_bold", 28), 945, MAROON_DARK)
    centered(d, "The mutations were already there — selection chose which variants survived.",
             font("serif_ital", 26), 990, MAROON)
deck.custom("13_evidence", evidence)


# 14 — homologous vs analogous compare
deck.compare("14_homology_trap",
             "Homologous vs. analogous  —  opposite meanings.",
             left={"label": "HOMOLOGOUS",
                   "color": ACCENT,
                   "lines": [
                       "Same ORIGIN,",
                       "different FUNCTION.",
                       "",
                       "Human arm.",
                       "Whale flipper.",
                       "Bat wing.",
                       "",
                       "Same bone layout —",
                       "inherited from a",
                       "common ancestor.",
                   ],
                   "footnote": "Homology = ancestry."},
             right={"label": "ANALOGOUS",
                    "color": MAROON,
                    "lines": [
                        "Different ORIGIN,",
                        "same FUNCTION.",
                        "",
                        "Bird wing.",
                        "Insect wing.",
                        "",
                        "Both fly — but the",
                        "wings evolved",
                        "independently.",
                    ],
                    "footnote": "Analogy = convergence.  Evolution has NO goal — no progress ladder."})


# 15 — recap + assignment
deck.recap("15_recap", "Recap.", [
    "Darwin's 4 postulates → natural selection. Selection acts on PHENOTYPES, not genotypes.",
    "Fitness = relative reproductive success — NOT strength, speed, or lifespan.",
    "Hardy-Weinberg: p + q = 1, p² + 2pq + q² = 1. Five conditions — all must hold.",
    "Five mechanisms break H-W: mutation, gene flow, drift, selection, non-random mating.",
    "Drift is non-adaptive (bottleneck + founder). Selection is the only fitness-driven one.",
    "Six lines of evidence → common ancestry. Evolution has NO goal and no progress ladder.",
], assignment=[
    "Three Hardy-Weinberg practice problems are waiting in your Learn Portal.",
    "Drill them before Module 11 — H-W is one of the most testable AP topics.",
])


# 16 — path forward
def path_forward(img, d):
    d.text((110, 70), "How to actually master this module.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 150),
           "This video is ~10% of the work.  Here's the rest.",
           fill=MUTED, font=font("sans", 30))

    items = [
        ("✓",  "Watch this lesson",        "(done!)"),
        ("1.", "Read OpenStax Biology",    "Chapters 18–19 — natural selection + population genetics."),
        ("2.", "Khan Academy AP Bio",      "Unit 7 problem sets — Hardy-Weinberg + selection types."),
        ("3.", "Assignment in dashboard",  "Three H-W practice problems."),
        ("4.", "Advisor check-in",         "Book a session if H-W algebra or mechanisms still feel fuzzy."),
    ]
    y = 230
    for n, head, sub in items:
        done = n.strip() == "✓"
        n_color = ACCENT if done else MAROON
        head_color = ACCENT if done else INK
        d.text((140, y), n, fill=n_color, font=font("serif_bold", 42))
        d.text((230, y), head, fill=head_color, font=font("serif_bold", 36))
        d.text((230, y + 48), sub, fill=MUTED, font=font("sans", 26))
        y += 100

    # Success criteria box
    d.rounded_rectangle([110, 730, W - 110, 940], radius=20,
                        outline=MAROON, width=5, fill=ACCENT_LT)
    d.text((140, 750), "You're ready for Module 11 when you can:",
           fill=MAROON, font=font("serif_bold", 32))
    crit = [
        "(a)  State Darwin's four postulates.",
        "(b)  Solve a Hardy-Weinberg problem starting from q² (recessive phenotype).",
        "(c)  Name which of the five mechanisms a given scenario describes.",
    ]
    cy = 800
    for c in crit:
        d.text((160, cy), c, fill=INK, font=font("sans", 28))
        cy += 44

    # Next-module strip
    d.rounded_rectangle([110, 960, W - 110, 1040], radius=16,
                        fill=MAROON, outline=MAROON_DARK, width=4)
    centered(d, "Next up:  Module 11 — Speciation and Phylogeny.  See you there.",
             font("serif_bold", 32), 985, CREAM)
deck.custom("16_path", path_forward)


print("AP Biology Module 10 slides built.")
