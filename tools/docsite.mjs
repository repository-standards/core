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
// IA: modeled on nextjs.org/docs - a left sidebar, one page per source file, ordered by
// what a reader is trying to do. The groups are the PAGE MAP's own `group` fields; do not
// restate them here, since a list in a comment is a second copy that goes stale first.
//
// Usage:
//   node tools/docsite.mjs   # (re)generates every page in site/docs/, exit 0
//
// No dependencies. Zone 1 tooling - never shipped.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync } from "node:fs";
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
const GITHUB_REPO_URL = CONFIG.repo_url || "https://github.com/repository-standards/core";
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
  "https://github.com/repository-standards/node";

// --- the page map (nav order) -----------------------------------------------------
// group: null renders as a flat top-level link; a string renders a group heading the
// first time it is seen (consecutive pages sharing a group nest under one heading).
// Exported so site-check asserts against the real page list instead of re-deriving it
// by parsing this file - a second, drifting copy of the same map.
// Ordered by what a reader is trying to DO: run it, understand it, work in it, look it
// up - and only then, at the very bottom, walk the shipped tree file by file. Prose comes
// before reference and reference before the tree, because the tree is the one section
// nobody reads front to back; it is looked up. Putting it mid-sidebar buried the FAQ and
// the open questions under fifty file nodes.
// Quick start is the docs home. A reader arriving from the landing has already been told
// what this is - what they need next is the command. README is deliberately absent: it is
// the GitHub front door, and using it as the docs home put the same "why it exists"
// argument on two pages.
export const PAGES = CONFIG.pages || [
  { src: "docs/quick-start.md", out: "index.html", nav: "Quick start", group: null },
  { src: "docs/what-this-is.md", out: "what-this-is.html", nav: "What this is", group: null },
  { src: "docs/manifesto.md", out: "why.html", nav: "Why it exists", group: null },

  { src: "docs/method/adoption.md", out: "adopt.html", nav: "Adopt: the gated path", group: "Adopting" },
  { src: "docs/method/self-verify.md", out: "self-verify.html", nav: "Verifying compliance", group: "Adopting" },
  { src: "docs/method/checklist.md", out: "checklist.html", nav: "Decision checklist", group: "Adopting" },

  { src: "docs/method/ways-of-working.md", out: "ways-of-working.html", nav: "The loop, and who does what", group: "Ways of working" },
  { src: "docs/method/working-with-specs.md", out: "working-with-specs.html", nav: "Working with specs", group: "Ways of working" },
  { src: "docs/method/working-with-ai/README.md", out: "working-with-ai.html", nav: "Working with AI", group: "Ways of working" },
  { src: "docs/method/working-with-ai/context-is-the-budget.md", out: "wwa-context-is-the-budget.html", nav: null, group: "Ways of working" },
  { src: "docs/method/working-with-ai/comments-that-earn-their-tokens.md", out: "wwa-comments-that-earn-their-tokens.html", nav: null, group: "Ways of working" },
  { src: "docs/method/working-with-ai/felt-speed-vs-measured-speed.md", out: "wwa-felt-speed-vs-measured-speed.html", nav: null, group: "Ways of working" },
  { src: "docs/method/working-with-ai/a-check-the-agent-can-run.md", out: "wwa-a-check-the-agent-can-run.html", nav: null, group: "Ways of working" },
  { src: "docs/method/working-with-ai/review-is-where-the-cost-lands.md", out: "wwa-review-is-where-the-cost-lands.html", nav: null, group: "Ways of working" },
  { src: "docs/method/working-with-ai/the-cleanup-comes-later.md", out: "wwa-the-cleanup-comes-later.html", nav: null, group: "Ways of working" },
  { src: "docs/method/working-with-ai/instructions-that-survive.md", out: "wwa-instructions-that-survive.html", nav: null, group: "Ways of working" },
  { src: "docs/method/working-with-ai/blast-radius-before-autonomy.md", out: "wwa-blast-radius-before-autonomy.html", nav: null, group: "Ways of working" },
  { src: "docs/method/working-with-ai/sources.md", out: "wwa-sources.html", nav: null, group: "Ways of working" },
  { src: "docs/method/discovery.md", out: "discovery.html", nav: "Turning meetings into specs", group: "Ways of working" },
  { src: "docs/method/working-language.md", out: "working-language.html", nav: "Choosing a working language", group: "Ways of working" },

  { src: "docs/method/taxonomy.md", out: "taxonomy.html", nav: "Where knowledge lands", group: "Concepts" },
  { src: "docs/tree/specs.md", out: "specs.html", nav: "Specs", group: "Concepts" },
  { src: "docs/ecosystem.md", out: "ecosystem.html", nav: "How it fits together", group: "Concepts" },

  { src: "standard/SPEC.md", out: "spec.html", nav: "The spec", group: "Reference" },
  { src: "docs/tree/docs-decision-records.md", out: "decision-records.html", nav: "Decision records", group: "Reference" },
  { src: "docs/faq.md", out: "faq.html", nav: "FAQ", group: "Reference" },
  { src: "docs/open-questions/README.md", out: "open-questions.html", nav: "Open questions", group: "Reference" },
  { src: "docs/case-studies/README.md", out: "case-studies.html", nav: "Case studies", group: "Reference" },

  { src: "docs/file-map.md", out: "file-map.html", nav: "Every file, and why", group: "File anatomy", render: "tree-root" },
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

  // A tree page has no PAGE MAP entry to match on - every one of them is generated from
  // the manifest and shares its src. Its authored prose does have a file, so one path
  // page links to another by naming that file, which link-check can then verify exists.
  // Writing the generated .html name directly would be a link nothing checks.
  const companion = resolved.match(/^docs\/tree\/(.+)\.md$/);
  if (companion) return `tree-${companion[1]}.html${frag}`;

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
  // HTML comments are a note to whoever opens the source file - a "generated, do not edit"
  // banner, a lint pragma. Everything else here escapes raw HTML so a literal tag renders as
  // text, which turned those notes into visible body copy on the page. They are dropped, not
  // escaped: the reader of the rendered page is not the audience the comment was written for.
  const lines = markdown
    .replace(/\r\n/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n");
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
  padding:0 var(--tb-pad);height:var(--tb-h);position:relative}
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
  /* The header's own height, declared once. The sidebar sticks below it and sizes itself
     against it; hard-coding the number in both places is how the column ends up scrolling
     under the header with its first entries unreachable. */
  --tb-h: 66px;
  --tb-pad: 26px;
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
  /* Masked rather than drawn with borders, so the chevron keeps its shape while its box
     stays big enough to click. Inline, because the site loads no external asset. */
  --chevron: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M3.2 1.4 L6.8 5 L3.2 8.6' fill='none' stroke='black' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
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
  flex: 0 0 262px;
  width: 262px;
  background: transparent;
  border-right: 1px solid var(--line2);
  position: sticky;
  top: var(--tb-h);
  height: calc(100vh - var(--tb-h));
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.25rem 18px 2rem 10px;
}
/* The sidebar's file tree, styled as part of the nav rather than as a terminal: the
   sidebar's own sans face, one size step under the top-level links. Monospace made it
   read as embedded output - a different kind of thing on the page - when it is just the
   nav going one level deeper. Indentation plus a guide rule per level carries the
   nesting; box-drawing characters would not survive the names wrapping. */
