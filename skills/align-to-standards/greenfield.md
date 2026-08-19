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
   and fill `SECURITY.md`'s contact. Empty but valid: `self-verify` passes - including
   `docs/facts.json` (R4), which is optional and starts **absent**, not scaffolded from
   `docs/facts.example.json`. That example ships as reference only, to show the shape;
   create `docs/facts.json` from scratch, in that shape, once the repo has its first fact
   worth declaring.

   **The drift 0 you get here says "shaped like the standard", and says so out loud** - the
   verdict carries `no capability spec exists here yet`, because nothing has been specified
   under the shape. That line is this phase's progress bar: it clears at step 6 and not
   before. Do not report a green step 1 to the user as a finished adoption, and never treat
   the caveat as noise to be silenced - it is the difference between the folders being right
   and the method having been used.

   **Write `specs/capability-map.json` now, even though there is nothing to map yet.** It is
   a required entry (R11) and the whole coupling mechanism reads it, so a repo that reaches
   the end of this phase without it fails `self-verify` on a file nobody thought to author -
   and `spec-guard --audit` blocks the moment the first capability spec exists. On day one it
   holds no capabilities, because guessing globs for code that does not exist would be worse
   than nothing:

   ```json
   {
     "$about": [
       "capability -> the code globs that must move with its spec (R11). Keys starting with $ are metadata, not capabilities.",
       "Empty at scaffold time: /spec-specify adds a capability's globs when it mints the spec.",
       "Declare $unclaimed - the paths that belong to no capability - once there is code, so `spec-guard --audit` can report code nobody claims. Until then it reports that the check is off."
     ]
   }
   ```

   Leave `$unclaimed` out until the tree has code: on an empty repo the honest answer is
   unknown, and the audit says on every run that the check is off rather than passing
   silently. `specs/capability-map.example.json` shows the filled shape to grow into.

