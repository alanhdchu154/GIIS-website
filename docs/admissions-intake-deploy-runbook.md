# Admissions Intake and Transfer Review Deploy Runbook

Last updated: 2026-08-10

Use this runbook to release the structured application queue and the
course-by-course transfer-credit decision workflow. This release changes both
the Lightsail API/production database and the Netlify frontend. A GitHub push
deploys only the frontend; the full workflow is not live until the separate
backend/database window is completed.

## Release Boundary

- Public applications remain review-before-payment.
- New `serious-v1` applications require bounded motivation, intended timing,
  tuition/no-guarantee/72-hour acknowledgments, and parent-email interest
  confirmation before entering the active admissions review queue. The random
  confirmation token is stored only as a hash and expires after 72 hours.
- Transfer applications require verified official records, a saved
  course-by-course evaluation, and recorded principal approval before the
  application can be approved or manual payment can be recorded.
- Account activation also requires verified payment evidence.
- No transcript files are uploaded or stored by this release.
- Transfer families without a transcript may apply by providing a course
  summary, records-request situation, and expected availability; official
  records are still required before approval.
- The additive `transfer-v2` intake collects current enrollment status,
  repeatable prior-school history, operational records status/help/ETA,
  optional estimated credits, graduation planning preference, and parent
  relationship/contact preference. A course summary is required only while
  usable records are unavailable. Family credit estimates and target dates are
  planning inputs, not school decisions or graduation promises.
- The admin records-request action is deliberately two-part: copying the
  prepared draft changes no state; an operator must send the reviewed message
  and separately confirm it. Only that confirmation writes
  `recordsStatus=requested`, the `official_records_requested` event, and the
  next action. Received or uploaded material is never marked verified
  automatically.
- The legacy notes envelope remains readable during a backend-first rollout,
  and pre-confirmation-era cases remain reviewable.
- The frontend sends a `HEAD` request to the existing `/api/checkout/tiers`
  endpoint and checks the `X-GIIS-Admissions-Workflow` response header. When an
  older backend is still live, the new form pauses submission and the admin
  page pauses new review/approval/payment/activation controls until
  `admissions-v4` is live. It must never silently discard v2 intake fields or
  claim that a confirmation email was sent without backend support.
- The `admissions-v4` public form requires the main family concern for every
  serious applicant and a current or most recent school for new students. The
  admin first-outreach guide prepares an email, phone, or available WeChat
  message, but opening or copying a draft never records contact; the operator
  must separately confirm that the contact actually happened.

## Commit Split

Prepare and review two scoped commits:

1. Backend first: Prisma schema, application routes, mailer, focused tests,
   repair script, and this runbook.
2. Frontend second: application form, admin queue, transfer evaluation editor,
   and browser-audit fixture/report updates.

Push both reviewed commits only after the local gates pass. Netlify may release
the frontend before Lightsail is updated; the `admissions-v4` capability gate
temporarily pauses submission in that window rather than dropping structured
intake data. The preferred activation order remains backend/database first,
then production verification of the already-pushed frontend.

## Backend Window

1. Run local gates.

   ```bash
   cd server
   npm test -- --runInBand
   npx prisma validate --schema prisma/schema.prisma
   cd ..
   npm run build
   npm run audit:ops-browser
   ```

2. On Lightsail, confirm the intended repo, branch, and production database.
   Freeze application approval, manual-payment recording, and account
   activation for the short deploy window.

3. Back up production Postgres before changing the schema. Follow
   `docs/production-payment-deploy-runbook.md`; do not commit the dump.

4. Pull the reviewed backend commit, install, generate Prisma Client, and apply
   the additive schema.

   ```bash
   git pull --ff-only origin main
   cd server
   npm ci
   npm run postinstall
   npm run db:push
   ```

   Do not run `npm run db:seed` in production.

5. Preview the legacy application backfill.

   ```bash
   npm run audit:application-intake
   ```

   The output lists application IDs and field names only. Confirm that it does
   not propose status changes, record verification, approval, payment, account
   creation, deletion, or case merging.

6. Apply the reviewed backfill and rerun the audit.

   ```bash
   npm run repair:application-intake
   npm run audit:application-intake
   ```

   Expected final result: `Rows needing backfill: 0`.

7. Restart the existing API process and inspect its logs. Do not start a second
   process on the same port.

   ```bash
   pm2 restart giis-api
   pm2 logs giis-api --lines 80
   ```

8. Confirm health and one authenticated admin read before ending the freeze.

   ```bash
   curl -fsS https://api.genesisideas.school/health
   ```

   In `/admin/applications`, confirm legacy cases load, the type filter works,
   and transfer cases show the school history, records-request controls, and
   evaluation editor. Do not change a real family's status merely for smoke
   testing.

9. Inspect API logs and the admin `Awaiting parent confirmation` filter after
   the smoke submission. `interestConfirmationSentAt` is written only after
   the mail provider accepts the send. A failed send returns a visible retry
   error, keeps the case gated, and records a delivery-failure event; any
   unexpected unconfirmed buildup is a delivery incident to resolve before
   relying on the default confirmed-only queue.

## Frontend Release

GitHub `main` triggers the Netlify production deploy. If the frontend was
already pushed, first confirm that the production page is in compatibility
mode, then complete the backend/database window and verify the capability
endpoint unlocks the new workflow.

Run:

```bash
npm run audit:frontend-deploy -- --base-url https://genesisideas.school
npm run audit:conversion-bilingual -- --base-url https://genesisideas.school
npm run audit:parent-journey -- --base-url https://genesisideas.school
```

Then submit one explicitly labeled test application using a non-family test
address. Verify the bilingual parent confirmation email, confirm the link once,
verify repeated confirmation is idempotent, and verify exactly one admin alert
with working Reply-To. Confirm a duplicate response does not create a second
pending case, then remove the test case through the approved admin/database
cleanup procedure.

## Rollback

- Frontend: use Netlify rollback or revert only the frontend commit.
- Backend: revert the backend code and restart the API.
- Leave the additive application columns and transfer-evaluation tables in
  place unless a reviewed database plan says otherwise. Old code ignores them.
- Do not restore a database dump unless production data was damaged and the
  restore has been explicitly approved.

## Deferred Secure Upload

This release does not add a public transcript file input. Before document
upload can ship, define private storage, encryption, role-based access,
retention/deletion, audit logging, MIME and size limits, malware scanning,
secure download behavior, backups, and incident handling. A successful upload
may set a human-review queue state only; it must never prove that a record is
official or verified.
