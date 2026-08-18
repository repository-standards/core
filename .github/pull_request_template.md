<!-- This repo's own PR template (the one at standard/.github/ is the shipped
     template for adopters - never active here). -->

## What

<!-- One paragraph: the change, in content language. -->

## Why

<!-- The reason - link the ADR/open-question/issue it answers, if one exists. -->

## Checklist

- [ ] `node tools/gates.mjs` is green locally. It runs the steps in this workflow, so it is the whole set - when this checkbox restated the commands instead, it listed nine and was already missing the diff-gated coupling guard, the one that catches a capability's code moving without its spec
- [ ] The change is described under `CHANGELOG.md`'s `## Unreleased` heading and the version is bumped in this PR - PATCH by default, unless directed otherwise or told explicitly not to bump
- [ ] A change to how a capability works updates its spec in this same PR
- [ ] A contradicted Accepted ADR is superseded, never edited
- [ ] No em/en dashes; no secrets
