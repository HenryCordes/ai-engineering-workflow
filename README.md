# AI Engineering Workflow

How I build software with AI — a spec-driven workflow plus the context-engineering
pieces (skills, subagents, rules and docs) that make AI output consistent and
maintainable instead of generic.

This repo is a sanitized, self-contained look at how I actually work. The examples
are generic on purpose; the *patterns* are what matter.

## The workflow

I don't prompt ad hoc. I work in four reviewable phases, built on the
[Superpowers](https://github.com/obra/superpowers) workflow for Claude Code:

1. **Brainstorm** — explore the problem and options with the AI before committing to anything.
2. **Spec** — write a short, surgical spec: problem, inputs, outputs, edge cases, acceptance, tests. See [`specs/`](specs).
3. **Implementation plan** — turn the spec into a file map, a backwards-compatibility pass, and checkbox steps. See [`specs/implementation-plans/`](specs/implementation-plans).
4. **Implement** — execute the plan task-by-task, often with **parallel subagents** for independent work, and tests as the guardrail.

Each phase is a reviewable artifact, so the AI stays aligned with intent and the output is something I can actually trust.

## Context engineering

The biggest lever for good AI output is the context you give it, not the prompt. I keep that context in version control:

- **[`AGENTS.md`](AGENTS.md)** — a single source of truth for project rules, indexed so the AI (and humans) can load the right doc at the right time.
- **[`CLAUDE.md`](CLAUDE.md)** — the Claude Code entry point. Deliberately thin: it redirects to `AGENTS.md` so the rules live in one place instead of being duplicated per tool. A `SessionStart` hook in [`.claude/`](.claude) primes branch and workflow context automatically.
- **[`docs/`](docs)** — the standards `AGENTS.md` points to (git hooks, development setup, React guidelines).
- **[`.claude/skills/`](.claude/skills)** — reusable, plain-English skills for recurring tasks (commit, PR description, safe rollout) with the safety rules baked in.
- **[`.claude/agents/`](.claude/agents)** — focused subagents (e.g. a test writer) that run independently and in parallel.
- **[`.claude/settings.json`](.claude/settings.json)** — a scoped permission allowlist and a session-start hook that primes context automatically.

## Running the worked example

The feature-flag hook in [`src/feature-flags/`](src/feature-flags) is real, tested
code — the output of the workflow above, not a sketch. To run it yourself you need
**Node 20+** and **pnpm 10+**:

```bash
pnpm install       # install dependencies
pnpm test          # Vitest — 13 unit + hook tests
pnpm typecheck     # tsc --noEmit (strict)
pnpm lint          # ESLint (flat config)
pnpm format:check  # Prettier
```

The toolchain is intentionally minimal — Vitest, TypeScript, and ESLint/Prettier —
just enough to prove the example without standing up a full Next.js app.

## Principles

I value **DRY, KISS and SOLID — held with judgment, not dogma.** I avoid premature
abstraction (a wrong abstraction costs more than a little duplication) and apply
SOLID's spirit — single responsibility, composition — over ceremony. Quality is
measured by what users feel, backed by tests, not by how clever the code looks.

## Repo tour

| Path | What it shows |
|------|---------------|
| [`specs/`](specs) | A worked spec → implementation-plan pair (a typed feature-flag hook) |
| [`src/feature-flags/`](src/feature-flags) | The implemented hook + tests — the workflow's output, green and typed |
| [`AGENTS.md`](AGENTS.md) | The single-source-of-truth context pattern |
| [`CLAUDE.md`](CLAUDE.md) | The thin Claude Code entry that redirects to `AGENTS.md` |
| [`docs/`](docs) | Standards referenced by `AGENTS.md` |
| [`.claude/skills/`](.claude/skills) | Reusable task skills with safety rails |
| [`.claude/agents/`](.claude/agents) | Independent, parallelizable subagents |
| [`.claude/`](.claude) | Permissions + session-start hook |

## Credits

Built with [Claude Code](https://www.anthropic.com/claude-code) and the
[Superpowers](https://github.com/obra/superpowers) workflow extension.

---

By **Henry Cordes** — [devartist.nl](https://devartist.nl) · [LinkedIn](https://www.linkedin.com/in/henrycordes)
