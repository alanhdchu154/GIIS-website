const {
  parseApplicationSubmission,
  parseTransferEvaluation,
  submitPublicApplication,
  confirmPublicApplicationInterest,
  nextBusinessResponseDue,
  applicationTypeFor,
  transferApprovalError,
  applicationApprovalError,
  applicationReadiness,
  activationReadinessError,
  transferEvaluationEditError,
  interestTokenHash,
} = require('./applications');

function validBody(overrides = {}) {
  return {
    intakeVersion: 'serious-v1',
    studentName: 'Cecilia Student',
    dob: '2009-04-12',
    gradeLevel: 'Grade 11',
    currentSchool: 'Prior High School',
    targetUniversities: '',
    preferredLanguage: 'en',
    applicantType: 'transfer',
    parentName: 'Diana Parent',
    parentEmail: 'Parent@Example.com',
    phone: '',
    previousCredits: '6-11',
    transcriptAvailable: 'not-yet',
    graduationTiming: 'asap',
    mainConcern: 'records',
    motivation: 'We are looking for a structured school relationship with clear academic review, steady progress, and honest planning for the student.',
    intendedStartTiming: 'next-semester',
    transferCourseSummary: 'English II (A), Algebra II (B), Biology (A), and World History (B).',
    transcriptPlanDetails: 'We will request the official transcript from the prior school this week.',
    transcriptExpectedTiming: 'Within 10 business days',
    tuitionAware: true,
    noGuaranteeAcknowledged: true,
    responseCommitmentAcknowledged: true,
    notes: 'Family note',
    ...overrides,
  };
}

describe('application submission parsing', () => {
  test('requires the structured transfer review fields', () => {
    const parsed = parseApplicationSubmission(validBody({ previousCredits: '' }));

    expect(parsed).toEqual({
      ok: false,
      status: 400,
      error: 'Missing transfer fields: previousCredits',
    });
  });

  test('accepts a new student and clears transfer-only values', () => {
    const parsed = parseApplicationSubmission(validBody({
      applicantType: 'new',
      previousCredits: '18-23',
      transcriptAvailable: 'yes',
      graduationTiming: '1-year',
    }));

    expect(parsed.ok).toBe(true);
    expect(parsed.data).toMatchObject({
      applicantType: 'new',
      parentEmail: 'parent@example.com',
      previousCredits: '',
      transcriptAvailable: '',
      graduationTiming: '',
    });
  });

  test('keeps the old frontend compatible during a backend-first rollout', () => {
    const parsed = parseApplicationSubmission(validBody({
      intakeVersion: '',
      applicantType: '',
      previousCredits: '',
      transcriptAvailable: '',
      graduationTiming: '',
      mainConcern: '',
      notes: 'Applicant Review: type=transfer; previousCredits=12-17; graduationTiming=1-year; transcriptAvailable=partial; concern=credits; Required Records: transcript; Family Notes: none',
    }));

    expect(parsed.ok).toBe(true);
    expect(parsed.data).toMatchObject({
      applicantType: 'transfer',
      previousCredits: '12-17',
      transcriptAvailable: 'partial',
      graduationTiming: '1-year',
      mainConcern: 'credits',
    });
  });

  test('requires serious-applicant intent and acknowledgments for the new intake', () => {
    expect(parseApplicationSubmission(validBody({ motivation: 'Too short' }))).toEqual({
      ok: false,
      status: 400,
      error: 'motivation must be at least 80 characters',
    });
    expect(parseApplicationSubmission(validBody({ tuitionAware: false }))).toEqual({
      ok: false,
      status: 400,
      error: 'Missing acknowledgments: tuitionAware',
    });
  });

  test('accepts transfer families without a transcript when they provide a concrete plan', () => {
    const parsed = parseApplicationSubmission(validBody({
      transcriptAvailable: 'not-yet',
      transcriptPlanDetails: 'The prior school requires a parent records request, which we will file on Monday.',
      transcriptExpectedTiming: 'Approximately three weeks',
    }));

    expect(parsed.ok).toBe(true);
    expect(parsed.data).toMatchObject({
      transcriptAvailable: 'not-yet',
      transcriptExpectedTiming: 'Approximately three weeks',
    });
  });
});

describe('application response SLA', () => {
  test('uses the next Chicago business day and skips the weekend', () => {
    expect(nextBusinessResponseDue(new Date('2026-08-07T17:00:00.000Z')).toISOString())
      .toBe('2026-08-10T17:00:00.000Z');
    expect(nextBusinessResponseDue(new Date('2026-08-10T17:00:00.000Z')).toISOString())
      .toBe('2026-08-11T17:00:00.000Z');
  });
});

