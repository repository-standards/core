---
name: discovery-digest
description: Ingest a meeting/mail/finding into the topic's discovery dossier - extract the essence with provenance, update the summary, flag contradictions, report spec-readiness (ADR-024)
---

The curator of `docs/discovery/` (ADR-024). This skill maintains dossiers; it
**never writes specs** - when a topic is ripe, it says so and hands off to
`/spec-specify`. The user's habit is one line: "had a meeting? drop the
extract" - everything else is this procedure.

## User Input

```text
$ARGUMENTS
```

The input is raw material (pasted notes, a transcript, a mail, a finding) plus
enough context to name the topic. If the topic is ambiguous - the material
could belong to more than one existing dossier - ask the user which; never
guess between dossiers.

## Procedure

1. **Resolve the dossier.** Slugify the topic (`booking-changes`, not a spec
   or ticket name - a dossier is per discovery topic, ADR-024). If
   `docs/discovery/<topic>/` does not exist, create it with a `README.md`
   holding: a one-paragraph summary, `Last reconciled: never`, an empty
   entries list, and an empty `## Contradictions to resolve` section.

2. **Write the entry - essence, not transcript.** Create
   `docs/discovery/<topic>/YYYY-MM-DD-<source>.md` (source names where it came
   from: `kickoff-meeting`, `mail-from-<who>`, `support-ticket-123`). Content:
   - a provenance line: date, source, participants/author, and a link to the
     raw material (recording, thread, mail) - the raw itself stays OUT of the
     repo (volume, noise, personal data);
   - the essence as attributable points: *who* said *what mattered* -
     decisions argued (and whether they were settled), constraints stated,
     numbers given, promises made. Keep the "it was said at THAT meeting"
     value; drop the small talk.

3. **Update the dossier README.**
   - Refresh the summary if the material moved the topic.
   - Add the entry to the entries list with state `new`.
   - **Diff against every earlier entry**: where the new material contradicts
     an earlier entry or an assumption ("kickoff assumes same-day refunds;
     this mail says T+3"), add a row under `## Contradictions to resolve`
     naming both sources. Do not resolve it yourself - contradictions are for
     the humans in the next round (or a clarify question when the spec drafts).
   - Never touch the `Last reconciled:` stamp - only the `spec-*` skills move
     it, when they fold the dossier into a spec.

4. **Route what is already ripe.** If the material contains a *settled*
   decision (a fork was taken, on the record), offer to draft the ADR/BDR now -
   consent-gated, the user says yes or no. If it contains a clear work item,
   offer the backlog. Everything else stays in the dossier as material.

5. **Report readiness.** End with a one-paragraph status: how many entries are
   `new`/`open` vs consumed, the open contradictions, and a verdict - "ripe
   for `/spec-specify`" (core questions answerable, actors and boundaries
   visible) or "still discovering" (name what is still missing). If a spec
   already exists for this topic, say instead: "spec exists - route this
   through `/spec-clarify` / `/spec-impact`" and name the entries newer than
   the stamp.

## Hard rules

- A dossier is **never normative**: if material differs from an existing spec
  or accepted record, note it as history or a contradiction row - never as
  "the spec is wrong", and never edit a spec or record from this skill.
- One dossier per topic; entries are append-only (fix a typo, yes; rewrite
  history, no). The dossier README is the only file this skill rewrites.
- Personal data discipline: the extract carries roles and first names at most;
  full transcripts, recordings and attachments stay in their tools, linked.

## Done When

- [ ] The entry file exists, provenance-stamped, essence-only, raw linked
- [ ] The dossier README lists it (`new`), summary current, contradictions diffed
- [ ] Ripe decisions/work items offered onward (consent-gated), not silently taken
- [ ] Readiness verdict reported ("ripe for spec-specify" / "still discovering" / "route via clarify")
