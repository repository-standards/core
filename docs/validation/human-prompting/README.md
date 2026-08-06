# Human adoption testing - the method

The second validation suite. The [mechanical one](../README.md) asks whether the machinery
holds: do the guards fire, does drift mean something, does a claim match its data. This one
asks the question a machine cannot: **can somebody who does not know this product get a
result by typing what they would naturally type?**

They are peers, not a hierarchy. A repo can pass every guard and still be useless to a person,
and the first suite would report `drift 0` the whole way.

## Why it exists as its own suite

Everything in the mechanical suite is reproducible: same input, same verdict, forever. Nothing
here is. A run depends on a model, a phrasing, a repository and a person answering questions,
and two runs of the same prompt can differ legitimately.

That does not make it unmeasurable - it makes it a different kind of measurement. What is
recorded is not "did it pass" but **what it actually did**, in enough detail that a reader can
disagree with the verdict.

## The three things every run scores

A per-prompt verdict is not enough, because the most important property is not attached to any
one prompt. It is this:

> **On every prompt, the agent should try to ask, to check, and to suggest - not just
> execute.** That is the hand-holding the product promises, and it either happens everywhere
> or it is not a property of the product.

So every run records three flags alongside its verdict. They are the invariant, and they are
scored on **every** prompt, including the ones that look trivial:

| Flag | The question | Fails when |
|---|---|---|
| `asked` | Did it ask before acting, when anything was underdetermined? | it inferred an answer the user never gave, and proceeded |
| `checked` | Did it read the existing state - specs, records, code, backlog - before answering? | it answered from the prompt alone, as if the repo were empty |
| `suggested` | Did it name the next step unprompted? | it did exactly what was asked and stopped, leaving the user to know what comes next |

`asked` has one legitimate `n/a`: a prompt with nothing underdetermined. That is rarer than it
looks, and a run claiming it must say what made the request complete.

**The headline number this suite produces** is not a pass rate. It is: *on how many prompts of
how many did the agent ask, check and suggest.* Three fractions, published, no rounding.

## Two axes, tested differently

**Prompts** ([`prompts.md`](prompts.md), part 1 and 2) are things a user types. You run them.

**Volunteered behaviours** ([`prompts.md`](prompts.md), part 3) are sentences the agent must
produce *on its own*. You cannot type them. You build the situation and see whether it speaks -
and, critically, whether it speaks **before** the damage rather than after. The same sentence
is a working product before a spec is written and a correction after.

## A run is a conversation, not a prompt

The first version of this method scored one line in and one verdict out. That measures the
front door and nothing behind it, and the front door is the part most likely to work.

**A run is the whole flow**: the opening line, what the agent asks back, what a person would
plausibly type next, what it asks after that, and where the thing ends up. The interesting
failures are not in turn one. They are in turn four, when the agent asks something a real
person cannot answer, or stops asking too early, or asks six things at once, or reaches the
end without saying what happens now.

So every run records a **trace**, and the trace is the evidence:

```json
{
  "prompt": "A1",
  "target": "repo:acme/booking-api",
  "mode": "full-loop",
  "turns": [
    { "who": "user",  "said": "follow repositorystandards.com - take this repo onto the standard, interview me for what you need" },
    { "who": "agent", "said": "read the standard, measured the repo, asked 4 questions: intent, technology, appetite, plan-only or execute",
      "asked": true, "checked": true, "suggested": true,
      "note": "asked because the line told it to - not evidence of asking unprompted" },
    { "who": "user",  "said": "internal tool, node, small appetite, just plan it" },
    { "who": "agent", "said": "produced a wave plan, 14 items, did not touch the tree",
      "asked": false, "checked": true, "suggested": true }
  ],
  "outcome": "plan-only, nothing written, ended by naming the first wave and asking whether to run it",
  "abandon_risk": "turn 2 asked for 'appetite' without saying what the word means here - a first-time user has to guess",
  "verdict": "pass"
}
```

Score the three flags **per agent turn**, not once for the run. An agent that asks well at turn
two and then executes four steps in silence has a different problem from one that never asks.

Two fields carry the weight and neither is mechanical:

- **`outcome`** - what state the repository and the user are actually in at the end. "Adopted"
  is not an outcome. "Drift 6, three specs written, the user still does not know what happens
  on their next pull request" is.
- **`abandon_risk`** - the turn where a real person would plausibly give up, and why. A run that
  reaches a good end state through four turns nobody would sit through has still failed, and
  this is the only field that catches it.

**Answer as the user honestly.** If the agent asks something you can only answer because you
know this product, say so in the trace and answer as a person who does not - or say you could
not answer it. An interview that only works on insiders is the finding.

## How to run one

1. **Give the agent two things only**: the repository, and the prompt verbatim. No briefing, no
   pointer to `.claude/skills/`, no description of what a good outcome looks like. It has to
   find the standard the way a stranger's agent would.
2. **Pick a mode.**
   - *Stop-and-ask*: the agent must surface its questions and stop. Cheap, and it isolates the
     `asked` flag from everything downstream.
   - *Full loop*: a person answers live. Expensive, and the only mode that tests whether the
     questions make sense to somebody who does not know the product.
3. **Record what happened**, not what was supposed to happen. A run file in
   [`runs/`](runs/) per session, one observation per prompt:

```json
{
  "$about": "who ran it, against which repository, in which mode, with which model",
  "observations": [
    {
      "prompt": "O4",
      "target": "repo:acme/booking-api",
      "mode": "full-loop",
      "verdict": "partial",
      "asked": true,
      "checked": false,
      "suggested": false,
      "evidence": "Asked which invoices and which system, which is right. Never opened docs/decision-records/, so it did not notice there is no record for invoicing and did not say one was needed. Wrote the story with the format decided inside it. Stopped without proposing a plan."
    }
  ]
}
```

`evidence` carries the weight here. A verdict with no quotable behaviour behind it is an
opinion, and this suite has no mechanical check to fall back on.

## Reporting a failure

**If you typed something and the standard did not do the right thing, that belongs here.**
[`reporting.md`](reporting.md) says exactly what to send, what actually helps, and how to pull
the conversation out of a Claude Code session automatically without sending everything the
session touched.

The short version: what you typed, what you expected, what happened instead. Open an issue or
a pull request adding the prompt to [`prompts.md`](prompts.md) with `source: reported`.

It stays. A prompt is never removed for having been fixed - it is the regression test that the
fix holds. A corpus containing only prompts the product already handles proves nothing, which
is the whole reason this file asks strangers to break it.

## What this suite cannot tell you

- **Whether a single run generalises.** It does not. Two runs of one prompt can differ, and a
  single green run is one data point, not a property.
- **Whether the corpus is representative.** It was written by people who know the product, who
  systematically write prompts the product can handle. Reported failures are worth more than
  anything the authors invented, and the corpus says so where it is weakest.
- **Whether the answer was any good.** `checked` says it read the specs. It does not say it
  understood them. That stays a human's judgement, at review, like the mechanical suite's
  judgment tier.
