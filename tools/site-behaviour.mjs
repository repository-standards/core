#!/usr/bin/env node
// site-behaviour - the checks that would have caught tonight's defects.
//
// site-check asserts the site is well-formed: pages exist, links resolve, nothing leaked.
// It passed through every one of these, because each is about how the page BEHAVES rather
// than whether it parses. Each rule below is a bug that shipped and was found by a person:
//
//   1. a collapsible shelf that never closed, swallowing two whole groups
//   2. a page built from two documents, carrying two <h1>s
//   3. a nav row whose target page did not mark it active - you click, you arrive, and
//      nothing says where you are
//   4. a hamburger with no handler behind it
//   5. a colour rule that lost the cascade to a later :visited, so a row changed once
//      you had clicked it
//   6. eight sidebar rows reading README.md, indistinguishable from each other
//   7. a page reached only from an index, with no way back to it
//
// Rule 8 is the exception - it has not shipped broken, it is a defect the layout of ADR-031
// makes available: the switcher's "here" was hardcoded to the core, which is right on the
// one site that existed and wrong on every stack site built by this same generator.
//
// A real browser would catch layout too (the sidebar sitting under the header, an
// invisible scrollbar). That needs a dependency and an install step in CI, which is an
// owner decision - this file deliberately stops at what the DOM and the stylesheet say.
//
// Usage: node tools/site-behaviour.mjs   # exit 1 on any failure
// Zone 1 tooling - never shipped. No dependencies.

import { readFileSync, readdirSync, existsSync } from "node:fs";

const SITE = "site/docs";
let failures = 0;
const fail = (m) => { failures++; console.log(`  FAIL  ${m}`); };
const ok = (m) => console.log(`  ok    ${m}`);

const pages = readdirSync(SITE).filter((f) => f.endsWith(".html"));
const home = readFileSync(`${SITE}/index.html`, "utf8");
const nav = home.split('<div class="nav-links"')[1]?.split("</aside>")[0] ?? "";

// 1. Every group heading sits at the top level - a shelf that forgot to close hides
//    everything after it, and the sidebar still looks plausible.
{
  let depth = 0;
  let nested = 0;
  for (const m of nav.matchAll(/<details[^>]*>|<\/details>|<div class="nav-group-title">/g)) {
    if (m[0].startsWith("<details")) depth++;
    else if (m[0] === "</details>") depth--;
    else if (depth !== 0) nested++;
  }
  if (nested) fail(`${nested} group heading(s) rendered inside a collapsible shelf`);
  else if (depth !== 0) fail(`the sidebar's shelves do not balance (depth ${depth} at the end)`);
  else ok("every group heading is top-level and every shelf closes");
}

// 2. One <h1> per page. Two means two documents pretending to be one page.
{
  const bad = pages.filter((p) => {
    const body = readFileSync(`${SITE}/${p}`, "utf8").split('<div class="prose">')[1] ?? "";
    return (body.match(/<h1[\s>]/g) ?? []).length !== 1;
  });
  if (bad.length) fail(`${bad.length} page(s) without exactly one h1: ${bad.slice(0, 4).join(", ")}`);
  else ok(`every page carries exactly one h1 (${pages.length} pages)`);
}

