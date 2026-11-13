#!/usr/bin/env node
// Spec-structure guard.
//
// Three mechanical structure checks on capability specs:
//   1. No ticket-numbered spec paths (`specs/<NNN-feature>/`, `specs/<cap>/<NNN-...>`) -
//      e.g. a leaked GitHub Spec Kit `specs/001-core/` folder. Capability specs live at
//      `specs/<capability>/spec.md` (or named sub-specs `specs/<capability>/<name>.md`) -
//      domain names, never numbers.
//   2. Every capability spec names a **role from the roster** it serves (standard ADR-064, R10),
//      when the repo has a `docs/roles.md` (or a legacy `docs/personas.md`, read with a
//      migration notice) - a spec that serves no one is incomplete,
//      and so is one that serves someone who does not exist. The roster table is the
//      constraint: a `**Serves:**` value naming nobody on it fails, and a roster the guard
//      cannot read is reported rather than treated as a roster that forbids nothing.
//   3. A spec's `**Status:**` is earned, not typed: one claiming `ready-to-develop` or
//      `live` must pass the clarify gate. Nothing read or wrote that field, so the status
//      the whole method reads as "this is settled" was decorative - a spec with four
//      guards green and a failing gate still said ready-to-develop.
//   4. A section heading appears once. A second `## Clarifications` - written instead of a
//      new `### Session` under the existing one - splits the section every reader and the
//      clarify gate take the first match of.
//   5. A spec that declares the buildable tier carries the sections that make it
//      buildable (R9). The template marked them REQUIRED and nothing read the template,
//      so a buildable spec shipped without its contracts and the sections were
//      retrofitted later, by hand, when somebody noticed.
//   6. A capability spec carries 1-3 job stories, each with a GIVEN/WHEN/THEN scenario that
//      names the acceptance criterion proving it (standard ADR-064). Held on every spec a
//      change touches and on any spec that already has the section; a spec predating the
//      section is warned about in a full-tree run, never failed for history.
//
// This is the "structure lint" half of specs/enforcement.md, made mechanical - the
// complement to the coupling guard (spec-guard.mjs).
//
// Usage:
//   node scripts/spec-structure.mjs                 # full tree (git ls-files) - audit / conformance
//   node scripts/spec-structure.mjs --staged        # pre-commit (staged files), warn only
//   node scripts/spec-structure.mjs --base <ref>    # CI (files changed vs base ref)
//   add --block to exit non-zero on a violation (default: warn, exit 0)
//
// No dependencies (Node built-ins only).

import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const staged = args.includes("--staged");
const block = args.includes("--block");
const baseIdx = args.indexOf("--base");
const base = baseIdx >= 0 ? args[baseIdx + 1] : null;

const sh = (c) => execSync(c, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();

// git quotes any path outside ASCII by default (`"specs/\321\206\320\265\320\275\321\213/spec.md"`),
// and a quoted path matches no glob and opens no file. The standard explicitly supports specs
// written in the repo's own language, so a capability directory named in Cyrillic or Chinese is
// expected, not exotic - and it would arrive here unreadable. Ask git for the real bytes.
const GIT = "git -c core.quotePath=false";

// Walk specs/ on the filesystem - the fallback when git is absent (a fresh degit has
// no .git) or tracks nothing there yet. A shipped guard never dumps a stack trace.
const fsWalk = (dir, acc = []) => {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    const p = `${dir}/${e}`;
    if (statSync(p).isDirectory()) fsWalk(p, acc);
    else acc.push(p);
  }
  return acc;
};

