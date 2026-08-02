#!/usr/bin/env node
// docsite - render a curated set of the repo's Markdown files into a static HTML
// site at site/docs/ (DISCO-4). Dependency-free (Node built-ins only).

//
// site/docs/ is GENERATED (and gitignored). Never hand-edit the HTML there - edit the PAGE MAP or
// the renderer below and re-run:
//   node tools/docsite.mjs
//
// One source, two surfaces (docs/open-questions.md, DISCO-4): the site renders the
// SAME markdown an agent reads, verbatim - nothing here is authored twice. The page
// title on every page is the rendered file's own top-level `#` heading; this script
// contributes navigation and layout, not prose.
//
// IA: modeled on nextjs.org/docs - a left sidebar (Home / Why / Adopt / Concepts /
// Guides / Reference / FAQ / Open questions / Case studies), one page per source file.
//
// Usage:
//   node tools/docsite.mjs   # (re)generates every page in site/docs/, exit 0
//
// No dependencies. Zone 1 tooling - never shipped.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Form is the core's, content is the repo's: any repo in the ecosystem can carry
// a site.config.json (brand, repo URL, topbar, page map) and run THIS generator
// against its own markdown - one form, many sites, zero copied generators.
// The config lives with the thing it configures. The repo root is for what the product is;
// a marketing site's brand and top bar are not that, and reading as product config at the
// root is how it got mistaken for one. The old location still resolves for any repo that
// already carries it there.
const CONFIG_PATH = ["site/site.config.json", "site.config.json"].find((p) => existsSync(p));
const CONFIG = CONFIG_PATH ? JSON.parse(readFileSync(CONFIG_PATH, "utf8")) : {};
const OUT_DIR = CONFIG.out_dir || "site/docs";
const GITHUB_REPO_URL = CONFIG.repo_url || "https://github.com/bodurkalukasz/repository-standards";
const BRAND = CONFIG.brand || "repository-standards";
// The header wears the released version, read from its one home rather than restated here.
const VERSION = readFileSync("VERSION", "utf8").trim();
// The header is fixed now - brand, version, ecosystem switcher, one link home - so the
// only thing a site still configures up there is where the switcher's stack entry points.
// The old `topbar` list is read as a fallback so a config written for the previous header
// still resolves, but it no longer draws anything.
const NODE_STACK_URL =
  CONFIG.node_stack_url ||
  (CONFIG.topbar || []).find((l) => l.external)?.href ||
  "https://github.com/bodurkalukasz/repository-standards-node";

// --- the page map (nav order) -----------------------------------------------------
// group: null renders as a flat top-level link; a string renders a group heading the
// first time it is seen (consecutive pages sharing a group nest under one heading).
// Exported so site-check asserts against the real page list instead of re-deriving it
// by parsing this file - a second, drifting copy of the same map.
export const PAGES = CONFIG.pages || [
  { src: "README.md", out: "index.html", nav: "Home", group: null },
  { src: "standard/SPEC.md", out: "spec.html", nav: "The spec", group: null },
  { src: "docs/manifesto.md", out: "why.html", nav: "Why", group: null },
  { src: "docs/ecosystem.md", out: "ecosystem.html", nav: "How it fits together", group: null },
  { src: "docs/method/adoption.md", out: "adopt.html", nav: "Adopt (start here)", group: null },
  { src: "docs/method/taxonomy.md", out: "taxonomy.html", nav: "Taxonomy", group: "Concepts" },
  { src: "docs/method/ways-of-working.md", out: "ways-of-working.html", nav: "Ways of working", group: "Concepts" },
  { src: "docs/method/working-with-specs.md", out: "working-with-specs.html", nav: "Working with specs", group: "Concepts" },
  { src: "docs/method/working-with-ai/README.md", out: "working-with-ai.html", nav: "Working with AI", group: "Concepts" },
  { src: "docs/method/working-language.md", out: "working-language.html", nav: "Working language", group: "Concepts" },
  { src: "docs/method/discovery.md", out: "discovery.html", nav: "Discovery", group: "Concepts" },
  { src: "standard/specs/README.md", out: "specs.html", nav: "Specs", group: "Concepts" },
  { src: "docs/method/self-verify.md", out: "self-verify.html", nav: "Self-verify", group: "Guides" },
  { src: "docs/file-map.md", out: "file-map.html", nav: "Every file, and why", group: "Reference" },
  { src: "docs/method/checklist.md", out: "checklist.html", nav: "Decision checklist", group: "Reference" },
  { src: "standard/docs/decision-records/README.md", out: "decision-records.html", nav: "Decision records", group: "Reference" },
  { src: "docs/faq.md", out: "faq.html", nav: "FAQ", group: null },
  { src: "docs/open-questions/README.md", out: "open-questions.html", nav: "Open questions", group: null },
  { src: "docs/case-studies/README.md", out: "case-studies.html", nav: "Case studies", group: null },
];
const PAGES_BY_SRC = new Map(PAGES.map((p) => [p.src, p]));
// Sidebar footer links - a site's own chrome, not the generator's. Empty by default:
// the top bar already carries the way home and the ecosystem switcher, and a second
// copy in the sidebar is the same fact twice. A downstream site can still set its own.
const SIDEBAR_LINKS = CONFIG.sidebar_links || [];

