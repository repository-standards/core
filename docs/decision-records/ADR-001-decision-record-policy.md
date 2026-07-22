# ADR-001: Decision records use MADR; ADR = broad technical, BDR = business

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-07 |
| **Author** | Łukasz Bodurka |
| **Tags** | meta, governance, decision-records |

## Context

This standard tells other repos to record decisions, but never defined - for itself
or for them - **what counts as a decision record**, **in what format**, and **how the
technical / business split works**. Three doubts kept re-opening:

- Is "choose a CSS framework / a library over its alternatives" an ADR, a BDR, or a
  revived TDR?
- One decision umbrella, or separate streams?
- Is it worth minting our own scheme (reinterpreting "A" as "Any", with sub-type
  acronyms such as ATDR / AADR)?

Left undefined, the answer drifts per author and per agent. A standard that does not
dogfood its own decision system has no authority - so this record sets the policy and
is itself the first instance of it.

## Decision drivers

- Interoperability + familiarity: engineers and tools (Log4brains, adr-tools) already
  read "ADR" and MADR.
- Low ambiguity for the coding agents that file these records.
- Technical and business decisions have different stakeholders, altitude, lifecycle.
- Avoid bespoke jargon in a repo whose whole purpose is standardization.
- Extend to future decision kinds without re-cutting the taxonomy.

## Options considered

- **A. Single "decision record" umbrella, type by frontmatter** (MADR's "Any Decision
  Record", one folder) - simplest, but over-flattens genuinely different governance.
- **B. MADR format; two streams - ADR (technical, broad) + BDR (business) - sub-scope
  via `Tags`** - keeps the standard acronym, separates concerns, extensible.
- **C. Reinterpret "A" as "Any" and mint sub-type acronyms (ATDR, AADR, ...)** -
  playful, but breaks the universal meaning of "ADR" and adds jargon.

## Decision

**Option B.**

- **Format:** every record uses **MADR** (Markdown Any Decision Records). The "Any" we
  like lives in the format's name - it needs no new acronyms.
- **ADR = an architecturally-significant _technical_ decision, read broadly:**
  framework, library, tooling, infrastructure, data-model or protocol choices - not
  enterprise-architecture-only. The standard acronym is kept; its **definition** is
  widened in the glossary. Sub-scope (`architecture` / `data` / `infra` / `security`
  / ...) goes in the record's existing **`Tags`**, never in the acronym.
- **BDR = a business / product decision** - a separate stream, different stakeholders
  and altitude. Business decisions do not enter the technical log.
- **No TDR stream** (the ADR/TDR line is arbitrary; "living technical design" is
  behaviour in the capability specs + structure in `ARCHITECTURE.md`). Confirms the
  0.3.0 removal.
- **No bespoke sub-type acronyms** (ATDR / AADR / ...): a `Tags` value does the same
  job, filterable, with a stable acronym.
- **Future non-technical kinds** (e.g. marketing) get their own stream when one
  actually arises - same MADR format, not pre-built.

### Consequences

- Positive: standard format + acronym (tooling, familiarity); a clean technical /
  business split; sub-typing without folder or acronym proliferation; the "Any"
  mnemonic is legitimate (it is MADR's name).
- Cost accepted: "ADR" nominally says "Architecture" while we use it for broader
  technical decisions - mitigated by the glossary definition and by the community's
  own MADR "Any" rebrand.
- Follow-ups: MADR-align the record template (add `Confirmation`) - done here; state
  the policy in the decision-records glossary - done here; a record-format lint - not
  yet built.

## Confirmation

Compliance with this ADR is confirmed by:

- the **glossary in [`../README.md`](../README.md)** ("what counts as a decision
  record here"), which defines ADR scope (broad technical), BDR (business), the MADR
  format and `Tags`-as-scope - the authoritative statement this record drives (in
  place);
- every record using the MADR **[`_template.md`](../../standard/docs/decision-records/adr/_template.md)**, which now carries a
  `Confirmation` field (in place);
- **[not yet built]** a lightweight record-format check in CI, analogous to
  `spec-structure.mjs`.

## Revisit when

- A genuine non-technical, non-business decision stream (e.g. marketing) is needed
  often enough to warrant its own home.
- The ADR / MADR convention or its tooling shifts materially in the ecosystem.
- Single-umbrella friction (cross-stream queries, duplicated governance) starts to
  outweigh the split.

## Related

- Confirms the TDR removal from 0.3.0.
- Drives: `decision-records/README.md` (glossary), `decision-records/adr/_template.md`
  (`Confirmation` field).
