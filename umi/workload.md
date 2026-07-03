# Umi Workload

Last updated: 2026-07-03 15:20 CDT

This file holds one active Codex / cc worker handoff at a time. Use
`ROADMAP.md` for durable project direction and archived reports/git history for
old slot evidence.

## Active Handoff: System + Parent-Facing Optimization Backlog

- owner: Codex (repo fully handed to Codex by Alan on 2026-07-03)
- repo: `/Users/alanhdchu/giis-website`
- mode: cc-first read-only review handed to Codex for implementation
- model routing:
  - Sonnet: P2 playlist retry, P3 archival cleanup, P5 nav edit.
  - Opus: P1 parent-trust semantic redesign, P4 captions-honesty call.
- priority: medium (no live production blocker; quality/trust hardening)
- time anchor: 2026-07-03
- time-aware continuity acknowledged?: yes
- state: READY FOR CODEX

## Objective

cc ran a read-only system + parent-facing review at Alan's request. CC-quota
and T9-mount "problems" were ruled out as physical (Alan away from home, T9 not
carried), not systemic. Five real items remain, ranked. Full write-up mirrored
in the session scratchpad `system-optimization-backlog.md`.

### System

- P1 (Opus) — `tools/lesson-video/parent_trust_video_audit.py` is a keyword
  blocklist that keeps false-positiving on normal instructional wording (>=8
  manual carve-outs in the logs). Move final verdict to semantic judgment at the
  Opus review stage; keep keywords as recall only; back it with a versioned
  pass/block fixture set instead of ad-hoc patches.
- P2 (Sonnet) — YouTube playlist add "The operation was aborted" recurs every
  batch and is fixed after the fact by `reconcile-playlists --apply`. Build
  bounded retry + backoff into the upload/playlist-insert path in
  `tools/youtube-upload/yt_queue.py`; fall through to reconcile only on
  exhaustion.
- P3 (Sonnet) — ROADMAP (~1150 lines) and this workload violate the CLAUDE.md
  slim rule. Run the archival rule already written there: slot history to
  `docs/archive/`, keep ROADMAP to current lanes + brief milestones +
  future/priorities/non-goals, keep workload to the single active handoff.
  Confirm with Alan before large deletions.

### Parent-facing (do first — user-angle)

- P4 (Opus call, Sonnet edit) — `src/components/main/LessonPreview.js:216-217`
  claims lessons have "English captions ... by design", but the upload pipeline
  runs `--no-captions` and captions are permanent backlog. Visible broken
  promise on a bilingual/Chinese-parent audience. Verify current state, then
  either caption the videos (at minimum enable + QA YouTube auto-captions) OR
  soften the copy until captions exist. Do not let copy run ahead of capability.
- P5 (Sonnet, one-line) — `/pricing` is well built but has NO entry in the main
  nav (`src/components/main/Nav.js`); parents reach it only via CTAs. Add a
  Pricing link (EN + zh). Highest leverage-to-effort ratio in this list.

### Verified good (no action)

- `/lessons` public library surfaces ~500 videos by course, auto-counts from
  manifest, click-to-play, honest guardrails. Trust infra (`/trust-center`,
  `/verify`, `/diploma/:id`, `/assessment-proof`) exists and is in nav. Mobile
  funnel is responsive. Only optional check: Florida-registered proof visible
  above the fold on the homepage hero; manual phone pass of landing -> demo ->
  pricing -> apply.

## Prior Completed: Alan-Requested 10-Video Top-Up (DONE 2026-07-03 15:20 CT)

Alan's multi-batch video requests on 2026-07-03 are complete: all requested
videos through Statistics M8 were produced, gate-passed, parent-trust-approved,
and uploaded (the final 4 after a Claude Code session reset). Full slot evidence
is in the Current Evidence sections below and in `ROADMAP.md`.

## Current Evidence: 2026-07-03 15:20 CT Remaining 4 Uploaded

- Fresh preflight at 14:12 CT:
  - no active producer/upload/reviewer process
  - queue 498 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0 ready / 0 needs_revision / 0 blocked
  - manifest alignment 0 warnings
- Approved route used:
  `FOUNDATION_MAX_MODULES=4 FOUNDATION_UPLOAD_MAX=4 FOUNDATION_CC_MODEL=sonnet FOUNDATION_REVIEW_MODEL=opus bash tools/lesson-video/foundation_daily.sh`
- Completed to final release gate 100/pass, parent-trust `TRUST_READY`,
  approval artifact, and gate-ready upload:
  - Statistics M5 `tVkpZn2-znI`
  - Statistics M6 `OhfdM-Nf42I`
  - Statistics M7 `9JE5i9p91cE`
  - Statistics M8 `rc_FiHRgaIs`
- Upload summary: 4 uploaded / 0 failed / 0 still pending.
- Parent-trust note: M7/M8 initially triggered `FIX_FIRST` on academic
  `guarantee` wording. The wording was narrowed, affected TTS/MP4 outputs were
  regenerated through the orchestrator path, and parent-trust recheck passed.
- Post-checks:
  - queue 502 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0
  - `sync_channel.py --apply` wrote website-visible manifest data
  - `npm run lesson:video-dashboard` wrote dashboard with 502 lessons /
    501 MP4 / 502 uploaded / pending_upload 0
  - manifest alignment 0 warnings across 484 lessons
  - no active producer/upload process remained
  - `git diff --check` passed
- Smallest next action: no immediate action for this request. Standard captions
  remain backlog, not a blocker.

## Current Evidence: 2026-07-03 13:05 CT Retry Still Waiting On CC Reset

- The 13:00 CT producer slot refreshed current evidence:
  - no active producer/upload/reviewer process
  - queue 498 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0 ready / 0 needs_revision / 0 blocked
  - manifest alignment 0 warnings
- Bounded approved retry for the remaining requested 4:
  `FOUNDATION_MAX_MODULES=4 FOUNDATION_UPLOAD_MAX=4 FOUNDATION_CC_MODEL=sonnet FOUNDATION_REVIEW_MODEL=opus bash tools/lesson-video/foundation_daily.sh`
- The runner selected Statistics M5, but Claude Code returned a session-limit
  event immediately. No new lesson artifacts were produced, and upload found
  0 gate-ready approved pending lessons.
- This remains a Claude Code reset wait, not a YouTube upload/channel limit.
- Post-checks:
  - queue 498 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0
  - manifest alignment 0 warnings across 483 lessons
  - no active producer/upload process remained
  - `git diff --check` passed
- Smallest next action: after Claude Code session reset, refresh no-overlap and
  continue from Statistics M5 only if Alan still wants the remaining 4. Standard
  captions remain backlog, not a blocker.

## Current Evidence: 2026-07-03 12:15 CT 6 Uploads Complete / CC Reset Needed

- Fresh preflight:
  - no active producer/upload/reviewer process
  - queue 492 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0 ready / 0 needs_revision / 0 blocked
  - manifest alignment 0 warnings
- Approved route used:
  `FOUNDATION_MAX_MODULES=10 FOUNDATION_UPLOAD_MAX=10 FOUNDATION_CC_MODEL=sonnet FOUNDATION_REVIEW_MODEL=opus bash tools/lesson-video/foundation_daily.sh`
