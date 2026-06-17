#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');

function argValue(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasArg(name) {
  return process.argv.includes(name);
}

function strictYes(value) {
  return /^yes$/i.test(String(value || '').trim());
}

function timestampSlug() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}-${value.minute}-${value.second}-ct`;
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

function runNode(scriptRelPath, args) {
  return spawnSync(process.execPath, [path.join(ROOT, scriptRelPath), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 60 * 1024 * 1024,
  });
}

function printOutput(run) {
  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);
}

function exitCode(run) {
  if (typeof run.status === 'number') return run.status;
  if (run.error) {
    console.error(run.error.message);
  }
  return 1;
}

function usage() {
  return `Usage:
  npm run sales:start-day -- --owner Alan --checked yes --manual-stripe-authorized yes

Required:
  --owner NAME
  --checked yes
  --manual-stripe-authorized yes

Optional:
  --date YYYY-MM-DD
  --base-url https://genesisideas.school
  --api-url https://api.genesisideas.school
  --out-dir /tmp
  --output /tmp/giis-parent-sales-start-day.md
  --school-ops-report /tmp/giis-school-ops-start-day.md
  --school-ops-json-report /tmp/giis-school-ops-start-day.json
  --new-leads 0
  --receipt-location "outside-git admissions tracker"

This command runs the full school operations gate, writes the same-day operator
log outside git, then runs sales:launch-mode with that log. It exits non-zero
unless today's allowed mode permits outreach/manual handoff.`;
}

function fail(message, details = []) {
  console.error(message);
  for (const detail of details) console.error(`- ${detail}`);
  console.error('');
  console.error(usage());
  process.exit(1);
}

function validateRequired() {
  const owner = argValue('--owner', '').trim();
  const checked = argValue('--checked', '');
  const authorized = argValue('--manual-stripe-authorized', '');
  const missing = [];
  if (!owner) missing.push('--owner NAME');
  if (!strictYes(checked)) missing.push('--checked yes');
  if (!strictYes(authorized)) missing.push('--manual-stripe-authorized yes');
  if (missing.length) {
    fail('Refusing to start a sales day without explicit same-day owner coverage.', missing);
  }
}

function resolveLogPath() {
  const exactOutput = argValue('--output', '');
  if (exactOutput) return path.isAbsolute(exactOutput) ? exactOutput : path.resolve(ROOT, exactOutput);
  const outDir = argValue('--out-dir', os.tmpdir());
  return path.join(path.resolve(outDir), `giis-parent-sales-start-day-${todayIso()}-${timestampSlug()}.md`);
}

function resolveOpsReportPaths() {
  const outDir = path.resolve(argValue('--out-dir', os.tmpdir()));
  const stamp = `${todayIso()}-${timestampSlug()}`;
  const report = argValue('--school-ops-report', path.join(outDir, `giis-school-ops-start-day-${stamp}.md`));
  const jsonReport = argValue('--school-ops-json-report', path.join(outDir, `giis-school-ops-start-day-${stamp}.json`));
  return {
    report: path.isAbsolute(report) ? report : path.resolve(ROOT, report),
    jsonReport: path.isAbsolute(jsonReport) ? jsonReport : path.resolve(ROOT, jsonReport),
  };
}

function isInsideRepo(filePath) {
  const relative = path.relative(ROOT, filePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function readOpsVerdict(jsonReport) {
  const payload = JSON.parse(fs.readFileSync(jsonReport, 'utf8'));
  return {
    verdict: payload.verdict || '',
    leadCaptureDryRunVerdict: payload.salesSignals?.leadCaptureDryRunVerdict || '',
  };
}

function assertOpsVerdictAllowsSales(verdict) {
  if (verdict === 'manual_sales_go_with_payment_boundary' || verdict === 'automated_payment_ready') {
    return;
  }
  fail('School operations gate does not allow starting a sales day.', [
    `school ops verdict: ${verdict || '(missing)'}`,
    'review the school ops report before outreach, lead follow-up, or payment discussion',
  ]);
}

function main() {
  if (hasArg('--help')) {
    console.log(usage());
    return;
  }

  validateRequired();

  const owner = argValue('--owner');
  const checked = argValue('--checked');
  const authorized = argValue('--manual-stripe-authorized');
  const date = argValue('--date', todayIso());
  const baseUrl = argValue('--base-url', 'https://genesisideas.school');
  const apiUrl = argValue('--api-url', 'https://api.genesisideas.school');
  const output = resolveLogPath();
  const opsReports = resolveOpsReportPaths();
  if (isInsideRepo(output)) {
    fail('Refusing to write a sales-day operator log inside the repo.', [
      `unsafe output: ${path.relative(ROOT, output)}`,
      'use --out-dir /tmp or an absolute outside-git path',
    ]);
  }
  for (const reportPath of [opsReports.report, opsReports.jsonReport]) {
    if (isInsideRepo(reportPath)) {
      fail('Refusing to write a school-ops report inside the repo during start-day.', [
        `unsafe output: ${path.relative(ROOT, reportPath)}`,
        'use --out-dir /tmp or absolute outside-git report paths',
      ]);
    }
  }

  console.log('Running school operations gate...');
  const schoolOps = runNode('tools/ops-quality/generate_school_ops_report.js', [
    '--base-url', baseUrl,
    '--api-url', apiUrl,
    '--report', opsReports.report,
    '--json-report', opsReports.jsonReport,
  ]);
  printOutput(schoolOps);
  if (schoolOps.status !== 0) process.exit(exitCode(schoolOps));

  const opsVerdict = readOpsVerdict(opsReports.jsonReport);
  assertOpsVerdictAllowsSales(opsVerdict.verdict);

  const generatorArgs = [
    '--output', output,
    '--date', date,
    '--owner', owner,
    '--checked', checked,
    '--manual-stripe-authorized', authorized,
    '--receipt-location', argValue('--receipt-location', 'outside-git admissions tracker'),
    '--school-ops-verdict', opsVerdict.verdict,
    '--lead-capture-dry-run-verdict', opsVerdict.leadCaptureDryRunVerdict,
    '--new-leads', argValue('--new-leads', '0'),
    '--overwrite',
  ];
  const tomorrowOwner = argValue('--tomorrow-owner', '');
  if (tomorrowOwner) generatorArgs.push('--tomorrow-owner', tomorrowOwner);

  console.log('Generating same-day operator log outside git...');
  const generated = runNode('tools/ops-quality/generate_parent_sales_operator_log.js', generatorArgs);
  printOutput(generated);
  if (generated.status !== 0) process.exit(exitCode(generated));

  console.log('');
  console.log('Running parent sales launch mode...');
  const launchStamp = timestampSlug();
  const launchReport = path.join(path.dirname(output), `giis-parent-sales-launch-mode-${launchStamp}.md`);
  const launchJsonReport = path.join(path.dirname(output), `giis-parent-sales-launch-mode-${launchStamp}.json`);
  const launch = runNode('tools/ops-quality/audit_parent_sales_launch_mode.js', [
    '--base-url', baseUrl,
    '--api-url', apiUrl,
    '--operator-log', output,
    '--report', launchReport,
    '--json-report', launchJsonReport,
  ]);
  printOutput(launch);
  process.exit(exitCode(launch));
}

main();
