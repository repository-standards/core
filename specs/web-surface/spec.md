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

- **PAGE MAP** - the ordered list defining the site; each entry is `{ src, out, nav, group }` (source md path, output html name, sidebar label, group heading or null). The order is what a reader is trying to DO - start, work, understand, look up - not what the repo contains: the site's front page is first and the quick start second, and the spec sits in Reference. `group: null` renders flat, a string groups consecutive entries under one heading. The repo's `README.md` is deliberately NOT in the map: it is the GitHub front door, and serving it as the docs home put the same "why it exists" argument on two pages of one site. The default map lives in `tools/docsite.mjs` and is the only statement of its own length - the count is derived wherever it is needed, never restated here; a `site/site.config.json` `pages` array overrides it wholesale.
- **SITE CONFIG** - an optional `site/site.config.json` (the repo root is accepted as a legacy location) makes the generator serve any ecosystem repo ("one form, many sites"): `brand` (page titles), `repo_url` (GitHub fallback links + page footers), `out_dir`, `node_stack_url` (where the ecosystem switcher's stack entry points), `landing` (the landing whose spine and ink the docs adopt), `pages` (replaces the PAGE MAP), `sidebar_links` (sidebar footer links, empty by default because the top bar already carries every destination). Every field falls back to the core repo's defaults. A `topbar` array written for the previous, config-drawn header is still read for its external entry, so an older config resolves rather than breaking, but it no longer draws anything.
- **OUT_DIR** - `site/docs` by default (config `out_dir` overrides), wiped and regenerated on every run; generated and gitignored, never hand-edited.
- **CNAME** - `site/CNAME`, the apex the deploy is served under. It lives beside the landing, inside the directory the deploy uploads, so the domain is something the repository ships rather than a setting someone configured by hand and has to remember. GitHub Pages reads it from the published artifact and moves the domain to whichever repository published last, which makes a second copy a race rather than a redundancy - see the invariant below.
- **Positioning one-liner** - the blockquote under `## The one-liner` in `docs/positioning.md`; surfaces quote it, never re-phrase.
- **FILE MAP** - `docs/file-map.md`, rendered from `standard/standard.manifest.json` by `tools/file-map.mjs`: one row per shipped entry with its purpose, required-ness and profile, adapt class and the rule it enforces, plus the by-reference documents and the required headings. It is a PAGE MAP entry like any other and, unlike any other, it is **generated** - `tools/file-map.mjs --check` compares the committed file against a fresh render and fails CI when the manifest has moved and the map has not. Hand-editing it is the failure that check exists to catch, because the map's whole claim is that it cannot disagree with what `self-verify` reads.
- **A page's `src` follows its document.** Moving a source file moves its PAGE MAP entry - `self-verify.md` left `standard/docs/` for `docs/method/` when it stopped being copied into adopters' repositories, and the entry moved with it. A `src` pointing at a moved file is caught by the generated-page count being derived from the map rather than written down.

## Interface contracts

`node tools/docsite.mjs` - repo root, no flags, no dependencies. For each PAGE MAP entry: read `src`, render markdown to HTML (headings with slugified ids, GFM tables, nested lists, fenced code escaped verbatim), wrap in the shared shell (the fixed top bar - mark, wordmark, version pill read from `VERSION`, centred ecosystem switcher, one link home; sidebar nav from the PAGE MAP, active page marked; sidebar footer links from config; `<title><nav> - <brand> docs</title>`), write `OUT_DIR/<out>`. Also writes `OUT_DIR/README.md` declaring the folder generated (naming the core repo's generator by URL - the file must make sense inside a satellite repo too). Every page ends with the generated footer: `Generated from <src> (linked to its GitHub blob) by tools/docsite.mjs - edit the source there, not this HTML.`

**Link resolution** (every relative href in a rendered page): absolute (`scheme://`), `mailto:` and pure `#` hrefs pass through; otherwise resolve the target against the source file's directory (handling `.` and `..`), then

1. a PAGE MAP hit by resolved `src` rewrites to that page's `.html` (fragment preserved);
2. anything else rewrites to GitHub: `https://github.com/repository-standards/core/blob/main/<path>` for files, `/tree/main/<path>` for directories (trailing-slash targets).

`node tools/site-check.mjs` - repo root, no flags. Landing checks (`site/index.html`): HTML tag balance (void elements, comments, script/style bodies skipped); em/en dash ban (a regex character class of U+2013 and U+2014, matched anywhere in the file); the positioning one-liner must appear **verbatim** - the check re-derives it mechanically by taking `docs/positioning.md`, splitting on `## The one-liner`, keeping the `> `-prefixed lines of that section, stripping the `> ` and joining with single spaces; external hosts limited to `github.com` and `*.github.com`; the landing MUST advertise `v<VERSION>` (read from the `VERSION` file). Docsite checks (`site/docs/*.html`): the generated pages MUST be exactly the page map - every declared `out` exists, and every `.html` present is declared, so a missing page and a stale survivor cannot cancel each other out in a count. The map is **imported** from `tools/docsite.mjs` (which exports `PAGES` and runs only when executed directly), never re-derived by parsing its source. Per page - dash ban, no leaked `|---` or triple-backtick fence, every internal `.html` href resolves to a generated page; `index.html` must contain the landing's own ink, read at check time from the `--bg` custom property in `site/index.html` rather than written here.

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
- Raw HTML in source markdown MUST be escaped, and inline code spans MUST be immune to link/emphasis rewriting. **The single exception is a fence tagged `figure`**, whose contents are emitted verbatim inside `<figure class="fig">`. It exists because a diagram is not expressible in markdown and the alternative was an image, which cannot be diffed, themed or read by a screen reader. The exception is deliberately one named fence rather than a general passthrough: every other scrap of HTML in a source file is still escaped, so a rendered page cannot do something its text does not say.
- A fenced block whose non-empty lines all begin with `>` MUST render as a prompt block rather than as code: the `>` is stripped from what is shown and from what its copy button copies. What you say to an agent is the most important thing on these pages and rendered as a shell transcript it was the least distinguishable.
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
- **At most one repository in the ecosystem MUST publish a deploy carrying the apex `CNAME`.**
  GitHub Pages allows a custom domain a single holder and hands it to whichever repository
  published most recently, so two live copies do not reinforce each other - the later deploy
  silently takes the domain off the earlier one. **Not script-enforced**: the guard would have to
  see across repositories, so this is a review rule, checked whenever a repository in the
  ecosystem gains or loses a Pages deploy.

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
- **The domain survives a rebuild.** GIVEN `site/CNAME` exists WHEN docsite regenerates the site THEN the file is still there - the generator clears `OUT_DIR`, never `site/` itself, so a rebuild cannot drop the binding and hand the apex back to the default domain.
- **A figure fence passes through.** GIVEN a source file contains a fence tagged `figure` holding an `<svg>` WHEN docsite renders THEN the SVG reaches the page unescaped inside `<figure class="fig">`.
- **Every other fence is still escaped.** GIVEN a fence with no tag, or any other tag, holding `<svg>` WHEN docsite renders THEN it appears as escaped text - the exception is the tag, not the presence of HTML.
- **A prompt block loses its marker.** GIVEN a fence whose lines all begin with `>` WHEN docsite renders THEN the rendered text and the copy button's payload both carry the sentence without the `>`.
- **A page built from several sources.** GIVEN a PAGE MAP entry carries `also: [path]` WHEN docsite renders THEN both documents appear on one page and the appended one's `<h1>` becomes an `<h2>` - two h1s is two pages pretending to be one, which is what merging the adoption and self-verify pages produced before this.
- **An ambiguous tree label carries its parent.** GIVEN two shipped paths share a basename - `README.md` at the root and under `docs/` - WHEN the sidebar tree renders THEN the deeper one reads `docs/README.md`, because a row that reads the same as another row is a row nobody can choose between.
- **Every internal link is root-absolute.** GIVEN any generated page WHEN site-check runs THEN a relative internal href is a FAILURE, not a note: arriving at `/docs` without the trailing slash resolved every relative link against the site root and stripped the prefix off the whole sidebar.
- **The navigation behaves as it claims.** `tools/site-behaviour.mjs` asserts what site-check cannot: a collapsible shelf always closes before the next group heading, every page carries exactly one `<h1>`, every nav row's target marks that row active on arrival, the mobile drawer has a button and a handler and a scrim, the role colour outranks the later `:visited` and `:hover` rules, no two tree rows share a label, and a page outside the sidebar carries a link back to its index. Each rule is a defect that shipped and was found by a person rather than by a check.
- **The source is one click from anywhere.** GIVEN any page on either surface WHEN it renders THEN the top bar carries a link to the repository, beside the link across to the other surface. A standard whose own repository takes a search to find is asking to be evaluated on its marketing.
- **A landing link into the site is checked.** GIVEN `site/index.html` links `docs/gone.html` and no such page is generated WHEN site-check runs THEN it FAILs naming the target - the docs' own links were always checked and the landing's were not, which is how its primary call to action reached production dead.

## Acceptance criteria (config)

- **Page count derived.** GIVEN the PAGE MAP gains an entry and the site is regenerated WHEN site-check runs THEN it passes with the new count - no check-side edit needed; GIVEN a generated page is deleted THEN site-check FAILs on the count mismatch.
- **Stale landing version.** GIVEN `VERSION` moves and the landing still advertises the old `vX.Y.Z` WHEN site-check runs THEN it FAILs.
- **Brand follows config.** GIVEN a `site/site.config.json` with `brand: "x"` WHEN docsite renders THEN page titles end `- x docs`.
- **The header does not move across the boundary.** GIVEN the landing and any docs page at the same viewport width WHEN both are rendered THEN the brand's left edge, the last top-bar link's right edge and the switcher's centre are identical - the docs read the landing's `--maxw` instead of declaring their own, so one spine serves both surfaces.
- **Legacy location still resolves.** GIVEN no `site/site.config.json` but a `site.config.json` at the repo root WHEN docsite runs THEN it is read - moving the file must not silently drop an ecosystem repo back to the core defaults.
- **A prefixed site rewrites every path it emits.** GIVEN a config with `site_root: "/node/"` and `base_path: "/docs/node/"` WHEN docsite renders THEN every sidebar and in-page link is prefixed `/docs/node/`, and the brand and Homepage links point at `/node/` - the two knobs of [ADR-031](../../docs/decision-records/ADR-031-one-domain-surface-first-urls.md) are the whole of what a site knows about where it is served.
- **The switcher derives "here" rather than being told.** GIVEN a site whose `base_path` matches the switcher's core entry WHEN docsite renders THEN "here" marks the core entry and the stack entry is a plain link; GIVEN a stack's `base_path` THEN "here" moves to the stack entry. The same generator builds every site in the ecosystem, so a hardcoded answer would be right on exactly one of them.
- **A same-domain switcher entry stays in the tab.** GIVEN `node_docs_url` is a path (`/docs/node/`) rather than a URL WHEN docsite renders THEN the entry carries no `target="_blank"`; GIVEN it is an off-domain URL THEN it opens in a new tab. Moving a stack onto the domain must not leave the switcher spawning tabs inside one site.