- Completed to final release gate 100/pass, parent-trust `TRUST_READY`,
  approval artifact, and gate-ready upload:
  - Research Methods in Social Science M12 `hyihDnas9tk`
  - Research Methods in Social Science M13 `Ot3v-xntV0c`
  - Statistics M1 `x6WYxDL8hbo`
  - Statistics M2 `P9qW0jDIk6s`
  - Statistics M3 `3b1AQyjF6UI`
  - Statistics M4 `tA-WtI3fUwM`
- Upload summary: 6 uploaded / 0 failed / 0 still pending.
- The batch stopped during Statistics M5 because Claude Code returned a
  session-limit event. This is the active limiter for the remaining 4 requested
  videos; it was not a YouTube upload/channel limit.
- Post-checks:
  - queue 498 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0
  - `sync_channel.py --apply` completed and wrote website-visible manifest data
  - `npm run lesson:video-dashboard` wrote dashboard with 498 lessons /
    497 MP4 / 498 uploaded / pending_upload 0
  - manifest alignment 0 warnings across 483 lessons
  - no active producer/upload process remained
  - `git diff --check` passed
- Caveat: Statistics M1 uploaded successfully, but the first playlist add
  returned `The operation was aborted`. Subsequent Statistics playlist adds
  succeeded; local video IDs and manifest data are populated.
- Smallest next action: after Claude Code session reset, refresh no-overlap and
  continue from Statistics M5 only if Alan still wants the remaining 4. Standard
  captions remain backlog, not a blocker.

## Current Evidence: 2026-07-03 10:38 CT 20 Uploads Complete

- Fresh preflight before upload:
  - no active producer/upload/reviewer process
  - queue 472 uploaded / 20 pending / 0 no-MP4
  - pending release gate 20 ready / 0 needs_revision / 0 blocked
  - manifest alignment 0 warnings
- Approved upload route used:
  `FOUNDATION_MAX_MODULES=20 FOUNDATION_UPLOAD_MAX=20 FOUNDATION_CC_MODEL=sonnet FOUNDATION_REVIEW_MODEL=opus bash tools/lesson-video/foundation_daily.sh`
- The runner reused all 20 gate-ready lessons, reran parent-trust, wrote
  `teaching-videos/_audit/release-gate/approved_ready_to_upload.json`, then
  uploaded through `yt_queue.py upload --gate-ready --max 20 --privacy unlisted`.
- Parent-trust returned `TRUST_READY` for 20/20.
- Upload summary: 20 uploaded / 0 failed / 0 still pending.
- Uploaded video IDs:
  - Government M13 `OSIsD1bvWBY`
  - Introduction to Economics M1 `RoZmooWkY18`
  - Introduction to Economics M2 `Hap0Lw9loTE`
  - Introduction to Economics M3 `M_GTpPdyOCk`
  - Introduction to Economics M4 `EtIaoaIbaVY`
  - Introduction to Economics M5 `BkAj6s8g-yQ`
  - Introduction to Economics M6 `zcqSWYbbwlI`
  - Introduction to Economics M7 `NERnJUyAvPE`
  - Introduction to Economics M8 `Q2OVyMT35V0`
  - Research Methods in Social Science M1 `4mtWYDbcCVU`
  - Research Methods in Social Science M2 `C-doIRdhfOU`
  - Research Methods in Social Science M3 `50jvBt3M6FI`
  - Research Methods in Social Science M4 `Fvv444Al4Pk`
  - Research Methods in Social Science M5 `Wy2m4iJ2xZ0`
  - Research Methods in Social Science M6 `BwhHQW683wk`
  - Research Methods in Social Science M7 `Y63A2DyP5OY`
  - Research Methods in Social Science M8 `ELLwpu7NqUg`
  - Research Methods in Social Science M9 `2EVONpFXrgU`
  - Research Methods in Social Science M10 `bvI2sacM4Ww`
  - Research Methods in Social Science M11 `Oi7GAeqLGek`
- Post-checks:
  - queue 492 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0
  - `sync_channel.py --apply` completed and wrote website-visible manifest data
  - `npm run lesson:video-dashboard` wrote dashboard with 492 lessons /
    491 MP4 / 492 uploaded / pending_upload 0
  - manifest alignment 0 warnings across 477 lessons
  - no active producer/upload process remained
  - `git diff --check` passed
- Sync caveat: `sync_channel.py` kept several fresh local video IDs because the
  uploads playlist may lag; the videos exist and local script metadata is
  populated. This is a reconciliation note, not an upload failure.
- No true YouTube upload/channel limit appeared.
- Smallest next action: wait for the next scheduled producer/top-up lane or
  Alan's next explicit request. Standard captions remain backlog, not a blocker.

## Current Evidence: 2026-07-03 09:50 CT Additional 10 Complete / No Upload

- No active producer/upload/reviewer process after completion.
- Command used for production/top-up:
  `FOUNDATION_MAX_MODULES=20 FOUNDATION_UPLOAD_MAX=0 FOUNDATION_CC_MODEL=sonnet FOUNDATION_REVIEW_MODEL=opus bash tools/lesson-video/foundation_daily.sh --no-upload --skip-existing-approved-upload`
- Existing ready lessons retained:
  - Government M13
  - Introduction to Economics M1-M8
  - Research Methods in Social Science M1
- Newly produced/rendered/Opus-reviewed to final release gate 100/pass:
  - Research Methods in Social Science M2-M11
- Queue:
  - 472 uploaded
  - 20 pending
  - 0 no-MP4
- Pending release gate:
  - 20 ready
  - 0 needs_revision
  - 0 blocked
- Parent-trust:
  - initial batch audit returned `FIX_FIRST` from false positives in survey
    wording (`almost guarantees a yes`) and qualitative methodology wording
    (`ensure trustworthiness`)
  - `tools/lesson-video/parent_trust_video_audit.py` now treats those as
    contextual research-methods uses while keeping real outcome/admissions/
    accreditation/payment claims blocked
  - rerun report
    `teaching-videos/_audit/parent-trust/2026-07-03-foundation-parent-trust-rerun.md`
    returned `TRUST_READY` for 20/20
- Approval artifacts:
  - no per-lesson `approved_ready_to_upload.json` files are present for the
    20 pending lessons because the original no-upload run exited at the
    false-positive parent-trust stop before approval/upload
  - future upload should use the approved orchestrator / `yt_queue.py upload
    --gate-ready` path after fresh preflight; do not manually bypass gates
- Manifest alignment: 0 warnings across 306 lessons.
- No YouTube upload was attempted.
- Smallest next action: if Alan wants publishing, refresh no-overlap and run
  only the approved gated upload route; otherwise wait.

## Current Evidence: 2026-07-03 00:11 CT Resume Complete

- No active producer/upload/reviewer process after completion.
- Command used for production/top-up:
  `FOUNDATION_MAX_MODULES=10 FOUNDATION_UPLOAD_MAX=0 FOUNDATION_CC_MODEL=sonnet FOUNDATION_REVIEW_MODEL=opus bash tools/lesson-video/foundation_daily.sh --no-upload --skip-existing-approved-upload`
- Newly produced/rendered/Opus-reviewed to final release gate 100/pass:
  - Introduction to Economics M6 Production & Costs
  - Introduction to Economics M7 Types of Market Structures
  - Introduction to Economics M8 Labor Markets
  - Research Methods in Social Science M1 Introduction to Social Science Research
- Existing ready lessons retained:
  - Government M13
  - Introduction to Economics M1-M5
- Queue:
  - 472 uploaded
  - 10 pending
  - 0 no-MP4
