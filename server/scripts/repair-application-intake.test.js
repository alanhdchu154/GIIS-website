const { parseLegacyReview, plannedChanges } = require('./repair-application-intake');

describe('legacy application intake repair', () => {
  test('parses the current notes envelope without exposing family notes', () => {
    expect(parseLegacyReview(
      'Applicant Review: type=transfer; previousCredits=12-17; graduationTiming=1-year; transcriptAvailable=partial; concern=credits; Required Records: transcript; Family Notes: private'
    )).toEqual({
      applicantType: 'transfer',
      previousCredits: '12-17',
      graduationTiming: '1-year',
      transcriptAvailable: 'partial',
      mainConcern: 'credits',
    });
  });

  test('backfills only structured intake metadata and preserves case status', () => {
    const createdAt = new Date('2026-08-07T17:00:00.000Z');
    const changes = plannedChanges({
      id: 'legacy-app',
      notes: 'Transfer Path Review: credits=6-11; graduationTiming=asap; transcriptAvailable=yes; concern=graduation; Family Notes: private',
      applicantType: 'unknown',
      previousCredits: '',
      graduationTiming: '',
      transcriptAvailable: '',
      mainConcern: '',
      nextAction: 'Review application',
      responseDueAt: null,
      submissionCount: 1,
      createdAt,
      status: 'pending',
    });

    expect(changes).toEqual({
      applicantType: 'transfer',
      previousCredits: '6-11',
      graduationTiming: 'asap',
      transcriptAvailable: 'yes',
      mainConcern: 'graduation',
      nextAction: 'Request official records',
      responseDueAt: new Date('2026-08-10T17:00:00.000Z'),
      lastSubmittedAt: createdAt,
    });
    expect(changes).not.toHaveProperty('status');
    expect(changes).not.toHaveProperty('recordsStatus');
  });
});
