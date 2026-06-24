# Umi Workload

Last updated: 2026-06-24

This file holds one active Codex / cc worker handoff at a time. Use
`ROADMAP.md` for durable project direction and archived reports/git history for
old slot evidence.

## Active Handoff: Business Ethics Video Gate

- owner: GIIS lesson-video worker / Codex / Claude Code
- repo: `/Users/alanhdchu/giis-website`
- mode: Split-work
- model routing:
  - Sonnet for bounded production/render mechanics.
  - Opus for independent source-alignment and parent-trust review.
- priority: high
- time anchor: 2026-06-24
- time-aware continuity acknowledged?: yes

## Objective

Finish the current Business Ethics lesson-video lane safely:

1. Complete Business Ethics M2 TTS/MP4.
2. Run independent review and source-alignment review.
3. Upload only if release gates pass.
4. Repair/review Business Ethics M1 before any upload.

## Current Evidence

- Academic Writing M7-M8 uploaded at 03:00 CT:
  - M7 `qI-Zm9CWrYI`
  - M8 `ELX3loeOYjA`
- Academic Writing is now 8/8 uploaded.
- Business Ethics source labels were repaired from stale MIT OCW labels to
  OpenStax Business Ethics labels.
- Business Ethics M2 is pre-render ready:
  - script, slides, contact sheet
  - three learning checks
  - reviewer A/B/C pass
  - expert-lens pass
  - OpenStax source alignment visible
- M2 release gate is still `needs_review` only because MP4 is missing, expected
  before the orchestrator render stage.

## Constraints

- Do not weaken score-100, source-alignment, parent-trust, or upload gates.
- Do not treat standard captions as a video-upload blocker.
- Do not stage T9 media or generated lesson-video artifacts.
- Do not push `main` casually; push equals Netlify frontend deploy.
- Do not confuse no-pending-upload queue with no-production-needed.

## Suggested Verification

Use the existing GIIS runbooks and gates for the touched lesson. Minimum evidence
before upload:

- MP4 exists.
- independent review pass exists.
- source alignment review pass exists.
- parent-trust/video gate pass exists.
- upload uses `yt_queue.py upload --gate-ready`.

## Stop Conditions

- Any source mismatch remains.
- Required resources are paid/login-gated or mislabeled.
- cc session limit or review failure leaves approval artifacts missing.
- A command would stage generated media, T9 artifacts, secrets, or deploy-facing
  frontend changes outside the scoped task.

## On Demand: School Ops / Sales

Before outreach or checkout changes, run the school ops / sales gates from the
repo runbook. Manual reviewed sales remain allowed only inside the existing
payment boundary; automated Guided/Premium checkout remains blocked until live
Stripe price and payment gates are green.
