# GIIS Website Roadmap

Last updated: 2026-07-12 09:40 CDT

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

Last refreshed: 2026-07-12 09:15 CDT.

Detailed slot-by-slot lesson-video evidence from 2026-06-24 through 2026-07-03
is archived in `docs/archive/ROADMAP_DETAIL_2026-07-03-lesson-video-slots.md`
and older pre-slim history is in
`docs/archive/ROADMAP_DETAIL_2026-06-24-pre-slim.md`.

Current operating state:

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
- Repo root cwd-drift artifacts are currently clean after scoped cleanup; root
  `slides/` / `style_manifest.json` reappeared during the 18:01 CT run and were
  removed after upload. Do not stage generated lesson-video media or T9
  artifacts.

Current interpretation:

- The video queue is clean, but that does not mean no production work exists.
  Future work should be selected from parent trust, course quality, and Alan's
  explicit production requests rather than volume-chasing.
- Standard captions remain backlog under current policy. Do not promise captions
  on parent-facing pages until they are actually available and QA'd.
- T9 lesson media is active via the `teaching-videos/` symlink and must not be
  staged or force-added.
- Next lesson-video action: repair or regenerate Geometry M7 so the release
  gate returns to ready; then upload only through `yt_queue.py upload
  --gate-ready`. The English IV old AP-language slug duplicate is archived and
  is no longer the active upload blocker.

## Durable Lesson-Video Rules

- Daily producer slots are 03:00 / 08:00 / 13:00 / 18:00 CT, each capped at 10
  modules/uploads.
- The 20:00 CT lane is dashboard/count/top-up only to 40.
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
- Automated Guided/Premium checkout remains blocked until live Stripe Price IDs
  and payment gates are green.
- `git push origin main` is the Netlify frontend deploy action for
  `genesisideas.school`; do not push casually.

## Non-Goals For Today

- Do not treat captions as a daily upload blocker.
- Do not stage or commit T9 `teaching-videos/` artifacts.
- Do not resume broad parent-facing copy or checkout changes unless the sales
  gate explicitly calls for it.
- Do not expand the video pipeline, captions lane, thumbnails lane, or broad
  cleanup lane unless Alan explicitly asks or a release gate requires it.
