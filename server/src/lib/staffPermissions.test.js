const { STAFF_ROLES, hasPermission } = require('./staffPermissions');

test('unknown roles and permissions fail closed', () => {
  expect(hasPermission('future_role', 'applications.read')).toBe(false);
  expect(hasPermission('principal', 'future.permission')).toBe(false);
  expect(hasPermission('', 'applications.read')).toBe(false);
});

test('Principal has only application-read and academic-sign permissions', () => {
  expect(hasPermission('principal', 'applications.read')).toBe(true);
  expect(hasPermission('principal', 'academic.principal_sign')).toBe(true);
  for (const denied of [
    'staff.manage', 'finance.read', 'finance.write', 'students.write',
    'courses.write', 'enrollments.write', 'email.read', 'email.send',
    'graduation.read', 'graduation.send', 'applications.manage',
  ]) expect(hasPermission('principal', denied)).toBe(false);
});

test('role catalog is explicit and owner is the sole wildcard role', () => {
  expect(STAFF_ROLES).toEqual(['owner', 'principal', 'academic_staff', 'admissions_staff', 'support_read_only']);
  expect(hasPermission('owner', 'staff.manage')).toBe(true);
  expect(hasPermission('support_read_only', 'applications.read')).toBe(false);
});
