const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const {
  authenticate,
  requireAdmin,
  requireStudentOrAdminForStudentParam,
} = require('../middleware/auth');
const { computeRowGpa, computeSemesterTotals } = require('../lib/gpa');
const { ensureStudentMutable } = require('../lib/studentArchive');
const {
  CARE_STATUSES,
  RISK_LEVELS,
  CARE_TIERS,
  CARE_LOG_TYPES,
  CARE_VISIBILITIES,
  CARE_CHANNELS,
  normalizeChoice,
  parseOptionalDate,
  computeCareSignals,
  displayCareState,
  serializeCareState,
  serializeCareLog,
} = require('../lib/studentCare');

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable();

const studentProfileSchema = z.object({
  name: z.string().min(1).max(200),
  studentCode: z.string().max(20).optional().nullable(),
  birthDate: dateSchema,
  gender: z.enum(['Male', 'Female']).optional().nullable(),
  parentGuardian: z.string().max(200).optional().nullable(),
  parentEmail: z.string().email().max(200).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
  zipCode: z.string().max(20).optional().nullable(),
  entryDate: dateSchema,
  withdrawalDate: dateSchema,
  graduationDate: dateSchema,
  transcriptDate: dateSchema,
});

const prisma = new PrismaClient();
const router = express.Router();

// Florida 24-credit graduation framework (see CLAUDE.md). A student who has
// earned at least this many official transcript credits has met the academic
// graduation requirement, regardless of their (possibly future) graduation date.
const GRADUATION_CREDIT_THRESHOLD = 24;

// Monthly recurring value per plan, in USD cents — used for the ops MRR line.
// Annual plans are normalized to a monthly figure. Inquiry/test plans are 0.
const PLAN_MRR_CENTS = {
  self_paced_monthly: 4900,
  monthly: 4900,
  founders_monthly: 4900,
  self_paced_annual: Math.round(49900 / 12),
  guided_monthly: 14900,
  premium_monthly: 29900,
  group_monthly: 0,
  live_test: 0,
};

const SUB_ACTIVE = ['active', 'trialing'];
const SUB_PAYMENT_ISSUE = ['past_due', 'incomplete'];
const INACTIVE_DAYS = 7;

// Collapse a student's subscriptions into one operational status.
function resolveSubscription(subs) {
  if (!subs || subs.length === 0) return { id: null, state: 'none', planType: null, mrrCents: 0, canceling: false, currentPeriodEnd: null };
  const pick = (pred) => subs.find(pred);
  const active = pick((s) => SUB_ACTIVE.includes(s.status));
  if (active) {
    return {
      state: active.cancelAtPeriodEnd ? 'canceling' : 'active',
      id: active.id || null,
      planType: active.planType,
      mrrCents: PLAN_MRR_CENTS[active.planType] ?? 0,
      canceling: !!active.cancelAtPeriodEnd,
      currentPeriodEnd: active.currentPeriodEnd || null,
    };
  }
  const issue = pick((s) => SUB_PAYMENT_ISSUE.includes(s.status));
  if (issue) return { id: issue.id || null, state: 'past_due', planType: issue.planType, mrrCents: 0, canceling: false, currentPeriodEnd: issue.currentPeriodEnd || null };
  const churned = pick((s) => ['cancelled', 'canceled', 'refunded'].includes(s.status));
  if (churned) return { id: churned.id || null, state: 'churned', planType: churned.planType, mrrCents: 0, canceling: false, currentPeriodEnd: churned.currentPeriodEnd || null };
  return { id: null, state: 'none', planType: null, mrrCents: 0, canceling: false, currentPeriodEnd: null };
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

function parseDateOnly(v) {
  if (v == null) return undefined;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

async function audit(action, studentId, req) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        studentId: studentId || null,
        actorRole: req.auth?.role || 'unknown',
        actorEmail: req.auth?.email || 'unknown',
      },
    });
  } catch {
    // audit failure must never break the main request
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

function decimalToNumber(value) {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function serializeStudent(student) {
  if (!student) return student;
  const s = { ...student };
  s.birthDate = dateOnly(student.birthDate);
  s.entryDate = dateOnly(student.entryDate);
  s.withdrawalDate = dateOnly(student.withdrawalDate);
  s.graduationDate = dateOnly(student.graduationDate);
  s.transcriptDate = dateOnly(student.transcriptDate);
  s.currentGrade = computeCurrentGrade(student.graduationDate);
  return s;
}

/** List students — admin only. Supports ?page=1&limit=20&search=name */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const search = (req.query.search || '').trim();

  const where = search
    ? { name: { contains: search, mode: 'insensitive' } }
    : {};

  const [total, list] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        studentCode: true,
        name: true,
        birthDate: true,
        gender: true,
        city: true,
        province: true,
        parentGuardian: true,
        graduationDate: true,
        withdrawalDate: true,
        updatedAt: true,
        account: { select: { email: true } },
        _count: { select: { semesters: true } },
        semesters: {
          select: {
            courseRows: { select: { courseName: true, credits: true, letterGrade: true } },
          },
        },
      },
    }),
  ]);

  const students = list.map((s) => {
    const transcriptRows = (s.semesters || []).flatMap((sem) => sem.courseRows || []);
    const creditsEarned = transcriptRows
      .filter((row) => row.courseName && row.letterGrade && decimalToNumber(row.credits) > 0)
      .reduce((sum, row) => sum + decimalToNumber(row.credits), 0);
    return {
      id: s.id,
      studentCode: s.studentCode ?? null,
      name: s.name,
      birthDate: dateOnly(s.birthDate),
      gender: s.gender,
      city: s.city,
      province: s.province,
      parentGuardian: s.parentGuardian,
      graduationDate: dateOnly(s.graduationDate),
      withdrawalDate: dateOnly(s.withdrawalDate),
      currentGrade: computeCurrentGrade(s.graduationDate),
      loginEmail: s.account?.email ?? null,
      semesterCount: s._count.semesters,
      creditsEarned: Number(creditsEarned.toFixed(1)),
      graduationCreditThreshold: GRADUATION_CREDIT_THRESHOLD,
      meetsGraduationCredits: creditsEarned >= GRADUATION_CREDIT_THRESHOLD,
      updatedAt: s.updatedAt,
    };
  });

  res.json({
    students,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

/** Create student profile — admin only. Optionally creates a login account if email + password are provided. */
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const body = req.body || {};
  const partial = studentProfileSchema.partial().extend({ name: z.string().min(1).max(200).default('New student') });
  const parse = partial.safeParse(body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
  }
  const d = parse.data;

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
  const password = typeof body.password === 'string' ? body.password : null;

  if (email && !password) return res.status(400).json({ error: 'password required when email is provided' });
  if (password && password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });

  if (email) {
    const existing = await prisma.studentAccount.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'email already registered' });
  }

  const profileData = {
    name: d.name,
    birthDate: parseDateOnly(d.birthDate) ?? null,
    gender: d.gender ?? null,
    parentGuardian: d.parentGuardian ?? null,
    parentEmail: d.parentEmail ?? null,
    address: d.address ?? null,
    city: d.city ?? null,
    province: d.province ?? null,
    zipCode: d.zipCode ?? null,
    entryDate: parseDateOnly(d.entryDate) ?? null,
    withdrawalDate: parseDateOnly(d.withdrawalDate) ?? null,
    graduationDate: parseDateOnly(d.graduationDate) ?? null,
    transcriptDate: parseDateOnly(d.transcriptDate) ?? null,
  };

  let student;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 12);
    student = await prisma.student.create({
      data: {
        ...profileData,
        account: { create: { email, passwordHash } },
      },
    });
  } else {
    student = await prisma.student.create({ data: profileData });
  }

  await audit('student_create', student.id, req);
  res.status(201).json({ student: serializeStudent(student) });
});

