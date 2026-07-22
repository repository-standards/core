import { describe, expect, it } from "vitest";
import { isPublicPath } from "./routes";

describe("isPublicPath", () => {
  it("allows the public pages", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/sign-in")).toBe(true);
    expect(isPublicPath("/sign-up")).toBe(true);
  });

  it("allows Better Auth endpoints and the proxied health probes", () => {
    expect(isPublicPath("/api/auth/sign-in/email")).toBe(true);
    expect(isPublicPath("/api/auth/get-session")).toBe(true);
    expect(isPublicPath("/api/health")).toBe(true);
    expect(isPublicPath("/api/ready")).toBe(true);
  });

  it("denies everything else by default", () => {
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/api/me")).toBe(false);
    expect(isPublicPath("/api/authz")).toBe(false); // prefix is "/api/auth/", not "/api/auth"
    expect(isPublicPath("/anything")).toBe(false);
  });
});
