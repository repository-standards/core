#!/usr/bin/env node
// prose-check - markdown that renders as something other than what it says, or breaks a
// writing rule this project publishes.
//
// **Orphan bullets.** A hyphen that wraps to the start of a line becomes a list item. The
// author sees a dash continuing a sentence; the reader gets an orphan bullet. It had already
// shipped on the Verifying compliance page and in the file map's own introduction, and it
// caught the first tree page being written.
//
// It only fires where markdown is unambiguous about it: a bullet whose PREVIOUS line is
// ordinary prose. A real list is preceded by a blank line, a lead-in ending in a colon, a
// heading, another item, or an indented continuation - all of which pass.
//
// **Em and en dashes.** `standard/docs/conventions.md` says "ASCII hyphen `-` only,
// everywhere (prose, docs, UI copy, commits, PRs)". Nothing checked the markdown. The rule was
// enforced on the generated site HTML by `tools/site-check.mjs` and nowhere upstream of it, so
// six of them sat in two shipped skills - inherited by every repository that adopts, from a
// tree whose own documentation forbids them.
//
// A dash inside a code span or a fenced block passes, which is not a loophole but the only way
// the rule can state itself: the conventions page names the characters as `-` and `-`, and a
// check that could not read its own rule would be unusable. Same shape as the landing gate's
// carve-out for SVG path data.
//
// **Unqualified record numbers in the shipped tree.** A record id is scoped to the index it
// sits next to. `ADR-010` written in `standard/` is a statement about this repo's log, but it
// lands in the adopter's repo, where it resolves against their `docs/decision-records/` - and
// the first repo to adopt already had an ADR-010 of its own, about something else. 188 of them
// shipped that way, across 50 files - and the ones that travel furthest are not documents:
// `standards-update-watch.yml` writes a citation into the body of an issue it opens in the
// adopter's tracker, and the guards print others in their failure messages. So the scan is the
// whole shipped tree, not its markdown. `standard/docs/conventions.md`, Writing, names the qualified spellings
// (`standard ADR-010`, `the standard's ADR-010`, or a link under `repository-standards/core`)
// and this checks the shipped tree against it.
//
// Zone 1 files are exempt by construction: outside `standard/`, a bare number IS this repo's
// record and qualifying it would be wrong. Code spans and fences pass for the same reason the
// dash rule exempts them - the shipped record READMEs teach the index row shape by showing
// `[ADR-001](ADR-001-postgres-over-dynamo.md)`, which is notation, not a citation.
//
// Usage: node tools/prose-check.mjs        # exit 1 on any finding
//        node tools/prose-check.mjs --self # run the built-in cases instead
// Zone 1 tooling - never shipped.

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const BULLET = /^[-*+] \S/;
const LIST_ITEM = /^\s*(?:[-*+] |\d+[.)] )/;
const HEADING = /^#{1,6} /;
const FENCE = /^\s*(?:```|~~~)/;
const TABLE_ROW = /^\s*\|/;

// Returns [{ line, text, prev }] for each accidental bullet in `src`.
export function findOrphanBullets(src) {
  const lines = src.split("\n");
  const hits = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !BULLET.test(line)) continue;

    const prev = i > 0 ? lines[i - 1] : "";
    // A list legitimately starts after any of these.
    if (
      prev.trim() === "" ||
      LIST_ITEM.test(prev) ||
      HEADING.test(prev) ||
      TABLE_ROW.test(prev) ||
      /^\s+\S/.test(prev) ||
      /[:>|]\s*$/.test(prev.trim())
    ) {
      continue;
    }
    hits.push({ line: i + 1, text: line.trim(), prev: prev.trim() });
  }
  return hits;
}

const DASH = /[–—]/;

// Returns [{ line, text }] for each em or en dash in `src` that is authored prose - outside a
// fenced block, and outside a code span, where naming the character is the only way to forbid it.
export function findLongDashes(src) {
  const lines = src.split("\n");
  const hits = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !DASH.test(line)) continue;
    // Blank out code spans, then look at what is left. Backticks pair left to right; an
    // unpaired trailing one is ordinary text and stays.
    const bare = line.replace(/`[^`]*`/g, "");
    if (DASH.test(bare)) hits.push({ line: i + 1, text: line.trim() });
  }
  return hits;
}

