# AGENTS.md - repository-standards (this repo itself)

> The standard preaches "AGENTS.md as the single entry" - this is its own. You are in the
> repo that **produces** the standard, not in a repo that consumes it. Three zones below;
> know which one you are touching before you edit.

## The three zones

| Zone | What | Where |
|---|---|---|
| **1. This repo's own life** | governance, roadmap, backlog, build tooling, marketing, working notes | `README.md`, `PRODUCT.md`, `backlog.md`, `CONTRIBUTING.md`, `CHANGELOG.md` + `changes/`, `VERSION`, `tools/` (reflect + changelog), `apps/landing-page/`, `docs/case-studies/` (public, anonymized field evidence). Working notes, blog material, and idea-stage research live OUTSIDE the repo (the owner's private space) - by rule, not by accident |
| **2. The standard's source** | the content and templates the standard is made of | everything under `standard/`: `docs/` (method + templates + shipped spaces), `specs/` (spec method + guards), `skills/`, `decision-records/`, `agents/`, `claude/`, `github/`, `gitleaks/`, `standard.manifest.json` |
| **3. The shipped skeleton** | what a consuming repo receives | `dist/` - **never edit by hand**; edit zone 2, then `node tools/reflect.mjs --write` |

Name collisions to not trip on: `standard/github/`, `standard/claude/`, `standard/agents/`, `standard/gitleaks/` are
**zone-2 sources** (shipped as `.github/`, `.claude/`, `docs/conventions.md`,
`.gitleaks.toml` in a consuming repo) - they are not this repo's own config. This repo's
own decisions live in `decision-records/` too (ADR-001..): the standard dogfoods its own
record policy.

## Skills - two classes (ADR-009, Proposed)

Only lifecycle skills ship in `dist/.claude/skills/`; transition skills stay here:

| Class | Skills | In the consuming repo |
|---|---|---|
| **Lifecycle** - the standard in daily use | `spec-analyze`, `spec-converge`, `spec-impact`, `spec-reconcile`, `spec-update`, `add-to-backlog`, `backlog-from-specs`, `pre-pr-review`, `update-to-version` | stay forever - they ARE the ways of working |
| **Transition** - getting TO the standard | `align-to-standards`, `onboard-repo`, `modernize`, `greenfield-start` | NEVER shipped - this repo's own utility, run by the agent pointing at the standard (greenfield-start even runs before the target exists) |

## Working here

- **Checks before any PR:** `node tools/reflect.mjs --check` (dist drift must be 0),
  `node tools/changelog.mjs --check` (fragments valid), `node tools/site-check.mjs`
  (landing + docs site shippable, positioning quoted verbatim). `node standard/specs/self-verify.mjs` reports
  non-zero drift here by design - this source repo is not a consuming repo.
- **Every PR adds a fragment** in `changes/` - never edit `CHANGELOG.md`, `RELEASE-NOTES.md`,
  or `VERSION`; the maintainer cuts every release (currently the 0.7.x line).
- **CI/workflow files in zones 2-3 are templates** - they must never run in this repo.
- **Working language:** English for every artifact in this repo. Drafts and notes cook
  in the owner's private space, in any language.
- The map of what knowledge goes where: [`standard/docs/taxonomy.md`](standard/docs/taxonomy.md). The plan:
  [`backlog.md`](backlog.md). The process: [`CONTRIBUTING.md`](CONTRIBUTING.md).
