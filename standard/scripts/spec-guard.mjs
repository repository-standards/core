#!/usr/bin/env node
// Spec-policy coupling guard.
//
// Flags when code in a capability's domain changed without touching that
// capability's spec - the mechanical half of the spec policy (same-PR spec
// coupling, source-of-truth rule 5). It cannot prove the spec is correct; it
// forces the author to touch the spec or consciously decide not to.
//
// Reads specs/capability-map.json:  { "<capability>": [<entry>, ...], ... }
// An entry is a glob string - every edit to a matching file couples - or
// { "glob": "<glob>", "couples": "shape" } for a JSON file the capability reads,
// where the key shape is the contract: added entries and edited values are data
// and do not couple, a key path that appears or disappears is an interpretation
// change and does. Without that distinction a data edit demands a spec update
// with nothing to write, and the cheapest way out is a cosmetic one.
//
// Two keys in that file are metadata rather than capabilities: `$about` (a note)
// and `$unclaimed` (globs for the paths that belong to no capability by decision -
// config, tooling, docs). --audit reads the second to tell code nobody claims from
// code deliberately claimed by nobody.
//
// Globs are translated by scripts/lib/glob.mjs - `**` matches zero segments as well
// as many, so `**/payment/**` covers `payment/index.ts` at the top level.
//
// Usage:
//   node scripts/spec-guard.mjs --staged          # pre-commit (staged files), warn only
//   node scripts/spec-guard.mjs --base <ref>      # CI (diff vs base ref)
//   node scripts/spec-guard.mjs --audit           # full-tree: the map is sound (see below)
//   add --block to exit non-zero on a violation (default: warn, exit 0)
//
// No dependencies (Node built-ins only). Place at scripts/spec-guard.mjs.

