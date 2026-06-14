# Umi Workload

Last updated: 2026-06-11

This file is the current GIIS active Codex / cc worker handoff, not a historical worklog. Older
completed items were removed from the active board; use `ROADMAP.md` for the
durable project lane. Use `umi/reviews/`, reports, or git history when old
evidence is explicitly needed.

## Active Handoff

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

- 2026-06-11 launch-mode gate is in place. Verified behavior: no operator log
  plus missing permanent owners returns `not_ready`; a sanitized same-day
  operator log returns `manual_sales_go_with_payment_boundary`; automated
  checkout remains blocked by Guided/Premium Stripe price IDs and
  `api.genesisideas.school` HTTPS/webhook failures.
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
- cc review agreed the remaining checkout blockers require external Stripe /
  Lightsail production action and should stay gated. It also recommended the
  next safe trust tasks: GIIS-branded manual payment receipt, stronger bilingual
  coverage for conversion pages, and eventual roadmap/workload trim.

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
- schedule: three Codex cron jobs, all weekly-all-days single-time schedules:
  `giis-foundation-video-split-batch-early` at 02:15 CT,
  `giis-foundation-video-split-batch` at 10:15 CT, and
  `giis-foundation-video-split-batch-evening` at 18:15 CT
- runner: `bash tools/lesson-video/foundation_daily.sh`
- scope: non-AP foundation modules only
- batch size: max 7 modules / 7 uploads per run
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

- This handoff is intentionally narrow: monitor and repair the split-batch
  foundation runs. Broader parent/admin stability and course-quality priorities
  belong in `ROADMAP.md`.
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
  both Modules 4 and 5 with score 100 and release-ready checks. Current global
  verification is green: `lesson_release_gate.py --check` evaluated 33 ready /
  0 blocked and manifest alignment returned 0 warnings across 33 lessons. The
  next action is deploy hygiene, not raw video recovery: local `main` is ahead
  of `origin/main` after rebase, with cc hardening commits, T9 video untrack,
  Parent Conversion A-D, and handoff docs. Backend/Prisma/webhook risk now has
  a runbook and one signature-handling blocker fixed; production still needs
  DB/env/Lightsail execution before backend deploy.
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

### cc hardening session 2026-06-10 — reconciled, pending production deploy

- owner: Codex (cc executed; Codex to reconcile + deploy)
- mode: cc-first implementation, Codex-reviewed/rebased locally
- status: local `main` is ahead of `origin/main`, NOT pushed. Pushing `main`
  to GitHub automatically triggers the Netlify frontend deploy, but does not
  deploy/restart the Lightsail backend.
- 2026-06-10 Codex resolution: rebased onto origin, resolved the
  `foundation_daily_orchestrator.py` symlink/manifest conflict, removed tracked
  `teaching-videos/*` artifacts from the git index, restored
  `teaching-videos` as an ignored T9 symlink, committed Parent Conversion A-D,
  and committed daily foundation-video handoff docs. Do not deploy the backend
  stack until the production payment deploy runbook is executed.

Local commits (oldest→newest):

- `aa0e85c2` backend hardening — Stripe webhook fail-closed when
  `STRIPE_WEBHOOK_SECRET` unset in prod; webhook idempotency via new
  `ProcessedStripeEvent` model; CSRF (cookies SameSite none→lax, API is
  same-origin via Netlify proxy); CORS refuses credentialed wildcard in prod;
  rate-limit applications/checkout/verify + auth limiter 60→20; constant-time
  login (dummy bcrypt) for admin/student/parent; shared PrismaClient singleton
  `server/src/lib/prisma.js` (was 19 per-module pools); fix `GET
  /api/students/audit` shadowed by `/:id`; paid-but-unlinked subscription alert
  (system AuditLog row + `/api/subscriptions` `unlinkedPaid` count).
- `1d0aea31` frontend — fix Apply form remount-on-keystroke (only enrollment
  path was unusable); remove dead ImgSlider + Discovery/FacultyGraduates + its
  banned SchoolLogo university logos; shrink seal assets ~5MB; About avatar alt
  + homepage SEO title; admin "Paid · Unlinked" metric/banner.
- `4cce630a` CI — `quality-gates` job (audit:public-trust-claims,
  staged-artifacts, pathways) + non-blocking npm audit; pin Node 20
  (`.nvmrc` + Netlify `NODE_VERSION` + root `engines`).
