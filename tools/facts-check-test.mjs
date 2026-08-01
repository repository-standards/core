#!/usr/bin/env node
// facts-check-test - drive the derived-facts check over fixtures.
//
// The failure that matters here is not a wrong number, it is a claim that stops
// matching: a surface gets reworded, the pattern finds nothing, and a check that
// treated that as "nothing to disagree with" would go quiet exactly when the
// sentence it guards became unguarded. That case is the reason this file exists.
//
// Usage: node tools/facts-check-test.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const CHECK = join(process.cwd(), "standard/scripts/facts-check.mjs");

const FACTS = [
  {
    id: "skills",
    what: "how many skills ship",
    home: { count: "tree/skills/*/SKILL.md" },
    claims: [{ file: "README.md", pattern: "the (\\d+) shipped skills" }],
  },
  {
    id: "slug",
    what: "where the tree is degit'd from",
    home: { match: { file: "README.md", pattern: "npx degit (\\S+)" } },
    claims: [{ file: "docs/adopt.md", pattern: "npx degit (\\S+)" }],
  },
];

const BASE = {
  "tree/skills/one/SKILL.md": "# one\n",
  "tree/skills/two/SKILL.md": "# two\n",
  "README.md": "the 2 shipped skills\n\nnpx degit owner/repo\n",
  "docs/adopt.md": "run npx degit owner/repo to start\n",
};

const run = (dir, args = ["--facts", "facts.json"]) => {
  try {
    return { code: 0, out: execFileSync("node", [CHECK, ...args], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
};

const CASES = [
  { name: "every restatement agreeing passes", fails: false, says: "every restatement agrees", files: {} },
  { name: "a stale count fails", fails: true, says: 'says "3", the source says "2"', files: { "README.md": "the 3 shipped skills\n\nnpx degit owner/repo\n" } },
  { name: "a new file under the glob moves the source", fails: true, says: 'the source says "3"', files: { "tree/skills/three/SKILL.md": "# three\n" } },
  { name: "a reworded surface fails instead of going quiet", fails: true, says: "matches nothing", files: { "docs/adopt.md": "clone it from GitHub to start\n" } },
  { name: "a claim pointing at a file that is gone fails", fails: true, says: "does not exist", files: {}, drop: ["docs/adopt.md"] },
  { name: "a home pattern that matches nothing fails", fails: true, says: "matches nothing", files: { "README.md": "the 2 shipped skills\n" } },
  // A repo that declares no facts is not a repo with drift - the shipped guard runs
  // in every adopting repo and must stay quiet where nothing was declared.
  { name: "a repo with no declared facts passes", fails: false, says: "skipping", files: {}, args: [] },
];

let failures = 0;
for (const c of CASES) {
  const dir = mkdtempSync(join(tmpdir(), "facts-check-test-"));
  const files = { ...BASE, ...c.files };
  for (const drop of c.drop ?? []) delete files[drop];
  files["facts.json"] = JSON.stringify(FACTS, null, 2);
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }

  const { code, out } = run(dir, c.args);
  const want = c.fails ? 1 : 0;
  if (code !== want) {
    failures++;
    console.log(`  FAIL  ${c.name} - expected exit ${want}, got ${code}\n${out.replace(/^/gm, "        ")}`);
  } else if (!out.includes(c.says)) {
    failures++;
    console.log(`  FAIL  ${c.name} - exit ${code} is right but the output never says "${c.says}"\n${out.replace(/^/gm, "        ")}`);
  } else {
    console.log(`  ok    ${c.name}`);
  }
  rmSync(dir, { recursive: true, force: true });
}

if (failures) {
  console.log(`\nfacts-check-test: FAIL - ${failures} of ${CASES.length} cases`);
  process.exit(1);
}
console.log(`\nfacts-check-test: OK - ${CASES.length} cases, a fact that drifts or stops being covered fails`);
