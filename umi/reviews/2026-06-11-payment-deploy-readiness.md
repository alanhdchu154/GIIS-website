# Review: Payment Deploy Readiness

## Verdict

- Revise before backend deploy.
- Frontend-only Netlify deploy is acceptable for the pre-payment proof path, but
  it does not make backend payment safety or weekly-report APIs live.

## Findings

- Severity: blocker
- File or behavior: `server/src/routes/webhooks-stripe.js`
- Why it matters: when `STRIPE_WEBHOOK_SECRET` was configured but
  `stripe-signature` was missing, the route could parse the raw JSON body
  without verification. Production must reject unsigned webhook requests.
- Fix: added `resolveWebhookVerificationMode()` and Jest coverage so only
  signed events are accepted when a signing secret exists; unverified parsing is
  limited to non-production with `ALLOW_UNVERIFIED_STRIPE_WEBHOOK=1`.

- Severity: blocker before backend deploy
- File or behavior: `server/prisma/schema.prisma`
- Why it matters: webhook idempotency now depends on `ProcessedStripeEvent`.
  Production will return 500 on webhook idempotency lookup until that table
  exists.
- Fix: documented backup + `npm run db:push` + table verification sequence in
  `docs/production-payment-deploy-runbook.md`.

- Severity: major
- File or behavior: `server/DEPLOY-LIGHTSAIL.md`
- Why it matters: the old deploy doc still read like early prototyping and did
  not clearly gate production Stripe/webhook env variables or warn against
  seeding production.
- Fix: linked the payment deploy runbook, added Stripe/CORS env requirements,
  and marked `db:seed` as development-only.

- Severity: major
- File or behavior: Claude Code orchestration
- Why it matters: two read-only `claude -p --model opus` deploy-review attempts
  stalled with no output and were killed (`code 143`). Treat this as a cc tool
  issue, not as approval.
- Fix: Codex/Umi completed the review directly and narrowed the deploy blockers
  into code, docs, and roadmap updates.

## GIIS Lens

- Trust: webhook signature handling must fail closed before real parents pay.
- Transparency: deploy sequence now names what is live after frontend-only vs
  backend deploy.
- Results: no direct course-result change.
- Operations: runbook gives a repeatable path for schema, env, restart, and
  smoke checks.

## Verification

- `npm test -- webhooks-stripe.test.js --runInBand`
- `npm test -- --runInBand` — 40/40 server tests pass
- `npx prisma validate`
- `npm run audit:public-trust-claims` — 41 files pass
- `CI=true BUILD_PATH=/tmp/giis-build-payment-ready npm run build`
- `npm run audit:ops-browser` — 14 pass / 0 fail against the payment-ready
  build
- Pending before backend deploy: production backup, `npm run db:push`, table
  verification, Lightsail restart, Stripe signed/unsigned webhook smoke.

## Roadmap Status

- Updated.
