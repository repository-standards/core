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

## Epic: Release & change tracking

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| REL-1 | Two-changelog system via changesets | one `CHANGELOG.md` edited per PR conflicts every time (just happened on #15 vs #16); and technical noise pollutes the stakeholder view | per-PR fragments (changesets); two assembled changelogs (technical + business, audience flag); maintainer cuts releases | todo |

## Epic: Layer 2 - Node/TS stack

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| L2-1 | `stacks/node-ts` | the promotable product needs the runnable Node/TS setup, evidence-based from stayget/roomlink/console | the paved-road setup (pnpm+Turbo, Biome, Fastify native DI, Next App Router, Vitest/Playwright, hardened Actions, supply-chain cooldown, gitleaks) with provenance; supplies the catalog's `-> stack layer` answers | todo |

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
