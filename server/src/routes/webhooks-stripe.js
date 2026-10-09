const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

const prisma = require('../lib/prisma');
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

/** Number of consecutive invoice.payment_failed events before we soft-lock the student (T-103). */
const SOFT_LOCK_THRESHOLD = 2;

function stripeId(value) { return typeof value === 'string' ? value : value?.id || null; }
function invoiceSubscriptionId(invoice) {
  return stripeId(invoice.subscription || invoice.parent?.subscription_details?.subscription);
}
function subscriptionPeriodEnd(sub) {
  const seconds = sub.current_period_end || sub.items?.data?.[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000) : null;
}

/**
 * POST /api/webhooks/stripe
 *
 * IMPORTANT: index.js mounts this route with `express.raw()` so req.body is a Buffer.
 * Do NOT use express.json() before this route — Stripe signature verification needs raw bytes.
 *
 * Events we handle:
 *   checkout.session.completed        → upsert Subscription with status from Stripe
 *   customer.subscription.updated     → refresh status, currentPeriodEnd, cancelAtPeriodEnd
 *   customer.subscription.deleted     → status = 'cancelled' + deactivate linked student
 *   invoice.payment_succeeded         → reset paymentFailureCount, clear soft-lock
 *   invoice.payment_failed            → status = 'past_due', increment failure count,
 *                                       soft-lock student when failures ≥ SOFT_LOCK_THRESHOLD (T-103)
 *   charge.refunded                   → status = 'refunded', deactivate linked student (T-102)
 *
 * In dev, STRIPE_WEBHOOK_SECRET may be empty only when
 * ALLOW_UNVERIFIED_STRIPE_WEBHOOK=1; then we parse raw body directly.
 * NEVER do this in production — Stripe explicitly warns about it.
 */
function resolveWebhookVerificationMode({
  webhookSecret,
  signature,
  nodeEnv = process.env.NODE_ENV,
  allowUnverifiedFlag = process.env.ALLOW_UNVERIFIED_STRIPE_WEBHOOK,
} = {}) {
  // Fail CLOSED if the signing secret is missing. Without it, anyone who can POST
  // to this endpoint could forge checkout.session.completed (grant free access) or
  // charge.refunded (deactivate a paying student). The unverified path is only
  // allowed in non-production and only when explicitly opted in via
  // ALLOW_UNVERIFIED_STRIPE_WEBHOOK=1.
  const allowUnverified = nodeEnv !== 'production' && allowUnverifiedFlag === '1';
  if (!webhookSecret) {
    if (!allowUnverified) {
      return {
        ok: false,
        status: 500,
        message: 'Webhook signing secret not configured.',
        log: 'STRIPE_WEBHOOK_SECRET is not set — refusing to process unverified events.',
      };
    }
    return { ok: true, mode: 'unverified-dev' };
  }

  if (!signature) {
    return {
      ok: false,
      status: 400,
      message: 'Webhook signature missing.',
      log: 'Stripe signature header missing — refusing to process unsigned event.',
    };
  }

  return { ok: true, mode: 'signed' };
}

