The spec layout guard. It checks that every capability spec is shaped like one and serves
somebody who exists.

```
node scripts/spec-structure.mjs --block
```

## What it refuses to let happen

**A spec that serves nobody.** Every capability spec names a persona from `docs/personas.md`,
and this reads that table as the live roster. "The user" is not a persona; neither is a name
invented in the spec itself.

**A spec shaped like a ticket.** Layout by capability, not `001-feature/`.

**A spec missing the sections that make it usable** at the tier it declares. A spec that
says `**Spec tier:** buildable` carries `## Data contracts`, `## Interface contracts` and
`## Acceptance criteria`, each with something under the heading - a section that genuinely
does not apply keeps its heading and says so, the way `## Open questions` says "None known."
`behavioral` is still the escape hatch ([R9](../../standard/SPEC.md)); a spec declaring no
tier at all is warned about, not blocked, because a guard that fails every undeclared spec
in a repo mid-adoption is a guard somebody turns off.

## Why the roster is a table

Because a guard has to read it. That is also why the shipped `personas.md` keeps its worked
example **out** of the roster table: this script reads that table, so example names left in
it would let a spec claim to serve a persona from a rental-property demo and pass.

## Decisions behind it

- **[ADR-006](../decision-records/ADR-006-personas-are-a-validation-gate.md) - personas gate
  rather than decorate.** Without a mechanical check, "for whom?" is a question asked in
  review when somebody remembers.
