# Context is the budget

**Practice:** treat the context window as the scarce resource, not the token bill. Scope
every run to what it needs, push exploration into sub-agents, and reset between unrelated
tasks instead of pushing through.
**Confidence:** **strong** - measured across frontier models, and the vendors build their
own tooling around it.
**Decays:** **slow**. The core argument is architectural, not a property of one model
generation; the specific degradation curves are what age.
**What would change this:** a model family whose retrieval accuracy is flat from ten
thousand to two hundred thousand tokens on a distractor-rich task - not a larger advertised
window, which is a capacity claim and not a quality claim.
**Last checked:** 2026-08-01

## The report

The complaints all describe the same curve: *"it was sharp for the first hour and then
started forgetting things I told it at the beginning."* *"It ignored a rule that is written
in my instructions file."* *"It re-read the same three files and lost the thread."* Most
people read this as the model being inconsistent, or having a bad day. It is neither.

## Is it true

Yes, and it is not a cliff at the advertised limit - it is a slope that starts early.

- Chroma's **context rot** work ran 18 models across the Claude, GPT, Gemini and Qwen
  families over five controlled experiments and found accuracy degrading **non-uniformly as
  input grows**, on tasks simple enough that length should not have mattered
  `[Study: Chroma 2025]`. The degradation is not about the size of the window; it is about
  how much you have put in it.
- The same work gives the cleanest single number for the practice: on a conversational
  question-answering benchmark, a **focused prompt of roughly 300 tokens beat the full
  ~113,000-token version across every model family**. Not "did about as well" - beat.
- The effect gets worse exactly where real work lives: when the thing you need is not a
  literal string match but a semantic one, and when distractors - plausible-looking but wrong
  neighbours - are present. Both are the normal condition of a codebase.
- One finding is worth sitting with, because it contradicts the intuition that "more
  structure is better": in their needle-in-a-haystack variants, a **shuffled** haystack was
  retrieved from more reliably than a logically coherent one. Coherent surrounding text
  competes for attention with the thing you actually need.
- The vendor's explanation is architectural rather than anecdotal: attention is pairwise, so
  n tokens means n<sup>2</sup> relationships to spread a fixed budget across. Every token you
  add spends **attention budget**, and the result is a performance gradient rather than a
  hard cliff `[Vendor: Anthropic context engineering 2025]` - which is precisely why it is
  easy to miss until the run is already bad.
- Claude Code's own guidance is built on it: performance degrades as context fills, and the
  documented failure patterns are the **kitchen-sink session** (unrelated tasks in one
  context), **correcting over and over** (context filling with failed approaches) and
  **infinite exploration** (an unscoped investigation reading hundreds of files)
  `[Vendor: Claude Code docs]`.

## What is actually happening

Context is not storage that you fill until it is full - it is a signal-to-noise ratio that
you degrade with every addition. Three consequences follow, and each one inverts a habit
that feels productive:

1. **A long session is not an accumulating asset.** After a couple of failed attempts, the
   history is mostly wrong answers, and the model is now conditioned on them. The instinct
   to "explain it once more so it finally understands" adds noise to a channel that is
   already noisy.
2. **Reading is spending.** An unscoped "look through the codebase and tell me what you
   think" can consume more budget than the implementation it is supposed to inform.
3. **Instructions decay relative to everything else.** Your rules were loaded once at the
   start; a hundred thousand tokens later they are a small, distant fraction of what the
   model is attending to. This is the mechanism behind "it ignored my instructions file" -
   see [instructions-that-survive.md](instructions-that-survive.md).

## What works

- **One run, one job.** Scope a run to a phase with a stated goal and a stated stopping
  point. When the job changes, the context should change with it.
- **Reset instead of pushing through.** Two failed corrections is the signal: clear, and
  restart with a better prompt that includes what you just learned. A clean context with a
  sharper prompt beats a long context full of dead ends - the vendor documents this as the
  fix `[Vendor: Claude Code docs]`, and practitioners report the same rule of thumb
  independently `[Field: HN agent workflows]`.
- **Push exploration into a sub-agent.** Research reads many files and returns a paragraph.
  Run it in its own context and keep the summary, not the transcript. This is the single
  highest-leverage habit for long tasks.
- **Carry state in files, not in the conversation.** A spec, a plan, a task list and a diff
  survive a reset; a conversation does not. Anthropic's guidance calls this structured
  note-taking; this standard calls it the artifacts; the most widely read practitioner
  write-up of a long-running setup calls its version "dev docs" and describes the property
  that matters in four words - it survives context resets `[Field: six-month setup 2025]`.
  Three names, one idea, arrived at independently.
- **Branch the prompt instead of appending to it.** Practitioners report better results from
  going back to an earlier prompt and re-asking it with what they now know, rather than adding
  another correction to the end `[Field: six-month setup 2025]`. It keeps the good context and
  drops the failed attempts.
- **Load knowledge just in time.** Keep the always-loaded instruction surface small and put
  situational knowledge behind something the agent pulls when relevant (a skill, a doc it is
  told to read). Everything permanently loaded is permanently spending budget.
- **Watch the fill level like a resource.** If your tooling shows context usage, treat
  crossing into the upper half as a prompt to decide: compact deliberately, or reset.

## What does not

- **"The window is 200k, I have room."** Degradation is measured well before the limit; the
  number is a capacity, not a promise of quality.
- **One heroic session for a whole feature.** The end of that session is the worst-quality
  part of it, and that is where the tricky integration work usually lands.
- **Re-explaining after failures.** Each retry adds the failure to the context you are asking
  the model to reason from.
- **Automatic compaction as a strategy.** It is a safety net that summarizes and drops
  detail. Deciding *what survives* is a design act - do it deliberately (compact with
  instructions, or write the state to a file) rather than letting it happen at the worst
  moment.
- **Dumping every rule and every doc up front "so it has full context".** That is the
  behavior the study is measuring the cost of.

## How we run it here

- The lifecycle is already phased - specify, clarify, plan, tasks, implement, reconcile -
  and each phase is a natural context boundary with its own artifact
  ([ways-of-working.md](../ways-of-working.md)).
- The artifacts *are* the durable context: the capability spec survives every reset, which
  is why [working-with-specs.md](../working-with-specs.md) insists the spec is the truth
  rather than the chat.
- Discovery keeps raw source material (meetings, mails, findings) in a dossier instead of in
  the build run's context, and marks it non-normative ([discovery.md](../discovery.md)).
- `pre-pr-review` runs in a **clean context** by design: the reviewer that shares the
  writer's context shares the writer's blind spots.

## Sources

Full entries in [sources.md](sources.md).

| Key | Supports |
|---|---|
| `[Study: Chroma 2025]` | 18 models, five experiments: non-uniform degradation well before the limit; a ~300-token focused prompt beating the ~113k-token one; shuffled haystacks retrieved from better |
| `[Vendor: Anthropic context engineering 2025]` | the attention-budget argument and the gradient-not-cliff framing; just-in-time retrieval, compaction, note-taking, sub-agents |
| `[Vendor: Claude Code docs]` | context as the primary constraint; the kitchen-sink, repeated-correction and unscoped-exploration failure patterns |
| `[Field: six-month setup 2025]` | a plan/context/task pattern kept because it survives resets; re-prompting from an earlier branch instead of stacking corrections |
| `[Field: HN agent workflows]` | independent convergence on lean instructions, sub-agent delegation, fresh context per stage |
