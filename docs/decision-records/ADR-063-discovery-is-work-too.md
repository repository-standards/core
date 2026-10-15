# ADR-063: Discovery is work too

| | |
| --- | --- |
| **Status** | Proposed |
| **Date** | 2026-10-15 |
| **Author** | Patryk Kuszczak |
| **Decided by** | the maintainer |
| **Tags** | discovery, backlog, tracker |

## Context

An adopting team was asked, in a sprint call, to evaluate an in-app survey tool for
collecting user feedback. Two people started investigating the same day. Days of work went
in before anything existed to track it: no dossier, no backlog row, no tracker item. The
team's usual order - a spec PR first, tickets cut from the spec afterwards - meant that for
the whole investigation nothing looked like it was happening, because nothing the process
counts exists until a spec does.

The standard models discovery as an **inbox**: material is handed over and lands in
`docs/discovery/<topic>/` (ADR-024, ADR-049). It never models discovery as **work**. The
backlog's five sources - `onboarding`, `spec-delta`, `drift`, `decision`, `asked` - are all
downstream of a spec or a record, except `asked`, which is a parked aside rather than a
running investigation. No definition of done fits "the topic reaches a readiness verdict".
`discovery-digest` step 5 offers a backlog row only for work items found *inside* the
material, never for the investigation itself, and the dossier README has no field naming
the item that funds it. The standard's own in-repo sprint flow (`specs/work-sprints`) has
the same hole, so this is a gap in the standard, not an adopter's local tweak.

ADR-010 already says execution state lives in the tracker and that keys it creates are
written back into the repository. What was missing is the repository-side intent for
discovery, and a home for that write-back.

## Options considered

- **A - Status quo: file it as `asked`, link nothing.** Rejected: `asked` means "park it,
  not now", the opposite of a topic somebody is working on today, and nothing would link
  the dossier to the time spent on it.
- **B - Tracker only, repository unchanged.** Rejected: the repository could still not say
  whether a topic is being worked or by which item, and a team on in-repo sprints
  (ADR-028) gets nothing at all.
- **C - A discovery intent (chosen).** A sixth backlog source, `discovery`, whose DoD is the
  dossier's readiness verdict; a `Tracked by:` line in the dossier README; and
  `discovery-digest` offering the row, consent-gated, once per dossier.
- **D - A spike artifact type with timebox fields.** Rejected: a timebox and hours spent
  are execution state, which is the tracker's (ADR-010), and `size` already exists as the
  repository's only estimate.

## Decision

We will treat active discovery as a backlog intent. When `discovery-digest` opens a dossier
(or finds one with no `Tracked by:` line and no row naming it), it asks once whether the
investigation is tracked and, on a yes, files a row through `add-to-backlog` with
`source: discovery: docs/discovery/<topic>` and the readiness verdict as its DoD - ripe for
`spec-specify`, a spec drafted `in-refinement`, or the topic parked. The row's id, and the
tracker key once a bridge creates one, go into `Tracked by:`; a no writes `Tracked by: none`
and the question is not asked again. When the verdict meets the DoD, the digest offers to
close the row. Build work is filed separately, once the spec is `ready-to-develop`.

## Consequences

- Positive: time spent finding out is visible as work before a spec exists, in the
  repository and in the tracker, and the dossier says who is doing it.
- Positive: the investigation closes on its own finish line, so "the spec is ready" stops
  being confused with "the feature is built".
- Negative / cost we accept: one more question per new dossier, and one more source value
  every place the vocabulary is listed.
- Follow-ups: none required; a tracker bridge may later create discovery items itself.

## Confirmation

The shipped `docs/discovery/_template.md` carries the `Tracked by:` line, and
`discovery-digest`'s Done When requires it to be filled - a row id or `none`. No new gate:
whether a topic deserves tracking is a judgement, not something a script can check.

## Revisit when

Adopters report the question as noise - most dossiers answered `none` - or a tracker bridge
starts creating discovery items itself, at which point the repository-side offer may be
redundant.

## Related

ADR-010 (execution state in the tracker, keys written back), ADR-024 (discovery dossiers),
ADR-028 (in-repo sprints), ADR-049 (typed entries and the stamp).
