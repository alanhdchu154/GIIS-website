const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  sendApplicationInterestConfirmation,
  sendNewApplicationAlert,
  sendWelcomeEmail,
} = require('../lib/mailer');
const {
  parentLoginEmailForStudentEmail,
  studentLoginEmailForName,
} = require('../lib/parentCredentials');

const prisma = require('../lib/prisma');
const router = express.Router();

const APPLICANT_TYPES = new Set(['new', 'transfer']);
const COMMUNICATION_LANGUAGES = new Set(['en', 'zh', 'bilingual']);
const PREVIOUS_CREDIT_RANGES = new Set(['0-5', '6-11', '12-17', '18-23', '24+']);
const TRANSCRIPT_OPTIONS = new Set(['yes', 'partial', 'not-yet']);
const GRADUATION_TIMINGS = new Set(['asap', '1-year', '2-years', 'not-sure']);
const TRANSFER_GRADUATION_TIMINGS = new Set(['normal-pace', 'accelerated', 'target-date', 'not-sure']);
const CURRENT_ENROLLMENT_STATUSES = new Set(['preparing-to-enroll', 'currently-enrolled', 'left-prior-school', 'other']);
const RECORDS_SITUATIONS = new Set(['official-transcript', 'partial-records', 'no-official-transcript', 'homeschool-no-traditional', 'not-sure']);
const RECORDS_HELP_OPTIONS = new Set(['records-in-hand', 'already-requested', 'can-request', 'need-giis-help', 'not-sure-how']);
const RECORDS_ETA_OPTIONS = new Set(['available-now', '3-business-days', '7-business-days', '14-business-days', 'uncertain']);
const PARENT_RELATIONSHIPS = new Set(['parent', 'legal-guardian', 'self', 'other']);
const CONTACT_PREFERENCES = new Set(['email', 'phone']);
const MAIN_CONCERNS = new Set(['grade9-path', 'credits', 'graduation', 'records', 'motivation']);
const INTENDED_START_TIMINGS = new Set(['within-30-days', 'next-semester', 'next-school-year', 'exploring']);
const RECORDS_STATUSES = new Set(['not_requested', 'requested', 'partial', 'received', 'verified']);
const TRANSFER_RECORD_TYPES = new Set(['official_transcript', 'report_card', 'homeschool', 'international', 'other']);
const TRANSFER_EVIDENCE_LEVELS = new Set(['A', 'B', 'C', 'D']);
const TRANSFER_MAPPED_AREAS = new Set(['english', 'math', 'science', 'social_studies', 'pe_health', 'elective', 'other']);
const TRANSFER_DECISIONS = new Set(['credit_and_gpa', 'credit_only', 'conditional', 'rejected', 'deferred']);
const TRANSFER_WEIGHTING = new Set(['none', 'ap_equivalent', 'advanced']);
const TRANSFER_VALIDATIONS = new Set(['none', 'first_term', 'portfolio', 'assessment', 'school_verification', 'other']);
const DUPLICATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const INTEREST_CONFIRMATION_TTL_MS = 72 * 60 * 60 * 1000;
const PUBLIC_SITE = process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'https://genesisideas.school';
const schoolWeekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: process.env.SCHOOL_TIME_ZONE || 'America/Chicago',
  weekday: 'short',
});
const TRANSFER_EVALUATION_INCLUDE = {
  courses: { orderBy: { sortOrder: 'asc' } },
};
const APPLICATION_INCLUDE = {
  transferEvaluation: { include: TRANSFER_EVALUATION_INCLUDE },
  events: { orderBy: { createdAt: 'desc' }, take: 30 },
};

const MANUAL_PAYMENT_PLANS = {
  self_paced_monthly: { label: 'Self-Paced Founders', amountCents: 4900, months: 1 },
  self_paced_annual: { label: 'Self-Paced Founders Annual', amountCents: 49900, months: 12 },
  guided_monthly: { label: 'Guided', amountCents: 14900, months: 1 },
  premium_monthly: { label: 'Premium / College Pathway', amountCents: 29900, months: 1 },
};

const MANUAL_PAYMENT_METHODS = new Set([
  'manual_stripe_invoice',
  'manual_stripe_payment_link',
  'stripe_dashboard_invoice',
  'stripe_dashboard_payment_link',
]);

async function recordEmailLog({ kind, recipient, studentId, result }) {
  await prisma.emailLog.create({
    data: {
      kind,
      recipient,
      studentId: studentId || null,
      providerId: result?.id || null,
      status: result?.ok ? 'sent' : (result?.skipped ? 'skipped' : 'error'),
      error: result?.error || result?.reason || '',
    },
  }).catch(() => null);
}

async function uniqueStudentLoginEmail(studentName) {
  const base = studentLoginEmailForName(studentName);
  if (!base) return null;
  const [local, domain] = base.split('@');
  for (let i = 0; i < 50; i += 1) {
    const email = i === 0 ? base : `${local}.${i + 1}@${domain}`;
    const existing = await prisma.studentAccount.findUnique({ where: { email } });
    if (!existing) return email;
  }
  return `${local}.${crypto.randomBytes(2).toString('hex')}@${domain}`;
}

