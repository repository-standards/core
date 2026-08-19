#!/usr/bin/env node
// elicitation-provenance-test - the ledger check, run against whole throwaway repos.
//
// Each case builds a repo in a temp dir and runs the shipped script inside it, because what
// it keys off - the ledger, the backlog, the manifest and which artifacts exist - are facts
// about a working tree, not arguments. Testing it with stubbed inputs would prove the parser
// works and leave the part that decides untested.
//
// The pair that matters most is the pending rule, asserted in both directions: an artifact
// the adoption wrote stops `pending` from being true, and a template that merely shipped
// there does not. Only the first is a finding; the second is every freshly adopted repo, and
// a guard red on arrival is a guard someone deletes.
//
// Which is why each repo here has real git history rather than a flat directory. The rule
// turns on who wrote a file and when, so a case built without history could only assert that
// the file exists - and "exists" was the wrong rule twice: it fails every brownfield repo,
// whose decision records predate the standard by years.
//
// Usage: node tools/elicitation-provenance-test.mjs
// Zone 1 tooling - never shipped.

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";

const SCRIPT = resolve("standard/scripts/elicitation-provenance.mjs");
const POINTS = resolve("standard/.claude/elicitation/points.json");

const HEAD = "| Point | State | Answered by | When | Landed in | Backlog row |\n|---|---|---|---|---|---|\n";
const row = (id, state, who = "-", when = "-", landed = "-", backlog = "-") =>
  `| \`${id}\` | ${state} | ${who} | ${when} | ${landed} | ${backlog} |\n`;

const DECLARED = JSON.parse(readFileSync(POINTS, "utf8")).points;

