The event taxonomy: what your product records about how it is used, named consistently, in
one place.

## What it is for

**So that an event name means the same thing in six months and in three services.** Analytics
decays in a specific way - two events for the same action, one of them nearly-correct, and
nobody can tell which dashboard is lying. Writing the taxonomy down does not prevent that; it
makes it visible when it happens.

## What goes in here

Each event: its name, when exactly it fires, its properties with their types, and which
question it exists to answer.

That last one is the field people skip and the one that keeps the file honest. An event
nobody can name a question for is one nobody will notice breaking - and there is usually at
least one.

## What does not go in here

**Personal data.** An event carries what happened, not who. If a property would identify a
person, that is a decision with legal weight and it belongs in a record, not in a taxonomy
row.

**Dashboards.** They live in the tool; link them.

**Events you have not implemented.** A taxonomy describing intent rather than reality is
worse than none, because the whole point is being able to trust that this list is what the
product actually emits.

## Decisions behind it

- **Scale profile.** A repository without analytics has nothing to name. The file is
  optional and arrives when the practice does.
- **It ships as a page rather than a template with example events.** Example event names in
  a live taxonomy get shipped by accident, exactly as example personas do in a roster a
  guard reads.
