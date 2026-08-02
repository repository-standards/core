# Discovery dossiers - the inbox of a topic

**What lives here**: one folder per discovery topic
(`docs/discovery/<topic>/`) holding provenance-stamped extracts of meetings,
mails and findings - the raw-material stage between an idea and a spec. Had a
meeting? Drop the extract:

```
> /discovery-digest notes from today's <topic> meeting: <paste>
```

**What does NOT belong here**: raw transcripts and recordings (they stay in
the meeting tool or drive - entries link them); decisions (those are ADR/BDR);
behavior (that is the spec); work items (backlog). A dossier is **never
normative**: where it differs from a spec or record, the spec or record has
already won - the difference is history, not a conflict.

## The shape of a dossier

```
docs/discovery/<topic>/
  README.md                     <- summary on top, entry index, the stamp
  2026-07-30-kickoff-meeting.md <- one entry per source: essence + link to raw
  2026-08-01-mail-from-x.md
```

Each dossier README carries, in this order:

1. **Summary** - what this topic is and, once it matures, what came out of it
   (the specs and records it fed, linked).
2. **`Last reconciled:`** `<date> (specs/<capability> @ <commit>)` - the stamp
   the spec skills update when they fold the dossier into a spec. Agents ask
   only about entries newer than this stamp - that is what makes "explain it
   once" mechanical.
3. **Entries** - one line per entry with its state:
   `new` -> `folded-into-spec` | `superseded-by: <record>` | `open`.
4. **Contradictions to resolve** - flagged by `/discovery-digest` when a new
   entry disagrees with an earlier one; each row names both sources.

## How it flows onward

Drafting a spec early is encouraged - `/spec-specify` reads the dossier and
turns every remaining gap into a typed open marker (a question, a missing
ADR/BDR, a missing input like a UX design, a missing asset like credentials -
each with an owner). The spec stays `in-refinement` (the draft state) until
the clarify gate counts zero open markers. The full worked example, the entry
lifecycle and the precedence rules: the standard's
[discovery method doc](https://github.com/repository-standards/core/blob/main/docs/method/discovery.md)
(adopted by reference from the living standard - always latest); the decision behind this home
is its ADR-024.
