"""GIIS lesson slide primitives.

Shared toolkit so every lesson's `build_slides.py` becomes data, not code.
A new module typically needs ~50 lines of `deck.X(...)` calls instead of
~250 lines of PIL boilerplate.

USAGE
-----
    from slide_kit import Deck, INK, MAROON, GOLD, MUTED

    deck = Deck(course="Algebra I", module_num=1, output_dir="slides",
                logo_path="../../src/img/logo_nobg.png")

    deck.title("01_title", "Algebra I",
               "Module 1 — Variables & Algebraic Expressions",
               "Sample lesson  ·  ~5 minutes")

    deck.overview("03_overview", "Game plan.", [
        "What a variable is.",
        "What an algebraic expression is — and the vocab.",
        "How to evaluate when you DO know the value.",
    ], footnote="Don't sleep on this — every other module assumes it.")

    deck.equation("07_evaluate1", "Evaluate  3x + 5  when  x = 2", [
        ("3(2) + 5", INK,    "substitute x with 2"),
        ("6 + 5",    MUTED,  "multiply first"),
        ("11",       MAROON, "answer"),
    ])

    deck.pause("09_pause1", "PAUSE  &  TRY", "Evaluate this when  a = 5:",
               "2a + 6", hint="Pause. Solve. Press play when ready.")

    deck.recap("12_recap", "Recap.", [
        "Variable = a letter standing for an unknown / changing number.",
        "Expression = variables + numbers + operations, no equals sign.",
        "Coefficient (multiplies the variable), term, constant (no variable).",
        "Evaluate = plug in for the variable, then simplify.",
    ])

    deck.path("13_path",
        items=[
            ("✓",  "Watch this lesson",    "(done!)"),
            ("1.", "Read OpenStax Ch 1.1", "Use the Language of Algebra"),
            ("2.", "GIIS Learn Portal practice", "teacher-reviewed module problems"),
            ("3.", "Assignment in dashboard", "10 real-life situations as expressions"),
            ("4.", "Advisor check-in", "Book a session if anything feels fuzzy"),
        ],
        next_text="Next up:  Module 2 — Order of Operations (PEMDAS).")

The `Deck` instance carries `course` and `module_num`, used to render the
shared bottom footer "GIIS · {course} · Module {N}" automatically. Output
file names are taken from the first arg of each method ("01_title", etc.).

For one-off custom slides (graphs, diagrams, anything not in the kit), use
`deck.custom("11_real_world", lambda img, d: ...)` and draw freely with PIL.
"""
from __future__ import annotations
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

# ─── design tokens ────────────────────────────────────────────────────

W, H = 1920, 1080

# GIIS brand palette — keep these in sync with the school crest.
# These are the "school identity" colors used everywhere regardless of subject.
MAROON      = (107, 31, 42)
MAROON_DARK = (60, 0, 0)
CREAM       = (250, 246, 236)
PARCHMENT   = (244, 235, 215)
INK         = (26, 29, 36)
MUTED       = (92, 101, 120)
GRID        = (210, 200, 180)
RED         = (180, 50, 50)

# Per-subject accent palette. Each subject's lectures use a distinct accent
# so the whole curriculum visually feels like a real school where each class
# has its own room — same as our per-subject neural-voice mapping.
GOLD        = (212, 166, 52);  GOLD_LIGHT   = (224, 192, 96)   # Math
TEAL        = (40,  130, 130); TEAL_LIGHT   = (110, 180, 180)  # Science
SEPIA       = (172, 105, 50);  SEPIA_LIGHT  = (210, 160, 110)  # English / Literature
NAVY        = (38,  72,  128); NAVY_LIGHT   = (110, 140, 190)  # Social Studies / History
LAVENDER    = (118, 92,  168); LAVENDER_LT  = (180, 158, 220)  # Psychology
BURNT       = (200, 100, 50);  BURNT_LIGHT  = (235, 160, 110)  # PE / Health
STEEL       = (52,  90,  142); STEEL_LIGHT  = (130, 168, 212)  # Computer Science (Java syntax-highlight blue)

