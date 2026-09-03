# A switcher between a repository's dashboard and the stacks it pairs with

| | |
| --- | --- |
| **Status** | idea |
| **Date** | 2026-09-03 |
| **Owner** | bodurkalukasz |

## The itch

The docs site already answers "I'm reading the core, where's the Node stack's docs" with a
"Repository Standards ▾" switcher in the header - core is "here", Node is one click away, per
[ADR-031](../decision-records/ADR-031-one-domain-surface-first-urls.md). The dashboard has no
equivalent. A viewer on core's dashboard (backlog, specs, changelog, documents) has no path to
Node's dashboard short of knowing its URL already, and the reverse is just as true.

## For whom

The **maintainer or a curious adopter** comparing where core and a stack each stand - drift,
open backlog, changelog - without switching tabs to a URL they'd have to already know.

## Provisional shape

A header control on the dashboard, same idea as the docs switcher: core is the default,
other stacks (starting with Node) are one click away. Not proposing an aggregated,
cross-repo dashboard - just a link between each repository's own.

## Open questions

Two real unknowns, not yet resolved by this idea:

- **The dashboard has no cross-repo notion today.** `standard/scripts/generate-dashboard`
  renders one repository's own committed files into its own static page; each repository's
  `dashboard.yml` deploys that page to its own Pages target, independently. The docs
  switcher works because `pages.yml` and `stacks.json` already aggregate every repo's docs
  under one deployment, surface-first (ADR-031). The dashboard has no equivalent aggregation
  step - this idea would need one, or a different mechanism entirely (a static link to the
  other repo's own deployed dashboard is the cheap option, but "cheap" is the answer, not yet
  the decision).
- **The dashboard has no capability spec yet** (`CYCLE-6`, `$unclaimed` in the coupling map).
  A switcher changes what the dashboard's markup asserts; adding it before `CYCLE-6` lands
  means writing to an undefined contract.

Whether the switcher's target URLs come from the registry (`stacks.json`, already the source
of truth for what stacks exist) or need a second list is itself downstream of the first
unknown above - not decided here.

## Graduation (fill when approved)

Backlog intent: `<id>` - spec: `specs/<capability>/` - records: `<ADR/BDR ids or "none">`
