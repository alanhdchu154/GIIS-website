# Umi Workload

Last updated: 2026-07-09 10:24 CDT

This file holds one active Codex / cc worker handoff at a time. Use
`ROADMAP.md` for durable project direction and archived reports/git history for
old slot evidence.

## Completed: English IV Media Writing Module 11 Pre-Render Production (2026-07-09)

cc produced the full pre-render V2 folder for:
`teaching-videos/english-iv-media-writing-module-11-professional-writing-v2/`

- script.json: 11 sections, 859 words, avg 78.1 w/s, max 84 w/s — all density gates pass
- build_slides.py: 11 slides (sepia/maroon lit theme, four-decision framework diagram,
  writer-needs-first vs audience-aware compare strips, revision annotation callouts,
  OpenStax source label on concept + application slides)
- contact-sheet.jpg, style_manifest.json (literature theme), learning_check.json (4 checks)
- _review_A.json, _review_B.json, _review_C.json, _review_expert_lens.json — all pass, SHA bound
- Expert Lens: all 3 facets satisfied (insight/watchFor/transfer)
- Source alignment: "OpenStax Writing Guide — Chapter 11: Professional Writing" visible on slides, no raw URLs
- Audit score: 68 / content quality gates pass — only expected pre-render gaps (no MP4,
  independent + source-alignment reviewer files out of scope per handoff, owned by orchestrator/wrapper)
- Release gate: needs_revision only because of the expected missing MP4 and out-of-scope reviewer files
- **Umi action**: orchestrator renders TTS/MP4/transcript; independent reviewer wrapper writes
  _review_independent_pass.json and _review_source_alignment.json; then re-run release gate.

## Completed: English IV Media Writing Module 1 Pre-Render Production (2026-07-08)

cc produced the full pre-render V2 folder for:
`teaching-videos/english-iv-media-writing-module-1-advanced-composition-review-v2/`

- script.json: 11 sections, 846 words, avg 76.9 w/s, max 99 w/s — all density gates pass
- build_slides.py: 11 slides (sepia/maroon lit theme, OpenStax source label on application + path)
- contact-sheet.jpg, style_manifest.json, learning_check.json (3 checks)
- _review_A.json, _review_B.json, _review_C.json, _review_expert_lens.json — all pass, SHA bound
- Expert Lens: all 3 facets satisfied (insight/watchFor/transfer)
- Source alignment: OpenStax Writing Guide visible on slides, no raw URLs
- Audit score: 68 / quality gates pass — only expected pre-render gaps (no MP4, independent + source-alignment reviewer files out of scope per handoff, owned by orchestrator/wrapper)
- Release gate: needs_revision only because of the expected missing MP4 — content is clean
- **Umi action**: orchestrator renders TTS/MP4/transcript; independent reviewer wrapper writes _review_independent_pass.json and _review_source_alignment.json; then re-run release gate.

## Active Handoff: System + Parent-Facing Optimization Backlog

- owner: Codex (repo fully handed to Codex by Alan on 2026-07-03)
- repo: `/Users/alanhdchu/giis-website`
- mode: Codex implementation with cc-ready follow-up for P1 semantic redesign
- model routing:
  - Sonnet: bounded implementation, mechanical cleanup, playlist/upload hygiene.
  - Opus: parent-trust semantic redesign, public-claim/payment/deploy judgment.
- priority: medium (no live production blocker; quality/trust hardening)
- time anchor: 2026-07-03
- time-aware continuity acknowledged?: yes
- state: P1/P2/P3/P4/P5 implemented by Codex; no active cc blocker remains

## Objective

cc ran a read-only system + parent-facing review at Alan's request. CC-quota and
T9-mount "problems" were ruled out as physical/contextual rather than systemic.
The actionable backlog from this pass has been implemented. Completed history
has been moved out of this active handoff; use this file only for the next
focused worker task.

## Current Lesson-Video State

