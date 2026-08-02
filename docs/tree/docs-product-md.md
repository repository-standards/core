What this product is, who it is for, and where it is going. The file that answers "why does
this repository exist" without describing a single feature.

If somebody has to read your specs to work out what you are building, this file is missing
or wrong.

## What it is for

**So that the specs have something to be measured against.** A capability spec answers what
the system does; this answers what the system is *for*. Without it every scope argument is
decided by whoever is most confident, because there is nothing to appeal to.

It is also the file that makes "should we build this" answerable. A feature request either
serves what is written here or it changes it, and both are fine - what is not fine is
neither being noticed.

## What goes in here

**What it is**, in a sentence somebody outside the team would understand.

**What people do today instead.** The alternative your users currently live with, including
"nothing" and "a spreadsheet". This is the section most product documents skip and the one
that makes the rest honest: if the current workaround is genuinely fine, that is the most
useful thing you can know early.

**Who it serves**, pointing at the persona roster rather than restating it.

**Where it is going.** Direction, not a roadmap with dates. Dates belong to cycles, which
measure themselves.

**What it is deliberately not.** The boundary that stops the product becoming everything
somebody once asked for.

## What does not go in here

**Features.** The capability specs are the feature list, and they are the checked one. A
list here goes stale the first week and then quietly contradicts the specs.

**A roadmap with dates.** Direction survives contact with reality; a dated plan in a
document nobody re-opens becomes a document that misleads.

**Marketing copy.** This is read by the people building the thing. If it reads like a
landing page, it stops being usable as an argument in a scope discussion, which is its job.

## How you actually use it

It is written from what the repository already knows - the code, the discovery dossiers, the
records - before you are asked a single question, and then it asks you only what could not
be worked out:

```
> we have never written down what this product is - draft it from what is here, then ask me what is missing
```

## Decisions behind it

- **"What people do today instead" is a required section.** It was added because a product
  document without it describes a solution with no stated problem, which reads as convincing
  regardless of whether the problem exists.
- **Direction, not dates.** Dates in a document that is not measured always drift, and a
  drifted date is worse than no date because somebody plans against it.
- **Personas are linked, not restated.** A copy of the roster here would be a second roster,
  and the guard reads the other one.
