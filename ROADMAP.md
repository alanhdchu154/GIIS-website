# GIIS Website Roadmap

Last updated: 2026-07-22 09:15 CDT

This file is the current execution roadmap. Historical slot logs are archived in
`docs/archive/ROADMAP_DETAIL_2026-07-03-lesson-video-slots.md`,
`docs/archive/ROADMAP_DETAIL_2026-06-24-pre-slim.md`, and git history.

## Current Priority

Keep the school trustworthy, operational, and parent-visible while the
foundation-video pipeline stabilizes. The next phase is proof over volume:
parents should see a serious school, a working dashboard, and course/video
quality that feels intentionally designed.

2026-07-12 backend trust hardening: protected student actions now fail closed
with a retryable 503 when payment/account status cannot be verified, and the
public checkout-session summary no longer returns customer email or amount.
The Welcome page preserves receipt reassurance without rendering private data.
Server tests: 43 passed; frontend tests: 16 passed; production build passed.

## Current Design Source

- 2026-06-28: `DESIGN.md` was added as the repo-local visual source of truth for
  future GIIS UI agents. It captures the parent-trust design system: deep
  institutional blue, gold as a restrained trust accent, real product
  screenshots, bilingual layout constraints, official-document boundaries, and
  the no-stock/AI-photo hero rule.
- Use `DESIGN.md` before visible UI changes, but do not let it override
  `AGENTS.md`, public-claim boundaries, official-document format locks, or
  production deploy gates.

## Current Lesson-Video State

Last refreshed: 2026-07-22 09:15 CDT.

Detailed slot-by-slot lesson-video evidence from 2026-06-24 through 2026-07-03
is archived in `docs/archive/ROADMAP_DETAIL_2026-07-03-lesson-video-slots.md`
and older pre-slim history is in
`docs/archive/ROADMAP_DETAIL_2026-06-24-pre-slim.md`.

Current operating state:

- 2026-07-22 09:35 CT current-state audit confirms the remaining active
  lesson-video backlog is 4 modules: Digital Media & Society M11-M12 and
  English IV - Writing & Communication M6/M13. Grades 9, 10, and 11 dry-runs
  return 0 candidates; Grade 12 dry-run returns exactly those 4 candidates.
  Queue is 831 uploaded / 0 pending / 0 no-MP4. Codex also repaired the
  YouTube channel manifest sync/parser so recent title formats such as
  `Course — 14: Title` and `Course — 14` are included. The public manifest is
  now rebuilt to 816 visible lessons with AP/hidden courses still excluded,
  Biology Advanced 14/14 visible, Physics - Mechanics 14/14 visible, Digital
  Media & Society 10/12 visible, and English IV - Writing & Communication
  11/13 visible. Verified: manifest alignment 0 warnings across 816 lessons,
  video inventory 816 visible / 15 hidden upload-candidates, parser tests pass,
  `py_compile`, and `npm run build` passed. Commit `26873221` was pushed to
  `origin/main`; Netlify production now serves the 816-lesson manifest, and
  browser search on `/lessons` finds `Conservation Biology`,
  `Waves & Sound Basics`, and `Digital Revolution`. GitHub CI build job passed;
  `server-smoke` remains red in `server/src/middleware/auth.test.js` with the
  known payment/access test WIP and should be fixed in a separate scoped commit.
- 2026-07-22 08:48-08:50 CT heartbeat attempted the approved 5-cap path for
  the final 4 safe candidates: Digital Media & Society M11-M12 and English IV
  - Writing & Communication M6/M13. Claude Code hit the session limit while
  reading references for DMS M11, before production artifacts were written. DMS
  M11 currently has only `source_packet.json`, `teaching_brief.md`, and
  `visual_brief.md`; it is not release-ready. Queue remains 831 uploaded /
  0 pending / 0 no-MP4 / 831 total; pending release gate is 0/0/0; manifest
  alignment remains clean with 0 warnings across 768 lessons; no producer/upload
  process remains; no true YouTube upload/channel limit appeared. 2026-07-22 CT
  upload-run total remains 23 videos. Smallest next action after Claude resets:
  rerun the approved 5-cap path for the remaining 4 modules; do not force a
  fifth and do not treat the DMS M11 brief-only folder as release-ready.
- 2026-07-22 02:45-03:39 CT heartbeat completed the approved primary 5-cap
  pass but only 3 safe Grade 11 candidates existed. Physics - Mechanics
  M12-M14 reached final release gate score 100, passed parent-trust as
  `TRUST_READY`, and uploaded unlisted with 0 failures: M12 `1vpUHBO2Ujs`,
  M13 `cSnxLz0U9Mo`, and M14 `KOQDzWKp6Yo`. Queue is now 821 uploaded /
  0 pending / 0 no-MP4 / 821 total; pending release gate is 0/0/0; manifest
  alignment remains clean with 0 warnings across 768 lessons; no
  producer/upload process remains; no true YouTube upload/channel limit
  appeared. The optional second 5-cap top-up began after clean rechecks and
  safely auto-advanced to Grade 12 Digital Media & Society M1-M5, but Claude
  Code hit a session limit before DMS M1 production artifacts were written.
  DMS M1 currently has only `source_packet.json`, `teaching_brief.md`, and
  `visual_brief.md`; uploader found 0 gate-ready pending items. 2026-07-22 CT
  upload-run total is now 13 videos. Active missing backlog is now 14 modules:
  Digital Media & Society M1-M12 and English IV - Writing & Communication
  M6/M13. Next action after Claude resets: rerun the approved 5-cap path
  starting with DMS M1-M5; do not bypass gate-ready upload.
- 2026-07-22 00:02-02:41 CT heartbeat completed the approved primary 5-cap
  pass plus one optional second 5-cap top-up through
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`. Physics - Mechanics M2-M11 all reached final
  release gate score 100, passed parent-trust as `TRUST_READY`, and uploaded
  unlisted with 0 failures: M2 `KB5kjx6stso`, M3 `6wgelrX_-os`, M4
  `7RCvPtqdQJE`, M5 `vpqaXlXgk7Y`, M6 `VsW9fgJeQ38`, M7 `C7RBOrx28Mw`,
  M8 `-eK57GVBnuM`, M9 `GLxR3x7jRuE`, M10 `fS8iT1uO8V8`, and M11
  `8Ksk_iJ5g5w`. Queue is now 818 uploaded / 0 pending / 0 no-MP4 /
  818 total; pending release gate is 0/0/0; manifest alignment is clean with
  0 warnings across 768 lessons; no producer/upload process remains; no true
  YouTube upload/channel limit appeared. 2026-07-22 CT upload-run total is
  10 videos. Fresh dry-run now selects only 3 remaining Grade 11 candidates:
  Physics M12-M14. The active missing backlog is now 17 modules: Physics -
  Mechanics M12-M14, Digital Media & Society M1-M12, and English IV - Writing
  & Communication M6/M13. Do not force a 5-count when only 3 safe candidates
  exist.
- 2026-07-21 22:02-22:06 CT heartbeat retried the approved 5-cap path after
  confirming no duplicate producer/upload process, queue 808 uploaded /
  0 pending / 1 no-MP4, pending gate 0/0/0, manifest alignment 0 warnings, and
  5 safe dry-run candidates. Physics - Mechanics M2 rendered a new MP4 and
  moved from no-MP4 to pending, with audit verdict `pass_with_minor_notes` and
  score 94. It was not uploaded because the release gate still requires score
  100 and an independent second-pass reviewer, and Claude Code hit the session
  limit during the reviewer stage. The gate-ready uploader found 0 human-
  approved pending items. Current queue is 808 uploaded / 1 pending /
  0 no-MP4 / 809 total; pending release gate is 0 ready / 1 needs_revision /
  0 blocked; no producer/upload process remains; no true YouTube upload/channel
  limit appeared. Do not run the optional second pass until Claude resets and
  M2 can clear review/gate through the approved path.
- 2026-07-21 20:29-21:40 CT approved heartbeat started a new 5-cap pass. A
  visible-quality issue in Biology Advanced M14's path slide (`Next up: Module
  15`) was caught before upload; Codex stopped the run, repaired the slide to
  `Course wrap-up: submit Module 14 work`, and resumed only through the
  approved `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily` path. Biology Advanced M13-M14 and Physics -
  Mechanics M1 then reached final release gate score 100, passed parent-trust
  as `TRUST_READY`, and uploaded unlisted with 0 failures: Biology Advanced
  M13 `UU263ZBhjnM`, M14 `-2mGzWyIu9Y`, Physics M1 `6Ll4Hn1104k`. Claude Code
  then hit a session limit while Physics M2 was still pre-render, so the batch
  stopped before selecting more modules and no optional second pass ran. Queue
  is now 808 uploaded / 0 pending / 1 no-MP4 / 809 total; pending release gate
  is 0/0/0; direct Physics M2 gate is needs_revision score 34 because it has
  only pre-render artifacts; manifest alignment remains clean with 0 warnings
  across 768 lessons; no producer/upload process remains; no true YouTube
  upload/channel limit appeared. 2026-07-21 CT upload-run total is now
  33 videos. Next action after Claude reset: rerun the approved 5-cap path to
  resume Physics M2, then continue Physics M3-M6 if safe.
- 2026-07-21 18:01-20:24 CT approved heartbeat completed the primary 5-cap
  pass plus one optional second 5-cap top-up through the approved
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily` path. Biology Advanced M3-M12 all reached final
  release gate score 100, passed parent-trust as `TRUST_READY`, and uploaded
  unlisted with 0 failures: M3 `2JalKf_5GS4`, M4 `ji1O3BMiOYo`, M5
  `wgjRTBZf79k`, M6 `vMMC3-EHqgs`, M7 `QJKMf6xUnes`, M8 `qV_aDReeMPM`, M9
  `Oi0UqHpX9Js`, M10 `Xt5N9Qs2j0Y`, M11 `kj1-i3-iE4g`, and M12
  `9yf4Ci4FFOs`. Queue is now 805 uploaded / 0 pending / 0 no-MP4; pending
  release gate is 0/0/0; manifest alignment is clean with 0 warnings across
  768 lessons; no producer/upload process remains; no true YouTube
  upload/channel limit appeared. 2026-07-21 CT upload-run total is now
  30 videos. Post-run dry-run selects Biology Advanced M13-M14 plus Physics -
  Mechanics M1-M3 next; Grade 11 has 16 selectable safe candidates. Do not run
  a third pass from this heartbeat.