describe('application approval and activation gates', () => {
  test('recognizes legacy transfer notes and requires verified records', () => {
    const legacy = {
      applicantType: 'unknown',
      recordsStatus: 'received',
      notes: 'Applicant Review: type=transfer; previousCredits=6-11;',
    };

    expect(applicationTypeFor(legacy)).toBe('transfer');
    expect(transferApprovalError(legacy)).toBe(
      'Transfer applications require verified official records before approval.'
    );
    expect(transferApprovalError({ ...legacy, recordsStatus: 'verified' })).toBe(
      'Transfer applications require a completed course evaluation and recorded principal approval.'
    );
    expect(transferApprovalError({
      ...legacy,
      recordsStatus: 'verified',
      transferEvaluation: { principalApprovedAt: new Date('2026-08-08T12:00:00.000Z') },
    })).toBe('');
  });

  test('requires payment evidence before account activation', () => {
    const app = { applicantType: 'new', recordsStatus: 'not_requested', notes: '', interestConfirmedAt: new Date() };

    expect(activationReadinessError(app, { paid: false, paidUnlinked: false })).toBe(
      'Verified payment evidence is required before account activation.'
    );
    expect(activationReadinessError(app, { paid: false, paidUnlinked: true })).toBe('');
  });

  test('requires parent confirmation and exposes non-circular readiness states', () => {
    const transfer = {
      applicantType: 'transfer',
      recordsStatus: 'not_requested',
      notes: '',
      interestConfirmationTokenHash: interestTokenHash('z'.repeat(43)),
      interestConfirmationSentAt: new Date(),
    };
    expect(applicationApprovalError(transfer)).toBe(
      'Parent email interest confirmation is required before application approval.'
    );
    expect(applicationReadiness(transfer).code).toBe('unconfirmed');
    expect(applicationReadiness({ ...transfer, interestConfirmedAt: new Date() }).code).toBe('records_pending');
    expect(applicationReadiness({
      ...transfer,
      interestConfirmedAt: new Date(),
      recordsStatus: 'verified',
      transferEvaluation: { courses: [{ id: 'course-1' }], principalApprovedAt: null },
    }).code).toBe('ready_for_principal_review');
    expect(applicationReadiness({
      ...transfer,
      interestConfirmedAt: new Date(),
      recordsStatus: 'verified',
      transferEvaluation: { courses: [{ id: 'course-1' }], principalApprovedAt: new Date() },
    }).code).toBe('approval_ready');
  });

  test('locks transfer-decision editing after payment or account activation', () => {
    expect(transferEvaluationEditError({ status: 'approved', accountsCreated: false }, { paidUnlinked: true })).toBe(
      'Transfer decisions cannot be edited after payment is recorded. Resolve the case through principal and registrar review.'
    );
    expect(transferEvaluationEditError({ status: 'approved', accountsCreated: true }, {})).toBe(
      'Transfer decisions cannot be edited after account activation. Use a reviewed registrar correction.'
    );
    expect(transferEvaluationEditError({ status: 'pending', accountsCreated: false }, {})).toBe('');
  });
});

describe('transfer credit evaluation parsing', () => {
  function validEvaluation(overrides = {}) {
    return {
      reviewer: 'Academic Reviewer',
      priorSchool: 'Prior High School',
      recordType: 'official_transcript',
      evidenceLevel: 'A',
      recommendedGradeLevel: 'Grade 11',
      familySummary: '9.0 credits accepted; remaining requirements will be completed at GIIS.',
      validationPlan: '',
      courses: [{
        originalCourseTitle: 'English II',
        originalTerm: '2025-2026',
        originalCredits: '1.0',
        originalGrade: 'A',
        gradingScaleReceived: true,
        mappedArea: 'english',
        acceptedCredits: 1,
        decision: 'credit_and_gpa',
        gpaIncluded: false,
        weightedTreatment: 'none',
        validationRequired: 'none',
        rationale: 'Completed high-school English course on official record.',
      }],
      ...overrides,
    };
  }

  test('normalizes a defensible credit and GPA decision', () => {
    const parsed = parseTransferEvaluation(validEvaluation());

    expect(parsed.ok).toBe(true);
    expect(parsed.data.courses[0]).toMatchObject({
      sortOrder: 0,
      acceptedCredits: 1,
      gpaIncluded: true,
    });
  });

  test('requires a grading scale before including a transferred grade in GPA', () => {
    const evaluation = validEvaluation();
    evaluation.courses[0].gradingScaleReceived = false;

    expect(parseTransferEvaluation(evaluation)).toEqual({
      ok: false,
      error: 'Course 1: credit + GPA requires accepted credit, an original grade, and the grading scale.',
    });
  });

  test('requires a validation method for conditional credit', () => {
    const evaluation = validEvaluation();
    evaluation.courses[0] = {
      ...evaluation.courses[0],
      decision: 'conditional',
      originalGrade: '',
      gradingScaleReceived: false,
      validationRequired: 'none',
    };

    expect(parseTransferEvaluation(evaluation)).toEqual({
      ok: false,
      error: 'Course 1: conditional decisions require a validation method.',
    });
  });

  test('keeps Level C records preliminary until they are officially confirmed or validated', () => {
    const parsed = parseTransferEvaluation(validEvaluation({ evidenceLevel: 'C' }));

    expect(parsed).toEqual({
      ok: false,
      error: 'Evidence Level C supports preliminary or conditional planning only, not final accepted credit.',
    });
  });

  test('allows Level D records only as rejected or deferred evidence', () => {
    const evaluation = validEvaluation({ evidenceLevel: 'D' });
    evaluation.courses[0] = {
      ...evaluation.courses[0],
      decision: 'conditional',
      acceptedCredits: 0,
      originalGrade: '',
      gradingScaleReceived: false,
      validationRequired: 'assessment',
    };

    expect(parseTransferEvaluation(evaluation)).toEqual({
      ok: false,
      error: 'Evidence Level D cannot support accepted or conditional transfer credit.',
    });
  });
});

