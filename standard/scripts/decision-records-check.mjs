#!/usr/bin/env node
// Decision-record index guard (R5).
//
// Two decision-record streams (ADR technical / BDR business) each keep files on disk and a
// README table that indexes them by number. Nothing checked the two against each other:
// following adr-write/bdr-write's numbering step literally minted a second BDR-004 (a
// duplicate id survived), and separately an Accepted BDR-004 was missing from bdr/README.md's
// own index - both at self-verify drift 0. This guard closes that gap mechanically:
//
//   1. duplicate id       - two files, or two index rows, claim the same stream + number.
//   2. file, no index row - a record exists on disk that its README never lists.
//   3. index row, no file - a README row cites a file that is not there (renamed, reverted,
//                            or the row was added before the file was).
//
// Layout-agnostic on purpose: it works against the shipped `adr/` + `bdr/` split (each with
// its own README, ADR-005) and against a flat `docs/decision-records/` with one README
// covering both prefixes (this repo's own layout - R5 requires the two streams, never a
// subfolder shape). Numbering is always per-prefix: ADR-004 and BDR-004 are not the same id.
//
// What this does NOT check: whether the record's *content* is any good, whether `Status` is
// accurate, or whether prose elsewhere still cites a superseded record (that is
// spec-reconcile's job when the citing prose sits in a spec). This only proves the index and
// the directory agree on what exists and what number it has.
//
// Usage:
//   node scripts/decision-records-check.mjs [--root <dir>]   # default: docs/decision-records
//   add --block to exit non-zero on a violation (default: warn, exit 0)
//
// No dependencies (Node built-ins only). Place at scripts/decision-records-check.mjs.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const block = args.includes("--block");
const rootIdx = args.indexOf("--root");
const ROOT = rootIdx >= 0 ? args[rootIdx + 1] : "docs/decision-records";

if (!existsSync(ROOT)) {
  console.log(`decision-records-check: no ${ROOT}/ - skipping (nothing recorded yet)`);
  process.exit(0);
}

// A record file: ADR-004-title.md / BDR-012-title.md. Never the template or the index itself.
const FILE_RE = /^(ADR|BDR)-(\d+)-.+\.md$/;

const filesIn = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).filter((e) => !statSync(join(dir, e)).isDirectory() && FILE_RE.test(e))
    : [];

// Two shapes for a stream: the shipped adr/ + bdr/ split (one prefix per directory) or a flat
// directory carrying both (this repo's own layout). Detected, not configured - same pattern
// self-verify.mjs uses for manifest-vs-skeleton.
const adrDir = join(ROOT, "adr");
const bdrDir = join(ROOT, "bdr");
const streams =
  existsSync(adrDir) || existsSync(bdrDir)
    ? [
        ...(existsSync(adrDir) ? [{ dir: adrDir, prefixes: ["ADR"] }] : []),
        ...(existsSync(bdrDir) ? [{ dir: bdrDir, prefixes: ["BDR"] }] : []),
      ]
    : [{ dir: ROOT, prefixes: ["ADR", "BDR"] }];

// Index rows: the first table cell, either `[NNN](file.md)` (this repo's own convention) or a
// bare `NNN`. Placeholder rows (`| - | (none yet) | - |`) have no digit and are skipped for free.
// The `ADR-`/`BDR-` prefix is optional in both forms: labelling the row with the record's own
// id is the shape people reach for first, and rejecting it made the whole row invisible - the
// guard then reported the file as unindexed while its row sat two lines above, which sends the
// reader to fix the wrong thing.
const ROW_LINKED = /^\[(?:(ADR|BDR)-)?(\d+)\]\(([^)]+)\)$/;
const ROW_BARE = /^(?:(ADR|BDR)-)?(\d+)$/;
const ROW_FORMS = "[001](FILE.md), [ADR-001](FILE.md), 001 or ADR-001";

const rowsIn = (readmePath) => {
  if (!existsSync(readmePath)) return null; // distinct from "no rows" - reported separately
  const rows = [];
  for (const raw of readFileSync(readmePath, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells[0] === "") cells.shift();
    const first = cells[0];
    if (!first) continue;
    const linked = ROW_LINKED.exec(first);
    const bare = linked ? null : ROW_BARE.exec(first);
    if (!linked && !bare) continue; // header, separator, prose row - not an index entry
    const m = linked ?? bare;
    rows.push({ num: Number(m[2]), prefix: m[1] ?? null, file: linked ? linked[3] : null, raw: line });
  }
  return rows;
};

