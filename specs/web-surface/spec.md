# Web surface

**Spec tier:** buildable
**Serves:** `Standard-bearer Staszek` - evaluates the standard from the landing and docs before pointing an agent at it; `Owner Olek` - a public, readable surface is half his trust story.
**Status:** live
**Success metric:** Reach - the human surfaces are how the standard gets found and judged.

## Purpose

One source, two surfaces: [`tools/docsite.mjs`](../../tools/docsite.mjs) renders a curated set of the repo's own markdown into a static docs site; [`tools/site-check.mjs`](../../tools/site-check.mjs) gates the landing (`site/index.html`) and that generated site as shippable. Nothing is authored twice.

## Scope

The docsite generator, the site-check gate, and the `site/` directory they operate on. Repo-own tooling - never shipped.

The landing's hero is an animated agent-session window (the ask typed, the align played out, looped; rendered statically under `prefers-reduced-motion`). `site/previous.html` is a frozen snapshot of the prior landing, kept while the final landing template is being chosen - deployed as-is and deliberately outside site-check's landing checks, which gate `site/index.html` only.

## Out of scope

The prose of the rendered pages (owned by their source files); markdown link integrity repo-wide ([tree-guard](../tree-guard/spec.md)).

## Core concepts

- **PAGE MAP** - the ordered list defining the site; each entry is `{ src, out, nav, group }` (source md path, output html name, sidebar label, group heading or null). `README.md -> index.html` is first and `standard/SPEC.md -> spec.html` second; `group: null` renders flat, a string groups consecutive entries under one heading. The default map lives in `tools/docsite.mjs` and is the only statement of its own length - the count is derived wherever it is needed, never restated here; a `site/site.config.json` `pages` array overrides it wholesale.
- **SITE CONFIG** - an optional `site/site.config.json` (the repo root is accepted as a legacy location) makes the generator serve any ecosystem repo ("one form, many sites"): `brand` (page titles + sidebar brand), `repo_url` (GitHub fallback links + page footers), `out_dir`, `topbar` (label/href/on/external), `pages` (replaces the PAGE MAP), `sidebar_links` (the sidebar footer links). Every field falls back to the core repo's defaults.
- **OUT_DIR** - `site/docs` by default (config `out_dir` overrides), wiped and regenerated on every run; generated and gitignored, never hand-edited.
- **Positioning one-liner** - the blockquote under `## The one-liner` in `docs/positioning.md`; surfaces quote it, never re-phrase.
- **FILE MAP** - `docs/file-map.md`, rendered from `standard/standard.manifest.json` by `tools/file-map.mjs`: one row per shipped entry with its purpose, required-ness and profile, adapt class and the rule it enforces, plus the by-reference documents and the required headings. It is a PAGE MAP entry like any other and, unlike any other, it is **generated** - `tools/file-map.mjs --check` compares the committed file against a fresh render and fails CI when the manifest has moved and the map has not. Hand-editing it is the failure that check exists to catch, because the map's whole claim is that it cannot disagree with what `self-verify` reads.
- **A page's `src` follows its document.** Moving a source file moves its PAGE MAP entry - `self-verify.md` left `standard/docs/` for `docs/method/` when it stopped being copied into adopters' repositories, and the entry moved with it. A `src` pointing at a moved file is caught by the generated-page count being derived from the map rather than written down.

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
- **The landing MUST carry the same maturity disclosure as the other entry surfaces.** Whatever the README, the FAQ and `llms.txt` say about release tags, adopters and registered stacks, the landing says too. It is the surface a first-time reader is most likely to see and least likely to leave, so it cannot be the one where the limits are softest - and a disclosure that varies by surface is not a disclosure, it is a choice about who gets told.
- **The landing MUST NOT state as fact anything the repo cannot back.** Counts derivable from a source are named, not numbered ("the rules", never "20 rules" - `tree-check` enforces this and strips markup first, so a tag between the digits and the word does not hide it). Sample terminal output MUST reproduce what the shipped tools actually print, or be marked illustrative; a fabricated check count reads as evidence. Capability claims name their cost where one exists - the guards need Node and `jq`, and a non-Claude agent needs the skills ported - so "nothing to install" is not available to us.

