const mockDb = {
  adminUser: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  studentAccount: { findFirst: jest.fn(), findUnique: jest.fn() },
  parentAccount: { findFirst: jest.fn(), findUnique: jest.fn() },
  staffInvite: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
  staffAuditLog: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
  loginSession: { findMany: jest.fn(), updateMany: jest.fn() },
  emailLog: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(),
};
const mockSendStaffAccessEmail = jest.fn();
jest.mock('../lib/prisma', () => mockDb);
jest.mock('../lib/mailer', () => ({ sendStaffAccessEmail: mockSendStaffAccessEmail }));
jest.mock('../middleware/auth', () => ({
  authenticate: (req, _res, next) => next(),
  requirePermission: () => (req, res, next) => req.staff?.role === 'owner'
    ? next() : res.status(403).json({ error: 'Permission denied', code: 'permission_denied' }),
}));
jest.mock('bcryptjs', () => ({ hash: jest.fn(async () => 'hashed-password') }));
const router = require('./staff');

function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
async function invoke(method, path, request = {}) {
  const layer = router.stack.find((item) => item.route?.path === path && item.route.methods[method]);
  const req = {
    params: {}, body: {}, headers: { origin: (process.env.CORS_ORIGIN || 'https://genesisideas.school').split(',')[0].trim() },
    get(name) { return this.headers[String(name).toLowerCase()]; },
    staff: { id: 'owner-1', email: 'owner@example.invalid', role: 'owner' }, ...request,
  };
  const res = response();
  for (const handler of layer.route.stack) {
    let next = false;
    await handler.handle(req, res, (error) => { if (error) throw error; next = true; });
    if (!next) break;
  }
  return res;
}

beforeEach(() => {
  jest.resetAllMocks();
  require('bcryptjs').hash.mockResolvedValue('hashed-password');
  mockDb.$transaction.mockImplementation(async (fn) => fn(mockDb));
  mockDb.studentAccount.findUnique.mockResolvedValue(null);
  mockDb.studentAccount.findFirst.mockResolvedValue(null);
  mockDb.parentAccount.findUnique.mockResolvedValue(null);
  mockDb.parentAccount.findFirst.mockResolvedValue(null);
  mockDb.staffInvite.updateMany.mockResolvedValue({ count: 1 });
  mockDb.staffInvite.create.mockImplementation(async ({ data }) => ({ id: 'invite-1', ...data }));
  mockDb.staffAuditLog.create.mockResolvedValue({ id: 'audit-1' });
  mockDb.emailLog.create.mockResolvedValue({ id: 'email-1' });
  mockDb.loginSession.updateMany.mockResolvedValue({ count: 2 });
  mockDb.adminUser.findMany.mockResolvedValue([]);
  mockDb.adminUser.findFirst.mockResolvedValue(null);
  mockDb.staffInvite.findMany.mockResolvedValue([]);
  mockDb.staffInvite.findFirst.mockResolvedValue(null);
  mockDb.staffAuditLog.findMany.mockResolvedValue([]);
  mockDb.staffAuditLog.findFirst.mockResolvedValue({ id: 'owner-provider-audit' });
  mockDb.loginSession.findMany.mockResolvedValue([]);
  mockDb.emailLog.findMany.mockResolvedValue([]);
  mockDb.emailLog.findUnique.mockResolvedValue({
    kind: 'owner_bootstrap', recipient: 'alanhdchu@genesisideas.school', status: 'sent',
    dedupeKey: 'owner_bootstrap:owner-bootstrap-alanhdchu-v1',
  });
  mockSendStaffAccessEmail.mockResolvedValue({ ok: true, id: 'provider-1' });
});

