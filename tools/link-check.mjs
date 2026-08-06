#!/usr/bin/env node
// link-check - every relative markdown link in the repo must resolve (the STRUCT-1
// restructure broke ~30 silently; this makes the next restructure unable to), and every
// by-reference link into this repo's own main branch must resolve too.
//
// The second half is the shipped tree's half. Method docs are adopted BY REFERENCE
// (ADR-023): the tree points at them by full URL, because the file is not in the adopting
// repo. A URL naming a path that does not exist here is therefore a dead promise made to
// every adopted repo, and it is invisible to the relative-link check by construction. Four
// instances were found and swept by hand - the verifier's own decisions line, the jq-missing
// denial in a hook, an example claim in facts.example.json, and a rule citing a path as
// though it were a file in the reader's repo. This is that sweep, mechanical, over every
// text file git knows about rather than only markdown, because two of the four were in a
// shell script and a JSON file.
//
// Skips: absolute URLs (except the by-reference form), mailto:, pure anchors, any line
// carrying a {{placeholder}}, and any URL path holding a <placeholder> (prose describing the
// form is not a link).
//
// Usage: node tools/link-check.mjs   # exit 1 on any dead link
// Zone 1 tooling - never shipped.

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, normalize, join } from "node:path";

const list = (cmd) => execSync(cmd, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const tracked = list("git ls-files '*.md'");
// untracked files count too - a fresh doc must fail here, before git add, not only
// in CI (where everything is tracked); skipping them silently hid dead links locally
const untracked = list("git ls-files --others --exclude-standard '*.md'");
const files = [...tracked, ...untracked];
const dead = [];

for (const f of files) {
  if (!existsSync(f)) continue; // deleted in index, listed by ls-files mid-change
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((rawLine, n) => {
    if (rawLine.includes("{{")) return; // template placeholder line
    const line = rawLine.replace(/`[^`]*`/g, "`code`"); // inline code is prose about links, not links
    for (const m of line.matchAll(/\]\(([^)#\s]+?)(?:#[^)]*)?\)/g)) {
      const t = m[1];
      if (/^(https?:|mailto:|#)/.test(t)) continue;
      const resolved = normalize(join(dirname(f), t));
      if (!existsSync(resolved)) dead.push(`${f}:${n + 1} -> ${t}`);
    }
  });
}

// --- by-reference links into this repo's own main branch ---------------------------------
// Every text file git knows about - tracked and untracked - not only markdown: the instances
// of this bug lived in a shell script and a JSON example as often as in prose.
const BY_REFERENCE = /https:\/\/github\.com\/repository-standards\/core\/(?:blob|tree)\/main\/([^)\s"'`<>\]]+)/g;
const isBinaryByExt = (f) => /\.(png|jpg|jpeg|gif|webp|ico|pdf|woff2?|ttf|zip|gz)$/i.test(f);
const textFiles = [...list("git ls-files"), ...list("git ls-files --others --exclude-standard")].filter((f) => !isBinaryByExt(f));
const unresolved = [];
let byRefCount = 0;

for (const f of textFiles) {
  if (!existsSync(f)) continue;
  readFileSync(f, "utf8").split("\n").forEach((line, n) => {
    for (const m of line.matchAll(BY_REFERENCE)) {
      // Strip the anchor, then a trailing backslash, then sentence punctuation the URL
      // picked up from the prose around it: "see .../prerequisites.md." names a file, not a
      // directory called `md.`. The backslash is JSON's escape for the quote that closes the
      // string - a run file quoting a line of source code carries the URL as
      // `\"https://...self-verify.md\"`, and the escape is not part of the path.
      const target = m[1].replace(/#.*$/, "").replace(/\\+$/, "").replace(/[.,;:!?]+$/, "");
      if (!target || target.includes("<")) continue; // the form written out, not a link
      byRefCount++;
      if (!existsSync(target)) unresolved.push(`${f}:${n + 1} -> ${target}`);
    }
  });
}

if (dead.length || unresolved.length) {
  for (const d of dead) console.log(`  FAIL  ${d}`);
  for (const u of unresolved) console.log(`  FAIL  ${u}   (adopted by reference - the URL must resolve in THIS repo, or every adopted repo is pointed at nothing)`);
  const parts = [];
  if (dead.length) parts.push(`${dead.length} dead relative link(s)`);
  if (unresolved.length) parts.push(`${unresolved.length} by-reference link(s) naming a path that is not here`);
  console.log(`\nlink-check: FAIL - ${parts.join(", ")}`);
  process.exit(1);
}
const scope = untracked.length ? `${files.length} md files, ${untracked.length} untracked` : `${files.length} md files`;
console.log(`link-check: OK - all relative links resolve (${scope}), and all ${byRefCount} by-reference links resolve in this repo`);
