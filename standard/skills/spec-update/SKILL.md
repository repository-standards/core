---
name: spec-update
description: Change the affected capability specs to the TARGET state (how it should work after this change) before implementing. On a branch, the spec = target; git diff = the change delta. Update every affected spec, not just the obvious one.
disable-model-invocation: true
---

# spec-update

The spec is the driver. Change it **first** - describe how the capability should
work and look after this change - then plan, then code. This is the "spec changed
during work" step.

## Steps

1. From `spec-impact`, take the primary + affected capabilities.

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

Run `spec-analyze` next to check the updated specs do not contradict each other.
Only after the specs describe the target do you plan and implement.
