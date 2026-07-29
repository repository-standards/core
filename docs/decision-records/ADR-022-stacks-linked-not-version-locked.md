# ADR-022: Stacks are linked, not version-locked - no standards version requirement

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-29 |
| **Author** | Łukasz Bodurka |
| **Tags** | stacks, versioning, coupling, ecosystem |

## Context

ADR-016 gave each stack repo a `standards: ">=X <Y"` range - a semver contract
naming which core versions the stack works with. In practice the range was
fiction on both sides: the only stack declared `>=0.8 <1` while the core stood
at 0.7.2 (formally incompatible with everything that existed), no tool ever
evaluated the range, and the `<1` ceiling would have excluded the eventual 1.0
release. The deeper observation: a stack depends on the core's **manifest
contract** (the schema and adapt classes that let `self-verify` merge the two
layers), not on the core's release cadence. That contract changes rarely; a
version range models a lockstep that does not exist.

## Options considered

- **A - Keep the range, enforce it.** Adds a semver gate to self-verify and the
  align flow. Enforces a coupling that is not real; every core release would
  invite a pointless range chase across stack repos.
- **B - Loosen the range (`>=0.7`, no ceiling).** Less friction, still implies
  the lockstep and still needs maintaining.
- **C - Drop the requirement; keep the link (chosen).** The stack declares that
  it belongs to the ecosystem - a pointer, not a contract. Compatibility is a
  fact about the manifest schema, owned by the code that reads it.

## Decision

Option **C**. Concretely:

1. `stack.manifest.json` carries **no standards version requirement**. The
   `registry` back-pointer (plus `technology`) is the linkage: this repo is a
   satellite of repository-standards, discovered via `stacks.json`.
2. `self-verify` notes the stack layer's presence and technology and merges its
   entries - nothing version-related is checked or warned about.
3. If the core ever breaks the manifest contract itself (schema, adapt classes),
   that is an explicit, recorded migration in the core's changelog - stacks
   chase it as a bug fix, not as a range bump.
4. ADR-016's range clause is revised accordingly; everything else in ADR-016
   (satellite repos, one per technology, registry as officialdom) stands.

## Consequences

- Positive: the fictional incompatibility disappears; stacks and core release on
  genuinely independent clocks; one less field to maintain and one less gate to
  explain.
- Negative: nothing mechanical stops a stale stack from drifting behind a core
  manifest-contract change - the ecosystem relies on the stack's own CI (the
  boot pulse) and the delisting policy in `stacks.json` to surface that.

## Related

- ADR-016 (stacks are satellite repos - range clause revised here), ADR-017
  (exact pinning concerns what a repo consumes at build time; the stack link is
  discovery metadata, not a consumed artifact).
