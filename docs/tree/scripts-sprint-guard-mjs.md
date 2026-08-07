Proves the one-place invariant: an intent lives in the backlog pool **or** in exactly one
sprint, never both and never two.

```
node scripts/sprint-guard.mjs --block
```

Scale profile. A repository that does not run sprints has nothing for it to check.

## What it refuses to let happen

**The same intent in two places.** That is how "what are we doing right now" stops being
answerable from the files: two answers, both plausible, neither marked stale.

**The same intent in two places under two ids.** Copy a row into a sprint, renumber the copy
left in the pool, and every check keyed on the id agrees that nothing is wrong. So the title
is checked too: one title in two files under two ids is one piece of work in two places. The
one legitimate pair - a `split:<id>` row and the remainder row it names - is exempt.

**A block that points at nothing, or at work that is finished.** `blocked:INV-3` is checked
against the intents that exist, including `split:<id>` rows: a split row finished the part it
still covers, so a block on it has stopped applying exactly as a block on a `done` row has. A
stale block is the most common way a board lies, because it looks like information.

**A split whose remainder was never cut.** `split:INV-2b` says INV-2b holds what is left. If
no such row exists, the remainder is work that vanished at the close - and reading the status
as finished without checking it would make three words in a cell a way to retire any row.

**A closed sprint still holding what it did not finish.** Work that did not land returns to
the pool; a sprint keeping it makes the pool an incomplete list of what is owed.

**A pool pointing at a sprint that closed, or counting it wrong.** The `## In flight` table is
what keeps the pool the single place to start reading. `/sprint-open` writes its row and
`/sprint-close` removes it, so a row naming a closed sprint is one nobody removed, and an item
count that disagrees with the sprint's real rows is the pool describing work it cannot see.
Once the table holds any row, an open sprint nothing points at is caught too - otherwise
deleting the row would be the cheapest way past all of it.

## How it reads a row

Status is taken from the **last cell** of the row, so a team adding a column of its own
cannot switch the guard off by accident. The title is taken from the column the header names
`title`, falling back to the cell after the id, and compared with markup stripped and
whitespace collapsed - a copied row picks up cosmetic edits, and they should not hide it.

Block and split references resolve to the row that declares the id **without regard to
case**, and are reported using that row's own spelling. `ADR-auth` and `INV-2b` are documented
id shapes, so a verbatim comparison fails a difference the author cannot see, and uppercasing
the reference to compare it - which this guard did - failed `ADR-auth` outright.

The block checks run **with or without sprints present** - they were once inside the
sprint-scanning branch, which meant a repository with no open sprint had its stale blocks
checked by nothing.

## Decisions behind it

- **[ADR-028](../decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md) -
  sprints are the team layer.** A solo repository has a backlog and needs nothing else.
- **The invariant is mechanical rather than a convention.** "Remember to remove it from the
  pool" is exactly the kind of instruction that holds for three weeks.
