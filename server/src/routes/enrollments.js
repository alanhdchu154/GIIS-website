const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

const PASS_THRESHOLD = 70;
const MIDTERM_CUTOFF = 7; // modules 1–7 unlock midterm

// Grade weights
const W_QUIZ = 0.40;
const W_MID  = 0.30;
const W_FINAL = 0.30;

function requireStudent(req, res, next) {
  if (req.auth?.role !== 'student') return res.status(403).json({ error: 'Students only' });
  next();
}

function letterGrade(pct) {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 60) return 'D';
  return 'F';
}

/** Compute weighted grade from quiz attempts, midterm attempt, final attempt. */
function computeGrade({ quizAttempts, midterm, final_, totalModules }) {
  // Quiz average (treat missing as 0 if all modules are done, else skip)
  const allModulesDone = quizAttempts.length >= totalModules;
  const quizScores = Array.from({ length: totalModules }, (_, i) => {
    const a = quizAttempts.find((q) => q.moduleOrder === i + 1);
    return a ? Number(a.score) : (allModulesDone ? 0 : null);
  });
  const submittedQuizzes = quizScores.filter((s) => s !== null);
  const quizAvg = submittedQuizzes.length > 0
    ? submittedQuizzes.reduce((a, b) => a + b, 0) / submittedQuizzes.length
    : null;

  const midScore = midterm ? Number(midterm.score) : null;
  const finalScore = final_ ? Number(final_.score) : null;

  // Weighted total: only include components that exist
  let weighted = null;
  if (quizAvg !== null && midScore !== null && finalScore !== null) {
    weighted = quizAvg * W_QUIZ + midScore * W_MID + finalScore * W_FINAL;
  }

  // Canvas-style "current grade": weighted avg of only submitted components
  let curNumerator = 0;
  let curDenominator = 0;
  if (quizAvg !== null) { curNumerator += quizAvg * W_QUIZ; curDenominator += W_QUIZ; }
  if (midScore !== null) { curNumerator += midScore * W_MID; curDenominator += W_MID; }
  if (finalScore !== null) { curNumerator += finalScore * W_FINAL; curDenominator += W_FINAL; }
  const currentGrade = curDenominator > 0 ? Math.round((curNumerator / curDenominator) * 10) / 10 : null;
  const gradedWeight = Math.round(curDenominator * 100); // 0–100 representing % of grade graded

  return {
    quizAvg: quizAvg !== null ? Math.round(quizAvg * 10) / 10 : null,
    midScore: midScore !== null ? Math.round(midScore * 10) / 10 : null,
    finalScore: finalScore !== null ? Math.round(finalScore * 10) / 10 : null,
    weighted: weighted !== null ? Math.round(weighted * 10) / 10 : null,
    letter: weighted !== null ? letterGrade(weighted) : null,
    currentGrade,
    gradedWeight,
    submittedQuizCount: submittedQuizzes.length,
    totalModules,
  };
}

// ── List / enroll ─────────────────────────────────────────────────────────────

router.get('/', authenticate, requireStudent, async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: req.auth.studentId },
    include: {
      course: { select: { slug: true, name: true, nameZh: true, credits: true, department: true, _count: { select: { modules: true } } } },
      quizAttempts: { select: { moduleOrder: true, score: true } },
      examAttempts: { where: { submittedAt: { not: null } }, orderBy: { submittedAt: 'desc' } },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  const enriched = enrollments.map((enr) => {
    const totalModules = enr.course._count.modules;
    const midterm = enr.examAttempts.find((a) => a.examType === 'midterm' && a.passed !== null);
    const final_ = enr.examAttempts.find((a) => a.examType === 'final' && a.passed !== null);
    const grade = computeGrade({ quizAttempts: enr.quizAttempts, midterm, final_, totalModules });
    return { ...enr, grade };
  });

  res.json(enriched);
});

router.post('/', authenticate, requireStudent, async (req, res) => {
  const { slug } = req.body || {};
  if (!slug) return res.status(400).json({ error: 'slug is required' });
  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true, isPublished: true } });
  if (!course || !course.isPublished) return res.status(404).json({ error: 'Course not found' });
  try {
    const enrollment = await prisma.enrollment.create({
      data: { studentId: req.auth.studentId, courseId: course.id },
      include: { course: { select: { slug: true, name: true } } },
    });
    res.status(201).json(enrollment);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Already enrolled' });
    throw e;
  }
});

