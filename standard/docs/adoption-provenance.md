# Adoption provenance

Who answered each of the questions this standard must not decide by itself, and what
happened to the answer. One table, because the point of it is that a reviewer can read
every state in one pass - scattered across the artifacts they would never be compared.

Every row starts `pending`: this repo has not been through the questions yet. A row stays
legal there until the point is **reached** - until the adoption itself writes something, at a
path that point gates, that did not ship as a template.
`scripts/elicitation-provenance.mjs` fails from that moment on, because something was written
where the question belonged, so it was either asked or skipped. What this repository already
had before the adoption never counts: a brownfield repo arrives holding decision records and
specs it wrote years earlier, and its own history says nothing about who was asked what.

**States** - the full set and what each one costs is in
[`.claude/elicitation/README.md`](../.claude/elicitation/README.md):

| State | Use it when |
|---|---|
| `pending` | the run has not reached this point |
| `human` | a person answered - name them and date it |
| `provisional` | you suggested, they will check later - **name the backlog row**, or the promise is lost |
| `inferred` | you concluded it from the code and said so - most points refuse this |
| `absent` | you wrote a stub rather than guess, and the gap is visible in the artifact |

**Two kinds of row, and the difference decides what a row is worth later.** Most points here
belong to the repository - who it is for, how its records are kept, which profile it runs at -
and are asked once. Once such a row says a person answered and the row is **committed**, the
elicitation guard stops demanding the question again: a later session writing
`docs/decision-records/` or `docs/personas.md` is working under an answer this repository
already gave. The rest belong to a piece of work rather than to the repository - the scope of a
specification, the materials behind one discovery digest, the participants in one run - and no
committed row settles those. They are asked every time, and their row records the most recent
answer rather than a standing permission. `.claude/elicitation/points.json` declares which is
which as `scope`.

## The record

| Point | State | Answered by | When | Landed in | Backlog row |
|---|---|---|---|---|---|
| `adopt.language` | pending | - | - | - | - |
| `adopt.layout` | pending | - | - | - | - |
| `adopt.profile` | pending | - | - | - | - |
| `adopt.stack` | pending | - | - | - | - |
| `adopt.intent` | pending | - | - | - | - |
| `adopt.evidence` | pending | - | - | - | - |
| `adopt.continue` | pending | - | - | - | - |
| `adopt.existing-material` | pending | - | - | - | - |
| `adopt.records` | pending | - | - | - | - |
| `adopt.personas` | pending | - | - | - | - |
| `adopt.tracker` | pending | - | - | - | - |
| `adopt.backlog` | pending | - | - | - | - |
| `adopt.guards` | pending | - | - | - | - |
| `adopt.commit-plan` | pending | - | - | - | - |
| `green.product` | pending | - | - | - | - |
| `green.conventions` | pending | - | - | - | - |
| `green.stack` | pending | - | - | - | - |
| `spec.scope` | pending | - | - | - | - |
| `spec.acceptance` | pending | - | - | - | - |
| `spec.unknowns` | pending | - | - | - | - |
| `discover.materials` | pending | - | - | - | - |
| `discover.decisions` | pending | - | - | - | - |
| `record.participation` | pending | - | - | - | - |

<!-- The table is parsed by position, six cells per row. Add columns to the right if you
     need them; do not reorder these. `-` means not applicable, never "I did not fill it in". -->

## Questions this run asked that no point declares

The declared points are a floor, not a ceiling. They are the questions that can be
*enforced* - the hook refuses a write for a point that exists, and it can only refuse what
somebody wrote down. Every repository is different, and the questions worth asking here are
mostly ones no list anticipated: ask them, lead with the answer that converges on the
standard, and record them below.

This table is how the standard learns. A question invented in a real adoption, answered by a
real owner, is better evidence for what belongs in the point list than anything written at a
desk - `adopt.tracker` got into the list exactly that way, from a live run on 2026-08-19 that
asked where tracked work lives and recommended keeping the repository's parallel tracker.
When rows accumulate here, send them to the standard.

| Question asked | Which answer led | What was chosen | Worth declaring? |
|---|---|---|---|
| - | - | - | - |

