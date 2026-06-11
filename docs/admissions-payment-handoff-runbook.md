# Admissions Payment Handoff Runbook

Last updated: 2026-06-11

Purpose: let admissions start selling through consultation and transfer-path
review even while automated Guided/Premium checkout is gated by
`npm run audit:sales-payment-live`.

This runbook is for the human handoff after a family has already seen the public
proof path and GIIS has reviewed fit. It is not a shortcut around the admissions
review, Stripe readiness gate, or backend Lightsail deploy runbook.

## Launch Boundary

Current public status:

- The public proof path is live and production-smoked:
  `/`, `/consultation`, `/apply`, `/pricing`, `/trust-center`, `/graduates`,
  `/parent/demo`, and `/assessment-proof`.
- Admissions may start conversations and path reviews from `/consultation` or
  `/apply`.

Current payment boundary:

- Automated Guided/Premium checkout is not launch-ready until
  `npm run audit:sales-payment-live` returns 0 fail.
- Do not send an automated Guided/Premium checkout link while production
  `STRIPE_PRICE_GUIDED_MONTHLY` or `STRIPE_PRICE_PREMIUM_MONTHLY` is missing.
- Do not describe Stripe webhook idempotency, paid-but-unlinked alerts, or weekly
  report backend behavior as production-live until the Lightsail payment runbook
  is completed.

## Minimum Sellable Flow

1. Parent submits `/consultation` or `/apply`.
2. Admissions responds within one business day.
3. Admissions reviews:
   - student grade,
   - new-student vs transfer-student path,
   - transcript/report card availability,
   - desired graduation timing,
   - parent support expectation.
4. Principal or admissions owner recommends Self-Paced, Guided, Premium, or
   decline/defer.
5. Payment is requested only after the enrollment path is clear.
6. Admin marks the application approved and activates accounts only after
   payment status and enrollment decision are both recorded.

## Manual Payment Fallback

Use this only until the automated payment gate passes.

Allowed:

- Stripe Dashboard invoice or payment link created manually by an authorized
  GIIS operator.
- The amount must match the plan shown publicly:
  - Self-Paced Founders: `$49/month`
  - Guided: `$149/month`
  - Premium / College Pathway: `$299/month`
- The payment note or invoice memo should include:
  - student name,
  - parent email,
  - plan,
  - consultation/path-review date,
  - "30-day refund policy applies",
  - "Enrollment path reviewed before payment".

Not allowed:

- asking for payment before path review,
- promising credit transfer before official review,
- promising college admission, accreditation completion, AP authorization, CEEB
  issuance, or outside acceptance,
- sending an automated Guided/Premium checkout link before
  `npm run audit:sales-payment-live` passes,
- accepting payment through an untracked personal account.

## Payment Message Template

Subject: GIIS enrollment path reviewed — payment next step

Hi `{parentName}`,

Thank you for completing the GIIS path review. Based on the student's current
grade, records, and support needs, the recommended plan is `{planName}` at
`{price}`.

This recommendation is based on:

- student path: `{new_or_transfer}`,
- transcript/report card status: `{records_status}`,
- target timing: `{timing}`,
- support reason: `{support_reason}`.

Payment is requested only after this review. GIIS also provides a 30-day refund
policy if the family decides the fit is not right.

Payment link:
`{stripe_invoice_or_payment_link}`

After payment is confirmed, GIIS will create the student and parent portal
accounts and send the first-week welcome instructions.

Best,
GIIS Admissions

## Admin Handoff Checklist

Before payment:

- Confirm the student has an application record or a consultation record.
- Record the plan recommendation and reason in admin notes or the admissions
  tracker.
- Confirm whether the student is new or transferring.
- Confirm whether transcript/report card records have been received.

After payment:

- Save receipt/payment link evidence outside git.
- Record Stripe customer/subscription/invoice ID in the admissions tracker or
  admin notes.
- Approve the application only when fit and payment are both clear.
- Use admin application activation to create student and parent accounts.
- If a Stripe `Subscription` row exists but is unlinked, link it from
  `/admin/subscriptions`.
- If payment was manual and no subscription row exists yet, do not claim
  automatic subscription status is linked; record it for the backend/payment
  deploy follow-up.
- Send `/welcome`, student login, parent login, and first-week expectations.

## Alan Review Items

- Who is authorized to create manual Stripe invoices/payment links?
- Which inbox receives Netlify `consultation` and `contact` notifications?
- Who checks Netlify submissions daily until email notifications are confirmed?
- Who owns first response and WeChat follow-up?
- What Stripe invoice/payment-link naming convention should GIIS use?
- When should the backend/Lightsail payment deploy window happen?
