"""English I — Module 2 (V2): Parts of Speech & Grammar Foundations.

Foundation-pilot V2 build. Literature theme (sepia). Color-coded sentence
strips and role cards drawn deterministically — no generated images.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "lesson-video"))

from slide_kit import (
    Deck, font, centered, wrap, W, H,
    INK, MAROON, MAROON_DARK, MUTED, RED, CREAM,
    SEPIA, NAVY, TEAL, BURNT, LAVENDER, GOLD,
)

deck = Deck(course="English I", module_num=2,
            output_dir="slides", logo_path="../../src/img/logo_nobg.png")


# Color tokens for the eight roles. We stay inside the established palette
# so contact-sheet rhythm matches the school's other lessons.
ROLE_COLORS = {
    "noun":         MAROON,        # core
    "pronoun":      MAROON_DARK,
    "verb":         (170, 70, 50),    # warm core action
    "adjective":    SEPIA,         # literature accent — modifies nouns
    "adverb":       BURNT,         # warm modifier of verbs
    "preposition":  NAVY,          # relationship connector
    "conjunction":  TEAL,          # link connector
    "interjection": LAVENDER,      # signal
    "article":      (140, 105, 70),   # muted sepia for articles
}


# 01 — title
deck.title("01_title", "English I",
           "Module 2 — Parts of Speech & Grammar Foundations",
           "Foundation lesson  ·  ~5 minutes")


# 02 — hook: a sentence strip with role tags under each word
def hook(img, d):
    d.text((110, 90), "A sentence is a team.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 185), "Each word has a job.",
           fill=MUTED, font=font("sans", 38))

    sentence = [
        ("The",      "article",   "article"),
        ("tired",    "adjective", "adjective"),
        ("student",  "noun",      "noun"),
        ("quickly",  "adverb",    "adverb"),
        ("finished", "verb",      "verb"),
        ("her",      "pronoun",   "pronoun"),
        ("essay",    "noun",      "noun"),
        (".",        "",          ""),
    ]

    f_word = font("serif_bold", 64)
    f_tag = font("sans_bold", 22)
    # Lay the sentence across the canvas with a base line.
    margin = 110
    avail = W - 2 * margin
    # Measure total width first so we can center.
    word_widths = [d.textlength(w, font=f_word) for (w, _, _) in sentence]
    gap = 28
    total_w = sum(word_widths) + gap * (len(sentence) - 1)
    if total_w > avail:
        gap = max(12, int((avail - sum(word_widths)) / max(1, len(sentence) - 1)))
        total_w = sum(word_widths) + gap * (len(sentence) - 1)
    x = (W - total_w) / 2
    base_y = 430

    for (w, role_key, tag_label), ww in zip(sentence, word_widths):
        color = ROLE_COLORS.get(role_key, INK) if role_key else INK
        d.text((x, base_y), w, fill=color, font=f_word)
        # underline strip
        if role_key:
            d.rectangle([x, base_y + 90, x + ww, base_y + 100], fill=color)
            # tag chip below
            tag_text = tag_label
            tw = d.textlength(tag_text, font=f_tag)
            chip_w = max(int(ww), int(tw) + 24)
            chip_x = x + (ww - chip_w) / 2
            d.rounded_rectangle(
                [chip_x, base_y + 120, chip_x + chip_w, base_y + 170],
                radius=10, fill=color,
            )
            d.text(
                (chip_x + (chip_w - tw) / 2, base_y + 132),
                tag_text, fill=CREAM, font=f_tag,
            )
        x += ww + gap

    d.text((110, 760),
           "Eight roles cover every word in English.",
           fill=deck.accent, font=font("sans_bold", 36))
    d.text((110, 820),
           "Learn the roles, and you can fix any sentence that breaks.",
           fill=MUTED, font=font("sans", 32))
deck.custom("02_hook", hook)


# 03 — overview
deck.overview("03_overview", "Game plan.", [
    "Core:  nouns · pronouns · verbs.",
    "Modifiers:  adjectives · adverbs.",
    "Connectors & signals:  prepositions · conjunctions · interjections.",
    "Trap:  same word, different job.",
], footnote="Goal:  label every word, then use the labels to revise.")


# 04 — core words (noun / pronoun / verb cards)
def core_words(img, d):
    d.text((110, 90), "The sentence core.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 185), "Without these three, you do not have a sentence.",
           fill=MUTED, font=font("sans", 34))

    cards = [
        ("NOUN",    "noun",
            "names a person, place,",
            "thing, or idea",
            ["student", "school", "courage"]),
        ("PRONOUN", "pronoun",
            "stands in for a noun",
            "so you don't repeat it",
            ["she", "it", "they"]),
        ("VERB",    "verb",
            "shows action or",
            "a state of being",
            ["wrote", "runs", "is"]),
    ]
    pad = 30
    card_w = (W - 2 * 110 - 2 * pad) // 3
    card_h = 580
    y0 = 280
    f_label = font("serif_bold", 52)
    f_line = font("sans", 32)
    f_ex_label = font("sans_bold", 26)
    f_ex = font("mono", 36)

    for i, (label, role_key, l1, l2, examples) in enumerate(cards):
        x0 = 110 + i * (card_w + pad)
        color = ROLE_COLORS.get(role_key, MAROON)
        d.rounded_rectangle(
            [x0, y0, x0 + card_w, y0 + card_h],
            radius=22, outline=color, width=6, fill=deck.card_bg,
        )
        # Top color band
        d.rectangle([x0, y0, x0 + card_w, y0 + 14], fill=color)
        # Label
        lw = d.textlength(label, font=f_label)
        d.text((x0 + (card_w - lw) / 2, y0 + 40), label, fill=color, font=f_label)
        # Definition (two lines)
        d.text((x0 + 30, y0 + 150), l1, fill=INK, font=f_line)
        d.text((x0 + 30, y0 + 190), l2, fill=INK, font=f_line)
        # Examples label
        d.text((x0 + 30, y0 + 290), "examples", fill=color, font=f_ex_label)
        y = y0 + 340
        for ex in examples:
            d.text((x0 + 30, y), "· " + ex, fill=INK, font=f_ex)
            y += 56
deck.custom("04_core_words", core_words)


# 05 — modifiers (adjective vs adverb)
def modifiers(img, d):
    d.text((110, 90), "Modifiers paint detail onto the core.",
           fill=MAROON, font=font("serif_bold", 60))

    cards = [
        ("ADJECTIVE", "adjective",
            "describes a noun",
            "answers:  which · what kind · how many",
            [
                ("a", "tired", "student"),
                ("a", "clever", "idea"),
                ("the", "loud", "bell"),
            ]),
        ("ADVERB", "adverb",
            "describes a verb, an adjective, or another adverb",
            "often ends in  -ly",
            [
                ("wrote", "quickly", ""),
                ("very", "tired", ""),
                ("almost", "finished", ""),
            ]),
    ]

    pad = 40
    card_w = (W - 2 * 110 - pad) // 2
    card_h = 700
    y0 = 230
    f_label = font("serif_bold", 56)
    f_def = font("sans", 32)
    f_ex_label = font("sans_bold", 26)
    f_word = font("serif_bold", 44)

    for i, (label, role_key, definition, answers, examples) in enumerate(cards):
        x0 = 110 + i * (card_w + pad)
        color = ROLE_COLORS.get(role_key, MAROON)
        d.rounded_rectangle(
            [x0, y0, x0 + card_w, y0 + card_h],
            radius=22, outline=color, width=6, fill=deck.card_bg,
        )
        d.rectangle([x0, y0, x0 + card_w, y0 + 14], fill=color)
        lw = d.textlength(label, font=f_label)
        d.text((x0 + (card_w - lw) / 2, y0 + 40), label, fill=color, font=f_label)
        d.text((x0 + 30, y0 + 140), definition, fill=INK, font=f_def)
        d.text((x0 + 30, y0 + 190), answers, fill=MUTED, font=font("sans", 28))

        d.text((x0 + 30, y0 + 270), "examples", fill=color, font=f_ex_label)
        y = y0 + 320
        # Each example highlights the focal word in the role's color.
        for parts in examples:
            cursor = x0 + 30
            words = [p for p in parts if p]
            # We color the middle word in the role's color when it's the
            # adjective/adverb in question; first/third are plain INK.
            for idx, w in enumerate(words):
                fill = color if (idx == 1 if len(words) == 3 else idx == 1) else INK
                # When there are only two words (adverb examples), color the
                # second word with the role color when it's the headline word.
                if len(words) == 2:
                    fill = color if idx == 1 else INK
                d.text((cursor, y), w, fill=fill, font=f_word)
                cursor += d.textlength(w, font=f_word) + 18
            y += 70

    d.text((110, 970),
           "Test:  what does the word modify — a noun, or a verb?",
           fill=deck.accent, font=font("sans_bold", 32))
deck.custom("05_modifiers", modifiers)


# 06 — connectors & signals
def connectors(img, d):
    d.text((110, 90), "Connectors and signals — the glue.",
           fill=MAROON, font=font("serif_bold", 60))

    rows = [
        ("PREPOSITION",  "preposition",
            "shows relationship — place, time, direction",
            ["on the desk", "before class", "after lunch"]),
        ("CONJUNCTION",  "conjunction",
            "links words, phrases, or clauses",
            ["and", "but", "because", "although"]),
        ("INTERJECTION", "interjection",
            "injects feeling — sits outside the sentence",
            ["wow", "ouch", "hey"]),
    ]

    y = 230
    row_h = 200
    f_label = font("serif_bold", 44)
    f_def = font("sans", 30)
    f_ex = font("mono", 36)
    for label, role_key, definition, examples in rows:
        color = ROLE_COLORS.get(role_key, MAROON)
        d.rounded_rectangle(
            [110, y, W - 110, y + row_h - 30],
            radius=18, outline=color, width=5, fill=deck.card_bg,
        )
        # Label box on the left
        d.rectangle([110, y, 110 + 18, y + row_h - 30], fill=color)
        d.text((150, y + 30), label, fill=color, font=f_label)
        d.text((150, y + 95), definition, fill=INK, font=f_def)
        # examples on the right
        ex_text = "   ·   ".join(examples)
        d.text((780, y + 60), ex_text, fill=INK, font=f_ex)
        d.text((780, y + 115), "examples", fill=color, font=font("sans_bold", 24))
        y += row_h


deck.custom("06_connectors", connectors)


# 07 — the trap: same word, different job
def trap(img, d):
    d.text((110, 90), "The trap — same word, different job.",
           fill=MAROON, font=font("serif_bold", 60))
    d.text((110, 175),
           "Part of speech depends on the job in this sentence — not the spelling.",
           fill=MUTED, font=font("sans", 30))

    rows = [
        ("run",   [
            ("I run home.",          "verb"),
            ("We won the run.",      "noun"),
        ]),
        ("light", [
            ("a light backpack",     "adjective"),
            ("the light is on",      "noun"),
            ("light the candle",     "verb"),
        ]),
        ("fast",  [
            ("a fast car",           "adjective"),
            ("she runs fast",        "adverb"),
        ]),
    ]

    y = 260
    f_word = font("serif_bold", 44)
    f_ex = font("mono", 32)
    f_tag = font("sans_bold", 24)

    for word, uses in rows:
        # Word column on left
        d.rounded_rectangle([110, y, 320, y + 150], radius=14,
                            outline=MAROON, width=4, fill=deck.card_bg)
        wt = d.textlength(word, font=f_word)
        d.text((110 + (210 - wt) / 2, y + 50), word,
               fill=MAROON, font=f_word)
        # Uses on the right, each tagged by part of speech
        ux = 360
        uy = y + 30
        for example, role_key in uses:
            color = ROLE_COLORS.get(role_key, INK)
            d.text((ux, uy), example, fill=INK, font=f_ex)
            ex_w = d.textlength(example, font=f_ex)
            # role tag
            tag_text = "→ " + role_key
            d.text((ux + ex_w + 30, uy + 4), tag_text,
                   fill=color, font=f_tag)
            uy += 50
        y += 180

    d.text((110, 990),
           "Always ask:  what is this word doing in this sentence?",
           fill=deck.accent, font=font("sans_bold", 32))
deck.custom("07_trap", trap)


# 08 — pause #1: label the words in a sentence
def pause1(img, d):
    # Subject-accent banner like deck.pause uses.
    d.rectangle([0, 80, W, 220], fill=deck.accent)
    centered(d, "PAUSE  &  TRY", font("serif_bold", 96), 100, MAROON_DARK)

    d.text((110, 290), "Label every word in this sentence.",
           fill=INK, font=font("sans", 44))

    sentence = "The clever fox quickly jumped over the lazy dog."
    f_s = font("serif_bold", 64)
    centered(d, sentence, f_s, 460, MAROON)
    d.text((110, 600),
           "Nine words.  Nine labels.",
           fill=INK, font=font("sans", 38))
    d.text((110, 680),
           "Hint:  start with the noun and verb, then ask what each other",
           fill=MUTED, font=font("sans", 32))
    d.text((110, 720),
           "word does to it.",
           fill=MUTED, font=font("sans", 32))
    d.text((110, 820),
           "Pause.  Solve.  Press play when you're ready.",
           fill=MUTED, font=font("sans", 36))
deck.custom("08_pause1", pause1)


# 09 — pause #1 answer reveal (the labeled sentence)
def pause1_answer(img, d):
    d.text((110, 90), "Answer — every word labeled.",
           fill=MAROON, font=font("serif_bold", 64))

    sentence = [
        ("The",     "article"),
        ("clever",  "adjective"),
        ("fox",     "noun"),
        ("quickly", "adverb"),
        ("jumped",  "verb"),
        ("over",    "preposition"),
        ("the",     "article"),
        ("lazy",    "adjective"),
        ("dog",     "noun"),
        (".",       ""),
    ]
    f_word = font("serif_bold", 56)
    f_tag = font("sans_bold", 22)
    margin = 110
    avail = W - 2 * margin
    word_widths = [d.textlength(w, font=f_word) for (w, _) in sentence]
    gap = 22
    if sum(word_widths) + gap * (len(sentence) - 1) > avail:
        gap = max(8, int((avail - sum(word_widths)) / max(1, len(sentence) - 1)))
    total_w = sum(word_widths) + gap * (len(sentence) - 1)
    x = (W - total_w) / 2
    base_y = 280

    for (w, role_key), ww in zip(sentence, word_widths):
        color = ROLE_COLORS.get(role_key, INK) if role_key else INK
        d.text((x, base_y), w, fill=color, font=f_word)
        if role_key:
            d.rectangle([x, base_y + 80, x + ww, base_y + 88], fill=color)
            tag = role_key
            tw = d.textlength(tag, font=f_tag)
            chip_w = max(int(ww), int(tw) + 20)
            chip_x = x + (ww - chip_w) / 2
            d.rounded_rectangle(
                [chip_x, base_y + 100, chip_x + chip_w, base_y + 148],
                radius=8, fill=color,
            )
            d.text(
                (chip_x + (chip_w - tw) / 2, base_y + 112),
                tag, fill=CREAM, font=f_tag,
            )
        x += ww + gap

    # Teaching takeaway box
    d.rounded_rectangle([110, 600, W - 110, 880], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((150, 630), "Why it works.", fill=MAROON, font=font("serif_bold", 44))
    d.text((150, 705),
           "·  clever describes fox  →  adjective.",
           fill=INK, font=font("sans", 32))
    d.text((150, 760),
           "·  quickly describes jumped  →  adverb.",
           fill=INK, font=font("sans", 32))
    d.text((150, 815),
           "·  over shows relationship between jumped and dog  →  preposition.",
           fill=INK, font=font("sans", 32))
deck.custom("09_pause1_silence", pause1_answer)


# 10 — revise a weak sentence using parts of speech
def revise(img, d):
    d.text((110, 90), "Labels as a revision tool.",
           fill=MAROON, font=font("serif_bold", 72))
    d.text((110, 185),
           "Find weak nouns and tired adjectives.  Swap them for specific ones.",
           fill=MUTED, font=font("sans", 32))

    # Two columns: weak / revised
    col_w = (W - 2 * 110 - 60) // 2
    y0 = 280
    h = 540

    # WEAK
    x0 = 110
    d.rounded_rectangle([x0, y0, x0 + col_w, y0 + h], radius=20,
                        outline=RED, width=5, fill=deck.card_bg)
    d.text((x0 + 30, y0 + 30), "✗  WEAK",
           fill=RED, font=font("serif_bold", 48))
    d.text((x0 + 30, y0 + 130),
           "The thing was good.",
           fill=INK, font=font("serif_bold", 44))
    d.text((x0 + 30, y0 + 220),
           "·  'thing'  →  empty noun",
           fill=ROLE_COLORS["noun"], font=font("sans", 30))
    d.text((x0 + 30, y0 + 270),
           "·  'good'  →  tired adjective",
           fill=ROLE_COLORS["adjective"], font=font("sans", 30))
    d.text((x0 + 30, y0 + 380),
           "Reader can't picture anything.",
           fill=MUTED, font=font("sans", 28))

    # REVISED
    x0 = 110 + col_w + 60
    d.rounded_rectangle([x0, y0, x0 + col_w, y0 + h], radius=20,
                        outline=MAROON, width=5, fill=deck.card_bg)
    d.text((x0 + 30, y0 + 30), "✓  REVISED",
           fill=MAROON, font=font("serif_bold", 48))
    d.text((x0 + 30, y0 + 130),
           "The argument was persuasive.",
           fill=INK, font=font("serif_bold", 44))
    d.text((x0 + 30, y0 + 220),
           "·  'argument'  →  specific noun",
           fill=ROLE_COLORS["noun"], font=font("sans", 30))
    d.text((x0 + 30, y0 + 270),
           "·  'persuasive'  →  precise adjective",
           fill=ROLE_COLORS["adjective"], font=font("sans", 30))
    d.text((x0 + 30, y0 + 380),
           "Reader sees exactly what you mean.",
           fill=MUTED, font=font("sans", 28))

    d.text((110, 880),
           "Same shape.  Real meaning.  That is what labels are for.",
           fill=deck.accent, font=font("sans_bold", 34))
deck.custom("10_revise", revise)


# 11 — pause #2: adjective vs adverb choice
def pause2(img, d):
    d.rectangle([0, 80, W, 220], fill=deck.accent)
    centered(d, "PAUSE  &  TRY  #2", font("serif_bold", 92), 100, MAROON_DARK)

    d.text((110, 290),
           "Choose the correct word.",
           fill=INK, font=font("sans", 44))

    # Show the sentence with the choice
    f_s = font("serif_bold", 56)
    sentence_pre = "She speaks"
    sentence_post = "during the debate."
    choice = "( clear  /  clearly )"

    # Top line: She speaks ( clear / clearly )
    pre_w = d.textlength(sentence_pre, font=f_s)
    choice_w = d.textlength(choice, font=f_s)
    total_top = pre_w + 30 + choice_w
    x_top = (W - total_top) / 2
    d.text((x_top, 420), sentence_pre, fill=MAROON, font=f_s)
    d.text((x_top + pre_w + 30, 420), choice, fill=ROLE_COLORS["adverb"], font=f_s)

    # Second line: during the debate.
    post_w = d.textlength(sentence_post, font=f_s)
    d.text(((W - post_w) / 2, 510), sentence_post, fill=MAROON, font=f_s)

    d.text((110, 660),
           "One is an adjective.  One is an adverb.",
           fill=INK, font=font("sans", 36))
    d.text((110, 720),
           "Ask:  what does the word need to modify?",
           fill=MUTED, font=font("sans", 32))
    d.text((110, 820),
           "Pause.  Pick one.  Explain why.  Press play when ready.",
           fill=MUTED, font=font("sans", 36))
deck.custom("11_pause2", pause2)


# 12 — pause #2 answer
def pause2_answer(img, d):
    d.text((110, 90), "Answer:  clearly.",
           fill=MAROON, font=font("serif_bold", 80))

    d.text((110, 230),
           "The word we're modifying is the verb  speaks.",
           fill=INK, font=font("sans", 38))
    d.text((110, 290),
           "A verb is modified by an adverb — not an adjective.",
           fill=MUTED, font=font("sans", 32))

    # Two-row comparison
    rows = [
        ("clear",   "adjective", "a clear voice",   "describes a noun (voice)"),
        ("clearly", "adverb",    "speaks clearly",  "describes a verb (speaks)"),
    ]
    y = 430
    f_word = font("serif_bold", 56)
    f_ex = font("mono", 38)
    f_note = font("sans", 28)
    for word, role_key, example, note in rows:
        color = ROLE_COLORS.get(role_key, MAROON)
        d.rounded_rectangle([110, y, W - 110, y + 130], radius=18,
                            outline=color, width=5, fill=deck.card_bg)
        d.text((150, y + 34), word, fill=color, font=f_word)
        d.text((540, y + 40), role_key, fill=color, font=font("sans_bold", 32))
        d.text((850, y + 34), example, fill=INK, font=f_ex)
        d.text((850, y + 90), note, fill=MUTED, font=f_note)
        y += 160

    d.text((110, 870),
           "Quick check:  is the modified word a noun, or a verb?",
           fill=deck.accent, font=font("sans_bold", 34))
deck.custom("12_pause2_silence", pause2_answer)


# 13 — recap
deck.recap("13_recap", "Recap.", [
    "Core  —  nouns · pronouns · verbs.  Every sentence needs them.",
    "Modifiers  —  adjectives describe nouns;  adverbs describe verbs.",
    "Connectors  —  prepositions · conjunctions · interjections.",
    "Same word can change role.  Judge by job, not spelling.",
], assignment=[
    "Write 10 sentences (one per part of speech).  Label every word.",
    "Annotate one paragraph from a book or article you are reading.",
])


# 14 — path
deck.path("14_path", [
    ("✓",  "Watch this lesson",       "(done!)"),
    ("1.", "Read Purdue OWL",         "Parts of Speech overview"),
    ("2.", "Khan Academy practice",   "Parts of speech — start with recognizing nouns"),
    ("3.", "Assignment in dashboard", "10 sentences + paragraph annotation"),
    ("4.", "Advisor check-in",        "Book one if either pause problem felt shaky"),
], next_text="Next up:  Module 3 — Sentence Structure & Syntax.")


print("Module 2 V2 (Parts of Speech) slides built via slide_kit.")
