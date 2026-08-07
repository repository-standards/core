# ADR-041: The bounded period of work is called a sprint

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-07 |
| **Author** | Łukasz Bodurka |
| **Decided by** | the author |
| **Tags** | backlog, sprints, planning, vocabulary, scale |

## Context

[ADR-028](ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md) put a bounded
period of work in the repository and named it a **cycle**. The substance of that record - a
goal, an agreed and movable end date, the intents pulled in for it, one file per team, and
the invariant that an intent is in the pool or in exactly one period but never both - has
held. Only the name is in question here.

The name was chosen against `sprint` deliberately, and the reasoning is recorded in
[`work-periods`](../open-questions/work-periods.md): *"sprint carries the whole ceremony
apparatus - planning poker, retro, velocity as a commitment - and this is deliberately none
of that. Borrowing the word borrows the argument."* `cycle` was picked because Linear uses it
for almost exactly this shape, so it was expected to arrive pre-explained.

It did not. The owner reports the opposite from use: **people read `cycle` and stop**. It
reads as a new word for a thing they already have a word for, and every reader spends the
same first question - "is this a sprint?" - to which the answer is yes, minus some ceremony.
The dashboard made this loud: a page built for the people who never open the repository has a
tab whose label needs a sentence of explanation before anything under it can be read.

That is field evidence against a design argument, and this project's own rule is that
evidence wins. The cost of `cycle` is paid by **every** reader, forever. The cost of `sprint`
is paid once, to the Scrum-fluent, in one clause: no points, no velocity commitment.

## Options considered

| Option | For | Against |
|---|---|---|
| **Keep `cycle`** | already shipped, matches Linear, no ceremony baggage | every reader pays the "what is this?" tax; the observed failure mode is that they stop reading |
| **`sprint`, defined here** (chosen) | universally understood; a reader knows the shape before the first sentence; maps 1:1 onto any tracker if a bridge is ever built | imports expectations the standard does not meet - points, velocity as a commitment, a fixed timebox - which must be denied explicitly |
| **`sprint` on the surface, `cycle` in the tree** | no migration | two names for one thing, which is the drift this project keeps finding in its own files; the worst of both |
| **`iteration`** | neutral, no ceremony | as unfamiliar as `cycle` without Linear's precedent behind it, so it pays the same tax for less |

## Decision

The bounded period of work is a **sprint**, everywhere: `docs/sprints/<team>/<slug>.md`, the
`sprint-open` and `sprint-close` procedures, `scripts/sprint-guard.mjs`, the `work-sprints`
capability spec, and every label on the dashboard.

**What a sprint is here**, stated so the borrowed word cannot import what it usually carries:

- a **goal** in one sentence, an **agreed end date** that may move, and the intents pulled in
  for it. Several run in parallel, one per team.
- an intent is in the backlog pool **or** in exactly one sprint, never both.
- **no estimates.** Sizes are a splitting trigger and a cold-start fallback, never summed
  ([ADR-029](ADR-029-measurement-forecasts-sizes-only-cold-start.md)). There are no story
  points and there is no planning poker.
- **no velocity as a commitment.** Throughput is measured from closed sprints and used to
  project, never to promise. A sprint that does not finish its items is a fact about the
  projection, not a failure to be explained.
- **the date is agreed, not a timebox.** It can move; what may not move is the record that it
  moved. An unfinished intent is returned to the pool or split, never quietly re-dated.
- **no ceremony is prescribed.** Planning, review and retrospective are a team's business.
  The standard ships two procedures, `sprint-open` and `sprint-close`, and neither is a
  meeting.

Scale-only, exactly as before: a single-maintainer repository is not out of compliance for
having none.

## Consequences

- ADR-028 stands as the record of *why the artifact exists and what it holds*, superseded
  only on the name. This record does not restate its substance.
- The shipped tree renames: `docs/cycles/` to `docs/sprints/`, `cycle-guard.mjs` to
  `sprint-guard.mjs`, the two skills, the capability spec, and the manifest entries. There
  are no releases yet, so no adopter is carrying the old paths from a tag - the one repository
  that is, the showcase fixture, is migrated in the same wave.
- The open question [`work-periods`](../open-questions/work-periods.md) is answered rather
  than deleted: it now records that the first answer was overturned by use, which is the only
  kind of evidence that could have overturned it.
- The risk taken knowingly: somebody arrives expecting Scrum and finds no points and no
  velocity. That is a conversation of one sentence, and it happens once per reader rather
  than on every page.
