Everything your coding agent loads before it does anything. This directory holds
**procedure and guardrail**, never knowledge: the how-to-do-a-thing, not the what-is-true.

The distinction is the whole reason it is a separate folder. What is true about your
product lives in `docs/` and `specs/`, where a person can read it without an agent and
where it is versioned with the code. What lives here is executable: steps in an order that
matters, and refusals that fire before a command runs.

## What is inside

**`skills/`** - the lifecycle as procedures. Describing a feature, breaking it down,
building it, closing it, reviewing your own branch, ingesting meeting notes, moving to a
newer standard. Each one fires on its own when what you asked matches its description; you
should never have to remember a name.

**`hooks/`** - guards that run before a tool does. A write against a remote database, a
force-push onto a branch someone else pulled, a secret about to be committed.

**`settings.json`** - permission lists and which guards are wired in.

## What does not go in here

**Anything a person would need to read to understand the product.** If you find yourself
explaining a decision here, it is a decision record. If you find yourself describing
behaviour, it is a capability spec. A rule that exists only in this folder is invisible to
everyone not running Claude Code.

**Repo-specific product knowledge.** The skills are about how the repo is *run*, not about
what it *does*. A skill that knows your domain has become part of your product and cannot
be updated with the standard.

**A one-off migration.** Skills are things you run repeatedly. A script you will run once
is a script.

## If your agent is not Claude Code

This whole directory is the **reference form**. Port it to your agent's own instruction
mechanism, strictly, before claiming compliance - `self-verify` accepts the ported
location. A partial port is drift, not a variant: a skill that paraphrases the loop is a
loop that quietly does something else.

## Decisions behind it

- **[ADR-019](../decision-records/ADR-019-lifecycle-procedures-are-agent-portable.md) - the procedures
  ship as skills, and a partial port is drift.** The alternative was to describe the
  lifecycle in prose and let each repo wire it up. That is what every methodology does, and
  it is why methodologies decay: prose cannot be executed, so it gets approximated, and the
  approximations diverge silently.
- **Procedure here, knowledge in `docs/`.** Keeping both in the agent folder was tried and
  is worse in one specific way: it makes the product unreadable to anyone who does not run
  the same agent you do.
