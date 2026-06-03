function dateOnly(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function isArchivedGraduationDate(graduationDate, referenceDate = new Date()) {
  const graduation = dateOnly(graduationDate);
  if (!graduation) return false;
  const today = dateOnly(referenceDate);
  return graduation <= today;
}

function sendArchivedResponse(res, graduationDate) {
  return res.status(423).json({
    error: 'Student record is archived after graduation and cannot be modified.',
    code: 'student_archived',
    graduationDate: dateOnly(graduationDate),
  });
}

async function ensureStudentMutable(prisma, studentId, res) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, graduationDate: true },
  });
  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return null;
  }
  if (isArchivedGraduationDate(student.graduationDate)) {
    sendArchivedResponse(res, student.graduationDate);
    return null;
  }
  return student;
}

async function ensureEnrollmentStudentMutable(prisma, enrollmentId, res) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      studentId: true,
      student: { select: { graduationDate: true } },
    },
  });
  if (!enrollment) {
    res.status(404).json({ error: 'Enrollment not found' });
    return null;
  }
  if (isArchivedGraduationDate(enrollment.student?.graduationDate)) {
    sendArchivedResponse(res, enrollment.student.graduationDate);
    return null;
  }
  return enrollment;
}

module.exports = {
  dateOnly,
  isArchivedGraduationDate,
  ensureStudentMutable,
  ensureEnrollmentStudentMutable,
  sendArchivedResponse,
};
