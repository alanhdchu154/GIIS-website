#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'parent-journey-acceptance.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'parent-journey-acceptance.json');

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

const CHECKS = [
  {
    id: 'homepage-decision-path',
    question: 'Can a parent find the pre-payment decision path from the homepage?',
    path: '/',
    evidence: [
      'Book a Free Consultation',
      'Before You Pay',
      'Open Trust Center',
      'No payment is collected until the enrollment path is reviewed.',
    ],
  },
  {
    id: 'legal-status-proof',
    question: 'Can a parent verify what kind of school GIIS is?',
    path: '/trust-center',
    evidence: [
      'Florida-registered private school',
      '24-credit graduation framework',
      'CEEB status: applied and pending',
      'Official transcript workflow',
      'Talk to the principal first',
    ],
  },
  {
    id: 'learning-evidence-proof',
    question: 'Can a parent inspect concrete academic work before paying?',
    path: '/assessment-proof',
    evidence: [
      'Assessment Proof',
      'Assignment',
      'Quiz',
      'Midterm',
      'Final',
      'Rubric',
    ],
  },
  {
    id: 'parent-visibility-proof',
    question: 'Can a parent see what they will monitor after enrollment?',
    path: '/parent/demo',
    evidence: [
      'SAMPLE PREVIEW',
      'Weekly Insights',
      'Assessment & Feedback',
      'Missing-work risk flag',
      'Parents see advisor-approved summaries only',
    ],
  },
  {
    id: 'pricing-default-proof',
    question: 'Can a transfer family understand the recommended paid plan?',
    path: '/pricing',
    evidence: [
      'Start with the path review, not checkout.',
      'Guided',
      '$149',
      'Transfer Family Default',
      'Monthly advisor check-in',
      '30-day full refund',
    ],
  },
  {
    id: 'apply-path-proof',
    question: 'Can a family understand new-student vs transfer-student requirements?',
    path: '/apply',
    evidence: [
      'Know the right path before you pay.',
      'New student',
      'Transfer student',
      'No payment is collected here',
      'within one business day',
      'official transcripts or verifiable school records',
    ],
  },
  {
    id: 'human-contact-proof',
    question: 'Can a family reach the school before applying or paying?',
    path: '/consultation',
    evidence: [
      'Talk to the school before you decide.',
      'Book a free consultation',
      'Student situation',
      'Transcript available?',
      'Desired start timing',
      'admissions@genesisideas.school',
    ],
  },
];

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function includesEvidence(pageText, expected) {
  return normalizeText(pageText).includes(normalizeText(expected));
}

async function inspectPath(browser, check) {
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page.addInitScript(() => {
    window.localStorage.setItem('giis-language', 'en');
  });

  const url = `${BASE_URL}${check.path}`;
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const status = response ? response.status() : null;
    await page.waitForSelector('body', { timeout: 10000 });
    await page.waitForTimeout(300);
    const title = await page.title();
    const text = await page.locator('body').innerText({ timeout: 10000 });
    const missingEvidence = check.evidence.filter((expected) => !includesEvidence(text, expected));
    const errors = [];
    if (!response || status >= 400) errors.push(`HTTP status ${status || 'unknown'}`);
    if (missingEvidence.length) errors.push(`Missing evidence: ${missingEvidence.join('; ')}`);
    if (consoleErrors.length) errors.push(`Console errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
    await page.close();
    return {
      ...check,
      url,
      status,
      title,
      ok: errors.length === 0,
      missingEvidence,
      errors,
    };
  } catch (error) {
    await page.close().catch(() => {});
    return {
      ...check,
      url,
      status: null,
      title: '',
      ok: false,
      missingEvidence: check.evidence,
      errors: [error.message],
    };
  }
}

function writeReports(results) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.mkdirSync(path.dirname(JSON_REPORT), { recursive: true });
  const summary = {
    total: results.length,
    pass: results.filter((result) => result.ok).length,
    fail: results.filter((result) => !result.ok).length,
  };
  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary,
    results,
  };
  fs.writeFileSync(JSON_REPORT, `${JSON.stringify(payload, null, 2)}\n`);

  const lines = [
    '# Parent Journey Acceptance QA',
    '',
    `Generated: ${payload.generatedAt}`,
    `Base URL: ${BASE_URL}`,
    '',
    `Summary: ${summary.pass} pass / ${summary.fail} fail (${summary.total} checks)`,
    '',
    '| Check | Route | Status | Parent Question | Evidence | Notes |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const result of results) {
    const evidence = result.evidence.join('<br>');
    const notes = result.ok
      ? `HTTP ${result.status}`
      : result.errors.join('; ').replace(/\|/g, '/');
    lines.push(`| ${result.id} | ${result.path} | ${result.ok ? 'pass' : 'fail'} | ${result.question} | ${evidence} | ${notes} |`);
  }
  fs.writeFileSync(REPORT, `${lines.join('\n')}\n`);
  return summary;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const check of CHECKS) {
    results.push(await inspectPath(browser, check));
  }
  await browser.close();

  const summary = writeReports(results);
  console.log(`Parent journey acceptance QA: ${summary.pass} pass / ${summary.fail} fail (${summary.total} checks)`);
  console.log(`Report: ${path.relative(ROOT, REPORT)}`);
  console.log(`JSON: ${path.relative(ROOT, JSON_REPORT)}`);
  for (const result of results.filter((entry) => !entry.ok)) {
    console.log(`\n[FAIL] ${result.id} (${result.path})`);
    console.log(`  ${result.question}`);
    for (const error of result.errors) console.log(`  - ${error}`);
  }
  if (summary.fail) process.exit(1);
})();
