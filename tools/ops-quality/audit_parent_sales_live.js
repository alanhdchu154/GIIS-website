#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'parent-sales-live-smoke.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'parent-sales-live-smoke.json');

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

const BASE_URL = normalizeBaseUrl(argValue('--base-url', 'https://genesisideas.school'));
const REPORT = argValue('--report', DEFAULT_REPORT);
const JSON_REPORT = argValue('--json-report', DEFAULT_JSON_REPORT);

const ROUTES = [
  {
    path: '/',
    name: 'homepage',
    expected: [
      'Book a Free Consultation',
      'Talk to the school before you apply.',
      'No payment is collected until the enrollment path is reviewed.',
      'Before You Pay',
      'Open Trust Center',
    ],
  },
  {
    path: '/consultation',
    name: 'consultation',
    expected: [
      'Talk to the school before you decide.',
      'Book a free consultation',
      'Student situation',
      'Transcript available?',
      'Desired start timing',
    ],
  },
  {
    path: '/apply',
    name: 'apply',
    expected: [
      'Know the right path before you pay.',
      'Before You Submit',
      'After You Submit',
      'New student',
      'Transfer student',
      'No payment is collected here',
    ],
  },
  {
    path: '/pricing',
    name: 'pricing',
    expected: [
      'Start with the path review, not checkout.',
      '$149',
      'Transfer Family Default',
      'Apply first',
    ],
  },
  {
    path: '/trust-center',
    name: 'trust center',
    expected: [
      'Trust Center',
      'Talk to the principal first',
      'Florida-registered private school',
      '24-credit framework',
    ],
  },
  {
    path: '/graduates',
    name: 'graduate stories',
    expected: [
      'Four students. Four years. Four transcripts you can trace.',
      'Reported offers',
      'UC Santa Barbara',
      'GIIS does not guarantee admission results',
    ],
  },
  {
    path: '/parent/demo',
    name: 'parent demo',
    expected: [
      'Sample Preview',
      "Yunfan's progress this week",
      'Guided support is $149/month',
      'Weekly Insights',
      'Assessment & Feedback',
    ],
  },
  {
    path: '/assessment-proof',
    name: 'assessment proof',
    expected: [
      'Assessment Proof',
      'Assignment',
      'Quiz',
      'Midterm',
    ],
  },
];

function includesText(pageText, expected) {
  const normalized = pageText.replace(/\s+/g, ' ').trim();
  return normalized.toLowerCase().includes(String(expected).toLowerCase());
}

async function checkRoute(browser, route) {
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const errors = [];
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page.addInitScript(() => {
    window.localStorage.setItem('giis-language', 'en');
  });

  const url = `${BASE_URL}${route.path}`;
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const status = response ? response.status() : null;
    if (!response || status >= 400) {
      errors.push(`HTTP status ${status || 'unknown'}`);
    }
    await page.waitForSelector('body', { timeout: 10000 });
    await page.waitForTimeout(250);
    const title = await page.title();
    const text = await page.locator('body').innerText({ timeout: 10000 });
    for (const expected of route.expected) {
      if (!includesText(text, expected)) errors.push(`Missing text: ${expected}`);
    }
    if (consoleErrors.length) {
      errors.push(`Console errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
    }
    await page.close();
    return { ...route, url, status, title, ok: errors.length === 0, errors };
  } catch (error) {
    await page.close().catch(() => {});
    return { ...route, url, status: null, title: '', ok: false, errors: [error.message] };
  }
}

function writeReports(results) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.mkdirSync(path.dirname(JSON_REPORT), { recursive: true });
  const summary = {
    total: results.length,
    pass: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
  };
  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary,
    results,
  };
  fs.writeFileSync(JSON_REPORT, `${JSON.stringify(payload, null, 2)}\n`);

  const lines = [
    '# Parent Sales Live Smoke QA',
    '',
    `Generated: ${payload.generatedAt}`,
    `Base URL: ${BASE_URL}`,
    '',
    `Summary: ${summary.pass} pass / ${summary.fail} fail (${summary.total} route checks)`,
    '',
    '| Route | Status | Notes |',
    '| --- | --- | --- |',
  ];
  for (const result of results) {
    const notes = result.ok ? `HTTP ${result.status}` : result.errors.join('; ').replace(/\|/g, '/');
    lines.push(`| ${result.path} | ${result.ok ? 'pass' : 'fail'} | ${notes} |`);
  }
  fs.writeFileSync(REPORT, `${lines.join('\n')}\n`);
  return summary;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const route of ROUTES) {
    results.push(await checkRoute(browser, route));
  }
  await browser.close();

  const summary = writeReports(results);
  console.log(`Parent sales live smoke QA: ${summary.pass} pass / ${summary.fail} fail (${summary.total} route checks)`);
  console.log(`Report: ${path.relative(ROOT, REPORT)}`);
  console.log(`JSON: ${path.relative(ROOT, JSON_REPORT)}`);
  for (const result of results.filter((r) => !r.ok)) {
    console.log(`\n[FAIL] ${result.path}`);
    for (const error of result.errors) console.log(`  - ${error}`);
  }
  if (summary.fail) process.exit(1);
})();
