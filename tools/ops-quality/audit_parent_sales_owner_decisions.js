#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'parent-sales-owner-decisions.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'parent-sales-owner-decisions.json');
const DECISIONS_PATH = path.join(ROOT, 'docs', 'parent-sales-owner-decisions.json');

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const REPORT = argValue('--report', DEFAULT_REPORT);
const JSON_REPORT = argValue('--json-report', DEFAULT_JSON_REPORT);
const STRICT = process.argv.includes('--strict');

function filled(value) {
  return Boolean(String(value || '').trim());
}

function pass(id, group, message, details = {}) {
  return { id, group, status: 'pass', message, details };
}

function warn(id, group, message, details = {}) {
  return { id, group, status: 'warn', message, details };
}

function fail(id, group, message, details = {}) {
  return { id, group, status: 'fail', message, details };
}

function readDecisions() {
  return JSON.parse(fs.readFileSync(DECISIONS_PATH, 'utf8'));
}

function checkLeadCapture(decisions) {
  const netlify = decisions.netlifyLeadCapture || {};
  const notificationOk = netlify.notificationConfirmed === true && filled(netlify.notificationInbox);
  const ownerOk = filled(netlify.dailySubmissionsOwner);
  if (notificationOk || ownerOk) {
    return pass('lead-capture-owner', 'manual_outreach', 'Lead capture has either confirmed Netlify notification or a daily submissions owner.', {
      notificationConfirmed: netlify.notificationConfirmed === true,
      notificationInbox: netlify.notificationInbox || '',
      dailySubmissionsOwner: ownerOk ? 'recorded' : '',
      dailyCheckCadence: netlify.dailyCheckCadence || '',
    });
  }
  return fail('lead-capture-owner', 'manual_outreach', 'Alan must confirm Netlify form notifications or assign a daily submissions owner before relying on inbound leads.', {
    required: ['Netlify consultation/contact notifications to admissions@genesisideas.school', 'or daily Netlify submissions owner'],
    decisionFile: 'docs/parent-sales-owner-decisions.json',
  });
}

function checkResponseOwners(decisions) {
  const response = decisions.responseOwnership || {};
  const missing = [];
  if (!filled(response.firstResponseOwner)) missing.push('firstResponseOwner');
  if (!filled(response.wechatFollowUpOwner)) missing.push('wechatFollowUpOwner');
  if (!filled(response.principalEscalationOwner)) missing.push('principalEscalationOwner');
  if (!missing.length) {
    return pass('response-owners', 'manual_outreach', 'First response, WeChat follow-up, and principal escalation owners are recorded.', {
      firstResponseOwner: 'recorded',
      wechatFollowUpOwner: 'recorded',
      principalEscalationOwner: response.principalEscalationOwner,
    });
  }
  return fail('response-owners', 'manual_outreach', 'Alan must assign the response owners before outreach is operationally complete.', {
    missing,
    decisionFile: 'docs/parent-sales-owner-decisions.json',
  });
}

function checkManualPayment(decisions) {
  const payment = decisions.manualPayment || {};
  const missing = [];
  if (!filled(payment.stripeInvoiceOwner)) missing.push('stripeInvoiceOwner');
  if (payment.authorizedByAlan !== true) missing.push('authorizedByAlan');
  if (!filled(payment.receiptRecordLocation)) missing.push('receiptRecordLocation');
  if (!filled(payment.invoiceNamingConvention)) missing.push('invoiceNamingConvention');
  if (!missing.length) {
    return pass('manual-payment-owner', 'manual_payment', 'Manual Stripe owner, Alan authorization, receipt location, and invoice naming convention are recorded.', {
      stripeInvoiceOwner: 'recorded',
      authorizedByAlan: true,
      receiptRecordLocation: payment.receiptRecordLocation,
      invoiceNamingConvention: payment.invoiceNamingConvention,
    });
  }
  return fail('manual-payment-owner', 'manual_payment', 'Alan must approve a manual Stripe owner before manual payment links/invoices are operationally complete.', {
    missing,
    decisionFile: 'docs/parent-sales-owner-decisions.json',
  });
}

