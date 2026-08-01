# Felt speed vs measured speed

**Practice:** never let "it feels faster" be the evidence. Measure the outcome outside the
session - delivery time and failure rate - and expect the gain to be largest where *your*
context is weakest, smallest or negative where it is deepest.
**Confidence:** **strong** on the perception gap existing; **mixed** on the size and sign of
the effect, which depends heavily on the setting.
**Decays:** **fast**. The one controlled measurement is tied to a specific tooling snapshot
and its own authors call it historical.
**What would change this:** a replication of the same design on current tooling showing
parity or speedup - which would move the size of the effect but not the existence of the
perception gap, since that was measured against the participants' own estimates.
**Last checked:** 2026-08-01

## The report

Two things are said in the same team, in the same week, and both are sincere:

*"This has easily doubled my output."*
*"We are shipping about as much as before, but I spend my evenings reviewing."*

The interesting question is not who is lying. Neither is. The question is why the felt
experience and the measured outcome come apart so reliably.

## Is it true

**The gap is real and it has been measured directly.** In a randomized controlled trial,
16 experienced open-source developers worked 246 real tasks in mature repositories they knew
well, with early-2025 tooling. They forecast a 24% speedup, reported a 20% speedup
afterwards - and were measured **19% slower** when allowed to use the AI tools
`[Study: METR 2025]`. The gap between what they felt and what happened was about 39
percentage points. Economics and ML experts, asked in advance, predicted 38-39% faster.

Three honest qualifications, because this study gets over-cited in both directions:

1. It is one setting: experts, on repositories they already knew deeply, at a specific
   tooling snapshot. That is close to the *worst* case for AI assistance, because the human's
   own context is the thing the model lacks.
2. The researchers themselves now treat the result as historical and have changed their
   experiment design; it is evidence that the gap exists, not a constant to plan with.
3. "Slower on this task" is not "worse for the organization" - the same tools may still win
   on unfamiliar code, on breadth, and on work that would otherwise not get done at all.

**The industry-scale data says the effect is real but conditional.** The 2025 DORA research,
across nearly 5,000 technology professionals, found **90%** using AI at work and **more than
80% believing it increased their productivity** - while the measured relationships were
split: AI adoption now correlates **positively** with software delivery throughput and
product performance (a reversal from the previous year) and **negatively** with delivery
stability `[Survey: DORA 2025]`. Their summary is the useful part: without strong automated
testing, mature version control and fast feedback, more change volume produces instability.

Set those two beside each other. Over 80% believe it makes them more productive; the one
controlled measurement of experts on their own code found the opposite sign. Belief is not
the same instrument as measurement, and this note exists because teams keep using the first
one.

**And the practitioner sentiment shows where the time goes.** In the 2025 Stack Overflow
survey, 84% use or plan to use AI tools, while trust in accuracy sits at **32.7%** against
**45.7% who distrust it**. The top frustration, at **66%**, is code that is *almost right but
not quite* - followed by debugging AI-generated code being more time-consuming, at **45.2%**
`[Survey: Stack Overflow 2025]`.

## What is actually happening

The felt speedup is not an illusion - it is a **measurement of the wrong interval**.

| What you experience | What it actually covers |
|---|---|
| "It wrote in 30 seconds what would have taken me an hour" | the first draft: the part that is visible, immediate, and genuinely fast |
| (not felt) | reading it closely enough to trust it |
| (not felt) | the *almost right* fix - the most expensive class, because it survives a skim |
| (not felt) | the reviewer's time, which is someone else's calendar |
| (not felt) | rework in the following weeks - the measured share of moved and re-touched code keeps falling while duplication rises `[Data: GitClear 2026]` |

Every unfelt row is real time. Some of it lands on other people, which is exactly why the
individual feels faster while the team's numbers do not move.

There is a second mechanism worth naming: **fluent output reads as correct output**. A
confident, well-formatted, plausibly-structured answer suppresses the suspicion that a
hesitant colleague's answer would raise. That is what makes "almost right" the dominant
failure mode rather than "obviously wrong".

## What works

- **Measure delivery, not production.** Time from start to merged-and-stable, and change
  failure rate. Both already exist in the DORA framing, both are indifferent to how the code
  was written.
- **Count rework explicitly.** Reverts, follow-up fixes, and lines rewritten within two weeks.
  If throughput rises and rework rises faster, you have moved cost, not removed it.
- **Run your own A/B, cheaply.** Alternate comparable tasks with and without the agent for a
  week and write down actual clock time. It takes a week and it beats every anecdote,
  including this document's.
- **Aim the tool where your context is thin.** Unfamiliar subsystems, boilerplate, migrations,
  test scaffolding, exploration of an unknown library. The measured slowdown showed up where
  the developer's own knowledge was the strongest asset.
- **Timebox the agent's attempts.** If two rounds have not produced something you would
  merge, the cheapest remaining move is usually to write it yourself - and to keep the
  agent for the parts around it.
- **Separate the two claims when reporting up.** "We ship more" and "we ship better" are
  different measurements; conflating them is how a stability regression gets sold as a win.

## What does not

- **Self-reported speedup as an adoption metric.** It was off by 39 points in a controlled
  setting, against people who were paying attention.
- **Lines of code, PR count, or acceptance rate as productivity.** Every one of them rewards
  the behavior the duplication data says is already the problem: more added lines, less
  reworked code.
- **Extrapolating a greenfield demo to a mature codebase.** The demo has no legacy
  constraints, no reviewer, and no maintenance horizon. Mature repositories are where the
  measured result went negative.
- **Treating a single study as the verdict.** Including this one. The defensible claim is the
  *gap*, not the number.

## How we run it here

- The standard's KPIs live in [`PRODUCT.md`](../../../PRODUCT.md) and are deliberately
  outcome-shaped rather than volume-shaped - the same discipline this note asks of a team.
- The instability half of the DORA finding is what the gates are for: verification the agent
  cannot talk its way past ([a-check-the-agent-can-run.md](a-check-the-agent-can-run.md)),
  and a review pass that assumes the diff is plausible rather than correct
  ([review-is-where-the-cost-lands.md](review-is-where-the-cost-lands.md)).

## Sources

Full entries in [sources.md](sources.md).

| Key | Supports |
|---|---|
| `[Study: METR 2025]` | 16 developers, 246 tasks: 19% measured slowdown against a 20% self-reported speedup and a 24% forecast; experts predicted 38-39% faster |
| `[Survey: DORA 2025]` | ~5,000 professionals: 90% using AI, over 80% believing it raises productivity; positive throughput relationship, negative stability relationship |
| `[Survey: Stack Overflow 2025]` | 84% use or plan to; 32.7% trust vs 45.7% distrust; "almost right" 66%; slower debugging 45.2% |
| `[Data: GitClear 2026]` | 623M changes: duplication rising, moved code down to 3.8% - the rework tail as a measurement |