2. **Elicit the product (ask, don't assume).** Interview the user - and give them something
   to react to, because "what is this?" asked cold gets a worse answer than the same
   question with three shapes beside it:
   - What is this, in one sentence? Offer the kinds so they can start from one and correct
     it: a product other people pay for, an internal tool for your own team, a library or
     service other developers consume, a client project, a prototype you expect to throw
     away. Each answer changes what the rest of this phase is worth doing.
   - What problem, for whom, why now?
   - What does success look like in 3 months - and how would you know? Push gently for
     something observable; "people like it" cannot be checked later, "we stop doing the
     Monday export by hand" can.
   - What is explicitly out of scope? This one is worth insisting on: the non-goals are
     what stop a spec growing sideways six weeks from now.

   Draft `PRODUCT.md` (vision, goals, non-goals) from the answers, read it back, and
   confirm it. If they cannot answer the 3-month question yet, write what they do know,
   mark the gap, and move on - a thin `PRODUCT.md` that says what is unknown beats a
   polished one that guesses.

3. **Personas first - who we build for.** Do not ask this cold. You already have the
   product sentence from step 2, so **draft a candidate roster and put it up for
   correction**: "from what you told me I would guess three kinds of user - <A>, <B>, <C>.
   Which of those are real, which is missing, and who wins when two of them want opposite
   things?" People correct a wrong list far better than they generate a right one.

   Then fill `docs/personas.md` per persona: JTBD (the progress they are trying to make),
   goals, pains, success signals, anti-goals - the things they explicitly do *not* need, so
   nobody gold-plates for them. Mark the **primary** persona: the one that wins ties. Say
   why that matters rather than asking it as a formality - it is the persona a spec cites
   when two demands conflict, so it is a product decision with years of consequences.

   Record "target personas" as a **BDR** - a business decision record, the product-side
   twin of an ADR: it captures *who we chose to build for*, which someone will reasonably
   want to revisit later.

   **If they do not know yet, that is an answer.** A founder pre-first-customer genuinely
   may not. Take one provisional primary persona, mark it `provisional`, add a backlog item
   to revisit it after the first real users, and continue. Nothing downstream is written
   without a persona to point at - but a provisional persona is a recorded gap, not a
   blocker, and blocking the whole adoption on certainty nobody has yet is the worse
   failure.

4. **Scaffold the stack + record it (intake already asked).** The technology and the
   Layer 2 consent came from the intake - this step asks nothing; it scaffolds and
   records.

   **Technology undecided at intake?** Skip this step whole and say so in the closing
   report: steps 1-3 and 5-8 are technology-agnostic, so the phase completes without it and
   the repo is genuinely on Layer 1. Add a backlog item for the stack decision, naming that
   taking it later costs a scaffold and an ADR, not a rework of anything written here. Do
   not fabricate a `docs/stack-decisions.md` for a technology nobody has chosen - the
   no-match fallback below researches a *named* technology, and there is not one yet.

   **No registry entry for this technology?** Then there is no starter and no composition
   rule to run - skip the rest of this step entirely. Scaffold Layer 1 alone, generate
   `docs/stack-decisions.md` per the no-match fallback in `SKILL.md`, and say the true
   thing: Layer 1 is unaffected and complete, the technology layer is a document of your
   own rather than an official stack, and adopting a real stack later costs nothing that
   is being done now. Intake already told the user this, so this is a confirmation, not
   news.

   With an entry: verify it (`stacks.json` in this checkout) and the
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
   Both are named techniques, and the user does not need to know the names - run them as
   questions and only say what you are doing if they ask:
   - **Impact Mapping** - goal -> persona -> impact (the behaviour change we want in them)
     -> deliverable (the capability). In practice: "what has to become true for this to
     have worked? who has to do something differently for that? what would let them?"
     This keeps every capability traceable to a goal *and* a persona, and kills features
     that map to neither.
   - **Story Mapping** - lay the primary persona's journey left-to-right; slice the first
     release as the thinnest vertical that still gets them through it. In practice: "walk
     me through what this person does, start to finish, the first time it works - then
     what is the least we can build so they get all the way through?"
   Slice by domain, not by page (mirrors the spec rule); note the persona(s) each capability
   serves. This map becomes the `specs/` layout and the first epics.

6. **Write the first specs + business requirements.** For the initial capabilities, write
   specs (`specs/README.md`) at the **buildable** tier - R9's default: an agent could
   rebuild and verify the capability from the spec alone. Dropping to `behavioral` is an
   escape hatch that must be justified in the spec itself, and never to save effort:
   writing the contracts is what surfaces the disagreements while they are still cheap,
   which on a greenfield is the entire point of writing them before the code exists.

   **"I cannot name the endpoints yet" is not the escape hatch being abused - it is the
   correct starting point.** A product person authoring the first spec for software that
   does not exist cannot produce an exhaustive error table, and should not be asked to.
   Write it `behavioral`, record the one-line reason in the spec ("authored by the PO
   before the technical design"), and add a backlog item owned by `dev` to raise it to
   buildable before implementation starts. What the rule forbids is a *developer* dropping
   to behavioral on a money, security or contract path to save an afternoon. Do not let a
   non-technical author read that prohibition as being about them - it is the difference
   between a wizard and a gate.
   Each spec **names its persona(s)** and how it serves them, and states
   the business rules and acceptance criteria. Where a decision is forced, write the
   **ADR/BDR** first.

7. **Seed the backlog.** Turn the unspecced capabilities and known work into
   `backlog.md` items - each naming its `cap` and `persona`.

8. **Prove it.** `node scripts/self-verify.mjs` is green (drift 0), **and the shape-only
   caveat from step 1 is gone** - if it still says no capability spec exists, step 6 did not
   happen and drift 0 is not the proof it looks like. A guard reported `SKIP` is a third
   answer: this machine lacks a tool, which is not the repo's drift and not a green light
   either; install it and re-run before calling the walk done. Open the first PR; never push
   without the user's go.

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


## Questions this phase must ask

Declared in `standard/.claude/elicitation/points.json`; the shape and the provenance states are in
`standard/.claude/elicitation/README.md`. Each block below is a real `AskUserQuestion` call, not a
reminder to consider asking - the rule existed as prose first and a full adoption ignored it.

### `[green.product]` What this is and who it is for

Fires **before writing PRODUCT.md, which on an empty repo means before writing anything**.

Call `AskUserQuestion` with the header `[green.product]` and the question:

> What is this going to be, and who is it for?

Options, in order: **tell me now** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave a stub, do not guess** (`absent`)

An empty repository contains no evidence, so anything written here without asking is invention by construction.

Records to `PRODUCT.md` as `point_id: green.product` with the provenance state the answer implies.

### `[green.conventions]` Naming and structure to carry in

Fires **before creating the initial directory layout**.

Call `AskUserQuestion` with the header `[green.conventions]` and the question:

> Do you have naming and structure conventions you want carried in, or should the standard's defaults apply?

Options, in order: **mine, here they are** / **standard defaults** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point)

The same decision as `adopt.layout`, one step earlier and far cheaper: the moment to honour somebody's convention is before any file exists.

Records to `the initial layout and docs/adoption-intake.md` as `point_id: green.conventions` with the provenance state the answer implies.
