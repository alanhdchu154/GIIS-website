// Synthetic account-activation integration: no real DB, mail, payment, or enrollment writes.
const mockDb = {
  application: { findUnique: jest.fn(), updateMany: jest.fn() },
  applicationEvent: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  student: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  studentAccount: { findUnique: jest.fn() },
  parentAccount: { findUnique: jest.fn(), create: jest.fn() },
  subscription: { findMany: jest.fn(), updateMany: jest.fn() },
  emailLog: { create: jest.fn() },
  enrollment: { create: jest.fn(), createMany: jest.fn(), upsert: jest.fn() },
  $transaction: jest.fn(),
};
const mockSendWelcomeEmail = jest.fn();

jest.mock('../lib/prisma', () => mockDb);
jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => req.auth ? next() : res.status(401).json({ error: 'Unauthenticated' }),
  requireAdmin: (req, res, next) => req.auth?.role === 'admin' ? next() : res.status(403).json({ error: 'Forbidden' }),
  requirePermission: () => (req, res, next) => req.auth?.role === 'admin' ? next() : res.status(403).json({ error: 'Forbidden' }),
}));
jest.mock('../lib/mailer', () => ({
  sendApplicationInterestConfirmation: jest.fn(),
  sendNewApplicationAlert: jest.fn(),
  sendStatusLinkEmail: jest.fn(),
  sendWelcomeEmail: mockSendWelcomeEmail,
}));
jest.mock('../lib/parentCredentials', () => ({
  studentLoginEmailForName: () => 'synthetic.student@genesisideas.school',
  parentLoginEmailForStudentEmail: () => 'parent.synthetic.student@genesisideas.school',
}));
jest.mock('bcryptjs', () => ({ hash: jest.fn(async value => `hashed:${value}`) }));
jest.mock('stripe', () => () => ({}));

process.env.STRIPE_SECRET_KEY = '';
process.env.CORS_ORIGIN = 'https://example.invalid';

const router = require('./applications');

const approvedApplication = {
  id: 'application-1',
  status: 'approved',
  accountsCreated: false,
  applicantType: 'new',
  studentName: 'Synthetic Student',
  dob: '2011-04-12',
  parentName: 'Synthetic Parent',
  parentEmail: 'parent@example.invalid',
  interestConfirmedAt: new Date('2026-10-01T12:00:00Z'),
  preferredLanguage: 'en',
  communicationLanguage: 'en',
  updatedAt: new Date('2026-10-17T12:00:00Z'),
  transferEvaluation: null,
  placementDecision: null,
};

const createdStudent = {
  id: 'student-1',
  studentCode: 'GIIS-2026-ABCD',
  account: { email: 'synthetic.student@genesisideas.school' },
  parentAccounts: [],
};

let mockSubscriptionStudentId;

function response() {
  return {
    code: 200,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function activate() {
  const route = router.stack.find(layer => layer.route?.path === '/:id/activate' && layer.route.methods.post).route;
  const req = {
    params: { id: approvedApplication.id },
    body: {},
    auth: { role: 'admin', adminId: 'owner-1', email: 'owner@example.invalid' },
  };
  const res = response();
  for (const item of route.stack) {
    let next = false;
    await item.handle(req, res, error => { if (error) throw error; next = true; });
    if (!next) break;
  }
  return res;
}

beforeEach(() => {
  jest.resetAllMocks();
  mockSubscriptionStudentId = null;
  mockDb.application.findUnique.mockResolvedValue(approvedApplication);
  mockDb.student.findFirst.mockResolvedValue(null);
  mockDb.student.findUnique.mockResolvedValue(null);
  mockDb.studentAccount.findUnique.mockResolvedValue(null);
  mockDb.parentAccount.findUnique.mockResolvedValue(null);
  mockDb.applicationEvent.findFirst.mockResolvedValue(null);
  mockDb.applicationEvent.findMany.mockResolvedValue([{ metadata: { subscriptionId: 'subscription-1' } }]);
  mockDb.subscription.findMany.mockImplementation(async () => ([{
    id: 'subscription-1',
    studentId: mockSubscriptionStudentId,
    status: 'active',
  }]));
  mockDb.application.updateMany.mockResolvedValue({ count: 1 });
  mockDb.student.create.mockResolvedValue({ ...createdStudent, parentAccounts: [] });
  mockDb.parentAccount.create.mockResolvedValue({ email: 'parent.synthetic.student@genesisideas.school' });
  mockDb.subscription.updateMany.mockImplementation(async ({ data }) => {
    mockSubscriptionStudentId = data.studentId;
    return { count: 1 };
  });
  mockDb.applicationEvent.create.mockResolvedValue({ id: 'event-1' });
  mockDb.emailLog.create.mockResolvedValue({ id: 'email-log-1' });
  mockDb.$transaction.mockImplementation(async callback => callback(mockDb));
  mockSendWelcomeEmail.mockResolvedValue({ ok: true, id: 'mail-1' });
});

test('success atomically claims the application and returns explicit course-setup pending state', async () => {
  const result = await activate();

  expect(result.code).toBe(200);
  expect(result.body).toMatchObject({
    ok: true,
    alreadyActivated: false,
    studentId: 'student-1',
    credentialsAvailable: true,
    linkedSubscriptions: 1,
    courseSetupPending: true,
  });
  expect(result.body.nextStep).toMatch(/Course setup remains pending/i);
  expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
  expect(mockDb.application.updateMany).toHaveBeenCalledWith({
    where: {
      id: approvedApplication.id,
      status: 'approved',
      accountsCreated: false,
      updatedAt: approvedApplication.updatedAt,
    },
    data: { accountsCreated: true },
  });
  expect(mockDb.student.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({
      account: { create: expect.objectContaining({ email: 'synthetic.student@genesisideas.school' }) },
    }),
  }));
  expect(mockDb.applicationEvent.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      action: 'accounts_activated',
      metadata: { studentId: 'student-1', courseSetupPending: true },
    }),
  });
});

