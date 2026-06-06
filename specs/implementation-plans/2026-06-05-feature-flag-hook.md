# `useFeatureFlag` — Implementation Plan

**Goal:** Ship a typed `useFeatureFlag(key, defaultValue?)` hook that reads flags
from context and returns a safe default when the key is missing or config is
unloaded. Never throws; SSR-safe.

**Architecture:** A `FeatureFlagContext` provides `FeatureFlagConfig | undefined`.
The hook reads context, looks up the key, and falls back to `defaultValue`. A pure
`resolveFlag(config, key, defaultValue)` helper holds the logic so it can be
unit-tested without React. Keys are the closed `FeatureFlagKey` union. The context
and hook modules carry `"use client"` (they use React context).

**Tech stack:** React 19, TypeScript, Vitest + @testing-library/react.

**Spec:** [../2026-06-05-feature-flag-hook-design.md](../2026-06-05-feature-flag-hook-design.md)

> **For agentic workers:** use `superpowers:executing-plans` to implement this
> task-by-task. Steps use `- [ ]` for tracking.

## File map

- **Create:** `src/feature-flags/types.ts` — `FeatureFlagKey` union + `FeatureFlagConfig`.
- **Create:** `src/feature-flags/resolveFlag.ts` — pure resolver + dev warning.
- **Create:** `src/feature-flags/resolveFlag.test.ts` — unit tests (no React).
- **Create:** `src/feature-flags/FeatureFlagContext.tsx` — `"use client"` context + provider.
- **Create:** `src/feature-flags/useFeatureFlag.ts` — `"use client"` hook (wraps `resolveFlag`).
- **Create:** `src/feature-flags/useFeatureFlag.test.tsx` — hook tests via provider.

**Untouched:** existing call sites — they opt in by replacing ad-hoc reads later.

## Backwards compatibility

| Surface | Change | Legacy behaviour |
|---|---|---|
| Existing flag reads | None — new API added alongside | Old reads keep working; migrate incrementally |
| Missing/`undefined` config | Returns `defaultValue` | Matches today's "treat as off" assumption |

## Steps

- [x] Define `FeatureFlagKey` union + `FeatureFlagConfig` in `types.ts`.
- [x] Write `resolveFlag(config, key, defaultValue)` — handle `undefined` config,
      missing key, non-boolean value (return `defaultValue` + `console.warn` in
      dev only; no coercion).
- [x] Unit-test `resolveFlag` against every spec row (no React).
- [x] Add `"use client"` `FeatureFlagContext` + `FeatureFlagProvider`.
- [x] Implement `"use client"` `useFeatureFlag` on top of `resolveFlag`.
- [x] Test the hook through the provider (known true/false, missing, unloaded,
      no provider, explicit default).
- [x] `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test` — all green
      (13 tests).

## Acceptance (from spec)
Known flags return exactly; missing/unloaded returns default; never throws;
SSR-safe.
