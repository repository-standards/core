# Elicitation

The places this standard must ask a person instead of deciding for them, and the shape
every one of those questions takes.

`points.json` is the declaration. `tools/elicitation-points-check.mjs` fails when a
declared point has no call site, against a baseline that may only shrink.

## Why this is a mechanism and not advice

The rule existed as prose first and did not hold. `onboard.md` said to mark inferred work
unconfirmed and put the interview in the backlog; a full adoption ran without doing it,
wrote five personas, appended a section to thirty-three records their owner had written,
seeded a twenty-item backlog with owners, moved the repository's own `docs/ADR` and
`docs/BDR` under the standard's directory name across seventy-eight files, and quoted the
owner declaring a full migration in a sentence the session transcript shows he never typed.
One question was asked in the whole run, about duplicated hooks, because the duplication
was the only thing mechanically visible.

A skill that says "ask" has no way to ask. `AskUserQuestion` blocks once it is called - the
gap was never in the blocking, it was in reaching the call.

## The shape

Every question offers the same three answers, in this order:

| Answer | Means | Records |
|---|---|---|
| **answer** | the person decides now | `human` |
| **suggest** | the agent proposes, the person checks later | `provisional` + a backlog row naming the point |
| **stub** | placeholder, do not guess | `absent`, with a visible gap marker |

`suggest` is not a way around the question. It counts as human presence: it is
attributable, timestamped, and produces an artifact that says what it is. The failure this
prevents is not "the agent proposed something" - it is "the agent proposed something and
the record reads as though a person agreed".

A run with nobody watching still asks. The answer records as `inferred` and the run is
labelled unattended, so the flow stays identical and testable, and the artifact still says
who decided. A question that never fires is the only illegitimate outcome.

## Carrying the id

The question's header carries its point id in brackets - `[adopt.layout] directory naming`.
Without it the replay layer can only count questions, and count is exactly the metric that
let eighteen missing questions look like a working product.

## Provenance

| State | Meaning |
|---|---|
| `human` | answered by a person, checkable against the session transcript |
| `provisional` | agent-authored under an explicit `suggest`, awaiting verification |
| `inferred` | concluded from the repository and said so - never valid where the answer is a preference rather than a fact |
| `absent` | deliberately empty under `stub` |
| `unverified` | claimed human, no transcript to check against - counted separately, never folded into "validated" |
