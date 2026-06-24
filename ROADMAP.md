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

### 2026-06-24 08:00 CT Producer Slot

- Academic Writing M7-M8 uploaded at the 2026-06-24 03:00 CT slot:
  - M7 `qI-Zm9CWrYI`
  - M8 `ELX3loeOYjA`
- Academic Writing is now 8/8 uploaded.
- Business Ethics M1 exposed a real source-label mismatch: OpenStax Business
  Ethics URLs were labeled as MIT OpenCourseWare readings.
- The course JSON labels were repaired to OpenStax Business Ethics across the
  eight Business Ethics modules.
- Business Ethics M1-M8 are now uploaded and in the course playlist:
  - M1 `qkQ6apyz4Vs`
  - M2 `2XlmcWbGrBQ`
  - M3 `qD78x47mX0k`
  - M4 `bbZn-y5bxxQ`
  - M5 `Q9fcg34m1HU`
  - M6 `4gC_815uLQ4`
  - M7 `Ny5u5G-KfDM`
  - M8 `eOYe7psDt1E`
- Business Research Methods M2 uploaded: `Km6JYWu7R9A`.
- Today's artifact-backed upload count is 11 for 2026-06-24 CT.
- Dashboard/build/manifest checks passed after the run:
  - `npm run lesson:video-dashboard`
  - `npm run build`
  - `node tools/youtube-upload/audit_manifest_alignment.js`
  - `git diff --check`

Next action:

1. Leave Business Research Methods M1 unuploaded until parent-trust wording and
   `_review_source_alignment.json` are repaired cleanly.
2. At the next producer slot, continue deterministic Grade 11 sequence from
   Business Research Methods, without treating "no repair material" as a stop.
3. Upload only through `yt_queue.py upload --gate-ready`.

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
