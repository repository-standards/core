#!/usr/bin/env node
// tree-check - guard the single shipped tree (standard/), ADR-014.
//
// The standard is authored directly in standard/ at real-repo paths; there is no
// second source and nothing to reflect. What can still go wrong, and what this
// checks:
//   1. LEAK    - repo-own material must never enter the tree: this repo's ADRs,
//                the transition skill, the old engine vendor layouts.
//   2. MISSING - every file the manifest promises a client (adapt != fill-from-repo)
//                must exist in the tree at its client path.
//   3. SKELETON - the tree must pass its own shipped verifier:
//                `node scripts/self-verify.mjs --skeleton` run inside standard/.
//   4. HASHES  - every copy-class entry's recorded `sha256` matches what the tree ships
//                (`tools/manifest-hashes.mjs --check`). Those hashes are what lets an
//                adopter detect a modified copy, so a stale one is a lie shipped to every
//                pinned repo - and it must be generated, never hand-edited, which is why
//                the check lives here rather than in a habit.
//
// Usage: node tools/tree-check.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";

const TREE = "standard";
let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };
const ok = (msg) => console.log(`  ok    ${msg}`);

// `--self` runs the built-in cases for the `since` rule and exits, the way provenance-check
// does. It has to be decided here, before anything below reads the tree: every check in this
// file runs at module top level, so there is nothing to import without running all of it.
// The cases themselves live beside the check they exercise (section 4c).
if (process.argv.includes("--self")) selfCheckSince();

