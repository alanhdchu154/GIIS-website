const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { z } = require('zod');
const { authenticate, requirePermission } = require('../middleware/auth');
const { sendStaffAccessEmail } = require('../lib/mailer');
const prisma = require('../lib/prisma');

const router = express.Router();
const INVITE_TOKEN_MINUTES = 7 * 24 * 60;
const RESET_TOKEN_MINUTES = 60;
const MIN_PASSWORD = 12;
const OWNER_BOOTSTRAP_EMAIL = 'alanhdchu@genesisideas.school';
const OWNER_BOOTSTRAP_DISPLAY_NAME = 'Alan Chu';
const BREAK_GLASS_OWNER_EMAIL = 'admin@genesisideas.school';
const OWNER_BOOTSTRAP_INVITE_ID = 'owner-bootstrap-alanhdchu-v1';
const FRONTEND_URL = (process.env.CORS_ORIGIN || 'https://genesisideas.school').split(',')[0].trim();
const manageStaff = requirePermission('staff.manage');
const PROVISIONABLE_ROLES = ['principal', 'academic_staff', 'admissions_staff'];
const DISPLAYED_ROLES = ['owner', ...PROVISIONABLE_ROLES];
const ROLE_DEFINITIONS = Object.freeze([
  {
    id: 'owner', label: 'Owner', provisionable: false, protected: true,
    allowed: ['Break-glass platform administration', 'Staff access lifecycle', 'Existing Owner-only operations'],
    denied: ['Principal academic signature'],
    signingRule: 'Cannot sign as the configured Principal.',
  },
  {
    id: 'principal', label: 'Principal', provisionable: true, protected: false,
    allowed: ['Read applications', 'Sign placement or transfer decisions only when this is the configured Principal identity'],
    denied: ['Staff access management', 'Billing changes', 'Student activation', 'Course administration'],
    signingRule: 'Only the exact configured Principal email may sign.',
  },
  {
    id: 'academic_staff', label: 'Academic staff', provisionable: true, protected: false,
    allowed: ['Read applications', 'Read and grade assignments'],
    denied: ['Principal signature', 'Staff access management', 'Billing or activation'],
    signingRule: 'Cannot sign Principal decisions.',
  },
  {
    id: 'admissions_staff', label: 'Admissions staff', provisionable: true, protected: false,
    allowed: ['Read applications', 'Manage the currently enforced application status-link workflow'],
    denied: ['Principal signature', 'Academic grading', 'Staff access management', 'Billing or activation'],
    signingRule: 'Cannot sign Principal decisions.',
  },
]);
const SAFE_AUDIT_METADATA_KEYS = new Set([
  'reason', 'before', 'after', 'inviteId', 'sessionsRevoked', 'linksInvalidated', 'result',
]);

const inviteSchema = z.object({
  email: z.string().email().max(200),
  displayName: z.string().trim().min(1).max(120),
  role: z.enum(PROVISIONABLE_ROLES),
  reason: z.string().trim().min(3).max(300),
});

const updateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  role: z.enum(PROVISIONABLE_ROLES).optional(),
  isActive: z.boolean().optional(),
  reason: z.string().trim().min(3).max(300).optional(),
}).refine((value) => [value.displayName, value.role, value.isActive].filter((item) => item !== undefined).length === 1, 'Exactly one change is required')
  .refine((value) => value.role === undefined && value.isActive === undefined || !!value.reason, 'A reason is required for access changes');

const actionSchema = z.object({
  reason: z.string().trim().min(3).max(300),
  acknowledgePrincipalDowntime: z.boolean().optional(),
});

const ownerBootstrapSchema = z.object({
  reason: z.string().trim().min(3).max(300),
}).strict();

function configuredPrincipalEmail() {
  return String(process.env.PRINCIPAL_APPROVER_EMAIL || '').trim().toLowerCase();
}

function isConfiguredPrincipal(target) {
  const email = configuredPrincipalEmail();
  if (!email) return target?.role === 'principal';
  return String(target?.email || '').trim().toLowerCase() === email;
}

function trustedOrigins() {
  return new Set(
    String(process.env.CORS_ORIGIN || FRONTEND_URL)
      .split(',').map((value) => value.trim()).filter(Boolean),
  );
}

