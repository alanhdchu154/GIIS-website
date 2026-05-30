# GIIS Lesson Auto-Pipeline (SOP for Cowork Scheduled Task)

> 2026-05-30 status: AP lesson generation is deferred until GIIS has explicit
> approval to make AP-facing claims. For current work, use
> `FOUNDATION_VIDEO_PLAYBOOK.md` and a Umi-approved handoff under
> `umi/handoffs/`. Do not run the old AP-oriented batch flow.

> **You are the Cowork-scheduled Claude session triggered on a daily / weekly
> cadence to generate new lesson content from College Board references.**
>
> Read this entire doc before doing anything. It is the working agreement
> between past-Alan, past-Claude, and the future-Claude reading this. The
> repo state on disk + this SOP + the `references/` folder is all you need.
>
> This sits **above** `AGENT_RECIPE.md`. That doc tells a sub-agent how to
> write ONE lesson folder. This doc tells you (the orchestrator) how to plan
> a whole course, run the generator + reviewer cascade, and stay safe across
> daily runs.

---

## ⚠️⚠️⚠️ HARD QUALITY REQUIREMENT — REGRESSION ALERT ⚠️⚠️⚠️

**Read this first. Do not deviate.**

## Umi-led production split

Umi is the GIIS principal-assistant / academic editor layer. Claude Code is the
production engineer.

For lesson work, do not treat "generate a lesson" as one monolithic AI task.
Use this division:

- **Umi owns** lesson concept, scope, narration quality, misconception strategy,
  AP/content correctness judgement, parent-facing school quality, and final
  release review.
- **Claude Code owns** repository mechanics: reading course/reference files,
  creating `script.json` and `build_slides.py` from an approved brief, rendering
  slides/MP4/transcript/contact sheets, running audits, fixing deterministic
  pipeline bugs, and preparing upload artifacts.

If a handoff exists under `umi/handoffs/`, follow it before inventing a lesson
from scratch. If the handoff conflicts with this file, stop and ask for
clarification unless the handoff is stricter.

The source of truth for lesson numbering is the course JSON under
`server/prisma/courses/**/*.json`, not an existing `teaching-videos/` folder
name. Before producing a lesson, read the course JSON, confirm the module
`order` and `title`, and write the target folder/module metadata to match that
published Learn Portal syllabus. If an older lesson folder uses a different
numbering scheme, treat it as legacy reference material only.

Unattended upload is only allowed for lessons that the release gate marks
`ready_to_upload`. A rendered MP4 by itself is not permission to upload.

In May 2026, a Cowork run produced AP Biology M1-M9 by **skipping the 3-reviewer
cascade** — generator wrote outline, lesson writer wrote script.json directly,
nobody verified the narration for factual errors or hallucinations. Alan
expressly opted out of human review. The cascade IS our only QC. Skipping it
is **not allowed**.

Concrete artifact contract — for EACH produced module, the folder MUST
contain ALL of these before the module is counted as "produced":

```
teaching-videos/<slug>/
├── _outline.json          ← Stage 1 generator output
├── _review_A.json         ← Peer Reviewer (Subject-Matter PhD)
├── _review_B.json         ← Adversarial Student (pedagogical holes)
├── _review_C.json         ← Citation Checker (anti-hallucination)
├── script.json            ← Stage 3 (writer) — only after ALL reviewers pass
├── build_slides.py        ← slide generator
├── slides/*.png           ← rendered slides (run build_slides.py)
├── contact-sheet.jpg      ← rendered visual QA sheet
├── learning_check.json    ← 3-6 checks for the target misconception/skill
├── assets_manifest.json   ← if any sourced/generated bitmap is used
├── intro_music.wav, outro_music.wav
```

If round 1 reviewers flag ≥2 "minor" issues → revise outline once, run round 2
(`_review_A_v2.json` etc.). If round 2 still has critical → halt module to
`_review_failed/<slug>/` with `WHY.md`.

**Verification step (mandatory)**: before writing the audit's `produced` list,
shell-loop through each candidate and verify all 5+ files exist:

```bash
for slug in <list>; do
  for f in _outline.json _review_A.json _review_B.json _review_C.json script.json build_slides.py; do
    if [ ! -f "teaching-videos/$slug/$f" ]; then
      echo "MISSING $f in $slug — DO NOT COUNT AS PRODUCED"
    fi
  done
done
```

Then run the release gate:

```bash
python3 tools/lesson-video/audit_lessons.py teaching-videos/<slug>
python3 tools/lesson-video/lesson_release_gate.py teaching-videos/<slug>
```

