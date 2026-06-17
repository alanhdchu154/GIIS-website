#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function argValue(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasArg(name) {
  return process.argv.includes(name);
}

function todayIso() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function safeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'operator-log';
}

function yesOrBlank(value) {
  return /^(yes|y|true|confirmed|approved)$/i.test(String(value || '').trim()) ? 'yes' : '';
}

function buildLog({
  date,
  owner,
  leadCaptureOwner,
  firstResponseOwner,
  wechatFollowUpOwner,
  principalEscalationOwner,
  manualStripeOwner,
  manualStripeAuthorized,
  receiptLocation,
  checked,
  schoolOpsVerdict,
  leadCaptureDryRunVerdict,
  leadCaptureConfirmSubmit,
  newLeads,
  tomorrowOwner,
}) {
  const checkedValue = yesOrBlank(checked);
  const confirmSubmitValue = leadCaptureConfirmSubmit || 'not run';
  return `# Parent Sales Daily Operator Log

Date: ${date}

## Gate Results

- \`npm run school:ops-report\`: ${schoolOpsVerdict}
- \`npm run audit:sales-manual-ready\`:
- \`npm run audit:sales-launch\`:
- \`npm run audit:sales-payment-live\` (only needed before automated checkout):
- \`npm run lead-capture:test\` dry-run verdict: ${leadCaptureDryRunVerdict}

## Same-Day Owners

- Lead-capture owner: ${leadCaptureOwner || owner}
- First-response owner: ${firstResponseOwner || owner}
- WeChat follow-up owner: ${wechatFollowUpOwner || owner}
- Principal escalation owner: ${principalEscalationOwner || 'Shiyu Zhang, Ph.D.'}
- Manual Stripe owner: ${manualStripeOwner || owner}
- Manual Stripe authorized by Alan (yes/no): ${yesOrBlank(manualStripeAuthorized)}
- Receipt / Stripe ID record location: ${receiptLocation}

## Inbox Checks

- Netlify consultation submissions checked: ${checkedValue}
- Netlify contact submissions checked: ${checkedValue}
- Admissions inbox checked: ${checkedValue}
- WeChat checked: ${checkedValue}

## Lead-Capture Delivery Verification

- Real Netlify test submission run: ${confirmSubmitValue}
- Netlify consultation test submission confirmed:
- Netlify contact test submission confirmed:
- Admissions inbox notification received:
- Notifications safe to rely on without manual Netlify check (yes/no):
- Operator initials / checked time:

## Lead Summary

- New leads: ${newLeads}
- Responded:
- Waiting for records:
- Principal escalation:
- Ready to apply:
- Payment-ready after path review:

## Notes

- Missed or stale submissions:
- Red flags:
- Tomorrow's owner: ${tomorrowOwner || owner}

Do not store parent names, student records, payment links, transcript details,
or Stripe IDs in git.
`;
}

function resolveOutput({ date, output, outDir }) {
  if (output) return path.isAbsolute(output) ? output : path.resolve(ROOT, output);
  const baseDir = outDir ? path.resolve(outDir) : os.tmpdir();
  return path.join(baseDir, `giis-parent-sales-operator-log-${date}.md`);
}

function isInsideRepo(filePath) {
  const relative = path.relative(ROOT, filePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function main() {
  if (hasArg('--help')) {
    console.log(`Usage:
  npm run sales:operator-log
  npm run sales:operator-log -- --owner Alan --checked yes --manual-stripe-authorized yes

Options:
  --date YYYY-MM-DD
  --owner NAME                         fill all same-day owner fields
  --lead-capture-owner NAME            override lead-capture owner
  --first-response-owner NAME          override first-response owner
  --wechat-follow-up-owner NAME        override WeChat follow-up owner
  --manual-stripe-owner NAME           override manual Stripe owner
  --manual-stripe-authorized yes       fill Alan authorization field
  --receipt-location TEXT              default: outside-git admissions tracker
  --checked yes                        mark same-day inbox checks as yes
  --school-ops-verdict TEXT            copy from npm run school:ops-report
  --lead-capture-dry-run-verdict TEXT  copy from npm run lead-capture:test
  --lead-capture-confirm-submit TEXT   e.g. not run, submitted_verify_delivery
  --new-leads NUMBER                   default: 0
  --tomorrow-owner NAME
  --out-dir PATH                       default: system temp dir
  --output PATH                        exact output path
  --overwrite
  --print                              print generated markdown instead of writing

Filled logs should stay outside git when they include owners or operational data.`);
    return;
  }

  const date = argValue('--date', todayIso());
  const owner = argValue('--owner', '');
  const output = resolveOutput({
    date,
    output: argValue('--output', ''),
    outDir: argValue('--out-dir', ''),
  });
  const markdown = buildLog({
    date,
    owner,
    leadCaptureOwner: argValue('--lead-capture-owner', ''),
    firstResponseOwner: argValue('--first-response-owner', ''),
    wechatFollowUpOwner: argValue('--wechat-follow-up-owner', ''),
    principalEscalationOwner: argValue('--principal-escalation-owner', ''),
    manualStripeOwner: argValue('--manual-stripe-owner', ''),
    manualStripeAuthorized: argValue('--manual-stripe-authorized', ''),
    receiptLocation: argValue('--receipt-location', 'outside-git admissions tracker'),
    checked: argValue('--checked', ''),
    schoolOpsVerdict: argValue('--school-ops-verdict', ''),
    leadCaptureDryRunVerdict: argValue('--lead-capture-dry-run-verdict', ''),
    leadCaptureConfirmSubmit: argValue('--lead-capture-confirm-submit', ''),
    newLeads: argValue('--new-leads', '0'),
    tomorrowOwner: argValue('--tomorrow-owner', ''),
  });

  if (hasArg('--print')) {
    process.stdout.write(markdown);
    return;
  }

  if (isInsideRepo(output)) {
    console.error(`Refusing to write an operator log inside the repo: ${path.relative(ROOT, output)}`);
    console.error('Use --out-dir /tmp or another outside-git location.');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });
  if (fs.existsSync(output) && !hasArg('--overwrite')) {
    const parsed = path.parse(output);
    const fallback = path.join(parsed.dir, `${parsed.name}-${safeSlug(new Date().toISOString())}${parsed.ext}`);
    fs.writeFileSync(fallback, markdown);
    console.log(`Operator log already existed, wrote a timestamped file instead: ${fallback}`);
    console.log(`Next: npm run sales:launch-mode -- --operator-log ${fallback}`);
    return;
  }

  fs.writeFileSync(output, markdown);
  console.log(`Operator log written: ${output}`);
  console.log(`Next: npm run sales:launch-mode -- --operator-log ${output}`);
}

main();
