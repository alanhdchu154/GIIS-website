# Umi Workload

Last updated: 2026-06-16

This file is the current GIIS active Codex / cc worker handoff, not a historical worklog. Older
completed items were removed from the active board; use `ROADMAP.md` for the
durable project lane. Use `umi/reviews/`, reports, or git history when old
evidence is explicitly needed.

## Active Handoff

### School Operations Daily Gate

- owner: Umi / Codex
- mode: Umi-first operations triage with bounded cc review when a code or
  payment-risk change is needed
- priority: current daily operator entrypoint

Next action:

- Start daily school-ops review with:
  `npm run school:ops-report -- --report /tmp/giis-school-ops-daily.md --json-report /tmp/giis-school-ops-daily.json`.
- Treat `manual_sales_go_with_payment_boundary` as: reviewed manual sales may
  proceed through application/consultation handoff, but no automated
  Guided/Premium checkout links may be sent.
- If the verdict is `not_ready`, stop outreach/payment handoff and inspect the
  failing sub-gate before continuing.
- If the verdict is `automated_payment_ready`, still review the payment runbook
  and current Stripe/Lightsail evidence before promoting checkout publicly.

Current Umi note:

- 2026-06-16 daily gate result: `manual_sales_go_with_payment_boundary`.
  Included signals: production API proxy 12 pass / 0 fail, sales live 8 pass /
  0 fail, parent journey 7 pass / 0 fail, owner decisions 3 pass / 1 warn / 0
  fail, manual sales ready 12 pass / 1 warn / 0 fail, payment live 4 pass / 1
  warn / 2 fail, lesson manifest 129 lessons / 0 warnings, release gate 76
  ready / 60 needs revision / 0 blocked, video dashboard 136 lessons / 129
  uploaded / 4 pending upload, inventory 136 folders / 129 visible / 136 MP4.
- The two payment-live failures are the expected automated-checkout blockers:
  missing live Stripe Price IDs for Guided and Premium. Self-Paced annual is an
  optional warning.
- Netlify `consultation` / `contact` notifications are not confirmed in
  `docs/parent-sales-owner-decisions.json`; `school:ops-report` now emits a
  `lead-capture` next action reminding the recorded daily submissions owner to
  manually check Netlify submissions and admissions inbox before relying on
  inbound leads.
- `npm run lead-capture:test` is the dry-run verifier for this gap. It checks
  local hidden forms, production form registration, and test payload shape
  without sending an external submission. Use `--confirm-submit` only when an
  operator is ready to verify Netlify submissions and admissions inbox delivery.
- `docs/parent-sales-daily-operator-checklist.md` and
  `docs/templates/parent-sales-daily-operator-log.md` now start from
  `school:ops-report`, so the daily operator sees full school ops status before
  using narrower same-day owner or sales-launch commands.
- Lesson-video `needs_revision` rows are older quality debt under the current
  gate, not upload failure. Do not force upload to make the number go down.

Acceptance:

- Daily report command exits 0 or its non-zero failure is explicitly explained.
- Manual-sales, automated-payment, and lesson-video signals are not collapsed
  into one vague "green" or "red" state.
- Any generated `_audit/` report noise is either intentionally committed or
  restored before push.

### Parent Sales Launch Mode

- owner: Umi / Codex
- mode: Umi-first with bounded cc review when code changes touch sales gates
- priority: current parent-sales operating boundary

Next action:

- Prefer the guarded daily command:
  `npm run sales:start-day -- --owner <same-day-owner> --checked yes --manual-stripe-authorized yes`.
  It generates the outside-git operator log and immediately runs launch-mode.
- Generate the same-day operator log outside git with
  `npm run sales:operator-log -- --owner <same-day-owner> --checked yes --manual-stripe-authorized yes`
  only after that person agrees to cover lead capture, response, WeChat, and
  manual Stripe handoff for the day.
