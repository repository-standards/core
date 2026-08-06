# Spec policy enforcement

Goal: nothing merges that silently violates the spec policy stated in
[`README.md`](README.md) - structure, spec depth, coupling, and the loop that keeps a
spec honest. Honest scope - only part of this is mechanical; the rest needs an AI pass.

## What is mechanically enforceable (hard gate)

- **Status check (shipped, in the structure lint):** a spec whose `**Status:**` claims
  `ready-to-develop` or `live` MUST pass the clarify gate - the structure lint re-runs the
  real gate script on it and fails the PR when it does not. The status is what the rest of
  the method reads as "this is settled", and nothing read or wrote it: `ready-to-develop`
  sat on specs whose gate fails with every other guard green. `spec-reconcile` owns writing
  it; this owns proving it. A gate that cannot be run is not a gate that passed, so that
  case fails too.
- **Structure lint (shipped):** no ticket-numbered spec paths - `specs/<capability>/`,
  never `specs/NNN-feature/` or `specs/<cap>/NNN-*` (a common leak from upstream
  Spec Kit's native specify). Shipped as `spec-structure.mjs`, runs standalone (no
  capability-map). Also mechanical here: a spec declaring `**Spec tier:** buildable`
  must carry `## Data contracts`, `## Interface contracts` and `## Acceptance criteria`,
  each with something under the heading - the template marked them REQUIRED and nothing
  read the template, so a buildable spec shipped without its contracts and they were
  retrofitted by hand months later. A section that genuinely does not apply keeps its
  heading and says so; `behavioral` remains the escape hatch (R9), and a spec declaring
  no tier at all is warned about rather than blocked. Link resolution stays a lighter
  follow-on, not yet mechanical.
- **Coupling guard (the key one):** if a PR changes code in a capability's domain
  but does **not** touch that capability's spec, block (or warn) - "you changed
  `<capability>` code without touching `specs/<capability>/`; update it or state
  why not." This makes source-of-truth rule 5 (same-PR spec coupling) mechanical. It cannot prove
  the spec is correct - it forces the author to touch the spec or acknowledge.
- **Map audit (same guard):** the map is what makes the coupling guard mean anything,
  and it can rot in four ways - each of them silent, which is why all four are checked
  by `spec-guard.mjs --audit`, full-tree in CI rather than on the diff:
  1. a `specs/<capability>/` with **no map entry** has no coupling and silently rots
     (source-of-truth rule 4);
  2. a **map entry naming a capability with no spec** - a key nothing can ever satisfy;
  3. a **glob that matches no file** in the tree: the guard is watching an empty set,
     which reads exactly like a guard that is working. A retired capability keeps its
     entry on purpose (its code is gone, its spec stays) and is exempt - `--audit` reads
     `**Status:** retired` from the spec and says how many it skipped;
  4. **code that belongs to no capability.** This is the one that survives a refactor:
     moving a directory leaves the old glob matching nothing *and* the new path claimed
     by nobody. It needs a bound, because config, scripts, tooling and prose are not
     capabilities - so the map declares it. `"$unclaimed": ["<glob>", ...]` lists the
     paths that belong to no capability by decision; `specs/` is never code and is
     always exempt. Without a `$unclaimed` key the check is **off and says so** in the
     `--audit` line, rather than passing quietly.

  Keys starting with `$` are metadata about the map, not capabilities: `$about` (a note
  for whoever opens the file) and `$unclaimed`. Any other `$` key is refused - a
  misspelt `$unclaimed` that exempted nothing would be the same silence again.
