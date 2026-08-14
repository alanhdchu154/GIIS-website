const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const TOKEN_PURPOSE = 'enrollment_verification';
const TOKEN_ISSUER = 'giis-transcript-api';
const TOKEN_AUDIENCE = 'giis-enrollment-verification';
const MAX_VALID_DAYS = 90;

function dateOnly(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function addCalendarDays(value, days) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function currentPaymentCoverage(student, issueDate) {
  const eligible = [];

  if (student?.paidThroughDate) {
    const paidThrough = dateOnly(student.paidThroughDate);
    if (paidThrough && paidThrough >= issueDate) {
      eligible.push({ source: 'manual', through: paidThrough });
    }
  }

  eligible.push(...(student?.subscriptions || [])
    .filter((subscription) => ['active', 'trialing'].includes(subscription.status))
    .map((subscription) => dateOnly(subscription.currentPeriodEnd))
    .filter((through) => through && through >= issueDate)
    .map((through) => ({ source: 'stripe', through })));

  return eligible.sort((left, right) => left.through.localeCompare(right.through)).at(-1) || null;
}

function computeGradeLevel(graduationDate, issueDate) {
  const graduation = dateOnly(graduationDate);
  if (!graduation) return null;
  const graduationYear = Number(graduation.slice(0, 4));
  const issueYear = Number(issueDate.slice(0, 4));
  const issueMonth = Number(issueDate.slice(5, 7));
  const schoolYearEnd = issueMonth >= 9 ? issueYear + 1 : issueYear;
  const grade = 12 - (graduationYear - schoolYearEnd);
  return grade >= 9 && grade <= 12 ? grade : null;
}

function evaluateEnrollmentEligibility(student, issueDate) {
  const reasons = [];
  if (!student || !String(student.name || '').trim()) reasons.push('legal_name_missing');
  if (!student || !String(student.studentCode || '').trim()) reasons.push('student_id_missing');
  if (!student?.account?.isActive) reasons.push('account_inactive');
  if (student?.account?.softLocked) reasons.push('account_restricted');

  const entryDate = dateOnly(student?.entryDate);
  if (!entryDate) reasons.push('entry_date_missing');
  else if (entryDate > issueDate) reasons.push('enrollment_not_started');

  const withdrawalDate = dateOnly(student?.withdrawalDate);
  if (withdrawalDate && withdrawalDate <= issueDate) reasons.push('student_withdrawn');

  const graduationDate = dateOnly(student?.graduationDate);
  if (graduationDate && graduationDate <= issueDate) reasons.push('student_graduated');

  const payment = currentPaymentCoverage(student, issueDate);
  if (!payment) reasons.push('payment_not_current');

  const validThrough = payment
    ? [addCalendarDays(issueDate, MAX_VALID_DAYS), payment.through].sort()[0]
    : null;

  return {
    eligible: reasons.length === 0,
    reasons,
    entryDate,
    gradeLevel: computeGradeLevel(student?.graduationDate, issueDate),
    paymentCoverageThrough: payment?.through || null,
    validThrough,
  };
}

function createDocumentId(issueDate) {
  const suffix = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `GIIS-EV-${issueDate.slice(0, 4)}-${suffix}`;
}

function createRecordHash({ studentId, studentName, studentCode, secret }) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${studentId}\n${String(studentName || '').trim()}\n${String(studentCode || '').trim()}`)
    .digest('hex');
}

function issueEnrollmentToken({
  studentId,
  studentName,
  studentCode,
  entryDate,
  gradeLevel,
  issuedOn,
  validThrough,
  secret,
  documentId = createDocumentId(issuedOn),
}) {
  if (!secret) throw new Error('JWT secret is required');
  const issuedAt = Math.floor(new Date(`${issuedOn}T00:00:00.000Z`).getTime() / 1000);
  // Keep the JWT cryptographically usable through the complete school-local
  // valid-through date. The verifier below still makes the authoritative
  // school-date comparison, so UTC midnight cannot expire it several hours early.
  const expiresAt = Math.floor(new Date(`${addCalendarDays(validThrough, 1)}T12:00:00.000Z`).getTime() / 1000);
  const recordHash = createRecordHash({ studentId, studentName, studentCode, secret });
  const token = jwt.sign({
    purpose: TOKEN_PURPOSE,
    documentId,
    studentId,
    issuedOn,
    validThrough,
    entryDate,
    gradeLevel: gradeLevel || null,
    recordHash,
    iat: issuedAt,
    exp: expiresAt,
    iss: TOKEN_ISSUER,
    aud: TOKEN_AUDIENCE,
  }, secret, { algorithm: 'HS256', noTimestamp: true });

  return { token, documentId, recordHash };
}

function verifyEnrollmentToken(token, secret, now = new Date(), currentDate = dateOnly(now)) {
  if (!secret) throw new Error('JWT secret is required');
  const payload = jwt.verify(token, secret, {
    algorithms: ['HS256'],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    ignoreExpiration: true,
  });
  if (payload.purpose !== TOKEN_PURPOSE || !payload.studentId || !payload.documentId) {
    throw new Error('Invalid enrollment verification token');
  }
  return {
    payload,
    expired: !payload.exp || !payload.validThrough || payload.validThrough < currentDate,
  };
}

module.exports = {
  MAX_VALID_DAYS,
  TOKEN_PURPOSE,
  addCalendarDays,
  computeGradeLevel,
  createDocumentId,
  createRecordHash,
  currentPaymentCoverage,
  dateOnly,
  evaluateEnrollmentEligibility,
  issueEnrollmentToken,
  verifyEnrollmentToken,
};
