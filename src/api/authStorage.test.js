beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.resetModules();
});

test('getAdminSession keeps a stable reference until sessionStorage changes', () => {
  const { getAdminSession } = require('./authStorage');
  sessionStorage.setItem('giis_admin_session', JSON.stringify({ id: 'admin-1', email: 'one@example.com' }));

  const first = getAdminSession();
  const second = getAdminSession();

  expect(second).toBe(first);
  expect(first).toEqual({ id: 'admin-1', email: 'one@example.com' });

  sessionStorage.setItem('giis_admin_session', JSON.stringify({ id: 'admin-2', email: 'two@example.com' }));
  const changed = getAdminSession();

  expect(changed).not.toBe(first);
  expect(changed).toEqual({ id: 'admin-2', email: 'two@example.com' });
});

test('getParentSession keeps a stable reference until localStorage changes', () => {
  const { getParentSession } = require('./authStorage');
  localStorage.setItem('giis_parent_info', JSON.stringify({ studentId: 'student-1', email: 'parent@example.com' }));

  const first = getParentSession();
  const second = getParentSession();

  expect(second).toBe(first);
  expect(first).toEqual({ studentId: 'student-1', email: 'parent@example.com' });

  localStorage.setItem('giis_parent_info', JSON.stringify({ studentId: 'student-2', email: 'parent@example.com' }));
  const changed = getParentSession();

  expect(changed).not.toBe(first);
  expect(changed).toEqual({ studentId: 'student-2', email: 'parent@example.com' });
});

test('getStudentSession keeps a stable reference until token or student info changes', () => {
  const { getStudentSession } = require('./authStorage');
  localStorage.setItem('giis_student_token', 'token-1');
  localStorage.setItem('giis_student_info', JSON.stringify({ id: 'student-1', email: 'student@example.com', name: 'Student One' }));

  const first = getStudentSession();
  const second = getStudentSession();

  expect(second).toBe(first);
  expect(first).toEqual({
    token: 'token-1',
    student: { id: 'student-1', email: 'student@example.com', name: 'Student One' },
  });

  localStorage.setItem('giis_student_token', 'token-2');
  const changedToken = getStudentSession();

  expect(changedToken).not.toBe(first);
  expect(changedToken).toEqual({
    token: 'token-2',
    student: { id: 'student-1', email: 'student@example.com', name: 'Student One' },
  });

  localStorage.setItem('giis_student_info', JSON.stringify({ id: 'student-2', email: 'student@example.com', name: 'Student Two' }));
  const changedStudent = getStudentSession();

  expect(changedStudent).not.toBe(changedToken);
  expect(changedStudent).toEqual({
    token: 'token-2',
    student: { id: 'student-2', email: 'student@example.com', name: 'Student Two' },
  });
});
