# How this repository runs itself

The strongest thing this project can show you is not the tree it ships. It is that the
project is run by the standard it publishes: its own specs are buildable, its own decisions
are records, its own backlog is a file, and its own guards fail its own pull requests.

This page is the tour of that, because the shipped tree is only half of what is here and
the other half is where everything came from.

## Two zones, and the boundary is enforced

| | what it is |
|---|---|
| `standard/` | the tree an adopter receives, authored directly at client-repo paths |
| everything else | this project's own life: its docs, its site, its tooling, its specs |

There is nothing to keep in sync between them, because there is no second copy. The tree is
authored where it lands, and `tree-check` fails the build if repo-own material leaks into
it or if the manifest promises a file the tree does not have.

That decision is [ADR-014](decision-records/ADR-014-one-authored-tree.md), and it replaced a
model with a source tree and a generated one. Generation meant a script decided what
adopters got, which meant the script was the standard and nobody could read it.

## What each directory is

```
repository-standards/
├── standard/            the tree an adopter receives, at client-repo paths
│   ├── AGENTS.md            what their agent loads first
│   ├── specs/               their capability specs live here
│   ├── scripts/             the guards, copied in and run by their CI
│   └── .claude/skills/      the lifecycle, as procedures
│
├── docs/                this project's documentation
│   ├── method/              the manual adopters read FROM HERE, never copied
│   ├── tree/                one page per shipped path (the File anatomy section)
│   ├── decision-records/    our own ADRs
│   ├── open-questions/      calls made on judgment, held open on purpose
│   └── case-studies/        times the loop caught something, and times it did not
│
├── specs/               our own capability specs - the tooling you are using now
├── tools/               the checks this repo runs on itself; never shipped
├── skills/              the transition skills; run from a checkout, against your repo
└── site/                the landing, plus the generated docs
```

Three of those are worth a sentence, because their names do not give them away.

**`docs/method/`** is the only part an adopter reads from here rather than receiving. It is
adopted by reference, always at latest, so there are not as many forks of the method as
there are repositories ([ADR-023](decision-records/ADR-023-method-docs-live-beside-the-tree.md)).

**`docs/tree/`** used to be README files inside the shipped tree. They were removed because
a manual copied into somebody's repository ages there and nobody edits it.

**`skills/`** never ships. `align-to-standards` runs from a checkout of this repository
against yours; shipping it into an adopted repo would leave behind a skill for a transition
that already happened.

`site/docs/` is generated and gitignored. Editing the HTML there is editing an output.

## The standard, applied to itself

Everything below is this project eating its own cooking, and each is readable here:

- **[Our capability specs](../specs/verify-engine/spec.md)** - buildable specs for real tools,
  which is the only honest way to show what "buildable" means
- **[Our decision records](decision-records/README.md)** - thirty of them, each with what it
  settled and what it rejected
- **[Our open questions](open-questions/README.md)** - calls made on judgment and held open on
  purpose, which is the part most projects keep private
- **[Our personas](personas.md)** - who this is built for, named, with the primary one
  marked
- **[Our case studies](case-studies/README.md)** - times the loop caught something, and times it
  did not

The backlog, the sprints and the changelog are the same story in files rather than pages.

## What this repository does not do

It does not run the shipped workflows. The `.github/` files under `standard/` are inert
here on purpose: a workflow running in the repository that publishes it would be testing the
wrong tree. This project's own checks live in its own `.github/workflows/checks.yml`, and
`tree-check` enforces the separation.

It does not carry a technology opinion. Layer 1 is stack-agnostic by rule, so anything about
TypeScript, Node or any other ecosystem belongs to a stack repository and genuinely cannot
land here.

## Why any of this matters to you

A standard that its own authors do not follow is a document. The measurable claim is small
and checkable: this repository reports drift 0 against the manifest it publishes, its specs
are coupled to its code by the same guard it ships, and every decision behind the tree you
would adopt is written down and linked from the page describing the thing it decided.

If that turns out not to be true anywhere, it is a bug worth an issue.
