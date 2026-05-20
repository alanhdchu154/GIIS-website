#!/usr/bin/env node
/* eslint-disable no-console */
require('../lib/resolveDatabaseUrl');

const { spawnSync } = require('child_process');
const path = require('path');
const {
  ADMIN_EMAIL,
  ADMISSIONS_EMAIL,
  sendGraduationIssuanceRequest,
} = require('../src/lib/mailer');

const ROOT = path.resolve(__dirname, '..', '..');
const AUDIT_SCRIPT = path.join(ROOT, 'tools', 'graduation', 'audit_senior_records.js');

function loadAuditReport() {
  const result = spawnSync(process.execPath, [AUDIT_SCRIPT, '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`senior audit failed:\n${result.stdout}\n${result.stderr}`);
  }
  return JSON.parse(result.stdout);
}

async function main() {
  const sendMode = process.argv.includes('--send');
  const principalEmail = process.env.GRADUATION_REQUEST_TO || 'shiyu.zhang@genesisideas.school';
  const cc = (process.env.GRADUATION_REQUEST_CC || `${ADMIN_EMAIL},${ADMISSIONS_EMAIL}`)
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  const report = loadAuditReport();
  const failures = report.filter((student) => student.status !== 'pass');
  if (failures.length) {
    console.error('[graduation-issuance] refusing to send; senior audit has failures.');
    for (const student of failures) {
      console.error(`  ${student.code} ${student.name}: ${student.issues.join('; ')}`);
    }
    process.exitCode = 1;
    return;
  }

  if (!sendMode) {
    console.log('[graduation-issuance] dry run only. Add --send after Alan confirms.');
    console.log(`To: ${principalEmail}`);
    console.log(`Cc: ${cc.join(', ')}`);
    for (const student of report) {
      console.log('');
      console.log(`Subject: Graduation Document Issuance Request — ${student.code} ${student.name}`);
      console.log(`Audit: PASS · ${student.totalCredits} credits · ${student.semesters} semesters · G12 Spring ${student.g12SpringCourses} completed courses · release ${student.g12SpringReleaseDate}`);
    }
    return;
  }

  for (const student of report) {
    const result = await sendGraduationIssuanceRequest({
      principalEmail,
      cc,
      student,
    });
    if (!result.ok) {
      console.error(`[graduation-issuance] failed for ${student.code} ${student.name}:`, result);
      process.exitCode = 1;
      continue;
    }
    console.log(`[graduation-issuance] sent ${student.code} ${student.name}: ${result.id || '(no provider id returned)'}`);
  }
}

main().catch((err) => {
  console.error('[graduation-issuance] crashed:', err);
  process.exitCode = 1;
});
