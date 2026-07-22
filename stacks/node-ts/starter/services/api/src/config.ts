// Env config, validated once at boot with Zod (see ../../DECISIONS.md #5). Fail fast and
// loud on a bad environment rather than crashing deep in a request. Import `config`
// anywhere; it is frozen.

import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  // 4000 so the service never collides with the Next.js app on 3000 - the web app
  // rewrites /api/* here (apps/web/next.config.ts).
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  CORS_ORIGIN: z.string().optional(), // comma-separated; unset => same-origin only
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // Do not leak values - only the failing keys.
  console.error("Invalid environment:", z.treeifyError(parsed.error));
  process.exit(1);
}

export const config = Object.freeze(parsed.data);
export type Config = typeof config;
