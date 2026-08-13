# ADR-049: A discovery entry is typed, and the stamp bounds asking rather than reading

| | |
| --- | --- |
| **Status** | Accepted (2026-08-13) |
| **Date** | 2026-08-13 |
| **Author** | Łukasz Bodurka |
| **Tags** | method, discovery, provenance, retrieval |

## Context

ADR-024 gave raw discovery a home and closed the re-ask loop: a dossier per
topic, entries stamped with date and source, a `Last reconciled:` line, and the
rule that a dossier is never normative. That much holds and is not reopened
here.

A design review on 2026-08-13, prompted by the repo owner asking what a reader
can actually get back out of a dossier, found three things the shape does not
carry. The motivating case is not hypothetical in kind, only in this repo: a
subject gets researched from scratch, and partway through somebody remembers
that it was explained at length on a call months earlier. The whole point of
writing extracts down is that this cannot happen.

**An entry has no type and no purpose.** Whether the material was a meeting or
a mail survives only as a slug inside the filename (`kickoff-meeting`,
`mail-from-provider`) - free text, so it cannot be filtered or counted. Worse,
*why* the session happened - the question it was called to answer - is asked
for nowhere at all, by the template or the skill. It is the field that cannot
be reconstructed later from notes of what was said, because notes record
answers and not the question.

**An entry does not say what came of it.** The state column moves
`new -> folded-into-spec | superseded-by: <record> | open`, which says an entry
was consumed but never by what. `folded-into-spec` names no spec. The dossier
README's summary carries "what came out of this topic" for the topic as a
whole, so the trail from one meeting to one decision exists only in whoever
remembers it - which is the condition this folder was built to end.

**Nothing bears the subjects a session touched.** A dossier is one topic by
construction (ADR-024 rejected filing by capability precisely because one topic
feeds many specs). But one *session* is rarely one topic: a call about
invoicing bears on pricing, tax and refunds. With the topic slug as the only
axis, material is findable only by whoever knows what it was filed under.

**And the stamp does two jobs, one of which nobody chose.** ADR-024's rule 4
says agents ask only about entries newer than `Last reconciled:`. Every
consumer implements it that way and stops there: `spec-clarify`, `spec-impact`
and `spec-plan` each read *only above the stamp*, and nothing anywhere
instructs any agent to read below it. So the stamp, whose job is to stop the
same question being asked twice, also silently marks everything under it as
not worth opening.

That is precisely where the durable material sits, and the taxonomy guarantees
it. A decision leaves for an ADR or BDR; behaviour leaves for a spec; work
leaves for the backlog. What has no other home is **understanding** - how
something works, why a constraint exists, the two hours somebody spent
explaining a domain. It stays in the dossier by design, in the layer the stamp
makes invisible by default. The mechanism that prevents explaining something
twice is the same mechanism that hides the explanation.

## Options considered

- **A - a generated index file** (`docs/discovery/README.md`, written by a new
  client-side script with a `--check` in CI, listing every topic with its tags
  and what it fed). Rejected: a second description of what the entries already
  say. It needs a shipped script, a manifest entry, a test and a workflow step
  to reproduce what one typed field answers with `grep`. A hand-maintained
  index is worse still and already argued against in
  [`docs/tree/docs-discovery.md`](../tree/docs-discovery.md), which rejected
  hand-marked entry state for exactly this reason. Revisit if a real dossier
  count makes searching insufficient.
- **B - YAML front-matter on entries.** Rejected on consistency: artifact
  metadata in this standard is a two-column table at the top (every ADR and BDR
  carries one), and front-matter is the skills' shape. Two notations for one
  job.
- **C - a new home for explanations** (`docs/explainers/`). Rejected: material
  whose provenance matters is a discovery entry - that is ADR-024's own
  definition, and a new folder would re-argue it. The explanation was never in
  the wrong place; it was in a place nobody was told to read.
- **D - type the entry header and split the stamp's two jobs** - chosen.

## Decision

1. **An entry carries a typed header table**, shipped as
   `standard/docs/discovery/_entry-template.md` and filled by
   `discovery-digest`: **Kind**, **Date**, **Present**, **Purpose**,
   **Touches**, **Raw**, **Outcome**. It is a table, not front-matter (option
   B), and the field names are fixed because they are read by `grep`.
