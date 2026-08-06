#!/usr/bin/env node
// Spec-structure guard.
//
// Three mechanical structure checks on capability specs:
//   1. No ticket-numbered spec paths (`specs/<NNN-feature>/`, `specs/<cap>/<NNN-...>`) -
//      e.g. a leaked GitHub Spec Kit `specs/001-core/` folder. Capability specs live at
//      `specs/<capability>/spec.md` (or named sub-specs `specs/<capability>/<name>.md`) -
//      domain names, never numbers.
//   2. Every capability spec names a **persona** it serves (ADR-006), when the repo has a
//      `docs/personas.md` roster - a spec that serves no one is incomplete. Checked by a
//      `**Serves:** \`<persona>\`` field, a roster-name mention, or a personas.md reference.
//   3. A spec's `**Status:**` is earned, not typed: one claiming `ready-to-develop` or
//      `live` must pass the clarify gate. Nothing read or wrote that field, so the status
//      the whole method reads as "this is settled" was decorative - a spec with four
//      guards green and a failing gate still said ready-to-develop.
//   4. A spec that declares the buildable tier carries the sections that make it
//      buildable (R9). The template marked them REQUIRED and nothing read the template,
//      so a buildable spec shipped without its contracts and the sections were
//      retrofitted later, by hand, when somebody noticed.
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
import { fileURLToPath } from "node:url";

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

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
let rosterHeadingMissing = false; // a roster file the guard cannot find the roster in
const personasPath = ["docs/personas.md", "personas.md"].find((p) => existsSync(p));
if (!personasPath && files.some(isCapSpec)) rosterMissing = true;
if (personasPath) {
  const roster = new Set();
  const personaLines = readFileSync(personasPath, "utf8").split("\n");
  // Only the roster section counts. The shipped file also carries a filled worked example,
  // and scanning the whole file reads those names as live personas - which would let a spec
  // "serve" someone from the example's domain and pass the gate.
  //
  // Scoping to the heading is also how the check switched itself off: the earlier version
  // fell back to a whole-file scan when the heading was absent, so translating `## The
  // roster` widened the roster to every name in the file, worked example included - proven
  // with an English control, where the identical spec failed with the English heading and
  // passed with a translated one. A required heading that is absent is a failure, not a
  // reason to check something else instead. The heading is syntax: it stays in English even
  // when the roster it introduces is written in another language.
  const hasRosterHeading = personaLines.some((l) => /^##\s+the roster\b/i.test(l));
  if (!hasRosterHeading) rosterHeadingMissing = true;
  let inRoster = false;
  for (const line of hasRosterHeading ? personaLines : []) {
    if (/^##\s/.test(line)) {
      inRoster = /^##\s+the roster\b/i.test(line);
      continue;
    }
    if (!inRoster) continue;
    const m = line.match(/^\|\s*`([^`]+)`\s*\|/); // roster rows: | `Name` | ...
    if (m && !m[1].includes("<")) roster.add(m[1].toLowerCase());
  }
  for (const f of hasRosterHeading ? files.filter(isCapSpec) : []) {
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

// --- check 3: a claimed status is earned, not typed -----------------------------
// `**Status:** ready-to-develop` is what plan, tasks and the tracker read as "settled",
// and nothing checked it against the gate that is supposed to grant it. The gate script
// is the single implementation - shelling out to it keeps this from becoming a second,
// drifting copy of the same rules. It sits next to this file in both layouts (the tree's
// `standard/scripts/` and an adopted repo's `scripts/`), so it is resolved relative to
// this module, never to the working directory.
const EARNED = new Set(["ready-to-develop", "live"]); // statuses that assert the gate passed
const gatePath = fileURLToPath(new URL("spec/check-spec-clarified.sh", import.meta.url));
const statusOf = (body) => {
  const m = body.match(/^\*\*Status:\*\*\s*(.+)$/m);
  if (!m) return null;
  const value = m[1].replace(/<!--[\s\S]*$/, "").trim();
  if (value.includes("|")) return null; // the template's unfilled list of options
  return value.replace(/[`*.]/g, "").trim();
};

const unearned = [];
let gateMissing = false;
if (!existsSync(gatePath)) {
  gateMissing = true;
} else {
  for (const f of files.filter(isCapSpec)) {
    let body;
    try { body = readFileSync(f, "utf8"); } catch { continue; }
    const status = statusOf(body);
    if (!status || !EARNED.has(status)) continue;
    try {
      execSync(`bash ${JSON.stringify(gatePath)} ${JSON.stringify(f)}`, { stdio: "pipe" });
    } catch (e) {
      // A gate that cannot run is not a gate that passed - the status stays unproven.
      const out = ((e.stdout?.toString() || "") + (e.stderr?.toString() || "")).trim();
      unearned.push({ file: f, status, why: out || `the clarify gate could not be run (exit ${e.status ?? "?"}); it needs bash` });
    }
  }
}

