# docs/ - the standard's method docs, templates, and this repo's own doc spaces

Zone 2 source (shipped via `tools/reflect.mjs`) plus a few zone-1 spaces this repo keeps
for itself. If you are looking for "where does a kind of knowledge go", start at
[`taxonomy.md`](taxonomy.md).

## Contents

| Item | Kind | What it is |
|---|---|---|
| [taxonomy.md](taxonomy.md) | method (shipped) | where each kind of knowledge lands; the folder-README convention; living docs |
| [ways-of-working.md](ways-of-working.md) | method (shipped) | PO -> Dev -> AI flow, statuses, the clarify gate, close & cleanup |
| [adoption.md](adoption.md) | method (shipped) | brownfield gates, profiles picker (solo vs team), modernize hand-off |
| [repo-assessment.md](repo-assessment.md) | method (shipped) | the analysis pass before onboarding |
| [self-verify.md](self-verify.md) | method (shipped) | how drift-as-a-number verification works |
| [changelog-process.md](changelog-process.md) | method (shipped) | fragments -> two changelogs; maintainer cuts releases |
| [faq.md](faq.md) | this repo's own (public) | the questions every adopter asks - models, messy repos, trackers, solo vs team |
| [open-questions.md](open-questions.md) | this repo's own (public) | provisional judgment calls, each openly seeking a better answer - the contributor's entry point |
| [manifesto.md](manifesto.md) | this repo's own (public) | the founder's why - the idea, what it must feel like, the non-negotiables |
| [positioning.md](positioning.md) | this repo's own (public) | the statement, three pillars, the one-liner - every surface quotes, never re-phrases |
| [analytics.template.md](analytics.template.md) | template (shipped) | the tracking plan - event taxonomy, same-PR coupled to code |
| [research/](research/README.md) | space (shipped) | study insights that must name the persona/idea/spec they change |
| [journeys/](journeys/README.md) | space (shipped) | per-persona journeys, stages coupled to capabilities |
| [AGENTS.template.md](AGENTS.template.md), [ARCHITECTURE.template.md](ARCHITECTURE.template.md), [PRODUCT.template.md](PRODUCT.template.md), [PRINCIPLES.template.md](PRINCIPLES.template.md), [README.template.md](README.template.md), [personas.template.md](personas.template.md), [backlog.template.md](backlog.template.md) | templates (shipped, filled by the consumer) | the skeleton documents a consuming repo fills with its own content |
| [personas.md](personas.md) | this repo's own | who repository-standards itself serves (PERS-3) |
| [ideas/ -> standard/docs/ideas/](../standard/docs/ideas/README.md) | space (shipped, lives in zone 2) | pre-decision ideas - statuses, graduation (ADR-010) |
| [case-studies/](case-studies/README.md) | this repo's own (public) | anonymized field cases -> the rules they earned |
| (working notes) | outside the repo | research, drafts, and idea-stage notes live in the owner's private space by rule - only decided outputs land here |

## Why this shape, and how to use it

- **`*.template.md` vs the rest:** templates ship to `dist/` transformed (placeholders
  resolved or example-filled - the `divergent` class); method docs ship byte-identical
  (`copy` class). The mapping lives in `tools/reflect.mjs` - a new doc here needs a map
  entry there, or the drift check flags it.
- **This repo's own spaces** (`personas.md`, `case-studies/`, `working/`) are not part
  of the skeleton - a consuming repo grows its own. They live under `docs/` because the
  taxonomy says that is where such knowledge goes; the standard follows its own map.
- **Every folder here explains itself** - the three-section README convention in
  [`taxonomy.md`](taxonomy.md) applies to this folder too; this file is its instance.
