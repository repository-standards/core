# The repository-standards spec

Version 0.7.2 - the spec is versioned with the standard (`VERSION`); a repo complies
at the version pinned in its own `.standards-version`. The key words MUST, MUST NOT,
SHOULD and MAY are to be read as in RFC 2119.

This page is the whole normative core. Everything else in the standard explains,
templates or enforces what is written here; where any other document appears to add
a requirement, this page wins. Rules are numbered R1-R20 and the numbers are stable -
tooling cites them. `standard.manifest.json` is this spec's machine-readable
projection (each manifest entry names the rule it enforces), and
`scripts/self-verify.mjs` reports unmet rules as a drift count. Rules the manifest
cannot check mechanically are verified at review or by the shipped guards the
skills invoke (the clarify gate checks R12 by script, outside the manifest).
Rules marked *(scale)* bind team repos; everything else is the core profile and
binds every repo, a solo one included.

## Entry and knowledge

- **R1.** A repo MUST carry `AGENTS.md` at its root as the single entry point for
  agents and humans: what the project is, where each kind of knowledge lives, how
  work flows. It MUST state the altitude order - `PRINCIPLES -> ADR/BDR -> specs +
  ARCHITECTURE -> conventions -> code` - which wins on conflict. `CLAUDE.md` SHOULD
  exist as a thin pointer to it.
- **R2.** A repo MUST pin the standard's version in `.standards-version` and MUST
  carry its copy of `standard.manifest.json` at that version. It SHOULD carry the
  spec page (`SPEC.md`) the manifest projects, so the rules it is checked against
  are readable in place.
- **R3.** Project knowledge - documentation, specs, decisions, conventions - MUST
  live in the repo, versioned with the code. A rule that exists only in chat, a
  wiki or someone's personal agent config does not exist.
- **R4.** Documents are living: they MUST be updated in place. The current version
  is the truth; git is the history. When a change reverses something a future
  reader will need, the document SHOULD say so in one line.

## Decisions

- **R5.** A contestable, re-litigable choice MUST be recorded as a decision record
  in `docs/decision-records/` - ADR for technical, BDR for business, MADR form. A
  settled way of doing a recurring thing MUST be written as a rule where the next
  person will look; `docs/taxonomy.md` is the map of where each kind lands.
- **R6.** An accepted record MUST NOT be edited into a different decision. It is
  superseded by a new record: status flip plus link.
- **R7.** The eight foundation forks MUST each be consciously decided and recorded:
  repo topology, domain boundaries, datastore, API contract, auth model, testing
  strategy, security baseline, release strategy. The decision checklist carries the
  full menu with a paved-road default for each; accepting a default is a decision.

## Specs

- **R8.** Behavior MUST be specified by capability - never by ticket, page or
  feature number.
- **R9.** A capability spec MUST be buildable by default: an agent could rebuild
  and verify the capability from the spec alone. The behavioral tier is an escape
  hatch that MUST be justified in the spec and SHOULD be rare.
- **R10.** Every capability spec MUST name the persona it serves; a spec that
  serves nobody fails the structure guard.
- **R11.** Every capability MUST have an entry in `specs/capability-map.json`
  binding it to code globs. A change to a capability's code MUST land in the same
  PR as its spec update. *(scale)* The coupling guard blocks any PR that breaks
  this.
- **R12.** A spec MUST pass the clarify gate before planning or implementation:
  zero open questions, with explicit deferrals recorded as answers, never dropped.
- **R13.** Plan and task scaffolding is ephemeral and MUST be removed when the work
  closes. Specs, records and docs are permanent.

## Ideas and backlog

- **R14.** A speculative idea MUST NOT mint records or specs before it is approved.
  It lives in `docs/ideas/` under a status - idea, exploring, approved, parked,
  dropped - and graduates into the normal flow on approval.
- **R15.** The repo backlog holds intents, each with a definition of done; an item
  leaves only when its DoD is met. Execution state and work history live in the
  tracker - GitHub Issues by default, Jira or Linear as adapters.

## Verification and updates

- **R16.** Compliance MUST be enforced by tooling, not prose: `self-verify`
  (against the pinned manifest) and `spec-structure` MUST gate CI; *(scale)*
  `spec-guard` too. Aligned means self-verify reports drift 0.
- **R17.** Adoption and updates MUST adapt, never blind-copy: align reconciles a
  repo to the standard at a pinned version; an update applies the delta between
  versions and preserves the repo's recorded deviations (the manifest's
  `exceptions`).

## Releases and hygiene

- **R18.** A PR MUST NOT add a version heading to the changelog and MUST NOT bump
  a version; the maintainer cuts every release. A PR describes its change under
  the changelog's Unreleased heading. *(scale)* Teams record per-PR fragments in
  `changes/` instead, assembled at release.
- **R19.** Secrets MUST NOT enter the repo - environment and a secret manager only.
  The shipped secret scan SHOULD gate CI, and agent access to remote databases
  SHOULD be write-blocked by the shipped settings baseline.

## Layers and profiles

- **R20.** The standard is two layers, adoptable independently - Layer 1, this
  methodology, for any stack; Layer 2, optional technology best practices living
  in per-technology stack repos, official only when listed in the core registry
  (`stacks.json`) - and one standard with two profiles: core keeps knowledge
  alive in every repo, scale adds the coordination artifacts teams need. Solo
  repos meet core alone and are compliant.

## What this standard does not do

It does not mandate a tracker, a CI vendor or a stack - Layer 2 is a paved road,
not a toll gate. It carries no company-specific configuration: tokens, tenant ids
and their like stay variables. It does not accept per-ticket or per-page specs -
that shape is rejected, not merely omitted (R8). It is not an open-source community
kit: codes of conduct, support and governance files are the adopter's own affair.
Edge cases and "what about X" belong in the standard's FAQ, never here as new rules.
