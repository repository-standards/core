# Spec commands / skills

Spec-Kit-compatible extensions for the capability-spec model. **Runnable
implementations ship in [`../.claude/skills/`](../.claude/skills/)** (`spec-impact`,
`spec-update`, `spec-reconcile`, `spec-analyze`, `spec-converge`). They wrap Spec
Kit's native behavior (clarify, plan, tasks, analyze, converge) rather than
reimplementing it; see [`spec-kit-setup.md`](spec-kit-setup.md) for how the loop is
wired.

The spec-first loop: change a spec (target) -> `spec-impact` -> `spec-update` ->
`spec-analyze` -> plan -> tasks -> implement -> `spec-reconcile` -> merge -> loop.

| Command | Purpose |
|---------|---------|
| `/spec-impact` | Inspect the request + code + existing specs; list affected capabilities (primary / affected / possible side-effects); state whether a NEW capability spec is justified (default: no). Prohibits a new spec just because a ticket exists. |
| `/spec-clarify` | Detect ambiguity, missing business decisions, conflicting requirements, undefined edge cases, lifecycle / permission / concurrency / cross-domain consequences. Ask targeted questions; record assumptions where interaction is unavailable. |
| `/spec-update` | Update every affected canonical capability spec to the **target** state. Preserve unrelated behavior; avoid needless rewrites; create a new capability spec only when justified. |
| `/spec-analyze` | Cross-spec consistency: terminology, states, invariants, lifecycle, ownership boundaries, duplicate / conflicting rules across capabilities. Report contradictions to resolve. |
| `/spec-reconcile` | After implementation, compare spec vs code diff vs tests. Detect "spec says X / code does Y", behavior in code or tests missing from spec, spec scenarios with no implementation, undocumented side-effects. Report and preferably fix. |
| `/spec-converge` | Iterate: find missing implementation, missing tests, unresolved drift, missing spec updates; append / update tasks until the branch converges on the spec. Reuse native Spec Kit converge if present. |

## Strong rules for the agent

**Spec Kit boundary (the load-bearing one):** never run Spec Kit's native
`/speckit-specify` - it creates `specs/NNN-feature/` folders, which this model
forbids. Spec Kit is the *engine* (clarify, plan, tasks, analyze, converge);
capability specs are authored and edited only via `/spec-update`. Enforced by
`spec-structure.mjs`.

1. Never create a new capability spec merely because a request exists - search existing capabilities first.
2. A cross-capability change updates **every** affected canonical spec, not only the obvious one.
3. Specs describe behavior (`MUST`/`MAY`/`MUST NOT`), not tickets.
4. A spec must be readable without knowing repo history.
5. Git is the evolution history - do not keep obsolete behavior in the canonical spec.
6. Plans and tasks are disposable; they must not compete with specs as product truth.
7. Any behavior-altering code change requires a conscious spec review (even if no update is ultimately needed).
8. No silent drift - a completed implementation must not knowingly contradict the canonical specs.
