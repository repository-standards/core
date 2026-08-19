#!/usr/bin/env node
// elicitation-provenance - the repo says how each answer was arrived at, and a deferred
// answer is not allowed to evaporate.
//
// The hook next door (.claude/hooks/elicitation-guard.mjs) refuses a write until its
// question fired. What it cannot see is what happened to the answer: a question asked and
// then quietly overridden looks identical to one asked and honoured. So the states live in
// one ledger a reviewer reads in a single pass - docs/adoption-provenance.md - instead of
// as frontmatter on every artifact, where nobody compares them.
//
// What it enforces:
//   1. Every required point has a row. A point with no row is not "fine", it is unrecorded.
//   2. The state is one the point allows. `inferred` is rejected wherever the answer is a
//      preference rather than a fact about the code - that is the whole distinction.
//   3. `provisional` names a backlog row, and that row exists. This is the one that matters:
//      "the agent suggested, the owner will check later" is a promise, and an unkept promise
//      here reads exactly like a settled decision six months on.
//   4. `human` names who and when. Unverifiable here on purpose - the transcript checker is
//      what tests that claim, and a gate that pretends to verify it would be worse than one
//      that says it cannot.
//   5. `pending` is legal until the point is REACHED, and reaching it is a fact about the
//      tree rather than a flag: the point gates a path where the adoption has now written
//      something. Something was written where the question belonged, so it was either asked
//      or skipped, and `pending` is false either way.
//
//      Two spellings of that rule were tried and both were red on arrival, which is the
//      failure mode worth naming: a guard that fails the day it lands teaches people to
//      delete it. First, pending fails once `.standards-version` exists - but that file is
//      written at align time, before a single question has been put to anyone. Then, pending
//      fails once a gated path holds any non-template file - but a brownfield repository
//      arrives holding decision records, a PRODUCT.md and specs it wrote years before it had
//      heard of this standard, and its own history is not evidence that anybody was asked.
//
//      So reaching is scoped to what the adoption itself wrote: git separates the two, at the
//      commit that introduced the standard, plus everything not yet committed. Where that
//      boundary cannot be drawn - no git work tree - the check says so out loud and stands
//      down. A silent skip reads in the output exactly like a pass.
//
//      One edge, stated rather than hidden: a point that gates no path - a rename, a phase
//      boundary - can never be reached here, and the static check and human review carry
//      those. Everything else is read: an artifact that never shipped is the adopter's, a
//      file meant to stay verbatim is compared to its hash, and a fill-from-repo slot counts
//      as untouched only while it still holds the placeholders it shipped with.
//
// A repo with no ledger at all fails rather than passes. Absence of the record is the
// state this whole mechanism exists to stop being invisible.
//
//   node scripts/elicitation-provenance.mjs [--ledger <path>] [--json]
//
// Ships to adopting repos. Node built-ins only.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const POINT_ROOTS = ["standard/.claude/elicitation/points.json", ".claude/elicitation/points.json"];
const LEDGER = arg("--ledger", ["docs/adoption-provenance.md", "standard/docs/adoption-provenance.md"].find(existsSync) ?? "docs/adoption-provenance.md");
const BACKLOGS = ["backlog.md", "docs/backlog.md", "standard/docs/backlog.md"];
const AS_JSON = process.argv.includes("--json");

// The ledger records the adoption of the tree it sits in, so that tree is what gets read -
// not the whole checkout. It matters in this repo, where the shipped tree is a subdirectory
// and the surrounding files are the standard's own work rather than an adopter's.
const SUFFIX = "docs/adoption-provenance.md";
const ROOT = (LEDGER.endsWith(SUFFIX) ? LEDGER.slice(0, -SUFFIX.length) : "").replace(/\/$/, "") || ".";
const at = (rel) => (ROOT === "." ? rel : `${ROOT}/${rel}`);

