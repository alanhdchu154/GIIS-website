const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

function extractParentAuth(req) {
  const cookieToken = req.cookies?.giis_parent_jwt;
  const header = req.headers.authorization || '';
  const token = cookieToken || (header.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return null;
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    return p.role === 'parent' ? p : null;
  } catch { return null; }
}

// GET /api/parent/me
// Returns logged-in parent's linked student data: profile, enrollments, recent activity, GPA, credits.
router.get('/me', async (req, res) => {
  const auth = extractParentAuth(req);
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });

  const student = await prisma.student.findUnique({
    where: { id: auth.studentId },
    include: {
      enrollments: {
        include: {
          course: { select: { name: true, nameZh: true, slug: true, department: true, credits: true, _count: { select: { modules: true } } } },
          examAttempts: { orderBy: { submittedAt: 'desc' }, take: 5 },
          assignments: { orderBy: { updatedAt: 'desc' }, take: 5 },
          quizAttempts: { orderBy: { submittedAt: 'desc' }, take: 5 },
        },
        orderBy: { enrolledAt: 'desc' },
      },
    },
  });

  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Calculate credits + GPA
  let creditsEarned = 0;
  let gpaSum = 0;
  let gradedCount = 0;
  for (const enr of student.enrollments) {
    if (enr.creditEarned) {
      creditsEarned += Number(enr.course.credits);
      const best = enr.examAttempts.find(a => a.examType === 'final' && a.passed);
      if (best?.score != null) {
        const s = Number(best.score);
        gpaSum += s >= 90 ? 4.0 : s >= 80 ? 3.0 : s >= 70 ? 2.0 : s >= 60 ? 1.0 : 0;
        gradedCount++;
      }
    }
  }
  const gpa = gradedCount > 0 ? (gpaSum / gradedCount).toFixed(2) : null;

  // Build recent activity feed (last 10 events across all enrollments)
  const events = [];
  for (const enr of student.enrollments) {
    for (const a of enr.examAttempts) {
      if (a.submittedAt) events.push({ type: 'exam', course: enr.course.name, score: a.score, passed: a.passed, at: a.submittedAt });
    }
    for (const q of enr.quizAttempts) {
      events.push({ type: 'quiz', course: enr.course.name, moduleOrder: q.moduleOrder, passed: q.passed, at: q.submittedAt });
    }
    for (const s of enr.assignments) {
      events.push({ type: 'assignment', course: enr.course.name, moduleOrder: s.moduleOrder, hasFeedback: !!s.feedback, at: s.submittedAt });
    }
  }
  events.sort((a, b) => new Date(b.at) - new Date(a.at));

  // Check subscription status by parent email
  const activeSub = await prisma.subscription.findFirst({
    where: { purchaserEmail: auth.email, status: { in: ['active', 'trialing'] } },
    orderBy: { createdAt: 'desc' },
    select: { status: true, planType: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
  });

  res.json({
    student: {
      id: student.id, name: student.name, studentCode: student.studentCode,
      gradeLevel: student.entryDate ? `Grade ${9 + Math.floor((Date.now() - new Date(student.entryDate)) / (365.25 * 24 * 3600 * 1000))}` : null,
    },
    stats: { creditsEarned: Number(creditsEarned.toFixed(1)), gpa, totalEnrollments: student.enrollments.length, completed: student.enrollments.filter(e => e.creditEarned).length },
    enrollments: student.enrollments.map(e => ({
      id: e.id, slug: e.course.slug, name: e.course.name, nameZh: e.course.nameZh,
      department: e.course.department, credits: Number(e.course.credits),
      completedModules: e.completedModules.length, totalModules: e.course._count.modules, creditEarned: e.creditEarned,
    })),
    recentActivity: events.slice(0, 10),
    subscription: activeSub || null,
  });
});

module.exports = router;
