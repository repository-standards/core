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
//      are present in their files; static guards pass. Each entry may carry a profile
//      (core|scale, ADR-011) - core is whatever keeps knowledge alive, scale is whatever
//      coordinates people. --profile core checks core only; --profile scale checks everything;
//      no flag = the manifest copy's "profile" field, then scale. solo/team are
//      accepted silently as deprecated aliases
//      (solo -> core, team -> scale). An entry with no profile counts as core, so
//      manifests from before ADR-011 still check in full either way.
//   3. Stray transition skills (ADR-009): align-to-standards, onboard-repo, modernize,
//      greenfield-start never ship in a consuming repo. One found under .claude/skills/
//      is a hand-copy mistake, flagged as a warning - it does not add to drift.
//
// Usage:
//   node scripts/self-verify.mjs                  # gate: exit 1 on any failure
//   node scripts/self-verify.mjs --version 0.8.3  # also assert the record equals a target
//   node scripts/self-verify.mjs --warn           # report only, always exit 0
//   node scripts/self-verify.mjs --profile core   # core-profile entries only (ADR-011);
//                                                 # without the flag, the repo's manifest
//                                                 # copy's top-level "profile" field is the
//                                                 # default, then scale (= everything)
//   node scripts/self-verify.mjs --skeleton       # verify the shipped tree itself: skip the
//                                                 # version pin, guards, and fill-from-repo
//                                                 # files a client authors at adoption
//
// No dependencies (Node built-ins only). Place at scripts/self-verify.mjs.

import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const warn = args.includes("--warn");
const vIdx = args.indexOf("--version");
const wantVersion = vIdx >= 0 ? args[vIdx + 1] : null;
const pIdx = args.indexOf("--profile");
const profileFlag = pIdx >= 0 ? args[pIdx + 1] : null; // resolved after the manifest loads
const skeleton = args.includes("--skeleton"); // verifying the shipped tree, not an adopted repo

const results = [];
const pass = (name, msg) => results.push({ ok: true, name, msg });
const fail = (name, msg) => results.push({ ok: false, name, msg });
const note = (name, msg) => results.push({ ok: true, name, msg, dim: true });
const warning = (name, msg) => results.push({ ok: true, name, msg, isWarning: true });

// 0. load the manifest (ADR-005) ------------------------------------------------
let manifest = null;
if (existsSync("standard.manifest.json")) {
  try {
    manifest = JSON.parse(readFileSync("standard.manifest.json", "utf8"));
  } catch (e) {
    fail("manifest", `standard.manifest.json is present but unparseable: ${e.message}`);
  }
}

// 0b. a repo that adopted a stack carries the stack's manifest too (ADR-016):
// same schema, second file - the engine eats both and drift is one number.
if (manifest && existsSync("stack.manifest.json")) {
  try {
    const stack = JSON.parse(readFileSync("stack.manifest.json", "utf8"));
    note("stack", `stack manifest present: ${stack.technology || "unnamed"} - technology layer counted in the same drift number (ADR-016/022)`);
    for (const k of ["files", "sections", "guards"]) {
      manifest[k] = [...(manifest[k] || []), ...(stack[k] || [])];
    }
  } catch (e) {
    fail("stack", `stack.manifest.json is present but unparseable: ${e.message}`);
  }
}

// 0c. profile resolution (ADR-011): the CLI flag wins; else the repo's carried
// manifest copy may declare its chosen profile (written at align time); else
// scale = check everything. solo/team are accepted as deprecated aliases.
const profileArg = profileFlag || (manifest && manifest.profile) || "scale";
const coreOnly = profileArg === "core" || profileArg === "solo";
if (!profileFlag && manifest && manifest.profile) {
  if (["core", "scale", "solo", "team"].includes(manifest.profile)) {
    note("profile", `profile "${manifest.profile}" declared in the manifest copy - used as the default`);
  } else {
    warning("profile", `manifest declares unknown profile "${manifest.profile}" - treated as scale (valid: core, scale)`);
  }
}

