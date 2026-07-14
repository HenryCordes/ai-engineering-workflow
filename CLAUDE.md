# CLAUDE.md — Project Context for Claude Code

## Source of truth

All AI agent rules, conventions and standards live in [AGENTS.md](AGENTS.md).
**Read it first** — it covers the tech stack, principles (DRY/KISS/SOLID with
judgment), the spec-driven workflow, and commit/PR rules. This file intentionally
stays thin to avoid duplicating that source of truth.

## Auto-loaded context

A `SessionStart` hook ([.claude/hooks/session-start.sh](.claude/hooks/session-start.sh))
primes branch and workflow context at the start of every session.

## Commands, skills, subagents & workflows

- **Commands** ([.claude/commands/](.claude/commands)): `new-spec` — scaffold a spec + plan pair.
- **Skills** ([.claude/skills/](.claude/skills)): `commit`, `pr-description`, `safe-rollout`,
  `scaffold-module` (scaffold a new `src/` module).
- **Subagents** ([.claude/agents/](.claude/agents)): `write-test`, `review-standards` — dispatch
  with the `Agent` tool; run independent work in parallel.
- **Workflows** ([.claude/workflows/](.claude/workflows)): `parallel-review` (multi-agent review
  + skeptic), `generate-tests` (parallel test backfill).

## Workflow

Brainstorm → spec → implementation plan → implement, on the
[Superpowers](https://github.com/obra/superpowers) workflow. Specs and plans live
in [specs/](specs). Layout: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
