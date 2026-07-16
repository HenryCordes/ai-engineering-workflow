import { describe, expect, it } from "vitest";

import { buildRepairPrompt, llmExtract } from "./llmExtract";
import { ExtractError } from "./types";
import type { FieldSpec, LlmClient } from "./types";

const FIELDS: FieldSpec[] = [
  { name: "merchant", type: "string", required: true },
  { name: "date", type: "date", required: true },
  { name: "total", type: "number", required: true },
  { name: "vatAmount", type: "number", required: false },
];

const VALID_REPLY = JSON.stringify({
  merchant: "Albert Heijn",
  date: "2026-07-16",
  total: 9.57,
  vatAmount: 0.79,
});

/** Queue of canned replies that also records every prompt it saw. */
function scriptedClient(replies: string[]): {
  client: LlmClient;
  prompts: string[];
} {
  const prompts: string[] = [];
  const client: LlmClient = {
    complete: (prompt) => {
      prompts.push(prompt);
      const reply = replies[prompts.length - 1];
      if (reply === undefined)
        return Promise.reject(new Error("script exhausted"));
      return Promise.resolve(reply);
    },
  };
  return { client, prompts };
}

describe("llmExtract", () => {
  it("returns typed fields on a valid first reply", async () => {
    const { client, prompts } = scriptedClient([VALID_REPLY]);

    const result = await llmExtract("receipt text", FIELDS, { client });

    expect(result.fields).toEqual({
      merchant: "Albert Heijn",
      date: "2026-07-16",
      total: 9.57,
      vatAmount: 0.79,
    });
    expect(result.attempts).toBe(1);
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toContain("receipt text");
    expect(prompts[0]).toContain('"merchant"');
  });

  it("accepts a reply wrapped in markdown fences", async () => {
    const { client } = scriptedClient(["```json\n" + VALID_REPLY + "\n```"]);

    const result = await llmExtract("text", FIELDS, { client });

    expect(result.fields.merchant).toBe("Albert Heijn");
  });

  it("repairs malformed JSON, embedding the previous reply and error in the prompt", async () => {
    const { client, prompts } = scriptedClient([
      "not json at all",
      VALID_REPLY,
    ]);

    const result = await llmExtract("text", FIELDS, { client });

    expect(result.attempts).toBe(2);
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toContain("not json at all");
    expect(prompts[1]).toContain("Problems:");
  });

  it("repairs a wrong-typed field", async () => {
    const badType = JSON.stringify({
      merchant: "Albert Heijn",
      date: "2026-07-16",
      total: "9,57",
      vatAmount: null,
    });
    const { client, prompts } = scriptedClient([badType, VALID_REPLY]);

    const result = await llmExtract("text", FIELDS, { client });

    expect(result.attempts).toBe(2);
    expect(prompts[1]).toContain('"total" must be a finite number');
  });

  it("throws ExtractError with attempts and cause after exhausting repairs", async () => {
    const { client, prompts } = scriptedClient([
      "nope",
      "still nope",
      "never json",
    ]);

    // Error.cause and .attempts are checked as direct property reads in a
    // try/catch — toMatchObject silently skips non-enumerable properties
    // (see the Lessons in ../../.claude/skills/scaffold-module/SKILL.md).
    let caught: unknown;
    try {
      await llmExtract("text", FIELDS, { client, retries: 2 });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ExtractError);
    const extractError = caught as ExtractError;
    expect(extractError.attempts).toBe(3);
    expect(extractError.cause).toBeInstanceOf(SyntaxError);
    expect(prompts).toHaveLength(3);
  });

  it("makes exactly one attempt with retries: 0", async () => {
    const { client, prompts } = scriptedClient(["not json"]);

    await expect(
      llmExtract("text", FIELDS, { client, retries: 0 }),
    ).rejects.toBeInstanceOf(ExtractError);
    expect(prompts).toHaveLength(1);
  });

  it("propagates client rejections without repair attempts", async () => {
    const transportError = new Error("network down");
    const client: LlmClient = {
      complete: () => Promise.reject(transportError),
    };

    await expect(llmExtract("text", FIELDS, { client })).rejects.toBe(
      transportError,
    );
  });

  it("drops unknown keys and nulls missing optional fields", async () => {
    const reply = JSON.stringify({
      merchant: "Shop",
      date: "2026-01-01",
      total: 1,
      currency: "EUR", // not in the spec
    });
    const { client } = scriptedClient([reply]);

    const result = await llmExtract("text", FIELDS, { client });

    expect(result.fields).toEqual({
      merchant: "Shop",
      date: "2026-01-01",
      total: 1,
      vatAmount: null,
    });
    expect("currency" in result.fields).toBe(false);
  });

  it("treats a null required field as invalid", async () => {
    const missingRequired = JSON.stringify({
      merchant: null,
      date: "2026-01-01",
      total: 1,
    });
    const { client, prompts } = scriptedClient([missingRequired, VALID_REPLY]);

    await llmExtract("text", FIELDS, { client });

    expect(prompts[1]).toContain('"merchant" is required');
  });

  it("rejects malformed dates", async () => {
    const badDate = JSON.stringify({
      merchant: "Shop",
      date: "16-07-2026",
      total: 1,
    });
    const { client, prompts } = scriptedClient([badDate, VALID_REPLY]);

    await llmExtract("text", FIELDS, { client });

    expect(prompts[1]).toContain('"date" must be a valid "YYYY-MM-DD" date');
  });
});

describe("buildRepairPrompt", () => {
  it("keeps the original extraction instructions", () => {
    const prompt = buildRepairPrompt(
      "the text",
      FIELDS,
      "bad reply",
      "the problem",
    );

    expect(prompt).toContain("bad reply");
    expect(prompt).toContain("the problem");
    expect(prompt).toContain("the text");
    expect(prompt).toContain("Extract the following fields");
  });
});
