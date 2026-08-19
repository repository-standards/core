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

// The record is the table; the harvest section sits below it and is where the parser stops.
// Fixtures build the same order the shipped ledger has, or they would be testing a shape no
// repository carries.
const HARVEST = "\n## Questions this run asked that no point declares\n";
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
  if (adopted) commit({ ".standards-version": "0.9.21\n", ...adopted }, "adopt repository-standards");

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
  HEAD + DECLARED.map((p) => row(p.id, override[p.id]?.[0] ?? "pending", ...(override[p.id]?.slice(1) ?? []))).join("") + HARVEST;

const TEMPLATE = "# Personas\n\n<who this repo is for>\n";
// backlog.md is gated twice - by who owns the rows, and by whether tracked work lives here
// at all - so a fixture that writes one has to have answered both.
const ANSWERED = {
  "adopt.backlog": ["human", "owner", "2026-08-19", "backlog.md"],
  "adopt.tracker": ["human", "owner", "2026-08-19", "backlog.md"],
};

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
    { ledger: HEAD + DECLARED.map((x) => (x.id === "adopt.layout" ? row(x.id, "pending") : row(x.id, "human", "owner", "2026-08-19", "docs/x.md"))).join("") + HARVEST,
      files: { "docs/decision-records/ADR-001-thing.md": "# ADR-001\n" } }, PASS],

  // The brownfield pair. A repository that already had decision records is not a repository
  // that answered a question about them, and reading it that way made this check red on the
  // first run of every repo worth adopting.
  ["a record the repository wrote before the adoption is not evidence anyone was asked",
    { ledger: baseline(), preexisting: { "docs/decision-records/ADR-001-thing.md": "# ADR-001\n" } }, PASS],
  ["the same record, once the adoption edits it, is",
    { ledger: baseline(), preexisting: { "docs/decision-records/ADR-001-thing.md": "# ADR-001\n" },
      files: { "docs/decision-records/ADR-001-thing.md": "# ADR-001\n\n## Revisit when\n" } }, FAIL],
  // points.json rides in the adoption commit because that is where a real adoption puts it -
  // the layer lands before anything it gates. Committing the adoption without it would be
  // describing an update instead, which is the case below and behaves differently on purpose.
  ["a record the adoption committed counts too, not only one it left uncommitted",
    { ledger: baseline(), preexisting: { "README.md": "# app\n" },
      adopted: { "docs/decision-records/ADR-002-new.md": "# ADR-002\n", ".claude/elicitation/points.json": readFileSync(POINTS, "utf8") } }, FAIL],
  // The updater's case, and the reason the boundary is the point list rather than
  // `.standards-version`. This repo adopted the standard long ago and is only now taking the
  // elicitation layer: it has decision records, personas and a backlog, none of which any
  // question could have preceded. Measuring from the older marker would count all of it and
  // hand every existing adopter a ledger that is red before they have done anything - which
  // is how a guard gets deleted rather than followed.
  ["a repo taking this layer years after it adopted is not judged for what it wrote before",
    { ledger: baseline(),
      preexisting: { "README.md": "# app\n" },
      adopted: { "docs/decision-records/ADR-002-old.md": "# ADR-002\n", "docs/personas.md": "# Personas\n\nBogdan.\n" } }, PASS],
  ["outside a git work tree the pending rule stands down rather than passing quietly",
    { ledger: baseline(), files: { "docs/decision-records/ADR-001-thing.md": "# ADR-001\n" }, git: false },
    PASS, "not a git work tree"],

  ["no ledger at all fails - absence is the state this exists to make visible", { ledger: null }, FAIL],
  // Dropping the section is how the standard would stop learning: the run still passes every
  // point, and the questions it had to invent leave no trace at all.
  ["a ledger with no section for the questions the point list did not have fails",
    { ledger: baseline().replace(HARVEST, "\n") }, FAIL],
  ["a required point with no row fails", { ledger: HEAD + row("adopt.intent", "pending") + HARVEST }, FAIL],
  ["a state the point forbids fails", { ledger: baseline({ "adopt.personas": ["inferred"] }) }, FAIL],
  ["provisional with no backlog row named fails", { ledger: baseline({ "adopt.personas": ["provisional"] }) }, FAIL],
  ["provisional naming a backlog row that does not exist fails",
    { ledger: baseline({ ...ANSWERED, "adopt.personas": ["provisional", "-", "-", "docs/personas.md", "BL-77"] }), backlog: "| BL-12 | something else |" }, FAIL],
  ["provisional naming a row that is really there passes",
    { ledger: baseline({ ...ANSWERED, "adopt.personas": ["provisional", "-", "-", "docs/personas.md", "BL-77"] }), backlog: "| BL-77 | verify the personas with the owner |" }, PASS],
  ["human without who or when fails", { ledger: baseline({ "adopt.personas": ["human"] }) }, FAIL],
  ["human naming who and when passes", { ledger: baseline({ "adopt.personas": ["human", "owner", "2026-08-19", "docs/personas.md"] }) }, PASS],
  ["a row for a point nobody declares fails rather than being ignored", { ledger: baseline().replace(HARVEST, row("adopt.renamed-away", "human", "owner", "2026-08-19") + HARVEST) }, FAIL],
  ["a row with the wrong number of cells is reported, not skipped", { ledger: baseline().replace(HARVEST, "| `adopt.gone` | human | owner |\n" + HARVEST) }, FAIL],
  // The harvest table names candidate ids in a four-cell row - which is what the rule above
  // rejects. The record is the table before that heading, and nothing after it is a row.
  ["a candidate id written into the harvest table is not read as a malformed record row",
    { ledger: baseline() + "\n| Question asked | Which answer led | What was chosen | Worth declaring? |\n|---|---|---|---|\n| `adopt.tracker` | fold it in | fold it in | yes |\n" }, PASS],
  ["a fully answered ledger passes on a repo that built things",
    { ledger: HEAD + DECLARED.map((p) => row(p.id, "human", "owner", "2026-08-19", "docs/x.md")).join("") + HARVEST, files: { "docs/decision-records/ADR-001-thing.md": "# ADR-001\n" } }, PASS],
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
