---
name: spec-reconcile
description: After implementing, reconcile the capability specs against the code and tests - detect and resolve drift so the merged spec is the truth. No silent divergence.
disable-model-invocation: true
---

# spec-reconcile

Run before completing a change. After merge, `specs/` must be current production
truth - so the spec, the code, and the tests must agree.

## Steps

1. For each changed capability spec, compare **spec vs the code diff vs tests**.

2. Detect:
   - spec says X but the code does Y,
   - code or tests encode behavior missing from the spec,
   - spec requires a scenario with no implementation,
   - the implementation adds a side-effect described nowhere.

3. Resolve each: update the spec, fix the code, or explicitly record why. Prefer
   making the spec accurate to the real behavior.

4. Re-run the coupling guard (`node scripts/spec-guard.mjs --staged`) - a mapped
   capability's code changed, so its spec must have changed too.

No knowingly-contradicting spec merges (rule 8: no silent drift).
