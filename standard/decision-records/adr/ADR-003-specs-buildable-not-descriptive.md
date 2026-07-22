# ADR-003: Capability specs are buildable, not descriptive

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-07 |
| **Author** | Łukasz Bodurka |
| **Tags** | methodology, specs |

## Context

"How deep is a spec?" is a real, contestable choice. A spec that only describes *what*
the system does cannot be implemented or verified from it - it drifts into vague prose
and the code becomes the real source of truth. This records the depth bar and the
rejected shallower form.

## Decision drivers

- A spec must let an engineer or agent implement AND verify the capability from the
  spec alone (plus shared schemas / standards), without reverse-engineering code.
- Money / security / data-integrity / external-contract capabilities cannot be vague.
- Thin, peripheral capabilities should not be forced into heavyweight detail.

## Options considered

- **Descriptive** - prose "what it does", no contracts. Cheap; not implementable or
  checkable from the spec; drifts.
- **Buildable** - carries the contracts: data, interface, algorithms, state machine,
  config, and acceptance criteria (Given / When / Then). Implementable + verifiable.

## Decision

Specs are **buildable** by default: they carry the contracts, quoted verbatim (real
field names, enums, error codes, endpoints). A lighter **behavioral** tier is allowed
for thin / peripheral capabilities but MUST be declared (`Spec tier: behavioral`) so
the gap is explicit. Anything carrying money, security, data integrity, or an external
contract MUST be buildable. Unknowns go in Open questions, never glossed.

### Consequences

- Positive: specs are implementable and testable from the spec; the spec, not the
  code, is the source of truth; acceptance criteria seed the tests.
- Cost: buildable specs are more work to write and keep current - accepted for the
  capabilities that matter.

## Confirmation

- `specs/README` "Spec depth" states the bar, the contracts, and the tiers.
- `capability-spec.template.md` carries the required buildable sections + the
  `Spec tier` declaration.
- Depth is not fully mechanizable - it is a spec-review / reconcile check.

## Revisit when

The buildable bar proves too heavy for the domain, or tooling can generate / verify
the contracts well enough to change the trade-off.

## Related

- Drives: `specs/README` (Spec depth), `capability-spec.template.md`.
