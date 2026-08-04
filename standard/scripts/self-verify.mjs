#!/usr/bin/env node
// self-verify - prove this repo still complies with the standard it is pinned to.
//
// The "verify" step of the versioned-standard mechanism. Runs after adopting the
// standard (align-to-standards), after updating it (update-to-version), and in CI on
// every PR - the same pass/fail each time. This is the mechanical tier; the judgment
// tier (are the catalogued decisions actually recorded? are the money/security specs
// buildable?) is reviewed at PR - see self-verify.md, adopted by reference:
// https://github.com/repository-standards/core/blob/main/docs/method/self-verify.md
//
// Manifest-driven (ADR-005). When standard.manifest.json is present, this reads it and
// checks the repo against every entry - files, required sections, static guards - and
// reports DRIFT as a number (how many required entries are unmet). The manifest is the
// single source of truth; without one, it falls back to a built-in skeleton so the check
// still works on repos that predate the manifest.
//
// Checks (assembled/client layout):
//   1. .standards-version is present and well-formed (x.y.z); with --version <target> it
//      must equal that target; and it must equal the manifest's version when a manifest
//      is present (a repo pinned to X carries manifest X).
//   1b. Content, for the entries whose content is the standard's own: a `copy` entry
//      carries a recorded `sha256` (a string for a file, one hash per member for a
//      directory), and the local file must hash to it. Existence alone was close to no
//      check for these: 19 of 20 skills, last version's SPEC.md, or a guard with its
//      policy block deleted all reported drift 0. A `merge` entry cannot be hashed - it is
//      adapted on purpose - so it may declare `requiredKeys` naming what must survive the
//      merge (JSON and YAML block mappings), because "the file exists" is worthless when
//      the point of the entry is a block inside it.
//   2. Manifest (or fallback skeleton): required files/altPaths exist; required sections
//      are present in their files; static guards pass. Each entry may carry a profile
//      (core|scale, ADR-011) - core is whatever keeps knowledge alive, scale is whatever
//      coordinates people. --profile core checks core only; --profile scale checks everything;
//      no flag = the manifest copy's "profile" field, then scale. solo/team are
//      accepted silently as deprecated aliases
//      (solo -> core, team -> scale). An entry with no profile counts as core, so
//      manifests from before ADR-011 still check in full either way.
//   3. Stray transition skills (ADR-009): align-to-standards, onboard-repo, modernize,
//      greenfield-start never ship in a consuming repo. One found under .claude/skills/
//      is a hand-copy mistake, flagged as a warning - it does not add to drift.
//
// Usage:
//   node scripts/self-verify.mjs                  # gate: exit 1 on any failure
//   node scripts/self-verify.mjs --version 0.8.13  # also assert the record equals a target
//   node scripts/self-verify.mjs --warn           # report only, always exit 0
//   node scripts/self-verify.mjs --profile core   # core-profile entries only (ADR-011);
//                                                 # without the flag, the repo's manifest
//                                                 # copy's top-level "profile" field is the
//                                                 # default, then scale (= everything)
//   node scripts/self-verify.mjs --skeleton       # verify the shipped tree itself: skip the
//                                                 # version pin, guards, and fill-from-repo
//                                                 # files a client authors at adoption
//
// No dependencies (Node built-ins only). Place at scripts/self-verify.mjs.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const METHOD_DOC = "https://github.com/repository-standards/core/blob/main/docs/method/self-verify.md";

const args = process.argv.slice(2);
const warn = args.includes("--warn");
const vIdx = args.indexOf("--version");
const wantVersion = vIdx >= 0 ? args[vIdx + 1] : null;
const pIdx = args.indexOf("--profile");
const profileFlag = pIdx >= 0 ? args[pIdx + 1] : null; // resolved after the manifest loads
const skeleton = args.includes("--skeleton"); // verifying the shipped tree, not an adopted repo

