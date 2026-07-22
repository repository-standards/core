#!/usr/bin/env node
// reflect - keep dist/ (the assembled real-repo skeleton) in sync with the source
// concern folders, and prove it has not drifted (ENG-1).
//
// The repo is maintained BY CONCERN under standard/ (agents/ claude/ decision-records/
// docs/ github/ gitleaks/ skills/ specs/ + the manifest) - zone 2 of ADR-008. dist/ is the SAME standard assembled at
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
  ["standard/SPEC.md", "dist/SPEC.md"],
  ["standard/specs/self-verify.mjs", "dist/scripts/self-verify.mjs"],
  ["standard/specs/spec-structure.mjs", "dist/scripts/spec-structure.mjs"],
  ["standard/specs/spec-guard.mjs", "dist/scripts/spec-guard.mjs"],
  ["standard/specs/capability-map.example.json", "dist/specs/capability-map.example.json"],
  ["standard/specs/capability-spec.template.md", "dist/specs/capability-spec.template.md"],
  ["standard/specs/constitution.template.md", "dist/specs/constitution.template.md"],
  ["standard/specs/spec-kit-setup.md", "dist/specs/spec-kit-setup.md"],
  ["standard/docs/PRINCIPLES.template.md", "dist/docs/PRINCIPLES.md"],
  ["standard/docs/PRODUCT.template.md", "dist/docs/PRODUCT.md"],
  ["standard/docs/backlog.template.md", "dist/docs/backlog.md"],
  ["standard/docs/changelog-process.md", "dist/docs/changelog-process.md"],
  ["standard/docs/adoption.md", "dist/docs/adoption.md"],
  ["standard/docs/ideas/README.md", "dist/docs/ideas/README.md"],
  ["standard/docs/ideas/_template.md", "dist/docs/ideas/_template.md"],
  ["standard/docs/analytics.template.md", "dist/docs/analytics.template.md"],
  ["standard/docs/research/README.md", "dist/docs/research/README.md"],
  ["standard/docs/research/_template.md", "dist/docs/research/_template.md"],
  ["standard/docs/journeys/README.md", "dist/docs/journeys/README.md"],
  ["standard/docs/journeys/_template.md", "dist/docs/journeys/_template.md"],
  ["standard/docs/repo-assessment.md", "dist/docs/repo-assessment.md"],
  ["standard/docs/self-verify.md", "dist/docs/self-verify.md"],
  ["standard/docs/taxonomy.md", "dist/docs/taxonomy.md"],
  ["standard/docs/ways-of-working.md", "dist/docs/ways-of-working.md"],
  ["standard/claude/settings.baseline.json", "dist/.claude/settings.json"],
  ["standard/github/pull_request_template.md", "dist/.github/pull_request_template.md"],
  ["standard/github/workflows/gitleaks.yml", "dist/.github/workflows/gitleaks.yml"],
  ["standard/github/workflows/spec-guard.yml", "dist/.github/workflows/spec-guard.yml"],
  ["standard/gitleaks/.gitleaks.toml", "dist/.gitleaks.toml"],
  ["standard/standard.manifest.json", "dist/standard.manifest.json"],
  ["changes/README.md", "dist/changes/README.md"],
  ["standard/decision-records/adr/_template.md", "dist/docs/decision-records/adr/_template.md"],
  ["standard/decision-records/bdr/README.md", "dist/docs/decision-records/bdr/README.md"],
  ["standard/decision-records/bdr/_template.md", "dist/docs/decision-records/bdr/_template.md"],
  ["standard/spec-kit/LICENSE", "dist/.specify/LICENSE"],
  ["standard/spec-kit/scripts/bash/check-spec-clarified.sh", "dist/.specify/scripts/bash/check-spec-clarified.sh"],
  ["standard/spec-kit/scripts/bash/common.sh", "dist/.specify/scripts/bash/common.sh"],
  ["standard/spec-kit/scripts/bash/create-new-feature.sh", "dist/.specify/scripts/bash/create-new-feature.sh"],
  ["standard/spec-kit/scripts/bash/setup-plan.sh", "dist/.specify/scripts/bash/setup-plan.sh"],
];
// skills: lifecycle skills ship (copy); transition skills NEVER ship (ADR-009) - they are
// the standard repo's own utility, run by the agent pointing at this repo (greenfield-start
// even runs before the target repo exists). Guarded as source-only below.
const TRANSITION_SKILLS = new Set(["align-to-standards", "onboard-repo", "modernize", "greenfield-start"]);
for (const name of readdirSync("standard/skills")) {
  if (!existsSync(`standard/skills/${name}/SKILL.md`)) continue;
  if (TRANSITION_SKILLS.has(name)) continue;
  COPY.push([`standard/skills/${name}/SKILL.md`, `dist/.claude/skills/${name}/SKILL.md`]);
}

