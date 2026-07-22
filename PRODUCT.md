# repository-standards - product & roadmap

> The standard's own vision, dogfooded. This repo prescribes a `PRODUCT.md` for the
> repos it standardizes - so it keeps one for itself.
> The idea behind all of it: [`docs/manifesto.md`](docs/manifesto.md).

## What this is

The engineering + AI-agent standard, packaged as an adoptable product: the ready answer
a solutions architect hands a team for how a repository should run. Documentation,
specifications, and technical + business decisions live in-code and stay alive with it;
an agent reads one entry point and executes the whole way of working. It fits a
greenfield started this morning and a brownfield that has survived a decade - the
transition is guided, resumable, and measured (`drift as a number`), not a leap of
faith. Adoptable in any project, any stack.

## Who it serves (the three-legged utility)

Everything in the repo exists to be **AI context that coheres** - and to be daily-useful to
three roles:

- **PO** - writes stories/behavioral specs the loop sharpens into buildable work; the
  standard hand-holds the clarify->specify loop and explains records in plain language.
- **Dev** - writes the technical (buildable) specs and develops against them, with the
  decisions recorded where the next person will look.
- **The project itself** - living, accurate, well-made documentation: the current version
  is the truth, everything in-repo, everything connected.

A capability that serves none of these three is out of scope.

## North Star & KPI tree (PDLC-2, dogfooded)

**North Star: repositories that stay aligned** - repos passing `self-verify` at the
standard's current version (not "adopted once": *still green after updates*).

- **Adoption** - repos aligned (drift 0 reached at least once).
- **Retention** - repos that run `update-to-version` and return to green within a
  release cycle (the keystone metric - a standard nobody updates to is dead).
- **Guidance quality** - waves to drift 0 on brownfields; clarify-gate pass rate
  without developer rescue (the PO leg working).
- **Reach** - agent recommendations (DISCO-1's fresh-agent test), stars/forks as a
  proxy only.

Every capability spec names the KPI it moves (`Success metric` field); an event in the
analytics plan that feeds none of these gets removed.

## Two layers - adoptable independently

### Layer 1 - The Standard (stack-agnostic)

The durable methodology; works for any repo, any stack, any language.

- **Decisions:** ADR / BDR in MADR format + the **taxonomy map** (what kind of
  knowledge lands where).
- **Behavior:** living capability specs - by capability (not by ticket or page),
  buildable (not descriptive).
- **Structure & vision:** `ARCHITECTURE`, `PRODUCT`, `PRINCIPLES`; docs organized by
  kind (Diataxis).
- **Rules:** conventions (commits, writing), coding standards.
- **Changelog:** two outputs - a complete technical changelog + curated release notes -
  from per-PR `changes/` fragments; the maintainer cuts releases.
- **Guardrails (as templates):** spec-structure, secret-scan, remote-DB write guard,
  PR template.
- **Agents-first:** `AGENTS.md` as the single entry; `align-to-standards` reconciles
  any repo to the current standard.

### Layer 2 - Stack Setup (Node/TS app tooling)

A runnable scaffold on top of Layer 1, distilled from real production repos
(stayget, roomlink, console).

- pnpm monorepo + Turbo; Node 24; TypeScript.
- Next.js (App Router, React 19) + Fastify (native plugin DI, no container).
- Biome (+ Prettier only for SCSS); Vitest + Playwright.
- Hardened GitHub Actions CI/CD; changesets releases; supply-chain cooldown; gitleaks.

## Adoption modes

- **Layer 1 alone** - the methodology for any project.
- **Layer 1 + 2** - a full Node/TS starter.
- **Greenfield** - scaffold and go. **Brownfield** - `align-to-standards` reconciles
  what you already have.

## How the standard governs itself (dogfood)

- Follows its own rules: its own ADRs, specs, guards.
- **Right-size:** rule vs ADR vs doc - weight matches substance; an ADR only for a
  contestable, re-litigable decision.
- **The maintainer cuts every release;** PRs add changelog fragments, never version
  bumps.
- Enforce with tooling, not prose.

## Roadmap

Tracked in the [`backlog`](backlog.md); the shape here.

**Shipped**

- [x] **Taxonomy map** - where each kind of knowledge lands (ends "ADR or rule?").
- [x] **Decision checklist** - the forks every project should consciously decide.
- [x] **Backlog layer** + `onboard-repo` - brownfield reconcile; items from spec deltas
      and code<->spec drift (`add-to-backlog` / `backlog-from-specs`).
- [x] **repo-assessment** + **ways-of-working** - the analysis before onboarding, and the
      PO -> dev -> AI feature flow.
- [x] **Versioned self-update (keystone)** - `.standards-version`, `update-to-version`,
      `self-verify` (CI-gated).
- [x] **Two changelogs** - per-PR fragments in `changes/`; complete technical changelog +
      curated, written release notes; maintainer cuts releases.
- [x] **Decision records** - ADR-001..007 accepted; 008/009 (zones, skill classes) proposed.
- [x] **Align-engine (ENG-2)** - `standard.manifest.json` + `self-verify` reading it; drift
      is a number.
- [x] **Layer 2** - `stacks/node-ts` (evidence-based picks + tiered testing paved road).
- [x] **`source -> dist` build** - `tools/reflect.mjs` (copy / divergent / authored /
      source-only classes); `--check` gates every PR.
- [x] **Changelog assembler** - `tools/changelog.mjs` builds both outputs from fragments.
- [x] **Personas + greenfield-start; modernize; adoption checkmap; living docs + doc
      indexes** (taxonomy).

**Shipped in wave 2 (2026-07-21)**

- [x] **Lifecycle (ADR-010)** - ideas -> records -> ephemeral plan/tasks -> close+cleanup;
      spec `Status` (in-refinement -> ready-to-develop via the clarify gate); tracker
      posture (GitHub Issues default, Jira/Linear adapters).
- [x] **Guided loop** - the loop runs itself (enforcement stack field-proven in production);
      re-entrant, payoff-ordered align; recorded deferrals; PO explain mode (EXPLAIN-1).
- [x] **Own personas** (PERS-3) + **STD-UX** (NN/g, JTBD, usability cadence, DTCG tokens).
- [x] **Research pass** - SDD landscape (the gap we occupy), tracker free tiers, field
      prior-art notes (kept out of the repo - private sources).

**Open** (mirror of the backlog's what's-next)

- [ ] **Ratify ADR-008/009/010** - zones migration (`STRUCT-1`), skill classes +
      cleanup mechanics (`SKILL-1`), lifecycle binding.
- [ ] **NAME-1** - decide the project name (blocked on owner).
- [ ] **STARTER-1** - boot-verified greenfield starter (Next+Fastify+auth+proxy+tests;
      "put up a repo and it runs"), own PR.
- [ ] **LAND-1 tail** - landing messaging (greenfield vs brownfield; PO-builds-via-spec).
- [ ] **L2 follow-up** - roomlink/console cross-check; stack gitleaks template.

## Non-goals

- Not company-specific config (tokens, tenant ids stay variables / overlay).
- Not one-size-fits-all - always adapted to the target stack and language.
