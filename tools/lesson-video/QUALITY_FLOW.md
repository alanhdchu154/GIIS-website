# GIIS Lesson Quality Flow

> Purpose: turn lesson generation from "AI makes a video" into a controlled
> school-content production workflow. Claude Code may generate drafts, but
> only the release gate decides what can be uploaded.

## Tool Roles

### Presentations

Use the `presentations:Presentations` skill as the slide-story bar.

For lessons, this does **not** mean every lesson must become a PowerPoint.
It means every lesson must pass the same editorial standard:

- every slide has one claim or one learner action
- thumbnail/contact-sheet view shows a coherent visual rhythm
- no generic card grid when a diagram, trace, table, or worked example teaches better
- no filler slide that only repeats narration
- every visual object is either a proof object, a worked step, or a misconception guard

Practical lesson adaptation:

```text
lesson blueprint -> claim spine -> visual plan -> slide build -> contact sheet -> weakest-slide iteration
```

### imagegen

Use `imagegen` only for visuals where a generated bitmap helps learning:

- hook illustrations
- thumbnails
- non-precision concept scenes
- atmospheric chapter breaks

Do **not** use imagegen for precision diagrams where a small hallucination
breaks trust. These should be drawn deterministically in `build_slides.py`:

- equations
- code traces
- graphs
- cell diagrams with labels
- Hardy-Weinberg / Punnett / phylogeny / circuit / force diagrams

Any generated or sourced image must be recorded in `assets_manifest.json`:

```json
{
  "assets": [
    {
      "file": "assets/02_hook.png",
      "type": "generated_image",
      "purpose": "hook illustration",
      "prompt": "...",
      "license": "AI-generated; project-owned per tool policy",
      "precision_risk": "low"
    }
  ]
}
```

### Browser

Use the `browser:browser` skill for rendered QA when a lesson is represented
as an HTML preview, local Learn Portal page, or YouTube embed page.

For file-based slide decks, the local equivalent is a contact sheet:

- `contact-sheet.jpg` must show all slides at thumbnail size
- inspect for duplicate/obsolete slides
- inspect for text overlap
- inspect for unreadably tiny type
- inspect for one-note visual rhythm

When the lesson is embedded in the Learn Portal, Browser QA should verify:

- desktop render
- mobile render
- iframe/header spacing
- transcript/caption affordance
- no layout overlap around the lesson embed

### Testing Strategy

Use `engineering:testing-strategy` as the learning-effectiveness gate.

Every V2 lesson should ship with either a `quiz.json` or a short
`learning_check.json`:

```json
{
  "checks": [
    {
      "skill": "trace a for loop boundary",
      "question": "...",
      "answer": "...",
      "misconception_tested": "off-by-one"
    }
  ]
}
```

For A/B lesson tests, measure:

- quiz correctness after viewing
- ability to explain the misconception in plain English
- student willingness to keep watching
- parent perception of seriousness/trust

### Expert Lens

For foundation videos, the source packet includes the Learn Portal Expert Lens.
Treat it as the academic spine:

- big idea -> concept and worked example
- watch-for risk -> misconception and pause check
- transfer -> application and next Learn Portal action

Do not copy authorization-sensitive pathway claims into the public video. The
video handoff may use the academic direction, but must keep foundation wording
conservative.

### Source Alignment

Foundation videos must show at least one assigned source label on-slide. This
is a parent-trust signal: families should be able to see that the lesson aligns
to a real reading, practice source, or assigned video without hearing raw URLs.
The source label should appear in `build_slides.py` on a concept, application,
recap, or path slide.

### Independent Second Pass

The production worker does not provide the final academic review. After the
lesson is produced, a separate reviewer run writes
`_review_independent_pass.json` and `_review_source_alignment.json`. This pass
may approve, mark minor notes, request revision, or block, but it must not
repair the lesson.

## Release Gate

A lesson is uploadable only if all are true:

- `audit_lessons.py` verdict is `pass` or `pass_with_minor_notes`
- quality score is at least 90 for automatic upload
- no `major` or `critical` audit issue
- MP4 exists
- `transcript.txt` exists
- `contact-sheet.jpg` exists
- reviewer artifacts exist:
  - PhD/peer reviewer
  - adversarial student reviewer
  - citation/source checker
- reviewer notes explicitly evaluate Expert Lens alignment
- independent second-pass and source-alignment reviewer artifacts exist
- AP lessons must have citation/source reviewer pass or minor-only with an
  explicit reference-packet note

If any condition fails, the lesson goes to `needs_revision`, not YouTube.

## V2 Lesson Standard

Prefer this shape:

```text
01 title
02 hook / common wrong idea
03 overview / game plan
04 concept
05 misconception checkpoint
06 worked example or trace
07 pause problem
08 worked answer
09 second concept
10 compare/trap
11 evidence/application
12 recap
13 path / next action
```

Narration targets:

- 25-65 words per section
- hard max 85 words
- one concept per slide
- one pause every 3-5 minutes
- the lesson must end with a concrete Learn Portal task

Visual targets:

- deterministic diagrams for precise content
- generated/sourced images only when they add learning value
- contact-sheet must look readable at thumbnail size
- no slide should depend on tiny paragraphs

## Foundation Daily Release Rule

For the foundation daily pipeline, automatic upload means gate-approved plus
Codex/Umi approval artifact. The artifact is the control surface:

```text
foundation gate pass + release gate pass -> approved_ready_to_upload.json -> yt_queue upload --gate-ready
```

`yt_queue.py` may upload automatically only from
`approved_ready_to_upload.json`; direct upload or `--force-without-approval`
is outside the normal workflow.
