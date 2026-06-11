# Stripe Live Price Setup

Last updated: 2026-06-11

Use this checklist before sending automated checkout links. It does not contain
secrets and should not be used to store real Stripe keys.

## Required Live Prices

Create or confirm these live-mode Stripe Price objects in the Stripe Dashboard:

| GIIS plan | Amount | Billing | Suggested lookup key | Production env var |
| --- | ---: | --- | --- | --- |
| Self-Paced Founders | $49 | monthly | `self_paced_monthly` | `STRIPE_PRICE_SELF_PACED_MONTHLY` |
| Self-Paced Founders Annual | $499 | yearly | `self_paced_annual` | `STRIPE_PRICE_SELF_PACED_ANNUAL` |
| Guided | $149 | monthly | `guided_monthly` | `STRIPE_PRICE_GUIDED_MONTHLY` |
| Premium / College Pathway | $299 | monthly | `premium_monthly` | `STRIPE_PRICE_PREMIUM_MONTHLY` |

Group and live-test prices are internal and should not be used for public
parent checkout unless Alan explicitly approves that launch path.

## Dashboard Steps

1. Open the Stripe Dashboard in live mode.
2. Create or open the GIIS subscription product.
3. Add one recurring Price for each public plan above.
4. Copy each `price_...` ID.
5. On the Lightsail API server, add the IDs to `server/.env`.
6. Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in live mode.
7. Do not commit `server/.env`.
8. Restart the API only inside the production payment deploy window.

Legacy note: `server/src/routes/checkout.js` still accepts
`STRIPE_PRICE_FOUNDERS_MONTHLY` as a fallback for Self-Paced monthly while old
checkout links are retired. New production config should set
`STRIPE_PRICE_SELF_PACED_MONTHLY` explicitly.

## Verification

Run:

```bash
npm run audit:sales-payment-live
```

Expected before automated checkout: Guided, Premium, and Self-Paced monthly all
pass. Self-Paced annual should also pass before promoting the annual plan.

