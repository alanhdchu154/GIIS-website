# Claude Code Model Routing (GIIS local copy)

Synced from Central: `/Users/alanhdchu/umi-central/docs/cc_model_routing.md`
Synced: 2026-07-03. Central remains the master; edit Central first, then
re-sync here. This local copy exists so `docs/cc_model_routing.md` references in
`AGENTS.md` and `CLAUDE.md` resolve inside this repo for VS Code Claude Code.

Use Claude Code model aliases for routine handoffs, not hard-coded version
names. Local Claude Code accepts an alias such as `sonnet` or `opus`, or a full
model name. The current official Anthropic model migration docs identify the new
Sonnet line as `claude-sonnet-5`; Anthropic's Opus page identifies the current
strong Opus API model as `claude-opus-4-8`. GIIS should still route cc work with
aliases by default:

- `--model sonnet`: latest Sonnet line, currently the Sonnet 5 line. Use this
  for most code-mode production mechanics.
- `--model opus`: latest available Opus-class line in Claude Code. Use this for
  judgment-heavy or high-risk work.

Only pin a full model ID when debugging a migration/regression, reproducing an
old result, or a project runbook explicitly requires a full API model name.

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
| Root-cause diagnosis | Opus when non-obvious | runtime stall, data corruption, privacy leak, flaky state machine, cross-file behavior |
| Architecture / protocol / security | Opus alias | privacy boundaries, payment/deploy risk, agent memory semantics, benchmark validity, external claims |
| Research / paper claim boundary | Opus alias | evidence matrix, synthetic-vs-real validation, reviewer-premortem, academic/public claim safety |
| Long generation / watch / broad suites | avoid by default | split the task; use explicit stop conditions before choosing any model |

## GIIS Project Bias

- Use `--model sonnet` for foundation lesson-video production mechanics, docs
  cleanup, simple UI, manifest checks, bounded pipeline verification, and
  generated-artifact classification.
- Use `--model opus` for independent release judgment, parent trust,
  payment/deploy risk, public school claims, broad bug-hunt review, and
  sales-readiness decisions.
- The foundation lesson-video pipeline encodes this split directly:
  `FOUNDATION_CC_MODEL=sonnet` for bounded production/render mechanics and
  `FOUNDATION_REVIEW_MODEL=opus` for independent source-alignment and
  parent-trust review.

## Handoff Requirements

Every non-trivial cc handoff should state:

- model target: `sonnet` or `opus`, written as an alias unless there is a
  concrete reason to pin a full model ID
- why that model is appropriate
- pass type: scouting, implementation, verification, bug-hunt, architecture,
  protocol/privacy, research/paper, cleanup, docs, release review, or
  parent-trust review
- allowed files/directories and commands
- stop conditions and retry rule if timeout happens

If cc times out or stalls, record the model target and whether the model choice
was part of the issue. Narrow the task before retrying; do not silently promote
every retry to Opus unless judgment/risk requires it.
