import { describe, expect, it } from "vitest";
import { isPublicApiPath } from "./public-paths.ts";

describe("isPublicApiPath", () => {
  it("allows the health and readiness probes", () => {
    expect(isPublicApiPath("/api/health")).toBe(true);
    expect(isPublicApiPath("/api/ready")).toBe(true);
  });

  it("ignores query strings when matching", () => {
    expect(isPublicApiPath("/api/health?verbose=1")).toBe(true);
  });

  it("denies everything else by default", () => {
    expect(isPublicApiPath("/api/me")).toBe(false);
    expect(isPublicApiPath("/api/healthz")).toBe(false); // exact match, not prefix
    expect(isPublicApiPath("/api/health/extra")).toBe(false);
    expect(isPublicApiPath("/api")).toBe(false);
  });
});
