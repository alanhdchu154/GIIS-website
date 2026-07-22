const express = require('express');
const jwt = require('jsonwebtoken');
const { computeSemesterTotals } = require('../lib/gpa');
const { touchLoginSession } = require('../lib/sessionTracker');

const prisma = require('../lib/prisma');
const router = express.Router();

function extractParentAuth(req) {
  const cookieToken = req.cookies?.giis_parent_jwt;
  const header = req.headers.authorization || '';
  const token = cookieToken || (header.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return null;
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    if (p.role !== 'parent') return null;
    touchLoginSession(p.sessionId, req);
    return p;
  } catch { return null; }
}

function isReleased(semester, now = new Date()) {
  return !semester.releaseDate || new Date(semester.releaseDate) <= now;
}

function transcriptStats(semesters) {
  const namedRows = (semesters || [])
    .filter((semester) => isReleased(semester))
    .flatMap((semester) => semester.courseRows || [])
    .filter((row) => row.courseName && String(row.courseName).trim());

  // Credits count for every completed course row with positive credits, including
  // "credit only" transfer rows that carry accepted credit but no convertible
  // letter grade (per the transfer-credit SOP: credit-only courses still count
  // toward the 24-credit graduation framework). Requiring a letterGrade here used
  // to silently drop those transfer credits.
  const creditsEarned = namedRows.reduce((sum, row) => sum + (Number(row.credits) || 0), 0);

  // GPA: computeSemesterTotals already excludes rows without a convertible grade
  // (null weighted/unweighted), so credit-only rows correctly do not affect GPA.
  const totals = computeSemesterTotals(namedRows);

  // "Completed" reflects graded courses (rows carrying a usable letter grade).
  const gradedRows = namedRows.filter((row) => row.letterGrade && String(row.letterGrade).trim());

  return {
    creditsEarned,
    gpa: totals.unweightedGPA === '-' ? null : totals.unweightedGPA,
    completed: gradedRows.length,
  };
}

