# Taxonomy - where each kind of knowledge lands

> The one map for "I have something to write down - where does it go?" It ends the
> recurring "is this an ADR or just a rule?" question. Boring and decisive on purpose.

## The map

| You have... | It is a... | Home |
|---|---|---|
| a fork taken among alternatives, that someone could reopen | **decision** | ADR (technical) / BDR (business) - `decision-records/`, MADR format |
| the settled way we do a recurring thing | **rule / convention** | the methodology doc (`specs/README`, conventions, `PRINCIPLES.md`) |
| what the system does now | **behavior** | `specs/<capability>/` (buildable) |
| how the system is built | **structure** | `ARCHITECTURE.md` |
| what the product is and where it is going | **vision** | `PRODUCT.md` |
| who we build for (and validate against) | **personas** | `docs/personas.md` - a gate above specs + backlog (ADR-006) |
| research / analysis that fed a decision | **working doc** | `docs/` (archivable once it has fed its decision) |
| the story / the narrative rationale | **narrative** | a blog or working doc - not a record |

## The two rules that end the oscillation

1. **A significant decision produces BOTH** - an ADR (the *why* + the rejected forms,
   so it is not re-litigated) AND a rule (the *what to do now*, in the methodology
   doc). Complementary, not either/or. E.g. "specs by capability" is **ADR-002** *and*
   a rule in `specs/README`.

2. **The ADR test is not "was there an alternative" - it is "is this a live,
   contestable trade-off that gets re-litigated?"**
   - A clearly-wrong alternative, settled -> just a **rule** (one-line *why* inline).
   - A contestable trade-off, or one that keeps coming back -> an **ADR** too.
     Signal it needs an ADR: it already came back once (e.g. Spec Kit's `NNN-`
     numbering re-appearing as `specs/cms/001-core/`).

## Right-size

Match the artifact to the substance. Do not reach for an ADR - or a new file, or a
version bump - when a rule, a doc line, or a blog note fits. Boring and proportionate
beats clever.

## ADR vs BDR

- **ADR** - a technical decision, read broadly: framework, library, tooling, infra,
  data-model, distribution / structure. *Architecturally significant*, not
  enterprise-architecture-only.
- **BDR** - a business / product decision; a separate stream (different stakeholders,
  altitude).
- Sub-scope goes in the record's `Tags`, never in the acronym. Full policy:
  [`decision-records/`](decision-records/README.md) (ADR-001).

## Ideas / discovery before a decision (endorsed; being refined)

Not everything worth writing down is a decision, a rule, or a behavior - some of it is a
**speculative idea that may never ship**. That is first-class here, not a lesser draft: an
idea can be explored end-to-end - including its **provisional technical and business shape** -
in one discovery/idea artifact under `docs/` (e.g. `docs/discovery/`), and it is worth keeping
in the repo even while it is only a maybe.

The rule that keeps the decision log honest:

- **Do not mint an ADR/BDR/spec for an un-approved idea.** `Proposed` in a record means "a
  decision awaiting ratification", not "an idea we might pursue" - dressing speculation as a
  record implies a fork was taken when none was.
- **Records and specs are created when the idea is approved for realization** and enters the
  [ways-of-working](ways-of-working.md) flow (idea -> backlog intent -> behavioral spec ->
  buildable spec + ADR/BDR). Until then the whole idea, technical shape included, lives in its
  discovery doc.

The exact shape of this division (folder, lifecycle/status, graduation step, guard) is being
designed - see `IDEA-1` in the backlog.
