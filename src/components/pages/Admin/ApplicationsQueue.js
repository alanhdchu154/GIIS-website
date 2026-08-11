import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { getApiBase } from '../../../config/apiBase';
import { AdminHeader, AdminPage } from './AdminChrome';
import { getAdminSession } from '../../../api/authStorage';
import TransferEvaluationEditor from './TransferEvaluationEditor';

const API = getApiBase();

const STATUS_COLORS = {
  pending:  { bg: '#fff3e0', fg: '#e65100', label: 'Pending' },
  approved: { bg: '#e8f5e9', fg: '#2e7d32', label: 'Approved' },
  rejected: { bg: '#fce4ec', fg: '#c62828', label: 'Rejected' },
};

const ENROLLMENT_STATE_COLORS = {
  pending_review: { bg: '#fff7ed', fg: '#c2410c' },
  approved_unactivated: { bg: '#eff6ff', fg: '#1d4ed8' },
  accounts_created_unpaid: { bg: '#fef3c7', fg: '#92400e' },
  paid_unlinked: { bg: '#fde68a', fg: '#854d0e' },
  active_paid: { bg: '#dcfce7', fg: '#166534' },
  rejected: { bg: '#fee2e2', fg: '#991b1b' },
};

const REJECTION_REASONS = [
  { value: 'grade_mismatch',  label: 'Grade level mismatch',       detail: 'We currently serve Grades 9–12 only.' },
  { value: 'capacity_full',   label: 'Capacity full',              detail: 'We have reached our current enrollment limit.' },
  { value: 'language_needs',  label: 'Language needs',             detail: 'We are unable to adequately support the preferred instruction language at this time.' },
  { value: 'incomplete',      label: 'Incomplete application',     detail: 'The application was missing required information.' },
  { value: 'other',           label: 'Other',                      detail: '' },
];

const APPLICANT_TYPE_LABELS = {
  new: 'New student',
  transfer: 'Transfer student',
  'not provided': 'Not provided',
};

const APPLICATION_NOTE_LABELS = {
  previousCredits: {
    '0-5': '0–5 credits',
    '6-11': '6–11 credits',
    '12-17': '12–17 credits',
    '18-23': '18–23 credits',
    '24+': '24+ credits',
    'not applicable': 'Not applicable',
    'not provided': 'Not provided',
  },
  graduationTiming: {
    asap: 'As soon as realistically possible',
    '1-year': 'Within 1 school year',
    '2-years': 'Within 2 school years',
    'not-sure': 'Not sure yet',
    'standard path': 'Standard new-student path',
    'not provided': 'Not provided',
    'normal-pace': 'Normal grade-level pace',
    accelerated: 'Accelerated path requested',
    'target-date': 'Family provided a target date',
  },
  transcriptAvailable: {
    yes: 'Family says transcript can be provided',
    partial: 'Family has partial records only',
    'not-yet': 'Family does not have records yet',
    'not applicable': 'Not applicable',
    'not provided': 'Not provided',
  },
  concern: {
    'grade9-path': 'Which starting path fits my child?',
    credits: 'Will credits transfer?',
    graduation: 'Can my child graduate on time?',
    records: 'Will the school record be accepted?',
    motivation: 'Will my child stay on track?',
    'not provided': 'Not provided',
  },
};

const TRANSFER_INTAKE_LABELS = {
  currentEnrollmentStatus: {
    'preparing-to-enroll': 'Preparing to enroll',
    'currently-enrolled': 'Currently enrolled elsewhere',
    'left-prior-school': 'Left prior school',
    other: 'Other situation',
  },
  recordsSituation: {
    'official-transcript': 'Official transcript available',
    'partial-records': 'Partial records available',
    'no-official-transcript': 'No official transcript yet',
    'homeschool-no-traditional': 'Homeschool / no traditional transcript',
    'not-sure': 'Family is unsure what records qualify',
  },
  recordsHelpNeeded: {
    'records-in-hand': 'Records in hand',
    'already-requested': 'Requested and waiting',
    'can-request': 'Family can request records',
    'need-giis-help': 'Family needs GIIS guidance',
    'not-sure-how': 'Family is unsure how to request records',
  },
  transcriptExpectedTiming: {
    'available-now': 'Available now',
    '3-business-days': 'About 3 business days',
    '7-business-days': 'About 7 business days',
    '14-business-days': 'About 14 business days',
    uncertain: 'Timing uncertain',
  },
  parentRelationship: {
    parent: 'Parent',
    'legal-guardian': 'Legal guardian',
    self: 'Student applying independently',
    other: 'Other',
  },
  contactPreference: { email: 'Email', phone: 'Phone' },
};

const RECORDS_STATUS_LABELS = {
  not_requested: 'Not requested',
  requested: 'Requested',
  partial: 'Partial records',
  received: 'Records received',
  verified: 'Verified',
};

const READINESS_COLORS = {
  unconfirmed: { bg: '#f3f4f6', fg: '#4b5563' },
  records_pending: { bg: '#fef3c7', fg: '#92400e' },
  ready_for_academic_review: { bg: '#e0f2fe', fg: '#075985' },
  ready_for_principal_review: { bg: '#ede9fe', fg: '#5b21b6' },
  approval_ready: { bg: '#dcfce7', fg: '#166534' },
};

const MANUAL_PAYMENT_PLANS = {
  self_paced_monthly: { label: 'Self-Paced Founders · $49/month', amountCents: 4900 },
  self_paced_annual: { label: 'Self-Paced Founders · $499/year', amountCents: 49900 },
  guided_monthly: { label: 'Guided · $149/month', amountCents: 14900 },
  premium_monthly: { label: 'Premium / College Pathway · $299/month', amountCents: 29900 },
};

const MANUAL_PAYMENT_METHODS = {
  manual_stripe_invoice: 'Manual Stripe invoice',
  manual_stripe_payment_link: 'Manual Stripe payment link',
  stripe_dashboard_invoice: 'Stripe Dashboard invoice',
  stripe_dashboard_payment_link: 'Stripe Dashboard payment link',
};

