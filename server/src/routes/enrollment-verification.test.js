jest.mock('../lib/prisma', () => ({}));

const {
  documentData,
  eligibilityMessage,
  publicVerificationStatus,
  requestedStudentId,
} = require('./enrollment-verification');

describe('enrollment verification route boundaries', () => {
  test('students may request only their own certificate', () => {
    expect(requestedStudentId({ auth: { role: 'student', studentId: 's1' }, params: {} })).toBe('s1');
    expect(requestedStudentId({ auth: { role: 'student', studentId: 's1' }, params: { studentId: 's1' } })).toBe('s1');
    expect(requestedStudentId({ auth: { role: 'student', studentId: 's1' }, params: { studentId: 's2' } })).toBe(false);
  });

  test('administrators must identify the student explicitly', () => {
    expect(requestedStudentId({ auth: { role: 'admin' }, params: { studentId: 's2' } })).toBe('s2');
    expect(requestedStudentId({ auth: { role: 'admin' }, params: {} })).toBeNull();
  });

  test('document payload excludes private and payment fields', () => {
    const payload = documentData({
      name: 'Student Example',
      studentCode: 'GIIS-1001',
      birthDate: '2009-01-01',
      address: 'Private address',
      paidThroughDate: '2026-12-31',
    }, '2026-08-12', {
      validThrough: '2026-11-10',
      gradeLevel: 10,
      entryDate: '2026-08-01',
    });
    expect(payload).toMatchObject({
      studentName: 'Student Example',
      studentCode: 'GIIS-1001',
      gradeLevel: 10,
      entryDate: '2026-08-01',
    });
    expect(payload).not.toHaveProperty('birthDate');
    expect(payload).not.toHaveProperty('address');
    expect(payload).not.toHaveProperty('paidThroughDate');
  });

  test('student-facing failure messages do not reveal payment details', () => {
    expect(eligibilityMessage(['payment_not_current'])).toEqual([
      'Current payment coverage could not be verified.',
    ]);
  });

  test.each([
    ['valid', { expired: false, identityCurrent: true, enrollmentCurrent: true }],
    ['expired', { expired: true, identityCurrent: true, enrollmentCurrent: true }],
    ['no-longer-current', { expired: false, identityCurrent: true, enrollmentCurrent: false }],
    ['no-longer-current', { expired: false, identityCurrent: false, enrollmentCurrent: true }],
  ])('returns the public %s state without exposing an internal reason', (expected, input) => {
    expect(publicVerificationStatus(input)).toBe(expected);
  });
});
