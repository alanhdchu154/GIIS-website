# Parent Sales Launch Checklist

Last updated: 2026-06-11

This checklist is the Alan-facing go/no-go list for starting the parent sales
motion. It separates the low-risk public proof launch from the higher-risk
backend payment/access launch.

## Current Local Readiness

Local evidence is green:

- `npm run audit:sales-launch` — 23/23 pass
- `npm run audit:ops-browser -- --base-url http://localhost:3030` — 22 pass / 0 fail, including consultation, contact, and apply form submit success on desktop/mobile
- `npm run audit:public-trust-claims` — 41 files pass
- server Jest — 40/40 pass
- `npx prisma validate` — pass
- production build — pass with `BUILD_PATH=/tmp/giis-build-apply-submit`
- admissions consultation response SOP — `docs/admissions-consultation-response-sop.md`
- local production-proof smoke command available:
  `npm run audit:sales-live -- --base-url http://localhost:3030` — 8/8 pass

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

- weekly parent report send/review API
- Stripe webhook idempotency
- new paid-but-unlinked subscription alerting
- stricter production CORS startup behavior
- production `ProcessedStripeEvent` table

## Commit Stack Classification

Local `main` is ahead of `origin/main`. Pushing it to GitHub `origin/main` will
trigger Netlify frontend deployment, but it will not automatically restart the
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

Before frontend-only deploy:

- Confirm Netlify should receive the current local `main` stack even though it
  also contains backend code not yet deployed on Lightsail.
- Configure Netlify notifications for forms `consultation` and `contact` to
  `admissions@genesisideas.school`.
- Confirm who owns first response, WeChat follow-up, and principal escalation
  for consultation requests.
- After deploy, submit one test consultation form and one test contact form;
  confirm both emails arrive.
- Run `npm run audit:sales-live -- --base-url https://genesisideas.school` and
  confirm 8/8 public proof routes pass in production.
- Spot-check `/consultation`, `/apply`, `/graduates`, `/pricing`,
  `/trust-center`, and `/parent/demo` in production if the live smoke flags a
  copy or rendering mismatch.

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
- Run production DB backup and `npm run db:push`.
- Verify `ProcessedStripeEvent` exists.
- Restart the Lightsail API and run production smoke.
- Send signed and unsigned Stripe webhook test events.

## Current Recommendation

Use a two-step launch:

1. Push/deploy frontend proof path first so admissions can start conversations.
2. Deploy backend payment/access changes in a separate controlled window.

This lets GIIS start selling through consultation and path review without
pretending that the new backend payment safety behavior is already live.
