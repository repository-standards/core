---
status: Accepted
date: 2026-09-16
---

# ADR-062: a contributed run is the full run, anonymised, or nothing

## Context

ADR-045 gave `record-run` two consent levels: Level 1, the user's literal turns with three
summary yes/nos and one result line, and Level 2, the same plus the agent's own text, the tool
log and the repository slug. ADR-061 then gave the intake point `adopt.evidence` three
answers: **send it**, **send it, once I have read it**, **send nothing**.

Two external records have arrived since. `anon-r3k` (2026-09-04) and `anon-x8v` (PR #143,
2026-09-16, closed unmerged) both chose Level 1. Both carry `provenance: unverified` and
`transcript: null`, and not one of their verdicts can be replayed by anybody who was not in
the session: the scoring was done from memory of the run by the session that ran it. ADR-045's
own revisit clause named this outcome - "Level 1 alone proves to still collect too little to
explain a finding" - and `record-run` already stated that every finding the human-prompting
method has produced so far needed the agent's own text. The cheaper branch was offered so
that a smaller yes would beat a large no; what it collected was a record that is not evidence.

The owner's decision, 2026-09-16: the full run is always what is wanted, and that decision is
not handed to the adopter - either they contribute something real that can be checked, or
they do not contribute. If they agree, everything is anonymised.

## Options considered

- **A - Keep both levels; recommend Level 2.** Rejected: a choice the adopter can take the
  cheaper branch of is still a choice, and the two records so far show which branch gets
  taken.
- **B - Level 1.5: agent text without the slug, as a third option beside the two.** The
  middle ground - what the corpus needs to explain a finding, minus the name. Rejected for
  the same reason as A: three branches is still a menu with a cheapest item on it, and the
  point of this decision is that there is no cheaper branch. What Level 1.5 describes is not
  a third option; it is the one shape, made mandatory.
- **C - One shape: the full run, fully anonymised, or nothing (chosen).** The record carries
  the literal user turns, the agent's text verbatim, the tools that ran in order (names only,
  never their input or output), the scoring and the result line, and nothing that identifies
  the repository: an opaque code not derived from its name, no owner, no paths, no hosts, no
  usernames. Consent is one intake question with two answers.

Two further variants were rejected on the way to C:

- **A held-for-review answer** (ADR-061's **send it, once I have read it**). The pull request
  `record-run` opens from the adopter's own account is the review: it is theirs to edit or
  close before anyone upstream reads it, so a second look in the session adds a step without
  adding a safeguard. And the 2026-09-03 measurement behind ADR-061 showed adopters take the
  last answer on a list; a middle answer only moves where the run stalls.
- **A named, not anonymised, variant.** Both external records so far were anonymised and
  private, so the name buys the evidence nothing - a finding is replayed from the turns, not
  from the slug. A list of adopters willing to be named is a marketing surface, kept
  separate from the evidence record if it is ever kept at all.

## Decision

Option **C**.

- `adopt.evidence` has two answers, in order: **send it** (recommended) / **send nothing**.
  Its `asks` says what goes out and that it is anonymised. `allowed_provenance` stays
  `human` alone.
- `record-run` asks no consent question at the close. It reads the intake answer from the
  **Evidence** line of `docs/adoption-intake.md`; under **send it** it assembles the full run,
  scrubs it, shows the assembled record once in the session as a courtesy, and opens the pull
  request from the adopter's account; under **send nothing** it records nothing and says so.
  `record.participation` (whose run this is, and may the excerpt be kept) is retired. Its
  second half is consent, settled at intake. Its first half is answered without asking: the
  pull request opens from the adopter's own account, so `real-adoption` is read off the
  author - a maintainer's own run keeps the `validation` scope - and whether a person
  answered the questions or the agent answered for itself is read off the agent turns the one
  shape always carries. The ADR-054 failure, a maintainer's run recorded as an external
  adopter's, cannot recur from an answer typed at the close because no answer is typed at
  the close. The write gate on `docs/validation/**/runs/*.json` moves to `adopt.evidence`,
  so a run record still needs a human intake answer in the transcript before it is written.
- Every record gets an opaque code; the subject line `feat(real-adoption): <code>, <stack> -
  what the run showed` never carries a repository name.
- The step-3 scrub is unchanged and now also replaces the repository's name, owner and slug
  wherever they occur in the record.
- `tools/human-prompting.mjs` refuses a run record dated after 2026-09-16 that carries no
  agent turn and no transcript. Records before that date are history and still pass.

This revises ADR-045 (decision point 2, the two-level split), ADR-061 (the three-answer
set) and ADR-054 (the `record.participation` point it declared; the provenance states on
run records stand). Everything else in the three stands: the corpus `record-run` feeds, the
scrub, the intake placement, the once-per-run consent, the recommended default, the guard.

## Consequences

- Positive: every record that arrives from now on can be replayed - the verdicts sit next to
  the text they were scored against.
- Negative, stated plainly: some adopters who would have sent prompts only will now send
  nothing. That is accepted; the prompts-only record was not paying for the row it took.
- `record-run` asks nothing at the close, and the ledger template loses one row. What the
  retired question used to attest - that a person, not the agent, stood behind the record -
  is now attested by the pull request author and by the transcript, neither of which the
  agent can type for itself.
- Negative: the scrub carries more weight, since the agent's text is now always in the
  record and may quote what a tool read. Step 3 drops raw tool input and output outright,
  and the pull request from the adopter's own account is the human read in front of the
  merge.

## Compliance

- `standard/.claude/elicitation/points.json`: `adopt.evidence.asks` and `why` rewritten,
  `recommended` stays `"send it"`, and the point gates `docs/validation/**/runs/*.json` as
  well as the intake file; `record.participation` removed. `tools/elicitation-guard-test.mjs`
  asserts the record is still refused without the intake answer and allowed with it.
- `skills/align-to-standards/intake.md`: the `[adopt.evidence]` block lists two options.
- `skills/align-to-standards/steps.md` step 8, `standard/docs/adoption-intake.md`,
  `CONTRIBUTING.md`, `docs/validation/human-prompting/reporting.md`,
  `services/adoption-stats/README.md`: the two-level and three-answer wording is gone.
- `skills/record-run/SKILL.md`: one shape, no consent question at the close, opaque code on
  every record.
- `tools/human-prompting.mjs` and its test: the dated refusal above.

## Revisit when

- A pull request opened under **send it** carries something the scrub missed and the adopter
  did not catch before merge - the pull request is the review, and this decision removed the
  in-session read that used to sit in front of it.
- Real adoptions show **send nothing** taken so consistently that the corpus stops growing at
  all - the trade here is fewer records for checkable ones, not none.

## Related

- [ADR-045](ADR-045-record-run-feeds-the-existing-corpus-consent-gated.md) - the two-level
  split this revises; its corpus destination, scrub and consent gate stand.
- [ADR-061](ADR-061-adopt-evidence-recommends-sending-and-consent-is-asked-once.md) - the
  three-answer set this narrows to two; its once-per-run consent and recommended default
  stand.
- [ADR-054](ADR-054-asking-is-a-mechanism-with-provenance-not-an-instruction.md) - declared
  `record.participation`; the point is retired here, the mechanism and the provenance states
  stand.