/** Student learning progress summary — admin only */
router.get('/progress', authenticate, requireAdmin, async (req, res) => {
  const students = await prisma.student.findMany({
    where: { withdrawalDate: null },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      studentCode: true,
      name: true,
      graduationDate: true,
      semesters: {
        select: {
          courseRows: {
            select: {
              courseName: true,
              credits: true,
              letterGrade: true,
            },
          },
        },
      },
      enrollments: {
        select: {
          completedModules: true,
          creditEarned: true,
          course: { select: { credits: true, _count: { select: { modules: true } } } },
          moduleProgresses: {
            select: { moduleOrder: true, moduleCompletedAt: true, lastActivityAt: true },
            orderBy: { lastActivityAt: 'desc' },
          },
          quizAttempts: {
            select: { moduleOrder: true, submittedAt: true },
            orderBy: { submittedAt: 'desc' },
          },
          examAttempts: {
            where: { submittedAt: { not: null } },
            select: { examType: true, submittedAt: true, passed: true },
            orderBy: { submittedAt: 'desc' },
          },
          assignments: {
            select: { updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
      },
      loginSessions: {
        select: {
          role: true,
          startedAt: true,
          lastSeenAt: true,
          endedAt: true,
          durationSeconds: true,
        },
        orderBy: { lastSeenAt: 'desc' },
        take: 20,
      },
      careState: true,
      careLogs: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  });

  const now = new Date();
  const result = students.map((s) => {
    const enrollments = s.enrollments || [];
    const portalCreditsEarned = enrollments
      .filter((e) => e.creditEarned)
      .reduce((sum, e) => sum + decimalToNumber(e.course.credits), 0);
    const transcriptRows = (s.semesters || []).flatMap((sem) => sem.courseRows || []);
    const officialCreditsEarned = transcriptRows
      .filter((row) => row.courseName && row.letterGrade && decimalToNumber(row.credits) > 0)
      .reduce((sum, row) => sum + decimalToNumber(row.credits), 0);

    const dates = [];
    for (const enr of enrollments) {
      for (const attempt of enr.quizAttempts || []) {
        if (attempt.submittedAt) dates.push(new Date(attempt.submittedAt));
      }
      for (const attempt of enr.examAttempts || []) {
        if (attempt.submittedAt) dates.push(new Date(attempt.submittedAt));
      }
      if (enr.assignments[0]?.updatedAt) dates.push(new Date(enr.assignments[0].updatedAt));
      for (const progress of enr.moduleProgresses || []) {
        if (progress.lastActivityAt) dates.push(new Date(progress.lastActivityAt));
      }
    }
    for (const session of s.loginSessions || []) {
      if (session.lastSeenAt) dates.push(new Date(session.lastSeenAt));
      else if (session.startedAt) dates.push(new Date(session.startedAt));
    }
    const lastActivity = dates.length > 0 ? new Date(Math.max(...dates)) : null;
    const daysInactive = lastActivity
      ? Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24))
      : null;

    const totalModules = enrollments.reduce((sum, e) => sum + (e.course?._count?.modules || 0), 0);
    const completedModules = enrollments.reduce((sum, e) => {
      const completedFromArray = Array.isArray(e.completedModules) ? e.completedModules.length : 0;
      const completedFromProgress = (e.moduleProgresses || []).filter((p) => p.moduleCompletedAt).length;
      return sum + Math.max(completedFromArray, completedFromProgress);
    }, 0);
    const submittedQuizzes = enrollments.reduce((sum, e) => sum + (e.quizAttempts || []).length, 0);
    const submittedExams = enrollments.reduce((sum, e) => sum + (e.examAttempts || []).length, 0);
    const recentLoginSessions = s.loginSessions || [];
    const lastLoginAt = recentLoginSessions[0]?.lastSeenAt || recentLoginSessions[0]?.startedAt || null;
    const recentSessionDurationSeconds = recentLoginSessions.reduce(
      (sum, session) => sum + (Number(session.durationSeconds) || 0),
      0
    );

    const consistency = [];
    if (officialCreditsEarned > 0 && enrollments.length === 0) {
      consistency.push('Transcript has official credits but no Learn Portal enrollments.');
    }
    if (portalCreditsEarned > officialCreditsEarned + 0.1) {
      consistency.push('Learn Portal earned credits are not fully posted to the official transcript.');
    }
    if (officialCreditsEarned > portalCreditsEarned + 3) {
      consistency.push('Official transcript includes historical/import credits outside Learn Portal.');
    }
    const completedButMissingCredit = enrollments.filter((e) => {
      const moduleCount = e.course?._count?.modules || 0;
      const doneCount = Math.max(
        Array.isArray(e.completedModules) ? e.completedModules.length : 0,
        (e.moduleProgresses || []).filter((p) => p.moduleCompletedAt).length
      );
      const hasFinal = (e.examAttempts || []).some((a) => a.examType === 'final' && a.passed);
      return !e.creditEarned && moduleCount > 0 && doneCount >= moduleCount && hasFinal;
    }).length;
    if (completedButMissingCredit > 0) {
      consistency.push(`${completedButMissingCredit} completed Learn Portal course(s) are missing creditEarned.`);
    }
    const computedCare = computeCareSignals({
      daysInactive,
      consistency,
      totalEnrollments: enrollments.length,
      totalModules,
      completedModules,
      submittedQuizzes,
      submittedExams,
      lastReviewedAt: s.careState?.lastReviewedAt,
      nextCheckInDueAt: s.careState?.nextCheckInDueAt,
    }, now);
    const displayCare = displayCareState(s.careState, computedCare);

    return {
      id: s.id,
      studentCode: s.studentCode,
      name: s.name,
      currentGrade: computeCurrentGrade(s.graduationDate),
      creditsEarned: officialCreditsEarned,
      officialCreditsEarned,
      portalCreditsEarned,
      inProgress: enrollments.filter((e) => !e.creditEarned).length,
      completed: enrollments.filter((e) => e.creditEarned).length,
      totalEnrollments: enrollments.length,
      totalModules,
      completedModules,
      submittedQuizzes,
      submittedExams,
      lastLoginAt: lastLoginAt ? new Date(lastLoginAt).toISOString() : null,
      recentLoginSessionCount: recentLoginSessions.length,
      recentSessionDurationSeconds,
      recentSessionDurationMinutes: Math.round(recentSessionDurationSeconds / 60),
      transcriptRows: transcriptRows.length,
      consistency,
      lastActivity: lastActivity?.toISOString() ?? null,
      daysInactive,
      careState: serializeCareState(s.careState),
      careDisplay: displayCare,
      computedCare,
      recentCareLogs: (s.careLogs || []).map((log) => serializeCareLog(log)),
    };
  });

  // Sort: never-active first, then most-inactive first
  result.sort((a, b) => {
    if (a.daysInactive === null && b.daysInactive === null) return a.name.localeCompare(b.name);
    if (a.daysInactive === null) return -1;
    if (b.daysInactive === null) return 1;
    return b.daysInactive - a.daysInactive;
  });

  res.json({ students: result });
});

/**
 * Ops cockpit summary — admin only.
 *
 * One call that powers the /admin roster as a daily command center:
 *   - per-student operational signals (payment, last activity, ungraded work,
 *     risk, next check-in, last parent contact, graduation readiness)
 *   - action-strip counts (what needs attention today)
 *   - revenue line (MRR, active vs at-risk)
 *
 * Built so the dashboard never has to fan out across billing/progress/grading.
 */
router.get('/ops-summary', authenticate, requireAdmin, async (req, res) => {
  const now = new Date();
  const today = dateOnly(now);

  const [students, allSubs, assignmentsToGrade, applicationsPending] = await Promise.all([
    prisma.student.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        studentCode: true,
        name: true,
        gender: true,
        parentGuardian: true,
        parentEmail: true,
        graduationDate: true,
        withdrawalDate: true,
        updatedAt: true,
        account: { select: { email: true } },
        semesters: { select: { courseRows: { select: { courseName: true, credits: true, letterGrade: true, weightedGpa: true, unweightedGpa: true } } } },
        enrollments: {
          select: {
            assignments: { select: { gradedAt: true } },
            moduleProgresses: { select: { lastActivityAt: true }, orderBy: { lastActivityAt: 'desc' }, take: 1 },
            quizAttempts: { select: { submittedAt: true }, orderBy: { submittedAt: 'desc' }, take: 1 },
            examAttempts: { where: { submittedAt: { not: null } }, select: { submittedAt: true }, orderBy: { submittedAt: 'desc' }, take: 1 },
          },
        },
        loginSessions: { select: { lastSeenAt: true, startedAt: true }, orderBy: { lastSeenAt: 'desc' }, take: 1 },
        subscriptions: { select: { id: true, status: true, planType: true, cancelAtPeriodEnd: true, currentPeriodEnd: true } },
        careState: { select: { riskLevel: true, status: true, advisorOwner: true, nextCheckInDueAt: true } },
        careLogs: { where: { type: 'parent_contact' }, select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
    prisma.subscription.findMany({ select: { id: true, purchaserEmail: true, studentId: true, status: true, planType: true, cancelAtPeriodEnd: true, currentPeriodEnd: true } }),
    prisma.assignmentSubmission.count({ where: { gradedAt: null } }),
    prisma.application.count({ where: { status: 'pending' } }),
  ]);

  // Index unlinked subscriptions by purchaser email so a parent's payment still
  // resolves even before an admin manually links it to the student record.
  const subsByEmail = new Map();
  for (const s of allSubs) {
    if (!s.purchaserEmail) continue;
    const key = s.purchaserEmail.trim().toLowerCase();
    if (!subsByEmail.has(key)) subsByEmail.set(key, []);
    subsByEmail.get(key).push(s);
  }

  let mrrCents = 0;
  let activeCount = 0;
  let atRiskCount = 0;
  const countedRevenueSubs = new Set();
  const countedRiskSubs = new Set();

  const list = students.map((s) => {
    const status = s.withdrawalDate ? 'withdrawn' : (s.graduationDate && dateOnly(s.graduationDate) <= today ? 'graduated' : 'enrolled');

    // Credits + GPA from the official transcript rows.
    const rows = (s.semesters || []).flatMap((sem) => sem.courseRows || []);
    const gradedRows = rows.filter((r) => r.courseName && r.letterGrade && decimalToNumber(r.credits) > 0);
    const creditsEarned = gradedRows.reduce((sum, r) => sum + decimalToNumber(r.credits), 0);
    const totals = computeSemesterTotals(gradedRows.map((r) => ({
      courseName: r.courseName, credits: r.credits, weightedGpa: r.weightedGpa, unweightedGpa: r.unweightedGpa,
    })));
    const gpa = totals.unweightedGPA === '-' ? null : totals.unweightedGPA;

    // Last activity across learning events + logins.
    const candidates = [];
    for (const e of s.enrollments || []) {
      if (e.moduleProgresses[0]?.lastActivityAt) candidates.push(new Date(e.moduleProgresses[0].lastActivityAt));
      if (e.quizAttempts[0]?.submittedAt) candidates.push(new Date(e.quizAttempts[0].submittedAt));
      if (e.examAttempts[0]?.submittedAt) candidates.push(new Date(e.examAttempts[0].submittedAt));
    }
    if (s.loginSessions[0]?.lastSeenAt) candidates.push(new Date(s.loginSessions[0].lastSeenAt));
    else if (s.loginSessions[0]?.startedAt) candidates.push(new Date(s.loginSessions[0].startedAt));
    const lastActivity = candidates.length ? new Date(Math.max(...candidates.map((d) => d.getTime()))) : null;
    const daysInactive = lastActivity ? Math.floor((now - lastActivity) / 86400000) : null;
    const isInactive = status === 'enrolled' && (lastActivity === null || daysInactive >= INACTIVE_DAYS);

    const ungradedCount = (s.enrollments || []).reduce((sum, e) => sum + (e.assignments || []).filter((a) => !a.gradedAt).length, 0);

    // Subscription: prefer linked rows, fall back to purchaser-email match.
    let subs = (s.subscriptions || []);
    if (subs.length === 0 && s.parentEmail) subs = subsByEmail.get(s.parentEmail.trim().toLowerCase()) || [];
    const sub = resolveSubscription(subs);
    const paymentIssue = sub.state === 'past_due' || sub.state === 'canceling';
    if (status !== 'withdrawn') {
      const subKey = sub.id ? `sub:${sub.id}` : null;
      if (sub.state === 'active' && subKey && !countedRevenueSubs.has(subKey)) {
        countedRevenueSubs.add(subKey);
        activeCount += 1;
        mrrCents += sub.mrrCents;
      }
      if (paymentIssue && subKey && !countedRiskSubs.has(subKey)) {
        countedRiskSubs.add(subKey);
        atRiskCount += 1;
      }
    }

    const nextCheckInDueAt = s.careState?.nextCheckInDueAt ? dateOnly(s.careState.nextCheckInDueAt) : null;
    const followUpDue = !!(nextCheckInDueAt && nextCheckInDueAt <= today && status === 'enrolled');

    return {
      id: s.id,
      studentCode: s.studentCode ?? null,
      name: s.name,
      gender: s.gender,
      parentGuardian: s.parentGuardian,
      graduationDate: dateOnly(s.graduationDate),
      withdrawalDate: dateOnly(s.withdrawalDate),
      currentGrade: computeCurrentGrade(s.graduationDate),
      loginEmail: s.account?.email ?? null,
      creditsEarned: Number(creditsEarned.toFixed(1)),
      graduationCreditThreshold: GRADUATION_CREDIT_THRESHOLD,
      meetsGraduationCredits: creditsEarned >= GRADUATION_CREDIT_THRESHOLD,
      gpa,
      // ops signals
      subscriptionState: sub.state,
      subscriptionPlan: sub.planType,
      paymentIssue,
      lastActivityAt: lastActivity ? lastActivity.toISOString() : null,
      daysInactive,
      isInactive,
      ungradedCount,
      riskLevel: s.careState?.riskLevel || null,
      advisorOwner: s.careState?.advisorOwner || null,
      nextCheckInDueAt,
      followUpDue,
      lastParentContactAt: s.careLogs[0]?.createdAt ? dateOnly(s.careLogs[0].createdAt) : null,
    };
  });

  const enrolled = list.filter((s) => !s.withdrawalDate && !(s.graduationDate && s.graduationDate <= today));
  const actionCounts = {
    paymentIssues: list.filter((s) => s.paymentIssue && !s.withdrawalDate).length,
    assignmentsToGrade,
    applicationsPending,
    inactive: enrolled.filter((s) => s.isInactive).length,
    careFollowUpsDue: list.filter((s) => s.followUpDue).length,
    noLogin: enrolled.filter((s) => !s.loginEmail).length,
    graduationReady: enrolled.filter((s) => s.meetsGraduationCredits).length,
  };

  res.json({
    students: list,
    actionCounts,
    revenue: { mrrCents, activeCount, atRiskCount },
    generatedAt: now.toISOString(),
  });
});

router.get('/:id/care-state', authenticate, requireAdmin, async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    select: { id: true },
  });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const careState = await prisma.studentCareState.findUnique({
    where: { studentId: req.params.id },
  });
  res.json({ careState: serializeCareState(careState) });
});

