#!/usr/bin/env node
// self-verify - prove this repo still complies with the standard it is pinned to.
//
// The "verify" step of the versioned-standard mechanism. Runs after adopting the
// standard (align-to-standards), after updating it (update-to-version), and in CI on
// every PR - the same pass/fail each time. This is the mechanical tier; the judgment
// tier (are the catalogued decisions actually recorded? are the money/security specs
// buildable?) is reviewed at PR - see docs/self-verify.md.
//
// Manifest-driven (ADR-005). When standard.manifest.json is present, this reads it and
// checks the repo against every entry - files, required sections, static guards - and
// reports DRIFT as a number (how many required entries are unmet). The manifest is the
// single source of truth; without one, it falls back to a built-in skeleton so the check
// still works on repos that predate the manifest.
//
// Checks (assembled/client layout):
//   1. .standards-version is present and well-formed (x.y.z); with --version <target> it
//      must equal that target; and it must equal the manifest's version when a manifest
//      is present (a repo pinned to X carries manifest X).
//   2. Manifest (or fallback skeleton): required files/altPaths exist; required sections
//      are present in their files; static guards pass.
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
const note = (name, msg) => results.push({ ok: true, name, msg, dim: true });

// 0. load the manifest (ADR-005) ------------------------------------------------
let manifest = null;
if (existsSync("standard.manifest.json")) {
  try {
    manifest = JSON.parse(readFileSync("standard.manifest.json", "utf8"));
  } catch (e) {
    fail("manifest", `standard.manifest.json is present but unparseable: ${e.message}`);
  }
}

// 1. version pin ----------------------------------------------------------------
let pinned = null;
if (!existsSync(".standards-version")) {
  fail("version", ".standards-version missing - repo is not pinned to a standard version (run align-to-standards)");
} else {
  pinned = readFileSync(".standards-version", "utf8").trim();
  if (!/^\d+\.\d+\.\d+/.test(pinned)) {
    fail("version", `.standards-version is malformed: "${pinned}" (expected x.y.z)`);
  } else if (wantVersion && pinned !== wantVersion) {
    fail("version", `.standards-version is ${pinned}, expected ${wantVersion}`);
  } else {
    pass("version", `pinned to ${pinned}`);
  }
}
if (manifest && pinned && manifest.version && manifest.version !== pinned) {
  fail("version", `manifest is ${manifest.version} but .standards-version is ${pinned} - the manifest must match the pin`);
}

// 2. manifest checks, or fallback skeleton --------------------------------------
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasFile = (p, alts = []) => [p, ...alts].some((x) => existsSync(x));

if (manifest) {
  // files
  for (const f of manifest.files || []) {
    if (hasFile(f.path, f.altPaths)) pass("file", `${f.path} (${f.purpose})`);
    else if (f.required) fail("file", `${f.path} missing - ${f.purpose}`);
    else note("file", `${f.path} absent (optional) - ${f.purpose}`);
  }
  // required sections within files
  for (const s of manifest.sections || []) {
    if (!existsSync(s.file)) {
      if (s.required) fail("section", `${s.file} missing, so "${s.heading}" cannot be checked`);
      continue;
    }
    const body = readFileSync(s.file, "utf8");
    const re = new RegExp(`^#{1,6}\\s+.*${escapeRe(s.heading)}`, "mi");
    if (re.test(body)) pass("section", `${s.file} > "${s.heading}"`);
    else if (s.required) fail("section", `${s.file} is missing the "${s.heading}" section - ${s.purpose}`);
  }
  // static guards (skip self to avoid recursion; diff guards run in CI on the PR diff)
  for (const g of manifest.guards || []) {
    if (g.id === "self-verify") continue;
    if (g.kind === "diff") { note("guard", `${g.id} is diff-based - runs in CI on the PR diff, not here`); continue; }
    const script = (g.run.match(/scripts\/[\w.-]+\.mjs/) || [])[0];
    if (script && !existsSync(script)) { note("guard", `${g.id} not installed (${script}) - skipped`); continue; }
    try {
      execSync(g.run, { stdio: "pipe" });
      pass("guard", `${g.id} passed`);
    } catch (e) {
      const out = ((e.stdout?.toString() || "") + (e.stderr?.toString() || "")).trim();
      fail("guard", `${g.id} failed:\n` + out.split("\n").map((l) => "        " + l).join("\n"));
    }
  }
  // decisions are judgment-tier: a human confirms they are actually recorded at review
  if ((manifest.decisions || []).length) {
    note("decision", `${manifest.decisions.length} catalogued decisions to confirm recorded at review (judgment tier - see docs/self-verify.md)`);
  }
} else {
  note("manifest", "no standard.manifest.json - using the built-in skeleton (predates ADR-005)");
  for (const [p, why] of [
    ["AGENTS.md", "the single agent entry point"],
    ["specs", "living capability specs"],
    ["docs/decision-records", "the ADR/BDR decision log"],
  ]) {
    if (existsSync(p)) pass("file", `${p} (${why})`);
    else fail("file", `${p} missing - ${why}`);
  }
  if (hasFile("docs/backlog.md", ["backlog.md"])) pass("file", "backlog present");
  else fail("file", "backlog missing (docs/backlog.md) - the work ledger");
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
    note("guard", "spec-structure not installed - skipped");
  }
}

// report ------------------------------------------------------------------------
const failed = results.filter((r) => !r.ok);
const drift = failed.length; // one unmet required entry = one point of drift
console.log(`\nself-verify - compliance with ${manifest ? `manifest ${manifest.version}` : "the pinned standard"}\n`);
for (const r of results) {
  const tag = r.ok ? (r.dim ? "····" : "PASS") : "FAIL";
  console.log(`  ${tag}  ${r.name.padEnd(9)}${r.msg}`);
}
console.log("");

if (drift === 0) {
  console.log(`self-verify: OK - drift 0 - ${results.length} checks, compliant with the standard\n`);
  process.exit(0);
}
console.error(`self-verify: drift ${drift} - ${drift} required entr${drift === 1 ? "y is" : "ies are"} unmet - not compliant\n`);
process.exit(warn ? 0 : 1);
