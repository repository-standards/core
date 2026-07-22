# ADR-018: History lives in the changelog, never inside living documents

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-29 |
| **Author** | Łukasz Bodurka |
| **Tags** | documentation, changelog, specs |

## Context

The standard already has a changelog process with two outputs - the complete
technical `CHANGELOG.md` and the curated stakeholder `RELEASE-NOTES.md` - fed
from one source. In the field a second, unplanned history channel appeared:
capability specs growing their own `## Change log` sections, one dated entry per
change, partly to satisfy the coupling guard's "touch the spec" demand on changes
with no behavioral delta (dependency bumps matched by broad capability globs).
The result reads badly and is structurally wrong: the spec - a living document
whose whole contract is "the current version is the truth, git is the history"
(R4) - starts duplicating git and the changelog, grows without bound, and buries
the actual behavior under bookkeeping.

## Options considered

- **Per-document change-log sections** - history next to the content it touched.
  Rejected: duplicates git and the changelog, drifts from both, bloats every
  living document, and gives a reader three competing histories.
- **Git only** - no curated history at all. Rejected: the changelog process
  exists precisely because two audiences (engineer, stakeholder) need curated
  views git does not give them.
- **One history home: the changelog process** - living documents describe the
  present only; every change event is recorded once, in the changelog source
  (Unreleased section, or `changes/` fragments at scale), assembled into the two
  outputs at release.

## Decision

We will keep exactly one accumulating history: the changelog process. A living
document - a spec, ARCHITECTURE, a runbook - describes the present and MUST NOT
carry a `## Change log` / `## History` section; git holds every past state, and
the changelog holds the curated record (technical and stakeholder). R4 in
`standard/SPEC.md` now states this. Two supporting rules keep the guard honest:
capability-map globs bind behavior-bearing source and SHOULD NOT match dependency
manifests or lockfiles (a version bump is not a behavior change), and when the
coupling guard fires on a genuinely behavior-free change the answer is to
reconcile the spec's content or narrow the map - never to append a history note
to the spec.

## Consequences

- Positive: specs stay readable and stay specs; one history, two audiences, no
  drift between three channels; routine dependency updates stop forcing
  ceremonial spec edits.
- Negative / cost we accept: a reader of a spec who wants "what changed lately"
  must look at git or the changelog - one hop away.
- Follow-ups: repos that accumulated in-spec change-log sections migrate them
  into the changelog and strip the sections; capability maps get narrowed so
  manifests and lockfiles no longer trip the guard.

## Confirmation

Review, plus the structure lint direction: a spec containing a change-log
section fails the spec shape. Until that check ships, `pre-pr-review` and align
flag it.

## Revisit when

A regulated context requires an in-document audit trail that git and the
changelog provably cannot serve, or the changelog process is retired.

## Related

R4, R11, R18 in `standard/SPEC.md`; `standard/docs/changelog-process.md`;
`standard/specs/enforcement.md` (coupling guard, map hygiene); ADR-001
(records policy).
