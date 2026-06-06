# Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) to enforce quality
and naming conventions through Git hooks.

## Hooks

| Hook | Runs | Purpose |
|------|------|---------|
| `pre-commit` | before each commit | lint-staged on staged files |
| `commit-msg` | on commit message | validates message + branch format |
| `post-checkout` | on branch switch | warns on invalid branch names |
| `pre-push` | before push | runs tests/coverage for changed files |

## Branch naming convention

```
{username}/{TICKET}-{short-description}
```

- `{TICKET}` is an issue-tracker key, e.g. `PROJ-123`.
- Examples:
  - ✅ `henry/PROJ-123-fix-login-redirect`
  - ✅ `henry/PROJ-456-add-faq-section`
  - ❌ `feature/new-thing` (no ticket)
  - ❌ `PROJ-123-my-feature` (no username)

**Validation happens in two places:** `post-checkout` warns; `commit-msg`
*blocks* a commit if the branch doesn't match. You can create any branch name,
but you can't commit to it until it conforms.

**Protected branches** (no validation): `main`, `staging`, `production`.

## Bypassing (use sparingly)

`git commit --no-verify` skips hooks. Reserve it for genuine emergencies — the
hooks exist to keep CI green.
