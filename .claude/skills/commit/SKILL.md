---
name: commit
description: Use when committing changes — when the user says "commit", "commit this", "go ahead and commit", or explicitly authorizes a commit. Enforces branch safety, lint-before-stage, ticket-based messages, and explicit authorization.
---

# Commit Changes

## Overview

Commits require branch checks (never `main`), lint/typecheck before staging,
ticket-based messages, and explicit user authorization. This skill prevents the
common mistakes that break CI or bypass review.

## CRITICAL: never commit automatically

Only commit when the user explicitly says "commit". Phrases like "proceed",
"continue", or "looks good" do **not** mean commit. After making changes, stop
and let the user review in their editor first.

## Workflow

1. **Wait for explicit authorization** ("commit" / "go ahead and commit").
2. **Check branch** — never commit to `main`. If on `main`, create a feature
   branch first (`{username}/{TICKET}-{description}`).
3. **Run lint + typecheck before staging** — `lint:fix` may modify files that
   then need to be included.
   ```bash
   pnpm run lint:fix && pnpm run typecheck
   ```
4. **Stage files** — show what will be included; ask before staging anything
   unexpected.
5. **Build the message** from the ticket: `feat(PROJ-123): short description`.
6. **Commit.**

## Branch switching

If you must switch branches with uncommitted work, stash with
`git stash --include-untracked` and restore with **`git stash apply`** (never
`git stash pop` — pop drops the stash and is unrecoverable on conflict).

## Do not

- Commit to `main` or a protected branch.
- Commit without running lint + typecheck.
- Add a `Co-Authored-By` trailer (project convention).

## Lessons

- 2026-07-16 — New `.mjs` scripts passed pre-commit unformatted (lint-staged only covered
  `ts/tsx/json/md/yml`) and failed CI's `format:check` → lint-staged now formats
  `js/mjs/cjs` too; when a commit introduces a new file *type*, run `pnpm format:check`
  before committing — pre-commit only proves the file types it knows about.