// divergent: dist differs on purpose. {src, dist, reason}
const DIVERGENT = [
  { src: "standard/docs/AGENTS.template.md", dist: "dist/AGENTS.md", reason: "template -> the real entry point (placeholders resolved, .template dropped)" },
  { src: "standard/docs/ARCHITECTURE.template.md", dist: "dist/docs/ARCHITECTURE.md", reason: "template -> a filled example for a real repo" },
  { src: "standard/docs/README.template.md", dist: "dist/docs/README.md", reason: "template -> the shipped docs index" },
  { src: "standard/docs/personas.template.md", dist: "dist/docs/personas.md", reason: "template -> a filled personas roster for a real repo" },
  { src: "CONTRIBUTING.md", dist: "dist/CONTRIBUTING.md", reason: "the repo's own CONTRIBUTING vs the shipped template" },
  { src: "standard/specs/README.md", dist: "dist/specs/README.md", reason: "dist adds a 'Where the pieces are' orientation section for a real repo" },
  { src: "standard/specs/commands.md", dist: "dist/specs/commands.md", reason: "dist points at the shipped ../.claude/skills/ implementations" },
  { src: "standard/specs/enforcement.md", dist: "dist/specs/enforcement.md", reason: "dist adds a 'Shipped' section listing the installed guards" },
  { src: "standard/agents/conventions.md", dist: "dist/docs/conventions.md", reason: "links rewritten for the dist layout; dist trails source on the new Docs section (sync pending)" },
  { src: "standard/decision-records/README.md", dist: "dist/docs/decision-records/README.md", reason: "links rewritten for the dist layout" },
  { src: "standard/decision-records/checklist.md", dist: "dist/docs/decision-records/checklist.md", reason: "links rewritten (../specs -> ../../specs) and the source-only ADR link de-linked" },
  { src: "standard/decision-records/adr/README.md", dist: "dist/docs/decision-records/adr/README.md", reason: "source lists this repo's own records; dist ships the empty index for a consuming repo" },
  { src: "standard/spec-kit/scripts/bash/check-prerequisites.sh", dist: "dist/.specify/scripts/bash/check-prerequisites.sh", reason: "render bakes /speckit.* command names (upstream installer parity)" },
  { src: "standard/spec-kit/scripts/bash/setup-tasks.sh", dist: "dist/.specify/scripts/bash/setup-tasks.sh", reason: "render bakes /speckit.* command names (upstream installer parity)" },
  { src: "standard/spec-kit/templates/plan-template.md", dist: "dist/.specify/templates/plan-template.md", reason: "render resolves upstream tokens" },
  { src: "standard/spec-kit/templates/tasks-template.md", dist: "dist/.specify/templates/tasks-template.md", reason: "render resolves upstream tokens" },
  { src: "standard/spec-kit/templates/checklist-template.md", dist: "dist/.specify/templates/checklist-template.md", reason: "render resolves upstream tokens" },
  { src: "standard/spec-kit/commands/specify.md", dist: "dist/.claude/skills/speckit-specify/SKILL.md", reason: "vendored engine command rendered as a skill (frontmatter + provenance note)" },
  { src: "standard/spec-kit/commands/clarify.md", dist: "dist/.claude/skills/speckit-clarify/SKILL.md", reason: "vendored engine command rendered as a skill (frontmatter + provenance note)" },
  { src: "standard/spec-kit/commands/plan.md", dist: "dist/.claude/skills/speckit-plan/SKILL.md", reason: "vendored engine command rendered as a skill (frontmatter + provenance note)" },
  { src: "standard/spec-kit/commands/tasks.md", dist: "dist/.claude/skills/speckit-tasks/SKILL.md", reason: "vendored engine command rendered as a skill (frontmatter + provenance note)" },
  { src: "standard/spec-kit/commands/analyze.md", dist: "dist/.claude/skills/speckit-analyze/SKILL.md", reason: "vendored engine command rendered as a skill (frontmatter + provenance note)" },
  { src: "standard/spec-kit/commands/checklist.md", dist: "dist/.claude/skills/speckit-checklist/SKILL.md", reason: "vendored engine command rendered as a skill (frontmatter + provenance note)" },
  { src: "standard/spec-kit/commands/constitution.md", dist: "dist/.claude/skills/speckit-constitution/SKILL.md", reason: "vendored engine command rendered as a skill (frontmatter + provenance note)" },
  { src: "standard/spec-kit/commands/converge.md", dist: "dist/.claude/skills/speckit-converge/SKILL.md", reason: "vendored engine command rendered as a skill (frontmatter + provenance note)" },
  { src: "standard/spec-kit/commands/implement.md", dist: "dist/.claude/skills/speckit-implement/SKILL.md", reason: "vendored engine command rendered as a skill (frontmatter + provenance note)" },
  { src: "standard/spec-kit/commands/taskstoissues.md", dist: "dist/.claude/skills/speckit-taskstoissues/SKILL.md", reason: "vendored engine command rendered as a skill (frontmatter + provenance note)" },
];