2. **Kind is a closed vocabulary**: `meeting`, `call`, `mail`, `thread`,
   `ticket`, `document`, `note`. Free text answers "was this a meeting or a
   mail" one entry at a time; a vocabulary answers it across a dossier.
3. **Purpose is required** - one line on why the session happened. The skill
   asks when the handover does not say.
4. **Touches is the cross-cutting axis**: the subjects the material bears on
   beyond the dossier it is filed in. It does not change where anything is
   stored - ADR-024's per-topic filing stands - it makes what one session
   spanned searchable without a second filing system.
5. **Outcome is per entry**, not only per dossier: the record, spec or backlog
   row that came out of it, or `none yet`. The state column says an entry was
   consumed; the outcome says by what.
6. **`## Explained here` is a named section** in the entry template for the
   understanding a session produced. Naming it is the whole intervention: an
   optional section with a name gets filled, and this is the content no record
   or spec will ever hold.
7. **The stamp bounds asking, not reading** - this narrows ADR-024's rule 4.
   `Last reconciled:` continues to govern what may be raised with a human, so
   nobody is questioned twice about a settled call. It carries no authority
   over what may be *read*: an agent researching a subject or explaining how
   something works searches `docs/discovery/` in full, including entries older
   than the stamp, and cites what it finds instead of re-deriving it. The rule
   ships in `standard/AGENTS.md` as its own trigger, beside the one that files
   material.
8. **The dossier README's entry table mirrors the header** (`Date | Kind |
   Source | Touches | State | Outcome`) so a dossier is scannable without
   opening every file in it.
9. **No new SPEC rule and no new artifact.** R5 already names the home; this
   changes the shape of what goes in it.

## Consequences

- The five questions a reader actually arrives with - was this a meeting or a
  mail, when, why did it happen, what came of it, what else does it bear on -
  are answered by the header rather than by whoever was in the room.
- Retrieval stops depending on knowing the filing. `Touches` plus full-text
  search over an unbounded dossier is what makes the motivating case fail
  safely, and neither works while the stamp reads as "do not open".
- `discovery-digest` asks for one more thing on intake (`Purpose`) and fills
  `Outcome` on any later pass that produces something. That is a real cost paid
  every time material lands, for a benefit collected only sometimes - which is
  the trade the whole folder already makes.
- Existing dossiers do not become invalid. The added fields are absent, not
  wrong; entries are append-only (ADR-024), so a dossier gains the header shape
  as new material arrives rather than through a rewrite.

## Confirmation

Partly mechanical, and the rest is honestly in the judgment tier - stated
plainly here because ADR-048 has just finished arguing that an artifact nobody
reads is not a gate.

- Mechanical: the entry template and the amended dossier template ship in the
  tree, so `tree-check` holds them and the manifest's `sha256` for
  `discovery-digest/SKILL.md` covers the procedure that fills them.
- Not mechanical: nothing verifies that a written entry has a real `Purpose` or
  honest `Touches`, and nothing can force an agent to search before it
  researches. `docs/discovery` is an optional, `fill-from-repo` entry, so a
  client-side gate would have to fire on a folder most repos do not carry, and
  the field it would check is prose. The check is `discovery-digest`'s own
  `Done When` list and review.

## Revisit when

- A repo carries enough dossiers that searching `Touches` stops being enough to
  find material - that is when option A's generated index earns its cost.
- An entry reaches review with `Purpose` empty or restating the title, which
  would mean the skill is not really asking for it.
- Agents are observed re-researching something a dossier already explains after
  this rule ships, which would mean the trigger in `AGENTS.md` is not firing and
  the fix is the trigger's wording, not more prose.

## Related

- [ADR-024](ADR-024-discovery-dossiers-beside-the-specs.md) - the dossier and
  the stamp. Rule 4 is narrowed by point 7 above; everything else stands.
- [ADR-010](ADR-010-artifact-lifecycle-and-tracker.md) - the artifact lifecycle
  this stage feeds.
- [ADR-048](ADR-048-gate-artifacts-are-read-for-shape-not-presence.md) - why
  the Confirmation section above says what is not checked.
