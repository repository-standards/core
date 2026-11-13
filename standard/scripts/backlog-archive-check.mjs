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
//      The cell is markdown and is resolved the way its reader resolves it: a link target, or
//      any path, from the archive's own directory, and a path written from the repository root
//      as well. Only a token shaped like a path this repository could hold is a pointer - a
//      link target, a path ending in a file name or a `/`, or one starting at a directory that
//      exists - so a module specifier (`next/image`, `@scope/pkg`) or a pair of ids
//      (`ADR-008/ADR-016`) is prose. A bare file name in a code span says what a file is called,
//      not where it is, so it passes when a file of that name exists anywhere in the repository.
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
// Checks 2-4 read every archived row on every run, `--base` or not, including rows archived
// before this guard existed. A pointer that stops resolving because a later change renamed its
// target is the rot check 3 exists to catch, and that change is the one to fail; judging only
// the rows a diff touches would let it through.
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
import { dirname, isAbsolute, join, normalize } from "node:path";
import { globToRegExp } from "./lib/glob.mjs";

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

/* ---------- what a `where` cell points at (check 3) ---------- */

// Every path in the repository, directories included, read once and only when a bare name or a
// glob needs it. git's list honours the ignore rules; a tree with no git is walked instead.
let repoPaths = null;
const allPaths = () => {
  if (repoPaths) return repoPaths;
  let files;
  try {
    files = execSync("git -c core.quotePath=false ls-files -z --cached --others --exclude-standard", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 1 << 28,
    }).split("\0").filter(Boolean);
  } catch {
    const each = (dir, acc = []) => {
      for (const e of readdirSync(dir)) {
        if (e === ".git" || e === "node_modules") continue;
        const p = dir === "." ? e : `${dir}/${e}`;
        if (isDir(p)) each(p, acc);
        else acc.push(p);
      }
      return acc;
    };
    files = each(".");
  }
  repoPaths = new Set();
  for (const f of files) {
    const parts = f.split("/");
    for (let i = 1; i <= parts.length; i++) repoPaths.add(parts.slice(0, i).join("/"));
  }
  return repoPaths;
};
let baseNames = null;
const nameExists = (name) => {
  baseNames ??= new Set([...allPaths()].map((p) => p.slice(p.lastIndexOf("/") + 1)));
  return baseNames.has(name);
};

// Ends in an extension that starts with a letter, so `1.0.23` is a version and not a file.
const FILE_SHAPED = /\.\p{L}[\p{L}\p{N}_-]*$/u;
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

// The archive's own directory first, as a markdown link resolves; the repository root second.
// Anything that normalises to outside the repository is not in it.
const candidates = (archiveDir, p) =>
  [join(archiveDir, p), p.replace(/^\/+/, "")]
    .map((c) => normalize(c))
    .filter((c) => !isAbsolute(c) && c !== ".." && !c.startsWith("../"));
const resolves = (archiveDir, p) =>
  candidates(archiveDir, p).some((c) => {
    if (!c.includes("*")) return existsSync(c);
    const re = globToRegExp(c.replace(/\/$/, ""));
    return [...allPaths()].some((x) => re.test(x));
  });

// The pointers a cell makes, each { path, bare }. Link targets are pointers whatever their
// shape. In the rest of the cell, a token is a pointer when it is shaped like a path; a bare
// file name counts only inside a code span, where it is plainly a file and not a word.
const pointersIn = (archiveDir, where) => {
  const out = [];
  let text = where.replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, " ");
  text = text.replace(/\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g, (_, target) => {
    if (!/^[a-z][a-z0-9+.-]*:/i.test(target)) {
      let path = target.replace(/[#?].*$/, "");
      try { path = decodeURIComponent(path); } catch { /* keep it as written */ }
      if (path) out.push({ path, bare: false });
    }
    return "]";
  });
  const spans = [];
  text = text.replace(/(`+)([^`]+?)\1/g, (_, _ticks, code) => {
    spans.push(code);
    return " ";
  });
  for (const [chunk, inCode] of [[text, false], ...spans.map((s) => [s, true])]) {
    for (const raw of chunk.match(/[\p{L}\p{N}_.@*/-]+/gu) ?? []) {
      // Emphasis around a token is markup; an unpaired `*` is a glob and stays.
      const lead = /^[*_]*/.exec(raw)[0].length;
      const trail = /[*_]*$/.exec(raw)[0].length;
      const cut = Math.min(lead, trail);
      const token = raw.slice(cut, raw.length - cut).replace(/[.,;:]+$/, "");
      if (!token || token.includes("@")) continue; // a scoped package, a pinned version, an address
      const segs = token.split("/").filter(Boolean);
      if (!segs.length) continue;
      if (segs.length === 1) {
        if (inCode && (FILE_SHAPED.test(segs[0]) || token.endsWith("/"))) out.push({ path: segs[0], bare: true });
        continue;
      }
      const shaped =
        token.endsWith("/") ||
        FILE_SHAPED.test(segs.at(-1)) ||
        segs[0] === "." ||
        segs[0] === ".." ||
        candidates(archiveDir, segs[0]).some(isDir);
      if (shaped) out.push({ path: token, bare: false });
    }
  }
  return out;
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
    // Read from the cell as written: `unwrap` takes the backticks off its ends, and those are
    // what tell a code span from prose.
    const archiveDir = dirname(archivePath);
    for (const { path, bare } of pointersIn(archiveDir, row.where)) {
      if (resolves(archiveDir, path) || (bare && nameExists(path))) continue;
      problems.push(
        bare
          ? `${archivePath}: ${id} names ${path} in its \`where\`, and no file or directory of that name is in this repository. A pointer that does not resolve is the archive rotting quietly, which is worse than no archive.`
          : `${archivePath}: ${id} points its \`where\` at ${path}, which is not in this repository (read from ${archiveDir === "." ? "the repository root" : `${archiveDir}/, where the archive is, and from the repository root`}). A pointer that does not resolve is the archive rotting quietly, which is worse than no archive.`,
      );
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