// existsSync answers the FILESYSTEM's question about a path, and on macOS and Windows that
// question is case-insensitive: `readme.md` satisfied `README.md` on a contributor's Mac and
// failed on Linux CI for the same commit, so the compliance answer depended on whose machine
// asked. Every check here asks the directory listing instead - the case the manifest names is
// the case the repo has to carry, on every platform.
const dirCache = new Map();
const listing = (dir) => {
  if (!dirCache.has(dir)) {
    try {
      dirCache.set(dir, new Set(readdirSync(dir)));
    } catch {
      dirCache.set(dir, new Set()); // not a directory, or unreadable: nothing is in it
    }
  }
  return dirCache.get(dir);
};
const exists = (p) => {
  const parts = String(p).split("/").filter((s) => s && s !== ".");
  let dir = ".";
  for (const part of parts) {
    if (!listing(dir).has(part)) return false;
    dir = dir === "." ? part : `${dir}/${part}`;
  }
  return parts.length > 0;
};

const results = [];
const pass = (name, msg) => results.push({ ok: true, name, msg });
const fail = (name, msg) => results.push({ ok: false, name, msg });
const note = (name, msg) => results.push({ ok: true, name, msg, dim: true });
const warning = (name, msg) => results.push({ ok: true, name, msg, isWarning: true });

// 0. load the manifest (ADR-005) ------------------------------------------------
let manifest = null;
if (exists("standard.manifest.json")) {
  try {
    manifest = JSON.parse(readFileSync("standard.manifest.json", "utf8"));
  } catch (e) {
    fail("manifest", `standard.manifest.json is present but unparseable: ${e.message}`);
  }
}

// 0b. a repo that adopted a stack carries the stack's manifest too (ADR-016):
// same schema, second file - the engine eats both and drift is one number.
if (manifest && exists("stack.manifest.json")) {
  try {
    const stack = JSON.parse(readFileSync("stack.manifest.json", "utf8"));
    note("stack", `stack manifest present: ${stack.technology || "unnamed"} - technology layer counted in the same drift number (ADR-016/022)`);
    for (const k of ["files", "sections", "guards"]) {
      manifest[k] = [...(manifest[k] || []), ...(stack[k] || [])];
    }
  } catch (e) {
    fail("stack", `stack.manifest.json is present but unparseable: ${e.message}`);
  }
}

// 0c. profile resolution (ADR-011): the CLI flag wins; else the repo's carried
// manifest copy may declare its chosen profile (written at align time); else
// scale = check everything. solo/team are accepted as deprecated aliases.
const profileArg = profileFlag || (manifest && manifest.profile) || "scale";
const coreOnly = profileArg === "core" || profileArg === "solo";
if (!profileFlag && manifest && manifest.profile) {
  if (["core", "scale", "solo", "team"].includes(manifest.profile)) {
    note("profile", `profile "${manifest.profile}" declared in the manifest copy - used as the default`);
  } else {
    warning("profile", `manifest declares unknown profile "${manifest.profile}" - treated as scale (valid: core, scale)`);
  }
}

// 1. version pin ----------------------------------------------------------------
let pinned = null;
if (skeleton) {
  note("version", ".standards-version is written at adoption - skipped (--skeleton)");
} else if (!exists(".standards-version")) {
  fail("version", ".standards-version missing - repo is not pinned to a standard version (run align-to-standards)");
} else {
  pinned = readFileSync(".standards-version", "utf8").trim();
  if (!/^\d+\.\d+\.\d+/.test(pinned)) {
    fail("version", `.standards-version is malformed: "${pinned}" (expected x.y.z)`);
  } else if (wantVersion && pinned !== wantVersion) {
    fail("version", `.standards-version is ${pinned}, expected ${wantVersion}`);
  } else {
    pass("version", `pinned to ${pinned}`);
  }
}
if (manifest && pinned && manifest.version && manifest.version !== pinned) {
  fail("version", `manifest is ${manifest.version} but .standards-version is ${pinned} - the manifest must match the pin`);
}

// 2. manifest checks, or fallback skeleton --------------------------------------
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasFile = (p, alts = []) => [p, ...alts].some((x) => exists(x));
const isCore = (entry) => !entry.profile || entry.profile === "core"; // no profile = core (pre-ADR-011)
let scaleSkipped = 0; // entries skipped by --profile core, across files/sections/guards

