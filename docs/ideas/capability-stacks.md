# Capability stacks - a layer that crosses technologies

| | |
| --- | --- |
| **Status** | idea |
| **Date** | 2026-08-03 |
| **Owner** | bodurkalukasz |

## The itch

The ecosystem has two layers: a method that says nothing about technology, and a stack per
technology that says everything about one. Web end-to-end testing fits neither.

Driving a browser is not a Node concern. Playwright talks to Chromium the same way whether
the server behind it is Node, Python, Go or Rust - the journeys, the selector policy, the
trace and artifact handling, the flake policy, the CI shape that boots an app and points a
browser at it. All of that is decided once and reused everywhere, and today it lives inside
the Node stack because that is where it was first needed.

A Python team adopting the standard would either rewrite those decisions or read a Node
repository for them. Both are the failure this project exists to prevent, one layer up.

## What is actually technology-independent

Worth separating, because "testing" as a whole is not, and treating it as one thing is how
this idea would get built wrong:

| Piece | Where it belongs | Why |
|---|---|---|
| How much to test, and where each tier runs | **the method** - already a fork in the decision checklist | A question every repository answers, in the same words |
| The runner, assertions, fixtures, CI wiring | **the technology stack** | Vitest, pytest and `go test` are not variations of one thing |
| Driving a browser end to end | **neither, today** | Identical across every server technology, and currently duplicated into whichever stack needs it first |

The third row is the idea. It is not the only candidate: accessibility auditing, performance
budgets and visual regression have the same shape - decided against a browser and a user,
not against a runtime.

## For whom

The **consultant rolling this out** across teams that do not share a language, and the
**developer** on a stack that does not exist yet: today they get "no stack for Python" when
most of what they need was never about Python.

## Provisional shape

A third kind of repository: `repository-standards/web-e2e`, adopted **alongside** a
technology stack rather than instead of one. Same manifest schema, same drift number, so
nothing new has to be learned - a repository would carry the method, its technology stack,
and any capability stacks that apply.

The registry would need a second list, or an entry kind - it currently says one stack per
technology, which is exactly the rule that has no room for this.

## Open questions

- **Who owns a file two stacks both want?** `playwright.config.ts` is in the Node stack's
  manifest today. If a capability stack claims it, the technology stack has to stop - and
  the coupling has to be expressed somewhere, or an adopter gets two entries for one path
  and a drift number that double-counts.
- **Does it survive its own generalisation?** The Node stack's e2e journeys are sign-up and
  dashboard - specific to an app with authentication. What is left after the app-specific
  parts are removed might be a config file and a policy, which is a document rather than a
  stack.
- **Is one example enough to generalise from?** This is the shape of a decision drawn from
  a single case. The honest test is a second technology stack existing and needing the same
  thing; until then, moving it is speculative and leaving it in Node costs nothing.
- **Would the ecosystem read as three layers or as a pile?** Two layers are explainable in
  a sentence. A third that applies sometimes may cost more in comprehension than it saves
  in duplication.

## Graduation (fill when approved)

Backlog intent: `<id>` - spec: `specs/<capability>/` - records: `<ADR/BDR ids or "none">`