## Invariants

- Every internal `.html` link in a generated page MUST resolve to a generated page.
- The landing MUST contain the positioning one-liner byte-for-byte.
- **A `$` prompt on the landing MUST introduce something a shell can run.** What you say to an
  agent is prefixed `>` instead. The page mixed the two - `$ scaffold from
  repository-standards` and `$ assess -> align -> onboard` are sentences and phase lists, not
  commands, and a reader who pasted either into a terminal got `command not found` while the
  terminal block twenty lines below used the convention correctly. **Not script-enforced**:
  `site-check` cannot tell a real command from a plausible one, so this is a review rule, and it
  is written here because the page has already broken it once.
- The landing MUST advertise the standard's current version (the badge and footer) and MUST NOT
  present that version as something an adopter pins to or requests: no `@<version>` in a
  quickstart command, no `--version` in the shown invocation, and no dependency-bump analogy for
  updating. Latest is the only target ([ADR-025](../../docs/decision-records/ADR-025-the-standard-is-living-latest-is-the-target.md));
  the version is a fact about the standard, not an instruction to the reader. **Not
  script-enforced** - `site-check` asserts the badge is present and cannot judge copy, so this is
  a review rule and is written here rather than implied. It is recorded because the landing did
  teach pinning, in four places, for as long as the decision had been in force.
- No authored surface MUST contain an em or en dash.
- No non-GitHub external host MUST appear on the landing.

## Acceptance criteria

- **Page-map link.** GIVEN `docs/method/taxonomy.md` links `checklist.md` and `docs/method/checklist.md` is in the PAGE MAP WHEN docsite renders THEN the href becomes `checklist.html`.
- **GitHub fallback.** GIVEN a page links `../scripts/self-verify.mjs` (not in the PAGE MAP) WHEN rendered THEN the href becomes the GitHub `blob/main` URL for the resolved path; a `dir/` target gets `tree/main`.
- **Broken internal link.** GIVEN a generated page hrefs `nope.html` and `site/docs/nope.html` does not exist WHEN site-check runs THEN it FAILs naming page and target, exit 1.
- **Re-phrased one-liner.** GIVEN the landing paraphrases the one-liner WHEN site-check runs THEN the verbatim check FAILs and exits 1.
- **A stale file map fails.** GIVEN a manifest entry whose purpose changed and a `docs/file-map.md` that still carries the old text WHEN `tools/file-map.mjs --check` runs THEN it exits 1 naming the file, so the map cannot describe a tree that has moved on.
- **A regenerated map is byte-identical.** GIVEN an unchanged manifest WHEN the map is rendered twice THEN the output is identical - the render carries no timestamp or ordering that would produce a diff on every run and train reviewers to ignore it.
- **Dash ban.** GIVEN an em dash anywhere in `site/index.html` WHEN site-check runs THEN it FAILs with the offset and surrounding text.
- **Foreign host.** GIVEN the landing links `https://example.com` WHEN site-check runs THEN it FAILs `unexpected external host example.com`.
- **Markdown leak.** GIVEN a generated page contains `|---` WHEN site-check runs THEN it FAILs (raw table separator leaked).
- **Palette.** GIVEN `site/docs/index.html` lacks `#0D0E11` WHEN site-check runs THEN it FAILs (dark-first palette missing).

## Acceptance criteria (config)

- **Page count derived.** GIVEN the PAGE MAP gains an entry and the site is regenerated WHEN site-check runs THEN it passes with the new count - no check-side edit needed; GIVEN a generated page is deleted THEN site-check FAILs on the count mismatch.
- **Stale landing version.** GIVEN `VERSION` moves and the landing still advertises the old `vX.Y.Z` WHEN site-check runs THEN it FAILs.
- **Brand follows config.** GIVEN a `site/site.config.json` with `brand: "x"` WHEN docsite renders THEN page titles end `- x docs` and the sidebar brand reads `x`.
- **Legacy location still resolves.** GIVEN no `site/site.config.json` but a `site.config.json` at the repo root WHEN docsite runs THEN it is read - moving the file must not silently drop an ecosystem repo back to the core defaults.
