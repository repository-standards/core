The spec layout guard. It checks that every capability spec is shaped like one and serves
somebody who exists.

```
node scripts/spec-structure.mjs --block
```

## What it refuses to let happen

**A spec that serves nobody.** Every capability spec names a role from `docs/roles.md`,
and this reads that table as the live roster. "The user" is not a role; neither is a name
invented in the spec itself, and a `**Serves:**` value is checked against the roster rather
than merely for being filled in. A repo still on `docs/personas.md` is read from that file,
with a notice saying how to move it.

**A spec with no job stories.** A capability spec a change touches carries `## Job stories`:
1-3 `**JS-n.**` items, each followed by a GIVEN/WHEN/THEN scenario that ends
`(AC: <criterion name>)` and names a criterion the spec actually has. In a full-tree run, a
spec that predates the section is warned about rather than failed, so adopting the rule never
fails a repo for history it did not write in this pull request.

**A roster it cannot read.** If the table parses to no roles - rows without backticks
around the name, or a placeholder never filled - the run fails saying so. Every check here is
a membership test, so an empty roster would otherwise pass every spec by having nothing left
to contradict, which is how this check once switched itself off.

**A spec shaped like a ticket.** Layout by capability, not `001-feature/`.

**A spec missing the sections that make it usable** at the tier it declares. A spec that
says `**Spec tier:** buildable` carries `## Data contracts`, `## Interface contracts` and
`## Acceptance criteria`, each with something under the heading - a section that genuinely
does not apply keeps its heading and says so, the way `## Open questions` says "None known."
`behavioral` is still the escape hatch ([R9](../../standard/SPEC.md)); a spec declaring no
tier at all is warned about, not blocked, because a guard that fails every undeclared spec
in a repo mid-adoption is a guard somebody turns off.

**A section heading written twice.** The clarify gate greps for the first `## Clarifications`
and stops; so does a reader. A second one hides everything under it from both while every
guard stays green. A later clarify session is a new `### Session YYYY-MM-DD` under the
heading that is already there.

## What it deliberately ignores

The scaffolding `/spec-plan` and `/spec-tasks` write beside a spec - `plan.md`, `tasks.md`,
`research.md`, `data-model.md`, `quickstart.md`, `contracts/`, `checklists/` - is ephemeral by
rule (ADR-010) and is not a capability spec, so none of it is held to the role gate. A PR
opened between `/spec-plan` and `/spec-reconcile` legitimately carries all of it. In full-tree
mode the same list is reported as a warning instead: still committed once the work closed
means the cleanup did not run.

## Why the roster is a table

Because a guard has to read it. That is also why the shipped `roles.md` keeps its worked
example **out** of the roster table: this script reads that table, so example names left in
it would let a spec claim to serve a role from a booking demo and pass.

## Decisions behind it

- **[ADR-064](../decision-records/ADR-064-roles-modes-and-job-stories-replace-personas.md) - the
  role gate, and job stories in every spec.** Without a mechanical check, "for whom?" is a question asked in
  review when somebody remembers.
