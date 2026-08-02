# Taxonomy - where each kind of knowledge lands

> The one map for "I have something to write down - where does it go?" It ends the
> recurring "is this an ADR or just a rule?" question. Boring and decisive on purpose.

## You have this case - say this

**You do not want to read a map.** You want the thing filed. Say what you have and let
the agent place it:

```
> where does this go: we decided to stop supporting IE11
> where does this go: guests should see the cancellation fee before confirming
> where does this go: never call the payment API from the scheduler
```

Three sentences, three homes - a decision record, a spec, a convention. The agent
answers with the destination and writes it there; if it is wrong, correcting the
destination is one line, and cheaper than filing it nowhere.

**Corner case - it is two things at once.** "We decided guests see the fee" is a
decision *and* a behavior. Both land: the record holds why the fork went that way, the
spec holds what the product does. Neither restates the other.

**Corner case - it might not belong in the repo at all.** Meeting notes and raw
material go to `docs/discovery/`, not into a spec. A spec that quotes a meeting has
already started rotting.

## The map

| You have... | It is a... | Home |
|---|---|---|
| a fork taken among alternatives, that someone could reopen | **decision** | ADR (technical) / BDR (business) - `decision-records/`, MADR format |
| the settled way we do a recurring thing | **rule / convention** | the methodology doc (`specs/README`, conventions, `PRINCIPLES.md`) |
| what the system does now | **behavior** | `specs/<capability>/` (buildable) |
| how the system is built | **structure** | `ARCHITECTURE.md` |
| what the product is and where it is going | **vision** | `PRODUCT.md` |
| who we build for (and validate against) | **personas** | `docs/personas.md` - a gate above specs + backlog (ADR-006) |
| a speculative idea that may never ship | **idea** | `docs/ideas/<slug>.md` - status-driven, no records until approved (ADR-010) |
| materials from active discovery - a meeting extract, a mail, a finding whose *source* matters | **discovery entry** | `docs/discovery/<topic>/` - a dossier per topic, provenance-stamped; never normative, the spec always wins (ADR-024, [discovery.md](discovery.md)) |
| what we tell the market (statement, pillars, one-liner) | **positioning** | `docs/positioning.md` - every surface quotes it, never re-phrases (PDLC-1) |
| a product event the code emits | **tracking-plan entry** | `docs/analytics.md` - listed before it ships; same-PR coupled to the code (PDLC-3) |
| what a study taught us | **research insight** | `docs/research/<study>.md` - anonymized; must name what it changes (PDLC-4) |
| how a persona travels the product | **journey** | `docs/journeys/<persona>.md` - stages -> capabilities, coupled to specs (PDLC-5) |
| how to run, diagnose, or undo a service in production | **runbook** | `docs/runbooks/<service>.md` |
| what an incident taught us | **postmortem** | `docs/runbooks/postmortems/<date>-<slug>.md` - blameless; every action item becomes a backlog item |
| a deploy / rollback decision pre-made | **decision** | the release-strategy fork in the [decision checklist](checklist.md) - rollback triggers decided before the first deploy, not during the incident |
| research / analysis that fed a decision | **working doc** | `docs/` (archivable once it has fed its decision) |
| the story / the narrative rationale | **narrative** | a blog or working doc - not a record |
| a judgment call in force, openly seeking a better option | **open question** | a record with `Status: Proposed`, or - if the project runs a governance surface for it - one file per topic under `docs/open-questions/`. The standard keeps its own at [`docs/open-questions/`](https://github.com/repository-standards/core/blob/main/docs/open-questions/README.md); it ships no template for one, because a repo that is building a product usually wants the doubt attached to the decision it qualifies, not filed separately |

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
  [`decision-records/`](../tree/docs-decision-records.md) (ADR-001).

## Ideas / discovery before a decision

Not everything worth writing down is a decision, a rule, or a behavior - some of it is a
**speculative idea that may never ship**. That is first-class here, not a lesser draft: an
idea is explored end-to-end - including its **provisional technical and business shape** -
in one file under [`docs/ideas/`](../tree/docs-ideas.md), and it is worth keeping in the repo
even while it is only a maybe.

The rule that keeps the decision log honest:

- **Do not mint an ADR/BDR/spec for an un-approved idea.** `Proposed` in a record means "a
  decision awaiting ratification", not "an idea we might pursue" - dressing speculation as a
  record implies a fork was taken when none was.
- **Statuses drive it** (ADR-010): `idea -> exploring -> approved | parked | dropped`. On
  approval the idea **graduates** into the [ways-of-working](ways-of-working.md) flow
  (backlog intent -> behavioral spec -> buildable spec + ADR/BDR) and the idea doc flips to
  `graduated` with links. Until then the whole idea, technical shape included, lives in its
  idea doc - and `parked`/`dropped` docs stay as cheap memory of why not.
- **An idea is not a dossier.** The moment a topic is actively pursued and accumulating
  materials (meetings, mails) whose provenance matters, it is **discovery**, not an idea:
  it gets a dossier under `docs/discovery/<topic>/` and can draft its spec early, gaps held
  as typed open markers. The full model - entries, the `Last reconciled:` stamp, precedence -
  is [discovery.md](discovery.md) (ADR-024).

## Living documents - updated in place

Everything in the map above is **living**. A spec, `ARCHITECTURE.md`, `PRODUCT.md`, the
personas, the rules - they change as the product changes, by **editing the same file in
place**. The current version is the truth; git is the history. Do not append incremental
versions, `-v2` files, or "amendment" sections when an update will do. Two qualifications
keep this honest:

- **When the previous state matters, say so in the doc.** If a change reverses something
  important, keep one line on what changed and why - only when the old state is information
  a future reader will need, not as ritual.
- **Decision records live by status, not by rewriting.** An accepted ADR/BDR that no longer
  holds is not edited into a different decision - it is **superseded** by a new record
  (status flip + link). Same living principle, record altitude: the log stays honest while
  the current set of accepted records describes the present.

Nothing here is set in concrete - but a living edit still travels the
[ways-of-working](ways-of-working.md) loop (impact -> reconcile -> spec and code in the same
PR), which is what keeps "living" from meaning "drifting".

## Every folder explains itself - the README convention

Each directory carries a `README.md` that answers three things, in this order (GitHub
renders it right where the reader lands - that is why it is `README.md` and not another
name):

1. **What lives here** - one or two sentences.
2. **Contents** - one line per file/subfolder: what it is, when to read it.
3. **Why this shape, and how to use it** - the recommendation and the reasoning: why the
   folder is organized this way, what belongs here vs elsewhere, how an agent or human
   should work with it.

Keep the README readable: when a *why* or *how* needs length - worked examples, a full
walkthrough - it moves to its own doc (a guide next to the README, or a case study,
where the repo keeps a collection) and the README links it. The same-PR coupling
applies: a change that adds, removes, or repurposes a file updates the folder's README
in that PR.

Naming rule: `README.md` **describes a folder**; `catalog.md` is reserved for a
**curated list of items of one kind** (like the
[decision checklist](checklist.md)) - the two are different genres and
must not be mixed.
