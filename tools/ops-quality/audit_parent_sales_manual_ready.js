#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'parent-sales-manual-ready.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'parent-sales-manual-ready.json');

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

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function readJson(relPath) {
  return JSON.parse(read(relPath));
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

function runNodeScript(scriptRelPath, args) {
  return spawnSync(process.execPath, [path.join(ROOT, scriptRelPath), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

async function fetchText(url) {
  const response = await fetch(url);
  const body = await response.text();
  return { status: response.status, ok: response.ok, body };
}

async function checkProductionProofPath() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'giis-manual-ready-'));
  const report = path.join(tmp, 'sales-live.md');
  const jsonReport = path.join(tmp, 'sales-live.json');
  const run = runNodeScript('tools/ops-quality/audit_parent_sales_live.js', [
    '--base-url', BASE_URL,
    '--report', report,
    '--json-report', jsonReport,
  ]);
  if (run.status !== 0) {
    return fail('production-proof-path', 'Production public proof path is not passing live smoke.', {
      baseUrl: BASE_URL,
      stdout: run.stdout.trim().slice(0, 1000),
      stderr: run.stderr.trim().slice(0, 1000),
    });
  }
  const payload = JSON.parse(fs.readFileSync(jsonReport, 'utf8'));
  return pass('production-proof-path', 'Production public proof path passes live smoke.', {
    baseUrl: BASE_URL,
    summary: payload.summary,
  });
}

function checkStaticSalesLaunch() {
  const run = runNodeScript('tools/ops-quality/audit_parent_sales_launch.js', []);
  if (run.status !== 0) {
    return fail('static-sales-launch', 'Static parent sales launch gate is failing.', {
      stdout: run.stdout.trim().slice(0, 1000),
      stderr: run.stderr.trim().slice(0, 1000),
    });
  }
  return pass('static-sales-launch', 'Static parent sales launch gate passes.', {
    stdout: run.stdout.trim().split('\n').slice(-1)[0],
  });
}

async function checkLeadCaptureMarkup() {
  const home = await fetchText(`${BASE_URL}/`);
  const consultation = await fetchText(`${BASE_URL}/consultation`);
  const results = [];
  if (home.ok && /name=['"]contact['"][\s\S]*name=['"]form-name['"][\s\S]*value=['"]contact['"]/i.test(home.body)) {
    results.push(pass('production-contact-form-markup', 'Production homepage includes Netlify contact form markup.', {
      url: `${BASE_URL}/`,
      status: home.status,
    }));
  } else {
    results.push(fail('production-contact-form-markup', 'Production homepage is missing Netlify contact form markup.', {
      url: `${BASE_URL}/`,
      status: home.status,
    }));
  }

  if (consultation.ok && /name=['"]consultation['"][\s\S]*name=['"]form-name['"][\s\S]*value=['"]consultation['"]/i.test(consultation.body)) {
    results.push(pass('production-consultation-form-markup', 'Production consultation page includes Netlify consultation form markup.', {
      url: `${BASE_URL}/consultation`,
      status: consultation.status,
    }));
  } else {
    results.push(fail('production-consultation-form-markup', 'Production consultation page is missing Netlify consultation form markup.', {
      url: `${BASE_URL}/consultation`,
      status: consultation.status,
    }));
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  await page.goto(`${BASE_URL}/consultation`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('body', { timeout: 10000 });
  await page.waitForTimeout(250);
  const consultationText = await page.locator('body').innerText({ timeout: 10000 });
  await browser.close();

  if (/admissions@genesisideas\.school/i.test(consultationText)) {
    results.push(pass('consultation-email-fallback', 'Consultation page exposes admissions email fallback.', {
      url: `${BASE_URL}/consultation`,
    }));
  } else {
    results.push(fail('consultation-email-fallback', 'Consultation page does not expose admissions email fallback.', {
      url: `${BASE_URL}/consultation`,
    }));
  }

  const decisions = readJson('docs/parent-sales-owner-decisions.json');
  const leadCapture = decisions.netlifyLeadCapture || {};
  const hasNotification = leadCapture.notificationConfirmed === true;
  const hasDailyOwner = Boolean(String(leadCapture.dailySubmissionsOwner || '').trim());
  if (hasNotification || hasDailyOwner) {
    results.push(pass('lead-capture-owner', 'Lead capture owner or Netlify notification is recorded.', {
      notificationConfirmed: hasNotification,
      notificationInbox: leadCapture.notificationInbox,
      dailySubmissionsOwner: leadCapture.dailySubmissionsOwner,
      dailyCheckCadence: leadCapture.dailyCheckCadence,
    }));
  } else {
    results.push(warn('lead-capture-owner', 'Netlify form email notifications cannot be verified from this repo, and no daily submissions owner is recorded yet.', {
      forms: ['consultation', 'contact'],
      inbox: leadCapture.notificationInbox || 'admissions@genesisideas.school',
      decisionFile: 'docs/parent-sales-owner-decisions.json',
    }));
  }
  return results;
}

function checkDocs() {
  const handoff = read('docs/admissions-payment-handoff-runbook.md');
  const sop = read('docs/admissions-consultation-response-sop.md');
  const checklist = read('docs/parent-sales-launch-checklist.md');
  const dailyOperatorChecklist = read('docs/parent-sales-daily-operator-checklist.md');
  const decisions = readJson('docs/parent-sales-owner-decisions.json');
  const results = [];

  const handoffOk = /Minimum Sellable Flow/.test(handoff) &&
    /Manual Payment Fallback/.test(handoff) &&
    /Payment is requested only after the enrollment path is clear/.test(handoff) &&
    /not a shortcut around the admissions/.test(handoff);
  results.push(handoffOk
    ? pass('manual-payment-handoff-doc', 'Manual payment handoff runbook is present and conservative.')
    : fail('manual-payment-handoff-doc', 'Manual payment handoff runbook is missing required conservative boundaries.'));

  const sopOk = /within one business day/i.test(sop) &&
    /Do not send a Stripe checkout link until the enrollment path is clear/.test(sop) &&
    /Do not promise admission outcomes/.test(sop);
  results.push(sopOk
    ? pass('consultation-response-sop', 'Consultation response SOP is present and conservative.')
    : fail('consultation-response-sop', 'Consultation response SOP is missing required conservative boundaries.'));

  const checklistOk = /GIIS can start selling through consultation and path review now/.test(checklist) &&
    /should not\s+send automated Guided\/Premium checkout links until `npm run\s+audit:sales-payment-live` returns 0 fail/s.test(checklist);
  results.push(checklistOk
    ? pass('launch-checklist-boundary', 'Launch checklist separates manual consultation sales from automated payment readiness.')
    : fail('launch-checklist-boundary', 'Launch checklist does not clearly separate manual sales from automated payment readiness.'));

  const dailyOperatorChecklistOk = /Same-Day Owner Coverage/.test(dailyOperatorChecklist) &&
    /lead-capture owner/.test(dailyOperatorChecklist) &&
    /first-response owner/.test(dailyOperatorChecklist) &&
    /WeChat follow-up owner/.test(dailyOperatorChecklist) &&
    /manual Stripe owner/.test(dailyOperatorChecklist) &&
    /End-Of-Day Closeout/.test(dailyOperatorChecklist) &&
    /Stop Conditions/.test(dailyOperatorChecklist);
  results.push(dailyOperatorChecklistOk
    ? pass('daily-operator-checklist', 'Daily operator checklist gives same-day coverage rules for unresolved owner warnings.')
    : fail('daily-operator-checklist', 'Daily operator checklist is missing same-day owner coverage rules.'));

  const manualPayment = decisions.manualPayment || {};
  if (String(manualPayment.stripeInvoiceOwner || '').trim() && manualPayment.authorizedByAlan === true) {
    results.push(pass('manual-stripe-owner', 'Manual Stripe invoice/payment-link owner is recorded and Alan-authorized.', {
      stripeInvoiceOwner: manualPayment.stripeInvoiceOwner,
      invoiceNamingConvention: manualPayment.invoiceNamingConvention,
      receiptRecordLocation: manualPayment.receiptRecordLocation,
    }));
  } else {
    results.push(warn('manual-stripe-owner', 'Manual Stripe invoice/payment-link owner is not fully assigned yet.', {
      stripeInvoiceOwner: manualPayment.stripeInvoiceOwner || '',
      authorizedByAlan: manualPayment.authorizedByAlan === true,
      decisionFile: 'docs/parent-sales-owner-decisions.json',
    }));
  }

  const responseOwnership = decisions.responseOwnership || {};
  if (String(responseOwnership.firstResponseOwner || '').trim() && String(responseOwnership.wechatFollowUpOwner || '').trim()) {
    results.push(pass('response-owners', 'First response and WeChat follow-up owners are recorded.', responseOwnership));
  } else {
    results.push(warn('response-owners', 'First response or WeChat follow-up owner is not fully assigned yet.', {
      firstResponseOwner: responseOwnership.firstResponseOwner || '',
      wechatFollowUpOwner: responseOwnership.wechatFollowUpOwner || '',
      principalEscalationOwner: responseOwnership.principalEscalationOwner || '',
      decisionFile: 'docs/parent-sales-owner-decisions.json',
    }));
  }

  return results;
}

function checkPaymentAutomationBoundary() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'giis-payment-live-'));
  const report = path.join(tmp, 'sales-payment-live.md');
  const jsonReport = path.join(tmp, 'sales-payment-live.json');
  const run = runNodeScript('tools/ops-quality/audit_parent_sales_payment_live.js', [
    '--base-url', BASE_URL,
    '--api-url', API_URL,
    '--report', report,
    '--json-report', jsonReport,
  ]);
  if (!fs.existsSync(jsonReport)) {
    return fail('payment-automation-boundary', 'Payment live gate could not generate a report.', {
      stdout: run.stdout.trim().slice(0, 1000),
      stderr: run.stderr.trim().slice(0, 1000),
      status: run.status,
    });
  }
  const payload = JSON.parse(fs.readFileSync(jsonReport, 'utf8'));
  if (payload.summary.fail === 0) {
    return pass('payment-automation-boundary', 'Automated payment live gate has 0 fail; automated checkout may proceed if runbook is complete.', {
      summary: payload.summary,
    });
  }
  return warn('payment-automation-boundary', 'Automated payment is not ready; manual sales may proceed only through the admissions payment handoff.', {
    summary: payload.summary,
    failures: payload.results.filter((result) => result.status === 'fail').map((result) => result.id),
  });
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
    verdict: summary.fail === 0
      ? 'manual_sales_ready_with_recorded_warnings'
      : 'manual_sales_not_ready',
    results,
  };
  fs.writeFileSync(JSON_REPORT, `${JSON.stringify(payload, null, 2)}\n`);

  const lines = [
    '# Parent Sales Manual Readiness QA',
    '',
    `Generated: ${payload.generatedAt}`,
    `Base URL: ${BASE_URL}`,
    `API URL: ${API_URL}`,
    '',
    `Verdict: ${payload.verdict}`,
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
  results.push(await checkProductionProofPath());
  results.push(checkStaticSalesLaunch());
  results.push(...await checkLeadCaptureMarkup());
  results.push(...checkDocs());
  results.push(checkPaymentAutomationBoundary());

  const summary = writeReports(results);
  console.log(`Parent sales manual readiness QA: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail (${summary.total} checks)`);
  console.log(`Report: ${path.relative(ROOT, REPORT)}`);
  console.log(`JSON: ${path.relative(ROOT, JSON_REPORT)}`);
  for (const result of results.filter((r) => r.status === 'warn')) {
    console.log(`\n[WARN] ${result.id}`);
    console.log(`  ${result.message}`);
    if (result.details) console.log(`  ${JSON.stringify(result.details)}`);
  }
  for (const result of results.filter((r) => r.status === 'fail')) {
    console.log(`\n[FAIL] ${result.id}`);
    console.log(`  ${result.message}`);
    if (result.details) console.log(`  ${JSON.stringify(result.details)}`);
  }
  if (summary.fail) process.exit(1);
})();
