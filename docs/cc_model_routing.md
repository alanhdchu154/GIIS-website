# Claude Code Model Routing (GIIS local copy)

Synced from Central: `/Users/alanhdchu/umi-central/docs/cc_model_routing.md`
Synced: 2026-07-03. Central remains the master; edit Central first, then
re-sync here. This local copy exists so `docs/cc_model_routing.md` references in
`AGENTS.md` and `CLAUDE.md` resolve inside this repo for VS Code Claude Code.

Use Claude Code model aliases for routine handoffs when the alias is confirmed,
and use the full model ID when a newly restored model does not yet have a local
alias. Local Claude Code accepts an alias such as `sonnet` or `opus`, or a full
model name. The current official Anthropic docs identify Fable 5 as
`claude-fable-5`, the Sonnet line as `claude-sonnet-5`, and the current
Opus-class line as `claude-opus-4-8`. GIIS should route cc work this way:

- `--model sonnet`: latest Sonnet line, currently the Sonnet 5 line. Use this
  for most code-mode production mechanics.
- `--model opus`: latest available Opus-class line in Claude Code. Use this for
  judgment-heavy or high-risk work when Fable is unnecessary or unsuitable.
- `--model claude-fable-5`: Fable 5 full model ID. Use only for
  highest-capability ambitious long-horizon work after local access is
  confirmed and retention/safeguard constraints are acceptable.

Only pin a full model ID when debugging a migration/regression, reproducing an
old result, a project runbook explicitly requires a full API model name, or a
newly restored model such as Fable 5 is not yet reachable by a short alias.

Goal: spend the strongest model where judgment matters, and keep routine work on
the cheaper/faster model.

## Default Matrix

| Task type | Default model | Examples |
| --- | --- | --- |
| Tiny / mechanical | no cc, or Sonnet if delegated | formatting, typo fixes, one-file docs cleanup, simple grep/classification |
| Scouting / inventory | Sonnet alias | first-pass repo scan, file map, dirty-tree bucketing, dependency/path audit, generated-artifact classification |
| Routine implementation | Sonnet alias | small scoped UI/code edits, config/docs updates, adding tests for known behavior, straightforward refactor |
| Verification / test triage | Sonnet first | run bounded checks, summarize failures, identify likely owner/file; escalate if root cause is unclear |
| Independent bug-hunt review | Opus alias | current diff alignment, regression hunting, missing-test review, high-risk correctness review |
| Root-cause diagnosis | Opus when non-obvious; Fable only for highest-stakes long-horizon diagnosis | runtime stall, data corruption, privacy leak, flaky state machine, cross-file behavior |
| Architecture / protocol / security | Opus alias | privacy boundaries, payment/deploy risk, agent memory semantics, benchmark validity, external claims |
| Research / paper claim boundary | Opus alias | evidence matrix, synthetic-vs-real validation, reviewer-premortem, academic/public claim safety |
| Ambitious long-running / broad migration | Fable if access confirmed and constraints acceptable; otherwise Opus | large migrations, complex multi-day implementation, cross-repo transformations, long-running autonomous coding |
| Long generation / watch / broad suites | avoid by default | split the task; use explicit stop conditions before choosing any model |

## GIIS Project Bias

- Use `--model sonnet` for foundation lesson-video production mechanics, docs
  cleanup, simple UI, manifest checks, bounded pipeline verification, and
  generated-artifact classification.
- Use `--model opus` for independent release judgment, parent trust,
  payment/deploy risk, public school claims, broad bug-hunt review, and
  sales-readiness decisions.
- Use `--model claude-fable-5` only for unusually ambitious GIIS long-horizon
  work such as large cross-module migrations or multi-day autonomous
  implementation, after confirming local access and retention/safeguard
  acceptability. Do not use Fable for ordinary lesson-video production.
- The foundation lesson-video pipeline encodes this split directly:
  `FOUNDATION_CC_MODEL=sonnet` for bounded production/render mechanics and
  `FOUNDATION_REVIEW_MODEL=opus` for independent source-alignment and
  parent-trust review.

## Handoff Requirements

Every non-trivial cc handoff should state:

- model target: `sonnet`, `opus`, or `claude-fable-5`
- why that model is appropriate, including Fable access/retention/safeguard
  acceptance if Fable is selected
- pass type: scouting, implementation, verification, bug-hunt, architecture,
  protocol/privacy, research/paper, cleanup, docs, release review, or
  parent-trust review
- allowed files/directories and commands
- stop conditions and retry rule if timeout happens

If cc times out or stalls, record the model target and whether the model choice
was part of the issue. Narrow the task before retrying; do not silently promote
every retry to Opus unless judgment/risk requires it.