.nav-tree { margin: 0.15rem 0 0 0.35rem; padding-left: 0.35rem; border-left: 1px solid var(--line2); }
.nav-tree-kids { margin-left: 0.62rem; padding-left: 0.62rem; border-left: 1px solid var(--line2); }
.nav-tree-link {
  display: block; flex: 1 1 auto; padding: 0.32rem 0.5rem; border-radius: 6px;
  font-size: 0.855rem; line-height: 1.35; color: var(--muted); text-decoration: none;
  overflow-wrap: anywhere;
}
.nav-tree-link:visited { color: var(--muted); }
a.nav-tree-link:hover { background: var(--active-bg); color: var(--fg); }
.nav-tree-link.active { background: var(--active-bg); color: var(--active-fg); font-weight: 600; }
/* A folder the manifest never names has no page to open. It still has to read as a
   folder, so it dims rather than vanishing. */
.nav-tree-link.is-plain { color: var(--muted); opacity: 0.68; }
/* The label navigates, the chevron expands - two jobs, two targets. With one chevron on
   the left and the whole row toggling, clicking a folder opened it instead of opening its
   page, and its page was unreachable from the tree. pointer-events off on the summary and
   back on for the two children is what splits them without any script. */
.nav-tree details > summary {
  list-style: none; display: flex; align-items: center; border-radius: 6px;
  pointer-events: none;
}
.nav-tree details > summary::-webkit-details-marker { display: none; }
.nav-tree details > summary .nav-tree-link { pointer-events: auto; }
.nav-tree details > summary::after {
  content: ""; flex: 0 0 auto; width: 1.4rem; height: 1.4rem; margin-left: auto;
  background-color: var(--muted);
  -webkit-mask: var(--chevron) center / 0.42rem no-repeat;
  mask: var(--chevron) center / 0.42rem no-repeat;
  transform: rotate(0deg); transition: transform 0.15s ease;
  pointer-events: auto; cursor: pointer; border-radius: 5px;
}
.nav-tree details > summary::after:hover { background-color: var(--fg); }
.nav-tree details[open] > summary::after { transform: rotate(90deg); }
@media (prefers-reduced-motion: reduce) {
  .nav-tree details > summary::after { transition: none; }
}