- `d4e5a70f` **pipeline fix** — `foundation_daily_orchestrator.commit_and_push`
  used to `return 0` for the whole commit when `teaching-videos` is a symlink,
  so `public/data/lessons-manifest.json` (main repo, read by the site) stopped
  syncing → uploaded YouTube videos never appeared on the site. Now the symlink
  branch stages/commits ONLY the manifest by exact path (never the on-T9 lesson
  tree).
- `ae6a7cb9` cruft — remove unreferenced tracked assets ~4MB (`src/img/logo.png`,
  `src/img/Homepage/StuPhoto/`, `public/img/Logo.jpg`).
- `0c943bad` git hygiene — stop tracking `teaching-videos/*`; T9 symlink is
  ignored and website state stays in `public/data/lessons-manifest.json`.
- `e53b176c` parent conversion — consultation, graduate stories, admin-reviewed
  weekly report flow, advisor weekly SOP, and weekly-report backend send guard.
- `38cd767e` docs — track daily foundation-video handoffs.
- `0576b116` docs — update GIIS conflict-resolution status.
- `dae3023a` docs — record post-rebase verification.
- payment deploy readiness — fixed Stripe webhook verification mode so a
  configured signing secret with a missing `stripe-signature` rejects instead
  of parsing unsigned JSON; added
  `docs/production-payment-deploy-runbook.md`,
  `umi/reviews/2026-06-11-payment-deploy-readiness.md`, and deploy/env docs.
- sales-launch readiness — added `npm run audit:sales-launch` and
  `docs/parent-sales-launch-checklist.md` so the frontend proof path and backend
  payment deploy gates stay separate.
- conflict closeout — added `npm run audit:sales-launch` to GitHub CI
  `quality-gates`, updated the CI comment, and classified the local commit
  stack in `docs/parent-sales-launch-checklist.md`.
- admissions sales-ops pass — enriched `/consultation` intake fields, added
  `docs/admissions-consultation-response-sop.md`, and expanded
  `audit:sales-launch` so Netlify field alignment plus the response SOP are
  gated before launch.
- apply-path clarity pass — `/apply` now explains new-student vs transfer
  records before submission, says admissions reviews within one business day,
  links to consultation fallback, and keeps no-payment-before-review visible.
  Browser smoke now covers `/apply` on desktop and mobile.
- production-proof smoke pass — added `npm run audit:sales-live` for the
  frontend-only deploy check. It validates `/`, `/consultation`, `/apply`,
  `/pricing`, `/trust-center`, `/graduates`, `/parent/demo`, and
  `/assessment-proof` against a provided base URL.
- homepage sales hardening — changed the homepage hero to lead with free
  consultation, added no-payment-before-review copy, linked Trust Center from
  the first viewport, and expanded the local sales gates to catch homepage
  regressions before deploy.
- consultation form reliability — `/consultation` now treats Netlify submit
  failures as errors instead of showing the success state, exposes submitting
  and retry/error states, and `audit:ops-browser` includes a desktop/mobile
  consultation submit success flow.
- homepage contact form reliability — the footer inquiry form now has the same
  success-only-on-OK behavior, the hidden Netlify contact form includes the
  `pathway` field, and `audit:ops-browser` includes a desktop/mobile contact
  submit success flow.
- apply submit reliability — `/apply` now handles non-JSON API failures safely,
  and `audit:ops-browser` includes a desktop/mobile transfer application submit
  success flow against the mocked `/api/applications` endpoint.
- parent sales outreach packet — `docs/parent-sales-outreach-packet.md` gives
  admissions conservative first-message, WeChat, consultation call, follow-up,
  recordkeeping, and same-day stop-condition scripts. `audit:sales-launch` now
  gates the packet so active outreach cannot drift into payment pressure,
  guaranteed outcomes, or unowned lead capture.
- daily operator checklist — `docs/parent-sales-daily-operator-checklist.md`
  and `docs/templates/parent-sales-daily-operator-log.md` give same-day coverage
  rules for lead capture, first response, WeChat, principal escalation, manual
  Stripe ownership, end-of-day closeout, and stop conditions. `audit:sales-launch`
  gates both files; `audit:sales-manual-ready -- --operator-log /path/to/log.md`
  can validate a filled same-day operator log without committing sensitive lead
  data. Sanitized `/tmp` operator-log smoke returned 13 pass / 1 warn / 0 fail;
  the remaining warning is automated payment readiness.

Codex next actions (do in order):

1. Decide frontend-only vs full backend deploy. Current Umi recommendation:
   frontend-only Netlify first, then backend payment/access in a separate
   Lightsail window.
2. **Before frontend-only deploy**: configure the Netlify `consultation` and
   `contact` form notifications to `admissions@genesisideas.school`, then test
   one submit for each form after deploy.
