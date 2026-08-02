The engineering principles: the handful of things this repository refuses to trade away.
The top of the altitude hierarchy, which means everything below answers to it - decisions,
specs, conventions, code.

## What it is for

**So that a trade-off has something to be wrong against.** Most engineering arguments are
between two reasonable positions, and they are settled by whoever cares most that day unless
something above them says which way this project leans.

A principle earns its place by making at least one attractive option unavailable. If it
forbids nothing, it is a value statement, and value statements do not settle arguments.

## What goes in here

Few, short, and each one costly. "Prefer boring technology" is a principle when it means you
will accept a worse fit rather than a novel dependency. "Write good code" is not a principle,
because nobody was going to argue for the opposite.

Each should be recognisable in a decision record that cites it. A principle nothing has ever
been decided against is untested.

## What does not go in here

**Decisions.** A principle is a standing preference; a decision applies it to one case. The
record cites the principle, not the other way round.

**Rules.** How commits are formatted is a convention. Principles do not reach that far down.

**Anything you would abandon under pressure.** A principle you break the first time it costs
something has taught everyone that the file is decorative, and that lesson generalises to
the rest of the documents.

## Where it sits

```
PRINCIPLES.md
  -> ADR / BDR (decisions)
    -> specs (behaviour) + ARCHITECTURE.md (structure)
      -> conventions
        -> code
```

Higher wins. Code disagreeing with an accepted decision is a stop-and-propose, and a decision
disagreeing with a principle needs the principle changed first - openly, because that is a
larger act than it looks.

## Decisions behind it

- **Optional in the manifest, named by R1.** A repository can operate without stated
  principles; it just resolves its trade-offs somewhere less visible.
- **Short by design.** A long list is a list nobody holds in their head, and a principle
  nobody remembers cannot be applied at the moment it matters.
