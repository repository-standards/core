#!/usr/bin/env node
// Backlog archive guard (R15, standard ADR-051).
//
// Closing a backlog row is a relocation, not a deletion: the finding goes to a record, a spec
// or a dossier, what shipped goes to the CHANGELOG, and the row itself moves to
// `docs/backlog-archive.md` carrying a `where` cell naming what its content became. The rule
// existed as an aside for a year ("drop `done` rows on release") and was universally ignored,
// because following it destroyed the only written record of findings that produced no commit.
// An accepted rule with no guard is the defect that record is about, so:
//
//   1. removed, not archived - a diff that takes a row out of the pool without that id
//      reaching the archive. This is the one that matters; it fires seventeen times on the
//      commit that motivated the record.
//   2. empty `where`         - "a row that cannot be relocated was not done", made mechanical.
//   3. `where` points nowhere - a path named in the cell that is not in the repository. Same
//      class of failure decision-records-check reports for an index row citing a missing file.
//   4. in both files         - the one-place invariant sprint-guard asserts between the pool
//      and a sprint, extended to the pool and the archive.
//
// Exempt from (1), because neither is a closure: an id that appears in a sprint file (it left
// the pool, it did not close) and a row carrying `split:<id>` whose remainder row is live.
//
// **What "skips itself" means here**, since the two halves differ and the difference is the
// whole enforcement: checks 2-4 read the archive, so they skip where there is no archive - an
// adopter who has closed nothing is never failed by a file they do not have. Check 1 does not
// skip on a missing archive, because the first closure is exactly when the archive is supposed
// to appear; skipping there would exempt every repo that has never archived, which is every
// repo the rule is written for. It skips where no base ref is given (nothing to diff) or where
// the pool itself is absent.
//
// What this does NOT check: whether the destination actually captures the finding. That is
// substance, and standard ADR-038 settled that this project measures structure and leaves substance to
// judgment rather than converting it into ceremony. A `where` can point at any file that
// exists - the guard catches the empty answer and the broken one, never the lazy one.
//
// Usage:
//   node scripts/backlog-archive-check.mjs                  # archive shape only
//   node scripts/backlog-archive-check.mjs --base <ref>     # CI: also the removal check
//   add --block to exit non-zero on a violation (default: warn, exit 0)
//
// No dependencies (Node built-ins only). Place at scripts/backlog-archive-check.mjs.

import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

const args = process.argv.slice(2);
const block = args.includes("--block");
const baseIdx = args.indexOf("--base");
const base = baseIdx >= 0 ? args[baseIdx + 1] : null;

// Both manifest paths, primary first. The archive sits beside the pool wherever the pool sits,
// so a repo keeping `docs/backlog.md` keeps `docs/backlog-archive.md` - and one hardcoded path
// is how sprint-guard once checked half of what it claimed to.
const POOLS = ["docs/backlog.md", "backlog.md"];
const ARCHIVES = ["docs/backlog-archive.md", "backlog-archive.md"];
const CYCLES = "docs/sprints";

const ID = /^[A-Z][A-Z0-9]*-[A-Za-z0-9-]+$/;
const SPLIT_AS = /^split\s*:\s*([A-Z][A-Z0-9]*-[A-Za-z0-9-]+)$/i;
const SEP_CELL = /^:?-+:?$/;
const unwrap = (cell) => (cell ?? "").replace(/^[`*_\s]+/, "").replace(/[`*_\s]+$/, "");

const firstThatExists = (paths) => paths.find((p) => existsSync(p)) ?? null;

// Rows the author can see are rows the guard reads. A table inside a fenced block or an HTML
// comment is documentation of the format - every shipped template teaches its own shape that
// way - so reading it as data reports the example row as a real one. Same left-to-right
// comment scan sprint-guard and decision-records-check document: an open-and-close on one line
// must not swallow the rest of it, and a `-->` in prose must not resurrect an example block.
function visibleLines(text) {
  const out = [];
  let commented = false;
  let fenced = false;
  for (const raw of text.split("\n")) {
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
    out.push(fenced ? "" : visible.trim());
  }
  return out;
}

const cellsOf = (line) => line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

// Columns are read by name, never by position: an archive gains columns as adopters find them
// useful, and a guard keyed on "the third cell" fails the day somebody adds a date. The header
// is the row above the separator, which is also what tells a table from a line of prose that
// happens to start with a pipe.
function tableRows(text) {
  const lines = visibleLines(text);
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("|")) continue;
    const header = cellsOf(lines[i]);
    const sep = lines[i + 1]?.startsWith("|") ? cellsOf(lines[i + 1]) : null;
    if (!sep || !sep.length || !sep.every((c) => SEP_CELL.test(c))) continue;
    const names = header.map((h) => unwrap(h).toLowerCase());
    for (i += 2; i < lines.length && lines[i].startsWith("|"); i++) {
      const cells = cellsOf(lines[i]);
      const row = {};
      names.forEach((n, c) => {
        if (n) row[n] = cells[c] ?? "";
      });
      row._cells = cells;
      rows.push(row);
    }
    i--;
  }
  return rows;
}

