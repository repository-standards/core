# Greenfield phase

The `align-to-standards` phase for an **empty or brand-new** target repo. Stand it up
on the standard - not just scaffolding files, but **guiding what to build**. You
interview, decide, and record as you go, so the repo starts with a vision, personas,
decisions, and buildable specs instead of an empty skeleton. Ask before you assume; a
greenfield start is a conversation, not a generator.

The intake (step 0 in `SKILL.md`) has already asked the frame - intent, technology +
Layer 2 consent, appetite, plan-only vs execute. This phase turns those answers into
artifacts, and the order is deliberate: a one-breath product frame first (you cannot
name *who* without one sentence of *what*), then **personas - and they gate everything
downstream (ADR-006)**: no capability, spec or backlog item lands before they are
confirmed. The stack, though already named at intake, is recorded and scaffolded only
after personas and product.

## Steps

1. **Scaffold + pin.** Bring in the shipped tree (the align steps in `SKILL.md`), write
   `.standards-version` and carry the manifest. (With a stack chosen at intake, defer
   the writing: steps 2-3 are an interview - draft their artifacts in-conversation and
   write everything during step 4's composition, starter first, this tree over it, the
   interview artifacts last - so the degit lands on an empty root and overwrites
   nothing.) Instantiate `specs/constitution.md`
   from `specs/constitution.template.md` - the project's non-negotiables the spec skills
   gate on. Choose and add a LICENSE now (an unlicensed repo is unusable, not neutral)
   and fill `SECURITY.md`'s contact. Empty but valid: `self-verify` passes.

2. **Elicit the product (ask, don't assume).** Interview the user:
   - What is this, in one sentence? What problem, for whom, why now?
   - What does success look like in 3 months? What is explicitly out of scope?
   Draft `PRODUCT.md` (vision, goals, non-goals) from the answers and confirm it.

3. **Personas first - who we build for.** With the user, name 3-6 real user types and fill
   `docs/personas.md` from the template: JTBD, goals, pains, success
   signals, anti-goals. Mark the **primary** persona (wins ties). Record "target personas"
   as a **BDR**. Nothing downstream is written without a persona to point at.

4. **Scaffold the stack + record it (intake already asked).** The technology and the
   Layer 2 consent came from the intake - this step asks nothing; it scaffolds and
   records. Verify the registry entry (`stacks.json` in this checkout) and the
   `registry` back-pointer in the stack's `stack.manifest.json` (no version range to
   check - ADR-022; on a manifest-contract mismatch warn, the user decides; see
   `SKILL.md`); the picks and their rationale live in that stack repo's
   DECISIONS - never hardcode them here. **Composition rule** for the boot-verified
   starter:
   - **Degit the starter first, into the repo root** - **never a nested second
     directory** (the `my-app` form belongs only to the standalone quick start, not
     here).
   - **Then lay the Layer 1 tree over it**, reconciling every collision by its file
     class: author the **README as the product README**, folding the starter's run
     instructions into it; any other same-path file reconciles per its manifest `adapt`
     class (`merge`-class files diff against the starter's reference copy).
   - Copy `stack.manifest.json` from the stack checkout into the new repo, beside the
     core manifest.
   Record the topology and the stack as **ADRs** (from the
   [decision checklist](../../docs/method/checklist.md): repo topology, domain
   boundaries, datastore, API style, auth).

5. **Break into modules/capabilities (with the user).** Two lightweight techniques close the
   loop with the personas:
   - **Impact Mapping** - goal -> persona -> impact (the behaviour change we want in them)
     -> deliverable (the capability). This keeps every capability traceable to a goal *and*
     a persona, and kills features that map to neither.
   - **Story Mapping** - lay the primary persona's journey left-to-right; slice the first
     release as the thinnest vertical that still gets them through it.
   Slice by domain, not by page (mirrors the spec rule); note the persona(s) each capability
   serves. This map becomes the `specs/` layout and the first epics.

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
- **Not stack-first.** Intake asks the technology up front (one question round), but the
  stack is recorded and scaffolded only after personas and product - the stack serves the
  product, not the reverse (though the paved road is the sensible default).
- **Not big-bang.** Spec the first slice deeply; queue the rest. The repo grows spec-first.

## Related

Pairs with the [brownfield phase](onboard.md) (reconstruct personas + specs from existing
code). Uses `personas.md` (ADR-006), the decision checklist, the spec model, and the
Layer 2 stack from the registry (`stacks.json`).
