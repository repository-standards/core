# Comments that earn their tokens

**Practice:** let the agent write a comment only where the **why** is non-obvious to a
future reader; carry the context a *later* run needs in the spec and the plan, never in
code comments you intend to delete.
**Confidence:** **strong** that unprompted narration comments are a real and measurable
default; **mixed** on whether comments help a model - they demonstrably steer it, in both
directions.
**Decays:** **fast**. It rests on model behavior and on tool defaults, both of which move
between releases.
**What would change this:** a vendor default that comments by preference rather than by
exception; or a replication on current models showing that removing comments degrades rather
than improves comprehension.
**Last checked:** 2026-08-01

## The report

Two developers, mid-review, on an agent-written diff:

> **A:** with these AI tools there is a weird trend of adding two lines of code under ten
> lines of comments. It looks more like spam than helpful documentation.
>
> **B:** true, I try to remove them later - but when you are running a multi-phase plan,
> the comments help the next, more atomic agent run that does not have the earlier context.
> It also stops the agent burning tokens working out what a change is for, especially on a
> weird part of the code.

Both of them are right about something, and the disagreement is worth settling precisely,
because the wrong resolution ("always comment" or "never comment") costs you either a
codebase of narration or an agent that re-derives the same weird thing every run.

## Is it true

**The complaint: yes, and it is measurable.**

- Repository mining across eight long-lived projects, including company codebases at Google,
  Meta, Uber and Shopify, found that the comments attributable to models cluster in the
  **meta / explanation** categories - 63-74% of them in the company repositories
  `[Data: Repo mining 2026]`. That is the shape of narration: restating what the code already
  says, rather than recording a reason.
- The sharpest field observation is not about volume but about **placement**. An engineer
  comparing two similar greenfield projects - one roughly 90% AI-generated, one not - found
  the comment-to-code ratio *inverted*: more comments than code around simple CRUD, and
  almost none in the dense mathematical parts `[Field: parallel projects 2026]`. That is the
  whole problem in one sentence. The comments cluster where the code already explains itself
  and disappear exactly where a human would have written the paragraph that saves the next
  reader an hour.
- The tools themselves treat it as a defect. Claude Code's shipped instructions tell the
  agent to comment only where the reason is **non-obvious and useful to a future reader**,
  and to **match the surrounding file's comment density** rather than impose its own
  `[Vendor: Claude Code system prompts]`. When the vendor's own default is "do not narrate",
  narration in your diff is a prompt-and-review problem, not a fact of life.
- The wider pattern is documented at scale: across 211 million changed lines, cloned code
  rose from 8.3% of changed lines in 2021 to 12.3% in 2024 while **moved (refactored) lines
  fell from 25% to under 10%** `[Data: GitClear 2025]`, and the follow-up dataset of 623
  million changes puts moved code at 3.8% in 2026 `[Data: GitClear 2026]`. Agents add; they
  rarely rework or remove. Comment bloat is the same behavior at line altitude - and nobody
  deletes it later either.

**The counterclaim: half right, and the good half matters.**

Comments are not inert to a model - they are read as semantics:

- Across nine LLMs and about 575,000 debugging tasks, injecting **misleading** comments hurt
  fault localization more than misleading *variable names* did (24.55% vs 28.7% accuracy on
  the mutated phase) `[Study: Code comprehension 2025]`. The model trusts the prose over the
  code.
- A representation-level study of "comment internalization" found that manipulating the
  comment concept moved task performance across a range from **-90% to +67%**, strongest on
  summarization, weakest on completion `[Study: Comment internalization 2025]`. Comments are
  a large lever whose sign depends on the task and on whether they are true.

So "a comment gives the next run context cheaply" is real. And its mirror image is real too:
**a stale comment is worse than no comment**, because the model believes it and stops
looking. That is the trap in "I remove them later".

## What is actually happening

The two positions are arguing about different lifetimes.

| The context you need | How long it is true | Where it belongs |
|---|---|---|
| "phase 2 will replace this shim", "next run: wire the retry here" | days - it dies at merge | the **plan / tasks** file for that run |
| "this endpoint is polled, not pushed, because the upstream drops websockets over their proxy" | until the upstream changes | a **why-comment in the code** |
| "this capability exists to do X for persona Y, these are the rules" | as long as the product does | the **capability spec** |

Comment spam is what happens when expiring context is written into a permanent medium. It is
paid for by every future reader and every future file read, forever, to solve a problem that
ends on Friday. And the cleanup is exactly the kind that does not happen: this repo already
carries a case where a step that relied on being remembered was
[silently skipped](../../case-studies/the-silently-skipped-clarify.md).

