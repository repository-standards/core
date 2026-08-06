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

0. **Resolve the backlog path once, the way the guard does.** Check `docs/backlog.md` first,
   then `backlog.md` (the manifest's primary path, R15) - whichever exists is the pool for
   every step below.

1. **Check each intent against its own definition of done, and say what you checked.** The
   DoD is in the row. "The spec is buildable", "the ADR is Accepted", "the drift is
   resolved" - these are verifiable, so verify them rather than asking the user whether it
   feels finished. Report per item: met, not met, or **cannot tell from here** (then say
   what would settle it). Refusing to close on a cycle whose items were never checked is the
   point of this step; a close that rubber-stamps teaches everyone the DoD column is
   decoration.

2. **Return what did not finish - and split it rather than re-sizing it.** Unfinished rows are
   **cut** back into the backlog (step 0) at their risk x leverage position, not appended to
   the bottom, which quietly demotes work that was important enough to commit to. Clear the
   `assignee` on the way out: the pool holds nobody's work (ADR-030).

   An item that did not fit is **split into what finished and what remains**, not given a
   bigger size (ADR-029). Propose the split; the user confirms it. Cut a **new** backlog row
   for what remains (its own id, its own DoD for the remainder), and set the original row's
   status in this cycle to **`split:<new-id>`** - the template's status vocabulary, not a
   spelling invented per repo. This is what keeps item counts comparable without an
   estimation currency, and skipping it is how throughput quietly stops meaning anything.

3. **Report rows whose status never moved.** An item that entered the cycle `todo` and left it
   `todo` is the one worth naming - usually blocked without a `blocked:` reference, or
   assigned to someone who was never really on it. State the observation, not the cause.

4. **Ask the one question the data cannot answer**: did anything get done that was never in
   the cycle? If yes, it goes into the outcome block as a count and a line, because a cycle
   that "missed" three items while absorbing two emergencies is not a cycle that
   underdelivered, and a timeline built without that reads the team as slower than it is.

5. **Write the outcome block**, once, in the cycle file:
   - planned, finished, returned to the pool
   - **returned to the pool: name the ids**, not only the count (`Returned to the pool: PAY-7,
     PAY-9`, or `Returned to the pool: none`) - `cycle-guard` checks that every id named here
     actually landed back in the backlog (step 0), and it can only do that if the row says
     which ones
   - unplanned work absorbed, if any
   - commits in the window:
     `git log --oneline --since="<opened> 00:00:00" --until="<closed> 23:59:59" | wc -l`.
     **Write the times out.** Git resolves a bare `--since=<date>` to that date at *the
     current time of day*, so the same command returns a different count in the morning
     than in the evening, and the two commits that sit on the boundary days by definition -
     the cycle-open and cycle-close commits - are both counted only when the open commit
     happened later in the day than the close one, which is not how a cycle runs. A count
     nobody can reproduce is worse than no count.
   - days elapsed, opened to closed
   Flip `Status` to `closed` and record the actual close date, which is often not the target.

6. **Remove the pointer row** from the backlog's active-cycles table.

7. **Prove it.** `node scripts/cycle-guard.mjs --block` - every returned row must now be in
   exactly one place again.

8. **Offer the retrospective the data supports, and no more.** Say what the numbers show -
   "planned seven, finished four, absorbed two unplanned" - and stop. Do not narrate why.
   A single cycle is one data point; `/timeline-update` is what turns several into
   throughput, and it refuses to project from too few.

## Show the close, do not just file it

This is the moment a team looks at, so end with a table a person can read: each intent, its
assignee, whether its DoD was met, and where it went (stayed / returned / split). Then the
counts in one line - planned, finished, returned, unplanned absorbed, days elapsed.

That table is the artifact someone screenshots into a channel. It should need no editing, and
it should not hide the rows that did not make it.

## Done when

- [ ] Every intent was checked against its DoD and the result reported
- [ ] Unfinished rows are back in the pool at their position, not at the bottom, with the
      assignee cleared
- [ ] Anything that overran was split, not re-sized
- [ ] The outcome block is written and `Status` is `closed`
- [ ] The pointer row is gone from the backlog
- [ ] `cycle-guard --block` passes
- [ ] A readable close table was shown, including what did not finish

## Not this

- **Do not close a cycle to tidy up.** An open cycle past its date is honest and the
  timeline reports it. A cycle closed with unmet items marked done is a lie the estimation
  arithmetic then inherits.
- **Do not write per-item history.** One aggregate block. Who did what, when it moved, how
  long review took - the tracker's, unchanged.
- **Do not compute velocity here.** One cycle is not a rate.
