The register of facts that are stated in more than one place, and where each one really
lives. `facts-check` reads it and fails the build when a restatement stops agreeing with its
source.

It exists because R4 says a fact has one home, and reality says sometimes it cannot. A
version number belongs in `VERSION`, but the landing page has to print it. A count belongs
where the things are counted, but a sentence somewhere wants to say it out loud.

## What it is for

**So a duplicate is declared rather than accidental.** An undeclared restatement is
invisible: nothing knows it exists, so nothing notices when it goes wrong, and it goes wrong
quietly - the source moves and the copy keeps asserting the old value with total confidence.

A declared one is checked on every pull request.

## What goes in here

One entry per fact: where it lives, and every place that repeats it with the pattern that
extracts it.

```json
[
  {
    "id": "standard-version",
    "what": "the version the standard currently ships",
    "home": { "read": "VERSION" },
    "claims": [
      { "file": "standard/SPEC.md",  "pattern": "^Version (\\d+\\.\\d+\\.\\d+)" },
      { "file": "site/index.html",   "pattern": "class=\"tag mono\">v(\\d+\\.\\d+\\.\\d+)" }
    ]
  }
]
```

A `home` is either a file to `read`, a `count` of a glob, or a `match` that extracts the
truth from another file. Each claim's capture group must equal it.

## The failure mode it is built for

A pattern that **matches nothing** fails, and that is deliberate rather than lenient. If a
surface gets reworded past its pattern, the check has stopped covering it - and a check that
silently stops covering something is worse than no check, because the green build now means
less than it did and nobody was told.

This fires in practice. Editing a quickstart to remove a version from a command was enough
to make its declared restatement match nothing, and the build said so in the same run.

## What does not go in here

**A fact with one home.** If nothing repeats it, there is nothing to declare. This file is
for the exceptions, and it should stay short - a long one means R4 is being routed around
rather than followed.

**Prose that merely mentions a topic.** A claim is a specific value with a pattern that
extracts it. "The standard ships several guards" is not a fact you can check; the number of
guards is.

**A restatement you could delete instead.** Declaring it is the fallback. Linking to the
home is the answer, and it is available more often than it looks.

## Decisions behind it

- **Declaration, not prohibition.** Banning restatement outright was the simpler rule and it
  is unenforceable: surfaces exist that must print a value. Declaring them makes the
  duplicate visible and checked instead of forbidden and present anyway.
- **A pattern that stops matching is a failure, not a skip.** The lenient behaviour was
  considered and rejected in one sentence: it turns the whole file into decoration the first
  time somebody rewords a paragraph.