router.patch('/:id/care-state', authenticate, requireAdmin, async (req, res) => {
  const student = await ensureStudentMutable(prisma, req.params.id, res);
  if (!student) return;

  const nextCheckInDueAt = parseOptionalDate(req.body?.nextCheckInDueAt);
  const lastReviewedAt = parseOptionalDate(req.body?.lastReviewedAt);
  if (nextCheckInDueAt === undefined) return res.status(400).json({ error: 'nextCheckInDueAt must be YYYY-MM-DD or ISO date' });
  if (lastReviewedAt === undefined) return res.status(400).json({ error: 'lastReviewedAt must be YYYY-MM-DD or ISO date' });

  const internalFlags = req.body?.internalFlags && typeof req.body.internalFlags === 'object' && !Array.isArray(req.body.internalFlags)
    ? req.body.internalFlags
    : {};

  const data = {
    advisorOwner: String(req.body?.advisorOwner || '').trim().slice(0, 200),
    status: normalizeChoice(req.body?.status, CARE_STATUSES, 'active'),
    riskLevel: normalizeChoice(req.body?.riskLevel, RISK_LEVELS, 'low'),
    careTier: normalizeChoice(req.body?.careTier, CARE_TIERS, 'self_paced'),
    manualOverride: req.body?.manualOverride === true,
    lastReviewedAt,
    nextCheckInDueAt,
    currentGoal: String(req.body?.currentGoal || '').trim().slice(0, 1000),
    internalFlags,
  };

  const careState = await prisma.studentCareState.upsert({
    where: { studentId: req.params.id },
    create: { studentId: req.params.id, ...data },
    update: data,
  });
  await audit('care_state_update', req.params.id, req);
  res.json({ careState: serializeCareState(careState) });
});