- 2026-07-21 16:31-17:12 CT approved heartbeat ran the normal
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily` path. Biology Advanced M1 and M2 were produced,
  final-gated, parent-trust-audited, and uploaded unlisted with 0 upload
  failures: M1 `BwwjCiVat1I`, M2 `W8eotP1WYYQ`. The same upload run also
  uploaded the previously gate-ready Global Economics & Politics M2
  `1xh58EFNWB0`. Biology Advanced M3 rendered and has
  `_review_independent_pass.json`, but the batch stopped on Claude Code
  session limit before `_review_source_alignment.json` was written, so it
  remains pending and is not gate-ready. Current evidence: no producer/upload
  process remains; queue is 795 uploaded / 1 pending / 0 no-MP4; pending
  release gate is 0 ready / 1 needs_revision / 0 blocked; manifest alignment is
  clean with 0 warnings across 768 lessons. No true YouTube upload/channel
  limit appeared. 2026-07-21 CT upload-run total is now 20 videos. Next action:
  after Claude resets, rerun the approved 5-cap heartbeat path; fresh dry-run
  selects Biology Advanced M3-M7, with M3 first needing the missing independent
  source-alignment review through the orchestrator. Do not bypass gate-ready
  upload.
- 2026-07-21 16:53 CT live page audit found the frontend deploy itself was
  fresh, but the public lesson manifest was stale: production and local
  `/data/lessons-manifest.json` both still showed the 2026-07-08
  channel-sync snapshot with 577 visible lessons and did not include today's
  Media & Society/Public Speaking/Sports Psychology uploads. Root cause:
  `sync_channel.py` only parsed `Course — Module N: Title`, while recent
  uploads use `Course — Module N — Title`, so many uploaded videos were treated
  as non-lesson extras. Fixed parser support for dash-separated titles, kept
  hidden/unpublished course JSON out of public manifest, refreshed the manifest
  from the YouTube channel to 768 visible lessons, and verified AP public count
  stays 0. New Media & Society M1-M8, Public Speaking M1-M8, and Sports
  Psychology M6 are present in the manifest. Verified: manifest alignment
  0 warnings across 768 lessons, video inventory 768 visible / 26 still hidden
  upload-candidates, parser unit tests pass, and `npm run build` passed.
- 2026-07-21 16:38 CT course-source cleanup narrowed the real active
  lesson-video backlog. The former 92-module no-grade/AP-looking backlog was
  not all legitimate production work: AP source courses are now hidden with
  `isPublished:false`; clear duplicate/legacy no-grade courses are also
  hidden rather than hard-deleted because DB rows still exist; transitional
  English/elective variants are hidden until an advisor/student pathway need is
  confirmed. Public Academics/Homepage AP course framing was removed in favor
  of advanced coursework/pathway evidence language. Current active published
  missing modules were 42 total before the 18:01 CT Biology Advanced top-up:
  Biology Advanced M1-M14, Physics - Mechanics M1-M14, Digital Media & Society
  M1-M12, and English IV - Writing & Communication M6/M13. After the 20:29 CT
  top-up uploaded Biology Advanced M13-M14 and Physics - Mechanics M1, the
  active missing backlog is 27 modules: Physics - Mechanics M2-M14, Digital
  Media & Society M1-M12, and English IV - Writing & Communication M6/M13. A
  surgical DB metadata sync then aligned only the 18
  touched course rows' `isPublished`/`gradeLevel` fields, without touching
  enrollments, progress, grades, modules, exams, or quiz questions. Detailed
  acceptance plan: `docs/lesson-video-readiness-plan.md`. Verified:
  course/question integrity 0 issues, targeted DB metadata dry-run 0 remaining
  changes, manifest alignment 0 warnings, queue 793 uploaded / 0 pending /
  0 no-MP4, Grade 11 and Grade 12 dry-runs select only the 42 active modules,
  and `npm run build` passed.
- 2026-07-21 14:01-16:28 CT approved heartbeat recovered after the earlier
  Claude reset wait and completed the primary 5-cap plus optional second top-up
  within the 10-cap rule. It produced, final-gated, parent-trust-audited, and
  uploaded all 8 remaining safe Media & Society candidates with 0 failures:
  M1 `tzc8wGHDiAw`, M2 `03Kp7uXMrgQ`, M3 `gqs3sDyNAoI`, M4 `FPCXzeRjI0M`,
  M5 `b5u3nc8Lfog`, M6 `CswHKcz2mvY`, M7 `v5Lgd-vp9rs`, and M8
  `6MPxhoslAAg`. Queue is now 793 uploaded / 0 pending / 0 no-MP4 /
  793 total; pending release gate is 0/0/0; manifest alignment remains clean:
  0 warnings across 577 lessons. No producer/upload process remains, and no
  true YouTube upload/channel limit appeared. 2026-07-21 CT total is now
  17 uploaded videos.
- 2026-07-21 09:07-10:37 CT recovery run resolved the false "no candidates"
  lesson-video state and uploaded 9 videos through the approved video-first
  path. Root causes fixed in the dirty worktree: `open.lib.umn.edu` 403 fetch
  checks no longer permanently quarantine candidates; existing artifacts can be
  rendered/reviewed/released through the orchestrator; render/review cache now
  notices `build_slides.py` and theme/source artifact changes; Public Speaking
  uses the literature theme consistently; and the independent reviewer wrapper
  now enforces timeout during quiet streaming output. Uploaded unlisted with
  0 failures: Public Speaking M1 `OtbHkuYR3uo`, M2 `vkv-S4FXsZw`, M3
  `KhDkoMRS-dQ`, M4 `PcKFGSErzKE`, M5 `POpTobbh3aY`, M6 `tyGv3rvLWxM`, M7
  `8cpRKxVMN78`, M8 `Tn5VjgSOiHI`, and Sports Psychology M6 `CpKQqO2GOds`.
  Queue is now 785 uploaded / 0 pending / 0 no-MP4 / 785 total; pending
  release gate is 0/0/0; manifest alignment remains clean: 0 warnings across
  577 lessons. No producer/upload/reviewer process remained after the run and
  no true YouTube upload/channel limit appeared. Fresh dry-run shows Grade 10
  fully clear and auto-advances to Grade 11 Media & Society M1-M5 for the next
  5-cap batch. Dirty risk remains: pipeline code/docs are modified, unrelated
  transfer-credit SOP files are untracked, and root `slides/` /
  `style_manifest.json` cwd-drift must not be broad-staged.
- 2026-07-20 21:03 CT routing update: Alan asked for the two-hour heartbeat to
  treat 5 modules/uploads as the normal target, with an optional second 5 if
  time and safe candidates remain. The automation TOML prompt, pipeline docs,
  playbook, workload, Central status, and automation registry now say: run one
  approved 5-cap pass first; if it exits cleanly, no producer/upload remains,
  no true YouTube upload/channel limit appeared, and fresh pending-gate/dry-run
  evidence still shows safe work, run one additional identical 5-cap top-up
  pass. Total per heartbeat cap is 10. This does not force unsafe work: fewer
  than 5 candidates, quality/parent-trust blockers, overlap, dirty-state risk,
  or true YouTube upload/channel limits stop the run.
- 2026-07-20 18:00-18:55 CT approved 5-cap heartbeat completed the remaining
  Sports Management & Leadership lane with 4 uploads. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active and no
  force approval/upload path was used. M9 Community Relations & Social
  Responsibility, M10 Crisis Management in Sport, M11 Sport Innovation &
  Technology, and M12 Capstone: Sport Leadership Portfolio reached final
  release gate score 100, passed parent-trust, and uploaded unlisted with
  0 failures: M9 `LOIv0kQPceY`, M10 `MmOXcAjFBpU`, M11 `wsDpnqMbraQ`, M12
  `AbPAf3yXgmc`. Queue is now 776 uploaded / 0 pending / 0 no-MP4 /
  776 total; pending release gate is 0/0/0; manifest alignment remains clean:
  0 warnings across 577 lessons. No producer/upload process remained after the
  run. This was not a YouTube upload/channel limit. Current 2026-07-20 CT total
  is 21 uploaded. Post-run dry-run shows no selectable candidates in Grades
  10, 11, or 12, so the next heartbeat should return `DONT_NOTIFY` unless a
  new safe candidate appears or a reconciliation/blocker needs attention.
  Dirty risk remains: root `slides/` and `style_manifest.json` are untracked
  cwd-drift and must not be broad-staged.
- 2026-07-20 16:03-17:08 CT approved 5-cap heartbeat completed with 5
  uploads and recovered the prior Sports Management & Leadership M4 blocker.
  The run stayed on `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active and no
  force approval/upload path was used. M4 Organizational Culture & Team
  Building, M5 Conflict Resolution in Sport Organizations, M6 Decision-Making
  in Sport Management, M7 Diversity, Equity & Inclusion in Sport, and M8
  Financial Strategy for Sport Organizations reached final release gate score
  100. Parent-trust first stopped M8 on a false-positive literal
  `not guaranteed revenue` phrase; Codex changed it to `not secured revenue`,
  regenerated M8 audio/MP4 through the orchestrator path, reran independent
  review, and the 5-lesson parent-trust audit returned `TRUST_READY`. Uploaded
  5 unlisted videos with 0 failures: M4 `6Bz-XipbIjY`, M5 `xVR4RtSKT-s`,
  M6 `lTA_DRPbyeQ`, M7 `fRXk0iYSc5w`, M8 `QGxZX99qdCo`. All five were added
  to the `Sports Management & Leadership` playlist. Queue is now 772 uploaded /
  0 pending / 0 no-MP4 / 772 total; pending release gate is 0/0/0; manifest
  alignment remains clean: 0 warnings across 577 lessons. No producer/upload
  process remained after the run. This was not a YouTube upload/channel limit.
  Current 2026-07-20 CT total is 17 uploaded. Post-run dry-run shows 4
  selectable candidates remain, Sports Management & Leadership M9-M12, with
  course design still passing. Dirty risk remains: root `slides/` and
  `style_manifest.json` are untracked cwd-drift and must not be broad-staged.
