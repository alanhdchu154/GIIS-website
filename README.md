# GIIS Website

Production-facing website and operations tooling for Genesis International
Innovative School.

## Read First

- `AGENTS.md` - repo rules, safety boundaries, and cc/Codex workflow.
- `ROADMAP.md` - durable product, sales, curriculum, deploy, and lesson-video
  state.
- `umi/workload.md` - current active worker handoff when a focused task is in
  progress.
- `tools/lesson-video/FOUNDATION_VIDEO_PIPELINE.md` - foundation lesson-video
  pipeline source of truth.

## Common Commands

```bash
npm run build
npm test -- --watchAll=false
npm run school:ops-report
npm run audit:frontend-deploy
npm run lesson:foundation-daily:dry-run
```

## Operating Boundaries

- Keep parent-facing claims conservative and evidence-backed.
- No automated checkout links until payment-live gates pass.
- Lesson-video production stays foundation-first and quality-gated.
- Use GitHub-to-Netlify as the normal production deploy path.
