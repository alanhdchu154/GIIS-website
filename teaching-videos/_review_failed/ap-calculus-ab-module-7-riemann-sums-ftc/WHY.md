# HALT (low-urgency) — ap-calculus-ab-module-7-riemann-sums-ftc

**Flagged by**: Reviewer B (Adversarial Student) — critical (5 issues, 3 marked critical)
**Verdict matrix**: A (Math PhD) = minor (2) · B = critical (5) · C (citation) = minor (3)
**Run**: Slot A retroactive cascade · 2026-05-21T04:08Z

## ⚖️ Orchestrator assessment: NOT a factual error — escalated only to honor the "any-critical halts" rule

Per AUTO_PIPELINE.md the cascade halts a module if ANY reviewer says critical, so this folder exists. **But the narration was independently verified against the actual script.json and is mathematically correct.** The subject-matter PhD (Reviewer A) and the anti-hallucination citation checker (Reviewer C) both returned only *minor*. Reviewer B's three "critical" items are **omissions of additional exam-tested variants**, not false statements. A human should treat this as a *content-enhancement-for-next-re-record* item, not an urgent retraction.

This module is **broadcast-locked** (`youtube.video_id: tILIe138--k`), so `script.json` was NOT edited (would diverge on-disk text from the live video, per the AP Bio M4/M5/M6 precedent).

## What B flagged, and the verification

1. **`06_riemann_concavity` — left/right over/under rule "stated as absolute."**
   Actual text: *"On an INCREASING function, left-endpoint sums UNDER-estimate and right-endpoint sums OVER-estimate. On a DECREASING function, it flips..."* — this is **correctly conditioned on monotonicity** and is standard AP teaching. B's worry is a student applying it to a function that's monotonic on only part of the interval. Legitimate enhancement: add "...as long as it's increasing/decreasing across the WHOLE interval." Severity in reality: **minor**.

2. **`06_riemann_concavity` — no concavity-based trapezoid/midpoint rule; only "midpoint usually beats both."**
   True gap. Trapezoid over-estimates on concave-up / under-estimates on concave-down (midpoint mirrors). Not strictly required at AB depth, and "midpoint usually beats both" is acceptable. The section slug references concavity but the narration is about monotonicity — slight title/content mismatch. Severity in reality: **minor**.

3. **`13_ftc_part1` — covers upper-bound chain-rule variant but omits the variable-LOWER-bound (negative sign) case and the f-continuity hypothesis.**
   Actual text correctly handles the upper-bound `g(x)` chain-rule case. The lower-bound variant `d/dx ∫_{g(x)}^{a} f = −f(g(x))·g'(x)` is a tested AP variant that is **omitted** (not mis-stated). Continuity-of-f hypothesis is also unstated (common in intro lessons). Severity in reality: **minor omission** of a tested variant — the strongest case for a future fix.

4. (B-minor) `07_definite_integral` — "all converge to the same number" lacks an integrability/continuity caveat. Minor.
5. (B-minor) `02_hook` — "area is how far you traveled" works only because velocity is positive; distance-vs-displacement subtlety deferred to recap (which does say "signed area"). Minor.

## Recommended human action (low priority)
- If/when M7 is re-recorded for any reason, add: (a) the "whole-interval" monotonicity qualifier in 06, and (b) the variable-lower-bound FTC sign-flip in 13 (the most exam-relevant addition).
- Otherwise no action needed — the live video is correct as far as it goes. A one-line YouTube-description note on the lower-bound FTC variant would fully close item 3 cheaply.

## Reopen protocol
On human resolution, move to `_review_resolved/ap-calculus-ab-module-7-riemann-sums-ftc/` with a STATUS line. Future auto-runs: leave M7 alone (script.json exists, broadcast-locked).