// --- path helpers (repo-relative, forward-slash, independent of host OS) ----------

function dirnamePosix(p) {
  const idx = p.lastIndexOf("/");
  return idx === -1 ? "." : p.slice(0, idx);
}

// Resolve `relPath` (a link target written inside `baseDir`'s file) against baseDir,
// the way a browser (or GitHub) resolves a relative href - handling "." and "..".
function resolveRelativePath(baseDir, relPath) {
  const isDir = relPath.endsWith("/");
  const stack = baseDir === "." || baseDir === "" ? [] : baseDir.split("/");
  for (const part of relPath.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/") + (isDir ? "/" : "");
}

// Rewrite an internal link: page-map hit -> its .html page; otherwise -> GitHub at
// the resolved repo path. Absolute / mailto / anchor-only hrefs pass through as-is.
function resolveHref(href, ctx) {
  if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("#")) {
    return href;
  }
  const hashIdx = href.indexOf("#");
  const frag = hashIdx >= 0 ? href.slice(hashIdx) : "";
  const pathPart = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  if (pathPart === "") return href; // pure "#..." already handled above; empty path -> leave alone

  const resolved = resolveRelativePath(ctx.srcDir, pathPart);
  const page = PAGES_BY_SRC.get(resolved);
  if (page) return page.out + frag;

  const isDir = resolved.endsWith("/");
  const ghPath = isDir ? resolved.slice(0, -1) : resolved;
  const kind = isDir ? "tree" : "blob";
  return `${GITHUB_REPO_URL}/${kind}/main/${ghPath}${frag}`;
}

