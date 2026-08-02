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
} catch (e) {
  if (staged || base) {
    const why = (e.stderr?.toString() || e.message || "").trim().split("\n")[0];
    console.error(`spec-structure: git failed in --staged/--base mode${why ? ` (${why})` : ""} - these modes need a git repo and a resolvable base ref.`);
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
let rosterMissing = false; // capability specs exist but no roster - the R10 gate has nothing to hold
const personasPath = ["docs/personas.md", "personas.md"].find((p) => existsSync(p));
if (!personasPath && files.some(isCapSpec)) rosterMissing = true;
if (personasPath) {
  const roster = new Set();
  const personaLines = readFileSync(personasPath, "utf8").split("\n");
  // Only the roster section counts. The shipped template also carries a filled worked
  // example, and scanning the whole file line by line reads those names as live personas -
  // which would let a spec "serve" someone from the example's domain and pass the gate.
  // Repos whose personas file has no such heading keep the whole-file scan.
  const hasRosterHeading = personaLines.some((l) => /^##\s+the roster\b/i.test(l));
  let inRoster = !hasRosterHeading;
  for (const line of personaLines) {
    if (hasRosterHeading && /^##\s/.test(line)) {
      inRoster = /^##\s+the roster\b/i.test(line);
      continue;
    }
    if (!inRoster) continue;
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
    // Deliberately NOT a plain `includes("personas.md")`: the shipped capability template
    // carries `**Serves:** <persona from docs/personas.md>` in its placeholder, so that test
    // passed every spec instantiated from the template - the template defeating the guard
    // the template exists to satisfy. Prose that genuinely reasons about who this is for
    // still counts, and an unfilled `Serves` placeholder no longer does.
    const refsPersonas = /for whom/i.test(body);
    if (!hasServes && !namesRoster && !refsPersonas) personaless.push(f);
  }
}

// --- check 3 (warn only): committed engine scaffolding - ephemeral by rule -------
// plan.md/tasks.md are working scaffolds the engine writes and the close removes.
// Full-tree mode only (mid-work diffs legitimately carry them); never a violation.
const staleScaffolding = !staged && !base ? files.filter((f) => ENGINE_ARTIFACTS.test(f)) : [];

// --- report --------------------------------------------------------------------
if (staleScaffolding.length) {
  console.error("\nspec-structure: WARN - engine scaffolding is committed (ephemeral - remove when the work closes):");
  for (const f of staleScaffolding) console.error(`  - ${f}`);
  console.error("");
}
if (numbered.length === 0 && personaless.length === 0 && !rosterMissing) {
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

if (rosterMissing) {
  console.error("\nspec-structure: capability specs exist but there is no docs/personas.md roster -");
  console.error("the persona gate (ADR-006) has nothing to check against. Write the roster first;");
  console.error("a spec that serves nobody is incomplete, and without the roster none can prove otherwise.");
}
console.error("");
process.exit(block ? 1 : 0);
