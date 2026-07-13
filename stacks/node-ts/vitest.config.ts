// Root Vitest config - the unit/integration split lives here so both tiers share one
// coverage and env setup, and `pnpm test:unit` / `pnpm test:integration` are one command
// each. See ../DECISIONS.md #9. A leaf package may add its own vitest.config.ts and
// extend this when it needs a different environment (e.g. jsdom for a web package).

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Two named projects so the file-name convention is the tier boundary:
    // *.integration.test.ts needs the Docker test-stack; everything else is pure unit.
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["**/*.test.ts"],
          exclude: ["**/*.integration.test.ts", "**/node_modules/**", "**/dist/**"],
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          include: ["**/*.integration.test.ts"],
          exclude: ["**/node_modules/**", "**/dist/**"],
          // Real dependencies are stateful - keep integration files serial within a file
          // and let the test-stack (per-run, disposable) absorb cross-file parallelism.
          fileParallelism: false,
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // A floor on the paths that matter, not a vanity number. Raise per-package on
      // money/security/contract code; do not chase 100% on glue (DECISIONS.md #9).
      exclude: ["**/dist/**", "**/*.config.*", "**/*.d.ts", "e2e/**"],
    },
  },
});
