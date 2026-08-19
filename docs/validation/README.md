# Validation - two suites, one question

Does this actually work? Two halves answer it, and neither can answer it alone.

| Suite | Asks | Reproducible |
|---|---|---|
| [**ai-prompting**](ai-prompting/README.md) | Does the machinery hold? Do the guards fire, does drift mean something, does every published number trace to a row of data? | Yes. Same input, same verdict, forever. |
| [**human-prompting**](human-prompting/README.md) | Can somebody who does not know this product get a result by typing what they would naturally type? | No, and that is the point. [Results](human-prompting/results.md). |

They are peers. A repository can pass every mechanical check and still be useless to a person,
and the first suite would report `drift 0` the whole way down.

## Why the split has these names

Both suites are prompts in the end - the difference is who is holding the keyboard, and it
changes what a result even means.

**ai-prompting** is the machine half. Its inputs are fixtures and repositories, its verdicts
are produced by scripts, and a case that passes today passes tomorrow unless something broke.
Its failures are defects with reproductions.

**human-prompting** is the other half. Its inputs are sentences people actually type, in the
language and the mood they type them, and no script decides whether the answer was any good.
Two runs of the same prompt can differ and both be honest. What it records is not a pass rate
but **what the agent actually did**, in enough detail to argue with.

Calling one of them "the suite" and the other an annex would have made the second one optional,
which is backwards: the machine half is the floor, and the human half is the product.

## What these suites do not evidence (measured 2026-08-19)

Both suites were green and neither said which claim its numbers supported, so read together
they made a claim neither one had tested.

- **ai-prompting: 31 runs, 377 observations, nobody prompted in any of them.** That is not a
  flaw - the suite measures machinery and does it well. The flaw was that nothing said so, so
  a growing pile of passing observations read as evidence for a product whose central promise
  is being guided. Every record now carries `"provenance": "none"`.
- **human-prompting: 7 runs, 109 observations, no session transcript kept for any of them.**
  Not one asked/checked/suggested claim can be checked against what was actually said. The
  ones that can be read are worse than unverifiable: they were scored by reading whether a
  skill's text *instructs* asking - the layer that turned out to have no force at all, since
  the rule was written in the right file, in plain words, and a full adoption ignored it.
  Every record now carries `"provenance": "unverified"`, counted apart from validated.

Nothing was deleted. These are real records of real work and the observations in them stand;
what changed is that each one states which question it answers.
`tools/validation-claims-check.mjs` keeps them saying it, and promoting a run to `"human"`
now requires naming a transcript that exists - a corpus that could upgrade itself by editing
a string is the corpus this repo already had.

The suite that answers the remaining question is neither of these. It is
`tools/elicitation-replay-test.mjs`: recorded sessions replayed past the guard, asserting
which writes it refuses. That one is reproducible and it is about asking.

## Contributing a failure

**If you typed something and the standard did not do the right thing, that belongs in
[human-prompting](human-prompting/README.md).** [How to report
one](human-prompting/reporting.md) says what to send and how to extract the conversation from a
Claude Code session without shipping everything the session touched. The prompt stays in the
corpus permanently once it lands, including after it is fixed - that is what makes it a
regression test rather than an anecdote.

Defects in the machinery itself belong in [ai-prompting](ai-prompting/README.md), which
documents how to write a case and what evidence a verdict needs.
