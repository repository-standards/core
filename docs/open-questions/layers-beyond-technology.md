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
- **Security and compliance, data and analytics, operations.** Each is a practice a
  team already runs, each has artifacts a repo should carry, and each currently has
  the same two options: argue it into Layer 1 for everyone, or leave it out.

**What would have to move,** if the answer turns out to be "no":

- **R20 and the registry key.** The rule names technology explicitly, `stacks.json`
  keys on `technology`, and a stack manifest has no field that could say what else it
  is. A practice layer needs a name that is not a technology and a registry that
  admits it.
- **Precedence when two layers claim the same path.** Manifest entries are keyed by
  path; a UX layer and a technology stack both prescribing front-end configuration
  would collide, and nothing today decides which wins.
- **The drift number.** `self-verify` counts one drift across both layers today. Three
  layers either stay one number - and a UX gap becomes indistinguishable from a
  missing CHANGELOG - or the number splits, which is a change to the one metric the
  whole product reports.

**A better answer would:** come from someone who runs one of these practices
professionally saying what they would want carried in a repo, rather than from this
desk imagining it. Two cheaper probes exist first: `STACKS-2` (a second technology
stack) tests whether the seam is even about technology or just about "something the
core does not know", and the QA case can be examined today from the tree, by asking
which node entries are Node's and which are only wearing Node's clothes.
