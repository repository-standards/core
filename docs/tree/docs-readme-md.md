The hub for the repository's documentation: one table, one line per document, saying which
question each one answers.

## What it is for

**So that finding the right document is not a search.** The value is not the links - a file
listing gives you those. It is the *question* beside each one, which is what turns "which
file was it" into "which of these am I asking".

## What goes in here

One row per document, with what it is **for** rather than what it contains. "The ADR/BDR
decision log" is a description; "why is it like this" is the question a reader actually
arrives with.

The method documents belong here too, pointing at the standard rather than at a local copy.
They are read at latest, so the row links out.

## What does not go in here

**Content.** The moment the hub starts explaining, it becomes a document that has to be kept
true alongside the ones it points at.

**Documents that do not exist yet.** An aspirational row is a dead link with good intentions.

**A second copy of the file listing.** If a row adds nothing the folder name does not already
say, delete the row rather than padding it.

## Decisions behind it

- **`fill-from-repo`.** Which documents you actually keep is yours; the shipped version is a
  starting shape, not a required set.
- **The questions are the point.** A hub of bare links was the first version and it was
  worth nothing over `ls`, which is why every row now carries what it answers.
