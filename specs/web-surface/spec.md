# Web surface

**Spec tier:** buildable
**Serves:** `Standard-bearer Staszek` - evaluates the standard from the landing and docs before pointing an agent at it; `Owner Olek` - a public, readable surface is half his trust story.
**Status:** live
**Success metric:** Reach - the human surfaces are how the standard gets found and judged.

## Purpose

One source, two surfaces: [`tools/docsite.mjs`](../../tools/docsite.mjs) renders a curated set of the repo's own markdown into a static docs site; [`tools/site-check.mjs`](../../tools/site-check.mjs) gates the landing (`site/index.html`) and that generated site as shippable. Nothing is authored twice.

## Scope

The docsite generator, the site-check gate, and the `site/` directory they operate on. Repo-own tooling - never shipped.

## Out of scope

The prose of the rendered pages (owned by their source files); markdown link integrity repo-wide ([tree-guard](../tree-guard/spec.md)).

## Core concepts

- **PAGE MAP** - the ordered list defining the site; each entry is `{ src, out, nav, group }` (source md path, output html name, sidebar label, group heading or null). `README.md -> index.html` is first and `standard/SPEC.md -> spec.html` second; `group: null` renders flat, a string groups consecutive entries under one heading. The default map lives in `tools/docsite.mjs` (14 entries today); a `site.config.json` `pages` array overrides it wholesale.
- **SITE CONFIG** - an optional `site.config.json` at the repo root makes the generator serve any ecosystem repo ("one form, many sites"): `brand` (page titles + sidebar brand), `repo_url` (GitHub fallback links + page footers), `out_dir`, `topbar` (label/href/on/external), `pages` (replaces the PAGE MAP), `sidebar_links` (the sidebar footer links). Every field falls back to the core repo's defaults.
- **OUT_DIR** - `site/docs` by default (config `out_dir` overrides), wiped and regenerated on every run; generated and gitignored, never hand-edited.
- **Positioning one-liner** - the blockquote under `## The one-liner` in `docs/positioning.md`; surfaces quote it, never re-phrase.

## Interface contracts

`node tools/docsite.mjs` - repo root, no flags, no dependencies. For each PAGE MAP entry: read `src`, render markdown to HTML (headings with slugified ids, GFM tables, nested lists, fenced code escaped verbatim), wrap in the shared shell (topbar from config, sidebar nav from the PAGE MAP, active page marked, sidebar footer links from config, `<title><nav> - <brand> docs</title>`), write `OUT_DIR/<out>`. Also writes `OUT_DIR/README.md` declaring the folder generated (naming the core repo's generator by URL - the file must make sense inside a satellite repo too). Every page ends with the generated footer: `Generated from <src> (linked to its GitHub blob) by tools/docsite.mjs - edit the source there, not this HTML.`

**Link resolution** (every relative href in a rendered page): absolute (`scheme://`), `mailto:` and pure `#` hrefs pass through; otherwise resolve the target against the source file's directory (handling `.` and `..`), then

1. a PAGE MAP hit by resolved `src` rewrites to that page's `.html` (fragment preserved);
2. anything else rewrites to GitHub: `https://github.com/bodurkalukasz/repository-standards/blob/main/<path>` for files, `/tree/main/<path>` for directories (trailing-slash targets).

`node tools/site-check.mjs` - repo root, no flags. Landing checks (`site/index.html`): HTML tag balance (void elements, comments, script/style bodies skipped); em/en dash ban (a regex character class of U+2013 and U+2014, matched anywhere in the file); the positioning one-liner must appear **verbatim** - the check re-derives it mechanically by taking `docs/positioning.md`, splitting on `## The one-liner`, keeping the `> `-prefixed lines of that section, stripping the `> ` and joining with single spaces; external hosts limited to `github.com` and `*.github.com`; the landing MUST advertise `v<VERSION>` (read from the `VERSION` file). Docsite checks (`site/docs/*.html`): the html page count MUST equal the PAGE MAP length, derived at check time (config `pages` length when present, else the default map parsed out of `tools/docsite.mjs`) - never a hand-written number; per page - dash ban, no leaked `|---` or triple-backtick fence, every internal `.html` href resolves to a generated page; `index.html` must contain the dark palette ink `#0D0E11`.

### Exit codes

| Tool | Exit | Condition |
|---|---|---|
| docsite | 0 | every PAGE MAP page generated |
| docsite | 1 | a PAGE MAP `src` is missing (nothing written) |
| site-check | 0 | landing + docsite pass every check |
| site-check | 1 | any failure; verdict `site-check: FAIL - <n> problem(s)` |

## Requirements

- Both tools MUST be dependency-free (Node built-ins only).
- The docsite MUST render the same markdown an agent reads, verbatim - it contributes navigation and layout, never prose; each page's H1 comes from the source file.
- Raw HTML in source markdown MUST be escaped, and inline code spans MUST be immune to link/emphasis rewriting.
- The site MUST be dark by default with a light `prefers-color-scheme` override, and usable at mobile widths.

## Invariants

- Every internal `.html` link in a generated page MUST resolve to a generated page.
- The landing MUST contain the positioning one-liner byte-for-byte.
- No authored surface MUST contain an em or en dash.
- No non-GitHub external host MUST appear on the landing.

## Acceptance criteria

- **Page-map link.** GIVEN `standard/docs/adoption.md` links `../SPEC.md` and `standard/SPEC.md` is in the PAGE MAP WHEN docsite renders THEN the href becomes `spec.html`.
- **GitHub fallback.** GIVEN a page links `../scripts/self-verify.mjs` (not in the PAGE MAP) WHEN rendered THEN the href becomes the GitHub `blob/main` URL for the resolved path; a `dir/` target gets `tree/main`.
- **Broken internal link.** GIVEN a generated page hrefs `nope.html` and `site/docs/nope.html` does not exist WHEN site-check runs THEN it FAILs naming page and target, exit 1.
- **Re-phrased one-liner.** GIVEN the landing paraphrases the one-liner WHEN site-check runs THEN the verbatim check FAILs and exits 1.
- **Dash ban.** GIVEN an em dash anywhere in `site/index.html` WHEN site-check runs THEN it FAILs with the offset and surrounding text.
- **Foreign host.** GIVEN the landing links `https://example.com` WHEN site-check runs THEN it FAILs `unexpected external host example.com`.
- **Markdown leak.** GIVEN a generated page contains `|---` WHEN site-check runs THEN it FAILs (raw table separator leaked).
- **Palette.** GIVEN `site/docs/index.html` lacks `#0D0E11` WHEN site-check runs THEN it FAILs (dark-first palette missing).

## Acceptance criteria (config)

- **Page count derived.** GIVEN the PAGE MAP gains an entry and the site is regenerated WHEN site-check runs THEN it passes with the new count - no check-side edit needed; GIVEN a generated page is deleted THEN site-check FAILs on the count mismatch.
- **Stale landing version.** GIVEN `VERSION` moves and the landing still advertises the old `vX.Y.Z` WHEN site-check runs THEN it FAILs.
- **Brand follows config.** GIVEN a `site.config.json` with `brand: "x"` WHEN docsite renders THEN page titles end `- x docs` and the sidebar brand reads `x`.
