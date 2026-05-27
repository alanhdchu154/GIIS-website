const {
  computeCareSignals,
  displayCareState,
  parseOptionalDate,
  serializeCareLog,
} = require('./studentCare');

describe('student care signals', () => {
  test('marks 21+ day inactivity as urgent intervention needed', () => {
    const result = computeCareSignals({
      daysInactive: 24,
      totalEnrollments: 2,
      totalModules: 20,
      completedModules: 5,
      submittedQuizzes: 5,
      submittedExams: 0,
      consistency: [],
      lastReviewedAt: '2026-05-01T00:00:00.000Z',
    }, new Date('2026-05-27T00:00:00.000Z'));

    expect(result.computedRiskLevel).toBe('urgent');
    expect(result.computedStatus).toBe('intervention_needed');
    expect(result.flags).toContain('No activity for 21+ days.');
  });

  test('manual care state overrides computed display only', () => {
    const computed = computeCareSignals({
      daysInactive: 30,
      totalEnrollments: 1,
      consistency: [],
      lastReviewedAt: '2026-05-27T00:00:00.000Z',
    }, new Date('2026-05-27T00:00:00.000Z'));
    const display = displayCareState({
      manualOverride: true,
      status: 'parent_concern',
      riskLevel: 'concern',
    }, computed);

    expect(computed.computedRiskLevel).toBe('urgent');
    expect(display).toEqual({ status: 'parent_concern', riskLevel: 'concern', source: 'manual' });
  });

  test('overdue check-in raises concern', () => {
    const result = computeCareSignals({
      daysInactive: 0,
      totalEnrollments: 1,
      consistency: [],
      lastReviewedAt: '2026-05-20T00:00:00.000Z',
      nextCheckInDueAt: '2026-05-21T00:00:00.000Z',
    }, new Date('2026-05-27T00:00:00.000Z'));

    expect(result.computedRiskLevel).toBe('concern');
    expect(result.computedStatus).toBe('advisor_followup');
    expect(result.flags).toContain('Next check-in is overdue.');
  });
});

describe('student care safety helpers', () => {
  test('parseOptionalDate distinguishes omitted and invalid dates', () => {
    expect(parseOptionalDate(null)).toBeNull();
    expect(parseOptionalDate('')).toBeNull();
    expect(parseOptionalDate('not-a-date')).toBeUndefined();
    expect(parseOptionalDate('2026-05-27')).toBeInstanceOf(Date);
  });

  test('parent-safe serialization removes internal body', () => {
    const log = {
      id: 'log1',
      studentId: 'student1',
      type: 'advisor_note',
      visibility: 'parent_safe',
      title: 'Check-in',
      bodyInternal: 'Internal concern: do not expose',
      parentSummary: 'We checked in and set a goal for next week.',
      channel: 'email',
      outcome: '',
      followUpAt: null,
      resolvedAt: null,
      authorEmail: 'advisor@genesisideas.school',
      createdAt: new Date('2026-05-27T00:00:00.000Z'),
      updatedAt: new Date('2026-05-27T00:00:00.000Z'),
    };

    expect(serializeCareLog(log, { parentSafeOnly: true })).not.toHaveProperty('bodyInternal');
    expect(serializeCareLog(log)).toHaveProperty('bodyInternal', 'Internal concern: do not expose');
  });
});
