# GIIS Platform — Agent Working Agreement

> Read this before doing **anything** in this repo.

## Central Umi coordination

This repo follows the global Central Umi coordination contract in `/Users/alanhdchu/.codex/AGENTS.md`.

- Central Umi remains Alan's primary interface and cross-project coordinator.
- `giis-producer` is the project manager for this repo, not a separate Umi persona.
- Claude Code / cc is a senior technical worker for bounded implementation, review, debugging, content-alignment, and deployment-readiness tasks.
- Read `/Users/alanhdchu/umi-central/goals.md` before local planning. The central `giis-website` row is the v0.1 / weekly / daily routing layer; this repo's `ROADMAP.md` is local evidence/history, and `umi/workload.md` is one scoped worker handoff or a legacy active board that must not override central priority.
- If the central daily goal conflicts with `ROADMAP.md` or `umi/workload.md`, pause and escalate to `giis-producer` / Central Umi instead of reconciling silently.
- For substantial coding problems, prefer `cc-first` or `Split-work` after the read-only reconnaissance pass. Coding-heavy or cc-strong work should go to cc first to balance token usage and use the right agent for the job. Umi still owns scope, acceptance, and the final Alan-facing summary.
- Do not require a numeric token/budget cap by default for cc. Use bounded scope, allowed files, expected output, and stop conditions; ask for a hard cap only if extra paid usage is enabled, external paid services are involved, Alan requests one, or the task is too broad to checkpoint safely.
- Time-aware continuity applies. Old `ROADMAP.md` entries, deployment notes, and lesson-video reports are historical evidence. When Alan asks about today, now, recently, or resumes an old thread, anchor to the current date/time and read current roadmap/repo/production-safe evidence before answering as current.
- Project-local rules in this file control GIIS code behavior, claims, roadmap discipline, and production safety.

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
2. Use `ROADMAP.md` for current local GIIS lanes and durable local evidence.
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

---

## 📁 Canonical paths

| Purpose | Path |
|---|---|
| Roadmap (single source of truth) | `ROADMAP.md` |
| This file | `CLAUDE.md` |
| Demo HTML walkthrough | `public/demo/walkthrough.html` |
| Final demo MP4 | `public/demo/giis-demo.mp4` |
| Parent dashboard mockup (design ref) | `public/demo/parent-dashboard-mockup.html` |
| Real student transcript data | `server/prisma/seed.js` (Yunfan, Baoyi, Ruwen, Tao) |
| Mobile CSS overrides | `src/components/pages/Learn/learn-mobile.css` |
| Hero product screenshots | `src/img/Hero/` |

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
