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
//      tree rather than a flag: the point gates a path that now holds an artifact the
//      adopter created. Something was written where the question belonged, so it was either
//      asked or skipped, and `pending` is false either way.
//
//      The obvious rule - pending fails once `.standards-version` exists - was tried and is
//      wrong. That file is written at align time, before a single question has been put to
//      anyone, so it fails every freshly adopted repo on its first run, and fails the shipped
//      tree's own template where every row is pending because nothing has happened yet. A
//      guard that is red the moment it lands teaches people to disable it.
//
//      Two edges, both stated rather than hidden. A point that gates no path (a rename, a
//      phase boundary) can never be reached here - the static check and human review carry
//      those. And a shipped template FILLED IN PLACE does not trip it either: the manifest
//      carries hashes only for files meant to stay verbatim, so `docs/personas.md` written
//      over is indistinguishable here from `docs/personas.md` untouched. What is caught is
//      the artifact that did not ship at all - a decision record, a spec, a dossier entry, a
//      run record - which is most of what an adoption actually produces. A guard claiming
//      coverage it does not have is worse than one that names its edge.
//
// A repo with no ledger at all fails rather than passes. Absence of the record is the
// state this whole mechanism exists to stop being invisible.
//
//   node scripts/elicitation-provenance.mjs [--ledger <path>] [--json]
//
// Ships to adopting repos. Node built-ins only.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

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

// Deliberately loose, in the direction of NOT tripping. Directory entries cover what is under
// them - the manifest lists `docs/discovery`, not each template inside it - and a manifest path
// is matched at any depth, because the tree that ships and the tree an adopter unpacks do not
// agree on every prefix (`backlog.md` here lives at `docs/backlog.md`). Erring the other way
// would report the standard's own templates as adopter work, which is a false accusation, and
// a guard that cries wolf gets switched off long before it catches anything real.
const SHIPPED_LIST = [...SHIPPED.paths];
const listed = (rel) =>
  SHIPPED.paths.has(rel) ||
  SHIPPED_LIST.some((p) => rel.endsWith(`/${p}`) || rel.startsWith(`${p}/`) || rel.includes(`/${p}/`));

const template = (rel) => {
  const want = SHIPPED.hashes.get(rel);
  if (want) {
    try { return createHash("sha256").update(readFileSync(at(rel))).digest("hex") === want; } catch { return false; }
  }
  return listed(rel);
};

// Reached: something this point gates exists and is not the template that shipped there.
function reached(point) {
  const globs = point.gate_globs || [];
  if (!globs.length) return null; // gates nothing - see note 5
  for (const g of globs) {
    const re = rx(g);
    for (const f of FILES) if (re.test(f) && !template(f)) return f;
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
      problems.push(`${p.id}: still pending, but ${at(evidence)} exists - an artifact this point gates was written, so the question was either asked or skipped`);
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

const orphans = rows.filter((r) => !(declared.points || []).some((p) => p.id === r.point));
for (const o of orphans) problems.push(`${o.point}: a row for a point that is not declared - a renamed point leaves its old row behind`);

if (problems.length) fail(problems);

const tally = {};
for (const r of rows) tally[r.state] = (tally[r.state] || 0) + 1;
const summary = Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(", ");
if (tally.pending) {
  console.log(`  ${tally.pending} point(s) pending - nothing they gate has been written yet.`);
  console.log("  Each stops being legal the moment its artifact exists, which is the point of asking first.");
}
if (AS_JSON) console.log(JSON.stringify({ verdict: "PASS", ledger: LEDGER, rows: rows.length, tally }, null, 2));
else console.log(`elicitation-provenance: OK - ${rows.length} point(s) recorded in ${LEDGER} (${summary})`);
