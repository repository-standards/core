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
//   2b. A guard whose prerequisites are absent is NOT RUN, and that is reported as its own
//      thing rather than as drift. Running `pnpm check:all` on a machine with no pnpm used
//      to score exactly what a genuine lint failure scores, so the number said "this
//      laptop" in the words of one that says "this repo".
//   3. Stray transition skills (ADR-009): align-to-standards, onboard-repo, modernize,
//      greenfield-start never ship in a consuming repo. One found under .claude/skills/
//      is a hand-copy mistake, flagged as a warning - it does not add to drift.
//   4. What drift 0 does NOT say. The number is the manifest, so a repo can meet every
//      entry and have specified no behaviour at all. When no capability spec exists, the
//      verdict says so instead of printing an unqualified "compliant with the standard".
//
// Usage:
//   node scripts/self-verify.mjs                  # gate: exit 1 on any failure
//   node scripts/self-verify.mjs --version 0.9.0  # also assert the record equals a target
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
import { delimiter } from "node:path";

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

// The same path, spelled differently, on a filesystem that cannot tell them apart.
//
// Reporting "CHANGELOG.md is missing" is correct - the manifest names that case and the repo does
// not carry it. What follows from the report is not: the adopter writes the file, and on APFS or
// NTFS that write lands ON the existing `ChangeLog.md` and destroys it. Reproduced on APFS: after
// writing `CHANGELOG.md` beside a `ChangeLog.md`, the directory still lists one file and its
// contents are the new ones. A repository's entire release history, gone, by following the
// procedure exactly.
//
// So a missing required file is checked for a case twin before the adopter is told to create it.
// `existsSync` resolves case-insensitively where the platform does, which is precisely the signal:
// the listing says no and the kernel says yes.
const caseTwin = (p) => {
  const parts = String(p).split("/").filter((s) => s && s !== ".");
  if (!parts.length) return null;
  const name = parts[parts.length - 1];
  const dir = parts.slice(0, -1).join("/") || ".";
  const twin = [...listing(dir)].find((e) => e !== name && e.toLowerCase() === name.toLowerCase());
  return twin ? (dir === "." ? twin : `${dir}/${twin}`) : null;
};

const results = [];
const pass = (name, msg) => results.push({ ok: true, name, msg });
const fail = (name, msg) => results.push({ ok: false, name, msg });
const note = (name, msg) => results.push({ ok: true, name, msg, dim: true });
const warning = (name, msg) => results.push({ ok: true, name, msg, isWarning: true });
// A check that could not run at all is neither a pass nor a failure, and collapsing it into
// either is how a number stops meaning what it says. It is dim (so it never enters the
// adoption arithmetic - it was never assessed) but it is counted and named in the verdict,
// because the one thing a skipped blocking check must not be is quiet.
const unrun = (id, msg) => results.push({ ok: true, name: "guard", msg, dim: true, isUnrun: true, id });

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
// same schema, second file - the engine eats them all and drift is one number.
//
// A repo whose stacks genuinely coexist carries one file per stack,
// `stack.<technology>.manifest.json` (ADR-037). The engine read exactly one filename, so a
// repo like flutter/flutter - a Dart framework beside a native engine, permanently, neither
// migrating to the other - could register one stack and the second was invisible: no entry
// checked, no drift, and nothing said a manifest had been ignored. Every match is read, in
// filename order so two runs on one tree report in the same order.
const STACK_MANIFEST = /^stack(?:\.[A-Za-z0-9][A-Za-z0-9._-]*)?\.manifest\.json$/;
if (manifest) {
  const declaredBy = new Map(); // path -> the stack manifest that claimed it first
  for (const file of [...listing(".")].filter((f) => STACK_MANIFEST.test(f)).sort()) {
    let stack;
    try {
      stack = JSON.parse(readFileSync(file, "utf8"));
    } catch (e) {
      fail("stack", `${file} is present but unparseable: ${e.message}`);
      continue;
    }
    // The stack's own version was carried and never spoken: the run named the technology and
    // stopped, so a repo sitting on a stack version several releases behind read exactly like
    // one on the newest. Printing it does not detect staleness - nothing here knows what the
    // stack repo currently ships (ADR-022: linked, not version-locked) - but an unspoken
    // number cannot even be compared by hand.
    const stackVersion = stack.version ? `@ ${stack.version}` : "with no version declared";
    note("stack", `${file}: ${stack.technology || "unnamed"} ${stackVersion} - technology layer counted in the same drift number (ADR-016/022)`);
    if (!stack.version) warning("stack", `${file} declares no version - nothing records which state of the stack this repo aligned to`);
    // Two stacks claiming one path is not drift and is not this repo's to resolve - but it
    // does mean the same file is checked twice and counted twice, so the number needs the
    // caveat out loud rather than a quiet collapse that picks a winner.
    for (const f of stack.files || []) {
      const first = declaredBy.get(f.path);
      if (first) warning("stack", `${f.path} is declared by both ${first} and ${file} - it is checked once per declaration, so it counts twice; the two stacks disagree about who owns the path (report it to them)`);
      else declaredBy.set(f.path, file);
    }
    for (const k of ["files", "sections", "guards", "exceptions"]) {
      manifest[k] = [...(manifest[k] || []), ...(stack[k] || [])];
    }
  }
}

