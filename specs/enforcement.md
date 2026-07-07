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
- **Orphan-spec audit (same guard):** every capability spec MUST have a map entry
  (source-of-truth rule 4). A `specs/<capability>/` with no key in the map has no
  coupling and silently rots, so `spec-guard.mjs --audit` fails on it. Run it full-tree
  in CI, not just on the diff.

The coupling guard needs a **capability -> code globs** map (in a monorepo a domain
is spread across app / service / shared). Keep it at `specs/capability-map.json`
(see [`capability-map.example.json`](capability-map.example.json)):

```json
{
  "payments": ["**/payment/**", "**/payu/**", "shared/**/payment*"]
}
```

**Shipped, ready to drop in:**

- [`spec-structure.mjs`](spec-structure.mjs) - the structure lint, dependency-free.
  Place it at `scripts/spec-structure.mjs`. Modes: full-tree audit (no args),
  `--staged` (pre-commit, warn), `--base <ref> [--block]` (CI). No capability-map needed.
- [`spec-guard.mjs`](spec-guard.mjs) - the coupling guard, dependency-free (Node + git
  only). Place it at `scripts/spec-guard.mjs`. Modes: `--staged` (pre-commit, warn),
  `--base <ref> [--block]` (CI), `--audit` (full-tree: every `specs/<capability>/` has a
  map entry; `--block` to fail on an orphan).
- [`../github/workflows/spec-guard.yml`](../github/workflows/spec-guard.yml) - the CI
  job (blocks on PR). The `align-to-standards` skill drops both into a target repo.

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
