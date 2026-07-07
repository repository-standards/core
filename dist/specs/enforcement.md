# Spec policy enforcement

Goal: nothing merges that silently violates the spec policy. Honest scope - only
part of this is mechanical; the rest needs an AI pass.

## What is mechanically enforceable (hard gate)

- **Structure lint (shipped):** no ticket-numbered spec paths - `specs/<capability>/`,
  never `specs/NNN-feature/` or `specs/<cap>/NNN-*` (a common leak from Spec Kit's
  native `/speckit-specify`). Shipped as `spec-structure.mjs`, runs standalone (no
  capability-map). Parsing, required-sections and link-resolution stay a lighter
  follow-on, not yet mechanical.
- **Coupling guard (the key one):** if a PR changes code in a capability's domain
  but does **not** touch that capability's spec, block (or warn) - "you changed
  `<capability>` code without touching `specs/<capability>/`; update it or state
  why not." This makes rule 7 (conscious spec review) mechanical. It cannot prove
  the spec is correct - it forces the author to touch the spec or acknowledge.

The coupling guard needs a **capability -> code globs** map (in a monorepo a domain
is spread across app / service / shared). Keep it at `specs/capability-map.json`
(see [`capability-map.example.json`](capability-map.example.json)):

```json
{
  "payments": ["**/payment/**", "**/payu/**", "shared/**/payment*"]
}
```

**Shipped, ready to use:** the structure lint
[`../scripts/spec-structure.mjs`](../scripts/spec-structure.mjs) and the coupling
guard [`../scripts/spec-guard.mjs`](../scripts/spec-guard.mjs) (both dependency-free),
run by the CI job [`../.github/workflows/spec-guard.yml`](../.github/workflows/spec-guard.yml).

## What is NOT mechanical (AI pass)

- **Behavioral drift** ("does the code actually do what the spec says") is semantic.
  Use `/spec-reconcile` as an AI job reading the diff + specs + tests. Heavier
  (tokens per PR), so run it as **advisory** on CI, or on demand - not a hard block.

## Where the gates run

- **pre-commit** (cheap, local): structure/lint + coupling **warn**.
- **CI** (on PR): structure/lint + coupling **block** + optional `/spec-reconcile`
  **advisory** comment.

## Setup cost

The coupling map is a one-time per-repo config. Without it the guard cannot run -
so a repo adopting this layer must author `capability-map.json` before the gate is
meaningful.
