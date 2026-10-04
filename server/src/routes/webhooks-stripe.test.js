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
    mockPrisma.application.findUnique.mockResolvedValue({ id: 'app_fixture' });
    mockPrisma.applicationEvent.upsert.mockResolvedValue({ id: 'event_fixture' });

    await recordApplicationPaymentConfirmation(
      { id: 'cs_fixture', payment_status: 'paid', metadata: { applicationId: 'app_fixture' } },
      { id: 'sub_fixture', status: 'active', planType: 'guided_monthly', amountTotal: 14900 },
    );

    expect(mockPrisma.application.findUnique).toHaveBeenCalledWith({
      where: { id: 'app_fixture' }, select: { id: true },
    });
    expect(mockPrisma.applicationEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        applicationId: 'app_fixture',
        action: 'stripe_payment_confirmed',
        actorEmail: 'stripe-webhook',
        metadata: expect.objectContaining({ checkoutSessionId: 'cs_fixture', subscriptionId: 'sub_fixture' }),
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
