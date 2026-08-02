# Discovery - from a meeting to a spec, with provenance

> How raw discovery (meetings, mails, half-decisions) becomes a buildable spec
> without polluting it - and without ever explaining the same call twice.
> This doc is one worked example, start to finish; the rules fall out of it
> and are collected at the end. Decision: ADR-024.

The one-line model: **a dossier is the inbox of a topic; the spec is its
specification**. Materials flow in with their provenance; the loop drains them
out - decisions to records, behavior to the spec, work to the backlog. A
dossier is never normative: where it differs from the spec, the spec has
already won.

## The worked example: "change booking dates"

A hospitality product. The PO wants guests to change booking dates
themselves. Nobody can write the spec yet - pricing is undecided, UX has
nothing drawn, and the payment provider's sandbox is still being provisioned.
Watch the whole thread.

### Week 1 - the topic opens, materials arrive

After the first meeting, the PO (or anyone) hands the agent the meeting notes:

```
> /discovery-digest here are the notes from today's booking-changes meeting: <paste>
```

The digest skill creates the dossier and its first provenance-stamped entry:

```
docs/discovery/booking-changes/
  README.md                          <- summary on top, entry index, stamp
  2026-07-30-kickoff-meeting.md      <- essence + link to the recording
```

The entry is the **essence, not the transcript** (raw recordings stay in the
meeting tool, linked). It records who said what mattered: "guests change dates
up to 24h before check-in - said by the owner", "repricing open: keep the old
price vs reprice at change time - argued both ways, NOT decided".

A mail arrives two days later; same move:

```
> /discovery-digest mail from the payment provider about partial refunds: <paste>
docs/discovery/booking-changes/2026-08-01-mail-provider-refunds.md
```

The digest updates the dossier README summary and - because the mail's refund
constraint contradicts what the kickoff assumed - flags it:

```
## Contradictions to resolve
- kickoff (07-30) assumes same-day refunds; provider mail (08-01) says T+3
  settlement. One of these gives. -> take to the next meeting
```

### Week 2 - the spec is drafted EARLY, and it is honest about its gaps

The team wants to see where they are. They do not wait for discovery to end:

```
> /spec-specify guests change their booking dates themselves
```

`spec-specify` checks `docs/discovery/` first, finds `booking-changes/`,
reads it (all entries - the dossier is young, nothing is folded yet) and
drafts `specs/booking-changes/spec.md` from the template. Everything the
dossier already settles goes straight into sections. Everything still missing
becomes a **typed open marker** naming what is missing and who brings it:

```
**Status:** in-refinement    <- the draft state

## Algorithms & rules
1. A change is allowed until 24h before check-in.        <- from the kickoff entry
2. Repricing: [NEEDS DECISION: BDR - keep old price vs reprice at change time; owner: business]
...
## Interface contracts
[NEEDS INPUT: UX flow for the date-change screen; owner: design]
...
## Data contracts
[NEEDS ASSET: provider sandbox credentials to verify refund shapes; owner: ops]
```

This is the point of drafting early: **the spec builds from day one, and its
open markers ARE the gap list** - what is missing, of what kind (a decision, an
input, an asset, a question), and who owes it. The clarify gate counts every
open marker of the family, so the spec mechanically cannot reach
`ready-to-develop` while anyone still owes anything. Nobody has to remember;
`/spec-clarify` reports the outstanding list on demand.

After drafting, specify stamps the dossier README:

```
Last reconciled: 2026-08-04 (specs/booking-changes @ <commit>)
```

### Week 3 - inputs land, markers close, the gate opens

- Business decides repricing -> that is a fork among alternatives, so it
  becomes **BDR-007** (with the rejected option recorded); the marker in the
  spec is replaced by the rule and a link. The dossier entry that argued both
  ways is marked `superseded-by: BDR-007`.
- UX delivers the flow -> the `NEEDS INPUT` marker resolves into the interface
  contract; the design file is linked, the entry marked `folded-into-spec`.
- Credentials arrive -> the refund shapes are verified verbatim, the
  `NEEDS ASSET` marker closes, and the T+3 contradiction resolves the
  kickoff's assumption (one line in Clarifications says so).

`/spec-clarify` drives the rest to zero, records answers and deferrals under
`## Clarifications`, and flips **Status: ready-to-develop**. The dossier
README now reads: summary on top ("what came out of this: BDR-007,
specs/booking-changes"), every entry marked, stamp updated. Plan, tasks and
implementation proceed as in [ways-of-working](ways-of-working.md).

### Month 3 - the case the rules exist for

A new meeting reopens pricing. Someone drops the notes into the digest. The
agent does NOT re-ask about anything already decided - old entries differ from
the spec, but a dossier is never normative and everything below the stamp is
history. It asks about exactly one thing: the **new** entry (newer than
`Last reconciled:`), and routes it through the normal loop - `/spec-impact`,
a clarify round, and if the decision genuinely changes, a superseding BDR.
The user explains the new input once; nothing old is re-litigated.

## The rules (all shown above)

1. **Home**: `docs/discovery/<topic>/` - per topic, not per spec; linked to
   specs by reference in both directions, never by name.
2. **Provenance first**: entries are `YYYY-MM-DD-source.md`, essence + link to
   the raw source. Transcripts stay out of the repo.
3. **Never normative**: spec and records always win; a difference is not a
   conflict. Consciously rejected inputs become records (rejected
   alternatives), documented once.
4. **The stamp closes the re-ask loop**: `Last reconciled:` in the dossier
   README; agents ask only about newer entries. Entry lifecycle:
   `new -> folded-into-spec | superseded-by-record | open`.
5. **Draft the spec early**: status `in-refinement` (the draft state) with
   typed markers - CLARIFICATION / DECISION / INPUT / ASSET, each with an
   owner. The clarify gate blocks the whole family; zero open markers earns
   `ready-to-develop`.
6. **Curator vs consumer**: `discovery-digest` maintains the dossier and
   flags contradictions; the `spec-*` skills read it at specify/clarify/plan
   time. Neither does the other's job.
7. **Adoption fills the first dossiers**: a repo joining the standard usually has years
   of knowledge somewhere that is not the repo - a wiki, a tracker, an `rfcs/` folder,
   a decision nobody moved out of a ticket. Intake asks for it and suggests where to
   look, because nobody recalls their own documentation on demand. What arrives lands
   here with its provenance and is then read as a **claim about the code**: where it
   agrees, the retroactive record gets the context and rejected options that code alone
   never yields; where it disagrees, **the code wins and the divergence is reported** -
   a written decision the system stopped honouring is usually the most valuable finding
   of the whole assessment. Nothing here blocks adoption: the code is always the primary
   source, and material handed over later is folded in on the next pass.
8. **Idea vs discovery vs spec**: an idea (`docs/ideas/`) is a one-file maybe;
   a dossier is a materials-bearing topic in active discovery; the spec is the
   specification. Approval moves an idea forward; drafting moves a dossier's
   essence into a spec; neither ever moves backward.
