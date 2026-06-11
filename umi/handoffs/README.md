# Claude Code Handoffs

Use this folder for bounded task briefs given to Claude Code or another implementation worker.

Handoffs should be specific enough that a worker can act without re-interviewing Alan, but broad enough that cc can still notice bugs, stale assumptions, and better direction inside the bounded area. Umi should do a first look before writing the handoff instead of forwarding Alan's shorthand directly.

## Template

```md
# Handoff: <task title>

## Context

Why this matters for GIIS. Tie it to trust, transparency, results, or operations.

## Goal

What should be true after the task is done.

## Pass Type

scouting review / all-current-diff alignment review / bug-hunt review /
diagnosis-only / implementation / verification / cleanup

## Umi First Look

- What Umi/Codex already checked:
- Current GIIS lane from `ROADMAP.md`:
- Relevant current git status/diff:
- What is still uncertain:
- Why cc should review or implement this pass:

## Files To Read First

- `/Users/alanhdchu/umi-central/goals.md` row for `giis-website`
- `ROADMAP.md`
- `AGENTS.md`
- specific files relevant to the task

## Candidate Files Or Directories

- areas cc may inspect for adjacent risk

## In Scope

- concrete change 1
- concrete change 2

## Out Of Scope

- things the worker must not touch
- production/deploy/email/data actions requiring Alan confirmation

## Open Questions For cc

- questions where cc should use independent technical judgment

## Review Breadth

- how far cc may look beyond the named files
- adjacent risks cc should actively flag

## Acceptance Criteria

- measurable check 1
- command or visual check 2
- roadmap update requirement only if durable direction changed

## Expected Worker Report

- top findings by severity
- recommended direction
- whether implementation should happen now, wait, or be narrowed
- files changed or inspected
- commands run
- verification result
- blockers and residual risk

## Review Notes For Umi

What Umi should inspect after the worker returns.
```

## Standing Rules

- Read `ROADMAP.md` and `AGENTS.md` before work.
- For review or alignment passes, inspect current git status/diff and relevant adjacent files, not only the files Umi already suspects.
- For implementation, debugging, tests, refactor cleanup, or repo-local docs, cc may edit inside the explicit allowed scope. Umi/Codex reviews the diff before accepting.
- Preserve truthful claims: Florida-registered, not accredited.
- Do not modify official transcript/diploma visuals without reading `docs/official-document-format-contract.md`.
- Do not send external email, change production data, deploy, or charge money without Alan confirmation.
- Update `ROADMAP.md` only when the result changes durable direction, current lanes, future work, priorities, non-goals, or an important completed milestone. Short-lived review evidence belongs in `umi/reviews/`, reports, or git history.

## Foundation Video Daily Handoffs

Daily foundation-video handoffs are durable worker evidence, not throwaway logs.
Keep the dated `umi/handoffs/YYYY-MM-DD-foundation-video-*.md` files tracked
when they describe a produced or repaired lesson. They should include enough
context to explain the selected module, the cc/Codex scope, gate result, upload
result, and any residual risk.

Do not use handoffs for raw generated review artifacts, transcripts, or contact
sheets. Those belong in the lesson output folder and may be regenerated from the
pipeline when needed.
