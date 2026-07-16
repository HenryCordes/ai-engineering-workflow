# Architecture

This repo is a **teaching artifact**, not an application. Its "architecture" is the layout
that makes AI-assisted work reproducible: where the rules live, where the worked examples
live, and where the agent tooling lives. Everything here is generic on purpose.

## Three worked examples (`src/`)

Each example takes the same spec -> plan -> implement path to a deliberately different kind
of problem, so the workflow is shown on more than one shape of code:

| Module | Shape | What it proves |
|--------|-------|----------------|
| [`src/feature-flags/`](../src/feature-flags) | sync, pure (no I/O) | a typed `useFeatureFlag` hook tested without timers or mocks |
| [`src/http/`](../src/http) | async, real I/O boundary | a `fetchWithRetry` wrapper tested with an injected `fetch` + fake timers |
| [`src/llm-extract/`](../src/llm-extract) | nondeterministic boundary (LLM) | typed extraction with repair-retries, an injected client, and a golden-set eval that measures accuracy |

A module is a folder with `types.ts`, the implementation, and a colocated `*.test.ts`. New
modules follow the same shape — see the [`scaffold-module`](../.claude/skills/scaffold-module/SKILL.md) skill.

## Context, in version control

The rules an agent needs are files, not tribal knowledge:

- **[`AGENTS.md`](../AGENTS.md)** — the single source of truth, with a documentation index that tells an agent which `docs/` file to load for a task.
- **[`CLAUDE.md`](../CLAUDE.md)** — a thin Claude Code entry point that redirects to `AGENTS.md`.
- **[`docs/`](.)** — the standards `AGENTS.md` points to (this file, git hooks, development setup, React guidelines).

## Agent tooling (`.claude/`)

| Path | Kind | Runs | Example |
|------|------|------|---------|
| [`commands/`](../.claude/commands) | slash command | on demand, in your session | `new-spec` scaffolds a spec + plan pair |
| [`skills/`](../.claude/skills) | reusable skill | when its trigger matches | `commit`, `pr-description`, `safe-rollout`, `scaffold-module`, `improve-skill` |
| [`agents/`](../.claude/agents) | subagent | dispatched via the `Agent` tool, in parallel | `write-test`, `review-standards` |
| [`workflows/`](../.claude/workflows) | orchestration script | as a multi-agent run | `parallel-review`, `generate-tests` |
| `settings.json` | config | always | scoped permission allowlist + session-start hook |
| `hooks/session-start.sh` | hook | every session start | primes branch + workflow context |

**Skills vs subagents vs workflows.** A *skill* is guidance loaded into the current agent. A
*subagent* is a fresh, focused agent you dispatch for one job (it can run in parallel and has
its own tool permissions). A *workflow* is a script that orchestrates several subagents across
phases — `parallel-review` and `generate-tests` are the two worked examples.

Each skill is a folder — `SKILL.md` plus colocated resources (e.g.
`scaffold-module/templates/`). Skills carry a `## Lessons` changelog; the `improve-skill`
skill is the loop that appends to it: a session failure becomes the smallest permanent rule
that would have prevented it.

## Guardrails

`.husky/` git hooks and `.github/workflows/ci.yml` enforce the same four checks — `pnpm lint`,
`format:check`, `typecheck`, `test` — locally and in CI. See [GIT_HOOKS.md](GIT_HOOKS.md).
