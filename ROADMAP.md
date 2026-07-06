# GIIS Website Roadmap

Last updated: 2026-07-05 22:51 CDT

This file is the current execution roadmap. Historical slot logs are archived in
`docs/archive/ROADMAP_DETAIL_2026-07-03-lesson-video-slots.md`,
`docs/archive/ROADMAP_DETAIL_2026-06-24-pre-slim.md`, and git history.

## Current Priority

Keep the school trustworthy, operational, and parent-visible while the
foundation-video pipeline stabilizes. The next phase is proof over volume:
parents should see a serious school, a working dashboard, and course/video
quality that feels intentionally designed.

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

Last refreshed: 2026-07-05 22:51 CDT.

Detailed slot-by-slot lesson-video evidence from 2026-06-24 through 2026-07-03
is archived in `docs/archive/ROADMAP_DETAIL_2026-07-03-lesson-video-slots.md`
and older pre-slim history is in
`docs/archive/ROADMAP_DETAIL_2026-06-24-pre-slim.md`.

Current operating state:

- Alan approved scoped cleanup of root cwd-drift artifacts on 2026-07-05. The
  blocking root `slides/` / `style_manifest.json` artifacts were removed, and
  the 08:09 CT bounded runner resumed through the approved foundation path.
- Alan's 2026-07-05 20:00 CT top-up lane is complete: it reused the approved
  foundation path after the 18:01 CT run, found 10 existing gate-ready lessons,
  reran parent-trust after a targeted audit false-positive fix, wrote the
  approval artifact, and uploaded all 10 unlisted through
  `yt_queue.py upload --gate-ready`.
- Latest 10 uploaded: College Research & Writing M3-M8 and Economics Advanced
  M1-M4. Video IDs: `N0htezaYzJ0`, `vPZvS29eB3M`, `1FNGyfFfmrA`,
  `5RtXG9QCpy4`, `a1m8NwEzWfc`, `AiC-3xTM8jk`, `_oZeVP0Rpvo`,
  `WkxOGnIRc50`, `foFqzEBCg38`, `dD6fr0L0wBU`.
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
- Queue: 572 uploaded / 0 pending / 0 no-MP4.
- Pending release gate: 0 ready / 0 needs_revision / 0 blocked.
- Same-day artifact-backed uploads: 40 on 2026-07-05 CT.
- Public manifest remains at 488 manifest lessons with 0 alignment warnings;
  the approved upload path used `--no-sync`, so manifest/channel sync remains
  reconciliation work rather than an upload blocker.
- No active producer, uploader, or reviewer process remained after the final
  run.
- No YouTube upload/channel limit appeared.
- Parent-trust audit was tightened again on 2026-07-05 after the Economics
  Advanced batch exposed false positives: economics money examples such as
  MR/MC, demand schedules, budget lines, fixed/variable cost, and firm/consumer
  quantities are now allowed as instruction when not school-facing; `AP` is
  allowed only in Average Product / marginal product economics context. The
  rerun returned `TRUST_READY` for all 10.
- Abnormal Psychology is still skipped by the course-design guard because its
  current module count is 11, outside the expected 12-16 range for a 1-credit
  course. This is a future course-design cleanup item, not an upload blocker.
- Business Law is also skipped by the course-design guard because its current
  module count is 11, outside the expected 12-16 range for a 1-credit course.
  This is a future course-design cleanup item, not an upload blocker.
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
- Next lesson-video action, if Alan asks for more production: refresh no-overlap,
  queue, pending release gate, and manifest alignment first; then use the
  bounded foundation runner with Sonnet for production and Opus for independent
  review.

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
