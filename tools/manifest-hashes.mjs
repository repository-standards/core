#!/usr/bin/env node
// manifest-hashes - record what every copy-class entry's content actually is.
//
// `self-verify` used to check that a manifest entry EXISTS. For a `copy` entry - shipped
// verbatim, byte for byte - that is close to no check at all: a repo could carry 19 of the
// 20 skills, the previous version's SPEC.md, a guard with its policy block deleted, and
// still report drift 0. Bumping the pin and the manifest while changing no files reported
// compliant too, because nothing in the run ever looked at a byte.
//
// An adopted repo does not have the shipped tree to compare against, and the guards are
// deliberately dependency-free and offline. What it does have is its copy of the manifest,
// taken from the version it aligned to. So the hash travels in the manifest: this tool
// writes a `sha256` for every copy-class entry (a string for a file, one hash per member
// for a directory), and `self-verify` hashes the local file and reports a difference as
// drift. Correct by construction for the adopter: their manifest copy describes exactly
// the version they aligned to.
//
// Two paths carry no hash, on purpose:
//   - `standard.manifest.json` itself - a file cannot contain its own hash.
//   - anything that is not `adapt: "copy"` - a merge is reconciled and a fill-from-repo
//     file is the repo's own content, so both are supposed to differ (`requiredKeys`
//     is how a merge entry asserts what must survive).
//
// Hashes are taken over the file's text with CRLF normalized to LF, so a Windows checkout
// is not permanent drift. The shipped tree is text; a binary copy entry would need a byte
// hash and this tool would have to grow one.
//
// Usage:
//   node tools/manifest-hashes.mjs           # write the hashes into the manifest
//   node tools/manifest-hashes.mjs --check   # exit 1 if any recorded hash is missing,
//                                            # stale, or names a file that is gone (CI;
//                                            # tree-check runs this)
//
// Zone 1 tooling - never shipped. No dependencies.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";

const TREE = "standard";
const MANIFEST = `${TREE}/standard.manifest.json`;
const check = process.argv.includes("--check");

// A file cannot carry its own hash - it would change the moment the hash was written.
const SELF = "standard.manifest.json";

const hashFile = (p) => createHash("sha256").update(readFileSync(p, "utf8").replace(/\r\n/g, "\n")).digest("hex");

const walk = (dir, base = dir, acc = []) => {
  for (const e of readdirSync(dir).sort()) {
    const p = `${dir}/${e}`;
    if (statSync(p).isDirectory()) walk(p, base, acc);
    else acc.push(p.slice(base.length + 1));
  }
  return acc;
};

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const problems = [];
let written = 0;

for (const f of manifest.files || []) {
  const shipped = `${TREE}/${f.path}`;
  if (f.adapt !== "copy" || f.path === SELF) {
    if (f.sha256 !== undefined) {
      problems.push(`${f.path} carries a sha256 but is \`${f.adapt}\`${f.path === SELF ? " (and is the manifest itself)" : ""} - only copy-class entries are hashed`);
      if (!check) { delete f.sha256; written++; }
    }
    continue;
  }
  if (!existsSync(shipped)) {
    // tree-check reports the missing promise; here it only means there is nothing to hash.
    problems.push(`${f.path} is copy-class but absent from the tree - nothing to hash`);
    continue;
  }
  const want = statSync(shipped).isDirectory()
    ? Object.fromEntries(walk(shipped).map((member) => [member, hashFile(`${shipped}/${member}`)]))
    : hashFile(shipped);

  const recorded = JSON.stringify(f.sha256 ?? null);
  if (recorded === JSON.stringify(want)) continue;
  if (check) {
    problems.push(
      f.sha256 === undefined
        ? `${f.path} has no recorded sha256 - run \`node tools/manifest-hashes.mjs\``
        : `${f.path} has a stale sha256 - the shipped content moved and the manifest did not`,
    );
  } else {
    f.sha256 = want;
    written++;
  }
}

if (check) {
  if (problems.length) {
    for (const p of problems) console.error(`  FAIL  ${p}`);
    console.error(`\nmanifest-hashes: FAIL - ${problems.length} problem(s); run \`node tools/manifest-hashes.mjs\` and commit the manifest`);
    process.exit(1);
  }
  const hashed = (manifest.files || []).filter((f) => f.sha256 !== undefined).length;
  console.log(`manifest-hashes: OK - ${hashed} copy-class entr${hashed === 1 ? "y" : "ies"} hashed and current`);
  process.exit(0);
}

for (const p of problems) console.error(`  note  ${p}`);
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`manifest-hashes: wrote ${MANIFEST} - ${written} entr${written === 1 ? "y" : "ies"} updated`);
