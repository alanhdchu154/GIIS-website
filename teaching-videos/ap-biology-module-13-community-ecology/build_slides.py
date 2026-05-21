"""AP Biology · Module 13 — Community Ecology.

Teal (science) theme auto-resolved from "AP Biology". 16 slides total.
Custom diagrams: hook (Paine's intertidal before/after the sea star removal),
the six-interaction +/-/0 master TABLE (04), the predator-prey OSCILLATION
graph (08, two out-of-phase curves), and keystone disproportionate-impact (12).
Pause slide (10) is duplicated to 11 so the same image plays during both the
question and the silent-answer sections.
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
deck = Deck(course="AP Biology", module_num=13, output_dir="slides", logo_path=LOGO)

ACCENT = deck.accent           # teal
ACCENT_LT = deck.accent_light  # light teal
CARD = deck.card_bg

GREEN = (52, 140, 84)   # "+" benefit
HARM  = RED             # "-" harm
ZERO  = MUTED           # "0" unaffected


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
        # wrapped sub-caption, centered, multiple lines under the card
        f_s = font("sans", 38)
        s_lines = wrap(d, sub, f_s, W - 360)
        sy = 620
        for line in s_lines:
            centered(d, line, f_s, sy, MUTED)
            sy += 54
    deck.custom(slug, render)


# 01 — title
deck.title("01_title", "AP Biology",
           "Module 13 — Community Ecology",
           "Sample lesson  ·  ~9 minutes")


# 02 — hook: Paine's intertidal, before (diverse) vs after (mussel monoculture)
def hook(img, d):
    d.text((110, 70), "Remove ONE uncommon species. The whole community collapses.",
           fill=MAROON, font=font("serif_bold", 48))
    d.text((110, 145),
           "Robert Paine pulled a single sea star, Pisaster ochraceus, from a tidal zone — not even the most abundant animal there.",
           fill=MUTED, font=font("sans", 28))

    panel_w = 760
    panel_h = 520
    gap = 60
    start_x = (W - (panel_w * 2 + gap)) // 2
    y0 = 230
    import random

    # BEFORE panel — diverse community
    bx = start_x
    d.rounded_rectangle([bx, y0, bx + panel_w, y0 + panel_h], radius=20,
                        outline=ACCENT, width=6, fill=CARD)
    d.rectangle([bx, y0, bx + panel_w, y0 + 70], fill=ACCENT)
    tf = font("serif_bold", 36)
    txt = "BEFORE  ·  diverse"
    tw = d.textlength(txt, font=tf)
    d.text((bx + panel_w // 2 - tw / 2, y0 + 16), txt, fill=CREAM, font=tf)
    # water field
    d.rounded_rectangle([bx + 30, y0 + 95, bx + panel_w - 30, y0 + panel_h - 30],
                        radius=14, fill=ACCENT_LT)
    # varied invertebrates: different shapes/colors
    palette = [MAROON, MAROON_DARK, (200, 120, 50), (70, 110, 170),
               (140, 80, 160), GREEN, ACCENT]
    random.seed(13)
    for i in range(26):
        cx = bx + 80 + random.randint(0, panel_w - 200)
        cy = y0 + 150 + random.randint(0, panel_h - 230)
        c = palette[i % len(palette)]
        if i % 3 == 0:
            d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=c)
        elif i % 3 == 1:
            d.rectangle([cx - 12, cy - 12, cx + 12, cy + 12], fill=c)
        else:
            d.polygon([(cx, cy - 16), (cx - 15, cy + 12), (cx + 15, cy + 12)],
                      fill=c)
    # the sea star (5-point) being plucked
    sx, sy = bx + panel_w - 150, y0 + panel_h - 130
    star_pts = []
    for k in range(10):
        ang = math.pi / 2 + k * math.pi / 5
        r = 42 if k % 2 == 0 else 17
        star_pts.append((sx + r * math.cos(ang), sy - r * math.sin(ang)))
    d.polygon(star_pts, fill=(212, 90, 60), outline=MAROON_DARK)
    d.text((sx - 120, sy + 50), "Pisaster (keystone)",
           fill=MAROON_DARK, font=font("sans_bold", 22))

    # plucking arrow between panels
    ax = bx + panel_w + gap // 2
    ay = y0 + panel_h // 2
    d.line([(ax - 26, ay), (ax + 26, ay)], fill=MAROON, width=10)
    d.polygon([(ax + 26, ay - 16), (ax + 26, ay + 16), (ax + 54, ay)],
              fill=MAROON)
    d.text((ax - 70, ay - 70), "remove",
           fill=MAROON, font=font("sans_bold", 24))
    d.text((ax - 88, ay + 36), "1 species",
           fill=MAROON, font=font("sans_bold", 24))

    # AFTER panel — mussel monoculture
    rx = bx + panel_w + gap
    d.rounded_rectangle([rx, y0, rx + panel_w, y0 + panel_h], radius=20,
                        outline=RED, width=6, fill=CARD)
    d.rectangle([rx, y0, rx + panel_w, y0 + 70], fill=RED)
    txt = "AFTER  ·  mussel monoculture"
    tw = d.textlength(txt, font=tf)
    d.text((rx + panel_w // 2 - tw / 2, y0 + 16), txt, fill=CREAM, font=tf)
    d.rounded_rectangle([rx + 30, y0 + 95, rx + panel_w - 30, y0 + panel_h - 30],
                        radius=14, fill=ACCENT_LT)
    # a wall of identical mussels (dark blue ovals, tightly packed)
    mussel = (40, 52, 96)
    yy = y0 + 130
    row = 0
    while yy < y0 + panel_h - 60:
        offset = 30 if row % 2 else 0
        xx = rx + 60 + offset
        while xx < rx + panel_w - 70:
            d.ellipse([xx, yy, xx + 44, yy + 70], fill=mussel,
                      outline=(20, 28, 60))
            xx += 56
        yy += 56
        row += 1
    d.text((rx + 40, y0 + panel_h - 30), "one species — biodiversity gone",
           fill=RED, font=font("sans_bold", 22))

    # bottom punchline
    d.rounded_rectangle([110, 800, W - 110, 960], radius=20,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "How can one rare species hold a whole community together?",
             font("serif_bold", 36), 828, MAROON_DARK)
    centered(d, "That's the puzzle of community ecology — and we answer it today.",
             font("serif_ital", 30), 888, MAROON)
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "How species INTERACT — six interactions, their +/-/0 signs, and competition.",
    "How predators, prey, and defenses SHAPE each other — and keystone species.",
    "How communities CHANGE and how we MEASURE them — succession + diversity.",
], footnote="Every example traces to CED 8.5-8.7  ·  Unit 8 is 10-15% of the AP exam.")


# 04 — the six-interaction +/-/0 master TABLE
def interactions_table(img, d):
    d.text((110, 60), "The six interspecific interactions.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 140),
           "Each sign = the effect on THAT species.  Predation, herbivory, parasitism are all +/-.",
           fill=MUTED, font=font("sans", 28))

    # Grid geometry
    tx0 = 110
    tx1 = W - 110
    ty0 = 200
    n_rows = 7          # header + 6 interactions
    row_h = 96
    # columns: Interaction | Sp.1 | Sp.2 | Example
    col_x = [tx0, tx0 + 470, tx0 + 640, tx0 + 810, tx1]
    col_titles = ["Interaction", "Sp. 1", "Sp. 2", "Example"]

    # header band
    d.rectangle([tx0, ty0, tx1, ty0 + row_h], fill=MAROON)
    hf = font("sans_bold", 32)
    for c in range(4):
        cx_center = (col_x[c] + col_x[c + 1]) // 2
        tw = d.textlength(col_titles[c], font=hf)
        if c == 0 or c == 3:
            d.text((col_x[c] + 24, ty0 + 28), col_titles[c], fill=CREAM, font=hf)
        else:
            d.text((cx_center - tw / 2, ty0 + 28), col_titles[c], fill=CREAM, font=hf)

    rows = [
        ("Competition", "-", "-", "two warbler species, same tree", HARM, HARM),
        ("Predation",   "+", "-", "lynx  /  hare",                 GREEN, HARM),
        ("Herbivory",   "+", "-", "deer  /  plant",                GREEN, HARM),
        ("Parasitism",  "+", "-", "tapeworm  /  host",             GREEN, HARM),
        ("Mutualism",   "+", "+", "coral / zooxanthellae · mycorrhizae / roots", GREEN, GREEN),
        ("Commensalism","+", "0", "barnacle on a whale",           GREEN, ZERO),
    ]
    nf = font("sans_bold", 34)
    sf = font("sans_bold", 46)
    ef = font("sans", 28)
    for i, (name, s1, s2, ex, c1, c2) in enumerate(rows):
        ry = ty0 + row_h * (i + 1)
        band = CARD if i % 2 == 0 else ACCENT_LT
        d.rectangle([tx0, ry, tx1, ry + row_h], fill=band)
        # interaction name
        d.text((col_x[0] + 24, ry + 26), name, fill=INK, font=nf)
        # sign cells — centered, colored
        for cidx, (sign, scol) in enumerate([(s1, c1), (s2, c2)], start=1):
            cx_center = (col_x[cidx] + col_x[cidx + 1]) // 2
            tw = d.textlength(sign, font=sf)
            d.text((cx_center - tw / 2, ry + 18), sign, fill=scol, font=sf)
        # example
        d.text((col_x[3] + 24, ry + 30), ex, fill=MUTED, font=ef)

    # outer + column gridlines
    bottom = ty0 + row_h * n_rows
    d.rectangle([tx0, ty0, tx1, bottom], outline=MAROON_DARK, width=4)
    for cx in col_x[1:-1]:
        d.line([(cx, ty0), (cx, bottom)], fill=GRID_LINE, width=2)
    for r in range(n_rows + 1):
        ly = ty0 + row_h * r
        d.line([(tx0, ly), (tx1, ly)], fill=GRID_LINE, width=2)

    # footnote (two lines so nothing runs off the right edge)
    d.text((110, bottom + 22),
           "Sign-name holds even if you swap columns.  Asymmetric ones: predation, herbivory, parasitism, commensalism.",
           fill=MAROON, font=font("sans_bold", 26))
    d.text((110, bottom + 56),
           "Keep the + attached to whichever organism actually benefits.",
           fill=MAROON, font=font("sans_bold", 26))

# GRID_LINE used above
GRID_LINE = (190, 178, 158)
deck.custom("04_interactions_table", interactions_table)


# 05 — sign trap (three-column compare; compare() supports two, so custom)
def signs_compare(img, d):
    d.text((110, 70), "The AP sign trap  —  read the SECOND species.",
           fill=MAROON, font=font("serif_bold", 54))
    d.text((110, 150),
           "First confirm ONE species clearly benefits (+).  Then these three differ ONLY in what happens to the other.",
           fill=MUTED, font=font("sans", 28))

    panel_w = 560
    panel_h = 520
    gap = 30
    start_x = (W - (panel_w * 3 + gap * 2)) // 2
    y0 = 250

    cols = [
        ("MUTUALISM", "+ / +", GREEN, "BOTH benefit.",
         ["coral / zooxanthellae", "mycorrhizae / plant roots"]),
        ("COMMENSALISM", "+ / 0", ACCENT, "One benefits,\nthe other UNAFFECTED.",
         ["barnacle on a whale"]),
        ("PARASITISM", "+ / -", HARM, "One benefits,\nthe other HARMED.",
         ["tapeworm / host"]),
    ]
    for i, (label, sign, color, head, exs) in enumerate(cols):
        px = start_x + i * (panel_w + gap)
        d.rounded_rectangle([px, y0, px + panel_w, y0 + panel_h], radius=20,
                            outline=color, width=6, fill=CARD)
        d.rectangle([px, y0, px + panel_w, y0 + 80], fill=color)
        lf = font("serif_bold", 38)
        tw = d.textlength(label, font=lf)
        d.text((px + panel_w // 2 - tw / 2, y0 + 18), label, fill=CREAM, font=lf)
        # big sign
        sgf = font("mono", 88)
        tw = d.textlength(sign, font=sgf)
        d.text((px + panel_w // 2 - tw / 2, y0 + 110), sign, fill=color, font=sgf)
        # head (maybe multiline)
        hy = y0 + 240
        for ln in head.split("\n"):
            twh = d.textlength(ln, font=font("sans_bold", 30))
            d.text((px + panel_w // 2 - twh / 2, hy), ln,
                   fill=INK, font=font("sans_bold", 30))
            hy += 42
        # examples
        ey = y0 + 360
        for ex in exs:
            twe = d.textlength(ex, font=font("sans", 26))
            d.text((px + panel_w // 2 - twe / 2, ey), ex, fill=MUTED, font=font("sans", 26))
            ey += 42

    # guardrail strip
    d.rounded_rectangle([110, 830, W - 110, 960], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Guardrail:  if NEITHER species benefits (- / -), it's COMPETITION —",
             font("sans_bold", 32), 858, MAROON_DARK)
    centered(d, "not one of these three.  The second-species trick only applies once one is a +.",
             font("sans", 28), 905, MAROON)
deck.custom("05_signs_compare", signs_compare)


# 06 — competitive exclusion vs resource partitioning
definition_card("06_competitive_exclusion",
                "Competitive exclusion.",
                "Gause:  same limiting resource → one wins.",
                "Two species using the EXACT same limiting resource can't coexist indefinitely.  Resource partitioning is the escape hatch:  MacArthur's warblers split one spruce tree by feeding in different parts — same tree, different niches, both survive.")


# 07 — fundamental vs realized niche
deck.compare("07_niche_compare",
             "Fundamental vs realized niche.",
             {"label": "FUNDAMENTAL NICHE", "color": ACCENT,
              "lines": [
                  "Everything a species COULD occupy",
                  "with NO competitors around.",
                  "",
                  "The full tolerable range —",
                  "the big shaded zone.",
              ],
              "footnote": "What's possible in principle."},
             {"label": "REALIZED NICHE", "color": MAROON,
              "lines": [
                  "What it ACTUALLY occupies after",
                  "negative interactions — chiefly",
                  "competition, plus predation.",
                  "",
                  "A SUBSET nested inside.",
              ],
              "footnote": "Interactions SHRINK it — never expand it."})


# 08 — predator-prey OSCILLATION graph
def predator_prey(img, d):
    d.text((110, 60), "Predator-prey oscillation.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 140),
           "Lotka-Volterra equations predict cyclical, out-of-phase oscillations — prey rise, predators follow.",
           fill=MUTED, font=font("sans", 28))

    # graph frame
    gx0 = 220
    gy0 = 760
    gx1 = W - 160
    gy1 = 240
    mid = (gy0 + gy1) // 2
    amp = (gy0 - gy1) * 0.32
    # axes
    d.line([(gx0, gy1), (gx0, gy0)], fill=MAROON_DARK, width=5)
    d.line([(gx0, gy0), (gx1, gy0)], fill=MAROON_DARK, width=5)
    # axis labels
    d.text((90, mid - 90), "population", fill=MAROON_DARK, font=font("sans_bold", 26))
    d.text((90, mid - 56), "size", fill=MAROON_DARK, font=font("sans_bold", 26))
    d.text((gx1 - 90, gy0 + 18), "time →", fill=MAROON_DARK, font=font("sans_bold", 26))

    span = gx1 - gx0 - 30
    # prey curve (peaks first) — teal; predator lags by phase shift — maroon
    prey_pts = []
    pred_pts = []
    cycles = 2.6
    phase = 0.9  # predator lags prey
    for i in range(span + 1):
        t = i / span * cycles * 2 * math.pi
        x = gx0 + 15 + i
        prey_y = mid - amp * math.sin(t)
        pred_y = mid - amp * 0.78 * math.sin(t - phase)
        prey_pts.append((x, prey_y))
        pred_pts.append((x, pred_y))
    d.line(prey_pts, fill=ACCENT, width=7, joint="curve")
    d.line(pred_pts, fill=MAROON, width=7, joint="curve")

    # legend
    lx, ly = gx0 + 60, gy1 + 10
    d.rounded_rectangle([lx, ly, lx + 470, ly + 110], radius=14,
                        fill=CARD, outline=MAROON_DARK, width=3)
    d.line([(lx + 24, ly + 32), (lx + 84, ly + 32)], fill=ACCENT, width=7)
    d.text((lx + 100, ly + 16), "Prey — snowshoe hare (peaks first)",
           fill=INK, font=font("sans_bold", 26))
    d.line([(lx + 24, ly + 78), (lx + 84, ly + 78)], fill=MAROON, width=7)
    d.text((lx + 100, ly + 62), "Predator — Canada lynx (lags behind)",
           fill=INK, font=font("sans_bold", 26))

    # data caption strip
    d.rounded_rectangle([110, 820, W - 110, 960], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Real data: Canada lynx & snowshoe hare from Hudson's Bay fur records — ~10-year cycles.",
             font("sans_bold", 30), 848, MAROON_DARK)
    centered(d, "The model captures the pattern; real cycles involve more than these two species alone.",
             font("sans", 28), 902, MAROON)
deck.custom("08_predator_prey", predator_prey)


# 09 — defenses + Batesian vs Mullerian mimicry
def defenses_mimicry(img, d):
    d.text((110, 60), "Defenses  &  mimicry.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 138),
           "Defense toolkit: cryptic (camouflage) · aposematic (warning — poison dart frogs) · behavioral · chemical.",
           fill=MUTED, font=font("sans", 27))

    panel_w = 830
    panel_h = 560
    gap = 40
    start_x = (W - (panel_w * 2 + gap)) // 2
    y0 = 220

    # LEFT — Batesian
    lx = start_x
    d.rounded_rectangle([lx, y0, lx + panel_w, y0 + panel_h], radius=20,
                        outline=HARM, width=6, fill=CARD)
    d.rectangle([lx, y0, lx + panel_w, y0 + 80], fill=HARM)
    tf = font("serif_bold", 40)
    txt = "BATESIAN  —  a bluff  (+ / -)"
    tw = d.textlength(txt, font=tf)
    d.text((lx + panel_w // 2 - tw / 2, y0 + 18), txt, fill=CREAM, font=tf)
    lines = [
        ("A PALATABLE, undefended species", INK),
        ("copies an UNPALATABLE, defended one.", INK),
        ("Only the model is truly defended,", MUTED),
        ("so the mimic freeloads —", MUTED),
        ("effectively PARASITIC.", MAROON),
        ("", INK),
        ("The viceroy/monarch pair was later", MUTED),
        ("reconsidered, but the term still", MUTED),
        ("applies to many cases.", MUTED),
    ]
    yy = y0 + 110
    for ln, c in lines:
        d.text((lx + 36, yy), ln, fill=c,
               font=font("sans_bold", 30) if c == MAROON else font("sans", 30))
        yy += 46

    # RIGHT — Mullerian
    rx = lx + panel_w + gap
    d.rounded_rectangle([rx, y0, rx + panel_w, y0 + panel_h], radius=20,
                        outline=GREEN, width=6, fill=ACCENT_LT)
    d.rectangle([rx, y0, rx + panel_w, y0 + 80], fill=GREEN)
    txt = "MÜLLERIAN  —  shared signal  (+ / +)"
    tw = d.textlength(txt, font=tf)
    d.text((rx + panel_w // 2 - tw / 2, y0 + 18), txt, fill=CREAM, font=tf)
    lines = [
        ("MULTIPLE defended species share", INK),
        ("the SAME warning pattern.", INK),
        ("All are genuinely defended.", MUTED),
        ("A predator learns the signal once,", MUTED),
        ("so each species pays a smaller price —", MUTED),
        ("effectively MUTUALISTIC.", MAROON),
        ("", INK),
        ("Mimicry = resembling another ORGANISM,", MUTED),
        ("not blending in (that's camouflage).", MUTED),
    ]
    yy = y0 + 110
    for ln, c in lines:
        d.text((rx + 36, yy), ln, fill=c,
               font=font("sans_bold", 30) if c == MAROON else font("sans", 30))
        yy += 46

    # bottom directionality cue
    d.rounded_rectangle([110, 820, W - 110, 960], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Undefended-copies-defended = Batesian.",
             font("sans_bold", 34), 846, MAROON_DARK)
    centered(d, "Many-defended-share-a-signal = Müllerian.",
             font("sans_bold", 34), 898, MAROON_DARK)
deck.custom("09_defenses_mimicry", defenses_mimicry)


# 10 — pause + try (mimicry classification)
# pause() does NOT wrap the prompt or the big equation — keep both short so
# nothing runs off the slide edge. Full scenario is in the narration.
deck.pause("10_pause1", "PAUSE  &  TRY",
           "A: undefended fly mimics a wasp.   B: many toxic species, one pattern.",
           "A, B  =  ?",
           hint="Pause now. Solve it. Press play when you're ready.")

# 11 — duplicate for the answer-reveal section
deck.duplicate("10_pause1", "11_pause1_silence")


# 12 — keystone species (disproportionate impact)
def keystone(img, d):
    d.text((110, 60), "Keystone species  —  impact, not abundance.",
           fill=MAROON, font=font("serif_bold", 54))
    # definition banner
    d.rounded_rectangle([110, 150, W - 110, 290], radius=18,
                        fill=ACCENT, outline=MAROON_DARK, width=4)
    centered(d, "An effect on the community DISPROPORTIONATELY LARGE relative to its ABUNDANCE —",
             font("sans_bold", 32), 178, CREAM)
    centered(d, "NOT defined by being the most abundant or the largest organism.",
             font("sans_bold", 32), 228, CREAM)

    # small organism → big arrow → big impact visual
    sx = 230
    sy = 430
    # tiny sea star
    star_pts = []
    for k in range(10):
        ang = math.pi / 2 + k * math.pi / 5
        r = 36 if k % 2 == 0 else 15
        star_pts.append((sx + r * math.cos(ang), sy - r * math.sin(ang)))
    d.polygon(star_pts, fill=(212, 90, 60), outline=MAROON_DARK)
    d.text((sx - 70, sy + 60), "rare / small", fill=MUTED, font=font("sans_bold", 24))
    # big widening arrow
    d.polygon([(sx + 70, sy - 26), (sx + 70, sy + 26),
               (sx + 250, sy + 70), (sx + 250, sy - 70)], fill=ACCENT_LT,
              outline=MAROON, width=3)
    d.text((sx + 95, sy - 16), "outsized", fill=MAROON, font=font("sans_bold", 28))
    d.text((sx + 300, sy - 16), "→  whole-community impact",
           fill=MAROON_DARK, font=font("serif_bold", 36))

    # two case cards
    cy = 560
    cw = (W - 110 - 110 - 40) // 2
    ch = 250
    # case 1 — Paine's Pisaster
    c1x = 110
    d.rounded_rectangle([c1x, cy, c1x + cw, cy + ch], radius=18,
                        outline=MAROON, width=5, fill=CARD)
    d.text((c1x + 28, cy + 20), "Paine's Pisaster  (callback)",
           fill=MAROON_DARK, font=font("serif_bold", 32))
    for j, ln in enumerate([
        "Remove the rare sea star →",
        "mussels take over →",
        "biodiversity collapses.",
    ]):
        d.text((c1x + 28, cy + 80 + j * 50), ln, fill=INK, font=font("sans", 28))

    # case 2 — Yellowstone wolves
    c2x = c1x + cw + 40
    d.rounded_rectangle([c2x, cy, c2x + cw, cy + ch], radius=18,
                        outline=MAROON, width=5, fill=CARD)
    d.text((c2x + 28, cy + 20), "Yellowstone wolves",
           fill=MAROON_DARK, font=font("serif_bold", 32))
    for j, ln in enumerate([
        "Top-down predator pressure →",
        "a TROPHIC CASCADE.",
        "That cascade is the MECHANISM,",
    ]):
        d.text((c2x + 28, cy + 80 + j * 50), ln, fill=INK, font=font("sans", 28))

    # clarifier strip
    d.rounded_rectangle([110, 840, W - 110, 960], radius=18,
                        fill=ACCENT_LT, outline=MAROON, width=5)
    centered(d, "Trophic cascade = the effect, not a synonym for keystone.",
             font("sans_bold", 30), 862, MAROON_DARK)
    centered(d, "A keystone can also be a mutualist or an ecosystem engineer.",
             font("sans", 28), 908, MAROON)
deck.custom("12_keystone", keystone)


# 13 — primary vs secondary succession
deck.compare("13_succession_compare",
             "Succession  —  the dividing line is SOIL.",
             {"label": "PRIMARY SUCCESSION", "color": ACCENT,
              "lines": [
                  "Starts on BARE ROCK — NO soil.",
                  "Volcanic island · glacial retreat.",
                  "",
                  "Pioneers: lichens and mosses.",
                  "Builds soil over CENTURIES — slow.",
              ],
              "footnote": "No soil to start with."},
             {"label": "SECONDARY SUCCESSION", "color": MAROON,
              "lines": [
                  "Disturbance removed plants, but",
                  "the SOIL REMAINS.",
                  "Forest fire · abandoned farm.",
                  "",
                  "FASTER:  herbs → shrubs → forest.",
              ],
              "footnote": "Soil is intact — much faster."})


# 14 — diversity = richness + evenness
definition_card("14_diversity",
                "Diversity  =  richness  +  evenness.",
                "Richness = how MANY.  Evenness = how EQUAL.",
                "Species richness counts species; evenness measures how equal their abundances are.  The Shannon index (H) combines BOTH.  Higher diversity is GENERALLY linked to a more stable, resistant, resilient ecosystem — a correlation, not a guarantee.")


# 15 — recap
deck.recap("15_recap", "Recap.", [
    "Signs: competition -/- ; predation, herbivory, parasitism +/- ; mutualism +/+ ; commensalism +/0.",
    "Once one species is +, read the SECOND's sign; if neither is +, it's competition.",
    "Gause exclusion (same resource, one loses) vs partitioning (different niches — MacArthur's warblers).",
    "Realized niche is a SUBSET of fundamental, shrunk by negative interactions.  Lotka-Volterra: lynx/hare cycles.",
    "Batesian = palatable mimics defended (parasitic).  Müllerian = many defended share a pattern (mutualistic).",
    "Keystone = disproportionate IMPACT, not abundance.  Primary = no soil; secondary keeps soil.  Diversity = richness + evenness (Shannon H).",
], assignment=[
    "AP tip:  to classify any interaction, first find the + (the beneficiary), then read the",
    "other species' sign.  No + at all?  It's competition.  Soil present?  Secondary succession.",
])


# 16 — path
deck.path("16_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Biology",   "Ecology — community ecology, biodiversity, disruptions to ecosystems"),
    ("2.", "Khan Academy AP Bio",     "Unit 8 problem sets — interactions, niches, succession, diversity"),
    ("3.", "Assignment in dashboard", "GIIS Unit 8 problem set — sign classification + succession practice"),
    ("4.", "Advisor check-in",        "If Batesian vs Müllerian or primary vs secondary still feels fuzzy"),
], next_text="Next up:  Module 14 — Ecosystems and Energy Flow.")


print("AP Biology Module 13 slides built.")
