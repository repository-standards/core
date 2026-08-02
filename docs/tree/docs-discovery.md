The inbox of a topic. One folder per subject, holding provenance-stamped extracts of the
meetings, mails and findings that a spec will eventually be written from. It is the stage
between "somebody said something" and "the system does this".

It exists because that stage is where knowledge normally dies. A meeting produces
understanding that lives in four heads and one recording nobody rewatches, and three weeks
later the spec gets written from memory.

## What it is for

**So you explain it once.** Every entry is stamped with where it came from and when. The
dossier carries a `Last reconciled:` line naming the spec and commit that consumed it, and
the spec skills only ask about entries **newer** than that stamp. That is the whole trick:
being asked the same question twice is a mechanical failure, so it is prevented
mechanically rather than by everyone being careful.

## What goes in here

One folder per topic, with a dossier README on top and one file per source:

```
docs/discovery/date-changes/
  README.md                       <- summary, entry index, the stamp
  2026-07-30-kickoff-meeting.md   <- essence, plus a link to the raw source
  2026-08-01-mail-from-provider.md
```

The dossier README carries four things, in order: the **summary** of what this topic is and
what it eventually fed; the **`Last reconciled:`** stamp; the **entry index**, each with a
state; and any **contradictions** found between entries, each naming both sources.

An entry's state is what keeps the loop from re-litigating settled ground:

```
new  ->  folded-into-spec | superseded-by: <record> | open
```

## What does not go in here

**Raw transcripts and recordings.** They stay in the meeting tool or the drive; an entry
links them. A dossier holds the essence, not the tape.

**Decisions.** The moment something is decided it is an ADR or a BDR. A dossier that
records a decision creates a second, unversioned decision log.

**Behaviour.** That is the spec. A dossier feeds the spec; it never competes with it.

**Work items.** Those are backlog intents.

## A dossier is never normative

This is the rule that prevents the worst failure mode. Where a dossier and a spec disagree,
**the spec has already won**, and the difference is history rather than a conflict to
resolve. Without that rule, every old meeting note becomes a standing objection to the
current design, and nobody can tell settled from unsettled.

## How you actually use it

```
> notes from today's date-changes meeting: <paste>
```

The agent extracts the essence with provenance, flags anything that contradicts an earlier
entry, and says whether the topic is ripe for a spec.

Drafting the spec early is encouraged rather than discouraged. `/spec-specify` reads the
dossier and turns every remaining gap into a typed open marker with an owner: a question, a
missing decision, a missing input like a design, a missing asset like credentials. The spec
sits in its draft state until the clarify gate counts zero of them.

## Decisions behind it

- **[ADR-024](../decision-records/ADR-024-discovery-dossiers-beside-the-specs.md) - raw material
  gets a home in the repo.** The alternative was to keep it in the meeting tool and link
  from the spec. Rejected because the link rots and the tool is not versioned with the
  code, so the reasoning behind a spec becomes unreachable exactly when someone needs it.
- **The stamp, not a status field.** Marking entries "processed" by hand was the obvious
  design and it fails the same way every hand-maintained state does. A date plus a commit
  is checkable and cannot be half-updated.
- **Dossiers lose to specs, always.** Making them peers was considered and would mean every
  conflict needs adjudication. One of them has to be the truth, and it is the one the guards
  already check.
