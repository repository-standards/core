# Ideas - speculative, pre-decision, first-class

A home for an idea that **may never ship**, explored end-to-end - business and technical
shape included - without minting any record (see the taxonomy and ADR-010: `Proposed` is
for decisions awaiting ratification, not for maybes; no ADR/BDR/spec until approved).

## You have this case - say this

**A half-formed idea you do not want to lose.** It has no owner, no estimate and
possibly no future - that is fine, it still has a home:

```
> idea: let hosts pre-approve repeat guests so the second booking skips review
```

The agent writes `docs/ideas/<slug>.md` at status `idea` and stops there. No ADR, no
spec, no backlog row - minting a record for a maybe is how a repo fills with
decisions nobody made.

**The idea is worth exploring properly.** Say so and it gets the end-to-end pass -
business shape, technical shape, what would have to be true:

```
> explore the pre-approval idea properly - what breaks, what it costs, who would say no
```

**It is approved, or it is dead.** Both are answers, and both are said out loud:

```
> pre-approval is approved - graduate it
> pre-approval is dead: hosts do not want the liability - drop it with the reason
```

Graduating mints the spec, the records and the backlog intent through the normal
flow and flips the idea to `graduated` with links to what it became. Dropping keeps
the file, so the next person who has the same idea finds out why it died.

**Corner case - it is not an idea, it is a decision waiting.** If the question is
"which of these two do we pick", it is a record, not an idea. Ideas answer "should
this exist at all".

## Rules

- **One file per idea**: `docs/ideas/<slug>.md`, from [`_template.md`](_template.md).
  Slug, not a number - numbers are for records, and an idea is not a record.
- **Status header drives the lifecycle**:
  `idea -> exploring -> approved | parked | dropped` (and `graduated` after hand-off).
- **No ADR/BDR/spec until `approved`.** On approval the idea **graduates**: a backlog
  intent is created, the spec and any records are minted through the normal
  ways-of-working flow, and the idea doc flips to `graduated` with links to what it
  became.
- **`parked` / `dropped` docs stay** - one line at the top says why. Cheap memory that
  prevents re-exploring a dead end.
- **Keep this index current** (same-PR coupling): one line per idea below.

## Index

| Idea | Status | One-liner |
|---|---|---|
| - | - | (none yet) |
