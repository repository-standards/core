# "Proposed" does not mean "maybe" (antipattern)

**Situation.** A personal-brand SaaS in early product discovery: a whole go-to-market
direction on the table - how selling would work, a template marketplace, a membership
module. Exciting, plausible, and **undecided**.

**What happened.** The direction got written up as ADRs and BDRs with status `Proposed`.
It felt diligent - everything documented! But in MADR, `Proposed` means *a decision
awaiting ratification*, not *an idea we might pursue*. The decision log now implied
forks had been reached and taken, when in truth nobody had decided anything. Anyone
reading the records later would inherit commitments that were never made.

**The antipattern.** *Dressing speculation as records.* It pollutes the decision log's
one job - being an honest ledger of forks actually taken - and it is worse than writing
nothing, because it carries false authority.

**What the standard does about it.** A first-class **ideas space**
(`docs/ideas/<slug>.md`) where a maybe is explored end-to-end - business and technical
shape included - with its own statuses (`idea -> exploring -> approved | parked |
dropped`). **No ADR/BDR/spec is minted until the idea is approved**; on approval it
*graduates* into the normal flow and the idea doc links what it became.

**Where it lives now.** [`standard/docs/ideas/`](../tree/docs-ideas.md), the taxonomy's
"Ideas / discovery before a decision" section, ADR-010 (the lifecycle),
the records README rule "not a record until approved".