router.post('/', async (req, res) => {
  if (!stripe) return res.status(500).send('Stripe not configured.');

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const verification = resolveWebhookVerificationMode({ webhookSecret, signature: sig });
  if (!verification.ok) {
    console.error(`[webhook] ${verification.log}`);
    return res.status(verification.status).send(verification.message);
  }

  let event;
  try {
    if (verification.mode === 'signed') {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body.toString());
      console.warn('[webhook] No STRIPE_WEBHOOK_SECRET — skipping signature verification (DEV ONLY, ALLOW_UNVERIFIED_STRIPE_WEBHOOK=1)');
    }
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Commit every event's state and receipt together; concurrent deliveries lose
  // on the event primary key before running any database side effect.
  {
    if (!event.id) return res.status(400).json({ error: 'Missing event ID.' });
    try {
      await prisma.$transaction(async tx => {
        await tx.processedStripeEvent.create({ data: { eventId: event.id, type: event.type } });
        const handlers = {
          'checkout.session.completed': handleCheckoutCompleted,
          'checkout.session.async_payment_succeeded': handleCheckoutCompleted,
          'customer.subscription.updated': handleSubscriptionUpdated,
          'customer.subscription.deleted': handleSubscriptionDeleted,
          'invoice.payment_succeeded': handlePaymentSucceeded,
          'invoice.payment_failed': handlePaymentFailed,
          'charge.refunded': handleChargeRefunded,
        };
        if (handlers[event.type]) await handlers[event.type](event.data.object, tx);
      }, { timeout: 15000 });
      return res.json({ received: true });
    } catch (err) {
      if (err.code === 'P2002') {
        try {
          if (await prisma.processedStripeEvent.findUnique({ where: { eventId: event.id } })) {
            return res.json({ received: true, duplicate: true });
          }
        } catch (_) { /* A failed dedupe read must remain retryable. */ }
      }
      console.error('[webhook] Transaction failed:', err.message);
      return res.status(500).json({ error: 'Webhook receipt could not be recorded.' });
    }
  }

});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Locate the Subscription row + linked StudentAccount for a Stripe payment event.
 * Returns { sub, account } — either field may be null if we haven't linked yet.
 *
 * Linkage priority:
 *   1. Subscription.studentId (set manually in /admin/subscriptions, T-107) — authoritative
 *   2. Match StudentAccount.email to Subscription.purchaserEmail (best-effort fallback)
 *
 * Note: until T-105 auto-creates StudentAccounts on checkout, most Subscriptions will have no
 * linked student and the soft-lock / deactivate is a no-op. We log the unlinked case loudly so
 * Alan can see it in the webhook log and fix manually via /admin/subscriptions.
 */
async function resolveLinkedAccount(stripeSubscriptionId, db = prisma) {
  if (!stripeSubscriptionId) return { sub: null, account: null };
  const sub = await db.subscription.findUnique({
    where: { stripeSubscriptionId },
    include: { student: { include: { account: true } } },
  });
  if (!sub) return { sub: null, account: null };
  if (sub.student?.account) return { sub, account: sub.student.account };
  if (await isApplicationCheckout(sub, db)) return { sub, account: null };
  // Fallback: try matching purchaser email to a student account
  if (sub.purchaserEmail) {
    const account = await db.studentAccount.findUnique({
      where: { email: sub.purchaserEmail },
    });
    if (account) return { sub, account };
  }
  return { sub, account: null };
}

async function softLockStudent(account, reason, db = prisma) {
  if (!account) return null;
  return db.studentAccount.update({
    where: { id: account.id },
    data: { softLocked: true, lockReason: reason },
  });
}

async function deactivateStudent(account, reason, db = prisma) {
  if (!account) return null;
  return db.studentAccount.update({
    where: { id: account.id },
    data: { isActive: false, softLocked: true, lockReason: reason },
  });
}

async function clearStudentLock(account, db = prisma) {
  if (!account) return null;
  if (!account.softLocked && account.lockReason === '') return account;
  return db.studentAccount.update({
    where: { id: account.id },
    data: { softLocked: false, lockReason: '' },
  });
}

async function findStudentForPurchaserEmail(email, db = prisma) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || normalized === 'unknown') return null;

  const parent = await db.parentAccount.findUnique({
    where: { email: normalized },
    select: { studentId: true },
  });
  if (parent?.studentId) return parent.studentId;

  const studentByParentEmail = await db.student.findFirst({
    where: { parentEmail: { equals: normalized, mode: 'insensitive' } },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  });
  if (studentByParentEmail?.id) return studentByParentEmail.id;

  const studentAccount = await db.studentAccount.findUnique({
    where: { email: normalized },
    select: { studentId: true },
  });
  if (studentAccount?.studentId) return studentAccount.studentId;

  return null;
}

// Subscription states where money has actually moved — an unlinked subscription in
// one of these means a parent paid but no student is being activated, which needs a
// human to link it in /admin/subscriptions.
const MONEY_MOVED_STATES = ['active', 'paid', 'trialing', 'past_due'];