3. Assign consultation response ownership: first response, WeChat follow-up,
   and principal escalation for red-flag requests.
4. Use `docs/parent-sales-outreach-packet.md` on outreach days, after
   `npm run audit:sales-manual-ready` returns 0 fail or warnings are explicitly
   covered by same-day owner assignments.
5. **After frontend-only deploy**: run
   `npm run audit:sales-live -- --base-url https://genesisideas.school` and
   treat 8/8 pass as the public proof-path acceptance gate.
6. **Before backend deploy**: follow
   `docs/production-payment-deploy-runbook.md`: production DB backup,
   `npm run db:push`, `ProcessedStripeEvent` table verification, explicit
   `STRIPE_WEBHOOK_SECRET` and `CORS_ORIGIN`, no
   `ALLOW_UNVERIFIED_STRIPE_WEBHOOK=1`, Lightsail restart, Stripe webhook smoke.

Still open / not done (cc deliberately did not):

- checkout/auth route tests (need supertest + DB/mock).
- CRA→Vite migration (large; changes build chain, `REACT_APP_`→`import.meta.env`,
  index.html, Netlify) — schedule as its own scoped task.
- Local-only regenerable dirs awaiting owner OK to clear: `demo-output/` (135M,
  `npm run make-demo`), `server/tmp/` (25M graduation PDFs).

Verification at handoff: `npm run build` green, server Jest green,
`prisma validate` green, all touched files `node --check`/`py_compile` clean.
Codex post-rebase verification before payment-readiness patch: full server Jest
36/36 pass,
`audit:public-trust-claims` 41 files pass, production build passes with
`BUILD_PATH=/tmp/giis-build-final`, and expanded parent/admin browser smoke
passes 14/0 across `/consultation`, `/graduates`, `/parent/dashboard`,
`/admin`, `/admin/applications`, `/admin/assignments`, and
`/admin/weekly-report`. Payment deploy readiness verification on 2026-06-11:
full server Jest 40/40, `npx prisma validate`, `audit:public-trust-claims` 41
files pass, production build passes with
`BUILD_PATH=/tmp/giis-build-payment-ready`, and expanded ops-browser smoke
passes 14/0. Conflict closeout verification on 2026-06-11 is green:
`npm run audit:sales-launch`, `npm run audit:public-trust-claims`,
`npm run audit:staged-artifacts`, `npm run audit:pathways`,
`CI=true npm test -- --watchAll=false`,
`CI=true BUILD_PATH=/tmp/giis-build-conflict-check npm run build`, and
`git diff --check`.
Apply/sales readiness verification on 2026-06-11 is green:
`npm run audit:sales-launch` 27/27, `npm run audit:public-trust-claims`,
`CI=true npm test -- --watchAll=false`,
`CI=true BUILD_PATH=/tmp/giis-build-apply-submit npm run build`, and
`npm run audit:ops-browser -- --base-url http://localhost:3030` 22/0 against
the static production build, including consultation, contact, and apply form
submit success on desktop/mobile.
Production-proof smoke verification on 2026-06-11 is green locally:
`CI=true BUILD_PATH=/tmp/giis-build-homepage-sales npm run build` and
`npm run audit:sales-live -- --base-url http://localhost:3030` 8/8.
Production public proof path is also green: after pushing `f984e651` to GitHub
`origin/main` and letting Netlify deploy on 2026-06-11,
`npm run audit:sales-live -- --base-url https://genesisideas.school` returned
8/8. Evidence: `_audit/parent-sales-live-production-smoke.md`. Remaining
lead-capture ops: configure Netlify `consultation` and `contact` form
notifications to `admissions@genesisideas.school`, or assign a daily owner to
check Netlify submissions manually.
Payment automation is not ready: `npm run audit:sales-payment-live` currently
returns 2 pass / 1 warn / 4 fail because Guided `$149/month` and Premium
`$299/month` have no production Stripe price IDs, Self-Paced annual has no
price ID, `https://api.genesisideas.school/health` is unreachable, and the
Stripe webhook endpoint is not reachable over HTTPS. Evidence:
`_audit/parent-sales-payment-live.md`.
Manual sellable path added: `docs/admissions-payment-handoff-runbook.md`
defines the conservative fallback for selling through consultation/path review:
manual Stripe Dashboard invoice/payment link only after path review, receipt and
Stripe IDs recorded outside git, and portal activation after fit plus payment
are both clear. `npm run audit:sales-launch` now gates the handoff doc.
Manual-sales readiness gate added and aligned to Manual Review Sales Mode:
`npm run audit:sales-manual-ready -- --operator-log /path/to/operator-log.md`
currently returns 13 pass / 1 warn / 0 fail in production with verdict
`manual_sales_ready_with_recorded_warnings`. The remaining warning is automated
payment readiness. This is sufficient for consultation/path-review selling when
Alan or a same-day operator consciously covers lead capture, first response,
WeChat follow-up, and manual Stripe handoff for the day.
cc review notes: a bounded `claude -p` review-only pass was attempted for the
admissions sales-ops diff on 2026-06-11, but it produced no output and was
stopped. A second bounded review-only pass for
`audit_parent_sales_payment_live.js`, the payment runbook, launch checklist,
roadmap, and workload was attempted from `/Users/alanhdchu/giis-website`
on 2026-06-11 with default Claude CLI model; it produced no output after about
80 seconds, was killed, and changed no files. Treat both as cc timeouts, not
approval.

