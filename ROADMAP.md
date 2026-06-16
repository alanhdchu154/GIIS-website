# GIIS Website Roadmap

Last updated: 2026-06-16

This file is the current execution roadmap. Historical slot logs were removed
from the active repo state so daily work starts from current priorities instead
of a long completed-task scroll.

## Current Priority

Keep the school trustworthy, operational, and parent-visible while the
foundation-video pipeline stabilizes. The next phase is proof over volume:
parents should see a serious school, a working dashboard, and course/video
quality that feels intentionally designed.

Current 2026-06-12 risk: the public parent proof path is live on Netlify and
passes production smoke, and the production API/backend is reachable again.
Lightsail nginx now proxies `api.genesisideas.school` to the live API on port
`4000`, listens on HTTPS `443`, and `npm run audit:production-api-proxy` is 12
pass / 0 warn / 0 fail. The backend was fast-forwarded to `origin/main`,
production Postgres was backed up, `db:push` added `ProcessedStripeEvent`, PM2
`giis-api` was restarted, and unsigned Stripe webhook requests now fail closed
with 400. Production course resources were synced from JSON, and English I
assignments were targeted-synced to remove CommonLit / fixed copyrighted-text
residue from the student-facing flow. Automated payment launch is still not
ready because Guided and Premium production Stripe price IDs are missing, but
this is no longer an API availability blocker. Manual Review Sales Mode remains
the sellable v1 path: apply/consult, path review, manual Stripe invoice/payment
link, admin payment verification, then account activation. Pushing local `main`
to GitHub `origin/main` automatically triggers the Netlify frontend deploy for
`genesisideas.school`; it does not deploy/restart the Lightsail backend.