- Before outreach or sales-day decisions, run
  `npm run sales:launch-mode -- --operator-log /path/to/operator-log.md`.
- For paid enrollments in v1, use `/admin/applications` **Record Manual
  Payment** after the application/path review is approved and Stripe Dashboard
  evidence exists; then create accounts. Do not wait for automated checkout to
  be green before using this reviewed manual flow.
- If no same-day operator log exists and permanent owner decisions are still
  blank, treat `not_ready` as expected and record the missing Alan review items
  instead of bypassing the gate.
- Permanent owner decisions now record Alan as interim owner for lead capture,
  first response, WeChat follow-up, and manual Stripe handoff. This lets the
  manual sales lane run without a same-day `/tmp` operator log, while still
  keeping automated checkout blocked.
- Keep automated Guided/Premium checkout blocked until
  `npm run audit:sales-payment-live` returns 0 fail.

Current Umi note:

- 2026-06-16 current boundary: production public proof is green and Manual
  Review Sales Mode remains sellable, but automated checkout remains blocked by
  missing live Stripe Price IDs for Guided and Premium. Use the school ops daily
  gate first, then the narrower launch/start-day commands only when starting
  active outreach.
- 2026-06-16 lead-capture owner state: Netlify form notifications are not yet
  confirmed in `docs/parent-sales-owner-decisions.json`, but Alan is recorded
  as interim daily submissions owner. Do not assume email delivery; the daily
  owner must check Netlify submissions unless notifications are confirmed.
- 2026-06-11 launch-mode gate is in place. Verified behavior: no operator log
  plus missing permanent owners returns `not_ready`; a sanitized same-day
  operator log returns `manual_sales_go_with_payment_boundary`; automated
  checkout remains blocked by Guided/Premium Stripe price IDs.
- 2026-06-11 `sales:operator-log` now creates the same-day operator log outside
  git and refuses repo paths, reducing the risk of committing parent/payment
  operational notes.
- 2026-06-11 `sales:start-day` now wraps operator-log generation plus
  launch-mode and refuses to start without explicit owner, inbox-check, and
  manual Stripe authorization flags.
- 2026-06-11 Manual Review Sales Mode is now the official v1 sales path: approved
  applications can record a reviewed manual Stripe invoice/payment-link
  reference as an active `Subscription` before account activation. Automated
  checkout remains Phase 2.
- Static sales-launch is 38/38 after adding the admin manual payment
  verification contract check.
- Follow-up verification: `audit:sales-manual-ready -- --operator-log /tmp/...`
  returns 13 pass / 1 warn / 0 fail, and `sales:start-day -- --owner Alan
  --checked yes --manual-stripe-authorized yes` returns
  `manual_sales_go_with_payment_boundary`. The remaining warning is automated
  payment readiness, not a blocker for reviewed manual sales.
- Permanent-owner verification: `audit:sales-owner-decisions` returns 3 pass /
  1 warn / 0 fail, and `sales:launch-mode` without an operator log returns
  `permanent_manual_sales_ready_with_payment_boundary`.
- Public refund policy is now part of the parent payment trust path:
  `/refund-policy` is linked from Pricing, Trust Center, and the admissions
  payment handoff; `audit:sales-launch` gates it.
- Manual payment receipt copy is now part of the admin payment closeout: after
  **Record Manual Payment** succeeds, `/admin/applications` shows a
  GIIS-branded receipt text with plan, amount, Stripe reference, subscription
  record, and refund-policy link. It is guarded by `audit:sales-launch` and the
  parent/admin browser smoke.
- Chinese conversion trust path now has a guard: `/school-profile` receives
  language state and shows a Chinese parent-reading layer for the official
  English School Profile, and `npm run audit:conversion-bilingual` checks
  Trust Center, Pricing, Apply, School Profile, and Refund Policy in Chinese
  mode. Local production-build smoke passed 5/5.
