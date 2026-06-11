# GIIS Website Roadmap

Last updated: 2026-06-11

This file is the current execution roadmap. Historical slot logs were removed
from the active repo state so daily work starts from current priorities instead
of a long completed-task scroll.

## Current Priority

Keep the school trustworthy, operational, and parent-visible while the
foundation-video pipeline stabilizes. The next phase is proof over volume:
parents should see a serious school, a working dashboard, and course/video
quality that feels intentionally designed.

Current 2026-06-11 risk: the public parent proof path is live on Netlify and
passes production smoke, but automated payment launch is not ready yet. Guided
and Premium are visible in pricing but their production Stripe price IDs are
missing, and `https://api.genesisideas.school` is not reachable for direct
health/webhook checks. Backend hardening includes a Prisma schema change, so
backend deploy must be paired with a production DB backup, `db:push` / table
verification, Stripe webhook env checks, and Lightsail restart/smoke. Pushing
local `main` to GitHub `origin/main` automatically triggers the Netlify frontend
deploy for `genesisideas.school`; it does not deploy/restart the Lightsail
backend.

Current sellable state: GIIS can start consultation-first outreach and
transfer/new-student path reviews using the public proof path, response SOP,
outreach packet, daily operator checklist, and manual payment handoff. This is
not the same as fully automated checkout. Outreach days should run
`npm run audit:sales-manual-ready`; unresolved owner warnings must be covered by
a same-day operator log outside git using `--operator-log`. Automated
Guided/Premium checkout stays blocked until
`npm run audit:sales-payment-live` returns 0 fail.

## Active Lanes

### 1. Foundation Video Daily Pipeline

Status: active, Codex-managed, foundation-only.

- Scheduler: `~/.codex/automations/giis-foundation-video-daily/automation.toml`
- Time: 07:00 CT daily.
- Repo runner: `bash tools/lesson-video/foundation_daily.sh`
- Scope: non-AP foundation modules only.
- Max upload volume: 4/day.
- Upload rule: only `yt_queue.py upload --gate-ready`; never
  `upload_lesson.py --force-without-approval`.
- Required gate: clean pass, score 100, MP4, transcript, contact sheet,
  reviewers, learning check, style manifest, and
  `approved_ready_to_upload.json`.

Next check:

- After each 07:00 run, review selected modules, cc progress, gate result,
  upload result, website manifest sync, and any `cc_blocked` report.
- Before any push/deploy, finish browser/predeploy smoke, review the backend
  hardening and Prisma/webhook changes, and separate safe frontend/pipeline
  changes from Lightsail/db work if needed.
- Monitor two consecutive 07:00 CT runs before expanding beyond the current
  foundation cohort. Do not increase volume until cc output, release gate,
  YouTube upload, and Learn Portal manifest sync all pass without manual rescue.
- 2026-06-10 current lane: Biology Modules 4/5/6 were selected. M6 was approved
  by automation; M4/M5 failed the orchestrator gate initially but passed targeted
  `foundation_video_gate.py --render-mp4` reruns with score 100. Current checks
  report release gate 33 ready / 0 blocked and manifest alignment 0 warnings
  across 33 lessons. The remaining risk is no longer raw video recovery or
  branch divergence; it is safe review of the pending cc hardening stack before
  push/backend deploy.
- 2026-06-11 current lane: Biology Modules 7/8/9 have dated durable handoffs.
  Current checks report release gate 36 ready / 0 blocked and manifest alignment
  0 warnings across 36 lessons. Foundation video is green; the active blocker is
  sales/payment owner readiness and backend/API/payment deploy readiness, not
  lesson-video recovery.

### 2. Course And Resource Quality

Status: active watch.

- Course source of truth: `server/prisma/courses/**/*.json`.
- Keep required student resources free/usable.
- Broken YouTube links and hard-blocking external resources should stay out of
  required module flow.
- Khan Academy may remain as a free nonprofit external resource, but it should
  not be the only required learning path when a student could get blocked.

Current evidence:

- `npm run audit:pathways`: 93 pass / 0 warn / 0 fail.
- `node tools/pathway-quality/audit_assessment_parent_trust.js --json`: 93
  pass / 0 warn / 0 fail.
- `npm run audit:showcase-all`: 93 pass / 0 warn / 0 fail. This gate covers
  all 93 course JSON files for free/usable required resource URLs, removed or
  login-gated placeholder residue, known bad resource IDs, subject-domain
  resource mismatches, substantial reviewable assignment evidence, and
  quiz/midterm/final structure. Report:
  `_audit/all-course-showcase-readiness.md`.
- `node tools/pathway-quality/audit_all_course_showcase_readiness.js --check-urls --check-youtube --report _audit/all-course-showcase-readiness.md`:
  93 pass / 0 warn / 0 fail; 1,398 non-YouTube resource URLs checked / 0 bad;
  282 YouTube oEmbed checks / 0 bad.
- `npm run audit:showcase-browser -- --base-url http://localhost:3030 --all-modules --report _audit/all-course-browser-smoke.md --json-report _audit/all-course-browser-smoke.json`:
  2,358 pass / 0 fail across all 93 courses, checking course overview,
  syllabus, and every module route on desktop and mobile.
- `node tools/pathway-quality/audit_proofpoint_courses.js --check-urls --report _audit/proofpoint-course-qa.md`:
  8 proof-point courses pass / 0 warn / 0 fail; 220 non-YouTube URLs checked /
  0 bad; 32 YouTube resources skipped by direct URL smoke.
- `npm run audit:parent-assessment-packet`: 8 proof-point courses pass / 0
  fail. This generates `_audit/parent-assessment-sample-packet.md` and
  `_audit/parent-assessment-sample-packet.json` with parent-facing samples for
  assignment evidence, quiz, midterm, final, grading story, and rubric focus.
- `npm run audit:assessment-polish`: 93 pass / 0 fail after the 2026-06-04
  iterative polish pass. The first run found 1,737 full-corpus polish issues
  across question context, multiple-choice explanations, and short-answer
  scoring guidance; `npm run repair:assessment-polish` then strengthened 1,835
  assessment fields across 91 course files. A follow-up iteration corrected the
  repair rule so exact-match fill answers remain exact, cleaned 141 affected
  fields, rendered `fill` items in the exam UI, removed duplicate punctuation
  after quoted answers, replaced 1,285 old generic MC explanation tails plus 97
  remaining placeholder course-concept explanations, and the final audit
  returned 0 issues across all 7,224 questions.
- Student feedback completion pass completed 2026-06-01: module switching,
  English I resource gaps, same-grade recommendations, module motivation,
  manual completion controls, quiz review guidance, parent pacing, demo
  upcoming-date coherence, and Weekly Insights are all covered. Completion
  evidence is recorded in
  `umi/reviews/2026-06-01-student-feedback-completion-audit.md`.
- Proof-point course QA started 2026-06-01: `npm run audit:proofpoints`
  now gates the first 8 family-facing showcase courses (`algebra-i`,
  `geometry`, `english-i`, `english-ii`, `biology`, `chemistry`,
  `us-history`, `government`). Current result is 8 pass / 0 warn / 0 fail,
  with a saved report at `_audit/proofpoint-course-qa.md`. The gate checks
  stronger display criteria than `audit:pathways`: reading/video/practice URLs
  and notes, no blocked-resource residue, substantial reviewable assignment
  evidence, quiz/exam structure, and optional non-YouTube URL smoke.
- Browser and YouTube proof-point QA continued 2026-06-01: local Learn
  walkthrough covered course/module-1/syllabus routes for the first 8 courses;
  a focused re-check verified repaired English II, Geometry, and Chemistry
  resource mismatches in the actual UI. Separate YouTube oEmbed spot-check
  covered 32 / 32 current YouTube resources with 0 bad. Evidence is recorded in
  `umi/reviews/2026-06-01-proofpoint-browser-youtube-audit.md`.