// A citation of the standard's own record, inside a file that ships. Anything the adopter's
// index could answer instead - a bare id - is a finding.
const RECORD_ID = /\b(?:ADR|BDR)-\d{3}\b/g;
const CORE_LINK = /\[[^\]]*\]\(https:\/\/github\.com\/repository-standards\/core[^)]*\)/g;
// The marker names the source, so the id it introduces is already qualified. Only that id:
// the match stops at the first one, so a second citation later on the line is still read.
const PATCHED_MARKER = /PATCHED\(repository-standards\):\s*(?:ADR|BDR)-\d{3}/g;
// The qualifier need not be adjacent - "the standard's own ADR-010" qualifies as plainly as
// "standard ADR-010" does. Both apostrophes, because nothing here forbids the typographic one.
const QUALIFIED = /\bstandard(?:['’]s)?\b[^.;:!?]{0,24}$/;

// Same-length blanking, so match offsets still index into the original line.
const blank = (m) => " ".repeat(m.length);

export function findBareRecordIds(src) {
  const lines = src.split("\n");
  const hits = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Blanked, not skipped: a marker's own id is qualified by the marker, but the rest of
    // the line is ordinary prose and a bare id there is still a finding.
    const bare = line.replace(CORE_LINK, blank).replace(PATCHED_MARKER, blank).replace(/`[^`]*`/g, blank);

    // A qualifier reaches forward to the next id and no further: in "standard ADR-010 and
    // ADR-024" the second id is bare. So each id is judged against the text since the one
    // before it - blanked ids included, which is why the scan walks the original line.
    let since = 0;
    for (const m of line.matchAll(RECORD_ID)) {
      const end = m.index + m[0].length;
      const before = line.slice(since, m.index);
      const after = line.slice(end);
      const excluded = bare.slice(m.index, end) !== m[0];
      since = end;
      if (excluded) continue;
      if (QUALIFIED.test(before)) continue;
      if (/[/-]$/.test(before)) continue; // inside a path or a longer id
      if (/^[-.]/.test(after)) continue; // a filename: ADR-004-title.md
      hits.push({ line: i + 1, id: m[0], text: line.trim() });
    }
  }
  return hits;
}

const CASES = [
  ["dash wrapped onto a new line", "the sprint closes whether or not it finished\n- that is the point", 1],
  ["parenthetical dash after a code span", "it reads `standard.manifest.json`\n- the standard describing itself", 1],
  ["real list after a blank line", "Two readers need two things:\n\n- an engineer wants the record\n- a stakeholder wants the story", 0],
  ["real list straight after a colon", "Two readers need two things:\n- an engineer wants the record", 0],
  ["real list after a heading", "## Rules\n- one file per idea", 0],
  ["continuation of a wrapped item", "- an item that wraps\n  onto the next line\n- the next item", 0],
  ["inside a fenced block", "```\n## Contradictions\n- kickoff assumes same-day refunds\n```", 0],
  ["after a table row", "| a | b |\n|---|---|\n- not a table row", 0],
];

const DASH_CASES = [
  ["em dash in prose", "the record comes first — it is superseded, never edited", 1],
  ["en dash in prose", "runs 2–5 people", 1],
  ["the conventions page naming the characters it forbids", "ASCII hyphen `-` only. Never the em dash `—` or en dash `–`.", 0],
  ["a dash inside a fenced block", "```\ndiff --stat a — b\n```", 0],
  ["a dash in a code span mid-sentence", "the flag `--foo—bar` is one token", 0],
  ["a dash outside the code span on the same line", "`SPEC_FILE` — the spec file path", 1],
  ["plain hyphens are untouched", "one thing - then another - and a third", 0],
  ["two on one line count once", "a — b — c", 1],
];

const RECORD_CASES = [
  ["a bare id in shipped prose", "the loop is AI-led (ADR-010; the clarify gate)", 1],
  ["the qualified form", "the loop is AI-led (standard ADR-010; the clarify gate)", 0],
  ["the possessive form", "see the standard's ADR-010 for why", 0],
  [
    "a link to the record in core",
    "([ADR-002](https://github.com/repository-standards/core/blob/main/docs/decision-records/ADR-002-specs-by-capability.md) -",
    0,
  ],
  ["the index row shape taught in a code span", "carry the prefix (`[ADR-001](...)`).", 0],
  ["a filename in a fenced block", "```\nADR-004-postgres-over-dynamo.md\n```", 0],
  ["a path, not a citation", "docs/decision-records/ADR-004-postgres-over-dynamo.md", 0],
  ["a vendored hunk's marker, which names the source itself", "<!-- PATCHED(repository-standards): ADR-002 capability paths -->", 0],
  ["both streams", "records (ADR-018, BDR-004) bind equally", 2],
  ["a qualified and a bare id on one line", "standard ADR-004 supersedes ADR-002", 1],
];

// Which files the record rule reads at all. The exemption is the whole point of the rule:
// outside `standard/`, a bare id is this repo's own record.
const SHIPS_CASES = [
  ["a shipped workflow, whose text reaches the adopter's tracker", "standard/.github/workflows/standards-update-watch.yml", true],
  ["a shipped guard", "standard/scripts/self-verify.mjs", true],
  ["this repo's own decision record", "docs/decision-records/ADR-021-adoption-feeds-the-standard.md", false],
  ["this repo's own backlog", "backlog.md", false],
  ["a zone 1 tool - this file", "tools/prose-check.mjs", false],
];

function self() {
  let bad = 0;
  for (const [name, src, expected] of CASES) {
    const got = findOrphanBullets(src).length;
    const ok = got === expected;
    if (!ok) bad++;
    console.log(`  ${ok ? "ok  " : "FAIL"}  ${name} (found ${got}, expected ${expected})`);
  }
  for (const [name, src, expected] of DASH_CASES) {
    const got = findLongDashes(src).length;
    const ok = got === expected;
    if (!ok) bad++;
    console.log(`  ${ok ? "ok  " : "FAIL"}  ${name} (found ${got}, expected ${expected})`);
  }
  for (const [name, src, expected] of RECORD_CASES) {
    const got = findBareRecordIds(src).length;
    const ok = got === expected;
    if (!ok) bad++;
    console.log(`  ${ok ? "ok  " : "FAIL"}  ${name} (found ${got}, expected ${expected})`);
  }
  for (const [name, path, expected] of SHIPS_CASES) {
    const got = shipsProse(path);
    const ok = got === expected;
    if (!ok) bad++;
    console.log(`  ${ok ? "ok  " : "FAIL"}  ${name} (${got ? "read" : "exempt"}, expected ${expected ? "read" : "exempt"})`);
  }
  const total = CASES.length + DASH_CASES.length + RECORD_CASES.length + SHIPS_CASES.length;
  console.log(
    bad
      ? `\nprose-check --self: FAIL - ${bad} case(s)`
      : `\nprose-check --self: OK - ${total} cases; the orphan bullet is caught and a real list is not, the long dash is caught and the rule that names it is not, and a bare record id is caught while the shape a README teaches is not`,
  );
  process.exit(bad ? 1 : 0);
}

// Every shipped file, not only the markdown ones. The citations that reach an adopter
// furthest are not in prose documents: `standards-update-watch.yml` writes one into the body
// of an issue it opens in their tracker, and the guards print others in failure messages.
// The shipped tree is all text, so there is nothing to exclude by type.
export const shipsProse = (path) => path.startsWith("standard/");

function main() {
  const files = execSync("git ls-files '*.md'", { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);
  const shipped = execSync("git ls-files 'standard/*'", { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean)
    .filter(shipsProse);

  let bullets = 0;
  let dashes = 0;
  let records = 0;
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    for (const hit of findOrphanBullets(src)) {
      bullets++;
      console.log(`  FAIL  ${file}:${hit.line} renders as a list item, not a dash`);
      console.log(`          after: ${hit.prev.slice(-64)}`);
      console.log(`          here:  ${hit.text.slice(0, 64)}`);
    }
    for (const hit of findLongDashes(src)) {
      dashes++;
      console.log(`  FAIL  ${file}:${hit.line} uses an em or en dash`);
      console.log(`          here:  ${hit.text.slice(0, 88)}`);
    }
  }

  for (const file of shipped) {
    for (const hit of findBareRecordIds(readFileSync(file, "utf8"))) {
      records++;
      console.log(`  FAIL  ${file}:${hit.line} cites ${hit.id} unqualified in a file that ships`);
      console.log(`          here:  ${hit.text.slice(0, 88)}`);
    }
  }

  if (bullets) {
    console.log(`\n  ${bullets} line(s) render as a stray bullet.`);
    console.log("  Join the line to the sentence above it, or start a real list with a blank line.");
  }
  if (dashes) {
    console.log(`\n  ${dashes} line(s) use a long dash.`);
    console.log("  ASCII hyphen only - standard/docs/conventions.md, Writing. A vendored file is not");
    console.log("  exempt: it ships into every adopting repo. Patch it and mark the hunk.");
  }
  if (records) {
    console.log(`\n  ${records} citation(s) of a record id that the adopter's index will answer.`);
    console.log("  In standard/, a bare id is the adopting repo's own record. Write `standard ADR-010`,");
    console.log("  `the standard's ADR-010`, or link it under repository-standards/core - conventions.md, Writing.");
  }
  if (bullets || dashes || records) {
    console.log(`\nprose-check: FAIL - ${bullets + dashes + records} finding(s)`);
    process.exit(1);
  }
  console.log(
    `prose-check: OK - ${files.length} md files, no line renders as something it is not and none uses a long dash; ${shipped.length} shipped files, every record id they cite is qualified`,
  );
}

if (process.argv.includes("--self")) self();
else main();
