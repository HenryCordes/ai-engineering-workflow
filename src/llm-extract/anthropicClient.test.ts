import { describe, expect, it, vi } from "vitest";

import { createAnthropicClient } from "./anthropicClient";

const apiReply = (text: string): Response =>
  new Response(JSON.stringify({ content: [{ type: "text", text }] }), {
    status: 200,
  });

describe("createAnthropicClient", () => {
  it("posts the prompt to the Messages API and returns the text block", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(apiReply('{"total": 1}'));
    const client = createAnthropicClient({
      apiKey: "key",
      model: "some-model",
      fetchImpl,
    });

    const reply = await client.complete("the prompt");

    expect(reply).toBe('{"total": 1}');
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    const body = JSON.parse(init.body as string) as {
      model: string;
      temperature: number;
      messages: Array<{ content: string }>;
    };
    expect(body.model).toBe("some-model");
    expect(body.temperature).toBe(0);
    expect(body.messages[0]?.content).toBe("the prompt");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("key");
  });

  it("throws on a non-2xx response with the status in the message", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("rate limited", { status: 429 }));
    const client = createAnthropicClient({ apiKey: "key", fetchImpl });

    await expect(client.complete("p")).rejects.toThrow(/429/);
  });

  it("throws when the reply has no text block", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ content: [] }), { status: 200 }),
      );
    const client = createAnthropicClient({ apiKey: "key", fetchImpl });

    await expect(client.complete("p")).rejects.toThrow(/no text block/);
  });
});
