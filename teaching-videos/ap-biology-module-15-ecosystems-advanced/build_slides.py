"""AP Biology · Module 15 — Ecosystems: Advanced Applications.

Teal (science) theme auto-resolved from "AP Biology". 16 slides total.
Custom diagrams: hook (DDT eggshell + Gulf dead zone, 02), the solar-driven
water cycle loop (04), the eutrophication cause-and-effect chain (07), the
biomagnification ladder with toxin concentration multiplying ~10x per trophic
level (08), the two-track climate/acidification split (10), and the three
human-impact cards (11). Pause slide (13) is duplicated to 14 so the same
image plays during both the question and the silent-answer sections.
"""
import sys
import math
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, wrap, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, CREAM, GRID,
)

LOGO = "../../src/img/logo_nobg.png"
deck = Deck(course="AP Biology", module_num=15, output_dir="slides", logo_path=LOGO)

ACCENT = deck.accent           # teal
ACCENT_LT = deck.accent_light  # light teal
CARD = deck.card_bg

GREEN = (52, 140, 84)
HARM = RED
ZERO = MUTED
SKY = (150, 195, 220)
SOIL = (150, 110, 70)
WATER = (60, 120, 165)
GRID_LINE = (190, 178, 158)


def definition_card(slug, title, headline, sub):
    """Like deck.definition, but wraps the sub-caption so long lines don't
    run off the slide edge."""
    def render(img, d):
        d.text((110, 90), title, fill=MAROON, font=font("serif_bold", 80))
        d.rounded_rectangle([110, 270, W - 110, 560], radius=24, outline=MAROON,
                            width=5, fill=CARD)
        f_h = font("serif_bold", 60)
        h_lines = wrap(d, headline, f_h, W - 360)
        y = 310 if len(h_lines) == 1 else 290
        for line in h_lines:
            centered(d, line, f_h, y, INK)
            y += 78
        f_s = font("sans", 38)
        s_lines = wrap(d, sub, f_s, W - 360)
        sy = 620
        for line in s_lines:
            centered(d, line, f_s, sy, MUTED)
            sy += 54
    deck.custom(slug, render)


# 01 — title
deck.title("01_title", "AP Biology",
           "Module 15 — Ecosystems: Advanced Applications",
           "Sample lesson  ·  ~8 minutes")


