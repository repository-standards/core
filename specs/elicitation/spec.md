# Elicitation

**Spec tier:** buildable
**Serves:** `Spec-first PO Paula` - the questions are hers to answer and the record has to show she answered them; `Standard-bearer Staszek` adopts repos he does not own and must not have their conventions guessed at; `Coding agent` is the party this capability constrains.
**Status:** live
**Success metric:** Truthfulness - the share of adoption artifacts whose stated provenance survives being checked against the session transcript.

## Purpose

Make asking a mechanism rather than an instruction. Declare the points where this standard
must ask a person instead of deciding, refuse the write that would settle one of them
unasked, and record what became of every answer. The promise "hand-holding is the product"
had no implementation: zero of twenty-three skills contained a call to `AskUserQuestion`, and
a complete adoption asked one question in 1140 transcript lines while inventing personas,
renaming a repository's own directories across seventy-eight files, and quoting its owner
saying something he never said (ADR-054).

## Clarifications

### Session 2026-08-19

- Q: Should a run with nobody to ask be blocked outright? A: No - it declares the point a
  stub and writes a visible gap. A guard leaving a legitimate run no legal move gets removed
  rather than obeyed, and guessing is the behaviour worth forbidding, not proceeding.
- Q: Where does provenance live - on each artifact, or in one ledger? A: One ledger.
  Fifty-four decision records each carrying a provenance key is metadata nobody compares.
- Q: What makes `pending` stop being acceptable? A: this adoption writing something at a path
  the point gates. Two narrower rules were tried and both were red on arrival.
  `.standards-version` is written before anybody has been asked anything, so it fails every
  fresh adoption and the shipped tree itself; "the path holds a non-template artifact" fails
  every brownfield repository, whose records and specs predate the standard by years.
- Q: May an adoption rename what the repository already has? A: Yes, once asked. Reshaping
  material into the standard's layout is often the right call - two parallel homes for
  decision records is worse than one converted home. It is doing it by default, as a side
  effect of tidying, that is forbidden.
- Q: Delete the validation corpus that measured nothing? A: No. The observations are real
  records of real work; what they lacked was a statement of which question they answer.

### Session 2026-09-03

- Q: The h run (2026-09-03) accepted a Layer 2 stack as the second of four batched questions
  with no point id, and the owner reported at the end of the day it was never asked about and
  never adopted (`docs/open-questions/stack-offer-on-adoption.md`). Should the offer share the
  greenfield route's existing stack point, or get its own? A: Its own - `adopt.stack`, asked
  as its own round on the brownfield path (`STACK-OFFER-2`). A point asked down more than one
  path already has to declare every path it is asked down (R28 above); a brownfield accept
  sharing the greenfield point's identity would have made that requirement true on paper while
  the two routes' option lists kept diverging in practice.
- Q: Should `adopt.stack` declare `gate_globs` the way most points do? A: No, deliberately. The
  greenfield route's own stack point already gates the same manifest paths a Layer 2 accept
  writes; giving `adopt.stack` the same globs would satisfy the guard on *either* point's
  question firing, which breaks the greenfield route's own gate the day a brownfield-only
  answer starts counting for it. The known cost, not closed by this decision: a stack answer
  filed under the greenfield point's id on a brownfield run still passes the mechanical guard,
  because nothing here reads scope to know which route asked. `tools/elicitation-replay-test.mjs`
  carries a case asserting this as a documented limitation rather than a silent gap.

### Session 2026-09-03 (the driving side)

- Q: An adoption skipped the intake round and wrote `docs/adoption-intake.md` from the skill's
  own prose, and nothing refused it. Where was the guard? A: Wired nowhere that session could
  see. `standard/.claude/settings.json` wires it for the tree that ships into an adopted repo;
  this checkout - the one `align-to-standards` says it runs from - carried no `.claude/settings.json`
  at all. The repository that authors and ships the guard never ran it, in the one session it
  exists for (ADR-060).
- Q: Then wire it here like an adopter does? A: It cannot be wired that way. This repository
  carries the same gated paths any adopter does behind a template ledger that is `pending` by
  design, so every ordinary write in it would be refused - the unlivable-guard failure ADR-054
  already names. The guard instead reads which side of an adoption it is on from the tree's own
  shape (the shipped tree under `standard/` rather than unpacked at the root) and judges only
  the writes that leave a driving checkout.