function requireTrustedOrigin(req, res, next) {
  const origin = req.get?.('origin') || req.headers?.origin || '';
  if (!origin || !trustedOrigins().has(origin)) {
    return res.status(403).json({ error: 'Untrusted request origin.', code: 'untrusted_origin' });
  }
  return next();
}

function safeAuditMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  return Object.fromEntries(Object.entries(metadata).filter(([key]) => SAFE_AUDIT_METADATA_KEYS.has(key)));
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function emailInsensitive(email) {
  return { equals: email, mode: 'insensitive' };
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

async function finalizeAccessDelivery({ inviteId, kind, email, delivery, actorAdminId }) {
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
  try {
    await prisma.staffAuditLog.create({
      data: {
        action: delivery?.ok && receiptRecorded ? `${kind}_provider_accepted` : `${kind}_delivery_failed`,
        actorAdminId,
        targetEmail: email,
        metadata: { inviteId, result: delivery?.ok && receiptRecorded ? 'provider_accepted' : 'failed' },
      },
    });
  } catch (error) {
    console.error('[staff] delivery audit could not be recorded:', error.message);
    await prisma.staffInvite.updateMany({ where: { id: inviteId, usedAt: null }, data: { usedAt: new Date() } });
    return false;
  }
  return receiptRecorded;
}

async function createAccessToken({ email, displayName, role, purpose, actor, expiresMinutes, reason, revokeAdminId = null }) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
  const invite = await prisma.$transaction(async (tx) => {
    const invalidated = await tx.staffInvite.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    });
    let sessionsRevoked = 0;
    if (revokeAdminId) {
      const revoked = await tx.loginSession.updateMany({
        where: { adminId: revokeAdminId, endedAt: null },
        data: { endedAt: new Date() },
      });
      sessionsRevoked = revoked.count;
    }
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
        action: purpose === 'invite' ? 'staff_invite_requested' : 'staff_password_reset_requested',
        actorAdminId: actor.id,
        targetEmail: email,
        metadata: {
          role, inviteId: created.id, reason,
          sessionsRevoked, linksInvalidated: invalidated.count,
        },
      },
    });
    return { created, sessionsRevoked, linksInvalidated: invalidated.count };
  });
  return { invite: invite.created, rawToken, expiresAt, sessionsRevoked: invite.sessionsRevoked, linksInvalidated: invite.linksInvalidated };
}

async function createOwnerBootstrapToken({ actor, reason }) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_MINUTES * 60 * 1000);
  const result = await prisma.$transaction(async (tx) => {
    const [breakGlassOwner, existingAdmin, existingStudent, existingParent, previousBootstrap, pendingAccess] = await Promise.all([
      tx.adminUser.findUnique({ where: { email: BREAK_GLASS_OWNER_EMAIL } }),
      tx.adminUser.findFirst({ where: { email: emailInsensitive(OWNER_BOOTSTRAP_EMAIL) }, select: { id: true } }),
      tx.studentAccount.findFirst({ where: { email: emailInsensitive(OWNER_BOOTSTRAP_EMAIL) }, select: { id: true } }),
      tx.parentAccount.findFirst({ where: { email: emailInsensitive(OWNER_BOOTSTRAP_EMAIL) }, select: { id: true } }),
      tx.staffInvite.findFirst({ where: { email: emailInsensitive(OWNER_BOOTSTRAP_EMAIL), purpose: 'owner_bootstrap' }, select: { id: true } }),
      tx.staffInvite.findFirst({ where: { email: emailInsensitive(OWNER_BOOTSTRAP_EMAIL), usedAt: null }, select: { id: true } }),
    ]);
    if (!breakGlassOwner || breakGlassOwner.id !== actor.id || breakGlassOwner.role !== 'owner' || !breakGlassOwner.isActive) {
      const error = new Error('break_glass_owner_required');
      error.code = 'BREAK_GLASS_OWNER_REQUIRED';
      throw error;
    }
    if (existingAdmin || existingStudent || existingParent) {
      const error = new Error('owner_bootstrap_identity_conflict');
      error.code = 'OWNER_BOOTSTRAP_IDENTITY_CONFLICT';
      throw error;
    }
    if (previousBootstrap || pendingAccess) {
      const error = new Error('owner_bootstrap_duplicate');
      error.code = 'OWNER_BOOTSTRAP_DUPLICATE';
      throw error;
    }
    const created = await tx.staffInvite.create({
      data: {
        id: OWNER_BOOTSTRAP_INVITE_ID,
        email: OWNER_BOOTSTRAP_EMAIL,
        displayName: OWNER_BOOTSTRAP_DISPLAY_NAME,
        role: 'owner',
        purpose: 'owner_bootstrap',
        tokenHash: tokenHash(rawToken),
        expiresAt,
        invitedById: breakGlassOwner.id,
      },
    });
    await tx.staffAuditLog.create({
      data: {
        action: 'owner_bootstrap_requested',
        actorAdminId: breakGlassOwner.id,
        targetEmail: OWNER_BOOTSTRAP_EMAIL,
        metadata: { role: 'owner', inviteId: created.id, reason },
      },
    });
    return created;
  }, { isolationLevel: 'Serializable' });
  return { invite: result, rawToken, expiresAt };
}

