# Elicitation

The places this standard must ask a person instead of deciding for them, and the shape
every one of those questions takes.

`points.json` is the declaration. Three things read it, and each catches what the one
before it lets through:

| Layer | What it proves | When it fires |
|---|---|---|
| `elicitation-points-check` | every declared point has a call site somewhere in a skill | every pull request, against a baseline that may only shrink |
| `elicitation-check` | the answers in a finished run were really given, and the quotes were really said | against a session transcript, after the fact |
| `.claude/hooks/elicitation-guard.mjs` | the artifact is not written until its question fired | at the moment of the write, and it is not the agent's decision |

Only the third is unskippable, and only the third is useless on its own: it knows a
question happened, not whether the answer was honoured.

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

A run with nobody watching takes the third answer. It cannot ask - so it writes the stub,
declares the point `absent` in the artifact's provenance, and leaves the gap visible; the
run then reads as unfinished, which is what it is. `inferred` is narrower than it sounds
and most points refuse it outright: concluding a preference from a repository is guessing
with a better name, and guessing dressed as a finding is the failure that produced all of
this. A handful of points refuse the stub too - who the repo is for, what the owner meant
by the adoption - and an unattended run simply stops there rather than inventing an answer.

Which is the point. Not asking is allowed; **not asking and shipping an answer anyway** is
not.

## Carrying the id

The question's header carries its point id in brackets - `[adopt.layout] directory naming`.
Without it the replay layer can only count questions, and count is exactly the metric that
let eighteen missing questions look like a working product.

## What the guard actually refuses

A `Write` or `Edit` to a path some point gates is refused unless one of two things is true:
that point's question already fired in this session, or the content being written declares
the point `absent` (`adopt.personas: absent`, in frontmatter or as a JSON key - either
spelling is read).

A `Bash` command that moves a path **git already tracks** is refused the same way, under
`adopt.layout`. Renaming is not forbidden - reshaping what a repository already has into the
standard's layout is a legitimate and often useful thing to do, and the question offers it as
the first answer. What is forbidden is doing it without asking, which is how seventy-eight
files changed name and fifty-three links broke in a single unattended run. A file the
adoption itself created is untracked, and moving it is nobody's business but the run's.

It fails closed. No transcript to check against means refused, because a guard that waves
work through when it has no evidence is the defect it was built to catch, wearing the
uniform of the fix.

Thirteen of the eighteen points are enforced here - twelve by the path they gate,
`adopt.layout` by the rename. `adopt.continue` is a phase boundary, which is not a tool call
at all, so the static check and human review carry that one; the guard says so rather than
implying coverage it does not have.

## Provenance

| State | Meaning |
|---|---|
| `human` | answered by a person, checkable against the session transcript |
| `provisional` | agent-authored under an explicit `suggest`, awaiting verification |
| `inferred` | concluded from the repository and said so - never valid where the answer is a preference rather than a fact |
| `absent` | deliberately empty under `stub` |
| `unverified` | claimed human, no transcript to check against - counted separately, never folded into "validated" |