Current sellable state: GIIS can start consultation-first outreach and
transfer/new-student path reviews using the public proof path, response SOP,
outreach packet, daily operator checklist, Manual Review Sales Mode, and admin
manual payment verification. This is not the same as fully automated checkout.
Payment API failures block automated checkout only; reviewed manual sales can
proceed when same-day/permanent owner coverage is present. Parent-facing proof
is now gated by `npm run audit:parent-journey`, which verifies the live/local
path answers the core buyer questions: school status, learning evidence, parent
visibility, recommended price tier, applicant requirements, and human contact.
Outreach days should run `npm run sales:ready-today -- --operator-log
/path/to/operator-log.md`; unresolved owner warnings must be covered by a
same-day operator log outside git. Expected current verdict is
`manual_sales_go_with_payment_boundary`. Automated Guided/Premium checkout
stays blocked until `npm run audit:sales-payment-live` returns 0 fail.
Use `npm run sales:operator-log -- --owner <same-day-owner> --checked yes
--manual-stripe-authorized yes` to generate the daily operator log outside git
after the owner has explicitly agreed to cover that day.
The safest daily start command is `npm run sales:start-day -- --owner
<same-day-owner> --checked yes --manual-stripe-authorized yes`; it refuses to
start without those explicit flags, writes the outside-git log, and runs
launch-mode.
The current single-command operating gate is `npm run sales:launch-mode --
--operator-log /path/to/operator-log.md`; with sanitized same-day operator
coverage it returns `manual_sales_go_with_payment_boundary`, and without
same-day/permanent owner coverage it returns `not_ready`.
Permanent owner decisions are tracked by
`npm run audit:sales-owner-decisions`; current verdict is
`permanent_manual_sales_owners_ready` after recording Alan as interim owner for
lead capture, first response, WeChat follow-up, and manual Stripe handoff.
Latest production frontend verification after the Manual Review Sales Mode
push: `audit:sales-live` is 8/8, `audit:parent-journey` is 7/7,
`audit:sales-manual-ready` is 12 pass / 1 warn / 0 fail without a same-day log,
`audit:sales-manual-ready -- --operator-log /tmp/...` is 13 pass / 1 warn /
0 fail, and `sales:launch-mode` returns
`permanent_manual_sales_ready_with_payment_boundary`. The remaining warning is
the expected automated-payment boundary. Local static `audit:sales-launch` is
40/40 after adding admin manual payment verification and the public refund
policy gate.
2026-06-15 website parent/student clarity pass: homepage, Trust Center, Pricing,
and admissions handoff now explain the student weekly learning rhythm, first
week after enrollment, support-level fit review, and refund/payment safety net
without changing the manual-review payment boundary. Local production-build
verification passed `audit:public-trust-claims`, `audit:sales-launch`,
`audit:parent-journey -- --base-url http://localhost:3030`, `audit:sales-live
-- --base-url http://localhost:3030`, `audit:sales-manual-ready -- --base-url
http://localhost:3030`, mobile 390px browser smoke on homepage / Trust Center /
Pricing / Apply, and `npm run build`. The only warning remains the expected
automated-payment boundary.
2026-06-16 school operations gate added `npm run school:ops-report` as the
single daily operator snapshot across production API proxy, parent sales smoke,
parent journey, owner decisions, manual sales readiness, automated payment
boundary, lesson manifest alignment, release gate, video dashboard, and
lesson-video inventory. Current expected verdict is still
`manual_sales_go_with_payment_boundary`: manual sales can run through reviewed
application/consultation handoff, while automated Guided/Premium checkout
remains blocked by missing live Stripe Price IDs. The same report now surfaces
unconfirmed Netlify `consultation` / `contact` notifications as a lead-capture
next action, so the recorded daily submissions owner must manually check
Netlify submissions and the admissions inbox until notifications are confirmed.
Lead capture also has a dry-run verifier: `npm run lead-capture:test` checks
local hidden forms, production form registration, and test payload shape without
sending an external submission; only `--confirm-submit` sends a test lead that
must be verified in Netlify and the admissions inbox.
The daily operator checklist and outside-git log template now start from
`school:ops-report`, so admissions/admin operators see the full school ops
snapshot before opening outreach, lead follow-up, records requests, or manual
payment discussion.
Manual payment now has a parent-facing receipt copy in the admin application
queue after **Record Manual Payment** succeeds. The receipt is GIIS-branded,
includes the Stripe/manual reference and refund-policy link, and is guarded by
the parent sales launch audit plus parent/admin browser smoke.
Chinese-language conversion coverage now includes the School Profile trust
path: `/school-profile` receives the current language, shows a Chinese
parent-reading layer while preserving the official English profile/PDF body,
and `npm run audit:conversion-bilingual` guards Trust Center, Pricing, Apply,
School Profile, and Refund Policy in Chinese mode. Local production-build smoke
passed 5/5.
The public parent dashboard demo now uses date-neutral sample-week labels for
activity, advisor notes, upcoming items, and weekly digests instead of stale
May/June dates; `audit:sales-launch` guards this so the proof surface does not
look abandoned.
2026-06-16 Student Learn Portal entry pass: `/learn` / `/login` now explains
what enrolled students can do after sign-in (continue modules, submit work,
review feedback, and check grades/credits/transcript progress), links
not-yet-activated families back to path review / admissions consultation, and
keeps parent sign-in visibly separate. The unauthenticated Learn Dashboard no
longer fires student API requests before redirecting to sign-in, so the entry
surface is cleaner for students and for browser smoke.
The module page now warns students after a quiz when the module assignment is
still missing: quizzes may unlock the next module, but submitted work is needed
for teacher review, parent-visible feedback, and final course completion.
The daily school-ops gate now also checks frontend deploy freshness:
`npm run audit:frontend-deploy` now treats Netlify's published production
deploy commit as the primary freshness signal and keeps local-vs-Netlify asset
hash differences as diagnostics. On 2026-06-16, Netlify public metadata showed
production deploys ready on branch `main`, connected to
`https://github.com/alanhdchu154/GIIS-website`, with the published commit
matching the then-current `origin/main`; GitHub CI was green for the same SHA,
and production behavior gates passed (`audit:frontend-deploy`
`production_deploy_matches_origin_main`, `audit:conversion-bilingual` 7/7,
parent journey 7/7, and `school:ops-report` with
`manual_sales_go_with_payment_boundary`). The parent-facing AI/software
boundary, support-by-plan boundary, Admissions/Discovery support wording, and
mobile trust-path fixes are verified live. Netlify may produce different
local-vs-production asset hashes for the same commit, so use published deploy
metadata plus behavior gates before calling production stale. If a future push
shows an older published commit or failing behavior gates, follow
`docs/netlify-frontend-deploy-repair.md`; do not use an unreviewed local folder
deploy.
The persona audit now recognizes the current production frontend API shape:
Netlify builds with same-origin `https://genesisideas.school` and proxies
`/api/*` to the Lightsail API. `npm run audit:personas` verifies either direct
`api.genesisideas.school` bundle evidence or same-origin `/api` proxy evidence,
then confirms `/api/checkout/tiers` returns the current multi-tier pricing
contract. This prevents a false admin-ops blocker when the deployment is
healthy.
Trust Center now includes an AI/software boundary for parent transparency:
software or AI-assisted tooling may help organize progress signals, drafts,
lesson workflow, and review queues, but automation does not automatically
change grades, credits, official records, payment status, or family-facing
advisor summaries. `audit:sales-launch` and `audit:parent-journey` guard this
boundary so transparency does not drift while the school keeps using internal
automation safely.
The Support page now matches the current tuition tiers: all reviewed
enrollments get Learn Portal access, records, and submitted-assignment
feedback, while Guided adds monthly advisor planning/review and Premium adds
higher-touch pathway, writing, portfolio, and college-readiness planning. The
sales-launch audit guards this boundary so Self-Paced is not accidentally
presented as full advisor or college-pathway support.
The same support-by-plan boundary now extends to Admissions FAQ and Discovery
mission copy: public pages should say reviewed enrollments receive course
access, records, parent-visible progress, and assignment feedback, while
recurring advisor planning/review is added by Guided or Premium. The bilingual
conversion smoke also guards `/discovery` and `/about` mobile overflow so the
mission/leadership trust path stays readable on phones.
Homepage and Academics AI/technology copy now follows the Trust Center
human-review boundary: software or AI-assisted tools may help staff organize
lessons, progress signals, drafts, and review queues, but public pages should
not promise adaptive AI learning, automatic personalization, or "optimal pace"
progress for every student. `audit:sales-launch` and
`audit:public-trust-claims` guard against drifting back to those claims.