router.get('/', authenticate, manageStaff, async (_req, res) => {
  const now = new Date();
  const [staffRows, inviteRows, sessionRows, auditRows] = await Promise.all([
    prisma.adminUser.findMany({
      where: { role: { in: DISPLAYED_ROLES } },
      orderBy: [{ isActive: 'desc' }, { email: 'asc' }],
      select: { id: true, email: true, displayName: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    }),
    prisma.staffInvite.findMany({
      where: { purpose: 'invite', usedAt: null, role: { in: PROVISIONABLE_ROLES } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, email: true, displayName: true, role: true, expiresAt: true, createdAt: true },
    }),
    prisma.loginSession.findMany({
      where: { role: 'admin', adminId: { not: null } },
      select: { adminId: true, startedAt: true, lastSeenAt: true, endedAt: true },
    }),
    prisma.staffAuditLog.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
      select: {
        id: true, action: true, actorAdminId: true, targetAdminId: true,
        targetEmail: true, metadata: true, createdAt: true,
      },
    }),
  ]);
  const sessionSummary = new Map();
  for (const row of sessionRows) {
    const current = sessionSummary.get(row.adminId) || { openSessionCount: 0, totalSessionCount: 0, lastActivityAt: null };
    current.totalSessionCount += 1;
    if (!row.endedAt) current.openSessionCount += 1;
    const activity = row.lastSeenAt || row.startedAt;
    if (activity && (!current.lastActivityAt || activity > current.lastActivityAt)) current.lastActivityAt = activity;
    sessionSummary.set(row.adminId, current);
  }
  const staff = staffRows.map((row) => ({
    ...row,
    protection: row.role === 'owner' ? 'owner' : isConfiguredPrincipal(row) ? 'configured_principal' : null,
    sessions: sessionSummary.get(row.id) || { openSessionCount: 0, totalSessionCount: 0, lastActivityAt: null },
  }));
  const emailLogs = inviteRows.length ? await prisma.emailLog.findMany({
    where: { dedupeKey: { in: inviteRows.map((row) => `staff_invite:${row.id}`) } },
    select: { dedupeKey: true, status: true },
  }) : [];
  const deliveryByInvite = new Map(emailLogs.map((row) => [row.dedupeKey.replace('staff_invite:', ''), row.status]));
  const invitations = inviteRows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    accessStatus: row.expiresAt > now ? 'pending' : 'expired',
    deliveryStatus: deliveryByInvite.get(row.id) === 'sent' ? 'provider_accepted'
      : deliveryByInvite.get(row.id) === 'error' ? 'failed'
        : deliveryByInvite.get(row.id) === 'skipped' ? 'skipped' : 'unknown',
  }));
  const audit = auditRows.map((row) => ({ ...row, metadata: safeAuditMetadata(row.metadata) }));
  const principalEmail = configuredPrincipalEmail();
  const configuredPrincipal = staff.find((row) => principalEmail && row.email.toLowerCase() === principalEmail);
  res.json({
    policyVersion: 'giis.staff-access.v1',
    roles: PROVISIONABLE_ROLES,
    roleDefinitions: ROLE_DEFINITIONS,
    staff,
    invitations,
    audit,
    summary: {
      activeAccounts: staff.filter((row) => row.isActive).length,
      pendingInvitations: invitations.filter((row) => row.accessStatus === 'pending').length,
      openSessions: staff.reduce((sum, row) => sum + row.sessions.openSessionCount, 0),
      configuredPrincipal: !principalEmail ? 'configuration_missing'
        : !configuredPrincipal ? 'account_missing'
          : !configuredPrincipal.isActive ? 'disabled'
            : configuredPrincipal.role !== 'principal' ? 'wrong_role' : 'ready',
    },
  });
});

