# repository-standards - backlog

> The standard's **own** backlog, dogfooding [`docs/backlog.template.md`](docs/backlog.template.md).
> A working doc (root, source-only, not shipped to `dist/`) - the same role
> `PRODUCT.md` and `materialy-i-decyzje.md` play. Ordered by risk x leverage; an item
> leaves only when its **definition of done** is met. Feeds: this repo's roadmap
> ([`PRODUCT.md`](PRODUCT.md)), spec deltas, and code<->spec / source<->dist drift.

Statuses: `todo` / `doing` / `blocked` / `done`. Drop `done` rows when a release is cut.

## Epic: Versioned self-update (keystone)

The product's spine: a repo pins to a standard version, updates to newer ones by delta,
and proves compliance. Deeper mechanization (a data-driven manifest) is ENG-2 below.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| SU-1 | Versioned update + self-verify | "update me to vX" and a machine-checkable "does it comply?" are the keystone the whole product turns on | `update-to-version` skill (delta not re-scaffold, preserves client deviations), `self-verify.mjs` (version pin + skeleton + structure guard, CI-gated) + `docs/self-verify.md`, `.standards-version` pin, wired into `align-to-standards` + `AGENTS` + the CI workflow; reflected to `dist/` | done (this PR) |

## Epic: Product-discovery layer (personas + greenfield)

The product-side mirror of buildable specs: behavior validated against a **user**, not just
the code. Personas gate ideas, specs, and the backlog.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| PERS-1 | Personas as a validation gate | "for whom?" had no home; a capability could be buildable and useless | `personas.template.md` + `dist/docs/personas.md`; ADR-006 (Accepted); wired into taxonomy, ways-of-working (PO stage), `specs/README` (spec names its persona), backlog template (persona column), decision catalog (target personas = BDR); reflected to `dist/` | done |
| GF-1 | `greenfield-start` guided flow | new projects needed a for-whom -> what -> how conversation, not a blank scaffold | `greenfield-start` skill: elicit product + personas, choose the stack (Layer 2 default), record foundational ADRs, break into modules, write persona-anchored specs + business requirements, seed the backlog, self-verify; reflected to `dist/` | done |
| PERS-2 | Mechanical persona check in the spec guard | a spec with no persona should fail like one with no error table | extend `spec-structure.mjs`: every capability spec references a persona in the roster; reflected to `dist/` | todo |