- Q: Why not an environment variable, which would be simpler to read? A: Because an adopted
  repository could set the same variable and exempt every write it makes - its own writes land
  in its own tree. The shape of a tree is not something a settings file can claim.
- Q: Whose ledger answers for a write, when the run spans two repositories? A: The one in the
  repository the write lands in, for both the file and the committed row behind a settled
  repository-scoped point. Reading it from the working directory let a driving checkout's own
  answers vouch for writes into a repository that answered nothing; the rename check had
  already been fixed this way and the ledger lookup had not.

### Session 2026-09-03 (NEEDS-REVIEW-2)

Not a retrofit: [ADR-057](../../docs/decision-records/ADR-057-a-drafted-artifact-says-so-at-the-top.md),
revised by [ADR-058](../../docs/decision-records/ADR-058-one-marker-says-a-human-has-not-looked-yet.md),
is this addition's clarify record. A `suggest` or `stub` answer opens its artifact with a
`[NEEDS REVIEW]` marker naming a backlog row (`Backlog: <ID>.`); this capability's part is
proving that row is not made up, the same trust a `provisional` ledger row's own `backlog`
cell already gets under R28. The marker check is fatal (a made-up or absent row is exactly
the fabrication ADR-054 exists to catch) and scans every non-scaffolding markdown file
`elicitation-provenance` already reads, not a separate file set. A second, non-fatal check
reads whether a `provisional` row's own gated files actually carry the marker they promise -
this warns rather than fails, because the marker is how a person finds the gap later, not a
precondition for the row itself; a gated file may not exist yet, or may answer a later
question this point does not gate. `self-verify` is the marker's counter (declared in
[verify-engine](../verify-engine/spec.md)); this capability is the only one that
cross-references what a marker names.

## Scope

[`standard/.claude/elicitation/points.json`](../../standard/.claude/elicitation/points.json)
(the declaration), [`standard/.claude/hooks/elicitation-guard.mjs`](../../standard/.claude/hooks/elicitation-guard.mjs)
(the refusal), [`standard/scripts/elicitation-provenance.mjs`](../../standard/scripts/elicitation-provenance.mjs)
(the ledger check), this repository's own `.claude/settings.json` (the driving side's wiring),
and the repo-own tools that measure them:
[`elicitation-points-check`](../../tools/elicitation-points-check.mjs),
[`elicitation-check`](../../tools/elicitation-check.mjs),
[`elicitation-replay`](../../tools/elicitation-replay.mjs) and
[`validation-claims-check`](../../tools/validation-claims-check.mjs).

## Out of scope

The wording of any individual question - that belongs to the skill that asks it. Whether an
answer, once given, was implemented faithfully: no layer here sees that, and ADR-054 records
it as the known gap rather than claiming coverage.

## Core concepts

- **Point** - a place the standard must ask. Carries its question, its answers in order, the
  provenance states it permits, and the paths it gates.
- **Gated path** - a glob a point owns. A write to it is the act that would settle the point.
- **Call site** - the block in a skill that fires the question. It names the point as
  `[point.id]` beside the call, and the call passes the id on in `metadata.source` - a field
  the person answering never sees, so the header reads as prose (Evidence, Intent). One call
  may put several questions; the field lists every id asked, space-separated.
- **Provenance state** - `pending`, `human`, `provisional`, `inferred`, `absent`,
  `unverified`. What is claimed about how the answer was arrived at.
- **Stub** - a write that declares its point `absent` and leaves the gap visible. Claims
  nothing about a person, so it needs no evidence of one.
- **Ledger** - `docs/adoption-provenance.md`; one row per point, the whole record in one pass.

## Data contracts

| Input | Format | Whose shape it is |
|---|---|---|
| `.claude/elicitation/points.json` | JSON | this capability's. `points[]` with `id`, `asks`, `skill`, `required`, `allowed_provenance[]`, `gate_globs[]`, `why`, `evidence`. |
| the `PreToolUse` payload | JSON on stdin | Claude Code's: `tool_name`, `tool_input.file_path` (or `tool_input.notebook_path` - NotebookEdit's name for its target), `tool_input.content`, `tool_input.new_string`, `tool_input.new_source`, `transcript_path`. No other field is read. |
| the session transcript | JSONL | Claude Code's. Read structurally: an entry whose `message.role` is `assistant` and whose `content[]` holds a `tool_use` named `AskUserQuestion`. Textual matching is explicitly not used - see Invariants. |
| `docs/adoption-provenance.md` | markdown table | this capability's: six cells, `point / state / who / when / landed in / backlog row`. Parsed by position. |
| `standard.manifest.json` | JSON | [verify-engine](../verify-engine/spec.md)'s; read here for `files[].path` and `files[].sha256` only, to tell a shipped template from an adopter's artifact. Never written. |
| `docs/validation/*/runs/*.json` | JSON | the validation corpus's; this capability reads and writes only the `$elicitation` block. |

