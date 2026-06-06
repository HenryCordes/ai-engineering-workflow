import type { FeatureFlagConfig, FeatureFlagKey } from "./types";

/**
 * Pure flag resolver — no React, so it can be unit-tested in isolation.
 *
 * Returns `defaultValue` when the config is not loaded, the key is absent, or
 * the stored value is not a boolean (untrusted runtime config). It never throws.
 * A non-boolean value is surfaced as a dev-only warning rather than silently
 * coerced, because coercing e.g. the string "false" to `true` would invert
 * intent and hide a config bug.
 */
export function resolveFlag(
  config: FeatureFlagConfig | undefined,
  key: FeatureFlagKey,
  defaultValue = false,
): boolean {
  const value = config?.[key];

  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "boolean") {
    warnNonBoolean(key, value);
    return defaultValue;
  }

  return value;
}

function warnNonBoolean(key: FeatureFlagKey, value: unknown): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  console.warn(
    `[feature-flags] Flag "${key}" has a non-boolean value (${typeof value}); ` +
      `returning the default instead. Check the flag config source.`,
  );
}
