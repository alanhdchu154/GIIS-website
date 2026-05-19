/**
 * Resend email helper.
 * All outbound email goes through this module.
 * If RESEND_EMAIL_API_KEY is missing, emails are skipped with a warning.
 */
const { Resend } = require('resend');

const resend = process.env.RESEND_EMAIL_API_KEY
  ? new Resend(process.env.RESEND_EMAIL_API_KEY)
  : null;

const FROM = 'GIIS Admissions <admissions@genesisideas.school>';
const ADMIN_EMAIL = 'alanhdchu@genesisideas.school';
const SITE = process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'https://genesisideas.school';

async function send({ to, subject, html, text }) {
  if (!resend) {
    console.warn(`[mailer] RESEND_EMAIL_API_KEY not set — skipping email to ${to}: ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html, text });
  } catch (err) {
    console.error(`[mailer] Failed to send "${subject}" to ${to}:`, err.message);
  }
}

// ── Templates ──────────────────────────────────────────────────────────────

/**
 * Notify Alan when a new application arrives.
 */
async function sendNewApplicationAlert({ studentName, gradeLevel, parentName, parentEmail, currentSchool, targetUniversities, preferredLanguage, appId }) {
  const subject = `New GIIS Application — ${studentName} (${gradeLevel})`;
  const adminUrl = `${SITE}/admin/applications`;
  await send({
    to: ADMIN_EMAIL,
    subject,
    html: `
<p>A new application has been submitted.</p>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  <tr><td style="padding:6px 16px 6px 0;color:#888;white-space:nowrap">Student</td><td style="padding:6px 0"><strong>${studentName}</strong> · ${gradeLevel}</td></tr>
  <tr><td style="padding:6px 16px 6px 0;color:#888">Parent</td><td style="padding:6px 0">${parentName} · <a href="mailto:${parentEmail}">${parentEmail}</a></td></tr>
  ${currentSchool ? `<tr><td style="padding:6px 16px 6px 0;color:#888">Current school</td><td style="padding:6px 0">${currentSchool}</td></tr>` : ''}
  ${targetUniversities ? `<tr><td style="padding:6px 16px 6px 0;color:#888">Target unis</td><td style="padding:6px 0">${targetUniversities}</td></tr>` : ''}
  <tr><td style="padding:6px 16px 6px 0;color:#888">Language</td><td style="padding:6px 0">${preferredLanguage === 'zh' ? 'Chinese' : 'English'}</td></tr>
</table>
<p style="margin-top:20px"><a href="${adminUrl}" style="background:#2b3d6d;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700">Review in Admin →</a></p>
    `.trim(),
    text: `New application: ${studentName} (${gradeLevel}) · ${parentName} <${parentEmail}>\nReview: ${adminUrl}`,
  });
}

/**
 * Welcome email sent to parent when admin creates their accounts.
 * Replaces the manual copy-paste step.
 */
async function sendWelcomeEmail({ parentEmail, studentName, tempPassword, loginUrl, studentCode }) {
  const subject = 'Your GIIS account is ready — complete your enrollment';
  await send({
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
      <div><strong>Email:</strong> ${parentEmail}</div>
      <div><strong>Temporary password:</strong> <code style="background:#e8ecf5;padding:2px 8px;border-radius:4px;font-weight:700">${tempPassword}</code></div>
      <div><strong>Student code:</strong> ${studentCode}</div>
    </div>

    <p style="font-size:13px;color:#5c6578">After logging in, you'll see a button to complete payment and activate full course access for ${studentName}.</p>

    <p style="margin-top:24px"><a href="${loginUrl}" style="background:#d5a836;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:800;font-size:15px">Log in and complete enrollment →</a></p>

    <hr style="border:none;border-top:1px solid #e8ecf5;margin:28px 0">
    <p style="font-size:12px;color:#9aa0ad;margin:0">Questions? Reply to this email or contact us at <a href="mailto:admissions@genesisideas.school" style="color:#2b3d6d">admissions@genesisideas.school</a></p>
  </div>
</div>
    `.trim(),
    text: `Welcome to GIIS!\n\nLog in to complete enrollment:\n${loginUrl}\nEmail: ${parentEmail}\nTemp password: ${tempPassword}\nStudent code: ${studentCode}`,
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
async function sendWeeklyProgressEmail({ parentEmail, studentName, creditsEarned, gpa, inProgressCourses, completedCount, gradPercent, dashboardUrl }) {
  const subject = `${studentName}'s weekly progress — GIIS`;
  const courseList = inProgressCourses.length
    ? inProgressCourses.map(c => `<li style="margin-bottom:6px"><strong>${c.name}</strong> — ${c.completedModules}/${c.totalModules} modules</li>`).join('')
    : '<li style="color:#9aa0ad">No active courses.</li>';

  await send({
    to: parentEmail,
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

    <p style="font-size:11px;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px">Active Courses</p>
    <ul style="padding-left:20px;font-size:14px;line-height:1.8;margin:0 0 24px">${courseList}</ul>

    <a href="${dashboardUrl}" style="background:#2b3d6d;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block">View full dashboard →</a>

    <hr style="border:none;border-top:1px solid #e8ecf5;margin:28px 0">
    <p style="font-size:12px;color:#9aa0ad;margin:0">Genesis of Ideas International School · <a href="mailto:admissions@genesisideas.school" style="color:#2b3d6d">admissions@genesisideas.school</a></p>
  </div>
</div>
    `.trim(),
    text: `${studentName}'s weekly progress\nCredits: ${creditsEarned}/24 · GPA: ${gpa ?? '—'} · Graduation: ${gradPercent}%\n\nView dashboard: ${dashboardUrl}`,
  });
}

module.exports = { sendNewApplicationAlert, sendWelcomeEmail, sendRejectionEmail, sendWeeklyProgressEmail };
