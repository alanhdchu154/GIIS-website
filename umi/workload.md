# Umi Workload

This is the small active board for Umi-managed GIIS work. Keep it focused. If there are more than 5 active items, Alan is probably carrying too much at once.

## Now

- Prepare a production migration/deploy plan for Student Coordination System before shipping schema/API/UI changes.
- Keep the GIIS lesson video pipeline paused until Alan explicitly re-enables it after a quality reset plan.
- Produce a read-only quality reset plan for lesson videos before any new generation, build, upload, or manifest work.

## Next

- Design Phase 4 `StudentWeeklySnapshot` only after the admin-only care loop is reviewed against real advisor workflow.
- Plan Phase 5 parent reassurance with strict `parent_safe.parentSummary` exposure rules.
- Audit already-visible AP CS A and AP Psychology videos that lack `_review_A/B/C` artifacts once proper reference docs exist.
- Clean stale local `script.json.youtube` blocks so `yt_queue.py` count matches the channel-derived manifest, but do not upload.
- Continue the live customer path after lesson gate stabilization: apply/payment -> parent/student account -> first course.

## Waiting

- Alan approval before re-enabling any GIIS lesson generation, build, upload, or auto-push path.
- Human-provided `references/ap-cs-a-ced.md` and `references/ap-psychology-ced.md` before post-hoc cascade review can be honest.

## Done

- 2026-05-27: Implemented Student Coordination System Phase 0-3 locally: `StudentCareState`, append-only `StudentCareLog`, computed + manual care display, admin care-state/log APIs, care events in audit trail, and `/admin/progress` as a staff coordination console. Verification passed: Prisma db push, server tests, pathway/graduation/senior audits, build, G9-G12 lifecycle care smoke, parent API internal-note leak check. No deploy.
- 2026-05-25: Repaired Yunfan Yang's production transcript-support learning evidence before school send: added 35 graded assignment submissions across 3 G12 Spring courses, verified quiz/exam/module/credit completeness, verified student and parent login, fixed senior activity audit undercounting open/elective G12 courses, and recorded ROADMAP Slot C45. No official email was sent.
- 2026-05-25: Reconfirmed lesson pipeline pause. Scheduled GIIS lesson tasks remain disabled; launchd jobs remain disabled; local runners exit early through `tools/lesson-video/PIPELINE_PAUSED.md`.
- 2026-05-22: Added lesson manifest/course alignment audit, guarded Learn Portal video embeds against stale same-number mismatches, corrected AP CS A ArrayList pilot from Module 7 to Module 10, and strengthened AP CS A module objectives. `npm run audit:lesson-manifest`, `npm run audit:pathways`, and `npm run build` passed.
- 2026-05-22: Added Umi-led lesson production split to `AUTO_PIPELINE.md`, created the initial AP CS A ArrayList pilot handoff, and hardened daily YouTube upload to consume release-gate ready lessons only.
- 2026-05-22: Fixed production API-base fallback and login wrong-response guards for student/admin and parent portals. `npm run build` passed.
- 2026-05-21: Created the first Command Center structure for inbox, workload, decisions, handoffs, and reviews.
