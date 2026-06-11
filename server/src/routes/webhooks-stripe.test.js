const { resolveWebhookVerificationMode } = require('./webhooks-stripe');

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
