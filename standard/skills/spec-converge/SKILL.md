---
name: spec-converge
description: Iterate until the branch converges on the spec - find missing implementation, missing tests, unresolved drift, missing spec updates, and append tasks. Reuse Spec Kit's converge.
disable-model-invocation: true
---

# spec-converge

## Steps

1. Compare the target capability specs against the current branch: missing
   implementation, missing tests, unresolved drift, missing spec updates.
2. Append or update tasks until the branch converges on the spec.

Reuse Spec Kit's native converge where the engine is installed; this wraps it
around the capability specs so convergence is measured against them.
