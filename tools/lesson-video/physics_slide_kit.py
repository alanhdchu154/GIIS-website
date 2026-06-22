"""Physics-specific slide templates for generated GIIS lesson videos.

`slide_kit.Deck` is intentionally generic. This module adds Physics
Fundamentals layouts so generated `build_slides.py` files can stay data-first:
instantiate `PhysicsSlides(deck)` and call small template methods instead of
rebuilding the same PIL geometry in every module.
"""
from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from slide_kit import (
    GOLD,
    H,
    INK,
    MAROON,
    MUTED,
    NAVY,
    PARCHMENT,
    TEAL,
    W,
    font,
    wrap,
)
from physics_diagrams import (
    draw_circular_motion_diagram,
    draw_doppler_wavefronts,
    draw_interference_panel,
    draw_step_rows,
    draw_wave_property_diagram,
)


class PhysicsSlides:
    """Composable Physics layouts backed by a `slide_kit.Deck`."""

    def __init__(self, deck):
        self.deck = deck

    def concept_cards(
        self,
        slug: str,
        title: str,
        subtitle: str,
        cards: Sequence[dict[str, str]],
        *,
        model_lines: Sequence[str] | None = None,
    ):
        """Three/four compact concept cards plus optional modeling habit lines."""

        def render(img, d):
            d.text((110, 78), title, fill=MAROON, font=font("serif_bold", 62))
            d.text((110, 170), subtitle, fill=self.deck.accent, font=font("sans_bold", 28))
            count = max(1, len(cards))
            gap = 28
            card_w = (W - 220 - gap * (count - 1)) // count
            y = 260
            for i, card in enumerate(cards):
                x = 110 + i * (card_w + gap)
                d.rounded_rectangle([x, y, x + card_w, y + 310], radius=18, fill=self.deck.card_bg, outline=self.deck.accent, width=4)
                d.text((x + 28, y + 28), card.get("title", ""), fill=MAROON, font=font("serif_bold", 34))
                formula = card.get("formula")
                if formula:
                    d.text((x + 28, y + 95), formula, fill=self.deck.accent, font=font("mono", 50))
                unit = card.get("unit")
                if unit:
                    d.text((x + 28, y + 160), unit, fill=MUTED, font=font("sans_bold", 26))
                body = card.get("body", "")
                by = y + 205
                for line in wrap(d, body, font("sans", 26), card_w - 56)[:3]:
                    d.text((x + 28, by), line, fill=INK, font=font("sans", 26))
                    by += 34
            if model_lines:
                d.rounded_rectangle([110, 660, W - 110, 930], radius=18, fill=PARCHMENT, outline=MAROON, width=4)
                d.text((148, 692), "Expert modeling habit", fill=MAROON, font=font("serif_bold", 42))
                my = 760
                for line in model_lines[:4]:
                    d.text((170, my), "•", fill=self.deck.accent, font=font("serif_bold", 38))
                    d.text((220, my + 6), line, fill=INK, font=font("sans", 32))
                    my += 58

        return self.deck.custom(slug, render)

    def formula_cards(
        self,
        slug: str,
        title: str,
        cards: Sequence[dict[str, str]],
        *,
        variables: Sequence[str] | None = None,
        footer: str | None = None,
    ):
        """Formula cards with optional variable legend."""

        def render(img, d):
            d.text((110, 80), title, fill=MAROON, font=font("serif_bold", 66))
            gap = 36
            card_w = (W - 220 - gap * (len(cards) - 1)) // max(1, len(cards))
            for i, card in enumerate(cards):
                x = 110 + i * (card_w + gap)
                d.rounded_rectangle([x, 230, x + card_w, 510], radius=20, fill=self.deck.card_bg, outline=self.deck.accent, width=5)
                d.text((x + 34, 260), card.get("formula", ""), fill=self.deck.accent, font=font("mono", 58))
                d.text((x + 34, 350), card.get("title", ""), fill=MAROON, font=font("serif_bold", 32))
                d.text((x + 34, 405), card.get("body", ""), fill=MUTED, font=font("sans", 26))
            if variables:
                d.rounded_rectangle([110, 610, W - 110, 860], radius=18, fill=PARCHMENT, outline=MAROON, width=4)
                d.text((148, 640), "Variables", fill=MAROON, font=font("serif_bold", 42))
                y = 712
                for line in variables[:4]:
                    d.text((170, y), line, fill=INK, font=font("sans", 32))
                    y += 48
            if footer:
                d.text((110, 920), footer, fill=self.deck.accent, font=font("sans_bold", 30))

        return self.deck.custom(slug, render)

    def worked_trace(
        self,
        slug: str,
        title: str,
        steps: Sequence[tuple[str, str, str] | tuple[str, str]],
        *,
        subtitle: str | None = None,
        footer: str | None = None,
    ):
        """Worked example as stable row trace. Steps are label/body/(optional color)."""

        def render(img, d):
            d.text((110, 74), title, fill=MAROON, font=font("serif_bold", 60))
            if subtitle:
                d.text((110, 160), subtitle, fill=MUTED, font=font("sans", 30))
            rows = []
            colors = [TEAL, NAVY, MAROON, GOLD]
            for i, step in enumerate(steps):
                if len(step) == 3:
                    label, body, color = step
                else:
                    label, body = step
                    color = colors[i % len(colors)]
                rows.append((label, body, color))
            draw_step_rows(d, rows, y=230 if subtitle else 200, row_h=86 if len(rows) > 6 else 96)
            if footer:
                d.text((110, 940), footer, fill=self.deck.accent, font=font("sans_bold", 28))

        return self.deck.custom(slug, render)

    def answer_trace(self, slug: str, title: str, steps: Sequence[tuple[str, str]], *, callout: str | None = None):
        return self.worked_trace(slug, title, steps, footer=callout)

    def modeling_pause(self, slug: str, prompt_lines: Sequence[str], formula: str, expert_move: str, *, hint: str | None = None):
        prompt = " ".join(prompt_lines)
        return self.deck.pause(slug, "PAUSE  &  TRY", prompt, formula, hint=hint or expert_move)

    def application_grid(
        self,
        slug: str,
        title: str,
        habit: str,
        items: Sequence[tuple[str, str, str]],
        *,
        source: str | None = None,
    ):
        """Assignment/application rows with source label."""

        def render(img, d):
            d.text((110, 76), title, fill=MAROON, font=font("serif_bold", 66))
            d.text((110, 168), habit, fill=self.deck.accent, font=font("sans_bold", 28))
            y = 250
            for n, head, body in items[:4]:
                d.rounded_rectangle([110, y, W - 110, y + 138], radius=16, fill=self.deck.card_bg, outline=self.deck.accent, width=3)
                d.text((150, y + 28), n, fill=MAROON, font=font("serif_bold", 36))
                d.text((230, y + 26), head, fill=INK, font=font("serif_bold", 34))
                d.text((230, y + 78), body, fill=MUTED, font=font("sans", 26))
                y += 158
            if source:
                d.rounded_rectangle([110, 900, W - 110, 980], radius=14, fill=PARCHMENT, outline=MAROON, width=3)
                d.text((150, 925), f"Source: {source}", fill=MAROON, font=font("sans_bold", 28))

        return self.deck.custom(slug, render)

    def wave_properties(self, slug: str, title: str, *, properties: Sequence[str], formula: str):
        """Wave diagram plus property checklist."""

        def render(img, d):
            d.text((110, 72), title, fill=MAROON, font=font("serif_bold", 62))
            draw_wave_property_diagram(d, x=170, y_center=400)
            d.rounded_rectangle([1060, 230, W - 110, 720], radius=18, fill=self.deck.card_bg, outline=self.deck.accent, width=4)
            d.text((1100, 260), formula, fill=MAROON, font=font("mono", 52))
            y = 350
            for line in properties[:5]:
                d.text((1100, y), "•", fill=self.deck.accent, font=font("serif_bold", 34))
                d.text((1145, y + 6), line, fill=INK, font=font("sans", 28))
                y += 62

        return self.deck.custom(slug, render)

    def doppler_diagram(self, slug: str, title: str, note: str):
        def render(img, d):
            d.text((110, 88), title, fill=MAROON, font=font("serif_bold", 66))
            draw_doppler_wavefronts(d)
            d.text((110, 910), note, fill=self.deck.accent, font=font("sans_bold", 28))

        return self.deck.custom(slug, render)

    def interference_diagram(self, slug: str, title: str, *, note: str | None = None):
        def render(img, d):
            d.text((110, 72), title, fill=MAROON, font=font("serif_bold", 60))
            draw_interference_panel(d)
            if note:
                d.text((110, 940), note, fill=self.deck.accent, font=font("sans_bold", 28))

        return self.deck.custom(slug, render)

    def circular_motion_diagram(self, slug: str, title: str, note: str):
        def render(img, d):
            d.text((110, 90), title, fill=MAROON, font=font("serif_bold", 64))
            draw_circular_motion_diagram(d)
            d.text((110, 910), note, fill=self.deck.accent, font=font("sans_bold", 28))

        return self.deck.custom(slug, render)