async function autoLinkSubscriptionByEmail(subscriptionRecord, db = prisma) {
  if (!subscriptionRecord || subscriptionRecord.studentId) return subscriptionRecord;
  if (await isApplicationCheckout(subscriptionRecord, db)) return subscriptionRecord;
  const studentId = await findStudentForPurchaserEmail(subscriptionRecord.purchaserEmail, db);
  if (!studentId) {
    console.warn(`[webhook] subscription ${subscriptionRecord.id} has no matching student for ${subscriptionRecord.purchaserEmail}`);
    // Surface to admins via the audit feed (GET /api/students/audit) so a paid-but-
    // unlinked subscription is visible, not just buried in server logs. Only alert when
    // money moved (skip incomplete/abandoned checkouts). Never let this break the webhook.
    if (MONEY_MOVED_STATES.includes(subscriptionRecord.status)) {
      await db.auditLog
        .create({
          data: {
            action: 'subscription_unlinked',
            studentId: null,
            actorRole: 'system',
            actorEmail: subscriptionRecord.purchaserEmail || 'unknown',
          },
        })
        .catch((e) => console.error('[webhook] failed to record unlinked-subscription alert:', e.message));
    }
    return subscriptionRecord;
  }

  const linked = await db.subscription.update({
    where: { id: subscriptionRecord.id },
    data: { studentId },
  });
  console.log(`[webhook] ✓ auto-linked subscription ${linked.id} to student ${studentId} via purchaser email`);
  return linked;
}

// Checkout Sessions created in the admissions console contain only the opaque
// application ID and plan in Stripe metadata. A signed webhook then creates the
// staff-visible receipt against that exact reviewed application.
async function isApplicationCheckout(subscriptionRecord, db = prisma) {
  if (!subscriptionRecord.stripeCheckoutSessionId) return false;
  return !!await db.applicationEvent.findFirst({ where: {
    action: { in: ['stripe_checkout_created', 'stripe_payment_confirmed'] },
    metadata: { path: ['checkoutSessionId'], equals: subscriptionRecord.stripeCheckoutSessionId },
  } });
}

async function recordApplicationPaymentConfirmation(session, subscriptionRecord, db = prisma) {
  const applicationId = session.metadata?.applicationId;
  const paymentSucceeded = session.payment_status === 'paid';
  if (!applicationId || !paymentSucceeded) return;

  const application = await db.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      status: true,
      reviewedAt: true,
      placementRequired: true,
      placementDecision: { select: { result: true, principalApprovedAt: true } },
    },
  });
  if (!application) throw new Error(`Checkout session references unknown application ${applicationId}.`);

  const currentRevision = application.reviewedAt?.toISOString() || '';
  const checkoutRevision = session.metadata?.approvalRevision || '';
  const placementReady = !application.placementRequired || (
    !!application.placementDecision?.principalApprovedAt
    && ['ready', 'ready_with_bridge'].includes(application.placementDecision.result)
  );
  const approvalStillValid = application.status === 'approved'
    && checkoutRevision === currentRevision
    && placementReady;
  const action = approvalStillValid ? 'stripe_payment_confirmed' : 'stripe_payment_review_required';
  const summary = approvalStillValid
    ? `Stripe payment received: ${session.currency?.toUpperCase() || 'USD'} ${(Number(session.amount_total || 0) / 100).toFixed(2)} for ${subscriptionRecord.planType}. Reference: ${session.id}.`
    : `Stripe payment received after the admissions approval gate changed. Manual reconciliation or refund review is required. Reference: ${session.id}.`;

  await db.applicationEvent.upsert({
    where: { id: `stripe-paid:${session.id}` },
    update: {},
    create: {
      id: `stripe-paid:${session.id}`,
      applicationId,
      action,
      actorEmail: 'stripe-webhook',
      summary,
      metadata: {
        checkoutSessionId: session.id,
        subscriptionId: subscriptionRecord.id,
        planType: subscriptionRecord.planType,
        status: subscriptionRecord.status,
        amountTotal: subscriptionRecord.amountTotal,
        currency: session.currency || 'usd',
        paymentStatus: session.payment_status,
        approvalRevision: checkoutRevision,
        currentApprovalRevision: currentRevision,
        approvalStillValid,
        ...(approvalStillValid ? {} : { reviewReason: 'admissions_gate_changed_after_checkout' }),
      },
    },
  });
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session, db = prisma) {
  const planType = session.metadata?.planType || 'unknown';
  const maxStudents = Number(session.metadata?.maxStudents || 1);

  // For subscription mode the status comes from the subscription itself.
  // For one-time payment mode there's no Subscription on Stripe's side; we record as 'paid'.
  const isSubscription = session.mode === 'subscription';
  let status = 'incomplete';
  let currentPeriodEnd = null;
  let stripeSubscriptionId = null;
  let stripePriceId = null;

  if (isSubscription && session.subscription) {
    const sub = await stripe.subscriptions.retrieve(stripeId(session.subscription));
    status = sub.status;  // 'active' | 'trialing' | 'past_due' | etc.
    currentPeriodEnd = subscriptionPeriodEnd(sub);
    stripeSubscriptionId = sub.id;
    stripePriceId = sub.items?.data?.[0]?.price?.id || null;
  } else {
    // one-time payment (e.g. live_test)
    status = session.payment_status === 'paid' ? 'paid' : 'incomplete';
    stripePriceId = session.line_items?.data?.[0]?.price?.id || null;
  }

  const subscriptionRecord = await db.subscription.upsert({
    where: { stripeCheckoutSessionId: session.id },
    update: {
      status,
      currentPeriodEnd,
      stripeCustomerId:     session.customer,
      stripeSubscriptionId,
      stripePriceId,
      amountTotal:          session.amount_total,
    },
    create: {
      purchaserEmail:          session.customer_email || session.customer_details?.email || 'unknown',
      stripeCustomerId:        session.customer,
      stripeSubscriptionId,
      stripePriceId,
      stripeCheckoutSessionId: session.id,
      planType,
      maxStudents,
      status,
      currentPeriodEnd,
      amountTotal:             session.amount_total,
    },
  });
  // Application-bound purchases must never attach to a sibling by payer email.
  // The admissions activation step links the exact recorded subscription.
  await recordApplicationPaymentConfirmation(session, subscriptionRecord, db);

  console.log(`[webhook] ✓ checkout.session.completed — ${planType} · ${session.customer_email} · ${status}`);
}