# Theme registry: matched against the first words of `course`.
# Order matters — first match wins.
THEMES = [
    # (course-prefix substring, theme dict)
    (("Algebra", "Geometry", "Calculus", "Pre-Calculus", "Trigonometry",
      "Statistics", "AP Statistics"),
        {"name": "math",
         "accent": GOLD, "accent_light": GOLD_LIGHT,
         "bg": CREAM,    "card_bg": PARCHMENT}),
    (("Biology", "AP Biology", "Chemistry", "Physics", "Environmental"),
        {"name": "science",
         "accent": TEAL, "accent_light": TEAL_LIGHT,
         "bg": CREAM,    "card_bg": PARCHMENT}),
    # Psychology before literature so "Media Psychology" resolves to psychology,
    # not to literature via the "Media" prefix.
    (("Psychology", "AP Psychology", "Cognitive", "Counseling", "Behavioral",
      "Human Development"),
        {"name": "psychology",
         "accent": LAVENDER, "accent_light": LAVENDER_LT,
         "bg": CREAM,        "card_bg": PARCHMENT}),
    (("English", "Composition", "Academic Writing", "Business Writing", "Communication", "Media"),
        {"name": "literature",
         "accent": SEPIA, "accent_light": SEPIA_LIGHT,
         "bg": PARCHMENT, "card_bg": CREAM}),
    (("History", "Government", "Geography", "Economics", "AP Human"),
        {"name": "social_studies",
         "accent": NAVY, "accent_light": NAVY_LIGHT,
         "bg": PARCHMENT, "card_bg": CREAM}),
    (("Health", "Athletic", "Sports", "Fitness", "Physical Education"),
        {"name": "pe_health",
         "accent": BURNT, "accent_light": BURNT_LIGHT,
         "bg": CREAM,     "card_bg": PARCHMENT}),
    (("Computer Science", "AP Computer Science", "Programming", "Software",
      "Java", "Python Programming", "Web Development"),
        {"name": "computer_science",
         "accent": STEEL, "accent_light": STEEL_LIGHT,
         "bg": CREAM,     "card_bg": PARCHMENT}),
]
DEFAULT_THEME = {"name": "default",
                 "accent": GOLD, "accent_light": GOLD_LIGHT,
                 "bg": CREAM,    "card_bg": PARCHMENT}

def resolve_theme(course: str) -> dict:
    """Look up the visual theme for a course by prefix match."""
    for prefixes, theme in THEMES:
        for p in prefixes:
            if course.lower().startswith(p.lower()) or p.lower() in course.lower():
                return theme
    return DEFAULT_THEME

def _font_path(*candidates: str) -> str:
    for candidate in candidates:
        if Path(candidate).exists():
            return candidate
    return candidates[0]


FONTS = {
    "sans": _font_path(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ),
    "sans_bold": _font_path(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ),
    "serif": _font_path(
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
    ),
    "serif_ital": _font_path(
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf",
        "/System/Library/Fonts/Supplemental/Georgia Italic.ttf",
    ),
    "serif_bold": _font_path(
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    ),
    "mono": _font_path(
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Courier New Bold.ttf",
    ),
}

def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONTS[name], size)

# ─── low-level helpers (exposed for custom() callbacks) ────────────────

def centered(d: ImageDraw.ImageDraw, text: str, fnt, y: int, color=INK) -> None:
    """Center `text` horizontally at vertical position `y`."""
    tw = d.textlength(text, font=fnt)
    d.text(((W - tw) / 2, y), text, fill=color, font=fnt)

def wrap(d: ImageDraw.ImageDraw, text: str, fnt, max_width: int) -> list[str]:
    """Greedy word-wrap to lines no wider than `max_width` pixels."""
    words = text.split()
    lines, cur = [], ""
    for w in words:
        candidate = (cur + " " + w).strip()
        if d.textlength(candidate, font=fnt) <= max_width:
            cur = candidate
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

# ─── the Deck ─────────────────────────────────────────────────────────