- Student Learn Portal entry now explains the post-sign-in workflow for enrolled
  students, keeps parent sign-in separate, and routes not-yet-activated
  families back to path review / admissions consultation. The unauthenticated
  Learn Dashboard no longer fires student API requests before redirecting to
  sign-in. Local `audit:ops-browser -- --base-url http://localhost:3042` now
  covers `/learn` on desktop/mobile and passes 24/24.
- Frontend deploy freshness is now part of `school:ops-report` through
  `npm run audit:frontend-deploy`. Netlify public metadata now shows production
  deploys ready on branch `main`, connected to
  `https://github.com/alanhdchu154/GIIS-website`, with the published commit
  matching the then-current `origin/main`; GitHub CI is green for the same SHA.
  Asset hashes may differ from a local build, but the deploy freshness audit
  treats the current published commit as the primary signal and leaves asset
  differences as diagnostics. Production behavior gates pass:
  `audit:frontend-deploy` `production_deploy_matches_origin_main`,
  `audit:conversion-bilingual` 7/7, parent journey 7/7, and
  `school:ops-report` has no frontend-deploy warning with the
  manual-sales/payment-boundary verdict. The latest parent-facing AI/software
  boundary, support-by-plan boundary, Admissions/Discovery support wording, and
  mobile trust-path fixes are verified live. Future stale-commit or
  behavior-gate failure should follow `docs/netlify-frontend-deploy-repair.md`;
  never deploy an unreviewed local folder.
- `audit:frontend-deploy` now also checks Netlify site linkage when public
  metadata is available: expected repo
  `https://github.com/alanhdchu154/GIIS-website` and expected branch `main`.
  A repo/branch mismatch is a Netlify auto-deploy integration issue to repair
  before claiming the latest pushed frontend is live.
- Persona audit production API-base verification now accepts the intended
  same-origin `/api` Netlify proxy shape and checks `/api/checkout/tiers` for
  current tier evidence, instead of falsely requiring every production bundle to
  contain `api.genesisideas.school`. Latest public-mode run:
  `RUN_AUTH=0 npm run audit:personas` is 10 pass / 2 intentional auth-skip warn
  / 0 fail.
- Trust Center now has a parent-facing AI/software boundary: tools may help
  organize progress signals, drafts, lesson workflow, and review queues, but
  grades, credits, official records, payment status, and family-facing advisor
  summaries stay human-reviewed. Guarded by `audit:sales-launch` and
  `audit:parent-journey`.
- Support page tier boundary is now aligned with pricing: Self-Paced/all
  reviewed enrollments get Learn Portal access, records, and submitted-work
  feedback; Guided adds monthly advisor planning/review; Premium adds
  higher-touch pathway, writing, project portfolio, and college-readiness
  planning. Do not reintroduce "Included with every plan" language for full
  advisor or college-pathway support.
- Admissions FAQ and Discovery mission copy follow the same support-by-plan
  boundary. Do not describe recurring advisor review as a universal
  every-student/every-semester benefit; say it is added through Guided/Premium
  when the family chooses more human accountability. `/about` leadership cards
  also have a mobile overflow guard through `audit:conversion-bilingual`.
- Homepage and Academics AI/technology copy follow the Trust Center boundary:
  describe software or AI-assisted tools as staff workflow support, not as
  adaptive AI learning, automatic personalization, or guaranteed optimal pace
  for every student. Guarded by `audit:sales-launch` and
  `audit:public-trust-claims`.
- `school:ops-report` now retries the production parent-journey gate once if
  the first fetch fails. This prevents a short Netlify edge/deploy-settling
  miss on `/consultation` from creating a false `not_ready` day, while still
  preserving the failed attempt as `RETRIED_FAIL` and blocking outreach if the
  retry also fails. Latest post-patch run returned
  `manual_sales_go_with_payment_boundary` with parent journey 7/7.
