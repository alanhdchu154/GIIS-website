// Synthetic lifecycle checks: never instantiate real Stripe or a real DB.
const mockDb = {
  processedStripeEvent: { create: jest.fn(), findUnique: jest.fn() },
  subscription: { findUnique: jest.fn(), update: jest.fn() },
  applicationEvent: { findFirst: jest.fn(), upsert: jest.fn() },
  studentAccount: { update: jest.fn(), findUnique: jest.fn() },
  auditLog: { create: jest.fn() },
  $transaction: jest.fn(),
};
const mockStripe = {
  webhooks: { constructEvent: jest.fn() },
  invoicePayments: { list: jest.fn() },
  invoices: { retrieve: jest.fn() },
  subscriptions: { retrieve: jest.fn() },
  checkout: { sessions: { list: jest.fn() } },
};
jest.mock('../lib/prisma', () => mockDb);
jest.mock('stripe', () => () => mockStripe);
process.env.STRIPE_SECRET_KEY = 'synthetic-only';
process.env.STRIPE_WEBHOOK_SECRET = 'synthetic-only';
const router = require('./webhooks-stripe');
const handler = router.stack.find(layer => layer.route?.path === '/').route.stack[0].handle;
const record = { id: 'row_a', stripeSubscriptionId: 'sub_a', stripeCheckoutSessionId: 'cs_a', studentId: 'student_a', paymentFailureCount: 0, student: { account: { id: 'account_a' } } };
async function deliver(type, object) {
  if (type.startsWith('invoice.')) object = { id: 'in_a', amount_paid: 14900, currency: 'usd', ...object };
  mockStripe.webhooks.constructEvent.mockReturnValue({ id: 'evt_synthetic', type, data: { object } });
  const res = { code: 200, status(c) { this.code = c; return this; }, json(body) { this.body = body; return this; }, send(body) { this.body = body; return this; } };
  await handler({ headers: { 'stripe-signature': 'synthetic' }, body: Buffer.from('{}') }, res);
  return res;
}
beforeEach(() => {
  jest.resetAllMocks();
  mockDb.$transaction.mockImplementation(callback => callback(mockDb));
  mockDb.subscription.findUnique.mockResolvedValue(record);
  mockDb.subscription.update.mockResolvedValue({ ...record, paymentFailureCount: 1 });
  mockDb.applicationEvent.findFirst.mockResolvedValue({ applicationId: 'app_a' });
  mockStripe.invoicePayments.list.mockResolvedValue({ has_more: false, data: [{ invoice: 'in_a', payment: { payment_intent: 'pi_a' } }] });
  mockStripe.invoices.retrieve.mockResolvedValue({ parent: { subscription_details: { subscription: 'sub_a' } } });
  mockStripe.subscriptions.retrieve.mockResolvedValue({ id: 'sub_a', status: 'past_due', items: { data: [{ current_period_end: 1800000000 }] } });
});
test('modern invoice failure mutation and dedupe use one transaction', async () => {
  const response = await deliver('invoice.payment_failed', { parent: { subscription_details: { subscription: 'sub_a' } } });
  expect(response.code).toBe(200);
  expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
  expect(mockDb.subscription.update).toHaveBeenCalledWith({ where: { stripeSubscriptionId: 'sub_a' }, data: expect.objectContaining({ status: 'past_due', paymentFailureCount: { increment: 1 } }) });
  expect(mockDb.processedStripeEvent.create.mock.invocationCallOrder[0]).toBeLessThan(mockDb.subscription.update.mock.invocationCallOrder[0]);
});
test('duplicate non-Checkout event cannot increment failures again', async () => {
  mockDb.processedStripeEvent.create.mockRejectedValue(Object.assign(new Error('duplicate'), { code: 'P2002' }));
  mockDb.processedStripeEvent.findUnique.mockResolvedValue({ eventId: 'evt_synthetic' });
  expect((await deliver('invoice.payment_failed', { subscription: 'sub_a' })).body.duplicate).toBe(true);
  expect(mockDb.subscription.update).not.toHaveBeenCalled();
});
test('invoice arriving before Checkout is retryable', async () => {
  mockDb.subscription.findUnique.mockResolvedValue(null);
  expect((await deliver('invoice.payment_succeeded', { subscription: 'sub_a' })).code).toBe(500);
  expect(mockDb.subscription.update).not.toHaveBeenCalled();
});
test('modern exact PaymentIntent refund creates visible receipt and revokes full-refund access', async () => {
  expect((await deliver('charge.refunded', { id: 'ch_a', payment_intent: 'pi_a', customer: 'shared_customer', amount: 14900, amount_refunded: 14900, currency: 'usd' })).code).toBe(200);
  expect(mockStripe.invoicePayments.list).toHaveBeenCalledWith({ payment: { type: 'payment_intent', payment_intent: 'pi_a' }, limit: 100 });
  expect(mockDb.applicationEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ applicationId: 'app_a', action: 'stripe_refund_recorded' }) }));
  expect(mockDb.studentAccount.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'account_a' }, data: expect.objectContaining({ isActive: false }) }));
});
test('partial refund is visible without status or account changes', async () => {
  expect((await deliver('charge.refunded', { id: 'ch_a', payment_intent: 'pi_a', amount: 14900, amount_refunded: 100, currency: 'usd' })).code).toBe(200);
  expect(mockDb.applicationEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ action: 'stripe_partial_refund_recorded' }) }));
  expect(mockDb.subscription.update).not.toHaveBeenCalled();
  expect(mockDb.studentAccount.update).not.toHaveBeenCalled();
});
test('unmatched refund retries without guessing by customer', async () => {
  mockStripe.invoicePayments.list.mockResolvedValue({ data: [], has_more: false });
  mockStripe.checkout.sessions.list.mockResolvedValue({ data: [], has_more: false });
  expect((await deliver('charge.refunded', { id: 'ch_a', payment_intent: 'pi_a', customer: 'shared_customer', amount: 14900, amount_refunded: 14900 })).code).toBe(500);
  expect(mockStripe.checkout.sessions.list).toHaveBeenCalledWith({ payment_intent: 'pi_a', limit: 100 });
  expect(mockDb.subscription.findUnique).not.toHaveBeenCalled();
});
test('effect failure rejects transaction and requests retry', async () => {
  mockDb.subscription.update.mockRejectedValue(new Error('storage unavailable'));
  expect((await deliver('invoice.payment_failed', { subscription: 'sub_a' })).code).toBe(500);
  expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
});
test('delayed invoice success cannot restore a refunded enrollment', async () => {
  mockDb.subscription.findUnique.mockResolvedValue({ ...record, status: 'refunded' });
  expect((await deliver('invoice.payment_succeeded', { subscription: 'sub_a' })).code).toBe(200);
  expect(mockDb.subscription.update).not.toHaveBeenCalled();
  expect(mockDb.studentAccount.update).not.toHaveBeenCalled();
  expect(mockDb.applicationEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'stripe-invoice-paid:in_a' } }));
});
test('old failure after newer success keeps current active state without increment or lock', async () => {
  mockStripe.subscriptions.retrieve.mockResolvedValue({ id: 'sub_a', status: 'active', items: { data: [{ current_period_end: 1800000000 }] } });
  mockDb.subscription.update.mockResolvedValue({ ...record, paymentFailureCount: 5 });
  expect((await deliver('invoice.payment_failed', { subscription: 'sub_a' })).code).toBe(200);
  const data = mockDb.subscription.update.mock.calls[0][0].data;
  expect(data.status).toBe('active');
  expect(data).not.toHaveProperty('paymentFailureCount');
  expect(mockDb.studentAccount.update).not.toHaveBeenCalled();
});
test('old success does not unlock currently past-due subscription but records renewal receipt', async () => {
  mockDb.subscription.findUnique.mockResolvedValue({ ...record, student: { account: { id: 'account_a', softLocked: true, lockReason: 'payment_past_due' } } });
  expect((await deliver('invoice.payment_succeeded', { subscription: 'sub_a', billing_reason: 'subscription_cycle' })).code).toBe(200);
  expect(mockDb.subscription.update.mock.calls[0][0].data.status).toBe('past_due');
  expect(mockDb.subscription.update.mock.calls[0][0].data).not.toHaveProperty('paymentFailureCount');
  expect(mockDb.studentAccount.update).not.toHaveBeenCalled();
  expect(mockDb.applicationEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'stripe-invoice-paid:in_a' }, create: expect.objectContaining({ applicationId: 'app_a', metadata: expect.objectContaining({ invoiceId: 'in_a', amountPaid: 14900, currency: 'usd' }) }),
  }));
});
test('subscription update uses freshly retrieved status and period', async () => {
  expect((await deliver('customer.subscription.updated', { id: 'sub_a', status: 'active', current_period_end: 1 })).code).toBe(200);
  expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_a');
  expect(mockDb.subscription.update.mock.calls[0][0].data).toEqual(expect.objectContaining({ status: 'past_due', currentPeriodEnd: new Date(1800000000000) }));
});
