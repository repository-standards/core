The roster of who you build for. Not a UX nicety and not a marketing artefact: in this
standard personas are a **validation gate**, and a spec that cannot name the person it
serves does not pass it.

The reason is one sentence. "The user" wants everything, so a spec written for "the user"
settles nothing and every trade-off inside it is decided by whoever writes the code.

## What it is for

Personas sit **above** specs and the backlog in the altitude, so:

- a capability spec names the persona or personas it serves, and how
- a backlog item names whose problem it moves
- an idea that cannot name a persona gets parked, not built
- when two personas conflict, the resolution is a **recorded decision**, not a coin flip

This is the product-side mirror of buildable specs. A buildable spec makes behaviour
verifiable against the **code**. A persona makes it verifiable against a **user**.

## What goes in here

A table. `scripts/spec-structure.mjs` reads it as the live roster, so it is data as much as
prose - and the name goes in backticks, which is the part the guard parses.

```markdown
| Persona | Primary? | One-line |
|---|---|---|
| `Host Hanna, part-time landlord` | yes | lists two flats, checks payouts weekly |
| `Guest Gustav, business traveller` | | books late, cancels often, never calls support |
| `Ops lead Ola, mid-size agency` | | manages 60 listings and three staff accounts |
```

A row without them reads as no persona at all, so a table written that way is an empty
roster. The guard says so rather than passing everything.

Keep it small. Three to six is typical, and that is a **ceiling rather than a quota**: one
persona you actually know beats three invented to fill the table, and invented ones produce
specs that serve nobody while passing every check.

Mark the **primary** persona - the one who wins ties unless a decision says otherwise.
Without that, every conflict is a fresh argument.

## What does not go in here

**Demographics for their own sake.** Age and location matter only where they change what
the person needs. A persona is a job to be done wearing a name.

**Segments.** "Enterprise" is a pricing tier, not a person. If nobody on the roster has a
Tuesday, it is a segment.

**Example personas from someone else's product.** This is worth stating because the shipped
template carries a worked example further down the file, deliberately kept **out** of the
roster table: the structure guard reads the table as truth, so example names left in it
would let a spec claim to serve a persona from a rental-property demo and pass the gate.

## How you actually use it

```
> we have never written down who this is for - interview me and build the roster
```

And when a spec is vague about it, which is the moment the gate earns its keep:

```
> this spec says "the user" - who on the roster is it, and what does it do for them?
```

## Decisions behind it

- **[ADR-006](../decision-records/ADR-006-personas-are-a-validation-gate.md) - personas
  gate, they do not decorate.** Treating them as a UX deliverable was the alternative, and
  it produces a document written once and consulted never. Making them a gate means a spec
  cannot merge without answering "for whom", which is the only mechanism that keeps the
  roster true.
- **One primary persona.** Ties without a tiebreaker get resolved by whoever is in the room,
  silently and differently each time.
- **The roster is a table, not prose.** A guard has to be able to read it. Prose personas
  cannot be checked, and unchecked gates stop being gates.
