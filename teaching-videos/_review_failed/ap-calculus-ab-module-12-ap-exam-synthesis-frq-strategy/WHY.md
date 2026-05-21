# HALT — ap-calculus-ab-module-12-ap-exam-synthesis-frq-strategy

**Flagged by**: Reviewer C (Citation Checker) = critical (1) AND Reviewer B (Adversarial Student) = critical (7)
**Verdict matrix**: A (Math PhD) = minor (2) · B = critical (7) · C = critical (1)
**Run**: Slot A retroactive cascade · 2026-05-21T04:08Z
**Broadcast-locked**: `youtube.video_id: uTPv-VyklTw` — `script.json` NOT edited (would diverge on-disk text from the live video; AP Bio M4/M5/M6 precedent).

## CONFIRMED factual error (the real one — verified against script.json)

Section `03_overview`, verbatim:
> "Three things. One — how the exam is actually built. **Two sections, ninety minutes each, fifty-fifty weighted.**"

This is **wrong**. Per the CED: Section I (Multiple Choice) = **105 minutes**, Section II (Free Response) = **90 minutes**. They are NOT "90 minutes each." It also **contradicts the very next teaching slide** `04_exam_structure`, which correctly says "three hours fifteen minutes total" (105 + 90 = 195 min). A student hears two different exam lengths 30 seconds apart, and the first one is false.

Reviewer C (the number-checker, anti-hallucination) isolated this exactly and confirmed that **every number in `04_exam_structure`, `15_recap`, and `16_path` matches the reference perfectly** — the sole structural error is the "ninety minutes each" line in the overview.

## Genuine strategy concern (Reviewer B — worth a human look)

Section `14_time_budget`:
> "Do parts a and b of every problem first... Then come back for parts c and d..."

Reviewer B flags that Section II is split into **Part A (2 questions, 30 min, calculator)** and **Part B (4 questions, 60 min, NO calculator)**, and the calculator is only available during Part A's 30-minute window. A "defer and come back" strategy, if applied across that boundary, can't work for the Part A calculator problems once their time closes. The narration's advice is generic FRQ triage and is ambiguous on this logistics boundary. Severity: real but **strong-minor** (it's exam-logistics nuance, not a math error). Worth tightening if M12 is ever re-recorded.

## Reviewer B items that are NOT load-bearing (for the record)
- B's first "critical" on `04_exam_structure` **reconciles itself** — B re-checked and concluded the structure numbers are correct ("No false belief from this section alone"). Mislabeled; ignore.
- `12_calculator_hygiene`: the "≥3 decimal places" rule is correctly scoped to "the calculator section" in the actual text — B's over-generalization worry is a stretch. Minor.
- Minors: "six patterns show up every single year" overstates (FRQ type mix rotates); "same number twice loses a point" (`07`) and "setup often scores one of two points" (`14`) overstate fixed rubric mechanics; `10` overstates that naming the FTC by name is a separately-scored rubric line. All are coaching-tone overstatements, not falsehoods.

## Recommended human action
1. **YouTube description errata now (cheap):** "Correction at the overview: the two sections are NOT 90 minutes each — Section I (MC) is 105 min and Section II (FRQ) is 90 min, 3h15m total. The detailed breakdown later in the video is correct."
2. **Next re-record (when batching):** fix `03_overview` to "Section One is 105 minutes, Section Two is 90 minutes, fifty-fifty weighted," and tighten `14_time_budget` to respect the Part A calculator-collection boundary. If you re-record, patch `script.json` FIRST so on-disk matches the new video.

## Reopen protocol
On resolution, move to `_review_resolved/ap-calculus-ab-module-12-ap-exam-synthesis-frq-strategy/` with a STATUS line (mirror AP Bio M8). Until then future auto-runs leave M12 alone (script.json exists, broadcast-locked).