- Desktop/mobile visual QA completed 2026-06-01 for the same first 8
  proof-point courses: 50 route checks / 0 blockers across dashboard,
  course, module-1, and syllabus surfaces at 1280 x 900 and 390 x 844.
  Screenshots and metrics are saved under `_audit/proofpoint-visual-qa/`.
- All-course showcase readiness pass completed 2026-06-01: 46 removed or empty
  reading placeholders were replaced with open resources, 59 thin assignments
  were expanded into reviewable student evidence artifacts, one mismatched
  Business Ethics environmental resource was corrected, and the four newly
  introduced shared resource URLs live-smoked with HTTP 200 responses.
- All-course high-quality pass completed 2026-06-02: the all-course gate now
  supports full live URL and YouTube checks, all 93 courses passed the live
  resource audit, all 2,358 all-module browser smoke route checks passed, and a
  React key warning in `CoursePage` was repaired so course overview pages render
  cleanly under JSON-backed test data.
- Student-blocking resource cleanup completed 2026-06-02: one unstable
  Merriam-Webster required reading link was replaced with a Khan Academy
  vocabulary-in-context lesson, and the repeated Purdue OWL generic exercises
  entry was replaced with a more specific Purdue grammar exercises page.
- Parent assessment proof packet completed 2026-06-04: the first 8
  proof-point courses now have a generated parent/advisor packet showing one
  reviewable assignment sample, quiz sample, midterm sample, final sample,
  parent value statement, and rubric language per course.
- Public assessment proof preview added at `/assessment-proof` on 2026-06-04,
  backed by `public/data/parent-assessment-proof.json` generated from the same
  8-course packet. This gives families concrete assignment, quiz, midterm,
  final, and rubric samples before applying.
- Full assessment polish iteration completed 2026-06-04: all 93 courses were
  scanned without sampling, thin multiple-choice explanations were expanded,
  under-contextualized prompts were given course/module context, and short
  response keys now include clearer scoring expectations where needed. A cc
  follow-up review found exact-match fill-answer punctuation, non-rendered
  `fill` exam items, and formulaic MC explanations; those blockers are now
  covered by `npm run audit:assessment-polish` and the Learn exam UI renders
  both `short` and `fill` text-answer items.
- Completed assessment/resource history is archived in
  `umi/reviews/2026-06-01-course-resource-assessment-summary.md`.

Next check:

- Run resource/link audit before producing videos for a course cohort; treat
  YouTube automation 429s as a separate manual/browser spot-check lane.
- First proof-point cohort is ready for a local/staged parent demo, and all 93
  courses now clear static, live-resource, and browser route gates. Continue
  with targeted screenshot-level visual QA for future parent-visible cohorts
  and do a small live YouTube playback spot-check immediately before any demo
  that depends on external YouTube navigation.

### 3. Admin / Parent Runtime Stability

Status: active watch.

- Parent dashboard and admin queues are trust-critical runtime surfaces. A
  broken parent dashboard damages transparency even if course data is correct.
- Recent stability work fixed unstable session getter / repeated fetch patterns
  in parent and admin surfaces. Keep this as an explicit lane so regressions do
  not hide as one-off bugs.
- `src/api/authStorage.test.js` now locks stable session getter references for
  admin, parent, and student sessions.
- `npm run audit:ops-browser` now smokes `/consultation`, `/graduates`,
  `/apply`, `/parent/dashboard`, `/admin`, `/admin/applications`,
  `/admin/assignments`, and `/admin/weekly-report` on desktop and mobile with
  mocked API responses and repeated-fetch caps. Latest local result: 16 pass /
  0 fail, saved in `_audit/parent-admin-browser-smoke.md`.
- Production backend deployment and verification remain separate from frontend
  deploys. Do not claim graduated-student record freeze or admin workflow locks
  are live until backend deploy and production smoke evidence exist.
