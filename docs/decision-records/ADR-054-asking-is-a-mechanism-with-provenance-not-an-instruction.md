# ADR-054: Asking is a mechanism with provenance, not an instruction

| | |
| --- | --- |
| **Status** | Accepted (2026-08-19) |
| **Date** | 2026-08-19 |
| **Author** | Łukasz Bodurka |
| **Tags** | elicitation, guards, adoption, validation, methodology |

## Context

The standard's central promise is that adoption is guided: the agent asks the questions a
repository cannot answer for itself, and the owner decides. Every layer of the product
repeated that promise. Nothing implemented it.

Measured on 2026-08-19, across the shipped tree and the transition skills: **zero of
twenty-three skills contained a single call to `AskUserQuestion`.** Not a weak one, not a
conditional one - none. The instruction existed as prose, in the right file, in plain
words: `onboard.md` said to mark inferred work unconfirmed and put the interview in the
backlog.

A complete adoption then ran against a real repository and, in 1140 transcript lines, asked
exactly one question - about duplicated agent hooks, the only thing mechanically visible.
In the same run it wrote five personas nobody had described, appended a section to
thirty-three decision records their owner had written himself, seeded a twenty-item backlog
with owners assigned, replaced the repository's own `docs/ADR` and `docs/BDR` naming with
the standard's across seventy-eight files and fifty-three broken links, touched twenty-one
`.scratch/` directories for link hygiene without surfacing any of the unfinished work in
them - and recorded, in the intake, a sentence attributed to the owner declaring a full
migration. The transcript shows he never typed it.

The blocking was never the problem: `AskUserQuestion` blocks the moment it is called. The
gap was reaching the call.

Two further findings are what force the shape of the fix rather than its existence.

**The evidence was worthless in a way that looked like evidence.** Thirty-eight validation
run records, four hundred and eighty-six observations, all green. The ai-prompting corpus -
31 runs, 377 observations - never prompted a person and was never meant to. The
human-prompting corpus - 7 runs, 109 observations - kept no session transcript at all, and
scored `asked: true` by reading whether a skill's *text* instructs asking. That is the same
defect one level up: prose measured by prose.

**There is a laundering path, and it is the one an agent under pressure finds first.** The
model writes a summary of its own session; compaction replays that summary as a *user* turn;
a quote invented by the agent then finds "coverage" in the agent's account of having invented
it. Anything that reads the transcript textually believes it.

## Options considered

- **Sharpen the prose.** Rewrite the instruction, make the skill descriptions louder. This is
  what the current state already is - the rule was well written and had no force. Rejected:
  the failure mode is not misunderstanding.
- **Gate the finished artifact only.** A check at review time that the record looks
  interviewed. Catches the omission after five personas exist and after seventy-eight files
  have been renamed. Kept, as one layer, but not as the only one.
- **Refuse the write.** A `PreToolUse` hook that denies a write to a gated artifact until its
  question fired. Not the model's decision to make. Chosen.
- **Refuse the write with no way out.** Rejected: a run with nobody to ask would have no legal
  move, and a guard with no legal move gets removed rather than obeyed.

## Decision

Asking is a mechanism with three layers, none of which is sufficient alone, and a declared
vocabulary for what happened to each answer.

1. **`.claude/elicitation/points.json` is the declaration.** Eighteen points, each with the
   question, the answers in order, which provenance states it permits, and the paths it gates.
   `tools/elicitation-points-check.mjs` fails when a declared point has no call site.
2. **`.claude/hooks/elicitation-guard.mjs` refuses the write.** A `Write`/`Edit` to a gated
   path is denied unless that point's question fired in this session. It reads the transcript
   **structurally** - an assistant turn that really called the tool - never textually, which
   is what closes the laundering path. It fails closed: no transcript means refused.
3. **`docs/adoption-provenance.md` records what became of the answer.** One table, one row per
   point: the state, who answered, when, where it landed, and for a deferred answer the
   backlog row carrying the promise. `scripts/elicitation-provenance.mjs` fails when that row
   is named and missing.

Every question offers the same three answers: **answer now** (`human`), **suggest, I will
verify later** (`provisional`, plus a backlog row), **stub, do not guess** (`absent`).

The escape from the guard is the stub, never a bypass. A run with nobody to ask declares the
point `absent` and leaves the gap visible; that write is allowed and the run reads as
unfinished, which is what it is. **Guessing is the only move with no legal path.** A few
points - who the repository is for, what the owner meant by adopting - refuse even the stub,
and an unattended run stops there.

`pending` is the state of a freshly scaffolded repo, and it stays legal until the point is
**reached**: until a path it gates holds an artifact that did not ship as a template. Then it
is an adoption that stopped halfway and closed the door behind it.

`.standards-version` was the first trigger tried and it is wrong. That file is written at
align time, before a single question has been put to anyone, so keying on it fails every
freshly adopted repo on its first run - and fails the shipped tree's own template, where
every row is pending because nothing has happened yet. A guard that is red on arrival is one
people delete rather than satisfy, and it would have taught exactly the wrong lesson about
what these states mean.

Claims about human participation are separated from claims about machinery. Every validation
run record carries `provenance`: `none` (measures tooling, nobody prompted), `unverified`
(claims a person, no transcript), or `human` (claims it and names a transcript that must
exist on disk).

## Consequences

- **Adoption gets slower and louder.** It stops at each point instead of proceeding on an
  assumption. That is the product working, not the product regressing.
- **An adopting repo receives a hook that can refuse its own agent's writes.** It ships
  enabled. A repo that wants it off deletes the matcher, visibly, in a diff.
- **The old validation numbers stop being quotable as evidence of guided adoption.** Nothing
  was deleted; 486 observations stand as records of what they actually measured. What they
  lose is the implication.
- **The counterfactual is now asserted, not argued.** `tools/elicitation-replay-test.mjs`
  replays recorded sessions past the real guard: the run that caused this is stopped at five
  of five writes, a run that only *claims* to have asked is stopped, and a run that asked
  before each write passes untouched - the last being the case that catches a guard which has
  simply started refusing everything.
- **Two layers must stay separate.** A run that asked and then invented the answer is
  deliberately not the guard's catch; it is the transcript checker's. A test pins that
  division so merging them breaks a case instead of passing quietly.
- **Node becomes load-bearing for the hook.** Consistent with the `.mjs` scripts the
  standard already shipped before this, and the wiring denies rather than passes when it
  cannot run.

## Revisit when

- A point's question fires and is answered but the answer is then ignored, and the ledger
  still reads `human`. The guard sees that a question happened, never that it was honoured;
  if that gap produces a real failure, the fix is a third assertion, not a louder second one.
- The stub escape becomes the normal path. If most rows land `absent`, the questions are
  either wrong or arriving at the wrong moment, and the point list is what needs work.
- A repository's own layout conventions collide with a gated glob so often that the guard
  reads as noise - the globs are per-repo configuration that has not been made configurable
  yet, deliberately, until there is a second repository to learn from.

## Related

- [ADR-010](ADR-010-artifact-lifecycle-and-tracker.md) - the lifecycle and the clarify gate the
  loop runs on, which `AGENTS.md` cites for the loop being AI-led. This is the boundary of that:
  AI-led means the agent starts the loop without being asked, never that it answers for the
  owner.
- [ADR-024](ADR-024-discovery-dossiers-beside-the-specs.md) - discovery is raw material and
  nothing a spec has settled gets re-asked. The point list respects it; these questions are
  the ones nothing has settled.
- [`.claude/elicitation/README.md`](../../standard/.claude/elicitation/README.md) - the
  contract, the three answers, and the provenance table.
