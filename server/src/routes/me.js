const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { ensureStudentMutable } = require('../lib/studentArchive');

const prisma = new PrismaClient();
const router = express.Router();

const EDITABLE_FIELDS = ['name', 'gender', 'parentGuardian', 'address', 'city', 'province', 'zipCode'];

// GET /api/me — full student profile
router.get('/', authenticate, async (req, res) => {
  if (req.auth.role !== 'student') return res.status(403).json({ error: 'Students only' });

  try {
    const account = await prisma.studentAccount.findUnique({
      where: { studentId: req.auth.studentId },
      include: {
        student: {
          select: {
            id: true, studentCode: true, name: true, birthDate: true, gender: true,
            parentGuardian: true, address: true, city: true, province: true, zipCode: true,
            entryDate: true, graduationDate: true,
            enrollments: {
              include: {
                course: { select: { slug: true, name: true, nameZh: true, credits: true, department: true } },
                quizAttempts: { select: { moduleOrder: true, score: true } },
                examAttempts: { where: { submittedAt: { not: null } } },
              },
            },
            semesters: {
              select: {
                key: true,
                releaseDate: true,
                courseRows: { select: { courseName: true, credits: true, letterGrade: true } },
              },
            },
          },
        },
      },
    });

    if (!account) return res.status(404).json({ error: 'Profile not found' });
    const now = new Date();
    (account.student.semesters || []).forEach(sem => {
      if (sem.releaseDate && new Date(sem.releaseDate) > now) {
        sem.courseRows.forEach(row => { row.letterGrade = ''; row.weightedGpa = null; row.unweightedGpa = null; });
      }
    });
    res.json({ email: account.email, ...account.student });
  } catch (e) {
    console.error('[GET /api/me]', e);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// PATCH /api/me — update editable fields
router.patch('/', authenticate, async (req, res) => {
  if (req.auth.role !== 'student') return res.status(403).json({ error: 'Students only' });
  const mutableStudent = await ensureStudentMutable(prisma, req.auth.studentId, res);
  if (!mutableStudent) return;

  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) {
      data[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
    }
  }

  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No editable fields provided' });

  const student = await prisma.student.update({
    where: { id: req.auth.studentId },
    data,
    select: {
      id: true, studentCode: true, name: true, birthDate: true, gender: true,
      parentGuardian: true, address: true, city: true, province: true, zipCode: true,
      entryDate: true, graduationDate: true,
    },
  });

  res.json(student);
});

module.exports = router;
