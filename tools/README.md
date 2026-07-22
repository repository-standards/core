# tools/ - this repo's own build tooling (zone 1, never shipped)

Maintainer machinery for the standard repo itself; a consuming repo gets `scripts/`
(self-verify + guards) instead.

## Contents

| Tool | What it does |
|---|---|
| [reflect.mjs](reflect.mjs) | keeps `dist/` in sync with the source (copy / divergent / authored / source-only classes); `--check` reports drift as a number, `--write` syncs the copy class |
| [changelog.mjs](changelog.mjs) | assembles `changes/` fragments into the technical changelog + release-notes draft; `--check` validates fragments in CI |
| [docsite.mjs](docsite.mjs) | renders the docs site (apps/docs-site) from the repo's own md - one source, two surfaces |
| [site-check.mjs](site-check.mjs) | the e2e gate for our own surfaces: landing tags balanced + quotes the positioning one-liner verbatim (PDLC-1) + GitHub-only hosts; docsite pages complete, internal links resolve, no md leaks, dark-first palette |

## Why this shape, and how to use it

Dependency-free (Node built-ins only), source-only. Run both `--check`s before any PR;
`reflect --write` after editing any zone-2 source that ships. If a new dist file appears
without a map entry, `reflect --check` fails on the orphan - that is the point.