// ── Course detail ─────────────────────────────────────────────────────────────

router.get('/:slug', authenticate, requireStudent, async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug },
    include: { modules: { orderBy: { order: 'asc' } } },
  });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: req.auth.studentId, courseId: course.id } },
    include: {
      examAttempts: { orderBy: { startedAt: 'desc' } },
      quizAttempts: { orderBy: { moduleOrder: 'asc' } },
      assignments: { orderBy: { moduleOrder: 'asc' } },
    },
  });
  if (!enrollment) return res.status(404).json({ error: 'Not enrolled' });

  res.json({ enrollment, course });
});

// ── Grades ────────────────────────────────────────────────────────────────────

router.get('/:slug/grades', authenticate, requireStudent, async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug },
    include: { modules: { orderBy: { order: 'asc' }, select: { order: true, title: true, titleZh: true } } },
  });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: req.auth.studentId, courseId: course.id } },
    include: {
      quizAttempts: { orderBy: { moduleOrder: 'asc' } },
      examAttempts: { where: { submittedAt: { not: null } }, orderBy: { submittedAt: 'desc' } },
      assignments: { orderBy: { moduleOrder: 'asc' } },
    },
  });
  if (!enrollment) return res.status(404).json({ error: 'Not enrolled' });

  const totalModules = course.modules.length;
  const midterm = enrollment.examAttempts.find((a) => a.examType === 'midterm' && a.passed !== null) || null;
  const final_ = enrollment.examAttempts.find((a) => a.examType === 'final' && a.passed !== null) || null;
  const grade = computeGrade({ quizAttempts: enrollment.quizAttempts, midterm, final_, totalModules });

  // Per-module quiz rows
  const quizRows = course.modules.map((mod) => {
    const attempt = enrollment.quizAttempts.find((a) => a.moduleOrder === mod.order);
    const assignment = enrollment.assignments.find((a) => a.moduleOrder === mod.order);
    return {
      moduleOrder: mod.order,
      title: mod.title,
      titleZh: mod.titleZh,
      quiz: attempt ? { score: Number(attempt.score), passed: attempt.passed, submittedAt: attempt.submittedAt } : null,
      assignment: assignment ? { content: assignment.content, feedback: assignment.feedback, submittedAt: assignment.submittedAt } : null,
    };
  });

  res.json({
    course: { slug: course.slug, name: course.name, nameZh: course.nameZh },
    grade,
    weights: { quiz: W_QUIZ, midterm: W_MID, final: W_FINAL },
    quizRows,
    midterm: midterm ? { score: Number(midterm.score), passed: midterm.passed, submittedAt: midterm.submittedAt } : null,
    final: final_ ? { score: Number(final_.score), passed: final_.passed, submittedAt: final_.submittedAt } : null,
    creditEarned: enrollment.creditEarned,
  });
});

// ── Module Quiz ───────────────────────────────────────────────────────────────

// GET /api/enrollments/:slug/quiz/:moduleOrder — fetch quiz questions (no answers)
router.get('/:slug/quiz/:moduleOrder', authenticate, requireStudent, async (req, res) => {
  const moduleOrder = parseInt(req.params.moduleOrder, 10);
  if (!moduleOrder) return res.status(400).json({ error: 'Invalid moduleOrder' });

  const course = await prisma.course.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: req.auth.studentId, courseId: course.id } },
    include: { quizAttempts: { where: { moduleOrder } } },
  });
  if (!enrollment) return res.status(404).json({ error: 'Not enrolled' });

  const questions = await prisma.moduleQuizQuestion.findMany({
    where: { courseId: course.id, moduleOrder },
    orderBy: { order: 'asc' },
    select: { id: true, order: true, question: true, options: true, points: true },
  });

  const attempt = enrollment.quizAttempts[0] || null;
  res.json({ questions, attempt: attempt ? { score: Number(attempt.score), passed: attempt.passed, submittedAt: attempt.submittedAt, answers: attempt.answers } : null });
});

