#!/usr/bin/env node
// provenance-check - every file in the vendored spec engine names where it came from.
//
// specs/spec-engine/spec.md's Requirements: every extracted file under scripts/spec/ or a
// spec-* skill must carry a provenance line naming github/spec-kit v0.13.2, with
// standard-authored/patched files marked PATCHED(repository-standards). Its Acceptance
// criteria: "GIVEN any file under scripts/spec/ or a spec-* skill WHEN inspected THEN it
// carries an upstream provenance line or a PATCHED marker." Five files drifted with no
// marker at all and nothing caught it - this is the mechanical catch.
//
// Checks two known substrings anywhere in the file: "github/spec-kit v0.13.2" (the
// upstream provenance line) or "PATCHED(repository-standards)" (a standard-authored or
// patched hunk, including a whole file that is NOT upstream at all). Either satisfies the
// acceptance criterion; a file carrying neither is undocumented drift.
//
// standard/scripts/spec/LICENSE is the upstream licence text itself, not an extracted
// file, and is exempt by name.
//
// Usage: node tools/provenance-check.mjs        # exit 1 on any missing marker
//        node tools/provenance-check.mjs --self # run the built-in cases instead
// Zone 1 tooling - never shipped.

import { readFileSync, readdirSync } from "node:fs";

const UPSTREAM = "github/spec-kit v0.13.2";
const PATCHED = "PATCHED(repository-standards)";
const EXEMPT = new Set(["LICENSE"]);

// Returns { ok, why } for one file's content.
export function checkProvenance(content) {
  if (content.includes(UPSTREAM)) return { ok: true, why: "upstream provenance line" };
  if (content.includes(PATCHED)) return { ok: true, why: "PATCHED marker" };
  return { ok: false, why: "carries neither an upstream provenance line nor a PATCHED marker" };
}

function specEngineFiles() {
  const scriptsDir = "standard/scripts/spec";
  const scriptFiles = readdirSync(scriptsDir, { withFileTypes: true })
    .filter((e) => e.isFile() && !EXEMPT.has(e.name))
    .map((e) => `${scriptsDir}/${e.name}`);

  const skillsRoot = "standard/.claude/skills";
  const skillFiles = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("spec-"))
    .map((e) => `${skillsRoot}/${e.name}/SKILL.md`);

  return [...scriptFiles, ...skillFiles];
}

const CASES = [
  ["upstream provenance line", "#!/usr/bin/env bash\n# Based on github/spec-kit v0.13.2 (MIT).\n", true],
  ["PATCHED marker on a standard-authored file", "<!-- PATCHED(repository-standards): not upstream -->\n", true],
  ["both markers present", "# github/spec-kit v0.13.2\n# PATCHED(repository-standards): ADR-010\n", true],
  ["neither marker - the drifted case", "#!/usr/bin/env bash\nset -e\necho hi\n", false],
  ["a bare mention of spec-kit without the version is not enough", "# uses spec-kit under the hood\n", false],
];

function self() {
  let bad = 0;
  for (const [name, content, expectedOk] of CASES) {
    const { ok } = checkProvenance(content);
    const pass = ok === expectedOk;
    if (!pass) bad++;
    console.log(`  ${pass ? "ok  " : "FAIL"}  ${name} (got ${ok}, expected ${expectedOk})`);
  }
  console.log(
    bad
      ? `\nprovenance-check --self: FAIL - ${bad} case(s)`
      : `\nprovenance-check --self: OK - ${CASES.length} cases`,
  );
  process.exit(bad ? 1 : 0);
}

function main() {
  const files = specEngineFiles();
  const missing = [];

  for (const file of files) {
    const { ok, why } = checkProvenance(readFileSync(file, "utf8"));
    if (!ok) missing.push(`${file}: ${why}`);
  }

  if (missing.length) {
    for (const m of missing) console.log(`  FAIL  ${m}`);
    console.log(`\nprovenance-check: FAIL - ${missing.length} file(s) with no provenance marker`);
    console.log(`  Add a "${UPSTREAM}" line if the file is upstream, or a "${PATCHED}" comment`);
    console.log("  naming the ADR/reason if it is standard-authored or patched.");
    process.exit(1);
  }
  console.log(`provenance-check: OK - ${files.length} spec-engine file(s), each carries a provenance marker`);
}

if (process.argv.includes("--self")) self();
else main();
