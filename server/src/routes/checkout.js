const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const jwt = require('jsonwebtoken');

const prisma = require('../lib/prisma');
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const FRONTEND_URL = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',')[0].trim();

/**
 * The single source of truth for what's purchasable through Stripe Checkout.
 *
 * Each tier maps to a Stripe Price object (set up in dashboard, ID stored in .env).
 * `mode` controls subscription vs one-time. `maxStudents` is enforced post-purchase
 * when admin attaches Student records to the Subscription.
 *
 * Add a new tier here + add the matching STRIPE_PRICE_* env var; no other changes needed.
 */
const PRICE_TIERS = {
  self_paced_monthly: {
    priceId: process.env.STRIPE_PRICE_SELF_PACED_MONTHLY || process.env.STRIPE_PRICE_FOUNDERS_MONTHLY,
    mode: 'subscription',
    maxStudents: 1,
    label: 'Self-Paced Founders · $49/mo',
    public: true,
  },
  self_paced_annual: {
    priceId: process.env.STRIPE_PRICE_SELF_PACED_ANNUAL,
    mode: 'subscription',
    maxStudents: 1,
    label: 'Self-Paced Founders Annual · $499/yr',
    public: true,
  },
  guided_monthly: {
    priceId: process.env.STRIPE_PRICE_GUIDED_MONTHLY,
    mode: 'subscription',
    maxStudents: 1,
    label: 'Guided · $149/mo',
    public: true,
  },
  premium_monthly: {
    priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    mode: 'subscription',
    maxStudents: 1,
    label: 'Premium / College Pathway · $299/mo',
    public: true,
  },
  group_monthly: {
    priceId: process.env.STRIPE_PRICE_GROUP_MONTHLY,
    mode: 'subscription',
    maxStudents: 5,
    label: 'Group inquiry · 3-5 students',
    public: false,
  },
  live_test: {
    priceId: process.env.STRIPE_PRICE_LIVE_TEST,
    mode: 'subscription',
    maxStudents: 1,
    label: 'Live mode end-to-end test · $1',
    public: false,
  },
};

// Back-compat: front-end may still send legacy plan aliases.
const LEGACY_ALIASES = {
  monthly: 'self_paced_monthly',
  founders_monthly: 'self_paced_monthly',
};

function extractAdminAuth(req) {
  const cookieToken = req.cookies?.giis_jwt;
  const header = req.headers.authorization || '';
  const token = cookieToken || (header.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.role === 'admin' || payload.adminId ? payload : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/checkout/create-session
 * Body: { planType: string, email?: string }
 * Returns: { url: string }   — frontend does `window.location = url`
 */
router.post('/create-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured (STRIPE_SECRET_KEY missing).' });
  }

  let { planType = 'founders_monthly', email } = req.body || {};
  if (LEGACY_ALIASES[planType]) planType = LEGACY_ALIASES[planType];

  const tier = PRICE_TIERS[planType];
  if (!tier) {
    return res.status(400).json({ error: `Unknown planType: ${planType}` });
  }
  if (tier.public === false && !extractAdminAuth(req)) {
    return res.status(403).json({ error: `"${planType}" is an internal plan and requires admin access.` });
  }
  if (!tier.priceId) {
    return res.status(500).json({
      error: `No Stripe price ID configured for "${planType}". Add STRIPE_PRICE_${planType.toUpperCase()} to server/.env.`,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: tier.mode,
      payment_method_types: ['card'],
      line_items: [{ price: tier.priceId, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `${FRONTEND_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${FRONTEND_URL}/pricing`,
      allow_promotion_codes: true,
      metadata: {
        planType,
        maxStudents: String(tier.maxStudents),
      },
      // Only valid for subscription mode — passed through to the Subscription object
      ...(tier.mode === 'subscription' && {
        subscription_data: {
          metadata: {
            planType,
            maxStudents: String(tier.maxStudents),
          },
        },
      }),
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[checkout] Stripe error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session. Please try again.' });
  }
});

/**
 * GET /api/checkout/session/:id
 * Used by /welcome page to confirm the payment succeeded and show the right plan info.
 * Returns sanitized session info — never raw Stripe object.
 */
router.get('/session/:id', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured.' });
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    const sub = await prisma.subscription.findUnique({
      where: { stripeCheckoutSessionId: session.id },
    });
    res.json({
      status: session.status,             // 'open' | 'complete' | 'expired'
      paymentStatus: session.payment_status, // 'paid' | 'unpaid' | 'no_payment_required'
      email: session.customer_email,
      planType: session.metadata?.planType,
      maxStudents: Number(session.metadata?.maxStudents || 1),
      amountTotal: session.amount_total,
      knownInDb: !!sub,
    });
  } catch (err) {
    console.error('[checkout] retrieve session error:', err.message);
    res.status(404).json({ error: 'Session not found.' });
  }
});

/**
 * GET /api/checkout/tiers
 * Public — frontend can call this to render available plans. Returns label + maxStudents
 * (never the Stripe price ID, never anything sensitive).
 */
router.get('/tiers', (_req, res) => {
  const out = {};
  for (const [key, tier] of Object.entries(PRICE_TIERS)) {
    out[key] = {
      label: tier.label,
      mode: tier.mode,
      maxStudents: tier.maxStudents,
      available: !!tier.priceId,
      public: !!tier.public,
    };
  }
  res.json(out);
});

module.exports = router;
module.exports.PRICE_TIERS = PRICE_TIERS;  // exposed for webhook handler to read tier config
