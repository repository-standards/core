---
name: sprint-close
description: Use when a stretch of work ends - "close the sprint", "the sprint is over", "we shipped what we were going to". Checks each intent against its definition of done, returns what did not finish to the backlog, and records the one measurement of the sprint that cannot be recovered afterwards.
---

# sprint-close

A sprint is ending. This is the step that keeps the backlog true and leaves behind the only
execution record the repo keeps. *(scale profile only.)*

## Why the record is written at all

The standard's ADR-010 decided that work history lives in the tracker, not the repo, and it was right about
per-item state. The standard's ADR-028 narrowed it for exactly one thing, and the argument matters here
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
   what would settle it). Refusing to close on a sprint whose items were never checked is the
   point of this step; a close that rubber-stamps teaches everyone the DoD column is
   decoration.

2. **Return what did not finish - and split it rather than re-sizing it.** Unfinished rows are
   **cut** back into the backlog (step 0) at their risk x leverage position, not appended to
   the bottom, which quietly demotes work that was important enough to commit to. Clear the
   `assignee` on the way out: the pool holds nobody's work (standard ADR-030).

   An item that did not fit is **split into what finished and what remains**, not given a
   bigger size (standard ADR-029). Propose the split; the user confirms it. Cut a **new** backlog row
   for what remains (its own id, its own DoD for the remainder), and set the original row's
   status in this sprint to **`split:<new-id>`** - the template's status vocabulary, not a
   spelling invented per repo. This is what keeps item counts comparable without an
   estimation currency, and skipping it is how throughput quietly stops meaning anything.

3. **Report rows whose status never moved.** An item that entered the sprint `todo` and left it
   `todo` is the one worth naming - usually blocked without a `blocked:` reference, or
   assigned to someone who was never really on it. State the observation, not the cause.

4. **Ask the one question the data cannot answer**: did anything get done that was never in
   the sprint? If yes, it goes into the outcome block as a count and a line, because a sprint
   that "missed" three items while absorbing two emergencies is not a sprint that
   underdelivered, and a timeline built without that reads the team as slower than it is.

5. **Write the outcome block**, once, in the sprint file:
   - planned, finished, returned to the pool
   - **returned to the pool: name the ids**, not only the count (`Returned to the pool: PAY-7,
     PAY-9`, or `Returned to the pool: none`) - `sprint-guard` checks that every id named here
     actually landed back in the backlog (step 0), and it can only do that if the row says
     which ones
   - unplanned work absorbed, if any
   - **commits in the window, scoped to whoever was holding this sprint's work** (below)
   - days elapsed, opened to closed
   Flip `Status` to `closed` and record the actual close date, which is often not the target.

6. **Scope the commit count, and say what it is scoped to.** A window on its own is not a
   scope: two teams whose sprints overlap in time both record every commit in the overlap, so
   both write down a number about the repository and neither writes down one about itself.
   That contradicts `/timeline-update`'s own rule never to blend throughput across teams.

   The sprint already holds the scope - its `assignee` column. Check the names resolve first:

   ```
   git log --since="<opened> 00:00:00" --until="<closed> 23:59:59" --format='%an' | sort | uniq -c | sort -rn
   ```

   Then count only those authors (repeat `--author`; git treats them as "any of"):

   ```
   git log --oneline --since="<opened> 00:00:00" --until="<closed> 23:59:59" --author='Ada' --author='Ravi' | wc -l
   ```

   **Write the times out**, in both commands. Git resolves a bare `--since=<date>` to that
   date at *the current time of day*, so the same command returns a different count in the
   morning than in the evening, and the two commits that sit on the boundary days by
   definition - the sprint-open and sprint-close commits - are both counted only when the open
   commit happened later in the day than the close one, which is not how a sprint runs. A
   count nobody can reproduce is worse than no count, scoped or not.

   Three results are worth stating rather than absorbing:
   - **An assignee missing from the roster.** Their name in the repo is not the name in the
     sprint, or they landed nothing in the window. Say which - a silently smaller number is
     the same defect one step down.
   - **Zero commits over the whole window.** Report it as a finding. Empty history far more
     often means the dates or the mapping are wrong than that the team wrote nothing, and the
     unscoped command fails to zero without complaining.
   - **No usable mapping at all** (say, a squash-merge repo where every author is a bot).
     Then record the repo-wide count and **label it repo-wide**. An honest wide number is
     usable; an unlabelled one gets read as this team's.

   Write the scope beside the number: `Commits in the window: 5, by Ada and Ravi`. A
   single-team repo may use the repo-wide count and should still name it as such - the day a
   second team appears, an unlabelled number is already wrong and nobody can tell.

7. **Remove the pointer row** from the backlog's active-sprints table.

8. **Prove it.** `node scripts/sprint-guard.mjs --block` - every returned row must now be in
   exactly one place again.

9. **Offer the retrospective the data supports, and no more.** Say what the numbers show -
   "planned seven, finished four, absorbed two unplanned" - and stop. Do not narrate why.
   A single sprint is one data point; `/timeline-update` is what turns several into
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
- [ ] Anything that overran was split, not re-sized - `split:<new-id>` on the row leaving,
      and the row `<new-id>` names actually cut into the pool
- [ ] The outcome block is written and `Status` is `closed`
- [ ] The commit count names the scope it was taken over, not just a window
- [ ] The pointer row is gone from the backlog
- [ ] `sprint-guard --block` passes
- [ ] A readable close table was shown, including what did not finish

## Not this

- **Do not close a sprint to tidy up.** An open sprint past its date is honest and the
  timeline reports it. A sprint closed with unmet items marked done is a lie the estimation
  arithmetic then inherits.
- **Do not write per-item history.** One aggregate block. Who did what, when it moved, how
  long review took - the tracker's, unchanged.
- **Do not compute velocity here.** One sprint is not a rate.