- Visual trust pass: the global masthead is now constrained so the school logo
  remains formal without consuming as much first-viewport space, homepage
  outcome proof uses family-reported wording, and Pricing's Self-Paced
  comparison says `Email admissions access` instead of vague `Email support`.
  Local Playwright screenshots for homepage, pricing, consultation, and learn
  desktop/mobile showed 0 horizontal overflow.
- Start-day ops hardening: `sales:start-day` now runs `school:ops-report`
  before generating the same-day operator log or launch-mode gate, and refuses
  unsafe school-ops verdicts. Generated logs include the school-ops verdict,
  lead-capture dry-run verdict, and a Lead-Capture Delivery Verification
  section so operators keep manually checking Netlify submissions until real
  notification/inbox delivery is confirmed.
- Student course clarity pass: `/learn/:slug` now shows quiz completion and
  assignment submission as separate module-row signals. If a quiz is complete
  but the assignment is missing, students see `Assignment needed` and a
  `Submit work` action instead of a completed-looking row. `audit:ops-browser`
  now guards the mocked `/learn/english-i` course page on desktop and mobile.
- Assignment review clarity pass: `/admin/assignments` now labels grading
  feedback as family-visible and prompts reviewers to include one strength, one
  correction, and one next action before saving feedback that appears to the
  student and parent.
- cc review agreed the remaining checkout blockers require external Stripe /
  Lightsail production action and should stay gated. The GIIS-branded manual
  payment receipt and the first bilingual conversion guard are now handled;
  remaining safe trust tasks are continued roadmap/workload trim and any
  parent/student questions found during live outreach.

Acceptance:

- Public proof path and parent journey remain green on production.
- Same-day owner coverage or permanent owner decisions are present before
  active outreach.
- Manual payment handoff is used only after path review.
- Paid access is recorded in the backend via admin manual payment verification
  before account activation.
- No automated checkout link is sent until payment-live is green.
- Refund policy remains public and linked before payment.

### Foundation Video Daily Monitor

- owner: Umi / Codex
- mode: Split-work with Claude Code
- schedule: one unified Codex heartbeat, `GIIS_影片_pipeline`, attached to the
  `GIIS_影片_producer` chat. It wakes hourly and gates internally: 03:00 /
  08:00 CT produce up to 10 modules/uploads each; 12:00 / 17:00 CT check for
  missed target, run bounded catch-up if needed, and update the dashboard.
- runner: `bash tools/lesson-video/foundation_daily.sh`
- scope: non-AP foundation modules only
- batch size: max 10 modules / 10 uploads per producer run; catch-up stays
  bounded and must not force weak lessons through the gate
- cc guardrails: `FOUNDATION_CC_BUDGET_USD=10` production and
  `FOUNDATION_REVIEW_BUDGET_USD=3` independent review per module

Next action:

- After each scheduled run, review selected modules, cc logs, gate output,
  upload result, website manifest sync, and generated artifact cleanup needs.

Acceptance:

- `foundation_video_gate.py` clean pass / score 100.
- `lesson_release_gate.py --check` ready.
- `approved_ready_to_upload.json` contains only clean approved lessons.
- YouTube upload uses `yt_queue.py upload --gate-ready`.
- Learn Portal manifest sync has no module-title mismatch.

Current Umi note:

- This handoff is intentionally narrow: monitor and repair the unified
  foundation pipeline. Broader parent/admin stability and course-quality priorities
  belong in `ROADMAP.md`.
- 2026-06-16 current daily report: 136 lesson folders, 129 visible/uploaded
  lessons, 4 pending upload, release gate 76 ready / 60 needs_revision / 0
  blocked, manifest alignment 129 lessons / 0 warnings. Let the gated producer
  continue; do not force upload and do not treat older `needs_revision` quality
  debt as an upload emergency.
