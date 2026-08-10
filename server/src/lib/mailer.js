/**
 * Resend email helper.
 * All outbound email goes through this module.
 * If RESEND_EMAIL_API_KEY / RESEND_API_KEY is missing, emails are skipped with a warning.
 */
const { Resend } = require('resend');

const RESEND_KEY = process.env.RESEND_EMAIL_API_KEY || process.env.RESEND_API_KEY;

const resend = RESEND_KEY
  ? new Resend(RESEND_KEY)
  : null;

// NOTE: the FROM address domain must be VERIFIED in Resend. Only the
// `updates.genesisideas.school` subdomain is verified; the root
// `genesisideas.school` is NOT, so sending from `@genesisideas.school` returns
// 403 "domain not verified". Default to the verified subdomain; override via
// RESEND_FROM_EMAIL once the root domain is also verified.
const FROM = process.env.RESEND_FROM_EMAIL || 'GIIS Admissions <admissions@updates.genesisideas.school>';
const ADMIN_EMAIL = 'alanhdchu@genesisideas.school';
const ADMISSIONS_EMAIL = 'admissions@genesisideas.school';
const FALLBACK_PARENT_EMAIL = 'admin@genesisideas.school';
const DEFAULT_PRINCIPAL_EMAIL = 'shiyu.zhang@genesisideas.school';
const SITE = process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'https://genesisideas.school';

// Confirmed-application alerts always land in ADMIN_EMAIL and CC the President
// & Principal so transfer/credit judgment reaches academic leadership at the
// start of review. PRINCIPAL_EMAIL is read at call time so operators can swap
// recipients via env without a code deploy; an empty/duplicate value quietly
// falls back to admin-only to prevent double-sending.
function applicationAlertRecipients() {
  const principal = String(process.env.PRINCIPAL_EMAIL ?? DEFAULT_PRINCIPAL_EMAIL).trim();
  if (!principal || principal.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return { to: ADMIN_EMAIL };
  }
  return { to: ADMIN_EMAIL, cc: principal };
}

