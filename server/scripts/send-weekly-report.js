#!/usr/bin/env node
/* eslint-disable no-console */
require('../lib/resolveDatabaseUrl');

const { runWeeklyReports } = require('../src/lib/weeklyReportService');

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const result = await runWeeklyReports({ dryRun, force });
  console.log(JSON.stringify(result, null, 2));
  if (result.errors > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('[weekly-report] failed:', err);
  process.exitCode = 1;
});
