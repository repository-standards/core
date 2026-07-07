# Decision catalog - what a project should consciously decide

The **menu** of decisions, not the decisions themselves. A real project keeps hitting
the same handful of forks - datastore, auth, API shape, error model, release strategy.
This catalog names them, says why each matters, and gives the standard's **opinionated
default direction** (the paved road) so a team decides deliberately instead of drifting
into a choice by accident.

The decision itself becomes a record in this repo ([ADR / BDR](README.md)) - the catalog
only tells you *which decisions to expect* and *where the paved road runs*.

## How to use it

- **Greenfield scaffold:** draft the paved-road ADRs up front for the areas you are
  committing to; leave the rest as backlog items ("decide `<area>`").
- **Brownfield (`onboard-repo`):** walk the catalog against the code. For each area,
  detect what the code **already chose** and record it as a retroactive ADR/BDR; an area
  the code has **not** consciously decided (or decided inconsistently) becomes a backlog
  item.
- **Ongoing:** when a change forces one of these forks, this catalog is the prompt that
  it deserves a record, not a silent commit.

## Not every area is an ADR

Apply the record test (see [`README`](README.md)): a record is for a
**contestable, re-litigable** choice - one a future engineer will argue about again. An
area with one obviously-right answer for your context is a **convention**, not an ADR.
Record the trade-off, not the obvious. One record per decision; at most ~3 options.

## Layers

The **areas** below are stack-agnostic - every project decides them. The concrete
paved-road **answers** for a given stack live in that stack's layer (Node/TS: the
`stacks/node-ts` setup - pnpm + Turbo monorepo, Biome, Fastify native plugin DI, Next
App Router, Vitest/Playwright, hardened GitHub Actions, supply-chain cooldown). Where a
default is stack-specific it is marked `-> stack layer`.

---

## Foundation & structure

| Decision | Why it matters | Default direction (paved road) | Record |
|---|---|---|---|
| Repo topology | Monorepo vs polyrepo shapes tooling, releases, ownership | Monorepo when code shares a release cadence or types; split only on a real ownership/deploy boundary | ADR |
| Domain / module boundaries | Bad seams make every later change cross-cutting | Slice by **capability/domain**, not by layer or page (mirrors [specs by capability](../../specs/README.md)) | ADR |
| Language & type strictness | Strictness caught early is cheap; retrofitted late is not | Strict typing on from day one; no gradual-any escape hatch as default | ADR |
| Dependency & supply-chain policy | Every dep is attack surface and maintenance debt | A real bar to add a dependency (ADR for non-trivial ones); a supply-chain **cooldown** before adopting fresh releases `-> stack layer` | ADR |

## Runtime & data

| Decision | Why it matters | Default direction (paved road) | Record |
|---|---|---|---|
| Datastore & persistence model | The hardest thing to change later | One primary store chosen for the dominant access pattern; add a second store only with an ADR that states the cost | ADR |
| Schema evolution & migrations | Uncontrolled schema drift breaks prod quietly | Versioned, reviewed migrations; **never** write DDL to a remote DB ad hoc - ship a migration | ADR |
| Async, eventing & background jobs | Sync-by-default hides latency and coupling | Explicit boundary for what is async; a named queue/eventing mechanism, not scattered timers | ADR |
| Caching | Wrong cache = stale data or thundering herds | No cache until a measured need; when added, a stated invalidation rule per cache | ADR |

## Interfaces & contracts

| Decision | Why it matters | Default direction (paved road) | Record |
|---|---|---|---|
| API / contract style & versioning | Consumers depend on the shape; breaking it is expensive | One style per surface (REST / GraphQL / RPC), chosen deliberately; contracts are versioned and typed | ADR |
| Auth & authorization model | Retro-fitting authz is a security minefield | A single authn mechanism and one authz model (roles / scopes / policies) decided up front, not per-endpoint | ADR |
| Error & result modeling | Inconsistent errors leak internals and confuse clients | One error contract across the surface (shape, codes, what is exposed); decide throw-vs-result once | ADR |
| Config & secrets management | Secrets in the wrong place is the classic breach | Config from the environment; secrets never in the repo; **secret scanning** in CI `-> stack layer` | ADR |

## Quality & safety

| Decision | Why it matters | Default direction (paved road) | Record |
|---|---|---|---|
| Testing strategy | "How much testing" argued per-PR forever otherwise | Named test tiers and where each runs; money/security/contract paths are non-negotiable (mirrors buildable specs) `-> stack layer` | ADR |
| Observability | You cannot fix what you cannot see | Structured logging + the metrics/traces that matter, decided as a baseline, not bolted on after an incident | ADR |
| Security baseline | The floor below which nothing ships | Secret scanning, dependency audit, least-privilege CI, no plaintext secrets - a stated minimum | ADR |
| Performance & scaling budget | Un-budgeted perf becomes an emergency | A stated budget only where it matters (hot paths, SLAs); do not pre-optimize the rest | ADR |

## Delivery

| Decision | Why it matters | Default direction (paved road) | Record |
|---|---|---|---|
| Branching & release strategy | Ad-hoc branching stalls teams and hides work | Trunk-based with short-lived branches; small focused PRs; the **maintainer cuts releases** | ADR |
| CI/CD & environments | Manual deploys drift and break | Pipeline-driven, reproducible; least-privilege permissions; actions pinned `-> stack layer` | ADR |
| Feature-flagging & rollout | Big-bang releases are high-risk | A decided rollout mechanism (flags / staged) for risky change, not deploy-and-pray | ADR |
| Changelog & release notes | Undocumented releases erode trust | Per-PR changelog fragments assembled at release; separate technical vs stakeholder audiences | ADR |

## Product & business (BDR stream)

These are **business** decisions - they go in the [BDR](bdr/README.md) stream, not the
technical log.

| Decision | Why it matters | Record |
|---|---|---|
| Pricing / monetization model | Shapes the whole product and much of the data model | BDR |
| Data retention & compliance (GDPR, etc.) | Legal exposure; drives deletion and audit design | BDR |
| SLAs & support commitments | What you promise sets the engineering bar | BDR |
| Vendor / platform lock-in | A hard-to-reverse dependency on someone else's roadmap | BDR (with a technical ADR for the integration) |

---

## Keeping the catalog honest

This is a **starting menu**, deliberately opinionated - not an exhaustive checklist to
fill in mechanically. Skip an area that genuinely does not apply; add one this repo
keeps re-litigating that is missing here. The catalog earns its place only by ending
recurring arguments - if an entry never triggers a decision, drop it.
