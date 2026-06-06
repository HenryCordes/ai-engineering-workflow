import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeatureFlagProvider } from "./FeatureFlagContext";
import type { FeatureFlagConfig, FeatureFlagKey } from "./types";
import { useFeatureFlag } from "./useFeatureFlag";

function Probe({
  flag,
  defaultValue,
}: {
  flag: FeatureFlagKey;
  defaultValue?: boolean;
}) {
  const enabled = useFeatureFlag(flag, defaultValue);
  return <span data-testid="result">{enabled ? "on" : "off"}</span>;
}

function renderWithConfig(
  config: FeatureFlagConfig | undefined,
  ui: ReactNode,
) {
  return render(
    <FeatureFlagProvider config={config}>{ui}</FeatureFlagProvider>,
  );
}

function result() {
  return screen.getByTestId("result").textContent;
}

describe("useFeatureFlag", () => {
  it("returns on for a known enabled flag", () => {
    renderWithConfig({ "dark-mode": true }, <Probe flag="dark-mode" />);
    expect(result()).toBe("on");
  });

  it("returns off for a known disabled flag", () => {
    renderWithConfig({ "dark-mode": false }, <Probe flag="dark-mode" />);
    expect(result()).toBe("off");
  });

  it("falls back to the default for a missing key", () => {
    renderWithConfig({}, <Probe flag="dark-mode" defaultValue />);
    expect(result()).toBe("on");
  });

  it("falls back to the default when config is not loaded", () => {
    renderWithConfig(undefined, <Probe flag="dark-mode" defaultValue />);
    expect(result()).toBe("on");
  });

  it("works with no provider, returning the default", () => {
    render(<Probe flag="dark-mode" defaultValue />);
    expect(result()).toBe("on");
  });

  it("defaults to off when no default is given and the flag is absent", () => {
    renderWithConfig({}, <Probe flag="dark-mode" />);
    expect(result()).toBe("off");
  });
});
