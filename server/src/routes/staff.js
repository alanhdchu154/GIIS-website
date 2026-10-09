const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { z } = require('zod');
const { authenticate, requirePermission } = require('../middleware/auth');
const { sendStaffAccessEmail } = require('../lib/mailer');
const prisma = require('../lib/prisma');

const router = express.Router();
const TOKEN_MINUTES = 60;
const MIN_PASSWORD = 12;
const FRONTEND_URL = (process.env.CORS_ORIGIN || 'https://genesisideas.school').split(',')[0].trim();
const manageStaff = requirePermission('staff.manage');
// Phase 1 exposes only roles with a complete, tested UI/API surface.
const MANAGED_ROLES = ['owner', 'principal'];

const inviteSchema = z.object({
  email: z.string().email().max(200),
  displayName: z.string().trim().min(1).max(120),
  role: z.enum(MANAGED_ROLES),
});

const updateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  role: z.enum(MANAGED_ROLES).optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one change is required');

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function deliveryStatus(result) {
  if (result?.ok) return 'sent';
  return result?.skipped ? 'skipped' : 'error';
}

async function recordDelivery({ kind, email, result, dedupeKey }) {
  await prisma.emailLog.create({
    data: {
      kind,
      recipient: email,
      providerId: result?.id || null,
      status: deliveryStatus(result),
      error: result?.error || result?.reason || '',
      dedupeKey,
    },
  });
}

async function finalizeAccessDelivery({ inviteId, kind, email, delivery }) {
  let receiptRecorded = false;
  try {
    await recordDelivery({ kind, email, result: delivery, dedupeKey: `${kind}:${inviteId}` });
    receiptRecorded = true;
  } catch (error) {
    console.error('[staff] delivery receipt could not be recorded:', error.message);
  }
  if (!delivery?.ok || !receiptRecorded) {
    await prisma.staffInvite.updateMany({
      where: { id: inviteId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
  return receiptRecorded;
}

async function createAccessToken({ email, displayName, role, purpose, actor }) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_MINUTES * 60 * 1000);
  const invite = await prisma.$transaction(async (tx) => {
    await tx.staffInvite.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    });
    const created = await tx.staffInvite.create({
      data: {
        email,
        displayName,
        role,
        purpose,
        tokenHash: tokenHash(rawToken),
        expiresAt,
        invitedById: actor.id,
      },
    });
    await tx.staffAuditLog.create({
      data: {
        action: purpose === 'invite' ? 'staff_invited' : 'staff_password_reset_requested',
        actorAdminId: actor.id,
        targetEmail: email,
        metadata: { role, inviteId: created.id },
      },
    });
    return created;
  });
  return { invite, rawToken, expiresAt };
}

router.get('/', authenticate, manageStaff, async (_req, res) => {
  const staff = await prisma.adminUser.findMany({
    orderBy: [{ isActive: 'desc' }, { email: 'asc' }],
    select: { id: true, email: true, displayName: true, role: true, isActive: true, createdAt: true, updatedAt: true },
  });
  res.json({ staff, roles: MANAGED_ROLES });
});

router.post('/invite', authenticate, manageStaff, async (req, res) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid staff invitation', detail: parsed.error.format() });
  const data = { ...parsed.data, email: parsed.data.email.trim().toLowerCase() };
  const [admin, student, parent] = await Promise.all([
    prisma.adminUser.findUnique({ where: { email: data.email }, select: { id: true } }),
    prisma.studentAccount.findUnique({ where: { email: data.email }, select: { id: true } }),
    prisma.parentAccount.findUnique({ where: { email: data.email }, select: { id: true } }),
  ]);
  if (admin || student || parent) return res.status(409).json({ error: 'Email is already in use.' });

  const access = await createAccessToken({ ...data, purpose: 'invite', actor: req.staff });
  const accessUrl = `${FRONTEND_URL}/admin/set-password?token=${access.rawToken}`;
  const delivery = await sendStaffAccessEmail({ ...data, accessUrl, purpose: 'invite', expiresMinutes: TOKEN_MINUTES });
  const receiptRecorded = await finalizeAccessDelivery({ inviteId: access.invite.id, kind: 'staff_invite', email: data.email, delivery });
  if (!receiptRecorded) return res.status(503).json({ ok: false, code: 'invite_receipt_failed', inviteId: access.invite.id });
  if (!delivery.ok) {
    return res.status(502).json({ ok: false, code: 'invite_delivery_failed', inviteId: access.invite.id, expiresAt: access.expiresAt });
  }
  return res.status(201).json({ ok: true, inviteId: access.invite.id, expiresAt: access.expiresAt, delivery: { status: 'sent', providerId: delivery.id || null } });
});