- cc hardening session on 2026-06-10 adds important backend safety work locally:
  Stripe webhook fail-closed behavior, webhook idempotency via
  `ProcessedStripeEvent`, stricter CORS/CSRF/rate-limit behavior, constant-time
  auth checks, PrismaClient singleton use, audit-route ordering, and paid-but
  unlinked subscription visibility. Codex review on 2026-06-11 found and fixed
  a webhook signature blocker: a configured `STRIPE_WEBHOOK_SECRET` with missing
  `stripe-signature` now rejects instead of falling back to unverified JSON.
  This is still **not production accepted yet** because the Prisma schema/table
  must be deployed safely before live webhooks use the new code.

Next check:

- Keep `npm run audit:ops-browser` in the parent-facing predeploy checklist.
- Verify the backend deploy path for graduated-student archive/freeze behavior
  before treating that policy as enforced in production.
- Before accepting the cc backend hardening stack: complete the production
  sequence in `docs/production-payment-deploy-runbook.md`: DB backup, explicit
  Stripe/CORS env, `npm run db:push`, `ProcessedStripeEvent` table verification,
  Lightsail restart, health/checkout/admin/Stripe webhook smoke.

### 4. Parent Trust / Admissions / Student Care

Status: maintain.

- Keep public-facing claims conservative around AP, CEEB, Common App,
  accreditation, school code, and college outcomes.
- Trust Center added at `/trust-center` on 2026-06-04, with homepage,
  pricing, and nav entry points routing parents to conservative proof around
  legal status, records, course transparency, parent visibility, and student
  outcomes. Browser smoke for `/trust-center`, `/`, and `/pricing` passed on
  desktop and mobile: `_audit/trust-center-smoke.md`.
- Transfer-family buyer journey implemented on 2026-06-04: Trust Center,
  Admission, Transfer Students, Pricing, Apply, Parent Demo, Welcome, and Learn
  Portal now route families through path review before payment and first-week
  student/parent expectations after enrollment. Browser smoke:
  `_audit/transfer-buyer-journey-smoke.md`; application payload smoke:
  `_audit/transfer-application-payload-smoke.md`.
- Assessment proof preview is now linked from Trust Center, Pricing, and the
  For Parents menu so parents can inspect course evidence without logging in.
- Public Lesson Library added at `/lessons` on 2026-06-04: a browsable,
  click-to-play library of every uploaded foundation lesson, reading the same
  `public/data/lessons-manifest.json` as the Learn Portal with counts computed
  live from the manifest (currently 23 lessons / 3 courses, growing with the
  daily pipeline). Foundation (non-AP) framing only; bottom CTA leads with
  Apply. Linked from the homepage `LessonPreview` and the nav/footer Academics
  group.
- Nav/footer conversion + IA pass on 2026-06-04: added a primary gold "Apply"
  CTA on desktop and mobile and demoted Log In to a secondary link; renamed the
  "Resources" menu to "For Parents" and consolidated the scattered trust
  surfaces (Trust Center, Lesson Library, Assessment Proof, Parent Dashboard
  Preview) under it; the mobile menu is now a grouped accordion sharing one
  `siteStrings` source with desktop; the footer was regrouped to match
  (For Parents + School & Admission columns). De-duplicated Trust Center.
  Verified with a local production build plus desktop/mobile screenshots.
- Dev billing safety on 2026-06-04: `.env.development` now uses the Stripe
  `pk_test` key so local checkout never hits live billing. Note: only
  `.env.development` is committed, so the production/CI build must inject
  `REACT_APP_STRIPE_PUBLISHABLE_KEY` (pk_live) from the deploy environment —
  verify this before relying on live checkout.
- Public trust claim cleanup completed 2026-06-04 with cc collaboration:
  homepage, footer, academics, discovery, pathways, school profile, handbook,
  and public meta copy now avoid high-risk "top university", admissions
  advantage, AP authorization, AP Classroom, and stale lesson-preview claims.
  New gate: `npm run audit:public-trust-claims` checks the public trust claim
  surface, and homepage `LessonPreview` now reads approved video data from
  `public/data/lessons-manifest.json` instead of a hardcoded YouTube ID.