test('only owner can invite and invitation records a delivery receipt without returning token', async () => {
  const before = Date.now();
  const body = { email: 'principal@example.invalid', displayName: 'Principal', role: 'principal', reason: 'Initial staff access' };
  expect((await invoke('post', '/invite', { staff: { id: 'p', role: 'principal' }, body })).code).toBe(403);
  mockDb.adminUser.findUnique.mockResolvedValue(null);
  const result = await invoke('post', '/invite', { body });
  expect(result.code).toBe(201);
  expect(result.body.token).toBeUndefined();
  expect(mockDb.staffInvite.create).toHaveBeenCalledWith({ data: expect.objectContaining({ email: body.email, role: 'principal', purpose: 'invite', tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) }) });
  const created = mockDb.staffInvite.create.mock.calls[0][0].data;
  expect(created.expiresAt.getTime()).toBeGreaterThanOrEqual(before + (7 * 24 * 60 * 60 * 1000));
  expect(created.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + (7 * 24 * 60 * 60 * 1000));
  expect(mockSendStaffAccessEmail).toHaveBeenCalledWith(expect.objectContaining({ expiresMinutes: 7 * 24 * 60 }));
  expect(mockDb.emailLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ kind: 'staff_invite', status: 'sent', providerId: 'provider-1' }) });
  expect(mockDb.staffAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({
    action: 'staff_invite_provider_accepted', actorAdminId: 'owner-1', targetEmail: body.email,
  }) });
});

test('staff reset revokes all open sessions before issuing one-use reset', async () => {
  const before = Date.now();
  mockDb.adminUser.findUnique.mockResolvedValue({ id: 'staff-2', email: 'staff@example.invalid', displayName: 'Staff', role: 'academic_staff', isActive: true });
  const result = await invoke('post', '/:id/password-reset', { params: { id: 'staff-2' }, body: { reason: 'Requested access recovery' } });
  expect(result.code).toBe(200);
  expect(mockDb.loginSession.updateMany).toHaveBeenCalledWith({ where: { adminId: 'staff-2', endedAt: null }, data: { endedAt: expect.any(Date) } });
  expect(mockDb.staffInvite.create).toHaveBeenCalledWith({ data: expect.objectContaining({ purpose: 'password_reset', email: 'staff@example.invalid' }) });
  const created = mockDb.staffInvite.create.mock.calls[0][0].data;
  expect(created.expiresAt.getTime()).toBeGreaterThanOrEqual(before + (60 * 60 * 1000));
  expect(created.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + (60 * 60 * 1000));
  expect(mockSendStaffAccessEmail).toHaveBeenCalledWith(expect.objectContaining({ expiresMinutes: 60 }));
});

test('break-glass Owner can request the fixed one-time named Owner bootstrap without token exposure', async () => {
  const before = Date.now();
  mockDb.adminUser.findUnique.mockImplementation(async ({ where }) => {
    if (where.email === 'admin@genesisideas.school') {
      return { id: 'break-glass-1', email: where.email, role: 'owner', isActive: true };
    }
    return null;
  });
  const result = await invoke('post', '/owner-bootstrap', {
    staff: { id: 'break-glass-1', email: 'admin@genesisideas.school', role: 'owner' },
    body: { reason: 'Alan approved named Owner bootstrap' },
  });
  expect(result.code).toBe(201);
  expect(result.body).not.toHaveProperty('token');
  expect(JSON.stringify(result.body)).not.toMatch(/set-password|#token=|rawToken|password/);
  expect(mockDb.staffInvite.create).toHaveBeenCalledWith({ data: expect.objectContaining({
    id: 'owner-bootstrap-alanhdchu-v1',
    email: 'alanhdchu@genesisideas.school', role: 'owner', purpose: 'owner_bootstrap',
    tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/), invitedById: 'break-glass-1',
  }) });
  const created = mockDb.staffInvite.create.mock.calls[0][0].data;
  expect(created.expiresAt.getTime()).toBeGreaterThanOrEqual(before + (7 * 24 * 60 * 60 * 1000));
  expect(created.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + (7 * 24 * 60 * 60 * 1000));
  expect(mockSendStaffAccessEmail).toHaveBeenCalledWith(expect.objectContaining({
    email: 'alanhdchu@genesisideas.school', purpose: 'owner_bootstrap', expiresMinutes: 7 * 24 * 60,
  }));
  expect(mockDb.emailLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({
    kind: 'owner_bootstrap', recipient: 'alanhdchu@genesisideas.school', status: 'sent',
  }) });
  expect(mockDb.staffAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({
    action: 'owner_bootstrap_requested', actorAdminId: 'break-glass-1', targetEmail: 'alanhdchu@genesisideas.school',
  }) });
  expect(mockDb.staffAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({
    action: 'owner_bootstrap_provider_accepted', actorAdminId: 'break-glass-1', targetEmail: 'alanhdchu@genesisideas.school',
  }) });
});

