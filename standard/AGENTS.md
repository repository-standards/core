# AGENTS.md - <repo> agent and contributor guide

Primary entry point for coding agents (Cursor natively, Claude Code via a thin
`CLAUDE.md` router, Codex and others directly) and humans. Read this first. It is
the single source of truth for conventions - other files point here, they do not
restate.

## Documentation hierarchy (altitude - highest wins)

```
PRINCIPLES.md -> ADR / BDR (accepted decisions)
  -> specs/<capability> (behavior) + ARCHITECTURE.md (structure)
    -> conventions (incl. agent rules and skills)
      -> code
```

Behavioral source of truth = the [capability specs](specs/README.md) (what the
system does now). Decisions = [ADR / BDR](docs/decision-records/README.md) (why).
Structure = ARCHITECTURE.md. There is no TDR stream.

## Project

One-liner. What/why: [PRODUCT.md](docs/PRODUCT.md). How: [ARCHITECTURE.md](docs/ARCHITECTURE.md).

This repo follows repository-standards at the version pinned in
`.standards-version`. If a `stack.manifest.json` is present, it also carries a
technology layer (Layer 2): `self-verify` counts one drift number across both,
and the rationale behind every stack entry lives in that stack repo's DECISIONS.

## Repo map

| Path | Purpose |
|------|---------|
| ... | ... |
| `docs/backlog.md` | Ordered, agent-first backlog - the work the repo still owes itself (features + spec/decision/doc debt). |

## Commands

Common commands (install, dev, build, test, checks).

## Conventions

<!-- Merged from docs/conventions.md. Keep it here, do not duplicate into CLAUDE.md
     or .cursor/rules. -->

- Conventional Commits, ticket after the colon; no AI/tool attribution; ASCII
  hyphen only; small focused PRs.
- **Working language:** `<declare per artifact - default English>`. E.g. code +
  commits in English, docs + specs in `<team language>`, user-facing copy in the
  persona's language. Honor this everywhere; it is a config, not a constraint.

## Red flags - STOP and ask the human

A numbered, repo-specific list of things that must halt an agent. Make each concrete:

1. Writing to a remote database (DML/DDL/migrations) - deliver a `.sql` instead.
2. Contradicting an Accepted ADR - propose a superseding ADR first.
3. Adding a new dependency without an ADR.
4. A breaking schema / contract change.
5. Hardcoded secrets.
6. Shipping without the decision record the change implies.
7. <repo-specific>...

## Workflows

- **Add a feature / migration / decision record** - the spec-driven flow. Raw
  discovery (meeting extracts, mails) lands via `discovery-digest` in
  `docs/discovery/<topic>/` and feeds the loop - never re-asking what a spec
  already settled (ADR-024). New or
  changed behavior enters through `/spec-specify` + `/spec-clarify` (one capability);
  `/spec-impact` finds the ripple; `/spec-update` edits every affected spec;
  `/spec-plan` -> `/spec-tasks` -> `/spec-implement` build it; `/spec-reconcile`
  closes spec == code == tests and checks the specs still agree with each other.
  Work items come from and return to [`docs/backlog.md`](docs/backlog.md). Roles and
  hand-offs (PO -> dev -> AI): the standard's
  [ways of working](https://github.com/bodurkalukasz/repository-standards/blob/main/docs/method/ways-of-working.md),
  adopted by reference at your pinned version.
- **Bring this repo up to the standard (brownfield)** - alignment + onboarding: derive
  capabilities from the code, seed specs + the decisions the code implies, and put the
  rest in the backlog (run from a checkout of repository-standards:
  `skills/align-to-standards`). Incremental, never a big-bang dump.
- **Stay current with the standard** - this repo is pinned to a version in
  `.standards-version`. `update-to-version` applies the delta to a newer version (not a
  re-scaffold), then `self-verify` proves it complies: `node scripts/self-verify.mjs`
  (see [`docs/self-verify.md`](docs/self-verify.md)). The self-verify gate runs in CI.

## The loop runs itself (unprompted)

Do not wait to be asked. The standard's loop is **AI-led** (ADR-010; the clarify gate):

- **The user describes a feature, story, or behavior change** -> start the loop yourself:
  ask the clarify questions, record answers in the spec's `## Clarifications`. A deferral
  ("leaving this to the technical side") is an answer - record it, route it to the
  technical pass, never drop it. Loop until zero `[NEEDS CLARIFICATION]`.
- **The user changes code** -> run `spec-impact` on your own; if the change touches a
  capability's behavior, update its spec in the same PR (the coupling guard will block
  otherwise).
- **The user drops meeting notes, a transcript, or a mail** -> run `discovery-digest`:
  extract the essence (with provenance) into the topic's dossier under
  `docs/discovery/`, flag contradictions, and say whether the topic is ripe for
  `/spec-specify`. If a spec already exists, route only entries newer than the
  dossier's `Last reconciled:` stamp through `/spec-clarify` - a dossier is never
  normative and nothing the spec settled gets re-asked (ADR-024).
- **Never take a spec to plan / tasks / the tracker** unless it passes the clarify gate
  (`Status: ready-to-develop`). If the user asks you to skip ahead, show what is open
  instead.
- **Ask once, up front**: will the user author the technical detail, or should you
  propose it? Either way you propose and guide - hand-holding is the product.
- **On request, explain simply**: any ADR/BDR/spec, in plain language with examples
  anchored to `docs/personas.md` - the PO must never have to gate what they cannot read.

## What you must not do

The hard bans for this repo.
