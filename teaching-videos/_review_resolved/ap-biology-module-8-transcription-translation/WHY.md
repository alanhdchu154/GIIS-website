# AP Biology Module 8 — Gene Expression (Transcription & Translation)

> Retroactive audit flag, not a fresh halt. script.json and slides already exist; folder NOT moved. This marker says "needs revision before YouTube upload."

## Verdicts (round 1, retroactive 2026-05-20)
- Reviewer A (Peer PhD, molecular biology): `minor`
- Reviewer B (Adversarial student): `minor`
- Reviewer C (Citation checker against `references/ap-biology-ced.md` lines 423-504): `critical` — multiple unsupported specific claims, plus shaky numerics

## Highest-leverage fixes
1. **Section 07 / 15 — "~20,000 human genes → 100,000 proteins, fewer than a grain of rice."** All three reviewers flagged this. The numbers are unsupported by the CED excerpt and the rice comparison is factually shaky (rice has comparable or more genes than humans). Replace with qualitative framing: "few enough genes that alternative splicing matters."
2. **Section 05 — template vs coding strand never disambiguated.** AP FRQ trap.
3. **Section 09 — wobble is omitted entirely.** CED-aligned; add a line.
4. **Section 13 — lac operon is missing the CAP/cAMP positive-regulation layer.** The CED explicitly calls this out and AP FRQs love it. One added sentence.
5. **Crick "1958 sketch"** date — unsupported by CED, drop the year.
6. **snRNPs** as the spliceosome name; **Shine-Dalgarno** for prokaryotic translation initiation — small lifts that align with the CED.

## Recommended action
`revise-narration` — surgical edits to ~5-7 lines in script.json. The script is structurally well-aligned to CED Unit 6 and ~80% of claims are supported. No regenerate.

## Source-of-truth files
- `teaching-videos/ap-biology-module-8-transcription-translation/_review_A.json`
- `teaching-videos/ap-biology-module-8-transcription-translation/_review_B.json`
- `teaching-videos/ap-biology-module-8-transcription-translation/_review_C.json`

## ✅ STATUS — patched 2026-05-20 Slot B
M8 was NOT yet uploaded to YouTube (`youtube.video_id` absent in pre-patch script.json), so on-disk surgical patch was safe. Slot B applied the surgical edits per the highest-leverage list:

- `02_hook` — dropped unsupported "1958" Crick date; kept the dogma framing.
- `05_transcription` — added explicit template-vs-coding-strand disambiguation (AP FRQ trap).
- `06_mrna_processing` — formally named the spliceosome components as snRNPs (small nuclear ribonucleoproteins).
- `07_alternative_splicing` — removed the unsupported "20k genes / 100k proteins / fewer than rice" framing; replaced with qualitative phrasing ("surprisingly modest gene count … few enough genes that alternative splicing matters").
- `09_codons_trnas` — added a wobble-pairing paragraph (CED-aligned).
- `12_translation_steps` — disambiguated eukaryotic 5'-cap-scanning vs prokaryotic Shine-Dalgarno initiation.
- `13_gene_regulation` — added the CAP/cAMP positive-regulation layer for the lac operon ("full blast only when lactose is present AND glucose is low").
- `15_recap` — removed rice claim, added snRNPs + CAP-cAMP mentions; preserved structure.

A round-2 Reviewer C re-run is queued — see `_review_C_v2.json` once written. If verdict is `minor` or `pass`, this `_review_failed/` marker should be moved or deleted by the next agent.
