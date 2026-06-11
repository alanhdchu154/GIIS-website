#!/usr/bin/env node

const os = require('os');
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
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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
  --new-leads 0
  --receipt-location "outside-git admissions tracker"

This command writes the same-day operator log outside git, then runs
sales:launch-mode with that log. It exits non-zero unless today's allowed mode
permits outreach/manual handoff.`;
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

function isInsideRepo(filePath) {
  const relative = path.relative(ROOT, filePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
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
  if (isInsideRepo(output)) {
    fail('Refusing to write a sales-day operator log inside the repo.', [
      `unsafe output: ${path.relative(ROOT, output)}`,
      'use --out-dir /tmp or an absolute outside-git path',
    ]);
  }

  const generatorArgs = [
    '--output', output,
    '--date', date,
    '--owner', owner,
    '--checked', checked,
    '--manual-stripe-authorized', authorized,
    '--receipt-location', argValue('--receipt-location', 'outside-git admissions tracker'),
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
  const launch = runNode('tools/ops-quality/audit_parent_sales_launch_mode.js', [
    '--base-url', baseUrl,
    '--api-url', apiUrl,
    '--operator-log', output,
  ]);
  printOutput(launch);
  process.exit(exitCode(launch));
}

main();
