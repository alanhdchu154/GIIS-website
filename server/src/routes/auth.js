const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../lib/mailer');
const { createLoginSession, closeLoginSession } = require('../lib/sessionTracker');

const prisma = new PrismaClient();
const router = express.Router();

const MIN_PASSWORD = 8;
const COOKIE_NAME = 'giis_jwt';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RESET_TOKEN_MINUTES = 60;
const FRONTEND_URL = (process.env.CORS_ORIGIN || 'https://genesisideas.school').split(',')[0].trim();

function setCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === '1';
  return {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, setCookieOptions());
}

function signAdminToken(admin, sessionId = null) {
  return jwt.sign(
    { role: 'admin', adminId: admin.id, email: admin.email, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function signStudentToken(account, sessionId = null) {
  return jwt.sign(
    { role: 'student', studentId: account.studentId, email: account.email, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function recordPasswordResetEmail({ email, result }) {
  await prisma.emailLog.create({
    data: {
      kind: 'password_reset_student',
      recipient: email,
      providerId: result?.id || null,
      status: result?.ok ? 'sent' : (result?.skipped ? 'skipped' : 'error'),
      error: result?.error || result?.reason || '',
    },
  }).catch(() => null);
}

/** Student self-registration: creates Student + StudentAccount (profile fields match transcript header). */
router.post('/register', async (req, res) => {
  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const name = (body.name || '').trim();
  const birthDate = (body.birthDate || '').trim();
  const gender = (body.gender || '').trim() || 'Female';
  const parentGuardian = (body.parentGuardian || '').trim();
  const address = (body.address || '').trim();
  const city = (body.city || '').trim();
  const province = (body.province || '').trim();
  const zipCode = (body.zipCode || '').trim();

  const missing = [];
  if (!email) missing.push('email');
  if (!password) missing.push('password');
  if (!name) missing.push('name');
  if (!birthDate) missing.push('birthDate');
  if (!parentGuardian) missing.push('parentGuardian');
  if (!address) missing.push('address');
  if (!city) missing.push('city');
  if (!province) missing.push('province');
  if (missing.length) {
    return res.status(400).json({ error: `missing: ${missing.join(', ')}` });
  }
  if (password.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `password must be at least ${MIN_PASSWORD} characters` });
  }
  if (gender !== 'Male' && gender !== 'Female') {
    return res.status(400).json({ error: 'gender must be Male or Female' });
  }
  const birth = new Date(`${birthDate}T00:00:00.000Z`);
  if (!birthDate || Number.isNaN(birth.getTime())) {
    return res.status(400).json({ error: 'birthDate must be YYYY-MM-DD' });
  }

  const adminExists = await prisma.adminUser.findUnique({ where: { email } });
  if (adminExists) {
    return res.status(409).json({ error: 'email already in use' });
  }

  const existingAccount = await prisma.studentAccount.findUnique({ where: { email } });
  if (existingAccount) {
    return res.status(409).json({ error: 'email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const { student, account } = await prisma.$transaction(async (tx) => {
      const st = await tx.student.create({
        data: {
          name,
          birthDate: birth,
          gender,
          parentGuardian,
          address,
          city,
          province,
          zipCode: zipCode || '',
        },
      });
      const acc = await tx.studentAccount.create({
        data: {
          email,
          passwordHash,
          isActive: true,
          studentId: st.id,
        },
      });
      return { student: st, account: acc };
    });

    const session = await createLoginSession({
      role: 'student',
      email: account.email,
      studentId: account.studentId,
      req,
    });
    const token = signStudentToken(account, session?.id || null);
    setAuthCookie(res, token);
    return res.status(201).json({
      token,
      role: 'student',
      student: { id: student.id, email: account.email, name: student.name },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Staff: AdminUser only. Students: StudentAccount only (same email cannot be both).
 * Order: try admin first, then student.
 */
router.post('/login', async (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password || '';
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (admin) {
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const session = await createLoginSession({
      role: 'admin',
      email: admin.email,
      adminId: admin.id,
      req,
    });
    const token = signAdminToken(admin, session?.id || null);
    setAuthCookie(res, token);
    return res.json({
      token,
      role: 'admin',
      admin: { id: admin.id, email: admin.email },
    });
  }

  const account = await prisma.studentAccount.findUnique({ where: { email } });
  if (!account) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (account.isActive === false) {
    return res.status(403).json({ error: 'Account disabled' });
  }

  const ok = await bcrypt.compare(password, account.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const session = await createLoginSession({
    role: 'student',
    email: account.email,
    studentId: account.studentId,
    req,
  });
  const token = signStudentToken(account, session?.id || null);
  const student = await prisma.student.findUnique({
    where: { id: account.studentId },
    select: { id: true, name: true },
  });
  setAuthCookie(res, token);
  return res.json({
    token,
    role: 'student',
    student: { id: account.studentId, email: account.email, name: student?.name || '' },
  });
});

router.post('/forgot-password', async (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'email required' });

  const account = await prisma.studentAccount.findUnique({ where: { email } });
  if (account) {
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        role: 'student',
        email,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000),
      },
    });
    const result = await sendPasswordResetEmail({
      email,
      role: 'student',
      resetUrl: `${FRONTEND_URL}/reset-password?role=student&token=${token}`,
      expiresMinutes: RESET_TOKEN_MINUTES,
    });
    await recordPasswordResetEmail({ email, result });
  }

  res.json({ ok: true, message: 'If this email exists, a reset link has been sent.' });
});

router.post('/reset-password', async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const password = req.body?.password || '';
  if (!token || !password) return res.status(400).json({ error: 'token and password required' });
  if (password.length < MIN_PASSWORD) return res.status(400).json({ error: `password must be at least ${MIN_PASSWORD} characters` });

  const reset = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!reset || reset.role !== 'student' || reset.usedAt || reset.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset link' });
  }

  const account = await prisma.studentAccount.findUnique({ where: { email: reset.email } });
  if (!account) return res.status(400).json({ error: 'Invalid or expired reset link' });

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.studentAccount.update({ where: { id: account.id }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ]);

  res.json({ ok: true });
});

function extractLogoutPayload(req) {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const header = req.headers.authorization || '';
  const token = cookieToken || (header.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

router.post('/logout', async (req, res) => {
  const payload = extractLogoutPayload(req);
  await closeLoginSession(payload?.sessionId, req);
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

router.get('/me', authenticate, async (req, res) => {
  if (req.auth.role === 'admin') {
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.auth.adminId },
      select: { id: true, email: true, createdAt: true },
    });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    return res.json({ role: 'admin', admin });
  }

  const account = await prisma.studentAccount.findUnique({
    where: { studentId: req.auth.studentId },
    include: { student: { select: { id: true, name: true } } },
  });
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  return res.json({
    role: 'student',
    student: {
      id: account.student.id,
      email: account.email,
      name: account.student.name,
    },
  });
});

module.exports = router;
