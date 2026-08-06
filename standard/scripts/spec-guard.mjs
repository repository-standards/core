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
// A glob string may start with `!`, which excludes: the capability claims everything
// its other globs match EXCEPT these paths. Two capabilities can legitimately live in
// one domain folder - a sibling that grew out of the first - and with globs alone the
// only shapes available were "the folder" (both specs demanded on every edit) or a
// hand-enumerated file list that goes stale in silence. `"swap": ["src/swap/**",
// "!src/swap/audit*"]` beside `"swap-audit": ["src/swap/audit*"]` says which file
// belongs to which. An exclusion is a claim boundary, not a coupling mode, so it is
// only ever the plain string form.
//
// A further form, { "external": "<repo>", "reason": "..." }, is for a capability whose
// implementation lives in a repository this one does not own - a plugin, a satellite
// `rules_*` repo, a vendor SDK. No glob here can reach that code, so the map had no way
// to say it: the choice was a glob matching nothing (which --audit reports, correctly, as
// a guard watching an empty set) or leaving the capability out of the map (which --audit
// reports as an orphan spec). Both are wrong about a real, common shape, and being wrong
// in a way the author has to route around is how the map stops being maintained. An
// external entry couples nothing mechanically - the code is not here to watch - so it
// carries a reason and is counted out loud in --audit's line.
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

// A dependency tree that got committed is not this repo's code, and the audit's filesystem
// walk already knew that - but every other path list here comes from git, which does not.
// In a repo with node_modules/ tracked, `**/swap/**` compiles to `(?:[^/]+/)*swap/.+` and
// matches `node_modules/pkg/swap/a.js`, so a dependency bump broke the blocking coupling
// gate for a capability nobody touched, and the audit read thousands of vendored files as
// code nobody claims. One answer, applied wherever a path list enters this guard.
const VENDORED = new Set(["node_modules", ".git"]);
const isVendored = (f) => f.split("/").some((s) => VENDORED.has(s));
const declared = JSON.parse(readFileSync(MAP, "utf8"));

