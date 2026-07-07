# AGENTS.md - <repo> agent and contributor guide

Primary entry point for coding agents (Cursor natively, Claude Code via a thin
`CLAUDE.md` router, Codex and others directly) and humans. Read this first. It is
the single source of truth for conventions - other files point here, they do not
restate.

## Documentation hierarchy (altitude - highest wins)

```
PRINCIPLES.md -> ADR / BDR (accepted decisions)
  -> specs/<capability> (behavior) + ARCHITECTURE.md (structure) + conventions
    -> .cursor/rules + skills -> code
```

Behavioral source of truth = the [capability specs](docs/specs/README.md) (what the
system does now). Decisions = [ADR / BDR](docs/decision-records/README.md) (why).
Structure = ARCHITECTURE.md. There is no TDR stream.

## Project

One-liner. What/why: [PRODUCT.md](docs/PRODUCT.md). How: [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Repo map

| Path | Purpose |
|------|---------|
| ... | ... |
| `docs/backlog.md` | Ordered, agent-first backlog - the work the repo still owes itself (features + spec/decision/doc debt). |

## Commands

Common commands (install, dev, build, test, checks).

## Conventions

<!-- Merged from docs/conventions.md. Keep it here,
     do not duplicate into CLAUDE.md or .cursor/rules. -->

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

- **Add a feature / migration / decision record** - the spec-driven flow:
  `spec-impact` -> `spec-update` -> `spec-analyze` -> implement -> `spec-reconcile`.
  Work items come from and return to [`docs/backlog.md`](docs/backlog.md). Roles and
  hand-offs (PO -> dev -> AI): [`docs/ways-of-working.md`](docs/ways-of-working.md).
- **Bring this repo up to the standard (brownfield)** - `align-to-standards` (skeleton),
  then `onboard-repo` (derive capabilities from the code, seed specs + the decisions the
  code implies, and put the rest in the backlog). Incremental, never a big-bang dump.
- **Stay current with the standard** - this repo is pinned to a version in
  `.standards-version`. `update-to-version` applies the delta to a newer version (not a
  re-scaffold), then `self-verify` proves it complies: `node scripts/self-verify.mjs`
  (see [`docs/self-verify.md`](docs/self-verify.md)). The self-verify gate runs in CI.

## What you must not do

The hard bans for this repo.