import { execFileSync, execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { globToRegExp } from "./lib/glob.mjs";

const args = process.argv.slice(2);
const staged = args.includes("--staged");
const block = args.includes("--block");
const audit = args.includes("--audit");
const baseIdx = args.indexOf("--base");
const base = baseIdx >= 0 ? args[baseIdx + 1] : null;

const MAP = "specs/capability-map.json";
if (!existsSync(MAP)) {
  console.log(`spec-guard: ${MAP} not found - skipping (author it to enable the guard)`);
  process.exit(0);
}

const sh = (c) => execSync(c, { encoding: "utf8" }).trim();

// git quotes any path outside ASCII by default, printing
// `"modules/x/testdata/\331\205\331\204\331\201.txt"` - quotes included. That string matches no
// glob, so --audit reports such a file as belonging to no capability and there is no glob an
// author can write to claim it. Found on a real repository (caddyserver/caddy) the first time
// the audit ran against one. Ask git for the real bytes instead.
const GIT = "git -c core.quotePath=false";
const declared = JSON.parse(readFileSync(MAP, "utf8"));

const bad = (msg) => {
  console.error(`\nspec-guard: ${MAP} - ${msg}`);
  console.error('  an entry is "<glob>" or { "glob": "<glob>", "couples": "content" | "shape" }\n');
  process.exit(1);
};

// A key starting with `$` is metadata about the map, not a capability: `$about` is a
// free note for whoever opens the file, and `$unclaimed` lists the paths that
// intentionally belong to no capability (read by --audit). An unrecognised one is
// refused rather than ignored - a misspelt `$unclaimed` that silently exempted
// nothing, or a metadata key read as a capability whose spec directory can never
// exist, are both the quiet failure this guard is for.
const META = new Set(["$about", "$unclaimed"]);
for (const k of Object.keys(declared)) {
  if (k.startsWith("$") && !META.has(k)) bad(`unknown metadata key "${k}" - the metadata keys are ${[...META].join(" and ")}`);
}
const map = Object.fromEntries(Object.entries(declared).filter(([k]) => !k.startsWith("$")));
const unclaimedGlobs = declared.$unclaimed ?? null;
if (unclaimedGlobs !== null && !Array.isArray(unclaimedGlobs)) bad('"$unclaimed" must hold a list of globs');
const parseEntry = (e, cap) => {
  if (typeof e === "string") return { glob: e, couples: "content" };
  const couples = e?.couples ?? "content";
  if (typeof e?.glob !== "string" || (couples !== "content" && couples !== "shape"))
    bad(`unusable entry under "${cap}": ${JSON.stringify(e)}`);
  return { glob: e.glob, couples };
};
const coupling = Object.fromEntries(
  Object.entries(map).map(([cap, entries]) => {
    if (!Array.isArray(entries)) bad(`"${cap}" must hold a list of entries, not ${JSON.stringify(entries)}`);
    return [cap, entries.map((e) => parseEntry(e, cap))];
  }),
);

// --audit: the map itself is sound, full-tree. Four ways it can stop meaning
// anything, all of them silent before this:
//   1. a capability spec with no map entry - it silently rots (source-of-truth rule 4)
//   2. a map entry naming a capability that has no spec
//   3. a glob that matches no file at all - the guard watches an empty set, which is
//      indistinguishable from a guard that is working
//   4. code that belongs to no capability - what a refactor leaves behind: the old
//      glob matches nothing and the new path is claimed by nobody
if (audit) {
  // A fresh degit has no .git yet - fall back to walking the filesystem, like
  // spec-structure does. A shipped guard never dumps a stack trace.
  const SKIP_DIRS = new Set(["node_modules", ".git"]);
  const fsWalk = (dir, acc = []) => {
    if (!existsSync(dir)) return acc;
    for (const e of readdirSync(dir)) {
      if (SKIP_DIRS.has(e)) continue;
      const p = `${dir}/${e}`;
      if (statSync(p).isDirectory()) fsWalk(p, acc);
      else acc.push(p.replace(/^\.\//, ""));
    }
    return acc;
  };
  const listed = (what) => {
    try {
      const out = sh(`${GIT} ls-files ${what}`).split("\n").filter(Boolean);
      if (out.length) return out;
    } catch {
      /* no git, or nothing tracked yet */
    }
    return fsWalk(what === "." ? "." : what);
  };
  const specFiles = listed("specs");
  const treeFiles = listed(".");

  const capDirs = new Set();
  for (const f of specFiles) {
    const parts = f.split("/"); // specs/<cap>/<file> -> a capability directory
    if (parts.length >= 3 && parts[0] === "specs") capDirs.add(parts[1]);
  }
  const mapped = new Set(Object.keys(map));
  const orphans = [...capDirs].filter((c) => !mapped.has(c)).sort();
  const specless = [...mapped].filter((c) => !capDirs.has(c)).sort();

  // A retired capability keeps its entry on purpose (the spec template says so):
  // the code is gone, the spec stays as the record, and deleting the entry would
  // make the spec read as an orphan. Its globs match nothing by design.
  const retired = new Set(
    [...capDirs].filter((c) =>
      specFiles
        .filter((f) => f.startsWith(`specs/${c}/`) && f.endsWith(".md"))
        .some((f) => /^\*\*Status:\*\*\s*retired\b/im.test(readFileSync(f, "utf8"))),
    ),
  );

  const emptyGlobs = [];
  for (const [cap, entries] of Object.entries(coupling)) {
    if (retired.has(cap)) continue;
    for (const e of entries) {
      const re = globToRegExp(e.glob);
      if (!treeFiles.some((f) => re.test(f))) emptyGlobs.push({ cap, glob: e.glob });
    }
  }

  // specs/ is never code: the specs are the other side of the coupling, and the map
  // lives there too. Everything else is claimed by a capability or declared.
  const claims = Object.values(coupling)
    .flat()
    .map((e) => globToRegExp(e.glob));
  const unclaimedRes = (unclaimedGlobs ?? []).map(globToRegExp);
  const unclaimed =
    unclaimedGlobs === null
      ? []
      : treeFiles.filter((f) => !f.startsWith("specs/") && !claims.some((re) => re.test(f)) && !unclaimedRes.some((re) => re.test(f)));

  const problems = orphans.length + specless.length + emptyGlobs.length + unclaimed.length;
  if (problems === 0) {
    const globCount = Object.values(coupling).flat().length;
    const claimCheck =
      unclaimedGlobs === null
        ? 'the unclaimed-code check is OFF - declare "$unclaimed" (the paths that belong to no capability) to turn it on'
        : `${treeFiles.length} files, each claimed by a capability or declared unclaimed`;
    const retiredNote = retired.size ? `; ${retired.size} retired capability/ies not checked for empty globs` : "";
    console.log(`spec-guard --audit: OK (${capDirs.size} capability specs, all mapped; ${globCount} globs, all matching; ${claimCheck}${retiredNote})`);
    process.exit(0);
  }

  console.error(`\nspec-guard --audit: ${problems} problem(s) in ${MAP}`);
  if (orphans.length) {
    console.error("\n  capability specs with no map entry (they silently rot):");
    for (const c of orphans) console.error(`    - specs/${c}/   (add "${c}": ["<code globs>"] to ${MAP})`);
  }
  if (specless.length) {
    console.error("\n  map entries naming a capability that has no spec:");
    for (const c of specless) console.error(`    - "${c}"   (write specs/${c}/spec.md, or remove the entry)`);
  }
  if (emptyGlobs.length) {
    console.error("\n  globs that match no file in the tree - the guard is watching nothing:");
    for (const { cap, glob } of emptyGlobs) console.error(`    - "${cap}": "${glob}"   (fix the glob, or drop it if the code moved)`);
  }
  if (unclaimed.length) {
    const shown = unclaimed.slice(0, 20);
    console.error(`\n  ${unclaimed.length} file(s) belong to no capability - claim them, or declare the path under "$unclaimed":`);
    for (const f of shown) console.error(`    - ${f}`);
    if (unclaimed.length > shown.length) console.error(`    ... and ${unclaimed.length - shown.length} more`);
  }
  console.error("");
  process.exit(block ? 1 : 0);
}

// D (deleted) is included deliberately: removing a capability's code entirely -
// a retirement, not an edit - is still a change that must land with a spec update
// (R11). Excluding it let a capability's code disappear with the spec never
// touched, and spec-guard reported OK on the PR that did it.
let raw;
if (staged) raw = sh(`${GIT} diff --cached --name-only --diff-filter=ACDMR`);
else if (base) raw = sh(`${GIT} diff --name-only --diff-filter=ACDMR ${base}...HEAD`);
// A file not yet added is still a change: locally the guard has to fire before
// `git add`, not only in CI where everything is tracked.
else raw = `${sh(`${GIT} diff --name-only --diff-filter=ACDMR HEAD`)}\n${sh(`${GIT} ls-files --others --exclude-standard`)}`;
const files = [...new Set(raw.split("\n").filter(Boolean))];

// The key shape of a JSON value: every key path, array indices collapsed.
// { "files": [{ "path": "a" }] } -> files, files[].path
const shapeOf = (value, prefix, acc) => {
  if (Array.isArray(value)) for (const v of value) shapeOf(v, `${prefix}[]`, acc);
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) {
      const p = prefix ? `${prefix}.${k}` : k;
      acc.add(p);
      shapeOf(v, p, acc);
    }
  return acc;
};

// No shell: a path with a space is a path, not two arguments.
const gitShow = (spec) => {
  try {
    return execFileSync("git", ["show", spec], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
};

// Read both sides of the same diff the file list came from: in --base mode that
// is the merge base, not the base tip, or an unrelated commit on the base branch
// would read as this branch's edit.
const beforeRef = base
  ? (() => {
      try {
        return sh(`git merge-base ${base} HEAD`);
      } catch {
        return base;
      }
    })()
  : "HEAD";
const afterOf = (f) => (staged ? gitShow(`:${f}`) : base ? gitShow(`HEAD:${f}`) : existsSync(f) ? readFileSync(f, "utf8") : null);

const shapeCache = new Map();
const shapeChanged = (f) => {
  if (shapeCache.has(f)) return shapeCache.get(f);
  const shape = (src) => {
    if (src === null) return null;
    try {
      return [...shapeOf(JSON.parse(src), "", new Set())].sort().join("\n");
    } catch {
      return null;
    }
  };
  const before = shape(gitShow(`${beforeRef}:${f}`));
  const now = shape(afterOf(f));
  // Added, deleted or unparseable on either side - not a data edit to vouch for.
  const changed = before === null || now === null || before !== now;
  shapeCache.set(f, changed);
  return changed;
};

const violations = [];
const dataOnly = new Set();
for (const [cap, entries] of Object.entries(coupling)) {
  const res = entries.map((e) => ({ ...e, re: globToRegExp(e.glob) }));
  const specTouched = files.some((f) => f.startsWith(`specs/${cap}/`));
  const codeTouched = files.some((f) => {
    if (f.startsWith("specs/")) return false;
    const matched = res.filter((e) => e.re.test(f));
    if (matched.length === 0) return false;
    // A content-coupled glob wins over a shape-coupled one matching the same file.
    const couples = matched.some((e) => e.couples !== "shape" || shapeChanged(f));
    if (!couples) dataOnly.add(f);
    return couples;
  });
  if (codeTouched && !specTouched) violations.push(cap);
}

// Say when the guard decided not to fire - a silent skip is indistinguishable
// from a guard that stopped working.
for (const f of [...dataOnly].sort())
  console.log(`spec-guard: note - ${f} changed as data, key shape unchanged - no spec coupling`);

if (violations.length === 0) {
  console.log("spec-guard: OK");
  process.exit(0);
}

console.error("\nspec-guard: code changed in these capabilities without a spec update:");
for (const v of violations) console.error(`  - ${v}   (update specs/${v}/ or state why no change is needed)`);
console.error("");
process.exit(block ? 1 : 0);
