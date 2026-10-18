# G9 family handoff and application-safety candidate

Date: 2026-10-17 America/Chicago
Case reference: `G9-20261017-A` (family originals and detailed score record stay outside git)
Reviewed behavior candidate: `codex/g9-family-handoff-20261017` at `8b7e1803d879193d5fb1080b9de66ae869d33ba7`
Production release: `932dae77583d849f672b253e89e12771f0fdc0be`
Base: `origin/main` at `d89a48636455df88318279b7fcb667308eb8bb9a`

## Outcome

The first real Grade 9 readiness packet remains **Pending Clarification**. The
private staff assessment supports Algebra I readiness but does not yet establish
independent sustained English writing or science-evidence reasoning. A 20–30
minute oral walkthrough and Principal decision remain required. No admission,
enrollment, credit, grade, transcript or payment decision was made.

The provisional score record, analysis, six-week bridge, first-semester plan
and Principal action request were provider-accepted for delivery to the
configured Principal email. A replacement production Principal setup invitation
was provider-accepted. It expires after seven days, at
`2026-10-25T02:11:44.960Z`; password-reset links remain limited to 60 minutes.
These receipts prove provider acceptance, not inbox delivery or acceptance of
the Principal account. Production capability remained
`principal_admin_missing` on the final readback.

## Candidate behavior

- Parent-safe application status separates assessment follow-up, Principal
  review, approved/payment next, paid/activation pending, account/course setup,
  ready-to-begin and active-learning stages.
- Only Principal-approved family-facing placement fields are returned; staff UI
  explicitly identifies those fields before signature. Internal rationale,
  evidence, assistance/accommodations and observations remain staff-only.
- Account activation is transactional and retry-safe. It requires payment
  evidence belonging to the exact application, refuses subscriptions linked to
  another student, and records activation only after every qualifying receipt
  subscription is linked to the exact new student.
- Account creation and payment are not described as enrollment or course
  readiness. Automatic and fallback welcome copy says course setup remains
  pending and identifies the approved courses/reviewer handoff.
- Students cannot self-enroll in published courses. Staff must assign the
  reviewed plan; the student UI no longer offers direct formal enrollment.
- Generic public-plan Checkout is disabled. New families use the approved
  application-bound Checkout. Existing recurring subscriptions auto-renew;
  plan changes go through staff and the Stripe billing portal remains available
  for subscription management.
- Internal group/test Checkout is owner-only. Principal, academic, admissions,
  support, student and parent sessions are denied.
- `academic_staff` can read and grade the assignment queue; admissions, support
  and Principal roles cannot grade.

## Conditional first-semester plan

If the Principal signs `Ready with Bridge` after the walkthrough:

- Begin English I, Algebra I, Biology and World History only.
- Weeks 1–2: English baseline, Biology evidence paragraph and Day 5–7 human
  review; delay PE/Health/elective until the Week 2 pacing check.
- Weeks 3–6: weekly reviewed/revised English and science writing, plus targeted
  Algebra I work on signed rate of change and identity/infinite solutions.
- Weeks 7–14: English I Modules 4–7 with narrative and literary-analysis
  revision while continuing the three other core courses at reviewed pace.
- Weeks 15–16: catch-up, two-piece writing portfolio and midterm-readiness review.

The bridge is successful only when two independent pieces are human-reviewed,
revised and meet the agreed rubric. Video/module/quiz completion alone is not
evidence that the gap closed.

## Verification

- Backend: 21 suites / 261 tests passed.
- Frontend: 19 suites / 78 tests passed.
- Prisma schema validation passed with a validation-only URL.
- Production build compiled successfully.
- Placement browser smoke passed all nine synthetic stages and stopped at the
  reviewed course-assignment handoff; no email, account, charge or production
  mutation occurred in the smoke.
- Production API proxy smoke: 12/12 passed.
- Production payment live audit: 6/6 passed.
- Production parent journey acceptance: 7/7 passed.
- Production bilingual conversion smoke: 7/7 passed.
- GitHub CI run `39089116414` passed.
- Three repeated focused loops passed: backend 97/97 per loop and frontend 8/8
  per loop.
- Independent findings-first reviews rejected two earlier revisions, after
  which the exact final candidate received `ACCEPT` with no blocking findings.

## Release and service state

Verdict: `DEPLOYED_VERIFIED`.

Netlify reported `932dae77583d849f672b253e89e12771f0fdc0be` as the currently
published frontend commit. Lightsail runs the same exact commit from
`/home/ubuntu/releases/giis-932dae77`; public and local health checks passed.
The pre-release PostgreSQL backup is
`/home/ubuntu/backups/giis/giis-prod-before-932dae77-20261018T021019Z.dump`
with SHA-256
`b319b0a475485ee92e7c867b712a4bc20d0bf746c81add3861c6aedea1546577`.
There was no Prisma schema difference, database push or seed.

The replacement Principal invitation was provider-accepted for
`shiyu.zhang@genesisideas.school` with role `principal`, invite ID
`cmvd6w8ub0002neruuow1d5sa`, expiry `2026-10-25T02:11:44.960Z`, and provider
ID `01a14cc7-7f39-73fc-984d-41c3f6996f8a`. The former invitation was
invalidated by the replacement flow. No charge, student/family mutation,
account activation, course assignment or enrollment was performed.

The family is manually serviceable only after all of the following:

1. Principal accepts her seven-day account invitation and sets her password.
2. School schedules and completes the oral walkthrough.
3. Principal signs the placement result and the family-visible bridge/term plan.
4. Admissions approves the application.
5. The application-bound Stripe receipt is verified.
6. Accounts are activated and the four approved courses are assigned before the
   family is told to begin.
7. A named reviewer owns weekly English/science feedback, Day 5–7 and Week 4–6.

Remaining product limitation: `firstTermPlan` is still signed free text rather
than a structured course allowlist. Student self-enrollment is blocked, so the
current safe service path is staff assignment plus manual verification. A
future schema can make the signed course plan mechanically enforceable.
