#!/usr/bin/env node
// Schema pair check (R24).
//
// A repo's DDL and its typed twin are declared 1:1, and until now nothing proved
// it. A pair held by review drifts one column at a time - which is the failure
// R24 exists to prevent, so the rule cannot be the only thing holding it.
//
// What this proves:
//   1. the declared edge resolves both ways - each .sql names a counterpart that
//      exists, and that counterpart names the .sql back;
//   2. every name the DDL defines - table, column, enum type, enum label -
//      appears in the counterpart.
//
// What it does not prove: that the types agree. Reading a Zod or Pydantic module
// structurally means knowing the language, and that belongs to the stack repo.
// The direction is deliberate too: the database is the source of what exists, and
// a typed module legitimately carries more (input shapes, derived fields), so an
// extra field there is not drift.
//
// Names are compared case-insensitively with separators removed, so a camelCase
// twin of a snake_case column matches: created_at == createdAt.
//
// A schema is not always a directory. A repo with one production database and no
// migration chain keeps the whole thing in a single file, and that is the same
// artifact this check exists for - one thing a reviewer reads and a restore
// applies. Walking a directory was an assumption about the shape, never a
// requirement of the pair, so --file names the other one. R24 still says where
// the DDL belongs; --file is the same escape hatch --dir already was, for repos
// whose recorded decision put it elsewhere.
//
// Usage:
//   node scripts/schema-pair.mjs [--dir <path> | --file <path>]   # default: database/schema
//   add --block to exit non-zero on a failure (default: warn, exit 0)
//
// No dependencies (Node built-ins only). Place at scripts/schema-pair.mjs.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { normalize } from "node:path";

const args = process.argv.slice(2);
const block = args.includes("--block");
// A flag whose value went missing must not fall back to the default target: that
// checks something the caller did not ask for and reports it as their answer.
const flag = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return null;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) {
    console.log(`schema-pair: ${name} needs a path`);
    process.exit(block ? 1 : 0);
  }
  return value;
};

const DEFAULT_DIR = "database/schema";

const askedDir = flag("--dir");
const askedFile = flag("--file");

if (askedDir && askedFile) {
  console.log("schema-pair: --dir and --file name two different targets - pass one");
  process.exit(block ? 1 : 0);
}

// An explicit target that is not there is a mistake, not a repo without a
// database: say so instead of skipping, or a typo reads as a clean run.
const asked = askedDir ?? askedFile;
if (asked && !existsSync(asked)) {
  console.log(`schema-pair: ${asked} does not exist - the target was named explicitly`);
  process.exit(block ? 1 : 0);
}

const TARGET = asked ?? DEFAULT_DIR;
if (!existsSync(TARGET)) {
  console.log(`schema-pair: no ${TARGET}/ - skipping (R24 binds repos that own a database)`);
  process.exit(0);
}

const targetIsDir = statSync(TARGET).isDirectory();
if (askedDir && !targetIsDir) {
  console.log(`schema-pair: ${askedDir} is a file - pass it as --file`);
  process.exit(block ? 1 : 0);
}
if (askedFile && targetIsDir) {
  console.log(`schema-pair: ${askedFile} is a directory - pass it as --dir`);
  process.exit(block ? 1 : 0);
}

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`  FAIL  ${msg}`);
};
const ok = (msg) => console.log(`  ok    ${msg}`);

// A dependency tree carries other people's .sql - fixtures, a vendored dump - and
// none of it is this repo's schema. Skipped for the same reason facts-check skips it.
const walk = (dir, acc = []) => {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === ".git") continue;
    const p = `${dir}/${e}`;
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.sql$/i.test(e)) acc.push(p);
  }
  return acc;
};