If the release gate says `needs_revision` or `blocked`, the lesson is not
uploadable. Do not count it as ready for YouTube.

### Skill layers required in the flow

Read `tools/lesson-video/QUALITY_FLOW.md`. The production roles are:

- `presentations:Presentations` standard for slide story and contact-sheet rhythm.
- `imagegen` for hook/thumbnail/concept bitmap assets only; precision diagrams remain deterministic.
- `browser:browser` for Learn Portal / embed visual QA when a local page is involved.
- `engineering:testing-strategy` for learning checks, A/B tests, and release rubric.

Modules missing any required file go under `halted` not `produced`. Be honest
in the audit JSON — fudging it just buries a quality regression for later
discovery.

**Better to produce ZERO modules in this run with full review than 4
unreviewed ones.**

---

## What "done" looks like for a single run

By the time you exit this session, the repo should contain:

- A NEW set of `teaching-videos/<slug>/` folders for the course you generated this run
- Each folder has: `script.json`, `build_slides.py`, `slides/*.png`, plus `intro_music.wav` + `outro_music.wav` symlinked/copied from `tools/lesson-video/`
- ZERO `.mp4`, `.mp3`, `.wav` (other than the music) in each folder — the Mac launchd will fill those in tomorrow morning
- `_audit/<course-slug>/<run-timestamp>.json` summary of which modules succeeded vs were halted to `_review_failed/`
- Updated entry in `ROADMAP.md` under "Auto-pipeline runs" with what got produced

If you didn't get all the way through the course in one session (rate limits / time): commit what you have, log where you stopped, the NEXT scheduled run will resume.

---

## Step 0 — Read the lay of the land

```python
# Pseudo-code for what to actually do:
1. Read this file (you're doing it)
2. Read tools/lesson-video/AGENT_RECIPE.md       # sub-agent contract
3. Read tools/lesson-video/slide_kit.py          # Deck API + THEMES
4. Read references/                              # all CED docs available
5. Read CLAUDE.md                                # Alan's working agreement
6. Read ROADMAP.md                               # what's already been built
7. ls teaching-videos/                           # what already exists
```

**Never skip these reads.** A misread of CLAUDE.md once led to AI stock photos being reintroduced. Don't be that Claude.

---

## Step 1 — Pick the course to generate today

The candidate pool is courses defined in `server/prisma/courses/<dept>/<slug>.json` that don't yet have a complete set of `teaching-videos/<course-slug>-module-*/` folders.

Selection rules (priority order, highest first):

1. **Has a CED reference doc in `references/<slug>-ced.md`** — AP courses come with research-grade reference content, much higher signal
2. **Highest enrollment pressure** — courses tied to current Trust Sprint / Parent demos. Check `ROADMAP.md` for any "URGENT" or "Phase 2" markers
3. **Subject diversity** — if last 3 runs generated Math, switch to Science / Humanities for visual variety in the Learn Portal
4. **Lowest-numbered module gap first** — within a course, fill M1 → M2 → ... before starting another

If two courses tie, pick alphabetically (so reruns are deterministic).

**Hard rule**: Do NOT regenerate an existing module. If `teaching-videos/<course>-module-N-<topic>/` exists, skip it. Idempotence > completeness.

---

## Step 2 — Plan the module-to-CB-unit mapping

Each course's reference doc (`references/<slug>-ced.md`) typically ends with a "Suggested GIIS Module Mapping" table. Use it as starting point but adjust if:

- A CB unit has too many topics for one 6-10 min GIIS lecture → split into 2 modules
- A CB unit is too thin → merge with the next, or add an exercises module
- The unit explicitly excludes BC-only topics for AB courses

For courses without a CED ref (Algebra I, English I, etc.), pull module structure from:
- `src/components/pages/Academics/Academics/CourseCatalog.js` for the official GIIS catalog
- The course's `server/prisma/courses/*/<course>.json` for objectives + readings per module
- Or — last resort — design a reasonable 8-16 module breakdown from scratch and document your rationale in the audit summary

Save your plan as `_audit/<course-slug>/<timestamp>-plan.json`:

```json
{
  "course_name": "AP Calculus AB",
  "course_slug": "ap-calculus-ab",
  "run_at": "2026-05-13T06:00:00Z",
  "module_count_total": 12,
  "modules_planned": [
    {"order": 2, "slug": "ap-calculus-ab-module-2-derivatives",
     "title": "Derivatives: Definition and Fundamental Properties",
     "cb_topics": ["CHA 2.1", "CHA 2.2", ..., "FUN 2.10"]},
    ...
  ]
}
```