async function handleSubscriptionUpdated(sub, db = prisma) {
  const existing = await db.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!existing) throw new Error(`Subscription ${sub.id} is not recorded yet; retry after Checkout.`);
  // Delayed lifecycle events must not restore a refunded/cancelled enrollment.
  if (['refunded', 'cancelled'].includes(existing.status)) return;
  sub = await stripe.subscriptions.retrieve(sub.id);
  await db.subscription.update({
    where: { stripeSubscriptionId: sub.id },
    data: {
      status:             sub.status === 'canceled' ? 'cancelled' : sub.status,
      currentPeriodEnd:   subscriptionPeriodEnd(sub),
      cancelAtPeriodEnd:  !!sub.cancel_at_period_end,
      stripePriceId:      sub.items?.data?.[0]?.price?.id || existing.stripePriceId,
    },
  });
  console.log(`[webhook] ✓ subscription.updated — ${sub.id} · ${sub.status}`);
}

async function handleSubscriptionDeleted(sub, db = prisma) {
  const existing = await db.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!existing) throw new Error(`Subscription ${sub.id} is not recorded yet; retry after Checkout.`);

  // Cancellation arrives here. We deactivate the linked student (if any) — same as a refund —
  // because their access window has fully ended.
  const { account } = await resolveLinkedAccount(sub.id, db);

  await db.subscription.update({
    where: { stripeSubscriptionId: sub.id },
    data: { status: 'cancelled', cancelAtPeriodEnd: false },
  });
  if (account) {
    await deactivateStudent(account, 'subscription_cancelled', db);
    console.log(`[webhook] ✓ subscription.deleted — ${sub.id} · deactivated student ${account.email}`);
  } else {
    console.log(`[webhook] ✓ subscription.deleted — ${sub.id} · no linked student`);
  }

  // TODO (T-402 email templates): notify parent that subscription ended and access is revoked.
}

