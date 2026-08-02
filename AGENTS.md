# AGENTS.md - repository-standards (this repo itself)

> The standard preaches "AGENTS.md as the single entry" - this is its own. You are in
> the repo that **produces** the standard, not in a repo that consumes it. Two zones;
> know which one you are touching before you edit.

## The two zones

| Zone | What | Where |
|---|---|---|
| **1. This repo's own life** | governance, roadmap, backlog, gate tooling, the web surface, the transition skill, this repo's decisions | `README.md`, `PRODUCT.md`, `backlog.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `VERSION`, `docs/` (product docs + case studies), `docs/decision-records/` (this repo's ADRs - the repo follows its own R5 layout), `skills/` (the align router), `tools/`, `site/`, `.github/workflows/checks.yml`. Working notes, blog material and idea-stage research live OUTSIDE the repo (the owner's private space) - by rule, not by accident |
| **2. The standard itself** | the one authored, shipped tree, at the paths a client repo will have (ADR-014) | everything under `standard/` - `SPEC.md`, `AGENTS.md`, `.claude/skills/` (19 lifecycle skills), `.github/` (TEMPLATES - never enabled here), `docs/`, `specs/`, `scripts/` (guards + `scripts/spec/` engine), `standard.manifest.json` |

**One exception to the zone split, and it matters:** [`docs/method/`](docs/method/README.md)
sits in the root but is **not** repo-own. Its documents are adopter-normative, taken
**by reference** at latest rather than copied (the manifest's `references[]`, ADR-023) - the
taxonomy, the adoption gates, the repo assessment, the decision checklist, ways of working,
working with specs, discovery, the changelog process, working with AI. A reader who applies "the root is our own
life" to that folder discards half the method. Everything else under `docs/` - the product
docs, the case studies, `open-questions/`, `decision-records/` - is genuinely zone 1.

**This repo is not itself an aligned repo.** It carries no `.standards-version`, no copy of
`standard.manifest.json` and no `CLAUDE.md`, and the altitude order R1 requires lives in
[`README.md`](README.md) rather than here. That is deliberate: the tree is the product, and
its compliance is proved by `tools/tree-check.mjs` running `self-verify --skeleton` against
the pristine tree, not by this repo scoring itself against a pin it does not carry. Where
`PRODUCT.md` says the standard follows its own rules, read it as: its own decisions, specs,
backlog, personas and guards - not the adopter-side pin.

There is no third zone: the tree IS the shipped form - `npx degit
bodurkalukasz/repository-standards/standard` hands a client exactly what you see.
This repo's own decisions live in [`decision-records/`](docs/decision-records/README.md);
clients get them by reference (ADR-004), never as copies.

## Skills - two classes (ADR-009)

| Class | Skills | In the consuming repo |
|---|---|---|
| **Lifecycle** - ships and stays (the standard in daily use) | the 19 under `standard/.claude/skills/`: `spec-specify`, `spec-clarify`, `spec-plan`, `spec-tasks`, `spec-implement` (the engine, extracted from Spec Kit - ADR-015), `discovery-digest`, `spec-impact`, `spec-update`, `spec-reconcile`, `add-to-backlog`, `pre-pr-review`, `update-to-version`, `cycle-open`, `cycle-close`, `timeline-update`, `adr-write`, `bdr-write`, `product-write`, `personas-write` | ship with the tree and stay - they ARE the ways of working |
| **Transition** - getting TO the standard | `skills/align-to-standards/` (one router: greenfield / brownfield / update phases) | NEVER shipped - run from a checkout of this repo |

## Working here

- **Checks before any PR** (the same set CI runs - `.github/workflows/checks.yml`):
  `node tools/tree-check.mjs` (no leaks into the tree, manifest promises present,
  the tree passes its own `self-verify --skeleton`), `node tools/link-check.mjs`,
  `node standard/scripts/spec-structure.mjs` (the repo's own specs stay shaped),
  `node standard/scripts/spec-guard.mjs --base origin/main --block` **and**
  `node standard/scripts/spec-guard.mjs --audit --block` (code and its capability
  spec move together; every capability spec is mapped),
  `node tools/spec-guard-test.mjs`, `node tools/schema-pair-test.mjs` and
  `node tools/cycle-guard-test.mjs` (those
  guards still fire where they must), `node standard/scripts/facts-check.mjs` +
  `node tools/facts-check-test.mjs` (a fact restated in prose still agrees with
  its source - the declarations live in [`docs/facts.json`](docs/facts.json)),
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
  Everything the repo publishes, in one table: [`docs/README.md`](docs/README.md).
  What came from other projects, and in what form: [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md) -
  vendored code with its licence, borrowed ideas, and the projects this is only compared
  against. Adding to that last list as if it were an influence is a defect, not politeness.
- **If someone is evaluating whether to adopt this**, the honest material is not in the
  pitch: [`backlog.md`](backlog.md) names the evidence that does not exist yet,
  [`standard/docs/self-verify.md`](standard/docs/self-verify.md) states the limits of the
  drift number, and [`docs/open-questions/`](docs/open-questions/README.md) is the owner's
  own list of calls they are unsure about. Send them there before the README.
