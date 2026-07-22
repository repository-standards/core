#!/usr/bin/env node
// Spec-structure guard.
//
// Two mechanical structure checks on capability specs:
//   1. No ticket-numbered spec paths (`specs/<NNN-feature>/`, `specs/<cap>/<NNN-...>`) -
//      e.g. a leaked GitHub Spec Kit `specs/001-core/` folder. Capability specs live at
//      `specs/<capability>/spec.md` (or named sub-specs `specs/<capability>/<name>.md`) -
//      domain names, never numbers.
//   2. Every capability spec names a **persona** it serves (ADR-006), when the repo has a
//      `docs/personas.md` roster - a spec that serves no one is incomplete. Checked by a
//      `**Serves:** \`<persona>\`` field, a roster-name mention, or a personas.md reference.
//
// This is the "structure lint" half of specs/enforcement.md, made mechanical - the
// complement to the coupling guard (spec-guard.mjs).
//
// Usage:
//   node scripts/spec-structure.mjs                 # full tree (git ls-files) - audit / conformance
//   node scripts/spec-structure.mjs --staged        # pre-commit (staged files), warn only
//   node scripts/spec-structure.mjs --base <ref>    # CI (files changed vs base ref)
//   add --block to exit non-zero on a violation (default: warn, exit 0)
//
// No dependencies (Node built-ins only).

import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";

const args = process.argv.slice(2);
const staged = args.includes("--staged");
const block = args.includes("--block");
const baseIdx = args.indexOf("--base");
const base = baseIdx >= 0 ? args[baseIdx + 1] : null;

const sh = (c) => execSync(c, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();

// Walk specs/ on the filesystem - the fallback when git is absent (a fresh degit has
// no .git) or tracks nothing there yet. A shipped guard never dumps a stack trace.
const fsWalk = (dir, acc = []) => {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    const p = `${dir}/${e}`;
    if (statSync(p).isDirectory()) fsWalk(p, acc);
    else acc.push(p);
  }
  return acc;
};

let files;
try {
  let raw;
  if (staged) raw = sh("git diff --cached --name-only --diff-filter=ACMR -- specs");
  else if (base) raw = sh(`git diff --name-only --diff-filter=ACMR ${base}...HEAD -- specs`);
  else {
    const tracked = sh("git ls-files specs");
    const untracked = sh("git ls-files --others --exclude-standard -- specs");
    raw = [tracked, untracked].filter(Boolean).join("\n");
    if (!raw) raw = fsWalk("specs").join("\n"); // brand-new repo, nothing there yet
  }
  files = raw.split("\n").filter(Boolean).filter((f) => f.startsWith("specs/"));
} catch {
  if (staged || base) {
    console.error("spec-structure: not a git repository - the --staged/--base modes need git.");
    process.exit(1);
  }
  files = fsWalk("specs").filter((f) => f.startsWith("specs/"));
}

// --- check 1: no ticket-numbered spec paths ------------------------------------
// A ticket-numbered segment: two or more leading digits then - or _ (Spec Kit's
// NNN-feature). Catches specs/001-booking/, specs/cms/001-core, specs/x/017-change.md.
const NUMBERED = /^\d{2,}[-_]/;
const numbered = [];
for (const f of files) {
  const segment = f.split("/").slice(1).find((s) => NUMBERED.test(s));
  if (segment) numbered.push({ file: f, segment });
}

// --- check 2: every capability spec names a persona (ADR-006) ------------------
// A capability spec is specs/<capability>/<file>.md (depth >= 3), not a template or README.
const ENGINE_ARTIFACTS = /\/(plan|tasks)\.md$|\/checklists\//; // scaffolding the engine writes (ADR-010: ephemeral)
const isCapSpec = (f) =>
  f.split("/").length >= 3 && f.endsWith(".md") && !f.includes(".template.") && !/\/readme\.md$/i.test(f) && !ENGINE_ARTIFACTS.test(f);

const personaless = [];
const personasPath = ["docs/personas.md", "personas.md"].find((p) => existsSync(p));
if (personasPath) {
  const roster = new Set();
  for (const line of readFileSync(personasPath, "utf8").split("\n")) {
    const m = line.match(/^\|\s*`([^`]+)`\s*\|/); // roster rows: | `Name` | ...
    if (m && !m[1].includes("<")) roster.add(m[1].toLowerCase());
  }
  for (const f of files.filter(isCapSpec)) {
    let body;
    try { body = readFileSync(f, "utf8"); } catch { continue; }
    const low = body.toLowerCase();
    const serves = body.match(/\*\*serves:\*\*\s*`([^`]+)`/i); // Serves: `Name`, not placeholder
    const hasServes = serves && !serves[1].includes("<");
    const namesRoster = [...roster].some((n) => low.includes(n));
    const refsPersonas = low.includes("personas.md") || /for whom/i.test(body);
    if (!hasServes && !namesRoster && !refsPersonas) personaless.push(f);
  }
}

// --- report --------------------------------------------------------------------
if (numbered.length === 0 && personaless.length === 0) {
  const note = personasPath ? "" : " (persona check skipped - no personas.md)";
  console.log(`spec-structure: OK (${files.length} spec paths)${note}`);
  process.exit(0);
}

if (numbered.length) {
  console.error("\nspec-structure: ticket-numbered spec paths are forbidden - use capability names:");
  for (const v of numbered) {
    console.error(`  - ${v.file}   ('${v.segment}' -> a capability name, e.g. specs/<capability>/spec.md)`);
  }
  console.error("\nCapability specs are organized by domain, not by ticket/feature number.");
  console.error("A leaked 'NNN-' folder usually means upstream Spec Kit's native specify created it;");
  console.error("create or edit capability specs with /spec-update instead.");
}

if (personaless.length) {
  console.error("\nspec-structure: capability specs with no persona named (ADR-006 - a spec serves someone):");
  for (const f of personaless) console.error(`  - ${f}`);
  console.error('\nAdd a `**Serves:** `<persona>`` field (from docs/personas.md) - or name the persona in the spec.');
}
console.error("");
process.exit(block ? 1 : 0);
