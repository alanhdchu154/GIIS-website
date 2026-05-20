const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/admin/assignments/pending  — all ungraded submissions
router.get('/pending', authenticate, requireAdmin, async (req, res) => {
  const rows = await prisma.assignmentSubmission.findMany({
    where: { gradedAt: null },
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, name: true, studentCode: true } },
          course: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { submittedAt: 'asc' },
  });

  res.json(rows.map(r => ({
    id: r.id,
    submittedAt: r.submittedAt,
    content: r.content,
    moduleOrder: r.moduleOrder,
    student: r.enrollment.student,
    course: r.enrollment.course,
    enrollmentId: r.enrollmentId,
  })));
});

// GET /api/admin/assignments  — all submissions (graded + ungraded), paginated
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const graded = req.query.graded; // 'true' | 'false' | undefined (all)
  const where = graded === 'true' ? { NOT: { gradedAt: null } }
              : graded === 'false' ? { gradedAt: null }
              : {};

  const rows = await prisma.assignmentSubmission.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, name: true, studentCode: true } },
          course: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
    take: 200,
  });

  res.json(rows.map(r => ({
    id: r.id,
    submittedAt: r.submittedAt,
    content: r.content,
    moduleOrder: r.moduleOrder,
    feedback: r.feedback,
    score: r.score,
    gradedAt: r.gradedAt,
    student: r.enrollment.student,
    course: r.enrollment.course,
    enrollmentId: r.enrollmentId,
  })));
});

// PATCH /api/admin/assignments/:id  — grade a submission
// Body: { feedback: string, score?: number }
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const { feedback, score } = req.body || {};
  if (feedback == null) return res.status(400).json({ error: 'feedback is required' });

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: req.params.id },
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, name: true, parentEmail: true } },
          course: { select: { name: true } },
        },
      },
    },
  });
  if (!submission) return res.status(404).json({ error: 'Submission not found' });

  const updated = await prisma.assignmentSubmission.update({
    where: { id: req.params.id },
    data: {
      feedback: String(feedback),
      score: score != null ? Number(score) : undefined,
      gradedAt: new Date(),
      gradedById: req.auth.adminId,
    },
  });
  const existingProgress = await prisma.moduleProgress.findUnique({
    where: {
      enrollmentId_moduleOrder: {
        enrollmentId: submission.enrollmentId,
        moduleOrder: submission.moduleOrder,
      },
    },
  });
  await prisma.moduleProgress.upsert({
    where: {
      enrollmentId_moduleOrder: {
        enrollmentId: submission.enrollmentId,
        moduleOrder: submission.moduleOrder,
      },
    },
    update: {
      assignmentGradedAt: existingProgress?.assignmentGradedAt || updated.gradedAt,
      lastActivityAt: updated.gradedAt,
    },
    create: {
      enrollmentId: submission.enrollmentId,
      moduleOrder: submission.moduleOrder,
      assignmentSubmittedAt: submission.submittedAt,
      assignmentGradedAt: updated.gradedAt,
      lastActivityAt: updated.gradedAt,
    },
  });

  // TODO: Phase 1 email notifications (Resend) — notify student + parent
  // await sendGradingNotification(submission);

  res.json({ ok: true, id: updated.id, gradedAt: updated.gradedAt });
});

module.exports = router;