## Active Lanes

### 1. Foundation Video Daily Pipeline

Status: active, Codex-managed, foundation-only.

- Scheduler:
  `~/.codex/automations/giis-foundation-video-split-batch/automation.toml`
- App-facing automation: `GIIS_影片_pipeline`, posting in
  `GIIS_影片_producer`.
- Time: one hourly Codex heartbeat with internal gates:
  - 03:00 / 08:00 CT: producer runs, up to 10 modules/uploads each.
  - 12:00 / 17:00 CT: check for missed daily target, run bounded catch-up if
    needed, and update the dashboard in the same chat.
- Repo runner: `bash tools/lesson-video/foundation_daily.sh`
- Scope: non-AP foundation modules only.
- Target upload volume: about 20/day when gates stay clean; do not chase volume
  by forcing weak lessons through the quality gate.
- Upload rule: only `yt_queue.py upload --gate-ready`; never
  `upload_lesson.py --force-without-approval`.
- Required gate: clean pass, score 100, MP4, transcript, contact sheet,
  reviewers, learning check, style manifest, and
  `approved_ready_to_upload.json`.
- Current quota behavior: the local estimate is conservative; the pipeline may
  ignore it during the trial. Stop only on a true video upload/channel-limit
  error. Transcript/caption-only `quotaExceeded` after a successful video upload
  should be reported as a retry item, not as a failed video upload.
- 2026-06-15 dashboard WIP cleanup: `tools/lesson-video/video_dashboard.py`
  now reports course/grade production-plan coverage from
  `server/prisma/courses/**/*.json`, uses America/Chicago upload dates for
  daily grouping, labels AP modules as deferred in the plan note, and uses a
  configurable target pace (`FOUNDATION_DASHBOARD_TARGET_PER_DAY`, default now
  aligned to the roughly 20/day foundation target).

Next check:

- After each scheduled run, review selected modules, cc progress, gate result,
  upload result, website manifest sync, and any `cc_blocked` report.
- At 12:00 / 17:00 CT, review the generated upload dashboard, queue status,
  release gate totals, and manifest alignment from the same
  `GIIS_影片_producer` thread.
- Before any push/deploy, finish browser/predeploy smoke, review the backend
  hardening and Prisma/webhook changes, and separate safe frontend/pipeline
  changes from Lightsail/db work if needed.
