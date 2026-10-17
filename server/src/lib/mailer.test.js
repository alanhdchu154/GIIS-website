const {
  ADMIN_EMAIL,
  DEFAULT_PRINCIPAL_EMAIL,
  applicationAlertRecipients,
  buildApplicationInterestConfirmation,
  buildStatusLinkEmail,
  buildNewApplicationAlert,
  buildWelcomeEmail,
} = require('./mailer');

describe('new application alert', () => {
  test('includes transfer triage fields, flags transfer in the subject, and sets the parent reply-to address', () => {
    const content = buildNewApplicationAlert({
      studentName: 'Cecilia Student',
      gradeLevel: 'Grade 11',
      parentName: 'Diana Parent',
      parentEmail: 'parent@example.com',
      currentSchool: 'Prior High School',
      targetUniversities: 'Example University',
      preferredLanguage: 'en',
      communicationLanguage: 'bilingual',
      applicantType: 'transfer',
      previousCredits: '6-11',
      transcriptAvailable: 'not-yet',
      graduationTiming: 'asap',
      currentEnrollmentStatus: 'currently-enrolled',
      priorSchoolsJson: JSON.stringify([{ schoolName: 'Prior High School', attendancePeriod: '2024-2026' }]),
      recordsSituation: 'no-official-transcript',
      recordsHelpNeeded: 'already-requested',
      transcriptExpectedTiming: '14-business-days',
      parentRelationship: 'parent',
      contactPreference: 'email',
      mainConcern: 'records',
    });

    expect(content.subject).toBe('[Transfer] New GIIS Application — Cecilia Student (Grade 11)');
    expect(content.replyTo).toBe('parent@example.com');
    expect(content.text).toContain('Applicant type: Transfer student');
    expect(content.text).toContain('Instruction language: English');
    expect(content.text).toContain('Family communication: Bilingual (English / Chinese)');
    expect(content.text).toContain('Previous credits: 6-11');
    expect(content.text).toContain('Transcript: not-yet');
    expect(content.text).toContain('School history: Prior High School (2024-2026)');
    expect(content.text).toContain('Records help: already-requested');
    expect(content.html).toContain('Review in Admin');
  });

  test('keeps the ordinary new-student subject untouched', () => {
    const content = buildNewApplicationAlert({
      studentName: 'Cecilia Student',
      gradeLevel: 'Grade 10',
      parentName: 'Diana Parent',
      parentEmail: 'parent@example.com',
      preferredLanguage: 'en',
      applicantType: 'new',
      mainConcern: 'grade9-path',
    });

    expect(content.subject).toBe('New GIIS Application — Cecilia Student (Grade 10)');
    expect(content.subject).not.toMatch(/transfer/i);
    expect(content.text).toContain('Applicant type: New student');
  });

  test('escapes family-provided HTML in the alert body', () => {
    const content = buildNewApplicationAlert({
      studentName: '<script>alert(1)</script>',
      gradeLevel: 'Grade 11',
      parentName: 'Parent & Guardian',
      parentEmail: 'parent@example.com',
      preferredLanguage: 'en',
      applicantType: 'new',
      mainConcern: 'records',
    });

    expect(content.html).not.toContain('<script>');
    expect(content.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(content.html).toContain('Parent &amp; Guardian');
  });
});

describe('applicationAlertRecipients', () => {
  const originalPrincipal = process.env.PRINCIPAL_EMAIL;
  afterEach(() => {
    if (originalPrincipal === undefined) delete process.env.PRINCIPAL_EMAIL;
    else process.env.PRINCIPAL_EMAIL = originalPrincipal;
  });

  test('defaults to admin as primary recipient and CCs the President & Principal', () => {
    delete process.env.PRINCIPAL_EMAIL;
    expect(applicationAlertRecipients()).toEqual({
      to: ADMIN_EMAIL,
      cc: DEFAULT_PRINCIPAL_EMAIL,
    });
  });

  test('honors an operator-configured PRINCIPAL_EMAIL override', () => {
    process.env.PRINCIPAL_EMAIL = 'principal@example.school';
    expect(applicationAlertRecipients()).toEqual({
      to: ADMIN_EMAIL,
      cc: 'principal@example.school',
    });
  });

  test('omits the CC when PRINCIPAL_EMAIL is blank or duplicates the admin owner', () => {
    process.env.PRINCIPAL_EMAIL = '';
    expect(applicationAlertRecipients()).toEqual({ to: ADMIN_EMAIL });
    process.env.PRINCIPAL_EMAIL = ADMIN_EMAIL.toUpperCase();
    expect(applicationAlertRecipients()).toEqual({ to: ADMIN_EMAIL });
  });
});

describe('application interest confirmation email', () => {
  test('builds a bilingual-safe capability link without making outcome guarantees', () => {
    const content = buildApplicationInterestConfirmation({
      parentName: 'Wang & Family',
      studentName: '<Student>',
      preferredLanguage: 'zh',
      communicationLanguage: 'zh',
      confirmationUrl: 'https://example.test/application/confirm?token=secret-token',
      expiresHours: 72,
    });

    expect(content.subject).toContain('确认');
    expect(content.html).toContain('secret-token');
    expect(content.html).toContain('Wang &amp; Family');
    expect(content.html).toContain('&lt;Student&gt;');
    expect(content.text).toContain('不代表录取、转学分、年级安排或毕业日期');
    expect(content.text).toContain('72 小时');
  });

  test('builds both complete language sections for bilingual families', () => {
    const content = buildApplicationInterestConfirmation({
      parentName: 'Diana Parent',
      studentName: 'Cecilia Student',
      preferredLanguage: 'en',
      communicationLanguage: 'bilingual',
      confirmationUrl: 'https://example.test/application/confirm?token=bilingual-token',
      expiresHours: 72,
    });

    expect(content.subject).toContain('Confirm your GIIS application');
    expect(content.subject).toContain('请确认');
    expect(content.text).toContain('Confirmation does not guarantee admission');
    expect(content.text).toContain('确认不代表录取');
    expect(content.html.match(/bilingual-token/g)).toHaveLength(6);
  });

  test('includes the separate fragment-only status link when provided', () => {
    const statusUrl = 'https://example.test/application/status#token=status-secret';
    const content = buildApplicationInterestConfirmation({
      parentName: 'Diana Parent',
      studentName: 'Cecilia Student',
      preferredLanguage: 'en',
      communicationLanguage: 'en',
      confirmationUrl: 'https://example.test/application/confirm?token=confirm-secret',
      statusUrl,
      expiresHours: 72,
    });
    expect(content.text).toContain(statusUrl);
    expect(content.html).toContain(statusUrl);
  });
});

describe('application status-link email', () => {
  test('builds bilingual copy, escapes family fields, and preserves fragment URL', () => {
    const statusUrl = 'https://example.test/application/status#token=status-secret';
    const content = buildStatusLinkEmail({
      parentName: 'Wang & Family',
      studentName: '<Student>',
      preferredLanguage: 'zh',
      communicationLanguage: 'bilingual',
      statusUrl,
    });
    expect(content.subject).toContain('application status link');
    expect(content.subject).toContain('申请进度链接');
    expect(content.html).toContain('Wang &amp; Family');
    expect(content.html).toContain('&lt;Student&gt;');
    expect(content.text).toContain(statusUrl);
    expect(content.html).toContain(statusUrl);
    expect(content.text).toContain('Do not share it publicly');
    expect(content.text).toContain('请勿公开分享');
  });
});

describe('welcome account email', () => {
  test('supports bilingual credentials without changing enrollment gates', () => {
    const content = buildWelcomeEmail({
      parentEmail: 'parent@example.com',
      studentName: 'Cecilia Student',
      loginUrl: 'https://example.test/parent/login',
      studentCode: 'GIIS-TEST-001',
      parentLoginEmail: 'parent.portal@example.com',
      parentPassword: 'parent-temp',
      studentLoginEmail: 'student@example.com',
      studentPassword: 'student-temp',
      communicationLanguage: 'bilingual',
    });

    expect(content.subject).toContain('等待排课');
    expect(content.text).toContain('Parent Portal email / 家长入口邮箱');
    expect(content.text).toContain('parent.portal@example.com');
    expect(content.html).toContain('Course setup is still pending');
    expect(content.html).toContain('建立帐号本身不代表学生已完成选课或已经可以开始上课');
    expect(content.text).toContain('Please wait for GIIS to confirm the approved first-term courses');
    expect(content.text).toContain('若页面没有课程，表示排课仍在进行中');
    expect(content.html).not.toContain('complete enrollment and activate full course access');
  });
});
