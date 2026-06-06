import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveFlag } from "./resolveFlag";
import type { FeatureFlagConfig } from "./types";

describe("resolveFlag", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true for a known enabled flag", () => {
    const config: FeatureFlagConfig = { "dark-mode": true };
    expect(resolveFlag(config, "dark-mode", false)).toBe(true);
  });

  it("returns false for a known disabled flag, ignoring a truthy default", () => {
    const config: FeatureFlagConfig = { "dark-mode": false };
    expect(resolveFlag(config, "dark-mode", true)).toBe(false);
  });

  it("returns the default when the key is missing", () => {
    expect(resolveFlag({}, "dark-mode", false)).toBe(false);
  });

  it("returns the default when config is not loaded (undefined)", () => {
    expect(resolveFlag(undefined, "dark-mode", false)).toBe(false);
  });

  it("honours an explicit truthy default", () => {
    expect(resolveFlag(undefined, "dark-mode", true)).toBe(true);
  });

  it("defaults to false when no default is given", () => {
    expect(resolveFlag(undefined, "dark-mode")).toBe(false);
  });

  it("returns the default and warns in dev when the stored value is non-boolean", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Simulates untrusted runtime config (e.g. parsed JSON) that violates the type.
    const badConfig = { "dark-mode": "false" } as unknown as FeatureFlagConfig;

    expect(resolveFlag(badConfig, "dark-mode", true)).toBe(true);
    expect(warn).toHaveBeenCalledOnce();
  });
});
