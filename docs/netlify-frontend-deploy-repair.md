# Netlify Frontend Deploy Repair

Use this when GitHub `main` is pushed and CI is green, but
`https://genesisideas.school` or `https://giis.netlify.app` still serves an
older frontend bundle.

This runbook is frontend-only. It does not deploy or restart the Lightsail API.

## Evidence Pattern

Historical stale pattern from 2026-06-16:

- GitHub `origin/main`: `94bc251d` or newer
- GitHub checks for `94bc251d`: build and server-smoke passed
- Production HTML: `static/js/main.d36b323b.js`
- Local post-push build: `static/js/main.5bab1c36.js`
- Verdict from `npm run audit:frontend-deploy`:
  `production_asset_mismatch`

That pattern means the latest reviewed frontend code is pushed, CI is green, and
production Netlify is still serving an older commit or bundle. Treat it as an
abnormal Netlify auto-deploy failure or stale production deploy state, not as a
reason to bypass the normal deployment path.

Recovered healthy pattern from later on 2026-06-16:

- GitHub `HEAD` and `origin/main`: `935fdde0` or newer
- GitHub Actions CI for that SHA: success
- Netlify public site metadata: published production deploy `ready`, branch
  `main`, commit matching current `origin/main`
- Verdict from `npm run audit:frontend-deploy`:
  `production_deploy_matches_origin_main`
- Latest verified production deploy: Netlify site `giis`,
  `repo_url=https://github.com/alanhdchu154/GIIS-website`, deploy title
  `Align public AI copy with human review boundary`, commit
  `935fdde0d444621841957d5aa18b2fee5b6d8fe6`, published at
  `2026-06-16T23:25:15.334Z`

If a future incident repeats the stale pattern, repair the auto-deploy chain
instead of switching to a local-folder deploy.

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
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"
npm run build
npm run audit:frontend-deploy -- --base-url https://genesisideas.school
curl -L -s https://genesisideas.school | rg -o 'static/js/main\.[^" ]+\.js|static/css/main\.[^" ]+\.css'
curl -L -s https://giis.netlify.app | rg -o 'static/js/main\.[^" ]+\.js|static/css/main\.[^" ]+\.css'
gh run list --branch main --limit 5
gh api repos/alanhdchu154/GIIS-website/hooks --jq '.[] | {id,name,active,events}'
node -e "const https=require('https');https.get('https://api.netlify.com/api/v1/sites/genesisideas.school',r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>{const j=JSON.parse(b);const d=j.published_deploy||{};console.log({site:j.name,domain:j.custom_domain,state:d.state,branch:d.branch,commit:d.commit_ref,title:d.title,published_at:d.published_at,skipped:d.skipped,locked:d.locked});});});"
```

Expected healthy state:

- `HEAD` equals `origin/main`.
- GitHub Actions for the current `origin/main` commit are successful.
- Netlify public site metadata reports the published production deploy is
  `ready`, unlocked, unskipped, on branch `main`, and its commit is the current
  `origin/main`; or local `build/index.html` asset refs match production HTML
  asset refs.
- If Netlify and local asset filenames differ, verify production behavior with
  the parent-facing gates below before treating it as stale. Netlify build
  output can differ from a local build even when the published deploy commit is
  current.
- `npm run audit:frontend-deploy` reports
  `production_matches_local_build` or `production_deploy_matches_origin_main`.
- A blank `gh api repos/.../hooks` / `[]` result does not by itself prove
  Netlify is disconnected; Netlify's GitHub App integration may not appear as a
  classic repo webhook. Use Netlify deploy metadata, deploy history, and site
  linkage as the primary integration evidence.

## Netlify Dashboard Checks

In Netlify, inspect site `giis.netlify.app`.

Confirm:

- The site is connected to GitHub repo `alanhdchu154/GIIS-website`.
- Production branch is `main`.
- Build command is read from `netlify.toml` or is effectively
  `react-scripts build`.
- Publish directory is `build`.
- Node version is `20` or matches `netlify.toml`.
- The latest production deploy includes the current reviewed `origin/main`
  commit.
- Recent deploys for pushed `main` commits are present, or their absence is
  explained by a repaired GitHub integration.
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

- Frontend deploy freshness matches the local production build or Netlify
  reports the published production deploy is the current `origin/main` commit.
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
