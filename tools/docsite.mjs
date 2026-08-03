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

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync, readdirSync } from "node:fs";
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
// The deployed root - the docs live under it, and so does llms.txt.
const SITE_DIR = OUT_DIR.includes("/") ? OUT_DIR.slice(0, OUT_DIR.lastIndexOf("/")) : ".";
// Every internal link is written root-absolute against this. Relative hrefs are at the mercy
// of whatever the browser thinks the base is, so one visit to /docs without the trailing
// slash turned every link in the page into a 404 - the sidebar included. A site served from
// a different prefix (a stack at /docs/node/) sets base_path and nothing else changes.
// The site root the docs hang under, so the header links home from any depth.
const SITE_ROOT = (CONFIG.site_root || "/").replace(/\/+$/, "/");
const BASE = (CONFIG.base_path || "/" + OUT_DIR.split("/").slice(1).join("/") + "/").replace(/\/+$/, "/");
const GITHUB_REPO_URL = CONFIG.repo_url || "https://github.com/repository-standards/core";
// Link previews need absolute URLs - a scraper has no page to resolve a relative one against,
// and every one of them silently drops the card rather than reporting why. Empty means the
// site does not know where it is served from, and the preview tags are then left out entirely
// rather than emitted broken.
const SITE_URL = (CONFIG.site_url || "").replace(/\/+$/, "");
// Each surface points at its own card, so a stack shared into a chat shows the stack.
// SITE_ROOT is where that surface lives - "/" for the core, "/node/" for a stack - which
// makes the default correct for both without either having to write it down.
const OG_IMAGE = CONFIG.og_image || `${SITE_ROOT}og.png`;
const BRAND = CONFIG.brand || "repository-standards";
// Which surface of the ecosystem this is. Empty on the core, which IS the unqualified one.
const WORDMARK_SUFFIX = CONFIG.wordmark_suffix || "";
// The header wears the released version, read from its one home rather than restated here.
// A VERSION file is this repository's convention, not the ecosystem's - a stack running this
// same generator against its own markdown need not have one, and crashing on its absence
// would make "one form, many sites" true only for the site that owns the generator.
const VERSION = existsSync("VERSION") ? readFileSync("VERSION", "utf8").trim() : CONFIG.version || "";
// The header is fixed now - brand, version, ecosystem switcher, one link home - so the
// only thing a site still configures up there is where the switcher's entries point.
// The old `topbar` list is read as a fallback so a config written for the previous header
// still resolves, but it no longer draws anything.
const NODE_STACK_URL =
  CONFIG.node_stack_url ||
  (CONFIG.topbar || []).find((l) => l.external)?.href ||
  "https://github.com/repository-standards/node";
// The switcher moves between docs sites, so its entries are docs URLs. The core's is
// `core_docs_url`, the stack's `node_docs_url` - both defaulting to whatever the site
// already knew, so a config written before the ecosystem shared one domain still resolves.
// Which entry reads "here" is decided by comparing against this site's own BASE rather
// than hardcoded: the same generator builds both sites, and the core's entry marked
// "here" on the stack's pages is the one bug this cannot be allowed to have.
// Surface roots, not documentation roots. The switcher is labelled with product names and
// one-line descriptions, so picking one means "take me to that product" - its front door,
// where a reader decides whether they want the pitch or the docs. Landing somebody straight
// in a table of contents answers a question they had not asked yet.
// The old *_docs_url keys still resolve, so a config written before this keeps working.
const CORE_URL = CONFIG.core_url || CONFIG.core_docs_url || SITE_ROOT;
const NODE_URL = CONFIG.node_url || CONFIG.node_docs_url || NODE_STACK_URL;
const isHere = (url) => url === SITE_ROOT || url === `${BASE}index.html` || url === BASE;

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
  { src: "docs/what-and-why.md", out: "what-and-why.html", nav: "What this is, and why", group: null },

  { src: "docs/method/ways-of-working.md", out: "ways-of-working.html", nav: "Start here", group: "Working with it" },
  { src: "docs/method/tracking-work.md", out: "tracking-work.html", nav: "Backlog, cycles, timeline", group: "Working with it" },
  { src: "docs/method/product-work.md", out: "product-work.html", nav: "Product Owner", role: "po", group: "Working with it" },
  { src: "docs/method/dev-work.md", out: "dev-work.html", nav: "Developer", role: "dev", group: "Working with it" },
  { src: "docs/method/lead-work.md", out: "lead-work.html", nav: "Consultant", role: "lead", group: "Working with it" },
  { src: "docs/method/working-with-specs.md", out: "working-with-specs.html", nav: "Anyone", role: "any", group: "Working with it" },
  { src: "docs/method/agent-work.md", out: "agent-work.html", nav: "What the agent does by itself", group: "Working with it" },
  { src: "docs/method/discovery.md", out: "discovery.html", nav: "Turning meetings into specs", group: "Working with it" },
  { src: "docs/method/working-language.md", out: "working-language.html", nav: "Choosing a working language", group: "Working with it" },

  { src: "docs/method/adoption.md", also: ["docs/method/self-verify.md"], out: "adopt.html", nav: "Adopting", group: "Working with it" },

  { src: "docs/personas.md", out: "personas.html", nav: "Our personas", group: "About this project" },
  { src: "docs/how-this-repo-works.md", out: "how-this-repo-works.html", nav: "How this repo runs itself", group: "About this project", sub: "How it works" },
  { src: "docs/method/taxonomy.md", out: "taxonomy.html", nav: "Where knowledge lands", group: "About this project", sub: "How it works" },
  { src: "docs/ecosystem.md", out: "ecosystem.html", nav: "How it fits together", group: "About this project", sub: "How it works" },
  { src: "docs/method/working-with-ai/README.md", out: "working-with-ai.html", nav: "Working with AI", group: "About this project", sub: "How it works" },
  { src: "docs/method/working-with-ai/context-is-the-budget.md", out: "wwa-context-is-the-budget.html", nav: null, group: "About this project", sub: "How it works", parent: "working-with-ai.html" },
  { src: "docs/method/working-with-ai/comments-that-earn-their-tokens.md", out: "wwa-comments-that-earn-their-tokens.html", nav: null, group: "About this project", sub: "How it works", parent: "working-with-ai.html" },
  { src: "docs/method/working-with-ai/felt-speed-vs-measured-speed.md", out: "wwa-felt-speed-vs-measured-speed.html", nav: null, group: "About this project", sub: "How it works", parent: "working-with-ai.html" },
  { src: "docs/method/working-with-ai/a-check-the-agent-can-run.md", out: "wwa-a-check-the-agent-can-run.html", nav: null, group: "About this project", sub: "How it works", parent: "working-with-ai.html" },
  { src: "docs/method/working-with-ai/review-is-where-the-cost-lands.md", out: "wwa-review-is-where-the-cost-lands.html", nav: null, group: "About this project", sub: "How it works", parent: "working-with-ai.html" },
  { src: "docs/method/working-with-ai/the-cleanup-comes-later.md", out: "wwa-the-cleanup-comes-later.html", nav: null, group: "About this project", sub: "How it works", parent: "working-with-ai.html" },
  { src: "docs/method/working-with-ai/instructions-that-survive.md", out: "wwa-instructions-that-survive.html", nav: null, group: "About this project", sub: "How it works", parent: "working-with-ai.html" },
  { src: "docs/method/working-with-ai/blast-radius-before-autonomy.md", out: "wwa-blast-radius-before-autonomy.html", nav: null, group: "About this project", sub: "How it works", parent: "working-with-ai.html" },
  { src: "docs/method/working-with-ai/sources.md", out: "wwa-sources.html", nav: null, group: "About this project", sub: "How it works", parent: "working-with-ai.html" },

  { src: "standard/SPEC.md", out: "spec.html", nav: "The spec", group: "About this project", sub: "Reference" },
  { src: "docs/method/checklist.md", out: "checklist.html", nav: "Decision checklist", group: "About this project", sub: "Reference" },
  { src: "docs/faq.md", out: "faq.html", nav: "FAQ", group: "About this project", sub: "Reference" },
  { src: "docs/decision-records/README.md", out: "decision-records.html", nav: "Decision records", group: "About this project", sub: "Decisions and evidence" },
  { src: "docs/open-questions/README.md", out: "open-questions.html", nav: "Open questions", group: "About this project", sub: "Decisions and evidence" },
  { src: "docs/ideas/README.md", out: "ideas.html", nav: "Ideas", group: "About this project", sub: "Decisions and evidence" },
  { src: "docs/case-studies/README.md", out: "case-studies.html", nav: "Case studies", group: "About this project", sub: "Decisions and evidence" },


  { src: "CONTRIBUTING.md", out: "contributing.html", nav: "Want to contribute?", group: "About this project" },

  { src: "docs/file-map.md", out: "file-map.html", nav: "The whole map", group: "File anatomy", render: "tree-root" },
];
// The collections: decision records, case studies, open questions. Each has an index in the
// sidebar and a folder of documents behind it, and those documents are meant to be READ -
// every "the decision behind this" link on a path page points at one. Left out of the map
// they fell through to GitHub, so following a decision meant leaving the docs for a raw file
// in a repository a reader may not even be able to open.
// Discovered rather than listed: a hand-written list of fifty-eight entries is a second
// index that goes stale the first time somebody adds a record.
function collectionPages(dir, prefix, group, parent) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort()
    .map((f) => {
      const slug = slugify(f.replace(/\.md$/, ""));
      // ADR-014-one-authored-tree already says what it is; prefixing it again reads as a
      // stutter in the URL. The prefix exists to keep two collections from colliding, so
      // it is only added when the name does not already carry it.
      const out = slug.startsWith(`${prefix}-`) ? `${slug}.html` : `${prefix}-${slug}.html`;
      return { src: `${dir}/${f}`, out, nav: null, group, parent };
    });
}