Alan's 2026-07-06 stopped-lane blockers were repaired, and Alan then directly
asked Codex to push 10 more videos and upload. Codex used the approved
foundation orchestrator path with `yt_queue.py upload --gate-ready` and did not
start a duplicate producer.

Current snapshot after the 2026-07-09 08:00 CT 10-more run:

- The approved foundation run produced/collected 10 gate-ready lessons and
  uploaded all 10 unlisted through the orchestrator path; upload result:
  10 uploaded / 0 failed.
- Parent-trust initially returned `FIX_FIRST` for English IV Writing M5 because
  a standardized-testing debate example used public-facing college-admissions
  wording. Codex repaired that example to a school-uniforms /
  student-expression debate, regenerated M5 audio/MP4, and parent-trust reran
  `TRUST_READY`.
- current same-day count: 20 uploaded on 2026-07-09 CT
- current queue evidence: 647 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- latest 10 uploaded: English IV Writing M3-M5, M7-M12, and Organizational
  Behavior & Communication M1. Video IDs: `irSU5PuONbo`, `jc1cemPwF88`,
  `KvfAr-RP_P8`, `SUZoEhnWxpw`, `U5_3VKCbiV8`, `_xO5dR9NWXk`,
  `qpRKi6JXGbE`, `k92mE1BeaUs`, `o1AMPW11YyA`, `PNNRkIfoCaM`.
- remaining non-AP published modules needing completion/upload: 254 of 901.
- skipped source-repair items: English IV Writing M6 and M13 failed the
  resource check because `open.lib.umn.edu` returned 403. Keep this as a
  source cleanup/top-up issue; it is not a video-upload blocker.
- next action: no immediate upload action; next bounded production pass should
  continue through the same approval/orchestrator path and repair source 403s
  or let auto-advance choose clean lessons.

Previous snapshot after the 2026-07-09 03:00 CT 10-more run:

- The approved foundation run produced/collected 10 gate-ready lessons and
  uploaded all 10 unlisted through the orchestrator path; upload result:
  10 uploaded / 0 failed.
- Parent-trust initially returned `FIX_FIRST` for English IV Writing M2 because
  `admissions readers` appeared in public narration. Codex repaired it to
  `personal-statement readers`, regenerated M2 audio/MP4, reran Opus
  independent review, and parent-trust reran `TRUST_READY`.
- current queue evidence: 637 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- latest 10 uploaded: English IV Media Writing M6-M13 and English IV Writing
  M1-M2. Video IDs: `MkMfPb17Upo`, `ZlvRkzQtOrQ`, `KWp9Rr7ElII`,
  `86a89d97sfo`, `32vV3uwT_CI`, `dVEJ5gymtUE`, `jLF4oKZ7ZTY`,
  `lWLdX1fRGGQ`, `FbdXCkQkBgo`, `QlTJ7e-eLSQ`.
- remaining non-AP published modules needing completion/upload: 264 of 901.
- dirty risk handled: root cwd-drift `slides/` and `style_manifest.json`
  artifacts were archived, not deleted, under
  `docs/archive/lesson-video-cwd-drift/2026-07-09-0517/`.
- next action: no immediate upload action; next bounded production pass should
  continue through the same approval/orchestrator path and keep course-design
  guard cleanup separate from upload pressure.

Current snapshot after the 2026-07-08 23:20 CDT direct 10-more request:

- Alan asked Codex to generate 10 more lesson videos and upload. Codex used the
  approved `npm run lesson:foundation-daily` path with
  `FOUNDATION_MAX_MODULES=10` / `FOUNDATION_UPLOAD_MAX=10`; no duplicate
  producer/upload was started.
- The run produced and uploaded 5 English IV Media Writing lessons (M1-M5),
  then stopped safely when Claude Code reported a session limit before selecting
  more modules. This is not a YouTube upload/channel-limit blocker.
