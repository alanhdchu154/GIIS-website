# Umi Workload

Last updated: 2026-06-24

This file holds one active Codex / cc worker handoff at a time. Use
`ROADMAP.md` for durable project direction and archived reports/git history for
old slot evidence.

## Active Handoff: Business Research Methods M1 Repair Then Continue

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

Repair the one remaining Business Research Methods M1 blocker, then continue
normal Grade 11 foundation production:

1. Remove or rewrite the M1 hook wording that parent-trust flags as
   `payment_claim`.
2. Regenerate MP4/transcript after script edits.
3. Rerun Opus independent review/source-alignment review.
4. Upload only if release gate and parent-trust audit pass.
5. Continue the deterministic Grade 11 sequence; do not stop merely because no
   "repair backlog" exists.

## Current Evidence

- Academic Writing M7-M8 uploaded at 03:00 CT:
  - M7 `qI-Zm9CWrYI`
  - M8 `ELX3loeOYjA`
- Academic Writing is now 8/8 uploaded.
- Business Ethics source labels were repaired from stale MIT OCW labels to
  OpenStax Business Ethics labels.
- 2026-06-24 08:00 CT slot uploaded 9 more lessons:
  - Business Ethics M1-M8 are now 8/8 uploaded.
  - Business Research Methods M2 uploaded.
- Today's artifact-backed CT count is 11.
- Business Research Methods M1 has MP4 but is not uploaded:
  - parent-trust audit still flags the hook wording as `payment_claim`.
  - `_review_source_alignment.json` remained stale after an Opus wrapper run hit
    `Claude Code session limit reached`.
- Queue status after the slot: 361 uploaded, 1 pending, 0 no-MP4.

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
- cc session limit or review failure leaves approval artifacts missing or stale.
- A command would stage generated media, T9 artifacts, secrets, or deploy-facing
  frontend changes outside the scoped task.

## On Demand: School Ops / Sales

Before outreach or checkout changes, run the school ops / sales gates from the
repo runbook. Manual reviewed sales remain allowed only inside the existing
payment boundary; automated Guided/Premium checkout remains blocked until live
Stripe price and payment gates are green.
