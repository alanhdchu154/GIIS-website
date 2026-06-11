#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'parent-sales-launch-mode.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'parent-sales-launch-mode.json');

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
const OPERATOR_LOG = argValue('--operator-log', '');

function runNodeScript(scriptRelPath, args = []) {
  return spawnSync(process.execPath, [path.join(ROOT, scriptRelPath), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 40 * 1024 * 1024,
  });
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function displayPath(filePath) {
  if (!filePath) return '';
  if (filePath.startsWith(ROOT)) return path.relative(ROOT, filePath);
  return filePath;
}

function summaryText(summary) {
  if (!summary) return 'no summary';
  return `${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail (${summary.total} checks)`;
}

function check(id, status, message, details = {}) {
  return { id, status, message, details };
}

function tail(text, lines = 8) {
  return String(text || '').trim().split('\n').filter(Boolean).slice(-lines).join('\n');
}

function runStaticLaunch() {
  const run = runNodeScript('tools/ops-quality/audit_parent_sales_launch.js');
  return {
    result: check(
      'static-sales-launch',
      run.status === 0 ? 'pass' : 'fail',
      run.status === 0
        ? 'Static sales-launch contract passes.'
        : 'Static sales-launch contract is failing.',
      {
        command: 'npm run audit:sales-launch',
        stdoutTail: tail(run.stdout),
        stderrTail: tail(run.stderr),
      },
    ),
  };
}

function runJsonAudit(id, scriptRelPath, args, okMessage, failMessage, options = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `giis-${id}-`));
  const report = path.join(tmp, `${id}.md`);
  const jsonReport = path.join(tmp, `${id}.json`);
  const run = runNodeScript(scriptRelPath, [
    ...args,
    '--report', report,
    '--json-report', jsonReport,
  ]);
  const payload = readJsonIfExists(jsonReport);
  const failCount = Number(payload?.summary?.fail || 0);
  const strictZeroFail = options.strictZeroFail !== false;
  const passed = run.status === 0 && (!strictZeroFail || failCount === 0);
  const status = passed ? 'pass' : (options.warnOnFail ? 'warn' : 'fail');
  return {
    result: check(
      id,
      status,
      passed ? okMessage : failMessage,
      {
        command: options.command || `node ${scriptRelPath}`,
        summary: payload?.summary || null,
        verdict: payload?.verdict || null,
        report: displayPath(report),
        jsonReport: displayPath(jsonReport),
        failures: payload?.results
          ? payload.results.filter((item) => item.status === 'fail').map((item) => item.id)
          : [],
        warnings: payload?.results
          ? payload.results.filter((item) => item.status === 'warn').map((item) => item.id)
          : [],
        stdoutTail: tail(run.stdout),
        stderrTail: tail(run.stderr),
      },
    ),
    payload,
    run,
  };
}

function runSalesLive() {
  return runJsonAudit(
    'production-sales-live',
    'tools/ops-quality/audit_parent_sales_live.js',
    ['--base-url', BASE_URL],
    'Production public proof path passes live route smoke.',
    'Production public proof path is not passing live route smoke.',
    { command: 'npm run audit:sales-live -- --base-url <site>' },
  );
}

function runParentJourney() {
  return runJsonAudit(
    'production-parent-journey',
    'tools/ops-quality/audit_parent_journey_acceptance.js',
    ['--base-url', BASE_URL],
    'Production parent journey answers the core buyer questions.',
    'Production parent journey does not answer the core buyer questions.',
    { command: 'npm run audit:parent-journey -- --base-url <site>' },
  );
}

function runOwnerDecisions() {
  return runJsonAudit(
    'permanent-owner-decisions',
    'tools/ops-quality/audit_parent_sales_owner_decisions.js',
    [],
    'Permanent manual-sales owners are recorded.',
    'Permanent manual-sales owners are not fully recorded yet.',
    {
      command: 'npm run audit:sales-owner-decisions',
      warnOnFail: true,
    },
  );
}

function runPaymentLive() {
  return runJsonAudit(
    'automated-payment-live',
    'tools/ops-quality/audit_parent_sales_payment_live.js',
    ['--base-url', BASE_URL, '--api-url', API_URL],
    'Automated payment live gate is green.',
    'Automated payment is not ready; do not send automated Guided/Premium checkout links.',
    {
      command: 'npm run audit:sales-payment-live',
      warnOnFail: true,
    },
  );
}

function runReadyToday() {
  if (!OPERATOR_LOG) {
    return {
      result: check(
        'same-day-operator-log',
        'warn',
        'No same-day operator log was provided; launch mode can rely only on permanent owners.',
        {
          command: 'npm run sales:launch-mode -- --operator-log /path/to/log.md',
          template: 'docs/templates/parent-sales-daily-operator-log.md',
        },
      ),
      payload: null,
    };
  }

  return runJsonAudit(
    'same-day-ready-today',
    'tools/ops-quality/audit_parent_sales_ready_today.js',
    ['--base-url', BASE_URL, '--api-url', API_URL, '--operator-log', OPERATOR_LOG],
    'Same-day operator log covers manual outreach and payment handoff ownership.',
    'Same-day operator log does not make today ready for outreach.',
    {
      command: 'npm run sales:ready-today -- --operator-log <outside-git-log>',
      warnOnFail: true,
    },
  );
}

