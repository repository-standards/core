#!/usr/bin/env node
// reflect - keep dist/ (the assembled real-repo skeleton) in sync with the source
// concern folders, and prove it has not drifted (ENG-1).
//
// The repo is maintained BY CONCERN (agents/ claude/ decision-records/ docs/ github/
// gitleaks/ skills/ specs/ + a few root files). dist/ is the SAME standard assembled at
// real-repo paths (AGENTS.md, .claude/, .github/, docs/, specs/, scripts/, ...). That
// reflection used to be done by hand - and hand-maintained snapshots drift. This encodes
// the mapping once, so drift becomes a checkable number, not a surprise.
//
// The mapping has four classes:
//   copy         - dist must be BYTE-IDENTICAL to source (guards, skills, most docs, the
//                  manifest). These are what --write syncs and --check byte-compares.
//   divergent    - dist differs from source ON PURPOSE (template -> real, link paths
//                  rewritten for the dist layout, or a dist-only authored section). Each
//                  carries a reason. --check asserts both ends exist; it does NOT
//                  byte-compare (the transform is not yet mechanized) and never overwrites.
//   authored-only- a dist file with no source at all (thin pointers, stack pins).
//   source-only  - a source file intentionally NOT shipped (the standard's own ADRs, this
//                  tool). --check asserts it did NOT leak into dist.
//
// Usage:
//   node tools/reflect.mjs            # --check: report drift, exit 1 if any
//   node tools/reflect.mjs --write    # copy source -> dist for the copy class only
//   node tools/reflect.mjs --check    # explicit check (default)
//
// No dependencies (Node built-ins only). Source-only - not shipped to dist/.

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from "node:fs";
import { dirname } from "node:path";

const write = process.argv.includes("--write");

// --- the mapping -----------------------------------------------------------------

// copy: [source, dist] - dist must be byte-identical to source.
const COPY = [
  ["specs/self-verify.mjs", "dist/scripts/self-verify.mjs"],
  ["specs/spec-structure.mjs", "dist/scripts/spec-structure.mjs"],
  ["specs/spec-guard.mjs", "dist/scripts/spec-guard.mjs"],
  ["specs/capability-map.example.json", "dist/specs/capability-map.example.json"],
  ["specs/capability-spec.template.md", "dist/specs/capability-spec.template.md"],
  ["specs/constitution.template.md", "dist/specs/constitution.template.md"],
  ["specs/spec-kit-setup.md", "dist/specs/spec-kit-setup.md"],
  ["docs/PRINCIPLES.template.md", "dist/docs/PRINCIPLES.md"],
  ["docs/PRODUCT.template.md", "dist/docs/PRODUCT.md"],
  ["docs/backlog.template.md", "dist/docs/backlog.md"],
  ["docs/changelog-process.md", "dist/docs/changelog-process.md"],
  ["docs/repo-assessment.md", "dist/docs/repo-assessment.md"],
  ["docs/self-verify.md", "dist/docs/self-verify.md"],
  ["docs/taxonomy.md", "dist/docs/taxonomy.md"],
  ["docs/ways-of-working.md", "dist/docs/ways-of-working.md"],
  ["claude/settings.baseline.json", "dist/.claude/settings.json"],
  ["github/pull_request_template.md", "dist/.github/pull_request_template.md"],
  ["github/workflows/gitleaks.yml", "dist/.github/workflows/gitleaks.yml"],
  ["github/workflows/spec-guard.yml", "dist/.github/workflows/spec-guard.yml"],
  ["gitleaks/.gitleaks.toml", "dist/.gitleaks.toml"],
  ["standard.manifest.json", "dist/standard.manifest.json"],
  ["changes/README.md", "dist/changes/README.md"],
  ["decision-records/adr/README.md", "dist/docs/decision-records/adr/README.md"],
  ["decision-records/adr/_template.md", "dist/docs/decision-records/adr/_template.md"],
  ["decision-records/bdr/README.md", "dist/docs/decision-records/bdr/README.md"],
  ["decision-records/bdr/_template.md", "dist/docs/decision-records/bdr/_template.md"],
];
// skills: every skills/<name>/SKILL.md -> dist/.claude/skills/<name>/SKILL.md (copy)
for (const name of readdirSync("skills")) {
  if (existsSync(`skills/${name}/SKILL.md`)) COPY.push([`skills/${name}/SKILL.md`, `dist/.claude/skills/${name}/SKILL.md`]);
}

// divergent: dist differs on purpose. {src, dist, reason}
const DIVERGENT = [
  { src: "docs/AGENTS.template.md", dist: "dist/AGENTS.md", reason: "template -> the real entry point (placeholders resolved, .template dropped)" },
  { src: "docs/ARCHITECTURE.template.md", dist: "dist/docs/ARCHITECTURE.md", reason: "template -> a filled example for a real repo" },
  { src: "docs/README.template.md", dist: "dist/docs/README.md", reason: "template -> the shipped docs index" },
  { src: "docs/personas.template.md", dist: "dist/docs/personas.md", reason: "template -> a filled personas roster for a real repo" },
  { src: "CONTRIBUTING.md", dist: "dist/CONTRIBUTING.md", reason: "the repo's own CONTRIBUTING vs the shipped template" },
  { src: "specs/README.md", dist: "dist/specs/README.md", reason: "dist adds a 'Where the pieces are' orientation section for a real repo" },
  { src: "specs/commands.md", dist: "dist/specs/commands.md", reason: "dist points at the shipped ../.claude/skills/ implementations" },
  { src: "specs/enforcement.md", dist: "dist/specs/enforcement.md", reason: "dist adds a 'Shipped' section listing the installed guards" },
  { src: "agents/conventions.md", dist: "dist/docs/conventions.md", reason: "links rewritten for the dist layout; dist trails source on the new Docs section (sync pending)" },
  { src: "decision-records/README.md", dist: "dist/docs/decision-records/README.md", reason: "links rewritten for the dist layout" },
  { src: "decision-records/catalog.md", dist: "dist/docs/decision-records/catalog.md", reason: "links rewritten (../specs -> ../../specs) and the source-only ADR link de-linked" },
];

