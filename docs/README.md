# docs/ - about this product (zone 1)

What the repository-standards project says about itself, plus the standard's method
manual. The client-authored templates and tool manuals live in the shipped tree -
[`standard/docs/`](../standard/docs/) - not here.

| File | What it is |
|---|---|
| [what-and-why.md](what-and-why.md) | the docs front page - what the product is, then the argument for why it exists |
| [quick-start.md](quick-start.md) | the first run: fetch, the prompt for each situation, prove it, update it |
| [method/](method/README.md) | the standard's method manual - adoption, assessment, taxonomy, decision checklist, ways of working (including [working with AI](method/working-with-ai/README.md)), changelog process; clients adopt it by reference from the living standard - always latest (ADR-023) |
| [ecosystem.md](ecosystem.md) | how the repos fit together - the engine, the map packs, and how a stack plugs in |
| [positioning.md](positioning.md) | the one statement and pillars every surface quotes verbatim |
| [personas.md](personas.md) | who this product serves - the roster the specs and backlog cite |
| [faq.md](faq.md) | short canonical answers to recurring adopter questions |
| [decision-records/](decision-records/README.md) | this repo's own ADRs - the decisions that shaped the standard, gist table in the index |
| [open-questions/](open-questions/README.md) | the owner's provisional calls, openly seeking challengers - one file per topic, deliberations kept |
| [case-studies/](case-studies/) | anonymized field evidence - the cases that earned the rules |
| [file-map.md](file-map.md) | **generated** - what every shipped file is, why it exists and the rule it enforces, rendered from `standard.manifest.json` so it cannot disagree with what self-verify checks; `tools/file-map.mjs --check` fails CI on a stale copy |
| [validation/](validation/README.md) | **generated** - the proof-of-work suite: real cases run against real repositories, failures published with their fix (or an open waiver), the portable subset offered as a benchmark to other standards; `tools/validation.mjs --check` fails CI on a stale render or a silently-unwaived failure |
| [facts.json](facts.json) | the facts this repo restates on more than one surface, each with its source - `standard/scripts/facts-check.mjs` fails when a restatement stops agreeing |