test('an application-owned payment already linked to another student fails closed before activation writes', async () => {
  mockSubscriptionStudentId = 'student-other';

  const result = await activate();

  expect(result.code).toBe(409);
  expect(result.body).toMatchObject({ code: 'payment_link_conflict' });
  expect(mockDb.$transaction).not.toHaveBeenCalled();
  expect(mockDb.application.updateMany).not.toHaveBeenCalled();
  expect(mockDb.student.create).not.toHaveBeenCalled();
  expect(mockDb.parentAccount.create).not.toHaveBeenCalled();
  expect(mockDb.applicationEvent.create).not.toHaveBeenCalled();
  expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
  expect(mockDb.emailLog.create).not.toHaveBeenCalled();
});

test('activation transaction refuses to record activation unless every receipt subscription links to the new student', async () => {
  const unlinkedReceipt = [{ id: 'subscription-1', studentId: null, status: 'active' }];
  mockDb.subscription.findMany
    .mockResolvedValueOnce(unlinkedReceipt)
    .mockResolvedValueOnce(unlinkedReceipt)
    .mockResolvedValueOnce(unlinkedReceipt);
  mockDb.subscription.updateMany.mockResolvedValue({ count: 0 });

  const result = await activate();

  expect(result.code).toBe(409);
  expect(result.body).toMatchObject({ code: 'payment_link_conflict' });
  expect(mockDb.applicationEvent.create).not.toHaveBeenCalled();
  expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
  expect(mockDb.emailLog.create).not.toHaveBeenCalled();
});

test('retry returns the existing account without creating duplicates or exposing old passwords', async () => {
  mockDb.application.findUnique.mockResolvedValue({ ...approvedApplication, accountsCreated: true });
  mockDb.applicationEvent.findFirst.mockResolvedValue({ metadata: { studentId: 'student-1' } });
  mockDb.student.findUnique.mockResolvedValue({
    ...createdStudent,
    parentAccounts: [{ email: 'parent.synthetic.student@genesisideas.school' }],
  });

  const result = await activate();

  expect(result.code).toBe(200);
  expect(result.body).toMatchObject({
    ok: true,
    alreadyActivated: true,
    credentialsAvailable: false,
    courseSetupPending: true,
  });
  expect(result.body).not.toHaveProperty('parentPassword');
  expect(result.body).not.toHaveProperty('studentPassword');
  expect(mockDb.$transaction).not.toHaveBeenCalled();
  expect(mockDb.student.create).not.toHaveBeenCalled();
  expect(mockDb.parentAccount.create).not.toHaveBeenCalled();
  expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
});

test('a concurrent activation claim returns the committed account without duplicate writes', async () => {
  mockDb.application.findUnique
    .mockResolvedValueOnce(approvedApplication)
    .mockResolvedValueOnce({ accountsCreated: true });
  mockDb.application.updateMany.mockResolvedValue({ count: 0 });
  mockDb.applicationEvent.findFirst.mockResolvedValue({ metadata: { studentId: 'student-1' } });
  mockDb.student.findUnique.mockResolvedValue({
    ...createdStudent,
    parentAccounts: [{ email: 'parent.synthetic.student@genesisideas.school' }],
  });

  const result = await activate();

  expect(result.code).toBe(200);
  expect(result.body).toMatchObject({ alreadyActivated: true, credentialsAvailable: false });
  expect(mockDb.student.create).not.toHaveBeenCalled();
  expect(mockDb.parentAccount.create).not.toHaveBeenCalled();
  expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
});

test('a parent-account failure aborts before activation event or welcome delivery', async () => {
  mockDb.parentAccount.create.mockRejectedValue(new Error('synthetic parent account failure'));

  await expect(activate()).rejects.toThrow('synthetic parent account failure');

  expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
  expect(mockDb.application.updateMany).toHaveBeenCalledTimes(1);
  expect(mockDb.student.create).toHaveBeenCalledTimes(1);
  expect(mockDb.applicationEvent.create).not.toHaveBeenCalled();
  expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
  expect(mockDb.emailLog.create).not.toHaveBeenCalled();
});

test('activation never creates course enrollments', async () => {
  const result = await activate();
  expect(result.code).toBe(200);
  expect(result.body.courseSetupPending).toBe(true);
  expect(mockDb.enrollment.create).not.toHaveBeenCalled();
  expect(mockDb.enrollment.createMany).not.toHaveBeenCalled();
  expect(mockDb.enrollment.upsert).not.toHaveBeenCalled();
  expect(mockDb.student.create.mock.calls[0][0].data).not.toHaveProperty('enrollments');
});

test('welcome delivery failure does not turn a committed activation into an unsafe retry', async () => {
  mockSendWelcomeEmail.mockRejectedValue(new Error('synthetic mail outage'));

  const result = await activate();

  expect(result.code).toBe(200);
  expect(result.body).toMatchObject({
    ok: true,
    credentialsAvailable: true,
    courseSetupPending: true,
  });
  expect(mockDb.emailLog.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      kind: 'welcome_parent_login',
      status: 'error',
      error: 'synthetic mail outage',
    }),
  });
});
