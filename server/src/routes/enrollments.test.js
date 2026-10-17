const mockPrisma = {
  student: { findUnique: jest.fn() },
  course: { findUnique: jest.fn() },
  enrollment: { create: jest.fn(), findUnique: jest.fn() },
};

jest.mock('../lib/prisma', () => mockPrisma);
jest.mock('../middleware/auth', () => ({
  authenticate(req, _res, next) {
    req.auth = req.testAuth || { role: 'student', studentId: 'student-fixture' };
    next();
  },
  requireAdmin(req, res, next) {
    if (req.auth?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  },
  blockIfSoftLocked(_req, _res, next) { next(); },
}));
jest.mock('../lib/studentArchive', () => ({
  ensureStudentMutable: jest.fn(async (_prisma, studentId) => ({ id: studentId })),
  ensureEnrollmentStudentMutable: jest.fn(),
}));

const enrollmentRoutes = require('./enrollments');

function resDouble() {
  return {
    code: 200,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function invoke(method, route, req = {}) {
  const layer = enrollmentRoutes.stack.find((item) => item.route?.path === route && item.route.methods[method]);
  if (!layer) throw Error(`Missing route ${method} ${route}`);
  const request = { headers: {}, cookies: {}, body: {}, params: {}, ...req };
  const res = resDouble();
  for (const item of layer.route.stack) {
    let advance = false;
    await item.handle(request, res, (error) => {
      if (error) throw error;
      advance = true;
    });
    if (!advance) break;
  }
  return { req: request, res };
}

beforeEach(() => jest.clearAllMocks());

test('student self-enrollment is rejected before any enrollment or course lookup', async () => {
  const result = await invoke('post', '/', { body: { slug: 'algebra-i' } });

  expect(result.res.code).toBe(403);
  expect(result.res.body).toEqual(expect.objectContaining({
    code: 'staff_assignment_required',
    error: expect.stringMatching(/assigned by GIIS staff/i),
  }));
  expect(mockPrisma.course.findUnique).not.toHaveBeenCalled();
  expect(mockPrisma.enrollment.create).not.toHaveBeenCalled();
});

test('staff-owned assignment route remains available to an authenticated admin', async () => {
  mockPrisma.course.findUnique.mockResolvedValue({ id: 'course-fixture' });
  mockPrisma.enrollment.create.mockResolvedValue({
    id: 'enrollment-fixture',
    studentId: 'student-fixture',
    courseId: 'course-fixture',
  });

  const result = await invoke('post', '/admin/student/:studentId', {
    testAuth: { role: 'admin', adminId: 'admin-fixture' },
    params: { studentId: 'student-fixture' },
    body: { slug: 'algebra-i', semesterLabel: 'Grade 9 - Fall Semester' },
  });

  expect(result.res.code).toBe(201);
  expect(mockPrisma.enrollment.create).toHaveBeenCalledWith(expect.objectContaining({
    data: {
      studentId: 'student-fixture',
      courseId: 'course-fixture',
      semesterLabel: 'Grade 9 - Fall Semester',
    },
  }));
});