- 2026-07-20 14:03-14:55 CT approved 5-cap heartbeat advanced the Sports
  Management & Leadership lane through the approved
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily` path. The first M2 attempt hit a Claude/socket
  interruption after writing pre-render artifacts; Codex made one bounded
  approved-run retry, which completed M2, then produced M3. M2 Transformational
  Leadership and M3 Strategic Planning for Sport Organizations reached final
  release gate score 100, passed parent-trust as `TRUST_READY`, and uploaded
  unlisted with 0 failures through `yt_queue.py upload --gate-ready --max 5
  --privacy unlisted`: M2 `86RiNVtDIuM`, M3 `F6SeBSZtpV0`. Both were added to
  the `Sports Management & Leadership` playlist. The run then selected M4
  Organizational Culture & Team Building, but Claude Code returned a
  session-limit stop after tool progress and only script/source/brief artifacts
  exist; M4 is now no-MP4 / `cc_blocked` attempt 1. Queue is 767 uploaded /
  0 pending / 1 no-MP4 / 768 total; pending release gate is 0/0/0; direct M4
  gate is needs_revision score 0; manifest alignment remains clean: 0 warnings
  across 577 lessons. No producer/upload process remained after the run. This
  was not a YouTube upload/channel limit. Current 2026-07-20 CT total is
  12 uploaded. Post-run dry-run shows 9 selectable Grade 12 candidates remain,
  M4-M12 of Sports Management & Leadership, with course design still passing.
  Smallest next action: next heartbeat resumes M4 through the same approved
  runner after Claude reset; do not force approval/upload or broad-stage root
  `slides/` / `style_manifest.json`.
- 2026-07-20 12:02-13:24 CT approved 5-cap heartbeat completed with 5
  uploads and finished Psychology Seminar / Capstone M9-M12 before starting
  Sports Management & Leadership. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active and no
  force approval/upload path was used. Psychology M9 APA Writing Style, M10
  Data Collection Methods, M11 Statistical Analysis for Psychology, M12
  Capstone Presentation & Research Reflection, and Sports Management M1
  Leadership Theories in Sport reached final release gate score 100 and passed
  parent-trust as `TRUST_READY`. Uploaded 5 unlisted videos with 0 failures:
  Psychology M9 `fREcl4LN4wA`, M10 `3OZ5EDpq7vY`, M11 `RdfCGBBikNs`, M12
  `5YJLlvoKcwk`, and Sports Management M1 `_jZ7QIx0a4w`. Psychology M9-M12
  were added to the `Psychology Seminar / Capstone` playlist; the uploader
  created `Sports Management & Leadership` playlist `PLNAhuCd5rVXs`, then
  added M1 after one transient playlist-add retry. Queue is now 765 uploaded /
  0 pending / 0 no-MP4 / 765 total; pending release gate is 0/0/0; manifest
  alignment remains clean: 0 warnings across 577 lessons. No producer/upload
  process remained after the run. This was not a YouTube upload/channel limit,
  though the conservative local quota estimate now shows 10 uploads today and
  0 safe full uploads left. Current 2026-07-20 CT total is 10 uploaded. Dirty
  risk remains: root cwd-drift `slides/` and `style_manifest.json` are
  untracked again and must not be broad-staged.
- 2026-07-20 10:03-11:26 CT approved 5-cap heartbeat completed with 5
  uploads and cleared Psychology Seminar / Capstone M4-M8. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active and no
  force approval/upload path was used. M4 Cross-Cultural Psychology, M5
  Positive Psychology & Well-Being, M6 Applied Psychology Careers, M7 Research
  Design Review, and M8 Literature Review Skills reached final release gate
  score 100. Parent-trust initially stopped on M5 wording containing
  `guarantees lasting happiness`; Codex changed it to non-guarantee wording
  (`automatically creates lasting happiness`), rerendered/reviewed M5 through
  the normal orchestrator path, and the 5-lesson recheck returned
  `TRUST_READY`. Uploaded 5 unlisted videos with 0 failures: M4
  `U5eAvCvMXgQ`, M5 `xV5cl6hRJTU`, M6 `tMbWOPhJaRc`, M7 `vDQQoh54y5c`, M8
  `ohJhnUhCuCU`. All five were added to the `Psychology Seminar / Capstone`
  playlist. Queue is now 760 uploaded / 0 pending / 0 no-MP4 / 760 total;
  pending release gate is 0/0/0; manifest alignment remains clean: 0 warnings
  across 577 lessons. No producer/upload process remained after the run. This
  was not a YouTube upload/channel limit. Current 2026-07-20 CT total is
  5 uploaded. Dirty risk remains: existing website UX/course/pipeline WIP plus
  root cwd-drift `slides/` and `style_manifest.json` must not be broad-staged.
- 2026-07-17 12:02 CT approved 5-cap heartbeat attempted the next safe
  producer slot through `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm
  run lesson:foundation-daily`. The runner auto-advanced to Grade 12 and
  selected Psychology Seminar / Capstone M4 Cross-Cultural Psychology, but
  Claude Code immediately returned a session-limit stop after reading the
  handoff. The orchestrator stopped the batch before selecting more modules and
  the gate-ready uploader found 0 approved pending items. No MP4, approval row,
  or upload was created; no duplicate producer/upload remained active. Queue
  remains 755 uploaded / 0 pending / 0 no-MP4 / 755 total; pending release gate
  remains 0/0/0; manifest alignment remains clean: 0 warnings across
  577 lessons. This is a Claude Code session/tool blocker, not a YouTube
  upload/channel limit or parent-trust issue. Smallest next action: after
  Claude Code session reset, let the next two-hour heartbeat retry Psychology
  Seminar / Capstone M4 through the normal gated path; do not force approval or
  upload.
- 2026-07-17 10:02-11:41 CT approved 5-cap run completed with 5 uploads and
  advanced from Personal Finance / Applied Economics into Psychology Seminar /
  Capstone. The run stayed on `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5
  npm run lesson:foundation-daily`; no duplicate producer/upload was active and
  no force approval/upload path was used. Personal Finance M11 Housing & Real
  Estate, M12 Capstone: Personal Financial Plan, and Psychology Seminar /
  Capstone M1-M3 all produced or rendered, passed independent/source review,
  reached final release gate score 100, and passed parent-trust as
  `TRUST_READY`. Uploaded 5 unlisted videos with 0 failures: Personal Finance
  M11 `M38vvdj7ONQ`, Personal Finance M12 `BpUmXOfh65c`, Psychology M1
  `6Znwc1QQKZY`, Psychology M2 `dZIZzvQ-jJ0`, Psychology M3 `iWCaFw8DzXw`.
  The uploader created the `Psychology Seminar / Capstone` playlist and added
  M1-M3; Personal Finance M11-M12 were added to the existing playlist. Queue is
  now 755 uploaded / 0 pending / 0 no-MP4 / 755 total; pending release gate is
  0/0/0; manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run. This was not a YouTube
  upload/channel limit. Current 2026-07-17 CT total is now 10 uploaded.
- 2026-07-17 08:16-09:31 CT approved 5-cap run completed with 5 uploads and
  cleared Personal Finance / Applied Economics M6-M10. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active and no
  force approval/upload path was used. M6 Stock Market Basics, M7 Bonds,
  Mutual Funds & ETFs, M8 Retirement Planning (401k, IRA), M9 Taxes & Filing
  Basics, and M10 Insurance (Health, Auto, Life) reached final release gate
  score 100. Parent-trust initially stopped on M7 finance wording
  (`no guaranteed payout but historically higher long-run returns`); Codex
  changed the lesson wording to "long-run return potential that is never
  promised," rerendered/reviewed M7 through the normal orchestrator path, and
  the 5-lesson recheck returned `TRUST_READY`. Uploaded 5 unlisted videos with
  0 failures: M6 `HOjrsc7TZvA`, M7 `uNsAjpxQgQY`, M8 `kI2tOmAsF9Y`,
  M9 `RI_MkyMB5n8`, M10 `PEotSgupR4Q`. All five were added to the `Personal
  Finance / Applied Economics` playlist. Queue is now 750 uploaded /
  0 pending / 0 no-MP4 / 750 total; pending release gate is 0/0/0; manifest
  alignment remains clean: 0 warnings across 577 lessons. No producer/upload
  process remained after the run. This was not a YouTube upload/channel limit.
  Current 2026-07-17 CT total is 5 uploaded.
- 2026-07-16 20:25 CT approved run selected Personal Finance / Applied
  Economics M6, but its cc worker stalled beyond the configured 1800-second
  limit during Claude API retries. Central Umi terminated only the stale Claude
  child at 22:49 CT; the worker/orchestrator chain exited cleanly and logged a
  Claude Code session-limit stop. No MP4, approval, or upload was created. The
  gate-ready uploader found nothing approved, and fresh queue evidence remains
  745 uploaded / 0 pending / 0 no-MP4. Resume M6 only through the next approved
  heartbeat after session reset; do not force approval/upload.
- 2026-07-16 14:01-14:34 CT approved 5-cap run completed with 5 uploads and
  cleared the Personal Finance / Applied Economics retry lane. The run stayed
  on `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active. M1-M2
  were accepted as existing ready lessons. M3 completed the missing
  independent/source review after the prior session-limit blocker and reached
  final release gate score 100. M4 Credit, Debt & Credit Scores and M5
  Introduction to Investing produced/rendered/reviewed to final gate score
  100. Parent-trust initially stopped on M5 investment dollar examples as
  `payment_claim`; Codex tightened the audit classifier and fixture coverage
  for educational investment/portfolio dollar examples, fixture regression
  passed, and the 5-lesson recheck returned `TRUST_READY`. Uploaded 5 unlisted
  videos with 0 failures: M1 `utCAkk0BScU`, M2 `PFw1L2Xkjzc`,
  M3 `QaKYOUyQg18`, M4 `Ns_0MWlShW0`, M5 `ngfr9Pzx0GI`. The uploader created
  the `Personal Finance / Applied Economics` playlist `PLXTmQGow1tFA`; M1
  needed one transient playlist-add retry and then all five were added. Queue
  is now 745 uploaded / 0 pending / 0 no-MP4 / 745 total; pending release gate
  is 0/0/0; manifest alignment remains clean: 0 warnings across 577 lessons.
  No producer/upload process remained after the run. This was not a YouTube
  upload/channel limit. Current 2026-07-16 CT total is now 22 uploaded.
