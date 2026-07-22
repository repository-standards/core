#!/usr/bin/env node
// changelog - assemble the changes/ fragments into the two outputs (REL-1).
//
// A PR never edits CHANGELOG.md or bumps VERSION; it drops a fragment in changes/. At
// release the maintainer runs this to assemble them. Two outputs, of different kinds:
//
//   CHANGELOG.md   - complete, MECHANICAL. Every fragment, grouped by type, verbatim.
//                    This tool assembles it in full.
//   RELEASE-NOTES  - curated, WRITTEN. Only the stakeholder/both fragments matter, and the
//                    plain-language framing is editorial. This tool emits a DRAFT scaffold
//                    from their headlines - a starting point, not the finished notes.
//
// It prints to stdout and never writes files or touches VERSION - the maintainer cuts the
// release (sets the version + date, curates the notes, clears changes/). See
// docs/changelog-process.md.
//
// Usage:
//   node tools/changelog.mjs             # assemble: print CHANGELOG block + notes draft
//   node tools/changelog.mjs --check     # validate fragments only; exit 1 if any invalid
//
// No dependencies (Node built-ins only). Source-only - a maintainer tool.

import { readdirSync, readFileSync, existsSync } from "node:fs";

const checkOnly = process.argv.includes("--check");
const DIR = "changes";
const TYPES = ["added", "changed", "fixed", "removed"];
const AUDIENCES = ["technical", "stakeholder", "both"];
const TYPE_HEADING = { added: "Added", changed: "Changed", fixed: "Fixed", removed: "Removed" };

if (!existsSync(DIR)) {
  console.error(`changelog: no ${DIR}/ directory here.`);
  process.exit(1);
}

// --- parse fragments -------------------------------------------------------------
const files = readdirSync(DIR).filter((f) => f.endsWith(".md") && f !== "README.md").sort();
const fragments = [];
const errors = [];

for (const f of files) {
  const raw = readFileSync(`${DIR}/${f}`, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) { errors.push(`${f}: missing or malformed frontmatter (--- ... ---)`); continue; }
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-zA-Z]+):\s*(.*?)\s*(?:#.*)?$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  const body = m[2].trim();

  if (!AUDIENCES.includes(meta.audience)) errors.push(`${f}: audience must be one of ${AUDIENCES.join(" | ")} (got "${meta.audience ?? ""}")`);
  if (!TYPES.includes(meta.type)) errors.push(`${f}: type must be one of ${TYPES.join(" | ")} (got "${meta.type ?? ""}")`);
  if (meta.headline && meta.audience === "technical") errors.push(`${f}: headline is only for stakeholder/both, not technical`);
  if (!body) errors.push(`${f}: body is empty (needs at least one changelog bullet)`);

  fragments.push({ file: f, audience: meta.audience, type: meta.type, headline: meta.headline || null, body });
}

// --- check mode ------------------------------------------------------------------
if (checkOnly || errors.length) {
  if (errors.length) {
    console.error(`\nchangelog --check: ${errors.length} invalid fragment(s)\n`);
    for (const e of errors) console.error(`  FAIL  ${e}`);
    console.error("");
    process.exit(1);
  }
  console.log(`\nchangelog --check: OK - ${fragments.length} fragment(s) valid\n`);
  process.exit(0);
}

if (!fragments.length) {
  console.log("\nchangelog: no pending fragments in changes/ - nothing to assemble.\n");
  process.exit(0);
}

// --- assemble CHANGELOG (mechanical, complete) -----------------------------------
const out = [];
out.push("=".repeat(72));
out.push("CHANGELOG.md  - paste under a new  ## <version> - <date>  heading");
out.push("(complete, mechanical - every fragment, grouped by type, verbatim)");
out.push("=".repeat(72));
out.push("");
out.push("## <version> - <date>");
for (const t of TYPES) {
  const items = fragments.filter((fr) => fr.type === t);
  if (!items.length) continue;
  out.push("");
  out.push(`### ${TYPE_HEADING[t]}`);
  out.push("");
  for (const fr of items) out.push(fr.body);
}

// --- assemble RELEASE-NOTES draft (curate by hand) -------------------------------
const facing = fragments.filter((fr) => fr.audience !== "technical");
out.push("");
out.push("=".repeat(72));
out.push("RELEASE-NOTES.md  - DRAFT scaffold, WRITE from this (do not ship as-is)");
out.push(`(${facing.length} stakeholder-facing of ${fragments.length} changes; curate hard,`);
out.push(" lead with the benefit, cut what a non-technical reader would not care about)");
out.push("=".repeat(72));
if (!facing.length) {
  out.push("");
  out.push("  (no stakeholder/both fragments - this release is technical-only)");
} else {
  out.push("");
  out.push("## What's new");
  for (const fr of facing) {
    out.push("");
    out.push(`- ${fr.headline || "(no headline - add one)"}   [${fr.audience}, ${fr.type}, ${fr.file}]`);
    for (const l of fr.body.split("\n")) out.push(`    ${l}`);
  }
}
out.push("");
console.log(out.join("\n"));