function dateOnly(d) {
  if (!d) return null;
  try {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function computeCurrentGrade(graduationDate, referenceDate = new Date()) {
  if (!graduationDate) return null;
  const graduationYear = new Date(graduationDate).getFullYear();
  const month = referenceDate.getMonth() + 1;
  const schoolYearEnd = month >= 9 ? referenceDate.getFullYear() + 1 : referenceDate.getFullYear();
  const grade = 12 - (graduationYear - schoolYearEnd);
  if (grade < 9 || grade > 12) return null;
  return grade;
}

function serializeTranscriptStudent(student) {
  const s = { ...student };
  s.birthDate = dateOnly(student.birthDate);
  s.entryDate = dateOnly(student.entryDate);
  s.withdrawalDate = dateOnly(student.withdrawalDate);
  s.graduationDate = dateOnly(student.graduationDate);
  s.transcriptDate = dateOnly(student.transcriptDate);
  s.currentGrade = computeCurrentGrade(student.graduationDate);
  return s;
}

function daysBetween(start, end = new Date()) {
  if (!start) return 0;
  const startedAt = new Date(start);
  if (Number.isNaN(startedAt.getTime())) return 0;
  return Math.max(0, Math.floor((end.getTime() - startedAt.getTime()) / (24 * 3600 * 1000)));
}

function computePacing(enrollment, now = new Date()) {
  const totalModules = Number(enrollment.course?._count?.modules || 0);
  const completedModules = Array.isArray(enrollment.completedModules) ? enrollment.completedModules.length : 0;
  if (enrollment.creditEarned || totalModules === 0) {
    return { status: 'on_track', label: 'Complete', deltaModules: 0, expectedModules: totalModules };
  }

  const elapsedDays = daysBetween(enrollment.enrolledAt, now);
  const expectedModules = Math.max(1, Math.min(totalModules, Math.floor((elapsedDays / (18 * 7)) * totalModules)));
  const deltaModules = completedModules - expectedModules;
  if (deltaModules <= -2) return { status: 'behind', label: `Behind ${Math.abs(deltaModules)} modules`, deltaModules, expectedModules };
  if (deltaModules >= 2) return { status: 'ahead', label: `Ahead ${deltaModules} modules`, deltaModules, expectedModules };
  return { status: 'on_track', label: 'On Track', deltaModules, expectedModules };
}

function computeWeeklyInsights(enrollment, now = new Date()) {
  const since = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const activeDays = new Set();
  const moduleHours = new Map((enrollment.course?.modules || []).map((m) => [m.order, Number(m.estimatedHrs || 0)]));
  let modulesCompleted = 0;
  let videoActivities = 0;
  const quizScores = [];

  function countDate(value) {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date < since || date > now) return false;
    activeDays.add(date.toISOString().slice(0, 10));
    return true;
  }

  for (const p of enrollment.moduleProgresses || []) {
    if (countDate(p.moduleCompletedAt)) modulesCompleted += 1;
    countDate(p.readingCompletedAt);
    if (countDate(p.videoCompletedAt)) videoActivities += 1;
    if (countDate(p.supplementalVideoCompletedAt)) videoActivities += 1;
    countDate(p.practiceCompletedAt);
  }

  const quizAttempts = (enrollment.quizAttempts || []).filter((q) => {
    const counted = countDate(q.submittedAt);
    if (counted && q.score != null) quizScores.push(Number(q.score));
    return counted;
  }).length;
  const assignmentSubmissions = (enrollment.assignments || []).filter((a) => countDate(a.submittedAt)).length;
  const estimatedStudyHours = (enrollment.moduleProgresses || [])
    .filter((p) => p.moduleCompletedAt && new Date(p.moduleCompletedAt) >= since && new Date(p.moduleCompletedAt) <= now)
    .reduce((sum, p) => sum + (moduleHours.get(p.moduleOrder) || 0), 0);

  return {
    activeDays: activeDays.size,
    modulesCompleted,
    quizAttempts,
    assignmentSubmissions,
    overdueAssignments: null,
    quizAverage: quizScores.length
      ? Math.round((quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length) * 10) / 10
      : null,
    nextDeadline: null,
    videoActivities,
    estimatedStudyHours: Math.round(estimatedStudyHours * 10) / 10,
  };
}

function computeStudentWeeklyInsights(enrollments, now = new Date()) {
  const since = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const activeDays = new Set();
  let modulesCompleted = 0;
  let quizAttempts = 0;
  let assignmentSubmissions = 0;
  let videoActivities = 0;
  let estimatedStudyHours = 0;
  const quizScores = [];

  function countDate(value) {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date < since || date > now) return false;
    activeDays.add(date.toISOString().slice(0, 10));
    return true;
  }

  for (const enrollment of enrollments || []) {
    const moduleHours = new Map((enrollment.course?.modules || []).map((m) => [m.order, Number(m.estimatedHrs || 0)]));
    for (const p of enrollment.moduleProgresses || []) {
      if (countDate(p.moduleCompletedAt)) {
        modulesCompleted += 1;
        estimatedStudyHours += moduleHours.get(p.moduleOrder) || 0;
      }
      countDate(p.readingCompletedAt);
      if (countDate(p.videoCompletedAt)) videoActivities += 1;
      if (countDate(p.supplementalVideoCompletedAt)) videoActivities += 1;
      countDate(p.practiceCompletedAt);
    }
    quizAttempts += (enrollment.quizAttempts || []).filter((q) => {
      const counted = countDate(q.submittedAt);
      if (counted && q.score != null) quizScores.push(Number(q.score));
      return counted;
    }).length;
    assignmentSubmissions += (enrollment.assignments || []).filter((a) => countDate(a.submittedAt)).length;
  }

  return {
    activeDays: activeDays.size,
    modulesCompleted,
    quizAttempts,
    assignmentSubmissions,
    overdueAssignments: null,
    quizAverage: quizScores.length
      ? Math.round((quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length) * 10) / 10
      : null,
    nextDeadline: null,
    videoActivities,
    estimatedStudyHours: Math.round(estimatedStudyHours * 10) / 10,
  };
}

