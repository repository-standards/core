# ADR-011: One standard, two profiles - core and scale - declared in the manifest

| | |
| --- | --- |
| **Status** | Accepted (2026-07-22); the trigger and the solo/enterprise framing revised by [ADR-040](ADR-040-the-scale-profile-binds-on-reach-not-headcount.md) - scale binds on what leaves the room, not on headcount, and CI is core |
| **Date** | 2026-07-22 |
| **Author** | Łukasz Bodurka |
| **Tags** | profiles, manifest, adoption, solo, enterprise |

## Context

The standard must serve a one-person side project and a corporate-grade repo without
becoming either a toy or a bureaucracy. Some patterns are universal (living specs,
decision records, the agent entry point); others only pay off with more people
(tracker bridges, release-notes curation, CI-enforced gates, UX research cadence). The
owner's constraint (2026-07-22): keep it **one repo** - a fork or "light edition" must
not appear - but a solo adopter must not be asked to carry enterprise ceremony, and the
distinction must not rot into an unreadable pile of footnotes.

## Options considered

- **A - A separate light repo / branch / subproject.** Clean first impression; but two
  artifacts drift apart immediately, every fix lands twice, and the transition
  light -> full becomes a migration. This is the exact split-maintenance failure the
  owner fears. Rejected.
- **B - Two prose documents ("full" vs "light" checklists).** Cheap; but prose drifts
  from the actual requirements, nothing enforces it, and every new feature must remember
  to update both narratives. Rejected as the primary mechanism (fine as a rendered view).
- **C - A `profile` field on manifest entries, verified per profile (recommended).**
  Every entry in `standard.manifest.json` (files / sections / guards / decisions)
  declares `profile: "core"` or `"scale"`. A repo states its profile next to its version
  pin; `self-verify --profile core|scale` (solo/team accepted as aliases) counts drift
  against the right subset. One
  source of truth, mechanical, and upgrading profile is a flag flip plus the delta -
  the same muscle as `update-to-version`. Docs render the two views FROM the manifest,
  so prose cannot drift.

## Decision

Option **C**. The dividing principle, so future entries classify themselves:

> **Core is whatever keeps knowledge alive; scale is whatever coordinates people.**

- **Core (every repo, even one person):** `AGENTS.md` entry point, taxonomy, living
  capability specs, decision records + catalog, backlog, ideas space, version pin +
  manifest + self-verify, living-docs rule, supply-chain cooldown.
- **Scale (teams / enterprise):** tracker bridge + statuses mirrored out, curated
  release notes (two-changelog stays, curation is scale), CI-enforced gates (solo runs
  the same guards locally/pre-commit), personas as a *hard* gate with a full roster
  (solo: one persona minimum, the gate stays), UX research cadence + design-token
  handoff, C4 diagram discipline.

The exact per-entry assignment is executed as `PROF-1` (manifest field + self-verify
support + the adoption doc's profile picker); this record fixes the mechanism and the
principle.

> Note (2026-07-22): the human-facing vocabulary was unified to the manifest's words -
> `--profile core|scale` everywhere; solo/team stay accepted as deprecated aliases.

## Consequences

- Positive: one repo, one source of truth; a solo project adopts in an afternoon without
  carrying ceremony; an enterprise gets the full posture; profile upgrade is a measured
  delta, not a re-adoption; the light/full views are *rendered*, never hand-maintained.
- Negative: every future manifest entry must declare a profile (a one-word cost); the
  standard's own docs must resist explaining everything twice - the profile column, not
  parallel chapters.

## Confirmation

`standard.manifest.json` entries carry `profile`; `self-verify --profile` exists and CI
uses it; `docs/adoption.md` tells an adopter how to pick; a solo repo passing
`--profile core` shows drift 0 while visibly not carrying scale-only artifacts.

## Revisit when

A third audience genuinely appears (e.g. regulated industries needing an `audit`
profile), or profile flags start appearing on individual *rules inside docs* - a sign
the two-profile granularity is too coarse.

## Related

- ADR-005 (the manifest is the align-engine - this extends its schema),
  ADR-008/009/010 (zones, skill classes, lifecycle), `PROF-1` in
  [`backlog.md`](../../backlog.md).
