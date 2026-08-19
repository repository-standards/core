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
- Q: What makes `pending` stop being acceptable? A: the point being reached - a path it gates
  holding an artifact that did not ship as a template. `.standards-version` was tried first
  and is wrong: it is written before anybody has been asked anything, so it fails every fresh
  adoption and the shipped tree itself.
- Q: Delete the validation corpus that measured nothing? A: No. The observations are real
  records of real work; what they lacked was a statement of which question they answer.

## Scope

[`standard/.claude/elicitation/points.json`](../../standard/.claude/elicitation/points.json)
(the declaration), [`standard/.claude/hooks/elicitation-guard.mjs`](../../standard/.claude/hooks/elicitation-guard.mjs)
(the refusal), [`standard/scripts/elicitation-provenance.mjs`](../../standard/scripts/elicitation-provenance.mjs)
(the ledger check), and the repo-own tools that measure them:
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
- **Call site** - the block in a skill that fires the question, carrying the point id in the
  `AskUserQuestion` header as `[point.id]`.
- **Provenance state** - `pending`, `human`, `provisional`, `inferred`, `absent`,
  `unverified`. What is claimed about how the answer was arrived at.
- **Stub** - a write that declares its point `absent` and leaves the gap visible. Claims
  nothing about a person, so it needs no evidence of one.
- **Ledger** - `docs/adoption-provenance.md`; one row per point, the whole record in one pass.

## Data contracts

| Input | Format | Whose shape it is |
|---|---|---|
| `.claude/elicitation/points.json` | JSON | this capability's. `points[]` with `id`, `asks`, `skill`, `required`, `allowed_provenance[]`, `gate_globs[]`, `why`, `evidence`. |
| the `PreToolUse` payload | JSON on stdin | Claude Code's: `tool_name`, `tool_input.file_path`, `tool_input.content`, `tool_input.new_string`, `transcript_path`. No other field is read. |
| the session transcript | JSONL | Claude Code's. Read structurally: an entry whose `message.role` is `assistant` and whose `content[]` holds a `tool_use` named `AskUserQuestion`. Textual matching is explicitly not used - see Invariants. |
| `docs/adoption-provenance.md` | markdown table | this capability's: six cells, `point / state / who / when / landed in / backlog row`. Parsed by position. |
| `standard.manifest.json` | JSON | [verify-engine](../verify-engine/spec.md)'s; read here for `files[].path` and `files[].sha256` only, to tell a shipped template from an adopter's artifact. Never written. |
| `docs/validation/*/runs/*.json` | JSON | the validation corpus's; this capability reads and writes only the `$elicitation` block. |

## Interface contracts

| Tool | Exit | Condition |
|---|---|---|
| elicitation-guard | 0, silent | the tool is not a write, the path is gated by nothing, the point's question fired, or the content declares a stub the point permits |
| elicitation-guard | 0, deny JSON | a gated path with no fired question and no permitted stub; or no transcript to check against |
| elicitation-provenance | 0 | every required point has a row with a permitted state, every `provisional` names a backlog row that exists, every `human` names who and when |
| elicitation-provenance | 1 | a missing ledger, a missing or malformed row, a forbidden state, a named backlog row that is not there, an orphan row, or a required point still `pending` once a path it gates holds a non-template artifact |
| elicitation-points-check | 0 / 1 | every declared point has a call site, against a baseline that may only shrink / the count grew or the baseline went stale |
| elicitation-check | 0 / 1 / 2 | quotes covered and a question answered / a fabricated quote or no human presence / no transcript to read |
| validation-claims-check | 0 / 1 | every run record states what it can evidence and its counts agree / any does not |

## Requirements

- **R28** (`SPEC.md`) is the shipped rule this capability implements.
- Each point declares which provenance states it permits, and a point whose answer is a
  preference rather than a fact about the repository MUST forbid `inferred`.
- The guard MUST fail closed: absent or unreadable evidence is a refusal, never a pass.
- The guard MUST read the transcript structurally. Compaction replays the model's own summary
  of a session back as a user turn, so any textual scan lets the agent vouch for itself.
- A refusal MUST name the point, restate the question and state the three answers. A refusal
  that only says no gets worked around.
- A `provisional` answer MUST name a backlog row that exists.
- A validation run record MUST state which claim its observations support, and `human` MUST
  name a transcript file that is present.

## Invariants

- A write to a gated path is refused, permitted by a fired question, or permitted by a
  declared stub. There is no fourth outcome, and no environment variable adds one.
- The point id in an `AskUserQuestion` header is the only link between a question and the
  artifact it licenses. A question without one counts as not asked.
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
- GIVEN a ledger whose `provisional` row names a backlog row that is not in the backlog THEN
  `elicitation-provenance` exits 1 naming that row.
- GIVEN a repo where a path `adopt.records` gates holds a record that did not ship, and that
  row still reads `pending`, THEN `elicitation-provenance` exits 1.
- GIVEN the same row and a gated file still byte-identical to the template that shipped there
  THEN it exits 0 - a fresh adoption is not a finding.
- GIVEN a repo holding real decision records under `docs/decision-records/` - a directory the
  manifest ships - THEN those records read as the adopter's work, not as that directory's
  scaffolding.
- GIVEN a validation run record claiming `"provenance": "human"` with no transcript on disk
  THEN `validation-claims-check` exits 1.

## Open questions

None known.
