# ADR-030: The current holder of an in-flight intent is cycle state, not history

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-02 |
| **Author** | bodurkalukasz |

## Context

[ADR-010](ADR-010-artifact-lifecycle-and-tracker.md) put work history in the tracker and
kept it out of the repo, and the reasoning holds: a repo that also maintains state
transitions, timestamps and assignment logs becomes a bad tracker competing with a good one.
`cycle-open` states the consequence plainly - *do not assign people; the row's owner is a
role*.

Two things have since made that line, as written, unworkable.

**The adoption intake offers in-repo tracking.** A team that answers "we track work here" has
no tracker, so "it lives in the tracker" names a place that does not exist for them. The rule
silently assumed an answer the intake explicitly allows them not to give.

**A cycle without a holder is not a commitment.** `owner` is a role - `dev`, `product`,
`architect`. A cycle whose rows all say `dev` records that developers will do some
development, which is not information. The question a person actually asks of an open cycle -
*who has this one* - has no answer anywhere in the repo, and answering it in a meeting is the
state cycles were meant to replace.

## Options considered

- **A - Hold the line; assignment only in a tracker.** Consistent with ADR-010 as written.
  Rejected: it fails outright for in-repo teams, and it leaves the most-asked question about
  an open cycle unanswerable in the repo that claims to describe the work.
- **B - Full per-item execution state in the repo** - assignment, transitions, timestamps,
  time spent. Rejected, and this is the thing ADR-010 was right about: it rebuilds a tracker
  badly, and the repo starts losing to the tool teams already have.
- **C - The current holder only, on cycle rows, archived with the cycle.** Chosen. One field,
  present tense, bounded lifetime.

## Decision

**`assignee` names the person currently holding an in-flight intent, on cycle rows only.**

The boundary against ADR-010 is *tense*, and it is what keeps this from being option B:

- The pool has no assignee - an item nobody has picked up is not yet anyone's, and a pool
  that assigns work has become a queue of orders.
- A cycle row carries exactly one current holder. Not a list of who touched it, not when it
  changed hands, not how long each held it. **Reassignment overwrites**; the previous holder
  is not recorded, because that is history and history is ADR-010's.
- When the cycle closes, the file is archived as written. It is a record of what that cycle
  looked like, not a queryable log - nothing reads assignees across cycles, and no skill
  aggregates them.

ADR-010 is **narrowed, not superseded**: work history still lives in the tracker. What moves
into the repo is one field of present state, with no accumulation.

## Consequences

- An open cycle answers "who has this" without a meeting or a second tool.
- In-repo teams get a coherent story instead of a pointer to a tracker they chose not to have.
- **The cost, and it is deliberate:** who *used to* hold an item is unrecoverable from the
  repo. A team that needs that needs a tracker, and this standard will keep saying so.
- **A second cost:** an assignee left stale after someone changes teams looks authoritative
  and is wrong. Nothing detects this - see below.
- Per-person throughput is not derivable and is not meant to be. A field that could be
  aggregated into individual velocity would be, and that is a measurement this standard
  declines to make (see [ADR-029](ADR-029-measurement-forecasts-sizes-only-cold-start.md) for
  the same reasoning applied to sizes).

## Confirmation

**Review, not a script, and the gap is worth stating.** `cycle-guard` checks that an intent
lives in exactly one place and that blocks point at something real; it does not and cannot
check that an assignee is a real person, is still on the team, or is current. A guard that
tried would need a roster the standard does not have and would go stale faster than the field
it was checking.

What is mechanical: `cycle-close` reports rows whose status did not change during the cycle,
which surfaces an abandoned item - the usual symptom of a stale assignee - without claiming
to detect the cause.

## Revisit when

A team reports that they wanted the previous holders after all - which would mean the
archived-as-written rule is too thin and the boundary has been drawn in the wrong place. That
is the observation that reopens this; a general preference for more tracking is not.

## Related

- [ADR-010](ADR-010-artifact-lifecycle-and-tracker.md) - narrowed here, in the same way
  [ADR-028](ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md) narrowed it.
- [ADR-029](ADR-029-measurement-forecasts-sizes-only-cold-start.md) - the sibling decision on
  what the repo will and will not measure.
