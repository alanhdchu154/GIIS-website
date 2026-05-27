# Student Coordination System Phase 0-3 Review

Date: 2026-05-27
Reviewer: Umi
Scope: Staff-first student care operating loop. No production deploy.

## Decision

Approved for local Phase 0-3 implementation, admin-only.

This turns "is someone seeing the student?" into an operational surface:

- `LoginSession` remains the care-signal foundation for last seen, rough duration, and last path.
- `StudentCareState` stores the current advisor-owned care snapshot.
- `StudentCareLog` stores append-only advisor/intervention relationship memory.
- `/admin/progress` now functions as a Student Coordination console rather than only a progress table.

## Implemented

- Added Prisma models:
  - `StudentCareState`
  - `StudentCareLog`
- Added care helpers in `server/src/lib/studentCare.js`:
  - computed risk/status
  - manual override display behavior
  - date parsing
  - parent-safe serializer that omits `bodyInternal`
- Extended admin progress API:
  - returns `careState`, `careDisplay`, `computedCare`, `recentCareLogs`
  - keeps computed signals visible even when manual override controls displayed risk/status
- Added admin care APIs:
  - `GET /api/students/:id/care-state`
  - `PATCH /api/students/:id/care-state`
  - `GET /api/students/:id/care-logs`
  - `POST /api/students/:id/care-logs`
- Extended audit trail with `care_log` events.
- Extended the G9-G12 lifecycle audit to seed and verify care state/logs.
- Rebuilt `/admin/progress` as a staff coordination UI with:
  - risk/status/advisor/review/check-in fields
  - filters for attention states
  - detail panel
  - care-state editor
  - advisor note form
  - recent care-log memory
  - links to audit trail and transcript

## Safety Review

- `bodyInternal` is admin-only in the new APIs and intentionally not added to parent APIs.
- Parent-facing reassurance is not implemented yet. This avoids exposing internal advisor judgment before privacy rules are tested more deeply.
- `durationSeconds` remains an operational signal only. Do not describe it as exact seat time.
- Manual override affects the displayed care state only; computed flags remain visible to staff.
- Care logs are append-only from the API perspective: no update/delete endpoints were added.

## Verification

- `cd server && npm run db:push` passed.
- `node -c server/src/lib/studentCare.js && node -c server/src/routes/students.js && node -c server/scripts/g9-g12-lifecycle-audit.js` passed.
- `cd server && npm test -- --runInBand` passed: 31 tests.
- `npm run audit:pathways` passed: 93 pass / 0 warn / 0 fail.
- `npm run audit:graduation` passed.
- `npm run audit:seniors` passed with existing historical/import warnings only.
- `npm run build` passed.
- Browser smoke passed on local dev:
  - admin login succeeded against local API
  - `/admin/progress` rendered `Student Coordination`
  - summary cards and student rows rendered
  - selecting a student opened the advisor note/detail panel
  - screenshot saved at `/tmp/giis-student-coordination-smoke.png`
- Local API smoke passed:
  - synthetic G9-G12 student created with care state/log
  - admin login succeeded
  - care-state PATCH persisted manual override
  - internal advisor note created
  - parent-safe note created
  - `/api/students/progress` showed manual display state
  - `/api/students/:id/audit-trail` included care log events
  - student and parent logins created LoginSession signals
  - `/api/parent/me` did not expose `bodyInternal` or the internal smoke phrase
  - synthetic student cleanup completed

## Remaining Work

- Phase 4: `StudentWeeklySnapshot` and advisor-approved weekly report drafts.
- Phase 5: parent reassurance layer using parent-safe summaries only.
- Phase 6: transfer/graduation mapping source records.
- Add deeper route-level API tests if this moves toward production migration/deploy.
- Create a production schema migration/deploy plan before shipping; do not ad hoc deploy this schema change.
