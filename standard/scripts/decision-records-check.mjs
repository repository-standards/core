#!/usr/bin/env node
// Decision-record index guard (R5).
//
// Two decision-record streams (ADR technical / BDR business) each keep files on disk and a
// README table that indexes them by number. Nothing checked the two against each other:
// following adr-write/bdr-write's numbering step literally minted a second `BDR-004` (a
// duplicate id survived), and separately an Accepted `BDR-004` was missing from bdr/README.md's
// own index - both at self-verify drift 0. This guard closes that gap mechanically:
//
//   1. duplicate id       - two files, or two index rows, claim the same stream + number.
//   2. file, no index row - a record exists on disk that its README never lists.
//   3. index row, no file - a README row cites a file that is not there (renamed, reverted,
//                            or the row was added before the file was).
//   4. no reopening signal - a record still on the table, with no usable `## Revisit when`.
//
// (4) exists because the section ships in both templates, is read by tooling, and was still
// skipped in half of this repo's own log - including records written the same week the gap
// was found, so it is not an artifact of old records predating the template. `discovery-digest`
// greps every record's signal against incoming material, which means a missing section does
// not fail loudly; it silently narrows that tripwire to whichever records happened to get one.
// Read for shape, not presence (standard ADR-048): an empty heading, or the template's own prompt text
// left in place, is a record with no signal wearing one. Only records that no longer bind
// (superseded, rejected) are exempt - there is nothing left to reopen. A `Proposed` record is
// not exempt: naming the signal is part of writing the record, not of accepting it.
//
// Layout-agnostic on purpose: it works against the shipped `adr/` + `bdr/` split (each with
// its own README, standard ADR-005) and against a flat `docs/decision-records/` with one README
// covering both prefixes (this repo's own layout - R5 requires the two streams, never a
// subfolder shape). Numbering is always per-prefix: `ADR-004` and `BDR-004` are not the same id.
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
//
// The link label may carry the stream prefix - `[ADR-001](ADR-001-title.md)` - because that is
// what an author writes when nothing shows them otherwise, and the shipped README templates
// ship only the placeholder row. Rejecting it produced the worst possible message: "has no row
// in README.md" about a record whose row was right there, one character off. The label is
// cosmetic either way; a linked row's identity always comes from the file it links to, so
// accepting the prefix cannot make a wrong row look right.
// A stated prefix is kept rather than discarded: in a flat layout it is the only thing that
// tells a bare `BDR-004` row from `ADR-004`, which the number alone cannot.
const ROW_LINKED = /^\[(?:(ADR|BDR)-)?(\d+)\]\(([^)]+)\)$/i;
const ROW_BARE = /^(?:(ADR|BDR)-)?(\d+)$/i;
const ROW_FORMS = "`[001](FILE.md)`, `[ADR-001](FILE.md)`, `001` or `ADR-001`";

// Rows inside an HTML comment or a fenced code block are examples, not index entries. Every
// other shipped template documents its own row shape that way (the backlog, the sprint file),
// and this index could not: a commented `| [002](ADR-002-example.md) | ... |` was read as a
// real row and reported as "indexed, missing from disk". So the one file whose format an
// author most needs shown was the one file that could not show it. Same left-to-right comment
// scan as sprint-guard.mjs, for the same reasons it documents: an open-and-close on one line
// must not swallow a real row, and a `-->` in prose must not resurrect an example block.
const rowsIn = (readmePath) => {
  if (!existsSync(readmePath)) return null; // distinct from "no rows" - reported separately
  const rows = [];
  let commented = false;
  let fenced = false;
  for (const raw of readFileSync(readmePath, "utf8").split("\n")) {
    const src = raw.trim();
    if (!commented && /^(```|~~~)/.test(src)) {
      fenced = !fenced;
      continue;
    }
    let rest = src;
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
    const line = visible.trim();
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells[0] === "") cells.shift();
    const first = cells[0];
    if (!first) continue;
    const linked = ROW_LINKED.exec(first);
    const bare = linked ? null : ROW_BARE.exec(first);
    if (!linked && !bare) continue; // header, separator, prose row - not an index entry
    const m = linked ?? bare;
    rows.push({
      num: Number(m[2]),
      prefix: m[1] ? m[1].toUpperCase() : null,
      file: linked ? linked[3] : null,
      raw: line,
    });
  }
  return rows;
};

let problems = 0;
let checked = 0;
const dupFiles = [];
const dupRows = [];
const fileNoRow = [];
const rowNoFile = [];
const noSignal = [];

// A record that no longer binds has nothing to reopen. Anchored at the start of the status
// value: `Accepted (2026-07-22) - supersedes ADR-013` is an ACCEPTED record that supersedes
// another one, and a substring match would have exempted it for containing the word.
const EXEMPT_STATUS = /^\s*(superseded|rejected|deprecated|withdrawn)/i;
// The prompts shipped in adr/_template.md and bdr/_template.md - they differ, so both are
// listed. Left in place, either one is an unfilled section that looks filled to anything
// counting headings.
const TEMPLATE_PROMPTS = [
  "The concrete signal that would invalidate this decision",
  "The business signal that would reopen this",
];

for (const { dir, prefixes } of streams) {
  const readme = join(dir, "README.md");
  const rows = rowsIn(readme);
  if (rows === null) {
    console.error(`  ${dir}/ has records but no README.md to index them`);
    problems++;
    continue;
  }

  // files on disk, grouped by "prefix-number" so `ADR-004` and `BDR-004` never collide.
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
    } else if (row.prefix && prefixes.includes(row.prefix)) {
      key = `${row.prefix}-${row.num}`;
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

  for (const names of byKey.values()) {
    for (const name of names) {
      const text = readFileSync(join(dir, name), "utf8");
      const status = /^\|\s*\*\*Status\*\*\s*\|([^|]*)\|/m.exec(text)?.[1] ?? "";
      if (EXEMPT_STATUS.test(status)) continue;
      const heading = /^##\s+Revisit when\s*$/m.exec(text);
      if (!heading) {
        noSignal.push({ dir, name, why: "has no `## Revisit when` section" });
        continue;
      }
      // Body runs to the next heading of the same level. HTML comments are guidance, not content.
      const body = text
        .slice(heading.index + heading[0].length)
        .split(/^## /m)[0]
        .replace(/<!--[\s\S]*?-->/g, "")
        .trim();
      if (!body) noSignal.push({ dir, name, why: "has an empty `## Revisit when` section" });
      else if (TEMPLATE_PROMPTS.some((prompt) => body.includes(prompt)))
        noSignal.push({ dir, name, why: "still carries the template's prompt text under `## Revisit when`" });
    }
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

if (noSignal.length) {
  console.error("\ndecision-records-check: record with no reopening signal:");
  for (const { dir, name, why } of noSignal) console.error(`  - ${dir}/${name} ${why}`);
  console.error(
    "    (name the concrete signal that would reopen the decision - a threshold, a lifted constraint, a vendor change.",
  );
  console.error(
    "     Where a decision is structural and genuinely has no such signal, say that in the section: an honest 'nothing",
  );
  console.error(
    "     reopens this except X' is a real answer, an invented threshold is not. Superseded and rejected records are exempt.)",
  );
}

problems += dupFiles.length + dupRows.length + fileNoRow.length + rowNoFile.length + noSignal.length;

if (!problems) {
  console.log(`decision-records-check: OK (${checked} record(s), index and directory agree)`);
  process.exit(0);
}

console.error(`\ndecision-records-check: ${problems} problem(s). Number gapless, never reused (adr-write/bdr-write); the directory is the source of truth, not a remembered count.`);
process.exit(block ? 1 : 0);
