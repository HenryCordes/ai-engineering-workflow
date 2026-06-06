/**
 * Known feature flag keys. Apps extend this union as flags are introduced;
 * keeping it a closed union makes referencing an unknown flag a compile-time
 * error at every call site instead of a silent runtime miss.
 */
export type FeatureFlagKey = "new-checkout" | "dark-mode" | "beta-search";

/**
 * Flag config as supplied to the app (typically fetched at runtime). Partial
 * because the source may omit keys; the provider models "not loaded yet" as
 * `undefined` rather than an empty object.
 */
export type FeatureFlagConfig = Partial<Record<FeatureFlagKey, boolean>>;
