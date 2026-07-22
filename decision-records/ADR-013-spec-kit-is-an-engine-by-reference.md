# ADR-013: Spec Kit is a vendored, pinned engine - ours to patch, synced at release time

| | |
| --- | --- |
| **Status** | Superseded by ADR-015 (2026-07-22) |
| **Date** | 2026-07-22 |
| **Author** | Łukasz Bodurka |
| **Tags** | spec-kit, engine, dependencies, naming, skills, vendoring |

## Context

The standard's spec flow runs on GitHub Spec Kit (specify -> clarify -> plan -> tasks),
and the owner asked: should our skills carry the Spec Kit name, do we track upstream,
is the dependency even needed? The facts:

- **Our skills never were Spec Kit's.** `spec-impact`, `spec-update`, `spec-analyze`,
  `spec-converge`, `spec-reconcile` are this standard's own layer - they wrap the
  engine, they did not come from it.
- **On the agent side, Spec Kit is mostly prompt files and helper scripts** (the
  `speckit.*` command templates, `.specify/` scripts, the constitution template) - the
  owner's observation "to tylko skille w sumie" is essentially correct; the Python CLI
  exists to install and template them.
- **Upstream is very alive and volatile:** 55+ releases in H1 2026, ~111k stars, and a
  real breaking change (v0.10.0 dropped the `--ai` flags for `--integration` +
  extensions/hooks). Fast-moving cuts both ways: maintained, and breaking.
- We already **patch around it** (capability paths instead of `NNN-` dirs; the clarify
  gate wired via extensions/hooks) - overrides that today live outside the engine's
  own files.

## Options considered

- **A - Fork / absorb the whole project.** Full control; inherits a
  55-releases-a-quarter maintenance treadmill including the CLI and 30+ agent
  integrations we do not need.
- **B - Chase upstream continuously.** Pure cost; almost none of upstream's churn
  touches our surface.
- **C - Engine by reference (this record's first draft):** consumers install upstream
  via its CLI at a pinned version; the standard names its surface and re-tests at
  release time. Low cost, but consumers stay exposed to CLI breaking changes and our
  patches live awkwardly *around* the engine's files instead of in them.
- **D - Vendored, pinned, patched copy (chosen - owner amendment, 2026-07-22).** The
  standard carries a local copy of the agent-side Spec Kit assets (command prompts,
  scripts, constitution template) at a pinned upstream version, **patched for our
  conventions** (capability paths, the clarify-gate hooks pre-wired, statuses), and
  ships them in `dist/` like everything else. Upstream is re-synced **only when the
  standard cuts a release**. Attribution: MIT, "based on github/spec-kit vX.Y".

## Decision

Option **D**. Concretely:

1. **Vendor the agent-side assets** at the current tested version (0.13.x line) into a
   zone-2 source dir, patched: capability paths (ADR-002), the clarify gate as
   mandatory hooks (not an optional add-on), spec `Status` wiring (ADR-010). Consumers
   no longer need upstream's CLI at all - `dist/` carries a working, pre-patched
   engine. Executed as `ENG-5` (its own PR - it fetches and tests real upstream files).
2. **Sync cadence:** upstream checked when the standard releases, never continuously.
   Each sync records "based on github/spec-kit vX.Y" + the patch list; a breaking
   upstream change is absorbed here once, and consumers get it via
   `update-to-version` - they are never exposed to upstream directly.
3. **Naming:** our `spec-*` skills stay our own and are never called "speckit"; the
   vendored files keep upstream's `speckit.*` command names (honest attribution both
   ways: "the engine is based on Spec Kit vX.Y; the standard's layer is ours").
4. **Exit clause unchanged:** the gate, statuses, and `spec-*` skills survive an
   engine swap; with a vendored copy the standard even survives upstream vanishing.

## Consequences

- Positive: consumers get a deterministic, pre-patched engine with zero install
  dependency on upstream's CLI and zero exposure to its breaking changes; our
  overrides live *in* the engine files instead of around them; independence with
  honest attribution.
- Negative: the standard owns the sync work each release (bounded: prompts + scripts,
  not the CLI); vendored files can drift from upstream improvements between releases -
  accepted, that is the point; the MIT license + notice must ship alongside.

## Confirmation

Landed 2026-07-22 (ENG-5): `standard/spec-kit/` (v0.13.2, 4 marked patches) renders to
`dist/.claude/skills/speckit-*` - **the skills layout, per the owner's simplification
call** (one distribution mechanism beside the standard's own skills; upstream v0.13.2
itself installs skills) - plus the shared runtime in `dist/.specify/` with the MIT
license and per-file provenance notes. `spec-kit-setup.md` no longer requires the
upstream CLI; the gate and capability-path behavior are verified by scripted tests.

## Revisit when

Upstream stabilizes into a boring, slow-moving spec (then by-reference gets cheap
again), or the vendored surface grows beyond prompts + scripts (then we are forking,
and should say so).

## Related

- ADR-002 (capability paths - now patched in, not fought around), ADR-009 (our skills
  ship, transition skills do not), ADR-010 (statuses + gate), `ENG-5` in
  [`backlog.md`](../backlog.md);
  [`spec-kit-setup.md`](../standard/specs/README.md).
