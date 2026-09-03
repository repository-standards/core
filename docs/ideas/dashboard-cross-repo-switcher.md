# A switcher between a repository's dashboard and the stacks it pairs with

| | |
| --- | --- |
| **Status** | approved |
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

Both were real unknowns when this idea was filed; the first is resolved by the
implementation below, the second is a conscious, tracked gap rather than a blocker:

- ~~The dashboard has no cross-repo notion today.~~ **Resolved.** `pages.yml` now builds
  every registered stack's dashboard into the same aggregate deployment it already builds
  landing and docs into (`site/<tech>/dashboard/`), passing `--registry stacks.json` to
  `generate-dashboard/index.mjs`. The generator reads the registry, marks the surface whose
  git remote matches the running repo as "here", and hands `page.js` a `meta.switcher` list
  it renders as a dropdown - the same same-origin-path mechanism `tools/docsite.mjs` already
  uses for the landing/docs switcher, not a second list or a cross-repo fetch. A standalone
  build (no `--registry` - every existing `dashboard.yml`, including the node stack's own)
  renders no switcher, so no adopter's output changes.
- **The dashboard still has no capability spec.** `standard/scripts/generate-dashboard/**`
  remains `$unclaimed` in `specs/capability-map.json`. This change went in directly - the
  coupling guard does not block an unclaimed path, and the owner asked for the feature built
  rather than gated on process - so the debt is real, not closed: a future pass should run
  `spec-specify` for this capability and only then flip this row to `graduated`.

## Graduation (fill when approved)

Backlog intent: `DASHBOARD-SWITCHER-1` (this same row) - spec: none yet, capability remains
`$unclaimed` (see open question above) - records: none new, extends the pattern already
decided in ADR-031 rather than making a new decision.
