# ADR-036: A retired spec is frozen against extension, not against correction

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-06 |
| **Author** | bodurkalukasz |

## Context

A capability is retired by a decision record: the spec file stays as the record of what was
built and why, `Status` flips to `retired`, and the capability-map entry stays even though its
globs now match nothing (the shipped `capability-spec.template.md` says all three). Nothing
said what happens when a **later, unrelated** change makes a sentence in that retired spec
false - a shared enum renamed, a table dropped, a rule the retired capability's Data contracts
still describe.

Three shipped rules met that case, and each pointed a different way (case `DEC-10`, first
recorded 2026-08-04):

1. `spec-update` step 1: if an affected spec has `Status: retired`, **stop before editing
   it**.
2. `spec-reconcile` step 5: cross-spec contradictions are a finding and must be **resolved**
   in this change or filed - rule 8, no silent drift.
3. `spec-impact` step 1 checks `retired` on the **primary** capability only, so a retired
   spec reached as a ripple target is never flagged as retired at all.

So the loop could not detect the case (3), the skill that resolves contradictions was told to
resolve it (2), and the skill that edits specs was told not to touch it (1). The honest reading
of the three together is that a retired spec whose content is now false has no legal path, and
R4 - documents are living, the current version is the truth - was being broken by whichever
rule the agent happened to follow.

The underlying confusion is what `retired` freezes. It was written to stop a retired capability
being quietly extended back into life. It was read as freezing the file's text, which is a
different and much stronger claim - and one no rule in `SPEC.md` makes.

## Options considered

- **Freeze the file: the false sentence stays, the contradiction is recorded elsewhere** (a
  backlog row, or a note in the spec that changed). Rejected: it leaves a document whose text
  is wrong standing as the repo's current truth, which R4 forbids in the plainest terms. A
  retired spec exists so a reader can learn what was built; one where an unknown subset of the
  sentences is false teaches them not to trust any of it.
- **Reopen the capability: a falsified retired spec is re-specced.** Rejected: retirement is a
  recorded decision (R5), and undoing it by side effect - because an enum was renamed
  elsewhere - is exactly how a retired capability comes back without anyone deciding it should.
  Reopening stays a decision, with a record.
- **Delete the stale section.** Rejected: the contract section is most of what makes the
  retired spec worth keeping, and deleting it makes the file *less* true than a corrected one
  while looking tidier. It also destroys the evidence a future reader needs to understand a
  migration that is still visible in the data.
- **Frozen against extension, open to correction.** Chosen, below.

## Decision

**`retired` freezes behaviour, not truth.**

A retired spec **MUST NOT** gain, extend or re-scope behaviour. That is what `spec-update`'s
stop rule protects, and it stands unchanged: a new need in a retired area is a new capability,
specced fresh, never a reopening of this file.

A retired spec **MUST** be corrected when a later change makes one of its statements false, in
the same pull request as the change that falsified it - the same coupling R11 already requires
between a capability's code and its spec. The correction is bounded to making the sentence true
**as history**: state what the retired capability did, name the change that superseded it, and
stop. It never describes behaviour the retired capability should now have, and `Status` stays
`retired`.

If the correction cannot be written without deciding something - which of two readings was
right, whether the old behaviour should be restored - it is not a correction. Stop and write
the record first (R5).

The three skills now say one thing:

- `spec-impact` checks `Status` on **every** capability it reaches, primary and ripple, and
  reports a retired ripple target as a correction target rather than passing over it.
- `spec-update` keeps the stop rule for extension and names the correction path for the
  falsified-statement case, so "stop" is no longer the only instruction available.
- `spec-reconcile`'s cross-spec step resolves a contradiction involving a retired spec in one
  direction only: the live spec wins, and the retired one is corrected to say what it did.

## Consequences

- The case has one answer instead of three, and it is the answer R4 already implied.
- A retired spec stays trustworthy sentence by sentence, which is the only thing that makes
  keeping the file worth its place in the tree.
- **Cost accepted:** a change now has a slightly wider blast radius - retired specs are in
  scope for the ripple search where they used to be skipped. That is real work on changes that
  touch shared contracts, and it is the work that was previously being skipped silently.
- **Cost accepted:** "correction" and "extension" are separated by judgment, not by a
  mechanical test. A determined author can call an extension a correction. The bound above -
  history only, no new behaviour, status unchanged - is what a reviewer holds them to.

## Confirmation

Review, and the three skills' own text: they now name the same path, so an agent reading any
one of them reaches the same place, which is the failure this record exists to fix.

There is deliberately **no guard**. No check can tell a correction from an extension by reading
a diff - one that tried would gate on diff size or section, and both are trivially satisfied by
splitting the change. Saying "review only" out loud is more honest than a guard that
would report green on the case it was written for.

## What this rules out

A retired spec being treated as immutable text, and a retired capability being extended under
the name of a correction. Both were available before this record; neither is now.

## How we would know we were wrong

If corrections to retired specs start carrying new `MUST`s - the retired file growing rather
than being pinned to history - the split named here is not holding and the freeze needs teeth
a reviewer does not have to supply.

## Related

- R4 (documents are living, the current version is the truth), R5 (a contestable choice is a
  record), R11 (a capability's code and its spec move in one pull request).
- `standard/specs/capability-spec.template.md` - the retirement note the three rules hang off.
- `standard/.claude/skills/spec-impact`, `spec-update`, `spec-reconcile` - the three that
  disagreed.
