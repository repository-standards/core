# Spec policy enforcement

Goal: nothing merges that silently violates the spec policy. Honest scope - only
part of this is mechanical; the rest needs an AI pass.

## What is mechanically enforceable (hard gate)

- **Structure lint (shipped):** no ticket-numbered spec paths - `specs/<capability>/`,
  never `specs/NNN-feature/` or `specs/<cap>/NNN-*` (a common leak from upstream
  Spec Kit's native specify). Shipped as `spec-structure.mjs`, runs standalone (no
  capability-map). Parsing, required-sections and link-resolution stay a lighter
  follow-on, not yet mechanical.
- **Coupling guard (the key one):** if a PR changes code in a capability's domain
  but does **not** touch that capability's spec, block (or warn) - "you changed
  `<capability>` code without touching `specs/<capability>/`; update it or state
  why not." This makes source-of-truth rule 5 (same-PR spec coupling) mechanical. It cannot prove
  the spec is correct - it forces the author to touch the spec or acknowledge.
- **Orphan-spec audit (same guard):** every capability spec MUST have a map entry
  (source-of-truth rule 4). A `specs/<capability>/` with no key in the map has no
  coupling and silently rots, so `spec-guard.mjs --audit` fails on it. Run it full-tree
  in CI, not just on the diff.
- **Clarify gate (ADR-010; field-proven in production, 2026-07):** a spec may not reach
  plan / tasks / the tracker mirror unless it has a `## Clarifications` section and
  **zero** open `[NEEDS CLARIFICATION]`. Wire it as a mandatory `before_plan` /
  `before_tasks` hook plus a bridge precondition (abort even dry-run). This is what
  flips the spec's `Status` to `ready-to-develop` mechanically, not by opinion - and
  it is why the loop cannot be skipped by simply not invoking a skill.

The coupling guard needs a **capability -> code globs** map (in a monorepo a domain
is spread across app / service / shared). Keep it at `specs/capability-map.json`
(see [`capability-map.example.json`](capability-map.example.json)):

```json
{
  "payments": ["**/payment/**", "**/payu/**", "shared/**/payment*"],
  "pricing": ["src/pricing/**", { "glob": "config/tariffs.json", "couples": "shape" }]
}
```

**Map hygiene:** globs bind **behavior-bearing source**. Dependency manifests and
lockfiles (`package.json`, `pnpm-lock.yaml`, `go.mod`, ...) SHOULD stay out of
capability globs - a version bump is not a behavior change; it is reviewed as a
dependency diff (R21) and recorded in the changelog. When the guard still fires
on a genuinely behavior-free change, the answer is to reconcile the spec's
content or narrow the map - never to append a history note to the spec (R4,
ADR-018: specs carry no change-log sections).

**Data a capability reads** - a rules table, a tariff file, a manifest - belongs in
the map, but its *content* is not its behavior. Declare it
`{ "glob": "<glob>", "couples": "shape" }` and the guard couples on the file's **key
shape** instead: adding an entry or editing a value is data and passes, a key path
that appears or disappears is a change in how the file is interpreted and demands
the spec. Anything it cannot compare - a file with no earlier version, unparseable
JSON on either side - couples, so the quiet direction is the guarded one. A plain
glob string is unchanged: every edit couples.

The distinction is not a convenience. A gate that fires when nothing is wrong gets
satisfied with a cosmetic spec edit, and once that is the habit the gate is
decoration.

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
