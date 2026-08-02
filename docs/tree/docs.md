Everything the repository knows that is not code. What the product is, who it is for, why
it is built this way, what was decided, what is still open, and how to operate it when it
breaks.

The organising idea is that each kind of knowledge has exactly **one** home, so that
writing something down is never a question of taste and finding it is never a search.

## What is where, and why that split

| | holds | the question it answers |
|---|---|---|
| `PRODUCT.md` | what this is and where it is going | why does this exist |
| `PRINCIPLES.md` | the engineering principles | what do we refuse to trade away |
| `ARCHITECTURE.md` | structure and boundaries | how is it put together |
| `personas.md` | the roster | who is it for |
| `decision-records/` | ADR and BDR | why is it like this |
| `conventions.md` | the day-to-day rules | how do we work here |
| `backlog.md` | intents with a definition of done | what do we still owe |
| `discovery/` | provenance-stamped raw material | where did this come from |
| `ideas/` | speculation under a status | should this exist at all |
| `runbooks/` | operating knowledge and postmortems | it is broken, now what |
| `research/`, `journeys/`, `cycles/` | evidence, paths, commitments | *(scale)* |

Behaviour is deliberately absent from that list. It lives in `specs/`, one folder up,
because it is the one kind of knowledge that has to be checkable against the code.

## The rule that keeps it usable

**A fact has one home.** A count, a version, a path, a command belongs in one file, and
everywhere else links to it. Where a restatement genuinely has to exist, it gets declared
in `facts.json` and a guard fails when the two stop agreeing.

This is not tidiness. A number repeated in three files is three things to update and one
that will be wrong, and the wrong one is invisible until somebody acts on it.

## What does not go in here

**Anything the code already says.** Documentation that restates a function signature is a
second copy with a slower update cycle.

**Anything with no home in the table above.** If you cannot say which row it belongs to,
that is the useful signal: the standard's taxonomy exists to answer exactly that question,
and a genuine gap in it is worth raising rather than routing around.

**The method itself.** How adoption works, how the loop runs, how the changelog is cut -
that is the standard's own manual, adopted by reference and always read at latest. Copying
it into your repo means running a fork of the method that nobody updates.

## Decisions behind it

- **[ADR-023](../decision-records/ADR-023-method-docs-live-beside-the-tree.md) - the method is read
  at the source, never vendored.** Copying it in was the obvious alternative and it produces
  as many divergent copies of the method as there are repos, each frozen at the day it was
  adopted.
- **One home per kind of knowledge.** The alternative is a `docs/` folder that grows by
  accretion, where the same fact lives in three files and the newest one is not necessarily
  the true one.
