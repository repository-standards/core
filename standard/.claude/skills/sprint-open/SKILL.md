---
name: sprint-open
description: Use when a team is picking up work for the next stretch - "let's start a sprint", "what are we doing this month", "pull the top three payment items into a sprint". Creates the sprint with its goal and agreed end date, and moves the chosen intents out of the backlog pool so each one lives in exactly one place. Also owns reading an open sprint back as a status board ("how is the dispatch sprint going?") and mid-sprint edits - moving a status, reassigning a holder - that happen between opening and closing.
---

# sprint-open

A team is committing to a stretch of work. This creates the sprint and moves the intents
into it. *(scale profile only - a `core` repo has a backlog and needs nothing else.)*

What a sprint is, and what belongs in one: [sprints (by reference)](https://github.com/repository-standards/core/blob/main/docs/tree/docs-sprints.md).
This is how one is opened.

## Steps

0. **Resolve the backlog path once, the way the guard does.** Check `docs/backlog.md` first,
   then `backlog.md` (the manifest's primary path, R15) - whichever exists is the pool for
   every step below. Do not assume `docs/backlog.md`; a repo that satisfies the manifest at
   its primary path has no other file to read.

1. **Which team, and is there already an open sprint for them?** Look under `docs/sprints/`.
   A team with one already open is the common case worth catching: ask whether this is a
   second parallel sprint (legitimate - a team can run two threads) or whether the open one
   should be closed first. Do not open a duplicate silently.

2. **Ask for the goal, and push back once if it is a list.** The goal is the outcome, not
   the items: "checkout stops losing carts", never "do PAY-2, PAY-3 and PAY-7". If the
   answer restates the items, ask what becomes true when they are done - a sprint whose goal
   is its own contents tells the timeline nothing and tells the team nothing either.

3. **Ask for the target date, and say what it is.** Agreed and movable, not a deadline;
   nothing enforces it and the timeline reports a sprint past its date rather than failing
   it. If the user has no date in mind, propose one from the last closed sprint's length -
   and say that is where it came from.

4. **Propose the intents, do not ask for a list.** Read the backlog (step 0) and offer the top
   items by the order already there (risk x leverage), grouped by capability, with the count
   the team can realistically hold if past sprints give any evidence. The user corrects a
   proposal far faster than they assemble one. Confirm before moving anything.

5. **Move the rows, do not copy them.** Each chosen row is **cut** from the backlog and
   pasted into the sprint file unchanged - same columns, same values. An intent lives in
   the pool or in exactly one sprint, and copying is how that stops being true.

   One cell fills on the way in: **`assignee`**, the person taking it (standard ADR-030). Ask for the
   names once, as a set, rather than row by row. A row arriving with no assignee is work the
   sprint has not really committed to - say so, and accept it if the team means it, because a
   deliberately unassigned item is honest and a silently unassigned one is not.

   **Flag any `L` that is being pulled unsplit.** An `L` means split before pulling
   (standard ADR-029); pulling one anyway is a choice the team can make, but not one to make by
   accident.

6. **Write the sprint file** from [`docs/sprints/_template.md`](../../../docs/sprints/_template.md)
   at `docs/sprints/<team>/<slug>.md` - lowercase kebab-case, a slug that will still mean
   something in six months (`2026-08-checkout`, not `sprint-4`).

   Keep the template's structure: the rows sit under the `## Intents` H2, the id is the first
   cell and the status is the last. That is `sprint-guard`'s interface, not a house style - it
   reads intents only from that section, and a file that renames or drops the heading yields
   no rows at all, which is indistinguishable from a sprint with nothing wrong in it.

7. **Add the pointer row** to the backlog's active-sprints table: team, goal, target,
   link, item count. The pool stays the single entry point without duplicating a row.

8. **Prove it.** Run `node scripts/sprint-guard.mjs --block`. A failure here means a row was
   copied rather than moved, and it is the whole reason the guard exists.

## Done when

- [ ] The sprint file exists with a goal that is an outcome, a target date, and its rows
- [ ] Every moved row is **gone** from the backlog (whichever path resolved in step 0)
- [ ] The pool carries a pointer row for the new sprint
- [ ] `sprint-guard --block` passes

## Not this

- **Do not invent intents.** A sprint holds items that were already in the pool. Work
  discovered while opening a sprint goes through `add-to-backlog` first, then in - so it
  keeps its source and its definition of done.
- **Do not record who *used to* hold an item.** `assignee` is present tense and reassignment
  overwrites it; the trail of who touched what is the tracker's (standard ADR-010, narrowed by
  standard ADR-030). If a team needs that trail, they need a tracker.
- **Do not assign in the pool.** An item nobody has picked up is not yet anyone's, and a pool
  that assigns work has quietly become a queue of orders.
- **Do not set a length policy.** Two-week sprints are a choice a team may make; the standard
  has no opinion and should not grow one.

## Reading a sprint back

A sprint is a markdown file - read it directly for one row's answer. For "how is the dispatch
sprint going", render it as a board instead, because a person acts on the shape faster than on
a table: group every row under `## Intents` by its status cell into three lanes, `done`,
`doing` and `todo`. Show id, title and holder (`assignee`) per row - the three things the
file exists to answer. An empty `assignee` is worth naming, the same way the file itself
calls that a gap.

**A `blocked:<id>` row goes in `doing`, and the board must show the id it names.** Blocked is
not a fourth place work sits, it is a thing that is true about work somebody is holding - so
the row keeps its lane and carries the reference on it (`blocked - waiting on NOTIF-6`).
Dropping it, or moving the row to `todo` without it, loses the only fact that row was worth
rendering for. A `split:<id>` row groups with `done` and names the remainder the same way: it
is finished work, and `<id>` is where the rest of it went.

This is a grouping of what the row already stores, nothing computed and no date attached -
that is `timeline-update`'s job, and it correctly refuses to project an open sprint. This only
shows what the file says right now.

## Editing a sprint mid-flight

Between opening and closing, a sprint changes hands and status without either boundary skill
running. These are plain table edits - say so precisely rather than leaving it to inference:

- **Moving a status** ("PAY-3 is done now", "start on PAY-4"): edit that row's status cell in
  place - the last cell, whatever the column count. Use `blocked:<id>` when it is waiting on
  another intent named by id, plain `todo` / `doing` / `done` otherwise.
- **Reassigning a holder** ("give PAY-3 to Ravi"): overwrite the `assignee` cell in place. It
  is present-tense state, not a log (standard ADR-030) - the previous holder is not kept here; a team
  that needs that trail needs a tracker.
- **Prove it after either edit.** `node scripts/sprint-guard.mjs --block` - a status edit that
  invents a `blocked:<id>` pointing at nothing, or an edit that duplicates the row instead of
  changing it in place, is exactly what the guard exists to catch.
