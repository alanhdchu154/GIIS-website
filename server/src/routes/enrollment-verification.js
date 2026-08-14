const express = require('express');
const { authenticate } = require('../middleware/auth');
const { schoolDateOnly } = require('../lib/schoolDate');
const {
  createRecordHash,
  evaluateEnrollmentEligibility,
  issueEnrollmentToken,
  verifyEnrollmentToken,
} = require('../lib/enrollmentVerification');

const prisma = require('../lib/prisma');
const router = express.Router();

const SCHOOL = Object.freeze({
  name: 'Genesis of Ideas International School',
  address: '7901 4th St N STE 300, St. Petersburg, FL 33702, USA',
  phone: '+1 (813) 501-5756',
  email: 'admissions@genesisideas.school',
  website: 'https://genesisideas.school',
  registration: 'Florida-registered private school | Florida Statute 1002.42',
  principalName: 'Shiyu Zhang, Ph.D.',
  principalTitle: 'President & Principal',
});

const STUDENT_INCLUDE = {
  account: { select: { isActive: true, softLocked: true } },
  subscriptions: { select: { status: true, currentPeriodEnd: true } },
};

function requestedStudentId(req) {
  const requested = String(req.params.studentId || '').trim();
  if (req.auth?.role === 'admin') return requested || null;
  if (req.auth?.role === 'student') {
    if (requested && requested !== req.auth.studentId) return false;
    return req.auth.studentId;
  }
  return false;
}

function frontendBaseUrl() {
  return String(process.env.CORS_ORIGIN || 'https://genesisideas.school')
    .split(',')[0]
    .trim()
    .replace(/\/$/, '');
}

function documentData(student, issueDate, eligibility, issued = {}) {
  return {
    documentType: 'enrollment_verification',
    documentId: issued.documentId || null,
    issuedOn: issueDate,
    validThrough: eligibility.validThrough,
    studentName: String(student.name || '').trim(),
    studentCode: String(student.studentCode || '').trim(),
    gradeLevel: eligibility.gradeLevel,
    entryDate: eligibility.entryDate,
    enrollmentMode: 'Online secondary school',
    verificationUrl: issued.token
      ? `${frontendBaseUrl()}/verify/enrollment/${encodeURIComponent(issued.token)}`
      : null,
    school: SCHOOL,
  };
}

function eligibilityMessage(reasons) {
  const messages = {
    legal_name_missing: 'The legal student name is missing.',
    student_id_missing: 'A school-issued Student ID is required.',
    account_inactive: 'The student account is not active.',
    account_restricted: 'The student account is currently restricted.',
    entry_date_missing: 'The official entry date has not been recorded.',
    enrollment_not_started: 'The official entry date has not arrived.',
    student_withdrawn: 'The student is no longer enrolled.',
    student_graduated: 'The student has already graduated.',
    payment_not_current: 'Current payment coverage could not be verified.',
  };
  return reasons.map((reason) => messages[reason] || 'Enrollment status could not be verified.');
}

function publicVerificationStatus({ expired, identityCurrent, enrollmentCurrent }) {
  if (expired) return 'expired';
  return identityCurrent && enrollmentCurrent ? 'valid' : 'no-longer-current';
}

async function loadStudent(studentId) {
  return prisma.student.findUnique({
    where: { id: studentId },
    include: STUDENT_INCLUDE,
  });
}

async function resolveAuthenticatedStudent(req, res) {
  const studentId = requestedStudentId(req);
  if (studentId === false) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  if (!studentId) {
    res.status(400).json({ error: 'Student ID is required for an administrator.' });
    return null;
  }
  const student = await loadStudent(studentId);
  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return null;
  }
  return student;
}

router.get('/status/:studentId?', authenticate, async (req, res) => {
  try {
    const student = await resolveAuthenticatedStudent(req, res);
    if (!student) return;
    const issueDate = schoolDateOnly();
    const eligibility = evaluateEnrollmentEligibility(student, issueDate);
    return res.json({
      eligible: eligibility.eligible,
      reasons: eligibility.reasons,
      messages: eligibilityMessage(eligibility.reasons),
      document: eligibility.eligible ? documentData(student, issueDate, eligibility) : null,
    });
  } catch (error) {
    console.error('[enrollment-verification status]', error.message);
    return res.status(503).json({ error: 'Enrollment status could not be verified. Please try again.' });
  }
});

router.post('/issue/:studentId?', authenticate, async (req, res) => {
  try {
    const student = await resolveAuthenticatedStudent(req, res);
    if (!student) return;
    const issueDate = schoolDateOnly();
    const eligibility = evaluateEnrollmentEligibility(student, issueDate);
    if (!eligibility.eligible) {
      return res.status(409).json({
        error: 'Enrollment verification is not available.',
        code: 'enrollment_verification_not_eligible',
        reasons: eligibility.reasons,
        messages: eligibilityMessage(eligibility.reasons),
      });
    }

    const issued = issueEnrollmentToken({
      studentId: student.id,
      studentName: student.name,
      studentCode: student.studentCode,
      entryDate: eligibility.entryDate,
      gradeLevel: eligibility.gradeLevel,
      issuedOn: issueDate,
      validThrough: eligibility.validThrough,
      secret: process.env.JWT_SECRET,
    });

    await prisma.auditLog.create({
      data: {
        action: `enrollment_verification_issued:${issued.documentId}`,
        studentId: student.id,
        actorRole: req.auth.role,
        actorEmail: req.auth.email || 'unknown',
      },
    });

    return res.status(201).json({
      document: documentData(student, issueDate, eligibility, issued),
    });
  } catch (error) {
    console.error('[enrollment-verification issue]', error.message);
    return res.status(503).json({ error: 'Enrollment verification could not be issued. Please try again.' });
  }
});

router.get('/verify/:token', async (req, res) => {
  try {
    const currentSchoolDate = schoolDateOnly();
    const { payload, expired } = verifyEnrollmentToken(
      String(req.params.token || ''),
      process.env.JWT_SECRET,
      new Date(),
      currentSchoolDate
    );
    const student = await loadStudent(payload.studentId);
    if (!student) return res.status(404).json({ error: 'Document could not be verified.' });

    const identityCurrent = createRecordHash({
      studentId: student.id,
      studentName: student.name,
      studentCode: student.studentCode,
      secret: process.env.JWT_SECRET,
    }) === payload.recordHash;
    const currentEligibility = evaluateEnrollmentEligibility(student, currentSchoolDate);
    const status = publicVerificationStatus({
      expired,
      identityCurrent,
      enrollmentCurrent: currentEligibility.eligible,
    });

    return res.json({
      documentType: 'enrollment_verification',
      documentId: payload.documentId,
      issuedOn: payload.issuedOn,
      validThrough: payload.validThrough,
      status,
      current: status === 'valid',
      studentName: identityCurrent ? student.name : null,
      studentCode: identityCurrent ? student.studentCode : null,
      entryDate: payload.entryDate || null,
      gradeLevel: payload.gradeLevel || null,
      schoolName: SCHOOL.name,
    });
  } catch {
    return res.status(404).json({ error: 'Document could not be verified.' });
  }
});

module.exports = router;
module.exports.documentData = documentData;
module.exports.eligibilityMessage = eligibilityMessage;
module.exports.publicVerificationStatus = publicVerificationStatus;
module.exports.requestedStudentId = requestedStudentId;
