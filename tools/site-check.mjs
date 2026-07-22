#!/usr/bin/env node
// site-check - the e2e-of-our-own-surfaces gate (landing + docs site), dependency-free.
//
// This repo's CI templates never run here, but its own tools do. This
// check asserts the two human surfaces are shippable:
//   landing  - tags balanced, the positioning one-liner quoted VERBATIM (PDLC-1's
//              "surfaces quote it, never re-phrase" rule, enforced mechanically),
//              no em/en dashes, no unexpected external hosts.
//   docsite  - every generated page exists, every internal .html link resolves,
//              no raw markdown artifacts leaked ("|---", "```"), dark-first palette
//              present (the landing's ink), no em/en dashes.
//
// Usage: node tools/site-check.mjs        # exit 1 on any failure
// Zone 1 tooling - never shipped.

import { readFileSync, readdirSync, existsSync } from "node:fs";

let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };
const ok = (msg) => console.log(`  ok    ${msg}`);

// --- shared helpers ---------------------------------------------------------------

const DASHES = /[–—]/; // en dash, em dash - banned everywhere we author

function checkDashes(path, text) {
  const i = text.search(DASHES);
  if (i >= 0) fail(`${path}: em/en dash at offset ${i} ("${text.slice(i - 20, i + 20)}")`);
}

// A tolerant tag-balance check: push openers, pop on matching closers. Void elements
// and comments/scripts/styles are skipped structurally (we only assert nesting sanity).
const VOID = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
function checkTagBalance(path, html) {
  const stack = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)[^>]*?(\/?)>/g;
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "<script></script>")
    .replace(/<style[\s\S]*?<\/style>/gi, "<style></style>");
  let m;
  while ((m = re.exec(stripped))) {
    const [whole, name, selfClose] = [m[0], m[1].toLowerCase(), m[2]];
    if (VOID.has(name) || selfClose === "/") continue;
    if (whole.startsWith("</")) {
      if (stack.length === 0 || stack[stack.length - 1] !== name) {
        fail(`${path}: closing </${name}> does not match open <${stack[stack.length - 1] ?? "nothing"}>`);
        return;
      }
      stack.pop();
    } else stack.push(name);
  }
  if (stack.length) fail(`${path}: ${stack.length} unclosed tag(s), first: <${stack[0]}>`);
  else ok(`${path}: tags balanced`);
}

// --- landing ----------------------------------------------------------------------

const LANDING = "site/index.html";
const POSITIONING = "docs/positioning.md";

const landing = readFileSync(LANDING, "utf8");
checkTagBalance(LANDING, landing);
checkDashes(LANDING, landing);

// The one-liner from positioning.md must appear verbatim on the landing (PDLC-1).
const pos = readFileSync(POSITIONING, "utf8");
const oneLinerMatch = pos.match(/^> (Others give you .*)$\n^> (.*)$/m) || pos.match(/^> (Others give you .*)$/m);
if (!oneLinerMatch) fail(`${POSITIONING}: cannot locate the one-liner blockquote`);
else {
  const oneLiner = pos
    .split("## The one-liner")[1]
    .split("##")[0]
    .split("\n")
    .filter((l) => l.startsWith("> "))
    .map((l) => l.slice(2).trim())
    .join(" ")
    .trim();
  if (landing.includes(oneLiner)) ok(`${LANDING}: quotes the positioning one-liner verbatim`);
  else fail(`${LANDING}: positioning one-liner not found verbatim ("${oneLiner.slice(0, 50)}...")`);
}

// External hosts allowlist: only GitHub links may leave the page.
const hosts = new Set(
  [...landing.matchAll(/https?:\/\/([^/"'\s)]+)/g)].map((m) => m[1].toLowerCase()),
);
for (const h of hosts) {
  if (h !== "github.com" && !h.endsWith(".github.com")) fail(`${LANDING}: unexpected external host ${h}`);
}
if (![...hosts].some((h) => h !== "github.com" && !h.endsWith(".github.com"))) ok(`${LANDING}: external hosts limited to GitHub`);

// --- docsite ----------------------------------------------------------------------

const SITE = "site/docs";
const pages = readdirSync(SITE).filter((f) => f.endsWith(".html"));
if (pages.length < 10) fail(`${SITE}: expected the full page set, found ${pages.length} html files`);
else ok(`${SITE}: ${pages.length} pages present`);

for (const page of pages) {
  const path = `${SITE}/${page}`;
  const html = readFileSync(path, "utf8");
  checkDashes(path, html);
  if (html.includes("|---")) fail(`${path}: raw markdown table separator leaked`);
  if (html.includes("```")) fail(`${path}: raw code fence leaked`);
  // every internal .html link must resolve to a generated page
  for (const m of html.matchAll(/href="([^"#]+\.html)(#[^"]*)?"/g)) {
    const target = m[1];
    if (/^https?:\/\//.test(target)) continue;
    if (!existsSync(`${SITE}/${target}`)) fail(`${path}: broken internal link -> ${target}`);
  }
}
const anyPage = readFileSync(`${SITE}/index.html`, "utf8");
if (anyPage.includes("#0D0E11")) ok(`${SITE}: dark-first palette (landing ink) present`);
else fail(`${SITE}: dark-first palette missing (expected the landing's #0D0E11)`);

// --- verdict ----------------------------------------------------------------------

if (failures) {
  console.log(`\nsite-check: FAIL - ${failures} problem(s)`);
  process.exit(1);
}
console.log("\nsite-check: OK - landing + docsite shippable");
