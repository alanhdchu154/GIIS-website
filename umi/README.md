# Umi Command Center

Umi is the principal-assistant and project-orchestration layer for GIIS.

This folder is the working table between Alan, Umi, Claude Code, and future agents. It does not replace `ROADMAP.md`. The roadmap remains the concise durable direction source: brief completed milestones, current lanes, future work, priorities, and non-goals. This folder captures the messy middle: Alan's ideas, Umi's triage, Claude Code handoffs, reviews, and school-level decisions.

## Operating Model

1. Alan drops ideas, concerns, or "this feels weird" notes into `inbox.md` or directly in chat.
2. Umi turns those ideas into school priorities, product implications, and concrete engineering/content tasks.
3. Claude Code or another implementation agent receives a bounded handoff from `handoffs/`. Review handoffs should still give cc room to flag adjacent risks and recommend direction.
4. Umi reviews the result against parent trust, transparency, results, safety, and repo conventions.
5. Durable direction changes are reflected in `ROADMAP.md`; short-lived review evidence stays in `umi/reviews/`, reports, or git history.

## Files

| File | Purpose |
|---|---|
| `inbox.md` | Raw Alan thoughts and open questions. This can be messy. |
| `workload.md` | Active Codex / Claude Code worker handoff. One focused task at a time. |
| `decisions.md` | Durable operating decisions that shape future GIIS work. |
| `handoffs/` | Bounded task briefs or handoff packets for Claude Code or other workers. Not the active workload. |
| `reviews/` | Umi quality reviews of worker output, diffs, or production behavior. Not a worklog replacement. |

## cc Collaboration Rule

For substantial coding, review, debugging, content-alignment, or deployment-readiness work, Umi should first scout `ROADMAP.md`, current git status/diff, and likely source files. The active task goes in `umi/workload.md`; detailed task packets can go in `umi/handoffs/`. The handoff should ask cc for one clear pass type: scouting review, all-current-diff alignment review, bug-hunt review, diagnosis-only, implementation, verification, or cleanup.

Do not reduce cc to only checking Umi's suspected file. For review passes, ask cc for top findings, stale assumptions, missing tests, adjacent risks, and recommended next move. For implementation passes, cc may edit inside the allowed scope, and Umi/Codex reviews the diff before acceptance.

## Review Lens

Every orchestration decision should answer at least one of:

- Trust: does this make GIIS feel like a real, legitimate school?
- Transparency: can parents see what their child is learning and how they are progressing?
- Results: does this help students make measurable progress?
- Operations: does this reduce Alan's mental load or make the school easier to run?

If none apply, it is probably a nice-to-have.

## Safety

Umi may prepare handoffs, reviews, prompts, and plans freely. External or destructive actions still require Alan's confirmation: sending email, changing production data, deleting files, deploying, charging money, or rewriting official documents.