### Parent-conversion Phases A–D 2026-06-10 — frontend live, backend gated

- owner: cc-cowork (executed with Alan live approval); Codex to review diff
- status: frontend proof surfaces were pushed and deployed through Netlify in
  `f984e651` / `5bfb9cdf`; production public proof smoke is 8/8. Backend
  weekly-report/payment pieces are not accepted as live until the Lightsail
  runbook and payment-live gate pass.
- scope: see `ROADMAP.md` lane 6 status block. Files: new
  `src/components/pages/Consultation/ConsultationPage.js`,
  `src/components/pages/Graduates/GraduateStoriesPage.js`,
  `src/components/pages/Admin/AdminWeeklyReportPage.js`; edited `src/App.js`,
  `public/index.html` (new Netlify `consultation` form),
  `src/i18n/siteStrings.js`, `PricingPage.js`, `TrustCenterPage.js`,
  `AdmissionMain.js`, `SuccessStories.js` (initial+surname names),
  `AdminDashboard.js`, `AdminProgressPage.js`,
  `server/src/lib/weeklyReportService.js`, `server/src/lib/mailer.js`,
  `server/src/routes/weekly-report.js`.
- Alan decisions on record: consultation = in-site form to admissions inbox;
  principal = sole face; graduate names = initial + surname (real data);
  weekly report = admin review before send.
- verification: production public proof smoke is 8/8; static sales launch audit
  is 27/27 before the one-command same-day gate and 28/28 after it lands;
  public trust claims audit is 41/41. Outreach-day readiness should use
  `npm run sales:ready-today -- --operator-log /path/to/operator-log.md`, which
  should return `manual_sales_go_with_payment_boundary` until automated payment
  is fixed. New buyer-readiness check: `npm run audit:parent-journey` validates
  whether the parent path answers status, learning, parent visibility, pricing,
  applicant requirements, and contact questions; local production build and
  production site are both 7/7 after making the Apply page's transfer-record
  requirement visible before interaction. New permanent owner-decision gate:
  `npm run audit:sales-owner-decisions` currently returns 0 pass / 1 warn / 3
  fail with verdict `alan_review_required_for_permanent_sales_owners`; this is
  the Alan review list for lead capture, response/WeChat, and manual Stripe
  ownership. Outstanding: Netlify form notification config or permanent daily
  submissions owner; `npm run audit:sales-payment-live` is still blocked by
  missing Guided/Premium Stripe price IDs and direct API health/webhook
  reachability. Read-only Lightsail check found local API health green on
  `127.0.0.1:4000`, but nginx proxies to `127.0.0.1:8080` and has no active
  `443` listener for `api.genesisideas.school`; repair is documented in
  `docs/production-api-proxy-repair.md` and checked by `npm run
  audit:production-api-proxy` (current result: 7 pass / 0 warn / 5 fail).
  Production env/DB preflight is now `npm run audit:production-payment-env`
  (current result: 15 pass / 5 warn / 3 fail: missing Guided/Premium price IDs,
  localhost production DB warning, and missing `ProcessedStripeEvent`). Backend
  weekly-report/payment deploy requires the Lightsail runbook.
- Codex review fix: `server/src/routes/weekly-report.js` now rejects
  non-dry-run sends unless a non-empty selected `studentIds` list is provided,
  and `force` requires an explicit `confirmForce: "resend_this_week"` guard.
  Added `server/src/routes/weekly-report.test.js`; targeted Jest passes.

## Paused

- AP-facing lesson production.
- Old batch lesson build/upload jobs.
- System-level GIIS lesson video LaunchAgents.
- Graduated-student record edits outside a formal correction/reissue flow.