function buildLaunchMode({ results, ownerPayload, readyTodayPayload, paymentPayload }) {
  const hardFail = results.some((item) => item.status === 'fail');
  const permanentOwnersReady = ownerPayload?.verdict === 'permanent_manual_sales_owners_ready';
  const sameDayReady = Boolean(readyTodayPayload?.manualSalesReady);
  const paymentReady = Boolean(paymentPayload && Number(paymentPayload.summary?.fail || 0) === 0);
  const manualCoverageReady = permanentOwnersReady || sameDayReady;

  if (hardFail || !manualCoverageReady) {
    return {
      launchMode: 'not_ready',
      canOutreach: false,
      canManualPayment: false,
      canAutomatedCheckout: false,
      allowedAction: 'Do not start active outreach. Fix public proof blockers or provide same-day/permanent owner coverage first.',
    };
  }

  if (paymentReady) {
    return {
      launchMode: 'full_sales_ready',
      canOutreach: true,
      canManualPayment: true,
      canAutomatedCheckout: true,
      allowedAction: 'Outreach, path review, manual handoff, and automated checkout are allowed under the payment runbook.',
    };
  }

  if (permanentOwnersReady) {
    return {
      launchMode: 'permanent_manual_sales_ready_with_payment_boundary',
      canOutreach: true,
      canManualPayment: true,
      canAutomatedCheckout: false,
      allowedAction: 'Outreach and path-review sales may proceed through the manual payment handoff. Automated Guided/Premium checkout remains blocked.',
    };
  }

  return {
    launchMode: 'manual_sales_go_with_payment_boundary',
    canOutreach: true,
    canManualPayment: true,
    canAutomatedCheckout: false,
    allowedAction: 'Today can proceed through the same-day operator log and manual payment handoff. Automated Guided/Premium checkout remains blocked.',
  };
}

function writeReports(payload) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.mkdirSync(path.dirname(JSON_REPORT), { recursive: true });
  fs.writeFileSync(JSON_REPORT, `${JSON.stringify(payload, null, 2)}\n`);

  const lines = [
    '# Parent Sales Launch Mode',
    '',
    `Generated: ${payload.generatedAt}`,
    `Base URL: ${payload.baseUrl}`,
    `API URL: ${payload.apiUrl}`,
    `Launch mode: ${payload.launchMode}`,
    `Can outreach: ${payload.canOutreach ? 'yes' : 'no'}`,
    `Can manual payment handoff: ${payload.canManualPayment ? 'yes' : 'no'}`,
    `Can automated checkout: ${payload.canAutomatedCheckout ? 'yes' : 'no'}`,
    '',
    '## Allowed Action',
    '',
    payload.allowedAction,
    '',
    '## Summary',
    '',
    `Checks: ${summaryText(payload.summary)}`,
    '',
    '| Check | Status | Notes |',
    '| --- | --- | --- |',
  ];

  for (const item of payload.results) {
    const details = item.details ? JSON.stringify(item.details).replace(/\|/g, '/') : '';
    lines.push(`| ${item.id} | ${item.status} | ${item.message}${details ? `<br><code>${details}</code>` : ''} |`);
  }

  fs.writeFileSync(REPORT, `${lines.join('\n')}\n`);
}

async function main() {
  const staticLaunch = runStaticLaunch();
  const salesLive = runSalesLive();
  const parentJourney = runParentJourney();
  const owners = runOwnerDecisions();
  const readyToday = runReadyToday();
  const payment = runPaymentLive();

  const results = [
    staticLaunch.result,
    salesLive.result,
    parentJourney.result,
    owners.result,
    readyToday.result,
    payment.result,
  ];

  const summary = {
    total: results.length,
    pass: results.filter((item) => item.status === 'pass').length,
    warn: results.filter((item) => item.status === 'warn').length,
    fail: results.filter((item) => item.status === 'fail').length,
  };

  const decision = buildLaunchMode({
    results,
    ownerPayload: owners.payload,
    readyTodayPayload: readyToday.payload,
    paymentPayload: payment.payload,
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    apiUrl: API_URL,
    operatorLog: OPERATOR_LOG ? 'provided' : 'not provided',
    ...decision,
    summary,
    results,
  };

  writeReports(payload);

  console.log(`Parent sales launch mode: ${payload.launchMode}`);
  console.log(`Can outreach: ${payload.canOutreach ? 'yes' : 'no'}`);
  console.log(`Can manual payment handoff: ${payload.canManualPayment ? 'yes' : 'no'}`);
  console.log(`Can automated checkout: ${payload.canAutomatedCheckout ? 'yes' : 'no'}`);
  console.log(`Summary: ${summaryText(summary)}`);
  console.log(`Report: ${displayPath(REPORT)}`);
  console.log(`JSON: ${displayPath(JSON_REPORT)}`);
  console.log(`Allowed action: ${payload.allowedAction}`);

  for (const item of results.filter((result) => result.status !== 'pass')) {
    console.log(`\n[${item.status.toUpperCase()}] ${item.id}`);
    console.log(`  ${item.message}`);
    if (item.details) console.log(`  ${JSON.stringify(item.details)}`);
  }

  if (payload.launchMode === 'not_ready') process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
