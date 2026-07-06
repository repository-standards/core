---
name: spec-analyze
description: Check consistency across the capability specs - terminology, states, invariants, ownership boundaries, duplicate or conflicting rules. Reuse Spec Kit's analyze for the spec/plan/tasks cross-check.
disable-model-invocation: true
---

# spec-analyze

After updating specs (spec-update), check they do not contradict each other.

## Steps

1. Across the affected capability specs, check: terminology, states, invariants,
   lifecycle transitions, ownership boundaries, cross-references between
   capabilities, duplicate rules, conflicting rules.
2. Report each contradiction to resolve, or record why it is acceptable.

Reuse Spec Kit's `/speckit-analyze` for the spec/plan/tasks cross-check where the
engine is installed; this skill adds the cross-**capability** consistency check.