// This repo's own capability specs. They are the standard applied to itself, and the only
// buildable specs anybody can read before adopting - which makes them the most convincing
// artifact here and, until now, the least reachable. Discovered rather than listed, for the
// same reason as the collections above.
function ownSpecPages() {
  if (!existsSync("specs")) return [];
  return readdirSync("specs", { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(`specs/${d.name}/spec.md`))
    .map((d) => d.name)
    .sort()
    .map((name) => ({
      src: `specs/${name}/spec.md`,
      out: `ownspec-${slugify(name)}.html`,
      nav: null,
      group: "Getting on the standard", sub: "Decisions and evidence",
      parent: "how-this-repo-works.html",
    }));
}

PAGES.push(
  ...collectionPages("docs/decision-records", "adr", "About this project", "decision-records.html"),
  ...collectionPages("docs/case-studies", "case", "About this project", "case-studies.html"),
  ...collectionPages("docs/open-questions", "oq", "About this project", "open-questions.html"),
  ...collectionPages("docs/ideas", "idea", "About this project", "ideas.html"),
  ...ownSpecPages(),
);
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
  if (page) return BASE + page.out + frag;

  // A tree page has no PAGE MAP entry to match on - every one of them is generated from
  // the manifest and shares its src. Its authored prose does have a file, so one path
  // page links to another by naming that file, which link-check can then verify exists.
  // Writing the generated .html name directly would be a link nothing checks.
  const companion = resolved.match(/^docs\/tree\/(.+)\.md$/);
  if (companion) return `${BASE}tree-${companion[1]}.html${frag}`;

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
      const fenceLang = line.slice(3).trim().toLowerCase();
      i++;
      const codeLines = [];
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing fence (or EOF if unterminated)
      // ```figure is the one way raw HTML reaches a page, and it is deliberately narrow: a
      // named fence, in a file an author wrote, for a diagram markdown cannot express. Every
      // other scrap of HTML in a source file is still escaped, which is the rule that keeps
      // a rendered document from doing something its text does not say.
      if (fenceLang === "figure") {
        out.push(`<figure class="fig">${codeLines.join("\n")}</figure>\n`);
        continue;
      }
      // A block whose lines all start with `>` is not code, it is the sentence you say to
      // the agent. It reads as the most important thing on the page and rendered as the
      // least, indistinguishable from a shell transcript. It gets its own warm block and a
      // copy button, because being pasted is the entire point of it.
      const codeText = codeLines.join("\n");
      const isPrompt =
        codeLines.some((l) => l.trim()) &&
        codeLines.filter((l) => l.trim()).every((l) => l.trimStart().startsWith(">"));
      if (isPrompt) {
        const spoken = codeLines
          .map((l) => l.replace(/^\s*>\s?/, ""))
          .join("\n")
          .trim();
        out.push(
          `<div class="prompt"><button class="prompt-copy" type="button" data-copy="${escapeAttr(spoken)}">Copy</button><pre><code>${escapeHtml(spoken)}</code></pre></div>\n`,
        );
      } else {
        out.push(`<pre><code>${escapeHtml(codeText)}</code></pre>\n`);
      }
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

// A site may re-tint the whole surface without forking the stylesheet: declare `palette`
// in the config and the values land after the defaults, overriding only what is named.
// This is why the accent variables carry role names and a channel triple - a stack whose
// colour is green should not be setting a variable called orange, or left with orange
// edges around a green page.
const PALETTE = CONFIG.palette
  ? `\n:root{\n${Object.entries(CONFIG.palette).map(([k, v]) => `  ${k.startsWith("--") ? k : `--${k}`}: ${v};`).join("\n")}\n}\n`
  : "";

// The header is the ecosystem's, not this page's: the docs and every landing wear the
// same one, differing only in the wordmark's suffix and where the links point. Kept as
// its own string so a landing can be given the identical chrome at build time instead
// of carrying a hand-made copy that drifts one improvement at a time.
// The design tokens. The chrome carries them wherever it goes: a landing has its own
// stylesheet with its own variable names, and the shared header set against undefined
// variables renders a wordmark with no second line and a background with no colour.
const TOKENS_CSS = `
:root {
  /* The header's own height, declared once. The sidebar sticks below it and sizes itself
     against it; hard-coding the number in both places is how the column ends up scrolling
     under the header with its first entries unreachable. */
  --tb-h: 66px;
  --tb-pad: 26px;
  --bg: #08080b;
  --bg-panel: #0c0c11;
  --fg: #f4f2ee;
  /* Body copy sits a step under the heading ink. Same hue, less glare - the difference
     between a page you scan and one you can read for ten minutes. */
  --fg-body: #cbc7d1;
  --muted: #a7a3b2;
  --border: rgba(255,255,255,.08);
  --line: rgba(255,255,255,.08);
  --line2: rgba(255,255,255,.05);
  /* Channels as well as hex: the translucent borders and glows need the same hue, and a
     site that themes the accent must not be left with the old one around its edges. */
  --accent-rgb: 255,122,47;
  --accent-2-rgb: 139,92,246;
  --bg-rgb: 8,8,11;
  --accent: #ff7a2f;
  --accent-soft: #ff9a5c;
  --accent-2: #a884ff;
  --green: #34d399;
  --link: #ff7a2f;
  --link-visited: #ff9a5c;
  --code-bg: rgba(255,255,255,.045);
  /* Masked rather than drawn with borders, so the chevron keeps its shape while its box
     stays big enough to click. Inline, because the site loads no external asset. */
  --chevron: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M3.2 1.4 L6.8 5 L3.2 8.6' fill='none' stroke='black' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  --active-bg: rgba(var(--accent-rgb), .09);
  --active-fg: #ff7a2f;
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Inter, system-ui, sans-serif;
  --font-mono: "SF Mono", ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace;
}
`;

const TOPBAR_CSS = `
.topbar{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px) saturate(140%);
  background:linear-gradient(180deg,rgba(var(--bg-rgb), .82),rgba(var(--bg-rgb), .42));
  border-bottom:1px solid var(--line2)}
.topbar-in{max-width:${SPINE};margin:0 auto;display:flex;align-items:center;gap:18px;
  padding:0 var(--tb-pad);height:var(--tb-h);position:relative}
.tb-brand{display:flex;align-items:center;gap:11px;white-space:nowrap;text-decoration:none}
.tb-mark{height:32px;width:auto;flex:none;display:block}
.tb-word{display:flex;flex-direction:column;line-height:1}
.tb-word b{font-weight:750;font-size:16.5px;letter-spacing:-.025em;color:var(--fg)}
.tb-word i{font-style:normal;font-weight:700;font-size:9.5px;letter-spacing:.34em;
  text-transform:uppercase;margin-top:4px;
  background:linear-gradient(96deg,var(--accent) 4%,var(--accent-soft) 34%,var(--accent-2) 96%);
  -webkit-background-clip:text;background-clip:text;color:transparent}
/* The tracking that makes STANDARDS sit under repository stops working once a suffix
   doubles the line: same spacing, twice the width, and the lockup outgrows the mark. */
.tb-word i.has-suffix{letter-spacing:.19em;font-size:9px}
.tb-tag{font-family:var(--font-mono);font-size:11px;color:var(--accent);
  border:1px solid rgba(var(--accent-rgb), .34);border-radius:999px;padding:2px 8px;letter-spacing:.04em}
.tb-spacer{flex:1}
.tb-links{display:flex;gap:2px;align-items:center}
.tb-links a{color:var(--muted);font-size:14.5px;font-weight:600;padding:8px 11px;
  border-radius:9px;text-decoration:none;white-space:nowrap;transition:color .18s ease,background .18s ease}
.tb-links a:hover,.tb-links a.tb-on{color:var(--fg);background:rgba(255,255,255,.05)}
.tb-links a.tb-gh{display:inline-flex;align-items:center;gap:7px;color:var(--fg);
  background:rgba(255,255,255,.045);border:1px solid var(--border);border-radius:11px;
  padding:8px 12px;margin-left:6px;transition:border-color .18s ease,background .18s ease}
.tb-links a.tb-gh:hover{border-color:rgba(var(--accent-rgb), .5);background:rgba(255,255,255,.07)}
.tb-links a.tb-gh .gh-mark{flex:none}
.tb-switch{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}
.tb-switch>button{display:inline-flex;align-items:center;gap:9px;font-family:var(--font-sans);
  font-size:14px;font-weight:650;color:var(--fg);background:rgba(255,255,255,.045);
  border:1px solid var(--line);border-radius:11px;padding:9px 13px;cursor:pointer;
  transition:border-color .18s ease,background .18s ease}
.tb-switch>button:hover{border-color:rgba(var(--accent-rgb), .5)}
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
`;

const CSS = `
/* The docs wear the landing's header: same mark, same wordmark, same centred ecosystem
   switcher. Only the right-hand link differs - here it points back to the homepage. */
${TOPBAR_CSS}

/* One palette with the landing (site/index.html :root) so the two read as one product.
   Light stays as an explicit user-preference override. */
${TOKENS_CSS}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #ffffff;
    --bg-panel: #f7f7f8;
    --fg: #1a1a1a;
    --fg-body: #35363a;
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
    radial-gradient(circle at 16% -180px, rgba(var(--accent-rgb), .16), transparent 62%),
    radial-gradient(circle at 78% -120px, rgba(var(--accent-2-rgb), .15), transparent 62%);
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
  /* The platform scrollbar is a light-mode widget sitting in a dark column: a bright
     track running the full height, louder than any row it sits beside. Thin, trackless,
     and only visible while the column is actually being used - the sidebar is navigation,
     not a scrolling surface somebody needs a permanent handle on. */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color .2s ease;
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
.nav-tree-link.active {
  color: var(--active-fg); font-weight: 600;
  background: color-mix(in srgb, currentColor 16%, transparent);
}
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

/* A figure-fenced block. It sizes itself to the reading column and keeps its own aspect, so
   a diagram is never the thing that introduces a horizontal scroll. */
.fig { margin: 1.6rem 0 1.9rem; padding: 0; max-width: 100%; }
.fig svg { display: block; width: 100%; height: auto; }
.fig figcaption { margin-top: 0.7rem; font-size: 0.85rem; color: var(--muted); }
/* A timeline figure. Bars and markers read at a glance; the dashed one is the reading that
   contradicts the projection, which is the point of showing both. */
.tl-title { fill: var(--fg); font-size: 14px; font-weight: 650; font-family: var(--font-sans); }
.tl-meta, .tl-tick text, .tl-label, .tl-proj-label { font-family: var(--font-sans); }
.tl-meta { fill: var(--muted); font-size: 11.5px; }
.tl-axis { stroke: var(--line2); stroke-width: 1.5; }
.tl-tick line { stroke: var(--line2); stroke-width: 1.5; }
.tl-tick text { fill: var(--muted); font-size: 10.5px; text-anchor: middle; }
.tl-bar { fill: rgba(255,255,255,.06); stroke: var(--border); }
.tl-done { fill: rgba(52,211,153,.42); }
.tl-label { fill: var(--fg); font-size: 11px; font-weight: 600; }
.tl-proj { fill: rgba(var(--accent-rgb), .28); stroke: rgba(var(--accent-rgb), .6); }
.tl-proj-label { fill: var(--muted); font-size: 11px; }
.tl-now line { stroke: var(--fg); stroke-width: 1.5; stroke-dasharray: 2 3; }
.tl-now text { fill: var(--fg); font-size: 10.5px; font-family: var(--font-sans); }
.tl-target line { stroke: var(--accent, #ff7a2f); stroke-width: 1.5; }
.tl-target circle { fill: var(--accent, #ff7a2f); }
.tl-target text { fill: var(--accent, #ff7a2f); font-size: 10.5px; font-weight: 600; font-family: var(--font-sans); }
.tl-risk line, .tl-risk circle { stroke: #e0685f; fill: none; stroke-width: 1.5; }
.tl-risk text { fill: #e0685f; font-size: 10.5px; font-family: var(--font-sans); }
/* A board or a queue drawn as a figure: cards, a lane rule in the lane's colour, and the
   holder named on every card - an empty one is the gap the file exists to make visible. */
.bd-lane { font-size: 11.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; font-family: var(--font-sans); }
.bd-rule { stroke-width: 2; }
.bd-card { fill: var(--bg-panel); stroke: var(--border); }
.bd-id { font-size: 11px; font-weight: 700; font-family: var(--font-mono); }
.bd-title { fill: var(--fg); font-size: 12px; font-family: var(--font-sans); }
.bd-tag, .bd-who { fill: var(--muted); font-size: 10.5px; font-family: var(--font-sans); }
.bd-size { fill: var(--muted); font-size: 11px; font-weight: 600; font-family: var(--font-mono); text-anchor: end; }
/* Rendered output, framed as what it is: an answer that came back from a session. The bar
   carries the sentence that produced it, so the ask and the answer are one object rather
   than a picture with a caption somewhere above it. */
.win { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: var(--bg-panel); }
.win-bar {
  display: flex; align-items: center; gap: 0.7rem;
  padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--fg) 4%, transparent);
}
.win-dots { display: flex; gap: 5px; flex: none; }
.win-dots i { width: 9px; height: 9px; border-radius: 50%; background: var(--line2); border: 1px solid var(--border); }
.win-ask {
  font-family: var(--font-mono); font-size: 0.78rem; color: var(--muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.win-body { padding: 0.85rem 0.7rem 0.5rem; }
.win-body svg { display: block; width: 100%; height: auto; }
.loop-node { fill: var(--bg); stroke-width: 2.5; }
.loop-label { fill: var(--fg); font-size: 13px; font-weight: 650; font-family: var(--font-sans); }
.loop-sub { fill: var(--muted); font-size: 11px; font-family: var(--font-sans); }
.loop-ring { fill: none; stroke: rgba(255,255,255,.10); stroke-width: 2; }
/* One dot travels the ring so the diagram reads as a cycle rather than as five boxes. */
.loop-dot { fill: var(--accent, #ff7a2f); }
@media (prefers-reduced-motion: reduce) { .loop-dot { display: none; } }
.backlink { margin: 0 0 1.4rem; font-size: 0.875rem; }
.backlink a { color: var(--muted); text-decoration: none; }
.backlink a:hover { color: var(--fg); }
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
/* The pages a reader picks themselves out of. Bold, tinted, and carrying a figure, so the
   eye lands on the group before it reads a single label - and each tint is the one that role
   already wears on the loop, so the sidebar and the diagram agree. */
.nav-role {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--fg);
  font-weight: 650;
  font-size: 0.92rem;
}
.nav-ico { width: 17px; height: 17px; flex: none; opacity: 0.95; }
.nav-role:hover { filter: brightness(1.18); }
/* The row you are on has to stay distinguishable even though every role row is already
   coloured and bold - so being here is a filled chip in the role's own tint, not one more
   shade of the same thing. */
.nav-role.active { border-left-color: currentColor; }
/* A collapsible shelf inside a group: material you look things up in, present without
   burying the pages somebody actually walks through. */
.nav-sub > summary {
  list-style: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: 0.35rem;
  padding: 0.35rem 0.7rem;
  border-left: 1px solid var(--line2);
  color: var(--muted);
  font-size: 0.875rem;
  font-weight: 600;
}
.nav-sub > summary::-webkit-details-marker { display: none; }
.nav-sub > summary::after {
  content: ""; width: 1.1rem; height: 1.1rem; margin-left: auto;
  background-color: var(--muted);
  -webkit-mask: var(--chevron) center / 0.4rem no-repeat;
  mask: var(--chevron) center / 0.4rem no-repeat;
  transform: rotate(0deg); transition: transform 0.15s ease;
}
.nav-sub[open] > summary::after { transform: rotate(90deg); }
.nav-sub > summary:hover { color: var(--fg); }
.nav-sub .nav-link { margin-left: 0.95rem; }
@media (prefers-reduced-motion: reduce) { .nav-sub > summary::after { transition: none; } }
.nav-link:visited { color: var(--muted); }
.nav-link:hover { color: var(--fg); }
/* One "you are here" everywhere: a filled chip in the row's own colour, with the guide rule
   lit to match. It reads at a glance without the eye having to find a second cue, and it is
   the same gesture on a plain row, a role row and a file in the tree - three vocabularies
   for one fact is two too many. */
.nav-link.active {
  color: var(--active-fg);
  font-weight: 600;
  border-left-color: currentColor;
  background: color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0 7px 7px 0;
}
/* The role colours, last and compound on purpose. As a single class they tied with the
   visited and hover rules above, which appear later in this sheet - so a role went grey the
   moment you had visited it once, which is the moment it matters least to be subtle. Two
   classes plus the state beats both, whatever the order. */
.nav-link.nav-role-po, .nav-link.nav-role-po:visited, .nav-link.nav-role-po:hover { color: #c9a86a; }
.nav-link.nav-role-dev, .nav-link.nav-role-dev:visited, .nav-link.nav-role-dev:hover { color: #c9a86a; }
.nav-link.nav-role-lead, .nav-link.nav-role-lead:visited, .nav-link.nav-role-lead:hover { color: #c9a86a; }
.nav-link.nav-role-any, .nav-link.nav-role-any:visited, .nav-link.nav-role-any:hover { color: #c9a86a; }
@media (prefers-color-scheme: light) {
  .nav-link.nav-role-po, .nav-link.nav-role-po:visited, .nav-link.nav-role-po:hover { color: #8a6520; }
  .nav-link.nav-role-dev, .nav-link.nav-role-dev:visited, .nav-link.nav-role-dev:hover { color: #8a6520; }
  .nav-link.nav-role-lead, .nav-link.nav-role-lead:visited, .nav-link.nav-role-lead:hover { color: #8a6520; }
  .nav-link.nav-role-any, .nav-link.nav-role-any:visited, .nav-link.nav-role-any:hover { color: #8a6520; }
}
.content {
  flex: 1 1 auto;
  min-width: 0;
  /* 10px here plus the layout's 16px puts the content's right edge on the header's
     26px gutter, so the page has one right edge from the top bar down. */
  padding: 2.5rem 10px 5rem clamp(1.25rem, 3vw, 2.75rem);
}
.content > :first-child { margin-top: 0; }
/* Long-form reading, not a landing page. Three things do the work and they were all set for
   a short page: body copy one step below the headings rather than the same near-white
   (full-strength white on a dark background glares and flattens the hierarchy, so every
   line arrives with equal weight), a longer line-height, and a shorter measure. Bold and
   headings keep the bright ink, so emphasis still reads as emphasis. */
.prose { max-width: 70ch; margin: 0 auto; color: var(--fg-body); font-size: 1.02rem; line-height: 1.78; }
.prose strong, .prose b { color: var(--fg); font-weight: 650; }
h1, h2, h3, h4, h5, h6 { line-height: 1.3; scroll-margin-top: 1rem; color: var(--fg); }
h1 { font-size: 1.95rem; margin: 0 0 1.4rem; letter-spacing: -0.012em; }
h2 { font-size: 1.42rem; margin: 2.6rem 0 1rem; padding-top: 0.6rem; border-top: 1px solid var(--border); letter-spacing: -0.008em; }
.prose > h2:first-of-type { border-top: none; padding-top: 0; }
h3 { font-size: 1.14rem; margin: 2rem 0 0.7rem; }
h4 { font-size: 1rem; margin: 1.6rem 0 0.5rem; }
p { margin: 0 0 1.15rem; }
ul, ol { margin: 0 0 1.15rem; padding-left: 1.4rem; }
li { margin: 0.4rem 0; }
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
/* What you say to the agent, as opposed to what you run. Warm rather than neutral so the
   eye finds it while skimming, and with a copy button because pasting it is the point. */
.prompt { position: relative; max-width: 76ch; margin: 0 0 1.25rem; }
.prompt pre {
  margin: 0;
  background: rgba(255,176,64,.07);
  border: 1px solid rgba(255,176,64,.28);
  border-left: 3px solid rgba(255,176,64,.75);
  padding-right: 5.2rem;
}
.prompt code { color: var(--fg); }
.prompt-copy {
  position: absolute; top: 0.6rem; right: 0.6rem;
  font: inherit; font-size: 0.75rem; line-height: 1;
  padding: 0.42rem 0.65rem; border-radius: 6px; cursor: pointer;
  color: var(--muted); background: rgba(255,255,255,.04);
  border: 1px solid var(--line2);
}
.prompt-copy:hover { color: var(--fg); border-color: var(--muted); }
.prompt-copy[data-done] { color: var(--green, #34d399); border-color: currentColor; }
@media (prefers-color-scheme: light) {
  .prompt pre { background: rgba(255,150,0,.09); border-color: rgba(200,120,0,.3); }
}
/* A table is not running prose, so it does not want the reading measure. It reclaims the
   content column's spare width, and where it still does not fit, the scroll says so: the
   two gradients are pinned to the wrapper and the two are pinned to the content, so a
   shadow shows on whichever side has more table hiding behind it. An unannounced
   scrollbar in a dark panel is how a table reads as broken rather than as scrollable. */
.table-wrap {
  overflow-x: auto;
  max-width: 100%;
  margin: 0 0 1.25rem;
  background:
    linear-gradient(to right, var(--bg) 30%, transparent) left / 3rem 100% no-repeat local,
    linear-gradient(to left, var(--bg) 30%, transparent) right / 3rem 100% no-repeat local,
    radial-gradient(farthest-side at 0 50%, rgba(0,0,0,.45), transparent) left / 1.1rem 100% no-repeat scroll,
    radial-gradient(farthest-side at 100% 50%, rgba(0,0,0,.45), transparent) right / 1.1rem 100% no-repeat scroll;
}
/* A wide table scrolls inside its wrapper. It used to borrow the right margin as well -
   a negative margin of a fixed size, which assumed this repo's column and this repo's
   window. Anywhere else it ran the last column off the screen, which is worse than a
   scrollbar because nothing tells the reader there is more. The wrapper's fades do. */
table { border-collapse: collapse; width: 100%; font-size: 0.9rem; line-height: 1.5; }
th, td { border: 1px solid var(--border); padding: 0.55rem 0.75rem; text-align: left; vertical-align: top; min-width: 6.5rem; }
/* A first column that is an index or a short key should stay narrow rather than take a
   share it does not need - it is the widest columns that get squeezed when it does not. */
th:first-child, td:first-child { min-width: 0; }
/* A header never wraps, so a column is at least as wide as its own label. Auto-layout
   shares width by cell content, which starved the column whose cells were short and left
   its heading stacked three words tall - the column read as broken while the data was
   fine. Cells still wrap; only the label holds the floor. */
th { background: var(--bg-panel); font-weight: 600; color: var(--fg); white-space: nowrap; }
.page-footer {
  max-width: 76ch;
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
  color: var(--muted);
}
/* The hamburger. Hidden on desktop, where the column is simply there. */
.nav-toggle {
  display: none; flex: none; width: 38px; height: 38px; margin-right: 2px;
  padding: 0 9px; border: 1px solid var(--line2); border-radius: 9px;
  background: transparent; cursor: pointer;
  flex-direction: column; justify-content: center; gap: 5px;
}
.nav-toggle span { display: block; height: 2px; border-radius: 2px; background: var(--fg); transition: transform .2s ease, opacity .2s ease; }
.nav-toggle[aria-expanded=true] span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.nav-toggle[aria-expanded=true] span:nth-child(2) { opacity: 0; }
.nav-toggle[aria-expanded=true] span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
.nav-scrim { display: none; }
@media (max-width: 768px) {
  .nav-toggle { display: flex; }
  /* Off-canvas rather than a wrapped list. Forty rows flattened across the top of every
     page is not navigation, it is an obstacle between the reader and the first paragraph. */
  .layout { flex-direction: column; align-items: stretch; }
  .sidebar {
    position: fixed; z-index: 60; top: var(--tb-h); left: 0; bottom: 0;
    width: min(86vw, 330px); height: auto;
    background: var(--bg); border-right: 1px solid var(--border); border-bottom: 0;
    transform: translateX(-102%); transition: transform .22s ease;
    padding: 1rem 14px 3rem 12px;
  }
  .sidebar.is-open { transform: none; box-shadow: 0 0 60px rgba(0,0,0,.6); }
  .nav-scrim {
    display: block; position: fixed; inset: var(--tb-h) 0 0 0; z-index: 55;
    background: rgba(0,0,0,.55); opacity: 0; pointer-events: none; transition: opacity .22s ease;
  }
  .nav-scrim.is-open { opacity: 1; pointer-events: auto; }
  .sidebar:hover, .sidebar:focus-within { scrollbar-color: var(--line2) transparent; }
/* Safari and Chrome ignore scrollbar-color, so the same two states again in their idiom. */
.sidebar::-webkit-scrollbar { width: 8px; }
.sidebar::-webkit-scrollbar-track { background: transparent; }
.sidebar::-webkit-scrollbar-thumb { background: transparent; border-radius: 999px; border: 2px solid transparent; background-clip: content-box; }
.sidebar:hover::-webkit-scrollbar-thumb, .sidebar:focus-within::-webkit-scrollbar-thumb { background: var(--line2); background-clip: content-box; }
.sidebar::-webkit-scrollbar-thumb:hover { background: var(--border); background-clip: content-box; }

.nav-links { display: block; }
  .nav-group-title { padding-top: 1.1rem; }
  .content { padding: 1.5rem 1.25rem 3rem; }
}
@media (prefers-reduced-motion: reduce) { .sidebar, .nav-scrim, .nav-toggle span { transition: none; } }
`;

// A figure per role, drawn rather than lettered: the sidebar is scanned, and a shape is
// found faster than a word is read. Stroke-only and currentColor, so each inherits the tint
// its row carries and both themes work without a second set.
const ICO = (paths) =>
  `<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ROLE_ICON = {
  // one person, holding a list
  po: ICO('<circle cx="9" cy="7" r="3.2"/><path d="M3.5 20v-1.4A4.1 4.1 0 0 1 7.6 14.5h2.8"/><rect x="14" y="12" width="7" height="9" rx="1.4"/><path d="M16.2 15h2.6M16.2 18h1.6"/>'),
  // one person, at a terminal
  dev: ICO('<circle cx="8.5" cy="6.5" r="3"/><path d="M3.2 20v-1.2a4 4 0 0 1 4-4h2"/><rect x="12" y="11" width="9.5" height="9.5" rx="1.6"/><path d="M14.6 14.6l1.8 1.6-1.8 1.6M18 18.6h1.7"/>'),
  // two people, one leading
  lead: ICO('<circle cx="8" cy="7" r="3.1"/><path d="M2.6 20v-1.5A4.2 4.2 0 0 1 6.8 14.3h2.4a4.2 4.2 0 0 1 4.2 4.2V20"/><circle cx="17.6" cy="8.4" r="2.4"/><path d="M15 20v-1.2a3.4 3.4 0 0 1 3.4-3.4h.6a2.8 2.8 0 0 1 2.4 1.4"/>'),
  // a crowd
  any: ICO('<circle cx="12" cy="7" r="3"/><path d="M6.8 20v-1.3A4 4 0 0 1 10.8 14.7h2.4a4 4 0 0 1 4 4V20"/><path d="M4.6 12.6a2.2 2.2 0 1 1 1.6-3.9M19.4 12.6a2.2 2.2 0 1 0-1.6-3.9M2 19v-.9a3 3 0 0 1 2.6-3M22 19v-.9a3 3 0 0 0-2.6-3"/>'),
};

function buildNavRows() {
  const rows = [];
  let last = null;
  let lastSub = null;
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
      // Close an open shelf before the next group heading. Without this the <details>
      // stayed open across the boundary and swallowed every group after it.
      if (lastSub) rows.push({ type: "sub-close" });
      lastSub = null;
      if (p.group) rows.push({ type: "group", label: p.group });
      last = p.group;
    }
    // A `sub` key nests pages under a collapsible heading inside their group. Material you
    // look things up in rather than read through - the rules, the records, the questions -
    // belongs with the group it serves, but flat it would bury the pages somebody actually
    // walks. Collapsed, it is present and out of the way.
    if (p.sub !== lastSub) {
      // Close the shelf we are leaving before opening the next. Only closing when the new
      // page had no subgroup left two shelves nested inside each other, and everything
      // after them nested inside both.
      if (lastSub) rows.push({ type: "sub-close" });
      if (p.sub) rows.push({ type: "sub-open", label: p.sub });
      lastSub = p.sub ?? null;
    }
    rows.push({ type: "link", page: p });
    if (p.render === "tree-root") rows.push({ type: "tree" });
  }
  if (lastSub) rows.push({ type: "sub-close" });
  return rows;
}

// The sidebar's nested file tree. A folder with children becomes a <details> so the column
// stays scannable, and it renders open when the page you are on IS it or lives inside it.
// That is what makes clicking a folder both open its page and expand it, the way the sites
// this is modelled on behave: the expansion is a consequence of arriving, not a second
// click. Deep links land with their branch already open for the same reason.
// Basenames that appear more than once anywhere in the tree. Computed on first use, since
// TREE is built further down this file, and cached so the label rule does not walk per row.
let _ambiguous = null;
function ambiguousNames() {
  if (_ambiguous) return _ambiguous;
  const seen = new Map();
  const walk = (n) => {
    for (const c of n.children.values()) { seen.set(c.name, (seen.get(c.name) ?? 0) + 1); walk(c); }
  };
  walk(TREE);
  _ambiguous = new Set([...seen].filter(([, n]) => n > 1).map(([name]) => name));
  return _ambiguous;
}

function renderNavTree(node, currentOut, depth = 0) {
  let html = "";
  for (const child of node.children.values()) {
    // Linked when a page exists for it - which is either a manifest entry or authored
    // prose. Keying this on the manifest alone left .claude/ and .github/ expanding with
    // nothing to click even after their pages were written.
    const hasPage = child.entry || existsSync(treeProsePath(child.path));
    const out = hasPage ? treeSlug(child.path) : null;
    const active = out === currentOut;
    // Two different files can share a basename - README.md at the root and in docs/ are
    // both real entries. A row that reads the same as another row is a row you cannot
    // choose, so an ambiguous name carries its parent.
    const bare = `${child.name}${isFolder(child.path) ? "/" : ""}`;
    const label = escapeHtml(ambiguousNames().has(child.name) && child.path.includes("/")
      ? `${child.path.slice(0, child.path.lastIndexOf("/") + 1)}${bare}`
      : bare);
    const link = out
      ? `<a class="nav-tree-link${active ? " active" : ""}" href="${escapeAttr(BASE + out)}"${active ? ' aria-current="page"' : ""}>${label}</a>`
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

// A collapsed subgroup still has to open when the page you are on lives inside it, or a deep
// link lands on a page whose own row is hidden.
// A shelf on the path somebody is walking is open by default - collapsing it hides a step.
// Only the lookup shelves start closed, because those are arrived at deliberately.
const SUB_OPEN = new Set(["Adopting"]);

function subHoldsCurrent(label, currentOut) {
  return PAGES.some((p) => p.sub === label && p.out === currentOut);
}

function renderNav(currentOut) {
  let html = "";
  for (const row of buildNavRows()) {
    if (row.type === "group") {
      html += `<div class="nav-group-title">${escapeHtml(row.label)}</div>\n`;
    } else if (row.type === "sub-open") {
      const holds = subHoldsCurrent(row.label, currentOut) || SUB_OPEN.has(row.label);
      html += `<details class="nav-sub"${holds ? " open" : ""}><summary>${escapeHtml(row.label)}</summary>\n`;
    } else if (row.type === "sub-close") {
      html += `</details>\n`;
    } else if (row.type === "tree") {
      html += `<div class="nav-tree">${renderNavTree(TREE, currentOut)}</div>\n`;
    } else {
      const active = row.page.out === currentOut;
      // A `role` key marks the pages a reader picks themselves out of. They are the point of
      // the section, and as plain rows they read as four items among eight - so each gets a
      // figure and the colour it carries on the loop, and the label goes bold.
      const cls = `nav-link${row.page.role ? ` nav-role nav-role-${row.page.role}` : ""}${active ? " active" : ""}`;
      const ico = row.page.role ? ROLE_ICON[row.page.role] ?? "" : "";
      html += `<a class="${cls}" href="${BASE}${row.page.out}"${active ? ' aria-current="page"' : ""}>${ico}${escapeHtml(row.page.nav)}</a>\n`;
    }
  }
  return html;
}

// One entry in the ecosystem switcher. A same-domain entry is a normal link; an off-domain
// one opens in a new tab. The entry for the site you are already on stays a link - clicking
// it lands on the docs home, which is a reasonable thing to want - and carries the "here" tag.
function ecoEntry(url, name, blurb) {
  const here = isHere(url);
  const offsite = /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
  const attrs = offsite ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `<a role="menuitem" href="${escapeAttr(url)}"${attrs}><span>${escapeHtml(name)}<small>${escapeHtml(blurb)}</small></span>${here ? '<span class="now">here</span>' : ""}</a>`;
}

// The header, for any surface in the ecosystem. `drawer` adds the sidebar toggle, which
// only the docs have; everything else is identical by construction rather than by anyone
// remembering to copy an improvement across.
// The background belongs to the chrome as much as the header does - it is what makes a
// surface recognisable before a word is read. Its hue comes from the palette, so a
// stack's atmosphere is its own colour without anyone editing a gradient.
const ATMOS_CSS = `
  .atmos{position:absolute;top:0;left:0;width:100%;height:960px;z-index:0;pointer-events:none;overflow:hidden}
  .atmos .glow{position:absolute;border-radius:50%;filter:blur(20px)}
  .atmos .g1{top:-260px;left:16%;width:1100px;height:900px;transform:translateX(-50%);
    background:radial-gradient(circle at center, rgba(var(--accent-rgb), .16), transparent 62%);
    animation:drift1 22s ease-in-out infinite alternate}
  .atmos .g2{top:-200px;left:78%;width:1100px;height:900px;transform:translateX(-50%);
    background:radial-gradient(circle at center, rgba(var(--accent-2-rgb), .15), transparent 62%);
    animation:drift2 26s ease-in-out infinite alternate}
  .atmos .g3{top:180px;left:50%;width:900px;height:700px;transform:translateX(-50%);
    background:radial-gradient(circle at center, rgba(var(--accent-2-rgb), .08), transparent 60%);
    animation:drift3 30s ease-in-out infinite alternate}
  .grain{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.04;mix-blend-mode:soft-light;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")}
  @keyframes drift1{from{transform:translate(-50%,0) scale(1)}to{transform:translate(-46%,3vh) scale(1.08)}}
  @keyframes drift2{from{transform:translate(-42%,0) scale(1)}to{transform:translate(-48%,4vh) scale(1.12)}}
  @keyframes drift3{from{transform:translate(-50%,0) scale(1)}to{transform:translate(-54%,-3vh) scale(1.1)}}
  @media (prefers-reduced-motion: reduce){.atmos .glow{animation:none}}
`;
const ATMOS_HTML = `<div class="atmos" aria-hidden="true">\n  <div class="glow g1"></div><div class="glow g2"></div><div class="glow g3"></div>\n</div>\n<div class="grain" aria-hidden="true"></div>`;

// The switcher's behaviour travels with its markup - a landing that got the header without
// the handler would have a control that opens nothing, which is the defect site-behaviour
// was written to catch on the docs.
const SWITCHER_JS = `
(function(){
  var eco=document.getElementById("ecoswitch"),ecb=document.getElementById("ecobtn");
  if(!eco||!ecb) return;
  ecb.addEventListener("click",function(){var o=eco.hasAttribute("data-open");eco.toggleAttribute("data-open");ecb.setAttribute("aria-expanded",String(!o));});
  document.addEventListener("click",function(e){if(!eco.contains(e.target)){eco.removeAttribute("data-open");ecb.setAttribute("aria-expanded","false");}});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"){eco.removeAttribute("data-open");ecb.setAttribute("aria-expanded","false");}});
})();
`;

function topbarHtml({ drawer = false, awayLabel = "Homepage", awayHref = SITE_ROOT } = {}) {
  return `<header class="topbar"><div class="topbar-in">
${drawer ? `<button class="nav-toggle" type="button" aria-label="Open the navigation" aria-expanded="false" aria-controls="docs-nav"><span></span><span></span><span></span></button>` : ""}
<a class="tb-brand" href="${SITE_ROOT}"><img class="tb-mark" src="${SITE_ROOT}logo-mark.png" alt="" width="428" height="512"><span class="tb-word"><b>repository</b><i${WORDMARK_SUFFIX ? ' class="has-suffix"' : ""}>Standards${WORDMARK_SUFFIX ? ` + ${escapeHtml(WORDMARK_SUFFIX)}` : ""}</i></span></a>
${VERSION ? `<span class="tb-tag">v${escapeHtml(VERSION)}</span>` : ""}
<span class="tb-spacer"></span>
<nav class="tb-links"><a href="${awayHref}">${awayLabel}</a><a class="tb-gh" href="${escapeAttr(GITHUB_REPO_URL)}" target="_blank" rel="noopener noreferrer"><svg class="gh-mark" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>GitHub</a></nav>
<div class="tb-switch" id="ecoswitch">
<button type="button" aria-haspopup="true" aria-expanded="false" id="ecobtn"><span class="pip"></span> Repository Standards <span class="chev">&#9662;</span></button>
<div class="tb-menu" role="menu" aria-label="Ecosystem">
<div class="grp">Core</div>
${ecoEntry(CORE_URL, "Repository Standards", "the method - align, verify, drift 0")}
<div class="div"></div>
<div class="grp">Best practices</div>
${ecoEntry(NODE_URL, "Node", "Next.js + Fastify - starter, decisions, adapting guide")}
</div>
</div>
</div></header>`;
}

function renderPage(page, contentHtml) {
  // A page with no sidebar label still needs a browser-tab title, and the document already
  // states one: its own H1. Taking it from the rendered content rather than the page map
  // means the two cannot disagree.
  const h1 = contentHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title = escapeHtml(page.nav ?? (h1 ? h1[1].replace(/<[^>]+>/g, "").trim() : page.out));
  const sourceUrl = `${GITHUB_REPO_URL}/blob/main/${page.src}`;
  const firstPara = contentHtml.match(/<p>([\s\S]*?)<\/p>/);
  // Cut on a word, not on a character: a preview card ending mid-word reads as broken
  // rather than as truncated, and the reader blames the site instead of the length.
  const blurb = (() => {
    if (!firstPara) return "";
    const text = firstPara[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text.length <= 200) return text;
    const cut = text.slice(0, 200);
    return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "...";
  })();
  const preview = SITE_URL
    ? [
        `<meta property="og:type" content="article">`,
        `<meta property="og:site_name" content="${escapeAttr(BRAND)}">`,
        `<meta property="og:title" content="${escapeAttr(title)}">`,
        blurb ? `<meta property="og:description" content="${escapeAttr(blurb)}">` : "",
        `<meta property="og:url" content="${SITE_URL}${BASE}${page.out}">`,
        `<meta property="og:image" content="${SITE_URL}${OG_IMAGE}">`,
        `<meta property="og:image:width" content="1200">`,
        `<meta property="og:image:height" content="630">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        blurb ? `<meta name="description" content="${escapeAttr(blurb)}">` : "",
      ].filter(Boolean).join("\n")
    : "";
  const hasMarkdown = existsSync(page.render === "file" ? treeProsePath(page.node.path) : page.src);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} - ${escapeHtml(BRAND)} docs</title>