/* A single path's page. The rule separates the prose a reader came for from the machine
   facts underneath it, so the page has a visible bottom half rather than trailing off. */
.fm-rule { border: 0; border-top: 1px solid var(--line2); margin: 3rem 0 0; max-width: 68ch; }
.fm-lead { font-size: 1.05rem; color: var(--fg); max-width: 62ch; }
.fm-facts { margin: 0 0 1.25rem; padding-left: 1.1rem; }
.fm-facts > li { margin: 0 0 0.5rem; max-width: 68ch; }
.fm-note { font-size: 0.9rem; margin-top: -0.5rem; }
.nav-foot { margin-top: 1.5rem; padding-top: 0.75rem; border-top: 1px solid var(--line2); }
.nav-foot { margin-top: 1.5rem; padding-top: 0.75rem; border-top: 1px solid var(--line2); }
/* A section heading, not a label. Uppercase micro-caps read as chrome and the eye skips
   them; at body size in sentence case they read as the thing they are, which is how the
   column gets scannable instead of dense. */
.nav-group-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--fg);
  padding: 1.5rem 0.6rem 0.45rem;
}
/* One guide rule runs down the column and the current page lights up its own segment.
   That is the whole orientation cue: where am I, and how deep. A filled pill for the
   active row said the same thing louder and gave no sense of position. */
.nav-link {
  display: block;
  padding: 0.35rem 0.7rem;
  margin-left: 0.35rem;
  border-left: 1px solid var(--line2);
  color: var(--muted);
  text-decoration: none;
  font-size: 0.875rem;
  line-height: 1.4;
}
.nav-link:visited { color: var(--muted); }
.nav-link:hover { color: var(--fg); border-left-color: var(--muted); }
.nav-link.active {
  color: var(--active-fg);
  font-weight: 600;
  border-left-color: currentColor;
}
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
/* Code blocks wrap rather than scroll. A horizontal scrollbar inside a dark panel is
   invisible until you try it, so a long line simply looked truncated - and most of what
   these blocks hold is prose anyway: the sentence you say to the agent, a shell command,
   a markdown example. The trade is that a block relying on aligned columns reflows if it
   overruns, so those are written to fit. That failure is at least visible, which the
   scrollbar's never was. */