// 3. Click a nav row and the page you land on marks it active. Without this the sidebar
//    and the page can disagree about where you are, silently.
{
  const rows = [...nav.matchAll(/<a class="([^"]*nav-(?:link|tree-link)[^"]*)" href="([^"#]+)"/g)]
    .map((m) => m[2].replace(/^\/docs\//, ""))
    .filter((h) => h.endsWith(".html"));
  const bad = [];
  for (const target of new Set(rows)) {
    if (!existsSync(`${SITE}/${target}`)) { bad.push(`${target} (missing)`); continue; }
    const html = readFileSync(`${SITE}/${target}`, "utf8");
    const active = html.match(/<a class="[^"]*active[^"]*" href="\/docs\/([^"#]+)"/);
    if (!active || active[1] !== target) bad.push(`${target} (does not mark itself active)`);
  }
  if (bad.length) fail(`${bad.length} nav target(s) that do not light up on arrival: ${bad.slice(0, 4).join(", ")}`);
  else ok(`every nav row marks itself active on the page it opens (${new Set(rows).size} targets)`);
}

// 4. A control with no handler is worse than no control.
{
  const hasButton = home.includes('class="nav-toggle"');
  const hasHandler = home.includes(".nav-toggle") && home.includes("aria-expanded");
  const hasScrim = home.includes('class="nav-scrim"');
  if (!hasButton || !hasHandler || !hasScrim) {
    fail(`the mobile drawer is incomplete (button ${hasButton}, handler ${hasHandler}, scrim ${hasScrim})`);
  } else ok("the mobile drawer has its button, its scrim and its handler");
}

// 5. A role's colour must win the cascade against the later :visited and :hover rules.
//    Same specificity plus later position beats it, and the row changes once clicked.
{
  const css = home.split("<style>")[1]?.split("</style>")[0] ?? "";
  const role = css.indexOf(".nav-link.nav-role-");
  const visited = css.indexOf(".nav-link:visited");
  const hover = css.indexOf(".nav-link:hover");
  if (role < 0) fail("no compound role colour rule found");
  else if (role < visited || role < hover) fail("the role colour is declared before :visited/:hover and loses the cascade");
  else ok("the role colour outranks the visited and hover rules");
}

// 6. Two sidebar rows with the same label in the same group cannot be told apart.
{
  const labels = [...nav.matchAll(/<a class="[^"]*nav-tree-link[^"]*"[^>]*>([^<]+)</g)].map((m) => m[1].trim());
  const seen = new Map();
  for (const l of labels) seen.set(l, (seen.get(l) ?? 0) + 1);
  const dupes = [...seen].filter(([, n]) => n > 1);
  if (dupes.length) fail(`${dupes.length} repeated tree label(s): ${dupes.slice(0, 4).map(([l, n]) => `${l} x${n}`).join(", ")}`);
  else ok("no two rows in the file tree carry the same label");
}

// 7. A page with no sidebar row needs a way back to the index that owns it.
{
  const orphans = pages.filter((p) => {
    const html = readFileSync(`${SITE}/${p}`, "utf8");
    const inNav = nav.includes(`href="/docs/${p}"`);
    return !inNav && !html.includes('class="backlink"');
  });
  if (orphans.length) fail(`${orphans.length} page(s) reachable only by link, with no way back: ${orphans.slice(0, 4).join(", ")}`);
  else ok("every page outside the sidebar carries a link back to its index");
}

// 8. The ecosystem switcher must say "here" about the site it is actually on. The same
//    generator builds every site in the ecosystem (ADR-031), so a hardcoded answer is
//    correct on one of them and quietly wrong on the rest.
{
  const entries = [...home.matchAll(/<a role="menuitem" href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({
    href: m[1],
    attrs: m[2],
    here: m[3].includes('class="now">here'),
  }));
  const base = home.match(/<a class="nav-link[^"]*" href="(\/[^"]*\/)[^"/]+"/)?.[1];
  const here = entries.filter((e) => e.here);
  const tabbed = entries.filter((e) => e.attrs.includes("_blank") && e.href.startsWith("/"));
  if (!entries.length || !base) fail("could not read the ecosystem switcher or the sidebar's base path");
  else if (here.length !== 1) fail(`${here.length} switcher entries claim to be "here" - exactly one must`);
  else if (here[0].href !== `${base}index.html` && here[0].href !== base) {
    fail(`the switcher says "here" about ${here[0].href}, but this site is served from ${base}`);
  } else if (tabbed.length) fail(`${tabbed.length} same-domain switcher entry(s) open in a new tab: ${tabbed.map((e) => e.href).join(", ")}`);
  else ok(`the switcher marks this site (${base}) as here, and only it`);
}

if (failures) {
  console.log(`\nsite-behaviour: FAIL - ${failures} problem(s)`);
  process.exit(1);
}
console.log(`\nsite-behaviour: OK - ${pages.length} pages behave as the navigation claims`);
