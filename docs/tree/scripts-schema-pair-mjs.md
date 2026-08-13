Keeps a database schema and its typed twin from drifting apart.

```
node scripts/schema-pair.mjs --block
```

## What it refuses to let happen

The executable DDL and the typed definition every read and write path goes through - Zod,
Pydantic, whatever your stack uses - are meant to be 1:1. They stop being 1:1 the moment
somebody adds a column on one side only, and nothing about that is visible until data
arrives in a shape nothing expected.

Each file names its counterpart in a `pair: <path>` comment, and this checks both directions.

With no flag it reads `database/schema/`. A repo whose recorded decision keeps the DDL
somewhere else points it there: `--dir <path>` for a directory of `.sql`, `--file <path>` for
a schema kept whole in one file.

## What it does not do

It does not read your database. It compares two files in the repository, which is the only
thing a dependency-free guard can honestly do - and the two files are what your code
actually uses.

## Decisions behind it

- **R24 - the DDL rebuilds the database from a checkout, and the typed definition is what
  the code goes through.** A migration-only history was the alternative: it means the
  current schema exists nowhere as a readable artifact and has to be replayed to be known.
- **The pair is declared in a comment, not inferred from names.** Inference works until the
  first repository that names things differently, which is every second one.