function money(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function todayReceiptDate() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function manualPaymentReceiptText(receipt) {
  if (!receipt) return '';
  const { app, draft, subscription } = receipt;
  const english = `Subject: GIIS payment receipt - ${app.studentName}

Genesis of Ideas International School
Florida-registered private school
Payment receipt

Date recorded: ${todayReceiptDate()}
Student: ${app.studentName}
Parent/guardian: ${app.parentName}
Parent email: ${app.parentEmail}
Plan: ${draft.planLabel}
Amount recorded: ${money(draft.amountCents)}
Payment method: ${draft.paymentMethodLabel}
Stripe reference: ${draft.paymentReference}
GIIS subscription record: ${subscription?.id || 'recorded in admin system'}

This payment was recorded after GIIS admissions/path review. Student and parent portal access is activated after both enrollment fit and payment status are clear.

Refund policy: https://genesisideas.school/refund-policy

If anything in this receipt looks incorrect, please reply to admissions@genesisideas.school.

Best,
GIIS Admissions`;
  const chinese = `主题：GIIS 付款收据 - ${app.studentName}

Genesis of Ideas International School
佛罗里达州注册私立学校
付款收据

记录日期：${todayReceiptDate()}
学生：${app.studentName}
家长／监护人：${app.parentName}
家长邮箱：${app.parentEmail}
方案：${draft.planLabel}
记录金额：${money(draft.amountCents)}
付款方式：${draft.paymentMethodLabel}
Stripe 参考编号：${draft.paymentReference}
GIIS 订阅记录：${subscription?.id || '已记录于学校后台'}

本笔付款是在 GIIS 完成招生与学习路径审核后记录。学生与家长入口仅会在入学资格及付款状态均确认后启用。

退款政策：https://genesisideas.school/refund-policy

如收据内容有误，请回复 admissions@genesisideas.school。

GIIS 招生团队`;
  const language = communicationLanguageFor(app);
  if (language === 'bilingual') return `${english}\n\n--- 中文 ---\n\n${chinese}`;
  return language === 'zh' ? chinese : english;
}

function labelApplicationValue(field, value) {
  const clean = String(value || 'not provided').trim();
  if (field === 'applicantType') return APPLICANT_TYPE_LABELS[clean] || clean || 'Not provided';
  return APPLICATION_NOTE_LABELS[field]?.[clean] || clean || 'Not provided';
}

function labelTransferIntakeValue(field, value) {
  const clean = String(value || '').trim();
  return TRANSFER_INTAKE_LABELS[field]?.[clean] || clean || 'Not provided';
}

function priorSchoolsFor(app) {
  try {
    const rows = JSON.parse(app?.priorSchoolsJson || '[]');
    if (!Array.isArray(rows)) return [];
    return rows.filter((row) => row && row.schoolName).slice(0, 5);
  } catch {
    return [];
  }
}

function communicationLanguageFor(app) {
  if (['en', 'zh', 'bilingual'].includes(app?.communicationLanguage)) return app.communicationLanguage;
  return app?.preferredLanguage === 'zh' ? 'zh' : 'en';
}

function communicationLanguageLabel(app) {
  const language = communicationLanguageFor(app);
  if (language === 'bilingual') return 'Bilingual (English / Chinese)';
  return language === 'zh' ? 'Chinese' : 'English';
}

function recordsRequestDraft(app, messageLanguage = communicationLanguageFor(app)) {
  if (messageLanguage === 'bilingual') {
    return `${recordsRequestDraft(app, 'en')}\n\n--- 中文 ---\n\n${recordsRequestDraft(app, 'zh')}`;
  }
  const schools = priorSchoolsFor(app);
  const schoolLine = schools.length
    ? schools.map((school) => `${school.schoolName}${school.attendancePeriod ? ` (${school.attendancePeriod})` : ''}`).join('; ')
    : app.currentSchool || 'the student\'s prior high school';
  if (messageLanguage === 'zh') {
    return `主题：GIIS 转学记录申请 - ${app.studentName}

${app.parentName} 您好：

为了继续审核 ${app.studentName} 的转学分，请向以下原学校申请正式成绩单或其他可核验的学校记录：${schoolLine}。记录应尽量包含已完成的高中学期、最终课程成绩与学分，以及学校评分标准。

您可以回复此邮件确认学校认可的递交方式，或请原学校联系 admissions@genesisideas.school。请勿通过公开链接传送学生记录。

申请表所填的预计取得时间为：${labelTransferIntakeValue('transcriptExpectedTiming', app.transcriptExpectedTiming)}。

GIIS 可以根据部分资料进行初步规划，但最终转学分、年级安排与毕业路径必须在学校收到并审核可核验记录后决定。

GIIS 招生团队`;
  }
  return `Subject: GIIS transfer records request - ${app.studentName}

Dear ${app.parentName},

To continue ${app.studentName}'s transfer-credit review, please request an official transcript or other verifiable school records from ${schoolLine}. Please include completed high-school terms, final course grades and credits, and the school's grading scale when available.

You may reply to this message with the school-approved delivery instructions, or ask the prior school to contact admissions@genesisideas.school. Please do not send records through a public link.

Your application estimated the records timing as: ${labelTransferIntakeValue('transcriptExpectedTiming', app.transcriptExpectedTiming)}.

GIIS can begin preliminary planning with partial information, but final transfer credit, grade placement, and any graduation path require record verification and academic review.

Best,
GIIS Admissions`;
}

function outreachChannelsFor(app) {
  const channels = [];
  if (app?.parentEmail) channels.push({ value: 'email', label: 'Email', contact: app.parentEmail });
  if (app?.phone) channels.push({ value: 'phone', label: 'Phone', contact: app.phone });
  const weChat = app?.parentWeChat || app?.wechatId || app?.wechat || '';
  if (weChat) channels.push({ value: 'wechat', label: 'WeChat', contact: weChat });
  return channels;
}

function firstOutreachDraft(app, messageLanguage = 'en') {
  const isTransfer = applicationTypeForDraft(app) === 'transfer';
  if (messageLanguage === 'bilingual') {
    const english = firstOutreachDraft(app, 'en');
    const chinese = firstOutreachDraft(app, 'zh');
    return {
      subject: `${english.subject} / GIIS 申请下一步`,
      body: `${english.body}\n\n--- 中文 ---\n\n${chinese.body}`,
    };
  }
  if (messageLanguage === 'zh') {
    return {
      subject: `GIIS 申请下一步 - ${app.studentName}`,
      body: `${app.parentName} 您好：

感谢您确认 ${app.studentName} 的 GIIS 申请。我们已经收到家庭提供的基本资料，下一步希望和您完成一次简短的入学路径沟通。

${isTransfer
  ? '转学生审核需要确认原学校记录的取得时间，并在收到可核验资料后进行逐科评估。家庭提供的学分估计与目标日期仅供初步规划。'
  : '我们会先确认适合的年级、开始时间与学习支持方式，再建议后续入学步骤。'}

请回复两个方便沟通的时间，并告诉我们您最希望先解决的问题。此阶段不会收取费用，也不代表已经录取或确认转入学分。

GIIS 招生团队
admissions@genesisideas.school`,
    };
  }
  return {
    subject: `Next step for ${app.studentName}'s GIIS application`,
    body: `Dear ${app.parentName},

Thank you for confirming ${app.studentName}'s GIIS application. We received the family's initial information and would like to complete a short admissions path conversation as the next step.

${isTransfer
  ? 'For a transfer review, we will confirm when prior-school records can be obtained and complete a course-by-course review after verifiable records arrive. Family credit estimates and target dates are planning information only.'
  : 'We will first confirm grade fit, intended start timing, and the appropriate level of learning support before recommending the next enrollment step.'}

Please reply with two convenient times to talk and the question you would most like us to address first. No payment is collected at this stage, and this message does not confirm admission or transfer credit.

GIIS Admissions
admissions@genesisideas.school`,
  };
}

function applicationTypeForDraft(app) {
  return applicationReviewFor(app)?.applicantType || app?.applicantType || 'new';
}

function parseApplicationReviewNotes(notes = '') {
  const text = String(notes);
  const current = text.match(
    /^Applicant Review:\s*type=(.*?);\s*previousCredits=(.*?);\s*graduationTiming=(.*?);\s*transcriptAvailable=(.*?);\s*concern=(.*?);\s*Required Records:\s*(.*?);\s*Family Notes:\s*(.*)$/s
  );
  if (current) {
    return {
      applicantType: current[1].trim(),
      previousCredits: current[2].trim(),
      graduationTiming: current[3].trim(),
      transcriptAvailable: current[4].trim(),
      concern: current[5].trim(),
      requiredRecords: current[6].trim(),
      familyNotes: current[7].trim(),
    };
  }

  const legacy = text.match(
    /^Transfer Path Review:\s*credits=(.*?);\s*graduationTiming=(.*?);\s*transcriptAvailable=(.*?);\s*concern=(.*?);\s*Family Notes:\s*(.*)$/s
  );
  if (!legacy) return null;
  return {
    applicantType: 'transfer',
    previousCredits: legacy[1].trim(),
    graduationTiming: legacy[2].trim(),
    transcriptAvailable: legacy[3].trim(),
    concern: legacy[4].trim(),
    requiredRecords: 'Legacy transfer review note. Confirm official transcript or school report before final credit decision.',
    familyNotes: legacy[5].trim(),
  };
}

function applicationReviewFor(app) {
  if (app?.applicantType === 'new' || app?.applicantType === 'transfer') {
    const isTransfer = app.applicantType === 'transfer';
    const noteFallback = parseApplicationReviewNotes(app.notes);
    return {
      applicantType: app.applicantType,
      previousCredits: isTransfer ? (app.previousCredits || 'not provided') : 'not applicable',
      graduationTiming: isTransfer ? (app.graduationTiming || 'not provided') : 'standard path',
      transcriptAvailable: isTransfer ? (app.transcriptAvailable || 'not provided') : 'not applicable',
      concern: app.mainConcern || 'not provided',
      requiredRecords: isTransfer
        ? 'Official transcript or school report for completed high-school terms; course descriptions if credits need review.'
        : 'Proof of age; current or most recent school information; recent report card or placement record if available.',
      familyNotes: noteFallback?.familyNotes || '',
    };
  }
  return parseApplicationReviewNotes(app?.notes);
}

function ApplicantReviewPanel({ app }) {
  const review = applicationReviewFor(app);
  if (!review) {
    if (!app?.notes) return null;
    return (
      <div style={{ background: '#f8f9fc', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1a1d24', marginBottom: 14 }}>
        <strong>Applicant notes:</strong> {app.notes}
      </div>
    );
  }

  const isTransfer = review.applicantType === 'transfer';
  const priorSchools = priorSchoolsFor(app);
  const transferNeedsRecordReview = isTransfer;
  const fields = isTransfer
    ? [
        ['Applicant Type', labelApplicationValue('applicantType', review.applicantType)],
        ['Previous Credits', labelApplicationValue('previousCredits', review.previousCredits)],
        ['Graduation Timing', labelApplicationValue('graduationTiming', review.graduationTiming)],
        ['Family Transcript Status', labelApplicationValue('transcriptAvailable', review.transcriptAvailable)],
        ['Main Concern', labelApplicationValue('concern', review.concern)],
      ]
    : [
        ['Applicant Type', labelApplicationValue('applicantType', review.applicantType)],
        ['Path', labelApplicationValue('graduationTiming', review.graduationTiming)],
        ['Transfer Transcript', labelApplicationValue('transcriptAvailable', review.transcriptAvailable)],
        ['Main Concern', labelApplicationValue('concern', review.concern)],
      ];

  return (
    <div style={{ background: '#f8fbff', border: '1px solid #cfe0f8', borderRadius: 10, padding: '13px 14px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#2b3d6d', letterSpacing: '1px', textTransform: 'uppercase' }}>Application Path Review</p>
        <span style={{ fontSize: 11, color: '#5c6578' }}>Confirm records before approve / activate</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {fields.map(([label, value]) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: 8, padding: '9px 10px' }}>
            <p style={{ fontSize: 9.5, fontWeight: 800, color: '#888', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 3px' }}>{label}</p>
            <p style={{ fontSize: 12.5, color: '#1a1d24', margin: 0, lineHeight: 1.35 }}>{value}</p>
          </div>
        ))}
      </div>
      {(app.motivation || app.intendedStartTiming) && (
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'minmax(160px, 0.4fr) minmax(240px, 1fr)', gap: 10 }}>
          <div style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: 8, padding: '9px 10px' }}>
            <p style={{ fontSize: 9.5, fontWeight: 800, color: '#888', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 3px' }}>Intended Start</p>
            <p style={{ fontSize: 12.5, color: '#1a1d24', margin: 0 }}>{app.intendedStartTiming || 'Not provided'}</p>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e0e6f0', borderRadius: 8, padding: '9px 10px' }}>
            <p style={{ fontSize: 9.5, fontWeight: 800, color: '#888', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 3px' }}>Family Motivation</p>
            <p style={{ fontSize: 12.5, color: '#1a1d24', margin: 0, whiteSpace: 'pre-wrap' }}>{app.motivation || 'Not provided'}</p>
          </div>
        </div>
      )}
      {isTransfer && (app.transferCourseSummary || app.transcriptPlanDetails || app.transcriptExpectedTiming) && (
        <div style={{ marginTop: 10, background: '#fff', border: '1px solid #e0e6f0', borderRadius: 8, padding: '9px 10px' }}>
          <p style={{ fontSize: 9.5, fontWeight: 800, color: '#888', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 5px' }}>Transfer Intake Plan</p>
          {priorSchools.length > 0 && <p style={{ fontSize: 12.5, color: '#1a1d24', margin: '0 0 5px' }}><strong>Schools:</strong> {priorSchools.map((school) => `${school.schoolName} (${school.attendancePeriod})`).join(' · ')}</p>}
          {app.currentEnrollmentStatus && <p style={{ fontSize: 12.5, color: '#1a1d24', margin: '0 0 5px' }}><strong>Current status:</strong> {labelTransferIntakeValue('currentEnrollmentStatus', app.currentEnrollmentStatus)}</p>}
          {app.recordsSituation && <p style={{ fontSize: 12.5, color: '#1a1d24', margin: '0 0 5px' }}><strong>Records:</strong> {labelTransferIntakeValue('recordsSituation', app.recordsSituation)} · {labelTransferIntakeValue('recordsHelpNeeded', app.recordsHelpNeeded)}</p>}
          <p style={{ fontSize: 12.5, color: '#1a1d24', margin: '0 0 5px', whiteSpace: 'pre-wrap' }}><strong>Courses:</strong> {app.transferCourseSummary || 'Not provided'}</p>
          {app.transcriptPlanDetails && <p style={{ fontSize: 12.5, color: '#1a1d24', margin: '0 0 5px', whiteSpace: 'pre-wrap' }}><strong>Legacy records plan:</strong> {app.transcriptPlanDetails}</p>}
          <p style={{ fontSize: 12.5, color: '#1a1d24', margin: 0 }}><strong>Expected:</strong> {labelTransferIntakeValue('transcriptExpectedTiming', app.transcriptExpectedTiming)}{app.graduationTargetDate ? ` · Family graduation target ${app.graduationTargetDate}` : ''}</p>
        </div>
      )}
      {review.requiredRecords && (
        <div style={{ marginTop: 10, background: '#fff', border: '1px solid #e0e6f0', borderRadius: 8, padding: '9px 10px' }}>
          <p style={{ fontSize: 9.5, fontWeight: 800, color: '#888', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 3px' }}>Records Needed</p>
          <p style={{ fontSize: 12.5, color: '#1a1d24', margin: 0, lineHeight: 1.45 }}>{review.requiredRecords}</p>
        </div>
      )}
      {transferNeedsRecordReview && (
        <div style={{ marginTop: 10, background: '#fff8e6', border: '1px solid #f3d27b', borderRadius: 8, padding: '9px 10px' }}>
          <p style={{ fontSize: 9.5, fontWeight: 800, color: '#8a5a00', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 3px' }}>Admin Record Review Required</p>
          <p style={{ fontSize: 12.5, color: '#5c4a12', margin: 0, lineHeight: 1.45 }}>
            Family transcript status is self-reported. Approve only after official transcript or verifiable school records are received and reviewed. Partial records may support an estimate, not final transfer credit.
          </p>
        </div>
      )}
      {review.familyNotes && review.familyNotes !== 'none' && (
        <div style={{ marginTop: 10, background: '#fff', border: '1px solid #e0e6f0', borderRadius: 8, padding: '9px 10px' }}>
          <p style={{ fontSize: 9.5, fontWeight: 800, color: '#888', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 3px' }}>Family Notes</p>
          <p style={{ fontSize: 12.5, color: '#1a1d24', margin: 0, lineHeight: 1.45 }}>{review.familyNotes}</p>
        </div>
      )}
    </div>
  );
}

function rejectionEmailText(app, reason) {
  const detail = REJECTION_REASONS.find(r => r.value === reason)?.detail || '';
  return `Subject: Your GIIS Application — Update

Dear ${app.parentName},

Thank you for your interest in Genesis of Ideas International School and for taking the time to apply on behalf of ${app.studentName}.

After reviewing your application, we are unfortunately unable to move forward at this time.${detail ? `\n\nReason: ${detail}` : ''}

We appreciate your consideration of GIIS and wish ${app.studentName} the very best in their academic journey.

If you have questions or believe this decision was made in error, please reply to this email or contact us at admissions@genesisideas.school.

Warm regards,
The GIIS Admissions Team
Genesis of Ideas International School
admissions@genesisideas.school`;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function responseSla(app) {
  if (app.firstResponseAt) return { code: 'responded', label: 'First response recorded' };
  if (!app.responseDueAt) return { code: 'untracked', label: 'Response due not set' };
  const due = new Date(app.responseDueAt);
  if (Number.isNaN(due.getTime())) return { code: 'untracked', label: 'Response due not set' };
  if (due.getTime() < Date.now()) return { code: 'overdue', label: `Response overdue · ${due.toLocaleString()}` };
  return { code: 'due', label: `Response due · ${due.toLocaleString()}` };
}

function hasConfirmedInterest(app) {
  if (app?.readiness?.code) return app.readiness.code !== 'unconfirmed';
  return !!app?.interestConfirmedAt || !app?.interestConfirmationExpiresAt;
}

function sortableTime(value) {
  const timestamp = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(timestamp) ? timestamp : Infinity;
}

export default function ApplicationsQueue({ language = 'en', toggleLanguage }) {
  const lang = language === 'zh' ? 'zh' : 'en';
  const isEn = lang === 'en';
  const T = (en, zh) => (isEn ? en : zh);
  const navigate = useNavigate();
  const [filter, setFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [confirmationFilter, setConfirmationFilter] = useState('confirmed');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState('');
  const [toast, setToast] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { appId, parentName, studentName }
  const [manualPaymentModal, setManualPaymentModal] = useState(null);
  const [manualPaymentReceipt, setManualPaymentReceipt] = useState(null);
  const [manualPaymentDraft, setManualPaymentDraft] = useState({
    planType: 'guided_monthly',
    paymentMethod: 'manual_stripe_invoice',
    paymentReference: '',
    note: '',
  });
  const [rejectReason, setRejectReason] = useState('grade_mismatch');
  const [notesDraft, setNotesDraft] = useState({}); // { [appId]: string }
  const [caseDrafts, setCaseDrafts] = useState({});
  const [workflowMode, setWorkflowMode] = useState('loading');
  const [worklistMode, setWorklistMode] = useState('all');
  const [readinessFilter, setReadinessFilter] = useState('');
  const [outreachFlow, setOutreachFlow] = useState(null);

  const session = getAdminSession();
  useEffect(() => { if (!session) navigate('/admin/login', { replace: true }); }, [session, navigate]);

  useEffect(() => {
    let active = true;
    async function checkWorkflow() {
      try {
        const response = await fetch(`${API}/api/checkout/tiers`, { method: 'HEAD' });
        if (!active) return;
        if (!response.ok) {
          setWorkflowMode('unavailable');
          return;
        }
        setWorkflowMode(response.headers.get('X-GIIS-Admissions-Workflow') === 'admissions-v5' ? 'serious' : 'legacy');
      } catch {
        if (active) setWorkflowMode('unavailable');
      }
    }
    checkWorkflow();
    return () => { active = false; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter ? `${API}/api/applications?status=${filter}` : `${API}/api/applications`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.status === 401) { navigate('/admin/login', { replace: true }); return; }
      const data = await res.json();
      setItems(data);
      // seed notes drafts from server
      const drafts = {};
      const trackingDrafts = {};
      data.forEach(a => { drafts[a.id] = a.adminNotes || ''; });
      data.forEach(a => {
        trackingDrafts[a.id] = {
          recordsStatus: a.recordsStatus || 'not_requested',
          assignedTo: a.assignedTo || '',
          nextAction: a.nextAction || 'Review application',
        };
      });
      setNotesDraft(prev => ({ ...drafts, ...prev }));
      setCaseDrafts(prev => ({ ...trackingDrafts, ...prev }));
    } finally { setLoading(false); }
  }, [filter, navigate]);

  useEffect(() => { if (session) load(); }, [session, load]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function saveNotes(id) {
    const notes = notesDraft[id] ?? '';
    setSaving(id + 'notes');
    try {
      await fetch(`${API}/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminNotes: notes }),
      });
      showToast('Notes saved');
    } finally { setSaving(''); }
  }

  async function updateStatus(id, status, extra = {}) {
    setSaving(id + status);
    try {
      const res = await fetch(`${API}/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, ...extra }),
      });
      if (!res.ok) { showToast('Error updating status'); return; }
      showToast(`Marked as ${status}`);
      setExpanded(null);
      load();
    } finally { setSaving(''); }
  }

  async function saveCaseTracking(id) {
    const draft = caseDrafts[id];
    if (!draft) return;
    setSaving(id + 'tracking');
    try {
      const res = await fetch(`${API}/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(data.error || 'Could not save case tracking'); return; }
      showToast('Case tracking saved');
      load();
    } finally { setSaving(''); }
  }

  async function markFamilyContacted(id) {
    setSaving(id + 'contacted');
    try {
      const res = await fetch(`${API}/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markContacted: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(data.error || 'Could not record family contact'); return false; }
      showToast('Family contact recorded');
      await load();
      return true;
    } finally { setSaving(''); }
  }

  function openOutreachFlow(app) {
    const channels = outreachChannelsFor(app);
    const preferred = channels.some((channel) => channel.value === app.contactPreference)
      ? app.contactPreference
      : channels[0]?.value || '';
    setOutreachFlow({
      app,
      step: 1,
      channel: preferred,
      messageLanguage: communicationLanguageFor(app),
      actionTaken: false,
    });
  }

  function moveOutreachFlow(changes) {
    setOutreachFlow((current) => current ? { ...current, ...changes } : current);
  }

  async function copyOutreachMessage(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Outreach message copied');
      moveOutreachFlow({ step: 3, actionTaken: true });
    } catch {
      showToast('Copy failed — select the preview manually');
    }
  }

  function openOutreachEmail(app, draft) {
    window.location.href = `mailto:${encodeURIComponent(app.parentEmail)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
    moveOutreachFlow({ step: 3, actionTaken: true });
  }

  async function confirmOutreachSent() {
    if (!outreachFlow?.actionTaken) return;
    const confirmed = window.confirm(
      `Confirm only after you actually contacted ${outreachFlow.app.parentName}. Opening or copying the draft is not enough. Continue?`
    );
    if (!confirmed) return;
    const recorded = await markFamilyContacted(outreachFlow.app.id);
    if (recorded) setOutreachFlow(null);
  }

  async function confirmRecordsRequestSent(app) {
    const confirmed = window.confirm(
      `Confirm only after the records-request message for ${app.studentName} has actually been sent. Copying the draft is not enough. Continue?`
    );
    if (!confirmed) return;
    setSaving(app.id + 'records-requested');
    try {
      const res = await fetch(`${API}/api/applications/${app.id}/records-requested`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(data.error || 'Could not record the records request'); return; }
      showToast(data.alreadyRequested ? 'Records request was already recorded' : 'Records request recorded');
      load();
    } finally { setSaving(''); }
  }

  function approveApplication(app, appReview) {
    if (appReview?.applicantType === 'transfer') {
      const ok = window.confirm(
        'Approve this transfer application only if official transcripts or verifiable school records have been received and reviewed. Family self-report is not record confirmation. Continue?'
      );
      if (!ok) return;
    }
    updateStatus(app.id, 'approved');
  }

  async function activateApplication(id) {
    setSaving(id + 'activate');
    try {
      const res = await fetch(`${API}/api/applications/${id}/activate`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Activation failed'); return; }
      setCredentials(data);
      load();
    } finally { setSaving(''); }
  }

  function openManualPayment(app) {
    setManualPaymentModal(app);
    setManualPaymentDraft({
      planType: 'guided_monthly',
      paymentMethod: 'manual_stripe_invoice',
      paymentReference: '',
      note: '',
    });
  }

  async function recordManualPayment() {
    if (!manualPaymentModal) return;
    const plan = MANUAL_PAYMENT_PLANS[manualPaymentDraft.planType];
    const reference = manualPaymentDraft.paymentReference.trim();
    const receiptDraft = {
      ...manualPaymentDraft,
      paymentReference: reference,
      amountCents: plan.amountCents,
      planLabel: plan.label,
      paymentMethodLabel: MANUAL_PAYMENT_METHODS[manualPaymentDraft.paymentMethod],
    };
    if (!reference) {
      showToast('Payment reference is required');
      return;
    }
    const ok = window.confirm(
      `Record ${plan.label} as manually paid for ${manualPaymentModal.studentName}? Confirm only after path review is complete and Stripe evidence exists.`
    );
    if (!ok) return;

    setSaving(manualPaymentModal.id + 'manual-payment');
    try {
      const res = await fetch(`${API}/api/applications/${manualPaymentModal.id}/manual-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          planType: manualPaymentDraft.planType,
          amountCents: plan.amountCents,
          paymentMethod: manualPaymentDraft.paymentMethod,
          paymentReference: reference,
          note: manualPaymentDraft.note,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Manual payment failed');
        return;
      }
      showToast(data.linkedToStudent ? 'Payment recorded and linked' : 'Payment recorded');
      setManualPaymentReceipt({
        app: manualPaymentModal,
        draft: receiptDraft,
        subscription: data.subscription,
        linkedToStudent: data.linkedToStudent,
      });
      setManualPaymentModal(null);
      load();
    } finally {
      setSaving('');
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(
      () => showToast('Copied to clipboard'),
      () => showToast('Copy failed — select manually'),
    );
  }

  function openRejectModal(app) {
    setRejectReason('grade_mismatch');
    setRejectModal(app);
  }

  async function confirmReject() {
    if (!rejectModal) return;
    await updateStatus(rejectModal.id, 'rejected', { rejectionReason: rejectReason });
    setRejectModal(null);
  }

  const visibleItems = (() => {
    const filtered = items.filter((app) => {
      if (typeFilter && applicationReviewFor(app)?.applicantType !== typeFilter) return false;
      if (confirmationFilter === 'confirmed' && !hasConfirmedInterest(app)) return false;
      if (confirmationFilter === 'unconfirmed' && hasConfirmedInterest(app)) return false;
      if (typeFilter === 'transfer' && readinessFilter && (app.readiness?.code || '') !== readinessFilter) return false;
      return true;
    });
    if (worklistMode === 'transfer') {
      return [...filtered].sort((a, b) => {
        const aOver = responseSla(a).code === 'overdue' ? 0 : 1;
        const bOver = responseSla(b).code === 'overdue' ? 0 : 1;
        if (aOver !== bOver) return aOver - bOver;
        const aDue = sortableTime(a.responseDueAt);
        const bDue = sortableTime(b.responseDueAt);
        if (aDue !== bDue) return aDue - bDue;
        const aCreated = sortableTime(a.createdAt);
        const bCreated = sortableTime(b.createdAt);
        return aCreated === bCreated ? 0 : aCreated - bCreated;
      });
    }
    return filtered;
  })();

  if (!session) return null;
  const workflowEnabled = workflowMode === 'serious';
  const outreachChannels = outreachFlow ? outreachChannelsFor(outreachFlow.app) : [];
  const outreachDraft = outreachFlow ? firstOutreachDraft(outreachFlow.app, outreachFlow.messageLanguage) : null;
  const selectedOutreachChannel = outreachChannels.find((channel) => channel.value === outreachFlow?.channel);

  return (
    <>
      <Helmet><title>Applications | GIIS Admin</title></Helmet>

      <AdminPage>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <AdminHeader
            language={language}
            toggleLanguage={toggleLanguage}
            title={T('Applications', '招生申请')}
            subtitle={T(
              'Review family inquiries, record manual payment evidence, and activate accounts only after review.',
              '审核家庭申请、记录人工付款证据，并在审核完成后启用帐号。',
            )}
          />

          {!workflowEnabled && (
            <div style={{ marginBottom: 16, padding: '10px 12px', border: '1px solid #f3d27b', background: '#fff8e6', color: '#5c4a12', borderRadius: 8, fontSize: 12.5, lineHeight: 1.55 }}>
              {workflowMode === 'loading'
                ? T('Checking admissions workflow compatibility…', '正在检查招生流程版本…')
                : T('The admissions backend update is not live yet. Existing cases remain visible, but the new review, approval, payment, and activation controls are paused.', '招生后端更新尚未上线。现有案件仍可查看，但新版审核、批准、付款与帐号启用操作已暂停。')}
            </div>
          )}

          {/* Worklist segmented control */}
          <div role="group" aria-label={T('Application worklist preset', '申请待办预设')} style={{ display: 'flex', marginBottom: 14, borderRadius: 8, overflow: 'hidden', border: '1.5px solid #d4d8e0', alignSelf: 'flex-start', width: 'fit-content' }}>
            {[
              ['all', T('All pending', '全部待审核')],
              ['transfer', T('Transfer worklist', '转学待办')],
            ].map(([mode, label], idx, arr) => (
              <button
                key={mode}
                type="button"
                aria-pressed={worklistMode === mode}
                onClick={() => {
                  if (worklistMode === mode) return;
                  if (mode === 'all') {
                    setFilter('pending'); setTypeFilter(''); setConfirmationFilter('confirmed');
                    setReadinessFilter(''); setWorklistMode('all');
                  } else {
                    setFilter('pending'); setTypeFilter('transfer'); setConfirmationFilter('confirmed');
                    setReadinessFilter(''); setWorklistMode('transfer');
                  }
                }}
                style={{
                  padding: '6px 14px', fontSize: 12.5, fontWeight: 700,
                  background: worklistMode === mode ? '#2b3d6d' : '#fff',
                  color: worklistMode === mode ? '#fff' : '#5c6578',
                  border: 'none', cursor: 'pointer',
                  borderRight: idx < arr.length - 1 ? '1.5px solid #d4d8e0' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="giis-admin-filter-tabs" style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                ['pending', T('Pending', '待审核')],
                ['approved', T('Approved', '已通过')],
                ['rejected', T('Rejected', '未通过')],
                ['', T('All', '全部')],
              ].map(([v, label]) => (
                <button key={v} type="button" onClick={() => { setFilter(v); setWorklistMode('custom'); }} style={{
                  padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                  background: filter === v ? '#2b3d6d' : '#fff',
                  color: filter === v ? '#fff' : '#5c6578',
                  border: filter === v ? 'none' : '1.5px solid #d4d8e0',
                  cursor: 'pointer',
                }}>
                  {label}
                </button>
              ))}
            </div>
            <select
              aria-label={T('Applicant type filter', '申请类型筛选')}
              value={typeFilter}
              onChange={(event) => {
                const val = event.target.value;
                setTypeFilter(val);
                setWorklistMode('custom');
                if (val !== 'transfer') setReadinessFilter('');
              }}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #d4d8e0', background: '#fff', color: '#2b3d6d', fontSize: 13, fontWeight: 700 }}
            >
              <option value="">{T('All applicant types', '全部申请类型')}</option>
              <option value="transfer">{T('Transfer students', '转学生')}</option>
              <option value="new">{T('New students', '一般新生')}</option>
            </select>
            <select
              aria-label={T('Parent confirmation filter', '家长确认筛选')}
              value={confirmationFilter}
              onChange={(event) => { setConfirmationFilter(event.target.value); setWorklistMode('custom'); }}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #d4d8e0', background: '#fff', color: '#2b3d6d', fontSize: 13, fontWeight: 700 }}
            >
              <option value="confirmed">{T('Interest confirmed', '已确认继续申请')}</option>
              <option value="unconfirmed">{T('Awaiting parent confirmation', '等待家长确认')}</option>
              <option value="">{T('All confirmation states', '全部确认状态')}</option>
            </select>
            {typeFilter === 'transfer' && (
              <select
                aria-label={T('Transfer stage filter', '转学阶段筛选')}
                value={readinessFilter}
                onChange={(event) => setReadinessFilter(event.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #d4d8e0', background: '#fff', color: '#2b3d6d', fontSize: 13, fontWeight: 700 }}
              >
                <option value="">{T('All stages', '全部阶段')}</option>
                <option value="records_pending">{T('Records pending', '待收资料')}</option>
                <option value="ready_for_academic_review">{T('Academic review', '学术审核')}</option>
                <option value="ready_for_principal_review">{T('Principal review', '校长审核')}</option>
                <option value="approval_ready">{T('Approval ready', '可批准')}</option>
              </select>
            )}
            <span style={{ fontSize: 13, color: '#9aa0ad', alignSelf: 'center', marginLeft: 4 }}>
              {loading ? '…' : T(`${visibleItems.length} item${visibleItems.length !== 1 ? 's' : ''}`, `${visibleItems.length} 笔`)}
            </span>
          </div>

          {/* Application cards */}
          {loading
            ? <p style={{ color: '#9aa0ad', fontSize: 14 }}>{T('Loading…', '载入中…')}</p>
            : visibleItems.length === 0
              ? <div style={{ background: '#fff', borderRadius: 12, padding: '40px 24px', textAlign: 'center', color: '#9aa0ad', fontSize: 14 }}>{T('No applications found.', '没有找到申请。')}</div>
              : visibleItems.map(app => {
                const sc = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
		                const es = app.enrollmentState || {};
		                const ec = ENROLLMENT_STATE_COLORS[es.code] || { bg: '#f1f5f9', fg: '#475569' };
		                const appReview = applicationReviewFor(app);
		                const transferNeedsRecordReview = appReview?.applicantType === 'transfer';
		                const interestConfirmed = hasConfirmedInterest(app);
		                const readiness = app.readiness || {};
		                const readinessColor = READINESS_COLORS[readiness.code] || READINESS_COLORS.unconfirmed;
			                const applicationApprovalReady = workflowEnabled && (readiness.code
			                  ? readiness.code === 'approval_ready'
			                  : interestConfirmed && (!transferNeedsRecordReview || (app.recordsStatus === 'verified' && app.transferEvaluation?.principalApprovedAt)));
		                const hasPaidRecord = !!(es.paid || es.paidUnlinked);
		                const sla = responseSla(app);
		                const slaColors = sla.code === 'overdue'
		                  ? { bg: '#fee2e2', fg: '#991b1b' }
		                  : sla.code === 'responded'
		                    ? { bg: '#dcfce7', fg: '#166534' }
		                    : { bg: '#fef3c7', fg: '#92400e' };
	                return (
                  <div key={app.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf5', marginBottom: 12, overflow: 'hidden' }}>

                    {/* Card header row */}
                    <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1d24' }}>{app.studentName}</span>
                          <span style={{ fontSize: 11, background: '#f0f4ff', color: '#2b3d6d', fontWeight: 700, borderRadius: 4, padding: '2px 7px' }}>{app.gradeLevel}</span>
                          <span style={{ fontSize: 11, background: sc.bg, color: sc.fg, fontWeight: 700, borderRadius: 4, padding: '2px 7px' }}>{sc.label}</span>
                          {appReview?.applicantType && <span style={{ fontSize: 11, background: transferNeedsRecordReview ? '#e0f2fe' : '#f3f4f6', color: transferNeedsRecordReview ? '#075985' : '#374151', fontWeight: 800, borderRadius: 4, padding: '2px 7px' }}>{labelApplicationValue('applicantType', appReview.applicantType)}</span>}
                          <span style={{ fontSize: 11, background: interestConfirmed ? '#dcfce7' : '#f3f4f6', color: interestConfirmed ? '#166534' : '#4b5563', fontWeight: 800, borderRadius: 4, padding: '2px 7px' }}>{interestConfirmed ? T('Interest confirmed', '家长已确认') : T('Unconfirmed', '尚未确认')}</span>
                          {readiness.label && <span style={{ fontSize: 11, background: readinessColor.bg, color: readinessColor.fg, fontWeight: 800, borderRadius: 4, padding: '2px 7px' }}>{readiness.label}</span>}
                          {(app.submissionCount || 1) > 1 && <span style={{ fontSize: 11, background: '#fee2e2', color: '#991b1b', fontWeight: 800, borderRadius: 4, padding: '2px 7px' }}>{app.submissionCount} submissions</span>}
                          <span style={{ fontSize: 11, background: slaColors.bg, color: slaColors.fg, fontWeight: 800, borderRadius: 4, padding: '2px 7px' }}>{sla.code === 'overdue' ? T('Response overdue', '回复逾期') : sla.code === 'responded' ? T('Responded', '已回复') : T('Response due', '待回复')}</span>
                          {es.label && <span style={{ fontSize: 11, background: ec.bg, color: ec.fg, fontWeight: 800, borderRadius: 4, padding: '2px 7px' }}>{es.label}</span>}
                          {app.accountsCreated && <span style={{ fontSize: 11, background: '#e8f5e9', color: '#2e7d32', fontWeight: 700, borderRadius: 4, padding: '2px 7px' }}>Accounts ✓</span>}
                        </div>
                        <p style={{ fontSize: 12, color: '#5c6578', margin: '0 0 2px' }}>
                          Parent: {app.parentName} · <a href={`mailto:${app.parentEmail}`} style={{ color: '#2b3d6d' }}>{app.parentEmail}</a>
                          {app.phone && ` · ${app.phone}`}
                        </p>
                        <p style={{ fontSize: 12, color: '#9aa0ad', margin: 0 }}>Submitted {timeAgo(app.createdAt)}{app.currentSchool && ` · ${app.currentSchool}`}</p>
                        <div style={{ marginTop: 9, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderLeft: `3px solid ${readinessColor.fg}`, background: readinessColor.bg, maxWidth: 650 }}>
                          <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 900, color: readinessColor.fg, textTransform: 'uppercase', paddingTop: 2 }}>{T('Next', '下一步')}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 750, color: '#26324f', lineHeight: 1.4 }}>{app.nextAction || readiness.action || 'Review application'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {workflowEnabled && (
                          <button
                            type="button"
                            onClick={() => openOutreachFlow(app)}
                            disabled={!interestConfirmed || outreachChannelsFor(app).length === 0}
                            title={!interestConfirmed ? T('Wait for parent email confirmation', '请先等待家长完成邮箱确认') : undefined}
                            style={{ padding: '7px 12px', borderRadius: 8, border: 0, background: interestConfirmed ? '#2b3d6d' : '#aab2c2', fontSize: 12, fontWeight: 800, color: '#fff', cursor: interestConfirmed ? 'pointer' : 'not-allowed' }}
                          >
                            {app.firstResponseAt ? T('Contact family', '联络家庭') : T('Start first outreach', '开始首次联络')}
                          </button>
                        )}
                        <button onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                          style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #d4d8e0', background: 'none', fontSize: 13, fontWeight: 600, color: '#2b3d6d', cursor: 'pointer' }}>
                          {expanded === app.id ? T('Close', '收起') : T('View', '查看')}
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {expanded === app.id && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f0f2f8' }}>

                        {/* Data grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginTop: 16, marginBottom: 16 }}>
                          {[
                            ['Student Name', app.studentName],
                            ['Date of Birth', app.dob],
                            ['Grade Level', app.gradeLevel],
                            ['Current School', app.currentSchool || '—'],
                            ['Target Universities', app.targetUniversities || '—'],
                            ['Instruction Language', app.preferredLanguage === 'zh' ? 'Chinese' : 'English'],
                            ['Family Communication', communicationLanguageLabel(app)],
                            ['Parent Name', app.parentName],
                            ['Parent Email', app.parentEmail],
                            ['Phone', app.phone || '—'],
                            ['Relationship', labelTransferIntakeValue('parentRelationship', app.parentRelationship)],
                            ['Contact Preference', labelTransferIntakeValue('contactPreference', app.contactPreference)],
                            ['Parent Confirmation', app.interestConfirmedAt ? new Date(app.interestConfirmedAt).toLocaleString() : (app.interestConfirmationSentAt ? 'Awaiting confirmation' : 'Legacy case')],
                            ['Application Readiness', readiness.label || '—'],
                            ['Readiness Action', readiness.action || '—'],
                            ['Records Status', RECORDS_STATUS_LABELS[app.recordsStatus] || app.recordsStatus || 'Not requested'],
                            ['Assigned Owner', app.assignedTo || 'Unassigned'],
                            ['Admissions Next Action', app.nextAction || 'Review application'],
                            ['Last Contacted', app.lastContactedAt ? new Date(app.lastContactedAt).toLocaleString() : 'Not contacted'],
                            ['Enrollment State', es.label || '—'],
                            ['Next Action', es.action || '—'],
                            ['Student Login', es.studentEmail || '—'],
                            ['Parent Login', es.parentLoginEmail || '—'],
                            ['Payment', es.subscriptionStatus ? `${es.subscriptionStatus}${es.paidUnlinked ? ' · unlinked' : ''}` : 'No payment yet'],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px' }}>{k}</p>
                              <p style={{ fontSize: 13, color: '#1a1d24', margin: 0, wordBreak: 'break-word' }}>{v}</p>
                            </div>
                          ))}
                        </div>

                        <ApplicantReviewPanel app={app} />

                        {transferNeedsRecordReview && workflowEnabled && interestConfirmed && (
                          <div style={{ marginBottom: 16, padding: '13px 14px', border: '1px solid #cfe0f8', borderRadius: 8, background: '#f8fbff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                              <div style={{ flex: '1 1 300px' }}>
                                <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 900, color: '#2b3d6d', letterSpacing: 1, textTransform: 'uppercase' }}>{T('Official Records Request', '正式记录申请')}</p>
                                <p style={{ margin: 0, color: '#5c6578', fontSize: 12.5, lineHeight: 1.55 }}>
                                  {T(
                                    'Copy the prepared message, review it, and send it yourself. Record the request only after it was actually sent.',
                                    '复制预填内容、人工检查并自行发送。只有确实发送后，才记录为已申请。',
                                  )}
                                </p>
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button type="button" onClick={() => copyToClipboard(recordsRequestDraft(app))} style={{ padding: '7px 11px', borderRadius: 8, border: '1.5px solid #2b3d6d', background: '#fff', color: '#2b3d6d', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                  {T('Copy request draft', '复制申请草稿')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => confirmRecordsRequestSent(app)}
                                  disabled={saving === app.id + 'records-requested' || ['requested', 'partial', 'received', 'verified'].includes(app.recordsStatus)}
                                  style={{ padding: '7px 11px', borderRadius: 8, border: 0, background: ['requested', 'partial', 'received', 'verified'].includes(app.recordsStatus) ? '#aab2c2' : '#2b3d6d', color: '#fff', fontSize: 12, fontWeight: 800, cursor: ['requested', 'partial', 'received', 'verified'].includes(app.recordsStatus) ? 'not-allowed' : 'pointer' }}
                                >
                                  {app.recordsStatus === 'requested'
                                    ? T('Request recorded', '已记录申请')
                                    : saving === app.id + 'records-requested'
                                      ? T('Recording…', '记录中…')
                                      : T('Confirm request sent', '确认已发送')}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {transferNeedsRecordReview && workflowEnabled && (
                          <TransferEvaluationEditor
                            application={app}
                            language={language}
                            notify={showToast}
                            onChanged={load}
                          />
                        )}
                        {transferNeedsRecordReview && !workflowEnabled && (
                          <p style={{ margin: '0 0 16px', padding: '10px 12px', background: '#f8f9fc', border: '1px solid #e0e6f0', color: '#5c6578', fontSize: 12.5 }}>
                            {T('Transfer evaluation will unlock after the admissions backend update is deployed.', '招生后端更新部署后，转学分审核步骤才会开放。')}
                          </p>
                        )}

                        {workflowEnabled && <div style={{ background: '#f8f9fc', border: '1px solid #e0e6f0', borderRadius: 8, padding: '13px 14px', marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 800, color: '#2b3d6d', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 3px' }}>{T('Case Tracking', '案件追踪')}</p>
                              <p style={{ fontSize: 11.5, color: slaColors.fg, margin: 0 }}>{sla.label}</p>
                            </div>
                            <span style={{ fontSize: 11.5, color: '#5c6578' }}>
                              {T('Use the guided outreach button above to prepare and record contact.', '请使用上方的联络引导来准备内容并记录联络。')}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                            <label style={{ fontSize: 10, fontWeight: 800, color: '#687083', textTransform: 'uppercase' }}>
                              {T('Records', '资料状态')}
                              <select
                                value={caseDrafts[app.id]?.recordsStatus || 'not_requested'}
                                onChange={(event) => setCaseDrafts(prev => ({ ...prev, [app.id]: { ...prev[app.id], recordsStatus: event.target.value } }))}
                                style={{ width: '100%', marginTop: 5, padding: '8px 9px', borderRadius: 8, border: '1.5px solid #d4d8e0', background: '#fff', fontSize: 12.5 }}
                              >
                                {Object.entries(RECORDS_STATUS_LABELS).map(([value, label]) => <option key={value} value={value} disabled={value === 'requested' && app.recordsStatus !== 'requested'}>{label}</option>)}
                              </select>
                            </label>
                            <label style={{ fontSize: 10, fontWeight: 800, color: '#687083', textTransform: 'uppercase' }}>
                              {T('Owner', '负责人')}
                              <input
                                value={caseDrafts[app.id]?.assignedTo || ''}
                                onChange={(event) => setCaseDrafts(prev => ({ ...prev, [app.id]: { ...prev[app.id], assignedTo: event.target.value } }))}
                                placeholder="Admissions owner"
                                style={{ width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '8px 9px', borderRadius: 8, border: '1.5px solid #d4d8e0', fontSize: 12.5 }}
                              />
                            </label>
                            <label style={{ fontSize: 10, fontWeight: 800, color: '#687083', textTransform: 'uppercase' }}>
                              {T('Next Action', '下一步')}
                              <input
                                value={caseDrafts[app.id]?.nextAction || ''}
                                onChange={(event) => setCaseDrafts(prev => ({ ...prev, [app.id]: { ...prev[app.id], nextAction: event.target.value } }))}
                                placeholder="Request records, schedule consultation, or review path"
                                style={{ width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '8px 9px', borderRadius: 8, border: '1.5px solid #d4d8e0', fontSize: 12.5 }}
                              />
                            </label>
                          </div>
                          <button
                            onClick={() => saveCaseTracking(app.id)}
                            disabled={saving === app.id + 'tracking'}
                            style={{ marginTop: 10, padding: '8px 14px', borderRadius: 8, background: '#2b3d6d', color: '#fff', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                          >
                            {saving === app.id + 'tracking' ? T('Saving…', '保存中…') : T('Save case tracking', '保存案件追踪')}
                          </button>
                        </div>}

                        {app.events?.length > 0 && (
                          <div style={{ borderTop: '1px solid #e0e6f0', borderBottom: '1px solid #e0e6f0', padding: '12px 0', marginBottom: 16 }}>
                            <p style={{ fontSize: 10, fontWeight: 800, color: '#2b3d6d', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 8px' }}>{T('Recent Case Activity', '近期案件活动')}</p>
                            <div style={{ display: 'grid', gap: 7 }}>
                              {app.events.slice(0, 10).map((event) => (
                                <div key={event.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(125px, auto) 1fr', gap: 10, fontSize: 11.5, lineHeight: 1.45 }}>
                                  <span style={{ color: '#7a8394' }}>{new Date(event.createdAt).toLocaleString()}</span>
                                  <span style={{ color: '#26324f' }}><strong>{event.actorEmail}</strong> · {event.summary}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rejection reason (if rejected) */}
                        {app.status === 'rejected' && app.rejectionReason && (
                          <div style={{ background: '#fce4ec', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#c62828', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <span><strong>Rejected:</strong> {REJECTION_REASONS.find(r => r.value === app.rejectionReason)?.label || app.rejectionReason}</span>
                            <button
                              onClick={() => copyToClipboard(rejectionEmailText(app, app.rejectionReason))}
                              style={{ fontSize: 12, fontWeight: 700, background: '#c62828', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
                              📋 Copy rejection email
                            </button>
                          </div>
                        )}

                        {/* Admin notes */}
                        <div style={{ marginBottom: 16 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px' }}>Admin notes (internal)</p>
                          <textarea
                            value={notesDraft[app.id] ?? app.adminNotes ?? ''}
                            onChange={e => setNotesDraft(prev => ({ ...prev, [app.id]: e.target.value }))}
                            onBlur={() => saveNotes(app.id)}
                            placeholder="e.g. Zoom scheduled for May 22 · Waiting for transcript · Strong applicant"
                            rows={2}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4d8e0', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'vertical', boxSizing: 'border-box', color: '#1a1d24' }}
                          />
                          <p style={{ fontSize: 11, color: '#9aa0ad', margin: '3px 0 0' }}>Auto-saves when you click away.</p>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {app.status === 'pending' && (<>
                            <button onClick={() => approveApplication(app, appReview)} disabled={!!saving || !applicationApprovalReady}
                              style={{ padding: '8px 18px', borderRadius: 8, background: '#2e7d32', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                              {applicationApprovalReady
                                ? T('Approve application', '批准申请')
                                : interestConfirmed
                                  ? T('Not approval-ready', '尚未达到批准条件')
                                  : T('Awaiting confirmation', '等待家长确认')}
                            </button>
                            <button onClick={() => openRejectModal(app)} disabled={!!saving}
                              style={{ padding: '8px 18px', borderRadius: 8, background: '#c62828', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                              ✗ Reject…
                            </button>
                          </>)}

		                          {workflowEnabled && app.status === 'approved' && !hasPaidRecord && applicationApprovalReady && (
	                            <button onClick={() => openManualPayment(app)} disabled={!!saving}
	                              style={{ padding: '8px 18px', borderRadius: 8, background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
	                              Record Manual Payment
	                            </button>
	                          )}
		                          {workflowEnabled && app.status === 'approved' && !hasPaidRecord && !applicationApprovalReady && (
	                            <span style={{ fontSize: 12, color: '#92400e', fontWeight: 700, padding: '8px 0' }}>{readiness.action || 'Complete readiness steps before payment'}</span>
	                          )}

		                          {workflowEnabled && app.status === 'approved' && !app.accountsCreated && hasPaidRecord && (
	                            <button onClick={() => activateApplication(app.id)} disabled={saving === app.id + 'activate'}
	                              style={{ padding: '8px 20px', borderRadius: 8, background: '#1a73e8', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
	                              {saving === app.id + 'activate' ? 'Creating…' : '🔑 Create Accounts'}
	                            </button>
	                          )}
		                          {workflowEnabled && app.status === 'approved' && !app.accountsCreated && !hasPaidRecord && (
	                            <span style={{ fontSize: 12, color: '#92400e', fontWeight: 700, padding: '8px 0' }}>Record payment before account activation</span>
	                          )}
		                          {workflowEnabled && app.status === 'approved' && app.accountsCreated && (
	                            <span style={{ fontSize: 12, color: '#2e7d32', fontWeight: 700, padding: '8px 0' }}>✓ Accounts created</span>
	                          )}
		                          {workflowEnabled && app.status === 'approved' && app.accountsCreated && !hasPaidRecord && (
	                            <button onClick={() => openManualPayment(app)} disabled={!!saving}
	                              style={{ padding: '8px 18px', borderRadius: 8, background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
	                              Record Manual Payment
	                            </button>
	                          )}

                          <button onClick={() => copyToClipboard(app.parentEmail)}
                            style={{ padding: '8px 14px', borderRadius: 8, background: 'none', border: '1.5px solid #d4d8e0', color: '#2b3d6d', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                            📋 Copy email
                          </button>

                          {app.status !== 'pending' && (
                            <button onClick={() => updateStatus(app.id, 'pending')} disabled={!!saving}
                              style={{ padding: '8px 14px', borderRadius: 8, background: 'none', border: '1.5px solid #d4d8e0', color: '#5c6578', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                              Reset to Pending
                            </button>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                );
              })
          }
        </div>
      </AdminPage>

      {outreachFlow && outreachDraft && (
        <div role="dialog" aria-modal="true" aria-labelledby="outreach-title" style={{ position: 'fixed', inset: 0, background: 'rgba(15,16,32,0.58)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: 'Inter, sans-serif', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '24px', maxWidth: 640, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.24)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <p style={{ margin: '0 0 5px', color: '#2b3d6d', fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>{T('Guided family contact', '家庭联络引导')}</p>
                <h2 id="outreach-title" style={{ margin: '0 0 5px', fontSize: 20, color: '#1a1d24' }}>
                  {outreachFlow.app.firstResponseAt ? T('Prepare family follow-up', '准备家庭后续联络') : T('Complete first outreach', '完成首次联络')}
                </h2>
                <p style={{ margin: 0, color: '#5c6578', fontSize: 12.5 }}>{outreachFlow.app.studentName} · {outreachFlow.app.parentName}</p>
              </div>
              <button type="button" onClick={() => setOutreachFlow(null)} aria-label={T('Close outreach guide', '关闭联络引导')} title={T('Close', '关闭')} style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid #d4d8e0', background: '#fff', color: '#5c6578', fontSize: 20, lineHeight: 1, cursor: 'pointer' }}>×</button>
            </div>

            <ol aria-label={T('Outreach progress', '联络进度')} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, listStyle: 'none', margin: '0 0 20px', padding: 0 }}>
              {[T('Channel', '方式'), T('Message', '内容'), T('Confirm', '确认')].map((label, index) => {
                const step = index + 1;
                return (
                  <li key={label} aria-current={outreachFlow.step === step ? 'step' : undefined} style={{ minWidth: 0 }}>
                    <div style={{ height: 4, borderRadius: 2, background: outreachFlow.step >= step ? '#2b3d6d' : '#dfe4ec', marginBottom: 6 }} />
                    <span style={{ display: 'block', fontSize: 11, fontWeight: outreachFlow.step === step ? 900 : 700, color: outreachFlow.step >= step ? '#2b3d6d' : '#8a92a1', overflowWrap: 'anywhere' }}>{step}. {label}</span>
                  </li>
                );
              })}
            </ol>

            {outreachFlow.step === 1 && (
              <div>
                <p style={{ margin: '0 0 10px', color: '#1a1d24', fontSize: 13.5, fontWeight: 800 }}>{T('How will you contact the family?', '您将如何联络家庭？')}</p>
                <div role="radiogroup" aria-label={T('Contact channel', '联络方式')} style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
                  {outreachChannels.map((channel) => (
                    <label key={channel.value} style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1.5px solid ${outreachFlow.channel === channel.value ? '#2b3d6d' : '#d4d8e0'}`, background: outreachFlow.channel === channel.value ? '#f0f4ff' : '#fff', borderRadius: 8, padding: '11px 12px', cursor: 'pointer' }}>
                      <input type="radio" name="outreach-channel" value={channel.value} checked={outreachFlow.channel === channel.value} onChange={() => moveOutreachFlow({ channel: channel.value })} style={{ accentColor: '#2b3d6d' }} />
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ display: 'block', color: '#1a1d24', fontSize: 13 }}>{channel.label}</strong>
                        <span style={{ display: 'block', color: '#5c6578', fontSize: 12, overflowWrap: 'anywhere' }}>{channel.contact}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <div role="group" aria-label={T('Message language', '讯息语言')} style={{ display: 'flex', border: '1.5px solid #d4d8e0', borderRadius: 8, overflow: 'hidden', width: 'fit-content', maxWidth: '100%', marginBottom: 18 }}>
                  {[['en', 'English'], ['zh', '中文'], ['bilingual', '双语']].map(([value, label], index, values) => (
                    <button key={value} type="button" aria-pressed={outreachFlow.messageLanguage === value} onClick={() => moveOutreachFlow({ messageLanguage: value })} style={{ border: 0, borderRight: index < values.length - 1 ? '1px solid #d4d8e0' : 0, padding: '8px 14px', background: outreachFlow.messageLanguage === value ? '#2b3d6d' : '#fff', color: outreachFlow.messageLanguage === value ? '#fff' : '#2b3d6d', fontWeight: 800, cursor: 'pointer' }}>{label}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => moveOutreachFlow({ step: 2 })} disabled={!selectedOutreachChannel} style={{ padding: '10px 16px', borderRadius: 8, border: 0, background: selectedOutreachChannel ? '#2b3d6d' : '#aab2c2', color: '#fff', fontWeight: 800, cursor: selectedOutreachChannel ? 'pointer' : 'not-allowed' }}>{T('Review message', '检查讯息')}</button>
                </div>
              </div>
            )}

            {outreachFlow.step === 2 && (
              <div>
                <p style={{ margin: '0 0 5px', color: '#1a1d24', fontSize: 13.5, fontWeight: 800 }}>{T('Review before using', '使用前请检查')}</p>
                <p style={{ margin: '0 0 12px', color: '#5c6578', fontSize: 12.5, lineHeight: 1.55 }}>{T('Opening or copying this draft does not mark the family as contacted.', '打开或复制草稿不会将家庭标记为已联络。')}</p>
                {outreachFlow.channel === 'email' && <p style={{ margin: '0 0 8px', color: '#26324f', fontSize: 12.5 }}><strong>{T('Subject', '主题')}:</strong> {outreachDraft.subject}</p>}
                <textarea aria-label={T('Outreach message preview', '联络讯息预览')} readOnly value={outreachDraft.body} rows={12} style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #d4d8e0', borderRadius: 8, padding: '11px 12px', fontFamily: 'Inter, sans-serif', fontSize: 12.5, lineHeight: 1.6, resize: 'vertical', color: '#1a1d24' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                  <button type="button" onClick={() => moveOutreachFlow({ step: 1, actionTaken: false })} style={{ padding: '9px 14px', borderRadius: 8, background: '#fff', border: '1.5px solid #d4d8e0', color: '#2b3d6d', fontWeight: 800, cursor: 'pointer' }}>{T('Back', '上一步')}</button>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => copyOutreachMessage(`${outreachFlow.channel === 'email' ? `Subject: ${outreachDraft.subject}\n\n` : ''}${outreachDraft.body}`)} style={{ padding: '9px 14px', borderRadius: 8, background: '#fff', border: '1.5px solid #2b3d6d', color: '#2b3d6d', fontWeight: 800, cursor: 'pointer' }}>{T('Copy message', '复制讯息')}</button>
                    {outreachFlow.channel === 'email' && (
                      <button type="button" onClick={() => openOutreachEmail(outreachFlow.app, outreachDraft)} style={{ padding: '9px 14px', borderRadius: 8, background: '#2b3d6d', border: 0, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{T('Open email draft', '打开邮件草稿')}</button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {outreachFlow.step === 3 && (
              <div>
                <div style={{ border: '1px solid #f3d27b', background: '#fff8e6', borderRadius: 8, padding: '12px 13px', marginBottom: 16, color: '#5c4a12', fontSize: 12.5, lineHeight: 1.6 }}>
                  {T('Return here only after the email, call, or message was actually completed. The final button records the contact time; it does not send anything.', '只有在邮件、电话或讯息确实完成后才回到这里。最后按钮只会记录联络时间，不会自动发送任何内容。')}
                </div>
                <p style={{ margin: '0 0 18px', color: '#1a1d24', fontSize: 13.5 }}><strong>{selectedOutreachChannel?.label || T('Selected channel', '已选方式')}:</strong> {selectedOutreachChannel?.contact || '—'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => moveOutreachFlow({ step: 2, actionTaken: false })} style={{ padding: '9px 14px', borderRadius: 8, background: '#fff', border: '1.5px solid #d4d8e0', color: '#2b3d6d', fontWeight: 800, cursor: 'pointer' }}>{T('Review again', '再次检查')}</button>
                  <button type="button" onClick={confirmOutreachSent} disabled={saving === outreachFlow.app.id + 'contacted'} style={{ padding: '10px 16px', borderRadius: 8, background: '#1b6b3a', border: 0, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{saving === outreachFlow.app.id + 'contacted' ? T('Recording…', '记录中…') : T('Confirm contact completed', '确认已完成联络')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a1a2e', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', zIndex: 9999 }}>
          {toast}
        </div>
      )}

      {/* Reject with reason modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: 'Inter, sans-serif', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 480, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>Reject application</h2>
            <p style={{ fontSize: 13, color: '#5c6578', margin: '0 0 20px' }}>
              {rejectModal.studentName} · {rejectModal.parentEmail}
            </p>

            <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 10px' }}>Reason</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {REJECTION_REASONS.map(r => (
                <label key={r.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${rejectReason === r.value ? '#2b3d6d' : '#e0e6f0'}`, background: rejectReason === r.value ? '#f0f4ff' : '#fff', cursor: 'pointer' }}>
                  <input type="radio" name="rejectReason" value={r.value} checked={rejectReason === r.value} onChange={() => setRejectReason(r.value)} style={{ marginTop: 2, accentColor: '#2b3d6d' }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1d24', margin: '0 0 2px' }}>{r.label}</p>
                    {r.detail && <p style={{ fontSize: 12, color: '#5c6578', margin: 0 }}>{r.detail}</p>}
                  </div>
                </label>
              ))}
            </div>

            <div style={{ background: '#f8f9fc', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#5c6578', marginBottom: 20, lineHeight: 1.6 }}>
              Confirming only marks the application rejected. No rejection email is sent automatically; use the copy button after review.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={confirmReject} disabled={!!saving}
                style={{ flex: 1, padding: '11px', borderRadius: 8, background: '#c62828', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                {saving ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
              <button onClick={() => setRejectModal(null)}
                style={{ padding: '11px 20px', borderRadius: 8, background: 'none', border: '1.5px solid #d4d8e0', color: '#5c6578', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create accounts credentials modal */}
      {credentials && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: 'Inter, sans-serif', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', maxWidth: 540, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#2e7d32', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>✓ Accounts Created</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 20px' }}>Account credentials created</h2>

            <div style={{ background: '#f4f6fa', borderRadius: 10, padding: '14px 18px', marginBottom: 16, fontSize: 13, lineHeight: 2 }}>
              <div><strong>Student Code:</strong> {credentials.studentCode}</div>
              <div><strong>Login URL:</strong> <a href={credentials.loginUrl} target="_blank" rel="noreferrer" style={{ color: '#1a73e8' }}>{credentials.loginUrl}</a></div>
              <div><strong>Parent Contact:</strong> {credentials.parentContactEmail || '—'}</div>
              <div><strong>Parent Login:</strong> {credentials.parentLoginEmail || credentials.parentEmail}</div>
              <div><strong>Parent Password:</strong> <code style={{ background: '#e8ecf5', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 14 }}>{credentials.parentPassword || credentials.tempPassword}</code></div>
              <div><strong>Student Login:</strong> {credentials.studentEmail || '—'}</div>
              <div><strong>Student Password:</strong> <code style={{ background: '#e8ecf5', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 14 }}>{credentials.studentPassword || '—'}</code></div>
              <div><strong>Linked Payments:</strong> {credentials.linkedSubscriptions ?? 0}</div>
            </div>

            <div style={{ background: '#eef6ff', border: '1px solid #2b3d6d', borderRadius: 10, padding: '13px 16px', marginBottom: 16 }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 800, color: '#2b3d6d', letterSpacing: '0.8px', textTransform: 'uppercase' }}>⚠ Required next step</p>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#26324f', lineHeight: 1.55 }}>
                Accounts exist but this student is <strong>not enrolled in any course yet</strong>. Enroll them now, otherwise the parent dashboard will look empty on first login.
              </p>
              <button
                onClick={() => { const sid = credentials.studentId; setCredentials(null); navigate(`/admin/transcript/${sid}`); }}
                disabled={!credentials.studentId}
                style={{ padding: '9px 16px', borderRadius: 8, background: '#2b3d6d', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', cursor: credentials.studentId ? 'pointer' : 'not-allowed', opacity: credentials.studentId ? 1 : 0.5 }}>
                Enroll in courses →
              </button>
            </div>

            <div style={{ background: '#fffde7', border: '1px solid #f9a825', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#5c4f00', marginBottom: 16 }}>
              A welcome email is sent automatically when email delivery is configured. Use the fallback copy only if the email log shows skipped or failed delivery.
            </div>

            <div style={{ background: '#f4f6fa', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', marginBottom: 16, color: '#1a1d24', lineHeight: 1.7 }}>
{`Subject: Your GIIS account is ready — next step

Hi ${(credentials.parentContactEmail || credentials.parentEmail) ? (credentials.parentContactEmail || credentials.parentEmail).split('@')[0] : ''},

Your child's GIIS account has been created. Please log in to complete enrollment:

Login: ${credentials.loginUrl}
Parent Portal email: ${credentials.parentLoginEmail || credentials.parentEmail}
Parent temp password: ${credentials.parentPassword || credentials.tempPassword}
Student Portal email: ${credentials.studentEmail || ''}
Student temp password: ${credentials.studentPassword || ''}

	${(credentials.linkedSubscriptions || 0) > 0 ? 'Payment has been recorded. After logging in, you will see the parent dashboard and first-week instructions.' : 'After logging in, please wait for admissions to confirm payment before full course access.'}

Welcome to GIIS!
— The GIIS Team`}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
	                onClick={() => copyToClipboard(`Subject: Your GIIS account is ready — next step\n\nHi ${(credentials.parentContactEmail || credentials.parentEmail) ? (credentials.parentContactEmail || credentials.parentEmail).split('@')[0] : ''},\n\nYour child's GIIS account has been created. Please log in to complete enrollment:\n\nLogin: ${credentials.loginUrl}\nParent Portal email: ${credentials.parentLoginEmail || credentials.parentEmail}\nParent temp password: ${credentials.parentPassword || credentials.tempPassword}\nStudent Portal email: ${credentials.studentEmail || ''}\nStudent temp password: ${credentials.studentPassword || ''}\n\n${(credentials.linkedSubscriptions || 0) > 0 ? 'Payment has been recorded. After logging in, you will see the parent dashboard and first-week instructions.' : 'After logging in, please wait for admissions to confirm payment before full course access.'}\n\nWelcome to GIIS!\n— The GIIS Team`)}
                style={{ flex: 1, padding: '11px', borderRadius: 8, background: '#2b3d6d', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                📋 Copy fallback welcome email
              </button>
              <button onClick={() => setCredentials(null)}
                style={{ padding: '11px 20px', borderRadius: 8, background: 'none', border: '1.5px solid #d4d8e0', color: '#5c6578', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        </div>
	      )}

      {/* Manual payment receipt modal */}
      {manualPaymentReceipt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: 'Inter, sans-serif', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 620, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#166534', letterSpacing: 1.4, textTransform: 'uppercase', margin: '0 0 8px' }}>Payment Recorded</p>
            <h2 style={{ fontSize: 21, fontWeight: 800, margin: '0 0 6px' }}>Copy family payment receipt</h2>
            <p style={{ fontSize: 13, color: '#5c6578', margin: '0 0 14px', lineHeight: 1.5 }}>
              Send this only after Stripe evidence is verified. Keep the Stripe reference in the outside-git admissions tracker.
            </p>
            <div style={{ background: '#f4f6fa', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', marginBottom: 16, color: '#1a1d24', lineHeight: 1.7, maxHeight: '45vh', overflow: 'auto' }}>
              {manualPaymentReceiptText(manualPaymentReceipt)}
            </div>
            <div style={{ background: '#fff8e6', border: '1px solid #f3d27b', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#5c4a12', marginBottom: 16, lineHeight: 1.5 }}>
              This receipt confirms a manual payment record. It does not promise credit transfer, accreditation completion, AP authorization, CEEB issuance, or college admission outcomes.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => copyToClipboard(manualPaymentReceiptText(manualPaymentReceipt))}
                style={{ flex: 1, padding: '11px', borderRadius: 8, background: '#2b3d6d', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                Copy payment receipt
              </button>
              <button
                onClick={() => setManualPaymentReceipt(null)}
                style={{ padding: '11px 20px', borderRadius: 8, background: 'none', border: '1.5px solid #d4d8e0', color: '#5c6578', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

	      {/* Manual payment modal */}
	      {manualPaymentModal && (
	        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: 'Inter, sans-serif', padding: 24 }}>
	          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 560, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
	            <p style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: 1.4, textTransform: 'uppercase', margin: '0 0 8px' }}>Manual Review Sales Mode</p>
	            <h2 style={{ fontSize: 21, fontWeight: 800, margin: '0 0 6px' }}>Record manual payment</h2>
	            <p style={{ fontSize: 13, color: '#5c6578', margin: '0 0 18px', lineHeight: 1.5 }}>
	              {manualPaymentModal.studentName} · {manualPaymentModal.parentEmail}. Use this only after application/path review and after Stripe evidence exists.
	            </p>

	            <div style={{ display: 'grid', gap: 12 }}>
	              <label style={fieldLabel}>
	                Plan
	                <select
	                  value={manualPaymentDraft.planType}
	                  onChange={(e) => setManualPaymentDraft(prev => ({ ...prev, planType: e.target.value }))}
	                  style={fieldControl}
	                >
	                  {Object.entries(MANUAL_PAYMENT_PLANS).map(([value, plan]) => (
	                    <option key={value} value={value}>{plan.label}</option>
	                  ))}
	                </select>
	              </label>
	              <div style={{ background: '#f8f9fc', border: '1px solid #e0e6f0', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#1a1d24' }}>
	                Amount to record: <strong>{money(MANUAL_PAYMENT_PLANS[manualPaymentDraft.planType].amountCents)}</strong>
	              </div>
	              <label style={fieldLabel}>
	                Payment method
	                <select
	                  value={manualPaymentDraft.paymentMethod}
	                  onChange={(e) => setManualPaymentDraft(prev => ({ ...prev, paymentMethod: e.target.value }))}
	                  style={fieldControl}
	                >
	                  {Object.entries(MANUAL_PAYMENT_METHODS).map(([value, label]) => (
	                    <option key={value} value={value}>{label}</option>
	                  ))}
	                </select>
	              </label>
	              <label style={fieldLabel}>
	                Stripe reference
	                <input
	                  value={manualPaymentDraft.paymentReference}
	                  onChange={(e) => setManualPaymentDraft(prev => ({ ...prev, paymentReference: e.target.value }))}
	                  placeholder="Invoice, payment link, receipt, or Dashboard reference"
	                  style={fieldControl}
	                />
	              </label>
	              <label style={fieldLabel}>
	                Internal note
	                <textarea
	                  value={manualPaymentDraft.note}
	                  onChange={(e) => setManualPaymentDraft(prev => ({ ...prev, note: e.target.value }))}
	                  placeholder="Optional: consultation date, records received, plan reason"
	                  rows={2}
	                  style={{ ...fieldControl, resize: 'vertical' }}
	                />
	              </label>
	            </div>

	            <div style={{ background: '#fff8e6', border: '1px solid #f3d27b', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#5c4a12', marginTop: 16, lineHeight: 1.5 }}>
	              This creates an active manual subscription record. It does not send a Stripe link, charge a card, or bypass the application review.
	            </div>

	            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
	              <button
	                onClick={recordManualPayment}
	                disabled={!!saving}
	                style={{ flex: 1, padding: '11px', borderRadius: 8, background: '#7c3aed', color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer' }}>
	                {saving ? 'Recording…' : 'Confirm Payment Recorded'}
	              </button>
	              <button
	                onClick={() => setManualPaymentModal(null)}
	                style={{ padding: '11px 20px', borderRadius: 8, background: 'none', border: '1.5px solid #d4d8e0', color: '#5c6578', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
	                Cancel
	              </button>
	            </div>
	          </div>
	        </div>
	      )}
	    </>
	  );
	}

const fieldLabel = { display: 'grid', gap: 6, fontSize: 11, fontWeight: 800, color: '#5c6578', letterSpacing: 0.8, textTransform: 'uppercase' };
const fieldControl = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #d4d8e0', borderRadius: 8, padding: '9px 11px', fontSize: 13, color: '#1a1d24', fontFamily: 'Inter, sans-serif' };
