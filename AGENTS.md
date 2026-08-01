# AGENTS.md - repository-standards (this repo itself)

> The standard preaches "AGENTS.md as the single entry" - this is its own. You are in
> the repo that **produces** the standard, not in a repo that consumes it. Two zones;
> know which one you are touching before you edit.

## The two zones

| Zone | What | Where |
|---|---|---|
| **1. This repo's own life** | governance, roadmap, backlog, gate tooling, the web surface, the transition skill, this repo's decisions | `README.md`, `PRODUCT.md`, `backlog.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `VERSION`, `docs/` (product docs + case studies), `docs/decision-records/` (this repo's ADRs - the repo follows its own R5 layout), `skills/` (the align router), `tools/`, `site/`, `.github/workflows/checks.yml`. Working notes, blog material and idea-stage research live OUTSIDE the repo (the owner's private space) - by rule, not by accident |
| **2. The standard itself** | the one authored, shipped tree, at the paths a client repo will have (ADR-014) | everything under `standard/` - `SPEC.md`, `AGENTS.md`, `.claude/skills/` (11 lifecycle skills), `.github/` (TEMPLATES - never enabled here), `docs/`, `specs/`, `scripts/` (guards + `scripts/spec/` engine), `standard.manifest.json` |

There is no third zone: the tree IS the shipped form - `npx degit
bodurkalukasz/repository-standards/standard` hands a client exactly what you see.
This repo's own decisions live in [`decision-records/`](docs/decision-records/README.md);
clients get them by reference (ADR-004), never as copies.

## Skills - two classes (ADR-009)

| Class | Skills | In the consuming repo |
|---|---|---|
| **Lifecycle** - ships and stays (the standard in daily use) | the 11 under `standard/.claude/skills/`: `spec-specify`, `spec-clarify`, `spec-plan`, `spec-tasks`, `spec-implement` (the engine, extracted from Spec Kit - ADR-015), `spec-impact`, `spec-update`, `spec-reconcile`, `add-to-backlog`, `pre-pr-review`, `update-to-version` | ship with the tree and stay - they ARE the ways of working |
| **Transition** - getting TO the standard | `skills/align-to-standards/` (one router: greenfield / brownfield / update phases) | NEVER shipped - run from a checkout of this repo |

## Working here

- **Checks before any PR** (the same set CI runs - `.github/workflows/checks.yml`):
  `node tools/tree-check.mjs` (no leaks into the tree, manifest promises present,
  the tree passes its own `self-verify --skeleton`), `node tools/link-check.mjs`,
  `node standard/scripts/spec-structure.mjs` (the repo's own specs stay shaped),
  `node standard/scripts/spec-guard.mjs --base origin/main --block` **and**
  `node standard/scripts/spec-guard.mjs --audit --block` (code and its capability
  spec move together; every capability spec is mapped),
  `node tools/spec-guard-test.mjs` (that guard still fires where it must),
  `node tools/docsite.mjs && node tools/site-check.mjs`. The list is the set CI
  runs - if a check is in `checks.yml` and not here, this line is the bug.
- **Changelog:** a PR describes its change under `CHANGELOG.md`'s `## Unreleased`
  heading - never a version heading, never `VERSION`; the maintainer cuts every
  release. (The fragments mechanism ships to team repos as a scale-profile
  prescription; this solo repo does not use it on itself.)
- **The spec wins:** where any document appears to add a requirement,
  [`standard/SPEC.md`](standard/SPEC.md) is the normative text; the
  manifest cites the rule each entry enforces.
- **Workflow files under `standard/.github/` are templates** - they must never run
  in this repository. The only live workflow is the root `checks.yml`.
- **Working language:** English for every artifact in this repo. Drafts and notes
  cook in the owner's private space, in any language.
- The map of what knowledge goes where: [`docs/method/taxonomy.md`](docs/method/taxonomy.md).
  The plan: [`backlog.md`](backlog.md). The process: [`CONTRIBUTING.md`](CONTRIBUTING.md).
