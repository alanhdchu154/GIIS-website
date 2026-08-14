const jwt = require('jsonwebtoken');
const {
  addCalendarDays,
  computeGradeLevel,
  createRecordHash,
  evaluateEnrollmentEligibility,
  issueEnrollmentToken,
  verifyEnrollmentToken,
} = require('./enrollmentVerification');

const SECRET = 'test-secret-at-least-sixteen-characters';
const ISSUE_DATE = '2026-08-12';

function eligibleStudent(overrides = {}) {
  return {
    id: 'student-1',
    name: 'Student Example',
    studentCode: 'GIIS-1001',
    entryDate: new Date('2026-08-01T00:00:00.000Z'),
    withdrawalDate: null,
    graduationDate: new Date('2028-05-20T00:00:00.000Z'),
    paidThroughDate: new Date('2026-12-31T00:00:00.000Z'),
    account: { isActive: true, softLocked: false },
    subscriptions: [],
    ...overrides,
  };
}

describe('enrollment verification eligibility', () => {
  test('accepts a fully active manually paid student and caps validity at 90 days', () => {
    const result = evaluateEnrollmentEligibility(eligibleStudent(), ISSUE_DATE);
    expect(result).toMatchObject({
      eligible: true,
      reasons: [],
      entryDate: '2026-08-01',
      gradeLevel: 10,
      paymentCoverageThrough: '2026-12-31',
      validThrough: '2026-11-10',
    });
    expect(addCalendarDays(ISSUE_DATE, 90)).toBe('2026-11-10');
  });

  test.each([
    ['legal_name_missing', { name: '' }],
    ['student_id_missing', { studentCode: '' }],
    ['account_inactive', { account: { isActive: false, softLocked: false } }],
    ['account_restricted', { account: { isActive: true, softLocked: true } }],
    ['entry_date_missing', { entryDate: null }],
    ['enrollment_not_started', { entryDate: new Date('2026-08-13T00:00:00.000Z') }],
    ['student_withdrawn', { withdrawalDate: new Date('2026-08-12T00:00:00.000Z') }],
    ['student_graduated', { graduationDate: new Date('2026-08-12T00:00:00.000Z') }],
    ['payment_not_current', { paidThroughDate: new Date('2026-08-11T00:00:00.000Z') }],
  ])('fails closed for %s', (reason, overrides) => {
    const result = evaluateEnrollmentEligibility(eligibleStudent(overrides), ISSUE_DATE);
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(reason);
  });

  test('accepts current Stripe coverage when an older manual paid-through date has lapsed', () => {
    const result = evaluateEnrollmentEligibility(eligibleStudent({
      paidThroughDate: new Date('2026-08-11T00:00:00.000Z'),
      subscriptions: [{ status: 'active', currentPeriodEnd: new Date('2026-09-30T00:00:00.000Z') }],
    }), ISSUE_DATE);
    expect(result).toMatchObject({
      eligible: true,
      paymentCoverageThrough: '2026-09-30',
      validThrough: '2026-09-30',
    });
  });

  test('uses the later current coverage when manual and Stripe records overlap', () => {
    const result = evaluateEnrollmentEligibility(eligibleStudent({
      paidThroughDate: new Date('2026-08-31T00:00:00.000Z'),
      subscriptions: [{ status: 'trialing', currentPeriodEnd: new Date('2026-09-12T00:00:00.000Z') }],
    }), ISSUE_DATE);
    expect(result).toMatchObject({
      eligible: true,
      paymentCoverageThrough: '2026-09-12',
      validThrough: '2026-09-12',
    });
  });

  test('accepts a linked current Stripe subscription only with known current coverage', () => {
    const current = evaluateEnrollmentEligibility(eligibleStudent({
      paidThroughDate: null,
      subscriptions: [{ status: 'active', currentPeriodEnd: new Date('2026-09-12T00:00:00.000Z') }],
    }), ISSUE_DATE);
    expect(current).toMatchObject({ eligible: true, validThrough: '2026-09-12' });

    const unknown = evaluateEnrollmentEligibility(eligibleStudent({
      paidThroughDate: null,
      subscriptions: [{ status: 'active', currentPeriodEnd: null }],
    }), ISSUE_DATE);
    expect(unknown.eligible).toBe(false);
    expect(unknown.reasons).toContain('payment_not_current');
  });

  test('only returns a grade when the expected graduation date supports grades 9 through 12', () => {
    expect(computeGradeLevel('2028-05-20', ISSUE_DATE)).toBe(10);
    expect(computeGradeLevel('2031-05-20', ISSUE_DATE)).toBeNull();
    expect(computeGradeLevel(null, ISSUE_DATE)).toBeNull();
  });
});

describe('enrollment verification token', () => {
  test('contains no student name, Student ID, birth date, address, or payment data', () => {
    const issued = issueEnrollmentToken({
      studentId: 'student-1',
      studentName: 'Student Example',
      studentCode: 'GIIS-1001',
      entryDate: '2026-08-01',
      gradeLevel: 10,
      issuedOn: ISSUE_DATE,
      validThrough: '2026-09-12',
      secret: SECRET,
      documentId: 'GIIS-EV-2026-TEST',
    });
    const decoded = jwt.decode(issued.token);
    expect(decoded).toMatchObject({
      purpose: 'enrollment_verification',
      studentId: 'student-1',
      documentId: 'GIIS-EV-2026-TEST',
      entryDate: '2026-08-01',
      gradeLevel: 10,
    });
    const serialized = JSON.stringify(decoded);
    expect(serialized).not.toContain('Student Example');
    expect(serialized).not.toContain('GIIS-1001');
    expect(serialized).not.toMatch(/birth|address|payment/i);
  });

  test('reports valid and expired signed documents and rejects the wrong purpose', () => {
    const issued = issueEnrollmentToken({
      studentId: 'student-1',
      studentName: 'Student Example',
      studentCode: 'GIIS-1001',
      entryDate: '2026-08-01',
      gradeLevel: 10,
      issuedOn: ISSUE_DATE,
      validThrough: '2026-09-12',
      secret: SECRET,
      documentId: 'GIIS-EV-2026-TEST',
    });
    expect(verifyEnrollmentToken(issued.token, SECRET, new Date('2026-09-01T00:00:00.000Z')).expired).toBe(false);
    expect(verifyEnrollmentToken(issued.token, SECRET, new Date('2026-09-13T00:00:00.000Z')).expired).toBe(true);

    const wrongPurpose = jwt.sign({
      purpose: 'transcript',
      studentId: 'student-1',
      documentId: 'wrong',
      exp: 1999999999,
      iss: 'giis-transcript-api',
      aud: 'giis-enrollment-verification',
    }, SECRET);
    expect(() => verifyEnrollmentToken(wrongPurpose, SECRET)).toThrow('Invalid enrollment verification token');
  });

  test('record hash changes when the legal identity fields change', () => {
    const base = createRecordHash({ studentId: 's1', studentName: 'A', studentCode: 'G1', secret: SECRET });
    expect(createRecordHash({ studentId: 's1', studentName: 'B', studentCode: 'G1', secret: SECRET })).not.toBe(base);
    expect(createRecordHash({ studentId: 's1', studentName: 'A', studentCode: 'G2', secret: SECRET })).not.toBe(base);
  });
});
