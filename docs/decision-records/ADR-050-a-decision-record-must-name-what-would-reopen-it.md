# ADR-050: A decision record must name what would reopen it

| | |
| --- | --- |
| **Status** | Accepted (2026-08-13) |
| **Date** | 2026-08-13 |
| **Author** | Łukasz Bodurka |
| **Tags** | decision-records, verification, guards |

## Context

The `discovery-digest` skill's step 4 pulls every record's `## Revisit when` line across the
decision log and checks new discovery material against it. It is the only mechanism in the
standard that reads decisions *back*: without it a record sits past its own trigger and only
an agent's unbroken context would notice, which a fresh agent does not have.

That step is worth exactly as much as the set it greps. Measured on this repo's own log on
2026-08-13: **25 of 48 records carried the field, 23 did not** - and the 23 include every
record from 040 to 048, the nine most recent. So the tripwire covered roughly half the log
while its own text said "Every ADR/BDR carries a `## Revisit when` field". A reader of the
skill had no way to learn that the other half was untrippable.

The drift is not carelessness. The field was asked for in two places that cannot check
anything: the shipped `_template.md` prints a prompt, and `adr-write` lists it among the
sections to write. Nothing read it back, so it decayed exactly the way
[ADR-048](ADR-048-gate-artifacts-are-read-for-shape-not-presence.md) describes - an artifact
required by prose, never read, drifting until the thing that consumes it reports full
coverage over half a corpus. This is that record's own failure mode one level down, in its
own decision log.

## Options considered

- **A - Soften the claim.** Reword step 4 to "records that carry a `## Revisit when` field"
  and say plainly that the rest cannot be tripped. Cheap, honest, and touches one file.
  Rejected: it makes the skill truthful about a mechanism that stays half-useful forever, and
  the value of a grep across the log is precisely that it is complete. An accurate description
  of a broken tripwire is still a broken tripwire.
- **B - Require it going forward only.** Gate new records, grandfather the existing 23.
  Rejected: the missing 23 are not archaeology. They are the newest records in the log, the
  ones most likely to be sitting near a live trigger, so grandfathering exempts precisely the
  set the step exists to watch.
- **C - Require it, backfill, and gate it.** Chosen.

## Decision

Every decision record that still stands carries a filled `## Revisit when` section, and
`scripts/decision-records-check.mjs` fails the build without one. `Proposed` is included:
naming the signal is part of writing the record, not of accepting it.

- **Filled, not present.** A missing heading, a heading with an empty body, and a heading
  still carrying the template's own prompt text all count as no signal. The third case is the
  one that matters: it has a heading and a non-empty body, so anything counting headings calls
  it filled. Guidance comments are stripped before the body is judged, because a comment is
  the prompt, not the answer.
- **Superseded and rejected records are exempt** - a record that no longer binds has nothing
  to reopen. The status is matched at the *start* of the value, so
  `Accepted - supersedes ADR-013` is an accepted record that supersedes another one and still
  owes its own signal.
- **An honest "nothing reopens this" is a real answer and must be written as one.** Where a
  decision is structural, "nothing short of dropping the two-layer split" is what the section
  says. An invented threshold is worse than an empty section, because it fires - or fails to
  fire - on a number nobody meant.
- **The 23 records are backfilled from what each already stated**: a rejected option's
  condition, a named cost, a self-declared limit. Five already answered the question under
  the heading `## How we would know we were wrong`; those headings were **renamed** rather
  than joined by a second section, since two headings for one question is the drift this
  project keeps finding in its own files.
- **The skill's claim now states its limit.** Step 4 says the set is complete because the
  guard makes it so, and that a log predating the guard will still hold records that cannot
  be tripped at all - those get a line in the report rather than silence.

## Consequences

- Positive: step 4 greps a complete set, and the claim in its text is now backed by a check
  rather than by hope. Both `_template.md` files and both writing skills say the section is
  required and that an honest "no signal" is legal, so the next author is not guessing.
- Positive: the 23 backfilled sections are the first time several of those decisions state
  what would end them. Writing them surfaced that most records already contained the answer
  in their `Options considered` or in a cost they accepted.
- **Cost accepted:** an adopter whose log predates this guard meets 23-ish failures at once,
  on the alignment run rather than at record-write time where the work belongs. The failure
  names each record and what it needs, which is the most the guard can do about timing.
- **Cost accepted, and it is the same one ADR-048 names:** the guard reads shape, never
  judgment. It cannot tell a considered signal from a plausible sentence that will never
  fire. What it removes is the silent half of the corpus, not the possibility of a hollow
  answer.
- Follow-up: nothing yet checks that a `Revisit when` is *specific*. That is a review
  question, and inventing a heuristic for it would repeat the mistake this record is fixing.

## Confirmation

`tools/decision-records-check-test.mjs` holds eight new cases: a missing section, an empty
one, each template's prompt left in place (the two are worded differently, so recognising
only the ADR one would pass every unfilled BDR), a heading whose only body is an HTML
comment, a superseded record exempted, an accepted record that supersedes another one still
required, and an honest "nothing reopens this" accepted. The live case asserting this repo's
own `docs/decision-records/` does not trip its own guard now covers this check too, and the
guard already runs with `--block` in `.github/workflows/checks.yml`.

## Revisit when

- Backfilled or newly written sections start reading as boilerplate that satisfies the guard
  and can never fire ("when this stops working"). That is the guessed-rating failure
  [ADR-048](ADR-048-gate-artifacts-are-read-for-shape-not-presence.md) names, reproduced one
  level down again, and the answer would have to be a review duty, not a stricter regex.
- Adopters with pre-guard logs routinely suppress the check rather than backfill - meaning
  the gate fires at the wrong moment, and the requirement belongs at record-write time with
  alignment only reporting it.

## Related

- [ADR-048](ADR-048-gate-artifacts-are-read-for-shape-not-presence.md) - the principle this
  applies: an artifact nobody reads is not a gate, and a required artifact is read for shape.
- [ADR-033](ADR-033-the-spec-loop-reads-the-decision-log-before-it-writes.md) - the other
  direction of the same loop, where the spec skills read the log before writing.
- [ADR-024](ADR-024-discovery-dossiers-beside-the-specs.md) - the dossiers whose curator
  runs the tripwire this record repairs.