- Pending release gate:
  - 10 ready
  - 0 needs_revision
  - 0 blocked
- Parent-trust: `TRUST_READY` for 10/10.
- Approval artifact: `teaching-videos/_audit/release-gate/approved_ready_to_upload.json`
  updated with 10 ready lessons.
- Manifest alignment: 0 warnings across 306 lessons.
- `git diff --check` passed.
- Small fixes made:
  - `tools/lesson-video/audit_lessons.py` now maps `Research Methods` to the
    science theme.
  - `tools/lesson-video/parent_trust_video_audit.py` now ignores
    labor/wage/employment instructional dollar examples when no GIIS payment
    context exists.
- Media & Society M1-M8 were skipped because `open.lib.umn.edu` returned 403
  for resource checks.
- Smallest next action: if Alan wants publishing, run only the approved upload
  route through the orchestrator / `yt_queue.py upload --gate-ready`; do not
  use `upload_lesson.py --force-without-approval`.

## Current Evidence: 2026-07-02 22:49 CT T9 Restored / Still Paused

- No active producer/upload/reviewer process.
- `teaching-videos` resolves to
  `/Volumes/T9-Active/Projects/giis-website/teaching-videos`.
- Queue:
  - 472 uploaded
  - 6 pending
  - 0 no-MP4
- Pending release gate:
  - 6 ready
  - 0 needs_revision
  - 0 blocked
- Manifest alignment: 0 warnings across 306 lessons.
- Alan pause remains the active gate. No upload or producer run was started.
- Smallest next action: when Alan asks to resume, refresh no-overlap first,
  then either upload the 6 gate-ready lessons through the approved
  `yt_queue.py upload --gate-ready` path or continue bounded production from
  Introduction to Economics M6.

## Current Evidence: 2026-06-30 18:28 CT Pause / T9 Offline

- No active producer/upload/reviewer process.
- `teaching-videos` remains a symlink to
  `/Volumes/T9-Active/Projects/giis-website/teaching-videos`, but
  `/Volumes/T9-Active` is not mounted.
- Because the symlink target is unavailable:
  - `yt_queue.py status` showed 0/0/0 and is not reliable
  - `lesson_release_gate.py --pending --check` raised `FileNotFoundError`
  - do not infer that the 6 gate-ready pending lessons disappeared
- Manifest alignment still reports 0 warnings across 306 lessons, but that is
  public-manifest evidence only.
- Smallest next action: stay paused. On resume, first mount T9 and verify
  `teaching-videos` resolves, then rerun overlap/queue/gate/manifest checks
  before upload or production.

## Current Evidence: 2026-06-30 09:24 CT Pause Point

- Starting 08:00 evidence:
  - no active producer/upload overlap
  - queue 472 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0
  - manifest alignment 0 warnings
- Command:
  `FOUNDATION_MAX_MODULES=10 FOUNDATION_UPLOAD_MAX=10 FOUNDATION_CC_MODEL=sonnet FOUNDATION_REVIEW_MODEL=opus bash tools/lesson-video/foundation_daily.sh`
- Advanced to final release gate 100/pass:
  - Government M13
  - Introduction to Economics M1-M5
- Alan asked to pause before upload. Codex terminated the active
  `foundation_daily.sh`, `foundation_daily_orchestrator.py`, and
  `cc_foundation_worker.py` processes with `TERM`; follow-up process check
  found no active producer/upload/reviewer process.
- Pause-state checks:
  - queue 472 uploaded / 6 pending / 0 no-MP4
  - pending release gate 6 ready / 0 needs_revision / 0 blocked
  - manifest alignment 0 warnings across 306 lessons
  - no upload attempted from this pause action
  - M6 (`intro-economics-module-6-production-costs-v2`) only has source/brief
    files, not script/slides/MP4
- Smallest next action: stay paused. When Alan resumes, refresh overlap/queue/
  gate/manifest first, then either upload the 6 gate-ready lessons through the
  approved `yt_queue.py upload --gate-ready` path or continue bounded
  production from M6.

## Current Evidence: 2026-06-30 03:00 CT Government M3-M12 Batch

- Starting evidence:
  - no active producer/upload overlap
  - queue 462 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0
  - manifest alignment 0 warnings
- Command:
  `FOUNDATION_MAX_MODULES=10 FOUNDATION_UPLOAD_MAX=10 FOUNDATION_CC_MODEL=sonnet FOUNDATION_REVIEW_MODEL=opus bash tools/lesson-video/foundation_daily.sh`
- Result:
  - Produced, rendered, Opus-reviewed, parent-trust-approved, and uploaded
    Government M3-M12.
  - Parent-trust: `TRUST_READY` for 10/10.
  - Final release gate: 100/pass for all 10.
  - Upload summary: 10 uploaded / 0 failed / 0 still pending.
  - No true YouTube upload/channel limit appeared.
- Uploaded IDs:
  - M3 `R2Ep7iOjToM`
  - M4 `puEawAoNFhk`
  - M5 `zHqeYjxUpEo`
  - M6 `N_PY3osIXUI`
  - M7 `dERkaLqLeIg`
  - M8 `hLxMp0ril80`
  - M9 `gh8GLSlmT9k`
  - M10 `EpoJ_0E-35g`
  - M11 `eZ4xh_kJWWg`
  - M12 `772gaei863k`
- Post-checks:
  - queue 472 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0
  - manifest alignment 0 warnings across 306 lessons
  - dashboard 472 lessons / 471 MP4 / 472 uploaded / pending_upload=0
  - artifact-backed 2026-06-30 CT uploads 11
  - no active producer/upload process remained
  - `git diff --check` pass
- Dashboard caveat:
  - the 1 missing local MP4 in dashboard is an older cleaned lesson,
    `business-technology-digital-literacy-module-4-spreadsheets-basics-v2`,
    already uploaded as `g4dayk0Vga8`; this is reconciliation/dashboard
    backlog, not a current video-upload blocker.
- Smallest next action: at 08:00 CT, refresh overlap/queue/gate/manifest
  evidence and continue the next bounded producer batch only if the lane is
  clean.

## Current Evidence: 2026-06-30 01:02 CT Government M2 Unblock

- A narrow post-reset probe passed:
  `claude --print 'OK' --model opus`.
- Bounded approved command:
  `FOUNDATION_MAX_MODULES=1 FOUNDATION_UPLOAD_MAX=1 FOUNDATION_CC_MODEL=sonnet FOUNDATION_REVIEW_MODEL=opus bash tools/lesson-video/foundation_daily.sh`
- Result:
  - selected carried-over Government M2
  - reused current MP4/transcript
  - completed missing independent/source-alignment review
  - final release gate: 100/pass
  - parent-trust: `TRUST_READY`
  - gated upload: Government M2 `60ovTqVC0Q0`
- Post-checks:
  - queue 462 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0
  - manifest alignment 0 warnings across 306 lessons
  - dashboard: 462 lessons / 461 MP4 / 462 uploaded / pending_upload=0
  - artifact-backed 2026-06-30 CT upload count: 1
- Smallest next action: at 03:00 CT, run fresh preflight and continue the
  remaining requested videos with the normal bounded producer command.

## Current Evidence: 2026-06-29 22:23 CT Alan-Requested Continuation

- Starting evidence:
  - no active producer/upload overlap
  - queue 457 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0
  - manifest alignment 0 warnings