This makes failures resumable — the next scheduled run reads the latest plan and continues from `modules_planned` that haven't produced a `script.json`.

---

## Step 3 — Generator → 3-Reviewer Cascade (per module)

For each planned module that doesn't yet have a `_outline.json`:

### 3a. Generator agent

Spawn a sub-agent (`Task` tool, general-purpose) with this framing:

> You are a [Subject Area] PhD with 10 years of high school AP teaching
> experience. You've served on the College Board development committee
> for this course and graded AP exams for 5 years.
>
> Design a section-by-section outline for `<module title>` covering the
> following CB topics: `<list from plan>`.
>
> Each lesson is ~6-10 minutes (13-18 sections). Sections include:
> - `01_title` (auto-handled, just a label)
> - `02_hook` (real-world or surprising entry point)
> - `03_overview` (3-bullet game plan)
> - Middle sections: teaching content (definition / equation / example / compare)
> - One `*_pause1` + duplicate `*_pause1_silence` pair (student practice)
> - `*_recap` (bullet recap + assignment)
> - `*_path` (next steps + next module pointer)
>
> Reference content you MUST stay faithful to:
> ```
> <paste relevant section of references/<slug>-ced.md>
> ```
>
> Write your output as a JSON object with structure:
> {
>   "module_title": "...",
>   "estimated_minutes": 8,
>   "sections": [
>     {"id": "01_title", "slide_type": "title", "content_hint": "...", "narration_seed": "..."},
>     {"id": "02_hook", "slide_type": "custom", "content_hint": "...", "narration_seed": "..."},
>     ...
>   ],
>   "ap_traps_covered": ["...", "..."],
>   "key_vocabulary": ["...", "..."],
>   "specific_examples": ["L'Hospital's Rule with 0/0 form", "..."]
> }
>
> Do NOT write the actual narration text or build_slides.py yet. Just the outline.

Save the agent's output to `teaching-videos/<slug>/_outline.json.tmp` and rename to `_outline.json` only if it parses as valid JSON.

### 3b. 3-Reviewer Cascade (parallel)

Spawn 3 sub-agents simultaneously (single message, multiple Task calls) each with:

**Reviewer A — Peer Subject-Matter Reviewer**:
> You are a peer PhD in [subject area]. Your job is to find factual errors
> in this lesson outline.
>
> Output JSON: {"verdict": "pass|minor|critical", "issues": [{"section": "...", "severity": "...", "description": "..."}]}
>
> Be specific. "Slightly off" is not enough — say what's wrong and how to fix it.

**Reviewer B — Adversarial Student**:
> You are a top AP student. You're trying to find ways this outline could
> mislead a reasonable learner — pedagogical missteps, oversimplifications
> that become misconceptions later, missing crucial nuance.

**Reviewer C — Citation Checker** (anti-hallucination):
> You are a fact-checker. You do NOT have subject expertise — you ONLY have
> this reference text:
> ```
> <paste the same CED section>
> ```
> Compare the outline against the reference. Flag any claim, formula,
> historical date, researcher name, or specific number in the outline that
> is NOT supported by the reference.

### 3c. Aggregate verdicts

Read all 3 reviewer outputs. Decision rules:

| Combined verdict | Action |
|---|---|
| ANY reviewer says `critical` | → halt: move to `_review_failed/<slug>/`, log reason in `_audit/`, continue to next module |
| ≥2 reviewers say `minor` | → revise: feed reviewer feedback back to generator for one revision attempt; re-review once. If still ≥2 minors → halt as above |
| 0 critical, ≤1 minor | → ship: mark outline approved, continue to Stage 4 |

NO human review. The cascade IS the quality gate. If the system halts a module, future runs leave it alone unless an explicit `_review_failed/.../REOPEN` marker is added (humans can do that).

---

## Step 4 — Lesson Writer (approved outlines only)

