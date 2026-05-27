const jwt = require('jsonwebtoken');
const { touchLoginSession } = require('../lib/sessionTracker');

function extractToken(req) {
  // Cookie takes priority over Authorization header
  const cookieToken = req.cookies?.giis_jwt;
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

/**
 * Verifies JWT from cookie (primary) or Authorization header (fallback).
 * Sets req.auth on success.
 */
function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role === 'student' && payload.studentId) {
      req.auth = { role: 'student', studentId: payload.studentId, email: payload.email, sessionId: payload.sessionId };
      touchLoginSession(payload.sessionId, req);
      return next();
    }
    if (payload.role === 'admin' && payload.adminId) {
      req.auth = { role: 'admin', adminId: payload.adminId, email: payload.email, sessionId: payload.sessionId };
      req.admin = { id: payload.adminId, email: payload.email };
      touchLoginSession(payload.sessionId, req);
      return next();
    }
    // Legacy admin JWT (adminId only)
    if (payload.adminId) {
      req.auth = { role: 'admin', adminId: payload.adminId, email: payload.email, sessionId: payload.sessionId };
      req.admin = { id: payload.adminId, email: payload.email };
      touchLoginSession(payload.sessionId, req);
      return next();
    }
    return res.status(401).json({ error: 'Invalid token' });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.auth?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

function requireStudentOrAdminForStudentParam(req, res, next) {
  const sid = req.params.id;
  if (req.auth?.role === 'admin') return next();
  if (req.auth?.role === 'student' && req.auth.studentId === sid) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

/**
 * Block soft-locked student accounts from doing high-cost actions (taking exams,
 * opening new modules) while still letting them sign in to see their dashboard.
 *
 * Soft-lock is set by webhooks-stripe.js after 2× payment_failed (T-103) or on
 * refund (T-102). Admin sessions are never blocked.
 *
 * Apply this middleware to: exam start/submit, module-open, quiz submit.
 */
async function blockIfSoftLocked(req, res, next) {
  if (req.auth?.role === 'admin') return next();
  if (req.auth?.role !== 'student') return next();
  try {
    // Lazily import Prisma so middleware loads cleanly without DB during tests.
    const { PrismaClient } = require('@prisma/client');
    const prisma = req.app.locals._prismaForLockCheck ||
      (req.app.locals._prismaForLockCheck = new PrismaClient());
    const account = await prisma.studentAccount.findUnique({
      where: { studentId: req.auth.studentId },
      select: { isActive: true, softLocked: true, lockReason: true },
    });
    if (!account?.isActive) {
      return res.status(403).json({
        error: 'Account deactivated',
        code: 'account_inactive',
        lockReason: account?.lockReason || '',
      });
    }
    if (account.softLocked) {
      return res.status(402).json({
        error: 'Account access limited — please update payment method',
        code: 'soft_locked',
        lockReason: account.lockReason,
      });
    }
    return next();
  } catch (err) {
    // If lock check fails, fail OPEN (let the request through) and log loudly.
    // We never want a transient DB blip to lock out paying parents.
    console.error('[auth] blockIfSoftLocked check failed (failing open):', err.message);
    return next();
  }
}

/** @deprecated Use authenticate */
const requireAuth = authenticate;

module.exports = {
  authenticate,
  requireAuth,
  requireAdmin,
  requireStudentOrAdminForStudentParam,
  blockIfSoftLocked,
};
