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
  const serialized = serializeStudent(student);
  if (isAdmin) serialized.loginEmail = student.account?.email ?? null;
  res.json({ student: serialized });
});

router.patch('/:id', authenticate, requireStudentOrAdminForStudentParam, async (req, res) => {
  const allowed = [
    'name',
    'studentCode',
    'birthDate',
    'gender',
    'parentGuardian',
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
router.put('/:id/transcript', authenticate, requireStudentOrAdminForStudentParam, async (req, res) => {
  const studentId = req.params.id;
  const semestersInput = req.body?.semesters;
  if (!Array.isArray(semestersInput)) {
    return res.status(400).json({ error: 'semesters array required' });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

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