- Student Coordination System Phase 0-3 is implemented locally; production
  deploy should still be treated as a separate deployment decision.
- Parent results-loop verified end-to-end on 2026-06-05: a temporary marked
  test student exercised the real `/api/parent/me` path (not the
  `/parent/demo` mock) against the local DB. Real `ModuleProgress` drove the
  weekly insights (2 modules completed / 7.5 study hours / pacing on-track),
  an assigned advisor + next check-in showed, a `parent_safe` advisor note
  rendered, and the matching internal note was correctly withheld (privacy
  boundary intact). The production backend is confirmed live
  (`/api/parent/me` returns 401, `/api/courses` returns 200). The test
  student was deleted and verified gone; no test data or scripts were
  committed. Conclusion: the retention/care loop is real, deployed software —
  the remaining gap is operational data, not functionality. Seeds currently
  populate 0 `ModuleProgress` / `StudentCareLog` / `StudentCareState`, so a
  real (graduated) student's dashboard shows transcript/credits but empty
  weekly activity and no advisor note until actively-enrolled students
  generate progress and advisors write parent-safe notes via
  `AdminProgressPage`.
- Parent-safe reassurance layer added to public/demo surfaces on 2026-06-04:
  Parent Demo, Welcome, Pricing, and Trust Center now show the Phase 5
  expectation for weekly parent summaries, advisor-approved notes,
  missing-work risk flags, next actions, and the privacy boundary that internal
  advisor notes stay staff-only. This is public copy/demo positioning only, not
  a backend schema or production care workflow deployment.
- Official records policy remains: graduated-student records are frozen unless a
  formal correction/reissue path is approved.

Next check:

- Before any production deploy, run the normal build/audit/smoke checklist and
  verify the public copy does not overclaim.

### 5. cc Hardening / Git Hygiene

Status: reconciled locally; pending production deploy execution.

- Local `main` was rebased onto `origin/main` on 2026-06-10 and remains ahead of
  `origin/main`. Do not push blindly because the stack still contains backend
  runtime/payment changes.
- Useful local commits include backend security/payment hardening, Apply form
  stability, admin subscription alerting, CI quality gates / Node 20 pinning,
  a symlink-aware lesson manifest sync fix, unreferenced image cleanup,
  `teaching-videos/` untracking for the T9 mount, Parent Conversion A-D, and
  foundation-video handoff docs.
- The symlink-aware manifest fix is important because `teaching-videos/` may be
  mounted on T9 while `public/data/lessons-manifest.json` must still be staged
  and committed in the repo for the website to update.
- The T9 `teaching-videos/` storage move is now resolved in source control:
  tracked `teaching-videos/*` files were removed from the git index, the local
  path is restored as an ignored symlink, and website-facing video state remains
  in `public/data/lessons-manifest.json`.
- 2026-06-11 payment deploy review added
  `docs/production-payment-deploy-runbook.md`, updated
  `server/DEPLOY-LIGHTSAIL.md`, expanded `server/.env.example`, and fixed the
  Stripe webhook verification mode so unsigned events are rejected whenever a
  signing secret is configured. Evidence:
  `umi/reviews/2026-06-11-payment-deploy-readiness.md`.
- 2026-06-11 sales-launch readiness added `npm run audit:sales-launch`
  and `docs/parent-sales-launch-checklist.md`. The recommendation
  is a two-step launch: frontend proof path first, then backend payment/access
  deploy in a controlled Lightsail window.
- 2026-06-11 conflict closeout added `npm run audit:sales-launch` to the GitHub
  `quality-gates` job and classified the local commit stack in
  `docs/parent-sales-launch-checklist.md` so frontend proof deploy and backend
  Lightsail rollout stay operationally separate.
- 2026-06-11 admissions sales-ops pass added richer `/consultation` intake
  fields (`studentSituation`, `transcriptAvailable`, `desiredStart`) plus
  `docs/admissions-consultation-response-sop.md`. `npm run audit:sales-launch`
  now gates the SOP and Netlify hidden-form field alignment.
