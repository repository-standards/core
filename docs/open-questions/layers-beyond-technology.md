# Whether a layer has to be a technology

**Decided:** it does. R20 defines the second layer as "optional technology best
practices living in per-technology stack repos", ADR-016 makes each one a satellite
repo behind a registry, and [`stacks.json`](../../stacks.json) states the policy in
its own words - one stack repo per technology, named for the technology, with
variation expressed as a profile or an adoption mode inside the stack and never as a
sibling repo. The data shape agrees: the core manifest declares `layer: 1`, and a
stack manifest carries no layer at all - `technology` is the only field naming what
it is.

**Doubt:** the axis was fixed when the only second layer anyone wanted was Node/TS,
and a technology is not the only body of practice that is reusable across repos,
opinionated, and badly served by being flattened into a stack-agnostic Layer 1.
Candidates the owner named on 2026-08-10:

- **UX and product design** - where the split already happened without being decided.
  Layer 1 took the half of the practice that produces documents: `docs/personas.md`,
  a journey template with stages and pains, and a research template whose own method
  row lists usability tests. It left out the half that has tooling and gates - a
  design system as a source of truth, the Figma-to-code handoff, an accessibility
  baseline something could check. The line between the two is "does it render as
  markdown", which is not a principle anyone would defend out loud.
- **QA as its own practice** - and this one is not hypothetical, it is already
  mislocated. No numbered rule in SPEC.md prescribes a test discipline at all; the
  only place this project says what testing should look like is the node stack's
  manifest, in `vitest.config.ts` (unit and integration as separate projects),
  `playwright.config.ts` (the e2e tier) and `docker-compose.test.yml` (ephemeral real
  dependencies rather than mocks). The *tools* there are Node's. The *discipline* -
  tiers, real dependencies over mocks, what each tier is allowed to assume - is not,
  and a Python or Go repo currently cannot adopt it without a Python or Go stack
  existing first.
- **The agent harness itself** - mislocated too, in the opposite direction from QA.
  Layer 1 ships one vendor's product inside the layer that calls itself
  stack-agnostic: [`standard/.claude/settings.json`](../../standard/.claude/settings.json),
  the guards in `standard/.claude/hooks/` and every shipped skill. QA sits in Layer 2
  wearing Node's clothes; the harness sits in Layer 1 wearing the method's.
- **Security and compliance, data and analytics, operations.** Each is a practice a
  team already runs, each has artifacts a repo should carry, and each currently has
  the same two options: argue it into Layer 1 for everyone, or leave it out.

**The harness candidate splits three ways, not two,** which is the sharpest evidence
that "one practice, one layer" may be too coarse a shape:

1. **Doctrine, vendor-agnostic** - [`working-with-ai/`](../method/working-with-ai)
   already reads correctly next to the rest of the method and should not move
   anywhere.
2. **Repo-resident harness files** - `.claude/` and its hooks: the half that behaves
   exactly like a stack's `files[]` entries and is the only half a satellite could
   carry today.
3. **The developer's machine** - and this one has no home in any layer, present or
   proposed. A context budget is configured per person: the auto-compact window, a cap
   on tool output, hooks that trim a command before it runs and save a handoff before
   a compact. All of it lives in the user's own agent config, outside every
   repository. A manifest entry is a **path in the adopted repo**, so this half cannot
   be an entry, cannot be counted in drift, and would need a check that runs against a
   machine rather than a checkout - something the ecosystem has no concept of. UX and
   QA do not have this problem: whatever they carry is a file in the repo.

**What would have to move,** if the answer turns out to be "no":

- **R20 and the registry key.** The rule names technology explicitly, `stacks.json`
  keys on `technology`, and a stack manifest has no field that could say what else it
  is. A practice layer needs a name that is not a technology and a registry that
  admits it.
- **Precedence when two layers claim the same path - and it is the same item as the
  drift number.** The engine does not ignore a collision; it makes an explicit
  non-decision. `self-verify` warns that two manifests declare one path, checks it
  **once per declaration** - "so it counts twice" - and says the two owners disagree
  and should be told (`standard/scripts/self-verify.mjs`, ADR-037). That holds while a
  collision is a
  rare accident between two technologies with two upstreams. It stops holding the
  moment practice layers are normal: a QA layer and a technology stack both own part
  of `vitest.config.ts` - both officially, both correctly - so there is nobody to
  report to, and the number inflates by exactly the count of shared paths.
- **The drift number.** `self-verify` counts one drift across both layers today. Three
  layers either stay one number - and a UX gap becomes indistinguishable from a
  missing CHANGELOG - or the number splits, which is a change to the one metric the
  whole product reports. The double counting above lands on this same number, so
  whatever answers precedence answers this.
- **Detection, which practice layers do not have.** Brownfield adoption *detects* the
  technology from the repo's own evidence - `package.json`, `pyproject.toml` - and
  then offers the registered stack ([`ecosystem.md`](../ecosystem.md)). No file proves
  a repo "does UX", and nothing in a checkout says which harness its developers run.
  A practice layer can only be **chosen from a menu**, and the router has no concept
  of a layer that must be offered rather than inferred. Without one, a practice layer
  can sit in the registry and never be proposed to anybody.
- **The bar for staying official.** Today it is concrete: a working `starter/` with a
  live boot CI, or the stack is delisted - that is what keeps the registry from
  becoming a graveyard of generators. A UX or harness layer has no boot to verify.
  Either each kind of layer states what its own pulse is - a guard suite that passes,
  an accessibility baseline that runs - or the bar quietly does not apply to the new
  kinds, which is the failure the policy was written to prevent.

**On naming, if the answer is no:** name a practice layer for the practice, the way a
stack is named for its technology - `qa`, `ux`, `claude-code`. Two shapes the owner
floated on 2026-08-10 are worth rejecting in writing, because both will be proposed
again: an `ai-` prefix carries no information in a product that is AI-first end to end,
and `ways-of-working` is already the name of a Layer 1 document
([`ways-of-working.md`](../method/ways-of-working.md)).

**A better answer would:** come from someone who runs one of these practices
professionally saying what they would want carried in a repo, rather than from this
desk imagining it. Two cheaper probes exist first: `STACKS-2` (a second technology
stack) tests whether the seam is even about technology or just about "something the
core does not know", and the QA case can be examined today from the tree, by asking
which node entries are Node's and which are only wearing Node's clothes.

The harness candidate is the exception to the waiting: it is the one practice this
desk *does* run professionally, and a configured instance of it already exists to be
read rather than imagined. It is also the probe that isolates the hardest part - a
practice whose content does not fit in a repository at all - which the UX and QA cases
would never have surfaced.
