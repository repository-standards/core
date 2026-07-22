# tools/ - this repo's own gate tooling (zone 1, never shipped)

Maintainer machinery for the standard repo itself; a consuming repo gets `scripts/`
(self-verify + guards + changelog assembler) inside the shipped tree instead.

## Contents

| Tool | What it does |
|---|---|
| [tree-check.mjs](tree-check.mjs) | guards the single shipped tree (`standard/`): no repo-own leaks, every manifest promise present, and the tree passes its own `self-verify --skeleton` |
| [link-check.mjs](link-check.mjs) | every relative markdown link in the repo resolves; template placeholder lines are skipped |
| [docsite.mjs](docsite.mjs) | renders the docs site (`site/docs/`, gitignored) from the repo's own md - one source, two surfaces |
| [site-check.mjs](site-check.mjs) | the e2e gate for our own surfaces: landing tags balanced + quotes the positioning one-liner verbatim + GitHub-only hosts; generated docs pages complete, internal links resolve, no md leaks |

## Why this shape, and how to use it

Dependency-free (Node built-ins only), zone 1 only. The four checks run in this
repo's own CI (`.github/workflows/checks.yml`) and before any PR:

```
node tools/tree-check.mjs
node tools/link-check.mjs
node tools/docsite.mjs && node tools/site-check.mjs
```

There is no build step and nothing to sync: the standard is authored directly in
`standard/` (ADR-014), so the old reflect machinery is gone - tree-check only
proves nothing leaked and nothing promised is missing.
