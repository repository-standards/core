#!/usr/bin/env node
// link-check - every relative markdown link in the repo must resolve (the STRUCT-1
// restructure broke ~30 silently; this makes the next restructure unable to).
//
// Skips: absolute URLs, mailto:, pure anchors, and any line carrying a {{placeholder}}
// (template lines describe the client repo, not this one).
//
// Usage: node tools/link-check.mjs   # exit 1 on any dead link
// Zone 1 tooling - never shipped.

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, normalize, join } from "node:path";

const files = execSync("git ls-files '*.md'", { encoding: "utf8" }).trim().split("\n");
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

if (dead.length) {
  for (const d of dead) console.log(`  FAIL  ${d}`);
  console.log(`\nlink-check: FAIL - ${dead.length} dead relative link(s)`);
  process.exit(1);
}
console.log(`link-check: OK - all relative links resolve (${files.length} md files)`);
