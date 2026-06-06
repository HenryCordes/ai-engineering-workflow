"use client";

import { createContext } from "react";
import type { ReactNode } from "react";

import type { FeatureFlagConfig } from "./types";

/**
 * Holds the flag config for the client tree. `undefined` is the deliberate
 * default: it means "no provider / not loaded yet", which the hook treats the
 * same as a missing key — fall back to the caller's default.
 */
export const FeatureFlagContext = createContext<FeatureFlagConfig | undefined>(
  undefined,
);

export function FeatureFlagProvider({
  config,
  children,
}: {
  config: FeatureFlagConfig | undefined;
  children: ReactNode;
}) {
  return (
    <FeatureFlagContext.Provider value={config}>
      {children}
    </FeatureFlagContext.Provider>
  );
}