- Command:
  `FOUNDATION_MAX_MODULES=10 FOUNDATION_UPLOAD_MAX=10 FOUNDATION_CC_MODEL=sonnet FOUNDATION_REVIEW_MODEL=opus bash tools/lesson-video/foundation_daily.sh`
- Completed and uploaded:
  - Fitness Leadership M6: `NhFli2eoL4M`
  - Fitness Leadership M7: `yIe673oT2Nc`
  - Fitness Leadership M8: `Dw-hcwHkh-I`
  - Government M1: `6pjagcVJvi4`
- Partial artifact:
  - Government M2 has MP4/transcript and script artifacts, but no
    `_review_independent_pass.json` or `_review_source_alignment.json` because
    Claude Code hit a session limit during Opus review.
  - `lesson_release_gate.py --pending --check` reports Government M2
    `needs_revision` only for missing independent second-pass review.
- Upload/gate result:
  - parent-trust ran for the 4 fully ready lessons and returned `TRUST_READY`
  - gated upload summary: 4 uploaded / 0 failed / 0 still pending
  - no true YouTube upload/channel limit appeared
  - playlist reconcile repaired Government M1 playlist membership
- End checks:
  - queue 461 uploaded / 1 pending / 0 no-MP4
  - dashboard: 462 lessons / 461 uploaded / pending_upload=0
  - manifest alignment: 0 warnings across 306 lessons
  - artifact-backed 2026-06-29 CT upload count: 22/40
- Cleared at 2026-06-30 01:02 CT by the Government M2 unblock above.

## Current Evidence: 2026-06-29 20:00 CT Dashboard / Top-Up Lane

- Starting evidence:
  - no active producer/upload overlap
  - queue 447 uploaded / 3 pending / 0 no-MP4
  - pending release gate 3 ready / 0 blocked
  - manifest alignment 0 warnings
  - artifact-backed 2026-06-29 CT upload count 8/40
- Top-up command:
  `FOUNDATION_MAX_MODULES=10 FOUNDATION_UPLOAD_MAX=10 FOUNDATION_CC_MODEL=sonnet FOUNDATION_REVIEW_MODEL=opus bash tools/lesson-video/foundation_daily.sh`
- Result:
  - uploaded the 3 pending Experimental Psychology lessons
  - produced/reviewed/gate-approved/uploaded Fitness Leadership M1-M5
  - all 10 selected lessons passed final release gate at score 100/pass
  - parent-trust audit returned `TRUST_READY`
  - upload summary: 10 uploaded / 0 failed / 0 still pending
- Uploaded video IDs:
  - Experimental Psychology M4-M8:
    `0yJaz4OFfco`, `QJ57pAkVpHA`, `_x65vw_soPI`, `vWNDZ8BMojE`,
    `2x_TbfCwhMY`
  - Fitness Leadership M1-M5:
    `VKwxvNGtdeQ`, `LgFsBxoVnZs`, `bsvenrPRPYM`, `jBVpjTN4i5E`,
    `3AsnLNI8gn0`
- Playlist reconciliation:
  - repaired Experimental Psychology M1 (`oyr-iYUUmFA`)
  - repaired Fitness Leadership M1 (`VKwxvNGtdeQ`)
  - no `quotaExceeded` observed
- End checks:
  - queue 457 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0
  - manifest alignment 0 warnings across 306 manifest lessons
  - dashboard refreshed: 457 lessons, 457 uploaded, pending_upload=0
  - artifact-backed 2026-06-29 CT upload count 18/40
  - no active producer/upload process remained
- Smallest next action: wait for the next scheduled producer slot; do not run a
  second 20:00 top-up for 2026-06-29.

## Current Evidence: 2026-06-29 18:04 CT Manual Continuation

- Command:
  `FOUNDATION_MAX_MODULES=10 FOUNDATION_UPLOAD_MAX=10 FOUNDATION_CC_MODEL=sonnet FOUNDATION_REVIEW_MODEL=opus bash tools/lesson-video/foundation_daily.sh`
- Produced and gate-approved:
  - Ethics & Critical Thinking M4, M6, M7, M8
  - Experimental Psychology M1-M6
- M8 parent-trust repair:
  - strict parent-trust gate flagged "quality guarantee" as an
    `outcome_guarantee` keyword in a teaching misconception section
  - wording changed to "quality shortcut"
  - M8 re-rendered, Opus independent/source-alignment review reran, and release
    gate returned 100/pass
  - 10-lesson parent-trust rerun returned `TRUST_READY`
- Gated upload result:
  - 7 uploaded unlisted:
    `HwtHiMRCb8A`, `dw7LvGUaNdo`, `eVty8G3XJ3M`, `Bt4tg0aigAs`,
    `oyr-iYUUmFA`, `V-NegkLwSMw`, `EeEbixtHj0s`
  - local quota estimate reduced requested max 10 to 7
  - no true YouTube upload/channel limit observed
  - captions/thumbnails/sync/cleanup intentionally skipped for video-first run
- Post-run checks:
  - queue 447 uploaded / 3 pending / 0 no-MP4
  - pending release gate 3 ready / 0 blocked
  - manifest alignment 0 warnings
  - dashboard refreshed: 450 lessons, 447 uploaded, pending_upload=3
  - artifact-backed 2026-06-29 CT upload count: 8
- Playlist note: Experimental Psychology playlist was created. M1 upload
  succeeded (`oyr-iYUUmFA`) but playlist add returned `The operation was
  aborted`; M2/M3 playlist adds succeeded. Reconcile playlists after quota
  reset or when quota clearly permits.
- Smallest next action: after quota reset, run a bounded gate-ready upload for
  the 3 pending Experimental Psychology lessons, then run playlist reconcile.

## Current Evidence: 2026-06-29 15:20 CT Manual Unblock

- Doctor / auth:
  - `claude auth status`: logged in through first-party `claude.ai`, Max plan.
  - `claude --print 'OK'`: PASS.
  - `claude --print 'OK' --model opus`: PASS.
  - Initial `claude --print 'OK' --model sonnet`: API 401 in this shell.
  - After Alan reauthentication at 15:40 CT:
    `claude --print 'OK' --model sonnet`: PASS.
- Preflight:
  - queue 439 uploaded / 0 pending / 0 no-MP4
  - pending release gate 0
  - `git diff --check` pass
- Command:
  `FOUNDATION_MAX_MODULES=1 FOUNDATION_UPLOAD_MAX=1 FOUNDATION_CC_MODEL=opus FOUNDATION_REVIEW_MODEL=opus bash tools/lesson-video/foundation_daily.sh`
- Result:
  - Produced `ethics-critical-thinking-module-5-moral-relativism-vs-universalism-v2`.
  - Worker cost about `$4.11`; independent review cost about `$1.32`.
  - Final gate score 100 / pass.
  - Parent-trust audit `TRUST_READY`.
  - Uploaded unlisted to YouTube: `https://youtu.be/O2i5mu5xbrw`
    (`VIDEO_ID=O2i5mu5xbrw`).
  - Post-run queue: 440 uploaded / 0 pending / 0 no-MP4.
- Smallest next action: next scheduled producer can run a bounded normal slot
  with `FOUNDATION_CC_MODEL=sonnet` and `FOUNDATION_REVIEW_MODEL=opus`.

## Current Evidence: 2026-06-29 03:00 CT Producer Slot

