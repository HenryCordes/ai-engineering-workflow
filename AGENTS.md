# AI Agent Rules

> Read by AI coding assistants (Claude Code, Cursor, Copilot, etc.). This is the
> single source of truth for how to work in this project. Tool-specific files
> (`.cursorrules`, `CLAUDE.md`) should redirect here rather than duplicate rules.

## Documentation Index

Load the right doc for the task instead of reading everything:

| Topic | File | When to read |
|-------|------|-------------|
| Git hooks & branch naming | [docs/GIT_HOOKS.md](docs/GIT_HOOKS.md) | Before committing or pushing |
| Development setup & tooling | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | First-time setup, tooling questions |
| React & component standards | [docs/REACT_GUIDELINES.md](docs/REACT_GUIDELINES.md) | When creating or structuring components |

## Tech Stack

- TypeScript, React, Next.js (App Router), Node.js
- Testing: Vitest + @testing-library/react
- Package manager: pnpm (never npm/yarn)

## Principles (always apply)

- **DRY, KISS, SOLID — with judgment, not dogma.** Avoid premature abstraction; a
  wrong abstraction costs more than a little duplication. Apply SOLID's spirit
  (single responsibility, composition) over ceremony.
- **Tests are the guardrail.** New behaviour ships with tests; AI-generated code
  must prove itself.
- **Derive state during render**; don't store computed values you can compute.
- **No barrel imports** — use direct paths to keep bundles lean.

## Workflow (spec-driven)

1. Brainstorm → 2. Spec ([specs/](specs)) → 3. Implementation plan
([specs/implementation-plans/](specs/implementation-plans)) → 4. Implement.

For agentic work, use the Superpowers sub-skills (`superpowers:executing-plans`,
`superpowers:subagent-driven-development`) to implement plans task-by-task.

## Commit & PR rules

- Never commit to `main`. Branch names follow the convention in
  [docs/GIT_HOOKS.md](docs/GIT_HOOKS.md).
- Run lint + typecheck before staging.
- Never commit automatically — only on explicit user authorization. See
  [.claude/skills/commit.md](.claude/skills/commit.md).
