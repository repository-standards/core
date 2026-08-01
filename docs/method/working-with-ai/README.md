# Working with AI - what actually holds up

The practices for driving a coding agent day to day, each one checked against
evidence rather than vibes: what real teams report, what is measurably true, what only
feels true, and what to do about it. [`ways-of-working.md`](../ways-of-working.md) says
how work travels between a PO, a developer and an agent; this folder is about **the
agent run itself** - the part where the claims are loudest and the evidence is thinnest.

## Contents

| Note | The practice in one line |
|---|---|
| [comments-that-earn-their-tokens.md](comments-that-earn-their-tokens.md) | let the agent write *why*, never *what* - and carry cross-run context in the plan, not in the code |
| [context-is-the-budget.md](context-is-the-budget.md) | context is the scarce resource, and it degrades long before the window is full - scope each run, reset between runs |
| [felt-speed-vs-measured-speed.md](felt-speed-vs-measured-speed.md) | the speedup you feel is not the speedup you get - measure outside the session |
| [a-check-the-agent-can-run.md](a-check-the-agent-can-run.md) | never end a run on "looks done"; and never let the thing being graded own the grader |
| [review-is-where-the-cost-lands.md](review-is-where-the-cost-lands.md) | generation got cheap, review did not - pay for reviewability while generating |
| [the-cleanup-comes-later.md](the-cleanup-comes-later.md) | merge is not where the cost settles - un-owned code is the expensive kind |
| [instructions-that-survive.md](instructions-that-survive.md) | a rule that must never break is a gate, not a paragraph; prose rules must be short or they get lost |
| [blast-radius-before-autonomy.md](blast-radius-before-autonomy.md) | decide what the agent can destroy *before* you let it run unattended |
| [sources.md](sources.md) | the bibliography every note cites by key - who published it, when, on what sample, and how we checked |

## Why this shape, and how to use it

**Start from your complaint, not from the top.** Each note opens with the thing someone
actually said - "it writes ten lines of comments for two lines of code", "it forgot what
I told it", "I feel faster but the sprint says otherwise" - and ends with the rule we
run. If your situation is in the first paragraph, the rest of the file is for you.

**Every note carries the same five moves**, so they stay comparable and short:

1. **The report** - what practitioners actually complain about, in their words, not ours.
2. **Is it true** - the verdict, with the strongest evidence that exists either way.
3. **What is actually happening** - the mechanism, because a practice you cannot explain
   is a superstition you will apply in the wrong place.
4. **What works / what does not** - the two lists, both required.
5. **How we run it here** - the tie back to this standard's artifacts, so the practice has
   a home and is not another thing to remember.

## The citation rules

**A claim without a source does not go in.** Notes cite by key - `[Study: METR 2025]`,
`[Field: review refusal 2026]` - and every key resolves in [sources.md](sources.md) to a full
entry: who produced it, when, its stable identifier, the sample it rests on, and how this repo
checked it.

**The key's prefix is the evidence class, so the reader sees the altitude without leaving the
sentence.** Each class is allowed to prove a different thing:

| Prefix | What it is | Proves |
|---|---|---|
| **Study** | controlled or systematic research | what **happens**, under the study's conditions |
| **Data** | large-scale measurement of real repositories | what **is happening at scale**, correlationally |
| **Survey** | self-report at scale | what developers **perceive** |
| **Vendor** | the tool maker's own documentation | what the tool **intends**, and what its maker calls a defect |
| **Incident** | a public, consequential event | that a failure mode is **real at least once**, with consequences |
| **Field** | practitioner testimony | what people **hit in practice**, and what they converged on |

**Sources must be findable when the link dies.** A URL is not a citation. Every entry carries
the durable part - authors or organization, title, date, and a stable identifier where one
exists (`arXiv:2507.09089`, a thread id, an issue number) - plus the sample, so a reader can
judge the claim rather than take it. Web pages get an accessed date.

**Names: only where the source carries a byline.** A researcher, a report's publisher, a
maintainer writing under their own name on their own blog, an executive speaking officially -
name them; the name is part of the evidence's weight. **Pseudonymous community posts are
cited by artifact, never by handle**: the thread id is the stable identifier, the engagement
figures are the signal, and a username adds no authority while putting a person into a
document they never agreed to. That is the same rule
[`case-studies/`](../../case-studies/) already applies to real repositories.

**Numbers live in the sources, rules live in the body.** No note's `Practice:` line depends on
a figure. A number going stale should cost the note its precision, not its recommendation:
when reward-hacking rates fall, "give the agent a check it cannot edit" becomes less urgent,
not wrong.

**We say how we checked.** Entries marked `primary` were read at the source; `secondary` means
the figure comes from a summary and has not been confirmed. Reformatting an unverified number
into a precise-looking citation makes it *more* misleading, not less.

## How the notes age, and how to re-check them

**They do not all rot at the same speed**, so each note declares a `Decays:` class and a line
saying **what would change it** - which is also the instruction for re-checking it.

| Decay | Kind of claim | Notes |
|---|---|---|
| **slow** | economics, organization, architecture | review, cleanup, blast radius, and the core of context |
| **medium** | vendor mechanics, rates that move per generation | instructions, checks |
| **fast** | model behavior and tool defaults | comments, felt speed |

Three levels of re-checking, cheapest first:

1. **Follow the note's own `What would change this` line.** It names the observation that
   would update or kill the claim. A note without one is not re-checkable and should not
   have been written.
2. **Walk the source entries.** For each: does the link still resolve, does the cited figure
   still appear, has the vendor page changed its wording? This is one prompt, runnable at any
   release, which is why it is written as a procedure rather than as a good intention.
3. **Check it against our own repositories.** External evidence says what is true in general;
   only your diffs say what is true here. Is comment density inverted in your agent-written
   code? What share of review comments are "almost right" fixes? Which rules does the agent
   break despite being told? These are cheap probes and they beat every anecdote, including
   this folder's.

**A claim we confirm on our own code graduates.** A note is a hypothesis about the outside
world; [`case-studies/`](../../case-studies/) is what we proved at home, anonymized, ending in
a rule. When a note's claim is verified here, the case study is where it lands and the note
links it.

**A note that turns out to be wrong is corrected in place** (R4, living documents) with one
line on what changed - not quietly deleted, because the wrong turn is part of what the folder
is for.

## What belongs here, and what does not

- **Here** - a recurring, checkable claim about *working with an agent*: a failure mode, a
  workaround, a habit that pays off. It must generalize past one repo.
- **[case-studies/](../../case-studies/)** - an anonymized situation from a real production
  repo that earned a **rule in this standard**. A case study ends in a rule; a note here ends
  in a practice.
- **[decision-records/](../../decision-records/README.md)** - a contestable fork *this project*
  took. If a note makes us change the standard, the change is the ADR and the rule; the note
  stays as the evidence that moved us.
- **Not here** - tool release notes, prompt collections, model comparisons, and anything that
  is true only for one vendor's build this month.
