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
- **Changelog:** two of them - technical + business/stakeholder - assembled from
  per-PR fragments; the maintainer cuts releases.
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

## Roadmap - open requirements

Captured here so they stop living in chat. Not yet built.

- [ ] **Taxonomy map** - one decisive doc: where each kind of knowledge lands (ends
      the recurring "ADR or rule?" question).
- [ ] **Two-changelog** system (technical + business) via changesets; maintainer-cut
      releases.
- [ ] **Backlog** layer - stories derived from spec deltas and code<->spec drift.
- [ ] **Manifest + align-engine** - data-driven reconcile with versioned migrations.
- [ ] **Layer 2** - `stacks/node-ts`, extracted from stayget / roomlink / console.
- [ ] Pending ADRs: specs-by-capability-not-page, spec-depth-buildable,
      align-engine-is-a-manifest.

## Non-goals

- Not company-specific config (tokens, tenant ids stay variables / overlay).
- Not one-size-fits-all - always adapted to the target stack and language.
