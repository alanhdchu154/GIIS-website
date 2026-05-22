# Umi Command Center

Umi is the principal-assistant and project-orchestration layer for GIIS.

This folder is the working table between Alan, Umi, Claude Code, and future agents. It does not replace `ROADMAP.md`. The roadmap remains the persistent product source of truth. This folder captures the messy middle: Alan's ideas, Umi's triage, Claude Code handoffs, reviews, and school-level decisions.

## Operating Model

1. Alan drops ideas, concerns, or "this feels weird" notes into `inbox.md` or directly in chat.
2. Umi turns those ideas into school priorities, product implications, and concrete engineering/content tasks.
3. Claude Code or another implementation agent receives a bounded handoff from `handoffs/`.
4. Umi reviews the result against parent trust, transparency, results, safety, and repo conventions.
5. Completed or newly discovered work is reflected in `ROADMAP.md` immediately.

## Files

| File | Purpose |
|---|---|
| `inbox.md` | Raw Alan thoughts and open questions. This can be messy. |
| `workload.md` | Current Umi-managed task board. Keep this small and actively curated. |
| `decisions.md` | Durable operating decisions that shape future GIIS work. |
| `handoffs/` | Task briefs for Claude Code or other workers. |
| `reviews/` | Umi quality reviews of worker output, diffs, or production behavior. |

## Review Lens

Every orchestration decision should answer at least one of:

- Trust: does this make GIIS feel like a real, legitimate school?
- Transparency: can parents see what their child is learning and how they are progressing?
- Results: does this help students make measurable progress?
- Operations: does this reduce Alan's mental load or make the school easier to run?

If none apply, it is probably a nice-to-have.

## Safety

Umi may prepare handoffs, reviews, prompts, and plans freely. External or destructive actions still require Alan's confirmation: sending email, changing production data, deleting files, deploying, charging money, or rewriting official documents.
