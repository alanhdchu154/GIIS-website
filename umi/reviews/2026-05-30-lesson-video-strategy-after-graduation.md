# Lesson Video Strategy After Spring 2026 Graduation

Date: 2026-05-30
Status: Recommendation / operating decision

## Calendar Context

As of 2026-05-30, GIIS is in the 2025-2026 summer recess.

- Spring semester ended: 2026-05-22
- Spring grades released: 2026-05-25
- Transcript issue date: 2026-06-12
- Class of 2026 diploma issue date: 2026-06-05

This means lesson videos are no longer urgent as makeup support for the graduating students. They are now a trust, onboarding, and retention asset for the next operating cycle.

## Verdict

Yes, GIIS still needs high-quality lesson videos, but the old cc-led batch pipeline should not resume.

The correct strategy is:

1. Keep the automated generation/build/upload pipeline paused.
2. Treat existing visible videos as an asset that must be audited, classified, and cleaned.
3. Produce one V2 pilot under Umi-led teaching design and cc-owned production mechanics.
4. Resume production only after the V2 gate proves it catches weak teaching, not just missing files.

## Current Evidence

Commands run on 2026-05-30:

```bash
npm run audit:lesson-video-inventory
npm run audit:lesson-manifest
python3 tools/lesson-video/lesson_release_gate.py --pending --check
```

Results:

- Lesson folders: 70
- Visible in Learn Portal manifest: 49
- Folders with MP4: 22
- Full reviewer cascade: 29/70
- AP CS A / AP Psychology missing required reference packet: 26
- Visible lessons needing post-hoc review: 14
- Upload candidates after human approval: 3
- Release gate check: 18 evaluated, 3 ready, 15 needs_revision, 0 blocked
- Manifest alignment warnings: 12

Important warning: AP CS A and AP Calculus AB still have manifest/module-title mismatches. This is not a cosmetic issue; wrong same-number mapping can make Learn Portal show a video for the wrong module.

## What cc Did Well

cc is useful for:

- deterministic repo mechanics
- generating slide code from a precise teaching brief
- rendering slides/contact sheets/transcripts
- running audits and release gates
- fixing manifest/build/upload bugs
- preparing structured reports and handoffs

cc should be treated like a production engineer, not the academic owner.

## Where cc Failed / Must Be Constrained

The old workflow allowed cc to behave as if "artifact exists" meant "lesson is good." That is the wrong standard for a school.

Specific failures:

- Some visible AP CS A / AP Psychology videos lack required reference packets and full reviewer cascade.
- Several lessons reached YouTube or the manifest before post-hoc academic review.
- Release-gate outputs were historically treated too close to approval; machine readiness is not human release approval.
- Module numbering drift happened, especially AP CS A ArrayList and AP Calculus AB.
- Local script state, channel state, and `public/data/lessons-manifest.json` have drifted before.

The strong rule: cc may produce artifacts, but cc must not be the final judge of whether GIIS teaches or publishes.

## Strong Recommendations

### 1. Do not restart scheduled video jobs yet.

Keep these paused:

- `tools/lesson-video/daily_build.sh`
- `tools/youtube-upload/daily.sh`
- `com.giis.lesson-build`
- `com.giis.youtube-daily`

Reason: the current inventory still shows 14 visible lessons needing post-hoc review, 26 AP lessons missing reference packets, and 12 manifest alignment warnings.

### 2. Freeze upload until an approval file exists.

No upload should happen unless the lesson is in:

```text
teaching-videos/_audit/release-gate/approved_ready_to_upload.json
```

The approval file must include:

- approved lesson slug
- approved by
- approved at
- evidence path
- classification: `keep`, `errata`, `re_record`, or `new_v2`

### 3. Fix visible trust problems before making new videos.

Priority order:

1. Manifest mismatches that can show the wrong video for a module.
2. Visible AP CS A / AP Psychology lessons missing reference review.
3. Visible Algebra I lessons needing post-hoc review.
4. Only then new V2 production.

### 4. Add reference packets before cc touches AP CS A or AP Psychology again.

Required files:

```text
references/ap-cs-a-ced.md
references/ap-psychology-ced.md
```

Without these, Reviewer C cannot verify alignment. If Reviewer C cannot verify alignment, AP lesson output is draft-only.

### 5. Use Umi-first teaching briefs, cc production second.

For each V2 lesson:

1. Umi writes the teaching brief: misconception, objective, example sequence, visual plan, learning check.
2. cc creates `script.json`, `build_slides.py`, slides, transcript, contact sheet, and learning check.
3. cc runs audits and reports exact failures.
4. Umi reviews teaching quality and parent-trust signal.
5. Only approved lessons enter upload queue.

## Immediate Next Work

### Phase A: Existing Visible Video Review

Create a review table for all 49 visible lessons:

- keep
- keep with description errata
- remove from manifest / unlist
- re-record

Start with AP CS A, AP Psychology, AP Calculus AB mismatches, and Algebra I.

### Phase B: V2 Pilot

Best pilot: AP CS A Module 10 ArrayList.

Why:

- It already has a precise Umi handoff.
- The current AP CS A numbering has known drift, so a correct V2 pilot proves the new source-of-truth discipline.
- The concept has clear student misconceptions: ArrayList shifting, removal while looping, `.size()` vs `.length`.

Do not upload the pilot until the full gate passes.

### Phase C: New School-Year Video Roadmap

For Fall 2026, prioritize:

1. English I / Algebra I onboarding modules for new students.
2. High-trust AP sampler videos, not full AP coverage yet.
3. Parent-facing "how learning works at GIIS" walkthroughs.

The school does not need 93 courses fully video-complete before enrollment. It needs a coherent, trustworthy sample path that proves the system works.

## Operating Decision

Videos should remain part of GIIS, but they must stop being an automation-first project.

The new standard is:

```text
school teaching brief -> cc production -> machine audit -> Umi academic review -> human approval file -> upload
```

Until this loop works for one V2 pilot and one visible-video cleanup pass, no scheduled batch production should resume.
