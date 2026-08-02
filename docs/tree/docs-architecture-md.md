How the system is put together: the pieces, the boundaries between them, and what talks to
what. The structural half of the truth, with behaviour living next door in `specs/`.

The two are peers, and keeping them apart is what stops either from becoming a novel.
`ARCHITECTURE.md` never says what a booking does; a spec never says which service owns it.

## What it is for

**So a newcomer, human or agent, can locate a change before making it.** Which module owns
this, what it is allowed to depend on, where the boundary is that a change must not cross
quietly. Without it every change starts by reading code until a shape emerges, and the shape
each person infers is slightly different.

## What goes in here

The levels that survive contact with a real repository:

**Context.** What this system is, and what it talks to that it does not own.

**Containers.** The deployable pieces - services, workers, the database, the queue - and
what runs where.

**Components.** Inside each container, the modules and their allowed dependencies. This is
where boundaries get stated, and boundaries are the part worth the effort.

**Code.** Deliberately skipped. The code and the specs are the truth at that level, and a
diagram of it is stale within a sprint.

## What does not go in here

**Behaviour.** What the system does for whom is `specs/`. An architecture document
describing behaviour becomes a second, unchecked copy of the specs - unchecked because no
guard couples it to code.

**Decisions.** *Why* Postgres rather than Mongo is an ADR. This file records that it is
Postgres, and links the record. Merging the two makes the structure unreadable and buries
the decisions.

**Aspiration.** The architecture you intend is a plan. Documenting it here as though it
exists is how a document starts lying without anybody noticing they wrote a lie.

**Screenshots of diagrams.** If a diagram matters, keep it as text - Mermaid, ASCII,
anything diffable. A PNG cannot be reviewed, cannot be updated in a pull request, and is
stale the day it lands.

## How you actually use it

It is authored at adoption from your repository's own reality, not from a template, and it
is edited when the structure moves:

```
> we split the export worker out of the API - update the architecture
```

## Decisions behind it

- **Structure and behaviour are separate files.** Merging them is the intuitive choice and
  it produces a document nobody updates, because a change to either forces reading both.
- **The code level is skipped on purpose.** Every diagramming tradition includes it and it
  is the one that always rots: at that resolution the code is both the truth and cheaper to
  read than any description of it.
- **No TDR stream.** A "living technical design" record was considered. Everything it would
  hold is either structure, which is here, or behaviour, which is a spec.
