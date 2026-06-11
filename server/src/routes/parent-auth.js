const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../lib/mailer');
const { DEFAULT_PARENT_PASSWORD, parentLoginEmailForStudentEmail } = require('../lib/parentCredentials');
const { createLoginSession, closeLoginSession } = require('../lib/sessionTracker');
const { isArchivedGraduationDate, sendArchivedResponse } = require('../lib/studentArchive');

const prisma = require('../lib/prisma');
const router = express.Router();

const COOKIE_NAME = 'giis_parent_jwt';
// Constant-time guard against login user-enumeration (see auth.js).
const DUMMY_PASSWORD_HASH = '$2a$12$LsgLu90JTgGrKhKvqYUMrOXhJ9colrRW8xKvzb8PtTSdT2TLMa2q6';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_MINUTES = 60;
const FRONTEND_URL = (process.env.CORS_ORIGIN || 'https://genesisideas.school').split(',')[0].trim();

function setCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === '1';
  // 'lax' (not 'none') blocks the cookie on cross-site POST/fetch — the CSRF defense.
  // Safe because API requests are same-origin via the Netlify /api proxy (see auth.js).
  return { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: COOKIE_MAX_AGE_MS, path: '/' };
}

function signParentToken(account, sessionId = null) {
  return jwt.sign(
    { role: 'parent', parentId: account.id, email: account.email, studentId: account.studentId, sessionId },
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
      kind: 'password_reset_parent',
      recipient: email,
      providerId: result?.id || null,
      status: result?.ok ? 'sent' : (result?.skipped ? 'skipped' : 'error'),
      error: result?.error || result?.reason || '',
    },
  }).catch(() => null);
}

// POST /api/parent/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const account = await prisma.parentAccount.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!account) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const ok = await bcrypt.compare(password, account.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  await prisma.parentAccount.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });

  const session = await createLoginSession({
    role: 'parent',
    email: account.email,
    studentId: account.studentId,
    parentAccountId: account.id,
    req,
  });
  const token = signParentToken(account, session?.id || null);
  res.cookie(COOKIE_NAME, token, setCookieOptions());
  res.json({ ok: true, studentId: account.studentId });
});

router.post('/forgot-password', async (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'email required' });

  const account = await prisma.parentAccount.findUnique({ where: { email } });
  if (account) {
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        role: 'parent',
        email,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000),
      },
    });
    const result = await sendPasswordResetEmail({
      email,
      role: 'parent',
      resetUrl: `${FRONTEND_URL}/reset-password?role=parent&token=${token}`,
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
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const reset = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!reset || reset.role !== 'parent' || reset.usedAt || reset.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset link' });
  }

  const account = await prisma.parentAccount.findUnique({ where: { email: reset.email } });
  if (!account) return res.status(400).json({ error: 'Invalid or expired reset link' });

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.parentAccount.update({ where: { id: account.id }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ]);

  res.json({ ok: true });
});

// POST /api/parent/logout
function extractParentLogoutPayload(req) {
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
  const payload = extractParentLogoutPayload(req);
  await closeLoginSession(payload?.sessionId, req);
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// POST /api/parent/setup  — admin creates parent account (or resets password)
// Body: { studentId, email, password }
// Protected: admin only (checked via JWT role)
router.post('/setup', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = req.cookies?.giis_jwt || (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { return res.status(401).json({ error: 'Invalid token' }); }
  if (payload.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const { studentId } = req.body || {};
  const requestedEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const requestedPassword = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!studentId) return res.status(400).json({ error: 'studentId required' });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { account: { select: { email: true } } },
  });
  if (!student) return res.status(404).json({ error: 'Student not found' });
  if (isArchivedGraduationDate(student.graduationDate)) {
    return sendArchivedResponse(res, student.graduationDate);
  }

  const email = requestedEmail || parentLoginEmailForStudentEmail(student.account?.email);
  const password = requestedPassword || DEFAULT_PARENT_PASSWORD;
  if (!email) return res.status(400).json({ error: 'email required when student login email is unavailable' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const passwordHash = await bcrypt.hash(password, 12);
  const account = await prisma.parentAccount.upsert({
    where: { email },
    update: { passwordHash, studentId },
    create: { email, passwordHash, studentId },
  });

  res.json({ ok: true, id: account.id, email });
});

module.exports = router;
