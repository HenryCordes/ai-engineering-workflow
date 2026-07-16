# `llmExtract` — Implementation Plan

**Goal:** Ship a typed `llmExtract(text, fields, options)` that turns unstructured text
into schema-validated fields via an injected LLM client, repairing malformed model output
with bounded retries, plus an eval layer (pure scorer + golden fixtures + threshold test)
that measures extraction accuracy instead of assuming it.

**Architecture:** A deterministic core around a nondeterministic boundary. `llmExtract`
loops up to `retries + 1` attempts: build prompt (attempt 1) or repair prompt (attempt
n+1, embedding the previous reply and exact validation errors) → `client.complete` →
parse (strip fences, `JSON.parse`) → validate against `FieldSpec[]` (types, required,
ISO dates, drop unknown keys). Parse/validation failures feed the next repair attempt;
exhaustion throws `ExtractError` (`.attempts`, `.cause`). Client rejections propagate —
transport retries belong to the client (compose with `fetchWithRetry`). `scoreExtraction`
is a pure function so eval scoring is unit-testable; the real-API eval is a Vitest test
gated on `ANTHROPIC_API_KEY`.

**Tech stack:** TypeScript, Vitest (scripted fake client; fake `fetch` for the Anthropic
wrapper). No new dependencies — the real client is `fetch` against the Anthropic Messages
API.

**Spec:** [../2026-07-16-llm-extract-design.md](../2026-07-16-llm-extract-design.md)

> **For agentic workers:** use `superpowers:executing-plans` to implement this
> task-by-task. Steps use `- [ ]` for tracking.

## File map

- **Create:** `src/llm-extract/types.ts` — `FieldSpec`, `ExtractedFields`, `LlmClient`,
  `LlmExtractOptions`, `ExtractResult`, `ExtractError`.
- **Create:** `src/llm-extract/llmExtract.ts` — prompt builders, parse, validate, the
  repair loop.
- **Create:** `src/llm-extract/llmExtract.test.ts` — unit tests with a scripted fake client.
- **Create:** `src/llm-extract/score.ts` — `scoreExtraction` pure scorer.
- **Create:** `src/llm-extract/score.test.ts` — scorer unit tests.
- **Create:** `src/llm-extract/anthropicClient.ts` — real `LlmClient` over `fetch`
  (Messages API, temperature 0), injectable `fetchImpl`.
- **Create:** `src/llm-extract/anthropicClient.test.ts` — request shape + response
  extraction with a fake `fetch`.
- **Create:** `src/llm-extract/fixtures/receipts.json` — golden set (synthetic receipts).
- **Create:** `src/llm-extract/llmExtract.eval.test.ts` — real-API eval, skipped without
  `ANTHROPIC_API_KEY`.
- **Modify:** `tsconfig.json` — add `"resolveJsonModule": true` (JSON golden fixtures).
- **Modify:** `docs/ARCHITECTURE.md` — third row in the worked-examples table.
- **Modify:** `README.md` — third example bullet + eval mention.

**Untouched:** `src/feature-flags/`, `src/http/` — independent examples. (The eval/client
docs *reference* `fetchWithRetry` as a composition option; no code change there.)

## Backwards compatibility

| Surface | Change | Legacy behaviour |
|---|---|---|
| `tsconfig.json` | `resolveJsonModule: true` | Additive — existing imports unaffected |
| Everything else | New module, no existing call sites | Nothing to preserve |

## Steps

- [x] `types.ts`: `FieldType`, `FieldSpec`, `ExtractedFields`
      (`Record<string, string | number | null>`), `LlmClient`, `LlmExtractOptions`,
      `ExtractResult`, `ExtractError extends Error` with typed `attempts`/`cause`.
- [x] `llmExtract.ts`: `buildPrompt` / `buildRepairPrompt` (exported for tests),
      `parseReply` (fence-stripping + `JSON.parse`), `validateFields` (required, types,
      ISO date check, drop extras, missing optional → `null`), and the attempt loop.
- [x] `llmExtract.test.ts`: happy path · fenced reply · malformed JSON → repair (assert
      the repair prompt embeds the error) · wrong-type repair · exhaustion →
      `ExtractError` (`attempts`, `cause` via direct property reads) · `retries: 0` ·
      client rejection propagates · extras dropped / optional `null`.
- [x] `score.ts` + `score.test.ts`: per-field rules (trimmed case-insensitive strings,
      exact numbers/dates, `null`≡`null`), `accuracy`, edge cases.
- [x] `fixtures/receipts.json`: 5 synthetic receipts, varied formats (currency symbols,
      EU decimal commas, VAT lines), expected fields each.
- [x] `anthropicClient.ts` + test: `createAnthropicClient({ apiKey, model, fetchImpl? })`
      → `LlmClient`; POST `/v1/messages`, temperature 0; non-2xx throws with status.
- [x] `llmExtract.eval.test.ts`: `describe.skipIf(!process.env.ANTHROPIC_API_KEY)`, 30s
      timeout, golden set → mean accuracy ≥ 0.9, log per-fixture scores.
- [x] `tsconfig.json` `resolveJsonModule`; docs: ARCHITECTURE table row, README example
      bullet.
- [x] Green: `pnpm lint && pnpm typecheck && pnpm test && pnpm format:check` +
      `pnpm check:context && pnpm check:links`.