function checkBackendPayment(decisions) {
  const backend = decisions.backendPaymentLaunch || {};
  const missing = [];
  if (!filled(backend.deployWindow)) missing.push('deployWindow');
  if (backend.requiresSalesPaymentLiveZeroFail !== true) missing.push('requiresSalesPaymentLiveZeroFail');
  if (!missing.length) {
    return pass('backend-payment-launch-window', 'automated_payment', 'Backend payment launch window and 0-fail payment-live requirement are recorded.', {
      deployWindow: backend.deployWindow,
      requiresSalesPaymentLiveZeroFail: true,
    });
  }
  return warn('backend-payment-launch-window', 'automated_payment', 'Automated checkout remains gated until Alan confirms a backend deploy window and payment-live 0-fail requirement.', {
    missing,
    decisionFile: 'docs/parent-sales-owner-decisions.json',
  });
}

function buildPayload(results) {
  const manualRequired = results.filter((item) => ['manual_outreach', 'manual_payment'].includes(item.group));
  const summary = {
    total: results.length,
    pass: results.filter((item) => item.status === 'pass').length,
    warn: results.filter((item) => item.status === 'warn').length,
    fail: results.filter((item) => item.status === 'fail').length,
    manualRequiredTotal: manualRequired.length,
    manualRequiredPass: manualRequired.filter((item) => item.status === 'pass').length,
    manualRequiredFail: manualRequired.filter((item) => item.status === 'fail').length,
  };
  const verdict = summary.manualRequiredFail === 0
    ? 'permanent_manual_sales_owners_ready'
    : 'alan_review_required_for_permanent_sales_owners';
  return {
    generatedAt: new Date().toISOString(),
    decisionFile: path.relative(ROOT, DECISIONS_PATH),
    strict: STRICT,
    verdict,
    summary,
    results,
    alanReviewItems: results
      .filter((item) => item.status !== 'pass')
      .map((item) => ({
        id: item.id,
        group: item.group,
        status: item.status,
        message: item.message,
        details: item.details,
      })),
  };
}

function writeReports(payload) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.mkdirSync(path.dirname(JSON_REPORT), { recursive: true });
  fs.writeFileSync(JSON_REPORT, `${JSON.stringify(payload, null, 2)}\n`);

  const lines = [
    '# Parent Sales Owner Decisions QA',
    '',
    `Generated: ${payload.generatedAt}`,
    `Decision file: ${payload.decisionFile}`,
    `Verdict: ${payload.verdict}`,
    `Summary: ${payload.summary.pass} pass / ${payload.summary.warn} warn / ${payload.summary.fail} fail (${payload.summary.total} checks)`,
    `Manual owner readiness: ${payload.summary.manualRequiredPass} / ${payload.summary.manualRequiredTotal} required checks pass`,
    '',
    '## Alan Review Items',
    '',
  ];

  if (!payload.alanReviewItems.length) {
    lines.push('- No Alan review items remain for permanent manual-sales ownership.');
  } else {
    for (const item of payload.alanReviewItems) {
      lines.push(`- **${item.id}** (${item.status}): ${item.message}`);
      lines.push(`  - Details: \`${JSON.stringify(item.details).replace(/`/g, "'")}\``);
    }
  }

  lines.push('', '## Checks', '', '| Check | Group | Status | Notes |', '| --- | --- | --- | --- |');
  for (const item of payload.results) {
    const details = item.details ? JSON.stringify(item.details).replace(/\|/g, '/') : '';
    lines.push(`| ${item.id} | ${item.group} | ${item.status} | ${item.message}${details ? `<br><code>${details}</code>` : ''} |`);
  }
  fs.writeFileSync(REPORT, `${lines.join('\n')}\n`);
}

function main() {
  const decisions = readDecisions();
  const results = [
    checkLeadCapture(decisions),
    checkResponseOwners(decisions),
    checkManualPayment(decisions),
    checkBackendPayment(decisions),
  ];
  const payload = buildPayload(results);
  writeReports(payload);

  console.log(`Parent sales owner decisions QA: ${payload.summary.pass} pass / ${payload.summary.warn} warn / ${payload.summary.fail} fail (${payload.summary.total} checks)`);
  console.log(`Verdict: ${payload.verdict}`);
  console.log(`Report: ${path.relative(ROOT, REPORT)}`);
  console.log(`JSON: ${path.relative(ROOT, JSON_REPORT)}`);
  for (const item of payload.alanReviewItems) {
    console.log(`\n[${item.status.toUpperCase()}] ${item.id}`);
    console.log(`  ${item.message}`);
  }

  if (STRICT && payload.summary.fail) process.exit(1);
}

main();
