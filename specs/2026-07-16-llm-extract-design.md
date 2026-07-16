# Spec: `llmExtract`

## Problem

Product features increasingly need typed data out of unstructured text — receipts, emails,
form submissions — and an LLM is the practical extractor. But an LLM is a **nondeterministic
dependency**: it can return malformed JSON, wrong types, prose around the payload, or a
confidently wrong value. Call sites need a typed result or a typed error, never raw model
output, and the extraction quality needs to be **measured against a golden set**, not
assumed.

This is the workflow's third worked example, completing a deliberate progression:
[`useFeatureFlag`](2026-06-05-feature-flag-hook-design.md) is sync and pure,
[`fetchWithRetry`](2026-06-19-fetch-with-retry-design.md) is async with an I/O boundary,
and this one has a nondeterministic boundary — the engineering answer is a deterministic
core (prompt building, parsing, validation, scoring are all pure and unit-testable), an
injected client, and an eval layer that puts a number on accuracy.

## Inputs

- `text: string` — the unstructured source text.
- `fields: FieldSpec[]` — what to extract: `{ name: string; type: "string" | "number" | "date"; required: boolean }`.
  Dates are ISO `YYYY-MM-DD` strings.
- `options: LlmExtractOptions`:
  - `client: LlmClient` — `{ complete(prompt: string): Promise<string> }`, injected. No
    vendor SDK, no new dependencies; a real client is a thin wrapper (and can compose with
    `fetchWithRetry` for transport-level retries — a separate concern from output repair).
  - `retries?: number` — repair attempts after the first (default `2`, so up to 3 total).

## Outputs

- `Promise<ExtractResult>` — `{ fields: ExtractedFields; attempts: number }` where
  `ExtractedFields` maps each spec'd field name to `string | number | null` (`null` only
  for missing optional fields). Keys not in the spec are dropped, never passed through.

## Errors / edge cases

- Model output that fails parsing (invalid JSON after stripping markdown fences) or
  validation (missing required field, wrong type, malformed date) triggers a **repair
  attempt**: the next prompt contains the previous reply and the exact validation errors.
- Retries exhausted → throws `ExtractError` with `.attempts` and `.cause` (the last
  parse/validation error). Callers get one typed error channel.
- `client.complete` rejecting is **not** retried here — transport failures are the
  client's concern (compose with `fetchWithRetry`); the rejection propagates unchanged.
- `retries: 0` → exactly one attempt.
- Optional field absent or `null` in the reply → `null` in the result. Required field
  `null` → validation error (the model must not silently skip required data).
- Extra keys in the reply are dropped silently — the spec is the contract.

## Eval layer (accuracy is measured, not assumed)

- `scoreExtraction(expected, actual, fields)` — pure scorer: per-field correctness
  (strings compared trimmed/case-insensitive, numbers exact, dates exact, `null` matches
  `null`), plus `correct/total` and `accuracy`. Unit-tested like any other module code.
- `fixtures/receipts.json` — a golden set of synthetic receipt texts with expected fields
  (merchant, date, total, vatAmount). Fixtures are data, versioned with the code.
- `llmExtract.eval.test.ts` — runs the golden set through a real Anthropic client **only
  when `ANTHROPIC_API_KEY` is set** and asserts mean per-field accuracy ≥ 0.9; skips
  cleanly otherwise, so CI stays green without secrets and the evals run locally on
  demand. Evals are tests with a threshold, not a separate ceremony.

## Acceptance

- Valid reply on the first attempt → typed fields, `attempts: 1`, one `complete` call.
- Reply wrapped in ``` fences or prose is parsed if the JSON inside is valid.
- Malformed JSON → repair prompt (containing the error and previous reply) → valid reply
  on attempt 2 → `attempts: 2`.
- Wrong type (e.g. `total` as string) → repair attempt fixes it → typed result.
- Still invalid after `retries` repairs → `ExtractError` with `.attempts = retries + 1`
  and `.cause` set to the last validation error.
- `retries: 0` → exactly one `complete` call, failure throws immediately.
- Client rejection propagates untouched, no repair attempt.
- Extra keys dropped; missing optional → `null`; required `null` → repair/error.
- `scoreExtraction`: 4/4 matching fields → accuracy 1; case/whitespace string noise still
  matches; a wrong number scores that field 0 without affecting others.

## Tests

- Unit, with a scripted fake `LlmClient` (a queue of canned replies that also records the
  prompts it saw, so repair-prompt content is assertable). No timers involved; rejection
  assertions attach handlers via `await expect(...).rejects` and check `.attempts`/`.cause`
  as direct property reads in a `try/catch` — both per the Lessons in
  [`scaffold-module`](../.claude/skills/scaffold-module/SKILL.md).
- Scorer: pure input → output tests.
- Anthropic client wrapper: unit-tested with an injected fake `fetch` (request shape,
  text extraction, non-2xx → throw).
- Eval: golden-set accuracy threshold, gated on `ANTHROPIC_API_KEY`.
