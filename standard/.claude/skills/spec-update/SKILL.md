---
name: spec-update
description: Use when behaviour is about to change and the specs need to say how it will work afterwards, before the code moves. On a branch the spec is the target and the git diff is the delta. Updates every affected spec, not only the one that came to mind.
---

# spec-update

The spec is the driver. Change it **first** - describe how the capability should
work and look after this change - then plan, then code. This is the "spec changed
during work" step.

## Steps

1. From `spec-impact`, take the primary + affected capabilities. If any of them
   has `Status: retired`, stop before editing it - `spec-impact` should have
   already caught this, but do not extend a retired capability just because its
   spec file is still there to edit.

2. For **each** affected spec, edit it **in place** to the target state: behavior,
   business rules, invariants, lifecycle, edge cases, forbidden scenarios. Describe
   how it works (`MUST` / `MAY` / `MUST NOT`), not the ticket. Preserve unrelated
   behavior; avoid needless rewrites.

3. Do **not** fork (`payments-v2`, `split-payments-new`). Update the existing
   capability spec. Create a new capability spec only for a genuinely new domain.

4. If the change needs a decision, write or point to the ADR - the **decision**
   lives in the ADR, the **behavior** in the spec.

5. Now the spec on this branch describes the **target**; `git diff` against `main`
   is the change delta. This is the source of truth the plan and code are built from.

Only after the specs describe the target do you plan and implement - `/spec-plan`,
then `/spec-tasks` and `/spec-implement`. Cross-spec contradictions are caught by
`spec-reconcile` at the end of the change; do not knowingly leave one now.
