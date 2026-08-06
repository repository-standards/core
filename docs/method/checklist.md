# Decision checklist - what a project should consciously decide

The **menu** of decisions, not the decisions themselves. A real project keeps hitting
the same handful of forks - datastore, auth, API shape, error model, release strategy.
This checklist names them, says why each matters, and gives the standard's **opinionated
default direction** (the paved road) so a team decides deliberately instead of drifting
into a choice by accident.

The decision itself becomes a record in this repo ([ADR / BDR](../tree/docs-decision-records.md)) - the
checklist only tells you *which decisions to expect* and *where the paved road runs*.
(The index of records that already exist - the library-catalog sense - lives in each
stream's README: `adr/README.md`, `bdr/README.md`.)

## You have this case - say this

**Starting something new and you do not know what you are supposed to decide.** That is
what a menu is for - this is `align-to-standards`' own greenfield/onboarding pass, not a
standing capability of an already-aligned repo:

```
> walk me through the decisions this project should make consciously - propose the paved road for each
```

The agent proposes a default per fork, you argue with the ones that matter, and each
answer becomes a record. Silence on a fork is also an answer - it just becomes an
accidental one later.

**You inherited a repo and nobody knows why anything is the way it is.** Reverse the
checklist: find the decisions already taken and never written down - again, the
brownfield side of `align-to-standards`:

```
> which of these forks does this repo already have an answer to, in the code but not in a record?
```

**One fork is genuinely undecided.** Say so and leave the marker instead of pretending -
this is a backlog item (`add-to-backlog`, source: a missing decision), not a record
written for a decision nobody made yet:

```
> we cannot pick the auth model until legal answers - record the fork as open, with who unblocks it
```

**You notice something broken while deciding or discussing an unrelated fork.** That is
not one of these forks - it is work to not lose, not a decision to record. File it and
keep going (`add-to-backlog`); if you are fixing it right now instead of noting it for
later, it is just the current change, not a backlog item:

```
> btw the export is broken - not touching it now, just flagging it
```

**Corner case - the paved road is a default, not a rule.** Choosing against it is fine
and expected; choosing against it *silently* is what the record exists to prevent.

## How to use it

- **Greenfield scaffold:** draft the paved-road ADRs up front for the areas you are
  committing to; leave the rest as backlog items ("decide `<area>`").
- **Brownfield (the align router's onboarding phase):** walk the catalog against the code. For each area,
  detect what the code **already chose** and record it as a retroactive ADR/BDR; an area
  the code has **not** consciously decided (or decided inconsistently) becomes a backlog
  item.
- **Ongoing:** when a change forces one of these forks, this catalog is the prompt that
  it deserves a record, not a silent commit.

## Silence is the one answer you do not get

Most of this catalog will not apply to your repository. A static site decides no datastore,
a CLI decides no API contract, an internal tool may decide no auth model - and none of that
is a gap.

What is not allowed is leaving an area that **does** apply undecided, because it gets decided
anyway - by whoever writes the first file that depends on it, without an argument and without
a record. So there are two acceptable answers per area, and only two: the decision, or
**"does not apply here"** written down once. The second costs a line and saves the next person
from re-opening a question you already closed.

There is deliberately no minimum count and no required subset. Which areas apply is a property
of what you are building, not of this catalog, and a standard that asserted otherwise would be
demanding records about things that do not exist.

## Not every area is an ADR

Apply the record test (see the [record policy](../tree/docs-decision-records.md)): a record is for a
**contestable, re-litigable** choice - one a future engineer will argue about again. An
area with one obviously-right answer for your context is a **convention**, not an ADR.
Record the trade-off, not the obvious. One record per decision; at most ~3 options.

## Layers

The **areas** below are stack-agnostic - every project decides them. The concrete
paved-road **answers** for a given stack live in the registered stack repo for your
technology (`stacks.json` in the standard repo; Node: repository-standards/node -
picks and rationale live in its DECISIONS).

| Decision | Why it matters | Default direction (paved road) | Record |
|---|---|---|---|
| Repo topology | Monorepo vs polyrepo shapes tooling, releases, ownership | Monorepo when code shares a release cadence or types; split only on a real ownership/deploy boundary | ADR |
| Domain / module boundaries | Bad seams make every later change cross-cutting | Slice by **capability/domain**, not by layer or page (mirrors [specs by capability](../tree/specs.md)) | ADR |
| Two authored descriptions of one structure | A repo often describes the same structure twice because two consumers need it in different forms - a Bazel `BUILD` graph beside a `CMakeLists.txt` for embedded cross-compiles, one schema hand-written in a second SQL dialect for an embedded target. Neither copy is the source, so they drift apart silently, and the drift surfaces on whichever platform nobody builds daily | One side is generated from the other. Where nothing can generate it, declare the pair and put a check behind the declaration, so disagreement fails instead of waiting - the standard does exactly that for the duplication it cannot remove (a declared restatement under R4, the DDL/typed-twin pair under R24), and a build graph needs the repo's own equivalent. Keeping two hand-edited copies with no declared edge is the one answer that is not available | ADR |
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
| Numerical / semantic compatibility policy | For a library whose contract *is* its computed output (dtype coercion, rounding, precision, copy-vs-view), silent behavior changes break every consumer at once | A stated policy for what counts as a breaking change in output, and how it is deprecated (mirrors schema evolution, for computation instead of storage) - **does not apply** to most application repos, which is itself the answer | ADR |

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
| Security baseline | The floor below which nothing ships | Secret scanning, dependency audit, least-privilege CI, no plaintext secrets - a stated minimum; the full axis list the record must answer ships as `docs/security-baseline.md`, including the ones answered "not applicable"; reference OWASP ASVS + SLSA `-> stack layer`; capabilities touching money, auth, or personal data get a trust-boundaries pass in their spec (see the capability template) | ADR |
| Accessibility baseline | "We'll do a11y later" means never; retrofitting it is dear | **WCAG 2.2 AA** as the floor for any user-facing surface; enforce what tooling can (e.g. Biome a11y rules) `-> stack layer` | ADR |
| UX review lens & research cadence | UI ships on vibes unless a named lens gates it | **NN/g 10 usability heuristics** as the review lens for user-facing change; lightweight usability tests (~5 users) before a meaningful surface change ships; personas carry **JTBD** so specs state the job, not just the actor | ADR |
| Design tokens & design-system handoff | Hardcoded values fork the visual language across surfaces | **W3C DTCG tokens (v2025.10)**, three tiers (primitive -> semantic -> component), one token source drives design tools and code `-> stack layer` | ADR |
| Performance & scaling budget | Un-budgeted perf becomes an emergency | A stated budget only where it matters (hot paths, SLAs); do not pre-optimize the rest | ADR |

## Delivery

| Decision | Why it matters | Default direction (paved road) | Record |
|---|---|---|---|
| Branching & release strategy | Ad-hoc branching stalls teams and hides work | Trunk-based with short-lived branches; small focused PRs; the **maintainer cuts releases**; decide the rollback triggers and the undo path before the first deploy (they belong in the runbook). **If more than one release line is supported at a time, name the lines and how long each is supported** - the backport path follows from that, and an undeclared line is not one (R23, ADR-035) | ADR |
| Integration method & history shape | Rebase-vs-merge is re-argued every PR until it is decided once; the wrong pick strands work or makes `main` unreadable | **Rebase-merge onto a linear `main`**, branches updated by rebase and never back-merged, no PR based on another PR's branch; **squash-merge** where per-commit hygiene is not held - both are compliant, drifting between them is not (R23, ADR-026) | ADR (with branching, above) |
| CI/CD & environments | Manual deploys drift and break | Pipeline-driven, reproducible; least-privilege permissions; actions pinned `-> stack layer` | ADR |
| Feature-flagging & rollout | Big-bang releases are high-risk | A decided rollout mechanism (flags / staged) for risky change, not deploy-and-pray | ADR |
| Changelog & release notes | Undocumented releases erode trust | A PR describes its change under the changelog's `Unreleased` heading and never cuts a version - one mechanism at every profile, and one changelog per maintained release line where a repo has more than one (R18, R23); separate technical vs stakeholder audiences | ADR |

## Product & business (BDR stream)

These are **business** decisions - they go in the [BDR](../../standard/docs/decision-records/bdr/README.md) stream, not the
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
| Open-core / dual-license boundary | A repo split by directory into two licenses (e.g. AGPL core + a commercial `enterprise/` tree) has a real capability whose implementation straddles the boundary - a `capability-map.json` entry with globs spanning both trees erases the licensing split the coupling guard was never told exists. Record which side each capability's globs fall on, or split the capability at the license line if it genuinely spans it | ADR (the split itself) + note in each affected capability's spec |

---

## Keeping the checklist honest

This is a **starting menu**, deliberately opinionated - not an exhaustive checklist to
fill in mechanically. Skip an area that genuinely does not apply; add one this repo
keeps re-litigating that is missing here. The catalog earns its place only by ending
recurring arguments - if an entry never triggers a decision, drop it.