// authored-only: dist files with no source.
const AUTHORED_ONLY = [
  { dist: "dist/CLAUDE.md", reason: "thin Claude pointer to AGENTS.md, dist-only" },
  { dist: "dist/.nvmrc", reason: "stack version pin, a dist-only placeholder" },
  { dist: "dist/README.md", reason: "the shipped repo's own README (the source-root README is the product front-door, a different document)" },
];

// source-only: never shipped. dist must NOT contain the reflected path.
const SOURCE_ONLY = [
  { src: "decision-records/adr/ADR-001-decision-record-policy.md", dist: "dist/docs/decision-records/adr/ADR-001-decision-record-policy.md" },
  { src: "decision-records/adr/ADR-002-specs-by-capability.md", dist: "dist/docs/decision-records/adr/ADR-002-specs-by-capability.md" },
  { src: "decision-records/adr/ADR-003-specs-buildable-not-descriptive.md", dist: "dist/docs/decision-records/adr/ADR-003-specs-buildable-not-descriptive.md" },
  { src: "decision-records/adr/ADR-004-standard-decisions-by-reference.md", dist: "dist/docs/decision-records/adr/ADR-004-standard-decisions-by-reference.md" },
  { src: "decision-records/adr/ADR-005-align-engine-is-a-manifest.md", dist: "dist/docs/decision-records/adr/ADR-005-align-engine-is-a-manifest.md" },
];

// --- walk dist for the orphan check ----------------------------------------------
const walk = (dir, acc = []) => {
  for (const e of readdirSync(dir)) {
    const p = `${dir}/${e}`;
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
};

// --- run -------------------------------------------------------------------------
const problems = [];
const ok = [];

if (write) {
  let n = 0;
  for (const [src, dist] of COPY) {
    if (!existsSync(src)) { problems.push(["SRC-MISSING", `${src} (copy) has no source to write from`]); continue; }
    const body = readFileSync(src);
    if (!existsSync(dist) || !readFileSync(dist).equals(body)) {
      mkdirSync(dirname(dist), { recursive: true });
      writeFileSync(dist, body);
      console.log(`  wrote  ${dist}`);
      n++;
    }
  }
  console.log(`\nreflect --write: synced ${n} copy-class file(s) from source to dist.\n`);
  process.exit(0);
}

// check mode
const accounted = new Set();
for (const [src, dist] of COPY) {
  accounted.add(dist);
  if (!existsSync(src)) problems.push(["SRC-MISSING", `${src} -> ${dist}`]);
  else if (!existsSync(dist)) problems.push(["DIST-MISSING", `${dist} (copy of ${src})`]);
  else if (!readFileSync(src).equals(readFileSync(dist))) problems.push(["DRIFT", `${dist} differs from ${src} (copy class - run --write)`]);
  else ok.push(`copy       ${dist}`);
}
for (const { src, dist, reason } of DIVERGENT) {
  accounted.add(dist);
  if (!existsSync(src)) problems.push(["SRC-MISSING", `${src} (divergent)`]);
  else if (!existsSync(dist)) problems.push(["DIST-MISSING", `${dist} (divergent from ${src})`]);
  else ok.push(`divergent  ${dist}  - ${reason}`);
}
for (const { dist, reason } of AUTHORED_ONLY) {
  accounted.add(dist);
  if (!existsSync(dist)) problems.push(["DIST-MISSING", `${dist} (authored-only)`]);
  else ok.push(`authored   ${dist}  - ${reason}`);
}
for (const { dist } of SOURCE_ONLY) {
  if (existsSync(dist)) problems.push(["LEAK", `${dist} is source-only but present in dist`]);
  else ok.push(`source-only (correctly absent from dist)  ${dist}`);
}
// orphans: any dist file not accounted for
for (const f of walk("dist")) {
  if (!accounted.has(f)) problems.push(["ORPHAN", `${f} is in dist but not declared in reflect.mjs (map it, or add to authored-only)`]);
}

// report
console.log(`\nreflect --check - dist/ vs source (${COPY.length} copy, ${DIVERGENT.length} divergent, ${AUTHORED_ONLY.length} authored, ${SOURCE_ONLY.length} source-only)\n`);
for (const line of ok) console.log(`  ok    ${line}`);
console.log("");
if (problems.length === 0) {
  console.log(`reflect: OK - drift 0 - dist/ reflects source\n`);
  process.exit(0);
}
for (const [kind, msg] of problems) console.log(`  ${kind.padEnd(12)} ${msg}`);
console.error(`\nreflect: drift ${problems.length} - ${problems.length} reflection problem(s)\n`);
process.exit(1);