test('Owner bootstrap fails closed for the wrong actor, duplicate request, and cross-role identity collision', async () => {
  mockDb.adminUser.findUnique.mockResolvedValue(null);
  const wrongActor = await invoke('post', '/owner-bootstrap', {
    staff: { id: 'other-owner', email: 'other@example.invalid', role: 'owner' },
    body: { reason: 'Wrong Owner request' },
  });
  expect(wrongActor.body.code).toBe('break_glass_owner_required');
  expect(mockSendStaffAccessEmail).not.toHaveBeenCalled();

  mockDb.adminUser.findUnique.mockImplementation(async ({ where }) => {
    if (where.email === 'admin@genesisideas.school') return { id: 'break-glass-1', role: 'owner', isActive: true };
    return null;
  });
  mockDb.staffInvite.findFirst.mockResolvedValueOnce({ id: 'prior-bootstrap' }).mockResolvedValueOnce(null);
  const duplicate = await invoke('post', '/owner-bootstrap', {
    staff: { id: 'break-glass-1', email: 'admin@genesisideas.school', role: 'owner' },
    body: { reason: 'Duplicate Owner request' },
  });
  expect(duplicate.body.code).toBe('owner_bootstrap_duplicate');

  mockDb.staffInvite.findFirst.mockResolvedValue(null);
  mockDb.studentAccount.findFirst.mockResolvedValue({ id: 'student-collision', email: 'AlanHDChu@GenesisIdeas.School' });
  const collision = await invoke('post', '/owner-bootstrap', {
    staff: { id: 'break-glass-1', email: 'admin@genesisideas.school', role: 'owner' },
    body: { reason: 'Cross-role collision request' },
  });
  expect(collision.body.code).toBe('owner_bootstrap_identity_conflict');
  expect(mockDb.staffInvite.create).not.toHaveBeenCalled();
});

test.each([
  ['AdminUser', 'adminUser'],
  ['StudentAccount', 'studentAccount'],
  ['ParentAccount', 'parentAccount'],
])('Owner bootstrap issuance rejects a mixed-case %s identity collision', async (_label, model) => {
  mockDb.adminUser.findUnique.mockResolvedValue({
    id: 'break-glass-1', email: 'admin@genesisideas.school', role: 'owner', isActive: true,
  });
  mockDb[model].findFirst.mockResolvedValue({ id: 'mixed-case-collision', email: 'AlanHDChu@GenesisIdeas.School' });
  const result = await invoke('post', '/owner-bootstrap', {
    staff: { id: 'break-glass-1', email: 'admin@genesisideas.school', role: 'owner' },
    body: { reason: 'Mixed-case collision test' },
  });
  expect(result.code).toBe(409);
  expect(result.body.code).toBe('owner_bootstrap_identity_conflict');
  expect(mockDb[model].findFirst).toHaveBeenCalledWith(expect.objectContaining({
    where: { email: { equals: 'alanhdchu@genesisideas.school', mode: 'insensitive' } },
  }));
  expect(mockDb.staffInvite.create).not.toHaveBeenCalled();
});

test('Owner bootstrap issuance rejects a mixed-case prior or pending StaffInvite', async () => {
  mockDb.adminUser.findUnique.mockResolvedValue({
    id: 'break-glass-1', email: 'admin@genesisideas.school', role: 'owner', isActive: true,
  });
  mockDb.staffInvite.findFirst.mockImplementation(async ({ where }) => (
    where.email?.mode === 'insensitive' ? { id: 'mixed-case-invite', email: 'AlanHDChu@GenesisIdeas.School' } : null
  ));
  const result = await invoke('post', '/owner-bootstrap', {
    staff: { id: 'break-glass-1', email: 'admin@genesisideas.school', role: 'owner' },
    body: { reason: 'Mixed-case invite collision test' },
  });
  expect(result.code).toBe(409);
  expect(result.body.code).toBe('owner_bootstrap_duplicate');
  expect(mockDb.staffInvite.create).not.toHaveBeenCalled();
});

