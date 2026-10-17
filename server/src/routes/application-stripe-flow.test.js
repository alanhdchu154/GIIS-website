// Synthetic route integration: no real database, keys, charges, or mail.
const mockDb = {
  adminUser: { findUnique: jest.fn(), findFirst: jest.fn() },
  application: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  applicationEvent: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), upsert: jest.fn() },
  placementDecision: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
  transferCreditEvaluation: { findUnique: jest.fn(), updateMany: jest.fn() },
  subscription: { upsert: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
  processedStripeEvent: { create: jest.fn(), findUnique: jest.fn() },
  student: { findFirst: jest.fn() },
  $transaction: jest.fn(),
};
const mockStripe = {
  checkout: { sessions: { create: jest.fn(), retrieve: jest.fn() } },
  subscriptions: { retrieve: jest.fn() },
  webhooks: { constructEvent: jest.fn() },
};
const mockSendStatusLinkEmail = jest.fn();
jest.mock('../lib/prisma', () => mockDb);
jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => req.auth ? next() : res.status(401).json({ error: 'Unauthenticated' }),
  requireAdmin: (req, res, next) => req.auth.role === 'admin' ? next() : res.status(403).json({ error: 'Forbidden' }),
  requirePermission: () => (req, res, next) => req.auth.role === 'admin' ? next() : res.status(403).json({ error: 'Forbidden' }),
  requireStaffRole: role => (req, res, next) => req.staff?.role === role ? next() : res.status(403).json({ error: 'Forbidden' }),
}));
jest.mock('../lib/mailer', () => ({ sendStatusLinkEmail: mockSendStatusLinkEmail }));
jest.mock('stripe', () => () => mockStripe);
process.env.STRIPE_SECRET_KEY = 'synthetic-only';
process.env.STRIPE_WEBHOOK_SECRET = 'synthetic-only';
process.env.STRIPE_PRICE_GUIDED_MONTHLY = 'price_synthetic';
process.env.PRINCIPAL_APPROVER_EMAIL = 'staff@example.invalid';
const applications = require('./applications');
const webhook = require('./webhooks-stripe');

