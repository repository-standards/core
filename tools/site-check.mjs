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

// A root-absolute URL is not a filesystem path. The site knows two things about where it is
// served - site_root for its landing, base_path for its docs - and both have to be undone
// before an href can be looked up on disk. Without this, a stack served under a prefix has
// every one of its own links reported as broken, which is the check being wrong rather than
// the site.
const CFG = (() => {
  const f = ["site/site.config.json", "site.config.json"].find((x) => existsSync(x));
  return f ? JSON.parse(readFileSync(f, "utf8")) : {};
})();
const OUT = CFG.out_dir || "site/docs";
const ROOT = (CFG.site_root || "/").replace(/\/+$/, "/");
const PREFIX = (CFG.base_path || "/" + OUT.split("/").slice(1).join("/") + "/").replace(/\/+$/, "/");
const SITE_TOP = OUT.includes("/") ? OUT.slice(0, OUT.indexOf("/")) : ".";
function urlToFile(u) {
  const path = u.replace(/^https?:\/\/[^/]+/, "");
  if (path.startsWith(PREFIX)) return `${OUT}/${path.slice(PREFIX.length)}`;
  if (ROOT !== "/" && path.startsWith(ROOT)) return `${SITE_TOP}/${path.slice(ROOT.length)}`;
  return `${SITE_TOP}${path}`;
}

const landing = readFileSync(LANDING, "utf8");
checkTagBalance(LANDING, landing);
checkDashes(LANDING, landing);

// The one-liner from positioning.md must appear verbatim on the landing (PDLC-1).
// The sentence itself is never written here: the heading locates it, the file owns it.
// A check that hardcodes the copy is a second home for the same fact (R4).
//
// Positioning is this repository's own artifact, not something every site in the ecosystem
// carries - a stack running this same check against its own surfaces has no positioning file
// and should not be told its landing is broken. Everything below this point is generic and
// still runs for them.
if (!existsSync(POSITIONING)) {
  ok(`${POSITIONING} absent - the positioning criterion is this repo's own, and is skipped`);
} else {
const pos = readFileSync(POSITIONING, "utf8");
const oneLinerBlock = pos.split("## The one-liner")[1];
if (!oneLinerBlock) fail(`${POSITIONING}: no "## The one-liner" section to read`);
else {
  const oneLiner = oneLinerBlock
    .split("\n## ")[0]
    .split("\n")
    .filter((l) => l.startsWith("> "))
    .map((l) => l.slice(2).trim())
    .join(" ")
    .trim();
  if (!oneLiner) fail(`${POSITIONING}: "## The one-liner" carries no blockquote`);
  else if (landing.includes(oneLiner)) ok(`${LANDING}: quotes the positioning one-liner verbatim`);
  else fail(`${LANDING}: positioning one-liner not found verbatim ("${oneLiner.slice(0, 50)}...")`);
}
}

// The landing must advertise the released version - VERSION is the source. Same reasoning
// as above: a repository without one is not lying about its version, it just has none.
if (!existsSync("VERSION")) {
  ok("VERSION absent - the advertised-version criterion is skipped");
} else {
const version = readFileSync("VERSION", "utf8").trim();
const vRe = new RegExp(`v${version.replace(/\./g, "\\.")}(?![0-9.])`);
if (vRe.test(landing)) ok(`${LANDING}: advertises v${version} (matches VERSION)`);
else fail(`${LANDING}: does not advertise v${version} - VERSION moved and the landing did not`);
}

