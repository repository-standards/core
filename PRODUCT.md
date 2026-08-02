# repository-standards - product vision

> The standard's own vision, dogfooded. This repo prescribes a `PRODUCT.md` for the
> repos it standardizes - so it keeps one for itself.
> The idea behind all of it: [`docs/manifesto.md`](docs/manifesto.md).

## What this is

The engineering + AI-agent standard, packaged as an adoptable product: the ready answer
a solutions architect hands a team for how a repository should run. Documentation,
specifications, and technical + business decisions live in-code and stay alive with it;
an agent reads one entry point and executes the whole way of working. It fits a
greenfield started this morning and a brownfield that has survived a decade - the
transition is guided, resumable, and measured (drift as a number), not a leap of
faith. Adoptable in any project, any stack.

## Who it serves

Everything in the repo exists to be AI context that coheres - and to be daily-useful
to three roles:

- **PO** - writes stories the loop sharpens into buildable specs; the standard
  hand-holds the clarify loop and explains any record in plain language on demand.
- **Dev** - writes the technical (buildable) specs and develops against them, with
  the decisions recorded where the next person will look.
- **The project itself** - living, accurate documentation: the current version is
  the truth, everything in-repo, everything connected.

A capability that serves none of these three is out of scope.

## North Star & KPI tree

**North Star: repositories that stay aligned** - repos passing `self-verify` at the
standard's current version (not "adopted once": *still green after updates*).

- **Adoption** - repos aligned (drift 0 reached at least once).
- **Retention** - repos that run `update-to-version` and return to green within a
  release cycle (the keystone metric - a standard nobody updates to is dead).
- **Guidance quality** - waves to drift 0 on brownfields; clarify-gate pass rate
  without developer rescue (the PO leg working).
- **Reach** - a fresh agent, asked how to run a repo, names this standard;
  stars/forks as a proxy only.

Every capability spec names the KPI it moves (`Success metric` field); anything that
feeds none of these gets removed.

## Two layers - adoptable independently

- **Layer 1 - The Standard (stack-agnostic):** decisions as ADR/BDR, living capability
  specs, the taxonomy map ([`docs/method/taxonomy.md`](docs/method/taxonomy.md)),
  conventions and guardrails, `AGENTS.md` as the single agent entry.
- **Layer 2 - Technology best practices:** one satellite repo per technology,
  official when listed in the registry ([`stacks.json`](stacks.json)) - the picks and
  their rationale live in each stack repo's DECISIONS. First:
  [repository-standards-node](https://github.com/bodurkalukasz/repository-standards-node)
  (Next.js + Fastify, boot-verified starter).

## Adoption modes

- **Layer 1 alone** - the methodology for any project.
- **Layer 1 + 2** - a full Node/TS starter.
- **Greenfield** - scaffold and go. **Brownfield** - `align-to-standards` reconciles
  what you already have.

## How the standard governs itself (dogfood)

- Follows its own rules where they apply to it: its own ADRs, capability specs, backlog,
  personas and guards, all gated in CI. Not the adopter-side ones - this repo carries no
  `.standards-version`, no manifest copy and no `CLAUDE.md`, because it *produces* the tree
  rather than consuming it; the tree's compliance is proved by `self-verify --skeleton`
  running against the pristine tree in `tree-check`. Aligning this repo on itself is an open
  question, not a settled omission.
- **Right-size:** rule vs ADR vs doc - weight matches substance; an ADR only for a
  contestable, re-litigable decision.
- **The maintainer cuts every release;** PRs append to the CHANGELOG's
  `## Unreleased`, never a version heading.
- Enforce with tooling, not prose.

## Roadmap

Roadmap and work in flight: [backlog.md](backlog.md); history: [CHANGELOG.md](CHANGELOG.md).

## Non-goals

- Not company-specific config (tokens, tenant ids stay variables / overlay).
- Not one-size-fits-all - always adapted to the target stack and language.