// --- escaping -----------------------------------------------------------------------

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
function slugify(text) {
  return (
    text
      .toLowerCase()
      .replace(/[`*_[\]()]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

// --- inline rendering (bold, italic, inline code, links) --------------------------
// Order matters: escape raw HTML first (so a literal "<slug>" in prose renders as
// text, never as a tag), then pull code spans out behind placeholders so nothing
// downstream (links/bold/italic) can reach inside them, then links, then emphasis,
// then restore the code spans.

function renderInline(rawText, ctx) {
  const codeStore = [];
  let s = escapeHtml(rawText);

  s = s.replace(/`([^`]+)`/g, (_, code) => {
    const i = codeStore.push(`<code>${code}</code>`) - 1;
    return `@@CS@@${i}@@CS@@`;
  });

  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    const resolved = resolveHref(href.trim(), ctx);
    const ext = /^[a-z][a-z0-9+.-]*:\/\//i.test(resolved) ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${escapeAttr(resolved)}"${ext}>${text}</a>`;
  });

  s = s.replace(/\*\*(.+?)\*\*/g, (_, inner) => `<strong>${inner}</strong>`);
  s = s.replace(/\*([^*\n]+)\*/g, (_, inner) => `<em>${inner}</em>`);
  s = s.replace(/_([^_\n]+)_/g, (_, inner) => `<em>${inner}</em>`);

  s = s.replace(/@@CS@@(\d+)@@CS@@/g, (_, i) => codeStore[Number(i)]);
  return s;
}

// --- block-level parsing -------------------------------------------------------------

const OL_RE = /^( *)(\d+)\.[ \t]+(.*)$/;
const UL_RE = /^( *)[-*+][ \t]+(.*)$/;

function matchListMarker(line) {
  let m = line.match(OL_RE);
  if (m) return { indent: m[1].length, ordered: true, contentStart: m[1].length + m[2].length + 2, text: m[3] };
  m = line.match(UL_RE);
  if (m) return { indent: m[1].length, ordered: false, contentStart: m[1].length + 2, text: m[2] };
  return null;
}

function isTableSeparatorRow(line) {
  if (line === undefined || !line.includes("|")) return false;
  const cells = splitTableRow(line);
  if (cells.length === 0) return false;
  return cells.every((c) => /^:?-+:?$/.test(c.trim()));
}
function splitTableRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|");
}
function alignOf(sepCell) {
  const c = sepCell.trim();
  const left = c.startsWith(":");
  const right = c.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  if (left) return "left";
  return null;
}

function parseTable(lines, i, ctx) {
  const header = splitTableRow(lines[i]).map((c) => c.trim());
  const aligns = splitTableRow(lines[i + 1]).map(alignOf);
  i += 2;
  const rows = [];
  while (i < lines.length && lines[i].trim() !== "" && lines[i].includes("|")) {
    rows.push(splitTableRow(lines[i]).map((c) => c.trim()));
    i++;
  }
  const th = (idx) => (aligns[idx] ? ` style="text-align:${aligns[idx]}"` : "");
  let html = '<div class="table-wrap"><table>\n<thead>\n<tr>';
  header.forEach((c, idx) => (html += `<th${th(idx)}>${renderInline(c, ctx)}</th>`));
  html += "</tr>\n</thead>\n<tbody>\n";
  for (const row of rows) {
    html += "<tr>";
    header.forEach((_, idx) => (html += `<td${th(idx)}>${renderInline(row[idx] ?? "", ctx)}</td>`));
    html += "</tr>\n";
  }
  html += "</tbody>\n</table></div>\n";
  return { html, next: i };
}

// Parses sibling list items that all start at exactly `indent`. `cursor` is a mutable
// { i } so nested calls can advance the shared position. Recursion is what gives us
// "nesting by 2-space indent": a marker line indented deeper than the current item's
// content column starts a nested list *inside* that item.
//
// Loose lists: a blank line between two items of the same type/indent does not end
// the list (e.g. taxonomy.md's numbered "two rules" list has one) - otherwise the
// second item would start a fresh <ol> and its number would visually reset to "1.".
// A blank line only ends the list when nothing but a matching sibling item follows it.
function parseList(lines, cursor, indent, ctx) {
  const items = [];
  let ordered = null;
  while (cursor.i < lines.length) {
    if (lines[cursor.i].trim() === "") {
      let peek = cursor.i;
      while (peek < lines.length && lines[peek].trim() === "") peek++;
      const peekMarker = peek < lines.length ? matchListMarker(lines[peek]) : null;
      if (!peekMarker || peekMarker.indent !== indent || peekMarker.ordered !== ordered) break;
      cursor.i = peek; // blank line(s) followed by a continuing sibling -> skip past them
    }
    const line = lines[cursor.i];
    const m = matchListMarker(line);
    if (!m || m.indent !== indent) break;
    if (ordered === null) ordered = m.ordered;
    cursor.i++;
    const textParts = [m.text];
    let childHtml = "";
    while (cursor.i < lines.length) {
      const next = lines[cursor.i];
      if (next.trim() === "") break;
      const m2 = matchListMarker(next);
      if (m2) {
        if (m2.indent > indent) {
          childHtml += parseList(lines, cursor, m2.indent, ctx);
          continue;
        }
        break; // sibling item or a shallower level -> this item is done
      }
      const lineIndent = next.match(/^( *)/)[1].length;
      if (lineIndent > indent) {
        textParts.push(next.trim());
        cursor.i++;
      } else {
        break;
      }
    }
    items.push(`<li>${renderInline(textParts.join(" "), ctx)}${childHtml}</li>\n`);
  }
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>\n${items.join("")}</${tag}>\n`;
}

function startsNewBlock(line, nextLine) {
  if (line.trim() === "") return true;
  if (/^#{1,6}[ \t]+/.test(line)) return true;
  if (/^(-{3,}|\*{3,}|_{3,})[ \t]*$/.test(line.trim())) return true;
  if (/^>[ \t]?/.test(line)) return true;
  if (/^```/.test(line)) return true;
  if (matchListMarker(line)) return true;
  if (line.includes("|") && isTableSeparatorRow(nextLine)) return true;
  return false;
}

