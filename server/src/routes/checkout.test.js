const { checkoutSessionSummary } = require('./checkout');

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
