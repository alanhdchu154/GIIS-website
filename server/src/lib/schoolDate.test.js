const { SCHOOL_TIME_ZONE, schoolDateOnly } = require('./schoolDate');

describe('schoolDateOnly', () => {
  test('uses the GIIS America/Chicago business date by default', () => {
    expect(SCHOOL_TIME_ZONE).toBe('America/Chicago');
    expect(schoolDateOnly(new Date('2026-07-22T00:30:00.000Z'))).toBe('2026-07-21');
    expect(schoolDateOnly(new Date('2026-07-22T05:30:00.000Z'))).toBe('2026-07-22');
  });

  test('returns null for an invalid date', () => {
    expect(schoolDateOnly('not-a-date')).toBeNull();
  });
});
