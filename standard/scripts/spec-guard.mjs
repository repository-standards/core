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
// Usage:
//   node scripts/spec-guard.mjs --staged          # pre-commit (staged files), warn only
//   node scripts/spec-guard.mjs --base <ref>      # CI (diff vs base ref)
//   node scripts/spec-guard.mjs --audit           # full-tree: every specs/<cap>/ has a map entry
//   add --block to exit non-zero on a violation (default: warn, exit 0)
//
// No dependencies (Node built-ins only). Place at scripts/spec-guard.mjs.

import { execFileSync, execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";

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
const map = JSON.parse(readFileSync(MAP, "utf8"));

const bad = (msg) => {
  console.error(`\nspec-guard: ${MAP} - ${msg}`);
  console.error('  an entry is "<glob>" or { "glob": "<glob>", "couples": "content" | "shape" }\n');
  process.exit(1);
};
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

// --audit: every capability spec (a specs/<cap>/ directory) must have a map entry.
// A spec with no coupling entry silently rots (source-of-truth rule 4).
if (audit) {
  // A fresh degit has no .git yet - fall back to walking the filesystem, like
  // spec-structure does. A shipped guard never dumps a stack trace.
  const fsWalk = (dir, acc = []) => {
    if (!existsSync(dir)) return acc;
    for (const e of readdirSync(dir)) {
      const p = `${dir}/${e}`;
      if (statSync(p).isDirectory()) fsWalk(p, acc);
      else acc.push(p);
    }
    return acc;
  };
  let specFiles;
  try {
    specFiles = sh("git ls-files specs").split("\n").filter(Boolean);
    if (specFiles.length === 0) specFiles = fsWalk("specs");
  } catch {
    specFiles = fsWalk("specs");
  }
  const capDirs = new Set();
  for (const f of specFiles) {
    const parts = f.split("/"); // specs/<cap>/<file> -> a capability directory
    if (parts.length >= 3 && parts[0] === "specs") capDirs.add(parts[1]);
  }
  const mapped = new Set(Object.keys(map));
  const orphans = [...capDirs].filter((c) => !mapped.has(c)).sort();
  if (orphans.length === 0) {
    console.log(`spec-guard --audit: OK (${capDirs.size} capability specs, all mapped)`);
    process.exit(0);
  }
  console.error("\nspec-guard --audit: capability specs with no capability-map entry (they silently rot):");
  for (const c of orphans) console.error(`  - specs/${c}/   (add "${c}": ["<code globs>"] to ${MAP})`);
  console.error("");
  process.exit(block ? 1 : 0);
}

let raw;
if (staged) raw = sh("git diff --cached --name-only --diff-filter=ACMR");
else if (base) raw = sh(`git diff --name-only --diff-filter=ACMR ${base}...HEAD`);
// A file not yet added is still a change: locally the guard has to fire before
// `git add`, not only in CI where everything is tracked.
else raw = `${sh("git diff --name-only --diff-filter=ACMR HEAD")}\n${sh("git ls-files --others --exclude-standard")}`;
const files = [...new Set(raw.split("\n").filter(Boolean))];

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
  const res = entries.map((e) => ({ ...e, re: toRe(e.glob) }));
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