- Monitor the 10/run morning producer slots before increasing daily pace. Do not
  expand volume unless cc output, release gate, YouTube upload, and Learn Portal
  manifest sync all pass without manual rescue.
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
- `npm run audit:assessment-homework-full-review -- --strict`: 93 pass / 0
  warn / 0 fail across all 93 courses after the 2026-06-13 teacher-polish pass,
  covering 993 module assignments, 3,969 quiz questions, 1,395 midterm
  questions, and 1,860 final questions. The pass added explicit
  `Submit`/`Include`/`Evaluation` expectations to all 993 assignments,
  normalized 169 open-question metadata fields so exact-fill and open-response
  grading behave intentionally, and rewrote all 85 two-option True/False items
  into stronger four-option diagnostic questions. Follow-up checks report 0
  two-option items, 0 True/False prompts, 0 answer-not-in-options cases, and 0
  answer-key strings polluted with explanation tails.
- `npm run audit:module-syllabus-full-review -- --strict`: 93 pass / 0 warn /
  0 fail across all 93 courses after the 2026-06-13 syllabus-polish and expert
  lens pass, covering 993 modules, 3,242 resource links, 993 expert-lens
  sections, and 3,279 estimated module hours.
  The first strict pass found 2 fail / 642 warn: two too-thin learning
  objectives plus many objectives/resource notes that were usable but not yet
  parent-readable at a highest-standard syllabus level. `npm run
  repair:module-syllabus-full-review` strengthened 339 learning objectives,
  294 resource notes, clarified 9 terse module titles, and raised Geography's
  0.5-credit module hours from 16 to 18. The final gate verifies every syllabus
  has parent-readable metadata, contiguous module sequence, estimated hours,
  measurable objectives, expert-lens guidance, required resources, structured
  assignment evidence, and quiz/exam coverage. The expert lens appears on
  syllabus and module pages as three non-credential-claim sections: `Big idea`,
  `Watch for`, and `Transfer`, so families see discipline-level judgment
  without GIIS making unsupported "PhD-authored" claims. Reports:
  `_audit/module-syllabus-full-review.md` and
  `_audit/module-syllabus-full-review.json`. Follow-up all-module browser
  smoke against the production build also passed:
  `npm run audit:showcase-browser -- --base-url http://localhost:3030
  --all-modules --report _audit/all-course-browser-smoke.md --json-report
  _audit/all-course-browser-smoke.json`: 2,358 pass / 0 fail across desktop
  and mobile course overview, syllabus, and module routes; this browser gate
  now fails if syllabus/module pages do not render `Expert Lens`.
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
  `/admin/assignments`, `/admin/weekly-report`, and the unauthenticated
  `/learn` student-entry surface on desktop and mobile with mocked API
  responses and repeated-fetch caps. Latest local result: 24 pass / 0 fail.
- Admin home IA was tightened on 2026-06-12: `/admin` now starts with a
  transfer-family review workflow, then a department hub (Admissions, Student
  Records, Academic Delivery, Parent Care, Billing, School Operations), then the
  daily action strip and roster. The shared admin nav exposes a visible
  public-site return path.
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
- Public nav IA was tightened again on 2026-06-12 into a parent decision path:
  Trust Center, Academics, Admissions, Parent View, Student Portal. Admissions
  separates general new-student and transfer path review; Parent View owns
  parent-visible proof and progress-preview surfaces; Student Portal owns Week
  1 / Learn Portal / login / lessons / handbook / support.
- Enrollment roadmap added on 2026-06-12 across homepage, Admission, Transfer
  Students, Trust Center, and Apply. It makes the general new-student path and
  transfer-student path visibly different, clarifies required records and credit
  review timing, and keeps the payment boundary after human path review.
- Admissions Handoff Receipt added on 2026-06-12 for `/apply` and
  `/consultation` success states. Families now see received status, one-business
  day admissions review, records preparation, plan recommendation, and the
  no-payment-before-review boundary immediately after submitting.
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
  Historical 2026-06-11 production result was 2 pass / 1 warn / 4 fail:
  Self-Paced monthly was configured, but Guided `$149/month` and Premium
  `$299/month` had no production Stripe price IDs, Self-Paced annual had no
  price ID, direct `https://api.genesisideas.school/health` was unreachable,
  and the Stripe webhook endpoint was not reachable over HTTPS. Later
  production API repair reduced the current blocker to Stripe price IDs; use
  the current priority section or `npm run school:ops-report` for today's
  status. Evidence: `_audit/parent-sales-payment-live.md`. The gate now emits operator
  `nextActions[]` that map failures to Stripe live price setup or production
  API proxy repair.