router.post('/invite', requireTrustedOrigin, authenticate, manageStaff, async (req, res) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid staff invitation', detail: parsed.error.format() });
  const data = { ...parsed.data, email: parsed.data.email.trim().toLowerCase() };
  if (data.email === OWNER_BOOTSTRAP_EMAIL) {
    return res.status(409).json({
      error: 'This email is reserved for the approved one-time Owner bootstrap.',
      code: 'reserved_owner_bootstrap_identity',
    });
  }
  const [admin, student, parent] = await Promise.all([
    prisma.adminUser.findFirst({ where: { email: emailInsensitive(data.email) }, select: { id: true } }),
    prisma.studentAccount.findFirst({ where: { email: emailInsensitive(data.email) }, select: { id: true } }),
    prisma.parentAccount.findFirst({ where: { email: emailInsensitive(data.email) }, select: { id: true } }),
  ]);
  if (admin || student || parent) return res.status(409).json({ error: 'Email is already in use.' });

  const access = await createAccessToken({
    ...data,
    purpose: 'invite',
    actor: req.staff,
    expiresMinutes: INVITE_TOKEN_MINUTES,
    reason: data.reason,
  });
  const accessUrl = `${FRONTEND_URL}/admin/set-password#token=${access.rawToken}`;
  const delivery = await sendStaffAccessEmail({
    ...data,
    accessUrl,
    purpose: 'invite',
    expiresMinutes: INVITE_TOKEN_MINUTES,
  });
  const receiptRecorded = await finalizeAccessDelivery({ inviteId: access.invite.id, kind: 'staff_invite', email: data.email, delivery, actorAdminId: req.staff.id });
  if (!receiptRecorded) return res.status(503).json({ ok: false, code: 'invite_receipt_failed', inviteId: access.invite.id });
  if (!delivery.ok) {
    return res.status(502).json({ ok: false, code: 'invite_delivery_failed', inviteId: access.invite.id, expiresAt: access.expiresAt });
  }
  return res.status(201).json({ ok: true, inviteId: access.invite.id, expiresAt: access.expiresAt, delivery: { status: 'sent', providerId: delivery.id || null } });
});

// Deliberately backend-only: routine Staff UI and /invite cannot provision Owners.
router.post('/owner-bootstrap', requireTrustedOrigin, authenticate, manageStaff, async (req, res) => {
  const parsed = ownerBootstrapSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'A reason is required.', detail: parsed.error.format() });
  try {
    const access = await createOwnerBootstrapToken({ actor: req.staff, reason: parsed.data.reason });
    const accessUrl = `${FRONTEND_URL}/admin/set-password#token=${access.rawToken}`;
    const delivery = await sendStaffAccessEmail({
      email: OWNER_BOOTSTRAP_EMAIL,
      displayName: OWNER_BOOTSTRAP_DISPLAY_NAME,
      accessUrl,
      purpose: 'owner_bootstrap',
      expiresMinutes: INVITE_TOKEN_MINUTES,
    });
    const receiptRecorded = await finalizeAccessDelivery({
      inviteId: access.invite.id,
      kind: 'owner_bootstrap',
      email: OWNER_BOOTSTRAP_EMAIL,
      delivery,
      actorAdminId: req.staff.id,
    });
    if (!receiptRecorded) return res.status(503).json({ ok: false, code: 'owner_bootstrap_receipt_failed', inviteId: access.invite.id });
    if (!delivery.ok) return res.status(502).json({ ok: false, code: 'owner_bootstrap_delivery_failed', inviteId: access.invite.id, expiresAt: access.expiresAt });
    return res.status(201).json({
      ok: true,
      inviteId: access.invite.id,
      expiresAt: access.expiresAt,
      delivery: { status: 'provider_accepted', providerId: delivery.id || null },
    });
  } catch (error) {
    if (error.code === 'BREAK_GLASS_OWNER_REQUIRED') {
      return res.status(409).json({ error: 'The active break-glass Owner must request this bootstrap.', code: 'break_glass_owner_required' });
    }
    if (error.code === 'OWNER_BOOTSTRAP_IDENTITY_CONFLICT') {
      return res.status(409).json({ error: 'The approved Owner email is already in use.', code: 'owner_bootstrap_identity_conflict' });
    }
    if (error.code === 'OWNER_BOOTSTRAP_DUPLICATE' || error.code === 'P2002' || error.code === 'P2034') {
      return res.status(409).json({ error: 'The one-time Owner bootstrap was already requested or another access link is pending.', code: 'owner_bootstrap_duplicate' });
    }
    throw error;
  }
});