- 2026-06-11 apply-path clarity pass added a pre-submit expectation panel on
  `/apply`: new-student vs transfer-student records, one-business-day
  admissions review, consultation fallback, and no payment before plan review.
  Browser smoke now includes `/apply` on desktop and mobile.
- 2026-06-11 homepage sales hardening changed the hero CTA to consultation
  first, added no-payment-before-review copy, linked Trust Center from the first
  viewport, and expanded the static sales-launch gate so homepage regressions
  fail CI.
- 2026-06-11 consultation form reliability pass changed `/consultation` so a
  failed Netlify submit no longer displays the success state. The form now has
  submitting, success, and retry/error states, and `npm run audit:ops-browser`
  fills and submits the consultation form on desktop/mobile with a mocked
  successful Netlify response.
- 2026-06-11 homepage contact form reliability pass applied the same lead
  capture safety to the footer inquiry form, added the missing Netlify hidden
  `pathway` field, and expanded `npm run audit:ops-browser` to submit the
  contact form on desktop/mobile.
- 2026-06-11 apply submit reliability pass now parses non-JSON API failures
  safely and expands `npm run audit:ops-browser` to submit a transfer
  application review on desktop/mobile against the mocked `/api/applications`
  endpoint.
- Apply/sales readiness verification is green: `npm run audit:sales-launch`
  27/27, `npm run audit:public-trust-claims`,
  `CI=true npm test -- --watchAll=false`,
  `CI=true BUILD_PATH=/tmp/giis-build-apply-submit npm run build`, and
  `npm run audit:ops-browser -- --base-url http://localhost:3030` 22/0 against
  the static production build, including consultation, contact, and apply form
  submit success.
- 2026-06-11 production-proof smoke added `npm run audit:sales-live`, which
  checks the public parent proof path (`/`, `/consultation`, `/apply`,
  `/pricing`, `/trust-center`, `/graduates`, `/parent/demo`,
  `/assessment-proof`) against a provided base URL. Local proof against the
  static production build passed 8/8 with
  `npm run audit:sales-live -- --base-url http://localhost:3030`; report:
  `_audit/parent-sales-live-smoke.md`.
- Production public proof path is live: on 2026-06-11, after pushing
  `f984e651` to GitHub `origin/main` and letting Netlify deploy,
  `npm run audit:sales-live -- --base-url https://genesisideas.school` returned
  8 pass / 0 fail for `/`, `/consultation`, `/apply`, `/pricing`,
  `/trust-center`, `/graduates`, `/parent/demo`, and `/assessment-proof`.
  Evidence: `_audit/parent-sales-live-production-smoke.md`.
- 2026-06-11 payment-launch live gate added `npm run audit:sales-payment-live`.
  Current production result is 2 pass / 1 warn / 4 fail: Self-Paced monthly is
  configured, but Guided `$149/month` and Premium `$299/month` have no
  production Stripe price IDs, Self-Paced annual has no price ID, direct
  `https://api.genesisideas.school/health` is unreachable, and the Stripe
  webhook endpoint is not reachable over HTTPS. Evidence:
  `_audit/parent-sales-payment-live.md`.
- 2026-06-11 manual admissions payment handoff added
  `docs/admissions-payment-handoff-runbook.md` and a sales-launch gate check.
  This lets GIIS start selling through consultation/path review while keeping
  automated Guided/Premium checkout blocked until the payment-live gate passes.
- 2026-06-11 parent sales outreach packet added
  `docs/parent-sales-outreach-packet.md` and a sales-launch gate check. It gives
  admissions conservative first-message, WeChat, consultation call, follow-up,
  recordkeeping, and same-day stop-condition scripts for outreach days.
- 2026-06-11 daily operator checklist added
  `docs/parent-sales-daily-operator-checklist.md` plus
  `docs/templates/parent-sales-daily-operator-log.md`. `audit:sales-launch`
  gates both, and `audit:sales-manual-ready -- --operator-log /path/to/log.md`
  can validate same-day lead-capture, response, WeChat, and Alan-authorized
  manual Stripe coverage without committing sensitive lead data. Sanitized
  operator-log smoke returned 13 pass / 1 warn / 0 fail; the remaining warning
  is automated payment readiness.
