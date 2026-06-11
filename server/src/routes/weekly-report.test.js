const { parseWeeklyReportRequest } = require('./weekly-report');

describe('weekly report route request parsing', () => {
  test('allows dry-run without selected students', () => {
    expect(parseWeeklyReportRequest({ dryRun: true })).toEqual({
      ok: true,
      dryRun: true,
      force: false,
      studentIds: null,
    });
  });

  test('blocks send requests without studentIds', () => {
    const parsed = parseWeeklyReportRequest({});
    expect(parsed.ok).toBe(false);
    expect(parsed.status).toBe(400);
  });

  test('blocks send requests with empty studentIds', () => {
    const parsed = parseWeeklyReportRequest({ studentIds: ['', null, '   '] });
    expect(parsed.ok).toBe(false);
    expect(parsed.status).toBe(400);
  });

  test('deduplicates selected student ids and does not force resend by default', () => {
    expect(parseWeeklyReportRequest({ studentIds: [' s1 ', 's1', 's2'], force: true })).toEqual({
      ok: true,
      dryRun: false,
      force: false,
      studentIds: ['s1', 's2'],
    });
  });

  test('requires explicit confirmation for force resend', () => {
    expect(parseWeeklyReportRequest({
      studentIds: ['s1'],
      force: true,
      confirmForce: 'resend_this_week',
    })).toMatchObject({ ok: true, force: true, studentIds: ['s1'] });
  });
});
