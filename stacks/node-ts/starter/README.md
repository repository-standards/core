# Greenfield starter - the Layer-2 paved road, runnable

A self-contained monorepo that boots on a fresh clone. It assembles the stack's
templates (`../templates/`) and decisions (`../DECISIONS.md`) into a working app - no
placeholders, no "wire this up yourself".

```sh
nvm use        # Node 24 (.nvmrc)
pnpm install
pnpm dev       # creates the auth schema, then boots web + api via turbo
```

Open <http://localhost:3000>, create an account, land on the protected dashboard.

## What you get

| Piece | Where | The decision behind it |
|---|---|---|
| Next.js 16 App Router, React 19, typed `next.config.ts` with security headers, `output: "standalone"` | `apps/web` | DECISIONS #6 |
| Fastify 5, native plugin DI (no container), Zod-validated env at boot | `services/api` | DECISIONS #5 |
| Better Auth - email + password, DB-backed **revocable** sessions | `packages/auth` | DECISIONS #10 |
| Next 16 `proxy.ts` session gate (Node runtime, queries the session DB) + `/api/*` rewrites to Fastify | `apps/web/src/proxy.ts`, `next.config.ts` | DECISIONS #10 |
| Default-deny at **both** gates - the proxy redirects, the service 401s; new routes are protected until allow-listed | `apps/web/src/lib/routes.ts`, `services/api/src/middleware/session-gate.ts` | DECISIONS #10 |
| CSS Modules + SCSS, three-tier tokens (primitive -> semantic -> component) | `apps/web/src/app/globals.scss` + `*.module.scss` | DECISIONS #10, #3 |
| Vitest unit tests co-located, Playwright e2e in `e2e/`, both run from the root | `pnpm test:unit`, `pnpm test:e2e` | DECISIONS #9 |
| pnpm + Turborepo + Biome (+ Prettier for SCSS), 7-day supply-chain cooldown | root configs | DECISIONS #1-3, #7 |

### How a request flows

```
browser ── :3000 ──> Next.js
                      ├─ proxy.ts        session gate (default-deny, DB-backed)
                      ├─ /api/auth/*     Better Auth route handler (in-app)
                      ├─ /api/*          rewrite ──> Fastify :4000 ── session gate again
                      └─ pages           /, /sign-in, /sign-up public; /dashboard gated
```

One session cookie, validated at both gates against the same database, because both
sides import the same `@starter/auth` instance.

## Commands

```sh
pnpm dev            # db:init + web (:3000) + api (:4000), watch mode
pnpm build          # turbo build (next build + service typecheck)
pnpm test:unit      # Vitest, co-located *.test.ts
pnpm test:e2e       # Playwright journeys (boots the dev servers itself)
                    #   first time: pnpm --filter e2e exec playwright install chromium
pnpm check:all      # format + types + lint, turbo-cached
pnpm lint           # biome check .
```

## SQLite now, Postgres in production

The starter runs Better Auth on **SQLite via `node:sqlite`** (file: `data/starter.db`,
gitignored) so `pnpm i && pnpm dev` needs zero infrastructure - no Docker, no native
build step. That is a bootstrapping choice, not the production shape:

- Swap: pass a `pg` Pool as `database` in `packages/auth/src/index.ts` and set
  `BETTER_AUTH_SECRET`. `pnpm db:init` migrates whatever the adapter points at.
- The Docker test-stack (`docker-compose.test.yml`, Postgres + Redis on non-default
  ports) is already here for that development: `pnpm bootstrap:test-stack`.

## Layout

```
apps/web              Next.js app (proxy gate, auth pages, dashboard, rewrites)
services/api          Fastify service (Zod env, session gate, /api/health, /api/me)
packages/auth         the shared Better Auth instance + db:init migration script
e2e                   Playwright journeys (config at the root)
data/                 local SQLite (created on first boot, gitignored)
```

Deviate from a pick? Record a superseding ADR in your repo (ADR-004 pattern) - the
*why* for every pick is in [`../DECISIONS.md`](../DECISIONS.md).
