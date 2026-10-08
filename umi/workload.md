# Active worker handoff

Updated: 2026-10-07 America/Chicago. One focused task only; completed branch
release history remains in `ROADMAP.md` and accepted reports.

## Current coordinator outcome — deploy revocable sessions to Lightsail

**Task ID:** `TASK-GIIS-SESSION-LIGHTSAIL-20261007`

**Owner:** Platform Engineering, coordinated and accepted by GIIS Umi.

**Target release:** `6c9f35ce` session behavior, contained in the current
`origin/main` descendant of `6246f8bb`; record the exact remote commit at deploy.

**Outcome required:** production API authorizes account JWTs only when they
match an open persisted `LoginSession`; logout revokes that session. Payment,
admission, academic approval and student records remain unchanged.

**Execution mode:** Codex/Umi runbook execution; skip cc. The exact implementation
already passed independent findings-first security review plus 15 backend suites
/ 170 tests. The remaining work is production target verification, backup,
fast-forward deploy, restart and read-only/non-mutating smoke; another code-mode
handoff would duplicate reviewed evidence rather than improve it.

**Pre-deploy gates:**

- primary repo clean and exact with `origin/main`;
- read-only production env/API/PM2/git check passes without printing secrets;
- production `LoginSession` and `ProcessedStripeEvent` tables exist;
- fresh production custom-format Postgres backup is created outside git and its
  path/size/hash are recorded without copying data locally;
- remote checkout is clean or only contains explicitly understood local runtime
  files; stop on unknown tracked changes;
- no `db:seed`, real Stripe charge/refund, student mutation, email or application
  workflow mutation.

**Deploy sequence:** freeze risky admin actions for the short window; fetch and
fast-forward `main`; install locked server dependencies; generate Prisma client;
run schema validation and only run `db:push` if the read-only schema comparison
shows it is required; restart the existing `giis-api` PM2 process; verify health,
unsigned webhook rejection, checkout tiers, parent/auth rejection behavior and
production readiness audits.

**Rollback trigger:** API unhealthy, PM2 not online, protected routes stop
rejecting unauthenticated requests, checkout tiers unavailable, unsigned webhook
accepted, or new repeated errors. Roll back API code to the recorded pre-deploy
commit and restart; leave additive database tables in place.

**Known boundary:** legacy/sessionless JWTs must sign in again after deploy.
Password reset does not revoke all prior sessions, so claim logout revocation
only. Every protected request adds a required session lookup; observe PM2 errors
and latency after restart.

**Completion evidence:** pre/post commit, backup receipt, table readback, PM2
status, health/API/payment audit results, rollback point, and Central handoff
update. If any gate fails, record the exact hold and do not call the backend live.
