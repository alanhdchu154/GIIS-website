const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

const prisma = require('../lib/prisma');
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

/** Number of consecutive invoice.payment_failed events before we soft-lock the student (T-103). */
const SOFT_LOCK_THRESHOLD = 2;

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

  // Idempotency / replay protection. Stripe retries for up to 3 days and can
  // deliver duplicates; processing an event twice would (e.g.) double-increment
  // paymentFailureCount and soft-lock a student who only failed once. A DB error
  // here returns 500 so Stripe retries rather than us processing blind.
  if (event.id) {
    try {
      const seen = await prisma.processedStripeEvent.findUnique({ where: { eventId: event.id } });
      if (seen) {
        console.log(`[webhook] Duplicate event ${event.id} (${event.type}) — already processed, skipping.`);
        return res.json({ received: true, duplicate: true });
      }
    } catch (dedupeErr) {
      console.error('[webhook] Idempotency check failed:', dedupeErr.message);
      return res.status(500).json({ error: 'Idempotency check failed.' });
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
      default:
        // Unhandled event types still return 200 so Stripe stops retrying.
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (handlerErr) {
    // Returning 500 makes Stripe retry up to 3 days. Only do this for transient errors;
    // for permanent failures (bad data), log and return 200 so we don't get stuck.
    // NOTE: we deliberately do NOT record the event below on this path, so a retry
    // gets a fresh attempt rather than being skipped as a duplicate.
    console.error('[webhook] Handler error:', handlerErr.message, handlerErr.stack);
    return res.status(500).json({ error: 'Webhook handler failed.' });
  }

  // Record only after successful handling so a transient failure above can be retried.
  // create() (not upsert) + ignore unique races from a concurrent duplicate delivery.
  if (event.id) {
    await prisma.processedStripeEvent
      .create({ data: { eventId: event.id, type: event.type } })
      .catch((e) => {
        if (e.code !== 'P2002') console.error('[webhook] Failed to record processed event:', e.message);
      });
  }

  res.json({ received: true });
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
async function resolveLinkedAccount(stripeSubscriptionId) {
  if (!stripeSubscriptionId) return { sub: null, account: null };
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
    include: { student: { include: { account: true } } },
  });
  if (!sub) return { sub: null, account: null };
  if (sub.student?.account) return { sub, account: sub.student.account };
  // Fallback: try matching purchaser email to a student account
  if (sub.purchaserEmail) {
    const account = await prisma.studentAccount.findUnique({
      where: { email: sub.purchaserEmail },
    });
    if (account) return { sub, account };
  }
  return { sub, account: null };
}

async function softLockStudent(account, reason) {
  if (!account) return null;
  return prisma.studentAccount.update({
    where: { id: account.id },
    data: { softLocked: true, lockReason: reason },
  });
}

async function deactivateStudent(account, reason) {
  if (!account) return null;
  return prisma.studentAccount.update({
    where: { id: account.id },
    data: { isActive: false, softLocked: true, lockReason: reason },
  });
}

async function clearStudentLock(account) {
  if (!account) return null;
  if (!account.softLocked && account.lockReason === '') return account;
  return prisma.studentAccount.update({
    where: { id: account.id },
    data: { softLocked: false, lockReason: '' },
  });
}

