---
name: modernize
description: Plan how to bring an existing repo's tech, dependencies, and patterns up to current - AFTER the repo is understood and documented. Grounded in the recorded ADRs, specs, and personas, it audits the current state, derives target versions and migration paths, records the direction as decisions, and emits a sequenced migration backlog. Knowledge first, refactor last. This is the "recommendation / future" step.
disable-model-invocation: true
---

# modernize

The **end** of adoption, not the start. Once a repo is understood - personas, specs, and
foundational decisions recorded (the adoption checkmap in `docs/adoption.md`) - this derives
how to bring it **current**: which dependencies and platforms to bump, in what order, along
what migration paths, and how to **stay** current. It never bumps blind - the plan is
grounded in what the repo actually is and why, so a migration serves the recorded intent
instead of quietly breaking it.

**The hard rule of sequence: understand -> record the decisions -> THEN refactor.**
Refactoring before the knowledge exists is exactly how migrations lose behavior nobody
remembered was load-bearing. This skill produces the plan and the decisions; the refactor
executes them afterwards, guarded by the specs and tests the earlier gates built.

## Preconditions

- The adoption checkmap has run: `personas.md`, capability `specs/` (buildable on the
  money/security/data paths), and the foundational ADRs exist. If they do not, run
  `assess -> align -> onboard` first - modernizing an undocumented repo is guessing.

## Steps

1. **Current-state audit.** Inventory the stack: runtimes, frameworks, key libraries,
   build/CI - each with current vs. latest-stable version and its EOL / security status.
   Cross-reference what the specs and ADRs say each one is relied on for.
2. **Derive the target.** For each item, the target version (latest stable, honoring the
   supply-chain cooldown) and the *kind* of move: a plain bump, a breaking migration, or a
   replacement. Ground every "replace X with Y" in a reason and the affected capability
   specs - not in fashion.
3. **Record the direction as decisions (before any code moves).** Each non-trivial move -
   a framework swap, a major version with breaking changes, a new pattern - becomes an
   **ADR/BDR**: what, why, rejected alternatives. Name the specs it touches. This is the
   step that makes the refactor safe.
4. **Sequence the migration.** Order by dependency and risk: unblock-first; money / security
   paths (the best-specced) early; leaf and low-risk changes batched. Each step **small,
   reversible, and green** - specs + tests are the safety net.
5. **Emit the plan as backlog.** One item per migration step (`cap`, `persona`, `why`, DoD),
   with a **counted scope** ("N steps to current"). This is the roadmap; the refactor is the
   execution of it, one green step at a time.
6. **Maintenance strategy (stay current).** Modernizing is not a one-off. State the cadence
   and mechanism so the repo does not rot back: the supply-chain cooldown, a dependency-update
   rhythm, and `update-to-version` for the standard itself. Currency is *maintained*, not
   achieved once.

## Not this

- **Not bump-then-pray.** No refactor before steps 1-3 (audit, target, recorded decisions).
- **Not one giant version-bump PR.** Sequenced, small, reversible, spec-guarded steps.
- **Not ungrounded.** Every migration traces to a capability spec and a recorded decision -
  "latest" is not a reason on its own.
- **Not one-and-done.** Currency is a maintenance rhythm (step 6), not a single push.

## Related

Runs **after** `align-to-standards` / `onboard-repo` (the repo must be understood first).
Distinct from `update-to-version` - that bumps the **standard's** version; this bumps the
**repo's own** tech and patterns. Feeds the backlog. See `docs/adoption.md` (the Modernize
phase) and ADR-007.