let problems = 0;
let checked = 0;
const dupFiles = [];
const dupRows = [];
const fileNoRow = [];
const rowNoFile = [];

for (const { dir, prefixes } of streams) {
  const readme = join(dir, "README.md");
  const rows = rowsIn(readme);
  if (rows === null) {
    console.error(`  ${dir}/ has records but no README.md to index them`);
    problems++;
    continue;
  }

  // files on disk, grouped by "prefix-number" so ADR-004 and BDR-004 never collide.
  const byKey = new Map(); // "ADR-4" -> [filename, ...]
  for (const name of filesIn(dir)) {
    const [, prefix, numStr] = FILE_RE.exec(name);
    if (!prefixes.includes(prefix)) continue; // adr/ directory holding a BDR file: not this stream's problem here
    const key = `${prefix}-${Number(numStr)}`;
    byKey.set(key, [...(byKey.get(key) ?? []), name]);
  }
  for (const [key, names] of byKey) {
    if (names.length > 1) dupFiles.push({ dir, key, names });
  }
  checked += byKey.size;

  // rows resolved to a key. A linked row's key comes from the linked filename (correct even
  // in flat mode); a bare row's key is guessed from whichever prefix has that number on disk.
  const rowKeys = new Map(); // key -> [row, ...]
  for (const row of rows) {
    let key;
    if (row.file) {
      const m = FILE_RE.exec(row.file.split("/").pop());
      key = m ? `${m[1]}-${Number(m[2])}` : `?-${row.num}`; // link doesn't even look like a record
    } else if (row.prefix) {
      key = `${row.prefix}-${row.num}`; // the row said which stream it is - believe it rather than guess
    } else {
      const match = prefixes.find((p) => byKey.has(`${p}-${row.num}`));
      key = match ? `${match}-${row.num}` : `?-${row.num}`;
    }
    rowKeys.set(key, [...(rowKeys.get(key) ?? []), row]);
  }
  for (const [key, rs] of rowKeys) {
    if (rs.length > 1) dupRows.push({ dir, key, rows: rs });
  }

  for (const [key, names] of byKey) {
    if (!rowKeys.has(key)) fileNoRow.push({ dir, key, name: names[0] });
  }
  for (const [key, rs] of rowKeys) {
    if (byKey.has(key)) continue;
    for (const row of rs) rowNoFile.push({ dir, key, row });
  }
}

if (dupFiles.length) {
  console.error("\ndecision-records-check: duplicate id - more than one file claims the same number:");
  for (const { dir, key, names } of dupFiles) console.error(`  - ${dir}/: ${key} -> ${names.join(", ")}`);
}
if (dupRows.length) {
  console.error("\ndecision-records-check: duplicate id - more than one README row claims the same number:");
  for (const { dir, key, rows } of dupRows) {
    for (const row of rows) console.error(`  - ${dir}/README.md (${key}): ${row.raw}`);
  }
}
if (fileNoRow.length) {
  console.error("\ndecision-records-check: on disk, missing from the index:");
  for (const { dir, name } of fileNoRow) console.error(`  - ${dir}/${name} has no row in ${dir}/README.md`);
  console.error(`    (a row is recognised by its first cell: ${ROW_FORMS} - any other form is invisible here, so check the row you wrote before writing another)`);
}
if (rowNoFile.length) {
  console.error("\ndecision-records-check: indexed, missing from disk:");
  for (const { dir, key, row } of rowNoFile) console.error(`  - ${dir}/README.md cites ${key} but no such file exists there: ${row.raw}`);
}

problems += dupFiles.length + dupRows.length + fileNoRow.length + rowNoFile.length;

if (!problems) {
  console.log(`decision-records-check: OK (${checked} record(s), index and directory agree)`);
  process.exit(0);
}

console.error(`\ndecision-records-check: ${problems} problem(s). Number gapless, never reused (adr-write/bdr-write); the directory is the source of truth, not a remembered count.`);
process.exit(block ? 1 : 0);
