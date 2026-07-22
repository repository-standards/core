---
name: add-to-backlog
description: Capture a work item into the repo's backlog in one step, well-formed and agent-first - when you spot work mid-flow that is out of scope for the current change, file it here instead of doing it now or losing it. Enforces the backlog's own rules (a real source, a definition of done, no duplicates).
---

# add-to-backlog

You are mid-change and you notice work that does not belong in this change - a missing
spec, a decision that should be recorded, drift you are not fixing now, dead code. Do not
silently do it (scope creep) and do not lose it (evaporation). File it in the repo's backlog ledger (`backlog.md` or `docs/backlog.md`, per the manifest).

This operationalizes the rules in `docs/backlog.md` - every item has a **source** and a
**definition of done**, and the list stays ordered and de-duplicated.

## Two automatic triggers

Two moments in the spec workflow file items here without being asked:

- **After `/spec-update`** - target-state deltas the current change will not build:
  one item per unbuilt delta, source = the spec diff.
- **After `/spec-reconcile`** - code<->spec drift findings not fixed in the current
  change: one item per finding, source = the drift finding.

In both cases the agent writes well-formed rows itself using the format below,
de-duplicating against existing items first.

## Steps

1. **Check it is a real item.** It must trace to a source: a spec delta, a code<->spec
   drift finding, a missing decision, onboarding, or an explicit request. A vague wish
   with no source is not a backlog item - drop it.

2. **De-duplicate.** Scan the ledger; if the item (or a superset of it) is already
   there, stop - do not file a second one. Sharpen the existing row instead if needed.

3. **Place and name it.** Pick the epic it belongs to (or note a genuinely new epic).
   Give it a stable, scoped id (`SPEC-3`, `ADR-auth`, `DRIFT-2`) that will not be reused.

4. **Write the row** with every column: `id`, `title`, `why` (one line), `DoD` (the
   observable finish line - "spec is buildable", "ADR Accepted", "drift resolved"),
   `status: todo`. Slot it by **risk x leverage** (money / security / external contracts
   / data integrity first; then churn), not at the bottom by default.

5. **Do not do the work now**, and do not make the decision here - "write an ADR for X"
   is a backlog item; the decision itself is made in the ADR when the item is worked.

## Not this

- Not a dumping ground for vague ideas - no source, no DoD, no item.
- Not a duplicate tracker - reconcile with the existing row instead of adding another.
- Not a second issue tracker kept in sync by hand - this is the in-repo, agent-first
  view; mirror to an external tracker only if the team already lives there.
