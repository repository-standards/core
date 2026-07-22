---
name: backlog-from-specs
description: Derive backlog items from the two spec signals - a spec delta (spec-update wrote a target the code has not reached) and a drift finding (spec-reconcile found code and spec disagree and you are not fixing it now). The backlog should fall out of the spec workflow automatically, not be assembled by hand.
disable-model-invocation: true
---

# backlog-from-specs

The steady-state feeder for the backlog once a repo is on the standard. Two moments in
the spec workflow produce work that is real but out of scope for the current change -
turn each into a backlog item so nothing evaporates. Uses `add-to-backlog`'s format.

## From a spec delta (after `spec-update`)

The spec on the branch describes the **target**; `git diff` is the delta. For each target
behavior the spec now requires that the current change does **not** implement or test:

- file an item: *"implement / verify `<behavior>` in `<capability>`"*, `DoD` = the spec's
  acceptance criteria for it are met and tested.
- Do **not** file items for behavior this change already ships.

## From a drift finding (after `spec-reconcile`)

`spec-reconcile` compares spec vs code vs tests. For each disagreement you are **not**
resolving in this change (spec says X, code does Y; code has behavior no spec describes;
a scenario with no implementation):

- file an item: *"reconcile `<capability>`: `<the disagreement>`"*, `DoD` = spec matches
  real behavior (or the code is fixed) and the coupling guard is green.
- A drift you **do** resolve now is not a backlog item - it is part of this change.

## Rules

- Every derived item traces to a specific spec delta or a specific drift finding - no
  invented work, no invented capabilities.
- De-duplicate against the existing backlog before filing (see `add-to-backlog`).
- Order by risk x leverage; a money / security / contract drift outranks cosmetics.

## Not this

- Not re-filing a drift that was already resolved or already tracked.
- Not a substitute for fixing small drift inline - if it is cheap and in scope, fix it
  and reconcile, do not defer it to the backlog.