router.get('/:id/care-logs', authenticate, requireAdmin, async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    select: { id: true },
  });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const logs = await prisma.studentCareLog.findMany({
    where: { studentId: req.params.id },
    orderBy: { createdAt: 'desc' },
    take: Math.min(100, Math.max(1, Number(req.query.limit) || 50)),
  });
  res.json({ logs: logs.map((log) => serializeCareLog(log)) });
});

router.post('/:id/care-logs', authenticate, requireAdmin, async (req, res) => {
  const student = await ensureStudentMutable(prisma, req.params.id, res);
  if (!student) return;

  const followUpAt = parseOptionalDate(req.body?.followUpAt);
  const resolvedAt = parseOptionalDate(req.body?.resolvedAt);
  if (followUpAt === undefined) return res.status(400).json({ error: 'followUpAt must be YYYY-MM-DD or ISO date' });
  if (resolvedAt === undefined) return res.status(400).json({ error: 'resolvedAt must be YYYY-MM-DD or ISO date' });

  const visibility = normalizeChoice(req.body?.visibility, CARE_VISIBILITIES, 'internal');
  const parentSummary = String(req.body?.parentSummary || '').trim().slice(0, 2000);
  if (visibility === 'parent_safe' && !parentSummary) {
    return res.status(400).json({ error: 'parentSummary is required for parent_safe logs' });
  }

  const log = await prisma.studentCareLog.create({
    data: {
      studentId: req.params.id,
      type: normalizeChoice(req.body?.type, CARE_LOG_TYPES, 'advisor_note'),
      visibility,
      title: String(req.body?.title || '').trim().slice(0, 200),
      bodyInternal: String(req.body?.bodyInternal || '').trim().slice(0, 10000),
      parentSummary,
      channel: normalizeChoice(req.body?.channel, CARE_CHANNELS, 'internal'),
      outcome: String(req.body?.outcome || '').trim().slice(0, 2000),
      followUpAt,
      resolvedAt,
      authorEmail: req.auth?.email || '',
    },
  });
  await audit('care_log_create', req.params.id, req);
  res.status(201).json({ log: serializeCareLog(log) });
});

