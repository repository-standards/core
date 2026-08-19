#!/usr/bin/env node
// elicitation-provenance-test - the ledger check, run against whole throwaway repos.
//
// Each case builds a repo in a temp dir and runs the shipped script inside it, because the
// three things it keys off - the ledger, the backlog, and whether .standards-version
// exists - are facts about a working tree, not arguments. Testing it with stubbed inputs
// would prove the parser works and leave the part that decides untested.
//
// Usage: node tools/elicitation-provenance-test.mjs
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const SCRIPT = resolve("standard/scripts/elicitation-provenance.mjs");
const POINTS = resolve("standard/.claude/elicitation/points.json");

const HEAD = "| Point | State | Answered by | When | Landed in | Backlog row |\n|---|---|---|---|---|---|\n";
const row = (id, state, who = "-", when = "-", landed = "-", backlog = "-") =>
  `| \`${id}\` | ${state} | ${who} | ${when} | ${landed} | ${backlog} |\n`;

// Every required point, so a case only fails for the reason it is testing.
const ALL_PENDING = JSON.parse(
  spawnSync("node", ["-e", `process.stdout.write(require("fs").readFileSync(${JSON.stringify(POINTS)}, "utf8"))`], { encoding: "utf8" }).stdout,
).points;

function repo({ ledger, backlog = "", adopted = false }) {
  const dir = mkdtempSync(join(tmpdir(), "prov-"));
  mkdirSync(join(dir, ".claude/elicitation"), { recursive: true });
  mkdirSync(join(dir, "docs"), { recursive: true });
  copyFileSync(POINTS, join(dir, ".claude/elicitation/points.json"));
  if (ledger !== null) writeFileSync(join(dir, "docs/adoption-provenance.md"), ledger);
  writeFileSync(join(dir, "backlog.md"), backlog);
  if (adopted) writeFileSync(join(dir, ".standards-version"), "1.1.16\n");
  return dir;
}

const baseline = (override = {}) =>
  HEAD + ALL_PENDING.map((p) => row(p.id, override[p.id]?.[0] ?? "pending", ...(override[p.id]?.slice(1) ?? []))).join("");

const PASS = "PASS", FAIL = "FAIL";
const CASES = [
  ["a fresh scaffold is all pending, and that is legal before adoption", { ledger: baseline() }, PASS],
  ["the same ledger fails once the repo claims to be adopted", { ledger: baseline(), adopted: true }, FAIL],
  ["no ledger at all fails - absence is the state this exists to make visible", { ledger: null }, FAIL],
  ["a required point with no row fails", { ledger: HEAD + row("adopt.intent", "pending") }, FAIL],
  ["a state the point forbids fails", { ledger: baseline({ "adopt.personas": ["inferred"] }) }, FAIL],
  ["provisional with no backlog row named fails", { ledger: baseline({ "adopt.personas": ["provisional"] }) }, FAIL],
  ["provisional naming a backlog row that does not exist fails", { ledger: baseline({ "adopt.personas": ["provisional", "-", "-", "docs/personas.md", "BL-77"] }), backlog: "| BL-12 | something else |" }, FAIL],
  ["provisional naming a row that is really there passes", { ledger: baseline({ "adopt.personas": ["provisional", "-", "-", "docs/personas.md", "BL-77"] }), backlog: "| BL-77 | verify the personas with the owner |" }, PASS],
  ["human without who or when fails", { ledger: baseline({ "adopt.personas": ["human"] }) }, FAIL],
  ["human naming who and when passes", { ledger: baseline({ "adopt.personas": ["human", "owner", "2026-08-19", "docs/personas.md"] }) }, PASS],
  ["a row for a point nobody declares fails rather than being ignored", { ledger: baseline() + row("adopt.renamed-away", "human", "owner", "2026-08-19") }, FAIL],
  ["a row with the wrong number of cells is reported, not skipped", { ledger: baseline() + "| `adopt.gone` | human | owner |\n" }, FAIL],
  ["a fully answered ledger passes on an adopted repo", { ledger: HEAD + ALL_PENDING.map((p) => row(p.id, "human", "owner", "2026-08-19", "docs/x.md")).join(""), adopted: true }, PASS],
];

let bad = 0;
for (const [name, spec, expected] of CASES) {
  const dir = repo(spec);
  const run = spawnSync("node", [SCRIPT], { cwd: dir, encoding: "utf8" });
  const got = run.status === 0 ? PASS : FAIL;
  const ok = got === expected;
  if (!ok) bad++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${name}${ok ? "" : `\n          got ${got}: ${(run.stdout + run.stderr).trim().split("\n").slice(0, 3).join(" / ")}`}`);
  rmSync(dir, { recursive: true, force: true });
}

console.log(bad ? `\nelicitation-provenance-test: FAIL - ${bad}/${CASES.length}` : `\nelicitation-provenance-test: OK - ${CASES.length} cases`);
process.exit(bad ? 1 : 0);
