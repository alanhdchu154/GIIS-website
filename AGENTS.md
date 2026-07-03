# GIIS Platform — Agent Working Agreement

> Read this before doing **anything** in this repo.

## Central Umi coordination

This repo follows the global Central Umi coordination contract in `/Users/alanhdchu/.codex/AGENTS.md`.

- Central Umi remains Alan's primary interface and cross-project coordinator.
- `giis-producer` is the project manager for this repo, not a separate Umi persona.
- Claude Code / cc is a senior technical worker for bounded implementation, review, debugging, content-alignment, and deployment-readiness tasks.
- Read `/Users/alanhdchu/umi-central/goals.md` before local planning. The central `giis-website` row is the v0.1 / weekly / daily routing layer; this repo's `umi/workload.md` is the active Codex/cc handoff and `ROADMAP.md` is concise durable direction.
- GIIS mainly uses `ROADMAP.md` rather than `WORKLOG.md`. If a worklog-like active note exists, keep it to today / last few days of current evidence and clean completed/stale items. Use `ROADMAP.md` for brief completed milestones, current lanes, future work, priorities, and non-goals.
- If the central daily goal conflicts with `ROADMAP.md` or `umi/workload.md`, pause and escalate to `giis-producer` / Central Umi instead of reconciling silently.
- For substantial coding problems, prefer `cc-first` or `Split-work` after the read-only reconnaissance pass. Coding-heavy or cc-strong work should go to cc first to balance token usage and use the right agent for the job. Umi still owns scope, acceptance, and the final Alan-facing summary.
- Use Alan's current two-loop flow: Central Umi / Codex defines direction, acceptance criteria, and source-of-truth context; cc does deep VS Code Claude Code / code-mode work for complex GIIS logic, pipeline, or review tasks; Codex reviews, verifies, accepts/rejects/narrows, then updates the right source-of-truth files. For broad or risky changes, ask cc for an independent findings-first review of current diff/status before treating the work as complete.
- Before doing a substantial task locally, run the Claude Code delegation checkpoint and record `use cc` or `skip cc with reason`; do not skip cc merely because Codex/Umi can do the work.
- For deep engineering work, use a code-capable Claude Code surface such as Alan's VS Code Claude Code workflow or an equivalent code-mode CLI session with the correct repo cwd, current diff/status, scoped files, verification commands, stop conditions, and model target. Follow Central `docs/cc_model_routing.md` with confirmed-alias routing: use `--model sonnet` for the latest Sonnet line on scouting, routine implementation, bounded verification, and mechanical cleanup; use `--model opus` for the latest available Opus-class line on high-risk bug-hunt review, non-obvious diagnosis, architecture/protocol/security, research/paper claim boundaries, and public/deploy/payment/privacy judgment; use full ID `--model claude-fable-5` only for highest-capability ambitious long-horizon work such as large migrations, complex multi-day implementation, broad cross-repo transformations, or long-running autonomous coding after local access is confirmed and retention/safeguard constraints are acceptable. Record the model target and reason in `umi/workload.md` or the cc handoff. Pin a full model ID only for Fable 5 access, model migration/regression reproduction, or an explicit runbook requirement. Do not treat cc-cowork/advisor chat as the primary executor for implementation, debugging, tests, diff review, or deep repo inspection.
- GIIS foundation lesson-video production is repetitive mechanics and should default to `--model sonnet`; independent release/source-alignment review and parent-trust judgment should default to `--model opus`.
- For assigned implementation, debugging, tests, refactor cleanup, repo-local docs, or other cc-strong execution tasks, cc has edit access from the first pass inside the allowed scope. Codex/Umi reviews the diff and accepts/rejects/revises before treating it as done.
- Do not require a numeric token/budget cap by default for cc. Use bounded scope, allowed files, expected output, and stop conditions; ask for a hard cap only if extra paid usage is enabled, external paid services are involved, Alan requests one, or the task is too broad to checkpoint safely.
- Prevent cc timeout by assigning one-pass tasks with exact allowed files and commands. Do not ask cc to run watch mode, long dev servers, full generation jobs, broad eval/browser suites, or full test suites unless explicitly scoped. If cc times out, returns no output, stalls, or needs broader scope, record the attempted repo/cwd, model target, prompt shape, allowed tools/files, elapsed time, partial output, and whether files may have changed. Stop the worker, inspect `git status` / relevant diffs if edits may have happened, narrow to one smaller code-mode pass, and retry once when safe. If retry fails, report the specific blocker instead of silently deciding, editing broadly, or treating timeout as approval.
- Translate Alan's shorthand into repo terms before assigning cc. First identify the current GIIS goal, `ROADMAP.md` lane, changed files, likely course/video/student-care directories, and whether cc should do all-current-diff alignment review, targeted file review, diagnosis, implementation, or verification.
- For bug-hunt or alignment questions, cc should get a findings-first review pass over current git diff/status, `ROADMAP.md`, current goals, and relevant adjacent files. Do not over-narrow review to only the files Codex already suspects; let cc find regressions, missing tests, stale assumptions, and scope drift before implementation.
- Preserve cc's independent review value. When Alan asks for broad "is this aligned / what changed / what problems do you see" feedback, Umi should first scout the repo, then hand cc the current change set, candidate directories, and open questions. Ask cc for top findings, recommended direction, and whether implementation should happen now, wait, or be narrowed.
- Time-aware continuity applies. Old `ROADMAP.md` entries, deployment notes, and lesson-video reports are historical evidence. When Alan asks about today, now, recently, or resumes an old thread, anchor to the current date/time and read current roadmap/repo/production-safe evidence before answering as current.
- Avoid duplicated operating rules. Central docs are the canonical source for cross-project policy; project docs should reference them and add only GIIS-specific exceptions. Do not paste full Central matrices or long procedures here unless they truly control GIIS local behavior.
- Treat dependency/build/cache folders such as `node_modules`, `server/node_modules`, `build`, `demo-output`, `server/tmp`, `.pytest_cache`, and `__pycache__` as rebuildable but not automatically disposable. Keep them during active producer/runtime work when deletion would slow the next task; clean only in a scoped cleanup window, when disk pressure matters, or when dependency/build state is broken. Never use broad `git clean -xfd`, and never classify T9 lesson videos, OAuth tokens, generated release evidence, or production data as cache.
- Project-local rules in this file control GIIS code behavior, claims, roadmap discipline, and production safety.
- Use `giis-sales-production-readiness` for parent trust, sales, payment, production API, Netlify/Lightsail, Stripe/manual sales, deploy, and push-readiness work.
- Use `giis-foundation-video-daily` for lesson-video selection, daily pipeline monitoring, release gates, artifact review, and foundation-only video production.
- Use `cc-code-mode-handoff` before substantial technical implementation, bug-hunt, diff alignment, or deploy-risk review.
- For visible UI/design work, read `DESIGN.md` before editing. It is the
  repo-local visual source of truth for parent-facing trust, real product
  screenshots, typography, palette, bilingual layout, and no-stock-photo rules.
  It does not override public-claim, official-document, or production safety
  gates.