// authored-only: dist files with no source.
const AUTHORED_ONLY = [
  { dist: "dist/CLAUDE.md", reason: "thin Claude pointer to AGENTS.md, dist-only" },
  { dist: "dist/.nvmrc", reason: "stack version pin, a dist-only placeholder" },
  { dist: "dist/README.md", reason: "the shipped repo's own README (the source-root README is the product front-door, a different document)" },
  { dist: "dist/.specify/README.md", reason: "generated pointer for the engine's shared runtime" },
];

// source-only: never shipped. dist must NOT contain the reflected path.
const SOURCE_ONLY = [
  { src: "standard/decision-records/adr/ADR-001-decision-record-policy.md", dist: "dist/docs/decision-records/adr/ADR-001-decision-record-policy.md" },
  { src: "standard/decision-records/adr/ADR-002-specs-by-capability.md", dist: "dist/docs/decision-records/adr/ADR-002-specs-by-capability.md" },
  { src: "standard/decision-records/adr/ADR-003-specs-buildable-not-descriptive.md", dist: "dist/docs/decision-records/adr/ADR-003-specs-buildable-not-descriptive.md" },
  { src: "standard/decision-records/adr/ADR-004-standard-decisions-by-reference.md", dist: "dist/docs/decision-records/adr/ADR-004-standard-decisions-by-reference.md" },
  { src: "standard/decision-records/adr/ADR-005-align-engine-is-a-manifest.md", dist: "dist/docs/decision-records/adr/ADR-005-align-engine-is-a-manifest.md" },
  { src: "standard/decision-records/adr/ADR-006-personas-are-a-validation-gate.md", dist: "dist/docs/decision-records/adr/ADR-006-personas-are-a-validation-gate.md" },
  { src: "standard/decision-records/adr/ADR-007-modernize-is-plan-then-refactor.md", dist: "dist/docs/decision-records/adr/ADR-007-modernize-is-plan-then-refactor.md" },
  { src: "standard/decision-records/adr/ADR-008-standard-repo-three-zones.md", dist: "dist/docs/decision-records/adr/ADR-008-standard-repo-three-zones.md" },
  { src: "standard/decision-records/adr/ADR-009-skills-lifecycle-vs-transition.md", dist: "dist/docs/decision-records/adr/ADR-009-skills-lifecycle-vs-transition.md" },
  { src: "standard/decision-records/adr/ADR-010-artifact-lifecycle-and-tracker.md", dist: "dist/docs/decision-records/adr/ADR-010-artifact-lifecycle-and-tracker.md" },
  { src: "standard/decision-records/adr/ADR-011-one-standard-two-profiles.md", dist: "dist/docs/decision-records/adr/ADR-011-one-standard-two-profiles.md" },
  { src: "standard/skills/align-to-standards/SKILL.md", dist: "dist/.claude/skills/align-to-standards/SKILL.md" },
  { src: "standard/skills/onboard-repo/SKILL.md", dist: "dist/.claude/skills/onboard-repo/SKILL.md" },
  { src: "standard/skills/modernize/SKILL.md", dist: "dist/.claude/skills/modernize/SKILL.md" },
  { src: "standard/skills/greenfield-start/SKILL.md", dist: "dist/.claude/skills/greenfield-start/SKILL.md" },
  { src: "standard/spec-kit/README.md", dist: "dist/.specify/README-source.md" },
  { src: "standard/decision-records/adr/ADR-012-in-repo-instructions-are-the-source-of-truth.md", dist: "dist/docs/decision-records/adr/ADR-012-in-repo-instructions-are-the-source-of-truth.md" },
  { src: "standard/decision-records/adr/ADR-013-spec-kit-is-an-engine-by-reference.md", dist: "dist/docs/decision-records/adr/ADR-013-spec-kit-is-an-engine-by-reference.md" },
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
