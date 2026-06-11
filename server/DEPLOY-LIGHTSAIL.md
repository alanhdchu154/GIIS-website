# Transcript API on AWS Lightsail

This server is a plain Node.js + Express + Prisma app. **PostgreSQL** is required (same as local Docker).

For the current parent-payment stack, read
`docs/production-payment-deploy-runbook.md` before touching production. That
runbook is the source of truth for Stripe webhook / Prisma / Lightsail
sequencing.

## Architecture (typical)

| Piece | Options on Lightsail |
|--------|------------------------|
| API | Ubuntu instance running Node (`node src/index.js` or PM2) |
| Database | **Lightsail PostgreSQL** (managed) *or* Postgres on the same instance |
| Frontend (CRA) | Static build on Lightsail, S3+CloudFront, or Netlify — set `REACT_APP_API_URL` to the API’s public URL |

Keep the database **private**: only allow the API security group / localhost to port `5432`, not the whole internet.

## Environment on the server

1. Copy `server/.env.example` → `server/.env` on the instance.
2. Set **`DATABASE_URL`** to your Postgres connection string.  
   Managed AWS/Lightsail DBs usually need **`sslmode=require`** (see comments in `.env.example`).
3. Set a strong **`JWT_SECRET`** (e.g. `openssl rand -hex 32`).
4. Set **`CORS_ORIGIN`** to your live site, e.g. `https://genesisideas.school` (comma-separated if multiple).
5. If the API is behind the Lightsail load balancer or nginx with HTTPS, set **`TRUST_PROXY=1`**.
6. Set **`STRIPE_SECRET_KEY`** and **`STRIPE_WEBHOOK_SECRET`** before enabling
   production checkout/webhooks. Never set `ALLOW_UNVERIFIED_STRIPE_WEBHOOK=1`
   in production.

## First deploy (schema)

From `server/` on the machine that can reach the database:

```bash
npm ci
npx prisma generate
# Early prototyping only (no migration history):
# npm run db:push
#
# Recommended once you have real data:
# 1) Create migrations in dev:   npm run db:migrate:dev
# 2) Apply in production:        npm run db:migrate:deploy
#
# For a brand-new production database, `migrate deploy` will create tables based on committed migrations.
npm run db:push

# Optional demo admin + demo students (development only; do not run against
# current production or live-like graduate/student records)
npm run db:seed
npm start
```

For ongoing changes, prefer **Prisma migrations** (`migrate dev` /
`migrate deploy`) instead of `db push` once migrations are committed. This repo
currently still has no committed migration history, so production schema updates
must be handled deliberately with a backup + `npm run db:push`; see
`docs/production-payment-deploy-runbook.md`.

## Current Payment-Safe Deploy Checklist

Before deploying payment/webhook changes:

1. Back up production Postgres.
2. Confirm production env:
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://genesisideas.school`
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...`
   - no `ALLOW_UNVERIFIED_STRIPE_WEBHOOK=1`
3. Run `npm run db:push` from `server/` to create additive schema such as
   `ProcessedStripeEvent`.
4. Verify:
   `psql "$DATABASE_URL" -c "select to_regclass('\"ProcessedStripeEvent\"');"`
5. Restart the single production API process.
6. Smoke:
   - `curl -fsS https://api.genesisideas.school/health`
   - `curl -fsS https://genesisideas.school/api/checkout/tiers`
   - signed Stripe Dashboard test event returns 200
   - unsigned webhook requests are rejected

## Frontend (CRA)

Build with the **public API URL** baked in:

```bash
REACT_APP_API_URL=https://api.your-domain.com npm run build
```

Use the same origin scheme (`https://`) as in `CORS_ORIGIN` on the API.

## Local vs AWS summary

| | Local | Lightsail |
|---|--------|-----------|
| Postgres | `docker compose up -d` (repo root) | Managed DB or self-hosted |
| `DATABASE_URL` | `localhost:5432` (see `.env.example`) | Hostname from AWS console + SSL params if required |
| `CORS_ORIGIN` | `http://localhost:3000` | `https://your-site` |
