# repository-standards

> A **living, versioned, self-verifying** engineering standard - the reference your repo
> trues up to. Point a repo at a version; it **aligns**, **guides the build**, and
> **proves it**: `align -> verify -> drift as a number`.

An opinionated, agents-first standard that keeps documentation, specifications, and
technical + business decisions **in the repo, versioned with the code**. It is both a
**guided start** for a new repo and a **reconciler** for a messy existing one - run by a
coding agent that already reads `AGENTS.md` - and at every point it makes compliance
**measurable, not a matter of opinion**.

## Why it exists

Four failure modes it is built to kill:

- **Decisions evaporate in chat.** The *why* lives in a thread or an agent session, then
  it is gone - so the next person re-litigates a settled decision.
- **Docs rot away from code.** A wiki elsewhere drifts the moment the code changes;
  nobody trusts it, so nobody updates it.
- **Specs describe, they don't build.** A spec you cannot rebuild or verify from means
  the code is the only real truth, and the spec quietly lies.
- **Drift goes unnoticed.** Code and intent diverge silently - found in an incident, not
  a review.

## The keystone: a versioned, self-verifying standard

The standard ships **versions**. A repo pins the one it follows in `.standards-version`,
and the same align mechanism runs at three moments:

| Moment | |
|--------|--|
| **Adopt** | point a repo at the standard; it is read, compared, and brought into line - adapted to its stack, never blind-copied ([`align-to-standards`](skills/align-to-standards/SKILL.md)). |
| **Update** | already on `v0.7.1`? Apply just the **delta** to `v0.7.2` - like bumping a dependency, not a re-scaffold ([`update-to-version`](skills/update-to-version/SKILL.md)). |
| **Verify** | prove it: `node scripts/self-verify.mjs` - version pin, skeleton, guards - a pass/fail your CI asserts ([`self-verify`](docs/self-verify.md)). |

## Who it's for

- **A new repo** - scaffold from the standard at a pinned version and go.
- **An existing, undocumented repo** - `assess -> align -> onboard`: capabilities specced,
  decisions recorded from the code, the rest queued as a backlog. Incremental, never a
  big-bang dump ([`repo-assessment`](docs/repo-assessment.md), [`onboard-repo`](skills/onboard-repo/SKILL.md)).
- **Building with an AI, three hats on** - PO turns vision into a behavioral spec that is
  immediately codeable; an architect records the decisions; a dev and the AI implement
  against it. One living spec, one backlog ([`ways-of-working`](docs/ways-of-working.md)).
- **Keeping a fleet current** - cut a new version and every repo can update to it, each
  self-verifying that it complies.

## What's inside

- **Living capability specs** - behavior by **capability** (not ticket or page) and
  **buildable** (rebuildable + verifiable from the spec alone), kept coupled to the code
  by a guard. [`specs/`](specs/README.md)
- **Decision records** - ADR (technical *why*) + BDR (business *why*) in MADR format,
  plus a **decision catalog**: the forks every project hits, with an opinionated default
  for each. [`decision-records/`](decision-records/README.md), [`catalog.md`](decision-records/catalog.md)
- **A backlog that feeds itself** - items fall out of spec deltas, code<->spec drift, and
  onboarding; they leave only when their definition of done is met.
- **Guardrails as tooling** - dependency-free guards (spec-structure, spec coupling +
  `--audit`, self-verify), secret scan, remote-DB write guard, hardened CI.
- **A taxonomy map** - where each kind of knowledge lands, so "ADR or rule?" stops
  recurring. [`docs/taxonomy.md`](docs/taxonomy.md)
- **Agents-first** - one `AGENTS.md` at the root is the single entry point; the standard
  is written to be *executed* by an agent, not just read.

**Altitude** (wins on conflict): `PRINCIPLES -> ADR/BDR -> specs + ARCHITECTURE ->
conventions -> code`.

## Two layers - adoptable independently

- **Layer 1 - the standard (stack-agnostic):** everything above. Works for any repo, any
  language.
- **Layer 2 - Node/TypeScript setup:** a runnable scaffold on top, distilled from real
  production repos (pnpm + Turbo, Biome, Fastify native DI, Next.js, Vitest/Playwright,
  hardened Actions). Take Layer 1 alone, or 1 + 2.

## Source, and `dist/`

The repo is organized **by concern** (`agents/`, `claude/`, `decision-records/`, `docs/`,
`github/`, `gitleaks/`, `skills/`, `specs/`) - the maintained **source**.
[`dist/`](dist/) is the same standard **assembled at real-repo paths** (`AGENTS.md`,
`.claude/`, `.github/`, `docs/`, `specs/`, ...) - the ready starting point. An agent
reads the standard and your repo, sees the difference, and applies it - it does not blind-copy.

## Versioning

Semver (`VERSION` + `CHANGELOG.md`). A PR **adds a `changes/` fragment**, never edits the
changelog or bumps the version; at release the maintainer assembles the complete technical
**changelog** and writes the curated **release notes** (`docs/changelog-process.md`), then
cuts the version.

## Start

```
# 1 - point your agent at the standard (a new repo, or your messiest one)
> align this repo to repository-standards@0.7.2

# 2 - it scaffolds / assesses / aligns, then proves it
$ node scripts/self-verify.mjs --version 0.7.2

# 3 - when the standard moves, bump it like a dependency
> update me to repository-standards@next
```
