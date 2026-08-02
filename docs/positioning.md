# Positioning & messaging - the one source every surface quotes

> Dogfooded messaging discipline. The rule: the landing, the README, a deck, a pitch - they **quote**
> these lines, they never re-phrase them. If a surface needs different words, this file
> changes first (that change is a BDR-grade call). One source; the market hears one
> voice.

## The one-liner

> Others give you a workflow or a scaffold. This gives your repo a reference to true up
> to - and walks it there.

## Positioning statement

For **teams and solo builders who run their repositories with AI agents**, who need
product knowledge - docs, specs, decisions - to stay true instead of scattering across
tools, **repository-standards** is a **living, self-verifying engineering standard**:
point a repo at it and it aligns, guides the build, and proves compliance -
`align -> verify -> drift as a number`.

Unlike SDD workflows (Spec Kit, OpenSpec, BMAD), which standardise **how a change gets
specified**, this standardises **the repository**. Four things follow that none of them
does: the **decisions** behind the code are recorded and kept, an existing repo is walked
into line with **a standard** rather than into a workflow, that standard **keeps moving
and your repo trues up to it**, and how far you still are from it comes out as **a number
your CI asserts**.

The brownfield walk is one of the strongest reasons to use this and it is **not** what
makes it different - the field does brownfield now. What differs is where the walk ends.

## The four messaging pillars

1. **Executable, not aspirational.** A standard written to be *run* by an agent -
   hooks, gates, and a compliance number your CI asserts - not a wall document.
   (Proof: `self-verify`, the clarify gate, the coupling guard.)
2. **The why survives.** Every technical and business decision is recorded where the code
   is, so the next person - or the next agent - inherits the reasoning instead of
   re-litigating it. This is the pillar the rest of the field does not have, and the one
   that pays back latest: a year on, the records are what stops a settled argument
   restarting. (Proof: ADRs and BDRs in-repo, `adr-write` / `bdr-write`, the altitude
   ladder that says which wins.)
3. **One repo, everything coherent.** Code, specs, decisions, product, personas - kept
   together, updated in the same PR, readable by humans and loadable by agents. Proximity
   is the mechanism; coherence is the outcome. (Proof: living docs, same-PR coupling, the
   taxonomy.)
4. **It walks you there.** Greenfield scaffolds and goes; an existing repo is guided in
   prioritized waves, re-entered until drift 0 - hand-holding is the product. Say what
   the walk *ends at*, never that the walk itself is unusual. (Proof: the re-entrant align
   loop with the clarify gate, statuses.)

## Target scenarios (who hears which pillar first)

- **Standard-bearer Staszek** (architect, many repos) - pillar 1: drift as a number
  across a fleet.
- **Spec-first PO Paula** - pillar 4: the loop that walks her from story to
  ready-to-develop without code.
- **Owner Olek** - pillar 1 phrased as assurance: public and checkable, verifiable quality
  he can point at.
- **Buildable-truth Dev Darek** - pillar 3: contracts instead of archaeology.
- **Anyone who has watched a decision get re-argued** - pillar 2, and it needs no persona:
  every engineer has lost that afternoon.

## Usage rule

A surface (landing, README, docs site, deck, post) may **shorten** a pillar, never
**reword** it. New claims start here, not on the surface. The landing and README are
checked against this file at every messaging pass.