async function invoke(router, path, request = {}, method = 'post') {
  const route = router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route;
  const req = { params: { id: 'app_a' }, headers: {}, body: {}, ...request };
  const res = { code: 200, headers: {}, status(c) { this.code = c; return this; }, set(k, v) { this.headers[k] = v; return this; }, json(b) { this.body = b; return this; }, send(b) { this.body = b; return this; } };
  for (const item of route.stack) {
    let next = false;
    await item.handle(req, res, () => { next = true; });
    if (!next) break;
  }
  return res;
}
const approved = { id: 'app_a', applicantType: 'new', status: 'approved', parentEmail: 'shared@example.invalid', interestConfirmedAt: new Date(), reviewedAt: new Date('2026-10-01'), updatedAt: new Date('2026-10-09T12:00:00.000Z') };
const adminRequest = { auth: { role: 'admin', email: 'staff@example.invalid' }, staff: { id: 'principal_admin', email: 'staff@example.invalid', displayName: 'Shiyu Zhang, Ph.D.', role: 'principal' }, body: { planType: 'guided_monthly', price: 'attacker_price', email: 'other@example.invalid' } };
const session = { id: 'cs_a', mode: 'subscription', subscription: 'sub_a', status: 'complete', payment_status: 'paid', amount_total: 14900, currency: 'usd', customer: 'cus_a', customer_email: 'shared@example.invalid', metadata: { applicationId: 'app_a', planType: 'guided_monthly', approvalRevision: approved.reviewedAt.toISOString() } };
beforeEach(() => {
  jest.resetAllMocks();
  mockDb.adminUser.findUnique.mockResolvedValue({ id: 'principal_admin', role: 'principal', isActive: true });
  mockDb.application.findUnique.mockResolvedValue(approved);
  mockDb.application.updateMany.mockResolvedValue({ count: 1 });
  mockDb.applicationEvent.findFirst.mockResolvedValue(null);
  mockDb.applicationEvent.findMany.mockResolvedValue([]);
  mockDb.subscription.findMany.mockResolvedValue([]);
  mockDb.student.findFirst.mockResolvedValue(null);
  mockDb.applicationEvent.create.mockResolvedValue({ id: 'application_event' });
  mockDb.application.update.mockResolvedValue(approved);
  mockSendStatusLinkEmail.mockResolvedValue({ ok: true, id: 'mail_synthetic' });
  mockDb.placementDecision.create.mockImplementation(async ({ data }) => ({ id: 'placement_a', ...data }));
  mockDb.placementDecision.updateMany.mockResolvedValue({ count: 1 });
  mockDb.placementDecision.findUnique.mockResolvedValue({ id: 'placement_a', applicationId: 'app_a', result: 'ready_with_bridge' });
  mockDb.transferCreditEvaluation.updateMany.mockResolvedValue({ count: 1 });
  mockDb.transferCreditEvaluation.findUnique.mockResolvedValue({ id: 'transfer_a', applicationId: 'app_a', principalApprovedAt: new Date(), courses: [] });
  mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_a', url: 'https://checkout.stripe.com/synthetic' });
  mockDb.$transaction.mockImplementation(fn => fn(mockDb));
  mockDb.subscription.upsert.mockResolvedValue({ id: 'dbsub_a', status: 'active', planType: 'guided_monthly', amountTotal: 14900 });
  mockStripe.subscriptions.retrieve.mockResolvedValue({ id: 'sub_a', status: 'active', items: { data: [{ current_period_end: 1800000000, price: { id: 'price_synthetic' } }] } });
  mockStripe.webhooks.constructEvent.mockReturnValue({ id: 'evt_a', type: 'checkout.session.completed', data: { object: session } });
});

test('public status lookup returns a fixed parent-safe allowlist and no-store headers', async () => {
  mockDb.application.findUnique.mockResolvedValue({
    id: 'app_a', parentEmail: 'parent@example.invalid', studentName: 'Student',
    status: 'pending', applicantType: 'transfer', recordsStatus: 'requested',
    interestConfirmedAt: new Date('2026-10-01T00:00:00.000Z'), accountsCreated: false,
    placementRequired: false, placementDecision: null,
    createdAt: new Date('2026-09-30T00:00:00.000Z'), updatedAt: new Date('2026-10-02T00:00:00.000Z'),
  });
  const response = await invoke(applications, '/status', { body: { token: 's'.repeat(43) } });
  expect(response.code).toBe(200);
  expect(response.headers['Cache-Control']).toBe('no-store, private');
  expect(Object.keys(response.body).sort()).toEqual([
    'accountsReady', 'interestConfirmed', 'nextStep', 'placement', 'recordsStatus', 'stage', 'state', 'submittedAt', 'updatedAt',
  ].sort());
  expect(response.body).not.toHaveProperty('id');
  expect(response.body).not.toHaveProperty('parentEmail');
  expect(response.body).not.toHaveProperty('studentName');
  expect(response.body).not.toHaveProperty('rejectionReason');
});

test('public status lookup uses one generic invalid response', async () => {
  const malformed = await invoke(applications, '/status', { body: { token: 'short' } });
  expect(malformed.body).toEqual({ state: 'invalid' });
  expect(mockDb.application.findUnique).not.toHaveBeenCalled();
  mockDb.application.findUnique.mockResolvedValue(null);
  const unknown = await invoke(applications, '/status', { body: { token: 'u'.repeat(43) } });
  expect(unknown.body).toEqual({ state: 'invalid' });
});

test('public status lookup reports a retryable temporary failure without claiming the token is invalid', async () => {
  mockDb.application.findUnique.mockRejectedValueOnce(new Error('synthetic database outage'));
  const response = await invoke(applications, '/status', { body: { token: 't'.repeat(43) } });
  expect(response.code).toBe(503);
  expect(response.body).toEqual({
    state: 'unavailable',
    error: 'Application status is temporarily unavailable. Please try again.',
  });
});