- After meaningful GIIS work, Central Umi / Codex updates
  `/Users/alanhdchu/umi-central/ai/HANDOFF.md` before marking the task complete.
  Claude Code / cc may read that file for executive context, but cc reports
  task output through `umi/workload.md`, `umi/reports/`, or the requested worker
  report; cc should not treat Central handoff as its active communication
  channel.
- After every meaningful cc/Codex loop, run the source-of-truth sync gate: active worker task -> `umi/workload.md`, local durable state -> `ROADMAP.md`, cross-project risk or Alan attention -> Central Umi files. Do not let a VS Code cc chat or Codex chat be the only record of an accepted result, changed blocker, or next action.
- File placement rule: active worker assignments, retry prompts, model choices,
  stop conditions, and temporary cc/Codex task packets belong in
  `umi/workload.md`, not in `AGENTS.md`, `CLAUDE.md`, `ROADMAP.md`, or Central
  `ai/HANDOFF.md`.
- If Alan works directly in a GIIS project-lead conversation, align Central Umi immediately for sales/payment/deploy decisions, production risk, public-claim changes, external actions, or priority shifts; align at end of turn when `ROADMAP.md`, `umi/workload.md`, blocker, risk, or next action changes.
- For local storage moves, read `/Users/alanhdchu/umi-central/docs/local_storage_layout.md` first. GIIS `teaching-videos/` is active on T9 via symlink: `/Users/alanhdchu/giis-website/teaching-videos` -> `/Volumes/T9-Active/Projects/giis-website/teaching-videos`. The release gate reads the symlinked tree, and `teaching-videos/` is intentionally ignored/untracked in git. Do not force-add lesson-video source files, generated media, audit snapshots, or approval state; publish website-visible video state through `public/data/lessons-manifest.json`.

