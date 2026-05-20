# AP Biology Module 5 — Cell Cycle and Division

> Retroactive audit flag, not a fresh halt. script.json and slides already exist; folder NOT moved. This marker says "needs revision before YouTube upload."

## Verdicts (round 1, retroactive 2026-05-20)
- Reviewer A (Peer PhD, cell biology): `minor`
- Reviewer B (Adversarial student): `minor`
- Reviewer C (Citation checker against `references/ap-biology-ced.md` lines 228-289): `critical` — three specific unsupported numbers/sources

## Highest-leverage fixes
1. **Section `05_interphase_detail`** — current phrasing risks the misconception that G1 cells are haploid because "DNA is still one copy per chromosome." Add an explicit "ploidy stays 2n; only chromatid count changes across S" guardrail. Both A and B flagged this; it's the load-bearing science issue.
2. **Section `02_hook`** — "3.8 million new cells every second" is a real Sender & Milo (2016) stat but unsourced in script and not in the CED window. Either cite or soften to "millions per second."
3. **Section `01_title` + `16_path`** — "10–15% of exam," "OpenStax Chapter 10," "Khan Academy" — none have CED support in the lines 228-289 window. Acceptable as pointers but flag for human pass.

## Recommended action
`revise-narration` — fixes are localized to sections 01, 02, 05, 16. Core mitosis/cytokinesis content is correct.

## Source-of-truth files
- `teaching-videos/ap-biology-module-5-cell-cycle/_review_A.json`
- `teaching-videos/ap-biology-module-5-cell-cycle/_review_B.json`
- `teaching-videos/ap-biology-module-5-cell-cycle/_review_C.json`

## ⚠️ BROADCAST CONSTRAINT — added 2026-05-20 Slot B
This script is already broadcast on YouTube — `youtube.video_id` = `OJDjXPhi9qI`. Same constraint as M4: patching `script.json` would diverge the on-disk narration from the recorded video. Slot B did NOT touch script.json.

Two safe paths for human resolution:
1. **Re-record & re-upload** — apply the narration patch, regen TTS, re-render MP4, replace on YouTube. The G1-ploidy guardrail is load-bearing science and arguably worth the re-record cost.
2. **YouTube description errata** — pinned correction noting "G1 cells stay diploid (2n); only chromatid count changes across S phase. The 3.8M cells/sec figure is from Sender & Milo (2016)."
