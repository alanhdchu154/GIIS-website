# GIIS Website Roadmap

Last updated: 2026-06-24

This file is the current execution roadmap. Historical slot logs are archived in
`docs/archive/ROADMAP_DETAIL_2026-06-24-pre-slim.md` and git history.

## Current Priority

Keep the school trustworthy, operational, and parent-visible while the
foundation-video pipeline stabilizes. The next phase is proof over volume:
parents should see a serious school, a working dashboard, and course/video
quality that feels intentionally designed.

## Current Lesson-Video State

### Business Ethics & Critical Thinking

- Academic Writing M7-M8 uploaded at the 2026-06-24 03:00 CT slot:
  - M7 `qI-Zm9CWrYI`
  - M8 `ELX3loeOYjA`
- Academic Writing is now 8/8 uploaded.
- Business Ethics M1 exposed a real source-label mismatch: OpenStax Business
  Ethics URLs were labeled as MIT OpenCourseWare readings.
- The course JSON labels were repaired to OpenStax Business Ethics across the
  eight Business Ethics modules.
- Business Ethics M2 reached pre-render readiness:
  - `script.json`: 11 sections / 875 words
  - slides/contact sheet generated
  - three learning checks
  - reviewer A/B/C pass
  - expert-lens pass
  - OpenStax source alignment visible on slides 04 and 10
  - no raw URLs, AP claims, or accreditation claims
- Current gate status: `needs_review` only because MP4 is missing, which is
  expected before orchestrator TTS/MP4.

Next action:

1. Let the orchestrator complete Business Ethics M2 TTS/MP4.
2. Run independent review/source-alignment review.
3. Upload only through `yt_queue.py upload --gate-ready`.
4. Rerun Business Ethics M1 repair/review before upload.

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
- Do not expand the video pipeline before the Business Ethics source-alignment
  repair proves stable.
