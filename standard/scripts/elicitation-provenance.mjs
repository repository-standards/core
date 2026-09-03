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
//   6. The guard itself landed first. Gate 0, Gate 2 and the version pin must not reach a
//      commit before the elicitation guard does - a fresh adoption that committed one of
//      them first has no guard covering the run that wrote it, which is exactly the failure
//      the guard exists to stop. Ancestry, never a date; see the comment above
//      `guardOrderProblems`.
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

// Ordered deliberately. The point list comes first because the questions can only answer for
// writes made after the questions existed: a repo that adopted the standard a year ago and is
// only now taking this layer has a `.standards-version` from back then, and measuring from it
// would count every file the repo has written since as something the adoption wrote without
// asking. That is red on arrival for every existing adopter, and a guard red on arrival is a
// guard someone deletes.
const LAYER_MARKER = ".claude/elicitation/points.json";
const BASELINE_MARKERS = [LAYER_MARKER, ".standards-version", "standard.manifest.json"];

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
    // The point list is present but has never been committed: this layer is arriving in this
    // very run, so nothing already in history can have been written under it. Only the
    // uncommitted set counts, and looking at the older markers would say otherwise.
    if (marker === LAYER_MARKER && existsSync(at(marker))) break;
  }
  if (baseline) {
    for (const p of (git("show", "--format=", "--name-only", baseline) ?? "").split("\n")) add(p);
    for (const p of (git("log", "--format=", "--name-only", `${baseline}..HEAD`) ?? "").split("\n")) add(p);
  }

  return { has: (rel) => files.has(rel) || dirs.some((d) => rel.startsWith(d)) };
}

const WROTE = adoptionWrote();

// Order: the guard must land before any of the three Gate artifacts it exists to protect -
// Gate 0 (docs/adoption-intake.md), Gate 2 (docs/adoption-assessment.md), the version pin
// (.standards-version). This is the backstop for what `reached()` above cannot see:
// LomondGroup/propertycloud #1199 committed docs/adoption-intake.md a commit before the guard
// ever landed, on a fresh adoption - self-verify was green the whole time, because nothing
// here compared commit order, only content. A human reading the diff caught it.
//
// Detection is ancestry, never a date: the guard's own commit (the same "commit that
// introduced .claude/elicitation/points.json" adoptionWrote() reads, walked the other way -
// instead of "was this written after the guard", "did this reach a commit before it").
//
// Exempted whenever .standards-version already existed the commit before the guard's own
// commit: that means this repo had a prior alignment before this guard ever landed here, so
// old Gate-artifact history predating it is the update-to-latest shape - a repo catching up a
// guard the standard did not carry when it first aligned - not a fresh run that skipped a
// step. This is the same class of false positive .standards-version's bare *existence*
// produces for `reached()` (see the comment above `reached`), avoided the same way: by reading
// what the tree looked like one commit before the guard landed, never whether the file exists
// now.
//
// Also skipped whenever ROOT is a subdirectory (see the ROOT/SUFFIX comment above
// `adoptionWrote`) - this repo's own shipped tree, not an adopter's. There, repo-wide commit
// order is the standard's own feature history: R26 and R27 shipped in `standard/` versions
// before R28 did, which is this project adding the guard after it already had Gate 0 and
// Gate 2, not an adoption that skipped a step. Nothing about that history is what this check
// exists to catch.
const GATE_ARTIFACTS = ["docs/adoption-intake.md", "docs/adoption-assessment.md", ".standards-version"];

function oldestAdd(path) {
  const commits = (git("log", "--diff-filter=A", "--follow", "--format=%H", "--", path) ?? "")
    .trim().split("\n").filter(Boolean);
  return commits.length ? commits[commits.length - 1] : null;
}

function isAncestor(older, newer) {
  if (!older || !newer || older === newer) return false;
  return spawnSync("git", ["-C", ROOT, "merge-base", "--is-ancestor", older, newer]).status === 0;
}

function existedBefore(commit, path) {
  return spawnSync("git", ["-C", ROOT, "show", `${commit}^:${path}`], { encoding: "utf8" }).status === 0;
}

// null = no work tree, or a subdirectory ROOT (this repo's own shipped tree, not an
// adopter's) - back off exactly like adoptionWrote() does. [] = checked, nothing wrong.
function guardOrderProblems() {
  if (!WROTE || ROOT !== ".") return null;
  const guardCommit = oldestAdd(LAYER_MARKER);
  if (!guardCommit) return { commit: null, problems: [] }; // guard not committed yet - nothing to order against
  if (existedBefore(guardCommit, ".standards-version")) return { commit: guardCommit, problems: [], exempt: true };
  const problems = [];
  for (const gate of GATE_ARTIFACTS) {
    const commit = oldestAdd(gate);
    if (commit && isAncestor(commit, guardCommit)) {
      problems.push(
        `${at(gate)} was committed at ${commit.slice(0, 12)}, before the elicitation guard landed at ` +
          `${guardCommit.slice(0, 12)} - a gated artifact reached history before the guard that was ` +
          "supposed to ask about it existed",
      );
    }
  }
  return { commit: guardCommit, problems };
}