describe('public application submission', () => {
  test('returns the existing pending case and rotates confirmation for an unconfirmed duplicate', async () => {
    const prismaClient = {
      application: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'existing-app',
          parentEmail: 'parent@example.com',
          parentName: 'Diana Parent',
          studentName: 'Cecilia Student',
          preferredLanguage: 'en',
          interestConfirmedAt: null,
        }),
        update: jest.fn().mockResolvedValue({ id: 'existing-app' }),
        create: jest.fn(),
      },
      applicationEvent: { create: jest.fn().mockResolvedValue({ id: 'event-1' }) },
    };
    prismaClient.$transaction = jest.fn((callback) => callback(prismaClient));
    const sendConfirmation = jest.fn().mockResolvedValue({ ok: true });
    const now = new Date('2026-08-08T12:00:00.000Z');

    const result = await submitPublicApplication(validBody(), {
      prismaClient,
      sendConfirmation,
      now,
      tokenFactory: () => 'a'.repeat(43),
      publicSite: 'https://example.test',
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      body: { ok: true, id: 'existing-app', duplicate: true, confirmationRequired: true },
    });
    expect(prismaClient.application.create).not.toHaveBeenCalled();
    expect(sendConfirmation).toHaveBeenCalledWith(expect.objectContaining({
      confirmationUrl: `https://example.test/application/confirm?token=${'a'.repeat(43)}`,
      parentEmail: 'parent@example.com',
    }));
    expect(prismaClient.application.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        parentEmail: { equals: 'parent@example.com', mode: 'insensitive' },
        studentName: { equals: 'Cecilia Student', mode: 'insensitive' },
      }),
    }));
    expect(prismaClient.application.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'existing-app' },
      data: expect.objectContaining({
        submissionCount: { increment: 1 },
        lastSubmittedAt: now,
        interestConfirmationTokenHash: interestTokenHash('a'.repeat(43)),
      }),
    }));
    expect(prismaClient.applicationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: 'existing-app',
        action: 'duplicate_submission',
        actorEmail: 'parent@example.com',
      }),
    });
  });

  test('creates one structured case and sends confirmation before the admin alert', async () => {
    const prismaClient = {
      application: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        create: jest.fn().mockImplementation(async ({ data }) => ({ id: 'new-app', ...data })),
      },
      applicationEvent: { create: jest.fn().mockResolvedValue({ id: 'event-1' }) },
    };
    prismaClient.$transaction = jest.fn((callback) => callback(prismaClient));
    const sendConfirmation = jest.fn().mockResolvedValue({ ok: true });

    const result = await submitPublicApplication(validBody(), {
      prismaClient,
      sendConfirmation,
      tokenFactory: () => 'b'.repeat(43),
      publicSite: 'https://example.test',
    });

    expect(result.status).toBe(201);
    expect(result.body).toEqual({ ok: true, id: 'new-app', duplicate: false, confirmationRequired: true });
    expect(prismaClient.application.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicantType: 'transfer',
        previousCredits: '6-11',
        transcriptAvailable: 'not-yet',
        graduationTiming: 'asap',
        mainConcern: 'records',
        parentEmail: 'parent@example.com',
        nextAction: 'Send parent confirmation email',
        interestConfirmationTokenHash: interestTokenHash('b'.repeat(43)),
      }),
    });
    expect(sendConfirmation).toHaveBeenCalledTimes(1);
    expect(sendConfirmation).toHaveBeenCalledWith(expect.objectContaining({
      parentEmail: 'parent@example.com',
      confirmationUrl: `https://example.test/application/confirm?token=${'b'.repeat(43)}`,
    }));
    expect(prismaClient.application.update).toHaveBeenCalledWith({
      where: { id: 'new-app' },
      data: {
        interestConfirmationSentAt: expect.any(Date),
        nextAction: 'Wait for parent email confirmation',
      },
    });
    expect(prismaClient.applicationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: 'new-app',
        action: 'application_submitted',
        actorEmail: 'parent@example.com',
      }),
    });
  });

  test('keeps the application gated and reports an error when confirmation delivery fails', async () => {
    const prismaClient = {
      application: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({ id: 'new-app' }),
        create: jest.fn().mockImplementation(async ({ data }) => ({ id: 'new-app', ...data })),
      },
      applicationEvent: { create: jest.fn().mockResolvedValue({ id: 'event-1' }) },
    };
    prismaClient.$transaction = jest.fn((callback) => callback(prismaClient));

    const result = await submitPublicApplication(validBody(), {
      prismaClient,
      sendConfirmation: jest.fn().mockResolvedValue({ ok: false, error: 'provider unavailable' }),
      tokenFactory: () => 'g'.repeat(43),
    });

    expect(result).toEqual(expect.objectContaining({ ok: false, status: 503 }));
    expect(prismaClient.application.update).toHaveBeenCalledWith({
      where: { id: 'new-app' },
      data: {
        interestConfirmationSentAt: null,
        nextAction: 'Confirmation email delivery failed; contact family',
      },
    });
    expect(applicationApprovalError({
      applicantType: 'new',
      interestConfirmationTokenHash: interestTokenHash('g'.repeat(43)),
      interestConfirmationSentAt: null,
    })).toBe('Parent email interest confirmation is required before application approval.');
  });
});