test('status-link issuance is admin-only, stores only a hash, and returns no credential', async () => {
  expect((await invoke(applications, '/:id/status-link')).code).toBe(401);
  mockDb.application.findUnique.mockResolvedValue({
    id: 'app_a', parentEmail: 'parent@example.invalid', parentName: 'Parent', studentName: 'Student',
    preferredLanguage: 'en', communicationLanguage: 'en', statusTokenIssuedAt: null,
  });
  const response = await invoke(applications, '/:id/status-link', adminRequest);
  expect(response.code).toBe(200);
  expect(response.body).toEqual({ ok: true, delivery: { status: 'sent' } });
  const persisted = mockDb.application.updateMany.mock.calls[0][0].data;
  expect(persisted.statusTokenHash).toMatch(/^[a-f0-9]{64}$/);
  const delivery = mockSendStatusLinkEmail.mock.calls[0][0];
  const configuredSite = (process.env.CORS_ORIGIN || 'https://genesisideas.school').split(',')[0].trim().replace(/\/$/, '');
  expect(delivery.statusUrl).toMatch(new RegExp(
    `^${configuredSite.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/application/status#token=[A-Za-z0-9_-]{43}$`,
  ));
  expect(JSON.stringify(response.body)).not.toContain('token');
  expect(JSON.stringify(response.body)).not.toContain('statusUrl');
});

test('status-link delivery failure is explicit and records no credential', async () => {
  mockDb.application.findUnique.mockResolvedValue({
    id: 'app_a', parentEmail: 'parent@example.invalid', parentName: 'Parent', studentName: 'Student',
    preferredLanguage: 'en', communicationLanguage: 'en',
    statusTokenHash: 'old-hash',
    statusTokenIssuedAt: new Date('2026-10-01T00:00:00.000Z'),
    statusTokenRotatedAt: new Date('2026-10-02T00:00:00.000Z'),
  });
  mockSendStatusLinkEmail.mockResolvedValue({ ok: false, error: 'synthetic failure' });
  const response = await invoke(applications, '/:id/status-link', adminRequest);
  expect(response.code).toBe(502);
  expect(response.body).toEqual({
    error: 'Status link email could not be delivered. The previous status link remains valid.',
    code: 'status_link_delivery_failed',
  });
  expect(mockDb.application.updateMany).toHaveBeenNthCalledWith(2, {
    where: { id: 'app_a', statusTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) },
    data: {
      statusTokenHash: 'old-hash',
      statusTokenIssuedAt: new Date('2026-10-01T00:00:00.000Z'),
      statusTokenRotatedAt: new Date('2026-10-02T00:00:00.000Z'),
    },
  });
  expect(mockDb.applicationEvent.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ action: 'status_link_delivery_failed' }),
  });
  expect(JSON.stringify(response.body)).not.toContain('#token=');
});

test('failed first status-link delivery restores null and does not claim an older link exists', async () => {
  mockDb.application.findUnique.mockResolvedValue({
    id: 'app_a', parentEmail: 'parent@example.invalid', parentName: 'Parent', studentName: 'Student',
    preferredLanguage: 'en', communicationLanguage: 'en', statusTokenHash: null,
    statusTokenIssuedAt: null, statusTokenRotatedAt: null,
  });
  mockSendStatusLinkEmail.mockResolvedValue({ ok: false, error: 'synthetic failure' });
  const response = await invoke(applications, '/:id/status-link', adminRequest);
  expect(response.code).toBe(502);
  expect(response.body).toEqual({
    error: 'Status link email could not be delivered. No status link was issued.',
    code: 'status_link_delivery_failed',
  });
  expect(mockDb.application.updateMany).toHaveBeenNthCalledWith(2, {
    where: { id: 'app_a', statusTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) },
    data: { statusTokenHash: null, statusTokenIssuedAt: null, statusTokenRotatedAt: null },
  });
});

