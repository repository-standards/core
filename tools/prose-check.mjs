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
  const total = CASES.length + DASH_CASES.length;
  console.log(
    bad
      ? `\nprose-check --self: FAIL - ${bad} case(s)`
      : `\nprose-check --self: OK - ${total} cases; the orphan bullet is caught and a real list is not, the long dash is caught and the rule that names it is not`,
  );
  process.exit(bad ? 1 : 0);
}

function main() {
  const files = execSync("git ls-files '*.md'", { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);

  let bullets = 0;
  let dashes = 0;
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

  if (bullets) {
    console.log(`\n  ${bullets} line(s) render as a stray bullet.`);
    console.log("  Join the line to the sentence above it, or start a real list with a blank line.");
  }
  if (dashes) {
    console.log(`\n  ${dashes} line(s) use a long dash.`);
    console.log("  ASCII hyphen only - standard/docs/conventions.md, Writing. A vendored file is not");
    console.log("  exempt: it ships into every adopting repo. Patch it and mark the hunk.");
  }
  if (bullets || dashes) {
    console.log(`\nprose-check: FAIL - ${bullets + dashes} finding(s)`);
    process.exit(1);
  }
  console.log(`prose-check: OK - ${files.length} md files, no line renders as something it is not and none uses a long dash`);
}

if (process.argv.includes("--self")) self();
else main();
