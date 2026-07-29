# ADR-019: Lifecycle procedures are agent-portable - Claude skills are the reference form

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-29 |
| **Author** | Łukasz Bodurka |
| **Tags** | agents, skills, portability, manifest |

## Context

The manifest required `.claude/skills` and `scripts/spec` for the core profile,
citing rules that never mention them: the CI-gate rule mandates that the guards
gate CI, and the clarify rule mandates passing the gate - neither says a repo
must carry a Claude-format skill directory. The practical consequence was worse
than the citation gap: a team whose agent tooling is Cursor, Copilot or Windsurf
could not reach drift 0 without committing another vendor's agent layout, which
undercuts the "stack-agnostic Layer 1" positioning. Yet dropping the requirement
entirely would gut the standard's core promise - the lifecycle procedures (the
spec loop, backlog capture, pre-PR review, version updates) are the standard as
executable behavior, and a repo without them has the documents but not the
practice.

## Options considered

- **A - Make the skills optional (`required: false`).** Honest about vendors, but
  a compliant repo could then carry no executable procedures at all - the loop
  the standard exists for becomes a suggestion.
- **B - Ship the procedures for every agent vendor.** Multiplies maintenance by
  the number of vendors, each with its own format churn; the standard would spend
  its energy tracking vendor formats instead of the method. Premature today.
- **C - One reference implementation, mandatory port (chosen).** The procedures
  themselves become normative; the shipped Claude form is the reference; any
  other agent setup ports them - strictly and completely - to its own mechanism.

## Decision

Option **C**. Concretely:

1. A new spec rule (R22) makes the lifecycle procedures normative: they MUST ship
   in the repo in a form the repo's coding agent can execute.
2. `.claude/skills/` plus `scripts/spec/` is the **reference implementation** -
   the paved road, shipped in the tree, required by the manifest.
3. A repo whose agent tooling is not Claude MUST port the shipped skills to its
   agent's own instruction mechanism (e.g. `.agents/skills`) - strictly, file by
   file, gates included - before claiming compliance. The manifest's `altPaths`
   accepts the ported location, so `self-verify` counts either form.
4. A partial port is drift, not a variant: the port carries every procedure and
   every gate, or the repo is not aligned.
5. The manifest entries for `.claude/skills` and `scripts/spec` cite R22 - the
   rule they actually enforce.

## Consequences

- Positive: the citation gap closes (every manifest entry names a rule that
  really demands it); non-Claude teams have a legal, verifiable path to drift 0;
  the procedures stay normative instead of becoming optional decoration.
- Negative: "strictly and completely" is review-verified, not mechanical -
  self-verify can check the ported directory exists, not that the port is
  faithful; the port is real work for a non-Claude team, and it is on them to
  keep it current when the reference skills move.

## Revisit when

A second agent format stabilizes enough (adoption + spec stability) that shipping
it alongside the Claude form costs less than every adopter porting individually -
then option B returns for that one format.

## Related

- ADR-009 (skills lifecycle vs transition), ADR-012 (in-repo instructions are
  the source of truth), ADR-015 (the extracted engine the skills invoke).