async function recordApplicationInvoicePayment(invoice, subscription, db = prisma) {
  if (!invoice.id) throw new Error('Invoice payment event has no invoice ID.');
  if (!subscription.stripeCheckoutSessionId) return;
  const checkout = await db.applicationEvent.findFirst({ where: {
    action: { in: ['stripe_checkout_created', 'stripe_payment_confirmed'] },
    metadata: { path: ['checkoutSessionId'], equals: subscription.stripeCheckoutSessionId },
  } });
  if (!checkout) return;
  await db.applicationEvent.upsert({
    where: { id: `stripe-invoice-paid:${invoice.id}` }, update: {},
    create: {
      id: `stripe-invoice-paid:${invoice.id}`,
      applicationId: checkout.applicationId, action: 'stripe_invoice_payment_confirmed', actorEmail: 'stripe-webhook',
      summary: `Stripe invoice paid: ${invoice.currency?.toUpperCase() || 'USD'} ${(Number(invoice.amount_paid || 0) / 100).toFixed(2)}; invoice ${invoice.id}.`,
      metadata: { invoiceId: invoice.id, subscriptionId: subscription.id, amountPaid: invoice.amount_paid || 0, currency: invoice.currency || 'usd', billingReason: invoice.billing_reason || null },
    },
  });
}

async function handlePaymentSucceeded(invoice, db = prisma) {
  invoice = { ...invoice, subscription: invoiceSubscriptionId(invoice) };
  if (!invoice.subscription) return;
  const existing = await db.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription },
  });
  if (!existing) throw new Error(`Subscription ${invoice.subscription} is not recorded yet; retry after Checkout.`);
  // Keep the actual invoice receipt even if membership is held after a refund.
  await recordApplicationInvoicePayment(invoice, existing, db);
  if (['refunded', 'cancelled'].includes(existing.status)) return;
  const current = await stripe.subscriptions.retrieve(invoice.subscription);
  const currentStatus = current.status === 'canceled' ? 'cancelled' : current.status;
  const paymentCurrent = currentStatus === 'active';

  const updated = await db.subscription.update({
    where: { stripeSubscriptionId: invoice.subscription },
    data: {
      status: currentStatus,
      currentPeriodEnd: subscriptionPeriodEnd(current),
      cancelAtPeriodEnd: !!current.cancel_at_period_end,
      ...(paymentCurrent ? { paymentFailureCount: 0 } : {}),
    },
  });
  await autoLinkSubscriptionByEmail(updated, db);

  // Successful payment — clear any soft-lock we set during past_due.
  const { account } = await resolveLinkedAccount(invoice.subscription, db);
  if (paymentCurrent && account?.softLocked && account.lockReason === 'payment_past_due') {
    await clearStudentLock(account, db);
    console.log(`[webhook] ✓ invoice.payment_succeeded — ${invoice.subscription} · cleared soft-lock for ${account.email}`);
  } else {
    console.log(`[webhook] ✓ invoice.payment_succeeded — ${invoice.subscription}`);
  }
}

async function handlePaymentFailed(invoice, db = prisma) {
  invoice = { ...invoice, subscription: invoiceSubscriptionId(invoice) };
  if (!invoice.subscription) return;
  const existing = await db.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription },
  });
  if (!existing) throw new Error(`Subscription ${invoice.subscription} is not recorded yet; retry after Checkout.`);
  if (['refunded', 'cancelled'].includes(existing.status)) return;
  const current = await stripe.subscriptions.retrieve(invoice.subscription);
  const currentStatus = current.status === 'canceled' ? 'cancelled' : current.status;
  const currentlyDelinquent = ['past_due', 'unpaid'].includes(currentStatus);

  const updated = await db.subscription.update({
    where: { stripeSubscriptionId: invoice.subscription },
    data: {
      status: currentStatus,
      currentPeriodEnd: subscriptionPeriodEnd(current),
      cancelAtPeriodEnd: !!current.cancel_at_period_end,
      ...(currentlyDelinquent ? { paymentFailureCount: { increment: 1 } } : {}),
    },
  });
  const newCount = updated.paymentFailureCount;

  if (currentlyDelinquent && newCount >= SOFT_LOCK_THRESHOLD) {
    const { account } = await resolveLinkedAccount(invoice.subscription, db);
    if (account) {
      await softLockStudent(account, 'payment_past_due', db);
      console.log(
        `[webhook] ⚠ payment_failed — ${invoice.subscription} · attempt ${newCount} ` +
          `· soft-locked student ${account.email}`
      );
    } else {
      console.warn(
        `[webhook] ⚠ payment_failed — ${invoice.subscription} · attempt ${newCount} ` +
          `· NO linked student (set Subscription.studentId in /admin/subscriptions)`
      );
    }
  } else {
    console.log(`[webhook] ⚠ payment_failed — ${invoice.subscription} · attempt ${newCount}`);
  }

  // TODO (T-402 email templates): notify parent and link to Stripe Customer Portal (T-101).
}

