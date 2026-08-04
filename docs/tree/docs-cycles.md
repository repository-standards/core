A cycle is a bounded stretch of work with an owner, a goal, and an end date everybody
agreed to. This folder holds one file per cycle. It exists so that "what are we doing
right now" has an answer in the repository instead of in a tracker nobody opens after
standup.

## What it is for

Two questions, answered in writing, that otherwise get answered from memory:

**What did we commit to, and by when.** A cycle names its goal in one sentence and its
end date once. When the date arrives the cycle closes, whether or not the work finished.
That is the point of having one.

**What is somebody actually holding.** Every intent in a cycle names its current holder.
Not who will eventually do it, not who suggested it: who has it now. An intent nobody is
holding is a gap you can see.

## What goes in here

One file per cycle, at `docs/cycles/<team>/<slug>.md`. Several teams run several cycles
at once; the folder per team keeps them from colliding.

```markdown
# Dispatch, cycle 4

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

**The rows live under `## Intents`.** That heading is what tells `cycle-guard` where the
intents are, and it reads nothing outside it - `cycle-close` writes a second table of the
same ids under `## Outcome`, and counting that one reported every correctly closed cycle as
a duplicate. Exactly that H2: a deeper level is not the same heading. A cycle file without
it is an error, not an empty cycle.

**The id is its own first cell, matched by its column's name.** `INV-2`, with the title in
the next column - never `INV-2 Reassign an active route` in one cell, and a row like that is
reported as unreadable rather than silently skipped. The guard reads whichever column the
header row calls `id`, so putting something ahead of it - a priority column, a team column -
does not disarm the check; a table with no column named `id` falls back to the first one.
Backticks or bold around the id are fine either way - the guard strips them before comparing.

**The status is the last cell**, whatever columns you add in between. Blocking gets no
column of its own: `blocked:INV-2` goes in the status cell, and the guard fails when that
id does not exist, is already done, or is the row itself - a stale block is the most common
way a board lies.

`Size` is a cold-start estimate and nothing else. Once the repo has closed cycles, the
forecast comes from what actually took how long, and the size column stops being an input
to anything ([ADR-029](../decision-records/ADR-029-measurement-forecasts-sizes-only-cold-start.md)).
An intent that does not finish inside its cycle gets **split**, never re-sized.

## What does not go in here

**The backlog.** `docs/backlog.md` holds everything the repo owes itself; a cycle holds
the slice somebody picked up. An intent lives in the pool **or** in exactly one cycle,
never both and never two cycles at once - `cycle-guard` fails the build when that stops
being true ([ADR-028](../decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md)).

**A running commentary.** A cycle file is state, not a diary. What happened and why it
mattered belongs in the closing note the `cycle-close` skill writes, or in a decision
record if it changed how you work.

**A person's whole week.** Only what this cycle committed to. Support rotations, reviews
and interrupts are real work, but a cycle that tries to contain all of them stops being a
commitment and becomes a timesheet.

## How you actually use it

You do not edit these by hand. Two skills own the file:

```
/cycle-open    move chosen intents out of the pool, with a goal and a date
/cycle-close   check each intent against its done, return what did not
```

`cycle-close` records the one measurement that cannot be reconstructed afterwards - what
finished inside the window - and returns the rest to the pool. Skipping it does not save
time; it destroys the only data the next forecast has.

## Decisions behind it

- **[ADR-028](../decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md) - cycles are the
  team layer.** They arrive at the `scale` profile and stay out of a solo repo entirely.
  A single maintainer already knows what they are doing this week; the ceremony would cost
  more than the answer.
- **[ADR-029](../decision-records/ADR-029-measurement-forecasts-sizes-only-cold-start.md) -
  measurement forecasts, sizes are the cold start.** Story points were rejected outright:
  with an agent in the loop the relationship between an estimate and an outcome no longer
  holds. Sizes survive only as a splitting trigger and as the fallback for a repo with no
  history. There is deliberately **no blended mode** - a forecast that mixes measured
  cycles with guesses cannot say which half it came from.
- **[ADR-030](../decision-records/ADR-030-the-current-holder-is-cycle-state-not-history.md) -
  the holder is state, not history.** One current holder, overwritten on reassignment.
  Keeping the chain of previous holders was considered and dropped: it turns a cycle file
  into an audit log, and git already is one.