## Interface contracts

| Tool | Exit | Condition |
|---|---|---|
| elicitation-guard | 0, silent | the tool is neither a write nor a move, the path is gated by nothing, the moved path is untracked, the point's question fired, or the content declares a stub the point permits |
| elicitation-guard | 0, deny JSON | a gated path, or a `Bash` move of a tracked path, with no fired question and no permitted stub; or no transcript to check against |
| elicitation-provenance | 0 | every required point has a row with a permitted state, every `provisional` names a backlog row that exists, every `human` names who and when |
| elicitation-provenance | 1 | a missing ledger, a missing or malformed row, a forbidden state, a named backlog row that is not there, an orphan row, a required point still `pending` once this adoption has written a non-template artifact at a path it gates, a Gate artifact that reached a commit before the guard's own landing commit did, or a `[NEEDS REVIEW]` marker naming no backlog row or one that does not exist |
| elicitation-provenance | 0, warning printed | a `provisional` row whose gated files carry no `[NEEDS REVIEW]` marker - reported, never counted against exit status |
| elicitation-points-check | 0 / 1 | every declared point has a call site, against a baseline that may only shrink / the count grew or the baseline went stale |
| elicitation-check | 0 / 1 / 2 | quotes covered and a question answered / a fabricated quote or no human presence / no transcript to read |
| validation-claims-check | 0 / 1 | every run record states what it can evidence and its counts agree / any does not |

## Requirements

- **R28** (`SPEC.md`) is the shipped rule this capability implements.
- Each point declares which provenance states it permits, and a point whose answer is a
  preference rather than a fact about the repository MUST forbid `inferred`.
- Each point MUST declare `recommended`: the answer that leads. It is the answer converging on
  the standard, or where convergence is not the axis, the answer given now rather than
  deferred. `null` is legal only where no such axis exists, which is consent. The skill MUST
  offer that answer first, and the static check MUST fail when the two disagree.
- A point asked down more than one path MUST declare every one of them - every skill in `skill`
  and every file in `file` - and the static check MUST require a call site in each and read the
  option order of each. A question reaching a greenfield repo and a brownfield one is two option
  lists, and one specification question is put by four skills; only the declared paths are held
  to the rule, and an undeclared one is where the recommendation drifts.
- A file a point declares but which does not exist MUST fail the static check. Skipping it
  silently lets a point pass on the strength of a sibling file it also names.
- Each point MUST declare a `scope`. A `repository`-scoped answer belongs to the repository and
  is asked once: the guard MUST accept a committed ledger row answering it, so that ordinary
  work after the adoption is not refused until it re-asks an adoption question. A `work`-scoped
  answer belongs to the piece of work in front of the run - this specification, this digest,
  this run - and no ledger row MAY satisfy it; it is asked every time.
- The row MUST be committed to count. Reading the working file would let one run write the row
  and the artifact together, which is the laundering the transcript check exists to close.
- Every skill that writes a path a point gates MUST carry that point's call site. A gated path
  with no call site in the skill that writes it is a refusal with no instructions, and a guard
  that cannot be satisfied is a guard that gets removed.
- A point MUST gate an artifact the runs that ask it actually write, and MUST be asked where
  that run still is. `record.participation` gated a path that exists only in this repository,
  so no adoption ever reached it and no adopter was ever asked whether their session could be
  kept; the question a close needs is asked in the intake round, on the artifact the run writes
  first.
- The rule binds every question a run asks, not only the declared ones - a check can only
  reach what is written down, and that is a limit of the check rather than of the rule.
- The declared points are the enforceable floor. A run MUST ask what the repository in front
  of it needs beyond them, and MUST record each such question in the ledger's own section for
  them; `elicitation-provenance` MUST fail when that section is absent.