- 2026-06-11 production API proxy diagnosis added
  `docs/production-api-proxy-repair.md`: local API health passes on Lightsail
  at `127.0.0.1:4000`, but nginx proxies the API host to `127.0.0.1:8080` and
  has no active `443` listener. `npm run audit:production-api-proxy` gives a
  repeatable read-only check; historical 2026-06-11 result was 7 pass / 0 warn
  / 5 fail. This blocked direct API health and Stripe webhook smoke until the
  2026-06-12 nginx/SSL repair.
- 2026-06-12 production API repair closeout: nginx backups now belong under
  `/etc/nginx/backups` rather than `sites-enabled/`, the API host proxies to
  `127.0.0.1:4000`, nginx listens on `443`, `npm run audit:production-api-proxy`
  is 12 pass / 0 warn / 0 fail, unsigned webhook smoke returns 400, and
  `npm run audit:sales-payment-live` is down to 4 pass / 1 warn / 2 fail with
  the remaining failures limited to missing Guided/Premium Stripe live price IDs.
  The same repair also synced production course resource URLs from JSON,
  targeted-synced English I assignments, and replaced ProCon resource references
  with stable Purdue OWL alternatives.
- 2026-06-11 Stripe live price setup doc added
  `docs/stripe-live-price-setup.md` for the required live Price IDs:
  Self-Paced monthly/annual, Guided monthly, and Premium monthly.
- 2026-06-11 production payment env audit added
  `npm run audit:production-payment-env`. Current result is 15 pass / 5 warn /
  3 fail: live Stripe secret/webhook secret/CORS/DATABASE/JWT are present
  without printing values, but Guided and Premium live price IDs are missing,
  Self-Paced monthly still relies on the legacy Founders fallback, Self-Paced
  annual is missing, production `DATABASE_URL` points to localhost, `NODE_ENV`
  is not in `.env` (may be PM2-level), production repo has dirty files, and
  production DB lacks `ProcessedStripeEvent`.
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
  gates both. `sales:ready-today -- --operator-log /path/to/log.md` is now the
  one-command outreach-day go/no-go; it validates same-day lead-capture,
  response, WeChat, and Alan-authorized manual Stripe coverage without
  committing sensitive lead data, then reports whether the day is manual-sales
  ready or fully payment-ready. Expected current verdict is
  `manual_sales_go_with_payment_boundary`; automated payment readiness remains
  the only allowed warning boundary.
- 2026-06-11 manual-sales readiness gate added and aligned to Manual Review
  Sales Mode. With a sanitized same-day operator log, current production result
  is 13 pass / 1 warn / 0 fail with verdict
  `manual_sales_ready_with_recorded_warnings`: public proof path, Netlify form
  markup, admissions email fallback, SOP, handoff docs, daily operator checklist,
  owner coverage, and admin `Record Manual Payment` boundaries pass. The
  remaining warning is blocked automated payment readiness. Without same-day
  operator coverage, missing permanent owners remain expected warnings. The
  embedded production proof smoke retries once to reduce false-red failures from
  short Netlify edge stale windows. Evidence:
  `_audit/parent-sales-manual-ready.md`.
- 2026-06-11 parent journey acceptance gate added
  `npm run audit:parent-journey`. It browser-checks the parent decision route
  for seven buyer questions: homepage decision path, legal status proof,
  learning evidence, parent visibility, Guided pricing default, new/transfer
  applicant requirements, and human contact. The first production run exposed
  that `/apply` only showed "official transcripts or verifiable school records"
  after selecting transfer; the fixed copy now shows that requirement in the
  static Before You Submit panel. Local production build verification passed
  7/7 with `--base-url http://localhost:3037`; after push/deploy,
  production verification also passed 7/7 with `--base-url
  https://genesisideas.school`.
- 2026-06-11 owner-decision gate added
  `npm run audit:sales-owner-decisions`. It reads
  `docs/parent-sales-owner-decisions.json` and produces an Alan review list for
  permanent operational ownership. Current result is 3 pass / 1 warn / 0 fail:
  Alan is recorded as interim owner for lead capture, first response, WeChat
  follow-up, and manual Stripe handoff; backend payment deploy window remains a
  warning while automated checkout is gated.
- 2026-06-11 launch-mode gate added `npm run sales:launch-mode`. It combines
  static sales-launch, production sales-live, parent journey acceptance,
  permanent owner decisions, optional same-day operator coverage, and payment
  live readiness into one operating mode. Verified current behavior: no operator
  log plus missing permanent owners returns `not_ready`; a sanitized same-day
  operator log returns `manual_sales_go_with_payment_boundary`; automated
  checkout remains blocked by payment-live failures.