// exceptions (R17): a deliberate, recorded deviation from a required entry - the
// manifest's own escape hatch so an update never silently overwrites a choice the
// repo already made.
//
//   { "kind": "file", "match": "<path>", "reason": "..." }              - the entry itself
//   { "kind": "section", "match": "<file>#<heading>", "reason": "..." } - a required heading
//   { "kind": "content", "match": "<path>", "reason": "..." }           - a copy-class file
//                                                                         this repo edited
//   { "kind": "key", "match": "<file>#<key.path>", "reason": "..." }    - a declared key
//
// The hatch is BOUNDED, and the boundary is the difference between waiving a declarative
// entry and removing a live check:
//   - There is no `guard` kind. A guard's verdict is not a claim about the repo's layout
//     that can be true-but-deliberately-false; waiving it deletes the check. Fix the guard
//     or drop it from the manifest with the rest of the delta, consciously.
//   - A guard's own script file cannot be excepted by `kind: "file"`. A guard whose script
//     is absent is SKIPPED below (optional guards legitimately are not installed), so
//     excepting the file is exactly how a repo makes a blocking check disappear at drift 0.
//     `kind: "content"` on the same path IS allowed: a repo may record that it changed a
//     guard, because the guard still has to run and pass.
//   - Every exception carries a reason. "Recorded deviation" with nothing recorded is not
//     one, and the reason is what the next update reads before it overwrites anything.
// An entry that breaks these rules is drift, not a silently ignored line: a manifest can
// only be trusted if a malformed hatch fails loudly.
const EXCEPTION_KINDS = ["file", "section", "content", "key"];
const guardScripts = new Set(
  (manifest?.guards || []).flatMap((g) => String(g.run || "").match(/[\w./-]+\.(?:mjs|cjs|js|sh)/g) || []),
);
const exceptions = [];
for (const e of manifest?.exceptions || []) {
  const label = `${e?.kind ?? "(no kind)"}:${e?.match ?? "(no match)"}`;
  if (!EXCEPTION_KINDS.includes(e?.kind)) {
    fail("exception", `exceptions entry ${label} is not a valid kind (${EXCEPTION_KINDS.join(", ")}) - a guard cannot be excepted at all: waiving a live check removes it instead of recording a deviation from it (R17)`);
  } else if (!String(e.reason ?? "").trim()) {
    fail("exception", `exceptions entry ${label} carries no reason - an unexplained deviation is not a recorded one (R17)`);
  } else if (e.kind === "file" && guardScripts.has(e.match)) {
    fail("exception", `exceptions entry ${label} excepts a guard's own script - a guard whose script is missing is skipped, so this disables a blocking check while reporting drift 0. Reinstall ${e.match}, or remove its guard from the manifest deliberately; to record an edited guard use { "kind": "content" } instead, which keeps the guard running`);
  } else {
    exceptions.push(e);
  }
}
// A `content` match MAY end in `/**` to waive a subtree - a repo that rewrote a whole
// directory of shipped procedures records one line instead of forty. Deliberately limited to
// `content`: a subtree waiver on `file` presence would let `scripts/**` sweep away every
// guard script's required-file check, which is the hole the guard-script rule above closes.
// Each member it actually waives is still counted and printed, so a wide waiver costs wide
// coverage.
const usedExceptions = new Set();
const covers = (e, kind, key) =>
  e.kind === kind &&
  (e.match === key || (kind === "content" && e.match.endsWith("/**") && key.startsWith(e.match.slice(0, -2))));
const exceptionFor = (kind, key) => {
  const hit = exceptions.find((e) => covers(e, kind, key));
  if (hit) usedExceptions.add(hit);
  return hit;
};
// An excepted entry is dim (it is not a failure) but it is NOT invisible: the arithmetic
// below keeps it in the denominator, so excepting can lower the adoption percentage and
// can never raise it.
const exceptedResult = (name, msg, e) =>
  results.push({ ok: true, name, msg: `${msg} - excepted (recorded manifest deviation, R17): ${e.reason.trim()}`, dim: true, isExcepted: true });
const failOrExcept = (kind, key, name, msg) => {
  const e = exceptionFor(kind, key);
  if (e) exceptedResult(name, msg, e);
  else fail(name, msg);
};

