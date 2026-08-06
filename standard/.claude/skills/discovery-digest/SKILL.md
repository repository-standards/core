---
name: discovery-digest
description: Use when someone hands over raw material rather than a request - meeting notes, a mail thread, a transcript, "here's what they said on the call", a half-decision nobody wrote down. Files it into the topic's dossier with its provenance, flags where it contradicts what is already recorded, and says whether the topic is ready to be specced. Never writes specs itself.
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

**If more than one source landed in the same handover** (a Slack thread and a mail
pasted together, "here's what Dana said and here's what Marcus said back") - each
source is still its own entry, written and filed one at a time, in the order given.
Diff the second against the dossier **and** against the first before it moves on to
the third: two sources from the same day that disagree with each other are exactly
the kind of contradiction step 3 exists to catch, and they only surface if each
entry is diffed against everything already filed, including entries this same
handover just added.

**One source can contradict itself, and that is the commonest shape of all** - a
single mail thread or meeting where two people say opposite things, which is usually
*why* somebody handed it over. It is one source, so it is one entry, and diffing that
entry against everything filed earlier finds nothing: on a new dossier there is
nothing earlier, and the disagreement is inside the entry rather than between
entries. So diff the entry's own attributed points **against each other** before
step 3 looks outward, and raise a contradiction row naming the two *people* as the
sources (`kickoff-meeting - Dana` vs `kickoff-meeting - Marcus`). Do not resolve it,
and do not pick the one who sounds more certain, even where one of them is plainly
wrong against a spec: whose version holds is the humans' call, and the row is what
puts it in front of them.

## Procedure

1. **Resolve the dossier.** Slugify the topic (`booking-changes`, not a spec
   or ticket name - a dossier is per discovery topic, ADR-024). If
   `docs/discovery/<topic>/` does not exist, create it by **copying the shipped
   `docs/discovery/_template.md` to `docs/discovery/<topic>/README.md`** and filling
   its title and summary - that template's own first line says to copy it, and it carries the
   exact shapes the rest of the loop reads back: the `Last reconciled:` stamp the
   spec skills compare entry dates against, the `| Date | Source | State |` entry
   table, and the `## Contradictions to resolve` table. A hand-built README with the
   same sections in a different shape looks right and reads wrong - the stamp line is
   the one every `spec-*` skill greps for. Set the stamp to `never` and leave both
   tables empty.

   Where the template is not in the repo (an older adoption), write those four things
   by hand in the template's shape - summary, `Last reconciled: never`, the entry
   table, the contradictions table - and say that the template is missing.

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

4. **Check it against every `Revisit when` (grep, not judgment).** Every ADR/BDR
   carries a `## Revisit when` field naming the concrete signal that should reopen
   it - nobody read it back before this step existed, so a decision could sit past
   its own trigger with only an agent's own unbroken context noticing (a fresh
   agent, or the same agent on a later date, would not). Pull each record's
   `Revisit when` line across `docs/decision-records/` (or wherever this repo's
   records live) and check the new entry's text against it - a textual match ("10k
   customers", "self-hosting", a named competitor) is a hit; this is a grep, not a
   semantic read of every record. On a hit, add a row under a `## Revisit signals
   hit` section (create it if this dossier has never needed one) naming the record
   and the matching text, and carry it into the readiness report below - resolving
   it (write the superseding record, or decide the signal does not really apply) is
   a human call, exactly like a contradiction. **What this catches:** a condition
   whose wording shows up in the new material. **What it cannot catch:** a signal
   that is true in the world but never gets written down here, or one worded so
   differently from the record that no grep finds it - a tripwire, not a monitor.

5. **Route what is already ripe.** If the material contains a *settled*
   decision (a fork was taken, on the record), offer to draft the ADR/BDR now -
   consent-gated, the user says yes or no. If it contains a clear work item,
   offer the backlog. Everything else stays in the dossier as material.

6. **Report readiness.** End with a one-paragraph status: how many entries are
   `new`/`open` vs consumed, the open contradictions, any `Revisit when` signal
   hit (step 4), and a verdict - "ripe
   for `/spec-specify`" (core questions answerable, actors and boundaries
   visible) or "still discovering" (name what is still missing). If a spec
   already exists for this topic, say instead: "spec exists - route this
   through `/spec-clarify` / `/spec-impact`" and name the entries newer than
   the stamp - **unless its `Status` is `retired`**, in which case say so and stop:
   new material about a retired capability is either about the vendor/replacement
   now doing the job (out of scope here) or a case for a genuinely new capability,
   not a reason to reopen this one.

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
- [ ] The new material was checked against every decision record's `Revisit when`; any hit is on the record and in the readiness report
- [ ] Ripe decisions/work items offered onward (consent-gated), not silently taken
- [ ] Readiness verdict reported ("ripe for spec-specify" / "still discovering" / "route via clarify")
