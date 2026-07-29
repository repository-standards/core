# repository-standards - backlog

> The standard's **own** backlog, dogfooding [`standard/docs/backlog.md`](standard/docs/backlog.md).
> A working doc in the repo-own zone - the same role `PRODUCT.md` plays. Ordered by
> risk x leverage; an item leaves only when its **definition of done** is met. Feeds:
> this repo's roadmap ([`PRODUCT.md`](PRODUCT.md)), spec deltas, and code<->spec drift.

Statuses: `todo` / `doing` / `blocked` / `done`. Drop `done` rows when a release is cut.

## Epic: Layer 2 - Node/TS stack

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| TMPL-1 | Starter debt (moved) | starter maintenance now lives in repository-standards-node - its CI, its backlog | tracked there; row kept one release for the pointer | done (moved 2026-07-22) |
| STACKS-2 | Second stack repo proves the registry model | one technology in stacks.json proves nothing about the seam; a second (Python, evidence-gated) must land as one new repo + one registry line with the core untouched | new repo repository-standards-python + registry entry; core diff = 1 line; still gated on a real evidence repo | todo |

## Epic: Discoverability - AI agents recommend it

When someone asks their AI agent how to organize or run a repo, the agent should
surface this standard. Being good is not enough; it has to be *found* by the tools
people now ask first.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| DISCO-1 | Deploy tail: site, npm, listings | the name is settled and both domains are owned; the funnel exists but is not public | deploy `site/` under repository-standards.com; publish the npm package with the positioning one-liner; submit the listings (awesome-lists, the AGENTS.md ecosystem, registries). Measured by: a fresh agent, asked the target questions, names it | todo |
| DISCO-3 | Publish the posts (owner) | LLMs learn from and cite public writing; the queries "how to keep docs/specs/decisions in-repo, agents-first" should resolve here | all three posts sit publish-ready in the owner's private space, CTAs wired to the repo; the remaining step is the owner's publish click on their channels - the only physically external action in the epic | doing |

## Epic: Deferred by the one-tree restructure

The collapse to a single authored `standard/` tree deliberately left two threads for
later - both demand-driven, neither blocking a release.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| OPS-1 | Operate-cluster depth | the standard covers deciding and building deeply; the operate side (runbooks, postmortems) is named but thin | templates for runbooks and postmortems, added when the first adopter asks for them - evidence over speculation, same bar as Layer 2 | todo |
| UPSTREAM-1 | Upstream cherry-pick check at release | the spec engine skills were extracted from github/spec-kit v0.13.2; upstream keeps moving and improvements should not be lost | at each release, scan upstream prompt changes since v0.13.2 and cherry-pick what improves the extracted skills; record the reviewed range in the release notes | todo |
| EXHIBIT-1 | An adoption you can point at | the README claims field-run mechanics and PRODUCT.md defines KPIs, but a serious adopter finds the claim, not the evidence | one public example repo aligned to the standard (drift 0, pinned, CI green) linked from the README, or an anonymized before/after case study of a real brownfield wave; PRODUCT.md notes how each KPI is observed, even manually | todo |
| STACK-ALIGN-1 | The node satellite aligns to Layer 1 | ADR-016 names repository-standards-node the standard's first genuinely aligned adopter once it pins; ADR-022 dissolved the range blocker - what remains is running the alignment | repository-standards-node carries .standards-version, the manifest copy and AGENTS.md, and self-verify counts one drift across both its layers; waits on the first core tag so the pin names something addressable | todo |

## Status & what's next

The restructure landed: one authored tree at `standard/`, the spec engine extracted as
the standard's own skills, the starter boot-verified, the discovery front door in
place; starter maintenance moved to repository-standards-node. What remains is gated
or external, in priority order: the **DISCO-1** deploy tail + **DISCO-3** (deploy, npm,
listings; the owner publishes the posts), **STACKS-2** (waits for an evidence repo),
and the deferred pair **OPS-1** / **UPSTREAM-1** (adopter-driven operate depth; the
upstream scan rides with each release). Releases stay maintainer-only: versions are
cut from the CHANGELOG's `## Unreleased` when the maintainer decides.