- Questions MUST be put in the language the person is writing in. Which language the written
  artifacts use is itself a point, never an assumption.
- The guard MUST fail closed: absent or unreadable evidence is a refusal, never a pass. A
  points file that exists and does not parse is a declared gate that cannot be read, so every
  gated write is refused until it is fixed - never treated as if no point had been declared.
  The same holds for the guard's own input: a call payload that does not parse as JSON is
  refused, never read as a call with nothing to check.
- The guard MUST read the transcript structurally. Compaction replays the model's own summary
  of a session back as a user turn, so any textual scan lets the agent vouch for itself.
- A refusal MUST name the point, restate the question and state the three answers. A refusal
  that only says no gets worked around.
- A `provisional` answer MUST name a backlog row that exists.
- Every `[NEEDS REVIEW]` marker MUST name a backlog row, and that row MUST exist - checked
  against every non-scaffolding markdown file, not only the artifacts a ledger row points at.
- A `provisional` row whose gated files carry no `[NEEDS REVIEW]` marker MUST be reported, but
  MUST NOT fail the check - the row is a promise about a future write, not evidence one
  happened yet.
- A validation run record MUST state which claim its observations support, and `human` MUST
  name a transcript file that is present.
- The guard MUST reach a commit before any of the three Gate artifacts it protects does -
  `docs/adoption-intake.md`, `docs/adoption-assessment.md`, `.standards-version` - checked by
  commit ancestry, never a date: a `PreToolUse` hook binds only once a session with it wired
  has started, so a fresh adoption that committed one of these first ran the very step this
  rule exists to enforce with nothing enforcing it (ADR-054's own named gap, closed by
  ADR-059). Exempted whenever `.standards-version` already existed the commit before the
  guard's own commit - the update-to-latest shape, not a fresh skip - and whenever the ledger
  this check reads sits under a subdirectory ROOT, which is this project's own shipped tree
  dogfooding itself rather than an adopter's repository.
- A checkout that drives adoptions MUST wire the guard for its own sessions, and MUST judge
  only the writes that leave it. Which side it is on is read from the tree's own shape - the
  shipped tree under `standard/` - never from configuration a repository could set for itself.
  Without this the adoption run is the one run nothing enforces: the hook binds from the
  session's own project directory, so what an adoption lands in the target covers every later
  session there and none of the one doing the landing (ADR-060).
- The ledger a write is checked against - the file, and the committed row behind a settled
  repository-scoped point - MUST be read in the work tree that owns the write, not in the
  working directory. A run that writes into another repository is the normal case here, not
  the exotic one.

## Invariants

- A write to a gated path, or a move of a path git already tracks, is refused, permitted by a
  fired question, or permitted by a declared stub. There is no fourth outcome, and no
  environment variable adds one. Which writes a checkout judges is a separate question from
  what happens to a judged one, and it is answered by the tree's shape for the same reason:
  a switch is an exemption whoever holds the settings file can grant themselves.
- What the repository had before the adoption is never read as evidence that somebody was
  asked, and neither is what it wrote before this layer existed: the boundary is the commit
  that introduced the point list, so a repository taking this layer through an update is
  judged only for what it writes from then on. Where that boundary cannot be drawn, the check
  announces it and stands down; it never passes quietly.
- The point id an `AskUserQuestion` call carries - in `metadata.source`, or in the header as
  `[point.id]` as every transcript before 1.0.4 did - is the only link between a question and
  the artifact it licenses. A question without one counts as not asked.
- The guard proves a question happened. It does not and cannot prove the answer was honoured;
  nothing here may be described as if it does.
- Coverage never grows silently: `elicitation-baseline.json` may shrink, and a stale baseline
  fails exactly like a grown one.

## Acceptance criteria

- GIVEN a session in which `[adopt.personas]` never fired WHEN the agent writes
  `docs/personas.md` THEN the guard refuses, naming the point and its three answers.
- GIVEN the same session WHEN the written content declares `adopt.personas: absent` THEN the
  write is allowed.
- GIVEN a session whose only mention of a question is prose - including a compaction summary
  replayed as a user turn - WHEN the agent writes the gated artifact THEN the guard refuses.
- GIVEN a session that fired each point's question before its write THEN no write is refused.
- GIVEN the recorded stayget adoption transcript WHEN replayed past the guard THEN all five
  of its artifact writes are refused.