Spawn ONE sub-agent per approved outline with the standard `AGENT_RECIPE.md`
contract. Pass it:
- The `_outline.json` (so the sub-agent doesn't research curriculum itself)
- Pointer to `tools/lesson-video/AGENT_RECIPE.md` as MANDATORY FIRST READ
- The full path of the lesson folder to write into

The sub-agent produces:
- `script.json` (narration text per section, matches outline structure)
- `build_slides.py` (uses `slide_kit` to generate slides/*.png)
- Runs `python3 build_slides.py` and verifies PNG count

After sub-agent finishes, verify:
- `script.json` parses + has the same section IDs as `_outline.json`
- `slides/*.png` count matches section count (counting pause-duplicates as 2)
- `intro_music.wav` + `outro_music.wav` are present

If verification fails: delete the folder, log the failure, mark module as halted.

---

## Step 5 — Audit + git commit

After processing all modules for this run:

1. Write `_audit/<course-slug>/<timestamp>-summary.json`:
   ```json
   {
     "run_id": "...",
     "timestamp": "...",
     "course": "AP Calculus AB",
     "produced": ["ap-calculus-ab-module-2-derivatives", ...],
     "halted": [{"slug": "...", "reason": "..."}],
     "elapsed_seconds": 1234
   }
   ```

2. Update `ROADMAP.md` — add an entry under "Auto-pipeline runs" with the
   per-run summary (one line per module produced, total wall time).

3. `git add` newly-tracked files (script.json, build_slides.py, _audit/, etc.).

4. `git commit` with message:
   ```
   auto: lesson pipeline run for <course> — <N> produced, <M> halted

   Modules produced:
   - <slug 1>: <title 1>
   - <slug 2>: <title 2>
   ...

   Generated by Cowork scheduled task at <timestamp>.
   ```

5. **Do NOT `git push`** — that's the Mac launchd's job (after it merges + uploads). The Mac will see the new commits and push along with its own manifest update.

---

## Failure modes and recovery

| Symptom | Cause | Recovery |
|---|---|---|
| Sub-agent times out / context overflow | Module too big OR rate-limited | Save partial state to disk, log it, move on. Next run picks up |
| `_outline.json.tmp` exists but no `_outline.json` | Generator crashed mid-write | Delete `.tmp`, regenerate in next run |
| `slides/` exists but is short | `build_slides.py` errored partway | Delete folder entirely, regenerate. Don't try to patch |
| Reviewers always say `critical` for a module | Generator can't get topic right | After 3 failed attempts across runs, mark in `_audit/` "topic too hard, escalate to human" |
| Module folder already exists with script.json | Idempotence | SKIP. Never overwrite |

---

## Throughput targets

Per the operating decision (2026-05-13):

- Cadence: **daily 6am**
- Target per run: **one complete course** (≈12-16 modules)
- Sub-agent parallelism: **4 concurrent** (sub-agents spawned in same message run concurrently)
- Wall-time budget: ~30-45 min per run
- Expected modules per run if all approved: 12-16
- Realistic with reviewer halts (~5-15% halt rate): 10-14 modules

The Mac launchd downstream caps at 4 YouTube uploads/day, so backlog of generated content is EXPECTED and HEALTHY. After ~30 days of daily runs, the school will have content for ~300+ modules — Mac uploads will catch up over 3-4 months.

---

## What NOT to do (anti-patterns)

- ❌ Don't call YouTube API or run `make_lesson.py` / `upload_lesson.py` directly — those run on Mac, not here
- ❌ Don't fetch web content live during a run — use the snapshotted reference docs in `references/`
- ❌ Don't push to git (Mac does that)
- ❌ Don't touch `public/data/lessons-manifest.json` (Mac's `sync_channel.py` owns it)
- ❌ Don't generate content for already-uploaded modules (check `script.json.youtube.video_id`)
- ❌ Don't reinvent slide layouts — use `slide_kit` Deck methods as documented in AGENT_RECIPE.md
- ❌ Don't violate CLAUDE.md ("Cognia", "US-accredited", AI hero photos, etc.)
- ❌ Don't add `.tmp` files to git (the `.tmp` pattern is in `.gitignore`)

---

## How to handoff for humans (if something does need their attention)

If you HALT a module to `_review_failed/`, write a short note `_review_failed/<slug>/WHY.md` explaining:
- Which reviewer flagged what
- Sample of the conflict (e.g. "Generator wrote 'Newton invented calculus in 1666' but Citation Reviewer C couldn't verify the date in the CED")
- Suggested next step (e.g. "Verify date against Wikipedia; if confirmed, add 'invented 1666' to references/<slug>-ced.md so future runs have it")

Humans (Alan or a future me with web search) can resolve these in batch.

---

## Versioning this doc

This SOP will evolve. When you discover a new pattern that helps, edit this
doc as part of your commit. If you discover an anti-pattern not listed
under "What NOT to do", add it. Future-you depends on it.
