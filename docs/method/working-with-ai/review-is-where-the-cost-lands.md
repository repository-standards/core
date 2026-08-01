# Review is where the cost lands

**Practice:** generation got cheap and review did not, so pay for reviewability while you
generate: one intent per change, the spec in the PR, evidence instead of assertions - and
never hand a reviewer output you have not read yourself.
**Confidence:** **strong** - the same shift is visible in survey data, in code-level
measurements, and in a well-documented open-source collapse.
**Decays:** **slow**. This is an economic argument, and better models make it *stronger*, not
weaker: more plausible output per hour is more output to check.
**What would change this:** automated review a team genuinely trusts to gate a merge with no
human reading the diff - demonstrated by escaped-defect rates, not by adoption numbers.
**Last checked:** 2026-08-01

## The report

*"I can produce four PRs a day now. My reviewer can still review one."*
*"The description was beautiful. The code did not do what the description said."*
*"It is faster for me to rewrite it than to work out which 5% of this is wrong."*

The complaint is never about the agent's speed. It is about where the speed sends the work.

## Is it true

**Yes, and there is a documented case of it breaking a project's process outright.** The curl
project ran a public bug bounty for years. By July 2025 its maintainer reported that roughly
**20%** of submissions were AI-generated slop while the share of genuinely valid reports had
fallen to about **5%** - with a report typically pulling in three or four people from a
seven-person security team, for thirty minutes to a few hours **each**
`[Incident: curl 2025-2026]`. The volume was cheap to produce and expensive to disprove. In
January 2026 the project ended the bounty programme.

The second half of that story matters just as much: when an experienced researcher used
AI-assisted tooling **and did the verification work himself**, curl got a batch of genuinely
valuable findings that led to real fixes, and the same maintainer said so publicly. The
tool was never the problem. **Unverified volume** was the problem.

**Inside companies it is now reaching the point of open refusal.** In May 2026 an engineer
posted that he had announced at a company-wide meeting that he would stop reviewing
AI-generated pull requests from colleagues who could not explain the code they were
sending - and reported broad support, including from leadership. The thread drew about 1,900
points and 442 comments `[Field: review refusal 2026]`. His own summary of what he learned is
the thesis of this note: the issue is not AI-written code, it is code **nobody owns or
understands**, and the cost ratio between generating a change and reviewing it has collapsed
onto the reviewer. Review breaks down at the moment the reviewer becomes the only person
reasoning about the system.

**The same asymmetry shows up in the survey data.** The single biggest frustration, at
**66%**, is output that is *almost right but not quite* `[Survey: Stack Overflow 2025]` -
precisely the class a reviewer cannot catch by skimming, because it looks like the correct
answer. And at code level, duplication keeps rising while consolidation falls: moved
(refactored) lines went from 25% of changed lines in 2021 to under 10% in 2024
`[Data: GitClear 2025]` and 3.8% by 2026 `[Data: GitClear 2026]`. More surface to review,
more copies of the same mistake, less consolidation.

**And the delivery data closes the loop.** DORA's 2025 research found AI raising throughput
while delivery stability stayed negatively associated with adoption
`[Survey: DORA 2025]` - which is what "more change than your review and test capacity
absorbs" looks like from the outside.

## What is actually happening

Writing code used to be the expensive step, so process was built to protect it. That
assumption has flipped and most of the process has not.

| Step | Before | Now |
|---|---|---|
| producing a plausible diff | hours | minutes |
| deciding whether it is correct | minutes (you wrote it) | hours (you did not) |
| the cost of being wrong | unchanged | unchanged |

Two things follow. First, the bottleneck moved to a resource you cannot scale by adding
tokens: human attention. Second, **fluency stopped correlating with correctness**. A
well-structured PR body, tidy commits and a confident summary used to be weak evidence that
the author understood the change. They are now free. Reviewers who still read them as signal
are calibrated on a world that ended.

## What works

- **One intent per change.** A PR that does one thing can be reviewed against one question.
  This is worth enforcing precisely because the agent has no cost pressure to keep the change
  small - it will happily fix three unrelated things it noticed on the way.
- **Ship the intent with the diff.** The spec or the plan in the PR turns review from "is this
  code reasonable?" into "does this do what we agreed?" - the only question that catches a
  well-written implementation of the wrong thing.
- **Self-review before anyone else sees it.** The author reads the whole diff first, in a
  fresh context, and fixes what they find. Handing over unread generated code is the exact
  behavior that ended curl's bounty programme, at a smaller scale.
- **Make authorship mean understanding.** The person who opens the PR answers for the change:
  what it does, why it is shaped that way, what happens at the edges. This is the rule the
  refusal case above is really asking for, and it is enforceable without banning any tool.
- **Evidence, not adjectives.** The command that was run and what it printed. "Tested and
  working" is not a claim a reviewer can check.
- **Review with a fresh context, and say what counts as a finding.** A reviewer that shares
  the author's session shares the author's blind spots; a reviewer with no criteria produces
  style opinions and over-engineering.
- **Look for the AI-shaped defects specifically.** Duplication of something that already
  exists elsewhere, invented APIs, tests that assert nothing, narration comments, and silent
  scope creep. These are cheap to find once you know the list.
- **Cap what you will accept per unit of review.** If nobody can review it this week, it does
  not get generated this week. Queueing unreviewed diffs is inventory, not progress.

## What does not

- **Adding reviewers.** It scales linearly against something growing much faster, and it
  spreads responsibility until nobody feels it.
- **Trusting a polished description.** The description is generated by the same process as
  the code.
- **"The CI is green."** See [a-check-the-agent-can-run.md](a-check-the-agent-can-run.md) -
  green means the checks that exist passed, and the agent may have had a hand in which checks
  exist.
- **Rewriting instead of measuring.** If reviewers keep rewriting agent output, that is data:
  the prompt, the spec or the scope is wrong, and rewriting quietly hides the signal.
- **Treating volume as the win.** More merged diffs with elevated instability is a worse
  outcome than fewer merged diffs, and it is harder to reverse.

## How we run it here

- One capability per change, with the spec as the travelling artifact - so a reviewer always
  has the intent next to the diff ([ways-of-working.md](../ways-of-working.md)).
- `pre-pr-review` is a **clean-context self-review before the PR exists**: the author's agent
  reviews the full diff and fixes findings, so the human reviewer is not the first reader.
- Records carry the *why* so review does not re-litigate settled forks
  ([the decision checklist](../checklist.md)); scope creep is a finding, not a bonus.
- The gates that can be mechanical are mechanical, so human review spends itself on judgment
  rather than on things a script can assert.

## Sources

Full entries in [sources.md](sources.md).

| Key | Supports |
|---|---|
| `[Incident: curl 2025-2026]` | ~20% of submissions AI slop against a ~5% valid rate; 3-4 people and up to hours per report; the programme ended; AI-assisted findings were valuable when a human verified them first |
| `[Field: review refusal 2026]` | review refused where the author cannot explain the code; the poster's own conclusion that the generation-to-review cost ratio has collapsed |
| `[Survey: Stack Overflow 2025]` | "almost right but not quite" is the top frustration at 66% |
| `[Data: GitClear 2025]`, `[Data: GitClear 2026]` | refactored code falling from 25% to 3.8% of changed lines while duplication rises |
| `[Survey: DORA 2025]` | throughput up, delivery stability still negatively associated with AI adoption |
