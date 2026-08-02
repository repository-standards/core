# Work cycles - what a team committed to, and by when *(scale)*

One file per cycle at `docs/cycles/<team>/<slug>.md`. A cycle is a bounded period of work
with an owner, a goal and an **agreed** end date - several run in parallel, one directory
per team, no fixed length and no ceremony. Decided in ADR-028; a `core` repo never meets
any of this and loses nothing by it.

## You have this case - say this

**A team is picking up work for the next stretch.** The common one:

```
> open a cycle for the payments team - goal is that checkout stops losing carts,
> aim for the end of the month, pull in the top three payment items
```

**Something is finished, or the date arrived.** Closing returns what did not get done to
the pool, so the backlog is true again the moment the cycle ends:

```
> close the payments cycle - PAY-2 and PAY-3 shipped, PAY-7 did not
```

**Someone asks when things land.** The timeline is derived from the closed cycles, never
typed - and if there is not enough history to support a date, it says so and gives none:

```
> when does the billing work land?
```

It lives at `TIMELINE.md` in this folder, regenerated whole each time. Three skills maintain
all of this: `/cycle-open`, `/cycle-close`, `/timeline-update`. None of them waits to be
called by name.

**You are not sure something belongs in a cycle at all.** It probably does not - a cycle
holds intents a team committed to *now*. Everything else stays in the pool, which is the
default and costs nothing.

## The one rule

**An intent is in the backlog pool, or in exactly one cycle. Never both, never two.**

Pulling an item into a cycle removes its row from `docs/backlog.md`; closing a cycle
unfinished returns it. `scripts/cycle-guard.mjs` checks this and fails when an id turns up
twice - including across two teams, because two teams believing they own the same intent is
exactly the failure worth catching early.

The reason is not tidiness. A backlog that also lists what is already in flight stops being
a list of what is left, and once nobody trusts it, nobody reads it.

## The shape

Start from [`_template.md`](_template.md). Front matter says who owns it, what it is for,
when it opened and when it is aimed at; then one table of intents carrying the same columns
the backlog declares, so a row moves between the two files unchanged.

The **Goal** is an outcome, not a restatement of the item list - "checkout stops losing
carts", not "do PAY-2, PAY-3 and PAY-7". If the goal is only the items, the cycle is a
container rather than a commitment and the timeline will not mean anything.

The **Target** date is agreed and movable. Nothing enforces it; the timeline reports a cycle
past its date and still open rather than treating it as a failure. A date nobody can move is
a deadline, and this is deliberately not that.

## Not this

- **Not a sprint.** No fixed cadence, no planning ritual, no velocity as a commitment. If a
  team wants those, their tracker has them.
- **Not per-item state tracking.** Whether something is in review or on someone's machine
  lives in the tracker (ADR-010). The cycle records what was committed to and, once, what
  came of it.
- **Not a second backlog.** The pool is the single list; a cycle is a slice of it that left.
