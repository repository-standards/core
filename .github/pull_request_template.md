<!-- This repo's own PR template (the one at standard/.github/ is the shipped
     template for adopters - never active here). -->

## What

<!-- One paragraph: the change, in content language. -->

## Why

<!-- The reason - link the ADR/open-question/issue it answers, if one exists. -->

## Checklist

- [ ] The gate set from [`AGENTS.md`](../AGENTS.md) is green locally - all of it. It is not restated here: this checkbox listed nine commands and was already missing the diff-gated coupling guard, which is the one that catches a capability's code moving without its spec
- [ ] The change is described under `CHANGELOG.md`'s `## Unreleased` heading - no version heading added, `VERSION` untouched (the maintainer cuts releases)
- [ ] A change to how a capability works updates its spec in this same PR
- [ ] A contradicted Accepted ADR is superseded, never edited
- [ ] No em/en dashes; no secrets
