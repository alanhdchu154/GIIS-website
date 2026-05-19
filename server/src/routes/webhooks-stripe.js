const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
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
 * In dev, STRIPE_WEBHOOK_SECRET may be empty; we skip signature verification and parse
 * raw body directly. NEVER do this in production — Stripe explicitly warns about it.
 */
router.post('/', async (req, res) => {
  if (!stripe) return res.status(500).send('Stripe not configured.');

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body.toString());
      console.warn('[webhook] No STRIPE_WEBHOOK_SECRET — skipping signature verification (DEV ONLY)');
    }
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
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
    console.error('[webhook] Handler error:', handlerErr.message, handlerErr.stack);
    return res.status(500).json({ error: 'Webhook handler failed.' });
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

  await prisma.subscription.upsert({
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

  console.log(`[webhook] ✓ checkout.session.completed — ${planType} · ${session.customer_email} · ${status}`);

  // TODO (T-105): create Student / ParentAccount automatically, send welcome email via Resend.
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

  await prisma.subscription.update({
    where: { stripeSubscriptionId: invoice.subscription },
    data: {
      status: 'active',
      paymentFailureCount: 0,
    },
  });

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
