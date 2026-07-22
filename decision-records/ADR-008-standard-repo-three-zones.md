# ADR-008: The standard repo separates three zones - repo-own, source, shipped

| | |
| --- | --- |
| **Status** | Accepted (2026-07-22); zone mechanics revised by ADR-014 - zones 2 and 3 merged into the single `standard/` tree |
| **Date** | 2026-07-21 |
| **Author** | Łukasz Bodurka |
| **Tags** | structure, repo-layout, dogfood |

## Context

The 2026-07-21 re-review found the repo failing its own first impression: no root
`AGENTS.md`, marketing and working files (`landing.html`, wheel experiments, blog drafts,
a Polish notes file) loose in the root, and source directories (`github/`, `claude/`,
`agents/`, `gitleaks/`) whose names collide with the dot-dir conventions of a normal repo.
An agent (or human) entering could not tell what is **this repo's own life**, what is the
**source of the standard**, and what is the **shipped skeleton**. For a repo whose whole
pitch is "structure that agents can navigate", that is the one failure it cannot afford.

## Options considered

- **A - Flat root, documented only.** Keep everything where it is; a root `AGENTS.md`
  maps the zones. Cheapest; but the `github/`-vs-`.github/` class of collision stays, and
  the root keeps reading as a grab-bag.
- **B - Three explicit zones, source grouped under one directory (recommended).** Zone 1:
  the repo's own life (governance, `backlog.md`, `tools/`, `apps/landing-page/`,
  `docs/working/`). Zone 2: the standard's source, eventually grouped under a single
  directory (working name: `standard/`) so nothing in it collides with normal repo
  conventions. Zone 3: `dist/`, build output only. Cost: a one-time migration PR that
  rewrites the `reflect.mjs` map and internal links (tracked as `STRUCT-1`).
- **C - Merge source into `dist/` (single tree).** One copy, no reflect. Rejected: the
  divergent class (template vs filled example) genuinely needs two forms, and consumers
  should receive a clean skeleton, not the factory.

## Decision

Option **B**. Effective immediately: the zones are named, the root `AGENTS.md` is the map,
repo-own public artifacts live in `docs/` and `apps/`; working/idea notes live outside the repo (owner rule, 2026-07-22), and `dist/`
is never edited by hand. The physical regroup of zone 2 under one directory is executed as
a dedicated migration (`STRUCT-1`) once this record is Accepted - it rewrites the reflect
map and many links, so it rides alone.

Two clarifications added while Proposed (owner direction, 2026-07-22):

- **Zone 3 has two shipped surfaces, and technology never leaks into the first:**
  the **universal core skeleton** (today `dist/` - Layer 1, any language) and
  **per-technology overlays** (`stacks/<technology>/` - today `node-ts`; a Python or Go
  stack slots in beside it without touching the core). A Python adopter takes the core
  plus their stack; nothing Next.js/TS-flavored may live in the core. (The `.mjs` verify
  scripts and the `.nvmrc` pin are the standard's own *toolchain*, not a stack choice -
  documented as such.)
- **The name `dist/` stays** (owner decision, 2026-07-22): the owner's own framing
  settles it - this structure IS the repo's output, and `dist/` is literally built by
  `reflect`; the name universally reads "generated - do not edit by hand", which is
  exactly the behavior we want (a `skeleton/` invites editing). STRUCT-1 therefore
  moves zone-2 sources only.

## Consequences

- Positive: an entering agent reads one file and knows where it is; root stops accumulating
  strays; the standard models its own taxonomy.
- Negative: one migration PR of pure churn (paths, links, reflect map); until then the
  zone-2 name collisions remain, mitigated only by the map.

## Confirmation

Root `AGENTS.md` exists and names the three zones; `reflect --check` drift 0 after every
zone-2 change; no working/marketing file sits directly in the root.

## Revisit when

The regroup (`STRUCT-1`) turns out to break external links or consumer expectations, or a
monorepo layout (`apps/`) proves overweight for what stays a docs-first repo.

## Related

- ADR-005 (align-engine is a manifest) - the manifest stays the *client* layout,
  unaffected by zone-2 grouping.
- `STRUCT-1` in [`backlog.md`](../backlog.md); the 2026-07-21 re-review notes.
