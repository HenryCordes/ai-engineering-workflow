# `fetchWithRetry` — Implementation Plan

**Goal:** Ship a typed `fetchWithRetry(input, init?, options?)` wrapper around
`fetch` that retries transient failures (5xx, 429, network errors) with
exponential backoff, and otherwise behaves like `fetch` — it resolves with
whatever response it last got, throwing only when every attempt was a network
error.

**Architecture:** `fetchWithRetry` loops up to `retries + 1` attempts. Each
attempt calls the injected `fetchImpl` (default `globalThis.fetch`); a thrown
error is treated as a transient failure. After each attempt, `retryOn` decides
whether to keep going. Between retries it awaits a `delay(baseDelayMs * 2^n)`
helper built on `setTimeout`, so tests can drive it with fake timers instead of
real waits. A typed `FetchRetryError` carries `.attempts` and `.cause` for the
network-error-exhausted case only — response-based exhaustion just returns the
last response.

**Tech stack:** TypeScript, Vitest (`vi.useFakeTimers`, `vi.fn` for the
injected `fetchImpl`). No React — this lives outside `src/feature-flags/` to
show the workflow isn't React-specific.

**Spec:** [../2026-06-19-fetch-with-retry-design.md](../2026-06-19-fetch-with-retry-design.md)

> **For agentic workers:** use `superpowers:executing-plans` to implement this
> task-by-task. Steps use `- [ ]` for tracking.

## File map

- **Create:** `src/http/types.ts` — `RetryContext`, `FetchWithRetryOptions`,
  `FetchRetryError`.
- **Create:** `src/http/fetchWithRetry.ts` — the retry loop + default
  `retryOn` + `delay` helper.
- **Create:** `src/http/fetchWithRetry.test.ts` — unit tests with a fake
  `fetchImpl` and fake timers.

**Untouched:** `src/feature-flags/` — unrelated; this is a second, independent
worked example, not a refactor of the first.

## Backwards compatibility

| Surface | Change | Legacy behaviour |
|---|---|---|
| N/A | New module, no existing call sites | Nothing to preserve — this is additive |

## Steps

- [x] Define `RetryContext` (`{ attempt, response?, error? }`),
      `FetchWithRetryOptions`, and `FetchRetryError extends Error` (with
      `attempts: number` and `cause` typed) in `types.ts`.
- [x] Implement `delay(ms)` (Promise + `setTimeout`) and the default `retryOn`
      (network error, or status `429`/`5xx`) in `fetchWithRetry.ts`.
- [x] Implement the attempt loop: call `fetchImpl`, catch network errors,
      evaluate `retryOn`, return/throw on the terminal conditions from the
      spec, otherwise `await delay(...)` and retry.
- [x] Unit-test every acceptance row from the spec using `vi.useFakeTimers()`
      and a `vi.fn()` `fetchImpl` — no real network, no real waiting.
- [x] `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test` — all
      green.

## Acceptance (from spec)
First success short-circuits with no delay; 5xx/429/network errors retry with
exponential backoff up to the configured limit; a non-retryable response or
exhausted retries on a response returns that response (never throws); exhausted
retries on network errors throw `FetchRetryError` with attempt count and cause;
`retries: 0` makes exactly one attempt; a custom `retryOn` fully overrides the
default classification.
