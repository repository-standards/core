# ADR-051: Closing a backlog row is a relocation, not a deletion

| | |
| --- | --- |
| **Status** | Accepted (2026-08-13) |
| **Date** | 2026-08-13 |
| **Author** | Łukasz Bodurka |
| **Decided by** | Łukasz Bodurka |
| **Tags** | methodology, backlog, verification |

## Context

The standard tells an adopter when a backlog row may close and never tells them where the
closed row goes. Both halves are in the same shipped file, one page apart, and they read as
one answer:

- [`standard/docs/backlog.md`](../../standard/docs/backlog.md), in the "What feeds this
  backlog" section: "A finished item leaves the backlog only when its **definition of done**
  is met". That answers *when a row may close*.
- The same file, in the "Format" section, as an aside inside the sentence that declares the
  status vocabulary: "(drop `done` rows on release, or let the Backlog.md tool archive
  them)". That is the only place the standard answers *where a closed row goes*.

The second half has no rule number, no guard, no named destination, and two options of which
one is not ours.

**The tool it names is a third party's, and nothing here has ever run it.**
[`ATTRIBUTIONS.md`](../../ATTRIBUTIONS.md) records
[Backlog.md](https://github.com/MrLesk/Backlog.md) accurately and modestly: "not taken from,
but deliberately stayed compatible with". That is the whole relationship. No file in this
repository installs it, wraps it, requires it or tests against it; `standard.manifest.json`
has no entry for it; no check in `checks.yml` invokes it; and nothing here has ever verified
that it can read a one-table backlog, let alone archive rows out of one. So an adopter who
picks the second of the two licensed options is following a pointer this project cannot
support. The first option - delete - is the one they can actually follow, which makes the
sentence a deletion rule wearing an archival rule's clothes.

**The parenthesis is already load-bearing on tooling.** When `sprint-guard` was built, a
lingering `done` row in the pool was considered as a third violation and deliberately left
unchecked, recorded at the time in
[`docs/validation/ai-prompting/runs/2026-08-06-q-track.json`](../validation/ai-prompting/runs/2026-08-06-q-track.json):
the shipped page "licenses it in the same sentence that declares the vocabulary", and a guard
failing every such row "would make that licence impossible to follow". An aside written as a
convenience has already cost this project one guard.

**The dashboard's own default measures what the file really contains.** In
`standard/scripts/generate-dashboard/src/page.js` the backlog view opens with
`state = { q: '', type: null, hideDone: true }`, and the "show finished" chip starts
unpressed. A view that hides part of its input by default is a statement about the input: the
file is expected to be full of rows nobody wants to read.

**Deletion is what this repository actually did, and it is visible in the tree right now.**
The 1.1.0 release cut (`8d3fa71`) removed seventeen closed rows from
[`backlog.md`](../../backlog.md) in one commit. Two epics survive it as a heading, a paragraph
of prose, a table header and no rows at all - "Gate health - the guards stay honest" and "The
wizard co-authors, it does not hand out templates". Neither says where its work went. Some of
the deleted content did survive, by an author's diligence rather than by any rule: GUARD-3's
two measured drifts - `llms.txt` claiming twenty rules while `SPEC.md` had 21, `AGENTS.md`
claiming 11 lifecycle skills against a tree holding 12 - live on in the header comment of
`standard/scripts/facts-check.mjs` and in `standard/docs/conventions.md`. Nothing made that
happen and nothing would have noticed if it had not.

**The workaround costs more than the rule saves.** A row that can only be closed by being
deleted does not get closed. This repository's own pool carries the proof: `FIELD-1` and
`EXHIBIT-1` hold paragraphs of finished, measured, dated work under status `todo` and
`doing`, because the finished part is the part worth keeping and closing the row would throw
it away. The list stops meaning what it says, which is the exact failure the shipped page
warns about one section earlier: "a row that lingers after its definition of done is met
teaches everyone the list is stale".

**The downstream case that decides this.** [`mybrand`](https://github.com/bodurkalukasz/mybrand)
is an adopter running the shipped format. Its `backlog.md` is 314 lines and 12 of its 17
near-term rows are closed, none archived. What those closed rows hold exists nowhere else in
that repository:

- `INV-3` - a live check of grant state on the production database, not a reading of the
  schema file. The `public` schema lockdown is genuinely applied; the `storage` schema block
  is written, runs without error, and is a **silent no-op**, because the role the connection
  string uses does not own `storage.*`. Alongside it, a security control that runs clean and
  protects nothing: the exposure is currently unreachable only because PostgREST is answering
  `PGRST002` on every table - an accident that stops being a mitigation the moment it
  recovers, recorded as an accident rather than mistaken for a control.
- `STORAGE-2` - a design killed by a probe rather than by an opinion: Supabase image
  transforms answered `403 FeatureNotEnabled`, and the quality parameter on the plain object
  URL was **silently ignored**, which is the failure mode that would have looked like it
  worked.
- `STORAGE-4` - a bug found on the way to something else: a missing `apikey` header meant
  every upload and delete had been failing silently.
- `INV-2` - a row whose own premise turned out to be half wrong, which is worth more than a
  row that was right.
- `INV-1` is the sharpest case of all. Its outcome was "working as designed, no change
  needed". It produced no commit, so it produced no CHANGELOG entry, so **the CHANGELOG
  cannot be where it goes.** Delete the row and the answer is gone; the next person asks the
  same question and pays for it again.

That is why "just delete `done` rows on release" is the wrong answer rather than a blunt one.
Following it feels like throwing away the only record of the work, because on these rows it
is. That is very likely why nobody follows it.

## Options considered

- **A. Say the existing rule more firmly.** Keep deletion, drop the tool, name the moment.
  Rejected: this is the current state with better grammar. Deletion is precisely what makes
  people not close rows, and the workaround is already measurable in this repo's own pool.
- **B. Archive by tool.** Adopt Backlog.md properly - require it, wrap it, gate on it.
  Rejected on two counts. It puts a third-party CLI between an adopter and their own markdown,
  against R15's whole posture; and it answers where the *row* goes while saying nothing about
  where its *content* goes, which is the half that matters.
- **C. Leave closed rows in place forever and let `hideDone` handle it.** Tempting, because
  the dashboard already does it. Rejected: the dashboard is a projection for people who never
  open the repository, and the file is what everyone else reads - the agent working in the
  code reads `backlog.md`, not the view. mybrand's 314 lines is what this option costs after
  a few months, and the cost compounds.
- **D. Closing a row is a relocation.** Chosen.

## Decision

**A row does not close until its content has somewhere else to be. Then the row moves, it
does not vanish.**

1. **The finding goes where findings live.** A decision goes to a decision record, behaviour
   goes to the capability spec, raw material and provenance go to a discovery dossier. This
   invents no destination - `docs/method/taxonomy.md` already says which is which.
2. **The shipped change goes to the CHANGELOG**, under `## Unreleased`. R18 already requires
   this, so for rows that shipped code this clause costs nothing.
3. **The row moves to the archive**, carrying its columns as written plus one `where` cell
   naming what its content became.
4. **A row whose content cannot be relocated was not done.** This is the point of the rule
   rather than a side effect of it. When nothing will take the content there are exactly three
   honest readings, and each has an action: the work is not finished (the row stays open), the
   finding needs a record nobody has written (write it - that is a row of its own), or the row
   is being abandoned rather than completed (then its status is not `done`).

### Which vocabularies close

`task` and `bug` close on `done`. Ideas close on `graduated` and `dropped`, under the same
rule and almost for free: R14 already makes a graduating idea point at what it became, so the
`where` cell is written before the archive asks for it, and a `dropped` idea's file has to say
why.

`split:<id>` does **not** archive: the split pair is how `sprint-guard` reads a partially
finished intent, and the remainder row is live work.

`decided` on an `open-question` does **not** archive, and this is a deliberate exclusion
rather than an oversight. The dashboard's own `CLOSED` set already leaves it out with the
reason stated in the source: "a standing decision open to challenge is the point of the type,
not a completed state to hide (ADR-046)". Archiving a standing doubt would take it out of the
one place people are supposed to argue with it.

### Where the archive lives

**One file: `docs/backlog-archive.md`, with `backlog-archive.md` at the root as its alternate
path** - the same pair `backlog.md` already declares, so the archive sits beside the pool
wherever the pool sits.

One file rather than one per period. Period structure lives *inside* it as release headings
(`## 1.1.0 - 2026-08-10`), which gives the grouping without multiplying files, keeps one
search target, and leaves the split available later: if it outgrows one file, the headings are
where it cuts, and that is a `git mv` of trailing sections rather than a change of format.

The file does not exist until the first row is archived. An empty archive is the "another file
to keep true" cost with none of the benefit - so its `standard.manifest.json` entry is
`required: false` at the core profile, and a repo that has never closed a row is not short of
anything. This is the same shape `scripts/sprint-guard.mjs` already has: shipped, declared,
and not owed by a repo that does not need it yet.

### When rows move, and who moves them

**At the release cut, by whoever cuts the release.** The existing guidance already says "on
release" and that part of it was right: the release is a moment that already exists, already
belongs to one person, and already involves reading the changelog. No new cadence, no clock
for a guard to read.

*(scale)* **`/sprint-close` archives the rows its sprint finished**, because that command is
already writing the sprint's outcome and already holds the one-place invariant.

**Never automatically.** Choosing the destination is a judgment, and a tool that guesses it
produces exactly the pointer nobody trusts. A command may prepare the move and refuse a row
with no destination; it may not decide the destination.

### What the dashboard does with it

Closed rows stay **reachable in the view**: the archive becomes a second input to the Backlog
tab, behind the "show finished" chip that already exists, rather than a tab of its own. Work
that has been relocated has not been hidden.

`hideDone` does **not** become dead weight, and the reason is worth stating because the
opposite is the intuitive guess. Archiving happens at the release cut, so between two releases
the pool still accumulates closed rows and the toggle still has something to toggle. What
changes is its meaning: it stops being a permanent mask over a file that only grows, and
becomes a filter over the current release's finished work.

**This record does not touch the generator.** Two changes are in flight in
`standard/scripts/generate-dashboard/` and this is not a third. The dashboard change is a
follow-up, stated here so that accepting the rule is not read as accepting a silent
generator edit.

### The guard, and exactly what it fails on

`scripts/backlog-archive-check.mjs`, core profile, blocking. Unenforced guidance is the defect
this record exists to fix, so the enforcement is specified rather than promised:

- **`kind: diff`, and this is the one that matters.** A pull request that removes a row from
  `backlog.md` without that id appearing in the archive fails. This is the check that would
  have fired on `8d3fa71`, seventeen times. Exempted, because each is a legitimate move that
  is not a deletion: an id that appears in a sprint file (it left the pool, it did not close),
  and a `split:<id>` pair whose remainder row is live.
- An archive row with an empty `where` cell fails. This is clause 4 made mechanical - it is
  the only way "a row that cannot be relocated was not done" becomes a diagnostic instead of
  an aspiration.
- A `where` that names a path in the repository which does not exist fails - the same class of
  failure `decision-records-check` already reports for an index row citing a missing file.
- An id present in both `backlog.md` and the archive fails: the one-place invariant
  `sprint-guard` already asserts between the pool and a sprint, extended to the pool and the
  archive.
- **The skip applies to the archive's own checks, never to the removal check.** The three
  checks above read the archive, so with no archive there is nothing to read and they skip,
  exactly as `sprint-guard`, `schema-pair` and `adoption-gates` skip themselves. The removal
  check is the opposite case: an adopter who has archived nothing is precisely the adopter
  about to delete their first closed row, and a guard that stood down there would be unenforced
  for every repository it is written for. So it fires whenever a base ref and a pool exist, and
  says to create the archive.

What it deliberately does **not** check: whether the destination's content actually captures
the finding. That is substance, and ADR-038 already settled that this project measures
structure and leaves substance to the judgment tier rather than converting it into ceremony.

## Consequences

- **Positive:** closing a row stops being a choice between destroying knowledge and letting
  the live list rot, which is the choice that currently makes adopters do neither.
- **Positive:** the diagnostic in clause 4 comes free with the mechanism, and it catches the
  most expensive kind of wrong row - the one everybody believes is finished.
- **Positive:** the `INV-1` class of outcome - verified, correct as built, nothing shipped -
  gets a home for the first time. The CHANGELOG cannot hold it, because nothing shipped.
- **Negative:** another file to keep true. A `where` pointer whose target is later rewritten
  still resolves; the guard proves the file exists, never that the finding is still in it. An
  archive can rot quietly, and a quietly rotten archive is worse than none, because it looks
  like a record.
- **Negative:** a row split across two files can rot in two places. The mitigation is that the
  archive holds no prose of its own - the row as written, plus a pointer - so there is one copy
  of the finding and the archive is an index of relocations rather than a second account of
  them. That mitigation is a discipline. The guard cannot enforce it.
- **Negative, and the strongest case against this record:** it sits uncomfortably against
  ADR-018, which decided that history has exactly one home and that living documents carry no
  change-log sections of their own. An archive is close enough to a change-log section for the
  backlog that the objection is real rather than pedantic. What is claimed here is a
  narrowing, not an exception: the CHANGELOG answers "what shipped, in which release" and is
  ordered by release, so it cannot answer "what happened to `INV-3`" - and a closed row that
  shipped nothing never enters it at all. If the maintainer reads the archive as a second
  history rather than as an index into the first, this record should be rejected outright
  rather than trimmed into something smaller.
- **Negative:** the release cut gains a step, and it is a step that needs judgment rather than
  a command.
- **Negative:** the diagnostic is gameable. A `where` cell can point at any file that exists.
  The guard catches the empty answer and the broken one, never the lazy one.
- **Follow-ups:** the dashboard change; a command that prepares the move and refuses a row
  with no destination; and, if the maintainer wants the archive to start with real content
  rather than empty, the seventeen rows removed at `8d3fa71` are recoverable from that commit.

## Confirmation

**The rule and its guard landed in one change**, because an accepted rule with no guard is the
exact defect this record is about: `scripts/backlog-archive-check.mjs` with its
`standard.manifest.json` path entry, hash and `checks` entry; the optional `backlog-archive.md`
path entry beside `backlog.md`; `tools/backlog-archive-check-test.mjs` covering the four
refusals and, deliberately, each exemption too - a guard nobody can close a row past is as
broken as one that never fires; and the line in `checks.yml`.

Two things came out of building it that the first draft of the specification above got wrong,
and the specification was corrected rather than the discrepancy quietly absorbed:

- **The draft said the guard "skips itself where no archive file exists", full stop.** Taken
  literally that exempts every repository that has never archived anything - which is every
  repository this rule is written for, including the commit that motivated the record. Only
  the checks that read the archive can skip; the removal check cannot.
- **The tree ships `docs/backlog-archive.md` as a template**, which the draft did not call
  for, because `tree-check` requires every declared manifest entry to exist in the shipped
  tree. The template carries the header, the `where` column and the instruction to delete the
  file until the first row moves - so "the archive does not exist until it holds something"
  stays true of an adopter's repository, which is what the claim was always about.

What is still unconfirmed is the part no guard reaches: whether a `where` pointer keeps
pointing at a file that still discusses the finding. That is the trade this record makes
knowingly, and "Revisit when" below is how it gets measured rather than argued.

## Revisit when

- A sample of `where` pointers in a real adopter's archive shows more than a small share
  resolving to files that no longer discuss the row's finding. That is the failure this record
  trades for, it is the one the "case against" names, and it is observable rather than
  arguable.
- Or the archive itself grows past the size that made the pool unreadable in the first place,
  at which point the per-period split this design leaves available stops being optional.

## Related

- [ADR-018](ADR-018-history-lives-in-the-changelog.md) - one home for history. The record this
  narrows, and the one a reviewer should weigh this against first.
- [ADR-046](ADR-046-backlog-is-the-one-index-open-questions-and-ideas-get-a-type.md) - the
  typed rows, and the reasoning the `decided` exclusion follows.
- [ADR-010](ADR-010-artifact-lifecycle-and-tracker.md) - the repo holds intents, the tracker
  holds execution history. An archive of closed intents is neither, and this record says so
  rather than leaving it to be argued.
- [ADR-028](ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md) and
  [ADR-041](ADR-041-the-bounded-period-of-work-is-called-a-sprint.md) - sprints, and
  `/sprint-close` as the scale trigger.
- [ADR-038](ADR-038-adopted-percentage-is-structural-substance-is-judgment.md) - why the guard
  stops at structure.
- R15 in [`standard/SPEC.md`](../../standard/SPEC.md) - the rule this gives a second half to.
