# Parent Sales Launch Checklist

Last updated: 2026-06-11

This checklist is the Alan-facing go/no-go list for starting the parent sales
motion. It separates the low-risk public proof launch from the higher-risk
backend payment/access launch.

## Current Local Readiness

Local evidence is green:

- `npm run audit:sales-launch` — 24/24 pass
- `npm run audit:ops-browser -- --base-url http://localhost:3030` — 22 pass / 0 fail, including consultation, contact, and apply form submit success on desktop/mobile
- `npm run audit:public-trust-claims` — 41 files pass
- server Jest — 40/40 pass
- `npx prisma validate` — pass
- production build — pass with `BUILD_PATH=/tmp/giis-build-apply-submit`
- admissions consultation response SOP — `docs/admissions-consultation-response-sop.md`
- admissions payment handoff runbook —
  `docs/admissions-payment-handoff-runbook.md`
- local production-proof smoke command available:
  `npm run audit:sales-live -- --base-url http://localhost:3030` — 8/8 pass
- payment-launch live gate available:
  `npm run audit:sales-payment-live` — currently 2 pass / 1 warn / 4 fail in
  production; this must pass before treating automated Guided/Premium checkout
  and Stripe webhook handling as ready.
- manual-sales readiness gate available:
  `npm run audit:sales-manual-ready` — currently 8 pass / 2 warn / 0 fail in
  production. Verdict: `manual_sales_ready_with_recorded_warnings`.

## Current Production Status

Production public proof path is live. On 2026-06-11, after pushing
`f984e651` to GitHub `origin/main` and allowing Netlify to deploy,
the live site smoke returned 8 pass / 0 fail for:

- `/`
- `/consultation`
- `/apply`
- `/pricing`
- `/trust-center`
- `/graduates`
- `/parent/demo`
- `/assessment-proof`

Evidence: `_audit/parent-sales-live-production-smoke.md`.

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

Start outreach only when this returns 0 fail. Current warnings are acceptable
only if Alan has assigned a daily Netlify submissions owner and an authorized
manual Stripe invoice/payment-link owner.