function mdToHtml(markdown, ctx) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  const seenIds = new Set();
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }

    // fenced code block - consumed verbatim, escaped, never inline-parsed
    if (/^```/.test(line)) {
      i++;
      const codeLines = [];
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing fence (or EOF if unterminated)
      out.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>\n`);
      continue;
    }

    // heading
    const h = line.match(/^(#{1,6})[ \t]+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      let id = slugify(text);
      let n = 2;
      while (seenIds.has(id)) id = `${slugify(text)}-${n++}`;
      seenIds.add(id);
      out.push(`<h${level} id="${id}">${renderInline(text, ctx)}</h${level}>\n`);
      i++;
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})[ \t]*$/.test(line.trim())) {
      out.push("<hr>\n");
      i++;
      continue;
    }

    // blockquote
    if (/^>[ \t]?/.test(line)) {
      const qLines = [];
      while (i < lines.length && /^>[ \t]?/.test(lines[i])) {
        qLines.push(lines[i].replace(/^>[ \t]?/, ""));
        i++;
      }
      out.push(`<blockquote><p>${renderInline(qLines.join(" "), ctx)}</p></blockquote>\n`);
      continue;
    }

    // table (GFM: header row + |---| separator row)
    if (line.includes("|") && isTableSeparatorRow(lines[i + 1])) {
      const { html, next } = parseTable(lines, i, ctx);
      out.push(html);
      i = next;
      continue;
    }

    // list (unordered/ordered, nested by indent)
    const marker = matchListMarker(line);
    if (marker) {
      const cursor = { i };
      out.push(parseList(lines, cursor, marker.indent, ctx));
      i = cursor.i;
      continue;
    }

    // paragraph - consecutive plain lines until a blank line or the next block starts
    const pLines = [line];
    i++;
    while (i < lines.length && !startsNewBlock(lines[i], lines[i + 1])) {
      pLines.push(lines[i]);
      i++;
    }
    out.push(`<p>${renderInline(pLines.join(" "), ctx)}</p>\n`);
  }

  return out.join("");
}

// --- HTML shell (CSS + sidebar nav) --------------------------------------------------

// Crossing from the landing into the docs must not move the header: same logo position,
// same switcher, same right edge. That means one spine width for both surfaces, and the
// landing owns it (--maxw) - the docs read it rather than declaring a second copy. The
// fallback only covers a site that ships docs without a landing.
const LANDING_PATH = CONFIG.landing || "site/index.html";
const SPINE =
  (existsSync(LANDING_PATH) &&
    (readFileSync(LANDING_PATH, "utf8").match(/--maxw:\s*([0-9.]+px)/) || [])[1]) ||
  "1120px";