const bad = (msg) => {
  console.error(`\nspec-guard: ${MAP} - ${msg}`);
  console.error('  an entry is "<glob>", "!<glob>" (paths this capability does not claim), { "glob": "<glob>", "couples": "content" | "shape" },');
  console.error('  or { "external": "<repo this one does not own>", "reason": "<why no glob here reaches it>" }\n');
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
for (const g of unclaimedGlobs ?? []) {
  if (typeof g !== "string" || !g.trim()) bad(`"$unclaimed" holds ${JSON.stringify(g)} - every entry must be a glob string`);
  // `!` narrows one capability's claim. `$unclaimed` is already the not-a-capability list,
  // so an exclusion there has nothing to narrow and would be read as a literal path with a
  // `!` in its name - a glob matching nothing, in the one list the audit does not check for
  // emptiness. Refused where it is written rather than discovered later.
  if (g.startsWith("!")) bad(`"$unclaimed" holds the exclusion ${JSON.stringify(g)} - an exclusion narrows a capability's claim, and $unclaimed is not a claim`);
}
const parseEntry = (e, cap) => {
  if (typeof e === "string") {
    if (!e.startsWith("!")) return { glob: e, couples: "content", excludes: false };
    const glob = e.slice(1);
    if (!glob) bad(`empty exclusion under "${cap}": "!" excludes nothing - write the paths after it`);
    return { glob, couples: "content", excludes: true };
  }
  // An external binding says where the code is, and why it cannot be watched from here.
  // The reason is required: without it this is just a way to take a capability out of the
  // guard's reach, and nobody reading the map later can tell the two apart.
  if (e !== null && typeof e === "object" && "external" in e) {
    if (typeof e.external !== "string" || !e.external.trim())
      bad(`"external" under "${cap}" must name the repository holding the code: ${JSON.stringify(e)}`);
    if (typeof e.reason !== "string" || !e.reason.trim())
      bad(`the external entry "${e.external}" under "${cap}" carries no reason - an unwatchable capability has to say why, or it is an escape hatch rather than a record`);
    return { external: e.external.trim(), reason: e.reason.trim() };
  }
  const couples = e?.couples ?? "content";
  if (typeof e?.glob !== "string" || (couples !== "content" && couples !== "shape"))
    bad(`unusable entry under "${cap}": ${JSON.stringify(e)}`);
  // An exclusion says which paths the capability does NOT claim, so a coupling mode on it
  // would describe how something that does not couple couples. Refused rather than ignored.
  if (e.glob.startsWith("!"))
    bad(`exclusion written as an object under "${cap}": ${JSON.stringify(e)} - an exclusion carries no coupling mode; write it as the plain string ${JSON.stringify(e.glob)}`);
  return { glob: e.glob, couples, excludes: false };
};
const coupling = Object.fromEntries(
  Object.entries(map).map(([cap, entries]) => {
    if (!Array.isArray(entries)) bad(`"${cap}" must hold a list of entries, not ${JSON.stringify(entries)}`);
    const parsed = entries.map((e) => parseEntry(e, cap));
    // Exclusions narrow a claim; they cannot be the whole claim. A capability with nothing
    // but exclusions claims no file at all, which reads as a mapped capability and guards
    // nothing - the silent state this file exists to prevent.
    if (parsed.length && parsed.every((e) => e.excludes))
      bad(`"${cap}" has only exclusions, so it claims no code at all - an exclusion narrows a glob, it cannot stand in for one`);
    return [cap, parsed];
  }),
);

// One capability's claim over one path: something it claims matches, and nothing it
// excludes does. Both the diff run and --audit ask this question, and asking it in two
// places is how the two modes drift into disagreeing about who owns a file.
const claimed = (entries, f) => entries.some((e) => !e.excludes && e.re.test(f)) && !entries.some((e) => e.excludes && e.re.test(f));
// An external binding carries no glob, so it is left out here and read from `coupling`
// where the audit names it. Everything downstream matches paths, and a regex built from
// an absent glob would either match every path or none.
const compiled = Object.fromEntries(
  Object.entries(coupling).map(([cap, entries]) => [
    cap,
    entries.filter((e) => !e.external).map((e) => ({ ...e, re: globToRegExp(e.glob) })),
  ]),
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
  const fsWalk = (dir, acc = []) => {
    if (!existsSync(dir)) return acc;
    for (const e of readdirSync(dir)) {
      if (VENDORED.has(e)) continue;
      const p = `${dir}/${e}`;
      if (statSync(p).isDirectory()) fsWalk(p, acc);
      else acc.push(p.replace(/^\.\//, ""));
    }
    return acc;
  };
  // Tracked AND untracked, unioned - not tracked-with-an-untracked-fallback. The fallback
  // only fired when git listed NOTHING, so one already-tracked spec made every new
  // directory invisible: `--audit` said OK before `git add` and failed naming the orphan
  // straight after, on the same tree. The local run has to give CI's answer, and the whole
  // point of the audit is the capability somebody just created.
  //
  // `--exclude-standard` keeps ignored files out (build output is not unclaimed code);
  // node_modules and .git are dropped by name as well, so a repo that has not ignored them
  // gets the same answer as the filesystem fallback rather than several thousand orphans.
  const listed = (what) => {
    // git's own stderr is discarded here: outside a repository every one of these prints
    // "fatal: not a git repository", and the filesystem fallback below is the answer, not
    // an error. A shipped guard does not narrate a case it handles.
    const collect = (cmd) => {
      try {
        return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().split("\n").filter(Boolean);
      } catch {
        return []; // no git, or nothing tracked yet
      }
    };
    const target = what === "." ? "" : ` ${what}`;
    const out = [
      ...collect(`git ls-files${target}`),
      ...collect(`git ls-files --others --exclude-standard${target ? ` --${target}` : ""}`),
    ].filter((f) => !isVendored(f));
    if (out.length) return [...new Set(out)];
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

  // An exclusion that matches nothing is the same failure as a claim that matches
  // nothing, one negation later: it reads as "this file belongs to the sibling" while
  // excluding no file at all, so the sibling's edits go on demanding both specs.
  //
  // An external binding names code in another repository, so it matches nothing here by
  // definition - checking it for emptiness would report the one shape it exists to
  // describe. It is not in `compiled` at all, which is where that exemption is made.
  const emptyGlobs = [];
  for (const [cap, entries] of Object.entries(compiled)) {
    if (retired.has(cap)) continue;
    for (const e of entries) {
      if (!treeFiles.some((f) => e.re.test(f))) emptyGlobs.push({ cap, glob: e.glob, excludes: e.excludes });
    }
  }

  // specs/ is never code: the specs are the other side of the coupling, and the map
  // lives there too. Everything else is claimed by a capability or declared. A file one
  // capability excludes is claimed only if another capability claims it - which is what
  // makes an exclusion safe: what it hands over has to be picked up by someone.
  const unclaimedRes = (unclaimedGlobs ?? []).map(globToRegExp);
  const claimsIt = (f) => Object.values(compiled).some((entries) => claimed(entries, f));
  const unclaimed =
    unclaimedGlobs === null
      ? []
      : treeFiles.filter((f) => !f.startsWith("specs/") && !claimsIt(f) && !unclaimedRes.some((re) => re.test(f)));

  const problems = orphans.length + specless.length + emptyGlobs.length + unclaimed.length;
  const external = Object.entries(coupling).flatMap(([cap, entries]) => entries.filter((e) => e.external).map((e) => ({ cap, ...e })));
  // Said out loud whatever the verdict: code this repo cannot watch is exactly the thing a
  // reader should be told about, and a hatch nobody sees is a hatch that widens.
  for (const { cap, external: where, reason } of external) {
    console.log(`spec-guard: note - "${cap}" is bound to ${where}, a repository this one does not own - no coupling is enforced here (${reason})`);
  }
  if (problems === 0) {
    const globCount = Object.values(coupling).flat().filter((e) => !e.external).length;
    const claimCheck =
      unclaimedGlobs === null
        ? 'the unclaimed-code check is OFF - declare "$unclaimed" (the paths that belong to no capability) to turn it on'
        : `${treeFiles.length} files, each claimed by a capability or declared unclaimed`;
    const retiredNote = retired.size ? `; ${retired.size} retired capability/ies not checked for empty globs` : "";
    const externalNote = external.length ? `; ${external.length} external binding(s) not enforced here` : "";
    console.log(`spec-guard --audit: OK (${capDirs.size} capability specs, all mapped; ${globCount} globs, all matching; ${claimCheck}${retiredNote}${externalNote})`);
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
    for (const { cap, glob, excludes } of emptyGlobs) {
      const hint = excludes ? "the exclusion holds nothing back - fix it, or drop it if the sibling's code moved" : "fix the glob, or drop it if the code moved";
      console.error(`    - "${cap}": "${excludes ? "!" : ""}${glob}"   (${hint})`);
    }
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
if (staged) raw = sh("git diff --cached --name-only --diff-filter=ACDMR");
else if (base) raw = sh(`git diff --name-only --diff-filter=ACDMR ${base}...HEAD`);
// A file not yet added is still a change: locally the guard has to fire before
// `git add`, not only in CI where everything is tracked.
else raw = `${sh("git diff --name-only --diff-filter=ACDMR HEAD")}\n${sh("git ls-files --others --exclude-standard")}`;
const changed = [...new Set(raw.split("\n").filter(Boolean))];
const files = changed.filter((f) => !isVendored(f));
// Say when the guard dropped paths, for the same reason it says when it decided not to
// fire: a silent skip reads exactly like a guard that stopped working.
const vendoredChanges = changed.length - files.length;
if (vendoredChanges)
  console.log(`spec-guard: note - ${vendoredChanges} changed path(s) inside a committed dependency tree ignored - not this repo's code`);

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
for (const [cap, entries] of Object.entries(compiled)) {
  const specTouched = files.some((f) => f.startsWith(`specs/${cap}/`));
  const codeTouched = files.some((f) => {
    if (f.startsWith("specs/")) return false;
    if (!claimed(entries, f)) return false; // not this capability's, or handed to a sibling
    const matched = entries.filter((e) => !e.excludes && e.re.test(f));
    // A content-coupled glob wins over a shape-coupled one matching the same file.
    const couples = matched.some((e) => e.couples !== "shape" || shapeChanged(f));
    if (!couples) dataOnly.add(f);
    return couples;
  });
  if (codeTouched && !specTouched) violations.push(cap);
}

// Changed code the map does not describe at all. The loop above can only fire on a file
// some glob matches, so a capability whose code does not sit where its globs say - the
// commonest cause being a source layout the map was never rewritten for, e.g. an
// implementation under `src/services/` and `src/models/` against domain-shaped globs -
// changed with `spec-guard: OK` and its spec untouched. --audit catches that full-tree,
// but the diff run is the only spec-guard the manifest ships as a gate, so in an adopted
// repo nothing said it unless the author wired the audit as well.
//
// Only when `$unclaimed` is declared: that declaration is the author saying the map is
// meant to cover everything, and without it the guard cannot tell code nobody claims from
// code deliberately claimed by nobody. Same rule as --audit, one diff narrower.
//
// Deletions are excluded, and that is not symmetry with the coupling check above - it is
// the opposite case. A deleted file the map never covered is a map problem the deletion
// SOLVES: reporting it would block the pull request that fixes the tree and leave the
// author with nothing to do about it.
const declaredUnclaimed = (unclaimedGlobs ?? []).map(globToRegExp);
const claimsAny = (f) => Object.values(compiled).some((entries) => claimed(entries, f));
const unclaimedChanges =
  unclaimedGlobs === null
    ? []
    : files.filter(
        (f) => !f.startsWith("specs/") && afterOf(f) !== null && !claimsAny(f) && !declaredUnclaimed.some((re) => re.test(f)),
      );

// Say when the guard decided not to fire - a silent skip is indistinguishable
// from a guard that stopped working.
for (const f of [...dataOnly].sort())
  console.log(`spec-guard: note - ${f} changed as data, key shape unchanged - no spec coupling`);

if (violations.length === 0 && unclaimedChanges.length === 0) {
  console.log("spec-guard: OK");
  process.exit(0);
}

if (violations.length) {
  console.error("\nspec-guard: code changed in these capabilities without a spec update:");
  for (const v of violations) console.error(`  - ${v}   (update specs/${v}/ or state why no change is needed)`);
}

if (unclaimedChanges.length) {
  const shown = unclaimedChanges.slice(0, 20);
  console.error(`\nspec-guard: ${unclaimedChanges.length} changed file(s) belong to no capability:`);
  for (const f of shown) console.error(`  - ${f}`);
  if (unclaimedChanges.length > shown.length) console.error(`  ... and ${unclaimedChanges.length - shown.length} more`);
  console.error(`\nAdd the path to the capability whose behaviour it implements, or declare it under "$unclaimed"`);
  console.error(`in ${MAP} if it belongs to no capability by decision. A capability whose globs describe a layout`);
  console.error("the code does not have is a coupling guard watching an empty set, and it reports OK forever.");
}
console.error("");
process.exit(block ? 1 : 0);
