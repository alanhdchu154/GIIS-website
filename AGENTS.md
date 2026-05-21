# GIIS Platform — Agent Working Agreement

> Read this before doing **anything** in this repo.

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
1. Read `ROADMAP.md` first. Find what's already done, what's pending, and check if your task is already on the list.
2. If you're picking up a pending item, read its full description (file paths, acceptance criteria, dependencies).
3. If your task isn't on the roadmap, ask whether it should be added before doing it.

**AFTER you finish any task:**
1. Update `ROADMAP.md` immediately. Mark the item as ✅ with a one-line summary of what was done. Or if you discovered new work, add it to the appropriate phase.
2. Don't batch updates. Update right after each task while the context is fresh.
3. The roadmap is the only persistent memory across sessions — if it's not there, it didn't happen.

This is non-negotiable. The roadmap stale = next agent makes wrong decisions.

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

### Founders pricing
- Public price: **$19.90/month** (regular $199/month)
- Annual: **$199/year** (regular $1,799)
- Frame: **"First 100 students · Locked for 12 months"**
- This is a marketing positioning, not the long-term price. Stripe integration must respect the 12-month lock.

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

## Imported Claude Cowork project instructions
