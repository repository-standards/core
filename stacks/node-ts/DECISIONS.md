# Layer 2 - Node/TypeScript paved road: the decisions

Evidence-based, not blog-based. Every pick below was extracted from two real production
monorepos - **stayget** (pnpm + Turbo + Biome; the primary reference, it wins ties) and
**propertycloud** (pnpm workspaces + ESLint) - and cross-checked against current
(2025-2026) community consensus. Where the two repos disagree, stayget wins unless
propertycloud is clearly better *and* the community backs it; those exceptions are called
out.

This file is the *why*. The runnable files sit next to it. Record a superseding ADR in
your repo if you deviate (ADR-004).

---

## 1. Package manager - pnpm

- **stayget:** `pnpm@11.1.2`, `node >=24`. **propertycloud:** `pnpm@10.17.1`. Agreement.
- **Pros:** content-addressed store (fast, disk-cheap), strict by default (no phantom
  deps), first-class workspaces, and - decisively - the strongest supply-chain story of
  the three managers (see #7).
- **Cons:** stricter resolution occasionally trips packages that rely on hoisting; the
  fix is an explicit dependency, which is the point.
- **Community (2026):** pnpm is the default recommendation for new monorepos.
- **Pick:** **pnpm**, pinned via `packageManager` + `engines`, Node pinned via `.nvmrc`.

## 2. Monorepo task runner - Turborepo

- **stayget:** Turbo 2.10 with `globalDependencies` cache-busting on config files.
  **propertycloud:** no runner - `pnpm -r --parallel`, everything re-runs every time.
- **Pros (Turbo):** content-hash caching, `dependsOn` task graph, near-zero config,
  `pnpm`-native. **Cons:** no project-graph enforcement or code-gen (that is Nx's turf).
- **Community (2026):** "start with Turborepo, graduate to Nx when coordination is the
  bottleneck" is the standing advice; pnpm workspaces + Turbo is the common default, Nx
  earns its complexity at 10+ packages / multiple teams / enforced boundaries.
- **Pick:** **Turborepo** (stayget). Nx is a documented escape hatch, not the default.

## 3. Lint + format - Biome (with Prettier only for what Biome can't do)

- **stayget:** **Biome 2.5** as the one linter+formatter; Prettier kept *only* for
  `**/*.scss`. **propertycloud:** ESLint (flat config) + Prettier.
- **Pros (Biome):** one tool, one config, 10-50x faster than ESLint in CI, type-aware-ish
  rules without the TS service, a11y preset. **Cons:** ~80% of ESLint rule coverage - no
  type-aware rules needing the TS language service, and framework plugins
  (`eslint-plugin-react-hooks`, `eslint-plugin-next`) have no Biome equivalent yet.
- **Community (2026):** for **new** projects, start with Biome; keep ESLint only where you
  depend on a plugin Biome can't replace (the "hybrid" pattern). Adopters include the
  Node.js project, Vercel, Discord, Astro.
- **Pick (stayget wins the disagreement):** **Biome** as the default; Prettier scoped to
  SCSS (Biome doesn't format SCSS). If you truly need `react-hooks` lint, add a *minimal*
  ESLint alongside - do not make it the primary.

## 4. TypeScript - strict, with target stratified by layer

- **Both repos:** `strict: true`, `noUncheckedIndexedAccess: true`, `noUnusedLocals`,
  `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`. Base
  `target: ES2022`.
- **Difference:** stayget stratifies target by layer (ES2022 services / ES2017 web);
  propertycloud adds `noImplicitOverride: true`.
- **Community (2026):** strict-from-day-one, `noUncheckedIndexedAccess` on, ESM
  (`module`/`moduleResolution` bundler for apps). `verbatimModuleSyntax` is contested -
  neither repo uses it; Biome's `useImportType`/`useExportType` already enforce type-only
  imports, so the value is lower.
- **Pick:** stayget's base, **plus** propertycloud's `noImplicitOverride: true` (cheap,
  strictly better). Leaf `tsconfig` per app sets `module`/`jsx`/`moduleResolution`.

## 5. Fastify service - native plugin DI, no container (the contested one)

- **The community blogs** lean toward `@fastify/awilix` for "real" DI. **But both
  production repos disagree:** stayget and propertycloud each use **Fastify-native** DI -
  plugins + `decorate`/hooks + `setErrorHandler`, **no container** (no awilix/tsyringe in
  either `package.json`).
- **Pros (native):** no IoC framework to learn, encapsulation is Fastify's plugin scope,
  request-scoped state via `decorateRequest` + hooks, one fewer dependency. **Cons:**
  constructor-injection ergonomics are manual; very large graphs get wiring-heavy (where
  awilix would help).
- **The one thing propertycloud does better:** a **Zod-validated env schema** at boot
  (60+ vars, defaults, transforms). stayget reads `process.env` raw - the weakest spot in
  an otherwise stronger repo.
- **Pick:** **native plugin DI, no container** (both repos agree, so the standard's stance
  holds against the blogs) - **plus propertycloud's Zod env config** as the paved-road
  bootstrap. Reach for `@fastify/awilix` only if a service's graph genuinely outgrows
  native wiring, and record it as an ADR.
- Layering (stayget): `src/{lib,middleware,routes}` - `lib/` external clients, `middleware/`
  the `onRequest -> onSend -> onResponse` chain + error handler, `routes/` route files.

## 6. Next.js - App Router, standalone, security headers in a typed config

- **Both:** App Router, `output: "standalone"`, Turbopack monorepo `root`. stayget React
  18-class, propertycloud React 19.1.
- **stayget** writes `next.config.ts` (typed) with a real CSP/security-header strategy and
  a documented enforcement roadmap; propertycloud's `next.config.mjs` carries React-Native
  transpile (specialized) and `typescript.ignoreBuildErrors: true` (an anti-pattern to
  avoid).
- **Community (2026):** App Router + React 19 for new apps; ship security headers; never
  `ignoreBuildErrors`.
- **Pick:** stayget's typed `next.config.ts` shape with security headers + standalone;
  React 19 for greenfield.

## 7. Supply-chain cooldown - the standout, adopt it loudly

- **stayget** sets `minimumReleaseAge: 10080` (7 days) in `pnpm-workspace.yaml`, plus an
  explicit `allowBuilds` allow-list and `enablePrePostScripts: false`. propertycloud does
  not.
- **Community (2026):** this is now mainstream. **pnpm 11 ships `minimumReleaseAge` on by
  default at 1440 (1 day)**; Yarn Berry ships a 3-day gate. Real incidents (Shai-Hulud
  ~12h, the chalk/debug compromise ~2.5h) were inside a 1-day window - a cooldown would
  have blocked them.
- **Pick:** **7-day cooldown** (stayget, more conservative than the pnpm default) +
  `allowBuilds` + no pre/post scripts. Critical security bumps use a scoped exclude, not a
  global lower.

## 8. CI - least-privilege, pinned, cached (and one place the standard beats both repos)

- **stayget:** `concurrency` cancel-in-progress, `actions/setup-node` with `cache: pnpm`,
  Turbo `.turbo` cache, `pnpm install --frozen-lockfile`, gitleaks job with an explicit
  `permissions: contents: read` and a URL-pinned binary. **But `ci.yml` itself has no
  explicit top-level `permissions:` block** (defaults to read-write).
- **propertycloud:** AWS-first, community actions, no explicit permissions, no dep cache.
- **Community (2026):** least-privilege `permissions:` on every workflow; pin actions
  (ideally by SHA); cache the pnpm store; `--frozen-lockfile`.
- **Pick (the standard improves on the evidence):** stayget's caching + concurrency +
  frozen lockfile, **and add the explicit `permissions: contents: read` block stayget's
  `ci.yml` was missing.** SHA-pinning of third-party actions is the further hardening step.

## 9. Testing - Vitest + Playwright, orchestrated from the root

- **Both:** Vitest (unit) + Playwright (e2e), traces/screenshots on failure, 1 worker on
  CI. stayget orchestrates from the **root** (`pnpm test:all`, layer-filtered);
  propertycloud is per-package.
- **Community (2026):** Vitest is the default unit runner for TS; Playwright the default
  e2e.
- **Pick:** Vitest + Playwright, **root-level orchestration** (stayget) so the commands are
  discoverable and Turbo-cacheable.

---

## Summary - the paved road

| Axis | Pick | Source |
|---|---|---|
| Package manager | pnpm, Node 24 pinned | both |
| Task runner | Turborepo (Nx = escape hatch) | stayget |
| Lint + format | Biome (+ Prettier for SCSS only) | stayget |
| TypeScript | strict base + `noImplicitOverride`, target by layer | stayget + pc |
| Fastify DI | native plugins, **no container** | both (beats the blogs) |
| Env config | Zod-validated schema at boot | propertycloud |
| Next.js | App Router, standalone, typed config + headers | stayget |
| Supply chain | 7-day `minimumReleaseAge` + allowBuilds | stayget |
| CI | least-privilege + cache + frozen lockfile (+ explicit permissions) | stayget, hardened |
| Testing | Vitest + Playwright, root-orchestrated | stayget |

Provenance: `stayget` and `propertycloud` (private). Community checkpoints are cited in the
PR that introduced this file.
