# What this is

A repository standard your coding agent can actually run.

Most teams keep what they know in four places at once: tickets, a wiki, a chat thread,
and somebody's head. The code moves; none of the four do. Six months later the only
honest source is the code, and everything written about it quietly lies.

This puts all of it in the repository, next to the code, versioned with it - what the
product should do, why it was built this way, who decided, and what is still open. Then
it checks itself. When the writing stops matching the code, a guard says so and prints a
number.

## What you actually get

- **A shipped tree.** Specs by capability, decision records, personas, a backlog that
  feeds itself, runbooks - each with a home and a reason to exist.
- **Guards that run.** Dependency-free Node scripts your CI asserts: compliance with the
  version you pinned, spec-to-code coupling, declared facts still agreeing with their
  source.
- **A guided path in.** A new repo gets interviewed and scaffolded. A messy one gets read
  first, then walked back to health in waves - never a big-bang dump.
- **Skills, not instructions.** The lifecycle ships as procedures an agent executes, so
  the standard is something that runs rather than something you are supposed to remember.

## Who writes into it

Everyone, which is the point. Product owners and analysts write behaviour in their own
words and the loop sharpens it into something buildable. Architects record the forks and
what they cost. QA gets acceptance criteria that existed before the code. Developers get
contracts instead of archaeology. The agent reads all of it as context and writes back
into the same place.

## Where to go next

- **[Quick start](quick-start.md)** - the first run, with the exact prompts. Ten minutes.
- **[Adopt](method/adoption.md)** - the gated path in full, greenfield and brownfield.
- **[The spec](../standard/SPEC.md)** - the normative rules, one page.

Not sold yet? [Why it exists](manifesto.md) is the argument, and the
[FAQ](faq.md) is where the uncomfortable questions live - including who is using this.
