/**
 * What `fetchWithRetry` saw on one attempt — exactly one of `response` /
 * `error` is set, mirroring the try/catch around the underlying `fetch` call.
 */
export type RetryContext = {
  attempt: number;
  response?: Response;
  error?: unknown;
};

export type FetchWithRetryOptions = {
  /** Max retry attempts after the first. Default `3` (4 total attempts). */
  retries?: number;
  /** Backoff base; delay before retry `n` is `baseDelayMs * 2^n`. Default `200`. */
  baseDelayMs?: number;
  /** Classifies a result as worth retrying. Default: network error, or status `429`/`5xx`. */
  retryOn?: (context: RetryContext) => boolean;
  /** Injected fetch implementation, so tests don't need to mock a global. */
  fetchImpl?: typeof fetch;
};

/**
 * Thrown only when every attempt ended in a network error (the underlying
 * `fetch` threw). A retryable HTTP response that never recovers is returned,
 * not thrown — see the spec for why.
 */
export class FetchRetryError extends Error {
  readonly attempts: number;

  constructor(attempts: number, cause: unknown) {
    super(`fetchWithRetry: all ${attempts} attempt(s) failed`, { cause });
    this.name = "FetchRetryError";
    this.attempts = attempts;
  }
}