## 🎯 The single goal
**Get parents to pay, and keep paying.** Every change should be evaluated against this lens — does it raise willingness to pay, or maintain trust after they've paid? If the answer is "neither," reconsider the priority.

The three things parents judge a school on:
1. **Trust** — is this a real school? Is the diploma real?
2. **Transparency** — can I see what my child is learning?
3. **Results** — is my child making progress?

Any new feature or change should reduce friction on at least one of these three.

---

## 🔁 The working ritual (never skip)

**BEFORE you start any task:**
1. Read `/Users/alanhdchu/umi-central/goals.md` first when priority or cross-project coordination matters.
2. Read this repo's `ROADMAP.md` for current GIIS lanes and local evidence.
3. Read `umi/workload.md` only as the current focused worker handoff; it must not become a second roadmap.
4. Decide the work mode: Umi-first, cc-first, or Split-work.
5. For coding-heavy, debugging-heavy, QA-heavy, or mechanical implementation work, prefer cc-first or Split-work unless the task is tiny or tightly tied to Alan's taste/intent.

**AFTER you finish any task:**
1. Update the smallest source of truth that actually changed.
2. Use `ROADMAP.md` for brief completed milestones, current local GIIS lanes, future work, priorities, and non-goals.
3. Use `umi/workload.md` only for one active worker handoff.
4. Let Central Umi update `goals.md`, `dispatch.md`, or `status.md` when cross-project priority changes.
5. Do not dump completed history back into the active roadmap.

The goal is a clean routing chain, not a giant task diary.

---

## 📐 Established conventions (don't reinvent these)

### Truthful claims only
- ❌ Cognia, accredited, US-accredited — we are NOT accredited (only Florida-registered)
- ✅ "Florida-registered private school", "Florida Statute 1002.42", "24-credit framework"
- ✅ "in the process of pursuing regional accreditation" (the honest forward-looking phrasing in `SchoolProfilePage.js`)
- Principal name: **Shiyu Zhang, Ph.D.**, title **President & Principal**

### University acceptance names — full names, no abbreviations
- UC Santa Barbara · The Ohio State University · UC Davis · Syracuse University · New Jersey Institute of Technology
- Don't write "UCSB" / "NJIT" / "(SIT)" anywhere user-facing

### Multi-tier pricing
- Self-Paced Founders: **$49/month** or **$499/year**
- Guided: **$149/month**, includes monthly advisor check-in, course planning, transfer-credit review, and parent progress review
- Premium / College Pathway: **$299/month**, includes higher-touch pathway planning, writing/project portfolio guidance, and college-readiness framing
- Group pricing is inquiry-based; do not publish a low public group checkout price that undercuts the individual plans.
- Stripe integration must keep legacy `founders_monthly` / `monthly` aliases mapped to the current self-paced plan until old checkout links are retired.

### Demo pipeline (`scripts/make-demo.mjs`)
- Captions are source-of-truth in `public/demo/walkthrough.html` → `const CAPTIONS = [...]`. The make-demo script parses them. **Never hardcode captions in the script.**
- 4 voices used (alternating personas):
  - `en-US-AriaNeural` — school voice (hook, diploma, CTA)
  - `en-US-GuyNeural` — academic authority (pathways, transcript)
  - `en-US-JennyNeural` — student journey (dashboard, module, exam)
  - `en-US-AndrewNeural` — parent voice (parent view)
- Idempotent stages: `npm run make-demo` (full), `:audio` (regen voiceover only), `:merge` (remux only), `:force` (rebuild)
- Auto-deploys final MP4 + poster to `public/demo/`

