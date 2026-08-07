A sprint is a bounded stretch of work with an owner, a goal, and an end date everybody
agreed to. This folder holds one file per sprint. It exists so that "what are we doing
right now" has an answer in the repository instead of in a tracker nobody opens after
standup.

## What it is for

Two questions, answered in writing, that otherwise get answered from memory:

**What did we commit to, and by when.** A sprint names its goal in one sentence and its
end date once. When the date arrives the sprint closes, whether or not the work finished.
That is the point of having one.

**What is somebody actually holding.** Every intent in a sprint names its current holder.
Not who will eventually do it, not who suggested it: who has it now. An intent nobody is
holding is a gap you can see.

## What goes in here

One file per sprint, at `docs/sprints/<team>/<slug>.md`. Several teams run several sprints
at once; the folder per team keeps them from colliding.

```markdown
# Dispatch, sprint 4

**Goal:** couriers can be reassigned mid-route without a support call.
**Ends:** 2026-08-15
**Owner:** Maja

## Intents

| id | title | assignee | size | status |
|---|---|---|---|---|
| INV-2 | Reassign an active route | Maja | M | doing |
| INV-3 | Notify the original courier | Piotr | S | blocked:INV-2 |
```

Three things in that shape are the guard's interface rather than a matter of taste, and an
earlier version of this page got all three wrong - which is how a real duplicate came to be
reported as `OK - each in exactly one`:

**The rows live under `## Intents`.** That heading is what tells `sprint-guard` where the
intents are, and it reads nothing outside it - `sprint-close` writes a second table of the
same ids under `## Outcome`, and counting that one reported every correctly closed sprint as
a duplicate. Exactly that H2: a deeper level is not the same heading. A sprint file without
it is an error, not an empty sprint.

**The id is its own first cell, matched by its column's name.** `INV-2`, with the title in
the next column - never `INV-2 Reassign an active route` in one cell, and a row like that is
reported as unreadable rather than silently skipped. The guard reads whichever column the
header row calls `id`, so putting something ahead of it - a priority column, a team column -
does not disarm the check; a table with no column named `id` falls back to the first one.
Backticks or bold around the id are fine either way - the guard strips them before comparing.

**The status is the last cell**, whatever columns you add in between. Blocking gets no
column of its own: `blocked:INV-2` goes in the status cell, and the guard fails when that
id does not exist, is already finished, or is the row itself - a stale block is the most
common way a board lies. `split:INV-2b`, the sprint-boundary answer `/sprint-close` writes,
counts as finished for that check and is itself checked the same way: the remainder must be a
row that exists and is not this one.

**The title is the other half of the id.** The guard reads it from the column the header
names `title` and treats one title in two files under two ids as one intent in two places -
because copying a row into a sprint and renumbering the copy left in the pool passes every
check keyed on the id alone. A `split:<id>` pair may share a title; nothing else may.

`Size` is a cold-start ranking signal and nothing else - it is never converted into a duration,
even before the repo has any closed sprints. Once it does, the forecast comes from what
actually took how long, and the size column stops being an input to anything
([ADR-029](../decision-records/ADR-029-measurement-forecasts-sizes-only-cold-start.md)).
An intent that does not finish inside its sprint gets **split**, never re-sized.

## What does not go in here

**The backlog.** `docs/backlog.md` holds everything the repo owes itself; a sprint holds
the slice somebody picked up. An intent lives in the pool **or** in exactly one sprint,
never both and never two sprints at once - `sprint-guard` fails the build when that stops
being true ([ADR-028](../decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md)).

**A running commentary.** A sprint file is state, not a diary. What happened and why it
mattered belongs in the closing note the `sprint-close` skill writes, or in a decision
record if it changed how you work.

**A person's whole week.** Only what this sprint committed to. Support rotations, reviews
and interrupts are real work, but a sprint that tries to contain all of them stops being a
commitment and becomes a timesheet.

## How you actually use it

You do not edit these by hand. Two skills own the file:

```
/sprint-open    move chosen intents out of the pool, with a goal and a date
/sprint-close   check each intent against its done, return what did not
```

`sprint-close` records the one measurement that cannot be reconstructed afterwards - what
finished inside the window - and returns the rest to the pool. Skipping it does not save
time; it destroys the only data the next forecast has.

## Decisions behind it

- **[ADR-028](../decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md) - sprints are the
  team layer.** They arrive at the `scale` profile and stay out of a solo repo entirely.
  A single maintainer already knows what they are doing this week; the ceremony would cost
  more than the answer.
- **[ADR-029](../decision-records/ADR-029-measurement-forecasts-sizes-only-cold-start.md) -
  measurement forecasts, sizes are the cold start.** Story points were rejected outright:
  with an agent in the loop the relationship between an estimate and an outcome no longer
  holds. Sizes survive only as a splitting trigger and as the fallback for a repo with no
  history. There is deliberately **no blended mode** - a forecast that mixes measured
  sprints with guesses cannot say which half it came from.
- **[ADR-030](../decision-records/ADR-030-the-current-holder-is-cycle-state-not-history.md) -
  the holder is state, not history.** One current holder, overwritten on reassignment.
  Keeping the chain of previous holders was considered and dropped: it turns a sprint file
  into an audit log, and git already is one.