// POST /api/enrollments/:slug/quiz/:moduleOrder/submit — submit quiz answers
router.post('/:slug/quiz/:moduleOrder/submit', authenticate, requireStudent, async (req, res) => {
  const moduleOrder = parseInt(req.params.moduleOrder, 10);
  const { answers } = req.body || {};
  if (!moduleOrder || !answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'moduleOrder and answers are required' });
  }

  const course = await prisma.course.findUnique({ where: { slug: req.params.slug }, select: { id: true, modules: { select: { order: true } } } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: req.auth.studentId, courseId: course.id } },
    include: { quizAttempts: { where: { moduleOrder } } },
  });
  if (!enrollment) return res.status(404).json({ error: 'Not enrolled' });

  // Only one attempt allowed (retake not supported for quizzes)
  if (enrollment.quizAttempts.length > 0) {
    return res.status(409).json({ error: 'Quiz already submitted for this module' });
  }

  const questions = await prisma.moduleQuizQuestion.findMany({ where: { courseId: course.id, moduleOrder } });
  if (questions.length === 0) return res.status(404).json({ error: 'No quiz found for this module' });

  let earned = 0, total = 0;
  const graded = questions.map((q) => {
    total += q.points;
    const given = (answers[q.id] ?? '').toString().trim().toLowerCase();
    const correct = given === q.answer.trim().toLowerCase();
    if (correct) earned += q.points;
    return { questionId: q.id, correct, correctAnswer: q.answer, explanation: q.explanation };
  });

  const score = total > 0 ? (earned / total) * 100 : 0;
  const passed = score >= PASS_THRESHOLD;

  const attempt = await prisma.moduleQuizAttempt.create({
    data: { enrollmentId: enrollment.id, moduleOrder, score, passed, answers },
  });

  // Mark module complete in completedModules
  const completed = enrollment.completedModules.includes(moduleOrder)
    ? enrollment.completedModules
    : [...enrollment.completedModules, moduleOrder].sort((a, b) => a - b);

  await prisma.enrollment.update({ where: { id: enrollment.id }, data: { completedModules: completed } });

  res.json({ score: Math.round(score * 10) / 10, passed, earned, total, graded, attempt });
});

// ── Assignment Submission ─────────────────────────────────────────────────────

router.post('/:slug/assignment/:moduleOrder', authenticate, requireStudent, async (req, res) => {
  const moduleOrder = parseInt(req.params.moduleOrder, 10);
  const { content } = req.body || {};
  if (!moduleOrder || !content?.trim()) return res.status(400).json({ error: 'moduleOrder and content are required' });

  const course = await prisma.course.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: req.auth.studentId, courseId: course.id } },
  });
  if (!enrollment) return res.status(404).json({ error: 'Not enrolled' });

  const submission = await prisma.assignmentSubmission.upsert({
    where: { enrollmentId_moduleOrder: { enrollmentId: enrollment.id, moduleOrder } },
    update: { content: content.trim() },
    create: { enrollmentId: enrollment.id, moduleOrder, content: content.trim() },
  });

  res.json(submission);
});

// ── Exam (Midterm & Final) ────────────────────────────────────────────────────

router.post('/:slug/exam', authenticate, requireStudent, async (req, res) => {
  const { examType = 'final' } = req.body || {};
  if (examType !== 'midterm' && examType !== 'final') return res.status(400).json({ error: 'examType must be midterm or final' });

  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug },
    include: { modules: { select: { order: true } } },
  });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: req.auth.studentId, courseId: course.id } },
    include: {
      quizAttempts: { select: { moduleOrder: true } },
      examAttempts: { where: { examType }, orderBy: { startedAt: 'desc' }, take: 1 },
    },
  });
  if (!enrollment) return res.status(404).json({ error: 'Not enrolled' });
  if (enrollment.creditEarned) return res.status(409).json({ error: 'Credit already earned' });

  const submittedQuizModules = new Set(enrollment.quizAttempts.map((a) => a.moduleOrder));
  const totalModules = course.modules.length;

  if (examType === 'midterm') {
    // Require quizzes 1–MIDTERM_CUTOFF all submitted
    for (let i = 1; i <= MIDTERM_CUTOFF; i++) {
      if (!submittedQuizModules.has(i)) {
        return res.status(403).json({ error: `Complete module ${i} quiz before taking the midterm` });
      }
    }
  } else {
    // Final: require all quizzes + midterm passed
    for (let i = 1; i <= totalModules; i++) {
      if (!submittedQuizModules.has(i)) {
        return res.status(403).json({ error: `Complete all module quizzes before taking the final exam` });
      }
    }
    const midtermAttempt = await prisma.examAttempt.findFirst({
      where: { enrollmentId: enrollment.id, examType: 'midterm', submittedAt: { not: null } },
    });
    if (!midtermAttempt) return res.status(403).json({ error: 'Complete the midterm exam before taking the final' });
  }

  // 24h retake cooldown on failed attempts
  const lastAttempt = enrollment.examAttempts[0];
  if (lastAttempt?.submittedAt && lastAttempt.passed === false) {
    const hrs = (Date.now() - new Date(lastAttempt.submittedAt).getTime()) / 3_600_000;
    if (hrs < 24) return res.status(429).json({ error: 'Wait 24 hours before retaking this exam' });
  }

  const attempt = await prisma.examAttempt.create({ data: { enrollmentId: enrollment.id, examType } });

  const questions = await prisma.examQuestion.findMany({
    where: { courseId: course.id, examType },
    orderBy: { order: 'asc' },
    select: { id: true, order: true, question: true, type: true, options: true, points: true },
  });

  res.status(201).json({ attemptId: attempt.id, examType, questions });
});