- 2026-06-11 manual-sales readiness gate added
  `npm run audit:sales-manual-ready`. Current production result is 9 pass / 4
  warn / 0 fail with verdict `manual_sales_ready_with_recorded_warnings`: public
  proof path, Netlify form markup, admissions email fallback, SOP, and handoff
  docs pass; warnings remain for missing lead-capture owner, missing manual
  Stripe owner, missing response/WeChat owners, and blocked payment automation.
  The embedded production proof smoke now retries once to reduce false-red
  failures from short Netlify edge stale windows. Evidence:
  `_audit/parent-sales-manual-ready.md`.
- Local verification after the payment-readiness patch is green: server Jest
  40/40, `npx prisma validate`, `npm run audit:public-trust-claims`, production
  build with `BUILD_PATH=/tmp/giis-build-payment-ready`, and expanded
  `npm run audit:ops-browser` 14 pass / 0 fail.
- Conflict closeout verification is also green: `npm run audit:sales-launch`,
  `npm run audit:public-trust-claims`, `npm run audit:staged-artifacts`,
  `npm run audit:pathways`, `CI=true npm test -- --watchAll=false`,
  `CI=true BUILD_PATH=/tmp/giis-build-conflict-check npm run build`, and
  `git diff --check`.

Next check:

- Keep the expanded browser/predeploy smoke green for the new parent-conversion
  routes and normal ops surfaces.
- Execute the production payment deploy runbook before production backend deploy.
- Configure Netlify `consultation` and `contact` form notifications to
  `admissions@genesisideas.school`, or assign a daily manual Netlify submissions
  check before relying on inbound leads.
- Treat the 8/8 production sales-live smoke as proof of the public parent proof
  path only; backend payment/webhook and weekly report APIs still require the
  Lightsail runbook.
- Before sending any Guided or Premium checkout link, fix production Stripe
  price env (`STRIPE_PRICE_GUIDED_MONTHLY`, `STRIPE_PRICE_PREMIUM_MONTHLY`) and
  make `npm run audit:sales-payment-live` pass.
- Until automated checkout is green, use the manual payment handoff runbook:
  payment only after path review, authorized Stripe Dashboard invoice/payment
  link only, and portal activation after fit plus payment are both clear.
- Run `npm run audit:sales-manual-ready` before outreach days. Outreach can
  proceed when it has 0 fail, provided the warnings in
  `docs/parent-sales-owner-decisions.json` are consciously owned for that day.

### 6. Parent Conversion & Retention Phases

Status: public frontend live; payment/backend operations still gated.

Rationale: site functionality is largely sufficient; the gap to "parents pay
and keep paying" is live evidence and human touch around payment. Phases in
priority order:

- **Phase A — Consultation touchpoint (pre-payment human).** In-site
  consultation booking form (reuse/extend the existing contact form) that
  reaches the admission inbox and is visible to admin, fronted by Shiyu
  Zhang, Ph.D., President & Principal. Linked from Pricing, Trust Center,
  and Admission. Bilingual.
- **Phase B — Student outcomes stories (proof of results).** Public page
  with graduate trajectories using pseudonyms + real course/credit/
  acceptance data from `server/prisma/seed.js`. Full university names only;
  conservative claims.
- **Phase C — Weekly parent report (push, not pull).** Server-generated
  weekly draft per student (modules completed, study hours, pacing,
  parent_safe advisor note); admin reviews and sends via existing email
  infra. No auto-send.
- **Phase D — Advisor weekly SOP surface.** Lightweight admin checklist:
  per active student, review progress / write one parent_safe note / set
  risk flag. Feeds Phase C content.

Non-goals for this lane: no push/deploy (branch reconciliation is lane 5),
no AP/accreditation claims, no new public group pricing, no auto-send email
without admin review. Acquisition/traffic work is acknowledged as the
upstream bottleneck but lives outside this repo.

