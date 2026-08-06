# Changelog

All notable changes to the standards. Semver: MAJOR = removals/breaking policy
changes, MINOR = new standards/modules, PATCH = fixes/clarifications.

> **This file and the git history behind it will be rewritten before the move to the
> official organization.** Both grew while the product was still deciding what it was, and
> they carry the sediment: threads that were abandoned, mechanisms that were built and
> removed, restructures described in terms that no longer exist. That record is honest but
> it is not useful - a person or an agent arriving here has to sift it to find what the
> standard actually is. On a fresh branch, the commit sequence will be re-authored to read
> as the development of a product, with what was dropped simply gone rather than narrated,
> and this changelog rewritten to match. The decision to do it, and the tension between a
> curated sequence and the record of what really happened, is
> [`docs/open-questions/genesis-history.md`](docs/open-questions/genesis-history.md).

## Unreleased

### A business decision could say how it would fail and not how it is held (2026-08-06)

`adr-write` requires a `Confirmation` section and calls it "what stops the record being
decoration". The BDR template had no such section, and `bdr-write` forbade naming the
technical consequence at all, so writing a real BDR - a privacy constraint on data retention -
recorded how the team would know the call was wrong (a detection signal) and nothing about how
they would know it had stopped being followed. On privacy, money and safety, which is where a
business decision most often has a technical enforcement point, that is the whole risk.

The BDR template gains `Confirmation`, and `bdr-write` asks for it as its own question:
"what would catch us breaking this?" is not "what would we see in three months if this was the
wrong call?" The tension with the record's boundary is resolved rather than dropped - naming
where compliance is checked is required, designing it stays the ADR's job, and "nothing yet"
is a real answer that has to be written down as one.

### The manifest asserted the required decisions R7 says it does not have (2026-08-06)

R7's own text: which decision areas apply "is a property of what is being built, so this rule
names no subset and asserts no count", and the checklist repeats it - "deliberately no minimum
count and no required subset." The manifest marked all eight catalogued decision entries
`required: true`, including datastore, api-contract and auth-model, and `self-verify` printed
`8 catalogued decisions to confirm recorded at review` on every run - a number sitting in a
report whose other numbers are drift and adoption. Assessment of five real ML repositories
found none of them carrying any of those three, and none of them in breach.

The field is gone from all eight entries, the summary line now says what the reader has to do
rather than how many things there are to count, and a `decisions` entry that declares
`required` is a FAIL naming R7 - nothing read that field there, so it could only ever assert
the subset the rule denies, and it survived four versions because reading was the only thing
that could catch it. `tools/self-verify-fill-test.mjs` gains four cases: the catalog is still
surfaced for review, its line carries no number, the shipped manifest declares no required
area, and a manifest that declares one is drift.

### A capability built where its globs do not look changed with `spec-guard: OK` (2026-08-06)

The plan template's default single-project layout was upstream's layer folders - `models/`,
`services/`, `cli/`, `lib/` - while a capability's globs name its domain. A capability
implemented under that default therefore matched no glob at all, and the coupling guard's
diff run, which can only fire on a file some glob matches, passed it. Reproduced: the same
two files under `src/services/proxy-swap.ts` and `src/models/swap-audit.ts` gave
`spec-guard: OK` with the spec untouched, and gave a violation when moved to `src/swap/`.
`--audit` does report it, but the diff run is the only spec-guard entry the manifest ships as
a gate, so an adopted repo sees nothing unless its author wired the audit as well.