test('Owner bootstrap maps deterministic invite-id uniqueness failure to duplicate conflict', async () => {
  mockDb.adminUser.findUnique.mockResolvedValue({
    id: 'break-glass-1', email: 'admin@genesisideas.school', role: 'owner', isActive: true,
  });
  mockDb.staffInvite.create.mockRejectedValueOnce(Object.assign(new Error('duplicate key'), { code: 'P2002' }));
  const result = await invoke('post', '/owner-bootstrap', {
    staff: { id: 'break-glass-1', email: 'admin@genesisideas.school', role: 'owner' },
    body: { reason: 'Duplicate-key race test' },
  });
  expect(result.code).toBe(409);
  expect(result.body.code).toBe('owner_bootstrap_duplicate');
  expect(mockSendStaffAccessEmail).not.toHaveBeenCalled();
});

test('a failed delivery invalidates the undelivered access token', async () => {
  mockDb.adminUser.findUnique.mockResolvedValue(null);
  mockSendStaffAccessEmail.mockResolvedValue({ ok: false, error: 'synthetic delivery failure' });
  const result = await invoke('post', '/invite', { body: { email: 'failed@example.invalid', displayName: 'Failed', role: 'principal', reason: 'Initial staff access' } });
  expect(result.code).toBe(502);
  expect(mockDb.staffInvite.updateMany).toHaveBeenCalledWith({
    where: { id: 'invite-1', usedAt: null }, data: { usedAt: expect.any(Date) },
  });
  expect(mockDb.staffAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({
    action: 'staff_invite_delivery_failed', targetEmail: 'failed@example.invalid',
  }) });
});

test('a missing delivery receipt invalidates even a sent link', async () => {
  mockDb.adminUser.findUnique.mockResolvedValue(null);
  mockDb.emailLog.create.mockRejectedValue(new Error('receipt unavailable'));
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const result = await invoke('post', '/invite', { body: { email: 'receipt@example.invalid', displayName: 'Receipt', role: 'principal', reason: 'Initial staff access' } });
  expect(result.code).toBe(503);
  expect(result.body.code).toBe('invite_receipt_failed');
  expect(mockDb.staffInvite.updateMany).toHaveBeenCalledWith({
    where: { id: 'invite-1', usedAt: null }, data: { usedAt: expect.any(Date) },
  });
  console.error.mockRestore();
});

test('self-demotion and every routine owner mutation fail closed', async () => {
  expect((await invoke('patch', '/:id', { params: { id: 'owner-1' }, body: { role: 'principal', reason: 'Unsafe owner change' } })).body.code).toBe('self_owner_change_denied');
  mockDb.adminUser.findUnique.mockResolvedValue({ id: 'owner-2', email: 'owner2@example.invalid', role: 'owner', isActive: true });
  mockDb.adminUser.count.mockResolvedValue(1);
  const result = await invoke('patch', '/:id', { params: { id: 'owner-2' }, body: { isActive: false, reason: 'Unsafe owner change' } });
  expect(result.code).toBe(409);
  expect(result.body.code).toBe('protected_owner');
});

test('one-use token is claimed atomically before account creation', async () => {
  mockDb.staffInvite.findUnique.mockResolvedValue({
    id: 'invite-1', email: 'principal@example.invalid', displayName: 'Principal', role: 'principal',
    purpose: 'invite', usedAt: null, expiresAt: new Date(Date.now() + 60000), invitedById: 'owner-1',
  });
  mockDb.adminUser.create.mockResolvedValue({ id: 'principal-1', email: 'principal@example.invalid' });
  const result = await invoke('post', '/set-password', { staff: undefined, body: { token: 'one-use-token', password: 'long-password-123' } });
  expect(result.code).toBe(200);
  expect(mockDb.staffInvite.updateMany.mock.calls[0][0]).toEqual(expect.objectContaining({ where: expect.objectContaining({ id: 'invite-1', usedAt: null }) }));
  expect(mockDb.adminUser.create).toHaveBeenCalledWith({ data: expect.objectContaining({ role: 'principal', isActive: true, passwordHash: 'hashed-password' }) });
  expect(mockDb.staffAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({
    action: 'staff_invite_accepted', actorAdminId: 'principal-1', targetAdminId: 'principal-1',
  }) });
});