const CSS = `
/* The docs wear the landing's header: same mark, same wordmark, same centred ecosystem
   switcher. Only the right-hand link differs - here it points back to the homepage. */
.topbar{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px) saturate(140%);
  background:linear-gradient(180deg,rgba(8,8,11,.82),rgba(8,8,11,.42));
  border-bottom:1px solid var(--line2)}
.topbar-in{max-width:${SPINE};margin:0 auto;display:flex;align-items:center;gap:18px;
  padding:0 26px;height:66px;position:relative}
.tb-brand{display:flex;align-items:center;gap:11px;white-space:nowrap;text-decoration:none}
.tb-mark{height:32px;width:auto;flex:none;display:block}
.tb-word{display:flex;flex-direction:column;line-height:1}
.tb-word b{font-weight:750;font-size:16.5px;letter-spacing:-.025em;color:var(--fg)}
.tb-word i{font-style:normal;font-weight:700;font-size:9.5px;letter-spacing:.34em;
  text-transform:uppercase;margin-top:4px;
  background:linear-gradient(96deg,var(--orange) 4%,var(--orange-soft) 34%,var(--violet-soft) 96%);
  -webkit-background-clip:text;background-clip:text;color:transparent}
.tb-tag{font-family:var(--font-mono);font-size:11px;color:var(--orange);
  border:1px solid rgba(255,122,47,.34);border-radius:999px;padding:2px 8px;letter-spacing:.04em}
.tb-spacer{flex:1}
.tb-links{display:flex;gap:2px;align-items:center}
.tb-links a{color:var(--muted);font-size:14.5px;font-weight:600;padding:8px 11px;
  border-radius:9px;text-decoration:none;white-space:nowrap;transition:color .18s ease,background .18s ease}
.tb-links a:hover,.tb-links a.tb-on{color:var(--fg);background:rgba(255,255,255,.05)}
.tb-switch{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}
.tb-switch>button{display:inline-flex;align-items:center;gap:9px;font-family:var(--font-sans);
  font-size:14px;font-weight:650;color:var(--fg);background:rgba(255,255,255,.045);
  border:1px solid var(--line);border-radius:11px;padding:9px 13px;cursor:pointer;
  transition:border-color .18s ease,background .18s ease}
.tb-switch>button:hover{border-color:rgba(255,122,47,.5)}
.tb-switch .pip{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 10px var(--green)}
.tb-switch .chev{font-size:10px;opacity:.7;transition:transform .2s ease}
.tb-switch[data-open] .chev{transform:rotate(180deg)}
.tb-menu{position:absolute;top:calc(100% + 10px);left:50%;width:320px;text-align:left;
  background:linear-gradient(180deg,#141319,#0e0d12);border:1px solid var(--line);
  border-radius:16px;padding:10px;box-shadow:0 30px 70px rgba(0,0,0,.6);
  opacity:0;transform:translateX(-50%) translateY(-8px) scale(.98);pointer-events:none;
  transition:opacity .18s ease,transform .18s ease}
.tb-switch[data-open] .tb-menu{opacity:1;transform:translateX(-50%);pointer-events:auto}
.tb-menu .grp{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--muted);padding:10px 12px 6px}
.tb-menu a{display:flex;align-items:center;gap:11px;padding:11px 12px;border-radius:11px;
  color:var(--fg);font-size:14.5px;font-weight:600;text-decoration:none}
.tb-menu a:hover{background:rgba(255,255,255,.06)}
.tb-menu a small{display:block;color:var(--muted);font-weight:500;font-size:12px;margin-top:1px;line-height:1.35}
.tb-menu a .now{margin-left:auto;font-family:var(--font-mono);font-size:10px;color:var(--green);
  border:1px solid rgba(52,211,153,.35);border-radius:999px;padding:2px 8px}
.tb-menu .div{height:1px;background:var(--line2);margin:6px 8px}
@media(max-width:820px){
  .tb-switch{position:static;transform:none;margin-left:auto}
  .tb-menu{left:auto;right:0;transform:translateY(-8px) scale(.98)}
  .tb-switch[data-open] .tb-menu{transform:none}
  .tb-tag{display:none}
}

/* One palette with the landing (site/index.html :root) so the two read as one product.
   Light stays as an explicit user-preference override. */
:root {
  --bg: #08080b;
  --bg-panel: #0c0c11;
  --fg: #f4f2ee;
  --muted: #a7a3b2;
  --border: rgba(255,255,255,.08);
  --line: rgba(255,255,255,.08);
  --line2: rgba(255,255,255,.05);
  --orange: #ff7a2f;
  --orange-soft: #ff9a5c;
  --violet-soft: #a884ff;
  --green: #34d399;
  --link: #ff7a2f;
  --link-visited: #ff9a5c;
  --code-bg: rgba(255,255,255,.045);
  --active-bg: rgba(255,122,47,.09);
  --active-fg: #ff7a2f;
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Inter, system-ui, sans-serif;
  --font-mono: "SF Mono", ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #ffffff;
    --bg-panel: #f7f7f8;
    --fg: #1a1a1a;
    --muted: #5f6368;
    --border: #e3e3e6;
    --line: #e3e3e6;
    --line2: #ececef;
    --link: #c1490d;
    --link-visited: #993a0a;
    --code-bg: #f0f1f3;
    --active-bg: #fdeeda;
    --active-fg: #c1490d;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--fg);
  line-height: 1.65;
  position: relative;
}
/* The landing's atmosphere, same colours and same falloff: it lights the top of the page
   and then gets out of the way. Without it the docs read as a different product. */
body::before {
  content: "";
  position: absolute; top: 0; left: 0; right: 0; height: 900px;
  z-index: 0; pointer-events: none;
  background:
    radial-gradient(circle at 16% -180px, rgba(255,122,47,.16), transparent 62%),
    radial-gradient(circle at 78% -120px, rgba(139,92,246,.15), transparent 62%);
}
@media (prefers-color-scheme: light) { body::before { display: none; } }
/* Lifts the content off the glow. Deliberately not z-index'd alongside .topbar: the
   top bar must keep its 50, or the ecosystem menu opens behind the page. */
.layout { position: relative; z-index: 0; }
a { color: var(--link); text-decoration-thickness: from-font; }
a:visited { color: var(--link-visited); }
a:hover { text-decoration: none; }
/* Centred like the landing rather than flush left, on the landing's own spine: the
   sidebar's left edge and the content's right edge land where the header's logo and
   its last link already are. */
.layout { display: flex; align-items: flex-start; min-height: 100vh; max-width: ${SPINE}; margin: 0 auto; padding: 0 16px; }
.sidebar {
  flex: 0 0 232px;
  width: 232px;
  background: transparent;
  border-right: 1px solid var(--line2);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  padding: 1.25rem 18px 2rem 10px;
}
.nav-foot { margin-top: 1.5rem; padding-top: 0.75rem; border-top: 1px solid var(--line2); }
.nav-group-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  padding: 0.9rem 0.6rem 0.3rem;
}
.nav-link {
  display: block;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  color: var(--fg);
  text-decoration: none;
  font-size: 0.92rem;
}
.nav-link:visited { color: var(--fg); }
.nav-link:hover { background: var(--active-bg); }
.nav-link.active { background: var(--active-bg); color: var(--active-fg); font-weight: 600; }
.content {
  flex: 1 1 auto;
  min-width: 0;
  /* 10px here plus the layout's 16px puts the content's right edge on the header's
     26px gutter, so the page has one right edge from the top bar down. */
  padding: 2.5rem 10px 5rem clamp(1.25rem, 3vw, 2.75rem);
}
.content > :first-child { margin-top: 0; }
.prose { max-width: 76ch; margin: 0 auto; }
h1, h2, h3, h4, h5, h6 { line-height: 1.3; scroll-margin-top: 1rem; }
h1 { font-size: 1.9rem; margin: 0 0 1.25rem; }
h2 { font-size: 1.4rem; margin: 2.25rem 0 1rem; padding-top: 0.5rem; border-top: 1px solid var(--border); }
.prose > h2:first-of-type { border-top: none; padding-top: 0; }
h3 { font-size: 1.15rem; margin: 1.75rem 0 0.75rem; }
h4 { font-size: 1rem; margin: 1.5rem 0 0.5rem; }
p { margin: 0 0 1rem; }
ul, ol { margin: 0 0 1rem; padding-left: 1.4rem; }
li { margin: 0.25rem 0; }
li > ul, li > ol { margin: 0.35rem 0 0.25rem; }
blockquote {
  margin: 0 0 1rem;
  padding: 0.1rem 1rem;
  border-left: 3px solid var(--border);
  color: var(--muted);
}
blockquote p { margin: 0.5rem 0; }
hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
code {
  font-family: var(--font-mono);
  font-size: 0.87em;
  background: var(--code-bg);
  padding: 0.15em 0.4em;
  border-radius: 4px;
}
pre {
  background: var(--code-bg);
  padding: 1rem 1.1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0 0 1.25rem;
  max-width: 76ch;
}
pre code { background: none; padding: 0; border-radius: 0; font-size: 0.85em; }
.table-wrap { overflow-x: auto; margin: 0 0 1.25rem; }
table { border-collapse: collapse; width: 100%; font-size: 0.92rem; }
th, td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; text-align: left; vertical-align: top; }
th { background: var(--bg-panel); font-weight: 600; }
.page-footer {
  max-width: 76ch;
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
  color: var(--muted);
}
@media (max-width: 768px) {
  /* align-items: flex-start (desktop) means "don't stretch" on the CROSS axis; in row
     mode that's vertical (intentional, so the two columns don't force each other's
     height), but flex-direction:column below makes the cross axis horizontal - so it
     must switch to stretch here or .sidebar/.content shrink to their content's width
     instead of filling the viewport, overflowing it. */
  .layout { flex-direction: column; align-items: stretch; }
  .sidebar {
    position: static;
    width: auto;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  .nav-links { display: flex; flex-wrap: wrap; gap: 0.25rem 0.5rem; }
  .nav-group-title { flex-basis: 100%; padding-top: 0.6rem; }
  .content { padding: 1.5rem 1.25rem 3rem; }
}
`;