// Directories no repo wants walked, and a cap so a monorepo cannot turn a guard into a wait.
const SKIP = new Set([".git", "node_modules", ".next", "dist", "build", "coverage", "vendor", "target", ".venv"]);
const WALK_CAP = 50000;

function tracked() {
  const found = [];
  const walk = (rel, depth) => {
    if (found.length > WALK_CAP || depth > 12) return;
    let entries;
    try { entries = readdirSync(rel === "" ? ROOT : at(rel), { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const next = rel === "" ? e.name : `${rel}/${e.name}`;
      if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(next, depth + 1); }
      else found.push(next);
    }
  };
  walk("", 0);
  return found;
}

// A shipped file still byte-identical to what shipped is a template nobody has answered
// into. The manifest already carries those hashes for self-verify, so this is a read of an
// existing record rather than a second source of truth.
function shipped() {
  const paths = new Set(), hashes = new Map();
  const file = at("standard.manifest.json");
  if (!existsSync(file)) return { paths, hashes };
  let manifest;
  try { manifest = JSON.parse(readFileSync(file, "utf8")); } catch { return { paths, hashes }; }
  for (const f of manifest.files || []) {
    if (!f.path) continue;
    paths.add(f.path);
    if (f.sha256) hashes.set(f.path, f.sha256);
  }
  return { paths, hashes };
}

const SHIPPED = shipped();
const FILES = tracked();

// The same small glob dialect the hook uses: ** spans directories, * does not span a slash.
const rx = (g) =>
  new RegExp("(^|/)" + g.split("**").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*")).join(".*") + "$");

// Three kinds of shipped path, and they need three different answers. Reading them all the
// same way was the first attempt and it was useless: the manifest lists `docs/decision-records`
// as one entry, so treating everything beneath it as shipped material meant a repo could hold
// thirty-seven decision records and the check would still report that nothing had been written.
// A rule that cannot fire is worse than no rule, because it reads in the output as a pass.
const SHIPPED_LIST = [...SHIPPED.paths];
const matchesEntry = (rel, p) => rel === p || rel.endsWith(`/${p}`);
const inside = (rel) => SHIPPED_LIST.some((p) => rel.startsWith(`${p}/`) || rel.includes(`/${p}/`));
const slot = (rel) => SHIPPED_LIST.some((p) => matchesEntry(rel, p));

// What the standard puts inside a directory it ships: the scaffolding an adopter reads and
// copies, never edits in place. The naming is the standard's own and is consistent across every
// such directory - `_template.md`, `_entry-template.md`, `README.md`, `*.example.json`.
const scaffolding = (rel) => {
  const base = rel.slice(rel.lastIndexOf("/") + 1);
  return base.startsWith("_") || base === "README.md" || /template|example/i.test(base);
};

// A `fill-from-repo` slot shipped to be written into, so no hash could be carried for it. What
// separates the unwritten copy from the answered one is the standard's own placeholder
// convention (AGENTS.md): angle brackets in prose mean replace me, angle brackets in code
// formatting are notation. The same read `self-verify`'s fill check makes, for the same reason.
// Two notations, because the templates use both: `{{NAME}}` wherever the slot sits inside code
// formatting (a table cell, an identifier), and <angle brackets> in prose. Code spans are
// stripped before the second is looked for, exactly as the fill check does - generic notation
// legitimately lives in backticks, and a placeholder written there hides from both of us.
const MUSTACHE = /\{\{[A-Za-z0-9_]+\}\}/;
const ANGLED = /<[A-Za-z][^<>\n]{2,}>/;
const unfilled = (rel) => {
  try {
    const raw = readFileSync(at(rel), "utf8");
    if (MUSTACHE.test(raw)) return true;
    return ANGLED.test(raw.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, ""));
  } catch { return false; }
};

const template = (rel) => {
  const want = SHIPPED.hashes.get(rel);
  if (want) {
    // Meant to stay verbatim: byte-identical is the whole question.
    try { return createHash("sha256").update(readFileSync(at(rel))).digest("hex") === want; } catch { return false; }
  }
  // Inside first: a file under a shipped directory is that directory's scaffolding, whatever
  // its basename happens to collide with elsewhere in the manifest.
  if (inside(rel)) return scaffolding(rel);
  if (slot(rel)) return unfilled(rel);
  return false; // never shipped at all - this is the adopter's own work
};

// Which files the adoption itself wrote. Everything else in the tree is the repository's own
// history, and a repository's history says nothing about whether anyone was asked anything.
//
// The boundary is the commit that introduced the standard, and anything still uncommitted -
// that second half is the ordinary case, because the gate usually runs mid-adoption, before
// the branch has a commit to measure from. Returns null when there is no boundary to draw.
const git = (...args) => {
  const r = spawnSync("git", ["-C", ROOT, ...args], { encoding: "utf8" });
  return r.status === 0 ? r.stdout : null;
};

const BASELINE_MARKERS = [".standards-version", ".claude/elicitation/points.json", "standard.manifest.json"];

function adoptionWrote() {
  if (git("rev-parse", "--is-inside-work-tree") === null) return null;
  // git prints paths from the repository root; this tree may sit below it.
  const prefix = (git("rev-parse", "--show-prefix") ?? "").trim();
  const files = new Set();
  const dirs = [];
  const add = (raw) => {
    let rel = raw.trim().replace(/^"|"$/g, "");
    if (!rel || !rel.startsWith(prefix)) return;
    rel = rel.slice(prefix.length);
    // An untracked directory is reported as one entry, not as its contents.
    if (rel.endsWith("/")) dirs.push(rel);
    else files.add(rel);
  };

  for (const line of (git("status", "--porcelain") ?? "").split("\n")) {
    if (line.length < 4) continue;
    const rest = line.slice(3);
    const arrow = rest.indexOf(" -> "); // a rename names both sides; the new one is the write
    add(arrow === -1 ? rest : rest.slice(arrow + 4));
  }

  let baseline = null;
  for (const marker of BASELINE_MARKERS) {
    const adds = (git("log", "--diff-filter=A", "--format=%H", "--", marker) ?? "").trim().split("\n").filter(Boolean);
    if (adds.length) { baseline = adds[adds.length - 1]; break; } // oldest add, if it was ever re-added
  }
  if (baseline) {
    for (const p of (git("show", "--format=", "--name-only", baseline) ?? "").split("\n")) add(p);
    for (const p of (git("log", "--format=", "--name-only", `${baseline}..HEAD`) ?? "").split("\n")) add(p);
  }

  return { has: (rel) => files.has(rel) || dirs.some((d) => rel.startsWith(d)) };
}

const WROTE = adoptionWrote();

// Reached: the adoption wrote something at a path this point gates, and what it wrote is not
// the template that shipped there.
function reached(point) {
  const globs = point.gate_globs || [];
  if (!globs.length) return null; // gates nothing - see note 5
  if (!WROTE) return null; // no boundary - announced below rather than passed off as a check
  for (const g of globs) {
    const re = rx(g);
    for (const f of FILES) if (re.test(f) && WROTE.has(f) && !template(f)) return f;
  }
  return null;
}

function fail(lines) {
  if (AS_JSON) console.log(JSON.stringify({ verdict: "FAIL", problems: lines }, null, 2));
  else {
    for (const l of lines) console.log(`  FAIL  ${l}`);
    console.log(`\nelicitation-provenance: FAIL - ${lines.length} problem(s)`);
  }
  process.exit(1);
}

const pointsFile = POINT_ROOTS.find(existsSync);
if (!pointsFile) fail(["no points.json found - this repo declares no elicitation points, so nothing here can be checked"]);
const declared = JSON.parse(readFileSync(pointsFile, "utf8"));

if (!existsSync(LEDGER)) {
  fail([
    `${LEDGER} does not exist. Every point this standard must ask about is currently unrecorded,`,
    "which is indistinguishable from every one of them having been answered by a person.",
    "Start it from .claude/elicitation/provenance.example.md - a fresh repo's rows are all `absent`.",
  ]);
}

// One markdown table, parsed by position: | point | state | who | when | landed in | backlog |
// Deliberately strict. A row that does not parse is reported, never skipped - a silently
// dropped row is a missing record that reads as a present one.
const rows = [];
const malformed = [];
for (const line of readFileSync(LEDGER, "utf8").split("\n")) {
  const t = line.trim();
  if (!t.startsWith("|") || /^\|[\s|:-]+\|$/.test(t)) continue;
  const cells = t.slice(1, -1).split("|").map((c) => c.trim().replace(/^`|`$/g, ""));
  if (!/^[a-z]+\.[a-z-]+$/.test(cells[0])) continue; // header row, or prose in a table
  if (cells.length < 6) { malformed.push(`${cells[0]}: row has ${cells.length} cells, the ledger's table has 6`); continue; }
  rows.push({ point: cells[0], state: cells[1], who: cells[2], when: cells[3], landed: cells[4], backlog: cells[5] });
}

const backlogText = BACKLOGS.map(at).filter(existsSync).map((f) => readFileSync(f, "utf8")).join("\n");
const problems = [...malformed];
const byPoint = new Map(rows.map((r) => [r.point, r]));

for (const p of declared.points || []) {
  const row = byPoint.get(p.id);
  if (!row) {
    if (p.required) problems.push(`${p.id}: no row in ${LEDGER} - unrecorded, which reads the same as answered`);
    continue;
  }
  if (row.state === "pending") {
    const evidence = p.required ? reached(p) : null;
    if (evidence) {
      problems.push(`${p.id}: still pending, but this adoption wrote ${at(evidence)} - a path this point gates, so the question was either asked or skipped`);
    }
    continue;
  }
  if (!(p.allowed_provenance || []).includes(row.state)) {
    problems.push(
      `${p.id}: state "${row.state}" is not one this point allows (${(p.allowed_provenance || []).join(", ")})` +
        (row.state === "inferred" ? ` - ${p.why || "this answer is a preference, not a fact the repo can be read for"}` : ""),
    );
    continue;
  }
  if (row.state === "provisional") {
    if (!row.backlog || row.backlog === "-") {
      problems.push(`${p.id}: provisional with no backlog row named - a deferred answer with nothing tracking it is a settled one`);
    } else if (!backlogText.includes(row.backlog)) {
      problems.push(`${p.id}: names backlog row "${row.backlog}", which is not in the backlog`);
    }
  }
  if (row.state === "human" && (!row.who || row.who === "-" || !row.when || row.when === "-")) {
    problems.push(`${p.id}: claims a person answered but does not say who or when`);
  }
}

if (!WROTE) {
  console.log(`  ${ROOT === "." ? "This tree" : ROOT} is not a git work tree, so nothing here can tell what the adoption`);
  console.log("  wrote from what the repository already had. `pending` rows are being left alone.");
}

const orphans = rows.filter((r) => !(declared.points || []).some((p) => p.id === r.point));
for (const o of orphans) problems.push(`${o.point}: a row for a point that is not declared - a renamed point leaves its old row behind`);

if (problems.length) fail(problems);

const tally = {};
for (const r of rows) tally[r.state] = (tally[r.state] || 0) + 1;
const summary = Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(", ");
if (tally.pending) {
  console.log(`  ${tally.pending} point(s) pending - this adoption has not written anything they gate.`);
  console.log("  Each stops being legal the moment it does, which is the point of asking first.");
}
if (AS_JSON) console.log(JSON.stringify({ verdict: "PASS", ledger: LEDGER, rows: rows.length, tally }, null, 2));
else console.log(`elicitation-provenance: OK - ${rows.length} point(s) recorded in ${LEDGER} (${summary})`);