- Preflight:
  - no active producer/upload overlap
  - queue: 439 uploaded, 0 pending, 0 no-MP4
  - pending release gate: 0 lessons
  - manifest alignment: 0 warnings
  - artifact-backed 2026-06-29 CT upload count: 0
- Narrow unblock / diagnosis attempt:
  - command: `claude --print 'OK' --model sonnet`
  - result: `Failed to authenticate. API Error: 401 Invalid authentication credentials`
- End state:
  - Queue: 439 uploaded, 0 pending, 0 no-MP4.
  - Pending release gate: 0 lessons.
  - Manifest alignment: 0 warnings.
- No full producer run was started, so no production artifacts were approved
  and no upload was attempted.
- Smallest next action: restore Claude Code auth outside heartbeat secret
  context, then retry the normal producer path at the next scheduled slot.

## Prior Evidence: 2026-06-28 20:00 CT Dashboard / Top-Up Lane

- Preflight:
  - no active producer/upload overlap
  - queue: 439 uploaded, 0 pending, 0 no-MP4
  - pending release gate: 0 lessons
  - manifest alignment: 0 warnings
  - artifact-backed 2026-06-28 CT upload count: 0/40
- Top-up decision:
  - gap to 40-video trial target: 40
  - full top-up was not launched because the auth gate was still current
  - narrow auth probe command: `claude --print 'OK' --model sonnet`
  - probe result: `Failed to authenticate. API Error: 401 Invalid authentication credentials`
- End state:
  - Queue: 439 uploaded, 0 pending, 0 no-MP4.
  - Pending release gate: 0 lessons.
  - Manifest alignment: 0 warnings.
  - Playlist reconciliation: no missing items.
  - Dashboard refreshed with 439 lessons, 439 uploaded, pending_upload=0.
- Result: this was a Claude Code identity/auth gate, not a YouTube quota/channel
  limit, content gate, playlist blocker, or manifest sync blocker.
- Smallest next action: restore Claude Code auth outside heartbeat secret
  context, then retry the normal producer path at the next scheduled slot.

## Prior Evidence: 2026-06-28 08:00 CT Producer Slot

- Preflight:
  - no active producer/upload overlap
  - queue: 439 uploaded, 0 pending, 0 no-MP4
  - pending release gate: 0 lessons
  - manifest alignment: 0 warnings
  - artifact-backed 2026-06-28 CT upload count: 0
- Narrow unblock / diagnosis attempt:
  - command: `claude --print 'OK' --model sonnet`
  - result: `Failed to authenticate. API Error: 401 Invalid authentication credentials`
- No full producer run was started, so no production artifacts were approved
  and no upload was attempted.
- Smallest next action: restore Claude Code auth outside heartbeat secret
  context, then retry the normal producer path at the next scheduled slot.

## Prior Evidence: 2026-06-28 03:00 CT Producer Slot

- Preflight:
  - no active producer/upload overlap
  - queue: 439 uploaded, 0 pending, 0 no-MP4
  - pending release gate: 0 lessons
  - manifest alignment: 0 warnings
  - artifact-backed 2026-06-28 CT upload count: 0
  - `git diff --check` and repo-root stray artifact check clean
- Selected candidates:
  - Ethics & Critical Thinking M4-M8
  - Experimental Psychology M1-M5
- Course-design:
  - Experimental Psychology course-design gate wrote a passing audit.
- Blocker:
  - class: `identity_gate` / `authentication_failed`
  - API status: 401
  - log evidence: `apiKeySource=none`
  - saw_tool_progress: false
  - no production artifacts were approved
- Upload lane:
  - `yt_queue.py upload --gate-ready` found 0 pending lessons with approval.
  - no upload was attempted.
- End state:
  - Queue: 439 uploaded, 0 pending, 0 no-MP4.
  - Pending release gate: 0 lessons.
  - Artifact-backed 2026-06-28 CT upload count remains 0.
- Safe unblock attempt already made: the normal bounded producer path retried
  all 10 selected candidates after fresh preflight; every Claude Code call
  stopped at the same auth layer before tool progress.
- Smallest next action: restore Claude Code auth outside heartbeat secret
  context, then retry the normal producer path at the next scheduled slot.

## Prior Evidence: 2026-06-27 20:00 CT Dashboard / Top-Up Lane

- Preflight:
  - no active producer/upload overlap
  - queue: 439 uploaded, 0 pending, 0 no-MP4
  - pending release gate: 0 lessons
  - manifest alignment: 0 warnings
  - artifact-backed 2026-06-27 CT upload count: 10/40
- Top-up decision:
  - gap to 40-video trial target: 30
  - ran one bounded top-up with `FOUNDATION_MAX_MODULES=10` and
    `FOUNDATION_UPLOAD_MAX=10`
  - selected candidate:
    `ethics-critical-thinking-module-4-virtue-ethics-aristotle-v2`
- Blocker:
  - class: `WAITING` / `cc_rate_limited`
  - returncode: 75
  - saw_tool_progress: false
  - no production artifacts were approved
  - no upload was attempted
- End state:
  - Queue: 439 uploaded, 0 pending, 0 no-MP4.
  - Pending release gate: 0 lessons.
  - Manifest alignment: 0 warnings.
  - Playlist reconciliation: no missing items.
  - Dashboard refreshed with 439 lessons, 439 uploaded, pending_upload=0.
  - `git diff --check` and repo-root stray artifact check passed.
- Result: this was a Claude Code provider/session-capacity blocker, not a
  YouTube quota/channel limit, content gate, playlist blocker, or manifest
  sync blocker.
- Smallest next action: at 03:00 CT, refresh preflight and retry the normal
  bounded producer path if Claude Code capacity has reset. If Alan wants the
  40/day target met despite repeated CC limits, get explicit approval for a
  formal non-CC fallback scope before generating lesson artifacts outside the
  standing pipeline.

## Prior Evidence: 2026-06-27 18:00 CT Producer Slot

- Preflight:
  - no active producer/upload overlap
  - queue: 439 uploaded, 0 pending, 0 no-MP4
  - pending release gate: 0 lessons
  - manifest alignment: 0 warnings
  - repo-root stray artifact check clean
- Selected candidate:
  `ethics-critical-thinking-module-4-virtue-ethics-aristotle-v2`.
- Blocker:
  - class: `WAITING` / `cc_rate_limited`
  - returncode: 75
  - saw_tool_progress: false
  - no production artifacts were approved
- Upload lane:
  - `yt_queue.py upload --gate-ready` found 0 pending lessons with approval.
  - no upload was attempted.
- End state:
  - Queue: 439 uploaded, 0 pending, 0 no-MP4.
  - Pending release gate: 0 lessons.
  - Manifest alignment: 0 warnings.
  - Artifact-backed 2026-06-27 CT upload count remains 10.
- Safe unblock attempts already made:
  - 13:00 retried the normal bounded producer path after 08:00 rate-limit.
  - 18:00 retried again after fresh preflight; same provider/session blocker
    returned before tool progress.
- Smallest next action: at 20:00 CT, run the dashboard/count/top-up workflow.
  If top-up still hits `cc_rate_limited`, stop with a clear shortfall and do
  not manually synthesize lesson artifacts without Alan-approved fallback scope.

## Prior Evidence: 2026-06-27 13:00 CT Producer Slot

