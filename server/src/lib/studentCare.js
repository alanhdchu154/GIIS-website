const CARE_STATUSES = [
  'active',
  'progressing',
  'slowing_down',
  'disengaging',
  'intervention_needed',
  'advisor_followup',
  'parent_concern',
];

const RISK_LEVELS = ['low', 'watch', 'concern', 'urgent'];
const CARE_TIERS = ['self_paced', 'guided', 'premium', 'transfer', 'graduation'];
const CARE_LOG_TYPES = [
  'advisor_note',
  'weekly_checkin',
  'parent_contact',
  'intervention',
  'transfer_review',
  'graduation_review',
];
const CARE_VISIBILITIES = ['internal', 'parent_safe'];
const CARE_CHANNELS = ['email', 'phone', 'wechat', 'meeting', 'portal', 'internal'];

const RISK_RANK = { low: 0, watch: 1, concern: 2, urgent: 3 };
const STATUS_RANK = {
  active: 0,
  progressing: 1,
  slowing_down: 2,
  disengaging: 3,
  advisor_followup: 4,
  parent_concern: 5,
  intervention_needed: 6,
};

function normalizeChoice(value, allowed, fallback) {
  const v = String(value || '').trim();
  return allowed.includes(v) ? v : fallback;
}

function parseOptionalDate(value) {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00.000Z`)
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function daysSince(value, now = new Date()) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((now.getTime() - date.getTime()) / 86400000);
}

function isPast(value, now = new Date()) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < now.getTime();
}

function computeCareSignals(input = {}, now = new Date()) {
  const daysInactive = input.daysInactive;
  const consistency = input.consistency || [];
  const totalEnrollments = Number(input.totalEnrollments || 0);
  const totalModules = Number(input.totalModules || 0);
  const completedModules = Number(input.completedModules || 0);
  const submittedQuizzes = Number(input.submittedQuizzes || 0);
  const submittedExams = Number(input.submittedExams || 0);
  const lastReviewedAt = input.lastReviewedAt || null;
  const nextCheckInDueAt = input.nextCheckInDueAt || null;
  const modulePct = totalModules > 0 ? completedModules / totalModules : null;
  const reviewAgeDays = daysSince(lastReviewedAt, now);
  const checkInOverdue = isPast(nextCheckInDueAt, now);
  const flags = [];

  let computedRiskLevel = 'low';
  let computedStatus = totalEnrollments > 0 ? 'progressing' : 'active';
  const raiseRisk = (riskLevel) => {
    if (RISK_RANK[computedRiskLevel] < RISK_RANK[riskLevel]) computedRiskLevel = riskLevel;
  };
  const raiseStatus = (status) => {
    if (STATUS_RANK[computedStatus] < STATUS_RANK[status]) computedStatus = status;
  };

  if (daysInactive === null && totalEnrollments > 0) {
    flags.push('No platform activity yet.');
    raiseRisk('watch');
    raiseStatus('slowing_down');
  } else if (daysInactive >= 21) {
    flags.push('No activity for 21+ days.');
    raiseRisk('urgent');
    raiseStatus('intervention_needed');
  } else if (daysInactive >= 14) {
    flags.push('No activity for 14+ days.');
    raiseRisk('concern');
    raiseStatus('disengaging');
  } else if (daysInactive >= 7) {
    flags.push('No activity for 7+ days.');
    raiseRisk('watch');
    raiseStatus('slowing_down');
  }

  if (modulePct !== null && modulePct < 0.25 && totalEnrollments > 0 && submittedQuizzes === 0) {
    flags.push('Low module progress with no quiz evidence.');
    raiseRisk('watch');
    raiseStatus('slowing_down');
  }

  if (submittedExams === 0 && completedModules > 0 && totalModules > 0 && completedModules >= Math.ceil(totalModules * 0.5)) {
    flags.push('Coursework progress exists but no exam evidence yet.');
    raiseRisk('watch');
  }

  if (consistency.length > 0) {
    flags.push('Data consistency note requires staff review.');
    raiseRisk('concern');
    raiseStatus('advisor_followup');
  }

  if (reviewAgeDays === null) {
    flags.push('No advisor review recorded.');
    raiseRisk('watch');
  } else if (reviewAgeDays >= 21) {
    flags.push('Advisor review is older than 21 days.');
    raiseRisk('concern');
    raiseStatus('advisor_followup');
  }

  if (checkInOverdue) {
    flags.push('Next check-in is overdue.');
    raiseRisk('concern');
    raiseStatus('advisor_followup');
  }

  return {
    computedStatus,
    computedRiskLevel,
    flags,
  };
}

function displayCareState(careState, computed) {
  const stored = careState || {};
  const manual = stored.manualOverride === true;
  return {
    status: manual ? stored.status : computed.computedStatus,
    riskLevel: manual ? stored.riskLevel : computed.computedRiskLevel,
    source: manual ? 'manual' : 'computed',
  };
}

function serializeCareState(careState) {
  if (!careState) return null;
  return {
    id: careState.id,
    studentId: careState.studentId,
    advisorOwner: careState.advisorOwner || '',
    status: careState.status || 'active',
    riskLevel: careState.riskLevel || 'low',
    careTier: careState.careTier || 'self_paced',
    manualOverride: careState.manualOverride === true,
    lastReviewedAt: careState.lastReviewedAt?.toISOString?.() || null,
    nextCheckInDueAt: careState.nextCheckInDueAt?.toISOString?.() || null,
    currentGoal: careState.currentGoal || '',
    internalFlags: careState.internalFlags || {},
    createdAt: careState.createdAt?.toISOString?.() || null,
    updatedAt: careState.updatedAt?.toISOString?.() || null,
  };
}

function serializeCareLog(log, { parentSafeOnly = false } = {}) {
  const base = {
    id: log.id,
    studentId: log.studentId,
    type: log.type,
    visibility: log.visibility,
    title: log.title || '',
    parentSummary: log.parentSummary || '',
    channel: log.channel || 'internal',
    outcome: log.outcome || '',
    followUpAt: log.followUpAt?.toISOString?.() || null,
    resolvedAt: log.resolvedAt?.toISOString?.() || null,
    authorEmail: log.authorEmail || '',
    createdAt: log.createdAt?.toISOString?.() || null,
    updatedAt: log.updatedAt?.toISOString?.() || null,
  };
  if (!parentSafeOnly) base.bodyInternal = log.bodyInternal || '';
  return base;
}

module.exports = {
  CARE_STATUSES,
  RISK_LEVELS,
  CARE_TIERS,
  CARE_LOG_TYPES,
  CARE_VISIBILITIES,
  CARE_CHANNELS,
  normalizeChoice,
  parseOptionalDate,
  computeCareSignals,
  displayCareState,
  serializeCareState,
  serializeCareLog,
};