- 2026-07-16 10:01-11:55 CT approved 5-cap run completed with 1 upload and
  1 retry item. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active. Media
  Psychology M12 produced/rendered, passed independent/source review, final
  release gate score 100, parent-trust `TRUST_READY`, approval row, and
  unlisted YouTube upload with 0 failures. Video ID: `VvFIbebNL8I`; Media
  Psychology is now 12/12 uploaded. The runner then started Personal Finance /
  Applied Economics M1 after course-design pass, but Claude Code hit a session
  limit after writing script/reviewer/learning-check files and before
  `build_slides.py`/slides/MP4 were completed, so the batch stopped cleanly.
  Queue is now 740 uploaded / 0 pending / 1 no-MP4 / 741 total; the no-MP4
  item is `personal-finance-applied-economics-module-1-financial-goal-setting-mindset-v2`.
  Pending release gate is 0/0/0 because the retry item is no-MP4, not pending;
  direct check on M1 is needs_revision with audit score 8. Manifest alignment
  remains clean: 0 warnings across 577 lessons. No producer/upload process
  remained after the run. This was not a YouTube upload/channel limit. Current
  2026-07-16 CT total is now 17 uploaded. Smallest next action after Claude
  Code reset: let the next approved heartbeat finish M1 slides/contact
  sheet/MP4/independent review, then upload through the gate-ready path.
- 2026-07-16 08:02-09:17 CT approved 5-cap run completed. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active. The
  orchestrator auto-advanced to Media Psychology M7-M11. All 5 produced or
  rendered, passed independent/source review, final release gate score 100,
  parent-trust `TRUST_READY`, approval rows, and unlisted YouTube upload with
  0 failures. Video IDs: M7 `ltmtmcvAHE0`, M8 `Hr8bVqQt66M`, M9
  `y3kCTHNegVU`, M10 `BeKcSBbNiS8`, M11 `98MuKqBIMxM`. Media Psychology is
  now 11/11 uploaded. Queue is now 739 uploaded / 0 pending / 0 no-MP4 /
  739 total; pending release gate is 0/0/0; manifest alignment remains clean:
  0 warnings across 577 lessons. No producer/upload process remained after the
  run. This was not a YouTube upload/channel limit. Current 2026-07-16 CT
  total is now 16 uploaded. Non-blocking quality note: M7-M11 reviewers again
  noted the upstream `source_packet.expert_lens.family` is technology/CS-worded
  for Media Psychology, but each lesson translated the lens into psychology
  terms and had no required fixes.
- 2026-07-16 06:01-06:40 CT approved 5-cap run completed and cleared the
  Media Psychology batch. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active. Media
  Psychology M2-M6 rendered or reused clean MP4s, passed source/independent
  review path sufficiently for final release gate score 100 and parent-trust
  `TRUST_READY`, then uploaded unlisted with 0 failures. Video IDs: M2
  `6d7OiO1tEA8`, M3 `TqGKgPVizPQ`, M4 `C-4XLqiBSJk`, M5 `OBD7Y_KfAlk`, M6
  `X4WEGjwtud4`. Media Psychology is now 6/6 uploaded. Queue is now
  734 uploaded / 0 pending / 0 no-MP4 / 734 total; pending release gate is
  0/0/0; manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run. This was not a YouTube
  upload/channel limit. Current 2026-07-16 CT total is now 11 uploaded. Quality
  caveat: M6's independent reviewer flagged a post-upload style-rule issue in
  the slide bio (`UCSB class of 2028` should be `UC Santa Barbara class of
  2028` or a placeholder). The final gate and parent-trust allowed upload, but
  the abbreviation is real policy debt; do not delete/reupload automatically
  without Alan deciding replacement is worth it.