async function findStudentForPurchaserEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || normalized === 'unknown') return null;

  const parent = await prisma.parentAccount.findUnique({
    where: { email: normalized },
    select: { studentId: true },
  });
  if (parent?.studentId) return parent.studentId;

  const studentByParentEmail = await prisma.student.findFirst({
    where: { parentEmail: { equals: normalized, mode: 'insensitive' } },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  });
  if (studentByParentEmail?.id) return studentByParentEmail.id;

  const studentAccount = await prisma.studentAccount.findUnique({
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

async function autoLinkSubscriptionByEmail(subscriptionRecord) {
  if (!subscriptionRecord || subscriptionRecord.studentId) return subscriptionRecord;
  const studentId = await findStudentForPurchaserEmail(subscriptionRecord.purchaserEmail);
  if (!studentId) {
    console.warn(`[webhook] subscription ${subscriptionRecord.id} has no matching student for ${subscriptionRecord.purchaserEmail}`);
    // Surface to admins via the audit feed (GET /api/students/audit) so a paid-but-
    // unlinked subscription is visible, not just buried in server logs. Only alert when
    // money moved (skip incomplete/abandoned checkouts). Never let this break the webhook.
    if (MONEY_MOVED_STATES.includes(subscriptionRecord.status)) {
      await prisma.auditLog
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

  const linked = await prisma.subscription.update({
    where: { id: subscriptionRecord.id },
    data: { studentId },
  });
  console.log(`[webhook] ✓ auto-linked subscription ${linked.id} to student ${studentId} via purchaser email`);
  return linked;
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session) {
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
    const sub = await stripe.subscriptions.retrieve(session.subscription);
    status = sub.status;  // 'active' | 'trialing' | 'past_due' | etc.
    currentPeriodEnd = new Date(sub.current_period_end * 1000);
    stripeSubscriptionId = sub.id;
    stripePriceId = sub.items?.data?.[0]?.price?.id || null;
  } else {
    // one-time payment (e.g. live_test)
    status = session.payment_status === 'paid' ? 'paid' : 'incomplete';
    stripePriceId = session.line_items?.data?.[0]?.price?.id || null;
  }

  const subscriptionRecord = await prisma.subscription.upsert({
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
  await autoLinkSubscriptionByEmail(subscriptionRecord);

  console.log(`[webhook] ✓ checkout.session.completed — ${planType} · ${session.customer_email} · ${status}`);
}

async function handleSubscriptionUpdated(sub) {
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!existing) {
    // Stripe may send subscription.updated before checkout.session.completed in rare cases.
    // We'll catch it next time around or via re-sync.
    console.warn(`[webhook] subscription.updated for unknown sub ${sub.id} — skipping`);
    return;
  }
  await prisma.subscription.update({
    where: { stripeSubscriptionId: sub.id },
    data: {
      status:             sub.status,
      currentPeriodEnd:   new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd:  !!sub.cancel_at_period_end,
      stripePriceId:      sub.items?.data?.[0]?.price?.id || existing.stripePriceId,
    },
  });
  console.log(`[webhook] ✓ subscription.updated — ${sub.id} · ${sub.status}`);
}

async function handleSubscriptionDeleted(sub) {
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!existing) return;

  // Cancellation arrives here. We deactivate the linked student (if any) — same as a refund —
  // because their access window has fully ended.
  const { account } = await resolveLinkedAccount(sub.id);

  await prisma.subscription.update({
    where: { stripeSubscriptionId: sub.id },
    data: { status: 'cancelled', cancelAtPeriodEnd: false },
  });
  if (account) {
    await deactivateStudent(account, 'subscription_cancelled');
    console.log(`[webhook] ✓ subscription.deleted — ${sub.id} · deactivated student ${account.email}`);
  } else {
    console.log(`[webhook] ✓ subscription.deleted — ${sub.id} · no linked student`);
  }

  // TODO (T-402 email templates): notify parent that subscription ended and access is revoked.
}

async function handlePaymentSucceeded(invoice) {
  if (!invoice.subscription) return;
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription },
  });
  if (!existing) return;

  const updated = await prisma.subscription.update({
    where: { stripeSubscriptionId: invoice.subscription },
    data: {
      status: 'active',
      paymentFailureCount: 0,
    },
  });
  await autoLinkSubscriptionByEmail(updated);

  // Successful payment — clear any soft-lock we set during past_due.
  const { account } = await resolveLinkedAccount(invoice.subscription);
  if (account?.softLocked && account.lockReason === 'payment_past_due') {
    await clearStudentLock(account);
    console.log(`[webhook] ✓ invoice.payment_succeeded — ${invoice.subscription} · cleared soft-lock for ${account.email}`);
  } else {
    console.log(`[webhook] ✓ invoice.payment_succeeded — ${invoice.subscription}`);
  }
}

async function handlePaymentFailed(invoice) {
  if (!invoice.subscription) return;
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription },
  });
  if (!existing) return;

  const newCount = existing.paymentFailureCount + 1;
  await prisma.subscription.update({
    where: { stripeSubscriptionId: invoice.subscription },
    data: {
      status: 'past_due',
      paymentFailureCount: newCount,
    },
  });

  if (newCount >= SOFT_LOCK_THRESHOLD) {
    const { account } = await resolveLinkedAccount(invoice.subscription);
    if (account) {
      await softLockStudent(account, 'payment_past_due');
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

async function handleChargeRefunded(charge) {
  // A refunded charge belongs to either a subscription invoice or a one-time payment.
  // We update the matching Subscription row when we can find it.
  let stripeSubscriptionId = null;
  let checkoutSessionId = null;

  if (charge.invoice) {
    try {
      const inv = await stripe.invoices.retrieve(charge.invoice);
      stripeSubscriptionId = inv.subscription || null;
    } catch (err) {
      console.warn(`[webhook] charge.refunded — failed to retrieve invoice ${charge.invoice}: ${err.message}`);
    }
  }

  if (!stripeSubscriptionId && charge.payment_intent) {
    // For one-time payments, we recorded the checkout session id on Subscription.
    // Stripe doesn't return checkout session id from a payment_intent directly,
    // so we look up by stripeCustomerId as a fallback.
    if (charge.customer) {
      const oneTime = await prisma.subscription.findFirst({
        where: { stripeCustomerId: charge.customer, planType: 'live_test' },
        orderBy: { createdAt: 'desc' },
      });
      if (oneTime) checkoutSessionId = oneTime.stripeCheckoutSessionId;
    }
  }

  let sub = null;
  let account = null;
  if (stripeSubscriptionId) {
    const r = await resolveLinkedAccount(stripeSubscriptionId);
    sub = r.sub;
    account = r.account;
  } else if (checkoutSessionId) {
    sub = await prisma.subscription.findUnique({
      where: { stripeCheckoutSessionId: checkoutSessionId },
      include: { student: { include: { account: true } } },
    });
    account = sub?.student?.account || null;
  }

  if (!sub) {
    console.warn(
      `[webhook] charge.refunded — no matching Subscription for charge ${charge.id}. ` +
        `Manual reconciliation needed (see /admin/subscriptions).`
    );
    return;
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'refunded', cancelAtPeriodEnd: true },
  });

  if (account) {
    await deactivateStudent(account, 'refund_issued');
    console.log(`[webhook] ✓ charge.refunded — ${charge.id} · deactivated student ${account.email}`);
  } else {
    console.log(`[webhook] ✓ charge.refunded — ${charge.id} · no linked student`);
  }

  // TODO (T-402 email templates):
  //   - email parent confirming refund + access revoked
  //   - alert admin (alanhdchu@) — refunds are rare and worth a heads-up
}

module.exports = router;
module.exports.resolveWebhookVerificationMode = resolveWebhookVerificationMode;
