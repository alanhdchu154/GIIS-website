import {
  TOTAL_CREDIT_THRESHOLD,
  getGraduationPresentation,
} from './graduationPresentation';

const UNSAFE_PHRASES = [
  "You've earned your High School Diploma",
  'graduation approved',
];

function assertNoUnsafeClaims(text) {
  for (const phrase of UNSAFE_PHRASES) {
    expect(text).not.toContain(phrase);
  }
}

describe('TOTAL_CREDIT_THRESHOLD', () => {
  test('is 24 credits', () => {
    expect(TOTAL_CREDIT_THRESHOLD).toBe(24);
  });
});

describe('getGraduationPresentation — threshold behavior', () => {
  test('23.5 credits returns no review banner', () => {
    const r = getGraduationPresentation({ totalCredits: 23.5 });
    expect(r.meetsTotalCreditThreshold).toBe(false);
    expect(r.showReviewBanner).toBe(false);
    expect(r.banner).toBeNull();
    expect(r.graduationCreditThreshold).toBe(24);
  });

  test('exactly 24 credits returns a review banner', () => {
    const r = getGraduationPresentation({ totalCredits: 24 });
    expect(r.meetsTotalCreditThreshold).toBe(true);
    expect(r.showReviewBanner).toBe(true);
    expect(r.banner).not.toBeNull();
  });

  test('more than 24 credits returns a review banner', () => {
    const r = getGraduationPresentation({ totalCredits: 30 });
    expect(r.meetsTotalCreditThreshold).toBe(true);
    expect(r.showReviewBanner).toBe(true);
    expect(r.banner).not.toBeNull();
  });

  test('numeric string "24" is normalized and triggers the banner', () => {
    const r = getGraduationPresentation({ totalCredits: '24' });
    expect(r.meetsTotalCreditThreshold).toBe(true);
    expect(r.showReviewBanner).toBe(true);
    expect(r.banner).not.toBeNull();
  });

  test('numeric string "23.5" is normalized and does not trigger the banner', () => {
    const r = getGraduationPresentation({ totalCredits: '23.5' });
    expect(r.meetsTotalCreditThreshold).toBe(false);
    expect(r.showReviewBanner).toBe(false);
    expect(r.banner).toBeNull();
  });

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['empty string', ''],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['negative number', -1],
    ['negative string', '-5'],
    ['non-numeric string', 'twenty-four'],
    ['boolean true', true],
    ['boolean false', false],
  ])('%s never shows the review banner', (_label, value) => {
    const r = getGraduationPresentation({ totalCredits: value });
    expect(r.meetsTotalCreditThreshold).toBe(false);
    expect(r.showReviewBanner).toBe(false);
    expect(r.banner).toBeNull();
  });

  test('no arguments returns no banner (does not throw)', () => {
    const r = getGraduationPresentation();
    expect(r.showReviewBanner).toBe(false);
    expect(r.banner).toBeNull();
  });
});

describe('getGraduationPresentation — English copy safety', () => {
  const banner = getGraduationPresentation({
    totalCredits: 24,
    language: 'en',
  }).banner;
  const combined = [
    banner.heading,
    banner.summary,
    banner.subjectRequirementsNote,
    banner.staffApprovalNote,
  ].join(' \n ');

  test('mentions subject-area requirements review', () => {
    expect(banner.subjectRequirementsNote.toLowerCase()).toContain('subject');
    expect(combined.toLowerCase()).toMatch(/subject-area requirements?/);
  });

  test('mentions staff graduation approval is still required', () => {
    expect(banner.staffApprovalNote.toLowerCase()).toContain(
      'staff graduation approval',
    );
    expect(banner.staffApprovalNote.toLowerCase()).toContain('diploma');
  });

  test('summary requires review before any diploma is issued', () => {
    expect(banner.summary.toLowerCase()).toContain('review');
    expect(banner.summary.toLowerCase()).toContain('diploma');
  });

  test('never uses unsafe "already graduated" phrasing', () => {
    assertNoUnsafeClaims(combined);
  });
});

describe('getGraduationPresentation — Simplified Chinese copy safety', () => {
  const banner = getGraduationPresentation({
    totalCredits: 24,
    language: 'zh-CN',
  }).banner;
  const combined = [
    banner.heading,
    banner.summary,
    banner.subjectRequirementsNote,
    banner.staffApprovalNote,
  ].join(' \n ');

  test('mentions subject-area requirements review (学科要求)', () => {
    expect(banner.subjectRequirementsNote).toContain('学科要求');
    expect(combined).toContain('审核');
  });

  test('mentions staff graduation approval before diploma issuance (毕业审批 / 毕业证书)', () => {
    expect(banner.staffApprovalNote).toContain('毕业审批');
    expect(banner.staffApprovalNote).toContain('毕业证书');
  });

  test('summary states review is still needed before any diploma can be issued', () => {
    expect(banner.summary).toContain('审核');
    expect(banner.summary).toContain('毕业证书');
  });

  test('never uses unsafe English "already graduated" phrasing', () => {
    assertNoUnsafeClaims(combined);
  });
});

describe('getGraduationPresentation — GIIS language convention', () => {
  test('language="zh" selects Simplified Chinese copy', () => {
    const r = getGraduationPresentation({ totalCredits: 24, language: 'zh' });
    expect(r.language).toBe('zh-CN');
    expect(r.banner.heading).toBe('已达到学分总数门槛');
  });

  test('language="zh-CN" also selects Simplified Chinese copy', () => {
    const zhCN = getGraduationPresentation({
      totalCredits: 24,
      language: 'zh-CN',
    });
    expect(zhCN.language).toBe('zh-CN');
    expect(zhCN.banner.heading).toBe('已达到学分总数门槛');
  });

  test('unknown / missing language falls back to English', () => {
    for (const lang of [undefined, null, '', 'fr', 'EN', 'ZH-CN']) {
      const r = getGraduationPresentation({ totalCredits: 24, language: lang });
      expect(r.language).toBe('en');
      expect(r.banner.heading).toBe('Total-credit threshold reached');
    }
  });
});
