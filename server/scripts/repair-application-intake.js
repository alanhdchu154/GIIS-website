#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');
const schoolWeekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: process.env.SCHOOL_TIME_ZONE || 'America/Chicago',
  weekday: 'short',
});

function parseLegacyReview(notes = '') {
  const text = String(notes);
  const current = text.match(
    /^Applicant Review:\s*type=(.*?);\s*previousCredits=(.*?);\s*graduationTiming=(.*?);\s*transcriptAvailable=(.*?);\s*concern=(.*?);/s
  );
  if (current) {
    return {
      applicantType: current[1].trim(),
      previousCredits: current[2].trim(),
      graduationTiming: current[3].trim(),
      transcriptAvailable: current[4].trim(),
      mainConcern: current[5].trim(),
    };
  }
  const legacy = text.match(
    /^Transfer Path Review:\s*credits=(.*?);\s*graduationTiming=(.*?);\s*transcriptAvailable=(.*?);\s*concern=(.*?);/s
  );
  if (!legacy) return null;
  return {
    applicantType: 'transfer',
    previousCredits: legacy[1].trim(),
    graduationTiming: legacy[2].trim(),
    transcriptAvailable: legacy[3].trim(),
    mainConcern: legacy[4].trim(),
  };
}

function nextBusinessResponseDue(value) {
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return null;
  do {
    due.setTime(due.getTime() + 24 * 60 * 60 * 1000);
  } while (['Sat', 'Sun'].includes(schoolWeekdayFormatter.format(due)));
  return due;
}

function plannedChanges(application) {
  const parsed = parseLegacyReview(application.notes);
  const changes = {};
  const isLegacy = !['new', 'transfer'].includes(application.applicantType);

  if (isLegacy && ['new', 'transfer'].includes(parsed?.applicantType)) {
    changes.applicantType = parsed.applicantType;
  }
  if (parsed?.applicantType === 'transfer') {
    if (!application.previousCredits && parsed.previousCredits && parsed.previousCredits !== 'not provided') {
      changes.previousCredits = parsed.previousCredits;
    }
    if (!application.graduationTiming && parsed.graduationTiming && parsed.graduationTiming !== 'not provided') {
      changes.graduationTiming = parsed.graduationTiming;
    }
    if (!application.transcriptAvailable && parsed.transcriptAvailable && parsed.transcriptAvailable !== 'not provided') {
      changes.transcriptAvailable = parsed.transcriptAvailable;
    }
    if (!application.mainConcern && parsed.mainConcern && parsed.mainConcern !== 'not provided') {
      changes.mainConcern = parsed.mainConcern;
    }
    if (!application.nextAction || application.nextAction === 'Review application') {
      changes.nextAction = 'Request official records';
    }
  }
  if (!application.responseDueAt) changes.responseDueAt = nextBusinessResponseDue(application.createdAt);
  if (isLegacy && Number(application.submissionCount || 1) === 1) changes.lastSubmittedAt = application.createdAt;
  return changes;
}

async function main() {
  const applications = await prisma.application.findMany({ orderBy: { createdAt: 'asc' } });
  const planned = applications
    .map((application) => ({ application, changes: plannedChanges(application) }))
    .filter(({ changes }) => Object.keys(changes).length > 0);

  console.log(`Application intake repair: ${apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Rows scanned: ${applications.length}`);
  console.log(`Rows needing backfill: ${planned.length}`);
  for (const { application, changes } of planned) {
    console.log(`- ${application.id}: ${Object.keys(changes).join(', ')}`);
    if (apply) await prisma.application.update({ where: { id: application.id }, data: changes });
  }
  console.log(apply ? `Applied ${planned.length} row update(s).` : 'No data changed. Re-run with --apply after reviewing this plan.');
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`Application intake repair failed: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { parseLegacyReview, nextBusinessResponseDue, plannedChanges };
