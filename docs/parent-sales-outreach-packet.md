# Parent Sales Outreach Packet

Last updated: 2026-06-11

Purpose: give admissions a conservative, repeatable way to start parent
conversations now that the public proof path is live. This packet is for
consultation-first outreach, not automated checkout.

## Launch Boundary

Use this packet only when the daily gate is acceptable:

```bash
npm run audit:sales-manual-ready
```

Current sellable path: consultation -> transfer/new-student path review ->
plan recommendation -> manual payment handoff when appropriate.

Do not send automated Guided/Premium checkout links until
`npm run audit:sales-payment-live` returns 0 fail. Payment only after path
review.

Allowed public framing:

- Florida-registered private school.
- 24-credit graduation framework.
- Parent dashboard preview and assessment proof are available before payment.
- Transfer families can request a path review before deciding.
- Guided support is usually the transfer-family default when credit review,
  pacing, or parent accountability matters.

Not allowed:

- No guaranteed admission.
- No guaranteed transfer-credit acceptance before official review.
- No accreditation-completed, CEEB-issued, Common App approved, NCAA, AP
  authorization, or College Board claim unless Alan/Umi explicitly approves
  current evidence.
- No payment pressure before the enrollment path is clear.

## Who This Is For

Primary audience: transfer-student families who need to know whether the school
is real, whether prior credits can be reviewed, whether graduation timing is
realistic, and whether an adult will watch progress after payment.

Secondary audience: new online high-school families who want a conservative
private-school path with parent visibility and documented coursework.

## Daily Outreach Readiness

Before sending messages that invite parents to submit a form:

- Run `npm run audit:sales-manual-ready` and require 0 fail.
- Check `docs/parent-sales-owner-decisions.json`; if owner fields are blank,
  consciously assign a same-day temporary owner outside git.
- Confirm someone will check Netlify submissions for `consultation` and
  `contact` the same day.
- Keep `docs/admissions-consultation-response-sop.md` open for the response
  standard.
- Keep `docs/admissions-payment-handoff-runbook.md` open for post-review
  payment boundaries.

## First Message Templates

### Transfer Family

Hi `{parentName}`,

GIIS can review a transfer student's current grade, prior records, and target
graduation timing before asking for payment. The first step is a short
consultation and path review.

You can start here:
`https://genesisideas.school/consultation`

Before deciding, you can also review:

- school proof: `https://genesisideas.school/trust-center`
- parent dashboard preview: `https://genesisideas.school/parent/demo`
- assessment samples: `https://genesisideas.school/assessment-proof`
- graduate stories: `https://genesisideas.school/graduates`

If you have a transcript, report card, or course history, please bring it to the
review. We will give a realistic recommendation before payment.

### New Online Student

Hi `{parentName}`,

GIIS is a Florida-registered private online high school using a 24-credit
graduation framework. Families can review the school proof, parent dashboard
preview, and course evidence before applying.

Start with a consultation:
`https://genesisideas.school/consultation`

Or review the proof path first:
`https://genesisideas.school/trust-center`

Payment happens only after the enrollment path is reviewed.

### Short WeChat Version

Hi, GIIS can review the student's grade, records, and target timing before
payment. Please start with the consultation form:
`https://genesisideas.school/consultation`

You can also review school proof here:
`https://genesisideas.school/trust-center`

We do not promise automatic credit transfer or admission outcomes, but we can
give a realistic path review before payment.

## Consultation Call Script

Use this 15-20 minute flow:

1. Confirm student name, grade, current school, and whether the student is new
   or transferring.
2. Ask whether a transcript, report card, or course history is available.
3. Ask the desired start date and target graduation timing.
4. Explain that GIIS uses a 24-credit framework and reviews prior records before
   recommending a path.
5. Show or send the proof path: Trust Center, Parent Demo, Assessment Proof,
   Graduate Stories, Pricing.
6. Recommend Self-Paced, Guided, or Premium based on support need.
7. Explain that Guided is the usual default for transfer families who need
   transfer-credit review, course planning, and parent progress review.
8. Confirm next action: apply, send records, schedule follow-up, or decline fit.

## Follow-Up Templates

### Green Lead: Ready To Apply

Hi `{parentName}`,

Thank you for speaking with us. Based on the path review, the next step is to
submit the application so admissions can record the student's new/transfer path
and document needs.

Application:
`https://genesisideas.school/apply`

Please include the current transcript/report card if available. Payment will be
discussed only after the path is clear.

### Yellow Lead: Missing Records

Hi `{parentName}`,

We can continue the review once we have the missing records or course history.
Please send any transcript, report card, course list, or learning history you
have. If records are incomplete, tell us what is missing and where the student
last studied.

We should not estimate final credit transfer until records are reviewed.

### Red Lead: Principal Review

Hi `{parentName}`,

Thank you for explaining the situation. We want to be careful before accepting
payment. GIIS can review records and recommend a realistic path, but we cannot
promise automatic credit transfer, backdated records, guaranteed college
admission, or results controlled by outside organizations.

The principal will review this before we recommend a plan.

## What To Record After Each Lead

Record these fields in the admissions tracker or admin notes:

- lead source,
- parent name and email,
- student grade,
- new or transfer path,
- transcript/report card status,
- target start and graduation timing,
- main parent concern,
- recommended plan and reason,
- next action and owner,
- payment status if applicable.

## Same-Day Stop Conditions

Stop outreach for the day if:

- `npm run audit:sales-manual-ready` has any fail.
- Nobody is checking Netlify submissions.
- No one owns first response or WeChat follow-up.
- A family asks for guaranteed admission, automatic credit transfer, backdated
  records, AP/College Board authorization, accreditation completion, CEEB
  issuance, or anything GIIS cannot honestly verify.
- A payment link would need to be sent by an unauthorized person.

## Alan Review Items

These remain outside repo automation and should be reviewed by Alan:

- confirm the daily lead-capture owner,
- confirm who can send first responses,
- confirm who handles WeChat follow-up,
- confirm who can create manual Stripe invoices or payment links,
- confirm Netlify `consultation` and `contact` notifications reach
  `admissions@genesisideas.school`,
- confirm the backend/Lightsail payment deploy window.
