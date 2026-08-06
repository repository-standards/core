---
name: spec-reconcile
description: Use when a change is finished, before opening the pull request - "I think that's done". Makes the spec, the code and the tests agree, resolves any drift rather than merging around it, and deletes the plan and task scaffolding the work no longer needs.
---

<!-- PATCHED(repository-standards): this skill is NOT vendored from github/spec-kit - ADR-015
     extracted only five prompts (specify, clarify, plan, tasks, implement); spec-reconcile has
     no upstream equivalent. -->
# spec-reconcile

Run before completing a change. After merge, `specs/` must be current production
truth - so the spec, the code, and the tests must agree.

## Steps

1. For each changed capability spec, compare **spec vs the code diff vs tests**.

2. Detect:
   - spec says X but the code does Y,
   - code or tests encode behavior missing from the spec,
   - spec requires a scenario with no implementation,
   - the implementation adds a side-effect described nowhere,
   - code that exists only to keep an **already-shipped** contract working - a
     compatibility shim, a deprecated alias, a function body with no header, a
     route kept alive for an old client.

3. Resolve each: update the spec, fix the code, or explicitly record why. Prefer
   making the spec accurate to the real behavior.

   **A compatibility artifact is documented as one, or the record gets worse.**
   Where the source of truth for some behavior is something already out in the
   world - a previous release's compiled binary, a wire format in the field, a
   published URL - the code preserving it is not what the capability is, and the
   preference above would file it under current design. Give it its own
   subsection naming what it preserves (the release, the consumer, the format)
   and the condition for removing it, and leave the capability's contracts
   describing the current shape. Deleting it from the spec is the opposite error:
   it ships, so it cannot be silent. What counts as a breaking change in the
   first place is a decision, not this skill's call - a repo with no recorded
   compatibility policy gets a backlog item (`add-to-backlog`) or a record of its
   own, and this step does not settle it by writing prose that implies one.

4. **Flip the Open questions the change resolved (SD-7).** Specs drift in BOTH
   directions: if this change fixes something the spec lists under `## Open
   questions`, mark it resolved **in the same change** and update the affected
   Data / Interface / Acceptance sections - otherwise the spec keeps describing a
   bug that no longer exists (a fixed defect masquerading as a known gap).

5. **Cross-spec consistency.** Once spec == code == tests, check the affected specs
   against each other: shared terms, invariants and contracts must not contradict
   across capabilities. A cross-spec contradiction is a finding - resolve it in this
   change if it belongs here, otherwise file a backlog item for it (`add-to-backlog`).

   **When one side is `retired`, the contradiction resolves in one direction**
   (ADR-036): the live spec wins, and the retired one is corrected to say what its
   capability *did*, naming the change that superseded it. Correcting it is not
   extending it, and `Status` stays `retired` - a retired spec is frozen against new
   behaviour, never against telling the truth (R4).

6. **Decision-record citations stay live (the altitude above the spec, `AGENTS.md`).**
   For each capability spec in scope, check every ADR/BDR it names or links - in the
   spec's own prose and in the capability's code comments - against that record's
   current `Status`. A citation to a record that has since flipped to `Superseded` is
   stale prose, not a spec defect to silently rewrite: update the citation to point at
   the superseding record and flag the surrounding prose for a human to resolve - never
   rewrite the decision text itself (only the record's own author does that, R6). Keep
   this lightweight: grep the cited record ids against their `Status` lines, not a
   semantic read of every record - a real supersession once left five stale citations
   and a stale code comment past every guard, because nothing before this step looked.

7. Re-run the coupling guard (`node scripts/spec-guard.mjs --staged`) - a mapped
   capability's code changed, so its spec must have changed too - **and reconcile the map
   itself** with `node scripts/spec-guard.mjs --audit`. This is where a refactor gets caught:
   moving or renaming a directory leaves the old glob matching nothing and the new path
   claimed by nobody, and both halves are silent until something reads them. Fix what the
   audit names - repoint the glob, claim the new path, or declare it under `$unclaimed` if it
   genuinely belongs to no capability. A map whose globs match nothing is a guard watching an
   empty set, and it looks exactly like a guard that is working.

8. **Set the `Status` field, and prove it.** This step owns the status: nothing else in the
   loop writes it, which is how `ready-to-develop` came to sit on specs whose gate fails.
   Everything above this point can still move a spec's content - cross-spec fixes, citation
   repoints, a map correction - so status is set last, once spec == code == tests == map ==
   citations is actually true, not assumed. For each spec this change touched, run
   `bash scripts/spec/check-spec-clarified.sh <spec>` and then set the field to what is
   true - `live` when the capability is built and this reconcile made spec == code == tests,
   `in-development` when the work is still open, and back to `in-refinement` when the gate
   refuses the spec. Never type a status the gate does not grant: `spec-structure` re-runs
   the gate on every spec claiming `ready-to-develop` or `live` and fails the pull request,
   so the only thing typing it early buys is a later, more confusing refusal. `retired` is
   the exception the gate has no opinion about - it is set with the BDR/ADR that ended the
   capability.

9. **Close the work: delete the scaffolding.** Plan and task files are ephemeral by rule
   (R13) and this is the step that acts on it - nothing else in the loop does, which is
   why `spec-structure` has been reduced to warning about files it cannot remove. Once
   spec == code == tests, delete `plan.md`, `tasks.md` and any `research.md`,
   `data-model.md`, `quickstart.md` or `contracts/` the plan stage produced, and clear
   `specs/feature.json`. Report what was removed.

   Three things survive on purpose: the spec, `checklists/requirements.md` (the spec's own
   quality record - `spec-specify` writes it when the spec is minted and `spec-clarify`
   re-validates it on every later round, so it belongs to the spec and not to this piece of
   work), and anything the scaffolding recorded that is still true - a decision belongs in a
   record, an unfinished thread in the backlog, an unresolved question in the spec's
   **Open questions**. Move it before deleting; a task list kept "just in case" is a second,
   staler description of a capability that already has a living one, and the next reader
   cannot tell which is current.

   If the work is not finished, say so and stop - the scaffolding stays until it is.

No knowingly-contradicting spec merges (rule 8: no silent drift).
