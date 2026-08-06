---
name: spec-update
description: Use when behaviour is about to change and the spec needs to say how it will work afterwards, before the code moves - "we're changing how cancellations work, spec it first", "this branch changes X, make the spec match". On a branch the spec is the target and the git diff is the delta; updates every affected spec, not only the one that came to mind.
---

<!-- PATCHED(repository-standards): this skill is NOT vendored from github/spec-kit - ADR-015
     extracted only five prompts (specify, clarify, plan, tasks, implement); spec-update has
     no upstream equivalent. -->
# spec-update

The spec is the driver. Change it **first** - describe how the capability should
work and look after this change - then plan, then code. This is the "spec changed
during work" step.

## Steps

1. From `spec-impact`, take the primary + affected capabilities. If any of them
   has `Status: retired`, stop before **extending** it - `spec-impact` should have
   already caught this, but do not extend a retired capability just because its
   spec file is still there to edit.

   **Correcting it is a different act, and it is required** (ADR-036). If this
   change makes a statement in the retired spec false - a renamed enum, a dropped
   table, a rule that no longer holds - fix that statement here, in this pull
   request, the same way a live spec's would be fixed: say what the capability
   did, name the change that superseded it, leave `Status: retired` alone, and add
   no behaviour. `retired` freezes what the capability does, not whether its file
   tells the truth (R4). If you cannot write the correction without deciding
   something, it is not a correction - stop and write the record.

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

6. **File the delta this change will not build.** A spec now describes target-state
   behavior that the current change deliberately will not implement yet - file it via
   `add-to-backlog`, one item per unbuilt delta, source = the spec diff. This is a
   named backlog feeder (`docs/backlog.md`'s own "What feeds this backlog"): the spec
   already says what "done" looks like, so the row costs one line, and skipping it
   leaves the delta indistinguishable from a gap nobody noticed.

Only after the specs describe the target do you plan and implement - `/spec-plan`,
then `/spec-tasks` and `/spec-implement`. Cross-spec contradictions are caught by
`spec-reconcile` at the end of the change; do not knowingly leave one now.