// --- check 4: a buildable spec carries the sections that make it buildable (R9) --
// The template marks three sections REQUIRED for the buildable tier, and nothing read
// them: a spec shipped at that tier with no `## Data contracts` and no
// `## Interface contracts`, and the gap was found by a person, months later.
//
// Only a spec that DECLARES `buildable` is held to them, and that boundary is deliberate.
// R9 makes buildable the default, so a spec with no tier line is the same claim in
// principle - but failing every undeclared spec in a repo mid-adoption is how a guard gets
// switched off, and a switched-off guard checks nothing at all. An undeclared tier is
// reported as a warning instead, so deleting the line is not a silent way out.
//
// `Algorithms & rules` is NOT in the list: the template requires it "where logic is
// non-trivial", which is a judgment nothing here can make.
const BUILDABLE_SECTIONS = ["Data contracts", "Interface contracts", "Acceptance criteria"];
const NO_TIER = "(none)";
const tierOf = (body) => {
  const m = body.match(/^\*\*Spec tier:\*\*\s*(.+)$/m);
  if (!m) return NO_TIER;
  const value = m[1].replace(/<!--[\s\S]*$/, "").trim();
  if (value.includes("|")) return NO_TIER; // the template's unfilled list of tiers
  return value.replace(/[`*.]/g, "").trim().toLowerCase();
};

// The content under `## <heading>`, up to the next heading of the same or a higher level -
// so a section whose body opens with a `###` sub-heading still counts as filled. HTML
// comments are stripped first: the shipped template's sections are comment-only, and a
// section carrying nothing but the template's instructions is an empty section.
const sectionIsFilled = (body, heading) => {
  const re = new RegExp(`^##\\s+${escapeRe(heading)}\\b.*$`, "im");
  const at = body.search(re);
  if (at < 0) return false;
  const after = body.slice(at).replace(/^.*\n?/, "");
  const end = after.search(/^#{1,2}\s/m);
  const inner = (end < 0 ? after : after.slice(0, end)).replace(/<!--[\s\S]*?-->/g, "");
  return inner.trim().length > 0;
};

const thin = [];
const untiered = [];
for (const f of files.filter(isCapSpec)) {
  let body;
  try { body = readFileSync(f, "utf8"); } catch { continue; }
  const tier = tierOf(body);
  // A named sub-spec (`specs/<cap>/<name>.md`) extends the capability's spec rather than
  // repeating it, so it is held to the tier only when it claims one itself.
  if (tier === NO_TIER) {
    if (/\/spec\.md$/.test(f)) untiered.push(f);
    continue;
  }
  if (tier !== "buildable") continue;
  const missing = BUILDABLE_SECTIONS.filter((s) => !sectionIsFilled(body, s));
  if (missing.length) thin.push({ file: f, missing });
}

// --- check 5 (warn only): committed engine scaffolding - ephemeral by rule -------
// plan.md/tasks.md are working scaffolds the engine writes and the close removes.
// Full-tree mode only (mid-work diffs legitimately carry them); never a violation.
const staleScaffolding = !staged && !base ? files.filter((f) => ENGINE_ARTIFACTS.test(f)) : [];

// --- report --------------------------------------------------------------------
if (staleScaffolding.length) {
  console.error("\nspec-structure: WARN - engine scaffolding is committed (ephemeral - remove when the work closes):");
  for (const f of staleScaffolding) console.error(`  - ${f}`);
  console.error("");
}
if (untiered.length) {
  console.error("\nspec-structure: WARN - capability specs that declare no `**Spec tier:**` (R9 makes buildable the default):");
  for (const f of untiered) console.error(`  - ${f}`);
  console.error("Declare `buildable` (and carry its required sections) or `behavioral` (and justify it).");
  console.error("");
}
if (gateMissing) {
  console.error(`\nspec-structure: note - the clarify gate is not installed at ${gatePath},`);
  console.error("so a spec claiming `ready-to-develop` or `live` cannot be checked against it. Ship");
  console.error("`scripts/spec/` with the guards (it is a required manifest entry) to turn the check on.");
}
if (numbered.length === 0 && personaless.length === 0 && unearned.length === 0 && thin.length === 0 && !rosterMissing && !rosterHeadingMissing) {
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

if (thin.length) {
  console.error("\nspec-structure: buildable-tier specs missing the sections that make them buildable (R9):");
  for (const { file, missing } of thin) {
    console.error(`  - ${file}   missing: ${missing.map((s) => `## ${s}`).join(", ")}`);
  }
  console.error("\nA buildable spec carries its contracts: the data it owns, the interface it exposes, and");
  console.error("acceptance criteria concrete enough to become tests. A section that genuinely does not");
  console.error('apply keeps its heading and says so in one line ("None - this capability persists nothing"),');
  console.error("the same way `## Open questions` says \"None known.\" - a dropped heading and an empty one");
  console.error("read identically to everyone downstream. If the capability really cannot be specified to");
  console.error("that depth, declare `**Spec tier:** behavioral` and justify it in the spec (R9).");
}

if (unearned.length) {
  console.error("\nspec-structure: specs claiming a status the clarify gate does not grant:");
  for (const { file, status, why } of unearned) {
    console.error(`  - ${file}   says \`${status}\``);
    console.error(why.split("\n").map((l) => `        ${l}`).join("\n"));
  }
  console.error("\n`ready-to-develop` and `live` assert that the gate passed. They are earned mechanically,");
  console.error("not typed in: fix what the gate names, or set the status back to `in-refinement` - which is");
  console.error("a healthy state and can last weeks. A status nothing checks is a status nobody can trust.");
}

if (rosterHeadingMissing) {
  console.error(`\nspec-structure: ${personasPath} has no '## The roster' section, so the guard cannot tell`);
  console.error("a live persona from a name in the worked example, and the persona gate (ADR-006) has");
  console.error("nothing to check against. Add the heading above the roster table. It is syntax - it stays");
  console.error("'## The roster' even when the personas themselves are written in another language, because");
  console.error("a translated heading does not make the check speak that language, it makes it read the");
  console.error("whole file and pass a spec that serves an example.");
}

if (rosterMissing) {
  console.error("\nspec-structure: capability specs exist but there is no docs/personas.md roster -");
  console.error("the persona gate (ADR-006) has nothing to check against. Write the roster first;");
  console.error("a spec that serves nobody is incomplete, and without the roster none can prove otherwise.");
}
console.error("");
process.exit(block ? 1 : 0);
