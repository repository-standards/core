---
name: add-to-backlog
description: Use when work surfaces that does not belong to this change - a bug mentioned in passing ("btw the export is broken"), "we should fix that too", "park it", "not now but do not lose it". Files one well-formed row with its source, the role that must act and what done looks like, ordered against what is already there, without interrupting what you were doing. This adds to the backlog and never reads it back: "show me the backlog" is `show-backlog`.
---

# add-to-backlog

You are mid-change and you notice work that does not belong in this change - a missing
spec, a decision that should be recorded, drift you are not fixing now, dead code. Do not
silently do it (scope creep) and do not lose it (evaporation). File it in the repo's backlog ledger (`backlog.md` or `docs/backlog.md`, per the manifest).

This operationalizes the rules in `docs/backlog.md` - every item has a **source** and a
**definition of done**, and the list stays ordered and de-duplicated.

## Three automatic triggers

Three moments in the spec workflow file items here without being asked:

- **After `/spec-impact`** - a ripple the analysis found (an affected capability, a
  needed ADR/BDR, a code area) that the current change deliberately will not
  address: one item per unaddressed ripple, `source: decision` naming the impact analysis.
- **After `/spec-update`** - target-state deltas the current change will not build:
  one item per unbuilt delta, `source: spec-delta` naming the spec diff.
- **After `/spec-reconcile`** - code<->spec drift findings not fixed in the current
  change: one item per finding, `source: drift` naming the finding.

In all three cases the agent writes well-formed rows itself using the format below,
de-duplicating against existing items first.

## Steps

1. **Check it is a real item.** It must trace to a source, and the ledger declares which
   ones: `onboarding`, `spec-delta`, `drift`, `decision`, `asked`. A vague wish with no
   source is not a backlog item - drop it.

2. **De-duplicate.** Scan the ledger; if the item (or a superset of it) is already
   there, stop - do not file a second one. Sharpen the existing row instead if needed.
   De-duplicate on the **title**, not only on the id: `sprint-guard` reads one title in two
   places under two ids as one intent duplicated, and it is right to.

3. **Place and name it.** Pick the epic it belongs to (or note a genuinely new epic).
   Give it a stable id that will not be reused, following the one convention the ledger
   states: the prefix is the item's `cap` where it has one (`INV-3`, `PAY-2`) and the
   artifact type where `cap` is `-` (`ADR-auth`, `DRIFT-2`). Note that the *kind* of work
   does not decide it - a drift fix inside a capability is still `INV-4`, not `DRIFT-4`. The
   convention lives in `docs/backlog.md`; do not restate it, and do not invent a second one.

4. **Write the row** with every column the backlog declares: `id`, `title`, `cap` (the
   capability it touches, or `-`), `persona` (from `docs/personas.md` - an item that serves
   no persona is parked, not queued; internal work names `Maintainer (internal)`, which the
   ledger declares for exactly this, rather than borrowing an end-user persona), `owner`
   (the **role** that must act: `product`, `architect`, `dev` or `agent`), `why` (one line),
   `source` (the category from step 1, plus where it came from if there is anywhere to
   point: `drift: spec-reconcile 2026-08-04`, `asked: #212`), `DoD` (the observable finish
   line - "spec is buildable", "ADR Accepted", "drift resolved"), `status: todo`. A row
   missing `cap`, `persona`, `owner` or `source` fails the backlog's own Definition of
   Ready, so it cannot be pulled - writing it short only moves the work to whoever pulls it.
   Slot it by **risk x leverage** (money / security / external contracts / data integrity
   first; then churn), not at the bottom by default.

   Leave `assignee` empty - a pool item is nobody's yet (ADR-030). Offer a `size` of `S`, `M`
   or `L` if the shape is clear enough to be worth one, and skip it otherwise: an unsized row
   is a normal row, not an incomplete one. If it looks like an `L`, say so and suggest the
   split now, while the work is still fresh in mind - that is the whole job the field does
   (ADR-029).

5. **Do not do the work now**, and do not make the decision here - "write an ADR for X"
   is a backlog item; the decision itself is made in the ADR when the item is worked.

## Not this

- Not a dumping ground for vague ideas - no source, no DoD, no item.
- Not a duplicate tracker - reconcile with the existing row instead of adding another.
- Not a second issue tracker kept in sync by hand - this is the in-repo, agent-first
  view; mirror to an external tracker only if the team already lives there.
