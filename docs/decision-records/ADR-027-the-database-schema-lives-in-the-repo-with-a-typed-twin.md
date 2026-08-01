# ADR-027: The database schema lives in the repo, with a typed twin

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-01 |
| **Author** | Łukasz Bodurka |
| **Tags** | data, schema, disaster-recovery, types |

## Context

The standard says where every kind of knowledge lives - behavior in specs,
decisions in records, procedures in skills - and says nothing about the database
schema, which in a product repo is the most consequential structure in the
system and the one thing a backup restores *into*.

Two failure modes follow, and both are ordinary:

- **The schema exists only in the running database.** The repo holds a chain of
  migrations, so the current shape is a fold nobody performs by reading. Losing
  the database means replaying that chain and hoping it still applies; reviewing
  a table means opening a client against an environment. There is no floor.
- **Every access path restates the row shape.** Each query, DTO and handler
  carries its own idea of what a row is, so nothing enforces that the code's
  shape and the table's shape agree - they diverge silently, one column at a time.

The operating rule this repo already runs under assumes the fix without ever
requiring it: an agent never writes to a remote database, it prepares a reviewed
`.sql` file for a human to apply. The shipped guard's own denial message names
`database/schema/` as where that file belongs. The standard never said the
directory should exist.

## Options considered

- **Migrations are the schema.** The current state is the fold of the chain, and
  the chain is already in the repo. Rejected as sufficient, kept as necessary:
  replay is not a read. Nobody reviews a table's current shape by reading twelve
  deltas, and a chain that breaks halfway has nothing underneath it.
- **The ORM model is the schema, DDL is generated from it.** One source, no
  pairing to maintain. Rejected: it binds the repo's most durable asset to a
  library's lifetime and to whatever that library can express - partial indexes,
  check constraints, triggers, grants and extensions do not round-trip, so the
  generated DDL is a subset presented as the whole.
- **A `pg_dump --schema-only` artifact committed by CI.** Always true by
  construction. Rejected as the primary copy: it is machine output, so its diff
  is unreviewable and it records what happened rather than what was intended. It
  is a fine *check* against the authored DDL, which is where it belongs.
- **Executable DDL in the repo, plus a typed definition the code goes through,
  kept 1:1.** Chosen.

## Decision

**A repo that owns a database carries that schema twice, on purpose, and the two
copies are one declared pair.**

- `database/schema/` holds executable DDL, complete enough to rebuild the
  database from a checkout alone. That is the disaster-recovery copy, the thing a
  reviewer reads, and the artifact a schema change ships as.
- A typed, documented definition in the stack's idiom (Zod in TypeScript,
  Pydantic in Python) is the shape every read and write path goes through -
  parsing, validation and inference come from it, not from inline restatements.
- The pair is **1:1**: every table, column, constraint and enum present in one is
  present in the other, each side names its counterpart, and a change to either
  lands in the same PR as the change to the other.

Either side may be generated from the other where a stack has a generator worth
trusting; generation changes who types the characters, not the rule. Migrations
stay how a change reaches a database - they are the delta, never the readable
current state.

## Consequences

- Positive: disaster recovery starts with a checkout instead of an archaeology
  session. A reviewer reads the current shape in one file. The code has one idea
  of a row, and it is the table's. The pairing is a **declared edge**, which is
  the shape the coupling guard already knows how to check - so this can become
  mechanical rather than staying a promise.
- Negative / cost accepted: two artifacts to keep in step, and until a per-stack
  generator or drift check exists, the 1:1 claim is held by review. A generator
  that silently drops constraints is worse than no generator, because it makes
  the DDL look derived while it rots.
- Follow-ups: per-stack mechanics - where the typed definition lives, how it is
  generated, whether the types themselves agree - belong in the stack repos, not
  here.

## Confirmation

`scripts/schema-pair.mjs`, shipped as a manifest guard, so `self-verify` counts a
broken pair as drift. It proves the two things that are provable without knowing
the twin's language: the declared edge resolves both ways, and every name the DDL
defines - table, column, enum type, enum label - appears in the twin (compared
case- and separator-insensitively, so a camelCase twin of a snake_case column
matches). A repo with no `database/schema/` reports that and passes; the rule is
conditional on owning a database.

Two things stay outside it, deliberately. Whether the *types* agree needs the
twin parsed structurally, which means knowing the language - that is a stack-repo
check. And a field in the twin with no column behind it is not drift: the
database is the source of what exists, and a typed module legitimately carries
input shapes and derived fields.

## Revisit when

A stack ships a generator plus a drift check that makes one side genuinely
derivable from the other - then the rule fixes the direction instead of leaving
it open. Or a repo arrives whose database is not owned by it (a shared,
externally governed schema), which the rule deliberately does not cover.

## Related

R24 and R19 in `standard/SPEC.md`; ADR-012 (in-repo instructions are the source
of truth); ADR-018 (history lives in the changelog - the schema file carries no
change-log section either).
