#!/usr/bin/env node
// spec-guard-test - drive the shipped coupling guard through real diffs in a
// throwaway git repo.
//
// The guard can be wrong in two directions and only one of them is loud. A false
// positive is visible: it fires, someone argues with it. A false negative is
// silent - a `couples: "shape"` entry that stops noticing a schema change looks
// exactly like a green run, and the capability quietly loses its gate. So every
// case asserts an exit code, and most of them assert the guard still fires.
//
// Usage: node tools/spec-guard-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const GUARD = join(process.cwd(), "standard/scripts/spec-guard.mjs");
const repo = mkdtempSync(join(tmpdir(), "spec-guard-test-"));
const IDENT = ["-c", "user.name=spec-guard-test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false"];

const git = (...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const write = (rel, body) => {
  mkdirSync(dirname(join(repo, rel)), { recursive: true });
  writeFileSync(join(repo, rel), body);
};
const json = (o) => `${JSON.stringify(o, null, 2)}\n`;
const rules = (o = {}) => json({ version: 1, rules: [{ id: "a", on: true }], ...o });
// `payments` carries the two glob shapes from the shipped example - a capability whose
// code sits at the top level, and a file directly inside `shared/`. Both were dead:
// `**` was translated without consuming the slash beside it, so they only ever matched
// a path with an extra directory in the middle, and the money path went unguarded.
const MAP = {
  widgets: ["src/**", { glob: "data/*.json", couples: "shape" }],
  payments: ["**/payment/**", "shared/**/payment*"],
};

write("specs/capability-map.json", json(MAP));
write("specs/widgets/spec.md", "# Widgets\n");
write("specs/payments/spec.md", "# Payments\n");
write("src/index.js", "export const widget = 1;\n");
write("data/rules.json", rules());
write("payment/index.ts", "export const capture = 1;\n");
write("payment/gateway/capture.ts", "export const gateway = 1;\n");
write("shared/payment.ts", "export const money = 1;\n");
write("shared/paymob.ts", "export const unrelated = 1;\n");
// Tracked and claimed by nobody - what the unclaimed-code check is for.
write("tooling/build.mjs", "export const build = 1;\n");
git("init", "-q", "-b", "main");
// Most developers ignore node_modules globally, and both `git add` and
// `git ls-files --others --exclude-standard` honour that - which would hide the dependency
// tree the cases below depend on, on their machine but not on CI. Point the excludes file at
// an empty file, inside .git so it is not itself a tracked path the audit has to explain.
write(".git/no-excludes", "");
git("config", "core.excludesFile", join(repo, ".git/no-excludes"));
git("add", "-A");
git(...IDENT, "commit", "-qm", "seed");

const run = (...args) => {
  try {
    return { code: 0, out: execFileSync("node", [GUARD, ...args], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
};

// fires = the guard must block (exit 1 under --block); passes = it must not.
const CASES = [
  { name: "a data addition does not couple", fires: false, says: "changed as data", act: () => write("data/rules.json", json({ version: 1, rules: [{ id: "a", on: true }, { id: "b", on: false }] })) },
  { name: "a value edit does not couple", fires: false, act: () => write("data/rules.json", json({ version: 1, rules: [{ id: "a", on: false }] })) },
  { name: "a new key inside an entry couples", fires: true, act: () => write("data/rules.json", json({ version: 1, rules: [{ id: "a", on: true, mode: "x" }] })) },
  { name: "a dropped key couples", fires: true, act: () => write("data/rules.json", json({ version: 1, rules: [{ id: "a" }] })) },
  { name: "a new top-level key couples", fires: true, act: () => write("data/rules.json", rules({ mode: "x" })) },
  { name: "a file with no earlier version couples", fires: true, act: () => write("data/extra.json", rules()), undo: () => rmSync(join(repo, "data/extra.json")) },
  { name: "unparseable json couples", fires: true, act: () => write("data/rules.json", "{") },
  { name: "code without its spec fires", fires: true, act: () => write("src/index.js", "export const widget = 2;\n") },
  { name: "code with its spec passes", fires: false, act: () => { write("src/index.js", "export const widget = 3;\n"); write("specs/widgets/spec.md", "# Widgets\n\nA widget is 3.\n"); } },
  { name: "a staged data addition does not couple", fires: false, args: ["--staged"], says: "changed as data", act: () => { write("data/rules.json", json({ version: 1, rules: [{ id: "a", on: true }, { id: "c", on: true }] })); git("add", "-A"); }, undo: () => git("reset", "-q") },
  { name: "an unusable map entry stops the guard", fires: true, says: "unusable entry", act: () => write("specs/capability-map.json", json({ widgets: [{ couples: "shape" }] })) },

  // The glob shapes the shipped example leads with. Before the shared translator each
  // of these passed: `spec-guard: OK` on a change to a money path with no spec edit.
  { name: "a capability directory at the top level matches `**/payment/**`", fires: true, act: () => write("payment/index.ts", "export const capture = 2;\n") },
  { name: "a file nested deeper under the same glob matches", fires: true, act: () => write("payment/gateway/capture.ts", "export const gateway = 2;\n") },
  { name: "`shared/**/payment*` matches a file directly inside shared", fires: true, act: () => write("shared/payment.ts", "export const money = 2;\n") },
  { name: "a neighbour that only starts like the glob does not match", fires: false, act: () => write("shared/paymob.ts", "export const unrelated = 2;\n") },

  // --audit: the map is what makes the guard mean anything, and it can rot in four ways.
  {
    name: "--audit reports a glob that matches no file",
    fires: true,
    args: ["--audit"],
    says: "watching nothing",
    act: () => write("specs/capability-map.json", json({ ...MAP, widgets: ["src/**", "moved-away/**"] })),
  },
  {
    name: "--audit reports a map entry whose capability has no spec",
    fires: true,
    args: ["--audit"],
    says: "no spec",
    act: () => write("specs/capability-map.json", json({ ...MAP, checkout: ["src/**"] })),
  },
  {
    name: "--audit says so when the unclaimed-code check is off",
    fires: false,
    args: ["--audit"],
    says: "unclaimed-code check is OFF",
    act: () => {},
  },
  {
    name: "--audit reports code that belongs to no capability once $unclaimed is declared",
    fires: true,
    args: ["--audit"],
    says: "tooling/build.mjs",
    act: () => write("specs/capability-map.json", json({ ...MAP, $unclaimed: [] })),
  },
  {
    name: "--audit passes when that code is declared unclaimed",
    fires: false,
    args: ["--audit"],
    says: "each claimed by a capability or declared unclaimed",
    act: () => write("specs/capability-map.json", json({ ...MAP, $unclaimed: ["tooling/**", "shared/paymob.ts"] })),
  },
  {
    name: "$unclaimed is metadata, not a capability whose spec can never be touched",
    fires: false,
    act: () => {
      write("specs/capability-map.json", json({ ...MAP, $unclaimed: ["tooling/**", "shared/paymob.ts"] }));
      write("tooling/build.mjs", "export const build = 2;\n");
    },
  },
  {
    name: "an unknown $ key is refused instead of silently exempting nothing",
    fires: true,
    says: "unknown metadata key",
    act: () => write("specs/capability-map.json", json({ ...MAP, $unclaimd: ["tooling/**"] })),
  },
  // A committed (or simply unignored) dependency tree is not this repo's code. The audit's
  // filesystem walk always skipped it; every list that came from git did not, so a repo with
  // no .gitignore had `**/payment/**` matching `node_modules/<pkg>/payment/…` and a
  // dependency bump blocked the PR for a capability nobody touched.
  {
    name: "a dependency tree does not trip a capability's glob",
    fires: false,
    says: "committed dependency tree",
    act: () => write("node_modules/some-pkg/payment/index.js", "module.exports = 1;\n"),
    undo: () => rmSync(join(repo, "node_modules"), { recursive: true, force: true }),
  },
  {
    // The other direction: only a whole path segment is a dependency tree. A real source
    // file whose name merely begins the same way is this repo's code and still couples.
    name: "a path that only starts like a dependency directory still couples",
    fires: true,
    act: () => write("payment/node_modules_shim.ts", "export const shim = 1;\n"),
    undo: () => rmSync(join(repo, "payment/node_modules_shim.ts"), { force: true }),
  },
  {
    name: "--audit does not read a dependency tree as code nobody claims",
    fires: false,
    args: ["--audit"],
    says: "each claimed by a capability or declared unclaimed",
    act: () => {
      write("specs/capability-map.json", json({ ...MAP, $unclaimed: ["tooling/**", "shared/paymob.ts"] }));
      write("node_modules/some-pkg/index.js", "module.exports = 1;\n");
      git("add", "-A");
    },
    undo: () => {
      git("reset", "-q");
      rmSync(join(repo, "node_modules"), { recursive: true, force: true });
    },
  },
  {
    // The spec template tells a retiring capability to keep its map entry: the code is
    // gone, the spec stays as the record, and dropping the entry would make the spec
    // read as an orphan instead. Its globs match nothing by design.
    name: "--audit leaves a retired capability's now-empty globs alone",
    fires: false,
    args: ["--audit"],
    says: "1 retired",
    act: () => {
      write("specs/capability-map.json", json({ ...MAP, legacy: ["legacy/**"] }));
      write("specs/legacy/spec.md", "# Legacy\n\n**Status:** retired\n");
      git("add", "-A");
    },
    undo: () => {
      git("reset", "-q");
      rmSync(join(repo, "specs/legacy"), { recursive: true, force: true });
    },
  },
];

let failures = 0;
for (const c of CASES) {
  c.act();
  const { code, out } = run(...(c.args ?? []), "--block");
  const want = c.fires ? 1 : 0;
  if (code !== want) {
    failures++;
    console.log(`  FAIL  ${c.name} - expected exit ${want}, got ${code}\n${out.replace(/^/gm, "        ")}`);
  } else if (c.says && !out.includes(c.says)) {
    failures++;
    console.log(`  FAIL  ${c.name} - exit ${code} is right but the output never says "${c.says}"`);
  } else {
    console.log(`  ok    ${c.name}`);
  }
  c.undo?.();
  git("checkout", "--", ".");
}

rmSync(repo, { recursive: true, force: true });

if (failures) {
  console.log(`\nspec-guard-test: FAIL - ${failures} of ${CASES.length} cases`);
  process.exit(1);
}
console.log(`\nspec-guard-test: OK - ${CASES.length} cases, the guard fires where it must`);
