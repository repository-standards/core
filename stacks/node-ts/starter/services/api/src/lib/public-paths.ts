// The service's public allow-list. Everything NOT listed here requires a valid session -
// default-deny (DECISIONS.md #10): the proxy gate is UX, this service is the boundary.

const PUBLIC_API_PATHS = new Set(["/api/health", "/api/ready"]);

export function isPublicApiPath(url: string): boolean {
  const pathname = url.split("?")[0] ?? url;
  return PUBLIC_API_PATHS.has(pathname);
}
