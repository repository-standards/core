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

After the first meeting, the PO (or anyone) hands the agent the meeting notes. Just hand them
over - the agent recognises raw material for what it is:

```
> notes from today's booking-changes meeting: <paste>
```

**Advanced:** you can name the procedure yourself when you already know which one you want.
Both do the same thing, and the plain sentence is the normal way:

```
> /discovery-digest notes from today's booking-changes meeting: <paste>
```

Either way the dossier is created with its first provenance-stamped entry:

```
docs/discovery/booking-changes/
  README.md                          <- summary on top, entry index, stamp
  2026-07-30-kickoff-meeting.md      <- typed header + essence + link to the recording
```

The entry opens with a header table, filled from the shipped
`docs/discovery/_entry-template.md`, because these are the things nobody
reconstructs later:

```
| **Kind**    | meeting                                                    |
| **Date**    | 2026-07-30                                                 |
| **Present** | the owner, the PO, two engineers                           |
| **Purpose** | can guests move their own dates, and what does it cost us  |
| **Touches** | pricing, refunds, availability                             |
| **Raw**     | <link to the recording>                                    |
| **Outcome** | none yet                                                   |
```

**Kind** comes from a closed vocabulary (`meeting`, `call`, `mail`, `thread`,
`ticket`, `document`, `note`) so "was that agreed in a meeting or in a mail"
survives as something you can filter rather than read for. **Purpose** is the
question the session was called to answer - notes record answers, so the
question is exactly what is missing from them six months on. **Touches** names
the subjects the material bears on beyond this dossier: filing stays per topic,
but one session is rarely one topic, and this is the axis somebody searches when
they remember a conversation happened but not where it went. **Outcome** starts
at `none yet` and later names what came out of *this* entry.

Then the body: the **essence, not the transcript** (raw recordings stay in the
meeting tool, linked). It records who said what mattered: "guests change dates
up to 24h before check-in - said by the owner", "repricing open: keep the old
price vs reprice at change time - argued both ways, NOT decided".

Where the session's lasting value was an **explanation** rather than a decision -
how the provider's settlement actually works, why a constraint exists - it goes
under `## Explained here`. That is the one kind of content with nowhere else to
go: a decision leaves for a record, behaviour leaves for a spec, work leaves for
the backlog, and understanding stays here or is lost.

A mail arrives two days later; same move:

```
> mail from the payment provider about partial refunds: <paste>
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
> guests change their booking dates themselves
```

`spec-specify` checks `docs/discovery/` first, finds `booking-changes/`,
reads it (all entries - the dossier is young, nothing is folded yet) and
drafts `specs/booking-changes/spec.md` from the template. Everything the
dossier already settles goes straight into sections. Everything still missing
becomes a **typed open marker** naming what is missing and who brings it:

```
**Status:** in-refinement    <- the draft state

## Algorithms & rules
1. A change is allowed until 24h before check-in.   <- from the kickoff
2. Repricing: [NEEDS DECISION: old price or reprice; owner: business]
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

### Month 9 - the failure that does not look like one

Somebody asks how settlement timing actually works, and the agent starts
researching it: reading the provider's docs, the payment code, the schema. Half
an hour in, a person in the thread remembers there was a two-hour call about
exactly this, months ago.

There was, and it is in the repo - `## Explained here`, in an entry filed under
`booking-changes` and marked `folded-into-spec` long ago. Nothing was lost. It
was simply never opened, because everything the loop says about dossiers is
about entries *above* the stamp, and this one sits below it.

So the stamp's two jobs are split (ADR-049). Before researching a subject or
explaining how something works, an agent searches `docs/discovery/` in full -
old entries included, `Touches` as well as folder names, since that call was
filed under bookings and the question was about payments - and cites the entry
instead of re-deriving it. Asking is still bounded by the stamp; reading never
was, and this is the failure that costs the most while looking like ordinary
diligence the whole time it is happening.

## The rules (all shown above)

1. **Home**: `docs/discovery/<topic>/` - per topic, not per spec; linked to
   specs by reference in both directions, never by name.
2. **Provenance first, and typed**: entries are `YYYY-MM-DD-source.md`, opening
   with the header table from `_entry-template.md` - `Kind` (closed vocabulary),
   `Date`, `Present`, `Purpose`, `Touches`, `Raw`, `Outcome` - then the essence,
   then `## Explained here` where the value was an explanation. Transcripts stay
   out of the repo (ADR-049).
3. **Never normative**: spec and records always win; a difference is not a
   conflict. Consciously rejected inputs become records (rejected
   alternatives), documented once.
4. **The stamp closes the re-ask loop - and bounds asking only** (ADR-049):
   `Last reconciled:` in the dossier README; agents *ask* only about newer
   entries, and *read* the whole dossier whenever they are researching or
   explaining rather than questioning. An entry below the stamp is settled, not
   irrelevant. Entry lifecycle:
   `new -> folded-into-spec | superseded-by-record | open`. **Whichever skill folds
   the material in is the one that moves the stamp** - `spec-specify` when a spec is
   minted, `spec-clarify` when a clarify round answers from the dossier, and
   `spec-update` on the change path (`discovery-digest` -> `spec-impact` ->
   `spec-update`), which is where an already-shipped capability's material lands.
   A stamp only the mint step ever moved would say `never` for every capability that
   was specced once and changed afterwards, and re-raise everything under it forever.
5. **Draft the spec early**: status `in-refinement` (the draft state) with
   typed markers - CLARIFICATION / DECISION / INPUT / ASSET, each with an
   owner. The clarify gate blocks the whole family; zero open markers earns
   `ready-to-develop`.
6. **Curator vs consumer**: `discovery-digest` maintains the dossier and
   flags contradictions - including a contradiction *inside* one source, which is
   usually why the handover arrived; the `spec-*` skills read it at
   specify/clarify/plan/update time and mark what they consume. Neither does the
   other's job.
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
