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

**See it in action:** [`docs/CASE_STUDY.md`](docs/CASE_STUDY.md) walks through
the PR that shipped most of what's in this repo — including two real bugs the
process caught before merge, not a sanitized success story.

## Context engineering

The biggest lever for good AI output is the context you give it, not the prompt. I keep that context in version control:

- **[`AGENTS.md`](AGENTS.md)** — a single source of truth for project rules, indexed so the AI (and humans) can load the right doc at the right time.
- **[`CLAUDE.md`](CLAUDE.md)** — the Claude Code entry point. Deliberately thin: it redirects to `AGENTS.md` so the rules live in one place instead of being duplicated per tool. A `SessionStart` hook in [`.claude/`](.claude) primes branch and workflow context automatically.
- **[`docs/`](docs)** — the standards `AGENTS.md` points to (architecture, git hooks, development setup, React guidelines).
- **[`.claude/commands/`](.claude/commands)** — slash commands for repeatable ops; `new-spec` scaffolds a spec + implementation-plan pair from the house templates.
- **[`.claude/skills/`](.claude/skills)** — reusable, plain-English skills for recurring tasks (commit, PR description, safe rollout, scaffold a module) with the safety rules baked in. Each skill is a folder (`<name>/SKILL.md` plus colocated resources, e.g. `scaffold-module/templates/`), and skills carry a `## Lessons` changelog of the failures they've absorbed — see below.
- **[`.claude/agents/`](.claude/agents)** — focused subagents (a test writer, a standards reviewer) that run independently and in parallel.
- **[`.claude/workflows/`](.claude/workflows)** — `parallel-review`: a runnable,
  multi-agent orchestration script — three reviewers (correctness, security,
  this project's own standards) fan out in parallel, then every finding goes
  through an independent skeptic before it's reported. This is the literal
  code behind the "parallel subagents" claim above, not just a description of
  it. `generate-tests` reuses the same orchestration to backfill tests across
  many untested modules at once.
- **[`.claude/settings.json`](.claude/settings.json)** — a scoped permission allowlist and a session-start hook that primes context automatically.
- **[`.husky/`](.husky)** — the git hooks `docs/GIT_HOOKS.md` documents, actually
  wired up: `pre-commit` runs lint-staged, `commit-msg` blocks commits whose
  message or branch name doesn't conform, `post-checkout` warns on a bad branch
  name, `pre-push` runs the test suite.

### Small context, self-hardening skills

Two rules govern all of the above:

**Keep the always-loaded context minimal.** `CLAUDE.md` is a handful of lines and
`AGENTS.md` stays under a page, because every word in them is paid for in every single
session. Models already know TypeScript and React; the context documents only what they
can't know — this project's conventions, decisions, and workflow. Everything else loads on
demand: docs through the index in `AGENTS.md`, skills through their own trigger
descriptions (a skill costs one description line until it's actually needed).

**Treat context files like code: failures get fixes.** When a session goes wrong in a way
a skill or doc should have prevented, the
[`improve-skill`](.claude/skills/improve-skill/SKILL.md) skill patches the responsible
file with the smallest rule that would have prevented the failure, and logs it in that
skill's `## Lessons` section — date, failure, rule. Skills converge on bulletproof instead
of the same correction being repeated across sessions, and the audit trail shows *why*
every rule exists (see the Lessons in
[`scaffold-module`](.claude/skills/scaffold-module/SKILL.md), grown out of the bugs in the
[case study](docs/CASE_STUDY.md)).

**And CI holds both rules to account.** Stated rules drift unless something enforces them,
so the same pipeline that runs lint and tests also runs
[`check-context-budget`](scripts/check-context-budget.mjs) — the build fails when
`CLAUDE.md`, `AGENTS.md`, or any skill description outgrows its budget, forcing a
deliberate "move this to an on-demand doc" decision instead of silent bloat — and
[`check-links`](scripts/check-links.mjs), which fails on any broken relative link, because
a doc index or skill pointing at a moved file is a broken import. Run them locally with
`pnpm check:context` and `pnpm check:links`.

## Running the working example

Three worked examples live in [`src/`](src), each taking the same spec →
plan → implement path to a different kind of problem:

- **[`src/feature-flags/`](src/feature-flags)** — sync, pure: a typed
  `useFeatureFlag` hook with no I/O, tested without fake timers or mocks.
- **[`src/http/`](src/http)** — async, with a real I/O boundary: a
  `fetchWithRetry` wrapper with exponential backoff, tested with an injected
  `fetch` and fake timers instead of real waiting.
- **[`src/llm-extract/`](src/llm-extract)** — a **nondeterministic boundary**:
  typed field extraction from unstructured text (receipts) via an injected LLM
  client, with schema validation, bounded repair-retries on malformed model
  output, and — the part that matters — a golden-set **eval** that measures
  per-field accuracy against a threshold instead of assuming the LLM got it
  right. Unit tests run on a scripted fake; the real-API eval
  (`llmExtract.eval.test.ts`) activates only when `ANTHROPIC_API_KEY` is set,
  so CI needs no secrets.

To run them yourself you need **Node 20+** and **pnpm 10+** (the exact version
this repo was built against is pinned via `packageManager` in
[`package.json`](package.json)):

```bash
pnpm install       # install dependencies
pnpm test          # Vitest — 41 unit + hook tests (+1 gated eval)
pnpm typecheck     # tsc --noEmit (strict)
pnpm lint          # ESLint (flat config)
pnpm format:check  # Prettier
```

The toolchain is intentionally minimal — Vitest, TypeScript, and ESLint/Prettier —
just enough to prove the examples without standing up a full Next.js app. The
same four commands run in CI on every push and pull request — see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Principles

I value **DRY, KISS and SOLID — held with judgment, not dogma.** I avoid premature
abstraction (a wrong abstraction costs more than a little duplication) and apply
SOLID's spirit — single responsibility, composition — over ceremony. Quality is
measured by what users feel, backed by tests, not by how clever the code looks.

## Repo tour

| Path | What it shows |
|------|---------------|
| [`specs/`](specs) | Two worked spec → implementation-plan pairs (a typed feature-flag hook; an async retry wrapper) |
| [`src/feature-flags/`](src/feature-flags) | The sync/pure example — hook + tests, green and typed |
| [`src/http/`](src/http) | The async/I-O-boundary example — retry wrapper + tests using fake timers |
| [`AGENTS.md`](AGENTS.md) | The single-source-of-truth context pattern |
| [`CLAUDE.md`](CLAUDE.md) | The thin Claude Code entry that redirects to `AGENTS.md` |
| [`docs/`](docs) | Standards referenced by `AGENTS.md` |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How the repo is laid out — worked examples, docs, and agent tooling |
| [`.claude/commands/`](.claude/commands) | Slash commands — `new-spec` scaffolds a spec + plan pair |
| [`.claude/skills/`](.claude/skills) | Reusable task skills with safety rails, each with a `## Lessons` changelog (incl. `scaffold-module` + templates) |
| [`.claude/skills/improve-skill/`](.claude/skills/improve-skill) | The hardening loop — session failures become permanent skill fixes |
| [`.claude/agents/`](.claude/agents) | Independent, parallelizable subagents (`write-test`, `review-standards`) |
| [`.claude/`](.claude) | Permissions + session-start hook |
| [`.husky/`](.husky) | Real git hooks matching `docs/GIT_HOOKS.md` — not just documentation |
| [`scripts/`](scripts) | CI guardrails for the context itself — budget + link checks |
| [`.github/`](.github) | CI workflow + PR template the skills/docs reference |
| [`.editorconfig`](.editorconfig) | Editor-level formatting baseline matching `docs/DEVELOPMENT.md` |
| [`.claude/workflows/parallel-review.js`](.claude/workflows/parallel-review.js) | A runnable multi-agent workflow: parallel reviewers + adversarial verification |
| [`.claude/workflows/generate-tests.js`](.claude/workflows/generate-tests.js) | A parallel workflow that backfills tests for untested modules |
| [`docs/CASE_STUDY.md`](docs/CASE_STUDY.md) | The workflow's first real PR, including the bugs it caught before merge |

## Credits

Built with [Claude Code](https://www.anthropic.com/claude-code) and the
[Superpowers](https://github.com/obra/superpowers) workflow extension.

---

By **Henry Cordes** — [devartist.nl](https://devartist.nl) · [LinkedIn](https://www.linkedin.com/in/henrycordes)
