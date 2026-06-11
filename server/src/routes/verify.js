const express = require('express');

const prisma = require('../lib/prisma');
const router = express.Router();

function isOnOrBeforeToday(date) {
  if (!date) return false;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  const utcDate = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return utcDate <= utcToday;
}

// GET /api/verify/:code  — public, no auth, returns minimal student info
router.get('/:code', async (req, res) => {
  const code = (req.params.code || '').trim();
  if (!code) return res.status(400).json({ error: 'Student code required' });

  const student = await prisma.student.findUnique({
    where: { studentCode: code },
    select: {
      name: true,
      studentCode: true,
      graduationDate: true,
      transcriptDate: true,
      withdrawalDate: true,
    },
  });

  if (!student) return res.status(404).json({ error: 'Not found' });

  const graduated = isOnOrBeforeToday(student.graduationDate);

  res.json({
    name: student.name,
    studentCode: student.studentCode,
    graduated,
    graduationScheduled: !!student.graduationDate && !graduated,
    graduationDate: student.graduationDate,
    transcriptDate: student.transcriptDate,
    active: !student.withdrawalDate,
  });
});

module.exports = router;
