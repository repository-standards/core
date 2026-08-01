# Instructions that survive

**Practice:** a rule that must never break is a gate, not a paragraph. Keep the
always-loaded instruction file short enough that every line is load-bearing, move
situational knowledge behind on-demand loading, and promote any rule you have had to repeat
into something mechanical.
**Confidence:** **strong** on the mechanism and on the "long file gets ignored" effect;
**mixed** on prompt-level tricks such as emphasis words, which help but do not guarantee.
**Decays:** **medium**. The mechanism is the attention budget and does not move; the specific
mechanics - which file is loaded when, what a hook can intercept - are vendor features and
change with releases.
**What would change this:** tooling that loads instructions per decision rather than per
session, so adherence stops falling as the conversation grows. Larger context windows do not
count; that is the thing that already failed.
**Last checked:** 2026-08-01

## The report

*"It is literally written in the rules file and it did it anyway."*
*"I added a rule. Then another. Now it follows about half of them."*
*"We keep the same rules in three files for three tools and they have drifted apart."*

The usual reaction is to make the rule louder: capitals, more emphasis, more repetition. That
occasionally works, and it makes the underlying problem worse.

## Is it true

**Yes - and past a certain size the rules file starts working against itself.** Claude Code's
own documentation states it directly: a bloated instruction file causes the agent to ignore
the instructions that matter, because the important rules get lost in the noise
`[Vendor: Claude Code docs]`. Their diagnostic is the useful part: *if the agent keeps doing
something you have a rule against, the file is probably too long and the rule is getting
lost*. Their prescription is to prune it like code and to test a change by watching whether
behavior actually shifts.

**The mechanism is the same one that governs everything else in a long run.** Instructions
are tokens competing for a finite attention budget, and retrieval accuracy degrades as input
grows `[Study: Chroma 2025]` - see [context-is-the-budget.md](context-is-the-budget.md). Your
rules were loaded once, at the start; by the time the decision they govern arrives, they are
a small and distant part of what the model is attending to. Nothing has failed - the ratio
changed.

**Practitioners who ran into it at scale converge on the same two moves.** The most widely
read write-up of a six-month agent setup on a 300k-line codebase describes the failure in
plain terms - the agent kept using old patterns although the new ones were documented, and
the author had to keep telling it to go read the guidelines file - and then describes the fix
in two parts `[Field: six-month setup 2025]`. First, a split: the "how to write code"
guidance moved out of the always-loaded instruction file into **skills** that load when
relevant, leaving the instruction file to carry only "how this specific project works" -
commands, configuration, the task workflow. Second, **hooks** rather than hope: a
prompt-submit hook that injects the relevant skill reminder before the model sees the
request, and a stop hook that checks what was edited afterwards. That is the same conclusion
the vendor documentation reaches, arrived at the hard way, by someone counting the cost.

**The fragmentation half of the complaint is real too.** The most-reacted issue on Claude
Code's public tracker - by a wide margin, at roughly 5,800 reactions - is a request to support
a shared `AGENTS.md` convention `[Field: CC issue 6235]`, because teams were maintaining the
same rules in a different file per tool. Hand-copied rules drift, and drifted rules are worse
than absent ones: they teach different tools different truths about the same repo.

## What is actually happening

There are three different things people write into a rules file, and only one of them belongs
there:

| What you wrote | What it actually needs to be |
|---|---|
| "never commit secrets", "always run the migration guard" - must hold every time | a **gate**: a hook, a guard script, a CI check. Deterministic, not advisory |
| "how our billing domain models refunds" - matters sometimes | **on-demand knowledge**: a doc or skill the agent loads when the topic comes up |
| "use pnpm, not npm", "tests live next to the source" - short, always relevant, not inferable | a **line in the entry file**. This is the only category that earns permanent context |

Most over-long rules files are category one and two, written as category three. They spend
attention budget every single turn to encode something that either should have been
impossible to get wrong, or is irrelevant to this turn.

## What works

- **One entry file, and everything else reached from it.** A single place the agent reads
  first, listing where each kind of knowledge lives - so the file stays a map rather than
  becoming the whole library.
- **Apply the deletion test to every line:** *would removing this cause a mistake?* If the
  agent already behaves correctly without it, the line is costing attention and buying
  nothing.
- **Write rules as observable behavior.** "Run the type check before you say you are done"
  is checkable. "Write clean code" is not a rule, it is a mood.
- **Promote a repeated rule into a gate.** The second time you write the same correction, it
  stops being an instruction problem: make it a hook, a guard, a lint rule, or a CI job. This
  is the single most reliable upgrade available - it converts "usually followed" into
  "cannot be skipped".
- **Move sometimes-knowledge to on-demand loading.** Skills and referenced docs are read when
  relevant, so depth costs nothing on the turns that do not need it.
- **Keep one source of truth across tools.** One canonical file, others pointing at it. A
  thin pointer cannot drift; a copy will.
- **Treat the rules file as code.** Review it when something goes wrong, prune it on a
  schedule, and check whether a change actually altered behavior instead of assuming it did.

## What does not

- **Volume.** Every added rule dilutes the ones already there. A rules file that grows
  monotonically is a rules file with a falling adherence rate.
- **Emphasis as a substitute for enforcement.** Capitals and "you must" measurably help
  adherence; they do not make it certain. If a violation is unacceptable, prose is the wrong
  medium - and this note's own confidence rating says so.
- **Rules that restate defaults.** The model already writes idiomatic code in most languages.
  Encoding what it would do anyway is pure cost.
- **Rules in personal configuration.** A rule that lives in one developer's local agent
  settings does not apply to the team, to CI, or to the next contributor - it does not exist.
- **Re-explaining the rule mid-session.** By then the context is the problem, not the wording.

## How we run it here

- The standard requires a single entry file at the root, naming where each kind of knowledge
  lives and which altitude wins on conflict (R1), and requires that a rule live **in the
  repo** at all - a rule that exists only in chat or a personal agent config does not exist
  (R3).
- Procedures ship as executable skills rather than as prose the agent has to remember
  (R22) - which is the same "on-demand knowledge" move, made normative.
- The things that must never break are guards and `self-verify`, not sentences: mechanical
  where mechanical is possible, so the prose file can stay short.
- Where a rule keeps being re-litigated, it becomes a **decision record** and a rule with a
  home ([taxonomy.md](../taxonomy.md)) - so the argument is settled once rather than in every
  session.

## Sources

Full entries in [sources.md](sources.md).

| Key | Supports |
|---|---|
| `[Vendor: Claude Code docs]` | over-long instruction files cause rules to be ignored; the deletion test; hooks deterministic where instructions are advisory; skills load on demand |
| `[Study: Chroma 2025]` | retrieval and adherence degrade as input grows - the mechanism behind "it ignored my rules file" |
| `[Field: six-month setup 2025]` | documented rules ignored until guidance moved into on-demand skills and enforcement moved into hooks |
| `[Field: CC issue 6235]` | ~5,800 reactions on a request for a shared instruction-file convention; drift between per-tool copies as the reported pain |
