// The web app's public allow-list - everything else is gated by the proxy (default-deny,
// DECISIONS.md #10). Kept as a pure module so the policy is unit-testable without
// booting Next.

const PUBLIC_PATHS = new Set(["/", "/sign-in", "/sign-up", "/api/health", "/api/ready"]);

const PUBLIC_PREFIXES = [
  "/api/auth/", // Better Auth's own endpoints (sign-in/up/out, session) must stay open
  "/_next/", // framework assets (also excluded by the proxy matcher)
];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
