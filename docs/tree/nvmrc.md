One line naming the exact Node version. The guards are dependency-free but not
version-agnostic, and CI reads this to pick its runtime.

```
24.18.0
```

Exact, not a range. `lts/*` resolves to something different in six months, which is the
whole problem R21 exists to prevent: a runtime that changes under you with no diff to review.

## Why exact, when a range would still work today

It would, right up until it does not, and the failure is the confusing kind - the same
commit passing yesterday and failing today, with nothing in the history to explain it. The
minutes saved by a range are paid back in one afternoon of that.

## What does not go in here

**A range, an alias, or a codename.** `lts/*`, `>=20`, `iron` all defeat the point.

**Your local preference.** This is what CI runs and what the repository is verified against.
If your machine needs something else, that is your machine's problem to reconcile - which
is exactly what the file lets you notice.

## Decisions behind it

- **R21 - everything a repository consumes is pinned exact and moves by a reviewed diff.**
  The runtime is consumed like anything else.
- **It ships as `copy` rather than `fill-from-repo`.** The standard's guards were tested
  against a specific runtime, so shipping a version is more useful than shipping a blank -
  and changing it is one line in a pull request that says why.
