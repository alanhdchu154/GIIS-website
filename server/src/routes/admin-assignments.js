const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { profileAssignment } = require('../lib/assignmentProfile');

const prisma = new PrismaClient();
const router = express.Router();

function submissionPayload(row) {
  const module = row.enrollment.course.modules?.find((item) => item.order === row.moduleOrder) || null;
  return {
    id: row.id,
    submittedAt: row.submittedAt,
    content: row.content,
    moduleOrder: row.moduleOrder,
    moduleTitle: module?.title || '',
    assignmentPrompt: module?.assignment || '',
    assignmentProfile: profileAssignment(module?.assignment || ''),
    feedback: row.feedback,
    score: row.score,
    gradedAt: row.gradedAt,
    student: row.enrollment.student,
    course: { name: row.enrollment.course.name, slug: row.enrollment.course.slug },
    enrollmentId: row.enrollmentId,
  };
}

// GET /api/admin/assignments/pending  — all ungraded submissions
router.get('/pending', authenticate, requireAdmin, async (req, res) => {
  const rows = await prisma.assignmentSubmission.findMany({
    where: { gradedAt: null },
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, name: true, studentCode: true } },
          course: { select: { name: true, slug: true, modules: { select: { order: true, title: true, assignment: true } } } },
        },
      },
    },
    orderBy: { submittedAt: 'asc' },
  });

  res.json(rows.map(submissionPayload));
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
          course: { select: { name: true, slug: true, modules: { select: { order: true, title: true, assignment: true } } } },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
    take: 200,
  });

  res.json(rows.map(submissionPayload));
});

// PATCH /api/admin/assignments/:id  — grade a submission
// Body: { feedback: string, score: number }
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const { feedback, score } = req.body || {};
  if (!feedback?.trim()) return res.status(400).json({ error: 'feedback is required' });
  if (score == null || score === '') return res.status(400).json({ error: 'score is required' });
  const parsedScore = Number(score);
  if (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > 100) {
    return res.status(400).json({ error: 'score must be between 0 and 100' });
  }

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
      score: parsedScore,
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