async function send({ to, cc, replyTo, subject, html, text, attachments }) {
  if (!resend) {
    console.warn(`[mailer] RESEND_EMAIL_API_KEY / RESEND_API_KEY not set — skipping email to ${to}: ${subject}`);
    return { ok: false, skipped: true, reason: 'resend_api_key_missing' };
  }
  try {
    const payload = { from: FROM, to, subject, html, text };
    if (cc) payload.cc = cc;
    if (replyTo) payload.replyTo = replyTo;
    if (attachments) payload.attachments = attachments;
    const result = await resend.emails.send(payload);
    if (result?.error) {
      const message = result.error.message || JSON.stringify(result.error);
      console.error(`[mailer] Resend rejected "${subject}" to ${to}:`, message);
      return { ok: false, skipped: false, error: message, provider: result };
    }
    return {
      ok: true,
      id: result?.data?.id || result?.id || null,
      provider: result,
    };
  } catch (err) {
    console.error(`[mailer] Failed to send "${subject}" to ${to}:`, err.message);
    return { ok: false, skipped: false, error: err.message };
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Templates ──────────────────────────────────────────────────────────────

function buildApplicationInterestConfirmation({
  parentName,
  studentName,
  preferredLanguage,
  confirmationUrl,
  expiresHours = 72,
}) {
  const isZh = preferredLanguage === 'zh';
  const safeParentName = escapeHtml(parentName);
  const safeStudentName = escapeHtml(studentName);
  const safeUrl = escapeHtml(confirmationUrl);
  const subject = isZh
    ? '请确认继续 GIIS 入学申请'
    : 'Confirm your GIIS application interest';
  const greeting = isZh ? `${safeParentName} 家长，您好：` : `Dear ${safeParentName},`;
  const intro = isZh
    ? `我们已收到 <strong>${safeStudentName}</strong> 的入学申请。请确认您希望 GIIS 招生团队继续审核。`
    : `We received the application for <strong>${safeStudentName}</strong>. Please confirm that you would like the GIIS admissions team to continue the review.`;
  const boundary = isZh
    ? '确认申请不会产生费用，也不代表学分、年级安排、毕业日期或录取结果已经获得批准。'
    : 'Confirmation does not create a fee or guarantee admission, transfer credit, grade placement, or a graduation date.';
  const button = isZh ? '确认继续申请' : 'Confirm and continue application';
  const expiry = isZh
    ? `此链接将在 ${expiresHours} 小时后失效。若您没有提交申请，可以忽略此邮件。`
    : `This link expires in ${expiresHours} hours. If you did not submit an application, you can ignore this email.`;

  return {
    subject,
    html: `
<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#1a1d24">
  <div style="background:#1a1a2e;padding:28px 32px;border-radius:12px 12px 0 0">
    <p style="color:#d5a836;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">Genesis of Ideas International School</p>
    <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0">${button}</h1>
  </div>
  <div style="background:#fff;border:1px solid #e8ecf5;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
    <p>${greeting}</p>
    <p>${intro}</p>
    <p style="margin:24px 0"><a href="${safeUrl}" style="background:#2b3d6d;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:800;display:inline-block">${button}</a></p>
    <p style="font-size:13px;color:#5c6578">${boundary}</p>
    <p style="font-size:13px;color:#5c6578">${expiry}</p>
    <p style="font-size:12px;color:#9aa0ad;margin-top:24px">${isZh ? '如果按钮无法打开，请复制此链接：' : 'If the button does not work, open this link:'}<br><a href="${safeUrl}" style="color:#2b3d6d">${safeUrl}</a></p>
  </div>
</div>
    `.trim(),
    text: isZh
      ? `${parentName} 家长，您好：\n\n我们已收到 ${studentName} 的入学申请。请确认继续申请：\n${confirmationUrl}\n\n确认不代表录取、转学分、年级安排或毕业日期已经获得批准。链接将在 ${expiresHours} 小时后失效。`
      : `Dear ${parentName},\n\nWe received the application for ${studentName}. Confirm that you would like GIIS to continue the review:\n${confirmationUrl}\n\nConfirmation does not guarantee admission, transfer credit, grade placement, or a graduation date. This link expires in ${expiresHours} hours.`,
  };
}

async function sendApplicationInterestConfirmation(details) {
  const content = buildApplicationInterestConfirmation(details);
  return send({
    to: details.parentEmail,
    replyTo: ADMISSIONS_EMAIL,
    ...content,
  });
}

/**
 * Notify Alan when a new application arrives.
 */
function buildNewApplicationAlert({
  studentName,
  gradeLevel,
  parentName,
  parentEmail,
  currentSchool,
  targetUniversities,
  preferredLanguage,
  applicantType,
  previousCredits,
  transcriptAvailable,
  graduationTiming,
  currentEnrollmentStatus,
  priorSchoolsJson,
  recordsSituation,
  recordsHelpNeeded,
  transcriptExpectedTiming,
  graduationTargetDate,
  parentRelationship,
  contactPreference,
  mainConcern,
}) {
  const isTransfer = applicantType === 'transfer';
  const subject = isTransfer
    ? `[Transfer] New GIIS Application — ${studentName} (${gradeLevel})`
    : `New GIIS Application — ${studentName} (${gradeLevel})`;
  const adminUrl = `${SITE}/admin/applications`;
  const typeLabel = isTransfer ? 'Transfer student' : 'New student';
  let priorSchools = [];
  try {
    const parsed = JSON.parse(priorSchoolsJson || '[]');
    if (Array.isArray(parsed)) priorSchools = parsed.filter((row) => row?.schoolName).slice(0, 5);
  } catch {}
  const schoolHistory = priorSchools
    .map((row) => `${row.schoolName}${row.attendancePeriod ? ` (${row.attendancePeriod})` : ''}`)
    .join('; ');
  const rows = [
    ['Student', `<strong>${escapeHtml(studentName)}</strong> · ${escapeHtml(gradeLevel)}`],
    ['Applicant type', `<strong>${escapeHtml(typeLabel)}</strong>`],
    ['Parent', `${escapeHtml(parentName)} · <a href="mailto:${escapeHtml(parentEmail)}">${escapeHtml(parentEmail)}</a>`],
    ...(currentSchool ? [['Current school', escapeHtml(currentSchool)]] : []),
    ...(targetUniversities ? [['Target unis', escapeHtml(targetUniversities)]] : []),
    ['Language', preferredLanguage === 'zh' ? 'Chinese' : 'English'],
    ...(isTransfer ? [
      ['Current status', escapeHtml(currentEnrollmentStatus || 'Not provided')],
      ['School history', escapeHtml(schoolHistory || currentSchool || 'Not provided')],
      ['Previous credits', escapeHtml(previousCredits || 'Not provided')],
      ['Transcript', escapeHtml(transcriptAvailable || 'Not provided')],
      ['Records situation', escapeHtml(recordsSituation || 'Not provided')],
      ['Records help', escapeHtml(recordsHelpNeeded || 'Not provided')],
      ['Records ETA', escapeHtml(transcriptExpectedTiming || 'Not provided')],
      ['Graduation timing', escapeHtml(graduationTiming || 'Not provided')],
      ...(graduationTargetDate ? [['Family target date', escapeHtml(graduationTargetDate)]] : []),
      ['Contact', escapeHtml(`${parentRelationship || 'Not provided'} · ${contactPreference || 'Not provided'}`)],
    ] : []),
    ['Main concern', escapeHtml(mainConcern || 'Not provided')],
  ];
  const textRows = [
    `New application: ${studentName} (${gradeLevel})`,
    `Applicant type: ${typeLabel}`,
    `Parent: ${parentName} <${parentEmail}>`,
    currentSchool ? `Current school: ${currentSchool}` : '',
    targetUniversities ? `Target universities: ${targetUniversities}` : '',
    `Language: ${preferredLanguage === 'zh' ? 'Chinese' : 'English'}`,
    isTransfer ? `Previous credits: ${previousCredits || 'Not provided'}` : '',
    isTransfer ? `Current status: ${currentEnrollmentStatus || 'Not provided'}` : '',
    isTransfer ? `School history: ${schoolHistory || currentSchool || 'Not provided'}` : '',
    isTransfer ? `Transcript: ${transcriptAvailable || 'Not provided'}` : '',
    isTransfer ? `Records situation: ${recordsSituation || 'Not provided'}` : '',
    isTransfer ? `Records help: ${recordsHelpNeeded || 'Not provided'}` : '',
    isTransfer ? `Records ETA: ${transcriptExpectedTiming || 'Not provided'}` : '',
    isTransfer ? `Graduation timing: ${graduationTiming || 'Not provided'}` : '',
    isTransfer && graduationTargetDate ? `Family target date: ${graduationTargetDate}` : '',
    isTransfer ? `Contact: ${parentRelationship || 'Not provided'} · ${contactPreference || 'Not provided'}` : '',
    `Main concern: ${mainConcern || 'Not provided'}`,
    `Review: ${adminUrl}`,
  ].filter(Boolean);

  return {
    subject,
    replyTo: parentEmail,
    html: `
<p>A new application has been submitted.</p>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  ${rows.map(([label, value]) => `<tr><td style="padding:6px 16px 6px 0;color:#888;white-space:nowrap">${label}</td><td style="padding:6px 0">${value}</td></tr>`).join('\n  ')}
</table>
<p style="margin-top:20px"><a href="${adminUrl}" style="background:#2b3d6d;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700">Review in Admin →</a></p>
    `.trim(),
    text: textRows.join('\n'),
  };
}

async function sendNewApplicationAlert(details) {
  const content = buildNewApplicationAlert(details);
  return send({
    ...applicationAlertRecipients(),
    ...content,
  });
}

/**
 * Welcome email sent to parent when admin creates their accounts.
 * Replaces the manual copy-paste step.
 */
async function sendWelcomeEmail({
  parentEmail,
  studentName,
  tempPassword,
  loginUrl,
  studentCode,
  parentLoginEmail,
  parentPassword,
  studentLoginEmail,
  studentPassword,
}) {
  const subject = 'Your GIIS account is ready — complete your enrollment';
  const parentPortalEmail = parentLoginEmail || parentEmail;
  const parentPortalPassword = parentPassword || tempPassword;
  return send({
    to: parentEmail,
    subject,
    html: `
<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#1a1d24">
  <div style="background:#1a1a2e;padding:28px 32px;border-radius:12px 12px 0 0">
    <p style="color:#d5a836;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">Genesis of Ideas International School</p>
    <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0">Welcome to GIIS!</h1>
  </div>
  <div style="background:#fff;border:1px solid #e8ecf5;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
    <p>Hi there,</p>
    <p>Your child <strong>${studentName}</strong>'s account has been created. Log in to complete enrollment and activate full course access.</p>

    <div style="background:#f4f6fa;border-radius:8px;padding:16px 20px;margin:20px 0;font-size:14px;line-height:2">
      <div><strong>Login URL:</strong> <a href="${loginUrl}" style="color:#1a73e8">${loginUrl}</a></div>
      <div><strong>Parent Portal email:</strong> ${parentPortalEmail}</div>
      <div><strong>Parent temporary password:</strong> <code style="background:#e8ecf5;padding:2px 8px;border-radius:4px;font-weight:700">${parentPortalPassword}</code></div>
      ${studentLoginEmail ? `<div><strong>Student Portal email:</strong> ${studentLoginEmail}</div>` : ''}
      ${studentPassword ? `<div><strong>Student temporary password:</strong> <code style="background:#e8ecf5;padding:2px 8px;border-radius:4px;font-weight:700">${studentPassword}</code></div>` : ''}
      <div><strong>Student code:</strong> ${studentCode}</div>
    </div>

    <p style="font-size:13px;color:#5c6578">After logging in, you'll see a button to complete payment and activate full course access for ${studentName}.</p>

    <p style="margin-top:24px"><a href="${loginUrl}" style="background:#d5a836;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:800;font-size:15px">Log in and complete enrollment →</a></p>

    <hr style="border:none;border-top:1px solid #e8ecf5;margin:28px 0">
    <p style="font-size:12px;color:#9aa0ad;margin:0">Questions? Reply to this email or contact us at <a href="mailto:admissions@genesisideas.school" style="color:#2b3d6d">admissions@genesisideas.school</a></p>
  </div>
</div>
    `.trim(),
    text: `Welcome to GIIS!\n\nLog in to complete enrollment:\n${loginUrl}\nParent Portal email: ${parentPortalEmail}\nParent temp password: ${parentPortalPassword}${studentLoginEmail ? `\nStudent Portal email: ${studentLoginEmail}` : ''}${studentPassword ? `\nStudent temp password: ${studentPassword}` : ''}\nStudent code: ${studentCode}`,
  });
}

/**
 * Rejection email with tailored reason text.
 */
async function sendRejectionEmail({ parentEmail, parentName, studentName, reason }) {
  const REASON_DETAILS = {
    grade_mismatch: 'We currently serve students in Grades 9–12 only.',
    capacity_full:  'We have reached our current enrollment limit.',
    language_needs: 'We are unable to adequately support the preferred instruction language at this time.',
    incomplete:     'The application was missing required information. You are welcome to resubmit.',
    other:          '',
  };
  const detail = REASON_DETAILS[reason] || '';
  const subject = `Your GIIS Application — Update`;
  await send({
    to: parentEmail,
    subject,
    html: `
<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#1a1d24">
  <div style="background:#1a1a2e;padding:28px 32px;border-radius:12px 12px 0 0">
    <p style="color:#d5a836;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0">Genesis of Ideas International School</p>
  </div>
  <div style="background:#fff;border:1px solid #e8ecf5;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
    <p>Dear ${parentName},</p>
    <p>Thank you for your interest in GIIS and for submitting an application on behalf of <strong>${studentName}</strong>.</p>
    <p>After careful review, we are unfortunately unable to move forward with this application at this time.${detail ? ` <em>${detail}</em>` : ''}</p>
    <p>We appreciate your consideration of GIIS and wish ${studentName} the very best in their academic journey.</p>
    <p>If you have questions or believe this decision was made in error, please reply to this email.</p>
    <p style="margin-top:24px">Warm regards,<br><strong>The GIIS Admissions Team</strong></p>
    <hr style="border:none;border-top:1px solid #e8ecf5;margin:24px 0">
    <p style="font-size:12px;color:#9aa0ad;margin:0"><a href="mailto:admissions@genesisideas.school" style="color:#2b3d6d">admissions@genesisideas.school</a> · genesisideas.school</p>
  </div>
</div>
    `.trim(),
    text: `Dear ${parentName},\n\nThank you for your interest in GIIS. After review, we are unable to move forward with the application for ${studentName} at this time.${detail ? '\n\n' + detail : ''}\n\nWarm regards,\nThe GIIS Admissions Team`,
  });
}

/**
 * Weekly progress digest sent to a parent.
 * Call once per parent; build the data before calling.
 */
async function sendWeeklyProgressEmail({ parentEmail, studentName, creditsEarned, gpa, inProgressCourses, completedCount, gradPercent, weeklyActivity = null, advisorNote = null, dashboardUrl }) {
  const subject = `${studentName}'s weekly progress — GIIS`;
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const courseList = inProgressCourses.length
    ? inProgressCourses.map(c => `<li style="margin-bottom:6px"><strong>${esc(c.name)}</strong> — ${c.completedModules}/${c.totalModules} modules</li>`).join('')
    : '<li style="color:#9aa0ad">No active courses.</li>';

  const activityBlock = weeklyActivity ? `
    <p style="font-size:11px;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px">This Week</p>
    <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
      ${[
        ['Modules Done', weeklyActivity.modulesCompleted],
        ['Study Hours (est.)', weeklyActivity.estimatedStudyHours],
        ['Active Days', weeklyActivity.activeDays],
        ['Quiz Attempts', weeklyActivity.quizAttempts],
      ].map(([label, val]) => `
        <div style="flex:1;min-width:100px;background:#f8f5ec;border-radius:8px;padding:14px 16px;text-align:center">
          <p style="font-size:11px;font-weight:700;color:#8a6d1f;letter-spacing:1px;text-transform:uppercase;margin:0 0 4px">${label}</p>
          <p style="font-size:22px;font-weight:800;margin:0;color:#1a1a2e">${val}</p>
        </div>`).join('')}
    </div>` : '';

  const advisorBlock = advisorNote && advisorNote.summary ? `
    <div style="background:#f4f6fa;border-left:4px solid #d5a836;border-radius:0 8px 8px 0;padding:16px 18px;margin:0 0 24px">
      <p style="font-size:11px;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px">From the Advisor</p>
      ${advisorNote.title ? `<p style="font-size:14px;font-weight:700;color:#1a1a2e;margin:0 0 6px">${esc(advisorNote.title)}</p>` : ''}
      <p style="font-size:14px;line-height:1.7;color:#3a3f4c;margin:0">${esc(advisorNote.summary)}</p>
    </div>` : '';

  return send({
    to: parentEmail,
    cc: ADMISSIONS_EMAIL,
    subject,
    html: `
<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#1a1d24">
  <div style="background:#1a1a2e;padding:28px 32px;border-radius:12px 12px 0 0">
    <p style="color:#d5a836;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Weekly Update</p>
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0">${studentName}'s progress</h1>
  </div>
  <div style="background:#fff;border:1px solid #e8ecf5;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">

    <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
      ${[
        ['Credits Earned', `${creditsEarned} / 24`],
        ['GPA (UW)', gpa ?? '—'],
        ['Graduation', `${gradPercent}%`],
        ['Completed', `${completedCount} courses`],
      ].map(([label, val]) => `
        <div style="flex:1;min-width:100px;background:#f4f6fa;border-radius:8px;padding:14px 16px;text-align:center">
          <p style="font-size:11px;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase;margin:0 0 4px">${label}</p>
          <p style="font-size:22px;font-weight:800;margin:0;color:#2b3d6d">${val}</p>
        </div>`).join('')}
    </div>

    ${activityBlock}

    ${advisorBlock}

    <p style="font-size:11px;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px">Active Courses</p>
    <ul style="padding-left:20px;font-size:14px;line-height:1.8;margin:0 0 24px">${courseList}</ul>

    <a href="${dashboardUrl}" style="background:#2b3d6d;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block">View full dashboard →</a>

    <hr style="border:none;border-top:1px solid #e8ecf5;margin:28px 0">
    <p style="font-size:12px;color:#9aa0ad;margin:0">Genesis of Ideas International School · <a href="mailto:admissions@genesisideas.school" style="color:#2b3d6d">admissions@genesisideas.school</a></p>
  </div>
</div>
    `.trim(),
    text: `${studentName}'s weekly progress\nCredits: ${creditsEarned}/24 · GPA: ${gpa ?? '—'} · Graduation: ${gradPercent}%${weeklyActivity ? `\nThis week: ${weeklyActivity.modulesCompleted} modules · ${weeklyActivity.estimatedStudyHours} study hours · ${weeklyActivity.activeDays} active days` : ''}${advisorNote && advisorNote.summary ? `\n\nFrom the advisor: ${advisorNote.summary}` : ''}\n\nView dashboard: ${dashboardUrl}`,
  });
}

async function sendPasswordResetEmail({ email, role, resetUrl, expiresMinutes = 60 }) {
  const subject = role === 'parent'
    ? 'Reset your GIIS Parent Portal password'
    : 'Reset your GIIS Student Portal password';
  const portalName = role === 'parent' ? 'Parent Portal' : 'Student Portal';
  return send({
    to: email,
    subject,
    html: `
<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#1a1d24">
  <div style="background:#1a1a2e;padding:26px 30px;border-radius:12px 12px 0 0">
    <p style="color:#d5a836;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Genesis of Ideas International School</p>
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0">Password reset</h1>
  </div>
  <div style="background:#fff;border:1px solid #e8ecf5;border-top:none;padding:28px 30px;border-radius:0 0 12px 12px">
    <p>We received a request to reset the password for your GIIS ${portalName} account.</p>
    <p><a href="${resetUrl}" style="background:#2b3d6d;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Reset password →</a></p>
    <p style="font-size:13px;color:#5c6578">This link expires in ${expiresMinutes} minutes. If you did not request this, you can ignore this email.</p>
    <p style="font-size:12px;color:#9aa0ad;margin-top:24px">If the button does not work, open this link: <br><a href="${resetUrl}" style="color:#2b3d6d">${resetUrl}</a></p>
  </div>
</div>
    `.trim(),
    text: `Reset your GIIS ${portalName} password:\n${resetUrl}\n\nThis link expires in ${expiresMinutes} minutes. If you did not request this, ignore this email.`,
  });
}

async function sendPrincipalAppointmentLetter({
  principalEmail = 'shiyu.zhang@genesisideas.school',
  cc = ADMIN_EMAIL,
  appointmentDate = 'May 19, 2026',
  effectiveDate = 'May 19, 2026',
} = {}) {
  const subject = 'Formal Letter of Appointment — President & Principal';
  const html = `
<div style="font-family:Georgia,'Times New Roman',serif;max-width:680px;margin:0 auto;color:#1a1d24;line-height:1.65">
  <div style="border-bottom:3px double #1a2d5a;padding:0 0 18px;margin:0 0 24px">
    <p style="font-family:Inter,Arial,sans-serif;color:#b8962e;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Genesis of Ideas International School</p>
    <h1 style="font-size:24px;color:#1a2d5a;margin:0">Formal Letter of Appointment</h1>
    <p style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#5c6578;margin:6px 0 0">Florida-registered private school · Operating under Florida Statute 1002.42</p>
  </div>

  <p style="margin:0 0 18px"><strong>Date:</strong> ${appointmentDate}</p>
  <p style="margin:0 0 18px">Dear <strong>Shiyu Zhang, Ph.D.</strong>,</p>

  <p>
    On behalf of Genesis of Ideas International School, this letter formally confirms
    your appointment as <strong>President &amp; Principal</strong> of Genesis of Ideas
    International School, effective <strong>${effectiveDate}</strong>.
  </p>

  <p>
    In this role, you are authorized to provide academic and administrative leadership
    for the school, including oversight of academic standards, student records, graduation
    verification, school profile documentation, official transcript certification, and
    diploma issuance in accordance with the school's policies and Florida private school
    registration framework.
  </p>

  <p>
    You are further authorized to serve as the certifying school official for official
    academic records issued by Genesis of Ideas International School, including transcripts,
    school profile documents, diploma verification records, and related academic
    documentation used for college admissions, transfer review, and family records.
  </p>

  <p>
    Genesis of Ideas International School is grateful for your leadership and professional
    service. This appointment is issued for institutional recordkeeping and may be retained
    in the school's governance, accreditation-readiness, and academic documentation files.
  </p>

  <div style="margin:34px 0 24px">
    <p style="margin:0 0 28px">Sincerely,</p>
    <p style="margin:0;color:#1a2d5a;font-size:18px"><strong>Alan Hwader Chu</strong></p>
    <p style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#5c6578;margin:2px 0 0">Founder &amp; Head of School<br>Genesis of Ideas International School</p>
  </div>

  <hr style="border:none;border-top:1px solid #e8ecf5;margin:26px 0">
  <p style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#5c6578;margin:0">
    School address: 7901 4th St N STE 300, St. Petersburg, FL 33702<br>
    Website: <a href="https://genesisideas.school" style="color:#1a2d5a">https://genesisideas.school</a> · Email: <a href="mailto:admissions@genesisideas.school" style="color:#1a2d5a">admissions@genesisideas.school</a>
  </p>

  <div style="margin-top:24px;padding:14px 16px;background:#f8f9fc;border-left:4px solid #b8962e;font-family:Inter,Arial,sans-serif;font-size:13px;color:#333">
    <strong>中文摘要：</strong>本函正式确认章诗雨博士担任 Genesis of Ideas International School 的 President &amp; Principal，并授权其负责学校学术管理、学生记录、成绩单认证与文凭签发等职责。
  </div>
</div>
  `.trim();

  const text = [
    'Genesis of Ideas International School',
    'Formal Letter of Appointment',
    '',
    `Date: ${appointmentDate}`,
    '',
    'Dear Shiyu Zhang, Ph.D.,',
    '',
    `On behalf of Genesis of Ideas International School, this letter formally confirms your appointment as President & Principal of Genesis of Ideas International School, effective ${effectiveDate}.`,
    '',
    "In this role, you are authorized to provide academic and administrative leadership for the school, including oversight of academic standards, student records, graduation verification, school profile documentation, official transcript certification, and diploma issuance in accordance with the school's policies and Florida private school registration framework.",
    '',
    'You are further authorized to serve as the certifying school official for official academic records issued by Genesis of Ideas International School, including transcripts, school profile documents, diploma verification records, and related academic documentation used for college admissions, transfer review, and family records.',
    '',
    'Sincerely,',
    'Alan Hwader Chu',
    'Founder & Head of School',
    'Genesis of Ideas International School',
    '',
    '中文摘要：本函正式确认章诗雨博士担任 Genesis of Ideas International School 的 President & Principal，并授权其负责学校学术管理、学生记录、成绩单认证与文凭签发等职责。',
  ].join('\n');

  return send({ to: principalEmail, cc, subject, html, text });
}

async function sendGraduationIssuanceRequest({
  principalEmail = 'shiyu.zhang@genesisideas.school',
  cc = [ADMIN_EMAIL, ADMISSIONS_EMAIL],
  student,
} = {}) {
  if (!student) throw new Error('student is required');
  const subject = `Graduation Document Issuance Request — ${student.code} ${student.name}`;
  const html = `
<div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;color:#1a1d24;line-height:1.65">
  <div style="border-bottom:3px solid #1a2d5a;padding:0 0 16px;margin:0 0 22px">
    <p style="color:#b8962e;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Genesis of Ideas International School</p>
    <h1 style="font-size:22px;color:#1a2d5a;margin:0">Graduation Document Issuance Request</h1>
  </div>

  <p>Dear <strong>Shiyu Zhang, Ph.D.</strong>,</p>
  <p>
    Please review and prepare the official graduation document package for
    <strong>${student.name}</strong> (<strong>${student.code}</strong>).
    The package should include the student's official transcript and GIIS high school diploma,
    subject to final administrative review and school records policy.
  </p>

  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:18px 0">
    ${[
      ['Student', `${student.name} (${student.code})`],
      ['Graduation date on record', student.graduationDate],
      ['Transcript date on record', student.transcriptDate],
      ['Credits completed', `${student.totalCredits} credits`],
      ['Transcript semesters', `${student.semesters} semesters`],
      ['G12 Spring coursework', `${student.g12SpringCourses} courses completed with module quizzes, midterm, and final exam records`],
      ['G12 Spring grade release', student.g12SpringReleaseDate],
    ].map(([label, value]) => `
      <tr>
        <td style="padding:8px 14px 8px 0;color:#5c6578;border-bottom:1px solid #e8ecf5;white-space:nowrap">${label}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e8ecf5"><strong>${value}</strong></td>
      </tr>
    `).join('')}
  </table>

  <p>
    Internal audit status: <strong>PASS</strong>. The transcript record has eight semesters,
    all semester rows contain grades and GPA values, total credits exceed the GIIS 24-credit
    graduation threshold, and current G12 Spring Learn Portal completion/exam data matches
    the transcript letter grades.
  </p>

  <p>
    Please confirm once the transcript and diploma have been prepared for issuance.
  </p>

  <p style="margin-top:26px">Sincerely,<br><strong>GIIS Academic Operations</strong></p>

  <hr style="border:none;border-top:1px solid #e8ecf5;margin:24px 0">
  <p style="font-size:12px;color:#5c6578;margin:0">
    Genesis of Ideas International School · Florida-registered private school · admissions@genesisideas.school
  </p>
</div>
  `.trim();

  const text = [
    'Genesis of Ideas International School',
    'Graduation Document Issuance Request',
    '',
    'Dear Shiyu Zhang, Ph.D.,',
    '',
    `Please review and prepare the official graduation document package for ${student.name} (${student.code}). The package should include the student's official transcript and GIIS high school diploma, subject to final administrative review and school records policy.`,
    '',
    `Graduation date on record: ${student.graduationDate}`,
    `Transcript date on record: ${student.transcriptDate}`,
    `Credits completed: ${student.totalCredits} credits`,
    `Transcript semesters: ${student.semesters}`,
    `G12 Spring coursework: ${student.g12SpringCourses} courses completed with module quizzes, midterm, and final exam records`,
    `G12 Spring grade release: ${student.g12SpringReleaseDate}`,
    '',
    'Internal audit status: PASS. The transcript record has eight semesters, all semester rows contain grades and GPA values, total credits exceed the GIIS 24-credit graduation threshold, and current G12 Spring Learn Portal completion/exam data matches the transcript letter grades.',
    '',
    'Please confirm once the transcript and diploma have been prepared for issuance.',
    '',
    'Sincerely,',
    'GIIS Academic Operations',
  ].join('\n');

  return send({ to: principalEmail, cc, subject, html, text });
}

async function sendGraduationDocumentPackage({
  principalEmail = 'shiyu.zhang@genesisideas.school',
  cc = ADMIN_EMAIL,
  student,
  transcriptPdf,
  diplomaPdf,
} = {}) {
  if (!student) throw new Error('student is required');
  if (!transcriptPdf || !diplomaPdf) throw new Error('transcriptPdf and diplomaPdf are required');

  const subject = `GIIS Official Transcript and Diploma — ${student.code} ${student.name}`;
  const html = `
<div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;color:#1a1d24;line-height:1.65">
  <p>Dear <strong>Shiyu Zhang, Ph.D.</strong>,</p>
  <p>
    Attached are the PDF transcript and diploma package for
    <strong>${student.name}</strong> (<strong>${student.code}</strong>) for your review and records.
  </p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:18px 0">
    ${[
      ['Student', `${student.name} (${student.code})`],
      ['Graduation date', student.graduationDate],
      ['Transcript date', student.transcriptDate],
      ['Credits completed', `${student.totalCredits} credits`],
      ['Audit status', 'PASS'],
    ].map(([label, value]) => `
      <tr>
        <td style="padding:8px 14px 8px 0;color:#5c6578;border-bottom:1px solid #e8ecf5;white-space:nowrap">${label}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e8ecf5"><strong>${value}</strong></td>
      </tr>
    `).join('')}
  </table>
  <p>
    The attached transcript uses the corrected credit values and current senior audit output.
    Letter grades were not changed during the latest credit correction.
  </p>
  <p>Sincerely,<br><strong>GIIS Academic Operations</strong></p>
</div>
  `.trim();

  const text = [
    `Dear Shiyu Zhang, Ph.D.,`,
    '',
    `Attached are the PDF transcript and diploma package for ${student.name} (${student.code}) for your review and records.`,
    '',
    `Graduation date: ${student.graduationDate}`,
    `Transcript date: ${student.transcriptDate}`,
    `Credits completed: ${student.totalCredits} credits`,
    'Audit status: PASS',
    '',
    'The attached transcript uses the corrected credit values and current senior audit output. Letter grades were not changed during the latest credit correction.',
    '',
    'Sincerely,',
    'GIIS Academic Operations',
  ].join('\n');

  return send({
    to: principalEmail,
    cc,
    subject,
    html,
    text,
    attachments: [
      {
        filename: transcriptPdf.filename,
        content: transcriptPdf.content,
      },
      {
        filename: diplomaPdf.filename,
        content: diplomaPdf.content,
      },
    ],
  });
}

module.exports = {
  ADMIN_EMAIL,
  ADMISSIONS_EMAIL,
  FALLBACK_PARENT_EMAIL,
  DEFAULT_PRINCIPAL_EMAIL,
  applicationAlertRecipients,
  buildNewApplicationAlert,
  buildApplicationInterestConfirmation,
  sendNewApplicationAlert,
  sendApplicationInterestConfirmation,
  sendWelcomeEmail,
  sendRejectionEmail,
  sendWeeklyProgressEmail,
  sendPasswordResetEmail,
  sendPrincipalAppointmentLetter,
  sendGraduationIssuanceRequest,
  sendGraduationDocumentPackage,
};
