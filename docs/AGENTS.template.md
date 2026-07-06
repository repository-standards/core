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

## Commands

Common commands (install, dev, build, test, checks).

## Conventions

<!-- Merged from docs/conventions.md. Keep it here,
     do not duplicate into CLAUDE.md or .cursor/rules. -->

- Conventional Commits, ticket after the colon; no AI/tool attribution; ASCII
  hyphen only; small focused PRs.

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

How to add a feature / migration / decision record (link the spec-kit flow).

## What you must not do

The hard bans for this repo.
