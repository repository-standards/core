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

2. **Ask what the change does to each spec's boundary before editing it** - the calls are
   in "Questions this skill must ask", below. Then, for **each** affected spec, edit it
   **in place** to the target state: behavior,
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

7. **Close the loop in the dossier - this path moves the stamp too.** Where the change
   folded in discovery material (the entries `spec-impact` named, or any the edit
   answered on the way), mark each of those entries `folded-into-spec` in
   `docs/discovery/<topic>/README.md`, strike the contradiction rows the new spec text
   settles, and set `Last reconciled: <today> (specs/<capability> @ <commit>)`.
   `spec-specify` does this when a spec is minted, and the route for an already-shipped
   capability is `discovery-digest` -> `spec-impact` -> **here** - so a stamp only
   `spec-specify` ever moved would read `never` for the whole life of every capability
   that was specced once and changed afterwards, and every entry under it would be
   re-raised as fresh material on every later round. Nothing folded in means nothing to
   mark: leave the stamp alone rather than advancing it to look tidy, because advancing
   it past material nobody read is how a question stops being asked without being
   answered.

Only after the specs describe the target do you plan and implement - `/spec-plan`,
then `/spec-tasks` and `/spec-implement`. Cross-spec contradictions are caught by
`spec-reconcile` at the end of the change; do not knowingly leave one now.

## Questions this skill must ask

This skill rewrites capability specifications that somebody already agreed to, which makes it the
one place in the loop where a boundary can move without anybody noticing it moved. The elicitation
guard refuses the write to `specs/**/spec.md` until these fire, and they fire per change rather
than once per repository - what somebody said about last month's edit does not license this one.

Declared in `.claude/elicitation/points.json`; the shape and the provenance states are in
`.claude/elicitation/README.md`. Each is a real `AskUserQuestion` call, in the language the user
is writing in, with the point id in the header.

### `[spec.scope]` What this change puts in and takes out

Fires **before step 2 edits the first spec**, once for the whole change rather than once per file
if the affected specs move together.

Ask: *This change moves the boundary of `<capability>` - what is in scope now, and what drops
out?* Name what you believe is moving, in the options, and ask them to confirm or correct it. A
spec that quietly grows a responsibility is how two capabilities end up owning the same rule.

Options, in order: **tell me now** (`human`) / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave a stub, do not guess** (`absent`, a `[NEEDS CLARIFICATION: ...]` marker where the boundary is unclear)

Records to `docs/adoption-provenance.md`: the `spec.scope` row takes the state, who answered, the
date, and the specs this change edited as where the answer landed.

### `[spec.unknowns]` What this change leaves undetermined

Fires **whenever the edit needs something the change request does not settle** - the moment you
would otherwise pick a default and write it as though it were agreed.

Ask: *These points are undetermined. Decide them now, mark them provisional, or leave them open?*
Name them in the options.

Options, in order: **decide now** (`human`) / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave open** (`absent`, one marker per unknown)

Records to `docs/adoption-provenance.md`: the `spec.unknowns` row takes the state, who answered,
the date, and the spec it was recorded in as where the answer landed.
