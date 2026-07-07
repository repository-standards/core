# Layer 2 - Node / TypeScript paved road

A runnable setup that sits on top of the stack-agnostic standard (Layer 1). **Distilled
from real production monorepos** (stayget, propertycloud), cross-checked against current
community consensus - not assembled from blog posts. Adopt it whole, or take Layer 1 alone
and cherry-pick.

The **why** for every choice - with pros/cons, the community position, and the tie-breaks -
is in [`DECISIONS.md`](DECISIONS.md). This README is the map.

## The stack

- **pnpm** workspaces + **Turborepo**, **Node 24** (pinned in `.nvmrc`, `engines`).
- **Biome** for lint + format; **Prettier** only for `*.scss` (Biome doesn't format SCSS).
- **TypeScript** strict (`noUncheckedIndexedAccess`, `noImplicitOverride`, ...), target
  stratified by layer.
- **Fastify** with **native plugin DI, no container**, and a **Zod-validated env** at boot.
- **Next.js** App Router, `output: standalone`, security headers in a typed config.
- **Vitest** + **Playwright**, orchestrated from the root.
- Supply-chain **7-day cooldown** (`minimumReleaseAge`), `allowBuilds` allow-list.
- **Hardened GitHub Actions**: least-privilege `permissions`, pnpm cache, frozen lockfile.

## What's here

```
stacks/node-ts/
  DECISIONS.md            # the why: per-axis pros/cons, community rec, the pick
  package.json            # root scripts (check:all, build, test, format)
  pnpm-workspace.yaml     # workspace globs + supply-chain cooldown + allowBuilds
  turbo.json              # task graph + caching
  tsconfig.base.json      # strict TS base every package extends
  biome.json              # lint + format config
  .prettierrc.json        # SCSS-only formatting
  .nvmrc                  # Node 24
  .github/workflows/ci.yml   # least-privilege quality gate (format + types + lint)
  templates/
    service/              # a Fastify service: native DI + Zod env + health route
    web/                  # Next.js config (App Router, standalone, security headers)
```

## Adopt

1. Copy `stacks/node-ts/*` to your repo root (adjust `pnpm-workspace.yaml` globs).
2. Put services under `services/` (or `apps/`) from `templates/service`, web apps from
   `templates/web`. Each leaf `tsconfig.json` extends `../../tsconfig.base.json`.
3. `pnpm install` (the 7-day cooldown applies), then `pnpm check:all`.
4. Wire `ci.yml` and the standard's `self-verify` into your pipeline.

Deviating from a pick? Record a superseding ADR in your repo (ADR-004) - the paved road is
a default, not a cage.
