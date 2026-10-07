# Unified daily course quality workflow

Effective 2026-10-04, explicitly requested by Alan: materials, assignments,
quizzes, midterms/finals, slides/handouts and videos form one daily repair
workflow and one reporting surface. This replaces independent scheduling, not
the technical acceptance contracts in `material-quality-round-robin.md` and
`video-quality-round-robin.md`. If a safety gate conflicts, keep the stricter
gate and report the exact conflict; never resolve it by fabricating approval.

## One owner, one versioned work item

Owner department follows `school-operating-model.md` and its Teaching Quality
role in `school-departments.md`; read these from the canonical original repo
before each run. Preserve this workflow's existing conditional content-release
authority and shared release lock; organizational routing adds no new midnight
manual acknowledgment gate and no additional schedule.

Owner task: `01a06e31-dd7e-72f2-a350-c40e39978778` (existing content-quality task).
Default daily start: 00:00 America/Chicago after scheduler consolidation is
verified. The old independent 03:00 material and midnight video triggers must
not both remain active. Codex scheduling is required; no OS daemon/cron/launchd.

Identity is `course_slug + module_number`, bound to a source revision/hash and
the current video identity when present. Course-level exam banks also retain
their verified existing question identities, bank version and source hash.
Where no immutable question ID exists, use the updater's verified compound
identity (course + examType/module + order), checking collisions and historical
attempt bindings; the daily job must not invent IDs or migrate records. Use the existing
two durable state files and exact release receipts as underlying evidence;
produce a derived, deduplicated combined view, not a conflicting third ledger.
An enrollment, grade, payment, or diploma is never changed by this view.

## Per-run sequence

1. Read current goals, workload, this document and both detailed contracts.
   Verify time, T9, source revisions, active processes/tasks and course locks.
   Honor interactive branch releases and the shared `release.lock`. No lock
   stealing, duplicate producer, bulk new-video generation or quota purchase.
2. Recover partially released work first using its exact saved lifecycle stage.
   Never repeat an upload with uncertain intent or replay a committed database
   mutation. Reconcile receipts before retry. Source changes invalidate dependent
   media/reviewer approvals; do not invalidate real historical learner records.
3. Select source work from the saved 93-course rotation/held queues. Target
   three fully reviewed courses, up to five only with capacity and full coverage.
   Prioritize blockers in active learner/first-week G9 paths and prepared work.
   Avoid cosmetic source changes that only create another stale-video version.
4. Check/fix objectives, instruction, worked examples, required resources,
   assignments/rubrics, every relevant quiz/midterm/final and persistence/render/
   grading contracts. Obtain independent academic/source review under current
   provider policy with honest provenance. A provider auth failure holds that
   review, not all unrelated work; use a supported independent reviewer when
   permitted, never relabel the executor as another provider.
5. Freeze the accepted source revision for each module/bank. Refresh real learner,
   attempt/submission and open-exam state before assessment publication. Protect
   existing attempts and historical grades. Use reviewed allowlisted transactions,
   snapshots, zero-delta reruns and direct/proxy readback; no blanket seed/apply.
   Unpublished/AP/course-visibility decisions and academic-policy changes remain
   owner gates. Isolated safe source corrections may ship before a matching
   video only if stale video risk is explicitly assessed and the module remains
   marked partial; never call that module or course fully ready.
6. Inspect twenty actual manifest MP4 identities using the saved non-starving
   rotation; separate confirmed defects from access/evidence debt. Work from
   already-reviewed stable sources when repairing media. Target up to five
   eligible full replacements daily, not five uploads or five renders. Continue
   saved repairs first. Do not stop after one merely because one succeeded;
   record exact capacity/quality/runtime/overlap/owner blockers if fewer finish.
7. Repair original slides/script/audio together as required; retain originals.
   Verify actual MP4 visuals, complete technical audio review, full independent
   source/release review, exact hashes, score100/TRUST_READY and all existing
   gates. Sampling or decoder success alone is not full audiovisual acceptance.
8. Publish only via the existing exact-identity replacement lifecycle: remote
   old-video/channel/playlist preflight, staged upload, processed/new identity
   readback, isolated manifest release, live manifest, exact-row local sync before
   retry-safe canonical sync, actual website iframe, playlist transfer, exact old
   retirement with in-lock live recheck, and final website/playlist verification.
   Preserve partial stages; keep the old video until the replacement is verified.
9. Reconcile the learner-facing package against the frozen source: material,
   assessment, resources and all required present media must agree. Count a
   module as end-to-end accepted only with evidence for each applicable stage.
   Record legitimate no-video/not-applicable cases with academic rationale;
   never create extra formats simply to fill a checklist. Course complete means
   all required modules AND course exams accepted, not a sample or one module.
10. Save evidence after every completed module/bank/stage. Update derived counts,
    actual-throughput ETA and a short daily report in the same content task.
    Report completed end-to-end modules, separately published source banks and
    full replacements, new confirmed defects, remaining unique backlog, and
    the top blocker/owner. Notify only completed improvements, new actionable
    risk, changed blocker or required decision; unchanged state stays quiet.

## Counts and estimates

- Keep separate denominators: courses, modules, question items/banks and videos.
  Do not add overlapping queue entries from materials and videos together.
- `reviewed`, `source_published`, `media_replaced` and `end_to_end_accepted` are
  different statuses. Unreviewed, inaccessible and evidence-missing do not mean
  confirmed defective. A repaired identity reopened against a new source version
  must remain open for that new version.
- Deduplicate completion by identity/version and final receipts. Prefer measured
  trailing 7/14 calendar-day throughput (including zero days). Show a conditional
  target scenario separately; no finite guaranteed finish while inflow exceeds
  outflow or publication/academic holds lack decisions.
- First seven daily runs: measure finished packages and technical stage times,
  resolve reusable review/render bottlenecks without weaker QA, then recalculate.
  The nominal five-video cap is capacity planning, not achieved throughput.

## Explicit preserved boundaries

No extra paid usage, tuition/payment changes, credential rotation, external
messages, new student decisions, credit/GPA policy changes, migrations, reopening
closed AP/publication flags or rewriting historical attempts. Existing conditional
routine content/replacement publication authority remains, with serialized release
ownership and all original gates. Background runs preserve the current focused
workload, write their own scoped run report, and return meaningful evidence to
the GIIS coordinator. Only the coordinator integrates accepted deltas into shared
`ROADMAP.md` or `umi/workload.md`; no extra midnight human acknowledgement is
required for an otherwise authorized, fully gated conditional release.
