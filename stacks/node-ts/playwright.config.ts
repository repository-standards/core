// Root Playwright config - e2e is orchestrated from the root (DECISIONS.md #9) so
// `pnpm test:e2e` is one self-contained command that boots the app and runs the journeys.
// Specs live in the top-level e2e/ workspace package, not co-located, because a journey
// crosses app and service boundaries.

import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e/tests",
  // On CI: deterministic ordering + a retry for transient network flake. Locally: fast,
  // parallel. Flaky tests are quarantined with an owner, never retried to green.
  workers: isCI ? 1 : undefined,
  retries: isCI ? 1 : 0,
  forbidOnly: isCI, // a stray test.only must never pass CI silently
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    // Artifacts on failure only - a red run is debuggable without a local repro.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Boot the built web app for the run. Skip when E2E_BASE_URL points at a deployed
  // environment (staging smoke). Assumes a `web` app under apps/ - adjust the command.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm --filter web start",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});
