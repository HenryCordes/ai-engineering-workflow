# CLAUDE.md — Project Context for Claude Code

## Source of truth

All AI agent rules, conventions and standards live in [AGENTS.md](AGENTS.md).
**Read it first** — it covers the tech stack, principles (DRY/KISS/SOLID with
judgment), the spec-driven workflow, and commit/PR rules. This file intentionally
stays thin to avoid duplicating that source of truth.

## Auto-loaded context

A `SessionStart` hook ([.claude/hooks/session-start.sh](.claude/hooks/session-start.sh))
primes branch and workflow context at the start of every session.

## Skills & subagents

- **Skills** ([.claude/skills/](.claude/skills)): `commit`, `pr-description`, `safe-rollout`.
- **Subagents** ([.claude/agents/](.claude/agents)): `write-test` — dispatch with the
  `Agent` tool; run independent work in parallel.

## Workflow

Brainstorm → spec → implementation plan → implement, on the
[Superpowers](https://github.com/obra/superpowers) workflow. Specs and plans live
in [specs/](specs).
