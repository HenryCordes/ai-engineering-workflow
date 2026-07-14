---
name: scaffold-module
description: Use when adding a new self-contained module under src/ — "scaffold a module", "new module for X", "add a src/ folder for Y". Creates the types + implementation + colocated test trio following the repo's existing worked examples.
---

# Scaffold Module

## Overview

A module here is a folder under `src/` with a single clear purpose, a typed surface, and a
colocated test. This skill scaffolds that trio consistently so a new module matches the two
existing worked examples ([`src/feature-flags/`](../../src/feature-flags),
[`src/http/`](../../src/http)) instead of inventing its own shape.

## Input

- A module **name** (kebab-case folder, camelCase export) and a **one-line purpose**.
- Whether it's **sync/pure** (like `feature-flags`) or **async/has an I/O boundary** (like
  `http`) — this decides the test approach.

## Workflow

1. **Refuse generic names.** `utils`, `helpers`, `common`, `misc` name a junk drawer, not a
   responsibility. Ask for a name that says what the module *does*.
2. **Check the target.** If `src/<name>/` already exists, stop and ask — don't merge into it blindly.
3. **Create the trio:**
   - `src/<name>/types.ts` — the public types (options, results, typed errors). Make illegal states unrepresentable.
   - `src/<name>/<name>.ts` — the implementation. Pure where possible; inject I/O (e.g. an injected `fetch`) so it's testable without globals.
   - `src/<name>/<name>.test.ts` — Vitest. For sync/pure: assert inputs -> outputs directly. For async/I-O: inject a fake and use `vi.useFakeTimers()` instead of real waiting.
4. **No barrel file.** Callers import from the direct path; don't add an `index.ts` re-export.
5. **Prove it green:** `pnpm lint && pnpm typecheck && pnpm test` before calling it done.

## Do not

- Create a module without a test — the test is the guardrail, not an afterthought.
- Add a dependency to scaffold a module; the toolchain stays minimal.
- Reach for a class when a function and plain data will do (KISS).
