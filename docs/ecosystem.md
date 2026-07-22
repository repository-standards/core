# How it fits together

Two kinds of repository, one machine. Think navigation and maps: the core is
the navigation engine - it knows HOW to guide a repo (read the checklist,
compare, propose waves, verify, count drift). A stack is a map pack - it knows
WHAT is true for one technology (the picks, the reference configs, the
migration notes). The engine never contains a street; the map never recalculates
a route. Adding a technology means adding a map, never a second engine.

## The pieces

| Repo | Role | Carries |
|---|---|---|
| [repository-standards](https://github.com/bodurkalukasz/repository-standards) | the engine and the methodology (Layer 1) | `SPEC.md` (20 rules), the shipped tree (`standard/`), the align router and its phases, `self-verify`, the stack registry (`stacks.json`) |
| [repository-standards-node](https://github.com/bodurkalukasz/repository-standards-node) | a map pack (Layer 2, Node/TS) | `stack.manifest.json` (what compliant means), `DECISIONS.md` (why), `starter/` (the working reference), `ADAPTING.md` (how to migrate from theirs to ours) |

Officialdom is the registry: the router reads only `stacks.json`, so a stack is
official exactly when the core lists it - wherever else lookalikes live.

## What a run looks like

Everything starts from the core - one entry point, always:

- **Greenfield with a stack.** "greenfield with node" -> the router runs the
  greenfield interview (product, personas, first records), degits the stack's
  `starter/`, copies `stack.manifest.json` in. Born aligned to both layers.
- **Brownfield.** The router detects the technology from the repo's own
  evidence (`package.json`, `pyproject.toml`, ...), offers the registered
  practices, then walks the repo there in waves - protection first
  (supply-chain policy, pins), then code-shaping (lint, strictness), then proof
  (test tiers), then automation (CI). Every conflict resolves through the
  stack's `ADAPTING.md`; every wave closes with the repo's own build green.
- **No registered stack for your technology?** The router says so plainly,
  offers a researched best-practices document shaped like the node DECISIONS
  (dated, sourced) as the repo's own record - and Layer 1 continues unchanged.
- **Ever after.** The adopted repo carries both manifests; `self-verify`
  reports one drift number across both layers. Drift 0 means aligned - to the
  method and to the stack.

## Plugging a new stack in

A stack repo is four data files and a heartbeat - no procedures, no engine:

1. `stack.manifest.json` - the core manifest's schema plus `technology` and the
   `standards` range it implements (the only compatibility metadata anywhere).
2. `DECISIONS.md` - per axis: the pick, a short why, the escape hatch.
3. `starter/` - a working, boot-verified reference; its CI keeps the claim a
   pulse, not a plaque.
4. `ADAPTING.md` - per-entry migration notes: the target repo already has
   something in this spot; how do we get from theirs to ours without breaking
   their build?

Then one line in the core's `stacks.json` - the owner merges it, and the router
starts offering the stack. The policy that keeps this from becoming a generator
graveyard: one stack per technology; variation is a profile or a subtractive
adoption mode, never a sibling repo; a stack keeps a named owner and a live
boot CI or is delisted.

## Sites

The same split, applied to the web: every repo in the ecosystem may carry its
own site - its own landing, its own docs, in its own scope (the core sells the
method; a stack sells its picks and its starter). The FORM is shared the only
safe way: the generator lives in the core, and a repo describes its site as
data (`site.config.json`: brand, top bar, page map) - one form, many sites,
zero copied generators. The top-bar switcher spans them all; with the org's
path model each site lands at its own path under one domain. A stack earns a
site when its content justifies one - until then GitHub renders its markdown
just fine.
