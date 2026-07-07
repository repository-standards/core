#!/usr/bin/env node
// self-verify - prove this repo still complies with the standard it is pinned to.
//
// The "verify" step of the versioned-standard mechanism. Runs after adopting the
// standard (align-to-standards), after updating it (update-to-version), and in CI on
// every PR - the same pass/fail each time. This is the mechanical tier; the judgment
// tier (are the catalogued decisions actually recorded? are the money/security specs
// buildable?) is reviewed at PR - see docs/self-verify.md.
//
// Checks (assembled/client layout):
//   1. .standards-version is present and well-formed (x.y.z); with --version <target>
//      it must equal that target (used right after an update to confirm the bump).
//   2. The core skeleton exists: AGENTS.md, specs/, decision-records, a backlog.
//   3. The shipped structure guard passes (scripts/spec-structure.mjs), when installed.
//
// Usage:
//   node scripts/self-verify.mjs                  # gate: exit 1 on any failure
//   node scripts/self-verify.mjs --version 0.7.2  # also assert the pinned version
//   node scripts/self-verify.mjs --warn           # report only, always exit 0
//
// No dependencies (Node built-ins only). Place at scripts/self-verify.mjs.

import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const warn = args.includes("--warn");
const vIdx = args.indexOf("--version");
const wantVersion = vIdx >= 0 ? args[vIdx + 1] : null;

const results = [];
const pass = (name, msg) => results.push({ ok: true, name, msg });
const fail = (name, msg) => results.push({ ok: false, name, msg });

// 1. version pin ----------------------------------------------------------------
if (!existsSync(".standards-version")) {
  fail("version", ".standards-version missing - repo is not pinned to a standard version (run align-to-standards)");
} else {
  const v = readFileSync(".standards-version", "utf8").trim();
  if (!/^\d+\.\d+\.\d+/.test(v)) {
    fail("version", `.standards-version is malformed: "${v}" (expected x.y.z)`);
  } else if (wantVersion && v !== wantVersion) {
    fail("version", `.standards-version is ${v}, expected ${wantVersion}`);
  } else {
    pass("version", `pinned to ${v}`);
  }
}

// 2. core skeleton --------------------------------------------------------------
for (const [p, why] of [
  ["AGENTS.md", "the single agent entry point"],
  ["specs", "living capability specs"],
  ["docs/decision-records", "the ADR/BDR decision log"],
]) {
  if (existsSync(p)) pass("skeleton", `${p} (${why})`);
  else fail("skeleton", `${p} missing - ${why}`);
}
if (existsSync("docs/backlog.md") || existsSync("backlog.md")) pass("skeleton", "backlog present");
else fail("skeleton", "backlog missing (docs/backlog.md) - the work ledger");

// 3. shipped structure guard ----------------------------------------------------
const guard = "scripts/spec-structure.mjs";
if (existsSync(guard)) {
  try {
    execSync(`node ${guard} --block`, { stdio: "pipe" });
    pass("guard", "spec-structure passed");
  } catch (e) {
    const out = ((e.stdout?.toString() || "") + (e.stderr?.toString() || "")).trim();
    fail("guard", "spec-structure failed:\n" + out.split("\n").map((l) => "        " + l).join("\n"));
  }
} else {
  pass("guard", "spec-structure not installed - skipped");
}
// Note: spec-guard (code<->spec coupling) is diff-based; it runs in CI on the PR diff,
// not as part of this static check.

// report ------------------------------------------------------------------------
const failed = results.filter((r) => !r.ok);
console.log("\nself-verify - compliance with the pinned standard\n");
for (const r of results) console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(9)}${r.msg}`);
console.log("");

if (failed.length === 0) {
  console.log(`self-verify: OK - ${results.length} checks passed\n`);
  process.exit(0);
}
console.error(`self-verify: ${failed.length} check(s) failed - not compliant with the standard\n`);
process.exit(warn ? 0 : 1);
