# Layer 2 - Node/TypeScript paved road: the decisions

Evidence-based, not blog-based. Every pick below was distilled from two production
monorepos (call them repo A and repo B) and cross-checked against 2026 community
consensus. Where the repos disagreed, the pick went to the side the community backs.
This file is the *why*; the runnable truth is [`starter/`](starter/). Deviating from a
pick? Record a superseding ADR in your repo (ADR-004) - the paved road is a default,
not a cage.

## Summary - the paved road

| Axis | Pick | Escape hatch |
|---|---|---|
| Package manager | pnpm, Node 24 pinned | - |
| Task runner | Turborepo | Nx at 10+ packages / enforced boundaries |
| Lint + format | Biome (+ Prettier for SCSS only) | minimal ESLint for a plugin Biome lacks |
| TypeScript | strict base + `noUncheckedIndexedAccess` + `noImplicitOverride` | leaf tsconfig per app |
| Fastify DI | native plugins, no container | `@fastify/awilix` when the graph outgrows wiring |
| Env config | Zod-validated schema at boot | - |
| Next.js | App Router, standalone, typed config + security headers | - |
| Supply chain | 7-day `minimumReleaseAge` + `allowBuilds` | scoped exclude for critical security bumps |
| CI | least-privilege permissions + pnpm cache + frozen lockfile | - |
| Testing | Vitest + Playwright + Lighthouse CI, tiered, root-orchestrated | - |
| Auth | Better Auth (product) / `openid-client` module (enterprise SSO) | - |
| Proxy | Next `proxy.ts` (Node runtime) + rewrites -> Fastify | - |
| Styling | CSS Modules + SCSS, DTCG three-tier tokens | Tailwind, superseded locally per ADR-004 |

## 1. Package manager - pnpm

**Pick:** pnpm, pinned via `packageManager` + `engines`, Node 24 pinned via `.nvmrc`.
Content-addressed store, strict resolution (no phantom deps), first-class workspaces,
and the strongest supply-chain story of the three managers (see #8). Both reference
repos agree; so does the 2026 default recommendation for new monorepos.
Stricter resolution occasionally trips a hoisting-reliant package - the fix is an
explicit dependency, which is the point.

## 2. Task runner - Turborepo

**Pick:** Turborepo - content-hash caching, `dependsOn` task graph, near-zero config,
pnpm-native. The standing advice holds: start with Turbo, graduate to Nx when
coordination is the bottleneck (10+ packages, multiple teams, enforced project
boundaries). Nx is the documented escape hatch, not the default.

## 3. Lint + format - Biome

**Pick:** Biome as the one linter+formatter; Prettier scoped to `*.scss` only (Biome
does not format SCSS). One tool, one config, 10-50x faster than ESLint in CI, a11y
preset included. The gap: no type-aware rules needing the TS language service, and some
framework plugins have no Biome equivalent. If you truly need one of those, add a
minimal ESLint alongside - never as the primary.

## 4. TypeScript - strict, target stratified by layer

**Pick:** `strict: true` plus `noUncheckedIndexedAccess`, `noImplicitOverride`,
`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`,
`noFallthroughCasesInSwitch`; base `target: ES2022`. Strict-from-day-one is the settled
consensus, and `noUncheckedIndexedAccess` catches the real index bugs. Leaf `tsconfig`
per app sets `module`/`jsx`/`moduleResolution`. `verbatimModuleSyntax` is skipped:
Biome's `useImportType`/`useExportType` already enforce type-only imports.

## 5. Fastify - native plugin DI, no container

**Pick:** Fastify-native DI - plugins + `decorate`/hooks + `setErrorHandler`, no IoC
container. Blogs lean toward `@fastify/awilix`; both production repos independently
shipped without a container, and encapsulation via plugin scope plus request-scoped
`decorateRequest` covers the need with one fewer framework. Reach for awilix only when
a service's graph genuinely outgrows native wiring, and record it as an ADR.
Layering: `src/{lib,middleware,routes}` - external clients, the hook chain + error
handler, route files. Twelve-Factor applies: config from the environment (validated
once, at boot), stateless processes, logs to stdout.

## 6. Env config - Zod-validated schema at boot

**Pick:** a Zod schema validates every env var at boot - defaults, transforms, fail
fast with a readable error. Raw `process.env` reads scattered through a service are the
weakest spot in otherwise strong repos; one schema is the fix and the Twelve-Factor
config story in practice.

## 7. Next.js - App Router, standalone, typed config

**Pick:** App Router, `output: "standalone"`, a typed `next.config.ts` carrying real
CSP/security headers, React 19 for greenfield. Never `typescript.ignoreBuildErrors` -
it is an anti-pattern observed in the wild, not a config option.

## 8. Supply-chain cooldown - 7 days

**Pick:** `minimumReleaseAge: 10080` (7 days) in `pnpm-workspace.yaml`, plus an
explicit `allowBuilds` allow-list and `enablePrePostScripts: false`. pnpm 11 ships a
1-day cooldown by default; real incidents (Shai-Hulud ~12h, the chalk/debug compromise
~2.5h) sat inside that window, so the paved road is more conservative. Critical
security bumps use a scoped exclude, never a global lower.

## 9. Testing - Vitest + Playwright + Lighthouse CI, tiered

**Pick:** Vitest (unit + integration) + Playwright (e2e) + Lighthouse CI (advisory
perf/a11y budgets), orchestrated from the repo root so the commands are discoverable
and Turbo-cacheable. The tiers: unit proves one module's logic (no I/O, milliseconds);
integration proves the contract with a real backing service via an ephemeral Docker
test-stack (`docker-compose.test.yml`, non-default ports, tmpfs, healthchecks - never a
shared dev DB); e2e proves a user journey through the booted app. Unit and integration
tests are co-located (`*.test.ts` / `*.integration.test.ts`, split by Vitest project);
journeys live in a top-level `e2e/` workspace package because they cross app
boundaries. Money / security / external-contract paths are non-negotiable at the
integration tier and above (mirrors the
[testing-strategy catalog entry](../../standard/docs/decision-records/checklist.md)).
Maintenance rules: coverage is a floor on paths that matter, not a vanity percentage;
flaky tests are quarantined with an owner, never retried-forever; a test changes in the
same PR as its spec; if the unit suite needs Docker, it is mis-tiered.

## 10. App shell - auth, proxy, styling

**Pick (auth):** Better Auth for product auth - sessions in your Postgres, MFA and
rate-limiting built in; it is the 2026 default for new TS apps and now maintains
Auth.js/NextAuth, which is no longer the pick for new projects. Enterprise OIDC SSO
uses `openid-client` in one framework-agnostic shared module, so the same code serves
Next's auth routes today and a standalone Fastify tomorrow. Sessions: DB-backed and
revocable, short-lived with silent server-side refresh and an absolute cap.

**Pick (proxy):** Next `proxy.ts` on the Node runtime (it may query the DB, so the
session gate is revocable, not JWT-blind); Next `rewrites` route app-to-API traffic to
the Fastify service in dev and single-origin deploys. Auth gates live in both the proxy
and the service (default-deny) - the proxy is UX, the service is the boundary.

**Pick (styling):** CSS Modules + SCSS - co-located `*.module.scss`, no CSS-in-JS
runtime; design values come from DTCG three-tier tokens so the visual language has one
source. Tailwind is the recorded escape hatch for teams already living in it.

All three are assembled and boot-verified in [`starter/`](starter/): `pnpm i && pnpm dev`
boots web + api wired through the proxy with Better Auth in place.