class Deck:
    """A GIIS-branded slide deck for one module.

    Parameters
    ----------
    course      e.g. "Algebra I" — appears in the bottom footer
    module_num  e.g. 4 — appears in the bottom footer
    output_dir  folder to write PNGs into (created if missing)
    logo_path   optional path to the GIIS logo for the title slide
    """

    def __init__(self, course: str, module_num: int,
                 output_dir: str = "slides", logo_path: str | None = None,
                 theme: dict | None = None):
        self.course = course
        self.module_num = module_num
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.logo_path = logo_path
        # Resolve subject-specific theme. Caller can override with explicit theme=.
        self.theme = theme if theme is not None else resolve_theme(course)
        # Convenience aliases used throughout the slide methods.
        self.accent = self.theme["accent"]
        self.accent_light = self.theme["accent_light"]
        self.bg = self.theme["bg"]
        self.card_bg = self.theme["card_bg"]
        self._write_style_manifest()

    def _write_style_manifest(self) -> None:
        """Write a lightweight style manifest next to the slides folder."""
        import json

        def rgb(value):
            return list(value)

        manifest = {
            "course": self.course,
            "module_num": self.module_num,
            "theme_name": self.theme.get("name", "default"),
            "accent": rgb(self.accent),
            "accent_light": rgb(self.accent_light),
            "background": rgb(self.bg),
            "card_background": rgb(self.card_bg),
        }
        target = self.output_dir.parent / "style_manifest.json"
        target.write_text(json.dumps(manifest, indent=2) + "\n")

    # ── private: shared base ──

    def _base(self, accent: bool = True) -> tuple[Image.Image, ImageDraw.ImageDraw]:
        img = Image.new("RGB", (W, H), self.bg)
        d = ImageDraw.Draw(img)
        if accent:
            # Top maroon bar + subject-accent stripe
            d.rectangle([0, 0, W, 16], fill=MAROON)
            d.rectangle([0, 16, W, 22], fill=self.accent)
            # Bottom maroon bar
            d.rectangle([0, H - 12, W, H], fill=MAROON)
            # Footer text
            ft = font("sans", 24)
            d.text((60, H - 50),
                   f"GIIS  ·  {self.course}  ·  Module {self.module_num}",
                   fill=MUTED, font=ft)
            d.text((W - 260, H - 50),
                   "Genesis of Ideas Intl.", fill=MUTED, font=ft)
        return img, d

    def _save(self, img: Image.Image, slug: str) -> Path:
        path = self.output_dir / f"{slug}.png"
        img.save(path, optimize=True)
        return path

    # ── slide types ──

    def title(self, slug: str, course_label: str, module_label: str,
              sub_label: str = "Sample lesson  ·  ~6 minutes") -> Path:
        """Cover / title slide. Maroon background (school identity), subject-accent ribbon."""
        img = Image.new("RGB", (W, H), MAROON)
        d = ImageDraw.Draw(img)
        d.rectangle([0, H - 160, W, H - 152], fill=self.accent)
        d.rectangle([0, H - 152, W, H - 90], fill=MAROON_DARK)
        if self.logo_path:
            try:
                logo = Image.open(self.logo_path).convert("RGBA")
                logo.thumbnail((280, 280))
                img.paste(logo, ((W - logo.width) // 2, 110), logo)
            except Exception:
                pass
        centered(d, "GENESIS OF IDEAS INTERNATIONAL", font("serif_bold", 44), 410, self.accent)
        centered(d, course_label,                     font("serif_bold", 96), 500, CREAM)
        centered(d, module_label,                     font("sans",       50), 640, CREAM)
        centered(d, sub_label,                        font("sans",       32), H - 130, self.accent_light)
        return self._save(img, slug)

    def overview(self, slug: str, title: str, items: list[str],
                 footnote: str | None = None) -> Path:
        """Numbered list of bullets. items = list of strings."""
        img, d = self._base()
        d.text((110, 90), title, fill=MAROON, font=font("serif_bold", 80))
        y = 230
        for i, t in enumerate(items, start=1):
            d.text((140, y), f"{i}.", fill=self.accent, font=font("serif_bold", 56))
            d.text((240, y + 8), t, fill=INK, font=font("sans", 40))
            y += 100
        if footnote:
            d.text((110, 800), footnote, fill=self.accent, font=font("sans_bold", 36))
        return self._save(img, slug)

    def definition(self, slug: str, title: str, headline: str,
                   sub: str | None = None) -> Path:
        """Big definition card — concept name + one-line definition + optional caption."""
        img, d = self._base()
        d.text((110, 90), title, fill=MAROON, font=font("serif_bold", 80))
        d.rounded_rectangle([110, 270, W - 110, 560], radius=24, outline=MAROON,
                             width=5, fill=self.card_bg)
        # Wrap headline if needed
        f_h = font("serif_bold", 60)
        lines = wrap(d, headline, f_h, W - 320)
        y = 320 if len(lines) == 1 else 290
        for line in lines:
            centered(d, line, f_h, y, INK)
            y += 80
        if sub:
            centered(d, sub, font("sans", 38), 480, MUTED)
        return self._save(img, slug)

    def equation(self, slug: str, title: str,
                 lines: list[tuple[str, tuple, str | None]]) -> Path:
        """Math example. Each line is (text, color, optional_subscript_note).

        Example:
            deck.equation("06_step1", "Example 1 — Solve x + 5 = 12", [
                ("x + 5 = 12",        INK,    None),
                ("x + 5 − 5 = 12 − 5", MUTED, "subtract 5 from both sides"),
                ("x = 7",             MAROON, "solution"),
            ])
        """
        img, d = self._base()
        d.text((110, 90), title, fill=MAROON, font=font("serif_bold", 70))
        f_eq = font("mono", 80)
        f_n  = font("sans", 30)
        y = 240
        for entry in lines:
            text, color, *rest = entry
            note = rest[0] if rest else None
            tw = d.textlength(text, font=f_eq)
            d.text(((W - tw) / 2, y), text, fill=color, font=f_eq)
            if note:
                nw = d.textlength(note, font=f_n)
                d.text(((W - nw) / 2, y + 95), note, fill=self.accent, font=f_n)
            y += 150
        return self._save(img, slug)

    def pause(self, slug: str, label: str, prompt: str, equation: str,
              hint: str | None = None) -> Path:
        """Subject-accent banner with a centered question prompt."""
        img, d = self._base()
        d.rectangle([0, 80, W, 220], fill=self.accent)
        centered(d, label, font("serif_bold", 96), 100, MAROON_DARK)
        d.text((110, 320), prompt, fill=INK, font=font("sans", 48))
        # Equation centered, big
        f_eq = font("mono", 130)
        centered(d, equation, f_eq, 470, MAROON)
        if hint:
            d.text((110, 720), hint, fill=MUTED, font=font("sans", 40))
        return self._save(img, slug)

    def compare(self, slug: str, title: str, left: dict, right: dict) -> Path:
        """Two-column wrong-vs-right comparison.

        left/right = {"label": "✗ WRONG", "color": RED, "lines": ["...", "..."], "footnote": "..."}
        """
        img, d = self._base()
        d.text((110, 90), title, fill=MAROON, font=font("serif_bold", 76))
        for col_x, side in [(110, left), (1000, right)]:
            d.rounded_rectangle([col_x, 270, col_x + 810, 720], radius=20,
                                 outline=side["color"], width=5, fill=self.card_bg)
            d.text((col_x + 40, 300), side["label"], fill=side["color"],
                   font=font("serif_bold", 48))
            f_b = font("sans", 36)
            y = 400
            for line in side["lines"]:
                d.text((col_x + 40, y), line, fill=INK, font=f_b)
                y += 60
            if side.get("footnote"):
                d.text((col_x + 40, 670), side["footnote"], fill=MUTED,
                       font=font("sans", 28))
        return self._save(img, slug)

    def recap(self, slug: str, title: str, items: list[str],
              assignment: list[str] | None = None) -> Path:
        """Bulleted recap, optional yellow assignment box at the bottom."""
        img, d = self._base()
        d.text((110, 90), title, fill=MAROON, font=font("serif_bold", 80))
        y = 230
        for t in items:
            d.text((140, y), "·", fill=self.accent, font=font("serif_bold", 56))
            d.text((200, y + 10), t, fill=INK, font=font("sans", 36))
            y += 100
        if assignment:
            d.rounded_rectangle([110, 660, W - 110, 920], radius=20,
                                 outline=MAROON, width=5)
            d.text((150, 690), "Assignment", fill=MAROON,
                   font=font("serif_bold", 48))
            for i, line in enumerate(assignment):
                d.text((150, 770 + i * 50), line, fill=INK, font=font("sans", 32))
        return self._save(img, slug)

    def path(self, slug: str,
             items: list[tuple[str, str, str]],
             next_text: str | None = None,
             intro: str = "This video is ~10% of the work.  Here's the rest:") -> Path:
        """The "How to actually master this module" closing slide.

        items = list of (number, headline, subtext) tuples.
        Use "✓" as number for the already-done first row (will be coloured gold).
        """
        img, d = self._base()
        d.text((110, 80), "How to actually master this module.",
               fill=MAROON, font=font("serif_bold", 60))
        d.text((110, 170), intro, fill=MUTED, font=font("sans", 34))
        y = 280
        for n, head, sub in items:
            done = n.strip() == "✓"
            n_color = self.accent if done else MAROON
            head_color = self.accent if done else INK
            d.text((140, y), n, fill=n_color, font=font("serif_bold", 44))
            d.text((230, y), head, fill=head_color, font=font("serif_bold", 38))
            if sub:
                d.text((230, y + 50), sub, fill=MUTED, font=font("sans", 28))
            y += 110
        if next_text:
            d.text((110, 870), next_text, fill=self.accent, font=font("sans_bold", 32))
        return self._save(img, slug)

    def custom(self, slug: str, render: callable) -> Path:
        """Escape hatch for arbitrary slides — graphs, diagrams, anything.

        Pass a function that takes (img, draw) and renders into them. The
        slide's branded base (top bars + footer) is already drawn before
        your render runs.

        Example:
            def my_graph(img, d):
                d.text((110, 90), "Graph slide", fill=MAROON, font=font("serif_bold", 80))
                # ... custom PIL drawing ...
            deck.custom("09_graph", my_graph)
        """
        img, d = self._base()
        render(img, d)
        return self._save(img, slug)

    def duplicate(self, src_slug: str, *dst_slugs: str) -> list[Path]:
        """Save the same image under multiple slugs. Useful when a pause-and-try
        slide is shown for both the question section and the answer-reveal section
        in script.json — they need to be the same PNG."""
        src_path = self.output_dir / f"{src_slug}.png"
        out: list[Path] = []
        for s in dst_slugs:
            dst = self.output_dir / f"{s}.png"
            dst.write_bytes(src_path.read_bytes())
            out.append(dst)
        return out
