# repository-standards

Canonical engineering + AI-agent standards, shared across repos. One source of
truth so every repo (and every new one) starts on the same baseline, and drift
is visible instead of silent.

## Model: core + opt-in modules

- **`core/`** - repo-agnostic baseline every repo gets, in layers:
  1. **Guardrails** - agent permission + PreToolUse guards (`claude/`), secret
     scanning (`gitleaks/` + `github/workflows/`), PR template (`github/`),
     conventions (`agents/conventions.md`), `CONTRIBUTING.md`, the `pre-pr-review`
     skill (`skills/`).
  2. **Decision records** - ADR + BDR, the *why* (decisions), kept lean; altitude
     hierarchy (`decision-records/`). No TDR stream.
  3. **Living specifications** - capability specs = the **behavioral source of
     truth** ("what the system does now"), organized by domain not by ticket, with a
     git-native change model, the Spec-Kit execution engine, and a spec-policy
     enforcement guard (`specs/`).
  4. **Repo docs** - templates every repo fills: PRODUCT (vision + future),
     ARCHITECTURE (structure + boundaries), AGENTS (entry point), PRINCIPLES, docs
     hub (`docs/`).
- **`modules/`** (coming) - opt-in tech/domain packs, each extracted from the repo
  that learned it the hard way: `soap`, `payments`, `fly`, `nextjs`, `fastify`,
  `observability`, `postgres`. A repo declares which it uses and pulls only those.

**Shape vs content.** The templates (`*.template.md`, `_template.md`) carry the
*shape* - the structure, conventions, and methodology. Each repo fills the
*content*: its own ADRs, its own product vision, its own architecture. The standard
never holds a repo's actual decisions or docs. "Aligning a repo" means it has every
layer in the standard's shape, not that it copies another repo's content.

Company-specific values (tenant ids, tokens, vendor quirks, `.env` shapes) never
live here - they are variables filled at apply time or kept in a private overlay.
This repo stays public-safe by construction so it can be opened up later.

## Enforcement ladder (why things live where they do)

A standard is only as good as its weakest rung. From strongest to weakest:

1. **Hooks** (`core/claude/settings.baseline.json`) - deterministic PreToolUse
   guards (remote-DB write guard, GitHub secrets guard). No goodwill needed.
2. **CI gates** (`core/gitleaks/`, `core/github/workflows/`) - block at PR,
   regardless of who or what authored the change.
3. **In-context rules** (`core/cursor/rules/`, agent docs) - auto-loaded each
   session.
4. **Reference** (this repo) - the weakest rung: consulted, not enforced. So the
   important things are pushed down as 1-3, not left as reference.

## Agent file policy (one source, tool files point to it)

`AGENTS.md` is the single source of truth for conventions and orientation - every
agent reads it (Cursor natively; Claude Code via a thin `CLAUDE.md` router; Codex
and others directly). Tool-specific files exist **only** where a tool does
something a flat `AGENTS.md` cannot:

- **`CLAUDE.md`** - a thin router that points at `AGENTS.md`. Never a second
  rulebook. (Claude Code auto-loads `CLAUDE.md`, not `AGENTS.md`, so the file has
  to exist - but it should only redirect.)
- **`.cursor/rules/*.mdc`** - only glob-scoped / always-apply rules that
  `AGENTS.md` structurally can't express (e.g. "when editing `service-*/**`, ...").
  Universal conventions are **not** restated here; they point to `AGENTS.md`.
- **skills** (`.claude/skills`, `.cursor/skills`, `.agents/skills`) - same
  procedure, different per-tool wrapper.

Rule of thumb: **never state the same rule in two files.** That is drift waiting
to happen. `core/agents/conventions.md` is the canonical conventions block - merge
it into a repo's `AGENTS.md`, do not copy it into tool files.

## How a repo consumes this

```sh
# apply the core baseline into a target repo (never clobbers existing files
# without --force; reports drift)
bin/sync.sh /path/to/target-repo
```

For an agent-native alignment (reconcile a repo to the current standard and open
a PR adapted to that repo's stack), use the `align-to-standards` skill in
`skills/`. `manifest.json` carries a sha256 per core file for drift detection.

## Governance: upstream-first

A change that would help 2+ repos and is repo-agnostic goes **here** first (PR),
not just locally - then propagates down via sync. A change specific to one repo
(a domain ADR, a vendor quirk) stays in that repo. Keep the path to contribute
upstream cheap, or repos will fix locally and this rots.

Versioned with semver (`VERSION` + `CHANGELOG.md`).

## Status

`v0.3.0` - core baseline plus the methodology layers: lean decision records
(ADR + BDR), living capability specs as the behavioral source of truth (with a
git-native change model and a spec-policy enforcement guard), and the repo doc
templates. Derived from an internal engineering audit. Modules, the `/spec-*`
command implementations, and the full sync CLI come next.