router.post('/:id/password-reset', requireTrustedOrigin, authenticate, manageStaff, async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'A reason is required.', detail: parsed.error.format() });
  const target = await prisma.adminUser.findUnique({
    where: { id: req.params.id },
    select: { id: true, email: true, displayName: true, role: true, isActive: true },
  });
  if (!target) return res.status(404).json({ error: 'Staff account not found.' });
  if (target.role === 'owner') return res.status(409).json({ error: 'Owner access is protected from routine reset.', code: 'protected_owner' });
  if (!target.isActive) return res.status(409).json({ error: 'Enable the staff account before resetting its password.' });
  if (isConfiguredPrincipal(target) && parsed.data.acknowledgePrincipalDowntime !== true) {
    return res.status(409).json({
      error: 'Acknowledge that resetting the configured Principal revokes current sessions and may pause signatures.',
      code: 'principal_downtime_ack_required',
    });
  }

  const access = await createAccessToken({
    ...target,
    purpose: 'password_reset',
    actor: req.staff,
    expiresMinutes: RESET_TOKEN_MINUTES,
    reason: parsed.data.reason,
    revokeAdminId: target.id,
  });
  const accessUrl = `${FRONTEND_URL}/admin/set-password#token=${access.rawToken}`;
  const delivery = await sendStaffAccessEmail({
    ...target,
    accessUrl,
    purpose: 'password_reset',
    expiresMinutes: RESET_TOKEN_MINUTES,
  });
  const receiptRecorded = await finalizeAccessDelivery({ inviteId: access.invite.id, kind: 'staff_password_reset', email: target.email, delivery, actorAdminId: req.staff.id });
  if (!receiptRecorded) return res.status(503).json({ ok: false, code: 'reset_receipt_failed', inviteId: access.invite.id, sessionsRevoked: access.sessionsRevoked });
  if (!delivery.ok) return res.status(502).json({ ok: false, code: 'reset_delivery_failed', inviteId: access.invite.id, expiresAt: access.expiresAt, sessionsRevoked: access.sessionsRevoked });
  return res.json({ ok: true, inviteId: access.invite.id, expiresAt: access.expiresAt, sessionsRevoked: access.sessionsRevoked, delivery: { status: 'provider_accepted', providerId: delivery.id || null } });
});