function tempPassword(prefix) {
  return `${prefix}-${crypto.randomBytes(9).toString('base64url')}`;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function money(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function normalizeReference(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 120);
}

function manualCheckoutSessionId(reference) {
  return `manual:${reference}`;
}

function appendAdminNote(existing, line) {
  const clean = String(existing || '').trim();
  return clean ? `${clean}\n${line}` : line;
}

function applicationEventData(applicationId, action, actorEmail, summary, metadata) {
  return {
    applicationId,
    action,
    actorEmail: actorEmail || 'system',
    summary,
    ...(metadata ? { metadata } : {}),
  };
}

async function withTransaction(prismaClient, callback) {
  if (typeof prismaClient.$transaction === 'function') return prismaClient.$transaction(callback);
  return callback(prismaClient);
}

function cleanString(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function boundedText(value, maxLength) {
  return String(value || '').trim().replace(/\r\n/g, '\n').slice(0, maxLength);
}

function normalizePriorSchools(value) {
  let rows = value;
  if (typeof value === 'string') {
    try {
      rows = JSON.parse(value);
    } catch {
      return { ok: false, error: 'priorSchools must be a valid array' };
    }
  }
  if (!Array.isArray(rows) || rows.length > 5) {
    return { ok: false, error: 'priorSchools must contain between 1 and 5 schools' };
  }
  const schools = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return { ok: false, error: 'Each prior school must include a school name and attendance period' };
    }
    const schoolName = cleanString(row.schoolName).slice(0, 160);
    const attendancePeriod = cleanString(row.attendancePeriod).slice(0, 120);
    if (!schoolName || !attendancePeriod) {
      return { ok: false, error: 'Each prior school must include a school name and attendance period' };
    }
    schools.push({ schoolName, attendancePeriod });
  }
  return { ok: true, schools, json: JSON.stringify(schools) };
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function interestTokenHash(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function createInterestToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function confirmationUrlForToken(token, site = PUBLIC_SITE) {
  return `${String(site).replace(/\/$/, '')}/application/confirm?token=${encodeURIComponent(token)}`;
}

function nextBusinessResponseDue(value = new Date()) {
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return null;
  do {
    due.setTime(due.getTime() + 24 * 60 * 60 * 1000);
  } while (['Sat', 'Sun'].includes(schoolWeekdayFormatter.format(due)));
  return due;
}

function applicationTypeFor(app) {
  if (APPLICANT_TYPES.has(app?.applicantType)) return app.applicantType;
  const notes = String(app?.notes || '');
  if (/^Applicant Review:\s*type=transfer;/i.test(notes) || /^Transfer Path Review:/i.test(notes)) return 'transfer';
  if (/^Applicant Review:\s*type=new;/i.test(notes)) return 'new';
  return 'unknown';
}

function legacyReviewFields(notes = '') {
  const text = String(notes);
  const current = text.match(
    /^Applicant Review:\s*type=(.*?);\s*previousCredits=(.*?);\s*graduationTiming=(.*?);\s*transcriptAvailable=(.*?);\s*concern=(.*?);/s
  );
  if (current) {
    return {
      applicantType: current[1].trim(),
      previousCredits: current[2].trim(),
      graduationTiming: current[3].trim(),
      transcriptAvailable: current[4].trim(),
      mainConcern: current[5].trim(),
    };
  }
  const legacy = text.match(
    /^Transfer Path Review:\s*credits=(.*?);\s*graduationTiming=(.*?);\s*transcriptAvailable=(.*?);\s*concern=(.*?);/s
  );
  if (!legacy) return null;
  return {
    applicantType: 'transfer',
    previousCredits: legacy[1].trim(),
    graduationTiming: legacy[2].trim(),
    transcriptAvailable: legacy[3].trim(),
    mainConcern: legacy[4].trim(),
  };
}

function transferApprovalError(app) {
  if (applicationTypeFor(app) !== 'transfer') return '';
  if (app.recordsStatus !== 'verified') {
    return 'Transfer applications require verified official records before approval.';
  }
  if (!app.transferEvaluation?.principalApprovedAt) {
    return 'Transfer applications require a completed course evaluation and recorded principal approval.';
  }
  return '';
}

function hasConfirmedInterest(app) {
  // Legacy applications have no confirmation token and remain reviewable.
  // New-intake applications stay gated even when email delivery fails before
  // interestConfirmationSentAt can be recorded.
  return !!app?.interestConfirmedAt || !app?.interestConfirmationTokenHash;
}

function applicationApprovalError(app) {
  if (!hasConfirmedInterest(app)) {
    return 'Parent email interest confirmation is required before application approval.';
  }
  return transferApprovalError(app);
}

function applicationReadiness(app) {
  if (!hasConfirmedInterest(app)) {
    return { code: 'unconfirmed', label: 'Parent confirmation pending', action: 'Wait for parent email confirmation' };
  }
  if (applicationTypeFor(app) !== 'transfer') {
    return { code: 'approval_ready', label: 'Approval-ready', action: 'Complete admissions review' };
  }
  if (app.recordsStatus !== 'verified') {
    return { code: 'records_pending', label: 'Interest confirmed, records pending', action: 'Request and verify official records' };
  }
  if (!app.transferEvaluation?.courses?.length) {
    return { code: 'ready_for_academic_review', label: 'Ready for academic review', action: 'Complete course-by-course evaluation' };
  }
  if (!app.transferEvaluation.principalApprovedAt) {
    return { code: 'ready_for_principal_review', label: 'Ready for principal review', action: 'Record principal decision' };
  }
  return { code: 'approval_ready', label: 'Approval-ready', action: 'Approve application when admissions review is complete' };
}

function activationReadinessError(app, enrollmentState) {
  const approvalError = applicationApprovalError(app);
  if (approvalError) return approvalError;
  if (!enrollmentState?.paid && !enrollmentState?.paidUnlinked) {
    return 'Verified payment evidence is required before account activation.';
  }
  return '';
}

function transferEvaluationEditError(app, enrollmentState = {}) {
  if (app?.accountsCreated) {
    return 'Transfer decisions cannot be edited after account activation. Use a reviewed registrar correction.';
  }
  if (app?.status === 'approved' && (enrollmentState.paid || enrollmentState.paidUnlinked)) {
    return 'Transfer decisions cannot be edited after payment is recorded. Resolve the case through principal and registrar review.';
  }
  return '';
}

function parseApplicationSubmission(body = {}) {
  const legacy = legacyReviewFields(body.notes);
  const seriousGate = body.intakeVersion === 'serious-v1';
  const transferV2 = seriousGate && body.transferIntakeVersion === 'transfer-v2';
  const priorSchools = normalizePriorSchools(body.priorSchools || body.priorSchoolsJson || []);
  const preferredLanguage = body.preferredLanguage === 'zh' ? 'zh' : 'en';
  const submittedCommunicationLanguage = cleanString(body.communicationLanguage);
  const data = {
    studentName: cleanString(body.studentName),
    dob: cleanString(body.dob),
    gradeLevel: cleanString(body.gradeLevel),
    currentSchool: cleanString(body.currentSchool),
    targetUniversities: cleanString(body.targetUniversities),
    preferredLanguage,
    communicationLanguage: submittedCommunicationLanguage || preferredLanguage,
    applicantType: cleanString(body.applicantType || legacy?.applicantType),
    parentName: cleanString(body.parentName),
    parentEmail: cleanString(body.parentEmail).toLowerCase(),
    phone: cleanString(body.phone),
    previousCredits: cleanString(body.previousCredits || legacy?.previousCredits),
    graduationTiming: cleanString(body.graduationTiming || legacy?.graduationTiming),
    transcriptAvailable: cleanString(body.transcriptAvailable || legacy?.transcriptAvailable),
    mainConcern: cleanString(body.mainConcern || legacy?.mainConcern),
    motivation: boundedText(body.motivation, 1000),
    intendedStartTiming: cleanString(body.intendedStartTiming),
    transferCourseSummary: boundedText(body.transferCourseSummary, 1200),
    transcriptPlanDetails: boundedText(body.transcriptPlanDetails, 600),
    transcriptExpectedTiming: cleanString(body.transcriptExpectedTiming).slice(0, 120),
    currentEnrollmentStatus: cleanString(body.currentEnrollmentStatus),
    priorSchoolsJson: priorSchools.ok ? priorSchools.json : '[]',
    recordsSituation: cleanString(body.recordsSituation),
    recordsHelpNeeded: cleanString(body.recordsHelpNeeded),
    graduationTargetDate: cleanString(body.graduationTargetDate).slice(0, 10),
    parentRelationship: cleanString(body.parentRelationship),
    contactPreference: cleanString(body.contactPreference),
    transferRecordsAcknowledged: body.transferRecordsAcknowledged === true,
    tuitionAware: body.tuitionAware === true,
    noGuaranteeAcknowledged: body.noGuaranteeAcknowledged === true,
    responseCommitmentAcknowledged: body.responseCommitmentAcknowledged === true,
    notes: String(body.notes || '').trim(),
  };

  const required = [
    'studentName',
    'dob',
    'gradeLevel',
    'applicantType',
    'parentName',
    'parentEmail',
    ...(seriousGate ? [
      'motivation',
      'intendedStartTiming',
      'mainConcern',
      ...(data.applicantType === 'new' ? ['currentSchool'] : []),
    ] : []),
  ];
  const missing = required.filter((field) => !data[field]);
  if (missing.length) {
    return { ok: false, status: 400, error: `Missing fields: ${missing.join(', ')}` };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.parentEmail)) {
    return { ok: false, status: 400, error: 'Invalid parent email' };
  }
  if (!APPLICANT_TYPES.has(data.applicantType)) {
    return { ok: false, status: 400, error: 'applicantType must be new | transfer' };
  }
  if (!COMMUNICATION_LANGUAGES.has(data.communicationLanguage)) {
    return { ok: false, status: 400, error: 'communicationLanguage must be en | zh | bilingual' };
  }
  if (data.mainConcern && !MAIN_CONCERNS.has(data.mainConcern)) {
    return { ok: false, status: 400, error: 'Invalid mainConcern' };
  }
  if (seriousGate && data.motivation.length < 80) {
    return { ok: false, status: 400, error: 'motivation must be at least 80 characters' };
  }
  if (seriousGate && !INTENDED_START_TIMINGS.has(data.intendedStartTiming)) {
    return { ok: false, status: 400, error: 'Invalid intendedStartTiming' };
  }
  const missingAcknowledgments = [
    ['tuitionAware', data.tuitionAware],
    ['noGuaranteeAcknowledged', data.noGuaranteeAcknowledged],
    ['responseCommitmentAcknowledged', data.responseCommitmentAcknowledged],
  ].filter(([, acknowledged]) => !acknowledged).map(([field]) => field);
  if (seriousGate && missingAcknowledgments.length) {
    return { ok: false, status: 400, error: `Missing acknowledgments: ${missingAcknowledgments.join(', ')}` };
  }

  if (data.applicantType === 'transfer') {
    if (transferV2 && !priorSchools.ok) {
      return { ok: false, status: 400, error: priorSchools.error };
    }
    const transferMissing = transferV2
      ? [
          'currentEnrollmentStatus',
          ...(priorSchools.schools?.length ? [] : ['priorSchools']),
          'recordsSituation',
          'recordsHelpNeeded',
          'transcriptExpectedTiming',
          'graduationTiming',
          'parentRelationship',
          'contactPreference',
        ]
      : [
          'previousCredits',
          'transcriptAvailable',
          'graduationTiming',
          ...(seriousGate ? ['transferCourseSummary', 'transcriptPlanDetails', 'transcriptExpectedTiming'] : []),
        ];
    const missingTransferFields = transferMissing
      .filter((field) => !data[field]);
    if (missingTransferFields.length) {
      return { ok: false, status: 400, error: `Missing transfer fields: ${missingTransferFields.join(', ')}` };
    }
    if (data.previousCredits && !PREVIOUS_CREDIT_RANGES.has(data.previousCredits)) {
      return { ok: false, status: 400, error: 'Invalid previousCredits' };
    }
    if (data.transcriptAvailable && !TRANSCRIPT_OPTIONS.has(data.transcriptAvailable)) {
      return { ok: false, status: 400, error: 'Invalid transcriptAvailable' };
    }
    if (transferV2 && !CURRENT_ENROLLMENT_STATUSES.has(data.currentEnrollmentStatus)) {
      return { ok: false, status: 400, error: 'Invalid currentEnrollmentStatus' };
    }
    if (transferV2 && !RECORDS_SITUATIONS.has(data.recordsSituation)) {
      return { ok: false, status: 400, error: 'Invalid recordsSituation' };
    }
    if (transferV2 && !RECORDS_HELP_OPTIONS.has(data.recordsHelpNeeded)) {
      return { ok: false, status: 400, error: 'Invalid recordsHelpNeeded' };
    }
    if (transferV2 && !RECORDS_ETA_OPTIONS.has(data.transcriptExpectedTiming)) {
      return { ok: false, status: 400, error: 'Invalid transcriptExpectedTiming' };
    }
    if (transferV2 && !TRANSFER_GRADUATION_TIMINGS.has(data.graduationTiming)) {
      return { ok: false, status: 400, error: 'Invalid graduationTiming' };
    }
    if (!transferV2 && !GRADUATION_TIMINGS.has(data.graduationTiming)) {
      return { ok: false, status: 400, error: 'Invalid graduationTiming' };
    }
    if (transferV2 && !PARENT_RELATIONSHIPS.has(data.parentRelationship)) {
      return { ok: false, status: 400, error: 'Invalid parentRelationship' };
    }
    if (transferV2 && !CONTACT_PREFERENCES.has(data.contactPreference)) {
      return { ok: false, status: 400, error: 'Invalid contactPreference' };
    }
    if (transferV2 && data.contactPreference === 'phone' && !data.phone) {
      return { ok: false, status: 400, error: 'Phone is required when contactPreference is phone' };
    }
    if (transferV2 && data.graduationTiming === 'target-date' && !isIsoDate(data.graduationTargetDate)) {
      return { ok: false, status: 400, error: 'A valid graduationTargetDate is required for target-date planning' };
    }
    if (transferV2 && !data.transferRecordsAcknowledged) {
      return { ok: false, status: 400, error: 'Missing acknowledgments: transferRecordsAcknowledged' };
    }
    const usableRecordsReported = ['official-transcript', 'partial-records'].includes(data.recordsSituation);
    if (seriousGate && (!transferV2 || !usableRecordsReported) && data.transferCourseSummary.length < 20) {
      return { ok: false, status: 400, error: 'transferCourseSummary must be at least 20 characters' };
    }
    if (!transferV2 && seriousGate && data.transcriptPlanDetails.length < 10) {
      return { ok: false, status: 400, error: 'transcriptPlanDetails must be at least 10 characters' };
    }
    if (transferV2) {
      data.currentSchool = data.currentSchool || priorSchools.schools[0].schoolName;
      data.transcriptAvailable = data.recordsSituation === 'official-transcript'
        ? 'yes'
        : data.recordsSituation === 'partial-records' ? 'partial' : 'not-yet';
      if (data.graduationTiming !== 'target-date') data.graduationTargetDate = '';
    }
  } else {
    data.previousCredits = '';
    data.transcriptAvailable = '';
    data.graduationTiming = '';
    data.transferCourseSummary = '';
    data.transcriptPlanDetails = '';
    data.transcriptExpectedTiming = '';
    data.currentEnrollmentStatus = '';
    data.priorSchoolsJson = '[]';
    data.recordsSituation = '';
    data.recordsHelpNeeded = '';
    data.graduationTargetDate = '';
    data.parentRelationship = '';
    data.contactPreference = '';
    data.transferRecordsAcknowledged = false;
  }

  return { ok: true, data };
}

function parseTransferEvaluation(body = {}) {
  const data = {
    reviewer: cleanString(body.reviewer),
    priorSchool: cleanString(body.priorSchool),
    recordType: cleanString(body.recordType),
    evidenceLevel: cleanString(body.evidenceLevel).toUpperCase(),
    recommendedGradeLevel: cleanString(body.recommendedGradeLevel),
    familySummary: String(body.familySummary || '').trim(),
    validationPlan: String(body.validationPlan || '').trim(),
  };
  const required = ['reviewer', 'priorSchool', 'recordType', 'evidenceLevel', 'recommendedGradeLevel', 'familySummary'];
  const missing = required.filter((field) => !data[field]);
  if (missing.length) return { ok: false, error: `Missing evaluation fields: ${missing.join(', ')}` };
  if (!TRANSFER_RECORD_TYPES.has(data.recordType)) return { ok: false, error: 'Invalid transfer recordType' };
  if (!TRANSFER_EVIDENCE_LEVELS.has(data.evidenceLevel)) return { ok: false, error: 'Invalid transfer evidenceLevel' };
  if (!Array.isArray(body.courses) || body.courses.length === 0) {
    return { ok: false, error: 'At least one prior course is required for transfer evaluation.' };
  }
  if (body.courses.length > 80) return { ok: false, error: 'Transfer evaluation is limited to 80 course rows.' };

  const courses = [];
  for (let index = 0; index < body.courses.length; index += 1) {
    const source = body.courses[index] || {};
    const course = {
      sortOrder: index,
      originalCourseTitle: cleanString(source.originalCourseTitle),
      originalTerm: cleanString(source.originalTerm),
      originalCredits: cleanString(source.originalCredits),
      originalGrade: cleanString(source.originalGrade),
      gradingScaleReceived: source.gradingScaleReceived === true,
      mappedArea: cleanString(source.mappedArea),
      acceptedCredits: Number(source.acceptedCredits || 0),
      decision: cleanString(source.decision),
      gpaIncluded: source.gpaIncluded === true,
      weightedTreatment: cleanString(source.weightedTreatment) || 'none',
      validationRequired: cleanString(source.validationRequired) || 'none',
      rationale: String(source.rationale || '').trim(),
    };
    if (!course.originalCourseTitle) return { ok: false, error: `Course ${index + 1}: title is required.` };
    if (!TRANSFER_MAPPED_AREAS.has(course.mappedArea)) return { ok: false, error: `Course ${index + 1}: invalid mappedArea.` };
    if (!TRANSFER_DECISIONS.has(course.decision)) return { ok: false, error: `Course ${index + 1}: invalid decision.` };
    if (!Number.isFinite(course.acceptedCredits) || course.acceptedCredits < 0 || course.acceptedCredits > 5) {
      return { ok: false, error: `Course ${index + 1}: acceptedCredits must be between 0 and 5.` };
    }
    if (!TRANSFER_WEIGHTING.has(course.weightedTreatment)) return { ok: false, error: `Course ${index + 1}: invalid weightedTreatment.` };
    if (!TRANSFER_VALIDATIONS.has(course.validationRequired)) return { ok: false, error: `Course ${index + 1}: invalid validationRequired.` };
    if (course.decision === 'credit_and_gpa') {
      if (course.acceptedCredits <= 0 || !course.originalGrade || !course.gradingScaleReceived) {
        return { ok: false, error: `Course ${index + 1}: credit + GPA requires accepted credit, an original grade, and the grading scale.` };
      }
      course.gpaIncluded = true;
    } else {
      course.gpaIncluded = false;
      course.weightedTreatment = 'none';
    }
    if (course.decision === 'credit_only' && course.acceptedCredits <= 0) {
      return { ok: false, error: `Course ${index + 1}: credit-only decisions require accepted credit.` };
    }
    if (['rejected', 'deferred'].includes(course.decision)) course.acceptedCredits = 0;
    if (course.decision === 'conditional' && course.validationRequired === 'none') {
      return { ok: false, error: `Course ${index + 1}: conditional decisions require a validation method.` };
    }
    courses.push(course);
  }

  const finalCreditDecisions = courses.filter((course) => ['credit_and_gpa', 'credit_only'].includes(course.decision));
  if (data.evidenceLevel === 'C' && finalCreditDecisions.length > 0) {
    return { ok: false, error: 'Evidence Level C supports preliminary or conditional planning only, not final accepted credit.' };
  }
  if (data.evidenceLevel === 'D' && courses.some((course) => !['rejected', 'deferred'].includes(course.decision))) {
    return { ok: false, error: 'Evidence Level D cannot support accepted or conditional transfer credit.' };
  }

  return { ok: true, data: { ...data, courses } };
}

function applicationAlertDetails(app) {
  return {
    studentName: app.studentName,
    gradeLevel: app.gradeLevel,
    parentName: app.parentName,
    parentEmail: app.parentEmail,
    currentSchool: app.currentSchool,
    targetUniversities: app.targetUniversities,
    preferredLanguage: app.preferredLanguage,
    communicationLanguage: app.communicationLanguage || app.preferredLanguage || 'en',
    applicantType: app.applicantType,
    previousCredits: app.previousCredits,
    transcriptAvailable: app.transcriptAvailable,
    graduationTiming: app.graduationTiming,
    currentEnrollmentStatus: app.currentEnrollmentStatus,
    priorSchoolsJson: app.priorSchoolsJson,
    recordsSituation: app.recordsSituation,
    recordsHelpNeeded: app.recordsHelpNeeded,
    transcriptExpectedTiming: app.transcriptExpectedTiming,
    graduationTargetDate: app.graduationTargetDate,
    parentRelationship: app.parentRelationship,
    contactPreference: app.contactPreference,
    mainConcern: app.mainConcern,
    appId: app.id,
  };
}

async function confirmOfficialRecordsRequested(applicationId, {
  prismaClient = prisma,
  actorEmail = 'admin',
} = {}) {
  const app = await prismaClient.application.findUnique({ where: { id: applicationId } });
  if (!app) return { ok: false, status: 404, error: 'Application not found.' };
  if (applicationTypeFor(app) !== 'transfer') {
    return { ok: false, status: 400, error: 'Official records requests are only available for transfer applications.' };
  }
  if (!hasConfirmedInterest(app)) {
    return { ok: false, status: 400, error: 'Wait for parent email confirmation before requesting records.' };
  }
  if (app.recordsStatus === 'requested') {
    return { ok: true, status: 200, alreadyRequested: true };
  }
  if (['partial', 'received', 'verified'].includes(app.recordsStatus)) {
    return { ok: false, status: 409, error: 'Current records status is later than requested; it will not be downgraded.' };
  }
  await withTransaction(prismaClient, async (tx) => {
    await tx.application.update({
      where: { id: applicationId },
      data: { recordsStatus: 'requested', nextAction: 'Wait for official records' },
    });
    if (tx.applicationEvent) {
      await tx.applicationEvent.create({
        data: applicationEventData(
          applicationId,
          'official_records_requested',
          actorEmail,
          'Operator confirmed that the official records request was sent.',
        ),
      });
    }
  });
  return { ok: true, status: 200, alreadyRequested: false };
}

async function submitPublicApplication(body, {
  prismaClient = prisma,
  sendConfirmation = sendApplicationInterestConfirmation,
  now = new Date(),
  tokenFactory = createInterestToken,
  publicSite = PUBLIC_SITE,
} = {}) {
  const parsed = parseApplicationSubmission(body);
  if (!parsed.ok) return parsed;

  const data = parsed.data;
  const token = tokenFactory();
  const tokenHash = interestTokenHash(token);
  const expiresAt = new Date(now.getTime() + INTEREST_CONFIRMATION_TTL_MS);
  const deliverConfirmation = async ({ application, confirmationToken }) => {
    let delivery;
    try {
      delivery = await sendConfirmation({
        parentEmail: application.parentEmail,
        parentName: application.parentName,
        studentName: application.studentName,
        preferredLanguage: application.preferredLanguage,
        communicationLanguage: application.communicationLanguage || application.preferredLanguage || 'en',
        confirmationUrl: confirmationUrlForToken(confirmationToken, publicSite),
        expiresHours: 72,
      });
    } catch (err) {
      delivery = { ok: false, error: err.message };
    }

    const delivered = delivery?.ok === true;
    await withTransaction(prismaClient, async (tx) => {
      await tx.application.update({
        where: { id: application.id },
        data: delivered
          ? { interestConfirmationSentAt: now, nextAction: 'Wait for parent email confirmation' }
          : { interestConfirmationSentAt: null, nextAction: 'Confirmation email delivery failed; contact family' },
      });
      if (tx.applicationEvent) {
        await tx.applicationEvent.create({
          data: applicationEventData(
            application.id,
            delivered ? 'interest_confirmation_sent' : 'interest_confirmation_delivery_failed',
            'system',
            delivered ? 'Parent interest confirmation email sent.' : 'Parent interest confirmation email could not be delivered.',
          ),
        });
      }
    });
    return delivered;
  };
  const existing = await prismaClient.application.findFirst({
    where: {
      parentEmail: { equals: data.parentEmail, mode: 'insensitive' },
      studentName: { equals: data.studentName, mode: 'insensitive' },
      dob: data.dob,
      status: 'pending',
      createdAt: { gte: new Date(now.getTime() - DUPLICATE_WINDOW_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    const needsConfirmation = !existing.interestConfirmedAt;
    await withTransaction(prismaClient, async (tx) => {
      await tx.application.update({
        where: { id: existing.id },
        data: {
          submissionCount: { increment: 1 },
          lastSubmittedAt: now,
          communicationLanguage: data.communicationLanguage,
          ...(needsConfirmation ? {
            interestConfirmationTokenHash: tokenHash,
            interestConfirmationExpiresAt: expiresAt,
            interestConfirmationSentAt: null,
            nextAction: 'Send parent confirmation email',
          } : {}),
        },
      });
      if (tx.applicationEvent) {
        await tx.applicationEvent.create({
          data: applicationEventData(existing.id, 'duplicate_submission', data.parentEmail, 'Recent duplicate submission recorded.'),
        });
      }
    });
    if (needsConfirmation) {
      const delivered = await deliverConfirmation({
        application: {
          ...existing,
          parentEmail: existing.parentEmail || data.parentEmail,
          parentName: existing.parentName || data.parentName,
          studentName: existing.studentName || data.studentName,
          preferredLanguage: existing.preferredLanguage || data.preferredLanguage,
          communicationLanguage: data.communicationLanguage || existing.communicationLanguage || existing.preferredLanguage,
        },
        confirmationToken: token,
      });
      if (!delivered) {
        return {
          ok: false,
          status: 503,
          error: 'Your application was saved, but the confirmation email could not be delivered. Please retry or contact admissions@genesisideas.school.',
        };
      }
    }
    return {
      ok: true,
      status: 200,
      body: { ok: true, id: existing.id, duplicate: true, confirmationRequired: needsConfirmation },
    };
  }

  const app = await withTransaction(prismaClient, async (tx) => {
    const created = await tx.application.create({
      data: {
        ...data,
        recordsStatus: 'not_requested',
        nextAction: 'Send parent confirmation email',
        responseDueAt: nextBusinessResponseDue(now),
        lastSubmittedAt: now,
        interestConfirmationTokenHash: tokenHash,
        interestConfirmationExpiresAt: expiresAt,
        interestConfirmationSentAt: null,
      },
    });
    if (tx.applicationEvent) {
      await tx.applicationEvent.create({
        data: applicationEventData(created.id, 'application_submitted', data.parentEmail, `${data.applicantType} application submitted.`),
      });
    }
    return created;
  });

  const delivered = await deliverConfirmation({ application: app, confirmationToken: token });
  if (!delivered) {
    return {
      ok: false,
      status: 503,
      error: 'Your application was saved, but the confirmation email could not be delivered. Please retry or contact admissions@genesisideas.school.',
    };
  }

  return {
    ok: true,
    status: 201,
    body: { ok: true, id: app.id, duplicate: false, confirmationRequired: true },
  };
}

async function confirmPublicApplicationInterest(rawToken, {
  prismaClient = prisma,
  sendAlert = sendNewApplicationAlert,
  now = new Date(),
} = {}) {
  const token = String(rawToken || '').trim();
  if (!/^[A-Za-z0-9_-]{32,200}$/.test(token)) {
    return { ok: true, state: 'invalid_or_expired' };
  }

  const app = await prismaClient.application.findUnique({
    where: { interestConfirmationTokenHash: interestTokenHash(token) },
    include: { transferEvaluation: { include: TRANSFER_EVALUATION_INCLUDE } },
  });
  if (!app || !app.interestConfirmationExpiresAt || app.interestConfirmationExpiresAt <= now) {
    return { ok: true, state: 'invalid_or_expired' };
  }
  if (app.interestConfirmedAt) {
    return { ok: true, state: 'confirmed' };
  }

  const claimed = await withTransaction(prismaClient, async (tx) => {
    const updated = await tx.application.updateMany({
      where: { id: app.id, interestConfirmedAt: null },
      data: {
        interestConfirmedAt: now,
        nextAction: app.applicantType === 'transfer' ? 'Request official records' : 'Review application',
      },
    });
    if (updated.count > 0 && tx.applicationEvent) {
      await tx.applicationEvent.create({
        data: applicationEventData(
          app.id,
          'parent_interest_confirmed',
          app.parentEmail,
          'Parent email confirmation completed.',
        ),
      });
    }
    return updated.count > 0;
  });

  if (claimed) {
    Promise.resolve(sendAlert(applicationAlertDetails({ ...app, interestConfirmedAt: now })))
      .catch((err) => console.error('[applications] Failed to queue confirmed application alert:', err.message));
  }
  return { ok: true, state: 'confirmed' };
}

async function findStudentForApplication(app) {
  return prisma.student.findFirst({
    where: {
      parentEmail: { equals: app.parentEmail, mode: 'insensitive' },
      name: { equals: app.studentName, mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, studentCode: true },
  });
}

async function applicationEnrollmentState(app) {
  const student = await prisma.student.findFirst({
    where: {
      parentEmail: { equals: app.parentEmail, mode: 'insensitive' },
      name: { equals: app.studentName, mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      account: { select: { email: true, isActive: true, softLocked: true, lockReason: true } },
      parentAccounts: { select: { email: true }, take: 1 },
      subscriptions: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
  });

  const candidateEmails = [app.parentEmail];
  if (student?.parentAccounts?.[0]?.email) candidateEmails.push(student.parentAccounts[0].email);
  if (student?.account?.email) {
    const parentLogin = parentLoginEmailForStudentEmail(student.account.email);
    if (parentLogin) candidateEmails.push(parentLogin);
  }

  const subscriptions = await prisma.subscription.findMany({
    where: {
      OR: [
        { purchaserEmail: { in: [...new Set(candidateEmails)] } },
        ...(student?.id ? [{ studentId: student.id }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const activeStatuses = new Set(['active', 'trialing', 'paid']);
  const activeLinked = subscriptions.find((sub) => sub.studentId && student?.id && sub.studentId === student.id && activeStatuses.has(sub.status));
  const activeUnlinked = subscriptions.find((sub) => !sub.studentId && activeStatuses.has(sub.status));
  const latestSub = subscriptions[0] || null;

  let code = app.status;
  let label = app.status;
  let action = '';
  if (app.status === 'rejected') {
    code = 'rejected';
    label = 'Rejected';
    action = 'No action';
  } else if (app.status === 'pending') {
    code = 'pending_review';
    label = 'Pending review';
    action = 'Review application';
  } else if (!student && activeUnlinked) {
    code = 'paid_unlinked';
    label = 'Paid, needs account activation';
    action = 'Activate account and link payment';
  } else if (!app.accountsCreated || !student?.account || !student?.parentAccounts?.length) {
    code = 'approved_unactivated';
    label = 'Approved, accounts not created';
    action = 'Create accounts';
  } else if (activeLinked) {
    code = 'active_paid';
    label = 'Active paid enrollment';
    action = 'Monitor progress';
  } else if (activeUnlinked) {
    code = 'paid_unlinked';
    label = 'Paid, needs payment link';
    action = 'Link payment';
  } else {
    code = 'accounts_created_unpaid';
    label = 'Accounts created, unpaid';
    action = 'Parent completes payment';
  }

  return {
    code,
    label,
    action,
    studentId: student?.id || null,
    studentEmail: student?.account?.email || null,
    parentLoginEmail: student?.parentAccounts?.[0]?.email || null,
    subscriptionId: (activeLinked || activeUnlinked || latestSub)?.id || null,
    subscriptionStatus: (activeLinked || activeUnlinked || latestSub)?.status || null,
    paid: !!activeLinked,
    paidUnlinked: !!activeUnlinked,
  };
}

async function linkExistingSubscriptionsForApplication({ app, studentId, parentLoginEmail }) {
  const emails = [...new Set([app.parentEmail, parentLoginEmail].filter(Boolean))];
  if (!emails.length) return [];
  const updated = await prisma.subscription.updateMany({
    where: {
      studentId: null,
      purchaserEmail: { in: emails },
      status: { in: ['active', 'trialing', 'paid'] },
    },
    data: { studentId },
  });
  return updated.count;
}

/**
 * POST /api/applications/:id/manual-payment  — admin only
 * Records a manually verified Stripe Dashboard invoice/payment-link payment.
 *
 * This is the official v1 sales mode while automated checkout/webhook launch is
 * gated: apply/consult -> admin review -> manual Stripe payment -> record paid
 * -> activate/link accounts.
 */
router.post('/:id/manual-payment', authenticate, requireAdmin, async (req, res) => {
  const app = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: { transferEvaluation: { include: TRANSFER_EVALUATION_INCLUDE } },
  });
  if (!app) return res.status(404).json({ error: 'Application not found.' });
  if (app.status !== 'approved') {
    return res.status(400).json({ error: 'Application must be approved after path review before payment can be recorded.' });
  }
  const approvalError = applicationApprovalError(app);
  if (approvalError) return res.status(400).json({ error: approvalError });

  const planType = String(req.body?.planType || '').trim();
  const plan = MANUAL_PAYMENT_PLANS[planType];
  if (!plan) {
    return res.status(400).json({ error: `planType must be one of: ${Object.keys(MANUAL_PAYMENT_PLANS).join(', ')}` });
  }

  const amountCents = req.body?.amountCents == null ? plan.amountCents : Number(req.body.amountCents);
  if (!Number.isInteger(amountCents) || amountCents !== plan.amountCents) {
    return res.status(400).json({ error: `${plan.label} manual payment amount must be ${money(plan.amountCents)}.` });
  }

  const paymentMethod = String(req.body?.paymentMethod || 'manual_stripe_invoice').trim();
  if (!MANUAL_PAYMENT_METHODS.has(paymentMethod)) {
    return res.status(400).json({ error: `paymentMethod must be one of: ${[...MANUAL_PAYMENT_METHODS].join(', ')}` });
  }

  const paymentReference = normalizeReference(req.body?.paymentReference);
  if (!paymentReference) {
    return res.status(400).json({ error: 'paymentReference is required. Use the Stripe invoice, payment link, receipt, or dashboard reference.' });
  }

  const checkoutSessionId = manualCheckoutSessionId(paymentReference);
  const existing = await prisma.subscription.findUnique({
    where: { stripeCheckoutSessionId: checkoutSessionId },
    select: { id: true, purchaserEmail: true, status: true },
  });
  if (existing) {
    return res.status(409).json({ error: 'This manual payment reference is already recorded.', subscriptionId: existing.id });
  }

  const student = await findStudentForApplication(app);
  const now = new Date();
  const adminEmail = req.auth?.email || 'admin';
  const note = normalizeReference(req.body?.note);
  const auditLine = [
    `Manual Payment Verified (${now.toISOString().slice(0, 10)})`,
    `plan=${planType}`,
    `amount=${money(amountCents)}`,
    `method=${paymentMethod}`,
    `reference=${paymentReference}`,
    `verifiedBy=${adminEmail}`,
    note ? `note=${note}` : '',
  ].filter(Boolean).join('; ');

  const result = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: {
        purchaserEmail: app.parentEmail,
        planType,
        maxStudents: 1,
        status: 'active',
        amountTotal: amountCents,
        currentPeriodEnd: addMonths(now, plan.months),
        stripeCheckoutSessionId: checkoutSessionId,
        studentId: student?.id || null,
      },
    });

    const updatedApp = await tx.application.update({
      where: { id: app.id },
      data: { adminNotes: appendAdminNote(app.adminNotes, `${auditLine}; subscriptionId=${subscription.id}`) },
    });

    await tx.applicationEvent.create({
      data: applicationEventData(
        app.id,
        'manual_payment_recorded',
        adminEmail,
        `Manual ${planType} payment recorded.`,
        { amountCents, paymentMethod, subscriptionId: subscription.id },
      ),
    });

    if (student?.id) {
      await tx.auditLog.create({
        data: {
          action: 'manual_payment_verified',
          studentId: student.id,
          actorRole: 'admin',
          actorEmail: adminEmail,
        },
      }).catch(() => null);
    }

    return { subscription, updatedApp };
  });

  const enrollmentState = await applicationEnrollmentState(result.updatedApp);
  res.status(201).json({
    ok: true,
    subscription: {
      id: result.subscription.id,
      purchaserEmail: result.subscription.purchaserEmail,
      planType: result.subscription.planType,
      status: result.subscription.status,
      amountTotal: result.subscription.amountTotal,
      currentPeriodEnd: result.subscription.currentPeriodEnd,
      studentId: result.subscription.studentId,
      stripeCheckoutSessionId: result.subscription.stripeCheckoutSessionId,
    },
    linkedToStudent: !!result.subscription.studentId,
    enrollmentState,
  });
});

// PUT /api/applications/:id/transfer-evaluation — save a draft course review.
// Saving a changed draft revokes any prior principal approval until it is
// reviewed again.
router.put('/:id/transfer-evaluation', authenticate, requireAdmin, async (req, res) => {
  const app = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!app) return res.status(404).json({ error: 'Application not found.' });
  if (applicationTypeFor(app) !== 'transfer') {
    return res.status(400).json({ error: 'Transfer evaluation is only available for transfer applications.' });
  }
  if (!hasConfirmedInterest(app)) {
    return res.status(400).json({ error: 'Wait for parent email confirmation before academic review.' });
  }
  const editErrorBeforePaymentLookup = transferEvaluationEditError(app);
  if (editErrorBeforePaymentLookup) return res.status(409).json({ error: editErrorBeforePaymentLookup });
  if (app.status === 'approved') {
    const enrollmentState = await applicationEnrollmentState(app);
    const editError = transferEvaluationEditError(app, enrollmentState);
    if (editError) return res.status(409).json({ error: editError });
  }

  const parsed = parseTransferEvaluation(req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error });
  const { courses, ...evaluation } = parsed.data;
  const saved = await prisma.$transaction(async (tx) => {
    const result = await tx.transferCreditEvaluation.upsert({
      where: { applicationId: app.id },
      create: {
        applicationId: app.id,
        ...evaluation,
        courses: { create: courses },
      },
      update: {
        ...evaluation,
        principalApprover: '',
        principalApprovedAt: null,
        courses: {
          deleteMany: {},
          create: courses,
        },
      },
      include: TRANSFER_EVALUATION_INCLUDE,
    });
    if (app.status === 'approved') {
      await tx.application.update({
        where: { id: app.id },
        data: { status: 'pending', reviewedAt: null, reviewedById: null },
      });
    }
    await tx.applicationEvent.create({
      data: applicationEventData(
        app.id,
        'transfer_evaluation_saved',
        req.auth?.email,
        `Transfer evaluation saved with ${courses.length} course row(s).`,
        { applicationResetToPending: app.status === 'approved' },
      ),
    });
    return result;
  });

  return res.json({ ok: true, evaluation: saved, applicationResetToPending: app.status === 'approved' });
});

// POST /api/applications/:id/transfer-evaluation/principal-approval — record
// the human sign-off required before a transfer application can be approved.
router.post('/:id/transfer-evaluation/principal-approval', authenticate, requireAdmin, async (req, res) => {
  const app = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: { transferEvaluation: { include: TRANSFER_EVALUATION_INCLUDE } },
  });
  if (!app) return res.status(404).json({ error: 'Application not found.' });
  if (applicationTypeFor(app) !== 'transfer') {
    return res.status(400).json({ error: 'Principal transfer approval is only available for transfer applications.' });
  }
  if (!hasConfirmedInterest(app)) {
    return res.status(400).json({ error: 'Wait for parent email confirmation before principal review.' });
  }
  if (app.recordsStatus !== 'verified') {
    return res.status(400).json({ error: 'Verify official records before recording principal approval.' });
  }
  const evaluation = app.transferEvaluation;
  if (!evaluation?.courses?.length) {
    return res.status(400).json({ error: 'Save a course-by-course transfer evaluation first.' });
  }
  if (evaluation.courses.some((course) => course.decision === 'deferred')) {
    return res.status(400).json({ error: 'Resolve deferred course decisions before principal approval.' });
  }
  const principalApprover = cleanString(req.body?.principalApprover);
  if (!principalApprover) return res.status(400).json({ error: 'principalApprover is required.' });
  if (principalApprover.length > 120) return res.status(400).json({ error: 'principalApprover is too long.' });

  const approvedAt = new Date();
  const saved = await prisma.$transaction(async (tx) => {
    const result = await tx.transferCreditEvaluation.update({
      where: { applicationId: app.id },
      data: { principalApprover, principalApprovedAt: approvedAt },
      include: TRANSFER_EVALUATION_INCLUDE,
    });
    await tx.applicationEvent.create({
      data: applicationEventData(
        app.id,
        'principal_transfer_approval_recorded',
        req.auth?.email,
        `Principal approval recorded for ${principalApprover}.`,
      ),
    });
    return result;
  });
  return res.json({ ok: true, evaluation: saved });
});

// POST /api/applications  — public, no auth required
router.post('/', async (req, res) => {
  try {
    const result = await submitPublicApplication(req.body);
    if (!result.ok) return res.status(result.status).json({ error: result.error });
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[applications] Public submission failed:', err.message);
    return res.status(500).json({ error: 'Application could not be submitted. Please try again.' });
  }
});

// POST /api/applications/confirm-interest — public capability-link endpoint.
// The response is deliberately generic and never accepts or returns an
// application ID, parent email, or student details.
router.post('/confirm-interest', async (req, res) => {
  try {
    const result = await confirmPublicApplicationInterest(req.body?.token);
    return res.json(result);
  } catch (err) {
    console.error('[applications] Interest confirmation failed:', err.message);
    return res.json({ ok: true, state: 'invalid_or_expired' });
  }
});

// Public rollout contract. The frontend uses this to avoid claiming that the
// confirmation workflow is live while an older backend is still deployed.
router.get('/capabilities', (_req, res) => {
  res.json({
    applicationIntakeVersion: 'serious-v1',
    transferIntakeVersion: 'transfer-v2',
    interestConfirmation: true,
    adminWorkflowVersion: 'admissions-v5',
    transferEvaluation: true,
  });
});

// GET /api/applications  — admin only
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const status = req.query.status;
  const where = status ? { status } : {};
  const apps = await prisma.application.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: APPLICATION_INCLUDE,
  });
  const enriched = await Promise.all(apps.map(async (app) => {
    const safeApp = { ...app };
    delete safeApp.interestConfirmationTokenHash;
    return {
      ...safeApp,
      readiness: applicationReadiness(app),
      enrollmentState: await applicationEnrollmentState(app),
    };
  }));
  res.json(enriched);
});