test('status-link delivery reports uncertain state if guarded rollback loses a concurrent rotation', async () => {
  mockDb.application.findUnique.mockResolvedValue({
    id: 'app_a', parentEmail: 'parent@example.invalid', parentName: 'Parent', studentName: 'Student',
    preferredLanguage: 'en', communicationLanguage: 'en', statusTokenHash: 'old-hash',
    statusTokenIssuedAt: new Date('2026-10-01T00:00:00.000Z'), statusTokenRotatedAt: null,
  });
  mockSendStatusLinkEmail.mockResolvedValue({ ok: false, error: 'synthetic failure' });
  mockDb.application.updateMany
    .mockResolvedValueOnce({ count: 1 })
    .mockResolvedValueOnce({ count: 0 });
  const response = await invoke(applications, '/:id/status-link', adminRequest);
  expect(response.code).toBe(503);
  expect(response.body.code).toBe('status_link_delivery_state_uncertain');
  expect(JSON.stringify(response.body)).not.toContain('#token=');
});

test('status-link issuance fails closed on a concurrent credential rotation before sending mail', async () => {
  mockDb.application.findUnique.mockResolvedValue({
    id: 'app_a', parentEmail: 'parent@example.invalid', parentName: 'Parent', studentName: 'Student',
    preferredLanguage: 'en', communicationLanguage: 'en', statusTokenHash: 'observed-old-hash',
    statusTokenIssuedAt: new Date('2026-10-01T00:00:00.000Z'), statusTokenRotatedAt: null,
  });
  mockDb.application.updateMany.mockResolvedValueOnce({ count: 0 });
  const response = await invoke(applications, '/:id/status-link', adminRequest);
  expect(response.code).toBe(409);
  expect(response.body.code).toBe('status_link_rotation_conflict');
  expect(mockSendStatusLinkEmail).not.toHaveBeenCalled();
  expect(mockDb.applicationEvent.create).not.toHaveBeenCalled();
});

test('non-admin and unapproved applications cannot create Stripe sessions', async () => {
  expect((await invoke(applications, '/:id/stripe-checkout')).code).toBe(401);
  expect((await invoke(applications, '/:id/stripe-checkout', { ...adminRequest, auth: { role: 'parent' } })).code).toBe(403);
  mockDb.application.findUnique.mockResolvedValue({ ...approved, status: 'pending' });
  expect((await invoke(applications, '/:id/stripe-checkout', adminRequest)).code).toBe(400);
  expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
});
test('a required unsigned placement record blocks payment checkout', async () => {
  mockDb.application.findUnique.mockResolvedValue({
    ...approved,
    placementRequired: true,
    placementDecision: { result: 'ready_with_bridge', principalApprovedAt: null },
  });
  const response = await invoke(applications, '/:id/stripe-checkout', adminRequest);
  expect(response.code).toBe(400);
  expect(response.body.error).toBe('The placement decision requires recorded Principal approval.');
  expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
});

test('admin saves placement evidence without approving admission', async () => {
  mockDb.application.findUnique.mockResolvedValue({
    ...approved,
    status: 'pending',
    placementRequired: true,
    placementDecision: null,
    accountsCreated: false,
  });
  const body = {
    assessmentDate: '2026-10-09', assessor: 'Academic Reviewer',
    englishScore: 24, mathScore: 27, scienceScore: 19,
    assistanceNotes: 'Directions only', evidenceReviewed: 'Assessment and work samples',
    independentLearningNotes: 'Independent work observed', result: 'ready_with_bridge',
    recommendedGradeLevel: 'Grade 9', decisionRationale: 'Ready with a writing bridge',
    bridgePlan: 'Weekly writing review', firstTermPlan: 'Four introductory Grade 9 modules',
    firstWeekReviewer: 'First Week Reviewer', recheckDate: '2026-11-20',
  };
  const response = await invoke(applications, '/:id/placement-decision', { ...adminRequest, body }, 'put');
  expect(response.code).toBe(200);
  expect(mockDb.placementDecision.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ applicationId: 'app_a', result: 'ready_with_bridge' }),
  });
  expect(mockDb.applicationEvent.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ action: 'placement_decision_saved', applicationId: 'app_a' }),
  });
  expect(mockDb.application.update).not.toHaveBeenCalled();
});