// An id column where the table names one, the first cell otherwise - the pre-ADR-046 pools and
// every hand-written table start with the id and never label it.
const idOf = (row) => {
  const raw = unwrap(row.id ?? row._cells[0] ?? "");
  return ID.test(raw) ? raw : null;
};

const idsIn = (text) => {
  const ids = new Map();
  for (const row of tableRows(text)) {
    const id = idOf(row);
    if (id && !ids.has(id)) ids.set(id, row);
  }
  return ids;
};

const walk = (dir, acc = []) => {
  for (const e of readdirSync(dir)) {
    if (e.startsWith("_")) continue; // a template's example rows are not work
    const p = `${dir}/${e}`;
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (e.endsWith(".md")) acc.push(p);
  }
  return acc;
};

const problems = [];
const pool = firstThatExists(POOLS);
const archivePath = firstThatExists(ARCHIVES);

if (!pool) {
  console.log(`backlog-archive-check: no ${POOLS.join(" or ")} - skipping (no work ledger yet)`);
  process.exit(0);
}

const poolIds = idsIn(readFileSync(pool, "utf8"));
const archiveIds = archivePath ? idsIn(readFileSync(archivePath, "utf8")) : new Map();

/* ---------- 2, 3, 4: the archive, where there is one ---------- */

if (archivePath) {
  for (const [id, row] of archiveIds) {
    const where = unwrap(row.where ?? "");
    if (!where) {
      problems.push(
        `${archivePath}: ${id} has an empty \`where\` - a row whose content cannot be relocated was not done. Name what its content became (a record, a spec, a dossier, a changelog entry), or take the row back to the pool.`,
      );
      continue;
    }
    // Only tokens shaped like a repository path are resolved. `ADR-012` and `specs/invoicing`
    // are both legitimate answers and only one of them is a path; demanding a path would push
    // authors into writing a file name where an id is the honest answer.
    // A URL is dropped whole before tokenizing, not filtered afterwards: `https://host/a/b`
    // tokenizes into a perfectly convincing relative path once the scheme is off the front,
    // and the guard then demands a directory named after somebody's git host.
    const local = where.replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, " ");
    for (const token of local.match(/[\w.@-]+\/[\w./@-]+|[\w-]+\.[a-z]{2,4}\b/gi) ?? []) {
      const path = token.replace(/[.,;:]+$/, "");
      if (!existsSync(path)) {
        problems.push(
          `${archivePath}: ${id} points its \`where\` at ${path}, which is not in this repository. A pointer that does not resolve is the archive rotting quietly, which is worse than no archive.`,
        );
      }
    }
  }

  for (const id of archiveIds.keys()) {
    if (poolIds.has(id)) {
      problems.push(
        `${id} is in both ${pool} and ${archivePath}. A row lives in one place: archive it or keep it live, not both.`,
      );
    }
  }
}

/* ---------- 1: rows that left the pool without reaching the archive ---------- */

if (base) {
  const sh = (cmd) => {
    try {
      return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      return null;
    }
  };
  // The merge base, not the base tip: diffing against a branch that moved on reports every row
  // somebody else archived meanwhile as this pull request's deletion.
  const mergeBase = sh(`git merge-base ${base} HEAD`)?.trim() || base;
  const before = sh(`git show ${mergeBase}:${pool}`);

  if (before === null) {
    console.log(`backlog-archive-check: ${pool} is new in this change - nothing to compare`);
  } else {
    const inSprints = new Set();
    if (existsSync(CYCLES)) {
      for (const file of walk(CYCLES)) {
        for (const id of idsIn(readFileSync(file, "utf8")).keys()) inSprints.add(id);
      }
    }

    for (const [id, row] of idsIn(before)) {
      if (poolIds.has(id) || archiveIds.has(id)) continue;
      if (inSprints.has(id)) continue; // it left the pool for a sprint - not a closure
      const split = SPLIT_AS.exec(unwrap(row.status ?? ""));
      if (split && (poolIds.has(split[1].toUpperCase()) || inSprints.has(split[1].toUpperCase()))) continue;
      problems.push(
        `${id} was removed from ${pool} and is not in ${archivePath ?? ARCHIVES[0]}. Closing a row is a relocation: put its finding where findings live, what shipped in the CHANGELOG, and the row in the archive with a \`where\` (standard ADR-051).`,
      );
    }
  }
} else if (!archivePath) {
  console.log(`backlog-archive-check: no ${ARCHIVES[0]} and no --base - skipping (nothing closed yet)`);
  process.exit(0);
}

/* ---------- report ---------- */

if (!problems.length) {
  const scope = archivePath ? `${archiveIds.size} archived, ${poolIds.size} live` : `${poolIds.size} live, nothing archived yet`;
  console.log(`backlog-archive-check: OK (${scope})`);
  process.exit(0);
}

for (const p of problems) console[block ? "error" : "warn"](`backlog-archive-check: ${p}`);
console[block ? "error" : "warn"](
  `backlog-archive-check: ${problems.length} problem(s)${block ? "" : " - warning only, add --block to fail"}`,
);
process.exit(block ? 1 : 0);