// 2a. content of copy-class entries ---------------------------------------------
// A `copy` entry is the standard's own content, shipped verbatim, so the manifest can
// record what it must hash to. The comparison is against the manifest THIS repo carries -
// the one from the version it aligned to - which is why it needs no network, no shipped
// tree beside it, and no second source of truth. CRLF is normalized to LF first so a
// Windows checkout is not permanent drift.
const contentHash = (p) => createHash("sha256").update(readFileSync(p, "utf8").replace(/\r\n/g, "\n")).digest("hex");
const CONTENT_HINT = "run update-to-version to take the standard's copy, or record the change as an exception: { \"kind\": \"content\", \"match\": \"<path>\", \"reason\": \"...\" }";

// A ported directory (`.agents/skills` standing in for `.claude/skills`, R22) is a
// different FORMAT by design, so bytes cannot be the test - but a directory that merely
// exists at the alternate path is not a port either. Found on a real monorepo: it symlinked
// `.claude/skills` at its own unrelated 31-skill system, satisfied the altPath, and reported
// 100% adopted while carrying none of the standard's 20 procedures. So the names are
// checked where the bytes cannot be: each thing the standard ships must appear by name,
// extension ignored, so a port may be one file per skill or a folder per skill.
const stem = (name) => name.replace(/\.[^./]+$/, "");
const namesUnder = (dir, depth = 3, acc = new Set()) => {
  if (depth < 0 || acc.size > 5000) return acc;
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc; // unreadable or not a directory: the caller reports what is absent
  }
  for (const e of entries) {
    acc.add(stem(e));
    try {
      if (statSync(`${dir}/${e}`).isDirectory()) namesUnder(`${dir}/${e}`, depth - 1, acc);
    } catch {
      /* a broken symlink names nothing */
    }
  }
  return acc;
};

const verifyPortedTree = (f, alt) => {
  const want = [...new Set(Object.keys(f.sha256).map((m) => stem(m.split("/")[0])))];
  const carried = namesUnder(alt);
  const absent = want.filter((n) => !carried.has(n));
  if (!absent.length) {
    note("content", `${f.path} is ported to ${alt} - all ${want.length} of the standard's names are there; the bytes are not compared, because a ported form is not byte-identical by design (whether each port is faithful stays judgment tier, R22)`);
    return;
  }
  failOrExcept("content", f.path, "content", `${alt} stands in for ${f.path} but ${absent.length} of the standard's ${want.length} are not in it: ${absent.join(", ")} - a directory that happens to exist at the alternate path is not a port, and a partial port is drift rather than a variant (R22)`);
};

const verifyContent = (f) => {
  if (f.sha256 === undefined) return; // not copy-class, or a manifest from before hashes shipped
  if (exceptionFor("file", f.path)) return; // the whole entry is already a recorded deviation
  if (!exists(f.path)) {
    const alt = (f.altPaths || []).find((x) => exists(x));
    if (alt && typeof f.sha256 !== "string") verifyPortedTree(f, alt);
    else note("content", `${f.path} resolved through an alternate path - content not compared (an alternate location holds the repo's own form of it)`);
    return;
  }
  if (typeof f.sha256 === "string") {
    if (contentHash(f.path) === f.sha256) pass("content", `${f.path} matches the standard's copy`);
    else failOrExcept("content", f.path, "content", `${f.path} differs from the standard's copy - the file is present but its content is not the standard's (${CONTENT_HINT})`);
    return;
  }
  // A directory entry: one recorded hash per shipped member, one result for the entry, so
  // the arithmetic stays "one point per manifest entry" however many members moved. Members
  // the standard does not ship are the repo's own and are never reported.
  const missing = [];
  const differs = [];
  let waived = 0;
  for (const [member, want] of Object.entries(f.sha256)) {
    const p = `${f.path}/${member}`;
    const state = !exists(p) ? "missing" : contentHash(p) !== want ? "changed" : null;
    if (!state) continue;
    const e = exceptionFor("content", p);
    if (e) {
      waived++;
      exceptedResult("content", `${p} is ${state} against the standard's copy`, e);
    } else if (state === "missing") missing.push(member);
    else differs.push(member);
  }
  const total = Object.keys(f.sha256).length;
  if (!missing.length && !differs.length) {
    pass("content", `${f.path} matches the standard's copy (${total} files${waived ? `, ${waived} excepted` : ""})`);
    return;
  }
  const parts = [];
  if (missing.length) parts.push(`${missing.length} missing (${missing.join(", ")})`);
  if (differs.length) parts.push(`${differs.length} changed (${differs.join(", ")})`);
  fail("content", `${f.path} does not match the standard's copy: ${parts.join("; ")} of ${total} shipped files (${CONTENT_HINT})`);
};

