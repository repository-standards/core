# Layer 2 - Node / TypeScript paved road

A runnable stack that sits on top of the stack-agnostic standard (Layer 1): pnpm +
Turborepo, Biome, strict TypeScript, Fastify with native plugin DI, Next.js App Router,
Vitest + Playwright + Lighthouse CI, a 7-day supply-chain cooldown. Every pick is
distilled from two production monorepos and cross-checked against 2026 community
consensus - the *why* per axis, with escape hatches, is in [`DECISIONS.md`](DECISIONS.md).

## Greenfield

```
npx degit bodurkalukasz/repository-standards/stacks/node-ts/starter my-app
```

The starter is boot-verified: `pnpm install && pnpm dev` boots Next + Fastify through
one proxy with Better Auth in place - sign-up to dashboard proven, `pnpm test:all` green.

## Brownfield

Adopt the picks from [`DECISIONS.md`](DECISIONS.md) and copy the configs you need from
[`starter/`](starter/): `biome.json`, `tsconfig.base.json`, `vitest.config.ts`,
`playwright.config.ts`, `pnpm-workspace.yaml` (the cooldown + `allowBuilds` policy),
`docker-compose.test.yml`, `.github/workflows/`. Deviating from a pick? Record a
superseding ADR in your repo (ADR-004).

```
stacks/node-ts/
  DECISIONS.md   # the why: per-axis pick, rationale, escape hatch
  README.md      # this router
  starter/       # the boot-verified greenfield monorepo - degit and run
```
