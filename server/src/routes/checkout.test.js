const {
  ADMISSIONS_WORKFLOW_VERSION,
  RENEWAL_CHECKOUT_RETRY_WINDOW_MS,
  checkoutSessionSummary,
  renewalCheckoutIdempotencyKey,
} = require('./checkout');

test('advertises only the transfer-v2-compatible admissions workflow', () => {
  expect(ADMISSIONS_WORKFLOW_VERSION).toBe('admissions-v5');
});

describe('checkoutSessionSummary', () => {
  test('returns only welcome-page fields and omits customer details', () => {
    const summary = checkoutSessionSummary(
      {
        status: 'complete',
        payment_status: 'paid',
        customer_email: 'private@example.com',
        amount_total: 4999,
        metadata: { planType: 'self_paced_monthly', maxStudents: '2' },
      },
      true,
    );

    expect(summary).toEqual({
      status: 'complete',
      paymentStatus: 'paid',
      planType: 'self_paced_monthly',
      maxStudents: 2,
      knownInDb: true,
    });
    expect(summary).not.toHaveProperty('email');
    expect(summary).not.toHaveProperty('amountTotal');
  });
});

describe('renewalCheckoutIdempotencyKey', () => {
  const identity = { parentId: 'parent-a', studentId: 'student-a', planType: 'guided_monthly' };

  test('deduplicates a retry inside the same bounded window', () => {
    const start = RENEWAL_CHECKOUT_RETRY_WINDOW_MS * 100;
    expect(renewalCheckoutIdempotencyKey({ ...identity, now: start + 1 }))
      .toBe(renewalCheckoutIdempotencyKey({ ...identity, now: start + 30_000 }));
  });

  test('allows a new intent for a different plan or later window', () => {
    const start = RENEWAL_CHECKOUT_RETRY_WINDOW_MS * 100;
    const original = renewalCheckoutIdempotencyKey({ ...identity, now: start + 1 });
    expect(renewalCheckoutIdempotencyKey({ ...identity, planType: 'premium_monthly', now: start + 1 })).not.toBe(original);
    expect(renewalCheckoutIdempotencyKey({ ...identity, now: start + RENEWAL_CHECKOUT_RETRY_WINDOW_MS })).not.toBe(original);
  });
});
