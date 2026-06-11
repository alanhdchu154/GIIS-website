# Production Payment Deploy Runbook

Last updated: 2026-06-11

Use this runbook before deploying the current parent-conversion / payment stack
to the production Lightsail API. This is the gating path for taking real parent
payments safely.

## Scope

This runbook covers the backend pieces that can affect payment, access, and
parent trust:

- Stripe checkout and webhook handling
- `ProcessedStripeEvent` Prisma table for webhook idempotency
- explicit production `CORS_ORIGIN`
- weekly parent report backend route
- paid-but-unlinked subscription visibility

Netlify frontend deploy is separate. Pushing the repo can update the frontend,
but it does not update the Lightsail API.

## Current Production Blockers

Do not deploy the backend until all are true:

- production database has a fresh backup
- production `server/.env` has `STRIPE_SECRET_KEY`
- production `server/.env` has `STRIPE_WEBHOOK_SECRET`
- production `server/.env` has `STRIPE_PRICE_GUIDED_MONTHLY`
- production `server/.env` has `STRIPE_PRICE_PREMIUM_MONTHLY`
- production `server/.env` has explicit `CORS_ORIGIN=https://genesisideas.school`
- production `server/.env` does not use `ALLOW_UNVERIFIED_STRIPE_WEBHOOK=1`
- `https://api.genesisideas.school/health` is reachable over HTTPS
- `https://api.genesisideas.school/api/webhooks/stripe` is reachable over HTTPS
  and rejects unsigned requests
- production database has the `ProcessedStripeEvent` table
- API restart is followed by health, checkout, webhook, and admin subscription
  smoke checks

Related setup docs:

- `docs/stripe-live-price-setup.md` for live Stripe Price IDs.
- `docs/production-api-proxy-repair.md` for nginx / HTTPS repair when
  `api.genesisideas.school` is unreachable.
- `npm run audit:production-api-proxy` for a read-only proxy/HTTPS preflight
  before and after nginx repair.
- `npm run audit:production-payment-env` for a read-only production `.env` /
  `ProcessedStripeEvent` preflight without printing secret values.

## Safe Sequence

Run these from the Lightsail server or another trusted machine that can reach
the production database.

1. Confirm target and freeze risky admin actions.

   ```bash
   pwd
   git status --short
   grep -E 'NODE_ENV|CORS_ORIGIN|DATABASE_URL|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|STRIPE_PRICE_|ALLOW_UNVERIFIED_STRIPE_WEBHOOK' server/.env
   ```

   Stop if `DATABASE_URL` points anywhere other than the intended production
   Postgres database.

   From the local repo, run the read-only preflight before editing:

   ```bash
   npm run audit:production-payment-env
   npm run audit:production-api-proxy
   ```

   These commands must not print secret values. They should identify missing
   env variables, missing `ProcessedStripeEvent`, stale nginx upstreams, and
   HTTPS listener problems.

2. Back up production Postgres.

   ```bash
   mkdir -p server/tmp/db-backups
   pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl \
     > "server/tmp/db-backups/giis-prod-$(date +%Y%m%d-%H%M%S).dump"
   ```

   Keep the dump off git. Do not copy it into tracked folders.

3. Pull code and install.

   ```bash
   git fetch origin
   git status --short
   git pull --ff-only origin main
   cd server
   npm ci
   npm run postinstall
   ```

4. Apply Prisma schema.

   The repo currently does not have committed Prisma migrations, so use
   `db:push` for this deploy. Do not run `npm run db:seed` on production.

   ```bash
   npm run db:push
   ```

5. Verify the new webhook idempotency table exists.

   ```bash
   psql "$DATABASE_URL" -c "select to_regclass('\"ProcessedStripeEvent\"') as processed_stripe_event_table;"
   ```

   Expected: `ProcessedStripeEvent`, not blank.

6. Restart the API.

   Use the production process manager already installed on Lightsail. Examples:

   ```bash
   pm2 restart giis-transcript-api
   pm2 logs giis-transcript-api --lines 80
   ```

   If PM2 is not the active process manager, use the current service wrapper.
   Do not start a second API process on the same port.

7. Production smoke.

   ```bash
   curl -fsS https://api.genesisideas.school/health
   curl -fsS https://genesisideas.school/api/checkout/tiers
   ```

   Then run the production payment-readiness gate from the repo:

   ```bash
   npm run audit:sales-payment-live
   ```

   Expected before sending checkout links: 0 fail. A failing result means the
   public proof path may be live, but automated payment launch is not ready.

   Then verify in browser:

   - `/consultation` renders and the Netlify form appears
   - `/graduates` renders conservative student outcomes
   - `/admin/subscriptions` shows paid-but-unlinked count when applicable
   - `/admin/weekly-report` can dry-run drafts after admin login

8. Stripe webhook smoke.

   In Stripe Dashboard, confirm the endpoint is:

   ```text
   https://api.genesisideas.school/api/webhooks/stripe
   ```

   Confirm it uses the same `whsec_...` value stored in production
   `STRIPE_WEBHOOK_SECRET`. Send a test event from the Dashboard and confirm:

   - signed test event returns 200
   - unsigned requests are rejected
   - duplicate event delivery is skipped after the first successful processing

## Frontend-Only Deploy Verdict

Frontend-only Netlify deploy may happen before the Lightsail backend deploy if
the goal is to publish the pre-payment proof path:

- `/consultation`
- `/graduates`
- pricing / trust / admission links into consultation

But frontend-only deploy does not make these backend features live:

- weekly parent report send/review API
- webhook idempotency
- stricter production CORS startup behavior
- paid-but-unlinked subscription alerting

After a frontend-only deploy, do not tell parents that weekly reports or new
payment safety behavior are production-live until the backend runbook above is
complete.

## Rollback

Frontend rollback: use Netlify deploy rollback.

Backend rollback:

1. revert the API code to the prior commit
2. restart the API process
3. leave `ProcessedStripeEvent` table in place unless a database expert confirms
   it is safe to drop; the table is additive and harmless to old code

If webhook handling fails, temporarily disable the Stripe webhook endpoint in
Stripe Dashboard rather than accepting unsigned events.
