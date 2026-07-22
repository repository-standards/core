# Why this exists - from the founder

> Not a persona, not a roadmap - the idea this whole repository serves, in the
> founder's voice. If a change ever contradicts this file, the change is wrong or this
> file must be consciously rewritten first.

## The itch

I kept watching the same thing happen, in companies of every size: the product's truth
shatters into departments. The decision is in a chat thread. The why is in someone's
head, and that someone has notice-period days left. The wiki says one thing, the code
does another, marketing tells the market a third. Every team has its own tool, so every
team has its own version - and nobody is lying, they are just all editing different
copies. The cost is not aesthetic: settled questions get re-litigated, new people
onboard by archaeology, and an AI agent - the most literal reader you will ever hire -
walks in and finds nothing it can trust.

## The idea

**Everything lives in the repository, and everything hangs together.** One place where
code, specifications, decisions, product vision, and personas are versioned together
and updated in the same breath - the same pull request that changes behavior changes
its documentation, because a guard makes anything else fail. Proximity is the
mechanism; coherence is the outcome. Documentation is not *about* the system, written
after and elsewhere - it is *part of* the system, living exactly as long and exactly as
close as the code it describes.

And it is written to be **executed, not admired**. The repo is the context an AI agent
loads; the standard is the process the agent runs - unprompted, gated, verifiable. A
repository under this standard can answer, at any moment, the only question that
matters: *"are you compliant, and to which version?"* - with a number, not an opinion.

## What it must feel like

- A **PO** writes a story and is walked - not asked to remember commands - through the
  questions that make it buildable, allowed to defer the technical ones explicitly,
  and always allowed to say "explain this simply".
- A **developer** picks up a ready-to-develop spec and finds contracts, not vibes -
  and never re-argues a decision that carries a record.
- The **project itself** stays documented "as if a real writer wrote it" - readable by
  humans, loadable by agents, true by construction.
- An **owner** who cannot read a diff can still point at green checks and a pinned
  version and know the work is held to a standard vetted beyond his own eyes.
- A repo untouched for months answers one command with "here is exactly what drifted".

## Non-negotiables

1. **The repo is the source of truth** - never a wiki, a deck, a tracker, or memory.
   What must live elsewhere gets a pointer, an owner, and a sync rule - never a copy.
2. **Living, in place** - the current version is the truth; git is the history; nothing
   is append-only theater.
3. **A decision is recorded or it does not exist** - and speculation is never dressed
   as a decision.
4. **The process runs itself** - hooks and gates, not human memory; hand-holding is the
   product, not a courtesy.
5. **Compliance is measurable** - align -> verify -> drift as a number; a standard you
   cannot verify against is a mood.
6. **Right-size, always** - boring and proportionate beats clever; a solo project
   carries the core, never the ceremony; deviation is legal when recorded.
7. **Nothing in the repo the community should not see** - it goes public, and the
   trust it sells depends on that.

## The bet

Repositories that explain themselves outlive the people who wrote them. In the agent
era this stops being hygiene and becomes leverage: the repository is the company's
memory, its onboarding, its audit trail, and its interface to every future human and
machine collaborator. Whoever keeps their whole product - intent, decisions, behavior,
brand - coherent in one versioned place will move faster with fewer people and sleep
better doing it. This standard exists so that place has a shape, a version, and a way
to prove itself.
