The shape of `facts.json`, with a worked entry. Copy it, replace the contents with your
repository's own facts, and `facts-check` starts guarding them.

## What it is for

The register only works if somebody writes it, and the format is the barrier: it is a small
schema with a regular expression in it, and nobody guesses that from a blank file. This
shows it in one screen.

## Why it is a separate file rather than a commented blank

Because `facts-check` reads `facts.json` and this is not it. A commented-out example inside
the real file gets partially uncommented, and half-declared facts fail in the confusing
direction - a pattern that matches nothing looks exactly like a surface that drifted.

Keeping the example beside the real file rather than inside it also means the example can
carry values that are obviously fake without any risk of one being checked.

## What does not go in here

**Your repository's facts.** They go in `facts.json`. This one stays as it shipped, so the
next person reading it sees the shape rather than somebody's half-migrated register.

## Decisions behind it

- **Example files ship beside the real ones, never as commented blocks inside them.** The
  same reasoning applies to `capability-map.example.json` and to the worked persona roster:
  an example living inside a file a guard reads is an example that can be enforced by
  accident.
