# Spec: `useFeatureFlag` hook

## Problem
Components need a typed, consistent way to read feature flags on the client, with a
safe default when a flag is missing or the config hasn't loaded. Today flags are
read ad hoc, so defaults and missing-key behaviour differ per call site.

## Inputs
- A flag key — the closed `FeatureFlagKey` union, so an unknown flag is a
  compile error at the call site rather than a silent runtime miss.
- Flag config from context: `Partial<Record<FeatureFlagKey, boolean>>` (may be
  partial or still loading, i.e. `undefined`).
- Optional `defaultValue: boolean` (defaults to `false`).

## Outputs
- `boolean` — the flag's value, or `defaultValue` when the key is absent or config
  is not yet loaded.

## Errors / edge cases
- Config not loaded (`undefined`) or no provider → return `defaultValue`, never throw.
- Unknown key → return `defaultValue`.
- Key present but non-boolean (untrusted/bad config) → return `defaultValue` and
  log a dev-only warning. We do *not* coerce: the string `"false"` is truthy, so
  coercion would invert intent and hide a config bug.

## Acceptance
- Reading a known `true`/`false` flag returns it exactly.
- Missing key or unloaded config returns `defaultValue` (default `false`).
- No throw under any input; safe during SSR (no `window` access).

## Tests
- Unit (`resolveFlag`, no React): known true; known false; missing key → default;
  `undefined` config → default; explicit `defaultValue: true` honoured; no default
  → `false`; non-boolean value → default + dev warning.
- Hook (through the provider): known on/off; missing key → default; unloaded
  config → default; no provider → default.