- 2026-06-11 operator-log generator added `npm run sales:operator-log`. It
  writes the daily operator log to an outside-git path by default, refuses repo
  paths, and prints the matching `sales:launch-mode -- --operator-log ...`
  command so outreach days do not depend on hand-copying the template.
  Production smoke after push verified the generated log can drive
  `sales:launch-mode` to `manual_sales_go_with_payment_boundary`.
- 2026-06-11 guarded sales-day starter added `npm run sales:start-day`. It
  requires explicit `--owner`, `--checked yes`, and
  `--manual-stripe-authorized yes`, generates the outside-git operator log, and
  immediately runs `sales:launch-mode`. Current smoke with a sanitized `/tmp`
  log returns `manual_sales_go_with_payment_boundary`: outreach and reviewed
  manual payment handoff may proceed; automated checkout remains blocked.
- 2026-06-11 Manual Review Sales Mode is now the official v1 sellable flow:
  approved applications can record a reviewed manual Stripe invoice/payment-link
  reference from `/admin/applications`, creating an active `Subscription` using
  the existing backend model and appending a `Manual Payment Verified` audit line
  before account activation.
- 2026-06-11 public refund policy added at `/refund-policy`, linked from
  Pricing, Trust Center, and the admissions payment handoff. This makes the
  30-day refund promise visible before payment and gateable by
  `npm run audit:sales-launch`.
- 2026-06-11 bounded cc review found no audit-script correctness bugs and
  agreed automated checkout must remain gated behind live Stripe price IDs,
  nginx/SSL repair for `api.genesisideas.school`, production DB backup/db push,
  and webhook verification. cc cautioned that owner fields should not be filled
  with fake names; current repo state records Alan only as an interim owner.
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
- After each frontend deploy, run `npm run audit:parent-journey -- --base-url
  https://genesisideas.school` to verify the parent can answer the buyer
  questions before outreach traffic is sent.
- Before sending any Guided or Premium checkout link, fix production Stripe
  price env (`STRIPE_PRICE_GUIDED_MONTHLY`, `STRIPE_PRICE_PREMIUM_MONTHLY`) and
  make `npm run audit:sales-payment-live` pass.
- Before accepting live Stripe webhooks as reliable, back up production DB,
  run the server `npm run db:push`, and make
  `npm run audit:production-payment-env` show `ProcessedStripeEvent` present.
- Before sending any automated checkout link, repair nginx/SSL for
  `api.genesisideas.school` so `/health` returns 200 over HTTPS and unsigned
  webhook smoke returns 4xx. Use `npm run audit:production-api-proxy` before and
  after repair.
- Until automated checkout is green, use Manual Review Sales Mode:
  payment only after path review, authorized Stripe Dashboard invoice/payment
  link only, `/admin/applications` **Record Manual Payment**, and portal
  activation after fit plus payment are both clear.
- Run `npm run sales:ready-today -- --operator-log /path/to/operator-log.md`
  before outreach days. Outreach can proceed only when it returns
  `manual_sales_go_with_payment_boundary` or `full_sales_ready`.
- Generate the same-day log with `npm run sales:operator-log -- --owner
  <same-day-owner> --checked yes --manual-stripe-authorized yes` after the
  owner has explicitly agreed to cover lead capture, response, WeChat, and
  manual Stripe handoff for that day.
- Prefer `npm run sales:start-day -- --owner <same-day-owner> --checked yes
  --manual-stripe-authorized yes` for an outreach day because it generates the
  log and immediately runs the go/no-go gate.
- Prefer `npm run sales:launch-mode -- --operator-log /path/to/operator-log.md`
  as the Alan-facing daily operating command because it also verifies the
  parent journey and permanent owner-decision state before giving the allowed
  sales mode.
- Run `npm run audit:sales-owner-decisions` before replacing same-day operator
  logs with permanent ownership. Current interim ownership passes, but replace
  Alan-as-interim with named admissions/ops owners once the team is ready.
- Keep `/refund-policy` linked from payment-facing copy. If refund wording
  changes, update Pricing, Trust Center, and
  `docs/admissions-payment-handoff-runbook.md` together.

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

2026-06-10 historical status — Phases A–D implemented and committed locally
at that time (then not yet pushed/deployed):

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
