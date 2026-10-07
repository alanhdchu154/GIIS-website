# Daily Video Quality Round Robin

Scheduling superseded 2026-10-04 by Alan's explicit consolidation request:
`unified-course-quality-workflow.md` is the single daily 00:00 CT orchestration
entry point. The old independent video heartbeat is paused; its inspection,
repair targets, evidence and exact replacement lifecycle below remain required.

Effective 2026-09-04, authorized by Alan: daily rotating checks and remake defective
videos. On 2026-09-11 Alan clarified that every confirmed defect must stay in a
closed repair-and-replacement lifecycle, not end at a report or sandbox render.
Existing replacement authorization remains conditional on a better, verified
replacement. This supersedes the paused/MWF quality-lane descriptions.

## Daily Run

Same Codex thread, daily 00:00 midnight America/Chicago. Inspect twenty actual
videos, then process the repair queue with a target and cap of five replacements
per night when eligible work exists. Add newly discovered defects to the queue.
Continue unfinished repairs first; do not stop after one. Complete fewer only
when eligible work is insufficient or an actual gate, quota, overlap or runtime
blocker intervenes; record the reason and save progress. Quality gates remain.
Do not restart volume
production or add new lessons. Persist progress in
`umi/video-quality-round-robin.json`; reports go under `umi/reports/video-quality/`.

Every confirmed `repair_needed` item remains open until one of these terminal
states is recorded: `replaced`, `owner_closed`, or `not_a_defect` with current
evidence. The normal lifecycle is `queued` -> `repairing` -> `evidence_ready` ->
`upload_intent` -> `uploaded_pending_readback` -> `manifest_live` ->
`website_verified` -> `replaced`.
A repaired script,
slide set, render, or successful upload alone is not completion. Resume partial
replacements before starting new ones, and never create another upload for an
identity already at `uploaded_pending_readback`.

At first run, construct the stable rotation from current public manifest entries:
prioritize courses Algebra I, English I, Biology, then other courses sorted by
name; interleave their module-ordered lists one module per course per round.
Identity is course_slug + module_number, with youtube_id as version. Keep existing
order on later runs, append new identities, retire removed entries, and mark
changed video IDs for recheck. Never let easy repeats replace unvisited items.
After a complete cycle, start the next cycle. At twenty per day, 820 entries take
41 successful inspection days; this is not a promise of full-duration review.

Before every run verify T9 target, active workers, git risks and current handoff.
Do not duplicate foundation_daily.sh, foundation_daily_orchestrator.py,
foundation_video_gate.py, make_lesson.py, yt_queue.py upload or another quality
worker. WAITING on overlap, without advancing cursor. Preserve unrelated WIP.

For each chosen video check identity against manifest/replacement history,
current source/script/reviewer binding, and actual MP4 frames from all section
midpoints plus relevant transitions. Inspect title, equations, long text, cards,
pause/answer, recap and path at full size and phone display size. Check clipping,
missing glyphs, overlap, low contrast and obsolete directions against script and
course. Record exact timestamps, evidence paths and unresolved audio/online limits.
Do not use contact sheets generated from source slides as proof of MP4 contents.
Metadata PASS is not visual PASS. A missing local cleaned MP4 is an access task,
not proof of a broken online video. Record access-blocked entries, then advance
the rotation so one inaccessible item cannot starve the rest; retry access items
separately when evidence or tooling changes.

For every replacement candidate, run the version-bound local audio review before
the independent full-release review. The receipt must show complete MP4 decode,
full-file local Whisper transcription aligned to the current `transcript.txt`,
acceptable loudness/true peak, no blocking long silence, exact candidate binding
and `PASS`. A missing/stale/HOLD receipt blocks release. This automated evidence
means Alan does not need to personally listen for routine technical coverage, but
it must never be described as human subjective listening or academic certification.

The material phase of the unified workflow follows
`docs/material-quality-round-robin.md`. Before any concurrent course mutation,
material and video workers atomically claim
`umi/.quality-locks/<course-slug>.lock` with owner metadata; defer live/uncertain
claims and choose another course. Use the shared `release.lock` for serial
main/production/manifest releases. Follow that contract's ownership/recovery
rules, never stage lock files, and invalidate approvals when source hashes change.
A material-lane reviewed website/manifest release has Alan's September 4
publication authorization; this does not waive the video replacement gates.

## Repair Queue

Seed from `umi/reports/2026-09-04-school-review/video-followup/REVIEW.md`:
Algebra I M1, English I M1, Biology M1, Algebra I M9, Biology M3,
Physical Education M2, World History M8, Business Research Methods M1,
English IV Writing & Communication M6, Digital Media & Society M11,
Abnormal Psychology M1. Resolve exact manifest identities, not guessed slugs.
The 113-row evidence-debt CSV is a separate assurance backlog, not 113 automatic
remakes. Review missing/stale evidence honestly; never rewrite SHA/pass JSON to
clear debt without reviewing current content. Queue real visual/source defects.

