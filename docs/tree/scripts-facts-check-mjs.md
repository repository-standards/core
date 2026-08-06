Checks that every declared restatement still agrees with its source, and that every declared
pattern still matches something.

```
node scripts/facts-check.mjs
```

It reads `docs/facts.json`. With no such file it has nothing to check and says so.

## What it refuses to let happen

**A copy that drifted.** The landing says v0.9, `VERSION` says 1.0.0, and both look
confident.

**A pattern that stopped matching.** This is the subtler failure and the one it exists for.
A surface gets reworded past its declared pattern, so nothing is covering it any more - and
a check that quietly stops covering something is worse than no check, because the green
build now means less and nobody was told.

## How it reads a fact

A `home` is a file to `read`, a `count` of a glob, or a `match` that extracts the truth from
another file. Each claim names a file and a regular expression whose first capture group
must equal the home's value.

**Every mechanism reads UTF-8 text, and anything else is refused rather than guessed at.**
A repo whose canonical fact lives inside a compiled artifact - a font's version in its TTF
name table, a version resource inside an executable - cannot declare that artifact as a
home here. Point the fact at the text the artifact is built from, or leave the restatement
undeclared and say so where it is restated: a fact known to be unchecked is worth more than
a check whose answer depends on which encoding the bytes happened to use.

## Decisions behind it

- **Declaration rather than prohibition.** Banning restatement outright is unenforceable:
  surfaces exist that must print a value. Declaring makes the duplicate checked instead of
  forbidden and present anyway.
- **A dead pattern fails.** Skipping it silently turns the register into decoration the
  first time somebody rewords a paragraph.
