#!/usr/bin/env node
// Spec-policy coupling guard.
//
// Flags when code in a capability's domain changed without touching that
// capability's spec - the mechanical half of the spec policy ("conscious spec
// review", rule 7). It cannot prove the spec is correct; it forces the author to
// touch the spec or consciously decide not to.
//
// Reads specs/capability-map.json:  { "<capability>": ["<glob>", ...], ... }
//
// Usage:
//   node scripts/spec-guard.mjs --staged          # pre-commit (staged files), warn only
//   node scripts/spec-guard.mjs --base <ref>      # CI (diff vs base ref)
//   add --block to exit non-zero on a violation (default: warn, exit 0)
//
// No dependencies (Node built-ins only).

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const staged = args.includes("--staged");
const block = args.includes("--block");
const baseIdx = args.indexOf("--base");
const base = baseIdx >= 0 ? args[baseIdx + 1] : null;

const MAP = "specs/capability-map.json";
if (!existsSync(MAP)) {
  console.log(`spec-guard: ${MAP} not found - skipping (author it to enable the guard)`);
  process.exit(0);
}

const sh = (c) => execSync(c, { encoding: "utf8" }).trim();
const map = JSON.parse(readFileSync(MAP, "utf8"));

let raw;
if (staged) raw = sh("git diff --cached --name-only --diff-filter=ACMR");
else if (base) raw = sh(`git diff --name-only --diff-filter=ACMR ${base}...HEAD`);
else raw = sh("git diff --name-only --diff-filter=ACMR HEAD");
const files = raw.split("\n").filter(Boolean);

// minimal glob -> regexp: ** = any path, * = within a segment
const toRe = (glob) =>
  new RegExp(
    "^" +
      glob
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, " ")
        .replace(/\*/g, "[^/]*")
        .replace(/ /g, ".*") +
      "$",
  );

const violations = [];
for (const [cap, globs] of Object.entries(map)) {
  const res = globs.map(toRe);
  const codeTouched = files.some((f) => !f.startsWith("specs/") && res.some((re) => re.test(f)));
  const specTouched = files.some((f) => f.startsWith(`specs/${cap}/`));
  if (codeTouched && !specTouched) violations.push(cap);
}

if (violations.length === 0) {
  console.log("spec-guard: OK");
  process.exit(0);
}

console.error("\nspec-guard: code changed in these capabilities without a spec update:");
for (const v of violations) console.error(`  - ${v}   (update specs/${v}/ or state why no change is needed)`);
console.error("");
process.exit(block ? 1 : 0);
