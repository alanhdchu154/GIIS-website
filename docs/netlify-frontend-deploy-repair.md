# Netlify Frontend Deploy Repair

Use this when GitHub `main` is pushed and CI is green, but
`https://genesisideas.school` or `https://giis.netlify.app` still serves an
older frontend bundle.

This runbook is frontend-only. It does not deploy or restart the Lightsail API.

## Current Evidence Pattern

Known stale pattern on 2026-06-16:

- GitHub `origin/main`: `10bdb5e2`
- GitHub checks for `10bdb5e2`: build and server-smoke passed
- Production HTML: `static/js/main.d36b323b.js`
- Local post-push build: `static/js/main.5bab1c36.js`
- Verdict from `npm run audit:frontend-deploy`:
  `production_asset_mismatch`

This means the latest reviewed frontend code is pushed but not verified live on
Netlify.

## Read-Only Checks

From the repo:

```bash
git status --short --branch
git rev-parse --short HEAD
git rev-parse --short origin/main
npm run build
npm run audit:frontend-deploy -- --base-url https://genesisideas.school
curl -L -s https://genesisideas.school | rg -o 'static/js/main\.[^" ]+\.js|static/css/main\.[^" ]+\.css'
curl -L -s https://giis.netlify.app | rg -o 'static/js/main\.[^" ]+\.js|static/css/main\.[^" ]+\.css'
```

Expected healthy state:

- `HEAD` equals `origin/main`.
- Local `build/index.html` asset refs match production HTML asset refs.
- `npm run audit:frontend-deploy` reports
  `production_matches_local_build`.

## Netlify Dashboard Checks

In Netlify, inspect site `giis.netlify.app`.

Confirm:

- The site is connected to GitHub repo `alanhdchu154/GIIS-website`.
- Production branch is `main`.
- Build command is `react-scripts build` or uses `netlify.toml`.
- Publish directory is `build`.
- Node version is `20` or matches `netlify.toml`.
- The latest deploy includes commit `10bdb5e2` or the current `origin/main`.
- No deploy is stuck, canceled, skipped, or failing silently.

If no deploy exists for the latest commit, trigger a deploy from the Netlify
dashboard using the latest `main` commit. Do not deploy an unreviewed local
folder or a branch that is not `origin/main`.

## After Repair

Run:

```bash
npm run audit:frontend-deploy -- --base-url https://genesisideas.school
npm run audit:conversion-bilingual -- --base-url https://genesisideas.school
npm run audit:parent-journey -- --base-url https://genesisideas.school
npm run school:ops-report -- --report /tmp/giis-school-ops-after-netlify.md --json-report /tmp/giis-school-ops-after-netlify.json
```

Success criteria:

- Frontend deploy freshness matches the local production build.
- Chinese conversion smoke passes in production.
- Parent journey passes in production.
- `school:ops-report` remains `manual_sales_go_with_payment_boundary` or a
  stricter safe verdict with explicit reasons.

## Boundaries

- Do not send automated checkout links because of a frontend deploy.
- Do not claim Guided or Premium checkout is live until
  `npm run audit:sales-payment-live` has 0 fail.
- Do not run backend deploy, Prisma changes, API restart, or Stripe webhook
  changes from this runbook.
- If the frontend deploy needs rollback, use Netlify deploy rollback to the last
  verified deploy, then rerun the checks above.
