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
const MAP = { widgets: ["src/**", { glob: "data/*.json", couples: "shape" }] };

write("specs/capability-map.json", json(MAP));
write("specs/widgets/spec.md", "# Widgets\n");
write("src/index.js", "export const widget = 1;\n");
write("data/rules.json", rules());
git("init", "-q", "-b", "main");
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
