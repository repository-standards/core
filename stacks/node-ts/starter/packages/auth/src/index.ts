// Better Auth - product auth for the starter (DECISIONS.md #10). One instance, one
// config, imported by BOTH the Next.js proxy gate and the Fastify service, so the same
// session cookie is validated at both gates against the same database.
//
// Sessions are DB-BACKED and revocable (Better Auth's default: every getSession() hits
// the database - no cookie cache, no JWT-blind gate). Short-lived with silent refresh:
// `updateAge` rolls the expiry on activity, `expiresIn` is the cap.
//
// Storage: SQLite via node:sqlite for a zero-infra `pnpm i && pnpm dev` boot - no
// native build step, no Docker required. PRODUCTION SWAPS THIS TO POSTGRES: pass a
// `pg` Pool as `database` (the docker-compose.test.yml test-stack at the repo root is
// the local Postgres to develop that against) and set BETTER_AUTH_SECRET.

import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { betterAuth } from "better-auth";

// Every workspace package sits two levels below the repo root, so the default resolves
// to <repo root>/data/starter.db no matter which app opened it. Override with
// AUTH_DB_PATH when running from anywhere else (or in a container).
const dbFile = process.env.AUTH_DB_PATH ?? path.resolve(process.cwd(), "../../data/starter.db");
mkdirSync(path.dirname(dbFile), { recursive: true });

const database = new DatabaseSync(dbFile);
// WAL + busy timeout: the web app and the API service open this file concurrently.
database.exec("PRAGMA journal_mode = WAL;");
database.exec("PRAGMA busy_timeout = 5000;");

export const auth = betterAuth({
  appName: "starter",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  // Dev-only fallback so the starter boots with zero setup. Set BETTER_AUTH_SECRET in
  // every deployed environment - session cookies are signed with it.
  secret: process.env.BETTER_AUTH_SECRET ?? "starter-dev-only-secret-do-not-deploy-me",
  trustedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
  database,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // absolute cap: 7 days
    updateAge: 60 * 60 * 24, // silent server-side refresh once a day of activity
  },
});

// The one session shape both gates share.
export type Session = typeof auth.$Infer.Session;