describe('parent interest confirmation', () => {
  function confirmationPrisma(app, updateCount = 1) {
    const prismaClient = {
      application: {
        findUnique: jest.fn().mockResolvedValue(app),
        updateMany: jest.fn().mockResolvedValue({ count: updateCount }),
      },
      applicationEvent: { create: jest.fn().mockResolvedValue({ id: 'event-confirmed' }) },
    };
    prismaClient.$transaction = jest.fn((callback) => callback(prismaClient));
    return prismaClient;
  }

  test('confirms a valid token once and alerts admissions after confirmation', async () => {
    const now = new Date('2026-08-08T12:00:00.000Z');
    const token = 'c'.repeat(43);
    const app = {
      ...validBody(),
      id: 'app-1',
      parentEmail: 'parent@example.com',
      interestConfirmedAt: null,
      interestConfirmationExpiresAt: new Date('2026-08-09T12:00:00.000Z'),
    };
    const prismaClient = confirmationPrisma(app);
    const sendAlert = jest.fn().mockResolvedValue({ ok: true });

    await expect(confirmPublicApplicationInterest(token, { prismaClient, sendAlert, now }))
      .resolves.toEqual({ ok: true, state: 'confirmed' });
    expect(prismaClient.application.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { interestConfirmationTokenHash: interestTokenHash(token) },
    }));
    expect(prismaClient.applicationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'parent_interest_confirmed', applicationId: 'app-1' }),
    });
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  test('is idempotent and does not alert again for an already confirmed token', async () => {
    const now = new Date('2026-08-08T12:00:00.000Z');
    const app = {
      id: 'app-1',
      interestConfirmedAt: new Date('2026-08-08T11:00:00.000Z'),
      interestConfirmationExpiresAt: new Date('2026-08-09T12:00:00.000Z'),
    };
    const prismaClient = confirmationPrisma(app);
    const sendAlert = jest.fn();

    await expect(confirmPublicApplicationInterest('d'.repeat(43), { prismaClient, sendAlert, now }))
      .resolves.toEqual({ ok: true, state: 'confirmed' });
    expect(prismaClient.application.updateMany).not.toHaveBeenCalled();
    expect(sendAlert).not.toHaveBeenCalled();
  });

  test('returns one generic state for malformed, missing, or expired tokens', async () => {
    const now = new Date('2026-08-08T12:00:00.000Z');
    const missingPrisma = confirmationPrisma(null);
    const expiredPrisma = confirmationPrisma({
      id: 'app-1',
      interestConfirmedAt: null,
      interestConfirmationExpiresAt: new Date('2026-08-08T11:59:59.000Z'),
    });

    await expect(confirmPublicApplicationInterest('short', { prismaClient: missingPrisma, now }))
      .resolves.toEqual({ ok: true, state: 'invalid_or_expired' });
    await expect(confirmPublicApplicationInterest('e'.repeat(43), { prismaClient: missingPrisma, now }))
      .resolves.toEqual({ ok: true, state: 'invalid_or_expired' });
    await expect(confirmPublicApplicationInterest('f'.repeat(43), { prismaClient: expiredPrisma, now }))
      .resolves.toEqual({ ok: true, state: 'invalid_or_expired' });
  });
});
