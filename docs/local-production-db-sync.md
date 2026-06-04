# Local Production Snapshot Workflow

Use this workflow when local QA needs to match the current Lightsail production
database. Do not use `npm run db:seed` for senior records, graduated students,
parent accounts, subscriptions, or live enrollment/progress QA.

## Why

Production is the source of truth for archived graduates, official records,
subscriptions, parent accounts, login sessions, applications, and student
progress. Seed data is only for a clean development sandbox; it can drift from
production and should not be used to "repair" live-like records.

## Safe Order

1. Confirm the target is local PostgreSQL.
   - `server/.env` should point to a local `DATABASE_URL`.
   - Never restore into the production host.
2. Take a local backup before overwriting local data.
   - Store it under `server/tmp/db-sync/`.
3. Create a read-only production dump from Lightsail.
   - Prefer `pg_dump --format=custom --no-owner --no-acl`.
   - Keep dump files in `server/tmp/db-sync/`; they must stay uncommitted.
4. Restore into local PostgreSQL.
   - Use `pg_restore --clean --if-exists --no-owner --no-acl`.
5. Apply repo course-resource sync locally only when needed.
   - `node server/scripts/sync-course-resources-from-json.js --apply`
   - This updates course/module resource metadata, not student records.
6. Verify the important gates before local QA.
   - `curl http://localhost:4000/health`
   - `npm --prefix server run audit:seniors`
   - Confirm graduated students return archived runtime responses.
   - Smoke parent/admin pages from `http://localhost:3000`.

## Guardrails

- Do not commit dump files, generated database backups, cookies, JWTs, or raw
  production secrets.
- Do not run seed after syncing from production unless intentionally resetting
  the local database to a sandbox state.
- If production and local data disagree, treat production as current evidence
  and document the sync date before making code decisions.
- Graduated students should remain read-only at runtime. Fix code gates if they
  can still be mutated; do not "fix" that by changing seed data.
