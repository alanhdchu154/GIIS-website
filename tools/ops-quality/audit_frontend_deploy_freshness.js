#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const http = require('http');
const https = require('https');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'frontend-deploy-freshness.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'frontend-deploy-freshness.json');

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

const BASE_URL = normalizeBaseUrl(argValue('--base-url', 'https://genesisideas.school'));
const EXPECTED_INDEX = argValue('--expected-index', path.join(ROOT, 'build', 'index.html'));
const REPORT = argValue('--report', DEFAULT_REPORT);
const JSON_REPORT = argValue('--json-report', DEFAULT_JSON_REPORT);

function assetRefs(html) {
  const refs = new Set();
  const regex = /(?:src|href)=["']\/?(static\/(?:js|css)\/[^"']+\.(?:js|css))["']/g;
  let match;
  while ((match = regex.exec(html))) refs.add(match[1]);
  return Array.from(refs).sort();
}

function fetchText(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const request = client.get(url, { headers: { 'User-Agent': 'giis-frontend-deploy-freshness/1.0' } }, (response) => {
      const location = response.headers.location;
      if (location && response.statusCode >= 300 && response.statusCode < 400 && redirects > 0) {
        response.resume();
        const nextUrl = new URL(location, url).toString();
        fetchText(nextUrl, redirects - 1).then(resolve, reject);
        return;
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        resolve({ status: response.statusCode, headers: response.headers, body });
      });
    });
    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy(new Error(`Timed out fetching ${url}`));
    });
  });
}

