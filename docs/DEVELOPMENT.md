# Development Setup & Tooling

Project-specific setup only; principles and workflow live in [AGENTS.md](../AGENTS.md).
Formatting rules are enforced by [.editorconfig](../.editorconfig) and Prettier — read
those files rather than a prose copy here.

## Tooling

| Tool | Role |
|------|------|
| pnpm | package manager — never npm/yarn (`packageManager` is pinned) |
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

## Code style (project choices)

- Function declarations, no `any`, prefer `type` over `interface`.
- Git: `{username}/{TICKET}-{name}` branches; squash-merge PRs.
