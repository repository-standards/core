---
name: cycle-close
description: Use when a stretch of work ends - "close the cycle", "the sprint is over", "we shipped what we were going to". Checks each intent against its definition of done, returns what did not finish to the backlog, and records the one measurement of the cycle that cannot be recovered afterwards.
---

# cycle-close

A cycle is ending. This is the step that keeps the backlog true and leaves behind the only
execution record the repo keeps. *(scale profile only.)*

## Why the record is written at all

ADR-010 decided that work history lives in the tracker, not the repo, and it was right about
per-item state. ADR-028 narrowed it for exactly one thing, and the argument matters here
because this skill is what writes it: **the grouping is not recoverable afterwards.** Git
can always count commits between two dates. It cannot reconstruct that *these seven intents*
were what the team believed it would finish - the pool mutates, items get re-scoped, and the
version of the backlog that made the plan is only reachable by knowing which commit to read.

So this writes one block. Not a log, not per-item history. If you find yourself recording
who did what, stop - that is the tracker's.

## Steps

1. **Check each intent against its own definition of done, and say what you checked.** The
   DoD is in the row. "The spec is buildable", "the ADR is Accepted", "the drift is
   resolved" - these are verifiable, so verify them rather than asking the user whether it
   feels finished. Report per item: met, not met, or **cannot tell from here** (then say
   what would settle it). Refusing to close on a cycle whose items were never checked is the
   point of this step; a close that rubber-stamps teaches everyone the DoD column is
   decoration.

2. **Return what did not finish.** Unfinished rows are **cut** back into `docs/backlog.md`,
   unchanged, at their risk x leverage position - not appended to the bottom, which quietly
   demotes work that was important enough to commit to. If an item's scope changed while in
   flight, say so and let the user re-word the row before it goes back.

3. **Ask the one question the data cannot answer**: did anything get done that was never in
   the cycle? If yes, it goes into the outcome block as a count and a line, because a cycle
   that "missed" three items while absorbing two emergencies is not a cycle that
   underdelivered, and a timeline built without that reads the team as slower than it is.

4. **Write the outcome block**, once, in the cycle file:
   - planned, finished, returned to the pool
   - unplanned work absorbed, if any
   - commits in the window: `git log --oneline --since=<opened> --until=<closed> | wc -l`
   - days elapsed, opened to closed
   Flip `Status` to `closed` and record the actual close date, which is often not the target.

5. **Remove the pointer row** from `docs/backlog.md`'s active-cycles table.

6. **Prove it.** `node scripts/cycle-guard.mjs --block` - every returned row must now be in
   exactly one place again.

7. **Offer the retrospective the data supports, and no more.** Say what the numbers show -
   "planned seven, finished four, absorbed two unplanned" - and stop. Do not narrate why.
   A single cycle is one data point; `/timeline-update` is what turns several into
   throughput, and it refuses to project from too few.

## Done when

- [ ] Every intent was checked against its DoD and the result reported
- [ ] Unfinished rows are back in the pool at their position, not at the bottom
- [ ] The outcome block is written and `Status` is `closed`
- [ ] The pointer row is gone from the backlog
- [ ] `cycle-guard --block` passes

## Not this

- **Do not close a cycle to tidy up.** An open cycle past its date is honest and the
  timeline reports it. A cycle closed with unmet items marked done is a lie the estimation
  arithmetic then inherits.
- **Do not write per-item history.** One aggregate block. Who did what, when it moved, how
  long review took - the tracker's, unchanged.
- **Do not compute velocity here.** One cycle is not a rate.