// POST /api/applications/:id/records-requested — admin confirmation only.
// Preparing or copying a draft must never call this endpoint.
router.post('/:id/records-requested', authenticate, requireAdmin, async (req, res) => {
  const result = await confirmOfficialRecordsRequested(req.params.id, {
    actorEmail: req.auth?.email || 'admin',
  });
  if (!result.ok) return res.status(result.status).json({ error: result.error });
  return res.status(result.status).json({ ok: true, alreadyRequested: result.alreadyRequested });
});

// PATCH /api/applications/:id  — update status, rejectionReason, or adminNotes
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const {
    status,
    rejectionReason,
    adminNotes,
    recordsStatus,
    assignedTo,
    nextAction,
    markContacted,
  } = req.body || {};
  const data = {};
  let currentApplication = null;
  const loadCurrentApplication = async () => {
    if (!currentApplication) {
      currentApplication = await prisma.application.findUnique({
        where: { id: req.params.id },
        include: { transferEvaluation: { include: TRANSFER_EVALUATION_INCLUDE } },
      });
    }
    return currentApplication;
  };

  if (status !== undefined) {
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved | rejected | pending' });
    }
    data.status = status;
    data.reviewedAt = new Date();
    data.reviewedById = req.auth.adminId;
    if (status === 'rejected' && rejectionReason !== undefined) {
      data.rejectionReason = rejectionReason;
    }
  }

  if (adminNotes !== undefined) data.adminNotes = adminNotes;

  if (recordsStatus !== undefined) {
    if (!RECORDS_STATUSES.has(recordsStatus)) {
      return res.status(400).json({ error: 'Invalid recordsStatus' });
    }
    if (recordsStatus === 'requested') {
      const current = await loadCurrentApplication();
      if (!current) return res.status(404).json({ error: 'Application not found.' });
      if (current.recordsStatus !== 'requested') {
        return res.status(400).json({ error: 'Use the confirmed records-request action after the message is sent.' });
      }
    }
    data.recordsStatus = recordsStatus;
  }
  if (assignedTo !== undefined) {
    const cleanAssignedTo = cleanString(assignedTo);
    if (cleanAssignedTo.length > 80) return res.status(400).json({ error: 'assignedTo is too long' });
    data.assignedTo = cleanAssignedTo;
  }
  if (nextAction !== undefined) {
    const cleanNextAction = cleanString(nextAction);
    if (!cleanNextAction) return res.status(400).json({ error: 'nextAction is required' });
    if (cleanNextAction.length > 240) return res.status(400).json({ error: 'nextAction is too long' });
    data.nextAction = cleanNextAction;
  }
  if (markContacted === true) {
    const current = await loadCurrentApplication();
    if (!current) return res.status(404).json({ error: 'Application not found.' });
    const contactedAt = new Date();
    data.firstResponseAt = current.firstResponseAt || contactedAt;
    data.lastContactedAt = contactedAt;
  }

  if (data.status === 'approved') {
    const current = await loadCurrentApplication();
    if (!current) return res.status(404).json({ error: 'Application not found.' });
    const approvalError = applicationApprovalError({ ...current, ...data });
    if (approvalError) return res.status(400).json({ error: approvalError });
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Nothing to update.' });
  }

  const actorEmail = req.auth?.email || 'admin';
  const app = await prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id: req.params.id },
      data,
    });
    await tx.applicationEvent.create({
      data: applicationEventData(
        req.params.id,
        'application_updated',
        actorEmail,
        `Application updated: ${Object.keys(data).join(', ')}.`,
        { fields: Object.keys(data), ...(data.status ? { status: data.status } : {}) },
      ),
    });
    return updated;
  });

  res.json({ ok: true, id: app.id, status: app.status });
});

