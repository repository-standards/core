#!/usr/bin/env node
// prose-check - markdown that renders as something other than what it says.
//
// One rule so far, and it earned its place twice in a day: a hyphen that wraps to the
// start of a line becomes a list item. The author sees a dash continuing a sentence; the
// reader gets an orphan bullet. It had already shipped on the Verifying compliance page
// and in the file map's own introduction, and it caught the first tree page being written.
//
// It only fires where markdown is unambiguous about it: a bullet whose PREVIOUS line is
// ordinary prose. A real list is preceded by a blank line, a lead-in ending in a colon, a
// heading, another item, or an indented continuation - all of which pass.
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

const CASES = [
  ["dash wrapped onto a new line", "the cycle closes whether or not it finished\n- that is the point", 1],
  ["parenthetical dash after a code span", "it reads `standard.manifest.json`\n- the standard describing itself", 1],
  ["real list after a blank line", "Two readers need two things:\n\n- an engineer wants the record\n- a stakeholder wants the story", 0],
  ["real list straight after a colon", "Two readers need two things:\n- an engineer wants the record", 0],
  ["real list after a heading", "## Rules\n- one file per idea", 0],
  ["continuation of a wrapped item", "- an item that wraps\n  onto the next line\n- the next item", 0],
  ["inside a fenced block", "```\n## Contradictions\n- kickoff assumes same-day refunds\n```", 0],
  ["after a table row", "| a | b |\n|---|---|\n- not a table row", 0],
];

function self() {
  let bad = 0;
  for (const [name, src, expected] of CASES) {
    const got = findOrphanBullets(src).length;
    const ok = got === expected;
    if (!ok) bad++;
    console.log(`  ${ok ? "ok  " : "FAIL"}  ${name} (found ${got}, expected ${expected})`);
  }
  console.log(
    bad
      ? `\nprose-check --self: FAIL - ${bad} case(s)`
      : `\nprose-check --self: OK - ${CASES.length} cases, the orphan bullet is caught and a real list is not`,
  );
  process.exit(bad ? 1 : 0);
}

function main() {
  const files = execSync("git ls-files '*.md'", { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);

  let found = 0;
  for (const file of files) {
    for (const hit of findOrphanBullets(readFileSync(file, "utf8"))) {
      found++;
      console.log(`  FAIL  ${file}:${hit.line} renders as a list item, not a dash`);
      console.log(`          after: ${hit.prev.slice(-64)}`);
      console.log(`          here:  ${hit.text.slice(0, 64)}`);
    }
  }

  if (found) {
    console.log(`\nprose-check: FAIL - ${found} line(s) that render as a stray bullet`);
    console.log("  Join the line to the sentence above it, or start a real list with a blank line.");
    process.exit(1);
  }
  console.log(`prose-check: OK - ${files.length} md files, no line renders as something it is not`);
}

if (process.argv.includes("--self")) self();
else main();