Create isolated replacement folders, retain originals and evidence. Repair
slides/script/audio together as needed; render a new MP4 using the bounded
existing lesson toolchain. Routine independent review defaults to a fresh,
read-only Codex CLI session using the signed-in plan. Preserve Claude/cc for a
high-value cross-model second opinion, difficult diagnosis, or continuation of
an existing Claude review context. Provider identity must come from observed
execution metadata, not prompt self-report. On quota failure record the exact
blocker, continue feasible local work, and do not substitute a fabricated review approval.
Do not incur extra paid credits/provider spend or change academic policy.
Allow the full-release reviewer its configured 1200-second timeout; complete
timeline review routinely exceeds the former 420-second limit. A timeout still
fails closed. Claude sessions may be resumed once using the observed session ID;
Codex currently restarts in a fresh isolated session so stale context cannot be
mistaken for completed evidence.

Replacement requires demonstrable before/after visual improvement, score 100,
TRUST_READY, independent/source alignment, complete replacement audio/video
review, version binding and manifest/dirty-state checks. Use
`tools/youtube-upload/replacement_lifecycle.py` for the publication half of a
replacement. Its `prepare` step creates a one-candidate approval and immutable
old/candidate identity plan under a per-identity lock. Its `upload --apply` step
rechecks `origin/main`, then authenticates the exact channel and requires the
planned old video to have the expected title and appear exactly once in the
named course playlist. It saves that remote preflight receipt before recording
an upload-intent state and starting the external side effect, and uses staged replacement
mode, which disables playlist mutation, channel sync and local cleanup. Never
use `--force-without-approval`.

Run `verify-upload` before any website change; it requires the new ID on the
authenticated channel, exact title/module identity, expected privacy,
processed status and embeddability. Then `publish-manifest --apply` acquires the
replacement release lock, starts from current `origin/main` in an isolated
temporary worktree, changes exactly the matching row in both manifest views,
runs the strict manifest audit, commits only the manifest and pushes that exact
commit. `verify-live` must read the production manifest and recheck the new
YouTube video before local canonical script state is advanced. It must also
copy only that verified course/module row into the active checkout's two
manifest views and save a local-manifest sync receipt, preserving unrelated
local manifest edits; an unexpected local video ID is a HOLD. Local manifest
sync runs before canonical script sync, canonical script sync is retry-safe when
the new ID is already present, and the lifecycle state does not advance until
both complete. `verify-website`
must then open the production `/lessons` page, select the exact
course/module card, and read back the new ID from the rendered iframe. Only then
may `retire-old --apply` acquire the release lock, re-read the production
manifest, verify the managed course playlist, insert the new video at the old
item's position with readback, and re-read the production manifest immediately
before deleting the exact recorded old video ID,
remove its exact stale playlist item, and verify old absence plus new video and
playlist presence. It must then reopen the production lesson card and verify
the new iframe again after retirement. Preserve all local
originals and evidence.

Alan's 2026-09-11 instruction authorizes this narrow replacement publication
after all gates pass; it does not authorize shipping unrelated dirty worktree
changes. `sync_channel.py --apply` now fails closed while a staged replacement
exists or when duplicate lesson titles exist. Its legacy broad duplicate-
resolution and deletion flags are disabled; replacement retirement belongs only
to the exact-ID lifecycle.

If upload, processing, manifest isolation, deploy, live readback, or old-video
retirement fails, record the exact partial stage and retry it on the next run.
Keep the old video available and referenced until the new path is verified live.
Never delete the old YouTube video first, never broad-stage the mixed worktree,
and never mark the queue item `replaced` without old/new IDs plus remote
preflight, upload, manifest, live-manifest, browser, playlist-transfer,
stale-item cleanup, post-retirement browser and retirement receipts.

Keep institutional AP/College Board/accreditation/credit/admission/outcome claims
blocked. English III M10 AP-Style Close Reading is only an allowed style label.
Do not alter automation cadence, send messages externally, or create new tasks.

## State And Reporting

Per identity record video version, checked_at, timestamps, result (sample_clear,
repair_needed, evidence_needed, access_blocked), and limitations. Per repair
record stage, source/version, outputs, blockers and next action. Mark repaired
only after final validation; mark replaced only after verified live-site readback
and old-video retirement. Keep uploaded-but-not-live items in their partial stage.
Persist each completed check so interruption does not restart the batch.

Notify Alan in short Traditional Chinese only for new actionable defects,
completed repair/replacement, changed blocker or needed decision. Otherwise
DONT_NOTIFY. Never report sampled/AI review as full human subject certification.
Update ROADMAP/Central only for meaningful changes. Preserve active workload
unless this lane becomes the active worker task.
