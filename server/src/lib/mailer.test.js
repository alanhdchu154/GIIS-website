const { buildApplicationInterestConfirmation, buildNewApplicationAlert } = require('./mailer');

describe('new application alert', () => {
  test('includes transfer triage fields and sets the parent reply-to address', () => {
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

    expect(content.replyTo).toBe('parent@example.com');
    expect(content.text).toContain('Applicant type: Transfer student');
    expect(content.text).toContain('Previous credits: 6-11');
    expect(content.text).toContain('Transcript: not-yet');
    expect(content.html).toContain('Review in Admin');
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
