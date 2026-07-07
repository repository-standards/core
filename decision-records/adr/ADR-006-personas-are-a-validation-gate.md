# ADR-006: Personas are a first-class, validated product artifact - a gate, not a poster

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-08 |
| **Author** | Łukasz Bodurka |
| **Tags** | methodology, product, specs, personas |

## Context

The standard makes behavior verifiable against the code (buildable specs, the coupling
guard). But it had no answer to the other half of "is this right?": **for whom?** Ideas,
specs, backlog items, and business rules were validated against the code and against the
catalogued technical decisions - never against a named user. So a capability could be
perfectly buildable and perfectly useless, and nothing in the process would catch it.

The user's requirement: personas must be first-class, and everything downstream - ideas,
plans, specs, business requirements, the backlog - must validate against them. "For whom?"
should be answerable before "what?" and "how?".

## Options considered

- **A - Personas as an informal UX/marketing doc (status quo-ish).** A page someone writes
  once and nobody consults. Cheap, but it does not gate anything, so it drifts into fiction
  and the "for whom?" question stays unanswered at decision time. This is the failure mode
  the standard exists to kill, applied to product instead of code.
- **B - Personas as a first-class, validated artifact that gates downstream work
  (recommended).** Personas live in-repo (`docs/personas.md`), sit **above** specs and the
  backlog in the altitude, and every spec/backlog item names the persona(s) it serves and
  how. An idea that cannot name a persona is parked. A conflict between personas is
  resolved by a recorded decision (BDR), not silently. Cost: one more artifact to keep
  honest, and a light gate at the PO stage.
- **C - Full personas + journey maps + JTBD tooling as a heavyweight discovery layer.**
  Maximally rigorous, but it imports a whole product-discovery apparatus the standard is
  not trying to be, and most repos will not sustain it. Over-engineered for the gate we
  actually need.

## Decision

Adopt **Option B**. Personas are a first-class artifact (`docs/personas.md`, from
`personas.template.md`) and a **validation gate**:

- **Altitude:** personas sit above specs and the backlog. A spec names the persona(s) it
  serves and states how; a backlog item names the persona whose job it advances; an idea
  with no persona is parked.
- **Primary persona wins ties** unless a BDR says otherwise; a persona-vs-persona conflict
  is resolved by a recorded decision.
- **Jobs-to-be-Done** is the durable core of a persona (features change, jobs do not); we
  borrow JTBD framing without adopting a whole discovery methodology (rejecting C).
- The `greenfield-start` flow gathers personas **before** modules and specs; brownfield
  `onboard-repo` reconstructs them from the product and existing users.

Reject **A** (a poster that gates nothing is the exact rot the standard opposes) and **C**
(too heavy for the gate we need).

## Consequences

- Positive: "for whom?" is answered at decision time; specs and backlog items are
  checkable against a user, not just the code; persona conflicts surface as decisions.
- Negative / cost we accept: one more living artifact; a wrong persona misleads everything
  downstream, so it must be corrected deliberately (mitigation: reviewed at each PO stage,
  revisited when the market moves).
- Follow-ups: `personas.template.md`; taxonomy row; the PO stage in `ways-of-working`; the
  spec and backlog templates naming a persona; `greenfield-start`; "target personas" as a
  catalogued product decision (BDR).

## Confirmation

A spec without a named persona (and how it serves them) is incomplete at review - the same
tier as a spec missing its error table. The backlog template requires a persona field.
The decision catalog lists "target personas" as a product decision to record. (A
mechanical check - "every capability spec references a persona in the roster" - is a
natural extension of the spec-structure guard; noted as a follow-up, not yet built.)

## Related

Mirrors buildable specs (ADR-003) on the product side: specs verify behavior against code,
personas verify behavior against a user. Builds on the decision catalog (target personas =
a BDR). Governs `greenfield-start` and `onboard-repo`.