test('Owner bootstrap acceptance rechecks break-glass Owner, creates only the named Owner, and audits acceptance', async () => {
  mockDb.staffInvite.findUnique.mockResolvedValue({
    id: 'owner-bootstrap-alanhdchu-v1', email: 'alanhdchu@genesisideas.school', displayName: 'Alan Chu', role: 'owner',
    purpose: 'owner_bootstrap', usedAt: null, expiresAt: new Date(Date.now() + 60000), invitedById: 'break-glass-1',
  });
  mockDb.adminUser.findUnique.mockImplementation(async ({ where }) => {
    if (where.email === 'admin@genesisideas.school') {
      return { id: 'break-glass-1', email: where.email, role: 'owner', isActive: true };
    }
    return null;
  });
  mockDb.adminUser.create.mockResolvedValue({ id: 'alan-owner-1', email: 'alanhdchu@genesisideas.school' });
  const result = await invoke('post', '/set-password', {
    staff: undefined, body: { token: 'one-use-owner-token', password: 'long-password-123' },
  });
  expect(result.code).toBe(200);
  expect(mockDb.adminUser.create).toHaveBeenCalledWith({ data: expect.objectContaining({
    email: 'alanhdchu@genesisideas.school', role: 'owner', isActive: true, passwordHash: 'hashed-password',
  }) });
  expect(mockDb.adminUser.update).not.toHaveBeenCalled();
  expect(mockDb.staffAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({
    action: 'owner_bootstrap_accepted', actorAdminId: 'alan-owner-1', targetAdminId: 'alan-owner-1',
  }) });
  expect(mockDb.emailLog.findUnique).toHaveBeenCalledWith({
    where: { dedupeKey: 'owner_bootstrap:owner-bootstrap-alanhdchu-v1' },
    select: { kind: true, recipient: true, status: true, dedupeKey: true },
  });
  expect(mockDb.staffAuditLog.findFirst).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ action: 'owner_bootstrap_provider_accepted' }),
  }));
});

test('Owner bootstrap acceptance fails closed if break-glass Owner changed or target collides', async () => {
  mockDb.staffInvite.findUnique.mockResolvedValue({
    id: 'owner-bootstrap-alanhdchu-v1', email: 'alanhdchu@genesisideas.school', displayName: 'Alan Chu', role: 'owner',
    purpose: 'owner_bootstrap', usedAt: null, expiresAt: new Date(Date.now() + 60000), invitedById: 'break-glass-1',
  });
  mockDb.adminUser.findUnique.mockImplementation(async ({ where }) => {
    if (where.email === 'admin@genesisideas.school') return { id: 'break-glass-1', role: 'owner', isActive: false };
    return null;
  });
  expect((await invoke('post', '/set-password', {
    staff: undefined, body: { token: 'one-use-owner-token', password: 'long-password-123' },
  })).code).toBe(400);
  expect(mockDb.adminUser.create).not.toHaveBeenCalled();

  mockDb.adminUser.findUnique.mockResolvedValue({ id: 'break-glass-1', role: 'owner', isActive: true });
  mockDb.adminUser.findFirst.mockResolvedValue({ id: 'existing-account', email: 'AlanHDChu@GenesisIdeas.School' });
  expect((await invoke('post', '/set-password', {
    staff: undefined, body: { token: 'one-use-owner-token', password: 'long-password-123' },
  })).code).toBe(400);
  expect(mockDb.staffInvite.updateMany).not.toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ id: 'owner-bootstrap-alanhdchu-v1' }),
  }));
});

