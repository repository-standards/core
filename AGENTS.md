# AGENTS.md - repository-standards (this repo itself)

> The standard preaches "AGENTS.md as the single entry" - this is its own. You are in
> the repo that **produces** the standard, not in a repo that consumes it. Two zones;
> know which one you are touching before you edit.

## The two zones

| Zone | What | Where |
|---|---|---|
| **1. This repo's own life** | governance, roadmap, backlog, gate tooling, the web surface, the transition skill, this repo's decisions | `README.md`, `PRODUCT.md`, `backlog.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `VERSION`, `docs/` (product docs + case studies), `docs/decision-records/` (this repo's ADRs - the repo follows its own R5 layout), `skills/` (the align router), `tools/`, `site/`, `services/` (maintainer-deployed infra, e.g. `adoption-stats/` - not run by this repo's own CI), `.github/workflows/checks.yml`. Working notes, blog material and idea-stage research live OUTSIDE the repo (the owner's private space) - by rule, not by accident |
| **2. The standard itself** | the one authored, shipped tree, at the paths a client repo will have (ADR-014) | everything under `standard/` - `SPEC.md`, `AGENTS.md`, `.claude/skills/` (21 lifecycle skills), `.github/` (TEMPLATES - never enabled here), `docs/`, `specs/`, `scripts/` (guards + `scripts/spec/` engine), `standard.manifest.json` |

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
the pristine tree, not by this repo scoring itself against a recorded state it does not carry. Where
`PRODUCT.md` says the standard follows its own rules, read it as: its own decisions, specs,
backlog, personas and guards - not the adopter-side alignment record.

There is no third zone: the tree IS the shipped form - `npx degit
repository-standards/core/standard` hands a client exactly what you see.
This repo's own decisions live in [`decision-records/`](docs/decision-records/README.md);
clients get them by reference (ADR-004), never as copies.

## Skills - two classes (ADR-009)

| Class | Skills | In the consuming repo |
|---|---|---|
| **Lifecycle** - ships and stays (the standard in daily use) | the 21 under `standard/.claude/skills/`: `spec-specify`, `spec-clarify`, `spec-plan`, `spec-tasks`, `spec-implement` (the engine, extracted from Spec Kit - ADR-015), `discovery-digest`, `spec-impact`, `spec-update`, `spec-reconcile`, `add-to-backlog`, `pre-pr-review`, `update-to-latest`, `sprint-open`, `sprint-close`, `timeline-update`, `adr-write`, `bdr-write`, `product-write`, `personas-write`, `idea-write`, `show-backlog` | ship with the tree and stay - they ARE the ways of working |
| **Transition** - getting TO the standard | `skills/align-to-standards/` (one router: greenfield / brownfield / update phases); `skills/record-run/` (offers the closing session as human-prompting-corpus evidence - runs from this checkout, never the client's, since a re-adopted repo re-running it would offer to record the same session twice) | NEVER shipped - run from a checkout of this repo |

**The format is not ours, and that is the point.** Both classes are
[Agent Skills](https://agentskills.io/specification) - the open format published
2025-12-18 and read unmodified by several dozen agent products - so a skill written here
is portable by construction, and `.agents/skills` is a move rather than a port.
`node tools/skill-format-check.mjs` keeps that true. Writing a new skill, or reworking
one, starts at the format's own guidance rather than at our taste: [best
practices](https://agentskills.io/skill-creation/best-practices),
[optimizing descriptions](https://agentskills.io/skill-creation/optimizing-descriptions),
[evaluating skills](https://agentskills.io/skill-creation/evaluating-skills),
[using scripts](https://agentskills.io/skill-creation/using-scripts). What this project
took from where, and where it deliberately differs, is
[`ATTRIBUTIONS.md`](ATTRIBUTIONS.md).

## Working here

- **Checks before any PR:** `node tools/gates.mjs` - one command, and it is the whole set.
  It reads the steps out of [`.github/workflows/checks.yml`](.github/workflows/checks.yml)
  and hands each script to bash the way CI does, so the set that runs here cannot be a
  shorter version of the remote one. It runs every step even after one fails and prints the failures at the
  end; `--list` shows the commands without running them, and `--base <branch>` sets what
  the diff-gated guards compare against (default `main`, so the coupling and archive checks
  see the same diff the PR will). Run it **after committing** - those two guards diff
  commits, so against an uncommitted change they compare the base against itself and pass
  on nothing. No second copy of the list is kept here or anywhere else:
  two lists means one stale list, and it goes stale in the direction of reporting a pass.
  What each gate proves is written beside it in the workflow.
- **Changed anything under `standard/`?** Run `node tools/manifest-hashes.mjs` and
  commit the manifest: every `copy` entry records the hash of what it ships, and that
  is what lets an adopted repo notice a file whose content stopped being the
  standard's. `tree-check` fails on a stale one, so this is a step, not a habit.
- **Changelog:** a PR describes its change under `CHANGELOG.md`'s `## Unreleased`
  heading and bumps the version itself - PATCH by default, unless the maintainer
  directs a different bump or an explicit no-bump for that PR. This is this
  repo's own workflow (R25); the shipped R18 keeps releases maintainer-cut in
  adopting repos. The per-PR fragments folder was removed on 2026-08-02.
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
- **Lost in the tree? [`docs/file-map.md`](docs/file-map.md)** - every shipped path with its
  purpose, whether it is required, how it lands when a repo aligns, and the numbered rule that
  put it there. Generated from the manifest, so it agrees with `self-verify` by construction.
  It answers *what is this and why*; it deliberately does **not** answer *what do I put in this
  folder* - that is the folder's own `README.md`, which in turn must not restate the map.
  What came from other projects, and in what form: [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md) -
  vendored code with its licence, borrowed ideas, and the projects this is only compared
  against. Adding to that last list as if it were an influence is a defect, not politeness.
- **If someone is evaluating whether to adopt this**, the honest material is not in the
  pitch: [`backlog.md`](backlog.md) names the evidence that does not exist yet,
  [`docs/method/self-verify.md`](docs/method/self-verify.md) states the limits of the
  drift number, and [`docs/open-questions/`](docs/open-questions/README.md) is the owner's
  own list of calls they are unsure about. Send them there before the README.