- Preflight:
  - no active producer/upload overlap
  - queue: 439 uploaded, 0 pending, 0 no-MP4
  - pending release gate: 0 lessons
  - manifest alignment: 0 warnings
- Selected candidate:
  `ethics-critical-thinking-module-4-virtue-ethics-aristotle-v2`.
- Blocker:
  - class: `WAITING` / `cc_rate_limited`
  - returncode: 75
  - saw_tool_progress: false
  - no production artifacts were approved
- Upload lane:
  - `yt_queue.py upload --gate-ready` found 0 pending lessons with approval.
  - no upload was attempted.
- End state:
  - Queue: 439 uploaded, 0 pending, 0 no-MP4.
  - Pending release gate: 0 lessons.
  - Manifest alignment: 0 warnings.
  - Artifact-backed 2026-06-27 CT upload count remains 10.
- Safe unblock attempt already made: retried the normal bounded producer path
  after the 08:00 rate-limit state; it returned the same provider/session
  blocker before tool progress.
- Smallest next action: at the next producer slot, refresh overlap/queue/gate
  first, then retry the normal producer path if Claude Code capacity has reset.

## Prior Evidence: 2026-06-27 08:00 CT Producer Slot

- Preflight:
  - no active producer/upload overlap
  - queue: 439 uploaded, 0 pending, 0 no-MP4
  - pending release gate: 0 lessons
  - manifest alignment: 0 warnings
- Selected candidate:
  `ethics-critical-thinking-module-4-virtue-ethics-aristotle-v2`.
- Course-design gate:
  - Ethics & Critical Thinking passed.
  - repair changed: false.
- Blocker:
  - class: `WAITING` / `cc_rate_limited`
  - returncode: 75
  - saw_tool_progress: false
  - no production artifacts were approved
- Upload lane:
  - `yt_queue.py upload --gate-ready` found 0 pending lessons with approval.
  - no upload was attempted.
- End state:
  - Queue: 439 uploaded, 0 pending, 0 no-MP4.
  - Pending release gate: 0 lessons.
  - Manifest alignment: 0 warnings.
  - Artifact-backed 2026-06-27 CT upload count remains 10.
- Smallest next action: at the next producer slot, refresh overlap/queue/gate
  first, then retry the normal producer path; Ethics M4 should remain the next
  deterministic candidate unless the repo selector changes.

## Prior Evidence: 2026-06-27 03:00 CT Producer Slot

- Preflight showed no active producer/upload overlap.
- Initial queue/gate:
  - 429 uploaded
  - 10 pending
  - 0 no-MP4
  - pending release gate: 10 ready, 0 blocked
- The slot produced/repaired Ethics & Critical Thinking M2/M3 as needed, then
  uploaded 10 lessons through `yt_queue.py upload --gate-ready`:
  - English III Literature M7 `-3CrKq2WCRM`
  - English III Literature M8 `tS4lQscPad8`
  - English III Literature M9 `nbtFxYakYB0`
  - English III Literature M10 `vNjdCW4Msy0`
  - English III Literature M11 `1o-dy7ACnyE`
  - English III Literature M12 `pCRCn5I2qm0`
  - English III Literature M13 `MbdS3_vTxLI`
  - Ethics & Critical Thinking M1 `iVllR0iopqk`
  - Ethics & Critical Thinking M2 `yelBWqT1Pig`
  - Ethics & Critical Thinking M3 `HUg6nhN-Hwk`
- Parent-trust initially returned `FIX_FIRST` because the scanner treated the
  literary phrase `charged admission` in English III Literature M9 as a school
  admissions claim. `tools/lesson-video/parent_trust_video_audit.py` was
  repaired narrowly for literary/story admission-charge contexts while keeping
  true GIIS/college/applicant/F-1/I-20/Common App/transfer-credit/admissions
  gates active. The same 10-lesson audit then returned `TRUST_READY`.
- Playlist hygiene:
  - English III Literature M7-M13 were added during upload.
  - Ethics & Critical Thinking playlist was created. M1's first add aborted;
    `npm run yt:reconcile-playlists -- --apply` added `iVllR0iopqk`, and Ethics
    is now 3/3 in its playlist.
- End state:
  - Queue: 439 uploaded, 0 pending, 0 no-MP4.
  - Pending release gate: 0 lessons.
  - Manifest alignment: 0 warnings across 306 manifest lessons.
  - Dashboard: 439 lessons, 439 uploaded, pending_upload=0.
  - Artifact-backed 2026-06-27 CT upload count: 10.
  - `git diff --check` and repo-root stray artifact check passed.
- Smallest next action: at 08:00 CT, run the normal producer preflight and let
  the pipeline select the next deterministic Grade 11 foundation modules.

## Superseded Evidence: 2026-06-26 22:23-22:30 CT Watch

- The 20:00 CT top-up process exited with 429 uploaded, 8 pending, 1 no-MP4,
  and 8 pending lessons gate-ready. The restored 2026-06-27 03:00 CT slot
  refreshed this evidence and completed the pending upload batch.

## Objective Before This Watch

Complete Alan-approved English III continuation after clarifying that
`AP-Style Close Reading` is a style label, not a true AP/College Board course or
authorization claim. Keep the true AP, College Board, accreditation,
college-credit, admissions, and outcome-claim gates active.

## Current Evidence: 2026-06-26 18:20-18:50 CT Continuation

- Alan explicitly approved bypassing the AP gate for this exact `AP-Style`
  label because it describes reading/writing style, not an AP course claim.
- Completed the 10-upload continuation:
  - English III M10 `5prCSq5k9g0`
  - English III M11 `Hjjf3fVqTVA`
  - English III M12 `NmmwwLyC7X0`
  - English III M13 `OOzM_77bGgc`
  - English III Literature M1 `K9LWiEbtH4I`
  - English III Literature M2 `oTZa77k5mAo`
  - English III Literature M3 `uoC1ZHCACig`
  - English III Literature M4 `f4QC5Q0jdyY`
  - English III Literature M5 `Pw3X1zV-U74`
  - English III Literature M6 `f-Rpng5bumY`
- M13 recovery:
  - The independent reviewer wrapper failed while writing final files.
  - Local review evidence was sufficient to write
    `_review_independent_pass.json` and `_review_source_alignment.json`.
  - `lesson_release_gate.py ... --check` then returned ready 1/1.
  - Upload succeeded through `yt_queue.py upload --gate-ready`.
- Playlist hygiene:
  - English III M10-M13 are in the English III playlist.
  - English III Literature M1 was added by playlist reconciliation after an
    initial per-upload add abort; M2-M6 were added during upload.
- End state:
  - Queue: 429 uploaded, 0 pending, 0 no-MP4.
  - Pending release gate: 0 lessons.
  - Manifest alignment: 0 warnings.
  - Dashboard: 429 lessons, 429 uploaded, pending_upload=0.
  - Artifact-backed 2026-06-26 CT upload count: 34.
  - `git diff --check` passed.
  - Repo-root `slides/` and `style_manifest.json` were confirmed as temporary
    M13 generated output and removed.
- Smallest next action: wait for the 20:00 dashboard/count/top-up workflow; if
  it runs, gap to the 40-trial target is currently 6.

## Superseded Evidence: 2026-06-26 16:20 CT Watch

- Central Umi found a new overlap/safety regression after the 13:00 safety
  repair: a local `foundation_daily_orchestrator.py` run recreated and rendered
  `english-iii-module-10-ap-style-close-reading-v2`.