router.patch('/:id', requireTrustedOrigin, authenticate, manageStaff, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid staff update', detail: parsed.error.format() });
  if (req.params.id === req.staff.id && (parsed.data.role || parsed.data.isActive === false)) {
    return res.status(409).json({ error: 'Owners cannot demote or disable their own account.', code: 'self_owner_change_denied' });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const target = await tx.adminUser.findUnique({ where: { id: req.params.id } });
      if (!target) return null;
      if (target.role === 'owner' && (parsed.data.role !== undefined || parsed.data.isActive !== undefined)) {
        const error = new Error('protected_owner');
        error.code = 'PROTECTED_OWNER';
        throw error;
      }
      if (isConfiguredPrincipal(target) && (parsed.data.role !== undefined || parsed.data.isActive !== undefined)) {
        const error = new Error('protected_principal');
        error.code = 'PROTECTED_PRINCIPAL';
        throw error;
      }
      const nextRole = parsed.data.role ?? target.role;
      const nextActive = parsed.data.isActive ?? target.isActive;
      const nextName = parsed.data.displayName ?? target.displayName;
      if (nextRole === target.role && nextActive === target.isActive && nextName === target.displayName) {
        return { ...target, noChange: true };
      }
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
      const { reason, ...changes } = parsed.data;
      const row = await tx.adminUser.update({ where: { id: target.id }, data: changes });
      let sessionsRevoked = 0;
      let linksInvalidated = 0;
      if (parsed.data.role !== undefined || parsed.data.isActive !== undefined) {
        sessionsRevoked = (await tx.loginSession.updateMany({ where: { adminId: target.id, endedAt: null }, data: { endedAt: new Date() } })).count;
        linksInvalidated = (await tx.staffInvite.updateMany({ where: { email: target.email, usedAt: null }, data: { usedAt: new Date() } })).count;
      }
      await tx.staffAuditLog.create({
        data: {
          action: parsed.data.isActive === false ? 'staff_disabled'
            : parsed.data.isActive === true ? 'staff_enabled'
              : parsed.data.role !== undefined ? 'staff_role_changed' : 'staff_profile_changed',
          actorAdminId: req.staff.id,
          targetAdminId: target.id,
          targetEmail: target.email,
          metadata: {
            reason,
            before: { role: target.role, isActive: target.isActive, displayName: target.displayName },
            after: { role: row.role, isActive: row.isActive, displayName: row.displayName },
            sessionsRevoked,
            linksInvalidated,
          },
        },
      });
      return row;
    }, { isolationLevel: 'Serializable' });
    if (!updated) return res.status(404).json({ error: 'Staff account not found.' });
    return res.json({ noChange: !!updated.noChange, staff: { id: updated.id, email: updated.email, displayName: updated.displayName, role: updated.role, isActive: updated.isActive } });
  } catch (error) {
    if (error.code === 'LAST_OWNER') return res.status(409).json({ error: 'At least one active owner is required.', code: 'last_owner' });
    if (error.code === 'PROTECTED_OWNER') return res.status(409).json({ error: 'Owner access is protected from routine changes.', code: 'protected_owner' });
    if (error.code === 'PROTECTED_PRINCIPAL') return res.status(409).json({ error: 'The configured Principal role and active state are protected.', code: 'protected_principal' });
    throw error;
  }
});

router.post('/:id/sessions/revoke', requireTrustedOrigin, authenticate, manageStaff, async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'A reason is required.', detail: parsed.error.format() });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.adminUser.findUnique({ where: { id: req.params.id } });
      if (!target) return null;
      if (target.role === 'owner') {
        const error = new Error('protected_owner');
        error.code = 'PROTECTED_OWNER';
        throw error;
      }
      if (isConfiguredPrincipal(target) && parsed.data.acknowledgePrincipalDowntime !== true) {
        const error = new Error('principal_ack');
        error.code = 'PRINCIPAL_ACK_REQUIRED';
        throw error;
      }
      const revoked = await tx.loginSession.updateMany({
        where: { adminId: target.id, endedAt: null },
        data: { endedAt: new Date() },
      });
      const invalidated = await tx.staffInvite.updateMany({
        where: { email: target.email, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.staffAuditLog.create({
        data: {
          action: 'staff_sessions_revoked',
          actorAdminId: req.staff.id,
          targetAdminId: target.id,
          targetEmail: target.email,
          metadata: {
            reason: parsed.data.reason,
            sessionsRevoked: revoked.count,
            linksInvalidated: invalidated.count,
          },
        },
      });
      return { sessionsRevoked: revoked.count, linksInvalidated: invalidated.count };
    }, { isolationLevel: 'Serializable' });
    if (!result) return res.status(404).json({ error: 'Staff account not found.' });
    return res.json({ ok: true, ...result });
  } catch (error) {
    if (error.code === 'PROTECTED_OWNER') return res.status(409).json({ error: 'Owner sessions are protected from routine revocation.', code: 'protected_owner' });
    if (error.code === 'PRINCIPAL_ACK_REQUIRED') return res.status(409).json({ error: 'Acknowledge the configured Principal downtime before revoking sessions.', code: 'principal_downtime_ack_required' });
    throw error;
  }
});

