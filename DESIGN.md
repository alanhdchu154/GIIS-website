# GIIS DESIGN.md

Last updated: 2026-06-28 23:54 CDT

This file gives coding agents a stable visual source of truth for GIIS
parent-facing and learner-facing UI work. It does not replace `AGENTS.md`,
`ROADMAP.md`, official-document contracts, or production safety gates.

## Product Feeling

GIIS should feel like a real online private school: calm, credible, transparent,
and operationally serious. The design goal is parent trust, not startup flash.
Parents should quickly understand:

- this is a Florida-registered private school, not a generic course site;
- the diploma/transcript path is structured and honest;
- the student dashboard and lesson experience are real product surfaces;
- enrollment and payment decisions are deliberate, not rushed.

Avoid decorative AI imagery, hype, or vague education stock photography. Prefer
real portal screenshots, concrete student/parent flows, official document
previews, and clear proof surfaces.

## Visual Identity

Primary palette:

- Deep institutional blue: `#2b3d6d`
- Dark hero/nav navy: `#0f1020`, `#1a1a2e`
- Gold trust accent: `#d5a836`
- Text: `#1a1d24`
- Muted text: `#5c6578`
- Success green for live/verified state: `#2e7d32`
- White and near-white page surfaces: `#ffffff`, `#f7f9fc`

Use gold sparingly for trust markers, proof labels, pricing emphasis, and
primary highlights. Do not let the site become a gold/brown theme.

## Typography

Global family is controlled in `src/index.css`:

```css
--giis-font-sans: 'Noto Sans TC', 'Noto Sans', system-ui, -apple-system, 'Segoe UI',
  'Helvetica Neue', Arial, sans-serif;
```

Use the same family for English and Chinese. Chinese UI uses `html[lang="zh"]`
responsive adjustments where needed. Keep headings confident but not oversized
inside dense parent/learning surfaces.

Do not use negative letter spacing. Use uppercase eyebrow text only for short
labels such as `Florida-Registered`, `Trust Center`, or product-status tags.

## Layout Principles

- Marketing pages may use wide hero sections with real product screenshots.
- Operational pages should be dense, scannable, and restrained.
- Cards use `8px` radius unless matching an existing locked official-document
  style.
- Avoid cards inside cards.
- Avoid floating decorative sections that look like marketing templates.
- Keep mobile text readable and wrap CTA labels instead of shrinking to
  illegible sizes.
- Keep parent-facing CTAs stable: consultation, application, trust center,
  demo, login.

## Components

Buttons:

- Primary CTA: deep blue or gold-on-dark context, strong but not flashy.
- Secondary CTA: white/outlined or muted surface.
- Do not use `mailto:` enrollment CTAs; use the existing routes.
- Avoid more than two primary-looking CTAs in one viewport.

Navigation:

- Desktop nav is institutional blue with white labels and gold hover/accent
  details.
- Chinese labels may need larger font size and slightly more space.
- Mega menus should be clear, rectangular, and content-led.

Proof surfaces:

- Prefer real screenshots from `src/img/Hero/`.
- Use concise proof labels: Florida-registered, 24-credit framework, parent
  visibility, transcript records.
- Keep accreditation wording honest. Never imply Cognia or US accreditation.

Official documents:

- Transcript and diploma visuals are locked trust artifacts. Before changing
  them, read `docs/official-document-format-contract.md` and run
  `npm run audit:official-docs`.

## Imagery

Use real Learn Portal screenshots and real GIIS product surfaces. Do not
reintroduce AI-generated stock photos or generic classroom hero images.

Hero screenshot source of truth:

- `src/img/Hero/dashboard-screen.jpg`
- `src/img/Hero/pathways-screen.jpg`
- `src/img/Hero/module-screen.jpg`
- `src/img/Hero/transcript-screen.jpg`
- `src/img/Hero/diploma-screen.jpg`

## Bilingual Design

English and Simplified Chinese share structure. Do not create separate page
hierarchies unless the content genuinely diverges.

Chinese copy often occupies more visual width. Test mobile wrapping on nav,
hero, pricing, trust, and CTA surfaces before shipping.

## Agent A/B Test Result

Pattern adopted from external `DESIGN.md` repo: use a repo-local visual
identity file as a stable prompt source for future UI agents.

Decision: adopt for GIIS.

Why:

- Parent-facing UI changes are frequent and trust-sensitive.
- Existing rules were spread across `AGENTS.md`, CSS, screenshots, and memory.
- A single design source reduces visual drift without adding runtime code.

How to use:

1. Read this file before visible GIIS UI changes.
2. Still obey `AGENTS.md`, claim boundaries, and production deploy gates.
3. For parent-facing changes, run the smallest useful build/browser/trust gate.
4. Update this file only when the visual system itself changes.
