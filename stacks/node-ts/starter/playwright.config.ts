// Root Playwright config - e2e is orchestrated from the root (DECISIONS.md #9) so
// `pnpm test:e2e` is one self-contained command. Specs live in the top-level e2e/
// workspace package because a journey crosses app and service boundaries.
//
// Starter note: webServer boots the DEV servers (`pnpm dev` = db init + web + api via
// turbo) so e2e is zero-config on a fresh clone. A production-grade repo points this at
// the BUILT app instead (`pnpm --filter web start`) - see the stack root's config.

import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e/tests",
  // On CI: deterministic ordering + a retry for transient network flake. Locally: fast,
  // parallel. Flaky tests are quarantined with an owner, never retried to green.
  workers: isCI ? 1 : undefined,
  retries: isCI ? 1 : 0,
  forbidOnly: isCI, // a stray test.only must never pass CI silently
  reporter: isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    // Artifacts on failure only - a red run is debuggable without a local repro.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Skip the local boot when E2E_BASE_URL points at a deployed environment.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !isCI,
        timeout: 180_000,
      },
});
