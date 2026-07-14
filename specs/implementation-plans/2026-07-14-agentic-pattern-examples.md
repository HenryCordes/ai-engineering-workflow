# Agentic pattern examples — Implementation Plan

**Goal:** Add one generic example of each missing context-engineering pattern category — a
slash command, a scaffolding skill, a reviewer subagent, a test-generation workflow, and an
architecture doc — and wire them into `AGENTS.md`, `CLAUDE.md`, and `README.md`, without
changing any `src/` behaviour or adding dependencies.

**Architecture:** Every new artifact is a static file that mirrors an existing sibling's
shape: the command and skill are plain-English markdown with YAML frontmatter (like the
existing skills); the subagent matches `.claude/agents/write-test.md`'s frontmatter contract
(`tools`, `model`, `permissionMode`) and "proceed without asking" note; the workflow matches
`.claude/workflows/parallel-review.js`'s `meta` export and `agent`/`pipeline`/`parallel`/`log`
orchestration globals; `docs/ARCHITECTURE.md` matches the tone of the other `docs/` files.

**Spec:** [../2026-07-14-agentic-pattern-examples-design.md](../2026-07-14-agentic-pattern-examples-design.md)

> **For agentic workers:** use `superpowers:executing-plans` to implement this task-by-task.
> Steps use `- [ ]` for tracking.

## File map

- **Create:** `.claude/commands/new-spec.md` — slash command scaffolding a spec + plan pair.
- **Create:** `.claude/skills/scaffold-module.md` — generator skill for a new `src/<name>/` module.
- **Create:** `.claude/agents/review-standards.md` — dispatchable standards reviewer subagent.
- **Create:** `.claude/workflows/generate-tests.js` — parallel test-generation workflow.
- **Create:** `docs/ARCHITECTURE.md` — this repo's own architecture.
- **Modify:** `AGENTS.md` — add the `ARCHITECTURE.md` row to the documentation index.
- **Modify:** `CLAUDE.md` — list the new command, skill, subagent, and workflow.
- **Modify:** `README.md` — extend the Context-engineering bullets + repo-tour table.

**Untouched:** everything in `src/`, the existing specs, husky/CI config — this change is
purely additive documentation + agent tooling.

## Backwards compatibility

| Surface | Change | Legacy behaviour |
|---|---|---|
| `src/` runtime | none | Unchanged; no behaviour touched |
| Existing skills/agents/workflow | none | New siblings added alongside; existing files untouched |
| Doc files | additive edits only | Existing rows/bullets preserved; new entries appended |

## Steps

- [ ] `docs/ARCHITECTURE.md` — describe `src/` worked examples, `.claude/` tooling layout, and the spec-driven flow. Keep it to the doc set's length/tone.
- [ ] `.claude/commands/new-spec.md` — command prompt: take a slug, compute today's date, create the spec + plan skeletons from the house headings, refuse to overwrite, report the two paths created.
- [ ] `.claude/skills/scaffold-module.md` — frontmatter (`name`, `description`) + Overview / Workflow / Do-not, matching `safe-rollout.md`'s structure; scaffold `src/<name>/{types.ts,<name>.ts,<name>.test.ts}`, refuse generic names.
- [ ] `.claude/agents/review-standards.md` — frontmatter (`tools`, `model: sonnet`, `permissionMode: auto`) + "proceed without asking" note + workflow that reads `AGENTS.md`/`docs/`, reviews the target, reports violations. Mirror `write-test.md`.
- [ ] `.claude/workflows/generate-tests.js` — `meta` export + logic using `agent`/`parallel`/`log`; discover `src/**` modules lacking a colocated test, fan out one writer per file, report covered count. Mirror `parallel-review.js` style (no imports, orchestration globals).
- [ ] `AGENTS.md` — add `| System architecture | docs/ARCHITECTURE.md | Understanding the repo layout |` to the doc index.
- [ ] `CLAUDE.md` — add a Commands line; add `scaffold-module` to Skills, `review-standards` to Subagents, `generate-tests` to Workflow.
- [ ] `README.md` — add Context-engineering bullets for commands + the new skill/agent/workflow; add repo-tour rows for `.claude/commands/`, `docs/ARCHITECTURE.md`, and `generate-tests.js`.
- [ ] `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test` — all green; verify every new doc link resolves.

## Acceptance (from spec)
Five generic artifacts added, one per missing category; all three doc files reference them
with no dead links; the four CI commands stay green (no `src/` change); branch + commits
follow `docs/GIT_HOOKS.md`.