## Epic: Release & change tracking

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| REL-1 | Two-changelog system | one `CHANGELOG.md` edited per PR conflicts every time (just happened on #15 vs #16); and technical noise pollutes the stakeholder view | **done:** per-PR `changes/` fragments (audience + type + optional headline); `tools/changelog.mjs` assembles the complete technical `CHANGELOG.md` and a curated release-notes **draft** (`--check` validates fragments in CI); the maintainer cuts releases and writes the notes. Layer-2 repos may swap in `changesets`. | done |

## Epic: Layer 2 - Node/TS stack

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| L2-1 | `stacks/node-ts` | the promotable product needs the runnable Node/TS setup, evidence-based from stayget/roomlink/console | **done (this PR):** `stacks/node-ts` distilled from **stayget** (primary) + **propertycloud** - pnpm+Turbo, Biome (+Prettier for SCSS), strict TS, Fastify native-DI service template with Zod env, Next App Router config, hardened least-privilege CI, 7-day supply-chain cooldown. Every pick has pros/cons + 2026 community rec + provenance in [`DECISIONS.md`](stacks/node-ts/DECISIONS.md). Open increment: `roomlink`/`console` cross-check; a `gitleaks`/e2e template. | done |

## Epic: Reflection engine & self-consistency

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| ENG-1 | `source -> dist` build script | `dist/` is a hand-maintained snapshot that drifts (path rewrites, source-only ADRs done by hand each time); the repo's own README flags this | one local script regenerates `dist/` from the concern folders (path rewrites + source-only exclusions encoded once); not a GitHub Action | todo |
| ENG-2 | Manifest + align-engine | `align-to-standards` is prose; a data-driven manifest with versioned migrations makes reconcile measurable and repeatable | a manifest describes what a repo must have; the engine diffs + applies; drift is a number | todo (design proposed in ADR-005) |
| ENG-3 | ADR: "align-engine is a manifest" | the ENG-2 shape is a re-litigable decision worth recording | ADR drafted with rejected alternatives | proposed - ADR-005 (this PR), awaiting Accept |

## Epic: Buildable spec depth - field lessons

Observations from retrofitting a full capability set (~20+ specs) to the `buildable`
tier from existing code. Refinements to the spec-depth standard, not new inventions;
the next agent should check each against the current standard before acting.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| SD-1 | Lead the tier decision with the rebuild-and-verify test | the "money / security / data-integrity / external-contract" enumeration is a proxy; the one discriminator that actually resolved every tier call in practice is a single question - "could an agent rebuild and verify this capability from the spec alone, without the code?" | spec-depth section leads with that question; the enumeration becomes worked examples under it; reflected to `dist/` | todo |
| SD-2 | Make the verbatim error table and an "Open questions" section required, not optional | applying `buildable` at scale, the two sections that caught real bugs were (a) the exhaustive per-endpoint error table - status + errorCode + message - which forces reading every branch, and (b) an Open-questions section that surfaced spec<->code discrepancies which became tracked issues | `capability-spec.template.md` marks both as required; template also requires >=1 Given/When/Then per invariant; reflected to `dist/` | todo |
| SD-3 | Default to buildable; do not pre-declare behavioral to save effort | pre-marking peripheral capabilities `behavioral` and rewriting them `buildable` later wasted a pass - writing the contracts is exactly what surfaces the bugs, so the thin capabilities benefit most; `behavioral` stays an escape hatch that must be justified in-spec and is expected to be rare | standard states the expectation (buildable is the default even for peripheral capabilities; behavioral requires an in-spec justification and should be rare); reflected to `dist/` | todo |
| SD-4 | Document the extract-verbatim -> synthesize retrofit workflow | for brownfield, the reliable method was a read-only pass extracting verbatim contracts with `file:line` references, then authoring the spec from that; the `file:line` anchors make the spec auditable and re-verifiable against the code | ways-of-working / spec skills describe the two-step retrofit (extract verbatim with anchors, then synthesize); reflected to `dist/` | todo |
| SD-5 | Elevate the code<->spec coupling guard from enforcement detail to core requirement | a spec with no coupling-guard entry silently rots; a guard that flags domain code changed without touching its spec (capability -> globs map + check) is what kept spec and code aligned across the whole set | standard requires every capability spec to have a guard mapping; a spec without one fails the check; reflected to `dist/` | todo |
| SD-6 | Land a behavior change and its spec update in the SAME PR | the coupling guard is per-PR and has no bypass - a fix that changes a capability's code while its spec update rides in a separate PR makes the guard block the fix PR (observed: a fix PR went red for exactly this). "Update specs before implementing" is the principle; "in the same PR" is the operational corollary that keeps the guard green | ways-of-working / enforcement note states behavior and spec land together; a change that touches a capability's code touches that capability's spec (or records why not) in the same PR | todo |
| SD-7 | Reconcile a spec when a fix lands - flip its Open questions | specs drift in BOTH directions: a fix that resolves something the spec listed under "Open questions" must, in the same change, flip that item to resolved and update the affected Data / Interface / Acceptance sections - otherwise the spec keeps describing a bug that no longer exists (a fixed defect masquerading as a known gap) | the reconcile step names this explicitly: a fix updates the resolved Open questions plus the affected contract sections in the same change | todo |

## Epic: Naming & positioning

The current name `repository-standards` is clear but may undersell a living, versioned,
agents-first framework. Decide the name before promoting widely (rename touches many files).

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| NAME-1 | Decide the project/repo name | want a recognized-default *category* name (like "coding standards"), possibly AI-flavored to signal agents-first | pick a candidate; verify npm scope + GitHub org + domain; rename README/PRODUCT/AGENTS/manifest/skills + the `align me to <name>@<ver>` phrasing; keep `.standards-version` filename (generic) | todo |

Candidates to choose from (head noun stays **standards** - plural like "coding standards";
internally still "**the standard**", singular + versioned):

Current lean (owner): the top level reads as **repository** / **project**, not
"engineering" - keep it broad and place-anchored. `project-standards` is a live candidate.
An AI-flavoured variant is wanted to signal agents-first.

- **By place / scope (leading):** `repository-standards` (current), `project-standards`.
- **AI-flavoured** (signals agents-first): `ai-repository-standards`, `ai-project-standards`,
  `ai-engineering-standards`, `agentic-engineering-standards`, `ai-native-engineering-standards`.
- **By discipline (demoted per owner):** `engineering-standards`, `development-standards`.
- Rejected: `documents-standards` (too narrow); evocative brand names (Plumbline/Cairn/etc -
  do not read as a default standard).
- Head noun stays **standards** (plural, like "coding standards"); internally still "**the
  standard**" (singular, versioned). Ownability via npm scope / GitHub org (`@handle/…`),
  not by mangling the name. Tagline is fixed regardless of name: *the reference your repo
  trues up to - align -> verify -> drift as a number*.

## Epic: Cross-discipline standards & polish

Established standards worth folding in the same way personas were (catalog + ways-of-working
+ optional ADR, reflected to `dist/`). Scrum/SAFe are deliberately **out of scope** - the
framework is spec-driven + trunk-based, not ceremony-based.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| STD-C4 | Architecture diagrams via the **C4 model** | `ARCHITECTURE.md` has no diagram convention | C4 (Context/Container/Component) as the ARCHITECTURE convention; name our guards/self-verify "**fitness functions**"; reflected to `dist/` | todo |
| STD-A11Y | Accessibility baseline: **WCAG 2.2 AA** | UX has no gate; Biome a11y already enforces part | WCAG 2.2 AA as a decision in the Quality catalog; note Biome a11y coverage; reflected to `dist/` | todo |
| STD-PO | PO/PM quality: **INVEST + Definition of Ready + Impact/Story Mapping** | spec/backlog quality and greenfield discovery lacked named methods | INVEST + DoR added to spec/backlog quality; **Impact Mapping** + **Story Mapping** wired into `greenfield-start`/ways-of-working (goal -> persona -> module); reflected to `dist/` | todo |
| STD-SEC | Security references: **OWASP ASVS + SLSA + Twelve-Factor** | we do the practices (secret scan, cooldown, env config) without naming the frameworks | reference ASVS + SLSA in the Security baseline and Twelve-Factor for services (Layer 2); reflected to `dist/` | todo |
| LAND-1 | Landing messaging pass | current copy does not say who it is for (PO builds via spec), that greenfield+brownfield both apply, or mention personas | rewrite the landing hero + sections to the real positioning (see PR #31) | todo |
| REFLECT-MAP-1 | Add new artifacts to `reflect.mjs` map | `personas` + `greenfield-start` (PR #32) and the changelog assembler are not yet in the source->dist map | on `reflect.mjs` (ENG-1, PR #28) merge, add the new copy/divergent entries so drift stays checkable | todo |

## Done (drop at next release)

| id | title | landed |
|----|-------|--------|
| KB-A | Decision catalog (`decision-records/catalog.md`) | PR #16 |
| KB-B | Repo-assessment playbook (`docs/repo-assessment.md`) | PR #18 |
| KB-C | Ways-of-working, PO -> dev -> AI (`docs/ways-of-working.md`) | PR #20 |
| BL-1 | `add-to-backlog` skill | PR #21 |
| BL-2 | `backlog-from-specs` skill | PR #21 |
| - | Backlog layer + `onboard-repo` | PR #15 |
| - | Taxonomy map, `PRODUCT.md`, ADR-004 | PR #14 |
