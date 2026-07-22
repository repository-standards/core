# ADR-017: Everything a repo consumes is pinned exact

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-29 |
| **Author** | Łukasz Bodurka |
| **Tags** | supply-chain, dependencies, reproducibility |

## Context

A repo consumes software it did not write: package dependencies, container base
images, CI runners and actions. Every one of these has an auto-resolution
mechanism that will happily move underneath the repo - semver ranges (`^`/`~`)
resolve to whatever is newest, `latest` and floating image tags (`node:24`,
`postgres`) re-point on every pull, actions tracked by branch or major tag change
without a commit. The result is drift nobody reviewed: local, CI and production
can each run a different graph, a rebuild of the same commit produces a different
artifact, and a compromised upstream release walks in on its own. The standard
already has a release-age cooldown principle (never install a version younger
than seven days); it said nothing about pinning, so the cooldown could be
satisfied while the actual resolved graph still floated.

## Options considered

- **Ranges plus a committed lockfile** - the lockfile freezes the graph for
  installs, but only where a lockfile exists and is honored; images, actions and
  runners have no lockfile, and range manifests still invite silent re-resolution
  in tooling that ignores or regenerates the lock. Half the surface stays floating.
- **Pin exact everywhere** - manifests, overrides, images, runners, actions all
  name an exact version (image pins may use digests). Nothing moves without a
  diff; every upgrade is a reviewed change. Cost: upgrades stop being free - they
  must be performed deliberately (which is the point) and someone must run them
  regularly or the repo quietly ages.
- **Pin only production dependencies** - dev tooling and CI float. Rejected: dev
  tooling and CI are exactly where supply-chain attacks land first (postinstall
  scripts, build steps), and "it works in CI, fails locally" drift stays.

## Decision

We will pin exact, everywhere, and upgrade only by explicit diff. Dependency
manifests, overrides and resolutions carry exact versions - no `^`, `~`, ranges
or `latest` - sealed by a committed lockfile. Container images, CI runners and
actions name an exact version or digest, never a floating tag. A new version
additionally clears the release-age cooldown before adoption; a critical security
fix may bypass the cooldown through a recorded, temporary exclusion. Normative as
R21 in `standard/SPEC.md`; per-stack mechanics (package-manager settings that
enforce the cooldown and exact saves) live in the stack repos (Layer 2).

## Consequences

- Positive: reproducible builds - the same commit resolves to the same graph
  everywhere; no unreviewed code enters via auto-resolution; upgrades are visible,
  reviewable diffs with a place in the changelog.
- Negative / cost we accept: routine dependency-update passes become a recurring
  chore that must actually happen, or the repo ages in place; exact pins produce
  larger, noisier update diffs.
- Follow-ups: stack repos document the enforcement mechanics for their package
  manager and container tooling.

## Confirmation

Review: an update PR shows exact-to-exact diffs and nothing else floats. Stack
repos MAY add mechanical checks (a lint that rejects range specifiers and
floating image tags) and enforce the cooldown in the package manager itself.

## Revisit when

A consumed ecosystem makes exact pinning impractical (for example a platform that
only accepts ranges), or lockfile-plus-range tooling becomes reliable across the
whole surface - images and CI included - making manifest-level pinning redundant.

## Related

`standard/SPEC.md` R21; `standard/docs/PRINCIPLES.md` (supply-chain cooldown,
exact versions); ADR-002-style capability specs are unaffected; stack mechanics
per ADR-016 (stacks are satellite repos).
