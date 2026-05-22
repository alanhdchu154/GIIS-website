"""AP Biology · Module 14 — Ecosystems and Energy Flow.

Teal (science) theme auto-resolved from "AP Biology". 17 slides total.
Custom diagrams: hook (grain-vs-beef acre comparison, 02), trophic-level tower
with side-spanning decomposers (04), the three ecological PYRAMIDS with the
inversion reasoning (12), the carbon cycle (13), and the nitrogen cycle's five
labeled steps + microbes (14). Pause slide (08) is duplicated to 09 so the same
image plays during both the question and the silent-answer sections.
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
deck = Deck(course="AP Biology", module_num=14, output_dir="slides", logo_path=LOGO)

ACCENT = deck.accent           # teal
ACCENT_LT = deck.accent_light  # light teal
CARD = deck.card_bg

GREEN = (52, 140, 84)
HARM = RED
ZERO = MUTED
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
           "Module 14 — Ecosystems and Energy Flow",
           "Sample lesson  ·  ~8 minutes")


# 02 — hook: grain-vs-beef acre comparison
def hook(img, d):
    d.text((110, 64), "Why does an acre of grain feed many — but an acre of beef, few?",
           fill=MAROON, font=font("serif_bold", 46))
    d.text((110, 138),
           "Same acre, same sunlight. The answer also explains why lions, sharks, and eagles are rare.",
           fill=MUTED, font=font("sans", 28))

    panel_w = 760
    panel_h = 520
    gap = 60
    start_x = (W - (panel_w * 2 + gap)) // 2
    y0 = 215

    def person(cx, cy, s, color):
        # tiny head + body icon
        d.ellipse([cx - 7 * s, cy - 18 * s, cx + 7 * s, cy - 4 * s], fill=color)
        d.polygon([(cx - 9 * s, cy + 18 * s), (cx + 9 * s, cy + 18 * s),
                   (cx, cy - 2 * s)], fill=color)

    # LEFT — grain acre feeds a crowd
    bx = start_x
    d.rounded_rectangle([bx, y0, bx + panel_w, y0 + panel_h], radius=20,
                        outline=GREEN, width=6, fill=CARD)
    d.rectangle([bx, y0, bx + panel_w, y0 + 70], fill=GREEN)
    tf = font("serif_bold", 36)
    txt = "1 acre of GRAIN"
    tw = d.textlength(txt, font=tf)
    d.text((bx + panel_w // 2 - tw / 2, y0 + 16), txt, fill=CREAM, font=tf)
    # wheat band
    d.rectangle([bx + 30, y0 + 95, bx + panel_w - 30, y0 + 175], fill=(214, 178, 90))
    for wx in range(bx + 55, bx + panel_w - 40, 34):
        d.line([(wx, y0 + 168), (wx, y0 + 108)], fill=(150, 110, 40), width=4)
    d.text((bx + 40, y0 + 190), "→ eaten directly  (1 trophic step)",
           fill=INK, font=font("sans_bold", 26))
    # crowd of people
    px, py = bx + 70, y0 + 290
    count = 0
    for r in range(3):
        for c in range(8):
            person(px + c * 80, py + r * 70, 1.5, GREEN)
            count += 1
    d.text((bx + 40, y0 + panel_h - 40), f"feeds ~{count} people",
           fill=GREEN, font=font("sans_bold", 30))

    # center contrast arrow
    ax = bx + panel_w + gap // 2
    ay = y0 + panel_h // 2
    d.text((ax - 26, ay - 110), "vs", fill=MAROON, font=font("serif_bold", 48))

    # RIGHT — beef acre feeds few
    rx = bx + panel_w + gap
    d.rounded_rectangle([rx, y0, rx + panel_w, y0 + panel_h], radius=20,
                        outline=HARM, width=6, fill=CARD)
    d.rectangle([rx, y0, rx + panel_w, y0 + 70], fill=HARM)
    txt = "1 acre of BEEF"
    tw = d.textlength(txt, font=tf)
    d.text((rx + panel_w // 2 - tw / 2, y0 + 16), txt, fill=CREAM, font=tf)
    # cow row
    for i in range(3):
        cxx = rx + 90 + i * 200
        cyy = y0 + 130
        d.ellipse([cxx, cyy, cxx + 130, cyy + 70], fill=(120, 78, 52))
        d.ellipse([cxx + 110, cyy + 8, cxx + 160, cyy + 48], fill=(120, 78, 52))
        for lx in (cxx + 20, cxx + 95):
            d.rectangle([lx, cyy + 60, lx + 12, cyy + 95], fill=(90, 56, 36))
    d.text((rx + 40, y0 + 240), "→ grain → cattle → people  (2 steps, ~90% lost)",
           fill=INK, font=font("sans_bold", 24))
    # few people
    px, py = rx + 90, y0 + 330
    fewn = 0
    for c in range(4):
        person(px + c * 90, py, 1.5, HARM)
        fewn += 1
    d.text((rx + 40, y0 + panel_h - 40), f"feeds only ~{fewn} people",
           fill=HARM, font=font("sans_bold", 30))

    # bottom punchline
    d.rounded_rectangle([110, 790, W - 110, 958], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Every trophic step throws away about 90% of the energy.",
             font("serif_bold", 38), 818, MAROON_DARK)
    centered(d, "That's the 10% rule — and it's coming up.",
             font("serif_ital", 32), 882, MAROON)
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Today's plan.", [
    "Energy FLOWS one-way (the 10% rule) — but matter CYCLES.",
    "Productivity & pyramids — GPP vs NPP, and which pyramids can invert.",
    "The carbon and nitrogen cycles — how the atoms get recycled.",
], footnote="Every example traces to CED 8.1-8.4  ·  Unit 8 is 10-15% of the AP exam.")


# 04 — trophic levels tower with side-spanning decomposers
def trophic_levels(img, d):
    d.text((110, 64), "Trophic levels  —  the tiers of an ecosystem.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 138),
           "Energy enters at the bottom and a fraction climbs each tier.  Decomposers act at EVERY level.",
           fill=MUTED, font=font("sans", 28))

    # tower geometry: bottom (widest) to top (narrowest)
    base_cx = 760
    y_bottom = 880
    tier_h = 130
    gap = 14
    tiers = [
        ("PRODUCERS  (autotrophs)", "fix energy via photosynthesis · plants, algae, cyanobacteria", 760, GREEN),
        ("PRIMARY CONSUMERS", "herbivores", 600, ACCENT),
        ("SECONDARY CONSUMERS", "carnivores that eat herbivores", 440, (60, 110, 150)),
        ("TERTIARY CONSUMERS", "top carnivores", 280, MAROON),
    ]
    for i, (name, sub, twdt, color) in enumerate(tiers):
        ty1 = y_bottom - i * (tier_h + gap)
        ty0 = ty1 - tier_h
        half = twdt // 2
        d.rectangle([base_cx - half, ty0, base_cx + half, ty1], fill=color)
        d.rectangle([base_cx - half, ty0, base_cx + half, ty1], outline=MAROON_DARK, width=3)
        nf = font("sans_bold", 30)
        tw = d.textlength(name, font=nf)
        d.text((base_cx - tw / 2, ty0 + 26), name, fill=CREAM, font=nf)
        sf = font("sans", 22)
        sw = d.textlength(sub, font=sf)
        d.text((base_cx - sw / 2, ty0 + 70), sub, fill=CREAM, font=sf)

    # upward energy arrow on the left of the tower
    arx = base_cx - 760 // 2 - 70
    d.line([(arx, y_bottom), (arx, y_bottom - 3 * (tier_h + gap) - tier_h + 30)],
           fill=MAROON_DARK, width=8)
    d.polygon([(arx - 16, y_bottom - 3 * (tier_h + gap) - tier_h + 40),
               (arx + 16, y_bottom - 3 * (tier_h + gap) - tier_h + 40),
               (arx, y_bottom - 3 * (tier_h + gap) - tier_h + 6)], fill=MAROON_DARK)
    d.text((arx - 60, (y_bottom + (y_bottom - 4 * tier_h)) // 2 - 40), "energy",
           fill=MAROON_DARK, font=font("sans_bold", 24))

    # decomposer column on the right spanning ALL levels
    dx0 = base_cx + 760 // 2 + 60
    dx1 = W - 110
    dy0 = y_bottom - 3 * (tier_h + gap) - tier_h
    d.rounded_rectangle([dx0, dy0, dx1, y_bottom], radius=18,
                        outline=(120, 90, 60), width=5, fill=(232, 222, 200))
    d.text((dx0 + 24, dy0 + 20), "DECOMPOSERS", fill=(110, 70, 40),
           font=font("serif_bold", 34))
    d.text((dx0 + 24, dy0 + 66), "bacteria & fungi", fill=(110, 70, 40),
           font=font("sans", 26))
    # arrows pointing INTO every tier
    for i in range(4):
        ay = y_bottom - i * (tier_h + gap) - tier_h // 2
        d.line([(dx0, ay), (dx0 - 44, ay)], fill=(110, 70, 40), width=6)
        d.polygon([(dx0 - 44, ay - 12), (dx0 - 44, ay + 12),
                   (dx0 - 70, ay)], fill=(110, 70, 40))
    d.text((dx0 + 24, y_bottom - 84),
           "recycle dead matter\n& waste from EVERY level",
           fill=(110, 70, 40), font=font("sans_bold", 24))

    # caption flag
    d.rounded_rectangle([110, 905, base_cx + 760 // 2, 968], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered2 = "Decomposers act at EVERY level, not just the end."
    cf = font("sans_bold", 28)
    cw = d.textlength(centered2, font=cf)
    d.text(((110 + base_cx + 760 // 2) / 2 - cw / 2, 922), centered2,
           fill=MAROON_DARK, font=cf)
deck.custom("04_trophic_levels", trophic_levels)


# 05 — energy vs matter (AP trap)
deck.compare("05_energy_vs_matter",
             "Energy vs matter  —  the unit's #1 trap.",
             {"label": "ENERGY — FLOWS (one-way)", "color": ACCENT,
              "lines": [
                  "Sun → producers → consumers",
                  "→ decomposers → lost as HEAT.",
                  "",
                  "NEVER recycled.",
                  "Must be constantly resupplied",
                  "by the sun.",
              ],
              "footnote": "One-way. Exits as heat."},
             {"label": "MATTER — CYCLES", "color": MAROON,
              "lines": [
                  "Carbon, nitrogen, and other",
                  "atoms are REUSED over and over",
                  "among organisms, soil,",
                  "water, and the atmosphere.",
                  "",
                  "Round and round, forever.",
              ],
              "footnote": "Don't say energy returns to producers."})


# 06 — the 10% rule
definition_card("06_ten_percent_rule",
                "The 10% rule  (ecological efficiency).",
                "~10% climbs to the next level. ~90% is lost.",
                "Only about 10% of the energy at one trophic level is built into the next level's biomass.  The other ~90% leaves as HEAT from cellular respiration, as UNDIGESTED material (feces), and as parts that are never eaten.  That loss is why food chains rarely exceed 4-5 levels — there isn't enough energy to support more.")


# 07 — worked energy budget
deck.equation("07_energy_budget", "Energy budget  —  ×10% at every step.", [
    ("Producers (NPP)   10,000 kcal", GREEN,  "NPP = GPP - producer respiration · what consumers can access"),
    ("Primary consumers  1,000 kcal", ACCENT, "x10%  (90% lost as heat, feces, unused parts)"),
    ("Secondary          100 kcal",   (60, 110, 150), "x10%"),
    ("Tertiary           10 kcal",    MAROON, "only 10 of 10,000 reach the top"),
])


# 08 — pause + try
deck.pause("08_pause1", "PAUSE  &  TRY",
           "Producers capture 50,000 kcal. Energy to SECONDARY consumers (3rd level)?",
           "50,000 → ? → ?",
           hint="Pause now. Solve it. Press play when you're ready.")

# 09 — duplicate for the answer-reveal section
deck.duplicate("08_pause1", "09_pause1_silence")


# 10 — GPP vs NPP equation
deck.equation("10_gpp_npp", "GPP vs NPP.", [
    ("GPP = total energy producers fix", GREEN,  "gross primary productivity"),
    ("NPP = GPP - producer respiration", MAROON, "the core equation"),
    ("NPP = energy AVAILABLE to consumers", ACCENT, "highest: rainforests, reefs, estuaries · lowest: deserts, deep ocean"),
])


# 11 — GPP vs NPP trap
deck.compare("11_gpp_npp_trap",
             "GPP vs NPP  —  which one feeds consumers?",
             {"label": "GPP", "color": ACCENT,
              "lines": [
                  "Total energy fixed.",
                  "INCLUDES energy producers",
                  "will burn for their own",
                  "respiration.",
                  "",
                  "The BIGGER number.",
              ],
              "footnote": "Gross = before producers respire."},
             {"label": "NPP", "color": MAROON,
              "lines": [
                  "GPP minus producer respiration.",
                  "Stored as NEW producer biomass.",
                  "What's AVAILABLE to the",
                  "next trophic level.",
                  "",
                  "The SMALLER number.",
              ],
              "footnote": "Consumers eat NPP — subtract respiration!"})


# 12 — the three ecological pyramids
def pyramids(img, d):
    d.text((110, 60), "Three pyramids  —  only ENERGY can never invert.",
           fill=MAROON, font=font("serif_bold", 52))

    def draw_pyramid(cx, base_y, levels, inverted=False):
        # levels: list of widths bottom→top (or top-heavy if inverted)
        tier_h = 52
        gap = 6
        for i, wdt in enumerate(levels):
            ty1 = base_y - i * (tier_h + gap)
            ty0 = ty1 - tier_h
            half = wdt // 2
            col = [GREEN, ACCENT, (60, 110, 150), MAROON][i % 4]
            d.rectangle([cx - half, ty0, cx + half, ty1], fill=col,
                        outline=MAROON_DARK, width=2)

    col_w = (W - 110 - 110)
    c1 = 110 + col_w // 6
    c2 = 110 + col_w // 2
    c3 = 110 + 5 * col_w // 6
    base_y = 560
    title_y = 200

    # (1) ENERGY — always upright
    d.text((c1 - 140, title_y), "ENERGY", fill=MAROON_DARK, font=font("serif_bold", 38))
    draw_pyramid(c1, base_y, [340, 250, 160, 80])
    d.text((c1 - 150, base_y + 24), "ALWAYS upright", fill=GREEN, font=font("sans_bold", 28))
    d.text((c1 - 150, base_y + 62), "(10% rule guarantees", fill=MUTED, font=font("sans", 24))
    d.text((c1 - 150, base_y + 92), "less energy each level)", fill=MUTED, font=font("sans", 24))

    # (2) BIOMASS — can invert
    d.text((c2 - 150, title_y), "BIOMASS", fill=MAROON_DARK, font=font("serif_bold", 38))
    draw_pyramid(c2, base_y, [110, 200, 290, 360])  # top-heavy = inverted
    d.text((c2 - 150, base_y + 24), "CAN invert (aquatic)", fill=HARM, font=font("sans_bold", 28))
    d.text((c2 - 150, base_y + 62), "standing crop = snapshot", fill=MUTED, font=font("sans", 24))
    d.text((c2 - 150, base_y + 92), "of mass at one instant", fill=MUTED, font=font("sans", 24))

    # (3) NUMBERS — can invert
    d.text((c3 - 150, title_y), "NUMBERS", fill=MAROON_DARK, font=font("serif_bold", 38))
    draw_pyramid(c3, base_y, [90, 180, 280, 360])
    d.text((c3 - 150, base_y + 24), "CAN invert", fill=HARM, font=font("sans_bold", 28))
    d.text((c3 - 150, base_y + 62), "one tree supports", fill=MUTED, font=font("sans", 24))
    d.text((c3 - 150, base_y + 92), "many insects", fill=MUTED, font=font("sans", 24))

    # reasoning banner
    d.rounded_rectangle([110, 780, W - 110, 958], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "WHY biomass can flip: fast-turnover phytoplankton are eaten so quickly that little mass exists",
             font("sans_bold", 30), 800, MAROON_DARK)
    centered(d, "at any instant — yet they still supply MORE energy over time than the zooplankton above them.",
             font("sans", 28), 846, MAROON)
    centered(d, "Standing crop can invert; total productivity cannot — so the ENERGY pyramid never flips.",
             font("sans_bold", 30), 902, MAROON_DARK)
deck.custom("12_pyramids", pyramids)


# 13 — carbon cycle
def carbon_cycle(img, d):
    d.text((110, 60), "The carbon cycle.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 138),
           "Photosynthesis fixes CO2 into life; respiration sends it back. Some is locked away for ages.",
           fill=MUTED, font=font("sans", 28))

    # central atmosphere pool
    atm_cx, atm_cy = W // 2, 320
    d.rounded_rectangle([atm_cx - 230, atm_cy - 70, atm_cx + 230, atm_cy + 70],
                        radius=20, fill=(190, 210, 230), outline=MAROON_DARK, width=4)
    centered(d, "ATMOSPHERIC CO2", font("serif_bold", 38), atm_cy - 48, MAROON_DARK)
    centered(d, "280 ppm (pre-industrial) → >420 ppm (2024)",
             font("sans_bold", 26), atm_cy + 8, MAROON)

    # producers (left) — photosynthesis pulls CO2 in
    prod_cx, prod_cy = 360, 640
    d.rounded_rectangle([prod_cx - 200, prod_cy - 70, prod_cx + 200, prod_cy + 70],
                        radius=18, fill=ACCENT_LT, outline=GREEN, width=4)
    centered_x = prod_cx
    cf = font("serif_bold", 32)
    tw = d.textlength("PRODUCERS", font=cf); d.text((centered_x - tw / 2, prod_cy - 48), "PRODUCERS", fill=GREEN, font=cf)
    sf = font("sans", 24)
    tw = d.textlength("(fixed into glucose)", font=sf); d.text((centered_x - tw / 2, prod_cy + 6), "(fixed into glucose)", fill=MUTED, font=sf)
    # photosynthesis arrow: atmosphere → producers
    d.line([(atm_cx - 120, atm_cy + 70), (prod_cx + 60, prod_cy - 70)], fill=GREEN, width=7)
    d.polygon([(prod_cx + 60, prod_cy - 70), (prod_cx + 92, prod_cy - 64),
               (prod_cx + 70, prod_cy - 96)], fill=GREEN)
    d.text((360, 470), "photosynthesis →", fill=GREEN, font=font("sans_bold", 26))

    # consumers/decomposers (right) — respiration returns CO2
    cons_cx, cons_cy = W - 360, 640
    d.rounded_rectangle([cons_cx - 220, cons_cy - 70, cons_cx + 220, cons_cy + 70],
                        radius=18, fill=CARD, outline=MAROON, width=4)
    tw = d.textlength("CONSUMERS & DECOMPOSERS", font=font("serif_bold", 28))
    d.text((cons_cx - tw / 2, cons_cy - 48), "CONSUMERS & DECOMPOSERS", fill=MAROON, font=font("serif_bold", 28))
    tw = d.textlength("respire CO2 back", font=sf); d.text((cons_cx - tw / 2, cons_cy + 6), "respire CO2 back", fill=MUTED, font=sf)
    # respiration arrow: consumers → atmosphere
    d.line([(cons_cx - 60, cons_cy - 70), (atm_cx + 120, atm_cy + 70)], fill=MAROON, width=7)
    d.polygon([(atm_cx + 120, atm_cy + 70), (atm_cx + 150, atm_cy + 60),
               (atm_cx + 152, atm_cy + 96)], fill=MAROON)
    d.text((W - 560, 470), "← respiration", fill=MAROON, font=font("sans_bold", 26))

    # long-term storage box
    d.rounded_rectangle([110, 770, W - 110, 880], radius=16,
                        fill=(230, 224, 210), outline=(120, 90, 60), width=4)
    d.text((140, 786), "Long-term storage (slow exchange):", fill=(110, 70, 40),
           font=font("serif_bold", 30))
    d.text((140, 832),
           "fossil fuels (coal, oil, gas = buried biomass)  ·  carbonate rocks (limestone)  ·  dissolved ocean CO2",
           fill=INK, font=font("sans", 26))

    # human disruption banner
    d.rounded_rectangle([110, 895, W - 110, 962], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "Burning fossil fuels moves ancient carbon to the air → warming + ocean acidification (CO2 + H2O → H2CO3 → lower pH).",
             font("sans_bold", 26), 916, MAROON_DARK)
deck.custom("13_carbon_cycle", carbon_cycle)


# 14 — nitrogen cycle: 5 steps + microbes
def nitrogen_cycle(img, d):
    d.text((110, 56), "The nitrogen cycle  —  5 steps, and the microbes.",
           fill=MAROON, font=font("serif_bold", 50))
    d.rounded_rectangle([110, 128, W - 110, 186], radius=14,
                        fill=(190, 210, 230), outline=MAROON_DARK, width=3)
    centered(d, "N2 is 78% of the atmosphere — but inert. Most organisms can't use it directly.",
             font("sans_bold", 28), 144, MAROON_DARK)

    steps = [
        ("1 · FIXATION", "N2  →  NH3 / NH4+",
         "Rhizobium (legume nodules), cyanobacteria,  or Haber-Bosch (industrial)", GREEN),
        ("2 · NITRIFICATION", "NH4+  →  NO2-  →  NO3-",
         "soil bacteria: Nitrosomonas, then Nitrobacter", ACCENT),
        ("3 · ASSIMILATION", "NO3- / NH4+  →  amino acids, nucleic acids",
         "plants take it up; animals get N by eating", (60, 110, 150)),
        ("4 · AMMONIFICATION", "organic N  →  NH4+",
         "decomposers break down dead matter & waste", (150, 110, 50)),
        ("5 · DENITRIFICATION", "NO3-  →  N2 gas",
         "anaerobic bacteria return N to the atmosphere", MAROON),
    ]
    y = 210
    row_h = 118
    band_w = 420
    for label, eq, micro, color in steps:
        d.rounded_rectangle([110, y, W - 110, y + row_h - 14], radius=14,
                            fill=CARD, outline=color, width=4)
        d.rectangle([110, y, 110 + band_w, y + row_h - 14], fill=color)
        lf = font("serif_bold", 30)
        # step label centered in the colored band (label only — microbe goes right)
        lw = d.textlength(label, font=lf)
        d.text((110 + (band_w - lw) / 2, y + (row_h - 14) / 2 - 18), label,
               fill=CREAM, font=lf)
        # equation + microbe line stacked in the wide right area
        d.text((110 + band_w + 30, y + 16), eq, fill=INK, font=font("mono", 38))
        d.text((110 + band_w + 32, y + 66), micro, fill=MUTED, font=font("sans", 22))
        y += row_h

    # trap flag
    d.rounded_rectangle([110, y + 4, W - 110, y + 60], radius=14,
                        fill=ACCENT_LT, outline=MAROON, width=4)
    centered(d, "FIXATION = N2 → ammonia ONLY.   Excess fertilizer runoff can cause eutrophication (Module 15).",
             font("sans_bold", 26), y + 16, MAROON_DARK)
deck.custom("14_nitrogen_cycle", nitrogen_cycle)


# 15 — nitrogen fixation trap
deck.compare("15_nitrogen_trap",
             "What 'nitrogen fixation' really means.",
             {"label": "FIXATION (the only thing that counts)", "color": GREEN,
              "lines": [
                  "Atmospheric N2 (gas)",
                  "→  NH3 / NH4+ (ammonia).",
                  "",
                  "Done by Rhizobium,",
                  "cyanobacteria, or",
                  "Haber-Bosch.",
              ],
              "footnote": "Starts at N2, ends at ammonia."},
             {"label": "NOT fixation (common errors)", "color": HARM,
              "lines": [
                  "Nitrification (NH4+ → NO3-)",
                  "Assimilation (plant uptake)",
                  "Ammonification (organic N → NH4+)",
                  "Denitrification (NO3- → N2)",
                  "",
                  "All different steps.",
              ],
              "footnote": "No N2-to-ammonia? Not fixation."})


# 16 — recap
deck.recap("16_recap", "Recap.", [
    "Energy FLOWS one-way and exits as heat; matter CYCLES — never say energy is reused.",
    "10% rule: ~10% of energy moves UP, ~90% lost as heat, feces, unused parts → short food chains.",
    "NPP = GPP - producer respiration; consumers eat NPP, not GPP.",
    "Energy pyramid ALWAYS upright; biomass & numbers pyramids CAN invert (standing crop vs productivity).",
    "Carbon: photosynthesis fixes it, respiration releases it; fossil fuels spiked CO2 280 → >420 ppm.",
    "Nitrogen: fixation, nitrification, assimilation, ammonification, denitrification — fixation = N2 → ammonia only.",
], assignment=[
    "AP tip:  to find energy at a higher level, multiply by 10% (×0.10) once per step up.",
    "Asked what's available to consumers?  Use NPP, and subtract producer respiration from GPP.",
])


# 17 — path
deck.path("17_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Biology",   "Energy flow through ecosystems + the biogeochemical cycles"),
    ("2.", "Khan Academy AP Bio",     "Unit 8 problem sets — 10% rule, GPP/NPP, carbon & nitrogen cycles"),
    ("3.", "Assignment in dashboard", "GIIS Module 14 energy-budget + nitrogen-step practice"),
    ("4.", "Advisor check-in",        "If GPP vs NPP or pyramid inversion still feels fuzzy"),
], next_text="Next up:  Module 15 — Ecosystems: Advanced Applications (biomagnification, dead zones, climate).")


print("AP Biology Module 14 slides built.")