- 2026-06-09 local storage note: `teaching-videos/` is active on T9 via symlink
  to `/Volumes/T9-Active/Projects/giis-website/teaching-videos`.
  `lesson_release_gate.py` can read the symlinked Biology Module 3 folder.
  Caveat: git tracks files under `teaching-videos/`, so `git status` may show
  mass deletions caused by the symlink. Do not stage or commit those deletions;
  see `/Users/alanhdchu/umi-central/docs/local_storage_layout.md`.
- 2026-06-05 check: the 07:00 CT run uploaded English I Modules 9/10/11, pushed
  the automation commit, and post-run release gate / manifest alignment / build
  checks were green. The next local hygiene issue is generated video review and
  build artifacts, not upload recovery.
- 2026-06-05 hygiene follow-up: `.gitignore` now suppresses clearly
  regenerable review artifacts (`_review_*.json`, contact sheets, learning
  checks, source/style packets, briefs, transcripts). Remaining untracked
  `build_slides.py` files and daily `umi/handoffs/*.md` match historically
  tracked file types. `umi/decisions.md` now records them as durable
  source/evidence to track, not generated noise to ignore.
- 2026-06-06 check: the 07:00 CT run produced/uploaded English I Modules 12/13
  and Biology Module 2, then synced the English I Module 13 manifest. Current
  verification is green: `lesson_release_gate.py --check` evaluated 29 ready /
  0 blocked, manifest alignment returned 0 warnings across 29 lessons, and
  `npm run build` compiled successfully. Remaining hygiene is to keep the new
  `build_slides.py` and dated handoffs tracked as durable source/evidence.
- 2026-06-09 check: Biology Module 3: Cell Membrane & Transport V2 now exists
  as a local foundation-video draft under
  `teaching-videos/biology-module-3-cell-membrane-transport-v2/`, with MP4,
  transcript, contact sheet, reviewer JSON, learning check, source packet, and
  style manifest. Fresh local verification: `lesson_release_gate.py --check`
  returned ready 1 / blocked 0, and `foundation_video_gate.py` returned pass
  with score 100. Do not treat it as externally complete until review approval,
  gated upload / manifest sync if desired, and git hygiene are handled.
- 2026-06-10 check: the 07:00 CT run selected Biology Modules 4/5/6. The
  orchestrator approved Module 6 and marked Modules 4/5 `gate_failed`, but a
  follow-up targeted rerun of `foundation_video_gate.py --render-mp4` passed for
  both Modules 4 and 5 with score 100 and release-ready checks.
- 2026-06-11 check: the 07:00 CT run produced durable handoffs for Biology
  Modules 7/8/9. Fresh verification is green: `lesson_release_gate.py --check`
  evaluated 36 ready / 0 blocked, and manifest alignment returned 0 warnings
  across 36 lessons. Keep these handoffs as durable evidence. Current git
  hygiene risk: 205 tracked `teaching-videos/*` paths still show as deleted
  because the active video tree lives on the T9 symlink; do not stage those
  deletions blindly. If the project intentionally untracks them, do it as a
  reviewed git hygiene change with roadmap/decision evidence.
- New cc work should be written as a bounded handoff in `umi/handoffs/` when it
  needs more than this daily monitor. Include Umi first look, pass type, current
  change set, open questions for cc, review breadth, allowed changes, and
  expected worker report.
- If this file ever disagrees with `/Users/alanhdchu/umi-central/goals.md` on
  schedule or priority, treat central goals as the escalation source and stop
  before running the wrong automation.

Stop conditions:

- cc timeout, no tool progress, or non-zero exit.
- missing MP4, transcript, contact sheet, reviewer artifacts, learning check, or
  style manifest.
- AP / College Board / CEEB / accreditation-sensitive claims.
- any attempt to use `upload_lesson.py --force-without-approval`.

## Paused

- AP-facing lesson production.
- Old batch lesson build/upload jobs.
- System-level GIIS lesson video LaunchAgents.
- Graduated-student record edits outside a formal correction/reissue flow.
