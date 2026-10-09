const { readSessionAuth, sendSessionError } = require('../lib/sessionAuth');
const { schoolDateOnly } = require('../lib/schoolDate');
const prisma = require('../lib/prisma');
const { hasPermission, isStaffRole } = require('../lib/staffPermissions');

/**
 * Verifies JWT and its matching open server-side login session.
 * Sets req.auth on success.
 */
async function authenticate(req, res, next) {
  const result = await readSessionAuth(req, { roles: ['admin', 'student'] });
  if (!result.ok) return sendSessionError(res, result);
  req.auth = result.auth;
  if (req.auth.role === 'admin') {
    let staff;
    try {
      staff = await prisma.adminUser.findUnique({
        where: { id: req.auth.adminId },
        select: { id: true, email: true, displayName: true, role: true, isActive: true },
      });
    } catch {
      return res.status(503).json({ error: 'Staff authorization could not be verified.', code: 'staff_status_unavailable' });
    }
    if (!staff || !staff.isActive || !isStaffRole(staff.role)
        || staff.email.toLowerCase() !== req.auth.email.toLowerCase()) {
      return res.status(401).json({ error: 'Session expired or staff account disabled.', code: 'invalid_staff_session' });
    }
    req.staff = staff;
    req.admin = { id: staff.id, email: staff.email, role: staff.role, displayName: staff.displayName };
  }
  return next();
}

async function authenticateParent(req, res, next) {
  const result = await readSessionAuth(req, { roles: ['parent'], cookieName: 'giis_parent_jwt' });
  if (!result.ok) return sendSessionError(res, result);
  req.auth = result.auth;
  return next();
}

function requireAdmin(req, res, next) {
  if (req.auth?.role !== 'admin' || req.staff?.role !== 'owner') {
    return res.status(403).json({ error: 'Owner permission required', code: 'permission_denied' });
  }
  next();
}

function requirePermission(permission) {
  if (typeof permission !== 'string' || !permission) throw new Error('permission is required');
  return function staffPermission(req, res, next) {
    if (req.auth?.role !== 'admin' || !hasPermission(req.staff?.role, permission)) {
      return res.status(403).json({ error: 'Permission denied', code: 'permission_denied', permission });
    }
    return next();
  };
}

function requireStaffRole(role) {
  return function staffRole(req, res, next) {
    if (req.auth?.role !== 'admin' || req.staff?.role !== role) {
      return res.status(403).json({ error: 'Permission denied', code: 'permission_denied' });
    }
    return next();
  };
}

function requireStudentOrAdminForStudentParam(req, res, next) {
  const sid = req.params.id;
  if (req.auth?.role === 'admin' && req.staff?.role === 'owner') return next();
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
    // Lazily import the shared Prisma singleton so this middleware loads cleanly
    // without a DB during tests, and avoids opening yet another connection pool.
    const prisma = require('../lib/prisma');
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
    const student = await prisma.student.findUnique({
      where: { id: req.auth.studentId },
      select: { paidThroughDate: true },
    });
    // Manual-review billing: if an admin-set paid-through date exists and has
    // lapsed, gate new work exactly like a soft-lock (read access elsewhere stays
    // open). Students with no paidThroughDate (e.g. Stripe-billed) are unaffected.
    if (student?.paidThroughDate) {
      const through = new Date(student.paidThroughDate).toISOString().slice(0, 10);
      const today = schoolDateOnly();
      if (through < today) {
        return res.status(402).json({
          error: 'Account access limited — payment period has lapsed',
          code: 'payment_lapsed',
          lockReason: 'payment_past_due',
        });
      }
    }
    return next();
  } catch (err) {
    console.error('[auth] blockIfSoftLocked check failed (failing closed):', err.message);
    return res.status(503).json({
      error: 'Account status could not be verified. Please try again.',
      code: 'account_status_unavailable',
    });
  }
}

/** @deprecated Use authenticate */
const requireAuth = authenticate;

module.exports = {
  authenticate,
  authenticateParent,
  requireAuth,
  requireAdmin,
  requirePermission,
  requireStaffRole,
  requireStudentOrAdminForStudentParam,
  blockIfSoftLocked,
};