- **Clarify gate (ADR-010; field-proven in production, 2026-07):** a spec may not reach
  plan / tasks / the tracker mirror unless **all four** hold - it has a `## Clarifications`
  section; **zero** open markers of the `[NEEDS ...` family - CLARIFICATION, DECISION,
  INPUT and ASSET alike, which is what the gate script counts, so a missing decision blocks
  planning exactly like an open question; **nothing merely shaped like a marker** (a
  translated family name, an invented type - a gap the gate cannot read has to fail, not
  pass); and a `## Open questions` section that **says there are none**. That last one is
  structural on purpose: any other content there is an open item however it is phrased, and
  prose, a statement, a table of gaps and an item answered above but still listed below were
  all found passing. Wired in twice, on purpose: `/spec-plan` and `/spec-tasks`'s own
  prompts document it as a "MANDATORY PRECHECK" before anything else in the command, and
  `setup-plan.sh` / `setup-tasks.sh` call the gate script themselves and abort on any
  non-zero exit (a bridge precondition - even a `--json` dry run cannot skip it). The
  first layer is a request an agent could still fail to read; the second is what makes it
  mechanical - a spec cannot reach `plan.md` or `tasks.md` by the script refusing, not by
  an instruction being followed. Note this is not a Claude Code `hooks/`-mechanism check
  (those three shipped guards in `.claude/hooks/` cover unrelated risky Bash commands -
  remote-database writes, force-pushes, CI secret writes); a per-request judgment call
  like "does a skill cover this" is not something a hook can make, which is why the
  self-triggering loop instead leans on loaded context (`AGENTS.md`'s "the loop runs
  itself" section, imported so it is present on every turn) for noticing the request at
  all, and on this gate plus its bridge precondition for not skipping the step once
  started. This is what flips the spec's `Status` to `ready-to-develop` mechanically, not
  by opinion - and it is why the loop cannot be skipped by simply not invoking a skill.
  The marker forms and both headings are **syntax**: they stay ASCII in a spec written in
  any language, while the text inside a marker is prose in the spec's own language.

The coupling guard needs a **capability -> code globs** map, because a domain is rarely one
directory: in the paved monorepo shape it spans a package that owns the logic and the
`apps/*` that expose it. Keep it at `specs/capability-map.json`
(see [`capability-map.example.json`](capability-map.example.json)):

```json
{
  "payments": ["packages/payments/**", "apps/*/src/**/payment/**"],
  "pricing": ["packages/pricing/**", { "glob": "config/tariffs.json", "couples": "shape" }]
}
```

A single-package repo writes `src/**/payment/**` and has no `packages/`; nothing about the
mechanism changes. What matters is that the globs match **the tree you actually have** -
`--audit` reports one that matches nothing, because a map full of globs matching no files is
a guard watching an empty set.

**Glob syntax** - one translator (`scripts/lib/glob.mjs`) for every guard that reads a
glob, so two guards cannot answer the same question differently. `*` matches within one
path segment; `**` matches any number of segments **including none**, which is what makes
`**/payment/**` cover `payment/index.ts` at the top level as well as
`apps/web/payment/index.ts`, and `shared/**/payment*` cover `shared/payment.ts`. A
trailing `**` means the contents of a directory: `src/**` matches `src/index.ts`, not a
file named `src`.

**Two capabilities in one folder** - a sibling that grew out of the first, whose code
cannot move out without a refactor nobody is asking for. A glob starting with `!`
**excludes**, so the folder's capability claims everything but the sibling's files:
`"payments": ["packages/payments/**", "!packages/payments/refunds/**"]` beside
`"refunds": ["packages/payments/refunds/**"]`. Without it the map can only say the whole
folder, which demands both specs on every edit until the failure stops being read, or list
files by hand, which goes stale the moment one is added. An exclusion narrows a claim and
cannot replace one: a capability with nothing but exclusions is refused, and `--audit`
reports both an exclusion that has stopped matching anything and a file it handed to nobody.

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
- **CI** (on PR): structure/lint blocks at both profiles. Coupling **blocks at `scale`
  and advises at `core`** - the shipped workflow reads the profile and picks; a solo repo
  gets the signal without the gate. The full-tree `--audit` (every capability spec is
  mapped) blocks at both, because an unmapped spec is a hole in the mechanism rather than
  a coordination cost. Optionally, a `/spec-reconcile` **advisory** comment.

## Setup cost

The coupling map is a one-time per-repo config. Without it the guard cannot run -
so a repo adopting this layer must author `capability-map.json` before the gate is
meaningful.