// 1. version pin ----------------------------------------------------------------
let pinned = null;
if (skeleton) {
  note("version", ".standards-version is written at adoption - skipped (--skeleton)");
} else if (!existsSync(".standards-version")) {
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
const isCore = (entry) => !entry.profile || entry.profile === "core"; // no profile = core (pre-ADR-011)
let scaleSkipped = 0; // entries skipped by --profile core, across files/sections/guards

if (manifest) {
  // method docs adopted by reference (ADR-004/023): named, never file-checked
  if ((manifest.references || []).length) {
    note("reference", `${manifest.references.length} method docs adopted by reference from the living standard - always latest (ADR-023/025); read them in the standards repo, never copy them here`);
  }
  // files
  for (const f of manifest.files || []) {
    if (coreOnly && !isCore(f)) { scaleSkipped++; continue; }
    if (f.adapt === "reference") { note("file", `${f.path} is reference-class - adopted by link to the living standard, no file expected here`); continue; }
    if (hasFile(f.path, f.altPaths)) pass("file", `${f.path} (${f.purpose})`);
    else if (skeleton && f.adapt === "fill-from-repo") note("file", `${f.path} is authored at adoption - absent from the skeleton by design`);
    else if (f.required) fail("file", `${f.path} missing - ${f.purpose}`);
    else note("file", `${f.path} absent (optional) - ${f.purpose}`);
  }
  // required sections within files
  for (const s of manifest.sections || []) {
    if (coreOnly && !isCore(s)) { scaleSkipped++; continue; }
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
  if (skeleton) note("guard", "guards run in an adopted repo, not on the skeleton - skipped (--skeleton)");
  for (const g of skeleton ? [] : manifest.guards || []) {
    if (coreOnly && !isCore(g)) { scaleSkipped++; continue; }
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
  if (coreOnly && scaleSkipped > 0) {
    note("profile", `${scaleSkipped} scale-only entr${scaleSkipped === 1 ? "y" : "ies"} skipped (--profile core)`);
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

// 2b. surviving template placeholders - drift 0 with empty shells is a hollow win.
// A warning, never drift: substance stays the judgment tier's call.
if (!skeleton) {
  // Case-insensitive and broader than it was: the entry file ships `<repo>` in lower case,
  // so the one file this check exists for was the one it could not see. The angle-bracket
  // form excludes `:` and `/` so markdown autolinks are not mistaken for placeholders.
  const PLACEHOLDER = /\{\{[^}]+\}\}|<[A-Za-z][A-Za-z0-9 +_-]{1,30}>/;

  // Code spans and fenced blocks are stripped first, because generic notation lives there and
  // a *correctly filled* repo keeps it: `specs/<capability>`, `docs/discovery/<topic>/`,
  // `blocked:<id>`. Without this the warning can never be cleared - AGENTS.md ships
  // `specs/<capability>` in its own altitude ladder - and a warning nobody can clear is one
  // everybody learns to skip, on the single file this check exists for.
  //
  // The cost is a real placeholder written inside backticks going unseen. That is why the
  // shipped templates put fill markers in prose and keep code formatting for notation; the
  // convention is what makes the check precise, not the regex alone.
  const stripCode = (s) => s.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, "").replace(/`[^`\n]*`/g, "");

  for (const p of ["AGENTS.md", "README.md", "SECURITY.md", "docs/PRINCIPLES.md", "docs/PRODUCT.md", "docs/ARCHITECTURE.md", "docs/personas.md", "docs/backlog.md"]) {
    if (!existsSync(p)) continue;
    const body = stripCode(readFileSync(p, "utf8"));
    if (PLACEHOLDER.test(body)) warning("fill", `${p} still carries template placeholders - filled shells, not copied ones, are the point`);
  }
}

// 3. stray transition skills (ADR-009 / SKILL-1) ---------------------------------
// These run FROM the standard repo and never ship inside a consuming repo (they can't -
// greenfield-start runs before the target repo even exists). A hit here is a hand-copy
// mistake, not drift - warn and suggest deleting it.
const TRANSITION_SKILLS = ["align-to-standards", "onboard-repo", "modernize", "greenfield-start"];
for (const name of TRANSITION_SKILLS) {
  const p = `.claude/skills/${name}`;
  if (existsSync(p)) {
    warning("skill", `${p} is a transition skill and must not ship here (ADR-009) - delete it`);
  }
}

// report ------------------------------------------------------------------------
const failed = results.filter((r) => !r.ok);
const drift = failed.length; // one unmet required entry = one point of drift
console.log(`\nself-verify - compliance with ${manifest ? `manifest ${manifest.version}` : "the pinned standard"}\n`);
for (const r of results) {
  const tag = !r.ok ? "FAIL" : r.isWarning ? "WARN" : r.dim ? "····" : "PASS";
  // padEnd(9) leaves no gap after a 9-character name, so `reference` ran into its own
  // count: "reference9 method docs". One more column, and the separator is unconditional.
  console.log(`  ${tag}  ${r.name.padEnd(10)} ${r.msg}`);
}
console.log("");

// Drift counts what is unmet; adoption says how much of the standard this repo actually
// carries. They answer different questions and a repo mid-adoption needs the second one:
// "17 points of drift" reads as failure at every stage, while "63% adopted, 17 to go"
// reads as progress - and it is the same measurement. The denominator is what applies to
// this repo, which is the manifest's own entry list, so neither number is a judgment.
const applicable = results.filter((r) => !r.isWarning && !r.dim).length;
const adopted = applicable - drift;
const pct = applicable ? Math.round((adopted / applicable) * 100) : 100;

if (drift === 0) {
  console.log(`self-verify: OK - drift 0 - 100% adopted (${adopted}/${applicable}), compliant with the standard\n`);
  process.exit(0);
}
console.error(`self-verify: drift ${drift} - ${pct}% adopted (${adopted}/${applicable}) - ${drift} required entr${drift === 1 ? "y is" : "ies are"} unmet\n`);
process.exit(warn ? 0 : 1);
