# ADR-005: The align/update engine reads a versioned manifest, not just prose

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-07 |
| **Author** | Łukasz Bodurka |
| **Tags** | methodology, align-engine, distribution |

## Context

A repo adopts the standard with `align-to-standards` and stays current with
`update-to-version`; both are **prose skills** an agent interprets. ADR-005's keystone
work (the versioned pin `.standards-version` + `self-verify`) made compliance
*checkable*, but the align/update step itself is still an agent reading instructions and
deciding what to do.

That leaves three forces unmet:

- **Repeatability.** Prose is interpreted differently each run - and agents demonstrably
  make mistakes aligning a repo. The same repo + same version should converge on the
  same result.
- **Measurable drift.** "How far is this repo from `v0.7.2`?" should be a number, not a
  vibe - so a fleet owner can see which repos are behind.
- **Precise updates.** Applying a `vY -> vX` delta needs a machine-readable description
  of exactly what changed between those versions, not "re-read the changelog and figure
  it out."

...without losing what already works: adapt-to-the-stack (not blind copy), stack-agnostic
Layer-1 simplicity, and client deviations that survive an update (ADR-004).

## Options considered

- **A - Prose skills only (status quo).** Keep `align-to-standards` / `update-to-version`
  as written workflows. Zero new artifacts, maximum flexibility; but interpretation
  varies run to run, drift is not measurable, and updates lean on an agent re-reading the
  changelog. Reliability is exactly the gap.
- **B - A declarative manifest the engine reads (recommended).** Each standard version
  ships a **manifest** (data): the required files, sections, guards, and decisions an
  aligned repo must have, each with an *adapt* rule (copy / merge / fill-from-repo /
  reference). The align, update, and self-verify skills all read it. **Drift = the diff
  between the repo and the manifest** (a number). **Update = the diff between two
  versions' manifests** (the exact plan). Deviations are recorded manifest exceptions.
  Data is Layer 1 (an agent applies it, no tooling required); a Layer-2 stack may add a
  runner. Cost: a manifest schema to design and keep honest.
- **C - Executable migration scripts per version.** Like DB migrations or Copier tasks:
  each version ships an `up()` that transforms a repo. Precise and ordered, but heavy and
  brittle across the infinite variety of real client repos, stack-specific, and it fights
  *adapt-to-the-stack* - a script cannot reconcile like an agent can.

## Decision

Adopt **Option B**. The align/update engine is driven by a **versioned, declarative
manifest**; the agent applies it (adapting to the stack), and `self-verify` checks the
repo against the pinned version's manifest. Drift becomes a measurable diff; a version
update becomes a manifest-to-manifest delta.

Reject **A** (the reliability and measurability gaps are the whole point) and **C** (too
rigid for the adapt-to-stack, brownfield reality this standard targets). The manifest is
**data (Layer 1)**; any runner/tooling is **Layer 2**. This does not replace the prose
skills - it gives them a spine to read.

## Consequences

- Positive: drift is a number; updates are precise (manifest delta); `self-verify` gains
  a concrete thing to check against; a fleet can be reported on.
- Negative / cost we accept: a manifest **schema** must be designed and versioned, and
  kept from drifting out of sync with the actual standard (mitigation: the skills read
  the manifest, so it cannot rot unused; `self-verify` asserts it).
- Follow-ups (now landed, ENG-2): the manifest schema exists as a real, shipped artifact
  (`standard.manifest.json`); `self-verify.mjs` reads it and emits a drift score. Still
  open: teaching `align-to-standards` / `update-to-version` to compute their plans from
  the manifest delta (they now reference it; full mechanization is a later increment).

## Confirmation

Confirmed. `self-verify.mjs` reads the pinned version's `standard.manifest.json` and
checks the repo against every entry (files, required sections, static guards), reporting
**drift as a number**; a version/manifest mismatch fails. The schema now exists and is
dogfooded (this repo ships its own manifest), so the decision is no longer a direction -
it is in force.

## Revisit when

- The manifest becomes as hard to interpret or maintain as the prose it replaced
  (over-engineered) - then step back toward A for the parts that resist description.
- A Copier-style 3-way merge tool makes executable, adapt-aware migrations cheap enough
  to reconsider C.

## Related

Builds on ADR-004 (decisions reach clients by reference, not copy) and the versioned
self-update mechanism (`.standards-version`, `update-to-version`, `self-verify`). Governs
the align-engine. Backlog: ENG-2 (built - `self-verify` reads the manifest) and this
record (ENG-3).

## Appendix - the manifest

The manifest is a real, shipped artifact: [`standard.manifest.json`](../../standard.manifest.json)
(reflected to `dist/standard.manifest.json`) - `repository-standards` describing **itself**
at the current version. `self-verify.mjs` reads it; an aligned client repo carries a copy
at its pinned version.

**Shape.** Four lists plus two policy blocks, each entry carrying a `since` version and an
`adapt` rule:

- `files` - the paths an aligned repo must have, each with an **adapt rule** (`copy` /
  `merge` / `fill-from-repo` / `reference`) that says *how* it arrives. Guards are `copy`;
  `ARCHITECTURE`/specs are `fill-from-repo` (scaffold the shell, author the body from the
  repo - never blind-copy); the standard's own decisions are `reference` (ADR-004).
- `sections` - required headings inside a file (e.g. AGENTS.md must state `Altitude`).
- `guards` - the checks that must pass, `static` (run anytime) or `diff` (run on a PR diff).
- `decisions` - the catalog forks a repo must consciously record, each mapped to `ADR`/`BDR`.
- `specs` / `exceptions` - the buildable-tier default and how a deliberate deviation is
  recorded so an update never silently overwrites it.

**The three operations it unlocks** (the whole reason for Option B):

| Operation | Today (prose) | With the manifest |
|---|---|---|
| **Verify** | `self-verify.mjs` hardcodes the skeleton list | it reads the pinned version's manifest and checks every entry - one source of truth, not a JS copy |
| **Drift** | a judgement call | `count(manifest entries the repo fails)` - a number a fleet owner can sort on |
| **Update `vY -> vX`** | re-read the changelog and figure it out | the diff of the two versions' manifests (keyed by kind + id/path), filtered by `since` - the exact plan |

The manifest never replaces the prose skills' judgement (adapt-to-stack, brownfield
reconciliation an agent does better than a script - why **C** was rejected); it gives them
a spine to read.
