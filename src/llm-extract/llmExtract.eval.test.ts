import { describe, expect, it } from "vitest";

import { createAnthropicClient } from "./anthropicClient";
import goldens from "./fixtures/receipts.json";
import { llmExtract } from "./llmExtract";
import { scoreExtraction } from "./score";
import type { ExtractedFields, FieldSpec } from "./types";

/**
 * Eval, not unit test: runs the golden set against the real Anthropic API and
 * asserts an accuracy threshold. Gated on ANTHROPIC_API_KEY so CI stays green
 * without secrets; run locally with:
 *
 *   ANTHROPIC_API_KEY=... pnpm test -- llmExtract.eval
 *
 * Unit tests prove the deterministic core; this proves the actual extraction
 * quality — the part you can't assert with a fake.
 */
const apiKey = process.env.ANTHROPIC_API_KEY;
const fields = goldens.fields as FieldSpec[];

describe.skipIf(!apiKey)("llmExtract eval (golden receipts)", () => {
  it(
    "extracts the golden set with mean per-field accuracy >= 0.9",
    { timeout: 60_000 },
    async () => {
      const client = createAnthropicClient({ apiKey: apiKey as string });

      const scores = await Promise.all(
        goldens.cases.map(async ({ name, text, expected }) => {
          const result = await llmExtract(text, fields, { client });
          const score = scoreExtraction(
            expected as ExtractedFields,
            result.fields,
            fields,
          );
          console.log(
            `${name}: ${score.correct}/${score.total}` +
              (score.accuracy < 1
                ? ` (missed: ${Object.keys(score.perField)
                    .filter((field) => !score.perField[field])
                    .join(", ")})`
                : ""),
          );
          return score;
        }),
      );

      const mean =
        scores.reduce((sum, score) => sum + score.accuracy, 0) / scores.length;
      console.log(
        `mean accuracy: ${mean.toFixed(3)} over ${scores.length} fixtures`,
      );
      expect(mean).toBeGreaterThanOrEqual(0.9);
    },
  );
});
