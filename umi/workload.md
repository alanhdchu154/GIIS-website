# Active worker handoff

Updated: 2026-10-18 America/Chicago. One focused task only.

## Staff Access Control v1 — local implementation and testing

**Task ID:** `TASK-GIIS-STAFF-ACCESS-V1-20261018`

**Owner:** Platform Engineering, coordinated and accepted by GIIS Umi.

**Authorized outcome:** extend the existing Owner-only `/admin/staff` foundation
with fixed single roles for Owner, Principal, Academic and Admissions; account
identity/role/active state; plain-language allow/deny role descriptions;
pending invitation state; Owner invite/assign/disable/session revoke; Owner-only
append-only audit history; and protected Owner/configured-Principal behavior.

**Baseline:** clean isolated worktree at exact `origin/main` `9fe7f889`. The
primary checkout is stale and contains unrelated dirty school-operations files.
The separate two-file Admissions/Academic RBAC production release is explicitly
out of scope and must not be imported or treated as approved.

**Allowed:** `server/src/routes/staff.js` and focused tests; existing staff
permission helpers/tests when needed for truthful role descriptions; the
smallest admin staff UI/test files; additive local-only test helpers or docs.
Use existing Prisma models unless a concrete requirement cannot be met safely.

**Forbidden:** sending real invitation/reset email, creating or changing real
staff accounts/roles/credentials, production data access, push, deploy, schema
apply, changing production environment, broad route-RBAC rollout, arbitrary
permission editor, multi-role union, or Support provisioning.

**Acceptance:** focused backend/frontend tests cover every operation and denial;
configured Principal and Owner protections fail closed; role/state mutations
revoke sessions and invalidate pending links; list response contains safe
pending/session/audit summaries without tokens or password data; UI explains
permissions and confirmation consequences; full bounded server/frontend tests,
build, Prisma validation and `git diff --check` pass with synthetic data only.

**Model routing:** Claude Code Sonnet implementation for scoped routine product
work; Codex/Umi owns diff review and acceptance. Independent security review is
separate and may use Opus-class judgment. Worker may edit only allowed product/
test files, not this workload, ROADMAP, AGENTS, Central files or production.

**Stop conditions:** required schema migration, conflict with configured
Principal identity policy, inability to test without mail/production/real data,
unexpected dirty overlap, or any need to widen route permissions beyond the
existing role matrix.

**Local trial result (2026-10-18):** implementation candidate is complete and
automatically covered by the existing frontend and `server-smoke` CI jobs; no
workflow-file change was needed. Focused Staff Access backend coverage is 23/23;
frontend Staff Access/link coverage is 4/4. Full evidence: frontend 82/82,
production build succeeds; server 275/275; Prisma schema validates with a
synthetic URL; `git diff --check` passes. Independent final security review
returned **ACCEPT** after Principal-config, audit-lifecycle and single-mutation
blockers were corrected. No real mail, account, credential, production data,
schema apply, push or deploy occurred. Status is **LOCAL PIPELINE CANDIDATE
ACCEPTED**, not released or production-verified.

**Browser acceptance follow-up:** a dedicated local synthetic database and Mac
browser run exposed unsupported native `prompt/confirm`; the UI was changed to
an in-page reasoned confirmation panel and rerun successfully. Academic disable
and idempotent revoke produced visible state and audit deltas; direct Owner and
configured-Principal bypasses returned 409. Frontend is now 83/83 and focused UI
is 5/5. Evidence and rollback boundaries:
`docs/staff-access-browser-acceptance-2026-10-18.md`.

## Family access completion and production release

**Task ID:** `TASK-GIIS-FAMILY-ACCESS-RELEASE-20261017`

**Owner:** Platform Engineering, coordinated and accepted by GIIS Umi.

**Alan-authorized outcome:** complete and release the missing family-account
workflow after the current-state audit: a private applicant status URL, no public
student self-registration, and password-reset revocation of all active student
or parent sessions. Preserve the already-implemented staff RBAC/invitation
system; do not replace it or create a real staff account during testing.

**Baseline:** isolated worktree at exact `origin/main` commit `f4d70e33`. The
primary checkout has unrelated dirty school-operations/audit files and is out of
scope. Current main already contains database-backed staff roles and owner-only
staff access management, so this task must not misreport that work as newly
implemented.

**Allowed files:** applicant/application API and tests; student/parent auth and
session tests; Prisma schema/migration only if the status-token design genuinely
requires it; Apply/status frontend route/components and focused frontend tests;
the smallest related roadmap/report/workload documentation.

**Forbidden:** real family/student/staff data, sending test email, charging or
refunding, enrollment/credit/placement/graduation decisions, changing public
school/accreditation claims, broad dependency upgrades, teaching-video/content
changes, and unrelated dirty primary-checkout files.

**Accepted candidate:** independent security review returned `ACCEPT` against
baseline `f4d70e33` after login/reset row fencing, legacy status semantics,
compare-and-swap status-link rotation/rollback, retryable status errors, token
field stripping, capability gating and the direct-route rewrite were verified.
Local evidence: backend 234/234 tests, frontend 69/69 tests, focused status-page
4/4 tests, Prisma validation, production build, parent-journey 7/7, public trust
claims audit and `git diff --check` all pass.

**Status:** `COMPLETE`. Release `29d5d65a` is live on the frontend and backend.
The protected database backup, additive schema receipt, clean PM2 release path,
exact backend commit, proxy checks and browser readback are recorded in
`ROADMAP.md`. No active Platform Engineering mutation remains in this handoff.
Existing applications require an authorized staff member to choose **Send status
link**; deployment itself intentionally sent no email.

**External wait:** Alan authorized the configured Principal invitation on
October17. Provider receipt and production EmailLog both report `sent`; one
unexpired invite exists and no Principal AdminUser exists yet. The link expires
at16:10UTC. Placement approval remains `principal_admin_missing` until the
Principal accepts the link and chooses a password. Do not resend automatically.

**Stop conditions:** any need to expose PII in a URL/response, reuse the
short-lived interest-confirmation token as a permanent credential without a
documented security decision, mutate real application/account data for a test,
send real mail, or discover a source/production schema conflict that cannot be
made backward compatible.

**Execution provenance:** Codex/Umi implemented and ran the local verification.
An independent security reviewer performed findings-first review of the exact
candidate and required the concurrency/rollback fixes before acceptance. No
real account, family record, email or payment was used in testing.
