# Netlify Frontend Deploy Repair

Use this when GitHub `main` is pushed and CI is green, but
`https://genesisideas.school` or `https://giis.netlify.app` still serves an
older frontend bundle.

This runbook is frontend-only. It does not deploy or restart the Lightsail API.

## Current Evidence Pattern

Known stale pattern on 2026-06-16:

- GitHub `origin/main`: `94bc251d` or newer
- GitHub checks for `94bc251d`: build and server-smoke passed
- Production HTML: `static/js/main.d36b323b.js`
- Local post-push build: `static/js/main.5bab1c36.js`
- Verdict from `npm run audit:frontend-deploy`:
  `production_asset_mismatch`

This means the latest reviewed frontend code is pushed, CI is green, and
production Netlify is still serving an older bundle. That is an abnormal
Netlify auto-deploy failure or stale production deploy state, not the normal
deployment path.

## Auto-Deploy Contract

The canonical frontend deploy path is:

```text
reviewed local main -> git push origin main -> Netlify production deploy
```

Pushing `origin/main` should automatically trigger the Netlify production
deploy for `genesisideas.school` / `giis.netlify.app`. If production remains on
an older bundle after GitHub `main` is current and CI is green, investigate why
Netlify did not build or publish the latest reviewed commit.

Do not replace this contract with an unreviewed local folder deploy. If a retry
is needed after the integration is fixed, retry or redeploy only the latest
reviewed `origin/main` commit.

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
gh run list --branch main --limit 5
gh api repos/alanhdchu154/GIIS-website/hooks --jq '.[] | {id,name,active,events}'
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
- Build command is read from `netlify.toml` or is effectively
  `react-scripts build`.
- Publish directory is `build`.
- Node version is `20` or matches `netlify.toml`.
- The latest production deploy includes commit `94bc251d` or the current
  `origin/main`.
- Recent deploys for `23f2d65b`, `10bdb5e2`, `94bc251d`, or newer commits are
  present, or their absence is explained by a repaired GitHub integration.
- No deploy for the current commit is failed, skipped, canceled, locked behind
  deploy previews, or stuck in building/pending state.
- Auto publishing is enabled for the production branch.

If Netlify has no deploy for the latest GitHub `main` commit, repair the
GitHub integration first:

- Confirm the Netlify site is linked to `alanhdchu154/GIIS-website`, not an old
  repo, fork, or disconnected copy.
- Reconnect the Netlify GitHub app or repository linkage if it no longer
  receives push events.
- Check whether deploys are ignored by branch settings, build plugins, ignored
  build commands, locked deploys, or paused builds.
- If the GitHub webhook/app install is stale, reinstall or reauthorize it from
  Netlify/GitHub, then push a reviewed no-op or retry the latest production
  deploy from `origin/main`.

Only use the Netlify dashboard to retry/redeploy a reviewed GitHub commit after
confirming the site linkage and production branch. Do not deploy an unreviewed
local folder or a branch that is not `origin/main`.

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
