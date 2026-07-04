# GIIS Website Roadmap

Last updated: 2026-07-04 05:29 CDT

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

Last refreshed: 2026-07-04 05:29 CDT.

Detailed slot-by-slot lesson-video evidence from 2026-06-24 through 2026-07-03
is archived in `docs/archive/ROADMAP_DETAIL_2026-07-03-lesson-video-slots.md`
and older pre-slim history is in
`docs/archive/ROADMAP_DETAIL_2026-06-24-pre-slim.md`.

Current operating state:

- Alan's 2026-07-04 03:00 CT producer slot is complete: 10 Trigonometry
  lessons were generated, passed parent-trust/release gates, and uploaded
  unlisted.
- Latest 10 uploaded: Trigonometry M5-M14.
- Queue: 522 uploaded / 0 pending / 0 no-MP4.
- Pending release gate: 0 ready / 0 needs_revision / 0 blocked.
- Dashboard: 522 lessons / 521 MP4 / 522 uploaded / pending_upload=0.
- Public manifest remains at 488 manifest lessons with 0 alignment warnings;
  the approved upload path used `--no-sync`, so manifest/channel sync remains
  reconciliation work rather than an upload blocker.
- No active producer, uploader, or reviewer process remained after the final
  run.
- No YouTube upload/channel limit appeared.

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
