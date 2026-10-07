// Account authentication integration with actual routers/JWT and in-memory DB.
// No real Prisma, mail, credentials, Stripe requests, or listening server.
const mockPrisma = {
  loginSession: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  adminUser: { findUnique: jest.fn() },
  studentAccount: { findUnique: jest.fn(), create: jest.fn() },
  parentAccount: { findUnique: jest.fn(), update: jest.fn() },
  student: { findUnique: jest.fn(), create: jest.fn() },
  subscription: { findFirst: jest.fn() },
  $transaction: jest.fn(),
};
const mockStripe = {
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: jest.fn() } },
};
jest.mock('../lib/prisma', () => mockPrisma);
jest.mock('../lib/mailer', () => ({ sendPasswordResetEmail: () => { throw Error('No mail allowed'); } }));
jest.mock('../lib/parentCredentials', () => ({ DEFAULT_PARENT_PASSWORD: 'fixture-only', parentLoginEmailForStudentEmail: jest.fn() }));
jest.mock('bcryptjs', () => ({ compare: jest.fn(async () => true), hash: jest.fn(async () => 'synthetic-hash') }));
jest.mock('stripe', () => () => mockStripe);
process.env.JWT_SECRET = 'session-regression-only-never-production';
process.env.STRIPE_SECRET_KEY = 'synthetic-not-a-live-key';
process.env.STRIPE_PRICE_GROUP_MONTHLY = 'price_synthetic_group';
process.env.STRIPE_PRICE_SELF_PACED_MONTHLY = 'price_synthetic_monthly';
const jwt = require('jsonwebtoken');
const { authenticate, requireAdmin, requireStudentOrAdminForStudentParam } = require('../middleware/auth');
const authRoutes = require('./auth');
const parentAuthRoutes = require('./parent-auth');
const parentDataRoutes = require('./parent-data');
const billingRoutes = require('./billing');
const checkoutRoutes = require('./checkout');
const identities = {
  admin: { role: 'admin', adminId: 'admin-fixture', email: 'admin@example.invalid' },
  student: { role: 'student', studentId: 'student-fixture', email: 'student@example.invalid' },
  parent: { role: 'parent', parentId: 'parent-fixture', studentId: 'student-fixture', email: 'parent@example.invalid' },
};
let sessions;
function resDouble() {
  return { code: 200, cookies: {}, cleared: [],
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    cookie(name, value) { this.cookies[name] = value; return this; },
    clearCookie(name) { this.cleared.push(name); return this; },
  };
}
async function invoke(router, method, route, req = {}) {
  const layer = router.stack.find(l => l.route?.path === route && l.route.methods[method]);
  if (!layer) throw Error(`Missing route ${method} ${route}`);
  const request = { headers: {}, cookies: {}, body: {}, params: {}, ...req };
  const res = resDouble();
  for (const item of layer.route.stack) {
    let advance = false;
    await item.handle(request, res, err => { if (err) throw err; advance = true; });
    if (!advance) break;
  }
  return { res, req: request };
}
function tokenFor(role, overrides = {}, rowOverrides = {}) {
  const claims = { ...identities[role], sessionId: `${role}-session`, ...overrides };
  if (claims.sessionId) sessions.set(claims.sessionId, {
    id: claims.sessionId, role, email: identities[role].email,
    adminId: identities[role].adminId || null,
    studentId: identities[role].studentId || null,
    parentAccountId: identities[role].parentId || null,
    startedAt: new Date(), endedAt: null, ...rowOverrides,
  });
  return jwt.sign(claims, process.env.JWT_SECRET, { expiresIn: '1h' });
}
async function check(token) {
  const req = { headers: { authorization: `Bearer ${token}` }, params: {} };
  const res = resDouble(); const next = jest.fn();
  await authenticate(req, res, next);
  return { req, res, next };
}
beforeEach(() => {
  jest.resetAllMocks();
  require('bcryptjs').compare.mockResolvedValue(true);
  require('bcryptjs').hash.mockResolvedValue('synthetic-hash');
  sessions = new Map();
  mockPrisma.loginSession.create.mockImplementation(async ({ data }) => {
    const row = { ...data, id: `${data.role}-session`, startedAt: new Date(), endedAt: null };
    sessions.set(row.id, row); return row;
  });
  mockPrisma.loginSession.findUnique.mockImplementation(async ({ where }) => sessions.get(where.id) || null);
  mockPrisma.loginSession.update.mockImplementation(async ({ where, data }) => Object.assign(sessions.get(where.id), data));
  mockPrisma.loginSession.updateMany.mockImplementation(async ({ where, data }) => {
    const row = sessions.get(where.id);
    if (!row || (where.endedAt === null && row.endedAt)) return { count: 0 };
    Object.assign(row, data); return { count: 1 };
  });
  mockPrisma.adminUser.findUnique.mockImplementation(async ({ where }) => where.email === identities.admin.email || where.id === identities.admin.adminId ? { id: identities.admin.adminId, email: identities.admin.email, passwordHash: 'synthetic' } : null);
  mockPrisma.studentAccount.findUnique.mockResolvedValue({ id: 'account-fixture', studentId: 'student-fixture', email: identities.student.email, passwordHash: 'synthetic', isActive: true, student: { id: 'student-fixture', name: 'Fixture' } });
  mockPrisma.parentAccount.findUnique.mockResolvedValue({ id: 'parent-fixture', studentId: 'student-fixture', email: identities.parent.email, passwordHash: 'synthetic' });
  mockPrisma.student.findUnique.mockResolvedValue(null);
  mockPrisma.student.create.mockResolvedValue({ id: 'student-fixture', name: 'Fixture' });
  mockPrisma.studentAccount.create.mockResolvedValue({ id: 'account-fixture', studentId: 'student-fixture', email: identities.student.email });
  mockPrisma.$transaction.mockImplementation(async operation => operation(mockPrisma));
  mockPrisma.subscription.findFirst.mockResolvedValue({ stripeCustomerId: 'cus_synthetic' });
  mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_synthetic', url: 'https://example.invalid/checkout' });
  mockStripe.billingPortal.sessions.create.mockResolvedValue({ url: 'https://example.invalid/portal' });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test.each(['admin', 'student'])('%s logout prevents reuse of the exact same token', async role => {
  const login = await invoke(authRoutes, 'post', '/login', { body: { email: identities[role].email, password: 'fixture-password' } });
  expect(login.res.code).toBe(200);
  const token = login.res.body.token;
  expect((await check(token)).next).toHaveBeenCalledTimes(1);
  const out = await invoke(authRoutes, 'post', '/logout', { headers: { authorization: `Bearer ${token}` } });
  expect(out.res.code).toBe(200);
  const replay = await check(token);
  expect(replay.res.code).toBe(401);
  expect(replay.next).not.toHaveBeenCalled();
});

test('parent login/logout revokes both parent-data and billing access', async () => {
  const login = await invoke(parentAuthRoutes, 'post', '/login', { body: { email: identities.parent.email, password: 'fixture-password' } });
  const token = login.res.cookies.giis_parent_jwt;
  expect(token).toBeTruthy();
  const request = { cookies: { giis_parent_jwt: token } };
  expect((await invoke(billingRoutes, 'post', '/portal', request)).res.code).toBe(200);
  expect((await invoke(parentAuthRoutes, 'post', '/logout', request)).res.code).toBe(200);
  mockPrisma.student.findUnique.mockClear(); mockStripe.billingPortal.sessions.create.mockClear();
  for (const [router, method, route] of [[parentDataRoutes, 'get', '/me'], [parentDataRoutes, 'get', '/transcript'], [billingRoutes, 'post', '/portal']]) {
    expect((await invoke(router, method, route, request)).res.code).toBe(401);
  }
  expect(mockPrisma.student.findUnique).not.toHaveBeenCalled();
  expect(mockStripe.billingPortal.sessions.create).not.toHaveBeenCalled();
});

test.each(['ended', 'missing', 'role', 'adminId', 'email', 'legacy', 'no-role'])('general authentication rejects %s session', async kind => {
  const token = tokenFor('admin', kind === 'legacy' ? { sessionId: null } : kind === 'no-role' ? { role: undefined } : {});
  const row = sessions.get('admin-session');
  if (kind === 'ended') row.endedAt = new Date();
  if (kind === 'missing') sessions.clear();
  if (kind === 'role') row.role = 'parent';
  if (kind === 'adminId') row.adminId = 'other-admin';
  if (kind === 'email') row.email = 'other@example.invalid';
  const result = await check(token);
  expect(result.res.code).toBe(401); expect(result.next).not.toHaveBeenCalled();
});

test.each(['studentId', 'parentAccountId', 'role', 'email'])('parent session with mismatched %s is rejected', async key => {
  const token = tokenFor('parent', {}, { [key]: 'other' });
  expect((await invoke(parentDataRoutes, 'get', '/transcript', { headers: { authorization: `Bearer ${token}` } })).res.code).toBe(401);
  expect(mockPrisma.student.findUnique).not.toHaveBeenCalled();
});

test('lookup failure returns 503 and never authorizes any account-auth consumer', async () => {
  const admin = tokenFor('admin'), parent = tokenFor('parent');
  mockPrisma.loginSession.findUnique.mockRejectedValue(Error('synthetic DB failure'));
  const common = await check(admin); expect(common.res.code).toBe(503); expect(common.next).not.toHaveBeenCalled();
  for (const [router, method, route, token, body] of [
    [parentDataRoutes, 'get', '/me', parent, {}], [parentDataRoutes, 'get', '/transcript', parent, {}],
    [billingRoutes, 'post', '/portal', parent, {}], [parentAuthRoutes, 'post', '/setup', admin, {}],
    [checkoutRoutes, 'post', '/create-session', admin, { planType: 'group_monthly' }],
  ]) expect((await invoke(router, method, route, { headers: { authorization: `Bearer ${token}` }, body })).res.code).toBe(503);
  expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
  expect(mockStripe.billingPortal.sessions.create).not.toHaveBeenCalled();
});

test.each(['admin', 'student', 'parent'])('%s session creation failure issues no token/cookie', async role => {
  mockPrisma.loginSession.create.mockRejectedValue(Error('synthetic create failure'));
  const result = await invoke(role === 'parent' ? parentAuthRoutes : authRoutes, 'post', '/login', { body: { email: identities[role].email, password: 'fixture-password' } });
  expect(result.res.code).toBe(503);
  expect(result.res.body.token).toBeUndefined(); expect(result.res.cookies).toEqual({});
});

test.each(['admin', 'parent'])('%s logout failure reports 503 and keeps cookie for retry', async role => {
  const token = tokenFor(role); const cookie = role === 'parent' ? 'giis_parent_jwt' : 'giis_jwt';
  mockPrisma.loginSession.update.mockRejectedValue(Error('synthetic write failure'));
  mockPrisma.loginSession.updateMany.mockRejectedValue(Error('synthetic write failure'));
  const result = await invoke(role === 'parent' ? parentAuthRoutes : authRoutes, 'post', '/logout', { cookies: { [cookie]: token } });
  expect(result.res.code).toBe(503); expect(result.res.cleared).toEqual([]);
  expect(sessions.get(`${role}-session`).endedAt).toBeNull();
});

test('revoked admin cannot use parent setup or private checkout, public checkout stays public', async () => {
  const token = tokenFor('admin', {}, { endedAt: new Date() });
  const req = { headers: { authorization: `Bearer ${token}` } };
  expect((await invoke(parentAuthRoutes, 'post', '/setup', req)).res.code).toBe(401);
  expect((await invoke(checkoutRoutes, 'post', '/create-session', { ...req, body: { planType: 'group_monthly' } })).res.code).toBe(401);
  expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
  expect((await invoke(checkoutRoutes, 'post', '/create-session', { body: { planType: 'self_paced_monthly' } })).res.code).toBe(200);
});

test('roles stay isolated even if a non-admin claim carries an adminId', async () => {
  const student = tokenFor('student', { adminId: 'admin-fixture' });
  const result = await check(student);
  expect(result.next).toHaveBeenCalledTimes(1);
  const next = jest.fn(); requireAdmin(result.req, result.res, next);
  expect(result.res.code).toBe(403); expect(next).not.toHaveBeenCalled();
  expect((await invoke(checkoutRoutes, 'post', '/create-session', { headers: { authorization: `Bearer ${student}` }, body: { planType: 'group_monthly' } })).res.code).toBe(403);
  const parent = tokenFor('parent', { adminId: 'admin-fixture' });
  expect((await check(parent)).next).not.toHaveBeenCalled();
  const foreign = resDouble(); requireStudentOrAdminForStudentParam({ auth: identities.student, params: { id: 'other-student' } }, foreign, next);
  expect(foreign.code).toBe(403);
});

test.each(['admin', 'parent'])('%s logout is idempotent and a new login session still works', async role => {
  const router = role === 'parent' ? parentAuthRoutes : authRoutes;
  const token = tokenFor(role); const req = { headers: { authorization: `Bearer ${token}` } };
  expect((await invoke(router, 'post', '/logout', req)).res.code).toBe(200);
  expect((await invoke(router, 'post', '/logout', req)).res.code).toBe(200);
  const fresh = tokenFor(role, { sessionId: `${role}-new-session` });
  if (role === 'admin') expect((await check(fresh)).next).toHaveBeenCalledTimes(1);
  else expect((await invoke(billingRoutes, 'post', '/portal', { headers: { authorization: `Bearer ${fresh}` } })).res.code).toBe(200);
  expect(sessions.get(`${role}-session`).endedAt).toBeInstanceOf(Date);
});

test.each(['admin', 'parent'])('%s logout cannot close a different principal session', async role => {
  const token = tokenFor(role, {}, role === 'admin' ? { adminId: 'different-admin' } : { parentAccountId: 'different-parent' });
  const result = await invoke(role === 'parent' ? parentAuthRoutes : authRoutes, 'post', '/logout', { headers: { authorization: `Bearer ${token}` } });
  expect(result.res.code).toBe(200); // invalid credentials are already signed out
  expect(sessions.get(`${role}-session`).endedAt).toBeNull();
  expect(mockPrisma.loginSession.update).not.toHaveBeenCalled();
});

test('logout lookup outage is retryable, including when a cookie is present', async () => {
  const token = tokenFor('admin');
  mockPrisma.loginSession.findUnique.mockRejectedValueOnce(Error('synthetic outage'));
  const req = { cookies: { giis_jwt: token } };
  const failed = await invoke(authRoutes, 'post', '/logout', req);
  expect(failed.res.code).toBe(503); expect(failed.res.cleared).toEqual([]);
  expect((await invoke(authRoutes, 'post', '/logout', req)).res.code).toBe(200);
  expect((await check(token)).res.code).toBe(401);
});

test('expired or invalid tokens fail before querying the session store', async () => {
  const expired = jwt.sign({ ...identities.admin, sessionId: 'admin-session' }, process.env.JWT_SECRET, { expiresIn: -1 });
  for (const token of ['bad.jwt', expired]) {
    expect((await check(token)).res.code).toBe(401);
  }
  expect(mockPrisma.loginSession.findUnique).not.toHaveBeenCalled();
});

test('a revoked cookie cannot be bypassed with a valid bearer token', async () => {
  const ended = tokenFor('admin', {}, { endedAt: new Date() });
  const fresh = tokenFor('admin', { sessionId: 'fresh-session' });
  const req = { cookies: { giis_jwt: ended }, headers: { authorization: `Bearer ${fresh}` } };
  const res = resDouble(), next = jest.fn();
  await authenticate(req, res, next);
  expect(res.code).toBe(401); expect(next).not.toHaveBeenCalled();
});

test('student session bound to a different student is rejected', async () => {
  const token = tokenFor('student', {}, { studentId: 'other-student' });
  expect((await check(token)).res.code).toBe(401);
});

test('revocation racing activity telemetry cannot reopen or retouch a closed session', async () => {
  const { touchLoginSession, closeLoginSession } = require('../lib/sessionTracker');
  tokenFor('admin');
  let completeRead;
  mockPrisma.loginSession.findUnique.mockImplementationOnce(() => new Promise(resolve => { completeRead = resolve; }));
  const delayedTouch = touchLoginSession('admin-session', { headers: {} });
  await closeLoginSession('admin-session', { headers: {} });
  const endedAt = sessions.get('admin-session').endedAt;
  completeRead({ startedAt: new Date(), endedAt: null });
  await delayedTouch;
  expect(sessions.get('admin-session').endedAt).toEqual(endedAt);
  expect(mockPrisma.loginSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'admin-session', endedAt: null } }));
  await expect(mockPrisma.loginSession.updateMany.mock.results[0].value).resolves.toEqual({ count: 0 });
});

