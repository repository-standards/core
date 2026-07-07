---
name: greenfield-start
description: Start a brand-new project from the standard - a guided flow that asks what you are building and for whom (personas), records the foundational decisions, breaks the product into modules/capabilities with you, then writes the first persona-anchored specs and business requirements and seeds the backlog. The greenfield counterpart to onboard-repo (brownfield) and align-to-standards (adopt).
disable-model-invocation: true
---

# greenfield-start

Stand up a new repo on the standard - not just scaffolding files, but **guiding what to
build**. You interview, decide, and record as you go, so the repo starts with a vision,
personas, decisions, and buildable specs instead of an empty skeleton. Ask before you
assume; a greenfield start is a conversation, not a generator.

The order is deliberate: **for whom -> what -> how**. Personas gate everything downstream
(ADR-006), so they come first.

## Steps

1. **Scaffold + pin.** Bring in the standard's skeleton (via `align-to-standards`), write
   `.standards-version` and carry the manifest. Empty but valid: `self-verify` passes.

2. **Elicit the product (ask, don't assume).** Interview the user:
   - What is this, in one sentence? What problem, for whom, why now?
   - What does success look like in 3 months? What is explicitly out of scope?
   Draft `PRODUCT.md` (vision, goals, non-goals) from the answers and confirm it.

3. **Personas first - who we build for.** With the user, name 3-6 real user types and fill
   `docs/personas.md` from the template: JTBD, goals, pains, success
   signals, anti-goals. Mark the **primary** persona (wins ties). Record "target personas"
   as a **BDR**. Nothing downstream is written without a persona to point at.

4. **Choose the stack (ask; default the paved road).** Propose the Layer 2 default -
   **Fastify** (services) + **Next.js** (web), pnpm + Turbo + Biome, Node 24
   (`stacks/node-ts`) - and confirm or adapt per the user's context. Record the topology
   and the stack as **ADRs** (from the decision catalog `decision-records/catalog.md`:
   repo topology, domain boundaries, datastore, API style, auth).

5. **Break into modules/capabilities (with the user).** Slice the product into capabilities
   by domain, not by page (mirrors the spec rule). For each, note the persona(s) it serves.
   This module map becomes the `specs/` layout and the first epics.

6. **Write the first specs + business requirements.** For the initial capabilities, write
   specs (`specs/README.md`) at the **behavioral** tier (raise money/security/data paths
   to **buildable**). Each spec **names its persona(s)** and how it serves them, and states
   the business rules and acceptance criteria. Where a decision is forced, write the
   **ADR/BDR** first.

7. **Seed the backlog.** Turn the unspecced capabilities and known work into
   `backlog.md` items - each naming its `cap` and `persona`.

8. **Prove it.** `node scripts/self-verify.mjs` is green (drift 0). Open the first PR;
   never push without the user's go.

## Not this

- **Not generate-then-ask.** Do not emit twenty files and hope; interview, decide, record.
- **Not persona-free.** A capability or backlog item with no persona is parked, not built.
- **Not stack-first.** Decide *for whom* and *what* before *in what* - the stack serves the
  product, not the reverse (though the paved road is the sensible default).
- **Not big-bang.** Spec the first slice deeply; queue the rest. The repo grows spec-first.

## Related

Pairs with `onboard-repo` (brownfield: reconstruct personas + specs from existing code) and
`align-to-standards` (adopt the standard into any repo). Uses `personas.md` (ADR-006), the
decision catalog, the spec model, and the Layer 2 stack (`stacks/node-ts`).
