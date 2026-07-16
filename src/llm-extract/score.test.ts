import { describe, expect, it } from "vitest";

import { scoreExtraction } from "./score";
import type { FieldSpec } from "./types";

const FIELDS: FieldSpec[] = [
  { name: "merchant", type: "string", required: true },
  { name: "total", type: "number", required: true },
  { name: "vatAmount", type: "number", required: false },
];

describe("scoreExtraction", () => {
  it("scores a perfect extraction as 1", () => {
    const golden = { merchant: "Albert Heijn", total: 9.57, vatAmount: 0.79 };

    const score = scoreExtraction(golden, { ...golden }, FIELDS);

    expect(score.accuracy).toBe(1);
    expect(score.correct).toBe(3);
    expect(score.perField).toEqual({
      merchant: true,
      total: true,
      vatAmount: true,
    });
  });

  it("ignores string case and surrounding whitespace", () => {
    const score = scoreExtraction(
      { merchant: "Albert Heijn", total: 1, vatAmount: null },
      { merchant: "  ALBERT HEIJN ", total: 1, vatAmount: null },
      FIELDS,
    );

    expect(score.perField.merchant).toBe(true);
  });

  it("scores a wrong number as a miss without affecting other fields", () => {
    const score = scoreExtraction(
      { merchant: "Shop", total: 9.57, vatAmount: null },
      { merchant: "Shop", total: 9.75, vatAmount: null },
      FIELDS,
    );

    expect(score.perField).toEqual({
      merchant: true,
      total: false,
      vatAmount: true,
    });
    expect(score.accuracy).toBeCloseTo(2 / 3);
  });

  it("only matches null with null", () => {
    const score = scoreExtraction(
      { merchant: "Shop", total: 1, vatAmount: null },
      { merchant: "Shop", total: 1, vatAmount: 0 },
      FIELDS,
    );

    expect(score.perField.vatAmount).toBe(false);
  });

  it("treats a field absent from either side as null", () => {
    const score = scoreExtraction(
      { merchant: "Shop", total: 1 },
      { merchant: "Shop", total: 1 },
      FIELDS,
    );

    expect(score.perField.vatAmount).toBe(true);
  });

  it("returns accuracy 1 for an empty field list", () => {
    expect(scoreExtraction({}, {}, []).accuracy).toBe(1);
  });
});
