# Parent Sales Launch Checklist

Last updated: 2026-06-11

This checklist is the Alan-facing go/no-go list for starting the parent sales
motion. It separates the low-risk public proof launch from the higher-risk
backend payment/access launch.

## Current Local Readiness

Local evidence is green:

- `npm run audit:sales-launch` — 36/36 pass
- `npm run audit:ops-browser -- --base-url http://localhost:3030` — 22 pass / 0 fail, including consultation, contact, and apply form submit success on desktop/mobile
- `npm run audit:public-trust-claims` — 41 files pass
- server Jest — 40/40 pass
- `npx prisma validate` — pass
- production build — pass with `BUILD_PATH=/tmp/giis-build-apply-submit`
- admissions consultation response SOP — `docs/admissions-consultation-response-sop.md`
- admissions payment handoff runbook —
  `docs/admissions-payment-handoff-runbook.md`
- parent sales outreach packet — `docs/parent-sales-outreach-packet.md`
- parent sales daily operator checklist —
  `docs/parent-sales-daily-operator-checklist.md`
- daily operator log template —
  `docs/templates/parent-sales-daily-operator-log.md`
- safe daily operator log generator —
  `npm run sales:operator-log`
- local production-proof smoke command available:
  `npm run audit:sales-live -- --base-url http://localhost:3030` — 8/8 pass
- parent journey acceptance command available:
  `npm run audit:parent-journey -- --base-url http://localhost:3030` — 7/7
  pass against the current production build. This checks that a parent can
  answer school status, learning evidence, parent visibility, pricing,
  applicant requirements, and contact-path questions before outreach.
- payment-launch live gate available:
  `npm run audit:sales-payment-live` — currently 2 pass / 1 warn / 4 fail in
  production; this must pass before treating automated Guided/Premium checkout
  and Stripe webhook handling as ready.
- manual-sales readiness gate available:
  `npm run audit:sales-manual-ready` — currently 9 pass / 4 warn / 0 fail in
  production. Verdict: `manual_sales_ready_with_recorded_warnings`.
  The embedded production proof smoke retries once to avoid failing an outreach
  day on a short Netlify edge stale window.
- same-day operator-log readiness mode available:
  `npm run audit:sales-manual-ready -- --operator-log /path/to/operator-log.md`
  — smoke-tested with a sanitized `/tmp` log at 13 pass / 1 warn / 0 fail.
  The remaining warning is automated payment readiness.
- same-day operator-log generator available:
  `npm run sales:operator-log -- --owner Alan --checked yes --manual-stripe-authorized yes`
  — writes a non-sensitive starter log outside git and prints the matching
  `sales:launch-mode` command.
- one-command same-day go/no-go gate available:
  `npm run sales:ready-today -- --operator-log /path/to/operator-log.md`
  — expected verdict today is `manual_sales_go_with_payment_boundary` until
  `npm run audit:sales-payment-live` has 0 fail.
- one-command launch-mode gate available:
  `npm run sales:launch-mode -- --operator-log /path/to/operator-log.md`
  — expected current verdict with same-day owner coverage is
  `manual_sales_go_with_payment_boundary`. Without same-day coverage or
  permanent owners, it returns `not_ready`.
- permanent owner-decision gate available:
  `npm run audit:sales-owner-decisions` — currently 0 pass / 1 warn / 3 fail
  with verdict `alan_review_required_for_permanent_sales_owners`. This is the
  Alan review list for replacing same-day operator logs with permanent owners.

## Current Production Status

Production public proof path is live. On 2026-06-11, after pushing
`da63e2fb` to GitHub `origin/main` and allowing Netlify to deploy,
the live site smoke returned 8 pass / 0 fail and the parent journey acceptance
gate returned 7 pass / 0 fail. The live smoke covers:

- `/`
- `/consultation`
- `/apply`
- `/pricing`
- `/trust-center`
- `/graduates`
- `/parent/demo`
- `/assessment-proof`

Buyer-readiness evidence: `npm run audit:parent-journey -- --base-url
https://genesisideas.school` checks school status, learning evidence, parent
visibility, pricing, applicant requirements, and contact-path answers.

One-command launch-mode evidence: `npm run sales:launch-mode -- --operator-log
/path/to/operator-log.md` combines the production public proof path, parent
journey acceptance, permanent owner-decision status, same-day operator coverage,
and automated payment live gate into one allowed action. Current verified mode
with a sanitized same-day operator log is
`manual_sales_go_with_payment_boundary`: outreach and manual payment handoff may
proceed, but automated Guided/Premium checkout remains blocked.

This proves the public parent proof path only. Before relying on inbound leads,
configure Netlify notifications for the `consultation` and `contact` forms to
`admissions@genesisideas.school`, or assign a daily owner to check Netlify form
submissions manually.

Payment automation is not launch-ready yet. Current production
`npm run audit:sales-payment-live` evidence shows:

- Self-Paced `$49/month` has a production Stripe price configured.
- Guided `$149/month` is visible in pricing but has no production Stripe price
  configured.
- Premium `$299/month` is visible in pricing but has no production Stripe price
  configured.
