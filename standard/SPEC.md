# The repository-standards spec

Version 0.7.2 - the spec is versioned with the standard (`VERSION`); a repo complies
at the version pinned in its own `.standards-version`. The standard is living: the
target of every align and update is always the latest - the pin records the state
last aligned to, never a version to stay at (ADR-025). The key words MUST, MUST NOT,
SHOULD and MAY are to be read as in RFC 2119.

This page is the whole normative core. Everything else in the standard explains,
templates or enforces what is written here; where any other document appears to add
a requirement, this page wins. Rules are numbered R1-R24 and the numbers are stable -
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
  reader will need, the document SHOULD say so in one line. History MUST NOT
  accumulate inside a living document - a spec or doc carries no change-log
  section; git and the changelog (R18) hold the past (ADR-018).
  A **fact has one home**: a count, a version, a path or a command restated in
  another document MUST either link to its home or be a **declared** restatement -
  listed in `docs/facts.json` with its source, so `scripts/facts-check.mjs` fails
  when the two disagree. A restatement nobody declared is drift waiting for a
  reader to notice, and a surface reworded past its own declaration fails the same
  way: silence there is indistinguishable from agreement.

## Decisions

- **R5.** A contestable, re-litigable choice MUST be recorded as a decision record
  in `docs/decision-records/` - ADR for technical, BDR for business, MADR form. A
  settled way of doing a recurring thing MUST be written as a rule where the next
  person will look; the standard's taxonomy (adopted by reference from the living standard - always latest) is the map of where each kind lands.
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
  repo to the standard - always the latest; the pin then records the state
  aligned to, and an update applies the delta between the pin and latest,
  preserving the repo's recorded deviations (the manifest's `exceptions`).

## Releases and hygiene

- **R18.** A PR MUST NOT add a version heading to the changelog and MUST NOT bump
  a version; the maintainer cuts every release. A PR describes its change under
  the changelog's Unreleased heading. *(scale)* Teams record per-PR fragments in
  `changes/` instead, assembled at release.
- **R19.** Secrets MUST NOT enter the repo - environment and a secret manager only.
  The shipped secret scan SHOULD gate CI, and agent access to remote databases
  SHOULD be write-blocked by the shipped settings baseline. The security baseline
  R7 requires as a recorded decision MUST state, at minimum, where each of the
  axes in `docs/security-baseline.md` lands for this repo - including the ones
  answered "not applicable", because an axis nobody considered and an axis
  deliberately dropped are indistinguishable a year later. Technology-specific
  depth belongs to the stack layer, never here.

## Layers and profiles

- **R20.** The standard is two layers, adoptable independently - Layer 1, this
  methodology, for any stack; Layer 2, optional technology best practices living
  in per-technology stack repos, official only when listed in the core registry
  (`stacks.json`) - and one standard with two profiles: core keeps knowledge
  alive in every repo, scale adds the coordination artifacts teams need. Solo
  repos meet core alone and are compliant. A stack declares what adopting it
  means in its own manifest (`stack.manifest.json`, the core schema); a repo
  that adopted one carries it, and `self-verify` counts one drift across both.

## Supply chain

- **R21.** Everything a repo consumes MUST be pinned exact and move only by an
  explicit, reviewed diff: dependency manifests and overrides carry exact versions
  (no ranges), sealed by a committed lockfile; container images, CI runners and
  actions name an exact version or digest - never `latest`, never a floating tag.
  A new version SHOULD clear a release-age cooldown (the paved road is seven days)
  before adoption; a critical security fix MAY bypass the cooldown through a
  recorded, temporary exclusion. Per-stack mechanics live in the stack repos
  (ADR-017).

## Agent executability

- **R22.** The lifecycle procedures - the spec loop, backlog capture, pre-PR
  review, version updates - MUST ship in the repo in a form the repo's coding
  agent can execute. The standard ships them as Claude-format skills
  (`.claude/skills/`) with their engine in `scripts/spec/` - the reference
  implementation. A repo whose agent tooling is not Claude MUST port them to its
  agent's own instruction mechanism (e.g. `.agents/skills`) - strictly and
  completely, before claiming compliance; `self-verify` accepts the ported
  location. A partial port is drift, not a variant (ADR-019).

## Integration and history

- **R23.** The mainline's history MUST read as one finished unit of work per PR.
  A branch is brought up to date by **rebasing onto its base**; the base MUST NOT
  be merged back into the branch. Every PR MUST be based on the mainline, never
  on another open PR's branch. A PR MUST land by **rebase-merge** (the paved
  road) or squash-merge - decided once and recorded with the branching decision
  (R7); the platform's linear-history protection SHOULD enforce it. Rebase-merge
  publishes every commit, so it MUST NOT be chosen unless each commit is a
  complete, buildable, reviewed change; a repo that will not hold that bar
  squashes instead. A branch MAY be rewritten while it is the author's alone;
  once another person or branch builds on it, it MUST NOT be (ADR-026).

## Data and schema

- **R24.** A repo that owns a database MUST carry that schema as executable DDL
  under `database/schema/`, complete enough to rebuild the database from a
  checkout alone - the disaster-recovery copy, and the artifact a schema change
  ships as (R19: an agent prepares the reviewed file, a human applies it).
  Migrations stay how a change reaches a database; they are the delta, never the
  readable current state. The same schema MUST also exist as a **typed,
  documented** definition in the stack's idiom (Zod in TypeScript, Pydantic in
  Python), and every path that reads or writes the database MUST go through it
  rather than restating row shapes inline. The two are **1:1**: every table,
  column, constraint and enum present in one is present in the other, each side
  names its counterpart, and a change to either MUST land in the same PR as the
  change to the other. Each side MUST name its counterpart in the file itself, so
  the pair is a declared edge rather than a convention: the shipped
  `scripts/schema-pair.mjs` resolves it both ways and fails when a name the DDL
  defines is absent from the twin. Either side MAY be generated from the other
  where the stack has a generator that does not silently drop what DDL can
  express; type agreement and generation are per-stack mechanics and live in the
  stack repos (ADR-027).

## What this standard does not do

It does not mandate a tracker, a CI vendor or a stack - Layer 2 is a paved road,
not a toll gate. It carries no company-specific configuration: tokens, tenant ids
and their like stay variables. It does not accept per-ticket or per-page specs -
that shape is rejected, not merely omitted (R8). It is not an open-source community
kit: codes of conduct, support and governance files are the adopter's own affair.
Edge cases and "what about X" belong in the standard's FAQ, never here as new rules.
