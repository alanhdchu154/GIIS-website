# Parent Sales Daily Operator Checklist

Last updated: 2026-06-11

Purpose: make an outreach day operational even while permanent owner decisions
are still pending. This checklist is for same-day coverage. It does not
authorize automated checkout, external emails, or payment collection by an
unauthorized person.

## Start-Of-Day Gate

Run these before sending outreach or relying on inbound leads:

```bash
npm run sales:ready-today -- --operator-log /path/to/operator-log.md
```

Proceed only when `sales:ready-today` returns one of these verdicts:

- `manual_sales_go_with_payment_boundary`
- `full_sales_ready`

If the verdict is `manual_sales_go_with_payment_boundary`, outreach and
consultation-first manual sales may proceed, but automated Guided/Premium
checkout links are still blocked.

Use this template for the daily log:

`docs/templates/parent-sales-daily-operator-log.md`

Save filled logs outside git if they include parent names, emails, payment
links, transcripts, or other student/family information.

## Same-Day Owner Coverage

Before outreach starts, write down:

- lead-capture owner: who checks Netlify `consultation` and `contact`
  submissions today,
- first-response owner: who replies within one business day,
- WeChat follow-up owner: who follows up when WeChat is provided,
- principal escalation owner: default is Shiyu Zhang, Ph.D.,
- manual Stripe owner: who is authorized by Alan to create invoice/payment
  links,
- manual Stripe authorized by Alan: yes/no,
- payment record location: where receipt/Stripe IDs are recorded outside git.

If any of these cannot be covered, do not start outreach that day.

You can prove same-day coverage to the readiness gate with a filled operator
log:

```bash
npm run sales:ready-today -- --operator-log /path/to/operator-log.md
```

The log may contain internal owner names, so keep filled logs outside git unless
Alan explicitly approves committing a sanitized version.

## Lead Inbox Check

Check these channels:

- Netlify `consultation` form submissions,
- Netlify `contact` form submissions,
- `admissions@genesisideas.school`,
- WeChat messages if a WeChat owner is assigned,
- any manually shared parent referrals.

Do not rely only on email forwarding until Netlify form notifications are
confirmed.

## Response SLA

- Same day when possible.
- Within one business day maximum.
- Red-flag requests go to the principal before any payment discussion.
- Use `docs/admissions-consultation-response-sop.md` for triage.
- Use `docs/parent-sales-outreach-packet.md` for first message and follow-up
  scripts.

## Payment Boundary

Manual payment may happen only after path review and only by an authorized GIIS
operator.

Do not send automated Guided/Premium checkout links until:

```bash
npm run audit:sales-payment-live
```

returns 0 fail.

Allowed manual payment flow:

- family has completed consultation or application path review,
- plan and price are documented,
- refund policy is mentioned,
- Stripe invoice/payment link is created by the authorized operator,
- receipt/Stripe ID is recorded outside git,
- portal activation happens only after fit and payment are both clear.

## End-Of-Day Closeout

Record:

- number of new leads,
- number responded,
- number waiting for records,
- number escalated to principal,
- number ready for application,
- number payment-ready after path review,
- missed or stale submissions,
- tomorrow's owner.

If any lead was missed or no owner is available tomorrow, pause outreach until
coverage is restored.

## Stop Conditions

Stop outreach and escalate if:

- `npm run audit:sales-manual-ready` has any fail,
- no one can check Netlify submissions today,
- no one can respond within one business day,
- no Alan-authorized Stripe operator is available but a payment link is needed,
- a family asks for guaranteed admission, automatic credit transfer, backdated
  records, AP/College Board authorization, accreditation completion, CEEB
  issuance, or another unverifiable claim,
- a parent provides sensitive student records and no approved storage location
  is available.