Both halves are fixed. The template's default is now sliced by capability, which is what the
decision checklist has always called the paved road ("slice by capability/domain, not by
layer or page"), and its Structure Decision field says to bind the chosen paths in the map
and check them with `--audit`. And where the map declares `$unclaimed`, the diff run now
reports changed files that neither a capability claims nor `$unclaimed` declares - the same
rule `--audit` applies full-tree, one diff narrower. On the fixture it names
`src/services/proxy-swap.ts` instead of printing OK. Repos that declare no `$unclaimed` are
unaffected: the map never claimed to be total, so the guard still has no basis to call
anything unclaimed.

### Two capabilities in one folder had no way to say which file was whose (2026-08-06)

`capability-map.json` had globs and nothing else, so a second capability whose code
necessarily lives inside an already-claimed domain folder had three options and no good one.
Reproduced in a fixture with `src/swap/request.ts` and `src/swap/audit.ts`: unmapped, an edit
to the audit file demanded the wrong capability's spec; with a narrow entry added for it,
`spec-guard` fired on **both** capabilities for that single edit; and hand-enumerating the
files that remain is a list that goes stale the first time somebody adds one. Leaving the
sibling unmapped is not available either - `--audit` requires the entry. An attempted
`"!src/swap/audit.ts"` was read as a literal path and reported as a glob matching nothing.

A map entry may now start with `!`, which excludes: the capability claims what its other
globs match except those paths. On the same fixture, an edit to `src/swap/audit.ts` now names
`swap-audit` alone, an edit to `src/swap/request.ts` names `swap-request` alone, and `--audit`
reports 5 files each claimed by a capability. The escapes are closed with it: an exclusion
that hands a file to nobody is reported as unclaimed code, one that has stopped matching
anything is reported like any other dead glob, a capability of nothing but exclusions is
refused (it would claim no code while reading as mapped), and an exclusion written in the
object form is refused rather than silently given a coupling mode it cannot have.
`tools/spec-guard-test.mjs` gains nine cases and a `never` assertion, because a case that only
checks the exit code cannot tell "the right capability fired" from "both did".

### The persona gate failed CI on four of the six files a plan writes (2026-08-06)

`spec-structure.mjs` excluded `plan.md`, `tasks.md` and `checklists/` from the persona gate as
engine scaffolding, but `/spec-plan` is documented to produce four more: `research.md` in
Phase 0, and `data-model.md`, `quickstart.md` and `contracts/` in Phase 1. Every PR opened
between `/spec-plan` and `/spec-reconcile` therefore failed the gate on files that are not
capability specs and never carry a `Serves` field. Reproduced in the form CI runs,
`--base main --block` on a branch that has run the plan step: exit 1 naming
`contracts/booking-api.md`, `data-model.md`, `quickstart.md` and `research.md` - a
mid-workflow state the guard's own comment beside the full-tree check calls legitimate.

All six artifacts plus `contracts/` and `checklists/` are now one list. The full-tree warning
about committed scaffolding grows the same four, which is the direction that should be loud:
still there after the work closed means `/spec-reconcile`'s cleanup did not run.
`tools/clarify-gate-test.mjs` gains a diff-mode helper that builds the plan-stage branch for
real, and two cases on it - the plan's outputs pass, and a genuine sub-spec with no persona on
the same branch is still reported.

### A spec could carry two `## Clarifications` sections and every guard stayed green (2026-08-06)

The clarify gate greps for `^## Clarifications` and stops at the first hit. A spec that grew
a second one - written instead of a new `### Session YYYY-MM-DD` under the heading already
there - therefore passed the gate with half its clarification record below the split and
invisible to it, and to anyone scanning the file for the section. Reproduced on a spec with
sessions at lines 11 and 21: `spec-structure: OK (1 spec paths)`, exit 0, and the gate
granting `ready-to-develop`.

`spec-structure.mjs` now refuses a level-2 heading that appears twice in one capability spec,
naming the heading and every line it sits on. Level 2 only: `### Session <date>` and
`### <Other capability>` repeat by design one level down. Headings inside fenced blocks and
HTML comments are quotation and guidance, not the document's own structure, so a spec that
shows the shape it is teaching is not a violation. `tools/clarify-gate-test.mjs` gains six
cases - the duplicate fails and names its lines, and the four legitimate shapes still pass.

### The standard was run against a 13,591-file, nineteen-year repository, and the drift number stopped meaning what it means on a small one (2026-08-06)

The third `FIELD-1` repository, and the first at scale: `matomo-org/matomo` - 13,591 tracked
files, 31,287 commits since 2007-07-24, 479 all-time author names, 98 plugin directories of
which 16 are git submodules, GPL-3.0, `archived: false` with `pushed_at` on the day of the
run. Adopted for real on a local branch and taken from `drift 17 - 37% adopted (10/27)` to
`self-verify: OK - drift 0 - 98% adopted (57/58), 1 excepted`. Nothing was pushed upstream
and no issue or pull request was opened.

Three things the run confirms, and they are worth saying before the failures. **Waves are
already a first-class concept** - the appetite question at intake, the re-entry section, and
step 6's "wave one closes red, by design" - so the gap this round was looking for is not
there. **The backlog is counted and prioritised**: 36 items in four epics, each naming the
role that must act and the skill that carries it. **Cost is not the problem at this size**:
best of three runs on the adopted tree, self-verify 218 ms, spec-structure 64, facts-check
40, schema-pair 40, cycle-guard 42, decision-records-check 43, `spec-guard --audit` 76,
`spec-guard` diff mode 113. Two consecutive self-verify runs produced byte-identical output.

What the run breaks is the number. **Drift reached 0 in one sitting** on a repository where
12 of the 14 mapped capabilities have no spec and 36 items remain, because drift counts
manifest entries and the manifest has 59 of them whatever the repository's size. The router
names that number as the progress bar; at this scale it is full long before the first
wave's real work is done. Worse, **`self-verify` asks the filesystem and never the
index**: matomo's own `.gitignore:13` excludes `/docs/`, where 16 of the manifest's 48 file
entries live, so the persona roster, all six decision records, PRODUCT and ARCHITECTURE were
written, reported `PASS`, and were absent from a 51-file commit that contained zero paths
under `docs/`. R3 says project knowledge lives in the repo, versioned with the code; here a
third of the manifest's file entries resolved to a directory this repository will not carry,
at drift 0, described as "compliant with the standard".

Nine more findings, each with a reproduction: `schema-pair` skips when `database/schema/` is
absent - the state of every repo that has *not* complied with R24 - and no manifest entry
requires that directory at all, so matomo's 30 `CREATE TABLE` statements sit at drift 0 with
R24 wholly unmet. `spec-guard --audit` reports its unclaimed set as 20 alphabetical paths
plus a remainder, with map defects and unclaimed files added into one count; on this tree a
per-directory rollup of the same 296 files shows 150 of them in `plugins/CoreHome` alone. The
`.gitattributes` entry that exists to force LF on the shipped guards passes on a
`.gitattributes` that forces `eol=crlf` on `*.sh` and `*.mjs`. A `content` exception on a
merge-class entry can never apply, and self-verify tells the adopter to delete the record as
a deviation they no longer have. The adoption percentage rises from 37% to 82% purely by
copying the standard's own shipped files. The three options offered for landing the CI
workflow cover its self-verify step only, while its unconditionally-blocking audit step would
red every unrelated pull request until the twelfth spec is written. The copy-class `.nvmrc`
contradicts a Node repo's own `engines` declaration. The intake has no step for a repository
that already carries a substantive `AGENTS.md` whose operational rules live in another
repository - R3's failure mode in its most defensible form. And the shipped ADR index shows
no example of the row format its own guard accepts.

All eleven land as suite cases (`ADOPT-11`-`ADOPT-15`, `GATE-33`-`GATE-36`, `SHAPE-16`,
`DOC-19`), joined by `GATE-37` for the guard-cost measurement above; 16 observations in
`docs/validation/runs/2026-08-06-s-field3.json`. None of the eleven is patched here: each
one is either a design decision that changes what an existing adopter's number means, or a
change to a shipped guard's output that wants its own pass. The options are written into
each case rather than guessed.

Two limits on what this proves. The adopting agent was this project's own, so every intake
question needing a human - the persona tie-breaker, the appetite, the workflow blast radius -
was answered by inference and marked as such; the target-personas record was left `Proposed`
for exactly that reason. And `FIELD-1` still wants a mid-size repo on an **unregistered**
stack, which is the one shape neither adoption has exercised.

### The work-cycle guard checked the id and trusted everything else (2026-08-06)

Eight open findings in the tracking machinery, all reproduced against the live tree before
anything was written. Three of them are one guard learning to read what it already had in
front of it, and a fourth defect surfaced while fixing them.

**A split row was not read as finished.** `split:<id>` landed in the template's vocabulary a
release ago and `cycle-guard.mjs` was never told about it, so a `blocked:` reference to an
intent that finished and handed its remainder to a new row still reported `1 live block(s)`.
Reproduced on the greenfield fixture: exit 0, block reported live. It is finished work and is
now treated as such - and the reference is checked too, since reading three words in a status
cell as "done" without checking what they name would be a way to retire any row and disarm
every block pointing at it.

**The one-place invariant was keyed entirely on the id.** Copy an intent into a cycle,
renumber the copy left in the pool, keep the title, and the guard reported `OK - each in
exactly one` - because two ids are two ids. The title is now compared too, with markup
stripped and whitespace collapsed, across files only, and one pair is exempt: a `split:<id>`
row and the remainder row it names, because `/cycle-close` cuts that row and an author who
keeps the wording is following the skill.

**A reference was uppercased before it was compared.** Found while building the split check,
and older than it: the whole status cell was lowercased on read and the id restored with
`toUpperCase()`, so `blocked:ADR-auth` - the id shape this guard's own header documents -
reported `ADR-AUTH exists nowhere` on a repo that was correct. References now resolve to the
row that declares the id without regard to case, and are reported in that row's spelling.

**The pool's in-flight pointers were nobody's job.** A pointer row for a cycle that closed
three months ago, an item count that disagreed with the cycle's real rows, and a `done` row
still in the pool - all three at once, and both guards reported full compliance. Two of the
three are now mechanical: the `Cycle` cell must name a cycle file that exists and is still
open, and a non-empty `Items` cell must be that cycle's real row count. Deleting the row is
not the way out - once the table carries any row, an open cycle nothing points at is caught
as well. A pool that deleted the section is not running cycles and is not checked. The third,
a `done` row lingering in the pool, is deliberately left alone: the pool template licenses
`done` rows until release ("drop `done` rows on release, or let the Backlog.md tool archive
them"), and a guard failing on every one of them would make that licence impossible to use.

The two comment-and-fence readers inside the guard became one, which is what made a third
scan affordable. `tools/cycle-guard-test.mjs` goes from 37 cases to 65, each new check
carrying both directions - the defect fails, and the legitimate shape beside it still passes.
The worked adopting repository (three closed cycles, one open, a populated pool, a live
pointer row) passes unchanged, which is the only reason to believe the new checks are
checks rather than noise.

### A backlog row now carries where it came from, under one id convention (2026-08-06)

The other three findings from the same round, all in what a row is allowed to say.

**"Every item has a source" was claimed in three documents and the row had nowhere to put
one.** The ten declared columns were id / title / cap / persona / owner / assignee / size /
why / DoD / status, and two agents filing different rows independently found the same
undocumented workaround: fold the provenance into `why`. There is now a `source` column, with
five declared categories - `onboarding`, `spec-delta`, `drift`, `decision`, `asked` - and the
Definition of Ready requires it. `docs/method/tracking-work.md` used to say plainly that a
row carried no source field and that a column would close it if it started mattering; it now
says what the column does.

**Two id conventions were documented at once.** `add-to-backlog` said type-scoped (`SPEC-3`,
`ADR-auth`), every worked example in the method docs used capability-scoped (`INV-3`,
`PAY-2`), and the pool template mixed both inside one sentence. The id is the only field
joining the pool to a cycle, so the ambiguity was load-bearing. One convention, stated in one
place: the prefix names what the item belongs to - the capability where there is one, the
artifact type where there is not. Everything else now points at that sentence instead of
restating it.

**Internal work had no persona to name.** An item that serves no persona is parked rather
than queued (ADR-006), the roster holds end users, and documentation and spec debt is the
pool's own headline content - so the doc's flagship category was parked by its own rule. The
only precedent, `(infra)`, existed solely inside a commented-out template row. The pool now
declares `Maintainer (internal)` in prose, and `add-to-backlog` names it.

**The board had nowhere to render a blocked item.** `blocked` is the fourth status the schema
declares and the rendered three-lane board showed nothing of it - so the one fact worth seeing,
what a stuck row is stuck on, had no home. The board keeps three lanes, which was already the
skill's decision, and a blocked row stays in `doing` carrying the id it waits on.

**A cycle's commit count measured the repository, not the team.** `git log --oneline --since
--until | wc -l` has no author or path scope, so two teams whose windows overlap both record
every commit in the overlap - contradicting `/timeline-update`'s own rule never to blend
throughput across teams. Reproduced on a nine-commit two-team history: 7 and 6, of which 2 and
2 belonged to the other team. Scoped to each cycle's own `assignee` set, the same history
gives 5 and 4. `/cycle-close` now prescribes the scoped command, tells the close to report an
assignee that maps to no git author and a window that yields zero commits rather than absorbing
either, and requires the recorded number to name what it was taken over.

### A fixed finding could leave the ledger from both sides at once (2026-08-06)

The suite's headline is "failures found: N - M fixed and re-verified, K still open, logged and
named below, not hidden." The renderer counted a finding as fixed only when its observation
carried a `fix` URL. A fix verified on its own branch before the pull request merges has no
URL to carry yet - so that observation left the punch list, because it passes, and never
entered the fixed count, because it had no link. The finding was not moved between buckets;
it was removed from both, and from the total, with nothing in the output saying so.

It surfaced while reconciling two conventions that had drifted apart across a day's parallel
work: some run files cited the pull request carrying the fix, some deliberately did not
because that pull request had not merged and the rendered line says "merged pull requests".
Both readings were defensible, which is why neither author saw the arithmetic underneath.
Measured on the real data by folding two branches' run files into the mainline's and
recomputing: `167` became `164`. Adding the URLs back restored `167`, which is what showed the
gate rather than the data to be the cause.

`fix` is now provenance rather than the condition for counting: a pass whose case+target ever
recorded a fail is a fix. The pull-request count reports only the fixes that cite one, the
headline names the rest separately rather than folding them in, and the fixed table prints the
run file that re-verified an uncited fix instead of an empty link. Both conventions are now
safe, so neither has to be policed.

`tools/validation.mjs` was the only generator in this tree with no test, while every guard it
sits beside has one - and it is the one that produces the numbers this project publishes about
itself. `tools/validation-test.mjs` runs the real renderer against throwaway fixture trees
through a new `--root`, and CI runs it beside `--check`. Reverting the counting rule turns 6 of
its 9 cases red; the 3 that stay green are the ones asserting the opposite direction, so the
fix cannot be "everything counts as fixed" - a pass that never failed is still not a fix, and
an unfixed failure is still open.

### Nine rules assumed a repo shape, and said nothing to the repos that have the other one (2026-08-06)

A rule framed for one product shape does not fail loudly on another - it simply has
nothing to bind to, and an adopter reads it as not applying. Nine such gaps, found by
running the standard against real repositories of the wrong shape, are closed by naming
the other shape rather than by widening the rule until it always passes.

**The integration rule spoke only about pull requests.** One unit of work per PR, every PR
based on the mainline, a PR lands by rebase-merge - all of it inert in a repo whose review
happens on a mailing list or in Gerrit, which has no pull requests to bind any of it to. It
now binds to the **reviewed change**, and a repo whose review does not happen on the git
host names its own unit in the branching decision. The bar is unchanged. What is still
open, deliberately: a merge queue that batches many changes into one two-parent commit is
neither rebase nor squash, and ADR-026 reserves that call for its own record rather than a
rule edit.

**The schema rule opened with "a repo that owns a database"** and then said nothing to a
library whose product *is* multi-backend migrations - which owns no schema, and whose
riskiest artefact is the DDL it emits into somebody else's. The directory and the typed
twin do not apply, said once as a decision; the emitted DDL is an interface contract,
specified verbatim per supported backend.

**The stated runtime cost named Node and stopped**, while the agent guards are shell
scripts that parse their input with `jq` - an absence that denies every command, on a
platform where a missing POSIX shell instead runs no guard at all and reports nothing. All
three are now named, with what a repo does when it cannot supply them. The prerequisites
page gains the platform half, including why the shipped deny/ask lists, written in a POSIX
command vocabulary, do not cover the same action spelled in another shell.

**The security baseline had no adversarial-testing axis** - searching the whole standard
for "fuzz" returned nothing - so a repo whose real defence is a fuzzer running against its
parser could answer every axis and never mention its primary control.

**Three catalogues gained the shape they were missing:** the decision checklist covers one
structure described twice (a Bazel graph beside a CMake one, one schema hand-forked into a
second SQL dialect), with generate-or-declare as the paved road and two hand-edited copies
named as the answer that is not available; the buildable tier says what its required
sections mean for a content product (a translation catalogue, a packaging recipe, a
narrative work) rather than leaving the escape hatch as the only reading; and intake reads
the governance a repo already declares as config (`.jcheck/conf`, `.gitreview`,
`CODEOWNERS`) instead of interviewing for answers sitting in a file it had already cloned.

**`spec-reconcile` treated a compatibility shim as current design.** Its standing
preference - make the spec accurate to the real behaviour - files a body that exists only
to keep a previous release's binary working under "what this capability is". It is now
recorded as what it preserves and when it can go, with the contracts left describing the
current shape; deleting it is named as the opposite error, because it ships.

**`facts-check` answered a binary home by coin flip.** All four home mechanisms read UTF-8
text and nothing said so, so a font's version inside its TTF name table got a green tick
when the name record happened to be ASCII, and "the home pattern matches nothing" - which
reads as a bad regex - when it was UTF-16. One read path now serves every mechanism and
refuses a binary file by name, pointing at the way out: a text home the artefact is built
from, or an undeclared restatement stated as undeclared. Four cases cover it, three of
which fail with the check disabled.

### The drift number answered two different questions with the same integer (2026-08-06)

Two ways `self-verify` said more than it had measured, both reproduced against the current
tree before anything was changed.

**A missing tool scored as repository drift.** A Layer 2 guard shells out to its stack's own
toolchain, so `pnpm check:all` on a machine with no `pnpm` failed with a bare
`command not found` and printed `drift 1 - 99% adopted (78/79)` - byte for byte the verdict
three real lint errors produce on a compliant repo. Measured side by side, the two verdict
lines were string-identical. `prerequisites.md` already stated the rule this broke: the
number scores the repo's structure, not the machine it runs on. A guard whose prerequisites
are absent is now **not run** - reported as `SKIP`, counted as neither drift nor adoption,
and named in the verdict line, because a skipped blocking check must never be quiet.
This loosens the gate - a guard failing on a missing tool used to exit 1 and now does not -
so `OK` is dropped from the verdict whenever a check did not run, and the count is named in
the same line. The exit code answers whether the repo complies, and a check that never
started has no opinion on that. Prerequisites come from the guard entry's new `requires`
(`{ "kind": "command"|"path", "match": ..., "hint": ... }`) and, for guards that declare
nothing, from any bare word in `run` that is no shell builtin and resolves nowhere on `PATH`.
The `path` kind is what keeps the question free of side effects: with a package manager
present and its dependency tree absent, *running* the guard is what pulls the tree off the
network, so the guard must not run. Demonstrated both ways - with the prerequisite undeclared
the fixture installed as a side effect of `self-verify`; declared, it did not, and nothing
about the repo's drift changed. Inference errs toward running the guard in every direction
it can be wrong, because the wrong answer is a check that quietly stops running: quoted text
is blanked before splitting, so a tool named inside an error message is never probed; `a || b`
is read as a fallback rather than two requirements; and the `node` executing the file is never
probed, since a runtime invoked by absolute path from outside `PATH` would otherwise silence
every guard at once.

**`drift 0` read as "the method has been used here".** A raw greenfield tree plus three
declarative files - `.standards-version`, a `profile` key, an empty
`specs/capability-map.json` - walks from `drift 3` to
`OK - drift 0 - 100% adopted (69/69) - compliant with the standard` with not one capability
spec written. The number was right; every manifest entry really was met. The sentence was
not. So the drift-0 line now carries the caveat in the same breath as the number, and the
absence is **reported, never scored**: the greenfield walk scaffolds in step 1 and specifies
in step 6, and step 1 promises the scaffold passes, so scoring the gap would put drift 0 out
of reach of an honest new repo for the whole length of the interview - and a failure nobody
can clear is one everybody learns to route around. The caveat clears the moment a real
`specs/<capability>/spec.md` exists; the spec engine's own `plan.md` and `tasks.md` do not
clear it, because scaffolding is not specified behaviour.

Ten cases in `tools/self-verify-drift-test.mjs` hold both halves in both directions - a
missing tool must stop counting *and* a real guard failure must keep counting, a repo with
nothing specified must still reach drift 0 *and* say so, and a guard whose prerequisites are
met must still run. Each half was then checked by reverting it and re-running: neutralising
the prerequisite resolver turns three cases red, neutralising the caveat two, restoring the
`OK` prefix one, and reading `a || b` as two requirements one. That pass earned its keep -
the assertion about the drift-0 verdict line was at first written against a fixture sitting
at drift 1, where it could not have failed whatever the line said, and the summary line's
hardcoded "20 cases" had been stale at 22 for some time. The count is computed now.

### The one number a cycle publishes could not be reproduced by whoever read it (2026-08-06)

`/cycle-close` prescribed `git log --oneline --since=<opened> --until=<closed> | wc -l` for
the commits-in-window figure, with the dates bare. Git resolves a bare date as an approxidate,
meaning that date at *the moment the command runs*, so the same command over the same history
answers differently in the morning and in the evening, and the cycle-open and cycle-close
commits, which sit on the boundary days by definition, fall inside the window only when the
open commit's time of day is later than the close commit's. Measured on the worked showcase's
three closed cycles: 3 / 2 / 1 at 19:24, 3 / 2 / 2 at midnight, 2 / 1 / 1 at midday. The
inclusive window returns 4 / 3 / 3, and carries no approxidate to move with the clock.

That is also the history of the defect. The blocks first claimed 63 / 51 / 88 against a repo
whose entire history is 34 commits; a commit correcting them to 9 / 6 / 3 stated that the new
numbers were what `git log` returns, and they were not either; the third pass wrote 4 / 3 / 3
from the full inclusive days, which is right - and which the bare-date form could not return
at any hour, since each of the three cycles opens earlier in the day than it closes, and the
sliding window can hold both ends only if that is reversed. Two published corrections of one
number, the first wrong and the second unreachable by the command the standard named - an
ambiguous instruction rather than carelessness. The prescription now writes the times out,
and the spec records why the window is the two boundary days whole.

Worth saying about the measurement itself: the showcase is a demo whose early history was
authored rather than accumulated - its 19 oldest commits, which is every commit those three
cycles span, carry whole-minute timestamps with author and committer date identical. The
counts over them are real; the times they land on were chosen, which is part of why a morning
open and an evening close made the ambiguity so easy to hit.

### Thirteen version bumps had no changelog entry, and no gate would have caught the next one (2026-08-06)

R18 makes a release one act: promote `## Unreleased` into a version heading, then bump
`VERSION`. Only the second half ever happened for a stretch of this repo's life, and no gate
looked. `tools/tree-check.mjs` now fails when `VERSION` names a version with no matching
`## <version>` heading in `CHANGELOG.md`. It cannot judge whether the section says anything
useful; it does stop a number shipping with no section at all, which is the failure that
actually happened.

The historical gap is recorded rather than backfilled. Read off `git log -p -- VERSION`:
thirteen commits moved the file between the 0.8.0 and 0.8.13 releases - 0.9.0, 0.9.1 and
0.8.2 through 0.8.12 - across a 32-commit span, exactly one of which touched `CHANGELOG.md`
at all, and that one only to rewrite an organization name inside older entries. `VERSION`
never held 0.8.1: two ordinary PRs shipped as 0.9.0 and 0.9.1 when R25 matched its own
trigger, and the walk-back wrote 0.8.2 directly. The note cut with 0.8.13 says "twelve version
bumps" and names 0.8.1 through 0.8.12, so it counts a version that never existed and misses
two that did; the released section is left as it was cut and a new section states the
correction. Twelve of the thirteen bumps are one commit each and could have been transcribed
from their subjects, but 0.9.0 sits twenty commits after 0.8.0 and splitting those nineteen
across headings would be a guess - in the one file whose value is that it is checkable.

### R23 forbade the ordinary security backport, so a maintained release line is now a base a PR may have (2026-08-06)

"Every PR MUST be based on the mainline, never on another open PR's branch" was written
for one failure - work stacked on a branch that gets rewritten when it lands - and it
banned far more than that. It made a CVE fix shipped to a supported `3.x` line
non-compliant, because the pull request carrying it is based on `3.x` and not on the
mainline. R18 had the matching gap: one repo, one `## Unreleased` heading, one slot for a
fix that ships in four releases at once.

This was the most-repeated finding of the 2026-08-04 validation round, confirmed on five
independent repositories - odoo (98 branches, four supported lines), openssl (five
maintained `REL` branches with a per-PR backport matrix), dotnet/runtime (servicing
branches with a written backport policy), FFmpeg (a `Changelog` section per version, which
is this mechanism already applied per line), and PowerShell.

R23 now names the class the old wording missed. A PR is based on the branch it will merge
into - the mainline, or a **maintained release line**: long-lived, protected, declared as
supported with the repo's branching decision, and never rewritten. Every requirement in
the rule binds a release line exactly as it binds the mainline, and another open pull
request's branch is still never a legal base, because what made that unsafe was that it
gets rewritten. A fix touching more than one line lands on the mainline first and reaches
each supported line as its own PR, so no supported line is ever ahead of the mainline in
fixes. R18 gains the matching clause: one changelog per line, each with its own
`## Unreleased`, the entry written under the heading on the branch the PR targets - the
same one mechanism applied per line, not a second one.

The decision, and the five shapes rejected on the way to it - including a new numbered
rule, which would have left R23 still forbidding what the new rule permitted - is
[ADR-035](docs/decision-records/ADR-035-maintained-release-lines-are-integration-targets.md).
The conventions block, the decision checklist's branching fork and the changelog process
carry the same rule for the reader who never opens the spec. Making the support set
machine-checkable was considered and rejected for now: a branch existing is not a branch
supported, so the check would assert what a checkout cannot show.

### A CI workflow that exists is not a gate that fires (2026-08-06)

The assessment's CI/CD pass detected "is there a pipeline?" and rated what it found. A
workflow file is evidence of intent, not of a gate. The 2026-08-04 round found it carrying
no `pull_request` trigger at all (postgres and openjdk run their real CI elsewhere, and
postgres says so in a comment inside the workflow) and worse - LibreOffice/core's only
PR-triggered workflow auto-closes every pull request opened against the mirror. Two more
shapes gate nothing just as quietly: a `pull_request` trigger behind a `paths:` filter that
excludes everything, and a self-hosted `runs-on` label with nothing registered behind it,
where the job queues until it is cancelled and reads as *no run* rather than as *failed*.

Pass 5 now rates what fires. The evidence a gate exists is a recent run **on a pull
request** - `gh run list --workflow <file> --event pull_request` or the checks list on the
last few merged PRs - and the health report states two facts separately: which gates exist,
and which of them ran. A workflow nobody can show running rates `partial` at best, never
`solid`, and where the run history is unreachable the report says so the way pass 8 already
says it for a shallow clone, instead of promoting file existence to a passing gate. The
pass also now says that CI outside the host is still CI: no workflow directory does not
mean no pipeline when the gate is Gerrit, buildbot or a mailing-list patch queue.

Self-verify's own limit is stated with it, in the judgment tier. The manifest requires
`.github/workflows/spec-guard.yml` to declare `on.pull_request`, and that is a key in a
file: measured on this tree, the same workflow with a `paths:` filter matching nothing
still reports `drift 0 - 100% adopted (70/70)`.

### The intake looked for a contribution policy everywhere except AGENTS.md (2026-08-06)

The red-flag scan in `align-to-standards` step 0 looked for an AI/agent policy in
`CONTRIBUTING.md` and in files named for the purpose. `AGENTS.md` was in the same step, but
only as a presence signal - "a partial skeleton without a pin? note it" - so a policy stated
in the one file R1 makes the repo's single entry point went unread. Three real repositories
confirmed it independently: `sqlite/sqlite`'s `AGENTS.md` says "SQLite does not accept
agentic code"; `alibaba/arthas` ships a Chinese `AGENTS.md` that forbids CI and orders all
security design deleted; `opentofu/opentofu`'s `AGENTS.md` is itself an LLM-contribution ban.
All three were re-read live while writing this, not taken from the earlier round's notes.
Nothing downstream catches what the read misses, and that was measured too: on a directory
whose only file is an `AGENTS.md` refusing agentic contributions, `self-verify` prints
`PASS file AGENTS.md (the single agent entry point)`, because presence is all it measures.

The policy read is now one instruction that names where to look, says to read the file's
content rather than check that it exists, and says to read it in whatever language the repo
wrote it. It branches three ways instead of two. The ban branch adds what the ban covers:
a ban on contributing is not a ban on reading - OpenTofu refuses LLM-generated code over its
Terraform licence ancestry while inviting LLM-found problems as issues, and SQLite takes
agentic bug reports carrying a repro - so a stop is not automatically the end of the run and
assessment-only is worth offering. A policy file carrying instructions hostile to the repo
itself (arthas) is evidence to report, never orders to carry out.

The third branch is new: a repo whose policy *mandates* what this standard forbids.
`JuliaLang/julia`'s `AGENTS.md` requires the AI tool as a git co-author on every commit and
an AI-assistance disclosure on every pull request; `docs/conventions.md` bans exactly that
and align merges it into that same file. Both silent answers are wrong - complying writes
attribution the standard forbids, installing the convention puts every later pull request in
breach of the repo's own published rule and overwrites that rule in the act of breaking it -
so the branch stops and puts the conflict to the human with both obligations named. No gate
catches this one: nothing in `self-verify` reads what a convention says, so the drift number
is identical whichever rule survives, which is why the answer is written into `AGENTS.md` and
a decision record rather than left to the merge. The merge step itself now says to read the
target's `AGENTS.md` before writing over it, so a missed intake does not go silent there.

### Three severe findings re-run: embargoed work gets a name, the ripple reads both record streams, the revisit reader was already there (2026-08-06)

The 2026-08-04 round logged `SEC-02`, `LOOP-03` and `DEC-08` as severe and open. Re-run
against the current tree before anything was written, one of the three had already closed.

**`SEC-02` - the standard had no word for work that is real, recorded and not yet
publishable.** R3 (knowledge lives in the repo), R11 (spec and code in the same pull
request) and R15 (the backlog holds the intents), followed literally in a **public** repo,
publish an unfixed vulnerability the moment somebody starts fixing it - and the same
reading publishes a customer's confidential detail and an unannounced commercial move.
Confirmed on the tree: no rule carried an embargo or confidentiality clause, and the
manifest's `exceptions` has four kinds (`file`, `section`, `content`, `key`) with no
embargo among them.

The fix is not a hole in R3. R3 conflated *the repo* with *the public*: material whose
publication is itself the harm may be held in a private mirror of the repo - the platform's
private advisory fork is the paved road - and MUST rejoin the mainline when the embargo
lifts. Every rule binds inside that mirror, so the spec, the coupled change, the backlog
intent and the changelog entry are written while the work happens rather than reconstructed
at disclosure; which is why only one rule moved, and R11 and R15 needed no exception at
all. An embargo names its lifting condition and its owner the moment it starts - one with
no stated end is knowledge kept out of the repo, which R3 already forbade - and the near
misses are named so the clause cannot be read as a general licence: "not written up yet",
"it is in the chat", and work someone would rather not publish are not embargoes. Recorded
as ADR-034 with the two rejected shapes: an "unless confidential" clause on each of the
three rules, and a new `embargo` kind in the manifest's `exceptions` (which records a
repo's standing structural deviation and lowers its adoption percentage - the wrong
mechanism for a temporary state of one piece of work). `security-baseline.md` gains the
matching axis, so R19's recorded baseline answers where embargoed work lives and who lifts
it before an incident rather than during one.

**`DEC-08` - the ripple search read one of the two decision-record streams.**
`spec-impact` step 3 said `ADRs`, while the standard and that same skill one step later
distinguish ADR from BDR. Reproduced literally against the fixture: a change adding
auto-approval to `shift-swap-request` (spec `Status: in-refinement`, so step 1's retirement
check does not fire) is explicitly forbidden by Accepted `BDR-001`'s `What this rules out` -
and the step sends the agent to a directory holding one ADR about Postgres, which reports
no impact without `docs/decision-records/bdr/` ever being opened. The step now names both
streams and points at `What this rules out`, the only section carrying a capability's
non-goals, because what a change may not do is usually a business constraint - a licence
boundary, a vendor or customer contract, a regulatory limit, a persona call. The output
line reports decision-record impact across both, with `contradicts` as its own outcome.

**`LOOP-03` did not reproduce and is closed rather than fixed.** The finding was that a
decision record's `Revisit when` had two writers and no reader, so the trigger fired only
when the same agent happened to remember writing it. `discovery-digest` gained that reader
the same evening the finding was logged, and the round never re-ran: the grep the case
specifies now returns two writers and one reader across the skills. Verified mechanically
rather than by reading the step - pulling every `Revisit when` block across the fixture's
records and matching new material against them lands on `BDR-001` for "approval fatigue",
with no agent memory involved. What that closes is a tripwire on material entering through
discovery, which is what the case asked for; a signal true in the world and never written
down here still reaches nothing, and the step says so itself. One thing did change:
`dev-work.md` introduced the revisit-when field as "the difference between a record and an
opinion" while naming nothing that reads it back. It now points at the skill that does, and
states the same limit, so a reader learns the reader exists where the field is introduced.

### The work state had no surface for the people who most need to read it (2026-08-06)

The pool, the cycles and the timeline answer what is owed, what is in flight and when it
lands - in markdown, in a repository. That is the right home and the wrong reading surface
for a sponsor, a client, or somebody who joined on Monday, and the gap was being filled the
way it always is: somebody retyping the state into a status email, where it is stale on
arrival and nobody can check it against anything.

`scripts/work-dashboard.mjs` ships, with its stylesheet and its client, and renders one
static page: what is in flight now, the cycles against a calendar with today, the agreed
target and the measured projection on it, the pool as a ranked list, a kanban per cycle, four
reports, the changelog as history, and every decision record, spec, idea and open question
behind one search. A repository that keeps no cycles gets no cycle views and is told why
rather than shown an invented sprint.

Three properties were the point rather than the page:

- **It is a projection.** It writes nothing back, and the same commit produces the same bytes
  - the fingerprint is over the content, never the build time. There is no second place where
  work is tracked and nothing to keep in step.
- **It notices when it goes stale.** The page carries its fingerprint and polls a `state.json`
  written beside it; when the work moves it reloads itself and restores the reader's place,
  and it waits with a prompt instead when a record is open or a search half-typed. Nothing
  fetches, pulls or rebases: a stale page is a display problem, and repairing it by moving
  somebody's branch would be a much worse one. `--watch` and `--serve` give the same loop
  locally.
- **Publication is gated on who may read the repository**, because the page contains nothing
  the repository does not. The shipped workflow builds on every push to `main`, uploads the
  page as an artifact, and reaches the publish step only when the repository is genuinely
  public - GitHub Pages on a private repository is served publicly unless the organisation is
  on Enterprise Cloud, which is precisely how a private backlog ends up on the open internet.
  Pages has no password to put in front of it and a prompt written in the page's own
  JavaScript is theatre, so the private case gets a real lock instead: `--lock` encrypts the
  page at build time (AES-256-GCM, key stretched from the passphrase with 600,000 rounds of
  PBKDF2) and ships the ciphertext, which the reader's browser decrypts. What sits on the URL
  is unreadable without the password, so any static host will do - including Pages, and the
  workflow's publish step opens for a private repository exactly when the
  `WORK_DASHBOARD_PASSWORD` secret is set. The locked page names nothing until it opens: the
  title is "Work" and the repository is not mentioned. It is one shared secret rather than
  per-person access, revoked by changing it and rebuilding, and the ciphertext can be attacked
  offline - all three stated where somebody choosing it will read them, next to the hosted
  identity gates that are the answer when one password is genuinely not enough.
  `--anonymise` drops assignees and the owner a cycle names, at build time, for a page that
  leaves the building - structured fields only, since prose written by hand is reproduced as
  written. The local `--serve` binds loopback for the same reason, on a port nothing else
  wants (9675) so it never takes the one the application under development is trying to use.

The generated page is not committed. It is a function of the commit, so committing it would
buy nothing and cost a large diff in every pull request plus a conflict on every parallel
branch - the same call `site/docs/` already carries. This repository publishes its own at
`/work/`, which is both the dogfooding and the demo.

Run against two repositories before shipping: this one, and the showcase, whose four cycles
and closed-cycle outcomes are what the timeline and the reports were actually built against.
It ships under `$unclaimed` in the coupling map - the declared form of "shipped code with no
capability spec yet", the same position the other guards were in - with a backlog row for the
spec, because a report whose definition lives only in the code is a number nobody can argue
with.

### The spec loop reads the decision log before it writes (2026-08-06)

Two `severe` validation findings, one defect seen from two sides.

Neither `/spec-specify` nor `/spec-clarify` read `docs/decision-records/` at all
(`SPEC-18`). What both were told to read before asking the user anything was
`docs/discovery/` - which ADR-024 makes explicitly non-normative. The loop's entry point
therefore consulted, by documented procedure, the source that binds nothing and never the
one that binds everything, so a spec contradicting an Accepted record passed the clarify
gate and every guard. The only backstop, `AGENTS.md`'s red-flag list, named ADRs and not
BDRs - the product-side stream a feature request actually collides with.

And retirement awareness had reached only one of the loop's two entry points (`SPEC-17`).
`/spec-impact`, `/spec-update` and `discovery-digest` each stop on a `retired` capability;
`/spec-specify` - the door the product points a PO at - contained the word zero times while
instructing that an existing capability directory means "update the existing spec in place".

Now: both skills read the decision-record index before drafting or asking, bounded by the
index and opening in full only the records whose subject overlaps. An Accepted record
outranks the dossier, the draft and the user's answer in the moment; a contradiction stops
the run with exactly two routes - change the request, or supersede the record. `/spec-clarify`
can now refuse an answer for that reason.

`/spec-specify` also stopped matching capabilities by the slug it had just invented: it lists
`specs/` and matches on subject first, because `shift-reminders` and `shift-notifications` are
one capability under two names and the near-miss is how a repo acquires two rival specs for
one subject - and how a retirement gets routed around without anyone deciding to. It then
reads the matched spec's `Status` and stops before drafting on `retired`, naming the record
and handing the call back: a fresh capability is frequently the right answer and the retiring
record often says so, but that is the user's call, not the agent's.

R6 now states the binding half it was already being cited for; the capability spec template
says what retirement means for later work; and `AGENTS.md`'s red flag and the constitution
template's hard stop name both record streams rather than only ADRs. Recorded as ADR-033.

Both fixes were tested by dry run against the `test-greenfield-core` fixture rather than by
inspection, and the run broke the first draft twice - once on the index-bounded read (the
fixture's BDR index omits the very record that governs the request, so the skills now say the
bound rests on `decision-records-check` and to list the directory where that guard is not
running), once on a retirement clause that forbade what the retiring record itself called for.

### The landing showed two versions at once, and both guards called it shippable (2026-08-06)

`site/index.html` stated the version in five places. The header pill read `v0.8.13`, which is
what `VERSION` says; the maturity disclosure, the footer and two lines of the hero script all
read `0.8.12`. A first-time reader got both numbers on one page, four lines apart.

Neither guard could see it. `site-check.mjs` asserted that the current version appears
somewhere on the landing - a condition a page satisfies perfectly while also naming the
previous release. `docs/facts.json` declares one pattern for this file, the header pill's
`class="tag mono">v`, so `facts-check` was checking the one occurrence that happened to be
right. Both reported green on every push while the page was wrong.

The four stale strings are corrected, and `site-check` now compares **every** version-shaped
string on the landing against `VERSION`, reporting the line and the string for each
disagreement. It needs no list of where the versions are, so it covers the sixth occurrence
somebody adds next. `<svg>` bodies are masked out first and are the only exemption: path data
is a coordinate stream that reads as a version to any regex, and the header's GitHub mark
alone contributes thirteen, seventeen across the page's marks. Masked rather than deleted,
so the reported line numbers still belong to the real file.

Comments and stylesheets stay in scope. A version in a comment is still a version somebody has
to keep true, and a CSS number has one decimal point, so a stylesheet cannot produce a false hit
in the first place. The one surface that does legitimately carry an old version is the frozen
previous landing, `site/previous.html` (v0.7.2 throughout), which this gate has never read and
which the web-surface spec already places outside it.

No new `facts.json` patterns: the other four places are prose, footer layout and hero copy, and
`facts-check` fails loudly when a declared pattern stops matching, so declaring them would block
the next legitimate rewording while still missing whatever gets added after. The scan covers
them all without being told where they are; the reasoning is recorded in the web-surface spec.

`tools/site-check-test.mjs` is new and drives the gate over fixture sites: a clean landing
passes, a stale version in the footer fails with exactly one problem reported (proving the SVG
mask holds), a stale version inside the hero script fails, a version ahead of the release fails,
a stale version sitting behind a self-closing `<svg/>` fails, and a landing naming no version at
all still fails the original advertise check. Reverting the scan turns five of the six cases
red, which is the property that makes them a test rather than a description of the code.

That self-closing case is a defect this change's own review found before it merged. The first
mask paired any `<svg` with the next `</svg>`, so a self-closing `<svg class="x"/>` earlier on
the page would have blanked out everything up to the following mark - a stale version included -
and the guard would have reported the page clean. The opening tag now has to be a real container.
A guard that goes quiet is worse than the defect it looks for.

The validation record moves with it. `runs/2026-08-06-i-doc12.json` carries the evidence against
`repo:repository-standards/core` - the `self` target, never counted among the third-party
repositories tested - and a second observation retires this case's 2026-08-04 row, which was
filed against the greenfield fixture because that whole round was. The fixture has no landing
page, so the case cannot pass or fail against it; the verdict there is `not-applicable` and the
finding lives where it actually happened. The 2026-08-04 file is left exactly as written, which
is what the superseding machinery landed earlier today is for.

### The persona gate never opened the roster (2026-08-06)

`spec-structure`'s persona check was a three-way OR, and its first arm decided almost every
case: a `**Serves:**` field holding any non-placeholder string passed, without reading
`docs/personas.md` at all. The two arms behind it were the roster-aware ones, so they could
never fire. A spec serving `Whoever I like` passed. A spec with no persona and the phrase
"for whom" somewhere in its prose passed, on an arm whose own comment claimed it stood for
prose that reasons about who the capability is for. And stripping the backticks off every
roster row - which empties the parsed roster - changed no verdict, because nothing was being
compared against it. All three reproduced exit 0 before this change, and R10 plus
`personas-write`'s "a persona missing from the roster does not exist as far as R10 is
concerned" both say otherwise.

The roster is now the constraint. A filled `**Serves:**` must name somebody on it - the whole
value is read, not just its first backticked name, and on to the lines that continue it, so a
spec serving two or three personas is checked on all of them however it wraps - and the
failure quotes back both the claim and the roster. A spec with no `Serves` field may still
name its persona in prose, which is the hatch the error message always advertised; "for whom"
on its own no longer counts.

An unreadable roster is now reported rather than obeyed. Every arm of this check is a
membership test, so a roster that parses to nothing passes everything by having nothing left
to contradict - which is how the defect stayed invisible. When `docs/personas.md` exists,
capability specs exist, and no roster row parses, the run says the roster could not be read
and names the row shape it expects. The hatches that were already there stay: a repo with no
`personas.md` and no specs yet, templates and READMEs, and an unfilled `<persona ...>`
placeholder still reported as serving nobody rather than as serving a persona by that name.

`tools/clarify-gate-test.mjs` gains 16 cases covering both directions, including the three
reproductions above and each preserved hatch. `docs/tree/docs-personas-md.md` had been
showing roster rows without backticks, a table this guard reads as empty; it now shows the
form the guard parses.

### The update delta was read off the manifest, which cannot see most of a release (2026-08-06)

`update-to-version` step 2 called the diff of the two versions' `standard.manifest.json`
"the precise delta". It is not one. Between the 0.8.12 and 0.8.13 manifests, that diff
reports no file added, no file removed, and 50 entries changed on nothing but their `since`
and `purpose` strings - while the release itself moved 4 payload files, 47 insertions and
22 deletions, including a three-hunk behaviour change in `cycle-guard.mjs`. The content
hashes added since do not close it: only `copy` entries carry a `sha256`, and `merge` and
`fill-from-repo` entries are adapted on purpose and carry none, so 37 of the 82 files the
tree ships have no content recorded anywhere in the manifest. Reproduced on the current
tree: a release touching `specs/capability-spec.template.md`, `.github/workflows/spec-guard.yml`
and `AGENTS.md` - three required entries - moves nothing in the manifest but the version
string, and an agent following step 2 literally enumerates zero work to do.

Step 2 now names the file diff between the two versions' shipped trees as the delta, and
demotes the other two sources to what they are: the manifest diff indexes which *entries*
arrived, changed shape or went away, and the changelog carries the prose. When the current
version's tree cannot be had, the skill says to report a partial delta as partial - the
carried manifest's hashes still identify every `copy` file exactly, and every `merge` and
`fill-from-repo` file is then unenumerated - rather than present half a delta as the whole.

Two neighbouring findings from the same round were re-run first and did not hold. A sham
update - bump the pin, copy the target's manifest, apply none of its files - is caught
today. Built on the 0.8.12 payload with 0.8.13's manifest and pin, the verifier of the day
reported `drift 0 - 100% adopted (49/49)`; the same sham built on the released-0.8.13
payload under today's manifest and verifier reports `drift 10 - 87% adopted (68/78)`,
naming the stale `SPEC.md` and the absent skill.
`tools/self-verify-drift-test.mjs` gains a twentieth case so it stays caught, and unlike the
existing one it builds the target manifest with `tools/manifest-hashes.mjs` from a real
newer tree instead of a hand-written hash - which is the only way the recorder and the
verifier are held to the same idea of what a file's content is. Recording a deviation as an
`exceptions` entry and reaching drift 0 also both work now (`drift 0 - 99% adopted (76/77),
1 excepted`), but only in the tree: no released version carries the code, and R18 leaves
that to the maintainer, so the suite keeps that one open.

### A fixed defect now reads as fixed - 76 observations re-verified against the live tree, not relabelled (2026-08-05)

The validation suite's own convention - "a fixed defect keeps its fail verdict and gains a
`fix` field rather than flipping to pass" - was itself the defect the owner named: the
punch list mixed real, currently-open bugs with ones already fixed, so `fail` stopped
meaning "broken today." Every observation in `runs/2026-08-03.json` and `runs/2026-08-04.json`
that read `fail` with a non-empty `fix` (76 of them) was actually re-run against the current,
fully-merged tree - live script executions (`spec-guard.mjs`, `self-verify.mjs`,
`cycle-guard.mjs`, `check-spec-clarified.sh`, `spec-structure.mjs`, `decision-records-check.mjs`,
`setup-plan.sh`/`setup-tasks.sh`, `pnpm import` against synthetic bun and yarn-berry lockfiles)
against synthetic fixtures reproducing each case's `given`, not a re-read of the citing PR.

74 held and flipped to `pass`, keeping their `fix` field as provenance. Two did not:

- **`DOC-01`** (`standard.manifest.json`'s `since` fields): the original mass-corruption bug
  (a version bump blindly stamping every entry) does not recur, but a fresh instance of the
  same class exists today - `scripts/lib`'s entry declares `since: "0.8.14"`, a version that
  does not exist yet (`VERSION` is still 0.8.13), inconsistent with the `"unreleased"`
  convention this same manifest uses correctly elsewhere.
- **`TRACK-10`** (a cycle-boundary split's stale-block check): the cited PR added the
  `split:<id>` status value to the template's vocabulary but never touched
  `cycle-guard.mjs`'s staleness check, which still only recognizes literal `status === "done"`.
  Live-reproduced the exact original failure - a finished-but-split intent's `blocked:` reference
  still reports as a live block, not stale.

Both stay `fail`, with corrected evidence explaining what the re-run actually found, rather
than being flipped to match the PR's claim.

`tools/validation.mjs` no longer treats `fail`+`fix` as "resolved" for display: the punch
list (`README.md`'s "The punch list" / `benchmark.md`) is filtered on the raw `verdict`
alone, with a fail that still carries a `fix` worded as "attempted, still open" rather than
"fixed". A new "Fixed and re-verified this round" section carries the 78 confirmed-fixed
observations (74 from this pass plus 4 pre-existing) separately, so the credibility claim
("N bugs found, M fixed, confirmed") stays visible without being mixed into the list of what
still needs attention. `--check` now also requires every observation to carry non-empty
`evidence`. `docs/facts.json`, `docs/validation/counts.json`, `README.md`, `benchmark.md` and
`backlog.md`'s `FIELD-1` row are regenerated/updated to the corrected counts (78 fixed across
18 merged pull requests, 84 still open, 2 of them an attempted fix that did not fully hold).

### Five spec-engine files carried no provenance marker, and nothing checked for one (2026-08-05)

`specs/spec-engine/spec.md`'s Provenance duty requires every file under `scripts/spec/` or a
`spec-*` skill to carry a line naming `github/spec-kit v0.13.2` or a `PATCHED(repository-standards)`
marker - but `setup-plan.sh`, `setup-tasks.sh`, `common.sh`, `check-prerequisites.sh` and
`tasks-template.md` carried neither, and no CI job or `tools/*-test.mjs` asserted the rule, so the
drift was silent. Each file's real provenance was read off its own git history rather than
templated - `setup-plan.sh` and `setup-tasks.sh` are upstream scripts patched this week with the
ADR-010 clarify-gate call; `common.sh` and `check-prerequisites.sh` carry older, smaller patches
from the ADR-014/ADR-015 extraction; `tasks-template.md` already carried two `PATCHED` markers but
none covering its wholesale "user story" -> "requirement slice" rename. The same sweep found
`spec-impact`, `spec-reconcile` and `spec-update` - standard-authored skills with no upstream
equivalent - carrying no marker either, and gave them one. `tools/provenance-check.mjs` is the new
mechanical check: it fails naming any spec-engine file that carries neither marker, wired into
`checks.yml` and `AGENTS.md`'s check list.

### The clarify gate's bridge precondition was prose, not code, and its policy doc did not exist (2026-08-05)

Three of the five layers `enforcement.md` and the silently-skipped-clarify case study
described as gating the self-triggering loop did not hold up:

- **The bridge precondition was aspirational.** `enforcement.md` described the clarify
  gate as wired via a "before_plan / before_tasks hook plus a bridge precondition", but
  neither `setup-plan.sh` nor `setup-tasks.sh` called `check-spec-clarified.sh` - only
  the skills' own prompts documented it, as a "MANDATORY PRECHECK" an agent could skip by
  never reading it. Both scripts now call the gate themselves on `FEATURE_SPEC` and exit
  1 on failure, re-checked on every run (including when `plan.md` already exists, since a
  spec can regain open markers after it was planned). `specs/spec-engine/spec.md` gets
  the new invariant, exit codes and acceptance criteria; `tools/clarify-gate-test.mjs`
  gets five new cases driving the real scripts from a copy of the shipped engine.
- **The policy doc did not exist.** `standard/specs/README.md` was cited by ADR-002,
  ADR-003, ADR-004, `docs/method/taxonomy.md`, the `align-to-standards` greenfield skill,
  this repo's own `specs/README.md` and the case study - never once created, so every
  citation either dead-linked or was quietly re-pointed at `docs/tree/specs.md` (a
  different document, written for people reading this repo's own tree, not for an
  adopting client). Written now: structure, spec depth, coupling and the loop layers,
  matching what those citations already assumed it said. The stale re-pointed links in
  `specs/README.md` and the case study now point at the real file.
- **"Hook" did not mean what it reads as.** `enforcement.md`'s own wording used "hook" for
  the skill-level MANDATORY PRECHECK - a workflow hook point, not this repo's `.claude/hooks/`
  mechanism (three shipped guards over specific risky Bash commands, unrelated to the spec
  loop). A `UserPromptSubmit` hook that nags on every prompt was considered and rejected: it
  cannot make the judgment call "does a skill cover this request", only the model can, and
  that job already belongs to loaded context (`AGENTS.md`'s "the loop runs itself" section,
  imported via `@AGENTS.md`). Reworded to name the two real layers precisely (the skill
  prompt's precheck, the scripts' bridge precondition) instead of a word that reads as a
  claim about a mechanism that was never built for this.

### A published validation suite - real cases, run against real repositories (2026-08-04)

The claim that this standard has been executed against real work, with failures published
alongside passes, previously lived only in prose (the testing logs, the findings ledger) -
none of it in the repo, none of it re-runnable, none of it guarded against drifting out of
step with what actually happened.

- **`docs/validation/`**: `suite.json` (174 cases), `targets.json` (105 assessed targets -
  103 real public repositories plus 2 synthetic fixtures) and `runs/` (176 observations
  across the 2026-08-03 and 2026-08-04 rounds). Every fixed failure names the merged pull
  request whose body was checked directly against the finding before the link was written;
  every still-open failure carries an explicit waiver rather than a silent gap.
- **`tools/validation.mjs`** renders `README.md` (headline numbers, coverage by area and by
  rule - including which carry zero cases - and the failures with their fix) and
  `benchmark.md` (the `portable: true` subset, framed for a reader who has never used this
  standard). `--check` fails on a stale render, an observation pointing at an unknown case
  or target, a case with no verdict at all, or a fail with neither a fix nor a waiver. Wired
  into `checks.yml` and `AGENTS.md`'s check list.
- Both pages state what this does not prove, in the reader's path rather than a footnote:
  assessment is not adoption (103 of 105 targets are depth **L1**, read-only); both fixtures
  share an author with the standard being tested; and agent-executed observations carry
  agent error, published together with this round's own disconfirmed hypotheses (a
  "maintenance mode" misread on two repos, a version-string red herring, the showcase
  repo's own unchecked outcome-block commit counts).
- Five headline numbers registered in `docs/facts.json` via a small generated
  `docs/validation/counts.json`, so a future hand-written restatement of any of them (in the
  front-door `README.md` or elsewhere) is checked against the real data rather than typed
  from memory.
- `backlog.md`'s `FIELD-1` and `EXHIBIT-1` updated to name what this now covers (a large L1
  read/dry-adoption evidence base) and what it still does not (a real L3/L4 adoption of a
  repo nobody on this project wrote - `FIELD-1`'s own gap, unchanged).

### A stack's own recorded deviation had nowhere that read it (2026-08-04)

`self-verify.mjs` folds a Layer 2 stack manifest's `files`, `sections` and `guards` into
the check it runs against the primary manifest - but never its `exceptions`, so a
deviation recorded in `stack.manifest.json`, exactly where the stack's own `ADAPTING.md`
tells an adopter to record it, had no effect. The miss kept counting as drift regardless.
Now merged along with the other three arrays.

### Four skill descriptions led with the mechanism, not the trigger (2026-08-04)

Blind-routing 20 realistic utterances against every skill's name+description produced
7 disagreements with the routing docs, always the same direction: the description
does not fire on the request that needs it. A prior pass had flagged `spec-update`,
`spec-tasks`, `spec-impact`, `add-to-backlog` and `timeline-update` as the worst five;
checked against the actual text, `add-to-backlog` and the first three held up and are
rewritten to quote a concrete trigger phrase instead of only naming the mechanism.
`timeline-update` already quoted four solid trigger phrases, so it is left alone;
`spec-clarify` is the substitute - its description carried zero quoted phrases at all,
purely procedural ("use right after a spec is drafted..."), which is a worse case
under the same test. `specs/spec-engine/spec.md` gets a new acceptance criterion
naming the fix (R11 coupling: these are spec-engine's own files).

### Six method docs were never delivered to an adopting repo (2026-08-04)

`docs/method/agent-work.md`, `dev-work.md`, `lead-work.md`, `product-work.md`,
`tracking-work.md` and `working-language.md` are adopter-normative (by reference,
ADR-023) but were absent from `standard.manifest.json`'s `references[]`, so
self-verify never counted them and an adopting repo had no pointer to them at all.
Added in the same shape as the existing fourteen. `docs/file-map.md` is regenerated to
match (also picking up an unrelated stale `docs/facts.example.json` entry that had
drifted from the manifest before this change).

### Removing a required skill or the unprompted-behaviour section changed no drift number (2026-08-04)

`self-verify` treated `.claude/skills` as a bare directory - present or absent, nothing
inside it checked - so deleting a required lifecycle skill (`spec-clarify` included)
left drift unchanged, and the `AGENTS.md` heading that makes the loop self-trigger had
no `sections` entry at all. The manifest's `.claude/skills` entry already carries a
`sha256` map naming every shipped skill (added for content verification); self-verify now
also checks each of those names exists inside the entry's resolved path (`path` or a
matching `altPath`), so a missing skill is its own FAIL, independent of the parent
directory's own PASS - one mechanism, not a second `contains` field alongside it. Two new
`sections` entries cover the unprompted-behaviour heading and the new volunteer
section. `tools/self-verify-fill-test.mjs` gained cases proving both are now drift, and
`specs/verify-engine/spec.md` documents the mechanism and its acceptance criteria.

### A bug mentioned in passing reached no skill and no row (2026-08-04)

Found by blind-routing realistic utterances against the skills' name+description
fields: "btw the export is broken" matched nothing, because no description mentions a
bug and `taxonomy.md`/`checklist.md` - the two "say this, get routed" docs - had no row
for it either. Both now name the case, routing to `add-to-backlog` by default (actively
fixing it right now is just the change, not a backlog item), and `add-to-backlog`'s own
description now quotes the same trigger phrase so the routing surface and the docs agree.

### Checking whether a skill fits never covered an ambiguous mention (2026-08-04)

`AGENTS.md`'s unprompted-behaviour section told the agent to check whether a skill
covers a request, but said nothing about what to do when a message mentions - in
passing, not as the ask - something that sounds like a bug, a decision, or scope creep
without clearly invoking one. A new "Volunteer, don't wait to be asked" section says to
name the candidate skill and ask, rather than silently doing the extra work or silently
filing nothing.

### CLAUDE.md pointed at the unprompted-behaviour rule instead of loading it (2026-08-04)

`enforcement.md` claimed the loop is gated by "loaded context" among other layers, but
`CLAUDE.md` only linked `AGENTS.md` as `[AGENTS.md](./AGENTS.md)` - a markdown link an
agent can leave unread, not something actually in context. It now imports the file with
`@AGENTS.md`, so the section that makes the loop self-triggering loads on every turn
instead of only when an agent happens to click through.

### A cycle-boundary split had no status value, and cold-start timelines promised a number ADR-029 forbids (2026-08-04)

Two gaps in the same neighborhood. `cycle-close`'s documented split - an item spans the
cycle boundary, part done, part returned - had no status value in the vocabulary
`_template.md` declares; adopters were reproduced inventing their own (`split -> IMPL-3`).
Added `split:<id>` to the template's status vocabulary, matching the existing `blocked:<id>`
shape, and told `cycle-close` to write it.

Separately, `timeline-update`'s cold-start branch said it would "project from sizes" and
"label the result an estimate" - which reads as a fabricated date, and directly contradicts
ADR-029 and `standard/docs/backlog.md`, both of which forbid ever converting a size letter
into a number. Reworded the skill (and the matching passage in `tracking-work.md` and
`docs-cycles.md`) to say precisely what a cold start is allowed to produce: a size-based
**shape** ("heavier than usual"), never a duration or a date. Both cold-start branches - sized
or not - now consistently give no date; the only difference is whether a shape comes with it.

### `cycle-open` and `cycle-close` assumed the backlog's primary path (2026-08-04)

`cycle-guard.mjs` already accepts either manifest path for the backlog file
(`docs/backlog.md` or `backlog.md`), but the two skills that move rows into and out of it
still hardcoded `docs/backlog.md`. Both now resolve the path the same way the guard does -
`docs/backlog.md` first, then `backlog.md` - as an explicit first step, rather than assuming
a repo that satisfies the manifest at its primary path has the file the skill went looking
for.

### A column prepended before `id` disarmed `cycle-guard` (2026-08-04)

Reproduced live: a table with a column added before `id` (a priority, a team) broke the
guard's hardcoded assumption that the id sits at column 0 - the row still had an id, just
not where the guard was looking, so it silently stopped counting. `cycle-guard.mjs` now
resolves the id column from the header row's `id` label instead of a fixed position,
falling back to column 0 for a table with no column named that. Added a case to
`tools/cycle-guard-test.mjs`, plus cases for the returned-to-pool check below.

### `cycle-guard` checked for too many places, never for zero (2026-08-04)

The one-place invariant has two directions and the guard only ever checked one: an intent
in two places fails, but an intent a closed cycle's outcome names as "returned to the pool"
that never actually lands in `docs/backlog.md` passed silently - reproduced live, guard said
`OK`. `cycle-guard.mjs` now reads each closed cycle's `## Outcome` block for a `Returned to
the pool: <ids>` line and fails naming the specific id and cycle file if any of them is not
in the backlog. The template and `cycle-close` now say to name the ids there, not only the
count, since the guard can only check what the block actually names.

### Four of the six things `tracking-work.md` promised had no owning skill (2026-08-04)

Reproduced against the real skills: the rendered 3-lane cycle board, moving an item's status
mid-cycle, and reassigning a holder mid-cycle had no skill behind them, though the page
claimed "each has a skill that owns it". `cycle-open` now also documents reading an open
cycle back as a board (a grouping of what the file already stores, no date attached) and
mid-flight edits (status moves, reassignment) as plain table edits followed by the guard -
both were previously left to inference. The fourth gap, "what did we write down during
onboarding that nobody picked up", turned out to be mostly a direct read rather than a
missing skill; `tracking-work.md` now says so and names the one honest limit (no per-row
`source` field, so "during onboarding" specifically can only be inferred from which epic a
row landed under).

### Every run in every adopted repo printed a path that does not exist there (2026-08-04)

`self-verify.mjs` ended its decisions line with "see docs/self-verify.md" - on every run, in
every adopted repo, where that file is not: the method docs are adopted by reference and the
page is `docs/method/self-verify.md` in the standard's repo. Third instance of that class of
bug, so the shipped tree was swept for the rest: the `jq`-missing denial in
`.claude/hooks/lib.sh` pointed at `docs/prerequisites.md`, `docs/facts.example.json` used the
same non-existent path as an example claim (a reader copying it gets a facts-check failure on
day one), and R16 in `SPEC.md` cited `docs/method/prerequisites.md` as though it were a file
in the reader's repo. All four now use the by-reference form the rest of the tree uses.

Also here: the placeholder scan now catches a table row whose cells are still ellipses - the
shipped `AGENTS.md` and `ARCHITECTURE.md` use that shape for "your rows go here", and a
showcase repo carried `| ... | ... |` in its own entry file with nothing saying so. A row of
*empty* cells is deliberately not flagged: an empty table is a legitimate state, and a warning
it cannot clear is one everybody learns to skip.

### A deleted script was still promised in two places (2026-08-04)

Two live surfaces still described `scripts/changelog.mjs` - the method page in detail, as
shipping with the tree, and the shipped `README.md` listed it among the guards - two months
after it went out with the per-PR fragments folder. Both now say what is true, and why the
script is not coming back: promoting one prose `## Unreleased` section is a copy, a heading
and a date, and a tool for that is a tool to keep in step for nothing. Found while giving
R18 and R25 their manifest projection, which is the check that now holds the discipline the
script used to be credited with.

### `self-verify` never looked at what a file contained (2026-08-04)

The drift number checked that a manifest entry **existed**. For a `copy` entry - shipped
verbatim, byte for byte - that was close to no check at all, and three testers reproduced
it independently on three trees: `drift 0 - 100% adopted` with 19 of the 20 skills and the
previous version's `SPEC.md` in place; the project's own showcase repo reporting
`49/49` while missing a whole skill and carrying 12 drifted skills; and, with the stack
layer carried, an entire pnpm supply-chain policy block deleted (`minimumReleaseAge`,
`saveExact`, `enablePrePostScripts` all gone) passing on the filename alone. Bumping the
recorded version and the manifest while changing no files reported compliant too.

Now: every `copy` entry carries a `sha256` in the manifest - a hash for a file, one per
member for a directory - generated by `tools/manifest-hashes.mjs` and asserted by
`tree-check`, so it cannot be hand-written or go stale; `self-verify` hashes the local file
and reports a difference as drift, worded so it reads as a content difference rather than a
missing file. It needs no network and no copy of the shipped tree, because the hashes travel
in the manifest the repo already carries. A `copy` file a repo deliberately changed is what
`exceptions` are for, and `.nvmrc` is now documented as the worked example. A `merge` entry,
which is adapted on purpose and so cannot be hashed, may declare `requiredKeys` - dotted
paths that must survive the merge, JSON and YAML, presence only - which is how the stack
layer asserts its three supply-chain keys.

Two related holes closed with it. An `altPath` was satisfied by any directory sitting at
that path: one monorepo symlinked `.claude/skills` at its own unrelated 31-skill system and
reported 100% adopted while carrying none of the standard's 20 procedures, so a ported
directory is now checked by name (bytes cannot be, by design - R22). And existence was
decided by `existsSync`, which is case-insensitive on macOS and Windows, so `readme.md`
passed on a contributor's Mac and failed on Linux CI from one commit; every check now reads
the directory listing.

### The exception hatch was unbounded, and excepting entries raised the score (2026-08-04)

Thirteen `kind: "file"` exceptions took a tree with no `AGENTS.md`, no personas, no
capability map and all five guard scripts deleted to
`self-verify: OK - drift 0 - 100% adopted (32/32), compliant with the standard`. Two
mechanisms combined: excepting a guard's **script file** disabled a live check, because a
guard whose script is absent is skipped; and an excepted entry left the denominator
entirely, so the percentage **rose** as the standard was discarded - 49 entries became 32.
The summary printed no exception count, and `docs/method/self-verify.md` never mentioned the
mechanism at all.

Now: a guard's own script cannot be excepted by `kind: "file"` (recording an edited guard
uses `kind: "content"`, which keeps the guard running), there is deliberately no `guard`
kind - the script's docstring advertised one that the guard loop never consulted, and the
claim is gone rather than implemented, because waiving a live check removes it instead of
recording a deviation from it - an exception with no `reason` is refused, and each refusal
is drift rather than a silently ignored line. An excepted entry stays in the adoption
denominator and does not count as adopted, so excepting can only lower the percentage; the
count prints in the summary line always, including zero; an exception the repo no longer
needs is reported as stale. The method page now documents the hatch, and **withdraws its
claim that comparing two repos' numbers is sound** - the denominator is each repo's own
manifest, version, profile, stack and exception list, so the comparison that holds is a repo
against itself over time.

A `content` match may end in `/**` to scope a subtree - a repo that rewrote a whole directory
of shipped procedures records one line rather than forty, and every member it waives is still
counted. Only `content`: a subtree waiver on presence would let `scripts/**` sweep away every
guard's required-file check, which is the hole the guard-script rule closes.

Also here: `self-verify`'s built-in fallback skeleton was announced in one dim line, so an
unaligned repo printed `drift 4-5` where the shipped manifest gives `13-15`, same format,
nothing to tell them apart (reproduced on three real repos). The warning and the verdict
line now both name the yardstick. `facts-check.mjs` compiled a fact's `home` pattern without
the multiline flag its `claims` patterns get, so `^Version: (...)` worked as a claim and
matched nothing as a home. And `docs/file-map.md`, stale on `main` since a purpose string
changed, is regenerated.

### Nothing authored the capability map, and the example described a rejected layout (2026-08-04)

Two gaps around the file the whole coupling mechanism reads. `capability-map` appears seven
times in the brownfield onboarding path and **zero** times in greenfield or the router
itself, so a new repo was left to discover a required file through a drift count - and
`spec-guard --audit` blocks the moment its first capability spec exists. Greenfield now
writes it during scaffolding, holding no capabilities and no `$unclaimed`: on an empty repo
both would be guesses, and the audit says on every run that the unclaimed check is off
rather than passing quietly. And none of the lifecycle skills touched the map at all, so a
capability minted by `spec-specify` was unmapped by construction. Two writers now, and only
two: `spec-specify` registers the capability when it mints the directory, `spec-reconcile`
reconciles the map before the pull request - the second is what catches a refactor, where the
old glob matches nothing and the new path is claimed by nobody.

The shipped example also explained the mechanism with a tree this project rejected -
root-level `**/payment/**` shapes, and prose about "app / service / shared" - while the paved
monorepo shape is `apps/*` and `packages/*` with `services/` explicitly turned down.
Rewritten to globs an adopter on the paved road would actually write, exercising the shapes
the fixed translator supports, with the `couples: "shape"` entry kept and a `$unclaimed`
starting list. A single-package repo writes `src/**/payment/**` and nothing else changes.

### Translating a heading switched the persona check off (2026-08-04)

`spec-structure` reads the persona roster from `docs/personas.md`'s `## The roster` section,
because the file also carries a worked example and a whole-file scan would let a spec
"serve" a name from it. When that heading was absent it fell back to exactly that whole-file
scan - so translating the heading widened the roster instead of narrowing it, and a spec that
failed the gate with an English roster passed with a translated one (proven against an
English control). Same principle as the clarify gate's headings: a required heading that is
absent is a failure, and the guard now says so and names the heading rather than checking
something else instead.

### The placeholder warning was both too loose and too tight (2026-08-04)

`self-verify` warns when a filled-at-adoption file still carries template placeholders. Its
pattern had the same shape as ordinary HTML, so `<picture>`, `<source>`, `<code>` and
`<kbd>` in a perfectly finished README tripped it - reproduced on four foreign repos, in
files the standard never wrote and an adopter cannot "fill". And it was ASCII-only, so
`<角色名>` and `<нужно заполнить>` were invisible: a translated but unfilled shell reached
drift 0 with a clean report. It is now the two shapes the templates actually ship, Unicode
aware, with single-word angle tokens that name an HTML element excluded by name.

### A spec's Status was decorative (2026-08-04)

No skill and no script read or wrote `**Status:**`, so `ready-to-develop` could sit on a
spec whose clarify gate fails - reproduced with all four guards green. Two documents promise
otherwise: ways of working says the status "cannot be typed in by someone who is impatient",
and working with specs says it flips to `live` when the work lands, while `spec-reconcile`
never mentioned it.

Both halves now exist. The structure lint - which CI already runs full-tree on every PR -
re-runs the real gate script on every spec claiming `ready-to-develop` or `live` and fails
the PR when the gate refuses it; a gate that cannot be run counts as unproven, not as
passed. And `spec-reconcile` owns writing the field, with the statuses spelled out, because
it is the step that establishes spec == code == tests.

It found four instances in this repo's own specs on the first run: four `live` capabilities
with no `## Clarifications` section, one of them missing `## Open questions` entirely, and
one whose open-questions section carried an upstream-sync note that belonged in Requirements.
The specs now carry an honest record of what settled them - they were retrofitted from the
shipped implementation, and that is what the section says.

### The normative page miscounted its own rules (2026-08-04)

`SPEC.md` said "Rules are numbered R1-R24" while defining R25 on the same page. This repo
built `facts-check` and `docs/facts.json` for exactly this class of drift, and cites
"twenty rules outlived the twenty-first by weeks" as the cautionary example in the shipped
conventions - the rule count itself was simply never declared as a fact. It is now, with
its home a count of the rule definitions in the tree, so the sentence cannot drift from the
page it describes again.

That needed a fourth home form: `countMatches` - how many times one file declares
something. `count` counts files and `match` captures a single occurrence, so a count of
what lives inside one file had no home and stayed hand-written, which is the one thing R4
exists to prevent.

### cycle-guard read zero rows and reported OK (2026-08-04)

The guard scopes its scan to a literal `## Intents` H2, which is right - a closed cycle's
`## Outcome` table names the same ids, and counting it reported correctly closed cycles as
duplicates. But scoping is also how the check switched itself off: a cycle file using
`### Intents`, `## Work`, or no heading at all yielded zero rows, and zero rows is
indistinguishable from a cycle with nothing wrong in it. A real pool-plus-cycle duplicate
was reported as `OK - each in exactly one`. Ids in backticks or bold were invisible for the
same reason - markup around an id read as a different string.

Both halves now fail closed: a cycle file with no `## Intents` heading is an error naming
the heading, as are rows under it whose first cell holds no id (the header row, the
underline and the template's blank row are not rows for this purpose), and `` `PAY-2` `` is
the same intent as `PAY-2`.

The folder manual documented a shape the guard cannot read - no heading, the id and title
in one cell, the status in the middle and a `Blocked by` column the guard never looks at -
so the page and the guard agreed on nothing. Rewritten to the real format, with the three
load-bearing parts named as the interface they are, and the test now runs the guard over
that page's own example rather than a copy of it.

### The clarify gate never read the template's own open-questions section (2026-08-04)

`## Open questions` is a required section of the shipped capability template, in free
prose, and the gate ignored it - so a spec could reach `ready-to-develop` with its open
items written exactly where the template says to write them. Four shapes were reproduced
passing: prose markers, a question phrased as a statement, a table of open items, and an
item answered under `## Clarifications` but still listed below. One of them is in this
repo's own committed fixture spec, whose backlog row says a decision blocks it while the
gate called it ready to develop.

The rule is structural rather than an attempt to read intent: **the section passes only
when it says there are none.** HTML comments and fenced blocks are stripped first, because
that is where the template's guidance lives, and any remaining visible line other than a
nothing-open statement ("None known.") is an open item. A missing or translated heading
fails the same way an absent one should - it is indistinguishable from nothing being open.
So each thing now has one home: an unresolved gap is a typed marker in the section it
affects, a settled note goes into the section it describes, and a known gap the repo will
not block on goes to the backlog with a link. `spec-specify` no longer records assumed
defaults there either - a default you took is an answer, and it belongs under
`## Clarifications`.

### A spec whose open markers were translated passed the clarify gate (2026-08-04)

The gate counted open items by grepping for one literal ASCII string, so a spec written in
another language whose author translated the marker along with the sentence around it
printed `ready-to-develop` with every gap still open - reproduced on a Chinese spec with
four unresolved items, one of them a missing decision. What made it likely rather than
unlucky is an asymmetry: the missing-`## Clarifications` failure names the exact English
string, so a team that hits that error reads translating the heading as the fix, and lands
in the silent pass.

The call, now written where a translating team will meet it (the working-language guide,
the shipped conventions table, the spec template, `spec-clarify`): the four marker forms
and the headings the gate reads are **syntax**, they stay ASCII in a spec in any language,
and the text *inside* a marker is prose that belongs in the spec's own language. The gate
enforces it instead of trusting it - a bracketed token shaped like a typed marker but not
one of the four (a translated family name, an invented type, non-ASCII included) fails,
naming the rule and where it is written down. Markdown links, checkboxes and footnotes are
not markers, which the new test asserts in both directions. The clarify gate had no test at
all until now, and it is the mechanism with the worst history here.

### The coupling guard could not match a capability at the top level (2026-08-04)

Both guards that read globs translated `**` into `.*` without consuming the slash
beside it, so `**/payment/**` compiled to a pattern that needed an extra directory in
front of `payment/`: it did not match `payment/index.ts` or `payment/x/y.ts`, and
`shared/**/payment*` did not match `shared/payment.ts`. Those two globs are the first
entries of the shipped `capability-map.example.json`, so an adopter who copied the
example and kept their capability's code at the top level got `spec-guard: OK` on a
money-path change that never touched the spec. It survived because the guard's own test
and this repo's map only ever used a trailing `**` - the one shape that worked. There is
now one translator (`scripts/lib/glob.mjs`) instead of two copies that had already
drifted in their internals, `**` matches zero segments as well as many, and the test
drives both broken shapes.

`--audit` could not have caught it either: it validated the map's keys and never asked
whether a glob matched anything. It now checks four things, because each of them is
silent - a capability spec with no map entry (as before), a map entry naming a capability
with no spec, a glob that matches no file at all, and code that belongs to no capability.
The last one is what survives a refactor, where the old glob matches nothing and the new
path is claimed by nobody; it is bounded by a declared `$unclaimed` list in the map, so
paths that intentionally belong to no capability are a recorded decision, and where no
such list exists the check reports that it is off instead of passing quietly. A retired
capability's deliberately empty globs stay exempt.

### `AGENTS.md`'s own "Checks before any PR" list had drifted from `checks.yml` (2026-08-04)

Found while reproducing the `pre-pr-review` gap below: this line names itself as "the
set CI runs" and warns that a check missing from it is a bug, yet `prose-check.mjs`
(+ `--self`), `self-verify-fill-test.mjs` and `site-behaviour.mjs` were all in
`checks.yml` and not listed here. Fixed independently on both sides of this merge -
`clarify-gate-test.mjs` also needed adding by the time they reconciled, since it landed
in `checks.yml` after this fix was first drafted - closing the same category of drift
`pre-pr-review` had, in the document that gap already cited as ground truth.

### Two of four documented backlog feeders wrote nothing (2026-08-04)

`docs/backlog.md`'s own "What feeds this backlog" names `spec-update` and
`spec-impact` alongside onboarding and `spec-reconcile` - but only the latter two
actually filed anything; neither `spec-impact/SKILL.md` nor `spec-update/SKILL.md`
mentioned the backlog at all, so an agent driving from either one filed nothing and
no guard noticed. Both now file via `add-to-backlog` when the analysis/diff surfaces
real work the current change will not address - `add-to-backlog`'s own "automatic
triggers" section grows from two to three to match. (`docs/method/tracking-work.md`
discusses the backlog only in general terms and does not itself name these two
skills - the reproduced gap traces to `backlog.md`'s text, not that page.)

### `Revisit when` had two writers and no reader (2026-08-04)

`adr-write` and `bdr-write` both write a `Revisit when` field; nothing read it back -
reproduced: a BDR named exactly the signal that should have reopened a later decision,
and only an agent's own unbroken context caught it, which a fresh agent or a later
date would not. `discovery-digest` is now the reader: new material is checked against
every `Revisit when` condition across the decision records (grep-able condition text
against each record's `Status`/`Revisit when` line, not semantic judgment), with hits
recorded in the dossier and carried into the readiness report. Stated plainly what it
catches (wording that shows up in the new material) and what it cannot (a true signal
never written down, or worded too differently to grep for).

### `CHANGELOG.md` was normative (R18/R25) but absent from the manifest entirely (2026-08-04)

Found alongside the decision-record numbering gap: the manifest had no `files` entry
for `CHANGELOG.md` and no `sections` entry for its `## Unreleased` heading, so an
adopting repo could reach self-verify drift 0 with no changelog at all - the general
case behind a defect an earlier round fixed only as one instance (a repo whose own
changelog had already drifted). `standard/CHANGELOG.md` now ships a minimal skeleton
(title, semver blurb, an empty `## Unreleased`), and the manifest carries both a
required `files` entry and a required `sections` entry checking for the heading -
verified against a simulated fresh adoption: present, self-verify passes it; removed,
self-verify reports it as drift. `backlog.md` accepts `docs/backlog.md` as an alternate
path; `CHANGELOG.md` now does the same for `docs/CHANGELOG.md`, and
`docs/tree/changelog-md.md` writes up what belongs in the file, what does not, and the
decisions (R4/R18/R25) behind the split.

### `spec-reconcile` never reconciled decision records (2026-08-04)

`AGENTS.md` places decision records above specs in its altitude order, but
`spec-reconcile`'s procedure only checked spec, code and tests against each
other - reproduced: a real supersession (one BDR superseding another) left five
stale citations to the superseded record plus a stale code comment, every guard
green. New step: for each spec in scope, check every ADR/BDR it names or links,
in the spec's prose and the capability's code comments, against that record's
current `Status`; a citation to a since-superseded record gets repointed and
the surrounding prose flagged for a human, never the decision text itself
rewritten. Grep-able and advisory, not a new mechanical gate.

### `pre-pr-review` did not run the gate CI actually blocks on (2026-08-04)

Step 3 named `spec-guard.mjs --audit` without `--block` and never named `--base`
at all - reproduced: everything the step listed came back green while CI, which
runs `--base origin/main --block` and `--audit --block`, went red on the same
branch. The step now names both invocations with their flags, and notes that
core profile's shipped workflow only blocks on the audit - run both with
`--block` locally anyway, since a local run stricter than CI costs a moment and
a local run looser than CI costs a red PR.

### Record numbering had no source of truth (2026-08-04)

Following `bdr-write`'s numbering step literally minted a second `BDR-004`, and an
Accepted `BDR-004` was separately found missing from `bdr/README.md`'s own index -
both at self-verify drift 0, because nothing cross-checked the index against the files
on disk. `adr-write`/`bdr-write` now find the next free number by reading the
directory, never the README row count or a remembered count, and re-check immediately
before committing (a stale `main` is still a real collision window - the one this
project has already hit). New guard `scripts/decision-records-check.mjs`, wired into
self-verify and this repo's own checks, fails on a duplicate id, a file with no index
row, or an index row with no file - layout-agnostic across the shipped `adr/` + `bdr/`
split and this repo's own flat `docs/decision-records/`.

### An idea had nowhere to land (2026-08-03)

`adr-write` and `bdr-write` both named `docs/ideas/` as where a not-yet-decided
speculation belongs and pointed away from themselves toward it - neither, nor any of
the other 18 skills, ever wrote to it. New skill `idea-write` closes the loop: captures
the idea end-to-end (including its provisional technical/business shape) without
minting a record, and drives it through `idea -> exploring -> approved | parked |
dropped -> graduated`, handing off to a real backlog intent, spec and records on
approval. R14 now names `graduated` alongside the other statuses, matching what the
template already used.

### spec-plan, spec-tasks and spec-implement could silently act on a stale feature (2026-08-03)

`check-prerequisites.sh` resolves the active feature from a persisted `specs/feature.json`
pointer or an env var, never from what the user actually asked to plan/task/build - found
during the promised-prompt audit: "plan X" while the pointer still named a different
capability from an earlier session would silently operate on the wrong spec, no mismatch
warning. All three skills now say to confirm the resolved feature matches what was asked
before proceeding - `spec-implement`'s case is the highest-stakes since it writes code.

### Five smaller gaps found by wave 5's repo sampling (2026-08-03)

The lifecycle-signal check missed a repo that migrated to another forge entirely
(`archived: false` but the description says "Moved to Codeberg") - un-shallowing the
clone can't recover a growing edge that stopped existing here, so the signal list now
also reads for a move/mirror statement. The no-AI-agents red-flag stop was binary
(forbidden -> halt); a real policy conditionally allows agent involvement if a human
authors every contribution artifact - now a documented middle case, not silently
treated as either a full ban or full permission. The archetype-mismatch guidance
assumed a package/crate boundary to inherit from; a single-package micro-library (one
header, one build target) has none but can still have real internal capability
structure one level down. The decision catalog's licensing row had no language for an
open-core repo split by directory into two licenses, where a capability's code can
straddle the boundary. `CHANGELOG.md`/backlog/AGENTS.md entries all still called out
19 shipped skills after `idea-write` made it 20.

### SPEC.md itself never said Layer 1's guards need a Node runtime (2026-08-03)

The Node-runtime cost was disclosed in `align-to-standards/SKILL.md`'s conversational
prose (0.8.13) but never in the normative spec text an agent actually reads R16 from.
Found independently by three of four repos assessed against uncovered languages
(Swift, Elixir, C#) in the same testing round. R16 now states it directly: the shipped
guards are dependency-free Node scripts regardless of the repo's own stack, and that is
a real cost for a non-Node repo, not a rounding error.

### A capability's code could be deleted without ever touching its spec (2026-08-03)

`spec-guard.mjs` scanned diffs with `--diff-filter=ACMR`, which excludes deleted files -
so a PR removing 100% of a capability's implementation passed with `spec-guard: OK` and
R11 never fired on the one PR that most needed it. Reproduced against a real capability
deletion before and after the fix. `D` is now in the filter. Paired with two gaps this
exposed: the spec template had no terminal `Status` for a capability that stops being
built (added `retired`, with the convention - flip status, link the retiring BDR, leave
the now-pointless `capability-map.json` entry alone so `--audit` does not misread the
spec directory as an unmapped orphan), and the backlog template had no escape hatch for
an item whose target retired before its definition of done could ever be met.

### Two sources landing in the same handover were only diffed against the dossier, not each other (2026-08-03)

`discovery-digest` diffs a new entry against every earlier one, which works when two
contradicting sources arrive in separate sessions - the first becomes "earlier" the
moment it is filed. It never said what to do when both are pasted into the same
handover, which could silently skip the cross-diff that is exactly the scenario this
step exists to catch. Now explicit: each source is still its own dated entry, filed and
diffed in order, including against entries the same handover just added.

### The tracker list, and one onboarding path's paragraph link, went stale (2026-08-03)

R15 and the align-to-standards tracker questions named three trackers by brand (GitHub
Issues, Jira, Linear); GitLab Issues and mailing-list-plus-Bugzilla workflows are real
and were outside that list - confirmed independently against two repos in the same
testing round. Reworded open-ended. Separately, `AGENTS.md`'s own adoption paragraph
linked `docs/method/self-verify.md` under the visible text
`standard/docs/self-verify.md` - a path that does not exist - fixed to match the real
target.

### The clarify gate could be satisfied by a spec whose open items were never in bracket form (2026-08-03)

`check-spec-clarified.sh` only ever counted the literal string `[NEEDS `. A spec
recording its open gaps as a numbered list in the marker family's own names -
`- **CLARIFICATION-1 (owner: ...).**` - without the brackets was invisible to it:
adding an empty `## Clarifications` heading flipped the gate from FAIL to PASS with
every real question still open. Reproduced independently by two separate test passes
against the same real fixture. The gate now also catches that specific unbracketed
shape and fails on it, naming what to rewrite.

### A recorded manifest exception had no mechanical effect (2026-08-03)

R17 and `align-to-standards` both describe recording a deliberate deviation as a
manifest `exceptions` entry so an update never silently overwrites it - but
`self-verify.mjs` never read the `exceptions` array at all, so a repo that had honestly
recorded why a required file or section does not apply still failed it, forever.
`self-verify.mjs` now checks each required `files`/`sections` failure against
`exceptions` first and reports it as excepted rather than drift.

### Three smaller gaps between what the docs promised and what fires (2026-08-03)

`docs/method/taxonomy.md` and `checklist.md` - the two files whose entire content is
"say this and the agent routes it" - were never linked from the shipped `AGENTS.md`/
`conventions.md` template, unlike every neighboring method doc. `checklist.md`'s two
onboarding-flow example prompts now say so explicitly, and its third ("record the fork
as open, with who unblocks it") now names `add-to-backlog`, not an implied `adr-write`
call for a decision nobody made yet. `prerequisites.md`'s guard enumeration was missing
`cycle-guard.mjs`, and its gitleaks trade-off claimed local pre-commit scanning is lost
without it - no pre-commit hook actually ships with the tree yet, so nothing is lost
either way; corrected to say so plainly rather than describe a mechanism that does not
exist. `timeline-update` never said whether its three-closed-cycles threshold is
per-team or global - now explicit: per team, never blended.

## 0.8.13 - 2026-08-03

Ten fixes found by acting as an adopting user/agent through the greenfield and
brownfield flows on eighteen real repositories (own test repos, and eighteen public
ones spanning Rust, Go, C, PHP, Python, Ruby, Java/Kotlin and Node/TS - flagship,
mid-size, small, and deliberately weak or abandoned) and by walking the discovery-to-
spec loop and the work-cycles loop end to end, re-verifying each fix concretely rather
than trusting it re-read correctly.

### The clarify gate could be walked past by following the template's own wording (2026-08-03)

`capability-spec.template.md`'s Open Questions comment named the open-marker family -
CLARIFICATION, DECISION, INPUT, ASSET - by bare word only, never showing the literal
`[NEEDS TYPE: ...]` bracket form `check-spec-clarified.sh` greps for. A spec written to
the letter of that comment passed the gate with every question still open. The comment
now spells out the exact bracket form.

### The node stack's starter pointed at a DECISIONS.md that composition strips away (2026-08-03)

The greenfield composition rule degits the node starter into a target repo's root
first, so six real occurrences of `../DECISIONS.md` / `../../DECISIONS.md` - the
README, the Docker test-stack comment, vitest config, Next config, the Fastify server
and env config - resolved outside the composed repo entirely. Now absolute links into
`repository-standards/node`, with anchors. Caught a stale copy-paste alongside it:
`config.ts` cited decision #5 (Fastify) for what is actually decision #6 (env config).

### Manifest `since` fields, and the same-day discovery that the first fix was wrong (2026-08-03)

Every past version bump did a blind string replace across `standard.manifest.json`,
corrupting any entry's `since` whenever it happened to equal the version being bumped
from. Reconstructed from real git history - twice: the first reconstruction used
`git log --follow --reverse`, which silently returns one commit instead of the full
rename-aware history on this git version: it stamped one arbitrary commit's version
across most of the `files` array, overwriting values that were already correct. Caught
during self-review before either fix shipped past a single PR; the second, correct
pass covered the `guards` and `references` arrays too, which the first attempt never
touched and which carried the original corruption untouched.

### Five places a doc and the mechanism checking it silently disagreed (2026-08-03)

`docs/prerequisites.md` was named twice as if it ships to the target repo; it never
does. The no-stack offer said Layer 1 is "unaffected" for a non-Node repo, true for
rules and specs, false for the guards (Node scripts, a real cost regardless of the
repo's language). `docs/facts.example.json`'s purpose text said to copy it into
`docs/facts.json` and keep its placeholder content, which fails `facts-check` on the
example's own paths. `.github/workflows/spec-guard.yml` read as a mandate to use
GitHub Actions specifically - confirmed on two large real repos that neither does. And
two `references` manifest entries were missing `id`/`since`/`rule` that every sibling
carries.

### Five escape hatches the standard was missing for real repo shapes (2026-08-03)

An open-question marker now lives in exactly one place, not optionally echoed in both
its functional section and Open Questions. A persona roster of one is a named
legitimate answer, mirroring the decision catalog's existing "does not apply"
allowance. An existing package/crate boundary can serve directly as a capability map.
The churn-hotspot assessment pass now says so when a shallow clone makes it
categorically unrunnable. A repo whose own goal is to stay frozen or deprecated is a
legitimate intake answer. New decision-catalog category: numerical/semantic
compatibility policy, for a library whose contract is computed output.

### `cycle-guard` read a correctly-closed cycle's own close table as duplicate intents (2026-08-03)

`cycle-close`'s documented output is a close table under `## Outcome` reusing the same
intent ids on purpose, so it can be screenshotted into a channel. `cycle-guard.mjs`
scanned the whole file for id-shaped table rows with no notion of section, so that
table looked like a second copy of every intent it names - a cycle closed exactly as
documented reported the "copied, not moved" failure the guard exists to catch. Scoped
cycle-file row matching to the `## Intents` section, the same fix `spec-structure.mjs`
already applies to the persona roster, for the same reason.

### Intake now reads a repo's own lifecycle signal before asking for it (2026-08-03)

Four separate repos assessed this round - a neglected small tool, an archived library,
a defunct product's SDK, a well-resourced org's deliberately-sunset repo - all had
their lifecycle stated in their own README or CONTRIBUTING already; the intake round
would have asked anyway. Step 1 now reads for the signal before step 2 asks anything,
and leads with confirming a strong signal instead of interviewing past it. A repo's own
explicit no-AI-agents policy (found verbatim in a tested repo's `AI_POLICY.md`) is now
a red-flag stop, same tier as a committed secret. Fixed a counting error caught during
self-review (the previous "fifth answer" was actually the sixth) and a real doc-vs-doc
drift in `adoption.md`'s Gate 0, which still listed four intents after `SKILL.md` grew
a fifth.

### The technology step accounts for archetype and multi-stack repos (2026-08-03)

A registered stack targets an application archetype; offering it wholesale to a
66-package library monorepo, or detecting only a root manifest in a repo that actually
runs three permanently-coexisting stacks, both misfire. The technology step now names
the archetype mismatch and offers the pieces that transfer, and names every stack a
repo actually has. `security-baseline.md` gets a "negative scope" axis - what a repo
deliberately does not treat as a vulnerability, and why - the one axis a tested repo's
otherwise mature security process had no catalog row for.

### R18 and R25 directly contradicted each other, and the contradiction was live (2026-08-03)

R18: a PR must not bump the version, the maintainer cuts every release from
`CHANGELOG.md`'s `## Unreleased` heading. R25, as written: a PR that changes what the
standard ships must move the version. Both governed the same subject and could not
both be followed. The practical damage was real: this changelog has no entries between
0.8.0 and 0.8.12 - twelve version bumps with no record, and `scripts/changelog.mjs`,
described in detail in `docs/method/changelog-process.md` as shipping with the tree,
does not exist anywhere in it. R25 now describes what the *release* does, not the PR;
the missing script and the unrecorded twelve versions are logged, not fixed here -
they're a backfill/tooling task, not a wording fix.

## No entries were written for 0.9.0, 0.9.1 and 0.8.2 - 0.8.12 (recorded 2026-08-06)

Thirteen commits moved `VERSION` between the 0.8.0 release below and the 0.8.13 release above,
and not one of them wrote an entry here. Nothing is being backfilled: this heading is the
record of the gap, and the pointer to where the truth actually lives.

What `git log -p -- VERSION` shows, and it is worth reading before trusting the note in the
0.8.13 section:

- The versions that existed, in the order the file held them: 0.9.0, 0.9.1, 0.8.2, 0.8.3,
  0.8.4, 0.8.5, 0.8.6, 0.8.7, 0.8.8, 0.8.9, 0.8.10, 0.8.11, 0.8.12. Thirteen bumps, every
  one of them on 2026-08-03.
- `VERSION` never held **0.8.1**. Two ordinary pull requests came out as 0.9.0 and 0.9.1
  because R25, on the day it was added, matched its own trigger; `a82c470` walked the number
  back and wrote 0.8.2 directly, since that is where the second of those two PRs lands from
  0.8.0. That message names 0.8.1 as the number the first of the two should have carried, and
  that is the whole of its existence: no commit ever wrote 0.8.1 into `VERSION`.
- The unrecorded span is `07ad235..4b1179d`: **32 commits**. Exactly one of them touched this
  file at all - `4e038e5`, which rewrote the organization name inside older entries and added
  nothing.

So the note under 0.8.13 is wrong in both directions. It says "twelve version bumps with no
record" and names 0.8.1 through 0.8.12: that counts a version the file never held and misses
the two it did hold. The released section is left exactly as it was cut - a release is
history, not a draft - and this is the correction to it.

**Nothing here is reconstructed, on purpose.** Twelve of the thirteen bumps are a single
commit each, so twelve entries could be copied from twelve commit subjects. The thirteenth
cannot: 0.9.0 arrived twenty commits after 0.8.0, and deciding which of those nineteen
unversioned commits belonged to which release would be a guess, written in the one file whose
entire job is to be checkable. A gap that says so, with the range to read, is worth more than
a tidy history nobody can source. The range is `git log --oneline 07ad235..4b1179d`.

This exact failure cannot repeat: `tools/tree-check.mjs` now fails when `VERSION` names a
version with no matching heading in this file, so a bump that promoted nothing stops at the
gate instead of shipping unnoticed.

## 0.8.0 - 2026-08-02

The first stable line. The simplification wave - the standard put on one page, in
one tree, with one engine copy - plus everything since 0.7.2: the lifecycle, the
guided loop, the align engine, Layer 2 and the product spine.

### Folder READMEs: the ones that teach stay, the ones that restate are gone (2026-08-02)

Five README files in the shipped tree explained what belongs in `.claude/`, `.claude/skills/`,
`.claude/hooks/`, `.github/` and `.github/workflows/`. Nothing in the tree linked to any of
them, and most of what they said was already a numbered rule stated elsewhere:
`.github/workflows/README.md` restated R21 (exact pins, never a floating tag), `.claude/README.md`
restated R22 (a partial port to another agent is drift, not a variant), and `.github/README.md`
restated what `AGENTS.md` already says about the workflows being live the moment they land. A
second copy of a rule is a second thing to keep true.

All five are deleted. Two facts lived **only** there, and those moved to a file something
actually reads:

- **How a skill's `description` is written** - it names the situation a user would type, never
  the artifact the skill produces, because it is the only text a request is matched against -
  is now in `AGENTS.md`, right after the sentence that already said a skill failing to fire is
  a bug in its description. It said what to fix without saying how.
- **Agent guards fail closed, and a broken guard is silent** - it prints only when it refuses,
  so it stops protecting and nothing says so, which is why `scripts/verifyAgentGuards.sh` runs
  after any change under `.claude/hooks/` - is now a section of `docs/conventions.md`, the
  canonical conventions block that merges into `AGENTS.md` at adoption. Outside the script's
  own header comment, `verifyAgentGuards.sh` was named in exactly two places in the shipped
  tree: one cell of a table in `README.md`, and the README being deleted. "Fail closed" was
  named in one.

The READMEs that are folder *manuals* rather than folder *labels* stay - specs, decision
records, cycles, ideas, runbooks, research, journeys, discovery - and each is now a manifest
entry in its own right, so it shows up in the file map and `self-verify` notices when one goes
missing. Previously only the folder was an entry, so deleting a manual left the folder present
and drift at 0. `docs/discovery/README.md` is also the only file holding that folder open in a
fresh clone, which the map now says out loud.

### A placement audit that mostly found nothing, and the one note it left (2026-08-02)

A second pass over the whole repo for misplaced files, wrong locations and broken references.
Worth recording that it came back nearly empty, because "we looked and it was fine" is a
result and gets forgotten otherwise.

- **`tree-check` already verifies every by-reference path resolves** - and picked the count up
  from 9 to 12 on its own after today's move. The hole suspected here did not exist.
- **No shipped file links outside the tree.** Checked by resolving every relative link against
  the filesystem rather than by pattern - a link like `../../../docs/cycles/` from a skill
  resolves *inside* the tree and is correct for an adopter too, which a grep would have
  mis-flagged. This class matters because `link-check` runs against **this** repo, where a link
  escaping the tree still resolves; it would pass while being broken for everyone else.
- **Tree and manifest cover each other in both directions**, mechanically, already.
- **The one note left behind:** `docs/method/` is now broader than its name - it holds tool
  reference and a decision menu alongside the method. Its README says so, and says explicitly
  that **renaming it is not worth doing**: every by-reference link in every adopted repo names
  that path and resolves at `main` by design, so a rename breaks all of them at once, in repos
  we cannot see, to fix a word. Written down so nobody tidies it later.
- The three moved documents joined the method index, which had not listed them.

### The pinning language was hiding in the two files an agent loads first (2026-08-02)

A sweep of the whole shipped tree for anything that is really *ours* rather than the
adopter's - after three of our documents were moved out of their `docs/`.

- **The tree is now clean of the mixing.** Every remaining `copy`-class entry is functional -
  guards, hooks, the engine runtime, config - or the spec page itself. Nothing left in the
  shipped `docs/` is documentation about the standard.
- **Four more places still said "pinned version"**, on the third sweep of the day, and two of
  them were `CLAUDE.md` and `AGENTS.md` - the files an agent loads *before anything else*. The
  others were the manifest's own `$about` and a usage comment in `self-verify.mjs`.
- Worth naming as a pattern rather than four more fixes: **a term sweep finds prose and misses
  the places that are not prose** - a JSON description field, a comment in a script, a template's
  opening line. The derived file map found some of these; grep found the rest only when the
  search was widened past markdown.
- **`SPEC.md` stays copied deliberately** - it is the one document about the standard that an
  adopter keeps, and the reason survives scrutiny: it is what the manifest projects, so a repo's
  local copy states the rules it was actually checked against. Snapshotting it *with* the
  manifest is the bookmark semantics working, not an exception to them.

### The shipped tree stopped mixing our documentation with the adopter's (2026-08-02)

Two calls from the owner, both on the same fault line: **what belongs to the adopter and what
belongs to the standard were living in one folder, with no visible boundary.**

- **`changes/` is gone.** The per-PR fragments folder existed to stop parallel pull requests
  colliding on the changelog. The owner's verdict: a change already goes to a concrete place,
  and a second place for describing it is a divergence. On inspection the case was weaker than
  the cost - a changelog conflict resolves in seconds by keeping both lines, while the folder
  cost a convention on every PR, frontmatter, an assembly step and a script. **Nothing enforced
  it**, and the entry was `required` at scale while the *practice* was unchecked: a team could
  be compliant and get no benefit. `scripts/changelog.mjs` went with it. **R18 now has one path
  at every profile** - describe the change under `## Unreleased`.
  [ADR-018](docs/decision-records/ADR-018-history-lives-in-the-changelog.md) keeps its text and
  carries the revision in its status; its decision (one accumulating history, no change-log
  sections in living documents) is untouched.
- **Three of our own documents left the adopter's `docs/`.** `self-verify.md`,
  `prerequisites.md` and `security-baseline.md` were `copy`-class - shipped into the folder
  where a repo keeps *its* product knowledge, so half of it was theirs and half ours with
  nothing marking the line, and an update overwrote one half silently. They are the standard
  describing itself, which is what `docs/method/` already is, so they became
  **references**: read at their home, always latest, never copied. The precedent was already
  there - `security-baseline.md` says outright it is *a menu, answered in your own ADR*, which
  is exactly what `checklist.md` is and how it is already treated.
- **Their internal links became plain paths.** A by-reference document naming `.nvmrc` or
  `scripts/` means *the reader's*, so a link pointing at our copy was wrong in both directions.
- **`analytics.template.md` followed neither convention the tree already has** - shells are named
  plainly (`PRODUCT.md`), real templates are `_template.md` inside the folder they serve. It is
  a shell; it is now `analytics.md`.
- The shipped `docs/` now holds **only** what the adopter authors, plus one config shape and one
  merge-class conventions file. The file map dropped from 52 entries to 47 and gained three
  references.

### The rendered docs are invisible to agents, and the map was two hops away (2026-08-02)

Asked where this should be explained so that AI agents actually reach it. The answer is
checkable and it constrains the previous entry.

- **`site/docs/` is gitignored.** The rendered documentation does not exist in a clone, so an
  agent working in a repository never sees it. "Explain it more thoroughly in the docs" is safe
  only when *docs* means markdown in the repo; if it means the website, agents get nothing.
- **`AGENTS.md` now links the file map directly**, not only through the docs hub. Two hops is
  one too many for the file whose whole job is orienting someone who is lost - and the link
  states the boundary in place: the map answers *what is this and why*, never *what do I put
  here*.
- **A folder `README.md` needs no pointer at all**, which is the strongest argument for keeping
  it: an agent working inside a directory has it without searching. That is the cheapest context
  there is.
- **`MAP-1`**: an adopted repo gets no map. Its folders, its orientation problem and its own
  manifest exceptions are all the same, and the generator is zone 1 only because that is where
  it happened to be written. Shipping it means a freshness check counted as drift - a map that
  silently describes last month's repo is worse than none - and that grows the guard list for
  every adopter. Recorded as a decision rather than taken quietly at the end of a long session.

### Every file explains itself, and the map is generated (2026-08-02)

Asked whether each folder and file should be described individually, and whether that belongs in
the docs or in per-folder files - the owner's own read being that two places sounds redundant.

**Two questions were wearing one name**, and splitting them removes the redundancy rather than
tolerating it.

- **Orientation - *what is this and why*** - is now [`docs/file-map.md`](docs/file-map.md),
  **generated** from `standard.manifest.json` by `tools/file-map.mjs`. Every shipped path with
  its purpose, whether it is required and at which profile, how it lands when you align, and a
  link to the numbered rule that made it so. It cannot disagree with what `self-verify` checks,
  because it is the same data; `--check` fails CI on a stale copy.
- **The local rule - *does my new file belong here*** - stays in the folder's own `README.md`,
  short, and must not restate the map. It is needed at the moment someone is adding a file,
  which is when they are in the folder and not on a docs site.
- **The tree was not holding its own convention.** `taxonomy.md` says every folder explains
  itself; `.claude/`, `.claude/skills/`, `.claude/hooks/`, `.github/` and `.github/workflows/`
  had nothing. Written, each carrying only what a map cannot: hooks fail **closed** and are
  silent when broken, skills are matched on a description that must name a situation no other
  names, workflows pin exact SHAs because a mutable reference is a supply-chain problem rather
  than a style choice.
- **Generating the map immediately found four manifest purposes still carrying pinning
  language** - missed by the same day's sweep of the prose. An argument for the derived view,
  and a warning: the manifest is now text people read, not only data a script parses.
- [`folder-readmes`](docs/open-questions/folder-readmes.md) revised with the split, including
  the doubt that survives: **nothing checks that a folder README stays in its lane.** A future
  author explaining *what a folder is* there recreates the duplication, and a guard would have
  to judge what a paragraph is about.

  *(Correction, same day: this bullet was true of the intent and false of the repository - the
  revision did not land. A failed assertion in the script that wrote three files stopped after
  the first, two were re-run and this one was not, and the entry shipped claiming a change
  nobody had made. Written the next commit, and the miss left visible: a changelog that quietly
  fixes its own false claims is worth less than one that does not, and this project asks
  adopters to trust exactly that record.)*

### The landing showed agent sentences as shell commands (2026-08-02)

Both found by the owner asking whether a line on the landing was real.

- **It was not.** `$ scaffold from repository-standards` carries a shell prompt and is not a
  command - there is no `scaffold` binary. Nor is `$ assess -> align -> onboard`, which is a
  list of phases. Someone who typed either into a terminal got `command not found`.
- **The same page already had the right convention** twenty lines down: the terminal block uses
  `>` for what you say to the agent and `$` only for `node scripts/self-verify.mjs`. The
  marketing cards used the wrong one. Corrected to match, and the update card **still carried
  `@next`** - missed in the same day's pinning sweep.
- For the record, since it was asked: neither `@latest` nor `+ node` is real syntax. There is no
  version to name, and the technology is something the intake **asks about** - or you say it in
  words.

### The docs were behind what shipped the same day (2026-08-02)

The FAQ still answered the tracker question as though ADR-010 were the whole picture: *the repo
holds intents, the tracker holds execution state.* That was true this morning.

By the afternoon the repo had work cycles per team, the person currently holding each item,
blocking references and a timeline projecting from measured throughput - which makes **in-repo a
complete third posture**, not an aspiration. The answer now names all three (tracker-bridged,
in-repo, both) and states plainly what in-repo does **not** give you: previous holders, per
person throughput, burndown, time tracking. Those are a tracker's job, and saying so is better
than letting a reader discover the gap.

Worth recording as a pattern rather than a one-off: **the surfaces lag the decisions by hours,
and nothing checks that.** Guards compare code to specs and facts to their sources; nothing
compares a FAQ answer to an ADR accepted after it was written.

### The messaging had no pillar for the thing nobody else does (2026-08-02)

Sharpening the positioning after the landscape check found something better hidden than a
wrong claim: **decision records did not appear in the messaging at all.** ADRs and BDRs are one
of the four things that distinguish this from the spec-driven-development field, and across the
one-liner, the positioning statement and three pillars they showed up once, as an item in a
list.

- **"The why survives" is now pillar 2**, and it is stated as the one the field does not have:
  every technical and business decision recorded where the code is, so the next person - or the
  next agent - inherits the reasoning instead of re-litigating it. It is also the pillar that
  pays back latest, which is exactly why it goes unsaid.
- **The "Unlike" clause landed on the wrong thing.** It used to end on the brownfield
  transition. That is a strength and it is no longer a differentiator, so the clause now lands
  on what actually differs, and the file says outright: *say what the walk ends at, never that
  the walk itself is unusual.*
- **"point a repo at a version and it aligns" is gone** from the positioning statement - the
  last piece of pinning language, in the one file every surface is supposed to quote.
- The README gained the same four-things paragraph, including the sentence that a spec workflow
  is better served elsewhere. Naming a competitor as the better answer for a job we do not do
  costs nothing and buys the reader's trust for the parts we do.
- The one-liner is unchanged, so the landing needed no edit - `site-check` asserts it verbatim
  and still passes.

### The update channel watches releases; the standard lives on main (2026-08-02)

- **The mismatch, recorded rather than patched.** ADR-025 named the channel and the watch
  workflow is built and shipped - but it compares `.standards-version` against
  `releases/latest`, while the same decision says the target is always latest and `main` **is**
  the living standard. Between two tags `main` moves, sometimes a great deal, and no adopter is
  told anything. The notification answers "has a milestone been cut" when the design implies
  "has the thing I true up to changed".
- **Watching `main` instead is worse**, which is why this is a question and not a fix: it would
  fire on a reworded FAQ, and a channel nobody reads is the same failure as a gate that fires
  when nothing is wrong.
- Five options are laid out in [`staying-current`](docs/open-questions/staying-current.md),
  including the owner's own framing - **drop the channel and re-run alignment on a cadence**,
  since adoption was never meant to be work-done. What settles it is `FIELD-1`: an adopter who
  is not us, running behind, and what they actually missed.
- The shipped watch **also still said "pins"** - missed in the same day's sweep. Corrected, and
  the known gap is now a comment in the workflow rather than a surprise for whoever reads it
  next.

### Layer 2 ships data and no procedures, and has never once run (2026-08-02)

Asked whether the two-layer offer is explained and whether it has been tested. The first
answer is yes; the second is no, in a stronger sense than expected.

- **The offer is made properly.** The router's intake asks technology and Layer 2 consent
  outright, but looks the technology up in `stacks.json` *first* and then says the true thing -
  a registered stack gets offered, a miss is called a miss with a consent-gated upstream
  request. There is also a route for a repo that aligned to Layer 1 earlier and wants a stack
  added later.
- **The asymmetry nobody decided:** Layer 1 ships 19 lifecycle skills; a stack ships four data
  files - `stack.manifest.json`, `DECISIONS.md`, `starter/`, `ADAPTING.md` - and no procedures.
  Adoption is covered, thinly (`stack.md` is 41 lines against the core router's 313). A
  technology's **recurring** work is covered by nothing: adding a dependency under R21's
  pin-plus-cooldown rule, a framework major, a new test tier, a migration.
- **The mechanism for stack skills already exists and is unnamed.** `stack.manifest.json` is
  the core manifest's schema plus two fields, and the core ships `.claude/skills` as an ordinary
  `files[]` entry - so a stack can ship procedures today with no code change. A mechanism that
  works by accident is one the second stack will use differently.
- **Nothing has run.** `STACK-ALIGN-1` is still `todo`, so the Layer 2 path has never executed
  on any repo in either direction. Every question here is currently answered from the armchair,
  which is why the new item is **blocked on running it once** rather than on writing skills
  first - the lifecycle should fall out of what actually recurs.

Recorded as [`stack-lifecycle-skills`](docs/open-questions/stack-lifecycle-skills.md) and
`STACK-LIFE-1`, with the four questions that need answers: ship-vs-stay against ADR-009, how two
skill families stay discriminable in one namespace, who owns the R22 port, and which side wins
when `AGENTS.md` merges.

### The five-question cap was manufacturing a false green (2026-08-02)

The clarify loop inherited upstream's limit of five questions per session. That is wrong here
in two ways, and the second one is a defect rather than a preference.

- **Five is not enough for a buildable spec.** The default tier (R9) demands verbatim data
  contracts, interface contracts, invariants, algorithms and acceptance criteria. A real
  capability has far more than five things that decide whether it can be rebuilt from the spec
  alone.
- **The loop's own findings could evaporate.** On hitting the quota, upstream lists what it did
  not ask under "Deferred" in the completion message. Gaps that `spec-specify` marked are safe -
  they are in the file and the gate counts them. But the ambiguities **clarify itself discovers**
  in its taxonomy scan are not markers, so anything past the fifth was reported in chat and then
  gone: not in the spec, not blocking the gate, not recoverable. The skill's most valuable
  output was the part the cap discarded.

  *(Corrected the day it shipped. The first version of this entry claimed a half-interrogated
  spec reached a passing gate outright - that overstates it, because specify's markers do hold.
  Found by running the loop against the fixture repo, which is what the fixture is for.)*
- **The cap is gone; coverage replaces it.** The loop now ends when every section the declared
  tier requires either carries a real contract or carries a typed marker - never because a
  number was reached.
- **Nothing unresolved may exist only in the conversation.** Whatever is open when the loop ends
  is written into the spec as a typed marker, naming what is missing and who brings it, *before
  the skill returns*. This is what makes stopping early safe: the gate then refuses to plan.
- **Questions are batched by contract**, and the user is offered a stop between rounds with a
  count of what remains and what it blocks. Asking six things about one table across six
  messages was not thoroughness, it was a worse interface.
- **The five-word answer limit is gone for contract answers.** It suits "which auth model?" and
  is useless for "what does the payload look like?".

This is now the largest single divergence from upstream and [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md)
says so.

### There is no version to pin to - the pinning language leaves every surface (2026-08-02)

[ADR-025](docs/decision-records/ADR-025-the-standard-is-living-latest-is-the-target.md) decided
on 2026-07-30 that the standard is living and latest is the only target, and said the "pinned
version" phrasing had left every live surface. It had not - and this change put more of it back
before removing all of it.

- **The normative core contradicted itself in two sentences.** `SPEC.md` opened with "a repo
  complies at the version pinned in its own `.standards-version`" and then, immediately, with
  ADR-025's actual position. **R2** required a repo to *pin* a version; it now requires the repo
  to **record the state it last aligned to**, and says outright that nothing may read that as a
  version to stay at or a compatibility requirement.
- **A guard was enforcing the deleted model.** `tree-check` asserted that the README quick start
  must contain `@<VERSION>` - a check demanding the phrasing a decision had removed. It failed
  the moment the README was corrected, which is how it was found. Removed, with the reason
  written into the code and the spec so it is not reinstated as an oversight.
- **The landing taught it to every visitor**: `scaffold from repository-standards@0.7.2`,
  `--version 0.7.2`, and an Update card explaining the model as *"the way a dependency bump
  works"* - the exact analogy ADR-025 rejects. The version badge and footer stay: the standard
  has a version, and adopters simply do not pin to it.
- Swept the same way: `README.md` (including the quick start, which no longer names a version at
  all), `AGENTS.md`, `llms.txt`, `docs/faq.md`, `docs/method/adoption.md`, `standard/README.md`,
  `standard/docs/self-verify.md`, `update-to-version`'s description (which called itself "a
  dependency bump"), and the backlog item that was waiting on a tag "so the pin names something
  addressable".
- **Historical records keep their wording**, as ADR-025 prescribed - but the ADR index row for
  ADR-004 now carries its revision, because a reader scanning the table was being shown a
  superseded policy as current.
- `facts-check` caught the surfaces reworded past their own declarations, and the stale
  restatements were **deleted rather than re-patterned**: the fact they restated was the
  pinning language itself.

### The comparison was wrong about the field, and brownfield is not the difference (2026-08-02)

A landscape check for the discovery work, measured from the GitHub API rather than from
articles - which were months stale and understated every number.

- **The field is large and awake.** Spec Kit 125k stars, OpenSpec 63k, BMAD 51k, all pushed
  within two days of the check. The FAQ dismissed them as "a workflow or a scaffold", which is
  not a description anyone in the field would recognise.
- **"Brownfield" is no longer a differentiator, and we were claiming it.** OpenSpec's own
  stated philosophy is *"built for brownfield not just greenfield"*, with a guide for adopting
  on an existing codebase. The FAQ now says this plainly, including that our earlier phrasing
  got it wrong - a reader who knows the field would have caught it, and hearing it from us is
  better than being caught.
- **What actually distinguishes this, stated as four things none of them does:** decisions
  recorded, an undocumented repo walked into line with a *standard*, that standard carrying a
  version the repo pins, and compliance as a number CI asserts.
- **ProductSpec is named as the nearest neighbour by scope** - a schema-validated intent format
  with a parser, CLI, Action, MCP server and skills. It postdates every design decision here
  and the attribution says so, because the compared-against list exists precisely so a reader
  finds the alternatives from us.
- **`docs/open-questions/npm-as-a-channel.md`**: the backlog assumes an npm package and there is
  no `package.json`. Writing one would have decided the question by accident - a Node front door
  on a stack-agnostic standard, and a second version number to drift against
  `.standards-version`. Open, and after the first tag whatever the answer.

### The fill warning could never be cleared, so it was noise (2026-08-02)

Found by building a real adopting repo and filling it in properly - the first defect the
fixture produced, and one no existing gate could have caught.

- **The placeholder scan matched generic notation.** `specs/<capability>`,
  `docs/discovery/<topic>/`, `blocked:<id>` - all of which a *correctly filled* repo keeps,
  and the shipped `AGENTS.md` carries `specs/<capability>` in its own altitude ladder. So the
  single file the check exists for could **never** clear the warning, however completely an
  adopter filled it. A warning nobody can clear is one everybody learns to skip.
- **The fix is a convention, not just a regex**: angle brackets in **prose** mean *replace
  me*; angle brackets inside code formatting are notation. The scan strips code spans and
  fenced blocks first, and `AGENTS.md` states the rule so the next person writing a template
  knows which side to put a marker on.
- The tree's own genuine marker moved out of backticks to stay visible - it was hidden by the
  very fix that made the check usable, which is the trade this convention pays for.
- `tools/self-verify-fill-test.mjs` asserts **both directions**: notation must not warn, and a
  prose placeholder must still warn. A fix that silenced the check would pass one of those and
  fail the other. Verified by reverting the fix - two cases fail without it.

### Cycles get precise enough to manage a project, and say what they refuse to do (2026-08-02)

- **Measurement is the forecast; sizes only cover the cold start** ([ADR-029](docs/decision-records/ADR-029-measurement-forecasts-sizes-only-cold-start.md)).
  Story points were a proxy for time calibrated by a stable team's throughput, and with an
  agent in the loop that base does not hold - the same nominal three-pointer is twenty minutes
  or two days. So `size` is `S`/`M`/`L`, optional, a **splitting trigger**: an `L` means split
  before pulling. Below three closed cycles the timeline may reason from sizes and must label
  the result an estimate; at three it switches to measured durations and sizes leave the
  projection entirely. **No blended mode** - one input at a time is what stops `S`=1, `M`=3,
  `L`=5 rebuilding the currency.
- **An item that overruns its cycle is split, not re-sized.** This is what keeps item counts
  comparable without an estimation currency, and it replaces re-estimation outright.
- **`assignee` names who holds an intent now** ([ADR-030](docs/decision-records/ADR-030-the-current-holder-is-cycle-state-not-history.md)).
  `cycle-open` used to say "do not assign people - it lives in the tracker", which named a
  place that does not exist for a team that chose in-repo tracking at intake. ADR-010 is
  narrowed **by tense**, not replaced: one current holder on cycle rows, empty in the pool,
  overwritten on reassignment, archived as written. Who *used to* hold it is still the
  tracker's, and a team needing that trail still needs a tracker.
- **`blocked` takes a reference** - `blocked:PAY-1`. No new column: the status already carried
  `blocked` and what it lacked was *what*. `cycle-guard` fails a block naming an intent that
  exists nowhere, is the row itself, or is already `done` - a block pointing at finished work
  is the failure that costs time silently, because the row looks legitimately stuck.
- **The guard now runs its block checks without cycles.** It used to exit early on "no cycles,
  not using this" - which skipped the only check a `core`-profile repo could get, on a pool
  where a stale block costs exactly the same. The one-place invariant still needs cycles; the
  block checks no longer do.
- **The status is read as the last cell, not a fixed column index**, so an adopter adding a
  column does not silently disable the check. Asserted with tables of two different widths,
  because a guard that only worked at the shipped width would have passed its own tests.
- **`cycle-close` and `timeline-update` now show their result**, not just file it: a close
  table (intent, assignee, DoD met, where it went) and a timeline summary a person can paste
  into a status update unedited. The file is the record; the reply is what gets read.
- **What was deliberately not built**, recorded so the argument does not recur: burndown
  charts, velocity trends, time tracking, per-person throughput, and per-item state history.
  Both records state plainly that these exclusions are **review rules, not script-enforced** -
  a guard detecting "this column is being used as a currency" would be guessing.

### Documents get written with someone, not handed to them as a form (2026-08-02)

- **Four authoring skills ship** - `adr-write`, `bdr-write`, `product-write`,
  `personas-write`. The spec loop had six skills to produce one artifact; decisions, the
  product frame and the persona roster had templates and nothing that would sit down and ask.
  So the flow asked a product person to fill an ADR the way a developer would, and got what a
  form always gets: the sections filled and the thinking skipped.
- **Each opens by checking it is the right skill.** `adr-write` and `bdr-write` both run the
  overrule test first - an architect means ADR, a product owner means BDR - and hand over
  rather than answer wrongly. Both draft from the code and `docs/discovery/` before asking, so
  the user corrects a draft instead of typing what the repo already knows.
- **The BDR template stopped being the ADR template with different nouns.** It carried
  Context / Options / Decision / Consequences / Revisit - so *who it serves*, *what this rules
  out* and *how we would know we were wrong* had nowhere to go, which is precisely why business
  records read like technical ones. Those three sections now exist, and only in the BDR.
- **`PRODUCT.md` gained "What people do today instead".** The frame could not answer why
  anyone would switch, because the status quo being displaced had no home. Naming it as
  "nothing" is a valid and informative answer.
- **The persona roster's "3-6" is a ceiling, not a quota** - one persona a team actually knows
  beats three invented to fill a table, and invented personas produce specs that serve nobody.
- **Found while self-reviewing, and worth naming as the recurring shape**: `personas-write`
  first elicited five fields against a template that stores seven, and described the roster as
  sections when the gate reads a table. A skill that collects something other than what the
  file holds is the same document-to-tooling seam that has produced most defects here - it
  passes every gate, because no gate compares a procedure to the artifact it writes.

### The skill ceiling was the wrong constraint, and it was deciding things (2026-08-02)

- **The owner challenged the ceiling instead of the options, which was the right question.**
  Asked to choose between one routing skill and one per document type, he asked whether a
  ceiling of eight to ten was sensible at all. It was not, and it had been quietly making the
  decision.
- **It had no source.** "Respected skill collections treat eight to ten as the ceiling" was
  written with no citation, and the parenthetical offered to support it named a collection
  that ships **17**. The evidence produced in its defence contradicted it.
- **The cost it feared was never measured.** Every skill's name and description sit in the
  agent's context each turn - so it was measured: all 15 come to 4,772 characters, roughly
  **1,190 tokens**, about **0.6%** of a 200k window. Four more add around 300 tokens. Whatever
  the constraint is, it is not size.
- **The real failure was already observed today, and it was not about count.**
  `spec-specify` did not fire on "we need refunds" at twelve skills, because its description
  defined the artifact instead of naming the situation. Rewriting that one description fixed
  it **with the count unchanged**. That is the experiment, run by accident: what breaks is a
  description naming no situation, and it breaks at fifteen exactly as at five.
- **So the constraint is discriminability**, and the entry now says so: a skill earns its
  place when its description names a situation no other names, and costs something only when
  it overlaps one. Ten blurred descriptions are worse than twenty sharp ones. Two questions
  replace the number, neither arithmetic.
- **And that inverts the decision it was gating.** `authoring-skills` recommended two routing
  skills *specifically to respect the ceiling*. With the ceiling gone the recommendation
  flips to **one skill per document type** - `adr-write`, `bdr-write`, `product-write`,
  `personas-write` - because four descriptions each naming one situation discriminate better
  than two that each cover two. A routing `record-decision` has to match both "we picked
  Postgres over Mongo yesterday" and "we decided to charge per seat", and a description
  covering both is by construction vaguer than either alone.
- **The doubt that survives is narrower and honest**: four sibling files can drift. This repo
  proved that four times in one day - but those were four copies of one fact, where any
  divergence is a defect. Four question sets restate nothing and can legitimately differ.
- What would reopen it is now an observation rather than a number: a real user's sentence
  matching the wrong skill, with the descriptions that did it.

### The cycles work is audited and repaired (2026-08-02)

An audit of the day's last eight changes found sixteen defects that every gate passed over.
The worst were in the newest code.

- **The shipped cycle template was HTML-entity-escaped, so its "comment" was not one.** The
  only file in the tree written with `&lt;!--` instead of `<!--`. Consequences in ascending
  order: the example block rendered as body text; the guard's comment about ids being safe
  "because the examples live in comments" was false of the one file it names; and
  `cycle-open` tells the user to instantiate that template at a real cycle path, where the
  `_`-prefix protection is gone - **injecting two example intent ids into a live cycle**, on
  a file the standard's own skill just told them to write. The test missed it by copying the
  template to `_template.md`, proving the filename rule while its comment claimed the
  comment rule. It now instantiates the template the way the skill does.
- **The guard hardcoded the backlog's alternate path and passed silently without it.** The
  manifest's primary path is `backlog.md` with `docs/backlog.md` as the altPath; the guard
  only knew the second. A manifest-compliant repo lost the pool from the file list and got
  `cycle-guard: OK` - the pool-versus-cycle half of the invariant, which is the half the
  guard exists for, unchecked and reported as checked. Both paths now, and cycles with no
  backlog at all are an error rather than a silent pass.
- **`/timeline-update` wrote into the directory the guard walks.** `TIMELINE.md` names the
  intents it projects, so the normal sequence *update the timeline, then close a cycle*
  would red-line on a file the standard generated, telling the user to move a row nobody
  duplicated.
- **The comment scanner had two holes and one of them was not a hole.** An inline comment
  inside a row (`| PAY-7 | fix <!-- was PAY-4 --> the export |`) deleted a real row - fixed
  by scanning comment state left to right within the line. But a `-->` in commented prose
  genuinely does end the comment: that is HTML, every renderer agrees, and deviating would
  make the guard disagree with what the author sees rendered. The hazard is asserted in a
  test rather than engineered around.
- **`_`-prefixed directories were recursed into**, and fenced code blocks contributed ids.
- **Three enumerations of skills still listed twelve** while the declared count said fifteen -
  including the shipped `standard/README.md`, so an adopter could not discover from their own
  repo that three of their skills existed. `cycle-guard.mjs` was missing from the scripts row
  of the same file.
- **The marker-family rule was written and then not applied to the four files it names.**
  `spec-tasks`, the shipped entry point and the by-reference ways-of-working doc still said
  "zero open `[NEEDS CLARIFICATION]`" while the gate script counts the whole family - so a
  spec blocked by a missing decision read as ready in three of the four places describing it.
- **A cycle "carries an owner" in the decision, the README and the spec's prose, and nowhere
  in the artifact.** The front-matter contract had no Owner row, while three downstream
  statements attribute judgement to one. Added.
- **The ceiling argument was understated by three** in all four places it appears - the entire
  open question is about how far past 8-10 to go, and every number in it predated the cycle
  skills.
- **The backlog epic's intro said "nothing here is built yet"** above four rows marked done,
  and claimed ten test cases where the suite prints eighteen. It also now says plainly that
  the spec-before-code experiment was only half run: the spec was hand-written rather than
  produced by `/spec-specify`, and the skipped half is the half that would have tested the loop.
- Smaller: `standard/README.md` still called `CLAUDE.md` a thin router with `as-is` adapt
  class after both changed; `timeline-update` was governed by a spec but absent from the
  coupling map, so it could be rewritten with no guard noticing; `docs/README.md` cited an
  adopted-repo script path for a zone-1 file; the timeline split cycles by outcome block
  while `cycle-close` uses `Status`; and `ATTRIBUTIONS.md` was missing five borrowed ideas -
  Impact Mapping, Story Mapping, INVEST, jobs-to-be-done and the NN/g heuristics - all used
  in normative or shipped material.
- **One audit finding was wrong and is recorded as such**: the tree-guard spec was said to
  list six of eight checks. It lists eight. The first fix duplicated two of them and was
  reverted.

### Attribution gets a page a person can read (2026-08-02)

- **The credit was legally sound and humanly unreadable.** The MIT text ships, every derived
  file carries its provenance line, two records settle the relationship - and all of it was
  scattered across a licence file, inline comments, ADR-013, ADR-015 and a guard. Someone
  evaluating the project, or inheriting it, had nowhere to read what came from where. The
  owner asked the question twice, which is the evidence that the repo did not answer it.
- **`ATTRIBUTIONS.md` keeps three kinds apart on purpose**: vendored code carries a licence
  obligation, a borrowed idea carries a debt of credit, and a project this one is merely
  compared against carries neither. **OpenSpec, BMAD, Backstage and adr-tools appear only in
  the third list** - they are named in the FAQ as neighbours and influenced nothing, and
  listing them as influences would be its own kind of dishonesty.
- **It says what the spec-kit relationship is not**: not an integration, not a dependency,
  not a vendored copy kept in sync. Five prompts extracted and made ours, upstream read once
  per release and cherry-picked. It also says how far it has diverged - sections, tier,
  tests, question protocol and the unit of work all changed today - and that the attribution
  stands as long as any of the original does.
- **Borrowed ideas are credited where they were not before**: MADR, Conventional Commits,
  Semver, Keep a Changelog, RFC 2119, deliberate Backlog.md compatibility, and Linear for the
  word *cycle*.
- The page closes by inviting the correction rather than defending the list: an unlisted debt
  is a bug, and this project would rather over-credit than have someone discover later that
  it did not.

### The timeline states its evidence, or gives no date (2026-08-02)

- **`/timeline-update` answers "when will this land" from what the repo already holds** -
  every closed cycle's outcome block, regenerated whole into `docs/cycles/TIMELINE.md`
  rather than appended to, because it describes the present and git holds what it said last
  week.
- **Below three closed cycles it refuses to project, and says why.** Three is not a magic
  number and the file says so: it is the point below which one unusual cycle dominates the
  average. A projection presented without its confidence is what teaches people to distrust
  plans - and once they do, they stop reading the timeline and start asking in meetings,
  which is the state this was built to replace.
- **It reports the spread, not just the mean.** Three cycles at 0.4, 0.4 and 0.5 support a
  date; 0.2, 0.4 and 1.1 do not, and averaging the second set to "roughly 0.55" is the
  dishonest part. Wide spread gives a range, and says the spread is wide.
- **Unplanned work counts toward throughput.** A team that finished four planned intents
  while absorbing three emergencies did not move at four items' pace, and a projection built
  on the planned number alone reads them as permanently slower than they are - which is how
  a measurement becomes a grievance.
- **A cycle past its target and still open is named with the overrun, never softened** - and
  never called a failure, because the date is agreed and movable by design. A timeline that
  hides a slipping cycle is worse than no timeline.
- **It refuses to project from open cycles at all.** A cycle in flight has no throughput;
  using its planned count as if it were finished is exactly how a timeline becomes a wish.
- Six new acceptance criteria carry all of it, so the refusals cannot quietly become
  estimates later.

### Opening and closing a cycle become procedures, not discipline (2026-08-02)

- **`/cycle-open` moves rows, it does not copy them.** Each chosen intent is cut from the
  pool and pasted into the cycle unchanged. Copying is the one mistake this skill can make
  and it is exactly what the guard exists to catch, so the skill ends by running it.
- **It proposes rather than asks.** The intents come from the pool's existing risk x leverage
  order, offered for correction; the goal is pushed back on once if it restates the item list,
  because a cycle whose goal is its own contents tells the timeline nothing; and where past
  cycles give evidence, the target date is proposed from them with the source named.
- **`/cycle-close` cannot rubber-stamp.** It checks each intent against its own definition of
  done and reports per item: met, not met, or **cannot tell from here** with what would settle
  it. A close that waves items through teaches everyone the DoD column is decoration, which
  makes every later measurement worthless.
- **Unfinished work returns to its position, not to the bottom** - appending quietly demotes
  work that was important enough to commit to.
- **It asks the one question the data cannot answer**: did anything get done that was never in
  the cycle? A cycle that "missed" three items while absorbing two emergencies did not
  underdeliver, and a timeline built without that reads the team as slower than it is.
- **The pool gained an "In flight" section** - one line per active cycle, no rows duplicated,
  so the backlog stays the single place to start reading. The guard is tested against the real
  shipped backlog template, so a cycle row can never be mistaken for an intent.
- **The skill count moved from 12 to 14, and four prose restatements failed immediately.**
  That is the derived-facts check doing precisely the job it was built for - the count is
  declared once and every restatement is verified, so a number that grew could not quietly
  disagree with three documents. `shipped-skills` records that this is the third growth, and
  that the third is the one that should settle whether the ceiling is real.

### The cycle artifact ships, and its invariant is checked rather than asked for (2026-08-02)

- **`docs/cycles/<team>/<slug>.md` ships** *(scale only)* - a bounded period of work with an
  owner, a goal, an agreed end date and the intents pulled into it. Several run in parallel,
  one directory per team. A `core` repo never meets any of it.
- **The one rule is mechanical now**: an intent is in `docs/backlog.md` **or** in exactly one
  cycle. Never both, never two - including across two teams, because two teams believing they
  own the same intent is the failure worth catching early.
  `scripts/cycle-guard.mjs` proves it and reports every violation rather than the first.
- **The spec came before the code**, which is what ADR-028 said would happen and the only
  honest way to find out whether the loop works on its own features. `specs/work-cycles/` is
  buildable-tier, mapped in `capability-map.json`, and its acceptance criteria are what the
  test suite implements.
- **Ten test cases, and the template case is the one worth naming**: the shipped
  `_template.md` carries example rows, and a guard that read them would make the tree violate
  its own invariant the moment it landed in a repo whose backlog uses the same ids. The
  examples live inside an HTML comment for exactly that reason, and the test drives the real
  template file rather than a copy of it.
- **The test found a bug in itself first.** The advisory case asserted output that never
  arrived, because violations go to stderr while an advisory run still exits 0 - and a
  success-only capture loses precisely the output being asserted. Recorded in the file, since
  the next person writing a guard test will hit it.
- The guard skips itself where there is no `docs/cycles/`, so it is silent in every repo not
  using cycles - the same shape as the schema-pair and facts checks.

### The authoring-skills fork is written up, not decided (2026-08-02)

- **Four options weighed, one recommended, the decision left open.** Whether decisions, the
  product frame and the persona roster get one routing skill each or one per document type
  is a call against this project's own ceiling - eight to ten shipped skills, twelve already
  shipping - and it is not a call to make while implementing.
- **The argument for splitting is real and stated plainly**: an ADR wants forces, options
  weighed and what would reopen it; a BDR wants who it serves, what it costs and how we would
  know we were wrong; a product frame wants the observable outcome and the non-goals nobody
  volunteers; a roster wants jobs, pains and who wins ties. One set of prompts for all four
  produces a BDR that reads like an ADR with the wrong nouns.
- **The argument against is the same one this project keeps losing to** - the family grew
  past its ceiling one useful skill at a time, and this proposes doing it again. Written
  down so it is done deliberately or not at all.
- **What would settle it is testable before committing**: whether a routing description can
  fire on both "we picked Postgres over Mongo yesterday" and "we decided to charge per seat".
  If it cannot, per-type skills buy something real and the ceiling is the wrong constraint.
- Putting the elicitation in the templates instead was considered and rejected on evidence,
  not preference: the templates already carry good prompts, and the flow audit still found
  the wizard asking cold - a template cannot ask a question, and cannot notice a user
  agreeing with the worked example instead of describing their own product.

### The shipped tree stops citing a document it does not ship (2026-08-02)

- **`docs/research/README.md` told adopters "the case-studies rules apply"** - and
  `case-studies/` exists only in this project's own zone, never in the tree. The one rule
  that mattered was already in the same sentence, so the reference bought nothing and cost
  a reader looking for a document they do not have. The anonymization rule now stands on
  its own, with the example that makes it concrete.
- A sweep for the same failure across the whole shipped tree - every mention of
  `case-studies`, `open-questions`, `positioning`, `manifesto`, `ecosystem`, `tools/`,
  `site/` - returned **exactly this one hit**. The zone discipline holds everywhere else,
  which is worth recording: the boundary this repo draws between what it keeps and what it
  ships is real, not aspirational.

### The skills say when to reach for them, not what they are (2026-08-02)

- **A skill's description is the only text a model matches a request against, and every one
  of them was written as a definition.** `spec-specify` - the entry to the whole loop - said
  "Create or update a capability spec from a natural-language description". A user types "we
  need refunds"; nothing in that sentence meets that description, so the most important skill
  in the standard was the least likely to fire. They now open with the situation, in the
  words someone would actually use.
- **Five descriptions carried the spec-kit licence line**, spending fifty characters of the
  matching surface on text no user will ever say. MIT compliance rests on
  `scripts/spec/LICENSE` and the per-file provenance notes, exactly as the extraction record
  states - never on a frontmatter field the model reads to pick a tool. The notes stay where
  they belong, in the file body.
- **`CLAUDE.md` stopped being a six-line router.** It is the file loaded first, so the
  instruction to check whether a skill owns the request now lives there - in context from the
  first turn, rather than one hop away in a file that may never be opened.
- **The entry file states the three layers plainly, and which of them is certain.** A skill
  fires on its own when the description matches; this file and `CLAUDE.md` cover what the
  descriptions miss; the coupling guard catches the outcome regardless. Only the third is
  deterministic - and reaching it means doing the work twice, under review pressure.
- **Written into the record so it cannot quietly regress**: a user should never have to say
  "remember to use the skills". If that becomes necessary, the description is the bug. The
  spec now requires descriptions to match the request rather than name the artifact, with an
  acceptance criterion that uses a real user sentence.

### The wizard asks, confirms and suggests - instead of instructing (2026-08-02)

An audit walked the adoption flow three times as three different people and marked every
step ASK / CONFIRM / SUGGEST / INSTRUCT / ASSUME. It found eleven silent decisions, eight
questions asked with no candidates to react to, and six places a user without something
would reasonably conclude they could not continue.

- **The flow demanded a gate it had already declared unreachable.** One step said "drift 0.
  Do not open the PR on a red self-verify"; seventy lines later, "for a brownfield repo one
  PR never reaches drift 0 - and it should not try". A literal agent either never opens the
  pull request or sweeps every required artifact into one to force the number down, which is
  exactly the unreviewable big-bang the brownfield phase forbids. Greenfield now requires
  drift 0; brownfield closes wave one red by design, states the number, and opens the PR.
- **The step whose blast radius is other people now asks first.** The shipped workflows are
  live on merge, so until alignment finishes, colleagues' unrelated pull requests go red on
  a change they did not make - which is how an adoption gets reverted and never retried. The
  tree said so; the step that lands them did not. It now offers the three real options and
  never lands them silently. Prerequisites are checked before the guards rather than after,
  because without `jq` the guards deny every command by design and nothing connected that
  symptom to this step.
- **Intake stopped promising a stack before looking one up** - it said "I'll offer the
  <technology> best practices from the registry" and then, for anything but Node, quietly
  became something else three steps later. It now looks up first and says the true thing
  either way. Greenfield gained the branch it never had: no registry entry means no starter
  and no composition rule, not a step whose central instruction cannot run.
- **Intake asks what it never asked: where else this project already writes things down.**
  A tracker, a wiki, an `rfcs/` folder, decisions buried in tickets - suggested rather than
  asked open, because nobody recalls their own documentation on demand, and paired with the
  question that decides whether any of it is usable: can you reach it, and may it be quoted?
  What arrives lands in `docs/discovery/` with provenance and is read as **a claim about the
  code**. Where it disagrees with the code the code wins and the divergence is reported - a
  written decision the system stopped honouring is usually the most valuable finding of the
  whole assessment.
- **And it asks where work is tracked** - in the repo, in a tracker, or both bridged -
  detecting first from ticket keys in the commit log rather than asking cold. The intents
  list is not the question; where execution lives is, and it was being decided silently.
- **Brownfield interviews for personas instead of asking for a nod.** Code yields *roles*:
  an admin, a member, an API caller. It cannot yield who that person is, what they are
  afraid of losing, or which one wins when two of them want opposite things - and that last
  one is what every later spec argument turns on. The code now supplies the candidate list
  and the user is interviewed, the same way greenfield does it. The worked example is
  offered as calibration for how concrete an answer should be, with a warning: a borrowed
  persona passes the gate and then decides specs for years.
- **Greenfield proposes a roster rather than asking cold**, since the product frame from the
  previous step is enough to draft one, and people correct a wrong list far better than they
  generate a right one. `provisional` is a complete answer with a backlog item attached.
- **The capability map is played back before it is written.** It is what the coupling guard
  binds to on every future pull request, so a boundary drawn wrong is friction the repo lives
  with for years - and it was the one major inference with no confirmation step, two
  paragraphs after one that had it.
- **The behavioral tier stops reading as an accusation.** "Never to save effort" is aimed at
  a developer skipping contracts on a money path; a product person who cannot name endpoints
  for software that does not exist was reading it as being about them, and stopping. That is
  now said explicitly.
- **The counted backlog is handed over with its antidote in the same breath.** Two dozen
  documents delivered at once is the moment a user decides this was a mistake. Each item now
  names how it gets done rather than only what is missing, nothing is authored from scratch -
  the agent drafts from the code and discovery and the user corrects - and stopping carries
  no penalty.
- **Coming back is a first-class intent, not an admission.** A repo drifts without the
  standard moving at all, and a pinned repo asking "review how we are doing" was being routed
  to a version bump, which answers a different question. It now gets the assessment. This is
  the difference between a standard and a scaffold, and `PRODUCT.md` says so: you do not
  adopt this once.
- **The authentication method left the do-not-ask list.** It was there as a "reasonable
  default" while the decision checklist calls the auth model an ADR-grade fork whose reason
  is "retro-fitting authz is a security minefield". It was the one item on that list with
  security consequences.
- **Two jargon terms got glossed inside the questions that use them** - `pin` and `waves`
  were both in intake options a user must choose between, and both were defined a hundred
  lines later or not at all.

### The gate list gets one home, and the docs hub finds its own facts file (2026-08-02)

- **The pull-request template was the fourth copy of the gate list, and already wrong** - it
  named nine commands and omitted `spec-guard --base ... --block`, which is the one that
  catches a capability's code moving without its spec. Two of the other three copies were
  consolidated earlier today and this one was missed, which is the whole argument: four
  places restating one list, all four drifted, in a repo whose R4 says a fact has one home.
  The checkbox now points at `AGENTS.md` and says why it stopped listing them.
- **`docs/README.md` described nine of the ten things in its folder** - the missing one was
  `facts.json`, the file that declares which facts are not allowed to drift.

### Work cycles get a decision, not an implementation (2026-08-02)

- **The repo could not answer "when will this land"** - the backlog holds intents ordered by
  risk x leverage and nothing else. For one person that is enough; for several teams working
  in parallel, three questions had no home: which items a team has picked up now, what the
  period is *for*, and when it ends. ADR-028 designs the answer: a **cycle** is a
  goal-bearing, dated grouping of backlog intents at `docs/cycles/<team>/`, several running
  in parallel, ending when its owner says so rather than on a framework's clock.
- **One intent is in the pool or in exactly one cycle, never both** - a backlog that also
  lists what is already in flight is a backlog nobody believes. The property is mechanically
  checkable, so it will be checked rather than asked for.
- **It reopens something ADR-010 rejected, and says so** - that record explicitly turned down
  "everything stays in the repo, including done-work history" on the grounds that git already
  is the history. The narrowing rests on an argument ADR-010 did not have: **the grouping is
  not recoverable afterwards.** Git can always count commits between two dates; it cannot
  reconstruct that these seven intents were what a team believed it would finish, because the
  pool mutates and the version of the backlog that made the plan is only reachable by knowing
  which commit to read. An aggregate that cannot be recomputed is a measurement, not a
  restatement - so one block per closed cycle is permanent, and per-item execution state
  stays the tracker's exactly as before. ADR-010 is marked revised rather than superseded;
  the rest of it stands.
- **A projection states its own confidence or gives no date.** `/timeline-update` derives
  throughput from closed cycles and refuses to project from too few of them. A number without
  its evidence is what teaches people to distrust plans, and this repo would rather return
  nothing.
- **Scale only.** A solo repo never meets any of it - one person does not need to know which
  of their hats is holding an item.
- **The capability spec is deliberately not written here.** The idea is approved, so it
  graduates into an ADR and backlog intents; the spec gets written by `/spec-specify` when the
  first item is pulled. Hand-authoring it would bypass the loop this project sells, and using
  the loop on the loop's own features is the only honest way to find out whether it works.
- **The path changed from the first sketch** - `docs/teams/<team>/cycles/` lost to
  `docs/cycles/<team>/` because every other folder under `docs/` is named for the kind of
  thing inside it, and `teams/` would be the first to name an organizational unit and invite
  everything else a team owns to move under it. Recorded with the reason, and open to reversal.
- **The field test has a date and a reason for it** - the align router is the product's core
  and the only major component with no gate at all. It gets run against three real
  repositories shortly before the first tag: earlier measures a tree still moving, later ships
  a tag nobody tested.

### The indexes stop misdescribing their own contents (2026-08-02)

A repo whose job is keeping documents true to code had eight documents describing
themselves wrongly, several of them written the same day.

- **`tools/README.md` listed four tools of seven and gave a pre-PR command block that
  skipped every shipped guard** - so a contributor who trusted it got a red pull request.
  The three missing entries are the guard self-tests, which is a particular kind of
  omission: the file that documents the tooling did not mention the tools that check the
  tooling. The command list is gone rather than corrected; it lives in `AGENTS.md`, which
  carries a self-guard tying it to CI, and a second copy is a second thing to drift.
- **`CONTRIBUTING.md` pointed at the right file and then parenthesised a wrong, shorter
  list** - the same divergence, on the file a new contributor opens first.
- **The zone paragraph said "nine documents" and listed eight** - written yesterday, and it
  dropped the repo assessment, which is the one an agent needs first on an unfamiliar repo.
  The count is gone; the list is complete.
- **The spec for the guard that bans hand-written counts stated its own check count three
  ways, all wrong** - "Seven checks", "all four checks clean", "all seven checks", against
  eight. It broke when a check was added without touching the header. Counts removed, and
  the failure-cause list now names all eight rather than four.
- **`standard/docs/README.md` named seven of nine method docs** - and it ships, so every
  adopted repo inherited the wrong list at every update.
- **Three version restatements were undeclared** - one in the README's update example and
  two in the shipped tree, including a usage comment inside the verifier itself. Declared;
  the fact now has eleven agreeing restatements instead of eight.
- **`docs/PRINCIPLES.md` shipped as authored content** - no banner, no placeholders, and it
  sits at the top of the altitude hierarchy, so an adopter inherited a seven-day dependency
  cooldown and a ban on remote-database writes as their own ratified principles. It now
  says it is a template, and `self-verify` warns while it stays unfilled - it was the one
  such document the placeholder check did not look at.
- **The clarify gate was described two ways** - the script counts the whole `[NEEDS ...`
  family, `enforcement.md` said only CLARIFICATION, and the clarify skill's own description
  promised to drive to zero markers while its body says to leave DECISION, INPUT and ASSET
  open. An agent reading the narrow version would call a blocked spec ready.
- **The decision-records doc drew a five-level altitude chain** where the rule, the entry
  file and the README all draw four. R1 requires the order to be stated; one shipped file
  stated a different one.
- **`changelog.mjs` cited a path that does not exist** in either zone.
- **The backlog's "what remains" omitted the two items an evaluator is sent there to find** -
  the missing adoption evidence and the satellite alignment, both open. And this repo's own
  backlog runs three columns short of the format it ships: now stated as an exemption with
  its reason, rather than looking like an oversight.
- **The landing was the last surface still carrying only the soft disclosure** - "pre-1.0,
  field-run on the author's production repos". It now says what the README, the FAQ and
  `llms.txt` already say: no tags, no public adopter, one stack, and that the machinery is
  testable in a clone before anyone trusts it.

### The shipped procedures start doing what they say (2026-08-02)

Found by re-running the readability probes against the changed tree, then verified by
execution rather than by reading.

- **The spec engine's shell scripts shipped non-executable** - mode `100644`, while every
  skill invokes them by path rather than through `bash`. The clarify gate therefore exited
  126 on a fresh adoption, and `/spec-plan` and `/spec-tasks` are told to STOP on any
  non-zero exit, so a permissions problem was reported to the user as a spec that failed
  clarification. The core loop was broken for every adopter and the failure named the wrong
  cause. Now `100755`, with an acceptance criterion that runs the gate the way the skills do.
- **The persona gate passed every spec that came from the template** - the structure guard
  accepted any spec whose text mentioned `personas.md`, and the shipped capability template
  carries `**Serves:** <persona from docs/personas.md>` in its placeholder. So the template
  satisfied the guard the template exists to satisfy, and a spec serving nobody passed. The
  escape is gone; prose that genuinely reasons about who a capability is for still counts.
  Verified both ways: a raw template copy now fails, a filled `Serves` with a filled roster
  passes.
- **Greenfield told agents to write behavioral specs** - "write specs at the **behavioral**
  tier" - while the rule makes buildable the default and the escape hatch something that
  must be justified and should be rare, and the brownfield phase file says outright "do not
  drop to `behavioral` to save effort". The path a brand-new project takes was the one
  instructing against the rule. On a greenfield the argument is strongest: writing the
  contracts is what surfaces the disagreements while they are still cheap.
- **The scaffolding rule got an owner.** Plan and task files are ephemeral by rule and
  nothing removed them - `spec-structure` warned about files it cannot delete and that was
  the whole enforcement. `/spec-reconcile` now closes the work: it is where spec == code ==
  tests is established, so it is where the scaffolding goes. What the scaffolding recorded
  and is still true moves first - a decision to a record, a loose thread to the backlog, an
  open question to the spec. Unfinished work keeps its files.
- **"The workflows ship disabled as templates" was false** - written yesterday in the
  first-30-minutes list, and all three ship with live triggers: pull request, push, and a
  weekly cron. The warning about a red build on an unrelated pull request described the
  guaranteed outcome rather than a risk to avoid. The text now says they are live on
  arrival, why that pressure is intended, and how to opt out.
- **`pre-pr-review` required a command that does not ship** - it instructed the adopter's
  agent to run `/code-review`, which exists in the author's environment and nowhere in the
  tree. It now describes the property that matters - review in a context that does not
  already believe the code is right - and leaves the mechanism to the agent. Its finding
  list also gained narration, duplication and scope creep, which the method notes had been
  claiming it covered.
- **The comments rule finally exists where it was prescribed** - the method note said it
  belongs in the entry file as one line in the imperative, and no such line shipped. It does
  now.
- **The story-to-slice rename was half done** - fourteen survivors in the task template,
  including all six per-phase Goal and Independent-Test lines, plus the label format block
  in `spec-tasks` and a phase list in `spec-implement` naming phases the template no longer
  has. One of the survivors still said tests were generated "if tests requested", 195 lines
  below the patch note explaining why that is wrong.
- **The changelog checklist row presented the team mechanism as everyone's default** -
  per-PR fragments are scale-only, and a solo repo following the checklist adopted a
  mechanism the contribution guide tells it not to use. Marked `-> scale`, like its
  neighbours.
- **The transition router kept the flag that was removed from the others** - the same
  reasoning that freed `spec-update`, `pre-pr-review` and `update-to-version` applies
  hardest to the router, which is what the front page sells as the one-sentence entry point.

### The project says what it is looking for, and from whom (2026-08-02)

- **"Contributions welcome" was doing no work** - the guide explained mechanics and never
  said what would actually help. It now names four things in the order they move the
  standard: practices that beat the ones here, people who already think in-repo and
  executable-over-prose, maintainers, and AI practitioners - because how agents behave
  against instructions is the area with the least settled knowledge and the most
  consequence.
- **Technology expertise is routed away, deliberately** - Layer 1 is stack-agnostic by
  rule, so a TypeScript or Node opinion cannot land in this repo however right it is. Both
  the contribution guide and the open-questions front door now send it to the stack repo,
  which owns its own picks and its own doubts.
- **`open-questions/` is named as the front door for maintainers** - a single author decided
  every entry, which is this project's honest weakness. Each carries the decision in force,
  the doubt, and the options already weighed, so a challenger starts where the thinking
  stopped. Evidence from how someone actually works ends arguments that abstract reasoning
  cannot.
- **A new entry: what to call a bounded period of work** - `cycle` is the provisional pick
  over `sprint` (carries the ceremony argument with it), `wave` (already means the brownfield
  alignment waves - the same collision this project keeps finding in its own files) and
  `track` (holds the parallelism, loses the time bound and the goal). The entry also holds
  the question underneath: whether the standard should carry work periods at all, and if so
  that they are scale-only.
- **The changelog says it will be rewritten** - both it and the git history grew while the
  product was deciding what it was, and they carry abandoned threads and removed mechanisms
  described in terms that no longer exist. Before the move to the official organization the
  sequence gets re-authored to read as a product's development, with what was dropped simply
  gone rather than narrated.
- **The reference checkout stops leaving litter** - `standards-ref/` becomes
  `.repository-standards/`, gitignored, because it is a cache of the reference rather than
  part of the project.
- **`site.config.json` moved into `site/`** - it configures the marketing site, and sitting
  at the repo root is how it got read as product configuration. The root path still resolves,
  so no ecosystem repo silently falls back to the core defaults.
- **The contribution guide stops overstating the version rule** - a contribution never edits
  `VERSION`; the maintainer alone bumps it when cutting a release. The old phrasing read as
  "nobody ever touches this", which is not what the rule says.

### The security baseline gets a menu, without a new rule (2026-08-02)

- **"Security baseline" was a required decision with nothing behind it** - one of the eight
  foundation forks every repo must consciously decide and record, described in a single
  checklist cell. Two repos could both claim to have decided it and mean entirely different
  things, and neither would be wrong.
- **`docs/security-baseline.md` ships as the menu** - thirteen axes, each a question the
  record must answer: secrets, authn, authz, input validation, injection, transport and
  headers, rate limiting, logging and privacy, dependencies, CI permissions, agent
  boundaries, data at rest, and a one-paragraph threat model. It lists what has to be
  decided, never what to decide.
- **"Not applicable" is an answer; blank is not.** The rule now requires the record to say
  where each axis lands, including the ones that do not apply, because an axis nobody
  considered and an axis deliberately dropped are indistinguishable a year later. A CLI with
  no network genuinely has no CORS story - writing that down takes a line and settles it.
- **No new rule number.** The obligation attaches to R19, which already owned secrets and the
  shipped guards, rather than becoming R25. The rule count is past the top of the range this
  project measured itself against, the numbers are cited by the manifest and throughout the
  tree, and a twenty-fifth entry would have bought a heading rather than a mechanism.
- **Technology depth stays in the stack repos** - which header, which library, which OWASP
  control. The same page has to serve a CLI, a data pipeline and a payment service, and a
  control catalogue that pretends they share a checklist would be ignored by all three.
- Nothing here is machine-checked, and the page says so. Whether a baseline is *good* is
  review's call; what the rule buys is that the record cannot silently omit an axis.

### The surfaces stop claiming more than the repo can back (2026-08-02)

- **The landing said twenty rules against a spec that had grown past twenty** - and the guard
  written for exactly this failure reported green over it, because the number and the word sat
  either side of a tag: `20<small>rules</small>`. Adjacent to a reader, two unrelated tokens to
  the regex. `tree-check` now strips markup before matching, which was verified by feeding it
  the original markup and watching it catch `20 rules`. The landing states no number at all -
  the count is derivable, so it is not restated by hand.
- **The terminal on the landing showed output no run produces** - "drift 0 - 25 checks". Real
  runs of the shipped checker report 52 on the shipped tree. A fabricated line reads as
  evidence, which is worse than no line.
- **"No framework to learn, nothing to install" was not true** - every guard is a Node
  invocation, the guards need `jq`, and a non-Claude agent must port the shipped skills before
  claiming compliance. It now says what it actually costs.
- **"Community-vetted" was written in the present tense** in the persona roster and the
  positioning file that every surface is required to quote. There is no community yet: one
  committer, no external reviews, the site not deployed. It reads as the goal it is.
- **`llms.txt` recommended the standard with no mention of its maturity** - and it is the file
  designated as the machine-readable summary, so it is the copy an agent quotes to a user. It
  now carries a "Status and limits" block: pre-1.0, no tags, no public adopter, one registered
  stack, and what drift 0 does and does not certify.
- **The FAQ never asked the two questions that decide adoption** - "who is using this?" and
  "what does drift 0 actually certify?". Both answered, without softening: there is no public
  adopter, the evidence gap is the project's own open work, and what you can check today is
  the machinery, which runs in a clone before you commit to anything.
- **The verify command was presented as if it ran here** - `node scripts/self-verify.mjs`,
  bare, in the README twice and in `llms.txt`. It is an adopted-repo command; run against this
  repo it fails to resolve, and an agent that tries concludes the tooling is broken.
- **The README's version restatements were not guarded** - the fact mechanism covered
  `SPEC.md` and six places on the landing while the README named the version twice and could
  rot silently. Declared now, and the guard was checked by deliberately breaking one.
- **`PRODUCT.md` claimed the standard follows its own rules** without saying which. It follows
  its own decisions, specs, backlog, personas and guards; it carries no version pin, manifest
  copy or `CLAUDE.md`, because it produces the tree rather than consuming it. Whether it
  should align on itself is an open question, not a settled omission.

### Navigation leads where it promises (2026-08-02)

- **The shipped entry point never named the rules it cited** - `AGENTS.md` referred to R23
  and R24 without saying what an R-number is or where it lives, and `SPEC.md` was reachable
  only from `README.md`, which `AGENTS.md` does not link. An agent working inside an adopted
  repo could read the whole entry file and never find the normative page it is measured
  against. It now links the spec, the manifest and the verification doc in one sentence.
- **The tree ships knowing it is not compliant yet, and now says what to do about it** - a
  freshly adopted repo owes `.standards-version`, a filled persona roster and a capability
  map before anything is green, and the remedy the tree pointed at was the transition skill,
  which by design never ships into a consuming repo. A "First 30 minutes" section replaces
  the dead pointer with the seven steps, ending at drift 0 and only then enabling the
  workflow templates - which ship disabled, contrary to what a reader of "the self-verify
  gate runs in CI" would assume.
- **Three lifecycle skills could not be started by the agent** - `spec-update`,
  `pre-pr-review` and `update-to-version` carried `disable-model-invocation`, while the entry
  file tells the agent to update every affected spec on its own, the contribution guide makes
  `pre-pr-review` the gate before a pull request, and the product's whole pitch is asking in
  one sentence. A user who has to know the slash command has been handed a manual. The flags
  are gone and the loop section names all three, plus `add-to-backlog`, which it never
  mentioned at all.
- **The docs hub listed 8 of 17 entries** - `personas.md`, `backlog.md`, `self-verify.md`,
  `prerequisites.md`, `ideas/`, `journeys/`, `research/`, `runbooks/`, `analytics.template.md`
  and `facts.example.json` were reachable only by knowing they existed. This is the file an
  adopter's agent lands on when it goes looking for docs.
- **`ADR-0NN` meant two different things at once** - the tree cites the standard's own
  decisions dozens of times, while telling the adopter to number theirs from `ADR-001` in an
  index that reads "(none yet)". One line now says which is which, with the address.
- **The supersede rule had no slot in the form** - the policy says an accepted record gains a
  `Superseded by` line, and neither template had that row. Both do now.
- **The coupling guard's documented behaviour was the team-profile one, stated as universal** -
  it blocks at `scale` and advises at `core`, which is what the workflow and the rule both
  say; only `enforcement.md` disagreed. The full-tree audit blocks at both, because an
  unmapped spec is a hole rather than a coordination cost.
- **The taxonomy sent adopters to a path that will never exist in their repo** - a single
  `docs/open-questions.md` file. The standard ships no such artifact; the row now offers the
  two forms that actually work and says why the standard keeps its own separately.
- **`docs/method/` was filed as this project's private life and is not** - its nine documents
  are adopter-normative, taken by reference at latest. A reader applying the zone rule as
  written discarded the taxonomy, the adoption gates, the decision checklist and ways of
  working. Both the README and `AGENTS.md` now carry the exception.
- **This repo says plainly that it is not itself an aligned repo** - no pin, no manifest copy,
  no `CLAUDE.md`, and the altitude order lives in the README rather than in `AGENTS.md`. That
  is deliberate, and until now nothing said so while `PRODUCT.md` claimed the standard follows
  its own rules. It follows its own decisions, specs, backlog, personas and guards; the
  adopter-side pin is proved instead by the skeleton check on the pristine tree.
- **A blank line had pushed the newest decision out of its own table** - the ADR index broke
  after ADR-026, so ADR-027 rendered as a paragraph of pipe characters. Neither the link check
  nor the site check can see a table that stopped being a table.

### The tree stops shipping fiction as content (2026-08-02)

- **The persona roster shipped three invented people** - `Owner-operator Olga`, `Agency admin
  Adam` and `Guest Gabor`, from a rental-property product, sat under the instruction "List the
  real customer/user types for this product" with nothing marking them as an example. An
  adopter inherits them as their roster, and `spec-structure.mjs` reads that table as the live
  roster the persona gate checks specs against - so a spec could serve someone from a domain
  the repo has nothing to do with and pass. The table is now a placeholder row; the filled
  version moved under the "Worked example (delete after filling your roster)" heading that
  already existed.
- **Moving them was not enough** - the roster scan read the whole file line by line, so the
  example table would have been picked up wherever it sat. The scan is now bounded to the
  `## The roster` section, with the whole-file behaviour kept for personas files that carry no
  such heading.
- **The backlog shipped three invented items** the same way - `SPEC-1`, `ADR-1`, `DRIFT-1`
  read as work the adopting repo owes itself. They are an example block now, outside the table.
- **The placeholder check could not see the file it exists for** - it matched `<Repo>` and
  `<Product>` case-sensitively, and the entry file ships `# AGENTS.md - <repo> ...` in lower
  case. It also scanned three files while the tree ships placeholders in seven. Both fixed;
  the bracket form excludes `:` and `/` so markdown autolinks are not mistaken for tokens.
  On the pristine tree it now warns on all seven, `AGENTS.md` included.
- **`add-to-backlog` wrote rows that failed the backlog's own Definition of Ready** - it said
  "write the row with every column" and then listed four of seven, omitting `cap`, `persona`
  and `owner`, which are exactly what makes an item pullable. Writing a row short only moves
  the work to whoever picks it up.

### The spec engine speaks the standard's language (2026-08-02)

- **The engine wrote a spec shape the standard does not have** - `/spec-specify` filled User
  Scenarios, Functional Requirements, Success Criteria and Key Entities; the capability spec
  template has none of them. The engine was extracted from upstream and its paths, directory
  layout and template source were patched, but the sections it fills were not. A spec written
  to them could not be reconciled against the shape the guards check.
- **Worse, it gated against buildable specs** - the quality checklist required "no
  implementation details" and "written for non-technical stakeholders", while the spec method
  requires contracts quoted verbatim: real field names, real enums, real endpoints, an
  exhaustive error table. The two rules cannot both hold, and the one the engine enforced was
  the wrong one. Upstream's example of a *bad* success criterion - a p95 latency target - is
  exactly what a buildable requirement looks like here. The checklist now gates on the tier
  the spec declares.
- **Tests stopped being a per-feature preference** - `/spec-tasks` said "Tests are OPTIONAL:
  only generate test tasks if explicitly requested", which quietly opted a repo out of its own
  recorded testing-strategy decision, one feature at a time. It also disagreed with
  `/spec-implement` two files away, which mandated TDD. Tasks now follow the recorded strategy,
  treat money, security, external-contract and data-integrity paths as non-negotiable, and
  emit the missing decision as a task where no record exists.
- **One asking protocol instead of two** - specify presented up to three questions together;
  clarify asks up to five, one at a time, each with a recommended answer. Both ran, in that
  order, so the same gap was raised twice and answers given to specify landed outside the
  `## Clarifications` section the gate reads. Specify now marks gaps and hands off; clarify
  owns the asking.
- **Clarify lost its bypass** - upstream let the user wave the gate off for an exploratory
  spike, while the entry file and the rule both say a spec never passes to planning without it.
  A spike is a reason to defer an answer, and a recorded deferral is an answer; it is not a
  reason to leave the question unwritten.
- **Answers land in sections that exist** - clarify routed them to Functional Requirements,
  User Stories, Data Model and Success Criteria > Measurable Outcomes. They now route to
  Requirements, Data contracts, Interface contracts, Algorithms & rules, Invariants, Edge cases
  and Trust boundaries, with the error table treated as part of the contract.
- **Tasks group by requirement slice** - one Requirements area plus the acceptance criteria
  that verify it, ordered by risk x leverage. The upstream unit was a user story with a
  P1/P2/P3 priority, and a capability spec carries neither, so `tasks-template.md` asked the
  agent to extract something that was never there.

### The agent guards stop failing open (2026-08-02)

- **Without `jq`, every guard passed everything and said nothing** - `read_command()` is a
  `jq` call, so on a machine without it `CMD` came out empty, each guard cleared its own
  `[ -n "${CMD}" ]` check and exited 0. The output was byte-identical to a clean pass, so
  the remote-database, force-push and CI-secret protection R19 promises was simply absent
  with nothing to signal it. `deny()` was built on `jq` too, so even a decision to refuse
  produced malformed JSON.
- **A guard that cannot read the command now refuses it** - `deny()` escapes its own JSON
  with `sed`/`awk` and no longer needs the tool that may be missing; a missing `jq` is
  itself a denial, and so is a `lib.sh` that will not load. The denial names the install
  command, because the failure mode is a one-time setup gap, not a policy dispute.
- **The regression is covered rather than promised** - `verifyAgentGuards.sh` runs a guard
  on a `PATH` holding everything except `jq` and requires a denial. The same command with
  `jq` present is allowed, so the case discriminates instead of passing by construction.
- **The secret scan stopped exempting the folder most likely to hold a live secret** - the
  gitleaks allowlist waived every markdown file under `docs/`, and `docs/discovery/` is
  precisely where the standard instructs the agent to paste meeting notes, mails and
  transcripts, while runbooks carry real command lines. Placeholder-shaped findings in
  templates stay covered by the pattern allowlist, which matches the secret itself.
- **`docs/prerequisites.md` ships** - what has to be installed before any of this protects
  anything, and what each absence actually costs. It is a page rather than a `self-verify`
  check on purpose: a laptop missing `jq` is not repository drift, and counting it as drift
  would make the number mean two different things.

### The stranded stack phase comes home (2026-08-01)

- **The align router's third phase existed and was never merged** - `stack.md` sat on a
  branch from 22 July while the router described stack adaptation inline and pointed at
  nothing. Found by clearing the stale branches: of eight, seven were fully landed under
  different SHAs and one held this.
- **What it adds over the inline text** - the wave order by blast radius (what protects,
  then what shapes code as its own PR because the diff noise is real, then what proves,
  last what automates), the rule that a kept competing tool is a recorded exception with
  its trade-off named rather than a fight, and the reminder that the starter is a
  reference, never a second app beside the code.
- **Reconciled with what the router became since** - the branch's own edit to the router
  was the older, thinner form and was dropped in favour of the current text; only the
  phase file and the pointer to it survive. Technology knowledge still never enters this
  repo: the phase reads the stack repo's `ADAPTING.md` and `DECISIONS.md`.

### Adopters get the derived-facts check, and R4 says why (2026-08-01)

- **`scripts/facts-check.mjs` ships** - the check that caught this repo's own stale
  skill count is no longer repo-own tooling. A repo declares what it restates in
  `docs/facts.json` (shape in `docs/facts.example.json`), `self-verify` runs it as a
  manifest guard, and a stale restatement becomes drift with a number. A repo that
  declares nothing passes quietly - the guard runs everywhere, so it must stay silent
  where there is nothing to check.
- **R4 gains the hook it was missing** - "documents are living, the current version is
  the truth" said nothing about the same fact living in five files. It does now: a fact
  has one home, and a restatement either links to it or is **declared** and verified.
  A rule that says this without a check is the kind of sentence everybody agrees with
  and nobody obeys.
- **One implementation, dogfooded** - this repo deleted its private copy and runs the
  shipped script on itself, the same way it runs the shipped `spec-guard.mjs`. Two
  copies of a drift-checker would have been an unusually pointed source of drift.
- **`docs/facts.json` joins the author-it-yourself set** - like the version pin and the
  capability map, shipping an example would seed a repo with another repo's facts. The
  tree-guard spec now says why that set exists rather than just listing it.

### The upstream scan runs, and the postmortem gets its template (2026-08-01)

- **Upstream reviewed: github/spec-kit v0.13.2 -> v0.15.1** - the extracted engine's
  first scan since the extraction. Most of what moved upstream is CLI, presets,
  extensions and packaging, which this standard does not consume. One change to the
  command templates was worth taking and was taken; the rest were read and rejected
  with a reason, which is the point of recording the range rather than the verdict.
- **The clarify loop now asks a question, not a label** - cherry-picked from upstream
  commit `39f2ac3`: lead with a full interrogative that someone can answer as written,
  never a topic label or a requirement id ("Retention policy" and "FR-023" are
  subjects), and follow it with one plain sentence on what changes depending on the
  answer. The hunk carries a `CHERRY-PICKED` marker naming its upstream commit, beside
  the existing `PATCHED` ones - provenance stays readable in place.
- **Read and not taken** - the duplicate step numbering fix does not apply (the
  extracted specify prompt has none), the constitution-command fixes touch a command
  this standard does not ship, and the port of the setup scripts to Python is
  deliberately not followed: the shipped scripts are bash with graceful fallbacks.
- **Postmortems get the template every other folder already had** - the runbooks README
  has been prescribing blameless postmortems in a fixed order, with actions that become
  backlog items in the same PR, while shipping nothing to write them into. The template
  carries the two sections people skip and later need: the actions that were rejected
  and why, and what is deliberately not being changed.

### A repo can find out the standard moved (2026-08-01)

- **`standards-update-watch.yml` ships as a template** - weekly, it compares
  `.standards-version` against the standard's newest release and opens **one issue per
  target version**, with the line to say to take the update. ADR-025 said staying
  current is a notification and never a lock; until now there was no channel, so
  "always align to latest" depended on somebody remembering to look.
- **It never edits the pin** - an alignment that happens while nobody is looking is not
  an alignment. The issue proposes; a human runs `update-to-version`, which applies the
  delta and preserves the repo's recorded deviations.
- **Installed before the first release, it says so and passes** - no releases yet is a
  normal state for an adopter who wired the watch early, not a red run. A weekly cron
  also must not mint a weekly issue, so an open issue for the same target version ends
  the job.
- **Renovate gets the same job where a repo already runs it** - a documented custom
  manager treats the pin as a dependency, and the doc says plainly what that PR is: a
  proposal and half the work. Merging a bare pin bump leaves the repo red by design,
  because the manifest copy arrives with the update.
- **Still waiting on the first tag** - the channel cannot be proven end to end until a
  release exists, and releases are the maintainer's call. The backlog row says exactly
  that rather than claiming the item is finished.

### Every doc opens with your case, not with the concept (2026-08-01)

- **"You have this case - say this"** - the pattern `working-with-specs.md` and
  `discovery.md` set is now the opening of all nine method docs and of the shipped
  folder READMEs: backlog, decision-records, ideas, runbooks, journeys, analytics and
  research. Each one starts with the situations people are actually in, the exact line
  to say, and where the result lands.
- **Written for the reader who did not come here to learn the method** - somebody with
  a repo they did not write, an idea they do not want to lose, a service on fire, or a
  question about whether something is a decision or just a convention. The concept
  sections stayed where they were; they are no longer the front door.
- **Corner cases are part of the answer, not an appendix** - update versus new spec,
  business versus technical record, an idea that is really a decision waiting, a rename
  that is a migration, an assessment that quietly skipped half a repo. These are the
  forks where a busy reader guesses wrong, so each opener names its own.
- **The method index leads with situations too** - a table keyed by what you are
  holding rather than by document name, so the entry point matches how somebody
  arrives.

### A fact restated in prose now has to agree with its source (2026-08-01)

- **The coupling idea, one level down** - `specs/capability-map.json` made "these move
  together" a declared edge for code and specs. Prose was left out, and prose is where
  a number rots quietly: this repo shipped "twenty rules" while `SPEC.md` had 21, and
  said "11 lifecycle skills" while the tree held 12. Both were found by a person, late.
- **`tools/facts-check.mjs` + `tools/facts.json`** - a fact has one home (a file to
  read, a glob to count, a pattern in a designated source) and every restatement is
  declared. Three are wired to start: how many skills ship, the GitHub path a client
  degits, and the version the standard advertises across `SPEC.md` and the landing page.
- **A surface that stops matching its own claim fails** - a reworded sentence whose
  pattern finds nothing is a failure, not a pass. Silence there would look exactly like
  agreement, which is how a check rots into decoration.
- **It found the 12th skill on its first run** - `discovery-digest` had been shipping
  for a while and no surface counted it. Fixed in the same change, including the open
  question whose *filename* carried the stale number (`eleven-skills.md` is now
  `shipped-skills.md`, and its doubt about the eight-to-ten ceiling got sharper, not
  weaker). Covered by `tools/facts-check-test.mjs`, 6 cases.
- **Adopters do not get it yet** - it is repo-own tooling until the shipping question is
  answered properly: a home in the tree, a manifest entry, and a normative hook that is
  recorded rather than implied. That sits on the backlog with the evidence it already
  earned here.

### The schema pair stops being a promise (2026-08-01)

- **`scripts/schema-pair.mjs` ships, and `self-verify` runs it** - R24 said the DDL and
  its typed twin are 1:1 and nothing proved it, which is the shape of rule that decays
  quietly: a pair held by review drifts one column at a time. The check is a manifest
  guard now, so a broken pair is drift with a number, and a repo with no
  `database/schema/` reports that and passes.
- **The pair is a declared edge, not a convention** - each file names its counterpart in
  a `pair: <path>` comment and the check resolves it both ways. A schema file naming
  nothing, naming a file that does not exist, or naming a twin that does not name it
  back are three distinct failures with three distinct messages.
- **What it proves, said plainly** - every name the DDL defines (table, column, enum
  type, enum label) appears in the twin, compared case- and separator-insensitively so
  a camelCase twin of a snake_case column matches. Type agreement is not checked:
  reading a Zod or Pydantic module structurally means knowing the language, so that is
  a stack-repo concern. Nor is a twin field with no column behind it drift - the
  database is the source of what exists, and a typed module carries input shapes and
  derived fields too.
- **Its own test found a hole in it** - `tools/schema-pair-test.mjs` drives the guard
  over fixtures, 9 cases, most asserting it fails. One case exposed a false negative
  that review would not have: the `pair:` line names a path, a path carries words, and
  `bookings.sql` was vouching for a table called `bookings`. The declarations are
  stripped before the twin is read.

### The database schema becomes something the repo holds (2026-08-01)

- **A new rule, R24** - a repo that owns a database carries that schema as executable
  DDL under `database/schema/`, complete enough to rebuild the database from a
  checkout alone. The standard already assumed the file existed: the shipped guard
  denies remote writes and tells the agent to leave a reviewed `.sql` there for a
  human to apply. Nothing had ever required it, so the schema lived in the running
  database and in a chain of migrations - a fold nobody performs by reading, with no
  floor under it when the database is gone.
- **And it exists twice, on purpose** - the same schema is also a typed, documented
  definition in the stack's idiom (Zod in TypeScript, Pydantic in Python), and every
  path that reads or writes the database goes through it instead of restating row
  shapes inline. The two are a declared **1:1** pair: every table, column, constraint
  and enum in one is in the other, each side names its counterpart, and a change to
  either lands in the same PR as the change to the other. Either side may be generated
  where the stack has a generator that does not quietly drop what DDL can express.
- **Why twice rather than one generated source** - the alternatives were considered
  and rejected in writing (ADR-027): migrations are the delta and not a readable
  state; an ORM model binds the most durable asset in the repo to a library's
  lifetime and to what that library can express; a `pg_dump` artifact is machine
  output whose diff nobody reviews. It is a fine check against the authored DDL,
  which is where it belongs.
- **Held by review for now, and that is on the backlog** - no manifest entry can
  prove a per-repo, conditional path, so `self-verify` does not see R24 yet. The
  mechanical pair check is a gate-health item rather than an assumption, because a
  pair held by review drifts one column at a time.

### The agent guards stop being walkable, and the coupling gate stops firing on data (2026-08-01)

- **Two bypasses in the shipped `PreToolUse` guards, both reproducible** - the
  remote-database guard decided "is this remote?" by grepping the whole command
  string, so `psql -h localhost -c 'select 1' && psql -h prod-db... -c 'DROP TABLE
  users'` vouched for itself; and its localhost match was unanchored, so
  `localhost.evil.example.com` - a resolvable name that is not loopback - read as
  local. Since the tree is copied into consuming repos, every repo that adopted the
  baseline inherited both.
- **A force-push guard that was never there** - the deny list blocks the literal
  spellings, and a permission pattern does not see
  `git commit -m "..." ; git push --force origin main`.
- **The guards are scripts now, not one-liners inside JSON** - 900 characters of
  shell in a JSON string is why both bugs survived review: nobody reads a line in
  that shape, and neither bug is visible without reformatting it. Each guard splits
  the command on `;`, `&&`, `||` and `|` and judges the segments separately, anchors
  the end of the hostname, and strips no quotes at all - which removed a third
  failure mode a consuming repo hit, where two unrelated apostrophes paired up and
  swallowed the `--force` between them.
- **They only speak when they deny, so they now have a test** -
  `scripts/verifyAgentGuards.sh` drives all three with 32 real commands, every known
  bypass among them as a regression case: a write to a remote host denied, a SELECT
  against the same host allowed, a write against localhost allowed, a plain push
  allowed, seven spellings of force-push denied. A broken guard is otherwise silent -
  it stops guarding and nothing says so. Writing the cases found two more holes: git
  accepts any unambiguous abbreviation of a long option, so `git push --force-with-l`
  is a real force-push that the first version of the guard let through - it now denies
  on the `--force` prefix, which every accepted abbreviation carries. And the database
  guard matched the host flag case-insensitively, so curl's `-H` read as psql's `-h`
  and a local write whose argument came from a curl call was denied as remote.
- **The coupling gate stopped demanding a spec update for data** - the capability map
  pointed `standard.manifest.json` at the verify engine, so registering those guard
  files - pure manifest data - failed CI with nothing legitimate to write, the exact
  erosion the gate-health epic was opened for. A map entry may now be
  `{ "glob": "<glob>", "couples": "shape" }`: the file's **key shape** is the
  contract, so an added entry or an edited value passes, while a key path that
  appears or disappears still demands the spec. Anything the guard cannot compare -
  no earlier version, unparseable JSON on either side - couples, so the quiet
  direction stays the guarded one.
- **The coupling guard sees files that are not added yet** - locally it read tracked
  changes only, so a new file in a capability's domain coupled in CI but not on the
  machine where it was written. The same hole as the entry below, in a second gate.
- **And it has its own test** - `tools/spec-guard-test.mjs` runs the shipped guard
  against real diffs in a throwaway git repo, 11 cases, most of them asserting that
  it still fires. A false positive is loud, a false negative is silent: a shape
  comparison that stops noticing a schema change looks exactly like a green run.

### The local link gate stops under-checking (2026-08-01)

- **Untracked markdown is in scope** - `link-check` read only `git ls-files`, so a
  brand-new document was invisible to it until `git add`. The gate passed, reported a
  file count that excluded the very files being written, and the dead link surfaced in
  CI, where everything is committed. It now scans untracked, non-ignored markdown too
  and names the untracked count in its verdict; the tree-guard spec describes the wider
  scope. Found by walking the repo's stale branches: the fix had been written and never
  merged, and the same hole bit the folder-authoring work that preceded this release.

### Working with AI gets an evidence layer (2026-08-01)

- **A new method folder: `docs/method/working-with-ai/`** - the method manual said
  who owns what in the PO -> Dev -> AI loop but nothing about the AI stage itself,
  which is where the loud claims and the thin evidence live. Seven notes, each one
  opening with the complaint people actually make and closing with the rule we run:
  comments that earn their tokens, context as the budget, felt speed vs measured
  speed, a check the agent can run, review as the place the cost lands, instructions
  that survive, and blast radius before autonomy.
- **A claim without a source does not go in** - every note declares a confidence
  (`strong` / `mixed` / `thin`), lists its sources with what each one actually shows,
  and carries a `Last checked` stamp, because a note about model behavior is a claim
  about a moving target. Vendor docs count as evidence of intent, surveys as evidence
  of perception, and only studies or large code datasets as evidence of outcomes - the
  notes say which they are leaning on.
- **The first entry settles a live argument** - "AI writes ten lines of comments for
  two lines of code" is true and measurable, *and* the counter-argument (comments
  carry context to the next, more atomic run) is half right: models read comments as
  semantics strongly enough that misleading ones hurt more than misleading variable
  names. The resolution is a lifetime test - expiring context belongs in the plan,
  durable non-obvious *why* belongs in the code, structure belongs in the spec - plus
  the observation that "I will remove them later" is the failure mode this standard
  exists to remove.
- **Wired in, not parked** - the folder is a manifest reference (adopted like the rest
  of the method manual), a docs-site page, and a link from `ways-of-working.md` where
  the AI stage is named.
- **Citations you can check without the link** - "16 developers, 246 tasks" is exactly the
  kind of claim a reader wants to verify, and a bare URL does not let them. Every note now
  cites by key into a bibliography
  ([sources.md](docs/method/working-with-ai/sources.md)) carrying the durable part: authors
  or publisher, date, stable identifier (`arXiv:2507.09089`, a thread id, an issue number),
  the sample the finding rests on, and an accessed date. The key's **prefix is the evidence
  class** - `Study`, `Data`, `Survey`, `Vendor`, `Incident`, `Field` - so a reader sees what
  kind of support a sentence has without leaving the sentence.
- **Every load-bearing figure re-read at the source, and two were wrong** - the pass turned
  up that trust in AI accuracy in the Stack Overflow survey is **32.7%**, not the 29% the
  press repeated (that is the *somewhat trust* band alone), and that the duplication growth
  cited from GitClear needed replacing with the measured series (cloned lines 8.3% -> 12.3%,
  moved code 25% -> under 10%, and 3.8% in the follow-up dataset). Entries now declare
  `primary` or `secondary`: reformatting an unverified number into a precise-looking citation
  makes it more misleading, not less. Names are used only where the source carries a byline;
  pseudonymous posts are cited by thread id, never by handle.
- **Notes declare how fast they rot** - a `Decays:` class (slow / medium / fast) and a line
  naming **what would change this**, which doubles as the re-check instruction. Economics and
  architecture age slowly; model behavior and tool defaults age fast; the README carries the
  three-level re-check - follow the falsifier, walk the source entries, then check the claim
  against our own repositories. A claim confirmed on our own code graduates into a case study.
- **An eighth note, and the field-report layer that earned it** - practitioner threads were
  read directly rather than through secondary write-ups, and the strongest signal was one
  the desk research had missed: consultants describing their inbound shifting from building
  systems to repairing AI-built ones. That is
  [the-cleanup-comes-later.md](docs/method/working-with-ai/the-cleanup-comes-later.md) -
  marked `mixed` on purpose, because loud testimony from a self-selected sample is not a
  measurement. The same pass sharpened four existing notes: comment density is *inverted* in
  agent-written code (heavy on trivial CRUD, near-absent where the maths is dense), a large
  green test suite can carry a tenth of its own value, an engineer publicly refusing to
  review code its authors cannot explain named the collapsed generation-to-review cost ratio
  before this repo did, and a long-running setup on a 300k-line codebase reached the
  skills-plus-hooks split by exhaustion rather than by reading the docs.
- **The README now says what each kind of source may prove** - a table separating controlled
  studies and code datasets (what happens) from surveys (what is perceived), vendor docs
  (what is intended), field reports (what people hit) and documented incidents (that it
  happened at least once, in public).
- **The pre-PR check list stops lying** - `AGENTS.md` claimed to carry "the same set CI
  runs" while omitting the spec-coupling guard, so a green local run could still meet a
  red CI. Both `spec-guard` invocations are now on the list, with a line saying that a
  check present in `checks.yml` and absent here is a bug in the list. Two specs the
  wiring touched moved with it: the web-surface spec stops hand-writing the page-map
  length (it was already stale, and the count is derived at check time anyway), and the
  verify-engine spec gains the criterion that manifest **data** growing is not an engine
  change - only a change in how an entry is interpreted is. The false positive behind that
  last one is captured in the backlog under a new gate-health epic: the coupling map cannot
  currently tell a file's schema from its data, so every future data-only manifest edit will
  fail the same way, and the cheapest escape is a cosmetic spec edit - which is how a good
  gate rots into ritual.

### The mainline gets a shape (2026-07-31)

- **Branch and history is normative now (ADR-026, new R23)** - the standard had
  nothing to say about how work actually reaches `main`, so the rule this repo
  learned the hard way (three PRs' commits stranded on a rewritten base) lived
  only in its own `CONTRIBUTING.md` and never shipped to anyone. R23 fixes that:
  a branch is updated by **rebasing onto its base** and the base is never merged
  back into it; every PR is based on the mainline, never on another open PR's
  branch; a PR lands as **one readable unit**; and a branch may be rewritten only
  while it is the author's alone.
- **Rebase-merge is the paved road, squash is the sanctioned alternative** - not
  a ban on merge commits. A merge commit at integration time is a legitimate
  shape; the braid produced by back-merges is what breaks history. Rebase-merge
  publishes every commit, so it comes with the bar that makes it honest: each
  commit complete, buildable, reviewed on its own. A repo that will not hold that
  bar squashes and records it in its branching ADR - both comply, drifting
  between them does not. The rejected options (merge commits by default,
  squash-everything, semi-linear where GitHub cannot offer it) are in the record
  together with the costs we accept (new SHAs, no signature survival, commits CI
  never tested in that exact form), so the argument is not re-run every PR.
- **It reaches adopters where they read** - the mechanics land in
  `docs/conventions.md` (merged into every repo's `AGENTS.md` at adoption), the
  shipped PR template gains the rebased-on-`main` check, force-pushing a branch
  others build on joins the red flags, and the decision checklist grows the
  integration-method row. Held open as an [open
  question](docs/open-questions/rebase-merge.md): squash asks less of a small
  team and delivers most of the benefit, and the option that wins on merits
  (semi-linear) is missing from GitHub, not from the reasoning.

### The standard declares itself living - latest is the only target (2026-07-30)

- **Latest-first (ADR-025)** - no version ranges or requirements anywhere,
  ever; every align and update targets the latest standard. The pin
  (`.standards-version`) is a bookmark of the last aligned state - what makes
  updates deltas and self-verify meaningful - never a constraint. References
  resolve at `main` deliberately: the canonical phrase on every live surface
  becomes "adopted by reference from the living standard - always latest"
  (ADR-004/023 keep their original text with revision notes). Staying current
  is a notification proposing a pin bump (a watch workflow and a Renovate rule
  on the pin file - recorded in the backlog until the first tag makes them
  provable).

### Discovery has a home, specs draft early, the front door leads with usage (2026-07-30)

- **Discovery dossiers (ADR-024)** - `docs/discovery/<topic>/` holds
  provenance-stamped extracts of meetings and mails (raw transcripts stay
  out); a dossier is **never normative** - where it differs from a spec or
  record, the spec has already won, so nothing gets re-litigated. The
  `Last reconciled:` stamp in the dossier README makes "explain it once"
  mechanical: agents ask only about entries newer than the stamp. Entries
  live as `new -> folded-into-spec | superseded-by-record | open`.
- **Typed open markers** - a spec can draft on day one of discovery
  (`in-refinement`, the draft state) holding each gap as a marker naming what
  is missing and who brings it: a question, a missing ADR/BDR, a missing
  input (UX design), a missing asset (credentials). The clarify gate now
  blocks the whole `[NEEDS ...` family, so the open markers ARE the gap
  list and the gate output reads as "what is left, and whose it is".
- **`discovery-digest`** - a new lifecycle skill, the dossier's curator:
  ingests notes/mails, writes the essence with provenance, flags
  contradictions between entries, reports when a topic is ripe for
  `/spec-specify`. It never writes specs; the spec skills never curate the
  dossier. `spec-specify`/`spec-clarify`/`spec-plan` read the dossier first
  and move the stamp when they consume it.
- **Docs lead with usage** - the README opens with the real asks you say to
  your agent (one sentence each); two new method docs are written as worked
  examples, not theory: `working-with-specs.md` (real situations -> the exact
  prompt -> what happens, corner cases included) and `discovery.md` (one
  feature walked from kickoff meeting to ready-to-develop). The landing's
  hero becomes a live agent session - the ask typed, the align played out to
  a plan; the prior landing stays at `site/previous.html` while the final
  template is chosen.

### The wizard, the feedback loop, the honest gates (2026-07-29)

- **Intake-first adoption (ADR-020)** - `align-to-standards` opens with step 0:
  measure the repo's state, then one question round - intent, technology (with
  the Layer 2 consent gathered up front), appetite, plan-only vs execute.
  Assessment-only becomes a legal, named outcome. Both phases walk one gate
  spine (`adoption.md`); brownfield reconstructs personas from the assessment's
  evidence and gets the stack offer right after the assessment, not at the end;
  greenfield gains an explicit starter-composition rule (degit into the root
  first, Layer 1 lays over it, collisions per adapt class). A pinned repo that
  wants a stack later has its own route. Every assessment finding and backlog
  item names the **owner role** that must act (product/business, architect,
  dev, agent).
- **Adoption feeds the standard (ADR-021)** - align and update runs close with
  a consent-gated upstream offer: a registry miss becomes a **stack request**
  issue, friction becomes an **adoption friction** report, a doc fix becomes a
  PR. New `.github/ISSUE_TEMPLATE/` forms (stack-request, adoption-friction,
  bug) give the signal one shape; CONTRIBUTING gains "Feedback from adopters";
  `llms.txt` tells agents the channel exists.
- **Lifecycle procedures are normative and agent-portable (ADR-019, new R22)** -
  the spec loop, backlog capture, pre-PR review and version updates MUST ship
  agent-executable; `.claude/skills/` + `scripts/spec/` is the reference form; a
  non-Claude repo ports them strictly to its own mechanism (the manifest accepts
  `.agents/skills`). The manifest entries now cite the rule that actually
  demands them.
- **Stacks linked, not version-locked (ADR-022, revises ADR-016)** - the stack
  manifest's `standards` version range is gone; the registry back-pointer is the
  linkage. Nothing version-shaped is checked or warned about; a core
  manifest-contract break is an explicit, recorded migration stacks chase on
  their own clock.
- **Everything consumed pinned exact, enforced (ADR-017 discharged)** - both
  this repo's workflows and the shipped templates pin actions by full SHA, run
  on fixed runner images and name exact node versions; `tree-check` gains a pin
  lint so a floating tag cannot return.
- **The manifest covers the whole tree** - the shipped-but-unlisted class is
  gone: `spec-guard.yml`, `docs/personas.md`, SECURITY, the PR template, the
  process docs, journeys/research/runbooks all have entries (with adapt classes
  and profiles); `tree-check` verifies the reverse direction (every shipped file
  is an entry or an explicit exemption). The intake asks core-vs-scale, align writes
  the answer into the manifest copy's **profile** field, and `self-verify` uses it
  as the default - a solo repo is no longer red out of the box; the shipped `spec-guard.yml`
  blocks on coupling only at scale and runs the full `--audit` on every PR.
- **Derived facts stop being hand-written** - rule counts and ranges left every
  surface (say "the numbered rules"; the number lives in SPEC.md); `tree-check`
  fails a surface that hardcodes one; `site-check` derives the docsite page
  count from the PAGE MAP and asserts the landing advertises `VERSION`. The
  persona gate cannot silently evaporate (specs without a roster now fail the
  structure guard; the roster is a required manifest entry) and committed
  plan/tasks scaffolding is warned about (R13).
- **Method docs live beside the tree (ADR-023, extends ADR-004)** - the
  adoption checkmap, repo assessment, taxonomy, decision checklist, ways of
  working and changelog process moved to `docs/method/`; the shipped tree is
  now literally the client repo at day zero. Clients adopt the method **by
  reference at the pinned version**: the manifest carries a `references`
  section, `self-verify` notes it and never file-checks it (the old
  reference-entries-with-required-file contradiction is gone), and
  `tree-check` fails a dead reference.
- **The generator serves any repo** - page titles, sidebar footer links and the
  generated README come from `site.config.json` / repo-agnostic text instead of
  hardcoded core chrome ("one form, many sites" made true).
- **Repo hygiene** - own CODE_OF_CONDUCT, own SECURITY.md (the shipped one is
  the template), own PR template; `update-to-version` states where the two
  manifests come from and updates the stack layer too; `docs/self-verify.md`
  says plainly which rules the drift number covers and which stay
  review-verified; FAQ and PRODUCT catch up with the extracted engine and
  satellite stacks; the garbled shipped texts (checklist, enforcement,
  conventions) read clean; the ADR/BDR templates no longer hardcode the
  author's name.

### The spec, the tree, the engine (2026-07-22)

- `standard/SPEC.md` - new: the whole normative core on one page - numbered
  MUST/SHOULD rules (RFC 2119), versioned with the standard. Where any other
  document appears to add a requirement, the spec wins. The manifest is its
  machine-readable projection: every entry cites the rule it enforces (`rule: "R#"`).
- **One authored tree (ADR-014)** - `standard/` is now the single committed,
  consumable form at real-repo paths; the old source/dist pair and `tools/reflect.mjs`
  are gone (the reflect build and its four mapping classes were introduced and
  retired within this unreleased span). `tools/tree-check.mjs` guards the tree
  instead: no repo-own leaks, every manifest promise present, and the pristine tree
  passes its own `self-verify --skeleton` (new flag). Adoption is one line:
  `npx degit repository-standards/core/standard`.
- **Spec engine extracted (ADR-015, supersedes ADR-013)** - the five load-bearing
  Spec Kit prompts are now the standard's own skills (`spec-specify`, `spec-clarify`,
  `spec-plan`, `spec-tasks`, `spec-implement`; provenance: github/spec-kit v0.13.2,
  MIT, `scripts/spec/LICENSE`), their runtime at `scripts/spec/`. Deleted: the
  vendored area, `.specify/`, the ten `speckit-*` skills, the dead
  `create-new-feature.sh` and ~600 lines of extension-hook boilerplate.
- **Skills consolidated** - one family, eleven shipped: `backlog-from-specs` merged
  into `add-to-backlog` (two automatic triggers), the `spec-analyze`/`spec-converge`
  stubs folded into `spec-reconcile`'s new cross-spec consistency step; transition
  flows collapsed into one router (`skills/align-to-standards/` with greenfield and
  brownfield phase files; `modernize` now lives as adoption's plan-then-refactor
  pass, ADR-007 unchanged); `disable-model-invocation` now matches what `AGENTS.md`
  orders (impact/reconcile/backlog self-fire, update stays gated).
- **The repo gates itself** - first own CI (`.github/workflows/checks.yml`):
  tree-check, link-check (every relative md link must resolve), docsite build +
  site-check. The web surface moved to `site/` (landing committed, `site/docs/`
  generated and gitignored); `apps/` and the wheel experiments are gone.
- `changes/` retired for this repo - fragments folded here; the maintainer edits
  `## Unreleased` directly. Team repos keep the fragments mechanism as a
  scale-profile prescription (`standard/docs/changelog-process.md`, the assembler
  now ships as `scripts/changelog.mjs`).

### Lifecycle and the guided loop (wave 2)

- **Artifact lifecycle (ADR-010, Accepted)** - one arc for every artifact: ideas live
  in `docs/ideas/` (status-driven, no records until approved, graduation on
  approval); specs/records/docs are permanent and living; plan/tasks are ephemeral
  and removed at close; enabling work (tokens, access) goes front-matter -> tracker
  as blocking stories, never spec prose. Tracker posture: GitHub Issues default,
  Jira and Linear as adapters behind a one-way bridge with key write-back.
- **Statuses + the clarify gate** - a capability spec carries
  `Status: in-refinement -> ready-to-develop -> in-development -> live`;
  `ready-to-develop` is earned mechanically (a `## Clarifications` section, zero
  open markers). The loop runs itself: agents start the clarify loop unprompted,
  record deferrals as answers, and refuse to plan past a failing gate.
- **Guided align** - `align-to-standards` is re-entrant: resume from measurement,
  payoff-ordered waves, repeat to drift 0.
- **Ideas/discovery** - speculative ideas are a first-class pre-decision kind:
  explored end-to-end in one doc, no ADR/BDR/spec until approved; `Proposed` means a
  decision awaiting ratification, never a maybe.
- **Living documents + folder READMEs** - docs change by editing the same file in
  place (the current version is the truth, git is the history); every folder
  explains itself with a three-section README.
- **Structure dogfood (ADR-008, revised by ADR-014)** - root `AGENTS.md` maps the
  zones; strays rehomed; working notes live outside the repo by rule.
- **Personas as a validation gate (ADR-006)** + the standard's own roster; the
  structure guard fails a spec that serves nobody; UX forks catalogued (NN/g review
  lens, JTBD, W3C DTCG tokens). Plain-language explain mode for the PO.

### The align engine

- `standard.manifest.json` (ADR-005, Accepted) - the standard describes itself as
  data: files, sections, guards and decisions an aligned repo must have, each with
  an `adapt` rule and a profile (`core`/`scale`, ADR-011 - one standard, two
  verified profiles).
- `scripts/self-verify.mjs` - manifest-driven compliance: reports **drift as a
  number**, asserts the `.standards-version` pin, `--profile` filters, warns on
  hand-copied transition skills (ADR-009), and `--skeleton` verifies the shipped
  tree itself.
- `update-to-version` applies the manifest-to-manifest delta and carries
  `exceptions` forward; in-repo instructions are the source of truth (ADR-012) -
  personal memory may point at rules, never hold them.

### Adoption, brownfield, and cross-discipline standards

- `docs/adoption.md` - the adoption checkmap: ordered gates from unaligned to
  aligned + self-verifying, each producing an artifact; ends in a counted backlog
  and a green self-verify; includes model guidance and the plan-then-refactor
  modernize pass (ADR-007).
- Brownfield: `onboard-repo`'s derive flow (capabilities, decisions the code
  implies, the rest as backlog) and the eight-pass repo assessment now live inside
  the align router's brownfield phase.
- Backlog layer: the ordered, agent-first backlog template (INVEST + DoR); capture
  via `add-to-backlog` incl. automatic items from spec deltas and drift findings.
- Cross-discipline standards folded in: C4 (architecture diagrams), WCAG 2.2 AA
  (accessibility floor), Impact + Story Mapping (greenfield discovery), OWASP ASVS +
  SLSA (security baseline references), working-language policy (natural language is
  a per-artifact config; default English).

### Layer 2 - split into satellite stack repos (ADR-016)

- Layer 2 leaves the core: technology best practices live in one repo per
  technology (`repository-standards/<tech>`), discovered via the `stacks.json`
  registry - the only source of officialdom. First satellite:
  repository-standards/node (DECISIONS + the boot-verified starter + its own
  weekly boot CI + `stack.manifest.json` declaring `standards: ">=0.8 <1"`). The align
  router detects the target repo's technology and offers the matching practices;
  greenfield degits the stack's starter. One stack per technology by policy -
  variation is a profile or an adoption mode, never a sibling repo.

### Layer 2 - Node/TS (now in repository-standards/node)

- `stacks/node-ts` - the evidence-based paved road: pnpm + Turborepo, Node 24,
  Biome (+ Prettier for SCSS), strict TS, Fastify native-DI service template with
  Zod env, Next App Router config, hardened least-privilege Actions, 7-day
  supply-chain cooldown; every pick with pros/cons and provenance in DECISIONS.md.
- Tiered testing: unit + integration co-located (Vitest projects), e2e workspace
  (Playwright), advisory Lighthouse CI, ephemeral Docker test-stack - real
  dependencies, not mocks; maintenance rules stated (flake quarantine, coverage as
  a floor on paths that matter).
- App shell (DECISIONS #10): Better Auth + `openid-client` for enterprise SSO,
  Next proxy -> Fastify with default-deny at both gates, CSS Modules + SCSS + DTCG
  tokens; the boot-verified `starter/` - install, dev, sign-up -> dashboard proven
  by curl and a Playwright journey.

### Release machinery

- Two-changelog process for team repos: per-PR fragments assembled by
  `scripts/changelog.mjs` (`--check` validates frontmatter) into the technical
  changelog and a curated release-notes draft; the maintainer cuts every release.
  This repo itself edits `## Unreleased` directly (solo, core profile).

### Supply chain and one home for history (2026-07-29)

- **R21 + ADR-017: everything a repo consumes is pinned exact** - dependency
  manifests, overrides and lockfiles carry exact versions (no ranges), container
  images, CI runners and actions name an exact version or digest (never `latest`,
  never a floating tag); upgrades are explicit, reviewed diffs, behind the
  release-age cooldown. New "Exact versions, everywhere" principle in the shipped
  `PRINCIPLES.md`; per-stack mechanics stay in the stack repos.
- **R4 sharpened + ADR-018: history lives in the changelog, never inside living
  documents** - a spec or doc carries no `## Change log` section; git and the
  changelog process are the only history. The spec template says so; the
  changelog process gains "The only home of history"; the coupling-guard docs
  gain map hygiene (capability globs skip dependency manifests/lockfiles, and a
  guard hit on a behavior-free change means reconcile the spec or narrow the
  map, never append a history note).

## 0.7.2 - 2026-07-07

Spec methodology sharpened - combines the by-capability and spec-depth work.

- `specs/README`: specs are organized by **capability/domain, not by page or route**
  (UI-surface is a docs cross-reference). Plus **Spec depth: buildable, not
  descriptive** - specs carry the contracts (data, interface, algorithms, state,
  acceptance criteria), with a `buildable` / `behavioral` tier.
- `capability-spec.template.md`: the buildable sections (Data / Interface contracts,
  Algorithms, State machine, Config, Acceptance criteria) + a `Spec tier` line; the
  depth rationale lives in `specs/README`, not restated in the template.
- `decision-records/adr/ADR-002` (by capability) and `ADR-003` (buildable) - the two
  decisions with their rejected forms (ticket/page numbering; descriptive-only).

## 0.7.1 - 2026-07-07

Dogfood the decision-record system and settle its policy (ADR-001).

- `decision-records/adr/ADR-001-decision-record-policy.md` - the first real ADR:
  records use MADR; ADR = a broad *technical* decision (framework / library / tooling /
  infra / data), BDR = business (separate stream), sub-scope via `Tags`, no TDR and no
  bespoke sub-type acronyms.
- `decision-records/README.md` - added the "what counts as a record here" glossary,
  the authoritative definition ADR-001 drives.
- `decision-records/adr/_template.md` - added the MADR `Confirmation` field (the
  decision -> enforcement bridge).

Source-only; `dist/` syncs via the planned build step.

## 0.7.0 - 2026-07-07

Ship the spec-structure guard - the mechanical "no ticket-numbered spec paths" half
of the spec policy that `enforcement.md` described but never shipped. Live gap it
closes: a consumer's align produced `specs/cms/001-core/` - a Spec Kit
`/speckit-specify` leak - and nothing caught it.

- `spec-structure.mjs` (source `specs/`, dist `scripts/`) - dependency-free guard
  that fails on `specs/**/NNN-*`. Modes: full-tree audit, `--staged`, `--base --block`.
  Needs no capability-map, so it runs from day one.
- Wired into the `spec-guard` CI workflow as a second gate (structure + coupling).
- `commands.md`: explicit Spec Kit boundary - never `/speckit-specify`; capability
  specs only via `/spec-update`.
- `enforcement.md`: the structure lint is now shipped, not just described.

## 0.6.1 - 2026-07-07

Housekeeping: reconcile drift between the source and `dist/` (no policy change).

- Renamed the standards-layer references from `CODING_STANDARDS` to `conventions`
  everywhere (the docs-hub link was dead), matching the actual `conventions.md`.
- Finished removing the TDR stream (gone since 0.3.0): dropped the stale
  `ADR / BDR / TDR` title and the "TDRs are living" line from the decision-records
  README, plus the TDR mentions in the PRINCIPLES and PRODUCT templates. The
  "there is no TDR stream" notes stay.
- `enforcement.md`: dropped the phantom `bin/sync.sh` reference (removed in 0.6.0)
  and fixed `capability-map.yml` -> `capability-map.json`.
- `CONTRIBUTING.md`: reduced to a pointer into `AGENTS.md` instead of restating its
  rules (single source of truth).
- Known remaining: source and `dist/` still diverge in content (e.g. the
  decision-records "Records vs working docs" section) - the planned source->dist
  build step will resolve this systematically.

## 0.6.0 - 2026-07-06

Restructured as a framework: source organized by concern (loose at the repo root)
plus `dist/` as the assembled result.

- Promoted the former `core/` contents to the repo root as concern folders
  (`agents/`, `claude/`, `decision-records/`, `docs/`, `github/`, `gitleaks/`,
  `skills/`, `specs/`) - the maintained source.
- Added `dist/` - the standard assembled as a real repo skeleton (the final product
  to reflect); currently a committed snapshot, a build step will keep it in sync.
- Completed the spec-first workflow in the source: `/spec-*` skills, Spec Kit setup,
  constitution bridge, `align-to-standards` skill.
- Removed the old copy mechanism (`bin/sync.sh`, `manifest.json`) - superseded by
  agent comparison. README rewritten as the framework guide.

## 0.5.0 - 2026-07-06

- **Records vs working docs** - `core/decision-records/README.md` now draws the line
  between decision records and plain working docs (research / screening / workstream
  material), with a lifecycle rule for organizing working docs: phase-boxed
  exploration in a discovery folder, standing workstreams and living libraries in
  their own top-level `docs/<workstream>/` folder. Pointer added to the agent
  conventions block (`core/agents/conventions.md`).

## 0.4.0 - 2026-07-06

Spec-policy enforcement is now shipped, not just described (proven in a pilot).

- `core/specs/spec-guard.mjs` - the coupling guard, dependency-free (Node + git),
  reads `specs/capability-map.json`. Modes: `--staged` (pre-commit warn),
  `--base <ref> [--block]` (CI).
- `core/github/workflows/spec-guard.yml` - the CI job (blocks on PR).
- `core/specs/capability-map.example.json` - example `capability -> code globs` map.
- `bin/sync.sh` now copies the guard and its workflow into a target repo;
  `enforcement.md` points at the shipped files.

## 0.3.0 - 2026-07-06

Spec model reworked: **living capability specs** as the behavioral source of truth,
decision records slimmed, TDR removed.

- **`core/specs/`** (new) - capability specs = "what the system does now", organized
  by domain not ticket. README (model + git-native change delta + workflow),
  `capability-spec.template.md`, `commands.md` (`/spec-impact` `/spec-clarify`
  `/spec-update` `/spec-analyze` `/spec-reconcile` `/spec-converge` on the Spec-Kit
  engine), `enforcement.md` (pre-commit + CI spec-policy guard: structure lint +
  code/spec coupling guard via a `capability-map`, plus an optional AI reconcile).
- **Decision records** - reduced to ADR + BDR (the *why*, kept lean). **TDR stream
  removed** - "living technical design" is absorbed by capability specs (behavior)
  and `ARCHITECTURE.md` (structure). Altitude hierarchy updated to place specs.
- **Repo docs** - `ARCHITECTURE` reframed as structure/boundaries (not behavior),
  docs hub + AGENTS updated to point at specs as the behavioral source of truth.
- Removed `core/spec-kit/` (superseded by `core/specs/`).

## 0.2.0 - 2026-07-06

Methodology layers added - the standard now carries shape, not just guardrails.

- **Decision records** (`core/decision-records/`) - ADR + BDR + TDR system:
  templates, index stubs, lifecycle, altitude hierarchy, governance.
- **Repo docs** (`core/docs/`) - mandatory templates every repo fills: `PRODUCT`
  (vision + current state), `ARCHITECTURE` (technical), `AGENTS` (entry point),
  `PRINCIPLES`, docs hub.
- **Process** (`core/spec-kit/`) - spec-driven development is core: install +
  flow + a thin `constitution.template.md` governance bridge that defers to
  AGENTS.md / ADR / standards instead of duplicating them.
- README: documented the shape-vs-content distinction and the four core layers.

## 0.1.0 - 2026-07-06

Initial core seed, extracted from an internal engineering audit.

- `core/claude/settings.baseline.json` - agent permission baseline (deny/ask) +
  two PreToolUse guards: remote-DB write guard and GitHub secrets/variables guard.
- `core/gitleaks/.gitleaks.toml` + `core/github/workflows/gitleaks.yml` - secret
  scanning (pre-commit + CI, pinned gitleaks binary).
- `core/github/pull_request_template.md` - PR template with ADR-impact section.
- `core/agents/conventions.md` - single-source conventions block (Conventional
  Commits, ticket-after-colon, no AI attribution, ASCII hyphen only) to merge into
  a repo's AGENTS.md - not duplicated into tool files.
- `core/CONTRIBUTING.md` - thin contributor guide pointing at the repo's AGENTS.md.
- `core/skills/pre-pr-review/SKILL.md` - clean-context self-review before opening a PR.
- `bin/sync.sh` - apply core into a target repo (non-clobbering, drift-aware).
- `skills/align-to-standards/SKILL.md` - agent-native reconciliation of a repo to
  the current standard.
- `manifest.json` - sha256 per core file for drift detection.