function buildNavRows() {
  const rows = [];
  let last = null;
  for (const p of PAGES) {
    if (p.group !== last) {
      if (p.group) rows.push({ type: "group", label: p.group });
      last = p.group;
    }
    rows.push({ type: "link", page: p });
  }
  return rows;
}

function renderNav(currentOut) {
  let html = "";
  for (const row of buildNavRows()) {
    if (row.type === "group") {
      html += `<div class="nav-group-title">${escapeHtml(row.label)}</div>\n`;
    } else {
      const active = row.page.out === currentOut;
      html += `<a class="nav-link${active ? " active" : ""}" href="${row.page.out}"${active ? ' aria-current="page"' : ""}>${escapeHtml(row.page.nav)}</a>\n`;
    }
  }
  return html;
}

function renderPage(page, contentHtml) {
  const title = escapeHtml(page.nav);
  const sourceUrl = `${GITHUB_REPO_URL}/blob/main/${page.src}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} - ${escapeHtml(BRAND)} docs</title>
<style>${CSS}</style>
</head>
<body>
<header class="topbar"><div class="topbar-in">
<a class="tb-brand" href="../index.html"><img class="tb-mark" src="../logo-mark.png" alt="" width="428" height="512"><span class="tb-word"><b>repository</b><i>Standards</i></span></a>
<span class="tb-tag">v${escapeHtml(VERSION)}</span>
<span class="tb-spacer"></span>
<nav class="tb-links"><a href="../index.html">Homepage</a></nav>
<div class="tb-switch" id="ecoswitch">
<button type="button" aria-haspopup="true" aria-expanded="false" id="ecobtn"><span class="pip"></span> Repository Standards <span class="chev">&#9662;</span></button>
<div class="tb-menu" role="menu" aria-label="Ecosystem">
<div class="grp">Core</div>
<a role="menuitem" href="index.html"><span>Repository Standards<small>the method - align, verify, drift 0</small></span><span class="now">here</span></a>
<div class="div"></div>
<div class="grp">Best practices</div>
<a role="menuitem" href="${escapeAttr(NODE_STACK_URL)}" target="_blank" rel="noopener noreferrer"><span>Node<small>Next.js + Fastify - starter, decisions, adapting guide</small></span></a>
</div>
</div>
</div></header>
<div class="layout">
<nav class="sidebar" aria-label="Documentation">
<div class="nav-links">
${renderNav(page.out)}</div>
${
  SIDEBAR_LINKS.length
    ? `<div class="nav-foot">
${SIDEBAR_LINKS.map((l) => `<a class="nav-link" href="${escapeAttr(l.href)}"${l.external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(l.label)}</a>`).join("\n")}
</div>`
    : ""
}
</nav>
<main class="content">
<div class="prose">
${contentHtml}
<p class="page-footer">Generated from <a href="${escapeAttr(sourceUrl)}" target="_blank" rel="noopener noreferrer"><code>${escapeHtml(page.src)}</code></a> by <code>tools/docsite.mjs</code> - edit the source there, not this HTML.</p>
</div>
</main>
</div>
<script>
(function(){
  var eco=document.getElementById("ecoswitch"),ecb=document.getElementById("ecobtn");
  if(!eco||!ecb) return;
  ecb.addEventListener("click",function(){var o=eco.hasAttribute("data-open");eco.toggleAttribute("data-open");ecb.setAttribute("aria-expanded",String(!o));});
  document.addEventListener("click",function(e){if(!eco.contains(e.target)){eco.removeAttribute("data-open");ecb.setAttribute("aria-expanded","false");}});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"){eco.removeAttribute("data-open");ecb.setAttribute("aria-expanded","false");}});
})();
// Every click here is a full page load, so the sidebar would scroll back to the top and
// lose your place in the tree. Carry its position across navigations; on a first visit
// (or a deep link) centre the page you landed on instead.
(function(){
  var sb=document.querySelector(".sidebar"); if(!sb) return;
  var KEY="docs-nav-scroll";
  try{
    var y=sessionStorage.getItem(KEY);
    if(y!==null) sb.scrollTop=parseInt(y,10)||0;
    // Expanding a branch shifts everything below it, so the restored position can still
    // leave the page you opened off-screen. Only then do we move.
    var a=sb.querySelector('[aria-current="page"]');
    if(a&&(a.offsetTop<sb.scrollTop||a.offsetTop>sb.scrollTop+sb.clientHeight-40)){
      sb.scrollTop=Math.max(0,a.offsetTop-sb.clientHeight/2);
    }
  }catch(e){}
  sb.addEventListener("scroll",function(){try{sessionStorage.setItem(KEY,sb.scrollTop);}catch(e){}},{passive:true});
})();
</script>
</body>
</html>
`;
}

