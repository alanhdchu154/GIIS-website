import { SCHOOL_TIME_ZONE, hasEffectiveGraduationDate } from './diplomaEligibility';

describe('hasEffectiveGraduationDate', () => {
  test('uses the GIIS school date', () => {
    expect(SCHOOL_TIME_ZONE).toBe('America/Chicago');
    expect(hasEffectiveGraduationDate('2026-08-13', new Date('2026-08-14T04:30:00.000Z'))).toBe(true);
    expect(hasEffectiveGraduationDate('2026-08-14', new Date('2026-08-14T04:30:00.000Z'))).toBe(false);
    expect(hasEffectiveGraduationDate('2026-08-14', new Date('2026-08-14T05:30:00.000Z'))).toBe(true);
  });

  test('rejects missing, invalid, and future dates', () => {
    const now = new Date('2026-08-14T18:00:00.000Z');
    for (const value of [null, '', 'not-a-date', '08/14/2026', '2026-8-14', '2026-02-30', '2026-08-15']) {
      expect(hasEffectiveGraduationDate(value, now)).toBe(false);
    }
  });
});