let files;
try {
  let raw;
  if (staged) raw = sh(`${GIT} diff --cached --name-only --diff-filter=ACMR -- specs`);
  else if (base) raw = sh(`${GIT} diff --name-only --diff-filter=ACMR ${base}...HEAD -- specs`);
  else {
    const tracked = sh(`${GIT} ls-files specs`);
    const untracked = sh(`${GIT} ls-files --others --exclude-standard -- specs`);
    raw = [tracked, untracked].filter(Boolean).join("\n");
    if (!raw) raw = fsWalk("specs").join("\n"); // brand-new repo, nothing there yet
  }
  files = raw.split("\n").filter(Boolean).filter((f) => f.startsWith("specs/"));
} catch (e) {
  if (staged || base) {
    const why = (e.stderr?.toString() || e.message || "").trim().split("\n")[0];
    console.error(`spec-structure: git failed in --staged/--base mode${why ? ` (${why})` : ""} - these modes need a git repo and a resolvable base ref.`);
    process.exit(1);
  }
  files = fsWalk("specs").filter((f) => f.startsWith("specs/"));
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// --- check 1: no ticket-numbered spec paths ------------------------------------
// A ticket-numbered segment: two or more leading digits then - or _ (Spec Kit's
// NNN-feature). Catches specs/001-booking/, specs/cms/001-core, specs/x/017-change.md.
const NUMBERED = /^\d{2,}[-_]/;
const numbered = [];
for (const f of files) {
  const segment = f.split("/").slice(1).find((s) => NUMBERED.test(s));
  if (segment) numbered.push({ file: f, segment });
}

// --- check 2: every capability spec serves a role on the roster (standard ADR-064, R10) --------
// A capability spec is specs/<capability>/<file>.md (depth >= 3), not a template or README.
// Files under specs/ that the engine writes and that are not themselves capability specs -
// so the role gate below has no opinion about them. All six of them: `/spec-plan` is
// documented to produce research.md in Phase 0 and data-model.md, quickstart.md and
// contracts/ in Phase 1, and only plan.md and tasks.md were listed here - so
// `--base <ref> --block`, the form CI runs, failed the role gate on the other four in
// every PR opened between /spec-plan and /spec-reconcile, a mid-workflow state the comment
// beside the full-tree check already calls legitimate.
//
// The directory forms are anchored at `specs/<capability>/` on purpose: `contracts` and
// `checklists` are ordinary words, and an unanchored `/contracts/` would read a capability
// genuinely called that - `specs/contracts/spec.md` in a repo whose domain is contracts -
// as scaffolding and exempt its whole directory from the role gate.
//
// What is removable when the work closes is a narrower set and lives at
// REMOVABLE_SCAFFOLDING below: not every file the engine writes is one the close deletes.
const NOT_A_CAP_SPEC = /\/(plan|tasks|research|data-model|quickstart)\.md$|^specs\/[^/]+\/(checklists|contracts)\//;
const isCapSpec = (f) =>
  f.split("/").length >= 3 && f.endsWith(".md") && !f.includes(".template.") && !/\/readme\.md$/i.test(f) && !NOT_A_CAP_SPEC.test(f);

// An unfilled marker is not a role, in either shape the shipped templates use. Only the
// angle form was recognised, and the two readers below each tested for it separately - so
// when the roster file moved its marker to the mustache form, an untouched template both
// supplied a live roster entry named after the placeholder and satisfied a spec's `Serves`
// field with the same string. One answer, both readers.
const isPlaceholder = (s) => s.includes("<") || s.includes("{{");

// The whole `**Serves:**` field as the lines [at, end): its own line and every line that
// continues it. A spec routinely serves two or three roles and says how it serves each, and a
// value long enough to say that wraps. The continuation stops at a blank line, the next
// `**Field:**`, a heading, a list or a table, which keeps the rest of the spec out of the
// value. One reader for the roster check and for the rename exemption in check 6, so the two
// cannot disagree about where the field ends.
const servesSpan = (lines) => {
  const at = lines.findIndex((l) => /\*\*Serves:\*\*/i.test(l));
  if (at < 0) return null;
  let end = at + 1;
  while (end < lines.length && lines[end].trim() && !/^\s*(\*\*|#{1,6}\s|\||[-*+]\s|\d+[.)]\s)/.test(lines[end])) end++;
  return { at, end };
};

const roleless = []; // names nobody at all
const offRoster = []; // names somebody the roster has never heard of
let rosterMissing = false; // capability specs exist but no roster - the R10 gate has nothing to hold
let rosterHeadingMissing = false; // a roster file the guard cannot find the roster in
let rosterUnreadable = null; // a roster section no role parses out of - an empty set forbids nothing
let rosterNames = [];
// `docs/roles.md` is the roster (standard ADR-064). A repo that has not migrated yet still has
// `docs/personas.md`; reading it keeps the gate on through the move instead of switching it
// off for a release, and the notice at the end says how to finish the move.
const rosterPath = ["docs/roles.md", "docs/personas.md", "personas.md"].find((p) => existsSync(p));
const legacyRoster = Boolean(rosterPath) && rosterPath !== "docs/roles.md";
if (!rosterPath && files.some(isCapSpec)) rosterMissing = true;
if (rosterPath) {
  const roster = new Set();
  let rosterLines = 0; // table lines under the heading, however they are written
  const rosterFileLines = readFileSync(rosterPath, "utf8").split("\n");
  // Only the roster section counts. The shipped file also carries a filled worked example,
  // and scanning the whole file reads those names as live roles - which would let a spec
  // "serve" someone from the example's domain and pass the gate.
  //
  // Scoping to the heading is also how the check switched itself off: the earlier version
  // fell back to a whole-file scan when the heading was absent, so translating `## The
  // roster` widened the roster to every name in the file, worked example included - proven
  // with an English control, where the identical spec failed with the English heading and
  // passed with a translated one. A required heading that is absent is a failure, not a
  // reason to check something else instead. The heading is syntax: it stays in English even
  // when the roster it introduces is written in another language.
  const hasRosterHeading = rosterFileLines.some((l) => /^##\s+the roster\b/i.test(l));
  if (!hasRosterHeading) rosterHeadingMissing = true;
  let inRoster = false;
  for (const line of hasRosterHeading ? rosterFileLines : []) {
    if (/^##\s/.test(line)) {
      inRoster = /^##\s+the roster\b/i.test(line);
      continue;
    }
    if (!inRoster) continue;
    if (/^\|/.test(line) && !/^\|[\s|:-]*\|?\s*$/.test(line)) rosterLines++; // not the |---| separator
    const m = line.match(/^\|\s*`([^`]+)`\s*\|/); // roster rows: | `Name` | ...
    if (m && !isPlaceholder(m[1])) roster.add(m[1]); // as written - the failure quotes it back
  }
  rosterNames = [...roster];

  // An empty roster is not a permissive roster, it is an unread one. Every arm below is a
  // membership test, so a roster that parses to nothing would pass every spec by having
  // nothing left to contradict - which is exactly how this check hid: its first arm passed
  // any non-placeholder `**Serves:**` string without consulting the roster at all, so
  // stripping the backticks off every row changed no verdict. Say the roster could not be
  // read; do not quietly check against an empty set.
  const capSpecs = files.filter(isCapSpec);
  if (hasRosterHeading && roster.size === 0 && capSpecs.length) rosterUnreadable = { lines: rosterLines };

  // Bounded by non-letters on both sides: a role is a short word (`Host`, `Admin`), and a bare
  // substring test let `Ghost writer` serve `Host`.
  const onRoster = (text) =>
    rosterNames.some((n) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(n)}(?![\\p{L}\\p{N}])`, "iu").test(text));
  for (const f of hasRosterHeading && !rosterUnreadable ? capSpecs : []) {
    let body;
    try { body = readFileSync(f, "utf8"); } catch { continue; }
    // The whole `**Serves:**` value: all of its names, and all of its lines (servesSpan). Reading
    // only the first backticked name would make the rest invisible; the point of scoping to
    // the field is that the field is the claim.
    const lines = body.split("\n");
    const span = servesSpan(lines);
    let claim = "";
    if (span) {
      claim = [lines[span.at].replace(/^[\s\S]*?\*\*Serves:\*\*/i, ""), ...lines.slice(span.at + 1, span.end)].join(" ");
      claim = claim.replace(/<!--[\s\S]*?(-->|$)/g, "").replace(/`/g, "").trim();
    }
    // `<role from docs/roles.md>` is the shipped template's placeholder - the question,
    // not an answer. A value that is nothing but placeholders counts as no field at all, so a
    // spec copied from the template and never filled in is reported as serving nobody rather
    // than as serving a role named "<role from docs/roles.md>". Both marker shapes
    // the templates use are stripped: when the roster file moved its marker to the
    // mustache form, an angle-only test read the untouched placeholder as a filled claim.
    const filled = /[\p{L}\p{N}]/u.test(claim.replace(/<[^>]*>/g, "").replace(/\{\{[^}]*\}\}/g, ""));
    // A spec with no `Serves` field can still name its role in prose - the roster is what
    // must recognise the name, not the field. What no longer counts: a name the roster has
    // never heard of, and prose that merely asks the question ("for whom") without answering
    // it, both of which used to satisfy this check on their own.
    if (filled) {
      if (!onRoster(claim)) offRoster.push({ file: f, claim });
    } else if (!onRoster(body)) {
      roleless.push(f);
    }
  }
}

// --- check 3: a claimed status is earned, not typed -----------------------------
// `**Status:** ready-to-develop` is what plan, tasks and the tracker read as "settled",
// and nothing checked it against the gate that is supposed to grant it. The gate script
// is the single implementation - shelling out to it keeps this from becoming a second,
// drifting copy of the same rules. It sits next to this file in both layouts (the tree's
// `standard/scripts/` and an adopted repo's `scripts/`), so it is resolved relative to
// this module, never to the working directory.
const EARNED = new Set(["ready-to-develop", "live"]); // statuses that assert the gate passed
const gatePath = fileURLToPath(new URL("spec/check-spec-clarified.sh", import.meta.url));
const statusOf = (body) => {
  const m = body.match(/^\*\*Status:\*\*\s*(.+)$/m);
  if (!m) return null;
  const value = m[1].replace(/<!--[\s\S]*$/, "").trim();
  if (value.includes("|")) return null; // the template's unfilled list of options
  return value.replace(/[`*._]/g, "").trim();
};
// The lifecycle word alone, for comparisons: `Retired - superseded by billing` is retired.
const lifecycleOf = (body) => (statusOf(body) ?? "").split(/[\s(]/)[0].toLowerCase();

const unearned = [];
let gateMissing = false;
if (!existsSync(gatePath)) {
  gateMissing = true;
} else {
  for (const f of files.filter(isCapSpec)) {
    let body;
    try { body = readFileSync(f, "utf8"); } catch { continue; }
    const status = statusOf(body);
    if (!status || !EARNED.has(status)) continue;
    try {
      execSync(`bash ${JSON.stringify(gatePath)} ${JSON.stringify(f)}`, { stdio: "pipe" });
    } catch (e) {
      // A gate that cannot run is not a gate that passed - the status stays unproven.
      const out = ((e.stdout?.toString() || "") + (e.stderr?.toString() || "")).trim();
      unearned.push({ file: f, status, why: out || `the clarify gate could not be run (exit ${e.status ?? "?"}); it needs bash` });
    }
  }
}

// --- check 4: a section heading appears once -------------------------------------
// The clarify gate greps for `^## Clarifications` and stops at the first hit; a reader
// scanning for a section does the same. So a spec that grew a SECOND `## Clarifications`
// - written instead of a new `### Session <date>` under the existing one - hides
// everything below the split from both, and every guard stays green. Level 2 only:
// `### Session <date>` and `### <Other capability>` repeat by design one level down.
//
// Fenced blocks and HTML comments are skipped: a spec quoting markdown, and the shipped
// template's own guidance, are not the document's own structure. Line-by-line rather than
// a strip-then-scan, so the report can name the lines that collide.
const level2Headings = (body) => {
  const found = [];
  let inFence = false;
  let inComment = false;
  body.split("\n").forEach((raw, i) => {
    let text = raw;
    if (inComment) {
      const end = text.indexOf("-->");
      if (end < 0) return;
      text = text.slice(end + 3);
      inComment = false;
    }
    text = text.replace(/<!--[\s\S]*?-->/g, "");
    const open = text.indexOf("<!--");
    if (open >= 0) {
      text = text.slice(0, open);
      inComment = true;
    }
    if (/^\s*(```|~~~)/.test(text)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const m = text.match(/^##\s+(\S.*?)\s*$/);
    if (m) found.push({ line: i + 1, heading: m[1] });
  });
  return found;
};

const duplicated = [];
for (const f of files.filter(isCapSpec)) {
  let body;
  try { body = readFileSync(f, "utf8"); } catch { continue; }
  const byName = new Map();
  for (const h of level2Headings(body)) {
    const key = h.heading.toLowerCase().replace(/\s+/g, " ");
    byName.set(key, [...(byName.get(key) ?? []), h]);
  }
  for (const hits of byName.values()) {
    if (hits.length > 1) duplicated.push({ file: f, heading: hits[0].heading, lines: hits.map((h) => h.line) });
  }
}

// --- check 5: a buildable spec carries the sections that make it buildable (R9) --
// The template marks three sections REQUIRED for the buildable tier, and nothing read
// them: a spec shipped at that tier with no `## Data contracts` and no
// `## Interface contracts`, and the gap was found by a person, months later.
//
// Only a spec that DECLARES `buildable` is held to them, and that boundary is deliberate.
// R9 makes buildable the default, so a spec with no tier line is the same claim in
// principle - but failing every undeclared spec in a repo mid-adoption is how a guard gets
// switched off, and a switched-off guard checks nothing at all. An undeclared tier is
// reported as a warning instead, so deleting the line is not a silent way out.
//
// `Algorithms & rules` is NOT in the list: the template requires it "where logic is
// non-trivial", which is a judgment nothing here can make.
const BUILDABLE_SECTIONS = ["Data contracts", "Interface contracts", "Acceptance criteria"];
const NO_TIER = "(none)";
const tierOf = (body) => {
  const m = body.match(/^\*\*Spec tier:\*\*\s*(.+)$/m);
  if (!m) return NO_TIER;
  const value = m[1].replace(/<!--[\s\S]*$/, "").trim();
  if (value.includes("|")) return NO_TIER; // the template's unfilled list of tiers
  return value.replace(/[`*.]/g, "").trim().toLowerCase();
};

// The content under `## <heading>`, up to the next heading of the same or a higher level -
// so a section whose body opens with a `###` sub-heading still counts as filled. HTML
// comments are stripped first: the shipped template's sections are comment-only, and a
// section carrying nothing but the template's instructions is an empty section.
// A heading inside a fenced block is the block's content, not the document's structure: a
// `# comment` in a shell example must not end the section it sits in, and a template quoted in
// a fence must not be read as the real section.
const sectionBody = (body, heading) => {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const want = new RegExp(`^##\\s+${escapeRe(heading)}\\b`, "i");
  let inFence = false;
  let start = -1;
  const out = [];
  for (const line of lines) {
    const fence = /^\s*(```|~~~)/.test(line);
    if (!inFence && !fence && /^#{1,2}\s/.test(line)) {
      if (start >= 0) break;
      if (want.test(line)) start = 0;
      continue;
    }
    if (fence) inFence = !inFence;
    if (start >= 0) out.push(line);
  }
  return start < 0 ? null : out.join("\n").replace(/<!--[\s\S]*?-->/g, "");
};
const sectionIsFilled = (body, heading) => (sectionBody(body, heading) ?? "").trim().length > 0;

const thin = [];
const untiered = [];
for (const f of files.filter(isCapSpec)) {
  let body;
  try { body = readFileSync(f, "utf8"); } catch { continue; }
  const tier = tierOf(body);
  // A named sub-spec (`specs/<cap>/<name>.md`) extends the capability's spec rather than
  // repeating it, so it is held to the tier only when it claims one itself.
  if (tier === NO_TIER) {
    if (/\/spec\.md$/.test(f)) untiered.push(f);
    continue;
  }
  if (tier !== "buildable") continue;
  const missing = BUILDABLE_SECTIONS.filter((s) => !sectionIsFilled(body, s));
  if (missing.length) thin.push({ file: f, missing });
}

// --- check 6: job stories, each proven by an acceptance criterion (standard ADR-064) ----
// `**Serves:**` says who; nothing in the spec said what they need from it in a form a test
// could hold. A job story says it - `When <situation>, I want <motivation>, so I can
// <outcome>` - and the scenario under it ties it to a named acceptance criterion, so the need
// and its proof cannot drift apart without a reader seeing a dangling name.
//
// The prose is not read: a spec may be written in the repo's own language. What is read is
// the syntax the template ships - the `**JS-n.**` label, a scenario line carrying GIVEN, WHEN
// and THEN, and `(AC: <name>)` matching a bold criterion name under `## Acceptance criteria`.
//
// Where it binds: on every spec a change touches (`--staged`, `--base`), and in a full-tree
// run on any spec that already carries the section. A full-tree run over a spec that predates
// the section warns instead of failing - adopting the rule must not fail a repo for specs
// nobody has opened since, and the next change to each one brings it up to shape. A retired
// spec is frozen and exempt; a named sub-spec is held to it once it has the section; a change
// that only renames the role in `**Serves:**` (the migration itself) is treated as no change.
const MAX_JOB_STORIES = 3;
// Emphasis, code marks and a closing full stop are presentation, not part of a name.
const bareName = (n) => n.replace(/[`*_]/g, "").trim().replace(/\.$/, "").trim().toLowerCase();
const criterionNames = (body) => {
  const ac = sectionBody(body, "Acceptance criteria") ?? "";
  return new Set([...ac.matchAll(/^\s*[-*+]\s+\*\*(.+?)\*\*/gm)].map((m) => bareName(m[1])));
};
// `(AC: name)`, where the name may itself carry one level of parentheses.
const AC_LINK = /\(AC:\s*((?:[^()]|\([^()]*\))+)\)/gi;
// Only a whole `<word ...>` or `{{...}}` is a placeholder here: `settled in < 2s` is prose.
const isStoryPlaceholder = (s) => /<[^<>\s][^<>]*>|\{\{/.test(s);
const SCENARIO = /\bGIVEN\b[\s\S]*\bWHEN\b[\s\S]*\bTHEN\b/i;
const JS_LINE = /^\s*(?:[-*+]\s+)?\*\*(JS-\d+)\.?\*\*\s*(.*)$/;
// Stories and their scenarios. A nested bullet opens a scenario; a line that is not a bullet
// continues whatever is open, so a scenario wrapped across lines, or written Gherkin-style with
// WHEN and THEN on lines of their own, is read as one. Fenced lines are quoted, not content.
const readJobStories = (section) => {
  const stories = [];
  let open = null; // the text currently being continued
  let inFence = false;
  for (const line of section.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; }
    if (inFence || !line.trim()) continue;
    const js = line.match(JS_LINE);
    if (js) {
      stories.push({ id: js[1], text: js[2], blocks: [] });
      open = { target: "text" };
    } else if (!stories.length) {
      continue;
    } else if (/^\s*[-*+]\s/.test(line)) {
      stories.at(-1).blocks.push(line.trim());
      open = { target: "block" };
    } else if (open?.target === "block") {
      const b = stories.at(-1).blocks;
      b[b.length - 1] += ` ${line.trim()}`;
    } else {
      stories.at(-1).text += ` ${line.trim()}`;
    }
  }
  for (const st of stories) {
    st.scenarios = st.blocks.filter((b) => SCENARIO.test(b));
    // A scenario written on the story's own line, after the story.
    if (SCENARIO.test(st.text)) st.scenarios.unshift(st.text.slice(st.text.search(/\bGIVEN\b/i)));
  }
  return stories;
};
const jobStoryProblems = (body) => {
  const section = sectionBody(body, "Job stories");
  if (section === null) return null; // no section at all - the caller decides warn or fail
  const problems = [];
  const stories = readJobStories(section);
  if (stories.length === 0) return ["no `**JS-n.**` job story in `## Job stories`"];
  if (stories.length > MAX_JOB_STORIES) problems.push(`${stories.length} job stories (at most ${MAX_JOB_STORIES} - more usually means two capabilities)`);
  const criteria = criterionNames(body);
  for (const { id, text, scenarios } of stories) {
    if (!text.trim() || isStoryPlaceholder(text)) problems.push(`${id} is not filled in`);
    if (scenarios.length === 0) {
      problems.push(`${id} has no GIVEN/WHEN/THEN scenario`);
      continue;
    }
    for (const sc of scenarios) {
      const links = [...sc.matchAll(AC_LINK)].map((m) => m[1].trim());
      if (isStoryPlaceholder(sc)) problems.push(`${id} has an unfilled scenario`);
      else if (!links.length) problems.push(`${id} has a scenario naming no acceptance criterion - add \`(AC: <name>)\``);
      for (const l of isStoryPlaceholder(sc) ? [] : links)
        if (!criteria.has(bareName(l))) problems.push(`${id} names \`AC: ${l}\`, which is not a bold criterion name under \`## Acceptance criteria\``);
    }
  }
  return problems;
};

// A change that touches a spec only to rename the role in `**Serves:**` - the migration
// standard ADR-064 asks every adopting repo for - is not a change to what the spec says, so it is not
// the change that has to bring the spec up to the section. The before-side comes from the same
// ref the diff was taken against. The whole field is set aside on both sides, every line of it,
// so a multi-line value whose roles were renamed is still only a rename.
const blobAt = (rev, f) => {
  try { return execSync(`${GIT} cat-file blob ${JSON.stringify(`${rev}:${f}`)}`, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }); } catch { return null; }
};
const withoutServes = (t) => {
  const lines = t.replace(/\r\n?/g, "\n").split("\n");
  const span = servesSpan(lines);
  return span ? [...lines.slice(0, span.at), ...lines.slice(span.end)].join("\n") : lines.join("\n");
};
const onlyServesChanged = (f, body) => {
  const before = staged ? blobAt("HEAD", f) : base ? blobAt(sh(`${GIT} merge-base ${base} HEAD`), f) : null;
  return before !== null && withoutServes(before) === withoutServes(body);
};

const storyless = []; // a spec this change touches, with no job stories at all
const storyLegacy = []; // full-tree: a spec that predates the section (warn)
const storyBroken = []; // a section that exists and is malformed
for (const f of files.filter(isCapSpec)) {
  let body;
  try { body = readFileSync(f, "utf8"); } catch { continue; }
  if (lifecycleOf(body) === "retired") continue;
  // A named sub-spec extends its capability's spec.md, which carries the job stories; it is held
  // to the section only once it has one of its own - the same boundary check 5 draws for tiers.
  const sub = !/\/spec\.md$/.test(f);
  const problems = jobStoryProblems(body);
  if (problems === null && sub) continue;
  if (problems === null) (staged || base) && !onlyServesChanged(f, body) ? storyless.push(f) : storyLegacy.push(f);
  else if (problems.length) storyBroken.push({ file: f, problems });
}

// --- check 7 (warn only): committed engine scaffolding - ephemeral by rule -------
// plan.md/tasks.md are working scaffolds the engine writes and the close removes.
// Full-tree mode only (mid-work diffs legitimately carry them); never a violation.
//
// `checklists/` is deliberately NOT here, though it is not a capability spec either.
// R13 and standard ADR-010 make plan.md and tasks.md ephemeral and name nothing else, and
// spec-reconcile - the only step that actually deletes scaffolding - removes exactly
// those. `checklists/requirements.md` is written by spec-specify when the spec is minted
// and re-validated by spec-clarify on every later round, so warning about it told the
// author to remove a file the standard's own skill had just told them to create, one
// command earlier.
const REMOVABLE_SCAFFOLDING = /\/(plan|tasks)\.md$/;
const staleScaffolding = !staged && !base ? files.filter((f) => REMOVABLE_SCAFFOLDING.test(f)) : [];

// --- report --------------------------------------------------------------------
if (staleScaffolding.length) {
  console.error("\nspec-structure: WARN - engine scaffolding is committed (ephemeral - remove when the work closes):");
  for (const f of staleScaffolding) console.error(`  - ${f}`);
  console.error("");
}
if (untiered.length) {
  console.error("\nspec-structure: WARN - capability specs that declare no `**Spec tier:**` (R9 makes buildable the default):");
  for (const f of untiered) console.error(`  - ${f}`);
  console.error("Declare `buildable` (and carry its required sections) or `behavioral` (and justify it).");
  console.error("");
}
if (storyLegacy.length) {
  console.error("\nspec-structure: WARN - capability specs with no `## Job stories` section yet (standard ADR-064):");
  for (const f of storyLegacy) console.error(`  - ${f}`);
  console.error("Add 1-3 job stories, each with a GIVEN/WHEN/THEN scenario naming its acceptance criterion,");
  console.error("the next time each spec is changed - a change that touches the spec is held to it.");
  console.error("");
}
if (rosterPath === "docs/roles.md" && existsSync("docs/personas.md")) {
  console.error("\nspec-structure: note - docs/roles.md and docs/personas.md both exist. Only docs/roles.md is");
  console.error("read; if the real roster is still in docs/personas.md, move its rows over (the roles-write");
  console.error("skill's migration section) and delete the old file.");
  console.error("");
}
if (legacyRoster) {
  console.error(`\nspec-structure: note - the roster was read from ${rosterPath}, the name it had before roles`);
  console.error("replaced personas (standard ADR-064). Move it: `git mv` it to docs/roles.md, keep `## The roster`,");
  console.error("make each row an actor with its permissions and no biography, and fold any persona that differs");
  console.error("from another only by situation into a mode of that role. `update-to-latest` walks the move.");
  console.error("");
}
if (gateMissing) {
  console.error(`\nspec-structure: note - the clarify gate is not installed at ${gatePath},`);
  console.error("so a spec claiming `ready-to-develop` or `live` cannot be checked against it. Ship");
  console.error("`scripts/spec/` with the guards (it is a required manifest entry) to turn the check on.");
}
if (
  numbered.length === 0 &&
  roleless.length === 0 &&
  offRoster.length === 0 &&
  unearned.length === 0 &&
  duplicated.length === 0 &&
  thin.length === 0 &&
  storyless.length === 0 &&
  storyBroken.length === 0 &&
  !rosterMissing &&
  !rosterHeadingMissing &&
  !rosterUnreadable
) {
  const note = rosterPath ? "" : " (role check skipped - no docs/roles.md)";
  console.log(`spec-structure: OK (${files.length} spec paths)${note}`);
  process.exit(0);
}

if (numbered.length) {
  console.error("\nspec-structure: ticket-numbered spec paths are forbidden - use capability names:");
  for (const v of numbered) {
    console.error(`  - ${v.file}   ('${v.segment}' -> a capability name, e.g. specs/<capability>/spec.md)`);
  }
  console.error("\nCapability specs are organized by domain, not by ticket/feature number.");
  console.error("A leaked 'NNN-' folder usually means upstream Spec Kit's native specify created it;");
  console.error("create or edit capability specs with /spec-update instead.");
}

const rosterList = () => (rosterNames.length > 8 ? `${rosterNames.slice(0, 8).join(", ")}, ...` : rosterNames.join(", "));

if (roleless.length) {
  console.error("\nspec-structure: capability specs with no role named (standard ADR-064 - a spec serves someone):");
  for (const f of roleless) console.error(`  - ${f}`);
  console.error(`\nAdd a \`**Serves:** \`<role>\`\` field (from ${rosterPath}) - or name the role in the spec.`);
  console.error(`The roster reads: ${rosterList()}.`);
}

if (offRoster.length) {
  console.error("\nspec-structure: capability specs serving a role that is not on the roster (R10):");
  for (const { file, claim } of offRoster) console.error(`  - ${file}   serves "${claim}"`);
  console.error(`\nThe roster in ${rosterPath} is the constraint, and it reads: ${rosterList()}.`);
  console.error("A role described anywhere else - in the spec, in the worked example, in somebody's");
  console.error("head - does not exist as far as R10 is concerned. Either serve one who is on the roster,");
  console.error("or add this one to the roster table first, which is the decision the gate is asking for.");
}

if (thin.length) {
  console.error("\nspec-structure: buildable-tier specs missing the sections that make them buildable (R9):");
  for (const { file, missing } of thin) {
    console.error(`  - ${file}   missing: ${missing.map((s) => `## ${s}`).join(", ")}`);
  }
  console.error("\nA buildable spec carries its contracts: the data it owns, the interface it exposes, and");
  console.error("acceptance criteria concrete enough to become tests. A section that genuinely does not");
  console.error('apply keeps its heading and says so in one line ("None - this capability persists nothing"),');
  console.error("the same way `## Open questions` says \"None known.\" - a dropped heading and an empty one");
  console.error("read identically to everyone downstream. If the capability really cannot be specified to");
  console.error("that depth, declare `**Spec tier:** behavioral` and justify it in the spec (R9).");
}

if (storyless.length) {
  console.error("\nspec-structure: capability specs changed without job stories (standard ADR-064):");
  for (const f of storyless) console.error(`  - ${f}`);
  console.error("\nA spec says what its role needs from it as 1-3 job stories under `## Job stories`:");
  console.error("  - **JS-1.** When <situation>, I want <motivation>, so I can <outcome>.");
  console.error("    - GIVEN <state> WHEN <event> THEN <outcome>. (AC: <criterion name>)");
  console.error("The template carries the section. A spec this change touches is brought up to it now.");
}

if (storyBroken.length) {
  console.error("\nspec-structure: job stories that are not in shape (standard ADR-064):");
  for (const { file, problems } of storyBroken) {
    console.error(`  - ${file}`);
    for (const p of problems) console.error(`      ${p}`);
  }
  console.error("\nEach job story is `**JS-n.**` followed by at least one GIVEN/WHEN/THEN scenario that names");
  console.error("the acceptance criterion proving it, `(AC: <name>)`, by the bold name it has under");
  console.error("`## Acceptance criteria`. The labels and keywords are syntax; the prose is the spec's own.");
}

if (unearned.length) {
  console.error("\nspec-structure: specs claiming a status the clarify gate does not grant:");
  for (const { file, status, why } of unearned) {
    console.error(`  - ${file}   says \`${status}\``);
    console.error(why.split("\n").map((l) => `        ${l}`).join("\n"));
  }
  console.error("\n`ready-to-develop` and `live` assert that the gate passed. They are earned mechanically,");
  console.error("not typed in: fix what the gate names, or set the status back to `in-refinement` - which is");
  console.error("a healthy state and can last weeks. A status nothing checks is a status nobody can trust.");
}

if (duplicated.length) {
  console.error("\nspec-structure: a section heading appears more than once in one spec:");
  for (const { file, heading, lines } of duplicated) {
    console.error(`  - ${file}   '## ${heading}' at lines ${lines.join(", ")}`);
  }
  console.error("\nEverything a reader and the clarify gate look for is taken from the FIRST match, so the");
  console.error("second section is invisible to both while every guard stays green. Merge them: a later");
  console.error("clarify session is a new `### Session YYYY-MM-DD` under the existing `## Clarifications`,");
  console.error("not a second copy of the heading.");
}

if (rosterHeadingMissing) {
  console.error(`\nspec-structure: ${rosterPath} has no '## The roster' section, so the guard cannot tell`);
  console.error("a live role from a name in the worked example, and the role gate (standard ADR-064) has");
  console.error("nothing to check against. Add the heading above the roster table. It is syntax - it stays");
  console.error("'## The roster' even when the roles themselves are written in another language, because");
  console.error("a translated heading does not make the check speak that language, it makes it read the");
  console.error("whole file and pass a spec that serves an example.");
}

if (rosterUnreadable) {
  console.error(`\nspec-structure: no role could be read from the roster in ${rosterPath}`);
  console.error(`(${rosterUnreadable.lines} table line(s) seen under '## The roster'). A roster row is`);
  console.error("`| `Role` | ... |` - the name in backticks, and a `<placeholder>` name is not filled in.");
  console.error("This is a failure rather than a skip on purpose: the role gate is a membership test,");
  console.error("so a roster that parses to nothing passes every spec by having nothing left to contradict.");
  console.error("An unreadable roster and an obeyed one looked identical here for a release.");
}

if (rosterMissing) {
  console.error("\nspec-structure: capability specs exist but there is no docs/roles.md roster -");
  console.error("the role gate (standard ADR-064) has nothing to check against. Write the roster first;");
  console.error("a spec that serves nobody is incomplete, and without the roster none can prove otherwise.");
}
console.error("");
process.exit(block ? 1 : 0);