router.post('/:slug/exam/:attemptId/submit', authenticate, requireStudent, async (req, res) => {
  const { answers } = req.body || {};
  if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'answers object required' });

  const course = await prisma.course.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: req.auth.studentId, courseId: course.id } },
  });
  if (!enrollment) return res.status(404).json({ error: 'Not enrolled' });

  const attempt = await prisma.examAttempt.findFirst({
    where: { id: req.params.attemptId, enrollmentId: enrollment.id, submittedAt: null },
  });
  if (!attempt) return res.status(404).json({ error: 'Attempt not found or already submitted' });

  const questions = await prisma.examQuestion.findMany({ where: { courseId: course.id, examType: attempt.examType } });

  let earned = 0, total = 0;
  const graded = questions.map((q) => {
    total += q.points;
    const given = (answers[q.id] ?? '').toString().trim().toLowerCase();
    const correct = given === q.answer.trim().toLowerCase();
    if (correct) earned += q.points;
    return { questionId: q.id, correct, correctAnswer: q.answer, explanation: q.explanation };
  });

  const score = total > 0 ? (earned / total) * 100 : 0;
  const passed = score >= PASS_THRESHOLD;

  const updatedAttempt = await prisma.examAttempt.update({
    where: { id: attempt.id },
    data: { submittedAt: new Date(), score, passed, answers },
  });

  // Credit earned when final is passed (grade check happens separately; passing final = credit)
  if (attempt.examType === 'final' && passed && !enrollment.creditEarned) {
    await prisma.enrollment.update({ where: { id: enrollment.id }, data: { creditEarned: true, creditEarnedAt: new Date() } });
  }

  res.json({ score: Math.round(score * 10) / 10, passed, earned, total, graded, examType: attempt.examType, attempt: updatedAttempt });
});

// ── Admin ─────────────────────────────────────────────────────────────────────

router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    include: {
      student: { select: { name: true, studentCode: true } },
      course: { select: { slug: true, name: true, credits: true } },
      examAttempts: { where: { submittedAt: { not: null } }, orderBy: { submittedAt: 'desc' }, take: 2 },
      quizAttempts: { select: { moduleOrder: true, score: true } },
      assignments: { orderBy: { moduleOrder: 'asc' } },
    },
    orderBy: { enrolledAt: 'desc' },
  });
  res.json(enrollments);
});

// PATCH /api/enrollments/admin/:enrollmentId/assignment/:moduleOrder/feedback — teacher feedback
router.patch('/admin/:enrollmentId/assignment/:moduleOrder/feedback', authenticate, requireAdmin, async (req, res) => {
  const moduleOrder = parseInt(req.params.moduleOrder, 10);
  const { feedback } = req.body || {};
  if (!feedback?.trim()) return res.status(400).json({ error: 'feedback is required' });

  const submission = await prisma.assignmentSubmission.findFirst({
    where: { enrollmentId: req.params.enrollmentId, moduleOrder },
  });
  if (!submission) return res.status(404).json({ error: 'Submission not found' });

  const updated = await prisma.assignmentSubmission.update({
    where: { id: submission.id },
    data: { feedback: feedback.trim() },
  });
  res.json(updated);
});

module.exports = router;