- Central stopped the local producer/reviewer processes before any upload
  process was visible.
- Queue check after stop:
  - 419 uploaded
  - 1 pending
  - 0 no-MP4
- Pending release gate check:
  - evaluated 1
  - ready 0
  - needs_revision 1
  - first needs_revision:
    `english-iii-module-10-ap-style-close-reading-v2`: audit verdict is
    `pass_with_minor_notes`, quality score 88 < required 100, missing
    independent second-pass reviewer.
- Treat that pending M10 package as dirty/gated and AP-adjacent. It is not
  upload-ready.
- Superseded at 18:50 CT: Alan clarified this exact `AP-Style` label is a style
  label, not a true AP course or College Board claim.

## Superseded Evidence: 2026-06-26 13:00 CT Producer Slot

- Completed and uploaded through `yt_queue.py upload --gate-ready`:
  - English III M5 `1GRJIaL8wLE`
  - English III M6 `3CLXxpUb3Ag`
  - English III M7 `MZm_j8cZMZY`
  - English III M8 `RkfQ9L3hA_s`
  - English III M9 `KDNAbcAU3tk`
- All five uploads were added to the existing English III playlist.
- Safety repair:
  - The selector attempted English III M10 as `AP-Style Close Reading`.
  - The producer was stopped before that AP-adjacent module produced/uploaded a
    lesson.
  - `server/prisma/courses/english/english-iii.json` now uses non-AP
    `Advanced Close Reading` wording for the title, objectives, assignment, and
    assessment items.
  - Partial `english-iii-module-10-ap-style-close-reading-v2` generated source
    artifacts and repo-root stray artifacts were removed.
- End state:
  - Queue: 419 uploaded, 0 pending, 0 no-MP4.
  - English III is 9/9 uploaded.
  - Pending release gate: 0 lessons.
  - Manifest alignment: 0 warnings.
  - Dashboard: 419 lessons, 419 uploaded, pending_upload=0.
  - Artifact-backed 2026-06-26 CT upload count: 24.
  - `python3 -m json.tool server/prisma/courses/english/english-iii.json`,
    `git diff --check`, repo-root stray artifact check, and `npm run build`
    passed.

## Prior Evidence

### 2026-06-26 08:00 CT Producer Slot

- Completed and uploaded through `yt_queue.py upload --gate-ready`:
  - Economics M8 `m2HJYNKRICA`
  - Economics M9 `Qbhb1MQKN_8`
  - Economics M10 `DRCteQoRutc`
  - Economics M11 `-sAXajzusT4`
  - Economics M12 `xL03qFk7kqM`
  - Economics M13 `Cgrkku53e2E`
  - English III M1 `ET17EJ8Xnn8`
  - English III M2 `Wr0pc9aEhzs`
  - English III M3 `yBoILw-Er9g`
  - English III M4 `L4DQUEDqTbI`
- English III course design passed before the first English III module was
  produced.
- Parent-trust returned `TRUST_READY` for the 10 approved lessons.
- Playlist hygiene:
  - Economics M8-M13 were added during upload.
  - English III playlist `PLNBWbNttWUEo` was created, and M1-M4 were added
    during upload.
- Quality notes:
  - English III M1 briefly wrote slides to the repo root from a wrong-cwd build;
    the worker corrected the target, and the repo-root stray artifact check is
    clean.
  - Economics independent review logged a non-blocking source-packet advisory:
    Economics packets can inherit a business-family Expert Lens label, but the
    produced lessons re-anchor the lens correctly to Economics content.
- End state:
  - Queue: 414 uploaded, 0 pending, 0 no-MP4.
  - Pending release gate: 0 lessons.
  - Manifest alignment: 0 warnings.
  - Dashboard: 414 lessons, 414 uploaded, pending_upload=0.
  - Artifact-backed 2026-06-26 CT upload count: 19.
  - `git diff --check`, process overlap, and repo-root stray artifact checks
    passed.

### 2026-06-26 03:00 CT Producer Slot

- Completed and uploaded through `yt_queue.py upload --gate-ready`:
  - Digital Marketing M7 `CzwWNZfMI6g`
  - Digital Marketing M8 `JnsTDqsz_KQ`
  - Economics M1 `Bv5Jc0-rpnc`
  - Economics M2 `yQQCkupnfEs`
  - Economics M3 `KXoWqlQ45dc`
  - Economics M4 `NQZXnY_uISw`
  - Economics M5 `5G7zXnnY_Vo`
  - Economics M6 `cc2M2Rm536M`
  - Economics M7 `UBDa1b9zZoc`
- Economics M7 was stopped before upload after a path-slide sequence label was
  caught. The slide now says `Module 8 — Money, Banking & the Federal Reserve`;
  slides and MP4 were rebuilt, and final gate returned score 100.
- Parent-trust returned `TRUST_READY` for the 9 approved lessons.
- Playlist hygiene:
  - Digital Marketing M7/M8 were added during upload.
  - Economics M1 playlist add initially aborted, then
    `npm run yt:reconcile-playlists -- --apply` added it.
  - Economics is now 7/7 in its playlist.
- End state:
  - Queue: 404 uploaded, 0 pending, 0 no-MP4.
  - Pending release gate: 0 lessons.
  - Manifest alignment: 0 warnings.
  - Dashboard: 404 lessons, 404 uploaded, pending_upload=0.
  - Artifact-backed 2026-06-26 CT upload count: 9.
  - `git diff --check`, Python compile, and repo-root stray artifact checks
    passed.

### 2026-06-25 20:00 CT Dashboard / Top-Up Slot

- The top-up repaired Digital Marketing required resources, uploaded M4
  `dA1zyIA7O7Y` and M6 `_yn8psakiLE`, and stopped on Claude Code session limit
  during M7 independent review.
- End state was 395 uploaded, 1 pending, 0 no-MP4, with M7 missing independent
  review and 34 artifact-backed uploads for 2026-06-25 CT.

### 2026-06-25 18:00 CT Producer Slot

- Grade 10 had no selectable candidates, so the runner auto-advanced into
  Grade 11.
- Cognitive Psychology M3-M8 rendered, passed Opus independent/source-alignment
  review, passed release gate at score 100, returned `TRUST_READY`, and
  uploaded:
  - M3 `19hznfZSS9I`
  - M4 `2PUxF5owUGs`
  - M5 `bky-uNLnWlo`
  - M6 `HmB4Ux9Zyno`
  - M7 `q-2uXbOOOyk`
  - M8 `KQvLAwQn1zA`
- Digital Marketing course design passed. M1-M3 and M5 rendered, passed gates,
  and uploaded:
  - M1 `Mm5KYPl9pOo`
  - M2 `7J7eJ2Dc2jQ`
  - M3 `YOqGtWwLD_s`
  - M5 `n2Er2UcCc90`
- Digital Marketing M4 was skipped by resource gate:
  `videoUrl fetch check failed: open.lib.umn.edu (403)`.
- Playlist hygiene:
  - Cognitive Psychology per-upload playlist adds succeeded.
  - Digital Marketing playlist `PLBPkfMiWLDdA` was created and M1/M2/M3/M5 were
    added.
  - `npm run yt:reconcile-playlists -- --apply` found 0 missing playlist items.
- Queue status after the slot: 393 uploaded, 0 pending, 0 no-MP4.
- Artifact-backed 2026-06-25 CT upload count is 32; the 20:00 CT top-up did
  not start separately because the 18:00 producer run overlapped the gate.
  Remaining gap to the 40-trial target: 8.
