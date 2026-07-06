# Umi Workload

Last updated: 2026-07-05 22:51 CDT

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
- state: P1/P2/P3/P4/P5 implemented by Codex; no active cc blocker remains

## Objective

cc ran a read-only system + parent-facing review at Alan's request. CC-quota and
T9-mount "problems" were ruled out as physical/contextual rather than systemic.
The actionable backlog from this pass has been implemented. Completed history
has been moved out of this active handoff; use this file only for the next
focused worker task.

## Current Lesson-Video State

Alan's 2026-07-05 20:00 CT top-up lane is complete. The bounded foundation
runner found 10 existing gate-ready lessons from the 18:01/20:00 work,
reran parent-trust after a targeted audit false-positive fix, wrote the
approval artifact, and uploaded all 10 unlisted through
`yt_queue.py upload --gate-ready`. Current durable state is in `ROADMAP.md`;
detailed prior slot evidence is archived in
`docs/archive/ROADMAP_DETAIL_2026-07-03-lesson-video-slots.md`.

Current snapshot from the completed run:

- 2026-07-05 22:50-22:51 CT upload run: 10 uploaded / 0 failed / 0 still
  pending.
- latest uploaded video IDs: `N0htezaYzJ0`, `vPZvS29eB3M`, `1FNGyfFfmrA`,
  `5RtXG9QCpy4`, `a1m8NwEzWfc`, `AiC-3xTM8jk`, `_oZeVP0Rpvo`,
  `WkxOGnIRc50`, `foFqzEBCg38`, `dD6fr0L0wBU`
- same-day uploaded count is now 40 on 2026-07-05 CT
- queue 572 uploaded / 0 pending / 0 no-MP4
- pending release gate 0 ready / 0 needs_revision / 0 blocked
- public manifest 488 lessons / 0 alignment warnings; upload ran with
  `--no-sync`, so manifest/channel sync remains reconciliation
- captions remain backlog and must not be promised as universally available
- Abnormal Psychology is a future cleanup item: course-design guard skipped it
  because 11 modules is outside the expected 12-16 range for a 1-credit course.
- Business Law is a future cleanup item: course-design guard skipped it because
  11 modules is outside the expected 12-16 range for a 1-credit course.
- Dirty risk resolved: root `slides/` / `style_manifest.json` were removed
  after Alan's scoped cleanup approval. Root artifacts reappeared during the
  18:01 CT run and were removed again after upload. Do not stage generated
  lesson-video media or T9 artifacts.
- Parent-trust audit false positives fixed for this top-up: economics money
  examples in MR/MC, demand schedules, budget lines, firm costs, and unit/price
  calculations are allowed only as instructional context when not school-facing;
  `AP` is allowed in Average Product / marginal product economics context, not
  as Advanced Placement authorization.
- Parent-trust audit redesign: `tools/lesson-video/parent_trust_video_audit.py`
  now treats keyword hits as recall candidates, classifies them through a local
  semantic BLOCK/ALLOW judge, and runs versioned fixtures before auditing
  lessons. It still blocks accreditation, AP/College Board authorization,
  admissions/visa/credit, payment/enrollment, credential, raw URL, real-person,
  and true outcome-guarantee risk.

## Codex Implementation: 2026-07-05 Parent-Trust Audit Redesign

Completed:

- Replaced `is_contextual_false_positive` growth with
  `classify_hard_candidate(kind, match, context)`, which returns structured
  `{verdict, claimType, quote, reason}` decisions.
- Kept keyword patterns as recall. Hard findings are now BLOCK decisions;
  instructional ALLOW decisions move to `ignored_findings` with the reason and
  full semantic decision.
- Added Chinese `美国认证` accreditation detection via Unicode escape.
- Added versioned fixtures at
  `tools/lesson-video/tests/parent_trust_fixtures.json`, seeded with historical
  allow cases and real must-block public-claim cases.
- Added `tools/lesson-video/tests/test_parent_trust_video_audit.py`.
- Added `--check-fixtures-only`; normal audit runs fixture regression first and
  exits with code 2 if the policy fixtures fail.

Verification:

- `python3 -m py_compile tools/lesson-video/parent_trust_video_audit.py tools/lesson-video/tests/test_parent_trust_video_audit.py`
- `python3 tools/lesson-video/tests/test_parent_trust_video_audit.py` -> 3 tests
  pass
- `python3 tools/lesson-video/parent_trust_video_audit.py --check-fixtures-only`
  -> fixture regression checks passed
- `python3 tools/lesson-video/parent_trust_video_audit.py --out-dir /tmp/giis-parent-trust-smoke --report-name recent-smoke teaching-videos/calculus-module-13-introduction-to-differential-equations-v2 teaching-videos/college-research-writing-module-2-library-database-research-v2`
  -> `TRUST_READY` for 2 lessons

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

No active cc handoff remains from this backlog. Optional future hardening:
connect the independent Opus reviewer JSON more directly into the parent-trust
audit report, but the current deterministic fixture-backed gate is sufficient
for the next foundation-video run.

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
