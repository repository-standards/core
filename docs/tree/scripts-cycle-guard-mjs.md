Proves the one-place invariant: an intent lives in the backlog pool **or** in exactly one
cycle, never both and never two.

```
node scripts/cycle-guard.mjs --block
```

Scale profile. A repository that does not run cycles has nothing for it to check.

## What it refuses to let happen

**The same intent in two places.** That is how "what are we doing right now" stops being
answerable from the files: two answers, both plausible, neither marked stale.

**A block that points at nothing.** `Blocked by: INV-3` is checked against the intents that
exist. A stale block is the most common way a board lies, because it looks like information.

**A closed cycle still holding what it did not finish.** Work that did not land returns to
the pool; a cycle keeping it makes the pool an incomplete list of what is owed.

## How it reads a row

Status is taken from the **last cell** of the row, so a team adding a column of its own
cannot switch the guard off by accident. Block references are matched case-insensitively
against ids of the form `ABC-123`.

The block checks run **with or without cycles present** - they were once inside the
cycle-scanning branch, which meant a repository with no open cycle had its stale blocks
checked by nothing.

## Decisions behind it

- **[ADR-028](../decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md) -
  cycles are the team layer.** A solo repository has a backlog and needs nothing else.
- **The invariant is mechanical rather than a convention.** "Remember to remove it from the
  pool" is exactly the kind of instruction that holds for three weeks.