async function handleChargeRefunded(charge, db = prisma) {
  // Resolve only exact invoice/PaymentIntent relationships. A shared Stripe
  // customer is never sufficient evidence for choosing a child's subscription.
  let subscriptionIds = [];
  const paymentIntentId = stripeId(charge.payment_intent);
  if (charge.invoice) {
    const invoice = await stripe.invoices.retrieve(stripeId(charge.invoice));
    const id = invoiceSubscriptionId(invoice);
    if (id) subscriptionIds.push(id);
  } else if (paymentIntentId) {
    const payments = await stripe.invoicePayments.list({
      payment: { type: 'payment_intent', payment_intent: paymentIntentId }, limit: 100,
    });
    if (payments.has_more) throw new Error('Refund invoice mapping requires reconciliation.');
    for (const payment of payments.data) {
      if (stripeId(payment.payment?.payment_intent) !== paymentIntentId) continue;
      const invoice = await stripe.invoices.retrieve(stripeId(payment.invoice));
      const id = invoiceSubscriptionId(invoice);
      if (id) subscriptionIds.push(id);
    }
  }
  subscriptionIds = [...new Set(subscriptionIds)];
  if (subscriptionIds.length > 1) throw new Error('Refund maps to multiple subscriptions; reconciliation required.');
  let sub = null;
  let account = null;
  if (subscriptionIds.length === 1) {
    ({ sub, account } = await resolveLinkedAccount(subscriptionIds[0], db));
  } else if (paymentIntentId) {
    const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 100 });
    const exact = sessions.data.filter(session => stripeId(session.payment_intent) === paymentIntentId);
    if (sessions.has_more || exact.length > 1) throw new Error('Refund Checkout mapping is ambiguous.');
    if (exact.length === 1) {
      sub = await db.subscription.findUnique({
        where: { stripeCheckoutSessionId: exact[0].id },
        include: { student: { include: { account: true } } },
      });
      account = sub?.student?.account || null;
    }
  }
  if (!sub) throw new Error(`Refund ${charge.id} has no recorded subscription; retry/reconcile.`);

  const partial = !(charge.amount > 0 && charge.amount_refunded >= charge.amount);
  const action = partial ? 'stripe_partial_refund_recorded' : 'stripe_refund_recorded';
  const receipt = sub.stripeCheckoutSessionId && await db.applicationEvent.findFirst({
    where: {
      action: { in: ['stripe_checkout_created', 'stripe_payment_confirmed'] },
      metadata: { path: ['checkoutSessionId'], equals: sub.stripeCheckoutSessionId },
    },
  });
  if (receipt) {
    await db.applicationEvent.upsert({
      where: { id: `stripe-refund:${charge.id}:${charge.amount_refunded}` },
      update: {},
      create: {
        id: `stripe-refund:${charge.id}:${charge.amount_refunded}`,
        applicationId: receipt.applicationId, action, actorEmail: 'stripe-webhook',
        summary: `Stripe ${partial ? 'partial' : 'full'} refund recorded: ${charge.currency?.toUpperCase() || 'USD'} ${(charge.amount_refunded / 100).toFixed(2)}; charge ${charge.id}.`,
        metadata: { chargeId: charge.id, subscriptionId: sub.id, amountRefunded: charge.amount_refunded, currency: charge.currency || 'usd' },
      },
    });
  } else {
    await db.auditLog.create({ data: {
      action: `${action}:${charge.id}:${charge.amount_refunded}`,
      studentId: sub.studentId || null, actorRole: 'system', actorEmail: 'stripe-webhook',
    } });
  }
  // Partial refunds can be adjustments; they do not revoke enrollment access.
  if (partial) return;
  await db.subscription.update({ where: { id: sub.id }, data: { status: 'refunded' } });
  if (account) await deactivateStudent(account, 'refund_issued', db);
}

module.exports = router;
module.exports.resolveWebhookVerificationMode = resolveWebhookVerificationMode;
module.exports.recordApplicationPaymentConfirmation = recordApplicationPaymentConfirmation;
