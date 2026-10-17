const mockDb = {
  assignmentSubmission: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  moduleProgress: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => mockDb);
jest.mock('../middleware/auth', () => {
  const { hasPermission } = require('../lib/staffPermissions');
  return {
    authenticate: (_req, _res, next) => next(),
    requirePermission: (permission) => (req, res, next) => (
      hasPermission(req.staff?.role, permission)
        ? next()
        : res.status(403).json({ error: 'Permission denied', code: 'permission_denied', permission })
    ),
  };
});

const router = require('./admin-assignments');

function response() {
  return {
    code: 200,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function invoke(method, path, { role = 'owner', ...request } = {}) {
  const layer = router.stack.find((item) => item.route?.path === path && item.route.methods[method]);
  if (!layer) throw new Error(`Missing route ${method} ${path}`);
  const req = {
    params: {},
    query: {},
    body: {},
    auth: { role: 'admin', adminId: 'staff-1' },
    staff: { id: 'staff-1', role },
    ...request,
  };
  const res = response();
  for (const handler of layer.route.stack) {
    let next = false;
    await handler.handle(req, res, (error) => { if (error) throw error; next = true; });
    if (!next) break;
  }
  return res;
}

const pendingSubmission = {
  id: 'submission-1',
  submittedAt: new Date('2026-10-17T12:00:00Z'),
  content: 'A synthetic response.',
  moduleOrder: 1,
  feedback: '',
  score: null,
  gradedAt: null,
  enrollmentId: 'enrollment-1',
  enrollment: {
    student: { id: 'student-1', name: 'Synthetic Student', studentCode: 'SYN-1' },
    course: {
      name: 'English I',
      slug: 'english-i',
      modules: [{ order: 1, title: 'Reading Comprehension Strategies', assignment: 'Write one paragraph.' }],
    },
  },
};

beforeEach(() => {
  jest.resetAllMocks();
  mockDb.assignmentSubmission.findMany.mockResolvedValue([pendingSubmission]);
  mockDb.assignmentSubmission.findUnique.mockResolvedValue(pendingSubmission);
  mockDb.assignmentSubmission.update.mockImplementation(async ({ data }) => ({
    ...pendingSubmission,
    ...data,
  }));
  mockDb.moduleProgress.findUnique.mockResolvedValue(null);
  mockDb.moduleProgress.upsert.mockResolvedValue({});
});

test.each(['owner', 'academic_staff'])('%s can read pending and historical assignment queues', async (role) => {
  expect((await invoke('get', '/pending', { role })).code).toBe(200);
  expect((await invoke('get', '/', { role })).code).toBe(200);
  expect(mockDb.assignmentSubmission.findMany).toHaveBeenCalledTimes(2);
});

test.each(['owner', 'academic_staff'])('%s can grade an assignment with family-visible feedback', async (role) => {
  const result = await invoke('patch', '/:id', {
    role,
    params: { id: 'submission-1' },
    body: { score: 84, feedback: 'Clear claim. Add one quotation and explain how it supports the claim.' },
  });
  expect(result.code).toBe(200);
  expect(mockDb.assignmentSubmission.update).toHaveBeenCalledWith({
    where: { id: 'submission-1' },
    data: expect.objectContaining({ score: 84, gradedById: 'staff-1', gradedAt: expect.any(Date) }),
  });
});

test.each(['admissions_staff', 'support_read_only', 'principal'])('%s cannot read or grade assignments', async (role) => {
  expect((await invoke('get', '/pending', { role })).code).toBe(403);
  expect((await invoke('get', '/', { role })).code).toBe(403);
  expect((await invoke('patch', '/:id', {
    role,
    params: { id: 'submission-1' },
    body: { score: 84, feedback: 'Should not be accepted.' },
  })).code).toBe(403);
  expect(mockDb.assignmentSubmission.findMany).not.toHaveBeenCalled();
  expect(mockDb.assignmentSubmission.findUnique).not.toHaveBeenCalled();
  expect(mockDb.assignmentSubmission.update).not.toHaveBeenCalled();
});
