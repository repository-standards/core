# Decision checklist - what a project should consciously decide

The **menu** of decisions, not the decisions themselves. A real project keeps hitting
the same handful of forks - datastore, auth, API shape, error model, release strategy.
This checklist names them, says why each matters, and gives the standard's **opinionated
default direction** (the paved road) so a team decides deliberately instead of drifting
into a choice by accident.

The decision itself becomes a record in this repo ([ADR / BDR](README.md)) - the
checklist only tells you *which decisions to expect* and *where the paved road runs*.
(The index of records that already exist - the library-catalog sense - lives in each
stream's README: `adr/README.md`, `bdr/README.md`.)

## How to use it

- **Greenfield scaffold:** draft the paved-road ADRs up front for the areas you are
  committing to; leave the rest as backlog items ("decide `<area>`").
- **Brownfield (the align router's onboarding phase):** walk the catalog against the code. For each area,
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
the registered stack for your technology (`stacks.json` in the standard repo; Node: repository-standards-node - picks and rationale live in its DECISIONS) 

| Decision | Why it matters | Default direction (paved road) | Record |
|---|---|---|---|
| Repo topology | Monorepo vs polyrepo shapes tooling, releases, ownership | Monorepo when code shares a release cadence or types; split only on a real ownership/deploy boundary | ADR |
| Domain / module boundaries | Bad seams make every later change cross-cutting | Slice by **capability/domain**, not by layer or page (mirrors [specs by capability](../../specs/README.md)) | ADR |
| Language & type strictness | Strictness caught early is cheap; retrofitted late is not | Strict typing on from day one; no gradual-any escape hatch as default | ADR |
| Working (natural) language | An AI reads any language, so this is a config, not a constraint; undecided means inconsistent artifacts | Default English; declare per-artifact in `AGENTS.md` (a non-English team is first-class); user-facing copy follows the persona | convention (AGENTS.md) |
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
| Security baseline | The floor below which nothing ships | Secret scanning, dependency audit, least-privilege CI, no plaintext secrets - a stated minimum; reference OWASP ASVS + SLSA `-> stack layer`; capabilities touching money, auth, or personal data get a trust-boundaries pass in their spec (see the capability template) | ADR |
| Accessibility baseline | "We'll do a11y later" means never; retrofitting it is dear | **WCAG 2.2 AA** as the floor for any user-facing surface; enforce what tooling can (e.g. Biome a11y rules) `-> stack layer` | ADR |
| UX review lens & research cadence | UI ships on vibes unless a named lens gates it | **NN/g 10 usability heuristics** as the review lens for user-facing change; lightweight usability tests (~5 users) before a meaningful surface change ships; personas carry **JTBD** so specs state the job, not just the actor | ADR |
| Design tokens & design-system handoff | Hardcoded values fork the visual language across surfaces | **W3C DTCG tokens (v2025.10)**, three tiers (primitive -> semantic -> component), one token source drives design tools and code `-> stack layer` | ADR |
| Performance & scaling budget | Un-budgeted perf becomes an emergency | A stated budget only where it matters (hot paths, SLAs); do not pre-optimize the rest | ADR |

## Delivery

| Decision | Why it matters | Default direction (paved road) | Record |
|---|---|---|---|
| Branching & release strategy | Ad-hoc branching stalls teams and hides work | Trunk-based with short-lived branches; small focused PRs; the **maintainer cuts releases**; decide the rollback triggers and the undo path before the first deploy (they belong in the runbook) | ADR |
| CI/CD & environments | Manual deploys drift and break | Pipeline-driven, reproducible; least-privilege permissions; actions pinned `-> stack layer` | ADR |
| Feature-flagging & rollout | Big-bang releases are high-risk | A decided rollout mechanism (flags / staged) for risky change, not deploy-and-pray | ADR |
| Changelog & release notes | Undocumented releases erode trust | Per-PR changelog fragments assembled at release; separate technical vs stakeholder audiences | ADR |

## Product & business (BDR stream)

These are **business** decisions - they go in the [BDR](bdr/README.md) stream, not the
technical log.

| Decision | Why it matters | Record |
|---|---|---|
| Target personas | Who the product is for - the gate every spec, idea, and backlog item validates against (personas are a validation gate; the standard's ADR-006); the primary persona wins ties | BDR (in `personas.md`) |
| Pricing / monetization model | Shapes the whole product and much of the data model | BDR |
| Data retention & compliance (GDPR, etc.) | Legal exposure; drives deletion and audit design | BDR |
| SLAs & support commitments | What you promise sets the engineering bar | BDR |
| Vendor / platform lock-in | A hard-to-reverse dependency on someone else's roadmap | BDR (with a technical ADR for the integration) |
| Positioning & messaging | The market hears noise when every surface re-phrases; the statement + pillars live in `docs/positioning.md` and every surface quotes them | BDR (changing the positioning) `-> scale note: solo repos still keep the one-liner` |
| North Star & KPI tree | "Success" defined per department is not defined; specs name the KPI they move | BDR (in `PRODUCT.md`) |
| Analytics tracking plan | Events named ad-hoc in code make dashboards lie; the plan is the single source for event names, same-PR coupled | ADR (adopting the plan + guard) `-> docs/analytics.md` |
| GTM / launch process | Launch chaos repeats without a reusable checklist | BDR `-> scale` |
| Sales / support enablement | Decks fork from reality unless they must quote `positioning.md` + release notes | federation rule, not a copy `-> scale` |
| Legal & compliance surface | Licenses/ToS/privacy unlinked from the repo get stale | pointers from README/PRODUCT `-> scale` |

---

## Keeping the checklist honest

This is a **starting menu**, deliberately opinionated - not an exhaustive checklist to
fill in mechanically. Skip an area that genuinely does not apply; add one this repo
keeps re-litigating that is missing here. The catalog earns its place only by ending
recurring arguments - if an entry never triggers a decision, drop it.