// 0c. profile resolution (ADR-011): the CLI flag wins; else the repo's carried
// manifest copy may declare its chosen profile (written at align time); else
// scale = check everything. solo/team are accepted as deprecated aliases.
const profileArg = profileFlag || (manifest && manifest.profile) || "scale";
const coreOnly = profileArg === "core" || profileArg === "solo";
if (!profileFlag && manifest) {
  if (!manifest.profile) {
    // The shipped manifest declares the field, so a copy without it predates that or lost it
    // in a merge - and both this and the shipped CI gate then fall back to scale. Falling
    // back is right (the stricter tier, never the looser one); doing it without saying so is
    // not: a core repo reads "compliant" while being measured against gates ADR-011 scopes to
    // scale, and R11's own *(scale)* marker becomes text nothing acts on.
    warning("profile", "the manifest copy declares no profile - defaulted to scale; declare core or scale so the tier is a decision, not a fallback (ADR-011)");
  } else if (["core", "scale", "solo", "team"].includes(manifest.profile)) {
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

// Markdown has two heading forms and this only ever looked for one. `## Unreleased` matched;
// `Unreleased` underlined with `---` or `===` - setext, equally valid, and what a changelog
// written before ATX became the habit tends to use - did not. A repository whose changelog is
// setext throughout was told its `Unreleased` section was missing while the heading sat there
// in the file, and the only way to satisfy the check was to restyle somebody else's changelog.
//
// Setext underlines the PREVIOUS line, so the text and its marker are two lines that have to be
// read together. Fenced blocks are skipped: a sample changelog inside a code fence is an example
// of a section, not the section.
const FENCE_LINE = /^\s*(?:```|~~~)/;
function hasHeading(body, heading) {
  const atx = new RegExp(`^#{1,6}\\s+.*${escapeRe(heading)}`, "mi");
  if (atx.test(body)) return true;
  const lines = body.split("\n");
  const wanted = new RegExp(`^\\s*${escapeRe(heading)}\\b.*$`, "i");
  let inFence = false;
  for (let i = 0; i < lines.length - 1; i++) {
    if (FENCE_LINE.test(lines[i])) { inFence = !inFence; continue; }
    if (inFence) continue;
    // A setext underline is a run of `=` or `-` alone on the line. A single `-` is a list item
    // and a row of `---` under a table row is a delimiter, so the previous line has to read as
    // a heading rather than as content.
    if (!/^\s*(=+|-{2,})\s*$/.test(lines[i + 1])) continue;
    if (wanted.test(lines[i])) return true;
  }
  return false;
}
const hasFile = (p, alts = []) => [p, ...alts].some((x) => exists(x));
const isCore = (entry) => !entry.profile || entry.profile === "core"; // no profile = core (pre-ADR-011)

// Present on disk is not present in the repository. A required entry sitting under an
// ignore rule reported PASS and counted toward drift 0, while a fresh clone had nothing
// there: the roster, the decision records and the product pages could all be written,
// verified as compliant, and then not be in the commit. Found on a 19-year platform whose
// .gitignore excludes /docs/, which is where 16 of the manifest's 48 file entries live -
// the repo read `drift 0 - compliant with the standard` with none of them tracked.
//
// The test is deliberately ignored-AND-untracked, not merely untracked. Mid-adoption, files
// are authored before they are staged, and failing that would fire on every honest run of
// the very procedure that creates them. An ignore rule is different in kind: it cannot be
// resolved by getting round to `git add`, because `git add` refuses it.
//
// git is optional. A repo that is not a git work tree (a scaffold before `git init`, an
// export) is checked exactly as before rather than being told it failed something it has no
// way to satisfy.
const gitOk = (() => {
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: ["ignore", "pipe", "ignore"] });
    return true;
  } catch {
    return false;
  }
})();
const trackedPaths = (() => {
  if (!gitOk) return null;
  try {
    return new Set(execSync("git ls-files", { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split("\n").filter(Boolean));
  } catch {
    return null;
  }
})();
// Returns the matching ignore rule when the path is ignored and nothing under it is tracked,
// otherwise null. A directory entry counts as tracked when any file beneath it is.
const ignoredPath = (p) => {
  if (!p || !trackedPaths) return null;
  const prefix = p.endsWith("/") ? p : `${p}/`;
  for (const t of trackedPaths) if (t === p || t.startsWith(prefix)) return null;
  try {
    // -v prints "<ignore-file>:<line>:<pattern>\t<path>" and exits 0 only on a match.
    const out = execSync(`git check-ignore -v -- ${JSON.stringify(p)}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const rule = out.split("\t")[0].trim();
    return rule || "matched an ignore rule";
  } catch {
    return null; // exit 1 = not ignored; anything else is not a claim worth failing on
  }
};
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
// A read that fails is a difference, not a crash: a directory where the standard ships a
// file, an unreadable mode, a dangling symlink. A verifier that throws stops reporting the
// other sixty checks, which is the one thing it must never do.
const contentHash = (p) => {
  try {
    return createHash("sha256").update(readFileSync(p, "utf8").replace(/\r\n/g, "\n")).digest("hex");
  } catch {
    return null;
  }
};
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
    // Unreachable through the files loop, which only calls this once a path resolved -
    // said out loud rather than returned silently, because a content check that quietly
    // examines nothing is the failure this whole section is about.
    if (!alt) {
      note("content", `${f.path} is absent and no alternate path resolved - content not compared (reported by the files check)`);
      return;
    }
    if (typeof f.sha256 !== "string") {
      verifyPortedTree(f, alt);
      return;
    }
    // A DIRECTORY at an alternate path may legitimately be a port - a different format,
    // checked by name above. A FILE cannot: an altPath says the standard's file lives
    // somewhere else here, not that something else lives there instead. This was the same
    // hole one entry-shape over - the entry resolved, nothing was compared, and the run
    // said so in a dim note nobody reads as "unverified".
    if (contentHash(alt) === f.sha256) {
      pass("content", `${alt} stands in for ${f.path} and carries the standard's copy`);
      return;
    }
    failOrExcept("content", f.path, "content", `${alt} stands in for ${f.path} but its content is not the standard's - an alternate path is a different location for the standard's file, not permission for a different file (${CONTENT_HINT})`);
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
    else failOrExcept("key", `${f.path}#${key}`, "key", `${p} is missing the "${key}" key - a merge keeps what the repo already has AND what the standard brings; this key is the part of ${f.path} the standard is asking for (${f.purpose || f.rule || "required by the manifest entry"})`);
  }
};

// 2c. what a guard needs before it can answer anything ---------------------------
// A guard reports on the repo only when the tools it shells out to are actually here. With
// no pnpm on PATH, `pnpm check:all` exited non-zero with a bare `command not found` and
// scored `drift 1 - 99% adopted (78/79)` - byte for byte what a genuine lint failure on a
// compliant repo scores. Two different questions, one number, no way to tell them apart.
// prerequisites.md already states the rule this restores: self-verify scores the repo's
// structure, not the machine it runs on, and a laptop missing a tool is not repository
// drift.
//
// So a guard whose prerequisites are absent is NOT RUN: never drift, never a pass, named in
// its own category and again in the verdict. Prerequisites come from two places.
//
//   Declared, on the guard entry:
//     "requires": [{ "kind": "command", "match": "pnpm" },
//                  { "kind": "path", "match": "node_modules", "hint": "..." }]
//   The `path` kind is what keeps a compliance check from having side effects. With a
//   package manager present and its dependency tree absent, RUNNING the guard is what
//   installs the tree - off the network, as a side effect of asking a question about the
//   repo; recorded once at 376 packages and ~670 MB, and reproducible on demand, though
//   whether it fires at all turns out to depend on the package manager's local settings.
//   The only way not to do it is to look before shelling out, and only the entry that knows
//   the toolchain can say what to look for.
//
//   Inferred, from `run`: every bare command word that is no shell builtin and resolves
//   nowhere on PATH. This is the part that needs nothing declared, so a stack whose guard
//   predates the field still gets a legible answer.
//
// Inference errs toward RUNNING the guard, in every direction it can be wrong, because the
// wrong answer here is a check that quietly stops running:
//   - quoted text is blanked before anything is split, so a tool named inside an error
//     message is never probed;
//   - a word carrying a `/` is left to the script rule below, since a relative path means
//     something different after a `cd`;
//   - `a || b` is a FALLBACK, not two requirements: the group is satisfied when either side
//     resolves, and reporting `b` because `a` was taken would skip a guard that works;
//   - the node executing this file is never probed - a runtime invoked by absolute path
//     from outside PATH would otherwise silence every guard at once;
//   - anything this cannot parse runs exactly as it did before.
const SH_WORDS = new Set(
  (": . [ [[ ]] alias bg break builtin case cd command continue do done echo elif else esac eval exec exit " +
    "export false fc fg fi for function getopts hash if in jobs kill let local newgrp printf pwd read " +
    "readonly return set shift source test then time times trap true type ulimit umask unalias unset until wait while").split(" "),
);
const ALWAYS_AVAILABLE = new Set(["node", "nodejs"]);
const PATH_EXTS = process.platform === "win32" ? ["", ".exe", ".cmd", ".bat"] : [""];
const onPath = (cmd) =>
  (process.env.PATH || "")
    .split(delimiter)
    .filter(Boolean)
    .some((dir) =>
      PATH_EXTS.some((ext) => {
        try {
          return statSync(`${dir}/${cmd}${ext}`).isFile();
        } catch {
          return false;
        }
      }),
    );

const commandWord = (seg) => seg.trim().replace(/^[({!]+\s*/, "").replace(/^(?:\w+=\S*\s+)+/, "").split(/\s+/)[0] || "";
const probeable = (w) => /^[A-Za-z][\w.+-]*$/.test(w) && !SH_WORDS.has(w) && !ALWAYS_AVAILABLE.has(w);
// `||` is swapped for a sentinel the operator split cannot see, so a fallback chain stays
// ONE group; every other operator separates things that all have to be there (both stages
// of a pipeline, both sides of `&&`). The sentinel carries no shell metacharacter of its
// own - one that did would be found by the very split it is hiding from, and no NUL, which
// tree-check forbids in tracked text for exactly the reason it would be convenient here.
const OR = "@@self-verify-or@@";
const unresolvedCommands = (run) => {
  const missing = new Set();
  const sanitized = String(run).replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').split("||").join(OR);
  for (const group of sanitized.split(/&&|[;|&\n]/)) {
    const words = group.split(OR).map(commandWord).filter(Boolean);
    // An alternative this cannot classify - a shell builtin, the running node, a redirect, a
    // quoted remnant - is one that may well work, so the group is satisfied and nothing is
    // reported. Only a group whose every alternative is a plain name that resolves nowhere
    // is a prerequisite this machine does not have.
    if (!words.length || words.some((w) => !probeable(w) || onPath(w))) continue;
    for (const w of words) missing.add(w);
  }
  return missing;
};

const REQUIRE_KINDS = ["command", "path"];
// A malformed `requires` entry is drift, for the same reason a malformed exception is: a
// prerequisite nobody can evaluate is how a blocking guard stops running while the run
// still reads green.
const missingPrerequisites = (g) => {
  const missing = [];
  const declared = new Set();
  for (const r of g.requires || []) {
    const label = `${r?.kind ?? "(no kind)"}:${r?.match ?? "(no match)"}`;
    if (!REQUIRE_KINDS.includes(r?.kind) || !String(r?.match ?? "").trim()) {
      fail("guard", `${g.id} carries an unusable requires entry ${label} - each one is { "kind": "command"|"path", "match": "...", "hint": "..." (optional) }, and a prerequisite that cannot be evaluated would stop a blocking guard running while the run still reads green`);
      continue;
    }
    if (r.kind === "command") declared.add(r.match);
    const met = r.kind === "command" ? onPath(r.match) : exists(r.match);
    if (!met) missing.push(`${r.match} ${r.kind === "command" ? "is not on PATH" : "is absent from this repo"}${r.hint ? ` (${r.hint})` : ""}`);
  }
  for (const c of unresolvedCommands(g.run)) {
    if (!declared.has(c) && !onPath(c)) missing.push(`${c} is not on PATH`);
  }
  return missing;
};

// The branch a shipped workflow triggers on.
//
// All three workflows ship `branches: [main]`, and the manifest can only require that a key
// EXISTS - `on.push`, `on.pull_request` - never what it contains. So a repository whose default
// branch is `master` takes the file verbatim, reaches drift 0, and carries a push trigger that
// can never fire. `spec-guard.yml`'s own comment says it is gated from the first push; on that
// repo the sentence was silently false, and nothing anywhere said so.
//
// A WARN, not drift: the file is merge-class and the branch name is exactly the kind of local
// adaptation an adopter is expected to make. What was missing was anyone telling them.
//
// Silent when the default branch cannot be read - a repo with no remote is not a repo with a
// problem, and guessing from the current branch would fire on every feature branch.
const defaultBranch = () => {
  try {
    const ref = execSync("git symbolic-ref --short refs/remotes/origin/HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return ref.replace(/^origin\//, "") || null;
  } catch {
    return null;
  }
};

const checkWorkflowBranches = () => {
  const branch = defaultBranch();
  if (!branch) return;
  for (const f of manifest.files || []) {
    if (!/^\.github\/workflows\/.*\.ya?ml$/.test(f.path)) continue;
    const at = [f.path, ...(f.altPaths || [])].find((x) => exists(x));
    if (!at) continue;
    const named = [...readFileSync(at, "utf8").matchAll(/^\s*branches:\s*\[([^\]]*)\]/gm)]
      .flatMap((m) => m[1].split(",").map((b) => b.trim().replace(/^['"]|['"]$/g, "")))
      .filter(Boolean);
    if (!named.length || named.includes(branch)) continue;
    warning(
      "file",
      `${at} triggers on ${named.map((b) => `"${b}"`).join(", ")} and this repo's default branch is "${branch}" - the trigger cannot fire, and nothing else reports it because the manifest can only require that the key exists, not what it names`,
    );
  }
};

if (manifest) {
  checkWorkflowBranches();
  // method docs adopted by reference (ADR-004/023): named, never file-checked
  if ((manifest.references || []).length) {
    note("reference", `${manifest.references.length} method docs adopted by reference from the living standard - always latest (ADR-023/025); read them in the standards repo, never copy them here`);
  }
  // files
  for (const f of manifest.files || []) {
    if (coreOnly && !isCore(f)) { scaleSkipped++; continue; }
    if (f.adapt === "reference") { note("file", `${f.path} is reference-class - adopted by link to the living standard, no file expected here`); continue; }
    if (hasFile(f.path, f.altPaths)) {
      const ignored = ignoredPath([f.path, ...(f.altPaths || [])].find((x) => exists(x)));
      if (ignored) {
        failOrExcept("file", f.path, "file", `${f.path} exists on this disk but is git-ignored and untracked (${ignored}) - it is not in the repository, so a fresh clone does not have it`);
        continue;
      }
      pass("file", `${f.path} (${f.purpose})`);
      verifyContent(f);
      verifyKeys(f);
      continue;
    }
    // Said before the branch, because every branch below ends with somebody creating the file -
    // `fill-from-repo` most of all, since that class means "you will author this at adoption".
    const twin = caseTwin(f.path);
    if (twin) {
      warning(
        "file",
        `${f.path} is missing and ${twin} is here - the same name in another case. DO NOT CREATE ${f.path}: on a case-insensitive filesystem (macOS, Windows) that write lands on ${twin} and its contents are lost. Record an exception for ${f.path}, or agree a rename with the repo's owners first`,
      );
    }
    if (skeleton && f.adapt === "fill-from-repo") note("file", `${f.path} is authored at adoption - absent from the skeleton by design`);
    else if (f.required) failOrExcept("file", f.path, "file", `${f.path} missing - ${f.purpose}`);
    else note("file", `${f.path} absent (optional) - ${f.purpose}`);
  }
  // required sections within files.
  // A section names a file the files list may already allow somewhere else: reading only
  // s.file made a repo carrying its changelog at the entry's OWN declared alternate
  // (docs/CHANGELOG.md) pass the file entry and then fail the section with "CHANGELOG.md
  // missing" - about a file that was not missing, and with no way to close the drift
  // except moving the file to the path the altPath exists to avoid. The exception key
  // stays on s.file so a recorded deviation keeps working wherever the file resolves.
  const altsOf = new Map((manifest.files || []).map((f) => [f.path, f.altPaths || []]));
  for (const s of manifest.sections || []) {
    if (coreOnly && !isCore(s)) { scaleSkipped++; continue; }
    const at = [s.file, ...(altsOf.get(s.file) || [])].find((x) => exists(x));
    if (!at) {
      if (s.required) failOrExcept("section", `${s.file}#${s.heading}`, "section", `${s.file} missing, so "${s.heading}" cannot be checked`);
      continue;
    }
    const body = readFileSync(at, "utf8");
    if (hasHeading(body, s.heading)) pass("section", `${at} > "${s.heading}"`);
    else if (s.required) failOrExcept("section", `${s.file}#${s.heading}`, "section", `${at} is missing the "${s.heading}" section - ${s.purpose}`);
  }
  // static guards (skip self to avoid recursion; diff guards run in CI on the PR diff)
  if (skeleton) note("guard", "guards run in an adopted repo, not on the skeleton - skipped (--skeleton)");
  for (const g of skeleton ? [] : manifest.guards || []) {
    if (coreOnly && !isCore(g)) { scaleSkipped++; continue; }
    if (g.id === "self-verify") continue;
    if (g.kind === "diff") { note("guard", `${g.id} is diff-based - runs in CI on the PR diff, not here`); continue; }
    const script = (g.run.match(/scripts\/[\w.-]+\.mjs/) || [])[0];
    // Not installed = not run, because optional guards legitimately are not (no database,
    // no sprints). That tolerance is why a guard's script may not be excepted: excepting it
    // would turn "missing required file" into "check silently absent". See EXCEPTION_KINDS.
    // It used to be a dim note, which is most of the way to silent - it now goes through the
    // same category as a missing prerequisite and is counted in the verdict.
    if (script && !exists(script)) { unrun(g.id, `${g.id} NOT RUN - its script ${script} is not installed in this repo`); continue; }
    const lacking = missingPrerequisites(g);
    if (lacking.length) {
      unrun(g.id, `${g.id} NOT RUN - ${lacking.join("; ")}. A check that could not start has measured nothing, so it counts as neither drift nor adoption (see prerequisites.md in the standards repo); supply what it needs and re-run to get an answer for this one`);
      continue;
    }
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
  // Decisions are judgment-tier: a human confirms they are actually recorded at review.
  //
  // The catalog is a MENU, and the summary here used to print its length - "8 catalogued
  // decisions to confirm recorded at review" - which reads as eight records this repo owes,
  // on every run, in a report whose other numbers are exactly that. R7 says the opposite in
  // as many words: which areas apply is a property of what is being built, so the rule
  // "names no subset and asserts no count", and the validation suite's own assessment of
  // five machine-learning repositories found none of them carrying the three areas most
  // often assumed universal - none of them in breach. So the line says what the reader has
  // to do instead of how many things there are to count.
  if ((manifest.decisions || []).length) {
    note("decision", `the decision catalog applies where it applies - confirm at review that every area this repo DOES decide is recorded, and that one it does not says so once (R7 names no subset and asserts no count - see ${METHOD_DOC})`);
  }
  // A decisions entry claiming `required` is a manifest asserting the subset R7 refuses to
  // assert. Nothing reads the field there - `required` decides drift-vs-note for files and
  // sections - so it could only ever be a claim about the standard that the standard denies.
  // Refused loudly rather than ignored: the eight shipped entries carried it for four
  // versions and the contradiction was found by reading, not by any check.
  // Array.isArray, not `|| []`: a malformed `decisions` that is an object would make this
  // loop throw, and a verifier that throws stops reporting the other sixty checks.
  for (const d of Array.isArray(manifest.decisions) ? manifest.decisions : []) {
    if (d?.required !== undefined) {
      fail("decision", `the decisions entry "${d.id ?? "(no id)"}" declares required:${d.required} - a decision area cannot be required by the manifest (R7 names no subset and asserts no count; which areas apply is a property of what this repo is building). Drop the field: nothing reads it here, and an area that must be enforced is a guard, not a flag`);
    }
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

// 2d. surviving template placeholders - drift 0 with empty shells is a hollow win.
// A warning, never drift: substance stays the judgment tier's call.
let hollow = false; // no capability spec here - what drift 0 does not say (2e below)
if (!skeleton) {
  // The shapes the shipped templates actually use, and nothing wider:
  //   {{NORTH_STAR}}   mustache, in PRODUCT and SECURITY
  //   <repo>, <team language>, <declare per artifact - default English>   angle, in prose
  //   | ... | ... |   a table row whose every cell is an ellipsis, in AGENTS.md/ARCHITECTURE.md
  //   > **Template …  the "rewrite this and delete this note" banner, in PRINCIPLES
  // The first and last are read from the raw file and the middle two after code spans are
  // stripped; the split, and why, is at RAW_PLACEHOLDER_RE below.
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
  // matched: an empty table is a legitimate steady state (no sprints in flight yet), and a
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
  // The same list without the angle form - for documents whose prose the standard does not
  // own. Mustache and ellipsis rows are never anything else, so this half has no
  // false-positive surface at all; see the record scan below for why that matters there.
  const UNAMBIGUOUS_RE = /\{\{[^}\n]+\}\}|^\|(?:\s*(?:\.{3}|…)\s*\|)+\s*$/gm;
  const hasPlaceholder = (body, re = PLACEHOLDER_RE) => {
    for (const m of body.matchAll(re)) {
      const angle = m[1];
      if (angle === undefined) return true; // the ellipsis-row form is never anything else
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
  //
  // Markdown has four code forms and this used to strip two. The other two are what a
  // document written before fenced blocks existed actually uses, and both were found on
  // real repositories the standard never wrote:
  //   - a code span that WRAPS A LINE BREAK. git/git's README.md:26-27 reads
  //     "`man git-<commandname>` or `git help\n<commandname>`" - the span crosses the line
  //     end, the old `[^`\n]*` refused to cross it, and the leftover `<commandname>` on the
  //     next line was read as a placeholder. A span may now contain newlines but never a
  //     BLANK line, so an unmatched backtick cannot swallow the rest of the file.
  //     The delimiter is a RUN of backticks matched by its own length, which is what
  //     markdown says and what keeps the pairing local: with a single-backtick pattern, a
  //     `` `x` `` span (the form used to show a backtick) left an odd backtick behind and
  //     every span after it paired one position out - which, once spans could cross lines,
  //     exposed the notation on the following lines instead of stripping it.
  //   - an INDENTED code block (four spaces or a tab, the pre-fence form). vim/vim's own
  //     AGENTS.md:92 carries `Signed-off-by: Author Name <email>` inside one.
  // A four-space indent under a list item is a continuation paragraph rather than code, so
  // the run is only stripped when the line introducing it is not a list item - otherwise a
  // real placeholder in a nested bullet would go unseen, which is the failure this check
  // exists to prevent, in the other direction.
  const stripIndentedBlocks = (s) => {
    const out = [];
    let prevNonBlank = "";
    let afterBlank = true; // start of file behaves like the line after a blank one
    let inBlock = false;
    for (const line of s.split("\n")) {
      const blank = !line.trim();
      const indented = /^(?: {4,}|\t)/.test(line);
      if (inBlock) {
        if (blank || indented) {
          out.push(blank ? line : "");
          continue;
        }
        inBlock = false;
      }
      if (!blank && indented && afterBlank && !/^\s*(?:[-*+]|\d+[.)])\s/.test(prevNonBlank)) {
        inBlock = true;
        out.push("");
        continue;
      }
      out.push(line);
      afterBlank = blank;
      if (!blank) prevNonBlank = line;
    }
    return out.join("\n");
  };
  // `\r` is in the blank-line class on purpose: a CRLF checkout writes "\r\n\r\n" between
  // paragraphs, and without it an unmatched backtick in such a file would still cross one.
  const stripSpans = (s) =>
    s.replace(/(`+)([\s\S]*?)\1/g, (whole, _delim, inner) => (/\n[ \t\r]*\n/.test(inner) ? whole : ""));
  const stripCode = (s) => stripSpans(stripIndentedBlocks(s.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, "")));

  // Decision records are in scope too, and they are found by the record filename pattern
  // rather than a fixed path, because their directory layout is the repo's choice (the
  // shipped adr/ + bdr/ split, or one flat folder). The record templates' `| **Author** |
  // {{AUTHOR}} |` row is the placeholder this list previously could not see at all: no
  // generator fills it, and every record ever written carried it to drift 0. The pattern
  // excludes `_template.md` and the stream READMEs for free - a template is supposed to hold
  // placeholders, and warning about it is how a warning gets ignored.
  //
  // Records are scanned with UNAMBIGUOUS_RE, not the full pattern, and that is deliberate.
  // The eight documents above are shells this standard wrote, so its "angle brackets in prose
  // mean replace me" convention governs them. A record is the repo's own writing, and records
  // quote paths and agent utterances in prose: measured against this project's own 33 records,
  // the angle form fires on 2 of them - `<standard>@<version>` and `<technology>` inside
  // quoted example dialogue - neither an unfilled anything. The cost is that an unfilled
  // `<short title of the decision>` in a record heading goes unwarned here; that one is
  // visible in the filename and in the index row, while the author row is the one that
  // survives unnoticed.
  //
  // Directory entries, never stat: an entry is recursed into only when it IS a directory, so
  // a symlink is a leaf here and a link loop cannot hang the check. An unreadable or absent
  // directory is not this check's business - the files[] entry above owns whether it must exist.
  const recordFiles = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return [];
    }
    const out = [];
    for (const e of entries) {
      if (e.isDirectory()) out.push(...recordFiles(`${dir}/${e.name}`));
      else if (/^(?:ADR|BDR)-\d+-.+\.md$/.test(e.name)) out.push(`${dir}/${e.name}`);
    }
    return out;
  };

  // The list is derived from the manifest, not written here. A hardcoded list of eight is a
  // second source of truth that silently stops covering what the manifest adds: CONTRIBUTING.md
  // is a fill-from-repo entry and was never on it, so a two-line stub of it was checked by
  // nothing at all. Directory entries are skipped - there is no single body to read.
  const isDir = (p) => {
    try {
      return statSync(p).isDirectory();
    } catch {
      return false;
    }
  };
  const fillFiles = (manifest?.files || [])
    .filter((f) => f.adapt === "fill-from-repo")
    .map((f) => [f.path, ...(f.altPaths || [])].find((x) => exists(x) && !isDir(x)))
    .filter(Boolean);
  // The original eight stay as a floor rather than being replaced by the derived set. Without
  // a manifest there is nothing to derive from - the skeleton fallback - and dropping to the
  // derived set alone would have quietly stopped scanning SECURITY.md, PRODUCT, ARCHITECTURE
  // and the roster on exactly the repos least likely to have filled them in.
  const FLOOR = ["AGENTS.md", "README.md", "SECURITY.md", "docs/PRINCIPLES.md", "docs/PRODUCT.md", "docs/ARCHITECTURE.md", "docs/personas.md", "docs/backlog.md"];
  const fillPaths = [...new Set([...fillFiles, ...FLOOR].filter((p) => exists(p) && !isDir(p)))];

  // A stub the adopter wrote themselves carries no template placeholder, so the check above
  // cannot see it. Six files reading "# Title\n\nTODO." moved a sparse repo from 21% to 37%
  // adopted with its real substance unchanged, because a fill-from-repo entry scores on
  // existence alone and by construction cannot be hashed - the adopter writes the content.
  //
  // What is detected is "visibly nothing written", not "not enough written". Anything else
  // would be measuring prose by the yard: a genuine two-sentence SECURITY.md naming an address
  // and a response time is complete, and a length threshold that failed it while passing a
  // padded one would teach adopters to pad. So: a body with no content beyond its headings, or
  // whose only content is a marker meaning nobody has written this yet. Both are unambiguous,
  // and both are cleared by writing one real sentence - which is the whole ask.
  //
  // Still a warning, never drift. Whether what IS written is any good stays the judgment tier's
  // call (ADR-038), and the adopted percentage counts entries present, not substance present.
  const NOTHING_YET = /^(?:to\s?do|todo|tbd|t\.b\.d\.?|fixme|xxx|n\/?a|none|coming soon|to be (?:written|filled|done|completed)|fill (?:me )?in|placeholder|wip|work in progress)\b[\s.!:;-]*$/i;
  // Deliberately does NOT strip code. That strip exists for the placeholder check, where the
  // question is notation-versus-prose; here the question is whether anything was written at
  // all, and a SECURITY.md whose whole body is the command to file an advisory has told the
  // reader what to do. Stripping it warned on that file, which is a false positive on a
  // warning - and a warning that fires on a finished file is one everybody learns to skip.
  const proseOf = (raw) =>
    raw
      .replace(/<!--[\s\S]*?-->/g, "")
      .split("\n")
      .filter((l) => !/^\s*#{1,6}\s/.test(l))
      .join("\n")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/\s+/g, " ")
      .trim();

  // Two forms are read from the RAW body instead, because stripping was silently passing the
  // files the check exists for: the shipped SECURITY.md writes `{{SECURITY_CONTACT}}` inside
  // backticks and docs/personas.md wrote its roster marker the same way, so a fake security
  // contact and an empty persona roster both reached drift 0 with nothing said.
  //
  //   {{UPPER_SNAKE}}   a fill marker and nothing else, wherever it is written. Restricted to
  //                     that shape on purpose: `${{ github.token }}` and `{{ user.name }}` are
  //                     real content in a filled repo's README, and neither starts with a
  //                     capital or stays inside [A-Z0-9_].
  //   > **Template …    the banner a shipped template puts at the top of itself, telling the
  //                     reader to rewrite the file and delete the note. docs/PRINCIPLES.md
  //                     carries no marker of any other form, so nothing at all fired on it -
  //                     while its own banner says shipping it unread adopts commitments
  //                     nobody agreed to. Deleting the note, as it instructs, clears this.
  const RAW_PLACEHOLDER_RE = /\{\{[A-Z][A-Z0-9_]*\}\}|^>\s*\*\*Template\b/m;

  for (const p of fillPaths) {
    const raw = readFileSync(p, "utf8");
    if (RAW_PLACEHOLDER_RE.test(raw) || hasPlaceholder(stripCode(raw))) {
      warning("fill", `${p} still carries template placeholders - filled shells, not copied ones, are the point`);
      continue;
    }
    const prose = proseOf(raw);
    if (!prose) {
      warning("fill", `${p} has no content beyond its headings - it counts as present, and presence is not substance`);
    } else if (NOTHING_YET.test(prose)) {
      warning("fill", `${p} says only "${prose.slice(0, 40)}" - it counts as present, and presence is not substance`);
    }
  }

  // Records carry prose the standard did not write, so they are scanned for the unambiguous
  // shapes only, and for placeholders alone - a record's substance is what it decided, which
  // no pattern here can weigh.
  for (const p of recordFiles("docs/decision-records")) {
    const raw = readFileSync(p, "utf8");
    if (RAW_PLACEHOLDER_RE.test(raw) || hasPlaceholder(stripCode(raw), UNAMBIGUOUS_RE))
      warning("fill", `${p} still carries template placeholders - filled shells, not copied ones, are the point`);
  }

  // 2e. drift 0 on a repo that has specified nothing.
  // Measured on a raw greenfield tree: three declarative files - `.standards-version`, a
  // `profile` key, and an empty `specs/capability-map.json` - walked it from drift 3 to
  // `OK - drift 0 - 100% adopted (69/69) - compliant with the standard`, with not one
  // capability spec written and every shipped template still a shell. The number was not
  // wrong; every manifest entry really was met. The sentence was. "Compliant" reads as "the
  // method has been used here", and what had been measured was that the folders are in the
  // right places.
  //
  // Reported, never scored, and that distinction is the whole design. The greenfield walk
  // scaffolds the repo in step 1 and writes the first spec in step 6, and step 1 promises
  // "Empty but valid: self-verify passes". Making the absence drift would put drift 0 out of
  // reach of an honest brand-new repo for the entire length of the interview, and a failure
  // nobody can clear is one everybody learns to route around - the same reason the
  // placeholder scan above warns rather than counting. Substance stays the judgment tier's
  // call; what changes is that the verdict stops claiming more than it checked.
  const specWalk = (dir, depth, acc) => {
    if (depth < 0) return acc;
    let entries = [];
    try {
      entries = readdirSync(dir);
    } catch {
      return acc; // no specs/ at all - the files check reports that; here it just means none
    }
    for (const e of entries) {
      const p = `${dir}/${e}`;
      let isDir = false;
      try {
        isDir = statSync(p).isDirectory();
      } catch {
        continue; // a broken symlink specifies nothing
      }
      if (isDir) specWalk(p, depth - 1, acc);
      else acc.push(p);
    }
    return acc;
  };
  // The same shape spec-structure.mjs holds a capability spec to: specs/<capability>/<file>.md.
  // Templates, READMEs and the spec engine's ephemeral plan/tasks artifacts (ADR-010) are not
  // specified behaviour and must not read as any.
  const capabilitySpecs = specWalk("specs", 3, []).filter(
    (f) =>
      f.split("/").length >= 3 &&
      f.endsWith(".md") &&
      !f.includes(".template.") &&
      !/\/readme\.md$/i.test(f) &&
      !(/\/(?:plan|tasks)\.md$/.test(f) || f.includes("/checklists/")),
  );
  if (!capabilitySpecs.length) {
    hollow = true;
    warning("spec", 'no capability spec exists here yet (specs/<capability>/spec.md) - drift measures the manifest, so it reaches 0 on a repo that has specified no behaviour at all; the shape is right, which is not the same claim as "the method has been used here"');
  }
}

// 2c. a committed dependency tree ------------------------------------------------
// Version-control hygiene the rest of the machine silently assumes: the coupling guard's
// globs are matched against whatever git reports as changed, so with a dependency tree
// tracked, a `**/`-prefixed capability glob matches paths inside it and a dependency bump
// trips a blocking gate for a capability nobody touched. spec-guard now ignores those paths;
// this says why they are there, because the repo is the thing that needs fixing.
//
// A warning, not drift: drift counts unmet MANIFEST entries (ADR-005), and no entry declares
// this. Naming it is what a later decision to make it cost something would be built on.
if (!skeleton) {
  try {
    // The pathspec is the cheap pre-filter (git's default `*` crosses `/`, so this reaches a
    // workspace's nested trees too); the segment test after it is what makes the answer exact,
    // so a directory merely named `my_node_modules` is not reported. maxBuffer is raised for
    // the case this check exists for: a committed dependency tree is a lot of paths, and the
    // default would turn the loudest instance into the silent one.
    const tracked = execSync('git ls-files -- "*node_modules/*"', {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .filter((f) => f.split("/").includes("node_modules"));
    if (tracked.length) {
      const ignored = exists(".gitignore") ? "" : " - and this repo has no .gitignore at all";
      warning("vcs", `${tracked.length} file(s) under node_modules/ are tracked in git${ignored}: a committed dependency tree is what a capability glob matches by accident`);
    }
  } catch {
    /* no git, or nothing matched - nothing to report */
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
  const tag = !r.ok ? "FAIL" : r.isWarning ? "WARN" : r.isUnrun ? "SKIP" : r.dim ? "····" : "PASS";
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

// A check that could not run is absent from BOTH numbers - it is not drift and it is not
// adoption - so the verdict has to carry it or it is absent from the report entirely, which
// is how "we ran the gate" and "the gate ran" quietly become different statements.
const notRun = results.filter((r) => r.isUnrun);
const notRunNote = notRun.length
  ? ` - ${notRun.length} CHECK${notRun.length === 1 ? "" : "S"} NOT RUN HERE (${notRun.map((r) => r.id).join(", ")}): a missing prerequisite, counted as neither drift nor adoption, so this verdict covers less than the manifest does`
  : "";
// The claim the drift-0 line makes is about the repo's SHAPE. On a repo with no capability
// spec that is the entire claim, and printing it unqualified is how "compliant" came to read
// as "the method has been used here".
const hollowNote = hollow
  ? " - AND THAT IS THE WHOLE CLAIM: no capability spec exists here yet, so this says the repo is shaped like the standard, not that any behaviour has been specified under it"
  : "";

// The percentage is structural. A `fill-from-repo` entry is content the adopter writes, so
// there is nothing to compare it against and it scores on presence: six files reading
// "# Title / TODO." moved a sparse repo from 21% to 37% adopted with its substance unchanged.
// Saying so where the number is printed is the honest fix; scoring prose mechanically would
// turn substance into ceremony (ADR-038). The fill warnings above name the ones that read as
// empty, and whether the rest say anything worth saying is reviewed at PR.
const fillWarnings = results.filter((r) => r.isWarning && r.name === "fill").length;
const substance = fillWarnings
  ? ` - ${fillWarnings} authored file${fillWarnings === 1 ? "" : "s"} flagged above as unfilled or empty: this percentage counts entries present, not substance written`
  : "";

// `OK` is reserved for a run that actually performed every check it was asked to. Drift 0
// with a blocking guard that never started is a true statement about a smaller question, and
// the word a reader skims must not say otherwise: this loosened the gate (a missing tool used
// to exit 1, and now does not), so what stops a skipped check reading as a clean bill of
// health is the wording and the count, not the exit code.
if (drift === 0) {
  console.log(`self-verify: ${notRun.length ? "" : "OK - "}drift 0 - ${pct}% adopted (${adopted}/${applicable}), ${exceptedNote} - ${manifest ? "compliant with the standard" : "every skeleton check met"}${scope}${notRunNote}${substance}${hollowNote}\n`);
  process.exit(0);
}
console.error(`self-verify: drift ${drift} - ${pct}% adopted (${adopted}/${applicable}), ${exceptedNote} - ${drift} required entr${drift === 1 ? "y is" : "ies are"} unmet${scope}${notRunNote}${substance}\n`);
process.exit(warn ? 0 : 1);
