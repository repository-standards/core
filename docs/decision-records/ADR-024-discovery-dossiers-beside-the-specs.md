# ADR-024: Discovery dossiers live beside the specs - and are never normative

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-30 |
| **Author** | Łukasz Bodurka |
| **Tags** | method, specs, discovery, taxonomy, lifecycle |

## Context

A feature rarely starts as a spec. It starts as weeks of discovery: meetings,
mails, screenshots, half-decisions - material whose *provenance* matters ("it
was said at THAT meeting", "this came from the client's mail"), not only its
extract. The taxonomy had no home for it. The nearest kinds both refuse the
job: an **idea** (`docs/ideas/`, ADR-010) is a one-file speculation that may
never ship, and a **spec** is the updated specification of the current or
target state - polluting it with raw materials would rot the one artifact the
whole standard exists to keep trustworthy. Teams were left holding transcripts
in chat and drives, which is failure mode #1 ("decisions evaporate in chat")
wearing a different coat.

The dangerous edge case: a spec is built, clarifications answered and
recorded - and later an agent reads the discovery material, which differs from
what the spec decided. Without a rule, the agent re-litigates: the user
explains the same call a second time.

## Options considered

- **A - materials inside the spec directory** (`specs/<cap>/discovery/`).
  Rejected: discovery precedes knowing the capability, one topic feeds many
  specs (and vice versa), the lifecycles differ (a spec lives forever, a
  dossier peaks and freezes), and `specs/` is a guarded normative surface -
  raw material does not belong under the guards.
- **B - stretch `docs/ideas/`**. Rejected: an idea is a one-file maybe with no
  materials; a dossier is an active, materials-bearing stage between idea and
  spec. Different genre, different lifecycle.
- **C - transcripts in the repo**. Rejected: volume, noise, personal data.
  The repo gets the distillate; raw recordings stay in the meeting tool or
  drive, linked.
- **D - a dossier folder per topic, upstream of the specs** - chosen.

## Decision

1. **Home**: `docs/discovery/<topic>/` - one dossier per discovery topic,
   named after the topic, **not** after a spec or capability (discovery often
   starts before the capability is known; linking is by reference, both ways:
   the dossier README links the specs it fed, a spec cites dossier entries in
   its `## Clarifications`).
2. **Provenance is first-class**: each entry is stamped with date + source
   (`2026-07-30-meeting-with-x.md`, `2026-07-28-mail-from-y.md`), carries the
   essence plus a link to the raw source. Raw transcripts stay out of the repo.
3. **A dossier is never normative.** Altitude puts it below everything:
   PRINCIPLES -> records -> specs -> conventions -> **discovery**. A
   difference between a dossier and a spec is *not* a conflict - the spec IS
   the resolution. An agent never re-asks about it.
4. **One-time consumption is recorded, not remembered**: the dossier README
   carries a **`Last reconciled:`** stamp (date / spec commit). Agents ask
   only about entries newer than the stamp. Entry lifecycle:
   `new -> folded-into-spec | superseded-by-record | open`. A consciously
   rejected discovery input becomes a record (MADR's rejected alternatives),
   which documents the difference once and forever.
5. **Typed blockers make an early spec buildable-in-progress**: a spec drafted
   during discovery uses the open-marker family - CLARIFICATION (a question),
   DECISION (a missing ADR/BDR), INPUT (e.g. a UX design), ASSET (e.g.
   credentials) - each naming what is missing and who brings it. Any open
   marker keeps the spec at `in-refinement` (the draft state); the clarify
   gate blocks the whole family, not just questions.
6. **Curator and consumer are separate skills**: `discovery-digest` curates
   the dossier (ingest a transcript/mail, update the summary, flag
   contradictions between entries, report readiness for a spec) and never
   writes specs; the `spec-*` skills consume the dossier at specify/clarify/
   plan time and never curate it.
7. **No new SPEC rule**: the taxonomy (R5) names the home; the manifest ships
   the optional `docs/discovery` shell under it. If practice hardens the
   dossier into a MUST, a rule can be minted then.

## Consequences

- Meeting knowledge has a home with provenance, and the spec stays a
  specification - not an archive.
- The re-ask problem is closed mechanically: precedence (never normative) +
  the `Last reconciled:` stamp + entry markers mean a user explains a call
  exactly once, and the explanation has an address.
- A team can draft the spec on day one of discovery and *see* what is missing
  and who owes it - the typed blockers are the gap list, and the gate keeps
  the draft honest about not being ready.
- One more lifecycle skill ships in the tree (`discovery-digest`), and the
  method gains a worked-example doc (`docs/method/discovery.md`, adopted by
  reference like the rest of the manual - ADR-023).

## Confirmation

The clarify gate (`scripts/spec/check-spec-clarified.sh`) fails a spec with
any open marker of the family; `docs/discovery` is a manifest entry
(optional, R5) so tree-check holds the shell and self-verify counts it when
the repo opts in; the method doc resolves as a manifest reference (tree-check
gate). Dossier hygiene - stamps updated, entries marked, contradictions
surfaced - is review-verified via the `discovery-digest` skill's checklist,
honestly in the judgment tier.

## Revisit when

Practice hardens the dossier into a MUST - the record explicitly declines to mint a
new SPEC rule for it now (`docs/discovery` ships as an optional manifest entry, not a
required one), on the stated basis that a rule can be written once that need is real
rather than assumed.
