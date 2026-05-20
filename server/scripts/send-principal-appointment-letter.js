#!/usr/bin/env node
/* eslint-disable no-console */
require('../lib/resolveDatabaseUrl');
const { sendPrincipalAppointmentLetter } = require('../src/lib/mailer');

async function main() {
  const result = await sendPrincipalAppointmentLetter({
    principalEmail: process.env.PRINCIPAL_LETTER_TO || 'shiyu.zhang@genesisideas.school',
    cc: process.env.PRINCIPAL_LETTER_CC || 'alanhdchu@genesisideas.school',
  });
  if (!result.ok) {
    console.error('[principal-appointment-letter] failed:', result);
    process.exitCode = 1;
    return;
  }
  console.log('[principal-appointment-letter] sent:', result.id || '(no provider id returned)');
  if (result.provider) {
    console.log('[principal-appointment-letter] provider:', JSON.stringify(result.provider));
  }
}

main().catch((err) => {
  console.error('[principal-appointment-letter] crashed:', err);
  process.exitCode = 1;
});
