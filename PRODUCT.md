# repository-standards - product & roadmap

> The standard's own vision, dogfooded. This repo prescribes a `PRODUCT.md` for the
> repos it standardizes - so it keeps one for itself.

## What this is

The engineering + AI-agent standard, as an adoptable framework - a ready solution a
solutions architect hands to a team to run their repo the way it should be run:
documentation, specifications, and technical + business decisions kept in-code,
agents-first. Adoptable in any project, new or existing.

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
- [x] **Decision catalog** - the forks every project should consciously decide.
- [x] **Backlog layer** + `onboard-repo` - brownfield reconcile; items from spec deltas
      and code<->spec drift (`add-to-backlog` / `backlog-from-specs`).
- [x] **repo-assessment** + **ways-of-working** - the analysis before onboarding, and the
      PO -> dev -> AI feature flow.
- [x] **Versioned self-update (keystone)** - `.standards-version`, `update-to-version`,
      `self-verify` (CI-gated).
- [x] **Two changelogs** - per-PR fragments in `changes/`; complete technical changelog +
      curated, written release notes; maintainer cuts releases.
- [x] **Decision records** - ADR-001..004; ADR-005 (align-engine as a manifest) proposed.

**Open**

- [ ] **Align-engine (ENG-2)** - build the manifest + engine ADR-005 proposes.
- [ ] **Layer 2** - `stacks/node-ts`, extracted from stayget / roomlink / console.
- [ ] **`source -> dist` build** - retire the hand-maintained `dist/` snapshot.
- [ ] **Changelog assembler** - mechanize fragments -> the two outputs.

## Non-goals

- Not company-specific config (tokens, tenant ids stay variables / overlay).
- Not one-size-fits-all - always adapted to the target stack and language.
