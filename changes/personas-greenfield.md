---
audience: both
type: added
headline: Personas now gate the whole flow - we always build for someone named
---
- `docs/personas.md` (+ ADR-006) - new: personas are a first-class **validation gate**, not a UX poster. They sit above specs and the backlog; every spec names the persona(s) it serves, every backlog item names whose job it advances, and an idea with no persona is parked. A persona-vs-persona conflict is resolved by a recorded BDR. Wired into the taxonomy, ways-of-working (the PO stage), the spec rule, the backlog template (a `persona` column), and the decision checklist (target personas = a BDR).
- `greenfield-start` skill - new: the guided start for a brand-new project - **for whom -> what -> how**. It interviews for the product and personas, records the foundational ADRs, breaks the product into modules with you, then writes persona-anchored specs and business requirements and seeds the backlog. The greenfield counterpart to `onboard-repo` (brownfield) and `align-to-standards` (adopt). Defaults to the Layer 2 stack (Fastify + Next).
