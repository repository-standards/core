---
name: cycle-open
description: Use when a team is picking up work for the next stretch - "let's start a cycle", "what are we doing this month", "pull the top three payment items into a sprint". Creates the cycle with its goal and agreed end date, and moves the chosen intents out of the backlog pool so each one lives in exactly one place.
---

# cycle-open

A team is committing to a stretch of work. This creates the cycle and moves the intents
into it. *(scale profile only - a `core` repo has a backlog and needs nothing else.)*

What a cycle is, and what belongs in one: [cycles (by reference)](https://github.com/repository-standards/core/blob/main/docs/tree/docs-cycles.md).
This is how one is opened.

## Steps

1. **Which team, and is there already an open cycle for them?** Look under `docs/cycles/`.
   A team with one already open is the common case worth catching: ask whether this is a
   second parallel cycle (legitimate - a team can run two threads) or whether the open one
   should be closed first. Do not open a duplicate silently.

2. **Ask for the goal, and push back once if it is a list.** The goal is the outcome, not
   the items: "checkout stops losing carts", never "do PAY-2, PAY-3 and PAY-7". If the
   answer restates the items, ask what becomes true when they are done - a cycle whose goal
   is its own contents tells the timeline nothing and tells the team nothing either.

3. **Ask for the target date, and say what it is.** Agreed and movable, not a deadline;
   nothing enforces it and the timeline reports a cycle past its date rather than failing
   it. If the user has no date in mind, propose one from the last closed cycle's length -
   and say that is where it came from.

4. **Propose the intents, do not ask for a list.** Read `docs/backlog.md` and offer the top
   items by the order already there (risk x leverage), grouped by capability, with the count
   the team can realistically hold if past cycles give any evidence. The user corrects a
   proposal far faster than they assemble one. Confirm before moving anything.

5. **Move the rows, do not copy them.** Each chosen row is **cut** from `docs/backlog.md`
   and pasted into the cycle file unchanged - same columns, same values. An intent lives in
   the pool or in exactly one cycle, and copying is how that stops being true.

   One cell fills on the way in: **`assignee`**, the person taking it (ADR-030). Ask for the
   names once, as a set, rather than row by row. A row arriving with no assignee is work the
   cycle has not really committed to - say so, and accept it if the team means it, because a
   deliberately unassigned item is honest and a silently unassigned one is not.

   **Flag any `L` that is being pulled unsplit.** An `L` means split before pulling
   (ADR-029); pulling one anyway is a choice the team can make, but not one to make by
   accident.

6. **Write the cycle file** from [`docs/cycles/_template.md`](../../../docs/cycles/_template.md)
   at `docs/cycles/<team>/<slug>.md` - lowercase kebab-case, a slug that will still mean
   something in six months (`2026-08-checkout`, not `sprint-4`).

7. **Add the pointer row** to `docs/backlog.md`'s active-cycles table: team, goal, target,
   link, item count. The pool stays the single entry point without duplicating a row.

8. **Prove it.** Run `node scripts/cycle-guard.mjs --block`. A failure here means a row was
   copied rather than moved, and it is the whole reason the guard exists.

## Done when

- [ ] The cycle file exists with a goal that is an outcome, a target date, and its rows
- [ ] Every moved row is **gone** from `docs/backlog.md`
- [ ] The pool carries a pointer row for the new cycle
- [ ] `cycle-guard --block` passes

## Not this

- **Do not invent intents.** A cycle holds items that were already in the pool. Work
  discovered while opening a cycle goes through `add-to-backlog` first, then in - so it
  keeps its source and its definition of done.
- **Do not record who *used to* hold an item.** `assignee` is present tense and reassignment
  overwrites it; the trail of who touched what is the tracker's (ADR-010, narrowed by
  ADR-030). If a team needs that trail, they need a tracker.
- **Do not assign in the pool.** An item nobody has picked up is not yet anyone's, and a pool
  that assigns work has quietly become a queue of orders.
- **Do not set a length policy.** Two-week cycles are a choice a team may make; the standard
  has no opinion and should not grow one.
