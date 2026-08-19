# Adoption provenance

Who answered each of the questions this standard must not decide by itself, and what
happened to the answer. One table, because the point of it is that a reviewer can read
every state in one pass - scattered across the artifacts they would never be compared.

Every row starts `pending`: this repo has not been through the questions yet. A row stays
legal there until the point is **reached** - until an artifact it gates exists that did not
ship as a template. `scripts/elicitation-provenance.mjs` fails from that moment on, because
something was written where the question belonged, so it was either asked or skipped.

**States** - the full set and what each one costs is in
[`.claude/elicitation/README.md`](../.claude/elicitation/README.md):

| State | Use it when |
|---|---|
| `pending` | the run has not reached this point |
| `human` | a person answered - name them and date it |
| `provisional` | you suggested, they will check later - **name the backlog row**, or the promise is lost |
| `inferred` | you concluded it from the code and said so - most points refuse this |
| `absent` | you wrote a stub rather than guess, and the gap is visible in the artifact |

## The record

| Point | State | Answered by | When | Landed in | Backlog row |
|---|---|---|---|---|---|
| `adopt.layout` | pending | - | - | - | - |
| `adopt.intent` | pending | - | - | - | - |
| `adopt.continue` | pending | - | - | - | - |
| `adopt.existing-material` | pending | - | - | - | - |
| `adopt.records` | pending | - | - | - | - |
| `adopt.personas` | pending | - | - | - | - |
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
