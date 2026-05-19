/**
 * POST /api/admin/weekly-report
 * Admin-triggered (or cron-triggered) weekly progress digest.
 * Sends one email per parent who has an active subscription and a linked student.
 */
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendWeeklyProgressEmail } = require('../lib/mailer');

const router = express.Router();
const prisma = new PrismaClient();

const GRAD_CREDITS = 24;
const SITE = (process.env.CORS_ORIGIN || 'https://genesisideas.school').split(',')[0].trim();

router.post('/', authenticate, requireAdmin, async (req, res) => {
  // Find all active subscriptions with a linked parent account
  const activeSubs = await prisma.subscription.findMany({
    where: { status: { in: ['active', 'trialing'] } },
    select: { purchaserEmail: true },
  });

  const parentEmails = [...new Set(activeSubs.map(s => s.purchaserEmail))];

  const results = { sent: [], skipped: [], errors: [] };

  for (const email of parentEmails) {
    try {
      const parent = await prisma.parentAccount.findUnique({
        where: { email },
        include: {
          student: {
            include: {
              enrollments: {
                include: {
                  course: { select: { name: true, nameZh: true, credits: true, _count: { select: { modules: true } } } },
                  completedModules: { select: { id: true } },
                },
              },
            },
          },
        },
      });

      if (!parent?.student) { results.skipped.push(email); continue; }

      const student = parent.student;
      const creditsEarned = student.enrollments
        .filter(e => e.creditEarned)
        .reduce((sum, e) => sum + Number(e.course.credits), 0);

      const gradedEnrollments = student.enrollments.filter(e => e.creditEarned && e.finalGrade != null);
      const gpa = gradedEnrollments.length
        ? (gradedEnrollments.reduce((sum, e) => sum + (e.finalGrade >= 93 ? 4.0 : e.finalGrade >= 90 ? 3.7 : e.finalGrade >= 87 ? 3.3 : e.finalGrade >= 83 ? 3.0 : e.finalGrade >= 80 ? 2.7 : e.finalGrade >= 77 ? 2.3 : e.finalGrade >= 73 ? 2.0 : e.finalGrade >= 70 ? 1.7 : e.finalGrade >= 67 ? 1.3 : e.finalGrade >= 63 ? 1.0 : 0.7), 0) / gradedEnrollments.length).toFixed(2)
        : null;

      const inProgress = student.enrollments
        .filter(e => !e.creditEarned)
        .map(e => ({
          name: e.course.name,
          completedModules: e.completedModules.length,
          totalModules: e.course._count.modules,
        }));

      await sendWeeklyProgressEmail({
        parentEmail: email,
        studentName: student.name,
        creditsEarned: Number(creditsEarned.toFixed(1)),
        gpa,
        inProgressCourses: inProgress,
        completedCount: student.enrollments.filter(e => e.creditEarned).length,
        gradPercent: Math.min(100, Math.round((creditsEarned / GRAD_CREDITS) * 100)),
        dashboardUrl: `${SITE}/parent/dashboard`,
      });

      results.sent.push(email);
    } catch (err) {
      console.error(`[weekly-report] Error for ${email}:`, err.message);
      results.errors.push({ email, error: err.message });
    }
  }

  res.json({
    ok: true,
    sent: results.sent.length,
    skipped: results.skipped.length,
    errors: results.errors.length,
    details: results,
  });
});

module.exports = router;
