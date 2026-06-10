"""Biology — Module 1 (V2): The Chemistry of Life.

Foundation-pilot V2 build. Science theme (teal). Deterministic molecule
cards and flow diagrams drawn from PIL primitives — no generated images
for the precision biochemistry visuals.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, wrap, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, CREAM, PARCHMENT,
    TEAL, NAVY, BURNT, GOLD, SEPIA, LAVENDER,
)

deck = Deck(course="Biology", module_num=1,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# Per-macromolecule colors. Stay inside the established palette so the
# contact sheet keeps a coherent science-themed rhythm.
MACRO_COLORS = {
    "carbohydrate":  GOLD,        # quick energy — warm
    "lipid":         BURNT,       # long-energy / membranes
    "protein":       TEAL,        # workhorse — primary science accent
    "nucleic_acid":  NAVY,        # information / DNA-RNA
}

ATOM_COLORS = {
    "C": (60, 60, 60),       # carbon — dark grey
    "H": (220, 220, 230),    # hydrogen — pale
    "O": (200, 60, 60),      # oxygen — red
    "N": (60, 100, 180),     # nitrogen — blue
    "Na": LAVENDER,
    "Cl": TEAL,
}


# 01 — title
deck.title("01_title", "Biology",
           "Module 1 — The Chemistry of Life",
           "Foundation lesson  ·  ~6 minutes")


# 02 — hook: "you are atoms" — four-element body composition
def hook(img, d):
    d.text((110, 90), "You are mostly four elements.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 180), "Life is chemistry that learned how to keep itself going.",
           fill=MUTED, font=font("sans", 32))

    # Four big chips: C H O N — sized roughly by body composition.
    elements = [
        ("C",  "Carbon",   "18.5%"),
        ("H",  "Hydrogen", "9.5%"),
        ("O",  "Oxygen",   "65%"),
        ("N",  "Nitrogen", "3.2%"),
    ]

    pad = 30
    chip_w = (W - 2 * 140 - 3 * pad) // 4
    chip_h = 480
    y0 = 310
    f_sym = font("serif_bold", 200)
    f_name = font("sans_bold", 36)
    f_pct = font("mono", 44)

    for i, (sym, name, pct) in enumerate(elements):
        x0 = 140 + i * (chip_w + pad)
        color = ATOM_COLORS.get(sym, TEAL)
        d.rounded_rectangle([x0, y0, x0 + chip_w, y0 + chip_h],
                            radius=24, outline=color, width=6,
                            fill=deck.card_bg)
        # symbol
        sw = d.textlength(sym, font=f_sym)
        d.text((x0 + (chip_w - sw) / 2, y0 + 60), sym,
               fill=color, font=f_sym)
        # name
        nw = d.textlength(name, font=f_name)
        d.text((x0 + (chip_w - nw) / 2, y0 + 300), name,
               fill=INK, font=f_name)
        # percent
        pw = d.textlength(pct, font=f_pct)
        d.text((x0 + (chip_w - pw) / 2, y0 + 360), pct,
               fill=color, font=f_pct)

    d.text((110, 870),
           "Roughly 96% of your body — four atoms doing all the heavy lifting.",
           fill=deck.accent, font=font("sans_bold", 32))
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "Atoms & bonds:  covalent · ionic · hydrogen.",
    "Why water matters:  polarity makes life possible.",
    "Four macromolecules:  name · monomer · function.",
    "Build & break:  dehydration synthesis vs hydrolysis.",
], footnote="Goal:  connect every macromolecule to its monomer and its job.")


# 04 — atoms & bonds
def atoms_bonds(img, d):
    d.text((110, 90), "Atoms join through bonds.",
           fill=MAROON, font=font("serif_bold", 64))
    d.text((110, 180),
           "Three kinds you must recognize in this course.",
           fill=MUTED, font=font("sans", 30))

    rows = [
        ("COVALENT",  TEAL,
            "atoms share electrons",
            "holds molecules together",
            "C — C — H,  O = O,  H — O — H"),
        ("IONIC",     BURNT,
            "atoms give electrons away → charged ions attract",
            "forms salts like sodium chloride",
            "Na+   <->   Cl-"),
        ("HYDROGEN",  NAVY,
            "weak attraction between polar molecules",
            "shapes water, DNA, and protein folding",
            "H — O · · · H — O"),
    ]

    y = 290
    row_h = 220
    f_label = font("serif_bold", 44)
    f_def = font("sans", 28)
    f_ex = font("mono", 32)
    for label, color, definition, role, example in rows:
        d.rounded_rectangle([110, y, W - 110, y + row_h - 20],
                            radius=18, outline=color, width=5,
                            fill=deck.card_bg)
        d.rectangle([110, y, 130, y + row_h - 20], fill=color)
        d.text((160, y + 25), label, fill=color, font=f_label)
        d.text((160, y + 90), definition, fill=INK, font=f_def)
        d.text((160, y + 130), role, fill=MUTED, font=f_def)
        ex_w = d.textlength(example, font=f_ex)
        d.text((W - 130 - ex_w, y + 90), example, fill=INK, font=f_ex)
        y += row_h
deck.custom("04_atoms_bonds", atoms_bonds)


# 05 — why water matters
def water(img, d):
    d.text((110, 90), "Why water matters.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 180),
           "Water is polar — slightly negative O, slightly positive H atoms.",
           fill=MUTED, font=font("sans", 30))

    # Left: a stylized water molecule with charges.
    cx, cy = 480, 580
    o_r = 130
    h_r = 80
    # O atom
    d.ellipse([cx - o_r, cy - o_r, cx + o_r, cy + o_r],
              fill=ATOM_COLORS["O"], outline=MAROON_DARK, width=4)
    d.text((cx - 28, cy - 50), "O",
           fill=CREAM, font=font("serif_bold", 90))
    # H atoms — angled at ~104.5°
    import math
    angle = math.radians(52)  # half of bond angle from vertical
    h1 = (cx - int(o_r * 1.6 * math.sin(angle)),
          cy + int(o_r * 1.6 * math.cos(angle)))
    h2 = (cx + int(o_r * 1.6 * math.sin(angle)),
          cy + int(o_r * 1.6 * math.cos(angle)))
    # bonds
    d.line([cx, cy, h1[0], h1[1]], fill=INK, width=8)
    d.line([cx, cy, h2[0], h2[1]], fill=INK, width=8)
    for hx, hy in (h1, h2):
        d.ellipse([hx - h_r, hy - h_r, hx + h_r, hy + h_r],
                  fill=ATOM_COLORS["H"], outline=MAROON_DARK, width=4)
        d.text((hx - 22, hy - 38), "H",
               fill=INK, font=font("serif_bold", 70))
    # charge labels
    d.text((cx + o_r + 30, cy - 60), "partial -",
           fill=RED, font=font("sans_bold", 34))
    d.text((h1[0] - 74, h1[1] + h_r + 10), "partial +",
           fill=NAVY, font=font("sans_bold", 28))
    d.text((h2[0] - 30, h2[1] + h_r + 10), "partial +",
           fill=NAVY, font=font("sans_bold", 28))

    # Right: four properties of water
    props_x = 980
    d.text((props_x, 290), "Polarity gives water four powers:",
           fill=deck.accent, font=font("sans_bold", 32))
    items = [
        ("Solvent",       "dissolves nutrients and ions"),
        ("Cohesion",      "sticks to itself — water rises up plants"),
        ("Temperature",   "absorbs heat — stabilizes body and oceans"),
        ("Reactant",      "joins or splits the polymers you'll see next"),
    ]
    y = 380
    f_h = font("serif_bold", 38)
    f_b = font("sans", 28)
    for head, body in items:
        d.text((props_x, y), "·  " + head, fill=TEAL, font=f_h)
        d.text((props_x + 40, y + 55), body, fill=INK, font=f_b)
        y += 120

    d.text((110, 970),
           "Without water's polarity, your cells couldn't move materials at all.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("05_water", water)


# 06 — four macromolecules overview
def macromolecules(img, d):
    d.text((110, 90), "Four macromolecules run living systems.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 180), "Each has a name, a monomer, and a job.",
           fill=MUTED, font=font("sans", 32))

    cards = [
        ("CARBOHYDRATE", "carbohydrate",
            "monomer: monosaccharide",
            "(glucose, fructose)",
            "function:  quick energy",
            "+ plant structure"),
        ("LIPID", "lipid",
            "built from fatty acids",
            "+ glycerol",
            "function:  long-term energy,",
            "membranes, insulation"),
        ("PROTEIN", "protein",
            "monomer: amino acid",
            "(20 kinds)",
            "function:  enzymes, structure,",
            "transport, signaling"),
        ("NUCLEIC ACID", "nucleic_acid",
            "monomer: nucleotide",
            "(A, T, G, C, U)",
            "function:  stores and reads",
            "the instructions (DNA, RNA)"),
    ]

    pad = 22
    card_w = (W - 2 * 110 - 3 * pad) // 4
    card_h = 660
    y0 = 280
    f_label = font("serif_bold", 38)
    f_mono = font("sans_bold", 26)
    f_sub = font("sans", 24)
    f_fn = font("sans_bold", 26)

    for i, (label, key, mono1, mono2, fn1, fn2) in enumerate(cards):
        x0 = 110 + i * (card_w + pad)
        color = MACRO_COLORS[key]
        d.rounded_rectangle([x0, y0, x0 + card_w, y0 + card_h],
                            radius=22, outline=color, width=6,
                            fill=deck.card_bg)
        d.rectangle([x0, y0, x0 + card_w, y0 + 14], fill=color)
        lw = d.textlength(label, font=f_label)
        d.text((x0 + (card_w - lw) / 2, y0 + 40), label,
               fill=color, font=f_label)

        d.text((x0 + 20, y0 + 160), "MONOMER", fill=color, font=f_fn)
        d.text((x0 + 20, y0 + 210), mono1, fill=INK, font=f_mono)
        d.text((x0 + 20, y0 + 250), mono2, fill=MUTED, font=f_sub)

        d.text((x0 + 20, y0 + 360), "FUNCTION", fill=color, font=f_fn)
        d.text((x0 + 20, y0 + 410), fn1, fill=INK, font=f_mono)
        d.text((x0 + 20, y0 + 450), fn2, fill=INK, font=f_mono)
deck.custom("06_macromolecules", macromolecules)


# 07 — the trap: name vs monomer vs function
def trap(img, d):
    d.text((110, 90), "The trap — name without monomer or job.",
           fill=MAROON, font=font("serif_bold", 56))
    d.text((110, 180),
           "Exams never ask just the name.  Lock three columns together.",
           fill=MUTED, font=font("sans", 30))

    # Header
    cols_x = [150, 580, 1000, 1450]
    headers = ["NAME", "MONOMER", "FUNCTION", "MEMORY CUE"]
    y_h = 290
    f_h = font("serif_bold", 36)
    for x, head in zip(cols_x, headers):
        d.text((x, y_h), head, fill=deck.accent, font=f_h)
    d.line([130, y_h + 60, W - 130, y_h + 60], fill=deck.accent, width=4)

    rows = [
        ("Carbohydrate", "monosaccharide",       "quick energy",       "CARBS = fast fuel",         "carbohydrate"),
        ("Lipid",        "fatty acids + glycerol", "long storage / membranes", "FAT = bank account", "lipid"),
        ("Protein",      "amino acid",           "do the work",        "PROTEIN = workers",         "protein"),
        ("Nucleic acid", "nucleotide",           "store instructions", "DNA = the blueprint",       "nucleic_acid"),
    ]

    y = y_h + 90
    f_cell = font("sans", 28)
    f_cell_b = font("sans_bold", 28)
    for name, mono, fn, cue, key in rows:
        color = MACRO_COLORS[key]
        d.rectangle([130, y - 8, 142, y + 60], fill=color)
        d.text((cols_x[0], y), name, fill=color, font=f_cell_b)
        d.text((cols_x[1], y), mono, fill=INK, font=f_cell)
        d.text((cols_x[2], y), fn, fill=INK, font=f_cell)
        d.text((cols_x[3], y), cue, fill=MUTED, font=f_cell)
        y += 110

    d.text((110, 940),
           "Every macromolecule:  name → monomer → function.  Always three.",
           fill=deck.accent, font=font("sans_bold", 32))
deck.custom("07_trap", trap)


# 08 — pause #1: match macromolecule to monomer and function
def pause1(img, d):
    d.rectangle([0, 80, W, 220], fill=deck.accent)
    centered(d, "PAUSE  &  TRY", font("serif_bold", 96), 100, MAROON_DARK)

    d.text((110, 280),
           "Match each macromolecule to its monomer and main function.",
           fill=INK, font=font("sans", 38))

    # Left column: macromolecule names
    macros = ["Carbohydrate", "Lipid", "Protein", "Nucleic acid"]
    monomers = ["nucleotide", "amino acid", "monosaccharide",
                "fatty acids + glycerol"]
    functions = ["enzymes & structure", "long energy / membranes",
                 "quick energy", "stores instructions"]

    y0 = 420
    row_h = 100
    f_left = font("serif_bold", 40)
    f_mid = font("mono", 32)
    f_right = font("sans", 30)
    # Column headers
    d.text((150, y0 - 60), "Macromolecule", fill=deck.accent, font=font("sans_bold", 30))
    d.text((680, y0 - 60), "Monomer (shuffled)", fill=deck.accent, font=font("sans_bold", 30))
    d.text((1280, y0 - 60), "Function (shuffled)", fill=deck.accent, font=font("sans_bold", 30))

    for i, name in enumerate(macros):
        y = y0 + i * row_h
        d.text((150, y), name, fill=MAROON, font=f_left)
        d.text((680, y + 10), monomers[i], fill=INK, font=f_mid)
        d.text((1280, y + 10), functions[i], fill=INK, font=f_right)

    d.text((110, 880),
           "Write out four rows:  name  →  monomer  →  function.",
           fill=MUTED, font=font("sans", 32))
    d.text((110, 940),
           "Pause.  Solve.  Press play when you're ready.",
           fill=MUTED, font=font("sans", 32))
deck.custom("08_pause1", pause1)


# 09 — pause #1 answer reveal
def pause1_answer(img, d):
    d.text((110, 90), "Answer — three columns, every time.",
           fill=MAROON, font=font("serif_bold", 56))

    rows = [
        ("Carbohydrate", "carbohydrate", "monosaccharide",       "quick energy + plant structure"),
        ("Lipid",        "lipid",        "fatty acids + glycerol", "long energy + membranes"),
        ("Protein",      "protein",      "amino acid",           "enzymes, structure, transport"),
        ("Nucleic acid", "nucleic_acid", "nucleotide",           "stores & reads instructions"),
    ]

    cols_x = [150, 620, 1100]
    headers = ["NAME", "MONOMER", "FUNCTION"]
    y_h = 240
    f_h = font("serif_bold", 36)
    for x, head in zip(cols_x, headers):
        d.text((x, y_h), head, fill=deck.accent, font=f_h)
    d.line([130, y_h + 60, W - 130, y_h + 60], fill=deck.accent, width=4)

    y = y_h + 110
    f_name = font("serif_bold", 40)
    f_cell = font("sans", 32)
    for name, key, mono, fn in rows:
        color = MACRO_COLORS[key]
        d.rectangle([130, y - 6, 142, y + 70], fill=color)
        d.text((cols_x[0], y), name, fill=color, font=f_name)
        d.text((cols_x[1], y), mono, fill=INK, font=f_cell)
        d.text((cols_x[2], y), fn, fill=INK, font=f_cell)
        y += 120

    d.rounded_rectangle([110, 850, W - 110, 990], radius=18,
                        outline=deck.accent, width=5, fill=deck.card_bg)
    d.text((150, 880),
           "Memory rule:  if you say a macromolecule, also say its monomer and",
           fill=INK, font=font("sans", 30))
    d.text((150, 925),
           "its job.  No naked names.",
           fill=INK, font=font("sans", 30))
deck.custom("09_pause1_silence", pause1_answer)


# 10 — dehydration synthesis vs hydrolysis
def build_break(img, d):
    d.text((110, 90), "Build a polymer — or break one.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 180),
           "Same chemistry, opposite direction.  Watch the water.",
           fill=MUTED, font=font("sans", 30))

    # Left card: DEHYDRATION SYNTHESIS
    cards = [
        ("DEHYDRATION  SYNTHESIS", TEAL,  "BUILD",
            "Two monomers join.",
            "One water molecule is released.",
            "Monomer  +  Monomer  →  Polymer  +  H₂O"),
        ("HYDROLYSIS",             BURNT, "BREAK",
            "A water molecule is added.",
            "One polymer splits into two pieces.",
            "Polymer  +  H₂O  →  Monomer  +  Monomer"),
    ]

    pad = 60
    card_w = (W - 2 * 110 - pad) // 2
    card_h = 700
    y0 = 270
    f_title = font("serif_bold", 38)
    f_tag = font("serif_bold", 80)
    f_body = font("sans", 30)
    f_eq = font("mono", 28)

    for i, (label, color, tag, line1, line2, eq) in enumerate(cards):
        x0 = 110 + i * (card_w + pad)
        d.rounded_rectangle([x0, y0, x0 + card_w, y0 + card_h],
                            radius=24, outline=color, width=6,
                            fill=deck.card_bg)
        d.rectangle([x0, y0, x0 + card_w, y0 + 16], fill=color)
        d.text((x0 + 30, y0 + 60), label, fill=color, font=f_title)
        # huge tag word
        tw = d.textlength(tag, font=f_tag)
        d.text((x0 + (card_w - tw) / 2, y0 + 160), tag,
               fill=color, font=f_tag)
        d.text((x0 + 30, y0 + 320), line1, fill=INK, font=f_body)
        d.text((x0 + 30, y0 + 370), line2, fill=INK, font=f_body)
        # arrow band
        d.rounded_rectangle([x0 + 30, y0 + 480, x0 + card_w - 30, y0 + 560],
                            radius=12, outline=color, width=4)
        eq_w = d.textlength(eq, font=f_eq)
        d.text((x0 + (card_w - eq_w) / 2, y0 + 500), eq,
               fill=INK, font=f_eq)
        # memory cue
        cue = "loses water" if tag == "BUILD" else "uses water"
        cue_w = d.textlength(cue, font=font("sans_bold", 32))
        d.text((x0 + (card_w - cue_w) / 2, y0 + 610), cue,
               fill=color, font=font("sans_bold", 32))

    d.text((110, 1000),
           "Build → loses water.   Break → uses water.   Always check the H₂O.",
           fill=deck.accent, font=font("sans_bold", 30))
deck.custom("10_build_break", build_break)


# 11 — pause #2: build or break?
def pause2(img, d):
    d.rectangle([0, 80, W, 220], fill=deck.accent)
    centered(d, "PAUSE  &  TRY  #2", font("serif_bold", 92), 100, MAROON_DARK)

    d.text((110, 290),
           "Build or break?  Watch the water in each scene.",
           fill=INK, font=font("sans", 38))

    scenes = [
        ("A", "Two amino acids link into a short protein.",
            "One water molecule is released."),
        ("B", "An enzyme uses a water molecule to cut",
            "a starch into smaller sugars."),
    ]
    y = 410
    f_tag = font("serif_bold", 56)
    f_body = font("sans", 38)
    for tag, l1, l2 in scenes:
        d.rounded_rectangle([110, y, W - 110, y + 180],
                            radius=20, outline=MAROON, width=4,
                            fill=deck.card_bg)
        d.text((150, y + 50), tag, fill=deck.accent, font=f_tag)
        d.text((260, y + 40), l1, fill=INK, font=f_body)
        d.text((260, y + 95), l2, fill=MUTED, font=f_body)
        y += 220

    d.text((110, 920),
           "Pause.  Decide build or break for each.  Press play when ready.",
           fill=MUTED, font=font("sans", 32))
deck.custom("11_pause2", pause2)


# 12 — pause #2 answer
def pause2_answer(img, d):
    d.text((110, 90), "Answer — read the water.",
           fill=MAROON, font=font("serif_bold", 72))

    rows = [
        ("A",  TEAL,  "Amino acids join → water released.",
            "Dehydration synthesis  ·  building a polymer."),
        ("B",  BURNT, "Enzyme uses water to cut starch.",
            "Hydrolysis  ·  breaking a polymer."),
    ]
    y = 280
    f_tag = font("serif_bold", 64)
    f_top = font("sans_bold", 38)
    f_bot = font("sans", 32)
    for tag, color, top, bottom in rows:
        d.rounded_rectangle([110, y, W - 110, y + 200],
                            radius=22, outline=color, width=6,
                            fill=deck.card_bg)
        d.rectangle([110, y, 130, y + 200], fill=color)
        d.text((160, y + 60), tag, fill=color, font=f_tag)
        d.text((310, y + 50), top, fill=INK, font=f_top)
        d.text((310, y + 115), bottom, fill=color, font=f_bot)
        y += 240

    d.rounded_rectangle([110, 800, W - 110, 970], radius=20,
                        outline=deck.accent, width=5, fill=deck.card_bg)
    d.text((150, 830), "Quick check.", fill=deck.accent,
           font=font("serif_bold", 40))
    d.text((150, 895),
           "Water released → BUILD.   Water used → BREAK.",
           fill=INK, font=font("sans", 32))
deck.custom("12_pause2_silence", pause2_answer)


# 13 — recap
deck.recap("13_recap", "Recap.", [
    "Life is chemistry, organized — not separate from it.",
    "Bonds:  covalent · ionic · hydrogen — each does a different job.",
    "Water's polarity powers solvents, cohesion, temperature, reactions.",
    "Four macromolecules:  name → monomer → function.  Never just the name.",
    "Build → dehydration synthesis (loses water).  Break → hydrolysis (uses water).",
], assignment=[
    "Concept map:  link each macromolecule to its monomer and main function.",
    "Then label two everyday foods by which macromolecule dominates.",
])


# 14 — path
deck.path("14_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read OpenStax Biology",   "Chapter 2 — The Chemistry of Life"),
    ("2.", "Khan Academy practice",   "Biological macromolecules"),
    ("3.", "Assignment in dashboard", "Macromolecule concept map"),
    ("4.", "Advisor check-in",        "Book one if either pause felt shaky"),
], next_text="Next up:  Module 2 — Cell Structure & Function.")


print("Module 1 V2 (Chemistry of Life) slides built via slide_kit.")
