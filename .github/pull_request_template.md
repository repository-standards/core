<!-- This repo's own PR template (the one at standard/.github/ is the shipped
     template for adopters - never active here). -->

## What

<!-- One paragraph: the change, in content language. -->

## Why

<!-- The reason - link the ADR/open-question/issue it answers, if one exists. -->

## Checklist

- [ ] The gate set is green locally: `node tools/tree-check.mjs`, `node tools/link-check.mjs`, `node standard/scripts/spec-structure.mjs`, `node standard/scripts/spec-guard.mjs --audit`, `node tools/spec-guard-test.mjs`, `node tools/docsite.mjs && node tools/site-check.mjs`
- [ ] The change is described under `CHANGELOG.md`'s `## Unreleased` heading - no version heading added, `VERSION` untouched (the maintainer cuts releases)
- [ ] A change to how a capability works updates its spec in this same PR
- [ ] A contradicted Accepted ADR is superseded, never edited
- [ ] No em/en dashes; no secrets