test('registration cannot issue a sessionless token if session persistence fails', async () => {
  mockPrisma.studentAccount.findUnique.mockResolvedValue(null);
  mockPrisma.loginSession.create.mockRejectedValue(Error('synthetic create failure'));
  const result = await invoke(authRoutes, 'post', '/register', { body: {
    email: identities.student.email, password: 'fixture-password', name: 'Fixture',
    birthDate: '2009-01-01', parentGuardian: 'Fixture guardian', address: 'Fixture', city: 'Fixture', province: 'Fixture',
  } });
  expect(result.res.code).toBe(503);
  expect(result.res.body).toMatchObject({
    code: 'registration_session_unavailable',
    error: expect.stringMatching(/account was created.*logging in/i),
  });
  expect(result.res.body.token).toBeUndefined(); expect(result.res.cookies).toEqual({});
  // The existing registration transaction commits the account before session
  // creation. A subsequent login can retry; this does not claim full rollback.
  expect(mockPrisma.studentAccount.create).toHaveBeenCalledTimes(1);
});

test('valid admin session still reaches parent setup and internal checkout', async () => {
  const token = tokenFor('admin'); const req = { cookies: { giis_jwt: token } };
  const setup = await invoke(parentAuthRoutes, 'post', '/setup', req);
  expect(setup.res.code).toBe(400); expect(setup.res.body.error).toBe('studentId required');
  expect((await invoke(checkoutRoutes, 'post', '/create-session', { ...req, body: { planType: 'group_monthly' } })).res.code).toBe(200);
});
