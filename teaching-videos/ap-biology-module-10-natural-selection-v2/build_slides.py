"""AP Biology Module 10 V2 pilot.

This pilot tests a stricter production standard:
- one visual idea per slide
- shorter narration sections
- misconception-first teaching
- visuals drawn from structured diagrams instead of unsourced photos
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, W, H,
    INK, MAROON, MUTED, RED, CREAM,
    FONTS,
)


LOGO = "../../src/img/logo_nobg.png"

if not Path(FONTS["sans"]).exists():
    FONTS.update({
        "sans": "/System/Library/Fonts/Supplemental/Arial.ttf",
        "sans_bold": "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "serif": "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
        "serif_ital": "/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf",
        "serif_bold": "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
        "mono": "/System/Library/Fonts/Supplemental/Courier New Bold.ttf",
    })

deck = Deck(course="AP Biology", module_num=10, output_dir="slides", logo_path=LOGO)

ACCENT = deck.accent
ACCENT_LT = deck.accent_light
CARD = deck.card_bg
GREEN = (45, 125, 85)
PALE_RED = (245, 218, 210)


deck.title(
    "01_title",
    "AP Biology",
    "Module 10 — Natural Selection and Evolution",
    "V2 pilot  ·  misconception-first  ·  ~7 minutes",
)


def _draw_moth(d, x, y, color, outline=INK, scale=1):
    w, h = int(54 * scale), int(26 * scale)
    d.ellipse([x - w, y - h, x, y + h], fill=color, outline=outline, width=3)
    d.ellipse([x, y - h, x + w, y + h], fill=color, outline=outline, width=3)
    d.ellipse([x - 10 * scale, y - 8 * scale, x + 10 * scale, y + 8 * scale], fill=outline)


def hook(img, d):
    d.text((110, 72), "What changed: the population, not the moth.",
           fill=MAROON, font=font("serif_bold", 58))
    d.text((110, 150), "A cleaner hook: no individual moth decides to become darker.",
           fill=MUTED, font=font("sans", 30))

    panels = [
        ("Before soot", (232, 224, 202), (248, 244, 226), (45, 38, 34)),
        ("After soot", (58, 53, 48), (248, 244, 226), (45, 38, 34)),
    ]
    for i, (label, bark, light, dark) in enumerate(panels):
        x0 = 150 + i * 860
        d.rounded_rectangle([x0, 250, x0 + 760, 760], radius=22, fill=CARD,
                            outline=ACCENT, width=5)
        d.rectangle([x0, 250, x0 + 760, 315], fill=ACCENT if i == 0 else MAROON)
        centered(d, label, font("serif_bold", 34), 264, CREAM)
        trunk_x = x0 + 330
        d.rounded_rectangle([trunk_x, 360, trunk_x + 110, 690], radius=12,
                            fill=bark, outline=INK, width=3)
        for k in range(5):
            y = 390 + k * 55
            d.line([(trunk_x + 12, y), (trunk_x + 95, y + 9)], fill=(25, 25, 25), width=5)
        if i == 0:
            _draw_moth(d, trunk_x + 48, 440, light)
            _draw_moth(d, trunk_x + 70, 535, light)
            _draw_moth(d, trunk_x + 48, 625, dark)
            d.line([(trunk_x + 5, 590), (trunk_x + 105, 660)], fill=RED, width=7)
        else:
            _draw_moth(d, trunk_x + 48, 440, dark)
            _draw_moth(d, trunk_x + 70, 535, dark)
            _draw_moth(d, trunk_x + 48, 625, light)
            d.line([(trunk_x + 5, 590), (trunk_x + 105, 660)], fill=RED, width=7)
    d.rounded_rectangle([190, 830, W - 190, 960], radius=22, fill=ACCENT_LT,
                        outline=MAROON, width=5)
    centered(d, "Pre-existing variation + changed environment = changed survival.",
             font("serif_bold", 38), 855, MAROON)
    centered(d, "This pre-empts the Lamarckism trap before the lesson starts.",
             font("sans", 28), 915, INK)


deck.custom("02_hook", hook)

deck.overview(
    "03_overview",
    "Blueprint.",
    [
        "Four ingredients for natural selection.",
        "Hardy-Weinberg as the no-evolution baseline.",
        "Five mechanisms that move populations away from that baseline.",
    ],
    footnote="Practice target: start Hardy-Weinberg from the recessive phenotype.",
)


def four_ingredients(img, d):
    d.text((110, 70), "Natural selection needs four ingredients.",
           fill=MAROON, font=font("serif_bold", 56))
    items = [
        ("1", "Variation", "Individuals differ."),
        ("2", "Heritability", "Some differences are genetic."),
        ("3", "Overproduction", "More offspring are born than survive."),
        ("4", "Differential success", "Some variants leave more offspring."),
    ]
    for i, (num, title, sub) in enumerate(items):
        x = 150 + (i % 2) * 830
        y = 240 + (i // 2) * 260
        d.rounded_rectangle([x, y, x + 700, y + 180], radius=24, fill=CARD,
                            outline=ACCENT, width=5)
        d.ellipse([x + 34, y + 42, x + 124, y + 132], fill=ACCENT)
        centered(d, num, font("serif_bold", 46), y + 58, CREAM)
        d.text((x + 160, y + 45), title, fill=INK, font=font("sans_bold", 40))
        d.text((x + 160, y + 100), sub, fill=MUTED, font=font("sans", 28))
    d.rounded_rectangle([250, 835, W - 250, 940], radius=20, fill=ACCENT_LT,
                        outline=MAROON, width=4)
    centered(d, "If all four are true, population change is expected.",
             font("serif_bold", 36), 865, MAROON)


deck.custom("04_four_ingredients", four_ingredients)

deck.compare(
    "05_misconception_checkpoint",
    "Checkpoint: what passes to offspring?",
    left={
        "label": "CAN CHANGE FUTURE GENERATIONS",
        "color": ACCENT,
        "lines": [
            "Inherited color variant",
            "Inherited enzyme variant",
            "Inherited beak shape",
            "Inherited disease resistance",
        ],
        "footnote": "Heritable variation can shift allele frequencies.",
    },
    right={
        "label": "DOES NOT GET INHERITED",
        "color": RED,
        "lines": [
            "Bodybuilder's muscles",
            "A stretched neck",
            "A learned habit",
            "A scar from injury",
        ],
        "footnote": "Useful during life is not the same as inherited.",
    },
)

deck.compare(
    "06_fitness",
    "Fitness is reproductive success.",
    left={
        "label": "HIGHER FITNESS",
        "color": GREEN,
        "lines": [
            "12 offspring survive",
            "Those offspring reproduce",
            "Trait becomes more common",
        ],
        "footnote": "Relative to others in the same environment.",
    },
    right={
        "label": "NOT NECESSARILY FITNESS",
        "color": RED,
        "lines": [
            "Strongest",
            "Fastest",
            "Longest-lived",
            "Most impressive",
        ],
        "footnote": "AP loves this vocabulary trap.",
    },
)


def hardy_weinberg(img, d):
    d.text((110, 70), "Hardy-Weinberg = the no-evolution baseline.",
           fill=MAROON, font=font("serif_bold", 54))
    centered(d, "p + q = 1", font("serif_bold", 96), 230, INK)
    centered(d, "allele frequencies", font("sans", 30), 340, MUTED)
    centered(d, "p² + 2pq + q² = 1", font("serif_bold", 84), 455, MAROON)
    centered(d, "genotype frequencies", font("sans", 30), 558, MUTED)
    d.rounded_rectangle([350, 710, W - 350, 860], radius=24, fill=ACCENT_LT,
                        outline=ACCENT, width=5)
    centered(d, "The model is useful because real populations break it.",
             font("serif_bold", 38), 745, MAROON)
    centered(d, "Deviation from the baseline tells us evolution is happening.",
             font("sans", 30), 805, INK)


deck.custom("07_hardy_weinberg", hardy_weinberg)

deck.pause(
    "08_pause_hw",
    "PAUSE  &  TRY",
    "400 mice. 64 are white.",
    "aa = white. Find p.",
    hint="Start from the recessive phenotype: q².",
)


def answer_hw(img, d):
    d.text((110, 70), "Worked answer: start from q².",
           fill=MAROON, font=font("serif_bold", 58))
    steps = [
        ("1", "q² = 64 / 400", "white phenotype is aa"),
        ("2", "q² = 0.16", "convert count to frequency"),
        ("3", "q = 0.4", "take the square root"),
        ("4", "p = 1 - q = 0.6", "because p + q = 1"),
    ]
    for i, (num, eq, note) in enumerate(steps):
        y = 205 + i * 160
        d.rounded_rectangle([170, y, W - 170, y + 110], radius=18,
                            fill=CARD, outline=ACCENT, width=4)
        d.text((210, y + 22), num, fill=MAROON, font=font("serif_bold", 48))
        d.text((310, y + 22), eq, fill=INK, font=font("mono", 46))
        d.text((930, y + 34), note, fill=MUTED, font=font("sans", 28))
    d.rounded_rectangle([360, 880, W - 360, 960], radius=18, fill=PALE_RED,
                        outline=RED, width=4)
    centered(d, "AP trap: do not start from p just because A is dominant.",
             font("sans_bold", 32), 902, MAROON)


deck.custom("09_answer_hw", answer_hw)


def mechanisms(img, d):
    d.text((110, 70), "Five mechanisms break the baseline.",
           fill=MAROON, font=font("serif_bold", 56))
    items = [
        ("Mutation", "new alleles appear"),
        ("Gene flow", "alleles move between populations"),
        ("Genetic drift", "random sampling changes allele frequencies"),
        ("Natural selection", "fitness bias changes survival/reproduction"),
        ("Non-random mating", "genotype frequencies shift"),
    ]
    for i, (head, sub) in enumerate(items):
        y = 190 + i * 135
        d.rounded_rectangle([180, y, W - 180, y + 92], radius=16,
                            fill=CARD, outline=ACCENT, width=4)
        d.text((230, y + 24), f"{i + 1}.", fill=MAROON, font=font("serif_bold", 38))
        d.text((320, y + 22), head, fill=INK, font=font("sans_bold", 34))
        d.text((760, y + 28), sub, fill=MUTED, font=font("sans", 28))
    d.rounded_rectangle([360, 910, W - 360, 970], radius=16, fill=ACCENT_LT,
                        outline=ACCENT, width=3)
    centered(d, "Only selection is non-random with respect to fitness.",
             font("sans_bold", 30), 925, MAROON)


deck.custom("10_mechanisms", mechanisms)


def drift_vs_selection(img, d):
    d.text((110, 70), "Selection is biased. Drift is chance.",
           fill=MAROON, font=font("serif_bold", 56))
    panels = [
        ("NATURAL SELECTION", "Survival/reproduction depends on phenotype.", ACCENT),
        ("GENETIC DRIFT", "Random sampling, especially in small populations.", RED),
    ]
    for i, (title, sub, color) in enumerate(panels):
        x = 160 + i * 840
        d.rounded_rectangle([x, 220, x + 720, 790], radius=24, fill=CARD,
                            outline=color, width=6)
        d.rectangle([x, 220, x + 720, 285], fill=color)
        centered(d, title, font("serif_bold", 34), 235, CREAM)
        d.text((x + 55, 330), sub, fill=INK, font=font("sans_bold", 30))
        if i == 0:
            for k, y in enumerate([465, 545, 625]):
                fill = GREEN if k < 2 else RED
                d.ellipse([x + 130 + k * 145, y - 28, x + 190 + k * 145, y + 28], fill=fill)
            d.text((x + 85, 705), "Better-fit variants reproduce more.", fill=MUTED, font=font("sans", 28))
        else:
            for k, y in enumerate([465, 545, 625]):
                fill = GREEN if k == 1 else RED
                d.ellipse([x + 130 + k * 145, y - 28, x + 190 + k * 145, y + 28], fill=fill)
            d.text((x + 85, 705), "Survivors may just be lucky.", fill=MUTED, font=font("sans", 28))
    centered(d, "Non-adaptive does not mean unimportant.",
             font("serif_bold", 34), 900, MAROON)


deck.custom("11_drift_vs_selection", drift_vs_selection)

deck.overview(
    "12_evidence",
    "Evidence: many sources, one conclusion.",
    [
        "Fossils + biogeography show change across time and place.",
        "Homology, vestigial traits, development, and DNA show shared ancestry.",
        "Direct observation shows evolution happening now.",
    ],
    footnote="Strong scientific arguments converge from independent evidence.",
)

deck.recap(
    "13_recap",
    "Recap.",
    [
        "Individuals do not evolve; populations do.",
        "Selection acts on phenotypes; heritable variation changes future generations.",
        "Hardy-Weinberg is a baseline, not a description of perfect nature.",
        "Drift is random; selection is fitness-biased; evolution has no goal.",
    ],
    assignment=[
        "Portal task:",
        "3 Hardy-Weinberg problems",
        "1 antibiotic-resistance paragraph",
    ],
)

deck.path(
    "14_path",
    items=[
        ("1.", "Hardy-Weinberg practice", "Start from recessive phenotype."),
        ("2.", "Mechanism sort", "Mutation, flow, drift, selection, mating."),
        ("3.", "One paragraph", "Why antibiotic resistance is not Lamarckian."),
        ("4.", "Advisor check", "Ask for help if p/q still feels slippery."),
    ],
    next_text="Next up: Module 11 — Speciation and Phylogeny.",
)
