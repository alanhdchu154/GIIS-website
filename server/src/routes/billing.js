const express = require('express');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const FRONTEND_URL = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',')[0].trim();

function extractParentAuth(req) {
  const cookieToken = req.cookies?.giis_parent_jwt;
  const header = req.headers.authorization || '';
  const token = cookieToken || (header.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return null;
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    return p.role === 'parent' ? p : null;
  } catch { return null; }
}

/**
 * POST /api/billing/portal
 * Authenticated: parent JWT required.
 * Looks up the Stripe customer tied to this parent's email, creates a
 * Customer Portal session, and returns the redirect URL.
 * The parent's browser redirects to Stripe's hosted portal where they
 * can cancel, update payment method, or download invoices.
 */
router.post('/portal', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe is not configured.' });

  const auth = extractParentAuth(req);
  if (!auth) return res.status(401).json({ error: 'Not authenticated.' });

  const sub = await prisma.subscription.findFirst({
    where: { purchaserEmail: auth.email, status: { in: ['active', 'past_due'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (!sub) {
    return res.status(404).json({ error: 'No active subscription found for this account.' });
  }
  if (!sub.stripeCustomerId) {
    return res.status(400).json({ error: 'Subscription has no Stripe customer ID — contact admissions@genesisideas.school.' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${FRONTEND_URL}/parent/dashboard`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('[billing] portal error:', err.message);
    res.status(500).json({ error: 'Failed to open billing portal. Please try again.' });
  }
});

module.exports = router;
