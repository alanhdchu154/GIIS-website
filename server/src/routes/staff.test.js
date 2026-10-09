const mockDb = {
  adminUser: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  studentAccount: { findUnique: jest.fn() },
  parentAccount: { findUnique: jest.fn() },
  staffInvite: { findUnique: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
  staffAuditLog: { create: jest.fn() },
  loginSession: { updateMany: jest.fn() },
  emailLog: { create: jest.fn() },
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
  const req = { params: {}, body: {}, staff: { id: 'owner-1', email: 'owner@example.invalid', role: 'owner' }, ...request };
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
  mockDb.parentAccount.findUnique.mockResolvedValue(null);
  mockDb.staffInvite.updateMany.mockResolvedValue({ count: 1 });
  mockDb.staffInvite.create.mockImplementation(async ({ data }) => ({ id: 'invite-1', ...data }));
  mockDb.staffAuditLog.create.mockResolvedValue({ id: 'audit-1' });
  mockDb.emailLog.create.mockResolvedValue({ id: 'email-1' });
  mockDb.loginSession.updateMany.mockResolvedValue({ count: 2 });
  mockSendStaffAccessEmail.mockResolvedValue({ ok: true, id: 'provider-1' });
});

test('only owner can invite and invitation records a delivery receipt without returning token', async () => {
  const body = { email: 'principal@example.invalid', displayName: 'Principal', role: 'principal' };
  expect((await invoke('post', '/invite', { staff: { id: 'p', role: 'principal' }, body })).code).toBe(403);
  mockDb.adminUser.findUnique.mockResolvedValue(null);
  const result = await invoke('post', '/invite', { body });
  expect(result.code).toBe(201);
  expect(result.body.token).toBeUndefined();
  expect(mockDb.staffInvite.create).toHaveBeenCalledWith({ data: expect.objectContaining({ email: body.email, role: 'principal', purpose: 'invite', tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) }) });
  expect(mockDb.emailLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ kind: 'staff_invite', status: 'sent', providerId: 'provider-1' }) });
});

test('staff reset revokes all open sessions before issuing one-use reset', async () => {
  mockDb.adminUser.findUnique.mockResolvedValue({ id: 'staff-2', email: 'staff@example.invalid', displayName: 'Staff', role: 'academic_staff', isActive: true });
  const result = await invoke('post', '/:id/password-reset', { params: { id: 'staff-2' } });
  expect(result.code).toBe(200);
  expect(mockDb.loginSession.updateMany).toHaveBeenCalledWith({ where: { adminId: 'staff-2', endedAt: null }, data: { endedAt: expect.any(Date) } });
  expect(mockDb.staffInvite.create).toHaveBeenCalledWith({ data: expect.objectContaining({ purpose: 'password_reset', email: 'staff@example.invalid' }) });
});

test('a failed delivery invalidates the undelivered access token', async () => {
  mockDb.adminUser.findUnique.mockResolvedValue(null);
  mockSendStaffAccessEmail.mockResolvedValue({ ok: false, error: 'synthetic delivery failure' });
  const result = await invoke('post', '/invite', { body: { email: 'failed@example.invalid', displayName: 'Failed', role: 'principal' } });
  expect(result.code).toBe(502);
  expect(mockDb.staffInvite.updateMany).toHaveBeenCalledWith({
    where: { id: 'invite-1', usedAt: null }, data: { usedAt: expect.any(Date) },
  });
});

test('a missing delivery receipt invalidates even a sent link', async () => {
  mockDb.adminUser.findUnique.mockResolvedValue(null);
  mockDb.emailLog.create.mockRejectedValue(new Error('receipt unavailable'));
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const result = await invoke('post', '/invite', { body: { email: 'receipt@example.invalid', displayName: 'Receipt', role: 'principal' } });
  expect(result.code).toBe(503);
  expect(result.body.code).toBe('invite_receipt_failed');
  expect(mockDb.staffInvite.updateMany).toHaveBeenCalledWith({
    where: { id: 'invite-1', usedAt: null }, data: { usedAt: expect.any(Date) },
  });
  console.error.mockRestore();
});

test('self-demotion and last-owner removal fail closed', async () => {
  expect((await invoke('patch', '/:id', { params: { id: 'owner-1' }, body: { role: 'principal' } })).body.code).toBe('self_owner_change_denied');
  mockDb.adminUser.findUnique.mockResolvedValue({ id: 'owner-2', email: 'owner2@example.invalid', role: 'owner', isActive: true });
  mockDb.adminUser.count.mockResolvedValue(1);
  const result = await invoke('patch', '/:id', { params: { id: 'owner-2' }, body: { isActive: false } });
  expect(result.code).toBe(409);
  expect(result.body.code).toBe('last_owner');
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
});