- current same-day count: 30 uploaded on 2026-07-08 CT
- current queue evidence: 628 total / 627 uploaded / 1 pending / 0 no-MP4
- pending release gate: 1 ready / 0 needs_revision / 0 blocked
- pending ready item: English IV Media Writing M6; it is not in the current
  approval artifact, so do not manually bypass the approval/orchestrator path.
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- latest 5 uploaded: English IV Media Writing M1-M5. Video IDs:
  `YrniQ3OgIPw`, `vJPxDmrGUR4`, `DZlKGwKUHbU`, `kjmtn7ALwHY`,
  `ku2eyoY0coc`.
- remaining non-AP published modules needing completion/upload: 274 of 901
  (G10: 9, G11: 8, G12: 165, no gradeLevel: 92).
- dirty risk handled: new root cwd-drift `slides/` and `style_manifest.json`
  artifacts were archived, not deleted, under
  `docs/archive/lesson-video-cwd-drift/2026-07-08-2320/` after confirming the
  producer had stopped. Do not stage generated lesson-video media or T9
  artifacts.
- next action: after the Claude Code session resets, run another bounded
  approved orchestrator pass; let it approve/upload the pending M6 only if the
  normal parent-trust/release gates allow it. Continue course-design cleanup for
  the 11-module / 1-credit Grade 12 guard before broad top-up volume.

Previous snapshot after the 2026-07-08 15:30 CDT 40-target top-up request:

- Alan asked whether GIIS can補 toward 40 same-day uploads. Current same-day
  count is 25 uploaded on 2026-07-08 CT. The pipeline can continue only as
  gates allow; 40 is a target, not permission to force weak lessons or start
  duplicate producers.
- The approved `npm run lesson:foundation-daily` 10-cap top-up completed through
  the gate-ready upload path. No `foundation_daily.sh`,
  `foundation_daily_orchestrator.py`, `foundation_video_gate.py`,
  `make_lesson.py`, or `yt_queue.py upload` process is active as of 18:04 CT.
- current queue evidence: 622 total / 622 uploaded / 0 pending / 0 no-MP4
- pending release gate: 0 ready / 0 needs_revision / 0 blocked
- manifest alignment: `npm run audit:lesson-manifest -- --quiet` -> 0 warnings
  across 577 lessons
- latest 10 uploaded: English IV Analytical Writing M7-M13 except M6, plus
  English IV Media & Analytical Writing M6, M7, and M9. Video IDs:
  `wGFLVYnkghM`, `FbpnlDRhSr4`, `SVP9v0Fx1dM`, `g-cWN55y3h0`, `ucjI82jF4LQ`,
  `LCh3y7f4uRk`, `WZLnndAJLN8`, `EvVud7i9YbI`, `x5JCJRzMQPs`,
  `iRi4rDv67jA`.
- dirty risk handled: root `slides/` and `style_manifest.json` reappeared as
  untracked cwd-drift artifacts during the top-up and were archived, not
  deleted, under `docs/archive/lesson-video-cwd-drift/2026-07-08-2002/` at the
  20:00 CT lane after confirming no producer/gate process was active.
- 20:00 CT top-up lane result: do not start another full producer yet. Dry-run
  auto-advanced from Grade 10 to Grade 12, but the next visible candidate
  courses hit the 11-module / 1-credit course-design guard. This is a
  quality_gate waiting state, not a YouTube quota/channel-limit blocker.
- next action: clean/repair the 11-module Grade 12 course-design issue, then run
  another bounded top-up only if no blocker, overlap, or true YouTube/channel
  limit appears. Use only `yt_queue.py upload --gate-ready`.
- duplicate old English IV AP-language slug folders were archived, not deleted,
  under
  `teaching-videos/_archive/2026-07-08-english-iv-old-ap-language-slugs/`.
  Top-level English IV M2/M3 now has only the neutral slug folders.
