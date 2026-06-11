# Admissions Consultation Response SOP

Last updated: 2026-06-11

Purpose: turn a parent consultation request into a clear, conservative enrollment
decision path within one business day. This is the internal operating script for
the pre-payment sales motion; it does not replace legal, accreditation, or
official transcript policy.

## Response Standard

- First response: within one business day.
- Tone: calm, school-like, not pushy.
- Default next step: schedule a 15-20 minute consultation before payment.
- Default recommended plan for transfer families: Guided at `$149/month` when
  credit review, pacing, parent accountability, or graduation timing is unclear.
- Do not send a Stripe checkout link until the enrollment path is clear.
- Do not promise admission outcomes, scholarship outcomes, CEEB issuance,
  accreditation completion, AP authorization, NCAA acceptance, or automatic
  transfer of every prior credit.

## Intake Fields To Review

Use the `consultation` Netlify form submission:

- `parentName`
- `email`
- `parentWeChat`
- `studentGrade`
- `studentSituation`
- `transcriptAvailable`
- `desiredStart`
- `preferredTime`
- `message`

If the request came through email, WeChat, phone, or the older `contact` form,
capture the same fields manually before recommending a plan.

## Lead Triage

### Green: Ready For Consultation

Use when the family gives a clear grade level, has at least partial records, and
wants to discuss fit or transfer timing.

Action:

- Reply with two meeting windows.
- Ask for transcript/report card if not attached.
- Prepare a preliminary 24-credit framework estimate before the call when
  records are available.

### Yellow: Needs More Information

Use when the family is interested but missing grade level, current school
status, transcript availability, or graduation timing.

Action:

- Reply with a short clarification request.
- Do not quote a final timeline or credit count.
- Offer a consultation after the missing information is supplied.

### Red: Do Not Sell Yet

Use when the family asks for guaranteed admission, urgent backdated records,
unsupported AP/College Board claims, automatic diploma issuance, or a result the
school cannot honestly provide.

Action:

- Respond conservatively.
- State what GIIS can review.
- Escalate to the principal before accepting payment.

## Consultation Agenda

1. Confirm student identity, grade, current school situation, and target timing.
2. Review whether transcript/report card records exist and what they appear to
   cover.
3. Explain the 24-credit framework in plain language.
4. Identify the likely remaining course areas without making a final credit
   promise before official review.
5. Show the parent proof path: Trust Center, Parent Dashboard Preview,
   Assessment Proof, Graduate Stories, and Pricing.
6. Recommend Self-Paced, Guided, or Premium based on support need.
7. Explain the 30-day refund policy and that payment happens after the path is
   clear.
8. Agree on the next action: apply, send documents, schedule follow-up, or
   decline fit.

## Plan Recommendation Rules

Recommend Self-Paced (`$49/month`) when:

- the student is self-directed,
- records/path are simple,
- the family mainly needs official school enrollment and course access,
- parent support expectations are low.

Recommend Guided (`$149/month`) when:

- the student is transferring,
- prior credits need review,
- graduation timing matters,
- the parent wants monthly accountability,
- there is risk of missing work or weak engagement.

Recommend Premium (`$299/month`) when:

- the family wants pathway planning tied to major direction,
- writing/project portfolio support matters,
- parent planning support needs to be more frequent,
- the student is college-bound and needs a stronger academic story.

## Email Templates

### First Response: Clear Transfer Family

Subject: GIIS consultation request received

Hi `{parentName}`,

Thank you for reaching out to Genesis of Ideas International School. Based on
what you shared, the right next step is a short consultation before payment so
we can review your child's current grade, prior records, and target graduation
timing.

Could you send any available transcript, report card, or course history before
the call? We will use it only for a preliminary path review; final credit
decisions require official review.

Two possible meeting windows:

- `{option_1}`
- `{option_2}`

After the consultation, we can tell you whether Self-Paced, Guided, or Premium
support is the best fit. For most transfer families, Guided is the usual default
because it includes transfer-credit review, course planning, and parent progress
review.

Best,
GIIS Admissions

### Clarification Request

Subject: A few details before we schedule your GIIS consultation

Hi `{parentName}`,

Thank you for contacting GIIS. Before recommending a plan, could you reply with:

- student's current grade,
- whether you have a transcript or report card,
- when you hope the student would start,
- whether the student is transferring from another school or starting fresh.

Once we have those details, we can schedule a consultation and review the most
realistic enrollment path before payment.

Best,
GIIS Admissions

### Conservative Decline Or Escalation

Subject: GIIS path review

Hi `{parentName}`,

Thank you for reaching out. We want to be careful and honest before accepting
payment. GIIS can review records, map credits to our graduation framework, and
recommend a realistic path, but we cannot promise automatic credit transfer,
backdated records, guaranteed college admission, or results that depend on an
outside organization.

I will ask the principal to review your situation before we recommend any plan.

Best,
GIIS Admissions

## After-Call Checklist

- Record the recommended plan and reason.
- Record whether transcript/report card was received.
- Record the next action and owner.
- If the family should apply, send `/apply`.
- If the family needs proof before applying, send `/trust-center`,
  `/parent/demo`, `/assessment-proof`, and `/graduates`.
- If payment is appropriate, send the correct checkout path only after the
  enrollment path is clear.

## Alan Review Items

- Confirm who receives Netlify `consultation` notifications.
- Confirm who is allowed to send first responses.
- Confirm whether WeChat follow-up should be centralized or handled by the
  principal.
- Confirm whether Guided remains the default recommendation for transfer
  families after the first real consultations.