/**
 * POST /api/applications/:id/activate  — admin only
 * Creates Student + ParentAccount from an approved application.
 * Returns temp credentials for the admin to forward to the parent.
 * Safe to call once only — sets accountsCreated=true to prevent duplicates.
 */
router.post('/:id/activate', authenticate, requireAdmin, async (req, res) => {
  const app = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: { transferEvaluation: { include: TRANSFER_EVALUATION_INCLUDE } },
  });
  if (!app) return res.status(404).json({ error: 'Application not found.' });
  if (app.status !== 'approved') return res.status(400).json({ error: 'Application must be approved first.' });
  if (app.accountsCreated) return res.status(409).json({ error: 'Accounts already created for this application.' });
  const enrollmentBeforeActivation = await applicationEnrollmentState(app);
  const readinessError = activationReadinessError(app, enrollmentBeforeActivation);
  if (readinessError) return res.status(400).json({ error: readinessError });

  // Generate student code: GIIS-[year]-[4 random hex chars]
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const studentCode = `GIIS-${year}-${suffix}`;

  // Parse birth date
  let birthDate = null;
  try { birthDate = new Date(app.dob); } catch {}

  const studentLoginEmail = await uniqueStudentLoginEmail(app.studentName);
  if (!studentLoginEmail) return res.status(400).json({ error: 'Could not generate student login email.' });
  const parentLoginEmail = parentLoginEmailForStudentEmail(studentLoginEmail);
  if (!parentLoginEmail) return res.status(400).json({ error: 'Could not generate parent login email.' });

  const existingParentLogin = await prisma.parentAccount.findUnique({ where: { email: parentLoginEmail } });
  if (existingParentLogin) {
    return res.status(409).json({ error: `A parent account already exists for ${parentLoginEmail}.` });
  }

  const studentPassword = tempPassword('Student');
  const parentPassword = tempPassword('Parent');
  const studentPasswordHash = await bcrypt.hash(studentPassword, 12);
  const parentPasswordHash = await bcrypt.hash(parentPassword, 12);

  // Create Student + ParentAccount in a transaction
  const student = await prisma.student.create({
    data: {
      name: app.studentName,
      studentCode,
      birthDate,
      parentGuardian: app.parentName,
      parentEmail: app.parentEmail,
      entryDate: new Date(),
      account: {
        create: {
          email: studentLoginEmail,
          passwordHash: studentPasswordHash,
          isActive: true,
        },
      },
    },
  });

  await prisma.parentAccount.create({
    data: {
      email: parentLoginEmail,
      passwordHash: parentPasswordHash,
      studentId: student.id,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { id: app.id },
      data: { accountsCreated: true },
    });
    await tx.applicationEvent.create({
      data: applicationEventData(
        app.id,
        'accounts_activated',
        req.auth?.email,
        'Student and parent accounts activated.',
        { studentId: student.id },
      ),
    });
  });
  const linkedSubscriptions = await linkExistingSubscriptionsForApplication({
    app,
    studentId: student.id,
    parentLoginEmail,
  });

  const loginUrl = `${process.env.CORS_ORIGIN || 'https://genesisideas.school'}/parent/login`;

  // Auto-send welcome email with credentials
  const welcomeResult = await sendWelcomeEmail({
    parentEmail: app.parentEmail,
    studentName: app.studentName,
    tempPassword: parentPassword,
    loginUrl,
    studentCode,
    parentLoginEmail,
    parentPassword,
    studentLoginEmail,
    studentPassword,
    communicationLanguage: app.communicationLanguage || app.preferredLanguage || 'en',
  });
  await recordEmailLog({
    kind: 'welcome_parent_login',
    recipient: app.parentEmail,
    studentId: student.id,
    result: welcomeResult,
  });

  res.json({
    ok: true,
    studentCode,
    studentId: student.id,
    parentContactEmail: app.parentEmail,
    parentEmail: parentLoginEmail,
    parentLoginEmail,
    parentPassword,
    studentEmail: studentLoginEmail,
    studentPassword,
    tempPassword: parentPassword,
    linkedSubscriptions,
    loginUrl,
  });
});

module.exports = router;
module.exports.parseApplicationSubmission = parseApplicationSubmission;
module.exports.legacyReviewFields = legacyReviewFields;
module.exports.parseTransferEvaluation = parseTransferEvaluation;
module.exports.submitPublicApplication = submitPublicApplication;
module.exports.confirmPublicApplicationInterest = confirmPublicApplicationInterest;
module.exports.nextBusinessResponseDue = nextBusinessResponseDue;
module.exports.applicationTypeFor = applicationTypeFor;
module.exports.transferApprovalError = transferApprovalError;
module.exports.applicationApprovalError = applicationApprovalError;
module.exports.applicationReadiness = applicationReadiness;
module.exports.activationReadinessError = activationReadinessError;
module.exports.transferEvaluationEditError = transferEvaluationEditError;
module.exports.interestTokenHash = interestTokenHash;
module.exports.normalizePriorSchools = normalizePriorSchools;
module.exports.confirmOfficialRecordsRequested = confirmOfficialRecordsRequested;
