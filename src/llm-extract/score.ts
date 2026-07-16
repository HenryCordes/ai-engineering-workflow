import type { ExtractedFields, FieldSpec } from "./types";

export type ExtractionScore = {
  perField: Record<string, boolean>;
  correct: number;
  total: number;
  /** correct / total, 0..1 */
  accuracy: number;
};

const matches = (
  expected: string | number | null,
  actual: string | number | null,
): boolean => {
  if (expected === null || actual === null) return expected === actual;
  if (typeof expected === "number" || typeof actual === "number")
    return expected === actual;
  return expected.trim().toLowerCase() === actual.trim().toLowerCase();
};

/**
 * Pure eval scorer: per-field correctness of an extraction against a golden
 * expectation. Strings compare trimmed and case-insensitive (formatting noise
 * isn't an extraction error); numbers and dates compare exactly.
 */
export function scoreExtraction(
  expected: ExtractedFields,
  actual: ExtractedFields,
  fields: FieldSpec[],
): ExtractionScore {
  const perField: Record<string, boolean> = {};
  let correct = 0;

  for (const spec of fields) {
    const hit = matches(expected[spec.name] ?? null, actual[spec.name] ?? null);
    perField[spec.name] = hit;
    if (hit) correct += 1;
  }

  const total = fields.length;
  return {
    perField,
    correct,
    total,
    accuracy: total === 0 ? 1 : correct / total,
  };
}