# 02 — hook: DDT eggshell (biomagnification) + Gulf dead zone (eutrophication)
def hook(img, d):
    d.text((110, 64), "Same ecosystem rules from Module 14 — scaled up to a continent.",
           fill=MAROON, font=font("serif_bold", 46))
    d.text((110, 138),
           "Two case studies that look unrelated turn out to follow the exact rules you already learned.",
           fill=MUTED, font=font("sans", 28))

    panel_w = 760
    panel_h = 520
    gap = 60
    start_x = (W - (panel_w * 2 + gap)) // 2
    y0 = 215

    # LEFT — DDT thinned eggshell
    bx = start_x
    d.rounded_rectangle([bx, y0, bx + panel_w, y0 + panel_h], radius=20,
                        outline=HARM, width=6, fill=CARD)
    d.rectangle([bx, y0, bx + panel_w, y0 + 70], fill=HARM)
    tf = font("serif_bold", 34)
    txt = "BIOMAGNIFICATION  ·  DDT"
    tw = d.textlength(txt, font=tf)
    d.text((bx + panel_w // 2 - tw / 2, y0 + 16), txt, fill=CREAM, font=tf)
    # nest field
    d.rounded_rectangle([bx + 30, y0 + 95, bx + panel_w - 30, y0 + panel_h - 110],
                        radius=14, fill=ACCENT_LT)
    # cracked thin eggshell
    ex, ey = bx + panel_w // 2, y0 + 250
    d.ellipse([ex - 130, ey - 95, ex + 130, ey + 130], outline=MAROON_DARK,
              width=4, fill=(245, 240, 228))
    # crack lines
    d.line([(ex - 30, ey - 90), (ex - 10, ey - 20), (ex - 50, ey + 30),
            (ex - 20, ey + 95)], fill=MAROON_DARK, width=4, joint="curve")
    d.line([(ex + 40, ey - 80), (ex + 20, ey - 10), (ex + 60, ey + 40)],
           fill=MAROON_DARK, width=4, joint="curve")
    d.text((bx + 40, y0 + panel_h - 96),
           "DDT didn't poison eagles directly — it built up",
           fill=INK, font=font("sans", 26))
    d.text((bx + 40, y0 + panel_h - 60),
           "up the food chain until shells were too thin.",
           fill=INK, font=font("sans", 26))

    # RIGHT — Gulf of Mexico dead zone
    rx = bx + panel_w + gap
    d.rounded_rectangle([rx, y0, rx + panel_w, y0 + panel_h], radius=20,
                        outline=ACCENT, width=6, fill=CARD)
    d.rectangle([rx, y0, rx + panel_w, y0 + 70], fill=ACCENT)
    txt = "EUTROPHICATION  ·  GULF DEAD ZONE"
    tw = d.textlength(txt, font=tf)
    d.text((rx + panel_w // 2 - tw / 2, y0 + 16), txt, fill=CREAM, font=tf)
    # water field
    d.rounded_rectangle([rx + 30, y0 + 95, rx + panel_w - 30, y0 + panel_h - 110],
                        radius=14, fill=WATER)
    # land mass (coast) along the top
    d.polygon([(rx + 30, y0 + 95), (rx + panel_w - 30, y0 + 95),
               (rx + panel_w - 30, y0 + 150), (rx + 360, y0 + 150),
               (rx + 300, y0 + 185), (rx + 30, y0 + 185)],
              fill=SOIL)
    d.text((rx + 60, y0 + 110), "Louisiana coast", fill=CREAM, font=font("sans_bold", 24))
    # river flowing in
    d.line([(rx + 320, y0 + 150), (rx + 350, y0 + 220), (rx + 330, y0 + 290)],
           fill=(120, 150, 90), width=8, joint="curve")
    # dead zone blob (green-brown hypoxic patch)
    d.ellipse([rx + 120, y0 + 230, rx + 540, y0 + 380], fill=(120, 130, 60),
              outline=(80, 90, 40), width=4)
    centered_x = rx + 330
    dz = "hypoxic dead zone"
    dw = d.textlength(dz, font=font("sans_bold", 26))
    d.text((centered_x - dw / 2, y0 + 295), dz, fill=CREAM, font=font("sans_bold", 26))
    d.text((rx + 40, y0 + panel_h - 96),
           "Fertilizer from farms a thousand miles upstream",
           fill=INK, font=font("sans", 26))
    d.text((rx + 40, y0 + panel_h - 60),
           "suffocates a zone the size of a US state.",
           fill=INK, font=font("sans", 26))

    # bottom punchline
    d.rounded_rectangle([110, 800, W - 110, 960], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "These are not separate stories.",
             font("serif_bold", 38), 826, MAROON_DARK)
    centered(d, "They are Module 14's nutrient and trophic rules, scaled up to a continent.",
             font("serif_ital", 30), 888, MAROON)
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "The missing cycles — the water cycle, and phosphorus (NO atmosphere, slow, often limiting).",
    "Human impacts as case studies — dead zones, biomagnification, climate, acidification, and more.",
    "The AP productivity lab — measuring NPP and GPP with light and dark bottles.",
], footnote="Every topic maps to CED Unit 8 ecology  ·  Unit 8 is 10-15% of the AP exam.")


# 04 — water cycle loop
def water_cycle(img, d):
    d.text((110, 60), "The water cycle  —  powered by solar energy.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 138),
           "The physical-transport backbone: nutrients ride this water (watch runoff carry fertilizer to the Gulf).",
           fill=MUTED, font=font("sans", 27))

    # sky + ground bands
    sky_top, sky_bot = 210, 640
    d.rectangle([110, sky_top, W - 110, sky_bot], fill=SKY)
    d.rectangle([110, sky_bot, W - 110, 800], fill=SOIL)
    d.rectangle([110, sky_bot, 760, 800], fill=WATER)  # ocean on the left
    d.rectangle([110, sky_top, W - 110, 800], outline=MAROON_DARK, width=4)

    # SUN
    sun_x, sun_y = W // 2, 285
    d.ellipse([sun_x - 55, sun_y - 55, sun_x + 55, sun_y + 55], fill=(232, 196, 72),
              outline=(200, 150, 40), width=4)
    for k in range(12):
        a = k * math.pi / 6
        x1 = sun_x + 62 * math.cos(a); y1 = sun_y + 62 * math.sin(a)
        x2 = sun_x + 88 * math.cos(a); y2 = sun_y + 88 * math.sin(a)
        d.line([(x1, y1), (x2, y2)], fill=(232, 196, 72), width=6)
    centered(d, "SUN", font("sans_bold", 24), sun_y - 14, MAROON_DARK)
    d.text((sun_x - 100, sun_y + 100), "Powered by solar energy",
           fill=MAROON_DARK, font=font("sans_bold", 26))

    # clouds (condensation)
    cx, cy = 560, 320
    for off in [-55, 0, 55, 25, -25]:
        d.ellipse([cx + off - 50, cy - 35, cx + off + 50, cy + 45], fill=CREAM)
    d.text((cx - 90, cy - 100), "CONDENSATION → clouds",
           fill=MAROON_DARK, font=font("sans_bold", 24))

    af = font("sans_bold", 24)

    def arrow(p1, p2, color=MAROON):
        d.line([p1, p2], fill=color, width=7, joint="curve")
        ang = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
        for da in (math.radians(150), math.radians(-150)):
            d.line([p2, (p2[0] + 22 * math.cos(ang + da),
                          p2[1] + 22 * math.sin(ang + da))], fill=color, width=7)

    # EVAPORATION (ocean up)
    arrow((420, 660), (470, 380))
    d.text((300, 500), "EVAPORATION", fill=MAROON_DARK, font=af)
    # TRANSPIRATION (plants up) — draw a tree
    tx = 1180
    d.rectangle([tx - 8, 700, tx + 8, 770], fill=(110, 70, 40))
    d.ellipse([tx - 55, 630, tx + 55, 720], fill=GREEN)
    arrow((tx, 640), (tx - 60, 400))
    d.text((tx - 60, 500), "TRANSPIRATION", fill=MAROON_DARK, font=af)
    # PRECIPITATION (cloud down)
    arrow((cx, cy + 70), (cx + 30, 660))
    d.text((cx - 60, 470), "PRECIPITATION", fill=(40, 60, 110), font=af)
    # RUNOFF (surface flow back to ocean)
    arrow((1000, 720), (770, 730))
    d.text((900, 745), "RUNOFF", fill=CREAM, font=af)
    # INFILTRATION (down into soil)
    arrow((1450, 700), (1450, 790))
    d.text((1300, 740), "INFILTRATION", fill=CREAM, font=af)
    d.text((150, 745), "ocean", fill=CREAM, font=font("sans_bold", 26))
    d.text((1620, 745), "groundwater", fill=CREAM, font=font("sans_bold", 22))

    d.rounded_rectangle([110, 840, W - 110, 960], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Six steps: evaporation · transpiration · condensation · precipitation · runoff · infiltration.",
             font("sans_bold", 30), 866, MAROON_DARK)
    centered(d, "Runoff is the link to the next slides — it carries nutrients into coastal water.",
             font("sans", 28), 908, MAROON)
deck.custom("04_water_cycle", water_cycle)


# 05 — phosphorus cycle definition
def phosphorus_def(img, d):
    d.text((110, 70), "The phosphorus cycle.",
           fill=MAROON, font=font("serif_bold", 76))

    # pathway loop: ROCK -> SOIL/WATER -> PLANTS -> CONSUMERS -> SEDIMENTS -> (rock)
    steps = ["ROCK", "SOIL &\nWATER", "PLANTS", "CONSUMERS", "SOIL /\nSEDIMENTS"]
    box_w, box_h = 280, 120
    y = 260
    gap = (W - 220 - box_w * len(steps)) // (len(steps) - 1)
    xs = [110 + i * (box_w + gap) for i in range(len(steps))]
    bf = font("sans_bold", 30)
    for i, (sx, label) in enumerate(zip(xs, steps)):
        d.rounded_rectangle([sx, y, sx + box_w, y + box_h], radius=16,
                            outline=MAROON, width=4, fill=CARD)
        lines = label.split("\n")
        ly = y + box_h // 2 - (len(lines) * 18)
        for ln in lines:
            tw = d.textlength(ln, font=bf)
            d.text((sx + box_w // 2 - tw / 2, ly), ln, fill=INK, font=bf)
            ly += 38
        if i < len(steps) - 1:
            ax0 = sx + box_w + 6
            ax1 = sx + box_w + gap - 6
            ay = y + box_h // 2
            d.line([(ax0, ay), (ax1, ay)], fill=ACCENT, width=7)
            d.polygon([(ax1, ay - 12), (ax1, ay + 12), (ax1 + 16, ay)], fill=ACCENT)
    # weathering label on first arrow
    d.text((xs[0] + box_w - 10, y - 36), "weathering",
           fill=MUTED, font=font("sans", 24))

    # three emphasis flags
    flag_y = 470
    flags = [
        ("NO atmosphere", "no gas phase, unlike CO2 and N2", HARM),
        ("SLOW", "rate-limited by rock weathering", MAROON_DARK),
        ("LIMITING NUTRIENT", "often scarce in freshwater & soils", ACCENT),
    ]
    fw = (W - 220 - 80) // 3
    for i, (head, sub, col) in enumerate(flags):
        fx = 110 + i * (fw + 40)
        d.rounded_rectangle([fx, flag_y, fx + fw, flag_y + 180], radius=18,
                            outline=col, width=5, fill=CARD)
        hf = font("serif_bold", 40)
        tw = d.textlength(head, font=hf)
        d.text((fx + fw // 2 - tw / 2, flag_y + 36), head, fill=col, font=hf)
        sf = font("sans", 28)
        for j, ln in enumerate(wrap(d, sub, sf, fw - 50)):
            tw = d.textlength(ln, font=sf)
            d.text((fx + fw // 2 - tw / 2, flag_y + 100 + j * 38), ln,
                   fill=MUTED, font=sf)

    # struck-through cloud icon underlining "no air step"
    clx, cly = W // 2, 760
    for off in [-40, 0, 40, 18, -18]:
        d.ellipse([clx + off - 38, cly - 26, clx + off + 38, cly + 32], fill=GRID)
    d.line([(clx - 110, cly + 50), (clx + 110, cly - 60)], fill=HARM, width=9)
    centered(d, "no atmospheric step", font("sans_bold", 30), cly + 70, HARM)
deck.custom("05_phosphorus_def", phosphorus_def)


# 06 — phosphorus vs carbon & nitrogen (three-column compare; custom)
def cycles_compare(img, d):
    d.text((110, 64), "Phosphorus vs carbon & nitrogen  —  the atmosphere divides them.",
           fill=MAROON, font=font("serif_bold", 48))
    d.text((110, 140),
           "Carbon and nitrogen have big air reservoirs and cycle fast.  Phosphorus is the odd one out.",
           fill=MUTED, font=font("sans", 28))

    panel_w = 560
    panel_h = 540
    gap = 30
    start_x = (W - (panel_w * 3 + gap * 2)) // 2
    y0 = 220

    cols = [
        ("CARBON  (M14)", ACCENT, [
            ("Atmospheric pool:", "large — CO2"),
            ("Gas phase:", "YES"),
            ("Speed:", "fast (photosynthesis /"),
            ("", "respiration exchange)"),
        ]),
        ("NITROGEN  (M14)", MAROON, [
            ("Atmospheric pool:", "huge — N2 (78% of air)"),
            ("Gas phase:", "YES"),
            ("Speed:", "needs fixation, but a"),
            ("", "major gas reservoir"),
        ]),
        ("PHOSPHORUS", HARM, [
            ("Atmospheric pool:", "NONE"),
            ("Gas phase:", "NO"),
            ("Speed:", "SLOW — geologic"),
            ("", "weathering; often LIMITING"),
        ]),
    ]
    for i, (label, color, rows) in enumerate(cols):
        px = start_x + i * (panel_w + gap)
        d.rounded_rectangle([px, y0, px + panel_w, y0 + panel_h], radius=20,
                            outline=color, width=6, fill=CARD)
        d.rectangle([px, y0, px + panel_w, y0 + 80], fill=color)
        lf = font("serif_bold", 36)
        tw = d.textlength(label, font=lf)
        d.text((px + panel_w // 2 - tw / 2, y0 + 20), label, fill=CREAM, font=lf)
        yy = y0 + 120
        for head, val in rows:
            if head:
                d.text((px + 36, yy), head, fill=MUTED, font=font("sans_bold", 28))
                yy += 40
            d.text((px + 36, yy), val, fill=INK, font=font("sans", 30))
            yy += 56

    d.rounded_rectangle([110, 820, W - 110, 960], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "The presence or absence of an atmospheric reservoir is the dividing line.",
             font("sans_bold", 32), 846, MAROON_DARK)
    centered(d, "Phosphorus is the odd one out — no gas phase — and that is why it limits growth.",
             font("sans", 28), 902, MAROON)
deck.custom("06_cycles_compare", cycles_compare)


# 07 — eutrophication cause-and-effect chain
def eutrophication(img, d):
    d.text((110, 60), "Eutrophication  →  the Gulf dead zone.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 138),
           "A five-step chain — and the fish die from oxygen loss, not from poison.",
           fill=MUTED, font=font("sans", 28))

    steps = [
        ("1", "Fertilizer runoff", "Nitrogen + phosphorus (M14) wash off farms into coastal water."),
        ("2", "Algal bloom", "The nutrient surge fuels a massive bloom of algae at the surface."),
        ("3", "Algae die & sink", "The bloom dies off and the dead algae sink to the bottom."),
        ("4", "Decomposers consume O2", "Decomposers break down the dead algae and use up dissolved oxygen."),
        ("5", "Hypoxic dead zone", "Water goes low-oxygen; fish and bottom life suffocate or flee."),
    ]
    y = 210
    row_h = 116
    for i, (n, head, sub) in enumerate(steps):
        ry = y + i * row_h
        # number badge
        bx = 140
        d.ellipse([bx, ry + 10, bx + 70, ry + 80], fill=ACCENT, outline=MAROON_DARK, width=3)
        nf = font("serif_bold", 44)
        tw = d.textlength(n, font=nf)
        d.text((bx + 35 - tw / 2, ry + 20), n, fill=CREAM, font=nf)
        # text
        d.text((bx + 110, ry + 8), head, fill=INK, font=font("serif_bold", 38))
        d.text((bx + 110, ry + 58), sub, fill=MUTED, font=font("sans", 28))
        # down-arrow connector
        if i < len(steps) - 1:
            ax = bx + 35
            d.line([(ax, ry + 82), (ax, ry + row_h + 6)], fill=MAROON, width=5)
            d.polygon([(ax - 10, ry + row_h + 2), (ax + 10, ry + row_h + 2),
                       (ax, ry + row_h + 18)], fill=MAROON)

    # red caution banner
    d.rounded_rectangle([110, 820, W - 110, 960], radius=18,
                        fill=(250, 232, 230), outline=HARM, width=5)
    centered(d, "Fish die from OXYGEN LOSS during decomposition —",
             font("sans_bold", 34), 846, HARM)
    centered(d, "NOT from algal poison, and NOT from algae using up CO2.",
             font("sans_bold", 34), 898, HARM)
deck.custom("07_eutrophication", eutrophication)


# 08 — biomagnification ladder (toxin concentration multiplies up trophic levels)
def biomagnification(img, d):
    d.text((110, 56), "Biomagnification  —  concentration multiplies up the chain.",
           fill=MAROON, font=font("serif_bold", 50))
    d.text((110, 128),
           "Fat-soluble toxins (DDT, mercury, PCBs) are RETAINED — the body can't break them down or excrete them.",
           fill=MUTED, font=font("sans", 27))

    # four-level ascending ladder: width shrinks (less biomass), conc. rises
    levels = [
        ("Top predator  (eagle)", "10 ppm", (200, 60, 50)),
        ("Large fish  (2°)", "1 ppm", (210, 130, 60)),
        ("Small fish  (1°)", "0.1 ppm", (120, 160, 90)),
        ("Plankton (producer)", "0.01 ppm", GREEN),
    ]
    base_y = 760
    bar_h = 110
    gap = 18
    max_w = 980
    cx = 700
    conc_x = 1450          # left edge of the concentration column
    for i, (label, conc, color) in enumerate(levels):
        # widest at the bottom (producers, i=3), narrowest at top
        rank = len(levels) - 1 - i  # bottom row gets largest rank
        w = 340 + rank * 215
        w = min(w, max_w)
        y_top = base_y - (i + 1) * (bar_h + gap)
        x0 = cx - w // 2
        d.rounded_rectangle([x0, y_top, x0 + w, y_top + bar_h], radius=12,
                            outline=MAROON_DARK, width=3, fill=color)
        # label inside
        lf = font("sans_bold", 28)
        d.text((x0 + 24, y_top + bar_h // 2 - 18), label, fill=CREAM, font=lf)
        # concentration tag to the right
        cf = font("mono", 46)
        d.text((conc_x, y_top + bar_h // 2 - 26), conc, fill=color, font=cf)
        # multiply arrow between levels
        if i < len(levels) - 1:
            ay = y_top + bar_h + gap // 2
            d.text((conc_x + 30, ay - 22), "× 10",
                   fill=MAROON, font=font("sans_bold", 30))
    # upward big arrow on the far left
    d.line([(230, base_y - 30), (230, base_y - 4 * (bar_h + gap))],
           fill=MAROON, width=8)
    d.polygon([(214, base_y - 4 * (bar_h + gap) + 16),
               (246, base_y - 4 * (bar_h + gap) + 16),
               (230, base_y - 4 * (bar_h + gap) - 6)], fill=MAROON)
    d.text((150, 360), "concentration", fill=MAROON_DARK, font=font("sans_bold", 26))
    d.text((150, 396), "rises", fill=MAROON_DARK, font=font("sans_bold", 26))
    d.text((conc_x - 90, base_y - 4 * (bar_h + gap) - 56),
           "~1000× total",
           fill=MAROON, font=font("sans_bold", 30))

    # caution flag
    d.rounded_rectangle([110, 820, W - 110, 960], radius=18,
                        fill=(250, 232, 230), outline=HARM, width=5)
    centered(d, "The toxin is RETAINED, not lost like energy.",
             font("sans_bold", 34), 846, HARM)
    centered(d, "Don't say the 10% energy rule causes magnification — energy loss only explains less biomass at the top.",
             font("sans", 28), 902, MAROON)
deck.custom("08_biomagnification", biomagnification)


# 09 — bioaccumulation vs biomagnification compare
deck.compare("09_bioaccum_compare",
             "Bioaccumulation vs biomagnification.",
             {"label": "BIOACCUMULATION", "color": ACCENT,
              "lines": [
                  "Buildup of a toxin WITHIN",
                  "ONE organism over its lifetime.",
                  "",
                  "The longer it lives / the more",
                  "it's exposed, the more it stores.",
                  "",
                  "One fish, getting more",
                  "contaminated as it ages.",
              ],
              "footnote": "Over time — ONE body."},
             {"label": "BIOMAGNIFICATION", "color": MAROON,
              "lines": [
                  "Increase in toxin CONCENTRATION",
                  "ACROSS trophic levels.",
                  "",
                  "Top predators are hit hardest.",
                  "",
                  "Up the food chain —",
                  "MANY bodies.",
              ],
              "footnote": "Both can occur together — don't swap them."})


# 10 — climate change: two distinct CO2-linked ocean impacts
def climate_acidification(img, d):
    d.text((110, 56), "Climate change  —  two distinct CO2-linked ocean impacts.",
           fill=MAROON, font=font("serif_bold", 48))
    d.text((110, 128),
           "Greenhouse gases: CO2, CH4, N2O.  Warming and acidification are SEPARATE problems.",
           fill=MUTED, font=font("sans", 28))

    panel_w = W - 220
    # TOP TRACK — warming → bleaching
    ty = 200
    th = 300
    d.rounded_rectangle([110, ty, 110 + panel_w, ty + th], radius=18,
                        outline=(210, 130, 60), width=6, fill=CARD)
    d.rectangle([110, ty, 110 + panel_w, ty + 70], fill=(210, 130, 60))
    d.text((150, ty + 16), "WARMING  (heat)  →  CORAL BLEACHING",
           fill=CREAM, font=font("serif_bold", 40))
    bullets1 = [
        "Greenhouse gases trap heat → warming, sea-level rise, range shifts, extreme weather.",
        "Elevated SEA-SURFACE TEMPERATURE is the PRIMARY driver of coral bleaching.",
        "Heat-stressed corals EXPEL their zooxanthellae (coral/zooxanthellae mutualism, M13) → turn white, starve.",
    ]
    yy = ty + 95
    for b in bullets1:
        d.text((150, yy), "•", fill=(210, 130, 60), font=font("sans_bold", 34))
        for j, ln in enumerate(wrap(d, b, font("sans", 30), panel_w - 120)):
            d.text((195, yy + j * 38), ln, fill=INK, font=font("sans", 30))
        yy += 38 * (len(wrap(d, b, font("sans", 30), panel_w - 120))) + 14

    # BOTTOM TRACK — chemistry → calcification
    by = 530
    bh = 280
    d.rounded_rectangle([110, by, 110 + panel_w, by + bh], radius=18,
                        outline=ACCENT, width=6, fill=ACCENT_LT)
    d.rectangle([110, by, 110 + panel_w, by + 70], fill=ACCENT)
    d.text((150, by + 16), "ACIDIFICATION  (chemistry, lower pH)  →  IMPAIRED CALCIFICATION",
           fill=CREAM, font=font("serif_bold", 36))
    bullets2 = [
        "Atmospheric CO2 dissolves into seawater:  CO2 + H2O → H2CO3 (carbonic acid) → ocean pH drops.",
        "This SEPARATE problem impairs CALCIFICATION — corals, shellfish & other calcifiers can't build",
        "their calcium-carbonate shells/skeletons, leaving weaker reef structures.",
    ]
    yy = by + 95
    for b in bullets2:
        d.text((150, yy), "•", fill=ACCENT, font=font("sans_bold", 34))
        for j, ln in enumerate(wrap(d, b, font("sans", 30), panel_w - 120)):
            d.text((195, yy + j * 38), ln, fill=INK, font=font("sans", 30))
        yy += 38 * (len(wrap(d, b, font("sans", 30), panel_w - 120))) + 8

    d.rounded_rectangle([110, 840, W - 110, 960], radius=18,
                        fill=(250, 232, 230), outline=HARM, width=5)
    centered(d, "WARMING (heat) bleaches;  ACIDIFICATION (lower pH) impairs calcification.",
             font("sans_bold", 32), 866, HARM)
    centered(d, "Both are CO2-linked, but they are distinct mechanisms — don't conflate them.",
             font("sans", 28), 908, MAROON)
deck.custom("10_climate_acidification", climate_acidification)


# 11 — three remaining human impacts (card row)
def other_impacts(img, d):
    d.text((110, 70), "Three more human impacts.",
           fill=MAROON, font=font("serif_bold", 70))

    cards = [
        ("HABITAT DESTRUCTION", ACCENT, "the LEADING cause\nof biodiversity loss",
         ["Deforestation", "Urbanization", "Agriculture"]),
        ("INVASIVE SPECIES", MAROON, "disrupt native\ncommunities",
         ["Zebra mussels", "Kudzu", "Brown tree snakes"]),
        ("OVERHARVESTING", HARM, "taking faster than\nspecies reproduce",
         ["Atlantic cod collapse", "Megafauna", "extinctions"]),
    ]
    card_w = 540
    card_h = 540
    gap = (W - 220 - card_w * 3) // 2
    y0 = 240
    for i, (label, color, head, exs) in enumerate(cards):
        cx = 110 + i * (card_w + gap)
        d.rounded_rectangle([cx, y0, cx + card_w, y0 + card_h], radius=20,
                            outline=color, width=6, fill=CARD)
        d.rectangle([cx, y0, cx + card_w, y0 + 90], fill=color)
        lf = font("serif_bold", 36)
        tw = d.textlength(label, font=lf)
        d.text((cx + card_w // 2 - tw / 2, y0 + 24), label, fill=CREAM, font=lf)
        hy = y0 + 130
        for ln in head.split("\n"):
            hf = font("sans_bold", 32)
            tw = d.textlength(ln, font=hf)
            d.text((cx + card_w // 2 - tw / 2, hy), ln, fill=INK, font=hf)
            hy += 44
        ey = y0 + 290
        d.text((cx + 50, ey - 50), "Examples:", fill=color, font=font("sans_bold", 30))
        for ex in exs:
            d.text((cx + 50, ey), "·  " + ex, fill=MUTED, font=font("sans", 30))
            ey += 52

    d.rounded_rectangle([110, 840, W - 110, 960], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Each one reduces biodiversity and destabilizes communities —",
             font("sans_bold", 32), 866, MAROON_DARK)
    centered(d, "the same diversity-and-stability link from Module 13.",
             font("sans", 28), 908, MAROON)
deck.custom("11_other_impacts", other_impacts)


# 12 — light/dark bottle productivity method (logic before math)
definition_card("12_productivity_def",
                "Light / dark bottle productivity.",
                "Light = NPP,  Dark = respiration,  GPP = NPP + R.",
                "Three bottles of the same pond water.  INITIAL sets the dissolved-oxygen baseline.  LIGHT does photosynthesis AND respiration, so its NET O2 change = NPP.  DARK has only respiration, so O2 only drops = R.  Key assumption: respiration runs at the SAME rate in both bottles, so add the dark drop back to the light net — the light bottle is NET, not gross.")


# 13 — pause + try (light/dark bottle calc)
deck.pause("13_pause1", "PAUSE  &  TRY",
           "Initial DO = 8 mg/L.  After 24h: LIGHT = 10,  DARK = 5.",
           "NPP, R, GPP = ?",
           hint="NPP = light − initial;  R = initial − dark;  GPP = NPP + R.  Pause now. Solve it. Press play.")

# 14 — duplicate for the answer-reveal section
deck.duplicate("13_pause1", "14_pause1_silence")


# 15 — recap
deck.recap("15_recap", "Recap.", [
    "Water cycle: solar-driven — evaporation, transpiration, condensation, precipitation, runoff, infiltration.",
    "Phosphorus: NO atmosphere, SLOW (rock weathering), often the LIMITING nutrient — the odd one out vs C and N.",
    "Eutrophication: fertilizer (N+P) → algal bloom → decomposers consume O2 → hypoxic DEAD ZONE; fish die from OXYGEN loss.",
    "Biomagnification: toxin CONCENTRATION rises up trophic levels (DDT, mercury, PCBs); bioaccumulation = within ONE organism.",
    "Climate: greenhouse gases warm → bleaching; dissolved CO2 SEPARATELY → carbonic acid → acidification → weak shells.",
    "Other impacts: habitat loss (leading cause), invasives, overharvesting.  Productivity: light = NPP, dark = R, GPP = NPP + R.",
], assignment=[
    "AP tip:  phosphorus has NO gas phase — never write that it evaporates.  Eutrophication kills via",
    "oxygen depletion, not poison.  Light bottle is NET (NPP); always add respiration back to get GPP.",
])


# 16 — path
deck.path("16_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Biology",   "Biogeochemical cycles + human impacts on biodiversity and ecosystems"),
    ("2.", "Khan Academy AP Bio",     "Unit 8 sets — nutrient cycles, eutrophication, biomagnification, productivity calc"),
    ("3.", "Assignment in dashboard", "GIIS Unit 8 advanced problem set — cycles, dead zones, light/dark bottle math"),
    ("4.", "Advisor check-in",        "If phosphorus 'no-atmosphere', biomagnification vs bioaccumulation, or GPP=NPP+R still feels shaky"),
], next_text="Next up:  Module 16 — AP Exam Synthesis & Review.")


print("AP Biology Module 15 slides built.")