// External hosts allowlist: only GitHub links may leave the page. Inlined `data:` URIs are
// stripped first - an SVG's xmlns is a namespace identifier, not a request that leaves.
const landingNet = landing
  .replace(/url\((["'])data:[\s\S]*?\1\)/g, "url()")
  .replace(/\bdata:[^"'\s)]*/g, "");
const hosts = new Set(
  [...landingNet.matchAll(/https?:\/\/([^/"'\s)]+)/g)].map((m) => m[1].toLowerCase()),
);
// The site's own host is not an external one. Preview tags have to name it absolutely -
// a scraper has no page to resolve a relative URL against - so it is read off the config
// rather than written here, and a domain change cannot leave this asserting the old name.
const OWN_HOST = (() => {
  const cfg = ["site/site.config.json", "site.config.json"].find((f) => existsSync(f));
  const url = cfg ? JSON.parse(readFileSync(cfg, "utf8")).site_url : "";
  return url ? new URL(url).host.toLowerCase() : "";
})();
for (const h of hosts) {
  if (OWN_HOST && (h === OWN_HOST || h.endsWith(`.${OWN_HOST}`))) continue;
  if (h !== "github.com" && !h.endsWith(".github.com")) fail(`${LANDING}: unexpected external host ${h}`);
}
if (![...hosts].some((h) => h !== "github.com" && !h.endsWith(".github.com"))) ok(`${LANDING}: external hosts limited to GitHub`);

// --- docsite ----------------------------------------------------------------------

const SITE = "site/docs";
const pages = readdirSync(SITE).filter((f) => f.endsWith(".html"));
// The page list comes from the generator itself - imported, not re-derived. Parsing its
// source for a marker made this check a second, drifting copy of the page map; the
// generator exports PAGES and runs only when executed directly.
const { PAGES } = await import("./docsite.mjs");
const declared = new Set(PAGES.map((p) => p.out));
const beforePages = failures;
for (const p of PAGES) {
  if (!existsSync(`${SITE}/${p.out}`)) fail(`${SITE}: the page map declares ${p.out}, which was not generated`);
}
for (const f of pages) {
  if (!declared.has(f)) fail(`${SITE}: ${f} is not in the page map - a stale page survived a regeneration`);
}
// Counted, not compared: a missing page and a stale one cancel out in a length check.
if (failures === beforePages) ok(`${SITE}: ${pages.length} pages present, exactly what the page map declares`);

// The landing's own links into the docs. Nothing checked these until a docs page was
// renamed and the landing's primary call to action started 404-ing; the docs' internal
// links were checked all along, which made the gap invisible - the one page a first-time
// reader is guaranteed to see was the one page nobody verified.
const beforeLanding = failures;
for (const m of landing.matchAll(/href="((?!https?:)[^"#]*\.html)(#[^"]*)?"/g)) {
  if (!existsSync(`site/${m[1]}`)) fail(`${LANDING}: broken link into the site -> ${m[1]}`);
}
if (failures === beforeLanding) ok(`${LANDING}: every link into the site resolves`);

// A table separator or a fence inside <pre>/<code> is a markdown EXAMPLE, deliberately
// shown - the docs teach people what to write, so they quote markdown constantly. The
// leak this check exists for is a table or a fence that failed to render in prose, so
// look for it in prose only. Scanning the raw page made every page carrying an example
// fail, which is the fastest way to get a check switched off.
const stripCode = (html) =>
  html.replace(/<pre[\s\S]*?<\/pre>/gi, "").replace(/<code[\s\S]*?<\/code>/gi, "");

for (const page of pages) {
  const path = `${SITE}/${page}`;
  const html = readFileSync(path, "utf8");
  const prose = stripCode(html);
  checkDashes(path, html);
  if (prose.includes("|---")) fail(`${path}: raw markdown table separator leaked`);
  if (prose.includes("```")) fail(`${path}: raw code fence leaked`);
  // Every internal link must resolve to something on disk. They are root-absolute now, so
  // they resolve against the site root rather than against the page's own folder - which is
  // the whole point: a relative href is at the mercy of whatever the browser thinks the base
  // is, and one visit to /docs without the trailing slash turned every link on the page,
  // sidebar included, into a 404.
  for (const m of html.matchAll(/(?:href|src)="([^"#]+)(#[^"]*)?"/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|data:)/.test(target)) continue;
    if (!target.startsWith("/")) fail(`${path}: relative link -> ${target} (internal links must be root-absolute)`);
    else if (!existsSync(urlToFile(target))) fail(`${path}: broken internal link -> ${target} (looked for ${urlToFile(target)})`);
  }
}
// The docs must be dark in the landing's own ink. The value is read off the landing rather
// than written here, so restyling the landing cannot leave this check asserting a dead colour.
const anyPage = readFileSync(`${SITE}/index.html`, "utf8");
const landingInk = (landing.match(/--(?:bg|ink):\s*(#[0-9a-fA-F]{3,8})/) || [])[1];
if (!landingInk) fail(`${LANDING}: no --bg or --ink custom property to read the ink from`);
else if (anyPage.includes(landingInk)) ok(`${SITE}: dark-first palette shares the landing ink (${landingInk})`);
else fail(`${SITE}: dark-first palette missing (expected the landing's ${landingInk})`);

// Link previews: a scraper gets one shot at the page and no way to resolve a relative URL,
// so a card that is wrong is a card that silently does not appear. Every surface must carry
// the tags, the image must be absolute, and the file it names must exist on disk - the last
// one is the failure nobody notices, because the tag looks perfectly fine in the source.
{
  const surfaces = [[LANDING, landing], ...readdirSync(SITE).filter((f) => f.endsWith(".html")).slice(0, 1).map((f) => [`${SITE}/${f}`, readFileSync(`${SITE}/${f}`, "utf8")])];
  for (const [path, html] of surfaces) {
    for (const tag of ["og:title", "og:description", "og:url", "og:image", "twitter:card"]) {
      if (!html.includes(`"${tag}"`)) fail(`${path}: no ${tag} - a shared link renders as a bare URL`);
    }
    const img = (html.match(/property="og:image"\s+content="([^"]+)"/) || [])[1];
    if (!img) continue;
    if (!/^https?:\/\//.test(img)) fail(`${path}: og:image is not absolute (${img}) - scrapers drop it`);
    else {
      const local = urlToFile(img);
      if (!existsSync(local)) fail(`${path}: og:image points at ${img}, and ${local} does not exist`);
    }
  }
  if (!failures) ok("both surfaces carry link-preview tags, and the card exists");
}

// --- verdict ----------------------------------------------------------------------

if (failures) {
  console.log(`\nsite-check: FAIL - ${failures} problem(s)`);
  process.exit(1);
}
console.log("\nsite-check: OK - landing + docsite shippable");