- GIVEN a checkout that carries the shipped tree under `standard/` WHEN it writes a gated path
  in its own tree THEN the write is allowed, and WHEN it writes the same path in another
  repository with no question asked THEN the write is refused.
- GIVEN a gated write into another repository whose committed ledger answers the point THEN it
  is allowed, and GIVEN the same write where only the driving checkout's ledger answers THEN it
  is refused.
- GIVEN a ledger whose `provisional` row names a backlog row that is not in the backlog THEN
  `elicitation-provenance` exits 1 naming that row.
- GIVEN a session in which `[adopt.layout]` never fired WHEN the agent runs `git mv` on a path
  the repository already tracks THEN the guard refuses; WHEN the moved path is untracked THEN
  it does not. The target directory is read in every spelling the tools accept - `-t DIR`,
  `-tDIR`, `--target-directory=DIR` - so none of them hides the source.
- GIVEN a `points.json` that exists and does not parse WHEN the agent writes any gated path
  THEN the guard refuses, naming the file, until the JSON is fixed.
- GIVEN a call payload that does not parse as JSON - a truncated or malformed `PreToolUse`
  invocation - WHEN the agent writes any gated path THEN the guard refuses; it does not read
  the unparseable payload as a call with no command to check.
- GIVEN a repo where this adoption wrote a record at a path `adopt.records` gates, and that
  row still reads `pending`, THEN `elicitation-provenance` exits 1.
- GIVEN a repo whose decision records were committed before the adoption's own commit THEN it
  exits 0 - a brownfield repository's own history is not evidence of a question.
- GIVEN a tree that is not a git work tree THEN it says the boundary cannot be drawn and
  leaves `pending` rows alone, rather than passing silently.
- GIVEN the same row and a gated file still byte-identical to the template that shipped there
  THEN it exits 0 - a fresh adoption is not a finding.
- GIVEN a repo holding real decision records under `docs/decision-records/` - a directory the
  manifest ships - THEN those records read as the adopter's work, not as that directory's
  scaffolding.
- GIVEN a skill whose first option is not the point's declared `recommended` THEN
  `elicitation-points-check` exits 1 naming both; GIVEN a point that declares no `recommended`
  key at all THEN it exits 1; GIVEN `recommended: null` THEN it passes.
- GIVEN a point declaring two skills, one of which asks it and one of which does not, THEN
  `elicitation-points-check` exits 1 naming the skill that does not; GIVEN a point declaring a
  file that does not exist THEN it exits 1 saying so.
- GIVEN a repository-scoped point whose answered row is committed THEN a write to the path it
  gates is allowed with no question in this session; GIVEN the same row uncommitted THEN the
  write is refused; GIVEN a work-scoped point whose answered row is committed THEN the write is
  refused anyway.
- GIVEN a point declaring two files, one leading with the recommended answer and one leading
  with another THEN `elicitation-points-check` exits 1 and says which of the call sites
  disagrees; GIVEN both leading with it THEN it passes.
- GIVEN a skill file that mentions a point id in prose before the heading that calls it THEN
  the check reads the option list under the heading, not the one nearest the mention.
- GIVEN a ledger with no section for questions no point declares THEN `elicitation-provenance`
  exits 1.
- GIVEN a repository that adopted the standard long before this layer, whose personas and
  decision records were committed then, WHEN the point list arrives uncommitted in this run
  THEN it exits 0 - those files predate every question and cannot evidence a skipped one.
- GIVEN a validation run record claiming `"provenance": "human"` with no transcript on disk
  THEN `validation-claims-check` exits 1.
- GIVEN a `[NEEDS REVIEW]` marker naming a backlog row that exists THEN
  `elicitation-provenance` passes; GIVEN the same marker naming a row that does not exist, or
  naming no row at all, THEN it exits 1 naming the file and the problem.
- GIVEN the shipped elicitation README's own two illustrative marker blocks THEN they are not
  read as live markers - scaffolding is skipped, so an adopter who has not touched the file is
  never failed by it.
- GIVEN a `provisional` row whose gated file carries no `[NEEDS REVIEW]` marker THEN
  `elicitation-provenance` still exits 0 and prints a warning naming the point; GIVEN the
  gated file carries the marker THEN nothing is printed about it.

## Open questions

None known.
