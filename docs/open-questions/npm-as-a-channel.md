# Whether the standard ships an npm package at all

**Open.** The backlog says "publish the npm package with the positioning one-liner"
(`DISCO-1`), and there is no `package.json` to publish. That is not an oversight to correct
mechanically - it is a question nobody has answered, and answering it by writing the manifest
would be deciding it by accident.

## What is actually being proposed

The standard ships as a markdown tree fetched with `degit`. An npm package could not ship the
tree as a dependency in any useful sense - nothing imports it. It would be a **thin CLI** whose
job is to fetch the tree and point the agent at the align skill:

```
npx repository-standards            # instead of
npx degit bodurkalukasz/repository-standards .repository-standards
```

Roughly thirty lines. The question is whether those thirty lines earn a second distribution
channel.

## For

- **npm is a search surface.** Registries, awesome-lists and roundups index it; a repo alone is
  indexed by GitHub search and nothing else.
- **The quickstart becomes one command**, and the current one is a two-part incantation with a
  target directory and a `.gitignore` note attached.
- **`package.json` is a canonical description with keywords**, in a format that scrapers,
  registries and training corpora all read the same way.

## Against

- **It implies Node.** The standard is deliberately stack-agnostic and the first thing a Python
  or Go team would meet is an npm command. The guards are already Node, so this is a difference
  of degree - but the guards run *after* adoption, and this would be the front door.
- **A second version number.** The npm version and `.standards-version` would have to agree, and
  nothing would check that they do. This repo has spent a lot of effort on exactly that class of
  drift.
- **A second thing to maintain and to break.** A stale published package that fetches a moved
  path fails in a way the repo cannot detect.

## What would settle it

Not preference. Either of:

- **Evidence that people look.** If the target queries or the listings route through npm at all -
  and the 2026-08-02 landscape check found the discovery channel is comparison articles, not
  registries, which is weak evidence *against*.
- **A real adopter saying the degit line was the friction.** Nobody has adopted this yet who was
  not the author, so nobody has hit it.

## Timing, which is not neutral

Publishing to npm claims a name. Names on npm are effectively permanent, and the package would
be published against a standard that has **no tag yet** - so it would carry a version number
before the thing it distributes has one. Whatever the answer, it comes after the first tag.

## Related

- `DISCO-1` in [`backlog.md`](../../backlog.md) - the row that assumes the answer is yes.
- The landscape check that produced the doubt lives in the owner's private research space, not
  here; the finding it carried into the repo is the FAQ's corrected comparison.
