const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendNewApplicationAlert, sendWelcomeEmail, sendRejectionEmail } = require('../lib/mailer');

const prisma = new PrismaClient();
const router = express.Router();

async function recordEmailLog({ kind, recipient, studentId, result }) {
  await prisma.emailLog.create({
    data: {
      kind,
      recipient,
      studentId: studentId || null,
      providerId: result?.id || null,
      status: result?.ok ? 'sent' : (result?.skipped ? 'skipped' : 'error'),
      error: result?.error || result?.reason || '',
    },
  }).catch(() => null);
}

// POST /api/applications  — public, no auth required
router.post('/', async (req, res) => {
  const { studentName, dob, gradeLevel, parentName, parentEmail, phone, notes,
          currentSchool, targetUniversities, preferredLanguage } = req.body || {};
  const missing = [];
  if (!studentName?.trim()) missing.push('studentName');
  if (!dob?.trim()) missing.push('dob');
  if (!gradeLevel?.trim()) missing.push('gradeLevel');
  if (!parentName?.trim()) missing.push('parentName');
  if (!parentEmail?.trim()) missing.push('parentEmail');
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(parentEmail.trim())) return res.status(400).json({ error: 'Invalid parent email' });

  const app = await prisma.application.create({
    data: {
      studentName: studentName.trim(),
      dob: dob.trim(),
      gradeLevel: gradeLevel.trim(),
      currentSchool: (currentSchool || '').trim(),
      targetUniversities: (targetUniversities || '').trim(),
      preferredLanguage: preferredLanguage === 'zh' ? 'zh' : 'en',
      parentName: parentName.trim(),
      parentEmail: parentEmail.trim().toLowerCase(),
      phone: (phone || '').trim(),
      notes: (notes || '').trim(),
    },
  });

  // Fire-and-forget: notify admin of new application
  sendNewApplicationAlert({
    studentName: app.studentName,
    gradeLevel: app.gradeLevel,
    parentName: app.parentName,
    parentEmail: app.parentEmail,
    currentSchool: app.currentSchool,
    targetUniversities: app.targetUniversities,
    preferredLanguage: app.preferredLanguage,
    appId: app.id,
  });

  res.status(201).json({ ok: true, id: app.id });
});

// GET /api/applications  — admin only
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const status = req.query.status;
  const where = status ? { status } : {};
  const apps = await prisma.application.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(apps);
});

// PATCH /api/applications/:id  — update status, rejectionReason, or adminNotes
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const { status, rejectionReason, adminNotes } = req.body || {};
  const data = {};

  if (status !== undefined) {
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved | rejected | pending' });
    }
    data.status = status;
    data.reviewedAt = new Date();
    data.reviewedById = req.auth.adminId;
    if (status === 'rejected' && rejectionReason !== undefined) {
      data.rejectionReason = rejectionReason;
    }
  }

  if (adminNotes !== undefined) data.adminNotes = adminNotes;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Nothing to update.' });
  }

  const app = await prisma.application.update({
    where: { id: req.params.id },
    data,
  });

  // Auto-send rejection email when status changes to rejected
  if (data.status === 'rejected') {
    sendRejectionEmail({
      parentEmail: app.parentEmail,
      parentName: app.parentName,
      studentName: app.studentName,
      reason: app.rejectionReason,
    });
  }

  res.json({ ok: true, id: app.id, status: app.status });
});

/**
 * POST /api/applications/:id/activate  — admin only
 * Creates Student + ParentAccount from an approved application.
 * Returns temp credentials for the admin to forward to the parent.
 * Safe to call once only — sets accountsCreated=true to prevent duplicates.
 */
router.post('/:id/activate', authenticate, requireAdmin, async (req, res) => {
  const app = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!app) return res.status(404).json({ error: 'Application not found.' });
  if (app.status !== 'approved') return res.status(400).json({ error: 'Application must be approved first.' });
  if (app.accountsCreated) return res.status(409).json({ error: 'Accounts already created for this application.' });

  // Check parent email not already in use
  const existing = await prisma.parentAccount.findUnique({ where: { email: app.parentEmail } });
  if (existing) return res.status(409).json({ error: `A parent account already exists for ${app.parentEmail}.` });

  // Generate student code: GIIS-[year]-[4 random hex chars]
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const studentCode = `GIIS-${year}-${suffix}`;

  // Parse birth date
  let birthDate = null;
  try { birthDate = new Date(app.dob); } catch {}

  // Generate temp password: 3 words + 4 digits, e.g. "Oak-River-74-2391"
  const words = ['Oak', 'Blue', 'Star', 'River', 'Pine', 'Crest', 'Dawn', 'Vale', 'Bay', 'Arch'];
  const w1 = words[Math.floor(Math.random() * words.length)];
  const w2 = words[Math.floor(Math.random() * words.length)];
  const digits = String(Math.floor(Math.random() * 9000) + 1000);
  const tempPassword = `${w1}-${w2}-${digits}`;
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  // Create Student + ParentAccount in a transaction
  const student = await prisma.student.create({
    data: {
      name: app.studentName,
      studentCode,
      birthDate,
      parentGuardian: app.parentName,
      parentEmail: app.parentEmail,
      entryDate: new Date(),
    },
  });

  await prisma.parentAccount.create({
    data: {
      email: app.parentEmail,
      passwordHash,
      studentId: student.id,
    },
  });

  await prisma.application.update({
    where: { id: app.id },
    data: { accountsCreated: true },
  });

  const loginUrl = `${process.env.CORS_ORIGIN || 'https://genesisideas.school'}/parent/login`;

  // Auto-send welcome email with credentials
  const welcomeResult = await sendWelcomeEmail({
    parentEmail: app.parentEmail,
    studentName: app.studentName,
    tempPassword,
    loginUrl,
    studentCode,
  });
  await recordEmailLog({
    kind: 'welcome_parent_login',
    recipient: app.parentEmail,
    studentId: student.id,
    result: welcomeResult,
  });

  res.json({
    ok: true,
    studentCode,
    studentId: student.id,
    parentEmail: app.parentEmail,
    tempPassword,
    loginUrl,
  });
});

module.exports = router;