2026-06-10 status — Phases A–D implemented and committed locally (NOT pushed,
NOT deployed):

- Phase A: `/consultation` page (Shiyu Zhang intro, Netlify form
  `consultation` registered in `public/index.html`, bilingual). Entry links:
  nav Admission dropdown, Pricing CTA, Trust Center hero, Admission CTA.
  The form now captures student situation, transcript availability, desired
  start timing, preferred contact window, and parent contact fields. Netlify
  dashboard must have a form notification → admissions inbox configured at
  deploy time.
- Phase B: `/graduates` page with real Class of 2026 trajectories from
  `server/prisma/seed.js` shown as initial+surname (Y. Yang / B. Lu / R. Li /
  T. Zhang per Alan). Homepage `SuccessStories` names shortened to match. No
  AP strings on the public page; offers labeled "reported"; no guarantees.
- Phase C: weekly report service enriched with trailing-7-day activity and
  latest parent_safe advisor note; `studentIds` filter added; email template
  extended (escaped). New `/admin/weekly-report` review page (dry-run drafts,
  per-student select, send). AdminDashboard blind-send menu item replaced
  with link to review page. Codex review then patched the backend route so
  non-dry-run sends require a non-empty selected `studentIds` list; empty admin
  POSTs can no longer trigger all-family sends.
- Phase D: AdminProgressPage weekly-ritual banner, `no_parent_note_week`
  filter + summary card linking the SOP to the weekly report.

Verification: frontend production build compiled successfully with
`BUILD_PATH=/tmp/giis-build-final`; `audit:public-trust-claims` 41 files pass;
Codex targeted check on the weekly-report route guard passes:
`npm test -- weekly-report.test.js --runInBand`. Expanded parent/admin browser
smoke also passes: `npm run audit:ops-browser` returned 14 pass / 0 fail across
`/consultation`, `/graduates`, `/parent/dashboard`, `/admin`,
`/admin/applications`, `/admin/assignments`, and `/admin/weekly-report`.
Payment-readiness follow-up on 2026-06-11 added webhook signature tests; full
server Jest now passes 40/40.

Codex next actions:

1. Review whether frontend-safe changes can push/deploy before backend runtime
   changes. Frontend deploys via Netlify; Phase C server changes
   (`weeklyReportService`, mailer, weekly-report route) ride the Lightsail
   backend deploy path together with the pending hardening stack.
2. At deploy time: configure the Netlify form notification for the new
   `consultation` form → admissions inbox, and verify the existing `contact`
   form notification still works.
3. Assign the first-response owner for the consultation SOP: who replies within
   one business day, who handles WeChat follow-up, and when the principal
   reviews red-flag requests.
4. After deploy: smoke-submit the consultation form once, dry-run the weekly
   report on production, and confirm the SuccessStories/graduates
   initial+surname format renders correctly in both languages.

## Paused / Closed

- Old AP-era batch video generation is paused.
- Old AP Biology / AP Calculus audit snapshots, AP-label cascade artifacts,
  old AP/batch lesson quality snapshots, and the duplicate all-module browser
  smoke report were removed from active repo state on 2026-06-04. Use git
  history only if that historical evidence is explicitly needed.
- Old macOS GIIS lesson LaunchAgents are removed:
  - `com.giis.lesson-build`
  - `com.giis.youtube-daily`
  - `com.giis.foundation-video-daily`
- AP-facing video production remains closed until Alan/Umi explicitly reopens
  AP authorization-sensitive work.
- Historical completed roadmap entries were removed from the active roadmap.
  Use git history only when old evidence is explicitly needed.

## Working Rule

When daily priority is unclear, read in this order:

1. `/Users/alanhdchu/umi-central/goals.md`
2. This `ROADMAP.md`
3. `umi/workload.md`
4. The relevant playbook or pipeline doc

If central goals and project workload disagree, stop and escalate instead of
silently merging the two.