pre {
  background: var(--code-bg);
  padding: 1rem 1.1rem;
  border-radius: 8px;
  margin: 0 0 1.25rem;
  max-width: 76ch;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
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
    // Per-path pages are not flat rows - renderNav draws them nested, from the tree
    // itself, so the sidebar mirrors the shipped folder structure rather than a list.
    if (p.render === "file") continue;
    // `nav: null` - rendered and linkable, but not a sidebar row. For the pages that hang
    // off one entry point and are read from it: putting all nine practice notes in the
    // column would triple the section to serve a page nobody navigates to by name. Without
    // this they were not pages at all, and their links fell through to GitHub.
    if (p.nav === null) continue;
    if (p.group !== last) {
      if (p.group) rows.push({ type: "group", label: p.group });
      last = p.group;
    }
    rows.push({ type: "link", page: p });
    if (p.render === "tree-root") rows.push({ type: "tree" });
  }
  return rows;
}

// The sidebar's nested file tree. A folder with children becomes a <details> so the column
// stays scannable, and it renders open when the page you are on IS it or lives inside it.
// That is what makes clicking a folder both open its page and expand it, the way the sites
// this is modelled on behave: the expansion is a consequence of arriving, not a second
// click. Deep links land with their branch already open for the same reason.
function renderNavTree(node, currentOut, depth = 0) {
  let html = "";
  for (const child of node.children.values()) {
    // Linked when a page exists for it - which is either a manifest entry or authored
    // prose. Keying this on the manifest alone left .claude/ and .github/ expanding with
    // nothing to click even after their pages were written.
    const hasPage = child.entry || existsSync(treeProsePath(child.path));
    const out = hasPage ? treeSlug(child.path) : null;
    const active = out === currentOut;
    const label = `${escapeHtml(child.name)}${isFolder(child.path) ? "/" : ""}`;
    const link = out
      ? `<a class="nav-tree-link${active ? " active" : ""}" href="${escapeAttr(out)}"${active ? ' aria-current="page"' : ""}>${label}</a>`
      : `<span class="nav-tree-link is-plain">${label}</span>`;

    if (child.children.size) {
      const open = active || containsPage(child, currentOut);
      html += `<details class="nav-tree-node"${open ? " open" : ""}>
<summary>${link}</summary>
<div class="nav-tree-kids">${renderNavTree(child, currentOut, depth + 1)}</div>
</details>\n`;
    } else {
      html += `<div class="nav-tree-node">${link}</div>\n`;
    }
  }
  return html;
}

function containsPage(node, currentOut) {
  for (const child of node.children.values()) {
    if (child.entry && treeSlug(child.path) === currentOut) return true;
    if (containsPage(child, currentOut)) return true;
  }
  return false;
}

function renderNav(currentOut) {
  let html = "";
  for (const row of buildNavRows()) {
    if (row.type === "group") {
      html += `<div class="nav-group-title">${escapeHtml(row.label)}</div>\n`;
    } else if (row.type === "tree") {
      html += `<div class="nav-tree">${renderNavTree(TREE, currentOut)}</div>\n`;
    } else {
      const active = row.page.out === currentOut;
      html += `<a class="nav-link${active ? " active" : ""}" href="${row.page.out}"${active ? ' aria-current="page"' : ""}>${escapeHtml(row.page.nav)}</a>\n`;
    }
  }
  return html;
}

