const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../lib/mailer');
const { createLoginSession, closeLoginSession } = require('../lib/sessionTracker');
const { readSessionAuth, sendSessionError } = require('../lib/sessionAuth');
const { isStaffRole } = require('../lib/staffPermissions');

const prisma = require('../lib/prisma');
const router = express.Router();

const MIN_PASSWORD = 8;
// Constant-time guard against login user-enumeration: when no account exists we
// still run one bcrypt compare against this throwaway hash so a missing email
// takes the same time as a wrong password for an existing one.
const DUMMY_PASSWORD_HASH = '$2a$12$LsgLu90JTgGrKhKvqYUMrOXhJ9colrRW8xKvzb8PtTSdT2TLMa2q6';
const COOKIE_NAME = 'giis_jwt';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RESET_TOKEN_MINUTES = 60;
const FRONTEND_URL = (process.env.CORS_ORIGIN || 'https://genesisideas.school').split(',')[0].trim();

function setCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === '1';
  return {
    httpOnly: true,
    // 'lax' (not 'none') is the CSRF defense: it stops the auth cookie from being
    // sent on cross-site POST/fetch, so a forged request from another origin can't
    // act as the logged-in user. Safe here because the browser reaches the API
    // same-origin (Netlify proxies /api/*) — and api.genesisideas.school is the
    // same site (shared eTLD+1) regardless — so first-party requests still carry it.
    sameSite: 'lax',
    secure: isProd,
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, setCookieOptions());
}

function signAdminToken(admin, sessionId) {
  return jwt.sign(
    { role: 'admin', adminId: admin.id, email: admin.email, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function signStudentToken(account, sessionId) {
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

router.post('/register', (req, res) => {
  return res.status(403).json({
    error: 'Student accounts are created only after admissions approval and enrollment activation.',
    code: 'self_registration_disabled',
    applyUrl: '/apply',
  });
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
    if (!admin.isActive || !isStaffRole(admin.role)) {
      return res.status(403).json({ error: 'Staff account disabled', code: 'staff_inactive' });
    }
    const session = await createLoginSession({
      role: 'admin',
      email: admin.email,
      adminId: admin.id,
      req,
    });
    if (!session?.id) return sendSessionError(res);
    const token = signAdminToken(admin, session.id);
    setAuthCookie(res, token);
    return res.json({
      token,
      role: 'admin',
      admin: { id: admin.id, email: admin.email, displayName: admin.displayName, staffRole: admin.role },
    });
  }

  const account = await prisma.studentAccount.findUnique({ where: { email } });
  if (!account) {
    // Run a dummy compare so a non-existent email is indistinguishable (by timing)
    // from a wrong password on a real account.
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (account.isActive === false) {
    return res.status(403).json({ error: 'Account disabled' });
  }

  const ok = await bcrypt.compare(password, account.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Serialize successful login issuance with password reset on the account row.
  // The conditional update locks the row: if reset wins first, the old hash no
  // longer matches; if login wins first, reset subsequently closes this session.
  const session = await prisma.$transaction(async (tx) => {
    const claimed = await tx.studentAccount.updateMany({
      where: {
        id: account.id,
        passwordHash: account.passwordHash,
        isActive: true,
      },
      data: { updatedAt: new Date() },
    });
    if (claimed.count !== 1) return null;
    return createLoginSession({
      role: 'student',
      email: account.email,
      studentId: account.studentId,
      req,
      db: tx,
    });
  });
  if (!session?.id) return sendSessionError(res);
  const token = signStudentToken(account, session.id);
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
  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: reset.id, role: 'student', usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) {
        const error = new Error('invalid_reset');
        error.code = 'INVALID_RESET';
        throw error;
      }
      await tx.studentAccount.update({ where: { id: account.id }, data: { passwordHash } });
      await tx.loginSession.updateMany({ where: { studentId: account.studentId, role: 'student', endedAt: null }, data: { endedAt: now } });
    });
  } catch (error) {
    if (error.code === 'INVALID_RESET') {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }
    throw error;
  }

  res.json({ ok: true });
});

router.post('/logout', async (req, res) => {
  const result = await readSessionAuth(req, { roles: ['admin', 'student'], allowEnded: true });
  // Already-invalid credentials need no further revocation. A lookup or write
  // outage must remain an explicit failure, so a caller can retry logout.
  if (!result.ok && result.status !== 401) return sendSessionError(res, result);
  if (result.ok) {
    try { await closeLoginSession(result.auth.sessionId, req); }
    catch { return sendSessionError(res); }
  }
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

router.get('/me', authenticate, async (req, res) => {
  if (req.auth.role === 'admin') {
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.auth.adminId },
      select: { id: true, email: true, displayName: true, role: true, isActive: true, createdAt: true },
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
