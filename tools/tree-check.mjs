#!/usr/bin/env node
// tree-check - guard the single shipped tree (standard/), ADR-014.
//
// The standard is authored directly in standard/ at real-repo paths; there is no
// second source and nothing to reflect. What can still go wrong, and what this
// checks:
//   1. LEAK    - repo-own material must never enter the tree: this repo's ADRs,
//                the transition skill, the old engine vendor layouts.
//   2. MISSING - every file the manifest promises a client (adapt != fill-from-repo)
//                must exist in the tree at its client path.
//   3. SKELETON - the tree must pass its own shipped verifier:
//                `node scripts/self-verify.mjs --skeleton` run inside standard/.
//
// Usage: node tools/tree-check.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";

const TREE = "standard";
let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };
const ok = (msg) => console.log(`  ok    ${msg}`);

// --- 1. leaks ----------------------------------------------------------------------
const walk = (dir, acc = []) => {
  for (const e of readdirSync(dir)) {
    const p = `${dir}/${e}`;
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
};
const files = walk(TREE);

const LEAK_PATTERNS = [
  [/\/ADR-\d{3}-/, "a numbered ADR (this repo's own decisions live in docs/decision-records/, clients get them by reference - ADR-004)"],
  [/\.specify\//, "the retired .specify engine layout (ADR-015 extracted the engine)"],
  [/spec-kit\//, "a vendored spec-kit area (ADR-015 extracted the engine)"],
  [/skills\/(align-to-standards|onboard-repo|modernize|greenfield-start|speckit-)/, "a transition or speckit skill (never shipped - ADR-009/ADR-015)"],
];
let leaks = 0;
for (const f of files) {
  for (const [re, why] of LEAK_PATTERNS) {
    if (re.test(f)) { fail(`${f} leaked into the tree - ${why}`); leaks++; }
  }
}
if (!leaks) ok(`no repo-own material leaked into ${TREE}/ (${files.length} files walked)`);

// --- 2. manifest promises ------------------------------------------------------------
const manifest = JSON.parse(readFileSync(`${TREE}/standard.manifest.json`, "utf8"));
// fill-from-repo entries ship as shells the client fills - they must still exist in
// the tree, except the two a client authors from nothing:
const CLIENT_ONLY = new Set([".standards-version", "specs/capability-map.json"]);
let missing = 0;
for (const f of manifest.files || []) {
  if (CLIENT_ONLY.has(f.path)) continue;
  const shipped = [f.path, ...(f.altPaths || [])].some((p) => existsSync(`${TREE}/${p}`));
  if (!shipped) { fail(`${TREE}/${f.path} missing but the manifest promises it (${f.purpose})`); missing++; }
}
for (const s of manifest.sections || []) {
  if (!existsSync(`${TREE}/${s.file}`)) { fail(`${TREE}/${s.file} missing, so the required "${s.heading}" section cannot ship`); missing++; }
}
if (!missing) ok(`every manifest promise is present in the tree`);

// --- 3. the tree verifies itself -------------------------------------------------------
try {
  execSync("node scripts/self-verify.mjs --skeleton", { cwd: TREE, stdio: "pipe" });
  ok("self-verify --skeleton passes on the pristine tree");
} catch (e) {
  const out = ((e.stdout?.toString() || "") + (e.stderr?.toString() || "")).trim();
  fail("self-verify --skeleton FAILS on the pristine tree:\n" + out.split("\n").map((l) => "        " + l).join("\n"));
}

// --- 4. version surfaces agree with VERSION ----------------------------------------------
// The maintainer alone bumps VERSION; this only ensures the bump cannot leave the
// spec header or the README quick start advertising a different number.
const version = readFileSync("VERSION", "utf8").trim();
const spec = readFileSync(`${TREE}/SPEC.md`, "utf8");
const readme = readFileSync("README.md", "utf8");
let vFails = 0;
if (!spec.includes(`Version ${version}`)) { fail(`${TREE}/SPEC.md header does not say "Version ${version}" (VERSION file is ${version})`); vFails++; }
if (!readme.includes(`@${version}`)) { fail(`README.md quick start does not pin @${version} (VERSION file is ${version})`); vFails++; }
if (!vFails) ok(`SPEC.md and README agree with VERSION (${version})`);

// --- verdict ---------------------------------------------------------------------------
if (failures) {
  console.log(`\ntree-check: FAIL - ${failures} problem(s)`);
  process.exit(1);
}
console.log(`\ntree-check: OK - one tree, shippable`);
