# HALT — ap-calculus-ab-module-4-contextual-applications

**Flagged by**: Reviewer A (Peer Subject-Matter Reviewer, Math PhD)
**Run**: Slot A retroactive cascade · 2026-05-21T04:08Z
**Verdict matrix**: A = critical (1) · B = minor (5) · C = minor (2)

## The critical issue (confirmed against script.json)

Section `09_related_rates_ladder`. The narration says, verbatim:

> "...Solve: **d y d t equals negative eight-thirds** — about minus one-point-three-three feet per second."

This is internally inconsistent and the spoken fraction is **wrong**.

Sliding-ladder related rate, 10-ft ladder so x² + y² = 100. Differentiate:
2x·(dx/dt) + 2y·(dy/dt) = 0. At y = 6, x = 8, dx/dt = 1:

  2(8)(1) + 2(6)(dy/dt) = 0 → 16 + 12·(dy/dt) = 0 → **dy/dt = −16/12 = −4/3 ≈ −1.33 ft/s**

So the correct fraction is **−4/3** (= −1.33, which matches the decimal the narration then quotes). The spoken "**negative eight-thirds**" equals −2.67, which contradicts its own "−1.33" in the same sentence. A student writing down "−8/3" would lose points.

Everything else Reviewer A checked is correct: motion signs, balloon dV/dt = 200π (≈628) in `11_pause1_solution`, linearization, and L'Hospital indeterminate-form handling. The defect is a single arithmetic slip in one sentence.

## ⚠️ BROADCAST CONSTRAINT — why this run did NOT patch script.json

This module is **already uploaded to YouTube** (`youtube.video_id: UhKPnybUhdU`). Per `AUTO_PIPELINE.md` ("Don't generate content for already-uploaded modules") and the established AP Biology M4/M5/M6 precedent (2026-05-20 Slot B), editing `script.json` now would make the on-disk narration **diverge from the recorded video** — the script would say "−4/3" while the live video still says "−8/3". That hidden divergence is worse than a known, documented error. So this run leaves `script.json` untouched and escalates here for a human decision.

## Options for a human (pick one)

1. **YouTube description errata (cheapest, fastest).** Pin a correction on video `UhKPnybUhdU`: "Correction at the ladder example: dy/dt = −4/3 ft/s (≈ −1.33), not −8/3. The −1.33 decimal stated is correct." Lowest visibility but immediate.
2. **Re-record + re-upload section 09** (most honest, most expensive). If you re-record, FIRST patch `script.json` section `09_related_rates_ladder` to say "negative four-thirds" so the on-disk script matches the new video, THEN re-render audio/MP4 and replace the YouTube video. Only after the new upload is live should the on-disk script be considered authoritative again.
3. **In-product overlay note** on the Learn Portal module page (a small "Correction" callout under the embedded video), if re-recording isn't worth it yet.

Recommended: **Option 1 now** (it's a one-line errata and the correct decimal is already spoken), schedule **Option 2** for the next batch re-record pass.

## Reopen protocol
If a human fixes this (re-record or accepts errata), move this folder to `_review_resolved/ap-calculus-ab-module-4-contextual-applications/` with a STATUS line, mirroring how AP Bio M8 was resolved. Until then, future auto-runs must leave M4 alone (do not regenerate — `script.json` exists and is broadcast-locked).
