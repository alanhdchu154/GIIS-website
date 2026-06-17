# Parent Sales Daily Operator Checklist

Last updated: 2026-06-16

Purpose: make an outreach day operational even while permanent owner decisions
are still pending. This checklist is for same-day coverage. It does not
authorize automated checkout, external emails, or payment collection by an
unauthorized person.

## Start-Of-Day Gate

Run the school operations snapshot before sending outreach, relying on inbound
leads, discussing payment, or asking a family to submit records:

```bash
npm run school:ops-report -- --report /tmp/giis-school-ops-daily.md --json-report /tmp/giis-school-ops-daily.json
```

Proceed with manual sales only when the school ops verdict is:

- `manual_sales_go_with_payment_boundary`
- `automated_payment_ready`

If the verdict is `manual_sales_go_with_payment_boundary`, outreach and
consultation-first manual sales may proceed, but automated Guided/Premium
checkout links are still blocked.

Use the same-day readiness gate when the daily owner is not already recorded in
`docs/parent-sales-owner-decisions.json`, or whenever the operator needs a fresh
outside-git owner log:

```bash
npm run sales:ready-today -- --operator-log /path/to/operator-log.md
```

For an active outreach day, prefer the guarded starter. It runs the full school
ops report first, refuses unsafe school-ops verdicts, writes the outside-git
operator log with the school-ops and lead-capture dry-run verdicts copied in,
then runs launch-mode:

```bash
npm run sales:start-day -- --owner Alan --checked yes --manual-stripe-authorized yes
```

Proceed only when `sales:ready-today` returns one of these verdicts:

- `manual_sales_go_with_payment_boundary`
- `full_sales_ready`

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

The school ops snapshot already runs the dry-run lead-capture verifier. Run it
directly before the first outreach day, after a form/deploy change, or when the
daily report points at lead-capture:

```bash
npm run lead-capture:test -- --report /tmp/giis-lead-capture.md --json-report /tmp/giis-lead-capture.json
```

Dry run checks local hidden forms, production form registration, and the test
payload shape. It does not send an external form submission. Only run the real
test when an operator is ready to confirm the Netlify submission and admissions
inbox delivery:

```bash
npm run lead-capture:test -- --confirm-submit --form all --report /tmp/giis-lead-capture.md --json-report /tmp/giis-lead-capture.json
```

After a confirmed submit, check both Netlify form submissions and
`admissions@genesisideas.school`. Keep the test submission marked as a test lead
and do not count it as a parent inquiry.
Fill the Lead-Capture Delivery Verification section in the operator log before
removing the daily manual Netlify submissions check.

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
