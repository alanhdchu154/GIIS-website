const DEFAULT_PARENT_PASSWORD = 'Parent2024!';
const DEFAULT_STUDENT_PASSWORD = 'Student2024!!';

function parentLoginEmailForStudentEmail(studentEmail) {
  const email = String(studentEmail || '').trim().toLowerCase();
  const match = email.match(/^([^@\s]+)@([^@\s]+\.[^@\s]+)$/);
  if (!match) return null;
  return `${match[1]}_parent@${match[2]}`;
}

function studentLoginEmailForName(studentName, domain = 'genesisideas.school') {
  const local = String(studentName || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.');
  if (!local) return null;
  return `${local}@${domain}`;
}

module.exports = {
  DEFAULT_PARENT_PASSWORD,
  DEFAULT_STUDENT_PASSWORD,
  parentLoginEmailForStudentEmail,
  studentLoginEmailForName,
};