const SITE_README = `# site/docs - generated docs site (DISCO-4)

This folder is **generated**. Every file in it is produced by the ecosystem's shared
generator - \`tools/docsite.mjs\` in
[repository-standards](https://github.com/bodurkalukasz/repository-standards) - from
this repo's own Markdown; never hand-edit the HTML here, it will be overwritten the
next time the script runs.

## Contents

| File | What it is |
|---|---|
| \`index.html\`, \`why.html\`, \`adopt.html\`, ... | one page per source Markdown file, per the PAGE MAP in \`tools/docsite.mjs\` |

## Why this shape, and how to use it

One source, two surfaces: this site renders the exact same Markdown an AI agent reads
from the repo, so there is nothing here to author twice and nothing that can drift from
the docs on its own. To change a page's content, edit its source \`.md\` file; to change
which files are published, the nav, or the layout, edit \`tools/docsite.mjs\`. Either way,
regenerate with:

\`\`\`
node tools/docsite.mjs
\`\`\`

Dependency-free (Node built-ins only), like the rest of \`tools/\`.
`;

// --- main -----------------------------------------------------------------------

function main() {
  for (const page of PAGES) {
    if (!existsSync(page.src)) {
      console.error(`docsite: source file missing for page map entry: ${page.src}`);
      process.exit(1);
    }
  }

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  for (const page of PAGES) {
    const contentHtml = mdToHtml(readFileSync(page.src, "utf8"), { srcDir: dirnamePosix(page.src) });
    writeFileSync(`${OUT_DIR}/${page.out}`, renderPage(page, contentHtml));
    console.log(`  wrote  ${OUT_DIR}/${page.out}  (from ${page.src})`);
  }

  writeFileSync(`${OUT_DIR}/README.md`, SITE_README);
  console.log(`  wrote  ${OUT_DIR}/README.md`);

  console.log(`\ndocsite: generated ${PAGES.length} page(s) + README into ${OUT_DIR}/\n`);
  process.exit(0);
}

// Importers (site-check) want PAGES, not a generation run.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
