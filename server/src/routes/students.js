const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const {
  authenticate,
  requireAdmin,
  requireStudentOrAdminForStudentParam,
} = require('../middleware/auth');
const { computeRowGpa } = require('../lib/gpa');

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
      },
    }),
  ]);

  const students = list.map((s) => ({
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
    updatedAt: s.updatedAt,
  }));

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
      enrollments: {
        select: {
          creditEarned: true,
          course: { select: { credits: true } },
          quizAttempts: {
            select: { submittedAt: true },
            orderBy: { submittedAt: 'desc' },
            take: 1,
          },
          examAttempts: {
            where: { submittedAt: { not: null } },
            select: { submittedAt: true },
            orderBy: { submittedAt: 'desc' },
            take: 1,
          },
          assignments: {
            select: { updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  const now = new Date();
  const result = students.map((s) => {
    const enrollments = s.enrollments || [];
    const creditsEarned = enrollments
      .filter((e) => e.creditEarned)
      .reduce((sum, e) => sum + Number(e.course.credits), 0);

    const dates = [];
    for (const enr of enrollments) {
      if (enr.quizAttempts[0]?.submittedAt) dates.push(new Date(enr.quizAttempts[0].submittedAt));
      if (enr.examAttempts[0]?.submittedAt) dates.push(new Date(enr.examAttempts[0].submittedAt));
      if (enr.assignments[0]?.updatedAt) dates.push(new Date(enr.assignments[0].updatedAt));
    }
    const lastActivity = dates.length > 0 ? new Date(Math.max(...dates)) : null;
    const daysInactive = lastActivity
      ? Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: s.id,
      studentCode: s.studentCode,
      name: s.name,
      currentGrade: computeCurrentGrade(s.graduationDate),
      creditsEarned,
      inProgress: enrollments.filter((e) => !e.creditEarned).length,
      completed: enrollments.filter((e) => e.creditEarned).length,
      totalEnrollments: enrollments.length,
      lastActivity: lastActivity?.toISOString() ?? null,
      daysInactive,
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

  const student = await prisma.student.findUnique({ where: { id: req.params.id } });
  if (!student) return res.status(404).json({ error: 'Student not found' });

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

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
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