test.each([
  ['missing delivery receipt', null, { id: 'provider-audit' }],
  ['wrong delivery receipt', {
    kind: 'owner_bootstrap', recipient: 'alanhdchu@genesisideas.school', status: 'error',
    dedupeKey: 'owner_bootstrap:owner-bootstrap-alanhdchu-v1',
  }, { id: 'provider-audit' }],
  ['missing provider audit', {
    kind: 'owner_bootstrap', recipient: 'alanhdchu@genesisideas.school', status: 'sent',
    dedupeKey: 'owner_bootstrap:owner-bootstrap-alanhdchu-v1',
  }, null],
  ['wrong provider audit', {
    kind: 'owner_bootstrap', recipient: 'alanhdchu@genesisideas.school', status: 'sent',
    dedupeKey: 'owner_bootstrap:owner-bootstrap-alanhdchu-v1',
  }, null],
])('Owner bootstrap acceptance rejects %s before atomic claim', async (_label, receipt, audit) => {
  mockDb.staffInvite.findUnique.mockResolvedValue({
    id: 'owner-bootstrap-alanhdchu-v1', email: 'alanhdchu@genesisideas.school', displayName: 'Alan Chu', role: 'owner',
    purpose: 'owner_bootstrap', usedAt: null, expiresAt: new Date(Date.now() + 60000), invitedById: 'break-glass-1',
  });
  mockDb.adminUser.findUnique.mockResolvedValue({ id: 'break-glass-1', role: 'owner', isActive: true });
  mockDb.emailLog.findUnique.mockResolvedValue(receipt);
  mockDb.staffAuditLog.findFirst.mockResolvedValue(audit);
  const result = await invoke('post', '/set-password', {
    staff: undefined, body: { token: 'owner-token-without-provenance', password: 'long-password-123' },
  });
  expect(result.code).toBe(400);
  expect(mockDb.staffInvite.updateMany).not.toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ id: 'owner-bootstrap-alanhdchu-v1' }),
  }));
  expect(mockDb.adminUser.create).not.toHaveBeenCalled();
});

test.each([
  ['AdminUser', 'adminUser'],
  ['StudentAccount', 'studentAccount'],
  ['ParentAccount', 'parentAccount'],
  ['pending StaffInvite', 'staffInvite'],
])('Owner bootstrap acceptance rejects a mixed-case %s collision before claim', async (_label, model) => {
  mockDb.staffInvite.findUnique.mockResolvedValue({
    id: 'owner-bootstrap-alanhdchu-v1', email: 'alanhdchu@genesisideas.school', displayName: 'Alan Chu', role: 'owner',
    purpose: 'owner_bootstrap', usedAt: null, expiresAt: new Date(Date.now() + 60000), invitedById: 'break-glass-1',
  });
  mockDb.adminUser.findUnique.mockResolvedValue({ id: 'break-glass-1', role: 'owner', isActive: true });
  mockDb[model].findFirst.mockResolvedValue({ id: 'mixed-case-collision', email: 'AlanHDChu@GenesisIdeas.School' });
  const result = await invoke('post', '/set-password', {
    staff: undefined, body: { token: 'owner-token-with-collision', password: 'long-password-123' },
  });
  expect(result.code).toBe(400);
  expect(mockDb.adminUser.create).not.toHaveBeenCalled();
});

test('staff update accepts exactly one mutation and labels enable correctly', async () => {
  const invalid = await invoke('patch', '/:id', {
    params: { id: 'staff-2' }, body: { role: 'academic_staff', isActive: true, reason: 'Ambiguous update' },
  });
  expect(invalid.code).toBe(400);
  mockDb.adminUser.findUnique.mockResolvedValue({ id: 'staff-2', email: 'staff@example.invalid', displayName: 'Staff', role: 'academic_staff', isActive: false });
  mockDb.adminUser.update.mockResolvedValue({ id: 'staff-2', email: 'staff@example.invalid', displayName: 'Staff', role: 'academic_staff', isActive: true });
  const enabled = await invoke('patch', '/:id', {
    params: { id: 'staff-2' }, body: { isActive: true, reason: 'Return from leave' },
  });
  expect(enabled.code).toBe(200);
  expect(mockDb.staffAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: 'staff_enabled' }) });
});

