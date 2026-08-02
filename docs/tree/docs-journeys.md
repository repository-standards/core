One file per persona, mapping how that person actually travels through the product: where
they enter, what they hit, where it hurts, and where they leave.

Journey maps have a well-known failure mode. They get made once, in a workshop, printed,
admired, and are never true again. Here the map is **coupled to the capabilities that serve
each stage**, so a shipped or retired capability has a named place it must move.

## What it is for

Two questions that otherwise get answered by guessing.

**Where does this person actually enter?** Not where we think they should. A map that
starts at the signup page when half your users arrive at a shared link is a map of the
product you wish you had.

**What does this stage cost us?** A pain nobody wrote down is a complaint. A pain in the
map, with a backlog item attached, is work.

## What goes in here

One file per persona, named after the persona slug, from the template beside it.

Every stage lists the `specs/<capability>` entries that serve it. That is the coupling: a
new capability slots into a stage, a retired one leaves it, **in the same pull request**.
The reason is the same as the coupling guard's: a journey naming a capability the repo no
longer has is worse than no journey, because it reads as current.

Pains are backlog feeders. A stage pain with no backlog item is one of two things, and the
file has to say which: **accepted** (we know, we are not fixing it) or **missing work**.
Anything else is a map that lists problems nobody owns.

## What does not go in here

**A journey for a persona that is not in `personas.md`.** If they are not on the roster,
the map is fiction with a name attached.

**Screen designs.** A journey is stages and what serves them. The interface is not the
journey, and mapping it that way is how the map dies the next time the UI changes.

**Aspiration.** Map what happens, then use the pains to say what should. Mapping the
intended journey produces a document that never disagrees with anyone and therefore never
tells you anything.

## The corner case that catches people

**Two personas, one screen.** Map the journeys separately even when the interface is
shared. A shared screen serving two journeys is exactly where one persona quietly inherits
the other's experience, and a single merged map is what hides it.

## How you actually use it

```
> map the host journey from first contact to first payout, stage by stage
```

```
> hosts drop out at identity verification - put it on the journey
  and file what it costs us
```

```
> pre-approval shipped - attach it to the booking stage of the guest journey
```

## Decisions behind it

- **Stages point at capabilities.** A prose journey was the alternative and it is the
  poster on the wall: nothing links it to the system, so nothing forces it to move.
- **Journeys arrive at the `scale` profile.** A solo repo with one persona gets a map that
  restates what the specs already say. The ceremony only pays once several people hold
  different parts of the same path.
- **A pain is either owned or explicitly accepted.** Allowing a third state, noted, was
  considered and it is where every one of them ends up.
