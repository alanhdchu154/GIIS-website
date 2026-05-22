const { PrismaClient } = require('@prisma/client');
const { sendWeeklyProgressEmail, FALLBACK_PARENT_EMAIL, ADMISSIONS_EMAIL } = require('./mailer');
const { computeSemesterTotals } = require('./gpa');

const prisma = new PrismaClient();

const GRAD_CREDITS = 24;
const SITE = (process.env.CORS_ORIGIN || 'https://genesisideas.school').split(',')[0].trim();

function isReleased(semester, now = new Date()) {
  return !semester.releaseDate || new Date(semester.releaseDate) <= now;
}

function transcriptStats(semesters) {
  const releasedRows = semesters
    .filter((semester) => isReleased(semester))
    .flatMap((semester) => semester.courseRows || [])
    .filter((row) => row.courseName && row.letterGrade && String(row.letterGrade).trim());

  const creditsEarned = releasedRows.reduce((sum, row) => sum + Number(row.credits || 0), 0);
  const gpaRows = releasedRows.filter(
    (row) => Number.isFinite(Number(row.weightedGpa)) && Number.isFinite(Number(row.unweightedGpa))
  );
  const totals = computeSemesterTotals(gpaRows);

  return {
    creditsEarned,
    gpa: totals.unweightedGPA === '-' ? null : totals.unweightedGPA,
    completedCount: releasedRows.length,
  };
}

function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

function validEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function recipientForSubscription(sub) {
  return (
    validEmail(sub.purchaserEmail) ||
    validEmail(sub.student?.parentEmail) ||
    validEmail(sub.student?.parentAccounts?.[0]?.email) ||
    FALLBACK_PARENT_EMAIL
  );
}

async function runWeeklyReports({ dryRun = false, force = false, now = new Date() } = {}) {
  const currentWeek = weekKey(now);
  const activeSubs = await prisma.subscription.findMany({
    where: { status: { in: ['active', 'trialing'] }, studentId: { not: null } },
    include: {
      student: {
        include: {
          parentAccounts: { select: { email: true }, take: 1 },
          semesters: {
            include: { courseRows: true },
            orderBy: { sortOrder: 'asc' },
          },
          enrollments: {
            include: {
              course: { select: { name: true, nameZh: true, credits: true, _count: { select: { modules: true } } } },
            },
            orderBy: { enrolledAt: 'desc' },
          },
        },
      },
    },
  });

  const byStudent = new Map();
  for (const sub of activeSubs) {
    if (!sub.student) continue;
    if (!byStudent.has(sub.student.id)) byStudent.set(sub.student.id, sub);
  }

  const results = { sent: [], skipped: [], errors: [] };

  for (const sub of byStudent.values()) {
    const student = sub.student;
    const recipient = recipientForSubscription(sub);
    const dedupeKey = `weekly_report:${student.id}:${currentWeek}`;

    const existing = await prisma.emailLog.findUnique({ where: { dedupeKey } }).catch(() => null);
    if (existing && !force) {
      results.skipped.push({ email: recipient, studentId: student.id, reason: 'already_sent_this_week', dedupeKey });
      continue;
    }

    const stats = transcriptStats(student.semesters || []);
    const inProgress = student.enrollments
      .filter((e) => !e.creditEarned)
      .map((e) => ({
        name: e.course.name,
        completedModules: e.completedModules.length,
        totalModules: e.course._count.modules,
      }));

    const payload = {
      parentEmail: recipient,
      studentName: student.name,
      creditsEarned: Number(stats.creditsEarned.toFixed(1)),
      gpa: stats.gpa,
      inProgressCourses: inProgress,
      completedCount: stats.completedCount,
      gradPercent: Math.min(100, Math.round((stats.creditsEarned / GRAD_CREDITS) * 100)),
      dashboardUrl: `${SITE}/parent/dashboard`,
    };

    if (dryRun) {
      results.skipped.push({ email: recipient, studentId: student.id, reason: 'dry_run', dedupeKey, payload });
      continue;
    }

    const emailResult = await sendWeeklyProgressEmail(payload);
    if (emailResult?.ok) {
      await prisma.emailLog.upsert({
        where: { dedupeKey },
        create: {
          kind: 'weekly_report',
          recipient,
          studentId: student.id,
          providerId: emailResult.id || null,
          dedupeKey,
          status: 'sent',
        },
        update: {
          recipient,
          providerId: emailResult.id || null,
          status: 'sent',
          error: '',
          sentAt: new Date(),
        },
      });
      results.sent.push({ email: recipient, studentId: student.id, messageId: emailResult.id || null, dedupeKey });
    } else {
      await prisma.emailLog.upsert({
        where: { dedupeKey },
        create: {
          kind: 'weekly_report',
          recipient,
          studentId: student.id,
          dedupeKey,
          status: emailResult?.skipped ? 'skipped' : 'error',
          error: emailResult?.reason || emailResult?.error || 'Email send failed',
        },
        update: {
          recipient,
          status: emailResult?.skipped ? 'skipped' : 'error',
          error: emailResult?.reason || emailResult?.error || 'Email send failed',
          sentAt: new Date(),
        },
      });
      if (emailResult?.skipped) {
        results.skipped.push({ email: recipient, studentId: student.id, reason: emailResult.reason || 'email_skipped', dedupeKey });
      } else {
        results.errors.push({ email: recipient, studentId: student.id, error: emailResult?.error || 'Email send failed', dedupeKey });
      }
    }
  }

  return {
    ok: results.errors.length === 0,
    week: currentWeek,
    cc: ADMISSIONS_EMAIL,
    sent: results.sent.length,
    skipped: results.skipped.length,
    errors: results.errors.length,
    details: results,
  };
}

module.exports = {
  runWeeklyReports,
  weekKey,
  recipientForSubscription,
};