// created_at, "createdAt" and CreatedAt are the same name for this purpose.
const key = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const bare = (ident) => ident.replace(/"/g, "").split(".").pop();

// The pair declaration is a comment, and comment syntax differs per language -
// match the marker, not the marker's prefix.
const PAIR_RE = /pair:\s*(\S+)/gi;
const declaredPairs = (text) => [...text.matchAll(PAIR_RE)].map((m) => normalize(m[1].replace(/[.,;)"']+$/, "")));

const stripComments = (sql) => sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");

// The body of the first balanced paren group starting at `from`.
const parenBody = (sql, from) => {
  const start = sql.indexOf("(", from);
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < sql.length; i++) {
    if (sql[i] === "(") depth++;
    else if (sql[i] === ")" && --depth === 0) return sql.slice(start + 1, i);
  }
  return null;
};

const splitTop = (body) => {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of body) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
};

// A table body mixes columns with table constraints; only the former are names.
const NOT_A_COLUMN = /^(primary|foreign|constraint|unique|check|exclude|like|index|partition|deferrable|initially)$/i;

const readSchema = (sql) => {
  const names = [];
  const clean = stripComments(sql);

  const tableRe = /create\s+(?:unlogged\s+|temp(?:orary)?\s+)?table\s+(?:if\s+not\s+exists\s+)?("?[\w.]+"?)/gi;
  for (const m of clean.matchAll(tableRe)) {
    const table = bare(m[1]);
    names.push({ kind: "table", name: table });
    const body = parenBody(clean, m.index + m[0].length);
    if (!body) continue;
    for (const item of splitTop(body)) {
      const first = item.trim().split(/[\s(]+/)[0];
      if (!first || NOT_A_COLUMN.test(first)) continue;
      names.push({ kind: "column", name: bare(first), of: table });
    }
  }

  const enumRe = /create\s+type\s+("?[\w.]+"?)\s+as\s+enum/gi;
  for (const m of clean.matchAll(enumRe)) {
    const type = bare(m[1]);
    names.push({ kind: "enum", name: type });
    const body = parenBody(clean, m.index + m[0].length);
    if (!body) continue;
    for (const label of body.matchAll(/'([^']*)'/g)) {
      if (label[1]) names.push({ kind: "label", name: label[1], of: type });
    }
  }

  return names;
};

// The pair declaration names a path, and a path carries words - `bookings.sql`
// would vouch for a table called bookings. Drop the declarations before reading.
const tokensOf = (text) =>
  new Set([...text.replace(/pair:\s*\S+/gi, " ").matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)].map((m) => key(m[0])));

const sqlFiles = targetIsDir ? walk(TARGET).sort() : [TARGET];
if (sqlFiles.length === 0) {
  console.log(`schema-pair: ${TARGET}/ holds no .sql - nothing to pair`);
  process.exit(0);
}

let checkedNames = 0;
for (const sqlPath of sqlFiles) {
  const sql = readFileSync(sqlPath, "utf8");
  const [twinPath] = declaredPairs(sql);

  if (!twinPath) {
    fail(`${sqlPath} names no counterpart - add a "pair: <path>" comment (R24)`);
    continue;
  }
  if (!existsSync(twinPath)) {
    fail(`${sqlPath} names ${twinPath}, which does not exist`);
    continue;
  }

  const twin = readFileSync(twinPath, "utf8");
  if (!declaredPairs(twin).includes(normalize(sqlPath))) {
    fail(`${twinPath} does not name ${sqlPath} back - the pair is declared on one side only`);
    continue;
  }

  const tokens = tokensOf(twin);
  const missing = readSchema(sql).filter((n) => {
    checkedNames++;
    return !tokens.has(key(n.name));
  });

  if (missing.length === 0) {
    ok(`${sqlPath} <-> ${twinPath}`);
    continue;
  }
  for (const m of missing) {
    const where = m.of ? ` (${m.kind} of ${m.of})` : ` (${m.kind})`;
    fail(`${twinPath} is missing ${m.name}${where}, defined in ${sqlPath}`);
  }
}

if (failures) {
  console.log(`\nschema-pair: ${failures} break(s) in the declared pairs - the schema and its twin have drifted`);
  process.exit(block ? 1 : 0);
}
console.log(`\nschema-pair: OK - ${sqlFiles.length} schema file(s), ${checkedNames} names covered by their twin`);