function parentSubscriptionLookup({ auth, student }) {
  const emails = [auth?.email, student?.parentEmail]
    .filter(Boolean)
    .map((email) => String(email).trim().toLowerCase())
    .filter(Boolean);
  const uniqueEmails = [...new Set(emails)];
  const or = [];
  if (auth?.studentId) or.push({ studentId: auth.studentId });
  if (uniqueEmails.length) or.push({ purchaserEmail: { in: uniqueEmails } });
  return or.length ? { OR: or } : {};
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
          course: {
            select: {
              name: true,
              nameZh: true,
              slug: true,
              department: true,
              credits: true,
              modules: { select: { order: true, title: true, estimatedHrs: true } },
              _count: { select: { modules: true } },
            },
          },
          examAttempts: { where: { submittedAt: { not: null } }, orderBy: { submittedAt: 'desc' } },
          assignments: { orderBy: { updatedAt: 'desc' } },
          quizAttempts: { orderBy: { submittedAt: 'desc' } },
          moduleProgresses: { orderBy: { lastActivityAt: 'desc' } },
        },
        orderBy: { enrolledAt: 'desc' },
      },
      semesters: {
        include: { courseRows: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!student) return res.status(404).json({ error: 'Student not found' });

  const stats = transcriptStats(student.semesters);

  // Build recent activity feed (last 10 events across all enrollments)
  const events = [];
  for (const enr of student.enrollments) {
    for (const a of enr.examAttempts) {
      if (a.submittedAt) events.push({ type: 'exam', examType: a.examType, course: enr.course.name, score: a.score, passed: a.passed, at: a.submittedAt });
    }
    for (const q of enr.quizAttempts) {
      events.push({ type: 'quiz', course: enr.course.name, moduleOrder: q.moduleOrder, passed: q.passed, at: q.submittedAt });
    }
    for (const s of enr.assignments) {
      events.push({
        type: 'assignment',
        course: enr.course.name,
        moduleOrder: s.moduleOrder,
        hasFeedback: !!s.feedback,
        score: s.score != null ? Number(s.score) : null,
        at: s.submittedAt,
      });
      if (s.gradedAt) {
        events.push({
          type: 'assignment_feedback',
          course: enr.course.name,
          moduleOrder: s.moduleOrder,
          score: s.score != null ? Number(s.score) : null,
          feedback: s.feedback || '',
          at: s.gradedAt,
        });
      }
    }
    for (const p of enr.moduleProgresses || []) {
      const activityTypes = [
        ['video', p.videoCompletedAt],
        ['supplemental_video', p.supplementalVideoCompletedAt],
        ['reading', p.readingCompletedAt],
        ['practice', p.practiceCompletedAt],
      ];
      for (const [type, at] of activityTypes) {
        if (at) events.push({ type, course: enr.course.name, moduleOrder: p.moduleOrder, at });
      }
    }
  }
  events.sort((a, b) => new Date(b.at) - new Date(a.at));

  // Check subscription status by linked student first, then parent/contact emails.
  const activeSub = await prisma.subscription.findFirst({
    where: {
      ...parentSubscriptionLookup({ auth, student }),
      status: { in: ['active', 'trialing'] },
    },
    orderBy: { createdAt: 'desc' },
    select: { status: true, planType: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
  });

  // Advisor relationship: the assigned advisor + next check-in, plus parent-safe
  // care notes the advisor has chosen to share. Internal notes are never exposed here.
  const careState = await prisma.studentCareState.findUnique({
    where: { studentId: auth.studentId },
    select: { advisorOwner: true, nextCheckInDueAt: true },
  });
  const careLogs = await prisma.studentCareLog.findMany({
    where: { studentId: auth.studentId, visibility: 'parent_safe' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, type: true, title: true, parentSummary: true, channel: true, createdAt: true, followUpAt: true },
  });

  res.json({
    student: {
      id: student.id, name: student.name, studentCode: student.studentCode,
      gradeLevel: student.entryDate ? `Grade ${9 + Math.floor((Date.now() - new Date(student.entryDate)) / (365.25 * 24 * 3600 * 1000))}` : null,
    },
    stats: {
      creditsEarned: Number(stats.creditsEarned.toFixed(1)),
      gpa: stats.gpa,
      totalEnrollments: student.enrollments.length,
      completed: stats.completed,
    },
    weeklyInsights: computeStudentWeeklyInsights(student.enrollments),
    enrollments: student.enrollments.map(e => {
      const latestMidterm = e.examAttempts.find((attempt) => attempt.examType === 'midterm') || null;
      const latestFinal = e.examAttempts.find((attempt) => attempt.examType === 'final') || null;
      const submittedAssignments = e.assignments.length;
      const reviewedAssignments = e.assignments.filter((assignment) => assignment.gradedAt).length;
      const moduleTitles = new Map((e.course.modules || []).map((module) => [module.order, module.title]));
      return {
        id: e.id, slug: e.course.slug, name: e.course.name, nameZh: e.course.nameZh,
        department: e.course.department, credits: Number(e.course.credits),
        completedModules: e.completedModules.length, totalModules: e.course._count.modules, creditEarned: e.creditEarned,
        pacing: computePacing(e),
        weeklyInsights: computeWeeklyInsights(e),
        assessment: {
          quizzesSubmitted: e.quizAttempts.length,
          quizzesPassed: e.quizAttempts.filter((attempt) => attempt.passed).length,
          assignmentsSubmitted: submittedAssignments,
          assignmentsReviewed: reviewedAssignments,
          midterm: latestMidterm ? { score: Number(latestMidterm.score), passed: latestMidterm.passed, submittedAt: latestMidterm.submittedAt } : null,
          final: latestFinal ? { score: Number(latestFinal.score), passed: latestFinal.passed, submittedAt: latestFinal.submittedAt } : null,
        },
        assignments: e.assignments
          .slice()
          .sort((a, b) => a.moduleOrder - b.moduleOrder)
          .map((assignment) => ({
            moduleOrder: assignment.moduleOrder,
            moduleTitle: moduleTitles.get(assignment.moduleOrder) || null,
            status: assignment.gradedAt ? 'reviewed' : 'submitted',
            submittedAt: assignment.submittedAt,
            gradedAt: assignment.gradedAt,
            score: assignment.score != null ? Number(assignment.score) : null,
            feedback: assignment.feedback || '',
            contentPreview: String(assignment.content || '').slice(0, 220),
          })),
      };
    }),
    recentActivity: events.slice(0, 25),
    subscription: activeSub || null,
    // Parent-facing payment status. Manual-review billing (admin-set
    // paidThroughDate) is the source of truth when present; otherwise fall back
    // to Stripe, treating a lapsed period as past_due rather than a false green.
    payment: (() => {
      const today = new Date().toISOString().slice(0, 10);
      if (student.paidThroughDate) {
        const through = new Date(student.paidThroughDate).toISOString().slice(0, 10);
        return { source: 'manual', state: through >= today ? 'active' : 'past_due', paidThroughDate: through, plan: student.paymentPlan || null };
      }
      if (activeSub) {
        const end = activeSub.currentPeriodEnd ? new Date(activeSub.currentPeriodEnd).toISOString().slice(0, 10) : null;
        return { source: 'stripe', state: (!end || end >= today) ? 'active' : 'past_due', paidThroughDate: end, plan: activeSub.planType || null };
      }
      return { source: 'none', state: 'none', paidThroughDate: null, plan: null };
    })(),
    advisor: {
      name: careState?.advisorOwner || null,
      nextCheckInDueAt: careState?.nextCheckInDueAt ? careState.nextCheckInDueAt.toISOString() : null,
    },
    advisorNotes: careLogs.map((log) => ({
      id: log.id,
      type: log.type,
      title: log.title || '',
      summary: log.parentSummary || '',
      channel: log.channel,
      at: log.createdAt,
      followUpAt: log.followUpAt ? log.followUpAt.toISOString() : null,
    })),
  });
});

// GET /api/parent/transcript
// Parent-safe official transcript data for the linked student.
router.get('/transcript', async (req, res) => {
  const auth = extractParentAuth(req);
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });

  const student = await prisma.student.findUnique({
    where: { id: auth.studentId },
    include: {
      semesters: {
        orderBy: { sortOrder: 'asc' },
        include: { courseRows: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  });

  if (!student) return res.status(404).json({ error: 'Student not found' });

  const now = new Date();
  (student.semesters || []).forEach((sem) => {
    if (sem.releaseDate && new Date(sem.releaseDate) > now) {
      sem.courseRows.forEach((row) => {
        row.letterGrade = '';
        row.weightedGpa = null;
        row.unweightedGpa = null;
      });
    }
  });

  res.json({ student: serializeTranscriptStudent(student) });
});

module.exports = router;
