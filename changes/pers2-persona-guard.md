---
audience: technical
type: added
---
- `scripts/spec-structure.mjs` - the structure guard now also fails a capability spec that names **no persona** (ADR-006): it looks for a `**Serves:** \`<persona>\`` field, a mention of a persona from the `personas.md` roster, or a `personas.md` reference. The check is skipped when the repo has no `personas.md` yet. The capability-spec template gains a required `Serves` field.
