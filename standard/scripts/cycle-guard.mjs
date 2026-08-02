#!/usr/bin/env node
// Work-cycle guard (ADR-028).
//
// One intent is in the backlog pool OR in exactly one cycle - never both, never two.
// That property is what makes the pair trustworthy: a backlog that also lists what is
// already in flight is a backlog nobody believes, and a convention held by discipline
// stops being held. So it is checked rather than asked for.
//
// Usage:
//   node scripts/cycle-guard.mjs            # report, exit 0 (advisory)
//   node scripts/cycle-guard.mjs --block    # exit 1 on a violation (CI, scale profile)
//
// No dependencies (Node built-ins only). A repo with no docs/cycles/ is not using
// cycles - the guard says so and exits 0, at every profile.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

const block = process.argv.includes("--block");
const POOL = "docs/backlog.md";
const CYCLES = "docs/cycles";

// An intent id: SPEC-3, ADR-auth, DRIFT-2. Anchored, so prose in the first cell never
// looks like one.
const ID = /^[A-Z][A-Z0-9]*-[A-Za-z0-9-]+$/;

const walk = (dir, acc = []) => {
  for (const e of readdirSync(dir)) {
    const p = `${dir}/${e}`;
    if (statSync(p).isDirectory()) walk(p, acc);
    // `_`-prefixed files are templates. Their example rows would otherwise collide with
    // the pool the moment the tree lands, so the shipped example would break the repo.
    else if (e.endsWith(".md") && !e.startsWith("_")) acc.push(p);
  }
  return acc;
};

// Ids from markdown table rows, ignoring anything inside an HTML comment - the shipped
// examples live in comments precisely so they can be read without being counted.
const idsIn = (file) => {
  const found = new Set();
  let commented = false;
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (line.includes("<!--")) commented = true;
    if (commented) {
      if (line.includes("-->")) commented = false;
      continue;
    }
    if (!line.startsWith("|")) continue;
    const first = line.split("|")[1]?.trim();
    if (first && ID.test(first)) found.add(first);
  }
  return found;
};

if (!existsSync(CYCLES)) {
  console.log(`cycle-guard: no ${CYCLES}/ - this repo does not use work cycles (scale profile only)`);
  process.exit(0);
}

const files = [...(existsSync(POOL) ? [POOL] : []), ...walk(CYCLES)];
const where = new Map(); // id -> [file, ...]
for (const f of files) for (const id of idsIn(f)) where.set(id, [...(where.get(id) ?? []), f]);

const clashes = [...where.entries()].filter(([, fs]) => fs.length > 1);

for (const [id, fs] of clashes) {
  console.error(`  ${id} is in ${fs.length} places: ${fs.join(", ")}`);
}

if (!clashes.length) {
  console.log(`cycle-guard: OK - ${where.size} intent(s) across ${files.length} place(s), each in exactly one`);
  process.exit(0);
}

console.error(
  `\ncycle-guard: ${clashes.length} intent(s) in more than one place - an intent belongs to the pool or to one cycle.\n` +
    `Pulling one into a cycle removes its row from ${POOL}; closing a cycle unfinished returns it.`,
);
process.exit(block ? 1 : 0);
