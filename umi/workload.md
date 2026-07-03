# Umi Workload

Last updated: 2026-07-03 16:28 CDT

This file holds one active Codex / cc worker handoff at a time. Use
`ROADMAP.md` for durable project direction and archived reports/git history for
old slot evidence.

## Active Handoff: System + Parent-Facing Optimization Backlog

- owner: Codex (repo fully handed to Codex by Alan on 2026-07-03)
- repo: `/Users/alanhdchu/giis-website`
- mode: Codex implementation with cc-ready follow-up for P1 semantic redesign
- model routing:
  - Sonnet: bounded implementation, mechanical cleanup, playlist/upload hygiene.
  - Opus: parent-trust semantic redesign, public-claim/payment/deploy judgment.
- priority: medium (no live production blocker; quality/trust hardening)
- time anchor: 2026-07-03
- time-aware continuity acknowledged?: yes
- state: P2/P3/P4/P5 implemented by Codex; P1 remains pending

## Objective

cc ran a read-only system + parent-facing review at Alan's request. CC-quota and
T9-mount "problems" were ruled out as physical/contextual rather than systemic.
The actionable backlog is now narrowed to parent-trust audit redesign; completed
history has been moved out of this active handoff.

## Current Lesson-Video State

Alan's 2026-07-03 10-video top-up request is complete. Current durable state is
in `ROADMAP.md`; detailed slot evidence is archived in
`docs/archive/ROADMAP_DETAIL_2026-07-03-lesson-video-slots.md`.

Current snapshot from the completed top-up:

- queue 502 uploaded / 0 pending / 0 no-MP4
- pending release gate 0 ready / 0 needs_revision / 0 blocked
- dashboard 502 lessons / 501 MP4 / 502 uploaded / pending_upload=0
- public manifest 484 lessons / 0 alignment warnings
- captions remain backlog and must not be promised as universally available

## Codex Implementation: 2026-07-03

Completed:

- P2 playlist retry/backoff: `tools/youtube-upload/upload_lesson.py` retries
  transient playlist insert failures (`aborted`, backend/rate-limit, 429/5xx)
  with bounded 2s / 5s / 10s backoff before leaving reconciliation as fallback.
- P3 roadmap/workload cleanup: historical slot logs were archived to
  `docs/archive/ROADMAP_DETAIL_2026-07-03-lesson-video-slots.md`; `ROADMAP.md`
  now keeps current lanes/state; this file now keeps only the active handoff.
- P4 captions honesty: `src/components/main/LessonPreview.js` no longer claims
  every lesson has English captions. It now says lessons are taught in English
  and captions are a separate quality pass, with YouTube player captions used
  when available.
- P5 pricing nav: `src/components/main/Nav.js`, `Nav.module.css`, and
  `src/i18n/siteStrings.js` add a top-level Pricing link on desktop and a direct
  Pricing entry in the mobile menu.

Verification already completed for P2/P4/P5:

- `python3 -m py_compile tools/youtube-upload/upload_lesson.py`
- `npm run audit:sales-launch` -> 53/53 pass
- `npm run build` -> pass, Browserslist warning only
- `npm run audit:conversion-bilingual -- --base-url http://localhost:3030` ->
  7/7 pass
- `npm run audit:parent-journey -- --base-url http://localhost:3030` -> 7/7 pass
- `npm run audit:sales-live -- --base-url http://localhost:3030` -> 9/9 pass
- Playwright desktop/mobile smoke: Pricing link visible; no horizontal overflow

## Remaining Work

### P1 Pending: Parent-Trust Audit Redesign

`tools/lesson-video/parent_trust_video_audit.py` is still too keyword-driven and
keeps false-positiving on normal instructional wording. This should be a small
Opus-level design/implementation pass:

- Move final verdict toward semantic judgment at the independent review stage.
- Keep keywords as recall/signals, not automatic final blockers.
- Add a versioned pass/block fixture set so future fixes are not ad-hoc carve
  outs.
- Preserve strict blocking for actual GIIS payment, tuition, Stripe,
  accreditation, AP, admissions, and outcome-guarantee claims.

### Verified Good / No Action

- `/lessons` public library surfaces the video library by course from manifest.
- Trust infrastructure exists in nav (`/trust-center`, `/verify`,
  `/diploma/:id`, `/assessment-proof`).
- `/pricing` is now in the main nav after the Codex P5 edit.
- Manual reviewed sales remain allowed inside the existing payment boundary;
  automated Guided/Premium checkout remains blocked until live Stripe price and
  payment gates are green.

## Constraints

- Do not weaken score-100, source-alignment, parent-trust, or upload gates.
- Do not treat standard captions as a video-upload blocker.
- Do not stage T9 media or generated lesson-video artifacts.
- Do not push `main` casually; push equals Netlify frontend deploy.
- Do not confuse no-pending-upload queue with no-production-needed.

## Suggested Verification For Future Lesson Work

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
