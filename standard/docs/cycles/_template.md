# Cycle: <slug>

| | |
| --- | --- |
| **Team** | <team - the directory this file sits in> |
| **Owner** | <who decides when this ends and whether the date moves> |
| **Goal** | <one sentence: the outcome, not the item list> |
| **Opened** | YYYY-MM-DD |
| **Target** | YYYY-MM-DD <agreed, movable - not a deadline> |
| **Status** | open |

## Intents

Rows move here from `docs/backlog.md` unchanged, and leave the pool when they do - an
intent is in one place or the other, never both. Same columns as the backlog.

One column fills on the way in: **`assignee`**, the person doing it. In the pool it is empty
by definition - an item nobody has picked up is not yet anyone's - and a row that arrives
here without one is work the cycle has not really committed to.

Statuses: `todo` / `doing` / `blocked:<id>` / `done` / **`split:<id>`** - the last one is a
cycle-boundary answer only, written by `/cycle-close`: the row leaving this cycle finished
*part* of itself, and `<id>` names the new backlog row you cut for what remains. Do not
invent your own spelling for this (`split -> IMPL-3` and similar have been seen) - the
guard's `blocked:<id>` shape is the model, and this is the same shape for the same reason.

`cycle-guard` reads both references. A `split:<id>` row is **finished work**, so a
`blocked:` pointing at it is stale exactly as one pointing at a `done` row is; and the
remainder it names must be a row that exists and is not this one, or the split is work that
vanished at the close.

| id | title | cap | persona | owner | assignee | size | why | source | DoD | status |
|----|-------|-----|---------|-------|----------|------|-----|--------|-----|--------|
| | | | | | | | | | | |

<!-- A filled example - delete this block. It sits in a comment so the guard does not
     read these ids as real rows in two places at once:

| PAY-2 | Retry the capture on a provider timeout | payments | Owner-operator Olga | dev | Ada | M | carts die on a timeout nobody sees | drift: spec-reconcile 2026-07-30 | a timed-out capture retries once and the outcome is logged | doing |
| PAY-3 | Surface the decline reason to the guest | payments | Guest Gabor | dev | Ravi | S | "payment failed" sends people to support | asked | the guest sees the issuer's reason, mapped to plain language | blocked:PAY-2 |
-->

## Outcome

<!-- Written once, by /cycle-close. Left empty while the cycle is open.

Planned N, finished M, returned to the pool K. Unplanned work absorbed: U.
Returned to the pool: <comma-separated ids, or `none`> - cycle-guard checks that every id
named here actually lands back in the backlog, so name them, not just the count.
Commits in the window: C, by <the holders this cycle recorded>. Days elapsed: D.

The commit count names whose commits it counted, because a repo-wide count over a window is
not this cycle's number when another team's cycle overlaps it - both cycles record the same
blended figure and neither is about the team that wrote it.

This is the only history the repo keeps about execution, and it is kept because it cannot
be recomputed later: git can count commits between two dates, but not that *these* intents
were what the team believed it would finish (ADR-028). -->