function renderPage(page, contentHtml) {
  // A page with no sidebar label still needs a browser-tab title, and the document already
  // states one: its own H1. Taking it from the rendered content rather than the page map
  // means the two cannot disagree.
  const h1 = contentHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title = escapeHtml(page.nav ?? (h1 ? h1[1].replace(/<[^>]+>/g, "").trim() : page.out));
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
[repository-standards](https://github.com/repository-standards/core) - from
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

// --- the shipped tree (projected from the manifest, never authored) -----------------
// R4 in practice. The list of what an aligned repo carries has ONE home:
// standard/standard.manifest.json - the same file `scripts/self-verify.mjs` scores a repo
// against. This section renders that data into a page per path, so the tree a reader
// browses and the tree the tooling enforces cannot disagree. Counts are counted.
//
// Rule ids (R1, R19, ...) are the standard's internal handles. They index the spec; they
// mean nothing to someone reading a docs page, so nothing here prints one. What a reader
// gets instead is the rule's own sentence, quoted from SPEC.md.

const MANIFEST_PAGE = PAGES.find((p) => p.render === "tree-root");
// The tree root renders main's generated overview; the per-path leaves come from the
// same manifest that overview is generated from, so there is still one source.
const MANIFEST = MANIFEST_PAGE ? JSON.parse(readFileSync("standard/standard.manifest.json", "utf8")) : null;

// A path is a folder if the shipped tree says so. The few entries with no shipped
// counterpart (the pin, the backlog, per-repo JSON) are written at align time and are files.
function isFolder(relPath) {
  const shipped = `standard/${relPath}`;
  if (existsSync(shipped)) return statSync(shipped).isDirectory();
  return !/\.[^/.]+$/.test(relPath);
}

// Where a path's page lives. Normally a generated tree page; but when that path's prose is
// important enough to also sit in the sidebar under its own name, the PAGE MAP already
// renders that same file, and the tree node points at it instead of generating a second
// copy. One node per thing: two pages from one source is the duplication this whole
// section exists to remove.
function treeSlug(relPath) {
  const mapped = PAGES_BY_SRC.get(treeProsePath(relPath));
  if (mapped) return mapped.out;
  return `tree-${slugify(relPath.replace(/\//g, " "))}.html`;
}

// Explorer order, not manifest order: folders before files, dotted names at the top of
// their group, then alphabetical - what `ls -a` and every file explorer show. The manifest
// is ordered by argument (entry point, pin, specs, guards, security, docs), which is right
// for reading the manifest and wrong for finding a path you already know the name of.
// Sorting once here keeps the sidebar and the generated page sequence from disagreeing.
function compareTreeNodes(a, b) {
  const aFolder = isFolder(a.path);
  const bFolder = isFolder(b.path);
  if (aFolder !== bFolder) return aFolder ? -1 : 1;
  const aDot = a.name.startsWith(".");
  const bDot = b.name.startsWith(".");
  if (aDot !== bDot) return aDot ? -1 : 1;
  return a.name.localeCompare(b.name, "en", { sensitivity: "base", numeric: true });
}

function sortTree(node) {
  const sorted = [...node.children.values()].sort(compareTreeNodes);
  node.children = new Map(sorted.map((child) => [child.name, child]));
  for (const child of node.children.values()) sortTree(child);
  return node;
}

function buildTree(files) {
  const root = { children: new Map() };
  for (const f of files) {
    const parts = f.path.split("/");
    let node = root;
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join("/");
      if (!node.children.has(part)) node.children.set(part, { name: part, path, children: new Map() });
      node = node.children.get(part);
      if (i === parts.length - 1) node.entry = f;
    });
  }
  return sortTree(root);
}

const TREE = MANIFEST ? buildTree(MANIFEST.files || []) : { children: new Map() };

// One page per manifest path, appended after the section index so the sidebar order
// follows the tree. A node the manifest never names (`.claude/`, `.github/`) gets a page
// too as soon as somebody writes its prose: the reason those used to expand-only was that
// the manifest states no purpose for them, and an invented purpose would be worse than
// none. Authored prose is a stated purpose, so the objection lapses. Without prose the
// node still just expands, because a page saying nothing is a dead end with a heading.
function collectTreePages(node, acc = []) {
  for (const child of node.children.values()) {
    // Already a PAGE MAP page under its own name - the tree links there, nothing to generate.
    if (PAGES_BY_SRC.has(treeProsePath(child.path))) {
      collectTreePages(child, acc);
      continue;
    }
    if (child.entry || existsSync(treeProsePath(child.path))) {
      acc.push({
        src: "standard/standard.manifest.json",
        out: treeSlug(child.path),
        nav: child.name + (isFolder(child.path) ? "/" : ""),
        group: MANIFEST_PAGE.group,
        render: "file",
        node: child,
      });
    }
    collectTreePages(child, acc);
  }
  return acc;
}

if (MANIFEST_PAGE) {
  const treePages = collectTreePages(TREE);
  const seen = new Set();
  for (const p of treePages) {
    if (seen.has(p.out)) throw new Error(`docsite: two manifest paths slug to ${p.out} - treeSlug needs disambiguating`);
    seen.add(p.out);
  }
  PAGES.push(...treePages);
}