The token argument also does not survive contact with arithmetic. A ten-line comment block is
tens of tokens on **every** read of that file, by every agent, in every future session. The
same sentence in the plan is read by the runs that need it and then deleted at close
([ADR-010](../../decision-records/ADR-010-artifact-lifecycle-and-tracker.md)). If you are
running phases atomically enough that the next run lacks context, the fix is that the run
gets a **better handover artifact**, not that the codebase gets a diary. The most-read
practitioner write-up of a long-running setup keeps exactly such a handover - a plan, context
and task file - and names the property it is kept for: it survives context resets
`[Field: six-month setup 2025]`.

## What works

- **One rule in the repo's agent entry file**, phrased as a test the agent can apply:
  *comments explain why, never what; match the density of the file you are editing; if the
  line above says what the code says, delete it.*
- **A why-comment on genuinely weird code is not spam - defend it in review.** The
  workaround, the ordering constraint, the vendor bug, the thing that will look like a
  mistake to the next person: that is the comment that earns its tokens, and it is the one
  developers under-write.
- **Hand the next run a real handover.** The plan and the spec are the medium: what is done,
  what is deliberately deferred, what the weird part is for. A run that starts by reading the
  capability spec does not need breadcrumbs in the source.
- **If you truly need an in-code breadcrumb across phases, type it and gate it.** A marker
  like `TODO(phase-2): ...` is greppable, and a PR gate can refuse the merge while any
  survive. A breadcrumb that CI can find is a breadcrumb you will actually remove.
- **Make narration a standing review check, and check the other direction too.** Deleting
  comments that restate the next line is the cheapest catch in an agent diff. The catch worth
  more is the inverse: find the densest, least obvious code in the change and ask whether
  anything explains *why* it is like that. The field evidence says that is precisely where the
  agent wrote nothing.

## What does not

- **"I will remove them later."** Later is a person remembering, which is the failure mode
  this standard exists to remove. If removal is not a gate or a step in the run, it does not
  happen.
- **Asking the agent to "add comments" to a diff you do not understand.** You get narration
  of the code that exists, including narration of the bug - the model is describing, not
  verifying.
- **Comments as agent memory.** They persist past the phase, they drift out of date silently,
  and once wrong they actively degrade the next run's reasoning. Anthropic's own guidance for
  long-running agents puts durable context in **external notes**, not in the artifact under
  edit `[Vendor: Anthropic context engineering 2025]`.
- **Banning comments outright.** The measured downside is *misleading* comments, not comments.
  A codebase with zero rationale forces every future agent run to re-derive the reason, which
  is the token cost the counterclaim was worried about in the first place.

## How we run it here

- The rule lives where the agent reads it: the repo's entry file (`AGENTS.md`), one line, in
  the imperative - see [instructions-that-survive.md](instructions-that-survive.md) for why
  it must be one line and not a paragraph.
- Cross-run context has a home already: the [spec](../working-with-specs.md) for durable
  behavior, `plan.md` / `tasks.md` for the run - both cleaned up at close by design
  ([ADR-010](../../decision-records/ADR-010-artifact-lifecycle-and-tracker.md)).
- Narration is a finding in `pre-pr-review`, alongside duplication and scope creep - see
  [review-is-where-the-cost-lands.md](review-is-where-the-cost-lands.md).

## Sources

Full entries in [sources.md](sources.md).

| Key | Supports |
|---|---|
| `[Data: Repo mining 2026]` | model-attributed comments concentrate in meta/explanation categories (63-74% in company repos) |
| `[Field: parallel projects 2026]` | comment density inverted - heavy on trivial CRUD, near-absent where the code is dense |
| `[Vendor: Claude Code system prompts]` | the agent is told to comment only where the reason is non-obvious and to match the file's density |
| `[Data: GitClear 2025]`, `[Data: GitClear 2026]` | duplication up, refactored code down to 3.8% - agents add, rarely rework |
| `[Study: Code comprehension 2025]` | misleading comments degrade fault localization more than misleading variable names (24.55% vs 28.7%) |
| `[Study: Comment internalization 2025]` | comment manipulation shifts performance from -90% to +67%, task-dependent |
| `[Field: six-month setup 2025]` | a plan/context/task handover kept because it survives context resets |
| `[Vendor: Anthropic context engineering 2025]` | durable cross-run context belongs in external notes, not in the working artifact |