${preview}
<style>${CSS}${PALETTE}</style>
</head>
<body>
${topbarHtml({ drawer: true })}
<div class="layout">
<nav class="sidebar" aria-label="Documentation">
<div class="nav-links" id="docs-nav">
${renderNav(page.out)}</div>
${
  SIDEBAR_LINKS.length
    ? `<div class="nav-foot">
${SIDEBAR_LINKS.map((l) => `<a class="nav-link" href="${escapeAttr(l.href)}"${l.external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(l.label)}</a>`).join("\n")}
</div>`
    : ""
}
</nav>
<div class="nav-scrim" hidden></div>
<main class="content">
<div class="prose">
${
  // A page with no sidebar row has no highlighted position to navigate back from - open a
  // decision record and the list you came from is gone. The link back is the whole
  // orientation such a page gets, so it goes above the title rather than under the fold.
  page.parent
    ? `<p class="backlink"><a href="${escapeAttr(BASE + page.parent)}">&larr; ${escapeHtml(PAGES.find((p) => p.out === page.parent)?.nav ?? "Back")}</a></p>\n`
    : ""
}${contentHtml}
<p class="page-footer">${
  // The markdown twin is only written for a page that has a markdown source. Offering it
  // unconditionally left one page pointing at a file that was never generated - which is
  // exactly the kind of link nobody clicks until a reader does.
  hasMarkdown ? `Read this page's <a href="${escapeAttr(BASE + page.out.replace(/\.html$/, ".md"))}">markdown</a>, or its ` : "Read the "
}<a href="${escapeAttr(sourceUrl)}" target="_blank" rel="noopener noreferrer">source on GitHub</a>.</p>
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
  // Keyed per site: every surface on this domain shares an origin, so one key meant the
  // core's sidebar - long enough to scroll a long way - handed its position to a stack's,
  // which is short. The top entries scrolled out of a column that had no reason to move.
  var KEY="docs-nav-scroll:"+location.pathname.replace(/[^/]*$/,"");
  try{
    // Nothing to restore on a column that fits. Setting scrollTop on it is how Quick start
    // disappeared from a menu of eight.
    if(sb.scrollHeight<=sb.clientHeight+4) return;
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
// The mobile drawer. Opens from the hamburger, closes on the scrim, on Escape, and on any
// link - a menu that stays open over the page you just chose is a menu you close twice.
(function(){
  var btn=document.querySelector(".nav-toggle"), sb=document.querySelector(".sidebar"), sc=document.querySelector(".nav-scrim");
  if(!btn||!sb||!sc)return;
  sc.removeAttribute("hidden");
  function set(open){
    sb.classList.toggle("is-open",open);
    sc.classList.toggle("is-open",open);
    btn.setAttribute("aria-expanded",open?"true":"false");
    document.body.style.overflow=open?"hidden":"";
  }
  btn.addEventListener("click",function(){ set(btn.getAttribute("aria-expanded")!=="true"); });
  sc.addEventListener("click",function(){ set(false); });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape") set(false); });
  sb.addEventListener("click",function(e){ if(e.target.closest("a")) set(false); });
  // Resizing past the breakpoint leaves the drawer state stale; the column is just there again.
  addEventListener("resize",function(){ if(innerWidth>768) set(false); });
})();
// One handler for every copy button, delegated - the prompt is what a reader came to paste.
document.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest(".prompt-copy");
  if(!b)return;
  var t=b.getAttribute("data-copy")||"";
  var done=function(){b.setAttribute("data-done","1");b.textContent="Copied";
    setTimeout(function(){b.removeAttribute("data-done");b.textContent="Copy";},1600);};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){});return;}
  var ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();
  try{document.execCommand("copy");done();}catch(err){}
  document.body.removeChild(ta);
});
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
<p class="fm-note"><a href="${BASE}spec.html">${more ? "Read this rule in full" : "See it in the spec"}</a></p>`;
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
          ? `<li><a href="${escapeAttr(BASE + treeSlug(c.path))}">${label}</a> - ${escapeHtml(c.entry.purpose)}</li>`
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
        ? `<li><a href="${escapeAttr(BASE + treeSlug(c.path))}">${label}</a> - ${escapeHtml(c.entry.purpose)}</li>`
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

  // Every page ships its markdown beside its HTML, at the same name with the extension
  // swapped. An agent that lands on a page can drop `.html` for `.md` and read the source
  // instead of parsing a layout - no scraping, no separate index to keep in step. Markdown
  // rather than JSON on purpose: it is what the models read best, and wrapping prose in
  // JSON adds escaping and takes nothing away.
  const corpus = [];
  for (const page of PAGES) {
    const contentHtml =
      page.render === "file"
        ? renderTreeFilePage(page)
        : // `also` appends further sources to the same page. Two documents that a reader
          // walks in one sitting should be one page; keeping them as two files matters only
          // because each is adopted by reference and named from a repo we cannot edit.
          [page.src, ...(page.also ?? [])]
            .map((src, i) => {
              const html = mdToHtml(readFileSync(src, "utf8"), { srcDir: dirnamePosix(src) });
              // An appended document's own title becomes a section of the page it joined.
              // Two h1s is two pages pretending to be one.
              return i === 0 ? html : html.replace(/^<h1([^>]*)>([\s\S]*?)<\/h1>/, "<h2$1>$2</h2>");
            })
            .join("\n");
    writeFileSync(`${OUT_DIR}/${page.out}`, renderPage(page, contentHtml));
    console.log(`  wrote  ${OUT_DIR}/${page.out}  (from ${page.src})`);

    // A tree page's substance is its authored prose; the rest of it is manifest facts,
    // which a machine reader should take from the manifest itself rather than from prose
    // about the manifest.
    const mdSrc = page.render === "file" ? treeProsePath(page.node.path) : page.src;
    if (!existsSync(mdSrc)) continue;
    const md = readFileSync(mdSrc, "utf8");
    const outMd = page.out.replace(/\.html$/, ".md");
    writeFileSync(`${OUT_DIR}/${outMd}`, md);
    corpus.push(`# ${page.nav ?? page.out.replace(/\.html$/, "")}\n\nSource: ${mdSrc}\n\n${md}`);
  }

  // One fetch for the whole corpus, for a reader that would otherwise make thirty.
  writeFileSync(`${OUT_DIR}/llms-full.txt`, corpus.join("\n\n---\n\n"));
  console.log(`  wrote  ${OUT_DIR}/llms-full.txt  (${corpus.length} documents)`);

  // llms.txt belongs at the site root, and only site/ is deployed - so a copy that lives
  // in the repo root is a file nothing serves.
  if (existsSync("llms.txt")) {
    writeFileSync(`${SITE_DIR}/llms.txt`, readFileSync("llms.txt", "utf8"));
    console.log(`  wrote  ${SITE_DIR}/llms.txt  (from the repo root)`);
  }

  writeFileSync(`${OUT_DIR}/README.md`, SITE_README);
  console.log(`  wrote  ${OUT_DIR}/README.md`);

  // A landing that marks the spot gets the ecosystem's header written into it. This is the
  // whole reason the header was extracted: the docs and the landings had drifted apart one
  // improvement at a time - a switcher pointing at a code host, a button styled differently,
  // a version tag in the wrong grid cell - and every one of those was found by a reader
  // rather than by a check. Now there is one header and the landing cannot hold a stale copy.
  if (existsSync(LANDING_PATH)) {
    const landing = readFileSync(LANDING_PATH, "utf8");
    const START = "<!--topbar:start-->";
    const END = "<!--topbar:end-->";
    const from = landing.indexOf(START);
    const to = landing.indexOf(END);
    if (from >= 0 && to > from) {
      const chrome = `${START}\n<style>${TOKENS_CSS}${PALETTE}\n${TOPBAR_CSS}\n${ATMOS_CSS}</style>\n${ATMOS_HTML}\n${topbarHtml({ awayLabel: "Docs", awayHref: BASE })}\n<script>${SWITCHER_JS}</script>\n${END}`;
      const next = landing.slice(0, from) + chrome + landing.slice(to + END.length);
      if (next !== landing) {
        writeFileSync(LANDING_PATH, next);
        console.log(`  wrote  ${LANDING_PATH}  (the shared header)`);
      }
    }
  }

  console.log(`\ndocsite: generated ${PAGES.length} page(s) + README into ${OUT_DIR}/\n`);
  process.exit(0);
}

// Importers (site-check) want PAGES, not a generation run.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