test.each(['principal', 'academic_staff', 'admissions_staff'])('role %s is provisionable', async (role) => {
  mockDb.adminUser.findUnique.mockResolvedValue(null);
  const result = await invoke('post', '/invite', {
    body: { email: `${role}@example.invalid`, displayName: role, role, reason: 'Approved synthetic role test' },
  });
  expect(result.code).toBe(201);
});

test.each(['owner', 'support_read_only'])('role %s cannot be invited through routine staff access', async (role) => {
  const result = await invoke('post', '/invite', {
    body: { email: `${role}@example.invalid`, displayName: role, role, reason: 'Unsafe role request' },
  });
  expect(result.code).toBe(400);
  expect(mockDb.staffInvite.create).not.toHaveBeenCalled();
});

test('named Owner email is reserved from every routine invite purpose', async () => {
  const result = await invoke('post', '/invite', {
    body: {
      email: 'alanhdchu@genesisideas.school', displayName: 'Alan', role: 'principal',
      reason: 'Unsafe cross-role invitation',
    },
  });
  expect(result.code).toBe(409);
  expect(result.body.code).toBe('reserved_owner_bootstrap_identity');
  expect(mockDb.adminUser.findUnique).not.toHaveBeenCalled();
  expect(mockDb.staffInvite.create).not.toHaveBeenCalled();
});

test('configured Principal role and state are protected while another principal remains manageable', async () => {
  const previous = process.env.PRINCIPAL_APPROVER_EMAIL;
  const legacyPrevious = process.env.PRINCIPAL_EMAIL;
  process.env.PRINCIPAL_APPROVER_EMAIL = 'configured@example.invalid';
  process.env.PRINCIPAL_EMAIL = 'wrong-legacy-principal@example.invalid';
  mockDb.adminUser.findUnique.mockResolvedValueOnce({
    id: 'principal-1', email: 'configured@example.invalid', displayName: 'Configured', role: 'principal', isActive: true,
  });
  const protectedResult = await invoke('patch', '/:id', {
    params: { id: 'principal-1' }, body: { role: 'academic_staff', reason: 'Attempt protected mutation' },
  });
  expect(protectedResult.body.code).toBe('protected_principal');

  mockDb.adminUser.findUnique.mockResolvedValueOnce({
    id: 'principal-2', email: 'other@example.invalid', displayName: 'Other', role: 'principal', isActive: true,
  });
  mockDb.adminUser.update.mockResolvedValue({
    id: 'principal-2', email: 'other@example.invalid', displayName: 'Other', role: 'academic_staff', isActive: true,
  });
  const ordinaryResult = await invoke('patch', '/:id', {
    params: { id: 'principal-2' }, body: { role: 'academic_staff', reason: 'Move to academic team' },
  });
  expect(ordinaryResult.code).toBe(200);
  expect(mockDb.loginSession.updateMany).toHaveBeenCalled();
    if (previous === undefined) delete process.env.PRINCIPAL_APPROVER_EMAIL;
    else process.env.PRINCIPAL_APPROVER_EMAIL = previous;
    if (legacyPrevious === undefined) delete process.env.PRINCIPAL_EMAIL;
    else process.env.PRINCIPAL_EMAIL = legacyPrevious;
});

test('explicit session revocation is idempotent, invalidates links, and records audit', async () => {
  mockDb.adminUser.findUnique.mockResolvedValue({
    id: 'academic-1', email: 'academic@example.invalid', displayName: 'Academic', role: 'academic_staff', isActive: true,
  });
  mockDb.loginSession.updateMany.mockResolvedValueOnce({ count: 0 });
  mockDb.staffInvite.updateMany.mockResolvedValueOnce({ count: 2 });
  const result = await invoke('post', '/:id/sessions/revoke', {
    params: { id: 'academic-1' }, body: { reason: 'End access on shared device' },
  });
  expect(result.code).toBe(200);
  expect(result.body).toEqual(expect.objectContaining({ ok: true, sessionsRevoked: 0, linksInvalidated: 2 }));
  expect(mockDb.staffAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({
    action: 'staff_sessions_revoked', targetAdminId: 'academic-1',
    metadata: expect.objectContaining({ reason: 'End access on shared device', sessionsRevoked: 0 }),
  }) });
});

