# Active worker handoff

Updated: 2026-10-17 America/Chicago. One focused task only.

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
