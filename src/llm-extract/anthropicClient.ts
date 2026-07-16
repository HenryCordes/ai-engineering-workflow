import type { LlmClient } from "./types";

export type AnthropicClientOptions = {
  apiKey: string;
  model?: string;
  /** Injected for tests — and the place to plug in `fetchWithRetry` for transport retries. */
  fetchImpl?: typeof fetch;
};

type MessagesResponse = {
  content: Array<{ type: string; text?: string }>;
};

/**
 * A real `LlmClient` over the Anthropic Messages API — a thin wrapper so the
 * nondeterministic boundary stays one method wide. Temperature 0: extraction
 * wants the most likely reading, not creativity.
 */
export function createAnthropicClient(
  options: AnthropicClientOptions,
): LlmClient {
  const {
    apiKey,
    model = "claude-haiku-4-5",
    fetchImpl = globalThis.fetch,
  } = options;

  return {
    async complete(prompt: string): Promise<string> {
      const response = await fetchImpl(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            temperature: 0,
            messages: [{ role: "user", content: prompt }],
          }),
        },
      );
      if (!response.ok) {
        throw new Error(
          `Anthropic API error: ${response.status} ${await response.text()}`,
        );
      }
      const data = (await response.json()) as MessagesResponse;
      const text = data.content.find((block) => block.type === "text")?.text;
      if (text === undefined)
        throw new Error("Anthropic API reply contained no text block");
      return text;
    },
  };
}