- Self-Paced annual is listed but has no production Stripe price configured.
- `https://api.genesisideas.school/health` is not reachable.
- `https://api.genesisideas.school/api/webhooks/stripe` is not reachable for
  HTTPS webhook smoke.

Evidence: `_audit/parent-sales-payment-live.md`.

Read-only Lightsail inspection on 2026-06-11 narrowed the API blocker:

- PM2 `giis-api` is online.
- `http://127.0.0.1:4000/health` returns 200 on the server.
- nginx listens on port 80 but not port 443.
- nginx currently proxies `api.genesisideas.school` to `127.0.0.1:8080`,
  while the API listens on `4000`.

Repair doc: `docs/production-api-proxy-repair.md`.
Stripe live price doc: `docs/stripe-live-price-setup.md`.
Read-only proxy audit: `npm run audit:production-api-proxy`.
Read-only payment env audit: `npm run audit:production-payment-env`.

Read-only production env inspection on 2026-06-11 found:

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CORS_ORIGIN`, `DATABASE_URL`,
  and `JWT_SECRET` are present without printing values.
- `STRIPE_PRICE_GUIDED_MONTHLY` is missing.
- `STRIPE_PRICE_PREMIUM_MONTHLY` is missing.
- `STRIPE_PRICE_SELF_PACED_ANNUAL` is missing.
- `STRIPE_PRICE_SELF_PACED_MONTHLY` is missing but legacy
  `STRIPE_PRICE_FOUNDERS_MONTHLY` is present.
- `ProcessedStripeEvent` table is missing in production DB.

Current env audit: 15 pass / 5 warn / 3 fail. The extra warning confirms
`DATABASE_URL` points to localhost; this is acceptable only if production
Postgres is intentionally running on the Lightsail instance.

## What Can Launch First

Frontend-only Netlify deploy can launch the pre-payment proof path:

- `/`
- `/consultation`
- `/graduates`
- `/pricing`
- `/trust-center`
- `/parent/demo`
- `/assessment-proof`
- `/apply`

This is enough to begin outreach and consultations because families can now see:

- a homepage first viewport that leads with consultation, Trust Center, and
  no-payment-before-review language
- school trust proof
- graduate trajectories with conservative reported-outcome wording
- parent dashboard preview
- assessment and assignment evidence
- Guided `$149/month` as the transfer-family default
- a no-pressure consultation form before payment
- an application path review that explains new-student vs transfer-student
  records before submission
- an internal response flow for turning consultations into path review,
  document requests, and plan recommendations
- a conservative outreach packet for first messages, WeChat, consultation call
  flow, follow-up templates, same-day stop conditions, and owner review items
- a same-day operator checklist and non-sensitive log template so temporary
  lead-capture / response / WeChat / manual Stripe coverage can be recorded
  outside git before outreach starts
- a one-command same-day go/no-go gate:
  `npm run sales:ready-today -- --operator-log /path/to/operator-log.md`

## What Frontend-Only Does Not Prove

Do not claim these are production-live until Lightsail backend deploy completes:

- automated Guided / Premium Stripe checkout
- weekly parent report send/review API
- Stripe webhook idempotency
- new paid-but-unlinked subscription alerting
- stricter production CORS startup behavior
- production `ProcessedStripeEvent` table
- direct HTTPS API health at `https://api.genesisideas.school`

## Commit Stack Classification

Local `main` has already been pushed to `origin/main`, triggering Netlify and
publishing the public proof path. Future pushes to GitHub `origin/main` will
trigger Netlify frontend deployment, but will not automatically restart the
Lightsail API.

Frontend / proof-path relevant:

- frontend Apply/pricing/trust/admission fixes
- `/consultation`
- `/graduates`
- parent dashboard proof surfaces
- public trust / sales-launch gates
- admissions consultation response SOP
- unreferenced image cleanup
- Netlify/Node build configuration

Backend / runtime relevant, not live until Lightsail deploy:

- Prisma `ProcessedStripeEvent`
- Stripe webhook signature/idempotency changes
- CORS/rate-limit/auth hardening
- weekly parent report backend route
- paid-but-unlinked subscription visibility

Operational / repo hygiene:

- `teaching-videos/` untracking for the T9 symlink
- foundation-video manifest sync fix
- foundation handoff docs and deploy readiness docs

This means a push to `main` is acceptable for a frontend proof launch only if
Alan understands the backend runtime changes remain staged in git until the
Lightsail runbook is executed.

## Alan Review Items

Before relying on inbound lead capture:

- Configure Netlify notifications for forms `consultation` and `contact` to
  `admissions@genesisideas.school`.
- Confirm who owns first response, WeChat follow-up, and principal escalation
  for consultation requests.
- Submit one test consultation form and one test contact form; confirm both
  emails arrive or that Netlify submissions are checked daily.

Important: `audit:sales-live` proves only the public parent proof path. It does
not prove Lightsail backend payment/webhook changes or weekly-report APIs.

Before backend/payment deploy:

- Confirm production deploy window.
- Follow `docs/production-payment-deploy-runbook.md`.
- Confirm production Stripe env:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_SELF_PACED_MONTHLY`
  - `STRIPE_PRICE_SELF_PACED_ANNUAL`
  - `STRIPE_PRICE_GUIDED_MONTHLY`
  - `STRIPE_PRICE_PREMIUM_MONTHLY`
  - `CORS_ORIGIN=https://genesisideas.school`
  - no `ALLOW_UNVERIFIED_STRIPE_WEBHOOK=1`
- Add production Stripe prices/env for:
  - `STRIPE_PRICE_GUIDED_MONTHLY`
  - `STRIPE_PRICE_PREMIUM_MONTHLY`
  - optional: `STRIPE_PRICE_SELF_PACED_ANNUAL`
- Restore/verify HTTPS reachability for `https://api.genesisideas.school`.
  Current production evidence points to nginx/SSL repair, not missing API route
  code.
  Start with `npm run audit:production-api-proxy`; current result is 7 pass /
  0 warn / 5 fail until nginx/SSL is repaired.
- Run production DB backup and `npm run db:push`.
- Verify `ProcessedStripeEvent` exists.
- Restart the Lightsail API and run production smoke.
- Send signed and unsigned Stripe webhook test events.
- Run `npm run audit:sales-payment-live` and require 0 fail.

## Current Recommendation

Use a three-step launch:

1. Public proof path is already live; admissions can start conversations and
   transfer path reviews.
2. Configure lead notifications or a daily Netlify submissions owner so no
   parent inquiry is missed.
3. Fix Stripe price env + HTTPS API/webhook readiness, then deploy backend
   payment/access changes in a separate controlled Lightsail window.

After every frontend deploy, also run:

```bash
npm run audit:parent-journey -- --base-url https://genesisideas.school
```

This is the buyer-readiness check. `audit:sales-live` proves key routes render;
`audit:parent-journey` proves those routes answer the parent questions that
drive willingness to pay.

GIIS can start selling through consultation and path review now, but should not
send automated Guided/Premium checkout links until `npm run
audit:sales-payment-live` returns 0 fail.

Until then, use `docs/admissions-payment-handoff-runbook.md` for the manual
payment fallback: payment only after path review, Stripe Dashboard invoice or
payment link only from an authorized GIIS operator, receipt/Stripe ID recorded
outside git, and portal activation only after fit plus payment are both clear.

Daily operator check while automated payment remains gated:

```bash
npm run audit:sales-manual-ready
```

Start outreach only when this returns 0 fail. Current warnings mean the public
proof path and manual handoff are technically ready, but Alan still needs to
assign lead-capture, first-response, WeChat follow-up, and manual Stripe owner
decisions before outreach is operationally complete.

Alan-facing owner decisions are tracked in
`docs/parent-sales-owner-decisions.json`. Leave blank/false values blank until
Alan confirms them; the manual readiness gate will keep warning on missing
owners instead of silently treating the launch as operationally complete.

To see only the permanent owner gaps Alan needs to review, run:

```bash
npm run audit:sales-owner-decisions
```

Current expected output is `alan_review_required_for_permanent_sales_owners`
until lead capture, first response, WeChat follow-up, and manual Stripe
ownership are assigned or Netlify notifications are confirmed.

Use `docs/parent-sales-outreach-packet.md` for outreach days. It contains the
conservative first-message scripts, WeChat short reply, consultation call flow,
follow-up templates, recordkeeping checklist, and same-day stop conditions.

Use `docs/parent-sales-daily-operator-checklist.md` before the first outreach
message each day. If permanent owners are still blank in
`docs/parent-sales-owner-decisions.json`, a same-day owner must be recorded in a
filled operator log outside git before outreach starts.

Generate the daily log outside git:

```bash
npm run sales:operator-log -- --owner Alan --checked yes --manual-stripe-authorized yes
```

This writes to the system temp directory by default and refuses to write inside
the repo. Use a real same-day owner name only after that person has agreed to
cover lead capture, response, WeChat follow-up, and manual Stripe handoff for
the day.

The readiness gate supports a same-day operator log:

```bash
npm run audit:sales-manual-ready -- --operator-log /path/to/operator-log.md
```

Use this only for non-sensitive same-day owner coverage. Do not commit filled
logs that include parent names, emails, payment links, student records, or
Stripe IDs.

With a filled same-day operator log, the manual readiness gate can treat
lead-capture, first-response, WeChat follow-up, and Alan-authorized manual
Stripe coverage as covered for that day. Without a log or permanent owner
decisions, those items remain warnings by design.

For the single Alan-facing go/no-go line, run:

```bash
npm run sales:launch-mode -- --operator-log /path/to/operator-log.md
```

Use the result as the operating boundary:

- `not_ready`: do not start active outreach.
- `manual_sales_go_with_payment_boundary`: outreach/path review/manual payment
  handoff may proceed for the day; no automated checkout links.
- `permanent_manual_sales_ready_with_payment_boundary`: permanent owners are
  recorded, so daily operator logs are no longer required; no automated checkout
  links.
- `full_sales_ready`: payment-live is green; automated checkout may proceed
  only under the production payment runbook.
