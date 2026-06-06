# Development Setup & Tooling

## Quick reference

- **Principles:** DRY/KISS/SOLID held with judgment; earn your abstractions.
- **Folder structure:** prefer folders over loose modules; keep a component's
  children and tests local to it.
- **Code style:** function declarations, no `any`, prefer `type` over `interface`.
- **Git:** `{username}/{TICKET}-{name}` branches; squash-merge PRs.

## EditorConfig

`.editorconfig` keeps formatting consistent across editors:

- UTF-8, LF line endings, final newline inserted, trailing whitespace trimmed.
- 2-space indentation (tabs in Makefiles).
- TypeScript/JavaScript: 2 spaces, double quotes.
- Markdown: no trailing-whitespace trim, no line-length limit.

## Tooling

| Tool | Role |
|------|------|
| pnpm | package manager (workspaces/monorepo) |
| ESLint + Prettier | linting and formatting |
| TypeScript | type checking (`pnpm typecheck`) |
| Vitest | unit/component tests |
| Husky + lint-staged | git hooks (see [GIT_HOOKS.md](GIT_HOOKS.md)) |

## Common scripts

```bash
pnpm install        # install deps
pnpm dev            # run locally
pnpm lint:fix       # lint and auto-fix
pnpm typecheck      # type check
pnpm test           # run tests
```
