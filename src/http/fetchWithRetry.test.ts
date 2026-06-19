import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchWithRetry } from "./fetchWithRetry";
import { FetchRetryError } from "./types";

function jsonResponse(status: number): Response {
  return new Response(null, { status });
}

// Advances fake timers far enough to clear every backoff delay a test could
// schedule, racing the advance against the in-flight promise so a rejection
// is never briefly unobserved.
async function runPendingRetries<T>(promise: Promise<T>): Promise<T> {
  const [result] = await Promise.all([
    promise,
    vi.advanceTimersByTimeAsync(10_000),
  ]);
  return result;
}

describe("fetchWithRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves immediately on a non-retryable first response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200));

    const response = await fetchWithRetry("https://example.com", undefined, {
      fetchImpl,
    });

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("retries a 503 once and returns the following 200", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200));

    const response = await runPendingRetries(
      fetchWithRetry("https://example.com", undefined, { fetchImpl }),
    );

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("returns the final response after exhausting retries on a persistent 5xx", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(503));

    const response = await runPendingRetries(
      fetchWithRetry("https://example.com", undefined, {
        fetchImpl,
        retries: 2,
      }),
    );

    expect(response.status).toBe(503);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("throws FetchRetryError after exhausting retries on persistent network errors", async () => {
    const networkError = new Error("network down");
    const fetchImpl = vi.fn().mockRejectedValue(networkError);

    let thrown: unknown;
    try {
      await runPendingRetries(
        fetchWithRetry("https://example.com", undefined, {
          fetchImpl,
          retries: 2,
        }),
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(FetchRetryError);
    expect((thrown as FetchRetryError).attempts).toBe(3);
    expect((thrown as FetchRetryError).cause).toBe(networkError);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("resolves with the success response after a network error then a success", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(jsonResponse(200));

    const response = await runPendingRetries(
      fetchWithRetry("https://example.com", undefined, { fetchImpl }),
    );

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("returns immediately on a 404 without retrying", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(404));

    const response = await fetchWithRetry("https://example.com", undefined, {
      fetchImpl,
    });

    expect(response.status).toBe(404);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("honours a custom retryOn that marks additional statuses as retryable", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(404))
      .mockResolvedValueOnce(jsonResponse(200));

    const response = await runPendingRetries(
      fetchWithRetry("https://example.com", undefined, {
        fetchImpl,
        retryOn: ({ response }) => response?.status === 404,
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("makes exactly one attempt when retries is 0", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(503));

    const response = await fetchWithRetry("https://example.com", undefined, {
      fetchImpl,
      retries: 0,
    });

    expect(response.status).toBe(503);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
