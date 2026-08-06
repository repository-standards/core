# ADR-033: The spec loop reads the decision log before it writes, and an Accepted record outranks the request

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-06 |
| **Author** | bodurkalukasz |
| **Tags** | method, specs, decisions, lifecycle |

## Context

Two `severe` validation findings, both still `fail` against the tree before this change.

`SPEC-18`: neither `/spec-specify` nor `/spec-clarify` reads `docs/decision-records/`.
Grepping both files for a decision-record path returns only the `PATCHED(...)` provenance
comments naming the ADRs that produced them. What both *are* told to read before asking the
user anything is `docs/discovery/` - and ADR-024 makes a dossier explicitly non-normative.
So the loop's entry point consulted, by documented procedure, the one source that binds
nothing, and never consulted the one that binds everything. A spec contradicting an Accepted
record is written, passes the clarify gate, passes every guard, and is found - if ever - by
a human reading the record out of band.

The only backstop was `AGENTS.md`'s red-flag list, which said "Contradicting an Accepted
ADR". Not BDR. The product-side stream is the one a feature request actually collides with.

`SPEC-17`: the loop has two entry points and retirement awareness reached only one of them.
`/spec-impact` checks the target spec's `Status` first and stops on `retired`, naming the
record; `/spec-update` refuses to edit a retired spec; `discovery-digest` refuses to route
new material into one. `/spec-specify` - the entry point the product sells to a PO, and the
one `AGENTS.md` names for new behaviour - contained the word `retired` zero times, while
instructing that an existing capability directory means "update the existing spec in place".
Reproduced against the fixture: `shift-notifications` is `Status: retired` per BDR-004, whose
own text says a future in-house reminder need is a new capability, specced fresh, not a
reopening. A PO asking for exactly that walks through `/spec-specify` into an edit of the
retired spec.

The two findings are one defect seen from two sides. Retirement is only the case where the
governing record happens to have left a flag on the spec file; the general case - a record
that governs the request and left no flag anywhere the loop looks - has no detection at all.

## Options considered

- **Leave it to review and the red-flag list.** Rejected. A red flag fires when an agent
  already noticed, which is the step that failed; and review happens after the spec is
  written, which is the expensive moment to discover the request was never viable.
- **A mechanical guard.** Rejected as the primary answer. Contradiction is semantic: a guard
  can check that a *cited* record's `Status` is still current (`/spec-reconcile` already does
  exactly that) but cannot see a spec that silently re-decides something it never cites. A
  guard that appears to cover this and does not is worse than none.
- **Read every record in full at the start of every run.** Rejected. The cost scales with the
  repo's record count and is mostly waste; an agent told to read sixty records reads sixty
  records badly. Bounded read instead: the index table, then in full only the rows whose
  subject overlaps the request. The index exists for this - the README's gist column is
  already written to be read instead of the records.
- **Put the check only in `/spec-impact`, and route everything through it.** Rejected: it
  makes the PO path depend on a developer-facing skill firing first, which is the routing
  assumption that already failed. Both entry points carry it.
- **Delegate to `specs/constitution.md`.** The constitution template already hard-stops on
  "the change contradicts an Accepted ADR", and `/spec-specify` already loads it. Rejected on
  two counts, both observed rather than argued: the template scopes its own check to
  `/spec-plan` and `/spec-update`, and specify loads it at step 4 - *after* step 2 has already
  decided which directory to write into, which is where the retirement check has to fire. In
  the pre-fix reproduction the constitution did contribute to a stop, but only because the
  agent went looking for the record on its own after reading it. (The template's hard stop
  said "ADR" while its own altitude list said "ADR / BDR"; that is corrected here too, same
  defect as the red-flag list.)

## Decision

**The decision log is read before the draft, at both entry points.** `/spec-specify` reads it
before drafting; `/spec-clarify` reads it before asking. The read is bounded by the index -
the README table, then in full only the records whose subject overlaps. **That bound rests on
`decision-records-check`**, which fails a record on disk that the index does not list; where
that guard is not running, the directory is listed too. The dry run proved this is not
theoretical: the agent grepped the fixture's CI, found the guard wired nowhere, listed the
directory - and BDR-004, the record that governed the whole request, is on disk and absent
from a BDR index that stops at 003.

**A capability is matched by subject, not by slug.** The short name specify generates is its
own, not the repo's: `shift-reminders` and `shift-notifications` are one capability under two
names. `ls specs/` and match on what the capability is about, because a near-miss slug is how
one capability acquires two rival specs - and, when the existing one is retired, how a
retirement is routed around without anyone deciding to.

