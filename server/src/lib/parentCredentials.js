const DEFAULT_PARENT_PASSWORD = 'Parent2024!';

function parentLoginEmailForStudentEmail(studentEmail) {
  const email = String(studentEmail || '').trim().toLowerCase();
  const match = email.match(/^([^@\s]+)@([^@\s]+\.[^@\s]+)$/);
  if (!match) return null;
  return `${match[1]}_parent@${match[2]}`;
}

module.exports = {
  DEFAULT_PARENT_PASSWORD,
  parentLoginEmailForStudentEmail,
};
