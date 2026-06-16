#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_REPORT = path.join(ROOT, '_audit', 'netlify-lead-capture.md');
const DEFAULT_JSON_REPORT = path.join(ROOT, '_audit', 'netlify-lead-capture.json');

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
const FORM = argValue('--form', 'all');
const CONFIRM_SUBMIT = process.argv.includes('--confirm-submit');

const FORMS = {
  consultation: {
    path: '/consultation',
    fields: [
      'form-name',
      'parentName',
      'email',
      'parentWeChat',
      'studentGrade',
      'studentSituation',
      'transcriptAvailable',
      'desiredStart',
      'preferredTime',
      'message',
    ],
    payload: {
      'form-name': 'consultation',
      parentName: 'GIIS Lead Capture Test Parent',
      email: 'lead-capture-test@example.com',
      parentWeChat: 'giis-lead-capture-test',
      studentGrade: '10',
      studentSituation: 'transfer',
      transcriptAvailable: 'partial',
      desiredStart: 'this-month',
      preferredTime: 'weekday-evening',
      message: 'TEST SUBMISSION from GIIS lead-capture verification. Please mark handled and do not treat as a real lead.',
    },
  },
  contact: {
    path: '/',
    fields: [
      'form-name',
      'studentName',
      'parentWeChat',
      'email',
      'pathway',
      'grade',
      'message',
    ],
    payload: {
      'form-name': 'contact',
      studentName: 'GIIS Lead Capture Test Student',
      parentWeChat: 'giis-lead-capture-test',
      email: 'lead-capture-test@example.com',
      pathway: 'Not sure yet',
      grade: '10',
      message: 'TEST SUBMISSION from GIIS lead-capture verification. Please mark handled and do not treat as a real lead.',
    },
  },
};

function selectedForms() {
  if (FORM === 'all') return Object.keys(FORMS);
  if (!FORMS[FORM]) {
    throw new Error(`Unknown --form ${FORM}. Use all, consultation, or contact.`);
  }
  return [FORM];
}

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function result(status, id, message, details = {}) {
  return { status, id, message, details };
}

function pass(id, message, details = {}) {
  return result('pass', id, message, details);
}

function warn(id, message, details = {}) {
  return result('warn', id, message, details);
}

function fail(id, message, details = {}) {
  return result('fail', id, message, details);
}

function hasInputName(html, field) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`name=["']${escaped}["']`, 'i').test(html);
}

function hasFormRegistration(html, formName, options = {}) {
  const escaped = formName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const formOpen = new RegExp(`<form[^>]+name=["']${escaped}["']`, 'i').test(html);
  const netlifyAttr = !options.requireDataNetlify || /<form[^>]+data-netlify=["']true["']/i.test(html);
  return formOpen && netlifyAttr &&
    new RegExp(`name=["']form-name["'][^>]+value=["']${escaped}["']`, 'i').test(html);
}

function checkLocalHiddenForms(forms) {
  const publicIndex = read('public/index.html');
  return forms.flatMap((formName) => {
    const spec = FORMS[formName];
    const missing = spec.fields.filter((field) => !hasInputName(publicIndex, field));
    const results = [];
    if (hasFormRegistration(publicIndex, formName, { requireDataNetlify: true })) {
      results.push(pass(`${formName}-local-hidden-registration`, `Local hidden ${formName} Netlify form is registered.`));
    } else {
      results.push(fail(`${formName}-local-hidden-registration`, `Local hidden ${formName} Netlify form is missing registration.`));
    }
    results.push(missing.length === 0
      ? pass(`${formName}-local-hidden-fields`, `Local hidden ${formName} form includes required fields.`, { fields: spec.fields })
      : fail(`${formName}-local-hidden-fields`, `Local hidden ${formName} form is missing required fields.`, { missing }));
    return results;
  });
}

function checkSourceForms(forms) {
  const sources = {
    consultation: read('src/components/pages/Consultation/ConsultationPage.js'),
    contact: read('src/components/pages/Homepage/Homepage/ContactForm.js'),
  };
  return forms.flatMap((formName) => {
    const spec = FORMS[formName];
    const source = sources[formName];
    const missing = spec.fields.filter((field) => !hasInputName(source, field));
    const handlesSubmitFailure = /response\.ok/.test(source) && /setSubmitError/.test(source);
    return [
      missing.length === 0
        ? pass(`${formName}-source-fields`, `Source ${formName} form includes required submit fields.`, { fields: spec.fields })
        : fail(`${formName}-source-fields`, `Source ${formName} form is missing required submit fields.`, { missing }),
      handlesSubmitFailure
        ? pass(`${formName}-submit-failure-handling`, `Source ${formName} form only shows success after a successful response.`)
        : fail(`${formName}-submit-failure-handling`, `Source ${formName} form does not clearly fail closed on submit errors.`),
    ];
  });
}

async function fetchHtml(url) {
  const response = await fetch(url);
  const body = await response.text();
  return { url, status: response.status, ok: response.ok, body };
}

async function checkProductionForms(forms) {
  const fetched = new Map();
  const results = [];
  for (const formName of forms) {
    const spec = FORMS[formName];
    const url = `${BASE_URL}${spec.path}`;
    const page = fetched.get(url) || await fetchHtml(url);
    fetched.set(url, page);
    if (!page.ok) {
      results.push(fail(`${formName}-production-page`, `Production ${formName} page did not return OK.`, {
        url,
        status: page.status,
      }));
      continue;
    }
    results.push(pass(`${formName}-production-page`, `Production ${formName} page returns OK.`, {
      url,
      status: page.status,
    }));
    results.push(hasFormRegistration(page.body, formName)
      ? pass(`${formName}-production-registration`, `Production ${formName} Netlify form registration is present.`, { url })
      : fail(`${formName}-production-registration`, `Production ${formName} Netlify form registration is missing.`, { url }));
    const missing = spec.fields.filter((field) => !hasInputName(page.body, field));
    results.push(missing.length === 0
      ? pass(`${formName}-production-fields`, `Production ${formName} page includes required form fields.`, { url, fields: spec.fields })
      : fail(`${formName}-production-fields`, `Production ${formName} page is missing required form fields.`, { url, missing }));
  }
  return results;
}

async function submitProductionForms(forms) {
  const results = [];
  if (!CONFIRM_SUBMIT) {
    return forms.map((formName) => warn(`${formName}-submit-skipped`, `Dry run only; ${formName} test submission was not sent.`, {
      command: `npm run lead-capture:test -- --form ${formName} --confirm-submit`,
      payload: redactPayload(FORMS[formName].payload),
    }));
  }

  for (const formName of forms) {
    const payload = FORMS[formName].payload;
    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload).toString(),
    });
    const body = await response.text();
    results.push(response.ok
      ? pass(`${formName}-submit-sent`, `Production ${formName} test submission returned OK. Confirm notification/submission delivery in Netlify or admissions inbox.`, {
        status: response.status,
        payload: redactPayload(payload),
      })
      : fail(`${formName}-submit-sent`, `Production ${formName} test submission did not return OK.`, {
        status: response.status,
        body: body.slice(0, 500),
        payload: redactPayload(payload),
      }));
  }
  return results;
}