// Three ages of file, because the check has to tell them apart:
//   preexisting - committed before the standard arrived. The repository's own work.
//   adopted     - committed by the adoption, alongside `.standards-version`.
//   files       - written and not yet committed. The ordinary case: the gate runs mid-run.
//
// A repo is only what the case needs: no backlog file unless the case is about one, no
// artifacts unless the case is about them. Anything written unconditionally would trip the
// pending rule in every other case and hide what each one is actually asserting.
function repo({ ledger, backlog = null, files = {}, manifest = null, preexisting = null, adopted = null, git = true }) {
  const dir = mkdtempSync(join(tmpdir(), "prov-"));
  const write = (rel, body) => {
    mkdirSync(join(dir, dirname(rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  };
  // -c rather than `git config`, so a developer's global hooks, signing key or default
  // branch name cannot decide whether these cases pass.
  const g = (...args) =>
    spawnSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args], { encoding: "utf8" });
  if (git) g("init", "-q");
  const commit = (tree, message) => {
    for (const [rel, body] of Object.entries(tree)) write(rel, body);
    g("add", "-A");
    g("commit", "-q", "--no-verify", "-m", message);
  };

  if (preexisting) commit(preexisting, "the repository's own work, years before any of this");
  if (adopted) commit({ ".standards-version": "1.1.21\n", ...adopted }, "adopt repository-standards");

  mkdirSync(join(dir, ".claude/elicitation"), { recursive: true });
  mkdirSync(join(dir, "docs"), { recursive: true });
  copyFileSync(POINTS, join(dir, ".claude/elicitation/points.json"));
  if (ledger !== null) writeFileSync(join(dir, "docs/adoption-provenance.md"), ledger);
  if (backlog !== null) writeFileSync(join(dir, "backlog.md"), backlog);
  for (const [rel, body] of Object.entries(files)) write(rel, body);
  if (manifest) writeFileSync(join(dir, "standard.manifest.json"), JSON.stringify(manifest, null, 2));
  return dir;
}

const sha = (body) => createHash("sha256").update(Buffer.from(body)).digest("hex");
const baseline = (override = {}) =>
  HEAD + DECLARED.map((p) => row(p.id, override[p.id]?.[0] ?? "pending", ...(override[p.id]?.slice(1) ?? []))).join("");

const TEMPLATE = "# Personas\n\n<who this repo is for>\n";
const ANSWERED = { "adopt.backlog": ["human", "owner", "2026-08-19", "backlog.md"] };

const PASS = "PASS", FAIL = "FAIL";
const CASES = [
  ["a fresh scaffold is all pending, and nothing has been written over", { ledger: baseline() }, PASS],

  // The pending rule, both directions. Without the second case the first one is satisfied by
  // a check that simply fails whenever a gated file exists, which is every adopted repo.
  ["a point is not pending once an artifact it gates exists",
    { ledger: baseline(), files: { "docs/decision-records/ADR-001-thing.md": "# ADR-001\n" } }, FAIL],
  ["a shipped template sitting where it shipped is not somebody's answer",
    { ledger: baseline(), files: { "docs/personas.md": TEMPLATE }, manifest: { files: [{ path: "docs/personas.md", sha256: sha(TEMPLATE) }] } }, PASS],
  ["the same template, written into, is",
    { ledger: baseline(), files: { "docs/personas.md": "# Personas\n\nBusy owner Bogdan.\n" }, manifest: { files: [{ path: "docs/personas.md", sha256: sha(TEMPLATE) }] } }, FAIL],
  // adopt.layout gates a rename, not a file. Nothing here can reach it, and the check must
  // say so by passing rather than by inventing a trigger it cannot observe.
  ["a point that gates no path stays pending even in a repo that has built things",
    { ledger: HEAD + DECLARED.map((x) => (x.id === "adopt.layout" ? row(x.id, "pending") : row(x.id, "human", "owner", "2026-08-19", "docs/x.md"))).join(""),
      files: { "docs/decision-records/ADR-001-thing.md": "# ADR-001\n" } }, PASS],

  // The brownfield pair. A repository that already had decision records is not a repository
  // that answered a question about them, and reading it that way made this check red on the
  // first run of every repo worth adopting.
  ["a record the repository wrote before the adoption is not evidence anyone was asked",
    { ledger: baseline(), preexisting: { "docs/decision-records/ADR-001-thing.md": "# ADR-001\n" } }, PASS],
  ["the same record, once the adoption edits it, is",
    { ledger: baseline(), preexisting: { "docs/decision-records/ADR-001-thing.md": "# ADR-001\n" },
      files: { "docs/decision-records/ADR-001-thing.md": "# ADR-001\n\n## Revisit when\n" } }, FAIL],
  ["a record the adoption committed counts too, not only one it left uncommitted",
    { ledger: baseline(), preexisting: { "README.md": "# app\n" },
      adopted: { "docs/decision-records/ADR-002-new.md": "# ADR-002\n" } }, FAIL],
  ["outside a git work tree the pending rule stands down rather than passing quietly",
    { ledger: baseline(), files: { "docs/decision-records/ADR-001-thing.md": "# ADR-001\n" }, git: false },
    PASS, "not a git work tree"],

  ["no ledger at all fails - absence is the state this exists to make visible", { ledger: null }, FAIL],
  ["a required point with no row fails", { ledger: HEAD + row("adopt.intent", "pending") }, FAIL],
  ["a state the point forbids fails", { ledger: baseline({ "adopt.personas": ["inferred"] }) }, FAIL],
  ["provisional with no backlog row named fails", { ledger: baseline({ "adopt.personas": ["provisional"] }) }, FAIL],
  ["provisional naming a backlog row that does not exist fails",
    { ledger: baseline({ ...ANSWERED, "adopt.personas": ["provisional", "-", "-", "docs/personas.md", "BL-77"] }), backlog: "| BL-12 | something else |" }, FAIL],
  ["provisional naming a row that is really there passes",
    { ledger: baseline({ ...ANSWERED, "adopt.personas": ["provisional", "-", "-", "docs/personas.md", "BL-77"] }), backlog: "| BL-77 | verify the personas with the owner |" }, PASS],
  ["human without who or when fails", { ledger: baseline({ "adopt.personas": ["human"] }) }, FAIL],
  ["human naming who and when passes", { ledger: baseline({ "adopt.personas": ["human", "owner", "2026-08-19", "docs/personas.md"] }) }, PASS],
  ["a row for a point nobody declares fails rather than being ignored", { ledger: baseline() + row("adopt.renamed-away", "human", "owner", "2026-08-19") }, FAIL],
  ["a row with the wrong number of cells is reported, not skipped", { ledger: baseline() + "| `adopt.gone` | human | owner |\n" }, FAIL],
  ["a fully answered ledger passes on a repo that built things",
    { ledger: HEAD + DECLARED.map((p) => row(p.id, "human", "owner", "2026-08-19", "docs/x.md")).join(""), files: { "docs/decision-records/ADR-001-thing.md": "# ADR-001\n" } }, PASS],
];

let bad = 0;
for (const [name, spec, expected, wants] of CASES) {
  const dir = repo(spec);
  const run = spawnSync("node", [SCRIPT], { cwd: dir, encoding: "utf8" });
  const got = run.status === 0 ? PASS : FAIL;
  // A case that stands down has to be seen standing down. Passing is what a working check
  // and a check that gave up look like from the exit code alone.
  const ok = got === expected && (!wants || (run.stdout + run.stderr).includes(wants));
  if (!ok) bad++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${name}${ok ? "" : `\n          got ${got}: ${(run.stdout + run.stderr).trim().split("\n").slice(0, 3).join(" / ")}`}`);
  rmSync(dir, { recursive: true, force: true });
}

console.log(bad ? `\nelicitation-provenance-test: FAIL - ${bad}/${CASES.length}` : `\nelicitation-provenance-test: OK - ${CASES.length} cases`);
process.exit(bad ? 1 : 0);