- Post-slot checks passed:
  - `python3 tools/lesson-video/lesson_release_gate.py --pending --check`
  - `node tools/youtube-upload/audit_manifest_alignment.js`
  - `npm run lesson:video-dashboard`
  - `python3 -m py_compile ...`
  - `git diff --check`
  - repo-root stray artifact check after removing generated wrong-cwd
    `slides/` and `style_manifest.json`

- 2026-06-25 13:00 CT producer selected Business Writing M1-M8 and Cognitive
  Psychology M1-M2.
- Business Writing M1-M8 rendered, passed Opus independent/source-alignment
  review, passed release gate at score 100, and uploaded:
  - M1 `-koNnwZVyGo`
  - M2 `HCO6nQjyMos`
  - M3 `FqyTjKOx1xs`
  - M4 `sWAdxvG4kdo`
  - M5 `4cmoXjkLNts`
  - M6 `lurfXgsDBCc`
  - M7 `YMxt5beD-Bc`
  - M8 `pTFwahJz7DA`
- Cognitive Psychology course design passed. M1-M2 rendered, passed gates, and
  uploaded:
  - M1 `35_isF265ZA`
  - M2 `rfjFaFSmWmw`
- Parent-trust false-positive repair:
  - Business Writing M3's memo/equipment budget example initially triggered
    `payment_claim`.
  - `parent_trust_video_audit.py` now treats benign memo/proposal/equipment
    business-writing examples as business context while keeping GIIS payment,
    tuition, Stripe, enrollment, pricing, accreditation, AP, and outcome claims
    strict.
  - Rerun returned `TRUST_READY` for all 10 lessons.
- Playlist hygiene:
  - Per-upload playlist add initially aborted for Business Writing M1 and
    Cognitive Psychology M1.
  - `npm run yt:reconcile-playlists -- --apply` added both missing playlist
    items.
- Queue status after the slot: 383 uploaded, 0 pending, 0 no-MP4.
- Artifact-backed 2026-06-25 CT upload count was 22.

- 2026-06-25 08:00 CT producer selected Business Research Methods M12-M13
  plus Business Writing M1-M8.
- Business Research Methods M12-M13 passed gates and uploaded through
  `yt_queue.py upload --gate-ready`:
  - M12 `EjSvc0VqEEg`
  - M13 `OqAcsYpjMnA`
- Business Research Methods is now 13/13 uploaded.
- Business Writing M1-M8 were blocked during the batch by
  `pre_render_gate_failed`: `Style theme mismatch: expected default, got
  literature`.
- The theme-prefix repair now lets Business Writing M1 reach the expected
  pre-render state: score 68 / `needs_review`, only major issue `No MP4 found.`
  Pending work remains TTS/MP4 plus independent/source-alignment reviews.
- Queue status after the slot: 373 uploaded, 0 pending, 8 no-MP4.
- Artifact-backed 2026-06-25 CT upload count is 12.
- Post-slot checks passed:
  - `python3 tools/lesson-video/lesson_release_gate.py --pending --check`
  - `node tools/youtube-upload/audit_manifest_alignment.js`
  - `npm run lesson:video-dashboard`
  - `python3 -m py_compile ...`
  - `git diff --check`

- Academic Writing M7-M8 uploaded at 03:00 CT:
  - M7 `qI-Zm9CWrYI`
  - M8 `ELX3loeOYjA`
- Academic Writing is now 8/8 uploaded.
- Business Ethics source labels were repaired from stale MIT OCW labels to
  OpenStax Business Ethics labels.
- 2026-06-24 08:00 CT slot uploaded 9 more lessons:
  - Business Ethics M1-M8 are now 8/8 uploaded.
  - Business Research Methods M2 uploaded.
- Today's artifact-backed CT count is 11.
- The 18:00 CT producer slot advanced Business Research Methods M1 and M3-M11:
  - `lesson_release_gate.py --pending --check` reports 10 ready.
  - Queue status reports 361 uploaded, 10 pending, 0 no-MP4.
  - M9, M10, and M11 reached final gate score 100 during the slot.
- Upload stopped before approval artifacts because parent-trust returned
  `FIX_FIRST`:
  - M1 and M7: `payment_claim` flags around checkout/user-frustration examples.
  - M5: `payment_claim` flags around checkout survey wording.
  - M4: `outcome_guarantee` flags around "ensure internal validity" /
    "ensure reliability" research-methods wording.
- Post-slot checks passed:
  - `node tools/youtube-upload/audit_manifest_alignment.js`
  - `npm run lesson:video-dashboard`
  - `git diff --check`
- The 20:00 CT dashboard/count slot confirmed the same state:
  - Artifact-backed 2026-06-24 CT upload count: 11/40.
  - Real gap: 29, but parent-trust `FIX_FIRST` still blocks approval/upload.
  - Top-up producer was intentionally not rerun under the no-spin rule because
    it would encounter the same parent-trust approval blocker.
  - Playlist reconciliation found 0 missing items and used 0 estimated quota
    units.
- 2026-06-25 03:00 CT repaired parent-trust false positives in
  `parent_trust_video_audit.py` for benign Business Research Methods checkout
  examples and research-methods internal-validity/reliability wording.
- Parent-trust recheck returned `TRUST_READY` for Business Research Methods M1
  and M3-M11.
- The standard runner uploaded the 10 pending Business Research Methods lessons
  through `yt_queue.py upload --gate-ready`:
  - M1 `JEqxTnNAYik`
  - M3 `PgpbDZejrw0`
  - M4 `6Ef92MnOhnE`
  - M5 `o7OVImeOiJ8`
  - M6 `AhbNvwGHUbs`
  - M7 `bLbVY1HLY0Y`
  - M8 `rOdD7bJc-jw`
  - M9 `Y7iRzZRqHMc`
  - M10 `wYJ3r1imrgs`
  - M11 `m4Mil_vOEnk`
- Business Research Methods was 11/11 uploaded after the 03:00 CT slot.
- Queue status after the slot: 371 uploaded, 0 pending, 0 no-MP4.
- Artifact-backed 2026-06-25 CT upload count is 10.

## Constraints

- Do not weaken score-100, source-alignment, parent-trust, or upload gates.
- Do not treat standard captions as a video-upload blocker.
- Do not stage T9 media or generated lesson-video artifacts.
- Do not push `main` casually; push equals Netlify frontend deploy.
- Do not confuse no-pending-upload queue with no-production-needed.

## Suggested Verification

Use the existing GIIS runbooks and gates for the touched lesson. Minimum evidence
before upload:

- MP4 exists.
- independent review pass exists.
- source alignment review pass exists.
- parent-trust/video gate pass exists.
- upload uses `yt_queue.py upload --gate-ready`.

## Stop Conditions

- Any source mismatch remains.
- Required resources are paid/login-gated or mislabeled.
- cc session limit or review failure leaves approval artifacts missing or stale.
- A command would stage generated media, T9 artifacts, secrets, or deploy-facing
  frontend changes outside the scoped task.

## On Demand: School Ops / Sales

Before outreach or checkout changes, run the school ops / sales gates from the
repo runbook. Manual reviewed sales remain allowed only inside the existing
payment boundary; automated Guided/Premium checkout remains blocked until live
Stripe price and payment gates are green.