/** Full student + nested transcript — admin or that student */
router.get('/:id', authenticate, requireStudentOrAdminForStudentParam, async (req, res) => {
  const isAdmin = req.auth?.role === 'admin';
  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    include: {
      semesters: {
        orderBy: { sortOrder: 'asc' },
        include: { courseRows: { orderBy: { sortOrder: 'asc' } } },
      },
      ...(isAdmin ? { account: { select: { email: true } } } : {}),
    },
  });
  if (!student) return res.status(404).json({ error: 'Student not found' });
  if (!isAdmin) {
    const now = new Date();
    (student.semesters || []).forEach(sem => {
      if (sem.releaseDate && new Date(sem.releaseDate) > now) {
        sem.courseRows.forEach(row => { row.letterGrade = ''; row.weightedGpa = null; row.unweightedGpa = null; });
      }
    });
  }
  const serialized = serializeStudent(student);
  if (isAdmin) {
    serialized.loginEmail = student.account?.email ?? null;
  }
  res.json({ student: serialized });
});

router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const allowed = [
    'name',
    'studentCode',
    'birthDate',
    'gender',
    'parentGuardian',
    'parentEmail',
    'address',
    'city',
    'province',
    'zipCode',
    'entryDate',
    'withdrawalDate',
    'graduationDate',
    'transcriptDate',
  ];
  const data = {};
  for (const key of allowed) {
    if (key in (req.body || {})) {
      if (
        key === 'birthDate' ||
        key === 'entryDate' ||
        key === 'withdrawalDate' ||
        key === 'graduationDate' ||
        key === 'transcriptDate'
      ) {
        const parsed = parseDateOnly(req.body[key]);
        if (parsed === undefined) {
          return res.status(400).json({ error: `${key} must be YYYY-MM-DD` });
        }
        data[key] = parsed;
      } else {
        data[key] = req.body[key];
      }
    }
  }
  const mutableStudent = await ensureStudentMutable(prisma, req.params.id, res);
  if (!mutableStudent) return;
  try {
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data,
    });
    await audit('profile_update', req.params.id, req);
    res.json({ student: serializeStudent(student) });
  } catch {
    res.status(404).json({ error: 'Student not found' });
  }
});