// 2b. declared keys of merge-class entries --------------------------------------
// A merge entry is adapted on purpose - the repo keeps its own jobs, its own permission
// list - so hashing it would be wrong. But "the file exists" asserts nothing when the
// entry exists FOR a block inside it (the supply-chain keys, the hook wiring). An entry
// may name the keys that must survive the merge; presence only, never a value, because a
// value is the repo's to choose.
const jsonHasKey = (root, dotted) => {
  let cur = root;
  for (const part of dotted.split(".")) {
    if (cur === null || typeof cur !== "object" || Array.isArray(cur)) return false;
    if (!Object.prototype.hasOwnProperty.call(cur, part)) return false;
    cur = cur[part];
  }
  return true;
};
// A deliberately small YAML reader: block mappings only, which is what every merge entry
// that declares keys uses (workflow triggers, permissions, a pnpm policy block). It tracks
// the indentation stack of `key:` lines and collects the dotted paths they form. Sequence
// items and flow mappings are out of scope, and a key declared inside one is a
// manifest-authoring mistake rather than something a repo can fix.
const yamlKeyPaths = (body) => {
  const paths = new Set();
  const stack = [];
  for (const raw of body.split("\n")) {
    const line = raw.replace(/\t/g, "    ").replace(/\s+$/, "");
    if (!line.trim() || /^\s*#/.test(line) || /^\s*-/.test(line)) continue;
    const m = line.match(/^(\s*)((?:"[^"]*"|'[^']*'|[^\s#][^:]*?))\s*:(\s|$)/);
    if (!m) continue;
    const indent = m[1].length;
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    stack.push({ indent, key: m[2].trim().replace(/^["']|["']$/g, "") });
    paths.add(stack.map((s) => s.key).join("."));
  }
  return paths;
};

const verifyKeys = (f) => {
  if (!(f.requiredKeys || []).length) return;
  if (exceptionFor("file", f.path)) return; // the whole entry is already a recorded deviation
  const p = [f.path, ...(f.altPaths || [])].find((x) => exists(x));
  if (!p) return; // absence is the files check's business, reported there
  const body = readFileSync(p, "utf8");
  let has;
  if (/\.json$/.test(p)) {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (err) {
      fail("key", `${p} is unparseable JSON, so its required keys cannot be checked: ${err.message}`);
      return;
    }
    has = (k) => jsonHasKey(parsed, k);
  } else if (/\.ya?ml$/.test(p)) {
    const paths = yamlKeyPaths(body);
    has = (k) => paths.has(k);
  } else {
    fail("key", `${f.path} declares requiredKeys but is neither JSON nor YAML - only those two formats can be checked by key (fix the manifest entry)`);
    return;
  }
  for (const key of f.requiredKeys) {
    if (has(key)) pass("key", `${p} > "${key}"`);
    else failOrExcept("key", `${f.path}#${key}`, "key", `${p} is missing the "${key}" key - a merge keeps what the repo already has AND what the standard brings; this key is the part of ${f.path} the standard is asking for (${f.purpose})`);
  }
};

if (manifest) {
  // method docs adopted by reference (ADR-004/023): named, never file-checked
  if ((manifest.references || []).length) {
    note("reference", `${manifest.references.length} method docs adopted by reference from the living standard - always latest (ADR-023/025); read them in the standards repo, never copy them here`);
  }
  // files
  for (const f of manifest.files || []) {
    if (coreOnly && !isCore(f)) { scaleSkipped++; continue; }
    if (f.adapt === "reference") { note("file", `${f.path} is reference-class - adopted by link to the living standard, no file expected here`); continue; }
    if (hasFile(f.path, f.altPaths)) {
      pass("file", `${f.path} (${f.purpose})`);
      verifyContent(f);
      verifyKeys(f);
      continue;
    }
    if (skeleton && f.adapt === "fill-from-repo") note("file", `${f.path} is authored at adoption - absent from the skeleton by design`);
    else if (f.required) failOrExcept("file", f.path, "file", `${f.path} missing - ${f.purpose}`);
    else note("file", `${f.path} absent (optional) - ${f.purpose}`);
  }
  // required sections within files
  for (const s of manifest.sections || []) {
    if (coreOnly && !isCore(s)) { scaleSkipped++; continue; }
    if (!exists(s.file)) {
      if (s.required) failOrExcept("section", `${s.file}#${s.heading}`, "section", `${s.file} missing, so "${s.heading}" cannot be checked`);
      continue;
    }
    const body = readFileSync(s.file, "utf8");
    const re = new RegExp(`^#{1,6}\\s+.*${escapeRe(s.heading)}`, "mi");
    if (re.test(body)) pass("section", `${s.file} > "${s.heading}"`);
    else if (s.required) failOrExcept("section", `${s.file}#${s.heading}`, "section", `${s.file} is missing the "${s.heading}" section - ${s.purpose}`);
  }
  // static guards (skip self to avoid recursion; diff guards run in CI on the PR diff)
  if (skeleton) note("guard", "guards run in an adopted repo, not on the skeleton - skipped (--skeleton)");
  for (const g of skeleton ? [] : manifest.guards || []) {
    if (coreOnly && !isCore(g)) { scaleSkipped++; continue; }
    if (g.id === "self-verify") continue;
    if (g.kind === "diff") { note("guard", `${g.id} is diff-based - runs in CI on the PR diff, not here`); continue; }
    const script = (g.run.match(/scripts\/[\w.-]+\.mjs/) || [])[0];
    // Not installed = skipped, because optional guards legitimately are not (no database,
    // no cycles). That tolerance is why a guard's script may not be excepted: excepting it
    // would turn "missing required file" into "check silently absent". See EXCEPTION_KINDS.
    if (script && !exists(script)) { note("guard", `${g.id} not installed (${script}) - skipped`); continue; }
    try {
      execSync(g.run, { stdio: "pipe" });
      pass("guard", `${g.id} passed`);
    } catch (e) {
      const out = ((e.stdout?.toString() || "") + (e.stderr?.toString() || "")).trim();
      fail("guard", `${g.id} failed:\n` + out.split("\n").map((l) => "        " + l).join("\n"));
    }
  }
  if (coreOnly && scaleSkipped > 0) {
    note("profile", `${scaleSkipped} scale-only entr${scaleSkipped === 1 ? "y" : "ies"} skipped (--profile core)`);
  }
  // decisions are judgment-tier: a human confirms they are actually recorded at review
  if ((manifest.decisions || []).length) {
    note("decision", `${manifest.decisions.length} catalogued decisions to confirm recorded at review (judgment tier - see ${METHOD_DOC})`);
  }
  // A recorded deviation that no longer deviates is stale bookkeeping: it reads as "this
  // repo chose otherwise" long after the repo chose otherwise back.
  for (const e of exceptions) {
    if (!usedExceptions.has(e)) {
      warning("exception", `${e.kind}:${e.match} is excepted but met anyway - delete the exception, it is describing a deviation this repo no longer has`);
    }
  }
} else {
  // A WARN, not a note, and it is repeated in the verdict line. The fallback was silent, and
  // the silence made the number a different measurement wearing the same words: three real
  // unaligned repos reported drift 4-5 here against drift 13-15 from the shipped manifest, in
  // the same output format, in the same minute. Anything that reads "the drift number is the
  // open delta" is false while this branch runs, so it has to say so where the number is.
  warning("manifest", "no standard.manifest.json in this repo - measured against the built-in skeleton below, which is a fraction of the standard's entries. The number here is NOT the delta from the standard; run align-to-standards (or update-to-version) to get the manifest and a real one");
  for (const [p, why] of [
    ["AGENTS.md", "the single agent entry point"],
    ["specs", "living capability specs"],
    ["docs/decision-records", "the ADR/BDR decision log"],
  ]) {
    if (exists(p)) pass("file", `${p} (${why})`);
    else fail("file", `${p} missing - ${why}`);
  }
  if (hasFile("docs/backlog.md", ["backlog.md"])) pass("file", "backlog present");
  else fail("file", "backlog missing (docs/backlog.md) - the work ledger");
  const guard = "scripts/spec-structure.mjs";
  if (exists(guard)) {
    try {
      execSync(`node ${guard} --block`, { stdio: "pipe" });
      pass("guard", "spec-structure passed");
    } catch (e) {
      const out = ((e.stdout?.toString() || "") + (e.stderr?.toString() || "")).trim();
      fail("guard", "spec-structure failed:\n" + out.split("\n").map((l) => "        " + l).join("\n"));
    }
  } else {
    note("guard", "spec-structure not installed - skipped");
  }
}

// 2b. surviving template placeholders - drift 0 with empty shells is a hollow win.
// A warning, never drift: substance stays the judgment tier's call.
if (!skeleton) {
  // The three shapes the shipped templates actually use, and nothing wider:
  //   {{NORTH_STAR}}   mustache, in PRODUCT
  //   <repo>, <team language>, <declare per artifact - default English>   angle, in prose
  //   | ... | ... |   a table row whose every cell is an ellipsis, in AGENTS.md/ARCHITECTURE.md
  // `:` `/` `=` and a leading `/` stay out of the angle form, so markdown autolinks
  // (`<https://x>`), HTML attributes (`<img src="x">`) and closing tags (`</div>`) are not
  // placeholders. That was not enough on its own: `<picture>`, `<code>` and friends have the
  // same shape as `<repo>`, and the warning fired on four repos' ordinary README markup -
  // files the standard never wrote. A single-word angle token that names an HTML element is
  // markup, so it is excluded by name; a multi-word one is prose and no HTML element looks
  // like that.
  //
  // Unicode, not ASCII: the pattern was `[A-Za-z]`-only, so `<角色名>` and
  // `<нужно заполнить>` were invisible and a translated but unfilled shell reached drift 0
  // with a clean bill of health.
  //
  // The ellipsis-row form is the other shape a template leaves behind: "your rows go here"
  // in the shipped AGENTS.md and ARCHITECTURE.md, kept verbatim by a showcase repo's own entry
  // file and unnoticed by either alternative above. A row of EMPTY cells is deliberately not
  // matched: an empty table is a legitimate steady state (no cycles in flight yet), and a
  // warning that state cannot clear is one everybody learns to skip.
  const HTML_ELEMENTS = new Set(
    ("a abbr address area article aside audio b bdi bdo big blockquote body br button canvas caption center cite code col colgroup " +
      "data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure font footer form g h1 h2 h3 h4 h5 h6 " +
      "head header hgroup hr html i iframe img input ins kbd label legend li li main map mark menu meta meter nav noscript object " +
      "ol optgroup option output p param path picture polygon polyline pre progress q rect rp rt ruby s samp script section select " +
      "slot small source span strong style sub summary sup svg symbol table tbody td template text textarea tfoot th thead time " +
      "title tr track u ul use var video wbr").split(" "),
  );
  const PLACEHOLDER_RE = /\{\{[^}\n]+\}\}|<(\p{L}[\p{L}\p{N} '._+-]{0,58})>|^\|(?:\s*(?:\.{3}|…)\s*\|)+\s*$/gmu;
  const hasPlaceholder = (body) => {
    for (const m of body.matchAll(PLACEHOLDER_RE)) {
      const angle = m[1];
      if (angle === undefined) return true; // the mustache and ellipsis-row forms are never anything else
      if (!/\s/.test(angle) && HTML_ELEMENTS.has(angle.toLowerCase())) continue;
      return true;
    }
    return false;
  };

  // Code spans and fenced blocks are stripped first, because generic notation lives there and
  // a *correctly filled* repo keeps it: `specs/<capability>`, `docs/discovery/<topic>/`,
  // `blocked:<id>`. Without this the warning can never be cleared - AGENTS.md ships
  // `specs/<capability>` in its own altitude ladder - and a warning nobody can clear is one
  // everybody learns to skip, on the single file this check exists for.
  //
  // The cost is a real placeholder written inside backticks going unseen. That is why the
  // shipped templates put fill markers in prose and keep code formatting for notation; the
  // convention is what makes the check precise, not the regex alone.
  const stripCode = (s) => s.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, "").replace(/`[^`\n]*`/g, "");

  for (const p of ["AGENTS.md", "README.md", "SECURITY.md", "docs/PRINCIPLES.md", "docs/PRODUCT.md", "docs/ARCHITECTURE.md", "docs/personas.md", "docs/backlog.md"]) {
    if (!exists(p)) continue;
    const body = stripCode(readFileSync(p, "utf8"));
    if (hasPlaceholder(body)) warning("fill", `${p} still carries template placeholders - filled shells, not copied ones, are the point`);
  }
}

// 3. stray transition skills (ADR-009 / SKILL-1) ---------------------------------
// These run FROM the standard repo and never ship inside a consuming repo (they can't -
// greenfield-start runs before the target repo even exists). A hit here is a hand-copy
// mistake, not drift - warn and suggest deleting it.
const TRANSITION_SKILLS = ["align-to-standards", "onboard-repo", "modernize", "greenfield-start"];
for (const name of TRANSITION_SKILLS) {
  const p = `.claude/skills/${name}`;
  if (existsSync(p)) {
    warning("skill", `${p} is a transition skill and must not ship here (ADR-009) - delete it`);
  }
}

// report ------------------------------------------------------------------------
const failed = results.filter((r) => !r.ok);
const drift = failed.length; // one unmet required entry = one point of drift
console.log(`\nself-verify - compliance with ${manifest ? `manifest ${manifest.version}` : "the BUILT-IN SKELETON (no standard.manifest.json here)"}\n`);
for (const r of results) {
  const tag = !r.ok ? "FAIL" : r.isWarning ? "WARN" : r.dim ? "····" : "PASS";
  // padEnd(9) leaves no gap after a 9-character name, so `reference` ran into its own
  // count: "reference9 method docs". One more column, and the separator is unconditional.
  console.log(`  ${tag}  ${r.name.padEnd(10)} ${r.msg}`);
}
console.log("");

// Drift counts what is unmet; adoption says how much of the standard this repo actually
// carries. They answer different questions and a repo mid-adoption needs the second one:
// "17 points of drift" reads as failure at every stage, while "63% adopted, 17 to go"
// reads as progress - and it is the same measurement.
//
// EXCEPTED ENTRIES STAY IN THE DENOMINATOR, and that arithmetic is the whole point of this
// paragraph. They used to drop out of it entirely, so excepting an entry RAISED the
// percentage: a tree taken to 13 file exceptions - no AGENTS.md, no personas, no capability
// map, every guard script deleted - printed "100% adopted (32/32)" where the same tree
// intact printed 49. Counting them as adopted instead would encode the same lie in the
// other direction: an exception is a recorded decision NOT to carry something, and
// "adopted" is not what that is. So an exception costs coverage and never buys it, is never
// drift (R17 - a recorded deviation is compliant), and is always counted out loud below.
const excepted = results.filter((r) => r.isExcepted).length;
const applicable = results.filter((r) => !r.isWarning && (!r.dim || r.isExcepted)).length;
const adopted = applicable - drift - excepted;
const pct = applicable ? Math.round((adopted / applicable) * 100) : 100;
const exceptedNote = `${excepted} excepted`;
// Whatever else the verdict says, it says which yardstick produced it. Without a manifest
// the denominator is the built-in skeleton and both numbers mean something much smaller
// than they look.
const scope = manifest
  ? ""
  : ` - AGAINST THE BUILT-IN ${applicable}-CHECK SKELETON, NOT A MANIFEST: this repo carries no standard.manifest.json, so the real distance from the standard is larger and is not measured here`;

if (drift === 0) {
  console.log(`self-verify: OK - drift 0 - ${pct}% adopted (${adopted}/${applicable}), ${exceptedNote} - ${manifest ? "compliant with the standard" : "every skeleton check met"}${scope}\n`);
  process.exit(0);
}
console.error(`self-verify: drift ${drift} - ${pct}% adopted (${adopted}/${applicable}), ${exceptedNote} - ${drift} required entr${drift === 1 ? "y is" : "ies are"} unmet${scope}\n`);
process.exit(warn ? 0 : 1);