function redactPayload(payload) {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [
    key,
    key === 'email' ? 'lead-capture-test@example.com' : value,
  ]));
}

function summarize(results) {
  return {
    total: results.length,
    pass: results.filter((item) => item.status === 'pass').length,
    warn: results.filter((item) => item.status === 'warn').length,
    fail: results.filter((item) => item.status === 'fail').length,
  };
}

function buildMarkdown(payload) {
  const lines = [
    '# Netlify Lead Capture Verification',
    '',
    `Generated: ${payload.generatedAt}`,
    `Base URL: ${payload.baseUrl}`,
    `Mode: ${payload.confirmSubmit ? 'confirm-submit' : 'dry-run'}`,
    `Verdict: ${payload.verdict}`,
    `Summary: ${payload.summary.pass} pass / ${payload.summary.warn} warn / ${payload.summary.fail} fail (${payload.summary.total} checks)`,
    '',
    '## Operator Notes',
    '',
  ];
  if (payload.confirmSubmit) {
    lines.push('- Test submissions were sent. Confirm that Netlify recorded each submission and that notifications reached the admissions inbox.');
  } else {
    lines.push('- No external form submission was sent. Re-run with `--confirm-submit` only when an operator is ready to verify Netlify submissions and admissions email delivery.');
  }
  lines.push(
    '',
    '## Checks',
    '',
    '| Check | Status | Notes |',
    '| --- | --- | --- |',
  );
  for (const item of payload.results) {
    const details = Object.keys(item.details || {}).length
      ? `<br><code>${JSON.stringify(item.details).replace(/\|/g, '/')}</code>`
      : '';
    lines.push(`| ${item.id} | ${item.status} | ${item.message}${details} |`);
  }
  return `${lines.join('\n')}\n`;
}

function writeReports(payload) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.mkdirSync(path.dirname(JSON_REPORT), { recursive: true });
  fs.writeFileSync(JSON_REPORT, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(REPORT, buildMarkdown(payload));
}

async function main() {
  const forms = selectedForms();
  const results = [
    ...checkLocalHiddenForms(forms),
    ...checkSourceForms(forms),
    ...(await checkProductionForms(forms)),
    ...(await submitProductionForms(forms)),
  ];
  const summary = summarize(results);
  const verdict = summary.fail > 0
    ? 'not_ready'
    : CONFIRM_SUBMIT
      ? 'submitted_verify_delivery'
      : 'dry_run_ready_for_test_submission';
  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    forms,
    confirmSubmit: CONFIRM_SUBMIT,
    verdict,
    summary,
    results,
  };
  writeReports(payload);
  console.log(`Netlify lead capture verification: ${verdict}`);
  console.log(`Report: ${path.relative(ROOT, REPORT)}`);
  console.log(`JSON: ${path.relative(ROOT, JSON_REPORT)}`);
  if (!CONFIRM_SUBMIT) {
    console.log('Dry run only: no external form submission was sent.');
  }
  for (const item of results.filter((entry) => entry.status !== 'pass')) {
    console.log(`\n[${item.status.toUpperCase()}] ${item.id}`);
    console.log(`  ${item.message}`);
  }
  if (summary.fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