**Precedence is stated, not left to judgement.** An **Accepted** record in scope outranks the
dossier, outranks the draft, and outranks whatever the user says in the moment. What a record
settles enters the spec as settled content citing it - never as a `[NEEDS DECISION]` marker
and never as a question. `Proposed` / `Rejected` / `Superseded` bind nothing; the supersession
link leads to the record that does.

**A contradiction stops the run.** There are exactly two legitimate routes - change the
request to fit, or supersede the record (`/adr-write`, `/bdr-write`). Writing the spec anyway
is not one of them, including when the user asks for it: an answer that collides with an
Accepted record is a supersession, not a clarification.

**Retirement is checked at every entry point, including the PO's.** `/spec-specify` reads the
matched spec's `Status` at the step that decides where to write, and `retired` stops it before
drafting - the same answer `/spec-impact` already gives, at the door the PO actually uses. The
stop is *surface and hand back*, not *refuse*: a genuinely new capability specced fresh is
often the right answer and the retiring record frequently says so, but that call belongs to
the user with the record in front of them. What the agent may not do is proceed alone, under
the old slug or a new one.

**R6 says the binding half out loud.** The validation suite cited R6 for "an accepted record
binds future work in its scope until superseded" while R6's text covered only how a record is
changed. The rule now carries both halves.

## Consequences

- The collision is found at the cheapest moment - before a spec exists - instead of by a
  human who happens to know the record.
- **Cost accepted:** every specify and clarify run pays an index read it did not pay before.
  A repo with no records pays nothing; a repo with many pays one table.
- **Cost accepted:** this is prose an agent can skip, not a guard, and placement is the whole
  mitigation. The consequential checks sit inside the step that already does the thing they
  qualify - the queue-building step in clarify, the directory-resolution branch in specify.
  The intake block itself is unavoidably a preamble, which the dry run flagged as the weak
  point ("a less careful agent skims the numbered Outline and treats everything above it as
  preamble"), so the Outline opens by saying the intakes are steps and can end the run before
  step 1. If real runs still skip it, the answer is a citation duty something can check, not
  more prose.
- **Cost accepted:** the retirement rule is now written at two entry points. Deliberate: it
  was written once, on the developer path, and that is precisely how `SPEC-17` happened.
- `/spec-clarify` can now end a session by refusing an answer. That is new, and it is the
  point: the alternative was recording the answer and letting the record rot.

## Confirmation

`SPEC-17` and `SPEC-18` are the cases; they are re-run against the tree and move from `fail`
when this lands. Mechanically checkable parts: `grep -c -i retired` over
`standard/.claude/skills/spec-specify/SKILL.md` is no longer 0, and both spec-specify and
spec-clarify name `docs/decision-records/`.

The semantic part - that an agent actually stops - is not greppable and was tested the only
way it can be: paired dry runs of one PO request against the `test-greenfield-core` fixture,
pre-fix and post-fix, each agent told to follow the repo's documented procedure literally and
to report honestly which of its reads the procedure instructed and which were its own
initiative. Pre-fix, the agent did stop, and said plainly that opening the governing record
was its own move because "spec-specify's text never mentions decision records at all".
Post-fix, reading the decision-record index was its first action and it cited the step that
told it to. Both of this decision's late additions - the guard-dependency of the index read,
and subject-over-slug matching - came from the post-fix run finding the fix's own holes, which
is the argument for running it rather than reasoning about it.

## What this rules out

A guard that claims to detect a spec contradicting a record it never cites. Semantic
contradiction is not greppable, and shipping something that looks like that check would buy
false confidence at the exact point this standard is selling trust.

## How we would know we were wrong

A spec lands contradicting an Accepted record with both skills' procedure followed - meaning
the bounded index read is too coarse to surface the overlapping record - or the stop fires so
often on records that did not really govern that authors learn to wave it through.

## Related

- [ADR-024](ADR-024-discovery-dossiers-beside-the-specs.md) - the dossier is never normative.
  This names what is.
- [ADR-032](ADR-032-re-entry-is-core-tracker-sync-is-an-extension.md) - the same shape: a
  documented loop assumption that nothing in the loop performed.
- R5 (decisions are recorded), R6 (an accepted record binds until superseded), R8 (behaviour
  is specified by capability).
