// Create/upgrade the Better Auth schema (user, session, account, verification) in the
// starter's SQLite database. Idempotent - `pnpm dev` runs it before booting the apps.
// When you swap to Postgres, this same script migrates that instead (the adapter comes
// from the `database` option in index.ts).

import { getMigrations } from "better-auth/db/migration";
import { auth } from "./index.ts";

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);

if (toBeCreated.length === 0 && toBeAdded.length === 0) {
  console.log("[db:init] auth schema is up to date");
} else {
  await runMigrations();
  const tables = [...toBeCreated, ...toBeAdded].map((t) => t.table).join(", ");
  console.log(`[db:init] auth schema migrated (${tables})`);
}
