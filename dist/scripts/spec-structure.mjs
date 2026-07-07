#!/usr/bin/env node
// Spec-structure guard.
//
// Fails when a spec path uses the forbidden ticket-numbered folder/file pattern
// (`specs/<NNN-feature>/` or `specs/<cap>/<NNN-...>`) - e.g. a leaked GitHub Spec
// Kit `specs/001-core/` folder. Capability specs live at `specs/<capability>/spec.md`
// (or named sub-specs `specs/<capability>/<name>.md`) - domain names, never numbers.
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

const args = process.argv.slice(2);
const staged = args.includes("--staged");
const block = args.includes("--block");
const baseIdx = args.indexOf("--base");
const base = baseIdx >= 0 ? args[baseIdx + 1] : null;

const sh = (c) => execSync(c, { encoding: "utf8" }).trim();

let raw;
if (staged) raw = sh("git diff --cached --name-only --diff-filter=ACMR -- specs");
else if (base) raw = sh(`git diff --name-only --diff-filter=ACMR ${base}...HEAD -- specs`);
else raw = sh("git ls-files specs");
const files = raw.split("\n").filter(Boolean).filter((f) => f.startsWith("specs/"));

// A ticket-numbered segment: two or more leading digits then - or _ (Spec Kit's
// NNN-feature). Catches specs/001-booking/, specs/cms/001-core, specs/x/017-change.md.
const NUMBERED = /^\d{2,}[-_]/;

const violations = [];
for (const f of files) {
  const segment = f.split("/").slice(1).find((s) => NUMBERED.test(s));
  if (segment) violations.push({ file: f, segment });
}

if (violations.length === 0) {
  console.log(`spec-structure: OK (${files.length} spec paths)`);
  process.exit(0);
}

console.error("\nspec-structure: ticket-numbered spec paths are forbidden - use capability names:");
for (const v of violations) {
  console.error(`  - ${v.file}   ('${v.segment}' -> a capability name, e.g. specs/<capability>/spec.md)`);
}
console.error("\nCapability specs are organized by domain, not by ticket/feature number.");
console.error("A leaked 'NNN-' folder usually means Spec Kit's native /speckit-specify created it;");
console.error("create or edit capability specs with /spec-update instead.\n");
process.exit(block ? 1 : 0);