- 2026-07-16 04:02-04:17 CT approved 5-cap retry advanced the Media
  Psychology batch and uploaded 1. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily`; no duplicate producer/upload was active. Media
  Psychology M1 rendered MP4/transcript, passed Opus independent/source review
  despite a non-blocking upstream expert-lens family note, final release gate
  score 100, parent-trust `TRUST_READY`, approval row, and unlisted upload
  with 0 failures. Video ID: `W22EkYY10aY`; the uploader also created the
  `Media Psychology` playlist (`PLNO6BC0qYxbM`) and added M1. M2 rendered MP4
  but stopped at the Opus independent-review stage because Claude Code hit a
  session limit; M3-M5 still have pre-render artifacts only. Queue is now
  729 uploaded / 1 pending / 3 no-MP4 / 733 total; Media Psychology is
  1 uploaded / 1 pending / 3 no-MP4. Pending release gate is 0 ready /
  1 needs_revision / 0 blocked: M2 has `pass_with_minor_notes` score 88 and is
  missing independent second-pass review. Manifest alignment remains clean:
  0 warnings across 577 lessons. No producer/upload process remained after the
  run. This was not a YouTube upload/channel limit. Current 2026-07-16 CT total
  is now 6 uploaded.
- 2026-07-16 02:03-02:49 CT approved 5-cap run completed with generation
  progress but no uploads. The run stayed on
  `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5 npm run
  lesson:foundation-daily` and did not start a duplicate producer/upload.
  Digital Media & Society M1-M12 were skipped by resource fetch failures
  against `open.lib.umn.edu` (403), then the orchestrator generated Media
  Psychology M1-M5 pre-render artifacts. All five remain `no MP4` because the
  handoff-stage folders need the orchestrator TTS/MP4 render plus independent
  pass/source-alignment wrapper files before release gate can reach ready.
  During M1 the worker fixed a narrow shared theme resolver bug in
  `slide_kit.py` and `audit_lessons.py`: psychology now resolves before
  literature so `Media Psychology` no longer gets the literature theme via the
  word `Media`; sanity check confirmed `Digital Media & Society` still resolves
  to literature and Counseling still resolves to psychology. Upload path found
  0 gate-ready pending items, so 0 uploaded / 0 failed. Queue is now
  728 uploaded / 0 pending / 5 no-MP4 / 733 total; pending release gate is
  0/0/0; manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run. This was not a YouTube
  upload/channel limit. Current 2026-07-16 CT total remains 5 uploaded.
- 2026-07-16 00:01-01:11 CT approved 5-cap run completed. The orchestrator
  auto-advanced from Grade 10 to Grade 12 and finished Counseling & Mental
  Health M8-M12 through the approved `FOUNDATION_MAX_MODULES=5
  FOUNDATION_UPLOAD_MAX=5 npm run lesson:foundation-daily` path. All 5
  rendered, passed Opus independent/source review, final release gate score
  100, parent-trust `TRUST_READY`, approval rows, and unlisted YouTube upload
  with 0 failures. Video IDs: M8 `lIFINCze3Ow`, M9 `UTVwQ9D0TVo`,
  M10 `VkUrkaSVI7k`, M11 `K_oLaQITqUo`, M12 `ZxjtObklpsQ`. Counseling &
  Mental Health is now 12/12 uploaded. Queue is now 728 uploaded /
  0 pending / 0 no-MP4 / 728 total; pending release gate is 0/0/0; manifest
  alignment remains clean: 0 warnings across 577 lessons. No producer/upload
  process remained after the run. This was not a YouTube upload/channel limit.
  Current 2026-07-16 CT total is 5 uploaded.
- 2026-07-15 22:01-23:09 CT approved 5-cap run completed and cleared the
  prior retry item. Counseling & Mental Health M2 regenerated its prior
  zero-byte/stale TTS segment and rendered cleanly; M4-M7 also produced or
  rendered, passed Opus independent/source review, final release gate score
  100, and parent-trust. M7 initially hit a parent-trust hard stop because the
  crisis-response misconception example used `It will get better`; Codex
  narrowed the fix to the M7 script/slide example (`Try to stay positive`),
  regenerated the stale `05_misconception` audio/MP4/transcript, refreshed
  review SHA bindings, reran gate to score 100, and parent-trust returned
  `TRUST_READY` for the full 5-lesson batch. Uploaded 5 unlisted videos with
  0 failures: Counseling M2 `SslhML4fnjc`, M4 `sZCruQt4W_w`, M5
  `wIOVveWdMiE`, M6 `fk9znClHzHg`, and M7 `1mmfsoQUwe0`. Queue is now
  723 uploaded / 0 pending / 0 no-MP4 / 723 total; pending release gate is
  0/0/0; manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run. This was not a YouTube
  upload/channel limit. Same-day CT total is now 28 uploaded.
- 2026-07-15 20:01-21:10 CT approved 5-cap run completed with a partial
  upload success and one transient TTS retry item. Codex stayed on the
  approved `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5
  npm run lesson:foundation-daily` path. Uploaded 4 unlisted videos with
  0 upload failures: Abnormal Psychology M11 `9_BfBn3cNKk`, Abnormal
  Psychology M12 `PqCm1i73p8E`, Counseling & Mental Health M1 `0XZU3VvEBqs`,
  and Counseling & Mental Health M3 `sFKwjhrgWjY`. Abnormal Psychology is now
  12/12 uploaded. Counseling M2 produced pre-render artifacts, but MP4 render
  hit an Edge TTS websocket connection timeout while synthesizing section 04;
  it remains the single `no MP4` retry item and was not uploaded. Queue is now
  718 uploaded / 0 pending / 1 no-MP4 / 719 total; pending release gate is
  0/0/0; manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run. This was not a YouTube
  upload/channel limit.
- 2026-07-15 18:29-19:34 CT second 5-cap big run completed through the
  approved `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5
  npm run lesson:foundation-daily` path. Abnormal Psychology M6-M10 produced,
  rendered, passed Opus independent/source review, final release gate score
  100, parent-trust `TRUST_READY`, approval rows, and unlisted YouTube upload
  with 0 failures. Video IDs: M6 `mYKIYf5hW4E`, M7 `w-VUjwN3h3A`,
  M8 `TS2t4rOZ1m4`, M9 `FUtiySPIfv4`, M10 `CFFS4ZAI05k`. Queue is now
  714 uploaded / 0 pending / 0 no-MP4; pending release gate is 0/0/0;
  manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run. Abnormal Psychology is now
  10/10 uploaded.
- 2026-07-15 17:12-18:26 CT course-design unblock and 5-cap big run
  completed. Codex added real 12th modules to all seven blocked 1-credit /
  11-module Grade 12 candidates: Abnormal Psychology, Counseling & Mental
  Health, Digital Media & Society, Media Psychology, Personal Finance & Applied
  Economics, Psychology Seminar Capstone, and Sports Management & Leadership.
  Direct course-design review now passes for all seven. Then Codex ran the
  approved `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5
  npm run lesson:foundation-daily` path end-to-end. Abnormal Psychology M1-M5
  produced, rendered, passed Opus independent/source review, final release gate
  score 100, parent-trust `TRUST_READY`, approval rows, and unlisted YouTube
  upload with 0 failures. Video IDs: M1 `QM0g3oVYCes`, M2 `0VORdiHVJzE`,
  M3 `DxfgBsKrUZU`, M4 `EcFBRitEddQ`, M5 `yVUfwAMy1PM`. Queue is now
  709 uploaded / 0 pending / 0 no-MP4; pending release gate is 0/0/0;
  manifest alignment remains clean: 0 warnings across 577 lessons. No
  producer/upload process remained after the run.
- 2026-07-15 16:29 CT first two-hour / 5-cap producer check ran through the
  approved `FOUNDATION_MAX_MODULES=5 FOUNDATION_UPLOAD_MAX=5
  npm run lesson:foundation-daily` path. Result: 0 produced / 0 uploaded /
  0 failed. Queue stayed 704 uploaded / 0 pending / 0 no-MP4; pending release
  gate stayed 0 ready / 0 needs_revision / 0 blocked; manifest alignment stayed
  clean: 0 warnings across 577 lessons. The blocker is course design, not
  upload: the next seven grade-12 candidates are 1-credit courses with only
  11 modules, outside the required 12-16 range. Built-in safe repair does not
  add/delete modules, so the smallest next action is a bounded course-design
  repair lane for one course, likely Abnormal Psychology first, before the next
  producer can create more videos.
- 2026-07-15 13:00 CT approved foundation run completed the held Corporate
  Finance M11 repair. The orchestrator cleared stale reviewer/render cache,
  regenerated MP4/transcript, Opus independent/source review passed, final
  release gate returned ready, parent-trust returned `TRUST_READY`, and
  `yt_queue.py upload --gate-ready` uploaded M11 unlisted with 0 failures.
  Video ID: `O1NNSzZ9ykw`. Current queue evidence is 704 uploaded /
  0 pending / 0 no-MP4; pending release gate is 0 ready / 0 needs_revision /
  0 blocked; manifest alignment remains clean: 0 warnings across 577 lessons.
  No producer/upload process remained after the run. Dirty risk remains:
  root cwd-drift `slides/` and `style_manifest.json`, Business Law/Corporate
  Finance course JSONs, parent-trust audit code/fixture changes, and generated
  T9 media should not be broad-staged.
- 2026-07-15 08:00 CT approved foundation run produced Corporate Finance M9,
  M10, and M12, repaired the parent-trust false positive that treated supplier
  invoice terms as GIIS payment wording, reran fixtures and parent-trust to
  `TRUST_READY`, wrote approval rows, and uploaded all 3 unlisted through
  `yt_queue.py upload --gate-ready`. Video IDs: M9 `O8IA0Y4ikAg`, M10
  `ptUS0Wd_PbA`, M12 `qiNQujccb14`. Corporate Finance M11 was correctly held:
  the independent reviewer caught a bond-price narration error; the script was
  fixed to the correct 4% yield price (~$1,162), but M11 still needs a fresh
  independent/source-alignment review before it can pass release gate. Current
  queue evidence is 703 uploaded / 1 pending / 0 no-MP4; pending release gate
  is 0 ready / 1 needs_revision / 0 blocked; manifest alignment remains clean:
  0 warnings across 577 lessons. Dirty risk remains: root cwd-drift `slides/`
  and `style_manifest.json`, Business Law/Corporate Finance course JSONs,
  parent-trust audit code/fixture changes, and generated T9 media should not be
  broad-staged.
- 2026-07-15 03:00 CT follow-up repaired the prior cc-limit stop and completed
  Corporate Finance M4-M8 through the approved foundation path. Parent-trust
  audit returned `TRUST_READY` for all 5, release gates passed cleanly, and
  `yt_queue.py upload --gate-ready --max 5` uploaded all 5 unlisted with
  0 failures. Current queue evidence is 700 uploaded / 0 pending / 0 no-MP4;
  pending release gate is 0 ready / 0 needs_revision / 0 blocked; manifest
  alignment remains clean: 0 warnings across 577 lessons. No producer/upload
  process remained after the run. Dirty risk remains: root cwd-drift `slides/`
  and `style_manifest.json`, plus Business Law and Corporate Finance course
  JSON/doc changes, should not be broad-staged.
- Latest 5 uploaded: Corporate Finance M4-M8. Video IDs: `HbMmR01j-Pw`,
  `XKue3VHkHiQ`, `vg2EVsTVyRM`, `E7TC9dihtEY`, `hwWv9Hm7wbQ`.
- Alan asked to push another 10 after the 21:34 CT Business Law top-up. Codex
  completed a bounded follow-up through the approved foundation path: Business
  Law M11-M12 and Corporate Finance M1-M3 uploaded unlisted through
  `yt_queue.py upload --gate-ready`. Corporate Finance M3 first had a wrong
  path-slide next-module label (`Capital Budgeting` instead of `Risk &
  Return`); Codex patched the generated slide text, reran MP4/foundation gate,
  ran Opus independent/source review, and release gate returned ready before
  upload. Result for this follow-up: 5 uploaded / 0 failed / 0 pending. Current
  same-day count is 48 uploaded on 2026-07-14 CT. Current queue evidence is
  695 uploaded / 0 pending / 0 no-MP4; pending release gate is 0 ready /
  0 needs_revision / 0 blocked; manifest alignment remains clean: 0 warnings
  across 577 lessons. The run stopped before reaching 10 because Claude Code
  reported a session limit while starting Corporate Finance M4; M4 has only the
  packet/brief files and is not renderable yet. This is not a YouTube
  upload/channel limit. Dirty risk remains: untracked root cwd-drift `slides/`
  and `style_manifest.json`, plus Business Law and Corporate Finance course
  JSON repairs, should not be broad-staged.
- Latest 5 uploaded: Business Law M11-M12 and Corporate Finance M1-M3. Video
  IDs: `Nl4doU8yYlI`, `XFJ6lu2xerM`, `INq2SmpZWA4`, `uuKW7q_93Ak`,
  `CFCIXqp_XFg`.
- Alan asked to move another 10 forward after the 18:00 course-design stop.
  Codex repaired the bounded course-design blocker for Business Law by adding a
  12th ethics/compliance module to the course JSON, then reran the approved
  foundation path with `FOUNDATION_MAX_MODULES=10` and `FOUNDATION_UPLOAD_MAX=10`.
  The run produced Business Law M1-M10, passed parent-trust as `TRUST_READY`,
  wrote clean approval rows, and uploaded all 10 unlisted through
  `yt_queue.py upload --gate-ready`. Result: 10 uploaded / 0 failed /
  0 still pending. Current same-day count is 43 uploaded on 2026-07-14 CT.
  Current queue evidence is 690 uploaded / 0 pending / 0 no-MP4, gate-ready
  dry-run shows 0 approved pending, and manifest alignment remains clean:
  0 warnings across 577 lessons. Captions, thumbnails, sync, and cleanup remain
  separate reconciliation/backlog work. Dirty risk: untracked root cwd-drift
  `slides/` and `style_manifest.json` reappeared and were not deleted in this
  run; do not stage them or generated T9 media.
- Latest 10 uploaded: Business Law M1-M10. Video IDs: `ZCs0tthVftw`,
  `2_ZCjefjN0M`, `PHnOQ_5j4Mo`, `d4-lJEr0N0U`, `WK3A73YSe7o`,
  `4JWMisZPvXs`, `kGmAa8Y6lOs`, `NRiVtzmCJ-w`, `V-wZIM-Nj1Q`,
  `RO8ddWfNzAE`.
- The 2026-07-14 18:00 CT approved foundation run started cleanly through
  `npm run lesson:foundation-daily`, found no active duplicate producer/upload,
  and did not upload anything because no gate-ready lesson was produced. Grade
  10 had no selectable unfinished candidates; grade auto-advance reached
  grade 12, where the next available courses are blocked by the course-design
  guard as 11-module / 1-credit courses outside the expected 12-16-module
  shape. Result: 0 produced / 0 uploaded / 0 failed. Current queue evidence is
  still 680 uploaded / 0 pending / 0 no-MP4, gate-ready dry-run shows 0
  approved pending, and manifest alignment remains clean: 0 warnings across
  577 lessons. Smallest next action is a bounded course-design repair/selection
  lane before another producer can reach the 40-video target.
- The 2026-07-14 13:00 CT approved foundation run completed the remaining
  Statistics for Social Sciences modules M11-M13, passed parent-trust as
  `TRUST_READY`, wrote clean approval rows, and uploaded all 3 unlisted through
  `yt_queue.py upload --gate-ready` with video-first settings. Result:
  3 uploaded / 0 failed / 0 still pending. Current same-day count is 33
  uploaded on 2026-07-14 CT. Current queue evidence is 680 uploaded /
  0 pending / 0 no-MP4, gate-ready dry-run shows 0 approved pending, and
  manifest alignment remains clean: 0 warnings across 577 lessons. Captions,
  thumbnails, sync, and cleanup remain separate reconciliation/backlog work.
- Latest 3 uploaded: Statistics for Social Sciences M11-M13. Video IDs:
  `4RglrcdbF6Q`, `xC7jAs6RDUw`, `0RefO27bw6w`.
- The 2026-07-14 08:00 CT approved foundation run auto-advanced to Statistics
  for Social Sciences, produced M1-M10, passed parent-trust as `TRUST_READY`,
  wrote clean approval rows, and uploaded all 10 unlisted through
  `yt_queue.py upload --gate-ready` with video-first settings. Result:
  10 uploaded / 0 failed / 0 still pending. Current same-day count is 30
  uploaded on 2026-07-14 CT. Current queue evidence is 677 uploaded /
  0 pending / 0 no-MP4, pending release gate 0 ready / 0 needs_revision /
  0 blocked, and manifest alignment remains clean: 0 warnings across
  577 lessons. Captions, thumbnails, sync, and cleanup remain separate
  reconciliation/backlog work.
- Latest 10 uploaded: Statistics for Social Sciences M1-M10. Video IDs:
  `fx3zFkhiC54`, `qvREpxBTwKg`, `mSh2eq5hQh4`, `Co3_n5zKNDU`,
  `ehsmg29ReEg`, `J3FLexn_d5Q`, `YqLC9W0rVKY`, `Ba3_XkwSVLs`,
  `Uxzi9JfJvYo`, `wwqK9tva2oI`.
- Dirty risk handled: root cwd-drift `slides/` and `style_manifest.json`
  reappeared during the Statistics producer and were removed after confirming
  no producer/upload process was active. Do not stage generated lesson-video
  media or T9 artifacts.
- The 2026-07-14 03:00 CT approved foundation run produced Sociology M4-M13
  and uploaded all 10 unlisted through the gate-ready queue path. The run first
  stopped before upload on a parent-trust hard finding in Sociology M7 because
  the hypothetical example said `cannot afford tuition`; Codex rewrote that to
  `cannot afford college costs`, regenerated the M7 section 06 TTS/MP4,
  refreshed the review SHA bindings, reran parent-trust to `TRUST_READY`, wrote
  clean-pass approval rows, and uploaded via `yt_queue.py upload --gate-ready`
  with video-first settings. Result: 10 uploaded / 0 failed / 0 still pending.
  Current queue evidence is 667 uploaded / 0 pending / 0 no-MP4, pending
  release gate 0 ready / 0 needs_revision / 0 blocked, and manifest alignment
  remains clean: 0 warnings across 577 lessons. Captions, thumbnails, sync, and
  cleanup remain separate reconciliation/backlog work.
- Latest 10 uploaded: Sociology M10-M13 and M4-M9. Video IDs:
  `Fw-E93Z7YZg`, `0t1gO9ht8Ds`, `Z2PD9TftkUs`, `A3aYNebaOL8`,
  `oV3gPrwDga4`, `7qt6d6nRPtc`, `UunssyG72lo`, `LCNWiJZDtEI`,
  `5CtnSWT1iko`, `Gnk3S5Q3mEg`.
- Alan asked Codex to fix the stopped 10-video batch and continue uploading.
  The 2026-07-13 late run had produced Organizational Behavior &
  Communication M2-M8 and Sociology M1-M3, but parent-trust blocked before
  approval/upload. Codex repaired the hard findings (`always`/guarantee-like
  wording in OB M2 and `admissions clerk` in OB M5), refreshed stale TTS/MP4
  caches through the orchestrator path, reran parent-trust to `TRUST_READY`,
  wrote `approved_ready_to_upload.json`, and uploaded all 10 unlisted through
  `yt_queue.py upload --gate-ready`; result: 10 uploaded / 0 failed. Current
  queue evidence is 657 uploaded / 0 pending / 0 no-MP4, pending release gate
  0 ready / 0 needs_revision / 0 blocked, and manifest alignment remains clean:
  0 warnings across 577 lessons. The upload used the video-first lane
  (captions/thumbnail/sync/cleanup deferred).
- Latest 10 uploaded: Organizational Behavior & Communication M2-M8 and
  Sociology M1-M3. Video IDs: `T7Wd21neEjo`, `pArSmGnNBAs`,
  `lEC_zE1v1Ic`, `VFaimFI9Lec`, `d0M_1AI_9CQ`, `kESudedTS5I`,
  `gyfeGrXAZ1U`, `UlMZp9aICUs`, `_LRMZQYe48Q`, `Mgz_jjTvwSc`.
- Manifest generation now uses one canonical ordering helper across channel
  sync, local manifest build, and failed-lesson pruning. Courses sort
  alphabetically and modules sort numerically, so routine uploads no longer
  reorder most of `public/data/lessons-manifest.json`. Two deterministic-order
  tests pass, all three writer entrypoints load, and the current 577-lesson
  alignment audit remains at 0 warnings. The already-dirty manifest was not
  rewritten during this repair; it still needs a separate generated-data
  review before commit.
- Alan asked for another 10 videos and upload. The 2026-07-09 08:00 CT
  approved foundation run completed after one parent-trust repair: English IV
  Writing M5 used a standardized-testing / college-admissions debate example,
  the parent-trust audit blocked the public-facing admissions wording, and
  Codex rewrote that example to a school-uniforms / student-expression debate,
  regenerated TTS/MP4, and reran parent-trust to `TRUST_READY`. The orchestrator
  then uploaded 10 unlisted videos through `yt_queue.py upload --gate-ready`;
  result: 10 uploaded / 0 failed. Current queue evidence is 647 uploaded /
  0 pending / 0 no-MP4, pending release gate 0 ready / 0 needs_revision /
  0 blocked, and manifest alignment remains clean: 0 warnings across
  577 lessons. Remaining non-AP published modules needing completion/upload:
  254 of 901. The producer skipped English IV Writing M6/M13 because
  `open.lib.umn.edu` returned 403 for the resource check; that is a source
  repair/top-up issue, not an upload blocker.
- Latest 10 uploaded: English IV Writing M3-M5, M7-M12, and Organizational
  Behavior & Communication M1. Video IDs: `irSU5PuONbo`, `jc1cemPwF88`,
  `KvfAr-RP_P8`, `SUZoEhnWxpw`, `U5_3VKCbiV8`, `_xO5dR9NWXk`,
  `qpRKi6JXGbE`, `k92mE1BeaUs`, `o1AMPW11YyA`, `PNNRkIfoCaM`.
- Alan asked for another 10 videos and upload. The 2026-07-09 03:00 CT
  approved foundation run completed after one parent-trust repair: English IV
  Writing M2 used `admissions readers` as a genre-audience phrase, the
  parent-trust audit blocked it, and Codex softened the public narration/slide
  wording to `personal-statement readers`, regenerated TTS/MP4, reran Opus
  independent review, and reran parent-trust to `TRUST_READY`. The orchestrator
  then wrote the approval artifact and uploaded 10 unlisted videos through
  `yt_queue.py upload --gate-ready`; result: 10 uploaded / 0 failed. Current
  queue evidence is 637 uploaded / 0 pending / 0 no-MP4, pending release gate
  0 ready / 0 needs_revision / 0 blocked, and manifest alignment remains clean:
  0 warnings across 577 lessons. Remaining non-AP published modules needing
  completion/upload: 264 of 901. Root cwd-drift `slides/` and
  `style_manifest.json` were archived, not deleted, under
  `docs/archive/lesson-video-cwd-drift/2026-07-09-0517/`.
- Latest 10 uploaded: English IV Media Writing M6-M13 and English IV Writing
  M1-M2. Video IDs: `MkMfPb17Upo`, `ZlvRkzQtOrQ`, `KWp9Rr7ElII`,
  `86a89d97sfo`, `32vV3uwT_CI`, `dVEJ5gymtUE`, `jLF4oKZ7ZTY`,
  `lWLdX1fRGGQ`, `FbdXCkQkBgo`, `QlTJ7e-eLSQ`.
- Alan asked Codex to generate 10 more videos and upload. Codex used the
  approved `npm run lesson:foundation-daily` path with
  `FOUNDATION_MAX_MODULES=10` / `FOUNDATION_UPLOAD_MAX=10`. The run produced
  and uploaded 5 English IV Media Writing lessons (M1-M5), then stopped safely
  when Claude Code reported a session limit before selecting more modules. This
  was not a YouTube upload/channel limit. Current same-day upload evidence is
  30 uploaded on 2026-07-08 CT. Queue is now 628 total / 627 uploaded /
  1 pending / 0 no-MP4, and pending release gate is 1 ready /
  0 needs_revision / 0 blocked. Manifest alignment audit remains clean:
  0 warnings across 577 lessons. The pending ready item is English IV Media
  Writing M6; it is not in the current approval artifact and should wait for the
  next approved orchestrator pass after the cc session resets. Remaining
  non-AP published modules needing completion/upload: 274 of 901
  (G10: 9, G11: 8, G12: 165, no gradeLevel: 92).
- Latest 5 uploaded: English IV Media Writing M1-M5. Video IDs:
  `YrniQ3OgIPw`, `vJPxDmrGUR4`, `DZlKGwKUHbU`, `kjmtn7ALwHY`,
  `ku2eyoY0coc`.
- During the 23:20 CT follow-up, Codex archived the new root cwd-drift
  `slides/` and `style_manifest.json` artifacts into
  `docs/archive/lesson-video-cwd-drift/2026-07-08-2320/` after the producer
  stopped. Do not stage generated lesson-video media or T9 artifacts.
- Earlier on 2026-07-08, Alan asked whether GIIS can push toward 40 same-day
  uploads. The 40 count is a target, not permission to force weak lessons or
  bypass gates. Course-design cleanup is still needed for the visible
  11-module / 1-credit guard courses before a broad Grade 12 top-up.
- Alan approved archiving the duplicate old English IV AP-language slug folders
  on 2026-07-08. Codex moved, not deleted, the old M2/M3 folders into
  `teaching-videos/_archive/2026-07-08-english-iv-old-ap-language-slugs/`; the
  top-level English IV M2/M3 folders are now the neutral slugs only. After that,
  Codex uploaded four unlisted gate-ready/stale-repair lessons through
  `yt_queue.py upload --gate-ready`: English IV Advanced Composition M7
  `PdP21WhUXGY`, English IV Advanced Composition M8 `O2YVYGCpKbw`, English II
  Literature M9 `XPha-ZoA3V4`, and Algebra II M2 `wHUE73x_ICY`. No true
  YouTube upload/channel limit appeared. Current queue evidence: 602 total
  lesson folders, 601 uploaded, 1 pending upload, 0 no-MP4; pending release gate
  is 0 ready / 1 needs_revision / 0 blocked. The remaining pending item is
  Geometry M7, which is a quality/audit revision item and must not be forced.
  Public manifest alignment remains clean: 0 warnings across 576 lessons.
- Alan's 2026-07-06 late-night direct top-up request completed through the
  approved orchestrator path: 10 uploads succeeded, 0 failed, and no true
  YouTube upload/channel limit appeared. Current queue/dashboard evidence:
  604 total lesson folders, 603 with MP4, 602 uploaded, 2 pending upload, 0
  no-MP4; pending release gate is 2 ready / 0 needs_revision / 0 blocked.
  The 2 pending gate-ready lessons are English IV Advanced Composition M7
  `Citation & Academic Integrity` and M8 `The Analytical Essay`. The upload run
  selected 10 of 12 approved pending lessons and included both old slug and
  cleaned slug M2/M3 folders; their public titles/scripts are neutral, but this
  is now a reconciliation item to avoid duplicate logical modules surfacing in
  future manifest/public-library sync.
- Latest 10 uploaded: Economics Seminar M12-M13, English IV Advanced
  Composition M1, both M2 folder variants, both M3 folder variants, and English
  IV M4-M6. Video IDs: `sqph5_5rPh0`, `T2OugIFxIAs`, `20ku9RPGc-g`,
  `FCt8UYHhFRE`, `D5kS-6-SEoI`, `tG0wo7ng91c`, `sjaJupSOR3Y`,
  `5F2iewMEwxk`, `l9tg-WGZsSs`, `Ima2v3FpGis`.
- Public manifest alignment check after the run remains clean:
  `npm run audit:lesson-manifest` -> 0 warnings across 568 lessons. The upload
  command intentionally used `--no-sync`, so the new uploads still need the
  normal manifest/reconciliation pass before they are parent-visible through the
  website library.
- Alan's 2026-07-06 13:00 CT repair pass cleared the stopped-lane blockers.
  Economics Seminar M13's instructional "guaranteed solution" phrase was
  rewritten to avoid guarantee wording, and English IV Advanced Composition M3
  was rewritten from public-facing `AP Language: Argumentation` to
  `Argumentation and Line of Reasoning`. The English IV source course JSON was
  also cleaned so future M2-M4 generation uses neutral public titles
  (`Rhetorical Analysis`, `Argumentation and Line of Reasoning`, `Source
  Synthesis Essay`) instead of `AP Language:` titles. Current evidence:
  pending release gate 5 ready / 0 needs_revision / 0 blocked, parent-trust
  `TRUST_READY` for all 5 pending lessons, and `yt_queue.py upload --gate-ready
  --dry-run` selects all 5 with human approval. A real upload attempt was not
  sent to YouTube because `yt_queue.py upload --gate-ready --max 5` refused on
  the local quota estimate (`0 safe full uploads today`) before any external
  upload call.
- Alan approved scoped cleanup of root cwd-drift artifacts on 2026-07-05. The
  blocking root `slides/` / `style_manifest.json` artifacts were removed, and
  the 08:09 CT bounded runner resumed through the approved foundation path.
- Alan's 2026-07-06 08:00 CT producer lane is complete: it produced and
  uploaded 10 Economics Seminar lessons through the approved foundation path.
  The first upload attempt stopped correctly on parent-trust recall false
  positives; Codex tightened the deterministic classifier for behavioral
  economics subscription/framing dollar examples and environmental economics
  cap-and-trade quantity-guarantee language, verified compile + fixtures, reran
  parent-trust to `TRUST_READY`, wrote the approval artifact through the
  orchestrator, uploaded all 10 unlisted via `yt_queue.py upload --gate-ready`,
  and synced the public manifest.
- Latest 10 uploaded: Economics Seminar M2-M11. Video IDs: `sQ8n3pZrScE`,
  `lxOMri9mSNw`, `pPOnMxuySTE`, `8931GYQkvfk`, `EBRcU2qL4ko`,
  `offUIypBo_w`, `xE6RDeQ7-Qg`, `K-aWwkxdEo8`, `I9Gbx_mirEc`,
  `1DLZ_wUiG00`.
- Alan's 2026-07-06 03:00 CT producer lane is complete: it produced 10
  Economics Advanced / Economics Seminar lessons, stopped before upload on
  parent-trust recall false positives, then passed after a targeted audit
  classifier fix for economics monetary-policy money examples, instructional
  tuition/subsidy examples, and negated guarantee wording. The approved rerun
  wrote the approval artifact, uploaded all 10 unlisted through
  `yt_queue.py upload --gate-ready`, and synced the public manifest.
- Latest 10 uploaded: Economics Advanced M5-M13 and Economics Seminar M1.
  Video IDs: `Ees1Y-817YU`, `YGztGnkRy9M`, `YitzsZg91BY`,
  `ZYbgWlBv2cI`, `UDs0Sj8fkVc`, `acDNL0k7Cco`, `xIwipzvUco4`,
  `q1PxfxPrvdQ`, `MXoIIAUdFDg`, `icDkIEzmn3g`.
- 2026-07-05 20:00 CT top-up uploaded College Research & Writing M3-M8 and
  Economics Advanced M1-M4. Video IDs: `N0htezaYzJ0`, `vPZvS29eB3M`,
  `1FNGyfFfmrA`, `5RtXG9QCpy4`, `a1m8NwEzWfc`, `AiC-3xTM8jk`,
  `_oZeVP0Rpvo`, `WkxOGnIRc50`, `foFqzEBCg38`, `dD6fr0L0wBU`.
- Earlier same-day 18:01 CT run uploaded Calculus M7-M14 and College Research
  & Writing M1-M2. Video IDs: `dXLnLx7xf8Q`, `IgQJ55kaj8c`,
  `X7lBuHCmcnE`, `B8YqMnbdxzM`, `s_Pl4iv-48E`, `hIk6IMxdGMw`,
  `NbmhXtxUb64`, `0-oSRIzDh74`, `oAnavnxqjmg`, `pvtVSA5ni6Y`.
- Earlier same-day 13:03 CT run uploaded Business Strategy & Writing M5-M8 and
  Calculus M1-M6. Video IDs: `2X0XLtGkljg`, `NsfQ85bdbaE`,
  `BT7-yzM2T2w`, `zD9HBJFQE3g`, `f7FHILNMTeo`, `tPBwQ3yUQmo`,
  `u8CaK1j0bDA`, `FmlVO2i_epg`, `tAQi_WwzaSU`, `Ufq8DoGKNRQ`.
- Earlier same-day 08:09 CT run uploaded Behavioral Science M3-M8 and Business
  Strategy & Writing M1-M4. Video IDs: `ME9mtpULuOM`, `8fcmToZ3LHQ`,
  `hsdmgVuZsko`, `xUDSc8MGKXo`, `elKcNR3_gls`, `ngBmgZeqAFE`,
  `NWP5v2HJMmk`, `Pk3_uuXqh0I`, `YJYWwmjB_7A`, `0-WSaSVIGm4`.
- Queue: 612 uploaded / 7 pending / 1 no-MP4 after the 2026-07-08 15:11 CT
  upload run and current batch progress; active worker is English IV Media &
  Analytical Writing M6.
- Pending release gate: 7 ready / 0 needs_revision / 0 blocked for the current
  pending items. No new approval artifact exists yet; continue only through the
  normal approval and `yt_queue.py upload --gate-ready` path.
- Dirty risk: root `style_manifest.json` reappeared as an untracked
  cwd-drift artifact during the active producer. Do not stage it; defer cleanup
  until no producer/gate process is active.
- Artifact-backed uploads: 20 on 2026-07-06 CT, plus 10 after midnight on
  2026-07-07 CT.
- Public manifest remains aligned with 0 warnings across 576 lessons.
- No active producer, uploader, or reviewer process remained after the
  late-night run.
- No true YouTube upload/channel limit appeared; the only upload stop after
  repair was the local conservative quota estimate.
- Parent-trust audit was tightened again on 2026-07-06 after the Economics
  Seminar batch exposed false positives: behavioral-economics
  subscription/framing dollar examples and environmental-economics
  cap-and-trade quantity-guarantee language are now allowed only as instruction
  when not GIIS payment/admissions/outcome-facing. Fixture regression passed.
- Parent-trust audit was tightened again on 2026-07-06 after the Economics
  Advanced batch exposed false positives: economics policy money examples,
  externality tuition/subsidy examples, and negated "guarantee" wording are now
  allowed only as instruction when not GIIS payment/admissions/outcome-facing.
  The rerun returned `TRUST_READY` for all 10.
- Abnormal Psychology is still skipped by the course-design guard because its
  current module count is 11, outside the expected 12-16 range for a 1-credit
  course. This is a future course-design cleanup item, not an upload blocker.
- Business Law is also skipped by the course-design guard because its current
  module count is 11, outside the expected 12-16 range for a 1-credit course.
  This is a future course-design cleanup item, not an upload blocker.
- Corporate Finance, Counseling & Mental Health, and Digital Media & Society
  are also future course-design cleanup items for the same 11-module /
  1-credit guard.
- Repo root cwd-drift artifacts are dirty again after the 2026-07-17 10:02 run:
  root `slides/` and `style_manifest.json` are untracked. Do not stage generated
  lesson-video media, T9 artifacts, or these root artifacts into an unrelated
  commit; clean only in a scoped cleanup window.

Current interpretation:

- The 2026-07-22 06:00-08:45 CT heartbeat completed the approved primary
  5-cap pass plus the optional second 5-cap top-up. Digital Media & Society
  M1-M10 reached final release gate score 100, passed parent-trust as
  `TRUST_READY`, and uploaded unlisted with 0 failures. M9's parent-trust
  false-positive wording was repaired from "minimum wage guarantee(s)" to
  wage-protection language before re-render/upload; Digital Media theme
  handling was kept consistent with the existing literature/sepia course style.
- Current queue evidence after that run is 831 uploaded / 0 pending /
  0 no-MP4 / 831 total; pending release gate is 0/0/0. Manifest alignment is
  0 warnings across 768 lessons. This was not a YouTube upload/channel limit.
- Standard captions remain backlog under current policy. Do not promise captions
  on parent-facing pages until they are actually available and QA'd.
- T9 lesson media is active via the `teaching-videos/` symlink and must not be
  staged or force-added.
- Next lesson-video action: wait for the next two-hour heartbeat to process the
  last 4 safe candidates: Digital Media & Society M11-M12 and English IV -
  Writing & Communication M6/M13. Continue using only
  `yt_queue.py upload --gate-ready` after clean release/parent-trust gates.

## Durable Lesson-Video Rules

- Lesson-video producer/top-up cadence is every 2 hours, each capped at 5
  modules/uploads.
- As of 2026-07-15 14:57 CT, the Codex automation RRULE and the repo runner
  default both use this cadence/cap: `FREQ=HOURLY;INTERVAL=2` and
  `FOUNDATION_MAX_MODULES=5` / `FOUNDATION_UPLOAD_MAX=5`.
- Same-day count source is local `teaching-videos/**/script.json` YouTube fields
  converted to America/Chicago local date.
- The public manifest can lag; it is reconciliation evidence, not the capacity
  source of truth.
- Playlist membership is normal upload hygiene.
- Standard YouTube captions, thumbnails, manifest sync, and cleanup are
  backlog/reconciliation unless Alan explicitly authorizes those lanes.
- Never force weak lessons through quality gates just to hit volume.
- Upload only through `yt_queue.py upload --gate-ready`.

## Parent Trust / Sales Boundary

- Parent-facing trust matters more than automation volume.
- Lesson-video parent-trust audit now runs fixture regression before lesson
  audits and classifies keyword hits as semantic BLOCK/ALLOW decisions instead
  of adding one-off false-positive branches.
- Manual Review Sales Mode is the v1 sales path:
  reviewed applications can use reviewed manual Stripe invoice/payment-link
  evidence before account activation.
- Manual-review billing is now the source of truth for "is a student paid"
  (2026-07-21). Admin sets `Student.paidThroughDate` + `paymentPlan` +
  `paymentNote` on the student page (`PUT /api/students/:id/payment`); paid ==
  `paidThroughDate >= today`. The roster badge, the parent dashboard
  ("Tuition paid through <date>"), and access-gating all key off this field.
  Stripe stays a payment RAIL only; its recurring lifecycle is not trusted for
  status until webhook sync is verified. A Stripe subscription that reads
  "active" but whose `currentPeriodEnd` has lapsed is now surfaced as a payment
  issue, not a false green.
- Access-gating: `blockIfSoftLocked` blocks new work (enroll, module progress,
  quiz/assignment/exam) when `paidThroughDate` has lapsed; READ stays open
  (student can still see past/completed courses). Date-driven at request time,
  no cron. Students with no `paidThroughDate` (Stripe/unset) are unaffected.
- Transfer credit: enter accepted prior courses as `CourseRow` rows in a
  "Transfer Credit — Prior School" semester; credit-only courses leave the grade
  blank (count toward the 24-credit framework, excluded from GPA). Admin SOP +
  quick-entry card live at `/admin/transfer-sop`. The whole G12-transfer + manual
  billing + access flow was E2E-tested on production 2026-07-21 (test data
  cleaned).
- Automated Guided/Premium Stripe checkout remains blocked until live Stripe
  Price IDs and payment gates are green.
- `git push origin main` is the Netlify frontend deploy action for
  `genesisideas.school`; do not push casually.

## Non-Goals For Today

- Do not treat captions as a daily upload blocker.
- Do not stage or commit T9 `teaching-videos/` artifacts.
- Do not resume broad parent-facing copy or checkout changes unless the sales
  gate explicitly calls for it.
- Do not expand the video pipeline, captions lane, thumbnails lane, or broad
  cleanup lane unless Alan explicitly asks or a release gate requires it.
