# What this is, and why

A repository standard your coding agent can actually run.

Most teams keep what they know in four places at once: tickets, a wiki, a chat thread, and
somebody's head. The code moves; none of the four do. Six months later the only honest
source is the code, and everything written about it quietly lies.

This puts all of it in the repository, next to the code, versioned with it - what the
product should do, why it was built this way, who decided, and what is still open. Then it
checks itself. When the writing stops matching the code, a guard says so and prints a
number.

## The problem

I kept watching the same thing happen, in companies of every size: the product's truth
shatters into departments. The decision is in a chat thread. The why is in someone's head,
and that someone has notice-period days left. The wiki says one thing, the code does another,
marketing tells the market a third. Every team has its own tool, so every team has its own
version - and nobody is lying, they are just all editing different copies. The cost is not
aesthetic: settled questions get re-litigated, new people onboard by archaeology, and an AI
agent, the most literal reader you will ever hire, walks in and finds nothing it can trust.

## The vision

> Not a persona, not a roadmap - the idea this whole repository serves. If a change ever
> contradicts this section, the change is wrong or this section must be consciously
> rewritten first.

**Software should no longer be built around disconnected tools and isolated teams.**

For thirty years the industry has answered every coordination problem by adding another
place to put things. Requirements went to one tool, decisions to a second, diagrams to a
third, and the conversation that produced all three went to a fourth. Each of those tools is
defensible on its own. Together they guarantee that no single place is ever right, and that
the person who needs the whole picture has to assemble it by hand, from fragments, against
the clock.

Business, product, engineering and AI should collaborate through **one living repository**:
one place where knowledge is versioned with the code it describes, validated by the same
gates that guard the build, and improved continuously rather than rewritten in a panic
before an audit. Not one more tool alongside the others. The one that makes the others
optional.

That means the repository has to be genuinely open to people who do not write code. A
product owner should be able to state behaviour in plain language and be walked, not quizzed,
to something a developer can build. An analyst should be able to land a domain rule where it
will be read. A tester should be able to write what "done" means and watch it become a test.
None of that is a courtesy: a repository that only developers can contribute to will always
be a partial record of the product, and a partial record is exactly what an AI agent cannot
work from.

## How it works, in one paragraph

**Everything lives in the repository, and everything hangs together.** One place where code,
specifications, decisions, product vision and personas are versioned together and updated in
the same breath - the same pull request that changes behaviour changes its documentation,
because a guard makes anything else fail. Proximity is the mechanism; coherence is the
outcome. Documentation is not *about* the system, written after and elsewhere; it is *part
of* the system, living exactly as long and exactly as close as the code it describes.

And it is written to be **executed, not admired**. The repo is the context an AI agent
loads; the standard is the process the agent runs - unprompted, gated, verifiable. A
repository under this standard can answer, at any moment, the only question that matters:
*are you compliant, and how far off?* - with a number, not an opinion.

## The solution - what you actually get

- **A shipped tree.** Specs by capability, decision records, personas, a backlog that feeds
  itself, runbooks - each with a home and a reason to exist.
- **Guards that run.** Dependency-free Node scripts your CI asserts: compliance with the
  standard, spec-to-code coupling, declared facts still agreeing with their source.
- **A guided path in.** A new repo gets interviewed and scaffolded. A messy one gets read
  first, then walked back to health in waves - never a big-bang dump.
- **Skills, not instructions.** The lifecycle ships as procedures an agent executes, so the
  standard is something that runs rather than something you are supposed to remember.

---

## Non-negotiables

1. **The repo is the source of truth** - never a wiki, a deck, a tracker, or memory. What
   must live elsewhere gets a pointer, an owner and a sync rule, never a copy.
2. **Living, in place** - the current version is the truth, git is the history, and nothing
   is append-only theatre.
3. **A decision is recorded or it does not exist** - and speculation is never dressed as a
   decision.
4. **The process runs itself** - hooks and gates, not human memory. Hand-holding is the
   product, not a courtesy.
5. **Compliance is measurable** - align, verify, drift as a number. A standard you cannot
   verify against is a mood.
6. **Right-size, always** - boring and proportionate beats clever. A solo project carries
   the core, never the ceremony, and deviation is legal when it is recorded.
7. **Nothing in the repo the community should not see** - it goes public, and the trust it
   sells depends on that.

## The bet

Repositories that explain themselves outlive the people who wrote them. In the agent era
this stops being hygiene and becomes leverage: the repository is the company's memory, its
onboarding, its audit trail, and its interface to every future human and machine
collaborator. Whoever keeps their whole product - intent, decisions, behaviour, brand -
coherent in one versioned place will move faster with fewer people and sleep better doing
it. This standard exists so that place has a shape and a way to prove itself.

## Where to go next

- **[How to use this project](method/ways-of-working.md)** - who does what, and the exact
  sentences you say
- **[Adopt](method/adoption.md)** - the gated path in full, greenfield and brownfield
- **[The FAQ](faq.md)** - where the uncomfortable questions live, including who is using this
