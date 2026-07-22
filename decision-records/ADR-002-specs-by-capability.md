# ADR-002: Capability specs are organized by capability/domain, not by ticket or page

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-07 |
| **Author** | Łukasz Bodurka |
| **Tags** | methodology, specs |

## Context

A capability spec needs one organizing axis. Three candidates recur - and the wrong
one keeps coming back in practice (a consumer's align produced `specs/cms/001-core/`,
Spec Kit's ticket numbering leaking in). This records the axis and the rejected forms
so it is not re-litigated.

## Decision drivers

- A spec is the long-lived truth of a domain, not a per-change artifact.
- A cross-cutting concept must have exactly one canonical home.
- Coding agents file these - the axis must be unambiguous and mechanically guardable.

## Options considered

- **Per-ticket / Spec Kit `NNN-feature/`** - disposable, re-created per branch; maps
  to changes, not to living truth. (Leaked as `specs/cms/001-core/` in a real align.)
- **Per-page / route** (`pdp/`, `checkout/`) - a concept like *packages* spans the
  homepage, PDP and checkout, so per-page specs duplicate it across pages and drift.
- **Per-capability / domain** - one domain, one canonical spec.

## Decision

Specs are organized **by capability / domain**. Which pages or routes a capability
surfaces on is a **cross-reference in the docs**, never a spec axis. No
ticket-numbered or page-named spec folders.

### Consequences

- Positive: one canonical spec per domain; no duplicated / drifting concepts; docs
  answer "where does this show up".
- Cost: "which capability owns this?" is a judgment call for genuinely new domains.

## Confirmation

- `scripts/spec-structure.mjs` fails on ticket-numbered spec paths (`specs/**/NNN-*`).
- `specs/README` "Structure" states the capability axis + the page/route ban.
- Per-page naming is not fully mechanizable (a page name and a capability name are
  both just folder names) - so it is also a spec-review check.

## Revisit when

A domain genuinely cannot be expressed as a capability, or the capability-boundary
model stops matching how the product is reasoned about.

## Related

- Drives: `specs/README` (Structure), `scripts/spec-structure.mjs`.
- Confirms the intent behind the 0.7.0 spec-structure guard.
