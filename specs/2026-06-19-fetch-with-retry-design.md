# Spec: `fetchWithRetry`

## Problem
Network calls fail transiently — a 503, a 429, a dropped connection — but call
sites either hand-roll their own retry loop or skip retries entirely, so backoff
behaviour and error context differ per call site. We need one typed, testable
wrapper around `fetch` with a consistent retry policy.

This is also the workflow's second worked example, deliberately contrasting with
[`useFeatureFlag`](2026-06-05-feature-flag-hook-design.md): that one is sync and
pure; this one is async, has a real I/O boundary, and needs fake timers to test
without real waiting.

## Inputs
- `input: string | URL`, `init?: RequestInit` — passed straight through to `fetch`.
- `options?: FetchWithRetryOptions`:
  - `retries?: number` — max retry attempts after the first (default `3`, so up
    to 4 total attempts).
  - `baseDelayMs?: number` — backoff base; delay before retry `n` is
    `baseDelayMs * 2^n` (default `200`).
  - `retryOn?: (context: RetryContext) => boolean` — classifies a result as
    worth retrying. Default: network error, or response status `429` or in
    `[500, 599]`.
  - `fetchImpl?: typeof fetch` — injected fetch implementation (default
    `globalThis.fetch`), so tests don't need to mock a global.

## Outputs
- `Promise<Response>` — resolves with the first response `retryOn` says is fine,
  or with the last response received after retries are exhausted (caller still
  inspects `.ok`/`.status`, same as a plain `fetch` call).

## Errors / edge cases
- Every attempt throws (network failure) → throws `FetchRetryError` wrapping the
  last thrown error as `.cause`, with `.attempts` set. Mirrors native `fetch`
  rejecting on network failure, but adds attempt-count context.
- A retryable response (e.g. persistent `503`) on the **last** attempt is
  *returned*, not thrown — retrying is about transient failures, not about
  inventing a new error channel for HTTP-level failures the caller already knows
  how to handle.
- `retries: 0` → exactly one attempt, no backoff wait.
- A non-retryable response (`retryOn` returns `false`, e.g. a `404`) returns
  immediately regardless of remaining retry budget.
- Network error on a non-final attempt is retried exactly like a retryable
  response — same backoff schedule.

## Acceptance
- First-attempt success resolves immediately; `fetchImpl` called once, no delay.
- Retries on `500`/`502`/`503`/`429` up to `retries` times with exponential
  backoff between attempts.
- A non-retryable response short-circuits remaining retries.
- Exhausting retries on a still-failing response returns that response (no
  throw).
- Network errors are retried the same as retryable responses; exhausting
  retries on persistent network errors throws `FetchRetryError` with
  `.attempts` and `.cause`.
- `retries: 0` makes exactly one `fetchImpl` call.
- A custom `retryOn` fully overrides the default classification.

## Tests
- Unit, with a fake `fetchImpl` (`vi.fn`) and `vi.useFakeTimers()` so backoff
  delays are asserted, not waited on:
  - first response non-retryable → one call, no delay.
  - `503` then `200` → two calls, returns the `200`, one backoff delay elapsed.
  - persistent `503` through all retries → returns the final `503`, called
    `retries + 1` times.
  - persistent network error through all retries → throws `FetchRetryError`
    with `attempts === retries + 1` and `cause` set to the last error.
  - network error then success → resolves with the success response.
  - `404` → resolves immediately, only one call (default `retryOn`).
  - custom `retryOn` (e.g. retry on `404` too) → overridden behaviour observed.
  - `retries: 0` → exactly one call regardless of response status.
