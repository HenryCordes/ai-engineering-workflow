# Case Study: Closing the Docs Gap

[PR #1](https://github.com/HenryCordes/ai-engineering-workflow/pull/1) is the
workflow's first real output on this repo, kept here unedited rather than
replaced with a tidier after-the-fact summary. The interesting part isn't that
it shipped clean — it's where the process actually caught something.

## The brief

I asked Claude Code to look at this repo and suggest improvements. It read
`AGENTS.md`, the docs it indexes, the skills, and the worked example, then
came back with a specific finding: `docs/GIT_HOOKS.md` and
`docs/DEVELOPMENT.md` described Husky hooks, an `.editorconfig`, and a PR
template — none of which existed in the repo. For a showcase whose entire
pitch is "this is how I actually work," documentation describing automation
that isn't there is worse than no documentation. There was also no CI, and
only one worked example (a sync, pure hook) — not enough to show the workflow
earning its keep on something with a real I/O boundary.

## What shipped

- Real Husky hooks (`pre-commit`, `commit-msg`, `post-checkout`, `pre-push`)
  matching what the docs already claimed, plus `.editorconfig` and a PR
  template that previously didn't exist.
- A GitHub Actions CI workflow running lint/typecheck/format/test on every
  push and PR.
- `packageManager`/`engines` pinned so the pnpm-only policy in `AGENTS.md` is
  enforced, not just stated.
- A second worked example, `fetchWithRetry` ([`src/http/`](../src/http)),
  taken through the same spec → plan → implement path as the first, but
  async and with a real backoff/retry boundary instead of a sync pure
  function.

## Where it actually got tested

Two things broke during this work, in ways worth keeping rather than
quietly fixing and forgetting:

**A genuine race in the test helper.** The `fetchWithRetry` retry-exhaustion
test used fake timers and needed to assert on a rejected promise. The first
version did `await vi.advanceTimersByTimeAsync(...)` and then `return
promise` — which left a real window where the inner promise could reject
before anything was listening for it. Vitest flagged an unhandled rejection
on the first run. The fix was to race the advance against the promise with
`Promise.all([promise, vi.advanceTimersByTimeAsync(...)])` so a rejection
handler attaches before time moves at all. A linear "write the test, assume
it's right" pass would not have caught this — only actually running it did.

**A matcher that silently checked the wrong thing.** `Error.cause` is a
non-enumerable property, so `toMatchObject({ attempts, cause })` against a
thrown `FetchRetryError` quietly ignored `cause` and only compared `attempts`
— the test would have passed without ever checking what it claimed to check.
Caught the same way: by reading the actual assertion failure output instead
of trusting that a green run meant the right things were asserted, then
switching to direct property checks in a try/catch.

A smaller third case: the first draft of the Husky hook scripts tripped
`no-undef` on `process`/`console`, because the project's ESLint config has no
Node environment configured for git-hook scripts living outside `src/`. Fixed
by scoping `.husky/` (and later `.claude/workflows/`) out of the app's lint
config — they're harness/Node-context tooling, not application source.

## The hooks proved themselves on the way out

The new `pre-commit`, `commit-msg`, and `pre-push` hooks fired on the actual
commits that shipped this work — lint-staged ran, the commit messages were
checked against the ticket-scoped pattern, the suite ran before the branch
was pushed. That's the difference between "the hook script looks right" and
"the hook works": the second one only shows up by using it for something
real.

## Takeaway

The workflow's value isn't the four-phase ceremony on its own — it's that
writing the spec first forced a clear definition of "exhausts retries on a
response vs. exhausts retries on a network error" before any code existed,
and that running the tests (not just writing them) caught a race that would
otherwise have shipped as a flaky CI test waiting to happen.