test('staff list returns only safe summaries, pending invitations, roles and audit projections', async () => {
  mockDb.adminUser.findMany.mockResolvedValue([{ id: 'owner-1', email: 'owner@example.invalid', displayName: 'Owner', role: 'owner', isActive: true }]);
  mockDb.staffInvite.findMany.mockResolvedValue([{
    id: 'invite-safe', email: 'academic@example.invalid', displayName: 'Academic', role: 'academic_staff',
    expiresAt: new Date(Date.now() + 60000), createdAt: new Date(), tokenHash: 'must-not-leak',
  }]);
  mockDb.loginSession.findMany.mockResolvedValue([{ adminId: 'owner-1', startedAt: new Date(), lastSeenAt: new Date(), endedAt: null, ipAddress: 'must-not-leak' }]);
  mockDb.staffAuditLog.findMany.mockResolvedValue([{
    id: 'audit-1', action: 'staff_invited', actorAdminId: 'owner-1', targetAdminId: null,
    targetEmail: 'academic@example.invalid', createdAt: new Date(),
    metadata: { reason: 'New hire', token: 'must-not-leak', password: 'must-not-leak' },
  }]);
  mockDb.emailLog.findMany.mockResolvedValue([{ dedupeKey: 'staff_invite:invite-safe', status: 'sent' }]);
  const result = await invoke('get', '/');
  expect(result.code).toBe(200);
  expect(result.body.roles).toEqual(['principal', 'academic_staff', 'admissions_staff']);
  expect(result.body.staff[0]).toEqual(expect.objectContaining({ protection: 'owner', sessions: expect.objectContaining({ openSessionCount: 1 }) }));
  expect(result.body.invitations[0]).not.toHaveProperty('tokenHash');
  expect(result.body.invitations[0].deliveryStatus).toBe('provider_accepted');
  expect(result.body.audit[0].metadata).toEqual({ reason: 'New hire' });
  expect(JSON.stringify(result.body)).not.toMatch(/must-not-leak/);
});

test.each(['owner', 'support_read_only', 'unknown'])('stale %s invite cannot create an account', async (role) => {
  mockDb.staffInvite.findUnique.mockResolvedValue({
    id: 'legacy', email: 'legacy@example.invalid', displayName: 'Legacy', role,
    purpose: 'invite', usedAt: null, expiresAt: new Date(Date.now() + 60000), invitedById: 'owner-1',
  });
  const result = await invoke('post', '/set-password', {
    staff: undefined, body: { token: 'legacy-token', password: 'long-password-123' },
  });
  expect(result.code).toBe(400);
  expect(mockDb.adminUser.create).not.toHaveBeenCalled();
});

test('legacy routine-purpose token for the named Owner email cannot create any role', async () => {
  mockDb.staffInvite.findUnique.mockResolvedValue({
    id: 'legacy-alan', email: 'alanhdchu@genesisideas.school', displayName: 'Alan', role: 'principal',
    purpose: 'invite', usedAt: null, expiresAt: new Date(Date.now() + 60000), invitedById: 'owner-1',
  });
  const result = await invoke('post', '/set-password', {
    staff: undefined, body: { token: 'legacy-token', password: 'long-password-123' },
  });
  expect(result.code).toBe(400);
  expect(mockDb.adminUser.create).not.toHaveBeenCalled();
});

test('staff mutations reject an absent or untrusted Origin', async () => {
  const result = await invoke('post', '/invite', {
    headers: { origin: 'https://attacker.invalid' },
    body: { email: 'academic@example.invalid', displayName: 'Academic', role: 'academic_staff', reason: 'Synthetic request' },
  });
  expect(result.code).toBe(403);
  expect(result.body.code).toBe('untrusted_origin');
});

test('passwords above bcrypt 72-byte limit are rejected before token claim', async () => {
  const result = await invoke('post', '/set-password', {
    staff: undefined, body: { token: 'token', password: '🙂'.repeat(19) },
  });
  expect(result.code).toBe(400);
  expect(mockDb.staffInvite.findUnique).not.toHaveBeenCalled();
});
