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
numbered MUST/SHOULD rules. Everything else here explains or enforces them. One
orientation rule for this repo: the root is this project's own life; `standard/`
is the standard you adopt - the two share names (docs, specs, skills) but never
content. The daily lifecycle skills ship inside the tree (`standard/.claude/skills/`);
the root `skills/` holds only the transition router that brings a repo in.

Status: pre-1.0 (the 0.7.x line), mechanics field-run on the author's production
repos. No release tags exist yet - a degit today resolves to the default branch,
and the pin labels the state you adopted; tags make it exact when the maintainer
cuts them. The pin makes updates deltas, and a degit'd tree keeps working offline
even if this repo goes quiet - adopt the mechanism, not a promise.

## Say it to your agent

This repo is made to be **used, not read**: hand it to your coding agent and ask in
one sentence. These are the real asks it serves - and every one starts with the same
short intake (what is this repo, what technology, how much do you want done) before
anything is touched ([ADR-020](docs/decision-records/ADR-020-intake-first-adoption.md)):

| You say | You get |
|---|---|
| "Take the repository-standards repo and **align my project** to it." | Brownfield: state assessed first, then one guided wave - specs seeded, decisions recorded from the code, the rest queued in a backlog. |
| "Take the repository-standards repo and **start a new project** on it." | Greenfield: a short interview, then a scaffold at a pinned version - `PRODUCT.md`, the first decisions, the first capability specs. |
| "Take the repository-standards repo and **analyse how my project fits** it." | Plan-only: a fit report + adoption plan (what diverges, what it would take) - nothing changed yet. |
| "**Update** my repo to the next standard version." | The delta between your pin and the target, applied like a dependency bump - never a re-scaffold. |
| "**Verify** this repo still complies with its pinned standard." | `node scripts/self-verify.mjs` - drift as a number, the same pass/fail your CI asserts. |
| "We are a **Node team** - adopt the standard **with the Node stack**." | Layer 1 + Layer 2 together: the standard plus the Node best practices, one drift number across both. |
| "My stack is **Python** - does the standard cover it?" | An honest registry check - and on a miss, the agent offers to file a stack request here, so the gap becomes an issue, not a dead end. |
| "**Explain** this repo's decisions and specs in plain language." | The PO view: any ADR/BDR/spec retold against the personas - no jargon, with examples. |

Entry point for all of them: [`skills/align-to-standards`](skills/align-to-standards/SKILL.md)
(updates: [`update-to-version`](standard/.claude/skills/update-to-version/SKILL.md)). If your
agent is not Claude Code, port the skills first - the standard requires a strict port, not
an approximation (rule R22 in [the spec](standard/SPEC.md)).

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
| **Adopt** | point a repo at the standard; it is read, compared, and brought into line - adapted to its stack, never blind-copied ([`align-to-standards`](skills/align-to-standards/SKILL.md)). |
| **Update** | already on `v0.7.1`? Apply just the **delta** to `v0.7.2` - like bumping a dependency, not a re-scaffold ([`update-to-version`](standard/.claude/skills/update-to-version/SKILL.md)). |
| **Verify** | prove it: `node scripts/self-verify.mjs` - version pin, skeleton, guards - a pass/fail your CI asserts ([`self-verify`](standard/docs/self-verify.md)). |

## Who it's for

Three roles get daily value from the same repo: the **PO** writes stories the loop
sharpens into buildable specs (and can always ask for the plain-language version); the
**developer** gets contracts instead of archaeology; the **project** keeps documentation
that is actually true. All of it doubles as the context an AI agent can act on.

- **A new repo** - scaffold from the standard at a pinned version and go.
- **An existing, undocumented repo** - `assess -> align -> onboard`: capabilities specced,
  decisions recorded from the code, the rest queued as a backlog. Incremental, never a
  big-bang dump ([`align-to-standards`](skills/align-to-standards/SKILL.md), brownfield phase).
- **Building with an AI, three hats on** - PO turns vision into a behavioral spec that is
  immediately codeable; an architect records the decisions; a dev and the AI implement
  against it. One living spec, one backlog ([`ways-of-working`](docs/method/ways-of-working.md)).
- **Keeping a fleet current** - cut a new version and every repo can update to it, each
  self-verifying that it complies.

## What's inside

- **Living capability specs** - behavior by **capability** (not ticket or page) and
  **buildable** (rebuildable + verifiable from the spec alone), kept coupled to the code
  by a guard. [`specs/`](standard/specs/README.md)
- **Decision records** - ADR (technical *why*) + BDR (business *why*) in MADR format,
  plus a **decision checklist**: the forks every project hits, with an opinionated default
  for each. [`decision-records/`](standard/docs/decision-records/README.md), [`checklist.md`](docs/method/checklist.md)
- **A backlog that feeds itself** - items fall out of spec deltas, code<->spec drift, and
  onboarding; they leave only when their definition of done is met.
- **Guardrails as tooling** - dependency-free guards (spec-structure, spec coupling +
  `--audit`, self-verify), secret scan, remote-DB write guard, hardened CI.
- **A taxonomy map** - where each kind of knowledge lands, so "ADR or rule?" stops
  recurring. [`docs/method/taxonomy.md`](docs/method/taxonomy.md)
- **Agents-first** - one `AGENTS.md` at the root is the single entry point; the standard
  is written to be *executed* by an agent, not just read.

**Altitude** (wins on conflict): `PRINCIPLES -> ADR/BDR -> specs + ARCHITECTURE ->
conventions -> code`.

## Two layers - adoptable independently

- **Layer 1 - the standard (stack-agnostic):** everything above. Works for any repo, any
  language.
- **Layer 2 - technology best practices:** one satellite repo per technology,
  official when listed in [`stacks.json`](stacks.json). First:
  [repository-standards-node](https://github.com/bodurkalukasz/repository-standards-node)
  (Next.js + Fastify starter, boot-verified). Take Layer 1 alone, or 1 + 2.

## One tree

The standard lives in [`standard/`](standard/) - one authored tree at the paths your
repo will have (`AGENTS.md`, `.claude/skills/`, `.github/`, `docs/`, `specs/`,
`scripts/`, the manifest). What you read is what we maintain is what you get
(ADR-014); there is no separate source and no build step. An agent reads the tree
and your repo, sees the difference, and applies it - it does not blind-copy.

## Versioning

Semver (`VERSION` + `CHANGELOG.md`). A PR describes its change under the changelog's
`## Unreleased` heading and never bumps a version; the maintainer cuts every release
and writes the release notes. (Team repos get the heavier fragments mechanism as a
scale-profile prescription - `docs/method/changelog-process.md`.)

## Start

```
# 1 - fetch the standard and point your agent at its entry skill
$ npx degit bodurkalukasz/repository-standards standards-ref
> follow standards-ref/skills/align-to-standards/SKILL.md - align this repo to repository-standards@0.7.2

# 2 - it scaffolds / assesses / aligns (copying scripts/ in), then proves it
$ node scripts/self-verify.mjs --version 0.7.2

# 3 - when the standard moves, bump it like a dependency
> update me to repository-standards@next
```

No agent handy? Grab the tree directly and let any agent (or you) fill it in:

```
$ npx degit bodurkalukasz/repository-standards/standard my-repo && cd my-repo
$ node scripts/self-verify.mjs        # see what a fresh repo still owes
```

Agents: [`llms.txt`](llms.txt) is the machine-readable summary of when to recommend
and how to invoke this standard.