router.post('/:id/password-reset', authenticate, manageStaff, async (req, res) => {
  const target = await prisma.adminUser.findUnique({
    where: { id: req.params.id },
    select: { id: true, email: true, displayName: true, role: true, isActive: true },
  });
  if (!target) return res.status(404).json({ error: 'Staff account not found.' });
  if (!target.isActive) return res.status(409).json({ error: 'Enable the staff account before resetting its password.' });

  await prisma.loginSession.updateMany({ where: { adminId: target.id, endedAt: null }, data: { endedAt: new Date() } });
  const access = await createAccessToken({ ...target, purpose: 'password_reset', actor: req.staff });
  const accessUrl = `${FRONTEND_URL}/admin/set-password?token=${access.rawToken}`;
  const delivery = await sendStaffAccessEmail({ ...target, accessUrl, purpose: 'password_reset', expiresMinutes: TOKEN_MINUTES });
  const receiptRecorded = await finalizeAccessDelivery({ inviteId: access.invite.id, kind: 'staff_password_reset', email: target.email, delivery });
  if (!receiptRecorded) return res.status(503).json({ ok: false, code: 'reset_receipt_failed', inviteId: access.invite.id });
  if (!delivery.ok) return res.status(502).json({ ok: false, code: 'reset_delivery_failed', inviteId: access.invite.id, expiresAt: access.expiresAt });
  return res.json({ ok: true, inviteId: access.invite.id, expiresAt: access.expiresAt, sessionsRevoked: true, delivery: { status: 'sent', providerId: delivery.id || null } });
});

router.patch('/:id', authenticate, manageStaff, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid staff update', detail: parsed.error.format() });
  if (req.params.id === req.staff.id && (parsed.data.role || parsed.data.isActive === false)) {
    return res.status(409).json({ error: 'Owners cannot demote or disable their own account.', code: 'self_owner_change_denied' });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const target = await tx.adminUser.findUnique({ where: { id: req.params.id } });
      if (!target) return null;
      const removesActiveOwner = target.role === 'owner' && target.isActive
        && (parsed.data.role && parsed.data.role !== 'owner' || parsed.data.isActive === false);
      if (removesActiveOwner) {
        const ownerCount = await tx.adminUser.count({ where: { role: 'owner', isActive: true } });
        if (ownerCount <= 1) {
          const error = new Error('last_owner');
          error.code = 'LAST_OWNER';
          throw error;
        }
      }
      const row = await tx.adminUser.update({ where: { id: target.id }, data: parsed.data });
      if (parsed.data.role || parsed.data.isActive === false) {
        await tx.loginSession.updateMany({ where: { adminId: target.id, endedAt: null }, data: { endedAt: new Date() } });
        await tx.staffInvite.updateMany({ where: { email: target.email, usedAt: null }, data: { usedAt: new Date() } });
      }
      await tx.staffAuditLog.create({
        data: {
          action: parsed.data.isActive === false ? 'staff_disabled' : parsed.data.role ? 'staff_role_changed' : 'staff_profile_changed',
          actorAdminId: req.staff.id,
          targetAdminId: target.id,
          targetEmail: target.email,
          metadata: { before: { role: target.role, isActive: target.isActive }, after: parsed.data },
        },
      });
      return row;
    }, { isolationLevel: 'Serializable' });
    if (!updated) return res.status(404).json({ error: 'Staff account not found.' });
    return res.json({ staff: { id: updated.id, email: updated.email, displayName: updated.displayName, role: updated.role, isActive: updated.isActive } });
  } catch (error) {
    if (error.code === 'LAST_OWNER') return res.status(409).json({ error: 'At least one active owner is required.', code: 'last_owner' });
    throw error;
  }
});

router.post('/set-password', async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '');
  if (!token || password.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `A valid token and password of at least ${MIN_PASSWORD} characters are required.` });
  }
  const hash = tokenHash(token);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const access = await tx.staffInvite.findUnique({ where: { tokenHash: hash } });
      if (!access || access.usedAt || access.expiresAt <= new Date()) return null;
      const claimed = await tx.staffInvite.updateMany({
        where: { id: access.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) return null;
      const passwordHash = await bcrypt.hash(password, 12);
      let staff;
      if (access.purpose === 'invite') {
        staff = await tx.adminUser.create({
          data: { email: access.email, displayName: access.displayName, role: access.role, isActive: true, passwordHash },
        });
      } else if (access.purpose === 'password_reset') {
        staff = await tx.adminUser.update({ where: { email: access.email }, data: { passwordHash } });
      } else {
        return null;
      }
      await tx.loginSession.updateMany({ where: { adminId: staff.id, endedAt: null }, data: { endedAt: new Date() } });
      await tx.staffInvite.updateMany({ where: { email: staff.email, usedAt: null }, data: { usedAt: new Date() } });
      await tx.staffAuditLog.create({
        data: {
          action: access.purpose === 'invite' ? 'staff_invite_accepted' : 'staff_password_reset_completed',
          actorAdminId: access.invitedById,
          targetAdminId: staff.id,
          targetEmail: staff.email,
          metadata: { inviteId: access.id },
        },
      });
      return { id: staff.id, email: staff.email };
    }, { isolationLevel: 'Serializable' });
    if (!result) return res.status(400).json({ error: 'Invalid or expired staff access link.' });
    return res.json({ ok: true });
  } catch (error) {
    if (error.code === 'P2002' || error.code === 'P2025') {
      return res.status(400).json({ error: 'Invalid or expired staff access link.' });
    }
    throw error;
  }
});

module.exports = router;
module.exports.tokenHash = tokenHash;