// The spec's rules, by id: `- **R7.** text...` until the next rule or heading. Read so a
// file's page can quote the sentence that puts it there instead of printing "R7".
function loadRules() {
  const specPage = PAGES.find((p) => p.src.endsWith("SPEC.md"));
  if (!specPage || !existsSync(specPage.src)) return new Map();
  const spec = readFileSync(specPage.src, "utf8");
  const rules = new Map();
  const re = /^- \*\*(R\d+)\.\*\*\s([\s\S]*?)(?=\n- \*\*R\d+\.\*\*|\n## |\n*$)/gm;
  let m;
  while ((m = re.exec(spec))) rules.set(m[1], m[2].replace(/\s+/g, " ").trim());
  return rules;
}
const RULES = loadRules();

// The first sentence carries the obligation; the rest qualifies it. Abbreviations like
// "e.g." are not sentence ends, so require the next character to open a new one.
function firstSentence(text) {
  const m = text.match(/^[\s\S]*?[.:](?=\s+[A-Z`(])/);
  return (m ? m[0] : text).trim();
}

function ruleQuote(ruleId) {
  const full = RULES.get(ruleId);
  if (!full) return "";
  const lead = firstSentence(full);
  const more = lead.length < full.length;
  return `<blockquote><p>${renderInline(lead, { srcDir: "standard" })}</p></blockquote>
<p class="fm-note"><a href="spec.html">${more ? "Read this rule in full" : "See it in the spec"}</a></p>`;
}

function statusLine(e) {
  const bits = [e.required ? "Required" : "Optional"];
  if (e.profile === "scale") bits.push("arrives at the <code>scale</code> profile, not at <code>core</code>");
  else bits.push("part of the <code>core</code> profile");
  return bits.join(" - ");
}

// A path's authored companion: prose written for a person who has to decide what to put
// in this folder. `docs/tree/<slug>.md` - same slug as the page, so the file a writer
// opens is named after the page a reader lands on. Absent for a path nobody has written
// up yet, which is a gap in the docs rather than an error in the build.
function treeProsePath(relPath) {
  return `docs/tree/${slugify(relPath.replace(/\//g, " "))}.md`;
}

// The page a reader wants: what this is, what to put in it, what not to, an example -
// then, once, at the bottom, the machine facts and the decisions behind them. The facts
// used to open the page, which meant every path read as a manifest row wearing a heading
// and nobody learned what to keep in the folder.
function renderTreeFilePage(page) {
  const { node } = page;
  const e = node.entry;
  const dir = isFolder(node.path);
  const adaptRule = e ? (MANIFEST.adaptRules || {})[e.adapt] || "" : "";
  const shipped = existsSync(`standard/${node.path}`);

  const sections = (MANIFEST.sections || []).filter((s) => s.file === node.path);
  const guards = (MANIFEST.guards || []).filter((g) => g.run.includes(node.path));
  const children = [...node.children.values()];

  let html = `<h1><code>${escapeHtml(node.path)}${dir ? "/" : ""}</code></h1>`;

  const prosePath = treeProsePath(node.path);
  if (existsSync(prosePath)) {
    html += "\n" + mdToHtml(readFileSync(prosePath, "utf8"), { srcDir: dirnamePosix(prosePath) });
  } else if (e) {
    html += `\n<p class="fm-lead">${escapeHtml(e.purpose)}</p>`;
  }

  if (children.length) {
    html += `\n<h2>What is inside</h2>\n<ul class="fm-facts">\n${children
      .map((c) => {
        const label = `<code>${escapeHtml(c.name)}${isFolder(c.path) ? "/" : ""}</code>`;
        return c.entry
          ? `<li><a href="${escapeAttr(treeSlug(c.path))}">${label}</a> - ${escapeHtml(c.entry.purpose)}</li>`
          : `<li>${label}</li>`;
      })
      .join("\n")}\n</ul>`;
  }

  if (sections.length) {
    html += `\n<h2>The headings it must carry</h2>\n<ul class="fm-facts">\n${sections
      .map((s) => `<li><strong>${escapeHtml(s.heading)}.</strong> ${escapeHtml(s.purpose)}${s.required ? "" : " (optional)"}</li>`)
      .join("\n")}\n</ul>`;
  }

  // A node the manifest does not name has no status, no adapt class and no rule - it is a
  // container the entries below it live in. Printing an empty Reference block for it would
  // read as "we checked and there is nothing", which is a different claim.
  if (e) {
    html += `\n<hr class="fm-rule">\n<h2>Reference</h2>
<ul class="fm-facts">
<li><strong>Status.</strong> ${statusLine(e)}.</li>
<li><strong>How it arrives.</strong> <code>${escapeHtml(e.adapt)}</code> - ${escapeHtml(adaptRule)}</li>
${shipped ? `<li><strong>Shipped form.</strong> <a href="${escapeAttr(GITHUB_REPO_URL)}/blob/main/standard/${escapeAttr(node.path)}" target="_blank" rel="noopener noreferrer">read it in the standard's own tree</a></li>` : `<li><strong>Shipped form.</strong> None - this one is written into your repo during alignment, from your repo's own reality.</li>`}
</ul>`;

    const quote = ruleQuote(e.rule);
    if (quote) html += `\n<h3>The rule that requires it</h3>\n${quote}`;
  }

  if (guards.length) {
    html += `\n<h3>What checks it</h3>\n<ul class="fm-facts">\n${guards
      .map((g) => `<li><code>${escapeHtml(g.run)}</code> - ${escapeHtml(g.purpose)}${g.blocks ? " Blocks the build when it fails." : ""}</li>`)
      .join("\n")}\n</ul>`;
  }

  return html;
}

function unusedTreeIndex() {
  const files = MANIFEST.files || [];
  const refs = MANIFEST.references || [];
  const required = files.filter((f) => f.required).length;
  const scale = files.filter((f) => f.profile === "scale").length;

  const legend = Object.entries(MANIFEST.adaptRules || {})
    .map(([k, v]) => `<li><strong><code>${escapeHtml(k)}</code></strong> - ${escapeHtml(v)}</li>`)
    .join("\n");

  const refRows = refs
    .map((r) => `<li><code>${escapeHtml(r.path)}</code> - ${escapeHtml(r.purpose)}</li>`)
    .join("\n");

  const roots = [...TREE.children.values()]
    .map((c) => {
      const label = `<code>${escapeHtml(c.name)}${isFolder(c.path) ? "/" : ""}</code>`;
      return c.entry
        ? `<li><a href="${escapeAttr(treeSlug(c.path))}">${label}</a> - ${escapeHtml(c.entry.purpose)}</li>`
        : `<li>${label}</li>`;
    })
    .join("\n");

  return `<h1>The shipped tree</h1>
<p class="fm-lead">Everything an aligned repository carries: ${files.length} paths, ${required} of them
required, ${scale} arriving only at the <code>scale</code> profile. Every one has its own page in the
sidebar - what it is for, why the standard asks for it, and what checks it.</p>
<p>This is not a hand-written inventory. It is
<a href="${escapeAttr(GITHUB_REPO_URL)}/blob/main/standard/standard.manifest.json" target="_blank" rel="noopener noreferrer"><code>standard.manifest.json</code></a>
rendered - the same file <code>self-verify</code> scores your repo against. If a path is listed here,
its absence is drift you can measure.</p>

<h2>Four ways a file arrives</h2>
<p>Adoption is not a copy job. Each path carries the way it should reach your repo:</p>
<ul class="fm-facts">
${legend}
</ul>

<h2>Start at the root</h2>
<ul class="fm-facts">
${roots}
</ul>

<h2>Adopted by reference, never copied</h2>
<p>${refs.length} method documents are not files you receive - they stay in the standard and you
read them at latest, which is why updating the method never touches your tree:</p>
<ul class="fm-facts">
${refRows}
</ul>`;
}

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
    const contentHtml =
      page.render === "file"
        ? renderTreeFilePage(page)
        : mdToHtml(readFileSync(page.src, "utf8"), { srcDir: dirnamePosix(page.src) });
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
