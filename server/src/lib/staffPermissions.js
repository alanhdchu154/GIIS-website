const STAFF_ROLES = Object.freeze([
  'owner',
  'principal',
  'academic_staff',
  'admissions_staff',
  'support_read_only',
]);

// Intentionally small allow-list. A new route or role has no authority until a
// permission is named here and attached to the route.
const ROLE_PERMISSIONS = Object.freeze({
  owner: new Set(['*']),
  principal: new Set([
    'applications.read',
    'academic.principal_sign',
  ]),
  academic_staff: new Set([
    'applications.read',
    'academic.review_draft',
    'assignments.read',
    'assignments.grade',
    'students.read',
  ]),
  admissions_staff: new Set([
    'applications.read',
    'applications.manage',
  ]),
  support_read_only: new Set([]),
});

function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

function hasPermission(role, permission) {
  if (!isStaffRole(role) || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.has('*') || permissions.has(permission);
}

module.exports = { STAFF_ROLES, ROLE_PERMISSIONS, isStaffRole, hasPermission };
