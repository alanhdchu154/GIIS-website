# AP Biology Module 4 — Cell Communication

> Retroactive audit flag, not a fresh halt. Lesson script.json and slides already exist (generated in earlier auto-pipeline run without review cascade). The 3-reviewer cascade was run retroactively on 2026-05-20 and Reviewer C flagged the script as `critical` due to unsupported specific claims. **The folder has NOT been moved** — this marker exists so the next human pass / future agent knows the script needs revision before YouTube upload.

## Verdicts (round 1, retroactive)
- Reviewer A (Peer PhD, cell biology): `minor`
- Reviewer B (Adversarial student): `minor`
- Reviewer C (Citation checker against `references/ap-biology-ced.md` lines 168-225): `critical` — 6 unsupported claims out of ~38 traced

## Highest-leverage fixes
1. **Section `01_title` + `10_pause1_silence`** — "10–15% of AP exam" and "100 × 100 × 100 = one million" amplification math are not in the CED excerpt (the CED says "thousands"). Either drop the specific numbers or add citations.
2. **Section `05_reception_3stages`** — "In the nineteen-fifties, Earl Sutherland…" — CED names Sutherland but does not date him. Either source the 1950s claim or remove the decade.
3. **Section `06_receptor_gpcr`** — "the G protein swaps GDP for GTP, then drifts off" is imprecise. The CED-aligned phrasing is that the **alpha subunit** dissociates. Small fix; helps with AP stem diagrams.
4. **Quorum sensing** — CED explicitly includes autoinducers, biofilms, and *Vibrio fischeri*. The current script demotes this to a single recap line. Promote to its own beat.

## Recommended action
`revise-narration` — surgical edits to ~6 lines in script.json. No need to regenerate slides or rebuild from scratch. Reviewer A and B agree the core science is correct and AP-aligned.

## Why this isn't a regenerate
- script.json and slides already exist on disk; folder was NOT moved per `_review_failed/` SOP because doing so would break the Mac TTS+upload pipeline that may have already processed neighboring modules.
- Per CLAUDE.md, "trust" is the first parent-payment lens: ship-as-is risks teaching the alpha-subunit mistake. But the cost of regenerating is higher than the cost of a 6-line narration tweak.

## ⚠️ BROADCAST CONSTRAINT — added 2026-05-20 Slot B
This script is already broadcast on YouTube — `youtube.video_id` = `qwUfhZFQjZA` (uploaded 2026-05-19). Patching `script.json` directly is **unsafe**: it would diverge the on-disk narration from the recorded video, and any future regen+TTS run would produce a different MP4 than what parents/students already see on YouTube.

Two safe paths for resolution (deferred to human / Alan):
1. **Re-record & re-upload** — apply the surgical narration edits to script.json, regen TTS audio, re-render MP4, replace YouTube video (private→re-upload or use YouTube's "upload new version" feature). Most expensive but honest.
2. **YouTube description errata** — leave script.json alone; add a pinned correction in the YouTube description (e.g., "Errata: Sutherland's three-stage framework wasn't dated; G-protein alpha-subunit dissociates, not the whole G-protein"). Cheaper but lower-visibility correction.

Slot B explicitly did NOT touch script.json for this module to avoid script/video divergence.

## Source-of-truth files
- `teaching-videos/ap-biology-module-4-cell-communication/_review_A.json`
- `teaching-videos/ap-biology-module-4-cell-communication/_review_B.json`
- `teaching-videos/ap-biology-module-4-cell-communication/_review_C.json`
