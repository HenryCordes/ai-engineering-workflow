"use client";

import { useContext } from "react";

import { FeatureFlagContext } from "./FeatureFlagContext";
import { resolveFlag } from "./resolveFlag";
import type { FeatureFlagKey } from "./types";

/**
 * Read a feature flag from context. Returns `defaultValue` when the flag is
 * missing, the config has not loaded, or there is no provider. Never throws and
 * touches no browser globals, so it is safe to call during SSR.
 */
export function useFeatureFlag(
  key: FeatureFlagKey,
  defaultValue = false,
): boolean {
  const config = useContext(FeatureFlagContext);
  return resolveFlag(config, key, defaultValue);
}