// --- 1. leaks ----------------------------------------------------------------------
const walk = (dir, acc = []) => {
  for (const e of readdirSync(dir)) {
    const p = `${dir}/${e}`;
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
};
const files = walk(TREE);

const LEAK_PATTERNS = [
  [/\/ADR-\d{3}-/, "a numbered ADR (this repo's own decisions live in docs/decision-records/, clients get them by reference - ADR-004)"],
  [/\.specify\//, "the retired .specify engine layout (ADR-015 extracted the engine)"],
  [/spec-kit\//, "a vendored spec-kit area (ADR-015 extracted the engine)"],
  [/skills\/(align-to-standards|onboard-repo|modernize|greenfield-start|speckit-)/, "a transition or speckit skill (never shipped - ADR-009/ADR-015)"],
];
let leaks = 0;
for (const f of files) {
  for (const [re, why] of LEAK_PATTERNS) {
    if (re.test(f)) { fail(`${f} leaked into the tree - ${why}`); leaks++; }
  }
}
if (!leaks) ok(`no repo-own material leaked into ${TREE}/ (${files.length} files walked)`);

// --- 2. manifest promises ------------------------------------------------------------
const manifest = JSON.parse(readFileSync(`${TREE}/standard.manifest.json`, "utf8"));
// fill-from-repo entries ship as shells the client fills - they must still exist in
// the tree, except the two a client authors from nothing:
const CLIENT_ONLY = new Set([".standards-version", "specs/capability-map.json", "docs/facts.json"]);
let missing = 0;
for (const f of manifest.files || []) {
  if (CLIENT_ONLY.has(f.path)) continue;
  const shipped = [f.path, ...(f.altPaths || [])].some((p) => existsSync(`${TREE}/${p}`));
  if (!shipped) { fail(`${TREE}/${f.path} missing but the manifest promises it (${f.purpose})`); missing++; }
}
for (const s of manifest.sections || []) {
  if (!existsSync(`${TREE}/${s.file}`)) { fail(`${TREE}/${s.file} missing, so the required "${s.heading}" section cannot ship`); missing++; }
}
if (!missing) ok(`every manifest promise is present in the tree`);
// references (ADR-023): method docs adopted by reference must resolve at this
// repo's root - a dead reference is a broken promise to every pinned client.
let refMissing = 0;
for (const r of manifest.references || []) {
  if (!existsSync(r.path)) { fail(`${r.path} referenced by the manifest (id: ${r.id}) but missing in this repo`); refMissing++; }
}
if ((manifest.references || []).length && !refMissing) ok(`every manifest reference resolves (${manifest.references.length} method docs)`);

// --- 2b. every shipped file is a manifest entry (or an explicit exemption) -------------
// The manifest is the tree's machine projection; a shipped-but-unlisted file is
// invisible to self-verify and to update-to-latest's delta - it would never reach
// an already-adopted repo. Directory entries cover their contents.
const EXEMPT = new Set([
  // add a path here only with a recorded reason - nothing is exempt today
]);
const entryPaths = new Set();
for (const f of manifest.files || []) { entryPaths.add(f.path); for (const a of f.altPaths || []) entryPaths.add(a); }
const dirEntries = (manifest.files || [])
  .map((f) => f.path)
  .filter((p) => existsSync(`${TREE}/${p}`) && statSync(`${TREE}/${p}`).isDirectory());
let unmanifested = 0;
for (const f of files) {
  const rel = f.slice(TREE.length + 1);
  if (EXEMPT.has(rel)) continue;
  const covered = entryPaths.has(rel) || dirEntries.some((d) => rel.startsWith(`${d}/`));
  if (!covered) { fail(`${f} ships but no manifest entry covers it - add an entry or an explicit exemption`); unmanifested++; }
}
if (!unmanifested) ok("every shipped file is covered by a manifest entry (tree -> manifest)");

// --- 3. the tree verifies itself -------------------------------------------------------
try {
  execSync("node scripts/self-verify.mjs --skeleton", { cwd: TREE, stdio: "pipe" });
  ok("self-verify --skeleton passes on the pristine tree");
} catch (e) {
  const out = ((e.stdout?.toString() || "") + (e.stderr?.toString() || "")).trim();
  fail("self-verify --skeleton FAILS on the pristine tree:\n" + out.split("\n").map((l) => "        " + l).join("\n"));
}

// --- 3b. the recorded content hashes are the tree's own ---------------------------------
// Generated by tools/manifest-hashes.mjs; asserted here so the manifest cannot ship a hash
// that describes a file the tree no longer has. The skeleton run above proves the same
// thing for the entries it reaches, but only this one distinguishes "no hash recorded" from
// "hash recorded and matching" - a copy entry with no hash is silently unverified downstream.
try {
  const out = execSync("node tools/manifest-hashes.mjs --check", { stdio: "pipe" }).toString().trim();
  ok(out.replace(/^manifest-hashes: OK - /, ""));
} catch (e) {
  const out = ((e.stdout?.toString() || "") + (e.stderr?.toString() || "")).trim();
  fail("recorded content hashes are stale or missing:\n" + out.split("\n").map((l) => "        " + l).join("\n"));
}

// --- 4. the spec header agrees with VERSION ----------------------------------------------
// Whoever bumps VERSION - a PR, by default in this repo (R25) - this only ensures the bump
// cannot leave the spec header advertising a different number.
//
// The README quick start is NOT checked for `@<version>` any more, and the removal is the
// point: that assertion required the quick start to tell an adopter to pin a version, which
// is the model ADR-025 removed. A guard demanding the phrasing a decision deleted keeps
// putting it back, and this one did - it failed the moment the README was corrected.
const version = readFileSync("VERSION", "utf8").trim();
const spec = readFileSync(`${TREE}/SPEC.md`, "utf8");
let vFails = 0;
if (!spec.includes(`Version ${version}`)) { fail(`${TREE}/SPEC.md header does not say "Version ${version}" (VERSION file is ${version})`); vFails++; }
if (!vFails) ok(`SPEC.md agrees with VERSION (${version})`);

// --- 4c. no manifest entry claims a version that has never shipped -----------------------
// `since` names the release that first shipped an entry, and an entry riding the next cut
// says the literal `unreleased` - which is what every other not-yet-released entry in this
// manifest says. One said `0.8.14`: a guess at what the next release would be called,
// written while VERSION said 0.8.13 and no such release existed.
//
// It is not a typo class. A `since` ahead of VERSION cannot match any real commit, so the
// field stops being reconstructible from history - which is the whole reason it exists - and
// the manifest quietly asserts a release nobody has actually cut yet: a PR bumps the version
// itself by default in this repo (R25), but only the PR that actually lands the bump gets to name it.
// It shipped inside an unrelated fix and nothing said a word, which is what this check is for.
function versionParts(v) {
  return /^\d+\.\d+\.\d+$/.test(v) ? v.split(".").map(Number) : null;
}

// Returns null when the value is fine, or the reason it is not.
function sinceProblem(since, version) {
  if (since === undefined || since === null || since === "") return "declares no `since` - the release it first shipped in is what makes the entry traceable";
  if (since === "unreleased") return null;
  const parts = versionParts(since);
  if (!parts) return `declares since "${since}", which is neither an x.y.z release nor the literal "unreleased"`;
  const now = versionParts(version);
  if (!now) return null; // VERSION itself is malformed - reported by the check above, not here
  // Numeric, part by part: as strings "0.8.9" sorts after "0.8.13" and the ahead-of-VERSION
  // case this exists for would read as fine.
  for (let i = 0; i < 3; i++) {
    if (parts[i] > now[i]) return `declares since "${since}", a version that has never shipped (VERSION is ${version}) - an entry riding the next release says "unreleased"; naming the number guesses what the next PR will actually cut`;
    if (parts[i] < now[i]) return null;
  }
  return null;
}

function selfCheckSince() {
  const CASES = [
    ["the literal unreleased", "unreleased", "0.8.13", true],
    ["the current version", "0.8.13", "0.8.13", true],
    ["an older release", "0.7.2", "0.8.13", true],
    ["an older patch that sorts later as a string", "0.8.9", "0.8.13", true],
    ["the next patch, which nobody has cut", "0.8.14", "0.8.13", false],
    ["a future minor", "0.9.0", "0.8.13", false],
    ["a future major", "2.0.0", "0.8.13", false],
    ["a two-part version", "1.0", "0.8.13", false],
    ["a release candidate of an uncut version", "0.8.14-rc.1", "0.8.13", false],
    ["a word that is not the literal", "next", "0.8.13", false],
    ["nothing at all", undefined, "0.8.13", false],
  ];
  let bad = 0;
  for (const [name, since, version, expectOk] of CASES) {
    const problem = sinceProblem(since, version);
    const pass = (problem === null) === expectOk;
    if (!pass) bad++;
    console.log(`  ${pass ? "ok  " : "FAIL"}  ${name} (${expectOk ? "must pass" : "must fail"}${problem ? `; said: ${problem}` : ""})`);
  }
  console.log(bad ? `\ntree-check --self: FAIL - ${bad} of ${CASES.length} cases` : `\ntree-check --self: OK - ${CASES.length} cases`);
  process.exit(bad ? 1 : 0);
}

{
  let sinceFails = 0;
  let sinceChecked = 0;
  for (const [key, value] of Object.entries(manifest)) {
    if (!Array.isArray(value)) continue;
    for (const entry of value) {
      if (!entry || typeof entry !== "object") continue;
      sinceChecked++;
      const problem = sinceProblem(entry.since, version);
      if (problem) { fail(`${TREE}/standard.manifest.json ${key}[] entry "${entry.path ?? entry.id ?? entry.heading ?? "?"}" ${problem}`); sinceFails++; }
    }
  }
  if (!sinceFails) ok(`every manifest entry's \`since\` names a shipped release or "unreleased" (${sinceChecked} entries)`);
}

// --- 4b. derived facts are never hand-written on surfaces --------------------------------
// A fact derivable from a source (the rule count, a rule range) must not be restated
// by hand where it can drift - surfaces say "the numbered rules" or derive the number.
const FACT_SURFACES = ["README.md", "llms.txt", "AGENTS.md", "docs/ecosystem.md", "site/index.html", "standard/README.md"];
const FACT_PATTERNS = [
  [/R1-R\d+/, "a hand-written rule range (say 'the numbered rules' or derive it from SPEC.md)"],
  [/\b(?:twenty(?:-\w+)?|nineteen|eighteen|\d{1,3})\s+(?:numbered\s+)?(?:MUST\/SHOULD\s+)?rules\b/i, "a hand-written rule count (it drifts on every added rule)"],
];
let factFails = 0;
for (const s of FACT_SURFACES) {
  if (!existsSync(s)) continue;
  // Markup is stripped before matching. The landing carried `20<small>rules ...</small>` for
  // weeks against a spec that had grown past twenty: the digits and the word were adjacent to
  // a reader and separated by a tag to the regex, so the one guard written for this exact
  // failure reported green over a live instance of it on the most public surface.
  const body = readFileSync(s, "utf8").replace(/<[^>]+>/g, " ");
  for (const [re, why] of FACT_PATTERNS) {
    const m = body.match(re);
    if (m) { fail(`${s} hardcodes "${m[0]}" - ${why}`); factFails++; }
  }
}
if (!factFails) ok("no hand-written derived facts on the checked surfaces (rule counts/ranges)");

// --- 4c. the released version has a changelog entry ---------------------------------------
// R18 makes a release one act: promote `## Unreleased` into a version heading, then bump
// VERSION - a PR does both itself now, PATCH by default unless told otherwise, rather than
// waiting on a separate maintainer step. Nothing checked the first half, and for
// thirteen bumps it did not happen - 32 commits between the 0.8.0 and 0.8.13 releases carry
// no entry anywhere, found by reading rather than by any gate. The manifest already requires
// the file and the `## Unreleased` heading to exist; only this ties the number in VERSION to
// a section describing it. The trailing non-digit matters: without it, VERSION 0.8.1 is
// satisfied by `## 0.8.13`.
const changelog = readFileSync("CHANGELOG.md", "utf8");
const literal = version.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
const released = new RegExp(String.raw`^##\s+\[?${literal}\]?(\D|$)`, "m");
if (released.test(changelog)) ok(`CHANGELOG.md records the released version (${version})`);
else fail(`CHANGELOG.md has no "## ${version}" heading - VERSION says ${version} shipped, and a release is ## Unreleased promoted into a version section (R18)`);

// --- 5. workflow pins are exact (R21 / ADR-017) -----------------------------------------
// Both this repo's own workflows and the shipped templates: actions pinned by
// 40-hex SHA, no `-latest` runner labels, no bare-major node versions or .nvmrc.
const ymlFiles = [];
for (const dir of [".github/workflows", `${TREE}/.github/workflows`]) {
  if (existsSync(dir)) for (const e of readdirSync(dir)) if (/\.ya?ml$/.test(e)) ymlFiles.push(`${dir}/${e}`);
}
let pinFails = 0;
for (const f of ymlFiles) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (/^\s*#/.test(line)) return; // comment-only lines are not configuration
    const at = `${f}:${i + 1}`;
    const uses = line.match(/uses:\s*(\S+)/);
    if (uses && !uses[1].startsWith("./") && !/@[0-9a-f]{40}$/.test(uses[1].split(" ")[0])) {
      fail(`${at} action not pinned by full SHA: "${uses[1]}"`); pinFails++;
    }
    if (/runs-on:.*-latest/.test(line)) { fail(`${at} floating runner label (use an exact image, e.g. ubuntu-24.04)`); pinFails++; }
    const nv = line.match(/node-version:\s*["']?([^"'\s]+)["']?\s*$/);
    if (nv && !/^\d+\.\d+\.\d+$/.test(nv[1])) { fail(`${at} node version "${nv[1]}" is not an exact x.y.z pin`); pinFails++; }
    // The rule above says "no .nvmrc", and `node-version-file` is how a workflow reads one
    // without ever writing `node-version:` - so the check never saw it. The shipped
    // spec-guard workflow did exactly that: a required manifest entry whose setup step read
    // an optional one, in every repo that had no reason to carry it.
    if (/node-version-file:/.test(line)) { fail(`${at} node-version-file defers the pin to a file - state the exact x.y.z version here`); pinFails++; }
  });
}
const nvmrcPath = `${TREE}/.nvmrc`;
if (existsSync(nvmrcPath) && !/^\d+\.\d+\.\d+\s*$/.test(readFileSync(nvmrcPath, "utf8"))) {
  fail(`${nvmrcPath} is not an exact x.y.z version`); pinFails++;
}
if (!pinFails) ok(`workflow pins are exact - SHAs, fixed runners, full node versions (${ymlFiles.length} workflows)`);

// --- every tracked text file stays diffable ----------------------------------------------
// A stray NUL in a source file makes git classify the whole file as binary. Everything
// still runs, so no test fails - but `git diff` reports "Binary files differ" and `grep`
// finds nothing in it, which means the file silently stops being reviewable. It happened
// here (tools/validation.mjs, 2026-08-06): a NUL landed where a space was meant, every
// other gate passed, and it was found only by trying to read the diff during review.
// A file nobody can diff is a file nobody can review, so this is a hard check.
{
  let nulFails = 0;
  // Files that are meant to be binary are not our business - skip before reading, so a
  // large asset is never pulled into memory just to be ignored.
  const isBinaryByExt = (f) => /\.(png|jpg|jpeg|gif|webp|ico|pdf|woff2?|ttf|zip|gz)$/i.test(f);
  const tracked = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean);
  let scanned = 0;
  for (const f of tracked) {
    if (isBinaryByExt(f) || !existsSync(f)) continue;
    scanned++;
    const buf = readFileSync(f);
    const nul = buf.indexOf(0);
    if (nul !== -1) {
      const line = buf.subarray(0, nul).toString("utf8").split("\n").length;
      fail(`${f}:${line} contains a NUL byte - git will treat this file as binary, so it cannot be diffed or grepped`);
      nulFails++;
    }
  }
  if (!nulFails) ok(`no NUL bytes in tracked text (${scanned} files) - every file stays diffable`);
}

// --- verdict ---------------------------------------------------------------------------
if (failures) {
  console.log(`\ntree-check: FAIL - ${failures} problem(s)`);
  process.exit(1);
}
console.log(`\ntree-check: OK - one tree, shippable`);
