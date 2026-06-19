import { FetchRetryError } from "./types";
import type { FetchWithRetryOptions, RetryContext } from "./types";

const DEFAULT_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 200;

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

function defaultRetryOn({ response, error }: RetryContext): boolean {
  if (error !== undefined) {
    return true;
  }
  return response !== undefined && isRetryableStatus(response.status);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps `fetch` with exponential-backoff retries for transient failures
 * (network errors, 429, 5xx). Resolves the way a plain `fetch` call would —
 * the caller still inspects `.ok`/`.status` — except when every attempt threw
 * a network error, in which case it throws `FetchRetryError`.
 */
export async function fetchWithRetry(
  input: string | URL,
  init?: RequestInit,
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const {
    retries = DEFAULT_RETRIES,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    retryOn = defaultRetryOn,
    fetchImpl = fetch,
  } = options;

  const totalAttempts = retries + 1;

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    let response: Response | undefined;
    let error: unknown;
    try {
      response = await fetchImpl(input, init);
    } catch (caught) {
      error = caught;
    }

    const isLastAttempt = attempt === totalAttempts - 1;
    const shouldRetry = retryOn({ attempt, response, error });

    if (!shouldRetry || isLastAttempt) {
      if (response !== undefined) {
        return response;
      }
      throw new FetchRetryError(attempt + 1, error);
    }

    await delay(baseDelayMs * 2 ** attempt);
  }

  // Unreachable: totalAttempts >= 1, so the loop always returns or throws on
  // its final iteration. Here only to satisfy the Promise<Response> return type.
  throw new FetchRetryError(totalAttempts, undefined);
}