const ORDER = guardOrderProblems();

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
// The declared points are a floor. What a repository actually needed asked, and no list
// anticipated, is recorded in its own section - and that section is where the next version of
// the point list comes from: adopt.tracker entered it from one live run. A ledger that quietly
// loses the section makes an adoption that invented five questions read like one that needed
// none, which is the same class of silence as a guard nothing routes to.
const HARVEST = "## Questions this run asked that no point declares";

const rows = [];
const malformed = [];
const ledgerText = readFileSync(LEDGER, "utf8");
for (const line of ledgerText.split("\n")) {
  const t = line.trim();
  // The record is the table above that heading. Below it is the harvest table, which invites
  // exactly the thing that would confuse this parser: a candidate point id in a four-cell row.
  if (t.startsWith(HARVEST)) break;
  if (!t.startsWith("|") || /^\|[\s|:-]+\|$/.test(t)) continue;
  const cells = t.slice(1, -1).split("|").map((c) => c.trim().replace(/^`|`$/g, ""));
  if (!/^[a-z]+\.[a-z-]+$/.test(cells[0])) continue; // header row, or prose in a table
  if (cells.length < 6) { malformed.push(`${cells[0]}: row has ${cells.length} cells, the ledger's table has 6`); continue; }
  rows.push({ point: cells[0], state: cells[1], who: cells[2], when: cells[3], landed: cells[4], backlog: cells[5] });
}

const backlogText = BACKLOGS.map(at).filter(existsSync).map((f) => readFileSync(f, "utf8")).join("\n");
const problems = [...malformed];

// The [NEEDS REVIEW] marker (ADR-057, revised by ADR-058) names a backlog row for every
// artifact a `suggest` or `stub` answer produced. `self-verify` counts the markers; this is
// what proves the row each one names is not made up - the same trust `provisional` rows get
// below, extended to the file rather than the question. Only markdown carries the marker.
// Scaffolding is skipped: the elicitation README ships two illustrative marker blocks of its
// own (naming backlog rows no real repo has), and reading those as live markers would fail
// every adopter who has not touched the file.
const MARKER_BLOCK_RE = /^>\s*\[NEEDS REVIEW\][^\n]*(?:\n>[^\n]*)*/gm;
const BACKLOG_ID_RE = /Backlog:\s*([A-Za-z][\w-]*)\s*\./;
for (const f of FILES) {
  if (!f.endsWith(".md") || scaffolding(f)) continue;
  let raw;
  try { raw = readFileSync(at(f), "utf8"); } catch { continue; }
  for (const block of raw.match(MARKER_BLOCK_RE) || []) {
    const id = BACKLOG_ID_RE.exec(block)?.[1];
    if (!id) problems.push(`${f}: a [NEEDS REVIEW] marker names no backlog row (expected "Backlog: <ID>.")`);
    else if (!backlogText.includes(id)) problems.push(`${f}: [NEEDS REVIEW] names backlog row "${id}", which is not in the backlog`);
  }
}

if (!ledgerText.includes(HARVEST)) {
  problems.push(`${LEDGER}: the "${HARVEST.replace(/^## /, "")}" section is missing - questions the point list did not have are how it grows, and an unrecorded one is indistinguishable from one nobody needed`);
}
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

if (ORDER) {
  if (ORDER.exempt) {
    console.log("  .standards-version already existed before the elicitation guard's own commit - this repo");
    console.log("  had a prior alignment before the guard did, so old Gate-artifact history is not checked.");
  } else if (!ORDER.commit) {
    console.log("  the elicitation guard is not committed yet, so nothing here can yet tell whether a Gate");
    console.log("  artifact reached history before it did - checked again once the guard lands.");
  }
  problems.push(...ORDER.problems);
}

if (problems.length) fail(problems);

const tally = {};
for (const r of rows) tally[r.state] = (tally[r.state] || 0) + 1;
const summary = Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(", ");
if (tally.pending) {
  console.log(`  ${tally.pending} point(s) pending - this adoption has not written anything they gate.`);
  console.log("  Each stops being legal the moment it does, which is the point of asking first.");
}

// Non-fatal: a `provisional` row promises the artifact it produced carries the marker
// (ADR-057/058), but the row itself is just a promise - this reads the files the point
// actually gates and says so when none of them do. Not a failure, because the file may
// answer a later question this point does not gate, or may not have shipped yet; a marker
// is how a person finds the gap later, not a precondition for the row itself.
const unmarked = [];
for (const r of rows) {
  if (r.state !== "provisional") continue;
  const globs = (declared.points || []).find((p) => p.id === r.point)?.gate_globs || [];
  if (!globs.length) continue; // gates nothing - see note 5 above `reached`
  const found = globs.some((g) => {
    const re = rx(g);
    return FILES.some((f) => {
      if (!re.test(f)) return false;
      try { return /^>\s*\[NEEDS REVIEW\]/m.test(readFileSync(at(f), "utf8")); } catch { return false; }
    });
  });
  if (!found) unmarked.push(r.point);
}
if (unmarked.length) {
  console.log(`  ${unmarked.length} provisional point(s) gate a path with no [NEEDS REVIEW] marker found in it: ${unmarked.join(", ")}.`);
  console.log("  Not a failure - the marker is how a person finds this later, not a precondition for the row.");
}

if (AS_JSON) console.log(JSON.stringify({ verdict: "PASS", ledger: LEDGER, rows: rows.length, tally }, null, 2));
else console.log(`elicitation-provenance: OK - ${rows.length} point(s) recorded in ${LEDGER} (${summary})`);