function gitSha(ref) {
  try {
    return execSync(`git rev-parse ${ref}`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

async function netlifySiteFor(baseUrl) {
  const host = new URL(baseUrl).hostname;
  if (host === 'localhost' || host === '127.0.0.1') return null;
  try {
    const response = await fetchText(`https://api.netlify.com/api/v1/sites/${host}`);
    if (!response.status || response.status >= 400) return null;
    return JSON.parse(response.body);
  } catch {
    return null;
  }
}

function summarize(expectedRefs, productionRefs, expectedExists, fetchStatus, netlifySite, expectedGitSha) {
  const missingFromProduction = expectedRefs.filter((ref) => !productionRefs.includes(ref));
  const extraInProduction = productionRefs.filter((ref) => !expectedRefs.includes(ref));
  const deploy = netlifySite?.published_deploy || null;
  const deployMatchesGit = Boolean(
    deploy?.state === 'ready' &&
    deploy?.branch === 'main' &&
    expectedGitSha &&
    deploy.commit_ref === expectedGitSha &&
    !deploy.skipped &&
    !deploy.locked,
  );
  const exactMatch = expectedExists && fetchStatus && fetchStatus < 400 && missingFromProduction.length === 0 && extraInProduction.length === 0;
  if (exactMatch || deployMatchesGit) {
    return {
      status: 'pass',
      summary: { total: 1, pass: 1, warn: 0, fail: 0 },
      verdict: exactMatch ? 'production_matches_local_build' : 'production_deploy_matches_origin_main',
      missingFromProduction,
      extraInProduction,
      deployMatchesGit,
    };
  }
  return {
    status: 'warn',
    summary: { total: 1, pass: 0, warn: 1, fail: 0 },
    verdict: expectedExists ? 'production_asset_mismatch' : 'local_build_missing',
    missingFromProduction,
    extraInProduction,
    deployMatchesGit,
  };
}

function writeReports(payload) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.mkdirSync(path.dirname(JSON_REPORT), { recursive: true });
  fs.writeFileSync(JSON_REPORT, `${JSON.stringify(payload, null, 2)}\n`);

  const result = payload.results[0];
  const deploy = payload.netlifyDeploy || {};
  const site = payload.netlifySite || {};
  const lines = [
    '# Frontend Deploy Freshness',
    '',
    `Generated: ${payload.generatedAt}`,
    `Base URL: ${payload.baseUrl}`,
    `Expected index: ${payload.expectedIndex}`,
    `Expected git sha: ${payload.expectedGitSha || 'unknown'}`,
    `Netlify deploy sha: ${deploy.commit_ref || 'unknown'}`,
    `Verdict: ${payload.verdict}`,
    '',
    '## Netlify Published Deploy',
    '',
    `- Site: ${site.name || 'unknown'}`,
    `- Custom domain: ${site.custom_domain || 'unknown'}`,
    `- Repo URL: ${site.repo_url || 'unknown'}`,
    `- Admin URL: ${site.admin_url || 'unknown'}`,
    `- Deploy state: ${deploy.state || 'unknown'}`,
    `- Deploy branch: ${deploy.branch || 'unknown'}`,
    `- Deploy title: ${deploy.title || 'unknown'}`,
    `- Published at: ${deploy.published_at || 'unknown'}`,
    `- Skipped: ${deploy.skipped == null ? 'no' : deploy.skipped}`,
    `- Locked: ${deploy.locked == null ? 'no' : deploy.locked}`,
    '',
    '## Asset Comparison',
    '',
    `- Expected assets: ${payload.expectedRefs.length ? payload.expectedRefs.join(', ') : 'none'}`,
    `- Production assets: ${payload.productionRefs.length ? payload.productionRefs.join(', ') : 'none'}`,
    '',
    `Status: ${result.status.toUpperCase()}`,
    result.message,
    '',
  ];
  fs.writeFileSync(REPORT, `${lines.join('\n')}\n`);
}

async function main() {
  const expectedExists = fs.existsSync(EXPECTED_INDEX);
  const expectedHtml = expectedExists ? fs.readFileSync(EXPECTED_INDEX, 'utf8') : '';
  const expectedRefs = assetRefs(expectedHtml);
  const production = await fetchText(BASE_URL);
  const productionRefs = assetRefs(production.body);
  const expectedGitSha = gitSha('origin/main') || gitSha('HEAD');
  const netlifySite = await netlifySiteFor(BASE_URL);
  const comparison = summarize(expectedRefs, productionRefs, expectedExists, production.status, netlifySite, expectedGitSha);

  const message = comparison.status === 'pass'
    ? comparison.verdict === 'production_matches_local_build'
      ? 'Production HTML references the same static JS/CSS assets as the local production build.'
      : 'Netlify reports the published production deploy is the current origin/main commit; local and Netlify asset filenames differ, so use deploy metadata plus production behavior gates as freshness evidence.'
    : expectedExists
      ? 'Production HTML does not reference the same static JS/CSS assets as the local production build; GitHub main push should auto-trigger Netlify production, so inspect the Netlify GitHub integration, build trigger, and production deploy state.'
      : 'Local build/index.html is missing; run npm run build before using this freshness check as deploy evidence.';

  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    expectedIndex: EXPECTED_INDEX,
    expectedGitSha,
    verdict: comparison.verdict,
    summary: comparison.summary,
    netlifySite: netlifySite ? {
      name: netlifySite.name || '',
      id: netlifySite.id || netlifySite.site_id || '',
      custom_domain: netlifySite.custom_domain || '',
      ssl_url: netlifySite.ssl_url || '',
      admin_url: netlifySite.admin_url || '',
      repo_url: netlifySite.repo_url || '',
    } : null,
    netlifyDeploy: netlifySite?.published_deploy ? {
      id: netlifySite.published_deploy.id || '',
      state: netlifySite.published_deploy.state || '',
      branch: netlifySite.published_deploy.branch || '',
      commit_ref: netlifySite.published_deploy.commit_ref || '',
      title: netlifySite.published_deploy.title || '',
      published_at: netlifySite.published_deploy.published_at || '',
      deploy_time: netlifySite.published_deploy.deploy_time || null,
      skipped: netlifySite.published_deploy.skipped || null,
      locked: netlifySite.published_deploy.locked || null,
    } : null,
    expectedRefs,
    productionRefs,
    productionStatus: production.status,
    productionHeaders: {
      etag: production.headers.etag || '',
      age: production.headers.age || '',
      cacheStatus: production.headers['cache-status'] || '',
      xNfRequestId: production.headers['x-nf-request-id'] || '',
    },
    results: [{
      id: 'frontend-deploy-freshness',
      status: comparison.status,
      message,
      details: {
        missingFromProduction: comparison.missingFromProduction,
        extraInProduction: comparison.extraInProduction,
      },
    }],
  };

  writeReports(payload);
  console.log(`Frontend deploy freshness: ${payload.verdict}`);
  console.log(`Expected: ${expectedRefs.join(', ') || 'none'}`);
  console.log(`Production: ${productionRefs.join(', ') || 'none'}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
