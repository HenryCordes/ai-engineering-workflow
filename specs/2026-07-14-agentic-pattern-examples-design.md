# Spec: agentic pattern examples

## Problem
The repo demonstrates the context-engineering patterns it claims to teach, but a few
pattern *categories* are only present in my real projects, not here. A reader can't learn
a pattern the repo doesn't show. Specifically, this repo has no slash **command**, no
**scaffolding** skill (its three skills are all *process* skills — commit, PR, rollout),
no dispatchable **reviewer** subagent (only `write-test`), no **test-generation**
workflow (only `parallel-review`), and no `docs/ARCHITECTURE.md` for the doc index to
point at.

The fix is to add one generic, self-contained example of each missing category — not to
copy the domain-specific artifacts from a real project. The examples must stay true to the
repo's "generic on purpose; the patterns are what matter" promise.

## Scope — five additions + doc wiring
1. **`.claude/commands/new-spec.md`** — a slash command that scaffolds a spec +
   implementation-plan pair from the house templates. On-theme (the repo is spec-driven)
   and immediately useful.
2. **`.claude/skills/scaffold-module.md`** — a *generator* skill: scaffold a new
   `src/<name>/` module (types + implementation + colocated Vitest test) following the
   repo's conventions. Demonstrates the scaffolding-skill category next to the existing
   process skills.
3. **`.claude/agents/review-standards.md`** — a dispatchable reviewer subagent that
   checks a single file or diff against `AGENTS.md` + `docs/` standards (barrel imports,
   state that should be derived during render, DRY/KISS/SOLID-with-judgment). The
   single-target, Agent-tool counterpart to the diff-wide `parallel-review` workflow.
4. **`.claude/workflows/generate-tests.js`** — a runnable multi-agent workflow that finds
   untested `src/` modules and fans out one test-writer agent per file in parallel, then
   reports coverage. Mirrors `parallel-review.js`'s shape and orchestration globals.
5. **`docs/ARCHITECTURE.md`** — documents *this repo's own* architecture (the `src/`
   worked examples, the `.claude/` tooling layout, the spec-driven flow), so the
   `AGENTS.md` doc index has an architecture entry to point at.

Plus wiring so the docs stay the source of truth:
- `AGENTS.md` — add the `ARCHITECTURE.md` row to the documentation index.
- `CLAUDE.md` — list the new command, skill, subagent, and workflow.
- `README.md` — extend the Context-engineering bullets and the repo-tour table.

## Contracts (per artifact)
- **`new-spec` command:** input = a short kebab-case feature slug; output = two files,
  `specs/YYYY-MM-DD-<slug>-design.md` and `specs/implementation-plans/YYYY-MM-DD-<slug>.md`,
  pre-filled with the house section headings. Uses the current date. Does not overwrite an
  existing file with the same name — reports instead.
- **`scaffold-module` skill:** input = a module name + one-line purpose; output = a plan
  to create `src/<name>/{types.ts, <name>.ts, <name>.test.ts}` following the sync/pure and
  async examples already in `src/`. Refuses generic names; asks when the target already exists.
- **`review-standards` agent:** input = a file path or a diff base; output = a list of
  concrete standards violations (file, line, which standard), or "none". Background subagent —
  proceeds without asking, like `write-test`.
- **`generate-tests` workflow:** input = optional `src` glob (default: all `src/**` modules
  without a colocated `*.test.ts`); output = per-file test-writer results and a count of
  files covered. Same `meta` export + `agent`/`parallel`/`log` globals as `parallel-review.js`.

## Non-goals
- No domain-specific artifacts (no `add-mongoose-model`, `tenant-isolation-reviewer`, etc.).
- No restructuring of existing `specs/` into per-feature folders (kept flat, as-is).
- No new runtime dependencies; the toolchain stays minimal (Vitest / TS / ESLint / Prettier).
- The `.js` workflow is illustrative orchestration code (like `parallel-review.js`); it is
  not unit-tested and not imported by `src/`.

## Acceptance
- Each of the five artifacts exists, is generic (no real domain names), and reads in the
  repo's voice.
- `AGENTS.md`, `CLAUDE.md`, and `README.md` reference every new artifact; no dead links.
- `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test` all green (no `src/`
  behaviour changed, so tests are unaffected — this proves nothing regressed).
- Branch and commits follow `docs/GIT_HOOKS.md`.

## Testing / verification
No `src/` code changes, so no new unit tests. Verification is: the four CI commands stay
green, the doc links resolve, and `new-spec` / `scaffold-module` produce the described files
when exercised by hand.
