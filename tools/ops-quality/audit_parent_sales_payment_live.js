#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'parent-sales-payment-live.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'parent-sales-payment-live.json');

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

const BASE_URL = normalizeBaseUrl(argValue('--base-url', 'https://genesisideas.school'));
const API_URL = normalizeBaseUrl(argValue('--api-url', 'https://api.genesisideas.school'));
const REPORT = argValue('--report', DEFAULT_REPORT);
const JSON_REPORT = argValue('--json-report', DEFAULT_JSON_REPORT);

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || 8000));
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function pass(id, message, details = {}) {
  return { id, status: 'pass', message, details };
}

function fail(id, message, details = {}) {
  return { id, status: 'fail', message, details };
}

function warn(id, message, details = {}) {
  return { id, status: 'warn', message, details };
}

function errorDetails(error) {
  return {
    error: error.message,
    cause: error.cause?.message,
    code: error.cause?.code,
  };
}

async function checkProxyTiers() {
  const url = `${BASE_URL}/api/checkout/tiers`;
  try {
    const response = await fetchWithTimeout(url);
    const body = await response.text();
    if (!response.ok) {
      return {
        result: fail('proxy-checkout-tiers', 'Public checkout tiers endpoint is not reachable through the production site proxy.', {
          url,
          status: response.status,
          body: body.slice(0, 300),
        }),
        tiers: null,
      };
    }
    const tiers = JSON.parse(body);
    return {
      result: pass('proxy-checkout-tiers', 'Public checkout tiers endpoint is reachable through the production site proxy.', {
        url,
        status: response.status,
      }),
      tiers,
    };
  } catch (error) {
    return {
      result: fail('proxy-checkout-tiers', 'Public checkout tiers endpoint is not reachable through the production site proxy.', {
        url,
        ...errorDetails(error),
      }),
      tiers: null,
    };
  }
}

function checkTierAvailability(tiers) {
  if (!tiers) {
    return [
      fail('self-paced-price-configured', 'Cannot verify Self-Paced checkout price because tiers endpoint failed.'),
      fail('guided-price-configured', 'Cannot verify Guided checkout price because tiers endpoint failed.'),
      fail('premium-price-configured', 'Cannot verify Premium checkout price because tiers endpoint failed.'),
    ];
  }

  const required = [
    ['self_paced_monthly', 'Self-Paced $49/month'],
    ['guided_monthly', 'Guided $149/month'],
    ['premium_monthly', 'Premium $299/month'],
  ];
  const results = required.map(([key, label]) => {
    const tier = tiers[key];
    if (!tier) return fail(`${key}-configured`, `${label} is missing from /api/checkout/tiers.`, { key });
    if (!tier.public) return fail(`${key}-configured`, `${label} is not marked public in /api/checkout/tiers.`, { key, tier });
    if (!tier.available) {
      return fail(`${key}-configured`, `${label} is visible in pricing but has no Stripe price configured in production.`, {
        key,
        tier,
      });
    }
    return pass(`${key}-configured`, `${label} has a production Stripe price configured.`, { key, tier });
  });

  const annual = tiers.self_paced_annual;
  if (annual && !annual.available) {
    results.push(warn('self-paced-annual-configured', 'Self-Paced annual is listed but has no production Stripe price configured.', {
      key: 'self_paced_annual',
      tier: annual,
    }));
  }
  return results;
}

async function checkDirectApiHealth() {
  const url = `${API_URL}/health`;
  try {
    const response = await fetchWithTimeout(url);
    const body = await response.text();
    if (!response.ok) {
      return fail('direct-api-health', 'Direct API health endpoint is reachable but not healthy.', {
        url,
        status: response.status,
        body: body.slice(0, 300),
      });
    }
    let parsed = null;
    try {
      parsed = JSON.parse(body);
    } catch {
      // Keep parsed null; health still passed by HTTP status.
    }
    return pass('direct-api-health', 'Direct API health endpoint is reachable over HTTPS.', {
      url,
      status: response.status,
      body: parsed || body.slice(0, 300),
    });
  } catch (error) {
    return fail('direct-api-health', 'Direct API health endpoint is not reachable over HTTPS.', {
      url,
      ...errorDetails(error),
    });
  }
}

async function checkWebhookFailClosed() {
  const url = `${API_URL}/api/webhooks/stripe`;
  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    const body = await response.text();
    if (response.status >= 400 && response.status < 500) {
      return pass('stripe-webhook-fail-closed', 'Stripe webhook endpoint is reachable and rejects unsigned requests.', {
        url,
        status: response.status,
        body: body.slice(0, 300),
      });
    }
    return fail('stripe-webhook-fail-closed', 'Stripe webhook endpoint did not fail closed for an unsigned request.', {
      url,
      status: response.status,
      body: body.slice(0, 300),
    });
  } catch (error) {
    return fail('stripe-webhook-fail-closed', 'Stripe webhook endpoint is not reachable over HTTPS.', {
      url,
      ...errorDetails(error),
    });
  }
}

function writeReports(results) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.mkdirSync(path.dirname(JSON_REPORT), { recursive: true });
  const summary = {
    total: results.length,
    pass: results.filter((r) => r.status === 'pass').length,
    warn: results.filter((r) => r.status === 'warn').length,
    fail: results.filter((r) => r.status === 'fail').length,
  };
  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    apiUrl: API_URL,
    summary,
    results,
  };
  fs.writeFileSync(JSON_REPORT, `${JSON.stringify(payload, null, 2)}\n`);

  const lines = [
    '# Parent Sales Payment Live QA',
    '',
    `Generated: ${payload.generatedAt}`,
    `Base URL: ${BASE_URL}`,
    `API URL: ${API_URL}`,
    '',
    `Summary: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail (${summary.total} checks)`,
    '',
    '| Check | Status | Notes |',
    '| --- | --- | --- |',
  ];
  for (const result of results) {
    const details = result.details ? JSON.stringify(result.details).replace(/\|/g, '/') : '';
    lines.push(`| ${result.id} | ${result.status} | ${result.message}${details ? `<br><code>${details}</code>` : ''} |`);
  }
  fs.writeFileSync(REPORT, `${lines.join('\n')}\n`);
  return summary;
}

(async () => {
  const results = [];
  const { result: tierResult, tiers } = await checkProxyTiers();
  results.push(tierResult);
  results.push(...checkTierAvailability(tiers));
  results.push(await checkDirectApiHealth());
  results.push(await checkWebhookFailClosed());

  const summary = writeReports(results);
  console.log(`Parent sales payment live QA: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail (${summary.total} checks)`);
  console.log(`Report: ${path.relative(ROOT, REPORT)}`);
  console.log(`JSON: ${path.relative(ROOT, JSON_REPORT)}`);
  for (const result of results.filter((r) => r.status === 'fail')) {
    console.log(`\n[FAIL] ${result.id}`);
    console.log(`  ${result.message}`);
    if (result.details) console.log(`  ${JSON.stringify(result.details)}`);
  }
  if (summary.fail) process.exit(1);
})();
