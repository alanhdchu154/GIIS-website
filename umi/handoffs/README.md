# Claude Code Handoffs

Use this folder for bounded task briefs given to Claude Code or another implementation worker.

Handoffs should be specific enough that a worker can act without re-interviewing Alan, but narrow enough that they do not rewrite the project.

## Template

```md
# Handoff: <task title>

## Context

Why this matters for GIIS. Tie it to trust, transparency, results, or operations.

## Goal

What should be true after the task is done.

## Files To Read First

- `ROADMAP.md`
- `AGENTS.md`
- specific files relevant to the task

## In Scope

- concrete change 1
- concrete change 2

## Out Of Scope

- things the worker must not touch
- production/deploy/email/data actions requiring Alan confirmation

## Acceptance Criteria

- measurable check 1
- command or visual check 2
- roadmap update requirement

## Review Notes For Umi

What Umi should inspect after the worker returns.
```

## Standing Rules

- Read `ROADMAP.md` and `AGENTS.md` before work.
- Preserve truthful claims: Florida-registered, not accredited.
- Do not modify official transcript/diploma visuals without reading `docs/official-document-format-contract.md`.
- Do not send external email, change production data, deploy, or charge money without Alan confirmation.
- Update `ROADMAP.md` immediately after finishing.