- queue 602 total / 601 uploaded / 1 pending / 0 no-MP4
- 4 unlisted uploads succeeded on 2026-07-08 CT through
  `yt_queue.py upload --gate-ready`: English IV Advanced Composition M7
  `PdP21WhUXGY`, English IV Advanced Composition M8 `O2YVYGCpKbw`, English II
  Literature M9 `XPha-ZoA3V4`, and Algebra II M2 `wHUE73x_ICY`
- no true YouTube upload/channel limit appeared
- remaining pending release gate is 0 ready / 1 needs_revision / 0 blocked
- pending lesson: Geometry M7 `The Pythagorean Theorem`; this is a
  quality/audit revision item, not an upload-bypass item
- parent-trust was `TRUST_READY` for all 10 lessons selected by the upload run
- upload dry-run after the run selects the remaining 2 gate-ready lessons, but
  local quota estimate reports 0 safe full uploads today
- public manifest alignment remains clean: 576 lessons / 0 warnings
- captions remain backlog and must not be promised as universally available
- Abnormal Psychology is a future cleanup item: course-design guard skipped it
  because 11 modules is outside the expected 12-16 range for a 1-credit course.
- Business Law is a future cleanup item: course-design guard skipped it because
  11 modules is outside the expected 12-16 range for a 1-credit course.
- Corporate Finance, Counseling & Mental Health, and Digital Media & Society
  are also future cleanup items for the same 11-module / 1-credit guard.
- Dirty risk resolved: root `slides/` / `style_manifest.json` were removed
  after Alan's scoped cleanup approval. Root artifacts reappeared during the
  18:01 CT run and were removed again after upload. Do not stage generated
  lesson-video media or T9 artifacts.
- Parent-trust audit false positives fixed for this run: behavioral-economics
  subscription/framing dollar examples and environmental-economics
  cap-and-trade quantity-guarantee language are allowed only as instructional
  context when not GIIS payment/admissions/outcome-facing. Earlier 03:00 fixes
  for economics policy money examples, externality tuition/subsidy examples,
  and negated "guarantee" wording remain covered.
- Next action: repair or regenerate Geometry M7 so it passes the release gate,
  then upload only through `yt_queue.py upload --gate-ready`. Do not use
  `upload_lesson.py --force-without-approval`.
- Parent-trust audit redesign: `tools/lesson-video/parent_trust_video_audit.py`
  now treats keyword hits as recall candidates, classifies them through a local
  semantic BLOCK/ALLOW judge, and runs versioned fixtures before auditing
  lessons. It still blocks accreditation, AP/College Board authorization,
  admissions/visa/credit, payment/enrollment, credential, raw URL, real-person,
  and true outcome-guarantee risk.

## Codex Implementation: 2026-07-05 Parent-Trust Audit Redesign

Completed:

- Replaced `is_contextual_false_positive` growth with
  `classify_hard_candidate(kind, match, context)`, which returns structured
  `{verdict, claimType, quote, reason}` decisions.
- Kept keyword patterns as recall. Hard findings are now BLOCK decisions;
  instructional ALLOW decisions move to `ignored_findings` with the reason and
  full semantic decision.
- Added Chinese `美国认证` accreditation detection via Unicode escape.
- Added versioned fixtures at
  `tools/lesson-video/tests/parent_trust_fixtures.json`, seeded with historical
  allow cases and real must-block public-claim cases.
- Added `tools/lesson-video/tests/test_parent_trust_video_audit.py`.
- Added `--check-fixtures-only`; normal audit runs fixture regression first and
  exits with code 2 if the policy fixtures fail.

Verification:

- `python3 -m py_compile tools/lesson-video/parent_trust_video_audit.py tools/lesson-video/tests/test_parent_trust_video_audit.py`
- `python3 tools/lesson-video/tests/test_parent_trust_video_audit.py` -> 3 tests
  pass
- `python3 tools/lesson-video/parent_trust_video_audit.py --check-fixtures-only`
  -> fixture regression checks passed