router.post('/set-password', requireTrustedOrigin, async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '');
  const passwordBytes = Buffer.byteLength(password, 'utf8');
  if (!token || password.length < MIN_PASSWORD || passwordBytes > 72) {
    return res.status(400).json({ error: `A valid token and password of at least ${MIN_PASSWORD} characters and at most 72 UTF-8 bytes are required.` });
  }
  const hash = tokenHash(token);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const access = await tx.staffInvite.findUnique({ where: { tokenHash: hash } });
      if (!access || access.usedAt || access.expiresAt <= new Date()) return null;
      const normalizedEmail = String(access.email || '').trim().toLowerCase();
      if (normalizedEmail !== access.email || !['invite', 'password_reset', 'owner_bootstrap'].includes(access.purpose)) return null;
      const isOwnerBootstrap = access.purpose === 'owner_bootstrap';
      if (isOwnerBootstrap) {
        if (access.id !== OWNER_BOOTSTRAP_INVITE_ID || normalizedEmail !== OWNER_BOOTSTRAP_EMAIL || access.role !== 'owner') return null;
      } else if (normalizedEmail === OWNER_BOOTSTRAP_EMAIL || !PROVISIONABLE_ROLES.includes(access.role)) return null;
      const [existingAdmin, existingStudent, existingParent, conflictingPending, breakGlassOwner, deliveryReceipt, providerAudit] = await Promise.all([
        tx.adminUser.findFirst({ where: { email: emailInsensitive(normalizedEmail) } }),
        tx.studentAccount.findFirst({ where: { email: emailInsensitive(normalizedEmail) }, select: { id: true } }),
        tx.parentAccount.findFirst({ where: { email: emailInsensitive(normalizedEmail) }, select: { id: true } }),
        tx.staffInvite.findFirst({
          where: { email: emailInsensitive(normalizedEmail), usedAt: null, id: { not: access.id } },
          select: { id: true },
        }),
        isOwnerBootstrap ? tx.adminUser.findUnique({ where: { email: BREAK_GLASS_OWNER_EMAIL } }) : Promise.resolve(null),
        isOwnerBootstrap ? tx.emailLog.findUnique({
          where: { dedupeKey: `owner_bootstrap:${access.id}` },
          select: { kind: true, recipient: true, status: true, dedupeKey: true },
        }) : Promise.resolve(null),
        isOwnerBootstrap ? tx.staffAuditLog.findFirst({
          where: {
            action: 'owner_bootstrap_provider_accepted',
            actorAdminId: access.invitedById,
            targetEmail: OWNER_BOOTSTRAP_EMAIL,
            AND: [
              { metadata: { path: ['inviteId'], equals: access.id } },
              { metadata: { path: ['result'], equals: 'provider_accepted' } },
            ],
          },
          select: { id: true },
        }) : Promise.resolve(null),
      ]);
      if (existingStudent || existingParent || conflictingPending) return null;
      if (access.purpose === 'invite' && existingAdmin) return null;
      if (access.purpose === 'password_reset') {
        if (!existingAdmin || !existingAdmin.isActive || existingAdmin.role !== access.role || existingAdmin.role === 'owner') return null;
      }
      if (isOwnerBootstrap) {
        if (existingAdmin || !breakGlassOwner || breakGlassOwner.id !== access.invitedById
          || breakGlassOwner.role !== 'owner' || !breakGlassOwner.isActive) return null;
        if (!deliveryReceipt || deliveryReceipt.dedupeKey !== `owner_bootstrap:${access.id}`
          || deliveryReceipt.kind !== 'owner_bootstrap' || deliveryReceipt.recipient !== OWNER_BOOTSTRAP_EMAIL
          || deliveryReceipt.status !== 'sent' || !providerAudit) return null;
      }
      const claimed = await tx.staffInvite.updateMany({
        where: { id: access.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) return null;
      const passwordHash = await bcrypt.hash(password, 12);
      let staff;
      if (access.purpose === 'invite' || isOwnerBootstrap) {
        staff = await tx.adminUser.create({
          data: { email: access.email, displayName: access.displayName, role: access.role, isActive: true, passwordHash },
        });
      } else if (access.purpose === 'password_reset') {
        staff = await tx.adminUser.update({ where: { email: access.email }, data: { passwordHash } });
      } else {
        return null;
      }
      await tx.loginSession.updateMany({ where: { adminId: staff.id, endedAt: null }, data: { endedAt: new Date() } });
      await tx.staffInvite.updateMany({ where: { email: emailInsensitive(staff.email), usedAt: null }, data: { usedAt: new Date() } });
      await tx.staffAuditLog.create({
        data: {
          action: isOwnerBootstrap ? 'owner_bootstrap_accepted'
            : access.purpose === 'invite' ? 'staff_invite_accepted' : 'staff_password_reset_completed',
          actorAdminId: staff.id,
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
module.exports.PROVISIONABLE_ROLES = PROVISIONABLE_ROLES;
module.exports.ROLE_DEFINITIONS = ROLE_DEFINITIONS;
module.exports.isConfiguredPrincipal = isConfiguredPrincipal;
