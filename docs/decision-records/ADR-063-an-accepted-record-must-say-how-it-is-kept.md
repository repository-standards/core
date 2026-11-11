# ADR-063: An accepted record must say how it is kept

| | |
| --- | --- |
| **Status** | Accepted (2026-11-11) |
| **Date** | 2026-11-11 |
| **Author** | Łukasz Bodurka |
| **Tags** | decision-records, verification, guards |

## Context

Both shipped templates carry a `## Confirmation` section, and both `adr-write` and `bdr-write`
call it the thing that stops a record being decoration. Nothing read it.
`decision-records-check.mjs` checked `## Revisit when` for shape (ADR-050) and said nothing
about Confirmation, so a record could bind with the section missing, empty, or holding `TBD`.

Measured on this repo's own log on 2026-11-11: 9 of the Accepted records had no Confirmation
section at all (ADR-019, 021, 022, 023, 041, 053, 054, 059, 060), and 6 more carried it under
the name `## Compliance` with their Status in front matter, which the check did not read.

## Options considered

- **A - Leave it to review.** Rejected: that is the state that produced the 9.
- **B - Require it on every record still standing, as ADR-050 does for the signal.** Rejected:
  a `Proposed` record may genuinely not know yet how it will be enforced, and naming that is part
  of accepting it, not of drafting it.
- **C - Require it on Accepted records, read for shape, and backfill.** Chosen.

## Decision

`decision-records-check.mjs` reports an Accepted record whose `## Confirmation` (or
`## Compliance`, at either `##` or the `###` MADR nests it at) section is missing, empty once HTML comments are stripped, still carries the
template's prompt, or is only a placeholder that defers the answer: `TBD`, `TBC`, `TODO`, `-`,
`n/a`, `?`, `...`, "to be decided" and the like, with emphasis ignored. An honest "review only"
or "nothing confirms this yet" passes - both templates and both skills name it as the right
answer when nothing enforces the decision, and the check must not push authors into inventing a
guard.

Status is read from the table row the templates ship or, failing that, from a `status:` line in
front matter. Proposed, superseded, rejected, deprecated and withdrawn records are exempt.

The 9 records are backfilled from what each already stated, naming the existing check where one
exists and saying "review only" where none does.

## Consequences

- Positive: a binding record now states where it is enforced, or states that nothing enforces
  it, which is the red flag the templates already describe.
- Negative / cost we accept: several backfilled sections say "review only", which is honest and
  also a list of decisions nothing guards.
- Adopters with older logs will see failures on records that predate the rule, the same cost
  ADR-050 accepted.

## Confirmation

`tools/decision-records-check-test.mjs` covers each failing shape, the honest answers that
pass, the exempt statuses and front-matter records; it also runs the check over this repo's own
log, so a new Accepted record here without the section fails CI.

## Revisit when

Backfilled sections start reading as boilerplate written to satisfy the check rather than to
name an enforcement point, or adopters routinely suppress the check instead of answering it.

## Related

[ADR-050](ADR-050-a-decision-record-must-name-what-would-reopen-it.md) - the same rule, for the
reopening signal.
