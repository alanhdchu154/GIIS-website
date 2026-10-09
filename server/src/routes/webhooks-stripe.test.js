const mockPrisma = {
  application: { findUnique: jest.fn() },
  applicationEvent: { upsert: jest.fn() },
};
jest.mock('../lib/prisma', () => mockPrisma);

const { resolveWebhookVerificationMode, recordApplicationPaymentConfirmation } = require('./webhooks-stripe');

describe('Stripe webhook verification mode', () => {
  test('blocks missing signing secret unless local unverified mode is explicitly enabled', () => {
    expect(resolveWebhookVerificationMode({
      webhookSecret: '',
      signature: '',
      nodeEnv: 'production',
      allowUnverifiedFlag: '',
    })).toMatchObject({
      ok: false,
      status: 500,
      message: 'Webhook signing secret not configured.',
    });
  });

  test('allows unverified parsing only outside production with explicit opt-in', () => {
    expect(resolveWebhookVerificationMode({
      webhookSecret: '',
      signature: '',
      nodeEnv: 'development',
      allowUnverifiedFlag: '1',
    })).toEqual({ ok: true, mode: 'unverified-dev' });
  });

  test('blocks unsigned events even when the signing secret is configured', () => {
    expect(resolveWebhookVerificationMode({
      webhookSecret: 'whsec_test',
      signature: '',
      nodeEnv: 'production',
      allowUnverifiedFlag: '',
    })).toMatchObject({
      ok: false,
      status: 400,
      message: 'Webhook signature missing.',
    });
  });

  test('uses signed Stripe verification when secret and signature are present', () => {
    expect(resolveWebhookVerificationMode({
      webhookSecret: 'whsec_test',
      signature: 't=123,v1=abc',
      nodeEnv: 'production',
      allowUnverifiedFlag: '',
    })).toEqual({ ok: true, mode: 'signed' });
  });
});

describe('application-bound Stripe payment receipt', () => {
  beforeEach(() => jest.clearAllMocks());

  test('records a paid Checkout receipt on the exact application', async () => {
    const reviewedAt = new Date('2026-10-09T12:00:00.000Z');
    mockPrisma.application.findUnique.mockResolvedValue({
      id: 'app_fixture', status: 'approved', reviewedAt,
      placementRequired: false, placementDecision: null,
    });
    mockPrisma.applicationEvent.upsert.mockResolvedValue({ id: 'event_fixture' });

    await recordApplicationPaymentConfirmation(
      { id: 'cs_fixture', payment_status: 'paid', metadata: { applicationId: 'app_fixture', approvalRevision: reviewedAt.toISOString() } },
      { id: 'sub_fixture', status: 'active', planType: 'guided_monthly', amountTotal: 14900 },
    );

    expect(mockPrisma.application.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'app_fixture' } }));
    expect(mockPrisma.applicationEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        applicationId: 'app_fixture',
        action: 'stripe_payment_confirmed',
        actorEmail: 'stripe-webhook',
        metadata: expect.objectContaining({ checkoutSessionId: 'cs_fixture', subscriptionId: 'sub_fixture' }),
      }),
    }));
  });

  test('routes payment to manual review when the approval revision or placement gate changed', async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: 'app_fixture', status: 'pending', reviewedAt: new Date('2026-10-10T12:00:00.000Z'),
      placementRequired: true, placementDecision: null,
    });
    mockPrisma.applicationEvent.upsert.mockResolvedValue({ id: 'event_fixture' });

    await recordApplicationPaymentConfirmation(
      { id: 'cs_stale', payment_status: 'paid', metadata: { applicationId: 'app_fixture', approvalRevision: '2026-10-09T12:00:00.000Z' } },
      { id: 'sub_fixture', status: 'active', planType: 'guided_monthly', amountTotal: 14900 },
    );

    expect(mockPrisma.applicationEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        action: 'stripe_payment_review_required',
        metadata: expect.objectContaining({
          approvalStillValid: false,
          reviewReason: 'admissions_gate_changed_after_checkout',
        }),
      }),
    }));
  });

  test('does not call an incomplete Checkout a payment confirmation', async () => {
    await recordApplicationPaymentConfirmation(
      { id: 'cs_fixture', metadata: { applicationId: 'app_fixture' } },
      { id: 'sub_fixture', status: 'incomplete', planType: 'guided_monthly', amountTotal: 14900 },
    );

    expect(mockPrisma.application.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.applicationEvent.upsert).not.toHaveBeenCalled();
  });
});