### Hero/visual style — real product, not stock photos
- Replaced AI carousel and 4 inner-page hero images with real Learn Portal screenshots captured from `walkthrough.html`
- Screenshots live in `src/img/Hero/` (`dashboard-screen.jpg`, `pathways-screen.jpg`, `module-screen.jpg`, `transcript-screen.jpg`, `diploma-screen.jpg`)
- New hero screenshots: capture via Playwright + `walkthrough.html` `seek()` API, screenshot `.scene-inner`, save to `src/img/Hero/`
- ❌ Don't use AI-generated photos in the hero again. Don't bring back `homepage[1-8].png`.

### Mobile CSS pattern (Learn Portal)
- Don't rewrite inline styles. Add `data-m="..."` attribute to the element and target it from `src/components/pages/Learn/learn-mobile.css`
- Existing tags: `learn-page`, `welcome-row`, `stat-grid`, `banner-row`, `course-grid`, `breadcrumb`, `course-stats`

### Bilingual UI
- Use `language` prop, simplified Chinese (`zh-CN`) — same as existing `siteStrings.js`
- Admin pages can stay English-only

### Demo, not just decoration
- Whenever you build something visible to parents, ask: "Could a parent re-watch / re-open this and learn something new?" If yes, also wire it into the homepage flow (currently between Introduction and Pathways at the `id="demo"` anchor)

### Frontend deploy routing — GitHub push triggers Netlify
- For this repo, pushing local `main` to GitHub `origin/main` automatically triggers the Netlify frontend deploy for `genesisideas.school`.
- Treat `git push origin main` as the frontend deploy action. Do not describe Netlify as a separate manual deploy step unless Alan explicitly changes the hosting setup.
- Because push equals frontend deploy, run the sales/public trust/build/browser gates before pushing when parent-facing surfaces changed.
- This does not restart or deploy the Lightsail backend. Backend/API/Prisma changes still require the separate Lightsail/payment deploy runbook.

### Official transcript / diploma format — locked
- Official document visuals are part of school trust, not ordinary styling. Before changing transcript or diploma format, read `docs/official-document-format-contract.md`.
- Run `npm run audit:official-docs` before sending or shipping official transcript/diploma changes.
- Do not switch back to `src/img/transcript_seal.jpg`; use `src/img/transcript_seal_transparent.png`.
- Keep transcript export and `server/scripts/send-graduation-document-packages.js` visually aligned.
- Do not remove the diploma central-name SVG rendering unless Alan explicitly approves another no-highlight PDF-safe approach.

---

## 📁 Canonical paths

| Purpose | Path |
|---|---|
| Roadmap (single source of truth) | `ROADMAP.md` |
| This file | `AGENTS.md` |
| Demo HTML walkthrough | `public/demo/walkthrough.html` |
| Final demo MP4 | `public/demo/giis-demo.mp4` |
| Parent dashboard mockup (design ref) | `public/demo/parent-dashboard-mockup.html` |
| Real student transcript data | `server/prisma/seed.js` (Yunfan, Baoyi, Ruwen, Tao) |
| Mobile CSS overrides | `src/components/pages/Learn/learn-mobile.css` |
| Hero product screenshots | `src/img/Hero/` |
| Official document visual contract | `docs/official-document-format-contract.md` |
| Official document format audit | `tools/graduation/audit_official_document_formats.js` |

---

## 🚫 Don't reintroduce

- AI-generated stock photos as hero / marketing visuals
- "Cognia", "US-accredited", "美国认证" in user-facing copy
- "UCSB" / "NJIT" / "(SIT)" abbreviations
- `mailto:` Enroll/Apply buttons (use `<Link to="/admission">`)
- Hardcoded demo captions in `make-demo.mjs` (parse from `walkthrough.html`)

---

## 🧭 When deciding priority — ask in this order

1. Does this make a parent more likely to **trust** the school enough to pay? (Phase 0 fixes)
2. Does this make a parent more likely to **see** that their child is making progress? (Phase 1)
3. Does this make **paying** easier or more legitimate-feeling? (Phase 2: Stripe, /apply, verification QR)
4. Does this make a paying parent more likely to **stay**? (Phase 3: advisor notes, semester reports)
5. Otherwise → it's tech debt or "nice to have." Don't do it before the above.
