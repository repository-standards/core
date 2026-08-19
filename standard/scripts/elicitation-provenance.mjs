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
//   5. `pending` is legal while the repo has no `.standards-version`, and fails once it has
//      one. That file is the repo saying it is adopted; a required point still pending after
//      it exists is an adoption that stopped halfway and closed the door behind itself. No
//      flag decides this - a flag nobody remembers to pass is the same as no check.
//
// A repo with no ledger at all fails rather than passes. Absence of the record is the
// state this whole mechanism exists to stop being invisible.
//
//   node scripts/elicitation-provenance.mjs [--ledger <path>] [--json]
//
// Ships to adopting repos. Node built-ins only.

import { readFileSync, existsSync } from "node:fs";

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const POINT_ROOTS = ["standard/.claude/elicitation/points.json", ".claude/elicitation/points.json"];
const LEDGER = arg("--ledger", ["docs/adoption-provenance.md", "standard/docs/adoption-provenance.md"].find(existsSync) ?? "docs/adoption-provenance.md");
const BACKLOGS = ["backlog.md", "docs/backlog.md", "standard/docs/backlog.md"];
const ADOPTED = existsSync(".standards-version");
const AS_JSON = process.argv.includes("--json");

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

const backlogText = BACKLOGS.filter(existsSync).map((f) => readFileSync(f, "utf8")).join("\n");
const problems = [...malformed];
const byPoint = new Map(rows.map((r) => [r.point, r]));

for (const p of declared.points || []) {
  const row = byPoint.get(p.id);
  if (!row) {
    if (p.required) problems.push(`${p.id}: no row in ${LEDGER} - unrecorded, which reads the same as answered`);
    continue;
  }
  if (row.state === "pending") {
    if (p.required && ADOPTED) {
      problems.push(`${p.id}: still pending, but .standards-version says this repo is adopted - the run stopped before reaching it`);
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
if (!ADOPTED && tally.pending) {
  console.log(`  ${tally.pending} point(s) pending - legal here because there is no .standards-version yet.`);
  console.log("  Writing that file is the repo claiming to be adopted, and these stop being legal then.");
}
if (AS_JSON) console.log(JSON.stringify({ verdict: "PASS", ledger: LEDGER, rows: rows.length, tally }, null, 2));
else console.log(`elicitation-provenance: OK - ${rows.length} point(s) recorded in ${LEDGER} (${summary})`);
