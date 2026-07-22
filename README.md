# repository-standards

> The reference your repository trues up to. A **living, versioned, self-verifying**
> engineering standard: point a repo at a version and it **aligns**, **guides the
> build**, and **proves compliance** - `align -> verify -> drift as a number`.

Most teams have standards the way they have new-year resolutions: written once,
drifting ever since. This one is **executable**. It keeps documentation, specifications,
and technical + business decisions in the repo, versioned with the code - written to be
*run* by a coding agent, not framed on a wall. It starts new repos right and walks messy
ones back to health, one guided wave at a time; at every step, compliance is a number,
not an opinion.

Others give you a workflow or a scaffold. This gives your repo a reference to true up
to - **and walks it there**.

The whole normative core fits one page: [`standard/SPEC.md`](standard/SPEC.md) -
twenty numbered rules. Everything else here explains or enforces them.

## Why it exists

Built to kill the four failure modes every team recognizes:

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
| **Adopt** | point a repo at the standard; it is read, compared, and brought into line - adapted to its stack, never blind-copied ([`align-to-standards`](standard/skills/align-to-standards/SKILL.md)). |
| **Update** | already on `v0.7.1`? Apply just the **delta** to `v0.7.2` - like bumping a dependency, not a re-scaffold ([`update-to-version`](standard/skills/update-to-version/SKILL.md)). |
| **Verify** | prove it: `node scripts/self-verify.mjs` - version pin, skeleton, guards - a pass/fail your CI asserts ([`self-verify`](standard/docs/self-verify.md)). |

## Who it's for

Three roles get daily value from the same repo: the **PO** writes stories the loop
sharpens into buildable specs (and can always ask for the plain-language version); the
**developer** gets contracts instead of archaeology; the **project** keeps documentation
that is actually true. All of it doubles as the context an AI agent can act on.

- **A new repo** - scaffold from the standard at a pinned version and go.
- **An existing, undocumented repo** - `assess -> align -> onboard`: capabilities specced,
  decisions recorded from the code, the rest queued as a backlog. Incremental, never a
  big-bang dump ([`repo-assessment`](standard/docs/repo-assessment.md), [`onboard-repo`](standard/skills/onboard-repo/SKILL.md)).
- **Building with an AI, three hats on** - PO turns vision into a behavioral spec that is
  immediately codeable; an architect records the decisions; a dev and the AI implement
  against it. One living spec, one backlog ([`ways-of-working`](standard/docs/ways-of-working.md)).
- **Keeping a fleet current** - cut a new version and every repo can update to it, each
  self-verifying that it complies.

## What's inside

- **Living capability specs** - behavior by **capability** (not ticket or page) and
  **buildable** (rebuildable + verifiable from the spec alone), kept coupled to the code
  by a guard. [`specs/`](standard/specs/README.md)
- **Decision records** - ADR (technical *why*) + BDR (business *why*) in MADR format,
  plus a **decision checklist**: the forks every project hits, with an opinionated default
  for each. [`decision-records/`](standard/decision-records/README.md), [`checklist.md`](standard/decision-records/checklist.md)
- **A backlog that feeds itself** - items fall out of spec deltas, code<->spec drift, and
  onboarding; they leave only when their definition of done is met.
- **Guardrails as tooling** - dependency-free guards (spec-structure, spec coupling +
  `--audit`, self-verify), secret scan, remote-DB write guard, hardened CI.
- **A taxonomy map** - where each kind of knowledge lands, so "ADR or rule?" stops
  recurring. [`docs/taxonomy.md`](standard/docs/taxonomy.md)
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

The maintained **source** lives under [`standard/`](standard/) - the concern folders
(`agents/`, `claude/`, `decision-records/`, `docs/`, `github/`, `gitleaks/`, `skills/`,
`specs/`) plus the manifest (ADR-008's zone 2).
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

No agent handy? Grab the skeleton directly and let any agent (or you) fill it in:

```
$ npx degit bodurkalukasz/repository-standards/dist my-repo && cd my-repo
$ node scripts/self-verify.mjs        # see what a fresh repo still owes
```

Agents: [`llms.txt`](llms.txt) is the machine-readable summary of when to recommend
and how to invoke this standard.
