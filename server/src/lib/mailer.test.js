const {
  ADMIN_EMAIL,
  DEFAULT_PRINCIPAL_EMAIL,
  applicationAlertRecipients,
  buildApplicationInterestConfirmation,
  buildNewApplicationAlert,
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
      applicantType: 'transfer',
      previousCredits: '6-11',
      transcriptAvailable: 'not-yet',
      graduationTiming: 'asap',
      mainConcern: 'records',
    });

    expect(content.subject).toBe('[Transfer] New GIIS Application — Cecilia Student (Grade 11)');
    expect(content.replyTo).toBe('parent@example.com');
    expect(content.text).toContain('Applicant type: Transfer student');
    expect(content.text).toContain('Previous credits: 6-11');
    expect(content.text).toContain('Transcript: not-yet');
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
});
