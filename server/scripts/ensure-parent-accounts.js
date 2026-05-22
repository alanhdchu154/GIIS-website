#!/usr/bin/env node
require('../lib/resolveDatabaseUrl');

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const {
  DEFAULT_PARENT_PASSWORD,
  parentLoginEmailForStudentEmail,
} = require('../src/lib/parentCredentials');

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const SET_MISSING_CONTACT = process.argv.includes('--set-missing-contact-email');

async function main() {
  const students = await prisma.student.findMany({
    include: {
      account: { select: { email: true } },
      parentAccounts: { select: { id: true, email: true } },
    },
    orderBy: { studentCode: 'asc' },
  });

  const passwordHash = APPLY ? await bcrypt.hash(DEFAULT_PARENT_PASSWORD, 12) : null;
  const result = {
    mode: APPLY ? 'apply' : 'dry-run',
    checked: students.length,
    skippedNoStudentLogin: [],
    upserted: [],
    alreadyPresent: [],
    contactEmailWouldSet: [],
  };

  for (const student of students) {
    const email = parentLoginEmailForStudentEmail(student.account?.email);
    if (!email) {
      result.skippedNoStudentLogin.push({ studentId: student.id, name: student.name });
      continue;
    }

    const existing = student.parentAccounts.find((account) => account.email.toLowerCase() === email);
    if (existing) {
      result.alreadyPresent.push({ studentId: student.id, name: student.name, email });
      if (APPLY) {
        await prisma.parentAccount.update({
          where: { id: existing.id },
          data: { passwordHash, studentId: student.id },
        });
      }
    } else {
      result.upserted.push({ studentId: student.id, name: student.name, email });
      if (APPLY) {
        await prisma.parentAccount.upsert({
          where: { email },
          update: { passwordHash, studentId: student.id },
          create: { email, passwordHash, studentId: student.id },
        });
      }
    }

    if (SET_MISSING_CONTACT && !student.parentEmail) {
      result.contactEmailWouldSet.push({ studentId: student.id, name: student.name, email });
      if (APPLY) {
        await prisma.student.update({
          where: { id: student.id },
          data: { parentEmail: email },
        });
      }
    }
  }

  console.log(JSON.stringify(result, null, 2));
  if (!APPLY) {
    console.log('\nDry-run only. Re-run with --apply to create/reset deterministic parent login accounts.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