- `python3 tools/lesson-video/parent_trust_video_audit.py --out-dir /tmp/giis-parent-trust-smoke --report-name recent-smoke teaching-videos/calculus-module-13-introduction-to-differential-equations-v2 teaching-videos/college-research-writing-module-2-library-database-research-v2`
  -> `TRUST_READY` for 2 lessons

## Codex Implementation: 2026-07-03

Completed:

- P2 playlist retry/backoff: `tools/youtube-upload/upload_lesson.py` retries
  transient playlist insert failures (`aborted`, backend/rate-limit, 429/5xx)
  with bounded 2s / 5s / 10s backoff before leaving reconciliation as fallback.
- P3 roadmap/workload cleanup: historical slot logs were archived to
  `docs/archive/ROADMAP_DETAIL_2026-07-03-lesson-video-slots.md`; `ROADMAP.md`
  now keeps current lanes/state; this file now keeps only the active handoff.
- P4 captions honesty: `src/components/main/LessonPreview.js` no longer claims
  every lesson has English captions. It now says lessons are taught in English
  and captions are a separate quality pass, with YouTube player captions used
  when available.
- P5 pricing nav: `src/components/main/Nav.js`, `Nav.module.css`, and
  `src/i18n/siteStrings.js` add a top-level Pricing link on desktop and a direct
  Pricing entry in the mobile menu.

Verification already completed for P2/P4/P5:

- `python3 -m py_compile tools/youtube-upload/upload_lesson.py`
- `npm run audit:sales-launch` -> 53/53 pass
- `npm run build` -> pass, Browserslist warning only
- `npm run audit:conversion-bilingual -- --base-url http://localhost:3030` ->
  7/7 pass
- `npm run audit:parent-journey -- --base-url http://localhost:3030` -> 7/7 pass
- `npm run audit:sales-live -- --base-url http://localhost:3030` -> 9/9 pass
- Playwright desktop/mobile smoke: Pricing link visible; no horizontal overflow

## Remaining Work

No active cc handoff remains from this backlog. Optional future hardening:
connect the independent Opus reviewer JSON more directly into the parent-trust
audit report, but the current deterministic fixture-backed gate is sufficient
for the next foundation-video run.

### Verified Good / No Action

- `/lessons` public library surfaces the video library by course from manifest.
- Trust infrastructure exists in nav (`/trust-center`, `/verify`,
  `/diploma/:id`, `/assessment-proof`).
- `/pricing` is now in the main nav after the Codex P5 edit.
- Manual reviewed sales remain allowed inside the existing payment boundary;
  automated Guided/Premium checkout remains blocked until live Stripe price and
  payment gates are green.

## Constraints

- Do not weaken score-100, source-alignment, parent-trust, or upload gates.
- Do not treat standard captions as a video-upload blocker.
- Do not stage T9 media or generated lesson-video artifacts.
- Do not push `main` casually; push equals Netlify frontend deploy.
- Do not confuse no-pending-upload queue with no-production-needed.

## Suggested Verification For Future Lesson Work

Use the existing GIIS runbooks and gates for the touched lesson. Minimum evidence
before upload:

- MP4 exists.
- independent review pass exists.
- source alignment review pass exists.
- parent-trust/video gate pass exists.
- upload uses `yt_queue.py upload --gate-ready`.

## Stop Conditions

- Any source mismatch remains.
- Required resources are paid/login-gated or mislabeled.
- cc session limit or review failure leaves approval artifacts missing or stale.
- A command would stage generated media, T9 artifacts, secrets, or deploy-facing
  frontend changes outside the scoped task.

## On Demand: School Ops / Sales

Before outreach or checkout changes, run the school ops / sales gates from the
repo runbook. Manual reviewed sales remain allowed only inside the existing
payment boundary; automated Guided/Premium checkout remains blocked until live
Stripe price and payment gates are green.