test('Principal sign-off is recorded separately and remains idempotent', async () => {
  const placementDecision = { id: 'placement_a', result: 'ready_with_bridge', principalApprovedAt: null, updatedAt: new Date('2026-10-09T12:05:00.000Z') };
  mockDb.application.findUnique.mockResolvedValue({
    ...approved,
    status: 'pending',
    placementRequired: true,
    placementDecision,
  });
  const request = { ...adminRequest, body: { principalApprover: 'Spoofed Body Name' } };
  const response = await invoke(applications, '/:id/placement-decision/principal-approval', request);
  expect(response.code).toBe(200);
  expect(mockDb.placementDecision.updateMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { applicationId: 'app_a', principalApprovedAt: null, updatedAt: placementDecision.updatedAt },
    data: expect.objectContaining({
      principalApprover: 'Shiyu Zhang, Ph.D.',
      principalApproverEmail: 'staff@example.invalid',
      principalApproverId: 'principal_admin',
      principalApprovedAt: expect.any(Date),
    }),
  }));
  expect(mockDb.applicationEvent.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ action: 'placement_decision_principal_approved', applicationId: 'app_a' }),
  });

  mockDb.application.findUnique.mockResolvedValue({
    ...approved,
    status: 'pending',
    placementRequired: true,
    placementDecision: { ...placementDecision, principalApprovedAt: new Date() },
  });
  mockDb.placementDecision.updateMany.mockResolvedValueOnce({ count: 0 });
  mockDb.placementDecision.findUnique.mockResolvedValueOnce({ ...placementDecision, principalApprovedAt: new Date() });
  const repeat = await invoke(applications, '/:id/placement-decision/principal-approval', request);
  expect(repeat.body.alreadyApproved).toBe(true);
  expect(mockDb.placementDecision.updateMany).toHaveBeenCalledTimes(2);
});
test('placement signature rejects an unsigned record changed after Principal review', async () => {
  const reviewedAt = new Date('2026-10-09T12:05:00.000Z');
  mockDb.application.findUnique.mockResolvedValue({
    ...approved, status: 'pending', placementRequired: true,
    placementDecision: { id: 'placement_a', result: 'ready', principalApprovedAt: null, updatedAt: reviewedAt },
  });
  mockDb.placementDecision.updateMany.mockResolvedValue({ count: 0 });
  mockDb.placementDecision.findUnique.mockResolvedValue({
    id: 'placement_a', result: 'ready_with_bridge', principalApprovedAt: null, updatedAt: new Date(reviewedAt.getTime() + 1000),
  });
  const response = await invoke(applications, '/:id/placement-decision/principal-approval', adminRequest);
  expect(response.code).toBe(409);
  expect(response.body.error).toMatch(/changed during review/);
});
test('non-Principal admins cannot sign a placement decision', async () => {
  mockDb.application.findUnique.mockResolvedValue({
    ...approved,
    status: 'pending',
    placementRequired: true,
    placementDecision: { id: 'placement_a', result: 'ready', principalApprovedAt: null, updatedAt: new Date() },
  });
  const response = await invoke(applications, '/:id/placement-decision/principal-approval', {
    ...adminRequest,
    auth: { role: 'admin', email: 'admissions@example.invalid' },
    staff: { id: 'admissions_admin', email: 'admissions@example.invalid', displayName: 'Admissions', role: 'admissions_staff' },
    body: { principalApprover: 'Not the Principal' },
  });
  expect(response.code).toBe(403);
  expect(mockDb.placementDecision.updateMany).not.toHaveBeenCalled();
});
test('a second Principal-role account cannot sign for the configured Principal', async () => {
  mockDb.application.findUnique.mockResolvedValue({
    ...approved, status: 'pending', placementRequired: true,
    placementDecision: { id: 'placement_a', result: 'ready', principalApprovedAt: null, updatedAt: new Date() },
  });
  const response = await invoke(applications, '/:id/placement-decision/principal-approval', {
    ...adminRequest,
    auth: { role: 'admin', email: 'other-principal@example.invalid' },
    staff: { id: 'principal-2', email: 'other-principal@example.invalid', displayName: 'Other Principal', role: 'principal' },
  });
  expect(response.code).toBe(403);
  expect(mockDb.placementDecision.updateMany).not.toHaveBeenCalled();
});
test('transfer sign-off is bound to the authenticated Principal, not request body', async () => {
  mockDb.application.findUnique.mockResolvedValue({
    ...approved,
    applicantType: 'transfer',
    status: 'pending',
    recordsStatus: 'verified',
    transferEvaluation: {
      id: 'transfer_a', principalApprovedAt: null, updatedAt: new Date('2026-10-09T12:05:00.000Z'),
      courses: [{ id: 'course_a', decision: 'credit_only' }],
    },
  });
  const response = await invoke(applications, '/:id/transfer-evaluation/principal-approval', {
    ...adminRequest,
    body: { principalApprover: 'Spoofed Body Name' },
  });
  expect(response.code).toBe(200);
  expect(mockDb.transferCreditEvaluation.updateMany).toHaveBeenCalledWith({
    where: { applicationId: 'app_a', principalApprovedAt: null, updatedAt: expect.any(Date) },
    data: expect.objectContaining({
      principalApprover: 'Shiyu Zhang, Ph.D.',
      principalApproverEmail: 'staff@example.invalid',
      principalApproverId: 'principal_admin',
    }),
  });
});
test('Pending Clarification remains editable and cannot be signed as final', async () => {
  mockDb.application.findUnique.mockResolvedValue({
    ...approved,
    status: 'pending',
    placementRequired: true,
    placementDecision: { id: 'placement_a', result: 'pending_clarification', principalApprovedAt: null, updatedAt: new Date() },
  });
  const response = await invoke(applications, '/:id/placement-decision/principal-approval', {
    ...adminRequest,
    body: { principalApprover: 'Shiyu Zhang, Ph.D.' },
  });
  expect(response.code).toBe(409);
  expect(mockDb.placementDecision.updateMany).not.toHaveBeenCalled();
});
test('an open prior Checkout blocks adding a placement gate', async () => {
  const pending = { ...approved, status: 'pending', accountsCreated: false, updatedAt: new Date('2026-10-09T12:00:00.000Z') };
  mockDb.application.findUnique.mockResolvedValue(pending);
  mockDb.applicationEvent.findMany
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ metadata: { checkoutSessionId: 'cs_open' } }]);
  mockStripe.checkout.sessions.retrieve.mockResolvedValue({ id: 'cs_open', status: 'open' });

  const response = await invoke(applications, '/:id', {
    ...adminRequest,
    body: { placementRequired: true },
  }, 'patch');
  expect(response.code).toBe(409);
  expect(response.body.error).toMatch(/Expire the existing Stripe Checkout/);
  expect(mockDb.application.updateMany).not.toHaveBeenCalled();
});
test('an unknown prior Checkout state fails closed before adding a placement gate', async () => {
  const pending = { ...approved, status: 'pending', accountsCreated: false, updatedAt: new Date('2026-10-09T12:00:00.000Z') };
  mockDb.application.findUnique.mockResolvedValue(pending);
  mockDb.applicationEvent.findMany
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ metadata: { checkoutSessionId: 'cs_unknown' } }]);
  mockStripe.checkout.sessions.retrieve.mockResolvedValue({ id: 'cs_unknown', status: 'unexpected_future_state' });

  const response = await invoke(applications, '/:id', {
    ...adminRequest,
    body: { placementRequired: true },
  }, 'patch');
  expect(response.code).toBe(409);
  expect(response.body.error).toMatch(/unknown state/);
  expect(mockDb.application.updateMany).not.toHaveBeenCalled();
});
test('placement and approval updates fail on a concurrent application revision', async () => {
  const updatedAt = new Date('2026-10-09T12:00:00.000Z');
  mockDb.application.findUnique.mockResolvedValue({
    ...approved, status: 'pending', accountsCreated: false, updatedAt,
  });
  mockDb.applicationEvent.findMany.mockResolvedValue([]);
  mockDb.application.updateMany.mockResolvedValue({ count: 0 });

  const response = await invoke(applications, '/:id', {
    ...adminRequest,
    body: { placementRequired: true },
  }, 'patch');
  expect(response.code).toBe(409);
  expect(response.body.error).toMatch(/changed during review/);
  expect(mockDb.application.updateMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'app_a', updatedAt },
    data: expect.objectContaining({ placementRequired: true }),
  }));
});
test('placement workflow stays unavailable when the configured Principal account is missing', async () => {
  mockDb.adminUser.findUnique.mockResolvedValue(null);

  const capabilities = await invoke(applications, '/capabilities', {}, 'get');
  expect(capabilities.code).toBe(200);
  expect(capabilities.body.placementDecision).toEqual({
    available: false,
    reason: 'principal_admin_missing',
  });

  const markRequired = await invoke(applications, '/:id', {
    ...adminRequest,
    body: { placementRequired: true },
  }, 'patch');
  expect(markRequired.code).toBe(503);
  expect(markRequired.body.code).toBe('principal_admin_missing');
  expect(mockDb.application.update).not.toHaveBeenCalled();
});
test('server controls price, payer, application binding and retry key', async () => {
  expect((await invoke(applications, '/:id/stripe-checkout', adminRequest)).code).toBe(201);
  await invoke(applications, '/:id/stripe-checkout', adminRequest);
  const [params, options] = mockStripe.checkout.sessions.create.mock.calls[0];
  expect(params).toMatchObject({ customer_email: approved.parentEmail, line_items: [{ price: 'price_synthetic', quantity: 1 }], metadata: { applicationId: 'app_a' } });
  expect(mockStripe.checkout.sessions.create.mock.calls[1][1]).toEqual(options);
  expect(options.idempotencyKey).toMatch(/^giis-checkout:/);
  expect(mockDb.applicationEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({
    create: expect.objectContaining({
      metadata: expect.objectContaining({ approvalRevision: approved.reviewedAt.toISOString() }),
    }),
  }));
});
test('reuses an open checkout and rejects a completed one', async () => {
  mockDb.applicationEvent.findFirst.mockResolvedValue({ metadata: { checkoutSessionId: 'cs_a' } });
  mockStripe.checkout.sessions.retrieve.mockResolvedValue({ ...session, status: 'open', url: 'https://checkout.stripe.com/synthetic' });
  expect((await invoke(applications, '/:id/stripe-checkout', adminRequest)).code).toBe(200);
  mockStripe.checkout.sessions.retrieve.mockResolvedValue(session);
  expect((await invoke(applications, '/:id/stripe-checkout', adminRequest)).code).toBe(409);
  expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
});
test('manual payment receipts prevent a second charge; changed approval cannot reuse a link', async () => {
  mockDb.applicationEvent.findMany.mockResolvedValueOnce([{ id: 'manual_payment_receipt' }]);
  expect((await invoke(applications, '/:id/stripe-checkout', adminRequest)).code).toBe(409);
  mockDb.applicationEvent.findFirst.mockResolvedValue({ metadata: { checkoutSessionId: 'cs_a' } });
  mockStripe.checkout.sessions.retrieve.mockResolvedValue({ ...session, status: 'open', metadata: { ...session.metadata, approvalRevision: 'older' } });
  expect((await invoke(applications, '/:id/stripe-checkout', adminRequest)).code).toBe(409);
  expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
});
test('sibling with the same payer email cannot see or link the other application payment', async () => {
  mockDb.student.findFirst.mockResolvedValue(null);
  mockDb.subscription.findMany.mockResolvedValue([]);
  const state = await applications.applicationEnrollmentState({ ...approved, id: 'app_b' });
  expect(state.paidUnlinked).toBe(false);
  expect(mockDb.subscription.findMany.mock.calls[0][0].where).toEqual({ OR: [{ id: { in: [] } }] });
  mockDb.subscription.updateMany.mockResolvedValue({ count: 0 });
  await applications.linkExistingSubscriptionsForApplication({ app: { ...approved, id: 'app_b' }, studentId: 'student_b' });
  expect(mockDb.subscription.updateMany).toHaveBeenCalledWith({ where: { studentId: null, id: { in: [] }, status: { in: ['active', 'paid'] } }, data: { studentId: 'student_b' } });
});
test('legacy explicitly linked student subscription remains visible', async () => {
  mockDb.student.findFirst.mockResolvedValue({ id: 'student_a', account: {}, parentAccounts: [{}] });
  mockDb.subscription.findMany.mockResolvedValue([{ id: 'legacy_sub', studentId: 'student_a', status: 'active' }]);
  const state = await applications.applicationEnrollmentState({ ...approved, accountsCreated: true });
  expect(state.paid).toBe(true);
  expect(mockDb.subscription.findMany.mock.calls[0][0].where.OR).toContainEqual({ studentId: 'student_a' });
});
test('signed paid event writes subscription and case receipt in the transaction', async () => {
  expect((await invoke(webhook, '/', { headers: { 'stripe-signature': 'synthetic' }, body: Buffer.from('{}') })).code).toBe(200);
  expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
  expect(mockDb.subscription.upsert.mock.calls[0][0].create.currentPeriodEnd).toEqual(new Date(1800000000000));
  expect(mockDb.applicationEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'stripe-paid:cs_a' }, create: expect.objectContaining({ applicationId: 'app_a', metadata: expect.objectContaining({ subscriptionId: 'dbsub_a', paymentStatus: 'paid' }) }),
  }));
  expect(mockDb.student.findFirst).not.toHaveBeenCalled();
});
test('unpaid active subscription does not create a paid receipt', async () => {
  mockStripe.webhooks.constructEvent.mockReturnValue({ id: 'evt_a', type: 'checkout.session.completed', data: { object: { ...session, payment_status: 'unpaid' } } });
  expect((await invoke(webhook, '/', { headers: { 'stripe-signature': 'synthetic' } })).code).toBe(200);
  expect(mockDb.applicationEvent.upsert).not.toHaveBeenCalled();
});
test('duplicate event stops before effects; storage failure asks Stripe to retry', async () => {
  mockDb.processedStripeEvent.create.mockRejectedValue(Object.assign(new Error('duplicate'), { code: 'P2002' }));
  mockDb.processedStripeEvent.findUnique.mockResolvedValue({ eventId: 'evt_a' });
  expect((await invoke(webhook, '/', { headers: { 'stripe-signature': 'synthetic' } })).body).toEqual({ received: true, duplicate: true });
  expect(mockDb.subscription.upsert).not.toHaveBeenCalled();
  mockDb.processedStripeEvent.create.mockRejectedValue(new Error('storage offline'));
  expect((await invoke(webhook, '/', { headers: { 'stripe-signature': 'synthetic' } })).code).toBe(500);
});
test('invalid signatures never touch the database', async () => {
  mockStripe.webhooks.constructEvent.mockImplementation(() => { throw new Error('bad signature'); });
  expect((await invoke(webhook, '/', { headers: { 'stripe-signature': 'synthetic' } })).code).toBe(400);
  expect(mockDb.$transaction).not.toHaveBeenCalled();
});
