#!/usr/bin/env node
// schema-pair-test - drive the shipped R24 pair check over real fixtures.
//
// This guard can only fail quietly. It reports nothing when a repo has no
// database, which is the correct behaviour and also exactly what a broken
// version looks like - so the cases below assert both directions: what must
// pass (a camelCase twin, a table constraint that is not a column) and what
// must fail (a column, an enum label or a back-reference that went missing).
//
// Usage: node tools/schema-pair-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const GUARD = join(process.cwd(), "standard/scripts/schema-pair.mjs");

const DDL = `-- pair: src/db/schema.ts
CREATE TYPE booking_state AS ENUM ('pending', 'confirmed');

CREATE TABLE public.bookings (
  id            uuid PRIMARY KEY,
  guest_email   text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  state         booking_state NOT NULL,
  CONSTRAINT bookings_email_lower CHECK (guest_email = lower(guest_email)),
  UNIQUE (guest_email, created_at)
);
`;

const TWIN = `// pair: database/schema/bookings.sql
export const bookingState = z.enum(["pending", "confirmed"]);
export const bookings = z.object({
  id: z.string().uuid(),
  guestEmail: z.string().email(),
  createdAt: z.coerce.date(),
  state: bookingState,
});
`;

// A single-file schema is the other shape R24 covers: one production database, no
// migration chain, the whole DDL in one reviewable file.
const SINGLE_TWIN = TWIN.replace("database/schema/bookings.sql", "database/schema.sql");
const SINGLE = { "database/schema.sql": DDL, "src/db/schema.ts": SINGLE_TWIN };

const run = (repo, args = []) => {
  try {
    return { code: 0, out: execFileSync("node", [GUARD, "--block", ...args], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
};

// fails = the check must block; says = a substring its output must carry.
const CASES = [
  { name: "a matching pair passes, camelCase twin and all", fails: false, says: "names covered by their twin", files: {} },
  { name: "a table constraint is not read as a column", fails: false, says: "OK", files: {} },
  { name: "a column missing from the twin fails", fails: true, says: "missing cancelled_at", files: { "database/schema/bookings.sql": DDL.replace("  state ", "  cancelled_at timestamptz,\n  state ") } },
  { name: "an enum label missing from the twin fails", fails: true, says: "missing cancelled", files: { "database/schema/bookings.sql": DDL.replace("'confirmed'", "'confirmed', 'cancelled'") } },
  {
    name: "a table missing from the twin fails, and its own pair line does not vouch for it",
    fails: true,
    says: "missing invoices",
    files: {
      "database/schema/invoices.sql": "-- pair: src/db/schema.ts\nCREATE TABLE invoices (id uuid PRIMARY KEY);\n",
      "src/db/schema.ts": `// pair: database/schema/invoices.sql\n${TWIN}`,
    },
  },
  { name: "a schema file naming no counterpart fails", fails: true, says: "names no counterpart", files: { "database/schema/bookings.sql": DDL.split("\n").slice(1).join("\n") } },
  { name: "a counterpart that does not exist fails", fails: true, says: "does not exist", files: { "database/schema/bookings.sql": DDL.replace("src/db/schema.ts", "src/db/gone.ts") } },
  { name: "a pair declared on one side only fails", fails: true, says: "does not name", files: { "src/db/schema.ts": TWIN.split("\n").slice(1).join("\n") } },
  { name: "no database means nothing to check", fails: false, says: "skipping", files: {}, drop: ["database/schema/bookings.sql"] },

  // The single-file shape: same pair, one file instead of a directory.
  { name: "--file checks a whole schema kept in one file", fails: false, says: "names covered by their twin", args: ["--file", "database/schema.sql"], files: SINGLE, drop: ["database/schema/bookings.sql"] },
  { name: "drift in a single-file schema still fails", fails: true, says: "missing cancelled_at", args: ["--file", "database/schema.sql"], files: { ...SINGLE, "database/schema.sql": DDL.replace("  state ", "  cancelled_at timestamptz,\n  state ") }, drop: ["database/schema/bookings.sql"] },
  {
    name: "--file names a schema the default would never find",
    fails: false,
    says: "names covered by their twin",
    args: ["--file", "db/schema.sql"],
    files: { "db/schema.sql": DDL, "src/db/schema.ts": TWIN.replace("database/schema/bookings.sql", "db/schema.sql") },
    drop: ["database/schema/bookings.sql"],
  },
  { name: "an explicit target that is not there is a mistake, not a skip", fails: true, says: "does not exist - the target was named explicitly", args: ["--file", "db/gone.sql"], files: {} },
  { name: "--dir handed a file says which flag to use", fails: true, says: "pass it as --file", args: ["--dir", "database/schema.sql"], files: SINGLE, drop: ["database/schema/bookings.sql"] },
  { name: "--file handed a directory says which flag to use", fails: true, says: "pass it as --dir", args: ["--file", "database/schema"], files: {} },
  { name: "two targets at once is refused rather than guessed", fails: true, says: "pass one", args: ["--dir", "database/schema", "--file", "database/schema.sql"], files: {} },
  { name: "a flag whose path went missing does not fall back to the default", fails: true, says: "--file needs a path", args: ["--file"], files: {} },

  // A dependency tree carries other people's .sql, and none of it is this schema.
  { name: "a vendored .sql under the target is not read as this repo's schema", fails: false, says: "OK", files: { "database/schema/node_modules/dep/dump.sql": "CREATE TABLE vendored (id uuid);\n" } },
];

let failures = 0;
for (const c of CASES) {
  const repo = mkdtempSync(join(tmpdir(), "schema-pair-test-"));
  const files = { "database/schema/bookings.sql": DDL, "src/db/schema.ts": TWIN, ...c.files };
  for (const drop of c.drop ?? []) delete files[drop];
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(repo, rel)), { recursive: true });
    writeFileSync(join(repo, rel), body);
  }

  const { code, out } = run(repo, c.args);
  const want = c.fails ? 1 : 0;
  if (code !== want) {
    failures++;
    console.log(`  FAIL  ${c.name} - expected exit ${want}, got ${code}\n${out.replace(/^/gm, "        ")}`);
  } else if (!out.includes(c.says)) {
    failures++;
    console.log(`  FAIL  ${c.name} - exit ${code} is right but the output never says "${c.says}"\n${out.replace(/^/gm, "        ")}`);
  } else {
    console.log(`  ok    ${c.name}`);
  }
  rmSync(repo, { recursive: true, force: true });
}

if (failures) {
  console.log(`\nschema-pair-test: FAIL - ${failures} of ${CASES.length} cases`);
  process.exit(1);
}
console.log(`\nschema-pair-test: OK - ${CASES.length} cases, the pair check catches drift in both shapes`);
