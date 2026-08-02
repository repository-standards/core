# ADR-028: Work cycles live in the repo, and bind only at scale

| | |
| --- | --- |
| **Status** | Accepted (2026-08-02) |
| **Date** | 2026-08-02 |
| **Author** | Łukasz Bodurka |
| **Tags** | backlog, cycles, planning, tracker, scale |
| **Superseded by** | - |

## Context

The backlog holds intents ordered by risk x leverage, and that is all it holds. For one
person that is enough. For several people working in parallel it leaves three questions
with no home in the repo:

1. **Who is doing what, in what period?** The backlog's `owner` column names a *role*
   (product / architect / dev / agent) deliberately - not a person. Nothing says which
   items a given team has picked up now.
2. **What is this period for?** A list of items is not a goal. Teams commit to outcomes
   ("checkout stops losing carts"), and the items are how they get there.
3. **When will this land?** The most common question a product owner asks, and the repo
   currently cannot answer it even approximately.

ADR-010 answered a neighbouring question and answered it well: idea -> spec/records
(living) -> plan/tasks (ephemeral). It also decided that **execution state and work history
live in the tracker, not the repo**, explicitly rejecting "everything stays in the repo,
including done-work history" on the grounds that the repo accretes debris and git already
is the history.

That reasoning holds for per-item execution state and it does not hold for one thing, which
is why this record exists.

## Options considered

- **A - Leave it to the tracker.** Cycles are sprints, sprints are a tracker feature, and
  every tracker has them. Costs nothing, changes nothing. Rejected because it puts the
  answer to "when will this land" outside the repo, behind a tool the standard does not
  mandate and many teams do not pay for - and because the tracker's own history is not
  reachable from a checkout, which is the property the whole standard is built on.
- **B - Cycles in the repo, per-item state included.** A cycle file that tracks each item's
  status as it moves. Rejected: this is the tracker, re-implemented worse, and it is exactly
  the debris ADR-010 rejected. Two systems to keep in step by hand is the failure
  `docs/backlog.md` already warns about.
- **C - Cycles in the repo as intent + one aggregate outcome, per-item state left to the
  tracker (recommended).** A cycle is a named, dated, goal-bearing grouping of backlog
  intents. It records what was planned and, once, what came of it. It never tracks an item
  through its states.

## Decision

Option **C**.

A **cycle** is a bounded period of work with an owner, a goal and an agreed end date.
Several run in parallel, one per team. It lives at `docs/cycles/<team>/<slug>.md`.

**One item, one place.** An intent is in the backlog pool **or** in exactly one cycle,
never both and never two. Moving it into a cycle removes its row from the pool; closing a
cycle without finishing it returns the row. This is the property that makes the pair
trustworthy - a backlog that also lists what is already being worked on is a backlog nobody
believes. It is mechanically checkable (one id, one location) and therefore will be checked,
not asked for.

**The end date is agreed, not imposed.** A cycle ends when its owner says so. The date is a
planning input worth keeping, not a commitment the standard enforces - no framework, no
ceremony, no fixed length, and different teams may run entirely different rhythms.

**`/cycle-close` writes one aggregate outcome block**: items planned, items finished, items
returned to the pool, commits in the window, days elapsed. This is the narrow amendment to
ADR-010, and the argument ADR-010 did not have in front of it: **the grouping is not
recoverable afterwards.** Git can always tell you how many commits landed between two dates.
It cannot tell you that these seven intents were what the team believed it would finish, and
that five did - because the pool mutates, items get re-scoped, and the version of the backlog
that made the plan is only reachable by knowing which commit to look at. An aggregate that
cannot be recomputed is not a restatement of history; it is a measurement, and dropping it
means the repo can never answer "how fast do we actually go" from its own contents.

The line stays where ADR-010 drew it in every other respect: per-item execution state,
who-did-what and the work history remain the tracker's. The repo gains one block per closed
cycle, not a log.

**Estimation is arithmetic over that record, and it says when it cannot.** `/timeline-update`
reads every cycle, derives throughput from the closed ones, and projects the open ones and
the pool. With too few closed cycles to mean anything it says so and gives no date. A
projection presented without its confidence is the thing that makes people distrust plans,
and this standard would rather return nothing than a number it cannot support.

**Scale only.** A solo repo never meets any of this. Core keeps the backlog and nothing
else - one person does not need to know which of their two hats is holding an item.

## Consequences

- The repo answers "when will this land" without a tracker, and the answer improves as
  evidence accumulates rather than as someone's confidence does.
- One more artifact kind to keep true, with the usual failure mode: a cycle nobody closes.
  `/timeline-update` surfaces a cycle past its date and unclosed rather than silently
  projecting from it.
- ADR-010's clause 4 is narrowed, not overturned. Anyone reading it needs to see this record,
  so its status becomes `Accepted, revised by 028`.
- "Sprint" is deliberately not the word. It carries planning poker, retrospectives and
  velocity-as-commitment, none of which this is, and borrowing the word borrows the argument.
  `cycle` is Linear's term for almost exactly this shape, so it arrives pre-explained to both
  people and agents. The choice is openly held: [`work-periods`](../open-questions/work-periods.md).

## Confirmation

A guard fails when one intent id appears in more than one place across the pool and every
cycle file. `/timeline-update` refuses to project from fewer closed cycles than it can
defend, and says which cycles are past their date and still open. `self-verify` counts the
cycles directory only at `scale`.

## Revisit when

A second team runs a genuinely different rhythm and the single `docs/cycles/<team>/` shape
starts needing per-team configuration; or the first real timeline projection is compared
against what actually happened and is wrong enough to be worse than no projection.

## Related

- [ADR-010](ADR-010-artifact-lifecycle-and-tracker.md) - the lifecycle and tracker posture this narrows.
- [ADR-011](ADR-011-one-standard-two-profiles.md) - why this binds at `scale` only.
- [ADR-006](ADR-006-personas-are-a-validation-gate.md) - why a cycle's items still name the persona they serve.
- [`work-periods`](../open-questions/work-periods.md) - the name, held open.
