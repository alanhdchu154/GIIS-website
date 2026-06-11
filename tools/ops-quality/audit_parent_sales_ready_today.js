#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'parent-sales-ready-today.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'parent-sales-ready-today.json');

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasArg(name) {
  return process.argv.includes(name);
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

const BASE_URL = normalizeBaseUrl(argValue('--base-url', 'https://genesisideas.school'));
const API_URL = normalizeBaseUrl(argValue('--api-url', 'https://api.genesisideas.school'));
const REPORT = argValue('--report', DEFAULT_REPORT);
const JSON_REPORT = argValue('--json-report', DEFAULT_JSON_REPORT);
const OPERATOR_LOG = argValue('--operator-log', '');

function runNodeScript(scriptRelPath, args) {
  return spawnSync(process.execPath, [path.join(ROOT, scriptRelPath), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function summaryLine(summary) {
  if (!summary) return 'no summary';
  return `${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail (${summary.total} checks)`;
}

function publicPath(filePath) {
  return path.relative(ROOT, filePath);
}

function makeCheck(id, status, message, details = {}) {
  return { id, status, message, details };
}

function runLaunchGate(tmp) {
  const run = runNodeScript('tools/ops-quality/audit_parent_sales_launch.js', []);
  const passed = run.status === 0;
  return {
    check: makeCheck(
      'static-sales-launch',
      passed ? 'pass' : 'fail',
      passed
        ? 'Static parent sales launch gate passes.'
        : 'Static parent sales launch gate is failing.',
      {
        command: 'npm run audit:sales-launch',
        stdoutTail: run.stdout.trim().split('\n').slice(-5).join('\n'),
        stderrTail: run.stderr.trim().split('\n').slice(-5).join('\n'),
      },
    ),
    payload: null,
    report: null,
    jsonReport: null,
  };
}

function runManualReadyGate(tmp) {
  const report = path.join(tmp, 'parent-sales-manual-ready.md');
  const jsonReport = path.join(tmp, 'parent-sales-manual-ready.json');
  const run = runNodeScript('tools/ops-quality/audit_parent_sales_manual_ready.js', [
    '--base-url', BASE_URL,
    '--api-url', API_URL,
    '--operator-log', OPERATOR_LOG,
    '--report', report,
    '--json-report', jsonReport,
  ]);
  const payload = fs.existsSync(jsonReport) ? readJson(jsonReport) : null;
  const passed = run.status === 0 && payload?.summary?.fail === 0;
  return {
    check: makeCheck(
      'manual-sales-ready',
      passed ? 'pass' : 'fail',
      passed
        ? 'Manual consultation-first sales gate passes with the same-day operator log.'
        : 'Manual consultation-first sales gate is not ready today.',
      {
        command: 'npm run audit:sales-manual-ready -- --operator-log <outside-git-log>',
        summary: payload?.summary || null,
        verdict: payload?.verdict || null,
        report: fs.existsSync(report) ? publicPath(report) : '',
        jsonReport: fs.existsSync(jsonReport) ? publicPath(jsonReport) : '',
        operatorLog: OPERATOR_LOG ? 'provided' : 'missing',
        stdoutTail: run.stdout.trim().split('\n').slice(-8).join('\n'),
        stderrTail: run.stderr.trim().split('\n').slice(-8).join('\n'),
      },
    ),
    payload,
    report,
    jsonReport,
  };
}

function runPaymentLiveGate(tmp) {
  const report = path.join(tmp, 'parent-sales-payment-live.md');
  const jsonReport = path.join(tmp, 'parent-sales-payment-live.json');
  const run = runNodeScript('tools/ops-quality/audit_parent_sales_payment_live.js', [
    '--base-url', BASE_URL,
    '--api-url', API_URL,
    '--report', report,
    '--json-report', jsonReport,
  ]);
  const payload = fs.existsSync(jsonReport) ? readJson(jsonReport) : null;
  const fullPaymentReady = run.status === 0 && payload?.summary?.fail === 0;
  return {
    check: makeCheck(
      'automated-payment-live',
      fullPaymentReady ? 'pass' : 'warn',
      fullPaymentReady
        ? 'Automated payment live gate passes; automated checkout may proceed under the payment runbook.'
        : 'Automated payment is not ready; do not send automated Guided/Premium checkout links.',
      {
        command: 'npm run audit:sales-payment-live',
        summary: payload?.summary || null,
        report: fs.existsSync(report) ? publicPath(report) : '',
        jsonReport: fs.existsSync(jsonReport) ? publicPath(jsonReport) : '',
        failures: payload?.results
          ? payload.results.filter((result) => result.status === 'fail').map((result) => result.id)
          : [],
        stdoutTail: run.stdout.trim().split('\n').slice(-8).join('\n'),
        stderrTail: run.stderr.trim().split('\n').slice(-8).join('\n'),
      },
    ),
    payload,
    report,
    jsonReport,
    fullPaymentReady,
  };
}

function writeReports(payload) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.mkdirSync(path.dirname(JSON_REPORT), { recursive: true });
  fs.writeFileSync(JSON_REPORT, `${JSON.stringify(payload, null, 2)}\n`);

  const lines = [
    '# Parent Sales Ready Today QA',
    '',
    `Generated: ${payload.generatedAt}`,
    `Base URL: ${payload.baseUrl}`,
    `API URL: ${payload.apiUrl}`,
    '',
    `Verdict: ${payload.verdict}`,
    `Manual sales ready: ${payload.manualSalesReady ? 'yes' : 'no'}`,
    `Automated payment ready: ${payload.automatedPaymentReady ? 'yes' : 'no'}`,
    `Summary: ${summaryLine(payload.summary)}`,
    '',
    '## Boundary',
    '',
    payload.paymentBoundary,
    '',
    '| Check | Status | Notes |',
    '| --- | --- | --- |',
  ];

  for (const result of payload.results) {
    const details = result.details ? JSON.stringify(result.details).replace(/\|/g, '/') : '';
    lines.push(`| ${result.id} | ${result.status} | ${result.message}${details ? `<br><code>${details}</code>` : ''} |`);
  }

  fs.writeFileSync(REPORT, `${lines.join('\n')}\n`);
}

function missingOperatorLogPayload() {
  const result = makeCheck(
    'operator-log-required',
    'fail',
    'A same-day operator log is required before declaring today ready for outreach.',
    {
      requiredArg: '--operator-log /path/to/operator-log.md',
      template: 'docs/templates/parent-sales-daily-operator-log.md',
      storage: 'Keep filled logs outside git when they include owners, parent names, payment links, or student records.',
    },
  );
  const summary = { total: 1, pass: 0, warn: 0, fail: 1 };
  return {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    apiUrl: API_URL,
    operatorLog: 'missing',
    manualSalesReady: false,
    automatedPaymentReady: false,
    verdict: 'sales_not_ready_today',
    paymentBoundary: 'No outreach day should start without same-day lead, response, WeChat, and manual payment ownership. Do not send automated Guided/Premium checkout links until payment-live has 0 fail.',
    summary,
    results: [result],
  };
}

(async () => {
  if (!OPERATOR_LOG || hasArg('--help')) {
    const payload = missingOperatorLogPayload();
    writeReports(payload);
    console.log('Parent sales ready today QA: 0 pass / 0 warn / 1 fail (1 checks)');
    console.log(`Report: ${publicPath(REPORT)}`);
    console.log(`JSON: ${publicPath(JSON_REPORT)}`);
    console.log('\n[FAIL] operator-log-required');
    console.log('  A same-day operator log is required before declaring today ready for outreach.');
    process.exit(1);
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'giis-sales-ready-today-'));
  const launch = runLaunchGate(tmp);
  const manual = runManualReadyGate(tmp);
  const payment = runPaymentLiveGate(tmp);
  const results = [launch.check, manual.check, payment.check];

  const summary = {
    total: results.length,
    pass: results.filter((result) => result.status === 'pass').length,
    warn: results.filter((result) => result.status === 'warn').length,
    fail: results.filter((result) => result.status === 'fail').length,
  };
  const automatedPaymentReady = payment.fullPaymentReady;
  const manualSalesReady = summary.fail === 0;
  const verdict = manualSalesReady
    ? automatedPaymentReady
      ? 'full_sales_ready'
      : 'manual_sales_go_with_payment_boundary'
    : 'sales_not_ready_today';

  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    apiUrl: API_URL,
    operatorLog: 'provided',
    manualSalesReady,
    automatedPaymentReady,
    verdict,
    paymentBoundary: automatedPaymentReady
      ? 'Payment-live has 0 fail. Automated checkout may proceed only under the production payment runbook.'
      : 'Manual consultation-first sales may proceed only through the admissions payment handoff. Do not send automated Guided/Premium checkout links until payment-live has 0 fail.',
    summary,
    results,
    nestedReports: {
      manualReady: manual.payload ? {
        summary: manual.payload.summary,
        verdict: manual.payload.verdict,
        report: publicPath(manual.report),
        jsonReport: publicPath(manual.jsonReport),
      } : null,
      paymentLive: payment.payload ? {
        summary: payment.payload.summary,
        report: publicPath(payment.report),
        jsonReport: publicPath(payment.jsonReport),
        failures: payment.payload.results
          .filter((result) => result.status === 'fail')
          .map((result) => result.id),
      } : null,
    },
  };

  writeReports(payload);
  console.log(`Parent sales ready today QA: ${summaryLine(summary)}`);
  console.log(`Verdict: ${verdict}`);
  console.log(`Manual sales ready: ${manualSalesReady ? 'yes' : 'no'}`);
  console.log(`Automated payment ready: ${automatedPaymentReady ? 'yes' : 'no'}`);
  console.log(`Report: ${publicPath(REPORT)}`);
  console.log(`JSON: ${publicPath(JSON_REPORT)}`);
  for (const result of results.filter((item) => item.status !== 'pass')) {
    console.log(`\n[${result.status.toUpperCase()}] ${result.id}`);
    console.log(`  ${result.message}`);
    if (result.details) console.log(`  ${JSON.stringify(result.details)}`);
  }

  if (!manualSalesReady) process.exit(1);
})();
