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

| id | title | cap | persona | owner | assignee | size | why | DoD | status |
|----|-------|-----|---------|-------|----------|------|-----|-----|--------|
| | | | | | | | | | |

<!-- A filled example - delete this block. It sits in a comment so the guard does not
     read these ids as real rows in two places at once:

| PAY-2 | Retry the capture on a provider timeout | payments | Owner-operator Olga | dev | Ada | M | carts die on a timeout nobody sees | a timed-out capture retries once and the outcome is logged | doing |
| PAY-3 | Surface the decline reason to the guest | payments | Guest Gabor | dev | Ravi | S | "payment failed" sends people to support | the guest sees the issuer's reason, mapped to plain language | blocked:PAY-2 |
-->

## Outcome

<!-- Written once, by /cycle-close. Left empty while the cycle is open.

Planned N, finished M, returned to the pool K. Unplanned work absorbed: U.
Returned to the pool: <comma-separated ids, or `none`> - cycle-guard checks that every id
named here actually lands back in the backlog, so name them, not just the count.
Commits in the window: C. Days elapsed: D.

This is the only history the repo keeps about execution, and it is kept because it cannot
be recomputed later: git can count commits between two dates, but not that *these* intents
were what the team believed it would finish (ADR-028). -->