/** PUT /api/students/:id/login — create or reset login credentials for a student (admin only) */
router.put('/:id/login', authenticate, requireAdmin, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });

  const student = await ensureStudentMutable(prisma, req.params.id, res);
  if (!student) return;

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.studentAccount.findUnique({ where: { email: normalizedEmail } });
  if (existing && existing.studentId !== req.params.id) {
    return res.status(409).json({ error: 'email already used by another student' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.studentAccount.upsert({
    where: { studentId: req.params.id },
    create: { studentId: req.params.id, email: normalizedEmail, passwordHash },
    update: { email: normalizedEmail, passwordHash },
  });

  await audit('login_set', req.params.id, req);
  res.json({ ok: true, email: normalizedEmail });
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const student = await ensureStudentMutable(prisma, req.params.id, res);
  if (!student) return;
  try {
    await audit('student_delete', req.params.id, req);
    await prisma.student.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Student not found' });
  }
});

/**
 * Replace entire transcript: semesters + course rows.
 * Body: { semesters: [ { key, sortOrder?, courseRows: [ { courseName, courseType, credits, letterGrade } ] } ] }
 */
router.put('/:id/transcript', authenticate, requireAdmin, async (req, res) => {
  const studentId = req.params.id;
  const semestersInput = req.body?.semesters;
  if (!Array.isArray(semestersInput)) {
    return res.status(400).json({ error: 'semesters array required' });
  }

  const student = await ensureStudentMutable(prisma, studentId, res);
  if (!student) return;
  const existingSemesters = await prisma.semester.findMany({
    where: { studentId },
    select: { key: true, releaseDate: true },
  });
  const existingReleaseByKey = new Map(existingSemesters.map((sem) => [sem.key, sem.releaseDate]));

  try {
    await prisma.$transaction(async (tx) => {
      await tx.semester.deleteMany({ where: { studentId } });

      for (let si = 0; si < semestersInput.length; si += 1) {
        const sem = semestersInput[si];
        const key = sem.key;
        if (!key || typeof key !== 'string') {
          throw new Error(`semesters[${si}].key required`);
        }
        const sortOrder = Number.isFinite(sem.sortOrder) ? sem.sortOrder : si;

        const created = await tx.semester.create({
          data: {
            studentId,
            key: key.trim(),
            sortOrder,
            releaseDate: parseDateOnly(sem.releaseDate) ?? existingReleaseByKey.get(key.trim()) ?? null,
          },
        });

        const rows = Array.isArray(sem.courseRows) ? sem.courseRows : [];
        for (let ri = 0; ri < rows.length; ri += 1) {
          const r = rows[ri];
          const gpas = computeRowGpa({
            courseName: r.courseName || '',
            courseType: r.courseType || '',
            letterGrade: r.letterGrade || '',
          });
          const credits = parseFloat(String(r.credits ?? ''));
          const creditsValue = Number.isFinite(credits) && credits > 0 ? credits : null;
          await tx.courseRow.create({
            data: {
              semesterId: created.id,
              sortOrder: ri,
              courseName: r.courseName ?? '',
              courseType: r.courseType ?? '',
              credits: creditsValue,
              letterGrade: r.letterGrade ?? '',
              weightedGpa: gpas.weightedGpa,
              unweightedGpa: gpas.unweightedGpa,
            },
          });
        }
      }
    });
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Invalid transcript payload' });
  }

  const updated = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      semesters: {
        orderBy: { sortOrder: 'asc' },
        include: {
          courseRows: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });

  await audit('transcript_update', studentId, req);
  res.json({ student: serializeStudent(updated) });
});

/**
 * Student audit trail — admin only.
 *
 * Returns a chronological evidence chain for a single student that can be
 * shown to a college admissions officer / FL DOE auditor:
 *   - Identity + enrollment summary
 *   - All quiz attempts, assignment submissions, exam attempts with timestamps
 *   - Course modules with derived "completed at" datetime
 *   - Admin audit log entries scoped to this student
 *
 * Sorted newest-first. The frontend renders this as a per-week timeline
 * + per-course breakdown + Export PDF button.
 *
 * RF-1 / T-001.
 */
router.get('/:id/audit-trail', authenticate, requireAdmin, async (req, res) => {
  const studentId = req.params.id;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      studentCode: true,
      name: true,
      birthDate: true,
      entryDate: true,
      graduationDate: true,
      account: { select: { email: true } },
    },
  });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          name: true,
          credits: true,
          type: true,
          gradeLevel: true,
          modules: {
            select: { order: true, title: true, estimatedHrs: true },
            orderBy: { order: 'asc' },
          },
        },
      },
      quizAttempts: { orderBy: { submittedAt: 'desc' } },
      assignments: { orderBy: { submittedAt: 'desc' } },
      examAttempts: { orderBy: { startedAt: 'desc' } },
      moduleProgresses: { orderBy: { moduleOrder: 'asc' } },
    },
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      action: true,
      actorRole: true,
      actorEmail: true,
      createdAt: true,
    },
  });

  const loginSessions = await prisma.loginSession.findMany({
    where: { studentId },
    orderBy: { startedAt: 'desc' },
    take: 200,
    select: {
      id: true,
      role: true,
      email: true,
      startedAt: true,
      lastSeenAt: true,
      endedAt: true,
      durationSeconds: true,
      lastPath: true,
    },
  });

  const careLogs = await prisma.studentCareLog.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  // Flatten everything into a single timeline (one event per activity).
  const timeline = [];

  for (const enr of enrollments) {
    const courseName = enr.course?.name || '(unknown)';
    const moduleByOrder = new Map(
      (enr.course?.modules || []).map((m) => [m.order, m])
    );

    // Per-module completion datetime uses explicit ModuleProgress when present,
    // with legacy quiz/assignment fallback for older rows.
    const completionDate = new Map();
    for (const p of enr.moduleProgresses || []) {
      if (p.moduleCompletedAt) completionDate.set(p.moduleOrder, p.moduleCompletedAt);
    }
    for (const q of enr.quizAttempts) {
      if (q.passed) {
        const prev = completionDate.get(q.moduleOrder);
        if (!prev || q.submittedAt > prev) completionDate.set(q.moduleOrder, q.submittedAt);
      }
    }
    for (const a of enr.assignments) {
      if (a.gradedAt) {
        const prev = completionDate.get(a.moduleOrder);
        if (!prev || a.gradedAt > prev) completionDate.set(a.moduleOrder, a.gradedAt);
      }
    }

    for (const order of enr.completedModules || []) {
      const m = moduleByOrder.get(order);
      timeline.push({
        kind: 'module_complete',
        at: completionDate.get(order) || enr.creditEarnedAt || null,
        courseName,
        courseSlug: enr.course?.slug,
        moduleOrder: order,
        moduleTitle: m?.title || `Module ${order}`,
        estimatedHrs: m?.estimatedHrs ? Number(m.estimatedHrs) : 0,
      });
    }

    for (const p of enr.moduleProgresses || []) {
      const progressEvents = [
        ['video_complete', p.videoCompletedAt],
        ['supplemental_video_complete', p.supplementalVideoCompletedAt],
        ['reading_complete', p.readingCompletedAt],
        ['practice_complete', p.practiceCompletedAt],
      ];
      for (const [kind, at] of progressEvents) {
        if (!at) continue;
        const m = moduleByOrder.get(p.moduleOrder);
        timeline.push({
          kind,
          at,
          courseName,
          courseSlug: enr.course?.slug,
          moduleOrder: p.moduleOrder,
          moduleTitle: m?.title || `Module ${p.moduleOrder}`,
        });
      }
    }

    for (const q of enr.quizAttempts) {
      timeline.push({
        kind: 'quiz_attempt',
        at: q.submittedAt,
        courseName,
        courseSlug: enr.course?.slug,
        moduleOrder: q.moduleOrder,
        score: q.score != null ? Number(q.score) : null,
        passed: q.passed,
      });
    }

    for (const a of enr.assignments) {
      timeline.push({
        kind: 'assignment_submit',
        at: a.submittedAt,
        courseName,
        courseSlug: enr.course?.slug,
        moduleOrder: a.moduleOrder,
        score: a.score != null ? Number(a.score) : null,
        graded: a.gradedAt != null,
        gradedAt: a.gradedAt,
      });
    }

    for (const x of enr.examAttempts) {
      timeline.push({
        kind: 'exam_attempt',
        at: x.submittedAt || x.startedAt,
        startedAt: x.startedAt,
        submittedAt: x.submittedAt,
        courseName,
        courseSlug: enr.course?.slug,
        examType: x.examType,
        score: x.score != null ? Number(x.score) : null,
        passed: x.passed,
      });
    }
  }

  for (const log of auditLogs) {
    timeline.push({
      kind: 'admin_action',
      at: log.createdAt,
      action: log.action,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
    });
  }

  for (const session of loginSessions) {
    timeline.push({
      kind: 'login_session',
      at: session.startedAt,
      role: session.role,
      email: session.email,
      durationSeconds: session.durationSeconds,
      endedAt: session.endedAt,
      lastSeenAt: session.lastSeenAt,
      lastPath: session.lastPath,
    });
    if (session.endedAt) {
      timeline.push({
        kind: 'logout',
        at: session.endedAt,
        role: session.role,
        email: session.email,
        durationSeconds: session.durationSeconds,
      });
    }
  }

  for (const log of careLogs) {
    timeline.push({
      kind: 'care_log',
      at: log.createdAt,
      type: log.type,
      visibility: log.visibility,
      title: log.title,
      bodyInternal: log.bodyInternal,
      parentSummary: log.parentSummary,
      channel: log.channel,
      outcome: log.outcome,
      followUpAt: log.followUpAt,
      resolvedAt: log.resolvedAt,
      authorEmail: log.authorEmail,
    });
  }

  timeline.sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : 0;
    const tb = b.at ? new Date(b.at).getTime() : 0;
    return tb - ta;
  });

  // Per-course summary block
  const courses = enrollments.map((enr) => {
    const moduleHrs = new Map(
      (enr.course?.modules || []).map((m) => [m.order, Number(m.estimatedHrs || 0)])
    );
    const completed = enr.completedModules || [];
    const estHrs = completed.reduce((sum, o) => sum + (moduleHrs.get(o) || 0), 0);
    return {
      courseId: enr.course?.id,
      slug: enr.course?.slug,
      name: enr.course?.name,
      type: enr.course?.type,
      gradeLevel: enr.course?.gradeLevel,
      credits: enr.course?.credits ? Number(enr.course.credits) : null,
      semesterLabel: enr.semesterLabel,
      enrolledAt: enr.enrolledAt,
      creditEarned: enr.creditEarned,
      creditEarnedAt: enr.creditEarnedAt,
      modulesCompleted: completed.length,
      modulesTotal: (enr.course?.modules || []).length,
      estimatedHrs: Number(estHrs.toFixed(1)),
      quizAttempts: enr.quizAttempts.length,
      quizPassed: enr.quizAttempts.filter((q) => q.passed).length,
      assignments: enr.assignments.length,
      assignmentsGraded: enr.assignments.filter((a) => a.gradedAt).length,
      exams: enr.examAttempts.length,
      examsPassed: enr.examAttempts.filter((x) => x.passed).length,
    };
  });

  // Totals
  const totals = courses.reduce(
    (acc, c) => {
      acc.modulesCompleted += c.modulesCompleted;
      acc.estimatedHrs += c.estimatedHrs;
      acc.quizAttempts += c.quizAttempts;
      acc.quizPassed += c.quizPassed;
      acc.assignments += c.assignments;
      acc.assignmentsGraded += c.assignmentsGraded;
      acc.exams += c.exams;
      acc.examsPassed += c.examsPassed;
      return acc;
    },
    {
      modulesCompleted: 0,
      estimatedHrs: 0,
      quizAttempts: 0,
      quizPassed: 0,
      assignments: 0,
      assignmentsGraded: 0,
      exams: 0,
      examsPassed: 0,
    }
  );
  totals.estimatedHrs = Number(totals.estimatedHrs.toFixed(1));
  totals.loginSessions = loginSessions.length;
  totals.sessionDurationSeconds = loginSessions.reduce(
    (sum, session) => sum + (Number(session.durationSeconds) || 0),
    0
  );
  totals.sessionDurationMinutes = Math.round(totals.sessionDurationSeconds / 60);
  totals.lastLoginAt = loginSessions[0]?.startedAt?.toISOString() || null;
  totals.lastSeenAt = loginSessions
    .map((session) => session.lastSeenAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0]?.toISOString() || null;

  res.json({
    student: {
      ...student,
      birthDate: dateOnly(student.birthDate),
      entryDate: dateOnly(student.entryDate),
      graduationDate: dateOnly(student.graduationDate),
      loginEmail: student.account?.email ?? null,
    },
    totals,
    courses,
    loginSessions,
    careLogs: careLogs.map((log) => serializeCareLog(log)),
    timeline,
    generatedAt: new Date().toISOString(),
  });
});

/** Audit log — admin only */
router.get('/audit', authenticate, requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const studentId = req.query.studentId || undefined;

  const where = studentId ? { studentId } : {};
  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        action: true,
        studentId: true,
        actorRole: true,
        actorEmail: true,
        createdAt: true,
        student: { select: { name: true } },
      },
    }),
  ]);

  res.json({
    logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

module.exports = router;
