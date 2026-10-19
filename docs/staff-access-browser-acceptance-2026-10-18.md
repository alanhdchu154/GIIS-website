# Staff Access Control v1 — synthetic browser acceptance

Date: 2026-10-18 America/Chicago
Scope: local-only browser/API acceptance; no production, real accounts, mail,
payment, schema apply, push or deploy.

## Environment

- Frontend: local development server at `http://localhost:3000`.
- Backend: local API at `http://localhost:4400`.
- Data: dedicated PostgreSQL database `giis_staff_acceptance_20261018` with
  `example.invalid` identities only.
- Configured signer: `principal.staff-acceptance@example.invalid` through the
  same `PRINCIPAL_APPROVER_EMAIL` contract used by signing routes.
- Pending invite and provider receipt were inserted as fixtures; no email API
  was called and no raw invitation token was used.

## Observed browser acceptance

1. Synthetic Owner login succeeded and `/admin/staff` loaded.
2. Summary showed 3 active accounts, 1 pending invitation, 2 open sessions and
   configured Principal `ready` before mutation.
3. Fixed Owner, Principal, Academic and Admissions Can/Cannot text rendered.
4. Owner role/state/reset/session controls were disabled; configured Principal
   role/state controls were disabled.
5. Pending Admissions invite rendered as `pending` with
   `provider_accepted`, without token or access URL.
6. The first disable attempt exposed a real browser blocker: native
   `window.prompt()` was unsupported. The UI was corrected to an in-page,
   labelled Review access action panel with required reason and explicit
   consequences; invite, role/state, reset and revoke use the same pattern.
7. Academic disable then completed: account became Disabled, open sessions fell
   from 1 to 0, and `staff_disabled` plus its reason appeared in the audit table.
8. Independent session revoke completed idempotently with 0 remaining sessions,
   and `staff_sessions_revoked` plus reason appeared in the audit table.
9. Direct authenticated API bypass attempts returned HTTP 409 for both Owner
   disable (`self_owner_change_denied`) and configured Principal role change
   (`protected_principal`).

A full-page screenshot containing synthetic identities only was captured in the
acceptance task after disable/revoke and shows the summary, role boundaries,
protected controls, pending fixture and both new audit rows.

## Verification

- Frontend: 21 suites, 83 tests passed.
- Staff UI focused: 2 suites, 5 tests passed.
- Production build succeeded; inherited DOMPurify source-map warnings remain.
- Backend remains 21 suites, 275 tests passed from the accepted candidate.
- Prisma schema validation and `git diff --check` passed.

## Readiness and rollback

Verdict: **ACCEPT — local pipeline and browser candidate**. This is not a live
release or production verification.

Release requires fresh integration from the exact candidate, remote CI, backend
and frontend release gates, then read-only production checks before any real
staff operation. Rollback is code-only: redeploy the prior frontend/backend
commit. No schema migration is introduced. If a production mutation were ever
performed after release, code rollback would not reverse account/session/audit
state; that would require a separately authorized, targeted operational action.
