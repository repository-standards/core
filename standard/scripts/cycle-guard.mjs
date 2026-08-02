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
// No dependencies (Node built-ins only). A repo with no cycle files is not using cycles -
// the guard says so and exits 0, at every profile.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

const block = process.argv.includes("--block");
// Both manifest paths. `backlog.md` is the primary and `docs/backlog.md` the altPath, so a
// repo satisfying the manifest at its primary path must not silently lose half the check -
// which is exactly what one hardcoded path did.
const POOLS = ["docs/backlog.md", "backlog.md"];
const CYCLES = "docs/cycles";
// Derived or descriptive, not cycles. /timeline-update writes TIMELINE.md here and it
// legitimately names the intents it projects; counting it would make the timeline collide
// with the cycles it was generated from, on a file the standard's own skill just wrote.
const NOT_A_CYCLE = new Set(["TIMELINE.md", "README.md"]);

// An intent id: SPEC-3, ADR-auth, DRIFT-2. Anchored, so prose in the first cell never
// looks like one.
const ID = /^[A-Z][A-Z0-9]*-[A-Za-z0-9-]+$/;

const walk = (dir, acc = []) => {
  for (const e of readdirSync(dir)) {
    // `_` marks a template - as a file or as a directory. Their example rows would
    // otherwise collide with the pool the moment the tree lands.
    if (e.startsWith("_")) continue;
    const p = `${dir}/${e}`;
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (e.endsWith(".md") && !NOT_A_CYCLE.has(e)) acc.push(p);
  }
  return acc;
};

// `blocked:PAY-1` in the status cell. Blocking gets no column of its own: the status
// already carries `blocked`, and what it lacks is *what* blocks it. Folding the reference
// into the existing cell keeps a wide table from getting wider.
const BLOCKED_BY = /^blocked\s*:\s*([A-Z][A-Z0-9]*-[A-Za-z0-9-]+)$/i;

// Rows from markdown tables, skipping HTML comments and fenced code blocks.
//
// Comment state is scanned left to right *within* the line rather than with two
// independent `includes` calls. The naive version had two holes: `| PAY-7 | fix
// <!-- was PAY-4 --> the export |` opened and closed on one line and deleted a real row,
// and a `-->` appearing in prose (`migrate A --> B`) inside an example block ended the
// comment early, resurrecting every example row after it.
const rowsIn = (file) => {
  const found = [];
  let commented = false;
  let fenced = false;
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!commented && /^(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    let rest = line;
    let visible = "";
    while (rest) {
      if (commented) {
        const end = rest.indexOf("-->");
        if (end === -1) break;
        commented = false;
        rest = rest.slice(end + 3);
      } else {
        const start = rest.indexOf("<!--");
        if (start === -1) {
          visible += rest;
          break;
        }
        visible += rest.slice(0, start);
        commented = true;
        rest = rest.slice(start + 4);
      }
    }
    if (fenced) continue;
    const row = visible.trim();
    if (!row.startsWith("|")) continue;
    // Drop the empty strings a leading and trailing `|` produce, so the status is simply
    // the last cell however many columns the table carries.
    const cells = row.split("|").map((c) => c.trim());
    if (cells[0] === "") cells.shift();
    if (cells.length && cells[cells.length - 1] === "") cells.pop();
    const [id] = cells;
    if (!id || !ID.test(id)) continue;
    found.push({ id, status: (cells[cells.length - 1] ?? "").toLowerCase() });
  }
  return found;
};

const pool = POOLS.find(existsSync);
const cycleFiles = existsSync(CYCLES) ? walk(CYCLES) : [];

// No cycles means the one-place invariant has nothing to check - but the pool's blocks
// still do, and a stale block costs a core-profile repo exactly what it costs a scale one:
// a row that sits there looking legitimately stuck. Exiting here would have skipped it.
if (!cycleFiles.length && !pool) {
  console.log(`cycle-guard: no cycle files under ${CYCLES}/ and no backlog - nothing to check`);
  process.exit(0);
}

// Cycles exist and the pool does not: the half of the invariant this guard exists for
// cannot be checked, and printing OK would claim that it was.
if (!pool) {
  console.error(`  ${cycleFiles.length} cycle file(s) but no backlog at ${POOLS.join(" or ")}`);
  console.error("\ncycle-guard: the pool half of the invariant cannot be checked without a backlog.");
  process.exit(block ? 1 : 0);
}

const files = [pool, ...cycleFiles];
const where = new Map(); // id -> [file, ...]
const status = new Map(); // id -> last status cell seen
const blocks = []; // { id, ref, file }
for (const f of files) {
  for (const { id, status: s } of rowsIn(f)) {
    where.set(id, [...(where.get(id) ?? []), f]);
    status.set(id, s);
    const m = s.match(BLOCKED_BY);
    if (m) blocks.push({ id, ref: m[1].toUpperCase(), file: f });
  }
}

const clashes = [...where.entries()].filter(([, fs]) => fs.length > 1);

// A block naming an intent that no longer exists, or one already finished, is a block that
// has stopped applying - and nobody notices, because the row simply sits there looking
// legitimately stuck. This is the only failure in the pair that costs time silently.
const stale = blocks.filter(({ ref }) => !where.has(ref) || status.get(ref) === "done");
const selfBlocked = blocks.filter(({ id, ref }) => id === ref);

for (const [id, fs] of clashes) {
  console.error(`  ${id} is in ${fs.length} places: ${fs.join(", ")}`);
}
for (const { id, ref, file } of stale) {
  const why = where.has(ref) ? `${ref} is done` : `${ref} exists nowhere`;
  console.error(`  ${id} (${file}) is blocked by ${ref}, but ${why} - the block no longer applies`);
}
for (const { id, file } of selfBlocked) {
  console.error(`  ${id} (${file}) is blocked by itself`);
}

const problems = clashes.length + stale.length + selfBlocked.length;

if (!problems) {
  const note = blocks.length ? `, ${blocks.length} live block(s)` : "";
  const scope = cycleFiles.length
    ? `${where.size} intent(s) across ${files.length} place(s), each in exactly one`
    : `${where.size} intent(s) in the pool, no cycles in use`;
  console.log(`cycle-guard: OK - ${scope}${note}`);
  process.exit(0);
}

const lines = [`\ncycle-guard: ${problems} problem(s).`];
if (clashes.length) {
  lines.push(
    `An intent belongs to the pool or to one cycle. Pulling one into a cycle removes its row from ${pool}; closing a cycle unfinished returns it.`,
  );
}
if (stale.length || selfBlocked.length) {
  lines.push("A `blocked:<id>` status must name an intent that exists, is not itself, and is not already done.");
}
console.error(lines.join("\n"));
process.exit(block ? 1 : 0);
