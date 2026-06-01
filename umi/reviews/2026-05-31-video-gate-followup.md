# Foundation Video Gate Follow-Up

Generated: 2026-05-31

## Current gate result

`python3 tools/lesson-video/lesson_release_gate.py --check`

- Evaluated: 10
- Ready: 3
- Needs revision: 7
- Blocked: 0

## Ready

- `teaching-videos/algebra-i-module-6-inequalities-interval-notation-v2`
- `teaching-videos/algebra-i-module-7-introduction-to-functions-v2`
- `teaching-videos/english-i-module-2-parts-of-speech-v2`

## Needs revision before further website sync

- `teaching-videos/algebra-i-module-1-variables-algebraic-expressions-v2`
- `teaching-videos/algebra-i-module-2-order-of-operations-v2`
- `teaching-videos/algebra-i-module-3-properties-of-real-numbers-v2`
- `teaching-videos/algebra-i-module-4-solving-one-step-two-step-v2`
- `teaching-videos/algebra-i-module-5-solving-multi-step-equations-literal-v2`
- `teaching-videos/algebra-i-module-9-slope-rate-change-v2`
- `teaching-videos/biology-module-1-chemistry-of-life-v2`

Primary live-gate issue: reviewer JSON is stale or not bound to the current `script.json` hash. Uploaded lessons may also show a cleanup note when a YouTube block exists but `.cleaned` is absent.

## Recommendation

Do not publish or sync any additional website lesson-manifest entries from the needs-revision group until one of these is true:

1. reviewers are re-run against the current script and the live gate returns clean score 100, or
2. the lesson is intentionally removed from the public manifest / YouTube queue and kept as a failed draft.

The dashboard now uses live audit data instead of stale lesson-quality snapshots, so the dashboard should be treated as the operational source for current video readiness.
